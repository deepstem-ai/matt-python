// ============================================================
// count-accuracy.js — หน้า count-accuracy.html: ระบบนับ vs ผู้สังเกตนับจากวิดีโอ (บทความ §6.2)
//   ค่าที่ผู้สังเกตกรอก → store 'settings' key 'count-accuracy' (ไม่แก้โครงสร้าง db.js)
// ============================================================
import { applyPrefs, toast, downloadCSV, esc, cssVar } from '../ui.js';
import { barChart } from '../charts.js';
import { countAccuracy, countSummary, LIGHT_LEVELS, lightFromBrightness, mean } from './stats.js';
import { loadResearchSessions, demoBanner, makeCountDemo, clearResearchDemo, loadCountStore, saveCountStore } from './research-data.js';
applyPrefs();
const $ = (id) => document.getElementById(id);
const GAME_TH = { 'star-portal': '⭐ จับดาว', 'rhythm-tap': '🎵 เคาะจังหวะ', 'spread-wall': '🐠 กางนิ้ว' };
let sessions = [], store = {};

async function load() {
  try { [sessions, store] = await Promise.all([loadResearchSessions(), loadCountStore()]); }
  catch (e) { toast('อ่านฐานข้อมูลไม่ได้: ' + e.message, 'error', 8); sessions = []; store = {}; }
  sessions = sessions.filter((s) => s.status !== 'in-progress').sort((a, b) => b.startTime - a.startTime);
  await demoBanner($('demoBanner'), { filtered: true });
  render();
}

function visible() {
  const g = $('game').value, inc = $('incDemo').checked, lo = $('lockedOnly').checked, only = $('onlyObs').checked;
  return sessions.filter((s) => (!g || s.game === g) && (inc || !s.demoKind) && (!lo || s.calib?.locked) && (!only || Number.isFinite(store[s.id]?.observer)));
}
const lightOf = (s) => store[s.id]?.light || lightFromBrightness(s.avgBrightness);
const pct = (v) => (Number.isFinite(v) ? (v * 100).toFixed(1) : '–');

function rows() {
  return visible().map((s) => {
    const e = store[s.id] || {}, obs = Number.isFinite(e.observer) ? e.observer : null;
    return { s, obs, light: lightOf(s), acc: obs === null ? NaN : countAccuracy(s.reps, obs) };
  });
}

