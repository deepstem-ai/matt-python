// ============================================================
// report-builder.js — หน้า "ตัวสร้างร่างรายงาน" (Lab 38 บทที่ 1 + Lab 39 บทที่ 3–5) แท็บละบท
// แหล่งข้อมูล: CSV ที่ลากมาวาง · ไฟล์ตัวอย่าง DEMO · หรืออ่านจากฐานข้อมูลของแอปนี้โดยตรง (app-db-csv.js)
// ทุกแหล่งผ่าน csv-kit.analyze() ตัวเดียวกัน → ตัวเลขมาจากข้อมูลจริงเท่านั้น ไม่มี = [[missing]]
// ============================================================
import { applyPrefs, toast, downloadText, esc } from '../ui.js';
import { analyze } from './csv-kit.js';
import { missingList, todoList } from './draft-engine.js';
import { buildCh1Form, ch1FromResults, generateCh1, setCh1Listener, clearCh1 } from './report-ch1.js';
import { buildCh345Form, generateCh345, setCh345Listener, CH345 } from './report-ch345.js';
import { readAppDatabase, reportText } from './app-db-csv.js';
applyPrefs();

const $ = (id) => document.getElementById(id);
const CH = ['1', ...CH345];
const TITLE = { 1: 'ร่างบทที่ 1 บทนำ', 3: 'ร่างบทที่ 3 วิธีดำเนินการ', 4: 'ร่างบทที่ 4 ผลการทดลอง', 5: 'ร่างบทที่ 5 สรุปและอภิปราย' };
const templates = {};
const results = new Map();   // ชื่อไฟล์ → ผลวิเคราะห์
let current = '1';

// ---------- สร้างร่างทุกบท + แสดงรายการขาด/ต้องเขียนเองของบทที่เปิดอยู่ ----------
let timer = null;
const later = () => { clearTimeout(timer); timer = setTimeout(generate, 150); };
setCh1Listener(later); setCh345Listener(later);
function generate() {
  if (!CH.every((c) => templates[c])) return;
  const list = [...results.values()];
  const md = { 1: generateCh1(templates['1']), ...generateCh345(templates, list) };
  CH.forEach((c) => {
    $('out' + c).value = md[c];
    const miss = missingList(md[c]);
    document.querySelector(`[data-ch="${c}"] b`).textContent = miss.length;
    if (c !== current) return;
    $('missChip').innerHTML = `ยังขาดข้อมูล <b>${miss.length}</b> จุด`;
    $('missChip').className = 'chip ' + (miss.length ? 'warn' : 'ok');
    $('missing').innerHTML = [...new Set(miss)].map((m) => `<li>${esc(m)}</li>`).join('') || '<li class="muted">ครบแล้ว — อย่าลืมเขียนใหม่ด้วยสำนวนของทีมเอง</li>';
    $('todo').innerHTML = todoList(md[c]).map((m) => `<li>${esc(m.length > 160 ? m.slice(0, 160) + '…' : m)}</li>`).join('') || '<li class="muted">–</li>';
  });
}
function showTab(c) {
  current = c;
  document.querySelectorAll('[data-ch]').forEach((b) => { const on = b.dataset.ch === c; b.classList.toggle('ghost', !on); b.setAttribute('aria-selected', on); });
  CH.forEach((x) => $('out' + x).classList.toggle('hidden', x !== c));
  $('form1Box').classList.toggle('hidden', c !== '1'); $('hypoBox').classList.toggle('hidden', c !== '1');
  $('form345Box').classList.toggle('hidden', c === '1');
  $('outTitle').textContent = TITLE[c];
  generate();
}
document.querySelectorAll('[data-ch]').forEach((b) => (b.onclick = () => showTab(b.dataset.ch)));

