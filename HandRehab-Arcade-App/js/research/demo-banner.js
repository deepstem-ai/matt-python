// ============================================================
// demo-banner.js — ใส่ป้ายเตือน "ลบข้อมูลจำลองก่อนเก็บข้อมูลวิจัย" บนหน้าเครื่องมือวิจัย (บทความ §6.2)
// ใช้: <script type="module" src="js/research/demo-banner.js"></script> ป้ายจะขึ้นบนสุดของ <main> เมื่อมีข้อมูลจำลอง
// ============================================================
import { demoBanner } from './research-data.js';

let host = document.getElementById('demoBanner');
if (!host) {
  host = document.createElement('div');
  host.id = 'demoBanner'; host.className = 'alert warn hidden'; host.style.margin = '0 0 var(--sp-3)';
  host.setAttribute('role', 'status');
  const main = document.querySelector('main') || document.body;
  const head = main.querySelector('header, .r-head, h1');
  if (head && head.parentElement === main) head.after(host); else main.prepend(host);
}
demoBanner(host);
