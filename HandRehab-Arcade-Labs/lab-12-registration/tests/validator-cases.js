// ============================================================
// validator-cases.js — ชุดกรณีทดสอบเดียว ใช้ทั้งใน node และใน tests.html
// เพิ่มวันเกิดจริงของสมาชิกทีมลงใน TEAM ด้านล่าง แล้วตรวจกับอายุที่รู้อยู่แล้ว
// ============================================================
import { validateName, toChristianYear, calcAge, validateBirthDate, validatePhone, daysInMonth, formatPhone } from '../js/validators.js';

// "วันนี้" สมมติ ให้ผลทดสอบเหมือนเดิมทุกวัน
const TODAY = '2026-09-27';

// สมาชิกทีม (แก้เป็นวันเกิดจริงของทีมคุณ) — [ชื่อ, วันเกิด ค.ศ., อายุที่ถูกต้องในวัน TODAY]
const TEAM = [
  ['สมาชิก 1', '2009-03-15', 17],
  ['สมาชิก 2', '2008-11-02', 17],
  ['สมาชิก 3', '2010-09-27', 16], // วันเกิดคือวันนี้พอดี
];

// แต่ละกรณี: [ชื่อกรณี, ฟังก์ชันที่คืนค่าจริง, ค่าที่ควรได้]
export const CASES = [
  // --- ชื่อ ---
  ['ชื่อไทยปกติ', () => validateName('สมชาย').ok, true],
  ['ชื่ออังกฤษปกติ', () => validateName('John').ok, true],
  ['ชื่อมีวรรณยุกต์/สระ', () => validateName('ปิ่นมณี').ok, true],
  ['ชื่อมีขีด', () => validateName('Mary-Jane').ok, true],
  ['ชื่อ 1 ตัวอักษร', () => validateName('ก').ok, false],
  ['ชื่อ 2 ตัวอักษร', () => validateName('Al').ok, true],
  ['ชื่อมีตัวเลข', () => validateName('สมชาย2').ok, false],
  ['ชื่อมีเลขไทย', () => validateName('สมชาย๒').ok, false],
  ['ชื่อยาว 51 ตัว', () => validateName('a'.repeat(51)).ok, false],
  ['ชื่อยาว 50 ตัว', () => validateName('a'.repeat(50)).ok, true],
  ['ชื่อว่าง', () => validateName('   ').ok, false],
  ['ชื่อมีอีโมจิ', () => validateName('Tom😀').ok, false],
  // --- พ.ศ. → ค.ศ. ---
  ['2510 พ.ศ. → 1967', () => toChristianYear(2510), 1967],
  ['2569 พ.ศ. → 2026', () => toChristianYear(2569), 2026],
  ['1967 ค.ศ. คงเดิม', () => toChristianYear(1967), 1967],
  ['ข้อความ "2500"', () => toChristianYear('2500'), 1957],
  // --- อายุ ---
  ['วันเกิดผ่านไปแล้วปีนี้', () => calcAge('1950-01-10', TODAY), 76],
  ['วันเกิดยังไม่ถึงปีนี้ (เดือนหน้า)', () => calcAge('1950-10-05', TODAY), 75],
  ['วันเกิดพรุ่งนี้', () => calcAge('1950-09-28', TODAY), 75],
  ['วันเกิดวันนี้', () => calcAge('1950-09-27', TODAY), 76],
  ['29 ก.พ. วันที่ 28 ก.พ. ปีไม่อธิกสุรทิน', () => calcAge('1960-02-29', '2027-02-28'), 66],
  ['29 ก.พ. วันที่ 1 มี.ค. ปีไม่อธิกสุรทิน', () => calcAge('1960-02-29', '2027-03-01'), 67],
  ['29 ก.พ. วันที่ 29 ก.พ. ปีอธิกสุรทิน', () => calcAge('1960-02-29', '2028-02-29'), 68],
  ...TEAM.map(([n, d, a]) => [`อายุ${n}`, () => calcAge(d, TODAY), a]),
  // --- วันเกิด ---
  ['วันเกิดปกติ', () => validateBirthDate('1955-06-15', TODAY).ok, true],
  ['วันเกิดในอนาคต', () => validateBirthDate('2026-12-01', TODAY).ok, false],
  ['พรุ่งนี้ถือว่าอนาคต', () => validateBirthDate('2026-09-28', TODAY).ok, false],
  ['อายุไม่ถึง 1 ปี', () => validateBirthDate('2026-01-01', TODAY).ok, false],
  ['อายุ 1 ปีพอดี', () => validateBirthDate('2025-09-27', TODAY).ok, true],
  ['อายุ 121 ปี', () => validateBirthDate('1905-01-01', TODAY).ok, false],
  ['อายุ 120 ปี', () => validateBirthDate('1906-01-01', TODAY).ok, true],
  ['31 เมษายน (ไม่มีจริง)', () => validateBirthDate('1970-04-31', TODAY).ok, false],
  ['29 ก.พ. ปีไม่อธิกสุรทิน', () => validateBirthDate('1961-02-29', TODAY).ok, false],
  ['29 ก.พ. ปีอธิกสุรทิน', () => validateBirthDate('1960-02-29', TODAY).ok, true],
  ['ข้อมูลไม่ครบ', () => validateBirthDate('', TODAY).ok, false],
  ['ก.พ. 1900 มี 28 วัน', () => daysInMonth(1900, 2), 28],
  ['ก.พ. 2000 มี 29 วัน', () => daysInMonth(2000, 2), 29],
  // --- เบอร์โทร ---
  ['081-234-5678', () => validatePhone('081-234-5678').ok, true],
  ['0912345678', () => validatePhone('0912345678').ok, true],
  ['06 1234 5678 (ช่องว่าง)', () => validatePhone('06 1234 5678').ok, true],
  ['02-123-4567 (บ้าน)', () => validatePhone('02-123-4567').ok, false],
  ['081234567 (9 หลัก)', () => validatePhone('081234567').ok, false],
  ['08123456789 (11 หลัก)', () => validatePhone('08123456789').ok, false],
  ['+66812345678', () => validatePhone('+66812345678').ok, false],
  ['มีตัวอักษร', () => validatePhone('08l2345678').ok, false],
  ['ว่าง', () => validatePhone('').ok, false],
  ['จัดรูปเบอร์', () => formatPhone('0812345678'), '081-234-5678'],
];

// รันทุกกรณี คืน [{ name, actual, expect, pass }]
export function runCases() {
  return CASES.map(([name, fn, expect]) => {
    let actual;
    try { actual = fn(); } catch (e) { actual = 'ERROR: ' + e.message; }
    return { name, actual, expect, pass: Object.is(actual, expect) };
  });
}
