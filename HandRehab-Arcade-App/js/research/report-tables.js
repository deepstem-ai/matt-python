// ============================================================
// report-tables.js — แปลงผลวิเคราะห์ CSV (จาก csv-kit.js) เป็นค่าและตาราง Markdown
// สำหรับเติมแม่แบบบทที่ 3–5 (Lab 39)
// ทุกตัวเลขคำนวณจากไฟล์จริง ไม่มีไฟล์ = ไม่มีคีย์ → แม่แบบจะขึ้น [[missing: ...]] เอง
// ============================================================
import { fmt, mean, sd, lightTh } from './csv-kit.js';

// คำถามแบบสอบถาม 10 ข้อ (ตรงกับ Lab 36 js/usertest-data.js)
const Q_TH = {
  q1: ['ความง่าย', 'ลงทะเบียนเองได้ โดยไม่งง'], q2: ['ความง่าย', 'ตัวหนังสือและปุ่มใหญ่พอ'], q3: ['ความง่าย', 'เข้าใจว่าต้องทำท่ามือแบบไหน'],
  q4: ['ความสนุก', 'เกมสนุก'], q5: ['ความสนุก', 'อยากเล่นอีกครั้ง'], q6: ['ความเหนื่อย', 'เล่นจบแล้วมือไม่ล้าเกินไป'],
  q7: ['ความเหนื่อย', 'ความยาวแต่ละรอบพอดี'], q8: ['ความมั่นใจ', 'มั่นใจว่าใช้เองที่บ้านได้'], q9: ['ความมั่นใจ', 'จะใช้ฝึกต่อสัปดาห์ละหลายวัน'],
  q10: ['ความเป็นส่วนตัว', 'สบายใจที่แอปใช้กล้องและเก็บรูปหน้า'],
};
const GESTURE_TH = { pinch: 'จีบนิ้ว', fist: 'กำมือ', open: 'แบมือกางนิ้ว', fingerTap: 'แตะนิ้วทีละนิ้ว', wristFlex: 'งอ-เหยียดข้อมือ', none: '(ไม่พบท่า)' };
const gth = (g) => (GESTURE_TH[g] ? `${GESTURE_TH[g]} (${g})` : g);
export const level = (m) => (m >= 4.51 ? 'มากที่สุด' : m >= 3.51 ? 'มาก' : m >= 2.51 ? 'ปานกลาง' : m >= 1.51 ? 'น้อย' : 'น้อยที่สุด');

// ตาราง Markdown จากหัวคอลัมน์ + แถว
export const mdTable = (head, rows) => [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...rows.map((r) => `| ${r.join(' | ')} |`)].join('\n');
const pm = (m, s, d = 2) => `${fmt(m, d)} ± ${fmt(s, d)}`;

