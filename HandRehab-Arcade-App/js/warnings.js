// ============================================================
// warnings.js — ข้อความเตือนภาษาไทย "บอกวิธีแก้เสมอ" + ภาพตัวอย่างท่าที่ถูก (Lab 14)
// ทุกข้อความขึ้นต้นด้วยปัญหา แล้วตามด้วยสิ่งที่ต้องทำ ห้ามบอกแค่ว่าผิด
// ============================================================

const DIR_TH = { left: 'ไปทางซ้าย', right: 'ไปทางขวา', up: 'ขึ้นด้านบน', down: 'ลงด้านล่าง' };
const DIR_ICON = { left: '⬅', right: '➡', up: '⬆', down: '⬇' };

// code → { icon, text }
export const MESSAGES = {
  noface: { icon: '🙂', text: 'ยังไม่พบใบหน้า — ขยับหน้าเข้ามาในกรอบวงรี' },
  far: { icon: '🔍', text: 'อยู่ไกลเกินไป — ขยับเข้ามาใกล้กล้องอีกนิด' },
  close: { icon: '↔', text: 'ใกล้เกินไป — ถอยห่างจากกล้องเล็กน้อย' },
  dark: { icon: '💡', text: 'ห้องมืดเกินไป — เปิดไฟเพิ่ม หรือหันหน้าเข้าหาหน้าต่าง' },
  harsh: { icon: '☀', text: 'แสงแรงเกินไป — ขยับออกจากแสงที่ส่องเข้ากล้องหรือส่องหน้าตรง ๆ' },
  flat: { icon: '🌫', text: 'ภาพซีด/ย้อนแสง — อย่าให้หน้าต่างอยู่ข้างหลัง ให้แสงส่องมาจากด้านหน้า' },
  blur: { icon: '📷', text: 'ภาพเบลอ — นิ่งไว้สักครู่ และเช็ดเลนส์กล้อง' },
  tilt: { icon: '📐', text: 'ศีรษะเอียง — ตั้งศีรษะให้ตรง ตาสองข้างอยู่ระดับเดียวกัน' },
  faceFront: { icon: '⬤', text: 'ยังไม่ตรงท่า — หันหน้าตรงมองกล้อง' },
  turnLeft: { icon: '◀', text: 'ท่านี้ต้องหันซ้าย — หันหน้าไปทางซ้ายของคุณอีกนิด' },
  turnRight: { icon: '▶', text: 'ท่านี้ต้องหันขวา — หันหน้าไปทางขวาของคุณอีกนิด' },
  lookUp: { icon: '▲', text: 'ท่านี้ต้องเงยหน้า — เงยหน้าขึ้นเล็กน้อย' },
  lookDown: { icon: '▼', text: 'ท่านี้ต้องก้มหน้า — ก้มหน้าลงเล็กน้อย' },
  lessTurn: { icon: '↺', text: 'หันมากเกินไป — หันกลับมาทางกล้องครึ่งหนึ่ง' },
  ready: { icon: '✅', text: 'ดีมาก! นิ่งไว้ กำลังนับถอยหลัง…' },
};

// ข้อความ "หน้าอยู่นอกกรอบ" ต้องบอกทิศจริง
export function outsideMessage(dir) {
  return { icon: DIR_ICON[dir] || '⬤', text: `หน้าอยู่นอกกรอบ — ขยับ${DIR_TH[dir] || 'เข้ากลางกรอบ'}` };
}

// เลือกข้อความเดียวที่สำคัญที่สุดตอนนี้  info = { state, guide, problems, poseHint }
export function pickMessage(info) {
  if (info.state === 'none') return { code: 'noface', ...MESSAGES.noface };
  if (info.guide?.size) return { code: info.guide.size, ...MESSAGES[info.guide.size] };
  if (info.guide && !info.guide.inside) return { code: 'out-' + info.guide.dir, ...outsideMessage(info.guide.dir) };
  const p = info.problems?.[0];
  if (p) return { code: p, ...MESSAGES[p] };
  if (info.poseHint) return { code: info.poseHint, ...MESSAGES[info.poseHint] };
  return { code: 'ready', ...MESSAGES.ready };
}

