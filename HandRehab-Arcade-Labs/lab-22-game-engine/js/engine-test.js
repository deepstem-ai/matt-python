// ============================================================
// engine-test.js — หน้าทดสอบเอนจินเกม (Lab 22)
// สิ่งที่พิสูจน์ได้บนหน้านี้:
//  1) ดาวลอยลื่น + FPS + จำนวนวัตถุที่มีชีวิต
//  2) กดปุ่ม/คลิก → ระเบิดดาว (อนุภาครีไซเคิล ไม่เกิน 400 ตัว)
//  3) เสียงสร้างด้วยโค้ด 6 แบบ เล่นได้หลังคลิกครั้งแรกเท่านั้น
//  4) ความเร็วเกมไม่ขึ้นกับ FPS: ลากแถบ "จำลองเครื่องช้า" แล้วดูหมุดสองตัวด้านล่าง
// ============================================================
import { GameEngine } from './game-engine.js';
import { applyPrefs, loadPrefs, savePrefs, isCalm, cssVar, toast, modal } from './ui.js';

applyPrefs();
const $ = (id) => document.getElementById(id);
const canvas = $('game');

// ---------- สีจาก tokens (อ่านใหม่เมื่อเปลี่ยนธีม) ----------
let C = {};
function readColors() {
  C = {
    top: cssVar('--world-top'), bottom: cssVar('--world-bottom'), g1: cssVar('--world-glow-1'), g2: cssVar('--world-glow-2'),
    g3: cssVar('--world-glow-3'), star: cssVar('--world-star'), text: cssVar('--text'), text2: cssVar('--text-2'),
    ok: cssVar('--success'), bad: cssVar('--error'), line: cssVar('--line'), warn: cssVar('--warning'),
  };
  C.burst = [C.star, C.g3, C.warn, C.g2];
}
readColors();

// ---------- ดาวพื้นหลัง: สร้างครั้งเดียวแล้ววนใช้ (entity) ----------
function makeStar() {
  return {
    x: Math.random() * 2000, y: Math.random() * 1200, speed: 15 + Math.random() * 45, size: 0.6 + Math.random() * 2, tw: Math.random() * 6,
    update(dt, eng) {
      this.x -= this.speed * dt;                       // ความเร็วเป็น px ต่อวินาที × dt
      this.tw += dt * 2;
      if (this.x < -5) { this.x = eng.canvas.width + 5; this.y = Math.random() * eng.canvas.height; }
    },
    draw(ctx) {
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(this.tw);
      ctx.fillStyle = C.star; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    },
  };
}

// ดาวหาง: ตัวอย่าง entity ที่ลบตัวเองออกเมื่อพ้นจอ (removeEntity)
function makeComet(eng) {
  return {
    x: eng.canvas.width + 20, y: Math.random() * eng.canvas.height * 0.6, vx: -420, vy: 90,
    update(dt, e) { this.x += this.vx * dt; this.y += this.vy * dt; if (this.x < -80) e.removeEntity(this); },
    draw(ctx) {
      const g = ctx.createLinearGradient(this.x, this.y, this.x + 80, this.y - 18);
      g.addColorStop(0, C.star); g.addColorStop(1, 'transparent');
      ctx.strokeStyle = g; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(this.x + 80, this.y - 18); ctx.stroke();
    },
  };
}

// ---------- ทดสอบความเร็ว: หมุดสองตัว ----------
const SPEED = 120;                // px ต่อวินาที
let lagMs = 0;                    // หน่วงเทียมต่อเฟรม
const speedTest = { good: 0, bad: 0, t0: performance.now(), pausedAt: 0, pausedMs: 0 };
function resetSpeed() { Object.assign(speedTest, { good: 0, bad: 0, t0: performance.now(), pausedMs: 0 }); }
const realSeconds = () => (performance.now() - speedTest.t0 - speedTest.pausedMs) / 1000;

// ---------- การทดสอบหนัก ----------
let stressLeft = 0;
let burstCount = 40;

