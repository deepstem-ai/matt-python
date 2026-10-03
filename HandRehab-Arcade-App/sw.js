// ============================================================
// sw.js — Service Worker ของแอปรวม HandRehab Arcade v2 (FingerRehab): เก็บไฟล์ไว้ในเครื่อง ใช้ได้แม้ไม่มีเน็ต
//
// กฎ 4 ข้อ
//  1) ไฟล์ของแอปใน SHELL_FILES → โหลดเก็บตอนติดตั้ง (precache) แล้ว "แคชก่อน" (cache-first)
//  2) หน้า/โค้ดอื่นของแอปที่ไม่อยู่ในรายการ (*.html *.js *.mjs *.css ในโดเมนเดียวกัน เช่น หน้าเครื่องมือวิจัย)
//     → "แคชก่อน" หลังเปิดครั้งแรก (runtime cache) และแอบโหลดฉบับใหม่เก็บไว้เบื้องหลังทุกครั้งที่ออนไลน์
//     (เปิดหน้าไหนครั้งหนึ่งตอนมีเน็ต/เซิร์ฟเวอร์ ครั้งต่อไปหน้านั้นใช้ออฟไลน์ได้)
//  3) ข้อมูลแบบ API (/api/, /data/, ไฟล์ .json ที่ไม่ใช่ manifest, ?fresh) → "เน็ตก่อน" (network-first)
//  4) MediaPipe + โมเดล AI + ฟอนต์ จาก CDN และไฟล์ใหญ่ในเครื่อง (vendor/ models/ fonts/) → แคชก่อน หลังโหลดครั้งแรก
//
// ⚠ ทุกครั้งที่แก้ไฟล์ใดของแอป: เปลี่ยน VERSION ด้านล่าง ไม่งั้นผู้ใช้ที่ติดตั้งไว้จะติดอยู่กับเวอร์ชันเก่า
//   เพิ่มไฟล์ใหม่เมื่อไร ต้องเพิ่มชื่อลง SHELL_FILES ด้วย (ไฟล์ที่ระบุแต่ไม่มีจริง = ติดตั้งล้มทั้งชุด)
// ============================================================
const VERSION = 'v2.2.0';                  // v2.2: แบบจำลองคณิตศาสตร์ตามบทความ + ตรึงเกณฑ์ + ICC/ความถูกต้องการนับ/SUS
const SHELL = 'hr-shell-' + VERSION;       // ไฟล์ของแอป (เปลี่ยนชื่อทุกเวอร์ชัน)
const PAGES = 'hr-pages-' + VERSION;       // หน้า/โค้ดที่ไม่อยู่ในรายการ (กฎข้อ 2)
const RUNTIME = 'hr-runtime-v1';           // MediaPipe/โมเดล/ฟอนต์ (ไม่ผูกกับเวอร์ชันแอป จะได้ไม่ต้องโหลดโมเดล 10 MB ใหม่)
const DATA = 'hr-data-v1';                 // สำเนาข้อมูลแบบเน็ตก่อน
const KEEP = [SHELL, PAGES, RUNTIME, DATA];

