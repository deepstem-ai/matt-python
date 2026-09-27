// ============================================================
// train.js — หน้า "สอน AI" (Lab 31): เก็บตัวอย่าง → ดูจำนวน → ทดสอบ → ส่งออกโมเดล
// ============================================================
import { applyPrefs, toast, esc, modal, downloadText } from './ui.js';
import { KNNClassifier, extractFeatures } from './ml.js';
import { createHandSource } from './hand-source.js';
import { PRESETS } from './synth-hand.js';

applyPrefs();
const $ = (id) => document.getElementById(id);
const TARGET = 30;      // เก็บครั้งละ 30 ตัวอย่าง
const MIN_OK = 20;      // น้อยกว่า 20 ตัวอย่าง = เตือน
const GAP_MS = 100;     // เก็บตัวอย่างทุก 0.1 วินาที (3 วินาทีได้ครบ 30 ตัว ทันให้หมุนมือหลายมุม)

const model = new KNNClassifier();
const src = createHandSource({ video: $('video'), canvas: $('overlay'), onStatus: (t) => ($('stageMsg').textContent = t) });
let pts = null;                                // จุดมือของเฟรมล่าสุด
let collecting = false, got = 0, lastAdd = 0;

// ---------- โหลดโมเดลเดิมจากฐานข้อมูล ----------
try { await model.load(); } catch (e) { toast('เปิดฐานข้อมูลไม่ได้: ' + e.message + ' (ยังใช้งานต่อได้ แต่จะไม่ถูกบันทึก)', 'error', 6); }
renderList();

async function persist() {
  try { await model.save(); $('modelInfo').textContent = `บันทึกในเครื่องแล้ว · ทั้งหมด ${model.size} ตัวอย่าง · ${new Date().toLocaleTimeString('th-TH')}`; }
  catch (e) { toast('บันทึกไม่สำเร็จ: ' + e.message, 'error'); }
}

// ---------- รายการท่า + จำนวนตัวอย่าง + ปุ่มลบ ----------
function renderList() {
  const c = model.counts();
  const names = Object.keys(c);
  $('gestList').innerHTML = names.length ? names.map((n) => `<li class="${c[n] < MIN_OK ? 'low' : ''}">
      <span class="gname">${esc(n)}</span><span class="chip ${c[n] < MIN_OK ? 'warn' : 'ok'}"><b>${c[n]}</b> ตัวอย่าง</span>
      ${c[n] < MIN_OK ? `<span class="warn">⚠️ น้อยเกินไป ควรมี ≥ ${MIN_OK}</span>` : ''}
      <button class="btn-glow small danger" data-del="${esc(n)}" aria-label="ลบท่า ${esc(n)}">🗑️</button></li>`).join('')
    : '<li class="muted">ยังไม่มีท่า — พิมพ์ชื่อท่า แล้วกดค้างปุ่มสีเขียว</li>';
  if (names.length === 1) $('gestList').insertAdjacentHTML('beforeend', '<li class="muted">ต้องมีอย่างน้อย 2 ท่า AI ถึงจะมีตัวเลือกให้ทาย</li>');
  $('modelInfo').textContent ||= `ทั้งหมด ${model.size} ตัวอย่าง`;
}
$('gestList').onclick = async (e) => {
  const n = e.target.closest('[data-del]')?.dataset.del; if (!n) return;
  if (!(await modal(`<h3>ลบท่า "${esc(n)}" ?</h3><p>ตัวอย่างทั้งหมดของท่านี้จะหายไป</p>`, [{ label: 'ยกเลิก', value: false, cls: 'ghost' }, { label: 'ลบ', value: true, cls: 'danger' }]))) return;
  model.clear(n); await persist(); renderList(); toast(`ลบท่า "${n}" แล้ว`);
};

// ---------- ปุ่มกดค้างเพื่อเก็บตัวอย่าง ----------
function startCollect() {
  const name = $('name').value.trim();
  if (!name) { toast('พิมพ์ชื่อท่าก่อนนะ', 'warning'); $('name').focus(); return; }
  if (src.mode === 'none') { toast('เปิดกล้องหรือโหมดสาธิตก่อน', 'warning'); return; }
  collecting = true; got = 0; $('btnHold').classList.add('active');
}
async function stopCollect() {
  if (!collecting) return;
  collecting = false; $('btnHold').classList.remove('active');
  $('collectMsg').textContent = got >= TARGET ? `เก็บครบ ${got} ตัวอย่างแล้ว ✅` : `ปล่อยปุ่มก่อนครบ ได้ ${got}/${TARGET} (กดค้างต่อเพื่อเก็บเพิ่มได้)`;
  if (got) { await persist(); renderList(); }
}
const hold = $('btnHold');
hold.addEventListener('pointerdown', (e) => { hold.setPointerCapture(e.pointerId); startCollect(); });
['pointerup', 'pointercancel', 'lostpointercapture'].forEach((ev) => hold.addEventListener(ev, stopCollect));
hold.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); startCollect(); } });
hold.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') stopCollect(); });

