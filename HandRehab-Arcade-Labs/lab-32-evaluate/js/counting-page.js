// ============================================================
// counting-page.js — หน้าความแม่นยำการนับ (Lab 32 · บทความหัวข้อ 6.2)
//   ตารางเซสชัน (ระบบนับ + ความสว่างที่วัดได้) → ผู้วิจัยใส่จำนวนที่ผู้สังเกตนับจากวิดีโอ + ระดับแสง
//   → ความแม่นยำ % · MAE · กราฟแยก 3 ระดับแสง · CSV
//   ค่าที่ผู้สังเกตใส่ บันทึกใน store 'evaluations' (id = 'obs_' + sessionId)
// ============================================================
import { applyPrefs, toast, esc, downloadCSV, saveCanvasPNG, cssVar } from './ui.js';
import { getAll, put } from './db.js';
import { barChart } from './charts.js';
import { LIGHTS, LIGHT_TH, lightFromBrightness, isDemoSession, countAccuracy, summarizeCounting } from './research.js';
import { loadResearchData, GAME_TH, fmtDate } from './research-data.js';

applyPrefs();
const $ = (id) => document.getElementById(id);
let rows = [];          // [{ s, name, sys, obs, light, brightness, demo }]
let sample = false;     // true = ตัวอย่างจำลอง (ไม่บันทึก)

async function loadDb() {
  sample = false; $('sampleChip').classList.add('hidden');
  const { sessions, names } = await loadResearchData(loadDb);
  let obsMap = new Map();
  try { obsMap = new Map((await getAll('evaluations')).filter((e) => e.kind === 'count-observer').map((e) => [e.sessionId, e])); } catch (e) { console.warn('[counting] อ่านผลผู้สังเกตไม่ได้', e); }
  rows = sessions.filter((s) => s.status !== 'in-progress').sort((a, b) => b.startTime - a.startTime).map((s) => {
    const o = obsMap.get(s.id);
    return { s, name: names.get(s.userId) || s.userId || 'guest', sys: +s.reps || 0, obs: o ? o.obs : null,
      light: o?.light || lightFromBrightness(s.avgBrightness), brightness: s.avgBrightness, demo: isDemoSession(s) };
  });
  render();
}

// ตัวอย่างจำลอง: 4 เซสชันต่อระดับแสง แสงมืดนับพลาดมากขึ้น (ไว้ดูหน้าตาเครื่องมือ)
function loadSample() {
  sample = true; $('sampleChip').classList.remove('hidden');
  const B = { bright: 175, normal: 115, dim: 55 }, miss = { bright: [0, 0, 1, 0], normal: [0, 1, -1, 0], dim: [2, 1, 3, -1] };
  rows = LIGHTS.flatMap((l, li) => [0, 1, 2, 3].map((i) => {
    const obs = 10 + ((i * 3 + li) % 5);
    return { s: { id: `sample_${l}_${i}`, game: ['star-portal', 'rhythm-tap', 'spread-wall'][i % 3], startTime: Date.now() - (li * 4 + i) * 3600e3, userId: 'sample' },
      name: `ผู้ทดลองจำลอง ${i + 1}`, sys: obs - miss[l][i], obs, light: l, brightness: B[l] + i * 3, demo: false };
  }));
  render();
}

const visible = () => rows.filter((r) => ($('game').value === 'all' || r.s.game === $('game').value) && (sample || $('incDemo').checked || !r.demo));
const pct = (v) => (v === null || v === undefined ? '-' : v.toFixed(1) + '%');

