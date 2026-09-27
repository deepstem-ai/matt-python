// ============================================================
// test-recorder.js — ตัวบันทึกของผู้สังเกต (Lab 36)
// ทีละงาน: จับเวลา → กดผล (ทำได้เอง/ต้องช่วย/ทำไม่ได้) → บันทึกอัตโนมัติ
// ============================================================
import { applyPrefs, toast, downloadCSV, esc, modal } from './ui.js';
import { TASKS, OUTCOMES } from './usertest-data.js';
import { listTaskRecords, saveTaskRecord, deleteTaskRecord, loadIssues, saveIssues } from './usertest-store.js';
import { taskRows, taskCols } from './usertest-csv.js';
applyPrefs();

const $ = (id) => document.getElementById(id);
let rec = null;          // ผู้เข้าร่วมที่กำลังทดสอบ
let idx = 0;             // งานที่เท่าไร
let t0 = 0, acc = 0, running = false, tick = null; // ตัวจับเวลา (acc = วินาทีสะสม)

// ---------- ตัวจับเวลา ----------
const elapsed = () => acc + (running ? (performance.now() - t0) / 1000 : 0);
function showTime() {
  const s = Math.floor(elapsed());
  $('timer').textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  $('timer').classList.toggle('over', s > TASKS[idx].maxSec);
}
function startStop() {
  if (running) { acc = elapsed(); running = false; clearInterval(tick); $('tStart').textContent = '▶ จับเวลาต่อ'; }
  else { t0 = performance.now(); running = true; tick = setInterval(showTime, 250); $('tStart').textContent = '⏸ หยุดชั่วคราว'; }
  showTime();
}
function resetTimer(sec = 0) { running = false; clearInterval(tick); acc = sec; $('tStart').textContent = '▶ เริ่มจับเวลา'; showTime(); }

// ---------- เริ่มผู้เข้าร่วม ----------
$('begin').onclick = async () => {
  const pid = $('pid').value.trim().toUpperCase();
  if (!/^[A-Z0-9-]{2,12}$/.test(pid)) return ($('setupErr').textContent = 'กรอกรหัส เช่น P01 (ห้ามใช้ชื่อจริง)');
  if (!$('consent').checked) return ($('setupErr').textContent = 'ต้องเซ็นหนังสือยินยอมก่อนเริ่มทุกครั้ง');
  $('setupErr').textContent = '';
  const old = (await listTaskRecords()).find((r) => r.participant === pid);
  if (old && !(await modal(`<h3>มีบันทึกของ ${esc(pid)} อยู่แล้ว</h3><p>ทำต่อจากเดิมหรือไม่</p>`, [{ label: 'ทำต่อ', value: true }, { label: 'ยกเลิก', value: false, cls: 'ghost' }]))) return;
  rec = old || { participant: pid, facilitator: $('fac').value.trim(), age: +$('age').value || '', hand: $('hand').value, consent: true, startedAt: Date.now(), demo: false,
    tasks: TASKS.map((t) => ({ id: t.id, outcome: '', seconds: null, note: '' })) };
  idx = Math.max(0, rec.tasks.findIndex((t) => !t.outcome));
  $('setup').classList.add('hidden'); $('wizard').classList.remove('hidden');
  renderTask();
};

