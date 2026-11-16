// ============================================================
// research-panel.js — โหมดวิจัย
//
// แสดงสี่อย่างในแผงเดียว
//   1. ท่อประมวลผล  เข้า → ประมวลผล → ออก  พร้อมสมการและค่าสดของเฟรมล่าสุด
//   2. โมเดลและพารามิเตอร์ที่ใช้อยู่จริงตอนนี้
//   3. ตัวเก็บข้อมูลสำหรับงานวิจัย กดบันทึกแล้วส่งออกเป็น CSV
//   4. เอกสารอ้างอิงที่สมการแต่ละตัวมาจาก
//
// ค่าสดมาจาก research-bus.js ซึ่งสมการเป็นคนประกาศออกมาเอง
// แผงนี้ไม่คำนวณอะไรซ้ำ จึงไม่มีทางแสดงเลขคนละตัวกับที่ระบบใช้จริง
// ============================================================
import { subscribe, setActive } from './research-bus.js';

const L = () => (document.documentElement.lang === 'en' ? 'en' : 'th');
const t = (th, en) => (L() === 'en' ? en : th);

const REFS = [
  {
    key: '(1)(2)(3)',
    th: 'จุดสังเกตมือ 21 จุด และการแก้สัดส่วนภาพ',
    en: '21 hand landmarks and aspect correction',
    cite: 'F. Zhang et al., "MediaPipe Hands: On-device real-time hand tracking," arXiv:1906.08172, 2020.',
    url: 'https://arxiv.org/abs/1906.08172',
  },
  {
    key: '(5)',
    th: 'ตัวกรองหนึ่งยูโร ปรับความแรงตามความเร็วของสัญญาณ',
    en: 'The 1€ filter, which adapts its strength to signal speed',
    cite: 'G. Casiez, N. Roussel, and D. Vogel, "1€ filter: a simple speed-based low-pass filter for noisy input in interactive systems," in Proc. CHI ’12, 2012, pp. 2527–2530.',
    url: 'https://doi.org/10.1145/2207676.2208639',
  },
  {
    key: '(6)(7)',
    th: 'การใช้สองเกณฑ์กันการสั่นรอบจุดตัด',
    en: 'Two thresholds to stop chatter around a single cut-off',
    cite: 'O. H. Schmitt, "A thermionic trigger," J. Sci. Instrum., vol. 15, no. 1, pp. 24–26, 1938.',
    url: 'https://doi.org/10.1088/0950-7671/15/1/305',
  },
];

const EQS = [
  { n: '(1)', th: 'แก้สัดส่วนภาพ', en: 'Aspect correction', f: "x′ = x·(W/H)", get: (s) => s.aspect },
  { n: '(3)', th: 'ค่าที่วัด หารด้วยขนาดฝ่ามือ', en: 'Measure, divided by palm size', f: "m = d(p₄,p₈) / d(p₀,p₉)", get: (s) => s.m },
  { n: '(4)', th: 'คะแนนจากจุดอ้างอิงของผู้ใช้', en: 'Score from the user’s anchors', f: "π = clip((r − m)/(r − b), 0, 1)", get: (s) => s.pi },
  { n: '(6)', th: 'เกณฑ์เข้าและออก', en: 'Entry and exit thresholds', f: "T = r − k(r − b)", get: (s) => s.entry },
  { n: '(7)', th: 'เงื่อนไขนับหนึ่งครั้ง', en: 'Condition for counting one repetition', f: "π ≥ θ_on → hold → π ≤ θ_off", get: (s) => s.state },
];

const state = {
  m: null, pi: null, rest: null, best: null, entry: null, exit: null,
  stateName: '—', count: 0, scale: null, aspect: null, fps: 0, lastT: 0, frames: 0,
};

let rows = [];          // แถวข้อมูลที่กำลังบันทึก
let recording = false;
let label = '';
// ข้อมูลกำกับการทดลอง  งานวิจัยต้องตามรอยกลับได้ว่าแถวนี้มาจากใคร เงื่อนไขอะไร
const meta = { participant: '', condition: '', session: '', notes: '' };
let startedAt = null;
let unsub = null;
let panel = null;
let raf = 0;

