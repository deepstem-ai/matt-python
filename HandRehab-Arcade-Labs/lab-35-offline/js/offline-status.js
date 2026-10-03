// ============================================================
// offline-status.js — ป้ายสถานะมุมจอ + หน้าต่างตรวจไฟล์ (Lab 35)
//  ป้าย: 🌐 ออนไลน์ / 📴 ออฟไลน์ (ใช้ไฟล์ในเครื่อง) · ไฟล์ในเครื่องครบกี่ไฟล์ · ถ้าขาดจะบอกชื่อไฟล์
//  กดที่ป้าย: รายการไฟล์ที่จำเป็นทุกไฟล์ + สถานะ + แถบความคืบหน้า + ปุ่ม "ตรวจทุกไฟล์" (โหลดจริงเพื่อเช็กขนาด)
//  ตรวจเองตอนเปิดแอป ถ้าขาดไฟล์จะเตือนล่วงหน้า (เตือนครั้งเดียวต่อการเปิดเบราว์เซอร์)
// ============================================================
import { ASSETS, checkAll, probeLocal } from './assets.js';
import { modal, toast, esc } from './ui.js';

const GROUP_TH = { lib: '📚 ไลบรารี AI', model: '🧠 โมเดล', font: '🔤 ฟอนต์' };
const mb = (n) => (n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB');
let badge = null, last = [];

function paint() {
  if (!badge) return;
  const online = navigator.onLine;
  const missing = last.filter((f) => !f.ok);
  const total = last.length;
  const all = total && !missing.length;
  badge.className = 'net-badge ' + (all ? 'ok' : online ? 'warn' : 'bad');
  const net = online ? '🌐 ออนไลน์' : '📴 ออฟไลน์ · ใช้ไฟล์ในเครื่อง';
  const files = !total ? 'กำลังตรวจไฟล์…' : all ? `✔ ไฟล์ในเครื่องครบ ${total}/${total}` : `⚠ ขาด ${missing.length} ไฟล์: ${missing.slice(0, 2).map((f) => f.name).join(', ')}${missing.length > 2 ? '…' : ''}`;
  badge.innerHTML = `<b>${net}</b><span>${esc(files)}</span>`;
  badge.title = all ? 'ทำงานได้โดยไม่ต้องใช้อินเทอร์เน็ต' : 'กดเพื่อดูว่าขาดไฟล์อะไร และวิธีเตรียม';
}

async function refresh(force = false) { last = await checkAll(force); paint(); return last; }

// โหลดไฟล์จริงเพื่อตรวจขนาด พร้อมแถบความคืบหน้ารายไฟล์
async function deepCheck(box) {
  const rows = [];
  for (const name of Object.keys(ASSETS).filter((k) => ASSETS[k].group !== 'dir')) {
    const a = ASSETS[name], el = box.querySelector(`[data-file="${name}"]`);
    const bar = el.querySelector('.bar > i'), st = el.querySelector('.st');
    st.textContent = 'กำลังตรวจ…';
    let ok = false, got = 0;
    try {
      const res = await fetch(a.local, { cache: 'no-store' });
      if (res.ok) {
        const total = Number(res.headers.get('content-length')) || 0;
        const reader = res.body.getReader();
        for (;;) { const { done, value } = await reader.read(); if (done) break; got += value.length; if (total) bar.style.width = (got / total) * 100 + '%'; }
        ok = got >= a.minBytes;
      }
    } catch { /* ไม่มีไฟล์ */ }
    bar.style.width = '100%';
    el.className = 'file-row ' + (ok ? 'ok' : 'bad');
    st.textContent = ok ? `✔ ${mb(got)}` : got ? `✖ เล็กผิดปกติ (${mb(got)})` : '✖ ไม่มีในเครื่อง';
    rows.push({ name, ok });
  }
  await refresh(true);
  const bad = rows.filter((r) => !r.ok).length;
  box.querySelector('#deepSum').innerHTML = bad
    ? `<div class="alert warn">⚠ ขาด/เสีย ${bad} ไฟล์ — ต่ออินเทอร์เน็ตแล้วรัน <b>tools\\download-assets.ps1</b> (Windows) หรือ <b>bash tools/download-assets.sh</b> (Mac/Linux) ดูวิธีใน docs/OFFLINE.md</div>`
    : '<div class="alert ok">✔ ครบทุกไฟล์ ขนาดถูกต้อง พร้อมใช้งานแบบไม่มีอินเทอร์เน็ต</div>';
}

export async function openPanel() {
  await refresh();
  const list = last.map((f) => `<div class="file-row ${f.ok ? 'ok' : 'bad'}" data-file="${esc(f.name)}">
      <span class="g">${GROUP_TH[f.group] || ''}</span><span><b>${esc(f.th)}</b><br><small class="muted">${esc(f.local)}</small></span>
      <div class="bar"><i style="width:${f.ok ? 100 : 0}%"></i></div><span class="st">${f.ok ? '✔ ' + (f.size ? mb(f.size) : 'มี') : '✖ ' + esc(f.reason || 'ไม่มี')}</span></div>`).join('');
  const p = modal(`<h2>📦 ไฟล์สำหรับใช้งานออฟไลน์</h2>
    <p>ตอนนี้: <b>${navigator.onLine ? '🌐 ออนไลน์' : '📴 ออฟไลน์'}</b> · แอปจะหาไฟล์ในเครื่องก่อน ถ้าไม่มีจึงโหลดจากอินเทอร์เน็ต</p>
    <div class="file-list">${list}</div><div id="deepSum" style="margin-top:12px"></div>`,
  [{ label: '🔍 ตรวจทุกไฟล์ (โหลดจริง)', value: 'deep', cls: 'success' }, { label: 'ปิด', value: 'close', cls: 'ghost' }]);
  // ปุ่ม "ตรวจทุกไฟล์" ไม่ปิดหน้าต่าง: ดักคลิกก่อน modal จะปิด
  const back = [...document.querySelectorAll('.modal-back')].pop();
  const deepBtn = back?.querySelector('.btn-glow.success');
  if (deepBtn) {
    const clone = deepBtn.cloneNode(true); deepBtn.replaceWith(clone);
    clone.onclick = async () => { clone.disabled = true; await deepCheck(back); clone.disabled = false; };
  }
  return p;
}

export async function initOfflineStatus() {
  const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'css/offline.css'; document.head.appendChild(css);
  badge = document.createElement('button');
  badge.type = 'button'; badge.className = 'net-badge'; badge.setAttribute('aria-live', 'polite');
  badge.onclick = openPanel;
  document.body.appendChild(badge);
  paint();
  addEventListener('online', paint); addEventListener('offline', paint);
  await refresh();
  // เตือนล่วงหน้าตอนเปิดแอป ถ้าไฟล์ไม่ครบ (ครั้งเดียวต่อการเปิดเบราว์เซอร์)
  const missing = last.filter((f) => !f.ok);
  let warned = false; try { warned = !!sessionStorage.getItem('hr-assets-warned'); sessionStorage.setItem('hr-assets-warned', '1'); } catch { /* ไม่เป็นไร */ }
  if (missing.length && !warned) toast(`ยังไม่มีไฟล์ออฟไลน์ ${missing.length} ไฟล์ ตอนนี้ต้องใช้อินเทอร์เน็ต (กดป้ายมุมซ้ายล่างเพื่อดู)`, navigator.onLine ? 'warning' : 'error', 6);
  return last;
}
export { probeLocal };
