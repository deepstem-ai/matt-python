// ============================================================
// spread-wall-page.js — หน้าเกมกางนิ้ว: กล้อง/โหมดสาธิต ปรับเทียบ ตัวเลข สถิติ บันทึก สรุปผล
// ============================================================
import { SpreadWall } from './games/spread-wall.js';
import { runCalibration, loadCalibration, saveCalibration } from './games/spread-calibrate.js';
import {
  HandInput, releaseOnLeave, showOverlay, hideOverlay, pauseWithModal, RestReminder, restModal,
  bindCalmButton, previousSessions, compare, machineInfo, FpsLog, userId, urlNumber,
} from './games/game-shell.js';
import { applyPrefs, modal, esc, toast } from './ui.js';
import { newId, getCurrentUser, getSettings, saveSettings } from './db.js';
import { handInfo } from './hand.js';
import { setupJuice } from './juice-page.js';
import { SessionRecorder } from './recorder.js';
import { askFeeling } from './feeling.js';

applyPrefs();
const $ = (id) => document.getElementById(id);
const overlay = $('overlay');
const input = new HandInput($('video'), $('handCanvas'));
releaseOnLeave(input);
const REST_MIN = urlNumber('rest', 5);
$('restMin').textContent = REST_MIN;
const fpsLog = new FpsLog();
let prevSessions = [];

const game = new SpreadWall($('game'), {
  readHand: () => input.read(),
  onTick: (dt) => { rest.update(dt); fpsLog.update(dt, game.engine.fps); },
  onHud: (s) => {
    $('energy').textContent = s.energy; $('energyBar').style.width = s.energy + '%';
    fx.juice.score.set(s.score); $('level').textContent = s.level; $('maxDeg').textContent = s.maxDeg.toFixed(1);
  },
  // ทำลายสถิติเดิมระหว่างเล่น → ป้ายลอยแสดงความยินดี
  onRecord: (diff) => toast(`🏆 สถิติใหม่! วันนี้คุณกางนิ้วได้มากกว่าครั้งก่อน ${diff.toFixed(1)} องศา`, 'success', 3),
  onLevel: (lv) => toast(`🌊 ระดับ ${lv}: กำแพงเร็วขึ้น ช่องเผื่อแคบลง`, 'warning', 2),
  onRep: (r) => rec.rep(r),                         // Lab 28: บันทึกทุกกำแพงทันที
  onEnd: (sum) => finish(sum),
});
const rec = new SessionRecorder({ game: 'spread-wall', userId, video: $('video'), getFps: () => game.engine.fps, isDemo: () => game.source === 'demo', isPaused: () => game.engine.paused });
const rest = new RestReminder(REST_MIN, () => { fx.notePause(); restModal(game.engine, REST_MIN); });
const eng = game.engine;
eng.sound.autoUnlock();
eng.fit();
window.addEventListener('resize', () => eng.fit());
eng.start();
window.__game = game;
// Lab 26: คอมโบ คะแนนไต่ขึ้น ความสำเร็จ streak
const fx = setupJuice({ engine: eng, gameKey: 'spread-wall', host: document.querySelector('.game-area'), scoreEl: $('score') });
game.juice = fx.juice;
bindCalmButton($('calmBtn'), eng);
getCurrentUser().then((u) => { $('who').textContent = u ? `${u.firstName || ''} ${u.lastName || ''}` : 'guest (ยังไม่ล็อกอิน)'; }).catch(() => {});
setInterval(() => { $('deg').textContent = game.deg === null ? '—' : game.deg.toFixed(1); }, 150);

