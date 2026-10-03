// ============================================================
// face-login.js — ระบบเข้าสู่ระบบด้วยใบหน้า (Lab 15) ส่วนคณิตศาสตร์ล้วน
//  1) makeEmbedding     — จุด 478 จุด → ชุดตัวเลข 50 ตัว (อยู่ใน face-embed.js ใช้ร่วมกับ Lab 14)
//  2) cosineSimilarity  — ความเหมือน 0..1 (สมการ (9))
//  3) VoteBuffer        — โหวตจากหลายเฟรม ห้ามตัดสินจากเฟรมเดียว
//  4) BlinkDetector     — นับการกระพริบตา (กันคนถือรูปถ่ายมาหลอก)
//  5) loginDecision     — ผ่านเมื่อโหวตชี้คนเดียว และกระพริบตาครบ
// ไม่แตะหน้าจอ/กล้อง จึงทดสอบด้วย node ได้ (หน้าเว็บอยู่ใน login-page.js)
//
// โมเดล: https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task
// ลิงก์สำรอง: เปลี่ยน /1/ เป็น /latest/  (โหลดจริงใน landmarker.js ผ่าน vision.js)
// ============================================================
export { makeEmbedding, cosineSimilarity, EMBED_SIZE, PAIRS } from './face-embed.js';
import { cosineSimilarity, EMBED_SIZE } from './face-embed.js';

// Lab 35: ที่อยู่โมเดลย้ายไปอยู่ใน js/assets.js ที่เดียว (หาในเครื่องก่อน แล้วค่อย CDN)
import { ASSETS } from './assets.js';
export const MODEL_URL = ASSETS['face_landmarker.task'].cdn[0];
export const MODEL_BACKUP_URL = ASSETS['face_landmarker.task'].cdn[1];

// ค่าที่ต้องปรับด้วยข้อมูลจริง (บันทึกค่าที่ใช้ได้ลงบทที่ 4)
export const LOGIN_CONFIG = {
  threshold: 0.92,     // ความเหมือนเกินนี้ = คนเดียวกัน (เข้าไม่ได้ → ลดทีละ 0.02 / เพื่อนเข้าได้ → เพิ่ม)
  margin: 0.03,        // คนที่ 1 ต้องชนะคนที่ 2 อย่างน้อยเท่านี้ ไม่งั้นถือว่าไม่แน่ใจ
  voteSize: 15,        // จำ 15 เฟรมล่าสุด
  voteNeed: 10,        // ต้องชนะอย่างน้อย 10 ใน 15 (ห้ามตั้งต่ำกว่า 5)
  blinksNeeded: 1,     // กระพริบตาอย่างน้อย 1 ครั้ง
  noMatchSeconds: 10,  // 10 วินาทีไม่เจอใคร → เสนอทางเลือก 3 ปุ่ม
};

// เทียบ embedding หนึ่งชุดกับทุกใบหน้าในฐานข้อมูล
// gallery = [{ userId, embedding }] (1 คนมีได้หลายรูป ใช้รูปที่เหมือนที่สุดของคนนั้น)
// คืน { userId, score, second } — second = คะแนนของคนที่เหมือนรองลงมา
export function matchGallery(emb, gallery) {
  const best = new Map();
  for (const g of gallery) {
    if (!g.embedding || g.embedding.length !== EMBED_SIZE) continue;
    const s = cosineSimilarity(emb, g.embedding);
    if (s > (best.get(g.userId) ?? -1)) best.set(g.userId, s);
  }
  const ranked = [...best.entries()].sort((a, b) => b[1] - a[1]);
  return { userId: ranked[0]?.[0] ?? null, score: ranked[0]?.[1] ?? 0, second: ranked[1]?.[1] ?? 0 };
}

// เลือกคนที่จะโหวตให้ในเฟรมนี้ (null = ไม่มีใครเหมือนพอ)
export function frameVote(match, cfg = LOGIN_CONFIG) {
  if (!match.userId || match.score < cfg.threshold) return null;
  if (match.second && match.score - match.second < cfg.margin) return null; // เหมือนสองคนพอ ๆ กัน = ไม่แน่ใจ
  return match.userId;
}

// ---------- VoteBuffer ----------
// เก็บผลโหวต N เฟรมล่าสุด ยอมรับเมื่อคนเดียวกันชนะอย่างน้อย need ครั้ง
// เหตุผล: เฟรมเดียวผิดบ่อยมาก (หน้าเบลอ กระพริบตา แสงวูบ) แต่หลายเฟรมพร้อมกันผิดยาก
export class VoteBuffer {
  constructor(size = LOGIN_CONFIG.voteSize, need = LOGIN_CONFIG.voteNeed) {
    if (need < 5) console.warn('[VoteBuffer] need ต่ำกว่า 5 จะเริ่มสับสนคน');
    this.size = size; this.need = need; this.items = [];
  }
  push(label) { this.items.push(label); if (this.items.length > this.size) this.items.shift(); return this.decision(); }
  // คนที่ได้คะแนนโหวตมากที่สุด (ไม่นับ null)
  leader() {
    const c = new Map();
    for (const l of this.items) if (l != null) c.set(l, (c.get(l) || 0) + 1);
    let label = null, count = 0;
    for (const [k, v] of c) if (v > count) { label = k; count = v; }
    return { label, count };
  }
  decision() { const w = this.leader(); return w.count >= this.need ? w.label : null; }
  clear() { this.items = []; }
}

