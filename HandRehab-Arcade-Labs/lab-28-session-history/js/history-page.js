// ============================================================
// history-page.js — หน้าประวัติการฝึก: การ์ดใหม่สุดก่อน · แตะเพื่อดูทุกท่า · ตัวกรอง · CSV · ลบ (Lab 28)
// ============================================================
import { applyPrefs, esc, toast, modal, downloadCSV } from './ui.js';
import { listSessionsByUser, listRepsBySession, deleteSession, getSettings, saveSettings, getCurrentUser } from './db.js';
import { mountUserPicker, currentUid, userName } from './user-picker.js';
import { generateDemoHistory, clearDemoHistory } from './demo-history.js';
import { moodIcon, MOODS } from './feeling.js';

applyPrefs();
const $ = (id) => document.getElementById(id);
const GAME = { 'star-portal': { icon: '⭐', th: 'จับดาวใส่ประตูมิติ', unit: 'ครั้งที่จีบ' }, 'rhythm-tap': { icon: '🎵', th: 'เคาะจังหวะทีละนิ้ว', unit: 'ครั้งที่แตะ' }, 'spread-wall': { icon: '🐠', th: 'กางนิ้วผ่านกำแพง', unit: 'กำแพง' } };
const pad = (n) => String(n).padStart(2, '0');
// วันเวลาแบบที่สเปรดชีตอ่านเป็นวันที่ได้ (เวลาท้องถิ่น)
const stamp = (t) => { if (!t) return ''; const d = new Date(t); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; };
const dayStr = (t) => stamp(t).slice(0, 10);
let all = [], shown = 40;

async function load() {
  $('list').innerHTML = '<p class="muted">กำลังโหลด…</p>';
  try { all = await listSessionsByUser(currentUid()); }
  catch (e) {
    $('list').innerHTML = `<div class="alert"><h3>อ่านฐานข้อมูลไม่ได้</h3><p>${esc(e.message)}</p><button id="retry" class="btn-glow">↻ ลองใหม่</button></div>`;
    $('retry').onclick = load; return;
  }
  shown = 40; render();
}

// ---------- ตัวกรอง ----------
function filtered() {
  const from = $('from').value, to = $('to').value, game = $('game').value, feel = $('feel').value, acc = +$('acc').value || 0;
  return all.filter((s) => {
    const d = dayStr(s.startTime), f = s.feeling;
    if (from && d < from) return false;
    if (to && d > to) return false;
    if (game && s.game !== game) return false;
    if (acc && !(s.accuracy < acc)) return false;
    if (feel === 'good' && !(f && f.mood >= 4)) return false;
    if (feel === 'bad' && !(f && f.mood <= 2)) return false;
    if (feel === 'pain' && !(f && f.pain >= 4)) return false;
    if (feel === 'none' && f) return false;
    return true;
  });
}
['from', 'to', 'game', 'feel', 'acc'].forEach((id) => { $(id).onchange = () => { shown = 40; render(); }; });
$('clearF').onclick = () => { ['from', 'to', 'game', 'feel', 'acc'].forEach((id) => { $(id).value = ''; }); render(); };

