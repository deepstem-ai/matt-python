// ============================================================
// achievements.js — ความสำเร็จ 10 อย่างที่ทีมออกแบบเอง (Lab 26)
// หลักการออกแบบ: ผูกกับเป้าหมายการฟื้นฟูจริง ไม่ใช่แค่ "เล่นเยอะ"
//   ง่าย 3 อย่าง (ได้ในวันแรก ให้กำลังใจ) · กลาง 3 อย่าง · ยาก 4 อย่าง (ต้องฝึกสม่ำเสมอ)
// เก็บใน store 'achievements' ของฐานข้อมูล: { id: userId+':'+key, userId, key, earnedAt, game }
// ============================================================
import { getByIndex, put, deleteByIndex, listSessionsByUser } from './db.js';
import { minutesByDay, computeStreak } from './streak.js';

// ctx ที่ส่งเข้ามาตรวจ:
//   game, live (ระหว่างเล่น) หรือ end (จบรอบ), combo, successes, summary (ผลจบรอบ),
//   stats: { totalReps, games: Set, todayMinutes, streak, prevBestSpread }, pauses
export const ACHIEVEMENTS = [
  { key: 'first-star', icon: '⭐', th: 'ดาวดวงแรก', en: 'First Star', level: 'ง่าย',
    how: 'ส่งดาวเข้าประตูมิติสำเร็จเป็นครั้งแรก', why: 'การจีบนิ้วครั้งแรกคือก้าวแรกของการหยิบของชิ้นเล็กได้เอง',
    test: (c) => c.game === 'star-portal' && (c.successes || 0) >= 1 },
  { key: 'all-three', icon: '🎮', th: 'ครบสามด่าน', en: 'Triple Explorer', level: 'ง่าย',
    how: 'เล่นครบทั้ง 3 เกม (จีบนิ้ว · เคาะนิ้ว · กางนิ้ว)', why: 'ฝึกครบทุกกลุ่มกล้ามเนื้อของมือ',
    test: (c) => (c.stats?.games?.size || 0) >= 3 },
  { key: 'rest-wise', icon: '🌿', th: 'พักเป็นก็เก่ง', en: 'Wise Rester', level: 'ง่าย',
    how: 'กดหยุดพักมือระหว่างเล่นอย่างน้อย 1 ครั้ง', why: 'การพักกันการบาดเจ็บจากการฝืน สำคัญพอ ๆ กับการฝึก',
    test: (c) => (c.pauses || 0) >= 1 },
  { key: 'reps-100', icon: '💯', th: 'ร้อยครั้งไม่ท้อ', en: 'Century', level: 'กลาง',
    how: 'ทำท่าบริหารสะสมครบ 100 ครั้ง (ทุกเกมรวมกัน)', why: 'การฟื้นฟูต้องอาศัยการทำซ้ำจำนวนมาก',
    test: (c) => (c.stats?.totalReps || 0) >= 100 },
  { key: 'daily-10', icon: '⏱️', th: 'สิบนาทีสุขภาพดี', en: 'Ten Minute Day', level: 'กลาง',
    how: 'ฝึกรวมในวันเดียวครบ 10 นาที', why: 'สองเท่าของเป้าหมายขั้นต่ำ 5 นาทีต่อวัน',
    test: (c) => (c.stats?.todayMinutes || 0) >= 10 },
  { key: 'spread-record', icon: '🖐️', th: 'กางได้กว้างกว่าเดิม', en: 'New Reach', level: 'กลาง',
    how: 'ทำลายสถิติมุมกางนิ้วสูงสุดของตัวเองในเกมกางนิ้วผ่านกำแพง', why: 'มุมกางนิ้วคือตัวชี้วัดการฟื้นฟูที่สำคัญที่สุด',
    test: (c) => c.game === 'spread-wall' && Number.isFinite(c.stats?.prevBestSpread) && (c.summary?.maxSpreadDeg || 0) > c.stats.prevBestSpread },
  { key: 'combo-10', icon: '🔥', th: 'มือไฟลุก', en: 'On Fire', level: 'ยาก',
    how: 'ทำถูกติดต่อกัน 10 ครั้ง (คอมโบ ×5)', why: 'ต้องควบคุมมือได้แม่นและสม่ำเสมอ',
    test: (c) => (c.combo || 0) >= 10 },
  { key: 'perfect-rhythm', icon: '🎼', th: 'จังหวะเป๊ะ', en: 'Perfect Rhythm', level: 'ยาก',
    how: 'จบรอบเคาะจังหวะโดยไม่พลาดเลย (อย่างน้อย 10 โน้ต)', why: 'การแยกนิ้วทีละนิ้วได้แม่นยำ 100%',
    test: (c) => c.game === 'rhythm-tap' && c.summary && c.summary.trials?.length >= 10 && c.summary.wrong === 0 && c.summary.miss === 0 },
  { key: 'rhythm-level5', icon: '⚡', th: 'นิ้วสายฟ้า', en: 'Lightning Fingers', level: 'ยาก',
    how: 'ไปถึงระดับ 5 (เร็วสุด) ในเกมเคาะจังหวะ', why: 'เวลาตอบสนองของนิ้วเร็วขึ้นจริง',
    test: (c) => c.game === 'rhythm-tap' && ((c.summary?.maxLevel || 0) >= 5 || (c.level || 0) >= 5) },
  { key: 'streak-7', icon: '📅', th: 'ครบสัปดาห์ไม่ขาด', en: 'Seven Day Streak', level: 'ยาก',
    how: 'ฝึกวันละอย่างน้อย 5 นาที ติดต่อกัน 7 วัน', why: 'ความสม่ำเสมอสำคัญกว่าความหนัก',
    test: (c) => (c.stats?.streak?.current || 0) >= 7 },
];
export const ACH_BY_KEY = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.key, a]));

