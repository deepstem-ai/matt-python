// ============================================================
// csv-kit.js — อ่านไฟล์ CSV ที่ export จากแลปต่าง ๆ แล้ว "เดา" ว่าเป็นไฟล์ชนิดไหน
// จากชื่อคอลัมน์ จากนั้นคำนวณตัวเลขสำคัญ (ค่าเฉลี่ย, SD, ความแม่นยำ ...)
// ใช้ร่วมกันใน Lab 37 (แดชบอร์ดหลักฐาน), Lab 38, Lab 39 (สร้างร่างรายงาน)
// กฎเหล็ก: ตัวเลขทุกตัวมาจากไฟล์จริงเท่านั้น ถ้าอ่านไม่ได้ให้บอกว่า "ไม่พบ" ห้ามเดาค่า
// ทำงานในเบราว์เซอร์ล้วน ๆ ไม่ส่งไฟล์ไปไหน
// ============================================================

// ---------- สถิติพื้นฐาน ----------
export const mean = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : NaN);
export const sd = (a) => { if (a.length < 2) return 0; const m = mean(a); return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1)); };
export const fmt = (v, d = 2) => (Number.isFinite(v) ? (+v.toFixed(d)).toString() : '–');
const num = (v) => { const n = parseFloat(String(v ?? '').replace(/[%,\s]/g, '')); return Number.isFinite(n) ? n : NaN; };
const nums = (rows, c) => (c ? rows.map((r) => num(r[c])).filter(Number.isFinite) : []);
// ค่า 0-1 → เปอร์เซ็นต์ (ถ้าเป็นเปอร์เซ็นต์อยู่แล้วไม่แตะ)
const pct = (arr) => (arr.length && Math.max(...arr) <= 1 ? arr.map((v) => v * 100) : arr);
const truthy = (v) => /^(1|true|yes|y|pass|ok|correct|success|ถูก|ผ่าน|สำเร็จ)$/i.test(String(v).trim());

// ---------- แยก CSV (รองรับเครื่องหมายคำพูด, BOM, บรรทัดใหม่ในช่อง) ----------
export function parseCSV(text) {
  text = String(text).replace(/^﻿/, '');
  const out = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); out.push(row); row = []; cell = ''; }
    else cell += ch;
  }
  if (cell !== '' || row.length) { row.push(cell); out.push(row); }
  const lines = out.filter((r) => r.some((c) => c.trim() !== ''));
  const headers = (lines.shift() || []).map((h) => h.trim());
  const rows = lines.map((r) => Object.fromEntries(headers.map((h, i) => [h, (r[i] ?? '').trim()])));
  return { headers, rows };
}

// หาคอลัมน์แรกที่ชื่อตรงกับรูปแบบใดรูปแบบหนึ่ง (ไม่สนตัวพิมพ์เล็ก/ใหญ่)
export function col(headers, ...patterns) {
  for (const p of patterns) { const h = headers.find((x) => p.test(x)); if (h) return h; }
  return null;
}

// หาวันที่วัดจริงจากคอลัมน์วันที่ในไฟล์ (ถ้าไม่มีใช้วันแก้ไขไฟล์ แล้วบอกว่าเป็นค่าประมาณ)
function measuredDate(parsed, file) {
  const c = col(parsed.headers, /^date$/i, /start.?time|created|timestamp|measured|^time$/i);
  const ds = c ? parsed.rows.map((r) => { const v = r[c]; const n = Number(v); const d = new Date(Number.isFinite(n) && n > 1e11 ? n : v); return isNaN(d) ? null : d; }).filter(Boolean) : [];
  if (ds.length) {
    const min = new Date(Math.min(...ds)), max = new Date(Math.max(...ds));
    const k = (d) => d.toISOString().slice(0, 10);
    return k(min) === k(max) ? k(min) : `${k(min)} ถึง ${k(max)}`;
  }
  return file?.lastModified ? new Date(file.lastModified).toISOString().slice(0, 10) + ' (วันแก้ไขไฟล์)' : '–';
}

