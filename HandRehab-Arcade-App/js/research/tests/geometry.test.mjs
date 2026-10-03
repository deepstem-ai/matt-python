// ============================================================
// geometry.test.mjs — ทดสอบ js/geometry.js ด้วย node (ไม่ต้องเปิดกล้อง)
// วิธีรัน (ที่รากแอป):  node js/research/tests/geometry.test.mjs
// ใช้มือจำลองหลายขนาด (ใกล้/ไกลกล้อง) พิสูจน์ว่า normDist ไม่ขึ้นกับระยะกล้อง
// ============================================================
import assert from 'node:assert/strict';
import { dist, palmScale, normDist, angle, fingerCurl, spread, handFacingCamera, squarePoints } from '../../geometry.js';
import { synthHand } from '../synth-hand.js';

let pass = 0, fail = 0;
function test(name, fn) {
  try { fn(); pass++; console.log('  ✅', name); } catch (e) { fail++; console.log('  ❌', name, '\n     ', e.message); }
}
const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} กับ ${b} ต่างกันเกิน ${tol}`);

console.log('geometry.js');
test('dist: สามเหลี่ยม 3-4-5 และมิติ z', () => {
  close(dist({ x: 0, y: 0, z: 0 }, { x: 3, y: 4, z: 0 }), 5, 1e-12, '2D');
  close(dist({ x: 0, y: 0, z: 0 }, { x: 1, y: 2, z: 2 }), 3, 1e-12, '3D');
});
test('angle: มุมฉาก 90° และเส้นตรง 180°', () => {
  close(angle({ x: 1, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 1 }), 90, 1e-9, 'มุมฉาก');
  close(angle({ x: -1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 }), 180, 1e-9, 'เส้นตรง');
});

// หัวใจของแลป: ขนาดมือ 0.10 → 0.50 (ไกล → ใกล้กล้อง 5 เท่า)
const SCALES = [0.1, 0.15, 0.2, 0.3, 0.4, 0.5];
const PAIRS = [[4, 8], [8, 12], [4, 20], [0, 12], [8, 20]];
test('normDist ไม่ขึ้นกับขนาดมือ (ใกล้/ไกลกล้อง) ทุกคู่จุด', () => {
  for (const [i, j] of PAIRS) {
    const vals = SCALES.map((s) => normDist(synthHand({ scale: s, spread: 10 }), i, j));
    const raw = SCALES.map((s) => dist(synthHand({ scale: s, spread: 10 })[i], synthHand({ scale: s, spread: 10 })[j]));
    const nRatio = Math.max(...vals) / Math.min(...vals), rRatio = Math.max(...raw) / Math.min(...raw);
    assert.ok(nRatio < 1.000001, `คู่ ${i}-${j} ค่าหารฝ่ามือแกว่ง ${nRatio}`);
    assert.ok(rRatio > 4.9, `คู่ ${i}-${j} ระยะดิบควรต่างกัน ~5 เท่า แต่ได้ ${rRatio}`);
  }
});
test('normDist ไม่ขึ้นกับตำแหน่งมือในภาพ', () => {
  const a = normDist(synthHand({ cx: 0.2, cy: 0.9 }), 4, 8), b = normDist(synthHand({ cx: 0.8, cy: 0.5 }), 4, 8);
  close(a, b, 1e-9, 'ย้ายตำแหน่ง');
});
test('ขนาดฝ่ามือ (0–9) ไม่เปลี่ยนเมื่อกำมือ แต่ 0–12 เปลี่ยนมาก', () => {
  const open = synthHand({ scale: 0.2 }), fist = synthHand({ scale: 0.2, curls: { index: 1, middle: 1, ring: 1, little: 1 } });
  close(palmScale(open), palmScale(fist), 1e-12, 'palmScale');
  assert.ok(dist(open[0], open[12]) / dist(fist[0], fist[12]) > 1.5, '0–12 ควรเปลี่ยนเมื่อกำมือ จึงไม่เหมาะเป็นไม้บรรทัด');
});
test('fingerCurl: นิ้วตรง ≈ 0, งอสุด > 0.6, เรียงตามความงอ', () => {
  for (const f of ['index', 'middle', 'ring', 'little']) {
    const c0 = fingerCurl(synthHand({}), f), c5 = fingerCurl(synthHand({ curls: { [f]: 0.5 } }), f), c1 = fingerCurl(synthHand({ curls: { [f]: 1 } }), f);
    assert.ok(c0 < 0.05, `${f} ตรงควร ≈0 ได้ ${c0}`);
    assert.ok(c0 < c5 && c5 < c1 && c1 > 0.6, `${f} ต้องเพิ่มตามความงอ ${c0} ${c5} ${c1}`);
  }
  assert.ok(fingerCurl(synthHand({ curls: { thumb: 1 } }), 'thumb') > 0.6, 'นิ้วโป้งงอ');
});
test('fingerCurl ไม่ขึ้นกับขนาดมือ', () => {
  close(fingerCurl(synthHand({ scale: 0.1, curls: { middle: 0.7 } }), 'middle'), fingerCurl(synthHand({ scale: 0.5, curls: { middle: 0.7 } }), 'middle'), 1e-9, 'curl');
});
test('spread: กางมากขึ้น มุมมากขึ้น และไม่ขึ้นกับขนาด', () => {
  const s1 = spread(synthHand({ spread: 4 }), 'index', 'little'), s2 = spread(synthHand({ spread: 16 }), 'index', 'little');
  assert.ok(s2 > s1 + 20, `ควรกว้างขึ้น ${s1} → ${s2}`);
  close(spread(synthHand({ spread: 12, scale: 0.1 }), 'index', 'little'), spread(synthHand({ spread: 12, scale: 0.5 }), 'index', 'little'), 1e-9, 'spread');
});
test('handFacingCamera: ฝ่ามือตรง = หันเข้ากล้อง, หมุน 80° รอบแกนตั้ง = หันข้าง', () => {
  const flat = synthHand({});
  assert.equal(handFacingCamera(flat).facing, true);
  const a = (80 * Math.PI) / 180;
  const side = flat.map((p) => ({ x: 0.5 + (p.x - 0.5) * Math.cos(a), y: p.y, z: (p.x - 0.5) * Math.sin(a) }));
  assert.equal(handFacingCamera(side).facing, false);
});
test('squarePoints: แก้สัดส่วนภาพ 16:9 แล้วมุมกลับมาถูก', () => {
  const sq = synthHand({ spread: 12 }), asp = 16 / 9;
  const img = sq.map((p) => ({ x: p.x / asp, y: p.y, z: p.z / asp })); // แบบที่ MediaPipe ส่งมา
  assert.ok(spread(img, 'index', 'little') < spread(sq, 'index', 'little') - 5, 'ภาพดิบ 16:9 มุมหดลง');
  close(spread(squarePoints(img, asp), 'index', 'little'), spread(sq, 'index', 'little'), 1e-9, 'หลังแก้');
});
test('error ภาษาไทย: จุดไม่ครบ 21 จุด', () => {
  assert.throws(() => palmScale([]), /21 จุด/);
  assert.throws(() => normDist(synthHand({}).slice(0, 20), 4, 8), /21 จุด/);
  assert.throws(() => fingerCurl(null, 'index'), /21 จุด/);
});
test('error ภาษาไทย: ขนาดฝ่ามือเป็นศูนย์ (ไม่คืน NaN เงียบ ๆ)', () => {
  const zero = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
  assert.throws(() => palmScale(zero), /ขนาดฝ่ามือเป็นศูนย์/);
  assert.throws(() => normDist(zero, 4, 8), /ขนาดฝ่ามือเป็นศูนย์/);
});

console.log(`\nผลรวม: ผ่าน ${pass} / ${pass + fail}`);
if (fail) process.exit(1);
