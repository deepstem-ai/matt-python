// ============================================================
// chapter1.js — ตัวสร้างร่างบทที่ 1 (Lab 38)
// ข้อมูลเข้า: ฟอร์ม (กรอกเอง) + ไฟล์ CSV ที่ลากมาวาง (เติมฟอร์มให้อัตโนมัติ)
// ข้อมูลออก: บทที่ 1 ภาษาไทยทางการ จากแม่แบบ templates/chapter1-template.md
// กฎเหล็ก: ช่องไหนไม่มีข้อมูล → [[missing: กลับไป Lab NN — ...]] ห้ามเดา
// ============================================================
import { applyPrefs, toast, downloadText, esc } from './ui.js';
import { analyze, fmt, lightKey } from './csv-kit.js';
import { fillTemplate, missingList, todoList, linesToTable, saveForm, loadForm, hasValue } from './draft-engine.js';
applyPrefs();

const $ = (id) => document.getElementById(id);
const STORE = 'lab38-form';

// ---------- ท่ามือมาตรฐาน 5 ท่า (จาก js/gestures.js ของ Lab 20) ----------
const GESTURES = [
  { key: 'pinch', th: 'จีบนิ้ว', en: 'Pinch', trains: 'การหยิบจับละเอียด นิ้วโป้ง-นิ้วชี้', daily: 'หยิบเหรียญ กลัดกระดุม หยิบยาเม็ด' },
  { key: 'fist', th: 'กำมือ', en: 'Fist', trains: 'แรงกำมือ กล้ามเนื้องอนิ้ว', daily: 'ถือแก้วน้ำ จับราวบันได' },
  { key: 'open', th: 'แบมือกางนิ้ว', en: 'Open / Spread', trains: 'การเหยียดและกางนิ้ว', daily: 'หยิบของชิ้นใหญ่ ล้างมือ' },
  { key: 'fingerTap', th: 'แตะนิ้วทีละนิ้ว', en: 'Finger Tap', trains: 'การควบคุมนิ้วแยกทีละนิ้ว', daily: 'กดแป้นพิมพ์ กดปุ่มโทรศัพท์' },
  { key: 'wristFlex', th: 'งอ-เหยียดข้อมือ', en: 'Wrist Flex', trains: 'พิสัยการเคลื่อนไหวข้อมือ', daily: 'เทน้ำ ใช้ช้อน หวีผม' },
];

