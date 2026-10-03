// ทดสอบแบบจำลองคณิตศาสตร์ตามบทความ สมการ (1)–(10) + สถิติแผนการประเมิน §6.2
// เทียบผลจากโค้ดจริงกับสูตรที่คำนวณตรง ๆ ในไฟล์นี้   วิธีรัน: node tests/math-model.test.mjs
import { palmScale, normDist, dist } from '../js/geometry.js';
import { detectPinch, GESTURE_CONFIG } from '../js/gestures.js';
import { smoothingAlpha, OneEuroFilter } from '../js/smoothing.js';
import { RepCounter } from '../js/rep-counter.js';
import { thresholds, scoreFromMeasure, ENTRY_K, EXIT_K, THETA_ON, THETA_OFF, calibSnapshot } from '../js/calibration.js';
import { cosineSimilarity } from '../js/face-embed.js';
import { eyeAspectRatio, EYE_RIGHT, EYE_LEFT } from '../js/face-login.js';
import { icc, iccBand, susScore, susInterpret, countAccuracy, countSummary, buildIccMatrix, timingResolutionMs, fpsPass } from '../js/research/stats.js';

let pass = 0, fail = 0;
const ok = (c, name) => { if (c) { pass++; console.log('  ✓', name); } else { fail++; console.log('  ✗ FAIL', name); } };
const near = (a, b, e = 1e-9) => Math.abs(a - b) <= e;
const clip = (v) => Math.max(0, Math.min(1, v));

// มือทดสอบ: ข้อมือ (0,0,0), โคนนิ้วกลาง p9 = (0, 2, 0) → s = 2 · นิ้วชี้เหยียดตรงเป็นเส้นเดียวกับข้อมือ (งอ = 0)
function hand(d) {
  const pts = Array.from({ length: 21 }, (_, i) => ({ x: 0.1 * i - 1, y: 0.05 * i, z: 0.01 * i }));
  pts[0] = { x: 0, y: 0, z: 0 }; pts[9] = { x: 0, y: 2, z: 0 };
  [[5, 0.6, 1.8], [6, 0.8, 2.4], [7, 1.0, 3.0], [8, 1.2, 3.6]].forEach(([i, x, y]) => { pts[i] = { x, y, z: 0 }; });
  pts[4] = { x: 1.2 + d * 2, y: 3.6, z: 0 };            // ระยะ 4–8 = 2d → หารด้วย s = 2 ได้ d̂48 = d
  return pts;
}

console.log('สมการ (1)–(2) ขนาดฝ่ามือ และระยะที่หารด้วยขนาดฝ่ามือ');
const H = hand(0.5);
ok(near(palmScale(H), Math.hypot(0 - 0, 2 - 0, 0)), '(1) s = ‖p0 − p9‖ = 2');
ok(near(normDist(H, 4, 8), dist(H[4], H[8]) / 2) && near(normDist(H, 4, 8), 0.5), '(2) d̂48 = ‖p4 − p8‖ / s = 0.5');
const big = H.map((p) => ({ x: p.x * 3, y: p.y * 3, z: p.z * 3 }));
ok(near(normDist(big, 4, 8), normDist(H, 4, 8)), '(2) มือใกล้กล้อง 3 เท่า ได้ d̂ เท่าเดิม');

console.log('สมการ (3) คะแนนจีบ π');
const c = GESTURE_CONFIG.pinch;
ok(c.zero === 0.8 && c.full === 0.25, 'ค่าเริ่มต้น d_open = 0.80, d_close = 0.25');
for (const d of [0.1, 0.25, 0.4, 0.6, 0.8, 1.0]) ok(near(detectPinch(hand(d)).score, clip((0.8 - d) / (0.8 - 0.25)), 1e-9), `(3) ไม่ปรับเทียบ d̂ = ${d} → π = ${clip((0.8 - d) / 0.55).toFixed(3)}`);
const cal = { rest: 0.9, best: 0.15 };
for (const m of [0.1, 0.3, 0.5, 0.9, 1.1]) ok(near(scoreFromMeasure(m, cal), clip((0.9 - m) / (0.9 - 0.15))), `(3) ปรับเทียบ d_open = r = 0.9, d_close = b = 0.15, m = ${m}`);

