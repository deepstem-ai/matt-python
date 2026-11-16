// ============================================================
// draft-engine.js — เติมแม่แบบรายงาน (templates/*.md) ด้วยข้อมูลจริง (Lab 38, 39)
// รูปแบบช่องว่างในแม่แบบ:
//   [[ใส่ค่าจาก Lab NN: คำอธิบาย #คีย์]]  → แทนด้วยค่าจริง ถ้าไม่มี → [[missing: กลับไป Lab NN — คำอธิบาย]]
//   {{คีย์}}                               → ค่าตั้งต้นของทีม (ชื่อทีม เกณฑ์ที่ทีมเลือก)
//   [[ใส่สถิติจากแหล่งอ้างอิงจริง: ...]] และ [[ทีมเขียนเอง: ...]] → ปล่อยไว้ให้ทีมทำเอง
// กฎเหล็ก: ไม่มีข้อมูล = ไม่เติม ห้ามเดาตัวเลขเด็ดขาด
// ============================================================

const SLOT = /\[\[ใส่ค่าจาก Lab (\d+): ([^#\]]+?)\s*#(\w+)\]\]/g;

// มีค่าจริงไหม (ช่องว่าง / null / NaN = ไม่มี)
export const hasValue = (v) => v !== undefined && v !== null && String(v).trim() !== '' && !(typeof v === 'number' && !Number.isFinite(v));

export function fillTemplate(text, values = {}, meta = {}) {
  return String(text)
    .replace(/<!--[\s\S]*?-->\n?/g, '')                                   // ตัดคำอธิบายสำหรับนักเรียนออก
    .replace(SLOT, (all, lab, desc, key) => (hasValue(values[key]) ? String(values[key]) : `[[missing: กลับไป Lab ${lab.padStart(2, '0')} — ${desc.trim()}]]`))
    .replace(/\{\{(\w+)\}\}/g, (all, key) => (hasValue(meta[key]) ? String(meta[key]) : `[[missing: ${key}]]`));
}

// รายการช่องที่ยังขาด (ไว้แสดงเป็นรายการ "ต้องกลับไปวัด")
export function missingList(text) {
  return [...String(text).matchAll(/\[\[missing: ([^\]]+)\]\]/g)].map((m) => m[1]);
}
// ช่องที่ทีมต้องเขียน/ค้นเอง
export function todoList(text) {
  return [...String(text).matchAll(/\[\[(ใส่สถิติจากแหล่งอ้างอิงจริง|ทีมเขียนเอง): ([^\]]+)\]\]/g)].map((m) => `${m[1]}: ${m[2]}`);
}
// คีย์ทั้งหมดที่แม่แบบต้องการ (ใช้สร้างฟอร์มหรือตรวจว่าขาดอะไร)
export function slotKeys(text) {
  return [...String(text).matchAll(SLOT)].map((m) => ({ lab: +m[1], desc: m[2].trim(), key: m[3] }));
}

// แปลงข้อความตาราง "a | b | c" หลายบรรทัด เป็นตาราง Markdown (ช่องว่าง = missing)
export function linesToTable(text, headers, lab, what = 'ข้อมูล') {
  const rows = String(text || '').split('\n').map((l) => l.trim()).filter(Boolean).map((l) => l.split('|').map((c) => c.trim()));
  if (!rows.length) return '';
  const cell = (c, i) => (hasValue(c) ? c.replace(/\|/g, '\\|') : `[[missing: กลับไป Lab ${String(lab).padStart(2, '0')} — ${headers[i] || what}]]`);
  return [`| ${headers.join(' | ')} |`, `|${headers.map(() => '---').join('|')}|`,
    ...rows.map((r) => `| ${headers.map((h, i) => cell(r[i], i)).join(' | ')} |`)].join('\n');
}

// เก็บ/อ่านฟอร์มใน localStorage (สะดวกเฉพาะเครื่องนี้ พังได้ก็ไม่เป็นไร)
export function saveForm(key, obj) { try { localStorage.setItem(key, JSON.stringify(obj)); } catch { /* ไม่เป็นไร */ } }
export function loadForm(key) { try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch { return {}; } }
