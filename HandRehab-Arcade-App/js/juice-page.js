// ============================================================
// juice-page.js — ต่อ juice.js เข้ากับหน้าเกม (ใช้ร่วมกันทั้ง 3 เกม) (Lab 26)
//   - เพิ่มชิป "คอมโบ ×ตัวคูณ" และ "🔥 streak" ในแถบบนของเกม
//   - ตรวจความสำเร็จระหว่างเล่น (คอมโบ ดาวดวงแรก พักมือ) และตอนจบรอบ
// ============================================================
import { Juice, AchievementBook } from './juice.js';
import { computeStreak, minutesByDay, MIN_MINUTES } from './streak.js';
import { listSessionsByUser, getSettings, saveSettings } from './db.js';
import { userId } from './games/game-shell.js';

// อ่าน streak ของผู้ใช้ + เก็บสถิติดีที่สุดไว้ใน settings (ไม่หายแม้ลบประวัติบางส่วน)
export async function streakInfo(uid = userId()) {
  let sessions = [];
  try { sessions = await listSessionsByUser(uid); } catch { /* ฐานข้อมูลเสีย → 0 */ }
  const st = computeStreak(minutesByDay(sessions));
  const key = 'streak:' + uid, saved = await getSettings(key);
  const best = Math.max(st.best, saved.best || 0);
  if (best !== (saved.best || 0)) { try { await saveSettings(key, { best, at: Date.now() }); } catch { /* ไม่เป็นไร */ } }
  return { ...st, best, sessions: sessions.length };
}

// ข้อความ streak สั้น ๆ สำหรับชิป/เมนู
export function streakText(st) {
  if (!st.current) return st.todayMinutes > 0 ? `วันนี้ ${st.todayMinutes.toFixed(1)}/${MIN_MINUTES} นาที` : 'เริ่มนับวันนี้เลย!';
  return st.todayDone ? `ติดต่อกัน ${st.current} วัน · วันนี้ครบแล้ว ✔` : `ติดต่อกัน ${st.current} วัน · วันนี้อีก ${Math.max(0, MIN_MINUTES - st.todayMinutes).toFixed(1)} นาที`;
}

// opts: { engine, gameKey, host, scoreEl, getLive() → ค่าสดของรอบ เช่น { successes } }
export function setupJuice({ engine, gameKey, host, scoreEl, getLive = () => ({}) }) {
  const bar = document.querySelector('.game-bar'), spacer = bar.querySelector('.spacer');
  const chips = document.createElement('span');
  chips.className = 'row'; chips.style.gap = 'var(--sp-2)';
  chips.innerHTML = `<span class="chip mult" title="ถูกติดกัน 3 = ×2 · 6 = ×3 · 10 = ×5 · พลาด = ×1">คอมโบ <b id="jCombo" class="num">0</b> <b id="jMult" class="num">×1</b></span>
    <span class="chip streak" id="streakChip" title="วันติดต่อกันที่ฝึกอย่างน้อย ${MIN_MINUTES} นาที">🔥 <b id="streakNum" class="num">0</b> วัน</span>`;
  bar.insertBefore(chips, spacer);
  const juice = new Juice({ engine, host, scoreEl, comboEl: chips.querySelector('#jCombo'), multEl: chips.querySelector('#jMult') });
  const book = new AchievementBook(userId(), (def) => juice.announce(def));
  book.load();
  let pauses = 0;
  juice.onHit = (count) => book.check({ game: gameKey, combo: count, ...getLive() });

  async function refreshStreak() {
    const st = await streakInfo();
    chips.querySelector('#streakNum').textContent = st.current;
    chips.querySelector('#streakChip').title = streakText(st) + ` · สถิติดีที่สุด ${st.best} วัน`;
    return st;
  }
  refreshStreak();
  window.__juice = juice;                       // ให้สคริปต์ทดสอบเข้าถึงได้
  return {
    juice, book, refreshStreak,
    notePause() { pauses++; book.check({ game: gameKey, pauses }); },
    // เรียกหลังบันทึกเซสชันแล้ว: ตรวจความสำเร็จแบบใช้ประวัติทั้งหมด + อัปเดต streak
    async endSession(ctx = {}) {
      const fresh = await book.checkEnd({ game: gameKey, pauses, combo: juice.combo.best, ...ctx });
      const st = await refreshStreak();
      return { fresh, streak: st };
    },
  };
}