// ---------- แสดงงานปัจจุบัน ----------
function renderTask() {
  const t = TASKS[idx], r = rec.tasks[idx];
  $('wHead').textContent = `${rec.participant} · งาน ${idx + 1} / ${TASKS.length}`;
  $('tTitle').textContent = `${t.id} ${t.th}`;
  $('tSay').textContent = 'อ่านให้ฟัง: "' + t.th + ' ค่ะ/ครับ" แล้วนั่งดูเงียบ ๆ';
  $('tGoal').textContent = 'สำเร็จเมื่อ: ' + t.goal;
  $('tMax').textContent = `เวลาสูงสุด ${Math.round(t.maxSec / 60 * 10) / 10} นาที (เกินแล้วช่วยได้ → ต้องช่วย)`;
  $('note').value = r.note || '';
  resetTimer(r.seconds || 0);
  $('dots').innerHTML = rec.tasks.map((x, i) => `<button class="dot ${i === idx ? 'cur' : ''}" data-i="${i}" title="${x.id}">${OUTCOMES.find((o) => o.key === x.outcome)?.icon || i + 1}</button>`).join('');
  $('dots').querySelectorAll('.dot').forEach((b) => (b.onclick = () => { keepNote(); idx = +b.dataset.i; renderTask(); }));
  $('outcomes').innerHTML = '';
  OUTCOMES.forEach((o) => {
    const b = document.createElement('button');
    b.className = 'btn-glow ' + o.cls + (r.outcome && r.outcome !== o.key ? ' ghost' : '');
    b.innerHTML = `<span class="ico">${o.icon}</span> ${o.th}`;
    b.onclick = () => record(o.key);
    $('outcomes').appendChild(b);
  });
}
const keepNote = () => { if (rec) rec.tasks[idx].note = $('note').value.trim(); };

// กดผล → หยุดเวลา บันทึก ไปงานถัดไป
async function record(outcome) {
  const r = rec.tasks[idx];
  r.outcome = outcome; r.seconds = Math.round(elapsed()); keepNote();
  resetTimer(r.seconds);
  await persist();
  toast(`${TASKS[idx].id}: ${OUTCOMES.find((o) => o.key === outcome).th} · ${r.seconds} วิ`);
  if (idx < TASKS.length - 1) { idx++; renderTask(); } else renderTask();
}
async function persist() {
  try { await saveTaskRecord(rec); renderSummary(); }
  catch (e) { toast('บันทึกไม่สำเร็จ: ' + e.message, 'error', 8); }
}

$('tStart').onclick = startStop;
$('tReset').onclick = () => resetTimer(0);
$('prev').onclick = () => { keepNote(); if (idx > 0) { idx--; renderTask(); } };
$('next').onclick = () => { keepNote(); if (idx < TASKS.length - 1) { idx++; renderTask(); } };
$('note').onchange = () => { keepNote(); persist(); };
$('finish').onclick = async () => {
  keepNote(); await persist();
  const left = rec.tasks.filter((t) => !t.outcome).length;
  toast(left ? `บันทึกแล้ว (ยังไม่มีผล ${left} งาน)` : 'บันทึกครบ 8 งาน ต่อด้วยแบบสอบถาม', left ? 'warning' : 'success', 5);
  rec = null; resetTimer(0);
  $('wizard').classList.add('hidden'); $('setup').classList.remove('hidden');
  $('pid').value = ''; $('consent').checked = false;
};

// ---------- ตารางสรุปทุกคน ----------
async function renderSummary() {
  let list = [];
  try { list = await listTaskRecords(); } catch (e) { $('sumTable').innerHTML = `<tr><td class="alert">อ่านฐานข้อมูลไม่ได้: ${esc(e.message)}</td></tr>`; return; }
  const icon = (k) => OUTCOMES.find((o) => o.key === k)?.icon || '·';
  $('sumTable').innerHTML = `<thead><tr><th>รหัส</th>${TASKS.map((t) => `<th title="${esc(t.th)}">${t.id}</th>`).join('')}<th>ทำได้เอง</th><th></th></tr></thead><tbody>` +
    (list.length ? list.map((r) => `<tr><td>${esc(r.participant)}${r.demo ? ' <span class="muted">(DEMO)</span>' : ''}</td>${r.tasks.map((t) => `<td title="${t.seconds ?? ''} วิ">${icon(t.outcome)} <span class="muted">${t.seconds ?? ''}</span></td>`).join('')}
      <td class="n">${r.tasks.filter((t) => t.outcome === 'alone').length}/${TASKS.length}</td><td><button class="btn-glow danger small" data-del="${esc(r.participant)}">ลบ</button></td></tr>`).join('')
      : `<tr><td colspan="${TASKS.length + 3}" class="muted">ยังไม่มีบันทึก — เริ่มทดสอบคนแรกด้านบน</td></tr>`) + '</tbody>';
  $('sumTable').querySelectorAll('[data-del]').forEach((b) => (b.onclick = async () => {
    if (await modal(`<h3>ลบบันทึกของ ${esc(b.dataset.del)}?</h3>`, [{ label: 'ลบ', value: true, cls: 'danger' }, { label: 'ยกเลิก', value: false, cls: 'ghost' }])) { await deleteTaskRecord(b.dataset.del); renderSummary(); }
  }));
}
$('csv').onclick = async () => {
  const list = await listTaskRecords();
  if (!list.length) return toast('ยังไม่มีบันทึก', 'warning');
  downloadCSV('lab36-task-results.csv', taskRows(list), taskCols);
};

