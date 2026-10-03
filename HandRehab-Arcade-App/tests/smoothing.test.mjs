// ทดสอบตัวกรองสัญญาณด้วยเวลาจำลอง (ไม่อ่านนาฬิกาจริง)   วิธีรัน: node tests/smoothing.test.mjs
import { OneEuroFilter, MovingAverage, MedianFilter, PointFilter, smoothingAlpha, jitter, jitterReduction, lagMs, stepDelayMs } from '../js/smoothing.js';
import { makeShakySignal, benchmark } from '../js/signal.js';

let pass = 0, fail = 0;
const ok = (c, name) => { if (c) pass++; else { fail++; console.log('✗ FAIL', name); } };
const near = (a, b, e = 1e-9) => Math.abs(a - b) <= e;

// α ตามสูตรในเปเปอร์: τ = 1/(2π fc), α = 1/(1+τ/dt)
ok(near(smoothingAlpha(1, 1 / 30), 1 / (1 + (1 / (2 * Math.PI)) * 30)), 'สูตร alpha');
// ค่าแรกผ่านตรง ๆ
const f = new OneEuroFilter({ freq: 30, minCutoff: 1, beta: 0 });
ok(f.filter(5, 0) === 5, 'ค่าแรกของ One Euro = ค่าที่ป้อน');
// ค่าคงที่ → ผลคงที่
let y; for (let i = 1; i < 60; i++) y = f.filter(5, i / 30);
ok(near(y, 5), 'ค่าคงที่ได้ค่าคงที่');
// ใช้เวลาจากพารามิเตอร์: dt ต่างกัน ผลต่างกัน (ไม่ได้อ่านนาฬิกา)
const a = new OneEuroFilter({ minCutoff: 1, beta: 0 }), b = new OneEuroFilter({ minCutoff: 1, beta: 0 });
a.filter(0, 0); b.filter(0, 0);
ok(a.filter(1, 0.01) < b.filter(1, 0.5), 'dt ยาวกว่า → ตามทันมากกว่า (เวลามาจากพารามิเตอร์)');
// เวลาไม่เดิน/ย้อน ไม่พัง
const c = new OneEuroFilter(); c.filter(1, 1); ok(Number.isFinite(c.filter(2, 1)) && Number.isFinite(c.filter(3, 0.5)), 'dt = 0 หรือติดลบไม่ได้ NaN');
// beta: เคลื่อนเร็ว → ตามทันกว่า beta = 0
ok(stepDelayMs(() => new OneEuroFilter({ minCutoff: 1, beta: 2 })) < stepDelayMs(() => new OneEuroFilter({ minCutoff: 1, beta: 0 })), 'beta มากขึ้น = หน่วงน้อยลงตอนเคลื่อนเร็ว');
// minCutoff ต่ำ → นิ่งกว่า
const sig = makeShakySignal({ seed: 3 });
const run = (flt) => { const raw = [], out = []; for (let i = 0; i < 300; i++) { const t = i / 30, x = sig.at(t); raw.push(x); out.push(flt.filter(x, t)); } return { raw, out }; };
const lo = run(new OneEuroFilter({ minCutoff: 0.3, beta: 0.5 })), hi = run(new OneEuroFilter({ minCutoff: 3, beta: 0.5 }));
ok(jitter(lo.out) < jitter(hi.out), 'minCutoff ต่ำ = สั่นน้อยกว่า');
ok(jitterReduction(lo.raw, lo.out) > 40, 'One Euro ลดความสั่นได้ > 40%');
// ค่าเฉลี่ยเคลื่อนที่
const ma = new MovingAverage(5); [1, 2, 3, 4, 5, 6].forEach((v, i) => (y = ma.filter(v, i)));
ok(near(y, 4), 'MA(5) ของ 2..6 = 4');
// มัธยฐาน ตัดค่ากระโดด
const md = new MedianFilter(5); [1, 1, 100, 1, 1].forEach((v, i) => (y = md.filter(v, i)));
ok(y === 1, 'มัธยฐานตัดค่ากระโดด 100 ทิ้ง');
const md2 = new MedianFilter(4); [1, 2, 3, 4].forEach((v, i) => (y = md2.filter(v, i)));
ok(y === 2.5, 'มัธยฐานจำนวนคู่');
// ความหน่วงด้วย cross-correlation: เลื่อนสัญญาณ 3 เฟรม → 100 ms
const raw = Array.from({ length: 200 }, (_, i) => Math.sin(i / 7)), shifted = raw.map((_, i) => raw[Math.max(0, i - 3)]);
ok(near(lagMs(raw, shifted, 1 / 30), 100, 1), 'lagMs หาความหน่วง 3 เฟรม = 100 ms');
// PointFilter 2 มิติ
const pf = new PointFilter({ minCutoff: 1, beta: 0 }); const p = pf.filter({ x: 1, y: 2 }, 0);
ok(p.x === 1 && p.y === 2, 'PointFilter ค่าแรก');
// reset
f.reset(); ok(f.filter(9, 100) === 9, 'reset แล้วเริ่มใหม่');
// ตารางเปรียบเทียบ
const table = benchmark({ minCutoff: 1, beta: 0.5, n: 5 });
console.table(table.map(({ name, jitterPct, lagMs, stepMs }) => ({ name, 'ลดสั่น %': jitterPct, 'หน่วง ms (xcorr)': lagMs, 'ขั้นบันได 90% ms': stepMs })));
ok(table.length === 3 && table.every((r) => Number.isFinite(r.jitterPct) && r.lagMs >= 0), 'benchmark ได้ 3 แถว');

console.log(`\nผ่าน ${pass} / ${pass + fail}`);
if (fail) process.exit(1);
