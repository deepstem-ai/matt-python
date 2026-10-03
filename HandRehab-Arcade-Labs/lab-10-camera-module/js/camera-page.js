// ============================================================
// camera-page.js — หน้ากล้องเต็มจอ (Lab 10)
// เลือกกล้อง, รีเฟรชรายชื่อ, สลับกระจก, ความละเอียด, กรอบนำทาง, FPS, ความสว่าง
// ============================================================
import { startCamera, stopCamera, listCameras, getStats, measureBrightness } from './camera.js';
import { showCameraError, simulatedError } from './camera-errors.js';
import { toast, esc } from './ui.js';

// ความละเอียดที่เลือกได้ (แถบเลื่อน 0-2)
export const RESOLUTIONS = [
  { w: 640, h: 480, label: '480p (เร็ว เหมาะกับเครื่องช้า)' },
  { w: 1280, h: 720, label: '720p HD (แนะนำ)' },
  { w: 1920, h: 1080, label: '1080p Full HD (ชัดสุด แต่ช้ากว่า)' },
];
const DARK = 60, BRIGHT = 225; // เกณฑ์ความสว่าง 0-255: ต่ำกว่า 60 = มืดเกินไป

// ตัวช่วยอ่าน/เขียน localStorage แบบไม่พัง (บางเครื่องปิด storage ไว้)
const load = (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, v); } catch { /* ไม่เป็นไร */ } };

const $ = (id) => document.getElementById(id);
let timer = 0;       // ตัวจับเวลาอัปเดต HUD
let running = false;

// เติมรายชื่อกล้องลง dropdown และเลือกกล้องที่ใช้อยู่ให้ตรง
export async function refreshCameraList() {
  const sel = $('camSelect');
  try {
    const cams = await listCameras();
    const cur = getStats().deviceId || load('hr-camera-id', '');
    sel.innerHTML = cams.length
      ? cams.map((c) => `<option value="${esc(c.deviceId)}">${esc(c.label)}</option>`).join('')
      : '<option value="">— ไม่พบกล้อง —</option>';
    if (cams.some((c) => c.deviceId === cur)) sel.value = cur;
    $('camCount').textContent = cams.length;
    return cams;
  } catch (e) {
    console.error('[camera-page] อ่านรายชื่อกล้องไม่ได้', e);
    sel.innerHTML = '<option value="">— อ่านรายชื่อกล้องไม่ได้ —</option>';
    return [];
  }
}

// เปิดกล้องตามค่าที่เลือกบนหน้าจอ
export async function openCamera(deviceId) {
  const res = RESOLUTIONS[+$('resSlider').value] || RESOLUTIONS[1];
  $('camError').classList.add('hidden');
  $('lostBox').classList.add('hidden');
  $('camStatus').textContent = 'กำลังเปิดกล้อง…';
  try {
    const sim = simulatedError();
    if (sim) throw sim;                                  // โหมดจำลองปัญหา (?sim=...)
    await startCamera($('video'), deviceId || $('camSelect').value || undefined, { width: res.w, height: res.h });
    running = true;
    await refreshCameraList();                           // หลังได้สิทธิ์แล้วจะเห็นชื่อกล้องจริง
    startHud();
    toast('เปิดกล้องแล้ว ✓');
  } catch (err) {
    running = false;
    $('camStatus').textContent = 'เปิดกล้องไม่สำเร็จ';
    showCameraError($('camError'), err, { onRetry: () => openCamera(), onRescan: refreshCameraList });
  }
  updateButtons();
}

// ปิดกล้องจริง: หยุดทุก track ไฟกล้องต้องดับ
export function closeCamera() {
  stopCamera();
  running = false;
  clearInterval(timer);
  $('fps').textContent = '0';
  $('camStatus').textContent = 'ปิดกล้องแล้ว (ไฟกล้องควรดับ)';
  updateButtons();
}

