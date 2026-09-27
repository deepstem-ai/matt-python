// ============================================================
// detectors.js — ตัวตรวจท่า 2 แบบที่นำมาวัดผล + โหมดจำลอง (Lab 32)
//   1) rule: ตัวตรวจแบบกฎ 5 ท่าจาก gestures.js → ท่าที่ active และคะแนนสูงสุด หรือ 'none'
//   2) knn : โมเดล kNN ที่สอนใน Lab 31 (อ่านอย่างเดียว ห้ามเพิ่มตัวอย่างจากหน้านี้)
// ไม่แตะหน้าจอ/กล้อง → ใช้ใน node ได้
// ============================================================
import { detectAll, GESTURE_KEYS, GESTURE_INFO } from './gestures.js';
import { extractFeatures, KNNClassifier } from './ml.js';
import { variedHand, PRESETS, makeRng, gauss } from './synth-hand.js';
import { NONE, majority, makeSchedule } from './evaluate.js';

export const RULE_LABELS = GESTURE_KEYS; // pinch, fist, open, fingerTap, wristFlex
export const ruleName = (k) => (GESTURE_INFO[k] ? `${GESTURE_INFO[k].icon} ${GESTURE_INFO[k].th}` : k === NONE ? '∅ ไม่พบ' : k);

// ตัวตรวจแบบกฎ: คืน null ถ้าไม่เห็นมือ, 'none' ถ้าเห็นมือแต่ไม่มีท่าไหนถึงเกณฑ์
export function ruleDetect(pts) {
  if (!pts) return null;
  const all = detectAll(pts);
  let best = NONE, bs = -1;
  for (const k of RULE_LABELS) if (all[k].active && all[k].score > bs) { best = k; bs = all[k].score; }
  return best;
}

// ตัวตรวจ kNN (โมเดลเดิมจาก Lab 31) — เรียกแค่ predict เท่านั้น ไม่เคย addExample
export function knnDetector(model, k = 5) {
  return (pts) => (pts ? model.predict(extractFeatures(pts), k).label ?? NONE : null);
}

// ---------- โหมดจำลอง ----------
// ท่าจำลองของตัวตรวจแบบกฎ (wristFlex = หมุนฝ่ามือรอบข้อมือ 50°)
const RULE_POSES = {
  pinch: () => ({ p: { pinch: true, spread: 8 } }),
  fist: () => ({ p: { curls: { index: 1, middle: 1, ring: 1, little: 1, thumb: 0.6 } } }),
  open: () => ({ p: { spread: 17 } }),
  fingerTap: (rnd) => ({ p: { curls: { [['index', 'middle', 'ring'][Math.floor(rnd() * 3)]]: 1 }, spread: 8 } }),
  wristFlex: (rnd) => ({ p: { spread: 4, curls: { thumb: 0.3 } }, rot: (rnd() < 0.5 ? -1 : 1) * 55 }),
};
export const KNN_DEMO_LABELS = ['แบมือ', 'กำมือ', 'จีบนิ้ว', 'ชูสองนิ้ว', 'ชี้นิ้ว'];

// สภาพแสงจำลอง: ความสว่างเฉลี่ย, สัญญาณรบกวนของจุด (เท่าของขนาดมือ), โอกาสหามือไม่เจอต่อเฟรม
export const SIM_LIGHT = {
  bright: { brightness: 180, noise: 0.02, lost: 0.03 },
  normal: { brightness: 120, noise: 0.04, lost: 0.1 },
  dim: { brightness: 42, noise: 0.12, lost: 0.42 },
};

// โมเดลสาธิต: ฝึกด้วยมือจำลอง seed 1 (ชุดทดสอบใช้ seed อื่น จึงไม่ซ้ำกัน)
export function buildDemoModel(perLabel = 30) {
  const m = new KNNClassifier(), rnd = makeRng(1);
  for (const l of KNN_DEMO_LABELS) for (let i = 0; i < perLabel; i++) m.addExample(extractFeatures(variedHand(PRESETS[l], rnd, { noise: 0.015 })), l);
  return m;
}

// สร้างผลการทดสอบจำลองทั้งชุด: ทุกสภาพแสง × ทุกท่า × nPer ครั้ง, หน้าต่าง 1 วินาที = 10 เฟรม
export function simulateTrials({ detector = 'rule', model, k = 5, nPer = 10, conditions = ['bright', 'normal', 'dim'], seed = 777, frames = 10 } = {}) {
  const rnd = makeRng(seed);
  const labels = detector === 'knn' ? KNN_DEMO_LABELS : RULE_LABELS;
  const detect = detector === 'knn' ? knnDetector(model || buildDemoModel(), k) : ruleDetect;
  const trials = [];
  for (const condition of conditions) {
    const L = SIM_LIGHT[condition];
    for (const requested of makeSchedule(labels, nPer, rnd)) {
      const pose = detector === 'knn' ? { p: PRESETS[requested] } : RULE_POSES[requested](rnd);
      const votes = [];
      let found = 0;
      for (let f = 0; f < frames; f++) {
        if (rnd() < L.lost) { votes.push(null); continue; }
        found++;
        votes.push(detect(variedHand(pose.p, rnd, { noise: L.noise, rotate: 10, extraRotate: pose.rot || 0, aspect: 16 / 9 })));
      }
      trials.push({
        i: trials.length + 1, condition, requested, detected: majority(votes), votes: voteText(votes),
        frames, handFoundPct: Math.round((100 * found) / frames), brightness: +(L.brightness + gauss(rnd) * 6).toFixed(1), t: Date.now(), simulated: true,
      });
    }
  }
  return { labels, trials };
}

// สรุปเสียงโหวตเป็นข้อความสั้น เช่น "fist×7, ไม่เห็นมือ×3"
export function voteText(votes) {
  const c = {};
  votes.forEach((v) => { const k = v ?? 'ไม่เห็นมือ'; c[k] = (c[k] || 0) + 1; });
  return Object.entries(c).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k}×${n}`).join(', ');
}
