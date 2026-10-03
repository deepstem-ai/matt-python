// ============================================================
// filters-page.js — หน้าเปรียบเทียบ ดิบ vs One Euro vs ค่าเฉลี่ยเคลื่อนที่ (vs มัธยฐาน) (Lab 27)
// แหล่งสัญญาณ: สัญญาณมือสั่นจำลอง (ค่าเริ่มต้น ใช้ได้ไม่ต้องมีกล้อง) หรือปลายนิ้วชี้จริงจากกล้อง
// ============================================================
import { applyPrefs, cssVar, downloadCSV, saveCanvasPNG, toast, modal, esc } from './ui.js';
import { lineChart } from './charts.js';
import { jitterReduction, lagMs } from './smoothing.js';
import { makeShakySignal, makeFilters, benchmark, FILTER_TH } from './signal.js';
import { startCamera, stopCamera, cameraErrorMessage } from './camera.js';
import { initHand, detectHand, drawHand, fitCanvas } from './hand.js';

applyPrefs();
const $ = (id) => document.getElementById(id);
const KEYS = ['raw', 'oneEuro', 'movingAvg', 'median'];
const FPS = 30, KEEP_SEC = 10, SHOW_SEC = 6;
let source = 'synth', paused = false, tSim = 0, sig = null, filters = null;
let buf = { t: [], raw: [], oneEuro: [], movingAvg: [], median: [] };

const params = () => ({ minCutoff: +$('mc').value, beta: +$('beta').value, n: +$('n').value, freq: FPS });
function rebuild() {
  filters = makeFilters(params());
  sig = makeShakySignal({ seed: 7, tremorAmp: +$('amp').value, tremorHz: +$('hz').value });
  buf = { t: [], raw: [], oneEuro: [], movingAvg: [], median: [] };
}
// ป้ายตัวเลขข้างแถบเลื่อน
const bind = (id, dec, rebuildAll = true) => { const el = $(id); const paint = () => { $(id + 'V').textContent = (+el.value).toFixed(dec); }; el.oninput = () => { paint(); if (rebuildAll) rebuild(); }; paint(); };
bind('amp', 3); bind('hz', 1); bind('mc', 1); bind('beta', 2); bind('n', 0);
rebuild();

// ป้อนค่าหนึ่งค่า (ตำแหน่ง x, เวลาเป็นวินาที) เข้าทุกตัวกรอง
function push(x, t) {
  buf.t.push(t); buf.raw.push(x);
  for (const k of ['oneEuro', 'movingAvg', 'median']) buf[k].push(filters[k].filter(x, t));
  while (buf.t.length && buf.t[0] < t - KEEP_SEC) KEYS.concat('t').forEach((k) => buf[k].shift());
}

// ---------- แหล่งสัญญาณ 1: จำลอง (เวลาจำลองเดินทีละ 1/30 วินาที) ----------
setInterval(() => { if (source === 'synth' && !paused) { tSim += 1 / FPS; push(sig.at(tSim), tSim); } }, 1000 / FPS);

// ---------- แหล่งสัญญาณ 2: ปลายนิ้วชี้จากกล้อง ----------
const video = $('video'), hc = $('handCanvas');
let lastVt = -1;
function camLoop() {
  if (source !== 'cam') return;
  if (!paused && video.currentTime !== lastVt) {
    lastVt = video.currentTime;
    fitCanvas(hc, video);
    const h = detectHand(video, performance.now());
    drawHand(hc, h, { style: 'simple' });
    if (h) push(1 - h.points[8].x, performance.now() / 1000);   // กลับด้านเหมือนกระจก ให้ขวา = ขวา
  }
  requestAnimationFrame(camLoop);
}
async function useCamera() {
  try {
    toast('กำลังเปิดกล้องและโหลดโมเดลมือ…', 'success', 2);
    await startCamera(video); await initHand();
    source = 'cam'; rebuild(); setSourceUi(); camLoop();
  } catch (e) {
    stopCamera();
    const m = e.name ? cameraErrorMessage(e) : { title: 'โหลดโมเดลมือไม่สำเร็จ', detail: e.message };
    const again = await modal(`<div class="alert"><h2>⚠️ ${esc(m.title)}</h2><p>${esc(m.detail)}</p></div><p>ใช้สัญญาณจำลองแทนได้ ตัวเลขเปรียบเทียบยังใช้ได้</p>`,
      [{ label: '↻ ลองอีกครั้ง', value: true }, { label: '〰 ใช้สัญญาณจำลอง', value: false, cls: 'ghost' }]);
    if (again) return useCamera();
    useSynth();
  }
}
function useSynth() { stopCamera(); source = 'synth'; tSim = 0; rebuild(); setSourceUi(); }
function setSourceUi() {
  $('camBox').classList.toggle('hidden', source !== 'cam'); $('synthBox').classList.toggle('hidden', source !== 'synth');
  $('srcBadge').textContent = source === 'cam' ? '📷 ปลายนิ้วจริง' : '〰 สัญญาณจำลอง';
  $('synthBtn').className = 'btn-glow small' + (source === 'synth' ? '' : ' ghost');
  $('camBtn').className = 'btn-glow small' + (source === 'cam' ? '' : ' ghost');
}
$('synthBtn').onclick = useSynth;
$('camBtn').onclick = useCamera;
window.addEventListener('pagehide', stopCamera);
$('pauseBtn').onclick = () => { paused = !paused; $('pauseBtn').textContent = paused ? '▶ เดินกราฟต่อ' : '⏸ หยุดกราฟ'; };

