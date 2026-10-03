// ============================================================
// star-portal.js — เกม 1 "จับดาวใส่ประตูมิติ" (Lab 23) ธีมอวกาศ
// กติกา: ปลายนิ้วชี้ = ตัวชี้บนจอ (กลับซ้ายขวาแบบกระจก)
//        จีบนิ้วตอนตัวชี้อยู่บนดาว = จับ → ลากไปที่ประตูมิติแล้วปล่อย = ได้ 1 คะแนน
//        ปล่อยที่อื่น = ดาวลอยกลับที่เดิม
// ห้ามแตะ: กล้อง ฐานข้อมูล (หน้าเพจเป็นคนจัดการ)
// ============================================================
import { GameEngine, toScreen } from '../game-engine.js';
import { detectPinch } from '../gestures.js';
import { RepCounter } from '../rep-counter.js';
import { cssVar } from '../ui.js';
import { spread, normDist } from '../geometry.js';
import { PointFilter } from '../smoothing.js';
import { scoreFromMeasure } from '../calibration.js';

// Lab 27: อาการสั่นจำลองสำหรับ "ทดสอบมือสั่น" (พิกเซล) ระดับ 0-3
export const SHAKE_PX = [0, 6, 14, 28];
import { drawSpace, drawStarShape, drawPortal } from './star-portal-draw.js';

// ความยากสามระดับ: ขนาดประตูมิติ ขนาดดาว และประตูเคลื่อนที่ได้หรือไม่
export const LEVELS = {
  easy: { th: 'ง่าย', portalR: 110, starR: 36, drift: 0 },
  normal: { th: 'ปกติ', portalR: 85, starR: 30, drift: 0 },
  hard: { th: 'ยาก', portalR: 65, starR: 24, drift: 40 },
};
const PINCH_ON = 0.7, PINCH_OFF = 0.35; // ประตูสองบาน: เกิน 0.7 = จีบ, ต่ำกว่า 0.35 = ปล่อย

export class StarPortal {
  // hooks: { readHand() → points|null, onTick(dt), onHud(state), onEnd(summary) }
  constructor(canvas, hooks = {}) {
    this.canvas = canvas; this.hooks = hooks;
    this.grabRadius = 60; this.level = 'normal'; this.roundSec = 60;
    this.source = 'hand';                     // 'hand' | 'mouse' (โหมดสาธิต)
    this.mouse = { x: 0, y: 0, down: false, inside: false };
    this.pointer = { x: 0, y: 0, visible: false };
    this.pinchScore = 0; this.pinching = false; this._lostT = 0;
    this.floaters = [];                       // ข้อความลอย เช่น +1, คอมโบ
    this.round = null;
    // Lab 27: ค่าปรับเทียบรายคน (null = ใช้ค่ามาตรฐาน) + ตัวกรอง One Euro ของตัวชี้ + ทดสอบมือสั่น
    this.cal = null;
    this.filterOn = true;
    this.filter = new PointFilter({ freq: 30, minCutoff: 1.5, beta: 0.8, dCutoff: 1 });
    this.shakeLevel = 0;
    this.rawPointer = null;                   // ตำแหน่งก่อนกรอง (วาดจาง ๆ ให้เห็นความต่าง)
    this.engine = new GameEngine(canvas, { update: (dt) => this.update(dt), draw: (ctx, e, phase) => this.draw(ctx, phase) });
    this.readColors();
  }
  readColors() {
    this.C = { star: cssVar('--warning'), pointer: cssVar('--primary'), pinch: cssVar('--success'), text: cssVar('--text'),
      g1: cssVar('--world-glow-1'), g3: cssVar('--world-glow-3'), pink: cssVar('--pink'), bad: cssVar('--error') };
  }

  // ---------------- เริ่ม / จบรอบ ----------------
  startRound() {
    const L = LEVELS[this.level];
    this.round = {
      active: true, timeLeft: this.roundSec, startTime: Date.now(), level: this.level,
      score: 0, combo: 0, bestCombo: 0, attempts: 0, successes: 0, starTimes: [], lastRelease: null,
      counter: new RepCounter({ enter: PINCH_ON, exit: PINCH_OFF, minHoldMs: 80, cooldownMs: 150 }),
      reps: [], star: null, portal: { x: 0, y: 0, r: L.portalR, vx: L.drift, vy: L.drift * 0.6, spin: 0 },
    };
    this.pinching = false;
    this.spawn();
    this.hud();
  }
  endRound() {
    const r = this.round; if (!r?.active) return;
    r.active = false;
    const avgStarMs = r.starTimes.length ? r.starTimes.reduce((a, b) => a + b, 0) / r.starTimes.length : 0;
    this.hooks.onEnd?.({
      startTime: r.startTime, endTime: Date.now(), level: r.level, score: r.score, bestCombo: r.bestCombo,
      pinches: r.counter.count, attempts: r.attempts, successes: r.successes,
      accuracy: r.attempts ? r.successes / r.attempts : 0, avgStarMs, starTimes: r.starTimes.map(Math.round), reps: r.reps,
    });
  }

