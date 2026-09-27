// ============================================================
// ml.js — สอน AI ให้รู้จักท่ามือที่เราคิดขึ้นเอง ด้วย k-Nearest Neighbours (Lab 31)
// ไม่ใช้ไลบรารี AI ภายนอกเลย
// ห้ามแตะ: กล้อง, หน้าจอ (ฐานข้อมูลเรียกผ่าน save/load เท่านั้น)
//
// kNN ทำงานอย่างไร — เปรียบเทียบกับชีวิตประจำวัน:
//   สมมติเราย้ายมาอยู่หมู่บ้านใหม่ แล้วอยากรู้ว่า "บ้านหลังนี้น่าจะเชียร์ทีมฟุตบอลไหน"
//   วิธีง่ายที่สุดคือเดินไปถามเพื่อนบ้านที่อยู่ "ใกล้ที่สุด 5 หลัง" แล้วดูว่าส่วนใหญ่เชียร์ทีมไหน
//   ถ้า 4 ใน 5 หลังเชียร์ทีมสีแดง ก็เดาว่าบ้านนี้เชียร์ทีมสีแดง มั่นใจ 4/5 = 80%
//   kNN ทำแบบเดียวกันเป๊ะ:
//     - "บ้าน" แต่ละหลัง = ตัวอย่างท่ามือที่เราเก็บไว้ (ตัวเลข 25 ตัว + ชื่อท่า)
//     - "ระยะทางระหว่างบ้าน" = ความต่างของตัวเลข 25 ตัว (ระยะแบบยุคลิด)
//     - "ถามเพื่อนบ้าน k หลัง" = หาตัวอย่างที่ใกล้ที่สุด k ตัว แล้วโหวต
//   ข้อดี: ไม่ต้องฝึกนาน เพิ่มท่าใหม่ได้ทันที อธิบายกรรมการได้ง่าย (ชี้ให้ดูได้เลยว่าเพื่อนบ้านคือใคร)
//   ข้อเสีย: ตัวอย่างยิ่งเยอะยิ่งช้า และ "ระยะทาง" จะมีความหมายก็ต่อเมื่อตัวเลขที่ป้อนดี
//            → จึงต้องใช้เฉพาะค่าที่หารด้วยขนาดฝ่ามือแล้ว (ไม่ขึ้นกับว่ามืออยู่ใกล้หรือไกลกล้อง)
// ============================================================
import { normDist, fingerCurl, spread, handFacingCamera } from './geometry.js';

const TIPS = [4, 8, 12, 16, 20];
const FINGER_ORDER = ['thumb', 'index', 'middle', 'ring', 'little'];

// ชื่อของตัวเลขแต่ละตัว (เรียงตรงกับ extractFeatures) ใช้แสดงผลและเขียนรายงาน
export const FEATURE_NAMES = [
  ...TIPS.flatMap((a, i) => TIPS.slice(i + 1).map((b) => `tip${a}-tip${b}`)), // 10 คู่ปลายนิ้ว
  ...FINGER_ORDER.map((f) => `curl_${f}`),                                  // 5 ความงอ
  ...FINGER_ORDER.slice(0, 4).map((f, i) => `spread_${f}-${FINGER_ORDER[i + 1]}`), // 4 มุมกางนิ้วติดกัน
  ...TIPS.map((t) => `tip${t}-wrist`),                                      // 5 ปลายนิ้วถึงข้อมือ
  'facing',                                                                 // 1 ฝ่ามือหันเข้ากล้อง
];
export const FEATURE_COUNT = FEATURE_NAMES.length; // = 25

// ------------------------------------------------------------
// 1) แปลงจุด 21 จุด → ตัวเลข 25 ตัว (ทุกตัวไม่ขึ้นกับขนาดมือ/ระยะกล้อง)
//    - normDist = ระยะ ÷ ขนาดฝ่ามือ (P0→P9)   ช่วงประมาณ 0-2
//    - curl 0..1, spread องศา ÷ 90 → ประมาณ 0..1, facing 0..1
//    ห้ามใช้ x, y ดิบเด็ดขาด: คนเดินเข้าใกล้กล้องนิดเดียว ตัวเลขดิบเปลี่ยนหมด AI จะทายผิดทันที
// ------------------------------------------------------------
export function extractFeatures(pts) {
  const f = [];
  for (let i = 0; i < TIPS.length; i++) for (let j = i + 1; j < TIPS.length; j++) f.push(normDist(pts, TIPS[i], TIPS[j]));
  for (const name of FINGER_ORDER) f.push(fingerCurl(pts, name));
  for (let i = 0; i < 4; i++) f.push(spread(pts, FINGER_ORDER[i], FINGER_ORDER[i + 1]) / 90);
  for (const t of TIPS) f.push(normDist(pts, t, 0));
  f.push(handFacingCamera(pts).ratio);
  return f;
}

