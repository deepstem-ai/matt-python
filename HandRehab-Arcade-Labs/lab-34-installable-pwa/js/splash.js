// ============================================================
// splash.js — หน้าเปิดแอปที่โหลด "งานจริง" (Lab 08)
// แถบความคืบหน้าขยับตามงานที่ทำเสร็จจริงเท่านั้น ไม่ใช้ตัวจับเวลาหลอก
//   ตรวจกล้อง 10% · เตรียมฐานข้อมูล 10% · โมเดล AI 60% (มือ 45 + ใบหน้า 15) · หน้าจอ/ธีม 20%
// ถ้างานไหนพัง: ช่องนั้นเป็นสีแดง + บอกเหตุผลภาษาไทย + ปุ่มลองใหม่ (+ ปุ่มข้ามสำหรับงานที่ไม่จำเป็น)
// Lab 34: โหลดโมเดลทั้ง 3 ตัวครั้งแรกตอนออนไลน์ → sw.js เก็บไว้ในเครื่อง ครั้งต่อไปใช้ออฟไลน์ได้
//         จบแล้ว: ล็อกอินอยู่ → หน้าหลัก · ยังไม่ล็อกอิน → login.html
// ทดสอบความล้มเหลว: เปิด index.html?fail=models (หรือ camera, db, face, hand, screen คั่นด้วยจุลภาค)
// ============================================================
import { definePage, goTo } from './router.js';
import { openDB, saveSettings, getCurrentUserId } from './db.js';
import { loadVisionLib, fetchModel, modelUrls, MODELS } from './vision.js';
import { firstRunCheck } from './first-run.js';
import { whenControlled } from './pwa.js';
import { initHand, HAND_CONNECTIONS, TIPS } from './hand.js';
import { applyPrefs, isCalm, esc } from './ui.js';

const $ = (s) => document.querySelector(s);

// ---------- ความล้มเหลวจำลองจาก ?fail=... ----------
const q = new URLSearchParams(location.search);
const failSet = new Set((q.get('fail') || '').split(',').filter(Boolean).flatMap((k) => (k === 'models' ? ['hand', 'face'] : [k])));
const failTimes = +(q.get('failTimes') || 1); // พังกี่รอบก่อนจะยอมสำเร็จ (ทดสอบปุ่มลองใหม่)
const tries = {};
function maybeFail(key) {
  tries[key] = (tries[key] || 0) + 1;
  if (failSet.has(key) && tries[key] <= failTimes) throw new Error(`(จำลองความล้มเหลวด้วย ?fail=${q.get('fail')})`);
}

// ---------- งานทั้งหมด: w = ส่วนของแถบ (รวม 100) ----------
const TASKS = [
  { key: 'camera', w: 10, th: 'ตรวจหากล้อง', essential: false, run: checkCamera,
    help: 'ไม่พบกล้องในเครื่องนี้ ตรวจว่าเสียบกล้อง USB แล้ว หรือกดข้ามเพื่อใช้โหมดสาธิตด้วยเมาส์' },
  { key: 'db', w: 10, th: 'เตรียมฐานข้อมูลในเครื่อง', essential: true, run: prepareDB,
    help: 'เปิดที่เก็บข้อมูลของเบราว์เซอร์ไม่ได้ ปิดแท็บอื่นของแอปนี้ และอย่าใช้โหมดไม่ระบุตัวตน แล้วกดลองใหม่' },
  { key: 'hand', w: 45, th: 'โหลดโมเดล AI จับมือ 21 จุด', essential: true, altLabel: '🖱 ใช้โหมดเมาส์แทน', run: loadHand,
    help: 'ดาวน์โหลดโมเดล AI มือไม่สำเร็จ ตรวจการเชื่อมต่ออินเทอร์เน็ต (ครั้งแรกต้องใช้เน็ต ประมาณ 8 MB) แล้วกดลองใหม่ หรือเล่นด้วยเมาส์ไปก่อน' },
  { key: 'face', w: 15, th: 'เตรียมโมเดล AI ใบหน้า (เข้าสู่ระบบ)', essential: false, run: loadFace,
    help: 'โหลดโมเดลใบหน้าไม่สำเร็จ ข้ามได้ — ยังเข้าสู่ระบบด้วยรหัส PIN แทนการสแกนหน้าได้' },
  { key: 'screen', w: 20, th: 'เตรียมหน้าจอและธีม', essential: true, run: prepareScreen,
    help: 'เตรียมหน้าจอไม่สำเร็จ กดลองใหม่ ถ้ายังไม่ได้ให้รีเฟรชหน้า (F5)' },
];

