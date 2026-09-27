// ============================================================
// rep-counter.test.mjs — ทดสอบ js/rep-counter.js ด้วยเวลาจำลอง (ไม่ต้องเปิดกล้อง)
// วิธีรัน (ในโฟลเดอร์แลป):  node tests/rep-counter.test.mjs
// ============================================================
import assert from 'node:assert/strict';
import { RepCounter, REP_STATES } from '../js/rep-counter.js';
import { runSim, makeSignal, NaiveCounter } from '../js/counter-sim.js';

let pass = 0, fail = 0;
function test(name, fn) {
  try { fn(); pass++; console.log('  ✅', name); } catch (e) { fail++; console.log('  ❌', name, '\n     ', e.message); }
}
const CFG = { enter: 0.7, exit: 0.4, minHoldMs: 200, cooldownMs: 400 }; // ค่าตามคำใบ้ของแลป

console.log('rep-counter.js (enter 0.7 / exit 0.4 / hold 200 ms / cooldown 400 ms)');
test('1) คลื่นสะอาด 10 รอบ → นับได้ 10 พอดี', () => {
  assert.equal(runSim('clean', CFG).count, 10);
});
test('2) คลื่นเดิม + noise ±0.15 → ยังได้ 10 ทุก seed (100 seed)', () => {
  for (let seed = 1; seed <= 100; seed++) assert.equal(runSim('noisy', CFG, { seed }).count, 10, `seed ${seed}`);
});
test('3) แกว่ง 0.45–0.55 ตลอด → นับได้ 0', () => {
  for (let seed = 1; seed <= 20; seed++) assert.equal(runSim('flat', CFG, { seed }).count, 0, `seed ${seed}`);
});
test('ตัวนับเกณฑ์เดียวนับเกินจริงบนสัญญาณ noise (เห็นปัญหาที่แก้)', () => {
  const r = runSim('noisy', CFG);
  assert.ok(r.naiveCount > 15, `เกณฑ์เดียวควรนับเกิน แต่ได้ ${r.naiveCount}`);
  console.log(`     (สองประตู ${r.count} ครั้ง vs เกณฑ์เดียว ${r.naiveCount} ครั้ง; แกว่ง 0.45–0.55: เกณฑ์เดียว ${runSim('flat', CFG).naiveCount} ครั้ง)`);
});
test('ครบวงจรเท่านั้นจึงนับ: ขึ้นเกิน enter แล้วค้างไว้ ยังไม่นับจนกว่าจะลงต่ำกว่า exit', () => {
  const rc = new RepCounter(CFG);
  let t = 0;
  for (let i = 0; i < 60; i++) rc.update(0.9, (t += 16));
  assert.equal(rc.count, 0);
  assert.equal(rc.state, 'held');
  rc.update(0.2, (t += 16));
  assert.equal(rc.count, 1);
});
test('ค้างสั้นกว่า minHold (แตะผ่าน ๆ) → ไม่นับ', () => {
  const rc = new RepCounter(CFG);
  let t = 0;
  for (let i = 0; i < 6; i++) rc.update(0.95, (t += 16)); // ~96 ms
  for (let i = 0; i < 10; i++) rc.update(0.1, (t += 16));
  assert.equal(rc.count, 0);
});
test('cooldown: ทำซ้ำเร็วเกินไปภายใน 400 ms → ไม่นับครั้งที่สอง', () => {
  const rc = new RepCounter(CFG);
  const feed = (s, ms, t0) => { let t = t0; for (let k = 0; k < ms / 10; k++) rc.update(s, (t += 10)); return t; };
  let t = feed(0.9, 300, 0);
  t = feed(0.1, 50, t);             // นับครั้งที่ 1 แล้วเข้า cooldown
  t = feed(0.9, 300, t);            // ขึ้นใหม่ทันทีระหว่าง cooldown
  t = feed(0.1, 50, t);
  assert.equal(rc.count, 1);
});
test('ผ่านครบ 5 สถานะ idle → engaging → held → releasing → cooldown', () => {
  const r = runSim('clean', CFG);
  for (const s of REP_STATES) assert.ok(r.states.includes(s), 'ไม่พบสถานะ ' + s);
});
test('บันทึกแต่ละครั้ง: t, peak, holdMs, quality (0–100)', () => {
  const r = runSim('clean', CFG);
  for (const rep of r.reps) {
    assert.ok(rep.t > 0 && rep.peak > 0.9 && rep.holdMs >= 200 && rep.quality >= 0 && rep.quality <= 100, JSON.stringify(rep));
  }
});
test('เวลาถูกส่งเข้าไปจากภายนอก: เวลาจำลองเดียวกัน ผลเหมือนกันทุกครั้ง', () => {
  const sig = makeSignal('noisy', { seed: 7 });
  const a = runSim('noisy', CFG, { samples: sig }), b = runSim('noisy', CFG, { samples: sig });
  assert.deepEqual(a.reps, b.reps);
});
test('exit ≥ enter → โยน error ภาษาไทย', () => {
  assert.throws(() => new RepCounter({ enter: 0.5, exit: 0.6 }), /exit/);
});
test('NaiveCounter นับเฉพาะขอบขาขึ้น', () => {
  const n = new NaiveCounter(0.5);
  [0, 0.6, 0.7, 0.4, 0.6, 0.6, 0.1].forEach((s, i) => n.update(s, i));
  assert.equal(n.count, 2);
});

console.log(`\nผลรวม: ผ่าน ${pass} / ${pass + fail}`);
if (fail) process.exit(1);
