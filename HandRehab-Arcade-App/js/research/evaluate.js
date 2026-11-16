// ============================================================
// evaluate.js — วัดความแม่นยำแบบนักวิจัย (Lab 32) ฟังก์ชันบริสุทธิ์ทั้งหมด ทดสอบใน node ได้
//   trial = { requested: 'fist', detected: 'fist' | 'none' | ..., condition: 'bright'|'normal'|'dim', brightness, ... }
//   confusionMatrix → accuracy → perClass (precision / recall / F1) → macro
// ห้ามแตะ: กล้อง หน้าจอ ฐานข้อมูล
// ============================================================
export const NONE = 'none';
export const CONDITIONS = ['bright', 'normal', 'dim'];
export const CONDITION_TH = { bright: 'สว่าง', normal: 'ปกติ', dim: 'มืด' };

// เมทริกซ์ความสับสน: แถว = ท่าที่ขอ, คอลัมน์ = ท่าที่ระบบตรวจได้ (+ คอลัมน์ none = ไม่พบท่า/ไม่เห็นมือ)
// ท่าที่ตรวจได้แต่ไม่อยู่ในรายการ ก็นับเป็น none
export function confusionMatrix(trials, labels) {
  const cols = [...labels, NONE];
  const m = labels.map(() => cols.map(() => 0));
  for (const t of trials) {
    const r = labels.indexOf(t.requested);
    if (r < 0) continue;
    let c = cols.indexOf(t.detected);
    if (c < 0) c = cols.length - 1;
    m[r][c]++;
  }
  return { rows: labels, cols, m };
}

const sum = (a) => a.reduce((s, v) => s + v, 0);

// ความแม่นยำรวม = ทายถูก ÷ ทั้งหมด
export function accuracy(cm) {
  const total = sum(cm.m.map(sum));
  const correct = sum(cm.rows.map((_, i) => cm.m[i][i]));
  return total ? correct / total : 0;
}

// ต่อท่า: precision = TP ÷ (จำนวนครั้งที่ระบบ "บอกว่า" เป็นท่านี้)
//         recall    = TP ÷ (จำนวนครั้งที่ "ขอ" ท่านี้)
//         F1        = 2PR ÷ (P + R)
// ถ้าตัวหารเป็น 0 ให้ค่า 0 (เหมือน scikit-learn zero_division=0) และบอกไว้ใน defined
export function perClass(cm) {
  return cm.rows.map((label, i) => {
    const tp = cm.m[i][i];
    const predicted = sum(cm.m.map((row) => row[i]));
    const support = sum(cm.m[i]);
    const precision = predicted ? tp / predicted : 0;
    const recall = support ? tp / support : 0;
    const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
    return { label, tp, predicted, support, precision, recall, f1, defined: predicted > 0 && support > 0 };
  });
}

// ค่าเฉลี่ยแบบ macro = เฉลี่ยทุกท่าเท่า ๆ กัน (ท่าที่ทดสอบน้อยไม่ถูกกลบ) นับเฉพาะท่าที่มีการทดสอบ
export function macro(per) {
  const p = per.filter((x) => x.support > 0);
  const avg = (k) => (p.length ? sum(p.map((x) => x[k])) / p.length : 0);
  return { precision: avg('precision'), recall: avg('recall'), f1: avg('f1') };
}

// รวมทุกอย่างในครั้งเดียว
export function summarise(trials, labels) {
  const cm = confusionMatrix(trials, labels);
  const per = perClass(cm);
  return { n: trials.length, cm, accuracy: accuracy(cm), per, macro: macro(per), noneRate: trials.length ? trials.filter((t) => t.detected === NONE).length / trials.length : 0 };
}

// ความแม่นยำแยกตามสภาพแสง + ความสว่างเฉลี่ยที่วัดจริง
export function byCondition(trials, conditions = CONDITIONS) {
  return conditions.map((c) => {
    const ts = trials.filter((t) => t.condition === c);
    const correct = ts.filter((t) => t.requested === t.detected).length;
    const br = ts.map((t) => t.brightness).filter(Number.isFinite);
    const hf = ts.map((t) => t.handFoundPct).filter(Number.isFinite);
    return {
      condition: c, n: ts.length, correct, accuracy: ts.length ? correct / ts.length : null,
      meanBrightness: br.length ? sum(br) / br.length : null,
      handFoundPct: hf.length ? sum(hf) / hf.length : null,
      noneRate: ts.length ? ts.filter((t) => t.detected === NONE).length / ts.length : null,
    };
  });
}

// ผลโหวตเสียงข้างมากในช่วง 1 วินาที — เฟรมที่ไม่เห็นมือ (null) นับเป็นเสียงของ 'none'
// เสมอกัน → เลือกท่าที่ได้เสียงล่าสุด (ท่าที่ผู้ใช้ทำค้างอยู่ตอนจบช่วง)
export function majority(votes) {
  const c = new Map();
  votes.forEach((v, i) => { const k = v ?? NONE; const e = c.get(k) || { n: 0, last: -1 }; e.n++; e.last = i; c.set(k, e); });
  let best = NONE, bn = 0, bl = -1;
  for (const [k, e] of c) if (e.n > bn || (e.n === bn && e.last > bl)) { best = k; bn = e.n; bl = e.last; }
  return best;
}

// ตารางการเรียกท่าแบบสุ่ม: ทุกท่า n ครั้ง แล้วสลับลำดับ (Fisher–Yates)
export function makeSchedule(labels, n, rnd = Math.random) {
  const a = labels.flatMap((l) => Array(n).fill(l));
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// คู่ที่สับสนกันมากที่สุด (นอกแนวทแยง)
export function topConfusion(cm) {
  let best = null;
  cm.rows.forEach((r, i) => cm.cols.forEach((c, j) => { if (i !== j && cm.m[i][j] > (best?.count || 0)) best = { requested: r, detected: c, count: cm.m[i][j] }; }));
  return best;
}
