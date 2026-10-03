// ============================================================
// fps-target.js — เกณฑ์ประสิทธิภาพ FPS ≥ 25 (บทความหัวข้อ 6.2) ฟังก์ชันบริสุทธิ์ (Lab 33)
// ============================================================
// เกณฑ์ประสิทธิภาพของบทความ (หัวข้อ 6.2): FPS เฉลี่ย ≥ 25 บนทุกแพลตฟอร์ม
export const FPS_TARGET = 25;
export const fpsPass = (fps) => Number.isFinite(+fps) && +fps >= FPS_TARGET;
// สรุปทั้งเครื่อง: ผ่านเมื่อทุกสถานการณ์ที่ทดสอบได้ (ไม่นับที่ข้าม) มี FPS เฉลี่ย ≥ 25
export function fpsVerdict(results = {}) {
  const tested = Object.entries(results).filter(([, r]) => r && !r.skipped && Number.isFinite(+r.avgFps));
  const failed = tested.filter(([, r]) => !fpsPass(r.avgFps)).map(([k]) => k);
  return { target: FPS_TARGET, tested: tested.length, passed: tested.length - failed.length, failed, pass: tested.length > 0 && failed.length === 0 };
}
