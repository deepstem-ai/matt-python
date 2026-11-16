// ============================================================
// steps.js — แถบลำดับขั้นที่อยู่บนหน้าแลปทั้งสี่
//
// แก้ปัญหาที่เจอจริง  ทำขั้นหนึ่งเสร็จแล้วไปต่อไม่ได้ เพราะหน้าแลปไม่มีทางกลับ
// แถบนี้จึงติดอยู่บนสุดของทุกหน้าแลป บอกว่าอยู่ขั้นไหน เหลืออะไร และกดไปต่อตรงไหน
//
// และมีแถบ "สมการที่กำลังทำงาน" พับเก็บได้ อยู่ในหน้าเดียวกับงาน
// ไม่ต้องเปิดโหมดแยก เพราะสิ่งที่ต้องการคือเห็นสมการตอนทำงาน ไม่ใช่เปลี่ยนโหมด
// ============================================================
import { subscribe, setActive } from './research-bus.js';

const PROGRESS = 'hr-lab-progress';
const SHOWEQ = 'hr-show-eq';

const L = () => (document.documentElement.lang === 'en' ? 'en' : 'th');
const t = (th, en) => (L() === 'en' ? en : th);

// ลำดับขั้นทั้งสี่  ต้องตรงกับ menu.html
const STEPS = [
  { k: 's1', page: 'benchmark.html',      th: 'วัดความเร็วเครื่อง',        en: 'Measure this computer’s speed',
    file: 'benchmark-compare.csv' },
  { k: 's2', page: 'filters.html',        th: 'เปรียบเทียบตัวกรองสัญญาณ',  en: 'Compare the signal filters',
    file: 'filter-comparison.csv' },
  { k: 's3', page: 'evaluate.html',       th: 'ความแม่นยำตามระดับแสง',     en: 'Accuracy by light level',
    file: 'lighting CSV' },
  { k: 's4', page: 'count-accuracy.html', th: 'ความแม่นยำการนับครั้ง',     en: 'Repetition counting accuracy',
    file: 'counting CSV' },
];

const here = location.pathname.split('/').pop() || 'index.html';
const idx = STEPS.findIndex((s) => s.page === here);

const read = () => { try { return JSON.parse(localStorage.getItem(PROGRESS) || '{}'); } catch { return {}; } };
const write = (o) => { try { localStorage.setItem(PROGRESS, JSON.stringify(o)); } catch { /* ไม่เป็นไร */ } };
const showEq = () => { try { return localStorage.getItem(SHOWEQ) === '1'; } catch { return false; } };
const setShowEq = (v) => { try { localStorage.setItem(SHOWEQ, v ? '1' : '0'); } catch { /* ไม่เป็นไร */ } };

// ---------- ค่าสดจากสมการ ----------
const live = { m: null, pi: null, rest: null, best: null, entry: null, exit: null,
               scale: null, stateName: null, count: 0 };
let unsub = null;

function onBus(stage, d) {
  if (stage === 'measure') { live.m = d.value; live.scale = d.scale; }
  else if (stage === 'score') {
    live.m = d.m; live.pi = d.pi; live.rest = d.rest; live.best = d.best;
    live.entry = d.entry; live.exit = d.exit;
  } else if (stage === 'rep') { live.stateName = d.to; live.count = d.count; }
}

const f = (v, n = 3) => (typeof v === 'number' && isFinite(v) ? v.toFixed(n) : '—');