// ---------- เก็บค่าสดจากท่อ ----------
function onBus(stage, d) {
  if (stage === 'measure') { state.m = d.value; state.scale = d.scale; }
  else if (stage === 'score') {
    state.m = d.m; state.pi = d.pi; state.rest = d.rest; state.best = d.best;
    state.entry = d.entry; state.exit = d.exit;
  } else if (stage === 'rep') {
    state.stateName = d.to; state.count = d.count;
    state.entryK = d.enter; state.exitK = d.exit;
    state.minHoldMs = d.minHoldMs; state.cooldownMs = d.cooldownMs;
    if (recording && d.counted) markRep(d);
  }
  state.frames++;
  const now = performance.now();
  if (now - state.lastT > 500) {
    state.fps = Math.round((state.frames * 1000) / (now - state.lastT));
    state.frames = 0; state.lastT = now;
  }
  if (recording) rows.push(snapshot(false));
}

function snapshot(isRep) {
  return {
    t_ms: Math.round(performance.now()),
    participant: meta.participant,
    condition: meta.condition,
    session: meta.session,
    label,
    m: num(state.m, 4), pi: num(state.pi, 4),
    rest: num(state.rest, 4), best: num(state.best, 4),
    entry: num(state.entry, 4), exit: num(state.exit, 4),
    palm_scale: num(state.scale, 4),
    rep_state: state.stateName === '\u2014' ? '' : state.stateName, rep_count: state.count,
    counted_here: isRep ? 1 : 0,
    page: location.pathname.split('/').pop(),
  };
}

function markRep(d) { rows.push(snapshot(true)); }

const fmt = (v, n = 3) => (typeof v === 'number' && isFinite(v) ? v.toFixed(n) : '—');

