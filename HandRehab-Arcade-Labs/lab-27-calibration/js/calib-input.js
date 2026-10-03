// ============================================================
// calib-input.js — แหล่งข้อมูลมือของวิซาร์ดปรับเทียบ: กล้องจริง หรือ มือจำลอง (โหมดสาธิต)
// ทุกเฟรมเรียก onFrame(t วินาที, sq จุดแก้สัดส่วนแล้ว | null)
// ============================================================
import { startCamera, stopCamera, cameraErrorMessage } from './camera.js';
import { initHand, detectHand, drawHand, fitCanvas } from './hand.js';
import { demoHand } from './synth-hand.js';

export class CalibInput {
  constructor({ video, handCanvas, demoCanvas }) {
    Object.assign(this, { video, handCanvas, demoCanvas });
    this.source = null;                 // 'hand' | 'demo'
    this.gesture = 'pinch';
    this.demo = { press: false, auto: false, amount: 0, tremorLevel: 0 };
    this.onFrame = () => {};
    this._vt = -1; this._last = null;
    const loop = () => { this.tick(); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
    window.addEventListener('pagehide', () => stopCamera());
  }

  // เปิดกล้อง + โมเดลมือ ถ้าพลาดโยน Error ที่มี title/detail ภาษาไทย
  async startCamera(onProgress) {
    try { await startCamera(this.video); }
    catch (e) { const m = cameraErrorMessage(e); const err = new Error(m.title); err.detail = m.detail; throw err; }
    try { await initHand({ onProgress }); }
    catch (e) { stopCamera(); const err = new Error('โหลดโมเดลมือไม่สำเร็จ'); err.detail = e.message + ' — ตรวจอินเทอร์เน็ตแล้วลองใหม่'; throw err; }
    this.source = 'hand';
  }
  useDemo() { stopCamera(); this.source = 'demo'; }

  // ทำท่าอัตโนมัติ n ครั้ง (โหมดสาธิต) — ทำท่า 0.8 วิ ปล่อย 0.8 วิ ต่อครั้ง
  autoReps(n = 5) { this.demo.auto = { n, t0: performance.now() / 1000 }; }

  tick() {
    const t = performance.now() / 1000;
    if (this.source === 'hand') {
      if (this.video.currentTime === this._vt) return;         // ภาพยังไม่เปลี่ยน ไม่ต้องคำนวณซ้ำ
      this._vt = this.video.currentTime;
      fitCanvas(this.handCanvas, this.video);
      const h = detectHand(this.video, performance.now());
      drawHand(this.handCanvas, h, { style: 'neon' });
      this.onFrame(t, h?.sq || null, h);
    } else if (this.source === 'demo') {
      const d = this.demo, dt = this._last ? Math.min(0.1, t - this._last) : 0; this._last = t;
      let target = d.press ? 1 : 0;
      if (d.auto) {
        const k = (t - d.auto.t0) / 1.6;
        if (k >= d.auto.n) d.auto = false; else target = k % 1 < 0.5 ? 1 : 0;   // ครึ่งแรกทำท่า ครึ่งหลังปล่อย
      }
      d.amount += (target - d.amount) * Math.min(1, dt * 7);  // ขยับนุ่ม ๆ เหมือนมือจริง
      const sq = demoHand(t, { gesture: this.gesture, amount: d.amount, tremorLevel: d.tremorLevel });
      drawHand(this.demoCanvas, { points: sq }, { style: 'neon' });
      this.onFrame(t, sq, null);
    }
  }
}

// แอนิเมชันสาธิตท่า (ขั้น 3): มือจำลองทำท่าวนไปมา ไม่มีอาการสั่น
export function animateGesture(canvas, gesture, isAlive) {
  const draw = () => {
    if (!isAlive()) return;
    const t = performance.now() / 1000, amount = (1 - Math.cos(t * Math.PI * 0.8)) / 2;
    const r = canvas.getBoundingClientRect();
    if (r.width && canvas.width !== Math.round(r.width)) { canvas.width = Math.round(r.width); canvas.height = Math.round(r.width); }
    drawHand(canvas, { points: demoHand(t, { gesture, amount }) }, { style: 'neon' });
    requestAnimationFrame(draw);
  };
  draw();
}