// ---------------- โหมดสาธิต: ล้อเมาส์ / แถบเลื่อน = มุมกางนิ้ว ----------------
const setDemoDeg = (v) => { game.demoDeg = Math.max(0, Math.min(60, v)); $('demoRange').value = game.demoDeg; $('demoVal').textContent = game.demoDeg.toFixed(1); };
$('demoRange').oninput = (e) => setDemoDeg(+e.target.value);
$('game').addEventListener('wheel', (e) => { if (game.source !== 'demo') return; e.preventDefault(); setDemoDeg(game.demoDeg + (e.deltaY < 0 ? 2 : -2)); }, { passive: false });
$('sensRange').oninput = (e) => { game.sens = +e.target.value; $('sensVal').textContent = game.sens.toFixed(2); };
$('practiceChk').onchange = (e) => { game.practice = e.target.checked; };
function setSource(src) {
  game.source = src; game.deg = null;
  $('demoBadge').classList.toggle('hidden', src !== 'demo');
  $('demoBox').classList.toggle('hidden', src !== 'demo');
  $('camBox').classList.toggle('hidden', src !== 'hand');
  $('modeBtn').textContent = src === 'demo' ? '📷 ใช้กล้อง' : '🖱 โหมดสาธิต';
}
$('modeBtn').onclick = () => {
  if (game.round?.active) return toast('จบเกมก่อน แล้วค่อยสลับโหมด (ต้องปรับเทียบใหม่)', 'warning');
  if (game.source === 'demo') { if (input.ready) { setSource('hand'); ready(); } else startCamera(); } else { setSource('demo'); ready(); }
};

// ---------------- กล้อง ----------------
async function startCamera() {
  showOverlay(overlay, '<h2>📷 กำลังเปิดกล้องและโหลดโมเดลมือ…</h2><p id="prog" class="muted">รอสักครู่ ครั้งแรกอาจใช้เวลา 10-30 วินาที</p>');
  try {
    await input.start((p) => { const el = $('prog'); if (el && typeof p === 'number') el.textContent = `ดาวน์โหลดโมเดล ${Math.round(p * 100)}%`; });
    setSource('hand'); ready();
  } catch (e) {
    showOverlay(overlay, `<div class="alert"><h2>⚠️ ${esc(e.message)}</h2><p>${esc(e.detail || '')}</p></div>`, [
      { label: '↻ ลองอีกครั้ง', onClick: startCamera },
      { label: '🖱 เล่นโหมดสาธิต (ล้อเมาส์)', cls: 'ghost', onClick: () => { setSource('demo'); ready(); } },
    ]);
  }
}

// ---------------- เตรียมเล่น: โหลดสถิติเดิม + ค่าปรับเทียบ ----------------
async function ready() {
  prevSessions = await previousSessions('spread-wall');
  const best = prevSessions.map((s) => s.maxSpreadDeg).filter(Number.isFinite);
  game.prevBest = best.length ? Math.max(...best) : null;
  $('prevBest').textContent = game.prevBest === null ? '—' : game.prevBest.toFixed(1);
  const cal = await loadCalibration(userId());
  // ค่าปรับเทียบจากกล้องใช้กับโหมดสาธิตไม่ได้ (หน่วยต่างกัน) จึงเช็กแหล่งที่มาด้วย
  if (cal && cal.source === game.source) {
    showOverlay(overlay, `<h2>🎯 พบค่าปรับเทียบของคุณ</h2><p>หุบนิ้ว ${cal.min}° · กางสุด ${cal.max}° (วัดเมื่อ ${new Date(cal.at).toLocaleDateString('th-TH')})</p>`, [
      { label: '▶ ใช้ค่านี้ เริ่มเล่น', cls: 'success', onClick: () => { useCalib(cal); play(); } },
      { label: '🎯 ปรับเทียบใหม่', cls: 'ghost', onClick: calibrate },
    ]);
  } else calibrate();
}
function useCalib(c) { game.calib = { min: c.min, max: c.max }; $('calInfo').textContent = `${c.min}°–${c.max}°`; }
async function calibrate() {
  if (game.round?.active) game.endRound();
  const c = await runCalibration(overlay, game);
  if (!c) return ready();
  try { useCalib(await saveCalibration(userId(), c, game.source)); toast('บันทึกค่าปรับเทียบแล้ว', 'success'); }
  catch (e) { useCalib({ min: +c.min.toFixed(1), max: +c.max.toFixed(1) }); toast('บันทึกค่าปรับเทียบไม่สำเร็จ (ใช้ชั่วคราวได้): ' + e.message, 'error', 5); }
  showOverlay(overlay, `<h2>✅ ปรับเทียบเสร็จ</h2><p>หุบนิ้ว ${game.calib.min}° · กางสุด ${game.calib.max}°</p>
    <p>กางนิ้วให้ปลายนิ้วอยู่ใน <b>แถบสีเขียว</b> ของช่องกำแพง · กว้างไปหรือแคบไปจะชน</p>`, [{ label: '▶ เริ่มเล่น', cls: 'success', onClick: play }]);
}
function play() { hideOverlay(overlay); fx.juice.reset(); fpsLog.samples = []; game.startRound(); rec.start({ calibration: game.calib, sensitivity: game.sens, practice: game.practice }); if (eng.paused) eng.resume(); }
$('recalBtn').onclick = () => { if (game.source === 'hand' && !input.ready) return startCamera(); calibrate(); };
$('endBtn').onclick = () => game.endRound();

