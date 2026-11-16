// ============================================================
// hud.js — แผงควบคุมเล็ก ๆ ที่อยู่ทุกหน้า
//
//   🌙 / ☀️   สลับธีมมืด-สว่าง   ใช้ระบบตั้งค่าเดิมของแอป (hr-prefs.light)
//   ไทย / EN  สลับภาษา            ใช้ระบบเดียวกับ i18n.js
//   🔬        เปิดโหมดวิจัย
//
// ทำไมไม่ไปใส่ในแต่ละหน้า  เพราะมี 34 หน้า ถ้าแก้ทีละหน้าจะหลุดและไม่ตรงกัน
// ไฟล์นี้ไฟล์เดียวจึงเป็นเจ้าของปุ่มทั้งสามปุ่มของทุกหน้า
// ============================================================
import { loadPrefs, savePrefs, applyPrefs } from './ui.js';
import * as research from './research-panel.js';
import { apply as applyLang, currentLang } from './i18n.js';

const T = (th, en) => (currentLang() === 'en' ? en : th);

function styles() {
  const s = document.createElement('style');
  s.textContent = `
  #hrHud{position:fixed;right:14px;bottom:14px;z-index:2147483000;
    display:flex;flex-direction:column;gap:8px;align-items:flex-end}
  #hrHud button{min-width:48px;height:40px;padding:0 13px;border-radius:999px;
    border:1px solid #ffffff2e;background:#101628eb;color:#eef2ff;
    font:600 14px/1 system-ui,-apple-system,"Noto Sans Thai",sans-serif;
    cursor:pointer;box-shadow:0 4px 14px #0006;backdrop-filter:blur(6px);
    display:flex;align-items:center;justify-content:center;gap:6px;
    transition:transform .12s ease, background .12s ease}
  #hrHud button:hover{transform:translateY(-2px)}
  #hrHud button.on{background:#5eead4;color:#06281f;border-color:transparent}
  body.light #hrHud button{background:#ffffffee;color:#17203a;border-color:#00000022;box-shadow:0 4px 14px #0002}
  body.light #hrHud button.on{background:#0d9c7f;color:#fff}
  /* เปิดโหมดวิจัยแล้วเลื่อนปุ่มมาทางซ้าย ไม่ให้ทับเนื้อหาในแผง */
  body.hr-research #hrHud{right:calc(min(430px,100%) + 14px)}
  @media (max-width:520px){ body.hr-research #hrHud{right:14px;bottom:auto;top:14px} }
  @media print{#hrHud{display:none}}
  `;
  document.head.appendChild(s);
}

function mk(id, label, title, onClick) {
  const b = document.createElement('button');
  b.id = id;
  b.type = 'button';
  b.textContent = label;
  b.title = title;
  b.setAttribute('aria-label', title);
  b.onclick = onClick;
  return b;
}

let hud, bTheme, bLang, bRes;

const SHOWEQ = 'hr-show-eq';
const showEq = () => { try { return localStorage.getItem(SHOWEQ) !== '0'; } catch { return true; } };

function refresh() {
  const p = loadPrefs();
  const light = !!p.light;
  bTheme.textContent = light ? '☀️' : '🌙';
  bTheme.title = light ? T('สลับเป็นโหมดมืด', 'Switch to dark mode') : T('สลับเป็นโหมดสว่าง', 'Switch to light mode');
  bLang.textContent = currentLang() === 'en' ? 'ไทย' : 'EN';
  bLang.title = currentLang() === 'en' ? 'สลับเป็นภาษาไทย' : 'Switch to English';
  bRes.title = T('โหมดวิจัย แสดงสมการ ค่าสด และเก็บข้อมูล', 'Research mode: equations, live values, data capture');
  // สวิตช์เดียวคุมว่าจะโชว์เครื่องมือวิจัยไหม ไม่ต้องแยกโหมด
  bRes.hidden = !showEq();
  bRes.classList.toggle('on', research.isOpen());
}

function build() {
  styles();
  hud = document.createElement('div');
  hud.id = 'hrHud';

  bTheme = mk('hrTheme', '🌙', '', () => {
    const p = savePrefs({ light: !loadPrefs().light });
    applyPrefs(p);
    refresh();
  });

  bLang = mk('hrLang', 'EN', '', () => {
    applyLang(currentLang() === 'en' ? 'th' : 'en');
    research.relabel();
    refresh();
  });

  bRes = mk('hrRes', '🔬', '', () => {
    if (research.isOpen()) research.close(); else research.open();
    document.body.classList.toggle('hr-research', research.isOpen());
    refresh();
  });

  hud.append(bTheme, bLang, bRes);
  document.body.appendChild(hud);

  // ธีมและขนาดตัวอักษรต้องถูกใส่ทุกหน้า บางหน้าเดิมไม่ได้เรียก applyPrefs เอง
  applyPrefs(loadPrefs());
  refresh();

  // ภาษาเปลี่ยนจากที่อื่นก็ให้ปุ่มตามไปด้วย
  window.addEventListener('hr-lang-change', refresh);
  window.addEventListener('hr-show-eq-change', refresh);
  window.addEventListener('storage', (e) => { if (e.key === SHOWEQ) refresh(); });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
else build();
