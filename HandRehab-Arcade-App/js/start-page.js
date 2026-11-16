// ============================================================
// start-page.js — หน้าตรวจความพร้อม สำหรับผู้ทดสอบที่ไม่รู้เรื่องเทคนิค
//
// ปัญหาที่แก้
//   เดิมผู้ถูกทดสอบเปิดแอปมาเจอเมนูของทีมวิจัย เต็มไปด้วยงานวัดความเร็วเครื่อง
//   ส่งออก CSV ซึ่งไม่ใช่เรื่องของเขาเลย และถ้ากล้องหรือโมเดลมีปัญหา
//   ก็ไม่มีใครบอกว่าต้องทำยังไงต่อ
//
// หน้านี้ทำสามอย่าง ทีละอย่าง อัตโนมัติ
//   1. เปิดกล้อง แล้ว "ให้เห็นภาพตัวเอง" เป็นหลักฐานว่ากล้องใช้ได้จริง
//   2. โหลดตัว AI จับมือ พร้อมบอกเปอร์เซ็นต์ และปุ่มลองใหม่ถ้าพลาด
//   3. บอกสด ๆ ว่าตอนนี้เห็นมือหรือยัง ถ้ายังไม่เห็นก็บอกว่าต้องทำยังไง
//
// ทุกข้อความบอกว่า "ให้ทำอะไรต่อ" ไม่ใช่บอกว่าอะไรพัง
// ============================================================

import { applyPrefs } from './ui.js';
import { CalibInput } from './calib-input.js';
import { startCamera } from './camera.js';

const $ = (id) => document.getElementById(id);
const L = () => (document.documentElement.lang === 'en' ? 'en' : 'th');
const t = (th, en) => (L() === 'en' ? en : th);

applyPrefs?.();

// ---------- ตัวช่วยตั้งสถานะของแต่ละข้อ ----------
// state: 'wait' กำลังรอ · 'work' กำลังทำ · 'ok' ผ่าน · 'bad' ไม่ผ่าน
function setStep(n, state, msg, help) {
  const card = $('step' + n);
  if (!card) return;
  card.dataset.state = state;
  card.querySelector('.ico').textContent =
    state === 'ok' ? '✅' : state === 'bad' ? '❌' : state === 'work' ? '⏳' : '⬜';
  card.querySelector('.msg').textContent = msg || '';
  const h = card.querySelector('.help');
  h.innerHTML = help || '';
  h.hidden = !help;
}

let input = null;
let handSeenAt = 0;

