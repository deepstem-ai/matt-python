// ============================================================
// camera-errors.js — กล่องแจ้งปัญหากล้อง 4 กรณี (ภาษาไทย + ปุ่มแก้ไข)
//   1) ไม่ได้รับอนุญาต  2) ไม่มีกล้อง  3) กล้องถูกโปรแกรมอื่นใช้  4) เบราว์เซอร์ไม่รองรับ
// กฎ: ห้ามปล่อยจอว่าง ทุกปัญหาต้องบอก "ทำอย่างไรต่อ" และมีปุ่มให้กด
// ============================================================
import { cameraErrorMessage } from './camera.js';
import { esc, toast } from './ui.js';

// ขั้นตอนเพิ่มเติมของแต่ละกรณี (แสดงเป็นรายการข้อ ๆ ให้อ่านง่าย)
const STEPS = {
  denied: [
    'มองหารูปแม่กุญแจ 🔒 (หรือไอคอนกล้อง) ทางซ้ายของช่องที่อยู่เว็บด้านบน',
    'กดที่รูปแม่กุญแจ แล้วหาหัวข้อ "กล้อง" (Camera)',
    'เปลี่ยนจาก "บล็อก" เป็น "อนุญาต" (Allow)',
    'กดปุ่ม "ลองใหม่" ด้านล่าง (บางเครื่องต้องรีเฟรชหน้า 1 ครั้ง)',
  ],
  nocamera: [
    'ถ้าใช้กล้อง USB: ถอดแล้วเสียบใหม่ให้แน่น ลองเปลี่ยนช่อง USB',
    'ถ้าเป็นโน้ตบุ๊ก: ดูว่ามีปุ่ม/สวิตช์ปิดกล้อง หรือฝาปิดเลนส์หรือไม่',
    'กดปุ่ม "ค้นหากล้องอีกครั้ง"',
  ],
  busy: [
    'ปิดโปรแกรมประชุมออนไลน์: Zoom, Microsoft Teams, Google Meet, LINE, Discord, Skype',
    'ปิดโปรแกรมอัดหน้าจอ/ไลฟ์: OBS Studio, Bandicam, แอปกล้องของ Windows (Camera)',
    'ปิดแท็บอื่นของเบราว์เซอร์ที่เปิดแอปนี้ค้างไว้',
    'จากนั้นกด "ลองใหม่"',
  ],
  unsupported: [
    'เปิดแอปด้วย Google Chrome หรือ Microsoft Edge รุ่นล่าสุด',
    'ต้องเปิดผ่าน http://localhost (ดับเบิลคลิก start.bat) ไม่ใช่เปิดไฟล์ตรง ๆ',
    'กด "คัดลอกลิงก์" แล้วนำไปวางใน Chrome',
  ],
  unknown: ['กด "ลองใหม่" ถ้ายังไม่ได้ ให้ปิดเบราว์เซอร์ทั้งหมดแล้วเปิดใหม่'],
};

// แสดงกล่องปัญหาใน host  onRetry = ฟังก์ชันลองเปิดกล้องใหม่, onRescan = ค้นหากล้องใหม่
export function showCameraError(host, err, { onRetry, onRescan } = {}) {
  const info = cameraErrorMessage(err);
  console.warn('[camera] ปัญหา:', info.code, err);
  host.innerHTML = `
    <div class="alert" role="alert" data-code="${info.code}">
      <h3>⚠️ ${esc(info.title)}</h3>
      <p>${esc(info.detail)}</p>
      <ol>${(STEPS[info.code] || STEPS.unknown).map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
      <div class="row"></div>
    </div>`;
  const row = host.querySelector('.row');
  const add = (label, cls, fn) => {
    const b = document.createElement('button');
    b.className = 'btn-glow ' + cls; b.textContent = label; b.onclick = fn;
    row.appendChild(b);
  };
  // ปุ่มแก้ไขตามกรณี
  if (info.code === 'nocamera') add('🔍 ค้นหากล้องอีกครั้ง', '', async () => { await onRescan?.(); onRetry?.(); });
  else if (info.code === 'unsupported') add('📋 คัดลอกลิงก์ไปเปิดใน Chrome', '', async () => {
    try { await navigator.clipboard.writeText(location.href); toast('คัดลอกลิงก์แล้ว นำไปวางใน Chrome ได้เลย'); }
    catch { toast('คัดลอกไม่ได้ กรุณาจดที่อยู่: ' + location.href, 'warning', 6); }
  });
  else add('🔄 ลองใหม่', '', () => onRetry?.());
  if (info.code === 'denied') add('รีเฟรชหน้า', 'ghost', () => location.reload());
  host.classList.remove('hidden');
  return info;
}

// โหมดจำลองปัญหาเพื่อทดสอบทั้ง 4 กรณีได้โดยไม่ต้องทำให้กล้องพังจริง
// ใช้: index.html?sim=denied | nocamera | busy | unsupported
const SIM_NAMES = { denied: 'NotAllowedError', nocamera: 'NotFoundError', busy: 'NotReadableError', unsupported: 'NotSupportedError' };
export function simulatedError() {
  const sim = new URLSearchParams(location.search).get('sim');
  if (!sim || !SIM_NAMES[sim]) return null;
  const e = new Error('จำลองปัญหา ' + sim); e.name = SIM_NAMES[sim];
  return e;
}