// ---------- งานแต่ละชิ้น: รับ progress(0..1) ไว้รายงานความคืบหน้าจริง ----------
async function checkCamera(progress) {
  maybeFail('camera');
  if (!navigator.mediaDevices?.enumerateDevices) throw new Error('เบราว์เซอร์นี้ไม่รองรับกล้อง');
  progress(0.3);
  const cams = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'videoinput');
  progress(1);
  if (!cams.length) throw new Error('ไม่พบกล้องเลย');
  return `พบกล้อง ${cams.length} ตัว`;
}
async function prepareDB(progress) {
  maybeFail('db');
  await openDB();
  progress(0.6);
  await saveSettings('splash-check', { at: Date.now() }); // ลองเขียนจริง 1 ครั้ง
  progress(1);
  return 'ฐานข้อมูลพร้อม';
}
async function loadHand(progress) {
  maybeFail('hand');
  progress(0.01);
  await whenControlled();      // Lab 34: ให้ sw เริ่มคุมหน้าก่อน ไฟล์ AI จะถูกเก็บไว้ใช้ออฟไลน์ตั้งแต่ครั้งแรก
  progress(0.02);
  await loadVisionLib();       // ไลบรารี MediaPipe + wasm
  progress(0.2);
  // ความคืบหน้าจริงจากจำนวนไบต์ที่ดาวน์โหลดได้ (0.2 → 0.9) แล้วสร้างตัว AI (0.9 → 1)
  const r = await initHand({ numHands: 1, onProgress: (f) => progress(0.2 + 0.7 * f) });
  progress(1);
  return 'โมเดลมือพร้อม (' + r.delegate + ')';
}
async function loadFace(progress) {
  maybeFail('face');
  // ดาวน์โหลดไว้ล่วงหน้า (ยังไม่สร้างตัว AI) ให้หน้าเข้าสู่ระบบ/ทดสอบความลื่นเปิดเร็ว และมีไฟล์อยู่ในแคชออฟไลน์
  await fetchModel(modelUrls('face_landmarker'), MODELS.face_landmarker.minBytes, (f) => progress(0.8 * f));
  await fetchModel(modelUrls('face_detector'), MODELS.face_detector.minBytes, (f) => progress(0.8 + 0.2 * f));
  progress(1);
  return 'โมเดลใบหน้าพร้อม';
}
async function prepareScreen(progress) {
  maybeFail('screen');
  applyPrefs();
  progress(0.3);
  // รอฟอนต์ไทย แต่ไม่เกิน 3 วินาที (ออฟไลน์ก็ใช้ฟอนต์ในเครื่องแทน)
  await Promise.race([document.fonts?.ready, new Promise((r) => setTimeout(r, 3000))]);
  progress(1);
  return 'หน้าจอพร้อม';
}

// ---------- โลโก้ SVG: มือ 21 จุดที่ค่อย ๆ ปรากฏ ----------
const P = [[100, 200], [70, 185], [48, 160], [35, 135], [25, 112], [72, 120], [66, 85], [62, 62], [59, 40],
  [97, 115], [96, 76], [95, 50], [94, 26], [121, 120], [125, 85], [128, 62], [130, 42], [142, 130], [152, 105], [158, 88], [163, 70]];
const FIN = (i) => (i === 0 ? 'palm' : ['thumb', 'index', 'middle', 'ring', 'little'][Math.floor((i - 1) / 4)]);
function buildLogo() {
  const bones = HAND_CONNECTIONS.map(([a, b, f], k) =>
    `<line class="bone f-${f}" x1="${P[a][0]}" y1="${P[a][1]}" x2="${P[b][0]}" y2="${P[b][1]}" style="animation-delay:${k * 60}ms"/>`).join('');
  const joints = P.map(([x, y], i) =>
    `<circle class="joint f-${FIN(i)} ${TIPS.includes(i) ? 'tip' : ''}" cx="${x}" cy="${y}" r="${TIPS.includes(i) ? 7 : 4.5}" style="animation-delay:${900 + i * 70}ms"/>`).join('');
  $('#logo').innerHTML = `<svg viewBox="0 0 190 220" role="img" aria-label="โลโก้มือ 21 จุด">${bones}${joints}</svg>`;
}

