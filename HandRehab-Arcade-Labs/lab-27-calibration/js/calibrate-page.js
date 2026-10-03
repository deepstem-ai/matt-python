// ============================================================
// calibrate-page.js — วิซาร์ดปรับเทียบ 4 ขั้น (Lab 27)
//   1 อธิบาย + เวลา  2 ถือมือนิ่ง 5 วิ → วัดอาการสั่น  3 ดูท่าตัวอย่าง แล้วทำเต็มแรง 5 ครั้ง  4 ผลลัพธ์ + ลองเลย
// ============================================================
import { applyPrefs, esc, toast, modal } from './ui.js';
import { updateUser, getCurrentUserId } from './db.js';
import { RepCounter } from './rep-counter.js';
import { GESTURES, TREMOR_LEVELS, STILL_SEC, REPS_NEEDED, classifyTremor, tremorFromSamples, median, PeakTracker, buildRecord, saveCalibration, loadCalibration, scoreFromMeasure, setCalibrationLock, THETA_ON, THETA_OFF } from './calibration.js';
import { CalibInput, animateGesture } from './calib-input.js';
import { mountUserPicker, currentUid } from './user-picker.js';

applyPrefs();
const $ = (id) => document.getElementById(id);
const panel = $('panel');
const input = new CalibInput({ video: $('video'), handCanvas: $('handCanvas'), demoCanvas: $('demoView') });
$('demoView').width = 400; $('demoView').height = 400;
let step = 0, handler = null, G = GESTURES.pinch, gestureKey = 'pinch';
const S = {};                                             // ผลของแต่ละขั้น
input.onFrame = (t, sq) => {
  const m = sq ? G.measure(sq) : null;
  $('liveInfo').textContent = sq ? `${G.th}: ${m.toFixed(G.dec)} ${G.unit}` : '✋ ยังไม่เห็นมือ — ยกมือให้อยู่กลางภาพ';
  handler?.(t, sq, m);
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
function show(n, html) {
  step = n; handler = null; panel.innerHTML = html;
  document.querySelectorAll('.steps span').forEach((s) => { const k = +s.dataset.step; s.className = k === n ? 'on' : k < n ? 'done' : ''; });
}
const btn = (id, label, cls = '') => `<button id="${id}" class="btn-glow ${cls}">${label}</button>`;

// ---------- ตรึงเกณฑ์ (freeze thresholds) — กฎการวัดผลในบทความ ----------
// ใช้ระบบเพื่อ "วัดผล" ต้องตรึงเกณฑ์ไว้ ผลของแต่ละวันจึงเทียบกันได้ ปรับเทียบใหม่ได้ต่อเมื่อยืนยันปลดล็อก
async function savedRecord() { try { return await loadCalibration(currentUid(), gestureKey); } catch { return null; } }
const lockNote = (c) => c.locked
  ? `🔒 ตรึงเกณฑ์อยู่ตั้งแต่ ${new Date(c.lockedAt || c.at).toLocaleString('th-TH')} — ทุกเซสชันใช้เกณฑ์ชุดนี้`
  : '🔓 ยังไม่ตรึง — ถ้าจะใช้วัดผลวิจัย (เทียบข้ามวัน) ให้เปิดสวิตช์นี้';
// ถามยืนยันก่อนปลดล็อก คืน true = ปลดแล้ว (หรือไม่ได้ล็อกอยู่)
async function confirmUnlock(c) {
  if (!c?.locked) return true;
  const yes = await modal(`<h2>🔒 เกณฑ์ของ${esc(G.th)}ถูกตรึงไว้</h2>
    <p>ผู้เล่นนี้ใช้เกณฑ์ชุดนี้สำหรับวัดผลอยู่ ถ้าปลดล็อกและปรับเทียบใหม่ ผลของวันก่อน ๆ กับวันต่อไปจะใช้เกณฑ์ต่างกัน</p>
    <p class="muted">Thresholds are frozen for measurement. Unlock only if the researcher agrees.</p>`,
    [{ label: 'ยกเลิก', value: false, cls: 'ghost' }, { label: '🔓 ยืนยันปลดล็อก', value: true, cls: 'danger' }]);
  if (!yes) return false;
  try { await setCalibrationLock(c, false); toast('ปลดการตรึงเกณฑ์แล้ว', 'warning', 3); return true; }
  catch (e) { toast('ปลดล็อกไม่สำเร็จ: ' + e.message, 'error', 5); return false; }
}
// วาดสวิตช์ตรึงเกณฑ์ลงในกล่อง box สำหรับระเบียน c (onChange เรียกหลังเปลี่ยน)
function lockSwitch(box, c, onChange) {
  if (!box) return;
  if (!c) { box.innerHTML = `<p class="muted">ยังไม่มีค่าปรับเทียบ${esc(G.th)}ของผู้เล่นนี้ — ปรับเทียบก่อน แล้วจึงตรึงเกณฑ์ได้</p>`; return; }
  box.innerHTML = `<label class="switch"><input type="checkbox" id="${box.id}Chk" ${c.locked ? 'checked' : ''}> <b>ตรึงเกณฑ์</b> (freeze thresholds)</label>
    <p class="muted" id="${box.id}Note">${lockNote(c)}</p>`;
  $(box.id + 'Chk').onchange = async (e) => {
    const want = e.target.checked;
    if (!want && !(await confirmUnlock(c))) { e.target.checked = true; return; }
    if (want) {
      try { await setCalibrationLock(c, true); toast('🔒 ตรึงเกณฑ์แล้ว', 'success', 3); }
      catch (err) { e.target.checked = false; toast('ตรึงไม่สำเร็จ: ' + err.message, 'error', 5); }
    }
    $(box.id + 'Note').textContent = lockNote(c);
    onChange?.(c);
  };
}
async function renderLock() { const c = await savedRecord(); if (step === 1) lockSwitch($('lockBox'), c); }

// ---------- ขั้น 1: อธิบาย ----------
function step1() {
  show(1, `<h2>ขั้นที่ 1 · เตรียมตัว (ใช้เวลาประมาณ 1 นาที)</h2>
    <p>ระบบจะเรียนรู้ "มือของคุณ" เพื่อให้เกมพอดีกับคุณ ไม่ยากหรือง่ายเกินไป</p>
    <ol><li>ถือมือนิ่ง ๆ ${STILL_SEC} วินาที เพื่อวัดอาการสั่น</li><li>ดูท่าตัวอย่าง แล้วทำท่าเต็มแรง ${REPS_NEEDED} ครั้ง</li><li>ดูผลและลองเล่นทันที</li></ol>
    <fieldset class="row" style="border:0;padding:0"><legend>เลือกท่าที่จะปรับเทียบ</legend>
      ${Object.entries(GESTURES).map(([k, g]) => `<label class="choice"><input type="radio" name="g" value="${k}" ${k === gestureKey ? 'checked' : ''}> ${g.icon} ${g.th}</label>`).join('')}</fieldset>
    <p class="muted">นั่งห่างกล้องประมาณ 50 ซม. แสงสว่างพอ หันฝ่ามือเข้ากล้อง</p>
    <div id="lockBox" class="lock-box"></div>
    <div class="row">${btn('camGo', '📷 เริ่มด้วยกล้อง')}${btn('demoGo', '🖐 โหมดสาธิต (มือจำลอง)', 'ghost')}</div>`);
  const pick = () => { gestureKey = panel.querySelector('input[name=g]:checked').value; G = GESTURES[gestureKey]; input.gesture = gestureKey; };
  panel.querySelectorAll('input[name=g]').forEach((r) => { r.onchange = () => { pick(); renderLock(); }; });
  renderLock();
  // ก่อนปรับเทียบใหม่: ถ้าเกณฑ์ถูกตรึงไว้ ต้องยืนยันปลดล็อกก่อน
  const mayStart = async () => { pick(); return confirmUnlock(await savedRecord()); };
  $('camGo').onclick = async () => {
    if (!(await mayStart())) return renderLock();
    $('camGo').disabled = true; $('camGo').textContent = '⏳ กำลังเปิดกล้องและโหลดโมเดล…';
    try { await input.startCamera(); setView('hand'); step2(); }
    catch (e) {
      show(1, `<div class="alert"><h2>⚠️ ${esc(e.message)}</h2><p>${esc(e.detail || '')}</p></div><div class="row" style="margin-top:12px">${btn('retry', '↻ ลองอีกครั้ง')}${btn('demoGo2', '🖐 ใช้โหมดสาธิต', 'ghost')}</div>`);
      $('retry').onclick = step1; $('demoGo2').onclick = () => { input.useDemo(); setView('demo'); step2(); };
    }
  };
  $('demoGo').onclick = async () => { if (!(await mayStart())) return renderLock(); input.useDemo(); setView('demo'); step2(); };
}
function setView(src) {
  $('camBox').classList.toggle('hidden', src !== 'hand');
  ['demoView', 'demoCtl', 'srcBadge'].forEach((id) => $(id).classList.toggle('hidden', src !== 'demo'));
}

// ---------- ขั้น 2: ถือนิ่ง → อาการสั่น + ค่าพัก (rest) ----------
function step2() {
  show(2, `<h2>ขั้นที่ 2 · ถือมือนิ่ง ${STILL_SEC} วินาที</h2>
    <p>วางศอกบนโต๊ะ ${gestureKey === 'pinch' ? 'แบมือสบาย ๆ' : 'นิ้วชิดกันสบาย ๆ'} หันฝ่ามือเข้ากล้อง แล้ว <b>ถือนิ่งที่สุดเท่าที่ทำได้</b></p>
    <p class="big-count" id="count">พร้อม?</p><div class="bar"><i id="prog"></i></div>
    <p id="tremorNow" class="muted num"></p><div class="row">${btn('go', '✔ พร้อมแล้ว เริ่มวัด', 'success')}</div>`);
  $('go').onclick = async () => {
    $('go').disabled = true;
    for (let k = 3; k >= 1; k--) { $('count').textContent = `เริ่มใน ${k}…`; await wait(700); }
    const samples = [], measures = [], t0 = performance.now() / 1000;
    handler = (t, sq, m) => {
      const el = t - t0;
      if (sq) { samples.push({ t, sq }); measures.push(m); }
      $('count').textContent = `${Math.max(0, STILL_SEC - el).toFixed(1)} วิ`;
      $('prog').style.width = Math.min(100, (el / STILL_SEC) * 100) + '%';
      if (samples.length > 10 && samples.length % 10 === 0) $('tremorNow').textContent = `ความสั่นตอนนี้ ${tremorFromSamples(samples).toFixed(4)}`;
      if (el >= STILL_SEC) {
        handler = null;
        const sd = tremorFromSamples(samples);
        if (sd === null) return fail2('กล้องมองไม่เห็นมือระหว่างวัด ให้มืออยู่กลางภาพและมีแสงพอ แล้วลองใหม่');
        Object.assign(S, { tremorSd: sd, rest: median(measures), stillN: samples.length });
        step3();
      }
    };
  };
}
function fail2(msg) { panel.insertAdjacentHTML('beforeend', `<div class="alert warn" style="margin-top:12px"><p>${esc(msg)}</p></div>`); $('go').disabled = false; $('go').textContent = '↻ วัดใหม่'; }

// ---------- ขั้น 3: ดูท่าตัวอย่าง แล้วทำเต็มแรง 5 ครั้ง ----------
function step3() {
  const lv = classifyTremor(S.tremorSd);
  show(3, `<h2>ขั้นที่ 3 · ${G.icon} ${G.th} เต็มแรง ${REPS_NEEDED} ครั้ง</h2>
    <p>อาการสั่นที่วัดได้: <span class="tremor-badge lv${lv.lv}">${lv.th}</span></p>
    <div class="row" style="align-items:flex-start"><canvas id="anim" class="demo-hand" style="max-width:220px" aria-label="แอนิเมชันท่าตัวอย่าง"></canvas>
      <div class="col" style="flex:1"><p>ดูตัวอย่างทางซ้าย: <b>${G.how}</b> ทำช้า ๆ ให้สุดเท่าที่ทำได้โดยไม่เจ็บ</p>
        <p class="big-count"><span id="reps">0</span> / ${REPS_NEEDED}</p><p id="peakInfo" class="muted num"></p></div></div>
    <div class="row">${btn('manual', '✔ นับครั้งนี้ (ทำได้ไม่ถึงเกณฑ์ตรวจจับ)', 'ghost small')}${input.source === 'demo' ? btn('auto', '▶ ให้มือจำลองทำให้ดู', 'small') : ''}</div>`);
  animateGesture($('anim'), gestureKey, () => step === 3);
  const tr = new PeakTracker(S.rest, G.expectBest);
  let recent = [];
  const done = () => { S.peaks = tr.peaks.slice(0, REPS_NEEDED); step4(); };
  const counted = (pk) => { recent = []; $('reps').textContent = tr.peaks.length; $('peakInfo').textContent = `ครั้งล่าสุด ${pk.toFixed(G.dec)} ${G.unit}`; if (tr.peaks.length >= REPS_NEEDED) done(); };
  handler = (t, sq, m) => { if (m === null) return; recent.push(m); if (recent.length > 90) recent.shift(); const pk = tr.update(m); if (pk !== null) counted(pk); };
  $('manual').onclick = () => { if (recent.length) counted(tr.forceCount(recent)); };
  if ($('auto')) $('auto').onclick = () => input.autoReps(REPS_NEEDED + 1);
}

// ---------- ขั้น 4: ผลลัพธ์ + บันทึก + ลองเลย ----------
async function step4() {
  const uid = currentUid();
  const rec = buildRecord({ userId: uid, gesture: gestureKey, rest: S.rest, peaks: S.peaks, tremorSd: S.tremorSd, source: input.source });
  const lv = TREMOR_LEVELS[rec.tremorLevel], f = (v) => v.toFixed(G.dec);
  show(4, `<h2>ขั้นที่ 4 · ผลการปรับเทียบ ${G.icon} ${G.th}</h2>
    <p>อาการสั่น: <span class="tremor-badge lv${lv.lv}">ระดับ ${lv.lv} · ${lv.th}</span> <span class="muted num">(SD ${rec.tremorSd.toFixed(4)} × ขนาดฝ่ามือ)</span></p>
    <table class="data"><tr><th>ค่า</th><th>${G.unit}</th></tr>
      <tr><td>ตอนพัก (rest)</td><td class="num">${f(rec.rest)}</td></tr><tr><td>ดีที่สุด (best, เฉลี่ย 3 ใน 5)</td><td class="num">${f(rec.best)}</td></tr>
      <tr><td>เกณฑ์เริ่มท่า entry = rest − 0.7×(rest − best)</td><td class="num good">${f(rec.entry)}</td></tr>
      <tr><td>เกณฑ์ปล่อยท่า exit = rest − 0.3×(rest − best)</td><td class="num">${f(rec.exit)}</td></tr></table>
    <label>รัศมีการจับในเกม <b id="grV" class="num">${rec.grabRadius}</b> px <input id="gr" type="range" min="40" max="150" step="5" value="${rec.grabRadius}"></label>
    <label>ความนิ่งของตัวชี้ (minCutoff ยิ่งน้อยยิ่งนิ่ง) <b id="mcV" class="num">${rec.filter.minCutoff}</b> Hz <input id="mc" type="range" min="0.1" max="3" step="0.1" value="${rec.filter.minCutoff}"></label>
    <p class="muted">คะแนน π = clip((rest − ค่า)/(rest − best)) ตามสมการ (3) · นับเมื่อ π ≥ θ_on = ${THETA_ON} และปล่อยเมื่อ π ≤ θ_off = ${THETA_OFF} (สมการ 7, 8)</p>
    <div id="lockBox4" class="lock-box"></div>
    <h3>ลองเลย: ทำท่าแล้วดูแถบ (เขียว = entry, เหลือง = exit)</h3>
    <div class="meter"><i id="meterBar"></i><span class="mark exit" style="left:30%"></span><span class="mark enter" style="left:70%"></span></div>
    <p>นับได้ <b id="tryCount" class="num">0</b> ครั้ง <span id="saveMsg" class="muted"></span></p>
    <div class="row">${btn('play', '▶ ลองเล่นจับดาวเลย', 'success')}${btn('again', '↻ ปรับเทียบใหม่', 'ghost')}</div>`);
  const save = async () => {
    try { await saveCalibration(rec); $('saveMsg').textContent = `💾 บันทึกแล้ว (id ${rec.id})`; }
    catch (e) { $('saveMsg').textContent = '⚠️ บันทึกไม่สำเร็จ: ' + e.message; toast('บันทึกไม่สำเร็จ ใช้ค่านี้ชั่วคราวได้', 'error', 5); }
  };
  await save();
  // ตรึงเกณฑ์ได้ทันทีหลังปรับเทียบ — ระหว่างตรึง ห้ามแก้รัศมี/ตัวกรองด้วย (ให้ทุกวันเหมือนกัน)
  const syncLock = () => { $('gr').disabled = $('mc').disabled = !!rec.locked; };
  lockSwitch($('lockBox4'), rec, syncLock);
  const realUser = getCurrentUserId();
  if (realUser) updateUser(realUser, { tremor: rec.tremorLevel }).catch(() => {});   // จำระดับสั่นไว้ในข้อมูลผู้ใช้ด้วย
  syncLock();
  $('gr').oninput = (e) => { rec.grabRadius = +e.target.value; $('grV').textContent = rec.grabRadius; save(); };
  $('mc').oninput = (e) => { rec.filter.minCutoff = +e.target.value; $('mcV').textContent = rec.filter.minCutoff; save(); };
  const counter = new RepCounter({ enter: THETA_ON, exit: THETA_OFF, minHoldMs: 80, cooldownMs: 400 }); // สมการ (7)
  handler = (t, sq, m) => {
    if (m === null) return;
    const p = Math.max(0, Math.min(1, (m - rec.rest) / (rec.best - rec.rest || 1)));   // 0 = พัก, 1 = ดีที่สุด
    $('meterBar').style.width = (p * 100).toFixed(1) + '%';
    if (counter.update(scoreFromMeasure(m, rec), t * 1000)) $('tryCount').textContent = counter.count;
  };
  $('play').onclick = () => { location.href = 'index.html'; };
  $('again').onclick = step1;   // ขั้น 1 จะถามยืนยันปลดล็อกก่อน ถ้าเกณฑ์ถูกตรึงไว้
  window.__calResult = rec;
}

// ---------- ปุ่มสาธิต: กดค้าง/Space = ทำท่า ----------
const press = (v) => { input.demo.press = v; };
$('holdBtn').addEventListener('pointerdown', () => press(true));
['pointerup', 'pointerleave'].forEach((e) => $('holdBtn').addEventListener(e, () => press(false)));
window.addEventListener('keydown', (e) => { if (e.code === 'Space' && input.source === 'demo') { e.preventDefault(); press(true); } });
window.addEventListener('keyup', (e) => { if (e.code === 'Space') press(false); });
$('demoTremor').onchange = (e) => { input.demo.tremorLevel = +e.target.value; };

mountUserPicker($('picker'), async (uid) => {
  const c = await loadCalibration(uid, gestureKey);
  toast(c ? `ผู้เล่นนี้เคยปรับเทียบ${G.th}แล้ว (ระดับสั่น ${c.tremorLevel})${c.locked ? ' · 🔒 ตรึงเกณฑ์อยู่' : ' ปรับใหม่ได้เลย'}` : 'ผู้เล่นนี้ยังไม่เคยปรับเทียบ', 'success', 3);
  if (step === 1) renderLock();
});
step1();
window.__cal = { input, S, step: () => step };
