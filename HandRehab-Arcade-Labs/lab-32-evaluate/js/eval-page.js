// ============================================================
// eval-page.js — หน้าวัดความแม่นยำ (Lab 32): ตั้งค่า → ทดสอบ 3 สภาพแสง → ตาราง/ตัวชี้วัด/กราฟ → ส่งออก/บันทึก
// ============================================================
import { applyPrefs, toast, esc, modal, downloadCSV, saveCanvasPNG, cssVar } from './ui.js';
import { summarise, byCondition, makeSchedule, CONDITIONS, CONDITION_TH, NONE } from './evaluate.js';
import { RULE_LABELS, ruleName, ruleDetect, knnDetector, simulateTrials, buildDemoModel } from './detectors.js';
import { discussionTH } from './discussion.js';
import { renderGrid, renderCellDetail, renderMetrics, METRIC_TH, drawConfusionCanvas } from './eval-view.js';
import { runRound } from './eval-run.js';
import { createHandSource } from './hand-source.js';
import { measureBrightness } from './camera.js';
import { KNNClassifier } from './ml.js';
import { barChart } from './charts.js';
import { put, getAll, newId } from './db.js';

applyPrefs();
const $ = (id) => document.getElementById(id);
const knn = new KNNClassifier();                // โมเดลจาก Lab 31 — อ่านอย่างเดียว
const src = createHandSource({ video: $('video'), canvas: $('overlay'), onStatus: (t) => ($('runMsg').textContent = t || 'กล้องพร้อม') });
let run = { detector: 'rule', labels: RULE_LABELS, trials: [], simulated: false };
let pts = null, running = null;

const detector = () => document.querySelector('input[name=det]:checked').value;
const nameOf = (k) => (run.detector === 'rule' ? ruleName(k) : k === NONE ? '∅ ไม่พบ' : k);
$('metricHelp').innerHTML = METRIC_TH.map(([t, d]) => `<dt>${t}</dt><dd>${d}</dd>`).join('');

// ---------- ตัวเลือกตัวตรวจ ----------
try { await knn.load(); } catch (e) { console.warn('[eval] โหลดโมเดลจากฐานข้อมูลไม่ได้', e); }
function refreshSetup() {
  const d = detector();
  $('knnBox').classList.toggle('hidden', d !== 'knn');
  $('knnInfo').innerHTML = knn.size ? `โมเดลจาก Lab 31: ${knn.labels().length} ท่า (${esc(knn.labels().join(', '))}), ${knn.size} ตัวอย่าง`
    : '⚠️ ยังไม่พบโมเดลจาก Lab 31 ในเครื่องนี้ — สอนท่าใน Lab 31 ก่อน หรือนำเข้าไฟล์ JSON (โหมดจำลองจะใช้โมเดลสาธิตแทน)';
  const labels = d === 'rule' ? RULE_LABELS : knn.labels();
  $('labelsInfo').textContent = labels.length ? labels.map((l) => (d === 'rule' ? ruleName(l) : l)).join(' · ') + ' + ∅ ไม่พบ' : '-';
}
document.querySelectorAll('input[name=det]').forEach((r) => (r.onchange = refreshSetup));
$('btnImport').onclick = () => $('fileIn').click();
$('fileIn').onchange = async (e) => {
  const f = e.target.files[0]; if (!f) return;
  try { knn.importJSON(await f.text()); toast(`นำเข้าโมเดล ${knn.size} ตัวอย่าง (ใช้ในหน้านี้เท่านั้น)`); } catch (err) { toast('นำเข้าไม่สำเร็จ: ' + err.message, 'error', 6); }
  e.target.value = ''; refreshSetup();
};
refreshSetup();

// ---------- ปุ่มเลือกสภาพแสง + สถานะว่าทำรอบไหนแล้ว ----------
function renderConds() {
  const sel = document.querySelector('input[name=cond]:checked')?.value || 'bright';
  $('condRow').innerHTML = CONDITIONS.map((c) => {
    const n = run.simulated ? 0 : run.trials.filter((t) => t.condition === c).length;
    return `<label class="choice"><input type="radio" name="cond" value="${c}" ${c === sel ? 'checked' : ''}> ${c === 'bright' ? '☀️' : c === 'normal' ? '💡' : '🌙'} ${CONDITION_TH[c]} ${n ? `<span class="cond-done">✓ ${n} ครั้ง</span>` : ''}</label>`;
  }).join('');
}
renderConds();

