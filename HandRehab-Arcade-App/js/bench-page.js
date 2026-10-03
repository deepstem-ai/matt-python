// ============================================================
// bench-page.js — ตัวควบคุมหน้าทดสอบความลื่น (Lab 33)
// ขั้นตอน: ตรวจสเปก → เปิดกล้อง → โหลดโมเดล → รัน 6 สถานการณ์ → การ์ดผล → คำแนะนำ → บันทึก → กราฟเทียบ
// โหมดเร็วสำหรับทดสอบโค้ด: index.html?quick=1 (สถานการณ์ละ 2 วินาที) หรือ ?sec=5
// ============================================================
import { detectDeviceWithOverride } from './device-info.js';
import { SCENARIOS, runScenario, fpsLevel } from './bench-runner.js';
import { recommend, toPrefs, STYLE_TH, RES_TH, EFFECTS_TH, TARGET_FPS, keyFps } from './recommend.js';
import { firstRunCheck } from './first-run.js';
import { bindCompare, drawCompare } from './bench-compare.js';
import { startCamera, stopCamera, cameraErrorMessage } from './camera.js';
import { initVision } from './vision.js';
import { initHand } from './hand.js';
import { put, newId } from './db.js';
import { applyPrefs, loadPrefs, savePrefs, modal, toast, esc } from './ui.js';

applyPrefs();
const $ = (id) => document.getElementById(id);
const q = new URLSearchParams(location.search);
const SECONDS = q.has('quick') ? 2 : Math.max(1, +q.get('sec') || 10);
const RES = { width: 640, height: 480 };
const NAME_KEY = 'hr-machine-name';
const device = detectDeviceWithOverride();
let stopFlag = false, running = false, lastReco = null;

// ---------- แสดงสเปก ----------
$('tier').textContent = device.tierTh; $('tier').className = 'tier ' + device.tier;
$('spec').innerHTML = device.reasons.map((r) => `<li>${esc(r)}</li>`).join('') + `<li>คะแนนรวม <b class="num">${device.score}</b> / 6 · จอ ${esc(device.screen)}</li>`;
$('gpu').textContent = 'การ์ดจอ: ' + (device.gpuRenderer || '—');
$('secs').textContent = SECONDS;
$('total').textContent = Math.max(1, Math.round((SECONDS * 1.1 * SCENARIOS.length + 15) / 60));
try { $('machine').value = localStorage.getItem(NAME_KEY) || ''; } catch { /* ไม่เป็นไร */ }
if (document.body.dataset.back) $('backSlot').innerHTML = `<a class="btn-glow ghost small" href="${esc(document.body.dataset.back)}">↩ กลับ</a>`;

// ---------- รายการสถานการณ์ + แถบความคืบหน้า ----------
$('scList').innerHTML = SCENARIOS.map((s) => `<li id="sc-${s.key}"><span>${s.icon}</span><div><div>${s.th}</div><div class="bar"><i style="width:0%"></i></div></div><span class="st">รอ</span></li>`).join('');
function setRow(key, frac, text, cls) {
  const li = $('sc-' + key);
  li.querySelector('i').style.width = Math.round(frac * 100) + '%';
  if (text !== undefined) li.querySelector('.st').textContent = text;
  if (cls !== undefined) li.className = cls;
}

function showPrefs() {
  const p = loadPrefs();
  $('prefsNow').textContent = `ค่าที่ใช้อยู่ตอนนี้: สไตล์ ${p.handStyle || 'neon'} · ความละเอียด ${p.resolution || '640x480 (ค่าเริ่มต้น)'} · เอฟเฟกต์ ${p.effects || 'full (ค่าเริ่มต้น)'}`;
}
showPrefs();

