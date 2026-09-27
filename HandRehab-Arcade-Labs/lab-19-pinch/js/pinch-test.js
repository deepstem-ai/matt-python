// ============================================================
// pinch-test.js — หน้าทดสอบ Lab 19: ท่าจีบนิ้ว
//
// ทำไมท่าจีบสำคัญในการฟื้นฟูมือ:
//   - การจีบ (นิ้วโป้งแตะนิ้วชี้) คือพื้นฐานของ "การหยิบจับละเอียด" (fine motor / pincer grasp)
//   - ผู้ป่วยโรคหลอดเลือดสมอง ข้อนิ้วเสื่อม เอ็นหรือเส้นประสาทมือบาดเจ็บ มักสูญเสียทักษะนี้ก่อน
//     และได้คืนช้าที่สุด นักกายภาพจึงให้ฝึกจีบซ้ำ ๆ วันละหลายสิบครั้ง
//   - การนับครั้ง + วัดระยะ ทำให้เห็นความก้าวหน้าเป็นตัวเลข แทนการกะด้วยสายตา
// กิจวัตรประจำวันที่ต้องใช้ท่าจีบ:
//   หยิบเหรียญ/ยาเม็ด, กลัดกระดุม, รูดซิป, จับปากกา/ดินสอ, หยิบช้อนส้อม, เปิดฝาขวดเล็ก, ผูกเชือกรองเท้า
// ============================================================
import { applyPrefs, downloadCSV } from './ui.js';
import { drawHand } from './hand.js';
import { dist } from './geometry.js';
import { detectPinch, GESTURE_CONFIG, setGestureConfig } from './gestures.js';
import { startHandApp } from './hand-app.js';
import { DemoHand } from './demo-hand.js';
import { beep, unlockAudio, setMuted, isMuted } from './beep.js';

applyPrefs();
const $ = (id) => document.getElementById(id);
const video = $('video'), canvas = $('canvas'), stage = $('stage');

// ---------- สไลเดอร์ค่าเกณฑ์: เขียนลง GESTURE_CONFIG ผ่าน setGestureConfig (ไม่ฝังตัวเลขในฟังก์ชัน) ----------
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
syncSliders();

// ---------- เสียง (ต้องคลิกก่อน เบราว์เซอร์จึงยอมเล่นเสียง) ----------
setMuted(true);
$('soundBtn').onclick = () => {
  unlockAudio();
  setMuted(!isMuted());
  $('soundBtn').textContent = isMuted() ? '🔇 เปิดเสียง' : '🔊 ปิดเสียง';
  if (!isMuted()) beep(660, 80);
};

// ---------- ตัวนับแบบง่าย: นับขอบขาขึ้น (false → true) ----------
let count = 0, wasActive = false;
$('resetCount').onclick = () => { count = 0; $('count').textContent = 0; };

// ---------- บันทึก CSV ----------
let rec = null, rows = [];
$('recBtn').onclick = () => {
  if (!rec) { rows = []; rec = { t0: performance.now() }; $('recBtn').textContent = '⏹️ หยุดบันทึก'; $('csvBtn').disabled = true; }
  else { rec = null; $('recBtn').textContent = '⏺️ เริ่มบันทึก'; $('csvBtn').disabled = rows.length === 0; }
};
$('csvBtn').onclick = () => downloadCSV(`pinch-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`, rows, ['timestamp', 't_ms', 'raw_px', 'norm', 'score', 'active']);

// ---------- ทุกเฟรม ----------
let lastUi = 0;
function onFrame(hand, now, info) {
  drawHand(canvas, hand, { style: 'simple' });
  $('nohand').classList.toggle('hidden', !!hand || !info.ready);
  let score = 0, active = false, raw = null, norm = null;
  if (hand) {
    const W = canvas.width, H = canvas.height;
    const p4 = hand.points[4], p8 = hand.points[8];
    raw = dist({ x: p4.x * W, y: p4.y * H, z: p4.z * W }, { x: p8.x * W, y: p8.y * H, z: p8.z * W });
    try {
      const r = detectPinch(hand.sq); // ใช้จุดที่แก้สัดส่วนภาพแล้ว
      ({ score, active } = r); norm = r.distance;
    } catch (e) { console.warn(e.message); }
  }
  // นับเมื่อ active เพิ่งเปลี่ยนเป็น true + เสียงตอบสนอง
  if (active && !wasActive) { count++; $('count').textContent = count; beep(880, 120); }
  wasActive = active;
  if (rec && hand) rows.push({ timestamp: new Date().toISOString(), t_ms: Math.round(now - rec.t0), raw_px: +raw.toFixed(1), norm: +norm.toFixed(4), score: +score.toFixed(4), active });
  // แถบคะแนน (อัปเดตทุกเฟรมให้ลื่น)
  const bar = $('bar'), on = GESTURE_CONFIG.pinch.on;
  bar.querySelector('i').style.width = score * 100 + '%';
  bar.dataset.level = score > on ? 'high' : score > on * 0.6 ? 'mid' : 'low';
  $('barTxt').textContent = score.toFixed(2);
  if (now - lastUi < 100) return;
  lastUi = now;
  $('raw').textContent = raw === null ? '—' : raw.toFixed(1);
  $('norm').textContent = norm === null ? '—' : norm.toFixed(3);
  $('sActive').textContent = hand ? (active ? 'จีบอยู่ ✅' : 'ปล่อย') : 'ไม่เห็นมือ';
  $('sFps').textContent = info.fps; $('sAi').textContent = info.aiMs; $('sDel').textContent = info.delegate;
  $('recN').textContent = rows.length;
}

// ---------- เริ่มระบบ ----------
const demo = new DemoHand(stage, $('demoPanel'));
const app = startHandApp({ video, canvas, msgEl: $('msg'), onFrame, demo });
$('demoBtn').onclick = () => { unlockAudio(); app.setDemo(!app.isDemo()); $('demoBtn').textContent = app.isDemo() ? '📷 กลับไปใช้กล้อง' : '🖱️ โหมดสาธิต'; };
