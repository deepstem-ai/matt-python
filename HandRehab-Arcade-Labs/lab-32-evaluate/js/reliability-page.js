// ============================================================
// reliability-page.js — ความเชื่อมั่นแบบทดสอบซ้ำ ICC (Lab 32 · บทความหัวข้อ 6.2)
//   เลือกตัวชี้วัด + เกม + k → สร้างเมทริกซ์ คน × ครั้ง (ตัดเซสชันแรก) → ICC(2,1), ICC(3,1) + แถบ Koo & Li
//   ปุ่ม "ตัวอย่างตำรา" ใช้ตาราง Shrout & Fleiss (1979) ไว้ตรวจว่าสูตรถูก (0.29 / 0.71)
// ============================================================
import { applyPrefs, toast, esc, downloadCSV } from './ui.js';
import { METRICS, buildMatrix, icc, iccBand } from './research.js';
import { loadResearchData } from './research-data.js';

applyPrefs();
const $ = (id) => document.getElementById(id);
const SF = [[9, 2, 5, 8], [6, 1, 3, 2], [8, 4, 6, 8], [7, 1, 2, 6], [10, 5, 6, 9], [6, 2, 4, 7]];
$('metric').innerHTML = Object.entries(METRICS).map(([k, m]) => `<option value="${k}" ${k === 'maxSpreadDeg' ? 'selected' : ''}>${m.th}</option>`).join('');
let data = { sessions: [], names: new Map() }, last = null;

function show({ matrix, subjects, skipped = [], k, colLabel, title }) {
  const r = icc(matrix);
  last = { matrix, subjects, k, r, title };
  const set = (id, v) => { const b = iccBand(v); $('icc' + id).textContent = Number.isFinite(v) ? v.toFixed(3) : '-'; $('band' + id).textContent = b.th; $('band' + id).className = 'band ' + b.key; };
  set('21', r?.icc21); set('31', r?.icc31);
  $('nk').textContent = `${matrix.length} × ${k}`;
  $('verdict').innerHTML = r
    ? (r.icc21 >= 0.75 ? '✅ ผ่านเกณฑ์ของบทความ (ICC(2,1) ≥ 0.75 = ความเชื่อมั่นดี)' : '⚠️ ยังไม่ถึงเกณฑ์ ICC(2,1) ≥ 0.75 — ต้องการผู้เข้าร่วมมากขึ้น หรือตรวจความคงที่ของการวัด (ตรึงเกณฑ์?)')
    : '<span class="muted">ต้องมีอย่างน้อย 2 คนที่มีข้อมูลครบ k ครั้ง (หลังตัดเซสชันแรก)</span>';
  $('matrix').innerHTML = `<thead><tr><th>ผู้เข้าร่วม</th>${Array.from({ length: k }, (_, j) => `<th class="num">${colLabel(j)}</th>`).join('')}</tr></thead><tbody>` +
    (matrix.length ? matrix.map((row, i) => `<tr><td>${esc(subjects[i])}</td>${row.map((v) => `<td class="num">${+v.toFixed(3)}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${k + 1}" class="muted">ไม่มีผู้เข้าร่วมที่มีข้อมูลครบ</td></tr>`) + '</tbody>';
  $('skipped').textContent = skipped.length ? `ไม่นับ ${skipped.length} คน (มีข้อมูลไม่ครบ ${k} ครั้งหลังตัดเซสชันแรก): ` + skipped.map((s) => `${s.name} (${s.available})`).join(', ') : '';
  window.__icc = r;
}

function calc() {
  $('sampleChip').classList.add('hidden');
  const k = +$('k').value, exFirst = $('exFirst').checked;
  const m = buildMatrix(data.sessions, { metric: $('metric').value, k, game: $('game').value, excludeFirst: exFirst, includeDemo: $('incDemo').checked });
  const nm = (id) => data.names.get(id) || id;
  show({ matrix: m.matrix, subjects: m.subjects.map(nm), skipped: m.skipped.map((s) => ({ ...s, name: nm(s.userId) })), k,
    colLabel: (j) => `ครั้งที่ ${j + (exFirst ? 2 : 1)}`, title: METRICS[$('metric').value].th });
}

$('btnCalc').onclick = calc;
['metric', 'game', 'k', 'exFirst', 'incDemo'].forEach((id) => { $(id).onchange = calc; });
$('btnSF').onclick = () => {
  show({ matrix: SF, subjects: SF.map((_, i) => `คนที่ ${i + 1}`), k: 4, colLabel: (j) => `ผู้ประเมิน ${j + 1}`, title: 'Shrout & Fleiss 1979' });
  $('sampleChip').classList.remove('hidden');
};
$('btnCSV').onclick = () => {
  if (!last?.matrix.length) return toast('ยังไม่มีผลให้ส่งออก', 'warning');
  const rows = last.matrix.map((row, i) => ({ subject: last.subjects[i], ...Object.fromEntries(row.map((v, j) => ['t' + (j + 1), v])) }));
  rows.push({ subject: `ICC(2,1)=${last.r?.icc21?.toFixed(3) ?? ''} ICC(3,1)=${last.r?.icc31?.toFixed(3) ?? ''} metric=${last.title} first_session_excluded=${$('exFirst').checked}` });
  downloadCSV('icc-test-retest.csv', rows, ['subject', ...Array.from({ length: last.k }, (_, j) => 't' + (j + 1))]);
};

async function load() { data = await loadResearchData(load); calc(); }
window.__reliability = { SF, show, calc, reload: () => load() };
await load();
