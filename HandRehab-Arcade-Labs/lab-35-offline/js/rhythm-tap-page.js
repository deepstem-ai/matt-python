// ============================================================
// rhythm-tap-page.js — หน้าเกมเคาะจังหวะ: กล้อง/คีย์บอร์ด ปุ่ม ตัวเลข การบันทึก และรายงานท้ายรอบ
// ============================================================
import { RhythmTap } from './games/rhythm-tap.js';
import {
  HandInput, releaseOnLeave, showOverlay, hideOverlay, pauseWithModal, RestReminder, restModal,
  CountUp, bindCalmButton, previousSessions, compare, machineInfo, FpsLog, userId, urlNumber,
} from './games/game-shell.js';
import { applyPrefs, modal, esc, toast } from './ui.js';
import { saveSession, saveRep, newId, getCurrentUser } from './db.js';
import { handInfo, FINGER_NAMES, FINGER_TH } from './hand.js';
import { barChart, mean, sd } from './charts.js';

applyPrefs();
const $ = (id) => document.getElementById(id);
const overlay = $('overlay');
const input = new HandInput($('video'), $('handCanvas'));
releaseOnLeave(input);
const REST_MIN = urlNumber('rest', 5), ROUND_SEC = urlNumber('round', 60);
$('restMin').textContent = REST_MIN;

const scoreNum = new CountUp($('score'));
const fpsLog = new FpsLog();
const game = new RhythmTap($('game'), {
  readHand: () => input.read(),
  onTick: (dt) => { rest.update(dt); fpsLog.update(dt, game.engine.fps); },
  onHud: (s) => {
    scoreNum.set(s.score); $('level').textContent = s.level; $('streak').textContent = s.streak; $('misses').textContent = s.misses;
    $('time').textContent = Math.ceil(s.timeLeft); $('timeBar').style.width = (s.timeFrac * 100).toFixed(1) + '%';
  },
  onLevel: (lv, d) => toast(d > 0 ? `🚀 เร็วขึ้น! ระดับ ${lv}` : `🐢 ช้าลงหน่อย ระดับ ${lv}`, d > 0 ? 'success' : 'warning', 2),
  onEnd: (sum) => finish(sum),
});
game.roundSec = ROUND_SEC;
const rest = new RestReminder(REST_MIN, () => restModal(game.engine, REST_MIN));
const eng = game.engine;
eng.sound.autoUnlock();
eng.fit();
window.addEventListener('resize', () => eng.fit());
eng.start();
setInterval(() => scoreNum.tick(0.1), 100);
window.__game = game;
bindCalmButton($('calmBtn'), eng);
getCurrentUser().then((u) => { $('who').textContent = u ? `${u.firstName || ''} ${u.lastName || ''}` : 'guest (ยังไม่ล็อกอิน)'; }).catch(() => {});

// ---------------- โหมดสาธิต: ปุ่ม 1-5 หรือคลิกที่แป้น ----------------
window.addEventListener('keydown', (e) => {
  if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') return pauseWithModal(eng);
  if (game.source === 'keys' && e.key >= '1' && e.key <= '5') game.tap(+e.key - 1);
});
$('game').addEventListener('pointerdown', (e) => {
  if (game.source !== 'keys') return;
  const r = $('game').getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
  const pad = game.pads.find((p) => Math.hypot(p.x - x, p.y - y) <= p.r);
  if (pad) game.tap(pad.i);
});
function setSource(src) {
  game.source = src;
  $('demoBadge').classList.toggle('hidden', src !== 'keys');
  $('camBox').classList.toggle('hidden', src !== 'hand');
  $('modeBtn').textContent = src === 'keys' ? '📷 ใช้กล้อง' : '⌨ โหมดสาธิต';
}
$('modeBtn').onclick = () => { if (game.source === 'keys') { if (input.ready) setSource('hand'); else startCamera(); } else setSource('keys'); };

// ---------------- กล้อง (ทุกความผิดพลาดมีข้อความ + ปุ่ม) ----------------
async function startCamera() {
  eng.pause();
  showOverlay(overlay, '<h2>📷 กำลังเปิดกล้องและโหลดโมเดลมือ…</h2><p id="prog" class="muted">รอสักครู่ ครั้งแรกอาจใช้เวลา 10-30 วินาที</p>');
  try {
    await input.start((p) => { const el = $('prog'); if (el && typeof p === 'number') el.textContent = `ดาวน์โหลดโมเดล ${Math.round(p * 100)}%`; });
    setSource('hand'); ready();
  } catch (e) {
    showOverlay(overlay, `<div class="alert"><h2>⚠️ ${esc(e.message)}</h2><p>${esc(e.detail || '')}</p></div>`, [
      { label: '↻ ลองอีกครั้ง', onClick: startCamera },
      { label: '⌨ เล่นโหมดสาธิต (คีย์บอร์ด)', cls: 'ghost', onClick: () => { setSource('keys'); ready(); } },
    ]);
  }
}
function ready() {
  eng.resume();
  const how = game.source === 'keys' ? 'กดปุ่ม 1-5 (1 = โป้ง … 5 = ก้อย) หรือคลิกแป้นที่สว่าง'
    : 'หันฝ่ามือเข้ากล้อง นิ้วเหยียดตรง แล้วงอเฉพาะนิ้วที่แป้นสว่างลงแล้วยกกลับ';
  showOverlay(overlay, `<h2>พร้อมแล้ว!</h2><p>${how}</p>`, [{ label: `▶ เริ่มรอบ ${ROUND_SEC} วินาที`, cls: 'success', onClick: play }]);
}
function play() { hideOverlay(overlay); scoreNum.reset(0); fpsLog.samples = []; game.startRound(); if (eng.paused) eng.resume(); }

