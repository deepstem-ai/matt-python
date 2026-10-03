// ============================================================
// discussion.js — เขียนย่อหน้าอภิปรายผลภาษาไทยจาก "ตัวเลขจริง" ของการทดลอง (Lab 32)
// เป็นแม่แบบ (template) ที่เติมค่าที่วัดได้ ทีมควรอ่านแล้วเรียบเรียงเป็นภาษาของตัวเองก่อนใส่รายงาน
// ฟังก์ชันบริสุทธิ์ ทดสอบใน node ได้
// ============================================================
import { CONDITION_TH, topConfusion } from './evaluate.js';

const pct = (v) => (v == null ? '-' : (v * 100).toFixed(1) + '%');
const num = (v) => (v == null ? '-' : Math.round(v));

// summary = summarise(...), cond = byCondition(...), opts = { hypothesis, detector: 'rule'|'knn', nameOf, simulated }
export function discussionTH(summary, cond, { hypothesis = '2', detector = 'rule', nameOf = (x) => x, simulated = false } = {}) {
  const done = cond.filter((c) => c.n > 0);
  const det = detector === 'knn' ? 'ตัวจำแนก kNN ที่ทีมสอนเอง (Lab 31)' : 'ตัวตรวจท่าแบบกฎ 5 ท่า (Lab 19-20)';
  const parts = [];
  parts.push(`ผลการทดลองเพื่อตอบสมมติฐานข้อที่ ${hypothesis}: ${det} มีความแม่นยำรวม ${pct(summary.accuracy)} จากการทดสอบ ${summary.n} ครั้ง ` +
    `(precision เฉลี่ย ${pct(summary.macro.precision)}, recall เฉลี่ย ${pct(summary.macro.recall)}, F1 เฉลี่ยแบบ macro ${pct(summary.macro.f1)})`);

  if (done.length) {
    parts.push('เมื่อแยกตามสภาพแสง (ตัวเลขในวงเล็บคือความสว่างเฉลี่ยที่วัดจากภาพกล้องจริง 0-255 ไม่ใช่ค่าที่ผู้ใช้เลือก) ' + done.map((c) => `แสง${CONDITION_TH[c.condition]} (${num(c.meanBrightness)}) ได้ความแม่นยำ ${pct(c.accuracy)}`).join(', '));
  }
  const b = cond.find((c) => c.condition === 'bright' && c.n), d = cond.find((c) => c.condition === 'dim' && c.n);
  if (b && d) {
    const drop = (b.accuracy - d.accuracy) * 100;
    if (drop > 2) {
      parts.push(`ความแม่นยำในแสงมืดต่ำกว่าแสงสว่าง ${drop.toFixed(1)} จุดเปอร์เซ็นต์ ซึ่งสอดคล้องกับสมมติฐาน` +
        (d.noneRate != null ? ` และสัดส่วนครั้งที่ระบบไม่พบท่าเลย (none) เพิ่มจาก ${pct(b.noneRate)} เป็น ${pct(d.noneRate)}` : ''));
    } else {
      parts.push(`ความแม่นยำในแสงมืดกับแสงสว่างต่างกันเพียง ${Math.abs(drop).toFixed(1)} จุดเปอร์เซ็นต์ จึงยังไม่สนับสนุนสมมติฐานอย่างชัดเจน อาจเป็นเพราะกล้องปรับค่าแสงอัตโนมัติ หรือห้อง "มืด" ยังสว่างพอ (ควรทำซ้ำโดยลดแสงให้ความสว่างที่วัดได้ต่ำกว่านี้)`);
    }
  }
  parts.push('สาเหตุที่แสงมีผลต่อความแม่นยำ อธิบายได้จากหลักการทำงานของโมเดล: เมื่อแสงน้อย กล้องต้องเพิ่มความไวแสงและเปิดชัตเตอร์นานขึ้น ภาพจึงมีสัญญาณรบกวนและเบลอ ขอบนิ้วกับพื้นหลังมีความต่างของสี (contrast) ต่ำ ' +
    'ตัวหาฝ่ามือ (palm detector) ของ MediaPipe ซึ่งเป็นขั้นแรกจึงให้ค่าความมั่นใจต่ำกว่าเกณฑ์ 0.5 บ่อยขึ้นจนหามือไม่เจอ และแม้หาเจอ ตำแหน่งจุด landmark ทั้ง 21 จุดก็สั่นและคลาดเคลื่อนมากขึ้น ' +
    (detector === 'knn'
      ? 'ทำให้ตัวเลข 25 ตัวที่หารด้วยขนาดฝ่ามือแล้วเปลี่ยนไป จุดของท่าหนึ่งจึงไปอยู่ใกล้ "เพื่อนบ้าน" ของอีกท่าหนึ่ง kNN จึงโหวตผิด'
      : 'ทำให้ค่าความงอของนิ้วและระยะระหว่างปลายนิ้วที่หารด้วยขนาดฝ่ามือแล้วข้ามหรือไม่ถึงค่าเกณฑ์ ตัวตรวจแบบกฎจึงตัดสินผิด'));
  const top = topConfusion(summary.cm);
  if (top) parts.push(`คู่ที่ระบบสับสนมากที่สุดคือ ขอท่า "${nameOf(top.requested)}" แต่ตรวจได้เป็น "${nameOf(top.detected)}" จำนวน ${top.count} ครั้ง`);
  if (summary.accuracy > 0.99 && summary.n >= 20) parts.push('ข้อควรระวัง: ความแม่นยำเกิน 99% ต้องตรวจก่อนว่าไม่ได้ทดสอบด้วยข้อมูลชุดเดียวกับที่ใช้ฝึก');
  if (simulated) parts.push('(หมายเหตุ: ตัวเลขชุดนี้มาจากโหมดจำลองด้วยมือสังเคราะห์ ใช้สาธิตหน้าจอเท่านั้น ห้ามนำไปรายงานเป็นผลการทดลองจริง)');
  return parts.join(' ') + '';
}
