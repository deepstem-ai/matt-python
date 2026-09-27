// ============================================================
// spread-wall.js — เกม 3 "กางนิ้วผ่านกำแพง" (Lab 25) ธีมใต้ทะเล
// กติกา: ตัวละครคือมือที่ "ความกว้าง" เปลี่ยนตามการกางนิ้วจริง (มุมนิ้วชี้ ↔ นิ้วก้อย)
//        กำแพงปะการังเลื่อนมาจากขวา ช่องกว้างไม่เท่ากัน ต้องกางให้พอดีช่อง
//        กว้างไป = ชนขอบ · แคบไป = ปลายนิ้วไม่ถึงแถบเขียว → ชน · ชนแล้วพลังลด หมดพลัง = จบเกม
// สำคัญ: แปลงมุม → ความกว้าง ด้วยค่าที่ปรับเทียบรายคน (min/max) ห้ามใช้ตัวเลขตายตัว
// ============================================================
import { GameEngine } from '../game-engine.js';
import { spread } from '../geometry.js';
import { cssVar } from '../ui.js';
import { drawSea, drawWall, drawHandChar } from './spread-wall-draw.js';

// ความยากเพิ่มทีละขั้น: ทุก 5 กำแพงที่ผ่าน กำแพงเร็วขึ้นและช่องเผื่อ (tolerance) แคบลง
export const speedOf = (lvl) => Math.min(360, 160 + 20 * (lvl - 1));   // px/วินาที
export const tolOf = (lvl) => Math.max(0.08, 0.22 - 0.02 * (lvl - 1)); // สัดส่วนของช่วงกางนิ้วของคนนั้น
export const HIT_ENERGY = 25;

// แปลงมุมกาง (องศา) → ความกาง 0..1 ของคนนี้   sens > 1 = ง่ายขึ้น (ไม่ต้องกางถึงสุด)
export function openness(deg, calib, sens = 1) {
  const range = Math.max(1, (calib.max - calib.min) / sens);
  return Math.max(0, Math.min(1, (deg - calib.min) / range));
}

export class SpreadWall {
  // hooks: { readHand() → points|null, onTick(dt), onHud(state), onRecord(diffDeg), onEnd(summary) }
  constructor(canvas, hooks = {}) {
    this.canvas = canvas; this.hooks = hooks;
    this.source = 'hand';               // 'hand' | 'demo' (ล้อเมาส์ / แถบเลื่อน)
    this.demoDeg = 10;
    this.calib = null;                  // { min, max } องศา จากการปรับเทียบ
    this.sens = 1; this.practice = false;
    this.deg = null; this.u = 0; this.seen = false;
    this.prevBest = null;               // มุมกางสูงสุดของครั้งก่อน ๆ (องศา)
    this.round = null; this.flash = 0;
    this.engine = new GameEngine(canvas, { update: (dt) => this.update(dt), draw: (ctx, e, ph) => this.draw(ctx, ph) });
  }

  // อ่านมุมกางปัจจุบัน (ทำให้นุ่มด้วยค่าเฉลี่ยถ่วงน้ำหนัก กันตัวละครกระพริบ — Lab 27 จะเปลี่ยนเป็น One Euro)
  sample() {
    let raw = null;
    if (this.source === 'demo') raw = this.demoDeg;
    else { const pts = this.hooks.readHand?.(); if (pts) raw = spread(pts.sq || pts, 'index', 'little'); }
    this.seen = raw !== null;
    if (raw === null) return this.deg;
    this.deg = this.deg === null ? raw : this.deg + (raw - this.deg) * 0.35;
    if (this.calib) this.u = openness(this.deg, this.calib, this.sens);
    return this.deg;
  }

  startRound() {
    this.round = {
      active: true, startTime: Date.now(), energy: 100, level: 1, score: 0, passed: 0, hits: 0,
      walls: [], log: [], maxDeg: 0, recordShown: 0, nextIn: 1.0,
    };
    this.hud();
  }

