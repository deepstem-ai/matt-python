// ============================================================
// counter-sim.js — สัญญาณจำลอง 3 แบบ + ตัวนับแบบเกณฑ์เดียว (ไว้เปรียบเทียบ) (Lab 21)
// ฟังก์ชันบริสุทธิ์ทั้งหมด: เวลาเป็น "เวลาจำลอง" ที่สร้างขึ้นเอง ไม่อ่านนาฬิกาจริง
// ใช้ได้ทั้งในหน้าเว็บและใน node (tests/rep-counter.test.mjs)
// ============================================================
import { RepCounter } from './rep-counter.js';

// ตัวสุ่มที่กำหนด seed ได้ → สุ่มแล้วได้ผลเดิมทุกครั้ง (ทดลองซ้ำได้ ตรวจสอบได้)
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const SIGNALS = {
  clean: { th: 'คลื่นสะอาด 10 รอบ', expect: 10 },
  noisy: { th: 'คลื่นเดิม + สัญญาณรบกวน', expect: 10 },
  flat: { th: 'แกว่ง 0.45–0.55 ตลอด', expect: 0 },
};

// สร้างสัญญาณ [{ t (ms), s (0-1) }] ที่ 60 เฟรม/วินาที
//   clean: s = 0.5 − 0.5·cos(2πt/T) 10 รอบ รอบละ T = 2 วินาที (มีช่วงพัก 0.5 วินาทีหัวท้าย)
//   noisy: clean + สุ่มสม่ำเสมอ ±noise (ค่าเริ่มต้น ±0.15)
//   flat : 0.5 + 0.05·sin(2πt/180ms) + สุ่มเล็กน้อย บีบให้อยู่ใน 0.45–0.55 นาน 20 วินาที
export function makeSignal(kind, { seed = 1, fps = 60, cycles = 10, periodMs = 2000, noise = 0.15 } = {}) {
  const rnd = mulberry32(seed), dt = 1000 / fps, out = [];
  const lead = 500, dur = kind === 'flat' ? 20000 : cycles * periodMs + 2 * lead;
  for (let t = 0; t <= dur; t += dt) {
    let s;
    if (kind === 'flat') {
      s = 0.5 + 0.05 * Math.sin((2 * Math.PI * t) / 180) + (rnd() - 0.5) * 0.02;
      s = Math.max(0.45, Math.min(0.55, s));
    } else {
      const u = t - lead;
      s = u < 0 || u > cycles * periodMs ? 0 : 0.5 - 0.5 * Math.cos((2 * Math.PI * u) / periodMs);
      if (kind === 'noisy') s += (rnd() - 0.5) * 2 * noise;
      s = Math.max(0, Math.min(1, s));
    }
    out.push({ t: Math.round(t * 100) / 100, s });
  }
  return out;
}

// ตัวนับแบบ "เกณฑ์เดียว" (วิธีที่ผิด) — นับทุกครั้งที่ค่าข้ามเกณฑ์ขึ้นไป
// สัญญาณสั่นรอบเกณฑ์นิดเดียวก็นับรัว ๆ นี่คือปัญหาที่ Lab 21 แก้
export class NaiveCounter {
  constructor(threshold = 0.5) { this.threshold = threshold; this.reset(); }
  reset() { this.count = 0; this.above = false; this.times = []; }
  update(s, t) {
    const now = s >= this.threshold;
    const hit = now && !this.above;
    if (hit) { this.count++; this.times.push(t); }
    this.above = now;
    return hit;
  }
}

// รันสัญญาณหนึ่งแบบผ่านตัวนับทั้งสองแบบ คืนผลพร้อมตัดสิน ผ่าน/ไม่ผ่าน
// cfg = { enter, exit, minHoldMs, cooldownMs }, naiveTh = เกณฑ์ของตัวนับเกณฑ์เดียว
export function runSim(kind, cfg, { naiveTh = 0.5, seed = 1, samples = null } = {}) {
  const sig = samples || makeSignal(kind, { seed });
  const rc = new RepCounter(cfg);
  const naive = new NaiveCounter(naiveTh);
  const states = new Set();
  for (const { t, s } of sig) { rc.update(s, t); naive.update(s, t); states.add(rc.state); }
  const expect = SIGNALS[kind].expect;
  return { kind, samples: sig, reps: rc.reps, count: rc.count, naiveCount: naive.count, naiveTimes: naive.times, expect, pass: rc.count === expect, states: [...states] };
}

// การทดลอง: ช่องว่างระหว่างสองประตูแคบลง ความผิดพลาดเพิ่มขึ้นเท่าไร (สัญญาณมี noise, หลาย seed)
// คอลัมน์ gateOnly = ใช้แค่สองประตู (ไม่มี minHold / cooldown) เพื่อแยกผลของ "ช่องว่าง" ล้วน ๆ
export function gapExperiment({ enter = 0.7, gaps = [0, 0.05, 0.1, 0.15, 0.2, 0.3, 0.4], seeds = 20, minHoldMs = 200, cooldownMs = 400 } = {}) {
  const trial = (exit, hold, cool) => {
    let err = 0, exact = 0;
    for (let sd = 1; sd <= seeds; sd++) {
      const r = runSim('noisy', { enter, exit, minHoldMs: hold, cooldownMs: cool }, { seed: sd });
      err += Math.abs(r.count - 10); if (r.count === 10) exact++;
    }
    return { mae: +(err / seeds).toFixed(2), exact: Math.round((100 * exact) / seeds) };
  };
  return gaps.map((gap) => {
    const exit = +(enter - gap).toFixed(2) - (gap === 0 ? 1e-9 : 0); // gap 0 = เกณฑ์เดียว (exit ต้องน้อยกว่า enter นิดเดียว)
    const g = trial(exit, 0, 0), a = trial(exit, minHoldMs, cooldownMs);
    return { gap, exit: +exit.toFixed(2), gateOnlyError: g.mae, gateOnlyExactPct: g.exact, allRulesError: a.mae, allRulesExactPct: a.exact };
  });
}
