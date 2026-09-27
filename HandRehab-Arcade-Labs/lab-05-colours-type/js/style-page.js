// ============================================================
// style-page.js — หน้าแสดงสีและตัวอักษรทั้งหมด (Lab 05)
// อ่านสีจริงจาก CSS variable ที่หน้าจอใช้อยู่ตอนนี้ แล้วคำนวณคอนทราสต์ทุกคู่
// ไม่มีรหัสสีเขียนตรง ๆ ในไฟล์นี้เลย ทุกสีมาจาก tokens.css / themes.css
// ============================================================
import { loadPrefs, savePrefs, applyPrefs, cssVar, downloadText, toast, esc } from './ui.js';
import { contrastRatio, toHex, MIN_TEXT_CONTRAST } from './contrast.js';
import { runTests } from './contrast-tests.js';

// สี 9 สีหลักตามโจทย์ + สีเสริม 4 สี
// kind: text = สีที่ใช้เป็นตัวอักษร/เส้นเน้น (วัดกับพื้นหลัง) · surface = สีพื้น (วัดตัวอักษรหลักบนมัน) · decor = ตกแต่งเท่านั้น
const COLOURS = [
  { v: '--bg', th: 'พื้นหลังหลัก', kind: 'surface' },
  { v: '--card', th: 'พื้นการ์ด', kind: 'surface' },
  { v: '--primary', th: 'สีหลัก (แบรนด์)', kind: 'text' },
  { v: '--secondary', th: 'สีรอง (แบรนด์)', kind: 'text' },
  { v: '--success', th: 'สำเร็จ / ถูก', kind: 'text' },
  { v: '--warning', th: 'เตือน / ยังไม่พอ', kind: 'text' },
  { v: '--error', th: 'ผิดพลาด / หยุด', kind: 'text' },
  { v: '--text', th: 'ตัวอักษรหลัก', kind: 'text' },
  { v: '--text-2', th: 'ตัวอักษรรอง', kind: 'text' },
  { v: '--input', th: 'พื้นช่องกรอก / ปุ่มรอง', kind: 'surface', extra: true },
  { v: '--pink', th: 'ชมพูนีออน (ฉลอง)', kind: 'text', extra: true },
  { v: '--sky', th: 'ฟ้าอ่อน (กราฟ)', kind: 'text', extra: true },
  { v: '--line', th: 'เส้นแบ่ง (ห้ามใช้กับตัวอักษร)', kind: 'decor', extra: true },
];

// คู่สี [ตัวอักษร, พื้น, ใช้ที่ไหน] ที่แอปใช้จริง ทุกคู่ต้อง ≥ 4.5
const PAIRS = [
  ['--text', '--bg', 'ตัวอักษรทั่วไปบนพื้นหลัง'],
  ['--text', '--card', 'ตัวอักษรในการ์ด'],
  ['--text', '--input', 'ช่องกรอก / ปุ่ม ghost'],
  ['--text-2', '--bg', 'คำอธิบายบนพื้นหลัง'],
  ['--text-2', '--card', 'คำอธิบายในการ์ด'],
  ['--primary', '--bg', 'ลิงก์ / ตัวเลขเน้น'],
  ['--primary', '--card', 'ตัวเลขในการ์ด'],
  ['--primary', '--input', 'ตัวเลขในป้าย .chip'],
  ['--secondary', '--bg', 'ข้อความรองที่ต้องสังเกต'],
  ['--success', '--card', 'ข้อความสำเร็จ'],
  ['--warning', '--card', 'ข้อความเตือน'],
  ['--error', '--card', 'ข้อความผิดพลาด'],
  ['--pink', '--bg', 'ตัวเลขคอมโบ'],
  ['--sky', '--bg', 'ป้ายกราฟ'],
  ['--on-bright', '--primary', 'ตัวอักษรบนปุ่มหลัก (ต้นไล่สี)'],
  ['--on-bright', '--secondary', 'ตัวอักษรบนปุ่มหลัก (ปลายไล่สี)'],
  ['--on-bright', '--success', 'ปุ่มสีเขียว'],
  ['--on-bright', '--error', 'ปุ่มอันตราย'],
];

