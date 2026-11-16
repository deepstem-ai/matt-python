// ============================================================
// hand-lab.js — ห้องทดลองมือ (Lab 16 + 17 รวมกัน)
//   Lab 16: วิดีโอ + โครงมือ + ตาราง 21 จุด + สถิติ + บันทึกค่าอ้างอิง 10 วินาที
//   Lab 17: สลับ 3 สไตล์ + ปรับลด/เพิ่มอัตโนมัติ + วัด FPS ทุกสไตล์ (benchmark)
// ============================================================
import { applyPrefs, loadPrefs, savePrefs, toast, modal, downloadCSV, cssVar, esc } from '../ui.js';
import { drawHand, LANDMARK_TH, TIPS, FINGER_NAMES, FINGERS, FINGER_TH, fingerColors } from '../hand.js';
import { startHandApp } from './hand-app.js';
import { DemoHand } from './demo-hand.js';
import { StyleAdapter, STYLES, STYLE_TH } from './style-adapt.js';

applyPrefs();
const $ = (id) => document.getElementById(id);
const video = $('video'), canvas = $('canvas'), stage = $('stage');

// ================= ตาราง 21 จุด (Lab 16) =================
// สร้าง 21 แถวครั้งเดียว แล้วอัปเดตเฉพาะตัวเลข
const tbody = $('tbl').querySelector('tbody');
const cells = LANDMARK_TH.map((name, i) => {
  const tr = document.createElement('tr');
  if (TIPS.includes(i)) tr.className = 'tip';
  tr.innerHTML = `<td class="num">${i}</td><td>${name}</td><td class="num">—</td><td class="num">—</td><td class="num">—</td>`;
  tbody.appendChild(tr);
  return [...tr.children].slice(2);
});
// แถบสีนิ้วหน้าชื่อจุด ให้ตรงกับสีโครงมือ
function paintTableColors() {
  const colors = fingerColors();
  LANDMARK_TH.forEach((_, i) => {
    const f = FINGER_NAMES.find((n) => FINGERS[n].includes(i));
    tbody.children[i].children[1].style.borderLeft = `6px solid ${f ? colors[f] : colors.palm}`;
  });
}
paintTableColors();
// MediaPipe ตั้งชื่อมือโดยถือว่าภาพ "กลับด้านแล้ว" แต่เราส่งภาพดิบจากกล้องหน้า → ชื่อจึงสลับ
const handTh = (h) => (h === 'Left' ? 'ขวา' : h === 'Right' ? 'ซ้าย' : h === 'Demo' ? 'จำลอง' : '—');

// ================= สไตล์การวาด (Lab 17) =================
// สไตล์ที่ผู้ใช้เลือก (จำไว้ใน prefs.handStyle) กับสไตล์ที่ใช้อยู่จริง (อาจถูกลดชั่วคราว)
let wanted = STYLES.includes(loadPrefs().handStyle) ? loadPrefs().handStyle : 'neon';
let current = wanted;
const adapter = new StyleAdapter({ low: 24, lowSec: 3, high: 45, highSec: 10 });
let asking = false, bench = null, lastHandT = 0, drawMs = 0;
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
const opt = () => ({ lineWidth: +$('line').value, glowLayers: +$('layers').value, glowBlur: +$('blur').value, trailLength: +$('trail').value });
[['line', 'vLine'], ['layers', 'vLayers'], ['blur', 'vBlur'], ['trail', 'vTrail']].forEach(([i, v]) => { $(i).oninput = () => { $(v).textContent = $(i).value; }; });

// สีนิ้ว: เปลี่ยนตัวแปร CSS --f-* (ไม่เขียนรหัสสีลงโค้ด)
function buildColors() {
  $('colorRow').innerHTML = FINGER_NAMES.map((f) => `<label class="col" style="align-items:center">นิ้ว${FINGER_TH[f]}
    <input type="color" data-f="${f}" value="${cssVar('--f-' + f)}" style="width:56px;height:56px"></label>`).join('');
  $('colorRow').querySelectorAll('input').forEach((inp) => { inp.oninput = () => { document.body.style.setProperty('--f-' + inp.dataset.f, inp.value); paintTableColors(); }; });
}
buildColors();
$('colorReset').onclick = () => { FINGER_NAMES.forEach((f) => document.body.style.removeProperty('--f-' + f)); buildColors(); paintTableColors(); };

// จำลองเครื่องช้า: สไตล์ยิ่งหนัก ยิ่งหน่วงนาน (ให้เห็นการลดระดับจริง)
function fakeSlow() {
  if (!$('slowSim').checked) return;
  const ms = [0, 45, 60][STYLES.indexOf(current)];
  const end = performance.now() + ms;
  while (performance.now() < end) { /* ถ่วงเวลาเหมือนเครื่องอ่อน */ }
}

