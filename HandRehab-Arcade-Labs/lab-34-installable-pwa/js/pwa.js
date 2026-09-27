// ============================================================
// pwa.js — ทำให้เว็บกลายเป็นแอปที่ติดตั้งได้ (Lab 34)
//  1) ลงทะเบียน sw.js (ตัวเก็บไฟล์ไว้ในเครื่อง) + แจ้งเมื่อมีเวอร์ชันใหม่ พร้อมปุ่มโหลดใหม่
//  2) ปุ่มติดตั้ง: รอเหตุการณ์ beforeinstallprompt ที่เบราว์เซอร์ส่งมาเมื่อ "ติดตั้งได้"
//     ซ่อนปุ่มเมื่อติดตั้งแล้ว (display-mode: standalone หรือเหตุการณ์ appinstalled)
//  3) ปุ่มเต็มจอสำหรับการสาธิต (ปุ่มไหนก็ได้ที่มี data-fullscreen)
// หมายเหตุ: ต้องเปิดผ่าน http://localhost (start.bat) เท่านั้น เปิดไฟล์ตรง ๆ (file://) ติดตั้งไม่ได้
// ============================================================
import { toast } from './ui.js';

let deferredPrompt = null;          // เก็บเหตุการณ์ไว้กดทีหลัง (เบราว์เซอร์ให้ใช้ได้ครั้งเดียว)
const listeners = new Set();        // ใครอยากรู้ว่าสถานะการติดตั้งเปลี่ยน
const notify = () => listeners.forEach((fn) => fn(installState()));

// ตอนนี้ทำงานเป็นแอปที่ติดตั้งแล้วหรือยัง
export function isStandalone() {
  return window.matchMedia?.('(display-mode: standalone)').matches || window.matchMedia?.('(display-mode: fullscreen)').matches || navigator.standalone === true;
}
// 'installed' | 'ready' (กดติดตั้งได้) | 'waiting' (ยังไม่พร้อม/เบราว์เซอร์ไม่รองรับ) | 'insecure'
export function installState() {
  if (isStandalone()) return 'installed';
  if (!window.isSecureContext) return 'insecure';
  return deferredPrompt ? 'ready' : 'waiting';
}
export function onInstallChange(fn) { listeners.add(fn); fn(installState()); }

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();               // ไม่ให้เบราว์เซอร์เด้งแถบของตัวเอง เราจะใช้ปุ่มของเราแทน
  deferredPrompt = e;
  notify();
});
window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  try { localStorage.setItem('hr-installed', String(Date.now())); } catch { /* ไม่เป็นไร */ }
  toast('ติดตั้งแล้ว! เปิดได้จากไอคอนบนเดสก์ท็อป', 'success', 5);
  notify();
});

// กดปุ่มติดตั้ง → เบราว์เซอร์ถามยืนยัน
export async function promptInstall() {
  if (!deferredPrompt) return 'unavailable';
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;   // 'accepted' | 'dismissed'
  deferredPrompt = null;
  notify();
  return outcome;
}

// ---------- เต็มจอ ----------
export async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
  } catch (e) { toast('เบราว์เซอร์นี้ไม่ยอมเข้าโหมดเต็มจอ ลองกด F11 แทน', 'warning'); }
}
function paintFsButtons() {
  const on = !!document.fullscreenElement;
  document.querySelectorAll('[data-fullscreen]').forEach((b) => { b.innerHTML = on ? '<span class="ico">🗗</span> ออกจากเต็มจอ' : '<span class="ico">⛶</span> เต็มจอ'; });
}
document.addEventListener('click', (e) => { if (e.target.closest('[data-fullscreen]')) toggleFullscreen(); });
document.addEventListener('fullscreenchange', paintFsButtons);

// ---------- Service Worker + แจ้งเวอร์ชันใหม่ ----------
let wantReload = false;           // โหลดหน้าใหม่เฉพาะเมื่อผู้ใช้กดปุ่มอัปเดตเอง (ครั้งแรกที่ sw เริ่มคุมหน้า ห้ามรีโหลดกลางคัน)
let swInfo = { supported: 'serviceWorker' in navigator, active: false, version: null, error: null };
export const serviceWorkerInfo = () => ({ ...swInfo });

