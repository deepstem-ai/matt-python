// ============================================================
// usertest-csv.js — แปลงข้อมูลการทดสอบเป็นแถว CSV + คำนวณสถิติ
// ชื่อคอลัมน์คงที่ เพราะ Lab 37/38/39 อ่านไฟล์เหล่านี้ต่อ
// ============================================================
import { QUESTIONS, TASKS } from './usertest-data.js';
import { mean, sd } from './charts.js';
import { SUS_ITEMS, susScore } from './sus.js';

// ---------- แบบสอบถาม: 1 แถว = 1 คน ----------
export const surveyCols = () => ['participant', 'date', ...QUESTIONS.map((q) => q.id), 'mean', 'comment', 'demo'];
export function surveyRows(list) {
  return list.map((s) => {
    const vals = QUESTIONS.map((q) => s.answers?.[q.id]).filter((v) => Number.isFinite(v));
    const row = { participant: s.participant || s.userId, date: new Date(s.createdAt).toISOString().slice(0, 10), comment: s.comment || '', demo: s.demo ? 'yes' : 'no' };
    QUESTIONS.forEach((q) => { row[q.id] = s.answers?.[q.id] ?? ''; });
    row.mean = vals.length ? +mean(vals).toFixed(2) : '';
    return row;
  });
}

// ---------- สถิติรายข้อ: mean, SD (ตัวอย่าง n-1), n, min, max ----------
export function questionStats(list) {
  return QUESTIONS.map((q, i) => {
    const v = list.map((s) => s.answers?.[q.id]).filter((x) => Number.isFinite(x));
    return { question: q.id, no: i + 1, group: q.group, text: q.th, n: v.length, mean: +mean(v).toFixed(2), sd: +sd(v).toFixed(2), min: v.length ? Math.min(...v) : '', max: v.length ? Math.max(...v) : '' };
  });
}
export const statsCols = ['question', 'group', 'text', 'n', 'mean', 'sd', 'min', 'max'];

// สรุปรายด้าน (รวมคำตอบทุกข้อในด้านเดียวกัน)
export function groupStats(list) {
  const groups = [...new Set(QUESTIONS.map((q) => q.group))];
  return groups.map((g) => {
    const v = list.flatMap((s) => QUESTIONS.filter((q) => q.group === g).map((q) => s.answers?.[q.id])).filter((x) => Number.isFinite(x));
    return { group: g, n: v.length, mean: +mean(v).toFixed(2), sd: +sd(v).toFixed(2) };
  });
}

// ---------- บันทึกงาน: 1 แถว = 1 คน × 1 งาน ----------
export const taskCols = ['participant', 'date', 'task', 'task_th', 'outcome', 'seconds', 'note', 'demo'];
export function taskRows(records) {
  return records.flatMap((r) => (r.tasks || []).map((t) => ({
    participant: r.participant, date: new Date(r.startedAt).toISOString().slice(0, 10), task: t.id,
    task_th: TASKS.find((x) => x.id === t.id)?.th || '', outcome: t.outcome || '', seconds: t.seconds ?? '', note: t.note || '', demo: r.demo ? 'yes' : 'no',
  })));
}
// สรุปรายงาน: นับผลแต่ละแบบ + เวลาเฉลี่ย
export function taskSummary(records) {
  return TASKS.map((t) => {
    const rows = records.map((r) => (r.tasks || []).find((x) => x.id === t.id)).filter((x) => x && x.outcome);
    const secs = rows.map((x) => x.seconds).filter((x) => Number.isFinite(x));
    const c = (k) => rows.filter((x) => x.outcome === k).length;
    return { task: t.id, th: t.th, n: rows.length, alone: c('alone'), help: c('help'), fail: c('fail'),
      successPct: rows.length ? Math.round((c('alone') / rows.length) * 100) : '', meanSec: +mean(secs).toFixed(1), sdSec: +sd(secs).toFixed(1) };
  });
}

// ---------- SUS: 1 แถว = 1 คน (คำตอบดิบ 10 ข้อ + คะแนน SUS 0-100) ----------
export const susCols = () => ['participant', 'date', ...SUS_ITEMS.map((q) => q.id), 'sus_score', 'demo'];
export function susRows(list) {
  return list.map((s) => {
    const row = { participant: s.participant || s.userId, date: new Date(s.createdAt).toISOString().slice(0, 10), demo: s.demo ? 'yes' : 'no' };
    SUS_ITEMS.forEach((q) => { row[q.id] = s.answers?.[q.id] ?? ''; });
    row.sus_score = susScore(s.answers) ?? '';
    return row;
  });
}
