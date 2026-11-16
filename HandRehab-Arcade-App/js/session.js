// ============================================================
// session.js — ใครกำลังใช้แอปอยู่: ผู้ใช้ที่เข้าสู่ระบบ หรือ "เล่นแบบไม่ลงทะเบียน" (guest) (แอปรวม v2)
//   - ผู้ใช้จริง: db.js setCurrentUser(id) (sessionStorage 'hr-user')
//   - guest: sessionStorage 'hr-guest' = '1' · ข้อมูลการเล่นเก็บใต้รหัส 'guest' ของเครื่องนี้
// ปิดเบราว์เซอร์ = ออกจากระบบทั้งสองแบบ (sessionStorage)
// ============================================================
import { getCurrentUserId, setCurrentUser } from './db.js';

const KEY = 'hr-guest';
export function isGuest() {
  if (getCurrentUserId()) return false;
  try { return sessionStorage.getItem(KEY) === '1'; } catch { return false; }
}
export function startGuest() {
  setCurrentUser(null);
  try { sessionStorage.setItem(KEY, '1'); } catch { /* ไม่เป็นไร */ }
}
export function endSession() {
  setCurrentUser(null);
  try { sessionStorage.removeItem(KEY); } catch { /* ไม่เป็นไร */ }
}
// เข้าหน้าหลักได้ไหม (เข้าสู่ระบบแล้ว หรือเลือกเล่นแบบไม่ลงทะเบียน)
export const isLoggedIn = () => !!getCurrentUserId() || isGuest();

// ที่อยู่ปลายทางหลังเข้าสู่ระบบ: รับเฉพาะไฟล์ในแอปเดียวกัน (กันลิงก์พาออกไปเว็บอื่น)
export function safeNext(raw, fallback = 'index.html#home') {
  if (!raw || /^[a-z][a-z0-9+.-]*:/i.test(raw) || raw.startsWith('//') || raw.includes('\\')) return fallback;
  return raw;
}
