// ============================================================
// vision.js — งาน AI ทั้งหมดที่ใช้ MediaPipe Tasks Vision (Lab 11)
//  - โหลดไลบรารีจาก CDN แบบ ES module
//  - ดาวน์โหลดโมเดลพร้อมลิงก์สำรอง + ตรวจขนาดไฟล์
//  - ลอง GPU ก่อน ถ้าไม่ได้ถอยไป CPU อัตโนมัติ
//  - ตรวจจับใบหน้าด้วย BlazeFace (Face Detector)
// ห้ามแตะ: การเปิดกล้อง, ฐานข้อมูล
// ============================================================

// ล็อกเวอร์ชันไว้ เพื่อให้โค้ดทำงานเหมือนเดิมทุกวัน (ไม่โดนอัปเดตเงียบ ๆ)
export const MP_VERSION = '0.10.14';
export const MP_BUNDLE_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VERSION}/vision_bundle.mjs`;
export const MP_WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VERSION}/wasm`;

// ลิงก์โมเดล: ตัวหลักใช้ /1/ ตัวสำรองเปลี่ยนเป็น /latest/
// minBytes = ขนาดต่ำสุดที่ยอมรับ ถ้าเล็กกว่านี้แปลว่าได้หน้าเว็บบล็อกของโรงเรียนมาแทนไฟล์จริง
const G = 'https://storage.googleapis.com/mediapipe-models';
export const MODELS = {
  face_detector: { file: 'blaze_face_short_range.tflite', url: `${G}/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`, minBytes: 100_000 },
  face_landmarker: { file: 'face_landmarker.task', url: `${G}/face_landmarker/face_landmarker/float16/1/face_landmarker.task`, minBytes: 1_000_000 },
  hand_landmarker: { file: 'hand_landmarker.task', url: `${G}/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`, minBytes: 5_000_000 },
};
export const backupUrl = (url) => url.replace('/1/', '/latest/');

// ที่อยู่ของไฟล์ทั้งหมดถูกคิดในฟังก์ชันเดียว (Lab 35 จะเพิ่มการหาในเครื่องก่อน)
// คืน "รายการลิงก์" เรียงตามลำดับที่จะลอง
export function modelUrls(key) {
  const m = MODELS[key];
  return [m.url, backupUrl(m.url)];
}
export function libUrls() {
  return { bundle: [MP_BUNDLE_URL], wasm: [MP_WASM_URL] };
}

let lib = null;       // ตัวไลบรารีที่โหลดแล้ว
let fileset = null;   // ไฟล์ wasm ที่เตรียมแล้ว

// โหลดไลบรารี MediaPipe (ทำครั้งเดียว ครั้งต่อไปใช้ของเดิม)
export async function loadVisionLib() {
  if (lib && fileset) return { lib, fileset };
  const { bundle, wasm } = libUrls();
  let lastErr;
  for (let i = 0; i < bundle.length; i++) {
    try {
      lib = await import(/* webpackIgnore: true */ bundle[i]);
      fileset = await lib.FilesetResolver.forVisionTasks(wasm[i] || wasm[0]);
      return { lib, fileset };
    } catch (e) { lastErr = e; console.warn('[vision] โหลดไลบรารีไม่ได้จาก', bundle[i], e); }
  }
  throw new Error('โหลดไลบรารี AI ไม่สำเร็จ ตรวจอินเทอร์เน็ต หรือเตรียมไฟล์ออฟไลน์ตาม Lab 35 (' + (lastErr?.message || '') + ')');
}

// ดาวน์โหลดโมเดลเป็นไบต์ ลองทีละลิงก์ ตรวจขนาด รายงานความคืบหน้า 0-1
export async function fetchModel(urls, minBytes, onProgress) {
  const errors = [];
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const total = Number(res.headers.get('content-length')) || 0;
      const reader = res.body?.getReader();
      let bytes;
      if (reader) {
        const chunks = []; let got = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value); got += value.length;
          if (onProgress && total) onProgress(got / total);
        }
        bytes = new Uint8Array(got);
        let off = 0; for (const c of chunks) { bytes.set(c, off); off += c.length; }
      } else {
        bytes = new Uint8Array(await res.arrayBuffer());
      }
      // ไฟล์เล็กผิดปกติ = ได้หน้าเตือน/หน้าบล็อกมาแทน ไม่ใช่โมเดลจริง
      if (bytes.length < minBytes) throw new Error(`ไฟล์เล็กผิดปกติ (${(bytes.length / 1024).toFixed(0)} KB) น่าจะถูกระบบกรองเว็บบล็อก`);
      onProgress?.(1);
      console.info(`[vision] โหลดโมเดลสำเร็จ ${url} (${(bytes.length / 1048576).toFixed(2)} MB)`);
      return { bytes, url };
    } catch (e) {
      console.warn('[vision] ลิงก์นี้ใช้ไม่ได้ ลองลิงก์ถัดไป', url, e.message);
      errors.push(url + ' → ' + e.message);
    }
  }
  const err = new Error('ดาวน์โหลดโมเดลไม่สำเร็จทุกลิงก์:\n' + errors.join('\n'));
  err.urls = urls;
  throw err;
}

