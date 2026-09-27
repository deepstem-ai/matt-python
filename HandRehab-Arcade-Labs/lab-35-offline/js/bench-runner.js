// ============================================================
// bench-runner.js — ทดสอบอัตโนมัติ 6 สถานการณ์ แล้ววัดความลื่น (Lab 33)
//   ค่าที่วัด: เฟรมต่อวินาทีเฉลี่ย · เฟรมต่อวินาทีต่ำสุด (ช่วงครึ่งวินาทีที่แย่ที่สุด) · เวลาประมวลผลต่อเฟรม (ms)
//   ช่วงอุ่นเครื่องต้นแต่ละสถานการณ์ (10% ของเวลา สูงสุด 1 วินาที) ไม่นับ เพราะการ์ดจอกำลังเตรียมตัว
// ถ้ากล้องไม่เห็นมือ ระบบจะวาด "มือตัวอย่าง" แทน เพื่อให้ยังวัดภาระการวาดแต่ละสไตล์ได้จริง
// ============================================================
import { detectFaces, drawFaces } from './vision.js';
import { detectHand, drawHand, fitCanvas } from './hand.js';
import { getStats as camStats } from './camera.js';
import { StarPortal } from './games/star-portal.js';
import { cssVar } from './ui.js';

export const SCENARIOS = [
  { key: 'camera', th: 'กล้องอย่างเดียว', icon: '📷', needs: ['camera'] },
  { key: 'face', th: 'ตรวจจับใบหน้า', icon: '🙂', needs: ['camera', 'face'] },
  { key: 'handSimple', th: 'มือ สไตล์ simple', icon: '✋', needs: ['camera', 'hand'], style: 'simple' },
  { key: 'handNeon', th: 'มือ สไตล์ neon', icon: '✨', needs: ['camera', 'hand'], style: 'neon' },
  { key: 'handTrail', th: 'มือ สไตล์ trail', icon: '☄', needs: ['camera', 'hand'], style: 'trail' },
  { key: 'game', th: 'เกมเต็ม (จับดาว + มือจริง)', icon: '⭐', needs: ['camera', 'hand'] },
];

const mean = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0);

