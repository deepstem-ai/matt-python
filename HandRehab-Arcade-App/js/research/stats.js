// ============================================================
// stats.js — สถิติสำหรับแผนการประเมินในบทความ §6.2 (ฟังก์ชันบริสุทธิ์ ทดสอบด้วย node ได้)
//   1) ICC ความเที่ยงของการวัดซ้ำ (test–retest) — Shrout & Fleiss (1979), เกณฑ์ Koo & Li (2016)
//   2) ความถูกต้องของการนับ: ระบบ vs ผู้สังเกตจากวิดีโอ — accuracy = 1 − |sys − obs| / obs, MAE
//   3) System Usability Scale (Brooke 1996) — คะแนน = 2.5 × [Σ(ข้อคี่ − 1) + Σ(5 − ข้อคู่)], เทียบ 68
//   4) ประสิทธิภาพ: FPS ≥ 25 · ความละเอียดของเวลาตอบสนอง = 1000 / fps (ms)
// ============================================================

const mean = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : NaN);
const sd = (a) => { if (a.length < 2) return 0; const m = mean(a); return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1)); };
export { mean, sd };

// ---------- 1) ICC ----------
// matrix = n แถว (ผู้ถูกวัด) × k คอลัมน์ (ครั้งที่วัด) ต้องครบทุกช่อง
// ANOVA สองทาง: MSR (ระหว่างคน), MSC (ระหว่างครั้ง), MSE (ความคลาดเคลื่อน)
//   ICC(2,1) absolute agreement, two-way random  = (MSR − MSE) / (MSR + (k−1)MSE + k(MSC − MSE)/n)
//   ICC(3,1) consistency, two-way mixed          = (MSR − MSE) / (MSR + (k−1)MSE)
export function icc(matrix) {
  const n = matrix.length, k = n ? matrix[0].length : 0;
  if (n < 2 || k < 2) return { n, k, icc21: NaN, icc31: NaN, error: 'ต้องมีอย่างน้อย 2 คน × 2 ครั้ง' };
  if (matrix.some((r) => r.length !== k || r.some((v) => !Number.isFinite(v)))) return { n, k, icc21: NaN, icc31: NaN, error: 'ตารางไม่ครบทุกช่อง' };
  const grand = mean(matrix.flat());
  const rowM = matrix.map(mean), colM = Array.from({ length: k }, (_, j) => mean(matrix.map((r) => r[j])));
  const ssr = k * rowM.reduce((s, m) => s + (m - grand) ** 2, 0);
  const ssc = n * colM.reduce((s, m) => s + (m - grand) ** 2, 0);
  const sst = matrix.flat().reduce((s, v) => s + (v - grand) ** 2, 0);
  const sse = sst - ssr - ssc;
  const msr = ssr / (n - 1), msc = ssc / (k - 1), mse = sse / ((n - 1) * (k - 1));
  const icc21 = (msr - mse) / (msr + (k - 1) * mse + (k * (msc - mse)) / n);
  const icc31 = (msr - mse) / (msr + (k - 1) * mse);
  return { n, k, msr, msc, mse, icc21, icc31 };
}

// เกณฑ์แปลผล Koo & Li (2016): < 0.5 ต่ำ, 0.5–0.75 ปานกลาง, 0.75–0.9 ดี, > 0.9 ดีเยี่ยม
export function iccBand(v) {
  if (!Number.isFinite(v)) return { key: 'na', th: 'คำนวณไม่ได้', en: 'n/a' };
  if (v < 0.5) return { key: 'poor', th: 'ต่ำ', en: 'poor' };
  if (v < 0.75) return { key: 'moderate', th: 'ปานกลาง', en: 'moderate' };
  if (v <= 0.9) return { key: 'good', th: 'ดี', en: 'good' };
  return { key: 'excellent', th: 'ดีเยี่ยม', en: 'excellent' };
}
export const ICC_GOOD = 0.75;           // บทความ §6.2: ICC ≥ 0.75 = ดี

// ตัวชี้วัดที่ใช้หาความเที่ยง (ค่าจากระเบียนเซสชัน)
export const ICC_METRICS = {
  maxSpreadDeg: { th: 'มุมกางนิ้วสูงสุด (องศา)', get: (s) => s.maxSpreadDeg, games: ['spread-wall'] },
  reps: { th: 'จำนวนครั้ง', get: (s) => s.reps },
  accuracy: { th: 'ความแม่นยำ (0–1)', get: (s) => s.accuracy },
  meanRt: { th: 'เวลาตอบสนองเฉลี่ย (ms)', get: (s) => s.details?.meanRtMs, games: ['rhythm-tap'] },
  score: { th: 'คะแนน', get: (s) => s.score },
};

