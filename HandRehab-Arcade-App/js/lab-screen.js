// ============================================================
// lab-screen.js — ทำให้หน้าแลปจบในหน้าจอเดียว และบอกเสมอว่าตอนนี้ให้ทำอะไร
//
// ปัญหาที่แก้  หน้าเก็บข้อมูลเดิมยาวเกินจอ ต้องเลื่อนขึ้นลงสลับไปมา
// ระหว่างปุ่มที่ต้องกดกับผลที่ออกมา คนที่ไม่ถนัดคอมพิวเตอร์จึงทำเองไม่ได้
//
// ไฟล์นี้ไม่แตะตรรกะของแลปเลย แค่จัดหน้าใหม่
//   - ใส่ class lab-screen ให้ body  (css/lab-screen.css ล็อกความสูงเท่าหน้าจอ)
//   - สร้างบรรทัด "ตอนนี้ให้ทำอะไร" ไว้บนสุด
//   - สร้างแถบปุ่มใหญ่ไว้ล่างสุด  ปุ่มหลักหนึ่งปุ่มเท่านั้น
//   - พับของขั้นสูง (การ์ดที่ใส่ data-adv) เก็บไว้หลังปุ่ม "ตั้งค่าขั้นสูง"
//
// หน้าแลปเรียกใช้ผ่าน  window.labScreen.step({...})  เพื่อบอกว่าขั้นไหนแล้ว
// ============================================================

const L = () => (document.documentElement.lang === 'en' ? 'en' : 'th');
const t = (th, en) => (L() === 'en' ? en : th);

