// ============================================================
// progress-data.js — คำนวณตัวเลขรายวัน/รายสัปดาห์ + เขียนสรุปเป็นภาษาคน (Lab 29)
// ตรรกะล้วน ไม่แตะหน้าจอ → ทดสอบด้วย node ได้ (tests/progress.test.mjs)
// กฎของข้อความสรุป: คำนวณจากข้อมูลจริงเท่านั้น และต้อง "ให้กำลังใจเสมอ" แม้ตัวเลขลดลง
// ============================================================
import { dayKey, minutesByDay, computeStreak } from './streak.js';

const DAY = 86400000;
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const avg = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : null);

// รายการวันที่ย้อนหลัง n วัน (รวมวันนี้) เป็น 'YYYY-MM-DD'
export function lastDays(n, today = new Date()) {
  const t0 = startOfDay(today);
  return Array.from({ length: n }, (_, i) => dayKey(new Date(t0.getFullYear(), t0.getMonth(), t0.getDate() - (n - 1 - i), 12)));
}

// รวมเซสชันเป็นรายวัน: { day: { sessions, reps, minutes, acc: [..], maxSpread } }
export function dailyStats(sessions) {
  const out = {};
  for (const s of sessions) {
    if (s.status === 'in-progress') continue;               // รอบที่เล่นไม่จบ ไม่นับในกราฟ
    const k = dayKey(s.startTime), d = (out[k] ||= { sessions: 0, reps: 0, minutes: 0, acc: [], maxSpread: null });
    d.sessions++; d.reps += s.reps || 0;
    d.minutes += Math.max(0, Math.min(60, ((s.endTime || s.startTime) - s.startTime) / 60000));
    if (Number.isFinite(s.accuracy)) d.acc.push(s.accuracy);
    if (Number.isFinite(s.maxSpreadDeg)) d.maxSpread = Math.max(d.maxSpread ?? -Infinity, s.maxSpreadDeg);
  }
  return out;
}

// สรุปช่วง [from, to) (ms)
function period(sessions, from, to) {
  const list = sessions.filter((s) => s.status !== 'in-progress' && s.startTime >= from && s.startTime < to);
  const spreads = list.map((s) => s.maxSpreadDeg).filter(Number.isFinite);
  return {
    sessions: list.length, days: new Set(list.map((s) => dayKey(s.startTime))).size,
    reps: list.reduce((a, s) => a + (s.reps || 0), 0),
    minutes: list.reduce((a, s) => a + Math.max(0, Math.min(60, ((s.endTime || s.startTime) - s.startTime) / 60000)), 0),
    accuracy: avg(list.map((s) => s.accuracy).filter(Number.isFinite)),
    maxSpread: spreads.length ? Math.max(...spreads) : null,
  };
}

// การ์ดตัวเลข 4 ใบ
export function statCards(sessions, today = new Date()) {
  const done = sessions.filter((s) => s.status !== 'in-progress');
  const end = startOfDay(today).getTime() + DAY, week = period(done, end - 7 * DAY, end);
  const spreads = done.filter((s) => Number.isFinite(s.maxSpreadDeg));
  const best = spreads.reduce((a, s) => (!a || s.maxSpreadDeg > a.maxSpreadDeg ? s : a), null);
  return { totalSessions: done.length, weekReps: week.reps, bestSpread: best ? { deg: best.maxSpreadDeg, at: best.startTime } : null,
    streak: computeStreak(minutesByDay(done), today) };
}

const pct = (a, b) => (b ? Math.round(((a - b) / b) * 100) : null);

