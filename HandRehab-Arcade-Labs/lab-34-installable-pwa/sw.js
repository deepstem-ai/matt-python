// ============================================================
// sw.js — Service Worker: ตัวกลางระหว่างแอปกับอินเทอร์เน็ต เก็บไฟล์ไว้ในเครื่อง (Lab 34)
//
// กฎ 3 ข้อ
//  1) ไฟล์ของแอปเอง (HTML/CSS/JS/ไอคอน) → "แคชก่อน" (cache-first) เปิดเร็ว และเปิดได้แม้ไม่มีเน็ต
//  2) ข้อมูลผู้ใช้ / คำขอแบบ API (/api/, /data/, ไฟล์ .json ที่ไม่ใช่ manifest) → "เน็ตก่อน" (network-first)
//     ได้ข้อมูลล่าสุดเสมอ ถ้าเน็ตล่มค่อยใช้ของเก่าในแคช
//     (ข้อมูลผู้ใช้จริงของแอปนี้อยู่ใน IndexedDB ในเครื่องอยู่แล้ว ไม่ผ่านเน็ต)
//  3) ไลบรารี MediaPipe + โมเดล AI + ฟอนต์ จาก CDN → แคชก่อน หลังโหลดครั้งแรก (runtime caching)
//     เปิดแอปออนไลน์ครบ 1 รอบ (หน้า splash โหลดโมเดลให้ครบ) ครั้งต่อไปใช้ออฟไลน์ได้
//
// ⚠ ทุกครั้งที่แก้ไฟล์ใดของแอป: เปลี่ยน VERSION ด้านล่าง (เช่น v1.0.1)
//   ไม่งั้นผู้ใช้ที่ติดตั้งไว้จะติดอยู่กับเวอร์ชันเก่าตลอดไป
//   เพิ่มไฟล์ใหม่เมื่อไร ต้องเพิ่มชื่อลง SHELL_FILES ด้วย
// ============================================================
const VERSION = 'v1.0.0';
const SHELL = 'hr-shell-' + VERSION;       // ไฟล์ของแอป (เปลี่ยนชื่อทุกเวอร์ชัน)
const RUNTIME = 'hr-runtime-v1';           // MediaPipe/โมเดล/ฟอนต์ (ไม่ผูกกับเวอร์ชันแอป จะได้ไม่ต้องโหลดโมเดล 10 MB ใหม่)
const DATA = 'hr-data-v1';                 // สำเนาข้อมูลแบบเน็ตก่อน
const KEEP = [SHELL, RUNTIME, DATA];

// รายการไฟล์ทั้งหมดของแอป (ครบทุกไฟล์ ถ้าไฟล์ไหนหาย การติดตั้งจะล้มทั้งชุด → รู้ทันที)
const SHELL_FILES = [
  './', 'index.html', 'login.html', 'register.html', 'enrol.html', 'pin.html', 'users.html',
  'star-portal.html', 'rhythm-tap.html', 'spread-wall.html', 'benchmark.html', 'manifest.json',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'docs/INSTALL.md',
  'css/tokens.css', 'css/themes.css', 'css/parts.css', 'css/app.css', 'css/splash.css', 'css/a11y.css', 'css/shell.css',
  'css/register.css', 'css/face.css', 'css/login.css', 'css/game.css', 'css/bench.css',
  'js/app.js', 'js/appbar.js', 'js/pwa.js', 'js/router.js', 'js/pages.js', 'js/settings.js', 'js/splash.js',
  'js/ui.js', 'js/db.js', 'js/camera.js', 'js/vision.js', 'js/hand.js', 'js/geometry.js', 'js/gestures.js',
  'js/rep-counter.js', 'js/game-engine.js', 'js/charts.js',
  'js/register.js', 'js/register-form.js', 'js/register-data.js', 'js/validators.js', 'js/consent.js',
  'js/users.js', 'js/users-dialogs.js', 'js/users-demo.js',
  'js/login-page.js', 'js/login-log.js', 'js/face-login.js', 'js/face-embed.js', 'js/landmarker.js', 'js/pin.js', 'js/pin-page.js',
  'js/confetti.js', 'js/capture-page.js', 'js/capture-ui.js', 'js/face-capture.js', 'js/quality.js', 'js/guide.js', 'js/warnings.js',
  'js/star-portal-page.js', 'js/rhythm-tap-page.js', 'js/spread-wall-page.js',
  'js/games/game-shell.js', 'js/games/star-portal.js', 'js/games/star-portal-draw.js',
  'js/games/rhythm-tap.js', 'js/games/rhythm-tap-draw.js', 'js/games/spread-wall.js', 'js/games/spread-wall-draw.js', 'js/games/spread-calibrate.js',
  'js/bench-page.js', 'js/bench-runner.js', 'js/bench-compare.js', 'js/device-info.js', 'js/recommend.js', 'js/first-run.js',
];

