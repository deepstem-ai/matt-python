// ============================================================
// recorder.js — บันทึกการฝึกแบบละเอียดพอสำหรับงานวิจัย (Lab 28)
//   - เริ่มรอบ: สร้างระเบียนเซสชันทันที (status 'in-progress') → ท่าที่บันทึกระหว่างเล่นมีเจ้าของเสมอ
//   - ทุกครั้งที่ทำท่า: บันทึกลง store 'reps' ทันที (sessionId, userId, timestamp, gesture, peak, holdMs, success, angle)
//   - ทุก 1 วินาที: เก็บ FPS และความสว่างของภาพจากกล้องจริง (camera.measureBrightness)
//   - จบรอบ: userId, game, start/end, reps, accuracy, score, avgFps, avgBrightness, machine, delegate
//   ค่าสามตัวหลัง (FPS / ความสว่าง / เครื่อง+GPU/CPU) ใช้ตอบสมมติฐานเรื่องแสงและประสิทธิภาพเครื่อง
// ============================================================
import { saveSession, saveRep, newId, getSettings, get, put } from './db.js';
import { measureBrightness, isRunning } from './camera.js';
import { handInfo } from './hand.js';

// ชื่อเครื่อง (ตั้งในหน้าประวัติ เก็บใน settings key 'machine')
export async function getMachineName() {
  const s = await getSettings('machine');
  return s.name || `เครื่องไม่มีชื่อ (${navigator.hardwareConcurrency || '?'} คอร์)`;
}

const avg = (a) => (a.length ? +(a.reduce((s, v) => s + v, 0) / a.length).toFixed(1) : null);

export class SessionRecorder {
  // opts: { game, userId(), video (element กล้อง), getFps(), isDemo() }
  constructor(opts) { this.opts = opts; this.session = null; this.timer = null; this.pending = []; }

  // เรียกตอนเริ่มรอบ (ไม่ต้องรอ) — ระเบียนเซสชันพร้อมรับท่าทันที ส่วนการบันทึกลงฐานข้อมูลทำตามหลัง
  start(extra = {}) {
    this.stopSampling();
    const o = this.opts;
    this.session = { id: newId('s_'), userId: o.userId(), game: o.game, startTime: Date.now(), endTime: null, status: 'in-progress',
      reps: 0, accuracy: 0, score: 0, avgFps: null, avgBrightness: null, machine: null,
      delegate: o.isDemo() ? 'demo' : handInfo().delegate || 'unknown', details: { ...extra, demo: o.isDemo() } };
    this.fps = []; this.bright = []; this.repCount = 0; this.pending = [];
    const s = this.session;
    getMachineName().then((name) => { s.machine = name; return saveSession(s); })
      .catch((e) => console.warn('[recorder] บันทึกเริ่มรอบไม่ได้ จะลองอีกครั้งตอนจบ', e));
    // เก็บตัวอย่างทุก 1 วินาที (ไม่นับตอนหยุดพัก)
    this.timer = setInterval(() => {
      if (o.isPaused?.()) return;
      const f = o.getFps(); if (f) this.fps.push(f);
      if (!o.isDemo() && isRunning() && o.video?.videoWidth) this.bright.push(measureBrightness(o.video));
    }, 1000);
    return this.session;
  }
  stopSampling() { clearInterval(this.timer); this.timer = null; }

  // บันทึกท่าหนึ่งครั้งทันที (ไม่รอจบรอบ) — ถ้าพลาดเก็บไว้ลองใหม่ตอนจบ
  rep(r) {
    if (!this.session) return;
    this.repCount++;
    const row = { ...r, sessionId: this.session.id, userId: this.session.userId, game: this.session.game, timestamp: Date.now(),
      gesture: r.gesture, peak: r.peak ?? null, holdMs: r.holdMs ?? null, success: !!r.success, angle: Number.isFinite(r.angle) ? r.angle : null };
    const p = saveRep(row).catch(() => { this.pending.push(row); });
    return p;
  }

  // จบรอบ: รวมค่า + บันทึก คืน { ok, session, error }
  async finish({ reps, accuracy, score, maxSpreadDeg, details = {} }) {
    this.stopSampling();
    const s = this.session; if (!s) return { ok: false, error: 'ยังไม่ได้เริ่มรอบ' };
    Object.assign(s, { endTime: Date.now(), status: 'done', reps, accuracy: +(+accuracy || 0).toFixed(3), score,
      avgFps: avg(this.fps), avgBrightness: avg(this.bright), details: { ...s.details, ...details, repRows: this.repCount, fpsSamples: this.fps.length, brightnessSamples: this.bright.length } });
    if (Number.isFinite(maxSpreadDeg)) s.maxSpreadDeg = maxSpreadDeg;
    if (!s.machine) s.machine = await getMachineName();
    try {
      await saveSession(s);
      for (const row of this.pending.splice(0)) await saveRep(row);       // ท่าที่ค้างบันทึก
      window.__lastSession = s;
      return { ok: true, session: s };
    } catch (e) { return { ok: false, session: s, error: e.message || String(e) }; }
  }
  retry() { return this.finish({ reps: this.session.reps, accuracy: this.session.accuracy, score: this.session.score, maxSpreadDeg: this.session.maxSpreadDeg }); }
}

// บันทึกความรู้สึกหลังฝึก ลงในเซสชันเดิม { mood 1-5, pain 0-10, note }
export async function saveFeeling(sessionId, feeling) {
  const s = await get('sessions', sessionId);
  if (!s) throw new Error('ไม่พบเซสชัน ' + sessionId);
  s.feeling = { ...feeling, at: Date.now() };
  await put('sessions', s);
  return s;
}