// สร้างตัวทำงาน AI (Task) โดยลอง GPU ก่อน ถ้าพังถอยไป CPU แล้วบอกว่าใช้ตัวไหนอยู่
export async function createTask(TaskClass, modelBytes, options) {
  const { fileset: fs } = await loadVisionLib();
  for (const delegate of ['GPU', 'CPU']) {
    try {
      const task = await TaskClass.createFromOptions(fs, {
        ...options,
        baseOptions: { modelAssetBuffer: modelBytes, delegate },
      });
      console.info('[vision] ใช้หน่วยประมวลผล', delegate);
      return { task, delegate };
    } catch (e) {
      console.warn(`[vision] ใช้ ${delegate} ไม่ได้`, e);
    }
  }
  throw new Error('สร้างตัว AI ไม่สำเร็จทั้ง GPU และ CPU');
}

// ============================================================
// ส่วนตรวจจับใบหน้า (Face Detector / BlazeFace)
// ============================================================
let faceDetector = null;
let info = { ready: false, delegate: null, modelUrl: null, error: null, aiMs: 0 };

// เตรียมทุกอย่าง แล้วรายงานว่าพร้อมไหม ใช้ GPU หรือ CPU
export async function initVision({ minConfidence = 0.5, onProgress } = {}) {
  try {
    const { lib: L } = await loadVisionLib();
    const m = MODELS.face_detector;
    const { bytes, url } = await fetchModel(modelUrls('face_detector'), m.minBytes, onProgress);
    const { task, delegate } = await createTask(L.FaceDetector, bytes, { runningMode: 'VIDEO', minDetectionConfidence: minConfidence });
    faceDetector = task;
    info = { ready: true, delegate, modelUrl: url, error: null, aiMs: 0 };
  } catch (e) {
    info = { ...info, ready: false, error: e.message };
    throw e;
  }
  return info;
}

// เปลี่ยนค่าความมั่นใจขั้นต่ำขณะทำงานได้ทันที
export async function setFaceConfidence(v) {
  if (faceDetector) await faceDetector.setOptions({ minDetectionConfidence: v });
}

let lastTs = -1;
// ตรวจใบหน้าในเฟรมปัจจุบัน คืน [{ box:{x,y,w,h} (0-1), score, keypoints }]
export function detectFaces(video, timestamp = performance.now()) {
  if (!faceDetector || !video?.videoWidth) return [];
  if (timestamp <= lastTs) timestamp = lastTs + 1; // เวลาต้องเพิ่มขึ้นเสมอ ไม่งั้น MediaPipe จะ error
  lastTs = timestamp;
  const t0 = performance.now();
  const r = faceDetector.detectForVideo(video, timestamp);
  info.aiMs = performance.now() - t0;
  const W = video.videoWidth, H = video.videoHeight;
  return (r.detections || []).map((d) => ({
    box: { x: d.boundingBox.originX / W, y: d.boundingBox.originY / H, w: d.boundingBox.width / W, h: d.boundingBox.height / H },
    score: d.categories?.[0]?.score ?? 0,
    keypoints: d.keypoints || [],
  }));
}

export function getVisionInfo() { return { ...info }; }

// วาดกรอบแบบ "มุมช่องมองภาพกล้อง" รอบใบหน้า (canvas ขนาดเท่าวิดีโอ, พิกัด 0-1)
export function drawFaces(canvas, faces, { color = '#22D3EE', clear = true, style = 'corners' } = {}) {
  const ctx = canvas.getContext('2d');
  if (clear) ctx.clearRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height;
  for (const f of faces) {
    const x = f.box.x * W, y = f.box.y * H, w = f.box.w * W, h = f.box.h * H;
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.shadowColor = color; ctx.shadowBlur = 14;
    if (style === 'rect') ctx.strokeRect(x, y, w, h);
    else {
      const L = Math.min(w, h) * 0.25; // ความยาวขามุม
      ctx.beginPath();
      [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]].forEach(([cx, cy, sx, sy]) => {
        ctx.moveTo(cx, cy + sy * L); ctx.lineTo(cx, cy); ctx.lineTo(cx + sx * L, cy);
      });
      ctx.stroke();
    }
    ctx.restore();
  }
}
