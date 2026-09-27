// ============================================================
// style-adapt.js — ปรับสไตล์การวาดมืออัตโนมัติตามความแรงของเครื่อง (Lab 17)
// ฟังก์ชันบริสุทธิ์: ไม่อ่านนาฬิกาเอง เวลาต้องส่งเข้ามา (ทดสอบด้วยเวลาจำลองได้)
//   FPS < low  ติดต่อกัน lowSec วินาที  → 'down' (ลดลงหนึ่งระดับ)
//   FPS > high ติดต่อกัน highSec วินาที → 'up'   (ถามผู้ใช้ก่อนว่าจะเพิ่มกลับไหม)
// ============================================================
export const STYLES = ['simple', 'neon', 'trail']; // เรียงจากเบาที่สุด → หนักที่สุด
export const STYLE_TH = { simple: 'เรียบง่าย', neon: 'นีออน', trail: 'หางแสง' };

export class StyleAdapter {
  constructor({ low = 24, lowSec = 3, high = 45, highSec = 10, graceMs = 2000 } = {}) {
    Object.assign(this, { low, lowSec, high, highSec, graceMs });
    this.lowSince = null; this.highSince = null; this.graceUntil = 0;
  }

  // เรียกเมื่อสไตล์เปลี่ยน (โดยผู้ใช้หรือโดยระบบ) → รอให้ FPS นิ่งก่อนค่อยตัดสินใหม่
  notifyChange(t) { this.lowSince = null; this.highSince = null; this.graceUntil = t + this.graceMs; }

  // fps = ค่าล่าสุด, t = เวลา ms, current/wanted = ดัชนีใน STYLES (wanted = ที่ผู้ใช้เลือกเอง)
  update(fps, t, current, wanted) {
    if (t < this.graceUntil || !fps) return null;
    // ช้าเกินไป
    if (fps < this.low) {
      this.highSince = null;
      if (this.lowSince === null) this.lowSince = t;
      if (t - this.lowSince >= this.lowSec * 1000 && current > 0) { this.notifyChange(t); return 'down'; }
      return null;
    }
    this.lowSince = null;
    // เร็วพอ และเคยถูกลดระดับไว้
    if (fps > this.high && current < wanted) {
      if (this.highSince === null) this.highSince = t;
      if (t - this.highSince >= this.highSec * 1000) { this.notifyChange(t); return 'up'; }
    } else this.highSince = null;
    return null;
  }
}