// ---------- รายการปัญหา (อย่างน้อย 5 ข้อ แก้อย่างน้อย 3) ----------
let issues = [];
async function renderIssues() {
  const fixed = issues.filter((i) => i.fixed).length;
  $('issueChip').innerHTML = `พบ <b>${issues.length}</b> / 5 · แก้แล้ว <b>${fixed}</b> / 3`;
  $('issueChip').className = 'chip ' + (issues.length >= 5 && fixed >= 3 ? 'ok' : 'warn');
  $('iBody').innerHTML = issues.map((it, i) => `<tr class="${it.fixed ? 'issue-done' : ''}"><td>${i + 1}</td><td>${esc(it.text)}</td><td class="n">${it.count}</td><td>${esc(it.severity)}</td>
    <td><input type="text" data-fix="${i}" value="${esc(it.fix || '')}" placeholder="วิธีแก้ / commit" style="min-height:44px;width:100%"></td>
    <td><input type="checkbox" data-done="${i}" ${it.fixed ? 'checked' : ''} aria-label="แก้แล้ว"></td><td><button class="btn-glow ghost small" data-rm="${i}">✕</button></td></tr>`).join('');
  const save = async () => { try { await saveIssues(issues); } catch (e) { toast('บันทึกไม่สำเร็จ ' + e.message, 'error'); } };
  $('iBody').querySelectorAll('[data-fix]').forEach((el) => (el.onchange = () => { issues[+el.dataset.fix].fix = el.value.trim(); save(); }));
  $('iBody').querySelectorAll('[data-done]').forEach((el) => (el.onchange = () => { issues[+el.dataset.done].fixed = el.checked; issues[+el.dataset.done].fixedAt = el.checked ? Date.now() : null; save(); renderIssues(); }));
  $('iBody').querySelectorAll('[data-rm]').forEach((el) => (el.onclick = () => { issues.splice(+el.dataset.rm, 1); save(); renderIssues(); }));
}
$('iAdd').onclick = async () => {
  const text = $('iText').value.trim();
  if (!text) return toast('พิมพ์ปัญหาก่อน', 'warning');
  issues.push({ text, count: +$('iCount').value || 1, severity: $('iSev').value, fix: '', fixed: false, createdAt: Date.now() });
  $('iText').value = '';
  await saveIssues(issues); renderIssues();
};
$('iCsv').onclick = () => issues.length ? downloadCSV('lab36-issues.csv', issues.map((it, i) => ({ no: i + 1, issue: it.text, participants: it.count, severity: it.severity, fix: it.fix, fixed: it.fixed ? 'yes' : 'no', fixed_date: it.fixedAt ? new Date(it.fixedAt).toISOString().slice(0, 10) : '' })))
  : toast('ยังไม่มีรายการ', 'warning');

// ---------- เริ่มหน้า ----------
try { issues = await loadIssues(); } catch (e) { toast('เปิดฐานข้อมูลไม่ได้: ' + e.message, 'error', 8); }
renderIssues();
renderSummary();
addEventListener('pagehide', () => { if (rec) { keepNote(); saveTaskRecord(rec); } });