// ตรวจแบบล้วน ๆ: คืนรายการ key ที่ "ผ่านเงื่อนไข" และยังไม่เคยได้
export function evaluate(ctx, earnedKeys = new Set()) {
  return ACHIEVEMENTS.filter((a) => !earnedKeys.has(a.key)).filter((a) => { try { return !!a.test(ctx); } catch { return false; } }).map((a) => a.key);
}

// สถิติรวมของผู้ใช้จากประวัติ (ใช้ตรวจความสำเร็จตอนจบรอบ)
export function statsFromSessions(sessions, today = new Date()) {
  const byDay = minutesByDay(sessions);
  const spreads = sessions.filter((s) => s.game === 'spread-wall').map((s) => s.maxSpreadDeg).filter(Number.isFinite);
  return {
    totalReps: sessions.reduce((a, s) => a + (s.reps || 0), 0),
    games: new Set(sessions.map((s) => s.game)),
    todayMinutes: computeStreak(byDay, today).todayMinutes,
    streak: computeStreak(byDay, today),
    bestSpread: spreads.length ? Math.max(...spreads) : null,
  };
}

// ---------- สมุดความสำเร็จของผู้ใช้หนึ่งคน (อ่าน/เขียนฐานข้อมูล) ----------
export class AchievementBook {
  constructor(userId, onEarn = () => {}) { this.userId = userId; this.onEarn = onEarn; this.earned = new Map(); }
  async load() {
    try { (await getByIndex('achievements', 'userId', this.userId)).forEach((r) => this.earned.set(r.key, r)); }
    catch (e) { console.warn('[achievements] อ่านไม่ได้', e); }
    return this;
  }
  has(key) { return this.earned.has(key); }
  get count() { return this.earned.size; }
  // ตรวจเงื่อนไข → บันทึกอันที่เพิ่งได้ → เรียก onEarn(def) ทีละอัน
  async check(ctx) {
    const fresh = evaluate(ctx, new Set(this.earned.keys()));
    for (const key of fresh) {
      const rec = { id: this.userId + ':' + key, userId: this.userId, key, earnedAt: Date.now(), game: ctx.game || null };
      this.earned.set(key, rec);                     // จำไว้ก่อน กันเด้งซ้ำระหว่างรอบันทึก
      try { await put('achievements', rec); } catch (e) { console.warn('[achievements] บันทึกไม่ได้', e); }
      this.onEarn(ACH_BY_KEY[key], rec);
    }
    return fresh;
  }
  // ตรวจตอนจบรอบ: อ่านประวัติทั้งหมดมาคำนวณสถิติรวม
  async checkEnd(ctx) {
    let sessions = [];
    try { sessions = await listSessionsByUser(this.userId); } catch { /* ไม่มีประวัติก็ตรวจเท่าที่ได้ */ }
    return this.check({ ...ctx, stats: { ...statsFromSessions(sessions), ...(ctx.stats || {}) } });
  }
  async reset() { await deleteByIndex('achievements', 'userId', this.userId); this.earned.clear(); }
}
