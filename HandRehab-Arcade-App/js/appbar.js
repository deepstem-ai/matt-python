// ============================================================
// appbar.js — แถบบนหน้าตาเดียวกันทุกหน้าย่อยของแอป (Lab 34)
// หน้าที่แยกเป็นไฟล์ HTML ของตัวเอง (login, users, เกม ฯลฯ) ใส่ <script type="module" src="js/appbar.js">
// แล้วจะได้: ชื่อแอป · ตอนนี้อยู่หน้าไหน · ผู้ใช้ · ปุ่มเต็มจอ · ปุ่มย้อนกลับ · ปุ่มหน้าหลัก
// หน้าเครื่องมือวิจัย (<body data-hub="research">) ได้ปุ่ม "🔬 ห้องวิจัย" กลับไปหน้ารวม research.html
// และลงทะเบียน service worker ให้ด้วย (ทำงานออฟไลน์ + แจ้งเวอร์ชันใหม่)
// ============================================================
import { registerSW, markStandalone } from './pwa.js';
import { getCurrentUser } from './db.js';
import { esc } from './ui.js';
import { isGuest } from './session.js';   // แอปรวม v2: โหมดไม่ลงทะเบียน
import { loadFonts } from './assets.js';             // Lab 35: ฟอนต์ในเครื่องก่อน
import { initOfflineStatus } from './offline-status.js'; // Lab 35: ป้ายออนไลน์/ออฟไลน์มุมจอ

const title = document.body.dataset.title || document.title.split('·')[0].split('—')[0].trim();
const home = document.body.dataset.home || 'index.html#home';

const bar = document.createElement('header');
bar.className = 'app-bar';
bar.innerHTML = `<a class="brand" href="index.html#home">HandRehab Arcade</a>
  <span class="where">📍 ${esc(title)}</span>
  <span class="spacer"></span>
  <span class="chip" id="appUser">…</span>
  ${document.body.dataset.hub === 'research' ? '<a class="btn-glow ghost small" href="research.html"><span class="ico">🔬</span> ห้องวิจัย</a>' : ''}
  <button class="btn-glow ghost small" data-fullscreen><span class="ico">⛶</span> เต็มจอ</button>
  <button class="btn-glow ghost small" id="appBack"><span class="ico">↩</span> ย้อนกลับ</button>
  <a class="btn-glow ghost small" href="${esc(home)}"><span class="ico">🏠</span> หน้าหลัก</a>`;
document.body.prepend(bar);

// ย้อนกลับ: ถ้ามาจากหน้าในแอปเดียวกันใช้ประวัติเบราว์เซอร์ ไม่งั้นไปหน้าหลัก
bar.querySelector('#appBack').onclick = () => {
  const fromApp = document.referrer && new URL(document.referrer).origin === location.origin;
  if (fromApp && history.length > 1) history.back(); else location.href = home;
};

getCurrentUser()
  .then((u) => { bar.querySelector('#appUser').textContent = u ? `👤 ${u.firstName || ''} ${u.lastName || ''}`.trim() : isGuest() ? '🎮 ผู้เล่นรับเชิญ (guest)' : 'ยังไม่เข้าสู่ระบบ'; })
  .catch(() => { bar.querySelector('#appUser').textContent = 'ยังไม่เข้าสู่ระบบ'; });

markStandalone();
registerSW();
loadFonts();
initOfflineStatus();