showOverlay(overlay, `<h2>🎵 เคาะจังหวะทีละนิ้ว</h2>
  <p>ฝึก <b>การขยับนิ้วแยกทีละนิ้ว</b> ช่วยการกดแป้นพิมพ์ กดปุ่มโทรศัพท์ นับเงิน</p>
  <p>แป้นไหนสว่าง ให้งอนิ้วนั้นลงแล้วยกกลับ ท้ายรอบจะบอกว่านิ้วไหนตอบสนองช้าที่สุด</p>`, [
  { label: '📷 เริ่มด้วยกล้อง', onClick: startCamera },
  { label: '⌨ โหมดสาธิต (คีย์บอร์ด 1-5)', cls: 'ghost', onClick: () => { setSource('keys'); ready(); } },
]);
$('pauseBtn').onclick = () => pauseWithModal(eng);
document.addEventListener('visibilitychange', () => { if (document.hidden && game.round?.active) pauseWithModal(eng); });

// ---------------- จบรอบ: รายงาน + บันทึก ----------------
async function finish(sum) {
  const prev = (await previousSessions('rhythm-tap'))[0];
  const stats = FINGER_NAMES.map((f) => ({ f, n: sum.reactionTimes[f].length, m: mean(sum.reactionTimes[f]), s: sd(sum.reactionTimes[f]) }));
  const withData = stats.filter((s) => s.n > 0);
  const slow = withData.length ? withData.reduce((a, b) => (b.m > a.m ? b : a)) : null;
  const fast = withData.length ? withData.reduce((a, b) => (b.m < a.m ? b : a)) : null;
  const allRt = FINGER_NAMES.flatMap((f) => sum.reactionTimes[f]);
  const meanRt = Math.round(mean(allRt));
  // นิ้วที่ถูกสับสนบ่อยที่สุด (นอกเส้นทแยง)
  let worst = null;
  for (const a of FINGER_NAMES) for (const b of FINGER_NAMES) if (sum.confusion[a][b] && (!worst || sum.confusion[a][b] > worst.n)) worst = { a, b, n: sum.confusion[a][b] };

  const session = {
    id: newId('s_'), userId: userId(), game: 'rhythm-tap', startTime: sum.startTime, endTime: sum.endTime,
    reps: sum.correct, accuracy: +sum.accuracy.toFixed(3), score: sum.score, avgFps: fpsLog.avg,
    delegate: game.source === 'keys' ? 'demo-keys' : handInfo().delegate, machine: machineInfo(),
    details: { reactionTimes: sum.reactionTimes, confusion: sum.confusion, maxLevel: sum.maxLevel, trials: sum.trials.length,
      wrong: sum.wrong, miss: sum.miss, meanRtMs: meanRt, meanRtByFinger: Object.fromEntries(stats.map((s) => [s.f, Math.round(s.m)])),
      slowestFinger: slow?.f || null, demo: game.source === 'keys' },
  };
  const status = await save(session, sum.trials);
  const th = (f) => FINGER_TH[f];
  const cell = (a, b) => `<td style="${a === b ? 'color:var(--success);font-weight:800' : sum.confusion[a][b] ? 'color:var(--error);font-weight:800' : ''}">${a === b ? sum.reactionTimes[a].length : sum.confusion[a][b]}</td>`;
  const html = `<h2>🏁 จบรอบ!</h2>
    <div class="summary-grid">
      <div class="stat"><small>คะแนน</small><b>${sum.score}</b></div>
      <div class="stat"><small>แตะถูก</small><b>${sum.correct}</b></div>
      <div class="stat"><small>นิ้วผิด / พลาด</small><b>${sum.wrong} / ${sum.miss}</b></div>
      <div class="stat"><small>ความแม่นยำ</small><b>${Math.round(sum.accuracy * 100)}%</b></div>
      <div class="stat"><small>ระดับสูงสุด</small><b>${sum.maxLevel}/5</b></div>
      <div class="stat"><small>เวลาตอบสนองเฉลี่ย</small><b>${allRt.length ? meanRt + ' ms' : '—'}</b></div>
    </div>
    <canvas id="rtChart" style="width:100%;height:260px" aria-label="กราฟเวลาตอบสนองเฉลี่ยของแต่ละนิ้ว"></canvas>
    <p style="font-size:var(--fs-lg);font-weight:800">${slow ? `👉 นิ้ว${th(slow.f)}ของคุณช้าที่สุด ลองฝึกนิ้วนี้เพิ่ม` : 'ยังไม่มีข้อมูลเวลาตอบสนองพอจะบอกนิ้วที่ช้าที่สุด'}</p>
    ${fast && fast !== slow ? `<p class="muted">นิ้วที่เร็วที่สุด: นิ้ว${th(fast.f)} (${Math.round(fast.m)} ms)</p>` : ''}
    <h3>ตารางความสับสนของนิ้ว</h3>
    <p class="muted">แถว = นิ้วที่ต้องแตะ · คอลัมน์ = นิ้วที่แตะจริง · เส้นทแยงสีเขียว = แตะถูก ${worst ? `· สับสนบ่อยสุด: นิ้ว${th(worst.a)} → นิ้ว${th(worst.b)} (${worst.n} ครั้ง)` : ''}</p>
    <table class="data"><tr><th>ต้องแตะ ↓ / แตะจริง →</th>${FINGER_NAMES.map((f) => `<th>${th(f)}</th>`).join('')}</tr>
      ${FINGER_NAMES.map((a) => `<tr><th>${th(a)}</th>${FINGER_NAMES.map((b) => cell(a, b)).join('')}</tr>`).join('')}</table>
    <h3 style="margin-top:12px">เทียบกับครั้งก่อน</h3>
    <table class="data"><tr><th>ค่า</th><th>ครั้งนี้</th><th>ครั้งก่อน</th><th>เปลี่ยนแปลง</th></tr>
      <tr><td>คะแนน</td><td>${sum.score}</td><td>${prev ? prev.score : '—'}</td><td>${compare(sum.score, prev?.score)}</td></tr>
      <tr><td>ความแม่นยำ %</td><td>${Math.round(sum.accuracy * 100)}</td><td>${prev ? Math.round(prev.accuracy * 100) : '—'}</td><td>${compare(sum.accuracy * 100, prev ? prev.accuracy * 100 : null)}</td></tr>
      <tr><td>ms เฉลี่ย (น้อย = ดี)</td><td>${meanRt || '—'}</td><td>${prev?.details?.meanRtMs || '—'}</td><td>${allRt.length ? compare(meanRt, prev?.details?.meanRtMs || null, false, ' ms') : '—'}</td></tr>
    </table>
    <p class="${status.ok ? 'up' : 'down'}" style="margin-top:12px">${status.ok ? `💾 บันทึกแล้ว (เซสชัน + ${sum.trials.length} ครั้งที่แตะ)` : '⚠️ บันทึกไม่สำเร็จ: ' + esc(status.error)}</p>`;
  const buttons = [{ label: '▶ เล่นอีกรอบ', value: 'again', cls: 'success' }, { label: 'ปิด', value: 'close', cls: 'ghost' }];
  if (!status.ok) buttons.splice(1, 0, { label: '↻ ลองบันทึกอีกครั้ง', value: 'retry' });
  const p = modal(html, buttons);
  // วาดกราฟแท่งเวลาตอบสนองเฉลี่ยต่อนิ้ว (ขีด = ส่วนเบี่ยงเบนมาตรฐาน)
  barChart($('rtChart'), stats.map((s) => ({ label: 'นิ้ว' + th(s.f), value: Math.round(s.m), error: s.s, color: getComputedStyle(document.body).getPropertyValue('--f-' + s.f).trim() })),
    { title: 'เวลาตอบสนองเฉลี่ยของแต่ละนิ้ว (ms)', yLabel: 'ms', emptyText: 'ยังไม่มีข้อมูล' });
  let choice = await p;
  while (choice === 'retry') {
    const s2 = await save(session, sum.trials);
    choice = await modal(s2.ok ? '<h2>💾 บันทึกสำเร็จ</h2>' : `<h2>⚠️ ยังบันทึกไม่ได้</h2><p>${esc(s2.error)}</p>`,
      s2.ok ? [{ label: '▶ เล่นอีกรอบ', value: 'again', cls: 'success' }, { label: 'ปิด', value: 'close', cls: 'ghost' }]
        : [{ label: '↻ ลองอีกครั้ง', value: 'retry' }, { label: 'ปิด', value: 'close', cls: 'ghost' }]);
  }
  if (choice === 'again') play(); else ready();
}

// บันทึกเซสชัน + ทุกครั้งที่แตะ (ถูก ผิด พลาด) เป็น reps
async function save(session, trials) {
  try {
    await saveSession(session);
    for (const t of trials) await saveRep({ sessionId: session.id, userId: session.userId, game: 'rhythm-tap', gesture: 'fingerTap', ...t });
    window.__lastSession = session;
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message || String(e) }; }
}
