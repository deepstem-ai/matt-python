// ============================================================
// game-engine.js — เอนจินเกม 2 มิติบน canvas (Lab 22)
//  - ลูปเกมด้วย requestAnimationFrame แยก update(dt) กับ draw(ctx) ชัดเจน
//  - ส่งเวลาที่ผ่านไป (วินาที) เข้า update ทุกเฟรม → เกมเร็วเท่ากันทุกเครื่อง
//  - ระบบอนุภาครีไซเคิลวัตถุ (ไม่สร้างใหม่ทุกเฟรม)
//  - ระบบเสียงสร้างด้วย Web Audio API ไม่ใช้ไฟล์เสียง
// ห้ามแตะ: กล้อง, โมเดล AI, ฐานข้อมูล
// ============================================================

// สีตั้งต้นของอนุภาค อ่านจาก tokens.css (ห้ามเขียนรหัสสีตรง ๆ ในไฟล์ JS)
function tokenColors() {
  if (typeof document === 'undefined' || !document.body) return ['white'];
  const cs = getComputedStyle(document.body);
  return ['--primary', '--secondary', '--pink'].map((n) => cs.getPropertyValue(n).trim()).filter(Boolean);
}

// ---------------- ระบบอนุภาค ----------------
export class ParticlePool {
  constructor(max = 400) {
    this.max = max;          // จำนวนสูงสุดพร้อมกัน
    this.limit = max;        // ลดลงได้เมื่อเครื่องช้า
    // สร้างวัตถุไว้ล่วงหน้าทั้งหมด แล้วหมุนเวียนใช้ ไม่ new ระหว่างเล่น
    this.items = Array.from({ length: max }, () => ({ alive: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1, color: 'white', size: 3, g: 0 }));
    this.enabled = true;
  }
  get alive() { let n = 0; for (const p of this.items) if (p.alive) n++; return n; }

  // ระเบิดอนุภาคที่จุด (x,y)
  burst(x, y, count = 30, colors = null, speed = 240, gravity = 300, lifetime = 0.9) {
    if (!this.enabled) return;
    if (!colors?.length) colors = tokenColors();
    let made = 0;
    for (let i = 0; i < this.limit && made < count; i++) {
      const p = this.items[i];
      if (p.alive) continue;
      const a = Math.random() * Math.PI * 2, s = speed * (0.3 + Math.random() * 0.7);
      Object.assign(p, { alive: true, x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: lifetime, maxLife: lifetime, color: colors[made % colors.length], size: 2 + Math.random() * 4, g: gravity });
      made++;
    }
  }
  update(dt) {
    for (const p of this.items) {
      if (!p.alive) continue;
      p.life -= dt;
      if (p.life <= 0) { p.alive = false; continue; }
      p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
    }
  }
  draw(ctx) {
    for (const p of this.items) {
      if (!p.alive) continue;
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  clear() { this.items.forEach((p) => (p.alive = false)); }
}

// ---------------- ระบบเสียง (Web Audio) ----------------
export class Sound {
  constructor() { this.ctx = null; this.enabled = true; this.volume = 0.25; }
  // ต้องเรียกหลังผู้ใช้กดหรือคลิกครั้งแรก เพราะเบราว์เซอร์บล็อกเสียงอัตโนมัติ
  // ผูกกับการกด/คลิก/แตะ ครั้งแรกของผู้ใช้โดยอัตโนมัติ (เรียกครั้งเดียวตอนเริ่มหน้า)
  autoUnlock(target = window) {
    const go = () => { this.unlock(); ['pointerdown', 'keydown', 'touchstart'].forEach((e) => target.removeEventListener(e, go, true)); };
    ['pointerdown', 'keydown', 'touchstart'].forEach((e) => target.addEventListener(e, go, true));
  }
  unlock() {
    if (!this.ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) this.ctx = new AC(); }
    if (this.ctx?.state === 'suspended') this.ctx.resume();
  }
  // เล่นโน้ตหนึ่งตัว: ความถี่ Hz, ยาวกี่วินาที, รูปคลื่น, หน่วงก่อนเล่น
  tone(freq = 440, dur = 0.15, type = 'sine', delay = 0, vol = 1) {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(this.volume * vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.ctx.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }
  // เสียงไล่ความถี่ (เช่น เสียงวูบ)
  sweep(f1, f2, dur = 0.25, type = 'sawtooth') {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(this.volume * 0.6, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.ctx.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  // เสียงสำเร็จรูป 5 แบบ
  grab()  { this.tone(660, 0.08, 'triangle'); }
  score() { this.tone(784, 0.1, 'triangle'); this.tone(1047, 0.18, 'triangle', 0.08); }
  miss()  { this.sweep(300, 120, 0.3, 'square'); }
  combo() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.12, 'sine', i * 0.06)); }
  levelUp() { [392, 523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.15, 'triangle', i * 0.08)); }
  // โน้ตเพนทาโทนิก 5 ตัว (C D E G A) ฟังรวมกันแล้วไพเราะ ใช้กับเกมเคาะจังหวะ
  static PENTA = [523.25, 587.33, 659.25, 783.99, 880.0];
  note(i) { this.tone(Sound.PENTA[i % 5], 0.3, 'sine'); }
}