// ---------- ช่องในฟอร์ม: key, ป้าย, แลปที่มา, ชนิด, ค่าเริ่มต้น (เฉพาะค่าตั้งค่าในโค้ด/เกณฑ์ที่ทีมเลือก ไม่ใช่ผลวัด) ----------
export const FIELDS = [
  { g: 'ข้อมูลทีม', key: 'project', label: 'ชื่อแอป', def: 'HandRehab Arcade', meta: 1 },
  { g: 'ข้อมูลทีม', key: 'team', label: 'ชื่อทีม', def: 'ทีม NeonHands', meta: 1 },
  { g: 'ข้อมูลทีม', key: 'school', label: 'โรงเรียน', def: 'โรงเรียนของเรา', meta: 1 },
  { g: 'เกณฑ์ที่ทีมเลือก (สมมติฐาน)', key: 'fps_crit', label: 'เกณฑ์ FPS (ผ่าน Lab 16 = 15)', def: '15', meta: 1 },
  { g: 'เกณฑ์ที่ทีมเลือก (สมมติฐาน)', key: 'survey_crit', label: 'เกณฑ์ความพึงพอใจ (1–5)', def: '3.51', meta: 1 },
  { g: 'เกณฑ์ที่ทีมเลือก (สมมติฐาน)', key: 'login_crit', label: 'เกณฑ์เวลาเข้าระบบ (วินาที, Lab 15 = 5)', def: '5', meta: 1 },
  { g: 'Lab 36 · ทดสอบกับผู้ใช้', key: 'n_participants', label: 'จำนวนผู้ทดสอบ (คน)', lab: 36 },
  { g: 'Lab 36 · ทดสอบกับผู้ใช้', key: 'age_range', label: 'ช่วงอายุ เช่น 62–78', lab: 36 },
  { g: 'Lab 36 · ทดสอบกับผู้ใช้', key: 'task_success', label: 'อัตราทำงานสำเร็จเอง (%)', lab: 36 },
  { g: 'Lab 36 · ทดสอบกับผู้ใช้', key: 'survey_mean', label: 'ความพึงพอใจเฉลี่ย ± SD', lab: 36 },
  { g: 'Lab 36 · ทดสอบกับผู้ใช้', key: 'file_survey', label: 'ไฟล์แบบสอบถาม', lab: 36 },
  { g: 'Lab 32 · ความแม่นยำและแสง', key: 'acc_overall', label: 'ความแม่นยำรวม (%)', lab: 32 },
  { g: 'Lab 32 · ความแม่นยำและแสง', key: 'acc_bright', label: 'แสงสว่าง (%)', lab: 32 },
  { g: 'Lab 32 · ความแม่นยำและแสง', key: 'acc_normal', label: 'แสงปกติ (%)', lab: 32 },
  { g: 'Lab 32 · ความแม่นยำและแสง', key: 'acc_dim', label: 'แสงสลัว (%)', lab: 32 },
  { g: 'Lab 32 · ความแม่นยำและแสง', key: 'dim_cut', label: 'ความสว่างที่ถือว่าสลัว (0–255)', lab: 32 },
  { g: 'Lab 32 · ความแม่นยำและแสง', key: 'trials_per_gesture', label: 'จำนวนครั้งต่อท่า', lab: 32 },
  { g: 'Lab 32 · ความแม่นยำและแสง', key: 'cam_distance', label: 'ระยะมือถึงกล้อง (ซม.)', lab: 32 },
  { g: 'Lab 32 · ความแม่นยำและแสง', key: 'file_eval', label: 'ไฟล์ผลความแม่นยำ', lab: 32 },
  { g: 'Lab 33 · เครื่องคอมพิวเตอร์', key: 'machine_lines', label: 'ตารางเครื่อง: บรรทัดละเครื่อง "ชื่อ | CPU/RAM | FPS เฉลี่ย | AI ms"', lab: 33, type: 'textarea' },
  { g: 'Lab 33 · เครื่องคอมพิวเตอร์', key: 'browser', label: 'เบราว์เซอร์และรุ่น', lab: 33 },
  { g: 'Lab 33 · เครื่องคอมพิวเตอร์', key: 'resolution', label: 'ความละเอียดภาพ เช่น 1280×720', lab: 33 },
  { g: 'Lab 33 · เครื่องคอมพิวเตอร์', key: 'file_bench', label: 'ไฟล์ผลวัดความเร็ว', lab: 33 },
  { g: 'Lab 20 / 31 · ท่ามือ', key: 'invented_gestures', label: 'ท่าที่ทีมคิดเอง (Lab 31)', lab: 31 },
  { g: 'Lab 20 / 31 · ท่ามือ', key: 'knn_acc', label: 'AI ทายท่าที่คิดเองถูก (จาก 10)', lab: 31 },
  { g: 'Lab 20 / 31 · ท่ามือ', key: 'fist_on', label: 'เกณฑ์คะแนนท่ากำมือ (ค่าในโค้ด)', lab: 20, def: '0.7' },
  { g: 'Lab 20 / 31 · ท่ามือ', key: 'open_full', label: 'มุมกางเต็มที่ (องศา, ค่าในโค้ด)', lab: 20, def: '45' },
  { g: 'Lab 27 / 21 / 18 · ค่าปรับเทียบ', key: 'pinch_enter', label: 'เกณฑ์เข้าท่าจีบ (จากการปรับเทียบจริง)', lab: 27 },
  { g: 'Lab 27 / 21 / 18 · ค่าปรับเทียบ', key: 'pinch_exit', label: 'เกณฑ์ออกท่าจีบ', lab: 27 },
  { g: 'Lab 27 / 21 / 18 · ค่าปรับเทียบ', key: 'calib_k', label: 'k เข้า / k ออก เช่น 0.6 / 0.3', lab: 27 },
  { g: 'Lab 27 / 21 / 18 · ค่าปรับเทียบ', key: 'file_filters', label: 'ไฟล์เปรียบเทียบตัวกรอง', lab: 27 },
  { g: 'Lab 27 / 21 / 18 · ค่าปรับเทียบ', key: 'rep_enter', label: 'ตัวนับ enter (ค่าในโค้ด)', lab: 21, def: '0.7' },
  { g: 'Lab 27 / 21 / 18 · ค่าปรับเทียบ', key: 'rep_exit', label: 'ตัวนับ exit (ค่าในโค้ด)', lab: 21, def: '0.3' },
  { g: 'Lab 27 / 21 / 18 · ค่าปรับเทียบ', key: 'rep_hold', label: 'ค้างขั้นต่ำ ms (ค่าในโค้ด)', lab: 21, def: '200' },
  { g: 'Lab 27 / 21 / 18 · ค่าปรับเทียบ', key: 'rep_cooldown', label: 'พักหลังนับ ms (ค่าในโค้ด)', lab: 21, def: '400' },
  { g: 'Lab 27 / 21 / 18 · ค่าปรับเทียบ', key: 'scale_var', label: 'ระยะเปลี่ยนเมื่อเลื่อนมือ (%) (Lab 18)', lab: 18 },
  { g: 'อื่น ๆ', key: 'file_face', label: 'ไฟล์ทดสอบเข้าระบบ (Lab 15)', lab: 15 },
  { g: 'อื่น ๆ', key: 'camera', label: 'รุ่นกล้องและความละเอียด (Lab 10)', lab: 10 },
  { g: 'อื่น ๆ', key: 'study_start', label: 'วันเริ่มโครงงาน', lab: 37, type: 'date' },
  { g: 'อื่น ๆ', key: 'study_end', label: 'วันสิ้นสุดการเก็บข้อมูล', lab: 37, type: 'date' },
];