console.log('สมการ (4)–(6) One Euro Filter');
for (const [fc, Te] of [[1, 1 / 30], [0.3, 1 / 60], [5, 0.1]]) ok(near(smoothingAlpha(fc, Te), 1 / (1 + 1 / (2 * Math.PI * fc * Te)), 1e-12), `(4) α = 1/(1 + 1/(2π·${fc}·${Te.toFixed(4)}))`);
{ // เทียบทั้งลำดับกับการคำนวณตรงตามสมการ (4)(5)(6)
  const P = { freq: 30, minCutoff: 1.2, beta: 0.4, dCutoff: 1 }, f = new OneEuroFilter(P);
  const a = (fc, T) => 1 / (1 + 1 / (2 * Math.PI * fc * T));
  let xh = null, dxh = null, prev = null, tPrev = null, okAll = true;
  for (let i = 0; i < 90; i++) {
    const t = i / 30 + (i % 3) * 0.002, x = Math.sin(i / 7) + (i % 5) * 0.03;
    const Te = tPrev === null ? 1 / P.freq : t - tPrev; tPrev = t;
    const dx = prev === null ? 0 : (x - prev) / Te; prev = x;
    dxh = dxh === null ? dx : a(P.dCutoff, Te) * dx + (1 - a(P.dCutoff, Te)) * dxh;        // ẋ̂ กรองด้วย d_cutoff
    const fc = P.minCutoff + P.beta * Math.abs(dxh);                                      // (6)
    xh = xh === null ? x : a(fc, Te) * x + (1 - a(fc, Te)) * xh;                           // (4)+(5)
    if (!near(f.filter(x, t), xh, 1e-12)) okAll = false;
  }
  ok(okAll, '(5)(6) ผลของ OneEuroFilter ตรงกับสมการทุกเฟรม (90 เฟรม)');
}

console.log('สมการ (7) ประตูสองบาน + cooldown');
ok(new RepCounter().cooldownMs === 400 && new RepCounter().enter === 0.7 && new RepCounter().exit === 0.3, 'ค่าเริ่มต้น θ_on 0.7 / θ_off 0.3 / cooldown 400 ms');
{
  const rc = new RepCounter({ enter: 0.7, exit: 0.3, minHoldMs: 0, cooldownMs: 400 });
  rc.update(0.7, 0); rc.update(0.7, 10);
  ok(rc.state === 'held', 'held ⇔ π ≥ θ_on (π = 0.7 พอดี เข้าท่า)');
  rc.update(0.31, 20);
  ok(rc.count === 0 && rc.state === 'releasing', 'π = 0.31 > θ_off ยังไม่นับ');
  const rep = rc.update(0.3, 30);
  ok(rep && rc.count === 1, 'release ⇔ π ≤ θ_off (π = 0.3 พอดี นับ 1 ครั้ง)');
  for (let t = 40; t < 430; t += 10) rc.update(t % 20 ? 0.9 : 0.1, t);
  ok(rc.count === 1, 'ภายใน 400 ms หลังนับ ไม่นับซ้ำ');
  rc.update(0.0, 440); rc.update(0.9, 450); rc.update(0.9, 460); rc.update(0.2, 470);
  ok(rc.count === 2, 'พ้น cooldown 400 ms แล้วนับครั้งถัดไปได้');
  ok(['idle', 'engaging', 'held', 'releasing', 'cooldown'].includes(rc.state), 'ใช้ 5 สถานะ');
}

console.log('สมการ (8) เกณฑ์รายบุคคล และ π(T) = k');
for (const [r, b] of [[0.8, 0.1], [0.95, 0.3], [15, 50]]) {
  const th = thresholds(r, b);
  ok(near(th.entry, r - 0.7 * (r - b)) && near(th.exit, r - 0.3 * (r - b)), `(8) T = r − k(r − b) r=${r} b=${b}`);
  ok(near(scoreFromMeasure(th.entry, { rest: r, best: b }), ENTRY_K, 1e-12) && near(scoreFromMeasure(th.exit, { rest: r, best: b }), EXIT_K, 1e-12), `π(T_on) = 0.7, π(T_off) = 0.3 (r=${r} b=${b})`);
}
ok(THETA_ON === 0.7 && THETA_OFF === 0.3 && THETA_ON > THETA_OFF, 'θ_on = k_on = 0.7 > θ_off = k_off = 0.3');
{
  const snap = calibSnapshot({ rest: 0.8, best: 0.2, entry: 0.38, exit: 0.62, locked: true, at: 123, source: 'camera' });
  ok(snap.locked === true && snap.calibratedAt === 123 && snap.thetaOn === 0.7 && snap.thetaOff === 0.3 && snap.rest === 0.8, 'ภาพถ่ายเกณฑ์ (ตรึงเกณฑ์) เก็บ rest/best/entry/exit/θ/locked/calibratedAt');
  ok(calibSnapshot(null, 'pinch').rest === 0.8 && calibSnapshot(null, 'pinch').best === 0.25 && calibSnapshot(null, 'pinch').locked === false, 'ไม่ปรับเทียบ → ภาพถ่ายใช้ d_open 0.80 / d_close 0.25');
}

