// ============================================================
// login-log.js — จดบันทึกทุกครั้งที่ลองเข้าสู่ระบบ (ข้อมูลบทที่ 4 โดยตรง)
// เก็บใน store "settings" key = 'login-log' (ไม่ต้องแก้โครงสร้างฐานข้อมูล)
// ============================================================
import { getSettings, saveSettings } from './db.js';

const KEY = 'login-log';
const MAX = 300; // เก็บล่าสุด 300 ครั้งพอ

// entry = { method: 'face'|'pin'|'face-timeout', userId, ms, score, threshold, blinks }
export async function addLog(entry) {
  try {
    const v = await getSettings(KEY);
    const items = [...(v.items || []), { at: Date.now(), ...entry }].slice(-MAX);
    await saveSettings(KEY, { items });
  } catch (e) { console.warn('[login-log] บันทึกไม่ได้', e); }
}
export async function getLog() {
  try { return (await getSettings(KEY)).items || []; } catch { return []; }
}
