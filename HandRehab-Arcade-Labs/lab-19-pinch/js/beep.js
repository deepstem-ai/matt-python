// ============================================================
// beep.js — เสียงตอบสนองสั้น ๆ ด้วย Web Audio (ไม่ต้องใช้ไฟล์เสียง)
// เบราว์เซอร์ยอมให้เล่นเสียงหลังผู้ใช้คลิกครั้งแรกเท่านั้น → เรียก unlockAudio() ในปุ่มใดก็ได้
// ============================================================
let ctx = null;
let muted = false;

export function unlockAudio() {
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
  } catch { ctx = null; }
  return !!ctx;
}
export function setMuted(v) { muted = v; }
export function isMuted() { return muted; }

// เล่นเสียง "ปิ๊ง" ความถี่ freq (Hz) ยาว ms มิลลิวินาที เสียงค่อย ๆ จางไม่ให้ตกใจ
export function beep(freq = 880, ms = 120, volume = 0.2) {
  if (muted) return;
  if (!ctx) unlockAudio();
  if (!ctx || ctx.state !== 'running') return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator(), gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + ms / 1000); // เสียงไต่ขึ้นเล็กน้อย ให้รู้สึก "สำเร็จ"
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + ms / 1000);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t); osc.stop(t + ms / 1000 + 0.02);
}
