// ============================================================
// star-portal-page.js — หน้าเกมจับดาว: ต่อกล้อง ปุ่ม ตัวเลข การบันทึก และสรุปผล
// ============================================================
import { StarPortal } from './games/star-portal.js';
import {
  HandInput, releaseOnLeave, showOverlay, hideOverlay, pauseWithModal, RestReminder, restModal,
  CountUp, bindCalmButton, previousSessions, compare, machineInfo, FpsLog, userId, urlNumber,
} from './games/game-shell.js';
import { applyPrefs, modal, esc, toast } from './ui.js';
import { saveSession, saveRep, newId, getCurrentUser } from './db.js';
import { handInfo } from './hand.js';
import { loadCalibration, thresholdSnapshot } from './calibration.js';
import { mountUserPicker } from './user-picker.js';

applyPrefs();
const $ = (id) => document.getElementById(id);
const overlay = $('overlay');
const input = new HandInput($('video'), $('handCanvas'));
releaseOnLeave(input);
const REST_MIN = urlNumber('rest', 5);           // เตือนพักทุก 5 นาที (ทดสอบ: ?rest=0.1)
$('restMin').textContent = REST_MIN;
const ROUND_SEC = urlNumber('round', 60);       // วินาทีต่อรอบ (ทดสอบ: ?round=5)

const scoreNum = new CountUp($('score'));
const fpsLog = new FpsLog();
const game = new StarPortal($('game'), {
  readHand: () => input.read(),
  onTick: (dt) => { rest.update(dt); fpsLog.update(dt, game.engine.fps); },
  onHud: (s) => {
    scoreNum.set(s.score); $('combo').textContent = s.combo; $('pinches').textContent = s.pinches;
    $('time').textContent = Math.ceil(s.timeLeft); $('timeBar').style.width = (s.timeFrac * 100).toFixed(1) + '%';
  },
  onEnd: (sum) => finish(sum),
});
const rest = new RestReminder(REST_MIN, () => restModal(game.engine, REST_MIN));
const eng = game.engine;
game.roundSec = ROUND_SEC;
eng.sound.autoUnlock();
eng.fit();
window.addEventListener('resize', () => eng.fit());
eng.start();                                      // ฉากอวกาศขยับตั้งแต่เปิดหน้า
setInterval(() => scoreNum.tick(0.1), 100);      // ตัวเลขคะแนนไต่ขึ้นทีละนิด
window.__game = game;                             // ให้สคริปต์ทดสอบเข้าถึงได้
bindCalmButton($('calmBtn'), eng);
const showWho = () => getCurrentUser().then((u) => { $('who').textContent = u ? `${u.firstName || ''} ${u.lastName || ''}` : 'guest (ยังไม่ล็อกอิน)'; }).catch(() => {});
showWho();

// ---------------- Lab 27: โหลดค่าปรับเทียบอัตโนมัติ (ตอนเปิดหน้า เปลี่ยนผู้เล่น และก่อนเริ่มรอบ) ----------------
const LEVEL_TH = ['ไม่สั่น', 'สั่นเล็กน้อย', 'สั่นปานกลาง', 'สั่นมาก'];
async function applyCalibration() {
  const cal = await loadCalibration(userId(), 'pinch');
  game.applyCalibration(cal);
  $('radiusRange').value = game.grabRadius; $('radiusVal').textContent = game.grabRadius;
  $('calInfo').textContent = cal ? `${LEVEL_TH[cal.tremorLevel]} · รัศมี ${cal.grabRadius} px · จีบ ≤ ${cal.entry.toFixed(2)} / ปล่อย ≥ ${cal.exit.toFixed(2)}${cal.locked ? ' · 🔒 ตรึงเกณฑ์' : ''}` : 'ยังไม่ปรับเทียบ (ใช้ค่ามาตรฐาน)';
  return cal;
}
applyCalibration();
mountUserPicker($('picker'), () => { showWho(); applyCalibration(); });
$('filterChk').onchange = (e) => { game.filterOn = e.target.checked; game.filter.reset(); };
const setShake = (lv) => { game.shakeLevel = lv; $('shakeSel').value = lv; $('shakeBadge').classList.toggle('hidden', !lv); };
$('shakeSel').onchange = (e) => { setShake(+e.target.value); if (+e.target.value && game.source !== 'mouse') toast('อาการสั่นจำลองใช้กับโหมดสาธิต (เมาส์)', 'warning'); };
setShake(urlNumber('shake', 0));

// ---------------- โหมดสาธิตด้วยเมาส์ ----------------
const cv = $('game');
const setMouse = (e) => { const r = cv.getBoundingClientRect(); game.mouse.x = e.clientX - r.left; game.mouse.y = e.clientY - r.top; game.mouse.inside = true; };
cv.addEventListener('pointermove', setMouse);
cv.addEventListener('pointerdown', (e) => { setMouse(e); game.mouse.down = true; cv.setPointerCapture?.(e.pointerId); });
cv.addEventListener('pointerup', (e) => { setMouse(e); game.mouse.down = false; });
cv.addEventListener('pointerleave', () => { game.mouse.inside = false; game.mouse.down = false; });

