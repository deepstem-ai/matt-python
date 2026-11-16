// ============================================================
// rehearsal.js — นาฬิกาซ้อมนำเสนอ 5 นาที + บันทึกเวลาแต่ละส่วน + การ์ดแผนสำรอง (Lab 40)
// เก็บประวัติการซ้อมใน localStorage (เฉพาะเครื่องนี้ ถ้าเก็บไม่ได้ก็ยังซ้อมได้)
// ============================================================
import { applyPrefs, toast, downloadCSV, esc, modal } from '../ui.js';
import { SECTIONS, TOTAL, PLAN_B } from './pitch-data.js';
applyPrefs();

const $ = (id) => document.getElementById(id);
const RUNS_KEY = 'lab40-rehearsals', PB_KEY = 'lab40-planb';
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { toast('บันทึกในเครื่องไม่ได้ (โหมดส่วนตัว?) ผลรอบนี้จะหายเมื่อปิดหน้า', 'warning', 6); } };
const mmss = (s) => { const neg = s < 0; s = Math.abs(Math.round(s)); return `${neg ? '−' : ''}${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

// ---------- สถานะนาฬิกา ----------
let running = false, t0 = 0, acc = 0, cur = 0, splits = [], sectionStart = 0, tick = null;
const scale = () => ($('half').checked ? 0.5 : 1);
const plan = () => SECTIONS.map((s) => ({ ...s, start: s.start * scale(), end: s.end * scale() }));
const elapsed = () => acc + (running ? (performance.now() - t0) / 1000 : 0);

function render() {
  const e = elapsed(), P = plan(), total = TOTAL * scale(), left = total - e;
  $('clock').textContent = mmss(left);
  $('clock').className = 'clock' + (left < 0 ? ' over' : left < 30 * scale() ? ' warn' : '');
  // แถบส่วนต่าง ๆ: เติมตามเวลาที่ผ่านไปของแต่ละส่วนตามแผน
  $('segs').innerHTML = P.map((s, i) => `<div class="seg ${i === cur ? 'cur' : ''}"><i style="width:${Math.max(0, Math.min(1, (e - s.start) / (s.end - s.start))) * 100}%"></i><span>${s.id}. ${esc(s.title)}</span></div>`).join('');
  const s = P[Math.min(cur, P.length - 1)];
  $('cueTitle').textContent = `นาทีที่ ${s.id} · ${s.title}  (${mmss(s.start)}–${mmss(s.end)})`;
  $('cueWho').textContent = '🎙️ ' + s.who;
  $('cueSay').textContent = '"' + s.say + '"';
  $('cueDo').textContent = '👉 ทำ: ' + s.do;
  $('cueNext').textContent = cur < P.length - 1 ? `ถัดไป: ${P[cur + 1].title} (${P[cur + 1].who})` : 'ส่วนสุดท้าย — กด "ส่วนถัดไป" เมื่อพูดขอบคุณจบ';
  // เร็ว/ช้ากว่าแผน
  if (running || acc > 0) {
    const planIdx = P.findIndex((x) => e < x.end);
    const late = e - s.end;
    $('pace').textContent = late > 0 ? `ช้ากว่าแผน ${mmss(late)} — ขึ้นส่วนถัดไปได้แล้ว` : planIdx >= 0 && planIdx < cur ? 'เร็วกว่าแผน — พูดช้าลงได้' : 'ตรงตามแผน 👍';
    $('pace').className = 'pace ' + (late > 0 ? 'late' : 'ok');
  }
}

function startPause() {
  if (cur >= SECTIONS.length) return;
  if (running) { acc = elapsed(); running = false; clearInterval(tick); $('startBtn').innerHTML = '▶ ทำต่อ <span class="kbd">Space</span>'; }
  else { t0 = performance.now(); running = true; tick = setInterval(render, 200); $('startBtn').innerHTML = '⏸ หยุดชั่วคราว <span class="kbd">Space</span>'; }
  render();
}
// จบส่วนปัจจุบัน → จดเวลาจริงของส่วนนั้น
function nextSection() {
  if (!running && acc === 0) return toast('กดเริ่มก่อน', 'warning');
  const e = elapsed();
  splits[cur] = +(e - sectionStart).toFixed(1);
  sectionStart = e;
  cur++;
  if (cur >= SECTIONS.length) return finish(e);
  render();
}
function finish(total) {
  running = false; clearInterval(tick); acc = total;
  const runs = load(RUNS_KEY, []);
  runs.push({ at: Date.now(), half: $('half').checked, total: +total.toFixed(1), splits });
  save(RUNS_KEY, runs);
  const target = TOTAL * scale(), diff = total - target;
  toast(`จบรอบที่ ${runs.length}: ${mmss(total)} (${diff >= 0 ? 'เกิน' : 'ขาด'} ${mmss(Math.abs(diff))})`, Math.abs(diff) <= 10 ? 'success' : 'warning', 6);
  $('startBtn').innerHTML = '▶ เริ่ม <span class="kbd">Space</span>';
  cur = SECTIONS.length - 1; render(); cur = SECTIONS.length;
  $('pace').textContent = `บันทึกรอบที่ ${runs.length} แล้ว — ดูแท็บ "ผลซ้อม"`;
  renderLog();
}
function reset() {
  running = false; clearInterval(tick); acc = 0; cur = 0; splits = []; sectionStart = 0;
  $('startBtn').innerHTML = '▶ เริ่ม <span class="kbd">Space</span>';
  $('pace').textContent = 'กดเริ่มเมื่อผู้พูดคนแรกเปิดปาก'; $('pace').className = 'pace';
  render();
}

// ---------- ตารางผลซ้อม ----------
function renderLog() {
  const runs = load(RUNS_KEY, []);
  $('runCount').textContent = runs.length;
  $('runBar').style.width = Math.min(100, (runs.length / 5) * 100) + '%';
  const head = `<thead><tr><th>รอบ</th><th>วันที่</th>${SECTIONS.map((s) => `<th class="n">${s.id}. ${esc(s.title)}<br><span class="muted">แผน</span></th>`).join('')}<th class="n">รวม</th><th class="n">ต่างจากแผน</th><th></th></tr></thead>`;
  const rows = runs.map((r, i) => {
    const k = r.half ? 0.5 : 1;
    const cells = SECTIONS.map((s, j) => {
      const planSec = (s.end - s.start) * k, v = r.splits[j];
      const cls = v - planSec > 10 ? 'over' : planSec - v > 10 ? 'under' : '';
      return `<td class="n ${cls}">${Number.isFinite(v) ? mmss(v) : '–'} <span class="muted">/${mmss(planSec)}</span></td>`;
    }).join('');
    const d = r.total - TOTAL * k;
    return `<tr><td>${i + 1}${r.half ? ' ½' : ''}</td><td>${new Date(r.at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}</td>${cells}<td class="n">${mmss(r.total)}</td><td class="n ${Math.abs(d) > 10 ? 'over' : ''}">${d >= 0 ? '+' : '−'}${mmss(Math.abs(d))}</td><td><button class="btn-glow ghost small" data-del="${i}">✕</button></td></tr>`;
  }).join('');
  $('logTable').innerHTML = head + `<tbody>${rows || `<tr><td colspan="${SECTIONS.length + 5}" class="muted">ยังไม่มีการซ้อม — ไปแท็บนาฬิกาซ้อมแล้วกดเริ่ม</td></tr>`}</tbody>`;
  $('logTable').querySelectorAll('[data-del]').forEach((b) => (b.onclick = () => { const r = load(RUNS_KEY, []); r.splice(+b.dataset.del, 1); save(RUNS_KEY, r); renderLog(); }));
}
$('csvBtn').onclick = () => {
  const runs = load(RUNS_KEY, []);
  if (!runs.length) return toast('ยังไม่มีข้อมูล', 'warning');
  downloadCSV('lab40-rehearsals.csv', runs.map((r, i) => ({ run: i + 1, date: new Date(r.at).toISOString(), half: r.half ? 'yes' : 'no', total_sec: r.total, ...Object.fromEntries(SECTIONS.map((s, j) => [`s${s.id}_sec`, r.splits[j] ?? ''])) })));
};
$('clearBtn').onclick = async () => { if (await modal('<h3>ลบประวัติการซ้อมทั้งหมด?</h3>', [{ label: 'ลบ', value: true, cls: 'danger' }, { label: 'ยกเลิก', value: false, cls: 'ghost' }])) { save(RUNS_KEY, []); renderLog(); } };

// ---------- การ์ดแผนสำรอง ----------
function renderPlanB() {
  const done = load(PB_KEY, {});
  const n = PLAN_B.filter((p) => done[p.id]).length;
  $('pbChip').innerHTML = `ซ้อมแล้ว <b>${n}</b>/3`; $('pbChip').className = 'chip ' + (n >= 3 ? 'ok' : 'warn');
  $('pbGrid').innerHTML = PLAN_B.map((p, i) => `<button class="card-neon pb-card" data-pb="${i}"><div class="ic">${p.icon}</div><div class="t">${i + 1}. ${esc(p.title)}</div><div class="muted">${esc(p.now[0])}</div>${done[p.id] ? '<span class="chip ok"><b>✓ ซ้อมแล้ว</b></span>' : ''}</button>`).join('');
  $('pbGrid').querySelectorAll('[data-pb]').forEach((b) => (b.onclick = () => openCard(+b.dataset.pb)));
}
function openCard(i) {
  const p = PLAN_B[i], done = load(PB_KEY, {});
  closeCard();
  const el = document.createElement('div');
  el.className = 'pb-full'; el.id = 'pbFull'; el.setAttribute('role', 'dialog');
  el.innerHTML = `<div class="row" style="justify-content:space-between"><h1 style="font-size:var(--fs-3xl)">${p.icon} ${esc(p.title)}</h1><button class="btn-glow ghost" id="pbClose">✕ ปิด <span class="kbd">Esc</span></button></div>
    <h2 style="color:var(--primary)">ทำทันที</h2><ol class="now">${p.now.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>
    <h3>เตรียมล่วงหน้า</h3><ul class="prep">${p.prep.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
    <label class="switch" style="margin-top:var(--sp-4)"><input type="checkbox" id="pbDone" ${done[p.id] ? 'checked' : ''}> ซ้อมสถานการณ์นี้จริงแล้ว</label>`;
  document.body.appendChild(el);
  $('pbClose').onclick = closeCard;
  $('pbDone').onchange = () => { const d = load(PB_KEY, {}); d[p.id] = $('pbDone').checked ? Date.now() : undefined; save(PB_KEY, d); renderPlanB(); };
  $('pbClose').focus();
}
const closeCard = () => $('pbFull')?.remove();

// ---------- แท็บ + คีย์ลัด ----------
function show(view) {
  ['Timer', 'PlanB', 'Log'].forEach((v) => { $('view' + v).classList.toggle('hidden', v !== view); $('tab' + v).classList.toggle('ghost', v !== view); });
  if (view === 'Log') renderLog();
  if (view === 'PlanB') renderPlanB();
}
$('tabTimer').onclick = () => show('Timer');
$('tabPlanB').onclick = () => show('PlanB');
$('tabLog').onclick = () => show('Log');
$('startBtn').onclick = startPause;
$('nextBtn').onclick = nextSection;
$('resetBtn').onclick = reset;
$('half').onchange = () => { if (running || acc) { toast('เปลี่ยนโหมดแล้วเริ่มนับใหม่', 'warning'); } reset(); };
document.addEventListener('keydown', (e) => {
  if (e.target.closest('input, textarea')) return;
  if (e.key === 'Escape') return closeCard();
  if (!$('viewPlanB').classList.contains('hidden') && /^[1-9]$/.test(e.key)) return openCard(+e.key - 1);
  if ($('viewTimer').classList.contains('hidden')) return;
  if (e.code === 'Space') { e.preventDefault(); startPause(); }
  if (e.key === 'n' || e.key === 'N' || e.key === 'ArrowRight') nextSection();
});
render();
renderLog();