function render() {
  const list = rows(), withObs = list.filter((r) => r.obs !== null);
  const all = countSummary(withObs.map((r) => ({ sys: r.s.reps, obs: r.obs })));
  $('sumChips').innerHTML = `<span class="chip">กรอกแล้ว <b>${all.n}</b> / ${list.length} เซสชัน</span>
    <span class="chip">ความถูกต้องเฉลี่ย <b>${pct(all.meanAcc)}%</b> ± ${pct(all.sdAcc)}</span><span class="chip">MAE <b>${Number.isFinite(all.mae) ? all.mae.toFixed(2) : '–'}</b> ครั้ง</span>`;
  const per = Object.entries(LIGHT_LEVELS).map(([k, th]) => {
    const rs = withObs.filter((r) => r.light === k), sm = countSummary(rs.map((r) => ({ sys: r.s.reps, obs: r.obs })));
    return { k, th, ...sm, bright: mean(rs.map((r) => r.s.avgBrightness).filter(Number.isFinite)) };
  });
  const colors = { bright: cssVar('--warning'), normal: cssVar('--primary'), dim: cssVar('--secondary') };
  barChart($('chart'), per.filter((p) => p.n).map((p) => ({ label: `${p.th} (n=${p.n})`, value: p.meanAcc * 100, error: p.sdAcc * 100, color: colors[p.k] })),
    { title: 'ความถูกต้องของการนับเฉลี่ย ± SD แยกตามระดับแสง', yMax: 100, yLabel: 'ความถูกต้อง (%)', xLabel: 'ระดับแสง', format: (v) => v.toFixed(1), emptyText: 'ยังไม่มีจำนวนที่ผู้สังเกตนับ' });
  $('tl').innerHTML = per.map((p) => `<tr><td>${p.th}</td><td class="n">${p.n}</td><td class="n">${pct(p.meanAcc)}</td><td class="n">${pct(p.sdAcc)}</td><td class="n">${Number.isFinite(p.mae) ? p.mae.toFixed(2) : '–'}</td><td class="n">${Number.isFinite(p.bright) ? p.bright.toFixed(0) : '–'}</td></tr>`).join('');
  const opt = (r) => `<option value="">—</option>${Object.entries(LIGHT_LEVELS).map(([k, th]) => `<option value="${k}" ${r.light === k ? 'selected' : ''}>${th}</option>`).join('')}`;
  $('tb').innerHTML = list.map((r) => `<tr data-id="${esc(r.s.id)}"><td>${new Date(r.s.startTime).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}${r.s.demoKind ? ' <span class="demo-flag">(จำลอง)</span>' : ''}</td>
    <td>${esc(r.s.userName)}</td><td>${GAME_TH[r.s.game] || esc(r.s.game)}</td><td class="n">${r.s.reps ?? '–'}</td><td class="n">${r.s.avgBrightness ?? '–'}</td>
    <td><select data-f="light" aria-label="ระดับแสง">${opt(r)}</select></td>
    <td class="n"><input data-f="observer" type="number" min="0" step="1" value="${r.obs ?? ''}" aria-label="จำนวนที่ผู้สังเกตนับ"></td>
    <td class="n">${pct(r.acc)}</td><td>${r.s.calib?.locked ? '🔒' : ''}</td></tr>`).join('') || '<tr><td colspan="9" class="muted">ยังไม่มีเซสชัน — เล่นเกมก่อน หรือกด "ใส่ตัวอย่าง"</td></tr>';
  $('tb').querySelectorAll('tr[data-id]').forEach((tr) => tr.querySelectorAll('[data-f]').forEach((el) => { el.onchange = () => saveRow(tr, el); }));
  window.__count = { all, per };
}

async function saveRow(tr, el) {
  const id = tr.dataset.id, e = { ...(store[id] || {}) };
  if (el.dataset.f === 'observer') { const v = el.value === '' ? null : Math.round(+el.value); if (v !== null && !(v >= 0)) return toast('กรอกจำนวนเต็ม ≥ 0', 'warning'); e.observer = v; }
  else e.light = el.value;
  if (!e.light) { const s = sessions.find((x) => x.id === id); e.light = lightFromBrightness(s?.avgBrightness); }
  e.at = Date.now(); store[id] = e;
  try { await saveCountStore(store); render(); } catch (err) { toast('บันทึกไม่สำเร็จ: ' + err.message, 'error', 6); }
}

$('csv').onclick = () => {
  const list = rows(); if (!list.length) return toast('ยังไม่มีข้อมูล', 'warning');
  downloadCSV('count-accuracy.csv', list.map((r) => ({
    session_id: r.s.id, user: r.s.userId, game: r.s.game, start: new Date(r.s.startTime).toISOString(), system_count: r.s.reps, observer_count: r.obs ?? '',
    abs_error: r.obs === null ? '' : Math.abs(r.s.reps - r.obs), accuracy_pct: Number.isFinite(r.acc) ? +(r.acc * 100).toFixed(2) : '',
    light_level: r.light, avg_brightness: r.s.avgBrightness ?? '', avg_fps: r.s.avgFps ?? '', calib_locked: r.s.calib?.locked ? 1 : 0, demo: r.s.demoKind || '' })));
};
$('mkDemo').onclick = async () => { const n = await makeCountDemo(); toast(`ใส่ตัวอย่าง ${n} เซสชัน (ห้ามใช้ในรายงาน)`, 'warning', 5); $('incDemo').checked = true; load(); };
$('rmDemo').onclick = async () => { const n = await clearResearchDemo('count'); toast(`ลบตัวอย่าง ${n} เซสชัน`, 'success'); load(); };
['game', 'lockedOnly', 'incDemo', 'onlyObs'].forEach((id) => { $(id).onchange = render; });
addEventListener('resize', () => render());
load();
