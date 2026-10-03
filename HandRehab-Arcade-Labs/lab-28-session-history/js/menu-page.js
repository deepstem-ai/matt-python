// ============================================================
// menu-page.js — เมนูเกม + ไฟ streak + แถวความสำเร็จ (Lab 26)
// ============================================================
import { applyPrefs, isCalm, loadPrefs, savePrefs, esc } from './ui.js';
import { ACHIEVEMENTS, AchievementBook } from './achievements.js';
import { MIN_MINUTES } from './streak.js';
import { streakInfo, streakText } from './juice-page.js';
import { mountUserPicker, currentUid } from './user-picker.js';

applyPrefs();
const $ = (id) => document.getElementById(id);

// ปุ่มโหมดสงบ (สวิตช์หลักปิดเอฟเฟกต์ทั้งหมด)
const paintCalm = () => { $('calmBtn').textContent = isCalm() ? '🌙 สงบ: เปิด' : '🌙 สงบ: ปิด'; };
$('calmBtn').onclick = () => { savePrefs({ calm: !loadPrefs().calm }); paintCalm(); };
paintCalm();

async function refresh() {
  const uid = currentUid();
  const st = await streakInfo(uid);
  $('streakNum').textContent = st.current;
  $('streakBest').textContent = st.best;
  $('streakText').textContent = streakText(st);
  $('flame').classList.toggle('out', st.current === 0);         // ยังไม่มี streak → ไฟสีเทา
  $('todayMin').textContent = st.todayMinutes.toFixed(1);
  $('todayBar').style.width = Math.min(100, (st.todayMinutes / MIN_MINUTES) * 100) + '%';

  const book = await new AchievementBook(uid).load();
  $('achCount').textContent = `${book.count}/${ACHIEVEMENTS.length}`;
  $('achRow').innerHTML = ACHIEVEMENTS.map((a) => `<span class="${book.has(a.key) ? '' : 'locked'}" title="${esc(a.th)} — ${esc(a.how)}">${a.icon}</span>`).join('');
}
mountUserPicker($('picker'), refresh);
refresh();
