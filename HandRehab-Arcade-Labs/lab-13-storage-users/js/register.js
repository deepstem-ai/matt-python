// ============================================================
// register.js — ฟอร์มลงทะเบียน 4 ขั้นที่ "กรอกผิดไม่ได้" (Lab 12)
//  - ตรวจขณะพิมพ์ ขอบเขียว = ถูก ขอบแดง = ผิด (สีจาก --success / --error)
//  - ขั้นนี้ยังไม่ครบ → ปุ่ม "ถัดไป" กดไม่ได้ พร้อมบอกว่ายังขาดอะไร
//  - บันทึกร่างอัตโนมัติใน localStorage ปิดแอปกลางคันแล้วกลับมาทำต่อได้
//  - บันทึกจริงลง IndexedDB ผ่าน db.js หลังยอมรับความยินยอมเท่านั้น
//  - ?edit=<id> = โหมดแก้ไขผู้ใช้เดิม (Lab 13 ใช้หน้านี้ซ้ำ)
// ============================================================
import { validateName, validateBirthDate, validatePhone, formatPhone } from './validators.js';
import { TREMOR_LEVELS, painText, SEX_TH, HAND_TH } from './register-data.js';
import { buildOptions, fillYears, fillDays, readForm, writeForm, birthISO, toUser, fromUser } from './register-form.js';
import { openConsent } from './consent.js';
import { createUser, getUser, updateUser } from './db.js';
import { toast, modal, esc } from './ui.js';

const $ = (id) => document.getElementById(id);
const DRAFT_KEY = 'hr-register-draft';
const STEPS = 4;
let step = 1;
let consentAt = null;               // เวลาที่ยอมรับความยินยอม (ms)
let editId = new URLSearchParams(location.search).get('edit');
let origUser = null;              // ผู้ใช้เดิม (โหมดแก้ไข) เก็บไว้รวม extra ที่หน้านี้ไม่รู้จัก
let showAll = false;                // true = กด "ถัดไป" แล้ว ให้แสดงข้อผิดพลาดทุกช่อง
const touched = new Set();          // ช่องที่ผู้ใช้แตะแล้ว (ยังไม่แตะ = ยังไม่ขึ้นสีแดง)
let lastDraftToast = 0, draftTimer = 0, saved = false;

// ---------- กติกาของแต่ละขั้น: คืน [{ key, ok, msg, label }] ----------
function checks(n, r) {
  const c = [];
  const add = (key, label, res) => c.push({ key, label, ok: res.ok, msg: res.msg || '' });
  const need = (v, msg) => ({ ok: !!v, msg: v ? '' : msg });
  if (n === 1) {
    add('firstName', 'ชื่อ', validateName(r.firstName));
    add('lastName', 'นามสกุล', validateName(r.lastName));
    add('birth', 'วันเกิด', validateBirthDate(birthISO(r)));
    add('sex', 'เพศ', need(r.sex, 'กรุณาเลือกเพศ'));
    add('hand', 'มือข้างที่ถนัด', need(r.hand, 'กรุณาเลือกมือข้างที่ถนัด'));
  } else if (n === 2) {
    const any = r.cond.length || r.conditionOther;
    add('cond', 'โรคประจำตัว', r.condNone && any ? { ok: false, msg: 'เลือก "ไม่มีโรคประจำตัว" คู่กับโรคอื่นไม่ได้' }
      : need(any || r.condNone, 'กรุณาเลือกอย่างน้อย 1 ข้อ (หรือ "ไม่มีโรคประจำตัว")'));
    add('carer', 'ชื่อผู้ดูแล', r.carer ? validateName(r.carer) : { ok: true });
    add('phone', 'เบอร์ติดต่อฉุกเฉิน', validatePhone(r.phone));
  } else if (n === 3) {
    add('goal', 'เป้าหมาย', need(r.goal, 'กรุณาเลือกเป้าหมาย'));
    if (r.goal === 'อื่น ๆ') add('goalOther', 'เป้าหมายอื่น ๆ', need(r.goalOther.length >= 2, 'กรุณาเขียนเป้าหมายสั้น ๆ'));
    add('surgery', 'ประวัติผ่าตัดมือ', need(r.surgery, 'กรุณาเลือก 1 ข้อ'));
  } else if (n === 4) {
    add('filledBy', 'ผู้กรอกฟอร์ม', need(r.filledBy, 'กรุณาเลือกว่าใครเป็นคนกรอก'));
    if (r.filledBy === 'carer') add('filledByName', 'ชื่อผู้กรอกแทน', validateName(r.filledByName));
    add('consent', 'ความยินยอม', need(consentAt, 'ต้องอ่านและยอมรับความยินยอมก่อนบันทึก'));
  }
  return c;
}
const stepOk = (n, r = readForm()) => checks(n, r).every((x) => x.ok);

