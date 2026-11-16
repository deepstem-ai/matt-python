// ============================================================
// app-db-csv.test.mjs — ทดสอบตัวแปลงฐานข้อมูลแอป → CSV เสมือน → csv-kit (แอปรวม)
// วิธีรัน (ที่รากแอป):  node js/research/tests/app-db-csv.test.mjs
// หัวใจ: ตัวเลขต้องมาจากระเบียนจริงเท่านั้น และข้อมูลตัวอย่าง/จำลองต้องแยกเป็นไฟล์ DEMO- เสมอ
// ============================================================
import assert from 'node:assert/strict';
import { CONVERTERS, csvText } from '../app-db-csv.js';
import { analyze, summaryRows } from '../csv-kit.js';
import { demoSurveys, demoTaskRecords } from '../usertest-data.js';

let pass = 0;
const ok = (name, fn) => { fn(); pass++; console.log('✓', name); };
const an = (f) => analyze(f.text, { name: f.name });

ok('csvText ใส่เครื่องหมายคำพูดเมื่อมีจุลภาค', () => assert.equal(csvText([{ a: 'x,y', b: 1 }], ['a', 'b']), 'a,b\n"x,y",1'));

const T0 = Date.UTC(2026, 8, 1);
const sessions = [
  { id: 's1', userId: 'u1', game: 'spread-wall', startTime: T0, endTime: T0 + 6e4, reps: 10, accuracy: 0.8, score: 100, maxSpreadDeg: 40, avgFps: 30, details: {} },
  { id: 's2', userId: 'u1', game: 'spread-wall', startTime: T0 + 864e5, endTime: T0 + 864e5 + 6e4, reps: 14, accuracy: 0.9, score: 150, maxSpreadDeg: 48, avgFps: 31, details: {} },
  { id: 's3', userId: 'u2', game: 'star-portal', startTime: T0, reps: 99, accuracy: 1, score: 999, details: { demo: true } },
];
ok('sessions: แยกจริง/ตัวอย่าง และถูกเดาว่าเป็นประวัติการฝึก (ไม่ใช่ benchmark)', () => {
  const fs = CONVERTERS.sessions(sessions);
  assert.deepEqual(fs.map((f) => f.name), ['APP-DB-sessions.csv', 'DEMO-APP-DB-sessions.csv']);
  const r = an(fs[0]);
  assert.equal(r.kind, 'sessions');
  assert.equal(r.metrics.find((m) => m.key === 'sessions_n').value, 2);
  assert.equal(r.metrics.find((m) => m.key === 'spread_improvement').value, 8);
  assert.ok(an(fs[1]).demo);
});
ok('reps: ตัวอย่างดูจากรอบที่สังกัด · นับต่อท่า', () => {
  const fs = CONVERTERS.reps([{ sessionId: 's1', gesture: 'open', quality: 0.8 }, { sessionId: 's1', gesture: 'open', quality: 0.6 }, { sessionId: 's3', gesture: 'pinch' }], sessions);
  assert.equal(fs[0].n, 2); assert.equal(fs[1].n, 1);
  const r = an(fs[0]); assert.equal(r.kind, 'reps'); assert.equal(r.metrics[0].value, 2);
});
ok('surveys + usertasks: ข้อมูลตัวอย่าง 5 คน → ไฟล์ DEMO- เท่านั้น', () => {
  const s = CONVERTERS.surveys(demoSurveys(T0)), t = CONVERTERS.usertasks(demoTaskRecords(T0).map((x) => x.value));
  assert.deepEqual([...s, ...t].map((f) => f.name), ['DEMO-APP-DB-survey-responses.csv', 'DEMO-APP-DB-task-results.csv']);
  assert.equal(an(s[0]).kind, 'survey-raw'); assert.equal(an(t[0]).kind, 'usertask');
});
ok('surveys จริง: ค่าเฉลี่ยคำนวณจากคำตอบที่บันทึก', () => {
  const real = [{ id: 'a', participant: 'P01', createdAt: T0, answers: { q1: 5, q2: 3 } }, { id: 'b', participant: 'P02', createdAt: T0, answers: { q1: 4, q2: 4 } }];
  const r = an(CONVERTERS.surveys(real)[0]);
  assert.equal(r.metrics.find((m) => m.key === 'participants_n').value, 2);
  assert.equal(r.metrics.find((m) => m.key === 'survey_mean').value, 4);
});
ok('evaluations: 1 ไฟล์ต่อ 1 รอบ · โหมดจำลองเป็น DEMO- · ความแม่นยำตรงกับ trials', () => {
  const trials = [['bright', 'fist', 'fist'], ['bright', 'open', 'open'], ['dim', 'fist', 'none'], ['dim', 'open', 'open']].map(([condition, requested, detected], i) => ({ i, condition, requested, detected, brightness: condition === 'dim' ? 40 : 180, t: T0 }));
  const fs = CONVERTERS.evaluations([{ createdAt: T0, detector: 'rule', simulated: false, trials }, { createdAt: T0 + 1, detector: 'knn', simulated: true, trials }]);
  assert.ok(!fs[0].name.startsWith('DEMO-')); assert.ok(fs[1].name.startsWith('DEMO-'));
  const r = an(fs[0]);
  assert.equal(r.kind, 'evaluation');
  assert.equal(r.metrics.find((m) => m.key === 'gesture_acc').value, 75);
  assert.equal(r.metrics.find((m) => m.key === 'gesture_acc_dim').value, 50);
});
ok('benchmarks: แบบยาว เครื่อง × สถานการณ์ ข้ามสถานการณ์ที่ skipped', () => {
  const fs = CONVERTERS.benchmarks([{ machine: 'ห้องคอม 1', createdAt: T0, results: { camera: { avgFps: 30, minFps: 25, msPerFrame: 33 }, face: { skipped: true }, handSimple: { avgFps: 20, minFps: 15, msPerFrame: 50 } } }]);
  assert.equal(fs[0].n, 2);
  const r = an(fs[0]); assert.equal(r.kind, 'benchmark'); assert.equal(r.tables.perMachine[0].fps, 25);
});
ok('login-log: เฉพาะการเข้าด้วยใบหน้า success = face, ไม่ใช่ face-timeout', () => {
  const fs = CONVERTERS.loginlog([{ at: T0, method: 'face', ms: 2000 }, { at: T0, method: 'face-timeout', ms: 10000 }, { at: T0, method: 'pin', ms: 5000 }]);
  const r = an(fs[0]); assert.equal(r.kind, 'facelogin'); assert.equal(r.metrics.find((m) => m.key === 'face_login_acc').value, 50);
});
ok('ไม่มีข้อมูล = ไม่มีไฟล์ = SUMMARY เว้นว่างพร้อมบอกแลปที่ต้องกลับไป (ห้ามเดา)', () => {
  assert.deepEqual([...CONVERTERS.sessions([]), ...CONVERTERS.benchmarks([]), ...CONVERTERS.loginlog([]), ...CONVERTERS.evaluations([])], []);
  const rows = summaryRows([]);
  assert.ok(rows.every((r) => r.value === '' && /กลับไป Lab/.test(r.missing)));
});
console.log(`\nผ่าน ${pass} ข้อ`);
