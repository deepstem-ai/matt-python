// ============================================================
// styles-test.js — หน้าทดสอบ Lab 17: สลับ 3 สไตล์ + ปรับอัตโนมัติ + วัด FPS ทุกสไตล์
// ============================================================
import { applyPrefs, loadPrefs, savePrefs, toast, modal, downloadCSV, cssVar, esc } from './ui.js';
import { drawHand, FINGER_NAMES, FINGER_TH } from './hand.js';
import { startHandApp } from './hand-app.js';
import { DemoHand } from './demo-hand.js';
import { StyleAdapter, STYLES, STYLE_TH } from './style-adapt.js';

applyPrefs();
const $ = (id) => document.getElementById(id);
const video = $('video'), canvas = $('canvas'), stage = $('stage');

// สไตล์ที่ผู้ใช้เลือก (จำไว้ใน prefs.handStyle) กับสไตล์ที่ใช้อยู่จริง (อาจถูกลดชั่วคราว)
let wanted = STYLES.includes(loadPrefs().handStyle) ? loadPrefs().handStyle : 'neon';
let current = wanted;
const adapter = new StyleAdapter({ low: 24, lowSec: 3, high: 45, highSec: 10 });
let asking = false, bench = null, lastHandT = 0, drawMs = 0;

// ---------- ปุ่มเลือกสไตล์ (เห็นครบทั้ง 3 ตัวเลือก) ----------
const NOTE = {
  simple: 'จุดและเส้นธรรมดา เบาเครื่องที่สุด ใช้ตอนวัดความแม่นยำ',
  neon: 'เส้นเรืองแสงด้วย shadowBlur + วงเรืองแสงรอบปลายนิ้ว',
  trail: 'เหมือนนีออน + หางแสงที่ปลายนิ้วค่อย ๆ จางหาย (หนักเครื่องที่สุด)',
};
$('styleSeg').innerHTML = STYLES.map((s) => `<label class="choice"><input type="radio" name="style" value="${s}"> ${STYLE_TH[s]}</label>`).join('');
$('styleSeg').addEventListener('change', (e) => {
  wanted = current = e.target.value;
  savePrefs({ handStyle: wanted });
  adapter.notifyChange(performance.now());
  showStyle();
});
function showStyle() {
  $('styleSeg').querySelector(`input[value="${current}"]`).checked = true;
  $('sStyle').textContent = STYLE_TH[current];
  $('sWanted').textContent = STYLE_TH[wanted];
  $('styleNote').textContent = NOTE[current];
}
showStyle();

// ---------- สไลเดอร์ ----------
const opt = () => ({ lineWidth: +$('line').value, glowLayers: +$('layers').value, glowBlur: +$('blur').value, trailLength: +$('trail').value });
[['line', 'vLine'], ['layers', 'vLayers'], ['blur', 'vBlur'], ['trail', 'vTrail']].forEach(([i, v]) => { $(i).oninput = () => { $(v).textContent = $(i).value; }; });

// ---------- สีนิ้ว: เปลี่ยนตัวแปร CSS --f-* (ไม่เขียนรหัสสีลงโค้ด) ----------
function buildColors() {
  $('colorRow').innerHTML = FINGER_NAMES.map((f) => `<label class="col" style="align-items:center">นิ้ว${FINGER_TH[f]}
    <input type="color" data-f="${f}" value="${cssVar('--f-' + f)}" style="width:56px;height:56px"></label>`).join('');
  $('colorRow').querySelectorAll('input').forEach((inp) => { inp.oninput = () => document.body.style.setProperty('--f-' + inp.dataset.f, inp.value); });
}
buildColors();
$('colorReset').onclick = () => { FINGER_NAMES.forEach((f) => document.body.style.removeProperty('--f-' + f)); buildColors(); };

// ---------- จำลองเครื่องช้า: สไตล์ยิ่งหนัก ยิ่งหน่วงนาน (ให้เห็นการลดระดับจริง) ----------
function fakeSlow() {
  if (!$('slowSim').checked) return;
  const ms = [0, 45, 60][STYLES.indexOf(current)];
  const end = performance.now() + ms;
  while (performance.now() < end) { /* ถ่วงเวลาเหมือนเครื่องอ่อน */ }
}

// ---------- ทุกเฟรม ----------
function onFrame(hand, now, info) {
  if (hand) lastHandT = now;
  fakeSlow();
  const t0 = performance.now();
  drawHand(canvas, hand, { style: current, ...opt() });
  drawMs = drawMs * 0.9 + (performance.now() - t0) * 0.1; // ค่าเฉลี่ยเคลื่อนที่
  $('nohand').classList.toggle('hidden', !!hand || !info.ready);
  $('sFps').textContent = info.fps; $('sAi').textContent = info.aiMs; $('sDel').textContent = info.delegate;
  $('sDraw').textContent = drawMs.toFixed(2);
  if (bench) { benchFrame(now, info); return; }
  if ($('auto').checked && !asking) adapt(info.fps, now);
}