// รายการไฟล์ทั้งหมดของแอป (แอปหลัก + เครื่องมือวิจัย) — ทุกไฟล์ต้องมีอยู่จริง ไม่งั้น cache.addAll ล้มทั้งชุด
const SHELL_FILES = [
  './',
  'achievements.html',
  'benchmark.html',
  'calibrate.html',
  'count-accuracy.html',
  'counter-lab.html',
  'datasets.html',
  'design-system.html',
  'enrol.html',
  'evaluate.html',
  'evidence.html',
  'filters.html',
  'gesture-lab.html',
  'hand-lab.html',
  'history.html',
  'index.html',
  'login.html',
  'math-lab.html',
  'pin.html',
  'progress.html',
  'register.html',
  'rehearsal.html',
  'reliability.html',
  'report-builder.html',
  'research.html',
  'rhythm-tap.html',
  'spread-wall.html',
  'star-portal.html',
  'survey-results.html',
  'survey.html',
  'test-recorder.html',
  'train.html',
  'users.html',
  'manifest.json',
  'css/a11y.css',
  'css/app.css',
  'css/bench.css',
  'css/calib.css',
  'css/face.css',
  'css/game.css',
  'css/history.css',
  'css/home.css',
  'css/juice.css',
  'css/login.css',
  'css/offline.css',
  'css/page.css',
  'css/parts.css',
  'css/progress.css',
  'css/register.css',
  'css/shell.css',
  'css/splash.css',
  'css/themes.css',
  'css/tokens.css',
  'datasets/SOURCES.md',
  'datasets/sample-hagrid-annotations.json',
  'datasets/sample-landmarks.csv',
  'docs/INSTALL.md',
  'docs/MATH-MODEL.md',
  'docs/OFFLINE.md',
  'docs/research/consent-form.html',
  'docs/research/consent-form.md',
  'docs/research/evidence/CHECKLIST.md',
  'docs/research/evidence/README.md',
  'docs/research/evidence/SUMMARY.md',
  'docs/research/evidence/checklist.json',
  'docs/research/math.md',
  'docs/research/packing-list.md',
  'docs/research/pitch.md',
  'docs/research/plan-b.md',
  'docs/research/prompts/chapter1-prompt.md',
  'docs/research/prompts/chapters3-5-prompt.md',
  'docs/research/qa-prep.md',
  'docs/research/samples/DEMO-lab15-face-login.csv',
  'docs/research/samples/DEMO-lab21-rep-test.csv',
  'docs/research/samples/DEMO-lab27-filters.csv',
  'docs/research/samples/DEMO-lab28-sessions.csv',
  'docs/research/samples/DEMO-lab32-evaluation.csv',
  'docs/research/samples/DEMO-lab33-benchmark.csv',
  'docs/research/samples/DEMO-lab36-survey-responses.csv',
  'docs/research/samples/DEMO-lab36-task-results.csv',
  'docs/research/templates/chapter1-template.md',
  'docs/research/templates/chapter3-template.md',
  'docs/research/templates/chapter4-template.md',
  'docs/research/templates/chapter5-template.md',
  'docs/research/test-script.md',
  'docs/research/why-provenance.md',
  'fonts/fonts.css',
  'icons/app.ico',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon.svg',
  'js/achievements-page.js',
  'js/achievements.js',
  'js/app.js',
  'js/appbar.js',
  'js/assets.js',
  'js/bench-compare.js',
  'js/bench-page.js',
  'js/bench-runner.js',
  'js/calib-input.js',
  'js/calibrate-page.js',
  'js/calibration.js',
  'js/camera.js',
  'js/capture-page.js',
  'js/capture-ui.js',
  'js/charts.js',
  'js/confetti.js',
  'js/consent.js',
  'js/db.js',
  'js/demo-history.js',
  'js/device-info.js',
  'js/face-capture.js',
  'js/face-embed.js',
  'js/face-login.js',
  'js/feeling.js',
  'js/filters-page.js',
  'js/first-run.js',
  'js/game-engine.js',
  'js/games/game-shell.js',
  'js/games/rhythm-tap-draw.js',
  'js/games/rhythm-tap.js',
  'js/games/spread-calibrate.js',
  'js/games/spread-wall-draw.js',
  'js/games/spread-wall.js',
  'js/games/star-portal-draw.js',
  'js/games/star-portal.js',
  'js/geometry.js',
  'js/gestures.js',
  'js/guide.js',
  'js/hand.js',
  'js/history-page.js',
  'js/juice-page.js',
  'js/juice.js',
  'js/landmarker.js',
  'js/login-log.js',
  'js/login-page.js',
  'js/offline-status.js',
  'js/pages.js',
  'js/pin-page.js',
  'js/pin.js',
  'js/progress-data.js',
  'js/progress-page.js',
  'js/pwa.js',
  'js/quality.js',
  'js/recommend.js',
  'js/recorder.js',
  'js/register-data.js',
  'js/register-form.js',
  'js/register.js',
  'js/rep-counter.js',
  'js/research/app-db-csv.js',
  'js/research/beep.js',
  'js/research/click-sound.js',
  'js/research/contrast-tests.js',
  'js/research/contrast.js',
  'js/research/count-accuracy.js',
  'js/research/counter-lab.js',
  'js/research/counter-sim.js',
  'js/research/csv-kit.js',
  'js/research/dataset-loader.js',
  'js/research/datasets-config.js',
  'js/research/datasets-page.js',
  'js/research/demo-banner.js',
  'js/research/demo-hand.js',
  'js/research/design-system.css',
  'js/research/design-system.js',
  'js/research/detectors.js',
  'js/research/discussion.js',
  'js/research/draft-engine.js',
  'js/research/eval-page.js',
  'js/research/eval-run.js',
  'js/research/eval-view.js',
  'js/research/evaluate.js',
  'js/research/evidence.js',
  'js/research/gesture-lab.js',
  'js/research/hand-app.js',
  'js/research/hand-lab.js',
  'js/research/hand-source.js',
  'js/research/math-lab.js',
  'js/research/ml.js',
  'js/research/parts-page.js',
  'js/research/pitch-data.js',
  'js/research/records.js',
  'js/research/rehearsal.js',
  'js/research/reliability.js',
  'js/research/report-builder.js',
  'js/research/report-ch1.js',
  'js/research/report-ch345.js',
  'js/research/report-tables.js',
  'js/research/research-data.js',
  'js/research/research-hub.js',
  'js/research/research.css',
  'js/research/signal-chart.js',
  'js/research/stats.js',
  'js/research/style-adapt.js',
  'js/research/style-page.js',
  'js/research/survey-results.js',
  'js/research/survey.js',
  'js/research/sus-data.js',
  'js/research/synth-hand.js',
  'js/research/test-recorder.js',
  'js/research/train.js',
  'js/research/usertest-csv.js',
  'js/research/usertest-data.js',
  'js/research/usertest-store.js',
  'js/rhythm-tap-page.js',
  'js/router.js',
  'js/session.js',
  'js/settings.js',
  'js/signal.js',
  'js/smoothing.js',
  'js/splash.js',
  'js/spread-wall-page.js',
  'js/star-portal-page.js',
  'js/streak.js',
  'js/synth-hand.js',
  'js/ui.js',
  'js/user-picker.js',
  'js/users-demo.js',
  'js/users-dialogs.js',
  'js/users.js',
  'js/validators.js',
  'js/vision.js',
  'js/warnings.js',
];

