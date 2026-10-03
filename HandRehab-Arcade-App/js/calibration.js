// ============================================================
// calibration.js — ปรับเทียบรายบุคคล: วัดอาการสั่น + ค่าเกณฑ์ของท่า (Lab 27) · บทความ §4.4
// สมการ (8): T = r − k (r − b), 0 < k < 1   (ใช้กับ "ค่าดิบ" ของท่า เช่น ระยะจีบ d̂48 หรือมุมกางนิ้วองศา)
//   entry (เริ่มนับว่าทำท่า) = r − k_on  × (r − b), k_on  = 0.7 → ต้องไปให้ถึง 70% ของความสามารถตัวเอง
//   exit  (นับว่าปล่อยท่า)  = r − k_off × (r − b), k_off = 0.3 → ถอยกลับมาเหลือ 30% ของทาง
//   r (rest) = ค่าตอนมือพักนิ่ง = d_open ของสมการ (3), b (best) = ค่าที่ดีที่สุดตอนออกแรงเต็มที่ = d_close
//   (best = เฉลี่ย 3 ครั้งที่ดีที่สุดจาก 5) ใช้ได้ทั้งท่าที่ "ค่าน้อย = ดี" (จีบ) และ "ค่ามาก = ดี" (กางนิ้ว)
//   เพราะเครื่องหมายของ (r − b) จัดการให้เอง
// สมการ (3): π = clip((r − m)/(r − b), 0, 1) → π(T) = k พอดี ดังนั้นเกณฑ์ในหน่วยคะแนน
//   θ_on = k_on = 0.7 และ θ_off = k_off = 0.3 เท่ากันทุกคน (สมการ (7) ใช้ค่าคู่นี้)
// กฎการวัดผล: เมื่อใช้ระบบ "วัดผล" ต้องตรึงเกณฑ์ (ตรึงเกณฑ์ = locked) เพื่อเทียบผลข้ามวันได้
// ============================================================
import { normDist, spread, palmScale } from './geometry.js';
import { get, put, getByIndex } from './db.js';

export const ENTRY_K = 0.7, EXIT_K = 0.3;          // k_on, k_off ของสมการ (8)
export const THETA_ON = ENTRY_K, THETA_OFF = EXIT_K; // θ_on, θ_off ของสมการ (7) ในหน่วยคะแนน π (เพราะ π(T) = k)
export const STILL_SEC = 5, REPS_NEEDED = 5;

// ท่าที่ปรับเทียบได้: measure(sq) = ค่าดิบ, expectBest = ค่าคาดเดาไว้ใช้ตรวจจับครั้ง (ก่อนรู้ค่าจริง)
export const GESTURES = {
  pinch: { th: 'จีบนิ้ว', icon: '🤏', unit: '× ขนาดฝ่ามือ', dec: 3, expectBest: 0.15, measure: (sq) => normDist(sq, 4, 8),
    how: 'แตะปลายนิ้วโป้งกับปลายนิ้วชี้ให้ชิดที่สุด แล้วแยกออก' },
  open: { th: 'กางนิ้ว', icon: '🖐️', unit: 'องศา', dec: 1, expectBest: 50, measure: (sq) => spread(sq, 'index', 'little'),
    how: 'กางนิ้วทุกนิ้วให้กว้างที่สุดโดยไม่เจ็บ แล้วหุบกลับ' },
};

// อาการสั่น 4 ระดับ (SD ของตำแหน่งปลายนิ้วชี้ หารด้วยขนาดฝ่ามือ) + ค่าที่ใช้ในเกม
export const TREMOR_LEVELS = [
  { lv: 0, th: 'ไม่มีอาการสั่น', max: 0.02, grabRadius: 60, filter: { minCutoff: 1.5, beta: 0.8 } },
  { lv: 1, th: 'สั่นเล็กน้อย', max: 0.04, grabRadius: 70, filter: { minCutoff: 1.0, beta: 0.5 } },
  { lv: 2, th: 'สั่นปานกลาง', max: 0.07, grabRadius: 85, filter: { minCutoff: 0.6, beta: 0.4 } },
  { lv: 3, th: 'สั่นมาก', max: Infinity, grabRadius: 100, filter: { minCutoff: 0.3, beta: 0.3 } },
];
export const classifyTremor = (sd) => TREMOR_LEVELS.find((l) => sd < l.max) || TREMOR_LEVELS[3];

