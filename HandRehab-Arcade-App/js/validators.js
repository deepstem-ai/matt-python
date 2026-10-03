// ============================================================
// validators.js — ฟังก์ชันตรวจข้อมูลล้วน ๆ (Lab 12)
// กฎ: ไม่แตะหน้าจอเลย (ไม่มี document / window) จึงทดสอบด้วย node ได้โดยไม่ต้องเปิดแอป
// ทุกฟังก์ชัน validate* คืน { ok: true/false, msg: 'ข้อความภาษาไทยบอกวิธีแก้' }
// ============================================================

// ชื่อเดือนภาษาไทย (ใช้ใน dropdown วันเกิด) index 0 = มกราคม
export const THAI_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

export const BE_OFFSET = 543; // พ.ศ. = ค.ศ. + 543

// ---------- ชื่อ / นามสกุล ----------
// ไทยหรืออังกฤษ 2-50 ตัวอักษร ห้ามมีตัวเลข (ทั้งเลขอารบิกและเลขไทย ๐-๙)
// ยอมให้มีช่องว่าง จุด ขีด และ ' ได้ (เช่น "Mary-Jane", "O'Neil", "ณ อยุธยา")
export function validateName(value) {
  const s = String(value ?? '').trim().replace(/\s+/g, ' ');
  if (!s) return { ok: false, msg: 'กรุณากรอกชื่อ' };
  if (/[0-9๐-๙]/.test(s)) return { ok: false, msg: 'ชื่อต้องไม่มีตัวเลข' };
  if ([...s].length < 2) return { ok: false, msg: 'ชื่อสั้นเกินไป (อย่างน้อย 2 ตัวอักษร)' };
  if ([...s].length > 50) return { ok: false, msg: 'ชื่อยาวเกินไป (ไม่เกิน 50 ตัวอักษร)' };
  if (!/^[A-Za-z฀-๏\s.'-]+$/.test(s)) return { ok: false, msg: 'ใช้ได้เฉพาะตัวอักษรไทยหรืออังกฤษ' };
  if (!/[A-Za-zก-ฮ]/.test(s)) return { ok: false, msg: 'ชื่อต้องมีตัวอักษรอย่างน้อย 1 ตัว' };
  return { ok: true, msg: '' };
}

// ---------- ปี พ.ศ. → ค.ศ. ----------
// ปีที่มากกว่า 2400 ถือว่าเป็น พ.ศ. (พ.ศ. 2400 = ค.ศ. 1857) → ลบ 543
// ถ้าเป็น ค.ศ. อยู่แล้ว คืนค่าเดิม
export function toChristianYear(year) {
  const y = Number(year);
  if (!Number.isFinite(y)) return NaN;
  return y > 2400 ? y - BE_OFFSET : y;
}
export const toBuddhistYear = (ceYear) => Number(ceYear) + BE_OFFSET;

// ---------- ปฏิทิน ----------
export const isLeapYear = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
// จำนวนวันในเดือน (month 1-12)
export function daysInMonth(year, month) {
  return [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] || 0;
}

// แยก 'YYYY-MM-DD' เป็นตัวเลข (ไม่ใช้ new Date(string) เพราะเขตเวลาทำให้วันเลื่อนได้)
function parts(date) {
  if (date instanceof Date) return { y: date.getFullYear(), m: date.getMonth() + 1, d: date.getDate() };
  if (typeof date === 'object' && date) return { y: +date.y, m: +date.m, d: +date.d };
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(String(date || ''));
  return m ? { y: +m[1], m: +m[2], d: +m[3] } : null;
}

// สร้างข้อความ 'YYYY-MM-DD' (ค.ศ.) จากปี เดือน วัน
export function toISODate(y, m, d) {
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// ---------- คำนวณอายุ ----------
// อายุ = ปีนี้ - ปีเกิด แล้วลบ 1 ถ้าวันเกิดของปีนี้ยังมาไม่ถึง (จุดที่คนลืมบ่อยที่สุด)
// คนเกิด 29 ก.พ.: ในปีที่ไม่มี 29 ก.พ. ถือว่าครบรอบวันที่ 1 มี.ค. (วันที่ 28 ก.พ. ยังไม่ครบ)
export function calcAge(birthDate, today = new Date()) {
  const b = parts(birthDate), t = parts(today);
  if (!b || !t) return NaN;
  let age = t.y - b.y;
  if (t.m < b.m || (t.m === b.m && t.d < b.d)) age--;
  return age;
}

// ---------- วันเกิด ----------
// ต้องเป็นวันที่มีจริง (เช่น 31 เม.ย. ไม่มี), ไม่อยู่ในอนาคต, อายุ 1-120 ปี
export function validateBirthDate(birthDate, today = new Date()) {
  const b = parts(birthDate);
  if (!b || !b.y || !b.m || !b.d) return { ok: false, msg: 'กรุณาเลือกวัน เดือน และปีเกิดให้ครบ' };
  if (b.m < 1 || b.m > 12 || b.d < 1 || b.d > daysInMonth(b.y, b.m)) return { ok: false, msg: 'ไม่มีวันที่นี้ในปฏิทิน' };
  const t = parts(today);
  const future = b.y > t.y || (b.y === t.y && (b.m > t.m || (b.m === t.m && b.d > t.d)));
  if (future) return { ok: false, msg: 'วันเกิดต้องไม่อยู่ในอนาคต' };
  const age = calcAge(b, t);
  if (age < 1) return { ok: false, msg: 'อายุต้องอย่างน้อย 1 ปี' };
  if (age > 120) return { ok: false, msg: 'อายุเกิน 120 ปี กรุณาตรวจปีเกิด (เลือก พ.ศ./ค.ศ. ถูกไหม)' };
  return { ok: true, msg: '', age };
}

// ---------- เบอร์มือถือไทย ----------
// 10 หลัก ขึ้นต้นด้วย 06 08 หรือ 09 ยอมให้มีขีดหรือช่องว่างคั่น เช่น 081-234-5678
export function normalizePhone(value) { return String(value ?? '').replace(/[\s-]/g, ''); }
export function validatePhone(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return { ok: false, msg: 'กรุณากรอกเบอร์โทรศัพท์' };
  if (/[^0-9\s-]/.test(raw)) return { ok: false, msg: 'ใช้ได้เฉพาะตัวเลข ขีด และช่องว่าง' };
  const n = normalizePhone(raw);
  if (n.length !== 10) return { ok: false, msg: `เบอร์มือถือต้องมี 10 หลัก (ตอนนี้ ${n.length} หลัก)` };
  if (!/^0[689]\d{8}$/.test(n)) return { ok: false, msg: 'เบอร์มือถือไทยต้องขึ้นต้นด้วย 06, 08 หรือ 09' };
  return { ok: true, msg: '', value: n };
}

// จัดรูปเบอร์ให้อ่านง่าย 0812345678 → 081-234-5678
export function formatPhone(value) {
  const n = normalizePhone(value);
  return /^\d{10}$/.test(n) ? `${n.slice(0, 3)}-${n.slice(3, 6)}-${n.slice(6)}` : String(value ?? '');
}
