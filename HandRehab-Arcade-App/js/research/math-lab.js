// ============================================================
// math-lab.js — หน้าคณิตศาสตร์ของมือ (Lab 18): ระยะดิบ vs ระยะหารขนาดฝ่ามือ
// หลักการ: แปลงจุดเป็น "พิกเซลจริง" (x·W, y·H, z·W) ก่อน แล้วให้ geometry.js คำนวณล้วน ๆ
// ============================================================
import { applyPrefs, cssVar } from '../ui.js';
import { drawHand, FINGER_NAMES, FINGER_TH } from '../hand.js';
import { dist, palmScale, normDist, fingerCurl, spread, handFacingCamera } from '../geometry.js';
import { lineChart } from '../charts.js';
import { startHandApp } from './hand-app.js';
import { DemoHand } from './demo-hand.js';

applyPrefs();
const $ = (id) => document.getElementById(id);
const video = $('video'), canvas = $('canvas'), stage = $('stage');

// คู่จุดที่ทดสอบ (0–12 ใส่ไว้ให้เห็นว่าทำไมไม่ใช้ปลายนิ้วกลางวัดขนาดฝ่ามือ: มันเปลี่ยนเมื่อกำ/แบมือ)
const PAIRS = [[4, 8, 'โป้ง–ชี้'], [8, 12, 'ชี้–กลาง'], [4, 20, 'โป้ง–ก้อย'], [0, 12, 'ข้อมือ–ปลายกลาง'], [8, 20, 'ชี้–ก้อย']];
const SPREADS = [['thumb', 'index'], ['index', 'middle'], ['middle', 'ring'], ['ring', 'little'], ['index', 'little']];

