// ============================================================
// validators.test.mjs — ทดสอบ validators.js ด้วย node โดยไม่ต้องเปิดเบราว์เซอร์
// วิธีรัน (ในโฟลเดอร์แลป):  node tests/validators.test.mjs
// ============================================================
import { runCases } from './validator-cases.js';

const results = runCases();
let fail = 0;
for (const r of results) {
  if (!r.pass) fail++;
  console.log(`${r.pass ? '✔ ผ่าน ' : '✘ ไม่ผ่าน'}  ${r.name}  → ได้ ${JSON.stringify(r.actual)}${r.pass ? '' : ` (ควรได้ ${JSON.stringify(r.expect)})`}`);
}
console.log(`\nสรุป: ผ่าน ${results.length - fail}/${results.length} กรณี`);
process.exitCode = fail ? 1 : 0;