// ================= ทุกเฟรม =================
let lastHand = null, ref = null, lastUi = 0;
function onFrame(hand, now, info) {
  lastHand = hand;
  if (hand) lastHandT = now;
  fakeSlow();
  const t0 = performance.now();
  if ($('showSkel').checked) {
    drawHand(canvas, hand, { style: current, ...opt() });
    // มือที่สอง (ถ้าเปิด ?hands=2) วาดทับด้วยสีเดียว เพื่อแยกให้เห็นว่าเป็นอีกมือ
    if (hand?.hands?.[1]) {
      const c = fingerColors();
      drawHand(canvas, hand.hands[1], { style: 'simple', clear: false, colors: Object.fromEntries(Object.keys(c).map((k) => [k, c.palm])) });
    }
  } else canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  drawMs = drawMs * 0.9 + (performance.now() - t0) * 0.1; // ค่าเฉลี่ยเคลื่อนที่
  $('nohand').classList.toggle('hidden', !!hand || !info.ready);
  if (ref) recordRef(now, info, hand);
  if (bench) benchFrame(now, info);
  else if ($('auto').checked && !asking) adapt(info.fps, now);
  if (now - lastUi < 66) return; // ตัวเลข 15 ครั้ง/วินาที อ่านทัน ไม่กินเครื่อง
  lastUi = now;
  $('sFps').textContent = info.fps; $('sAi').textContent = info.aiMs; $('sDraw').textContent = drawMs.toFixed(2);
  $('sFound').textContent = info.demo ? '—' : info.foundPct + '%';
  $('sDel').textContent = info.delegate;
  $('sHand').textContent = hand ? `${handTh(hand.handedness)} ${(hand.score * 100).toFixed(0)}%` : '—';
  cells.forEach((c, i) => {
    const p = hand?.points[i];
    c[0].textContent = p ? p.x.toFixed(3) : '—'; c[1].textContent = p ? p.y.toFixed(3) : '—'; c[2].textContent = p ? p.z.toFixed(3) : '—';
  });
}

// ---------- Lab 16: บันทึกค่าอ้างอิง 10 วินาที (FPS + เวลา AI + % เจอมือ) ----------
function recordRef(now, info, hand) {
  ref.frames++; if (hand) ref.found++;
  ref.ai.push(info.aiMs);
  if (now - ref.lastSec >= 1000) { ref.rows.push({ second: ref.rows.length + 1, fps: info.fps, aiMs: info.aiMs }); ref.lastSec = now; }
  if (now - ref.t0 < 10000) return;
  const avg = (a) => a.reduce((s, v) => s + v, 0) / (a.length || 1);
  const sum = { avgFps: +avg(ref.rows.map((r) => r.fps)).toFixed(1), avgAiMs: +avg(ref.ai).toFixed(1), foundPct: Math.round((100 * ref.found) / ref.frames), delegate: info.delegate };
  console.table(ref.rows); console.table([sum]);
  const rows = ref.rows;
  $('refOut').innerHTML = `<h3>📌 ค่าอ้างอิงของเครื่องนี้</h3>
    <div class="kv"><div>FPS เฉลี่ย<b>${sum.avgFps}</b></div><div>AI ms/เฟรม<b>${sum.avgAiMs}</b></div>
    <div>% เฟรมที่เจอมือ<b>${sum.foundPct}%</b></div><div>หน่วยประมวลผล<b>${esc(sum.delegate)}</b></div></div>
    <p class="${sum.avgFps > 15 ? 'ok-text' : 'bad-text'}">${sum.avgFps > 15 ? '✅ ผ่านเกณฑ์ FPS > 15' : '⚠️ FPS ต่ำกว่า 15 ลองปิดโปรแกรมอื่น หรือลดความละเอียดกล้อง'}</p>
    <button class="btn-glow small" id="refCsv">⬇️ ดาวน์โหลด CSV</button>`;
  $('refCsv').onclick = () => downloadCSV('lab16-reference.csv', [...rows, { second: 'avg', fps: sum.avgFps, aiMs: sum.avgAiMs }], ['second', 'fps', 'aiMs']);
  $('refBtn').disabled = false; $('refBtn').textContent = '⏱️ บันทึกค่าอ้างอิง 10 วินาที';
  ref = null;
}
$('refBtn').onclick = () => {
  const t = performance.now();
  ref = { t0: t, lastSec: t, frames: 0, found: 0, ai: [], rows: [] };
  $('refBtn').disabled = true; $('refBtn').textContent = '⏳ กำลังวัด 10 วินาที…';
  $('refOut').classList.remove('hidden'); $('refOut').innerHTML = '<p>กำลังวัด… ยกมือค้างไว้ในกรอบ</p>';
};