// ---------- หน้าจอ ----------
function css() {
  return `
  #hrResearch{position:fixed;inset:0 0 0 auto;width:min(430px,100%);z-index:2147482000;
    background:#0b1020f2;color:#eef2ff;backdrop-filter:blur(10px);
    border-left:1px solid #2b3658;box-shadow:-14px 0 40px #0008;
    display:flex;flex-direction:column;
    font:14px/1.6 system-ui,-apple-system,"Noto Sans Thai",sans-serif;
    transform:translateX(100%);transition:transform .22s ease}
  #hrResearch.open{transform:none}
  body.light #hrResearch{background:#ffffffF2;color:#17203a;border-left-color:#d7dcea;box-shadow:-14px 0 40px #0002}
  #hrResearch header{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid #2b3658}
  body.light #hrResearch header{border-bottom-color:#e3e7f2}
  #hrResearch h2{margin:0;font-size:16px;flex:1}
  #hrResearch .x{background:none;border:0;color:inherit;font-size:22px;cursor:pointer;line-height:1;padding:0 4px}
  #hrResearch nav{display:flex;gap:4px;padding:10px 12px 0;flex-wrap:wrap}
  #hrResearch nav button{flex:1;min-width:84px;padding:8px 6px;border-radius:9px 9px 0 0;border:1px solid transparent;
    border-bottom:0;background:transparent;color:inherit;cursor:pointer;font-size:13px;opacity:.65}
  #hrResearch nav button.on{background:#182341;border-color:#2b3658;opacity:1;font-weight:600}
  body.light #hrResearch nav button.on{background:#eef1fa;border-color:#d7dcea}
  #hrResearch .body{flex:1;overflow:auto;padding:14px 16px 24px}
  #hrResearch .flow{display:grid;gap:8px}
  #hrResearch .step{border:1px solid #2b3658;border-radius:11px;padding:10px 12px;background:#121a33}
  body.light #hrResearch .step{background:#f6f8fd;border-color:#e3e7f2}
  #hrResearch .step h3{margin:0 0 4px;font-size:12px;letter-spacing:.4px;text-transform:uppercase;opacity:.65}
  #hrResearch .big{font:600 20px/1.3 ui-monospace,Consolas,monospace}
  #hrResearch .arrow{text-align:center;opacity:.45;font-size:16px;margin:-2px 0}
  #hrResearch table{width:100%;border-collapse:collapse;font-size:13px}
  #hrResearch td,#hrResearch th{padding:6px 4px;border-bottom:1px solid #222c4d;text-align:left;vertical-align:top}
  body.light #hrResearch td,body.light #hrResearch th{border-bottom-color:#e8ebf4}
  #hrResearch .eq{font-family:ui-monospace,Consolas,monospace;font-size:12.5px}
  #hrResearch .val{font-family:ui-monospace,Consolas,monospace;text-align:right;white-space:nowrap}
  #hrResearch .tag{display:inline-block;font-size:11px;padding:2px 7px;border-radius:999px;
    background:#5eead42a;color:#5eead4;margin-right:6px}
  body.light #hrResearch .tag{background:#0d9c7f22;color:#0a7a63}
  #hrResearch .btn{display:inline-block;padding:9px 14px;border-radius:10px;border:1px solid #3a4costly;
    background:#5eead4;color:#06281f;font-weight:600;cursor:pointer;border:0;font-size:14px}
  #hrResearch .btn.ghost{background:transparent;border:1px solid #3a4670;color:inherit}
  #hrResearch .btn[disabled]{opacity:.45;cursor:default}
  #hrResearch .rec{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:10px 0}
  #hrResearch input[type=text]{flex:1;min-width:140px;padding:9px 11px;border-radius:9px;
    border:1px solid #3a4670;background:#0d1328;color:inherit;font-size:14px}
  body.light #hrResearch input[type=text]{background:#fff;border-color:#cdd4e6}
  #hrResearch .note.warnish{border-left:3px solid #f87171;padding-left:10px}
  #hrResearch .note{font-size:12.5px;opacity:.7;margin:10px 0 0}
  #hrResearch a{color:#5eead4}
  body.light #hrResearch a{color:#0a7a63}
  #hrResearch .dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#f87171;margin-right:6px}
  `.replace('#3a4costly', '#3a4670');
}

function el(html) {
  const d = document.createElement('div');
  d.innerHTML = html.trim();
  return d.firstElementChild;
}

function tabPipeline() {
  const s = state;
  const row = (e) => {
    let v = e.get(s);
    if (typeof v === 'number') v = v.toFixed(e.n === '(4)' ? 3 : 4);
    return `<tr><td><span class="tag">${e.n}</span>${t(e.th, e.en)}<br><span class="eq">${e.f}</span></td>
            <td class="val">${v == null ? '—' : v}</td></tr>`;
  };
  return `
  <div class="flow">
    <div class="step"><h3>${t('เข้า', 'Input')}</h3>
      <div>${t('ภาพจากกล้อง 1 เฟรม → จุดสังเกตมือ 21 จุด', 'One camera frame → 21 hand landmarks')}</div>
      <div class="big">${s.scale == null ? '—' : 'palm d(p₀,p₉) = ' + fmt(s.scale, 4)}</div></div>
    <div class="arrow">▼</div>
    <div class="step"><h3>${t('ประมวลผล', 'Process')}</h3>
      <table>${EQS.map(row).join('')}</table></div>
    <div class="arrow">▼</div>
    <div class="step"><h3>${t('ออก', 'Output')}</h3>
      <table>
        <tr><td>${t('คะแนนตอนนี้ π', 'Current score π')}</td><td class="val">${fmt(s.pi, 3)}</td></tr>
        <tr><td>${t('สถานะตัวนับ', 'Counter state')}</td><td class="val">${s.stateName}</td></tr>
        <tr><td>${t('นับได้แล้ว', 'Repetitions counted')}</td><td class="val">${s.count}</td></tr>
        <tr><td>${t('อัตราการอัปเดต', 'Update rate')}</td><td class="val">${s.fps} /s</td></tr>
      </table></div>
  </div>
  <p class="note">${t(
    'ตัวเลขทั้งหมดนี้คือค่าที่ระบบใช้จริงในเฟรมล่าสุด ไม่ได้คำนวณซ้ำเพื่อแสดงผล ถ้าหน้านี้ยังว่าง แปลว่าหน้าที่เปิดอยู่ยังไม่ได้เริ่มจับมือ',
    'These are the values the system actually used on the latest frame, not recomputed for display. If this stays empty, the current page has not started tracking a hand yet.')}</p>`;
}

