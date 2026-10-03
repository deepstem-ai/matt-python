// ============================================================
// consent.js — หน้าต่างขอความยินยอม (Lab 12 ขั้นที่ 4)
// กฎ PDPA: ข้อมูลสุขภาพเป็น "ข้อมูลอ่อนไหว" ต้องได้ความยินยอมชัดแจ้งก่อนเก็บ
//  - ช่องติ๊กต้องว่างเสมอ (ห้ามติ๊กไว้ให้ก่อน)
//  - ต้องเลื่อนอ่านจนสุดก่อน ช่องติ๊กจึงกดได้ และติ๊กแล้วปุ่มยอมรับจึงกดได้
//  - คืนเวลาที่ยอมรับ (ms) เพื่อบันทึกเป็น consentAt
// ============================================================

const $ = (id) => document.getElementById(id);

// เปิดหน้าต่าง คืน Promise: เวลาที่ยอมรับ (ตัวเลข) หรือ null ถ้าไม่ยอมรับ
export function openConsent() {
  return new Promise((resolve) => {
    const back = $('consentBack'), box = $('consentScroll'), chk = $('consentChk'), ok = $('consentOk');
    chk.checked = false; chk.disabled = true; ok.disabled = true;
    $('consentHint').textContent = '⬇ กรุณาเลื่อนอ่านให้จนสุดก่อน';
    back.classList.remove('hidden');
    box.scrollTop = 0;
    box.focus();

    // ตรวจว่าเลื่อนถึงล่างสุดแล้วหรือยัง (เผื่อระยะ 8px)
    const check = () => {
      if (box.scrollTop + box.clientHeight >= box.scrollHeight - 8) {
        chk.disabled = false;
        $('consentHint').textContent = '✓ อ่านครบแล้ว ติ๊กช่องด้านล่างเพื่อยินยอม';
      }
    };
    const onChk = () => { ok.disabled = !chk.checked; };
    const close = (value) => {
      back.classList.add('hidden');
      box.removeEventListener('scroll', check);
      chk.removeEventListener('change', onChk);
      ok.onclick = null; $('consentCancel').onclick = null;
      resolve(value);
    };
    box.addEventListener('scroll', check);
    chk.addEventListener('change', onChk);
    ok.onclick = () => close(Date.now());        // บันทึกเวลาที่กดยอมรับ
    $('consentCancel').onclick = () => close(null);
    requestAnimationFrame(check);                  // จอใหญ่มาก เนื้อหาอาจไม่ต้องเลื่อน
  });
}