// ---------- เดาชนิดไฟล์จากหัวคอลัมน์ ----------
export const KINDS = {
  'survey-raw': 'แบบสอบถามรายคน (Lab 36)',
  'survey-summary': 'สรุปแบบสอบถามรายข้อ (Lab 36)',
  'usertask': 'ผลการทำงานของผู้ทดสอบ (Lab 36)',
  'evaluation': 'ผลทดสอบความแม่นยำท่ามือ (Lab 32)',
  'evaluation-summary': 'สรุปความแม่นยำตามแสง (Lab 32)',
  'benchmark': 'ผลวัดความเร็วเครื่อง (Lab 33)',
  'sessions': 'ประวัติการฝึก (Lab 28)',
  'filters': 'เปรียบเทียบตัวกรองสัญญาณ (Lab 27)',
  'facelogin': 'ทดสอบเข้าระบบด้วยใบหน้า (Lab 15)',
  'repcount': 'ทดสอบการนับครั้ง (Lab 21)',
  'unknown': 'ไม่รู้จักรูปแบบ',
};
export function detectKind(headers, name = '') {
  const H = headers.join('|').toLowerCase(), N = name.toLowerCase();
  const has = (re) => re.test(H);
  if (headers.filter((h) => /^q\d+$/i.test(h)).length >= 3) return 'survey-raw';
  if (has(/question/) && has(/mean/)) return 'survey-summary';
  if (has(/participant/) && has(/task/) && has(/outcome/)) return 'usertask';
  if (has(/request|expect|target|truth|label/) && has(/detect|predict|result|output/) && !has(/count/)) return 'evaluation';
  if (has(/accura/) && has(/light|condition|แสง/)) return 'evaluation-summary';
  if (has(/fps/)) return 'benchmark';
  if (has(/filter/) && has(/jitter|reduc|shake|สั่น/)) return 'filters';
  if (has(/counted|system.?count|detected.?reps/) && has(/actual|expected|manual|true/)) return 'repcount';
  if ((has(/face|login/) || /face|login/.test(N)) && has(/correct|success|match|pass|result|seconds|method/)) return 'facelogin'; // Lab 15 login-log.csv มี method, seconds
  if (has(/game/) && has(/reps|score/)) return 'sessions';
  return 'unknown';
}

// ---------- วิเคราะห์ตามชนิด คืน { kind, label, date, metrics[], tables{} } ----------
// metric = { key, label, value (ตัวเลข), text (ข้อความแสดง), unit }
// ไฟล์ชื่อขึ้นต้น DEMO- = ไฟล์ตัวอย่าง: วิเคราะห์ได้ (ไว้ลองระบบ) แต่ห้ามนับเป็นหลักฐานจริง
export function analyze(text, file = {}) {
  const parsed = parseCSV(text);
  parsed.isDemoFile = /^DEMO-/i.test(file.name || '');
  const kind = detectKind(parsed.headers, file.name || '');
  const res = { file: file.name || 'ไฟล์', kind, label: KINDS[kind], date: measuredDate(parsed, file), rows: parsed.rows.length, headers: parsed.headers, metrics: [], tables: {}, demo: parsed.isDemoFile };
  const fn = ANALYZERS[kind];
  if (fn) fn(parsed, res);
  return res;
}
const M = (res, key, label, value, unit = '', text) => res.metrics.push({ key, label, value, unit, text: text ?? `${fmt(value)}${unit ? ' ' + unit : ''}` });