// คำแนะนำยาวสำหรับ modal เมื่อปัญหาเดิมค้างนาน
const LONG_TIPS = {
  noface: 'นั่งตรงหน้ากล้อง ห่างประมาณหนึ่งช่วงแขน ให้ใบหน้าทั้งหมดอยู่ในวงรี',
  far: 'ขยับเก้าอี้เข้าใกล้จอ จนใบหน้าเกือบเต็มวงรี (ประมาณครึ่งแขน ถึงหนึ่งช่วงแขน)',
  close: 'ถอยหลังจนเห็นคางและหน้าผากอยู่ในวงรีครบ',
  dark: 'เปิดไฟเพดาน หรือหันหน้าเข้าหาหน้าต่าง ถ่ายในที่มืดจะทำให้ล็อกอินยากในภายหลัง',
  harsh: 'อย่าให้แสงแดดหรือโคมไฟส่องเข้าเลนส์ ใช้แสงนุ่ม ๆ จากด้านหน้า',
  flat: 'ถ้ามีหน้าต่างอยู่ข้างหลัง ให้หมุนเก้าอี้หันหน้าเข้าหาหน้าต่างแทน',
  blur: 'วางข้อศอกบนโต๊ะ นิ่งไว้ 3 วินาที และเช็ดเลนส์กล้องด้วยผ้านุ่ม',
  tilt: 'นั่งหลังตรง มองตรงไปที่กล้อง ตาสองข้างอยู่ระดับเดียวกับเส้นแนวนอนในภาพ',
};
export function longTip(code) {
  if (code?.startsWith('out-')) return 'ขยับตัวจนจุดกึ่งกลางใบหน้า (ปลายจมูก) อยู่ตรงกลางวงรี';
  return LONG_TIPS[code] || 'ทำตามภาพตัวอย่าง: หน้าตรง อยู่กลางวงรี แสงสว่างจากด้านหน้า';
}

// ภาพตัวอย่างท่าที่ถูกต้อง (SVG วาดเอง สีอ่านจาก CSS variable ไม่ฮาร์ดโค้ด)
export function exampleSVG() {
  return `<svg viewBox="0 0 240 200" width="100%" style="max-width:320px;display:block;margin:0 auto" role="img" aria-label="ภาพตัวอย่างท่าที่ถูกต้อง">
  <rect x="1" y="1" width="238" height="198" rx="16" style="fill:var(--input);stroke:var(--line)"/>
  <g style="stroke:var(--warning);stroke-width:3;fill:none">
    <circle cx="36" cy="36" r="12" style="fill:var(--warning)"/>
    <path d="M36 14v-6M36 64v-6M14 36h-6M64 36h-6M20 20l-4-4M52 52l4 4M52 20l4-4M20 52l-4 4"/>
  </g>
  <text x="36" y="80" text-anchor="middle" style="fill:var(--text-2);font-size:10px">แสงด้านหน้า</text>
  <ellipse cx="150" cy="90" rx="56" ry="76" style="fill:none;stroke:var(--success);stroke-width:4;stroke-dasharray:10 7"/>
  <ellipse cx="150" cy="92" rx="36" ry="48" style="fill:var(--card);stroke:var(--text);stroke-width:3"/>
  <line x1="108" y1="82" x2="192" y2="82" style="stroke:var(--sky);stroke-width:1.5;stroke-dasharray:4 4"/>
  <circle cx="136" cy="82" r="5" style="fill:var(--text)"/><circle cx="164" cy="82" r="5" style="fill:var(--text)"/>
  <path d="M150 88v13h-6" style="fill:none;stroke:var(--text);stroke-width:3;stroke-linecap:round"/>
  <path d="M137 114q13 9 26 0" style="fill:none;stroke:var(--text);stroke-width:3;stroke-linecap:round"/>
  <text x="120" y="190" text-anchor="middle" style="fill:var(--success);font-size:12px;font-weight:700">หน้าตรง · กลางกรอบ · ตาระดับเดียวกัน</text>
</svg>`;
}
