// ============================================================
// synth-hand.js — มือจำลอง 21 จุด สำหรับโหมดสาธิต/ทดสอบเมื่อไม่มีกล้อง (Lab 27)
//   synthHand({ curls, spread, scale, cx, cy, pinch }) → 21 จุด (หน่วยเดียวกันทุกแกน เหมือน hand.sq)
//   demoHand(t, { gesture, amount, tremorLevel }) → มือจำลองที่ "ทำท่า" ได้ amount (0..1) + อาการสั่นจำลอง
// ============================================================
// สร้างมือจำลอง 21 จุด: curls = {thumb..little: 0..1}, spread = องศาระหว่างนิ้วติดกัน, scale, pinch (โป้งแตะชี้)
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

// ความแรงอาการสั่นจำลองของแต่ละระดับ (หน่วยความสูงภาพ) ระดับ 0-3
export const DEMO_TREMOR = [0.0015, 0.006, 0.011, 0.02];

// ผสมสองท่า a→b ด้วยสัดส่วน k (0 = a, 1 = b)
const lerpPts = (a, b, k) => a.map((p, i) => ({ x: p.x + (b[i].x - p.x) * k, y: p.y + (b[i].y - p.y) * k, z: p.z + (b[i].z - p.z) * k }));
const REST = synthHand({ spread: 5, curls: { thumb: 0.1 } });
const POSE = { pinch: synthHand({ spread: 4, curls: { thumb: 0.45, index: 0.3, middle: 0.1 }, pinch: true }), open: synthHand({ spread: 16 }) };

// มือจำลอง ณ เวลา t (วินาที): ทำท่า gesture ได้ amount ส่วน + สั่นแบบไซน์ 6 Hz กับสัญญาณรบกวนเล็กน้อย
export function demoHand(t, { gesture = 'pinch', amount = 0, tremorLevel = 0 } = {}) {
  const pts = lerpPts(REST, POSE[gesture] || POSE.pinch, Math.max(0, Math.min(1, amount)));
  const A = DEMO_TREMOR[tremorLevel] || 0;
  const dx = A * Math.sin(2 * Math.PI * 6 * t) + A * 0.3 * (Math.random() - 0.5), dy = A * Math.cos(2 * Math.PI * 5.3 * t) + A * 0.3 * (Math.random() - 0.5);
  return pts.map((p) => ({ x: p.x + dx, y: p.y + dy, z: p.z }));
}