let form = loadForm(STORE);
let template = '';

// ---------- สร้างฟอร์ม ----------
function buildForm() {
  const groups = [...new Set(FIELDS.map((f) => f.g))];
  $('form').innerHTML = groups.map((g) => `<fieldset class="card-neon"><legend>${esc(g)}</legend><div class="fgrid">${FIELDS.filter((f) => f.g === g).map((f) => {
    const v = form[f.key] ?? f.def ?? '';
    const input = f.type === 'textarea' ? `<textarea id="f_${f.key}" rows="4">${esc(v)}</textarea>` : `<input id="f_${f.key}" type="${f.type || 'text'}" value="${esc(v)}">`;
    return `<div class="field ${f.type === 'textarea' ? 'wide' : ''}"><label for="f_${f.key}">${esc(f.label)}</label>${input}</div>`;
  }).join('')}${g.startsWith('Lab 20') ? gestureBoxes() : ''}</div></fieldset>`).join('');
  FIELDS.forEach((f) => ($('f_' + f.key).oninput = () => { form[f.key] = $('f_' + f.key).value; changed(); }));
  document.querySelectorAll('[data-gesture]').forEach((cb) => (cb.onchange = () => { form.gestures = [...document.querySelectorAll('[data-gesture]:checked')].map((x) => x.dataset.gesture); changed(); }));
}
function gestureBoxes() {
  const on = form.gestures ?? GESTURES.map((g) => g.key);
  return `<div class="field wide"><label>ท่าที่ระบบรองรับ (Lab 20)</label><div class="row">${GESTURES.map((g) => `<label class="choice"><input type="checkbox" data-gesture="${g.key}" ${on.includes(g.key) ? 'checked' : ''}> ${g.th}</label>`).join('')}</div></div>`;
}
function setField(key, value) {
  if (!hasValue(value)) return;
  form[key] = String(value);
  const el = $('f_' + key); if (el) el.value = form[key];
}

