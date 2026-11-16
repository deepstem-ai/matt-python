// ============================================================
// face-capture.js — ระบบเก็บภาพใบหน้าพร้อมกรอบนำทางและคำเตือนสด (Lab 14)
// ทำงานทุกเฟรม: หาหน้า → เช็กกรอบ → วัดคุณภาพ → เช็กท่า → เลือกข้อความ → นับ 3-2-1 → ถ่าย
// หน้าเว็บ (capture-page.js) เป็นคนตัดสินใจว่าจะถ่ายท่าไหน และเก็บรูปไว้ที่ใด
// ห้ามแตะ: ฐานข้อมูล (หน้าเว็บเป็นคนบันทึก)
// ============================================================
import { detectFaces } from './vision.js';
import { detectLandmarks, landmarkerInfo } from './landmarker.js';
import { cssVar, isCalm } from './ui.js';
import { makeGuide, checkGuide, headPose, checkPose, POSES } from './guide.js';
import { QUALITY_CONFIG, toGray, meanStd, laplacianVariance, tiltDeg, assessQuality } from './quality.js';
import { pickMessage } from './warnings.js';
import { makeEmbedding } from './face-embed.js';

export const CAPTURE_CONFIG = {
  countdownMs: 3000,     // นับ 3-2-1
  graceMs: 300,          // ยอมให้หลุดสถานะพร้อมได้สั้น ๆ (กันเฟรมกระตุกยกเลิกการนับ)
  persistMs: 5000,       // ปัญหาเดิมนานเกิน 5 วินาที → แสดงภาพตัวอย่าง
  poseRelaxMs: 8000,     // ทำท่าไม่ได้ 8 วินาที → ผ่อนการตรวจท่า (ผู้สูงอายุบางคนหันคอได้น้อย)
  cooldownMs: 1200,      // พักหลังถ่ายแต่ละรูป
};
const POSE_HINTS = new Set(['faceFront', 'turnLeft', 'turnRight', 'lookUp', 'lookDown', 'lessTurn']);

// ---------- วัดคุณภาพบนแคนวาสธรรมดา ----------
const cropC = document.createElement('canvas');
const cropX = cropC.getContext('2d', { willReadFrequently: true });
export function measureFace(src, face, W, H) {
  const b = face.box, pad = 0.1;
  const x = Math.max(0, (b.x - b.w * pad) * W), y = Math.max(0, (b.y - b.h * pad) * H);
  const w = Math.min(W - x, b.w * (1 + 2 * pad) * W), h = Math.min(H - y, b.h * (1 + 2 * pad) * H);
  const cw = QUALITY_CONFIG.cropWidth, ch = Math.max(8, Math.round((cw * h) / Math.max(1, w)));
  cropC.width = cw; cropC.height = ch;
  cropX.drawImage(src, x, y, Math.max(1, w), Math.max(1, h), 0, 0, cw, ch);
  const gray = toGray(cropX.getImageData(0, 0, cw, ch).data, cw, ch);
  const { mean, std, glare } = meanStd(gray);
  const kp = face.keypoints || [];
  return { sharpness: laplacianVariance(gray, cw, ch), brightness: mean, contrast: std, glare, faceRatio: b.w, tilt: tiltDeg(kp[0], kp[1], W, H) };
}

// รูปเล็ก JPEG (กลับด้านแบบกระจกให้เหมือนที่ผู้ใช้เห็น) ขนาด 192×240 ราว 10-15 KB
export function faceThumb(video, face, W, H) {
  const b = face.box, c = document.createElement('canvas');
  c.width = 192; c.height = 240;
  const s = b.w * W * 1.6, cx = (b.x + b.w / 2) * W, cy = (b.y + b.h / 2) * H;
  const ctx = c.getContext('2d');
  ctx.translate(192, 0); ctx.scale(-1, 1);
  ctx.drawImage(video, cx - s / 2, cy - s * 0.66, s, s * 1.25, 0, 0, 192, 240);
  return c.toDataURL('image/jpeg', 0.8);
}