function styles() {
  const s = document.createElement('style');
  s.textContent = `
  #hrSteps{position:sticky;top:0;z-index:900;background:#0d1328f2;color:#eef2ff;
    border-bottom:1px solid #2b3658;backdrop-filter:blur(8px);
    font:14px/1.5 system-ui,-apple-system,"Noto Sans Thai",sans-serif}
  body.light #hrSteps{background:#ffffffF2;color:#17203a;border-bottom-color:#dfe4f1}
  #hrSteps .row{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:9px 14px;max-width:1100px;margin:0 auto}
  #hrSteps .pos{font-weight:700;white-space:nowrap}
  #hrSteps .dots{display:flex;gap:5px;align-items:center}
  #hrSteps .dot{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;
    font-size:11px;font-weight:700;background:#1d2747;color:#8e9dc4;text-decoration:none}
  body.light #hrSteps .dot{background:#e8ecf7;color:#6b7a9e}
  #hrSteps .dot.now{background:#fbbf24;color:#2b1d00}
  #hrSteps .dot.done{background:#2dd4a0;color:#042b20}
  #hrSteps .spacer{flex:1}
  #hrSteps a.btn,#hrSteps button.btn{padding:7px 13px;border-radius:9px;border:1px solid #3a4670;
    background:transparent;color:inherit;text-decoration:none;cursor:pointer;font:inherit;font-size:13.5px;
    white-space:nowrap}
  #hrSteps a.btn.main{background:#5eead4;color:#06281f;border-color:transparent;font-weight:700}
  body.light #hrSteps a.btn.main{background:#0a7a63;color:#fff}
  #hrSteps button.btn.done{background:#2dd4a0;color:#042b20;border-color:transparent;font-weight:700}
  #hrSteps .eqwrap{border-top:1px dashed #2b3658;max-width:1100px;margin:0 auto;padding:0 14px}
  body.light #hrSteps .eqwrap{border-top-color:#dfe4f1}
  #hrSteps details{padding:8px 0 12px}
  #hrSteps summary{cursor:pointer;font-size:13.5px;opacity:.85;list-style:none}
  #hrSteps summary::-webkit-details-marker{display:none}
  #hrSteps summary::before{content:'\\25b8 ';display:inline-block;transition:transform .15s}
  #hrSteps details[open] summary::before{transform:rotate(90deg)}
  #hrSteps .flow{display:grid;grid-template-columns:1fr auto 2fr auto 1fr;gap:8px;align-items:stretch;margin-top:9px}
  @media (max-width:860px){ #hrSteps .flow{grid-template-columns:1fr} #hrSteps .ar{display:none} }
  #hrSteps .box{background:#141c35;border:1px solid #2b3658;border-radius:10px;padding:9px 11px}
  body.light #hrSteps .box{background:#f4f7fd;border-color:#e3e8f4}
  #hrSteps .box h4{margin:0 0 5px;font-size:11px;letter-spacing:.5px;text-transform:uppercase;opacity:.6}
  #hrSteps .ar{display:grid;place-items:center;opacity:.4}
  #hrSteps .eq{font-family:ui-monospace,Consolas,monospace;font-size:12.5px;line-height:1.75}
  #hrSteps .v{color:#5eead4;font-weight:700}
  body.light #hrSteps .v{color:#0a7a63}
  #hrSteps .tiny{font-size:12px;opacity:.65;margin:7px 0 0}
  #hrSteps .eqtoggle{display:inline-flex;align-items:center;gap:6px;font-size:13px;opacity:.8;cursor:pointer}
  @media print{#hrSteps{display:none}}
  `;
  document.head.appendChild(s);
}

// สมการที่เกี่ยวข้องกับแต่ละหน้า  แสดงเฉพาะที่หน้านั้นใช้จริง จะได้ไม่รก
function eqBlock() {
  const rows = [];
  const add = (n, label, eq, val) => rows.push(
    `<div class="eq">(${n}) ${label}<br>${eq} = <span class="v">${val}</span></div>`);
  // สมการที่บทความเขียนไว้ในเนื้อความ ไม่มีเลขกำกับ
  const addU = (label, eq, val) => rows.push(
    `<div class="eq">${label}<br>${eq} = <span class="v">${val}</span></div>`);

  if (here === 'filters.html') {
    add(1, t('แก้สัดส่วนภาพ', 'Aspect correction'), "x′ = x·(W/H)", t('ใช้กับทุกจุด', 'applied to every point'));
    addU(t('ตัวกรองหนึ่งยูโร (หัวข้อ III.F)', 'The 1€ filter (Section III.F)'), "α = f(‖Δx‖)", t('ปรับตามความเร็ว', 'adapts to speed'));
  } else if (here === 'benchmark.html') {
    add(1, t('แก้สัดส่วนภาพ', 'Aspect correction'), "x′ = x·(W/H)", t('ทุกเฟรม', 'every frame'));
    rows.push(`<div class="eq">${t('อัตราเฟรม', 'Frame rate')} = ${t('เฟรมที่วาดได้', 'frames drawn')} / ${t('วินาที', 'second')}</div>`);
  } else {
    add(3, t('ค่าที่วัด หารขนาดฝ่ามือ', 'Measure over palm size'), "m = d(p₄,p₈)/d(p₀,p₉)", f(live.m, 4));
    add(4, t('คะแนน', 'Score'), "π = clip((r−m)/(r−b),0,1)", f(live.pi, 3));
    add(5, t('เกณฑ์เข้า/ออก', 'Entry / exit thresholds'), "T = r−k(r−b)", f(live.entry, 3) + ' / ' + f(live.exit, 3));
    add(6, t('เงื่อนไขนับ', 'Counting condition'), "π≥θ_on → hold → π≤θ_off", live.stateName || '—');
  }
  return rows.join('');
}

