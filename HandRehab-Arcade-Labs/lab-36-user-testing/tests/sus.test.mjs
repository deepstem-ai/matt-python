// ทดสอบการคิดคะแนน SUS   วิธีรัน: node tests/sus.test.mjs
import assert from 'node:assert/strict';
import { SUS_ITEMS, SUS_SCALE, susScore, susSummary, demoSusSurveys, SUS_BENCHMARK } from '../js/sus.js';

const ans = (arr) => Object.fromEntries(SUS_ITEMS.map((q, i) => [q.id, arr[i]]));
let n = 0; const ok = (name, fn) => { fn(); n++; console.log('✓', name); };
ok('มี 10 ข้อ มาตร 1–5 เกณฑ์ 68', () => { assert.equal(SUS_ITEMS.length, 10); assert.deepEqual(SUS_SCALE.map((s) => s.v), [1, 2, 3, 4, 5]); assert.equal(SUS_BENCHMARK, 68); });
ok('ตอบ 3 ทุกข้อ → 50', () => assert.equal(susScore(ans(Array(10).fill(3))), 50));
ok('คำตอบอุดมคติ (คี่ = 5, คู่ = 1) → 100', () => assert.equal(susScore(ans([5, 1, 5, 1, 5, 1, 5, 1, 5, 1])), 100));
ok('คำตอบแย่สุด (คี่ = 1, คู่ = 5) → 0', () => assert.equal(susScore(ans([1, 5, 1, 5, 1, 5, 1, 5, 1, 5])), 0));
ok('สูตร 2.5 × [Σ(คี่ − 1) + Σ(5 − คู่)] ตัวอย่างผสม', () => {
  const a = [4, 2, 5, 2, 4, 1, 4, 2, 4, 3]; // คี่: 3+4+3+3+3 = 16, คู่: 3+3+4+3+2 = 15 → 2.5 × 31 = 77.5
  assert.equal(susScore(ans(a)), 77.5);
});
ok('ตอบไม่ครบ / นอกช่วง → null', () => { assert.equal(susScore({ sus1: 3 }), null); assert.equal(susScore(ans([6, 1, 5, 1, 5, 1, 5, 1, 5, 1])), null); });
ok('ค่าเฉลี่ย ± SD และเทียบ 68', () => {
  const S = susSummary([{ participant: 'A', answers: ans(Array(10).fill(3)) }, { participant: 'B', answers: ans([5, 1, 5, 1, 5, 1, 5, 1, 5, 1]) }, { participant: 'C', answers: { sus1: 2 } }]);
  assert.equal(S.n, 2); assert.equal(S.mean, 75); assert.ok(Math.abs(S.sd - 35.3553) < 1e-3); assert.equal(S.aboveBenchmark, true);
  assert.equal(susSummary(demoSusSurveys()).n, 5);
});
console.log(`\nผ่าน ${n} ข้อ`);
