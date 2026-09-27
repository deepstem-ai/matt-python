// ============================================================
// rep-counter.js — นับจำนวนครั้งแม่นยำด้วยหลัก "ประตูสองบาน" (Lab 21)
// ชื่อทางวิศวกรรม: hysteresis / Schmitt trigger
//   - คะแนนต้อง "ขึ้นเกิน enter" จึงนับว่าเริ่มทำท่า
//   - คะแนนต้อง "ลงต่ำกว่า exit" จึงนับว่าปล่อยท่า
//   - ช่วงระหว่าง exit..enter คือเขตกันสั่น ไม่มีอะไรเปลี่ยน
// กฎ: ห้ามอ่านนาฬิกาภายในคลาส เวลาต้องส่งเข้ามาทุกครั้ง (ทดสอบด้วยเวลาจำลองได้)
// ============================================================

export const REP_STATES = ['idle', 'engaging', 'held', 'releasing', 'cooldown'];

export class RepCounter {
  // enter: เกณฑ์เริ่ม, exit: เกณฑ์ปล่อย, minHoldMs: ต้องค้างอย่างน้อยกี่ ms, cooldownMs: เว้นหลังนับ
  constructor({ enter = 0.7, exit = 0.3, minHoldMs = 200, cooldownMs = 300, onRep = null } = {}) {
    if (exit >= enter) throw new Error('ค่า exit ต้องน้อยกว่า enter');
    Object.assign(this, { enter, exit, minHoldMs, cooldownMs, onRep });
    this.reset();
  }

  reset() {
    this.state = 'idle';
    this.count = 0;
    this.reps = [];          // บันทึกทุกครั้ง: { t, peak, holdMs, quality }
    this.peak = 0;
    this.startT = 0;          // เวลาที่เริ่มเกิน enter
    this.cooldownUntil = 0;
  }

  setThresholds({ enter, exit, minHoldMs, cooldownMs } = {}) {
    if (enter !== undefined) this.enter = enter;
    if (exit !== undefined) this.exit = exit;
    if (minHoldMs !== undefined) this.minHoldMs = minHoldMs;
    if (cooldownMs !== undefined) this.cooldownMs = cooldownMs;
  }

  // ป้อนคะแนนหนึ่งค่า พร้อมเวลา (ms) คืน rep object ถ้านับได้ในเฟรมนี้ ไม่งั้นคืน null
  update(score, t) {
    let counted = null;
    switch (this.state) {
      case 'cooldown':
        // ช่วงพัก ห้ามนับซ้ำ พ้นเวลาแล้วกลับไปรอท่าใหม่
        if (t >= this.cooldownUntil) this.state = 'idle';
        break;
      case 'idle':
        if (score >= this.enter) { this.state = 'engaging'; this.startT = t; this.peak = score; }
        break;
      case 'engaging': // ผ่านประตูแรกแล้ว รอให้ค้างนานพอ
        this.peak = Math.max(this.peak, score);
        if (score < this.exit) this.state = 'idle';               // ปล่อยเร็วเกินไป ไม่นับ
        else if (t - this.startT >= this.minHoldMs) this.state = 'held';
        break;
      case 'held': // ค้างท่านานพอแล้ว รอผ่านประตูที่สอง
        this.peak = Math.max(this.peak, score);
        if (score < this.exit) this.state = 'releasing';
        break;
      default:
        break;
    }
    if (this.state === 'releasing') {
      // ครบวงจร → นับหนึ่งครั้ง
      const holdMs = t - this.startT;
      const quality = Math.round(100 * Math.min(1, this.peak) * Math.min(1, holdMs / (this.minHoldMs * 2)));
      counted = { n: this.count + 1, t, peak: +this.peak.toFixed(3), holdMs: Math.round(holdMs), quality };
      this.count++;
      this.reps.push(counted);
      this.onRep?.(counted);
      this.state = 'cooldown';
      this.cooldownUntil = t + this.cooldownMs;
      this.peak = 0;
    }
    return counted;
  }
}
