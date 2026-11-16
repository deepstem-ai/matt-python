// ============================================================
// users-demo.js — ปุ่ม "สร้างผู้ใช้ตัวอย่าง 5 คน" (Lab 13)
// สร้างข้อมูลปลอมครบทุกแบบ: ผู้ใช้ + ประวัติการฝึก + ท่าที่ทำ + การตั้งค่า + รูปใบหน้า
// เพื่อสาธิตหน้าจอได้ทันที และทดสอบว่าการลบผู้ใช้ลบทุกอย่างจริง
// ข้อมูลทั้งหมดเป็นชื่อสมมติ ไม่ใช่คนจริง
// ============================================================
import { createUser, saveSession, saveRep, saveSettings, saveFace } from './db.js';
import { cssVar } from './ui.js';

const DAY = 86400000;
const DEMO = [
  { firstName: 'สมศรี', lastName: 'ใจดี', birthDate: '1956-04-12', sex: 'female', hand: 'right', conditions: ['เบาหวาน', 'ข้อเสื่อม / ข้ออักเสบ'], tremor: 1, carer: 'สมชาย ใจดี', phone: '0812345678', sessions: 9, photo: true, goal: 'ถือช้อน / ตะเกียบ กินข้าวเองได้', pain: 3 },
  { firstName: 'บุญมี', lastName: 'มีสุข', birthDate: '1948-11-30', sex: 'male', hand: 'right', conditions: ['โรคหลอดเลือดสมอง (อัมพฤกษ์)', 'ความดันโลหิตสูง'], tremor: 2, carer: 'มาลี มีสุข', phone: '0891112222', sessions: 4, photo: false, goal: 'หยิบจับของชิ้นเล็กได้ (กระดุม เหรียญ ยา)', pain: 5, lastDaysAgo: 12 },
  { firstName: 'ประเสริฐ', lastName: 'ศรีสุข', birthDate: '1952-02-29', sex: 'male', hand: 'left', conditions: ['พาร์กินสัน'], tremor: 3, carer: 'วันดี ศรีสุข', phone: '0623334444', sessions: 6, photo: true, goal: 'เขียนหนังสือ / ลงลายมือชื่อได้', pain: 2 },
  { firstName: 'Mary', lastName: 'Smith', birthDate: '1961-07-08', sex: 'female', hand: 'right', conditions: ['นิ้วล็อก'], tremor: 0, carer: '', phone: '0955556666', sessions: 2, photo: false, goal: 'ใช้โทรศัพท์มือถือได้คล่องขึ้น', pain: 6 },
  { firstName: 'ทองใบ', lastName: 'แก้วมณี', birthDate: '1944-01-20', sex: 'female', hand: 'right', conditions: [], tremor: 1, carer: 'ทองดี แก้วมณี', phone: '0867778888', sessions: 0, photo: false, goal: 'ลดอาการข้อฝืดตอนเช้า', pain: 1 },
];
const GAMES = ['star-portal', 'rhythm-tap', 'spread-wall'];

// วาดรูป "ใบหน้าการ์ตูน" แทนภาพถ่ายจริง (ใช้สีจากธีมเท่านั้น)
function fakeFaceImage(i) {
  const c = document.createElement('canvas'); c.width = c.height = 160;
  const g = c.getContext('2d');
  g.fillStyle = cssVar('--input'); g.fillRect(0, 0, 160, 160);
  g.fillStyle = [cssVar('--sky'), cssVar('--pink'), cssVar('--success'), cssVar('--warning')][i % 4];
  g.beginPath(); g.arc(80, 85, 55, 0, Math.PI * 2); g.fill();
  g.fillStyle = cssVar('--bg');
  g.beginPath(); g.arc(60, 75, 7, 0, Math.PI * 2); g.arc(100, 75, 7, 0, Math.PI * 2); g.fill();
  g.strokeStyle = cssVar('--bg'); g.lineWidth = 5;
  g.beginPath(); g.arc(80, 95, 22, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
  return c.toDataURL('image/jpeg', 0.8);
}

// สร้างทั้งหมด คืนจำนวนที่สร้าง
export async function createDemoUsers() {
  const now = Date.now();
  const made = { users: 0, sessions: 0, reps: 0, faces: 0, settings: 0 };
  for (let i = 0; i < DEMO.length; i++) {
    const d = DEMO[i];
    const u = await createUser({
      firstName: d.firstName, lastName: d.lastName, birthDate: d.birthDate, sex: d.sex, hand: d.hand,
      conditions: d.conditions, conditionOther: '', tremor: d.tremor, medication: d.conditions.length ? 'ยาตามแพทย์สั่ง' : '',
      carer: d.carer, phone: d.phone, consentAt: now - 40 * DAY, createdAt: now - 40 * DAY + i * 1000,
      extra: { painScore: d.pain, goal: d.goal, goalOther: '', handSurgery: 'none', handSurgeryDetail: '', noConditions: !d.conditions.length, filledBy: 'carer', filledByName: 'ทีมพัฒนา', demo: true },
    });
    made.users++;
    // ประวัติการฝึกย้อนหลัง
    for (let k = 0; k < d.sessions; k++) {
      const start = now - ((d.lastDaysAgo || 0) + k * 3 + Math.random()) * DAY;
      const reps = 10 + Math.round(Math.random() * 15);
      const s = await saveSession({
        userId: u.id, game: GAMES[k % 3], startTime: start, endTime: start + 5 * 60000,
        reps, accuracy: +(0.6 + Math.random() * 0.35).toFixed(2), score: reps * 10 + Math.round(Math.random() * 100),
        avgFps: 24, delegate: 'GPU', feeling: ['😀', '🙂', '😐'][k % 3], details: { demo: true },
      });
      made.sessions++;
      // เก็บท่าย่อยเฉพาะ 2 ครั้งแรก (บางท่าไม่มี userId เพื่อทดสอบว่าลบตาม session ได้)
      if (k < 2) for (let n = 1; n <= 3; n++) { await saveRep({ sessionId: s.id, ...(n === 3 ? {} : { userId: u.id }), n, t: n * 1000, quality: 0.8 }); made.reps++; }
    }
    await saveSettings(u.id, { handStyle: 'neon', difficulty: d.tremor >= 2 ? 'easy' : 'normal' }); made.settings++;
    if (d.photo) {
      await saveFace({ userId: u.id, embedding: Array.from({ length: 16 }, () => Math.random()), quality: 0.9, image: fakeFaceImage(i), pose: 'front' });
      made.faces++;
    }
  }
  return made;
}
