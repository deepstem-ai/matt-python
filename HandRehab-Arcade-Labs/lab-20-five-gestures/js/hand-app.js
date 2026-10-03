// ============================================================
// hand-app.js — โครงของ "หน้าทดสอบมือ" ที่ทุกแลป 16–21 ใช้ร่วมกัน
//   1) เปิดกล้อง  2) โหลดโมเดลมือ (มีลิงก์สำรอง + ตรวจขนาดไฟล์)  3) วนลูปทุกเฟรม
//   4) ถ้าพัง แสดงข้อความภาษาไทย + ปุ่มลองใหม่ + ลิงก์ดาวน์โหลดเอง (ห้ามจอว่าง)
//   5) โหมดสาธิต: ใช้มือจำลองแทนกล้อง (เมาส์/คีย์บอร์ด/สไลเดอร์)
//   6) ออกจากหน้า → ปิดกล้องทันที (ไฟกล้องต้องดับ)
// ทดสอบโหมดโหลดโมเดลไม่ได้: เปิดหน้าด้วย ?fail=1
// ============================================================
import { startCamera, stopCamera, cameraErrorMessage } from './camera.js';
import { MODELS } from './vision.js';
import { initHand, detectHand, fitCanvas, getStats, handInfo } from './hand.js';
import { FpsMeter, esc } from './ui.js';

const PRIMARY_URL = MODELS.hand_landmarker.url; // จำลิงก์จริงไว้ใช้ทำลิงก์ดาวน์โหลดเอง

