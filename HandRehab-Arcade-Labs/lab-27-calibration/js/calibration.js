// ============================================================
// calibration.js — ปรับเทียบรายบุคคล: วัดอาการสั่น + ค่าเกณฑ์ของท่า (Lab 27)
// สูตรเกณฑ์ (ใช้กับ "ค่าดิบ" ของท่า เช่น ระยะจีบ normDist(4,8) หรือมุมกางนิ้วองศา):
//   entry (เริ่มนับว่าทำท่า) = rest − 0.7 × (rest − best)   → ต้องไปให้ถึง 70% ของความสามารถตัวเอง
//   exit  (นับว่าปล่อยท่า)  = rest − 0.3 × (rest − best)   → ถอยกลับมา 70% ของทาง
//   rest = ค่าตอนมือพักนิ่ง, best = ค่าที่ดีที่สุดตอนออกแรงเต็มที่ (เฉลี่ย 3 ครั้งที่ดีที่สุดจาก 5)
//   ใช้ได้ทั้งท่าที่ "ค่าน้อย = ดี" (จีบ) และ "ค่ามาก = ดี" (กางนิ้ว) เพราะเครื่องหมายของ (rest − best) จัดการให้เอง
// บทความ: สมการ (8) T = r − k(r − b), 0 < k < 1 โดย k_on = 0.7 (entry), k_off = 0.3 (exit)
//   คะแนนใช้สมการ (3) โดย d_open = r (rest), d_close = b (best) → π(T) = k พอดี
//   จึงได้เกณฑ์ในหน่วยคะแนน θ_on = 0.7, θ_off = 0.3 เท่ากันทุกคน (ใช้กับสมการ (7) ตัวนับประตูสองบาน)
// กฎการวัดผล: เมื่อใช้ระบบ "วัด" (งานวิจัย) ต้อง "ตรึงเกณฑ์" (locked = true) เพื่อให้ผลแต่ละวันเทียบกันได้
// ============================================================
import { normDist, spread, palmScale } from './geometry.js';
import { get, put } from './db.js';

export const ENTRY_K = 0.7, EXIT_K = 0.3;       // k_on, k_off ของสมการ (8)
export const THETA_ON = ENTRY_K, THETA_OFF = EXIT_K; // θ_on, θ_off ของสมการ (7) ในหน่วยคะแนน π
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

export function thresholds(rest, best) {
  return { entry: rest - ENTRY_K * (rest - best), exit: rest - EXIT_K * (rest - best) };
}
// ค่าที่ดีที่สุดของท่า: เฉลี่ย 3 ครั้งที่ดีที่สุด (กันครั้งเดียวที่ค่ากระโดดผิดปกติ)
export function bestOf(peaks, rest) {
  const lowerBetter = peaks.length ? mean(peaks) < rest : true;
  const s = [...peaks].sort((a, b) => (lowerBetter ? a - b : b - a));
  return mean(s.slice(0, Math.min(3, s.length)));
}

// แปลงค่าดิบของท่า → คะแนน 0..1 ด้วยสมการ (3):
//   π = clip( (r − m) / (r − b), 0, 1 )   (d_open = r = ค่าพัก, d_close = b = ค่าดีที่สุด)
//   m = entry → π = 0.7 (θ_on) และ m = exit → π = 0.3 (θ_off) พอดี ตามเอกลักษณ์ π(T) = k ของสมการ (8)
//   ท่ากางนิ้ว (ค่ามาก = ดี) ใช้สูตรเดียวกันได้ เพราะ r − b ติดลบ เครื่องหมายหักล้างกันเอง
export function scoreFromMeasure(m, cal) {
  if (!cal) return 0;
  const r = cal.rest, b = cal.best;
  if (!Number.isFinite(r) || !Number.isFinite(b) || r === b) return 0;
  return Math.max(0, Math.min(1, (r - m) / (r - b)));
}

// ภาพถ่ายเกณฑ์ (snapshot) สำหรับแนบไปกับทุกเซสชัน — ย้อนดูได้ว่ารอบนั้นใช้เกณฑ์อะไร และตรึงไว้หรือไม่
export function thresholdSnapshot(cal) {
  return cal
    ? { thetaOn: THETA_ON, thetaOff: THETA_OFF, dOpen: cal.rest, dClose: cal.best, entry: cal.entry, exit: cal.exit,
        locked: !!cal.locked, lockedAt: cal.lockedAt ?? null, calibratedAt: cal.at ?? null, source: 'calibration' }
    : { thetaOn: THETA_ON, thetaOff: THETA_OFF, dOpen: 0.8, dClose: 0.25, locked: false, source: 'default' };
}

// ตรึง / ปลดเกณฑ์ ของระเบียนที่บันทึกไว้ (locked = ห้ามปรับเทียบทับจนกว่าจะยืนยันปลด)
export async function setCalibrationLock(rec, locked) {
  rec.locked = !!locked;
  if (locked) rec.lockedAt = Date.now(); else rec.unlockedAt = Date.now();
  await saveCalibration(rec);
  return rec;
}

// ตัวตรวจจับ "ครั้ง" ระหว่างขั้น 3 (ยังไม่รู้ค่า best จริง ใช้ความคืบหน้าเทียบกับค่าคาดเดา)
export class PeakTracker {
  constructor(rest, expectBest) { this.rest = rest; this.span = expectBest - rest; this.inRep = false; this.peak = null; this.peaks = []; }
  progress(m) { return this.span ? (m - this.rest) / this.span : 0; }
  better(a, b) { return this.span < 0 ? a < b : a > b; }
  // ป้อนค่าดิบหนึ่งค่า คืน peak ถ้าเพิ่งจบหนึ่งครั้ง
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
    entryK: ENTRY_K, exitK: EXIT_K, locked: false, tremorSd, tremorLevel: lv.lv, grabRadius: lv.grabRadius, filter: { ...lv.filter, dCutoff: 1 },
    source, at: Date.now() };
}
export async function saveCalibration(rec) { return put('calibration', rec); }
export async function loadCalibration(userId, gesture = 'pinch') {
  try { return (await get('calibration', userId + ':' + gesture)) || null; } catch (e) { console.warn('[calibration] โหลดไม่ได้', e); return null; }
}
