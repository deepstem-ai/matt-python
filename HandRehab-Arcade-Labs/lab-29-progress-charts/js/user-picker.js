// ============================================================
// user-picker.js — เลือกผู้เล่น (แทนการล็อกอินด้วยใบหน้าในแลปนี้) (Lab 26-29)
// เก็บผู้ใช้ปัจจุบันใน sessionStorage ผ่าน setCurrentUser() เหมือนหน้าล็อกอินจริง
// ไม่มีผู้ใช้ในฐานข้อมูล → ใช้ 'guest' และมีปุ่มสร้างผู้ใช้ทดลองได้
// ============================================================
import { listUsers, createUser, setCurrentUser, getCurrentUserId } from './db.js';
import { esc, toast } from './ui.js';

export const currentUid = () => getCurrentUserId() || 'guest';
export const userName = (u) => (u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.id : 'ผู้เล่นรับเชิญ (guest)');

// วาดตัวเลือกผู้ใช้ลงใน host แล้วเรียก onChange(uid) เมื่อเปลี่ยน
export async function mountUserPicker(host, onChange = () => {}) {
  let users = [];
  try { users = await listUsers(); }
  catch (e) { toast('อ่านรายชื่อผู้ใช้ไม่ได้: ' + e.message, 'error', 5); }
  const cur = currentUid();
  host.innerHTML = `<label class="row" style="gap:var(--sp-2)">👤 ผู้เล่น
      <select id="userSel" aria-label="เลือกผู้เล่น">
        <option value="guest">ผู้เล่นรับเชิญ (guest)</option>
        ${users.map((u) => `<option value="${esc(u.id)}" ${u.id === cur ? 'selected' : ''}>${esc(userName(u))}</option>`).join('')}
      </select></label>
    <button id="addDemoUser" class="btn-glow ghost small" title="สร้างผู้ใช้ทดลองสำหรับสาธิต">➕ ผู้ใช้ทดลอง</button>`;
  const sel = host.querySelector('#userSel');
  sel.onchange = () => { setCurrentUser(sel.value === 'guest' ? null : sel.value); onChange(currentUid()); };
  host.querySelector('#addDemoUser').onclick = async () => {
    try {
      const n = users.length + 1;
      const u = await createUser({ firstName: 'ผู้ทดลอง', lastName: 'คนที่ ' + n, sex: 'other', hand: 'right', conditions: [], tremor: 0, extra: { demo: true } });
      setCurrentUser(u.id);
      await mountUserPicker(host, onChange);
      onChange(u.id);
      toast('สร้างผู้ใช้ทดลองแล้ว', 'success');
    } catch (e) { toast('สร้างผู้ใช้ไม่สำเร็จ: ' + e.message, 'error', 5); }
  };
  return cur;
}