// ---------- ข้อ 1 กล้อง และ ข้อ 2 โมเดล ----------
async function boot() {
  $('retry').hidden = true;
  setStep(1, 'work', t('กำลังขอใช้กล้อง…', 'Asking for the camera…'),
    t('ถ้าเบราว์เซอร์ถามว่าจะให้ใช้กล้องไหม ให้กด <b>อนุญาต</b>',
      'If the browser asks for camera access, press <b>Allow</b>'));
  setStep(2, 'wait', t('รอข้อ 1 ก่อน', 'Waiting for step 1'));
  setStep(3, 'wait', t('รอข้อ 2 ก่อน', 'Waiting for step 2'));

  input = new CalibInput({ video: $('vid'), handCanvas: $('hand'), demoCanvas: null });
  input.onFrame = (_t, sq) => { if (sq) handSeenAt = performance.now(); };

  try {
    await input.startCamera((p) => {
      // โหลดโมเดลคืบหน้ากี่เปอร์เซ็นต์
      const pct = Math.round((p?.ratio ?? p ?? 0) * 100);
      setStep(2, 'work',
        t(`กำลังโหลดตัว AI จับมือ ${pct}%`, `Loading the hand AI ${pct}%`),
        t('ครั้งแรกต้องใช้อินเทอร์เน็ต ราว 8 MB ครั้งต่อไปจะเร็วขึ้นมาก',
          'The first run needs internet, about 8 MB. Later runs are much faster'));
    });
  } catch (e) {
    // แยกให้ชัดว่าพังที่กล้อง หรือพังที่โมเดล
    const atModel = /โมเดล|model/i.test(e.message || '');
    if (!atModel) {
      // ใช้ข้อความของแอปเองล้วน ๆ มันเจาะจงตามสาเหตุอยู่แล้ว
      // อย่าเติมคำแนะนำกลาง ๆ ทับ เพราะจะขัดกันเอง เช่นบอกว่าไม่มีกล้อง
      // แต่ข้างล่างดันบอกให้กดอนุญาต
      setStep(1, 'bad', e.message || t('เปิดกล้องไม่ได้', 'Could not open the camera'),
        (e.detail ? `<p>${e.detail}</p>` : '') +
        t('<p>แก้ตามข้างบนแล้วกด <b>ลองใหม่</b></p>',
          '<p>Fix that, then press <b>Try again</b></p>'));
      setStep(2, 'wait', t('ยังไม่ได้เริ่ม เพราะกล้องยังไม่พร้อม', 'Not started — the camera is not ready'));
    } else {
      // โมเดลพลาด ตัว CalibInput จะปิดกล้องทิ้ง กรอบภาพจึงดำ
      // เปิดกล้องกลับมาเฉพาะดูภาพ ผู้ใช้จะได้เห็นว่ากล้องใช้ได้จริงตามที่เขียน
      let camBack = false;
      try { await startCamera($('vid')); camBack = true; } catch { /* ไม่เป็นไร */ }
      setStep(1, camBack ? 'ok' : 'wait',
        camBack ? t('กล้องใช้ได้ เห็นภาพตัวเองทางขวาแล้ว', 'Camera works — you can see yourself on the right')
                : t('กล้องเปิดได้ แต่ปิดไปตอนโหลด AI ไม่สำเร็จ', 'Camera opened but was closed when the AI failed'));
      setStep(2, 'bad', t('โหลดตัว AI จับมือไม่สำเร็จ', 'Could not load the hand AI'),
        t(`<ol>
             <li>ตรวจว่าเครื่องต่ออินเทอร์เน็ตอยู่ ครั้งแรกต้องโหลดราว 8 MB</li>
             <li>ถ้าใช้ไวไฟของโรงเรียนแล้วไม่ได้ ลองเปลี่ยนเป็นเน็ตมือถือ</li>
             <li>แล้วกด <b>ลองใหม่</b> ข้างล่าง</li>
           </ol>`,
           `<ol><li>Check the internet connection; the first run downloads about 8 MB</li>
            <li>If the school wifi blocks it, try a phone hotspot</li>
            <li>Then press <b>Try again</b> below</li></ol>`));
    }
    $('retry').hidden = false;
    $('go').hidden = true;
    return;
  }

  setStep(1, 'ok', t('กล้องใช้ได้ เห็นภาพตัวเองทางขวาแล้ว', 'Camera works — you can see yourself on the right'));
  setStep(2, 'ok', t('ตัว AI จับมือพร้อมแล้ว', 'The hand AI is ready'));
  setStep(3, 'work', t('ยกมือขึ้นให้กล้องเห็น', 'Raise your hand so the camera can see it'),
    t('ให้ฝ่ามือหันเข้าหากล้อง ห่างราวหนึ่งช่วงแขน', 'Palm towards the camera, about an arm’s length away'));
  watchHand();
}

// ---------- ข้อ 3 เห็นมือหรือยัง ----------
function watchHand() {
  let wasOk = null;
  setInterval(() => {
    const ok = performance.now() - handSeenAt < 600;
    if (ok === wasOk) return;
    wasOk = ok;
    if (ok) {
      setStep(3, 'ok', t('เห็นมือแล้ว พร้อมเริ่มได้เลย', 'Hand detected — you are ready'));
      $('go').hidden = false;
    } else {
      setStep(3, 'work', t('ยังไม่เห็นมือ', 'No hand yet'),
        t(`<ul>
             <li>ยกมือขึ้นมาในกรอบภาพทางขวา ให้เห็นทั้งฝ่ามือ</li>
             <li>ถ้าห้องมืด เปิดไฟเพิ่ม หรือหันหน้าเข้าหาหน้าต่าง</li>
             <li>อย่าให้มืออยู่ใกล้กล้องเกินไป ห่างราวหนึ่งช่วงแขนกำลังดี</li>
           </ul>`,
           `<ul><li>Raise your hand into the picture on the right, whole palm visible</li>
            <li>If the room is dark, add light or face a window</li>
            <li>Do not hold the hand too close — about an arm’s length works best</li></ul>`));
    }
  }, 300);
}

$('retry').onclick = () => boot();
$('go').onclick = () => { location.href = 'calibrate.html'; };
$('skip').onclick = () => { location.href = 'star-portal.html'; };

addEventListener('hr-lang-change', () => location.reload());
boot();
