// ============================================================
// hand-test.js — หน้าทดสอบ Lab 16: วิดีโอ + โครงมือ + ตาราง 21 จุด + สถิติ
// ============================================================
import { applyPrefs, downloadCSV } from './ui.js';
import { drawHand, LANDMARK_TH, TIPS, FINGER_NAMES, FINGERS, fingerColors } from './hand.js';
import { startHandApp } from './hand-app.js';
import { DemoHand } from './demo-hand.js';

applyPrefs();
const $ = (id) => document.getElementById(id);
const video = $('video'), canvas = $('canvas'), stage = $('stage');

// ---------- สร้างตาราง 21 แถวครั้งเดียว แล้วอัปเดตเฉพาะตัวเลข ----------
const tbody = $('tbl').querySelector('tbody');
const cells = LANDMARK_TH.map((name, i) => {
  const tr = document.createElement('tr');
  if (TIPS.includes(i)) tr.className = 'tip';
  tr.innerHTML = `<td class="num">${i}</td><td>${name}</td><td class="num">—</td><td class="num">—</td><td class="num">—</td>`;
  tbody.appendChild(tr);
  return [...tr.children].slice(2);
});
// ใส่แถบสีนิ้วหน้าชื่อจุด ให้ตรงกับสีโครงมือ
const colors = fingerColors();
LANDMARK_TH.forEach((_, i) => {
  const f = FINGER_NAMES.find((n) => FINGERS[n].includes(i));
  tbody.children[i].children[1].style.borderLeft = `6px solid ${f ? colors[f] : colors.palm}`;
});

// MediaPipe ตั้งชื่อมือโดยถือว่าภาพ "กลับด้านแล้ว" แต่เราส่งภาพดิบจากกล้องหน้า → ชื่อจึงสลับ
const handTh = (h) => (h === 'Left' ? 'ขวา' : h === 'Right' ? 'ซ้าย' : h === 'Demo' ? 'จำลอง' : '—');

let lastHand = null;
let ref = null; // การบันทึกค่าอ้างอิง

function onFrame(hand, now, info) {
  lastHand = hand;
  if ($('showSkel').checked) drawHand(canvas, hand, { style: 'neon' });
  else canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  // มือที่สอง (ถ้าเปิด ?hands=2) วาดทับด้วยสีเดียว เพื่อแยกให้เห็นว่าเป็นอีกมือ
  if (hand?.hands?.[1] && $('showSkel').checked) {
    const c2 = Object.fromEntries(Object.keys(colors).map((k) => [k, colors.palm]));
    drawHand(canvas, hand.hands[1], { style: 'simple', clear: false, colors: c2 });
  }
  $('nohand').classList.toggle('hidden', !!hand || !info.ready);
  // สถิติ (อัปเดตทุกเฟรม ตัวเลขเปลี่ยนทุก 1 วินาที)
  $('sFps').textContent = info.fps;
  $('sAi').textContent = info.aiMs;
  $('sFound').textContent = info.demo ? '—' : info.foundPct + '%';
  $('sDel').textContent = info.delegate;
  $('sHand').textContent = hand ? `${handTh(hand.handedness)} ${(hand.score * 100).toFixed(0)}%` : '—';
  // ตาราง 21 จุด
  cells.forEach((c, i) => {
    const p = hand?.points[i];
    c[0].textContent = p ? p.x.toFixed(3) : '—';
    c[1].textContent = p ? p.y.toFixed(3) : '—';
    c[2].textContent = p ? p.z.toFixed(3) : '—';
  });
  if (ref) recordRef(now, info, hand);
}

// ---------- บันทึกค่าอ้างอิง 10 วินาที (FPS + เวลา AI + % เจอมือ) สำหรับใส่รายงาน ----------
function recordRef(now, info, hand) {
  ref.frames++; if (hand) ref.found++;
  ref.ai.push(info.aiMs);
  if (now - ref.lastSec >= 1000) { ref.rows.push({ second: ref.rows.length + 1, fps: info.fps, aiMs: info.aiMs }); ref.lastSec = now; }
  if (now - ref.t0 >= 10000) {
    const avg = (a) => a.reduce((s, v) => s + v, 0) / (a.length || 1);
    const sum = { avgFps: +avg(ref.rows.map((r) => r.fps)).toFixed(1), avgAiMs: +avg(ref.ai).toFixed(1), foundPct: Math.round((100 * ref.found) / ref.frames), delegate: info.delegate };
    console.table(ref.rows); console.table([sum]);
    const rows = ref.rows;
    $('refOut').innerHTML = `<h3>📌 ค่าอ้างอิงของเครื่องนี้</h3>
      <div class="kv"><div>FPS เฉลี่ย<b>${sum.avgFps}</b></div><div>AI ms/เฟรม<b>${sum.avgAiMs}</b></div>
      <div>% เฟรมที่เจอมือ<b>${sum.foundPct}%</b></div><div>หน่วยประมวลผล<b>${sum.delegate}</b></div></div>
      <p class="${sum.avgFps > 15 ? 'ok-text' : 'bad-text'}">${sum.avgFps > 15 ? '✅ ผ่านเกณฑ์ FPS > 15' : '⚠️ FPS ต่ำกว่า 15 ลองปิดโปรแกรมอื่น หรือลดความละเอียดกล้อง'}</p>
      <button class="btn-glow small" id="refCsv">⬇️ ดาวน์โหลด CSV</button>`;
    $('refCsv').onclick = () => downloadCSV('lab16-reference.csv', [...rows, { second: 'avg', fps: sum.avgFps, aiMs: sum.avgAiMs }], ['second', 'fps', 'aiMs']);
    $('refBtn').disabled = false; $('refBtn').textContent = '⏱️ บันทึกค่าอ้างอิง 10 วินาที';
    ref = null;
  }
}
$('refBtn').onclick = () => {
  const t = performance.now();
  ref = { t0: t, lastSec: t, frames: 0, found: 0, ai: [], rows: [] };
  $('refBtn').disabled = true; $('refBtn').textContent = '⏳ กำลังวัด 10 วินาที…';
  $('refOut').classList.remove('hidden'); $('refOut').innerHTML = '<p>กำลังวัด… ยกมือค้างไว้ในกรอบ</p>';
};

// ---------- ชี้เมาส์ที่จุดเพื่อดูชื่อ (COULD DO) ----------
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
$('demoBtn').onclick = () => { app.setDemo(!app.isDemo()); $('demoBtn').textContent = app.isDemo() ? '📷 กลับไปใช้กล้อง' : '🖱️ โหมดสาธิต'; };
