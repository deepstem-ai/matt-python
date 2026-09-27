// ============================================================
// ui.js — เครื่องมือหน้าจอเล็ก ๆ ที่ทุกหน้าใช้ร่วมกัน
// ห้ามแตะ: กล้อง, โมเดล AI, ฐานข้อมูล
// ============================================================

// ---------- การตั้งค่าหน้าจอ (ธีม ขนาด โหมดสงบ) เก็บใน localStorage ----------
const PREF_KEY = 'hr-prefs';
export const DEFAULT_PREFS = { theme: 'neon', profile: 'standard', calm: false, light: false, lang: 'th', handStyle: 'neon' };

// อ่านค่าที่บันทึกไว้ ถ้าไม่มีหรือเสียก็คืนค่าเริ่มต้น
export function loadPrefs() {
  try { return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(PREF_KEY) || '{}') }; }
  catch { return { ...DEFAULT_PREFS }; }
}

// บันทึกค่าแล้วนำไปใช้ทันที ไม่ต้องรีสตาร์ต
export function savePrefs(patch) {
  const p = { ...loadPrefs(), ...patch };
  try { localStorage.setItem(PREF_KEY, JSON.stringify(p)); } catch { /* เก็บไม่ได้ก็ใช้ต่อได้ */ }
  applyPrefs(p);
  return p;
}

// ใส่ class ลงบน <body> ให้ CSS สลับตัวแปรทั้งหมดเอง
export function applyPrefs(p = loadPrefs()) {
  const b = document.body;
  b.className = b.className.replace(/\b(theme|profile)-\S+/g, '').replace(/\b(calm|light)\b/g, '').trim();
  b.classList.add('theme-' + p.theme, 'profile-' + p.profile);
  if (p.calm) b.classList.add('calm');
  if (p.light) b.classList.add('light');
  document.documentElement.lang = p.lang || 'th';
}

// โหมดสงบเปิดอยู่ไหม (ใช้ตัดสินใจปิดอนุภาคและเสียง)
export function isCalm() {
  return document.body.classList.contains('calm') || document.body.classList.contains('theme-calm');
}

// อ่านค่าสีจาก CSS variable เพื่อนำไปวาดบน canvas (canvas อ่าน var() เองไม่ได้)
export function cssVar(name) {
  return getComputedStyle(document.body).getPropertyValue(name).trim() || '#ffffff';
}

// ---------- toast แจ้งเตือนลอยที่หายไปเอง ----------
export function toast(message, type = 'success', seconds = 3) {
  let host = document.querySelector('.toast-host');
  if (!host) { host = document.createElement('div'); host.className = 'toast-host'; host.setAttribute('role', 'status'); document.body.appendChild(host); }
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.textContent = message;
  host.appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 320); }, seconds * 1000);
  return el;
}

// ---------- วงแหวนความคืบหน้า ----------
// สร้าง HTML ของวงแหวนใส่ลงใน element ที่มี class="ring"
export function makeRing(el, value = 0) {
  el.innerHTML = `<svg viewBox="0 0 120 120"><circle class="ring-bg" cx="60" cy="60" r="50"/>
    <circle class="ring-fg" cx="60" cy="60" r="50"/></svg><div class="ring-label">0%</div>`;
  setRing(el, value);
}
// ตั้งค่า 0-100 วงแหวนจะค่อย ๆ เลื่อนไปเอง (CSS transition)
export function setRing(el, value) {
  const v = Math.max(0, Math.min(100, value));
  const c = 2 * Math.PI * 50; // เส้นรอบวง
  const fg = el.querySelector('.ring-fg');
  fg.style.strokeDasharray = c;
  fg.style.strokeDashoffset = c * (1 - v / 100);
  el.querySelector('.ring-label').textContent = Math.round(v) + '%';
}

// ---------- modal แบบง่าย คืนค่า Promise ของปุ่มที่กด ----------
export function modal(html, buttons = [{ label: 'ตกลง', value: true, cls: '' }]) {
  return new Promise((resolve) => {
    const back = document.createElement('div');
    back.className = 'modal-back';
    back.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}<div class="row" style="margin-top:16px;justify-content:flex-end"></div></div>`;
    const row = back.querySelector('.row');
    buttons.forEach((b) => {
      const btn = document.createElement('button');
      btn.className = 'btn-glow ' + (b.cls || '');
      btn.textContent = b.label;
      btn.onclick = () => { back.remove(); resolve(b.value); };
      row.appendChild(btn);
    });
    document.body.appendChild(back);
    row.querySelector('button')?.focus();
  });
}

// ---------- ดาวน์โหลดไฟล์ ----------
export function downloadText(filename, text, mime = 'text/plain') {
  const blob = new Blob([text], { type: mime + ';charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

// แปลงแถวข้อมูลเป็น CSV ใส่ BOM นำหน้าเพื่อให้ Excel เปิดภาษาไทยไม่เพี้ยน
export function toCSV(rows, columns) {
  const cols = columns || Object.keys(rows[0] || {});
  const esc = (v) => {
    if (v === null || v === undefined) return '';
    const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  return '﻿' + [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\r\n');
}
export function downloadCSV(filename, rows, columns) {
  downloadText(filename, toCSV(rows, columns), 'text/csv');
}

// บันทึก canvas เป็นรูป PNG สำหรับใส่รายงาน
export function saveCanvasPNG(canvas, filename = 'chart.png') {
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = filename;
  a.click();
}

// ---------- ตัววัด FPS ----------
// เรียก tick() ทุกเฟรม แล้วอ่านค่า fps ได้ (อัปเดตทุก 1 วินาที)
export class FpsMeter {
  constructor() { this.frames = 0; this.last = performance.now(); this.fps = 0; }
  tick(now = performance.now()) {
    this.frames++;
    if (now - this.last >= 1000) {
      this.fps = Math.round((this.frames * 1000) / (now - this.last));
      this.frames = 0;
      this.last = now;
    }
    return this.fps;
  }
}

// ป้องกันข้อความจากผู้ใช้ไปเป็น HTML (กันโค้ดแปลกปลอม)
export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
