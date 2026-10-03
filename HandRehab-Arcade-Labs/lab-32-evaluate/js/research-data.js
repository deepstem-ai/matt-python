// ============================================================
// research-data.js — อ่านเซสชัน + รายชื่อจากฐานข้อมูล ให้หน้า counting / reliability (Lab 32)
//   และแสดงแถบเตือนถ้ามีข้อมูลสาธิตปนอยู่ (งานวิจัยต้องลบข้อมูลสาธิตก่อน)
// ============================================================
import { getAll, listUsers } from './db.js';
import { esc } from './ui.js';
import { isDemoSession } from './research.js';

// คืน { sessions, names: Map(userId → ชื่อ), demoCount } — ถ้าฐานข้อมูลเปิดไม่ได้ แสดงข้อความไทย + ปุ่มลองใหม่
export async function loadResearchData(onRetry) {
  const errBox = document.getElementById('dbError');
  try {
    const [sessions, users] = await Promise.all([getAll('sessions'), listUsers()]);
    errBox.innerHTML = '';
    const names = new Map(users.map((u) => [u.id, `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.id]));
    const demoCount = sessions.filter(isDemoSession).length;
    showDemoWarning(demoCount);
    return { sessions, names, demoCount };
  } catch (e) {
    errBox.innerHTML = `<div class="alert"><b>⚠️ เปิดฐานข้อมูลในเครื่องไม่ได้</b> <span class="muted">${esc(e?.message || String(e))}</span>
      <div class="row" style="margin-top:8px"><button class="btn-glow small" id="dbRetry">↻ ลองอีกครั้ง</button></div></div>`;
    document.getElementById('dbRetry').onclick = onRetry;
    return { sessions: [], names: new Map(), demoCount: 0 };
  }
}

// แถบเตือน: มีข้อมูลสาธิต (30 วันจำลอง / โหมดเมาส์) → ต้องลบก่อนเก็บข้อมูลวิจัยจริง
export function showDemoWarning(n) {
  const el = document.getElementById('demoWarn');
  el.classList.toggle('hidden', !n);
  el.innerHTML = n ? `<b>⚠️ มีข้อมูลสาธิต ${n} เซสชันในเครื่องนี้</b> — งานวิจัยต้อง <b>ลบข้อมูลสาธิตก่อน</b> (ปุ่ม "ลบข้อมูลสาธิต" ในหน้าประวัติ Lab 28-29)
    · ค่าเริ่มต้นของหน้านี้ไม่นำข้อมูลสาธิตมาคำนวณ` : '';
}

export const GAME_TH = { 'star-portal': 'จับดาว', 'rhythm-tap': 'แตะตามจังหวะ', 'spread-wall': 'กำแพงกางนิ้ว' };
export const fmtDate = (t) => (t ? new Date(t).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }) : '-');