  // สุ่มตำแหน่งดาวและประตูมิติใหม่ ไม่ให้อยู่ใกล้กันเกินไป
  spawn() {
    const { width: w, height: h } = this.canvas, r = this.round, L = LEVELS[r.level];
    const m = 90, rnd = (a, b) => a + Math.random() * (b - a);
    const p = r.portal; p.x = rnd(m + L.portalR, w - m - L.portalR); p.y = rnd(m + L.portalR, h - m - L.portalR);
    let sx, sy, tries = 0;
    do { sx = rnd(m, w - m); sy = rnd(m, h - m); tries++; } while (Math.hypot(sx - p.x, sy - p.y) < Math.min(w, h) * 0.4 && tries < 40);
    r.star = { x: sx, y: sy, homeX: sx, homeY: sy, r: L.starR, held: false, returning: false, bornT: this.engine.time, spin: 0 };
  }

  // Lab 27: ใส่อาการสั่นจำลอง (เฉพาะโหมดสาธิต) แล้วกรองด้วย One Euro ในหน่วย 0-1 ของจอ
  //         เวลาที่ส่งให้ตัวกรองคือเวลาของเกม (engine.time) ไม่ใช่นาฬิกาในตัวกรอง
  smooth(p) {
    const { width: w, height: h } = this.canvas, t = this.engine.time;
    const A = this.source === 'mouse' ? SHAKE_PX[this.shakeLevel] || 0 : 0;
    if (A) p = { x: p.x + A * Math.sin(2 * Math.PI * 6 * t) + A * 0.4 * (Math.random() - 0.5), y: p.y + A * Math.cos(2 * Math.PI * 5.3 * t) + A * 0.4 * (Math.random() - 0.5) };
    this.rawPointer = p;
    if (!this.filterOn) return p;
    const f = this.filter.filter({ x: p.x / w, y: p.y / h }, t);
    return { x: f.x * w, y: f.y * h };
  }
  // ใช้ค่าปรับเทียบ: รัศมีการจับ + ความแรงตัวกรอง + เกณฑ์จีบรายคน
  applyCalibration(cal) {
    this.cal = cal || null;
    if (cal) { this.grabRadius = cal.grabRadius; this.filter.setParams(cal.filter); }
  }

  // ---------------- รับข้อมูลมือ / เมาส์ ----------------
  readInput(dt) {
    if (this.source === 'mouse') {
      this.pointer = { ...this.smooth({ x: this.mouse.x, y: this.mouse.y }), visible: this.mouse.inside };
      this.pinchScore = this.mouse.down ? 1 : 0;
      return;
    }
    const pts = this.hooks.readHand?.();
    if (pts) {
      const p = toScreen(pts[8], this.canvas, true);      // ปลายนิ้วชี้ × ขนาด canvas แบบกระจก
      this.pointer = { ...this.smooth(p), visible: true };
      const sq = pts.sq || pts;
      // Lab 27: มีค่าปรับเทียบ → ใช้ระยะจีบดิบเทียบกับ entry/exit ของคนนี้ · ไม่มี → ใช้เกณฑ์มาตรฐาน
      this.pinchScore = this.cal ? scoreFromMeasure(normDist(sq, 4, 8), this.cal) : detectPinch(sq).score;
      this.angle = spread(sq, 'thumb', 'index');   // Lab 28: มุมระหว่างนิ้วโป้ง-นิ้วชี้ (องศา)
      this._lostT = 0;
    } else {
      this._lostT += dt;                                   // มือหายชั่วครู่ (≤0.3 วิ) ใช้ค่าเดิมไปก่อน
      if (this._lostT > 0.3) { this.pointer.visible = false; this.pinchScore = 0; }
    }
  }

  update(dt) {
    const r = this.round;
    this.floaters = this.floaters.filter((f) => (f.life -= dt) > 0);
    this.floaters.forEach((f) => (f.y -= 40 * dt));
    if (!r?.active) return;
    this.hooks.onTick?.(dt);
    this.readInput(dt);
    const tMs = this.engine.time * 1000;
    const rep = r.counter.update(this.pinchScore, tMs);    // นับจำนวนครั้งที่จีบ (ประตูสองบาน)

    // จีบ / ปล่อย
    const s = r.star;
    if (!this.pinching && this.pinchScore >= PINCH_ON) {
      this.pinching = true;
      if (this.pointer.visible && Math.hypot(this.pointer.x - s.x, this.pointer.y - s.y) <= this.grabRadius) {
        s.held = true; s.returning = false; this.engine.sound.grab();
      }
    } else if (this.pinching && this.pinchScore < PINCH_OFF) {
      this.pinching = false;
      if (s.held) this.release();
    }
    // Lab 28: มุมโป้ง-ชี้ที่ "แคบที่สุด" ระหว่างทำท่า = จีบได้ชิดแค่ไหน
    if (r.counter.state !== 'idle' && r.counter.state !== 'cooldown' && this.source === 'hand' && Number.isFinite(this.angle)) r.repAngle = Math.min(r.repAngle ?? 180, this.angle);
    if (rep) {
      const row = { ...rep, scored: r.lastRelease && tMs - r.lastRelease.t < 400 ? r.lastRelease.ok : null, angle: r.repAngle === undefined || r.repAngle === null ? null : +r.repAngle.toFixed(1) };
      r.reps.push(row); r.repAngle = null;
      this.hooks.onRep?.({ gesture: 'pinch', ...row, success: row.scored !== false, peak: row.peak, holdMs: row.holdMs });
    }

    // ดาวตามนิ้ว หรือค่อย ๆ ลอยกลับที่เดิม
    if (s.held) { s.x = this.pointer.x; s.y = this.pointer.y; }
    else if (s.returning) {
      const k = Math.min(1, dt * 6); s.x += (s.homeX - s.x) * k; s.y += (s.homeY - s.y) * k;
      if (Math.hypot(s.homeX - s.x, s.homeY - s.y) < 1) s.returning = false;
    }
    s.spin += dt;
    // ประตูมิติ (ระดับยากเคลื่อนที่ช้า ๆ)
    const p = r.portal, { width: w, height: h } = this.canvas;
    p.spin += dt; p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.x < p.r || p.x > w - p.r) p.vx *= -1;
    if (p.y < p.r || p.y > h - p.r) p.vy *= -1;

