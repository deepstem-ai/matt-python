// ทดสอบ ml.js ด้วยมือจำลอง (ไม่ต้องใช้กล้อง/เบราว์เซอร์)  วิธีรัน: node tests/knn.test.mjs
import assert from 'node:assert/strict';
import { extractFeatures, KNNClassifier, FEATURE_COUNT, distance } from '../js/ml.js';
import { synthHand, variedHand, PRESETS, makeRng } from '../js/synth-hand.js';

let pass = 0;
const ok = (name, fn) => { fn(); pass++; console.log('✓', name); };

ok('ได้ตัวเลข 25 ตัว และเป็นตัวเลขจริงทุกตัว', () => {
  const f = extractFeatures(synthHand({ spread: 12 }));
  assert.equal(f.length, FEATURE_COUNT); assert.equal(FEATURE_COUNT, 25);
  assert.ok(f.every(Number.isFinite));
});
ok('ไม่ขึ้นกับขนาดมือ/ตำแหน่ง (หารด้วยขนาดฝ่ามือแล้ว)', () => {
  const a = extractFeatures(synthHand({ scale: 0.1, cx: 0.3 })), b = extractFeatures(synthHand({ scale: 0.35, cx: 0.7 }));
  assert.ok(distance(a, b) < 1e-6, 'distance ' + distance(a, b));
});
ok('จุดไม่ครบ 21 จุด → error ภาษาไทย', () => assert.throws(() => extractFeatures([]), /21/));

// ฝึกด้วย seed หนึ่ง ทดสอบด้วยอีก seed (ข้อมูลทดสอบไม่ซ้ำกับข้อมูลฝึก)
const knn = new KNNClassifier();
const train = makeRng(1), test = makeRng(999);
for (const [name, p] of Object.entries(PRESETS)) for (let i = 0; i < 30; i++) knn.addExample(extractFeatures(variedHand(p, train)), name);
ok('นับตัวอย่างต่อท่าได้ 30', () => assert.deepEqual(Object.values(knn.counts()), Array(6).fill(30)));

let correct = 0, total = 0;
for (const [name, p] of Object.entries(PRESETS)) for (let i = 0; i < 20; i++) {
  const r = knn.predict(extractFeatures(variedHand(p, test)), 5);
  total++; if (r.label === name) correct++;
}
ok(`ทายถูกอย่างน้อย 80% กับข้อมูลใหม่ (ได้ ${correct}/${total})`, () => assert.ok(correct / total >= 0.8));
ok('predict คืน label, confidence 0-1 และเพื่อนบ้าน 5 ตัวเรียงจากใกล้ไปไกล', () => {
  const r = knn.predict(extractFeatures(variedHand(PRESETS['กำมือ'], test)), 5);
  assert.equal(r.neighbours.length, 5);
  assert.ok(r.confidence > 0 && r.confidence <= 1);
  for (let i = 1; i < 5; i++) assert.ok(r.neighbours[i].distance >= r.neighbours[i - 1].distance);
});
ok('k = 3, 5, 7 ใช้ได้ทั้งหมด', () => [3, 5, 7].forEach((k) => assert.equal(knn.predict(extractFeatures(synthHand({})), k).neighbours.length, k)));
ok('โมเดลว่าง → label null', () => assert.equal(new KNNClassifier().predict(new Array(25).fill(0)).label, null));
ok('export / import JSON ได้โมเดลเดิม', () => {
  const k2 = new KNNClassifier().importJSON(knn.exportJSON());
  assert.equal(k2.size, knn.size);
  const f = extractFeatures(variedHand(PRESETS['จีบนิ้ว'], test));
  assert.deepEqual(k2.predict(f), knn.predict(f));
});
ok('import ไฟล์ผิดรูปแบบ → error', () => assert.throws(() => new KNNClassifier().importJSON('{"examples":[{"f":[1,2],"label":"x"}],"featureCount":2}'), /25/));
ok('clear(label) ลบเฉพาะท่านั้น', () => {
  assert.equal(knn.clear('ร็อก'), 30);
  assert.ok(!knn.labels().includes('ร็อก')); assert.equal(knn.size, 150);
});
ok('addExample ไม่มีชื่อ → error', () => assert.throws(() => knn.addExample(new Array(25).fill(0), '  ')));

// SHOULD: เทียบ k 3 ค่า
for (const k of [1, 3, 5, 7]) {
  let c = 0, n = 0; const r2 = makeRng(4242);
  for (const [name, p] of Object.entries(PRESETS)) { if (name === 'ร็อก') continue; for (let i = 0; i < 20; i++) { n++; if (knn.predict(extractFeatures(variedHand(p, r2, { noise: 0.3 })), k).label === name) c++; } }
  console.log(`  k=${k}: ความแม่นยำกับข้อมูลมีสัญญาณรบกวนสูง = ${(100 * c / n).toFixed(1)}%`);
}
console.log(`\nผ่าน ${pass} ข้อ`);