// ---------- วาดกราฟ (15 ครั้ง/วินาที) ----------
const colorOf = () => ({ raw: cssVar('--text-2'), oneEuro: cssVar('--success'), movingAvg: cssVar('--warning'), median: cssVar('--pink') });
function draw() {
  const n = buf.t.length; if (!n) return;
  const tEnd = buf.t[n - 1], from = buf.t.findIndex((t) => t >= tEnd - SHOW_SEC), C = colorOf();
  const on = KEYS.filter((k) => document.querySelector(`[data-line="${k}"]`).checked);
  const series = on.map((k) => ({ name: FILTER_TH[k], color: C[k], points: buf[k].slice(from).map((v, i) => ({ label: (buf.t[from + i] - tEnd).toFixed(1), value: v })) }));
  const all = series.flatMap((s) => s.points.map((p) => p.value));
  const lo = Math.min(...all), hi = Math.max(...all), pad = Math.max(0.01, (hi - lo) * 0.1);
  lineChart($('chart'), { series }, { title: 'ตำแหน่งปลายนิ้วชี้ (แนวนอน) ก่อน/หลังกรอง', xLabel: 'เวลา (วินาที ก่อนตอนนี้)', yLabel: 'ตำแหน่ง x (0-1)', yMin: +(lo - pad).toFixed(3), yMax: +(hi + pad).toFixed(3), dots: false, lineWidth: 2.5 });
}
setInterval(() => { if (!paused) draw(); }, 66);

// ---------- ตารางตัวเลขสด ----------
function liveRows() {
  const dt = buf.t.length > 1 ? (buf.t.at(-1) - buf.t[0]) / (buf.t.length - 1) : 1 / FPS;
  return ['oneEuro', 'movingAvg', 'median'].map((k) => ({ name: FILTER_TH[k], jitterPct: jitterReduction(buf.raw, buf[k]), lagMs: lagMs(buf.raw, buf[k], dt) }));
}
setInterval(() => {
  if (buf.t.length < 60) { $('liveTable').innerHTML = '<tr><td class="muted">กำลังเก็บข้อมูล…</td></tr>'; return; }
  $('liveTable').innerHTML = '<tr><th>ตัวกรอง</th><th>ลดความสั่น (%)</th><th>ความหน่วง (ms)</th></tr>' +
    liveRows().map((r) => `<tr><td>${r.name}</td><td class="${r.jitterPct > 50 ? 'good' : ''}">${r.jitterPct.toFixed(1)}</td><td class="${r.lagMs > 150 ? 'bad' : ''}">${Math.round(r.lagMs)}</td></tr>`).join('');
}, 500);

// ---------- ตารางเปรียบเทียบแบบทำซ้ำได้ ----------
let bench = [];
function runBench() {
  bench = benchmark(params(), { seed: 7, tremorAmp: +$('amp').value, tremorHz: +$('hz').value });
  const p = params();
  $('benchTable').innerHTML = `<tr><th>ตัวกรอง</th><th>ลดความสั่น (%)</th><th>หน่วง cross-correlation (ms)</th><th>หน่วงขั้นบันได 90% (ms)</th></tr>` +
    bench.map((r) => `<tr><td>${r.name}</td><td>${r.jitterPct}</td><td>${r.lagMs}</td><td>${r.stepMs}</td></tr>`).join('') +
    `<tr><td colspan="4" class="muted">ค่าที่ใช้: minCutoff ${p.minCutoff} Hz · beta ${p.beta} · N ${p.n} · สั่น ${$('amp').value} @ ${$('hz').value} Hz</td></tr>`;
}
$('benchBtn').onclick = runBench;
runBench();
$('benchCsv').onclick = () => downloadCSV('filter-comparison.csv', bench.map((r) => ({ filter: r.name, jitter_reduction_pct: r.jitterPct, lag_ms_xcorr: r.lagMs, step_delay_90_ms: r.stepMs, ...params() })));

// ---------- ส่งออก ----------
$('csvBtn').onclick = () => {
  if (!buf.t.length) return toast('ยังไม่มีข้อมูล', 'warning');
  const t0 = buf.t[0];
  downloadCSV(`filters-${source}.csv`, buf.t.map((t, i) => ({ t_sec: +(t - t0).toFixed(3), raw: +buf.raw[i].toFixed(5), one_euro: +buf.oneEuro[i].toFixed(5), moving_avg: +buf.movingAvg[i].toFixed(5), median: +buf.median[i].toFixed(5) })));
};
$('pngBtn').onclick = () => saveCanvasPNG($('chart'), 'filters-chart.png');
window.__filters = { buf: () => buf, liveRows, bench: () => bench };
