// ============================================================
// speech.js — อ่านคำแนะนำออกเสียงด้วยเสียงสังเคราะห์ในเบราว์เซอร์ (Lab 09 COULD DO)
// ไม่ต้องใช้อินเทอร์เน็ตถ้าเครื่องมีเสียงภาษาไทยติดตั้งไว้ (Windows: ตั้งค่า > เวลาและภาษา > คำพูด)
// ============================================================
export const canSpeak = () => 'speechSynthesis' in window;

// หาเสียงที่ตรงภาษา (ไทยก่อน ถ้าไม่มีก็ใช้เสียงเริ่มต้น)
function pickVoice(lang) {
  const voices = window.speechSynthesis.getVoices();
  return voices.find((v) => v.lang?.toLowerCase().startsWith(lang)) || null;
}

// อ่านข้อความ คืน false ถ้าเครื่องนี้พูดไม่ได้
export function speak(text, lang = 'th') {
  if (!canSpeak() || !text) return false;
  window.speechSynthesis.cancel(); // หยุดประโยคเดิมก่อน ไม่ให้พูดซ้อน
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang === 'en' ? 'en-US' : 'th-TH';
  u.rate = 0.9; // ช้าลงนิดหนึ่ง ฟังง่ายสำหรับผู้สูงอายุ
  const v = pickVoice(lang === 'en' ? 'en' : 'th');
  if (v) u.voice = v;
  window.speechSynthesis.speak(u);
  return true;
}
export function stopSpeaking() { if (canSpeak()) window.speechSynthesis.cancel(); }

// ข้อความของหน้าที่เปิดอยู่: หัวข้อ + ย่อหน้าที่ติด data-say
export function pageInstructions(pageEl) {
  if (!pageEl) return '';
  const h = pageEl.querySelector('h1')?.textContent || '';
  const says = [...pageEl.querySelectorAll('[data-say]')].map((e) => e.textContent.trim()).filter(Boolean);
  return [h.replace(/[^\p{L}\p{M}\p{N}\s.,:()]/gu, '').trim(), ...says].join('. ');
}
