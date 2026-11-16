// ============================================================
// study.js — หน้าควบคุมการเก็บข้อมูลความถูกต้องของการนับ
//
// หน้าที่ของหน้านี้มีสามอย่างเท่านั้น
//   1. ตั้งรหัสผู้เข้าร่วมกับระดับแสง แล้วส่งไปเปิดเกมในโหมดเก็บข้อมูล
//   2. แสดงผลที่เก็บมาแล้ว พร้อมสรุปความถูกต้องแยกตามระดับแสง
//   3. ดาวน์โหลดเป็นไฟล์ CSV ไฟล์เดียว เอาไปส่งต่อได้เลย
//
// ไม่เก็บชื่อจริงของใคร ใช้รหัส P01 P02 ตามหลัก PDPA
// ============================================================

const KEY = 'hr-study-v1';
const $ = (id) => document.getElementById(id);

const L = () => (document.documentElement.lang === 'en' ? 'en' : 'th');
const t = (th, en) => (L() === 'en' ? en : th);

const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } };
const save = (r) => { try { localStorage.setItem(KEY, JSON.stringify(r)); return true; } catch { return false; } };

// ---------- สรุปตัวเลข ----------
// ความถูกต้องของการนับ ใช้นิยามเดียวกับที่บทความจะรายงาน
//   absolute error  = |ระบบ − ผู้สังเกต|  ต่อหนึ่งบล็อก
//   accuracy %      = 1 − (ผลรวม |ต่าง|) / (ผลรวมที่ผู้สังเกตนับได้)
function summarise(rows) {
  if (!rows.length) return null;
  const sysSum = rows.reduce((a, r) => a + r.systemCount, 0);
  const obsSum = rows.reduce((a, r) => a + r.observerCount, 0);
  const errSum = rows.reduce((a, r) => a + r.absError, 0);
  const exact = rows.filter((r) => r.absError === 0).length;
  return {
    blocks: rows.length,
    sysSum, obsSum, errSum, exact,
    mae: errSum / rows.length,
    accPct: obsSum > 0 ? Math.max(0, 1 - errSum / obsSum) * 100 : NaN,
    exactPct: (exact / rows.length) * 100,
  };
}

const f1 = (x) => (Number.isFinite(x) ? x.toFixed(1) : '—');
const f2 = (x) => (Number.isFinite(x) ? x.toFixed(2) : '—');

function render() {
  const rows = load();
  const all = summarise(rows);

  // ---- สรุปรวม ----
  $('sum').innerHTML = !all ? `<p class="muted">${t('ยังไม่มีข้อมูล เริ่มบล็อกแรกได้เลย', 'No data yet. Start your first block.')}</p>` : `
    <div class="bigrow">
      <div><span>${t('จำนวนบล็อก', 'blocks')}</span><b>${all.blocks}</b></div>
      <div><span>${t('ระบบนับรวม', 'system total')}</span><b>${all.sysSum}</b></div>
      <div><span>${t('ผู้สังเกตนับรวม', 'observer total')}</span><b>${all.obsSum}</b></div>
      <div><span>${t('ความถูกต้อง', 'accuracy')}</span><b>${f1(all.accPct)}%</b></div>
      <div><span>${t('คลาดเคลื่อนเฉลี่ยต่อบล็อก', 'mean abs. error')}</span><b>${f2(all.mae)}</b></div>
      <div><span>${t('บล็อกที่ตรงเป๊ะ', 'exact blocks')}</span><b>${all.exact}/${all.blocks}</b></div>
    </div>`;

  // ---- แยกตามระดับแสง ----
  const lights = [...new Set(rows.map((r) => r.light))].sort();
  $('byLight').innerHTML = !rows.length ? '' : `
    <table class="data">
      <tr><th>${t('ระดับแสง', 'light')}</th><th>${t('บล็อก', 'blocks')}</th>
          <th>${t('ระบบ', 'system')}</th><th>${t('ผู้สังเกต', 'observer')}</th>
          <th>${t('ความถูกต้อง %', 'accuracy %')}</th><th>${t('คลาดเคลื่อนเฉลี่ย', 'mean abs. err')}</th></tr>
      ${lights.map((lv) => {
        const s = summarise(rows.filter((r) => r.light === lv));
        return `<tr><td>${lv}</td><td class="n">${s.blocks}</td><td class="n">${s.sysSum}</td>
                <td class="n">${s.obsSum}</td><td class="n">${f1(s.accPct)}</td><td class="n">${f2(s.mae)}</td></tr>`;
      }).join('')}
    </table>`;

  // ---- ตารางรายบล็อก ----
  $('tbl').innerHTML = !rows.length ? '' : `
    <table class="data">
      <tr><th>#</th><th>${t('ผู้เข้าร่วม', 'participant')}</th><th>${t('แสง', 'light')}</th>
          <th>${t('ระบบ', 'system')}</th><th>${t('ผู้สังเกต', 'observer')}</th>
          <th>${t('ต่าง', 'diff')}</th><th>${t('วินาที', 'secs')}</th><th></th></tr>
      ${rows.map((r, i) => `<tr>
        <td class="n">${i + 1}</td><td>${r.participant}</td><td>${r.light}</td>
        <td class="n">${r.systemCount}</td><td class="n">${r.observerCount}</td>
        <td class="n"${r.absError ? ' style="color:var(--danger,#b91c1c);font-weight:700"' : ''}>${r.absError}</td>
        <td class="n">${r.seconds ?? ''}</td>
        <td><button class="btn-glow ghost small" data-del="${r.id}">${t('ลบ', 'delete')}</button></td>
      </tr>`).join('')}
    </table>`;

  $('tbl').querySelectorAll('[data-del]').forEach((b) => {
    b.onclick = () => {
      if (!confirm(t('ลบบล็อกนี้ออกจากข้อมูลหรือไม่', 'Remove this block from the data?'))) return;
      save(load().filter((r) => r.id !== b.dataset.del));
      render();
    };
  });

  $('csv').disabled = !rows.length;
  $('wipe').disabled = !rows.length;
}

// ---------- เริ่มบล็อก ----------
$('start').onclick = () => {
  const p = ($('pid').value || '').trim();
  if (!/^P\d{2,3}$/i.test(p)) {
    alert(t('ใส่รหัสผู้เข้าร่วมเป็น P แล้วตามด้วยตัวเลข เช่น P01 ห้ามใส่ชื่อจริง',
            'Use a code like P01. Do not enter a real name.'));
    $('pid').focus(); return;
  }
  const q = new URLSearchParams({
    study: '1', p: p.toUpperCase(), light: $('light').value, target: $('target').value,
  });
  location.href = 'star-portal.html?' + q.toString();
};

// ---------- ดาวน์โหลดไฟล์เดียว ----------
$('csv').onclick = () => {
  const rows = load();
  const cols = ['participant', 'light', 'block', 'systemCount', 'observerCount',
                'absError', 'targetReps', 'seconds', 'startedAt', 'endedAt'];
  const esc = (v) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const body = [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
  const blob = new Blob(['﻿' + body], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'study-count-accuracy.csv';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
};

$('wipe').onclick = () => {
  if (!confirm(t('ลบข้อมูลที่เก็บไว้ทั้งหมดในเครื่องนี้หรือไม่ ทำแล้วย้อนไม่ได้',
                 'Delete all data stored in this browser? This cannot be undone.'))) return;
  save([]); render();
};

addEventListener('hr-lang-change', render);
render();
