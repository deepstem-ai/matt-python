// ทดสอบ evaluate.js / discussion.js / โหมดจำลอง   วิธีรัน: node tests/evaluate.test.mjs
import assert from 'node:assert/strict';
import * as E from '../js/evaluate.js';
import { discussionTH } from '../js/discussion.js';
import { simulateTrials, ruleDetect, buildDemoModel } from '../js/detectors.js';
import { synthHand } from '../js/synth-hand.js';

let pass = 0;
const ok = (name, fn) => { fn(); pass++; console.log('✓', name); };
const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≠ ${b}`);

// ตัวอย่างคำนวณมือ: A ขอ 4 ครั้ง (ถูก 3, เป็น B 1), B ขอ 4 ครั้ง (ถูก 2, เป็น A 1, none 1)
const labels = ['A', 'B'];
const T = (r, d, c = 'normal') => ({ requested: r, detected: d, condition: c });
const trials = [T('A', 'A'), T('A', 'A'), T('A', 'A'), T('A', 'B'), T('B', 'B'), T('B', 'B'), T('B', 'A'), T('B', 'none')];
const cm = E.confusionMatrix(trials, labels);

ok('เมทริกซ์ความสับสนถูกต้อง (มีคอลัมน์ none)', () => { assert.deepEqual(cm.cols, ['A', 'B', 'none']); assert.deepEqual(cm.m, [[3, 1, 0], [1, 2, 1]]); });
ok('accuracy = 5/8', () => close(E.accuracy(cm), 5 / 8));
const per = E.perClass(cm);
ok('precision/recall/F1 ของ A = 3/4, 3/4, 0.75', () => { close(per[0].precision, 0.75); close(per[0].recall, 0.75); close(per[0].f1, 0.75); });
ok('precision/recall/F1 ของ B = 2/3, 2/4, 4/7', () => { close(per[1].precision, 2 / 3); close(per[1].recall, 0.5); close(per[1].f1, 4 / 7); });
ok('macro = ค่าเฉลี่ยของทุกท่า', () => { const m = E.macro(per); close(m.precision, (0.75 + 2 / 3) / 2); close(m.recall, 0.625); });
ok('ท่าที่ระบบไม่เคยทายเลย → precision 0 และ defined=false', () => {
  const p = E.perClass(E.confusionMatrix([T('A', 'none'), T('B', 'B')], labels));
  assert.equal(p[0].precision, 0); assert.equal(p[0].defined, false);
});
ok('ท่าที่ไม่รู้จักถูกนับเป็น none', () => assert.deepEqual(E.confusionMatrix([T('A', 'Z')], labels).m[0], [0, 0, 1]));
ok('ไม่มีข้อมูล → accuracy 0 ไม่ error', () => assert.equal(E.accuracy(E.confusionMatrix([], labels)), 0));
ok('majority: เสียงข้างมาก / null = none / เสมอเลือกล่าสุด', () => {
  assert.equal(E.majority(['A', 'A', 'B']), 'A');
  assert.equal(E.majority([null, null, 'A']), 'none');
  assert.equal(E.majority(['A', 'B']), 'B');
  assert.equal(E.majority([]), 'none');
});
ok('makeSchedule: ทุกท่า n ครั้ง', () => { const s = E.makeSchedule(['a', 'b', 'c'], 10); assert.equal(s.length, 30); assert.equal(s.filter((x) => x === 'b').length, 10); });
ok('byCondition แยกความแม่นยำและความสว่าง', () => {
  const r = E.byCondition([{ ...T('A', 'A', 'bright'), brightness: 200 }, { ...T('A', 'B', 'dim'), brightness: 40 }, { ...T('A', 'A', 'dim'), brightness: 50 }]);
  assert.equal(r[0].accuracy, 1); assert.equal(r[2].accuracy, 0.5); assert.equal(r[2].meanBrightness, 45); assert.equal(r[1].accuracy, null);
});
ok('topConfusion หาคู่ที่สับสนที่สุด', () => assert.deepEqual(E.topConfusion(cm), { requested: 'A', detected: 'B', count: 1 }));
ok('ruleDetect: กำมือ → fist, แบมือ → open, ไม่มีมือ → null', () => {
  assert.equal(ruleDetect(synthHand({ curls: { index: 1, middle: 1, ring: 1, little: 1, thumb: 0.6 } })), 'fist');
  assert.equal(ruleDetect(synthHand({ spread: 17 })), 'open');
  assert.equal(ruleDetect(null), null);
});
for (const det of ['rule', 'knn']) {
  const { labels: L, trials: tr } = simulateTrials({ detector: det, nPer: 10, model: det === 'knn' ? buildDemoModel() : undefined });
  const s = E.summarise(tr, L), bc = E.byCondition(tr);
  ok(`จำลอง ${det}: 3 สภาพแสง × ${L.length} ท่า × 10 = ${tr.length} ครั้ง, แสงมืดแม่นน้อยกว่าแสงสว่าง (${bc.map((c) => (c.accuracy * 100).toFixed(0)).join('/')}%)`, () => {
    assert.equal(tr.length, 3 * L.length * 10); assert.ok(bc[2].accuracy < bc[0].accuracy);
  });
  ok(`ย่อหน้าอภิปรายมีตัวเลขจริง (${det})`, () => {
    const t = discussionTH(s, bc, { hypothesis: '2', detector: det, simulated: true });
    assert.ok(t.includes((s.accuracy * 100).toFixed(1) + '%')); assert.ok(t.includes('สมมติฐานข้อที่ 2')); assert.ok(t.includes('โหมดจำลอง'));
    if (det === 'rule') console.log('\n' + t + '\n');
  });
}
console.log(`ผ่าน ${pass} ข้อ`);
