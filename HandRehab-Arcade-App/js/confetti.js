// ============================================================
// confetti.js — เอฟเฟกต์กระดาษสีฉลองตอนเข้าสู่ระบบสำเร็จ (Lab 15)
// วาดบน canvas เต็มจอ สีอ่านจาก CSS variable (ไม่ฮาร์ดโค้ดสี)
// โหมดสงบ (calm) จะไม่เรียกไฟล์นี้เลย
// ============================================================
import { cssVar } from './ui.js';

export function celebrate(canvas, { count = 160, duration = 2600 } = {}) {
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = innerWidth), H = (canvas.height = innerHeight);
  const colors = ['--primary', '--secondary', '--success', '--warning', '--pink', '--sky'].map(cssVar);
  // สร้างชิ้นกระดาษพุ่งออกจากกลางจอ แล้วตกลงด้วยแรงโน้มถ่วง
  const parts = Array.from({ length: count }, () => {
    const a = Math.random() * Math.PI * 2, s = 4 + Math.random() * 9;
    return { x: W / 2, y: H * 0.45, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 6, r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
      w: 6 + Math.random() * 8, h: 4 + Math.random() * 6, c: colors[(Math.random() * colors.length) | 0] };
  });
  const t0 = performance.now();
  return new Promise((done) => {
    const step = (now) => {
      const t = now - t0;
      ctx.clearRect(0, 0, W, H);
      ctx.globalAlpha = Math.max(0, 1 - t / duration);
      for (const p of parts) {
        p.vy += 0.25; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
      }
      if (t < duration) requestAnimationFrame(step); else { ctx.clearRect(0, 0, W, H); done(); }
    };
    requestAnimationFrame(step);
  });
}