// opts: { video, canvas, msgEl, onFrame(hand, now, info), demo (DemoHand หรือ null), numHands, minDetection, minTracking, onStatus }
export function startHandApp(opts) {
  const { video, canvas, msgEl, onFrame, demo = null, onStatus = () => {} } = opts;
  const params = new URLSearchParams(location.search);
  const meter = new FpsMeter();
  let raf = 0, alive = true, camOk = false, modelOk = false, useDemo = false;

  // ---------- ข้อความสถานะ / ข้อผิดพลาด ----------
  function showMsg(html, cls = 'warn') {
    msgEl.className = 'alert ' + cls;
    msgEl.innerHTML = html;
    msgEl.classList.remove('hidden');
  }
  function hideMsg() { msgEl.classList.add('hidden'); }
  function addButtons(list) {
    const row = document.createElement('div');
    row.className = 'row'; row.style.marginTop = 'var(--sp-3)';
    list.forEach(([label, fn, cls]) => {
      const b = document.createElement('button');
      b.className = 'btn-glow small ' + (cls || ''); b.textContent = label; b.onclick = fn;
      row.appendChild(b);
    });
    msgEl.appendChild(row);
  }
  const demoBtn = () => (demo ? [['🖱️ ใช้โหมดสาธิต (ไม่ต้องมีกล้อง)', () => setDemo(true), 'ghost']] : []);

  // ---------- 1) กล้อง ----------
  async function openCamera() {
    showMsg('📷 กำลังเปิดกล้อง… ถ้าเบราว์เซอร์ถาม ให้กด "อนุญาต"', 'warn');
    try {
      await startCamera(video);
      camOk = true;
      onStatus({ camera: 'ok' });
      if (!modelOk) await loadModel(); else hideMsg();
    } catch (err) {
      camOk = false;
      const m = cameraErrorMessage(err);
      showMsg(`<b>⚠️ ${esc(m.title)}</b><br>${esc(m.detail)}`, '');
      addButtons([['🔄 ลองเปิดกล้องใหม่', openCamera], ...demoBtn()]);
      onStatus({ camera: 'error' });
    }
  }

  // ---------- 2) โมเดลมือ ----------
  async function loadModel() {
    if (params.get('fail') === '1') {
      // โหมดจำลองว่าโหลดไม่ได้: เปลี่ยนเป็นลิงก์ที่ไม่มีอยู่จริง (ทั้งลิงก์หลักและลิงก์สำรอง)
      MODELS.hand_landmarker.url = PRIMARY_URL.replace('hand_landmarker.task', 'no_such_model.task');
    }
    showMsg('🧠 กำลังดาวน์โหลดโมเดลมือ (ประมาณ 8 MB) … <b class="num" id="ha-pct">0%</b>', 'warn');
    try {
      const n = +(params.get('hands') || opts.numHands || 1);
      const info = await initHand({
        numHands: n, minDetection: opts.minDetection ?? 0.5, minTracking: opts.minTracking ?? 0.5,
        onProgress: (p) => { const el = document.getElementById('ha-pct'); if (el) el.textContent = Math.round(p * 100) + '%'; },
      });
      modelOk = true;
      hideMsg();
      onStatus({ model: 'ok', delegate: info.delegate });
    } catch (err) {
      console.error('[hand-app] โหลดโมเดลไม่ได้', err);
      showMsg(`<b>⚠️ ดาวน์โหลดโมเดลมือไม่สำเร็จ ทั้งลิงก์หลักและลิงก์สำรอง</b><br>
        สาเหตุที่พบบ่อย: อินเทอร์เน็ตหลุด หรือระบบกรองเว็บของโรงเรียนบล็อก storage.googleapis.com<br>
        วิธีแก้: (1) ลองใหม่ (2) ใช้เน็ตมือถือ (3) ดาวน์โหลดไฟล์เอง
        <a href="${esc(PRIMARY_URL)}" target="_blank" rel="noopener">hand_landmarker.task</a>
        (ควรได้ไฟล์ประมาณ 7.5–8 MB) แล้วเก็บไว้ใช้แบบออฟไลน์ตาม Lab 35
        <details><summary>รายละเอียดสำหรับครู</summary><pre style="white-space:pre-wrap">${esc(err.message)}</pre></details>`, '');
      addButtons([['🔄 ลองโหลดใหม่', () => { MODELS.hand_landmarker.url = PRIMARY_URL; params.delete('fail'); loadModel(); }], ...demoBtn()]);
      onStatus({ model: 'error' });
    }
  }

  // ---------- 3) ลูปทุกเฟรม ----------
  function loop() {
    if (!alive) return;
    const now = performance.now();
    const fps = meter.tick(now);
    let hand = null;
    if (useDemo && demo) {
      if (!video.videoWidth && (canvas.width !== 1280 || canvas.height !== 720)) { canvas.width = 1280; canvas.height = 720; }
      else fitCanvas(canvas, video);
      hand = demo.hand(canvas.width / canvas.height, now);
    } else if (camOk && modelOk) {
      fitCanvas(canvas, video);
      hand = detectHand(video, now);
    }
    const s = getStats();
    const info = { fps, aiMs: useDemo ? 0 : s.aiMs, foundPct: s.foundPct, delegate: useDemo ? 'สาธิต' : (handInfo().delegate || '—'), demo: useDemo, ready: useDemo || (camOk && modelOk) };
    try { onFrame(hand, now, info); } catch (e) { console.error('[hand-app] onFrame', e); }
    raf = requestAnimationFrame(loop);
  }

  // ---------- 5) โหมดสาธิต ----------
  function setDemo(on) {
    useDemo = !!on && !!demo;
    demo?.setActive(useDemo);
    document.body.classList.toggle('demo-on', useDemo);
    if (useDemo) hideMsg();
    else if (!camOk) openCamera();
    else if (!modelOk) loadModel();
    onStatus({ demo: useDemo });
  }

  // ---------- 6) ปิดกล้องเมื่อออกจากหน้า ----------
  function stop() { alive = false; cancelAnimationFrame(raf); stopCamera(); }
  window.addEventListener('pagehide', stop);
  window.addEventListener('camera-lost', () => {
    camOk = false;
    showMsg('<b>⚠️ กล้องหลุดการเชื่อมต่อ</b><br>ตรวจสายกล้อง USB แล้วกดลองใหม่', '');
    addButtons([['🔄 เปิดกล้องใหม่', openCamera], ...demoBtn()]);
  });

  if (params.get('demo') === '1') setDemo(true); else openCamera();
  loop();
  // พักกล้องชั่วคราว (ไฟกล้องดับ) โดยไม่ต้องโหลดโมเดลใหม่ แล้วค่อย resume()
  function pause() { camOk = false; stopCamera(); hideMsg(); }
  function resume() { if (!useDemo) openCamera(); }
  return { stop, pause, resume, setDemo, isDemo: () => useDemo, isReady: () => useDemo || (camOk && modelOk) };
}
