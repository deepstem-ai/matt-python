// ============================================================
// spread-wall-draw.js — ภาพของเกมกางนิ้ว: ใต้ทะเล แสงส่อง ฟองอากาศ สาหร่าย กำแพงปะการัง ตัวละครมือ
// สีทั้งหมดอ่านจาก tokens (--world-*, --f-*) ผ่าน cssVar
// ============================================================
import { cssVar } from '../ui.js';

let C = {}, cKey = '';
function colors() {
  if (cKey === document.body.className) return C;
  cKey = document.body.className;
  C = { top: cssVar('--world-top'), bottom: cssVar('--world-bottom'), g1: cssVar('--world-glow-1'), g2: cssVar('--world-glow-2'), g3: cssVar('--world-glow-3'),
    bubble: cssVar('--world-star'), solid: cssVar('--world-solid'), ok: cssVar('--success'), err: cssVar('--error'), text: cssVar('--text'),
    font: cssVar('--font'), f: ['thumb', 'index', 'middle', 'ring', 'little'].map((f) => cssVar('--f-' + f)) };
  return C;
}
// ฟองอากาศสร้างครั้งเดียวแล้ววนใช้
const bubbles = Array.from({ length: 40 }, () => ({ x: Math.random(), y: Math.random(), r: 2 + Math.random() * 6, s: 0.03 + Math.random() * 0.06 }));

export function drawSea(ctx, canvas, t) {
  const c = colors(), { width: w, height: h } = canvas;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, c.top); g.addColorStop(1, c.bottom);
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  // ลำแสงจากผิวน้ำ
  ctx.fillStyle = c.g2;
  for (let i = 0; i < 4; i++) {
    const x = w * (0.15 + i * 0.25) + Math.sin(t * 0.3 + i) * 30;
    ctx.globalAlpha = 0.06; ctx.beginPath(); ctx.moveTo(x - 30, 0); ctx.lineTo(x + 30, 0); ctx.lineTo(x + 140, h); ctx.lineTo(x - 40, h); ctx.closePath(); ctx.fill();
  }
  // ฟองอากาศลอยขึ้น
  ctx.strokeStyle = c.bubble; ctx.lineWidth = 1.5;
  for (const b of bubbles) {
    const y = ((b.y - t * b.s) % 1 + 1) % 1;
    ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.arc(b.x * w + Math.sin(t + b.y * 9) * 6, y * h, b.r, 0, Math.PI * 2); ctx.stroke();
  }
  // สาหร่ายโยกไปมา
  ctx.strokeStyle = c.g3; ctx.lineWidth = 6; ctx.lineCap = 'round';
  for (let i = 0; i < 9; i++) {
    const x = w * (i + 0.5) / 9; ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.moveTo(x, h);
    ctx.quadraticCurveTo(x + Math.sin(t + i) * 25, h - 50, x + Math.sin(t * 1.3 + i) * 18, h - 90 - (i % 3) * 20); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// กำแพงปะการัง: ช่องเปิด (ขอบนอก) + แถบเขียว = ตำแหน่งที่ปลายนิ้วต้องอยู่
export function drawWall(ctx, canvas, wall, g, match) {
  const c = colors(), h = canvas.height, W = 70, x = wall.x;
  const outer = g.span(Math.min(1, wall.gapU + wall.tol)), inner = g.span(Math.max(0, wall.gapU - wall.tol));
  const top = g.cy - outer / 2, bot = g.cy + outer / 2;
  ctx.fillStyle = wall.done ? (wall.ok ? c.ok : c.err) : c.solid;
  ctx.globalAlpha = wall.done ? 0.5 : 1;
  ctx.beginPath(); ctx.roundRect(x, -20, W, top + 20, 18); ctx.fill();
  ctx.beginPath(); ctx.roundRect(x, bot, W, h - bot + 20, 18); ctx.fill();
  ctx.globalAlpha = 1;
  // ขอบเรืองแสงของช่อง
  ctx.strokeStyle = c.g1; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x + W, top); ctx.moveTo(x, bot); ctx.lineTo(x + W, bot); ctx.stroke();
  // แถบเขียว (ระหว่างเส้นประด้านในกับขอบกำแพง)
  if (!wall.done) {
    ctx.fillStyle = c.ok; ctx.globalAlpha = match ? 0.55 : 0.22;
    ctx.fillRect(x, top, W, (outer - inner) / 2); ctx.fillRect(x, g.cy + inner / 2, W, (outer - inner) / 2);
    ctx.globalAlpha = 1; ctx.setLineDash([8, 6]); ctx.strokeStyle = c.ok; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, g.cy - inner / 2); ctx.lineTo(x + W, g.cy - inner / 2); ctx.moveTo(x, g.cy + inner / 2); ctx.lineTo(x + W, g.cy + inner / 2); ctx.stroke();
    ctx.setLineDash([]);
  }
}

// ตัวละครมือ: ฝ่ามือกลม + 5 นิ้ว ปลายนิ้วกระจายตามความกาง u (0..1)
export function drawHandChar(ctx, g, u, flash, seen, t) {
  const c = colors(), span = g.span(u), pr = g.palmR; // ฝ่ามือขนาดคงที่ นิ้วกางออก
  ctx.globalAlpha = seen ? 1 : 0.4;
  ctx.lineCap = 'round';
  for (let k = 0; k < 5; k++) {
    const ty = g.cy - span / 2 + (span * k) / 4, tx = g.tipX - Math.abs(k - 2) * 12 + Math.sin(t * 3 + k) * 2;
    ctx.strokeStyle = flash > 0 ? c.err : c.f[k]; ctx.lineWidth = 14;
    ctx.beginPath(); ctx.moveTo(g.cx, g.cy + (k - 2) * pr * 0.35); ctx.lineTo(tx, ty); ctx.stroke();
    ctx.fillStyle = c.text; ctx.beginPath(); ctx.arc(tx, ty, 6, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = flash > 0 ? c.err : c.g1;
  ctx.beginPath(); ctx.arc(g.cx, g.cy, pr, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
  if (!seen) { ctx.fillStyle = c.text; ctx.font = `700 22px ${c.font}`; ctx.textAlign = 'center'; ctx.fillText('✋ ยกมือให้กล้องเห็น', g.cx + 60, g.cy - span / 2 - 30); }
}
