// ============================================================
// guide.js — กรอบนำทางรูปวงรี + ตรวจว่าหน้าอยู่ในกรอบ + ตรวจท่าหัน (Lab 14)
// คณิตศาสตร์ล้วน ทดสอบด้วย node ได้
// พิกัดทั้งหมดเป็นสัดส่วน 0-1 ของภาพ
// ============================================================

export const GUIDE_CONFIG = {
  heightPct: 0.60,      // วงรีสูง 60% ของความสูงภาพ
  aspect: 0.75,         // กว้าง = 0.75 × สูง (รูปทรงหัวคน)
  centerY: 0.50,        // จุดกึ่งกลางแนวตั้ง
  centerTol: 0.5,       // จุดกลางหน้าต้องอยู่ใน "ครึ่งในของวงรี" (เข้มกว่าแค่อยู่ในวงรี เพื่อให้หน้าไม่ล้นกรอบ)
  minWidth: 0.45,       // ความกว้างหน้า / ความกว้างวงรี ต้องไม่น้อยกว่า 0.45 (น้อยกว่า = ไกลไป)
  maxWidth: 0.85,       // และไม่เกิน 0.85 (มากกว่า = ใกล้ไป)
};

// สร้างวงรีสำหรับภาพขนาด W×H → { cx, cy, rx, ry } เป็นสัดส่วน 0-1
// rx ต้องแปลงหน่วย เพราะภาพกว้างไม่เท่าสูง (16:9)
export function makeGuide(W, H, cfg = GUIDE_CONFIG) {
  const ry = cfg.heightPct / 2;
  const rx = (ry * cfg.aspect * H) / W;
  return { cx: 0.5, cy: cfg.centerY, rx, ry };
}

// ตรวจว่ากล่องหน้า (จาก Face Detector, พิกัดภาพดิบไม่กลับด้าน) อยู่ในกรอบไหม
// mirror = true เมื่อหน้าจอแสดงภาพแบบกระจก (ผู้ใช้ขยับไปทางไหน ภาพก็ไปทางนั้นบนจอ)
// คืน { inside, dir: 'left'|'right'|'up'|'down'|null, size: 'far'|'close'|null, widthRatio, dx, dy }
export function checkGuide(box, guide, { mirror = true, cfg = GUIDE_CONFIG } = {}) {
  let fx = box.x + box.w / 2;
  if (mirror) fx = 1 - fx;                   // แปลงเป็นตำแหน่งที่ผู้ใช้เห็นบนจอ
  const fy = box.y + box.h / 2;
  const dx = (fx - guide.cx) / guide.rx;     // -1..1 = อยู่ในวงรีตามแนวนอน
  const dy = (fy - guide.cy) / guide.ry;
  const centred = Math.hypot(dx, dy) <= cfg.centerTol;
  const widthRatio = box.w / (2 * guide.rx);
  let size = null;
  if (widthRatio < cfg.minWidth) size = 'far';
  else if (widthRatio > cfg.maxWidth) size = 'close';
  let dir = null;
  if (!centred) {
    if (Math.abs(dx) >= Math.abs(dy)) {
      // หน้าอยู่ขวาของกรอบบนจอ → ต้องขยับไปทางซ้าย (บนจอกระจก ซ้ายของจอ = ซ้ายของผู้ใช้)
      const screenDir = dx > 0 ? 'left' : 'right';
      // ถ้าจอไม่กลับด้าน ทิศของผู้ใช้จะตรงข้ามกับทิศบนจอ
      dir = mirror ? screenDir : (screenDir === 'left' ? 'right' : 'left');
    } else dir = dy > 0 ? 'up' : 'down';
  }
  return { inside: centred && !size, dir, size, widthRatio, dx, dy };
}

// ---------- ท่าหันหน้า 5 ท่า ----------
// yaw  = (ปลายจมูก − กึ่งกลางตา) แนวนอน ÷ ระยะตา  → บวก = ผู้ใช้หันไปทางซ้ายของตัวเอง
//        (ในภาพดิบจากกล้อง ด้านซ้ายของผู้ใช้อยู่ทางขวาของภาพ)
// pitch = (ปลายจมูก − กึ่งกลางตา) แนวตั้ง ÷ ระยะตา → เงยหน้า = ค่าลดลง, ก้ม = ค่าเพิ่มขึ้น
export const POSES = [
  { key: 'straight', th: 'หน้าตรง', icon: '⬤' },
  { key: 'left', th: 'หันซ้ายเล็กน้อย', icon: '◀' },
  { key: 'right', th: 'หันขวาเล็กน้อย', icon: '▶' },
  { key: 'up', th: 'เงยหน้าเล็กน้อย', icon: '▲' },
  { key: 'down', th: 'ก้มหน้าเล็กน้อย', icon: '▼' },
];
export const POSE_CONFIG = { yawMin: 0.12, yawMax: 0.45, pitchDelta: 0.07, pitchMax: 0.3, defaultPitch: 0.55, yawSign: 1 };

// อ่านมุมหันจากจุดสำคัญ 6 จุดของ Face Detector: [0]=ตาขวา [1]=ตาซ้าย [2]=ปลายจมูก
export function headPose(keypoints, W = 1, H = 1, cfg = POSE_CONFIG) {
  if (!keypoints || keypoints.length < 3) return null;
  const [a, b, n] = keypoints;
  const mx = (a.x + b.x) / 2 * W, my = (a.y + b.y) / 2 * H;
  const eye = Math.hypot((a.x - b.x) * W, (a.y - b.y) * H) || 1;
  return { yaw: cfg.yawSign * (n.x * W - mx) / eye, pitch: (n.y * H - my) / eye };
}

// ตรวจว่าท่าตอนนี้ตรงกับท่าที่ต้องถ่ายไหม ถ้าไม่ตรงบอกวิธีแก้ (hint)
// basePitch = pitch ตอนถ่ายหน้าตรง (ถ้ายังไม่มีใช้ค่าเริ่มต้น)
export function checkPose(target, pose, basePitch = POSE_CONFIG.defaultPitch, cfg = POSE_CONFIG) {
  if (!pose) return { ok: false, hint: 'faceFront' };
  const { yaw } = pose, dp = pose.pitch - basePitch;
  const tooMuch = Math.abs(yaw) > cfg.yawMax || Math.abs(dp) > cfg.pitchMax;
  if (tooMuch) return { ok: false, hint: 'lessTurn' };
  switch (target) {
    case 'straight': return Math.abs(yaw) < cfg.yawMin ? { ok: true } : { ok: false, hint: 'faceFront' };
    case 'left': return yaw >= cfg.yawMin ? { ok: true } : { ok: false, hint: 'turnLeft' };
    case 'right': return yaw <= -cfg.yawMin ? { ok: true } : { ok: false, hint: 'turnRight' };
    case 'up': return dp <= -cfg.pitchDelta && Math.abs(yaw) < cfg.yawMin * 1.5 ? { ok: true } : { ok: false, hint: Math.abs(yaw) >= cfg.yawMin * 1.5 ? 'faceFront' : 'lookUp' };
    case 'down': return dp >= cfg.pitchDelta && Math.abs(yaw) < cfg.yawMin * 1.5 ? { ok: true } : { ok: false, hint: Math.abs(yaw) >= cfg.yawMin * 1.5 ? 'faceFront' : 'lookDown' };
    default: return { ok: true };
  }
}
