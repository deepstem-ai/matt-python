// ============================================================
// spread-calibrate.js — ปรับเทียบการกางนิ้วรายคน 2 ขั้น (Lab 25)
//   ขั้น 1: ผ่อนคลาย หุบนิ้วชิดกัน  → ค่า min (มัธยฐาน)
//   ขั้น 2: กางนิ้วให้กว้างที่สุด     → ค่า max (เปอร์เซ็นไทล์ที่ 90 กันค่ากระโดด)
// บันทึกใน store "calibration" id = userId + ':spread'
// ============================================================
import { get, put } from '../db.js';
import { showOverlay } from './game-shell.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
export const MIN_RANGE = 8;                     // ต่างกันน้อยกว่า 8 องศา = ปรับเทียบไม่สำเร็จ

export function percentile(arr, p) {
  if (!arr.length) return NaN;
  const a = [...arr].sort((x, y) => x - y);
  return a[Math.min(a.length - 1, Math.max(0, Math.round((p / 100) * (a.length - 1))))];
}

export async function loadCalibration(uid) {
  try { return (await get('calibration', uid + ':spread')) || null; } catch { return null; }
}
export async function saveCalibration(uid, c, source) {
  const rec = { id: uid + ':spread', userId: uid, gesture: 'spread', min: +c.min.toFixed(1), max: +c.max.toFixed(1), at: Date.now(), source };
  await put('calibration', rec);
  return rec;
}

// เก็บค่ามุมเป็นเวลา sec วินาที โดยแสดงค่าสดบนแผง
async function collect(game, sec, label) {
  const out = [];
  const t0 = performance.now();
  while (performance.now() - t0 < sec * 1000) {
    if (game.seen && game.deg !== null) out.push(game.deg);
    const el = document.getElementById('calLive');
    if (el) el.textContent = `${label} · มุมตอนนี้ ${game.deg === null ? '—' : game.deg.toFixed(1) + '°'} · เหลือ ${Math.ceil(sec - (performance.now() - t0) / 1000)} วิ`;
    await wait(50);
  }
  return out;
}

// ขั้นหนึ่งขั้น: แสดงคำแนะนำ → กดพร้อม → นับถอยหลัง 3 → เก็บค่า
function step(host, game, title, how, sec) {
  return new Promise((resolve) => {
    showOverlay(host, `<h2>${title}</h2><p>${how}</p><p id="calLive" class="num muted">มุมตอนนี้ —</p>`, [{
      label: '✔ พร้อมแล้ว', cls: 'success', onClick: async () => {
        host.querySelector('button').disabled = true;
        for (let k = 3; k >= 1; k--) { document.getElementById('calLive').textContent = `เริ่มใน ${k}…`; await wait(700); }
        resolve(await collect(game, sec, 'กำลังวัด'));
      },
    }]);
  });
}

// ปรับเทียบทั้งสองขั้น คืน { min, max } หรือ null ถ้ายกเลิก
export async function runCalibration(host, game) {
  const demo = game.source === 'demo';
  for (;;) {
    const lo = await step(host, game, '🧘 ขั้นที่ 1/2 · ผ่อนคลาย หุบนิ้ว',
      demo ? 'โหมดสาธิต: ลดแถบ "มุมกาง" หรือหมุนล้อเมาส์ลงให้ค่าน้อย แล้วกดพร้อม' : 'วางมือหันฝ่ามือเข้ากล้อง นิ้วเหยียดตรง <b>หุบนิ้วชิดกันแบบสบาย ๆ</b> ค้างไว้ 2 วินาที', 2);
    const hi = await step(host, game, '🖐 ขั้นที่ 2/2 · กางนิ้วให้กว้างที่สุด',
      demo ? 'โหมดสาธิต: เพิ่มแถบ "มุมกาง" หรือหมุนล้อเมาส์ขึ้นให้ค่ามาก แล้วกดพร้อม' : '<b>กางนิ้วทุกนิ้วให้กว้างที่สุดเท่าที่ทำได้โดยไม่เจ็บ</b> ค้างไว้ 3 วินาที', 3);
    const min = percentile(lo, 50), max = percentile(hi, 90);
    let problem = '';
    if (lo.length < 5 || hi.length < 5) problem = 'กล้องมองไม่เห็นมือระหว่างวัด ลองให้มืออยู่กลางภาพและมีแสงพอ';
    else if (max - min < MIN_RANGE) problem = `ค่าหุบ (${min.toFixed(1)}°) กับค่ากาง (${max.toFixed(1)}°) ต่างกันน้อยกว่า ${MIN_RANGE}° ลองกางให้กว้างขึ้นอีกนิด`;
    if (!problem) return { min, max };
    const again = await new Promise((resolve) => showOverlay(host, `<div class="alert warn"><h2>ปรับเทียบอีกครั้งนะ</h2><p>${problem}</p></div>`, [
      { label: '↻ วัดใหม่', onClick: () => resolve(true) },
      { label: 'ยกเลิก', cls: 'ghost', onClick: () => resolve(false) },
    ]));
    if (!again) return null;
  }
}
