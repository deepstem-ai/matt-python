// ============================================================
// contrast-tests.js — ชุดทดสอบ contrastRatio ด้วยค่าที่รู้คำตอบแน่นอน
// ใช้ได้ 2 ทาง: กดปุ่ม "รันการทดสอบ" ในหน้า style.html หรือรัน  node js/contrast.test.mjs
// (รหัสสีในไฟล์นี้เป็น "ข้อมูลทดสอบ" ไม่ใช่สีของหน้าจอ จึงเขียนตรง ๆ ได้)
// ============================================================
import { contrastRatio, parseColor, toHex, passes, blend } from './contrast.js';

// รายการทดสอบ: [ชื่อ, ฟังก์ชันที่คืน true ถ้าผ่าน]
export const TESTS = [
  ['ดำกับขาว = 21:1', () => Math.abs(contrastRatio('#000000', '#FFFFFF') - 21) < 0.01],
  ['สีเดียวกัน = 1:1', () => Math.abs(contrastRatio('#22D3EE', '#22D3EE') - 1) < 1e-9],
  ['สลับลำดับได้ผลเท่ากัน', () => contrastRatio('#0B1020', '#F8FAFC') === contrastRatio('#F8FAFC', '#0B1020')],
  ['#777777 บนขาว ≈ 4.48 (ไม่ผ่านนิดเดียว)', () => Math.abs(contrastRatio('#777777', '#FFFFFF') - 4.48) < 0.01],
  ['#767676 บนขาว ≈ 4.54 (ผ่านพอดี)', () => Math.abs(contrastRatio('#767676', '#FFFFFF') - 4.54) < 0.01],
  ['ตัวอักษรหลักบนพื้นหลัง ผ่าน 4.5', () => passes('#F8FAFC', '#0B1020')],
  ['ตัวอักษรรองบนพื้นหลัง ผ่าน 4.5', () => passes('#94A3B8', '#0B1020')],
  ['สีเทากลาง #6B7280 บนพื้นมืด ไม่ผ่าน (สีต้องห้าม)', () => !passes('#6B7280', '#0B1020')],
  ['อ่าน #abc แบบย่อได้', () => toHex('#abc') === '#AABBCC'],
  ['อ่าน rgb(34, 211, 238) ได้', () => toHex('rgb(34, 211, 238)') === '#22D3EE'],
  ['อ่าน rgb(34 211 238 / 50%) ได้', () => parseColor('rgb(34 211 238 / 50%)').a === 0.5],
  ['อ่าน color(srgb 1 0 0) ได้', () => toHex('color(srgb 1 0 0)') === '#FF0000'],
  ['ผสมขาวโปร่ง 50% บนดำ = เทา', () => toHex(blend({ r: 255, g: 255, b: 255, a: 0.5 }, { r: 0, g: 0, b: 0 })) === '#808080'],
  ['สีผิดรูปแบบ ต้องแจ้ง error', () => { try { contrastRatio('ไม่ใช่สี', '#fff'); return false; } catch { return true; } }],
];

export function runTests() {
  return TESTS.map(([name, fn]) => {
    let ok = false, error = '';
    try { ok = !!fn(); } catch (e) { error = e.message; }
    return { name, ok, error };
  });
}

