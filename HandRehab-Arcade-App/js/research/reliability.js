// ============================================================
// reliability.js — หน้า reliability.html: ICC ความเที่ยงของการวัดซ้ำ (บทความ §6.2)
// ============================================================
import { applyPrefs, toast, downloadCSV, esc } from '../ui.js';
import { icc, iccBand, ICC_GOOD, ICC_METRICS, buildIccMatrix } from './stats.js';
import { loadResearchSessions, demoBanner, makeReliabilityDemo, clearResearchDemo } from './research-data.js';
applyPrefs();
const $ = (id) => document.getElementById(id);
let sessions = [], last = null;

function fillMetrics() {
  const g = $('game').value, cur = $('metric').value;
  $('metric').innerHTML = Object.entries(ICC_METRICS).filter(([, m]) => !m.games || m.games.includes(g))
    .map(([k, m]) => `<option value="${k}">${esc(m.th)}</option>`).join('');
  if ([...$('metric').options].some((o) => o.value === cur)) $('metric').value = cur;
  else if (g === 'spread-wall') $('metric').value = 'maxSpreadDeg';
}

async function load() {
  try { sessions = await loadResearchSessions(); }
  catch (e) { toast('อ่านฐานข้อมูลไม่ได้: ' + e.message, 'error', 8); sessions = []; }
  await demoBanner($('demoBanner'), { filtered: true });
  render();
}

const fmt = (v) => (Number.isFinite(v) ? v.toFixed(2) : '–');
function render() {
  const inc = $('incDemo').checked, k = Math.max(2, Math.min(10, Math.round(+$('k').value || 2)));
  const pool = sessions.filter((s) => inc || !s.demoKind);
  const opt = { game: $('game').value, metric: $('metric').value, k, lockedOnly: $('lockedOnly').checked };
  const { matrix, users, skipped } = buildIccMatrix(pool, opt);
  const r = icc(matrix), b21 = iccBand(r.icc21), b31 = iccBand(r.icc31);
  last = { opt, matrix, users, r };
  $('icc21').textContent = fmt(r.icc21); $('band21').textContent = b21.th; $('band21').className = 'band-' + b21.key;
  $('icc31').textContent = fmt(r.icc31); $('band31').textContent = b31.th; $('band31').className = 'band-' + b31.key;
  $('size').textContent = `${matrix.length} × ${k}`;
  $('skip').textContent = skipped.length ? `ไม่นำมาคิด ${skipped.length} คน (มีไม่ครบ ${k} ครั้งหลังตัดครั้งแรก)` : '';
  $('verdict').innerHTML = r.error ? `⚠️ ${esc(r.error)} — ต้องมีผู้ใช้อย่างน้อย 2 คนที่มีเซสชันครบ ${k + 1} ครั้ง (ครั้งแรกถูกตัด)${pool.length ? '' : ' · ยังไม่มีเซสชัน ลองกด "ใส่ข้อมูลจำลอง"'}`
    : r.icc21 >= ICC_GOOD ? `✅ ICC(2,1) = <b>${fmt(r.icc21)}</b> ≥ ${ICC_GOOD} ผ่านเกณฑ์ "ดี" ของบทความ (n = ${r.n}, k = ${r.k})`
      : `❌ ICC(2,1) = <b>${fmt(r.icc21)}</b> ต่ำกว่าเป้าหมาย ${ICC_GOOD} (n = ${r.n}, k = ${r.k}) — ตรวจว่าเกณฑ์ถูกตรึง และเงื่อนไขการวัดเหมือนกันทุกครั้ง`;
  $('th').innerHTML = `<tr><th>ผู้ใช้</th>${Array.from({ length: k }, (_, j) => `<th class="n">ครั้งที่ ${j + 2}</th>`).join('')}</tr>`;
  const names = Object.fromEntries(pool.map((s) => [s.userId, s.userName]));
  $('tb').innerHTML = matrix.map((row, i) => `<tr><td>${esc(names[users[i]] || users[i])}</td>${row.map((v) => `<td class="n">${+v.toFixed(3)}</td>`).join('')}</tr>`).join('')
    || `<tr><td colspan="${k + 1}" class="muted">ยังไม่มีข้อมูลพอ</td></tr>`;
  window.__icc = last;
}

$('csv').onclick = () => {
  if (!last?.matrix.length) return toast('ยังไม่มีข้อมูล', 'warning');
  const { opt, matrix, users, r } = last;
  const rows = matrix.map((row, i) => ({ user: users[i], ...Object.fromEntries(row.map((v, j) => ['session_' + (j + 2), v])) }));
  rows.push({ user: 'ICC(2,1)', session_2: fmt(r.icc21) }, { user: 'ICC(3,1)', session_2: fmt(r.icc31) },
    { user: `game=${opt.game} metric=${opt.metric} k=${opt.k} lockedOnly=${opt.lockedOnly} demo=${$('incDemo').checked}`, session_2: '' });
  downloadCSV(`icc-${opt.game}-${opt.metric}.csv`, rows, ['user', ...Array.from({ length: opt.k }, (_, j) => 'session_' + (j + 2))]);
};
$('mkDemo').onclick = async () => { const n = await makeReliabilityDemo(); toast(`ใส่ข้อมูลจำลอง ${n} เซสชัน (ห้ามใช้ในรายงาน)`, 'warning', 5); $('incDemo').checked = true; load(); };
$('rmDemo').onclick = async () => { const n = await clearResearchDemo('reliability'); toast(`ลบข้อมูลจำลอง ${n} เซสชัน`, 'success'); load(); };
$('game').onchange = () => { fillMetrics(); render(); };
['metric', 'k', 'lockedOnly', 'incDemo'].forEach((id) => { $(id).onchange = render; });
fillMetrics();
load();