const mean = (a) => a.reduce((s, v) => s + v, 0) / (a.length || 1);
export const median = (a) => { const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length ? (s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2) : NaN; };
// ตัดแนวโน้มเส้นตรงออก (มือค่อย ๆ ตก/เลื่อนช้า ๆ ไม่ใช่อาการสั่น) แล้วหา SD ของส่วนที่เหลือ
function detrendedSd(ts, vs) {
  const n = vs.length; if (n < 3) return 0;
  const mt = mean(ts), mv = mean(vs);
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (ts[i] - mt) * (vs[i] - mv); den += (ts[i] - mt) ** 2; }
  const k = den ? num / den : 0;
  const res = vs.map((v, i) => v - (mv + k * (ts[i] - mt)));
  return Math.sqrt(res.reduce((s, r) => s + r * r, 0) / (n - 1));
}
// samples = [{ t, sq }] ตอนถือมือนิ่ง → SD ของตำแหน่งปลายนิ้วชี้ (หน่วย: ขนาดฝ่ามือ)
export function tremorFromSamples(samples) {
  const ok = samples.filter((s) => s.sq);
  if (ok.length < 10) return null;
  const scale = median(ok.map((s) => palmScale(s.sq)));
  const ts = ok.map((s) => s.t), xs = ok.map((s) => s.sq[8].x / scale), ys = ok.map((s) => s.sq[8].y / scale);
  return Math.hypot(detrendedSd(ts, xs), detrendedSd(ts, ys));
}

// สมการ (8): เกณฑ์รายบุคคลในหน่วยค่าดิบ
export function thresholds(rest, best) {
  return { entry: rest - ENTRY_K * (rest - best), exit: rest - EXIT_K * (rest - best) };
}
// ค่าที่ดีที่สุดของท่า: เฉลี่ย 3 ครั้งที่ดีที่สุด (กันครั้งเดียวที่ค่ากระโดดผิดปกติ)
export function bestOf(peaks, rest) {
  const lowerBetter = peaks.length ? mean(peaks) < rest : true;
  const s = [...peaks].sort((a, b) => (lowerBetter ? a - b : b - a));
  return mean(s.slice(0, Math.min(3, s.length)));
}

// สมการ (3): แปลงค่าดิบของท่า m → คะแนน π = clip((r − m)/(r − b), 0, 1) โดย r = d_open (rest), b = d_close (best)
// 1 = ทำท่าได้เต็มความสามารถ, 0 = มือพัก · ใช้ได้ทุกทิศทาง (ค่าน้อย = ดี หรือค่ามาก = ดี)
// ผลที่ตามมา: m = entry → π = 0.7 = θ_on และ m = exit → π = 0.3 = θ_off
export function scoreFromMeasure(m, cal) {
  if (!cal || !Number.isFinite(cal.rest) || !Number.isFinite(cal.best) || cal.rest === cal.best) return 0;
  return Math.max(0, Math.min(1, (cal.rest - m) / (cal.rest - cal.best)));
}

// ค่าเริ่มต้นเมื่อยังไม่ปรับเทียบ (จีบนิ้ว): d_open = 0.80, d_close = 0.25 (ตรงกับ GESTURE_CONFIG.pinch ใน gestures.js)
export const DEFAULT_PINCH = { rest: 0.8, best: 0.25 };

// ภาพถ่ายค่าปรับเทียบที่ใช้ในเซสชันนี้ (เก็บลงระเบียนเซสชันเป็น session.calib)
// เก็บไว้เพื่อให้ตรวจย้อนหลังได้ว่าแต่ละเซสชันใช้เกณฑ์ชุดไหน และเกณฑ์ถูกตรึงไว้หรือไม่
export function calibSnapshot(cal, gesture = 'pinch') {
  const src = cal || (gesture === 'pinch' ? { ...DEFAULT_PINCH, source: 'default' } : null);
  if (!src) return null;
  const rest = src.rest ?? src.min, best = src.best ?? src.max;     // ระเบียน spread-wall เก็บ min/max
  if (!Number.isFinite(rest) || !Number.isFinite(best)) return null;
  const th = thresholds(rest, best);
  return { gesture: src.gesture || gesture, rest, best, entry: src.entry ?? th.entry, exit: src.exit ?? th.exit,
    thetaOn: THETA_ON, thetaOff: THETA_OFF, locked: !!src.locked, calibratedAt: cal ? src.at ?? null : null,
    source: cal ? src.source || 'calibration' : 'default' };
}

