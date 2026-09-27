// ============================================================
// eval-view.js — วาดผลการวัด: ตารางความสับสน (HTML + รูป PNG), ตารางตัวชี้วัด, คำอธิบายภาษาไทย (Lab 32)
// ห้ามแตะ: กล้อง ฐานข้อมูล
// ============================================================
import { esc, cssVar } from './ui.js';

const pct = (v) => (v == null ? '-' : (v * 100).toFixed(1) + '%');

// ตารางความสับสนแบบกดได้: แถว = ท่าที่ขอ, คอลัมน์ = ท่าที่ระบบตรวจได้
// สีช่อง: แนวทแยง (ถูก) = เขียว, นอกแนวทแยง (ผิด) = แดง ยิ่งจำนวนมากยิ่งเข้ม
export function renderGrid(el, cm, nameOf) {
  const max = Math.max(1, ...cm.m.flat());
  const cell = (i, j) => {
    const v = cm.m[i][j];
    const tone = i === j ? '--success' : '--error';
    const mix = v ? Math.round(15 + (70 * v) / max) : 0;
    const bg = v ? `background: color-mix(in srgb, var(${tone}) ${mix}%, var(--card))` : '';
    return `<td><button class="cm-cell ${i === j ? 'diag' : 'off'}" style="${bg}" data-r="${i}" data-c="${j}" aria-label="ขอ ${esc(nameOf(cm.rows[i]))} ตรวจได้ ${esc(nameOf(cm.cols[j]))}: ${v} ครั้ง">${v}</button></td>`;
  };
  el.innerHTML = `<thead><tr><th class="corner">ขอ ↓ / ตรวจได้ →</th>${cm.cols.map((c) => `<th>${esc(nameOf(c))}</th>`).join('')}<th>รวม</th></tr></thead><tbody>` +
    cm.rows.map((r, i) => `<tr><th>${esc(nameOf(r))}</th>${cm.cols.map((_, j) => cell(i, j)).join('')}<td class="num">${cm.m[i].reduce((a, b) => a + b, 0)}</td></tr>`).join('') + '</tbody>';
}

// รายการตัวอย่างในช่องที่กด (ช่องนอกแนวทแยง = ตัวอย่างที่ผิด)
// list = ครั้งทดสอบที่อยู่ในช่องนี้ (หน้าหลักคัดมาให้แล้ว)
export function renderCellDetail(el, list, requested, detected, nameOf, CONDITION_TH) {
  const wrong = requested !== detected;
  el.innerHTML = `<h4>${wrong ? '❌ ตัวอย่างที่ผิด' : '✅ ตัวอย่างที่ถูก'}: ขอ "${esc(nameOf(requested))}" → ตรวจได้ "${esc(nameOf(detected))}" (${list.length} ครั้ง)</h4>` +
    (list.length ? `<table class="data"><thead><tr><th>ครั้งที่</th><th>สภาพแสง</th><th>ความสว่างที่วัดได้</th><th>เห็นมือ</th><th>เสียงโหวตใน 1 วินาที</th></tr></thead><tbody>` +
      list.map((t) => `<tr><td class="num">${t.i}</td><td>${esc(CONDITION_TH[t.condition] || t.condition)}</td><td class="num">${t.brightness ?? '-'}</td><td class="num">${t.handFoundPct ?? '-'}%</td><td>${esc(t.votes || '')}</td></tr>`).join('') + '</tbody></table>'
      : '<p class="muted">ไม่มีตัวอย่างในช่องนี้</p>');
}

// ตารางตัวชี้วัด + แถวเฉลี่ย macro
export function renderMetrics(el, s, nameOf) {
  el.innerHTML = `<thead><tr><th>ท่า</th><th>จำนวนที่ขอ (support)</th><th>Precision</th><th>Recall</th><th>F1</th></tr></thead><tbody>` +
    s.per.map((p) => `<tr><td>${esc(nameOf(p.label))}</td><td class="num">${p.support}</td><td class="num">${p.predicted ? pct(p.precision) : '— (ไม่เคยทายท่านี้)'}</td><td class="num">${pct(p.recall)}</td><td class="num">${pct(p.f1)}</td></tr>`).join('') +
    `<tr class="macro"><td><b>เฉลี่ยแบบ macro</b></td><td class="num">${s.n}</td><td class="num"><b>${pct(s.macro.precision)}</b></td><td class="num"><b>${pct(s.macro.recall)}</b></td><td class="num"><b>${pct(s.macro.f1)}</b></td></tr>` +
    `<tr class="macro"><td><b>ความแม่นยำรวม (Accuracy)</b></td><td class="num">${s.n}</td><td colspan="3" class="num"><b>${pct(s.accuracy)}</b></td></tr></tbody>`;
}

