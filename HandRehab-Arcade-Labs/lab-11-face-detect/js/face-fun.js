// ============================================================
// face-fun.js — มงกุฎ / แว่นกันแดดเสมือน (Lab 11 COULD)
// ใช้ทดสอบว่ากรอบและจุดสำคัญบนใบหน้าอยู่ตรงตำแหน่งจริงแค่ไหน
// จุดสำคัญ BlazeFace 6 จุด (0-1): 0 ตาขวา 1 ตาซ้าย 2 ปลายจมูก 3 ปาก 4 หูขวา 5 หูซ้าย
// ============================================================
import { cssVar } from './ui.js';

export function drawAccessory(ctx, face, kind, W, H) {
  const b = face.box;
  const x = b.x * W, y = b.y * H, w = b.w * W, h = b.h * H;
  ctx.save();
  if (kind === 'crown') {
    // มงกุฎ 5 แฉก วางเหนือขอบบนของกรอบ
    const cw = w * 0.8, ch = h * 0.35, cx = x + (w - cw) / 2, base = y - h * 0.05;
    ctx.fillStyle = cssVar('--warning');
    ctx.strokeStyle = cssVar('--pink'); ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, base);
    const peaks = 5;
    for (let i = 0; i <= peaks * 2; i++) {
      const px = cx + (cw * i) / (peaks * 2);
      const py = i % 2 === 0 ? base - ch : base - ch * 0.45;
      ctx.lineTo(px, py);
    }
    ctx.lineTo(cx + cw, base);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (kind === 'glasses') {
    // แว่นกันแดด: วงกลมทึบ 2 วงที่ตำแหน่งดวงตา + สะพานแว่น
    const k = face.keypoints || [];
    const eR = k[0] ? { x: k[0].x * W, y: k[0].y * H } : { x: x + w * 0.3, y: y + h * 0.38 };
    const eL = k[1] ? { x: k[1].x * W, y: k[1].y * H } : { x: x + w * 0.7, y: y + h * 0.38 };
    const r = Math.hypot(eL.x - eR.x, eL.y - eR.y) * 0.38;
    ctx.fillStyle = cssVar('--bg');
    ctx.strokeStyle = cssVar('--primary'); ctx.lineWidth = 4;
    for (const e of [eR, eL]) { ctx.beginPath(); ctx.arc(e.x, e.y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(eR.x + (eL.x > eR.x ? r : -r), eR.y); ctx.lineTo(eL.x - (eL.x > eR.x ? r : -r), eL.y); ctx.stroke();
  }
  ctx.restore();
}