function render() {
  const list = visible();
  $('sessTable').innerHTML = `<thead><tr><th>วันเวลา</th><th>ผู้เล่น</th><th>เกม</th><th class="num">ระบบนับ</th><th class="num">ความสว่าง</th><th>ระดับแสง</th><th>ผู้สังเกตนับ</th><th class="num">ความแม่นยำ</th></tr></thead><tbody>` +
    (list.length ? list.map((r, i) => {
      const a = countAccuracy(r.sys, r.obs);
      return `<tr><td>${fmtDate(r.s.startTime)}${r.demo ? ' <span class="chip">สาธิต</span>' : ''}</td><td>${esc(r.name)}</td><td>${GAME_TH[r.s.game] || esc(r.s.game || '-')}</td>
        <td class="num">${r.sys}</td><td class="num">${Number.isFinite(r.brightness) ? r.brightness.toFixed(0) : '-'}</td>
        <td><select class="light" data-i="${i}" aria-label="ระดับแสง">${LIGHTS.map((l) => `<option value="${l}" ${l === r.light ? 'selected' : ''}>${LIGHT_TH[l]}</option>`).join('')}</select></td>
        <td><input class="obs" type="number" min="0" step="1" inputmode="numeric" data-i="${i}" value="${r.obs ?? ''}" aria-label="จำนวนที่ผู้สังเกตนับ"></td>
        <td class="num">${a === null ? '-' : (a * 100).toFixed(0) + '%'}</td></tr>`;
    }).join('') : '<tr><td colspan="8" class="muted">ยังไม่มีเซสชัน — เล่นเกมใน Lab 23-28 ก่อน หรือกด "ตัวอย่างจำลอง"</td></tr>') + '</tbody>';
  $('sessTable').querySelectorAll('input.obs').forEach((el) => { el.onchange = () => edit(list[+el.dataset.i], { obs: el.value === '' ? null : Math.max(0, Math.round(+el.value)) }); });
  $('sessTable').querySelectorAll('select.light').forEach((el) => { el.onchange = () => edit(list[+el.dataset.i], { light: el.value }); });
  summary(list);
}

async function edit(r, patch) {
  Object.assign(r, patch);
  if (!sample) {
    try { await put('evaluations', { id: 'obs_' + r.s.id, kind: 'count-observer', sessionId: r.s.id, userId: r.s.userId, obs: r.obs, light: r.light, sys: r.sys, at: Date.now() }); }
    catch (e) { toast('บันทึกไม่สำเร็จ: ' + e.message, 'error', 5); }
  }
  render();
}

function summary(list) {
  const done = list.filter((r) => Number.isFinite(r.obs));
  const s = summarizeCounting(done);
  $('nObs').textContent = s.overall.n; $('accAll').textContent = pct(s.overall.accuracyPct); $('maeAll').textContent = s.overall.mae?.toFixed(2) ?? '-';
  const color = { bright: '--warning', normal: '--primary', dim: '--secondary' };
  barChart($('chart'), LIGHTS.filter((l) => s.byLight[l].n).map((l) => ({ label: `${LIGHT_TH[l]} (n=${s.byLight[l].n})`, value: s.byLight[l].accuracyPct, color: cssVar(color[l]) })),
    { title: 'ความแม่นยำการนับครั้งตามระดับแสง', yMax: 100, yLabel: 'ความแม่นยำ (%)', xLabel: 'ระดับแสง', format: (v) => v.toFixed(1) + '%', emptyText: 'ใส่จำนวนที่ผู้สังเกตนับก่อน' });
  $('lightTable').innerHTML = '<thead><tr><th>ระดับแสง</th><th class="num">เซสชัน</th><th class="num">ระบบนับรวม</th><th class="num">ผู้สังเกตนับรวม</th><th class="num">ความแม่นยำ</th><th class="num">MAE (ครั้ง)</th></tr></thead><tbody>' +
    [...LIGHTS.map((l) => [LIGHT_TH[l], s.byLight[l]]), ['รวม', s.overall]].map(([t, v]) =>
      `<tr><td>${t}</td><td class="num">${v.n}</td><td class="num">${v.totalSys}</td><td class="num">${v.totalObs}</td><td class="num">${pct(v.accuracyPct)}</td><td class="num">${v.mae?.toFixed(2) ?? '-'}</td></tr>`).join('') + '</tbody>';
  window.__counting = s;
}

$('btnCSV').onclick = () => {
  const out = visible().map((r) => ({ session_id: r.s.id, date: new Date(r.s.startTime).toISOString(), user: r.name, game: r.s.game, system_count: r.sys,
    observer_count: r.obs ?? '', light: r.light, brightness: Number.isFinite(r.brightness) ? r.brightness : '', accuracy: countAccuracy(r.sys, r.obs) ?? '',
    abs_error: Number.isFinite(r.obs) ? Math.abs(r.sys - r.obs) : '', demo: r.demo || sample }));
  if (!out.length) return toast('ยังไม่มีข้อมูล', 'warning');
  downloadCSV(`counting-accuracy${sample ? '-SAMPLE' : ''}.csv`, out);
};
$('btnPNG').onclick = () => saveCanvasPNG($('chart'), 'counting-accuracy-by-light.png');
$('btnSample').onclick = loadSample;
$('btnReload').onclick = loadDb;
$('game').onchange = render; $('incDemo').onchange = render;
window.__countingPage = { loadSample, rows: () => rows };
await loadDb();
