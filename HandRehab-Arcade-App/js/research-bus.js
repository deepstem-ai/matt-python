// ============================================================
// research-bus.js — ท่อส่งค่าสดจากสมการไปยังหน้าจอโหมดวิจัย
//
// ทำไมต้องมี
//   สมการอยู่ในฟังก์ชันบริสุทธิ์ซึ่งไม่ควรรู้จักหน้าจอ ถ้าให้มันเรียก UI ตรง ๆ
//   จะทดสอบไม่ได้และผูกกันแน่นเกินไป จึงใช้ท่อกลางนี้แทน
//   ฝั่งสมการแค่ประกาศค่าออกมา ใครจะฟังหรือไม่ฟังก็ได้
//
// ค่าใช้จ่ายเมื่อปิดโหมดวิจัย  เกือบศูนย์  เพราะถ้าไม่มีคนฟังจะคืนค่าทันที
// ============================================================

let on = false;
const subs = new Set();

// เปิด/ปิดการส่งค่า  ปิดอยู่ = ฟังก์ชัน publish แทบไม่ทำงานเลย
export function setActive(v) { on = !!v; }
export function isActive() { return on; }

export function subscribe(fn) {
  subs.add(fn);
  return () => subs.delete(fn);
}

// stage: ชื่อขั้นในท่อ เช่น 'measure' 'score' 'rep'
export function publish(stage, data) {
  if (!on || !subs.size) return;
  for (const fn of subs) {
    try { fn(stage, data); } catch (e) { /* หน้าจอพังห้ามทำให้เกมพัง */ }
  }
}
