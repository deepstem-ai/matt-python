// ============================================================
// research-hub.js — หน้ารวม research.html: นับข้อมูลในฐานข้อมูลของเครื่องนี้ ให้รู้ว่าพร้อมทำรายงานหรือยัง
// ============================================================
import { applyPrefs, esc } from '../ui.js';
import { readAppDatabase, STORE_TH } from './app-db-csv.js';
applyPrefs();

const $ = (id) => document.getElementById(id);
async function count() {
  try {
    const { report } = await readAppDatabase();
    $('dbChips').innerHTML = Object.entries(report).map(([k, n]) => `<span class="chip ${n ? 'ok' : ''}">${esc(STORE_TH[k])} <b>${n}</b></span>`).join('')
      + '<span class="muted">(รวมข้อมูลตัวอย่าง/จำลอง ซึ่งจะแยกเป็น DEMO- เวลาอ่าน)</span>';
  } catch (e) {
    $('dbChips').innerHTML = `<span class="alert">เปิดฐานข้อมูลไม่ได้: ${esc(e.message)} — ปิดแท็บอื่นของแอปแล้วกด "นับใหม่"</span>`;
  }
}
$('refresh').onclick = count;
count();
