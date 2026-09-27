// ============================================================
// charts.js — วาดกราฟบน canvas เปล่า ไม่ใช้ไลบรารีภายนอก (Lab 29)
//   lineChart(canvas, data, options)
//   barChart(canvas, data, options)
//   heatmapCalendar(canvas, data, options)
// ข้อความทุกตัวใหญ่พอสำหรับโหมดผู้สูงอายุ (อิงจาก --fs-base)
// ============================================================

function css(name, fallback) {
  return getComputedStyle(document.body).getPropertyValue(name).trim() || fallback;
}
function baseFont() {
  return parseFloat(css('--fs-base', '16')) || 16;
}
// เตรียม canvas ให้คมชัดตามขนาดที่แสดงจริง คืน ctx และขนาด
function prep(canvas, opts) {
  const dpr = window.devicePixelRatio || 1;
  const w = opts.width || canvas.clientWidth || canvas.width || 600;
  const h = opts.height || canvas.clientHeight || canvas.height || 320;
  canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  // พื้นหลังทึบ เพื่อให้บันทึกเป็นรูปแล้วอ่านออก
  ctx.fillStyle = opts.background || css('--card', '#151B33');
  ctx.fillRect(0, 0, w, h);
  return { ctx, w, h };
}
function niceMax(v) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}
function drawTitle(ctx, w, opts, fs) {
  if (opts.title) {
    ctx.fillStyle = css('--text', '#F8FAFC'); ctx.font = `700 ${fs * 1.1}px ${css('--font', 'sans-serif')}`;
    ctx.textAlign = 'left'; ctx.fillText(opts.title, 12, fs * 1.4);
  }
}
// วาดข้อความ "ยังไม่มีข้อมูล" แทนกราฟว่าง
function drawEmpty(ctx, w, h, text, fs) {
  ctx.fillStyle = css('--text-2', '#94A3B8'); ctx.font = `${fs}px ${css('--font', 'sans-serif')}`;
  ctx.textAlign = 'center'; ctx.fillText(text || 'ยังไม่มีข้อมูล มาเริ่มฝึกกันเลย!', w / 2, h / 2);
}