// ---------- รวมค่า → เติมแม่แบบ ----------
function values() {
  const v = {};
  FIELDS.forEach((f) => { v[f.key] = form[f.key] ?? f.def ?? ''; });
  const gs = GESTURES.filter((g) => (form.gestures ?? GESTURES.map((x) => x.key)).includes(g.key));
  v.n_gestures = gs.length || '';
  v.gesture_table = gs.length ? ['| ท่า | ชื่อภาษาอังกฤษ | ฝึกอะไร | ใช้ในชีวิตประจำวัน |', '|---|---|---|---|', ...gs.map((g) => `| ${g.th} | ${g.en} | ${g.trains} | ${g.daily} |`)].join('\n') : '';
  v.machine_table = linesToTable(v.machine_lines, ['เครื่อง', 'CPU / RAM / GPU', 'FPS เฉลี่ย', 'เวลา AI ต่อเฟรม (ms)'], 33);
  const n = String(v.machine_lines || '').split('\n').filter((l) => l.trim()).length;
  v.n_machines = n || '';
  return v;
}
const meta = () => Object.fromEntries(FIELDS.filter((f) => f.meta).map((f) => [f.key, form[f.key] ?? f.def]));

function generate() {
  if (!template) return;
  const md = fillTemplate(template, values(), meta());
  $('out').value = md;
  const miss = missingList(md), todo = todoList(md);
  $('missChip').innerHTML = `ยังขาดข้อมูล <b>${miss.length}</b> จุด`;
  $('missChip').className = 'chip ' + (miss.length ? 'warn' : 'ok');
  $('missing').innerHTML = [...new Set(miss)].map((m) => `<li>${esc(m)}</li>`).join('') || '<li class="muted">ครบแล้ว — อย่าลืมเขียนใหม่ด้วยสำนวนของทีมเอง</li>';
  $('todo').innerHTML = todo.map((m) => `<li>${esc(m)}</li>`).join('');
  hypoReadiness();
}
// สมมติฐานมีข้อมูลตอบหรือยัง (ไม่ตัดสินผล ให้ทีมตัดสินในบทที่ 4)
function hypoReadiness() {
  const v = values();
  const rows = [
    ['H1 แสงสลัว < แสงปกติ', hasValue(v.acc_dim) && hasValue(v.acc_normal), `สลัว ${v.acc_dim || '?'}% · ปกติ ${v.acc_normal || '?'}%`, 32],
    ['H2 FPS ≥ เกณฑ์', hasValue(v.machine_lines), `${v.n_machines || 0} เครื่อง`, 33],
    ['H3 พึงพอใจ ≥ เกณฑ์', hasValue(v.survey_mean), `${v.survey_mean || '?'}`, 36],
    ['H4 One Euro ดีกว่า', hasValue(v.file_filters), v.file_filters || '?', 27],
    ['H5 เข้าระบบ ≤ เกณฑ์', hasValue(v.file_face), v.file_face || '?', 15],
  ];
  $('hypo').innerHTML = rows.map(([h, ok, d, lab]) => `<li>${ok ? '✅' : '⬜'} ${esc(h)} <span class="muted">— ${ok ? esc(d) : `ยังไม่มีข้อมูล กลับไป Lab ${lab}`}</span></li>`).join('');
}
let t = null;
function changed() { saveForm(STORE, form); clearTimeout(t); t = setTimeout(generate, 150); }

