// ============================================================
// user-picker.js — บอกว่า "ตอนนี้ใครกำลังใช้งาน" บนหน้าประวัติ / กราฟ / ความสำเร็จ / ปรับเทียบ (แอปรวม v2)
// ในแลป 26-29 ไฟล์นี้เป็นกล่องเลือกผู้ใช้ (แทนการล็อกอิน)
// ในแอปรวมมีการเข้าสู่ระบบจริง (ใบหน้า + PIN) แล้ว จึงห้ามสลับคนตรงนี้ (ไม่งั้นใครก็ดูข้อมูลสุขภาพคนอื่นได้)
//   - เข้าสู่ระบบอยู่ → แสดงชื่อ + ปุ่ม "เปลี่ยนผู้ใช้" (พาไปหน้าเข้าสู่ระบบ)
//   - โหมดไม่ลงทะเบียน (guest) → ข้อมูลเก็บไว้ใต้ชื่อ 'guest' ของเครื่องนี้ + ปุ่มเข้าสู่ระบบ
// ชื่อฟังก์ชันเหมือนเดิม (mountUserPicker, currentUid, userName) โค้ดหน้าอื่นไม่ต้องแก้
// ============================================================
import { getUser, getCurrentUserId } from './db.js';
import { esc } from './ui.js';

export const currentUid = () => getCurrentUserId() || 'guest';
export const userName = (u) => (u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.id : 'ผู้เล่นรับเชิญ (guest)');

// วาดชื่อผู้ใช้ปัจจุบันลงใน host · onChange ไม่ถูกเรียก (เปลี่ยนคนต้องผ่านหน้าเข้าสู่ระบบ)
export async function mountUserPicker(host, onChange = () => {}) {
  const uid = currentUid();
  let u = null;
  if (uid !== 'guest') { try { u = await getUser(uid); } catch { /* อ่านไม่ได้ → แสดงรหัส */ } }
  const back = encodeURIComponent(location.pathname.split('/').pop() + location.search);
  host.innerHTML = `<span class="chip">👤 ${esc(u ? userName(u) : uid === 'guest' ? userName(null) : uid)}</span>
    <a class="btn-glow ghost small" href="login.html?next=${back}">${uid === 'guest' ? '🔐 เข้าสู่ระบบ' : '🔄 เปลี่ยนผู้ใช้'}</a>`;
  void onChange;
  return uid;
}