// โดเมนที่ให้แคชหลังโหลดครั้งแรก
const RUNTIME_HOSTS = ['cdn.jsdelivr.net', 'storage.googleapis.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

// ---------- ติดตั้ง: โหลดไฟล์ของแอปทั้งหมดเก็บไว้ ----------
self.addEventListener('install', (event) => {
  // cache: 'reload' = ขอจากเซิร์ฟเวอร์จริง ไม่เอาของเก่าในแคชเบราว์เซอร์
  event.waitUntil(caches.open(SHELL).then((c) => c.addAll(SHELL_FILES.map((f) => new Request(f, { cache: 'reload' })))));
  // ไม่ skipWaiting ทันที: รอผู้ใช้กด "โหลดเวอร์ชันใหม่" (เกมที่เล่นค้างอยู่จะไม่ถูกตัดกลางคัน)
});

// ---------- เริ่มทำงาน: ลบแคชเวอร์ชันเก่าทิ้ง (สำคัญมาก ไม่งั้นติดเวอร์ชันเก่า) ----------
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) {
      if (name.startsWith('hr-') && !KEEP.includes(name)) { await caches.delete(name); }
    }
    await self.clients.claim();   // คุมทุกแท็บที่เปิดอยู่ทันที
  })());
});

// ข้อความจากหน้าเว็บ: ขอให้ตัวใหม่เริ่มเลย / ถามเวอร์ชัน
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'GET_VERSION') event.source?.postMessage({ type: 'VERSION', version: VERSION });
});

// ---------- ดักทุกคำขอ ----------
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;                 // ส่งข้อมูล (POST) ปล่อยผ่านตามปกติ
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    if (isUserData(url)) event.respondWith(networkFirst(req));
    else event.respondWith(cacheFirst(req, SHELL, true));
    return;
  }
  if (RUNTIME_HOSTS.includes(url.hostname)) event.respondWith(cacheFirst(req, RUNTIME, false));
  // โดเมนอื่น: ไม่ยุ่ง
});

function isUserData(url) {
  const p = url.pathname;
  return p.includes('/api/') || p.includes('/data/') || (p.endsWith('.json') && !p.endsWith('/manifest.json')) || url.searchParams.has('fresh');
}

// แคชก่อน: มีในแคช → ส่งเลย · ไม่มี → โหลดจากเน็ตแล้วเก็บไว้
async function cacheFirst(req, cacheName, sameOrigin) {
  const cache = await caches.open(cacheName);
  // หน้า HTML ที่มี ?user=... ใช้ไฟล์เดียวกับไม่มี ?
  const hit = await cache.match(req, { ignoreSearch: sameOrigin && req.mode === 'navigate' }) || (sameOrigin ? await caches.match(req, { ignoreSearch: req.mode === 'navigate' }) : null);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    // เก็บเฉพาะที่สำเร็จ (ฟอนต์จาก <link> เป็นแบบ opaque status 0 ก็เก็บได้)
    if (res.ok || res.type === 'opaque') cache.put(req, res.clone()).catch(() => {});
    return res;
  } catch (e) {
    // ออฟไลน์และไม่มีในแคช: ถ้าเป็นการเปิดหน้า ให้หน้าแรกของแอปแทน (ไม่ปล่อยจอว่าง)
    if (req.mode === 'navigate') { const home = await caches.match('index.html'); if (home) return home; }
    return new Response('ออฟไลน์ และยังไม่มีไฟล์นี้ในเครื่อง: ' + req.url, { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
}

// เน็ตก่อน: ได้ของใหม่ → เก็บสำเนา · เน็ตล่ม → ใช้สำเนาเก่า
async function networkFirst(req) {
  const cache = await caches.open(DATA);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone()).catch(() => {});
    return res;
  } catch (e) {
    const hit = await cache.match(req);
    if (hit) return hit;
    return new Response(JSON.stringify({ error: 'offline' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
  }
}
