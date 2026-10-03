// ============================================================
// counter-lab.js — ห้องทดลองตัวนับครั้ง (Lab 21): ตัวนับสองประตู vs ตัวนับเกณฑ์เดียว
//   โหมดจำลอง: สัญญาณ 3 แบบ + เวลาจำลอง → ตัดสิน ผ่าน/ไม่ผ่าน ทันที
//   โหมดกล้องจริง: นับท่าจริง (จีบ / กำมือ / ...) พร้อมกราฟเลื่อน 10 วินาทีล่าสุด
// ============================================================
import { applyPrefs, saveCanvasPNG, toast, esc } from '../ui.js';
import { drawHand } from '../hand.js';
import { detectAll, GESTURE_INFO, GESTURE_KEYS, setGestureConfig } from '../gestures.js';
import { RepCounter } from '../rep-counter.js';
import { SIGNALS, runSim, NaiveCounter, gapExperiment } from './counter-sim.js';
import { drawSignal } from './signal-chart.js';
import { startHandApp } from './hand-app.js';
import { DemoHand } from './demo-hand.js';

applyPrefs();
const $ = (id) => document.getElementById(id);
setGestureConfig('wristFlex', { aspect: 1 }); // ป้อน hand.sq ที่แก้สัดส่วนภาพแล้ว

// ---------- ค่าเกณฑ์จากสไลเดอร์ ----------
function cfg() {
  let enter = +$('enter').value, exit = +$('exit').value;
  if (exit >= enter) { exit = +(enter - 0.05).toFixed(2); $('exit').value = exit; } // exit ต้องต่ำกว่า enter เสมอ
  $('vEnter').textContent = enter; $('vExit').textContent = exit;
  $('vHold').textContent = $('hold').value; $('vCool').textContent = $('cool').value; $('vNaive').textContent = $('naive').value;
  return { enter, exit, minHoldMs: +$('hold').value, cooldownMs: +$('cool').value };
}
const naiveTh = () => +$('naive').value;
['enter', 'exit', 'hold', 'cool', 'naive'].forEach((id) => {
  $(id).oninput = () => {
    const c = cfg();
    if (mode === 'sim' && lastKind) runOne(lastKind);
    else { live.rc.setThresholds(c); live.naive.threshold = naiveTh(); }
  };
});
cfg();

// ---------- ตารางรายการแต่ละครั้ง ----------
function showReps(reps, fmtT) {
  $('reps').innerHTML = reps.map((r) => `<tr><td>${r.n}</td><td>${fmtT(r.t)}</td><td class="num">${r.peak.toFixed(2)}</td><td class="num">${r.holdMs}</td><td class="num">${r.quality}</td></tr>`).join('')
    || '<tr><td colspan="5" class="muted">ยังไม่มีการนับ</td></tr>';
}

// ================= โหมดสัญญาณจำลอง =================
let mode = 'sim', lastKind = null;
const KINDS = Object.keys(SIGNALS);
$('simBtns').innerHTML = KINDS.map((k, i) => `<div class="card-neon">
  <button class="btn-glow small" data-kind="${k}">${i + 1}) ${SIGNALS[k].th}</button>
  <p class="muted">ต้องนับได้ <b>${SIGNALS[k].expect}</b> ครั้ง</p><div class="verdict" id="v-${k}">—</div></div>`).join('');
$('simBtns').querySelectorAll('button').forEach((b) => { b.onclick = () => runOne(b.dataset.kind); });

function runOne(kind) {
  lastKind = kind;
  const r = runSim(kind, cfg(), { naiveTh: naiveTh() });
  $('cnt').textContent = r.count; $('naiveCnt').textContent = r.naiveCount;
  $('state').textContent = r.states.join(' → ');
  $(`v-${kind}`).innerHTML = `<span class="${r.pass ? 'ok-text' : 'bad-text'}">${r.pass ? 'PASS ✅' : 'FAIL ❌'}</span> <span class="muted">${r.count} vs เกณฑ์เดียว ${r.naiveCount}</span>`;
  drawSignal($('chart'), r.samples, { ...cfg(), naive: naiveTh(), reps: r.reps, naiveTimes: r.naiveTimes, title: `${SIGNALS[kind].th}: สองประตู ${r.count} ครั้ง · เกณฑ์เดียว ${r.naiveCount} ครั้ง` });
  showReps(r.reps, (t) => (t / 1000).toFixed(2) + ' วิ');
  console.log(`[Lab21] ${kind}: สองประตู=${r.count} (ต้องได้ ${r.expect}) เกณฑ์เดียว=${r.naiveCount} → ${r.pass ? 'PASS' : 'FAIL'}`);
  return r;
}
$('runAll').onclick = () => {
  const res = KINDS.map((k) => runOne(k));
  runOne('noisy'); // แสดงกราฟแบบมี noise เพราะเห็นความต่างชัดที่สุด
  const ok = res.every((r) => r.pass);
  toast(ok ? 'ผ่านครบทั้ง 3 แบบ ✅ พร้อมทดสอบกับมือจริง' : 'ยังไม่ผ่านบางแบบ ลองขยายช่องว่างระหว่าง enter กับ exit', ok ? 'success' : 'warning');
};

