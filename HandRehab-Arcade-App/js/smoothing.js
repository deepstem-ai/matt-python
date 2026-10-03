// ============================================================
// smoothing.js — ตัวกรองสัญญาณ 3 แบบ สำหรับลดอาการมือสั่น (Lab 27)
//   OneEuroFilter  — Casiez, Roussel & Vogel (CHI 2012) "1€ Filter: A Simple Speed-based
//                    Low-pass Filter for Noisy Input in Interactive Systems" · gery.casiez.net/1euro
//   MovingAverage  — ค่าเฉลี่ย N ค่าล่าสุด (ไว้เปรียบเทียบ)
//   MedianFilter   — มัธยฐาน N ค่าล่าสุด (ไว้เปรียบเทียบ)
// กฎ: ทุกตัว "รับเวลาเป็นพารามิเตอร์" filter(value, tSeconds) ห้ามอ่านนาฬิกาเอง → ทดสอบด้วยเวลาจำลองได้
// ============================================================

// ตัวกรองความถี่ต่ำพื้นฐาน (exponential smoothing): y = α·x + (1−α)·y_ก่อนหน้า
class LowPass {
  constructor() { this.y = null; }
  filter(x, alpha) { this.y = this.y === null ? x : alpha * x + (1 - alpha) * this.y; return this.y; }
  reset() { this.y = null; }
}

// α จากความถี่ตัด (Hz) และช่วงเวลา dt (วินาที):  τ = 1/(2π·fc),  α = 1 / (1 + τ/dt)
export function smoothingAlpha(cutoff, dt) {
  const tau = 1 / (2 * Math.PI * cutoff);
  return 1 / (1 + tau / dt);
}

// ------------------------------------------------------------
// One Euro Filter
//   freq      = ความถี่สัญญาณโดยประมาณ (Hz) ใช้ตอนเฟรมแรก/เวลาไม่เดิน
//   minCutoff = ความถี่ตัดต่ำสุด (Hz) ยิ่งน้อย ยิ่งนิ่งตอนมือช้า (แต่หน่วงขึ้น)
//   beta      = ความไวต่อความเร็ว ยิ่งมาก ยิ่งตามทันตอนมือเร็ว
//   dCutoff   = ความถี่ตัดของ "ความเร็ว" (ปกติ 1 Hz)
// หลักการ: fc = minCutoff + beta·|ความเร็วที่กรองแล้ว|  → ช้า = กรองแรง, เร็ว = กรองเบา
// ------------------------------------------------------------
export class OneEuroFilter {
  constructor({ freq = 30, minCutoff = 1.0, beta = 0.007, dCutoff = 1.0 } = {}) {
    Object.assign(this, { freq, minCutoff, beta, dCutoff });
    this.x = new LowPass(); this.dx = new LowPass(); this.lastT = null; this.lastRaw = null;
  }
  setParams(p) { Object.assign(this, p); }
  reset() { this.x.reset(); this.dx.reset(); this.lastT = null; this.lastRaw = null; }
  filter(value, t) {
    let dt = this.lastT === null ? 1 / this.freq : t - this.lastT;
    if (!(dt > 0)) dt = 1 / this.freq;                       // เวลาไม่เดิน/ย้อน → ใช้ความถี่ที่ตั้งไว้
    this.lastT = t;
    const dValue = this.lastRaw === null ? 0 : (value - this.lastRaw) / dt;   // ความเร็วดิบ
    this.lastRaw = value;
    const edx = this.dx.filter(dValue, smoothingAlpha(this.dCutoff, dt));   // ความเร็วที่กรองแล้ว
    const cutoff = this.minCutoff + this.beta * Math.abs(edx);
    return this.x.filter(value, smoothingAlpha(cutoff, dt));
  }
}

