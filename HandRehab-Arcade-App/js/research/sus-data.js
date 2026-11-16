// ============================================================
// sus-data.js — System Usability Scale (Brooke 1996) 10 ข้อมาตรฐาน ฉบับภาษาไทย
//   ข้อคี่ (1,3,5,7,9) = ข้อความเชิงบวก · ข้อคู่ (2,4,6,8,10) = ข้อความเชิงลบ (สลับกันตามต้นฉบับ)
//   ตอบ 1–5: 1 = ไม่เห็นด้วยอย่างยิ่ง … 5 = เห็นด้วยอย่างยิ่ง
//   คะแนน = 2.5 × [Σ(ข้อคี่ − 1) + Σ(5 − ข้อคู่)] → 0–100 (stats.js susScore) เทียบค่าเฉลี่ย 68
//   คำแปลรักษาความหมายของต้นฉบับทีละข้อ คำว่า "ระบบ" หมายถึงแอป HandRehab Arcade
// ============================================================
export const SUS_ITEMS = [
  { id: 'sus1', th: 'ฉันคิดว่าฉันอยากใช้ระบบนี้บ่อย ๆ', en: 'I think that I would like to use this system frequently.' },
  { id: 'sus2', th: 'ฉันพบว่าระบบนี้ซับซ้อนเกินความจำเป็น', en: 'I found the system unnecessarily complex.' },
  { id: 'sus3', th: 'ฉันคิดว่าระบบนี้ใช้งานง่าย', en: 'I thought the system was easy to use.' },
  { id: 'sus4', th: 'ฉันคิดว่าฉันต้องได้รับความช่วยเหลือจากผู้ที่มีความรู้ด้านเทคนิคจึงจะใช้ระบบนี้ได้', en: 'I think that I would need the support of a technical person to be able to use this system.' },
  { id: 'sus5', th: 'ฉันพบว่าฟังก์ชันต่าง ๆ ของระบบนี้ทำงานร่วมกันได้อย่างดี', en: 'I found the various functions in this system were well integrated.' },
  { id: 'sus6', th: 'ฉันคิดว่าระบบนี้มีความไม่สอดคล้องกันมากเกินไป', en: 'I thought there was too much inconsistency in this system.' },
  { id: 'sus7', th: 'ฉันคิดว่าคนส่วนใหญ่จะเรียนรู้วิธีใช้ระบบนี้ได้อย่างรวดเร็ว', en: 'I would imagine that most people would learn to use this system very quickly.' },
  { id: 'sus8', th: 'ฉันพบว่าระบบนี้ใช้งานยุ่งยากมาก', en: 'I found the system very cumbersome to use.' },
  { id: 'sus9', th: 'ฉันรู้สึกมั่นใจมากในการใช้ระบบนี้', en: 'I felt very confident using the system.' },
  { id: 'sus10', th: 'ฉันต้องเรียนรู้หลายสิ่งก่อนจึงจะเริ่มใช้ระบบนี้ได้', en: 'I needed to learn a lot of things before I could get going with this system.' },
];
export const AGREE = [
  { v: 1, th: 'ไม่เห็นด้วยอย่างยิ่ง', icon: '1' },
  { v: 2, th: 'ไม่เห็นด้วย', icon: '2' },
  { v: 3, th: 'เฉย ๆ / ไม่แน่ใจ', icon: '3' },
  { v: 4, th: 'เห็นด้วย', icon: '4' },
  { v: 5, th: 'เห็นด้วยอย่างยิ่ง', icon: '5' },
];

// ข้อมูลตัวอย่าง 5 คน (ติดป้าย demo ห้ามใช้ในรายงาน) — ได้คะแนนประมาณ 55–90
export function demoSusSurveys(now = Date.now()) {
  const sets = [[5, 1, 5, 2, 4, 1, 5, 1, 4, 2], [4, 2, 4, 2, 4, 2, 4, 2, 4, 3], [3, 3, 4, 3, 3, 2, 4, 3, 3, 3], [5, 2, 4, 1, 5, 1, 5, 2, 5, 1], [4, 2, 3, 3, 4, 2, 3, 2, 4, 3]];
  return sets.map((v, i) => ({ id: 'demo-sus' + (i + 1), type: 'sus', userId: 'DEMO-P0' + (i + 1), participant: 'DEMO-P0' + (i + 1), createdAt: now - (5 - i) * 3600e3,
    answers: Object.fromEntries(v.map((x, j) => ['sus' + (j + 1), x])), comment: '', demo: true }));
}