// ---------- วงรอบกล้อง: อ่านจุดมือทุกเฟรม + ความสว่างสด ----------
let lastB = 0;
function loop(now) {
  pts = src.mode === 'camera' ? src.frame(now) : null;
  if (src.mode === 'camera' && now - lastB > 500) { $('liveB').textContent = measureBrightness($('video')).toFixed(0) + '/255'; lastB = now; }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// ---------- ทดสอบด้วยกล้องจริง (1 รอบ = 1 สภาพแสง) ----------
$('btnRun').onclick = async () => {
  const d = detector(), cond = document.querySelector('input[name=cond]:checked').value;
  if (d === 'knn' && knn.labels().length < 2) return toast('โมเดล kNN ต้องมีอย่างน้อย 2 ท่า — สอนใน Lab 31 หรือนำเข้า JSON', 'warning', 5);
  if (run.simulated || run.detector !== d) run = { detector: d, labels: d === 'rule' ? RULE_LABELS : knn.labels(), trials: [], simulated: false };
  $('stage').classList.remove('hidden'); $('camError').innerHTML = '';
  if (src.mode !== 'camera') {
    try { await src.startCamera(); }
    catch (e) {
      $('camError').innerHTML = `<div class="alert"><b>${esc(e.title || e.message)}</b><p>${esc(e.detail || '')}</p><div class="row"><button class="btn-glow small" id="retry">🔄 ลองใหม่</button><button class="btn-glow small ghost" id="toSim">🤖 ใช้โหมดจำลองแทน</button></div></div>`;
      $('retry').onclick = () => $('btnRun').click(); $('toSim').onclick = () => $('btnSim').click();
      return;
    }
  }
  // ให้ผู้ใช้ปรับแสงเองแล้วยืนยัน พร้อมเห็นความสว่างที่วัดได้จริง
  const liveTimer = setInterval(() => { const el = document.getElementById('mB'); if (el) el.textContent = measureBrightness($('video')).toFixed(0); }, 300);
  const okGo = await modal(`<h3>รอบแสง "${CONDITION_TH[cond]}"</h3><p>ปรับไฟในห้องให้เป็นแสง${CONDITION_TH[cond]} แล้วกดยืนยัน</p>
    <p>ความสว่างที่วัดจากภาพตอนนี้: <b class="num" id="mB">-</b>/255 (ระบบจะบันทึกค่าที่วัดได้จริงทุกครั้ง ไม่ใช่ค่าที่เลือก)</p>
    <p>จะเรียก ${run.labels.length} ท่า × ${$('nPer').value} ครั้ง แบบสุ่ม — เห็นชื่อท่าแล้วทำค้างไว้จนขึ้นท่าถัดไป</p>`,
    [{ label: 'ยกเลิก', value: false, cls: 'ghost' }, { label: '✅ ยืนยัน เริ่มเลย', value: true }]);
  clearInterval(liveTimer);
  if (!okGo) return;
  const detect = d === 'rule' ? ruleDetect : knnDetector(knn, 5);
  running = { cancel: false };
  $('btnStop').classList.remove('hidden'); $('btnRun').disabled = $('btnSim').disabled = true;
  const schedule = makeSchedule(run.labels, +$('nPer').value);
  const trials = await runRound({
    schedule, condition: cond, detect, getPts: () => pts, video: $('video'), nameOf, state: running,
    startIndex: run.trials.length + 1,
    ui: {
      call: (name, s) => ($('callout').innerHTML = `${esc(name)}${s ? `<small>เตรียม… ${s}</small>` : '<small>ทำค้างไว้!</small>'}`),
      progress: (k, n) => { $('runBar').style.width = (100 * k) / n + '%'; $('runMsg').textContent = `รอบ${CONDITION_TH[cond]}: ${k}/${n}`; },
    },
  });
  $('callout').innerHTML = ''; $('btnStop').classList.add('hidden'); $('btnRun').disabled = $('btnSim').disabled = false;
  run.trials = run.trials.filter((t) => t.condition !== cond).concat(trials); // ทำรอบเดิมซ้ำ = แทนที่ของเดิม
  toast(`จบรอบแสง${CONDITION_TH[cond]} (${trials.length} ครั้ง)`);
  renderConds(); showResults();
};
$('btnStop').onclick = () => { if (running) running.cancel = true; };

// ---------- โหมดจำลอง: สร้างผลครบ 3 สภาพแสงจากมือสังเคราะห์ + สัญญาณรบกวน ----------
$('btnSim').onclick = () => {
  const d = detector();
  src.stop(); $('stage').classList.add('hidden');
  const r = simulateTrials({ detector: d, nPer: +$('nPer').value, model: d === 'knn' ? buildDemoModel() : undefined, seed: Math.floor(Math.random() * 1e6) });
  run = { detector: d, labels: r.labels, trials: r.trials, simulated: true };
  $('runBar').style.width = '100%';
  $('runMsg').textContent = `โหมดจำลอง: ${r.trials.length} ครั้ง${d === 'knn' ? ' (ใช้โมเดลสาธิตที่ฝึกด้วยมือจำลองชุดอื่น ไม่ใช่โมเดลของทีม)' : ''}`;
  renderConds(); showResults();
};

// ---------- แสดงผล ----------
const colOf = (t) => (run.labels.includes(t.detected) ? t.detected : NONE);
function filtered() { const f = $('condFilter').value; return f === 'all' ? run.trials : run.trials.filter((t) => t.condition === f); }
function showResults() {
  if (!run.trials.length) return;
  $('results').classList.remove('hidden'); $('simChip').classList.toggle('hidden', !run.simulated);
  const all = summarise(run.trials, run.labels), s = summarise(filtered(), run.labels), bc = byCondition(run.trials);
  $('nTot').textContent = s.n; $('accTot').textContent = (s.accuracy * 100).toFixed(1) + '%'; $('f1Tot').textContent = (s.macro.f1 * 100).toFixed(1) + '%';
  renderGrid($('grid'), s.cm, nameOf); $('cellDetail').innerHTML = '';
  renderMetrics($('metrics'), s, nameOf);
  const done = bc.filter((c) => c.n);
  const barColor = { bright: '--warning', normal: '--primary', dim: '--secondary' }; // สีตามแสง (ไม่ใช้เขียว/แดงเพื่อไม่ให้สับสนกับถูก/ผิด)
  barChart($('chart'), done.map((c) => ({ label: `${CONDITION_TH[c.condition]} (${Math.round(c.meanBrightness ?? 0)})`, value: c.accuracy * 100, color: cssVar(barColor[c.condition]) })),
    { title: `ความแม่นยำตามสภาพแสง — สมมติฐานข้อที่ ${$('hypo').value}`, yMax: 100, yLabel: 'ความแม่นยำ (%)', xLabel: 'สภาพแสง (ความสว่างเฉลี่ยที่วัดได้ 0-255)', format: (v) => v.toFixed(1) + '%' });
  $('condTable').innerHTML = '<thead><tr><th>สภาพแสง</th><th>ครั้ง</th><th>ถูก</th><th>ความแม่นยำ</th><th>ความสว่างเฉลี่ยที่วัดได้</th><th>เห็นมือ (% เฟรม)</th><th>ไม่พบท่า (none)</th></tr></thead><tbody>' +
    bc.map((c) => `<tr><td>${CONDITION_TH[c.condition]}</td><td class="num">${c.n}</td><td class="num">${c.correct}</td><td class="num">${c.n ? (c.accuracy * 100).toFixed(1) + '%' : '-'}</td><td class="num">${c.meanBrightness?.toFixed(1) ?? '-'}</td><td class="num">${c.handFoundPct?.toFixed(0) ?? '-'}</td><td class="num">${c.n ? (c.noneRate * 100).toFixed(0) + '%' : '-'}</td></tr>`).join('') + '</tbody>';
  $('discussion').textContent = discussionTH(all, bc, { hypothesis: $('hypo').value, detector: run.detector, nameOf, simulated: run.simulated });
}
$('condFilter').onchange = showResults;
$('hypo').onchange = showResults;
$('grid').onclick = (e) => {
  const b = e.target.closest('.cm-cell'); if (!b) return;
  document.querySelectorAll('.cm-cell.sel').forEach((x) => x.classList.remove('sel')); b.classList.add('sel');
  const req = run.labels[+b.dataset.r], det = [...run.labels, NONE][+b.dataset.c];
  renderCellDetail($('cellDetail'), filtered().filter((t) => t.requested === req && colOf(t) === det), req, det, nameOf, CONDITION_TH);
};

// ---------- ส่งออก / บันทึก ----------
const stamp = () => new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
$('btnCopy').onclick = async () => {
  const text = $('discussion').textContent;
  try { await navigator.clipboard.writeText(text); toast('คัดลอกแล้ว'); }
  catch { const r = document.createRange(); r.selectNodeContents($('discussion')); getSelection().removeAllRanges(); getSelection().addRange(r); toast('กด Ctrl+C เพื่อคัดลอก', 'warning'); }
};
$('btnCSV').onclick = () => downloadCSV(`evaluation-${run.detector}-${stamp()}.csv`,
  run.trials.map((t) => ({ ...t, correct: t.requested === t.detected ? 1 : 0, detector: run.detector, time: new Date(t.t).toISOString() })),
  ['i', 'condition', 'requested', 'detected', 'correct', 'brightness', 'handFoundPct', 'frames', 'votes', 'detector', 'simulated', 'time']);
$('btnPngCM').onclick = () => {
  const f = $('condFilter').value;
  drawConfusionCanvas($('cmCanvas'), summarise(filtered(), run.labels).cm, nameOf, `ตารางความสับสน — ${f === 'all' ? 'ทุกสภาพแสง' : 'แสง' + CONDITION_TH[f]}${run.simulated ? ' (จำลอง)' : ''}`);
  saveCanvasPNG($('cmCanvas'), `confusion-${run.detector}-${f}-${stamp()}.png`);
};
$('btnPngChart').onclick = () => saveCanvasPNG($('chart'), `accuracy-by-light-${run.detector}-${stamp()}.png`);
$('btnSave').onclick = async () => {
  const s = summarise(run.trials, run.labels);
  try {
    await put('evaluations', { id: newId('ev_'), createdAt: Date.now(), detector: run.detector, simulated: run.simulated, hypothesis: $('hypo').value, nPer: +$('nPer').value,
      labels: run.labels, trials: run.trials, summary: { accuracy: s.accuracy, macro: s.macro, matrix: s.cm.m, byCondition: byCondition(run.trials) }, discussion: $('discussion').textContent });
    toast('บันทึกผลลงฐานข้อมูลแล้ว'); listRuns();
  } catch (e) { toast('บันทึกไม่สำเร็จ: ' + e.message, 'error', 6); }
};
async function listRuns() {
  try {
    const all = (await getAll('evaluations')).sort((a, b) => b.createdAt - a.createdAt);
    $('runs').innerHTML = all.length ? all.map((r) => `<li><b>${new Date(r.createdAt).toLocaleString('th-TH')}</b><span>${r.detector === 'rule' ? 'แบบกฎ' : 'kNN'}${r.simulated ? ' · จำลอง' : ''}</span>
      <span class="chip">ความแม่นยำ <b>${(r.summary.accuracy * 100).toFixed(1)}%</b></span><span class="chip">${r.trials.length} ครั้ง</span><button class="btn-glow small ghost" data-id="${r.id}">เปิดดู</button></li>`).join('')
      : '<li class="muted">ยังไม่มีผลที่บันทึก</li>';
    $('runs').onclick = (e) => { const r = all.find((x) => x.id === e.target.dataset.id); if (!r) return; run = { detector: r.detector, labels: r.labels, trials: r.trials, simulated: r.simulated }; renderConds(); showResults(); $('results').scrollIntoView(); };
  } catch (e) { $('runs').innerHTML = `<li class="alert">เปิดฐานข้อมูลไม่ได้: ${esc(e.message)}</li>`; }
}
listRuns();

window.addEventListener('pagehide', () => src.stop());
window.__lab = { get run() { return run; }, simulate: (d = 'rule') => { document.querySelector(`input[name=det][value=${d}]`).checked = true; refreshSetup(); $('btnSim').click(); return summarise(run.trials, run.labels).accuracy; } };
