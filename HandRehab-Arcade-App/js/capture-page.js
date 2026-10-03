// ============================================================
// capture-page.js — ขั้นตอนของหน้าเก็บใบหน้า (Lab 14)
// เลือกผู้ใช้ → แจ้งเรื่องข้อมูลส่วนตัว → ถ่าย 5 ท่า → สรุป → บันทึกลงฐานข้อมูล
// ============================================================
import { applyPrefs, toast, modal, makeRing, setRing, esc } from './ui.js';
import { startCamera, stopCamera, cameraErrorMessage } from './camera.js';
import { initVision } from './vision.js';
import { initLandmarker } from './landmarker.js';
import { openDB, listUsers, createUser, getUser, listFacesByUser, saveFace, deleteByIndex, updateUser, setCurrentUser } from './db.js';
import { POSES } from './guide.js';
import { QUALITY_CONFIG } from './quality.js';
import { FaceCapture } from './face-capture.js';
import { fullName, renderUserPicker, renderPoseList, renderLive, renderStrip, openShotModal, showPersistModal, rejectReasons } from './capture-ui.js';

applyPrefs();
const $ = (id) => document.getElementById(id);
const SECTIONS = ['secPick', 'secConsent', 'secCapture', 'secSummary'];
let user = null, shots = Array(POSES.length).fill(null), queue = [], modelsReady = false, lastLive = 0, rejected = 0;
makeRing($('cdRing'));

function show(id) { SECTIONS.forEach((s) => $(s).classList.toggle('hidden', s !== id)); $('errBox').classList.add('hidden'); }
function showError(title, detail, retry) {
  const box = $('errBox');
  box.innerHTML = `<h3>⚠ ${esc(title)}</h3><p>${esc(detail)}</p><button class="btn-glow">↻ ลองใหม่</button>`;
  box.querySelector('button').onclick = retry;
  box.classList.remove('hidden');
}

// ---------- 1) เลือกผู้ใช้ ----------
async function loadUsers() {
  show('secPick');
  try {
    await openDB();
    const users = await listUsers();
    const counts = {};
    for (const u of users) counts[u.id] = (await listFacesByUser(u.id)).length;
    $('noUsers').classList.toggle('hidden', users.length > 0);
    renderUserPicker($('userList'), users, counts, pick);
    const pre = new URLSearchParams(location.search).get('user');
    if (pre) { const u = await getUser(pre); if (u) pick(u); }
  } catch (e) { showError('เปิดฐานข้อมูลไม่ได้', e.message + ' — ปิดแท็บอื่นของแอปแล้วลองใหม่', loadUsers); }
}
$('quickForm').onsubmit = async (e) => {
  e.preventDefault();
  const name = $('quickName').value.trim();
  if (name.length < 2) { $('quickErr').textContent = 'พิมพ์ชื่ออย่างน้อย 2 ตัวอักษร'; return; }
  $('quickErr').textContent = '';
  try { pick(await createUser({ firstName: name, extra: { quickCreated: true } })); toast('สร้างผู้ใช้ "' + name + '" แล้ว'); }
  catch (err) { showError('บันทึกผู้ใช้ไม่ได้', err.message, () => $('quickForm').requestSubmit()); }
};

async function pick(u) {
  user = u; setCurrentUser(u.id);
  $('userChip').innerHTML = `👤 <b>${esc(fullName(u))}</b>`;
  $('userChip').classList.remove('hidden');
  const n = (await listFacesByUser(u.id)).length;
  $('oldFaces').textContent = n ? `ตอนนี้มีใบหน้าเดิม ${n} รูป — ถ้าบันทึกใหม่ รูปเดิมจะถูกแทนที่` : 'ยังไม่มีใบหน้าที่บันทึกไว้';
  show('secConsent');
}

