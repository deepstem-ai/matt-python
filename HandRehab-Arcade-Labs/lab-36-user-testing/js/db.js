// ============================================================
// db.js — ที่เก็บข้อมูลถาวรด้วย IndexedDB ของเบราว์เซอร์ (Lab 13)
//
// IndexedDB คืออะไร: ฐานข้อมูลที่อยู่ในเบราว์เซอร์ของเครื่องนี้ ปิดเบราว์เซอร์แล้วข้อมูลยังอยู่
// ต่างจาก localStorage อย่างไร:
//   - localStorage เก็บได้แค่ข้อความสั้น ๆ (ราว 5 MB) และทำงานแบบรอ (หน้าจอค้างได้)
//   - IndexedDB เก็บวัตถุ/รูปภาพ/ตัวเลขจำนวนมากได้ (หลายร้อย MB) ทำงานเบื้องหลังไม่ทำให้จอค้าง
//     และค้นหาตามดัชนี (index) ได้เร็ว เช่น "ทุก session ของผู้ใช้คนนี้"
// ข้อมูลไม่ถูกส่งออกไปนอกเครื่องเลย
//
// หมายเหตุ: ทุกแลปใช้ฐานข้อมูลชื่อเดียวกันและโครงสร้างเดียวกัน (สร้าง store ที่ขาดให้อัตโนมัติ)
// จึงเปิดแลปไหนก่อนหลังก็ไม่พัง
// ============================================================

export const DB_NAME = 'handrehab-arcade';
export const DB_VERSION = 1;

// store: [ชื่อ, keyPath, [ดัชนี...]]
const STORES = [
  ['users', 'id', ['lastName', 'createdAt']],
  ['faces', 'id', ['userId']],
  ['sessions', 'id', ['userId', 'game', 'startTime']],
  ['reps', 'id', ['sessionId', 'userId']],          // Lab 28: บันทึกทุกครั้งที่ทำท่า
  ['settings', 'key', []],                          // ตั้งค่ารายคน key = userId หรือ 'global'
  ['achievements', 'id', ['userId']],               // Lab 26
  ['calibration', 'id', ['userId']],                // Lab 27 id = userId + ':' + gesture
  ['ml', 'id', []],                                 // Lab 31 โมเดล kNN
  ['benchmarks', 'id', []],                         // Lab 33
  ['surveys', 'id', ['userId']],                    // Lab 36
  ['evaluations', 'id', []],                        // Lab 32
];

let dbPromise = null;

// เปิดฐานข้อมูล (ครั้งแรกจะสร้าง store ทั้งหมด)
export function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) return reject(new Error('เบราว์เซอร์นี้ไม่รองรับ IndexedDB'));
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const [name, keyPath, indexes] of STORES) {
        if (db.objectStoreNames.contains(name)) continue;
        const st = db.createObjectStore(name, { keyPath });
        indexes.forEach((ix) => st.createIndex(ix, ix, { unique: false }));
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('ฐานข้อมูลถูกแท็บอื่นล็อกไว้ ปิดแท็บอื่นของแอปแล้วลองใหม่'));
  });
  dbPromise.catch(() => { dbPromise = null; });
  return dbPromise;
}

// สร้างรหัสไม่ซ้ำ
export function newId(prefix = '') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ตัวช่วยแปลง request เป็น Promise
const wrap = (req) => new Promise((res, rej) => { req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error); });

async function tx(store, mode = 'readonly') {
  const db = await openDB();
  return db.transaction(store, mode).objectStore(store);
}

// ---------- ฟังก์ชันพื้นฐานใช้กับ store ใดก็ได้ ----------
export async function put(store, obj) { try { await wrap((await tx(store, 'readwrite')).put(obj)); return obj; } catch (e) { console.error('[db] put', store, e); throw e; } }
export async function get(store, key) { try { return await wrap((await tx(store)).get(key)); } catch (e) { console.error('[db] get', e); throw e; } }
export async function getAll(store) { try { return await wrap((await tx(store)).getAll()); } catch (e) { console.error('[db] getAll', e); throw e; } }
export async function del(store, key) { try { await wrap((await tx(store, 'readwrite')).delete(key)); } catch (e) { console.error('[db] del', e); throw e; } }
export async function clearStore(store) { try { await wrap((await tx(store, 'readwrite')).clear()); } catch (e) { console.error('[db] clear', e); throw e; } }
export async function getByIndex(store, index, value) {
  try { return await wrap((await tx(store)).index(index).getAll(value)); } catch (e) { console.error('[db] getByIndex', e); throw e; }
}
// ลบทุกระเบียนที่ index ตรงค่า คืนจำนวนที่ลบ
export async function deleteByIndex(store, index, value) {
  try {
    const db = await openDB();
    return await new Promise((res, rej) => {
      const t = db.transaction(store, 'readwrite');
      const req = t.objectStore(store).index(index).openCursor(IDBKeyRange.only(value));
      let n = 0;
      req.onsuccess = () => { const c = req.result; if (c) { c.delete(); n++; c.continue(); } };
      t.oncomplete = () => res(n);
      t.onerror = () => rej(t.error);
    });
  } catch (e) { console.error('[db] deleteByIndex', e); throw e; }
}

