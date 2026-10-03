// ============================================================
// sus.js — แบบวัดความสามารถในการใช้งาน System Usability Scale (SUS) · Lab 36
//   Brooke (1996) 10 ข้อมาตรฐาน ตอบ 1–5 (1 = ไม่เห็นด้วยอย่างยิ่ง … 5 = เห็นด้วยอย่างยิ่ง)
//   ข้อคี่ = ประโยคบวก ข้อคู่ = ประโยคลบ (ห้ามแก้ลำดับ/ความหมาย ไม่งั้นเทียบกับเกณฑ์ 68 ไม่ได้)
//   คะแนน SUS = 2.5 × [ Σ(ข้อคี่ − 1) + Σ(5 − ข้อคู่) ]  → 0..100
//   แผนการประเมินในบทความ (หัวข้อ 6.2): เทียบค่าเฉลี่ยกับ 68 (ค่าเฉลี่ยทั่วไปของ SUS)
// ฟังก์ชันบริสุทธิ์ ทดสอบใน node ได้
// ============================================================
export const SUS_BENCHMARK = 68;

// แปลไทยแบบตรงความหมายต้นฉบับ (คำว่า "ระบบนี้" = แอป HandRehab Arcade)
export const SUS_ITEMS = [
  { id: 'sus1', en: 'I think that I would like to use this system frequently.', th: 'ฉันคิดว่าฉันอยากใช้ระบบนี้บ่อย ๆ' },
  { id: 'sus2', en: 'I found the system unnecessarily complex.', th: 'ฉันพบว่าระบบนี้ซับซ้อนเกินความจำเป็น' },
  { id: 'sus3', en: 'I thought the system was easy to use.', th: 'ฉันคิดว่าระบบนี้ใช้งานง่าย' },
  { id: 'sus4', en: 'I think that I would need the support of a technical person to be able to use this system.', th: 'ฉันคิดว่าฉันต้องมีผู้ชำนาญด้านเทคนิคช่วย จึงจะใช้ระบบนี้ได้' },
  { id: 'sus5', en: 'I found the various functions in this system were well integrated.', th: 'ฉันพบว่าส่วนต่าง ๆ ของระบบนี้ทำงานเข้ากันได้ดี' },
  { id: 'sus6', en: 'I thought there was too much inconsistency in this system.', th: 'ฉันคิดว่าระบบนี้มีความไม่สม่ำเสมอ (ไม่คงเส้นคงวา) มากเกินไป' },
  { id: 'sus7', en: 'I would imagine that most people would learn to use this system very quickly.', th: 'ฉันคิดว่าคนส่วนใหญ่จะเรียนรู้วิธีใช้ระบบนี้ได้อย่างรวดเร็ว' },
  { id: 'sus8', en: 'I found the system very cumbersome to use.', th: 'ฉันพบว่าระบบนี้ใช้งานยุ่งยากมาก' },
  { id: 'sus9', en: 'I felt very confident using the system.', th: 'ฉันรู้สึกมั่นใจมากในการใช้ระบบนี้' },
  { id: 'sus10', en: 'I needed to learn a lot of things before I could get going with this system.', th: 'ฉันต้องเรียนรู้หลายอย่างก่อนจึงจะเริ่มใช้ระบบนี้ได้' },
];

// มาตร 1–5 ตามต้นฉบับ (เรียงซ้าย → ขวา = 1 → 5)
export const SUS_SCALE = [
  { v: 1, th: 'ไม่เห็นด้วยอย่างยิ่ง' },
  { v: 2, th: 'ไม่เห็นด้วย' },
  { v: 3, th: 'เฉย ๆ' },
  { v: 4, th: 'เห็นด้วย' },
  { v: 5, th: 'เห็นด้วยอย่างยิ่ง' },
];

// answers = { sus1: 1..5, …, sus10 } → คะแนน 0..100 (ตอบไม่ครบ / ค่านอกช่วง → null)
export function susScore(answers = {}) {
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    const v = answers[SUS_ITEMS[i].id];
    if (!Number.isInteger(v) || v < 1 || v > 5) return null;
    sum += i % 2 === 0 ? v - 1 : 5 - v;    // i = 0 คือข้อ 1 (คี่)
  }
  return 2.5 * sum;
}

// สรุปทั้งกลุ่ม: คะแนนรายคน + ค่าเฉลี่ย ± SD (ตัวอย่าง n−1) + เทียบ 68
export function susSummary(list = []) {
  const scores = list.map((s) => ({ participant: s.participant || s.userId, demo: !!s.demo, score: susScore(s.answers) })).filter((r) => r.score !== null);
  const v = scores.map((r) => r.score), n = v.length;
  const mean = n ? v.reduce((a, b) => a + b, 0) / n : null;
  const sd = n > 1 ? Math.sqrt(v.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1)) : n ? 0 : null;
  return { n, mean, sd, scores, benchmark: SUS_BENCHMARK, aboveBenchmark: mean !== null ? mean > SUS_BENCHMARK : null };
}

// ข้อมูลตัวอย่าง SUS 5 คน (ติดป้าย DEMO ห้ามใช้ในรายงาน)
export function demoSusSurveys(now = Date.now()) {
  const sets = [[4, 2, 5, 2, 4, 1, 4, 2, 4, 3], [5, 1, 4, 3, 4, 2, 5, 1, 4, 2], [3, 2, 4, 4, 3, 2, 3, 3, 3, 4], [4, 1, 5, 2, 5, 1, 4, 1, 5, 2], [4, 3, 3, 4, 4, 2, 3, 2, 3, 3]];
  return sets.map((a, i) => ({
    id: 'demo-sus' + (i + 1), userId: 'DEMO-P0' + (i + 1), participant: 'DEMO-P0' + (i + 1), instrument: 'sus', createdAt: now - (5 - i) * 3600e3,
    answers: Object.fromEntries(SUS_ITEMS.map((q, k) => [q.id, a[k]])), comment: '', demo: true,
  }));
}