// ตัวตรวจจับ "ครั้ง" ระหว่างขั้น 3 (ยังไม่รู้ค่า best จริง ใช้ความคืบหน้าเทียบกับค่าคาดเดา)
export class PeakTracker {
  constructor(rest, expectBest) { this.rest = rest; this.span = expectBest - rest; this.inRep = false; this.peak = null; this.peaks = []; }
  progress(m) { return this.span ? (m - this.rest) / this.span : 0; }
  better(a, b) { return this.span < 0 ? a < b : a > b; }
  // ป้อนค่าดิบหนึ่งค่า คืน peak ถ้าเพิ่งจบหนึ่งครั้ง
  // ค่าคงที่ตรวจจับเฉพาะขั้นนี้ (ไม่ใช่เกณฑ์วัดผล): เริ่มครั้งเมื่อคืบหน้า ≥ 35% ของค่าคาดเดา, จบครั้งเมื่อกลับมา < 15%
  // ตั้งให้หลวมกว่า θ_on/θ_off เพราะยังไม่รู้ค่า best จริงของผู้ใช้ (ใช้ expectBest ประมาณไว้ก่อน)
  update(m) {
    const p = this.progress(m);
    if (!this.inRep && p >= 0.35) { this.inRep = true; this.peak = m; }
    else if (this.inRep) {
      if (this.better(m, this.peak)) this.peak = m;
      if (p < 0.15) { this.inRep = false; this.peaks.push(this.peak); return this.peak; }
    }
    return null;
  }
  // ปุ่ม "นับครั้งนี้" สำหรับคนที่ทำได้ไม่ถึงเกณฑ์ตรวจจับ
  forceCount(recent) { const pk = recent.reduce((a, b) => (this.better(b, a) ? b : a)); this.peaks.push(pk); this.inRep = false; return pk; }
}

// ประกอบระเบียนสำหรับบันทึก  id = userId + ':' + gesture
export function buildRecord({ userId, gesture, rest, peaks, tremorSd, source }) {
  const best = bestOf(peaks, rest), lv = classifyTremor(tremorSd ?? 0), th = thresholds(rest, best);
  return { id: userId + ':' + gesture, userId, gesture, rest, best, peaks, entry: th.entry, exit: th.exit,
    entryK: ENTRY_K, exitK: EXIT_K, tremorSd, tremorLevel: lv.lv, grabRadius: lv.grabRadius, filter: { ...lv.filter, dCutoff: 1 },
    thetaOn: THETA_ON, thetaOff: THETA_OFF, locked: false, source, at: Date.now() };
}
export async function saveCalibration(rec) { return put('calibration', rec); }
// ตรึงเกณฑ์ / ปลดล็อก (ใช้ได้กับทุกระเบียนใน store calibration รวมทั้ง spread-wall)
export async function setCalibrationLock(userId, gesture, locked) {
  const rec = await get('calibration', userId + ':' + gesture);
  if (!rec) throw new Error('ยังไม่มีค่าปรับเทียบของท่านี้');
  rec.locked = !!locked; rec.lockedAt = locked ? Date.now() : null;
  await put('calibration', rec);
  return rec;
}
export async function listCalibrations(userId) {
  try { return await getByIndex('calibration', 'userId', userId); } catch (e) { console.warn('[calibration] อ่านรายการไม่ได้', e); return []; }
}
export async function loadCalibration(userId, gesture = 'pinch') {
  try { return (await get('calibration', userId + ':' + gesture)) || null; } catch (e) { console.warn('[calibration] โหลดไม่ได้', e); return null; }
}
