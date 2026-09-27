// ===================================================================
// main.js — โค้ดของหน้ากล้อง (ย้ายออกมาจาก index.html ใน Lab 04)
// โหลดท้าย <body> จึงหาชิ้นส่วนบนหน้าจอเจอครบทุกชิ้น
// ===================================================================

// ----- 1) หยิบชิ้นส่วนบนหน้าจอมาเก็บไว้ในตัวแปร จะได้เรียกใช้ง่าย -----
const video = document.getElementById('video');
const stage = document.getElementById('stage');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const retryBtn = document.getElementById('retryBtn');
const resSelect = document.getElementById('resSelect');
const mirrorToggle = document.getElementById('mirrorToggle');
const fpsBadge = document.getElementById('fpsBadge');
const resInfo = document.getElementById('resInfo');
const startPanel = document.getElementById('startPanel');
const errorPanel = document.getElementById('errorPanel');
const fpsLog = document.getElementById('fpsLog');

// ----- 2) ตัวแปรที่จำสถานะของแอป -----
let stream = null;        // "ท่อ" ภาพจากกล้อง ถ้ายังไม่เปิดจะเป็น null
let frames = 0;           // นับว่าในวินาทีนี้ได้ภาพกี่เฟรมแล้ว
let lastTick = 0;         // เวลาที่อัปเดตตัวเลข FPS ครั้งล่าสุด
let lastVideoTime = -1;   // เวลาของเฟรมก่อนหน้า ใช้เช็กว่ามีเฟรมใหม่จริงไหม
let loopId = 0;           // เลขประจำรอบวาด ใช้หยุดรอบเก่า
const fpsHistory = {};    // เก็บ FPS ของแต่ละความละเอียด เช่น {"1280x720": [30, 29, ...]}

// ----- 3) ข้อความภาษาไทยสำหรับปัญหาแต่ละแบบ -----
const ERRORS = {
  denied: {
    title: 'ยังไม่ได้อนุญาตให้ใช้กล้อง',
    detail: 'เบราว์เซอร์ถูกตั้งไว้ว่า "ไม่อนุญาต" แอปจึงมองไม่เห็นภาพจากกล้อง',
    steps: ['กดรูปกล้อง 🎥 หรือแม่กุญแจ 🔒 ที่แถบด้านบนของ Chrome', 'เลือก "อนุญาต" (Allow) ให้กล้อง', 'กดปุ่ม "ลองใหม่อีกครั้ง" ด้านล่าง'],
  },
  notfound: {
    title: 'ไม่พบกล้องในเครื่องนี้',
    detail: 'คอมพิวเตอร์เครื่องนี้ไม่มีกล้อง หรือกล้องยังไม่ได้เสียบสาย',
    steps: ['ถ้าเป็นกล้อง USB ให้ถอดแล้วเสียบใหม่', 'รอ 5 วินาทีให้เครื่องรู้จักกล้อง', 'กดปุ่ม "ลองใหม่อีกครั้ง"'],
  },
  busy: {
    title: 'กล้องกำลังถูกโปรแกรมอื่นใช้อยู่',
    detail: 'มีโปรแกรมอื่นจับกล้องไว้ เช่น Zoom, LINE, Teams หรือแท็บ Chrome อีกแท็บ',
    steps: ['ปิดโปรแกรมประชุมออนไลน์ / แท็บอื่นที่ใช้กล้อง', 'ถ้ายังไม่ได้ ให้ถอดกล้องแล้วเสียบใหม่', 'กดปุ่ม "ลองใหม่อีกครั้ง"'],
  },
  lost: {
    title: 'สัญญาณกล้องหลุด',
    detail: 'กล้องหยุดส่งภาพกลางทาง อาจเพราะสายหลวมหรือมีโปรแกรมอื่นแย่งไป',
    steps: ['ตรวจสายกล้อง', 'กดปุ่ม "ลองใหม่อีกครั้ง"'],
  },
  unsupported: {
    title: 'เบราว์เซอร์นี้เปิดกล้องไม่ได้',
    detail: 'ลองเปิดไฟล์นี้ด้วย Google Chrome หรือ Microsoft Edge รุ่นใหม่',
    steps: ['คลิกขวาที่ไฟล์ index.html', 'เลือก "Open with" → Google Chrome'],
  },
  other: {
    title: 'เปิดกล้องไม่สำเร็จ',
    detail: 'เกิดปัญหาที่ไม่คาดคิด ลองอีกครั้ง ถ้ายังไม่ได้ให้กด F12 แล้วอ่านบรรทัดสีแดงในแท็บ Console',
    steps: ['กดปุ่ม "ลองใหม่อีกครั้ง"', 'ถ้ายังไม่ได้ ให้ปิด Chrome ทั้งหมดแล้วเปิดใหม่'],
  },
};

