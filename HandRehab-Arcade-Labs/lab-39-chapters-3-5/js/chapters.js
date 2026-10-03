// ============================================================
// chapters.js — ตัวสร้างร่างบทที่ 3, 4, 5 จากไฟล์ CSV จริง (Lab 39)
// ลาก CSV → csv-kit วิเคราะห์ → report-tables สร้างตาราง → draft-engine เติมแม่แบบ
// ============================================================
import { applyPrefs, toast, downloadText, esc } from './ui.js';
import { analyze } from './csv-kit.js';
import { fillTemplate, missingList, todoList, linesToTable, saveForm, loadForm, hasValue } from './draft-engine.js';
import { buildValues } from './report-tables.js';
applyPrefs();

const $ = (id) => document.getElementById(id);
const STORE = 'lab39-form';
const CH = ['3', '4', '5'];
const templates = {};
const results = new Map();
let form = loadForm(STORE);
let current = '4';

// ค่าที่กรอกเอง (ไม่มีใน CSV) — ค่าเริ่มต้นเฉพาะค่าตั้งค่าในโค้ดหรือเกณฑ์ที่ทีมเลือก ไม่ใช่ผลวัด
const FIELDS = [
  ['project', 'ชื่อแอป', 'HandRehab Arcade'], ['team', 'ชื่อทีม', 'ทีม NeonHands'],
  ['fps_crit', 'เกณฑ์ FPS (สมมติฐาน 2 · บทความ ≥ 25)', '25'], ['survey_crit', 'เกณฑ์ความพึงพอใจ (สมมติฐาน 3)', '3.51'], ['login_crit', 'เกณฑ์เวลาเข้าระบบ วินาที (สมมติฐาน 5)', '5'],
  ['calib_k', 'k เข้า / k ออก (Lab 27)', 'k_on = 0.7, k_off = 0.3'], ['tremor_sec', 'วินาทีวัดมือสั่น (Lab 27)'], ['tremor_cuts', 'ค่าแบ่งระดับมือสั่น (Lab 27)'],
  ['oe_mincutoff', 'One Euro minCutoff (Lab 27)'], ['oe_beta', 'One Euro beta (Lab 27)'], ['oe_dcutoff', 'One Euro dCutoff (Lab 27)'],
  ['rep_enter', 'ตัวนับ enter (ค่าในโค้ด)', '0.7'], ['rep_exit', 'ตัวนับ exit (ค่าในโค้ด)', '0.3'], ['rep_hold', 'minHoldMs (ค่าในโค้ด)', '200'], ['rep_cooldown', 'cooldownMs (ค่าในโค้ด)', '400'],
  ['face_threshold', 'เกณฑ์ความคล้ายใบหน้า (Lab 15)'], ['ear_threshold', 'เกณฑ์ EAR กะพริบตา (Lab 15)'], ['photo_reject', 'ภาพถ่ายถูกปฏิเสธ เช่น 10/10 (Lab 15)'],
  ['knn_k', 'ค่า k ของ kNN (Lab 31)'], ['python_version', 'รุ่น Python (Lab 02)'], ['browser', 'รุ่นเบราว์เซอร์ (Lab 33)'], ['claude_version', 'รุ่น Claude Code (Lab 03)'],
  ['repo', 'ลิงก์ repository (Lab 04)'], ['camera', 'รุ่นกล้อง/ความละเอียด (Lab 10)'], ['cam_distance', 'ระยะมือถึงกล้อง ซม. (Lab 32)'], ['bench_sec', 'วินาทีต่อสถานการณ์ (Lab 33)'],
  ['issues', 'ปัญหาที่พบ / แก้แล้ว เช่น 6 / 4 (Lab 36)'],
  ['hw_lines', 'สเปกเครื่อง บรรทัดละเครื่อง "ชื่อ | CPU | RAM | GPU" (Lab 33)', '', 'textarea'],
];

function buildForm() {
  $('form').innerHTML = FIELDS.map(([k, label, def = '', type]) => `<div class="field ${type ? 'wide' : ''}"><label for="f_${k}">${esc(label)}</label>${type === 'textarea'
    ? `<textarea id="f_${k}" rows="3">${esc(form[k] ?? def)}</textarea>` : `<input id="f_${k}" type="text" value="${esc(form[k] ?? def)}">`}</div>`).join('');
  FIELDS.forEach(([k]) => ($('f_' + k).oninput = () => { form[k] = $('f_' + k).value; saveForm(STORE, form); generate(); }));
}
const formVal = (k) => { const f = FIELDS.find((x) => x[0] === k); return form[k] ?? f?.[2] ?? ''; };

