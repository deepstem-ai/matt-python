// ============================================================
// login-page.js — หน้าเข้าสู่ระบบด้วยใบหน้า (Lab 15)
// เปิดกล้องอัตโนมัติ → สแกน → โหวต 15 เฟรม + กระพริบตา → ทักทาย → ไปหน้า home
// ปล่อยกล้องทุกครั้งที่ออกจากหน้า
// ============================================================
import { applyPrefs, toast, modal, isCalm, esc } from './ui.js';
import { startCamera, stopCamera, cameraErrorMessage } from './camera.js';
import { openDB, listAllFaces, listUsers, getSettings, saveSettings, setCurrentUser } from './db.js';
import { initLandmarker, detectLandmarks } from './landmarker.js';
import { makeEmbedding, matchGallery, frameVote, VoteBuffer, BlinkDetector, bothEyesEAR, loginDecision, LOGIN_CONFIG, EMBED_SIZE } from './face-login.js';
import { PinPad, verifyPin, pinLockLeft, pinFailed, pinOk } from './pin.js';
import { celebrate } from './confetti.js';
import { addLog } from './login-log.js';

applyPrefs();
const $ = (id) => document.getElementById(id);
const video = $('video');
let gallery = [], users = new Map(), running = false, raf = 0, t0 = 0, lastMatch = { score: 0, second: 0 };
const vote = new VoteBuffer(LOGIN_CONFIG.voteSize, LOGIN_CONFIG.voteNeed);
const blink = new BlinkDetector();
const nameOf = (u) => [u?.firstName, u?.lastName].filter(Boolean).join(' ') || 'ผู้ใช้';

function setStatus(text, state = 'scan') { $('status').textContent = text; $('status').dataset.state = state; }
function showError(title, detail, retry) {
  $('errBox').innerHTML = `<h3>⚠ ${esc(title)}</h3><p>${esc(detail)}</p><div class="row"><button class="btn-glow" id="errRetry">↻ ลองใหม่</button><button class="btn-glow ghost" id="errPin">🔢 ใช้ PIN แทน</button></div>`;
  $('errBox').classList.remove('hidden');
  $('errRetry').onclick = () => { $('errBox').classList.add('hidden'); retry(); };
  $('errPin').onclick = pinLogin;
  $('scanRing').classList.add('idle');
}

// ---------- เริ่มต้น ----------
async function boot() {
  try {
    await openDB();
    gallery = (await listAllFaces()).filter((f) => f.embedding?.length === EMBED_SIZE);
    (await listUsers()).forEach((u) => users.set(u.id, u));
    const s = await getSettings('face-login');
    if (s.threshold) LOGIN_CONFIG.threshold = s.threshold;
  } catch (e) { return showError('เปิดฐานข้อมูลไม่ได้', e.message, boot); }
  $('thr').value = LOGIN_CONFIG.threshold; $('thrVal').textContent = LOGIN_CONFIG.threshold.toFixed(2);
  $('thrMark').style.left = LOGIN_CONFIG.threshold * 100 + '%';
  if (!gallery.length) {
    setStatus('ยังไม่มีใครเก็บใบหน้าในเครื่องนี้ — ลงทะเบียน หรือใช้ PIN', 'idle');
    $('scanRing').classList.add('idle');
    return offerOptions(true);
  }
  setStatus('กำลังโหลดโมเดลจุดใบหน้า…');
  try { await initLandmarker({ onProgress: (p) => setStatus(`กำลังโหลดโมเดลจุดใบหน้า ${Math.round(p * 100)}%`) }); }
  catch (e) { return showError('โหลดโมเดล AI ไม่สำเร็จ', e.message + ' — ตรวจอินเทอร์เน็ต หรือใช้ PIN', boot); }
  try { await startCamera(video); }
  catch (e) { const m = cameraErrorMessage(e); return showError(m.title, m.detail, boot); }
  startScan();
}

function startScan() {
  vote.clear(); blink.reset(); t0 = performance.now(); running = true;
  $('scanRing').classList.remove('idle', 'ok');
  setStatus('กำลังสแกน… มองกล้องตรง ๆ');
  cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
}
function stopScan() { running = false; cancelAnimationFrame(raf); }

// ---------- ทุกเฟรม ----------
function loop(now) {
  if (!running) return;
  raf = requestAnimationFrame(loop);
  const lm = detectLandmarks(video, now);
  if (!lm) {
    vote.push(null); lastMatch = { score: 0, second: 0 };
    setStatus('ยังไม่เห็นใบหน้า — เข้ามาให้อยู่กลางวงแหวน');
  } else {
    const emb = makeEmbedding(lm.points, { width: lm.width, height: lm.height });
    lastMatch = emb ? matchGallery(emb, gallery) : { score: 0, second: 0 };
    vote.push(frameVote(lastMatch));
    const ear = bothEyesEAR(lm.points, lm.width, lm.height);
    if (blink.update(ear, now)) { $('blinkBox').classList.add('pop'); setTimeout(() => $('blinkBox').classList.remove('pop'), 400); }
    $('liveNums').textContent = `best ${lastMatch.score.toFixed(3)} · 2nd ${lastMatch.second.toFixed(3)} · EAR ${ear.toFixed(3)} (base ${blink.baseline.toFixed(3)})`;
  }
  updateMeters();
  const d = loginDecision(vote, blink);
  if (d.userId) return success(d.userId, 'face');
  if (d.who && !d.blinkOk) setStatus('จำได้แล้ว! 👁 กระพริบตา 1 ครั้ง เพื่อยืนยันว่าเป็นคนจริง', 'almost');
  else if (lm) setStatus('กำลังสแกน… นิ่งไว้สักครู่');
  if (now - t0 > LOGIN_CONFIG.noMatchSeconds * 1000) {
    stopScan();
    addLog({ method: 'face-timeout', userId: null, ms: Math.round(now - t0), score: lastMatch.score, threshold: LOGIN_CONFIG.threshold, blinks: blink.count });
    offerOptions(false);
  }
}

