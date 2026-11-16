// ============================================================
// settings.js — หน้าตั้งค่าของแอปรวม (Lab 34)
// โปรไฟล์ขนาด · ธีม · โหมดสงบ/สว่าง · เลือกกล้อง · สไตล์มือ · ความละเอียด · เอฟเฟกต์ · ติดตั้งแอป · เต็มจอ
// ทุกค่าบันทึกด้วย savePrefs() (localStorage 'hr-prefs') มีผลทันที เกมทุกเกมอ่านค่าเดียวกัน
// ============================================================
import { definePage } from './router.js';
import { loadPrefs, savePrefs, toast, esc } from './ui.js';
import { listCameras, getSavedCameraId, saveCameraId } from './camera.js';
import { onInstallChange, promptInstall, serviceWorkerInfo } from './pwa.js';

const $ = (s) => document.querySelector(s);

function set(patch) { savePrefs(patch); sync(); }

function sync() {
  const p = loadPrefs();
  document.querySelectorAll('input[name=profile]').forEach((r) => { r.checked = r.value === p.profile; });
  document.querySelectorAll('input[name=theme]').forEach((r) => { r.checked = r.value === p.theme; });
  document.querySelectorAll('input[name=handStyle]').forEach((r) => { r.checked = r.value === (p.handStyle || 'neon'); });
  $('#calmSw').checked = !!p.calm;
  $('#lightSw').checked = !!p.light;
  $('#resSel').value = p.resolution || '640x480';
  $('#fxSel').value = p.effects || 'full';
}

// รายชื่อกล้อง (ชื่อจะเห็นหลังจากเคยอนุญาตกล้องแล้วอย่างน้อยหนึ่งครั้ง)
async function fillCameras() {
  try {
    const cams = await listCameras();
    const saved = getSavedCameraId();
    $('#camSel').innerHTML = '<option value="">กล้องเริ่มต้น</option>' +
      cams.map((c, i) => `<option value="${esc(c.deviceId)}" ${c.deviceId === saved ? 'selected' : ''}>${esc(c.label || 'กล้องตัวที่ ' + (i + 1))}</option>`).join('');
  } catch (e) { toast('อ่านรายชื่อกล้องไม่ได้: ' + e.message, 'warning'); }
}

// ข้อความ + ปุ่มติดตั้งตามสถานะ
const INSTALL_TH = {
  installed: '✔ ติดตั้งแล้ว — กำลังเปิดจากไอคอนแอป (ไม่มีแถบเบราว์เซอร์)',
  ready: 'เครื่องนี้ติดตั้งแอปได้ กดปุ่มสีเขียวด้านล่าง',
  waiting: 'ปุ่มติดตั้งจะขึ้นเมื่อเบราว์เซอร์พร้อม (Chrome / Edge) — ถ้าเคยติดตั้งแล้ว ให้เปิดจากไอคอนบนเดสก์ท็อป · iPad: ปุ่มแชร์ → "เพิ่มไปยังหน้าจอโฮม"',
  insecure: '⚠ ต้องเปิดผ่าน http://localhost (ดับเบิลคลิก start.bat) จึงจะติดตั้งได้ เปิดไฟล์ตรง ๆ ไม่ได้',
};
onInstallChange((st) => {
  $('#installState').textContent = INSTALL_TH[st];
  $('#installBtn').classList.toggle('hidden', st !== 'ready');
});
$('#installBtn').addEventListener('click', async () => {
  const r = await promptInstall();
  if (r === 'accepted') toast('กำลังติดตั้ง…', 'success');
  else if (r === 'dismissed') toast('ยกเลิกการติดตั้ง กดใหม่ได้ทุกเมื่อ', 'warning');
});
function paintSw() {
  const i = serviceWorkerInfo();
  $('#swState').textContent = !i.supported ? 'เบราว์เซอร์นี้ไม่รองรับการทำงานออฟไลน์'
    : i.error ? 'ระบบเก็บไฟล์ออฟไลน์: ' + i.error
      : `ระบบเก็บไฟล์ออฟไลน์ (service worker): ${i.active ? 'ทำงานอยู่' : 'กำลังเริ่ม'}${i.version ? ' · เวอร์ชัน ' + i.version : ''}`;
}
window.addEventListener('sw-info', paintSw);

// ---------- ต่อสายตัวควบคุม ----------
document.querySelectorAll('input[name=profile]').forEach((r) => r.addEventListener('change', () => set({ profile: r.value })));
document.querySelectorAll('input[name=theme]').forEach((r) => r.addEventListener('change', () => set({ theme: r.value })));
document.querySelectorAll('input[name=handStyle]').forEach((r) => r.addEventListener('change', () => set({ handStyle: r.value })));
$('#calmSw').addEventListener('change', (e) => set({ calm: e.target.checked }));
$('#lightSw').addEventListener('change', (e) => set({ light: e.target.checked }));
$('#resSel').addEventListener('change', (e) => set({ resolution: e.target.value }));
$('#fxSel').addEventListener('change', (e) => set({ effects: e.target.value }));
$('#camSel').addEventListener('change', (e) => {
  if (e.target.value) saveCameraId(e.target.value); else try { localStorage.removeItem('hr-camera-id'); } catch { /* ไม่เป็นไร */ }
  toast('จำกล้องที่เลือกแล้ว ใช้ตั้งแต่เกมถัดไป', 'success');
});
$('#camRefresh').addEventListener('click', fillCameras);

definePage('settings', { onEnter() { sync(); fillCameras(); paintSw(); } });