function flow() {
  const inp = here === 'benchmark.html'
    ? t('ภาพจากกล้อง 1 เฟรม', 'One camera frame')
    : here === 'filters.html'
      ? t('สัญญาณมือจำลองหรือกล้อง', 'Synthetic or camera hand signal')
      : t('ภาพจากกล้อง → จุดสังเกต 21 จุด', 'Camera frame → 21 landmarks');
  const outp = here === 'benchmark.html'
    ? t('เฟรมต่อวินาที และ ms ต่อเฟรม', 'Frames per second and ms per frame')
    : here === 'filters.html'
      ? t('% ที่ลดการสั่น และความหน่วง', 'Jitter reduction % and lag')
      : `${t('คะแนน', 'Score')} π = <span class="v">${f(live.pi, 3)}</span> · ${t('นับได้', 'counted')} <span class="v">${live.count}</span>`;
  return `
  <div class="flow">
    <div class="box"><h4>${t('เข้า', 'Input')}</h4><div>${inp}</div>
      ${live.scale != null ? `<div class="eq" style="margin-top:5px">palm = <span class="v">${f(live.scale, 4)}</span></div>` : ''}</div>
    <div class="ar">▶</div>
    <div class="box"><h4>${t('ประมวลผล', 'Process')}</h4>${eqBlock()}</div>
    <div class="ar">▶</div>
    <div class="box"><h4>${t('ออก', 'Output')}</h4><div>${outp}</div></div>
  </div>
  <p class="tiny">${t(
    'ตัวเลขนี้คือค่าที่ระบบใช้จริงในเฟรมล่าสุด ไม่ได้คำนวณซ้ำเพื่อแสดงผล ถ้ายังขึ้นขีด แปลว่าหน้านี้ยังไม่เริ่มจับมือ',
    'These are the values the system actually used on the latest frame, not recomputed for display. Dashes mean this page has not started tracking yet.')}</p>`;
}

let bar = null;
let timer = 0;

function paint() {
  if (!bar) return;
  const d = read();
  const me = STEPS[idx];
  const nextUndone = STEPS.find((s, i) => i > idx && !d[s.k]) || STEPS.find((s) => !d[s.k]);
  const isDone = !!d[me.k];

  bar.querySelector('.pos').textContent =
    t(`ขั้นที่ ${idx + 1} จาก 4`, `Step ${idx + 1} of 4`);

  bar.querySelector('.dots').innerHTML = STEPS.map((s, i) => {
    const cls = d[s.k] ? 'done' : (i === idx ? 'now' : '');
    const label = d[s.k] ? '✔' : (i + 1);
    return `<a class="dot ${cls}" href="${s.page}" title="${t(s.th, s.en)}">${label}</a>`;
  }).join('');

  const actions = bar.querySelector('.actions');
  let nextBtn = '';
  if (!nextUndone) {
    nextBtn = `<a class="btn main" href="menu.html">${t('ครบทั้งสี่ขั้นแล้ว → กลับเมนู', 'All four done → back to the menu')}</a>`;
  } else if (nextUndone.k !== me.k) {
    // ถ้าขั้นที่ยังไม่ทำอยู่ก่อนหน้าขั้นนี้ อย่าเรียกว่า "ถัดไป" เพราะที่จริงคือย้อนกลับ
    const ahead = STEPS.indexOf(nextUndone) > idx;
    const label = ahead ? t('ถัดไป', 'Next') : t('ยังไม่ได้ทำ', 'Still to do');
    nextBtn = `<a class="btn main" href="${nextUndone.page}">${label}: ${t(nextUndone.th, nextUndone.en)}${ahead ? ' →' : ''}</a>`;
  }
  actions.innerHTML =
    `<button class="btn ${isDone ? 'done' : ''}" id="hrDone">${
      isDone ? t('✔ ทำขั้นนี้แล้ว', '✔ This step is done')
             : t('ทำขั้นนี้เสร็จแล้ว', 'Mark this step done')}</button>` +
    nextBtn +
    `<a class="btn" href="menu.html">${t('เมนู', 'Menu')}</a>`;

  bar.querySelector('#hrDone').onclick = () => {
    const o = read(); o[me.k] = !o[me.k]; write(o); paint();
  };

  const det = bar.querySelector('details');
  if (det && det.open) bar.querySelector('.eqbody').innerHTML = flow();
}

function build() {
  if (idx < 0) return;          // ไม่ใช่หน้าแลป ไม่ต้องมีแถบ
  styles();
  bar = document.createElement('div');
  bar.id = 'hrSteps';
  bar.innerHTML = `
    <div class="row">
      <span class="pos"></span>
      <span class="dots"></span>
      <span class="spacer"></span>
      <span class="actions" style="display:flex;gap:8px;flex-wrap:wrap"></span>
    </div>
    <div class="eqwrap">
      <details ${showEq() ? 'open' : ''}>
        <summary>${t('สมการที่กำลังทำงานในขั้นนี้', 'The equations running in this step')}</summary>
        <div class="eqbody"></div>
      </details>
    </div>`;
  document.body.insertBefore(bar, document.body.firstChild);

  const det = bar.querySelector('details');
  det.addEventListener('toggle', () => {
    setShowEq(det.open);
    if (det.open) { setActive(true); if (!unsub) unsub = subscribe(onBus); paint(); }
  });
  if (det.open) { setActive(true); unsub = subscribe(onBus); }

  paint();
  clearInterval(timer);
  timer = setInterval(() => { if (bar.querySelector('details').open) paint(); }, 300);
  window.addEventListener('hr-lang-change', paint);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
else build();
