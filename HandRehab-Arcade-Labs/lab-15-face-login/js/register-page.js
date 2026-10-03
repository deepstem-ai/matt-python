// ============================================================
// register-page.js — ลงทะเบียนแบบย่อ ชื่อ + PIN (Lab 15 สำรอง)
// ลงทะเบียนเต็มรูปแบบอยู่ใน Lab 12
// ============================================================
import { applyPrefs, toast, esc } from './ui.js';
import { openDB, createUser, newId, setCurrentUser } from './db.js';
import { PinPad, hashPin, pinProblem } from './pin.js';

applyPrefs();
const $ = (id) => document.getElementById(id);
let name = null, firstPin = null;
function step(n) {
  [1, 2, 3, 4].forEach((i) => $('st' + i).classList.toggle('now', i === n));
  $('s1').classList.toggle('hidden', n !== 1);
  $('s2').classList.toggle('hidden', n !== 2 && n !== 3);
  $('s4').classList.toggle('hidden', n !== 4);
}

$('nameForm').onsubmit = (e) => {
  e.preventDefault();
  const first = $('firstName').value.trim(), last = $('lastName').value.trim();
  $('nameErr').textContent = first.length < 2 ? 'พิมพ์ชื่ออย่างน้อย 2 ตัวอักษร' : '';
  $('consentErr').textContent = $('consent').checked ? '' : 'กรุณาติ๊กยินยอมก่อน';
  if (first.length < 2 || !$('consent').checked) return;
  name = { firstName: first, lastName: last };
  step(2);
};

const pad = new PinPad($('pad'), {
  async onComplete(pin) {
    if (!firstPin) {
      const p = pinProblem(pin);
      if (p) { $('pinMsg').textContent = '❌ ' + p + ' — ลองใหม่'; return pad.shake(); }
      firstPin = pin; pad.reset();
      $('pinTitle').textContent = 'กด PIN เดิมอีกครั้งเพื่อยืนยัน'; $('pinMsg').textContent = 'ป้องกันกดผิดโดยไม่รู้ตัว';
      return step(3);
    }
    if (pin !== firstPin) {
      firstPin = null; pad.shake(); step(2);
      $('pinTitle').textContent = 'ตั้ง PIN 6 หลัก'; $('pinMsg').textContent = '❌ PIN สองครั้งไม่ตรงกัน เริ่มตั้งใหม่';
      return;
    }
    try {
      await openDB();
      const id = newId('u_');
      // เก็บเฉพาะแฮช ไม่เก็บตัวเลข PIN
      const user = await createUser({ id, ...name, consentAt: Date.now(), pinHash: await hashPin(pin, id), pinSetAt: Date.now() });
      firstPin = null;
      setCurrentUser(user.id);
      $('goEnrol').href = 'enrol.html?user=' + encodeURIComponent(user.id);
      toast('ลงทะเบียน ' + name.firstName + ' แล้ว', 'success');
      step(4);
    } catch (e) {
      $('errBox').innerHTML = `<h3>⚠ บันทึกไม่ได้</h3><p>${esc(e.message)}</p><button class="btn-glow" onclick="location.reload()">↻ ลองใหม่</button>`;
      $('errBox').classList.remove('hidden');
    }
  },
});
$('goHome').onclick = () => { location.href = 'home.html'; };