function tabModel() {
  const s = state;
  const r = (k, v) => `<tr><td>${k}</td><td class="val">${v}</td></tr>`;
  return `<table>
    ${r(t('โมเดลจุดสังเกตมือ', 'Hand landmark model'), 'MediaPipe Hands')}
    ${r(t('จำนวนจุด', 'Landmarks'), '21')}
    ${r(t('ที่ประมวลผล', 'Runs on'), t('ในเบราว์เซอร์ ไม่ส่งภาพออก', 'In the browser, no image leaves the device'))}
    ${r(t('จุดพัก r', 'Rest anchor r'), fmt(s.rest, 3))}
    ${r(t('จุดจีบสุด b', 'Best anchor b'), fmt(s.best, 3))}
    ${r('k_on / k_off', (s.entryK ?? 0.7) + ' / ' + (s.exitK ?? 0.3))}
    ${r(t('เกณฑ์ในหน่วยค่าดิบ', 'Thresholds in raw units'), fmt(s.entry, 3) + ' / ' + fmt(s.exit, 3))}
    ${r(t('ค้างอย่างน้อย', 'Minimum hold'), (s.minHoldMs ?? 80) + ' ms')}
    ${r(t('พักก่อนนับใหม่', 'Cooldown'), (s.cooldownMs ?? 400) + ' ms')}
  </table>
  <p class="note">${t(
    'ค่าจุดอ้างอิง r และ b มาจากการปรับเทียบของผู้ใช้คนนี้ ถ้ายังไม่ปรับเทียบ ระบบใช้ค่าตั้งต้น 0.80 และ 0.25',
    'The anchors r and b come from this user’s calibration. Without calibration the system uses the defaults 0.80 and 0.25.')}</p>`;
}

