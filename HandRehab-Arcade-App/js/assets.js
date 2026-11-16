// ============================================================
// assets.js — ที่อยู่ของไฟล์ภายนอกทั้งหมดของแอป อยู่ที่นี่ที่เดียว (Lab 35)
//
// ลำดับการหา: "ไฟล์ในเครื่องก่อน" (โฟลเดอร์ vendor/ models/ fonts/) แล้วค่อย "อินเทอร์เน็ต (CDN)"
//   - ตรวจไฟล์ในเครื่องด้วยคำขอ HEAD ครั้งเดียวต่อไฟล์ (จำผลไว้ ไม่ถามซ้ำ)
//   - ไฟล์ในเครื่องต้องใหญ่พอ (minBytes) ถ้าเล็กผิดปกติ = ไฟล์เสีย/ดาวน์โหลดไม่ครบ → ใช้ CDN แทน
// เตรียมไฟล์ในเครื่อง: รัน tools/download-assets.ps1 (Windows) หรือ tools/download-assets.sh (Mac/Linux)
//
// วิธีใช้
//   await assetUrl('hand_landmarker.task')   → ที่อยู่เดียวที่ควรใช้ (ในเครื่อง ถ้ามี)
//   await assetUrls('hand_landmarker.task')  → รายการที่อยู่เรียงตามลำดับที่จะลอง [ในเครื่อง, CDN, ลิงก์สำรอง]
//   await checkAll()                         → สถานะไฟล์ที่จำเป็นทุกไฟล์ (ใช้กับป้ายมุมจอ)
// ============================================================
export const MP_VERSION = '0.10.14';
const JSD = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VERSION}`;
const UNPKG = `https://unpkg.com/@mediapipe/tasks-vision@${MP_VERSION}`;
const G = 'https://storage.googleapis.com/mediapipe-models';
const FONTS_CSS = 'https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@100..900&family=Orbitron:wght@400..900&display=swap';

// group: lib | model | font · required: ต้องมีจึงจะออฟไลน์ได้ครบ
export const ASSETS = {
  'vision_bundle.mjs': { group: 'lib', th: 'ไลบรารี MediaPipe', local: 'vendor/tasks-vision/vision_bundle.mjs', cdn: [`${JSD}/vision_bundle.mjs`, `${UNPKG}/vision_bundle.mjs`], minBytes: 100_000 },
  'vision_wasm_internal.js': { group: 'lib', th: 'ตัวโหลด wasm', local: 'vendor/tasks-vision/wasm/vision_wasm_internal.js', cdn: [`${JSD}/wasm/vision_wasm_internal.js`], minBytes: 100_000 },
  'vision_wasm_internal.wasm': { group: 'lib', th: 'สมอง AI (wasm)', local: 'vendor/tasks-vision/wasm/vision_wasm_internal.wasm', cdn: [`${JSD}/wasm/vision_wasm_internal.wasm`], minBytes: 5_000_000 },
  'vision_wasm_nosimd_internal.js': { group: 'lib', th: 'ตัวโหลด wasm (เครื่องเก่า)', local: 'vendor/tasks-vision/wasm/vision_wasm_nosimd_internal.js', cdn: [`${JSD}/wasm/vision_wasm_nosimd_internal.js`], minBytes: 100_000 },
  'vision_wasm_nosimd_internal.wasm': { group: 'lib', th: 'สมอง AI (เครื่องเก่า)', local: 'vendor/tasks-vision/wasm/vision_wasm_nosimd_internal.wasm', cdn: [`${JSD}/wasm/vision_wasm_nosimd_internal.wasm`], minBytes: 5_000_000 },
  'hand_landmarker.task': { group: 'model', th: 'โมเดลมือ 21 จุด', local: 'models/hand_landmarker.task', cdn: [`${G}/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`, `${G}/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task`], minBytes: 5_000_000 },
  'face_landmarker.task': { group: 'model', th: 'โมเดลใบหน้า 478 จุด (เข้าสู่ระบบ)', local: 'models/face_landmarker.task', cdn: [`${G}/face_landmarker/face_landmarker/float16/1/face_landmarker.task`, `${G}/face_landmarker/face_landmarker/float16/latest/face_landmarker.task`], minBytes: 1_000_000 },
  'blaze_face_short_range.tflite': { group: 'model', th: 'โมเดลตรวจจับใบหน้า', local: 'models/blaze_face_short_range.tflite', cdn: [`${G}/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`, `${G}/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite`], minBytes: 100_000 },
  'noto-sans-thai-thai.woff2': { group: 'font', th: 'ฟอนต์ไทย Noto Sans Thai', local: 'fonts/noto-sans-thai-thai.woff2', cdn: [], minBytes: 10_000 },
  'noto-sans-thai-latin.woff2': { group: 'font', th: 'ฟอนต์ Noto Sans Thai (อักษรอังกฤษ)', local: 'fonts/noto-sans-thai-latin.woff2', cdn: [], minBytes: 5_000 },
  'orbitron-latin.woff2': { group: 'font', th: 'ฟอนต์ตัวเลข Orbitron', local: 'fonts/orbitron-latin.woff2', cdn: [], minBytes: 5_000 },
  // fonts.css ในเครื่องใช้ได้เมื่อมีไฟล์ฟอนต์ครบ ไม่งั้นใช้ของ Google
  'fonts.css': { group: 'font', th: 'ไฟล์ตั้งค่าฟอนต์', local: 'fonts/fonts.css', cdn: [FONTS_CSS], minBytes: 100, requires: ['noto-sans-thai-thai.woff2', 'noto-sans-thai-latin.woff2', 'orbitron-latin.woff2'] },
  // โฟลเดอร์ wasm (MediaPipe ขอเป็น "โฟลเดอร์" แล้วเลือกไฟล์เอง) ใช้ในเครื่องเมื่อมีคู่ .js + .wasm
  wasm: { group: 'dir', local: 'vendor/tasks-vision/wasm', cdn: [`${JSD}/wasm`, `${UNPKG}/wasm`], requires: ['vision_wasm_internal.js', 'vision_wasm_internal.wasm'] },
};
export const REQUIRED = Object.keys(ASSETS).filter((k) => ASSETS[k].group !== 'dir');

