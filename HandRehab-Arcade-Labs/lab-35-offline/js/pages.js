// ============================================================
// pages.js — หน้าใน index.html ที่สลับด้วย router: login (พาไป login.html), home, games, progress (Lab 34)
// หน้าใหญ่ที่มีโค้ดเยอะ (เข้าสู่ระบบ ลงทะเบียน เกม ผู้ใช้) แยกเป็นไฟล์ HTML ของตัวเอง ใช้แถบบนแบบเดียวกัน (appbar.js)
// ============================================================
import { definePage, goTo, resetHistory } from './router.js';
import { setCurrentUser, getCurrentUserId, getCurrentUser, listSessionsByUser } from './db.js';
import { lineChart, dayKey } from './charts.js';
import { toast, esc, downloadCSV, saveCanvasPNG } from './ui.js';

const $ = (s) => document.querySelector(s);
export const PAGE_TH = { splash: 'หน้าเปิดแอป', login: 'เข้าสู่ระบบ', home: 'หน้าหลัก', games: 'เลือกเกม', progress: 'ความก้าวหน้า', settings: 'ตั้งค่า' };
export const GAME_TH = { 'star-portal': '⭐ จับดาวใส่ประตูมิติ', 'rhythm-tap': '🎵 เคาะจังหวะทีละนิ้ว', 'spread-wall': '🖐 กางนิ้วผ่านกำแพง' };
export const isLoggedIn = () => !!getCurrentUserId();
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
    try {
      const u = await getCurrentUser();
      if (!u) { setCurrentUser(null); return goTo('login', { next: 'home' }, { replace: true, force: true }); }
      $('#hello').textContent = `🏠 สวัสดี คุณ${nameOf(u)} 👋`;
      $('#enrolLink').href = 'enrol.html?user=' + encodeURIComponent(u.id);
      const ss = await listSessionsByUser(u.id);
      const today = dayKey(Date.now());
      const nToday = ss.filter((s) => dayKey(s.startTime) === today).length;
      const days = new Set(ss.map((s) => dayKey(s.startTime))).size;
      $('#homeStats').innerHTML = `<span class="chip">วันนี้ฝึกแล้ว <b class="num">${nToday}</b> รอบ</span>
        <span class="chip">ฝึกมาแล้ว <b class="num">${days}</b> วัน</span><span class="chip">รวม <b class="num">${ss.length}</b> รอบ</span>`;
    } catch (e) {
      $('#homeStats').innerHTML = `<div class="alert">อ่านข้อมูลไม่ได้: ${esc(e.message)} <button class="btn-glow small" onclick="location.reload()">↻ ลองใหม่</button></div>`;
    }
  },
});
$('#logout').addEventListener('click', () => {
  setCurrentUser(null);
  resetHistory();
  toast('ออกจากระบบแล้ว', 'success');
  location.href = 'login.html';
});

definePage('games', { requiresAuth: true });

// ---------- progress: รายการทุกครั้ง + กราฟองศากางนิ้ว ----------
let rows = [];
definePage('progress', {
  requiresAuth: true,
  async onEnter() {
    try {
      const ss = (await listSessionsByUser(getCurrentUserId())).sort((a, b) => a.startTime - b.startTime);
      rows = ss.map((s) => ({
        date: new Date(s.startTime).toLocaleString('th-TH'), game: s.game, reps: s.reps ?? '', score: s.score ?? '',
        accuracy: s.accuracy != null ? Math.round(s.accuracy * 100) : '', minutes: s.endTime ? ((s.endTime - s.startTime) / 60000).toFixed(1) : '',
        maxSpreadDeg: s.maxSpreadDeg ?? s.details?.maxSpreadDeg ?? '', avgFps: s.avgFps ?? '',
      }));
      const byGame = (g) => ss.filter((s) => s.game === g).length;
      $('#progSummary').innerHTML = Object.keys(GAME_TH).map((g) => `<span class="chip">${GAME_TH[g]} <b class="num">${byGame(g)}</b> รอบ</span>`).join('');
      // กราฟ: องศากางนิ้วสูงสุดของแต่ละรอบเกมกางนิ้ว
      const sp = ss.filter((s) => s.game === 'spread-wall' && Number.isFinite(+(s.maxSpreadDeg ?? s.details?.maxSpreadDeg)));
      lineChart($('#spreadChart'), sp.map((s, i) => ({ label: String(i + 1), value: +(s.maxSpreadDeg ?? s.details?.maxSpreadDeg) })), {
        title: 'องศากางนิ้วสูงสุดในแต่ละรอบ', xLabel: 'รอบที่', yLabel: 'องศา', yMin: 0,
        emptyText: 'ยังไม่มีรอบของเกมกางนิ้วผ่านกำแพง ลองเล่นดูก่อน',
      });
      $('#sessTable').innerHTML = '<tr><th>วันเวลา</th><th>เกม</th><th>ครั้ง</th><th>คะแนน</th><th>แม่นยำ %</th><th>นาที</th><th>กางนิ้วสูงสุด °</th></tr>' +
        (rows.slice().reverse().slice(0, 50).map((r) => `<tr><td>${esc(r.date)}</td><td>${GAME_TH[r.game] || esc(r.game)}</td><td class="num">${r.reps}</td><td class="num">${r.score}</td><td class="num">${r.accuracy}</td><td class="num">${r.minutes}</td><td class="num">${r.maxSpreadDeg === '' ? '' : Math.round(r.maxSpreadDeg)}</td></tr>`).join('')
          || '<tr><td colspan="7" class="muted">ยังไม่มีการฝึก กดปุ่ม 🎮 เกม ที่แถบล่างเพื่อเริ่ม</td></tr>');
    } catch (e) {
      $('#progSummary').innerHTML = `<div class="alert">อ่านประวัติไม่ได้: ${esc(e.message)} <button class="btn-glow small" onclick="location.reload()">↻ ลองใหม่</button></div>`;
    }
  },
});
$('#spreadPng').addEventListener('click', () => saveCanvasPNG($('#spreadChart'), 'spread-progress.png'));
$('#sessCsv').addEventListener('click', () => {
  if (!rows.length) return toast('ยังไม่มีข้อมูล', 'warning');
  downloadCSV('my-sessions.csv', rows, Object.keys(rows[0]));
});