// โดเมนภายนอกที่ให้แคชหลังโหลดครั้งแรก
const RUNTIME_HOSTS = ['cdn.jsdelivr.net', 'unpkg.com', 'storage.googleapis.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];
// ไฟล์ใหญ่ในเครื่องที่ดาวน์โหลดด้วย tools/download-assets (ไม่อยู่ใน SHELL_FILES เพราะบางเครื่องยังไม่มี)
const LOCAL_ASSET = /\/(vendor|models)\/|\/fonts\/.*\.woff2$/;
const CODE_FILE = /\.(html?|m?js|css)$/i;

// ---------- ติดตั้ง: โหลดไฟล์ของแอปทั้งหมดเก็บไว้ ----------
self.addEventListener('install', (event) => {
  // cache: 'reload' = ขอจากเซิร์ฟเวอร์จริง ไม่เอาของเก่าในแคชเบราว์เซอร์
  event.waitUntil(caches.open(SHELL).then((c) => c.addAll(SHELL_FILES.map((f) => new Request(f, { cache: 'reload' })))));
  // ไม่ skipWaiting ทันที: รอผู้ใช้กด "โหลดเวอร์ชันใหม่" (เกมที่เล่นค้างอยู่จะไม่ถูกตัดกลางคัน)
});

// ---------- เริ่มทำงาน: ลบแคชเวอร์ชันเก่าทิ้ง ----------
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) {
      if (name.startsWith('hr-') && !KEEP.includes(name)) await caches.delete(name);
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
  if (req.method !== 'GET') return;                 // HEAD (ตรวจไฟล์ในเครื่อง) / POST ปล่อยผ่านตามปกติ
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    if (isUserData(url)) event.respondWith(networkFirst(req));
    else if (inShell(url)) event.respondWith(cacheFirst(req, SHELL));
    else if (CODE_FILE.test(url.pathname) || req.mode === 'navigate') event.respondWith(cacheFirstRevalidate(req, event));
    else if (LOCAL_ASSET.test(url.pathname)) event.respondWith(cacheFirst(req, RUNTIME));
    else event.respondWith(cacheFirst(req, PAGES));
    return;
  }
  if (RUNTIME_HOSTS.includes(url.hostname)) event.respondWith(cacheFirst(req, RUNTIME));
  // โดเมนอื่น: ไม่ยุ่ง
});

const SHELL_SET = new Set(SHELL_FILES.map((f) => new URL(f, self.location.href).pathname));
const inShell = (url) => SHELL_SET.has(url.pathname);

function isUserData(url) {
  const p = url.pathname;
  return p.includes('/api/') || p.includes('/data/') || (p.endsWith('.json') && !p.endsWith('/manifest.json')) || url.searchParams.has('fresh');
}

// หาในแคช: หน้า HTML ที่มี ?user=... / #... ใช้ไฟล์เดียวกับไม่มี ?
async function findCached(req) {
  const navigate = req.mode === 'navigate';
  return (await caches.match(req)) || (navigate ? await caches.match(req, { ignoreSearch: true }) : null);
}

function offlineResponse(req) {
  return new Response('ออฟไลน์ และยังไม่มีไฟล์นี้ในเครื่อง / Offline and not cached yet: ' + req.url,
    { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

// แคชก่อน: มีในแคช → ส่งเลย · ไม่มี → โหลดจากเน็ตแล้วเก็บไว้
async function cacheFirst(req, cacheName) {
  const hit = await findCached(req);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    // เก็บเฉพาะที่สำเร็จ (ฟอนต์จาก <link> เป็นแบบ opaque status 0 ก็เก็บได้)
    if (res.ok || res.type === 'opaque') (await caches.open(cacheName)).put(req, res.clone()).catch(() => {});
    return res;
  } catch (e) {
    // ออฟไลน์และไม่มีในแคช: ถ้าเป็นการเปิดหน้า ให้หน้าแรกของแอปแทน (ไม่ปล่อยจอว่าง)
    if (req.mode === 'navigate') { const home = await caches.match('index.html'); if (home) return home; }
    return offlineResponse(req);
  }
}

// กฎข้อ 2: แคชก่อน + โหลดฉบับใหม่เก็บไว้เบื้องหลัง (ครั้งหน้าได้ของใหม่) · ไม่มีในแคช → เน็ต แล้วเก็บ
async function cacheFirstRevalidate(req, event) {
  const cache = await caches.open(PAGES);
  const hit = await findCached(req);
  const refresh = fetch(req).then((res) => { if (res.ok) cache.put(req, res.clone()).catch(() => {}); return res; });
  if (hit) { event.waitUntil(refresh.catch(() => {})); return hit; }
  try { return await refresh; }
  catch (e) {
    if (req.mode === 'navigate') { const home = await caches.match('index.html'); if (home) return home; }
    return offlineResponse(req);
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
