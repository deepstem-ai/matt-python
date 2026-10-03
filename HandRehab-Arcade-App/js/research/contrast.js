// ============================================================
// contrast.js — คำนวณค่าคอนทราสต์ของสีสองสีตามสูตร WCAG 2.x (Lab 05)
// ฟังก์ชันล้วน ไม่แตะหน้าจอ จึงทดสอบด้วย node ได้ (ดู js/contrast.test.mjs)
//
// สูตร: contrast = (L1 + 0.05) / (L2 + 0.05)   โดย L1 คือสีที่สว่างกว่า
// L (relative luminance) = 0.2126 R + 0.7152 G + 0.0722 B  (หลังแปลงค่าสีเป็นเชิงเส้น)
// เกณฑ์: ตัวอักษรปกติต้อง ≥ 4.5 (WCAG AA) — ผู้สูงอายุอ่านไม่ออกถ้าต่ำกว่านี้
// ============================================================

export const MIN_TEXT_CONTRAST = 4.5;

// แปลงข้อความสี → { r, g, b, a } (0-255, a 0-1)
// รองรับ #RGB #RRGGBB #RRGGBBAA, rgb()/rgba() ทั้งแบบคอมมาและเว้นวรรค, color(srgb r g b / a)
export function parseColor(input) {
  const s = String(input || '').trim().toLowerCase();
  let m;
  if ((m = s.match(/^#([0-9a-f]{3,8})$/))) {
    let h = m[1];
    if (h.length === 3 || h.length === 4) h = h.split('').map((c) => c + c).join('');
    if (h.length !== 6 && h.length !== 8) return null;
    const n = (i) => parseInt(h.slice(i, i + 2), 16);
    return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) / 255 : 1 };
  }
  if ((m = s.match(/^rgba?\(([^)]+)\)$/))) {
    const parts = m[1].split(/[\s,/]+/).filter(Boolean);
    const ch = (v) => (v.endsWith('%') ? (parseFloat(v) * 255) / 100 : parseFloat(v));
    const a = parts[3] === undefined ? 1 : parts[3].endsWith('%') ? parseFloat(parts[3]) / 100 : parseFloat(parts[3]);
    return { r: ch(parts[0]), g: ch(parts[1]), b: ch(parts[2]), a };
  }
  if ((m = s.match(/^color\(srgb\s+([^)]+)\)$/))) {
    const parts = m[1].split(/[\s/]+/).filter(Boolean).map(parseFloat);
    return { r: parts[0] * 255, g: parts[1] * 255, b: parts[2] * 255, a: parts[3] ?? 1 };
  }
  return null;
}

// วางสีโปร่งแสง (fg) ทับบนสีทึบ (bg) → ได้สีที่ตาเห็นจริง
export function blend(fg, bg) {
  const a = fg.a ?? 1;
  return { r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a), a: 1 };
}

// ความสว่างสัมพัทธ์ (relative luminance) 0 = ดำสนิท, 1 = ขาวสนิท
export function luminance(color) {
  const c = typeof color === 'string' ? parseColor(color) : color;
  if (!c) throw new Error('อ่านค่าสีไม่ได้: ' + color);
  const lin = (v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
}

// ค่าคอนทราสต์ 1 ถึง 21 (ลำดับสีสลับกันได้ ผลเท่าเดิม)
export function contrastRatio(colour1, colour2) {
  const L1 = luminance(colour1);
  const L2 = luminance(colour2);
  const hi = Math.max(L1, L2), lo = Math.min(L1, L2);
  return (hi + 0.05) / (lo + 0.05);
}

// ผ่านเกณฑ์ไหม (ค่าเริ่มต้น 4.5 สำหรับตัวอักษร)
export function passes(colour1, colour2, min = MIN_TEXT_CONTRAST) {
  return contrastRatio(colour1, colour2) >= min;
}

// แปลงสีใด ๆ เป็น #RRGGBB (ใช้กับ <input type=color> ที่รับแต่รูปแบบนี้)
export function toHex(color) {
  const c = typeof color === 'string' ? parseColor(color) : color;
  if (!c) return null;
  const h = (v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0');
  return ('#' + h(c.r) + h(c.g) + h(c.b)).toUpperCase();
}
