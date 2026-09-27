// ============================================================
// gestures.test.mjs — ทดสอบ js/gestures.js ด้วยมือจำลอง (ไม่ต้องเปิดกล้อง)
// วิธีรัน (ในโฟลเดอร์แลป):  node tests/gestures.test.mjs
// เกณฑ์ผ่าน Lab 20: ทำท่าไหน แถบท่านั้นขึ้น ท่าอื่นต้องต่ำกว่า 30%
// ============================================================
import assert from 'node:assert/strict';
import { detectAll, detectPinch, setGestureConfig, GESTURE_CONFIG, GESTURE_INFO, GESTURE_KEYS } from '../js/gestures.js';
import { synthHand } from '../js/synth-hand.js';

setGestureConfig('wristFlex', { aspect: 1 }); // มือจำลองมีหน่วยเท่ากันทุกแกนแล้ว (เหมือน hand.sq)
let pass = 0, fail = 0;
function test(name, fn) {
  try { fn(); pass++; console.log('  ✅', name); } catch (e) { fail++; console.log('  ❌', name, '\n     ', e.message); }
}

// [ชื่อท่า, ท่าที่ควรขึ้น, พารามิเตอร์มือจำลอง, นิ้วที่ควรรายงาน]
const POSES = [
  ['จีบนิ้ว', 'pinch', { pinch: 1 }],
  ['จีบนิ้ว (นิ้วชี้งอนิดหน่อย)', 'pinch', { pinch: 1, curls: { index: 0.4 } }],
  ['กำมือ', 'fist', { curls: { index: 1, middle: 1, ring: 1, little: 1, thumb: 0.6 } }],
  ['แบมือกางนิ้ว', 'open', { spread: 16 }],
  ['แตะนิ้วโป้ง', 'fingerTap', { curls: { thumb: 1 } }, 'thumb'],
  ['แตะนิ้วชี้', 'fingerTap', { curls: { index: 0.9 } }, 'index'],
  ['แตะนิ้วกลาง', 'fingerTap', { curls: { middle: 0.9 } }, 'middle'],
  ['แตะนิ้วนาง', 'fingerTap', { curls: { ring: 0.9 } }, 'ring'],
  ['แตะนิ้วก้อย', 'fingerTap', { curls: { little: 0.9 } }, 'little'],
  ['งอข้อมือ', 'wristFlex', { wrist: 50 }],
  ['เหยียดข้อมือ', 'wristFlex', { wrist: -50 }],
];
console.log('gestures.js — แต่ละท่าขึ้นแถบของตัวเอง ท่าอื่น < 0.30');
for (const [name, key, p, finger] of POSES) {
  test(name, () => {
    for (const scale of [0.12, 0.25, 0.45]) {
      const r = detectAll(synthHand({ scale, ...p }));
      assert.ok(r[key].active, `${key} ควร active (scale ${scale}) ได้ ${r[key].score.toFixed(2)}`);
      for (const k of GESTURE_KEYS) if (k !== key) assert.ok(r[k].score < 0.3, `${k} ขึ้นตาม ${r[k].score.toFixed(2)} (scale ${scale})`);
      if (finger) assert.equal(r.fingerTap.finger, finger);
    }
  });
}
test('มือพัก (นิ้วชิดเหยียด) → ไม่มีท่าใด active', () => {
  const r = detectAll(synthHand({ spread: 6 }));
  for (const k of GESTURE_KEYS) assert.ok(!r[k].active, k);
});
test('ข้อมือรายงานทิศ งอ/เหยียด', () => {
  assert.equal(detectAll(synthHand({ wrist: 40 })).wristFlex.details.direction, 'flex');
  assert.equal(detectAll(synthHand({ wrist: -40 })).wristFlex.details.direction, 'extend');
});
test('ค่าเกณฑ์ปรับจากภายนอกได้ (ส่ง over หรือ setGestureConfig) ไม่ฝังในฟังก์ชัน', () => {
  const h = synthHand({ pinch: 0.6 });
  const a = detectPinch(h).score, b = detectPinch(h, { zero: 2 }).score;
  assert.ok(b > a, 'zero ใหญ่ขึ้น คะแนนต้องสูงขึ้น');
  const old = GESTURE_CONFIG.pinch.on;
  setGestureConfig('pinch', { on: 0.01 });
  assert.equal(detectPinch(h).active, true);
  setGestureConfig('pinch', { on: old });
});
test('ทุกท่ามีคำอธิบายกายภาพบำบัด: ชื่อ กล้ามเนื้อ กิจวัตร', () => {
  for (const k of GESTURE_KEYS) for (const f of ['th', 'icon', 'trains', 'physio', 'muscles', 'daily']) assert.ok(GESTURE_INFO[k][f], `${k}.${f}`);
});

console.log(`\nผลรวม: ผ่าน ${pass} / ${pass + fail}`);
if (fail) process.exit(1);
