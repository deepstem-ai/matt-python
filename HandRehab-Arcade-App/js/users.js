// ============================================================
// users.js — หน้าจัดการผู้ใช้ครบวงจร (Lab 13): ค้นหา กรอง ดู แก้ไข ลบ ส่งออก นำเข้า
//
// ทำไมใช้ IndexedDB ไม่ใช้ localStorage?
//   localStorage = ลิ้นชักเล็ก เก็บได้แค่ "ข้อความ" ราว 5 MB อ่าน/เขียนแบบรอจนเสร็จ (จออาจค้าง)
//                  เหมาะกับของเล็ก ๆ เช่น ธีมที่เลือก หรือร่างฟอร์ม
//   IndexedDB    = ตู้เอกสารใหญ่ เก็บ "วัตถุ" ได้ทั้งตัว (ตัวเลข อาร์เรย์ รูปภาพ) หลายร้อย MB
//                  ทำงานเบื้องหลัง (async) และค้นหาตามดัชนีได้เร็ว เช่น "ทุก session ของผู้ใช้คนนี้"
//   ทั้งสองอย่างอยู่ในเครื่องนี้เท่านั้น ปิดเบราว์เซอร์แล้วข้อมูลยังอยู่ ไม่มีการส่งขึ้นอินเทอร์เน็ต
// ============================================================
import { searchUsers, listSessionsByUser, listFacesByUser, exportAll, ageOf } from './db.js';
import { toast, esc, downloadText } from './ui.js';
import { CONDITIONS, TREMOR_LEVELS, SEX_TH } from './register-data.js';
import { showDetails, confirmDelete, showDeleteReport, importFromFile, fullName } from './users-dialogs.js';
import { createDemoUsers } from './users-demo.js';

const $ = (id) => document.getElementById(id);
const PAGE_SIZE = 9;
const DAY = 86400000;
let page = 0;
let extra = new Map();    // userId → { count, last, photo } (ข้อมูลประกอบการ์ด)

// อ่าน/เขียน localStorage แบบไม่พัง (ใช้แค่จำเวลาสำรองล่าสุด)
const lsGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch { /* ไม่เป็นไร */ } };

// ---------- โหลดข้อมูลประกอบ: จำนวนการฝึก วันที่ฝึกล่าสุด รูปใบหน้า ----------
async function loadExtra(users) {
  const m = new Map();
  await Promise.all(users.map(async (u) => {
    try {
      const [ss, faces] = await Promise.all([listSessionsByUser(u.id), listFacesByUser(u.id)]);
      const best = faces.filter((f) => f.image).sort((a, b) => (b.quality || 0) - (a.quality || 0))[0];
      m.set(u.id, { count: ss.length, last: ss[0]?.startTime || null, photo: best?.image || null });
    } catch (e) { console.warn('[users] ข้อมูลประกอบของ', u.id, e); m.set(u.id, { count: 0, last: null, photo: null }); }
  }));
  return m;
}

// ---------- ตัวกรอง ----------
function passFilters(u) {
  const sex = $('fSex').value, tr = $('fTremor').value, cond = $('fCond').value, age = $('fAge').value;
  if (sex && u.sex !== sex) return false;
  if (tr !== '' && String(u.tremor ?? 0) !== tr) return false;
  if (cond === '__none' && ((u.conditions || []).length || u.conditionOther)) return false;
  if (cond && cond !== '__none' && !(u.conditions || []).includes(cond)) return false;
  if (age) {
    const a = ageOf(u.birthDate) ?? -1;
    const [lo, hi] = age.split('-').map(Number);
    if (a < lo || a > hi) return false;
  }
  if ($('fIdle').checked) { // ไม่ได้ฝึกเกิน 7 วัน (หรือไม่เคยฝึก)
    const last = extra.get(u.id)?.last;
    if (last && Date.now() - last <= 7 * DAY) return false;
  }
  return true;
}

// ---------- วาดการ์ดผู้ใช้ ----------
function initials(u) { return ((u.firstName || '?')[0] + (u.lastName || '')[0] || '').toUpperCase(); }
function card(u) {
  const x = extra.get(u.id) || { count: 0 };
  const idleDays = x.last ? Math.floor((Date.now() - x.last) / DAY) : null;
  const conds = [...(u.conditions || []), u.conditionOther].filter(Boolean);
  const photo = x.photo ? `<img class="avatar" src="${x.photo}" alt="รูปใบหน้า">` : `<div class="avatar initials" aria-hidden="true">${esc(initials(u))}</div>`;
  return `<article class="card-neon user-card" data-id="${esc(u.id)}">
    <div class="card-head">${photo}<div><h3 class="card-title">${esc(fullName(u))}${u.extra?.demo ? ' <span class="chip">ตัวอย่าง</span>' : ''}</h3>
      <div class="muted">${ageOf(u.birthDate) ?? '-'} ปี · ${SEX_TH[u.sex] || '-'} · มือสั่นระดับ ${u.tremor ?? 0}</div></div></div>
    <div class="conds">${conds.length ? conds.map((c) => `<span class="chip">${esc(c)}</span>`).join('') : '<span class="muted">ไม่มีโรคประจำตัว</span>'}</div>
    <div class="row stats"><span class="chip">ฝึก <b>${x.count}</b> ครั้ง</span>
      <span class="chip ${idleDays == null || idleDays > 7 ? 'warn' : 'ok'}">ล่าสุด <b>${x.last ? new Date(x.last).toLocaleDateString('th-TH') : 'ยังไม่เคย'}</b></span></div>
    <div class="row actions">
      <button class="btn-glow small ghost" data-act="view">👁 ดู</button>
      <a class="btn-glow small ghost" href="register.html?edit=${encodeURIComponent(u.id)}">✏️ แก้ไข</a>
      <button class="btn-glow small danger" data-act="del">🗑 ลบ</button>
    </div></article>`;
}

