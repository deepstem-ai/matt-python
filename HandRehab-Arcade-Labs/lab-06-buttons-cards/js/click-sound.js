// ============================================================
// click-sound.js — เสียงคลิกเบา ๆ ด้วย Web Audio API (Lab 06 COULD DO)
// ไม่ใช้ไฟล์เสียง สร้างคลื่นเสียงสั้น ๆ เองในเบราว์เซอร์
// เบราว์เซอร์อนุญาตให้เล่นเสียงหลังผู้ใช้กดอะไรสักอย่างเท่านั้น จึงสร้าง AudioContext ตอนกดครั้งแรก
// ============================================================
let ctx = null;

// เล่นเสียง "ติ๊ก" สั้น 60 มิลลิวินาที (ความถี่ตามชนิดปุ่ม)
export function click(kind = 'primary') {
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    const freq = { primary: 660, success: 880, danger: 330, ghost: 520 }[kind] || 660;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const t = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.15, t + 0.01);  // ดังขึ้นเร็ว ๆ
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06); // แล้วเบาลงจนเงียบ (ไม่มีเสียงแตก)
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.07);
  } catch { /* เครื่องไม่มีเสียงก็ข้ามไป ปุ่มยังทำงานปกติ */ }
}
