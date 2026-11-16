// ============================================================
// parts-page.js — แท็บชิ้นส่วนหน้าจอ (Lab 06) ของ design-system.html
// ทดสอบ: hover ทุกชิ้น, สลับธีม (calm ต้องปิดทุกเอฟเฟกต์), สร้าง 100 ชิ้นแล้ววัด FPS, ตรวจ Tab
// ============================================================
import { loadPrefs, savePrefs, applyPrefs, isCalm, toast, makeRing, setRing, FpsMeter, cssVar } from '../ui.js';
import { click } from './click-sound.js';

const $ = (s) => document.querySelector(s);

// ---------- ตัววัด FPS ทำงานตลอดเวลา ----------
const meter = new FpsMeter();
const fpsLog = []; // เก็บค่า FPS ย้อนหลัง ไว้หาค่าเฉลี่ยตอนทดสอบหนัก
(function loop(now) {
  const f = meter.tick(now);
  if (meter.frames === 0 && f) { $('#fps').textContent = f; fpsLog.push(f); if (fpsLog.length > 30) fpsLog.shift(); }
  requestAnimationFrame(loop);
})(performance.now());
const countParts = () => { $('#count').textContent = document.querySelectorAll('.btn-glow, .card-neon, .chip, .ring').length; };

// ---------- ธีม ----------
function syncTheme() {
  const p = loadPrefs();
  document.querySelectorAll('[data-theme]').forEach((b) => {
    b.classList.toggle('ghost', b.dataset.theme !== p.theme);
    b.setAttribute('aria-pressed', b.dataset.theme === p.theme);
  });
  $('#lightSw6').checked = !!p.light;
  $('#soundSw').checked = !!p.clickSound;
  showEffects();
}
document.querySelectorAll('[data-theme]').forEach((b) => b.addEventListener('click', () => { savePrefs({ theme: b.dataset.theme }); syncTheme(); }));
$('#lightSw6').addEventListener('change', (e) => { savePrefs({ light: e.target.checked }); syncTheme(); });
$('#soundSw').addEventListener('change', (e) => { savePrefs({ clickSound: e.target.checked }); });

// พิสูจน์ว่า calm ปิดเอฟเฟกต์จริง: อ่านค่า CSS ที่เบราว์เซอร์ใช้อยู่ของชิ้นส่วนตัวอย่าง
function showEffects() {
  const btn = getComputedStyle($('.btn-glow:not(.ghost)'));
  const card = getComputedStyle($('.card-neon'));
  const ringFg = document.querySelector('#ringMain .ring-fg');
  const flame = getComputedStyle($('.flame'));
  const items = [
    ['แสงเรืองปุ่ม', btn.boxShadow !== 'none'],
    ['ทรานซิชัน hover', parseFloat(btn.transitionDuration) > 0],
    ['เบลอหลังการ์ด', card.backdropFilter && card.backdropFilter !== 'none' && !/blur\(0px\)/.test(card.backdropFilter)],
    ['เงาวงแหวน', ringFg && getComputedStyle(ringFg).filter !== 'none'],
    ['แอนิเมชันเปลวไฟ', flame.animationName !== 'none'],
  ];
  $('#fx').innerHTML = '<b>สถานะเอฟเฟกต์:</b> ' + items.map(([n, on]) => `<span class="${on ? 'on' : 'off'}">${on ? '● เปิด' : '○ ปิด'} ${n}</span>`).join(' · ')
    + (isCalm() ? ' — <b>โหมดสงบ: ต้องปิดทุกข้อ</b>' : '');
  return Object.fromEntries(items);
}

// ---------- วงแหวน ----------
const ring = $('#ringMain');
makeRing(ring, 35);
const setMain = (v) => {
  v = Math.max(0, Math.min(100, v));
  setRing(ring, v); ring.setAttribute('aria-valuenow', Math.round(v)); $('#ringSlider').value = v;
};
$('#ringSlider').addEventListener('input', (e) => setMain(+e.target.value));
$('#ringPlus').addEventListener('click', () => setMain(+$('#ringSlider').value + 10));
$('#ringMinus').addEventListener('click', () => setMain(+$('#ringSlider').value - 10));
$('#ringRand').addEventListener('click', () => setMain(Math.round(Math.random() * 100)));

// ---------- แจ้งเตือนลอย ----------
const MSG = { success: 'บันทึกผลการฝึกเรียบร้อยแล้ว', warning: 'แสงน้อยไปนิด ลองเปิดไฟเพิ่ม', error: 'ไม่พบมือในภาพ ลองยกมือให้อยู่กลางจอ' };
document.querySelectorAll('[data-toast]').forEach((b) => b.addEventListener('click', () => toast(MSG[b.dataset.toast], b.dataset.toast, 3)));

// ---------- ชิ้นส่วนพิเศษ ----------
let streak = 7;
$('#streakUp').addEventListener('click', () => {
  streak++;
  $('#streakN').textContent = streak;
  $('.flame').style.setProperty('--flame-size', Math.min(80, 30 + streak * 2) + 'px');
});
let energy = 40;
$('#energyBtn').addEventListener('click', () => { energy = energy >= 100 ? 10 : energy + 20; $('#energy > i').style.width = energy + '%'; });