// สรุปภาษาคน: สัปดาห์นี้ (7 วันล่าสุด) เทียบสัปดาห์ก่อน (7 วันก่อนหน้า) คืน { headline, lines[] }
export function weeklySummary(sessions, today = new Date()) {
  const end = startOfDay(today).getTime() + DAY;
  const now = period(sessions, end - 7 * DAY, end), prev = period(sessions, end - 14 * DAY, end - 7 * DAY);
  const st = computeStreak(minutesByDay(sessions.filter((s) => s.status !== 'in-progress')), today);
  const lines = [];
  let headline;
  if (!now.sessions && !prev.sessions) {
    return { headline: 'ยังไม่มีการฝึกใน 2 สัปดาห์นี้ มาเริ่มกันวันละ 5 นาทีนะ 🌱', lines: ['เริ่มจากเกมที่ชอบที่สุดสักรอบเดียวก็พอ ทุกครั้งที่ฝึกคือก้าวหนึ่งของการฟื้นฟู'], now, prev };
  }
  const m = pct(now.minutes, prev.minutes);
  if (!prev.sessions) headline = `สัปดาห์นี้คุณฝึกไปแล้ว ${now.days} วัน รวม ${now.reps} ครั้ง เริ่มต้นได้ดีมาก! 🎉`;
  else if (!now.sessions) headline = 'สัปดาห์นี้ยังไม่ได้ฝึกเลย ไม่เป็นไรนะ ร่างกายก็ต้องการวันพัก ลองตั้งเป้าเล็ก ๆ วันละ 5 นาทีดูไหม 🌿';
  else if (m > 5) headline = `สัปดาห์นี้คุณฝึกมากกว่าสัปดาห์ก่อน ${m}% (${Math.round(now.minutes)} นาที เทียบกับ ${Math.round(prev.minutes)} นาที) เก่งมาก! 💪`;
  else if (m < -5) headline = `สัปดาห์นี้ฝึกน้อยกว่าสัปดาห์ก่อน ${Math.abs(m)}% ไม่เป็นไรเลย ลองตั้งเป้าเล็ก ๆ วันละ 5 นาที แล้วค่อย ๆ เพิ่มนะ 🌱`;
  else headline = `สัปดาห์นี้ฝึกสม่ำเสมอเท่าสัปดาห์ก่อน (${Math.round(now.minutes)} นาที) ความสม่ำเสมอคือหัวใจของการฟื้นฟู 👏`;

  if (now.sessions && prev.sessions) {
    const r = pct(now.reps, prev.reps);
    if (r > 5) lines.push(`ทำท่าได้ ${now.reps} ครั้ง มากขึ้น ${r}% จากสัปดาห์ก่อน`);
    else if (r < -5) lines.push(`ทำท่าได้ ${now.reps} ครั้ง (สัปดาห์ก่อน ${prev.reps}) ทำช้า ๆ แต่ถูกท่าก็ได้ผลดีเหมือนกัน`);
    if (now.accuracy !== null && prev.accuracy !== null) {
      const a = Math.round(now.accuracy * 100), b = Math.round(prev.accuracy * 100);
      if (a > b) lines.push(`ความแม่นยำเพิ่มจาก ${b}% เป็น ${a}% มือเริ่มคุ้นกับท่าแล้ว`);
      else if (a < b) lines.push(`ความแม่นยำ ${a}% (สัปดาห์ก่อน ${b}%) ลองเล่นในที่สว่าง ๆ และพักมือระหว่างรอบ จะช่วยได้มาก`);
      else lines.push(`ความแม่นยำคงที่ที่ ${a}% ดีมาก`);
    }
  }
  if (now.maxSpread !== null) {
    if (prev.maxSpread !== null && now.maxSpread > prev.maxSpread) lines.push(`🖐️ มุมกางนิ้วดีขึ้น ${(now.maxSpread - prev.maxSpread).toFixed(1)}° (จาก ${prev.maxSpread}° เป็น ${now.maxSpread}°) นี่คือตัวชี้วัดที่สำคัญที่สุด!`);
    else if (prev.maxSpread !== null && now.maxSpread < prev.maxSpread) lines.push(`🖐️ มุมกางนิ้วสัปดาห์นี้ ${now.maxSpread}° ร่างกายมีวันดีวันเหนื่อยเป็นเรื่องปกติ สถิติดีของคุณ (${prev.maxSpread}°) ยังอยู่และทำได้อีกแน่นอน`);
    else lines.push(`🖐️ มุมกางนิ้วสูงสุดสัปดาห์นี้ ${now.maxSpread}°`);
  }
  if (st.current >= 2) lines.push(`🔥 ฝึกติดต่อกัน ${st.current} วันแล้ว รักษาไฟนี้ไว้นะ`);
  else if (st.best >= 2) lines.push(`สถิติฝึกติดต่อกันนานที่สุดของคุณคือ ${st.best} วัน เริ่มนับใหม่ได้ตั้งแต่วันนี้`);
  return { headline, lines, now, prev };
}
