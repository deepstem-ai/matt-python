// ============================================================
// gestures.js — ตรวจท่าบริหาร 5 ท่า (Lab 19, 20)
// ทุกท่าคืนรูปแบบเดียวกัน: { score: 0-1, active: true/false, details: {...} }
// ค่าเกณฑ์ทุกตัวอยู่ใน GESTURE_CONFIG ปรับจากข้างนอกได้ (Lab 27 จะปรับรายบุคคล)
// ห้ามแตะ: กล้อง หน้าจอ นาฬิกา
// ============================================================
import { normDist, fingerCurl, spread, angle, clamp01, scoreLow, scoreHigh } from './geometry.js';

// ค่าเกณฑ์เริ่มต้น (ได้จากการทดลองกับมือผู้ใหญ่ทั่วไป ควรสอบเทียบรายคนใน Lab 27)
export const GESTURE_CONFIG = {
  pinch: { a: 4, b: 8, full: 0.25, zero: 0.8, on: 0.7 },
  fist: { fingers: ['index', 'middle', 'ring', 'little'], zero: 0.3, full: 0.8, on: 0.7 },
  open: { f1: 'index', f2: 'little', zero: 15, full: 45, on: 0.7 },
  fingerTap: { fingers: ['thumb', 'index', 'middle', 'ring', 'little'], curlOn: 0.55, othersMax: 0.4, on: 0.6 },
  wristFlex: { zero: 10, full: 45, on: 0.7, aspect: 16 / 9 },
};

// รวมค่าเกณฑ์ที่ส่งเข้ามากับค่าเริ่มต้น
const cfgOf = (name, over) => ({ ...GESTURE_CONFIG[name], ...(over || {}) });

// เปลี่ยนค่าเกณฑ์จากภายนอก เช่น setGestureConfig('pinch', { on: 0.6 })
export function setGestureConfig(name, patch) {
  GESTURE_CONFIG[name] = { ...GESTURE_CONFIG[name], ...patch };
}

// ------------------------------------------------------------
// 1) ท่าจีบนิ้ว (Pinch) — ปลายนิ้วโป้ง (4) แตะปลายนิ้วชี้ (8)
// กายภาพบำบัด: การจับแบบปลายนิ้ว (tip-to-tip / pincer grasp)
// ฝึก: กล้ามเนื้อ opponens pollicis, first dorsal interosseous, flexor digitorum profundus
// ใช้ในชีวิตประจำวัน: หยิบเหรียญ กลัดกระดุม หยิบยาเม็ด จับปากกา
// สมการ: d = normDist(4,8); score = 1 เมื่อ d ≤ full, 0 เมื่อ d ≥ zero, ระหว่างนั้นเป็นเส้นตรง
// ------------------------------------------------------------
export function detectPinch(pts, over) {
  const c = cfgOf('pinch', over);
  const distance = normDist(pts, c.a, c.b);
  const score = scoreLow(distance, c.full, c.zero);
  return { score, active: score > c.on, distance, details: { distance } };
}

// ------------------------------------------------------------
// 2) ท่ากำมือ (Fist)
// กายภาพบำบัด: การกำมือเต็มที่ (composite flexion / power grip)
// ฝึก: flexor digitorum superficialis & profundus, lumbricals
// ใช้ในชีวิตประจำวัน: ถือแก้วน้ำ จับราวบันได บิดผ้า ถือถุง
// สมการ: curl เฉลี่ยของ 4 นิ้ว (ชี้ กลาง นาง ก้อย) → score = (avg − zero)/(full − zero)
// ------------------------------------------------------------
export function detectFist(pts, over) {
  const c = cfgOf('fist', over);
  const curls = Object.fromEntries(c.fingers.map((f) => [f, fingerCurl(pts, f)]));
  const avg = Object.values(curls).reduce((a, b) => a + b, 0) / c.fingers.length;
  const score = scoreHigh(avg, c.zero, c.full);
  return { score, active: score > c.on, details: { avgCurl: avg, curls } };
}

// ------------------------------------------------------------
// 3) ท่าแบมือกางนิ้ว (Open / Spread)
// กายภาพบำบัด: การเหยียดและกางนิ้ว (finger extension & abduction)
// ฝึก: extensor digitorum, dorsal interossei, abductor digiti minimi
// ใช้ในชีวิตประจำวัน: หยิบของชิ้นใหญ่ รับลูกบอล วางมือบนแป้นพิมพ์ ล้างมือ
// สมการ: มุมกางระหว่างนิ้วชี้กับนิ้วก้อย × (1 − ความงอเฉลี่ย) เพื่อบังคับให้นิ้วต้องเหยียดด้วย
// ------------------------------------------------------------
export function detectOpen(pts, over) {
  const c = cfgOf('open', over);
  const deg = spread(pts, c.f1, c.f2);
  const avgCurl = ['index', 'middle', 'ring', 'little'].reduce((s, f) => s + fingerCurl(pts, f), 0) / 4;
  const score = scoreHigh(deg, c.zero, c.full) * clamp01(1 - avgCurl * 1.5);
  return { score, active: score > c.on, details: { spreadDeg: deg, avgCurl } };
}

