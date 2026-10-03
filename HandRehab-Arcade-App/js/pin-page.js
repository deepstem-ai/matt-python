// ============================================================
// pin-page.js — หน้าตั้ง/เปลี่ยน PIN (Lab 15)
// มี PIN เดิม → ต้องกด PIN เดิมให้ถูกก่อน → PIN ใหม่ → ยืนยัน
// ============================================================
import { applyPrefs, toast, esc } from './ui.js';
import { openDB, listUsers, getUser, updateUser, getCurrentUserId } from './db.js';
import { PinPad, hashPin, verifyPin, pinProblem, pinLockLeft, pinFailed, pinOk } from './pin.js';

applyPrefs();
const $ = (id) => document.getElementById(id);
let user = null, stage = 'old', newPin = null;
const nameOf = (u) => [u.firstName, u.lastName].filter(Boolean).join(' ') || '(ไม่มีชื่อ)';

function setStage(s, msg = '') {
  stage = s;
  $('pinTitle').textContent = { old: 'กด PIN เดิม', new: 'ตั้ง PIN ใหม่ 6 หลัก', confirm: 'กด PIN ใหม่อีกครั้ง', done: '✅ บันทึก PIN แล้ว' }[s];
  $('pinMsg').textContent = msg;
  $('pad').classList.toggle('hidden', s === 'done');
  pad.reset();
}
async function selectUser(id) {
  user = await getUser(id);
  newPin = null;
  setStage(user?.pinHash ? 'old' : 'new', user?.pinHash ? 'ยืนยันว่าเป็นเจ้าของบัญชีก่อนเปลี่ยน' : 'ผู้ใช้นี้ยังไม่มี PIN');
}

const pad = new PinPad($('pad'), {
  async onComplete(pin) {
    if (stage === 'old') {
      const left = pinLockLeft();
      if (left > 0) { $('pinMsg').textContent = `ผิดหลายครั้ง รออีก ${Math.ceil(left / 1000)} วินาที`; return pad.shake(); }
      if (await verifyPin(pin, user)) { pinOk(); return setStage('new', 'PIN เดิมถูกต้อง'); }
      const s = pinFailed(); $('pinMsg').textContent = s.until ? 'ผิด 5 ครั้ง ล็อก 30 วินาที' : 'PIN เดิมไม่ถูกต้อง'; return pad.shake();
    }
    if (stage === 'new') {
      const p = pinProblem(pin);
      if (p) { $('pinMsg').textContent = '❌ ' + p; return pad.shake(); }
      newPin = pin; return setStage('confirm', 'ป้องกันกดผิดโดยไม่รู้ตัว');
    }
    if (stage === 'confirm') {
      if (pin !== newPin) { newPin = null; pad.shake(); return setStage('new', '❌ ไม่ตรงกัน เริ่มตั้งใหม่'); }
      try {
        user = await updateUser(user.id, { pinHash: await hashPin(pin, user.id), pinSetAt: Date.now() });
        newPin = null; setStage('done', 'ใช้ PIN ใหม่เข้าสู่ระบบได้ทันที');
        toast('บันทึก PIN ของ ' + nameOf(user) + ' แล้ว', 'success');
      } catch (e) { $('errBox').textContent = 'บันทึกไม่ได้: ' + e.message; $('errBox').classList.remove('hidden'); }
    }
  },
});

try {
  await openDB();
  const users = await listUsers();
  if (!users.length) {
    $('errBox').innerHTML = 'ยังไม่มีผู้ใช้ <a class="btn-glow small" href="register.html">📝 ลงทะเบียน</a>';
    $('errBox').classList.remove('hidden'); $('pad').classList.add('hidden');
  } else {
    const cur = getCurrentUserId();
    $('who').innerHTML = users.map((u) => `<option value="${esc(u.id)}" ${u.id === cur ? 'selected' : ''}>${esc(nameOf(u))}${u.pinHash ? ' (มี PIN)' : ''}</option>`).join('');
    $('who').onchange = () => selectUser($('who').value);
    await selectUser($('who').value);
  }
} catch (e) {
  $('errBox').innerHTML = `เปิดฐานข้อมูลไม่ได้: ${esc(e.message)} <button class="btn-glow small" onclick="location.reload()">↻ ลองใหม่</button>`;
  $('errBox').classList.remove('hidden');
}
