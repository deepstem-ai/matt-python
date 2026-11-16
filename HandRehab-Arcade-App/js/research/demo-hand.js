// ============================================================
// demo-hand.js — โหมดสาธิต: มือจำลองที่บังคับด้วยเมาส์ คีย์บอร์ด และสไลเดอร์
// ใช้เมื่อไม่มีกล้อง / ไม่มีโมเดล / อยากสาธิตหน้าห้องแบบไม่ต้องยกมือ
//   เมาส์ขยับ = ย้ายมือ (จุดโคนนิ้วกลางตามเมาส์)   กดเมาส์ค้าง / Space = จีบนิ้ว
//   กด 1–5 ค้าง = งอนิ้ว โป้ง ชี้ กลาง นาง ก้อย    F = กำมือ   O = แบกางนิ้ว
//   W = งอข้อมือ   S = เหยียดข้อมือ   ล้อเมาส์ = ขยับมือเข้า-ออกจากกล้อง
// ============================================================
import { synthHand, moveHand, toImagePoints } from './synth-hand.js';

const FINGERS = ['thumb', 'index', 'middle', 'ring', 'little'];
const FTH = { thumb: 'โป้ง', index: 'ชี้', middle: 'กลาง', ring: 'นาง', little: 'ก้อย' };
// สไลเดอร์ทั้งหมด: [ชื่อ, ป้ายไทย, min, max, step, ค่าเริ่มต้น]
const SLIDERS = [
  ...FINGERS.map((f) => [f, 'งอนิ้ว' + FTH[f], 0, 1, 0.05, 0]),
  ['spread', 'กางนิ้ว (องศาต่อช่อง)', 0, 20, 1, 7],
  ['scale', 'ขนาดมือ / ความใกล้กล้อง', 0.12, 0.5, 0.01, 0.26],
  ['wrist', 'งอ(+) / เหยียด(−) ข้อมือ °', -60, 60, 1, 0],
  ['pinch', 'จีบนิ้ว', 0, 1, 0.05, 0],
];

export class DemoHand {
  // stage = กล่องวิดีโอ (รับเมาส์), panel = ที่วางสไลเดอร์
  constructor(stage, panel, { show = null } = {}) {
    this.stage = stage; this.panel = panel; this.active = false;
    this.base = Object.fromEntries(SLIDERS.map((s) => [s[0], s[5]]));
    this.cur = { ...this.base };
    this.pos = { x: 0.5, y: 0.5 };
    this.keys = new Set(); this.mouseDown = false;
    this.move = false; this.zoom = false; this.lastT = 0;
    this.buildPanel(show || SLIDERS.map((s) => s[0]));
    this.bind();
  }

  buildPanel(show) {
    const rows = SLIDERS.filter((s) => show.includes(s[0])).map(([k, label, min, max, step, v]) =>
      `<label class="demo-row"><span>${label} <b class="num" data-v="${k}">${v}</b></span>
       <input type="range" data-k="${k}" min="${min}" max="${max}" step="${step}" value="${v}"></label>`).join('');
    this.panel.innerHTML = `<details class="card-neon demo-panel" open><summary><b>🖱️ โหมดสาธิต — มือจำลอง</b></summary>
      <p class="muted">เมาส์ = ย้ายมือ · กดเมาส์ค้าง/Space = จีบ · กด 1–5 ค้าง = งอนิ้วโป้ง→ก้อย · F = กำมือ · O = กางนิ้ว · W/S = งอ/เหยียดข้อมือ · ล้อเมาส์ = เข้า-ออก</p>
      ${rows}
      <div class="row"><label class="switch"><input type="checkbox" data-opt="move"> ขยับเอง</label>
      <label class="switch"><input type="checkbox" data-opt="zoom"> เคลื่อนเข้า-ออกเอง</label></div></details>`;
    this.panel.querySelectorAll('input[type=range]').forEach((inp) => {
      inp.oninput = () => { this.base[inp.dataset.k] = +inp.value; this.panel.querySelector(`[data-v="${inp.dataset.k}"]`).textContent = inp.value; };
    });
    this.panel.querySelectorAll('[data-opt]').forEach((c) => { c.onchange = () => { this[c.dataset.opt] = c.checked; }; });
    this.panel.classList.add('hidden');
  }