// ------------------------------------------------------------
// ค่าเฉลี่ยเคลื่อนที่ N ค่าล่าสุด (t รับไว้ให้หน้าตาเหมือนกัน แต่ไม่ได้ใช้)
// ------------------------------------------------------------
export class MovingAverage {
  constructor(n = 5) { this.n = n; this.buf = []; }
  reset() { this.buf = []; }
  // eslint-disable-next-line no-unused-vars
  filter(value, t) {
    this.buf.push(value);
    if (this.buf.length > this.n) this.buf.shift();
    return this.buf.reduce((a, b) => a + b, 0) / this.buf.length;
  }
}

// ------------------------------------------------------------
// มัธยฐาน N ค่าล่าสุด — ตัดค่ากระโดดผิดปกติ (outlier) ได้ดีกว่าค่าเฉลี่ย
// ------------------------------------------------------------
export class MedianFilter {
  constructor(n = 5) { this.n = n; this.buf = []; }
  reset() { this.buf = []; }
  // eslint-disable-next-line no-unused-vars
  filter(value, t) {
    this.buf.push(value);
    if (this.buf.length > this.n) this.buf.shift();
    const s = [...this.buf].sort((a, b) => a - b), m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }
}

// กรองจุด 2 มิติ (x, y) ด้วย One Euro แยกแกน — ใช้กับตัวชี้ปลายนิ้วในเกม
export class PointFilter {
  constructor(params) { this.fx = new OneEuroFilter(params); this.fy = new OneEuroFilter(params); }
  setParams(p) { this.fx.setParams(p); this.fy.setParams(p); }
  reset() { this.fx.reset(); this.fy.reset(); }
  filter(p, t) { return { x: this.fx.filter(p.x, t), y: this.fy.filter(p.y, t) }; }
}

// ---------------- ตัวชี้วัดสำหรับเปรียบเทียบ ----------------
export function std(a) {
  if (a.length < 2) return 0;
  const m = a.reduce((s, v) => s + v, 0) / a.length;
  return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1));
}
// ความสั่น = ส่วนเบี่ยงเบนมาตรฐานของผลต่างระหว่างเฟรม (first difference)
export const jitter = (a) => std(a.slice(1).map((v, i) => v - a[i]));
// ลดความสั่นได้กี่ % เทียบกับสัญญาณดิบ
export const jitterReduction = (raw, filtered) => { const j = jitter(raw); return j ? 100 * (1 - jitter(filtered) / j) : 0; };

// ความหน่วง (ms) ด้วย cross-correlation: เลื่อนสัญญาณที่กรองแล้วย้อนกลับ k เฟรม หา k ที่ตรงกับสัญญาณดิบที่สุด
export function lagMs(raw, filtered, dtSec, maxShift = 30) {
  const n = Math.min(raw.length, filtered.length);
  if (n < maxShift + 10) return 0;
  const mr = raw.slice(0, n).reduce((s, v) => s + v, 0) / n, mf = filtered.slice(0, n).reduce((s, v) => s + v, 0) / n;
  let best = 0, bestK = 0;
  for (let k = 0; k <= maxShift; k++) {
    let s = 0;
    for (let i = k; i < n; i++) s += (filtered[i] - mf) * (raw[i - k] - mr);
    s /= n - k;
    if (s > best) { best = s; bestK = k; }
  }
  return bestK * dtSec * 1000;
}

// ความหน่วงแบบขั้นบันได: เวลาที่ตัวกรองใช้ไปถึง 90% ของการกระโดด (ms)
export function stepDelayMs(makeFilter, { from = 0, to = 1, freq = 30, seconds = 2 } = {}) {
  const f = makeFilter(), dt = 1 / freq;
  for (let i = 0; i < freq; i++) f.filter(from, i * dt);               // นิ่งก่อน 1 วินาที
  const t0 = freq * dt;
  for (let i = 0; i < seconds * freq; i++) {
    const y = f.filter(to, t0 + i * dt);
    if (Math.abs(y - from) >= 0.9 * Math.abs(to - from)) return Math.round(i * dt * 1000);
  }
  return Math.round(seconds * 1000);
}
