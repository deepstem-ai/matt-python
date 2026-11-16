// ============================================================
// gesture-lab.js — ห้องทดลองท่ามือ (Lab 19 จีบนิ้ว + Lab 20 ท่าบริหาร 5 ท่า)
//
// ทำไมท่าจีบสำคัญในการฟื้นฟูมือ (Lab 19):
//   - การจีบ (นิ้วโป้งแตะนิ้วชี้) คือพื้นฐานของ "การหยิบจับละเอียด" (fine motor / pincer grasp)
//   - ผู้ป่วยโรคหลอดเลือดสมอง ข้อนิ้วเสื่อม เอ็นหรือเส้นประสาทมือบาดเจ็บ มักสูญเสียทักษะนี้ก่อน
//     และได้คืนช้าที่สุด นักกายภาพจึงให้ฝึกจีบซ้ำ ๆ วันละหลายสิบครั้ง
// กิจวัตรที่ต้องใช้ท่าจีบ: หยิบเหรียญ/ยาเม็ด, กลัดกระดุม, รูดซิป, จับปากกา, เปิดฝาขวดเล็ก
//
// ทุกท่าใช้ hand.sq (จุดที่แก้สัดส่วนภาพแล้ว) ทั้งกล้องจริงและมือจำลอง
// ============================================================
import { applyPrefs, downloadCSV, esc } from '../ui.js';
import { drawHand, FINGER_TH } from '../hand.js';
import { dist } from '../geometry.js';
import { detectAll, GESTURE_INFO, GESTURE_KEYS, GESTURE_CONFIG, setGestureConfig } from '../gestures.js';
import { startHandApp } from './hand-app.js';
import { DemoHand } from './demo-hand.js';
import { beep, unlockAudio, setMuted, isMuted } from './beep.js';

applyPrefs();
const $ = (id) => document.getElementById(id);
const video = $('video'), canvas = $('canvas'), stage = $('stage');

// เราป้อน hand.sq (แก้สัดส่วนภาพแล้ว) จึงบอกท่าข้อมือว่าไม่ต้องคูณสัดส่วนซ้ำ
setGestureConfig('wristFlex', { aspect: 1 });
const stamp = () => new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');

// ---------- แท็บ ----------
let tab = 'pinch';
document.querySelectorAll('[data-tab]').forEach((b) => (b.onclick = () => showTab(b.dataset.tab)));
function showTab(t) {
  tab = t;
  document.querySelectorAll('[data-tab]').forEach((b) => { const on = b.dataset.tab === t; b.classList.toggle('ghost', !on); b.setAttribute('aria-selected', on); });
  document.querySelectorAll('[data-only]').forEach((el) => el.classList.toggle('hidden', el.dataset.only !== t));
  syncSliders(); syncThr(); // ค่าเกณฑ์จีบปรับได้ทั้งสองแท็บ ให้สไลเดอร์ตรงกันเสมอ
}

// ================= Lab 19: จีบนิ้ว =================
// สไลเดอร์ค่าเกณฑ์: เขียนลง GESTURE_CONFIG ผ่าน setGestureConfig (ไม่ฝังตัวเลขในฟังก์ชัน)
const CODE_DEFAULT = { ...GESTURE_CONFIG.pinch };
function syncSliders() {
  const c = GESTURE_CONFIG.pinch;
  for (const k of ['full', 'zero', 'on']) { $(k).value = c[k]; $('v' + k[0].toUpperCase() + k.slice(1)).textContent = (+c[k]).toFixed(2); }
  $('onMark').style.left = c.on * 100 + '%';
}
['full', 'zero', 'on'].forEach((k) => {
  $(k).oninput = () => {
    let v = +$(k).value;
    const c = GESTURE_CONFIG.pinch;
    if (k === 'full' && v >= c.zero - 0.05) v = c.zero - 0.05; // full ต้องน้อยกว่า zero เสมอ
    if (k === 'zero' && v <= c.full + 0.05) v = c.full + 0.05;
    setGestureConfig('pinch', { [k]: v });
    syncSliders();
  };
});
$('hintVals').onclick = () => { setGestureConfig('pinch', { full: 0.15, zero: 0.6, on: 0.7 }); syncSliders(); };
$('codeVals').onclick = () => { setGestureConfig('pinch', { full: CODE_DEFAULT.full, zero: CODE_DEFAULT.zero, on: CODE_DEFAULT.on }); syncSliders(); };

