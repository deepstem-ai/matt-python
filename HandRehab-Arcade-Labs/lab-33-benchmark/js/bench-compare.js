// ============================================================
// bench-compare.js — เปรียบเทียบผลหลายเครื่อง: กราฟแท่ง ตาราง CSV PNG (Lab 33 ข้อ 5)
// ข้อมูลอยู่ใน IndexedDB store 'benchmarks' ของเครื่องนี้
// ผลของเพื่อนเครื่องอื่น: ให้เพื่อนกด "ส่งออกไฟล์ผล" แล้วนำไฟล์ .json มา "นำเข้า" ที่เครื่องนี้
// ============================================================
import { getAll, put, del } from './db.js';
import { barChart } from './charts.js';
import { downloadCSV, downloadText, saveCanvasPNG, esc, toast, modal } from './ui.js';
import { SCENARIOS, FPS_TARGET, fpsPass, fpsVerdict } from './bench-runner.js';

const $ = (id) => document.getElementById(id);
let records = [];

export async function loadRecords() {
  records = (await getAll('benchmarks')).sort((a, b) => a.createdAt - b.createdAt);
  return records;
}

// ค่าที่เลือกดูของแต่ละเครื่อง (เช่น game.avgFps)
const pick = (r, sc, metric) => r.results?.[sc]?.[metric] ?? 0;

export async function drawCompare() {
  try { await loadRecords(); }
  catch (e) {
    $('cmpInfo').innerHTML = `<span class="alert">อ่านฐานข้อมูลไม่ได้: ${esc(e.message)}</span> <button class="btn-glow small" id="cmpRetry">↻ ลองใหม่</button>`;
    $('cmpRetry').onclick = drawCompare; return;
  }
  const sc = $('cmpScenario').value, metric = $('cmpMetric').value;
  const scTh = SCENARIOS.find((s) => s.key === sc)?.th || sc;
  const mTh = { avgFps: 'FPS เฉลี่ย', minFps: 'FPS ต่ำสุด', msPerFrame: 'ms ต่อเฟรม' }[metric];
  $('cmpInfo').textContent = records.length
    ? `มีผล ${records.length} เครื่อง${records.length < 5 ? ` — ต้องเก็บอย่างน้อย 5 เครื่อง (ขาดอีก ${5 - records.length})` : ' ✔ ครบ 5 เครื่องแล้ว'}`
    : 'ยังไม่มีผล กดเริ่มทดสอบด้านบน แล้วผลจะมาแสดงที่นี่';
  barChart($('cmpChart'), records.map((r) => ({ label: r.machine, value: pick(r, sc, metric) })), {
    title: `${scTh} — ${mTh}`, yLabel: mTh, xLabel: 'เครื่อง', emptyText: 'ยังไม่มีผลทดสอบ',
  });
  $('cmpTable').innerHTML = '<tr><th>เครื่อง</th><th>ระดับ</th><th>CPU</th><th>RAM</th><th>การ์ดจอ</th>' +
    SCENARIOS.map((s) => `<th>${s.icon} FPS</th>`).join('') + `<th>FPS ≥ ${FPS_TARGET}</th><th>แนะนำ</th><th></th></tr>` +
    records.map((r) => `<tr><td><b>${esc(r.machine)}</b><br><small class="muted">${new Date(r.createdAt).toLocaleString('th-TH')}</small></td>
      <td>${esc(r.device?.tierTh || '')}</td><td class="num">${r.device?.cores || '?'}</td><td class="num">${r.device?.memory || '?'}</td>
      <td><small>${esc((r.device?.gpuRenderer || '').slice(0, 40))}</small></td>
      ${SCENARIOS.map((s) => `<td class="num">${r.results?.[s.key]?.skipped ? '—' : pick(r, s.key, 'avgFps')}</td>`).join('')}
      <td>${(() => { const v = fpsVerdict(r.results); return v.tested ? `<span class="pf ${v.pass ? 'pass' : 'fail'}">${v.pass ? 'PASS' : 'FAIL'}</span> <small>${v.passed}/${v.tested}</small>` : '—'; })()}</td>
      <td><small>${esc(r.recommendation?.style || '')} · ${esc(r.recommendation?.resolution || '')}</small></td>
      <td><button class="btn-glow ghost small" data-del="${esc(r.id)}" title="ลบผลนี้">🗑 ลบ</button></td></tr>`).join('');
}