const ANALYZERS = {
  'survey-raw'({ headers, rows, isDemoFile }, res) {
    const demo = isDemoFile ? null : col(headers, /^demo$/i);
    const real = demo ? rows.filter((r) => !truthy(r[demo])) : rows;
    if (demo && real.length < rows.length) res.warning = `ตัดข้อมูลตัวอย่าง (DEMO) ออก ${rows.length - real.length} แถว`;
    const qs = headers.filter((h) => /^q\d+$/i.test(h));
    const per = qs.map((q) => { const v = nums(real, q); return { question: q, n: v.length, mean: mean(v), sd: sd(v) }; });
    const all = qs.flatMap((q) => nums(real, q));
    res.tables.perQuestion = per;
    M(res, 'participants_n', 'จำนวนผู้ตอบแบบสอบถาม', real.length, 'คน');
    if (all.length) M(res, 'survey_mean', 'ค่าเฉลี่ยความพึงพอใจรวม (1–5)', mean(all), '', `${fmt(mean(all))} ± ${fmt(sd(all))}`);
  },
  'survey-summary'({ headers, rows }, res) {
    const q = col(headers, /question/i), m = col(headers, /mean/i), s = col(headers, /^sd$|std/i), n = col(headers, /^n$/i);
    res.tables.perQuestion = rows.map((r) => ({ question: r[q], n: num(r[n]), mean: num(r[m]), sd: num(r[s]) }));
    const means = nums(rows, m);
    if (means.length) M(res, 'survey_mean', 'ค่าเฉลี่ยความพึงพอใจรวม (เฉลี่ยของค่าเฉลี่ยรายข้อ)', mean(means));
    const ns = nums(rows, n); if (ns.length) M(res, 'participants_n', 'จำนวนผู้ตอบแบบสอบถาม', Math.max(...ns), 'คน');
  },
  usertask({ headers, rows, isDemoFile }, res) {
    const demo = isDemoFile ? null : col(headers, /^demo$/i);
    const real = demo ? rows.filter((r) => !truthy(r[demo])) : rows;
    const p = col(headers, /participant/i), t = col(headers, /^task$/i), o = col(headers, /outcome/i), s = col(headers, /second|time/i);
    const tasks = [...new Set(real.map((r) => r[t]))];
    res.tables.perTask = tasks.map((k) => {
      const rr = real.filter((r) => r[t] === k), secs = nums(rr, s);
      return { task: k, n: rr.length, alone: rr.filter((r) => r[o] === 'alone').length, help: rr.filter((r) => r[o] === 'help').length, fail: rr.filter((r) => r[o] === 'fail').length, meanSec: mean(secs), sdSec: sd(secs) };
    });
    const done = real.filter((r) => r[o]);
    M(res, 'test_participants', 'จำนวนผู้ทดสอบใช้งานจริง', new Set(real.map((r) => r[p])).size, 'คน');
    if (done.length) M(res, 'task_success_pct', 'อัตราทำงานสำเร็จด้วยตนเอง', (done.filter((r) => r[o] === 'alone').length / done.length) * 100, '%');
  },
  evaluation({ headers, rows }, res) {
    const req = col(headers, /request|expect|target|truth|^label$/i), det = col(headers, /detect|predict|result|output/i);
    const light = col(headers, /light|condition|แสง/i), bri = col(headers, /bright|lux|ความสว่าง/i);
    const labels = [...new Set(rows.flatMap((r) => [r[req], r[det]]).filter(Boolean))];
    const acc = (rr) => (rr.length ? (rr.filter((r) => r[req] === r[det]).length / rr.length) * 100 : NaN);
    M(res, 'gesture_acc', 'ความแม่นยำการจำแนกท่ามือรวม', acc(rows), '%', `${fmt(acc(rows), 1)} % (n = ${rows.length})`);
    // precision / recall / F1 รายท่า
    res.tables.perGesture = labels.filter((g) => rows.some((r) => r[req] === g)).map((g) => {
      const tp = rows.filter((r) => r[req] === g && r[det] === g).length;
      const fp = rows.filter((r) => r[req] !== g && r[det] === g).length;
      const fn = rows.filter((r) => r[req] === g && r[det] !== g).length;
      const P = tp + fp ? tp / (tp + fp) : NaN, R = tp + fn ? tp / (tp + fn) : NaN;
      return { gesture: g, n: tp + fn, precision: P, recall: R, f1: P + R ? (2 * P * R) / (P + R) : NaN };
    });
    // ตารางความสับสน: แถว = ท่าที่ขอ, คอลัมน์ = ท่าที่ระบบตรวจได้
    res.tables.confusion = { labels, matrix: labels.map((a) => labels.map((b) => rows.filter((r) => r[req] === a && r[det] === b).length)) };
    if (light) {
      const conds = [...new Set(rows.map((r) => r[light]).filter(Boolean))];
      res.tables.perLighting = conds.map((c) => { const rr = rows.filter((r) => r[light] === c); return { lighting: c, n: rr.length, accuracy: acc(rr), brightness: mean(nums(rr, bri)) }; });
      res.tables.perLighting.forEach((x) => M(res, 'gesture_acc_' + lightKey(x.lighting), `ความแม่นยำท่ามือ แสง${lightTh(x.lighting)}`, x.accuracy, '%', `${fmt(x.accuracy, 1)} % (n = ${x.n}${Number.isFinite(x.brightness) ? `, ความสว่างเฉลี่ย ${fmt(x.brightness, 0)}` : ''})`));
    }
  },
  'evaluation-summary'({ headers, rows }, res) {
    const light = col(headers, /light|condition|แสง/i), a = col(headers, /accura/i), bri = col(headers, /bright|lux/i), n = col(headers, /^n$|count|trials/i);
    const accs = pct(nums(rows, a));
    res.tables.perLighting = rows.map((r, i) => ({ lighting: r[light], n: num(r[n]), accuracy: accs[i], brightness: num(r[bri]) }));
    res.tables.perLighting.forEach((x) => M(res, 'gesture_acc_' + lightKey(x.lighting), `ความแม่นยำท่ามือ แสง${lightTh(x.lighting)}`, x.accuracy, '%'));
  },
  benchmark({ headers, rows }, res) {
    const mc = col(headers, /machine|device|computer|เครื่อง|^name$/i), sc = col(headers, /scenario|test|mode|สถานการณ์/i);
    const fps = col(headers, /avg.?fps|fps.?avg|mean.?fps|^fps$/i, /fps/i), minf = col(headers, /min.?fps|fps.?min/i);
    const ai = col(headers, /ai.?ms|inference|process|detect.?ms|^ms$/i);
    const machines = mc ? [...new Set(rows.map((r) => r[mc]))] : ['เครื่องนี้'];
    res.tables.perMachine = machines.map((m) => {
      const rr = mc ? rows.filter((r) => r[mc] === m) : rows;
      const f = nums(rr, fps), a = nums(rr, ai), mn = nums(rr, minf);
      return { machine: m, n: rr.length, fps: mean(f), fpsSd: sd(f), minFps: mn.length ? Math.min(...mn) : NaN, aiMs: mean(a), aiSd: sd(a) };
    });
    if (sc) res.tables.perScenario = [...new Set(rows.map((r) => r[sc]))].map((s) => ({ scenario: s, ...Object.fromEntries(machines.map((m) => [m, mean(nums(rows.filter((r) => r[sc] === s && (!mc || r[mc] === m)), fps))])) }));
    res.tables.perMachine.forEach((x) => M(res, 'fps_machine', `FPS เฉลี่ย · ${x.machine}`, x.fps, 'FPS', `${fmt(x.fps, 1)} ± ${fmt(x.fpsSd, 1)} FPS`));
    const allAi = nums(rows, ai);
    if (allAi.length) M(res, 'ai_ms', 'เวลาประมวลผล AI ต่อเฟรม (ทุกเครื่อง)', mean(allAi), 'ms', `${fmt(mean(allAi), 1)} ± ${fmt(sd(allAi), 1)} ms`);
  },
  sessions({ headers, rows }, res) {
    const g = col(headers, /^game$/i, /game/i), reps = col(headers, /^reps$/i, /reps/i), acc = col(headers, /accura/i), spread = col(headers, /spread/i), st = col(headers, /start/i, /date/i);
    const games = [...new Set(rows.map((r) => r[g]))];
    res.tables.perGame = games.map((k) => { const rr = rows.filter((r) => r[g] === k); const a = pct(nums(rr, acc)); return { game: k, n: rr.length, reps: mean(nums(rr, reps)), repsSd: sd(nums(rr, reps)), accuracy: mean(a) }; });
    M(res, 'sessions_n', 'จำนวนรอบการฝึกที่บันทึก', rows.length, 'รอบ');
    if (spread) {
      const t = (r) => { const v = r[st]; const n = Number(v); return Number.isFinite(n) && n > 1e11 ? n : Date.parse(v) || 0; };
      const sp = rows.filter((r) => Number.isFinite(num(r[spread])) && num(r[spread]) > 0).sort((a, b) => t(a) - t(b));
      if (sp.length >= 2) { const first = num(sp[0][spread]), best = Math.max(...sp.map((r) => num(r[spread]))); M(res, 'spread_improvement', 'การกางนิ้วสูงสุดเพิ่มขึ้น (ครั้งแรก → ดีที่สุด)', best - first, 'องศา', `${fmt(first, 1)}° → ${fmt(best, 1)}° (+${fmt(best - first, 1)}°)`); }
    }
  },
  filters({ headers, rows }, res) {
    const f = col(headers, /filter/i), j = col(headers, /reduc|ลด/i, /jitter|shake|สั่น/i), d = col(headers, /delay|lag|latency/i);
    res.tables.perFilter = rows.map((r) => ({ filter: r[f], reduction: num(r[j]), delayMs: num(r[d]) }));
    res.tables.perFilter.filter((x) => Number.isFinite(x.reduction)).forEach((x) => M(res, 'jitter_reduction', `ลดการสั่น · ${x.filter}`, x.reduction, '%', `${fmt(x.reduction, 1)} %${Number.isFinite(x.delayMs) ? ` · หน่วง ${fmt(x.delayMs, 0)} ms` : ''}`));
  },
  facelogin({ headers, rows }, res) { // rows ถูกกรองเหลือเฉพาะการเข้าด้วยใบหน้า (ถ้ามีคอลัมน์ method)
    const c = col(headers, /correct|success|match|pass|result/i), t = col(headers, /^seconds?$/i, /ms|second|เวลา/i, /time/i);
    const m = col(headers, /method/i);
    if (m) { const face = rows.filter((r) => /face|หน้า/i.test(r[m])); res.warning = `เข้าด้วยใบหน้า ${face.length} ครั้ง จาก ${rows.length} ครั้ง (ที่เหลือใช้ PIN หรืออื่น ๆ)`; if (face.length) rows = face; }
    if (c) { const ok = rows.filter((r) => truthy(r[c])).length; M(res, 'face_login_acc', 'ความถูกต้องการเข้าระบบด้วยใบหน้า', (ok / rows.length) * 100, '%', `${fmt((ok / rows.length) * 100, 1)} % (${ok}/${rows.length})`); }
    const tt = nums(rows, t); if (tt.length) M(res, 'face_login_time', 'เวลาเข้าระบบเฉลี่ย', mean(tt), /ms/i.test(t) ? 'ms' : 'วินาที', `${fmt(mean(tt), 1)} ± ${fmt(sd(tt), 1)} ${/ms/i.test(t) ? 'ms' : 'วินาที'}`);
  },
  repcount({ headers, rows }, res) {
    const c = col(headers, /counted|system.?count|detected.?reps/i), a = col(headers, /actual|expected|manual|true/i);
    const errs = rows.map((r) => [num(r[c]), num(r[a])]).filter(([x, y]) => Number.isFinite(x) && y > 0).map(([x, y]) => Math.abs(x - y) / y);
    if (errs.length) M(res, 'rep_count_acc', 'ความแม่นยำการนับครั้ง (1 − ความคลาดเคลื่อนสัมพัทธ์เฉลี่ย)', (1 - mean(errs)) * 100, '%', `${fmt((1 - mean(errs)) * 100, 1)} % (${errs.length} ชุด)`);
  },
};
// ชื่อสภาพแสงภาษาไทย
export const lightTh = (s) => ({ bright: 'สว่าง', normal: 'ปกติ', dim: 'สลัว' }[lightKey(s)] || s);
// แปลงชื่อสภาพแสงเป็นคีย์มาตรฐาน bright / normal / dim
export function lightKey(s) {
  s = String(s).toLowerCase();
  if (/bright|สว่าง|high/.test(s)) return 'bright';
  if (/dim|dark|มืด|สลัว|low/.test(s)) return 'dim';
  if (/normal|ปกติ|medium|mid/.test(s)) return 'normal';
  return s.replace(/\W+/g, '_');
}