// เสียง (ต้องคลิกก่อน เบราว์เซอร์จึงยอมเล่นเสียง)
setMuted(true);
$('soundBtn').onclick = () => {
  unlockAudio(); setMuted(!isMuted());
  $('soundBtn').textContent = isMuted() ? '🔇 เปิดเสียง' : '🔊 ปิดเสียง';
  if (!isMuted()) beep(660, 80);
};
// ตัวนับแบบง่าย: นับขอบขาขึ้น (false → true) — counter-lab.html (Lab 21) แก้การนับซ้ำ
let count = 0, wasActive = false;
$('resetCount').onclick = () => { count = 0; $('count').textContent = 0; };
// บันทึก CSV ทุกเฟรม
let rec = null, rows = [];
$('recBtn').onclick = () => {
  if (!rec) { rows = []; rec = { t0: performance.now() }; $('recBtn').textContent = '⏹️ หยุดบันทึก'; $('csvBtn').disabled = true; }
  else { rec = null; $('recBtn').textContent = '⏺️ เริ่มบันทึก'; $('csvBtn').disabled = rows.length === 0; }
};
$('csvBtn').onclick = () => downloadCSV(`pinch-${stamp()}.csv`, rows, ['timestamp', 't_ms', 'raw_px', 'norm', 'score', 'active']);

// ================= Lab 20: 5 ท่า =================
$('cards').innerHTML = GESTURE_KEYS.map((k) => {
  const g = GESTURE_INFO[k];
  return `<div class="card-neon gcard" id="g-${k}">
    <div class="row"><span class="ico">${g.icon}</span><b>${g.th}</b></div>
    <div class="score" id="gs-${k}">0.00</div>
    <div class="bar"><i id="gb-${k}"></i></div>
    <div class="extra" id="gx-${k}"></div>
    <div class="muted">ฝึก: ${esc(g.trains)}</div>
    <details><summary>อ่านคำอธิบายกายภาพบำบัด</summary>
      <p><b>ชื่อทางกายภาพ:</b> ${esc(g.physio)}</p><p><b>กล้ามเนื้อ:</b> ${esc(g.muscles)}</p><p><b>ใช้ในชีวิตประจำวัน:</b> ${esc(g.daily)}</p></details>
  </div>`;
}).join('');
// สไลเดอร์ค่าเกณฑ์ (ท่าละ 2 ตัว: เกณฑ์ active + ค่าหลักของสมการ)
const THR = [
  ['pinch', 'on', 'จีบ: เกณฑ์ active', 0.3, 0.95, 0.05], ['pinch', 'zero', 'จีบ: ระยะที่คะแนน = 0', 0.3, 1.4, 0.05],
  ['fist', 'on', 'กำมือ: เกณฑ์ active', 0.3, 0.95, 0.05], ['fist', 'full', 'กำมือ: ความงอเฉลี่ยที่คะแนน = 1', 0.4, 1, 0.05],
  ['open', 'on', 'แบมือ: เกณฑ์ active', 0.3, 0.95, 0.05], ['open', 'full', 'แบมือ: มุมกางชี้–ก้อยที่คะแนน = 1 (°)', 25, 80, 1],
  ['fingerTap', 'on', 'แตะนิ้ว: เกณฑ์ active', 0.3, 0.95, 0.05], ['fingerTap', 'curlOn', 'แตะนิ้ว: ความงอที่นับว่าแตะ', 0.3, 0.9, 0.05],
  ['wristFlex', 'on', 'ข้อมือ: เกณฑ์ active', 0.3, 0.95, 0.05], ['wristFlex', 'full', 'ข้อมือ: มุมที่คะแนน = 1 (°)', 20, 80, 1],
];
$('thr').innerHTML = THR.map(([g, k, label, min, max, step]) => `<div class="slider-row"><span>${label}</span><b class="num" id="tv-${g}-${k}"></b>
  <input type="range" data-g="${g}" data-k="${k}" min="${min}" max="${max}" step="${step}"></div>`).join('');