// ----- 4) แปลง "ชื่อ error" ของเบราว์เซอร์ ให้เป็นประเภทปัญหาของเรา -----
function classifyError(err) {
  const name = (err && err.name) || '';
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || name === 'SecurityError') return 'denied';
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') return 'notfound';
  if (name === 'NotReadableError' || name === 'TrackStartError' || name === 'AbortError') return 'busy';
  if (name === 'CameraLost') return 'lost';
  if (name === 'Unsupported') return 'unsupported';
  return 'other';
}

// ----- 5) แสดงกล่องแจ้งปัญหา (ห้ามปล่อยจอว่างเด็ดขาด) -----
function showError(err) {
  const kind = classifyError(err);
  const info = ERRORS[kind];
  stopCamera();                                         // ปิดกล้องที่ค้างอยู่ (ถ้ามี)
  document.getElementById('errTitle').textContent = info.title;
  document.getElementById('errDetail').textContent = info.detail;
  // สร้างรายการขั้นตอนแก้ไขทีละบรรทัด
  document.getElementById('errSteps').innerHTML = info.steps.map((s) => '<li>' + s + '</li>').join('');
  // โชว์ชื่อ error ภาษาอังกฤษตัวเล็ก ๆ ไว้ให้ครู/คนเขียนโค้ดดู
  document.getElementById('errCode').textContent = 'รหัสปัญหา: ' + ((err && err.name) || 'Unknown') + (err && err.message ? ' — ' + err.message : '');
  startPanel.classList.add('hidden');
  errorPanel.classList.remove('hidden');
  retryBtn.focus();                                     // ย้ายโฟกัสไปที่ปุ่มลองใหม่ กด Enter ได้เลย
  return kind;
}

// ----- 6) เปิดกล้อง -----
async function startCamera() {
  // เช็กก่อนว่าเบราว์เซอร์นี้รู้จักคำสั่งเปิดกล้องไหม
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showError({ name: 'Unsupported' });
    return;
  }
  stopCamera();                                         // ปิดของเก่าก่อนเปิดใหม่ (เช่นตอนเปลี่ยนความละเอียด)
  const [w, h] = resSelect.value.split('x').map(Number); // "1280x720" → 1280 กับ 720
  startBtn.disabled = true;
  startBtn.textContent = '⏳ กำลังเปิดกล้อง...';
  try {
    // ขอภาพจากกล้อง: เบราว์เซอร์จะถามผู้ใช้ว่า "อนุญาตไหม" ในครั้งแรก
    stream = await navigator.mediaDevices.getUserMedia({ video: { width: w, height: h }, audio: false });
    video.srcObject = stream;                           // ต่อท่อภาพเข้ากับกล่องวิดีโอ
    await video.play();                                 // สั่งให้วิดีโอเริ่มเล่น
    // ถ้ากล้องหลุดกลางทาง (ถอดสาย) ให้แจ้งเตือน
    stream.getVideoTracks()[0].addEventListener('ended', () => showError({ name: 'CameraLost' }));
    startPanel.classList.add('hidden');
    errorPanel.classList.add('hidden');
    stopBtn.classList.remove('hidden');
    fpsBadge.classList.remove('hidden');
    stage.classList.add('live');                        // เปิดขอบเรืองแสง
    startFpsLoop();
  } catch (err) {
    console.warn('เปิดกล้องไม่ได้:', err);
    showError(err);
  } finally {
    startBtn.disabled = false;
    startBtn.textContent = '▶ เปิดกล้อง';
  }
}