// ---------- ค้นหา + กรอง + แบ่งหน้า ----------
let all = [];
export async function refresh({ reload = false } = {}) {
  try {
    const users = await searchUsers($('q').value);        // ค้นหาจากชื่อ นามสกุล โรค ผู้ดูแล เบอร์
    if (reload || users.some((u) => !extra.has(u.id))) extra = await loadExtra(await searchUsers('')); // ข้อมูลประกอบของทุกคน
    all = users.filter(passFilters);
    $('loadError').classList.add('hidden');
  } catch (e) {
    console.error('[users] โหลดรายชื่อไม่สำเร็จ', e);
    $('loadError').classList.remove('hidden');
    $('loadErrorMsg').textContent = e.message;
    return;
  }
  const pages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  page = Math.min(page, pages - 1);
  const shown = all.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  $('cards').innerHTML = shown.map(card).join('');
  $('empty').classList.toggle('hidden', all.length > 0);
  $('pager').classList.toggle('hidden', pages <= 1);
  $('pageInfo').textContent = `หน้า ${page + 1} / ${pages}`;
  $('prev').disabled = page === 0; $('next').disabled = page >= pages - 1;
  // สรุปภาพรวม (ไม่เปิดเผยรายคน)
  const total = [...extra.values()].reduce((a, b) => a + b.count, 0);
  $('sumUsers').textContent = extra.size; $('sumShown').textContent = all.length; $('sumSessions').textContent = total;
  const lastExp = +lsGet('hr-last-export') || 0;
  $('backupWarn').classList.toggle('hidden', !extra.size || Date.now() - lastExp < 7 * DAY);
}

// ---------- การกระทำบนการ์ด ----------
async function onCardClick(e) {
  const btn = e.target.closest('button[data-act]'); if (!btn) return;
  const id = btn.closest('.user-card').dataset.id;
  const u = all.find((x) => x.id === id); if (!u) return;
  if (btn.dataset.act === 'view') showDetails(u);
  if (btn.dataset.act === 'del') {
    const report = await confirmDelete(u);
    if (report) { toast(`ลบ ${fullName(u)} แล้ว`); await refresh({ reload: true }); await showDeleteReport(fullName(u), report); }
  }
}

async function doExport() {
  try {
    const data = await exportAll();
    const d = new Date().toISOString().slice(0, 10);
    downloadText(`handrehab-backup-${d}.json`, JSON.stringify(data, null, 1), 'application/json');
    lsSet('hr-last-export', String(Date.now()));
    toast(`ส่งออกผู้ใช้ ${data.stores.users.length} คนแล้ว — เก็บไฟล์ไว้ในที่ปลอดภัย ห้ามอัปโหลดขึ้น git`, 'success', 5);
    refresh();
  } catch (e) { toast('ส่งออกไม่สำเร็จ: ' + e.message, 'error', 5); }
}

export function initUsersPage() {
  $('fCond').innerHTML = '<option value="">ทุกโรค</option>' + CONDITIONS.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join('') + '<option value="__none">ไม่มีโรคประจำตัว</option>';
  $('fTremor').innerHTML = '<option value="">มือสั่นทุกระดับ</option>' + TREMOR_LEVELS.map((t, i) => `<option value="${i}">ระดับ ${i} · ${t.label}</option>`).join('');
  $('q').addEventListener('input', () => { page = 0; refresh(); });           // กรองทันทีที่พิมพ์
  ['fSex', 'fTremor', 'fCond', 'fAge', 'fIdle'].forEach((id) => $(id).addEventListener('change', () => { page = 0; refresh(); }));
  $('btnClear').onclick = () => { ['q', 'fSex', 'fTremor', 'fCond', 'fAge'].forEach((id) => ($(id).value = '')); $('fIdle').checked = false; refresh(); };
  $('cards').addEventListener('click', onCardClick);
  $('prev').onclick = () => { page--; refresh(); };
  $('next').onclick = () => { page++; refresh(); };
  $('btnExport').onclick = doExport;
  $('btnImport').onclick = () => $('importFile').click();
  $('importFile').onchange = async () => {
    const f = $('importFile').files[0]; $('importFile').value = '';
    if (!f) return;
    const rep = await importFromFile(f);
    if (rep) { toast(`นำเข้าแล้ว: ผู้ใช้ ${rep.users} คน การฝึก ${rep.sessions} ครั้ง`); refresh({ reload: true }); }
  };
  $('btnDemo').onclick = async () => {
    $('btnDemo').disabled = true;
    try { const m = await createDemoUsers(); toast(`สร้างผู้ใช้ตัวอย่าง ${m.users} คน การฝึก ${m.sessions} ครั้ง`); await refresh({ reload: true }); }
    catch (e) { toast('สร้างข้อมูลตัวอย่างไม่สำเร็จ: ' + e.message, 'error', 5); }
    $('btnDemo').disabled = false;
  };
  $('btnRetry').onclick = () => refresh({ reload: true });
  return refresh({ reload: true });
}
