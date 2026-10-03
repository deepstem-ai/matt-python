// ============================================================
// star-portal-draw.js — ภาพของเกมจับดาว: ฉากอวกาศ เนบิวลา ดาว ประตูมิติ
// สีทั้งหมดอ่านจาก tokens (--world-*) ผ่าน cssVar ไม่มีรหัสสีในไฟล์นี้
// ============================================================
import { cssVar } from '../ui.js';

// ภาพพื้นหลังวาดครั้งเดียวเก็บไว้ในแคนวาสลับ (ไม่ต้องวาดไล่สีใหม่ทุกเฟรม ประหยัดเครื่อง)
let bg = null, bgKey = '';
const dots = Array.from({ length: 120 }, () => ({ x: Math.random(), y: Math.random(), s: 0.5 + Math.random() * 1.8, p: Math.random() * 6 }));

function buildBackground(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, cssVar('--world-top')); g.addColorStop(1, cssVar('--world-bottom'));
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  // เนบิวลา: วงไล่สีโปร่งแสงหลายวงซ้อนกัน
  const blobs = [[0.2, 0.3, 0.45, '--world-glow-1'], [0.75, 0.25, 0.4, '--world-glow-2'], [0.6, 0.8, 0.5, '--world-glow-3'], [0.1, 0.85, 0.3, '--world-glow-2']];
  for (const [fx, fy, fr, name] of blobs) {
    const r = Math.max(w, h) * fr, n = ctx.createRadialGradient(fx * w, fy * h, 0, fx * w, fy * h, r);
    n.addColorStop(0, cssVar(name)); n.addColorStop(1, 'transparent');
    ctx.globalAlpha = 0.28; ctx.fillStyle = n; ctx.fillRect(0, 0, w, h);
  }
  ctx.globalAlpha = 1;
  return c;
}

export function drawSpace(ctx, canvas, t) {
  const { width: w, height: h } = canvas;
  const key = w + 'x' + h + document.body.className;       // เปลี่ยนขนาดหรือธีม → วาดใหม่
  if (key !== bgKey) { bg = buildBackground(w, h); bgKey = key; }
  ctx.drawImage(bg, 0, 0);
  ctx.fillStyle = cssVarCached('--world-star');
  for (const d of dots) {
    ctx.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(t * 1.3 + d.p)); // ดาวกะพริบ
    ctx.beginPath(); ctx.arc(d.x * w, d.y * h, d.s, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}
// อ่านสีดาวครั้งเดียวต่อธีม
let starCol = '', starKey = '';
function cssVarCached(name) { if (starKey !== document.body.className) { starCol = cssVar(name); starKey = document.body.className; } return starCol; }

// ดาวห้าแฉกเรืองแสง (ถูกจับอยู่ = ใหญ่ขึ้นเล็กน้อย)
export function drawStarShape(ctx, s, C, held) {
  const R = s.r * (held ? 1.2 : 1), r = R * 0.45;
  ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.spin * 0.6);
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 2.2);
  glow.addColorStop(0, C.star); glow.addColorStop(1, 'transparent');
  ctx.globalAlpha = 0.45; ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(0, 0, R * 2.2, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r : R;
    ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath(); ctx.fillStyle = C.star; ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = C.text; ctx.stroke();
  ctx.restore();
}

// ประตูมิติ: วงแหวนหมุนสองชั้น + แกนกลางเรืองแสง
export function drawPortal(ctx, p, C) {
  ctx.save(); ctx.translate(p.x, p.y);
  const core = ctx.createRadialGradient(0, 0, 0, 0, 0, p.r);
  core.addColorStop(0, C.g3); core.addColorStop(0.6, C.g1); core.addColorStop(1, 'transparent');
  ctx.globalAlpha = 0.55; ctx.fillStyle = core; ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
  ctx.lineWidth = 5;
  [[1, 1, C.g3], [0.72, -1.6, C.pink]].forEach(([k, sp, col]) => {
    ctx.strokeStyle = col; ctx.setLineDash([p.r * 0.5, p.r * 0.25]); ctx.lineDashOffset = p.spin * sp * 60;
    ctx.beginPath(); ctx.arc(0, 0, p.r * k, 0, Math.PI * 2); ctx.stroke();
  });
  ctx.setLineDash([]); ctx.restore();
}