// ---------- เตรียมกล้องและโมเดล (คืน set ของสิ่งที่พร้อม) ----------
async function prepare() {
  const ready = new Set();
  $('errBox').classList.add('hidden');
  $('stageNote').textContent = '📷 กำลังเปิดกล้อง…';
  try { await startCamera($('video'), undefined, RES); ready.add('camera'); }
  catch (err) {
    const m = cameraErrorMessage(err);
    const go = await modal(`<h2>⚠️ ${esc(m.title)}</h2><p>${esc(m.detail)}</p><p>ทดสอบต่อได้โดยไม่มีกล้อง: จะวัดได้เฉพาะ "เกมเต็ม" ด้วยมือตัวอย่าง</p>`,
      [{ label: '↻ ลองเปิดกล้องอีกครั้ง', value: 'retry' }, { label: 'ทดสอบต่อโดยไม่มีกล้อง', value: 'go', cls: 'ghost' }, { label: 'ยกเลิก', value: 'cancel', cls: 'ghost' }]);
    if (go === 'retry') return prepare();
    if (go === 'cancel') return null;
    return ready;
  }
  const load = async (key, th, fn) => {
    $('stageNote').textContent = `🧠 กำลังโหลดโมเดล${th}…`;
    try { await fn((f) => { $('stageNote').textContent = `🧠 กำลังโหลดโมเดล${th}… ${Math.round(f * 100)}%`; }); ready.add(key); }
    catch (e) { console.warn('[bench] โหลดโมเดลไม่ได้', key, e); toast(`โหลดโมเดล${th}ไม่ได้ จะข้ามสถานการณ์ที่ใช้โมเดลนี้`, 'warning', 5); }
  };
  await load('face', 'ใบหน้า', (p) => initVision({ onProgress: p }));
  await load('hand', 'มือ', (p) => initHand({ numHands: 1, onProgress: p }));
  return ready;
}

// ---------- รันทั้งหมด ----------
async function runAll() {
  const name = $('machine').value.trim();
  if (!name) { toast('ตั้งชื่อเครื่องก่อน เพื่อใช้เปรียบเทียบภายหลัง', 'warning'); $('machine').focus(); return; }
  try { localStorage.setItem(NAME_KEY, name); } catch { /* ไม่เป็นไร */ }
  running = true; stopFlag = false;
  $('btnStart').disabled = true; $('btnStop').classList.remove('hidden');
  SCENARIOS.forEach((s) => setRow(s.key, 0, 'รอ', ''));
  const results = {};
  try {
    const ready = await prepare();
    if (!ready) return;
    for (const sc of SCENARIOS) {
      if (stopFlag) break;
      const missing = sc.key === 'game' ? [] : sc.needs.filter((n) => !ready.has(n));
      if (missing.length) { results[sc.key] = { skipped: true, reason: 'ขาด ' + missing.join(', ') }; setRow(sc.key, 1, 'ข้าม', 'skipped'); continue; }
      setRow(sc.key, 0, '0%', 'running');
      $('stageNote').textContent = `กำลังทดสอบ: ${sc.icon} ${sc.th} (${SECONDS} วินาที)`;
      results[sc.key] = await runScenario(sc, {
        video: $('video'), overlay: $('overlay'), gameCanvas: $('gameCanvas'), seconds: SECONDS,
        onProgress: (f) => setRow(sc.key, f, Math.round(f * 100) + '%'),
        setView: (v) => { $('gameCanvas').classList.toggle('hidden', v !== 'game'); $('video').classList.toggle('hidden', v === 'game'); },
      });
      if (!ready.has('hand') && sc.key === 'game') results.game.noAi = true;
      setRow(sc.key, 1, results[sc.key].avgFps + ' fps', '');
      renderCards(results);
    }
    if (stopFlag) { $('stageNote').textContent = '⏹ หยุดแล้ว ผลที่ได้ยังไม่ครบ จึงไม่บันทึก'; return; }
    await finish(name, results);
  } catch (e) {
    console.error('[bench]', e);
    $('errBox').innerHTML = `<b>ทดสอบไม่สำเร็จ</b><p>${esc(e.message)}</p><button class="btn-glow" id="btnRetry">↻ ลองใหม่</button>`;
    $('errBox').classList.remove('hidden'); $('btnRetry').onclick = runAll;
  } finally {
    running = false; stopCamera();
    $('btnStart').disabled = false; $('btnStop').classList.add('hidden');
    $('gameCanvas').classList.add('hidden'); $('video').classList.remove('hidden');
  }
}

