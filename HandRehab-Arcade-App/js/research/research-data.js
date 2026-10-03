// ============================================================
// research-data.js — อ่านเซสชันทั้งหมดสำหรับเครื่องมือวิจัย + แยกข้อมูลจำลอง + ป้ายเตือน
// บทความ §6.2: ก่อนเก็บข้อมูลวิจัยจริง ต้องลบข้อมูลจำลองออกก่อน
// ============================================================
import { getAll, put, del, getSettings, saveSettings, deleteByIndex } from '../db.js';

// ข้อมูลจำลองมี 3 แบบ: ประวัติจำลอง 30 วัน (details.synthetic), ผู้ใช้ตัวอย่าง (extra.demo),
// และการเล่นโหมดสาธิตด้วยเมาส์/คีย์บอร์ด (details.demo หรือ delegate 'demo…') — ไม่ใช่การวัดมือจริง
export function demoKind(s, demoUsers = new Set()) {
  if (s.details?.synthetic) return 'synthetic';
  if (demoUsers.has(s.userId)) return 'demo-user';
  if (s.details?.demo || String(s.delegate || '').startsWith('demo')) return 'demo-mode';
  return '';
}

export async function loadResearchSessions() {
  const [sessions, users] = await Promise.all([getAll('sessions'), getAll('users').catch(() => [])]);
  const demoUsers = new Set(users.filter((u) => u.extra?.demo).map((u) => u.id));
  const names = Object.fromEntries(users.map((u) => [u.id, `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.id]));
  return sessions.map((s) => ({ ...s, demoKind: demoKind(s, demoUsers) })).map((s) => Object.assign(s, { userName: names[s.userId] || s.userId }));
}

// ป้ายเตือนเมื่อมีข้อมูลจำลองในฐานข้อมูล (นับเฉพาะชนิดที่ลบได้: ประวัติจำลอง + ผู้ใช้ตัวอย่าง)
export async function demoBanner(host, { filtered = false } = {}) {
  if (!host) return 0;
  let n = 0, nUsers = 0;
  try {
    const list = await loadResearchSessions();
    n = list.filter((s) => s.demoKind === 'synthetic' || s.demoKind === 'demo-user').length;
    nUsers = new Set(list.filter((s) => s.demoKind === 'demo-user').map((s) => s.userId)).size;
  } catch (e) { console.warn('[research] นับข้อมูลจำลองไม่ได้', e); }
  host.classList.toggle('hidden', !n);
  if (n) host.innerHTML = `⚠️ <b>ลบข้อมูลจำลองก่อนเก็บข้อมูลวิจัย</b> — ตอนนี้มีเซสชันจำลอง <b>${n}</b> รายการในเครื่องนี้
    ${filtered ? '(ตัวเลขด้านล่างตัดข้อมูลจำลองออกแล้ว เว้นแต่เปิดสวิตช์ "รวมข้อมูลจำลอง")' : '(ไฟล์/รายงานที่สร้างจากฐานข้อมูลอาจมีข้อมูลจำลองปน)'}
    <div class="row" style="margin-top:8px"><a class="btn-glow small" href="history.html#clearDemo">🧹 ไปที่ปุ่มลบข้อมูลจำลอง (หน้าประวัติ)</a>
    ${nUsers ? `<a class="btn-glow ghost small" href="users.html">👥 ผู้ใช้ตัวอย่าง ${nUsers} คน (ลบที่หน้าผู้ใช้)</a>` : ''}</div>`;
  return n;
}

// ---------- ข้อมูลจำลองเฉพาะเครื่องมือวิจัย (ผู้ใช้สมมติ DEMO-R.. / DEMO-C..) ----------
const rnd = (seed) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
// เซสชันวัดซ้ำของคนสมมติ 8 คน × 5 ครั้ง: ค่าจริงต่างกันระหว่างคน + ความคลาดเคลื่อนเล็กน้อยต่อครั้ง (+ ครั้งแรกต่ำกว่าเพราะยังไม่คุ้น)
export async function makeReliabilityDemo(now = Date.now()) {
  const r = rnd(42), DAY = 864e5, out = [];
  for (let p = 1; p <= 8; p++) {
    const uid = 'DEMO-R' + String(p).padStart(2, '0'), trueSpread = 30 + r() * 25, trueReps = 12 + r() * 14, trueRt = 450 + r() * 300;
    for (let k = 0; k < 5; k++) {
      const practice = k === 0 ? 0.8 : 1, t = now - (20 - k * 3) * DAY + p * 6e5;
      ['spread-wall', 'star-portal', 'rhythm-tap'].forEach((game, gi) => {
        const reps = Math.round(trueReps * practice + (r() - 0.5) * 8), acc = +Math.min(1, (0.6 + trueReps / 60) * practice + (r() - 0.5) * 0.08).toFixed(3);
        const s = { id: `demo-rel-${p}-${k}-${gi}`, userId: uid, game, startTime: t + gi * 4e5, endTime: t + gi * 4e5 + 3e5, status: 'done', reps, accuracy: acc,
          score: reps * 10, avgFps: 28, avgBrightness: 120, delegate: 'GPU', machine: 'DEMO',
          calib: { gesture: game === 'spread-wall' ? 'spread' : 'pinch', rest: 0.8, best: 0.25, entry: 0.415, exit: 0.635, thetaOn: 0.7, thetaOff: 0.3, locked: k >= 1, calibratedAt: now - 22 * DAY, source: 'demo' },
          details: { synthetic: true, researchDemo: 'reliability' } };
        if (game === 'spread-wall') s.maxSpreadDeg = +(trueSpread * practice + (r() - 0.5) * 9).toFixed(1);
        if (game === 'rhythm-tap') s.details.meanRtMs = Math.round(trueRt / practice + (r() - 0.5) * 60);
        out.push(s);
      });
    }
  }
  for (const s of out) await put('sessions', s);
  return out.length;
}
// เซสชันสำหรับทดสอบความถูกต้องการนับ: 3 ระดับแสง × 4 เซสชัน พร้อมจำนวนที่ "ผู้สังเกต" นับ
export async function makeCountDemo(now = Date.now()) {
  const r = rnd(7), store = await loadCountStore();
  const levels = [['bright', 175], ['normal', 115], ['dim', 55]];
  let n = 0;
  for (const [li, [light, b]] of levels.entries()) {
    for (let i = 0; i < 4; i++) {
      const obs = 15 + Math.round(r() * 10), miss = light === 'dim' ? Math.round(r() * 4) : light === 'normal' ? Math.round(r() * 1.6) : Math.round(r() * 0.8);
      const s = { id: `demo-cnt-${light}-${i}`, userId: 'DEMO-C0' + (i + 1), game: 'star-portal', startTime: now - (li * 4 + i + 1) * 36e5, endTime: now - (li * 4 + i + 1) * 36e5 + 18e4,
        status: 'done', reps: obs - miss + (r() < 0.2 ? 1 : 0), accuracy: 0.8, score: 100, avgFps: 27, avgBrightness: b + Math.round((r() - 0.5) * 20), delegate: 'GPU', machine: 'DEMO',
        calib: { gesture: 'pinch', rest: 0.8, best: 0.25, entry: 0.415, exit: 0.635, thetaOn: 0.7, thetaOff: 0.3, locked: true, calibratedAt: now - 864e5, source: 'demo' },
        details: { synthetic: true, researchDemo: 'count' } };
      await put('sessions', s);
      store[s.id] = { observer: obs, light, note: 'DEMO', at: now, demo: true };
      n++;
    }
  }
  await saveCountStore(store);
  return n;
}
// ลบข้อมูลจำลองของเครื่องมือวิจัย (เฉพาะที่หน้านี้สร้าง)
export async function clearResearchDemo(kind) {
  let n = 0;
  for (const s of await getAll('sessions')) {
    if (s.details?.synthetic && (!kind || s.details.researchDemo === kind) && s.details.researchDemo) {
      await deleteByIndex('reps', 'sessionId', s.id).catch(() => 0); await del('sessions', s.id); n++;
    }
  }
  if (kind !== 'reliability') {                     // ค่าผู้สังเกตตัวอย่างเป็นของหน้า count-accuracy
    const store = await loadCountStore();
    for (const [id, v] of Object.entries(store)) if (v.demo) delete store[id];
    await saveCountStore(store);
  }
  return n;
}

// ---------- ค่าที่ผู้สังเกตนับ: store 'settings' key 'count-accuracy' (ไม่แก้โครงสร้าง db.js) ----------
// value = { [sessionId]: { observer, light: 'bright'|'normal'|'dim', note, at, demo? } }
export const COUNT_KEY = 'count-accuracy';
export async function loadCountStore() { const v = await getSettings(COUNT_KEY); return v && typeof v === 'object' ? { ...v } : {}; }
export const saveCountStore = (v) => saveSettings(COUNT_KEY, v);
