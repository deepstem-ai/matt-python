// ============================================================
// i18n.js — สลับภาษา ไทย / English สำหรับป้ายหลัก ๆ (Lab 09)
// วิธีใช้ใน HTML: <span data-i18n="nav.home">หน้าหลัก</span>
// ข้อความไทยอ่านจาก HTML เดิม (ไม่ต้องเขียนซ้ำ) ส่วนภาษาอังกฤษอยู่ในตาราง EN ด้านล่าง
// ============================================================
const EN = {
  listen: 'Listen', back: 'Back', help: 'Help', fakeLogin: 'Log in (test)', toGame: 'Next: play',
  'h.login': '🔐 Log in', 'h.register': '📝 Register', 'h.home': '🏠 Home', 'h.game': '🎮 Game',
  'h.progress': '📈 Progress', 'h.settings': '⚙ Settings',
  'nav.home': 'Home', 'nav.game': 'Game', 'nav.progress': 'Progress', 'nav.settings': 'Settings',
  settingsHint: 'Changes apply instantly, no restart. Your choices are remembered next time.',
  profile: 'Display profile', 'p.standard': 'Standard', 'p.elder': 'Senior (1.35× larger)', 'p.kiosk': 'Wall kiosk',
  textScale: 'Fine text size', theme: 'Colour theme', calm: 'Calm mode (stop all motion)', light: 'Light mode',
  speech: 'Read instructions aloud on each page', other: 'Other', lang: 'Language', sens: 'Hand gesture sensitivity',
  trans: 'Page transition', dur: 'Duration (ms)', tools: 'Check tools', audit: 'Accessibility audit (size + colour)',
  selftest: 'Switch pages 50 times', withCam: 'Include game page (camera on/off)', toHome: 'Next: back to Home',
};
// ชื่อหน้า (ใช้ในแถบบอกตำแหน่ง)
const PAGE_EN = { splash: 'Start', login: 'Log in', register: 'Register', home: 'Home', game: 'Game', progress: 'Progress', settings: 'Settings' };

let lang = 'th';

// เปลี่ยนภาษาทั้งหน้า
export function applyLang(l = 'th') {
  lang = l === 'en' ? 'en' : 'th';
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    if (el.dataset.th === undefined) el.dataset.th = el.textContent; // จำข้อความไทยเดิมไว้ครั้งแรก
    el.textContent = lang === 'en' ? (EN[el.dataset.i18n] ?? el.dataset.th) : el.dataset.th;
  });
}
export const currentLang = () => lang;
export const pageName = (name, thName) => (lang === 'en' ? PAGE_EN[name] || name : thName || name);
export const whereLabel = () => (lang === 'en' ? 'You are at: ' : 'คุณอยู่ที่: ');
