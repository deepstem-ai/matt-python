// ============================================================
// design-system.js — หน้าระบบออกแบบ: แท็บสี/ตัวอักษร (Lab 05) + แท็บชิ้นส่วนหน้าจอ (Lab 06)
// โค้ดของแต่ละแลปอยู่ในไฟล์เดิม (style-page.js, parts-page.js) ไฟล์นี้แค่สลับแท็บและซิงก์ธีมให้ตรงกัน
// ============================================================
import './style-page.js';
import './parts-page.js';

const $ = (id) => document.getElementById(id);
function showTab(t) {
  document.querySelectorAll('[data-tab]').forEach((b) => { const on = b.dataset.tab === t; b.classList.toggle('ghost', !on); b.setAttribute('aria-selected', on); });
  $('tab-colours').classList.toggle('hidden', t !== 'colours');
  $('tab-parts').classList.toggle('hidden', t !== 'parts');
  // ธีมอาจถูกเปลี่ยนจากอีกแท็บ → วาด/อ่านค่าใหม่ทุกครั้งที่สลับ
  if (t === 'parts') window.__lab06?.syncTheme(); else window.__lab05?.renderAll();
}
document.querySelectorAll('[data-tab]').forEach((b) => (b.onclick = () => showTab(b.dataset.tab)));
showTab(new URLSearchParams(location.search).get('tab') === 'parts' ? 'parts' : 'colours');