function setSource(src) {
  game.source = src;
  $('demoBadge').classList.toggle('hidden', src !== 'mouse');
  $('camBox').classList.toggle('hidden', src !== 'hand');
  $('modeBtn').textContent = src === 'mouse' ? '📷 ใช้กล้อง' : '🖱 โหมดสาธิต';
}
$('modeBtn').onclick = () => {
  if (game.source === 'mouse') { if (input.ready) setSource('hand'); else startCamera(); }
  else setSource('mouse');
};

// ---------------- เริ่มกล้อง (ห้ามปล่อยจอว่าง ทุกความผิดพลาดมีข้อความ + ปุ่ม) ----------------
async function startCamera() {
  eng.pause();
  showOverlay(overlay, '<h2>📷 กำลังเปิดกล้องและโหลดโมเดลมือ…</h2><p id="prog" class="muted">รอสักครู่ ครั้งแรกอาจใช้เวลา 10-30 วินาที</p>');
  try {
    await input.start((p) => { const el = $('prog'); if (el && typeof p === 'number') el.textContent = `ดาวน์โหลดโมเดล ${Math.round(p * 100)}%`; });
    setSource('hand');
    ready();
  } catch (e) {
    showOverlay(overlay, `<div class="alert"><h2>⚠️ ${esc(e.message)}</h2><p>${esc(e.detail || '')}</p></div>`, [
      { label: '↻ ลองอีกครั้ง', onClick: startCamera },
      { label: '🖱 เล่นโหมดสาธิต (เมาส์)', cls: 'ghost', onClick: () => { setSource('mouse'); ready(); } },
    ]);
  }
}
function ready() {
  eng.resume();
  const how = game.source === 'mouse'
    ? 'เลื่อนเมาส์ = ปลายนิ้วชี้ · กดปุ่มเมาส์ค้าง = จีบนิ้ว'
    : 'ยกมือให้กล้องเห็น ปลายนิ้วชี้คือวงกลมบนจอ · แตะนิ้วโป้งกับนิ้วชี้ = จีบ';
  showOverlay(overlay, `<h2>พร้อมแล้ว!</h2><p>${how}</p><p>จีบดาว ⭐ ลากไปปล่อยในประตูมิติ 🌀 ภายใน ${ROUND_SEC} วินาที</p>`, [
    { label: `▶ เริ่มรอบ ${ROUND_SEC} วินาที`, cls: 'success', onClick: play },
  ]);
}
async function play() {
  hideOverlay(overlay);
  await applyCalibration();                       // โหลดค่าล่าสุดทุกครั้งก่อนเริ่มรอบ
  game.level = $('levelSel').value;
  scoreNum.reset(0); fpsLog.samples = [];
  game.startRound();
  if (eng.paused) eng.resume();
}

// หน้าจอแรก
showOverlay(overlay, `<h2>⭐ จับดาวใส่ประตูมิติ</h2>
  <p>ฝึก <b>การจีบนิ้ว</b> (นิ้วโป้งแตะนิ้วชี้) ช่วยการหยิบของชิ้นเล็ก กลัดกระดุม หยิบยาเม็ด</p>
  <ol><li>ชี้ปลายนิ้วไปที่ดาว</li><li>จีบนิ้วค้างไว้เพื่อจับ</li><li>ลากไปที่ประตูมิติแล้วปล่อย</li></ol>`, [
  { label: '📷 เริ่มด้วยกล้อง', onClick: startCamera },
  { label: '🖱 โหมดสาธิต (เมาส์)', cls: 'ghost', onClick: () => { setSource('mouse'); ready(); } },
]);