// ------------------------------------------------------------
// กราฟเส้น  data = [{ label: 'x', value: number }] หรือ { series: [{name, color, points:[{label,value}]}] }
// options: title, xLabel, yLabel (ใส่หน่วย), yMin, yMax, color, lines: [{value, color, label}]
// คืนอ็อบเจกต์ที่มี hitTest(x,y) สำหรับแตะจุดเพื่อดูค่า
// ------------------------------------------------------------
export function lineChart(canvas, data, opts = {}) {
  const { ctx, w, h } = prep(canvas, opts);
  const fs = opts.fontSize || Math.max(13, baseFont() * 0.85);
  const series = Array.isArray(data) ? [{ name: opts.yLabel || '', color: opts.color || css('--primary', '#22D3EE'), points: data }] : data.series;
  const n = Math.max(0, ...series.map((s) => s.points.length));
  drawTitle(ctx, w, opts, fs);
  if (!n) { drawEmpty(ctx, w, h, opts.emptyText, fs); return { hitTest: () => null }; }
  const pad = { l: fs * 3.6, r: 16, t: opts.title ? fs * 2.6 : 16, b: fs * 3.4 };
  const vals = series.flatMap((s) => s.points.map((p) => p.value)).filter((v) => Number.isFinite(v));
  const yMin = opts.yMin ?? Math.min(0, ...vals);
  const yMax = opts.yMax ?? niceMax(Math.max(...vals, ...(opts.lines || []).map((l) => l.value)));
  const X = (i) => pad.l + (n === 1 ? (w - pad.l - pad.r) / 2 : (i * (w - pad.l - pad.r)) / (n - 1));
  const Y = (v) => h - pad.b - ((v - yMin) / (yMax - yMin || 1)) * (h - pad.t - pad.b);
  const font = css('--font', 'sans-serif');
  // เส้นตาราง + ตัวเลขแกน y
  ctx.strokeStyle = css('--line', '#334155'); ctx.lineWidth = 1;
  ctx.fillStyle = css('--text-2', '#94A3B8'); ctx.font = `${fs * 0.85}px ${font}`; ctx.textAlign = 'right';
  for (let k = 0; k <= 4; k++) {
    const v = yMin + ((yMax - yMin) * k) / 4, y = Y(v);
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke();
    ctx.fillText(+v.toFixed(2) + '', pad.l - 6, y + fs * 0.3);
  }
  // ป้ายแกน x (เว้นระยะไม่ให้ทับกัน)
  ctx.textAlign = 'center';
  const labels = series[0].points.map((p) => p.label);
  const every = Math.max(1, Math.ceil(n / Math.max(1, (w - pad.l) / (fs * 5))));
  labels.forEach((l, i) => { if (i % every === 0) ctx.fillText(String(l ?? ''), X(i), h - pad.b + fs * 1.2); });
  // ชื่อแกน
  ctx.fillStyle = css('--text', '#F8FAFC');
  if (opts.xLabel) ctx.fillText(opts.xLabel, (pad.l + w - pad.r) / 2, h - fs * 0.5);
  if (opts.yLabel) { ctx.save(); ctx.translate(fs * 0.9, (pad.t + h - pad.b) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(opts.yLabel, 0, 0); ctx.restore(); }
  // เส้นอ้างอิง (เช่น เกณฑ์ enter/exit)
  (opts.lines || []).forEach((l) => {
    ctx.strokeStyle = l.color || css('--warning', '#FBBF24'); ctx.setLineDash([6, 6]); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(pad.l, Y(l.value)); ctx.lineTo(w - pad.r, Y(l.value)); ctx.stroke(); ctx.setLineDash([]);
    if (l.label) { ctx.fillStyle = l.color || css('--warning', '#FBBF24'); ctx.textAlign = 'right'; ctx.fillText(l.label, w - pad.r - 4, Y(l.value) - 4); }
  });
  // เส้นข้อมูล
  const hits = [];
  series.forEach((s) => {
    ctx.strokeStyle = s.color; ctx.lineWidth = opts.lineWidth || 3; ctx.beginPath();
    let started = false;
    s.points.forEach((p, i) => {
      if (!Number.isFinite(p.value)) return;
      const x = X(i), y = Y(p.value);
      if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
    });
    ctx.stroke();
    if (opts.dots !== false && s.points.length <= 120) {
      s.points.forEach((p, i) => {
        if (!Number.isFinite(p.value)) return;
        ctx.fillStyle = s.color; ctx.beginPath(); ctx.arc(X(i), Y(p.value), 4.5, 0, Math.PI * 2); ctx.fill();
        hits.push({ x: X(i), y: Y(p.value), label: p.label, value: p.value, series: s.name });
      });
    }
  });
  // คำอธิบายเส้น (legend) เมื่อมีหลายชุด
  if (series.length > 1) {
    let lx = pad.l; ctx.textAlign = 'left'; ctx.font = `${fs * 0.85}px ${font}`;
    series.forEach((s) => { ctx.fillStyle = s.color; ctx.fillRect(lx, pad.t - fs, 14, 6); ctx.fillStyle = css('--text', '#F8FAFC'); ctx.fillText(s.name, lx + 18, pad.t - fs * 0.6); lx += ctx.measureText(s.name).width + 40; });
  }
  return {
    // คืนจุดที่ใกล้ตำแหน่ง (x,y) ที่แตะที่สุด (หน่วย CSS pixel)
    hitTest(x, y) {
      let best = null, bd = 24 * 24;
      for (const p of hits) { const d = (p.x - x) ** 2 + (p.y - y) ** 2; if (d < bd) { bd = d; best = p; } }
      return best;
    },
  };
}

// ------------------------------------------------------------
// กราฟแท่ง  data = [{ label, value, color?, error? }]  (error = ส่วนเบี่ยงเบนมาตรฐาน วาดเป็นขีด)
// ------------------------------------------------------------
export function barChart(canvas, data, opts = {}) {
  const { ctx, w, h } = prep(canvas, opts);
  const fs = opts.fontSize || Math.max(13, baseFont() * 0.85);
  const font = css('--font', 'sans-serif');
  drawTitle(ctx, w, opts, fs);
  if (!data?.length) { drawEmpty(ctx, w, h, opts.emptyText, fs); return; }
  const pad = { l: fs * 3.6, r: 16, t: opts.title ? fs * 2.6 : 16, b: fs * 3.4 };
  const yMax = opts.yMax ?? niceMax(Math.max(...data.map((d) => d.value + (d.error || 0))));
  const Y = (v) => h - pad.b - (v / (yMax || 1)) * (h - pad.t - pad.b);
  ctx.strokeStyle = css('--line', '#334155'); ctx.fillStyle = css('--text-2', '#94A3B8'); ctx.font = `${fs * 0.85}px ${font}`; ctx.textAlign = 'right';
  for (let k = 0; k <= 4; k++) {
    const v = (yMax * k) / 4; ctx.beginPath(); ctx.moveTo(pad.l, Y(v)); ctx.lineTo(w - pad.r, Y(v)); ctx.stroke();
    ctx.fillText(+v.toFixed(2) + '', pad.l - 6, Y(v) + fs * 0.3);
  }
  const slot = (w - pad.l - pad.r) / data.length, bw = Math.min(90, slot * 0.6);
  const palette = [css('--primary', '#22D3EE'), css('--secondary', '#A78BFA'), css('--success', '#A3E635'), css('--warning', '#FBBF24'), css('--pink', '#F472B6'), css('--sky', '#7DD3FC')];
  data.forEach((d, i) => {
    const x = pad.l + slot * i + (slot - bw) / 2;
    ctx.fillStyle = d.color || palette[i % palette.length];
    ctx.fillRect(x, Y(d.value), bw, h - pad.b - Y(d.value));
    if (d.error) { // ขีดส่วนเบี่ยงเบนมาตรฐาน
      ctx.strokeStyle = css('--text', '#F8FAFC'); ctx.lineWidth = 2; const cx = x + bw / 2;
      ctx.beginPath(); ctx.moveTo(cx, Y(Math.max(0, d.value - d.error))); // ไม่ให้ขีดล้นใต้แกน 0 ctx.lineTo(cx, Y(d.value + d.error));
      ctx.moveTo(cx - 8, Y(d.value + d.error)); ctx.lineTo(cx + 8, Y(d.value + d.error)); ctx.stroke(); ctx.lineWidth = 1; ctx.strokeStyle = css('--line', '#334155');
    }
    ctx.fillStyle = css('--text', '#F8FAFC'); ctx.textAlign = 'center';
    ctx.fillText((opts.format ? opts.format(d.value) : +d.value.toFixed(1)) + '', x + bw / 2, Y(d.value) - 6);
    ctx.fillStyle = css('--text-2', '#94A3B8'); ctx.fillText(String(d.label), x + bw / 2, h - pad.b + fs * 1.2);
  });
  ctx.fillStyle = css('--text', '#F8FAFC'); ctx.textAlign = 'center';
  if (opts.xLabel) ctx.fillText(opts.xLabel, (pad.l + w - pad.r) / 2, h - fs * 0.5);
  if (opts.yLabel) { ctx.save(); ctx.translate(fs * 0.9, (pad.t + h - pad.b) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(opts.yLabel, 0, 0); ctx.restore(); }
}

// ------------------------------------------------------------
// ปฏิทินความสม่ำเสมอ  data = { 'YYYY-MM-DD': จำนวนครั้งที่ฝึก }  opts.weeks = กี่สัปดาห์ย้อนหลัง
// ช่องยิ่งเข้มยิ่งฝึกมาก
// ------------------------------------------------------------
export function heatmapCalendar(canvas, data = {}, opts = {}) {
  const weeks = opts.weeks || 12;
  const { ctx, w, h } = prep(canvas, opts);
  const fs = opts.fontSize || Math.max(13, baseFont() * 0.85);
  const font = css('--font', 'sans-serif');
  drawTitle(ctx, w, opts, fs);
  const top = opts.title ? fs * 2.4 : 10, left = fs * 2.6;
  const cell = Math.min((w - left - 10) / weeks, (h - top - fs * 2) / 7) - 3;
  const today = opts.today ? new Date(opts.today) : new Date();
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const start = new Date(end); start.setDate(end.getDate() - end.getDay() - (weeks - 1) * 7); // เริ่มวันอาทิตย์
  const max = Math.max(1, ...Object.values(data));
  const base = css('--success', '#A3E635'), empty = css('--input', '#1E2745');
  const days = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
  ctx.font = `${fs * 0.75}px ${font}`; ctx.fillStyle = css('--text-2', '#94A3B8'); ctx.textAlign = 'right';
  days.forEach((d, i) => { if (i % 2) ctx.fillText(d, left - 6, top + i * (cell + 3) + cell * 0.7); });
  const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  for (let wk = 0; wk < weeks; wk++) {
    for (let dy = 0; dy < 7; dy++) {
      const d = new Date(start); d.setDate(start.getDate() + wk * 7 + dy);
      if (d > end) continue;
      const v = data[key(d)] || 0;
      ctx.fillStyle = empty; ctx.globalAlpha = 1;
      const x = left + wk * (cell + 3), y = top + dy * (cell + 3);
      ctx.fillRect(x, y, cell, cell);
      if (v) { ctx.fillStyle = base; ctx.globalAlpha = 0.25 + 0.75 * (v / max); ctx.fillRect(x, y, cell, cell); ctx.globalAlpha = 1; }
    }
  }
  ctx.fillStyle = css('--text-2', '#94A3B8'); ctx.textAlign = 'left';
  ctx.fillText(opts.caption || `ย้อนหลัง ${weeks} สัปดาห์ · ช่องเข้ม = ฝึกหลายครั้ง`, left, h - fs * 0.4);
}

// ---------- สถิติพื้นฐาน ----------
export function mean(a) { return a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0; }
export function sd(a) { if (a.length < 2) return 0; const m = mean(a); return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1)); }
export function dayKey(t) { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