// การทดลอง: แคบช่องประตูแล้วผิดพลาดเท่าไร (20 seed ต่อค่า)
$('gapBtn').onclick = () => {
  const c = cfg();
  const rows = gapExperiment({ enter: c.enter, minHoldMs: c.minHoldMs, cooldownMs: c.cooldownMs, gaps: [0, 0.05, 0.1, 0.15, 0.2, 0.3, 0.4].filter((g) => c.enter - g > 0) });
  console.table(rows);
  $('gapOut').classList.remove('hidden');
  $('gapOut').innerHTML = `<h3>🔬 ช่องว่างระหว่างประตู vs ความผิดพลาด (สัญญาณมี noise, 20 รอบสุ่ม, ต้องได้ 10)</h3>
    <table class="data"><thead><tr><th class="num">ช่องว่าง</th><th class="num">exit</th><th class="num">ผิดเฉลี่ย (ประตูอย่างเดียว)</th><th class="num">นับตรง %</th><th class="num">ผิดเฉลี่ย (ครบทุกกฎ)</th><th class="num">นับตรง %</th></tr></thead>
    <tbody>${rows.map((r) => `<tr><td class="num">${r.gap}</td><td class="num">${r.exit}</td><td class="num">${r.gateOnlyError}</td><td class="num">${r.gateOnlyExactPct}</td><td class="num">${r.allRulesError}</td><td class="num">${r.allRulesExactPct}</td></tr>`).join('')}</tbody></table>
    <p class="muted">"ประตูอย่างเดียว" = ไม่มี minHold/cooldown เพื่อดูผลของช่องว่างล้วน ๆ · ช่องว่าง 0 = เกณฑ์เดียว</p>`;
};

// ================= โหมดกล้องจริง =================
$('gesture').innerHTML = GESTURE_KEYS.map((k) => `<option value="${k}">${GESTURE_INFO[k].icon} ${esc(GESTURE_INFO[k].th)}</option>`).join('');
const live = { rc: new RepCounter({ ...cfg() }), naive: new NaiveCounter(naiveTh()), samples: [], lastDraw: 0 };
function resetLive() {
  live.rc = new RepCounter({ ...cfg() }); live.naive = new NaiveCounter(naiveTh()); live.samples = [];
  $('cnt').textContent = 0; $('naiveCnt').textContent = 0; showReps([], () => '');
}
$('liveReset').onclick = resetLive;
$('gesture').onchange = resetLive;

let app = null, demo = null;
function onFrame(hand, now, info) {
  if (mode !== 'live') return;
  drawHand($('canvas'), hand, { style: 'simple' });
  $('nohand').classList.toggle('hidden', !!hand || !info.ready);
  let score = 0;
  if (hand) { try { score = detectAll(hand.sq)[$('gesture').value].score; } catch (e) { console.warn(e.message); } }
  // เวลาส่งเข้าไปจากข้างนอก (now) — ตัวนับไม่อ่านนาฬิกาเอง
  const rep = live.rc.update(score, now);
  live.naive.update(score, now);
  live.samples.push({ t: now, s: score });
  while (live.samples.length && live.samples[0].t < now - 10000) live.samples.shift();
  if (rep) showReps(live.rc.reps, (t) => new Date(performance.timeOrigin + t).toLocaleTimeString('th-TH'));
  $('cnt').textContent = live.rc.count; $('naiveCnt').textContent = live.naive.count; $('state').textContent = live.rc.state;
  if (now - live.lastDraw > 33) {
    live.lastDraw = now;
    drawSignal($('chart'), live.samples, { ...cfg(), naive: naiveTh(), t0: now - 10000, t1: now, reps: live.rc.reps, naiveTimes: live.naive.times,
      title: `${GESTURE_INFO[$('gesture').value].th} (สด): สองประตู ${live.rc.count} · เกณฑ์เดียว ${live.naive.count}` });
  }
}

// สลับโหมด: เปิดกล้องเฉพาะตอนใช้โหมดกล้องจริง กลับโหมดจำลองแล้วปิดไฟกล้อง
document.querySelectorAll('input[name=mode]').forEach((r) => {
  r.onchange = () => {
    mode = r.value;
    $('simBox').classList.toggle('hidden', mode !== 'sim');
    $('liveBox').classList.toggle('hidden', mode !== 'live');
    if (mode === 'live') {
      resetLive();
      if (!app) {
        demo = new DemoHand($('stage'), $('demoPanel'));
        app = startHandApp({ video: $('video'), canvas: $('canvas'), msgEl: $('msg'), onFrame, demo });
        $('demoBtn').onclick = () => { app.setDemo(!app.isDemo()); $('demoBtn').textContent = app.isDemo() ? '📷 กลับไปใช้กล้อง' : '🖱️ โหมดสาธิต'; };
      } else app.resume();
    } else {
      app?.pause();
      $('cnt').textContent = 0; $('naiveCnt').textContent = 0;
      if (lastKind) runOne(lastKind); else runOne('noisy');
    }
  };
});

$('pngBtn').onclick = () => saveCanvasPNG($('chart'), `lab21-${mode === 'sim' ? lastKind : 'live'}-chart.png`);

// เริ่มต้น: แสดงสัญญาณแบบมี noise ให้เห็นปัญหาทันที (ถ้ามี ?live=1 เข้าโหมดกล้องเลย)
runOne('noisy');
if (new URLSearchParams(location.search).get('live') === '1') { const r = document.querySelector('input[value=live]'); r.checked = true; r.onchange(); }