// ---------- รายการตัวเลขสำคัญ (แถวของ evidence/SUMMARY.md) ----------
// lab = กลับไปวัดที่แลปไหนถ้าไม่มีข้อมูล
export const SUMMARY_KEYS = [
  { key: 'fps_machine', th: 'FPS เฉลี่ยของแต่ละเครื่อง', lab: 33, file: 'lab33-benchmark.csv' },
  { key: 'ai_ms', th: 'เวลาประมวลผล AI ต่อเฟรม (ms)', lab: 33, file: 'lab33-benchmark.csv' },
  { key: 'face_login_acc', th: 'ความถูกต้องการเข้าระบบด้วยใบหน้า (%)', lab: 15, file: 'lab15-face-login.csv' },
  { key: 'face_login_time', th: 'เวลาเข้าระบบด้วยใบหน้าเฉลี่ย', lab: 15, file: 'lab15-face-login.csv' },
  { key: 'gesture_acc', th: 'ความแม่นยำท่ามือรวม (%)', lab: 32, file: 'lab32-evaluation.csv' },
  { key: 'gesture_acc_bright', th: 'ความแม่นยำท่ามือ แสงสว่าง (%)', lab: 32, file: 'lab32-evaluation.csv' },
  { key: 'gesture_acc_normal', th: 'ความแม่นยำท่ามือ แสงปกติ (%)', lab: 32, file: 'lab32-evaluation.csv' },
  { key: 'gesture_acc_dim', th: 'ความแม่นยำท่ามือ แสงสลัว (%)', lab: 32, file: 'lab32-evaluation.csv' },
  { key: 'rep_count_acc', th: 'ความแม่นยำการนับครั้ง (%)', lab: 21, file: 'lab21-rep-test.csv' },
  { key: 'jitter_reduction', th: 'การลดการสั่นของตัวกรอง (%)', lab: 27, file: 'lab27-filters.csv' },
  { key: 'spread_improvement', th: 'การกางนิ้วสูงสุดที่เพิ่มขึ้น (องศา)', lab: 25, file: 'lab28-sessions.csv' },
  { key: 'sessions_n', th: 'จำนวนรอบการฝึกที่บันทึก', lab: 28, file: 'lab28-sessions.csv' },
  { key: 'test_participants', th: 'จำนวนผู้ทดสอบใช้งานจริง (คน)', lab: 36, file: 'lab36-task-results.csv' },
  { key: 'task_success_pct', th: 'อัตราทำงานสำเร็จด้วยตนเอง (%)', lab: 36, file: 'lab36-task-results.csv' },
  { key: 'participants_n', th: 'จำนวนผู้ตอบแบบสอบถาม (คน)', lab: 36, file: 'lab36-survey-responses.csv' },
  { key: 'survey_mean', th: 'ค่าเฉลี่ยความพึงพอใจ (1–5) ± SD', lab: 36, file: 'lab36-survey-responses.csv' },
];