// รวมค่า: จาก CSV ก่อน แล้วค่าที่กรอกเองทับ (ถ้ากรอก)
function allValues() {
  const crit = { fps_crit: formVal('fps_crit'), survey_crit: formVal('survey_crit'), login_crit: formVal('login_crit') };
  const v = buildValues([...results.values()], crit);
  FIELDS.forEach(([k]) => { if (hasValue(formVal(k))) v[k] = formVal(k); });
  v.tbl_hw = hasValue(formVal('hw_lines')) ? linesToTable(formVal('hw_lines'), ['เครื่อง', 'CPU', 'RAM', 'GPU / delegate'], 33) : v.tbl_hw_auto || '';
  return { v, meta: { project: formVal('project'), team: formVal('team'), ...crit } };
}

function generate() {
  if (!CH.every((c) => templates[c])) return;
  const { v, meta } = allValues();
  CH.forEach((c) => {
    const md = fillTemplate(templates[c], v, meta);
    $('out' + c).value = md;
    const miss = missingList(md);
    $('tab' + c).querySelector('b').textContent = miss.length;
    if (c === current) {
      $('missing').innerHTML = [...new Set(miss)].map((m) => `<li>${esc(m)}</li>`).join('') || '<li class="muted">ไม่มีช่องที่ขาดข้อมูลในบทนี้</li>';
      $('todo').innerHTML = todoList(md).map((m) => `<li>${esc(m.slice(0, 160))}…</li>`).join('') || '<li class="muted">–</li>';
    }
  });
}

function showTab(c) {
  current = c;
  CH.forEach((x) => { $('out' + x).classList.toggle('hidden', x !== c); $('tab' + x).classList.toggle('ghost', x !== c); });
  generate();
}

async function takeFiles(list) {
  for (const f of list) {
    if (!/\.csv$/i.test(f.name)) { toast(`${f.name} ไม่ใช่ CSV ข้ามไป`, 'warning'); continue; }
    try { results.set(f.name, analyze(await f.text(), f)); } catch (e) { toast(`อ่าน ${f.name} ไม่ได้: ${e.message}`, 'error'); }
  }
  $('files-list').innerHTML = [...results.values()].map((r) => `<li class="${r.kind === 'unknown' ? 'warn' : ''}">${esc(r.file)} → ${esc(r.label)} · ${r.rows} แถว · วัด ${esc(r.date)}${r.demo ? ' <b class="demo">DEMO ห้ามใช้ในรายงาน</b>' : ''}</li>`).join('');
  generate();
}

// ---------- ปุ่ม ----------
CH.forEach((c) => {
  $('tab' + c).onclick = () => showTab(c);
});
$('copy').onclick = async () => { try { await navigator.clipboard.writeText($('out' + current).value); toast(`คัดลอกบทที่ ${current} แล้ว`); } catch { $('out' + current).select(); toast('กด Ctrl+C เพื่อคัดลอก', 'warning'); } };
$('download').onclick = () => downloadText(`chapter${current}-draft.md`, $('out' + current).value, 'text/markdown');
$('downloadAll').onclick = () => downloadText('chapters3-5-draft.md', CH.map((c) => $('out' + c).value).join('\n\n---\n\n'), 'text/markdown');
$('files').onchange = (e) => takeFiles(e.target.files);
const drop = $('drop');
['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('over'); }));
['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
drop.addEventListener('drop', (e) => takeFiles(e.dataTransfer.files));
$('reset').onclick = () => { results.clear(); $('files-list').innerHTML = ''; generate(); };
const SAMPLES = ['DEMO-lab15-face-login.csv', 'DEMO-lab21-rep-test.csv', 'DEMO-lab27-filters.csv', 'DEMO-lab28-sessions.csv', 'DEMO-lab32-evaluation.csv', 'DEMO-lab33-benchmark.csv', 'DEMO-lab36-survey-responses.csv', 'DEMO-lab36-task-results.csv'];
$('demo').onclick = async () => {
  try { await takeFiles(await Promise.all(SAMPLES.map(async (n) => new File([await (await fetch('samples/' + n)).text()], n, { lastModified: Date.now() })))); toast('ใส่ไฟล์ตัวอย่างแล้ว — ห้ามใช้ในรายงาน', 'warning', 5); }
  catch (e) { toast('โหลดไฟล์ตัวอย่างไม่ได้: ' + e.message, 'error'); }
};

// ---------- เริ่ม ----------
async function start() {
  buildForm();
  try {
    await Promise.all(CH.map(async (c) => { const r = await fetch(`templates/chapter${c}-template.md`); if (!r.ok) throw new Error(`chapter${c}-template.md HTTP ${r.status}`); templates[c] = await r.text(); }));
    $('err').classList.add('hidden');
    showTab('4');
  } catch (e) {
    $('err').classList.remove('hidden');
    $('err').innerHTML = `โหลดแม่แบบไม่ได้ (${esc(e.message)}) — เปิดผ่าน start.bat / start.sh <button class="btn-glow small" id="retry">ลองใหม่</button>`;
    $('retry').onclick = start;
  }
}
start();