// ---------- การ์ดผลลัพธ์ + ป้าย PASS/FAIL เทียบเป้าหมาย 25 FPS (บทความ §6.2) ----------
const badge = (fps) => (fps >= TARGET_FPS ? `<span class="fps-badge pass">PASS ≥ ${TARGET_FPS}</span>` : `<span class="fps-badge fail">FAIL &lt; ${TARGET_FPS}</span>`);
function renderOverall(results) {
  const done = SCENARIOS.filter((s) => results[s.key] && !results[s.key].skipped);
  if (!done.length) return;
  const nPass = done.filter((s) => results[s.key].avgFps >= TARGET_FPS).length, { fps, from } = keyFps(results);
  $('overall').innerHTML = `ภาพรวมเทียบเป้าหมาย ${TARGET_FPS} FPS: ${from === 'none' ? '—' : badge(fps)} <b class="num">${Math.round(fps)}</b> FPS
    (${from === 'game' ? 'เกมเต็ม' : from === 'hand' ? 'การวาดมือที่ช้าที่สุด' : 'กล้องอย่างเดียว'}) · ผ่าน ${nPass}/${done.length} สถานการณ์`;
  window.__benchOverall = { pass: fps >= TARGET_FPS, fps, nPass, n: done.length };
}
function renderCards(results) {
  renderOverall(results);
  $('cards').innerHTML = SCENARIOS.filter((s) => results[s.key]).map((s) => {
    const r = results[s.key];
    if (r.skipped) return `<div class="rcard skip"><h3>${s.icon} ${s.th}</h3><p class="muted">ข้าม — ${esc(r.reason)}</p></div>`;
    return `<div class="rcard ${fpsLevel(r.avgFps)}"><h3>${s.icon} ${s.th}</h3>
      <div class="big">${Math.round(r.avgFps)} <small>FPS เฉลี่ย</small></div>
      <p style="margin:4px 0">${badge(r.avgFps)}</p>
      <dl><dt>FPS ต่ำสุด</dt><dd>${Math.round(r.minFps)}</dd><dt>ms ต่อเฟรม</dt><dd>${r.msPerFrame}</dd>
      ${r.camFps ? `<dt>กล้องส่งภาพ</dt><dd>${r.camFps} fps</dd>` : ''}
      ${r.handFoundPct !== undefined ? `<dt>เห็นมือจริง</dt><dd>${r.handFoundPct}%</dd>` : ''}</dl></div>`;
  }).join('');
}

// ---------- สรุป คำแนะนำ บันทึก ----------
async function finish(name, results) {
  const reco = recommend(results);
  showReco(reco);
  const rec = { id: newId('b_'), machine: name, createdAt: Date.now(), seconds: SECONDS, resolution: `${RES.width}x${RES.height}`,
    device, results, recommendation: reco };
  try { await put('benchmarks', rec); $('saveState').textContent = `💾 บันทึกผลของ "${name}" แล้ว`; toast('บันทึกผลทดสอบแล้ว', 'success'); }
  catch (e) { $('saveState').innerHTML = `⚠️ บันทึกไม่ได้: ${esc(e.message)}`; }
  window.__lastBench = rec;
  $('stageNote').textContent = '✔ ทดสอบครบแล้ว ดูคำแนะนำด้านบน';
  drawCompare();
}
function showReco(reco) {
  lastReco = reco;
  $('recoText').textContent = reco.text;
  $('recoBasis').textContent = reco.basis;
  $('recoLoss').innerHTML = reco.losses.map((l) => `<li>${esc(l)}</li>`).join('') || '<li>ไม่เสียอะไร ใช้ค่าสูงสุดได้เลย</li>';
  $('recoLossBox').classList.remove('hidden');
  $('btnApply').disabled = false;
}
// ใช้ค่าแนะนำ: ยืนยันพร้อมบอกสิ่งที่เสียไปทุกครั้ง (ห้ามปรับเงียบ ๆ)
$('btnApply').onclick = async () => {
  if (!lastReco) return;
  const ok = await modal(`<h2>ใช้ค่าแนะนำ?</h2><p>${esc(lastReco.text)}</p><p><b>สิ่งที่จะเสียไป:</b></p>
    <ul>${lastReco.losses.map((l) => `<li>${esc(l)}</li>`).join('') || '<li>ไม่มี</li>'}</ul><p class="muted">เปลี่ยนกลับได้ทุกเมื่อ</p>`,
  [{ label: 'ยกเลิก', value: false, cls: 'ghost' }, { label: '✔ ใช้เลย', value: true, cls: 'success' }]);
  if (!ok) return;
  savePrefs(toPrefs(lastReco));
  showPrefs();
  toast(`ใช้ค่าใหม่แล้ว: ${STYLE_TH[lastReco.style]} · ${RES_TH[lastReco.resolution]} · ${EFFECTS_TH[lastReco.effects]}`, 'success', 5);
};

$('btnStart').onclick = runAll;
$('btnStop').onclick = () => { stopFlag = true; toast('จะหยุดหลังจบสถานการณ์ที่กำลังทดสอบ', 'warning'); };
window.addEventListener('pagehide', () => stopCamera());
document.addEventListener('visibilitychange', () => { if (document.hidden && running) toast('สลับหน้าต่างระหว่างทดสอบ ผลอาจต่ำกว่าจริง ควรทดสอบใหม่', 'warning', 6); });

bindCompare();
drawCompare();
firstRunCheck({ onTest: () => { $('machine').focus(); $('machine').scrollIntoView({ block: 'center' }); } });
window.__bench = { runAll, recommend, showReco, drawCompare, device };