// ---------- เสียงคลิก (ปิดเองในโหมดสงบ) ----------
document.addEventListener('click', (e) => {
  const b = e.target.closest('.btn-glow');
  if (!b || !loadPrefs().clickSound || isCalm()) return;
  click(b.classList.contains('success') ? 'success' : b.classList.contains('danger') ? 'danger' : b.classList.contains('ghost') ? 'ghost' : 'primary');
});

// ---------- ทดสอบหนัก: สร้าง 100 ชิ้น แล้ววัด FPS ----------
let spin = 0;
async function stressTest(n = 100) {
  const before = avgFps();
  const host = $('#stress');
  const frag = document.createDocumentFragment();
  for (let i = 0; i < n; i++) {
    const card = document.createElement('article');
    card.className = 'card-neon';
    card.innerHTML = `<div class="ring"></div><span class="chip">#<b>${host.children.length + i + 1}</b></span>
      <button class="btn-glow small ${['', 'success', 'danger', 'ghost'][i % 4]}"><span class="ico">★</span> ปุ่ม ${i + 1}</button>`;
    makeRing(card.querySelector('.ring'), Math.random() * 100);
    frag.appendChild(card);
  }
  host.appendChild(frag);
  countParts();
  // ให้วงแหวนขยับตลอด เพื่อให้เครื่องทำงานหนักจริง
  clearInterval(spin);
  spin = setInterval(() => host.querySelectorAll('.ring').forEach((r) => setRing(r, Math.random() * 100)), 700);
  fpsLog.length = 0;
  $('#report').className = 'alert warn'; $('#report').textContent = 'กำลังวัด FPS 4 วินาที...';
  await new Promise((r) => setTimeout(r, 4000));
  const after = avgFps(), min = fpsLog.length ? Math.min(...fpsLog) : 0;
  const ok = after >= 30;
  $('#report').className = 'alert ' + (ok ? 'ok' : 'warn');
  $('#report').innerHTML = `ชิ้นส่วนบนจอ ${$('#count').textContent} ชิ้น · FPS ก่อน ${before || '-'} → เฉลี่ยหลัง <b>${after}</b> (ต่ำสุด ${min})
    ${ok ? '✔ ลื่นพอ (≥ 30 FPS)' : '⚠ กระตุก ลองลดค่า --blur ใน tokens.css หรือใช้ธีม calm ก่อนแก้อย่างอื่น'}`;
  return { before, after, min, parts: +$('#count').textContent };
}
function avgFps() { return fpsLog.length ? Math.round(fpsLog.reduce((a, b) => a + b, 0) / fpsLog.length) : 0; }
$('#stressBtn').addEventListener('click', () => stressTest(100));
$('#clearBtn').addEventListener('click', () => { clearInterval(spin); $('#stress').innerHTML = ''; $('#report').classList.add('hidden'); countParts(); });

// ---------- ตรวจคีย์บอร์ด: ทุกชิ้นกด Tab ถึงไหม และปุ่มสูง ≥ 56px ไหม ----------
function tabAudit() {
  const all = [...document.querySelectorAll('button, [tabindex], input, select, a[href]')].filter((el) => el.offsetParent);
  const reachable = all.filter((el) => el.tabIndex >= 0 && !el.disabled);
  const min = parseFloat(cssVar('--btn-h')) || 56;
  const small = [...document.querySelectorAll('button')].filter((b) => b.offsetParent && b.getBoundingClientRect().height < 56);
  const noLabel = [...document.querySelectorAll('button')].filter((b) => !b.textContent.replace(/[^\p{L}\p{N}]/gu, '').length);
  const r = $('#report');
  r.className = 'alert ' + (small.length || noLabel.length ? '' : 'ok');
  r.innerHTML = `⌨ กด Tab ถึงได้ ${reachable.length} ชิ้น (จาก ${all.length} ชิ้นที่มองเห็น ส่วนที่เหลือปิดใช้งานอยู่) ·
    ปุ่มที่เตี้ยกว่า 56px: <b>${small.length}</b> · ปุ่มที่ไม่มีข้อความ: <b>${noLabel.length}</b> · ความสูงปุ่มตามธีมตอนนี้ ${min}px
    <ul><li>ลองเอง: คลิกที่ว่างบนหน้า แล้วกด Tab ไปเรื่อย ๆ ต้องเห็นวงโฟกัสสีหลักหนา 3px ทุกชิ้น</li></ul>`;
  reachable[0]?.focus();
  return { reachable: reachable.length, visible: all.length, small: small.length, noLabel: noLabel.length };
}
$('#tabBtn').addEventListener('click', tabAudit);

// ---------- เริ่ม ----------
applyPrefs();
syncTheme();
countParts();
// เปิดให้สคริปต์ทดสอบเรียกใช้ได้
window.__lab06 = { stressTest, tabAudit, showEffects, syncTheme };
