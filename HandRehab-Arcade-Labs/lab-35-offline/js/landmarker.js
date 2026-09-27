// ============================================================
// landmarker.js — MediaPipe Face Landmarker (478 จุดบนใบหน้า) ใช้ใน Lab 14 และ 15
// โหลดโมเดลจากลิงก์หลัก ถ้าไม่ได้ลองลิงก์สำรอง (/1/ → /latest/) ผ่าน vision.js
// ห้ามแตะ: การเปิดกล้อง, ฐานข้อมูล
// ============================================================
import { loadVisionLib, fetchModel, modelUrls, MODELS, createTask } from './vision.js';

let task = null;
let info = { ready: false, delegate: null, error: null, aiMs: 0 };
let lastTs = -1;

// เตรียมโมเดล (เรียกซ้ำได้ ครั้งต่อไปใช้ของเดิม)
export async function initLandmarker({ onProgress } = {}) {
  if (task) return info;
  try {
    const { lib } = await loadVisionLib();
    const { bytes } = await fetchModel(modelUrls('face_landmarker'), MODELS.face_landmarker.minBytes, onProgress);
    const r = await createTask(lib.FaceLandmarker, bytes, {
      runningMode: 'VIDEO', numFaces: 1, outputFaceBlendshapes: true,
      minFaceDetectionConfidence: 0.5, minFacePresenceConfidence: 0.5, minTrackingConfidence: 0.5,
    });
    task = r.task;
    info = { ready: true, delegate: r.delegate, error: null, aiMs: 0 };
  } catch (e) {
    info = { ...info, ready: false, error: e.message };
    throw e;
  }
  return info;
}

export function landmarkerInfo() { return { ...info }; }

// หาจุดใบหน้าในเฟรมของ video → { points: [478 {x,y,z}], blend: {ชื่อ: ค่า}, width, height } หรือ null
export function detectLandmarks(video, ts = performance.now()) {
  if (!task || !video?.videoWidth) return null;
  if (ts <= lastTs) ts = lastTs + 1; // เวลาต้องเพิ่มขึ้นเสมอ
  lastTs = ts;
  const t0 = performance.now();
  const r = task.detectForVideo(video, ts);
  info.aiMs = performance.now() - t0;
  const pts = r.faceLandmarks?.[0];
  if (!pts || pts.length < 468) return null;
  const blend = {};
  (r.faceBlendshapes?.[0]?.categories || []).forEach((c) => { blend[c.categoryName] = c.score; });
  return { points: pts, blend, width: video.videoWidth, height: video.videoHeight };
}