// ---------- การ์ด ----------
function card(s) {
  const g = GAME[s.game] || { icon: '🎮', th: s.game, unit: 'ครั้ง' }, min = s.endTime ? ((s.endTime - s.startTime) / 60000).toFixed(1) : '—';
  const f = s.feeling;
  return `<details class="sess" data-id="${esc(s.id)}">
    <summary><span class="g-icon" aria-hidden="true">${g.icon}</span>
      <div><div class="title">${esc(g.th)} ${s.details?.synthetic ? '<span class="tag-demo">จำลอง</span>' : ''} ${s.status === 'in-progress' ? '<span class="tag-live">ไม่จบรอบ</span>' : ''}</div>
        <div class="meta"><span>📅 <b>${new Date(s.startTime).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}</b></span><span>⏱ <b>${min}</b> นาที</span>
          <span>${esc(g.unit)} <b>${s.reps ?? 0}</b></span><span>แม่นยำ <b>${Math.round((s.accuracy || 0) * 100)}%</b></span><span>คะแนน <b>${s.score ?? 0}</b></span>
          ${Number.isFinite(s.maxSpreadDeg) ? `<span>กางสุด <b>${s.maxSpreadDeg}°</b></span>` : ''}
          <span>FPS <b>${s.avgFps ?? '—'}</b></span><span>แสง <b>${s.avgBrightness ?? '—'}</b>/255</span><span>${esc(s.delegate || '—')} · ${esc(typeof s.machine === 'string' ? s.machine : '—')}</span></div></div>
      <span class="feel" title="${f ? `ความรู้สึก ${f.mood}/5 · ปวด ${f.pain}/10` : 'ยังไม่ได้บันทึกความรู้สึก'}">${f ? moodIcon(f.mood) : '—'}${f && f.pain >= 4 ? '<br><small class="no">ปวด ' + f.pain + '</small>' : ''}</span></summary>
    <div class="body"><p class="muted">กำลังโหลดทุกท่า…</p></div></details>`;
}
function render() {
  const list = filtered(), repsSum = list.reduce((a, s) => a + (s.reps || 0), 0);
  $('summary').innerHTML = `แสดง <b>${list.length}</b> จาก ${all.length} เซสชัน · รวม <b>${repsSum}</b> ครั้ง`;
  if (!all.length) { $('list').innerHTML = '<div class="card-neon"><h3>ยังไม่มีประวัติ 🌱</h3><p>เล่นเกมสักรอบจากเมนูด้านบน หรือกด "🧪 สร้างประวัติจำลอง 30 วัน" เพื่อดูตัวอย่าง</p></div>'; return; }
  if (!list.length) { $('list').innerHTML = '<p class="muted">ไม่มีเซสชันตรงกับตัวกรอง</p>'; return; }
  $('list').innerHTML = list.slice(0, shown).map(card).join('') + (list.length > shown ? '<button id="more" class="btn-glow ghost">แสดงเพิ่ม</button>' : '');
  $('more')?.addEventListener('click', () => { shown += 40; render(); });
  $('list').querySelectorAll('details.sess').forEach((d) => d.addEventListener('toggle', () => { if (d.open) openCard(d); }));
}
// แตะการ์ด → โหลดทุกท่าของเซสชันนั้น
async function openCard(d) {
  const s = all.find((x) => x.id === d.dataset.id), body = d.querySelector('.body');
  let reps = [];
  try { reps = (await listRepsBySession(s.id)).sort((a, b) => (a.timestamp || a.t || 0) - (b.timestamp || b.t || 0)); }
  catch (e) { body.innerHTML = `<p class="no">โหลดท่าไม่ได้: ${esc(e.message)}</p>`; return; }
  const f = s.feeling;
  body.innerHTML = `${f ? `<p>ความรู้สึก: ${moodIcon(f.mood)} ${esc(MOODS.find((m) => m.v === f.mood)?.th || '')} · ปวด ${f.pain}/10 ${f.note ? '· 📝 ' + esc(f.note) : ''}</p>` : ''}
    <table class="data"><tr><th>#</th><th>เวลา</th><th>ท่า</th><th>คะแนนสูงสุด</th><th>ค้าง (ms)</th><th>สำเร็จ</th><th>มุม (°)</th><th>อื่น ๆ</th></tr>
    ${reps.map((r, i) => `<tr><td>${i + 1}</td><td>${r.timestamp ? new Date(r.timestamp).toLocaleTimeString('th-TH') : '—'}</td><td>${esc(r.gesture || '')}</td>
      <td>${r.peak ?? '—'}</td><td>${r.holdMs ?? '—'}</td><td class="${r.success === false ? 'no' : 'ok'}">${r.success === false ? '✗' : '✓'}</td><td>${r.angle ?? '—'}</td>
      <td class="muted">${esc([r.finger && 'นิ้ว ' + r.finger, r.result, r.reactionMs && r.reactionMs + ' ms'].filter(Boolean).join(' · '))}</td></tr>`).join('') || '<tr><td colspan="8" class="muted">ไม่มีท่าที่บันทึก</td></tr>'}</table>
    <div class="row" style="margin-top:12px"><button class="btn-glow danger small del">🗑 ลบเซสชันนี้</button></div>`;
  body.querySelector('.del').onclick = () => removeSession(s, reps.length);
}
async function removeSession(s, n) {
  const ok = await modal(`<h2>ลบเซสชันนี้?</h2><p>${esc(GAME[s.game]?.th || s.game)} · ${new Date(s.startTime).toLocaleString('th-TH')}<br>จะลบ 1 เซสชันและ ${n} ท่า <b>กู้คืนไม่ได้</b></p>`,
    [{ label: 'ยกเลิก', value: false, cls: 'ghost' }, { label: '🗑 ลบ', value: true, cls: 'danger' }]);
  if (!ok) return;
  try { await deleteSession(s.id); toast('ลบแล้ว', 'success'); all = all.filter((x) => x.id !== s.id); render(); }
  catch (e) { toast('ลบไม่สำเร็จ: ' + e.message, 'error', 5); }
}

