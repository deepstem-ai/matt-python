// ============================================================
// research.js — เครื่องมือนักวิจัยตามแผนการประเมินในบทความ (หัวข้อ 6.2) · Lab 32
//   (ก) ความแม่นยำการนับ: จำนวนครั้งที่ระบบนับ เทียบกับผู้สังเกตนับจากวิดีโอ ภายใต้แสง 3 ระดับ
//   (ข) ความเชื่อมั่นแบบทดสอบซ้ำ (test–retest): ICC(2,1) และ ICC(3,1) ตัดเซสชันแรกออก (ผลจากการฝึกหัด)
// ฟังก์ชันบริสุทธิ์ทั้งหมด ห้ามแตะกล้อง หน้าจอ ฐานข้อมูล → ทดสอบใน node ได้
// ============================================================
export const LIGHTS = ['bright', 'normal', 'dim'];
export const LIGHT_TH = { bright: 'สว่าง', normal: 'ปกติ', dim: 'มืด' };

// เดาระดับแสงจากความสว่างเฉลี่ยที่วัดจากภาพกล้อง (0-255) — ผู้วิจัยแก้เองได้ในตาราง
export function lightFromBrightness(b) {
  if (!Number.isFinite(b)) return 'normal';
  return b >= 150 ? 'bright' : b >= 80 ? 'normal' : 'dim';
}

// เซสชันจำลอง/สาธิต (ห้ามใช้เป็นผลวิจัย) — ข้อมูลตัวอย่าง 30 วัน, โหมดเมาส์/คีย์บอร์ด, มือจำลอง
export function isDemoSession(s) {
  const d = s?.details || {};
  return !!(s?.synthetic || d.synthetic || d.demo || /demo/i.test(s?.delegate || ''));
}

// ---------------- (ก) ความแม่นยำการนับ ----------------
// ความแม่นยำต่อเซสชัน = 1 − |ระบบ − ผู้สังเกต| / ผู้สังเกต (ตัดไม่ให้ต่ำกว่า 0)
// ผู้สังเกตนับได้ 0: ถ้าระบบก็ 0 = แม่นยำ 1, ไม่งั้น = 0
export function countAccuracy(sys, obs) {
  if (!Number.isFinite(sys) || !Number.isFinite(obs) || obs < 0) return null;
  if (obs === 0) return sys === 0 ? 1 : 0;
  return Math.max(0, 1 - Math.abs(sys - obs) / obs);
}

function summaryOf(rows) {
  const ok = rows.filter((r) => Number.isFinite(r.sys) && Number.isFinite(r.obs));
  if (!ok.length) return { n: 0, accuracyPct: null, mae: null, totalSys: 0, totalObs: 0 };
  const acc = ok.map((r) => countAccuracy(r.sys, r.obs));
  const mae = ok.reduce((s, r) => s + Math.abs(r.sys - r.obs), 0) / ok.length;
  return {
    n: ok.length,
    accuracyPct: (100 * acc.reduce((a, b) => a + b, 0)) / ok.length,  // ค่าเฉลี่ยความแม่นยำรายเซสชัน (%)
    mae,                                                                // ค่าคลาดเคลื่อนสัมบูรณ์เฉลี่ย (ครั้ง)
    totalSys: ok.reduce((s, r) => s + r.sys, 0), totalObs: ok.reduce((s, r) => s + r.obs, 0),
  };
}
// rows = [{ sys, obs, light }] → { overall, byLight: { bright, normal, dim } }
export function summarizeCounting(rows) {
  const byLight = Object.fromEntries(LIGHTS.map((l) => [l, summaryOf(rows.filter((r) => r.light === l))]));
  return { overall: summaryOf(rows), byLight };
}

