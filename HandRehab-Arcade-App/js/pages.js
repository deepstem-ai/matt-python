// ============================================================
// pages.js — หน้าใน index.html ที่สลับด้วย router: login (พาไป login.html), home, games (แอปรวม v2)
// หน้าใหญ่ (เข้าสู่ระบบ ลงทะเบียน เกม ประวัติ กราฟ ความสำเร็จ ปรับเทียบ ผู้ใช้) แยกเป็นไฟล์ HTML ของตัวเอง
// ใช้แถบบนแบบเดียวกัน (appbar.js) · หน้า settings อยู่ใน settings.js
// ============================================================
import { definePage, goTo, resetHistory } from './router.js';
import { setCurrentUser, getCurrentUser, listSessionsByUser } from './db.js';
import { dayKey } from './charts.js';
import { toast, esc } from './ui.js';
import { isLoggedIn, isGuest, endSession } from './session.js';
import { computeStreak, minutesByDay, MIN_MINUTES } from './streak.js';
import { ACHIEVEMENTS, AchievementBook } from './achievements.js';

const $ = (s) => document.querySelector(s);
export const PAGE_TH = { splash: 'หน้าเปิดแอป', login: 'เข้าสู่ระบบ', home: 'หน้าหลัก', games: 'เลือกเกม', settings: 'ตั้งค่า' };
export const GAME_TH = { 'star-portal': '⭐ จับดาวใส่ประตูมิติ', 'rhythm-tap': '🎵 เคาะจังหวะทีละนิ้ว', 'spread-wall': '🖐 กางนิ้วผ่านกำแพง' };
export { isLoggedIn };
const nameOf = (u) => [u?.firstName, u?.lastName].filter(Boolean).join(' ');

// ---------- login: หน้าจริงอยู่ที่ login.html ----------
definePage('login', {
  onEnter(data) {
    const next = data.next && data.next !== 'login' ? `?next=${encodeURIComponent('index.html#' + data.next)}` : '';
    location.href = 'login.html' + next;
  },
});

// ---------- home ----------
definePage('home', {
  requiresAuth: true,
  async onEnter() {
    const guest = isGuest();
    document.querySelectorAll('.user-only').forEach((el) => el.classList.toggle('hidden', guest));
    document.querySelectorAll('.guest-only').forEach((el) => el.classList.toggle('hidden', !guest));
    $('#guestNote').classList.toggle('hidden', !guest);
    $('#logoutText').textContent = guest ? 'เลิกเล่น / เข้าสู่ระบบ' : 'ออกจากระบบ';
    try {
      let uid = 'guest';
      if (guest) $('#hello').textContent = '🏠 สวัสดี ผู้เล่นรับเชิญ 👋';
      else {
        const u = await getCurrentUser();
        if (!u) { setCurrentUser(null); return goTo('login', { next: 'home' }, { replace: true, force: true }); }
        uid = u.id;
        $('#hello').textContent = `🏠 สวัสดี คุณ${nameOf(u)} 👋`;
        $('#enrolLink').href = 'enrol.html?user=' + encodeURIComponent(u.id);
      }
      const ss = (await listSessionsByUser(uid)).filter((s) => s.status !== 'in-progress');
      const today = dayKey(Date.now());
      const nToday = ss.filter((s) => dayKey(s.startTime) === today).length;
      const days = new Set(ss.map((s) => dayKey(s.startTime))).size;
      $('#homeStats').innerHTML = `<span class="chip">วันนี้ <b class="num">${nToday}</b> รอบ</span>
        <span class="chip">ฝึกมาแล้ว <b class="num">${days}</b> วัน</span><span class="chip">รวม <b class="num">${ss.length}</b> รอบ</span>`;
      // ไฟ streak (วันติดต่อกันที่ฝึก ≥ 5 นาที)
      const st = computeStreak(minutesByDay(ss));
      $('#streakNum').textContent = st.current;
      $('#flame').classList.toggle('out', st.current === 0);
      $('#todayMin').textContent = st.todayMinutes.toFixed(1);
      $('#todayBar').style.width = Math.min(100, (st.todayMinutes / MIN_MINUTES) * 100) + '%';
      $('#streakText').textContent = !st.current ? 'เริ่มนับวันนี้เลย! ฝึกวันละ 5 นาที'
        : st.todayDone ? `เก่งมาก! วันนี้ครบแล้ว ✔ · สถิติดีที่สุด ${st.best} วัน` : `วันนี้อีก ${Math.max(0, MIN_MINUTES - st.todayMinutes).toFixed(1)} นาที ไฟจะไม่ดับ · สถิติดีที่สุด ${st.best} วัน`;
      // เหรียญความสำเร็จ
      const book = await new AchievementBook(uid).load();
      $('#achCount').textContent = `${book.count}/${ACHIEVEMENTS.length}`;
      $('#achRow').innerHTML = ACHIEVEMENTS.map((a) => `<span class="${book.has(a.key) ? '' : 'locked'}" title="${esc(a.th)}">${a.icon}</span>`).join('');
    } catch (e) {
      $('#homeStats').innerHTML = `<div class="alert">อ่านข้อมูลไม่ได้: ${esc(e.message)} <button class="btn-glow small" onclick="location.reload()">↻ ลองใหม่</button></div>`;
    }
  },
});
$('#logout').addEventListener('click', () => {
  const wasGuest = isGuest();
  endSession();
  resetHistory();
  toast(wasGuest ? 'เลิกเล่นแบบไม่ลงทะเบียนแล้ว' : 'ออกจากระบบแล้ว', 'success');
  location.href = 'login.html';
});

definePage('games', { requiresAuth: true });