  update(dt) {
    this.sample();
    this.flash = Math.max(0, this.flash - dt);
    const r = this.round;
    if (!r?.active) return;
    this.hooks.onTick?.(dt);
    // มุมกางสูงสุดของรอบนี้ (หลักฐานการฟื้นฟูที่สำคัญที่สุด)
    if (this.seen && this.deg > r.maxDeg) {
      r.maxDeg = this.deg;
      if (this.prevBest !== null && r.maxDeg > this.prevBest + 0.5 && r.maxDeg - this.prevBest >= r.recordShown + 1) {
        r.recordShown = Math.floor(r.maxDeg - this.prevBest);
        this.hooks.onRecord?.(r.maxDeg - this.prevBest);
      }
    }
    const speed = speedOf(r.level), tol = tolOf(r.level), g = this.geom();
    // สร้างกำแพงใหม่เป็นระยะ ช่องสุ่ม 0.1–0.95 ของช่วงที่คนนี้ทำได้ (ไม่เกินค่าที่เคยกางได้ตอนปรับเทียบ)
    r.nextIn -= dt;
    if (r.nextIn <= 0) {
      r.walls.push({ x: this.canvas.width + 40, gapU: 0.1 + Math.random() * 0.85, tol, done: false, ok: null });
      r.nextIn = Math.max(1.6, 2.6 - r.level * 0.1);
    }
    for (const w of r.walls) {
      w.x -= speed * dt;
      if (!w.done && w.x <= g.tipX) this.judge(w);       // กำแพงถึงปลายนิ้ว → ตัดสิน
    }
    r.walls = r.walls.filter((w) => w.x > -120);
    this.hud();
    if (r.energy <= 0) this.endRound();
  }

  // ตัดสินว่าผ่านหรือชน
  judge(w) {
    const r = this.round, g = this.geom();
    w.done = true;
    const ok = this.seen && Math.abs(this.u - w.gapU) <= w.tol;
    w.ok = ok;
    r.log.push({ n: r.log.length + 1, t: Math.round(this.engine.time * 1000), result: ok ? 'pass' : 'hit', targetU: +w.gapU.toFixed(3),
      handU: +this.u.toFixed(3), tol: +w.tol.toFixed(3), spreadDeg: this.deg === null ? null : +this.deg.toFixed(1), level: r.level });
    if (ok) {
      r.passed++; r.score += this.juice ? this.juice.hit(g.tipX, g.cy, 10 * r.level) : 10 * r.level;
      this.engine.sound.score();
      this.engine.particles.burst(g.tipX, g.cy, 40, [cssVar('--world-glow-1'), cssVar('--world-star'), cssVar('--success')], 260, -60, 1);
      if (r.passed % 5 === 0) { r.level++; this.engine.sound.levelUp(); this.hooks.onLevel?.(r.level); }
    } else {
      r.hits++; this.juice?.miss();
      if (!this.practice) r.energy = Math.max(0, r.energy - HIT_ENERGY);
      this.flash = 0.4;
      this.engine.sound.miss();
    }
  }

  endRound() {
    const r = this.round; if (!r?.active) return;
    r.active = false;
    const total = r.passed + r.hits;
    this.hooks.onEnd?.({
      startTime: r.startTime, endTime: Date.now(), score: r.score, passed: r.passed, hits: r.hits, walls: total,
      accuracy: total ? r.passed / total : 0, level: r.level, maxSpreadDeg: +r.maxDeg.toFixed(1), log: r.log,
    });
  }

  hud() {
    const r = this.round;
    this.hooks.onHud?.({ energy: r.energy, score: r.score, level: r.level, deg: this.deg, maxDeg: r.maxDeg, u: this.u });
  }

  // ตำแหน่งตัวละคร: มืออยู่ซ้าย 22% ของจอ ความกว้างของมือ = ช่วง minSpan..maxSpan ตามความกาง
  geom() {
    const { width: w, height: h } = this.canvas;
    const minSpan = h * 0.14, maxSpan = h * 0.66;
    const span = (u) => minSpan + u * (maxSpan - minSpan);
    return { cx: w * 0.2, cy: h * 0.5, tipX: w * 0.2 + h * 0.22, palmR: h * 0.06, span };
  }

  draw(ctx, phase) {
    if (phase === 'before') { drawSea(ctx, this.canvas, this.engine.time); return; }
    const g = this.geom(), r = this.round;
    if (r) for (const w of r.walls) {
      const match = this.seen && Math.abs(this.u - w.gapU) <= w.tol;
      drawWall(ctx, this.canvas, w, g, match);
    }
    drawHandChar(ctx, g, this.calib ? this.u : 0.3, this.flash, this.seen, this.engine.time);
  }
}
