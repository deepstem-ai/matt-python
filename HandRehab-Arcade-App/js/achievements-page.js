// ============================================================
// achievements-page.js — หน้าสะสมความสำเร็จ อันที่ยังไม่ได้เป็นภาพเงา (Lab 26)
// ============================================================
import { applyPrefs, esc, modal, toast } from './ui.js';
import { ACHIEVEMENTS, AchievementBook } from './achievements.js';
import { mountUserPicker, currentUid } from './user-picker.js';

applyPrefs();
const $ = (id) => document.getElementById(id);
let book = null;

async function render() {
  book = await new AchievementBook(currentUid()).load();
  $('count').innerHTML = `ได้แล้ว <b>${book.count}</b>/${ACHIEVEMENTS.length}`;
  $('grid').innerHTML = ACHIEVEMENTS.map((a) => {
    const rec = book.earned.get(a.key);
    return `<article class="ach-card ${rec ? '' : 'locked'}" aria-label="${esc(a.th)} ${rec ? 'ได้แล้ว' : 'ยังไม่ได้'}">
      <span class="ach-icon" aria-hidden="true">${a.icon}</span>
      <span class="tag">${esc(a.level)}</span>
      <h3 style="margin:0">${esc(a.th)} <small class="muted">${esc(a.en)}</small></h3>
      <span><b>เงื่อนไข:</b> ${esc(a.how)}</span>
      <span class="muted">ทำไมสำคัญ: ${esc(a.why)}</span>
      <span class="${rec ? 'up' : 'muted'}">${rec ? '✔ ได้เมื่อ ' + new Date(rec.earnedAt).toLocaleString('th-TH') : '🔒 ยังไม่ได้'}</span>
    </article>`;
  }).join('');
}
$('resetBtn').onclick = async () => {
  const ok = await modal('<h2>ล้างความสำเร็จ?</h2><p>ความสำเร็จทั้งหมดของผู้เล่นนี้จะหายไป (ประวัติการฝึกไม่หาย)</p>',
    [{ label: 'ยกเลิก', value: false, cls: 'ghost' }, { label: '🗑 ล้าง', value: true, cls: 'danger' }]);
  if (!ok) return;
  try { await book.reset(); toast('ล้างแล้ว', 'success'); } catch (e) { toast('ล้างไม่สำเร็จ: ' + e.message, 'error', 5); }
  render();
};
mountUserPicker($('picker'), render);
render();
