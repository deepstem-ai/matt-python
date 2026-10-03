// ============================================================
// pages.js — ประกาศพฤติกรรมของแต่ละหน้า (Lab 07)
// ข้อมูลระหว่างหน้าส่งผ่าน goTo(name, data) เท่านั้น ห้ามใช้ตัวแปร global
// ============================================================
import { definePage, goTo, resetHistory } from './router.js';
import { startCamera, stopCamera, cameraErrorMessage } from './camera.js';
import { setCurrentUser, getCurrentUserId } from './db.js';
import { modal, toast, esc } from './ui.js';

const $ = (s) => document.querySelector(s);
export const PAGE_TH = {
  splash: 'หน้าเปิดแอป', login: 'เข้าสู่ระบบ', register: 'ลงทะเบียน', home: 'หน้าหลัก',
  game: 'เกม', progress: 'ความก้าวหน้า', settings: 'ตั้งค่า',
};
const SKIP_TH = { camera: 'กล้อง', hand: 'โมเดลมือ', face: 'โมเดลใบหน้า (ใช้ PIN แทน)' };
export const isLoggedIn = () => !!getCurrentUserId();

// ---------- login ----------
definePage('login', {
  onEnter(data) {
    // ถูกส่งมาเพราะยังไม่ล็อกอิน → บอกผู้ใช้ว่าทำไม
    const note = $('#authNote');
    note.classList.toggle('hidden', data.reason !== 'auth');
    if (data.reason === 'auth') note.textContent = `ต้องเข้าสู่ระบบก่อน จึงจะเข้าหน้า "${PAGE_TH[data.next] || data.next}" ได้`;
    // ผลการโหลดจากหน้า splash (ส่งมาทาง goTo data)
    const ln = $('#loadNote');
    if (data.splash) {
      const sk = data.splash.skipped;
      ln.className = 'alert ' + (sk.length ? 'warn' : 'ok');
      ln.innerHTML = `โหลดเสร็จใน ${(data.splash.ms / 1000).toFixed(1)} วินาที · ${data.splash.messages.map(esc).join(' · ')}`
        + (sk.length ? `<br>ข้ามไว้: ${sk.map((k) => SKIP_TH[k] || k).join(', ')}` : '')
        + (data.splash.demoMode ? '<br>🖱 ใช้โหมดสาธิตด้วยเมาส์ (นิ้วชี้ = ตำแหน่งเมาส์ · กดเมาส์ค้าง = หนีบนิ้ว)' : '');
    } else ln.className = 'alert hidden';
    // เก็บปลายทางไว้บนปุ่ม (ส่งต่อทาง data ไม่ใช่ตัวแปร global)
    $('#fakeLogin').onclick = async () => {
      setCurrentUser('demo-user');
      resetHistory(); // ล็อกอินแล้วไม่ให้ย้อนกลับมาหน้า login
      toast('เข้าสู่ระบบแล้ว', 'success');
      await goTo(data.next || 'home', data.nextData || {}, { replace: true });
    };
  },
});

// ---------- register: หน้าที่ "ทำไม่เสร็จ" ต้องถามก่อนออก ----------
let regDirty = false; // สถานะภายในหน้า (ไม่ใช่ข้อมูลส่งข้ามหน้า)
$('#regName').addEventListener('input', () => { regDirty = $('#regName').value.trim() !== ''; });
definePage('register', {
  async canLeave() {
    if (!regDirty) return true;
    return modal('<h2>ยังกรอกไม่เสร็จ</h2><p>ถ้าออกตอนนี้ ข้อมูลที่พิมพ์ไว้จะไม่ถูกบันทึก ต้องการออกจริงไหม?</p>', [
      { label: '✍ อยู่ต่อ', value: false, cls: '' },
      { label: '🚪 ออก ไม่บันทึก', value: true, cls: 'danger' },
    ]);
  },
  onLeave() { /* ไม่ล้างช่องกรอก กลับมาจะยังเห็นค่าเดิม */ },
});
$('#regNext').addEventListener('click', async () => {
  const name = $('#regName').value.trim() || 'ผู้ใช้ใหม่';
  regDirty = false;
  setCurrentUser('demo-user');
  $('#regName').value = '';
  resetHistory();
  await goTo('home', { welcomeName: name }); // ส่งชื่อไปหน้าหลักผ่าน data
});

// ---------- home ----------
definePage('home', {
  requiresAuth: true,
  onEnter(data) {
    $('#hello').innerHTML = data.welcomeName
      ? `ยินดีต้อนรับ <b>${esc(data.welcomeName)}</b> (ชื่อนี้ส่งมาทาง goTo)`
      : 'สวัสดี ผู้ใช้ทดสอบ วันนี้พร้อมฝึกมือหรือยัง?';
  },
});
$('#logout').addEventListener('click', async () => {
  setCurrentUser(null);
  resetHistory();
  await goTo('login', {}, { replace: true });
});

// ---------- game: ใช้กล้อง → ต้องปิดใน onLeave เสมอ ----------
let camToken = 0; // เลขรอบ ใช้กันกรณีผู้ใช้ออกจากหน้าก่อนกล้องเปิดเสร็จ
function camStatus(on) {
  const s = $('#camStatus');
  s.className = 'cam-status ' + (on ? 'on' : 'off');
  s.textContent = on ? '🔴 เปิดอยู่' : '⚫ ปิด';
}
async function openCam() {
  const my = ++camToken;
  $('#camError').classList.add('hidden');
  try {
    await startCamera($('#gameVideo'), undefined, { width: 640, height: 480 });
    // ถ้าระหว่างรอ ผู้ใช้ออกจากหน้าไปแล้ว → ปิดทันที ไม่ให้ไฟกล้องค้าง
    if (my !== camToken) { stopCamera(); return; }
    camStatus(true);
  } catch (err) {
    if (my !== camToken) return;
    const m = cameraErrorMessage(err);
    const box = $('#camError');
    box.innerHTML = `<b>${esc(m.title)}</b><p>${esc(m.detail)}</p><button class="btn-glow" id="camRetry"><span class="ico">🔄</span> ลองใหม่</button>`;
    box.classList.remove('hidden');
    $('#camRetry').onclick = openCam;
  }
}
definePage('game', {
  requiresAuth: true,
  onEnter() { openCam(); /* ไม่รอกล้อง หน้าจะได้เปลี่ยนทันที */ },
  onLeave() {
    camToken++;     // ยกเลิกรอบที่กำลังเปิดอยู่
    stopCamera();   // ปิดทุก track → ไฟกล้องดับ
    camStatus(false);
  },
});
// ปิดแท็บ/รีเฟรชระหว่างอยู่หน้าเกม ก็ปิดกล้องด้วย
window.addEventListener('pagehide', () => stopCamera());

// ---------- progress: แถบแท็บย่อยในหน้าเดียว ----------
const TAB_TEXT = { week: 'สัปดาห์นี้ฝึกไป 4 วัน (กราฟจริงมาใน Lab 29)', month: 'เดือนนี้ฝึกไป 15 วัน รวม 320 ครั้ง', all: 'ฝึกมาแล้วทั้งหมด 42 วัน' };
document.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('[data-tab]').forEach((x) => x.setAttribute('aria-selected', x === b));
  $('#tabView').textContent = TAB_TEXT[b.dataset.tab];
}));
definePage('progress', { requiresAuth: true });

// settings / splash ไม่มี hook ก็ไม่ต้องประกาศ ระบบข้ามให้เอง