// ------------------------------------------------------------
// 4) ท่าแตะนิ้วทีละนิ้ว (Finger Tap / isolated finger flexion)
// กายภาพบำบัด: การงอนิ้วแยกทีละนิ้ว (finger individuation)
// ฝึก: การควบคุมกล้ามเนื้อแยกนิ้ว flexor digitorum ของแต่ละนิ้ว และการประสานงานของสมอง
// ใช้ในชีวิตประจำวัน: กดแป้นพิมพ์ กดปุ่มโทรศัพท์ เล่นเปียโน นับเงิน
// สมการ: ต่อนิ้ว f: s_f = clamp(curl_f / curlOn) × clamp(1 − max(curl อื่น) / othersMax ... )
//        นิ้วที่คะแนนสูงสุดคือนิ้วที่แตะ
// ------------------------------------------------------------
export function detectFingerTap(pts, over) {
  const c = cfgOf('fingerTap', over);
  const curls = Object.fromEntries(c.fingers.map((f) => [f, fingerCurl(pts, f)]));
  let best = null, bestScore = 0;
  const perFinger = {};
  for (const f of c.fingers) {
    const others = c.fingers.filter((o) => o !== f).map((o) => curls[o]);
    const maxOther = Math.max(...others);
    const s = clamp01(curls[f] / c.curlOn) * clamp01(1 - Math.max(0, maxOther - c.othersMax * 0.5) / c.othersMax);
    perFinger[f] = s;
    if (s > bestScore) { bestScore = s; best = f; }
  }
  return { score: bestScore, active: bestScore > c.on, finger: bestScore > c.on ? best : null, details: { finger: best, perFinger, curls } };
}

// ------------------------------------------------------------
// 5) ท่างอ-เหยียดข้อมือ (Wrist Flexion / Extension)
// กายภาพบำบัด: wrist flexion–extension range of motion
// ฝึก: flexor carpi radialis/ulnaris (งอ), extensor carpi radialis/ulnaris (เหยียด)
// ใช้ในชีวิตประจำวัน: เทน้ำจากขวด ใช้ช้อน หวีผม ดันตัวลุกจากเก้าอี้
// สมมติฐาน: ผู้ใช้วางแขนตั้งขึ้น (ศอกวางบนโต๊ะ) แกนแขน = แกนแนวตั้งของภาพ (0,−1,0)
// สมการ: v = P9 − P0 (แกนฝ่ามือ, ปรับ x ด้วยอัตราส่วนภาพ) ; θ = ∠(v, แกนแขน)
//        score = (θ − zero)/(full − zero); ทิศ: z ของปลายนิ้วติดลบ = งอเข้าหากล้อง
// ------------------------------------------------------------
export function detectWristFlex(pts, over) {
  const c = cfgOf('wristFlex', over);
  if (!pts || pts.length < 21) throw new Error('ต้องมีจุดมือครบ 21 จุด');
  const v = { x: (pts[9].x - pts[0].x) * c.aspect, y: pts[9].y - pts[0].y, z: (pts[9].z - pts[0].z) * c.aspect };
  const deg = angle({ x: v.x, y: v.y, z: v.z }, { x: 0, y: 0, z: 0 }, { x: 0, y: -1, z: 0 });
  const score = scoreHigh(deg, c.zero, c.full);
  const direction = v.z < 0 ? 'flex' : 'extend';
  return { score, active: score > c.on, details: { angleDeg: deg, direction } };
}

// ข้อมูลอธิบายแต่ละท่า สำหรับแสดงบนหน้าจอ
export const GESTURE_INFO = {
  pinch: { th: 'จีบนิ้ว', icon: '🤏', trains: 'การหยิบจับละเอียด นิ้วโป้ง-นิ้วชี้' },
  fist: { th: 'กำมือ', icon: '✊', trains: 'แรงกำมือ กล้ามเนื้องอนิ้ว' },
  open: { th: 'แบมือกางนิ้ว', icon: '🖐️', trains: 'การเหยียดและกางนิ้ว' },
  fingerTap: { th: 'แตะนิ้วทีละนิ้ว', icon: '☝️', trains: 'การควบคุมนิ้วแยกทีละนิ้ว' },
  wristFlex: { th: 'งอ-เหยียดข้อมือ', icon: '🙌', trains: 'พิสัยการเคลื่อนไหวข้อมือ' },
};
export const GESTURE_KEYS = Object.keys(GESTURE_INFO);

// ตรวจทุกท่าพร้อมกัน over = { pinch: {...}, fist: {...} } สำหรับค่าเกณฑ์รายคน
export function detectAll(pts, over = {}) {
  return {
    pinch: detectPinch(pts, over.pinch),
    fist: detectFist(pts, over.fist),
    open: detectOpen(pts, over.open),
    fingerTap: detectFingerTap(pts, over.fingerTap),
    wristFlex: detectWristFlex(pts, over.wristFlex),
  };
}