// ---------- รับข้อมูล ----------
function listFiles() {
  const list = [...results.values()];
  $('filesList').innerHTML = list.length ? list.map((r) => `<li class="${r.kind === 'unknown' ? 'warn' : ''}">${r.source === 'db' ? '<span class="src-db">🗄️</span> ' : ''}${esc(r.file)} → ${esc(r.label)} · ${r.rows} แถว · วัด ${esc(r.date)}${r.demo ? ' <b class="demo">DEMO ห้ามใช้ในรายงาน</b>' : ''}${r.note ? ` <span class="muted">(${esc(r.note)})</span>` : ''}</li>`).join('')
    : '<li class="muted">ยังไม่มีข้อมูล</li>';
}
function take(newResults) {
  newResults.forEach((r) => results.set(r.file, r));
  ch1FromResults(newResults); buildCh1Form(); // เติมฟอร์มบทที่ 1 แล้ววาดใหม่ให้เห็นค่า
  listFiles(); generate();
}
async function takeFiles(fileList) {
  const out = [];
  for (const f of fileList) {
    if (!/\.csv$/i.test(f.name)) { toast(`${f.name} ไม่ใช่ CSV ข้ามไป`, 'warning'); continue; }
    try { const r = analyze(await f.text(), f); out.push(r); if (r.kind === 'unknown') toast(`${f.name}: ไม่รู้จักรูปแบบคอลัมน์`, 'warning', 5); }
    catch (e) { toast(`อ่าน ${f.name} ไม่ได้: ${e.message}`, 'error'); }
  }
  if (out.length) { take(out); toast(`อ่าน CSV ${out.length} ไฟล์ เติมร่างแล้ว`); }
}
$('files').onchange = (e) => takeFiles(e.target.files);
const drop = $('drop');
['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('over'); }));
['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
drop.addEventListener('drop', (e) => takeFiles(e.dataTransfer.files));
$('fromDb').onclick = async () => {
  try {
    const { files, report } = await readAppDatabase();
    for (const k of [...results.keys()]) if (results.get(k).source === 'db') results.delete(k); // อ่านซ้ำ = แทนของเดิม
    take(files.map((f) => ({ ...analyze(f.text, { name: f.name, lastModified: Date.now() }), source: 'db', note: f.note })));
    toast(files.length ? `ฐานข้อมูลแอป: ${reportText(report)}` : 'ฐานข้อมูลยังไม่มีผลการวัด — ไปเล่นเกม / ทดสอบกับผู้ใช้ / วัดผลก่อน', files.length ? 'success' : 'warning', 6);
  } catch (e) { toast('อ่านฐานข้อมูลไม่ได้: ' + e.message, 'error', 6); }
};
const SAMPLES = ['DEMO-lab15-face-login.csv', 'DEMO-lab21-rep-test.csv', 'DEMO-lab27-filters.csv', 'DEMO-lab28-sessions.csv', 'DEMO-lab32-evaluation.csv', 'DEMO-lab33-benchmark.csv', 'DEMO-lab36-survey-responses.csv', 'DEMO-lab36-task-results.csv'];
$('demo').onclick = async () => {
  try {
    await takeFiles(await Promise.all(SAMPLES.map(async (n) => { const r = await fetch('docs/research/samples/' + n); if (!r.ok) throw new Error(n); return new File([await r.text()], n, { lastModified: Date.now() }); })));
    toast('ใส่ไฟล์ตัวอย่างแล้ว — ห้ามใช้ในรายงานจริง', 'warning', 5);
  } catch (e) { toast('โหลดไฟล์ตัวอย่างไม่ได้: ' + e.message, 'error'); }
};
$('reset').onclick = () => { results.clear(); listFiles(); generate(); };
$('clear').onclick = () => { clearCh1(); generate(); };

// ---------- คัดลอก / ดาวน์โหลด ----------
$('copy').onclick = async () => { try { await navigator.clipboard.writeText($('out' + current).value); toast(`คัดลอกบทที่ ${current} แล้ว`); } catch { $('out' + current).select(); toast('กด Ctrl+C เพื่อคัดลอก', 'warning'); } };
$('download').onclick = () => downloadText(`chapter${current}-draft.md`, $('out' + current).value, 'text/markdown');
$('downloadAll').onclick = () => downloadText('chapters-1-3-4-5-draft.md', CH.map((c) => $('out' + c).value).join('\n\n---\n\n'), 'text/markdown');

// ---------- เริ่ม: โหลดแม่แบบทั้ง 4 บท ----------
async function start() {
  buildCh1Form(); buildCh345Form();
  try {
    await Promise.all(CH.map(async (c) => { const r = await fetch(`docs/research/templates/chapter${c}-template.md`); if (!r.ok) throw new Error(`chapter${c}-template.md HTTP ${r.status}`); templates[c] = await r.text(); }));
    $('err').classList.add('hidden');
    const q = new URLSearchParams(location.search).get('ch');
    showTab(CH.includes(q) ? q : '1');
  } catch (e) {
    $('err').classList.remove('hidden');
    $('err').innerHTML = `โหลดแม่แบบไม่ได้ (${esc(e.message)}) — เปิดผ่าน start.bat / start.sh <button class="btn-glow small" id="retry">ลองใหม่</button>`;
    $('retry').onclick = start;
  }
}
start();
window.__lab = { results, showTab, get current() { return current; } };
