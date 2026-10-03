// ============================================================
// face-page.js — หน้าทดลองตรวจจับใบหน้า (Lab 11)
// ลำดับ: เปิดกล้อง → โหลด AI (มีลิงก์สำรอง+ตรวจขนาดไฟล์) → วนตรวจทุกเฟรม → วาดกรอบ
// ภาพทุกเฟรมประมวลผลในเครื่องนี้เท่านั้น ไม่มีภาพใดถูกส่งออกอินเทอร์เน็ต
// ============================================================
import { startCamera, stopCamera, measureBrightness } from './camera.js';
import { MODELS, initVision, detectFaces, drawFaces, setFaceConfidence, getVisionInfo } from './vision.js';
import { showCameraError } from './camera-errors.js';
import { cssVar, toast, esc, downloadCSV, FpsMeter } from './ui.js';
import { drawAccessory } from './face-fun.js';

const $ = (id) => document.getElementById(id);
const video = $('video'), canvas = $('overlay');
const fpsMeter = new FpsMeter();
let aiAvg = 0;          // เวลา AI เฉลี่ย (ms) แบบค่อย ๆ ปรับ ให้ตัวเลขไม่กระโดด
let loopOn = false;
let lastFaces = [];
const records = [];     // ผลการทดลองที่กดบันทึก (ใช้ในบทที่ 4)

// ---------- โหมดทดสอบลิงก์เสีย: index.html?fail=1 ----------
// เปลี่ยนลิงก์โมเดลเป็นที่อยู่ที่ใช้ไม่ได้ เพื่อดูว่าหน้าจอแจ้งปัญหาเป็นภาษาไทยจริง
if (new URLSearchParams(location.search).get('fail') === '1') {
  MODELS.face_detector.url = 'https://blocked.invalid/face_detector/1/no-such-model.tflite';
  console.warn('[face] โหมดทดสอบ ?fail=1 ใช้ลิงก์โมเดลที่เสียโดยตั้งใจ');
}

// ---------- 1) เปิดกล้อง ----------
async function openCam() {
  $('camError').classList.add('hidden');
  try {
    await startCamera(video);
    return true;
  } catch (err) {
    showCameraError($('camError'), err, { onRetry: boot });
    return false;
  }
}

// ---------- 2) โหลด AI พร้อมแถบความคืบหน้า ----------
async function loadAI() {
  $('aiError').classList.add('hidden');
  $('loadBox').classList.remove('hidden');
  $('loadBar').style.width = '0%';
  try {
    const info = await initVision({
      minConfidence: +$('conf').value,
      onProgress: (p) => { $('loadBar').style.width = Math.round(p * 100) + '%'; },
    });
    $('loadBox').classList.add('hidden');
    $('delegate').textContent = info.delegate;                // GPU หรือ CPU
    $('delegate').parentElement.classList.toggle('warn', info.delegate === 'CPU');
    $('modelUrl').textContent = info.modelUrl.includes('/latest/') ? 'ลิงก์สำรอง (/latest/)' : 'ลิงก์หลัก (/1/)';
    toast(`AI พร้อมแล้ว ใช้ ${info.delegate}`);
    return true;
  } catch (e) {
    // ห้ามจอว่าง: บอกสาเหตุเป็นภาษาไทย + ปุ่มลองใหม่
    $('loadBox').classList.add('hidden');
    $('aiError').classList.remove('hidden');
    $('aiErrorDetail').textContent = e.message;
    return false;
  }
}

// ---------- 3) วนตรวจทุกเฟรม ----------
function loop() {
  if (!loopOn) return;
  if (video.videoWidth && getVisionInfo().ready) {
    const faces = detectFaces(video, performance.now());
    render(faces.filter((f) => f.score >= +$('conf').value)); // กรองซ้ำ ให้เห็นผลทันทีที่เลื่อนแถบ
    aiAvg = aiAvg ? aiAvg * 0.9 + getVisionInfo().aiMs * 0.1 : getVisionInfo().aiMs;
    $('aiMs').textContent = aiAvg.toFixed(1);
    $('fps').textContent = fpsMeter.tick();
  }
  requestAnimationFrame(loop);
}

