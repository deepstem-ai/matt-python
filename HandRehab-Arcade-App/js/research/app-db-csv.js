// ============================================================
// app-db-csv.js — "อ่านจากฐานข้อมูลของแอปนี้โดยตรง" (แอปรวม)
// แปลงข้อมูลใน IndexedDB (sessions, reps, surveys, usertest, evaluations, benchmarks, login-log)
// เป็น "ไฟล์ CSV เสมือน" หน้าตาเดียวกับไฟล์ที่ export จากแต่ละหน้า แล้วส่งให้ csv-kit.js วิเคราะห์ตามเดิม
// นักเรียนจึงไม่ต้อง export ก่อน — ตัวเลขทุกตัวยังมาจากข้อมูลที่บันทึกจริงเท่านั้น (ไม่มี = ไม่มี ห้ามเดา)
// ข้อมูลตัวอย่าง/จำลอง (demo, synthetic, simulated) แยกเป็นไฟล์ชื่อขึ้นต้น DEMO- เสมอ
//   → แดชบอร์ดหลักฐานไม่นับเป็นหลักฐาน และร่างรายงานติดป้าย "ห้ามใช้ในรายงาน"
// ============================================================
import { getAll, get } from '../db.js';
import { surveyRows, surveyCols, taskRows, taskCols } from './usertest-csv.js';