// ---------- แถบความคืบหน้าแบ่งช่องตามน้ำหนักงาน ----------
function buildBar() {
  $('#sbar').innerHTML = TASKS.map((t) => `<div class="seg" id="seg-${t.key}" style="flex-basis:${t.w}%" title="${t.th} ${t.w}%"><i></i></div>`).join('');
}
const done = {}; // ความคืบหน้าของแต่ละงาน 0..1
function setProgress(t, f) {
  done[t.key] = Math.max(0, Math.min(1, f));
  $(`#seg-${t.key} > i`).style.width = done[t.key] * 100 + '%';
  const total = TASKS.reduce((s, x) => s + x.w * (done[x.key] || 0), 0);
  $('#pct').textContent = Math.round(total) + '%';
  $('#sbar').setAttribute('aria-valuenow', Math.round(total));
  $('#status').textContent = `กำลัง${t.th}... ${Math.round(done[t.key] * 100)}%`;
}

// ถามผู้ใช้ว่าจะลองใหม่หรือข้าม (คืน 'retry' | 'skip')
function askUser(t, err) {
  return new Promise((resolve) => {
    const box = $('#splashError');
    box.innerHTML = `<b>✖ ${esc(t.th)} ไม่สำเร็จ</b><p>${esc(t.help)}</p><p class="muted small">รายละเอียด: ${esc(err.message.split('\n')[0])}</p>
      <div class="row"><button class="btn-glow" data-a="retry"><span class="ico">🔄</span> ลองใหม่</button>
      ${!t.essential ? '<button class="btn-glow ghost" data-a="skip"><span class="ico">⏭</span> ข้ามไปก่อน</button>' : ''}
      ${t.altLabel ? `<button class="btn-glow ghost" data-a="skip">${t.altLabel}</button>` : ''}</div>`;
    box.classList.remove('hidden');
    box.querySelector('button').focus();
    box.onclick = (e) => {
      const a = e.target.closest('[data-a]')?.dataset.a;
      if (!a) return;
      box.classList.add('hidden'); box.onclick = null;
      resolve(a);
    };
  });
}

// ---------- ทำงานทีละชิ้นตามลำดับ ----------
async function runSplash(data = {}) {
  buildLogo(); buildBar();
  const result = { skipped: [], messages: [], next: data.next };
  const t0 = performance.now();
  for (const t of TASKS) {
    for (;;) {
      const seg = $(`#seg-${t.key}`);
      seg.classList.remove('failed', 'skipped');
      seg.classList.add('running');
      setProgress(t, 0);
      try {
        const msg = await t.run((f) => setProgress(t, f));
        setProgress(t, 1);
        seg.classList.remove('running'); seg.classList.add('ok');
        result.messages.push(msg);
        console.info('[splash]', t.key, 'สำเร็จ', msg);
        break;
      } catch (err) {
        console.warn('[splash]', t.key, 'ล้มเหลว', err.message);
        seg.classList.remove('running'); seg.classList.add('failed'); // ช่องนั้นเป็นสีแดง
        $('#status').textContent = `✖ ${t.th} ไม่สำเร็จ`;
        const a = await askUser(t, err);
        if (a === 'skip') { seg.classList.replace('failed', 'skipped'); result.skipped.push(t.key); setProgress(t, 1); break; }
      }
    }
  }
  result.ms = Math.round(performance.now() - t0);
  result.demoMode = result.skipped.includes('hand') || result.skipped.includes('camera');
  $('#status').textContent = result.skipped.length ? `พร้อมแล้ว (ข้าม ${result.skipped.length} รายการ)` : '✔ พร้อมแล้ว!';
  $('#spinner').classList.add('hidden');
  window.__splashResult = result; // สำหรับสคริปต์ทดสอบอ่านผลเท่านั้น (แอปส่งต่อทาง goTo)
  await new Promise((r) => setTimeout(r, 500)); // รอครึ่งวินาทีให้เห็นว่าเสร็จ
  try { sessionStorage.setItem('hr-splash-done', JSON.stringify(result)); } catch { /* ไม่เป็นไร */ }
  // เปิดครั้งแรกบนเครื่องที่ดูสเปกต่ำ → เสนอปรับค่าอัตโนมัติ (Lab 33)
  const choice = await firstRunCheck({ benchUrl: 'benchmark.html' });
  if (choice === 'test') return;
  if (getCurrentUserId()) await goTo(result.next || 'home', {}, { replace: true });
  else location.href = 'login.html';
}

// ไม่ await: ให้ router เปลี่ยนหน้าเสร็จก่อน แล้วงานโหลดค่อยวิ่งต่อเบื้องหลัง (จอไม่ค้าง)
definePage('splash', { onEnter(data) { runSplash(data); } });
export { TASKS };
