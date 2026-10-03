// ============================================================
// survey.js — แบบสอบถามหลังทดลองใช้ (Lab 36) ทีละข้อ ปุ่มหน้ายิ้มใหญ่ บันทึกลง store 'surveys'
// ============================================================
import { applyPrefs, toast, downloadCSV, esc } from '../ui.js';
import { newId } from '../db.js';
import { QUESTIONS, FACES } from './usertest-data.js';
import { saveSurvey, listSurveys } from './usertest-store.js';
import { surveyRows, surveyCols } from './usertest-csv.js';
import { SUS_ITEMS, AGREE } from './sus-data.js';
import { susScore } from './stats.js';
applyPrefs({ theme: 'neon', profile: 'elder' });

const $ = (id) => document.getElementById(id);
let idx = 0, answers = {}, pid = '', mode = 'faces';
// โหมด faces = แบบสอบถามความพึงพอใจเดิม · โหมด sus = System Usability Scale มาตรฐาน (บทความ §6.2)
const SUS_QS = SUS_ITEMS.map((q) => ({ ...q, group: 'SUS' }));
const qs = () => (mode === 'sus' ? SUS_QS : QUESTIONS);
const show = (id) => ['start', 'qs', 'more', 'done'].forEach((s) => $(s).classList.toggle('hidden', s !== id));
const setProg = (n) => { $('prog').style.width = (n / (qs().length + 1)) * 100 + '%'; };

// สร้างปุ่มคำตอบ 5 ปุ่ม: หน้ายิ้ม (faces) หรือระดับความเห็นด้วย 1–5 (sus)
function buildButtons() {
  const host = $('faces'); host.innerHTML = '';
  host.classList.toggle('agree', mode === 'sus');
  host.setAttribute('aria-label', mode === 'sus' ? 'ระดับความเห็นด้วย 1–5' : 'ระดับความรู้สึก');
  (mode === 'sus' ? AGREE.map((a) => ({ v: a.v, face: a.icon, th: a.th })) : FACES).forEach((f) => {
    const b = document.createElement('button');
    b.className = 'face'; b.dataset.v = f.v; b.setAttribute('role', 'radio');
    b.innerHTML = `<span class="em" aria-hidden="true">${f.face}</span><span class="lb">${f.th}</span>`;
    b.onclick = () => choose(f.v);
    host.appendChild(b);
  });
}
function setMode(m) {
  mode = m === 'sus' ? 'sus' : 'faces';
  const r = document.querySelector(`input[name=mode][value=${mode}]`); if (r) r.checked = true;
  $('intro').innerHTML = mode === 'sus'
    ? 'SUS มี 10 ข้อ ข้อละ 1 หน้า อ่านข้อความแล้วกด <b>1 = ไม่เห็นด้วยอย่างยิ่ง … 5 = เห็นด้วยอย่างยิ่ง</b> ตอบตามความรู้สึกแรก ไม่มีคำตอบถูกหรือผิด'
    : 'มี 10 ข้อ ข้อละ 1 หน้า กดรูปหน้าที่ตรงกับความรู้สึก <b>ไม่มีคำตอบถูกหรือผิด</b>';
  buildButtons(); setProg(0);
}
document.querySelectorAll('input[name=mode]').forEach((r) => { r.onchange = () => setMode(r.value); });

function renderQ() {
  const q = qs()[idx];
  $('qnum').textContent = `ข้อ ${idx + 1} จาก ${qs().length} · ${q.group}`;
  $('qtext').textContent = q.th;
  $('qen').textContent = mode === 'sus' ? q.en : '';
  document.querySelectorAll('.face').forEach((b) => { const on = +b.dataset.v === answers[q.id]; b.classList.toggle('sel', on); b.setAttribute('aria-checked', on); });
  $('back').disabled = idx === 0;
  setProg(idx);
}
// กดแล้วไฮไลต์สั้น ๆ ก่อนไปข้อถัดไป ให้เห็นว่าเลือกแล้ว
function choose(v) {
  answers[qs()[idx].id] = v;
  renderQ();
  setTimeout(() => {
    if (idx < qs().length - 1) { idx++; renderQ(); }
    else { show('more'); setProg(qs().length); $('comment').focus(); }
  }, 350);
}

$('go').onclick = () => {
  pid = $('pid').value.trim().toUpperCase();
  if (!/^[A-Z0-9-]{2,12}$/.test(pid)) { $('pidErr').textContent = 'กรอกรหัส เช่น P01 (ห้ามใช้ชื่อจริง)'; $('pid').classList.add('invalid'); return; }
  setMode(document.querySelector('input[name=mode]:checked')?.value);
  idx = 0; answers = {}; show('qs'); renderQ();
};
$('pid').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('go').click(); });
$('back').onclick = () => { if (idx > 0) { idx--; renderQ(); } };
$('back2').onclick = () => { idx = qs().length - 1; show('qs'); renderQ(); };

$('save').onclick = async () => {
  const rec = { id: newId('s_'), type: mode === 'sus' ? 'sus' : 'faces', userId: pid, participant: pid, createdAt: Date.now(), answers, comment: $('comment').value.trim(), demo: false };
  if (mode === 'sus') rec.susScore = susScore(answers);
  try {
    await saveSurvey(rec);
    show('done'); setProg(qs().length + 1);
    $('doneMsg').innerHTML = `บันทึกคำตอบของ <b>${esc(pid)}</b> แล้ว (${Object.keys(answers).length} ข้อ)${mode === 'sus' ? ` · คะแนน SUS <b>${Number.isFinite(rec.susScore) ? rec.susScore.toFixed(1) : '–'}</b> / 100` : ''}`;
    window.__lastSurvey = rec;
  } catch (e) {
    toast('บันทึกไม่สำเร็จ: ' + e.message + ' — กดส่งอีกครั้ง', 'error', 8);
  }
};
$('again').onclick = () => { $('pid').value = ''; $('comment').value = ''; show('start'); setProg(0); $('pid').focus(); };
$('csv').onclick = async () => {
  const list = (await listSurveys()).filter((s) => (s.type === 'sus') === (mode === 'sus'));
  if (!list.length) return toast('ยังไม่มีคำตอบ', 'warning');
  if (mode === 'sus') downloadCSV('sus-responses.csv', list.map((s) => ({ participant: s.participant, date: new Date(s.createdAt).toISOString().slice(0, 10), ...s.answers, sus_score: susScore(s.answers), demo: s.demo ? 'yes' : 'no' })));
  else downloadCSV('lab36-survey-responses.csv', surveyRows(list), surveyCols());
};
setMode(new URLSearchParams(location.search).get('mode'));
$('pid').focus();
