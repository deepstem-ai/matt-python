// ============================================================
// geometry.js — คณิตศาสตร์ของมือ ฟังก์ชันบริสุทธิ์เท่านั้น (Lab 18)
// รับจุด 21 จุด {x,y,z} แล้วคืนตัวเลข ไม่แตะกล้อง ไม่แตะหน้าจอ ไม่อ่านนาฬิกา
// สมการทุกตัวเขียนไว้ในคอมเมนต์ เพื่อคัดลอกไปใส่บทที่ 3 ได้ทันที
// ============================================================
// จุดของแต่ละนิ้ว เรียงจากโคนไปปลาย (0 = ข้อมือ)
export const FINGERS = {
  thumb: [1, 2, 3, 4],
  index: [5, 6, 7, 8],
  middle: [9, 10, 11, 12],
  ring: [13, 14, 15, 16],
  little: [17, 18, 19, 20],
};

// ตรวจว่าได้จุดครบ 21 จุด ไม่ครบให้โยน error ภาษาไทย
function check(pts) {
  if (!Array.isArray(pts) || pts.length < 21) throw new Error(`ต้องมีจุดมือครบ 21 จุด แต่ได้มา ${pts?.length ?? 0} จุด`);
}

// ระยะทาง 3 มิติ
// d(A,B) = √((xA−xB)² + (yA−yB)² + (zA−zB)²)
export function dist(a, b) {
  const dx = a.x - b.x, dy = a.y - b.y, dz = (a.z || 0) - (b.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// ขนาดฝ่ามือ = ระยะจากข้อมือ (จุด 0) ถึงโคนนิ้วกลาง (จุด 9)
// S = d(P0, P9)   เลือกคู่นี้เพราะเป็นกระดูกฝ่ามือที่ไม่งอ ความยาวแทบคงที่ไม่ว่าจะทำท่าอะไร
export function palmScale(pts) {
  check(pts);
  const s = dist(pts[0], pts[9]);
  if (!(s > 1e-6)) throw new Error('ขนาดฝ่ามือเป็นศูนย์ คำนวณต่อไม่ได้ (จุดมือซ้อนกัน หรือข้อมูลผิดพลาด)');
  return s;
}

// ระยะที่หารด้วยขนาดฝ่ามือ — ฟังก์ชันที่สำคัญที่สุด
// nd(i,j) = d(Pi, Pj) / S
// มือใกล้กล้อง: ทั้ง d และ S ใหญ่ขึ้นเท่ากัน → อัตราส่วนคงที่ ไม่ขึ้นกับระยะกล้อง
export function normDist(pts, i, j) {
  const S = palmScale(pts); // ตรวจจำนวนจุดก่อนเสมอ (โยน error ภาษาไทย)
  return dist(pts[i], pts[j]) / S;
}

// มุมที่จุด b (องศา) ระหว่างเวกเตอร์ BA กับ BC
// θ = arccos( (BA·BC) / (|BA||BC|) ) × 180/π
export function angle(a, b, c) {
  const v1 = { x: a.x - b.x, y: a.y - b.y, z: (a.z || 0) - (b.z || 0) };
  const v2 = { x: c.x - b.x, y: c.y - b.y, z: (c.z || 0) - (b.z || 0) };
  const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  const m = Math.hypot(v1.x, v1.y, v1.z) * Math.hypot(v2.x, v2.y, v2.z);
  if (m < 1e-9) return 0;
  return (Math.acos(Math.max(-1, Math.min(1, dot / m))) * 180) / Math.PI;
}

// ความงอของนิ้ว 0 = เหยียดตรง, 1 = งอสุด
// ใช้มุม 3 ข้อของนิ้ว: θ_MCP (ข้อโคน, มุมที่ P5 ระหว่างข้อมือ P0 กับ P6), θ_PIP (ข้อกลาง), θ_DIP (ข้อปลาย)
// นิ้วตรง ทุกมุม ≈ 180°  ยิ่งงอ มุมยิ่งเล็กลง
// นิ้วชี้-ก้อย:  θ̄ = (0.5·θ_MCP + θ_PIP + θ_DIP) / 2.5     (ข้อโคนให้น้ำหนักครึ่งเดียว)
//               curl = clamp( (180 − θ̄) / 110 , 0, 1 )      (110° = งอสุดโดยเฉลี่ย)
// นิ้วโป้ง:      curl = clamp( (180 − (θ_MCP + θ_IP)/2) / 70 , 0, 1 )  (นิ้วโป้งงอได้แคบกว่า)
export function fingerCurl(pts, finger) {
  check(pts);
  const f = FINGERS[finger];
  if (!f) throw new Error('ไม่รู้จักชื่อนิ้ว: ' + finger);
  const [m, p, d, t] = f;
  const base = finger === 'thumb' ? pts[1] : pts[0];
  const a1 = angle(base, pts[m], pts[p]); // มุมข้อโคน (ช่วยนิ้วที่งอจากโคน)
  const a2 = angle(pts[m], pts[p], pts[d]);
  const a3 = angle(pts[p], pts[d], pts[t]);
  if (finger === 'thumb') return clamp01((180 - (a2 + a3) / 2) / 70);
  const avg = (a1 * 0.5 + a2 + a3) / 2.5;
  return clamp01((180 - avg) / 110);
}

// มุมกางระหว่างสองนิ้ว (องศา) วัดระหว่างเวกเตอร์ โคนนิ้ว→ปลายนิ้ว ของแต่ละนิ้ว
// spread = ∠( T1 − K1 , T2 − K2 )
export function spread(pts, finger1, finger2) {
  check(pts);
  const a = FINGERS[finger1], b = FINGERS[finger2];
  const k1 = pts[a[0]], t1 = pts[a[3]], k2 = pts[b[0]], t2 = pts[b[3]];
  const v1 = { x: t1.x - k1.x, y: t1.y - k1.y, z: (t1.z || 0) - (k1.z || 0) };
  const v2 = { x: t2.x - k2.x, y: t2.y - k2.y, z: (t2.z || 0) - (k2.z || 0) };
  return angle({ x: v1.x, y: v1.y, z: v1.z }, { x: 0, y: 0, z: 0 }, { x: v2.x, y: v2.y, z: v2.z });
}

// ฝ่ามือหันเข้ากล้องหรือหันข้าง
// ใช้เวกเตอร์ตั้งฉากฝ่ามือ n = (P5 − P0) × (P17 − P0) แล้วดูสัดส่วนแกน z
// facing = |n_z| / |n|  ใกล้ 1 = หันเข้ากล้องเต็มหน้า, ใกล้ 0 = หันข้าง
export function handFacingCamera(pts, threshold = 0.6) {
  check(pts);
  const u = sub(pts[5], pts[0]), v = sub(pts[17], pts[0]);
  const n = { x: u.y * v.z - u.z * v.y, y: u.z * v.x - u.x * v.z, z: u.x * v.y - u.y * v.x };
  const mag = Math.hypot(n.x, n.y, n.z) || 1e-9;
  const facing = Math.abs(n.z) / mag;
  return { facing: facing >= threshold, ratio: facing };
}

// แก้สัดส่วนภาพ: MediaPipe ให้ x หารด้วยความกว้าง y หารด้วยความสูง (หน่วยไม่เท่ากัน!)
// ภาพ 16:9 ทำให้แนวนอน "หดลง" 0.56 เท่า มุมกางนิ้วจึงดูน้อยกว่าจริง
// แก้โดย x' = x·(W/H), z' = z·(W/H), y' = y  → ทุกแกนมีหน่วยเป็น "ความสูงภาพ" เท่ากัน
export function squarePoints(pts, aspect) {
  return pts.map((p) => ({ x: p.x * aspect, y: p.y, z: (p.z || 0) * aspect }));
}

// ---------- ตัวช่วย ----------
export function clamp01(v) { return Math.max(0, Math.min(1, v)); }
function sub(a, b) { return { x: a.x - b.x, y: a.y - b.y, z: (a.z || 0) - (b.z || 0) }; }

// แปลงค่าเป็นคะแนน 0-1 แบบเส้นตรง: v ≤ full → 1, v ≥ zero → 0 (ใช้กับท่า "ยิ่งน้อยยิ่งดี")
export function scoreLow(v, full, zero) { return clamp01((zero - v) / (zero - full)); }
// v ≥ full → 1, v ≤ zero → 0 (ใช้กับท่า "ยิ่งมากยิ่งดี")
export function scoreHigh(v, zero, full) { return clamp01((v - zero) / (full - zero)); }