// ขนาดตัวอักษร 7 ขั้น
const SIZES = ['--fs-xs', '--fs-sm', '--fs-md', '--fs-lg', '--fs-xl', '--fs-2xl', '--fs-3xl'];
const THAI_1 = 'กางนิ้วให้สุด แล้วค่อย ๆ กำมือช้า ๆ นับหนึ่งถึงห้า';
const THAI_2 = 'ตัวเลข 0123456789 · ทำได้ดีมาก วันนี้ฝึกครบ 12 ครั้งแล้ว';

const $ = (s) => document.querySelector(s);
const overrides = new Set(); // สีที่ผู้ใช้แก้เองด้วยตัวเลือกสี

// ป้ายผลคอนทราสต์ (ต่ำกว่า 4.5 = แดง)
function badge(ratio) {
  const ok = ratio >= MIN_TEXT_CONTRAST;
  return `<span class="ratio ${ok ? 'pass' : 'fail'}">${ok ? '✔' : '✖'} ${ratio.toFixed(2)}:1</span>`;
}

function renderColours() {
  const bg = cssVar('--bg'), text = cssVar('--text');
  $('#colours').innerHTML = COLOURS.map((c) => {
    const val = cssVar(c.v), hex = toHex(val) || val;
    let ratio, note;
    if (c.kind === 'surface') { ratio = contrastRatio(text, val); note = 'ตัวอักษรหลักบนสีนี้'; }
    else { ratio = contrastRatio(val, bg); note = 'เทียบกับพื้นหลัง --bg'; }
    const decor = c.kind === 'decor' ? '<div class="note">ใช้เป็นเส้นบาง ๆ เท่านั้น ไม่นับเป็นคู่ตัวอักษร</div>' : '';
    return `<article class="card-neon colour-card" tabindex="0">
      <div class="swatch" style="background:var(${c.v})"></div>
      <div class="card-head"><h3 class="card-title">${esc(c.th)}</h3>${c.extra ? '<span class="chip">เสริม</span>' : ''}</div>
      <code>${c.v}</code> · <code class="num">${hex}</code>
      <div class="muted small">${note}</div>${badge(ratio)}${decor}
      <label class="picker">แก้สี <input type="color" data-var="${c.v}" value="${hex}" aria-label="เลือกสี ${esc(c.th)}"></label>
    </article>`;
  }).join('');
}

function renderPairs() {
  let fail = 0;
  const rows = PAIRS.map(([fg, bgv, where]) => {
    const r = contrastRatio(cssVar(fg), cssVar(bgv));
    if (r < MIN_TEXT_CONTRAST) fail++;
    return `<tr><td><span class="pair-demo" style="color:var(${fg});background:var(${bgv})">ตัวอย่าง Aa ๑๒๓</span></td>
      <td><code>${fg}</code> บน <code>${bgv}</code></td><td>${where}</td><td>${badge(r)}</td></tr>`;
  });
  $('#pairs').innerHTML = '<tr><th>ตัวอย่าง</th><th>คู่สี</th><th>ใช้ที่</th><th>คอนทราสต์</th></tr>' + rows.join('');
  const s = $('#summary');
  s.className = 'alert ' + (fail ? '' : 'ok');
  s.textContent = fail
    ? `✖ มี ${fail} คู่สีจาก ${PAIRS.length} คู่ ที่คอนทราสต์ต่ำกว่า ${MIN_TEXT_CONTRAST} — ต้องแก้ก่อนล็อกธีม`
    : `✔ คู่สีที่ใช้จริงผ่านเกณฑ์ครบ ${PAIRS.length}/${PAIRS.length} คู่ (ทุกคู่ ≥ ${MIN_TEXT_CONTRAST}:1)`;
  return fail;
}

function renderTypes() {
  $('#types').innerHTML = SIZES.map((v) => `<div class="card-neon type-row">
      <div class="type-meta"><code>${v}</code> <span class="num px" data-px="${v}"></span></div>
      <p style="font-size:var(${v})">${THAI_1}</p>
      <p style="font-size:var(${v})" class="muted">${THAI_2}</p>
    </div>`).join('');
  // แสดงขนาดจริงเป็นพิกเซล (เปลี่ยนตามธีม / สไลเดอร์)
  document.querySelectorAll('[data-px]').forEach((el) => {
    el.textContent = getComputedStyle(el.parentElement.nextElementSibling).fontSize;
  });
}

