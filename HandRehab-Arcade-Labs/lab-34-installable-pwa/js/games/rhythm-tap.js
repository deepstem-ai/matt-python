// ============================================================
// rhythm-tap.js — เกม 2 "เคาะจังหวะทีละนิ้ว" (Lab 24) ธีมเวทีคอนเสิร์ตนีออน
// กติกา: แป้นวงกลม 5 แป้น = นิ้วโป้ง ชี้ กลาง นาง ก้อย ระบบสุ่มให้แป้นหนึ่งสว่าง
//        งอนิ้วนั้นลง (แตะ) → ถูก = คลื่นวง + โน้ตดนตรี
//        นิ้วผิด = แป้นสั่นสีแดง + หักคะแนน · ช้ากว่า 3 วินาที = พลาด
// บันทึก: เวลาตอบสนองทุกครั้ง (ms) แยกตามนิ้ว + นิ้วไหนถูกสับสนเป็นนิ้วไหน
// ============================================================
import { GameEngine } from '../game-engine.js';
import { detectFingerTap } from '../gestures.js';
import { FINGER_NAMES } from '../hand.js';
import { cssVar } from '../ui.js';
import { drawStage, drawPads } from './rhythm-tap-draw.js';

export const MISS_SEC = 3;                              // ช้ากว่านี้ = พลาด
export const LEVEL_GAP = [1.4, 1.1, 0.85, 0.65, 0.45];  // 5 ระดับ: เวลาพักก่อนแป้นถัดไป (วินาที)
export const UP_STREAK = 5;                             // ถูกติดกัน 5 ครั้ง → ขึ้นระดับ
export const DOWN_MISSES = 3;                           // พลาด 3 ครั้ง → ลงระดับ
const emptyByFinger = (make) => Object.fromEntries(FINGER_NAMES.map((f) => [f, make()]));

export class RhythmTap {
  // hooks: { readHand() → points|null, onTick(dt), onHud(state), onEnd(summary) }
  constructor(canvas, hooks = {}) {
    this.canvas = canvas; this.hooks = hooks; this.roundSec = 60;
    this.source = 'hand';                                // 'hand' | 'keys' (โหมดสาธิต)
    this.pads = FINGER_NAMES.map((f, i) => ({ finger: f, i, x: 0, y: 0, r: 60, shake: 0, flash: 0 }));
    this.ripples = []; this.round = null;
    this.prevFinger = null; this.armed = true; this.freeFor = 0;
    this.engine = new GameEngine(canvas, { update: (dt) => this.update(dt), draw: (ctx, e, ph) => this.draw(ctx, ph) });
  }

  startRound() {
    this.round = {
      active: true, timeLeft: this.roundSec, startTime: Date.now(), score: 0, level: 1, maxLevel: 1,
      streak: 0, misses: 0, phase: 'gap', wait: 1.2, target: -1, litAt: 0, trials: [],
      reactionTimes: emptyByFinger(() => []),                              // ทุกค่า ไม่ใช่แค่ค่าเฉลี่ย
      confusion: emptyByFinger(() => emptyByFinger(() => 0)),              // confusion[เป้าหมาย][นิ้วที่แตะ]
    };
    this.hud();
  }

  // ---------------- รับการแตะ ----------------
  // จากกล้อง: นับเป็น "การแตะ" เมื่อมีนิ้วงอขึ้นมาหลังจากทุกนิ้วเหยียดครบแล้วอย่างน้อย 0.1 วินาที
  readHand(dt) {
    const pts = this.hooks.readHand?.();
    const finger = pts ? detectFingerTap(pts).finger : null;
    if (!finger) { this.freeFor += dt; if (this.freeFor >= 0.1) this.armed = true; }
    else if (this.armed && finger !== this.prevFinger) { this.armed = false; this.freeFor = 0; this.tap(FINGER_NAMES.indexOf(finger)); }
    if (finger) this.freeFor = 0;
    this.prevFinger = finger;
    this.handSeen = !!pts;
  }

  // แตะนิ้ว i (0 = โป้ง … 4 = ก้อย) ใช้ทั้งกล้อง คีย์บอร์ด และคลิก
  tap(i) {
    const r = this.round;
    if (!r?.active || this.engine.paused || i < 0) return;
    const pad = this.pads[i];
    pad.flash = 0.25;
    if (r.phase !== 'lit') return;                     // ยังไม่มีแป้นสว่าง ไม่นับ
    const target = FINGER_NAMES[r.target], tapped = FINGER_NAMES[i];
    const rt = (this.engine.time - r.litAt) * 1000;
    if (i === r.target) {
      r.reactionTimes[target].push(Math.round(rt));
      r.score += 10 * r.level; r.streak++;
      this.ripples.push({ x: pad.x, y: pad.y, r: pad.r, life: 0.8, color: cssVar('--f-' + target) });
      this.engine.particles.burst(pad.x, pad.y, 30, [cssVar('--f-' + target), cssVar('--text')], 260, 150, 0.8);
      this.engine.sound.note(i);                       // โน้ตเพนทาโทนิกประจำนิ้ว
      this.log('correct', target, tapped, rt);
      if (r.streak >= UP_STREAK) this.changeLevel(+1);
    } else {
      r.confusion[target][tapped]++;                    // นิ้วเป้าหมายถูกสับสนเป็นนิ้วอื่น
      r.score = Math.max(0, r.score - 5); r.streak = 0; r.misses++;
      pad.shake = 0.5; this.pads[r.target].shake = 0.5;
      this.engine.sound.miss();
      this.log('wrong', target, tapped, rt);
      if (r.misses >= DOWN_MISSES) this.changeLevel(-1);
    }
    this.next();
  }

