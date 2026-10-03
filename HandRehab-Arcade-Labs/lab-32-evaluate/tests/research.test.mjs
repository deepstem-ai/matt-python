// ทดสอบเครื่องมือนักวิจัย (research.js): ความแม่นยำการนับ + ICC   วิธีรัน: node tests/research.test.mjs
import assert from 'node:assert/strict';
import * as R from '../js/research.js';

let pass = 0;
const ok = (name, fn) => { fn(); pass++; console.log('✓', name); };
const close = (a, b, eps = 0.005) => assert.ok(Math.abs(a - b) < eps, `${a} ≠ ${b}`);

// ---------- (ข) ICC: ตัวอย่างในตำรา Shrout & Fleiss (1979) 6 คน × 4 ผู้ประเมิน ----------
const SF = [[9, 2, 5, 8], [6, 1, 3, 2], [8, 4, 6, 8], [7, 1, 2, 6], [10, 5, 6, 9], [6, 2, 4, 7]];
ok('Shrout & Fleiss: ICC(2,1) = 0.29, ICC(3,1) = 0.71', () => {
  const r = R.icc(SF);
  close(r.icc21, 0.29); close(r.icc31, 0.71);
  assert.equal(r.n, 6); assert.equal(r.k, 4);
});
ok('ข้อมูลเหมือนกันทุกครั้ง → ICC = 1', () => { const r = R.icc([[1, 1], [5, 5], [9, 9]]); close(r.icc21, 1, 1e-9); close(r.icc31, 1, 1e-9); });
ok('ระบบเลื่อนคงที่ (+2 ทุกคน): ICC(3,1) = 1 แต่ ICC(2,1) < 1 (absolute agreement ลงโทษ)', () => {
  const r = R.icc([[1, 3], [5, 7], [9, 11], [4, 6]]); close(r.icc31, 1, 1e-9); assert.ok(r.icc21 < 1);
});
ok('เมทริกซ์ไม่ครบ / n < 2 → null', () => { assert.equal(R.icc([[1, 2]]), null); assert.equal(R.icc([[1, 2], [3]]), null); });
ok('แถบ Koo & Li 2016', () => {
  assert.equal(R.iccBand(0.3).key, 'poor'); assert.equal(R.iccBand(0.6).key, 'moderate');
  assert.equal(R.iccBand(0.75).key, 'good'); assert.equal(R.iccBand(0.9).key, 'good'); assert.equal(R.iccBand(0.95).key, 'excellent');
});
ok('buildMatrix ตัดเซสชันแรก ตัดข้อมูลสาธิต ใช้ k ครั้งแรก', () => {
  const S = (userId, t, reps, extra = {}) => ({ userId, startTime: t, reps, game: 'star-portal', status: 'done', ...extra });
  const sessions = [S('a', 1, 100), S('a', 2, 10), S('a', 3, 11), S('a', 4, 12), S('b', 5, 200), S('b', 6, 20), S('b', 7, 21),
    S('c', 1, 5), S('c', 2, 6), S('d', 1, 1, { details: { synthetic: true } }), S('d', 2, 2, { details: { synthetic: true } }), S('d', 3, 3, { details: { synthetic: true } })];
  const m = R.buildMatrix(sessions, { metric: 'reps', k: 2 });
  assert.deepEqual(m.subjects, ['a', 'b']); assert.deepEqual(m.matrix, [[10, 11], [20, 21]]);
  assert.equal(m.skipped.find((s) => s.userId === 'c').available, 1);
  assert.equal(R.buildMatrix(sessions, { metric: 'reps', k: 2, includeDemo: true }).subjects.length, 3);
  assert.deepEqual(R.buildMatrix(sessions, { metric: 'reps', k: 2, excludeFirst: false }).matrix[0], [100, 10]);
});
ok('ตัวชี้วัดเวลาตอบสนอง = ค่าเฉลี่ย reactionTimes', () => close(R.METRICS.reactionMs.get({ details: { reactionTimes: [400, 600] } }), 500, 1e-9));

// ---------- (ก) ความแม่นยำการนับ ----------
ok('ความแม่นยำ = 1 − |ระบบ − ผู้สังเกต| / ผู้สังเกต', () => {
  close(R.countAccuracy(9, 10), 0.9, 1e-9); close(R.countAccuracy(12, 10), 0.8, 1e-9); close(R.countAccuracy(10, 10), 1, 1e-9);
  assert.equal(R.countAccuracy(30, 10), 0); assert.equal(R.countAccuracy(0, 0), 1); assert.equal(R.countAccuracy(2, 0), 0);
  assert.equal(R.countAccuracy(NaN, 3), null);
});
ok('สรุปรวม + แยก 3 ระดับแสง: accuracy %, MAE', () => {
  const rows = [{ sys: 10, obs: 10, light: 'bright' }, { sys: 9, obs: 10, light: 'bright' }, { sys: 8, obs: 10, light: 'dim' }, { sys: 12, obs: 10, light: 'normal' }];
  const s = R.summarizeCounting(rows);
  close(s.overall.accuracyPct, (100 + 90 + 80 + 80) / 4, 1e-9); close(s.overall.mae, (0 + 1 + 2 + 2) / 4, 1e-9);
  close(s.byLight.bright.accuracyPct, 95, 1e-9); close(s.byLight.dim.mae, 2, 1e-9); assert.equal(s.byLight.normal.n, 1);
});
ok('ระดับแสงจากความสว่าง + ตรวจข้อมูลสาธิต', () => {
  assert.equal(R.lightFromBrightness(180), 'bright'); assert.equal(R.lightFromBrightness(120), 'normal'); assert.equal(R.lightFromBrightness(40), 'dim');
  assert.ok(R.isDemoSession({ details: { synthetic: true } })); assert.ok(R.isDemoSession({ delegate: 'demo-mouse' })); assert.ok(!R.isDemoSession({ delegate: 'GPU', details: {} }));
});

console.log(`\nผ่าน ${pass} ข้อ`);
