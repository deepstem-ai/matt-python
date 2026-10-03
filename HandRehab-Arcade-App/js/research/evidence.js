// ============================================================
// evidence.js — แดชบอร์ดหลักฐาน (Lab 37) · evidence.html
// 1) อ่านรายการจาก docs/research/evidence/checklist.json (ไฟล์เดียวกับที่สคริปต์ .ps1/.sh ใช้)
// 2) ผู้ใช้ลากไฟล์มาวาง → เทียบชื่อไฟล์กับรูปแบบ → ติ๊กรายการที่มี
// 3) CSV ที่รู้จัก → คำนวณตัวเลข → สร้างแถว SUMMARY.md (ไม่มีไฟล์ = เว้นว่าง ห้ามเดา)
// 4) แอปรวม: ปุ่ม "อ่านจากฐานข้อมูลของแอปนี้" แปลงข้อมูลใน IndexedDB เป็น CSV เสมือน (app-db-csv.js)
//    ข้อมูลจากฐานข้อมูลนับเป็นตัวเลขใน SUMMARY ได้ แต่ไม่ติ๊ก CHECKLIST (หลักฐานต้องเป็นไฟล์จริงในโฟลเดอร์ evidence)
// ============================================================
import { applyPrefs, toast, downloadText, esc } from '../ui.js';
import { analyze, summaryRows, summaryMarkdown, fmt } from './csv-kit.js';
import { readAppDatabase, reportText } from './app-db-csv.js';
applyPrefs();

const $ = (id) => document.getElementById(id);
let LIST = null;
const files = new Map();     // ชื่อไฟล์ → File (ชื่อซ้ำ = ใช้ไฟล์ล่าสุด)
const results = new Map();   // ชื่อไฟล์ → ผลวิเคราะห์ CSV

