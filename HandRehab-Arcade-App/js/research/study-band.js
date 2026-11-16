// ============================================================
// study-band.js — แถบเก็บข้อมูลงานวิจัย วางทับหน้าเกมเดิม
//
// เปิดใช้เฉพาะเมื่อเปิดหน้าเกมด้วย ?study=1 เท่านั้น
// ถ้าไม่มีพารามิเตอร์นี้ ไฟล์นี้ return ทันที หน้าเกมปกติไม่เปลี่ยนอะไรเลย
//
// สิ่งที่แถบนี้ทำ
//   1. ระหว่างบล็อกเก็บข้อมูล จะ "ปิดเลขของระบบ" ไม่ให้ผู้สังเกตเห็น
//      เพราะถ้าเห็น คนนับจะเผลอมองตามจอ ตัวเลขที่ได้ก็ไม่มีความหมาย
//   2. ให้ผู้สังเกตกดนับเองทีละครั้ง หรือจะนับในใจแล้วพิมพ์ทีเดียวตอนจบก็ได้
//   3. พอจบบล็อก ค่อยเปิดเผยเลขของระบบ แล้วโชว์ผลต่างให้เห็นกับตา
//   4. บันทึกลง localStorage แล้วไปดาวน์โหลดรวมทีเดียวที่หน้า study.html
//
// ไม่แตะตรรกะของเกมเลย ฟังเหตุการณ์ hr-rep ที่หน้าเกมส่งออกมาเท่านั้น
// ============================================================

const P = new URLSearchParams(location.search);

const L = () => (document.documentElement.lang === 'en' ? 'en' : 'th');
const t = (th, en) => (L() === 'en' ? en : th);

const KEY = 'hr-study-v1';
const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } };
const save = (rows) => { try { localStorage.setItem(KEY, JSON.stringify(rows)); return true; } catch { return false; } };