function syncThr() {
  $('thr').querySelectorAll('input').forEach((inp) => { const v = GESTURE_CONFIG[inp.dataset.g][inp.dataset.k]; inp.value = v; $(`tv-${inp.dataset.g}-${inp.dataset.k}`).textContent = +(+v).toFixed(2); });
}
$('thr').querySelectorAll('input').forEach((inp) => {
  inp.oninput = () => { setGestureConfig(inp.dataset.g, { [inp.dataset.k]: +inp.value }); $(`tv-${inp.dataset.g}-${inp.dataset.k}`).textContent = inp.value; };
});
let rec5 = null, rows5 = [];
const COLS5 = ['timestamp', 't_ms', 'pinch', 'fist', 'open', 'fingerTap', 'tapFinger', 'wristFlex', 'wristDeg', 'wristDir', 'active'];
$('recBtn5').onclick = () => {
  if (!rec5) { rows5 = []; rec5 = { t0: performance.now() }; $('recBtn5').textContent = '⏹️ หยุดบันทึก'; $('csvBtn5').disabled = true; }
  else { rec5 = null; $('recBtn5').textContent = '⏺️ เริ่มบันทึก'; $('csvBtn5').disabled = !rows5.length; }
};
$('csvBtn5').onclick = () => downloadCSV(`gestures-${stamp()}.csv`, rows5, COLS5);