// แปลงรูปแบบ *.png (wildcard) เป็น RegExp ไม่สนตัวพิมพ์
const globRe = (g) => new RegExp('^' + g.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$', 'i');
const baseName = (p) => p.split('/').pop();

// ไฟล์ไหนตรงกับรายการนี้ (ชื่อเป้าหมายตรง ๆ หรือตรงรูปแบบ) — ไฟล์ DEMO- ไม่นับเป็นหลักฐาน
function matchesFor(item) {
  const target = baseName(item.target);
  const tBase = target.replace(/\.[^.]+$/, '');
  const res = [...item.patterns.map(globRe)];
  if (target) res.unshift(item.keepExt ? new RegExp('^' + tBase.replace(/[-.]/g, '\\$&') + '\\.[^.]+$', 'i') : globRe(target));
  return [...files.keys()].filter((n) => !/^DEMO-/i.test(n) && res.some((r) => r.test(n)));
}

function render() {
  if (!LIST) return;
  const state = LIST.items.map((it) => {
    const m = matchesFor(it), need = it.multi ? it.min || 1 : 1;
    return { ...it, found: m, ok: m.length >= need, need };
  });
  const ok = state.filter((s) => s.ok).length;
  $('totalChip').innerHTML = `มีแล้ว <b>${ok}</b> / ${state.length}`;
  $('totalChip').className = 'chip ' + (ok === state.length ? 'ok' : 'warn');
  $('totalBar').style.width = (ok / state.length) * 100 + '%';
  // การ์ดแต่ละกลุ่ม
  $('groups').innerHTML = LIST.groups.map((g) => {
    const rows = state.filter((s) => s.group === g.id), k = rows.filter((s) => s.ok).length;
    return `<div class="card-neon gcard"><div class="card-head"><span class="card-icon">${['📸', '📊', '🎬', '📄', '💻'][g.id - 1]}</span><h3 class="card-title">${g.id}. ${esc(g.th)}</h3></div>
      <div class="row"><span class="chip ${k === rows.length ? 'ok' : 'warn'}"><b>${k}/${rows.length}</b></span><span class="muted">${esc(g.chapter)}</span></div>
      <div class="bar"><i style="width:${(k / rows.length) * 100}%"></i></div>
      <ul class="items">${rows.map((s) => `<li class="${s.ok ? 'ok' : 'miss'}">${s.ok ? '✅' : '⬜'} <span><code>${esc(baseName(s.target) || s.patterns[0])}</code>${s.multi ? ` (${s.found.length}/${s.need})` : ''}<br><span class="muted">${esc(s.th)}</span></span></li>`).join('')}</ul></div>`;
  }).join('');
  const miss = state.filter((s) => !s.ok);
  $('missing').innerHTML = miss.length ? miss.map((s) => `<li><code>evidence/${esc(s.target)}</code>${s.multi ? ` (มี ${s.found.length}/${s.need} ไฟล์ รูปแบบ ${esc(s.patterns[0])})` : ''} — ${esc(s.th)} · <b>กลับไป Lab ${String(s.lab).padStart(2, '0')}</b></li>`).join('')
    : '<li class="muted">ครบทุกรายการแล้ว 🎉</li>';
  renderAnalyses();
}

function renderAnalyses() {
  const list = [...results.values()];
  $('analyses').innerHTML = list.length ? list.map((r) => `<div class="card-neon an-card">
      <h3>${esc(r.file)} ${r.demo ? '<span class="demo-tag">(DEMO — ห้ามใช้ในรายงาน)</span>' : ''}${r.source === 'db' ? ' <span class="db-tag">🗄️ จากฐานข้อมูลแอป</span>' : ''}</h3>
      <div class="muted">${esc(r.label)} · ${r.rows} แถว · วันที่วัด ${esc(r.date)}</div>
      ${r.note ? `<div class="muted">ℹ️ ${esc(r.note)}</div>` : ''}
      ${r.warning ? `<div class="alert warn" style="padding:var(--sp-2);margin-top:var(--sp-2)">${esc(r.warning)}</div>` : ''}
      ${r.metrics.length ? `<ul>${r.metrics.map((m) => `<li>${esc(m.label)}: <b>${esc(m.text)}</b></li>`).join('')}</ul>`
        : `<p class="muted">ไม่รู้จักรูปแบบคอลัมน์: ${esc(r.headers.slice(0, 8).join(', '))} — ตรวจว่า export จากแลปที่ถูกต้อง</p>`}
      ${r.tables.perLighting ? `<div class="muted">แสง: ${r.tables.perLighting.map((x) => `${esc(x.lighting)} ${fmt(x.accuracy, 1)}%`).join(' · ')}</div>` : ''}
    </div>`).join('') : '<p class="muted">ยังไม่มี CSV — ลากไฟล์ CSV ที่ export จากแลปต่าง ๆ มาวาง</p>';
  const rows = summaryRows(list);
  $('sumTable').innerHTML = `<thead><tr><th>ตัวชี้วัด</th><th>ค่า</th><th>ไฟล์ที่มา</th><th>วันที่วัด</th><th>หมายเหตุ</th></tr></thead><tbody>${rows.map((r) =>
    `<tr><td>${esc(r.th)}</td><td><b>${esc(r.value)}</b></td><td>${esc(r.file)}${/^DEMO-/i.test(r.file) ? ' <span class="demo-tag">DEMO</span>' : ''}</td><td>${esc(r.date)}</td><td class="muted">${esc(r.missing)}</td></tr>`).join('')}</tbody>`;
  $('md').textContent = summaryMarkdown(rows);
}

// ---------- รับไฟล์ ----------
async function addFiles(fileList) {
  let n = 0;
  for (const f of fileList) {
    if (f.name.startsWith('.')) continue;
    files.set(f.name, f); n++;
    if (/\.csv$/i.test(f.name)) {
      try { results.set(f.name, analyze(await f.text(), f)); }
      catch (e) { toast(`อ่าน ${f.name} ไม่ได้: ${e.message}`, 'error', 6); }
    }
  }
  toast(`รับไฟล์ ${n} ไฟล์`);
  render();
}
$('files').onchange = (e) => addFiles(e.target.files);
$('folder').onchange = (e) => addFiles(e.target.files);
const drop = $('drop');
['dragenter', 'dragover'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add('over'); }));
['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
drop.addEventListener('drop', (e) => addFiles(e.dataTransfer.files));
$('reset').onclick = () => { files.clear(); results.clear(); $('dbInfo').classList.add('hidden'); render(); };

// ---------- อ่านจากฐานข้อมูลของแอปนี้ (ไม่ต้อง export) ----------
$('fromDb').onclick = async () => {
  try {
    const { files: list, report } = await readAppDatabase();
    for (const k of [...results.keys()]) if (results.get(k).source === 'db') results.delete(k); // อ่านซ้ำ = แทนของเดิม
    for (const f of list) results.set(f.name, { ...analyze(f.text, { name: f.name, lastModified: Date.now() }), source: 'db', note: f.note });
    $('dbInfo').classList.remove('hidden');
    $('dbInfo').textContent = `🗄️ อ่านจากฐานข้อมูลของเครื่องนี้: ${reportText(report)} → ได้ ${list.length} ชุดข้อมูล (ชุดที่ขึ้นต้น DEMO- คือข้อมูลตัวอย่าง/จำลอง)`;
    toast(list.length ? `อ่านข้อมูลจากแอปได้ ${list.length} ชุด` : 'ฐานข้อมูลยังไม่มีผลการวัด — ไปเล่นเกม / ทดสอบ / วัดผล ก่อน', list.length ? 'success' : 'warning', 5);
    render();
  } catch (e) { toast('อ่านฐานข้อมูลไม่ได้: ' + e.message, 'error', 6); }
};

// ไฟล์ตัวอย่าง: ดึงจากโฟลเดอร์ samples/ (ชื่อขึ้นต้น DEMO- ไม่ถูกนับเป็นหลักฐาน)
const SAMPLES = ['DEMO-lab15-face-login.csv', 'DEMO-lab21-rep-test.csv', 'DEMO-lab27-filters.csv', 'DEMO-lab28-sessions.csv', 'DEMO-lab32-evaluation.csv', 'DEMO-lab33-benchmark.csv', 'DEMO-lab36-survey-responses.csv', 'DEMO-lab36-task-results.csv'];
$('demo').onclick = async () => {
  try {
    const list = await Promise.all(SAMPLES.map(async (n) => { const r = await fetch('docs/research/samples/' + n); if (!r.ok) throw new Error(n); return new File([await r.text()], n, { lastModified: Date.now() }); }));
    await addFiles(list);
    toast('โหลดไฟล์ตัวอย่างแล้ว — ตัวเลข DEMO ห้ามใช้ในรายงาน', 'warning', 5);
  } catch (e) { toast('โหลดไฟล์ตัวอย่างไม่ได้ (' + e.message + ') เปิดผ่าน start.bat หรือยัง?', 'error', 6); }
};

// คัดลอก / ดาวน์โหลด
$('copy').onclick = async () => {
  try { await navigator.clipboard.writeText($('md').textContent); toast('คัดลอกแล้ว วางใน evidence/SUMMARY.md ได้เลย'); }
  catch { toast('คัดลอกอัตโนมัติไม่ได้ ให้ลากเลือกข้อความในกล่องด้านล่างแล้วกด Ctrl+C', 'warning', 6); }
};
$('dl').onclick = () => downloadText('SUMMARY-auto.md', `# SUMMARY (สร้างอัตโนมัติ ${new Date().toISOString().slice(0, 10)})\n\n${$('md').textContent}\n`, 'text/markdown');

// ---------- โหลดรายการ ----------
async function loadList() {
  try {
    const r = await fetch('docs/research/evidence/checklist.json');
    if (!r.ok) throw new Error('HTTP ' + r.status);
    LIST = await r.json();
    $('loadErr').classList.add('hidden');
    render();
  } catch (e) {
    $('loadErr').classList.remove('hidden');
    $('loadErr').innerHTML = `โหลดรายการหลักฐาน (docs/research/evidence/checklist.json) ไม่ได้: ${esc(e.message)}<br>ต้องเปิดผ่าน start.bat / start.sh ไม่ใช่ดับเบิลคลิกไฟล์ <button class="btn-glow small" id="retry">ลองใหม่</button>`;
    $('retry').onclick = loadList;
  }
}
loadList();
