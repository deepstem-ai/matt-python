// ============================================================
// progress-page.js — หน้ากราฟพัฒนาการ (Lab 29)
//   การ์ด 4 ใบ · สรุปภาษาคน · กราฟเส้น 3 กราฟ (แตะจุดดูค่า) · ปฏิทิน 12 สัปดาห์ · กราฟแท่งแยกเกม · บันทึก PNG
// ============================================================
import { applyPrefs, savePrefs, loadPrefs, cssVar, esc, toast, modal, saveCanvasPNG } from './ui.js';
import { listSessionsByUser } from './db.js';
import { lineChart, barChart, heatmapCalendar } from './charts.js';
import { mountUserPicker, currentUid } from './user-picker.js';
import { generateDemoHistory, clearDemoHistory } from './demo-history.js';
import { dailyStats, lastDays, statCards, weeklySummary } from './progress-data.js';

applyPrefs();
const $ = (id) => document.getElementById(id);
const MIN_DAYS = 3;                                   // น้อยกว่านี้แสดงคำเชิญชวนแทนกราฟ
const GAME_TH = { 'star-portal': '⭐ จับดาว', 'rhythm-tap': '🎵 เคาะจังหวะ', 'spread-wall': '🐠 กางนิ้ว' };
let sessions = [], range = 30, charts = {};
try { range = +localStorage.getItem('hr-progress-days') || 30; } catch { /* ใช้ค่าเริ่มต้น */ }

// วันที่แบบสั้นภาษาไทย เช่น 27/9
const short = (k) => { const [, m, d] = k.split('-'); return `${+d}/${+m}`; };

$('lockedOnly').onchange = () => render();
async function load() {
  try { sessions = await listSessionsByUser(currentUid()); }
  catch (e) {
    $('summary').innerHTML = `<div class="alert"><h3>อ่านฐานข้อมูลไม่ได้</h3><p>${esc(e.message)}</p><button id="retry" class="btn-glow">↻ ลองใหม่</button></div>`;
    $('retry').onclick = load; return;
  }
  render();
}

