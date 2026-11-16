// ============================================================
// register-form.js — อ่าน/เขียนค่าในฟอร์มลงทะเบียน (Lab 12)
// แปลงระหว่าง "ค่าบนหน้าจอ" ↔ "ระเบียนผู้ใช้" ที่เก็บใน db.js
// ============================================================
import { THAI_MONTHS, toChristianYear, toBuddhistYear, daysInMonth, toISODate, normalizePhone } from './validators.js';
import { CONDITIONS, GOALS, SURGERY } from './register-data.js';
import { esc } from './ui.js';

const $ = (id) => document.getElementById(id);
const radio = (name) => document.querySelector(`input[name=${name}]:checked`)?.value || '';
const setRadio = (name, v) => document.querySelectorAll(`input[name=${name}]`).forEach((r) => (r.checked = r.value === v));
export const isBE = () => $('eraBE').checked;

// ---------- สร้างตัวเลือกใน dropdown / รายการติ๊ก ----------
export function buildOptions() {
  $('bMonth').innerHTML = '<option value="">เดือน</option>' + THAI_MONTHS.map((m, i) => `<option value="${i + 1}">${m}</option>`).join('');
  fillYears();
  fillDays();
  $('condList').innerHTML = CONDITIONS.map((c) => `<label class="choice"><input type="checkbox" name="cond" value="${esc(c)}"> ${esc(c)}</label>`).join('')
    + '<label class="choice"><input type="checkbox" id="condNone"> ไม่มีโรคประจำตัว</label>';
  $('goal').innerHTML = '<option value="">— เลือกเป้าหมาย —</option>' + GOALS.map((g) => `<option value="${esc(g)}">${esc(g)}</option>`).join('');
  $('surgeryList').innerHTML = SURGERY.map((s) => `<label class="choice"><input type="radio" name="surgery" value="${s.value}"> ${s.label}</label>`).join('');
}

// ปีเกิด: ย้อนหลัง 1-120 ปี แสดงเป็น พ.ศ. หรือ ค.ศ. ตามสวิตช์ (value = ปีที่แสดง)
export function fillYears() {
  const sel = $('bYear');
  const keepCE = sel.value ? toChristianYear(sel.value) : null; // จำปีที่เลือกไว้เป็น ค.ศ. ก่อนสร้างใหม่
  const nowCE = new Date().getFullYear();
  let html = `<option value="">ปี ${isBE() ? 'พ.ศ.' : 'ค.ศ.'}</option>`;
  for (let y = nowCE - 1; y >= nowCE - 120; y--) {
    const shown = isBE() ? toBuddhistYear(y) : y;
    html += `<option value="${shown}">${shown}</option>`;
  }
  sel.innerHTML = html;
  if (keepCE) sel.value = String(isBE() ? toBuddhistYear(keepCE) : keepCE);
}

// วันที่: จำนวนวันตามเดือนและปีจริง (ก.พ. ปีอธิกสุรทินมี 29 วัน)
export function fillDays() {
  const sel = $('bDay'), keep = sel.value;
  const y = $('bYear').value ? toChristianYear($('bYear').value) : 2000; // ยังไม่เลือกปี → ใช้ปีอธิกสุรทินไว้ก่อน
  const n = $('bMonth').value ? daysInMonth(y, +$('bMonth').value) : 31;
  let html = '<option value="">วัน</option>';
  for (let d = 1; d <= n; d++) html += `<option value="${d}">${d}</option>`;
  sel.innerHTML = html;
  if (keep && +keep <= n) sel.value = keep; // ถ้าวันเดิมเกินจำนวนวัน (เช่น 31 → ก.พ.) ให้เลือกใหม่
}

// ---------- อ่านค่าทั้งหมดบนหน้าจอ (ใช้ทั้งตรวจ บันทึกร่าง และบันทึกจริง) ----------
export function readForm() {
  return {
    firstName: $('firstName').value.trim(), lastName: $('lastName').value.trim(),
    bDay: $('bDay').value, bMonth: $('bMonth').value, bYearCE: $('bYear').value ? toChristianYear($('bYear').value) : '',
    sex: radio('sex'), hand: radio('hand'),
    cond: [...document.querySelectorAll('input[name=cond]:checked')].map((c) => c.value),
    condNone: $('condNone').checked, conditionOther: $('conditionOther').value.trim(),
    tremor: +$('tremor').value, medication: $('medication').value.trim(),
    carer: $('carer').value.trim(), phone: $('phone').value.trim(),
    pain: +$('pain').value, goal: $('goal').value, goalOther: $('goalOther').value.trim(),
    surgery: radio('surgery'), surgeryDetail: $('surgeryDetail').value.trim(),
    filledBy: radio('filledBy'), filledByName: $('filledByName').value.trim(),
  };
}