function syncControls() {
  const p = loadPrefs();
  document.querySelectorAll('[data-theme]').forEach((b) => b.classList.toggle('ghost', b.dataset.theme !== p.theme));
  document.querySelectorAll('[data-theme]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.theme === p.theme));
  $('#themeSel').value = p.theme;
  $('#lightSw').checked = !!p.light;
  $('#modeBtn').innerHTML = p.light ? '<span class="ico">🌙</span> <span>เปลี่ยนเป็นโหมดมืด</span>' : '<span class="ico">☀️</span> <span>เปลี่ยนเป็นโหมดสว่าง</span>';
  const fs = parseFloat(cssVar('--fs-base'));
  $('#fsSlider').value = fs; $('#fsVal').textContent = fs + 'px';
  $('#overrideChip b').textContent = overrides.size;
}

function renderAll() { syncControls(); renderColours(); renderPairs(); renderTypes(); }

// ---------- ตัวควบคุม ----------
function setTheme(theme) {
  document.body.style.removeProperty('--fs-base'); // ให้ขนาดกลับไปตามธีม
  savePrefs({ theme });
  renderAll();
}
document.querySelectorAll('[data-theme]').forEach((b) => b.addEventListener('click', () => setTheme(b.dataset.theme)));
$('#themeSel').addEventListener('change', (e) => setTheme(e.target.value));
$('#lightSw').addEventListener('change', (e) => { savePrefs({ light: e.target.checked }); renderAll(); });
$('#modeBtn').addEventListener('click', () => { savePrefs({ light: !loadPrefs().light }); renderAll(); });
$('#fsSlider').addEventListener('input', (e) => {
  document.body.style.setProperty('--fs-base', e.target.value + 'px'); // ทุกขนาดคูณจากค่านี้ จึงเปลี่ยนตามทันที
  renderAll();
});

// ตัวเลือกสี: แก้ตัวแปรที่ <body> สด ๆ แล้วคำนวณคอนทราสต์ใหม่
$('#colours').addEventListener('input', (e) => {
  const v = e.target.dataset?.var;
  if (!v) return;
  document.body.style.setProperty(v, e.target.value);
  overrides.add(v);
  syncControls(); renderPairs();
  // อัปเดตป้ายเฉพาะการ์ดนั้น ไม่วาดใหม่ทั้งหมด (ไม่งั้นตัวเลือกสีจะปิดตัวเองระหว่างลาก)
  clearTimeout(renderColours.t);
  renderColours.t = setTimeout(() => { renderColours(); renderTypes(); }, 400);
});
$('#resetBtn').addEventListener('click', () => {
  overrides.forEach((v) => document.body.style.removeProperty(v));
  overrides.clear();
  document.body.style.removeProperty('--fs-base');
  renderAll();
  toast('คืนค่าสีตาม tokens.css แล้ว', 'success');
});

// ตัวแก้ธีมเล็ก ๆ: ดาวน์โหลดค่าสีปัจจุบันไปวางทับใน tokens.css
$('#exportBtn').addEventListener('click', () => {
  const lines = COLOURS.map((c) => `  ${c.v}: ${toHex(cssVar(c.v))};`).join('\n');
  const css = `/* สีชุดที่ทีมเลือกจากหน้า style.html (${new Date().toLocaleString('th-TH')}) — คัดลอกไปแทนใน css/tokens.css */\n:root {\n${lines}\n  --fs-base: ${cssVar('--fs-base')};\n}\n`;
  downloadText('tokens-custom.css', css, 'text/css');
});

$('#testBtn').addEventListener('click', () => {
  const res = runTests();
  const bad = res.filter((r) => !r.ok).length;
  $('#testOut').innerHTML = res.map((r) => `<li class="${r.ok ? 'pass' : 'fail'}">${r.ok ? '✔' : '✖'} ${esc(r.name)}${r.error ? ' — ' + esc(r.error) : ''}</li>`).join('')
    + `<li><b>รวม ${res.length} ข้อ ผ่าน ${res.length - bad} ข้อ</b></li>`;
  toast(bad ? `ไม่ผ่าน ${bad} ข้อ` : 'ผ่านการทดสอบทุกข้อ', bad ? 'error' : 'success');
});

// ---------- เริ่มต้น ----------
applyPrefs();
renderAll();
// ฟอนต์จาก Google โหลดเสร็จทีหลัง → วัดขนาดใหม่
document.fonts?.ready.then(renderTypes);
// ให้ทดสอบจากภายนอก (สคริปต์ทดสอบ) เรียกดูผลได้
window.__lab05 = { renderPairs, runTests, contrastRatio };