function tabData() {
  const f = (id, k, ph) => `<label style="display:block;margin-bottom:8px">
      <span style="font-size:12.5px;opacity:.75;display:block;margin-bottom:3px">${ph}</span>
      <input type="text" id="${id}" data-meta="${k}" value="${String(meta[k]).replace(/"/g, '&quot;')}"
             style="width:100%" ${recording ? 'disabled' : ''}></label>`;
  return `
  <div class="step" style="margin-bottom:12px">
    <h3>${t('ข้อมูลกำกับการทดลอง', 'Trial metadata')}</h3>
    ${f('hrPid', 'participant', t('รหัสผู้เข้าร่วม เช่น P01', 'Participant ID, e.g. P01'))}
    ${f('hrCond', 'condition', t('เงื่อนไข เช่น แสงปกติ มือขวา', 'Condition, e.g. normal light, right hand'))}
    ${f('hrSess', 'session', t('ครั้งที่ เช่น 1', 'Session number, e.g. 1'))}
    ${f('hrNote', 'notes', t('หมายเหตุ ถ้ามี', 'Notes, if any'))}
    <p class="note" style="margin-top:4px">${t(
      'กรอกก่อนกดเริ่มบันทึก ค่าเหล่านี้จะติดไปกับทุกแถวในไฟล์ CSV ทำให้ตามรอยกลับได้ว่าข้อมูลมาจากใครและเงื่อนไขอะไร แก้ระหว่างบันทึกไม่ได้ เพื่อกันข้อมูลชุดเดียวมีป้ายสองแบบ',
      'Fill these in before you start. They are attached to every row of the CSV so each row can be traced to a person and a condition. They lock while recording so one set cannot carry two labels.')}</p>
  </div>

  <div class="rec">
    <button class="btn" id="hrRec">${recording ? t('\u25a0 หยุดบันทึก', '\u25a0 Stop recording') : t('\u25cf เริ่มบันทึก', '\u25cf Start recording')}</button>
    <button class="btn ghost" id="hrCsv" ${rows.length ? '' : 'disabled'}>${t('\u2b07 ส่งออก CSV', '\u2b07 Export CSV')}</button>
    <button class="btn ghost" id="hrClear" ${rows.length && !recording ? '' : 'disabled'}>${t('ล้าง', 'Clear')}</button>
  </div>

  <table>
    <tr><td>${recording ? '<span class="dot"></span>' + t('กำลังบันทึก', 'Recording') : t('สถานะ', 'Status')}</td>
        <td class="val">${recording ? t('เปิด', 'on') : t('ปิด', 'off')}</td></tr>
    <tr><td>${t('เริ่มเมื่อ', 'Started')}</td><td class="val">${startedAt || '\u2014'}</td></tr>
    <tr><td>${t('แถวที่เก็บได้', 'Rows captured')}</td><td class="val">${rows.length}</td></tr>
    <tr><td>${t('ครั้งที่นับได้ในชุดนี้', 'Repetitions in this set')}</td>
        <td class="val">${rows.filter((r) => r.counted_here === 1).length}</td></tr>
    <tr><td>${t('ผู้เข้าร่วมในไฟล์', 'Participants in file')}</td>
        <td class="val">${new Set(rows.map((r) => r.participant).filter(Boolean)).size || '\u2014'}</td></tr>
  </table>

  <p class="note">${t(
    'บันทึกหนึ่งแถวต่อหนึ่งเฟรม เก็บค่า m, \u03c0, จุดอ้างอิง, เกณฑ์, สถานะตัวนับ และธงว่าเฟรมนั้นนับครบหนึ่งครั้งหรือไม่',
    'One row per frame: m, \u03c0, the anchors, the thresholds, the counter state, and a flag for whether that frame completed a repetition.')}</p>
  <p class="note">${t(
    'ไฟล์ที่ส่งออกมีหัวไฟล์บอกวันเวลา รุ่นแอป โมเดลที่ใช้ และค่าปรับเทียบ เพื่อให้ทำซ้ำได้ภายหลัง',
    'The exported file carries a header with the date, the app build, the model in use and the calibration, so the run can be reproduced later.')}</p>
  <p class="note warnish">${t(
    'ข้อมูลเก็บในหน้าเว็บเท่านั้น ปิดหน้าแล้วหาย ส่งออกก่อนปิดทุกครั้ง',
    'Data lives only in this page and is lost when it closes. Always export before closing.')}</p>`;
}

function tabRefs() {
  return REFS.map((r) => `
    <div class="step" style="margin-bottom:10px">
      <div><span class="tag">${r.key}</span>${t(r.th, r.en)}</div>
      <div style="margin-top:6px;font-size:13px;opacity:.85">${r.cite}</div>
      <div style="margin-top:6px"><a href="${r.url}" target="_blank" rel="noopener">${r.url}</a></div>
    </div>`).join('') + `
  <p class="note">${t(
    'ทุกสมการในแอปนี้อ้างอิงได้ถึงที่มา ถ้าแก้สมการในโค้ด ต้องมาแก้รายการนี้ให้ตรงด้วย',
    'Every equation in this app traces back to a source. If you change an equation in the code, update this list to match.')}</p>`;
}

const TABS = [
  { id: 'pipe', th: 'ท่อประมวลผล', en: 'Pipeline', render: tabPipeline, live: true },
  { id: 'model', th: 'โมเดล', en: 'Model', render: tabModel, live: true },
  { id: 'data', th: 'เก็บข้อมูล', en: 'Data', render: tabData, live: false },
  { id: 'refs', th: 'อ้างอิง', en: 'References', render: tabRefs, live: false },
];
let tab = 'pipe';