// ลูปวัดผล: เรียก work() ทุกเฟรม จับเวลา แล้วสรุป
// samples = อาร์เรย์เวลาประมวลผลที่คนอื่นเก็บให้ (ใช้กับเกม ที่มีลูปของตัวเอง)
function measure(seconds, work, onProgress, samples = []) {
  const warm = Math.min(1000, seconds * 100); // อุ่นเครื่อง ms
  return new Promise((resolve) => {
    const intervals = [], windows = [];
    let t0 = null, last = 0, winStart = 0, winFrames = 0;
    const frame = (now) => {
      if (t0 === null) t0 = now;
      const el = now - t0;
      if (el >= warm) {
        if (!last) { last = now; winStart = now; samples.length = 0; }
        else {
          intervals.push(now - last); last = now; winFrames++;
          if (now - winStart >= 500) { windows.push((winFrames * 1000) / (now - winStart)); winStart = now; winFrames = 0; }
        }
      }
      if (work) { const s = performance.now(); work(now); if (el >= warm) samples.push(performance.now() - s); }
      onProgress?.(Math.min(1, el / (seconds * 1000 + warm)));
      if (el >= seconds * 1000 + warm && intervals.length >= 3) { // ต้องได้อย่างน้อย 3 เฟรม แม้เครื่องช้ามาก
        const avgFps = intervals.length ? (intervals.length * 1000) / intervals.reduce((a, b) => a + b, 0) : 0;
        resolve({
          avgFps: +avgFps.toFixed(1),
          minFps: +(windows.length ? Math.min(...windows) : avgFps).toFixed(1),
          msPerFrame: +mean(samples).toFixed(2),
          frames: intervals.length,
        });
      } else requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
}

// มือตัวอย่าง 21 จุด (ท่ามือแบ) ขยับเล็กน้อยตามเวลา ใช้เมื่อกล้องไม่เห็นมือจริง
const BASE = [[100, 200], [70, 185], [48, 160], [35, 135], [25, 112], [72, 120], [66, 85], [62, 62], [59, 40],
  [97, 115], [96, 76], [95, 50], [94, 26], [121, 120], [125, 85], [128, 62], [130, 42], [142, 130], [152, 105], [158, 88], [163, 70]];
export function sampleHand(tMs = 0) {
  const dx = Math.sin(tMs / 700) * 0.05, dy = Math.cos(tMs / 900) * 0.03;
  const points = BASE.map(([x, y]) => ({ x: 0.35 + (x / 190) * 0.3 + dx, y: 0.15 + (y / 220) * 0.65 + dy, z: 0 }));
  return { points, sample: true };
}

// ตัวอ่านมือที่ใช้ร่วมกัน: ตรวจเฉพาะตอนภาพกล้องเปลี่ยน (เหมือนในเกมจริง)
function handReader(video) {
  let vt = -1, hand = null, seen = 0, checks = 0;
  return {
    read(now) {
      if (video.currentTime !== vt) { vt = video.currentTime; hand = detectHand(video, now); checks++; if (hand) seen++; }
      return hand;
    },
    foundPct: () => (checks ? Math.round((seen / checks) * 100) : 0),
  };
}

// รันหนึ่งสถานการณ์ ctx = { video, overlay, gameCanvas, seconds, onProgress, setView(kind) }
export async function runScenario(sc, ctx) {
  const { video, overlay, seconds, onProgress } = ctx;
  fitCanvas(overlay, video);
  const g = overlay.getContext('2d');
  g.clearRect(0, 0, overlay.width, overlay.height);
  ctx.setView(sc.key === 'game' ? 'game' : 'camera');

  if (sc.key === 'camera') {
    const r = await measure(seconds, null, onProgress);
    return { ...r, camFps: camStats().fps };
  }
  if (sc.key === 'face') {
    let vt = -1, faces = [];
    const color = cssVar('--primary');
    const r = await measure(seconds, (now) => {
      if (video.currentTime !== vt) { vt = video.currentTime; faces = detectFaces(video, now); }
      drawFaces(overlay, faces, { color });
    }, onProgress);
    return { ...r, camFps: camStats().fps };
  }
  if (sc.style) {
    const hr = handReader(video);
    const r = await measure(seconds, (now) => {
      const h = hr.read(now);
      drawHand(overlay, h || sampleHand(now), { style: sc.style });
    }, onProgress);
    drawHand(overlay, null);
    return { ...r, handFoundPct: hr.foundPct(), camFps: camStats().fps };
  }
  if (sc.key === 'game') return runGame(ctx);
  throw new Error('ไม่รู้จักสถานการณ์ ' + sc.key);
}

// เกมเต็ม: เกมจับดาวรันด้วยลูปของตัวเอง + อ่านมือจริงจากกล้อง
async function runGame({ video, overlay, gameCanvas, seconds, onProgress }) {
  const hr = handReader(video);
  const game = new StarPortal(gameCanvas, {
    readHand: () => {
      const now = performance.now();
      const h = hr.read(now);
      fitCanvas(overlay, video);
      drawHand(overlay, h, { style: 'simple' }); // ภาพกล้องเล็กของเกมใช้สไตล์เรียบง่าย เหมือนเกมจริง
      return (h || sampleHand(now)).points;
    },
  });
  const eng = game.engine;
  eng.sound.enabled = false;             // ทดสอบเงียบ ๆ
  eng.fit();
  game.roundSec = seconds + 5;
  // ครอบฟังก์ชัน update/draw ของเอนจิน เพื่อจับเวลาประมวลผลต่อเฟรม
  const samples = [];
  const up = eng.update.bind(eng), dr = eng.draw.bind(eng);
  let acc = 0;
  eng.update = (dt) => { const s = performance.now(); up(dt); acc += performance.now() - s; };
  eng.draw = () => { const s = performance.now(); dr(); samples.push(acc + performance.now() - s); acc = 0; };
  game.startRound();
  eng.start();
  try {
    const r = await measure(seconds, null, onProgress, samples);
    r.msPerFrame = +mean(samples).toFixed(2);
    return { ...r, handFoundPct: hr.foundPct(), camFps: camStats().fps, particles: eng.particles.limit };
  } finally {
    eng.stop();
    if (game.round) game.round.active = false;
    drawHand(overlay, null);
  }
}

// สีของตัวเลข FPS: ≥30 เขียว · 20-29 เหลือง · <20 แดง
export const fpsLevel = (fps) => (fps >= 30 ? 'good' : fps >= 20 ? 'ok' : 'bad');