// ---------- 2) ถ่ายภาพ ----------
const engine = new FaceCapture({
  video: $('video'), canvas: $('overlay'),
  onFrame(info) {
    $('status').dataset.state = info.state;
    $('statusIco').textContent = info.msg.icon;
    $('statusText').textContent = info.msg.text;
    const s = info.q?.score ?? 0;
    $('qFill').style.width = s + '%'; $('qNum').textContent = s;
    if (performance.now() - lastLive > 250) { lastLive = performance.now(); renderLive($('liveTable'), info.q, { widthRatio: info.guide?.widthRatio, pose: info.pose }); }
  },
  onCountdown(n, frac) {
    $('countdown').classList.toggle('hidden', n == null);
    if (n == null) return;
    setRing($('cdRing'), ((3 - n) + frac) / 3 * 100);
    $('cdRing').querySelector('.ring-label').textContent = n;
  },
  onCancel(msg) { toast('ยกเลิกการนับถอยหลัง — ' + msg.text, 'warning', 3); },
  onReject(q, extra) {
    rejected++;
    const reasons = rejectReasons(q, extra);
    toast('❌ ภาพไม่ผ่าน ไม่นับ ต้องถ่ายใหม่: ' + reasons.join(' · '), 'error', 6);
    $('rejectLog').insertAdjacentHTML('afterbegin', `<li>${esc(POSES[queue[0]].th)}: ${esc(reasons.join(' · '))}</li>`);
  },
  onCapture(shot) {
    shots[shot.poseIndex] = shot; queue.shift();
    toast(`📸 เก็บภาพ "${POSES[shot.poseIndex].th}" แล้ว คะแนน ${shot.score}`, 'success', 2);
    $('stage').classList.add('flash'); setTimeout(() => $('stage').classList.remove('flash'), 300);
    next();
  },
  onPersist: (msg) => showPersistModal(msg),
  onPoseRelax() { toast('ทำท่านี้ได้ยากใช่ไหม ไม่เป็นไร — ถ่ายท่าที่ใกล้เคียงได้เลย', 'warning', 4); },
});

async function ensureModels() {
  if (modelsReady) return true;
  $('statusText').textContent = 'กำลังโหลดโมเดลตรวจใบหน้า…';
  try { await initVision({ onProgress: (p) => { $('statusText').textContent = `กำลังโหลดโมเดลตรวจใบหน้า ${Math.round(p * 100)}%`; } }); }
  catch (e) { showError('โหลดโมเดล AI ไม่สำเร็จ', e.message + ' — ตรวจอินเทอร์เน็ตแล้วกดลองใหม่', () => startCapture(queue)); return false; }
  try { await initLandmarker({ onProgress: (p) => { $('statusText').textContent = `กำลังโหลดโมเดล 478 จุด ${Math.round(p * 100)}%`; } }); }
  catch (e) { toast('โหลดโมเดล 478 จุดไม่ได้ — ถ่ายได้ แต่ภาพจะยังใช้ล็อกอินด้วยใบหน้า (Lab 15) ไม่ได้', 'warning', 8); }
  modelsReady = true;
  return true;
}

async function startCapture(q) {
  queue = q; show('secCapture');
  renderPoseList($('poseList'), shots, queue[0]);
  if (!(await ensureModels())) return;
  try { await startCamera($('video')); }
  catch (e) { const m = cameraErrorMessage(e); showError(m.title, m.detail, () => startCapture(queue)); return; }
  next();
}
function next() {
  if (!queue.length) return finishCapture();
  engine.setTarget(queue[0]);
  $('poseTag').textContent = `ท่าที่ ${queue[0] + 1}/${POSES.length}: ${POSES[queue[0]].icon} ${POSES[queue[0]].th}`;
  renderPoseList($('poseList'), shots, queue[0]);
  engine.start();
}
function finishCapture() { engine.stop(); stopCamera(); renderSummary(); show('secSummary'); }