// ----- 7) ปิดกล้อง (คืนกล้องให้เครื่อง ไฟกล้องจะดับ) -----
function stopCamera() {
  if (stream) stream.getTracks().forEach((t) => t.stop());
  stream = null;
  video.srcObject = null;
  loopId++;                                             // ทำให้รอบนับ FPS เก่าหยุดเอง
  stage.classList.remove('live');
  fpsBadge.classList.add('hidden');
  stopBtn.classList.add('hidden');
}

// ----- 8) นับ FPS: นับเฟรมใหม่ที่เข้ามา แล้วอัปเดตตัวเลขทุก 1 วินาที -----
function startFpsLoop() {
  const myId = ++loopId;
  frames = 0;
  lastTick = performance.now();
  lastVideoTime = -1;
  function tick(now) {
    if (myId !== loopId) return;                        // มีรอบใหม่มาแทนแล้ว หยุดรอบนี้
    // นับเฉพาะตอนที่วิดีโอมีเฟรมใหม่จริง (เวลาในวิดีโอขยับ)
    if (video.currentTime !== lastVideoTime) { frames++; lastVideoTime = video.currentTime; }
    if (now - lastTick >= 1000) {                       // ครบ 1 วินาที
      const fps = Math.round((frames * 1000) / (now - lastTick));
      showFps(fps);
      frames = 0;
      lastTick = now;
    }
    requestAnimationFrame(tick);                        // ขอทำงานอีกครั้งในเฟรมหน้าจอถัดไป
  }
  requestAnimationFrame(tick);
}

// ----- 9) แสดงตัวเลข FPS พร้อมสี: เขียว ≥ 24, เหลือง 15-23, แดง < 15 -----
function showFps(fps) {
  fpsBadge.firstChild.textContent = fps + ' FPS';
  fpsBadge.className = 'fps ' + (fps >= 24 ? 'good' : fps >= 15 ? 'ok' : 'bad');
  resInfo.textContent = video.videoWidth + '×' + video.videoHeight;  // ความละเอียดที่กล้องให้มาจริง
  // เก็บผลไว้เทียบ แยกตามความละเอียดที่เลือก
  const key = resSelect.value;
  (fpsHistory[key] = fpsHistory[key] || []).push(fps);
  fpsLog.innerHTML = 'FPS เฉลี่ย: ' + Object.keys(fpsHistory).map((k) => {
    const list = fpsHistory[k];
    const avg = Math.round(list.reduce((a, b) => a + b, 0) / list.length);
    return k.replace('x', '×') + ' = <b>' + avg + '</b>';
  }).join(' · ');
}

// ----- 10) ผูกปุ่มต่าง ๆ เข้ากับฟังก์ชัน -----
startBtn.addEventListener('click', startCamera);
retryBtn.addEventListener('click', startCamera);
stopBtn.addEventListener('click', () => { stopCamera(); startPanel.classList.remove('hidden'); });
// เปลี่ยนความละเอียด: ถ้ากล้องเปิดอยู่ ให้เปิดใหม่ด้วยขนาดใหม่ทันที
resSelect.addEventListener('change', () => { if (stream) startCamera(); });
// สวิตช์ภาพกระจก: ติ๊ก = พลิกซ้ายขวา
mirrorToggle.addEventListener('change', () => video.classList.toggle('mirror', mirrorToggle.checked));
// ออกจากหน้า: ปิดกล้องคืนเครื่องเสมอ
window.addEventListener('pagehide', stopCamera);

// Lab 02: ถ้าเปิดแบบ file:// ให้โชว์แถบเตือน เพราะต่อไปต้องเปิดผ่าน http://localhost เท่านั้น
if (location.protocol === 'file:') document.getElementById('fileWarn').classList.remove('hidden');

// ช่องทางสำหรับทดสอบ: ครูเรียก window.lab01.showError({name:'NotAllowedError'}) ใน Console ได้
window.lab01 = { startCamera, stopCamera, showError };
