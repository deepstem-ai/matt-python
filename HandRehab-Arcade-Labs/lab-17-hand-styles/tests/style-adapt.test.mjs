// ============================================================
// style-adapt.test.mjs — ทดสอบการลด/เพิ่มสไตล์อัตโนมัติด้วยเวลาจำลอง
// วิธีรัน (ในโฟลเดอร์แลป):  node tests/style-adapt.test.mjs
// ============================================================
import assert from 'node:assert/strict';
import { StyleAdapter } from '../js/style-adapt.js';

let pass = 0, fail = 0;
function test(name, fn) { try { fn(); pass++; console.log('  ✅', name); } catch (e) { fail++; console.log('  ❌', name, '\n     ', e.message); } }
// ป้อน FPS คงที่ทุก 100 ms คืนเวลา (ms) ที่ได้คำสั่งแรก
function run(ad, fps, ms, cur, want, t0 = 0) {
  for (let t = t0; t <= t0 + ms; t += 100) { const a = ad.update(fps, t, cur, want); if (a) return { a, t: t - t0 }; }
  return null;
}
console.log('style-adapt.js (ต่ำกว่า 24 นาน 3 วิ → ลด, สูงกว่า 45 นาน 10 วิ → ถามเพิ่ม)');
test('FPS 18 ต่อเนื่อง → ลดระดับหลัง 3 วินาที', () => { const r = run(new StyleAdapter(), 18, 5000, 2, 2); assert.equal(r.a, 'down'); assert.ok(r.t >= 3000 && r.t < 3200, r.t); });
test('FPS 18 แค่ 2 วินาทีแล้วกลับมา 40 → ไม่ลด (กันสลับไปมา)', () => {
  const ad = new StyleAdapter(); assert.equal(run(ad, 18, 2000, 2, 2), null); assert.equal(run(ad, 40, 5000, 2, 2, 2100), null);
});
test('สไตล์ต่ำสุดแล้ว (simple) → ไม่ลดต่อ', () => { assert.equal(run(new StyleAdapter(), 10, 6000, 0, 2), null); });
test('FPS 58 นาน 10 วินาที หลังถูกลด → ขอเพิ่มกลับ', () => { const r = run(new StyleAdapter(), 58, 12000, 0, 2); assert.equal(r.a, 'up'); assert.ok(r.t >= 10000, r.t); });
test('ผู้ใช้เลือก simple เอง → ไม่ถามเพิ่ม', () => { assert.equal(run(new StyleAdapter(), 60, 15000, 0, 0), null); });
test('หลังเปลี่ยนสไตล์ รอ 2 วินาทีให้ FPS นิ่งก่อน', () => { const ad = new StyleAdapter(); ad.notifyChange(0); const r = run(ad, 10, 8000, 2, 2); assert.ok(r.t >= 5000, r.t); });
console.log(`\nผลรวม: ผ่าน ${pass} / ${pass + fail}`);
if (fail) process.exit(1);