// ---------- BlinkDetector ----------
// จุดรอบตา (ลำดับ p1..p6): p1, p4 = หัวตา/หางตา  p2, p6 และ p3, p5 = เปลือกตาบน/ล่าง
export const EYE_RIGHT = [33, 160, 158, 133, 153, 144];
export const EYE_LEFT = [362, 385, 387, 263, 373, 380];

// สมการ (10): EAR = (‖p2 − p6‖ + ‖p3 − p5‖) / (2‖p1 − p4‖)  (Soukupová & Čech 2016)
//   p1..p6 = 33,160,158,133,153,144 (ตาขวา) / 362,385,387,263,373,380 (ตาซ้าย)
// Eye Aspect Ratio = ความสูงของตา ÷ ความกว้าง = (|p2−p6| + |p3−p5|) ÷ (2|p1−p4|)
// ตาเปิด ≈ 0.25-0.35, ตาปิด < 0.15 และไม่ขึ้นกับระยะห่างกล้อง (เป็นอัตราส่วน)
export function eyeAspectRatio(pts, idx, W = 1, H = 1) {
  const P = (i) => [pts[i].x * W, pts[i].y * H];
  const d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const [p1, p2, p3, p4, p5, p6] = idx.map(P);
  const w = d(p1, p4);
  return w > 0 ? (d(p2, p6) + d(p3, p5)) / (2 * w) : 0;
}
export function bothEyesEAR(pts, W = 1, H = 1) {
  return (eyeAspectRatio(pts, EYE_RIGHT, W, H) + eyeAspectRatio(pts, EYE_LEFT, W, H)) / 2;
}

// ตัวนับการกระพริบ
//  - hysteresis: ต้องต่ำกว่า "เส้นปิด" จึงนับว่าหลับตา และต้องสูงกว่า "เส้นเปิด" (สูงกว่า) จึงนับว่าลืมตา
//    ค่าที่แกว่งอยู่ระหว่างสองเส้นจึงไม่ถูกนับซ้ำ
//  - เส้นทั้งสองคิดเป็นสัดส่วนของค่าลืมตาปกติของคนนั้น (baseline) ที่เรียนรู้ไปเรื่อย ๆ
//  - หลับตานานเกินไป (> maxClosedMs) ไม่นับ เพราะน่าจะเป็นการก้มหน้าหรือหลับตาค้าง ไม่ใช่กระพริบ
//  - refractory: หลังนับแล้ว พักสักครู่ก่อนนับครั้งถัดไป กันสัญญาณรบกวนนับซ้ำ
export class BlinkDetector {
  constructor({ baseline = 0.28, closeRatio = 0.65, openRatio = 0.85, minClosedMs = 40, maxClosedMs = 600, refractoryMs = 250 } = {}) {
    Object.assign(this, { baseline, closeRatio, openRatio, minClosedMs, maxClosedMs, refractoryMs });
    this.reset();
  }
  reset() { this.state = 'open'; this.count = 0; this.closedAt = 0; this.lastBlinkAt = -Infinity; }
  get closeT() { return this.baseline * this.closeRatio; }
  get openT() { return this.baseline * this.openRatio; }
  // ส่งค่า EAR และเวลา (ms) ทุกเฟรม คืน true เมื่อนับการกระพริบใหม่ได้ในเฟรมนี้
  update(ear, t) {
    if (!(ear > 0)) return false;
    if (this.state === 'open') {
      // เรียนรู้ค่าลืมตาปกติอย่างช้า ๆ (เฉพาะตอนตาเปิดชัดเจน)
      if (ear > this.closeT) this.baseline += (ear - this.baseline) * 0.03;
      if (ear < this.closeT && t - this.lastBlinkAt > this.refractoryMs) { this.state = 'closed'; this.closedAt = t; }
      return false;
    }
    if (ear > this.openT) {
      this.state = 'open';
      const dur = t - this.closedAt;
      if (dur >= this.minClosedMs && dur <= this.maxClosedMs) { this.count++; this.lastBlinkAt = t; return true; }
    }
    return false;
  }
}

// ---------- เงื่อนไขเข้าสู่ระบบ (ต้องผ่านทั้งสองข้อ) ----------
export function loginDecision(vote, blink, cfg = LOGIN_CONFIG) {
  const who = vote.decision();
  const blinkOk = blink.count >= cfg.blinksNeeded;
  return { userId: who && blinkOk ? who : null, who, blinkOk };
}
