// ============================================================
// app.js — จุดเริ่มของแอปรวม HandRehab Arcade (Lab 34)
// index.html = แอปหน้าเดียว: splash → (login.html) → home → games / progress / settings
// หน้าใหญ่ที่มีไฟล์ของตัวเอง: login, register, enrol, pin, users, เกม 3 เกม, benchmark (แถบบนเหมือนกันด้วย appbar.js)
// ที่อยู่ index.html#home / #games / #progress / #settings เปิดตรงไปหน้านั้นได้ (หน้าย่อยใช้กลับมา)
// ============================================================
import { initRouter, goTo, goBack, currentPage, history } from './router.js';
import { PAGE_TH, isLoggedIn } from './pages.js';
import './splash.js';
import './settings.js';
import { getCurrentUser } from './db.js';
import { applyPrefs } from './ui.js';
import { registerSW, markStandalone } from './pwa.js';
import { loadFonts } from './assets.js';             // Lab 35: ฟอนต์ในเครื่องก่อน
import { initOfflineStatus, openPanel } from './offline-status.js'; // Lab 35: ป้ายสถานะมุมจอ

const $ = (s) => document.querySelector(s);
applyPrefs();
markStandalone();
registerSW();
loadFonts();
initOfflineStatus();
document.getElementById('assetsBtn')?.addEventListener('click', openPanel);

// ปุ่มใด ๆ ที่มี data-go="ชื่อหน้า"
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-go]');
  if (b) goTo(b.dataset.go);
});
$('#backBtn').addEventListener('click', () => goBack());
window.addEventListener('prefs-changed', () => applyPrefs());

// แถบบอกตำแหน่ง + แถบล่าง + ที่อยู่ #หน้า
async function onChange(cur, hist) {
  document.body.classList.toggle('on-splash', cur.name === 'splash');
  $('#where').textContent = PAGE_TH[cur.name] || cur.name;
  $('#backBtn').disabled = hist.length === 0;
  document.querySelectorAll('[data-nav]').forEach((b) => {
    if (b.dataset.nav === cur.name) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
  $('#bottomNav').classList.toggle('hidden-nav', ['splash', 'login'].includes(cur.name));
  document.title = (PAGE_TH[cur.name] || '') + ' · HandRehab Arcade';
  if (cur.name !== 'splash' && cur.name !== 'login' && location.hash !== '#' + cur.name) window.history.replaceState(null, '', '#' + cur.name);
  try {
    const u = isLoggedIn() ? await getCurrentUser() : null;
    $('#userChip').textContent = u ? `👤 ${u.firstName || ''} ${u.lastName || ''}`.trim() : 'ยังไม่เข้าสู่ระบบ';
  } catch { $('#userChip').textContent = 'ยังไม่เข้าสู่ระบบ'; }
}

// กด ย้อนกลับ/ไปข้างหน้า ของเบราว์เซอร์ หรือแก้ #หน้า เอง
window.addEventListener('hashchange', () => {
  const name = location.hash.slice(1);
  if (name && PAGE_TH[name] && currentPage()?.name !== name) goTo(name);
});

// ---------- เริ่มแอป ----------
// splash รันครั้งเดียวต่อการเปิดเบราว์เซอร์ (sessionStorage) กลับมาจากหน้าย่อยจะไปหน้าที่ขอทันที
const want = location.hash.slice(1);
let splashDone = false;
try { splashDone = !!sessionStorage.getItem('hr-splash-done'); } catch { /* ไม่เป็นไร */ }
const start = !splashDone ? 'splash' : (PAGE_TH[want] && want !== 'splash' ? want : 'home');
initRouter({ isLoggedIn, loginPage: 'login', onChange, transition: 'fade', duration: 200 });
goTo(start, start === 'splash' ? { next: PAGE_TH[want] && !['splash', 'login'].includes(want) ? want : null } : {});
window.__app = { goTo, goBack, currentPage, history };
