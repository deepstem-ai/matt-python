// ============================================================
// survey-results.js — สรุปผลการทดสอบกับผู้ใช้ (Lab 36) อ่านจาก store 'surveys' + settings usertest-*
// ============================================================
import { applyPrefs, toast, downloadCSV, saveCanvasPNG, esc } from '../ui.js';
import { barChart, mean } from '../charts.js';
import { listSurveys, listTaskRecords, loadDemo, clearDemo } from './usertest-store.js';
import { questionStats, statsCols, groupStats, surveyRows, surveyCols, taskRows, taskCols, taskSummary } from './usertest-csv.js';
applyPrefs();
const $ = (id) => document.getElementById(id);
let surveys = [], records = [];

async function load() {
  try {
    const inc = $('incDemo').checked;
    surveys = (await listSurveys()).filter((s) => inc || !s.demo);
    records = (await listTaskRecords()).filter((r) => inc || !r.demo);
  } catch (e) { toast('อ่านฐานข้อมูลไม่ได้: ' + e.message, 'error', 8); surveys = []; records = []; }
  render();
}

function render() {
  const st = questionStats(surveys);
  $('n').textContent = surveys.length;
  $('nt').textContent = records.length;
  const all = surveys.flatMap((s) => Object.values(s.answers || {})).filter(Number.isFinite);
  $('overall').textContent = all.length ? mean(all).toFixed(2) : '–';
  $('empty').classList.toggle('hidden', surveys.length > 0);
  $('demoNote').classList.toggle('hidden', !surveys.some((s) => s.demo) && !records.some((r) => r.demo));
  // กราฟแท่ง + ขีด SD
  barChart($('chart'), surveys.length ? st.map((s) => ({ label: 'ข้อ ' + s.no, value: s.mean, error: s.sd })) : [],
    { title: `ค่าเฉลี่ย ± SD รายข้อ (n = ${surveys.length})`, yMax: 5, yLabel: 'คะแนน 1–5', xLabel: 'ข้อคำถาม', format: (v) => v.toFixed(2), emptyText: 'ยังไม่มีคำตอบ' });
  $('tb').innerHTML = st.map((s) => `<tr><td>${s.no}</td><td>${esc(s.group)}</td><td>${esc(s.text)}</td><td class="n">${s.n}</td><td class="n">${s.n ? s.mean.toFixed(2) : '–'}</td><td class="n">${s.n ? s.sd.toFixed(2) : '–'}</td></tr>`).join('');
  $('tg').innerHTML = groupStats(surveys).map((g) => `<tr><td>${esc(g.group)}</td><td class="n">${g.n}</td><td class="n">${g.n ? g.mean.toFixed(2) : '–'}</td><td class="n">${g.n ? g.sd.toFixed(2) : '–'}</td></tr>`).join('');
  $('tt').innerHTML = taskSummary(records).map((t) => `<tr><td>${t.task} ${esc(t.th)}</td><td class="n">${t.alone}</td><td class="n">${t.help}</td><td class="n">${t.fail}</td><td class="n">${t.successPct === '' ? '–' : t.successPct + '%'}</td><td class="n">${t.n ? `${t.meanSec} ± ${t.sdSec}` : '–'}</td></tr>`).join('');
  const qs = [...surveys.filter((s) => s.comment).map((s) => [s.participant, s.comment, s.demo]),
    ...records.flatMap((r) => (r.tasks || []).filter((t) => t.note).map((t) => [r.participant + ' · ' + t.id, t.note, r.demo]))];
  $('quotes').innerHTML = qs.length ? qs.map(([p, c, d]) => `<div class="quote">"${esc(c)}" — <b>${esc(p)}</b>${d ? ' <span class="demo-flag">(DEMO)</span>' : ''}</div>`).join('') : 'ยังไม่มีความเห็น';
}

$('incDemo').onchange = load;
$('demo').onclick = $('demo2').onclick = async () => { await loadDemo(); toast('ใส่ข้อมูลตัวอย่างแล้ว (รหัส DEMO- ห้ามใช้ในรายงาน)', 'warning', 5); load(); };
$('clearDemo').onclick = async () => { await clearDemo(); toast('ลบข้อมูลตัวอย่างแล้ว ข้อมูลจริงยังอยู่'); load(); };
$('png').onclick = () => saveCanvasPNG($('chart'), 'lab36-survey-chart.png');
$('csvStats').onclick = () => surveys.length ? downloadCSV('lab36-survey-summary.csv', questionStats(surveys), statsCols) : toast('ยังไม่มีข้อมูล', 'warning');
$('csvRaw').onclick = () => surveys.length ? downloadCSV('lab36-survey-responses.csv', surveyRows(surveys), surveyCols()) : toast('ยังไม่มีข้อมูล', 'warning');
$('csvTasks').onclick = () => records.length ? downloadCSV('lab36-task-results.csv', taskRows(records), taskCols) : toast('ยังไม่มีบันทึกงาน', 'warning');
addEventListener('resize', () => render());
load();