// ระยะแบบยุคลิด: √Σ(aᵢ − bᵢ)²
export function distance(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) { const d = a[i] - b[i]; s += d * d; }
  return Math.sqrt(s);
}

// ------------------------------------------------------------
// 2) ตัวจำแนก kNN
// ------------------------------------------------------------
export const MODEL_ID = 'knn-model'; // รหัสระเบียนใน store 'ml' ของฐานข้อมูล (Lab 32 อ่านจากที่นี่)

export class KNNClassifier {
  constructor() { this.examples = []; } // [{ f: [25 ตัวเลข], label, t }]

  addExample(features, label) {
    if (!Array.isArray(features) || features.length !== FEATURE_COUNT) throw new Error(`ต้องมีตัวเลข ${FEATURE_COUNT} ตัว แต่ได้ ${features?.length}`);
    if (!String(label || '').trim()) throw new Error('กรุณาตั้งชื่อท่าก่อน');
    this.examples.push({ f: features.map((v) => +v.toFixed(5)), label: String(label).trim(), t: Date.now() });
  }

  // ทายท่า: หาเพื่อนบ้านใกล้สุด k ตัว → โหวต → ความมั่นใจ = เสียงโหวต ÷ k
  // k ควรเป็นเลขคี่ (ค่าเริ่มต้น 5) เพื่อลดโอกาสเสมอ ถ้ายังเสมอ เลือกท่าที่มีเพื่อนบ้านใกล้กว่า
  predict(features, k = 5) {
    if (!this.examples.length) return { label: null, confidence: 0, neighbours: [] };
    const all = this.examples.map((e) => ({ label: e.label, distance: distance(features, e.f) }));
    all.sort((a, b) => a.distance - b.distance);
    const neighbours = all.slice(0, Math.min(k, all.length));
    const votes = {};
    neighbours.forEach((n, rank) => {
      votes[n.label] ??= { n: 0, best: rank };
      votes[n.label].n++;
    });
    const [label, v] = Object.entries(votes).sort((a, b) => b[1].n - a[1].n || a[1].best - b[1].best)[0];
    return { label, confidence: v.n / neighbours.length, neighbours: neighbours.map((n) => ({ label: n.label, distance: +n.distance.toFixed(4) })), votes: Object.fromEntries(Object.entries(votes).map(([l, x]) => [l, x.n])) };
  }

  // จำนวนตัวอย่างของแต่ละท่า { ชื่อท่า: จำนวน }
  counts() {
    const c = {};
    for (const e of this.examples) c[e.label] = (c[e.label] || 0) + 1;
    return c;
  }
  labels() { return Object.keys(this.counts()); }
  get size() { return this.examples.length; }

  // ลบท่าเดียว (ไม่ส่ง label = ลบทั้งหมด) คืนจำนวนที่ลบ
  clear(label) {
    const before = this.examples.length;
    this.examples = label === undefined ? [] : this.examples.filter((e) => e.label !== label);
    return before - this.examples.length;
  }

  toObject() {
    return { id: MODEL_ID, type: 'knn', version: 1, featureCount: FEATURE_COUNT, featureNames: FEATURE_NAMES, savedAt: Date.now(), examples: this.examples };
  }
  fromObject(o) {
    if (!o || !Array.isArray(o.examples)) throw new Error('ไฟล์โมเดลไม่ถูกต้อง (ไม่มีรายการ examples)');
    if (o.featureCount !== FEATURE_COUNT) throw new Error(`โมเดลนี้ใช้ตัวเลข ${o.featureCount} ตัว แต่โปรแกรมนี้ใช้ ${FEATURE_COUNT} ตัว — ใช้ร่วมกันไม่ได้`);
    const bad = o.examples.find((e) => !Array.isArray(e.f) || e.f.length !== FEATURE_COUNT || !e.label);
    if (bad) throw new Error('มีตัวอย่างที่ข้อมูลไม่ครบในไฟล์');
    this.examples = o.examples.map((e) => ({ f: e.f.map(Number), label: String(e.label), t: e.t || 0 }));
    return this;
  }

  // ย้ายโมเดลไปเครื่องอื่น: ส่งออก/นำเข้าเป็นข้อความ JSON
  exportJSON() { return JSON.stringify(this.toObject()); }
  importJSON(text) { return this.fromObject(typeof text === 'string' ? JSON.parse(text) : text); }

  // บันทึก/โหลดผ่านฐานข้อมูลในเครื่อง (store 'ml') — import แบบหน่วงเวลา เพื่อให้ไฟล์นี้ทดสอบใน node ได้
  async save() { const db = await import('./db.js'); await db.put('ml', this.toObject()); return this.size; }
  async load() {
    const db = await import('./db.js');
    const o = await db.get('ml', MODEL_ID);
    if (o) this.fromObject(o);
    return !!o;
  }
}
