// ============================================================
// report-ch345.js — ฟอร์ม + ตัวเติมแม่แบบ "บทที่ 3, 4, 5" (Lab 39) ใช้ในหน้า report-builder.html
// ผลวิเคราะห์ CSV (csv-kit) → report-tables สร้างตาราง → draft-engine เติมแม่แบบ
// ============================================================
import { esc } from '../ui.js';
import { fillTemplate, linesToTable, saveForm, loadForm, hasValue } from './draft-engine.js';
import { buildValues } from './report-tables.js';

const $ = (id) => document.getElementById(id);
const STORE = 'lab39-form';
export const CH345 = ['3', '4', '5'];
let form = loadForm(STORE);
let onChange = () => {};
export function setCh345Listener(fn) { onChange = fn; }

// ค่าที่กรอกเอง (ไม่มีใน CSV) — ค่าเริ่มต้นเฉพาะค่าตั้งค่าในโค้ดหรือเกณฑ์ที่ทีมเลือก ไม่ใช่ผลวัด
const FIELDS = [
  ['project', 'ชื่อแอป', 'HandRehab Arcade'], ['team', 'ชื่อทีม', 'ทีม NeonHands'],
  ['fps_crit', 'เกณฑ์ FPS (สมมติฐาน 2)', '15'], ['survey_crit', 'เกณฑ์ความพึงพอใจ (สมมติฐาน 3)', '3.51'], ['login_crit', 'เกณฑ์เวลาเข้าระบบ วินาที (สมมติฐาน 5)', '5'],
  ['calib_k', 'k เข้า / k ออก (Lab 27)'], ['tremor_sec', 'วินาทีวัดมือสั่น (Lab 27)'], ['tremor_cuts', 'ค่าแบ่งระดับมือสั่น (Lab 27)'],
  ['oe_mincutoff', 'One Euro minCutoff (Lab 27)'], ['oe_beta', 'One Euro beta (Lab 27)'], ['oe_dcutoff', 'One Euro dCutoff (Lab 27)'],
  ['rep_enter', 'ตัวนับ enter (ค่าในโค้ด)', '0.7'], ['rep_exit', 'ตัวนับ exit (ค่าในโค้ด)', '0.3'], ['rep_hold', 'minHoldMs (ค่าในโค้ด)', '200'], ['rep_cooldown', 'cooldownMs (ค่าในโค้ด)', '300'],
  ['face_threshold', 'เกณฑ์ความคล้ายใบหน้า (Lab 15)'], ['ear_threshold', 'เกณฑ์ EAR กะพริบตา (Lab 15)'], ['photo_reject', 'ภาพถ่ายถูกปฏิเสธ เช่น 10/10 (Lab 15)'],
  ['knn_k', 'ค่า k ของ kNN (Lab 31)'], ['python_version', 'รุ่น Python (Lab 02)'], ['browser', 'รุ่นเบราว์เซอร์ (Lab 33)'], ['claude_version', 'รุ่น Claude Code (Lab 03)'],
  ['repo', 'ลิงก์ repository (Lab 04)'], ['camera', 'รุ่นกล้อง/ความละเอียด (Lab 10)'], ['cam_distance', 'ระยะมือถึงกล้อง ซม. (Lab 32)'], ['bench_sec', 'วินาทีต่อสถานการณ์ (Lab 33)'],
  ['issues', 'ปัญหาที่พบ / แก้แล้ว เช่น 6 / 4 (Lab 36)'],
  ['hw_lines', 'สเปกเครื่อง บรรทัดละเครื่อง "ชื่อ | CPU | RAM | GPU" (Lab 33)', '', 'textarea'],
];

function buildForm() {
  $('form345').innerHTML = FIELDS.map(([k, label, def = '', type]) => `<div class="field ${type ? 'wide' : ''}"><label for="f3_${k}">${esc(label)}</label>${type === 'textarea'
    ? `<textarea id="f3_${k}" rows="3">${esc(form[k] ?? def)}</textarea>` : `<input id="f3_${k}" type="text" value="${esc(form[k] ?? def)}">`}</div>`).join('');
  FIELDS.forEach(([k]) => ($('f3_' + k).oninput = () => { form[k] = $('f3_' + k).value; saveForm(STORE, form); onChange(); }));
}
const formVal = (k) => { const f = FIELDS.find((x) => x[0] === k); return form[k] ?? f?.[2] ?? ''; };

// รวมค่า: จาก CSV ก่อน แล้วค่าที่กรอกเองทับ (ถ้ากรอก)
function allValues(results) {
  const crit = { fps_crit: formVal('fps_crit'), survey_crit: formVal('survey_crit'), login_crit: formVal('login_crit') };
  const v = buildValues(results, crit);
  FIELDS.forEach(([k]) => { if (hasValue(formVal(k))) v[k] = formVal(k); });
  v.tbl_hw = hasValue(formVal('hw_lines')) ? linesToTable(formVal('hw_lines'), ['เครื่อง', 'CPU', 'RAM', 'GPU / delegate'], 33) : v.tbl_hw_auto || '';
  return { v, meta: { project: formVal('project'), team: formVal('team'), ...crit } };
}


export { buildForm as buildCh345Form };
// เติมแม่แบบทั้ง 3 บท: templates = { '3': text, ... }, results = ผลวิเคราะห์ทุกไฟล์ → { '3': md, '4': md, '5': md }
export function generateCh345(templates, results) {
  const { v, meta } = allValues(results);
  return Object.fromEntries(CH345.map((c) => [c, templates[c] ? fillTemplate(templates[c], v, meta) : '']));
}
