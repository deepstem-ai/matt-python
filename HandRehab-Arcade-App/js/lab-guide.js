// ============================================================
// lab-guide.js — บอกเป็นคำพูดว่า "ตอนนี้ให้ทำอะไร" บนหน้าเก็บข้อมูลทั้งสี่
//
// ปัญหาที่แก้  คนที่ไม่ถนัดคอมพิวเตอร์เปิดหน้ามาแล้วไม่รู้ว่าต้องกดอะไร
// ต้องมีคนคอยประกบ  ไฟล์นี้ทำให้ทุกหน้ามีประโยคเดียวบนสุดว่าต้องทำอะไร
// และมีปุ่มใหญ่ปุ่มเดียวด้านล่างว่าขั้นต่อไปคืออะไร
//
// ไม่แตะตรรกะของแลปเลย  แค่กดปุ่มที่มีอยู่แล้วแทนผู้ใช้ และพาไปหน้าถัดไป
// ============================================================
const L = () => (document.documentElement.lang === 'en' ? 'en' : 'th');
const t = (th, en) => (L() === 'en' ? en : th);
const here = location.pathname.split('/').pop() || 'index.html';

// ลำดับสี่ขั้นของงานวิจัย ต้องตรงกับ js/steps.js และ menu.html
const FLOW = ['benchmark.html', 'filters.html', 'evaluate.html', 'count-accuracy.html'];
const pos = FLOW.indexOf(here);
const nextPage = pos >= 0 && pos < FLOW.length - 1 ? FLOW[pos + 1] : 'menu.html';
const nextLabel = () => (pos >= 0 && pos < FLOW.length - 1
  ? t(`ไปขั้นที่ ${pos + 2} →`, `Go to step ${pos + 2} →`)
  : t('เสร็จแล้ว กลับเมนู →', 'Done, back to menu →'));

// สิ่งที่ต้องทำในแต่ละหน้า  run = ปุ่มที่ต้องกดก่อน  save = ปุ่มบันทึกไฟล์
const PAGE = {
  'benchmark.html': {
    n: 1,
    say: t('กดปุ่มด้านล่างขวา แล้วนั่งรอจนกว่าจะขึ้นผล ห้ามสลับไปหน้าต่างอื่น',
           'Press the button at the bottom right and wait for the result. Do not switch windows'),
    hint: t('โปรแกรมจะวัดความเร็วเครื่องเอง 6 แบบ', 'The computer measures its own speed in six scenarios'),
    run: '#runBtn, #startBtn, #benchBtn, button[id*=run]',
    runLabel: t('▶ เริ่มวัดความเร็วเครื่อง', '▶ Start measuring this computer'),
    save: '#csvBtn, #csv, button[id*=csv]',
    saveLabel: t('⬇ บันทึกไฟล์ผล แล้วไปขั้นต่อไป', '⬇ Save the result file, then next step'),
  },
  'filters.html': {
    n: 2,
    say: t('กดปุ่มด้านล่างขวาเพื่อคำนวณตารางเปรียบเทียบตัวกรองสามแบบ',
           'Press the button at the bottom right to compute the three-filter comparison'),
    hint: t('ไม่ต้องใช้กล้อง ใช้สัญญาณจำลองที่ให้ผลเดิมทุกครั้ง',
            'No camera needed; it uses a fixed synthetic signal that gives the same result every time'),
    run: '#benchBtn',
    runLabel: t('▶ คำนวณตารางเปรียบเทียบ', '▶ Compute the comparison table'),
    save: '#benchCsv',
    saveLabel: t('⬇ บันทึกไฟล์ผล แล้วไปขั้นต่อไป', '⬇ Save the result file, then next step'),
  },
  'evaluate.html': {
    n: 3,
    say: t('เลือกระดับแสงให้ตรงกับห้องจริง แล้วทำท่าตามที่หน้าจอบอกจนครบ',
           'Set the light level to match the real room, then perform the gesture as the screen asks'),
    hint: t('ต้องใช้กล้อง ทำทีละท่าจนครบแล้วค่อยบันทึก',
            'This one needs the camera; finish every gesture before saving'),
    save: '#csvBtn, #csv, button[id*=csv]',
    saveLabel: t('⬇ บันทึกไฟล์ผล แล้วไปขั้นต่อไป', '⬇ Save the result file, then next step'),
  },
  'count-accuracy.html': {
    n: 4,
    say: t('พิมพ์จำนวนครั้งที่คุณนับได้เองจากวิดีโอ ลงในช่อง "ผู้สังเกตนับ" ของแต่ละแถว',
           'Type the number of repetitions you counted yourself into the "observer" box on each row'),
    hint: t('ระบบบันทึกให้ทันทีที่พิมพ์ ไม่ต้องกดบันทึกทีละช่อง',
            'Each entry is saved as you type; there is no save button per row'),
    save: '#csv, #csvBtn, button[id*=csv]',
    saveLabel: t('⬇ บันทึกไฟล์ผล แล้วจบขั้นตอน', '⬇ Save the result file and finish'),
  },
};

const cfg = PAGE[here];
const ls = () => window.labScreen;

function pick(sel) {
  if (!sel) return null;
  for (const s of sel.split(',')) {
    const el = document.querySelector(s.trim());
    if (el) return el;
  }
  return null;
}

function toSave() {
  const btn = pick(cfg.save);
  ls()?.step({
    n: cfg.n,
    say: t('ได้ผลแล้ว กดปุ่มด้านล่างขวาเพื่อบันทึกไฟล์ไว้ใช้เขียนบทความ',
           'The result is ready. Press the button at the bottom right to save the file for the paper'),
    hint: t('ไฟล์จะไปอยู่ในโฟลเดอร์ดาวน์โหลดของเครื่อง',
            'The file goes to this computer’s Downloads folder'),
    button: cfg.saveLabel,
    done: true,
    enabled: !!btn,
    onClick: () => {
      btn?.click();
      setTimeout(() => ls()?.step({
        say: t('บันทึกไฟล์แล้ว กดปุ่มด้านล่างขวาเพื่อไปขั้นต่อไป',
               'File saved. Press the button at the bottom right for the next step'),
        hint: '', button: nextLabel(), done: true,
        onClick: () => { location.href = nextPage; },
      }), 700);
    },
  });
}

function start() {
  if (!cfg || !ls()) return;
  const runBtn = pick(cfg.run);
  if (runBtn) {
    ls().step({
      n: cfg.n, say: cfg.say, hint: cfg.hint,
      button: cfg.runLabel, enabled: true, done: false,
      onClick: () => { runBtn.click(); setTimeout(toSave, 1200); },
    });
    runBtn.addEventListener('click', () => setTimeout(toSave, 1200));
  } else {
    // หน้าที่ไม่มีปุ่มรัน เช่น กรอกตัวเลขเอง  ข้ามไปขั้นบันทึกเลย
    ls().step({ n: cfg.n, say: cfg.say, hint: cfg.hint });
    toSave();
    ls().step({ say: cfg.say, hint: cfg.hint });
  }
}

if (document.readyState === 'loading') addEventListener('DOMContentLoaded', () => setTimeout(start, 60));
else setTimeout(start, 60);
// เปลี่ยนภาษาแล้วต้องเขียนข้อความใหม่ทั้งหมด ไม่ใช่ค้างภาษาเดิม
addEventListener('hr-lang-change', () => setTimeout(start, 80));