// รวมผลหลายไฟล์ → แถวตาราง SUMMARY.md (ไม่มีข้อมูล = เว้นว่างพร้อมบอกแลปที่ต้องกลับไปวัด)
export function summaryRows(results) {
  const all = results.flatMap((r) => r.metrics.map((m) => ({ ...m, file: r.file, date: r.date })));
  return SUMMARY_KEYS.flatMap((k) => {
    const found = all.filter((m) => m.key === k.key);
    if (!found.length) return [{ th: k.th, value: '', file: '', date: '', missing: `ยังไม่มี — กลับไป Lab ${String(k.lab).padStart(2, '0')} แล้ว export ${k.file}` }];
    return found.map((m) => ({ th: found.length > 1 ? m.label : k.th, value: m.text, file: m.file, date: m.date, missing: '' }));
  });
}
export function summaryMarkdown(rows) {
  const e = (s) => String(s ?? '').replace(/\|/g, '\\|');
  return ['| ตัวชี้วัด | ค่า | ไฟล์ที่มา | วันที่วัด | หมายเหตุ |', '|---|---|---|---|---|',
    ...rows.map((r) => `| ${e(r.th)} | ${e(r.value)} | ${e(r.file)} | ${e(r.date)} | ${e(r.missing)} |`)].join('\n');
}
