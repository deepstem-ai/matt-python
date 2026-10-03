// ============================================================
// hand-source.js — "แหล่งมือ" ที่หน้าเว็บใช้: กล้องจริง + AI หรือ มือจำลอง (โหมดสาธิต)
// ทุกเฟรมเรียก frame() จะได้จุด 21 จุด (หรือ null ถ้าไม่เห็นมือ) และวาดโครงมือให้เลย
// ห้ามแตะ: ฐานข้อมูล, กติกาของ AI
// ============================================================
import { startCamera, stopCamera, cameraErrorMessage } from './camera.js';
import { initHand, detectHand, drawHand, fitCanvas, handInfo } from './hand.js';
import { variedHand, PRESETS } from './synth-hand.js';

export function createHandSource({ video, canvas, onStatus = () => {} }) {
  let mode = 'none';          // none | camera | demo
  let preset = Object.keys(PRESETS)[0];
  let demoPts = null, demoT = 0;

  return {
    get mode() { return mode; },
    get preset() { return preset; },

    // เปิดกล้อง + โหลดโมเดลมือ; ถ้าพังจะ throw { title, detail } ภาษาไทย
    async startCamera() {
      mode = 'none';
      onStatus('กำลังเปิดกล้อง…');
      try { await startCamera(video); }
      catch (e) { const m = cameraErrorMessage(e); throw Object.assign(new Error(m.title), m); }
      if (!handInfo().ready) {
        onStatus('กำลังโหลดโมเดลมือ 0%');
        try { await initHand({ onProgress: (p) => onStatus(`กำลังโหลดโมเดลมือ ${Math.round((p || 0) * 100)}%`) }); }
        catch (e) { stopCamera(); throw Object.assign(new Error('โหลดโมเดล AI ไม่สำเร็จ'), { detail: e.message + ' — ตรวจอินเทอร์เน็ต แล้วกดลองใหม่ หรือใช้โหมดสาธิต' }); }
      }
      mode = 'camera';
      onStatus('');
    },

    // โหมดสาธิต: ไม่ใช้กล้อง ใช้มือจำลองแทน
    startDemo(p) {
      stopCamera(); video.srcObject = null;
      mode = 'demo'; if (p) preset = p;
      canvas.width = 1280; canvas.height = 720;
      onStatus('');
    },
    setPreset(p) { preset = p; demoT = 0; },
    // มือจำลองใหม่ 1 มือของท่าปัจจุบัน (ใช้ตอนทดสอบอัตโนมัติ)
    sample() { return variedHand(PRESETS[preset], Math.random, { noise: 0.015, rotate: 12, aspect: 16 / 9 }); },

    // เรียกทุกเฟรม คืนจุด 21 จุด หรือ null
    frame(now = performance.now()) {
      if (mode === 'camera') {
        fitCanvas(canvas, video);
        const h = detectHand(video, now);
        drawHand(canvas, h, { style: 'neon' });
        return h ? h.points : null;
      }
      if (mode === 'demo') {
        // สร้างมือจำลองใหม่ทุก 120 ms (ท่าเดิม แต่ขนาด/ตำแหน่ง/มุมต่างไปเล็กน้อย)
        if (!demoPts || now - demoT > 120) { demoPts = variedHand(PRESETS[preset], Math.random, { noise: 0.015, rotate: 12, aspect: 16 / 9 }); demoT = now; }
        drawHand(canvas, { points: demoPts }, { style: 'neon' });
        return demoPts;
      }
      return null;
    },

    stop() { stopCamera(); mode = 'none'; },
  };
}
