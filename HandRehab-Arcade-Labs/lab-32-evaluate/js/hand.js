// ============================================================
// hand.js — ตรวจจับมือ 21 จุดด้วย MediaPipe Hand Landmarker (Lab 16, 17)
// โมเดลทำงาน 2 ขั้น: (1) palm detector หาฝ่ามือ (2) landmark model หา 21 จุดในกรอบนั้น
//
// หมายเลขจุดสำคัญ:
//   0 ข้อมือ · 4 ปลายนิ้วโป้ง · 8 ปลายนิ้วชี้ · 12 ปลายนิ้วกลาง · 16 ปลายนิ้วนาง · 20 ปลายนิ้วก้อย
//   5 9 13 17 = ข้อโคนนิ้ว (knuckle) ของนิ้วชี้ กลาง นาง ก้อย
// ห้ามแตะ: การเปิดกล้อง, ฐานข้อมูล, กติกาเกม
// ============================================================
import { loadVisionLib, fetchModel, createTask, modelUrls, MODELS } from './vision.js';
import { FINGERS } from './geometry.js';
export { FINGERS };
export const FINGER_NAMES = ['thumb', 'index', 'middle', 'ring', 'little'];
export const FINGER_TH = { thumb: 'โป้ง', index: 'ชี้', middle: 'กลาง', ring: 'นาง', little: 'ก้อย' };
export const TIPS = [4, 8, 12, 16, 20];

// เส้นเชื่อม 21 เส้น: [จุดเริ่ม, จุดจบ, ชื่อนิ้ว]
export const HAND_CONNECTIONS = [
  [0, 1, 'thumb'], [1, 2, 'thumb'], [2, 3, 'thumb'], [3, 4, 'thumb'],
  [0, 5, 'index'], [5, 6, 'index'], [6, 7, 'index'], [7, 8, 'index'],
  [9, 10, 'middle'], [10, 11, 'middle'], [11, 12, 'middle'],
  [13, 14, 'ring'], [14, 15, 'ring'], [15, 16, 'ring'],
  [0, 17, 'little'], [17, 18, 'little'], [18, 19, 'little'], [19, 20, 'little'],
  [5, 9, 'palm'], [9, 13, 'palm'], [13, 17, 'palm'],
];

let landmarker = null;
let state = { ready: false, delegate: null, error: null, numHands: 1 };
// สถิติ
let lastTs = -1, aiMs = 0, frames = 0, found = 0, fps = 0, fpsFrames = 0, fpsT = performance.now();

// เตรียมโมเดล คืน { ready, delegate }
// เลือก numHands = 1 เพราะท่าบริหารทำทีละข้าง และเร็วกว่า 2 มือเกือบเท่าตัว
export async function initHand({ numHands = 1, minDetection = 0.5, minTracking = 0.5, minPresence = 0.5, onProgress } = {}) {
  try {
    const { lib } = await loadVisionLib();
    const m = MODELS.hand_landmarker;
    const { bytes } = await fetchModel(modelUrls('hand_landmarker'), m.minBytes, onProgress);
    const { task, delegate } = await createTask(lib.HandLandmarker, bytes, {
      runningMode: 'VIDEO', numHands,
      minHandDetectionConfidence: minDetection,
      minTrackingConfidence: minTracking,
      minHandPresenceConfidence: minPresence,
    });
    landmarker = task;
    state = { ready: true, delegate, error: null, numHands };
  } catch (e) {
    state = { ...state, ready: false, error: e.message };
    throw e;
  }
  return { ...state };
}

export function handInfo() { return { ...state }; }

// ตรวจมือในเฟรมนี้
// คืน null ถ้าไม่เจอมือ หรือ { points: 21 จุด {x,y,z} (0-1), world: จุดหน่วยเมตร, handedness: 'Left'|'Right', score, hands: [...ทุกมือ] }
export function detectHand(video, timestamp = performance.now()) {
  if (!landmarker || !video?.videoWidth) return null;
  if (timestamp <= lastTs) timestamp = lastTs + 1; // เวลาต้องเพิ่มขึ้นเสมอ
  lastTs = timestamp;
  const t0 = performance.now();
  const r = landmarker.detectForVideo(video, timestamp);
  aiMs = performance.now() - t0;
  frames++;
  fpsFrames++;
  const now = performance.now();
  if (now - fpsT >= 1000) { fps = Math.round((fpsFrames * 1000) / (now - fpsT)); fpsFrames = 0; fpsT = now; }
  if (!r.landmarks?.length) return null;
  found++;
  const hands = r.landmarks.map((pts, i) => ({
    points: pts,
    world: r.worldLandmarks?.[i] || null,
    // หมายเหตุ: MediaPipe ตั้งชื่อมือโดยถือว่าภาพกลับด้านแล้ว ภาพกล้องหน้าจึงอาจสลับซ้ายขวา
    handedness: r.handednesses?.[i]?.[0]?.categoryName || r.handedness?.[i]?.[0]?.categoryName || '?',
    score: r.handednesses?.[i]?.[0]?.score ?? r.handedness?.[i]?.[0]?.score ?? 0,
  }));
  return { ...hands[0], hands };
}