// ---------- CSV (มี BOM เปิดใน Excel ภาษาไทยไม่เพี้ยน) ----------
async function who() {
  if ($('anon').checked) return 'P01';
  const u = await getCurrentUser().catch(() => null);
  return u ? `${currentUid()} (${userName(u)})` : currentUid();
}
$('csvS').onclick = async () => {
  const list = filtered(); if (!list.length) return toast('ไม่มีข้อมูลให้ส่งออก', 'warning');
  const user = await who(), anon = $('anon').checked;
  downloadCSV(`sessions-${anon ? 'anon' : currentUid()}.csv`, list.map((s) => ({
    session_id: s.id, user, game: s.game, start: stamp(s.startTime), end: stamp(s.endTime), duration_min: s.endTime ? +((s.endTime - s.startTime) / 60000).toFixed(2) : '',
    reps: s.reps, accuracy: s.accuracy, score: s.score, max_spread_deg: s.maxSpreadDeg ?? '', avg_fps: s.avgFps ?? '', avg_brightness: s.avgBrightness ?? '',
    machine: typeof s.machine === 'string' ? s.machine : '', delegate: s.delegate || '', mood_1_5: s.feeling?.mood ?? '', pain_0_10: s.feeling?.pain ?? '',
    note: anon ? '' : s.feeling?.note || '', status: s.status || 'done', synthetic: s.details?.synthetic ? 1 : 0 })));
};
$('csvR').onclick = async () => {
  const list = filtered(); if (!list.length) return toast('ไม่มีข้อมูลให้ส่งออก', 'warning');
  const user = await who(), rows = [];
  for (const s of list) for (const r of await listRepsBySession(s.id)) rows.push({
    session_id: s.id, user, game: s.game, timestamp: stamp(r.timestamp), t_ms: r.t ?? '', n: r.n ?? '', gesture: r.gesture || '', peak: r.peak ?? '', hold_ms: r.holdMs ?? '',
    success: r.success === false ? 0 : 1, angle_deg: r.angle ?? '', finger: r.finger || '', result: r.result || '', reaction_ms: r.reactionMs ?? '', synthetic: r.synthetic ? 1 : 0 });
  if (!rows.length) return toast('เซสชันที่เลือกไม่มีท่าที่บันทึก', 'warning');
  downloadCSV(`reps-${$('anon').checked ? 'anon' : currentUid()}.csv`, rows);
  window.__lastRepRows = rows.length;
};

// ---------- ชื่อเครื่อง + ข้อมูลจำลอง ----------
getSettings('machine').then((m) => { $('machine').value = m.name || ''; });
$('saveMachine').onclick = async () => {
  try { await saveSettings('machine', { name: $('machine').value.trim() }); toast('บันทึกชื่อเครื่องแล้ว เซสชันต่อไปจะใช้ชื่อนี้', 'success'); }
  catch (e) { toast('บันทึกไม่สำเร็จ: ' + e.message, 'error', 5); }
};
$('genDemo').onclick = async () => {
  $('genDemo').disabled = true;
  try { const r = await generateDemoHistory(currentUid()); toast(`สร้างข้อมูลจำลองแล้ว ${r.sessions} เซสชัน ${r.reps} ท่า`, 'success', 4); await load(); }
  catch (e) { toast('สร้างไม่สำเร็จ: ' + e.message, 'error', 5); }
  $('genDemo').disabled = false;
};
$('clearDemo').onclick = async () => {
  const ok = await modal('<h2>ลบข้อมูลจำลอง?</h2><p>ลบเฉพาะเซสชันที่มีป้าย "จำลอง" ของผู้เล่นนี้ ข้อมูลจริงไม่ถูกแตะ</p>', [{ label: 'ยกเลิก', value: false, cls: 'ghost' }, { label: '🧹 ลบ', value: true, cls: 'danger' }]);
  if (!ok) return;
  try { const r = await clearDemoHistory(currentUid()); toast(`ลบแล้ว ${r.sessions} เซสชัน ${r.reps} ท่า`, 'success'); await load(); }
  catch (e) { toast('ลบไม่สำเร็จ: ' + e.message, 'error', 5); }
};

mountUserPicker($('picker'), load);
load();
