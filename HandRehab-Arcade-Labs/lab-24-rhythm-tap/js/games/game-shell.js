// ============================================================
// game-shell.js — ส่วนที่ทั้ง 3 เกมใช้ร่วมกัน (Lab 23-25)
//  - HandInput: เปิดกล้อง + โมเดลมือ แล้วอ่านจุดมือทีละเฟรม
//  - แผงลอยกลางจอ (ไม่ปล่อยจอว่าง), ปุ่มหยุดพัก, เตือนให้พักมือ
//  - ตัวเลขคะแนนที่ค่อย ๆ ไต่ขึ้น, เปรียบเทียบกับครั้งก่อน
// ============================================================
import { startCamera, stopCamera, cameraErrorMessage } from '../camera.js';
import { initHand, detectHand, drawHand, fitCanvas, handInfo } from '../hand.js';
import { getCurrentUserId, listSessionsByUser } from '../db.js';
import { modal, esc, isCalm, loadPrefs, savePrefs, toast } from '../ui.js';

// ผู้ใช้ที่ล็อกอินอยู่ ถ้าไม่มีใช้ 'guest'
export const userId = () => getCurrentUserId() || 'guest';

// ค่าจาก URL เช่น ?rest=0.2 (ใช้ทดสอบการเตือนพักให้เร็วขึ้น)
export function urlNumber(name, fallback) {
  const v = parseFloat(new URLSearchParams(location.search).get(name));
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

// ---------------- กล้อง + มือ ----------------
export class HandInput {
  constructor(video, preview) {
    this.video = video; this.preview = preview;
    this.ready = false; this.points = null; this._vt = -1;
  }
  // เปิดกล้องและโหลดโมเดล ถ้าพลาดจะโยน Error ที่มีข้อความภาษาไทย (title, detail)
  async start(onProgress) {
    try { await startCamera(this.video); }
    catch (err) { const m = cameraErrorMessage(err); const e = new Error(m.title); e.detail = m.detail; throw e; }
    try { await initHand({ onProgress }); }
    catch (err) { stopCamera(); const e = new Error('โหลดโมเดลมือไม่สำเร็จ'); e.detail = err.message + ' — ตรวจอินเทอร์เน็ตแล้วลองใหม่'; throw e; }
    this.ready = true;
    return handInfo();
  }
  // อ่านจุดมือของเฟรมล่าสุด (ถ้าภาพกล้องยังไม่เปลี่ยนก็ใช้ผลเดิม ประหยัดเครื่อง)
  read() {
    if (!this.ready) return null;
    if (this.video.currentTime !== this._vt) {
      this._vt = this.video.currentTime;
      fitCanvas(this.preview, this.video);
      const h = detectHand(this.video, performance.now());
      drawHand(this.preview, h, { style: 'simple' });
      this.points = h?.points || null;
    }
    return this.points;
  }
  stop() { stopCamera(); this.ready = false; this.points = null; }
}

// ปิดกล้องเมื่อออกจากหน้า (กฎ: ห้ามค้างกล้องไว้)
export function releaseOnLeave(input) {
  window.addEventListener('pagehide', () => input.stop());
}

// ---------------- แผงลอยกลางจอ ----------------
// buttons = [{ label, cls, onClick }]  คืน element ของแผง
export function showOverlay(host, html, buttons = []) {
  host.innerHTML = `<div class="card-neon">${html}<div class="row" style="margin-top:16px"></div></div>`;
  const row = host.querySelector('.row');
  buttons.forEach((b) => {
    const btn = document.createElement('button');
    btn.className = 'btn-glow ' + (b.cls || '');
    btn.textContent = b.label;
    btn.onclick = b.onClick;
    row.appendChild(btn);
  });
  host.classList.remove('hidden');
  row.querySelector('button')?.focus();
  return host;
}
export function hideOverlay(host) { host.classList.add('hidden'); host.innerHTML = ''; }

// ---------------- หยุดพัก ----------------
let pausing = false;
// หยุดเกมแล้วแสดงหน้าต่าง กดเล่นต่อแล้วเกมเดินต่อ (กันเปิดซ้อนสองหน้าต่าง)
export async function pauseWithModal(engine, html = '<h2>⏸ หยุดพัก</h2><p>พักมือได้ตามสบาย กดปุ่มเมื่อพร้อมเล่นต่อ</p>') {
  if (pausing || !engine.running) return;
  pausing = true;
  engine.pause();
  await modal(html, [{ label: '▶ เล่นต่อ', value: true, cls: 'success' }]);
  engine.resume();
  pausing = false;
}
export const isPausing = () => pausing;

// เตือนให้พักทุก ๆ N นาทีของเวลาเล่นจริง (ผู้สูงอายุมักฝืนจนเจ็บ)
export class RestReminder {
  constructor(minutes, onRemind) { this.every = minutes * 60; this.played = 0; this.next = this.every; this.onRemind = onRemind; }
  update(dt) {
    this.played += dt;
    if (this.played >= this.next) { this.next += this.every; this.onRemind(); }
  }
}
export function restModal(engine, minutes) {
  return pauseWithModal(engine, `<h2>🌿 ได้เวลาพักมือแล้ว</h2>
    <p>คุณเล่นมาครบ ${esc(+minutes.toFixed(2))} นาที วางมือบนโต๊ะ หายใจลึก ๆ แล้วกำ-แบมือเบา ๆ ช้า ๆ</p>
    <p class="muted">ถ้ารู้สึกปวดหรือชา ให้หยุดเล่นและบอกผู้ดูแล</p>`);
}

// ---------------- ตัวเลขที่ค่อย ๆ ไต่ขึ้น ----------------
export class CountUp {
  constructor(el, decimals = 0) { this.el = el; this.shown = 0; this.target = 0; this.dec = decimals; }
  set(v) { this.target = v; }
  reset(v = 0) { this.shown = this.target = v; this.el.textContent = v.toFixed(this.dec); }
  tick(dt) {
    const diff = this.target - this.shown;
    if (Math.abs(diff) < 0.5) this.shown = this.target;
    else this.shown += diff * Math.min(1, dt * 8); // ไล่ตามเป้าหมายแบบนุ่มนวล
    this.el.textContent = this.shown.toFixed(this.dec);
  }
}

// ---------------- โหมดสงบ ----------------
// ปุ่มสลับโหมดสงบ: ปิดอนุภาคและเสียงของเอนจินทันที
export function bindCalmButton(btn, engine) {
  const paint = () => { btn.textContent = isCalm() ? '🌙 สงบ: เปิด' : '🌙 สงบ: ปิด'; engine.setCalm(isCalm()); };
  btn.onclick = () => { savePrefs({ calm: !loadPrefs().calm }); paint(); };
  paint();
}

// ---------------- เปรียบเทียบกับครั้งก่อน ----------------
// คืนรายการเซสชันเก่าของเกมนี้ (ใหม่สุดก่อน) ถ้าฐานข้อมูลเสียคืน [] และแจ้งเตือน
export async function previousSessions(game) {
  try { return (await listSessionsByUser(userId())).filter((s) => s.game === game); }
  catch (e) { toast('อ่านประวัติจากฐานข้อมูลไม่ได้: ' + e.message, 'error', 5); return []; }
}
// สร้างข้อความเปรียบเทียบ เช่น "▲ 3 (ดีขึ้น)"  higherBetter = ค่ามากคือดี
export function compare(now, prev, higherBetter = true, unit = '', dec = 0) {
  if (prev === undefined || prev === null || !Number.isFinite(prev)) return '<span class="muted">— ครั้งแรก</span>';
  const d = now - prev;
  if (Math.abs(d) < Math.pow(10, -dec) / 2) return '<span class="muted">= เท่าเดิม</span>';
  const good = higherBetter ? d > 0 : d < 0;
  return `<span class="${good ? 'up' : 'down'}">${d > 0 ? '▲' : '▼'} ${Math.abs(d).toFixed(dec)}${unit} ${good ? '(ดีขึ้น)' : '(ลดลง)'}</span>`;
}

// ข้อมูลเครื่อง (เก็บไว้ในเซสชันเพื่อวิเคราะห์ภายหลัง)
export function machineInfo() {
  return { cores: navigator.hardwareConcurrency || 0, ua: navigator.userAgent.slice(0, 120) };
}

// เก็บค่า FPS ทุกวินาทีเพื่อหาค่าเฉลี่ยของรอบ
export class FpsLog {
  constructor() { this.samples = []; this.t = 0; }
  update(dt, fps) { this.t += dt; if (this.t >= 1) { this.t = 0; if (fps) this.samples.push(fps); } }
  get avg() { return this.samples.length ? Math.round(this.samples.reduce((a, b) => a + b, 0) / this.samples.length) : 0; }
}
