// ============================================================
// users-dialogs.js — หน้าต่างดูรายละเอียด / ลบ / นำเข้า (Lab 13)
// การลบต้องยืนยัน 2 ชั้น: ติ๊กช่อง + พิมพ์ชื่อผู้ใช้ให้ตรงทุกตัวอักษร
// เพราะเป็นข้อมูลสุขภาพของคนจริง ลบผิดแล้วกู้คืนไม่ได้
// ============================================================
import { deleteUserCompletely, listSessionsByUser, ageOf, importAll } from './db.js';
import { modal, esc, toast } from './ui.js';
import { TREMOR_LEVELS, SEX_TH, HAND_TH } from './register-data.js';
import { formatPhone } from './validators.js';

const fmtDate = (t) => (t ? new Date(t).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }) : '-');
export const fullName = (u) => `${u.firstName || ''} ${u.lastName || ''}`.trim();

// ---------- ดูรายละเอียด ----------
export async function showDetails(u) {
  let sessions = [];
  try { sessions = await listSessionsByUser(u.id); } catch (e) { toast('อ่านประวัติการฝึกไม่ได้: ' + e.message, 'error'); }
  const x = u.extra || {};
  const row = (k, v) => `<tr><th>${k}</th><td>${esc(v ?? '-') || '-'}</td></tr>`;
  const html = `<h2>👤 ${esc(fullName(u))}</h2>
    <table class="data">
      ${row('อายุ / วันเกิด (ค.ศ.)', `${ageOf(u.birthDate) ?? '-'} ปี · ${u.birthDate || '-'}`)}
      ${row('เพศ / มือถนัด', `${SEX_TH[u.sex] || '-'} / ${HAND_TH[u.hand] || '-'}`)}
      ${row('โรคประจำตัว', [...(u.conditions || []), u.conditionOther].filter(Boolean).join(', ') || 'ไม่มี')}
      ${row('มือสั่น', `ระดับ ${u.tremor ?? 0} · ${TREMOR_LEVELS[u.tremor ?? 0]?.label || ''}`)}
      ${row('ยาประจำ', u.medication)}
      ${row('ผู้ดูแล / เบอร์ฉุกเฉิน', `${u.carer || '-'} / ${formatPhone(u.phone)}`)}
      ${row('ความปวด (0-10)', x.painScore)}
      ${row('เป้าหมาย', x.goal === 'อื่น ๆ' ? x.goalOther : x.goal)}
      ${row('ผ่าตัด/บาดเจ็บมือ', x.handSurgery === 'none' ? 'ไม่เคย' : `${x.handSurgery || '-'} ${x.handSurgeryDetail || ''}`)}
      ${row('ผู้กรอกฟอร์ม', x.filledBy === 'carer' ? `ผู้ดูแล: ${x.filledByName}` : x.filledBy === 'self' ? 'ผู้ใช้เอง' : '-')}
      ${row('ยินยอมเมื่อ', fmtDate(u.consentAt))}
      ${row('ลงทะเบียนเมื่อ', fmtDate(u.createdAt))}
      ${row('รหัสผู้ใช้', u.id)}
    </table>
    <h3 style="margin-top:var(--sp-4)">🎮 การฝึก ${sessions.length} ครั้ง (ล่าสุด 5 ครั้ง)</h3>
    ${sessions.length ? `<table class="data"><tr><th>วันที่</th><th>เกม</th><th>ครั้ง</th><th>แม่นยำ</th><th>คะแนน</th></tr>
      ${sessions.slice(0, 5).map((s) => `<tr><td>${fmtDate(s.startTime)}</td><td>${esc(s.game)}</td><td>${s.reps ?? '-'}</td><td>${s.accuracy != null ? Math.round(s.accuracy * 100) + '%' : '-'}</td><td>${s.score ?? '-'}</td></tr>`).join('')}</table>`
    : '<p class="muted">ยังไม่เคยฝึก</p>'}`;
  return modal(html, [{ label: 'ปิด', value: true }]);
}

