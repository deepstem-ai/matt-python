// ============================================================
// router.js — ระบบสลับหน้าแบบแอปหน้าเดียว (Single Page App) (Lab 07)
//
// ทำไม "ซ่อน/แสดงหน้าที่มีอยู่แล้ว" ดีกว่า "สร้างหน้าใหม่ทุกครั้ง"
//  1) เร็ว: แค่สลับ class ไม่ต้องสร้าง HTML ใหม่ ไม่ต้องโหลดไฟล์ใหม่ ไม่ต้องโหลดโมเดล AI ใหม่
//  2) ไม่มีหน่วยความจำรั่ว: ไม่มี element / event listener ใหม่งอกขึ้นทุกครั้งที่สลับ
//  3) ค่าในฟอร์มไม่หาย: ผู้ใช้กรอกไว้ครึ่งหนึ่ง กลับมาก็ยังอยู่
//  4) ทำแอนิเมชันเปลี่ยนหน้าได้ลื่น เพราะหน้าปลายทางพร้อมอยู่แล้ว
//
// วิธีใช้
//  - ทุกหน้าคือ <section class="page" id="page-ชื่อ">
//  - definePage('game', { requiresAuth: true, onEnter(data) {...}, onLeave() {...}, canLeave() {...} })
//    (หน้าที่ไม่ประกาศอะไรเลยก็ใช้ได้ ระบบจะข้ามไปเอง)
//  - goTo('home', { ข้อมูลที่ส่งให้หน้าปลายทาง })  — ห้ามส่งข้อมูลผ่านตัวแปร global
//  - goBack() กลับหน้าก่อนหน้า (กด Escape ก็ได้)
// ห้ามแตะ: กล้อง, ฐานข้อมูล, โมเดล AI (หน้าที่ใช้กล้องต้องปิดกล้องเองใน onLeave)
// ============================================================

const pages = new Map();   // ชื่อหน้า → { onEnter, onLeave, canLeave, requiresAuth }
const stack = [];          // ประวัติการเดินทาง [{ name, data }] ใช้กับ goBack
const MAX_HISTORY = 50;    // จำกัดประวัติ ไม่ให้หน่วยความจำโตไม่หยุด
let current = null;        // หน้าปัจจุบัน { name, data }
let busy = false;          // กันกดรัว ๆ ระหว่างกำลังเปลี่ยนหน้า
const opts = {
  isLoggedIn: () => true,  // ฟังก์ชันบอกว่ามีคนล็อกอินอยู่ไหม
  loginPage: 'login',      // หน้าที่จะพาไปถ้ายังไม่ล็อกอิน
  onChange: null,          // เรียกทุกครั้งที่เปลี่ยนหน้า (ใช้อัปเดตแถบบอกตำแหน่ง)
};

// ประกาศหน้า (ไม่บังคับ)
export function definePage(name, def = {}) { pages.set(name, def); }

// ตั้งค่าและเริ่มทำงาน
export function initRouter({ start, transition = 'fade', duration = 250, ...rest } = {}) {
  Object.assign(opts, rest);
  setTransition(transition, duration);
  document.querySelectorAll('section.page').forEach((el) => { el.hidden = true; el.classList.remove('active'); });
  // ปุ่ม Escape = ย้อนกลับ (ยกเว้นตอนมีหน้าต่าง modal เปิดอยู่)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !document.querySelector('.modal-back')) { e.preventDefault(); goBack(); }
  });
  if (start) return goTo(start);
}

// เลือกแบบการเปลี่ยนหน้า: 'fade' | 'slide' | 'zoom' | 'none' และความยาว (มิลลิวินาที)
export function setTransition(style = 'fade', ms = 250) {
  document.body.dataset.transition = style;
  document.body.style.setProperty('--page-ms', ms + 'ms');
}

// ไปหน้าใหม่ คืน true ถ้าไปได้ / false ถ้าถูกขัด (เช่น ผู้ใช้กด "อยู่ต่อ")
// options: force = ข้ามการถามยืนยัน, replace = ไม่จดหน้าปัจจุบันลงประวัติ
export async function goTo(name, data = {}, { force = false, replace = false, back = false } = {}) {
  const el = document.getElementById('page-' + name);
  if (!el) { console.error('[router] ไม่พบหน้า page-' + name); return false; }
  const def = pages.get(name) || {};

  // หน้าที่ต้องล็อกอิน → ถ้ายังไม่ล็อกอิน พาไปหน้า login พร้อมบอกว่าจะกลับมาหน้าไหน
  if (def.requiresAuth && !opts.isLoggedIn()) {
    console.info('[router] หน้า', name, 'ต้องล็อกอินก่อน → ไปหน้า', opts.loginPage);
    return goTo(opts.loginPage, { next: name, nextData: data, reason: 'auth' }, { force, replace });
  }
  if (busy && !force) return false;
  busy = true;
  try {
    if (current) {
      if (current.name === name && !back) { busy = false; return true; } // อยู่หน้านี้แล้ว
      const cur = pages.get(current.name) || {};
      // หน้าที่ยังทำไม่เสร็จ ถามก่อนออก
      if (!force && cur.canLeave && !(await cur.canLeave())) return false;
      try { await cur.onLeave?.(); } catch (e) { console.error('[router] onLeave พัง', current.name, e); }
      const old = document.getElementById('page-' + current.name);
      old.classList.remove('active', 'enter');
      old.hidden = true;
      if (back) stack.pop();
      else if (!replace) { stack.push(current); if (stack.length > MAX_HISTORY) stack.shift(); }
    }
    current = { name, data };
    el.hidden = false;
    el.classList.add('active');
    // เริ่มแอนิเมชันใหม่ทุกครั้ง (ลบ class แล้วใส่กลับ)
    el.classList.remove('enter'); void el.offsetWidth; el.classList.add('enter');
    // ย้ายโฟกัสไปหัวข้อของหน้าใหม่ ผู้ใช้คีย์บอร์ด/โปรแกรมอ่านหน้าจอจะรู้ว่าเปลี่ยนหน้าแล้ว
    const h = el.querySelector('h1, h2');
    if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); }
    window.scrollTo(0, 0);
    try { await def.onEnter?.(data); } catch (e) { console.error('[router] onEnter พัง', name, e); }
    opts.onChange?.(current, history());
    return true;
  } finally {
    busy = false;
  }
}

// ย้อนกลับหน้าก่อนหน้า
export async function goBack() {
  if (!stack.length) return false;
  const prev = stack[stack.length - 1];
  return goTo(prev.name, prev.data, { back: true });
}

// ล้างประวัติ (เช่น หลังล็อกอิน / ออกจากระบบ ไม่ให้ย้อนกลับไปหน้าเดิม)
export function resetHistory() { stack.length = 0; opts.onChange?.(current, history()); }

export function currentPage() { return current ? { ...current } : null; }
export function history() { return stack.map((s) => s.name); }