export class FaceCapture {
  // opts: video, canvas, onFrame(info), onCountdown(n|null, frac), onCapture(shot), onReject(reasons), onCancel(msg), onPersist(msg)→Promise, onPoseRelax()
  constructor(opts) {
    this.o = opts; this.running = false; this.paused = false; this.busy = false;
    this.target = 0; this.basePitch = undefined; this.shown = {};
    this.tick = this.tick.bind(this);
  }
  setTarget(i) { this.target = i; this.poseRelaxed = false; this.cdStart = null; this.pCode = null; this.o.onCountdown?.(null); }
  start() { if (this.running) return; this.running = true; this.cooldownUntil = 0; this.raf = requestAnimationFrame(this.tick); }
  stop() { this.running = false; cancelAnimationFrame(this.raf); this.cdStart = null; this.o.onCountdown?.(null); }

  tick(now) {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.tick);
    const v = this.o.video;
    if (this.paused || this.busy || !v.videoWidth) return;
    const W = v.videoWidth, H = v.videoHeight, cv = this.o.canvas;
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    const faces = detectFaces(v, now);
    const face = faces.sort((a, b) => b.box.w * b.box.h - a.box.w * a.box.h)[0];
    const info = { state: 'none', face, guideBox: makeGuide(W, H), W, H };
    if (face) {
      info.guide = checkGuide(face.box, info.guideBox, { mirror: true });
      info.q = assessQuality(measureFace(v, face, W, H));
      info.problems = info.q.problems;
      info.pose = headPose(face.keypoints, W, H);
      const pc = this.poseRelaxed ? { ok: true } : checkPose(POSES[this.target].key, info.pose, this.basePitch);
      info.poseHint = pc.ok ? null : pc.hint;
      info.state = !info.guide.inside ? 'outside' : (info.problems.length || info.poseHint || !info.q.ok) ? 'poor' : 'ready';
    }
    info.msg = pickMessage(info);
    this.draw(info);
    this.o.onFrame?.(info);
    this.persist(info, now);
    this.countdown(info, now);
  }

  // วาดกรอบวงรีบนแคนวาส (แคนวาสไม่กลับด้าน จึงกลับพิกัด x ของหน้าเอง)
  draw(info) {
    const cv = this.o.canvas, ctx = cv.getContext('2d'), { W, H, guideBox: g } = info;
    const col = cssVar({ none: '--text-2', outside: '--error', poor: '--warning', ready: '--success' }[info.state]);
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.globalAlpha = 0.45; ctx.fillStyle = cssVar('--bg');
    ctx.beginPath(); ctx.rect(0, 0, W, H);
    ctx.ellipse(g.cx * W, g.cy * H, g.rx * W, g.ry * H, 0, 0, Math.PI * 2);
    ctx.fill('evenodd');  // มืดนอกวงรี สว่างในวงรี
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = col; ctx.lineWidth = Math.max(4, H / 120);
    if (!isCalm()) { ctx.shadowColor = col; ctx.shadowBlur = 18; }
    if (info.state === 'none') ctx.setLineDash([18, 12]);
    ctx.beginPath(); ctx.ellipse(g.cx * W, g.cy * H, g.rx * W, g.ry * H, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    const kp = info.face?.keypoints;
    if (kp?.length >= 2) { // เส้นระดับตา ช่วยให้เห็นว่าหัวเอียงไหม
      ctx.save(); ctx.strokeStyle = info.problems?.includes('tilt') ? cssVar('--warning') : cssVar('--sky');
      ctx.lineWidth = 3; ctx.setLineDash([8, 6]);
      ctx.beginPath(); ctx.moveTo((1 - kp[0].x) * W, kp[0].y * H); ctx.lineTo((1 - kp[1].x) * W, kp[1].y * H); ctx.stroke();
      ctx.restore();
    }
  }

  // ปัญหาเดิมค้างนาน → modal ภาพตัวอย่าง / ท่าที่ทำไม่ได้นาน → ผ่อนการตรวจท่า
  persist(info, now) {
    const code = info.msg.code, group = code.startsWith('out-') ? 'out' : code;
    // เปลี่ยนปัญหาเฉพาะเมื่อปัญหาใหม่อยู่นานเกิน 0.7 วินาที (กันเฟรมกระพริบรีเซ็ตเวลา)
    if (group !== this.pCode) {
      if (this.pCode == null || group !== this.candCode) { this.candCode = group; this.candSince = now; }
      if (this.pCode == null || now - this.candSince > 700) { this.pCode = group; this.pSince = now; }
      if (this.pCode === group) return;
    } else this.candCode = null;
    if (group !== this.pCode) return;
    if (group === 'ready' || this.paused) return;
    const dur = now - this.pSince;
    if (POSE_HINTS.has(group)) {
      if (dur > CAPTURE_CONFIG.poseRelaxMs && !this.poseRelaxed) { this.poseRelaxed = true; this.o.onPoseRelax?.(); }
      return;
    }
    if (dur > CAPTURE_CONFIG.persistMs && now - (this.shown[group] ?? -1e9) > 30000) {
      this.shown[group] = now; this.paused = true; this.cdStart = null; this.o.onCountdown?.(null);
      Promise.resolve(this.o.onPersist?.(info.msg)).finally(() => { this.paused = false; this.pSince = performance.now(); });
    }
  }

  // นับ 3-2-1 เฉพาะตอนกรอบเป็นสีพร้อม ถ้าคุณภาพตกระหว่างนับ → ยกเลิกและบอกเหตุผล
  countdown(info, now) {
    if (now < this.cooldownUntil) return;
    const ready = info.state === 'ready';
    if (this.cdStart == null) { if (!ready) return; this.cdStart = now; this.notReadySince = null; }
    if (!ready) {
      this.notReadySince ??= now;
      if (now - this.notReadySince > CAPTURE_CONFIG.graceMs) { this.cdStart = null; this.o.onCountdown?.(null); this.o.onCancel?.(info.msg); }
      return;
    }
    this.notReadySince = null;
    const el = now - this.cdStart;
    if (el < CAPTURE_CONFIG.countdownMs) { this.o.onCountdown?.(3 - Math.floor(el / 1000), (el % 1000) / 1000); return; }
    this.cdStart = null; this.o.onCountdown?.(null);
    this.capture(info);
  }

  // ถ่ายจริง: วัดคุณภาพซ้ำ + หาจุด 478 จุดสำหรับล็อกอิน + ทำรูปเล็ก
  capture(info) {
    this.busy = true;
    const v = this.o.video, { W, H, face } = info;
    const q = assessQuality(measureFace(v, face, W, H));
    const extra = [];
    let embedding = null;
    if (landmarkerInfo().ready) {
      const lm = detectLandmarks(v);
      embedding = lm ? makeEmbedding(lm.points, { width: lm.width, height: lm.height }) : null;
      if (!embedding) extra.push('หาจุดใบหน้า 478 จุดไม่เจอ — มองกล้องตรง ๆ แล้วถ่ายใหม่');
    }
    this.cooldownUntil = performance.now() + CAPTURE_CONFIG.cooldownMs;
    this.busy = false;
    if (q.score < QUALITY_CONFIG.minScore || !q.ok || extra.length) { this.o.onReject?.(q, extra); return; }
    if (POSES[this.target].key === 'straight' && info.pose) this.basePitch = info.pose.pitch;
    this.o.onCapture?.({ pose: POSES[this.target].key, poseIndex: this.target, score: q.score, parts: q.parts, metrics: q.metrics, image: faceThumb(v, face, W, H), embedding, at: Date.now() });
  }
}