function updateButtons() {
  $('btnStart').disabled = running;
  $('btnStop').disabled = !running;
}

// อัปเดต FPS ความละเอียด และความสว่าง ทุกครึ่งวินาที
function startHud() {
  clearInterval(timer);
  timer = setInterval(() => {
    const s = getStats();
    $('fps').textContent = s.fps;
    $('camStatus').textContent = `สถานะ: ${s.status} · ${s.width}×${s.height}`;
    const b = measureBrightness($('video'));
    $('brightVal').textContent = Math.round(b);
    $('brightBar').style.width = (b / 255) * 100 + '%';
    const dark = b > 0 && b < DARK, glare = b > BRIGHT;
    $('darkWarn').classList.toggle('hidden', !(dark || glare));
    $('darkWarn').textContent = dark
      ? '🌙 ห้องมืดเกินไป AI จะจับมือ/ใบหน้าได้แม่นน้อยลง — เปิดไฟ หรือหันหน้าเข้าหาหน้าต่าง'
      : '☀️ แสงจ้าเกินไป — อย่านั่งหันหลังให้หน้าต่าง';
  }, 500);
}

// ตั้งค่ากรอบนำทาง: oval = ใบหน้า, rect = มือ, none = ไม่แสดง
function setGuide(kind) {
  const g = $('guide');
  g.className = 'guide ' + kind;
  g.querySelector('span').textContent = kind === 'oval' ? 'วางใบหน้าให้อยู่ในวงรี' : 'วางมือให้อยู่ในกรอบ';
  save('hr-camera-guide', kind);
}

// ผูกปุ่มทั้งหมด (เรียกครั้งเดียวตอนโหลดหน้า)
export function initCameraPage() {
  // ค่าที่จำไว้
  $('resSlider').value = load('hr-camera-res', '1');
  $('resLabel').textContent = RESOLUTIONS[+$('resSlider').value].label;
  $('mirror').checked = load('hr-camera-mirror', '1') === '1';
  $('stage').classList.toggle('mirror', $('mirror').checked);
  const guide = load('hr-camera-guide', 'oval');
  document.querySelector(`input[name=guide][value=${guide}]`).checked = true;
  setGuide(guide);

  $('btnStart').onclick = () => openCamera();
  $('btnStop').onclick = closeCamera;
  $('btnRefresh').onclick = async () => { const c = await refreshCameraList(); toast(`พบกล้อง ${c.length} ตัว`); };
  $('camSelect').onchange = () => openCamera($('camSelect').value); // เลือกแล้วเปลี่ยนทันที + จำไว้ใน camera.js
  $('mirror').onchange = () => { $('stage').classList.toggle('mirror', $('mirror').checked); save('hr-camera-mirror', $('mirror').checked ? '1' : '0'); };
  $('resSlider').oninput = () => { $('resLabel').textContent = RESOLUTIONS[+$('resSlider').value].label; };
  $('resSlider').onchange = () => { save('hr-camera-res', $('resSlider').value); if (running) openCamera(); };
  document.querySelectorAll('input[name=guide]').forEach((r) => (r.onchange = () => setGuide(r.value)));
  $('btnReconnect').onclick = async () => { await refreshCameraList(); openCamera(); };

  // ถอดสาย USB กลางคัน → camera.js ส่ง event 'camera-lost' มา → เตือนเป็นภาษาไทย ไม่ตายเงียบ
  window.addEventListener('camera-lost', () => {
    closeCamera();
    $('camStatus').textContent = 'กล้องหลุดการเชื่อมต่อ';
    $('lostBox').classList.remove('hidden');
    toast('กล้องหลุดการเชื่อมต่อ!', 'error', 5);
    refreshCameraList();
  });
  // เสียบ/ถอดกล้อง → อัปเดตรายชื่อเองอัตโนมัติ
  navigator.mediaDevices?.addEventListener?.('devicechange', refreshCameraList);
  updateButtons();
}
