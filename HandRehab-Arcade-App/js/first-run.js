// ============================================================
// first-run.js — หน้าต่างเตือนตอนเปิดแอปครั้งแรก (Lab 33 ข้อ 6)
// ถ้าเครื่องดูสเปกต่ำ: เสนอปรับค่าให้อัตโนมัติ พร้อมอธิบายว่าจะเสียอะไรไป (ห้ามปรับเงียบ ๆ)
// จำไว้ใน localStorage 'hr-first-run' ว่าเคยถามแล้ว ครั้งต่อไปจะไม่ถามซ้ำ
// ทดสอบ: เปิด index.html?firstrun=1&tier=low (บังคับให้ถามอีกครั้งและทำตัวเหมือนเครื่องเบา)
// ============================================================
import { detectDeviceWithOverride } from './device-info.js';
import { LOW_PRESET, lowPresetLosses, toPrefs, STYLE_TH, RES_TH, EFFECTS_TH } from './recommend.js';
import { modal, savePrefs, toast, esc } from './ui.js';

const KEY = 'hr-first-run';
const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; } };
const write = (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* ไม่เป็นไร */ } };

// benchUrl = ที่อยู่หน้าทดสอบ (ถ้าเรียกจากหน้าอื่นของแอป)
// คืน 'auto' | 'keep' | 'test' | 'ok' | 'skip'
export async function firstRunCheck({ benchUrl = null, onTest = null } = {}) {
  const force = new URLSearchParams(location.search).has('firstrun');
  if (read() && !force) return 'skip';
  const d = detectDeviceWithOverride();
  if (d.tier !== 'low') { write({ at: Date.now(), tier: d.tier, choice: 'ok' }); return 'ok'; }
  const losses = lowPresetLosses();
  const choice = await modal(`<h2>⚠️ เครื่องนี้อาจเล่นได้ไม่ลื่น</h2>
    <p>จากสเปกที่เบราว์เซอร์บอก เครื่องนี้อยู่ในกลุ่ม <b>${esc(d.tierTh)}</b></p>
    <ul class="first-run-list">${d.reasons.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
    <p>เราแนะนำให้ปรับเป็น: <b>${STYLE_TH[LOW_PRESET.style]}</b> · <b>${RES_TH[LOW_PRESET.resolution]}</b> · <b>${EFFECTS_TH[LOW_PRESET.effects]}</b></p>
    <p><b>สิ่งที่จะเสียไปถ้าปรับ:</b></p>
    <ul class="first-run-list">${losses.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>
    <p class="muted">การจับมือของ AI และการนับคะแนนยังทำงานเหมือนเดิม เปลี่ยนกลับได้ทุกเมื่อในหน้าตั้งค่า</p>`, [
    { label: '🔧 ปรับให้อัตโนมัติ', value: 'auto', cls: 'success' },
    { label: '⚡ ทดสอบจริงก่อน (ประมาณ 1 นาที)', value: 'test', cls: 'ghost' },
    { label: 'ใช้ค่าเดิม', value: 'keep', cls: 'ghost' },
  ]);
  write({ at: Date.now(), tier: d.tier, choice });
  if (choice === 'auto') { savePrefs(toPrefs(LOW_PRESET)); toast('ปรับค่าสำหรับเครื่องเบาแล้ว (เปลี่ยนกลับได้ในหน้าตั้งค่า)', 'success', 5); }
  if (choice === 'test') { if (onTest) onTest(); else if (benchUrl) location.href = benchUrl; }
  return choice;
}