function showUpdateBar(worker) {
  if (document.querySelector('.update-bar')) return;
  const bar = document.createElement('div');
  bar.className = 'update-bar'; bar.setAttribute('role', 'alert');
  bar.innerHTML = '<span>🆕 มีแอปเวอร์ชันใหม่แล้ว</span><button class="btn-glow small success">↻ โหลดเวอร์ชันใหม่</button><button class="btn-glow small ghost">ภายหลัง</button>';
  const [go, later] = bar.querySelectorAll('button');
  go.onclick = () => { go.disabled = true; wantReload = true; worker.postMessage({ type: 'SKIP_WAITING' }); }; // ให้ตัวใหม่เริ่มทำงาน แล้วหน้าจะโหลดใหม่เอง
  later.onclick = () => bar.remove();
  document.body.appendChild(bar);
}

export async function registerSW() {
  if (!swInfo.supported) return swInfo;
  if (!window.isSecureContext) { swInfo.error = 'ต้องเปิดผ่าน http://localhost'; return swInfo; }
  try {
    const reg = await navigator.serviceWorker.register('sw.js');
    // มีตัวใหม่รออยู่แล้ว (เช่น เปิดแท็บที่สอง)
    if (reg.waiting && navigator.serviceWorker.controller) showUpdateBar(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const w = reg.installing;
      w?.addEventListener('statechange', () => {
        // ติดตั้งเสร็จ + มีตัวเก่าคุมหน้าอยู่ = อัปเดต (ครั้งแรกสุดไม่ต้องแจ้ง)
        if (w.state === 'installed' && navigator.serviceWorker.controller) showUpdateBar(w);
      });
    });
    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (wantReload && !reloading) { reloading = true; location.reload(); } });
    swInfo.active = true;
    reg.update().catch(() => {}); // ถามเซิร์ฟเวอร์ว่ามี sw.js ใหม่ไหม (ออฟไลน์ก็ไม่เป็นไร)
    // ถามเวอร์ชันจาก sw ที่คุมหน้าอยู่
    navigator.serviceWorker.addEventListener('message', (e) => { if (e.data?.type === 'VERSION') { swInfo.version = e.data.version; window.dispatchEvent(new Event('sw-info')); } });
    navigator.serviceWorker.controller?.postMessage({ type: 'GET_VERSION' });
  } catch (e) {
    swInfo.error = e.message;
    console.warn('[pwa] ลงทะเบียน service worker ไม่สำเร็จ', e);
  }
  return swInfo;
}

// class บน body ไว้ซ่อนของที่ไม่จำเป็นเมื่อเปิดจากไอคอน
export function markStandalone() {
  document.body.classList.toggle('is-standalone', isStandalone());
  window.matchMedia?.('(display-mode: standalone)').addEventListener?.('change', () => { document.body.classList.toggle('is-standalone', isStandalone()); notify(); });
}

// รอจน service worker "คุม" หน้านี้แล้ว (ครั้งแรกสุดต้องรอมันติดตั้งเสร็จ)
// หน้า splash เรียกก่อนโหลดโมเดล เพื่อให้ไฟล์ไลบรารี/โมเดลผ่าน sw และถูกเก็บไว้ใช้ออฟไลน์ตั้งแต่รอบแรก
export function whenControlled(ms = 8000) {
  if (!('serviceWorker' in navigator) || !window.isSecureContext) return Promise.resolve(false);
  if (navigator.serviceWorker.controller) return Promise.resolve(true);
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve(false), ms); // รอไม่เกิน ms แล้วไปต่อ (แอปยังใช้ได้ แค่ยังไม่เก็บออฟไลน์)
    navigator.serviceWorker.addEventListener('controllerchange', () => { clearTimeout(t); resolve(true); }, { once: true });
  });
}