// คำอธิบายตัวชี้วัดภาษาไทย พร้อมคัดลอกไปใส่รายงาน
export const METRIC_TH = [
  ['ความแม่นยำรวม (Accuracy)', 'สัดส่วนครั้งที่ระบบตรวจได้ตรงกับท่าที่ขอ จากการทดสอบทั้งหมด = ผลรวมแนวทแยง ÷ ทั้งหมด บอกภาพรวม แต่ไม่บอกว่าผิดเป็นท่าอะไร'],
  ['ความแม่นยำเมื่อตอบว่าใช่ (Precision)', 'เมื่อระบบ "บอกว่า" เป็นท่านี้ ถูกจริงกี่เปอร์เซ็นต์ = TP ÷ ผลรวมคอลัมน์ ถ้าต่ำแปลว่าระบบชอบทักผิดว่าเป็นท่านี้ (เกมจะนับคะแนนให้ทั้งที่ยังไม่ได้ทำ)'],
  ['ความครบถ้วน (Recall)', 'ในครั้งที่ผู้ใช้ "ทำท่านี้จริง" ระบบจับได้กี่เปอร์เซ็นต์ = TP ÷ ผลรวมแถว ถ้าต่ำแปลว่าผู้ป่วยทำท่าแล้วระบบไม่นับ ทำให้หมดกำลังใจ'],
  ['F1', 'ค่าเฉลี่ยแบบฮาร์มอนิกของ precision และ recall = 2PR ÷ (P + R) จะสูงได้ก็ต่อเมื่อทั้งสองค่าสูงพร้อมกัน ใช้เปรียบเทียบระบบด้วยตัวเลขเดียว'],
  ['เฉลี่ยแบบ macro', 'เฉลี่ยค่าของทุกท่าโดยให้น้ำหนักเท่ากัน ท่าที่ทำได้แย่จึงไม่ถูกท่าที่ทำได้ดีกลบ'],
];

// วาดตารางความสับสนลง canvas เพื่อบันทึกเป็นรูป PNG ใส่รายงาน
export function drawConfusionCanvas(canvas, cm, nameOf, title) {
  const cw = 110, ch = 48, left = 170, top = 90;
  canvas.width = left + cm.cols.length * cw + 20; canvas.height = top + cm.rows.length * ch + 30;
  const ctx = canvas.getContext('2d'), font = cssVar('--font');
  ctx.fillStyle = cssVar('--card'); ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = cssVar('--text'); ctx.font = `700 20px ${font}`; ctx.textAlign = 'left'; ctx.fillText(title, 16, 32);
  ctx.font = `14px ${font}`; ctx.fillStyle = cssVar('--text-2'); ctx.fillText('แถว = ท่าที่ขอ · คอลัมน์ = ท่าที่ระบบตรวจได้', 16, 56);
  const max = Math.max(1, ...cm.m.flat());
  ctx.textAlign = 'center';
  cm.cols.forEach((c, j) => { ctx.fillStyle = cssVar('--text'); ctx.fillText(nameOf(c), left + j * cw + cw / 2, top - 10); });
  cm.rows.forEach((r, i) => {
    ctx.textAlign = 'right'; ctx.fillStyle = cssVar('--text'); ctx.fillText(nameOf(r), left - 10, top + i * ch + ch / 2 + 5);
    cm.cols.forEach((_, j) => {
      const v = cm.m[i][j], x = left + j * cw, y = top + i * ch;
      ctx.fillStyle = cssVar('--input'); ctx.fillRect(x + 2, y + 2, cw - 4, ch - 4);
      if (v) { ctx.globalAlpha = 0.15 + (0.7 * v) / max; ctx.fillStyle = cssVar(i === j ? '--success' : '--error'); ctx.fillRect(x + 2, y + 2, cw - 4, ch - 4); ctx.globalAlpha = 1; }
      ctx.fillStyle = cssVar('--text'); ctx.textAlign = 'center'; ctx.font = `700 18px ${font}`; ctx.fillText(String(v), x + cw / 2, y + ch / 2 + 6); ctx.font = `14px ${font}`;
    });
  });
}