  // ตั้งค่าจากโค้ด เช่น setOption('zoom', true)
  setOption(name, v) {
    this[name] = v;
    const c = this.panel.querySelector(`[data-opt="${name}"]`); if (c) c.checked = v;
  }

  bind() {
    const mirror = () => this.stage.classList.contains('mirror');
    this.stage.addEventListener('pointermove', (e) => {
      if (!this.active) return;
      const r = this.stage.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      this.pos = { x: mirror() ? 1 - x : x, y };
    });
    this.stage.addEventListener('pointerdown', (e) => { if (this.active) { this.mouseDown = true; e.preventDefault(); } });
    window.addEventListener('pointerup', () => { this.mouseDown = false; });
    this.stage.addEventListener('wheel', (e) => {
      if (!this.active) return;
      e.preventDefault();
      this.base.scale = Math.max(0.12, Math.min(0.5, this.base.scale - Math.sign(e.deltaY) * 0.02));
      const inp = this.panel.querySelector('[data-k="scale"]'); if (inp) { inp.value = this.base.scale; inp.oninput(); }
    }, { passive: false });
    const isTyping = (e) => /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) && e.target.type !== 'range' && e.target.type !== 'checkbox';
    window.addEventListener('keydown', (e) => {
      if (!this.active || isTyping(e)) return;
      const k = e.key.toLowerCase();
      if ('12345fows '.includes(k)) { this.keys.add(k); if (k === ' ') e.preventDefault(); }
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
  }

  setActive(on) { this.active = on; this.panel.classList.toggle('hidden', !on); }

  // ค่าเป้าหมาย = สไลเดอร์ + ปุ่มที่กดค้างอยู่
  target() {
    const t = { ...this.base };
    FINGERS.forEach((f, i) => { if (this.keys.has(String(i + 1))) t[f] = 1; });
    if (this.keys.has('f')) { t.index = t.middle = t.ring = t.little = 1; t.thumb = 0.6; }
    if (this.keys.has('o')) t.spread = 16;
    if (this.keys.has('w')) t.wrist = 50;
    if (this.keys.has('s')) t.wrist = -50;
    if (this.keys.has(' ') || this.mouseDown) t.pinch = 1;
    return t;
  }

  // คืนมือจำลองรูปแบบเดียวกับ detectHand(): { points, sq, aspect, handedness, score }
  hand(aspect, now) {
    const dt = Math.min(100, this.lastT ? now - this.lastT : 16);
    this.lastT = now;
    const t = this.target();
    const k = Math.min(1, dt / 90); // ค่อย ๆ เปลี่ยน ให้คะแนนขึ้นลงแบบมือจริง
    for (const key of Object.keys(t)) this.cur[key] += (t[key] - this.cur[key]) * k;
    const c = this.cur;
    let scale = c.scale, px = this.pos.x, py = this.pos.y;
    if (this.zoom) scale = 0.3 + 0.15 * Math.sin(now / 1400);
    if (this.move) { px = 0.5 + 0.22 * Math.sin(now / 1100); py = 0.5 + 0.12 * Math.sin(now / 550); }
    const raw = synthHand({ curls: { thumb: c.thumb, index: c.index, middle: c.middle, ring: c.ring, little: c.little }, spread: c.spread, scale, cx: 0, cy: 0, pinch: c.pinch, wrist: c.wrist });
    const sq = moveHand(raw, px * aspect - raw[9].x, py - raw[9].y);
    return { points: toImagePoints(sq, aspect), sq, aspect, world: null, handedness: 'Demo', score: 1, demo: true };
  }
}
