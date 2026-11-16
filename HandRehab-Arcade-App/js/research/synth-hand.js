// ============================================================
// synth-hand.js — สร้าง "มือจำลอง" 21 จุด ด้วยคณิตศาสตร์ล้วน (ไม่ใช้กล้อง) · รวม Lab 16–21 + Lab 31–32
// ใช้ทำ: โหมดสาธิตเมื่อไม่มีกล้อง, ทดสอบ geometry / gestures / rep-counter ด้วย node
// พิกัดที่ได้ "ทุกแกนหน่วยเดียวกัน" (เหมือน hand.sq) หน่วย = ความสูงภาพ
// ห้ามแตะ: หน้าจอ กล้อง นาฬิกา
// ============================================================

// synthHand({ curls, spread, scale, cx, cy, pinch, wrist })
//   curls  = { thumb, index, middle, ring, little } ค่า 0 (เหยียด) .. 1 (งอสุด)
//   spread = มุมกางระหว่างนิ้วติดกัน (องศา)
//   scale  = ขนาดฝ่ามือ (ระยะข้อมือ→โคนนิ้วกลาง) เทียบความสูงภาพ  ยิ่งมาก = มือยิ่งใกล้กล้อง
//   cx, cy = ตำแหน่งข้อมือ
//   pinch  = true/false หรือ 0..1 (ค่อย ๆ พาปลายนิ้วโป้งไปแตะปลายนิ้วชี้)
//   wrist  = มุมงอข้อมือ (องศา) บวก = งอเข้าหากล้อง (flex), ลบ = เหยียดไปด้านหลัง (extend)
export function synthHand({ curls = {}, spread = 8, scale = 0.2, cx = 0.5, cy = 0.75, pinch = false, wrist = 0 } = {}) {
  const P = Array.from({ length: 21 }, () => ({ x: 0, y: 0, z: 0 }));
  P[0] = { x: cx, y: cy, z: 0 };
  const names = ['index', 'middle', 'ring', 'little'];
  const baseX = [-0.35, -0.1, 0.12, 0.33], baseY = [-0.95, -1.0, -0.95, -0.85];
  const lens = [[0.45, 0.28, 0.22], [0.5, 0.32, 0.24], [0.46, 0.3, 0.22], [0.36, 0.23, 0.2]];
  names.forEach((f, k) => {
    const b = 5 + k * 4;
    P[b] = { x: cx + baseX[k] * scale, y: cy + baseY[k] * scale, z: 0 };
    const dir = ((-90 + (k - 1.5) * spread) * Math.PI) / 180; // ชี้ขึ้น กางตาม spread
    const c = curls[f] || 0;
    let cur = P[b];
    for (let s = 0; s < 3; s++) {
      // งอเข้าหาฝ่ามือ (แกน z เข้าหากล้อง)
      const bend = ((c * 80 * Math.PI) / 180) * (s + 1);
      const L = lens[k][s] * scale;
      cur = { x: cur.x + Math.cos(dir) * L * Math.cos(bend), y: cur.y + Math.sin(dir) * L * Math.cos(bend), z: cur.z - L * Math.sin(bend) };
      P[b + 1 + s] = cur;
    }
  });
  // นิ้วโป้ง
  const tc = curls.thumb || 0;
  P[1] = { x: cx - 0.25 * scale, y: cy - 0.2 * scale, z: 0 };
  let cur = P[1];
  const dir = (-140 * Math.PI) / 180;
  for (let s = 0; s < 3; s++) {
    const bend = ((tc * 60 * Math.PI) / 180) * (s + 1);
    const L = 0.3 * scale;
    cur = { x: cur.x + Math.cos(dir) * L * Math.cos(bend), y: cur.y + Math.sin(dir) * L * Math.cos(bend), z: cur.z - L * Math.sin(bend) };
    P[2 + s] = cur;
  }
  // จีบนิ้ว: เลื่อนปลายนิ้วโป้ง (4) ไปหาปลายนิ้วชี้ (8) ตามสัดส่วน k
  const k = pinch === true ? 1 : Math.max(0, Math.min(1, +pinch || 0));
  if (k > 0) {
    const target = { x: P[8].x + 0.01 * scale, y: P[8].y, z: P[8].z };
    P[4] = { x: P[4].x + (target.x - P[4].x) * k, y: P[4].y + (target.y - P[4].y) * k, z: P[4].z + (target.z - P[4].z) * k };
    // ข้อ 3 ขยับตามครึ่งหนึ่งให้ดูเป็นธรรมชาติ
    P[3] = { x: P[3].x + (target.x - P[3].x) * k * 0.4, y: P[3].y + (target.y - P[3].y) * k * 0.4, z: P[3].z + (target.z - P[3].z) * k * 0.4 };
  }
  // งอข้อมือ: หมุนทุกจุดรอบข้อมือ (P0) ตามแกน x
  if (wrist) {
    const a = (wrist * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
    for (let i = 1; i < 21; i++) {
      const dy = P[i].y - cy, dz = P[i].z;
      P[i] = { x: P[i].x, y: cy + dy * c - dz * s, z: dy * s + dz * c };
    }
  }
  return P;
}

// ย้ายมือทั้งมือ (ใช้วางจุดโคนนิ้วกลางไว้ที่ตำแหน่งเมาส์)
export function moveHand(P, dx, dy) {
  return P.map((p) => ({ x: p.x + dx, y: p.y + dy, z: p.z }));
}

// แปลงจากพิกัดหน่วยเดียวกัน (sq) กลับเป็นพิกัดภาพ 0-1 แบบที่ MediaPipe ให้ (ใช้วาด)
export function toImagePoints(sq, aspect) {
  return sq.map((p) => ({ x: p.x / aspect, y: p.y, z: p.z / aspect }));
}

// ท่าตัวอย่างสำหรับโหมดสาธิต (ชื่อภาษาไทย → ค่าที่ส่งให้ synthHand)
export const PRESETS = {
  'แบมือ': { spread: 14 },
  'กำมือ': { curls: { index: 1, middle: 1, ring: 1, little: 1, thumb: 0.6 } },
  'จีบนิ้ว': { pinch: true, spread: 8 },
  'ชูสองนิ้ว': { curls: { ring: 1, little: 1, thumb: 0.8 }, spread: 14 },
  'ชี้นิ้ว': { curls: { middle: 1, ring: 1, little: 1, thumb: 0.8 } },
  'ร็อก': { curls: { middle: 1, ring: 1, thumb: 0.8 }, spread: 10 },
};

// ตัวสุ่มที่กำหนดค่าเริ่มได้ (seed เดิม = ผลเดิมทุกครั้ง) ใช้แยกชุดฝึกกับชุดทดสอบให้ต่างกันจริง
export function makeRng(seed = 1) {
  let s = (seed >>> 0) || 1;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
// สุ่มแบบระฆังคว่ำ (Gaussian) ค่าเฉลี่ย 0 ส่วนเบี่ยงเบน 1
export function gauss(rnd) { return Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd()); }

// หมุนมือรอบข้อมือ (องศา) ในระนาบภาพ
// aspect = 1 (ค่าเริ่มต้น) สำหรับจุดสัดส่วนจริง (sq) · ใส่ 16/9 เฉพาะเมื่อหมุนจุดดิบแบบภาพกล้อง
export function rotateHand(pts, deg, aspect = 1) {
  const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a), o = pts[0];
  return pts.map((p) => {
    const x = (p.x - o.x) * aspect, y = p.y - o.y;
    return { x: o.x + (x * c - y * s) / aspect, y: o.y + x * s + y * c, z: p.z };
  });
}