// รวมผลวิเคราะห์ทุกไฟล์ → values สำหรับ fillTemplate
export function buildValues(results, crit = {}) {
  const v = {};
  const by = (kind) => results.filter((r) => r.kind === kind || (Array.isArray(kind) && kind.includes(r.kind)));
  const metric = (r, key) => r.metrics.find((m) => m.key === key);

  // ---------- Lab 32 ความแม่นยำ ----------
  const ev = by('evaluation')[0] || by('evaluation-summary')[0];
  if (ev) {
    v.src_eval = ev.file;
    const acc = metric(ev, 'gesture_acc');
    if (acc) { v.acc_overall = fmt(acc.value, 1); v.n_eval = ev.rows; }
    const pg = ev.tables.perGesture || [];
    if (pg.length) {
      v.tbl_gesture = mdTable(['ท่า', 'n', 'Precision', 'Recall', 'F1'], pg.map((g) => [gth(g.gesture), g.n, fmt(g.precision), fmt(g.recall), fmt(g.f1)]));
      const byF1 = pg.filter((g) => Number.isFinite(g.f1)).sort((a, b) => b.f1 - a.f1);
      if (byF1.length) { v.easiest_gesture = `${gth(byF1[0].gesture)} (F1 = ${fmt(byF1[0].f1)})`; v.hardest_gesture = `${gth(byF1.at(-1).gesture)} (F1 = ${fmt(byF1.at(-1).f1)})`; }
    }
    const cf = ev.tables.confusion;
    if (cf?.labels?.length) {
      const rowIdx = cf.labels.map((a, i) => i).filter((i) => cf.matrix[i].some((n) => n > 0)); // แถวเฉพาะท่าที่ถูกขอจริง
      v.tbl_confusion = mdTable(['ขอ \\ ตรวจได้', ...cf.labels.map(gth)], rowIdx.map((i) => [`**${gth(cf.labels[i])}**`, ...cf.matrix[i]]));
      let best = null; // คู่ที่สับสนมากที่สุด (นอกแนวทแยง)
      cf.labels.forEach((a, i) => cf.labels.forEach((b, j) => { if (i !== j && cf.matrix[i][j] > (best?.n || 0)) best = { a, b, n: cf.matrix[i][j] }; }));
      if (best) v.top_confusion = `${gth(best.a)} ถูกตรวจเป็น ${gth(best.b)} ${best.n} ครั้ง`;
    }
    const pl = ev.tables.perLighting || [];
    if (pl.length) {
      v.tbl_lighting = mdTable(['สภาพแสง', 'n', 'ความสว่างเฉลี่ยของภาพ (0–255)', 'ความแม่นยำ (%)'], pl.map((x) => [lightTh(x.lighting), fmt(x.n, 0), fmt(x.brightness, 1), fmt(x.accuracy, 1)]));
      const key = (x) => ({ สว่าง: 'bright', ปกติ: 'normal', สลัว: 'dim' }[lightTh(x.lighting)]);
      pl.forEach((x) => { const k = key(x); if (k) { v['acc_' + k] = fmt(x.accuracy, 1); if (Number.isFinite(x.brightness)) v['bri_' + k] = fmt(x.brightness, 0); } });
      if (v.acc_dim && v.acc_normal) { const gap = +v.acc_normal - +v.acc_dim; v.dim_gap = gap > 0 ? `ต่ำกว่า ${fmt(gap, 1)} จุดร้อยละ` : `ไม่ต่ำกว่า (ต่างกัน ${fmt(gap, 1)} จุดร้อยละ)`; }
      const n = pg.length ? Math.round(ev.rows / pg.length / pl.length) : '';
      if (n) v.trials = n;
    }
  }

  // ---------- Lab 33 เครื่อง ----------
  const bm = by('benchmark');
  if (bm.length) {
    const pm_ = bm.flatMap((r) => r.tables.perMachine || []);
    v.src_bench = bm.map((r) => r.file).join(', ');
    v.n_machines = pm_.length;
    v.tbl_machine = mdTable(['เครื่อง', 'จำนวนการวัด', 'FPS เฉลี่ย ± SD', 'FPS ต่ำสุด', 'เวลา AI ต่อเฟรม (ms) ± SD'], pm_.map((x) => [x.machine, x.n, pm(x.fps, x.fpsSd, 1), fmt(x.minFps, 1), pm(x.aiMs, x.aiSd, 1)]));
    const fpsList = pm_.map((x) => x.fps).filter(Number.isFinite);
    if (fpsList.length) v.fps_range = `${fmt(Math.min(...fpsList), 1)}–${fmt(Math.max(...fpsList), 1)}`;
    const ps = bm[0].tables.perScenario;
    if (ps?.length) { const ms = Object.keys(ps[0]).filter((k) => k !== 'scenario'); v.tbl_scenario = mdTable(['สถานการณ์', ...ms], ps.map((s) => [s.scenario, ...ms.map((m) => fmt(s[m], 1))])); }
    const ai = bm.map((r) => metric(r, 'ai_ms')).find(Boolean);
    if (ai) v.ai_ms = ai.text.replace(' ms', '');
    v.tbl_hw_auto = mdTable(['เครื่อง', 'CPU', 'RAM', 'GPU / delegate'], pm_.map((x) => [x.machine, ...['CPU', 'RAM', 'GPU'].map((w) => `[[missing: กลับไป Lab 33 — ${w} ของ ${x.machine}]]`)]));
  }

  // ---------- Lab 15 ใบหน้า ----------
  const fl = by('facelogin')[0];
  if (fl) { v.src_face = fl.file; v.face_n = fl.rows; const a = metric(fl, 'face_login_acc'), t = metric(fl, 'face_login_time'); if (a) v.face_acc = a.text; if (t) v.face_time = t.text; }

  // ---------- Lab 36 ผู้ใช้ ----------
  const ut = by('usertask')[0];
  if (ut) {
    v.src_tasks = ut.file; v.test_dates = ut.date;
    const n = metric(ut, 'test_participants'), s = metric(ut, 'task_success_pct');
    if (n) v.n_participants = n.value; if (s) v.task_success = fmt(s.value, 1);
    v.tbl_tasks = mdTable(['งาน', 'n', 'ทำได้เอง', 'ต้องช่วย', 'ทำไม่ได้', 'เวลา (วินาที) ± SD'], (ut.tables.perTask || []).map((t) => [t.task, t.n, t.alone, t.help, t.fail, pm(t.meanSec, t.sdSec, 1)]));
  }
  const sv = by(['survey-raw', 'survey-summary'])[0];
  if (sv) {
    v.src_survey = sv.file;
    const pq = sv.tables.perQuestion || [];
    v.tbl_survey = mdTable(['ข้อ', 'ด้าน', 'ข้อคำถาม', 'n', 'x̄', 'SD', 'ระดับ'], pq.map((q) => [q.question, Q_TH[q.question]?.[0] || '', Q_TH[q.question]?.[1] || '', fmt(q.n, 0), fmt(q.mean), fmt(q.sd), Number.isFinite(q.mean) ? level(q.mean) : '']));
    const m = metric(sv, 'survey_mean');
    if (m) { v.survey_mean = m.text; v.survey_level = level(m.value); v.survey_mean_value = m.value; }
    if (!v.n_participants) { const n = metric(sv, 'participants_n'); if (n) v.n_participants = n.value; }
    if (!v.test_dates) v.test_dates = sv.date;
  }

  // ---------- Lab 27 / 21 / 28 ----------
  const fi = by('filters')[0];
  if (fi) { v.src_filters = fi.file; v.tbl_filters = mdTable(['ตัวกรอง', 'ลดการสั่น (%)', 'ความหน่วง (ms)'], (fi.tables.perFilter || []).map((f) => [f.filter, fmt(f.reduction, 1), fmt(f.delayMs, 0)])); }
  const rc = by('repcount')[0];
  if (rc) { v.src_rep = rc.file; const a = metric(rc, 'rep_count_acc'); if (a) v.rep_acc = a.text; }
  const se = by('sessions')[0];
  if (se) {
    v.src_sessions = se.file;
    v.tbl_games = mdTable(['เกม', 'จำนวนรอบ', 'จำนวนครั้งต่อรอบ ± SD', 'ความแม่นยำเฉลี่ย (%)'], (se.tables.perGame || []).map((g) => [g.game, g.n, pm(g.reps, g.repsSd, 1), fmt(g.accuracy, 1)]));
    const sp = metric(se, 'spread_improvement'); if (sp) v.spread_text = sp.text;
  }

  v.tbl_hypo = hypothesisTable(v, bm, fi, crit);
  return v;
}

