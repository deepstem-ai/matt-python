// ============================================================
// router.js — ตัวสลับหน้าจอแบบเล็กที่สุด (ย่อจาก Lab 07)
// ใช้ส่วนท้ายของที่อยู่เว็บ (#/camera) บอกว่ากำลังอยู่หน้าไหน
// ทุกหน้ามี onEnter (ตอนเข้า) และ onLeave (ตอนออก)
// กฎสำคัญ: หน้าที่ใช้กล้องต้องปิดกล้องใน onLeave เสมอ
// ============================================================

const routes = {};     // ชื่อหน้า → { el, onEnter, onLeave }
let current = null;    // ชื่อหน้าที่เปิดอยู่ตอนนี้
let fallback = 'home'; // หน้าเริ่มต้นถ้าที่อยู่ไม่ถูกต้อง

// ลงทะเบียนหน้า 1 หน้า
export function addRoute(name, { el, onEnter, onLeave } = {}) {
  routes[name] = { el, onEnter, onLeave };
}

// ออกจากหน้าปัจจุบัน (เรียก onLeave) — ใช้ทั้งตอนสลับหน้าและตอนปิดแท็บ
function leaveCurrent() {
  const r = routes[current];
  if (!r) return;
  try { r.onLeave?.(); } catch (e) { console.error('[router] onLeave พัง', e); }
}

// อ่าน # แล้วแสดงหน้าที่ตรงกัน
function show() {
  const name = location.hash.replace(/^#\/?/, '') || fallback;
  const target = routes[name] ? name : fallback;
  if (target === current) return;
  leaveCurrent();
  current = target;
  for (const [n, r] of Object.entries(routes)) r.el?.classList.toggle('hidden', n !== target);
  document.querySelectorAll('[data-route]').forEach((a) => a.classList.toggle('active', a.dataset.route === target));
  try { routes[target].onEnter?.(); } catch (e) { console.error('[router] onEnter พัง', e); }
}

// เริ่มทำงาน: ฟังการเปลี่ยน # และการปิด/ออกจากหน้าเว็บ
export function startRouter(defaultName = 'home') {
  fallback = defaultName;
  window.addEventListener('hashchange', show);
  // pagehide = ปิดแท็บ, รีเฟรช, หรือไปเว็บอื่น → ต้องปล่อยกล้องด้วย
  window.addEventListener('pagehide', () => { leaveCurrent(); current = null; });
  show();
}

export const currentRoute = () => current;
