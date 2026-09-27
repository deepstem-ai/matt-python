// ============================================================
// camera.js — ทุกอย่างเกี่ยวกับกล้องอยู่ที่นี่ที่เดียว (Lab 10)
// ห้ามแตะ: โมเดล AI, ฐานข้อมูล, การวาดเกม
// ============================================================

const CAM_KEY = 'hr-camera-id';   // key สำหรับจำกล้องที่ผู้ใช้เลือก
let stream = null;                 // สายวิดีโอที่เปิดอยู่
let videoEl = null;                // <video> ที่กำลังแสดงภาพ
let status = 'idle';               // idle | starting | running | error | stopped
let frames = 0, fps = 0, lastT = performance.now(), rafId = 0;

// นับเฟรมจริงของวิดีโอ เพื่อคำนวณ FPS
function countFrames() {
  if (!videoEl) return;
  const step = () => {
    frames++;
    const now = performance.now();
    if (now - lastT >= 1000) { fps = Math.round((frames * 1000) / (now - lastT)); frames = 0; lastT = now; }
    if (videoEl && 'requestVideoFrameCallback' in videoEl) videoEl.requestVideoFrameCallback(step);
    else rafId = requestAnimationFrame(step);
  };
  if ('requestVideoFrameCallback' in videoEl) videoEl.requestVideoFrameCallback(step);
  else rafId = requestAnimationFrame(step);
}

// เปิดกล้อง: ถ้าไม่ส่ง deviceId จะใช้กล้องที่จำไว้ ถ้ากล้องนั้นหายไปจะถอยไปใช้กล้องแรกเงียบ ๆ
export async function startCamera(video, deviceId, { width = 1280, height = 720 } = {}) {
  if (!navigator.mediaDevices?.getUserMedia) {
    const e = new Error('unsupported'); e.name = 'NotSupportedError'; throw e;
  }
  stopCamera();
  status = 'starting';
  const wanted = deviceId || localStorage.getItem(CAM_KEY) || undefined;
  const make = (id) => ({ audio: false, video: { width: { ideal: width }, height: { ideal: height }, ...(id ? { deviceId: { exact: id } } : { facingMode: 'user' }) } });
  try {
    try {
      stream = await navigator.mediaDevices.getUserMedia(make(wanted));
    } catch (err) {
      // กล้องที่จำไว้ไม่อยู่แล้ว → ใช้กล้องตัวแรกแทน และบันทึกลง console
      if (wanted && (err.name === 'OverconstrainedError' || err.name === 'NotFoundError')) {
        console.warn('[camera] กล้องที่จำไว้หายไป ใช้กล้องแรกแทน', wanted);
        localStorage.removeItem(CAM_KEY);
        stream = await navigator.mediaDevices.getUserMedia(make(undefined));
      } else throw err;
    }
    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;
    await video.play();
    videoEl = video;
    status = 'running';
    const track = stream.getVideoTracks()[0];
    const id = track.getSettings().deviceId;
    if (id) localStorage.setItem(CAM_KEY, id);
    // ถ้าถอดสาย USB กลางคัน track จะ "ended" → แจ้งหน้าจอผ่าน event
    track.addEventListener('ended', () => {
      status = 'error';
      window.dispatchEvent(new CustomEvent('camera-lost'));
    });
    countFrames();
    return stream;
  } catch (err) {
    status = 'error';
    throw err;
  }
}

// ปิดกล้องจริง ๆ หยุดทุก track → ไฟกล้องต้องดับ
export function stopCamera() {
  if (stream) stream.getTracks().forEach((t) => t.stop());
  if (videoEl) { videoEl.srcObject = null; }
  cancelAnimationFrame(rafId);
  stream = null; videoEl = null; fps = 0;
  if (status !== 'idle') status = 'stopped';
}

// รายชื่อกล้องทั้งหมด (ชื่อกล้องจะเห็นหลังผู้ใช้อนุญาตแล้วเท่านั้น)
export async function listCameras() {
  if (!navigator.mediaDevices?.enumerateDevices) return [];
  const all = await navigator.mediaDevices.enumerateDevices();
  return all.filter((d) => d.kind === 'videoinput').map((d, i) => ({ deviceId: d.deviceId, label: d.label || `กล้อง ${i + 1}` }));
}