function update(dt, eng) {
  // จำลองเครื่องช้า: วนรอเปล่า ๆ ให้เฟรมนี้ช้าลง
  if (lagMs > 0) { const until = performance.now() + lagMs; while (performance.now() < until) { /* รอ */ } }
  speedTest.good += SPEED * dt;   // ✔ ใช้เวลาที่ผ่านไปจริง
  speedTest.bad += 2;             // ✘ ขยับเฟรมละ 2 px (ถูกเฉพาะเครื่องที่ได้ 60 FPS พอดี)
  if (stressLeft > 0) {
    stressLeft -= dt;
    eng.particles.burst(Math.random() * canvas.width, Math.random() * canvas.height, 25, C.burst, 260, 200, 1.2);
  }
}

function draw(ctx, eng, phase) {
  const { width: w, height: h } = canvas;
  if (phase === 'before') {
    // พื้นหลังไล่สี + เนบิวลา
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, C.top); g.addColorStop(1, C.bottom);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    [[0.25, 0.35, C.g1], [0.7, 0.3, C.g2], [0.55, 0.75, C.g3]].forEach(([fx, fy, col]) => {
      const r = Math.max(w, h) * 0.35, n = ctx.createRadialGradient(fx * w, fy * h, 0, fx * w, fy * h, r);
      n.addColorStop(0, col); n.addColorStop(1, 'transparent');
      ctx.globalAlpha = 0.22; ctx.fillStyle = n; ctx.fillRect(0, 0, w, h); ctx.globalAlpha = 1;
    });
    return;
  }
  // ---- เลนทดสอบความเร็ว (วาดหลังสุดให้อยู่บนสุด) ----
  const L = Math.max(200, w - 80), x0 = 40, y = h - 70, t = realSeconds();
  ctx.strokeStyle = C.line; ctx.lineWidth = 2;
  [y, y + 34].forEach((yy) => { ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x0 + L, yy); ctx.stroke(); });
  const dot = (d, yy, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x0 + (d % L), yy, 10, 0, Math.PI * 2); ctx.fill(); };
  dot(SPEED * t, y, C.text2);                       // เงาตำแหน่งที่ "ควรเป็น" ตามนาฬิกาจริง
  dot(speedTest.good, y, C.ok);
  dot(speedTest.bad, y + 34, C.bad);
  ctx.font = '600 15px ' + cssVar('--font'); ctx.textAlign = 'left'; ctx.fillStyle = C.text;
  const exp = SPEED * t;
  ctx.fillText(`นาฬิกาจริง ${t.toFixed(1)} วิ · ควรไปได้ ${exp.toFixed(0)} px (วงเทา)`, x0, y - 18);
  ctx.fillStyle = C.ok; ctx.fillText(`✔ ใช้ dt: ${speedTest.good.toFixed(0)} px (ต่าง ${(speedTest.good - exp).toFixed(0)})`, x0 + L * 0.5, y - 18);
  ctx.fillStyle = C.bad; ctx.fillText(`✘ ไม่ใช้ dt (เฟรมละ 2 px): ${speedTest.bad.toFixed(0)} px (ต่าง ${(speedTest.bad - exp).toFixed(0)})`, x0 + L * 0.5, y + 60);
  if (eng.paused) { ctx.fillStyle = C.warn; ctx.font = '800 40px ' + cssVar('--font'); ctx.textAlign = 'center'; ctx.fillText('⏸ หยุดพัก', w / 2, h / 2); }
}

// ---------- สร้างเอนจิน ----------
const engine = new GameEngine(canvas, {
  update, draw, maxParticles: 400, lowFps: 30, lowFpsSeconds: 3, calm: isCalm(),
  onAdapt: (n) => { $('limit').textContent = n; toast(`FPS ต่ำกว่า 30 นาน 3 วินาที → ลดอนุภาคเหลือ ${n}`, 'warning', 4); },
});
engine.sound.autoUnlock();                 // เสียงเริ่มได้หลังการกด/คลิกครั้งแรกเท่านั้น
for (let i = 0; i < 90; i++) engine.addEntity(makeStar());
engine.fit();
window.addEventListener('resize', () => engine.fit());
engine.start();
window.__engine = engine;                  // ให้สคริปต์ทดสอบอ่านค่าได้

