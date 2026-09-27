// ============================================================
// device-info.js — ประเมินว่าเครื่องนี้แรงแค่ไหน (Lab 33)
// ใช้ข้อมูล 3 อย่างที่เบราว์เซอร์บอกได้โดยไม่ต้องทดสอบจริง
//   1) จำนวนแกนประมวลผล (navigator.hardwareConcurrency)
//   2) หน่วยความจำ (navigator.deviceMemory — Chrome/Edge บอกได้ สูงสุดแค่ 8 GB, Firefox/Safari ไม่บอก)
//   3) ชื่อการ์ดจอจาก WebGL (ส่วนขยาย WEBGL_debug_renderer_info)
//
// กติกาการให้คะแนน (รวม 0-6 คะแนน) — เขียนไว้ใน README ด้วย
//   แกน CPU : ≥ 8 = 2 คะแนน · 4-7 = 1 · 1-3 = 0 · ไม่ทราบ = 1
//   หน่วยความจำ: ≥ 8 GB = 2 · 4-7 GB = 1 · < 4 GB = 0 · ไม่ทราบ = 1
//   การ์ดจอ : แยก (NVIDIA/AMD Radeon RX/Apple M) = 2 · ในตัว (Intel/AMD Vega/มือถือ) = 1
//             วาดด้วยซอฟต์แวร์ (SwiftShader/llvmpipe/Basic Render) หรือไม่มี WebGL = 0
//   จัดกลุ่ม: การ์ดจอซอฟต์แวร์ หรือ แกน ≤ 2 หรือ คะแนน ≤ 2 → low (เครื่องเบา)
//             คะแนน ≥ 5 → high (เครื่องแรง) · นอกนั้น → medium (ปานกลาง)
// ข้อควรจำ: นี่เป็นแค่ "การเดา" จากสเปก ผลทดสอบจริงใน benchmark สำคัญกว่าเสมอ
// ============================================================

export const TIER_TH = { low: 'เครื่องเบา', medium: 'ปานกลาง', high: 'เครื่องแรง' };

// อ่านชื่อการ์ดจอจาก WebGL (ถ้าเบราว์เซอร์ซ่อนไว้จะได้ชื่อทั่วไปแทน)
export function readGpu() {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl') || c.getContext('experimental-webgl');
    if (!gl) return { webgl: false, renderer: 'ไม่มี WebGL', vendor: '' };
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    const vendor = ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR);
    gl.getExtension('WEBGL_lose_context')?.loseContext(); // คืนทรัพยากรการ์ดจอทันที
    return { webgl: true, renderer: String(renderer || ''), vendor: String(vendor || '') };
  } catch {
    return { webgl: false, renderer: 'อ่านไม่ได้', vendor: '' };
  }
}

// จัดประเภทการ์ดจอจากชื่อ: 'software' | 'integrated' | 'discrete' | 'unknown'
export function gpuClass(renderer = '', webgl = true) {
  const r = renderer.toLowerCase();
  if (!webgl || /swiftshader|llvmpipe|softpipe|basic render|software|microsoft basic/.test(r)) return 'software';
  if (/nvidia|geforce|rtx|gtx|quadro|radeon\s*(rx|pro|r9|hd\s*[78])|apple m\d|apple gpu/.test(r)) return 'discrete';
  if (/intel|iris|uhd|hd graphics|vega|radeon\(tm\) graphics|mali|adreno|powervr|apple/.test(r)) return 'integrated';
  return 'unknown';
}

// ฟังก์ชันล้วน (ทดสอบด้วย node ได้): รับสเปก คืนคะแนน + กลุ่ม + เหตุผลภาษาไทย
export function classify({ cores, memory, gpu = 'unknown' }) {
  const reasons = [];
  const cpuPts = !cores ? 1 : cores >= 8 ? 2 : cores >= 4 ? 1 : 0;
  const memPts = !memory ? 1 : memory >= 8 ? 2 : memory >= 4 ? 1 : 0;
  const gpuPts = { discrete: 2, integrated: 1, unknown: 1, software: 0 }[gpu] ?? 1;
  const score = cpuPts + memPts + gpuPts;
  if (cores) reasons.push(`CPU ${cores} แกน (${cpuPts} คะแนน)`); else reasons.push('ไม่ทราบจำนวนแกน CPU (ให้ 1 คะแนน)');
  if (memory) reasons.push(`หน่วยความจำประมาณ ${memory} GB (${memPts} คะแนน)`); else reasons.push('เบราว์เซอร์ไม่บอกหน่วยความจำ (ให้ 1 คะแนน)');
  reasons.push({ discrete: 'การ์ดจอแยก', integrated: 'การ์ดจอในตัว', unknown: 'ไม่รู้จักการ์ดจอ', software: 'ไม่มีการ์ดจอช่วย (วาดด้วย CPU)' }[gpu] + ` (${gpuPts} คะแนน)`);
  let tier = 'medium';
  if (gpu === 'software' || (cores && cores <= 2) || score <= 2) tier = 'low';
  else if (score >= 5) tier = 'high';
  return { score, tier, reasons };
}

// ประเมินเครื่องนี้ คืนข้อมูลทั้งหมดไว้บันทึกคู่กับผลทดสอบ
export function detectDevice() {
  const g = readGpu();
  const cores = navigator.hardwareConcurrency || 0;
  const memory = navigator.deviceMemory || 0;
  const gpu = gpuClass(g.renderer, g.webgl);
  const c = classify({ cores, memory, gpu });
  return {
    cores, memory, gpuRenderer: g.renderer, gpuVendor: g.vendor, gpuClass: gpu,
    screen: `${screen.width}×${screen.height}@${window.devicePixelRatio || 1}x`,
    ua: navigator.userAgent.slice(0, 160),
    ...c, tierTh: TIER_TH[c.tier],
  };
}

// ใช้ทดสอบ: ?tier=low บังคับให้ผลเป็นเครื่องเบา (เพื่อดูหน้าจอเตือน)
export function detectDeviceWithOverride() {
  const d = detectDevice();
  const f = new URLSearchParams(location.search).get('tier');
  if (f && TIER_TH[f]) { d.tier = f; d.tierTh = TIER_TH[f] + ' (บังคับด้วย ?tier=)'; }
  return d;
}