function init() {
  // ค่าที่หน้า study.html ส่งมาทาง URL
  const participant = P.get('p') || 'P00';
  const light = P.get('light') || 'unknown';
  const target = Math.max(1, +(P.get('target') || 30));

  const st = {
    running: false,
    sysCount: 0,      // ระบบนับได้เท่าไร ระหว่างบล็อกนี้
    obsTally: 0,      // ผู้สังเกตกดนับเองได้เท่าไร
    startedAt: null,
    block: load().filter((r) => r.participant === participant).length + 1,
  };

  // ---------- สร้างแถบ ----------
  const band = document.createElement('div');
  band.id = 'studyBand';
  band.innerHTML = `
    <span class="tag">${t('เก็บข้อมูล', 'STUDY')}</span>
    <span class="who">${participant}
      <span class="muted">· ${t('แสง', 'light')} ${light} · ${t('บล็อกที่', 'block')} <b id="sbBlock">${st.block}</b></span>
    </span>
    <span class="tally" title="${t('กดทุกครั้งที่เห็นผู้เข้าร่วมจีบนิ้วครบหนึ่งครั้ง', 'Press each time you see one complete pinch')}">
      <span class="muted">${t('คุณนับได้', 'you counted')}</span><b id="sbTally">0</b>
      <button type="button" id="sbTick" disabled>+1</button>
      <button type="button" class="ghost" id="sbUndo" disabled>−1</button>
    </span>
    <span class="spacer"></span>
    <button type="button" id="sbGo">${t('▶ เริ่มบล็อก', '▶ Start block')}</button>
    <button type="button" class="ghost" id="sbHome">${t('เสร็จแล้ว', 'Done')}</button>`;
  document.body.prepend(band);
  document.body.classList.add('study-on');

  const $ = (id) => band.querySelector('#' + id);
  const tallyEl = $('sbTally');

  // ---------- ฟังจำนวนครั้งที่ระบบนับได้ ----------
  // หน้าเกมส่ง CustomEvent 'hr-rep' ออกมาทุกครั้งที่นับได้หนึ่งครั้ง
  addEventListener('hr-rep', () => {
    if (!st.running) return;
    st.sysCount += 1;
    // ไม่แสดงให้เห็น ระหว่างบล็อกต้องมืดสนิท
    if (st.sysCount >= target) finish();   // ครบเป้าแล้วปิดบล็อกให้เอง
  });

  const setTally = (n) => { st.obsTally = Math.max(0, n); tallyEl.textContent = st.obsTally; };
  $('sbTick').onclick = () => setTally(st.obsTally + 1);
  $('sbUndo').onclick = () => setTally(st.obsTally - 1);
  $('sbHome').onclick = () => { location.href = 'study.html'; };

  // ---------- เริ่ม และ จบ ----------
  $('sbGo').onclick = () => (st.running ? finish() : start());

  function start() {
    st.running = true; st.sysCount = 0; st.startedAt = Date.now();
    setTally(0);
    document.body.classList.add('study-blind');
    const stage = document.querySelector('.stage');
    if (stage) stage.dataset.blindNote = t('ซ่อนเลขของระบบไว้ระหว่างเก็บข้อมูล',
                                           'The system count is hidden while recording');
    $('sbGo').textContent = t('■ จบบล็อก', '■ End block');
    $('sbTick').disabled = false; $('sbUndo').disabled = false;
  }

  function finish() {
    if (!st.running) return;
    st.running = false;
    $('sbGo').textContent = t('▶ เริ่มบล็อก', '▶ Start block');
    $('sbTick').disabled = true; $('sbUndo').disabled = true;
    ask();
  }

  // ---------- ถามเลขของผู้สังเกต แล้วค่อยเปิดเผยของระบบ ----------
  function ask() {
    const box = document.createElement('div');
    box.id = 'studyResult';
    box.innerHTML = `
      <div class="box">
        <h2>${t('ผู้สังเกตนับได้กี่ครั้ง', 'How many did you count?')}</h2>
        <p class="sub">${t('ใส่ตัวเลขที่คุณนับได้เอง ก่อนจะเห็นเลขของระบบ',
                           'Enter your own count before the system count is revealed')}</p>
        <input type="number" id="sbObs" min="0" step="1" value="${st.obsTally}" inputmode="numeric">
        <div class="row">
          <button type="button" class="ghost" id="sbDrop">${t('ทิ้งบล็อกนี้', 'Discard')}</button>
          <button type="button" id="sbOk">${t('ยืนยัน', 'Confirm')}</button>
        </div>
        <p class="hint">${t('ทิ้งบล็อกนี้ถ้ามีอะไรผิดปกติ เช่น มือหลุดเฟรม หรือมีคนเดินผ่าน',
                            'Discard if something went wrong, e.g. the hand left the frame')}</p>
      </div>`;
    document.body.appendChild(box);
    const inp = box.querySelector('#sbObs');
    inp.focus(); inp.select();

    box.querySelector('#sbDrop').onclick = () => { box.remove(); unblind(); };
    box.querySelector('#sbOk').onclick = () => {
      const obs = Math.round(+inp.value);
      if (!(obs >= 0)) { inp.focus(); return; }
      box.remove();
      reveal(obs);
    };
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') box.querySelector('#sbOk').click(); });
  }

  function reveal(obs) {
    const sys = st.sysCount, diff = Math.abs(sys - obs);
    const cls = diff === 0 ? 'd0' : 'dbad';

    const rec = {
      id: 'b_' + Date.now().toString(36),
      participant, light, block: st.block,
      systemCount: sys, observerCount: obs, absError: diff,
      targetReps: target,
      startedAt: new Date(st.startedAt).toISOString(),
      endedAt: new Date().toISOString(),
      seconds: Math.round((Date.now() - st.startedAt) / 1000),
    };
    const rows = load(); rows.push(rec);
    const ok = save(rows);

    const box = document.createElement('div');
    box.id = 'studyResult';
    box.innerHTML = `
      <div class="box">
        <h2>${t('ผลของบล็อกที่', 'Result of block')} ${st.block}</h2>
        <p class="sub">${ok ? t('บันทึกแล้ว', 'Saved')
                            : t('⚠ บันทึกไม่สำเร็จ พื้นที่เก็บของเบราว์เซอร์เต็มหรือถูกปิดอยู่',
                                '⚠ Could not save; browser storage is full or blocked')}</p>
        <div class="cmp">
          <div><span>${t('ระบบนับ', 'system')}</span><b>${sys}</b></div>
          <div><span>${t('ผู้สังเกตนับ', 'observer')}</span><b>${obs}</b></div>
          <div class="${cls}"><span>${t('ต่างกัน', 'difference')}</span><b>${diff}</b></div>
        </div>
        <div class="row">
          <button type="button" class="ghost" id="sbEnd">${t('พอแค่นี้', 'Finish')}</button>
          <button type="button" id="sbNext">${t('บล็อกต่อไป', 'Next block')}</button>
        </div>
        <p class="hint">${t('เก็บไว้ในเบราว์เซอร์เครื่องนี้ ไปดาวน์โหลดไฟล์เดียวได้ที่หน้าเก็บข้อมูล',
                            'Stored in this browser. Download one file from the study page.')}</p>
      </div>`;
    document.body.appendChild(box);

    box.querySelector('#sbNext').onclick = () => {
      box.remove(); unblind();
      st.block += 1; $('sbBlock').textContent = st.block;
      setTally(0);
    };
    box.querySelector('#sbEnd').onclick = () => { location.href = 'study.html'; };
  }

  function unblind() {
    document.body.classList.remove('study-blind');
  }
}

// เรียกท้ายไฟล์ เพราะ init() ใช้ load() กับ save() ซึ่งเป็น const
// ถ้าเรียกไว้บนสุดจะติด temporal dead zone แล้วแถบไม่ขึ้นเลย
if (P.get('study') === '1') init();