// ---------------- ตัวเกม ----------------
export class GameEngine {
  // update(dt, engine) และ draw(ctx, engine) เป็นฟังก์ชันของเกมแต่ละเกม
  constructor(canvas, { update = () => {}, draw = () => {}, maxParticles = 400, lowFps = 30, lowFpsSeconds = 3, calm = false, onAdapt = null } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.userUpdate = update; this.userDraw = draw;
    this.entities = new Set();
    this.particles = new ParticlePool(maxParticles);
    this.sound = new Sound();
    this.running = false; this.paused = false;
    this.fps = 0; this._frames = 0; this._fpsT = 0; this._last = 0;
    this.time = 0;                      // เวลาเล่นสะสม (วินาที ไม่นับตอนหยุดพัก)
    this.lowFps = lowFps; this.lowFpsSeconds = lowFpsSeconds; this._lowFor = 0;
    this.onAdapt = onAdapt;
    this.setCalm(calm);
    this._loop = this._loop.bind(this);
  }

  // โหมดสงบ: ปิดอนุภาคและเสียงทั้งหมด
  setCalm(on) {
    this.calm = on; this.particles.enabled = !on; this.sound.enabled = !on;
    if (on) this.particles.clear(); // ล้างอนุภาคที่ค้างอยู่ทันที
  }

  addEntity(e) { this.entities.add(e); return e; }
  removeEntity(e) { this.entities.delete(e); }

  start() {
    if (this.running) return;
    this.running = true; this.paused = false;
    this._last = performance.now(); this._fpsT = this._last; this._frames = 0;
    this._raf = requestAnimationFrame(this._loop);
  }
  stop() { this.running = false; cancelAnimationFrame(this._raf); }
  pause() { this.paused = true; }
  resume() { if (this.paused) { this.paused = false; this._last = performance.now(); } }

  _loop(now) {
    if (!this.running) return;
    // dt = เวลาที่ผ่านไปตั้งแต่เฟรมก่อน (วินาที) จำกัดไม่เกิน 0.1 กันกระโดดเมื่อสลับแท็บ
    const dt = Math.min(0.1, (now - this._last) / 1000);
    this._last = now;
    this._frames++;
    if (now - this._fpsT >= 1000) {
      this.fps = Math.round((this._frames * 1000) / (now - this._fpsT));
      this._frames = 0; this._fpsT = now;
      this._adapt(1);
    }
    if (!this.paused) {
      this.time += dt;
      this.update(dt);
    }
    this.draw();
    this._raf = requestAnimationFrame(this._loop);
  }

  // ถ้า FPS ต่ำกว่าเกณฑ์ติดต่อกันหลายวินาที ลดจำนวนอนุภาคลงครึ่งหนึ่ง
  _adapt(sec) {
    if (this.fps < this.lowFps) this._lowFor += sec; else this._lowFor = 0;
    if (this._lowFor >= this.lowFpsSeconds && this.particles.limit > 25) {
      this.particles.limit = Math.floor(this.particles.limit / 2);
      this._lowFor = 0;
      console.info('[engine] FPS ต่ำ ลดอนุภาคเหลือ', this.particles.limit);
      this.onAdapt?.(this.particles.limit);
    }
  }

  update(dt) {
    for (const e of this.entities) e.update?.(dt, this);
    this.particles.update(dt);
    this.userUpdate(dt, this);
  }
  draw() {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.userDraw(ctx, this, 'before');
    for (const e of this.entities) e.draw?.(ctx, this);
    this.particles.draw(ctx);
    this.userDraw(ctx, this, 'after');
  }
  get objectCount() { return this.entities.size + this.particles.alive; }

  // ปรับขนาด canvas ตามขนาดที่แสดงจริง (คมชัดบนจอความละเอียดสูง)
  fit() {
    const r = this.canvas.getBoundingClientRect();
    const w = Math.round(r.width), h = Math.round(r.height);
    if (w && h && (this.canvas.width !== w || this.canvas.height !== h)) { this.canvas.width = w; this.canvas.height = h; }
  }
}

// แปลงจุด landmark (0-1) เป็นพิกัดบน canvas ของเกม แบบกลับซ้ายขวาให้ตรงกับภาพกระจก
export function toScreen(p, canvas, mirror = true) {
  return { x: (mirror ? 1 - p.x : p.x) * canvas.width, y: p.y * canvas.height };
}
