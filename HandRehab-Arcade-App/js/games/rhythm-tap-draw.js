// ============================================================
// rhythm-tap-draw.js — ภาพของเกมเคาะจังหวะ: เวทีนีออน ไฟสปอตไลต์ แป้น 5 นิ้ว คลื่นวง
// สีทั้งหมดอ่านจาก tokens ผ่าน cssVar (สีนิ้ว --f-thumb … --f-little)
// ============================================================
import { cssVar } from '../ui.js';
import { FINGER_NAMES, FINGER_TH } from '../hand.js';

let C = {}, cKey = '';
function colors() {
  if (cKey === document.body.className) return C;
  cKey = document.body.className;
  C = { top: cssVar('--world-top'), bottom: cssVar('--world-bottom'), g1: cssVar('--world-glow-1'), g2: cssVar('--world-glow-2'), g3: cssVar('--world-glow-3'),
    text: cssVar('--text'), text2: cssVar('--text-2'), err: cssVar('--error'), line: cssVar('--line'), font: cssVar('--font'), num: cssVar('--font-num'),
    f: FINGER_NAMES.map((f) => cssVar('--f-' + f)) };
  return C;
}

// เวที: พื้นไล่สี + ไฟสปอตไลต์ส่ายช้า ๆ + เส้นพื้นเวที
export function drawStage(ctx, canvas, t) {
  const c = colors(), { width: w, height: h } = canvas;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, c.top); g.addColorStop(1, c.bottom);
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  [[0.15, c.g1, 0.5], [0.5, c.g2, -0.4], [0.85, c.g3, 0.35]].forEach(([fx, col, sp]) => {
    const a = Math.sin(t * sp) * 0.35;                       // มุมส่ายของไฟ
    ctx.save(); ctx.translate(fx * w, -10); ctx.rotate(a);
    const beam = ctx.createLinearGradient(0, 0, 0, h * 0.9);
    beam.addColorStop(0, col); beam.addColorStop(1, 'transparent');
    ctx.globalAlpha = 0.18; ctx.fillStyle = beam;
    ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(12, 0); ctx.lineTo(w * 0.12, h * 0.9); ctx.lineTo(-w * 0.12, h * 0.9); ctx.closePath(); ctx.fill();
    ctx.restore();
  });
  ctx.globalAlpha = 1;
  ctx.strokeStyle = c.g2; ctx.globalAlpha = 0.5; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, h * 0.82); ctx.lineTo(w, h * 0.82); ctx.stroke(); ctx.globalAlpha = 1;
}

// แป้น 5 แป้น: แป้นเป้าหมายสว่าง + วงนับถอยหลัง 3 วินาที · แป้นที่ผิดสั่นเป็นสีแดง
export function drawPads(ctx, pads, { target, remain, ripples, t, keys, hint }) {
  const c = colors();
  for (const p of pads) {
    const lit = p.i === target, dx = p.shake > 0 ? Math.sin(t * 70) * 10 * (p.shake / 0.5) : 0;
    const x = p.x + dx, y = p.y, col = p.shake > 0 ? c.err : c.f[p.i];
    const R = p.r * (lit ? 1.08 + Math.sin(t * 8) * 0.04 : 1);
    if (lit) {                                               // แสงเรืองรอบแป้นที่ต้องแตะ
      const glow = ctx.createRadialGradient(x, y, R * 0.5, x, y, R * 1.9);
      glow.addColorStop(0, col); glow.addColorStop(1, 'transparent');
      ctx.globalAlpha = 0.55; ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y, R * 1.9, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = lit || p.shake > 0 ? 1 : 0.28 + p.flash * 2;
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1; ctx.lineWidth = 4; ctx.strokeStyle = col; ctx.stroke();
    if (lit && remain > 0) {                                 // วงนับถอยหลังก่อนนับว่าพลาด
      ctx.strokeStyle = c.text; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.arc(x, y, R + 14, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * remain); ctx.stroke();
    }
    ctx.fillStyle = lit ? c.top : c.text; ctx.textAlign = 'center';
    ctx.font = `800 ${Math.round(R * 0.42)}px ${c.font}`;
    ctx.fillText(FINGER_TH[p.finger], x, y + R * 0.15);
    ctx.fillStyle = c.text2; ctx.font = `600 ${Math.round(Math.max(14, R * 0.22))}px ${c.font}`;
    ctx.fillText(keys ? `ปุ่ม ${p.i + 1}` : 'นิ้ว' + FINGER_TH[p.finger], x, y + R + 40);
  }
  for (const r of ripples) {                                  // คลื่นวงเมื่อแตะถูก
    ctx.globalAlpha = r.life / 0.8; ctx.strokeStyle = r.color; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(r.x, r.y, r.r * (1 + (0.8 - r.life) * 1.6), 0, Math.PI * 2); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  if (hint) { ctx.fillStyle = c.text; ctx.font = `700 22px ${c.font}`; ctx.textAlign = 'center'; ctx.fillText(hint, ctx.canvas.width / 2, 44); }
}