// ================= ทุกเฟรม =================
let lastUi = 0;
const DIR_TH = { flex: 'งอเข้า', extend: 'เหยียดออก' };
function onFrame(hand, now, info) {
  drawHand(canvas, hand, { style: 'simple' }); // วัดค่าต้องใช้สไตล์เบาที่สุด
  $('nohand').classList.toggle('hidden', !!hand || !info.ready);
  let res = null, raw = null;
  if (hand) {
    try { res = detectAll(hand.sq); } catch (e) { console.warn(e.message); }
    // ระยะดิบเป็นพิกเซล (เพื่อเทียบให้เห็นว่าเปลี่ยนตามระยะกล้อง ขณะที่ normDist ไม่เปลี่ยน)
    const W = canvas.width, H = canvas.height, p4 = hand.points[4], p8 = hand.points[8];
    raw = dist({ x: p4.x * W, y: p4.y * H, z: p4.z * W }, { x: p8.x * W, y: p8.y * H, z: p8.z * W });
  }
  const pinch = res?.pinch || { score: 0, active: false, distance: null };
  // นับเมื่อ active เพิ่งเปลี่ยนเป็น true + เสียงตอบสนอง
  if (pinch.active && !wasActive) { count++; $('count').textContent = count; beep(880, 120); }
  wasActive = pinch.active;
  if (rec && hand && res) rows.push({ timestamp: new Date().toISOString(), t_ms: Math.round(now - rec.t0), raw_px: +raw.toFixed(1), norm: +pinch.distance.toFixed(4), score: +pinch.score.toFixed(4), active: pinch.active });
  if (rec5 && res) {
    rows5.push({ timestamp: new Date().toISOString(), t_ms: Math.round(now - rec5.t0),
      ...Object.fromEntries(GESTURE_KEYS.map((k) => [k, +res[k].score.toFixed(4)])),
      tapFinger: res.fingerTap.finger || '', wristDeg: +res.wristFlex.details.angleDeg.toFixed(1), wristDir: res.wristFlex.details.direction,
      active: GESTURE_KEYS.filter((k) => res[k].active).join('|') });
  }
  // แถบเลื่อนทุกเฟรม ให้ลื่น
  const bar = $('bar'), on = GESTURE_CONFIG.pinch.on;
  bar.querySelector('i').style.width = pinch.score * 100 + '%';
  bar.dataset.level = pinch.score > on ? 'high' : pinch.score > on * 0.6 ? 'mid' : 'low';
  $('barTxt').textContent = pinch.score.toFixed(2);
  GESTURE_KEYS.forEach((k) => { $('gb-' + k).style.width = (res ? res[k].score * 100 : 0) + '%'; });
  if (now - lastUi < 100) return; // ตัวเลขอัปเดต 10 ครั้ง/วินาที
  lastUi = now;
  $('sFps').textContent = info.fps; $('sAi').textContent = info.aiMs; $('sDel').textContent = info.delegate;
  $('raw').textContent = raw === null ? '—' : raw.toFixed(1);
  $('norm').textContent = pinch.distance == null ? '—' : pinch.distance.toFixed(3);
  $('sActive').textContent = hand ? (pinch.active ? 'จีบอยู่ ✅' : 'ปล่อย') : 'ไม่เห็นมือ';
  $('recN').textContent = rows.length; $('recN5').textContent = rows5.length;
  const act = res ? GESTURE_KEYS.filter((k) => res[k].active) : [];
  GESTURE_KEYS.forEach((k) => { $('gs-' + k).textContent = res ? res[k].score.toFixed(2) : '—'; $('g-' + k).classList.toggle('active', act.includes(k)); });
  $('gx-fingerTap').textContent = res ? (res.fingerTap.finger ? `นิ้ว${FINGER_TH[res.fingerTap.finger]}` : `(ใกล้สุด: นิ้ว${FINGER_TH[res.fingerTap.details.finger] || '—'})`) : '';
  $('gx-wristFlex').textContent = res ? `${res.wristFlex.details.angleDeg.toFixed(0)}° · ${DIR_TH[res.wristFlex.details.direction]}` : '';
  $('gx-pinch').textContent = res ? `ระยะ ${res.pinch.distance.toFixed(2)}` : '';
  $('gx-fist').textContent = res ? `งอเฉลี่ย ${res.fist.details.avgCurl.toFixed(2)}` : '';
  $('gx-open').textContent = res ? `กาง ${res.open.details.spreadDeg.toFixed(0)}°` : '';
  $('activeBadge').textContent = act.length ? act.map((k) => GESTURE_INFO[k].icon + ' ' + GESTURE_INFO[k].th).join(', ') : '—';
  // เกณฑ์ผ่าน Lab 20: ท่าที่ทำ (คะแนนสูงสุด) ท่าอื่นต้องต่ำกว่า 30%
  if (res) {
    const sorted = GESTURE_KEYS.map((k) => [k, res[k].score]).sort((a, b) => b[1] - a[1]);
    const other = sorted[1][1];
    $('sCross').textContent = sorted[0][1] > 0.6 ? `${(other * 100).toFixed(0)}% ${other < 0.3 ? '✅' : '⚠️'}` : '—';
  } else $('sCross').textContent = '—';
}

// ---------- เริ่มระบบ ----------
const demo = new DemoHand(stage, $('demoPanel'));
const app = startHandApp({ video, canvas, msgEl: $('msg'), onFrame, demo });
const syncDemoBtn = () => { $('demoBtn').textContent = app.isDemo() ? '📷 กลับไปใช้กล้อง' : '🖱️ โหมดสาธิต'; };
$('demoBtn').onclick = () => { unlockAudio(); app.setDemo(!app.isDemo()); syncDemoBtn(); };
syncDemoBtn();
const q = new URLSearchParams(location.search).get('tab');
showTab(q === 'five' ? 'five' : 'pinch');
window.__lab = { app, demo, showTab };