function paint() {
  if (!panel) return;
  const body = panel.querySelector('.body');
  const def = TABS.find((x) => x.id === tab);
  body.innerHTML = def.render();
  panel.querySelectorAll('nav button').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
  if (tab === 'data') wireData();
}

function wireData() {
  panel.querySelectorAll('input[data-meta]').forEach((inp) => {
    inp.oninput = () => { meta[inp.dataset.meta] = inp.value; };
  });
  const rec = panel.querySelector('#hrRec');
  if (rec) rec.onclick = () => {
    recording = !recording;
    if (recording) { startedAt = new Date().toLocaleString(); label = meta.notes; }
    paint();
  };
  const csv = panel.querySelector('#hrCsv');
  if (csv) csv.onclick = exportCsv;
  const clr = panel.querySelector('#hrClear');
  if (clr) clr.onclick = () => { rows = []; paint(); };
}

function exportCsv() {
  if (!rows.length) return;
  const cols = Object.keys(rows[0]);
  const esc = (v) => (/[",\n]/.test(String(v)) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v));
  // หัวไฟล์บอกที่มา ขึ้นต้นด้วย # เพื่อให้เครื่องมือวิเคราะห์ข้ามได้
  const head = [
    '# HandRehab Arcade research capture',
    '# exported_at,' + new Date().toISOString(),
    '# page,' + location.pathname.split('/').pop(),
    '# participant,' + (meta.participant || ''),
    '# condition,' + (meta.condition || ''),
    '# session,' + (meta.session || ''),
    '# notes,' + (meta.notes || '').replace(/[\r\n,]/g, ' '),
    '# model,MediaPipe Hands 21 landmarks',
    '# anchors_rest,' + num(state.rest, 4),
    '# anchors_best,' + num(state.best, 4),
    '# k_on,' + (state.entryK ?? 0.7),
    '# k_off,' + (state.exitK ?? 0.3),
    '# min_hold_ms,' + (state.minHoldMs ?? 80),
    '# cooldown_ms,' + (state.cooldownMs ?? 400),
    '# rows,' + rows.length,
  ].join('\n');
  const body = [head, cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
  const blob = new Blob(['﻿' + body], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  a.download = `research-${location.pathname.split('/').pop().replace('.html', '')}-${stamp}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

function build() {
  const style = document.createElement('style');
  style.textContent = css();
  document.head.appendChild(style);

  panel = el(`<aside id="hrResearch" role="dialog" aria-label="Research mode">
    <header><h2>🔬 ${t('โหมดวิจัย', 'Research mode')}</h2>
      <button class="x" aria-label="close">×</button></header>
    <nav>${TABS.map((x) => `<button data-tab="${x.id}">${t(x.th, x.en)}</button>`).join('')}</nav>
    <div class="body"></div>
  </aside>`);
  document.body.appendChild(panel);
  panel.querySelector('.x').onclick = () => close();
  panel.querySelectorAll('nav button').forEach((b) => {
    b.onclick = () => { tab = b.dataset.tab; paint(); };
  });
}

function loop() {
  const def = TABS.find((x) => x.id === tab);
  if (def && def.live) paint();
  raf = setTimeout(loop, 250);   // 4 ครั้งต่อวินาทีพอ ไม่ต้องถี่กว่านี้
}

export function open() {
  if (!panel) build();
  panel.classList.add('open');
  setActive(true);
  if (!unsub) unsub = subscribe(onBus);
  paint();
  clearTimeout(raf); loop();
  return true;
}

export function close() {
  if (panel) panel.classList.remove('open');
  clearTimeout(raf);
  if (!recording) { setActive(false); if (unsub) { unsub(); unsub = null; } }
  return false;
}

export function isOpen() { return !!panel && panel.classList.contains('open'); }
export function relabel() { if (panel) { panel.querySelector('h2').textContent = '🔬 ' + t('โหมดวิจัย', 'Research mode'); paint(); } }
