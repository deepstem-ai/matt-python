// ============================================================
// survey-results.js — สรุปผลการทดสอบกับผู้ใช้ (Lab 36) อ่านจาก store 'surveys' + settings usertest-*
// ============================================================
import { applyPrefs, toast, downloadCSV, saveCanvasPNG, esc } from '../ui.js';
import { barChart, mean, sd } from '../charts.js';
import { susScore, susInterpret, SUS_BENCHMARK } from './stats.js';
import { SUS_ITEMS } from './sus-data.js';
import { listSurveys, listTaskRecords, loadDemo, clearDemo } from './usertest-store.js';
import { questionStats, statsCols, groupStats, surveyRows, surveyCols, taskRows, taskCols, taskSummary } from './usertest-csv.js';
applyPrefs();
const $ = (id) => document.getElementById(id);
let surveys = [], records = [], sus = [];

async function load() {
  try {
    const inc = $('incDemo').checked;
    const all = (await listSurveys()).filter((s) => inc || !s.demo);
    surveys = all.filter((s) => s.type !== 'sus');            // แบบสอบถามหน้ายิ้มเดิม
    sus = all.filter((s) => s.type === 'sus').map((s) => ({ ...s, score: susScore(s.answers) })).filter((s) => Number.isFinite(s.score));
    records = (await listTaskRecords()).filter((r) => inc || !r.demo);
  } catch (e) { toast('อ่านฐานข้อมูลไม่ได้: ' + e.message, 'error', 8); surveys = []; records = []; }
  render();
}

function renderSus() {
  const scores = sus.map((s) => s.score), m = mean(scores), d = sd(scores), it = susInterpret(m);
  $('susChips').innerHTML = `<span class="chip">ผู้ตอบ SUS <b>${sus.length}</b> คน</span><span class="chip">ค่าเฉลี่ย <b>${scores.length ? m.toFixed(1) : '–'}</b> ± ${scores.length ? d.toFixed(1) : '–'}</span>
    <span class="chip">${scores.length ? (m >= SUS_BENCHMARK ? '✅ ' : '⚠️ ') + it.th : 'ยังไม่มีคำตอบ SUS'}</span>`;
  barChart($('susChart'), sus.map((s) => ({ label: s.participant, value: s.score })),
    { title: `คะแนน SUS รายคน (n = ${sus.length}) เทียบค่าอ้างอิง ${SUS_BENCHMARK}`, yMax: 100, yLabel: 'คะแนน SUS (0–100)', xLabel: 'ผู้เข้าร่วม', format: (v) => v.toFixed(1),
      lines: [{ value: SUS_BENCHMARK, label: `ค่าเฉลี่ยอ้างอิง ${SUS_BENCHMARK}` }], emptyText: 'ยังไม่มีคำตอบ SUS — ทำที่ survey.html?mode=sus' });
  $('tsus').innerHTML = sus.map((s) => `<tr><td>${esc(s.participant)}${s.demo ? ' <span class="demo-flag">(DEMO)</span>' : ''}</td><td>${new Date(s.createdAt).toLocaleDateString('th-TH')}</td>
    <td class="n">${s.score.toFixed(1)}</td><td>${esc(susInterpret(s.score).th)}</td></tr>`).join('')
    + (sus.length ? `<tr><td><b>ค่าเฉลี่ย ± SD</b></td><td></td><td class="n"><b>${m.toFixed(1)} ± ${d.toFixed(1)}</b></td><td>${esc(it.th)}</td></tr>` : '<tr><td colspan="4" class="muted">ยังไม่มีคำตอบ SUS</td></tr>');
  window.__sus = { n: sus.length, mean: m, sd: d, scores };
}

function render() {
  renderSus();
  const st = questionStats(surveys);
  $('n').textContent = surveys.length;
  $('nt').textContent = records.length;
  const all = surveys.flatMap((s) => Object.values(s.answers || {})).filter(Number.isFinite);
  $('overall').textContent = all.length ? mean(all).toFixed(2) : '–';
  $('empty').classList.toggle('hidden', surveys.length > 0);
  $('demoNote').classList.toggle('hidden', !surveys.some((s) => s.demo) && !records.some((r) => r.demo) && !sus.some((s) => s.demo));
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
$('pngSus').onclick = () => saveCanvasPNG($('susChart'), 'sus-scores.png');
$('csvSus').onclick = () => (sus.length ? downloadCSV('sus-scores.csv', sus.map((s) => ({ participant: s.participant, date: new Date(s.createdAt).toISOString().slice(0, 10),
  ...Object.fromEntries(SUS_ITEMS.map((q) => [q.id, s.answers?.[q.id] ?? ''])), sus_score: s.score, interpretation: susInterpret(s.score).th, demo: s.demo ? 'yes' : 'no' }))) : toast('ยังไม่มีคำตอบ SUS', 'warning'));
$('csvStats').onclick = () => surveys.length ? downloadCSV('lab36-survey-summary.csv', questionStats(surveys), statsCols) : toast('ยังไม่มีข้อมูล', 'warning');
$('csvRaw').onclick = () => surveys.length ? downloadCSV('lab36-survey-responses.csv', surveyRows(surveys), surveyCols()) : toast('ยังไม่มีข้อมูล', 'warning');
$('csvTasks').onclick = () => records.length ? downloadCSV('lab36-task-results.csv', taskRows(records), taskCols) : toast('ยังไม่มีบันทึกงาน', 'warning');
addEventListener('resize', () => render());
load();
