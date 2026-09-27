// ============================================================
// contrast.test.mjs — ตัวรันทดสอบด้วย node
// วิธีรัน (ในโฟลเดอร์แลป):  node js/contrast.test.mjs
// ============================================================
import { runTests } from './contrast-tests.js';

const res = runTests();
res.forEach((r) => console.log((r.ok ? 'ผ่าน  ' : 'ไม่ผ่าน') + '  ' + r.name + (r.error ? ' (' + r.error + ')' : '')));
const bad = res.filter((r) => !r.ok).length;
console.log(`\nรวม ${res.length} ข้อ ผ่าน ${res.length - bad} ข้อ`);
process.exit(bad ? 1 : 0);