// ---------------- ปุ่มหยุดพัก (ใช้ได้ตลอดเวลา) ----------------
$('pauseBtn').onclick = () => pauseWithModal(eng);
window.addEventListener('keydown', (e) => { if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') pauseWithModal(eng); });
document.addEventListener('visibilitychange', () => { if (document.hidden && game.round?.active) pauseWithModal(eng); });
$('levelSel').onchange = (e) => { if (!game.round?.active) game.level = e.target.value; else toast('ความยากใหม่จะใช้ในรอบถัดไป', 'warning'); };
$('radiusRange').oninput = (e) => { game.grabRadius = +e.target.value; $('radiusVal').textContent = e.target.value; };

// ---------------- จบรอบ: บันทึก + สรุป ----------------
async function finish(sum) {
  const prev = (await previousSessions('star-portal'))[0];   // ครั้งก่อน (อ่านก่อนบันทึกครั้งนี้)
  const session = {
    id: newId('s_'), userId: userId(), game: 'star-portal', startTime: sum.startTime, endTime: sum.endTime,
    reps: sum.pinches, accuracy: +sum.accuracy.toFixed(3), score: sum.score, avgFps: fpsLog.avg,
    delegate: game.source === 'mouse' ? 'demo-mouse' : handInfo().delegate, machine: machineInfo(),
    details: { level: sum.level, grabRadius: game.grabRadius, calibrated: !!game.cal, tremorLevel: game.cal?.tremorLevel ?? null,
      thresholds: thresholdSnapshot(game.cal),   // snapshot เกณฑ์ที่ใช้รอบนี้ (สมการ 3, 7, 8) + ตรึงไว้หรือไม่ filterOn: game.filterOn, shakeLevel: game.shakeLevel, attempts: sum.attempts, successes: sum.successes,
      bestCombo: sum.bestCombo, avgStarMs: Math.round(sum.avgStarMs), starTimes: sum.starTimes, demo: game.source === 'mouse' },
  };
  const status = await save(session, sum.reps);
  const pd = prev?.details || {};
  const html = `<h2>🏁 จบรอบ!</h2>
    <div class="summary-grid">
      <div class="stat"><small>คะแนน</small><b>${sum.score}</b></div>
      <div class="stat"><small>จีบนิ้ว (ครั้ง)</small><b>${sum.pinches}</b></div>
      <div class="stat"><small>ความแม่นยำ</small><b>${Math.round(sum.accuracy * 100)}%</b></div>
      <div class="stat"><small>เวลาเฉลี่ยต่อดาว</small><b>${sum.avgStarMs ? (sum.avgStarMs / 1000).toFixed(1) + ' วิ' : '—'}</b></div>
      <div class="stat"><small>คอมโบสูงสุด</small><b>${sum.bestCombo}</b></div>
    </div>
    <h3>เทียบกับครั้งก่อน</h3>
    <table class="data"><tr><th>ค่า</th><th>ครั้งนี้</th><th>ครั้งก่อน</th><th>เปลี่ยนแปลง</th></tr>
      <tr><td>คะแนน</td><td>${sum.score}</td><td>${prev ? prev.score : '—'}</td><td>${compare(sum.score, prev?.score)}</td></tr>
      <tr><td>จีบนิ้ว</td><td>${sum.pinches}</td><td>${prev ? prev.reps : '—'}</td><td>${compare(sum.pinches, prev?.reps)}</td></tr>
      <tr><td>ความแม่นยำ %</td><td>${Math.round(sum.accuracy * 100)}</td><td>${prev ? Math.round(prev.accuracy * 100) : '—'}</td><td>${compare(sum.accuracy * 100, prev ? prev.accuracy * 100 : null)}</td></tr>
      <tr><td>วิ/ดาว (น้อย = ดี)</td><td>${(sum.avgStarMs / 1000).toFixed(1)}</td><td>${pd.avgStarMs ? (pd.avgStarMs / 1000).toFixed(1) : '—'}</td><td>${compare(sum.avgStarMs / 1000, pd.avgStarMs ? pd.avgStarMs / 1000 : null, false, ' วิ', 1)}</td></tr>
    </table>
    <p class="${status.ok ? 'up' : 'down'}" style="margin-top:12px">${status.ok ? `💾 บันทึกลงฐานข้อมูลแล้ว (เซสชัน + ${sum.reps.length} ครั้งที่จีบ)` : '⚠️ บันทึกไม่สำเร็จ: ' + esc(status.error)}</p>`;
  const buttons = [{ label: '▶ เล่นอีกรอบ', value: 'again', cls: 'success' }, { label: 'ปิด', value: 'close', cls: 'ghost' }];
  if (!status.ok) buttons.splice(1, 0, { label: '↻ ลองบันทึกอีกครั้ง', value: 'retry' });
  let choice = await modal(html, buttons);
  while (choice === 'retry') {
    const s2 = await save(session, sum.reps);
    choice = await modal(s2.ok ? '<h2>💾 บันทึกสำเร็จ</h2>' : `<h2>⚠️ ยังบันทึกไม่ได้</h2><p>${esc(s2.error)}</p>`,
      s2.ok ? [{ label: '▶ เล่นอีกรอบ', value: 'again', cls: 'success' }, { label: 'ปิด', value: 'close', cls: 'ghost' }]
        : [{ label: '↻ ลองอีกครั้ง', value: 'retry' }, { label: 'ปิด', value: 'close', cls: 'ghost' }]);
  }
  if (choice === 'again') play(); else ready();
}

// บันทึกเซสชัน และบันทึกทุกครั้งที่จีบ (reps) ผูกกับเซสชัน
async function save(session, reps) {
  try {
    await saveSession(session);
    for (const r of reps) {
      await saveRep({ sessionId: session.id, userId: session.userId, game: 'star-portal', gesture: 'pinch',
        n: r.n, t: Math.round(r.t), peak: r.peak, holdMs: r.holdMs, quality: r.quality, scored: r.scored });
    }
    window.__lastSession = session;
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message || String(e) }; }
}