// ---------- ผู้ใช้ (CRUD ครบวงจร) ----------
export async function createUser(data) {
  const now = Date.now();
  const user = { id: newId('u_'), createdAt: now, active: true, ...data };
  return put('users', user);
}
export const getUser = (id) => get('users', id);
export async function listUsers() {
  const all = await getAll('users');
  return all.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}
// ค้นหาจากชื่อ นามสกุล โรค ผู้ดูแล (ไม่สนตัวพิมพ์เล็กใหญ่)
export async function searchUsers(text) {
  const q = String(text || '').trim().toLowerCase();
  const all = await listUsers();
  if (!q) return all;
  return all.filter((u) => [u.firstName, u.lastName, u.carer, u.phone, ...(u.conditions || [])].join(' ').toLowerCase().includes(q));
}
export async function updateUser(id, patch) {
  const u = await getUser(id);
  if (!u) throw new Error('ไม่พบผู้ใช้ ' + id);
  return put('users', { ...u, ...patch, id, updatedAt: Date.now() });
}
export const deleteUser = (id) => del('users', id);

// ลบผู้ใช้แบบไม่เหลือร่องรอย คืนรายงานว่าลบอะไรไปกี่รายการ
export async function deleteUserCompletely(userId) {
  const report = { users: 0, faces: 0, sessions: 0, reps: 0, settings: 0, achievements: 0, calibration: 0, surveys: 0 };
  try {
    if (await getUser(userId)) { await deleteUser(userId); report.users = 1; }
    report.faces = await deleteByIndex('faces', 'userId', userId);
    report.reps = await deleteByIndex('reps', 'userId', userId);
    report.sessions = await deleteByIndex('sessions', 'userId', userId);
    if (await get('settings', userId)) { await del('settings', userId); report.settings = 1; }
    report.achievements = await deleteByIndex('achievements', 'userId', userId);
    report.calibration = await deleteByIndex('calibration', 'userId', userId);
    report.surveys = await deleteByIndex('surveys', 'userId', userId);
  } catch (e) { console.error('[db] deleteUserCompletely', e); throw e; }
  return report;
}

// ---------- ใบหน้า ----------
export async function saveFace({ userId, embedding, quality, image, pose }) {
  return put('faces', { id: newId('f_'), userId, embedding: Array.from(embedding || []), quality, image, pose, capturedAt: Date.now() });
}
export const listFacesByUser = (userId) => getByIndex('faces', 'userId', userId);
export const listAllFaces = () => getAll('faces');

// ---------- การฝึก ----------
export async function saveSession(s) {
  return put('sessions', { id: s.id || newId('s_'), ...s });
}
export async function listSessionsByUser(userId) {
  const all = await getByIndex('sessions', 'userId', userId);
  return all.sort((a, b) => (b.startTime || 0) - (a.startTime || 0));
}
export async function saveRep(r) { return put('reps', { id: newId('r_'), ...r }); }
export const listRepsBySession = (sessionId) => getByIndex('reps', 'sessionId', sessionId);
export async function deleteSession(id) {
  const n = await deleteByIndex('reps', 'sessionId', id);
  await del('sessions', id);
  return { sessions: 1, reps: n };
}

// ---------- ตั้งค่ารายคน ----------
export async function getSettings(key = 'global') { return (await get('settings', key))?.value || {}; }
export async function saveSettings(key, value) { return put('settings', { key, value }); }

// ---------- สำรอง / นำเข้า ----------
export async function exportAll() {
  const out = { app: DB_NAME, version: DB_VERSION, exportedAt: new Date().toISOString(), stores: {} };
  for (const [name] of STORES) out.stores[name] = await getAll(name);
  return out;
}
// นำเข้าข้อมูล (ทับรายการที่ id ซ้ำ) คืนจำนวนที่นำเข้าแต่ละ store
export async function importAll(data) {
  if (!data?.stores) throw new Error('ไฟล์ไม่ใช่ข้อมูลสำรองของแอปนี้');
  const report = {};
  for (const [name] of STORES) {
    const rows = data.stores[name] || [];
    for (const r of rows) await put(name, r);
    report[name] = rows.length;
  }
  return report;
}

// ---------- ผู้ใช้ที่เข้าระบบอยู่ (จำไว้ใน sessionStorage ปิดแท็บแล้วหาย) ----------
export function setCurrentUser(id) { if (id) sessionStorage.setItem('hr-user', id); else sessionStorage.removeItem('hr-user'); }
export function getCurrentUserId() { return sessionStorage.getItem('hr-user'); }
export async function getCurrentUser() { const id = getCurrentUserId(); return id ? getUser(id) : null; }

// คำนวณอายุจากวันเกิด (ใช้แสดงในรายการผู้ใช้)
export function ageOf(birthDate, today = new Date()) {
  if (!birthDate) return null;
  const b = new Date(birthDate);
  let a = today.getFullYear() - b.getFullYear();
  const m = today.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < b.getDate())) a--;
  return a;
}
