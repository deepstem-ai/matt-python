// ============================================================
// app.js — จุดเริ่มแอป: ต่อปุ่มกับ router, แถบบอกตำแหน่ง, คีย์ลัด, ทดสอบสลับ 50 ครั้ง (Lab 07)
// Lab 08: เริ่มที่หน้า splash ซึ่งโหลดกล้อง/ฐานข้อมูล/โมเดล AI จริง แล้วพาไปหน้า login เอง
// ============================================================
import { initRouter, goTo, goBack, setTransition } from './router.js';
import { PAGE_TH, isLoggedIn } from './pages.js';
import './splash.js'; // หน้าเปิดแอปที่โหลดงานจริง (Lab 08)
import { isRunning } from './camera.js';
import { applyPrefs, loadPrefs, savePrefs, modal } from './ui.js';

const $ = (s) => document.querySelector(s);
applyPrefs();

// ---------- ปุ่มใด ๆ ที่มี data-go="ชื่อหน้า" ----------
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-go]');
  if (b) goTo(b.dataset.go);
});
$('#backBtn').addEventListener('click', () => goBack());

// ---------- แถบบอกตำแหน่ง + เส้นทาง (breadcrumb) + แถบล่าง ----------
function onChange(cur, hist) {
  document.body.classList.toggle('on-splash', cur.name === 'splash');
  $('#where').textContent = 'คุณอยู่ที่: ' + (PAGE_TH[cur.name] || cur.name);
  const trail = [...hist.slice(-3), cur.name];
  $('#crumbs').innerHTML = trail.map((n) => `<li>${PAGE_TH[n] || n}</li>`).join('');
  $('#backBtn').disabled = hist.length === 0;
  $('#userChip').innerHTML = isLoggedIn() ? '👤 <b>ผู้ใช้ทดสอบ</b>' : 'ยังไม่ล็อกอิน';
  document.querySelectorAll('[data-nav]').forEach((b) => {
    if (b.dataset.nav === cur.name) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
  // หน้าเปิดแอป / ล็อกอิน / ลงทะเบียน ไม่ต้องมีแถบล่าง
  $('#bottomNav').classList.toggle('hidden-nav', ['splash', 'login', 'register'].includes(cur.name));
  document.title = (PAGE_TH[cur.name] || cur.name) + ' — HandRehab Arcade';
}

// ---------- คีย์ลัด F1 = ช่วยเหลือ (Escape = ย้อนกลับ อยู่ใน router.js) ----------
function showHelp() {
  if (document.querySelector('.modal-back')) return;
  modal(`<h2>❓ ช่วยเหลือ</h2>
    <p><span class="kbd">Esc</span> ย้อนกลับหน้าก่อน · <span class="kbd">F1</span> เปิดหน้านี้ · <span class="kbd">Tab</span> เลื่อนไปปุ่มถัดไป · <span class="kbd">Enter</span> กดปุ่ม</p>
    <p>แถบล่างของจอมีปุ่มใหญ่ไปหน้าหลัก เกม ความก้าวหน้า และตั้งค่า</p>`, [{ label: '✔ เข้าใจแล้ว', value: true }]);
}
document.addEventListener('keydown', (e) => { if (e.key === 'F1') { e.preventDefault(); showHelp(); } });
$('#helpBtn').addEventListener('click', showHelp);

// ---------- ตั้งค่าการเปลี่ยนหน้า (จำไว้ใน prefs) ----------
const prefs = loadPrefs();
const trans = prefs.transition || 'fade', dur = prefs.transitionMs || 250;
$('#transSel').value = trans; $('#durSlider').value = dur; $('#durVal').textContent = dur;
$('#calmSw').checked = !!prefs.calm;
const saveTrans = () => {
  const t = $('#transSel').value, ms = +$('#durSlider').value;
  $('#durVal').textContent = ms;
  setTransition(t, ms);
  savePrefs({ transition: t, transitionMs: ms });
};
$('#transSel').addEventListener('change', saveTrans);
$('#durSlider').addEventListener('input', saveTrans);
$('#calmSw').addEventListener('change', (e) => savePrefs({ calm: e.target.checked }));

// ---------- ทดสอบ: สลับหน้า 50 ครั้ง วัดเวลาและหน่วยความจำ ----------
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));
// นับ element ทั้งหน้า (ไม่นับกล่องแจ้งเตือนลอยที่หายเองอยู่แล้ว)
const countNodes = () => document.getElementsByTagName('*').length - (document.querySelector('.toast-host')?.getElementsByTagName('*').length || 0);
const heapMB = () => (performance.memory ? performance.memory.usedJSHeapSize / 1048576 : null);
async function selfTest(n = 50, withCam = $('#withCam').checked) {
  const out = $('#testOut');
  out.className = 'alert warn'; out.textContent = 'กำลังทดสอบ...';
  if (!isLoggedIn()) { (await import('./db.js')).setCurrentUser('demo-user'); }
  const seq = withCam ? ['home', 'game', 'progress', 'settings'] : ['home', 'progress', 'settings'];
  const heap0 = heapMB(), nodes0 = countNodes();
  const times = [];
  const t0 = performance.now();
  for (let i = 0; i < n; i++) {
    const s = performance.now();
    await goTo(seq[i % seq.length], { testRun: i }, { force: true });
    await nextFrame(); // รอให้จอวาดจริง
    times.push(performance.now() - s);
  }
  await goTo('settings', {}, { force: true });
  const total = performance.now() - t0;
  const heap1 = heapMB(), nodes1 = countNodes();
  const first10 = avg(times.slice(0, 10)), last10 = avg(times.slice(-10));
  const r = {
    switches: n, totalMs: Math.round(total), avgMs: +avg(times).toFixed(1), maxMs: Math.round(Math.max(...times)),
    first10Ms: +first10.toFixed(1), last10Ms: +last10.toFixed(1),
    heapBeforeMB: heap0 && +heap0.toFixed(1), heapAfterMB: heap1 && +heap1.toFixed(1),
    domNodesBefore: nodes0, domNodesAfter: nodes1, cameraStillOn: isRunning(),
  };
  const slower = last10 > first10 * 2 + 5;
  out.className = 'alert ' + (slower || r.cameraStillOn ? 'warn' : 'ok');
  out.innerHTML = `สลับ ${n} ครั้งใน ${r.totalMs} ms · เฉลี่ย <b>${r.avgMs} ms</b>/ครั้ง (สูงสุด ${r.maxMs}) ·
    10 ครั้งแรก ${r.first10Ms} ms → 10 ครั้งหลัง ${r.last10Ms} ms ${slower ? '⚠ ช้าลง' : '✔ ไม่ช้าลง'}<br>
    หน่วยความจำ JS: ${heap0 ? `${r.heapBeforeMB} → ${r.heapAfterMB} MB` : 'เบราว์เซอร์นี้ไม่บอก (ใช้ Chrome หรือดู Task Manager)'} ·
    จำนวน element: ${nodes0} → ${nodes1} ${Math.abs(nodes1 - nodes0) <= 10 ? '✔ ไม่งอกเพิ่ม (ต่างเล็กน้อยจากแถบเส้นทาง)' : '⚠ งอกเพิ่ม อาจมีหน่วยความจำรั่ว'} ·
    กล้องหลังจบ: ${r.cameraStillOn ? '⚠ ยังเปิด' : '✔ ปิดแล้ว'}`;
  console.table(r);
  return r;
}
const avg = (a) => a.reduce((x, y) => x + y, 0) / (a.length || 1);
$('#selfTest').addEventListener('click', () => selfTest());

// ---------- เริ่มแอป ----------
initRouter({ start: 'splash', transition: trans, duration: dur, isLoggedIn, loginPage: 'login', onChange });
window.__lab07 = { goTo, goBack, selfTest, isRunning };