// FPS ของการตรวจ, เวลา AI ต่อเฟรม (ms), % ของเฟรมที่เจอมือ
export function getStats() {
  return { fps, aiMs: +aiMs.toFixed(1), foundPct: frames ? Math.round((found / frames) * 100) : 0, frames };
}
export function resetStats() { frames = 0; found = 0; }

// ============================================================
// การวาดมือ 3 สไตล์ (Lab 17): simple / neon / trail
// canvas ต้องมีขนาดเท่าวิดีโอ ถ้าวิดีโอกลับด้านด้วย CSS ก็ให้ canvas กลับด้วย CSS เหมือนกัน
// ============================================================
const trails = TIPS.map(() => []); // ตำแหน่งปลายนิ้วย้อนหลัง
export function fingerColors() {
  const cs = getComputedStyle(document.body);
  const g = (n, d) => cs.getPropertyValue(n).trim() || d;
  return {
    thumb: g('--f-thumb', '#F472B6'), index: g('--f-index', '#22D3EE'), middle: g('--f-middle', '#A3E635'),
    ring: g('--f-ring', '#FBBF24'), little: g('--f-little', '#A78BFA'), palm: g('--text-2', '#94A3B8'),
  };
}
function fingerOf(i) {
  if (i === 0) return 'palm';
  return FINGER_NAMES.find((f) => FINGERS[f].includes(i));
}

// opts: { style: 'simple'|'neon'|'trail', lineWidth, glowLayers, trailLength, clear, colors }
export function drawHand(canvas, hand, opts = {}) {
  const { style = 'neon', lineWidth = 5, glowLayers = 2, trailLength = 12, clear = true } = opts;
  const colors = opts.colors || fingerColors();
  const ctx = canvas.getContext('2d');
  if (clear) ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!hand) { trails.forEach((t) => t.length = 0); return; }
  const W = canvas.width, H = canvas.height;
  const P = hand.points.map((p) => [p.x * W, p.y * H]);
  const glow = style !== 'simple';

  // เส้นหางแสงของปลายนิ้ว (เฉพาะสไตล์ trail)
  if (style === 'trail') {
    TIPS.forEach((tip, k) => {
      const t = trails[k];
      t.push(P[tip]);
      while (t.length > trailLength) t.shift();
      const col = colors[FINGER_NAMES[k]];
      for (let i = 1; i < t.length; i++) {
        ctx.globalAlpha = i / t.length; // จางลงเรื่อย ๆ
        ctx.strokeStyle = col; ctx.lineWidth = lineWidth * (i / t.length) * 1.6;
        ctx.beginPath(); ctx.moveTo(t[i - 1][0], t[i - 1][1]); ctx.lineTo(t[i][0], t[i][1]); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    });
  }

  // เส้นเชื่อม
  ctx.lineCap = 'round';
  for (const [a, b, f] of HAND_CONNECTIONS) {
    ctx.strokeStyle = colors[f];
    ctx.lineWidth = style === 'simple' ? 2 : lineWidth;
    if (glow) { ctx.shadowColor = colors[f]; ctx.shadowBlur = 12; }
    ctx.beginPath(); ctx.moveTo(P[a][0], P[a][1]); ctx.lineTo(P[b][0], P[b][1]); ctx.stroke();
  }
  // จุด (ปลายนิ้วใหญ่กว่า + วงเรืองแสงหลายชั้น)
  P.forEach(([x, y], i) => {
    const col = colors[fingerOf(i)];
    const isTip = TIPS.includes(i);
    const r = isTip ? (style === 'simple' ? 5 : 8) : (style === 'simple' ? 3 : 4);
    if (glow && isTip) {
      for (let k = glowLayers; k >= 1; k--) {
        ctx.globalAlpha = 0.18 * (glowLayers - k + 1);
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r + k * 6, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = isTip ? col : '#F8FAFC';
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  });
  ctx.shadowBlur = 0;
}

// ปรับขนาด canvas ให้เท่าวิดีโอ (เรียกทุกเฟรมได้ ถ้าขนาดเท่าเดิมจะไม่ทำอะไร)
export function fitCanvas(canvas, video) {
  if (video.videoWidth && (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight)) {
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
  }
}
