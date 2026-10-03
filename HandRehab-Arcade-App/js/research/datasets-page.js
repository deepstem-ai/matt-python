// ============================================================
// datasets-page.js — ควบคุมหน้า dataset viewer (Lab 30) · datasets.html
// ขั้นตอน: เลือกชุดข้อมูล → อ่าน/ติ๊กยอมรับสัญญาอนุญาต → ดาวน์โหลด (มีลิงก์สำรอง) → ตาราง 20 แถวแรก
// ============================================================
import { applyPrefs, esc, toast, cssVar } from '../ui.js';
import { fetchWithFallback, readLocalFile, formatBytes } from './dataset-loader.js';
import { toRecords } from './records.js';
import { DATASETS } from './datasets-config.js';

applyPrefs();
const $ = (id) => document.getElementById(id);
const pick = $('pick'), ack = $('ack'), btnGo = $('btnGo'), btnLocal = $('btnLocal'), btnSave = $('btnSave');
let current = null;   // ผลดาวน์โหลดล่าสุด { bytes, size, url, ... }
let records = null;   // ผลแปลงเป็นแถว

// ---------- เติมรายการชุดข้อมูล ----------
pick.innerHTML = Object.entries(DATASETS).map(([k, d]) => `<option value="${k}">${esc(d.name)}</option>`).join('');
const ds = () => DATASETS[pick.value];

function showLicence() {
  const L = ds().licence;
  const li = (a) => a.map((t) => `<li>${esc(t)}</li>`).join('');
  $('licenceBody').innerHTML = `<h4>${esc(L.title)}</h4>
    <b>ทำได้</b><ul class="can">${li(L.can)}</ul>
    <b>ต้องทำ</b><ul class="must">${li(L.must)}</ul>
    <b>ห้ามทำ</b><ul class="cannot">${li(L.cannot)}</ul>
    <p class="muted">${esc(L.note)}</p>
    <p>ลิงก์ต้นทาง: <a href="${esc(ds().manualUrl)}" target="_blank" rel="noopener">${esc(ds().manualUrl)}</a></p>`;
  $('licence').open = true;
}

// เปลี่ยนชุดข้อมูล → ต้องยอมรับเงื่อนไขใหม่ทุกครั้ง และซ่อนข้อมูลเก่า
function reset() {
  ack.checked = false; current = null; records = null;
  $('result').classList.add('hidden'); $('msg').innerHTML = ''; $('attempts').innerHTML = '';
  setProgress(0, 'ยังไม่ได้เริ่มดาวน์โหลด');
  showLicence(); updateButtons();
}
function updateButtons() {
  btnGo.disabled = !ack.checked; btnLocal.disabled = !ack.checked; btnSave.disabled = !current;
}
pick.onchange = reset;
ack.onchange = () => { updateButtons(); if (ack.checked && current) render(); else if (!ack.checked) $('result').classList.add('hidden'); };

function setProgress(pct, label) {
  $('bar').style.width = (pct ?? 0) + '%';
  $('pct').textContent = pct === null ? '…' : pct + '%';
  if (label) $('progressLabel').textContent = label;
}

// ---------- ดาวน์โหลด ----------
btnGo.onclick = async () => {
  const d = ds();
  if (!ack.checked) return toast('กรุณาอ่านและติ๊กยอมรับสัญญาอนุญาตก่อน', 'warning');
  $('msg').innerHTML = ''; $('attempts').innerHTML = '';
  if (d.tooBig) { // ชุดใหญ่เกินกว่าจะโหลดในเบราว์เซอร์ → บอกวิธีทำเอง
    $('msg').innerHTML = `<div class="alert warn"><b>ชุดข้อมูลนี้ใหญ่เกินกว่าจะดาวน์โหลดในเบราว์เซอร์</b><pre class="howto">${esc(d.howTo)}</pre>
      <p>ลิงก์: <a href="${esc(d.manualUrl)}" target="_blank" rel="noopener">${esc(d.manualUrl)}</a></p></div>`;
    return;
  }
  btnGo.disabled = true;
  try {
    current = await fetchWithFallback(d.links, {
      timeoutMs: 15000, expect: d.expect, minBytes: d.minBytes, magic: d.magic, manualUrl: d.manualUrl, fileName: d.fileName,
      onAttempt: (i, n, label) => { setProgress(0, `กำลังลองลิงก์ ${i + 1}/${n}: ${label}`); addAttempt(`⏳ ${label}`, ''); },
      onProgress: ({ pct, got }) => { setProgress(pct); if (pct === null) $('pct').textContent = formatBytes(got); }, // ไม่รู้ขนาดรวม → แสดงจำนวนไบต์แทน %
    });
    markAttempts(current.attempts);
    setProgress(100, `สำเร็จจาก: ${current.label}`);
    toast('ดาวน์โหลดและตรวจไฟล์ผ่านแล้ว ✅');
    render();
  } catch (e) {
    markAttempts(e.attempts || []);
    setProgress(0, 'ดาวน์โหลดไม่สำเร็จ');
    $('msg').innerHTML = `<div class="alert"><b>⚠️ ${esc(e.message)}</b><pre class="howto">${esc(e.thai || '')}</pre>
      <p>${esc(d.howTo)}</p>
      <div class="row"><a class="btn-glow small" href="${esc(e.manualUrl || d.manualUrl)}" target="_blank" rel="noopener">🔗 เปิดลิงก์ดาวน์โหลดเอง</a>
      <button class="btn-glow small ghost" id="retry">🔄 ลองใหม่</button></div></div>`;
    $('retry').onclick = () => btnGo.click();
  } finally { updateButtons(); }
};

