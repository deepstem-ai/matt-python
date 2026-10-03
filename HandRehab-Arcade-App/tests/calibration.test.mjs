// ทดสอบตรรกะการปรับเทียบด้วยมือจำลอง   วิธีรัน: node tests/calibration.test.mjs
import { thresholds, bestOf, classifyTremor, tremorFromSamples, scoreFromMeasure, PeakTracker, buildRecord, GESTURES } from '../js/calibration.js';
import { demoHand } from '../js/synth-hand.js';

let pass = 0, fail = 0;
const ok = (c, name) => { if (c) pass++; else { fail++; console.log('✗ FAIL', name); } };
const near = (a, b, e = 1e-6) => Math.abs(a - b) <= e;

// สูตร: จีบ rest 0.8 best 0.1 → entry 0.31 exit 0.59 · กางนิ้ว rest 15° best 50° → entry 39.5 exit 25.5
let th = thresholds(0.8, 0.1); ok(near(th.entry, 0.31) && near(th.exit, 0.59), 'สูตรเกณฑ์จีบ');
th = thresholds(15, 50); ok(near(th.entry, 39.5) && near(th.exit, 25.5), 'สูตรเกณฑ์กางนิ้ว');
ok(near(bestOf([0.2, 0.1, 0.12, 0.5, 0.14], 0.8), 0.12), 'best = เฉลี่ย 3 ครั้งที่ดีที่สุด (ค่าน้อยดี)');
ok(near(bestOf([40, 50, 48, 20, 46], 15), 48), 'best = เฉลี่ย 3 ครั้งที่ดีที่สุด (ค่ามากดี)');
// คะแนน: entry → 0.7, exit → 0.35
const cal = { entry: 0.31, exit: 0.59 };
ok(near(scoreFromMeasure(0.31, cal), 0.7) && near(scoreFromMeasure(0.59, cal), 0.35) && scoreFromMeasure(0.05, cal) === 1 && scoreFromMeasure(1.2, cal) === 0, 'แปลงค่าดิบ → คะแนน');
// ระดับอาการสั่นจากมือจำลองแต่ละระดับ
for (let lv = 0; lv < 4; lv++) {
  const s = []; for (let i = 0; i < 150; i++) { const t = i / 30; s.push({ t, sq: demoHand(t, { tremorLevel: lv }) }); }
  const sd = tremorFromSamples(s);
  ok(classifyTremor(sd).lv === lv, `มือจำลองระดับ ${lv} → วัดได้ ${sd.toFixed(4)} = ระดับ ${classifyTremor(sd).lv}`);
}
// มือค่อย ๆ ตก (drift) ไม่ถือว่าสั่น
const drift = []; for (let i = 0; i < 150; i++) { const t = i / 30; drift.push({ t, sq: demoHand(0, {}).map((p) => ({ ...p, y: p.y + 0.02 * t })) }); }
ok(classifyTremor(tremorFromSamples(drift)).lv === 0, 'มือเลื่อนช้า ๆ ไม่นับเป็นอาการสั่น');
// ตรวจจับ 5 ครั้งของการจีบ
const G = GESTURES.pinch, rest = G.measure(demoHand(0, {}));
const pt = new PeakTracker(rest, G.expectBest);
for (let r = 0; r < 5; r++) for (let i = 0; i <= 40; i++) pt.update(G.measure(demoHand(0, { amount: Math.sin((i / 40) * Math.PI) * (0.8 + r * 0.05) })));
ok(pt.peaks.length === 5, 'นับได้ 5 ครั้ง ได้ ' + pt.peaks.length);
const rec = buildRecord({ userId: 'u1', gesture: 'pinch', rest, peaks: pt.peaks, tremorSd: 0.08, source: 'demo' });
ok(rec.id === 'u1:pinch' && rec.tremorLevel === 3 && rec.grabRadius === 100 && rec.filter.minCutoff < 0.5 && rec.entry < rec.exit && rec.exit < rest, 'ระเบียน: สั่นมาก → รัศมี 100 กรองแรง');
ok(buildRecord({ userId: 'u1', gesture: 'pinch', rest, peaks: pt.peaks, tremorSd: 0.005 }).grabRadius === 60, 'ไม่สั่น → รัศมีมาตรฐาน 60');

console.log(`\nผ่าน ${pass} / ${pass + fail}`);
if (fail) process.exit(1);
