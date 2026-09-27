// ============================================================
// synth-hand.js — มือจำลอง 21 จุด สำหรับโหมดสาธิต/ทดสอบโดยไม่ต้องใช้กล้อง (Lab 31, 32)
// synthHand() สร้างมือจากค่าความงอของแต่ละนิ้ว, variedHand() สุ่มท่าให้ต่างกันเล็กน้อยเหมือนคนจริง
// ห้ามแตะ: กล้อง หน้าจอ ฐานข้อมูล (ฟังก์ชันบริสุทธิ์ ใช้ใน node ได้)
// ============================================================
// สร้างมือจำลอง 21 จุด: curls = {thumb..little: 0..1}, spreadDeg ระหว่างนิ้ว, scale, pinch (โป้งแตะชี้)
export function synthHand({ curls = {}, spread = 8, scale = 0.2, cx = 0.5, cy = 0.75, pinch = false } = {}) {
  const P = Array.from({ length: 21 }, () => ({ x: 0, y: 0, z: 0 }));
  P[0] = { x: cx, y: cy, z: 0 };
  const names = ['index', 'middle', 'ring', 'little'];
  const baseX = [-0.35, -0.1, 0.12, 0.33], baseY = [-0.95, -1.0, -0.95, -0.85];
  const lens = [[0.45, 0.28, 0.22], [0.5, 0.32, 0.24], [0.46, 0.3, 0.22], [0.36, 0.23, 0.2]];
  names.forEach((f, k) => {
    const b = 5 + k * 4;
    P[b] = { x: cx + baseX[k] * scale, y: cy + baseY[k] * scale, z: 0 };
    let dir = (-90 + (k - 1.5) * spread) * Math.PI / 180; // ชี้ขึ้น กางตาม spread
    const c = curls[f] || 0;
    let cur = P[b];
    for (let s = 0; s < 3; s++) {
      // งอเข้าหาฝ่ามือ (แกน z เข้ากล้อง + y ลง)
      const bend = c * 80 * Math.PI / 180 * (s + 1);
      const L = lens[k][s] * scale;
      const nx = cur.x + Math.cos(dir) * L * Math.cos(bend);
      const ny = cur.y + Math.sin(dir) * L * Math.cos(bend);
      const nz = cur.z - L * Math.sin(bend);
      cur = { x: nx, y: ny, z: nz };
      P[b + 1 + s] = cur;
    }
  });
  // นิ้วโป้ง
  const tc = curls.thumb || 0;
  P[1] = { x: cx - 0.25 * scale, y: cy - 0.2 * scale, z: 0 };
  let cur = P[1]; let dir = -140 * Math.PI / 180;
  for (let s = 0; s < 3; s++) {
    const bend = tc * 60 * Math.PI / 180 * (s + 1);
    const L = 0.3 * scale;
    cur = { x: cur.x + Math.cos(dir) * L * Math.cos(bend), y: cur.y + Math.sin(dir) * L * Math.cos(bend), z: cur.z - L * Math.sin(bend) };
    P[2 + s] = cur;
  }
  if (pinch) P[4] = { x: P[8].x + 0.01 * scale, y: P[8].y, z: P[8].z };
  return P;
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

// หมุนมือรอบข้อมือ (องศา) ในระนาบภาพ; aspect = กว้าง/สูง ของภาพ เพื่อให้มุมถูกต้องบนจอจริง
export function rotateHand(pts, deg, aspect = 1) {
  const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a), o = pts[0];
  return pts.map((p) => {
    const x = (p.x - o.x) * aspect, y = p.y - o.y;
    return { x: o.x + (x * c - y * s) / aspect, y: o.y + x * s + y * c, z: p.z };
  });
}

// สร้างมือของท่า params แบบ "ไม่เหมือนกันเป๊ะ": ขนาด ตำแหน่ง มุมหมุน ความงอ และสัญญาณรบกวน
// noise = ส่วนเบี่ยงเบนของความคลาดเคลื่อนแต่ละจุด (หน่วย: เท่าของขนาดมือ) แสงน้อย → noise มาก
export function variedHand(params, rnd = Math.random, { noise = 0.02, rotate = 12, extraRotate = 0, aspect = 1 } = {}) {
  const j = (v, amt) => Math.max(0, Math.min(1, v + (rnd() - 0.5) * 2 * amt));
  const curls = Object.fromEntries(Object.entries(params.curls || {}).map(([k, v]) => [k, j(v, 0.08)]));
  const scale = 0.12 + rnd() * 0.16;
  let pts = synthHand({ ...params, curls, spread: (params.spread ?? 8) + (rnd() - 0.5) * 6, scale, cx: 0.35 + rnd() * 0.3, cy: 0.62 + rnd() * 0.18 });
  pts = rotateHand(pts, (rnd() - 0.5) * 2 * rotate + extraRotate, aspect);
  return pts.map((p) => ({ x: p.x + gauss(rnd) * noise * scale, y: p.y + gauss(rnd) * noise * scale, z: p.z + gauss(rnd) * noise * scale }));
}