// ค่าสถิติสด: FPS ความละเอียด สถานะ
export function getStats() {
  const s = stream?.getVideoTracks()[0]?.getSettings() || {};
  return { fps, width: s.width || videoEl?.videoWidth || 0, height: s.height || videoEl?.videoHeight || 0, status, deviceId: s.deviceId || null };
}

export function isRunning() { return status === 'running'; }
export function getSavedCameraId() { return localStorage.getItem(CAM_KEY); }
export function saveCameraId(id) { localStorage.setItem(CAM_KEY, id); }

// ถ่ายภาพนิ่งหนึ่งเฟรม คืน { canvas, imageData, dataUrl } (mirror = กลับซ้ายขวาให้เหมือนกระจก)
export function captureStill(video = videoEl, { mirror = true, type = 'image/jpeg', quality = 0.9 } = {}) {
  if (!video || !video.videoWidth) throw new Error('กล้องยังไม่พร้อม');
  const c = document.createElement('canvas');
  c.width = video.videoWidth; c.height = video.videoHeight;
  const ctx = c.getContext('2d');
  if (mirror) { ctx.translate(c.width, 0); ctx.scale(-1, 1); }
  ctx.drawImage(video, 0, 0);
  return { canvas: c, imageData: ctx.getImageData(0, 0, c.width, c.height), dataUrl: c.toDataURL(type, quality) };
}

// ความสว่างเฉลี่ยของภาพ 0-255 (สุ่มจุดเพื่อให้เร็ว) ใช้กับการทดลองเรื่องแสง
const _bc = document.createElement('canvas');
export function measureBrightness(video = videoEl) {
  if (!video || !video.videoWidth) return 0;
  _bc.width = 64; _bc.height = 36;
  const ctx = _bc.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(video, 0, 0, 64, 36);
  const d = ctx.getImageData(0, 0, 64, 36).data;
  let sum = 0;
  for (let i = 0; i < d.length; i += 4) sum += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
  return sum / (d.length / 4);
}

// แปลงข้อผิดพลาดของกล้องเป็นข้อความภาษาไทยที่บอกวิธีแก้เสมอ (4 กรณี + อื่น ๆ)
export function cameraErrorMessage(err) {
  const n = err?.name || '';
  if (n === 'NotAllowedError' || n === 'SecurityError' || n === 'PermissionDeniedError')
    return { code: 'denied', title: 'ยังไม่ได้รับอนุญาตให้ใช้กล้อง', detail: 'กดรูปแม่กุญแจ 🔒 ข้างช่องที่อยู่เว็บ → เลือก "กล้อง" → เปลี่ยนเป็น "อนุญาต" แล้วกดปุ่มลองใหม่' };
  if (n === 'NotFoundError' || n === 'DevicesNotFoundError' || n === 'OverconstrainedError')
    return { code: 'nocamera', title: 'ไม่พบกล้องในเครื่องนี้', detail: 'ตรวจว่าเสียบกล้อง USB แน่นแล้ว หรือเครื่องมีกล้องในตัว จากนั้นกดลองใหม่' };
  if (n === 'NotReadableError' || n === 'TrackStartError' || n === 'AbortError')
    return { code: 'busy', title: 'กล้องถูกโปรแกรมอื่นใช้อยู่', detail: 'ปิดโปรแกรมที่อาจใช้กล้อง เช่น Zoom, Teams, LINE, Discord, โปรแกรมอัดหน้าจอ หรือแท็บอื่นที่เปิดแอปนี้ค้างไว้ แล้วกดลองใหม่' };
  if (n === 'NotSupportedError' || n === 'TypeError')
    return { code: 'unsupported', title: 'เบราว์เซอร์นี้ใช้กล้องไม่ได้', detail: 'กรุณาเปิดด้วย Google Chrome หรือ Microsoft Edge รุ่นใหม่ และเปิดผ่าน http://localhost เท่านั้น' };
  return { code: 'unknown', title: 'เปิดกล้องไม่สำเร็จ', detail: 'ลองกดปุ่มลองใหม่ ถ้ายังไม่ได้ให้รีสตาร์ตเบราว์เซอร์ (' + (n || err?.message || 'ไม่ทราบสาเหตุ') + ')' };
}
