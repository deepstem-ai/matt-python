// ============================================================
// pin.js — รหัส PIN 6 หลักสำรอง (Lab 15)
// เก็บเป็น "แฮชทางเดียว" SHA-256 เท่านั้น ห้ามเก็บตัวเลขจริงเด็ดขาด
// แฮช = ลายนิ้วมือของข้อความ: ใส่ PIN เดิมได้แฮชเดิมเสมอ แต่ย้อนจากแฮชกลับเป็น PIN ไม่ได้
// เติม "เกลือ" (salt) ด้วยรหัสผู้ใช้ → PIN เดียวกันของสองคนได้แฮชไม่เหมือนกัน
// ============================================================

const APP_SALT = 'handrehab-arcade';

// แปลง PIN เป็นแฮช SHA-256 (ตัวอักษรฐาน 16 ยาว 64 ตัว) ใช้ crypto.subtle ของเบราว์เซอร์
export async function hashPin(pin, userId) {
  const data = new TextEncoder().encode(`${APP_SALT}:${userId}:${pin}`);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ตรวจ PIN: แฮช PIN ที่พิมพ์ แล้วเทียบกับแฮชที่เก็บไว้
export async function verifyPin(pin, user) {
  if (!user?.pinHash) return false;
  return (await hashPin(pin, user.id)) === user.pinHash;
}

// กฎ PIN: ตัวเลข 6 หลัก ห้ามเลขเดียวกันทั้งหมด ห้ามเรียงง่าย ๆ
export function pinProblem(pin) {
  if (!/^\d{6}$/.test(pin)) return 'ต้องเป็นตัวเลข 6 หลัก';
  if (/^(\d)\1{5}$/.test(pin)) return 'ห้ามใช้เลขเดียวกันทั้ง 6 หลัก';
  if ('0123456789'.includes(pin) || '9876543210'.includes(pin)) return 'ห้ามใช้เลขเรียงกัน เช่น 123456';
  return null;
}
export const isValidPin = (pin) => pinProblem(pin) === null;

// ---------- แป้นตัวเลขขนาดใหญ่ ----------
// new PinPad(element, { onComplete(pin) }) — กดครบ 6 หลักแล้วเรียก onComplete
// รองรับคีย์บอร์ด (ตัวเลข, Backspace) ด้วย
export class PinPad {
  constructor(el, { length = 6, onComplete } = {}) {
    this.el = el; this.length = length; this.onComplete = onComplete; this.value = '';
    el.classList.add('pinpad');
    el.innerHTML = `<div class="pin-dots" aria-live="polite"></div><div class="pin-keys"></div>`;
    const keys = el.querySelector('.pin-keys');
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'back'].forEach((k) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'pin-key' + (k.length > 1 ? ' fn' : '');
      b.textContent = k === 'clear' ? 'ล้าง' : k === 'back' ? '⌫' : k;
      b.setAttribute('aria-label', k === 'clear' ? 'ล้างทั้งหมด' : k === 'back' ? 'ลบหนึ่งตัว' : 'เลข ' + k);
      b.onclick = () => this.press(k);
      keys.appendChild(b);
    });
    this.onKey = (e) => {
      if (!document.body.contains(el) || el.closest('.hidden')) return;
      if (/^\d$/.test(e.key)) this.press(e.key);
      else if (e.key === 'Backspace') this.press('back');
    };
    document.addEventListener('keydown', this.onKey);
    this.render();
  }
  press(k) {
    if (k === 'clear') this.value = '';
    else if (k === 'back') this.value = this.value.slice(0, -1);
    else if (this.value.length < this.length) this.value += k;
    this.render();
    if (this.value.length === this.length) { const v = this.value; setTimeout(() => this.onComplete?.(v), 120); }
  }
  render() {
    this.el.querySelector('.pin-dots').innerHTML = Array.from({ length: this.length }, (_, i) => `<i class="${i < this.value.length ? 'on' : ''}"></i>`).join('');
  }
  reset() { this.value = ''; this.render(); }
  shake() { this.el.classList.remove('shake'); void this.el.offsetWidth; this.el.classList.add('shake'); this.reset(); }
  destroy() { document.removeEventListener('keydown', this.onKey); }
}

// ---------- กันเดา PIN: ผิด 5 ครั้ง ล็อก 30 วินาที ----------
const LOCK_KEY = 'hr-pin-lock';
export function pinLockLeft() {
  try { const s = JSON.parse(sessionStorage.getItem(LOCK_KEY) || '{}'); return Math.max(0, (s.until || 0) - Date.now()); } catch { return 0; }
}
export function pinFailed() {
  let s = {};
  try { s = JSON.parse(sessionStorage.getItem(LOCK_KEY) || '{}'); } catch { /* ใช้ค่าว่าง */ }
  s.fails = (s.fails || 0) + 1;
  if (s.fails >= 5) { s.until = Date.now() + 30000; s.fails = 0; }
  try { sessionStorage.setItem(LOCK_KEY, JSON.stringify(s)); } catch { /* ไม่เป็นไร */ }
  return s;
}
export function pinOk() { try { sessionStorage.removeItem(LOCK_KEY); } catch { /* ไม่เป็นไร */ } }
