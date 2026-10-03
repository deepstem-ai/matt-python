// ============================================================
// gestures.js — ตรวจท่าบริหาร 5 ท่า (Lab 19, 20)
// ทุกท่าคืนรูปแบบเดียวกัน: { score: 0-1, active: true/false, details: {...} }
// ค่าเกณฑ์ทุกตัวอยู่ใน GESTURE_CONFIG ปรับจากข้างนอกได้ (Lab 27 จะปรับรายบุคคล)
// ห้ามแตะ: กล้อง หน้าจอ นาฬิกา
// ============================================================
import { normDist, fingerCurl, spread, angle, clamp01, scoreLow, scoreHigh } from './geometry.js';

// ค่าเกณฑ์เริ่มต้น (ได้จากการทดลองกับมือผู้ใหญ่ทั่วไป ควรสอบเทียบรายคนใน Lab 27)
export const GESTURE_CONFIG = {
  // สมการ (3) ตอนยังไม่ปรับเทียบ: full = d_close = 0.25 (ระยะตอนจีบ), zero = d_open = 0.80 (ระยะตอนแบนิ้ว)
  //   (ชื่อคีย์ full/zero คงไว้ให้โค้ดเดิมใช้ได้) · on = θ_on = 0.7 ของสมการ (7)
  // indexCurlMax: ถ้านิ้วชี้งอเกินนี้ถือว่าเป็น "กำมือ" ไม่ใช่จีบ (กันท่ากำมือทำให้แถบจีบขึ้นตาม)
  pinch: { a: 4, b: 8, full: 0.25, zero: 0.8, on: 0.7, indexCurlMax: 0.65 },
  fist: { fingers: ['index', 'middle', 'ring', 'little'], zero: 0.3, full: 0.8, on: 0.7 },
  // curlMax: นิ้วที่งอมากสุดต้องไม่เกินนี้ (แบมือ = ทุกนิ้วเหยียด), thumbAway: ปลายโป้งต้องห่างปลายชี้อย่างน้อยเท่านี้
  open: { f1: 'index', f2: 'little', zero: 20, full: 50, on: 0.7, curlMax: 0.25, thumbAway: 0.6 },
  // thumbAway: นิ้วโป้งงอแต่ปลายไปแตะปลายนิ้วชี้ = "จีบ" ไม่ใช่ "แตะนิ้วโป้ง"
  fingerTap: { fingers: ['thumb', 'index', 'middle', 'ring', 'little'], curlOn: 0.55, othersMax: 0.4, on: 0.6, thumbAway: 0.7 },
  // aspect: ถ้าป้อนจุดดิบ (hand.points) จากกล้อง 16:9 ใช้ 16/9; ถ้าป้อน hand.sq (แก้สัดส่วนแล้ว) ให้ตั้งเป็น 1
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
// ทำไมสำคัญในการฟื้นฟู: ผู้ป่วยหลอดเลือดสมอง ข้อนิ้วเสื่อม หรือเอ็นนิ้วบาดเจ็บ มักเสีย "การหยิบละเอียด" เป็นอย่างแรก
//   และเป็นทักษะที่กำหนดว่าจะใช้ชีวิตเองได้ไหม (กินยาเอง แต่งตัวเอง) นักกายภาพจึงฝึกท่านี้ซ้ำ ๆ ทุกวัน
// สมการ (2): d̂48 = normDist(4,8)
// สมการ (3): π = clip((d_open − d̂48)/(d_open − d_close), 0, 1)  ค่าเริ่มต้น d_open = 0.80 (zero), d_close = 0.25 (full)
//        (เท่ากับ score = 1 เมื่อ d ≤ d_close, 0 เมื่อ d ≥ d_open, ระหว่างนั้นเป็นเส้นตรง)
//        ตัวคูณกันสับสนกับกำมือ: g = clamp((indexCurlMax − curl_ชี้) / 0.15)  → score = score × g
// ------------------------------------------------------------
export function detectPinch(pts, over) {
  const c = cfgOf('pinch', over);
  const distance = normDist(pts, c.a, c.b);
  const indexCurl = fingerCurl(pts, 'index');
  const gate = clamp01((c.indexCurlMax - indexCurl) / 0.15);
  const score = scoreLow(distance, c.full, c.zero) * gate;   // สมการ (3) × ตัวคูณกันสับสนกับกำมือ
  return { score, active: score >= c.on, distance, details: { distance, indexCurl, gate } };
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
// สมการ: s = (มุมกางชี้–ก้อย − zero)/(full − zero)
//        × g1 = clamp(1 − max(0, curl_max − curlMax)/0.25)   (ทุกนิ้วต้องเหยียด ไม่ใช่งอนิ้วเดียวแล้วมุมเพี้ยน)
//        × g2 = clamp((d(4,8) − thumbAway/2)/(thumbAway/2))  (นิ้วโป้งต้องกางออก ไม่ได้จีบอยู่)
// ------------------------------------------------------------
export function detectOpen(pts, over) {
  const c = cfgOf('open', over);
  const deg = spread(pts, c.f1, c.f2);
  const curls = ['index', 'middle', 'ring', 'little'].map((f) => fingerCurl(pts, f));
  const avgCurl = curls.reduce((s, v) => s + v, 0) / 4;
  const maxCurl = Math.max(...curls);
  const g1 = clamp01(1 - Math.max(0, maxCurl - c.curlMax) / 0.25);
  const g2 = scoreHigh(normDist(pts, 4, 8), c.thumbAway / 2, c.thumbAway);
  const score = scoreHigh(deg, c.zero, c.full) * g1 * g2;
  return { score, active: score > c.on, details: { spreadDeg: deg, avgCurl, maxCurl } };
}

// ------------------------------------------------------------
// 4) ท่าแตะนิ้วทีละนิ้ว (Finger Tap / isolated finger flexion)
// กายภาพบำบัด: การงอนิ้วแยกทีละนิ้ว (finger individuation)
// ฝึก: การควบคุมกล้ามเนื้อแยกนิ้ว flexor digitorum ของแต่ละนิ้ว และการประสานงานของสมอง
// ใช้ในชีวิตประจำวัน: กดแป้นพิมพ์ กดปุ่มโทรศัพท์ เล่นเปียโน นับเงิน
// สมการ: ต่อนิ้ว f: s_f = clamp(curl_f / curlOn) × clamp(1 − max(0, m − othersMax/2) / othersMax)
//        โดย m = ความงอสูงสุดของนิ้วอื่น (นิ้วอื่นต้องเหยียดอยู่)
//        นิ้วโป้งคูณเพิ่ม clamp((d(4,8) − thumbAway/2)/(thumbAway/2)) กันสับสนกับท่าจีบ
//        นิ้วที่คะแนนสูงสุดคือนิ้วที่แตะ
// ------------------------------------------------------------
export function detectFingerTap(pts, over) {
  const c = cfgOf('fingerTap', over);
  const curls = Object.fromEntries(c.fingers.map((f) => [f, fingerCurl(pts, f)]));
  let best = null, bestScore = 0;
  const perFinger = {};
  const thumbGate = scoreHigh(normDist(pts, 4, 8), c.thumbAway / 2, c.thumbAway);
  for (const f of c.fingers) {
    const others = c.fingers.filter((o) => o !== f).map((o) => curls[o]);
    const maxOther = Math.max(...others);
    let s = clamp01(curls[f] / c.curlOn) * clamp01(1 - Math.max(0, maxOther - c.othersMax * 0.5) / c.othersMax);
    if (f === 'thumb') s *= thumbGate;
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
// physio = ชื่อทางกายภาพบำบัด, muscles = กล้ามเนื้อ/การเคลื่อนไหวที่ฝึก, daily = กิจวัตรที่ต้องใช้
export const GESTURE_INFO = {
  pinch: { th: 'จีบนิ้ว', icon: '🤏', trains: 'การหยิบจับละเอียด นิ้วโป้ง-นิ้วชี้',
    physio: 'Tip-to-tip pinch / pincer grasp (การจับแบบปลายนิ้ว)', muscles: 'opponens pollicis, first dorsal interosseous, flexor digitorum profundus',
    daily: 'หยิบเหรียญ กลัดกระดุม หยิบยาเม็ด จับปากกา' },
  fist: { th: 'กำมือ', icon: '✊', trains: 'แรงกำมือ กล้ามเนื้องอนิ้ว',
    physio: 'Composite finger flexion / power grip (การกำมือเต็มที่)', muscles: 'flexor digitorum superficialis & profundus, lumbricals',
    daily: 'ถือแก้วน้ำ จับราวบันได ถือถุงของ บิดผ้า' },
  open: { th: 'แบมือกางนิ้ว', icon: '🖐️', trains: 'การเหยียดและกางนิ้ว',
    physio: 'Finger extension & abduction (การเหยียดและกางนิ้ว)', muscles: 'extensor digitorum, dorsal interossei, abductor digiti minimi',
    daily: 'จับลูกบิดประตู หยิบของชิ้นใหญ่ รับลูกบอล วางมือบนแป้นพิมพ์' },
  fingerTap: { th: 'แตะนิ้วทีละนิ้ว', icon: '☝️', trains: 'การควบคุมนิ้วแยกทีละนิ้ว',
    physio: 'Finger individuation / isolated finger flexion (การงอนิ้วแยกทีละนิ้ว)', muscles: 'flexor digitorum ของแต่ละนิ้ว + การควบคุมจากสมอง (motor control)',
    daily: 'กดแป้นพิมพ์ กดปุ่มโทรศัพท์ เล่นเปียโน นับเงิน' },
  wristFlex: { th: 'งอ-เหยียดข้อมือ', icon: '🙌', trains: 'พิสัยการเคลื่อนไหวข้อมือ',
    physio: 'Wrist flexion–extension range of motion (พิสัยงอ-เหยียดข้อมือ)', muscles: 'flexor carpi radialis/ulnaris (งอ), extensor carpi radialis/ulnaris (เหยียด)',
    daily: 'เทน้ำจากขวด ใช้ช้อน หวีผม ดันตัวลุกจากเก้าอี้' },
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
