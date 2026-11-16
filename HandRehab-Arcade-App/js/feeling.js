// ============================================================
// feeling.js — ถามความรู้สึกหลังฝึก: หน้ายิ้ม 5 ระดับ + ความปวด 0-10 + บันทึกสั้น ๆ (Lab 28)
// ช่วยอธิบายว่าทำไมบางวันทำได้ดี บางวันทำได้น้อย (นอนน้อย ปวดข้อ เหนื่อย ฯลฯ)
// ============================================================
import { modal, esc, toast } from './ui.js';
import { saveFeeling } from './recorder.js';

export const MOODS = [
  { v: 1, icon: '😫', th: 'เหนื่อยมาก' }, { v: 2, icon: '😣', th: 'ไม่ค่อยดี' }, { v: 3, icon: '😐', th: 'เฉย ๆ' },
  { v: 4, icon: '🙂', th: 'ดี' }, { v: 5, icon: '😄', th: 'สบายมาก' },
];
export const moodIcon = (v) => MOODS.find((m) => m.v === v)?.icon || '—';

// เปิดแบบฟอร์ม คืน feeling ที่บันทึก หรือ null ถ้าข้าม
export async function askFeeling(sessionId) {
  const p = modal(`<h2>วันนี้รู้สึกอย่างไร?</h2>
    <p class="muted">ตอบสั้น ๆ ช่วยให้นักกายภาพเข้าใจว่าทำไมบางวันทำได้ดีกว่า</p>
    <fieldset class="row mood-row" style="border:0;padding:0"><legend>ความรู้สึก / ความเหนื่อย</legend>
      ${MOODS.map((m) => `<label class="choice mood"><input type="radio" name="mood" value="${m.v}" ${m.v === 4 ? 'checked' : ''}><span style="font-size:2em">${m.icon}</span> ${esc(m.th)}</label>`).join('')}</fieldset>
    <label class="field">มีอาการปวดไหม? <b id="painV" class="num">0</b> / 10 (0 = ไม่ปวด · 10 = ปวดมากที่สุด)
      <input id="pain" type="range" min="0" max="10" step="1" value="0"></label>
    <label class="field">บันทึกเพิ่มเติม (ถ้ามี)<textarea id="fnote" maxlength="500" placeholder="เช่น เมื่อคืนนอนน้อย, ข้อนิ้วชี้ตึง ๆ, สนุกมาก"></textarea></label>
    <p id="painWarn" class="alert warn hidden">ปวดตั้งแต่ 7 ขึ้นไป ควรหยุดพักและบอกผู้ดูแลหรือนักกายภาพ</p>`,
  [{ label: 'ข้าม', value: 'skip', cls: 'ghost' }, { label: '💾 บันทึกความรู้สึก', value: 'save', cls: 'success' }]);
  // modal สร้าง DOM ทันที จึงจับช่องกรอกไว้ก่อนหน้าต่างปิด
  const box = document.querySelector('.modal-back:last-of-type');
  const pain = box.querySelector('#pain');
  pain.oninput = () => { box.querySelector('#painV').textContent = pain.value; box.querySelector('#painWarn').classList.toggle('hidden', +pain.value < 7); };
  const choice = await p;
  if (choice !== 'save') return null;
  const feeling = { mood: +(box.querySelector('input[name=mood]:checked')?.value || 3), pain: +pain.value, note: box.querySelector('#fnote').value.trim() };
  try { await saveFeeling(sessionId, feeling); toast('บันทึกความรู้สึกแล้ว ขอบคุณครับ', 'success'); return feeling; }
  catch (e) { toast('บันทึกความรู้สึกไม่สำเร็จ: ' + e.message, 'error', 5); return null; }
}