// แปลงที่อยู่แบบสัมพัทธ์เป็นแบบเต็ม (import() ใน js/vision.js จะได้ไม่ไปหาใน js/)
const abs = (p) => new URL(p, document.baseURI).href;

const probes = new Map(); // ชื่อ → Promise<{ ok, size }>
// ตรวจว่ามีไฟล์ในเครื่องไหม (HEAD ครั้งเดียว) · force = ตรวจใหม่
export function probeLocal(name, force = false) {
  const a = ASSETS[name];
  if (!a) return Promise.resolve({ ok: false, size: 0 });
  if (!force && probes.has(name)) return probes.get(name);
  const p = (async () => {
    if (a.requires) {
      const rs = await Promise.all(a.requires.map((r) => probeLocal(r, force)));
      if (!rs.every((r) => r.ok)) return { ok: false, size: 0, reason: 'ไฟล์ประกอบไม่ครบ' };
      if (a.group === 'dir') return { ok: true, size: rs.reduce((s, r) => s + r.size, 0) };
    }
    try {
      const res = await fetch(a.local, { method: 'HEAD', cache: 'no-store' });
      if (!res.ok) return { ok: false, size: 0, reason: 'HTTP ' + res.status };
      const size = Number(res.headers.get('content-length')) || 0;
      if (size && size < a.minBytes) return { ok: false, size, reason: 'ไฟล์เล็กผิดปกติ' };
      return { ok: true, size };
    } catch (e) { return { ok: false, size: 0, reason: e.message }; }
  })();
  probes.set(name, p);
  return p;
}

// รายการที่อยู่เรียงตามลำดับที่จะลอง: [ในเครื่อง (ถ้ามี), CDN หลัก, CDN สำรอง]
export async function assetUrls(name) {
  const a = ASSETS[name];
  if (!a) throw new Error('ไม่รู้จักไฟล์ ' + name + ' (เพิ่มใน ASSETS ของ js/assets.js)');
  const local = await probeLocal(name);
  return [...(local.ok ? [abs(a.local)] : []), ...a.cdn];
}
// ที่อยู่เดียวที่ควรใช้
export async function assetUrl(name) { return (await assetUrls(name))[0] || abs(ASSETS[name].local); }
// มาจากเครื่องไหม
export const isLocalUrl = (u) => u.startsWith(location.origin);

// สถานะทุกไฟล์ที่จำเป็น [{ name, th, group, ok, size, reason }]
export async function checkAll(force = false) {
  return Promise.all(REQUIRED.map(async (name) => ({ name, th: ASSETS[name].th, group: ASSETS[name].group, local: ASSETS[name].local, ...(await probeLocal(name, force)) })));
}

// ใส่ฟอนต์ (ในเครื่องก่อน ถ้าไม่มีใช้ Google Fonts ถ้าออฟไลน์และไม่มีไฟล์ จะใช้ฟอนต์ของระบบ แอปยังใช้งานได้)
let fontsLoaded = false;
export async function loadFonts() {
  if (fontsLoaded) return; fontsLoaded = true;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = await assetUrl('fonts.css');
  document.head.appendChild(link);
}