// แถว CSV: หนึ่งเครื่องต่อหนึ่งแถว (ใส่สเปกด้วย เพื่อวิเคราะห์ว่าอะไรมีผลต่อความลื่นที่สุด)
export function csvRows() {
  return records.map((r) => {
    const row = { machine: r.machine, date: new Date(r.createdAt).toISOString(), tier: r.device?.tier, cores: r.device?.cores,
      memoryGB: r.device?.memory, gpu: r.device?.gpuRenderer, gpuClass: r.device?.gpuClass, secondsPerScenario: r.seconds, resolution: r.resolution };
    for (const s of SCENARIOS) {
      const x = r.results?.[s.key] || {};
      row[s.key + '_avgFps'] = x.skipped ? '' : x.avgFps; row[s.key + '_minFps'] = x.skipped ? '' : x.minFps; row[s.key + '_ms'] = x.skipped ? '' : x.msPerFrame;
    }
    const v = fpsVerdict(r.results); row.fps_target = FPS_TARGET; row.fps_pass_overall = v.tested ? (v.pass ? 'PASS' : 'FAIL') : '';
    for (const s of SCENARIOS) { const x = r.results?.[s.key]; row[s.key + '_pass25'] = !x || x.skipped ? '' : (fpsPass(x.avgFps) ? 'PASS' : 'FAIL'); }
    row.recommend = r.recommendation?.text || '';
    return row;
  });
}

export function bindCompare() {
  $('cmpScenario').innerHTML = SCENARIOS.map((s) => `<option value="${s.key}" ${s.key === 'game' ? 'selected' : ''}>${s.icon} ${s.th}</option>`).join('');
  $('cmpScenario').onchange = drawCompare; $('cmpMetric').onchange = drawCompare;
  $('btnCsv').onclick = () => { if (!records.length) return toast('ยังไม่มีผล', 'warning'); const rows = csvRows(); downloadCSV('benchmark-compare.csv', rows, Object.keys(rows[0])); };
  $('btnPng').onclick = () => saveCanvasPNG($('cmpChart'), 'benchmark-compare.png');
  $('btnExport').onclick = () => {
    if (!records.length) return toast('ยังไม่มีผล', 'warning');
    downloadText(`benchmarks-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ app: 'handrehab-benchmarks', records }, null, 1), 'application/json');
  };
  $('btnImport').onclick = () => $('importFile').click();
  $('importFile').onchange = async () => {
    const f = $('importFile').files[0]; $('importFile').value = '';
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      const list = Array.isArray(data) ? data : data.records;
      if (!Array.isArray(list)) throw new Error('ไม่ใช่ไฟล์ผลทดสอบของแอปนี้');
      let n = 0;
      for (const r of list) if (r?.id && r.machine && r.results) { await put('benchmarks', r); n++; }
      toast(`นำเข้าผล ${n} เครื่องแล้ว`, 'success');
      drawCompare();
    } catch (e) { modal(`<h2>⚠️ นำเข้าไม่สำเร็จ</h2><p>${esc(e.message)}</p>`); }
  };
  $('cmpTable').onclick = async (e) => {
    const id = e.target.closest('[data-del]')?.dataset.del;
    if (!id) return;
    const r = records.find((x) => x.id === id);
    if (await modal(`<h2>ลบผลของ "${esc(r?.machine)}"?</h2><p>ลบแล้วกู้คืนไม่ได้ (ยกเว้นมีไฟล์ที่ส่งออกไว้)</p>`, [{ label: 'ยกเลิก', value: false, cls: 'ghost' }, { label: '🗑 ลบ', value: true, cls: 'danger' }])) {
      await del('benchmarks', id); drawCompare();
    }
  };
  window.addEventListener('resize', () => drawCompare());
}
