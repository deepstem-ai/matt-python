// ============================================================
// demo-history.js — สร้างประวัติการฝึกจำลอง 30 วัน (เซสชัน + ทุกท่า) ไว้สาธิตหน้าประวัติ/กราฟ (Lab 28-29)
// ข้อมูลจำลองทุกแถวติดป้าย details.synthetic = true / synthetic: true → ลบทิ้งได้ และห้ามใช้เป็นผลวิจัยจริง
// แนวโน้มที่ใส่ไว้: ฝึกไปเรื่อย ๆ ความแม่นยำ/มุมกางนิ้วดีขึ้น · วันที่แสงน้อย ความแม่นยำตก (สมมติฐานเรื่องแสง)
// ============================================================
import { openDB, getByIndex, deleteSession, newId } from './db.js';

// ตัวสุ่มที่กำหนด seed ได้ → กดสร้างกี่ครั้งก็ได้รูปแบบใกล้เคียงกัน
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const GAMES = ['star-portal', 'rhythm-tap', 'spread-wall'];
const NOTES = ['', '', '', 'เมื่อคืนนอนน้อย', 'ข้อนิ้วชี้ตึง ๆ ตอนเช้า', 'สนุกมาก อยากเล่นอีก', 'ห้องมืดไปหน่อย', 'หลานมาช่วยเชียร์'];
const FINGERS = ['thumb', 'index', 'middle', 'ring', 'little'];

// สร้างข้อมูล (ยังไม่บันทึก) คืน { sessions, reps }
export function buildDemoHistory(userId, { days = 30, today = new Date(), seed = 42 } = {}) {
  const r = rng(seed + userId.length), rand = (a, b) => a + r() * (b - a), pick = (arr) => arr[Math.floor(r() * arr.length)];
  const sessions = [], reps = [];
  for (let d = days - 1; d >= 0; d--) {
    if (d > 6 && r() < 0.22) continue;                                   // บางวันไม่ได้ฝึก (7 วันล่าสุดฝึกทุกวัน → เห็นไฟ streak)
    const k = (days - 1 - d) / (days - 1);                               // 0 = วันแรก → 1 = วันนี้ (ความก้าวหน้า)
    const dark = r() < 0.2, bright = dark ? rand(45, 75) : rand(100, 165);
    const n = d <= 6 ? 2 + Math.floor(r() * 2) : 1 + Math.floor(r() * 3);   // 7 วันล่าสุดอย่างน้อย 2 รอบ (≥ 5 นาที)
    for (let j = 0; j < n; j++) {
      const game = pick(GAMES), day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - d, 8 + Math.floor(rand(0, 10)) + j, Math.floor(rand(0, 59)));
      const durMin = rand(3.2, 6.5), start = Math.min(day.getTime(), Date.now() - (durMin + 1) * 60000);
      const acc = Math.max(0.2, Math.min(0.98, 0.58 + 0.28 * k + rand(-0.08, 0.08) - (dark ? 0.15 : 0)));
      const cpu = r() < 0.2, id = newId('s_');
      const s = { id, userId, game, startTime: start, endTime: start + durMin * 60000, status: 'done', reps: 0, accuracy: +acc.toFixed(3), score: 0,
        avgFps: +(cpu ? rand(14, 22) : rand(26, 32)).toFixed(1), avgBrightness: +bright.toFixed(1), machine: cpu ? 'คอมเก่าที่บ้าน' : 'โน้ตบุ๊กห้องคอม 3', delegate: cpu ? 'CPU' : 'GPU',
        details: { synthetic: true } };
      const count = Math.round(game === 'rhythm-tap' ? rand(22, 30) + 14 * k : game === 'star-portal' ? rand(10, 14) + 8 * k : rand(9, 12) + 7 * k);
      const maxSpread = 30 + 16 * k + rand(-2, 2) - (dark ? 3 : 0);
      let t = 1500, ok = 0;
      for (let i = 1; i <= count; i++) {
        const success = r() < acc; ok += success;
        t += rand(1500, 4000) * (durMin * 60000 / (count * 3000));
        const row = { id: newId('r_'), sessionId: id, userId, game, n: i, t: Math.round(t), timestamp: Math.round(start + t), success, synthetic: true };
        if (game === 'star-portal') Object.assign(row, { gesture: 'pinch', peak: +rand(0.72, 1).toFixed(3), holdMs: Math.round(rand(160, 650)), angle: +rand(4, 14 - 5 * k).toFixed(1) });
        if (game === 'rhythm-tap') Object.assign(row, { gesture: 'fingerTap', finger: pick(FINGERS), result: success ? 'correct' : pick(['wrong', 'miss']), reactionMs: Math.round(rand(500, 1300) - 350 * k), peak: +rand(0.6, 1).toFixed(3), holdMs: null, angle: +rand(35, 55 + 15 * k).toFixed(1) });
        if (game === 'spread-wall') Object.assign(row, { gesture: 'spread', result: success ? 'pass' : 'hit', peak: +rand(0.1, 0.95).toFixed(3), holdMs: null, angle: +Math.min(maxSpread, rand(12, maxSpread)).toFixed(1) });
        reps.push(row);
      }
      s.reps = count; s.score = Math.round(ok * (game === 'star-portal' ? 1.6 : 14));
      if (game === 'spread-wall') s.maxSpreadDeg = +maxSpread.toFixed(1);
      if (r() < 0.75) s.feeling = { mood: Math.max(1, Math.min(5, Math.round(rand(2.5, 5.4) - (dark ? 1 : 0)))), pain: Math.max(0, Math.round(rand(-1, 4) - 2 * k)), note: pick(NOTES), at: s.endTime };
      sessions.push(s);
    }
  }
  return { sessions, reps };
}

// บันทึกทั้งหมดใน transaction เดียว (เร็วกว่าบันทึกทีละแถวมาก)
export async function generateDemoHistory(userId, opts) {
  const { sessions, reps } = buildDemoHistory(userId, opts);
  const db = await openDB();
  await new Promise((res, rej) => {
    const tx = db.transaction(['sessions', 'reps'], 'readwrite');
    sessions.forEach((s) => tx.objectStore('sessions').put(s));
    reps.forEach((x) => tx.objectStore('reps').put(x));
    tx.oncomplete = res; tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error || new Error('ยกเลิกการบันทึก'));
  });
  return { sessions: sessions.length, reps: reps.length };
}

// ลบเฉพาะข้อมูลจำลองของผู้ใช้นี้ (ข้อมูลจริงไม่ถูกแตะ)
export async function clearDemoHistory(userId) {
  const list = (await getByIndex('sessions', 'userId', userId)).filter((s) => s.details?.synthetic);
  let reps = 0;
  for (const s of list) reps += (await deleteSession(s.id)).reps;
  return { sessions: list.length, reps };
}