  log(result, target, tapped, rt) {
    const r = this.round;
    r.trials.push({ n: r.trials.length + 1, t: Math.round(this.engine.time * 1000), finger: target, tapped, result, reactionMs: Math.round(rt), level: r.level });
  }
  next() { const r = this.round; r.phase = 'gap'; r.wait = LEVEL_GAP[r.level - 1]; r.target = -1; }
  changeLevel(d) {
    const r = this.round, nl = Math.min(5, Math.max(1, r.level + d));
    r.streak = 0; r.misses = 0;
    if (nl === r.level) return;
    r.level = nl; r.maxLevel = Math.max(r.maxLevel, nl);
    if (d > 0) this.engine.sound.levelUp();
    this.hooks.onLevel?.(nl, d);
  }

  update(dt) {
    this.ripples = this.ripples.filter((p) => (p.life -= dt) > 0);
    this.pads.forEach((p) => { p.shake = Math.max(0, p.shake - dt); p.flash = Math.max(0, p.flash - dt); });
    const r = this.round;
    if (!r?.active) return;
    this.hooks.onTick?.(dt);
    if (this.source === 'hand') this.readHand(dt);
    if (r.phase === 'gap') {
      r.wait -= dt;
      if (r.wait <= 0) {                               // สุ่มแป้นใหม่ (ไม่ซ้ำแป้นเดิมติดกัน)
        const last = r.trials.at(-1)?.finger;
        let k; do { k = Math.floor(Math.random() * 5); } while (FINGER_NAMES[k] === last && Math.random() < 0.7);
        r.target = k; r.phase = 'lit'; r.litAt = this.engine.time;
      }
    } else if (this.engine.time - r.litAt > MISS_SEC) {   // ช้าเกิน 3 วินาที = พลาด
      const target = FINGER_NAMES[r.target];
      r.streak = 0; r.misses++;
      this.engine.sound.miss();
      this.log('miss', target, null, MISS_SEC * 1000);
      if (r.misses >= DOWN_MISSES) this.changeLevel(-1);
      this.next();
    }
    r.timeLeft -= dt;
    this.hud();
    if (r.timeLeft <= 0) this.endRound();
  }

  hud() {
    const r = this.round;
    this.hooks.onHud?.({ score: r.score, level: r.level, streak: r.streak, misses: r.misses, timeLeft: Math.max(0, r.timeLeft), timeFrac: Math.max(0, r.timeLeft) / this.roundSec });
  }

  endRound() {
    const r = this.round; if (!r?.active) return;
    r.active = false; r.phase = 'gap'; r.target = -1;
    const correct = r.trials.filter((t) => t.result === 'correct').length;
    this.hooks.onEnd?.({
      startTime: r.startTime, endTime: Date.now(), score: r.score, maxLevel: r.maxLevel, trials: r.trials, correct,
      wrong: r.trials.filter((t) => t.result === 'wrong').length, miss: r.trials.filter((t) => t.result === 'miss').length,
      accuracy: r.trials.length ? correct / r.trials.length : 0, reactionTimes: r.reactionTimes, confusion: r.confusion,
    });
  }

  // ---------------- วาด ----------------
  layout() {
    const { width: w, height: h } = this.canvas;
    const r = Math.min(w / 12, h / 5, 90);
    this.pads.forEach((p, i) => { p.r = r; p.x = w * (0.14 + i * 0.18); p.y = h * 0.55; });
  }
  draw(ctx, phase) {
    if (phase === 'before') { drawStage(ctx, this.canvas, this.engine.time); return; }
    this.layout();
    const r = this.round;
    drawPads(ctx, this.pads, {
      target: r?.active && r.phase === 'lit' ? r.target : -1, remain: r?.phase === 'lit' ? 1 - (this.engine.time - r.litAt) / MISS_SEC : 0,
      ripples: this.ripples, t: this.engine.time, keys: this.source === 'keys',
      hint: r?.active && this.source === 'hand' && !this.handSeen ? '✋ ยกมือให้กล้องเห็น (หันฝ่ามือเข้ากล้อง)' : '',
    });
  }
}