// ---------- ลบแบบยืนยัน 2 ชั้น ----------
// คืนรายงานการลบ หรือ null ถ้ายกเลิก
export function confirmDelete(u) {
  return new Promise((resolve) => {
    const name = fullName(u);
    const back = document.createElement('div');
    back.className = 'modal-back';
    back.innerHTML = `<div class="modal" role="dialog" aria-modal="true">
      <h2>🗑️ ลบผู้ใช้ถาวร</h2>
      <div class="alert"><b>ลบแล้วกู้คืนไม่ได้</b> ระบบจะลบข้อมูลส่วนตัว ภาพใบหน้า ประวัติการฝึกทั้งหมด และการตั้งค่าของ <b>${esc(name)}</b></div>
      <label class="choice" style="width:100%;margin-top:var(--sp-3)"><input type="checkbox" id="delChk"> ① ฉันเข้าใจว่าข้อมูลทั้งหมดจะหายถาวร</label>
      <div class="field" style="margin-top:var(--sp-3)">
        <label for="delName">② พิมพ์ชื่อ-นามสกุลให้ตรง: <code>${esc(name)}</code></label>
        <input id="delName" type="text" autocomplete="off" disabled>
      </div>
      <div class="row" style="justify-content:flex-end">
        <button class="btn-glow ghost" id="delCancel">ยกเลิก</button>
        <button class="btn-glow danger" id="delGo" disabled>ลบถาวร</button>
      </div></div>`;
    document.body.appendChild(back);
    const chk = back.querySelector('#delChk'), inp = back.querySelector('#delName'), go = back.querySelector('#delGo');
    const check = () => {
      inp.disabled = !chk.checked;
      const same = inp.value.trim().replace(/\s+/g, ' ') === name;
      inp.classList.toggle('valid', same); inp.classList.toggle('invalid', !!inp.value && !same);
      go.disabled = !(chk.checked && same);
    };
    chk.onchange = () => { check(); if (chk.checked) inp.focus(); };
    inp.oninput = check;
    back.querySelector('#delCancel').onclick = () => { back.remove(); resolve(null); };
    go.onclick = async () => {
      go.disabled = true; go.textContent = 'กำลังลบ…';
      try {
        const report = await deleteUserCompletely(u.id);
        back.remove();
        resolve(report);
      } catch (e) {
        back.remove();
        await modal(`<h3>⚠️ ลบไม่สำเร็จ</h3><p>${esc(e.message)}</p><p>ปิดแท็บอื่นของแอปแล้วลองใหม่</p>`);
        resolve(null);
      }
    };
    chk.focus();
  });
}

// แสดงรายงานว่าลบอะไรไปกี่รายการ
const STORE_TH = { users: 'ข้อมูลผู้ใช้', faces: 'ภาพ/ค่าใบหน้า', sessions: 'ประวัติการฝึก', reps: 'ท่าที่บันทึก', settings: 'การตั้งค่า', achievements: 'รางวัล', calibration: 'ค่าปรับเทียบ', surveys: 'แบบสอบถาม' };
export function showDeleteReport(name, report) {
  const rows = Object.entries(report).map(([k, n]) => `<tr><td>${STORE_TH[k] || k}</td><td class="num">${n}</td></tr>`).join('');
  const total = Object.values(report).reduce((a, b) => a + b, 0);
  return modal(`<h2>✅ ลบ ${esc(name)} เรียบร้อย</h2><p>ลบทั้งหมด <b class="num">${total}</b> รายการ ไม่มีข้อมูลของบุคคลนี้เหลือในเครื่อง</p>
    <table class="data" id="delReport"><tr><th>ประเภท</th><th>จำนวนที่ลบ</th></tr>${rows}</table>`, [{ label: 'ตกลง', value: true }]);
}

// ---------- นำเข้าไฟล์สำรอง ----------
export async function importFromFile(file) {
  try {
    const data = JSON.parse(await file.text());
    if (!data?.stores?.users) throw new Error('ไฟล์นี้ไม่ใช่ไฟล์สำรองของ HandRehab Arcade');
    const n = data.stores.users.length, s = (data.stores.sessions || []).length;
    const ok = await modal(`<h3>📥 นำเข้าข้อมูล</h3><p>ไฟล์ <b>${esc(file.name)}</b> มีผู้ใช้ ${n} คน การฝึก ${s} ครั้ง (สำรองเมื่อ ${esc(data.exportedAt || '-')})</p><p class="muted">รายการที่รหัสซ้ำจะถูกเขียนทับด้วยข้อมูลในไฟล์</p>`,
      [{ label: 'นำเข้า', value: true, cls: 'success' }, { label: 'ยกเลิก', value: false, cls: 'ghost' }]);
    if (!ok) return null;
    return await importAll(data);
  } catch (e) {
    console.error('[users] นำเข้าไม่สำเร็จ', e);
    await modal(`<h3>⚠️ นำเข้าไม่สำเร็จ</h3><p>${esc(e instanceof SyntaxError ? 'ไฟล์เสียหรือไม่ใช่ไฟล์ JSON' : e.message)}</p>`);
    return null;
  }
}