function render() {
  const done = sessions.filter((s) => s.status !== 'in-progress' && (!$('lockedOnly').checked || s.calib?.locked));
  const daily = dailyStats(done), trainedDays = Object.keys(daily).length;
  $('dataNote').textContent = done.some((s) => s.details?.synthetic) ? 'มีข้อมูลจำลองปนอยู่ (ห้ามใช้เป็นผลวิจัยจริง)' : '';
  // ---- การ์ด 4 ใบ ----
  const c = statCards(done);
  $('cSessions').textContent = c.totalSessions;
  $('cWeekReps').textContent = c.weekReps;
  $('cSpread').textContent = c.bestSpread ? c.bestSpread.deg.toFixed(1) + '°' : '—';
  $('cSpreadAt').textContent = c.bestSpread ? `เมื่อ ${new Date(c.bestSpread.at).toLocaleDateString('th-TH')}` : 'ยังไม่ได้เล่นเกมกางนิ้ว';
  $('cStreak').textContent = '🔥 ' + c.streak.current;
  $('cStreakBest').textContent = `วัน · ดีที่สุด ${c.streak.best} วัน`;
  // ---- สรุปภาษาคน (คำนวณจากข้อมูลจริง) ----
  const w = weeklySummary(done);
  $('summary').innerHTML = `<h2>${esc(w.headline)}</h2>${w.lines.length ? `<ul>${w.lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>` : ''}
    <p class="muted" style="margin:8px 0 0">เทียบ 7 วันล่าสุดกับ 7 วันก่อนหน้า</p>`;
  // ---- ข้อมูลน้อยเกินไป → ชวนเริ่มฝึก ไม่แสดงกราฟว่าง ----
  const enough = trainedDays >= MIN_DAYS;
  $('empty').classList.toggle('hidden', enough); $('charts').classList.toggle('hidden', !enough);
  $('eDays').textContent = trainedDays;
  if (enough) drawCharts(daily, done);
}

function drawCharts(daily, done) {
  document.querySelectorAll('[data-days]').forEach((b) => b.classList.toggle('on', +b.dataset.days === range));
  const days = lastDays(range), trained = days.filter((k) => daily[k]);
  charts.reps = lineChart($('chReps'), days.map((k) => ({ label: short(k), value: daily[k]?.reps || 0 })),
    { title: `จำนวนท่าต่อวัน (${range} วันล่าสุด)`, xLabel: 'วันที่ (วัน/เดือน)', yLabel: 'ครั้ง', yMin: 0, color: cssVar('--primary') });   // ป้ายวันที่ถี่เกิน charts.js เว้นระยะเอง
  charts.acc = lineChart($('chAcc'), trained.map((k) => ({ label: short(k), value: Math.round(100 * daily[k].acc.reduce((a, b) => a + b, 0) / (daily[k].acc.length || 1)) })),
    { title: 'ความแม่นยำเฉลี่ยต่อวัน', xLabel: 'วันที่ฝึก (วัน/เดือน)', yLabel: 'ความแม่นยำ (%)', yMin: 0, yMax: 100, color: cssVar('--success'),
      lines: [{ value: 80, color: cssVar('--warning'), label: 'เป้าหมาย 80%' }], emptyText: 'ยังไม่มีข้อมูลในช่วงนี้ มาฝึกกันนะ' });
  const sp = trained.filter((k) => daily[k].maxSpread !== null);
  const vals = sp.map((k) => daily[k].maxSpread);
  const spLo = vals.length ? Math.max(0, Math.floor((Math.min(...vals) - 2) / 10) * 10) : 0;
  charts.spread = lineChart($('chSpread'), sp.map((k) => ({ label: short(k), value: +daily[k].maxSpread.toFixed(1) })),
    { title: 'มุมกางนิ้วสูงสุดต่อวัน', xLabel: 'วันที่ฝึกเกมกางนิ้ว (วัน/เดือน)', yLabel: 'องศา (°)', color: cssVar('--pink'),
      yMin: spLo, yMax: spLo + Math.max(20, Math.ceil((Math.max(...vals, spLo + 1) + 2 - spLo) / 20) * 20),   // ช่วงหาร 4 ลงตัว → ขีดแกนเป็นเลขกลม
      emptyText: 'ยังไม่ได้เล่นเกมกางนิ้วในช่วงนี้ ลองเล่นดูนะ 🐠' });
  const cal = {}; Object.entries(daily).forEach(([k, v]) => { cal[k] = v.sessions; });
  heatmapCalendar($('chCal'), cal, { weeks: 12, title: 'ปฏิทินความสม่ำเสมอ (จำนวนรอบต่อวัน)' });
  const from = new Date(); from.setHours(0, 0, 0, 0); from.setDate(from.getDate() - (range - 1));
  const byGame = {}; done.filter((s) => s.startTime >= from.getTime()).forEach((s) => { byGame[s.game] = (byGame[s.game] || 0) + (s.reps || 0); });
  barChart($('chGame'), Object.entries(GAME_TH).map(([g, th]) => ({ label: th, value: byGame[g] || 0 })),
    { title: `จำนวนท่าแยกตามเกม (${range} วัน)`, yLabel: 'ครั้ง', xLabel: 'เกม', emptyText: 'ยังไม่มีข้อมูล' });
}

// ---------- แตะจุดบนกราฟเส้น → แสดงค่า ----------
const UNIT = { reps: 'ครั้ง', acc: '%', spread: '°' }, NAME = { reps: 'จำนวนท่า', acc: 'ความแม่นยำ', spread: 'มุมกางนิ้ว' };
[['chReps', 'reps'], ['chAcc', 'acc'], ['chSpread', 'spread']].forEach(([id, key]) => {
  $(id).addEventListener('click', (e) => {
    const r = e.target.getBoundingClientRect(), hit = charts[key]?.hitTest(e.clientX - r.left, e.clientY - r.top);
    if (!hit) return;
    $('tip').textContent = `📍 ${NAME[key]} วันที่ ${hit.label}: ${hit.value} ${UNIT[key]}`;
    $('tip').classList.remove('hidden');
    window.__lastTip = $('tip').textContent;
  });
});

// ---------- ปุ่มต่าง ๆ ----------
document.querySelectorAll('[data-days]').forEach((b) => { b.onclick = () => { range = +b.dataset.days; try { localStorage.setItem('hr-progress-days', range); } catch { /* ไม่เป็นไร */ } render(); }; });
const paintProfile = () => document.querySelectorAll('[data-profile]').forEach((b) => b.classList.toggle('on', b.dataset.profile === loadPrefs().profile));
document.querySelectorAll('[data-profile]').forEach((b) => { b.onclick = () => { savePrefs({ profile: b.dataset.profile }); paintProfile(); render(); }; });
paintProfile();
$('savePng').onclick = async () => {
  const list = [['chReps', 'progress-1-reps-per-day'], ['chAcc', 'progress-2-accuracy-per-day'], ['chSpread', 'progress-3-max-spread-per-day'], ['chCal', 'progress-4-calendar-12-weeks'], ['chGame', 'progress-5-reps-by-game']];
  for (const [id, name] of list) { saveCanvasPNG($(id), `${name}.png`); await new Promise((r) => setTimeout(r, 350)); }   // เว้นจังหวะ เบราว์เซอร์จะไม่บล็อกการดาวน์โหลดหลายไฟล์
  toast('บันทึกกราฟ 5 รูปแล้ว (ดูในโฟลเดอร์ Downloads)', 'success', 4);
};
$('genDemo').onclick = async () => {
  $('genDemo').disabled = true;
  try { const r = await generateDemoHistory(currentUid()); toast(`สร้างข้อมูลจำลอง ${r.sessions} เซสชัน ${r.reps} ท่า`, 'success', 4); await load(); }
  catch (e) { toast('สร้างไม่สำเร็จ: ' + e.message, 'error', 5); }
  $('genDemo').disabled = false;
};
$('clearDemo').onclick = async () => {
  if (!await modal('<h2>ลบข้อมูลจำลอง?</h2><p>ลบเฉพาะข้อมูลที่มีป้าย "จำลอง" ของผู้เล่นนี้</p>', [{ label: 'ยกเลิก', value: false, cls: 'ghost' }, { label: '🧹 ลบ', value: true, cls: 'danger' }])) return;
  try { await clearDemoHistory(currentUid()); await load(); } catch (e) { toast('ลบไม่สำเร็จ: ' + e.message, 'error', 5); }
};
let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(render, 200); });
mountUserPicker($('picker'), load);
load();
