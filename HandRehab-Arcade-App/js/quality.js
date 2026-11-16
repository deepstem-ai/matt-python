// ============================================================
// quality.js — วัดคุณภาพภาพใบหน้า (Lab 14) คณิตศาสตร์ล้วน ไม่แตะหน้าจอ
// รับภาพขาวดำ (Float32Array) แล้วคืนตัวเลข + คะแนน 0-100 + รายการปัญหา
// ทดสอบด้วย node ได้ทันที
// ============================================================

// ค่าเกณฑ์ทั้งหมดอยู่ที่นี่ที่เดียว ปรับได้ (ดูตัวเลขจริงในแผง "ตัวเลขสด" บนหน้าจอแล้วค่อยปรับ)
// แต่ละข้อมี bad (ได้ 0), pass (เส้นผ่าน = ได้ 0.6), good (ได้เต็ม 1)
export const QUALITY_CONFIG = {
  cropWidth: 160,                                    // ย่อภาพใบหน้าให้กว้าง 160px ก่อนวัด (เร็วและเทียบกันได้)
  sharpness: { bad: 15, pass: 60, good: 200 },       // ความแปรปรวนของ Laplacian ต้อง > 60
  brightness: { badLow: 30, low: 70, idealLow: 100, idealHigh: 160, high: 190, badHigh: 240 }, // 70-190
  contrast: { bad: 10, pass: 30, good: 55 },         // ส่วนเบี่ยงเบนมาตรฐานของความสว่าง ต้อง > 30
  faceRatio: { bad: 0.05, pass: 0.12, good: 0.2 },   // ความกว้างหน้า / ความกว้างภาพ ต้อง > 0.12
  tilt: { good: 3, pass: 12, bad: 30 },              // หัวเอียง (องศา) ต้องไม่เกิน 12
  glarePct: 0.08,                                     // พิกเซลขาวจ้า (>245) เกิน 8% = แสงแรงเกิน
  weights: { sharpness: 30, brightness: 20, contrast: 15, faceRatio: 15, tilt: 20 }, // รวม 100
  minScore: 60,                                       // ต่ำกว่านี้ไม่รับภาพ ต้องถ่ายใหม่
  warnAverage: 70,                                    // ค่าเฉลี่ยต่ำกว่านี้เตือนว่าล็อกอินจะยาก
};

// แปลงภาพสี RGBA → ความสว่าง 0-255 (สูตรมาตรฐานของตามนุษย์)
export function toGray(rgba, w, h) {
  const g = new Float32Array(w * h);
  for (let i = 0, j = 0; j < g.length; i += 4, j++) g[j] = 0.299 * rgba[i] + 0.587 * rgba[i + 1] + 0.114 * rgba[i + 2];
  return g;
}

// ค่าเฉลี่ย (ความสว่าง) และส่วนเบี่ยงเบนมาตรฐาน (ความต่างแสง = contrast) และสัดส่วนพิกเซลขาวจ้า
export function meanStd(gray) {
  let s = 0, s2 = 0, glare = 0;
  for (const v of gray) { s += v; s2 += v * v; if (v > 245) glare++; }
  const n = gray.length || 1, mean = s / n;
  return { mean, std: Math.sqrt(Math.max(0, s2 / n - mean * mean)), glare: glare / n };
}

// ความคม = ความแปรปรวนของ Laplacian
// Laplacian ของแต่ละพิกเซล = 4×ตัวเอง − บน − ล่าง − ซ้าย − ขวา
// ภาพคม: ขอบชัด ค่านี้กระโดดแรง → ความแปรปรวนสูง / ภาพเบลอ: ทุกอย่างนุ่ม → ความแปรปรวนต่ำ
export function laplacianVariance(gray, w, h) {
  let s = 0, s2 = 0, n = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const L = 4 * gray[i] - gray[i - 1] - gray[i + 1] - gray[i - w] - gray[i + w];
      s += L; s2 += L * L; n++;
    }
  }
  if (!n) return 0;
  const m = s / n;
  return s2 / n - m * m;
}

// หัวเอียงกี่องศา จากจุดตาสองข้างของ Face Detector (พิกัด 0-1) ต้องรู้ขนาดภาพเพื่อแก้ภาพไม่จัตุรัส
export function tiltDeg(eyeA, eyeB, width = 1, height = 1) {
  if (!eyeA || !eyeB) return 0;
  const dx = (eyeB.x - eyeA.x) * width, dy = (eyeB.y - eyeA.y) * height;
  let a = Math.atan2(dy, dx) * 180 / Math.PI;
  if (a > 90) a -= 180; if (a < -90) a += 180; // ไม่สนว่าตาไหนอยู่ซ้าย
  return a; // บวก = เอียงแบบหนึ่ง ลบ = อีกแบบ ใช้ค่าสัมบูรณ์ตอนให้คะแนน
}

// เปลี่ยนตัวเลขเป็นคะแนนย่อย 0..1 แบบเส้นตรงเป็นช่วง (bad→0, pass→0.6, good→1)
const lerp = (v, a, b, fa, fb) => fa + (fb - fa) * Math.min(1, Math.max(0, (v - a) / (b - a)));
export function scoreHigher(v, { bad, pass, good }) { return v <= pass ? lerp(v, bad, pass, 0, 0.6) : lerp(v, pass, good, 0.6, 1); }
export function scoreLower(v, { good, pass, bad }) { return v >= pass ? lerp(v, pass, bad, 0.6, 0) : lerp(v, good, pass, 1, 0.6); }
export function scoreBand(v, b) {
  if (v < b.low) return lerp(v, b.badLow, b.low, 0, 0.6);
  if (v < b.idealLow) return lerp(v, b.low, b.idealLow, 0.6, 1);
  if (v <= b.idealHigh) return 1;
  if (v <= b.high) return lerp(v, b.idealHigh, b.high, 1, 0.6);
  return lerp(v, b.high, b.badHigh, 0.6, 0);
}

// รวมทั้ง 5 ข้อเป็นคะแนน 0-100 และบอกปัญหาเรียงตามความสำคัญ (ข้อแรก = ต้องแก้ก่อน)
// m = { sharpness, brightness, contrast, glare, faceRatio, tilt }
export function assessQuality(m, cfg = QUALITY_CONFIG) {
  const parts = {
    sharpness: scoreHigher(m.sharpness, cfg.sharpness),
    brightness: scoreBand(m.brightness, cfg.brightness),
    contrast: scoreHigher(m.contrast, cfg.contrast),
    faceRatio: scoreHigher(m.faceRatio, cfg.faceRatio),
    tilt: scoreLower(Math.abs(m.tilt), cfg.tilt),
  };
  let score = 0;
  for (const k in parts) score += parts[k] * cfg.weights[k];
  const problems = [];
  if (m.faceRatio < cfg.faceRatio.pass) problems.push('far');
  if (m.brightness < cfg.brightness.low) problems.push('dark');
  else if (m.brightness > cfg.brightness.high || m.glare > cfg.glarePct) problems.push('harsh');
  else if (m.contrast < cfg.contrast.pass) problems.push('flat');
  if (Math.abs(m.tilt) > cfg.tilt.pass) problems.push('tilt');
  if (m.sharpness < cfg.sharpness.pass) problems.push('blur');
  score = Math.round(score);
  return { score, parts, problems, ok: problems.length === 0 && score >= cfg.minScore, metrics: { ...m } };
}