// ---------------- (ข) ICC ----------------
// เมทริกซ์ n คน × k ครั้ง (ไม่มีช่องว่าง) → ICC ตาม Shrout & Fleiss (1979)
//   SSR = k Σ(ค่าเฉลี่ยแถว − GM)²  SSC = n Σ(ค่าเฉลี่ยคอลัมน์ − GM)²  SSE = SST − SSR − SSC
//   MSR = SSR/(n−1)  MSC = SSC/(k−1)  MSE = SSE/((n−1)(k−1))
//   ICC(2,1) absolute agreement, two-way random = (MSR − MSE) / (MSR + (k−1)MSE + k(MSC − MSE)/n)
//   ICC(3,1) consistency, two-way mixed         = (MSR − MSE) / (MSR + (k−1)MSE)
export function icc(matrix) {
  const n = matrix.length, k = matrix[0]?.length || 0;
  if (n < 2 || k < 2 || matrix.some((r) => r.length !== k || r.some((v) => !Number.isFinite(v)))) return null;
  const all = matrix.flat(), gm = all.reduce((a, b) => a + b, 0) / all.length;
  const rowM = matrix.map((r) => r.reduce((a, b) => a + b, 0) / k);
  const colM = Array.from({ length: k }, (_, j) => matrix.reduce((s, r) => s + r[j], 0) / n);
  const ssr = k * rowM.reduce((s, m) => s + (m - gm) ** 2, 0);
  const ssc = n * colM.reduce((s, m) => s + (m - gm) ** 2, 0);
  const sst = all.reduce((s, v) => s + (v - gm) ** 2, 0);
  const sse = sst - ssr - ssc;
  const msr = ssr / (n - 1), msc = ssc / (k - 1), mse = sse / ((n - 1) * (k - 1));
  const d2 = msr + (k - 1) * mse + (k * (msc - mse)) / n, d3 = msr + (k - 1) * mse;
  return { n, k, msr, msc, mse, icc21: d2 ? (msr - mse) / d2 : null, icc31: d3 ? (msr - mse) / d3 : null };
}

// แถบแปลผลของ Koo & Li (2016)
export function iccBand(v) {
  if (!Number.isFinite(v)) return { key: 'na', th: 'คำนวณไม่ได้' };
  if (v < 0.5) return { key: 'poor', th: 'ต่ำ (poor) < 0.50' };
  if (v < 0.75) return { key: 'moderate', th: 'ปานกลาง (moderate) 0.50–0.75' };
  if (v <= 0.9) return { key: 'good', th: 'ดี (good) 0.75–0.90' };
  return { key: 'excellent', th: 'ดีมาก (excellent) > 0.90' };
}

// ตัวชี้วัดที่เลือกได้ (ค่าต่อเซสชัน)
const meanOf = (a) => (Array.isArray(a) && a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);
export const METRICS = {
  maxSpreadDeg: { th: 'มุมกางนิ้วสูงสุด (องศา)', get: (s) => +s.maxSpreadDeg },
  reps: { th: 'จำนวนครั้ง (reps)', get: (s) => +s.reps },
  accuracy: { th: 'ความแม่นยำ (0-1)', get: (s) => +s.accuracy },
  reactionMs: { th: 'เวลาตอบสนองเฉลี่ย (ms)', get: (s) => +(s.details?.avgReactionMs ?? meanOf(s.details?.reactionTimes)) },
  score: { th: 'คะแนน', get: (s) => +s.score },
};

// สร้างเมทริกซ์ คน × ครั้ง: แต่ละคนเรียงตามเวลา → ตัดเซสชันแรก (ฝึกหัด) → เก็บเฉพาะที่มีค่า → ใช้ k ครั้งแรก
// คนที่มีไม่ครบ k ครั้งจะไม่ถูกนับ (ICC ต้องการเมทริกซ์เต็ม)
export function buildMatrix(sessions, { metric = 'reps', k = 2, game = 'all', excludeFirst = true, includeDemo = false } = {}) {
  const get = METRICS[metric]?.get;
  if (!get) throw new Error('ไม่รู้จักตัวชี้วัด ' + metric);
  const byUser = new Map();
  for (const s of sessions) {
    if (!s?.userId || (game !== 'all' && s.game !== game) || (!includeDemo && isDemoSession(s))) continue;
    if (s.status && s.status !== 'done') continue;
    (byUser.get(s.userId) || byUser.set(s.userId, []).get(s.userId)).push(s);
  }
  const rows = [], subjects = [], skipped = [];
  for (const [uid, list] of byUser) {
    list.sort((a, b) => a.startTime - b.startTime);
    const rest = (excludeFirst ? list.slice(1) : list).map(get).filter(Number.isFinite);
    if (rest.length >= k) { rows.push(rest.slice(0, k)); subjects.push(uid); } else skipped.push({ userId: uid, available: rest.length });
  }
  return { matrix: rows, subjects, skipped, k };
}