// ---------- ปุ่มและแถบเลื่อน ----------
const explode = (x, y) => { engine.particles.burst(x, y, burstCount, C.burst, 300, 220, 1.1); engine.sound.score(); };
$('burstBtn').onclick = () => explode(canvas.width * (0.3 + Math.random() * 0.4), canvas.height * (0.25 + Math.random() * 0.35));
canvas.addEventListener('pointerdown', (e) => { const r = canvas.getBoundingClientRect(); explode(e.clientX - r.left, e.clientY - r.top); });
$('countRange').oninput = (e) => { burstCount = +e.target.value; $('countVal').textContent = burstCount; };
$('stressBtn').onclick = () => { stressLeft = 5; toast('ทดสอบหนัก: ระเบิดทุกเฟรม 5 วินาที ดู FPS และจำนวนวัตถุ', 'warning'); };
$('cometBtn').onclick = () => engine.addEntity(makeComet(engine));
$('lagRange').oninput = (e) => { lagMs = +e.target.value; $('lagVal').textContent = lagMs; };
$('resetSpeedBtn').onclick = resetSpeed;
document.querySelectorAll('[data-snd]').forEach((b) => b.addEventListener('click', () => {
  if (isCalm()) toast('โหมดสงบเปิดอยู่ จึงไม่มีเสียงและอนุภาค', 'warning');
  const s = b.dataset.snd;
  if (s === 'note') [0, 1, 2, 3, 4].forEach((i) => setTimeout(() => engine.sound.note(i), i * 220));
  else engine.sound[s]();
}));

// โหมดสงบ: ปิดอนุภาคและเสียงทั้งหมด
function paintCalm() { $('calmBtn').textContent = isCalm() ? '🌙 สงบ: เปิด' : '🌙 สงบ: ปิด'; engine.setCalm(isCalm()); readColors(); }
$('calmBtn').onclick = () => { savePrefs({ calm: !loadPrefs().calm }); paintCalm(); };
paintCalm();

// หยุดพัก: หยุดเวลาเกม แสดงหน้าต่าง กดแล้วเล่นต่อ
async function pause() {
  if (engine.paused) return;
  engine.pause(); speedTest.pausedAt = performance.now();
  await modal('<h2>⏸ หยุดพัก</h2><p>เวลาเกมหยุดเดิน (dt ไม่ถูกส่งเข้า update) กดปุ่มเพื่อเล่นต่อ</p>', [{ label: '▶ เล่นต่อ', value: true, cls: 'success' }]);
  speedTest.pausedMs += performance.now() - speedTest.pausedAt;
  engine.resume();
}
$('pauseBtn').onclick = pause;
window.addEventListener('keydown', (e) => { if (e.key === 'p' || e.key === 'P') pause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); }); // สลับแท็บ = หยุดพักอัตโนมัติ

// ---------- ป้ายตัวเลข (อัปเดต 4 ครั้งต่อวินาที พอสำหรับสายตา) ----------
let memMin = Infinity, memMax = 0;
setInterval(() => {
  $('fps').textContent = engine.fps;
  $('objs').textContent = engine.objectCount;
  $('limit').textContent = engine.particles.limit;
  const m = performance.memory;
  if (m) {
    const mb = m.usedJSHeapSize / 1048576; memMin = Math.min(memMin, mb); memMax = Math.max(memMax, mb);
    $('mem').textContent = `${mb.toFixed(1)} MB (${memMin.toFixed(1)}–${memMax.toFixed(1)})`;
  } else $('mem').textContent = 'ดูใน DevTools › Memory';
}, 250);