// สร้างมือของท่า params แบบ "ไม่เหมือนกันเป๊ะ": ขนาด ตำแหน่ง มุมหมุน ความงอ และสัญญาณรบกวน
// noise = ส่วนเบี่ยงเบนของความคลาดเคลื่อนแต่ละจุด (หน่วย: เท่าของขนาดมือ) แสงน้อย → noise มาก
// แอปรวม: ผลลัพธ์เป็นพิกัด "สัดส่วนจริง" แบบเดียวกับ hand.sq (aspect = 1) ป้อน geometry/gestures/kNN ได้ทันที
//         (Lab 31–32 เดิมสร้างเป็นจุดดิบภาพ 16:9 — ตอนนี้ใช้ sq ทั้งกล้องจริงและมือจำลอง จึงเทียบกันได้ตรง)
export function variedHand(params, rnd = Math.random, { noise = 0.02, rotate = 12, extraRotate = 0, aspect = 1 } = {}) {
  const j = (v, amt) => Math.max(0, Math.min(1, v + (rnd() - 0.5) * 2 * amt));
  const curls = Object.fromEntries(Object.entries(params.curls || {}).map(([k, v]) => [k, j(v, 0.08)]));
  const scale = 0.12 + rnd() * 0.16;
  let pts = synthHand({ ...params, curls, spread: (params.spread ?? 8) + (rnd() - 0.5) * 6, scale, cx: 0.35 + rnd() * 0.3, cy: 0.62 + rnd() * 0.18 });
  pts = rotateHand(pts, (rnd() - 0.5) * 2 * rotate + extraRotate, aspect);
  return pts.map((p) => ({ x: p.x + gauss(rnd) * noise * scale, y: p.y + gauss(rnd) * noise * scale, z: p.z + gauss(rnd) * noise * scale }));
}

// แปลงจุดสัดส่วนจริง (sq, ข้อมือราว x 0.35–0.65) → พิกัดภาพ 0-1 สำหรับวาดบน canvas กว้าง/สูง = aspect
// เลื่อนให้อยู่กลางภาพก่อน (การเลื่อนไม่เปลี่ยนตัวเลขที่ AI ใช้ เพราะทุกค่าเป็นระยะ/มุม)
export function toDrawPoints(sq, aspect) {
  const dx = (aspect - 1) / 2;
  return sq.map((p) => ({ x: (p.x + dx) / aspect, y: p.y, z: p.z / aspect }));
}
