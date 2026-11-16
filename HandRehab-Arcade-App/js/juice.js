// ============================================================
// juice.js — "ความสนุก" ที่ใส่ให้ทั้ง 3 เกม (Lab 26)
//   1) คอมโบ: ถูกติดกัน 3 ครั้ง ×2 · 6 ครั้ง ×3 · 10 ครั้ง ×5 · พลาด = กลับเป็น ×1
//      ขึ้นขั้นใหม่ → ตัวเลขใหญ่เด้งกลางจอ + อนุภาค + เสียง Sound.combo (Web Audio ไม่มีไฟล์เสียง)
//   2) ตัวเลขคะแนนค่อย ๆ ไต่ขึ้นไปหาค่าจริง (ไม่กระโดด)
//   3) ป้ายความสำเร็จเด้งขึ้นมุมจอ (รายการอยู่ใน achievements.js) · 4) streak อยู่ใน streak.js
// กฎเหล็ก: โหมดสงบ (calm / theme-calm) = ปิดทุกเอฟเฟกต์ · FPS ตก = ลดเอฟเฟกต์เอง
// ============================================================
import { isCalm, cssVar, esc } from './ui.js';
export { ACHIEVEMENTS, AchievementBook } from './achievements.js';
export { computeStreak, minutesByDay, MIN_MINUTES } from './streak.js';

// ตารางตัวคูณ: ถูกติดกันอย่างน้อย min ครั้ง → คูณ mult
export const COMBO_TIERS = [{ min: 0, mult: 1 }, { min: 3, mult: 2 }, { min: 6, mult: 3 }, { min: 10, mult: 5 }];
export function multiplierFor(count) {
  let m = 1;
  for (const t of COMBO_TIERS) if (count >= t.min) m = t.mult;
  return m;
}

// ---------- คอมโบ (ตรรกะล้วน ทดสอบด้วย node ได้) ----------
export class Combo {
  constructor() { this.reset(); }
  reset() { this.count = 0; this.best = 0; this.mult = 1; }
  // ทำถูก 1 ครั้ง → คืน { count, mult, tierUp } (tierUp = เพิ่งขึ้นขั้นใหม่)
  hit() {
    this.count++; this.best = Math.max(this.best, this.count);
    const m = multiplierFor(this.count), tierUp = m > this.mult;
    this.mult = m;
    return { count: this.count, mult: m, tierUp };
  }
  // พลาด → คอมโบกลับเป็น 0 ตัวคูณ ×1 คืนจำนวนที่เสียไป
  miss() { const lost = this.count; this.count = 0; this.mult = 1; return lost; }
}

// ---------- ตัวเลขคะแนนที่ค่อย ๆ ไต่ขึ้น ----------
export class ScoreTween {
  constructor(el) { this.el = el; this.shown = 0; this.target = 0; }
  set(v) { if (v > this.target && this.el && !isCalm()) this.el.classList.add('bump'); this.target = v; }
  reset(v = 0) { this.shown = this.target = v; this.paint(); }
  tick(dt) {
    const diff = this.target - this.shown;
    if (isCalm() || Math.abs(diff) < 0.5) this.shown = this.target;   // โหมดสงบ: แสดงค่าจริงทันที ไม่มีแอนิเมชัน
    else this.shown += Math.sign(diff) * Math.max(1, Math.abs(diff) * Math.min(1, dt * 6));
    if (this.shown === this.target) this.el?.classList.remove('bump');
    this.paint();
  }
  paint() { if (this.el) this.el.textContent = Math.round(this.shown); }
}