// วาดผลลัพธ์ 1 เฟรม (แยกออกมาเพื่อทดสอบด้วยใบหน้าจำลองได้)
export function render(faces) {
  lastFaces = faces;
  // canvas ต้องมีขนาดเท่าวิดีโอ พิกัด 0-1 × ขนาด = ตำแหน่งจริง (CSS กลับด้านให้เหมือนกระจก)
  if (canvas.width !== (video.videoWidth || 1280)) { canvas.width = video.videoWidth || 1280; canvas.height = video.videoHeight || 720; }
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if ($('showBox').checked) drawFaces(canvas, faces, { color: cssVar('--primary'), clear: false, style: $('boxStyle').value });
  const acc = $('accessory').value;
  if (acc !== 'none') faces.forEach((f) => drawAccessory(ctx, f, acc, canvas.width, canvas.height));
  // ป้ายตัวเลขเป็น DOM (ถ้าเขียนบน canvas ที่กลับด้าน ตัวหนังสือจะกลับด้านด้วย)
  const mirrored = $('stage').classList.contains('mirror');
  $('labels').innerHTML = $('showBox').checked ? faces.map((f) => {
    const left = mirrored ? 1 - f.box.x - f.box.w : f.box.x;
    return `<span class="face-tag" style="left:${left * 100}%;top:${f.box.y * 100}%">${Math.round(f.score * 100)}%</span>`;
  }).join('') : '';
  const best = faces.reduce((m, f) => Math.max(m, f.score), 0);
  $('count').textContent = faces.length;
  $('count').parentElement.className = 'chip ' + (faces.length ? 'ok' : 'warn');
  $('confBar').style.width = best * 100 + '%';
  $('confPct').textContent = Math.round(best * 100) + '%';
  $('noFace').classList.toggle('hidden', faces.length > 0);
}

// ---------- บันทึกผลการทดลอง (ลองค่าความมั่นใจ 3 ค่า / ห้องสว่าง-มืด) ----------
function addRecord() {
  const r = {
    time: new Date().toLocaleTimeString('th-TH'), minConfidence: +$('conf').value, faces: lastFaces.length,
    bestScore: +(lastFaces.reduce((m, f) => Math.max(m, f.score), 0)).toFixed(3), aiMs: +aiAvg.toFixed(1),
    fps: fpsMeter.fps, delegate: getVisionInfo().delegate || '-', brightness: Math.round(measureBrightness(video)),
    note: $('note').value.trim(),
  };
  records.push(r);
  $('recBody').innerHTML = records.map((x) => `<tr><td>${x.time}</td><td>${x.minConfidence}</td><td>${x.faces}</td><td>${Math.round(x.bestScore * 100)}%</td><td>${x.aiMs}</td><td>${x.delegate}</td><td>${x.brightness}</td><td>${esc(x.note)}</td></tr>`).join('');
  toast('บันทึกผลแล้ว');
}

// ---------- เริ่มทั้งหมด ----------
export async function boot() {
  if (!(await openCam())) return;
  if (!getVisionInfo().ready && !(await loadAI())) return;
  if (!loopOn) { loopOn = true; loop(); }
}

export function initFacePage() {
  $('conf').oninput = async () => {
    const v = +$('conf').value;
    $('confVal').textContent = v.toFixed(2);
    try { await setFaceConfidence(v); } catch (e) { console.warn('[face] ปรับค่าความมั่นใจไม่ได้', e); }
  };
  $('mirror').onchange = () => $('stage').classList.toggle('mirror', $('mirror').checked);
  $('btnRetryAI').onclick = async () => { if (await loadAI()) boot(); };
  $('btnNoFail').onclick = () => { location.href = location.pathname; };
  $('btnRecord').onclick = addRecord;
  $('btnCSV').onclick = () => records.length ? downloadCSV('face-experiment.csv', records) : toast('ยังไม่มีผลที่บันทึก', 'warning');
  $('btnNoFail').classList.toggle('hidden', !location.search.includes('fail=1'));
  // ออกจากหน้า/ปิดแท็บ → ปิดกล้องทุกครั้ง
  window.addEventListener('pagehide', () => { loopOn = false; stopCamera(); });
  window.addEventListener('camera-lost', () => { toast('กล้องหลุดการเชื่อมต่อ กด "ลองใหม่"', 'error', 5); showCameraError($('camError'), { name: 'NotFoundError' }, { onRetry: boot }); });
  window.__faceLab = { render, pause: () => { loopOn = false; } }; // สำหรับทดสอบด้วยใบหน้าจำลอง
}
