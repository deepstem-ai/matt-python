// ============================================================
// streak.js — นับ "วันติดต่อกัน" ที่ฝึกครบอย่างน้อย 5 นาที (Lab 26)
// โมดูลนี้เป็นตรรกะล้วน ไม่แตะหน้าจอ/ฐานข้อมูล จึงทดสอบด้วย node ได้
//   minutesByDay(sessions)            → { 'YYYY-MM-DD': นาทีที่ฝึกในวันนั้น }
//   computeStreak(byDay, today, min)  → { current, best, todayMinutes, todayDone }
// กติกา: วันไหนฝึกไม่ถึง 5 นาที = ขาด → เริ่มนับใหม่ แต่ "สถิติดีที่สุด" (best) ยังเก็บไว้
//        วันนี้ยังไม่ครบ 5 นาที ไม่ถือว่าขาด (ยังมีเวลาทั้งวัน) นับต่อจากเมื่อวาน
// ============================================================

export const MIN_MINUTES = 5;          // เป้าหมายขั้นต่ำต่อวัน ผู้สูงอายุทำได้จริงทุกวัน

// วันที่ตามเวลาท้องถิ่นของเครื่อง (ไม่ใช้ UTC เพราะจะเพี้ยนช่วงเช้ามืดในไทย)
export function dayKey(t) {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// รวมเวลาฝึก (นาที) ของแต่ละวัน จากรายการเซสชัน { startTime, endTime }
// เซสชันเดียวนับไม่เกิน 60 นาที (กันกรณีลืมปิดหน้าจอ)
export function minutesByDay(sessions) {
  const out = {};
  for (const s of sessions || []) {
    if (!s || !Number.isFinite(s.startTime)) continue;
    const min = Math.max(0, Math.min(60, ((s.endTime || s.startTime) - s.startTime) / 60000));
    const k = dayKey(s.startTime);
    out[k] = (out[k] || 0) + min;
  }
  return out;
}

// จำนวนวันระหว่างสองวันที่ ('YYYY-MM-DD') ใช้เที่ยงวันกันปัญหาเวลาออมแสง
function daysBetween(a, b) {
  const pa = new Date(a + 'T12:00:00'), pb = new Date(b + 'T12:00:00');
  return Math.round((pb - pa) / 86400000);
}

export function computeStreak(byDay, today = new Date(), minMinutes = MIN_MINUTES) {
  const ok = (k) => (byDay[k] || 0) >= minMinutes;
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
  const todayKey = dayKey(d);
  if (!ok(todayKey)) d.setDate(d.getDate() - 1);     // วันนี้ยังไม่ครบ → เริ่มนับจากเมื่อวาน
  let current = 0;
  while (ok(dayKey(d))) { current++; d.setDate(d.getDate() - 1); }
  // สถิติดีที่สุด: ไล่ดูทุกวันที่ผ่านเกณฑ์ เรียงตามวัน แล้วหาช่วงต่อเนื่องที่ยาวที่สุด
  const days = Object.keys(byDay).filter(ok).sort();
  let best = 0, run = 0, prev = null;
  for (const k of days) {
    run = prev && daysBetween(prev, k) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = k;
  }
  return { current, best: Math.max(best, current), todayMinutes: +(byDay[todayKey] || 0).toFixed(1), todayDone: ok(todayKey) };
}
