// ============================================================
// settings.js — หน้าตั้งค่า: ขนาด ธีม โหมดสงบ ภาษา ความไว (Lab 09)
// ทุกค่าบันทึกผ่าน savePrefs() ของ ui.js (localStorage 'hr-prefs') และมีผลทันทีโดยไม่ต้องรีสตาร์ต
// หลักการ: ใส่ class บน <body> แล้วให้ CSS สลับตัวแปรขนาดทั้งหมดเอง (ดู themes.css)
// ============================================================
import { definePage, setTransition } from './router.js';
import { loadPrefs, savePrefs, applyPrefs, toast, esc } from './ui.js';
import { applyLang } from './i18n.js';
import { auditA11y, markProblems } from './a11y-audit.js';

const $ = (s) => document.querySelector(s);
// ขนาดตัวอักษรฐานของแต่ละโปรไฟล์ (ต้องตรงกับ themes.css)
const BASE_PX = { standard: 16, elder: 21.6, kiosk: 28 };

// ใช้ค่าทั้งหมดกับหน้าจอ (เรียกตอนเปิดแอป และทุกครั้งที่เปลี่ยนค่า)
export function applyAllPrefs(p = loadPrefs()) {
  applyPrefs(p);                         // class ธีม / โปรไฟล์ / calm / light
  const scale = (p.textScale || 100) / 100;
  if (scale !== 1) {
    const base = p.theme === 'large' && p.profile === 'standard' ? 22 : BASE_PX[p.profile] || 16;
    document.body.style.setProperty('--fs-base', (base * scale).toFixed(1) + 'px');
  } else document.body.style.removeProperty('--fs-base');
  setTransition(p.transition || 'fade', p.transitionMs || 250);
  applyLang(p.lang);
}

// เปลี่ยนค่าแล้วบันทึก + ใช้ทันที
function set(patch) {
  const p = savePrefs(patch);
  applyAllPrefs(p);
  syncControls();
  window.dispatchEvent(new CustomEvent('prefs-changed', { detail: p })); // ให้แถบบนอัปเดตภาษา
}

// ให้ปุ่ม/สวิตช์ในหน้าตรงกับค่าที่บันทึกไว้
function syncControls() {
  const p = loadPrefs();
  document.querySelectorAll('input[name=profile]').forEach((r) => { r.checked = r.value === p.profile; });
  document.querySelectorAll('input[name=theme]').forEach((r) => { r.checked = r.value === p.theme; });
  $('#calmSw').checked = !!p.calm;
  $('#lightSw').checked = !!p.light;
  $('#speechSw').checked = !!p.speech;
  $('#langSel').value = p.lang || 'th';
  $('#scaleSlider').value = p.textScale || 100; $('#scaleVal').textContent = (p.textScale || 100) + '%';
  $('#sensSlider').value = Math.round((p.sensitivity ?? 0.5) * 100); $('#sensVal').textContent = Math.round((p.sensitivity ?? 0.5) * 100) + '%';
  $('#transSel').value = p.transition || 'fade';
  $('#durSlider').value = p.transitionMs || 250; $('#durVal').textContent = p.transitionMs || 250;
}

// ---------- ต่อสายตัวควบคุม ----------
document.querySelectorAll('input[name=profile]').forEach((r) => r.addEventListener('change', () => set({ profile: r.value })));
document.querySelectorAll('input[name=theme]').forEach((r) => r.addEventListener('change', () => set({ theme: r.value })));
$('#calmSw').addEventListener('change', (e) => set({ calm: e.target.checked }));
$('#lightSw').addEventListener('change', (e) => set({ light: e.target.checked }));
$('#speechSw').addEventListener('change', (e) => set({ speech: e.target.checked }));
$('#langSel').addEventListener('change', (e) => set({ lang: e.target.value }));
$('#scaleSlider').addEventListener('input', (e) => set({ textScale: +e.target.value }));
// ความไว 0.2-0.9 จะถูกใช้เป็นเกณฑ์การตรวจท่ามือในแลปต่อ ๆ ไป (Lab 19 ขึ้นไป)
$('#sensSlider').addEventListener('input', (e) => set({ sensitivity: +e.target.value / 100 }));
$('#transSel').addEventListener('change', (e) => set({ transition: e.target.value }));
$('#durSlider').addEventListener('input', (e) => set({ transitionMs: +e.target.value }));

// ---------- ปุ่มตรวจการเข้าถึง ----------
export function runAudit() {
  const r = auditA11y({ minHeight: 56 });
  markProblems(r);
  const out = $('#auditOut');
  out.className = 'alert ' + (r.ok ? 'ok' : 'warn');
  const list = (arr, fmt) => (arr.length ? '<ul>' + arr.slice(0, 12).map((x) => `<li>${fmt(x)}</li>`).join('') + (arr.length > 12 ? `<li>...และอีก ${arr.length - 12}</li>` : '') + '</ul>' : '');
  out.innerHTML = `${r.ok ? '✔' : '⚠'} ตรวจปุ่ม ${r.checkedButtons} ชิ้น และข้อความ ${r.checkedTexts} ชิ้นบนจอนี้<br>
    ปุ่มเตี้ยกว่า 56px: <b>${r.undersized.length}</b>${list(r.undersized, (x) => `${esc(x.element)} สูง ${x.height}px`)}
    ปุ่มที่ขาดไอคอนหรือข้อความ: <b>${r.iconText.length}</b>${list(r.iconText, (x) => `${esc(x.element)} — ${x.problem}`)}
    คู่สีคอนทราสต์ต่ำกว่า 4.5: <b>${r.lowContrast.length}</b>${list(r.lowContrast, (x) => `${esc(x.element)} = ${x.ratio}:1`)}
    <span class="muted">รายละเอียดเต็มอยู่ใน Console (F12) ในรูปตาราง console.table</span>`;
  toast(r.ok ? 'ผ่านการตรวจทุกข้อ' : 'พบจุดที่ต้องแก้ ดูรายการในหน้าตั้งค่า', r.ok ? 'success' : 'warning');
  return r;
}
$('#auditBtn').addEventListener('click', runAudit);

definePage('settings', { onEnter: syncControls });
