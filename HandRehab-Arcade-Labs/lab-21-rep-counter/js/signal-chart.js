// ============================================================
// signal-chart.js — กราฟสัญญาณคะแนนพร้อมเส้นเกณฑ์สองประตู (Lab 21)
// วาดบน canvas เอง: เส้นสัญญาณ, เส้น enter/exit, เขตกันสั่น, เกณฑ์เดียว, จุดที่นับได้
// พื้นหลังทึบ → กด "บันทึกเป็น PNG" แล้วใส่รายงานได้ทันที
// ============================================================
import { cssVar } from './ui.js';

// samples = [{t, s}], opts = { enter, exit, naive, reps:[{t}], naiveTimes:[t], t0, t1, title }
export function drawSignal(canvas, samples, opts) {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth || 800, h = canvas.clientHeight || 300;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const fs = 13, font = cssVar('--font');
  const pad = { l: 44, r: 12, t: 42, b: 30 };
  const t0 = opts.t0 ?? samples[0]?.t ?? 0, t1 = opts.t1 ?? samples[samples.length - 1]?.t ?? 1;
  const X = (t) => pad.l + ((t - t0) / (t1 - t0 || 1)) * (w - pad.l - pad.r);
  const Y = (s) => h - pad.b - s * (h - pad.t - pad.b);
  ctx.fillStyle = cssVar('--card'); ctx.fillRect(0, 0, w, h);
  // เขตกันสั่น (anti-flicker zone) ระหว่าง exit..enter
  ctx.fillStyle = cssVar('--input');
  ctx.fillRect(pad.l, Y(opts.enter), w - pad.l - pad.r, Y(opts.exit) - Y(opts.enter));
  // เส้นตาราง + ตัวเลขแกน
  ctx.font = `${fs}px ${font}`; ctx.fillStyle = cssVar('--text-2'); ctx.strokeStyle = cssVar('--line'); ctx.lineWidth = 1;
  ctx.textAlign = 'right';
  for (let v = 0; v <= 1.001; v += 0.25) { ctx.beginPath(); ctx.moveTo(pad.l, Y(v)); ctx.lineTo(w - pad.r, Y(v)); ctx.stroke(); ctx.fillText(v.toFixed(2), pad.l - 6, Y(v) + 4); }
  ctx.textAlign = 'center';
  const span = (t1 - t0) / 1000, step = span > 30 ? 5 : span > 8 ? 2 : 1;
  for (let s = Math.ceil(t0 / 1000 / step) * step; s <= t1 / 1000; s += step) ctx.fillText(s + ' วิ', X(s * 1000), h - 10);
  // เส้นเกณฑ์
  const hline = (v, color, dash, label) => {
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.setLineDash(dash);
    ctx.beginPath(); ctx.moveTo(pad.l, Y(v)); ctx.lineTo(w - pad.r, Y(v)); ctx.stroke(); ctx.setLineDash([]);
    labels.push([v, color, label]);
  };
  const labels = []; // ป้ายชื่อเส้น วาดทีหลังสุดบนพื้นทึบ ไม่ให้เส้นสัญญาณทับ
  if (opts.naive !== undefined) hline(opts.naive, cssVar('--error'), [2, 4], `เกณฑ์เดียว ${opts.naive}`);
  hline(opts.enter, cssVar('--success'), [8, 5], `ประตูเข้า enter ${opts.enter}`);
  hline(opts.exit, cssVar('--warning'), [8, 5], `ประตูออก exit ${opts.exit}`);
  // เส้นสัญญาณ
  ctx.strokeStyle = cssVar('--primary'); ctx.lineWidth = 2; ctx.beginPath();
  let started = false;
  for (const p of samples) {
    if (p.t < t0) continue;
    const x = X(p.t), y = Y(p.s);
    if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.textAlign = 'right';
  for (const [v, color, label] of labels) {
    const tw = ctx.measureText(label).width, x = w - pad.r - 4, y = Y(v) - 5;
    ctx.fillStyle = cssVar('--card'); ctx.fillRect(x - tw - 4, y - fs, tw + 8, fs + 4);
    ctx.fillStyle = color; ctx.fillText(label, x, y);
  }
  // ขีดสีแดงด้านล่าง = จุดที่ตัวนับเกณฑ์เดียวนับ, วงกลมเขียวด้านบน = จุดที่ตัวนับสองประตูนับ
  ctx.strokeStyle = cssVar('--error'); ctx.lineWidth = 2;
  for (const t of opts.naiveTimes || []) if (t >= t0) { ctx.beginPath(); ctx.moveTo(X(t), h - pad.b); ctx.lineTo(X(t), h - pad.b - 10); ctx.stroke(); }
  ctx.fillStyle = cssVar('--success');
  for (const r of opts.reps || []) if (r.t >= t0) { ctx.beginPath(); ctx.arc(X(r.t), pad.t - 8, 6, 0, Math.PI * 2); ctx.fill(); }
  // หัวกราฟ
  ctx.fillStyle = cssVar('--text'); ctx.textAlign = 'left'; ctx.font = `700 ${fs + 2}px ${font}`;
  ctx.fillText(opts.title || "", pad.l, 16);
}