// ---------- ระบายสีขอบ + ข้อความผิด ----------
const FIELD_EL = { birth: ['bDay', 'bMonth', 'bYear'], sex: ['sexSet'], hand: ['handSet'], cond: ['condSet'], surgery: ['surgerySet'], filledBy: ['filledBySet'], consent: ['consentCard'] };
function paint(list) {
  for (const x of list) {
    const show = showAll || touched.has(x.key);
    for (const id of FIELD_EL[x.key] || [x.key]) {
      const el = $(id); if (!el) continue;
      el.classList.toggle('valid', show && x.ok);
      el.classList.toggle('invalid', show && !x.ok);
    }
    const err = document.querySelector(`[data-err="${x.key}"]`);
    if (err) err.textContent = show && !x.ok ? x.msg : '';
  }
}

// ---------- อัปเดตหน้าจอทุกครั้งที่มีการเปลี่ยนแปลง ----------
function update() {
  const r = readForm();
  const list = checks(step, r);
  paint(list);
  const missing = list.filter((x) => !x.ok).map((x) => x.label);
  $('btnNext').disabled = missing.length > 0;
  $('missing').textContent = missing.length ? 'ยังขาด: ' + missing.join(', ') : '✓ ขั้นนี้ครบแล้ว';
  $('missing').className = missing.length ? 'muted' : 'ok-text';
  // อายุ แสดงทันทีที่เลือกครบ 3 ช่อง
  const b = validateBirthDate(birthISO(r));
  $('ageOut').textContent = birthISO(r) ? (b.ok ? `อายุ ${b.age} ปี` : b.msg) : 'อายุ __ ปี';
  $('ageOut').classList.toggle('bad', !!birthISO(r) && !b.ok);
  // คำอธิบายแถบเลื่อน
  const t = TREMOR_LEVELS[r.tremor];
  $('tremorText').textContent = `ระดับ ${r.tremor} · ${t.label} — ${t.text}`;
  $('painVal').textContent = r.pain;
  $('painText').textContent = painText(r.pain);
  $('goalOtherWrap').classList.toggle('hidden', r.goal !== 'อื่น ๆ');
  $('surgeryDetailWrap').classList.toggle('hidden', !r.surgery || r.surgery === 'none');
  $('filledByNameWrap').classList.toggle('hidden', r.filledBy !== 'carer');
  $('btnSave').disabled = ![1, 2, 3, 4].every((n) => stepOk(n, r));
  if (step === 4) renderSummary(r);
  renderCrumbs();
  scheduleDraft(r);
}

// ---------- เปลี่ยนขั้น ----------
function goTo(n) {
  // ไปข้างหน้าได้เฉพาะเมื่อทุกขั้นก่อนหน้าครบแล้ว
  for (let i = 1; i < n; i++) if (!stepOk(i)) { n = i; break; }
  step = Math.max(1, Math.min(STEPS, n));
  showAll = false;
  document.querySelectorAll('.step').forEach((s) => s.classList.toggle('hidden', +s.dataset.step !== step));
  $('stepNo').textContent = step;
  $('btnBack').classList.toggle('hidden', step === 1);
  $('btnNext').classList.toggle('hidden', step === STEPS);
  $('btnSave').classList.toggle('hidden', step !== STEPS);
  update();
  window.scrollTo({ top: 0 });
  document.querySelector(`.step[data-step="${step}"] h2`)?.focus();
}

function renderCrumbs() {
  document.querySelectorAll('#crumbs li').forEach((li) => {
    const n = +li.dataset.step;
    li.classList.toggle('current', n === step);
    li.classList.toggle('done', n !== step && stepOk(n));
  });
}