function addAttempt(text, cls) { const li = document.createElement('li'); li.textContent = text; li.className = cls; $('attempts').appendChild(li); }
function markAttempts(list) {
  $('attempts').innerHTML = '';
  list.forEach((a) => addAttempt(a.ok ? `✅ ${a.url} — ใช้ได้` : `❌ ${a.url} — ${a.reason}`, a.ok ? 'ok' : 'bad'));
}

// ---------- โหลดจากไฟล์ในเครื่อง (สำหรับไฟล์ที่ได้จากแฟลชไดรฟ์) ----------
btnLocal.onclick = () => $('file').click();
$('file').onchange = async (ev) => {
  const f = ev.target.files[0]; if (!f) return;
  const d = ds();
  try {
    current = await readLocalFile(f, { expect: d.expect, minBytes: d.tooBig ? 10 : d.minBytes, magic: d.magic });
    markAttempts(current.attempts); setProgress(100, current.label); render();
  } catch (e) {
    $('msg').innerHTML = `<div class="alert"><b>ไฟล์นี้ใช้ไม่ได้:</b> ${esc(e.message)}<br>ตรวจว่าเลือกไฟล์ถูกชนิด (${esc(d.expect)})</div>`;
  }
  ev.target.value = '';
  updateButtons();
};

// บันทึกไฟล์ที่ดาวน์โหลดมาลงเครื่อง เพื่อนำไปวางใน datasets/ (ใช้ครั้งหน้าแบบออฟไลน์)
btnSave.onclick = () => {
  if (!current) return;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([current.bytes]));
  a.download = ds().fileName; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};

// ---------- แสดงผล (เฉพาะเมื่อยอมรับสัญญาอนุญาตแล้ว) ----------
function render() {
  if (!ack.checked || !current) return;
  records = toRecords(current);
  $('total').textContent = records.total.toLocaleString('th-TH');
  $('size').textContent = formatBytes(current.size);
  $('from').textContent = current.url.split('/').slice(-2).join('/');
  const cols = records.columns;
  $('table').innerHTML = `<thead><tr><th>#</th>${cols.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>` +
    records.rows.slice(0, 20).map((r, i) => `<tr><td class="num">${i + 1}</td>${cols.map((c) => `<td>${esc(r[c])}</td>`).join('')}</tr>`).join('') + '</tbody>';
  $('sampler').classList.toggle('hidden', !records.points.some(Boolean));
  $('cards').innerHTML = '';
  $('result').classList.remove('hidden');
  if (records.points.some(Boolean)) sample();
}

// สุ่มระเบียนที่มีจุดมือ 3 ตัว วาดเป็นภาพโครงมือ (COULD DO: random sampler)
const LINKS = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [0, 17], [17, 18], [18, 19], [19, 20]];
function sample() {
  const idx = records.points.map((p, i) => (p ? i : -1)).filter((i) => i >= 0);
  $('cards').innerHTML = '';
  for (let n = 0; n < Math.min(3, idx.length); n++) {
    const i = idx[Math.floor(Math.random() * idx.length)];
    const fig = document.createElement('figure');
    const c = document.createElement('canvas'); c.width = 240; c.height = 240;
    drawPts(c, records.points[i]);
    const r = records.rows[i];
    fig.append(c, Object.assign(document.createElement('figcaption'), { textContent: `#${i + 1} ${r.labels || r.gesture || ''}` }));
    $('cards').appendChild(fig);
  }
}
function drawPts(c, pts) {
  const ctx = c.getContext('2d');
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const x0 = Math.min(...xs), y0 = Math.min(...ys), s = Math.max(Math.max(...xs) - x0, Math.max(...ys) - y0) || 1;
  const P = pts.map(([x, y]) => [20 + ((x - x0) / s) * 200, 20 + ((y - y0) / s) * 200]);
  ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.strokeStyle = cssVar('--primary');
  LINKS.forEach(([a, b]) => { ctx.beginPath(); ctx.moveTo(...P[a]); ctx.lineTo(...P[b]); ctx.stroke(); });
  ctx.fillStyle = cssVar('--pink');
  P.forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill(); });
}
$('btnSample').onclick = sample;

reset();
// สำหรับทดสอบอัตโนมัติ
window.__lab = { pick: (k) => { pick.value = k; reset(); }, accept: () => { ack.checked = true; updateButtons(); }, go: () => btnGo.click(), state: () => ({ total: records?.total, size: current?.size, from: current?.url, attempts: current?.attempts }) };