// ---------- การปรับอัตโนมัติ (ต้องบอกผู้ใช้ทุกครั้ง ห้ามเปลี่ยนเงียบ ๆ) ----------
async function adapt(fps, now) {
  const act = adapter.update(fps, now, STYLES.indexOf(current), STYLES.indexOf(wanted));
  if (act === 'down') {
    const from = current;
    current = STYLES[STYLES.indexOf(current) - 1];
    showStyle();
    toast(`ขออนุญาตลดเอฟเฟกต์จาก "${STYLE_TH[from]}" เป็น "${STYLE_TH[current]}" ชั่วคราว เพราะเครื่องนี้แสดงผลได้ ${fps} FPS (ต่ำกว่า 24 นาน 3 วินาที) มือจะได้ขยับลื่นขึ้น`, 'warning', 7);
  } else if (act === 'up') {
    asking = true;
    const next = STYLES[STYLES.indexOf(current) + 1];
    const yes = await modal(`<h3>🚀 เครื่องกลับมาลื่นแล้ว</h3><p>ตอนนี้แสดงผลได้ ${fps} FPS ติดต่อกันเกิน 10 วินาที
      ต้องการกลับไปใช้สไตล์ "<b>${STYLE_TH[next]}</b>" ไหม?</p>`, [{ label: `ใช่ ใช้ ${STYLE_TH[next]}`, value: true }, { label: 'ใช้แบบนี้ต่อ', value: false, cls: 'ghost' }]);
    asking = false;
    if (yes) { current = next; showStyle(); toast(`กลับมาใช้สไตล์ "${STYLE_TH[next]}" แล้ว`, 'success'); adapter.notifyChange(performance.now()); }
    else adapter.graceUntil = performance.now() + 60000; // ไม่ถามซ้ำภายใน 1 นาที
  }
}

// ---------- วัด FPS ทุกสไตล์ สไตล์ละ 5 วินาที ----------
const BENCH_MS = 5000, WARM_MS = 700;
$('benchBtn').onclick = () => {
  const usedDemo = !app.isDemo() && performance.now() - lastHandT > 1000;
  if (usedDemo) { app.setDemo(true); demo.setOption('move', true); toast('ยังไม่เห็นมือจริง จึงใช้มือจำลองที่ขยับเองในการวัด', 'warning', 4); }
  bench = { i: 0, t0: performance.now(), frames: 0, draw: 0, minFps: 999, rows: [], restore: current, usedDemo };
  current = STYLES[0]; showStyle();
  $('benchBtn').disabled = true;
  $('benchOut').classList.remove('hidden'); $('benchOut').innerHTML = '<p>⏳ กำลังวัด… อย่าสลับหน้าต่าง</p>';
};
function benchFrame(now, info) {
  const b = bench, el = now - b.t0;
  if (el > WARM_MS) { b.frames++; b.draw += drawMs; if (info.fps) b.minFps = Math.min(b.minFps, info.fps); }
  $('benchBtn').textContent = `⏳ ${STYLE_TH[current]} ${Math.ceil((BENCH_MS - el) / 1000)} วิ`;
  if (el < BENCH_MS) return;
  const secs = (el - WARM_MS) / 1000;
  b.rows.push({ style: current, styleTh: STYLE_TH[current], fps: +(b.frames / secs).toFixed(1), minFps: b.minFps === 999 ? 0 : b.minFps, drawMs: +(b.draw / Math.max(1, b.frames)).toFixed(2), hand: b.usedDemo || app.isDemo() ? 'มือจำลอง' : 'มือจริง' });
  if (++b.i < STYLES.length) { current = STYLES[b.i]; showStyle(); Object.assign(b, { t0: now, frames: 0, draw: 0, minFps: 999 }); return; }
  finishBench();
}
function finishBench() {
  const b = bench; bench = null;
  current = b.restore; showStyle(); adapter.notifyChange(performance.now());
  if (b.usedDemo) { demo.setOption('move', false); app.setDemo(false); }
  console.table(b.rows); // ตารางนี้คัดลอกไปใส่รายงานได้ทันที
  $('benchBtn').disabled = false; $('benchBtn').textContent = '📊 วัด FPS ทั้ง 3 สไตล์ (15 วินาที)';
  $('benchOut').innerHTML = `<h3>📊 ผลวัดเครื่องนี้ (${esc(navigator.platform || '')})</h3>
    <table class="data"><thead><tr><th>สไตล์</th><th class="num">FPS เฉลี่ย</th><th class="num">FPS ต่ำสุด</th><th class="num">เวลาวาด ms/เฟรม</th><th>มือ</th></tr></thead>
    <tbody>${b.rows.map((r) => `<tr><td>${r.styleTh}</td><td class="num">${r.fps}</td><td class="num">${r.minFps}</td><td class="num">${r.drawMs}</td><td>${r.hand}</td></tr>`).join('')}</tbody></table>
    <p class="muted">FPS ถูกจำกัดที่ความถี่จอ (ปกติ 60) จึงควรดู "เวลาวาด" ประกอบ · ทำซ้ำบนเครื่องที่ 2 แล้วนำมาเทียบในรายงาน</p>
    <button class="btn-glow small" id="benchCsv">⬇️ ดาวน์โหลด CSV</button>`;
  $('benchCsv').onclick = () => downloadCSV('lab17-style-benchmark.csv', b.rows, ['style', 'fps', 'minFps', 'drawMs', 'hand']);
}

// ---------- เริ่มระบบ ----------
const demo = new DemoHand(stage, $('demoPanel'));
const app = startHandApp({ video, canvas, msgEl: $('msg'), onFrame, demo });
$('demoBtn').onclick = () => { app.setDemo(!app.isDemo()); $('demoBtn').textContent = app.isDemo() ? '📷 กลับไปใช้กล้อง' : '🖱️ โหมดสาธิต'; };
