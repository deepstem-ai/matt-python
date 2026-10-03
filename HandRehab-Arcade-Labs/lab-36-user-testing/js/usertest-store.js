// ============================================================
// usertest-store.js — อ่าน/เขียนข้อมูลการทดสอบลงฐานข้อมูลกลาง (IndexedDB)
//   แบบสอบถาม  → store 'surveys'   (มีอยู่แล้วใน db.js)
//   บันทึกงาน   → store 'settings' key = 'usertest-<รหัส>'  (ไม่แก้โครงสร้าง db.js)
//   รายการปัญหา → store 'settings' key = 'usertest-issues'
// ============================================================
import { put, getAll, del, get } from './db.js';
import { demoSurveys, demoTaskRecords } from './usertest-data.js';
import { demoSusSurveys } from './sus.js';

export const listSurveys = async () => (await getAll('surveys')).sort((a, b) => a.createdAt - b.createdAt);
export const saveSurvey = (s) => put('surveys', s);

// บันทึกงานของผู้เข้าร่วม 1 คน
export async function listTaskRecords() {
  const all = await getAll('settings');
  return all.filter((r) => r.key.startsWith('usertest-') && r.key !== 'usertest-issues').map((r) => r.value)
    .sort((a, b) => a.startedAt - b.startedAt);
}
export const saveTaskRecord = (rec) => put('settings', { key: 'usertest-' + rec.participant, value: rec });
export const deleteTaskRecord = (participant) => del('settings', 'usertest-' + participant);

// รายการปัญหาที่พบ
export async function loadIssues() { return (await get('settings', 'usertest-issues'))?.value || []; }
export const saveIssues = (list) => put('settings', { key: 'usertest-issues', value: list });

// ใส่ข้อมูลตัวอย่าง 5 คน (ติดป้าย DEMO) เพื่อให้หน้าผลลัพธ์แสดงได้ทันที
export async function loadDemo() {
  for (const s of demoSurveys()) await put('surveys', s);
  for (const s of demoSusSurveys()) await put('surveys', s);    // SUS ตัวอย่าง 5 คน
  for (const r of demoTaskRecords()) await put('settings', r);
}
// ลบเฉพาะข้อมูลตัวอย่าง ข้อมูลจริงไม่หาย
export async function clearDemo() {
  for (const s of await getAll('surveys')) if (s.demo) await del('surveys', s.id);
  for (const r of await getAll('settings')) if (r.key.startsWith('usertest-') && r.value?.demo) await del('settings', r.key);
}
