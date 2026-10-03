// ============================================================
// camera-test.js — ปุ่ม "ทดสอบกล้อง" ให้ผู้ใช้ตรวจเครื่องเองได้ (Lab 10 SHOULD)
// ทำ 6 ข้อ: เปิดกล้อง → FPS → ความละเอียด → ความสว่าง → ถ่ายภาพนิ่ง → ปิดกล้องจนไฟดับ
// ============================================================
import { startCamera, stopCamera, getStats, measureBrightness, captureStill } from './camera.js';
import { showCameraError, simulatedError } from './camera-errors.js';
import { esc } from './ui.js';

const $ = (id) => document.getElementById(id);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let busy = false;

// เพิ่มผลลัพธ์ 1 บรรทัด: ok = true ผ่าน / false ไม่ผ่าน / 'warn' ควรปรับปรุง
function line(list, ok, text) {
  const li = document.createElement('li');
  const icon = ok === true ? '✅' : ok === 'warn' ? '⚠️' : '❌';
  li.innerHTML = `${icon} ${esc(text)}`;
  li.dataset.ok = String(ok);
  list.appendChild(li);
}

export async function runCameraTest() {
  if (busy) return;
  busy = true;
  const list = $('testList'), btn = $('btnTest');
  list.innerHTML = ''; $('testShot').innerHTML = ''; $('testError').classList.add('hidden');
  btn.disabled = true; btn.textContent = 'กำลังทดสอบ…';
  let stream = null;
  try {
    const sim = simulatedError();
    if (sim) throw sim;
    stream = await startCamera($('testVideo'));
    line(list, true, 'เปิดกล้องได้');
    await wait(2500); // ให้กล้องปรับแสงและนับ FPS สักครู่
    const s = getStats();
    line(list, s.fps >= 20 ? true : s.fps >= 12 ? 'warn' : false, `ความเร็วภาพ ${s.fps} เฟรม/วินาที (ควร 20 ขึ้นไป)`);
    line(list, s.width >= 640 ? true : 'warn', `ความละเอียด ${s.width}×${s.height}`);
    const b = Math.round(measureBrightness($('testVideo')));
    line(list, b >= 60 && b <= 225 ? true : 'warn', `ความสว่าง ${b}/255 ${b < 60 ? '(มืดเกินไป)' : b > 225 ? '(จ้าเกินไป)' : '(พอดี)'}`);
    const still = captureStill($('testVideo'), { mirror: true });
    $('testShot').innerHTML = `<img alt="ภาพทดสอบ" src="${still.dataUrl}">`;
    line(list, true, `ถ่ายภาพนิ่งได้ (${still.canvas.width}×${still.canvas.height})`);
  } catch (err) {
    line(list, false, 'เปิดกล้องไม่ได้ — ดูวิธีแก้ด้านล่าง');
    showCameraError($('testError'), err, { onRetry: runCameraTest });
  } finally {
    // ปิดกล้องแล้วตรวจว่าทุก track หยุดจริง (readyState = 'ended' แปลว่าไฟกล้องดับ)
    stopCamera();
    if (stream) {
      const allEnded = stream.getTracks().every((t) => t.readyState === 'ended');
      line(list, allEnded, allEnded ? 'ปิดกล้องแล้ว ทุก track หยุด ไฟกล้องดับ' : 'ยังมี track ค้างอยู่!');
    }
    btn.disabled = false; btn.textContent = '▶ ทดสอบอีกครั้ง';
    busy = false;
  }
}

// ออกจากหน้าทดสอบ → ปิดกล้องเสมอ
export function leaveCameraTest() { stopCamera(); }
