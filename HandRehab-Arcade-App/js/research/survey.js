// ============================================================
// survey.js — แบบสอบถามหลังทดลองใช้ (Lab 36) ทีละข้อ ปุ่มหน้ายิ้มใหญ่ บันทึกลง store 'surveys'
// ============================================================
import { applyPrefs, toast, downloadCSV, esc } from '../ui.js';
import { newId } from '../db.js';
import { QUESTIONS, FACES } from './usertest-data.js';
import { saveSurvey, listSurveys } from './usertest-store.js';
import { surveyRows, surveyCols } from './usertest-csv.js';
applyPrefs({ theme: 'neon', profile: 'elder' });

const $ = (id) => document.getElementById(id);
let idx = 0, answers = {}, pid = '';
const show = (id) => ['start', 'qs', 'more', 'done'].forEach((s) => $(s).classList.toggle('hidden', s !== id));
const setProg = (n) => { $('prog').style.width = (n / (QUESTIONS.length + 1)) * 100 + '%'; };

// สร้างปุ่มหน้ายิ้ม 5 ปุ่ม
FACES.forEach((f) => {
  const b = document.createElement('button');
  b.className = 'face'; b.dataset.v = f.v; b.setAttribute('role', 'radio');
  b.innerHTML = `<span class="em" aria-hidden="true">${f.face}</span><span class="lb">${f.th}</span>`;
  b.onclick = () => choose(f.v);
  $('faces').appendChild(b);
});

function renderQ() {
  const q = QUESTIONS[idx];
  $('qnum').textContent = `ข้อ ${idx + 1} จาก ${QUESTIONS.length} · ${q.group}`;
  $('qtext').textContent = q.th;
  document.querySelectorAll('.face').forEach((b) => { const on = +b.dataset.v === answers[q.id]; b.classList.toggle('sel', on); b.setAttribute('aria-checked', on); });
  $('back').disabled = idx === 0;
  setProg(idx);
}
// กดแล้วไฮไลต์สั้น ๆ ก่อนไปข้อถัดไป ให้เห็นว่าเลือกแล้ว
function choose(v) {
  answers[QUESTIONS[idx].id] = v;
  renderQ();
  setTimeout(() => {
    if (idx < QUESTIONS.length - 1) { idx++; renderQ(); }
    else { show('more'); setProg(QUESTIONS.length); $('comment').focus(); }
  }, 350);
}

$('go').onclick = () => {
  pid = $('pid').value.trim().toUpperCase();
  if (!/^[A-Z0-9-]{2,12}$/.test(pid)) { $('pidErr').textContent = 'กรอกรหัส เช่น P01 (ห้ามใช้ชื่อจริง)'; $('pid').classList.add('invalid'); return; }
  idx = 0; answers = {}; show('qs'); renderQ();
};
$('pid').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('go').click(); });
$('back').onclick = () => { if (idx > 0) { idx--; renderQ(); } };
$('back2').onclick = () => { idx = QUESTIONS.length - 1; show('qs'); renderQ(); };

$('save').onclick = async () => {
  const rec = { id: newId('s_'), userId: pid, participant: pid, createdAt: Date.now(), answers, comment: $('comment').value.trim(), demo: false };
  try {
    await saveSurvey(rec);
    show('done'); setProg(QUESTIONS.length + 1);
    $('doneMsg').innerHTML = `บันทึกคำตอบของ <b>${esc(pid)}</b> แล้ว (${Object.keys(answers).length} ข้อ)`;
  } catch (e) {
    toast('บันทึกไม่สำเร็จ: ' + e.message + ' — กดส่งอีกครั้ง', 'error', 8);
  }
};
$('again').onclick = () => { $('pid').value = ''; $('comment').value = ''; show('start'); setProg(0); $('pid').focus(); };
$('csv').onclick = async () => {
  const list = await listSurveys();
  if (!list.length) return toast('ยังไม่มีคำตอบ', 'warning');
  downloadCSV('lab36-survey-responses.csv', surveyRows(list), surveyCols());
};
setProg(0);
$('pid').focus();