// สร้างข้อความ CSV (ไม่ใส่ BOM เพราะไม่ได้เปิดใน Excel — ส่งให้ตัวอ่านของเราเอง)
export function csvText(rows, cols) {
  const e = (v) => { if (v === null || v === undefined) return ''; const s = typeof v === 'object' ? JSON.stringify(v) : String(v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  return [cols.join(','), ...rows.map((r) => cols.map((c) => e(r[c])).join(','))].join('\n');
}
const day = (t) => (Number.isFinite(+t) && +t > 0 ? new Date(+t).toISOString().slice(0, 10) : '');
const isDemoSession = (s) => !!(s?.details?.demo || s?.details?.synthetic || s?.synthetic || s?.demo || /^DEMO/i.test(s?.userId || ''));

// แบ่งรายการเป็น จริง / ตัวอย่าง แล้วสร้างไฟล์เสมือน 0–2 ไฟล์
function split(name, list, isDemo, toRows, cols) {
  const out = [];
  const real = list.filter((x) => !isDemo(x)), demo = list.filter(isDemo);
  if (real.length) out.push({ name: `APP-DB-${name}.csv`, text: csvText(toRows(real), cols), n: real.length, source: 'db' });
  if (demo.length) out.push({ name: `DEMO-APP-DB-${name}.csv`, text: csvText(toRows(demo), cols), n: demo.length, source: 'db', demo: true });
  return out;
}

// แปลงแต่ละ store → แถว CSV (ชื่อคอลัมน์ตรงกับไฟล์ที่ export จากหน้าเดิม)
export const CONVERTERS = {
  // ประวัติการฝึก (Lab 28) — game, reps, accuracy, score, maxSpreadDeg
  sessions(sessions) {
    const cols = ['id', 'userId', 'game', 'startTime', 'endTime', 'reps', 'accuracy', 'score', 'maxSpreadDeg', 'machine', 'delegate'] // ไม่ใส่ avgFps: คอลัมน์ fps ทำให้ถูกเดาว่าเป็นไฟล์ benchmark;
    return split('sessions', sessions.filter((s) => s.game), isDemoSession, (l) => l.sort((a, b) => a.startTime - b.startTime), cols);
  },
  // ท่าย่อยทุกครั้ง (reps) — ตัวตนตัวอย่างดูจากรอบที่มันอยู่
  reps(reps, sessions) {
    const sById = new Map(sessions.map((s) => [s.id, s]));
    const cols = ['sessionId', 'userId', 'game', 'gesture', 'n', 'timestamp', 'peak', 'holdMs', 'quality', 'success', 'angle'];
    return split('reps', reps, (r) => r.synthetic || r.demo || isDemoSession(sById.get(r.sessionId)), (l) => l, cols);
  },
  // แบบสอบถาม (Lab 36) — ใช้ฟังก์ชันเดียวกับปุ่ม CSV ของหน้าแบบสอบถาม
  surveys(list) { return split('survey-responses', list.filter((s) => s.type !== 'sus'), (s) => s.demo, surveyRows, surveyCols()); },   // SUS แยกไปหน้า survey-results
  // ผลงาน 8 ข้อจากตัวบันทึกการทดสอบ (Lab 36)
  usertasks(records) { return split('task-results', records, (r) => r.demo, taskRows, taskCols); },
  // ผลวัดความแม่นยำ (Lab 32) — 1 ไฟล์ต่อ 1 รอบที่กดบันทึก (ตัวตรวจคนละแบบ ห้ามรวมกัน)
  evaluations(list) {
    const cols = ['i', 'condition', 'requested', 'detected', 'correct', 'brightness', 'handFoundPct', 'frames', 'votes', 'detector', 'simulated', 'date'];
    return list.sort((a, b) => a.createdAt - b.createdAt).map((ev) => {
      const demo = !!ev.simulated;
      const rows = (ev.trials || []).map((t) => ({ ...t, correct: t.requested === t.detected ? 1 : 0, detector: ev.detector, simulated: demo, date: day(t.t || ev.createdAt) }));
      const stamp = new Date(ev.createdAt).toISOString().slice(0, 16).replace(/[:T]/g, '-');
      return { name: `${demo ? 'DEMO-' : ''}APP-DB-evaluation-${ev.detector}-${stamp}.csv`, text: csvText(rows, cols), n: rows.length, source: 'db', demo };
    }).filter((f) => f.n);
  },
  // ผลวัดความลื่น (Lab 33) — แบบยาว: 1 แถว = 1 เครื่อง × 1 สถานการณ์ (สถานการณ์ที่ข้ามไม่ใส่)
  benchmarks(list) {
    const cols = ['machine', 'scenario', 'avgFps', 'minFps', 'msPerFrame', 'handFoundPct', 'date'];
    const rows = list.flatMap((b) => Object.entries(b.results || {}).filter(([, r]) => r && !r.skipped && Number.isFinite(r.avgFps))
      .map(([scenario, r]) => ({ machine: b.machine, scenario, avgFps: r.avgFps, minFps: r.minFps, msPerFrame: r.msPerFrame, handFoundPct: r.handFoundPct ?? '', date: day(b.createdAt) })));
    return rows.length ? [{ name: 'APP-DB-benchmark.csv', text: csvText(rows, cols), n: rows.length, source: 'db' }] : [];
  },
  // บันทึกการเข้าสู่ระบบ (Lab 15) — success = เข้าด้วยใบหน้าได้ (ไม่ได้ตรวจว่า "ถูกคน" หรือไม่)
  loginlog(items) {
    const cols = ['date', 'method', 'success', 'seconds'];
    const rows = items.filter((x) => /face/.test(x.method || '')).map((x) => ({ date: day(x.at), method: x.method, success: x.method === 'face' ? 1 : 0, seconds: Number.isFinite(x.ms) ? +(x.ms / 1000).toFixed(2) : '' }));
    return rows.length ? [{ name: 'APP-DB-face-login.csv', text: csvText(rows, cols), n: rows.length, source: 'db', note: 'success = เข้าสู่ระบบด้วยใบหน้าสำเร็จ (ยังไม่ได้ตรวจว่าเป็นคนถูกคน — ถ้าจะรายงาน "ความถูกต้อง" ต้องทดสอบแบบ Lab 15)' }] : [];
  },
};

// อ่านทุก store → [{ name, text, n, source:'db', demo? }] · report = จำนวนระเบียนที่อ่านได้ต่อ store
export async function readAppDatabase() {
  const safe = async (fn, d) => { try { return await fn(); } catch (e) { console.warn('[app-db] อ่านไม่ได้', e); return d; } };
  const [sessions, reps, surveys, settings, evaluations, benchmarks, login] = await Promise.all([
    safe(() => getAll('sessions'), []), safe(() => getAll('reps'), []), safe(() => getAll('surveys'), []), safe(() => getAll('settings'), []),
    safe(() => getAll('evaluations'), []), safe(() => getAll('benchmarks'), []), safe(async () => (await get('settings', 'login-log'))?.value?.items || [], []),
  ]);
  const usertasks = settings.filter((r) => String(r.key).startsWith('usertest-') && r.key !== 'usertest-issues').map((r) => r.value).filter(Boolean);
  const files = [
    ...CONVERTERS.sessions(sessions), ...CONVERTERS.reps(reps, sessions), ...CONVERTERS.surveys(surveys), ...CONVERTERS.usertasks(usertasks),
    ...CONVERTERS.evaluations(evaluations), ...CONVERTERS.benchmarks(benchmarks), ...CONVERTERS.loginlog(login),
  ];
  const report = { sessions: sessions.length, reps: reps.length, surveys: surveys.length, usertasks: usertasks.length, evaluations: evaluations.length, benchmarks: benchmarks.length, loginlog: login.length };
  return { files, report };
}
// ป้ายภาษาไทยของแต่ละ store (ใช้แสดงว่าอ่านอะไรมาได้บ้าง)
export const STORE_TH = { sessions: 'รอบการฝึก', reps: 'ท่าย่อย', surveys: 'แบบสอบถาม', usertasks: 'บันทึกการทดสอบ', evaluations: 'ผลวัดความแม่นยำ', benchmarks: 'ผลวัดความลื่น', loginlog: 'บันทึกเข้าสู่ระบบ' };
export const reportText = (r) => Object.entries(r).map(([k, n]) => `${STORE_TH[k]} ${n}`).join(' · ');