function collectStep(now) {
  if (!collecting || now - lastAdd < GAP_MS) return;
  if (!pts) { $('collectMsg').textContent = '👀 ไม่เห็นมือ — ยกมือให้อยู่ในกรอบ'; return; }
  model.addExample(extractFeatures(pts), $('name').value);
  got++; lastAdd = now;
  $('collectBar').style.width = (100 * got) / TARGET + '%';
  $('collectMsg').textContent = `กำลังเก็บ ${got}/${TARGET} — หมุนมือช้า ๆ`;
  if (got >= TARGET) stopCollect();
}

// ---------- โหมดทดสอบ: ทาย + ความมั่นใจ + เพื่อนบ้าน 5 ตัว ----------
function testStep() {
  if (!$('testMode').checked) return;
  if (!pts || !model.size) { $('guess').textContent = !model.size ? 'ยังไม่มีตัวอย่าง' : 'ไม่เห็นมือ'; setConf(0); $('neigh').innerHTML = ''; return; }
  const r = model.predict(extractFeatures(pts), +$('kSel').value);
  $('guess').textContent = r.label;
  setConf(r.confidence);
  $('neigh').innerHTML = model.predict(extractFeatures(pts), Math.max(5, +$('kSel').value)).neighbours.slice(0, 5)
    .map((n, i) => `<li class="${n.label === r.label ? 'win' : ''}">${esc(n.label)} — ระยะ <span class="num">${n.distance.toFixed(3)}</span>${i < +$('kSel').value ? ' (ร่วมโหวต)' : ''}</li>`).join('');
}
function setConf(c) { $('confBar').style.width = c * 100 + '%'; $('confTxt').textContent = Math.round(c * 100) + '%'; }

// ---------- วงรอบหลัก ----------
function loop(now) {
  pts = src.frame(now);
  $('handChip').textContent = src.mode === 'none' ? '-' : pts ? 'เจอ' : 'ไม่เจอ';
  collectStep(now);
  testStep();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// ---------- กล้อง / โหมดสาธิต ----------
$('btnCam').onclick = async () => {
  $('camError').innerHTML = '';
  try { await src.startCamera(); $('srcChip').textContent = '📷 กล้องจริง'; $('demoBox').classList.add('hidden'); }
  catch (e) {
    $('camError').innerHTML = `<div class="alert"><b>${esc(e.title || e.message)}</b><p>${esc(e.detail || '')}</p>
      <div class="row"><button class="btn-glow small" id="retry">🔄 ลองใหม่</button><button class="btn-glow small ghost" id="toDemo">🤖 ใช้โหมดสาธิตแทน</button></div></div>`;
    $('retry').onclick = () => $('btnCam').click(); $('toDemo').onclick = () => $('btnDemo').click();
  }
};
$('btnDemo').onclick = () => {
  src.startDemo(); $('camError').innerHTML = '';
  $('srcChip').textContent = '🤖 โหมดสาธิต (มือจำลอง)'; $('demoBox').classList.remove('hidden');
  if (!$('name').value) $('name').value = src.preset;
  renderPresets();
};
function renderPresets() {
  $('presetRow').innerHTML = Object.keys(PRESETS).map((p) => `<button class="btn-glow small ghost preset ${p === src.preset ? 'on' : ''}" data-p="${esc(p)}">${esc(p)}</button>`).join('');
}
$('presetRow').onclick = (e) => { const p = e.target.closest('[data-p]')?.dataset.p; if (p) { src.setPreset(p); $('name').value = p; renderPresets(); } };

// ---------- ส่งออก / นำเข้า / ลบทั้งหมด ----------
$('btnExport').onclick = () => {
  if (!model.size) return toast('ยังไม่มีตัวอย่างให้ส่งออก', 'warning');
  downloadText(`knn-model-${new Date().toISOString().slice(0, 10)}.json`, model.exportJSON(), 'application/json');
};
$('btnImport').onclick = () => $('fileIn').click();
$('fileIn').onchange = async (e) => {
  const f = e.target.files[0]; if (!f) return;
  try { model.importJSON(await f.text()); await persist(); renderList(); toast(`นำเข้าแล้ว ${model.size} ตัวอย่าง`); }
  catch (err) { toast('นำเข้าไม่สำเร็จ: ' + err.message, 'error', 6); }
  e.target.value = '';
};
$('btnClearAll').onclick = async () => {
  if (!(await modal('<h3>ลบทุกท่า?</h3><p>แนะนำให้กด "ส่งออกโมเดล" เก็บไว้ก่อน</p>', [{ label: 'ยกเลิก', value: false, cls: 'ghost' }, { label: 'ลบทั้งหมด', value: true, cls: 'danger' }]))) return;
  model.clear(); await persist(); renderList();
};

// ปิดกล้องเมื่อออกจากหน้า
window.addEventListener('pagehide', () => src.stop());

// สำหรับทดสอบอัตโนมัติ: สอนท่าจำลองโดยไม่ต้องกดปุ่มจริง
window.__lab = {
  model, src,
  async teach(preset, n = TARGET) { src.setPreset(preset); for (let i = 0; i < n; i++) { model.addExample(extractFeatures(src.sample()), preset); } await persist(); renderList(); },
};