function renderSummary(r) {
  const row = (k, v) => `<tr><th>${k}</th><td>${esc(v || '-')}</td></tr>`;
  const b = validateBirthDate(birthISO(r));
  $('summary').innerHTML = row('ชื่อ-นามสกุล', `${r.firstName} ${r.lastName}`) + row('วันเกิด (ค.ศ.)', `${birthISO(r)} (อายุ ${b.age ?? '-'} ปี)`)
    + row('เพศ / มือถนัด', `${SEX_TH[r.sex] || '-'} / ${HAND_TH[r.hand] || '-'}`)
    + row('โรคประจำตัว', r.condNone ? 'ไม่มี' : [...r.cond, r.conditionOther].filter(Boolean).join(', '))
    + row('มือสั่น', TREMOR_LEVELS[r.tremor].label) + row('ยาประจำ', r.medication)
    + row('ผู้ดูแล / เบอร์ฉุกเฉิน', `${r.carer || '-'} / ${formatPhone(r.phone)}`)
    + row('ความปวด', `${r.pain}/10`) + row('เป้าหมาย', r.goal === 'อื่น ๆ' ? r.goalOther : r.goal);
}

// ---------- ร่างอัตโนมัติ ----------
function scheduleDraft(r) {
  if (editId || saved) return;              // โหมดแก้ไข / บันทึกแล้ว ไม่ใช้ร่าง
  clearTimeout(draftTimer);
  draftTimer = setTimeout(() => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ step, data: r, savedAt: Date.now() })); } catch { return; }
    if (Date.now() - lastDraftToast > 20000 && r.firstName) { toast('💾 บันทึกร่างแล้ว', 'success', 2); lastDraftToast = Date.now(); }
  }, 600);
}
function readDraft() { try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); } catch { return null; } }
function clearDraft() { try { localStorage.removeItem(DRAFT_KEY); } catch { /* ไม่เป็นไร */ } }

// ---------- ความยินยอม ----------
async function askConsent() {
  const t = await openConsent();
  if (t) { consentAt = t; toast('ยอมรับความยินยอมแล้ว ✓'); }
  touched.add('consent');
  showConsent();
  update();
}
function showConsent() {
  $('consentState').textContent = consentAt ? `✅ ยินยอมแล้วเมื่อ ${new Date(consentAt).toLocaleString('th-TH')}` : '⏳ ยังไม่ได้ยอมรับ';
}

// ---------- บันทึกจริง ----------
async function save() {
  const r = readForm();
  if (![1, 2, 3, 4].every((n) => stepOk(n, r))) { toast('ข้อมูลยังไม่ครบ', 'error'); return; }
  $('btnSave').disabled = true;
  try {
    const data = toUser(r, consentAt);
    if (origUser) data.extra = { ...(origUser.extra || {}), ...data.extra }; // ไม่ทิ้งข้อมูลเพิ่มเติมที่แลปอื่นเก็บไว้
    const user = editId ? await updateUser(editId, data) : await createUser(data);
    saved = true; clearTimeout(draftTimer); clearDraft();
    $('regWrap').classList.add('hidden');
    $('success').classList.remove('hidden');
    $('successName').textContent = `${user.firstName} ${user.lastName}`;
    $('successInfo').textContent = `รหัสผู้ใช้ ${user.id} · อายุ ${validateBirthDate(user.birthDate).age} ปี · ยินยอมเมื่อ ${new Date(user.consentAt).toLocaleString('th-TH')}`;
    $('successTitle').textContent = editId ? 'แก้ไขข้อมูลเรียบร้อย' : 'ลงทะเบียนสำเร็จ!';
    window.__savedUser = user;
    toast('บันทึกลงเครื่องแล้ว ✓');
  } catch (e) {
    console.error('[register] บันทึกไม่สำเร็จ', e);
    await modal(`<h3>⚠️ บันทึกไม่สำเร็จ</h3><p>${esc(e.message)}</p><p>ข้อมูลที่กรอกยังอยู่ (มีร่างสำรองไว้) ลองกดบันทึกอีกครั้ง หรือปิดแท็บอื่นของแอปนี้ก่อน</p>`);
    $('btnSave').disabled = false;
  }
}

