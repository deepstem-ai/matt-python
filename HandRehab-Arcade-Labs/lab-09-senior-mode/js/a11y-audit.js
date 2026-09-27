// ============================================================
// a11y-audit.js — ตรวจการเข้าถึงอัตโนมัติ (Lab 09)
// เดินดูทุกปุ่มที่มองเห็นบนจอ แล้วรายงานว่า
//   1) ปุ่มไหนเตี้ยกว่าเกณฑ์ (ค่าเริ่มต้น 56px เพราะผู้ใช้สูงอายุมือสั่น — มาตรฐานสากลคือ 44-48px)
//   2) ปุ่มไหนมีแต่ไอคอนไม่มีข้อความ หรือมีแต่ข้อความไม่มีไอคอน (กติกาแอป: ต้องมีทั้งคู่)
//   3) คู่สีตัวอักษร/พื้นคู่ไหนคอนทราสต์ต่ำกว่า 4.5 (ตรวจทั้งปุ่มและข้อความที่มองเห็น)
// ผลออกทั้ง console.table และคืนเป็นออบเจกต์ให้หน้าจอแสดง
// ============================================================
import { parseColor, blend, contrastRatio } from './contrast.js';

const BUTTONS = 'button, [role="button"], a.btn-glow, input[type="button"], input[type="submit"], .choice, select';
const TEXTS = 'h1, h2, h3, p, label, span, li, td, th, b, small, a, button, legend, code';
const ICON = /[\p{Extended_Pictographic}←-⇿⌀-⏿☀-➿⬀-⯿]/u;

// มองเห็นจริงไหม (ไม่ถูกซ่อน ไม่โปร่งใส มีขนาด)
function visible(el) {
  if (!el.getClientRects().length) return false;
  const cs = getComputedStyle(el);
  return cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0.05;
}

// อธิบาย element สั้น ๆ ให้คนอ่านรายงานรู้ว่าตัวไหน
function describe(el) {
  const text = (el.innerText || el.value || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 40);
  return `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.classList.length ? '.' + [...el.classList].slice(0, 2).join('.') : ''} "${text}"`;
}

// หาสีพื้นที่ตาเห็นจริงหลังตัวอักษร: ไล่ขึ้นไปหา parent จนเจอพื้นทึบ แล้วผสมชั้นโปร่งแสงลงมา
// คืน "รายการสี" (ถ้าพื้นเป็นไล่สี จะได้หลายสี แล้วเลือกค่าที่แย่ที่สุด)
function backgroundsOf(el) {
  const layers = [];
  for (let n = el; n; n = n.parentElement) {
    const cs = getComputedStyle(n);
    const img = cs.backgroundImage;
    if (img && img.includes('gradient')) {
      const stops = (img.match(/(rgba?\([^)]*\)|color\(srgb[^)]*\)|#[0-9a-f]{3,8})/gi) || []).map(parseColor).filter(Boolean);
      if (stops.length) { layers.push(stops); if (stops.every((c) => c.a >= 0.99)) break; continue; }
    }
    const c = parseColor(cs.backgroundColor);
    if (c && c.a > 0) { layers.push([c]); if (c.a >= 0.99) break; }
  }
  // ไม่มีพื้นทึบเลย → ใช้พื้นของหน้าเว็บ (ถือว่าขาว)
  let base = [{ r: 255, g: 255, b: 255, a: 1 }];
  for (let i = layers.length - 1; i >= 0; i--) {
    base = layers[i].flatMap((top) => base.map((under) => blend(top, under)));
  }
  return base;
}

// คอนทราสต์ที่แย่ที่สุดของตัวอักษรใน element นี้
export function textContrast(el) {
  const cs = getComputedStyle(el);
  const fg = parseColor(cs.color);
  if (!fg || fg.a === 0) return null; // ตัวอักษรไล่สี (background-clip:text) ข้ามไป
  const bgs = backgroundsOf(el);
  return Math.min(...bgs.map((bg) => contrastRatio(blend(fg, bg), bg)));
}

// มีข้อความจริงของตัวเองไหม (ไม่นับตัวอักษรของลูก)
const ownText = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && /[\p{L}\p{N}]/u.test(n.textContent));

export function auditA11y({ minHeight = 56, minContrast = 4.5, root = document, log = true } = {}) {
  const undersized = [], lowContrast = [], iconText = [];
  const buttons = [...root.querySelectorAll(BUTTONS)].filter(visible);

  for (const b of buttons) {
    const h = b.getBoundingClientRect().height;
    if (h < minHeight - 0.5) undersized.push({ element: describe(b), height: Math.round(h), need: minHeight, el: b });
    if (b.tagName !== 'SELECT') {
      const txt = (b.innerText || '').trim();
      const hasIcon = ICON.test(txt) || !!b.querySelector('.ico, svg, img');
      const hasText = /[\p{L}\p{M}]{2,}/u.test(txt.replace(ICON, ''));
      if (!hasIcon || !hasText) iconText.push({ element: describe(b), problem: !hasText ? 'มีแต่ไอคอน ไม่มีข้อความ' : 'มีแต่ข้อความ ไม่มีไอคอน', el: b });
    }
  }

  // ตรวจสีของปุ่มและข้อความทุกชิ้นที่มองเห็น (ปุ่มที่ปิดใช้งานได้รับการยกเว้นตาม WCAG)
  const texts = new Set([...buttons, ...[...root.querySelectorAll(TEXTS)].filter((e) => ownText(e) && visible(e))]);
  for (const el of texts) {
    if (el.disabled || el.closest('[disabled]')) continue;
    const r = textContrast(el);
    if (r !== null && r < minContrast) {
      lowContrast.push({ element: describe(el), ratio: +r.toFixed(2), need: minContrast, color: getComputedStyle(el).color, el });
    }
  }

  const result = { checkedButtons: buttons.length, checkedTexts: texts.size, undersized, iconText, lowContrast, ok: !undersized.length && !iconText.length && !lowContrast.length };
  if (log) {
    const strip = (a) => a.map(({ el, ...rest }) => rest);
    console.info(`[a11y] ตรวจปุ่ม ${buttons.length} ชิ้น ข้อความ ${texts.size} ชิ้น → ปุ่มเล็ก ${undersized.length} · ไอคอน/ข้อความ ${iconText.length} · คอนทราสต์ต่ำ ${lowContrast.length}`);
    if (undersized.length) console.table(strip(undersized));
    if (iconText.length) console.table(strip(iconText));
    if (lowContrast.length) console.table(strip(lowContrast));
  }
  return result;
}

// ใส่กรอบเตือนรอบ element ที่มีปัญหา (กดตรวจใหม่จะล้างของเก่าก่อน)
export function markProblems(result) {
  document.querySelectorAll('.a11y-flag').forEach((e) => e.classList.remove('a11y-flag'));
  [...result.undersized, ...result.iconText, ...result.lowContrast].forEach((p) => p.el.classList.add('a11y-flag'));
}