console.log('สมการ (9) ความคล้ายโคไซน์');
{
  const A = [1, 2, 3, 4], B = [2, 1, 4, 3];
  const direct = A.reduce((s, v, i) => s + v * B[i], 0) / (Math.hypot(...A) * Math.hypot(...B));
  ok(near(cosineSimilarity(A, B), direct, 1e-12), '(9) cos θ = A·B / (‖A‖‖B‖)');
  ok(cosineSimilarity([1, 0], [-1, 0]) === 0 && near(cosineSimilarity([3, 4], [6, 8]), 1), 'ค่าลบถูกตัดเป็น 0 (แสดงผล 0..1) · ทิศเดียวกัน = 1');
}

console.log('สมการ (10) EAR');
{
  const pts = Array.from({ length: 400 }, () => ({ x: 0, y: 0 }));
  const set = (idx, P) => idx.forEach((k, i) => { pts[k] = { x: P[i][0], y: P[i][1] }; });
  const eye = [[0, 0], [1, -0.3], [2, -0.35], [3, 0], [2, 0.32], [1, 0.28]];   // p1..p6
  set(EYE_RIGHT, eye); set(EYE_LEFT, eye);
  const d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const direct = (d(eye[1], eye[5]) + d(eye[2], eye[4])) / (2 * d(eye[0], eye[3]));
  ok(near(eyeAspectRatio(pts, EYE_RIGHT), direct, 1e-12) && near(eyeAspectRatio(pts, EYE_LEFT), direct, 1e-12), `(10) EAR = (‖p2−p6‖ + ‖p3−p5‖)/(2‖p1−p4‖) = ${direct.toFixed(3)}`);
  ok(EYE_RIGHT.join() === '33,160,158,133,153,144' && EYE_LEFT.join() === '362,385,387,263,373,380', 'จุดรอบตาตรงตามบทความ');
}

console.log('§6.2 ICC (Shrout & Fleiss 1979, 6 คน × 4 ผู้ประเมิน)');
{
  const r = icc([[9, 2, 5, 8], [6, 1, 3, 2], [8, 4, 6, 8], [7, 1, 2, 6], [10, 5, 6, 9], [6, 2, 4, 7]]);
  ok(near(r.icc21, 0.29, 0.005), `ICC(2,1) = ${r.icc21.toFixed(3)} ≈ 0.29`);
  ok(near(r.icc31, 0.71, 0.005), `ICC(3,1) = ${r.icc31.toFixed(3)} ≈ 0.71`);
  ok(iccBand(0.49).key === 'poor' && iccBand(0.6).key === 'moderate' && iccBand(0.8).key === 'good' && iccBand(0.95).key === 'excellent', 'เกณฑ์ Koo & Li 2016');
  const S = [];
  for (const u of ['a', 'b', 'c']) for (let k = 0; k < 4; k++) S.push({ userId: u, game: 'spread-wall', startTime: k, maxSpreadDeg: k === 0 ? 0 : { a: 30, b: 40, c: 50 }[u] + k, calib: { locked: k >= 2 } });
  const m = buildIccMatrix(S, { game: 'spread-wall', metric: 'maxSpreadDeg', k: 2 });
  ok(m.matrix.length === 3 && m.matrix.every((row) => row[0] !== 0 && row.length === 2), 'ตัดเซสชันแรกของแต่ละคนออก');
  ok(buildIccMatrix(S, { game: 'spread-wall', metric: 'maxSpreadDeg', k: 2, lockedOnly: true }).matrix[0][0] === 32, 'กรองเฉพาะเซสชันเกณฑ์ตรึง');
}

console.log('§6.2 SUS / ความถูกต้องการนับ / FPS');
ok(susScore(Array(10).fill(3)) === 50, 'SUS ตอบ 3 ทุกข้อ = 50');
ok(susScore([5, 1, 5, 1, 5, 1, 5, 1, 5, 1]) === 100 && susScore([1, 5, 1, 5, 1, 5, 1, 5, 1, 5]) === 0, 'SUS ดีที่สุด = 100, แย่ที่สุด = 0');
ok(susScore({ sus1: 4, sus2: 2, sus3: 4, sus4: 2, sus5: 4, sus6: 2, sus7: 4, sus8: 2, sus9: 4, sus10: 2 }) === 75 && susInterpret(75).key === 'good' && susInterpret(60).key === 'below', 'SUS 75 ผ่านเกณฑ์ 68');
ok(near(countAccuracy(18, 20), 0.9) && near(countAccuracy(22, 20), 0.9) && near(countSummary([{ sys: 18, obs: 20 }, { sys: 20, obs: 20 }]).mae, 1), 'accuracy = 1 − |sys − obs|/obs, MAE');
ok(Math.round(timingResolutionMs(30)) === 33 && fpsPass(25) && !fpsPass(24.9), 'ความละเอียดเวลา 1000/30 ≈ 33 ms · FPS ≥ 25 ผ่าน');

console.log(`\nผ่าน ${pass} / ${pass + fail}`);
if (fail) process.exit(1);