// สร้างตาราง ผู้ใช้ × ครั้ง จากเซสชันทั้งหมด
//   - ใช้เฉพาะเกมเดียว เรียงตามเวลา · ตัดเซสชันแรกของแต่ละคนทิ้ง (ผลจากการฝึก / practice effect, Kim et al. 2025)
//   - lockedOnly: หลังตัดครั้งแรกแล้ว ใช้เฉพาะเซสชันที่ "ตรึงเกณฑ์" (session.calib.locked)
//   - ใช้ k ครั้งแรกที่มีค่า (ครั้งที่ 2..k+1) · คนที่มีไม่ครบ k ครั้งไม่นำมาคิด
export function buildIccMatrix(sessions, { game, metric = 'reps', k = 2, lockedOnly = false } = {}) {
  const get = ICC_METRICS[metric]?.get || ((s) => s[metric]);
  const byUser = new Map();
  for (const s of sessions) {
    if (game && s.game !== game) continue;
    if (s.status === 'in-progress') continue;
    if (!byUser.has(s.userId)) byUser.set(s.userId, []);
    byUser.get(s.userId).push(s);
  }
  const rows = [], users = [], skipped = [];
  for (const [uid, list] of byUser) {
    list.sort((a, b) => a.startTime - b.startTime);
    const after = list.slice(1).filter((s) => !lockedOnly || s.calib?.locked);   // ตัดครั้งแรก
    const vals = after.map(get).filter(Number.isFinite).slice(0, k);
    if (vals.length === k) { rows.push(vals); users.push(uid); } else skipped.push({ userId: uid, have: vals.length });
  }
  return { matrix: rows, users, skipped };
}

// ---------- 2) ความถูกต้องของการนับ ----------
// accuracy = 1 − |sys − obs| / obs  (obs = จำนวนที่ผู้สังเกตนับจากวิดีโอ, ค่าอ้างอิง) ตัดให้ไม่ต่ำกว่า 0
export function countAccuracy(sys, obs) {
  if (!Number.isFinite(sys) || !Number.isFinite(obs) || obs <= 0) return NaN;
  return Math.max(0, 1 - Math.abs(sys - obs) / obs);
}
export function countSummary(pairs) {
  const ok = pairs.filter((p) => Number.isFinite(p.sys) && Number.isFinite(p.obs) && p.obs > 0);
  const acc = ok.map((p) => countAccuracy(p.sys, p.obs)), err = ok.map((p) => Math.abs(p.sys - p.obs));
  return { n: ok.length, meanAcc: mean(acc), sdAcc: sd(acc), mae: mean(err) };
}
// ระดับแสงจากความสว่างเฉลี่ย 0–255 (ค่าแนะนำ ผู้ใช้เปลี่ยนเองได้)
export const LIGHT_LEVELS = { bright: 'สว่าง', normal: 'ปกติ', dim: 'มืด' };
export const lightFromBrightness = (b) => (!Number.isFinite(b) ? '' : b >= 140 ? 'bright' : b >= 80 ? 'normal' : 'dim');

// ---------- 3) SUS ----------
// answers = { sus1..sus10 } หรือ array 10 ค่า (1–5) · ข้อคี่ = เชิงบวก, ข้อคู่ = เชิงลบ
export function susScore(answers) {
  const v = Array.isArray(answers) ? answers : Array.from({ length: 10 }, (_, i) => answers?.['sus' + (i + 1)]);
  if (v.length !== 10 || v.some((x) => !Number.isFinite(x) || x < 1 || x > 5)) return NaN;
  let sum = 0;
  v.forEach((x, i) => { sum += i % 2 === 0 ? x - 1 : 5 - x; });   // i = 0 คือข้อ 1 (คี่)
  return 2.5 * sum;
}
export const SUS_BENCHMARK = 68;        // ค่าเฉลี่ยอ้างอิง (Sauro 2011; บทความ §6.2 อ้าง Acharya et al. 2025)
// การแปลผล (Bangor, Kortum & Miller 2009 / Sauro 2011)
export function susInterpret(score) {
  if (!Number.isFinite(score)) return { th: '—', key: 'na' };
  if (score > 80.3) return { th: 'ดีเยี่ยม (สูงกว่าเกณฑ์ 68 มาก)', key: 'excellent' };
  if (score >= SUS_BENCHMARK) return { th: 'ผ่าน · สูงกว่าค่าเฉลี่ย 68', key: 'good' };
  if (score >= 51) return { th: 'ต่ำกว่าค่าเฉลี่ย 68 · ควรปรับปรุง', key: 'below' };
  return { th: 'ต่ำมาก · ต้องปรับปรุงเร่งด่วน', key: 'poor' };
}

// ---------- 4) ประสิทธิภาพ ----------
export const TARGET_FPS = 25;           // บทความ §6.2: อัตราเฟรม ≥ 25 ภาพ/วินาที บนทุกแพลตฟอร์ม
export const fpsPass = (fps, target = TARGET_FPS) => Number.isFinite(fps) && fps >= target;
// ความละเอียดของเวลาตอบสนอง: ระบบเห็นท่าได้ทีละเฟรม → ผิดพลาดได้ ≈ 1 เฟรม (30 fps ≈ 33 ms)
export const timingResolutionMs = (fps) => (Number.isFinite(fps) && fps > 0 ? 1000 / fps : NaN);