// วันเกิดแบบ 'YYYY-MM-DD' (ค.ศ.) หรือ '' ถ้ายังเลือกไม่ครบ
export function birthISO(raw) {
  return raw.bDay && raw.bMonth && raw.bYearCE ? toISODate(raw.bYearCE, raw.bMonth, raw.bDay) : '';
}

// ---------- เขียนค่ากลับลงหน้าจอ (ใช้ตอนกู้ร่าง / แก้ไขผู้ใช้) ----------
export function writeForm(raw) {
  $('firstName').value = raw.firstName || ''; $('lastName').value = raw.lastName || '';
  $('bMonth').value = raw.bMonth || '';
  $('bYear').value = raw.bYearCE ? String(isBE() ? toBuddhistYear(raw.bYearCE) : raw.bYearCE) : '';
  fillDays();
  $('bDay').value = raw.bDay || '';
  setRadio('sex', raw.sex); setRadio('hand', raw.hand);
  document.querySelectorAll('input[name=cond]').forEach((c) => (c.checked = (raw.cond || []).includes(c.value)));
  $('condNone').checked = !!raw.condNone;
  $('conditionOther').value = raw.conditionOther || '';
  $('tremor').value = raw.tremor ?? 0; $('medication').value = raw.medication || '';
  $('carer').value = raw.carer || ''; $('phone').value = raw.phone || '';
  $('pain').value = raw.pain ?? 0; $('goal').value = raw.goal || ''; $('goalOther').value = raw.goalOther || '';
  setRadio('surgery', raw.surgery); $('surgeryDetail').value = raw.surgeryDetail || '';
  setRadio('filledBy', raw.filledBy); $('filledByName').value = raw.filledByName || '';
}

// ---------- แปลงเป็นระเบียนผู้ใช้ตามชื่อฟิลด์กลางของโปรเจกต์ ----------
export function toUser(raw, consentAt) {
  return {
    firstName: raw.firstName, lastName: raw.lastName, birthDate: birthISO(raw),
    sex: raw.sex, hand: raw.hand,
    conditions: raw.condNone ? [] : raw.cond, conditionOther: raw.conditionOther,
    tremor: raw.tremor, medication: raw.medication, carer: raw.carer,
    phone: normalizePhone(raw.phone), consentAt,
    extra: { // ข้อมูลเพิ่มเติมที่ทีมเลือกเก็บ (ขั้นที่ 3) + ใครเป็นคนกรอก
      painScore: raw.pain, goal: raw.goal, goalOther: raw.goalOther,
      handSurgery: raw.surgery, handSurgeryDetail: raw.surgeryDetail,
      noConditions: raw.condNone, filledBy: raw.filledBy, filledByName: raw.filledByName,
    },
  };
}

// ระเบียนผู้ใช้ → ค่าบนหน้าจอ (โหมดแก้ไข)
export function fromUser(u) {
  const [y, m, d] = (u.birthDate || '').split('-').map(Number);
  const x = u.extra || {};
  return {
    firstName: u.firstName, lastName: u.lastName, bDay: d ? String(d) : '', bMonth: m ? String(m) : '', bYearCE: y || '',
    sex: u.sex, hand: u.hand, cond: u.conditions || [], condNone: !!x.noConditions || (u.conditions || []).length === 0 && !u.conditionOther,
    conditionOther: u.conditionOther, tremor: u.tremor ?? 0, medication: u.medication, carer: u.carer, phone: u.phone,
    pain: x.painScore ?? 0, goal: x.goal, goalOther: x.goalOther, surgery: x.handSurgery, surgeryDetail: x.handSurgeryDetail,
    filledBy: x.filledBy, filledByName: x.filledByName,
  };
}