// ---------- ตัวจัดการเอฟเฟกต์ของหนึ่งเกม ----------
// opts: { engine, host (กล่องสนามเกม), scoreEl, comboEl, multEl, onHit(count), onMiss() }
export class Juice {
  constructor(opts) {
    Object.assign(this, { onHit: () => {}, onMiss: () => {} }, opts);
    this.combo = new Combo();
    this.score = new ScoreTween(opts.scoreEl);
    this.low = false; this._lowFor = 0; this._okFor = 0;
    this.layer = document.createElement('div'); this.layer.className = 'juice-layer';
    this.layer.innerHTML = '<div class="combo-pop hidden" aria-live="polite"><b></b><small></small></div>';
    this.host.appendChild(this.layer);
    this.pop = this.layer.querySelector('.combo-pop');
    this.achHost = document.createElement('div'); this.achHost.className = 'ach-host'; document.body.appendChild(this.achHost);
    this._queue = []; this._showing = false;
    let last = performance.now();
    const loop = (now) => { const dt = Math.min(0.1, (now - last) / 1000); last = now; this.update(dt); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }

  // ระดับเอฟเฟกต์ตอนนี้: off (โหมดสงบ) · low (เครื่องช้า) · full
  get quality() { return isCalm() ? 'off' : this.low ? 'low' : 'full'; }

  // ดู FPS ของเอนจิน: ต่ำกว่า 30 นาน 3 วินาที → low · กลับมาเกิน 45 นาน 5 วินาที → full
  update(dt) {
    this.score.tick(dt);
    const fps = this.engine?.fps || 60, running = this.engine?.running && !this.engine?.paused;
    if (!running) return;
    if (fps < 30) { this._lowFor += dt; this._okFor = 0; } else if (fps > 45) { this._okFor += dt; this._lowFor = 0; }
    if (!this.low && this._lowFor > 3) { this.low = true; console.info('[juice] FPS ต่ำ → ลดเอฟเฟกต์'); }
    if (this.low && this._okFor > 5) { this.low = false; console.info('[juice] FPS กลับมาปกติ → เอฟเฟกต์เต็ม'); }
  }

  // ทำถูก ที่ตำแหน่ง (x,y) บน canvas ได้คะแนนฐาน base → คืนคะแนนจริงหลังคูณ
  hit(x, y, base = 1) {
    const r = this.combo.hit();
    if (this.comboEl) this.comboEl.textContent = r.count;
    if (this.multEl) this.multEl.textContent = '×' + r.mult;
    if (r.tierUp) this.tierUp(r, x, y);
    this.onHit(r.count, r);
    return base * r.mult;
  }
  miss() {
    const lost = this.combo.miss();
    if (this.comboEl) this.comboEl.textContent = 0;
    if (this.multEl) this.multEl.textContent = '×1';
    this.onMiss(lost);
  }
  reset() { this.combo.reset(); this.score.reset(0); if (this.comboEl) this.comboEl.textContent = 0; if (this.multEl) this.multEl.textContent = '×1'; }

  // ขึ้นขั้นคอมโบใหม่: ตัวเลขใหญ่เด้งกลางจอ + อนุภาค + เสียง
  tierUp(r, x, y) {
    const q = this.quality;
    if (q === 'off') return;                                       // โหมดสงบ: ไม่มีอะไรเด้งเลย
    this.engine?.sound.combo();
    const cv = this.engine?.canvas;
    const n = q === 'full' ? 90 : 20;                              // เครื่องช้า: อนุภาคน้อยลง
    const colors = [cssVar('--pink'), cssVar('--warning'), cssVar('--primary'), cssVar('--success')];
    if (cv) this.engine.particles.burst(cv.width / 2, cv.height / 2, n, colors, q === 'full' ? 420 : 240, 160, 1.2);
    if (cv && Number.isFinite(x)) this.engine.particles.burst(x, y, Math.round(n / 3), colors, 260, 100, 0.8);
    this.pop.querySelector('b').textContent = '×' + r.mult;
    this.pop.querySelector('small').textContent = `คอมโบ ${r.count}!`;
    this.pop.classList.remove('hidden', 'go', 'still');
    void this.pop.offsetWidth;                                     // รีสตาร์ตแอนิเมชัน CSS
    this.pop.classList.add(q === 'full' ? 'go' : 'still');         // เครื่องช้า: แสดงนิ่ง ๆ ไม่เด้ง
    clearTimeout(this._popT);
    this._popT = setTimeout(() => this.pop.classList.add('hidden'), 1300);
  }

  // ป้ายความสำเร็จ (ต่อคิว แสดงทีละอัน 4 วินาที กดปิดได้)
  announce(def) { this._queue.push(def); if (!this._showing) this._next(); }
  _next() {
    const def = this._queue.shift();
    if (!def) { this._showing = false; return; }
    this._showing = true;
    const calm = this.quality === 'off';
    const el = document.createElement('div');
    el.className = 'ach-pop' + (calm ? ' calm' : '');
    el.setAttribute('role', 'status');
    el.innerHTML = `<span class="ach-icon">${def.icon}</span><div><small>ได้รับความสำเร็จใหม่!</small><b>${esc(def.th)}</b><span class="muted">${esc(def.how)}</span></div><button class="btn-glow ghost small" aria-label="ปิด">✕</button>`;
    this.achHost.appendChild(el);
    if (!calm) { this.engine?.sound.levelUp(); }
    const close = () => { el.remove(); clearTimeout(t); this._next(); };
    const t = setTimeout(close, 4000);
    el.querySelector('button').onclick = close;
  }
}
