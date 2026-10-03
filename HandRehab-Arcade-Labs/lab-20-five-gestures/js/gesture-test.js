// ============================================================
// gesture-test.js — หน้าทดสอบ Lab 20: แถบคะแนน 5 ท่าพร้อมกัน
// ============================================================
import { applyPrefs, downloadCSV, esc } from './ui.js';
import { drawHand, FINGER_TH } from './hand.js';
import { detectAll, GESTURE_INFO, GESTURE_KEYS, GESTURE_CONFIG, setGestureConfig } from './gestures.js';
import { startHandApp } from './hand-app.js';
import { DemoHand } from './demo-hand.js';

applyPrefs();
const $ = (id) => document.getElementById(id);
const video = $('video'), canvas = $('canvas'), stage = $('stage');

// เราป้อน hand.sq (แก้สัดส่วนภาพแล้ว) จึงบอกท่าข้อมือว่าไม่ต้องคูณสัดส่วนซ้ำ
setGestureConfig('wristFlex', { aspect: 1 });

// ---------- การ์ด 5 ใบ ----------
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

// ---------- สไลเดอร์ค่าเกณฑ์ (ท่าละ 2 ตัว: เกณฑ์ active + ค่าหลักของสมการ) ----------
const THR = [
  ['pinch', 'on', 'จีบ: เกณฑ์ active', 0.3, 0.95, 0.05], ['pinch', 'zero', 'จีบ: ระยะที่คะแนน = 0', 0.3, 1.4, 0.05],
  ['fist', 'on', 'กำมือ: เกณฑ์ active', 0.3, 0.95, 0.05], ['fist', 'full', 'กำมือ: ความงอเฉลี่ยที่คะแนน = 1', 0.4, 1, 0.05],
  ['open', 'on', 'แบมือ: เกณฑ์ active', 0.3, 0.95, 0.05], ['open', 'full', 'แบมือ: มุมกางชี้–ก้อยที่คะแนน = 1 (°)', 25, 80, 1],
  ['fingerTap', 'on', 'แตะนิ้ว: เกณฑ์ active', 0.3, 0.95, 0.05], ['fingerTap', 'curlOn', 'แตะนิ้ว: ความงอที่นับว่าแตะ', 0.3, 0.9, 0.05],
  ['wristFlex', 'on', 'ข้อมือ: เกณฑ์ active', 0.3, 0.95, 0.05], ['wristFlex', 'full', 'ข้อมือ: มุมที่คะแนน = 1 (°)', 20, 80, 1],
];
$('thr').innerHTML = THR.map(([g, k, label, min, max, step]) => `<div class="slider-row"><span>${label}</span><b class="num" id="tv-${g}-${k}">${GESTURE_CONFIG[g][k]}</b>
  <input type="range" data-g="${g}" data-k="${k}" min="${min}" max="${max}" step="${step}" value="${GESTURE_CONFIG[g][k]}"></div>`).join('');
$('thr').querySelectorAll('input').forEach((inp) => {
  inp.oninput = () => { setGestureConfig(inp.dataset.g, { [inp.dataset.k]: +inp.value }); $(`tv-${inp.dataset.g}-${inp.dataset.k}`).textContent = inp.value; };
});

// ---------- บันทึก CSV ----------
let rec = null, rows = [];
const COLS = ['timestamp', 't_ms', 'pinch', 'fist', 'open', 'fingerTap', 'tapFinger', 'wristFlex', 'wristDeg', 'wristDir', 'active'];
$('recBtn').onclick = () => {
  if (!rec) { rows = []; rec = { t0: performance.now() }; $('recBtn').textContent = '⏹️ หยุดบันทึก'; $('csvBtn').disabled = true; }
  else { rec = null; $('recBtn').textContent = '⏺️ เริ่มบันทึก'; $('csvBtn').disabled = !rows.length; }
};
$('csvBtn').onclick = () => downloadCSV(`gestures-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`, rows, COLS);

// ---------- ทุกเฟรม ----------
let lastUi = 0;
const DIR_TH = { flex: 'งอเข้า', extend: 'เหยียดออก' };
function onFrame(hand, now, info) {
  drawHand(canvas, hand, { style: 'simple' });
  $('nohand').classList.toggle('hidden', !!hand || !info.ready);
  let res = null;
  if (hand) { try { res = detectAll(hand.sq); } catch (e) { console.warn(e.message); } }
  if (rec && res) {
    rows.push({ timestamp: new Date().toISOString(), t_ms: Math.round(now - rec.t0),
      ...Object.fromEntries(GESTURE_KEYS.map((k) => [k, +res[k].score.toFixed(4)])),
      tapFinger: res.fingerTap.finger || '', wristDeg: +res.wristFlex.details.angleDeg.toFixed(1), wristDir: res.wristFlex.details.direction,
      active: GESTURE_KEYS.filter((k) => res[k].active).join('|') });
  }
  // แถบเลื่อนทุกเฟรม ตัวเลขอัปเดต 10 ครั้ง/วินาที
  GESTURE_KEYS.forEach((k) => { $('gb-' + k).style.width = (res ? res[k].score * 100 : 0) + '%'; });
  if (now - lastUi < 100) return;
  lastUi = now;
  $('sFps').textContent = info.fps; $('sAi').textContent = info.aiMs; $('sDel').textContent = info.delegate;
  const act = res ? GESTURE_KEYS.filter((k) => res[k].active) : [];
  GESTURE_KEYS.forEach((k) => {
    $('gs-' + k).textContent = res ? res[k].score.toFixed(2) : '—';
    $('g-' + k).classList.toggle('active', act.includes(k));
  });
  $('gx-fingerTap').textContent = res ? (res.fingerTap.finger ? `นิ้ว${FINGER_TH[res.fingerTap.finger]}` : `(ใกล้สุด: นิ้ว${FINGER_TH[res.fingerTap.details.finger] || '—'})`) : '';
  $('gx-wristFlex').textContent = res ? `${res.wristFlex.details.angleDeg.toFixed(0)}° · ${DIR_TH[res.wristFlex.details.direction]}` : '';
  $('gx-pinch').textContent = res ? `ระยะ ${res.pinch.distance.toFixed(2)}` : '';
  $('gx-fist').textContent = res ? `งอเฉลี่ย ${res.fist.details.avgCurl.toFixed(2)}` : '';
  $('gx-open').textContent = res ? `กาง ${res.open.details.spreadDeg.toFixed(0)}°` : '';
  $('activeBadge').textContent = act.length ? act.map((k) => GESTURE_INFO[k].icon + ' ' + GESTURE_INFO[k].th).join(', ') : '—';
  // ตรวจเกณฑ์ผ่าน: ท่าที่ทำ (คะแนนสูงสุด) ท่าอื่นต้องต่ำกว่า 30%
  if (res) {
    const sorted = GESTURE_KEYS.map((k) => [k, res[k].score]).sort((a, b) => b[1] - a[1]);
    const other = sorted[1][1];
    $('sCross').textContent = sorted[0][1] > 0.6 ? `${(other * 100).toFixed(0)}% ${other < 0.3 ? '✅' : '⚠️'}` : '—';
  } else $('sCross').textContent = '—';
  $('recN').textContent = rows.length;
}

// ---------- เริ่มระบบ ----------
const demo = new DemoHand(stage, $('demoPanel'));
const app = startHandApp({ video, canvas, msgEl: $('msg'), onFrame, demo });
$('demoBtn').onclick = () => { app.setDemo(!app.isDemo()); $('demoBtn').textContent = app.isDemo() ? '📷 กลับไปใช้กล้อง' : '🖱️ โหมดสาธิต'; };