// ---------- สร้างแถวตาราง ----------
const mkRows = (body, extra) => {
  const rows = [...PAIRS.map(([a, b, n]) => `${a}–${b} <span class="muted">${n}</span>`), ...extra].map((label) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${label}</td><td class="num">—</td><td class="num">—</td><td class="num">—</td><td class="num">—</td>`;
    body.appendChild(tr);
    return [...tr.children].slice(1);
  });
  return rows;
};
const rawCells = mkRows($('rawBody'), ['0–9 <span class="muted">ขนาดฝ่ามือ S</span>']);
const normCells = mkRows($('normBody'), []);
$('curls').innerHTML = FINGER_NAMES.map((f) => `<div class="mini"><span>นิ้ว${FINGER_TH[f]}</span><div class="bar"><i id="c-${f}"></i></div><b class="num" id="cv-${f}">—</b></div>`).join('');
$('spreads').innerHTML = SPREADS.map(([a, b]) => `<div class="mini"><span>${FINGER_TH[a]}–${FINGER_TH[b]}</span><div class="bar"><i id="s-${a}${b}"></i></div><b class="num" id="sv-${a}${b}">—</b></div>`).join('');

// ---------- สถิติสะสม ----------
let stats, hist, n;
function reset() {
  stats = { raw: PAIRS.map(() => ({ min: Infinity, max: -Infinity })).concat([{ min: Infinity, max: -Infinity }]), norm: PAIRS.map(() => ({ min: Infinity, max: -Infinity })) };
  hist = []; n = 0;
  lineChart($('hist'), [], { emptyText: 'ยังไม่มีข้อมูล — ยกมือขึ้น หรือกดโหมดสาธิต' });
}
reset();
$('resetBtn').onclick = reset;
const upd = (s, v) => { s.min = Math.min(s.min, v); s.max = Math.max(s.max, v); s.now = v; };
const ratio = (s) => (s.min > 0 && Number.isFinite(s.max) ? s.max / s.min : NaN);
const fmt = (v, d = 1) => (Number.isFinite(v) ? v.toFixed(d) : '—');

let lastUi = 0, lastHist = 0;
function onFrame(hand, now, info) {
  drawHand(canvas, hand, { style: 'simple' }); // วัดค่าต้องใช้สไตล์เบาที่สุดเสมอ
  $('nohand').classList.toggle('hidden', !!hand || !info.ready);
  $('sFps').textContent = info.fps;
  if (!hand) return;
  // แปลงเป็นพิกเซล: x·W, y·H และ z·W (MediaPipe ให้ z สเกลเดียวกับ x)
  const W = canvas.width, H = canvas.height;
  const px = hand.points.map((p) => ({ x: p.x * W, y: p.y * H, z: (p.z || 0) * W }));
  let S;
  try { S = palmScale(px); } catch (e) { $('sPalm').textContent = e.message; return; }
  n++;
  PAIRS.forEach(([a, b], k) => { upd(stats.raw[k], dist(px[a], px[b])); upd(stats.norm[k], normDist(px, a, b)); });
  upd(stats.raw[PAIRS.length], S);
  if (now - lastHist > 100) { hist.push({ raw: stats.raw[0].now, norm: stats.norm[0].now }); if (hist.length > 100) hist.shift(); lastHist = now; }
  if (now - lastUi < 100) return; // อัปเดตหน้าจอ 10 ครั้ง/วินาที ให้อ่านทัน
  lastUi = now;
  $('sPalm').textContent = S.toFixed(0) + ' px';
  const face = handFacingCamera(px);
  $('sFace').textContent = `${face.facing ? 'หันเข้ากล้อง' : 'หันข้าง'} (${face.ratio.toFixed(2)})`;
  $('sN').textContent = n;
  const fill = (cells, arr, d) => arr.forEach((s, k) => {
    const r = ratio(s);
    cells[k][0].textContent = fmt(s.now, d); cells[k][1].textContent = fmt(s.min, d); cells[k][2].textContent = fmt(s.max, d);
    cells[k][3].textContent = fmt(r, 3) + '×';
    cells[k][3].className = 'num ' + (r <= 1.05 ? 'ok-text' : r <= 1.15 ? 'warn-text' : 'bad-text');
  });
  fill(rawCells, stats.raw, 1); fill(normCells, stats.norm, 3);
  const avgR = (arr) => arr.reduce((s, x) => s + ratio(x), 0) / arr.length;
  const rr = avgR(stats.raw.slice(0, PAIRS.length)), nr = avgR(stats.norm);
  $('rawRatio').textContent = fmt(rr, 3) + '×';
  $('normRatio').textContent = fmt(nr, 3) + '×';
  $('verdict').innerHTML = nr <= 1.05 ? '<b class="ok-text">✅ เปลี่ยนไม่เกิน 5%</b>' : '<b class="warn-text">ยังเกิน 5% — ค้างท่าให้นิ่ง หรือกดรีเซ็ต</b>';
  FINGER_NAMES.forEach((f) => { const c = fingerCurl(px, f); $('c-' + f).style.width = c * 100 + '%'; $('cv-' + f).textContent = c.toFixed(2); });
  SPREADS.forEach(([a, b]) => { const d = spread(px, a, b); $(`s-${a}${b}`).style.width = Math.min(100, (d / 90) * 100) + '%'; $(`sv-${a}${b}`).textContent = d.toFixed(0) + '°'; });
  drawHist();
}

// ---------- กราฟประวัติ: ทั้งสองค่าหารด้วยค่าแรก จะได้เทียบบนแกนเดียวกัน ----------
function drawHist() {
  if (hist.length < 2) return;
  const r0 = hist[0].raw, n0 = hist[0].norm;
  lineChart($('hist'), {
    series: [
      { name: 'ดิบ', color: cssVar('--warning'), points: hist.map((h, i) => ({ label: i % 10 === 0 ? `${i / 10}s` : '', value: h.raw / r0 })) },
      { name: 'หารฝ่ามือ', color: cssVar('--success'), points: hist.map((h) => ({ label: '', value: h.norm / n0 })) },
    ],
  }, { title: ' ', dots: false, yMin: 0, yMax: 2, yLabel: 'เท่าของค่าแรก', lines: [{ value: 1.05, label: '+5%', color: cssVar('--text-2') }, { value: 0.95, label: '−5%', color: cssVar('--text-2') }] });
}

// ---------- เริ่มระบบ ----------
const demo = new DemoHand(stage, $('demoPanel'));
const app = startHandApp({ video, canvas, msgEl: $('msg'), onFrame, demo });
$('demoBtn').onclick = () => {
  app.setDemo(!app.isDemo());
  // ในโหมดสาธิต เปิด "เคลื่อนเข้า-ออกเอง" ให้เห็นผลทันที
  demo.setOption('zoom', app.isDemo());
  reset();
  $('demoBtn').textContent = app.isDemo() ? '📷 กลับไปใช้กล้อง' : '🖱️ โหมดสาธิต';
};
if (app.isDemo()) demo.setOption('zoom', true);