// ---------- CSV → เติมฟอร์ม ----------
async function takeFiles(list) {
  const seen = [];
  for (const f of list) {
    if (!/\.csv$/i.test(f.name)) continue;
    const r = analyze(await f.text(), f);
    const m = (k) => r.metrics.filter((x) => x.key === k);
    if (r.kind === 'survey-raw' || r.kind === 'survey-summary') {
      setField('file_survey', f.name);
      m('participants_n')[0] && setField('n_participants', m('participants_n')[0].value);
      m('survey_mean')[0] && setField('survey_mean', m('survey_mean')[0].text);
    }
    if (r.kind === 'usertask') {
      m('test_participants')[0] && setField('n_participants', m('test_participants')[0].value);
      m('task_success_pct')[0] && setField('task_success', fmt(m('task_success_pct')[0].value, 1));
    }
    if (r.kind === 'evaluation' || r.kind === 'evaluation-summary') {
      setField('file_eval', f.name);
      m('gesture_acc')[0] && setField('acc_overall', fmt(m('gesture_acc')[0].value, 1));
      (r.tables.perLighting || []).forEach((x) => setField('acc_' + lightKey(x.lighting), fmt(x.accuracy, 1)));
      const pg = r.tables.perGesture || [];
      if (pg.length) setField('trials_per_gesture', Math.round(pg.reduce((s, x) => s + x.n, 0) / pg.length / Math.max(1, (r.tables.perLighting || [1]).length)));
    }
    if (r.kind === 'benchmark') {
      setField('file_bench', f.name);
      setField('machine_lines', (r.tables.perMachine || []).map((x) => `${x.machine} |  | ${fmt(x.fps, 1)} ± ${fmt(x.fpsSd, 1)} | ${fmt(x.aiMs, 1)}`).join('\n'));
    }
    if (r.kind === 'filters') setField('file_filters', f.name);
    if (r.kind === 'facelogin') setField('file_face', f.name);
    seen.push(`${f.name} → ${r.label}`);
    if (r.kind === 'unknown') toast(`${f.name}: ไม่รู้จักรูปแบบคอลัมน์`, 'warning', 5);
  }
  if (seen.length) { $('seen').innerHTML = seen.map((x) => `<li>${esc(x)}</li>`).join(''); toast(`อ่าน CSV ${seen.length} ไฟล์ เติมฟอร์มแล้ว`); }
  changed();
}

// ---------- ปุ่ม ----------
$('files').onchange = (e) => takeFiles(e.target.files);
const drop = $('drop');
['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('over'); }));
['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
drop.addEventListener('drop', (e) => takeFiles(e.dataTransfer.files));
$('demo').onclick = async () => {
  const names = ['DEMO-lab32-evaluation.csv', 'DEMO-lab33-benchmark.csv', 'DEMO-lab36-survey-responses.csv', 'DEMO-lab36-task-results.csv', 'DEMO-lab27-filters.csv', 'DEMO-lab15-face-login.csv'];
  try { await takeFiles(await Promise.all(names.map(async (n) => new File([await (await fetch('samples/' + n)).text()], n)))); toast('ใส่ข้อมูลตัวอย่างแล้ว — ห้ามใช้ในรายงานจริง', 'warning', 5); }
  catch (e) { toast('โหลดไฟล์ตัวอย่างไม่ได้: ' + e.message, 'error'); }
};
$('clear').onclick = () => { form = {}; saveForm(STORE, form); buildForm(); generate(); };
$('copy').onclick = async () => { try { await navigator.clipboard.writeText($('out').value); toast('คัดลอกแล้ว'); } catch { $('out').select(); toast('กด Ctrl+C เพื่อคัดลอก', 'warning'); } };
$('download').onclick = () => downloadText('chapter1-draft.md', $('out').value, 'text/markdown');

// ---------- เริ่ม: โหลดแม่แบบ ----------
async function start() {
  buildForm();
  try {
    const r = await fetch('templates/chapter1-template.md');
    if (!r.ok) throw new Error('HTTP ' + r.status);
    template = await r.text();
    $('err').classList.add('hidden');
    generate();
  } catch (e) {
    $('err').classList.remove('hidden');
    $('err').innerHTML = `โหลดแม่แบบ templates/chapter1-template.md ไม่ได้ (${esc(e.message)}) — เปิดผ่าน start.bat / start.sh <button class="btn-glow small" id="retry">ลองใหม่</button>`;
    $('retry').onclick = start;
  }
}
start();