const main = document.querySelector('main.wrap');
if (main) {
  // ใส่ class ตอนท้าย หลังรู้แล้วว่าจัดผังได้จริง
  const lock = () => document.body.classList.add('lab-screen');

  // ---------- หน้าที่ยังไม่มีผัง .lab-grid  สร้างสองคอลัมน์ให้เอง ----------
  // ซ้าย = สิ่งที่ต้องทำ  ขวา = ผลที่ออกมา  ติดป้ายได้ด้วย data-pane="do" หรือ "see"
  // ---------- หาหรือสร้าง "แถวกลาง" ที่ยืดเต็มความสูงที่เหลือ ----------
  // ซ้าย = สิ่งที่ต้องทำ  ขวา = ผลที่ออกมา  ติดป้ายได้ด้วย data-pane="do" หรือ "see"
  const isCard = (el) => el.matches('section, div.card-neon') || el.classList.contains('card-neon');
  const SKIP = '.r-head, .bench-head, #labNow, #advBar, #labAct, nav, p, script';
  const loose = () => [...main.children].filter((el) => !el.matches(SKIP) && isCard(el));

  let middle = main.querySelector('.lab-grid, .bench-grid, .wizard');
  if (!middle) {
    const cards = loose();
    if (cards.length) {
      middle = document.createElement('div');
      middle.className = 'lab-grid';
      const left = document.createElement('section');
      const right = document.createElement('aside');
      right.className = 'panel';
      cards[0].before(middle);
      middle.append(left, right);
    }
  }
  if (middle) {
    // การ์ดที่ยังค้างอยู่นอกผัง ต้องถูกเก็บเข้าผัง ไม่งั้นจะดันหน้าให้ยาวเกินจอ
    const left  = middle.querySelector(':scope > section') || middle;
    const right = middle.querySelector(':scope > aside');
    for (const c of loose()) {
      if (right && c.dataset.pane === 'see') right.appendChild(c);
      else if (middle.classList.contains('lab-grid')) left.appendChild(c);
      else middle.appendChild(c);
    }
    if (right && !right.children.length) right.remove();
    middle.classList.add('lab-middle');
    lock();
  } else {
    console.warn('[lab-screen] หน้านี้จัดผังอัตโนมัติไม่ได้ จึงปล่อยให้เลื่อนตามปกติ');
  }

  // ---------- บรรทัดบอกว่าตอนนี้ให้ทำอะไร ----------
  const now = document.createElement('div');
  now.id = 'labNow';
  now.innerHTML = '<span class="n">1</span><span class="txt"></span><span class="hint"></span>';
  const head = main.querySelector('.r-head');
  head ? head.after(now) : main.prepend(now);

  // ---------- แถบของขั้นสูง ----------
  const advCards = [...main.querySelectorAll('[data-adv]')];
  let advBar = null;  // ใช้ใน relabel() ด้านล่างด้วย
  if (advCards.length) {
    advBar = document.createElement('div');
    advBar.id = 'advBar';
    const b = document.createElement('button');
    b.type = 'button';
    const label = (on) => t(on ? '▾ ซ่อนตั้งค่าขั้นสูง' : '▸ ตั้งค่าขั้นสูง',
                            on ? '▾ Hide advanced settings' : '▸ Advanced settings');
    b.textContent = label(false);
    b.addEventListener('click', () => {
      const on = document.body.classList.toggle('show-adv');
      b.textContent = label(on);
      try { localStorage.setItem('hr-lab-adv', on ? '1' : '0'); } catch { /* ไม่เป็นไร */ }
    });
    advBar.appendChild(b);
    now.after(advBar);
    try { if (localStorage.getItem('hr-lab-adv') === '1') { document.body.classList.add('show-adv'); b.textContent = label(true); } }
    catch { /* ไม่เป็นไร */ }
  }

  // ---------- แถบปุ่มล่างสุด ----------
  const act = document.createElement('div');
  act.id = 'labAct';
  act.innerHTML = '<button type="button" class="ghost" id="labBack"></button>'
                + '<span class="status muted"></span><span class="spacer"></span>'
                + '<button type="button" class="big" id="labGo"></button>';
  main.appendChild(act);

  const back = act.querySelector('#labBack');
  const go   = act.querySelector('#labGo');
  const stat = act.querySelector('.status');
  const relabel = () => {
    back.textContent = t('← เมนูหลัก', '← Main menu');
    const ab = advBar?.querySelector('button');
    if (ab) {
      const on = document.body.classList.contains('show-adv');
      ab.textContent = t(on ? '▾ ซ่อนตั้งค่าขั้นสูง' : '▸ ตั้งค่าขั้นสูง',
                         on ? '▾ Hide advanced settings' : '▸ Advanced settings');
    }
  };
  relabel();
  addEventListener('hr-lang-change', relabel);
  back.addEventListener('click', () => { location.href = 'menu.html'; });

  // ปุ่มลอยมุมขวาเคยทับการ์ดผลลัพธ์  ย้ายมาอยู่ในแถบล่าง จะได้ไม่บังอะไรเลย
  const adopt = () => {
    const hud = document.getElementById('hrHud') || document.querySelector('.hr-hud');
    if (hud && hud.parentElement !== act) {
      hud.classList.add('in-bar');
      act.insertBefore(hud, act.querySelector('.spacer'));
    }
    const lang = document.getElementById('i18nToggle');
    if (lang && lang.parentElement !== act) { lang.classList.add('in-bar'); act.insertBefore(lang, act.querySelector('.spacer')); }
  };
  adopt(); setTimeout(adopt, 400); setTimeout(adopt, 1500);

  let goHandler = null;
  go.addEventListener('click', () => { if (goHandler) goHandler(); });

  // ---------- หน้าแลปเรียกใช้ตัวนี้เพื่อบอกว่าอยู่ขั้นไหน ----------
  // step({ n, say, hint, button, onClick, enabled, done, status })
  window.labScreen = {
    step(o = {}) {
      if (o.n != null) now.querySelector('.n').textContent = String(o.n);
      if (o.say != null) now.querySelector('.txt').textContent = o.say;
      if (o.hint != null) now.querySelector('.hint').textContent = o.hint;
      if (o.status != null) stat.textContent = o.status;
      if (o.button != null) go.textContent = o.button;
      if (o.onClick !== undefined) goHandler = o.onClick;
      if (o.enabled !== undefined) go.disabled = !o.enabled;
      if (o.done !== undefined) go.classList.toggle('done', !!o.done);
    },
    // ผูกปุ่มเดิมที่อยู่ในหน้า ให้ปุ่มใหญ่ด้านล่างกดแทนได้ โดยไม่ต้องแก้ตรรกะเดิม
    proxy(selector, label, opt = {}) {
      const src = document.querySelector(selector);
      if (!src) return false;
      this.step({ button: label, onClick: () => src.click(), enabled: !src.disabled, ...opt });
      return true;
    },
    busy(on, label) {
      go.disabled = !!on;
      if (label) stat.textContent = label;
    },
  };

  // เตือนถ้าเนื้อหายังล้นจอ จะได้รู้ตั้งแต่ตอนพัฒนา ไม่ใช่ไปเจอตอนเก็บข้อมูลจริง
  addEventListener('load', () => {
    requestAnimationFrame(() => {
      const over = document.documentElement.scrollHeight - window.innerHeight;
      if (over > 4) console.warn('[lab-screen] เนื้อหายังล้นจอ ' + over + ' px — ต้องย่อการ์ดหรือใส่ data-adv เพิ่ม');
    });
  });
}
