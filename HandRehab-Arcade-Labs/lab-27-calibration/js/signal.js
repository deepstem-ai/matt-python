// ============================================================
// signal.js — สัญญาณมือสั่นจำลอง + ตารางเปรียบเทียบตัวกรอง (Lab 27)
// ใช้สาธิตเมื่อไม่มีกล้อง และใช้ทำ "ตารางเปรียบเทียบ 3 ตัวกรอง" ที่ทำซ้ำได้ทุกครั้ง (seed คงที่)
// ============================================================
import { OneEuroFilter, MovingAverage, MedianFilter, jitterReduction, lagMs, stepDelayMs } from './smoothing.js';

// ตัวสุ่มที่กำหนด seed ได้ (mulberry32) → ผลเหมือนเดิมทุกครั้ง
export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
// สุ่มแบบระฆังคว่ำ (Gaussian) จากตัวสุ่มสม่ำเสมอ (Box–Muller)
const gauss = (r) => Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(2 * Math.PI * r());

// สร้างฟังก์ชันสัญญาณ x(t) หน่วย "ความกว้างจอ 0-1"
//   การเคลื่อนไหวตั้งใจ: แกว่งช้า ๆ 0.2 Hz + ย้ายตำแหน่งแบบขั้นบันไดทุก 4 วินาที
//   อาการสั่น: คลื่นไซน์ tremorHz (อาการสั่นแบบพาร์กินสัน 4-6 Hz, สั่นทั่วไป 8-12 Hz) + สัญญาณรบกวนของกล้อง
export function makeShakySignal({ seed = 7, tremorAmp = 0.02, tremorHz = 6, noise = 0.004 } = {}) {
  const r = rng(seed);
  const phase = r() * Math.PI * 2;
  return {
    intended: (t) => 0.5 + 0.18 * Math.sin(2 * Math.PI * 0.2 * t) + (Math.floor(t / 4) % 2 ? 0.12 : -0.12),
    at(t) { return this.intended(t) + tremorAmp * Math.sin(2 * Math.PI * tremorHz * t + phase) * (0.7 + 0.3 * Math.sin(t)) + noise * gauss(r); },
  };
}

// ตัวกรองทั้งหมดที่เปรียบเทียบ (ค่าเริ่มต้นตรงกับหน้า filters.html)
export function makeFilters({ minCutoff = 1.0, beta = 0.5, n = 5, freq = 30 } = {}) {
  return {
    oneEuro: new OneEuroFilter({ freq, minCutoff, beta, dCutoff: 1 }),
    movingAvg: new MovingAverage(n),
    median: new MedianFilter(n),
  };
}
export const FILTER_TH = { raw: 'ดิบ (ไม่กรอง)', oneEuro: 'One Euro', movingAvg: `ค่าเฉลี่ยเคลื่อนที่`, median: 'มัธยฐาน' };

// ตารางเปรียบเทียบแบบออฟไลน์: 20 วินาที 30 fps  คืน [{ key, name, jitterPct, lagMs, stepMs }]
export function benchmark(params = {}, sig = {}) {
  const freq = params.freq || 30, dt = 1 / freq, s = makeShakySignal(sig);
  const f = makeFilters(params), out = { raw: [], oneEuro: [], movingAvg: [], median: [] };
  for (let i = 0; i < 20 * freq; i++) {
    const t = i * dt, x = s.at(t);
    out.raw.push(x);
    for (const k of Object.keys(f)) out[k].push(f[k].filter(x, t));
  }
  const mk = { oneEuro: () => makeFilters(params).oneEuro, movingAvg: () => makeFilters(params).movingAvg, median: () => makeFilters(params).median };
  return ['oneEuro', 'movingAvg', 'median'].map((k) => ({
    key: k, name: FILTER_TH[k] + (k === 'oneEuro' ? '' : ` (N=${params.n || 5})`),
    jitterPct: +jitterReduction(out.raw, out[k]).toFixed(1),
    lagMs: Math.round(lagMs(out.raw, out[k], dt)),
    stepMs: stepDelayMs(mk[k], { freq }),
  }));
}
