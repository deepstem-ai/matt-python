// ============================================================
// eval-run.js — โหมดทดสอบด้วยกล้องจริง: เรียกท่าแบบสุ่ม → นับถอยหลัง → เก็บผล 1 วินาที → โหวตเสียงข้างมาก (Lab 32)
// ============================================================
import { majority } from './evaluate.js';
import { voteText } from './detectors.js';
import { measureBrightness } from './camera.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const nextFrame = () => new Promise((r) => requestAnimationFrame(r));

// schedule = ลำดับท่าที่จะเรียก, getPts() = จุดมือเฟรมล่าสุด (null = ไม่เห็นมือ), detect(pts) → ชื่อท่า | 'none' | null
// ui = { call(name, secondsLeft), progress(done, total) }, state.cancel = true เพื่อหยุดกลางคัน
export async function runRound({ schedule, condition, detect, getPts, video, nameOf, ui, state, readyMs = 2000, windowMs = 1000, startIndex = 1 }) {
  const trials = [];
  for (let n = 0; n < schedule.length; n++) {
    if (state.cancel) break;
    const requested = schedule[n];
    // นับถอยหลังให้ผู้ใช้เตรียมท่า (ไม่นับผลช่วงนี้)
    for (let s = Math.ceil(readyMs / 1000); s > 0; s--) {
      ui.call(nameOf(requested), s);
      await wait(Math.min(1000, readyMs));
      if (state.cancel) break;
    }
    if (state.cancel) break;
    ui.call(nameOf(requested), 0);
    // เก็บผลทุกเฟรมเป็นเวลา 1 วินาที
    const votes = [], bright = [];
    let found = 0, lastB = 0;
    const t0 = performance.now();
    while (performance.now() - t0 < windowMs) {
      await nextFrame();
      const pts = getPts();
      if (pts) found++;
      votes.push(detect(pts));
      if (performance.now() - lastB > 100) { bright.push(measureBrightness(video)); lastB = performance.now(); }
    }
    trials.push({
      i: startIndex + n, condition, requested, detected: majority(votes), votes: voteText(votes),
      frames: votes.length, handFoundPct: votes.length ? Math.round((100 * found) / votes.length) : 0,
      brightness: bright.length ? +(bright.reduce((a, b) => a + b, 0) / bright.length).toFixed(1) : null,
      t: Date.now(), simulated: false,
    });
    ui.progress(n + 1, schedule.length);
  }
  return trials;
}
