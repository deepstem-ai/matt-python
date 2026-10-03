// ทดสอบตรรกะล้วนของ Lab 26 ด้วย node (ไม่ต้องเปิดเบราว์เซอร์)   วิธีรัน: node tests/juice.test.mjs
import { Combo, multiplierFor } from '../js/juice.js';
import { computeStreak, minutesByDay, dayKey } from '../js/streak.js';
import { evaluate, statsFromSessions, ACHIEVEMENTS } from '../js/achievements.js';

let pass = 0, fail = 0;
const ok = (cond, name) => { if (cond) pass++; else { fail++; console.log('✗ FAIL', name); } };

// ---- คอมโบ ----
ok([0, 1, 2].every((n) => multiplierFor(n) === 1) && multiplierFor(3) === 2 && multiplierFor(6) === 3 && multiplierFor(9) === 3 && multiplierFor(10) === 5 && multiplierFor(50) === 5, 'ตารางตัวคูณ 1/2/3/5');
const c = new Combo(); const ups = [];
for (let i = 0; i < 12; i++) { const r = c.hit(); if (r.tierUp) ups.push(r.count); }
ok(JSON.stringify(ups) === '[3,6,10]', 'ขึ้นขั้นที่ 3, 6, 10 เท่านั้น ' + ups);
ok(c.miss() === 12 && c.mult === 1 && c.count === 0 && c.best === 12, 'พลาดแล้วรีเซ็ต แต่จำ best');
ok(c.hit().mult === 1, 'หลังพลาดกลับไป ×1');

// ---- streak ----
const day = (offset, min) => { const t = new Date(2026, 8, 20, 10, 0).getTime() + offset * 86400000; return { startTime: t, endTime: t + min * 60000 }; };
const today = new Date(2026, 8, 20, 18, 0);
let byDay = minutesByDay([day(0, 6), day(-1, 5), day(-2, 3), day(-2, 3), day(-3, 10), day(-5, 7), day(-6, 7), day(-7, 7), day(-8, 7)]);
let st = computeStreak(byDay, today);
ok(st.current === 4, 'streak ปัจจุบัน 4 (รวมสองเซสชันในวันเดียว 3+3 นาที) ได้ ' + st.current);
ok(st.best === 4, 'best 4 ได้ ' + st.best);
byDay = minutesByDay([day(-1, 5), day(-2, 5)]);
st = computeStreak(byDay, today);
ok(st.current === 2 && !st.todayDone, 'วันนี้ยังไม่ฝึก ไม่ถือว่าขาด (นับต่อจากเมื่อวาน)');
byDay = minutesByDay([day(-2, 5), day(-3, 5), day(-4, 5)]);
st = computeStreak(byDay, today);
ok(st.current === 0 && st.best === 3, 'ขาดเมื่อวาน → current 0 แต่ best ยัง 3');
ok(computeStreak(minutesByDay([day(0, 4.9)]), today).current === 0, 'ไม่ถึง 5 นาทีไม่นับ');
ok(dayKey(new Date(2026, 0, 5, 23, 30)) === '2026-01-05', 'dayKey ใช้เวลาท้องถิ่น');

// ---- ความสำเร็จ ----
ok(ACHIEVEMENTS.length === 10 && new Set(ACHIEVEMENTS.map((a) => a.key)).size === 10, 'มี 10 อย่างไม่ซ้ำ');
ok(evaluate({ game: 'star-portal', successes: 1 }).includes('first-star'), 'ดาวดวงแรก');
ok(!evaluate({ game: 'star-portal', successes: 1 }, new Set(['first-star'])).includes('first-star'), 'ได้แล้วไม่ได้ซ้ำ');
ok(evaluate({ combo: 10 }).includes('combo-10') && !evaluate({ combo: 9 }).includes('combo-10'), 'คอมโบ 10');
const perfect = { game: 'rhythm-tap', summary: { trials: new Array(12), wrong: 0, miss: 0, maxLevel: 3 } };
ok(evaluate(perfect).includes('perfect-rhythm') && !evaluate({ ...perfect, summary: { ...perfect.summary, miss: 1 } }).includes('perfect-rhythm'), 'จังหวะเป๊ะ');
ok(evaluate({ game: 'spread-wall', summary: { maxSpreadDeg: 41 }, stats: { prevBestSpread: 40 } }).includes('spread-record'), 'ทำลายสถิติกางนิ้ว');
ok(!evaluate({ game: 'spread-wall', summary: { maxSpreadDeg: 41 }, stats: { prevBestSpread: null } }).includes('spread-record'), 'ครั้งแรกยังไม่นับทำลายสถิติ');
const sess = [];
for (let i = 0; i < 7; i++) sess.push({ ...day(-i, 6), game: ['star-portal', 'rhythm-tap', 'spread-wall'][i % 3], reps: 15 });
const s2 = statsFromSessions(sess, today);
const e2 = evaluate({ stats: s2 });
ok(e2.includes('streak-7') && e2.includes('reps-100') && e2.includes('all-three') && !e2.includes('daily-10'), 'สถิติรวม: 7 วัน, 105 ครั้ง, ครบ 3 เกม ' + e2);
ok(evaluate({ pauses: 1 }).includes('rest-wise'), 'พักเป็นก็เก่ง');

console.log(`\nผ่าน ${pass} / ${pass + fail}`);
if (fail) process.exit(1);