function updateMeters() {
  const s = lastMatch.score;
  $('confFill').style.width = (s * 100).toFixed(1) + '%';
  $('confBar').classList.toggle('pass', s >= LOGIN_CONFIG.threshold);
  $('confNum').textContent = s.toFixed(2);
  const lead = vote.leader();
  $('voteNum').textContent = `${lead.count}/${vote.need}`;
  $('voteFill').style.width = Math.min(100, (lead.count / vote.need) * 100) + '%';
  $('blinkNum').textContent = `${Math.min(blink.count, LOGIN_CONFIG.blinksNeeded)}/${LOGIN_CONFIG.blinksNeeded}`;
  $('blinkBox').classList.toggle('done', blink.count >= LOGIN_CONFIG.blinksNeeded);
}

// ---------- สำเร็จ ----------
async function success(userId, method) {
  stopScan();
  const u = users.get(userId);
  setCurrentUser(userId);
  addLog({ method, userId, ms: Math.round(performance.now() - t0), score: method === 'face' ? lastMatch.score : null, threshold: LOGIN_CONFIG.threshold, blinks: blink.count });
  stopCamera();
  $('scanRing').classList.add('ok');
  $('greetName').textContent = `สวัสดี คุณ${nameOf(u)}!`;
  $('greet').classList.remove('hidden');
  if (!isCalm()) celebrate($('confetti'));
  setTimeout(() => { location.href = 'home.html'; }, 2800);
}

// ---------- ไม่เจอใคร: เสนอ 3 ทาง ----------
async function offerOptions(empty) {
  $('scanRing').classList.add('idle');
  const html = empty
    ? '<h2>ยังไม่มีใบหน้าในเครื่องนี้</h2><p>ลงทะเบียนใหม่ (ชื่อ + PIN แล้วเก็บใบหน้า) หรือเข้าด้วย PIN</p>'
    : `<h2>🤔 ยังหาไม่เจอภายใน ${LOGIN_CONFIG.noMatchSeconds} วินาที</h2><p>ลองขยับเข้าที่สว่าง มองกล้องตรง ๆ แล้วกระพริบตา หรือเลือกทางอื่น</p>`;
  const choice = await modal(html, [
    ...(empty ? [] : [{ label: '↻ ลองอีกครั้ง', value: 'retry' }]),
    { label: '🔢 ใช้ PIN', value: 'pin', cls: 'ghost' },
    { label: '📝 ลงทะเบียนใหม่', value: 'register', cls: 'ghost' },
  ]);
  if (choice === 'retry') startScan();
  else if (choice === 'pin') pinLogin();
  else location.href = 'register.html';
}

// ---------- เข้าด้วย PIN ----------
async function pinLogin() {
  stopScan();
  const withPin = [...users.values()].filter((u) => u.pinHash);
  if (!withPin.length) { toast('ยังไม่มีใครตั้ง PIN — ลงทะเบียนก่อน', 'warning', 4); return offerOptions(!gallery.length); }
  const back = document.createElement('div');
  back.className = 'modal-back';
  back.innerHTML = `<div class="modal pin-modal" role="dialog" aria-modal="true"><h2>🔢 เข้าด้วย PIN</h2>
    <div class="field"><label for="pinUser">ผู้ใช้</label><select id="pinUser">${withPin.map((u) => `<option value="${esc(u.id)}">${esc(nameOf(u))}</option>`).join('')}</select></div>
    <p id="pinMsg" class="muted">กด PIN 6 หลัก</p><div id="pinPad"></div>
    <div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn-glow ghost" id="pinCancel">ยกเลิก</button></div></div>`;
  document.body.appendChild(back);
  const close = () => { pad.destroy(); back.remove(); };
  const pad = new PinPad(back.querySelector('#pinPad'), {
    async onComplete(pin) {
      const left = pinLockLeft();
      if (left > 0) { back.querySelector('#pinMsg').textContent = `ผิดหลายครั้งเกินไป รออีก ${Math.ceil(left / 1000)} วินาที`; return pad.shake(); }
      const u = users.get(back.querySelector('#pinUser').value);
      if (await verifyPin(pin, u)) { pinOk(); close(); success(u.id, 'pin'); }
      else { const s = pinFailed(); back.querySelector('#pinMsg').textContent = s.until ? 'ผิด 5 ครั้ง ล็อก 30 วินาที' : `PIN ไม่ถูกต้อง ลองใหม่ (ผิด ${s.fails} ครั้ง)`; pad.shake(); }
    },
  });
  back.querySelector('#pinCancel').onclick = () => { close(); if (gallery.length && video.srcObject) startScan(); };
}

// ---------- ปรับเกณฑ์ความเหมือน (บันทึกค่าที่ใช้ได้ลงบทที่ 4) ----------
$('thr').oninput = () => {
  LOGIN_CONFIG.threshold = +$('thr').value;
  $('thrVal').textContent = LOGIN_CONFIG.threshold.toFixed(2);
  $('thrMark').style.left = LOGIN_CONFIG.threshold * 100 + '%';
  saveSettings('face-login', { threshold: LOGIN_CONFIG.threshold }).catch(() => {});
};
$('btnPin').onclick = pinLogin;
addEventListener('pagehide', () => { stopScan(); stopCamera(); });
addEventListener('camera-lost', () => { stopScan(); showError('กล้องหลุดการเชื่อมต่อ', 'เสียบสายกล้องให้แน่นแล้วกดลองใหม่', boot); });
boot();