    r.timeLeft -= dt;
    this.hud();
    if (r.timeLeft <= 0) { r.timeLeft = 0; this.endRound(); }
  }

  // ปล่อยดาว: อยู่ในประตูมิติ = ได้คะแนน, ไม่อยู่ = ดาวกลับที่เดิม
  release() {
    const r = this.round, s = r.star, p = r.portal, t = this.engine.time * 1000;
    s.held = false; r.attempts++;
    if (Math.hypot(s.x - p.x, s.y - p.y) <= p.r) {
      r.successes++; r.combo++;
      r.bestCombo = Math.max(r.bestCombo, r.combo);
      r.score += this.juice ? this.juice.hit(p.x, p.y, 1) : 1;   // Lab 26: คะแนนคูณตามคอมโบ
      r.starTimes.push(t - s.bornT * 1000);
      r.lastRelease = { t, ok: true };
      this.engine.particles.burst(p.x, p.y, 60, [this.C.star, this.C.g3, this.C.pink, this.C.text], 320, 120, 1.1);
      this.floaters.push({ x: p.x, y: p.y - p.r, text: '+' + (this.juice?.combo.mult || 1), life: 1, color: this.C.star });
      if (!this.juice && r.combo >= 3 && r.combo % 3 === 0) { this.engine.sound.combo(); this.floaters.push({ x: p.x, y: p.y - p.r - 40, text: `คอมโบ ×${r.combo}!`, life: 1.4, color: this.C.pink }); }
      else this.engine.sound.score();
      this.spawn();
    } else {
      r.combo = 0; s.returning = true; this.juice?.miss(); r.lastRelease = { t, ok: false };
      this.engine.sound.miss();
      this.floaters.push({ x: s.x, y: s.y - 30, text: 'กลับที่เดิม', life: 0.9, color: this.C.bad });
    }
  }

  hud() {
    const r = this.round;
    this.hooks.onHud?.({ score: r.score, combo: r.combo, pinches: r.counter.count, timeLeft: r.timeLeft, timeFrac: r.timeLeft / this.roundSec });
  }

  // ---------------- วาด ----------------
  draw(ctx, phase) {
    if (phase === 'before') { drawSpace(ctx, this.canvas, this.engine.time); return; }
    const r = this.round, C = this.C;
    if (r) {
      drawPortal(ctx, r.portal, C);
      drawStarShape(ctx, r.star, C, r.star.held);
    }
    // ตัวชี้ปลายนิ้ว + วงรัศมีการจับ
    if (this.pointer.visible) {
      const { x, y } = this.pointer;
      ctx.setLineDash([6, 8]); ctx.strokeStyle = C.pointer; ctx.globalAlpha = 0.5; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, this.grabRadius, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
      if (this.rawPointer && (this.shakeLevel || this.source === 'hand')) {   // จุดจาง = ตำแหน่งก่อนกรอง (Lab 27)
        ctx.globalAlpha = 0.35; ctx.fillStyle = C.text; ctx.beginPath(); ctx.arc(this.rawPointer.x, this.rawPointer.y, 6, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
      }
      ctx.fillStyle = this.pinching ? C.pinch : C.pointer;
      ctx.beginPath(); ctx.arc(x, y, this.pinching ? 10 : 14, 0, Math.PI * 2); ctx.fill();
    } else if (r?.active) {
      ctx.fillStyle = C.text; ctx.font = '700 22px ' + cssVar('--font'); ctx.textAlign = 'center';
      ctx.fillText(this.source === 'mouse' ? 'เลื่อนเมาส์เข้ามาในจอ' : '✋ ยกมือให้กล้องเห็น', this.canvas.width / 2, 40);
    }
    ctx.textAlign = 'center';
    for (const f of this.floaters) {
      ctx.globalAlpha = Math.min(1, f.life * 2); ctx.fillStyle = f.color; ctx.font = '800 28px ' + cssVar('--font-num');
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
  }
}
