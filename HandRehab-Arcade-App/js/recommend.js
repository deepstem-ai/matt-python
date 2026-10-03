// ============================================================
// recommend.js — ระบบแนะนำการตั้งค่าจากผลทดสอบจริง (Lab 33)
// ฟังก์ชันล้วน ไม่แตะหน้าจอ → ทดสอบด้วย node ได้
//
// กติกา (ใช้ "เฟรมต่อวินาทีเฉลี่ยของเกมจริง" เป็นหลัก เพราะคือสิ่งที่ผู้เล่นเจอจริง)
//   ≥ 45 fps           → สไตล์ trail (ถ้า trail ≥ 45) หรือ neon · 1280×720 · เอฟเฟกต์เต็ม
//   30 – 44 fps        → สไตล์ neon · 640×480 · เอฟเฟกต์เต็ม
//   25 – 29 fps        → neon ถ้า neon ≥ 25 ไม่งั้น simple · 640×480 · เอฟเฟกต์ลดลงครึ่งหนึ่ง
//   20 – 24 fps        → ต่ำกว่าเป้าหมาย 25 ของบทความ §6.2 → simple · 640×480 · ปิดอนุภาค เพื่อดันให้ถึง 25
//   < 20 fps (คำใบ้)   → สไตล์ simple · 480×360 · ปิดอนุภาค (เอฟเฟกต์ปิด)
//   ถ้าไม่มีผลเกม ใช้ค่าต่ำสุดของการทดสอบมือแทน
// ทุกการลดระดับต้องบอก "สิ่งที่จะเสียไป" ห้ามปรับเงียบ ๆ
// ============================================================

export const STYLE_TH = { simple: 'มือแบบเรียบง่าย (simple)', neon: 'มือแบบนีออนเรืองแสง (neon)', trail: 'มือแบบมีหางแสง (trail)' };
export const EFFECTS_TH = { full: 'เอฟเฟกต์เต็ม (พลุ + เสียง)', reduced: 'เอฟเฟกต์ลดลงครึ่งหนึ่ง', off: 'ปิดเอฟเฟกต์อนุภาค' };
export const RES_TH = { '1280x720': '1280×720 (HD)', '640x480': '640×480', '480x360': '480×360' };

// สิ่งที่เสียไปเมื่อเลือกค่าที่ต่ำกว่าค่าสูงสุด
const LOSS = {
  simple: 'เส้นมือบนจอจะไม่มีแสงเรืองและหางแสง (AI ยังจับมือแม่นเท่าเดิม)',
  neon: 'ไม่มีหางแสงตามปลายนิ้ว',
  '640x480': 'ภาพกล้องบนจอคมน้อยลง (โมเดล AI ย่อภาพเองอยู่แล้ว ความแม่นยำแทบไม่เปลี่ยน)',
  '480x360': 'ภาพกล้องบนจอหยาบลงชัดเจน และถ้ายืนไกลกล้องเกิน 1.5 เมตร อาจจับมือได้ยากขึ้น',
  reduced: 'ประกายและพลุตอนได้คะแนนน้อยลงครึ่งหนึ่ง',
  off: 'ไม่มีพลุ/ประกายตอนได้คะแนน (ยังมีเสียงและตัวเลขคะแนนตามปกติ)',
};

// ค่าอ้างอิงที่ใช้ตัดสิน: เกมเต็ม ถ้าไม่มีใช้การวาดมือที่ช้าที่สุด
export function keyFps(results = {}) {
  const ok = (k) => results[k] && !results[k].skipped && results[k].avgFps > 0;
  if (ok('game')) return { fps: results.game.avgFps, from: 'game' };
  const hands = ['handSimple', 'handNeon', 'handTrail'].filter(ok).map((k) => results[k].avgFps);
  if (hands.length) return { fps: Math.min(...hands), from: 'hand' };
  if (ok('camera')) return { fps: results.camera.avgFps, from: 'camera' };
  return { fps: 0, from: 'none' };
}

// คืน { style, resolution, effects, level, text, losses[], basis }
export const TARGET_FPS = 25;            // บทความ §6.2: อัตราเฟรม ≥ 25 ภาพ/วินาที บนทุกแพลตฟอร์ม
export function recommend(results = {}) {
  const { fps, from } = keyFps(results);
  const neon = results.handNeon?.avgFps ?? fps;
  const trail = results.handTrail?.avgFps ?? 0;
  let r;
  if (from === 'none') r = { style: 'simple', resolution: '640x480', effects: 'reduced', level: 'unknown' };
  else if (fps >= 45) r = { style: trail >= 45 ? 'trail' : 'neon', resolution: '1280x720', effects: 'full', level: 'high' };
  else if (fps >= 30) r = { style: 'neon', resolution: '640x480', effects: 'full', level: 'good' };
  else if (fps >= TARGET_FPS) r = { style: neon >= TARGET_FPS ? 'neon' : 'simple', resolution: '640x480', effects: 'reduced', level: 'ok' };
  else if (fps >= 20) r = { style: 'simple', resolution: '640x480', effects: 'off', level: 'below' };
  else r = { style: 'simple', resolution: '480x360', effects: 'off', level: 'low' };
  const losses = [];
  if (r.style !== 'trail') losses.push(LOSS[r.style]);
  if (r.resolution !== '1280x720') losses.push(LOSS[r.resolution]);
  if (r.effects !== 'full') losses.push(LOSS[r.effects]);
  const text = `เครื่องนี้ควรใช้สไตล์ ${STYLE_TH[r.style]} ที่ความละเอียด ${RES_TH[r.resolution]} พร้อม ${EFFECTS_TH[r.effects]}`;
  const basis = from === 'none' ? 'ยังไม่มีผลทดสอบที่ใช้ได้ จึงแนะนำค่าปลอดภัยไว้ก่อน'
    : `อ้างอิงจาก${from === 'game' ? 'เกมเต็ม' : from === 'hand' ? 'การวาดมือที่ช้าที่สุด' : 'กล้องอย่างเดียว'} เฉลี่ย ${Math.round(fps)} เฟรม/วินาที`;
  const meetsTarget = from !== 'none' && fps >= TARGET_FPS;
  const target = from === 'none' ? '' : meetsTarget ? ` · ผ่านเป้าหมาย ≥ ${TARGET_FPS} FPS (บทความ §6.2)`
    : ` · ต่ำกว่าเป้าหมาย ${TARGET_FPS} FPS (บทความ §6.2) — ใช้ค่าแนะนำแล้วทดสอบซ้ำ ถ้ายังไม่ถึงให้ลดความละเอียดเป็น 480×360 หรือใช้เครื่องที่แรงกว่า`;
  return { ...r, fps: Math.round(fps), text, losses, basis: basis + target, target: TARGET_FPS, meetsTarget };
}

// ค่าที่ใช้ทันทีเมื่อเครื่องดูเบาตั้งแต่เปิดครั้งแรก (ยังไม่ได้ทดสอบ)
export const LOW_PRESET = { style: 'simple', resolution: '480x360', effects: 'off' };
export const lowPresetLosses = () => [LOSS.simple, LOSS['480x360'], LOSS.off];

// แปลงเป็นค่าที่เก็บใน prefs (localStorage 'hr-prefs')
export const toPrefs = (r) => ({ handStyle: r.style, resolution: r.resolution, effects: r.effects });

// แปลง '640x480' → { width, height } ใช้กับ startCamera
export function parseResolution(s = '640x480') {
  const [w, h] = String(s).split('x').map(Number);
  return w > 0 && h > 0 ? { width: w, height: h } : { width: 640, height: 480 };
}