// ---------- สรุปสมมติฐาน: ตัดสินจากตัวเลขจริงเท่านั้น ----------
function hypothesisTable(v, bm, fi, crit) {
  const miss = (lab, what) => `[[missing: กลับไป Lab ${lab} — ${what}]]`;
  const rows = [];
  rows.push(['H1 ความแม่นยำแสงสลัว < แสงปกติ', v.acc_dim && v.acc_normal ? `สลัว ${v.acc_dim}% / ปกติ ${v.acc_normal}%` : miss(32, 'ความแม่นยำตามสภาพแสง'),
    v.acc_dim && v.acc_normal ? (+v.acc_dim < +v.acc_normal ? 'สนับสนุน' : 'ไม่สนับสนุน') : '–']);
  const pmach = bm.flatMap((r) => r.tables.perMachine || []);
  const fc = +crit.fps_crit || 15;
  rows.push([`H2 FPS เฉลี่ย ≥ ${fc}`, pmach.length ? pmach.map((x) => `${x.machine} ${fmt(x.fps, 1)}`).join(', ') : miss(33, 'ผลวัดความเร็ว'),
    pmach.length ? `ผ่าน ${pmach.filter((x) => x.fps >= fc).length}/${pmach.length} เครื่อง` : '–']);
  const sc = +crit.survey_crit || 3.51;
  rows.push([`H3 ความพึงพอใจเฉลี่ย ≥ ${sc}`, v.survey_mean || miss(36, 'แบบสอบถาม'), Number.isFinite(v.survey_mean_value) ? (v.survey_mean_value >= sc ? 'สนับสนุน' : 'ไม่สนับสนุน') : '–']);
  const pf = fi?.tables.perFilter || [];
  const oe = pf.find((f) => /euro/i.test(f.filter)), ma = pf.find((f) => /moving|average|ma\b|เฉลี่ย/i.test(f.filter));
  rows.push(['H4 One Euro ลดสั่นมากกว่า และหน่วงน้อยกว่า Moving Average', oe && ma ? `OE ${fmt(oe.reduction, 1)}% / ${fmt(oe.delayMs, 0)} ms · MA ${fmt(ma.reduction, 1)}% / ${fmt(ma.delayMs, 0)} ms` : miss(27, 'ตารางเปรียบเทียบตัวกรอง'),
    oe && ma ? (oe.reduction > ma.reduction && oe.delayMs < ma.delayMs ? 'สนับสนุน' : 'สนับสนุนบางส่วน / ไม่สนับสนุน') : '–']);
  const lc = +crit.login_crit || 5;
  const t = v.face_time ? parseFloat(v.face_time) : NaN, sec = /ms/.test(v.face_time || '') ? t / 1000 : t;
  rows.push([`H5 เข้าระบบด้วยใบหน้า ≤ ${lc} วินาที`, v.face_time || miss(15, 'เวลาเข้าระบบ'), Number.isFinite(sec) ? (sec <= lc ? 'สนับสนุน' : 'ไม่สนับสนุน') : '–']);
  return mdTable(['สมมติฐาน', 'ผลที่วัดได้', 'สรุป'], rows);
}
export { mean, sd };