// ---------- เริ่มต้น ----------
export async function initRegister() {
  buildOptions();
  const back = document.body.dataset.back; // มีค่าเมื่อหน้านี้ถูกใช้จากหน้ารายชื่อ (Lab 13)
  document.querySelectorAll('.back-link').forEach((a) => { a.classList.toggle('hidden', !back); if (back) a.href = back; });
  const form = $('regForm');
  form.addEventListener('input', (e) => { if (e.target.id) touched.add(keyOf(e.target)); update(); });
  form.addEventListener('change', (e) => { touched.add(keyOf(e.target)); update(); });
  form.addEventListener('submit', (e) => e.preventDefault());
  $('bMonth').addEventListener('change', fillDays);
  $('bYear').addEventListener('change', fillDays);
  $('eraBE').addEventListener('change', () => { fillYears(); $('eraLabel').textContent = $('eraBE').checked ? 'พ.ศ.' : 'ค.ศ.'; update(); });
  document.querySelectorAll('[data-age]').forEach((b) => (b.onclick = () => quickAge(+b.dataset.age)));
  $('btnNext').onclick = () => { if (stepOk(step)) goTo(step + 1); else { showAll = true; update(); } };
  $('btnBack').onclick = () => goTo(step - 1);
  $('btnSave').onclick = save;
  $('btnConsent').onclick = askConsent;
  $('btnAnother').onclick = () => { location.href = location.pathname; };
  document.querySelectorAll('#crumbs li').forEach((li) => (li.onclick = () => goTo(+li.dataset.step)));

  if (editId) {
    // โหมดแก้ไข: โหลดผู้ใช้เดิม ความยินยอมเดิมยังใช้ได้
    try {
      const u = await getUser(editId);
      if (!u) throw new Error('ไม่พบผู้ใช้รหัส ' + editId);
      origUser = u;
      writeForm(fromUser(u));
      consentAt = u.consentAt || null;
      $('pageTitle').textContent = `✏️ แก้ไขข้อมูล: ${u.firstName} ${u.lastName}`;
      $('btnSave').textContent = '💾 บันทึกการแก้ไข';
      Object.keys(FIELD_EL).concat(['firstName', 'lastName', 'phone', 'carer', 'goal']).forEach((k) => touched.add(k));
    } catch (e) {
      await modal(`<h3>⚠️ เปิดข้อมูลเพื่อแก้ไขไม่ได้</h3><p>${esc(e.message)}</p>`, [{ label: 'ลงทะเบียนคนใหม่แทน', value: 1 }]);
      editId = null;
    }
  } else {
    const d = readDraft();
    if (d?.data && (d.data.firstName || d.data.lastName)) {
      const when = new Date(d.savedAt).toLocaleString('th-TH');
      const go = await modal(`<h3>📝 พบข้อมูลที่กรอกค้างไว้</h3><p>ของ <b>${esc(d.data.firstName)} ${esc(d.data.lastName)}</b> บันทึกเมื่อ ${when}<br>ต้องการกรอกต่อจากเดิมไหม?</p>`,
        [{ label: 'ทำต่อจากเดิม', value: true, cls: 'success' }, { label: 'เริ่มใหม่', value: false, cls: 'ghost' }]);
      if (go) { writeForm(d.data); Object.keys(d.data).forEach((k) => touched.add(k)); step = d.step || 1; toast('กู้ข้อมูลเดิมแล้ว'); }
      else clearDraft();
    }
  }
  showConsent();
  goTo(step);
}

// ปุ่มลัด "อายุประมาณ" → เลือกปีเกิดให้ทันที ไม่ต้องเลื่อนหาไกล
function quickAge(age) {
  const ce = new Date().getFullYear() - age;
  $('bYear').value = String($('eraBE').checked ? ce + 543 : ce);
  fillDays(); touched.add('birth'); update();
  $('bYear').focus();
}

// หา "กุญแจ" ของช่องจาก element (ใช้กับ touched)
function keyOf(el) {
  if (['bDay', 'bMonth', 'bYear'].includes(el.id)) return 'birth';
  if (el.name === 'cond' || el.id === 'condNone' || el.id === 'conditionOther') return 'cond';
  return el.name || el.id;
}
