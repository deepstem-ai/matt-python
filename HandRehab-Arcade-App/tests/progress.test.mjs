// ทดสอบการคำนวณกราฟและข้อความสรุป   วิธีรัน: node tests/progress.test.mjs
import { dailyStats, lastDays, statCards, weeklySummary } from '../js/progress-data.js';
import { buildDemoHistory } from '../js/demo-history.js';

let pass = 0, fail = 0;
const ok = (c, name) => { if (c) pass++; else { fail++; console.log('✗ FAIL', name); } };
const today = new Date(2026, 8, 27, 18, 0);
const S = (daysAgo, min, extra = {}) => { const t = new Date(2026, 8, 27 - daysAgo, 10).getTime(); return { startTime: t, endTime: t + min * 60000, reps: 20, accuracy: 0.7, status: 'done', ...extra }; };

ok(lastDays(7, today).length === 7 && lastDays(7, today)[6] === '2026-09-27' && lastDays(7, today)[0] === '2026-09-21', 'lastDays');
const d = dailyStats([S(0, 5), S(0, 3, { maxSpreadDeg: 40 }), S(1, 6, { status: 'in-progress' })]);
ok(d['2026-09-27'].sessions === 2 && d['2026-09-27'].reps === 40 && d['2026-09-27'].maxSpread === 40 && !d['2026-09-26'], 'dailyStats รวมรายวัน ไม่นับรอบที่ไม่จบ');

// ฝึกมากขึ้น → บอกเปอร์เซ็นต์ที่มากขึ้น
let w = weeklySummary([S(1, 10), S(2, 10), S(8, 5), S(9, 5)], today);
ok(/มากกว่าสัปดาห์ก่อน 100%/.test(w.headline), 'ฝึกมากขึ้น 100%: ' + w.headline);
// ฝึกน้อยลง → ยังให้กำลังใจ ไม่มีคำตำหนิ
w = weeklySummary([S(1, 5), S(8, 10), S(9, 10)], today);
ok(/ไม่เป็นไร/.test(w.headline) && /5 นาที/.test(w.headline) && !/แย่|ล้มเหลว|ขี้เกียจ/.test(w.headline + w.lines.join('')), 'ฝึกน้อยลงแต่ให้กำลังใจ: ' + w.headline);
// มุมกางนิ้วลดลง → ให้กำลังใจ
w = weeklySummary([S(1, 5, { maxSpreadDeg: 38 }), S(8, 5, { maxSpreadDeg: 41 })], today);
ok(w.lines.some((l) => /ปกติ/.test(l) && /41/.test(l)), 'มุมลดลงยังให้กำลังใจ');
w = weeklySummary([S(1, 5, { maxSpreadDeg: 44 }), S(8, 5, { maxSpreadDeg: 41 })], today);
ok(w.lines.some((l) => /ดีขึ้น 3.0°/.test(l)), 'มุมดีขึ้น 3°');
ok(/เริ่มกัน/.test(weeklySummary([], today).headline), 'ไม่มีข้อมูล = ชวนเริ่ม');
ok(/ยังไม่ได้ฝึก/.test(weeklySummary([S(9, 5)], today).headline), 'สัปดาห์นี้ยังไม่ฝึก');
// การ์ด
const c = statCards([S(0, 6, { maxSpreadDeg: 40 }), S(1, 6), S(2, 6, { maxSpreadDeg: 44 }), S(10, 6)], today);
ok(c.totalSessions === 4 && c.weekReps === 60 && c.bestSpread.deg === 44 && c.streak.current === 3, 'การ์ด 4 ใบ ' + JSON.stringify({ ...c, streak: c.streak.current }));
// ข้อมูลจำลอง 30 วัน
const demo = buildDemoHistory('guest', { today });
ok(demo.sessions.length > 30 && demo.reps.length > 500 && demo.sessions.every((s) => s.details.synthetic), 'ข้อมูลจำลอง ' + demo.sessions.length + ' เซสชัน ' + demo.reps.length + ' ท่า');
const days = new Set(demo.sessions.map((s) => new Date(s.startTime).toDateString())).size;
ok(days >= 18 && days <= 30, 'จำนวนวันที่ฝึก ' + days);
const sp = demo.sessions.filter((s) => s.game === 'spread-wall').sort((a, b) => a.startTime - b.startTime);
ok(sp.at(-1).maxSpreadDeg > sp[0].maxSpreadDeg, 'มุมกางนิ้วมีแนวโน้มดีขึ้น');
console.log('ตัวอย่างสรุป:', weeklySummary(demo.sessions, today));

console.log(`\nผ่าน ${pass} / ${pass + fail}`);
if (fail) process.exit(1);