// ---------- Lab 17: การปรับอัตโนมัติ (ต้องบอกผู้ใช้ทุกครั้ง ห้ามเปลี่ยนเงียบ ๆ) ----------
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

// ---------- Lab 17: วัด FPS ทุกสไตล์ สไตล์ละ 5 วินาที ----------
const BENCH_MS = 5000, WARM_MS = 700;
$('benchBtn').onclick = () => {
  const usedDemo = !app.isDemo() && performance.now() - lastHandT > 1000;
  if (usedDemo) { app.setDemo(true); demo.setOption('move', true); toast('ยังไม่เห็นมือจริง จึงใช้มือจำลองที่ขยับเองในการวัด', 'warning', 4); }
  if (!$('showSkel').checked) { $('showSkel').checked = true; }
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
  if (b.usedDemo) { demo.setOption('move', false); app.setDemo(false); syncDemoBtn(); }
  console.table(b.rows); // ตารางนี้คัดลอกไปใส่รายงานได้ทันที
  $('benchBtn').disabled = false; $('benchBtn').textContent = '📊 วัด FPS ทั้ง 3 สไตล์ (15 วินาที)';
  $('benchOut').innerHTML = `<h3>📊 ผลวัดเครื่องนี้ (${esc(navigator.platform || '')})</h3>
    <table class="data"><thead><tr><th>สไตล์</th><th class="num">FPS เฉลี่ย</th><th class="num">FPS ต่ำสุด</th><th class="num">เวลาวาด ms/เฟรม</th><th>มือ</th></tr></thead>
    <tbody>${b.rows.map((r) => `<tr><td>${r.styleTh}</td><td class="num">${r.fps}</td><td class="num">${r.minFps}</td><td class="num">${r.drawMs}</td><td>${r.hand}</td></tr>`).join('')}</tbody></table>
    <p class="muted">FPS ถูกจำกัดที่ความถี่จอ (ปกติ 60) จึงควรดู "เวลาวาด" ประกอบ · ทำซ้ำบนเครื่องที่ 2 แล้วนำมาเทียบในรายงาน</p>
    <button class="btn-glow small" id="benchCsv">⬇️ ดาวน์โหลด CSV</button>`;
  $('benchCsv').onclick = () => downloadCSV('lab17-style-benchmark.csv', b.rows, ['style', 'fps', 'minFps', 'drawMs', 'hand']);
}

// ---------- Lab 16: ชี้เมาส์ที่จุดเพื่อดูชื่อ ----------
stage.addEventListener('pointermove', (e) => {
  const tip = $('tip');
  if (!lastHand || !canvas.width) { tip.classList.add('hidden'); return; }
  const r = stage.getBoundingClientRect();
  // วิดีโอแสดงแบบ object-fit: cover → คำนวณสเกลและส่วนที่ถูกครอป
  const s = Math.max(r.width / canvas.width, r.height / canvas.height);
  const ox = (r.width - canvas.width * s) / 2, oy = (r.height - canvas.height * s) / 2;
  let best = -1, bd = 28;
  lastHand.points.forEach((p, i) => {
    let x = ox + p.x * canvas.width * s; const y = oy + p.y * canvas.height * s;
    if (stage.classList.contains('mirror')) x = r.width - x;
    const d = Math.hypot(x - (e.clientX - r.left), y - (e.clientY - r.top));
    if (d < bd) { bd = d; best = i; }
  });
  if (best < 0) { tip.classList.add('hidden'); return; }
  tip.textContent = `${best} · ${LANDMARK_TH[best]}`;
  tip.style.left = e.clientX - r.left + 'px'; tip.style.top = e.clientY - r.top + 'px';
  tip.classList.remove('hidden');
});

// ---------- เริ่มระบบ ----------
// numHands = 1: ท่าบริหารทำทีละข้าง และเร็วกว่า 2 มือเกือบเท่าตัว (ลอง ?hands=2 เพื่อเทียบ FPS)
// minDetection = minTracking = 0.5: ค่าตั้งต้นตามคำใบ้ ถ้ามือหลุดบ่อยให้ลด minTracking เป็น 0.3–0.4
const demo = new DemoHand(stage, $('demoPanel'));
const app = startHandApp({ video, canvas, msgEl: $('msg'), onFrame, demo, numHands: 1, minDetection: 0.5, minTracking: 0.5 });
const syncDemoBtn = () => { $('demoBtn').textContent = app.isDemo() ? '📷 กลับไปใช้กล้อง' : '🖱️ โหมดสาธิต'; };
$('demoBtn').onclick = () => { app.setDemo(!app.isDemo()); syncDemoBtn(); };
syncDemoBtn();
window.__lab = { app, demo, get style() { return current; } };