showOverlay(overlay, `<h2>🐠 กางนิ้วผ่านกำแพง</h2>
  <p>ฝึก <b>การเหยียดและกางนิ้ว</b> ช่วยการหยิบของชิ้นใหญ่ รับลูกบอล วางมือบนแป้นพิมพ์</p>
  <p>เริ่มด้วยการปรับเทียบสั้น ๆ 2 ขั้น (หุบนิ้ว / กางสุด) เพื่อให้เกมพอดีกับมือของคุณ</p>`, [
  { label: '📷 เริ่มด้วยกล้อง', onClick: startCamera },
  { label: '🖱 โหมดสาธิต (ล้อเมาส์)', cls: 'ghost', onClick: () => { setSource('demo'); ready(); } },
]);
const userPause = () => { if (game.round?.active && !eng.paused) fx.notePause(); pauseWithModal(eng); };
$('pauseBtn').onclick = userPause;
window.addEventListener('keydown', (e) => { if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') userPause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && game.round?.active) pauseWithModal(eng); });

// ---------------- จบเกม: เทียบสถิติ + บันทึก ----------------
async function finish(sum) {
  const uid = userId(), prevBest = game.prevBest, last = prevSessions[0];
  const diff = prevBest === null ? null : sum.maxSpreadDeg - prevBest;
  const session = {
    id: newId('s_'), userId: uid, game: 'spread-wall', startTime: sum.startTime, endTime: sum.endTime,
    reps: sum.walls, accuracy: +sum.accuracy.toFixed(3), score: sum.score, maxSpreadDeg: sum.maxSpreadDeg, avgFps: fpsLog.avg,
    delegate: game.source === 'demo' ? 'demo-wheel' : handInfo().delegate, machine: machineInfo(),
    details: { calibration: game.calib, sensitivity: game.sens, practice: game.practice, passed: sum.passed, hits: sum.hits,
      levelReached: sum.level, prevBestDeg: prevBest, demo: game.source === 'demo' },
  };
  let status = { ok: true };
  try {
    // Lab 28: ปิดเซสชันผ่านตัวบันทึก (กำแพงแต่ละด่านถูกบันทึกไปแล้วระหว่างเล่น)
    const res = await rec.finish({ reps: session.reps, accuracy: session.accuracy, score: session.score, maxSpreadDeg: session.maxSpreadDeg, details: { ...session.details, machineInfo: session.machine } });
    if (!res.ok) throw new Error(res.error);
    Object.assign(session, res.session);
    // เก็บค่าสูงสุดรายวันไว้ให้ Lab 29 วาดกราฟพัฒนาการได้ง่าย
    const key = 'spread-daily:' + uid, daily = await getSettings(key), d = new Date(sum.startTime);
    const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; // วันตามเวลาท้องถิ่น
    daily[day] = Math.max(daily[day] || 0, sum.maxSpreadDeg);
    await saveSettings(key, daily);
    window.__lastSession = session;
  } catch (e) { status = { ok: false, error: e.message || String(e) }; }
  // ความสำเร็จ: ส่งสถิติเดิม (ก่อนรอบนี้) ไปเทียบ เพื่อดูว่าทำลายสถิติไหม
  if (status.ok) fx.endSession({ summary: sum, stats: { prevBestSpread: prevBest } });

  const headline = diff === null ? `ครั้งแรกของคุณ! มุมกางสูงสุดวันนี้ ${sum.maxSpreadDeg}° จะเป็นสถิติตั้งต้น`
    : diff > 0 ? `🎉 วันนี้คุณกางนิ้วได้มากกว่าครั้งก่อน ${diff.toFixed(1)} องศา`
      : `วันนี้กางได้ ${sum.maxSpreadDeg}° (สถิติเดิม ${prevBest}°) ค่อย ๆ ฝึกทุกวัน ไม่ต้องฝืนนะ`;
  const choice = await modal(`<h2>${game.round.energy <= 0 ? '💧 พลังหมดแล้ว' : '🏁 จบเกม'}</h2>
    <p style="font-size:var(--fs-lg);font-weight:800">${headline}</p>
    <div class="summary-grid">
      <div class="stat"><small>มุมกางสูงสุด</small><b>${sum.maxSpreadDeg}°</b></div>
      <div class="stat"><small>ผ่านกำแพง</small><b>${sum.passed}/${sum.walls}</b></div>
      <div class="stat"><small>ความแม่นยำ</small><b>${Math.round(sum.accuracy * 100)}%</b></div>
      <div class="stat"><small>คะแนน</small><b>${sum.score}</b></div>
      <div class="stat"><small>ระดับที่ไปถึง</small><b>${sum.level}</b></div>
    </div>
    <table class="data"><tr><th>ค่า</th><th>ครั้งนี้</th><th>ครั้งก่อน</th><th>เปลี่ยนแปลง</th></tr>
      <tr><td>มุมกางสูงสุด (°)</td><td>${sum.maxSpreadDeg}</td><td>${last?.maxSpreadDeg ?? '—'}</td><td>${compare(sum.maxSpreadDeg, last?.maxSpreadDeg, true, '°', 1)}</td></tr>
      <tr><td>สถิติดีที่สุดเดิม (°)</td><td>${sum.maxSpreadDeg}</td><td>${prevBest ?? '—'}</td><td>${compare(sum.maxSpreadDeg, prevBest, true, '°', 1)}</td></tr>
      <tr><td>ความแม่นยำ %</td><td>${Math.round(sum.accuracy * 100)}</td><td>${last ? Math.round(last.accuracy * 100) : '—'}</td><td>${compare(sum.accuracy * 100, last ? last.accuracy * 100 : null)}</td></tr>
    </table>
    <p class="muted">ค่าปรับเทียบ ${game.calib.min}°–${game.calib.max}° · ความไว ${game.sens.toFixed(2)}${game.practice ? ' · โหมดฝึก' : ''}</p>
    <p class="${status.ok ? 'up' : 'down'}">${status.ok ? `💾 บันทึกแล้ว (เซสชัน + ${sum.log.length} กำแพง + สถิติรายวัน)` : '⚠️ บันทึกไม่สำเร็จ: ' + esc(status.error)}</p>`,
  [{ label: '▶ เล่นอีกครั้ง', value: 'again', cls: 'success' }, { label: 'ปิด', value: 'close', cls: 'ghost' }]);
  if (status.ok) {                                   // สถิติใหม่ใช้เทียบในรอบถัดไป
    prevSessions.unshift(session);
    game.prevBest = Math.max(prevBest ?? -Infinity, sum.maxSpreadDeg);
    $('prevBest').textContent = game.prevBest.toFixed(1);
  }
  if (status.ok) await askFeeling(session.id);
  if (choice === 'again') play();
  else showOverlay(overlay, '<h2>พักก่อนนะ 🌿</h2>', [{ label: '▶ เล่นอีกครั้ง', cls: 'success', onClick: play }, { label: '🎯 ปรับเทียบใหม่', cls: 'ghost', onClick: calibrate }]);
}