// ---------- 3) หน้าสรุป ----------
function renderSummary() {
  renderStrip($('strip'), shots, {
    onOpen: async (i) => { if ((await openShotModal(shots[i], POSES[i].th)) === 'retake') retake(i); },
    onRetake: retake,
  });
  const got = shots.filter(Boolean), missing = POSES.length - got.length;
  const avg = got.length ? Math.round(got.reduce((a, s) => a + s.score, 0) / got.length) : 0;
  let html = `<p>คะแนนเฉลี่ย <b class="num">${avg}</b> / 100 · ภาพที่ถูกปฏิเสธระหว่างถ่าย <b class="num">${rejected}</b> ครั้ง</p>`;
  if (missing) html += `<p class="alert warn">ยังขาด ${missing} ท่า — กดปุ่ม ↻ บนช่องว่างเพื่อถ่ายให้ครบก่อนบันทึก</p>`;
  else if (avg < QUALITY_CONFIG.warnAverage) html += `<p class="alert warn">⚠ คะแนนเฉลี่ยต่ำกว่า ${QUALITY_CONFIG.warnAverage} — ล็อกอินด้วยใบหน้าจะยากในภายหลัง แนะนำให้ย้ายไปที่สว่างแล้วถ่ายใหม่ทั้งหมด</p>`;
  else html += '<p class="alert ok">✓ ภาพคุณภาพดี พร้อมบันทึก</p>';
  if (got.some((s) => !s.embedding)) html += '<p class="alert warn">บางภาพไม่มีข้อมูลจุดใบหน้า 478 จุด (โมเดลโหลดไม่ได้) จะใช้ล็อกอินไม่ได้</p>';
  $('avgBox').innerHTML = html;
  $('btnSave').disabled = missing > 0;
}
function retake(i) { shots[i] = null; startCapture([i]); }

$('btnStart').onclick = () => { rejected = 0; startCapture(POSES.map((_, i) => i).filter((i) => !shots[i])); };
$('btnStop').onclick = finishCapture;
$('btnRetakeAll').onclick = () => { shots = Array(POSES.length).fill(null); rejected = 0; startCapture(POSES.map((_, i) => i)); };
$('btnSave').onclick = async () => {
  try {
    await deleteByIndex('faces', 'userId', user.id); // แทนที่รูปเดิมทั้งหมด
    for (const s of shots) {
      await saveFace({ userId: user.id, embedding: s.embedding || [], quality: { score: s.score, parts: s.parts, metrics: s.metrics }, image: s.image, pose: s.pose });
    }
    const avg = Math.round(shots.reduce((a, s) => a + s.score, 0) / shots.length);
    user = await updateUser(user.id, { extra: { ...(user.extra || {}), faceQualityAvg: avg, faceCount: shots.length, faceCapturedAt: Date.now(), faceRejected: rejected } });
    toast(`✓ บันทึกใบหน้า ${shots.length} ภาพแล้ว (เฉลี่ย ${avg})`, 'success', 4);
    const nextPage = document.body.dataset.next;
    $('afterSave').innerHTML = nextPage ? `<a class="btn-glow success" href="${esc(nextPage)}">➜ ไปลองเข้าสู่ระบบด้วยใบหน้า</a>` : '<p class="muted">บันทึกแล้ว ภาพเหล่านี้จะใช้ใน Lab 15 (เข้าสู่ระบบด้วยใบหน้า)</p>';
  } catch (e) { showError('บันทึกไม่สำเร็จ', e.message, () => $('btnSave').click()); }
};
async function deleteAllFaces() {
  if (!user) return;
  const ok = await modal(`<h2>ลบใบหน้าทั้งหมดของ ${esc(fullName(user))}?</h2><p>ลบแล้วกู้คืนไม่ได้ ต้องใช้ PIN หรือถ่ายใหม่เพื่อเข้าสู่ระบบ</p>`,
    [{ label: 'ยกเลิก', value: false, cls: 'ghost' }, { label: '🗑 ลบทั้งหมด', value: true, cls: 'danger' }]);
  if (!ok) return;
  const n = await deleteByIndex('faces', 'userId', user.id);
  toast(`ลบใบหน้าแล้ว ${n ?? ''} รูป`, 'success');
  $('oldFaces').textContent = 'ยังไม่มีใบหน้าที่บันทึกไว้';
}
$('btnDeleteFaces').onclick = deleteAllFaces;
$('btnDeleteFaces2').onclick = deleteAllFaces;
$('btnBack').onclick = () => { engine.stop(); stopCamera(); user = null; shots = Array(POSES.length).fill(null); $('userChip').classList.add('hidden'); loadUsers(); };
$('btnConsentBack').onclick = () => $('btnBack').click();

// ปล่อยกล้องทุกครั้งที่ออกจากหน้า
addEventListener('pagehide', () => { engine.stop(); stopCamera(); });
addEventListener('camera-lost', () => { engine.stop(); showError('กล้องหลุดการเชื่อมต่อ', 'เสียบสายกล้องให้แน่นแล้วกดลองใหม่', () => startCapture(queue)); });

loadUsers();
