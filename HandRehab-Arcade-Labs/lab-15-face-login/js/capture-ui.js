// ============================================================
// capture-ui.js — ชิ้นส่วนหน้าจอของการเก็บใบหน้า (Lab 14)
// รายชื่อผู้ใช้, รายการท่า, ตัวเลขสด, แถบรูปสรุป, modal ดูรูปใหญ่/ภาพตัวอย่าง
// ห้ามแตะ: กล้อง, โมเดล AI
// ============================================================
import { modal, esc } from './ui.js';
import { POSES } from './guide.js';
import { QUALITY_CONFIG } from './quality.js';
import { exampleSVG, longTip, MESSAGES } from './warnings.js';

export const fullName = (u) => [u.firstName, u.lastName].filter(Boolean).join(' ') || '(ไม่มีชื่อ)';
const PART_TH = { sharpness: 'ความคม', brightness: 'ความสว่าง', contrast: 'ความต่างแสง', faceRatio: 'ขนาดหน้า', tilt: 'หัวเอียง' };

// รายชื่อผู้ใช้ให้เลือก (ปุ่มใหญ่กดง่าย) faceCounts = { userId: จำนวนรูป }
export function renderUserPicker(el, users, faceCounts, onPick) {
  el.innerHTML = '';
  users.forEach((u) => {
    const b = document.createElement('button');
    b.className = 'btn-glow ghost user-btn';
    const n = faceCounts[u.id] || 0;
    b.innerHTML = `<span class="ico">👤</span><span>${esc(fullName(u))}</span><span class="chip ${n ? 'ok' : ''}">ใบหน้า <b>${n}</b></span>`;
    b.onclick = () => onPick(u);
    el.appendChild(b);
  });
}

// รายการท่า 5 ท่า: ✓ = ถ่ายแล้ว, ● = กำลังถ่าย
export function renderPoseList(el, shots, current) {
  el.innerHTML = POSES.map((p, i) => {
    const s = shots[i];
    const cls = i === current ? 'now' : s ? 'done' : '';
    const mark = s ? `✓ <b class="num">${s.score}</b>` : i === current ? '● กำลังถ่าย' : '—';
    return `<li class="${cls}"><span>${p.icon} ${p.th}</span><span>${mark}</span></li>`;
  }).join('');
}

// ตารางตัวเลขสด (ให้ทีมเห็นค่าจริงไว้ปรับเกณฑ์ และใช้เขียนบทที่ 3)
export function renderLive(el, q, extra = {}) {
  if (!q) { el.innerHTML = '<tr><td class="muted">ยังไม่มีข้อมูล</td></tr>'; return; }
  const m = q.metrics, c = QUALITY_CONFIG;
  const rows = [
    ['ความคม (Laplacian var)', m.sharpness.toFixed(0), `> ${c.sharpness.pass}`],
    ['ความสว่างเฉลี่ย', m.brightness.toFixed(0), `${c.brightness.low}–${c.brightness.high}`],
    ['ความต่างแสง (SD)', m.contrast.toFixed(0), `> ${c.contrast.pass}`],
    ['ขนาดหน้า/ภาพ', m.faceRatio.toFixed(2), `> ${c.faceRatio.pass}`],
    ['หัวเอียง (องศา)', Math.abs(m.tilt).toFixed(1), `≤ ${c.tilt.pass}`],
    ['พิกเซลจ้า', (m.glare * 100).toFixed(1) + '%', `≤ ${c.glarePct * 100}%`],
    ['กว้างหน้า/กว้างกรอบ', extra.widthRatio?.toFixed(2) ?? '—', '0.45–0.85'],
    ['หัน yaw / pitch', extra.pose ? `${extra.pose.yaw.toFixed(2)} / ${extra.pose.pitch.toFixed(2)}` : '—', ''],
  ];
  el.innerHTML = '<tr><th>ค่า</th><th>ตอนนี้</th><th>เกณฑ์</th></tr>' +
    rows.map((r) => `<tr><td>${r[0]}</td><td class="num">${r[1]}</td><td class="muted">${r[2]}</td></tr>`).join('');
}

// ตารางคะแนนย่อยของรูปหนึ่งรูป
function breakdownHTML(s) {
  const w = QUALITY_CONFIG.weights;
  return `<table class="data"><tr><th>ข้อ</th><th>ค่าจริง</th><th>คะแนน</th></tr>` +
    Object.keys(s.parts).map((k) => {
      const v = k === 'tilt' ? Math.abs(s.metrics.tilt).toFixed(1) + '°' : k === 'faceRatio' ? s.metrics.faceRatio.toFixed(2) : s.metrics[k].toFixed(0);
      return `<tr><td>${PART_TH[k]}</td><td class="num">${v}</td><td class="num">${(s.parts[k] * w[k]).toFixed(0)} / ${w[k]}</td></tr>`;
    }).join('') + `<tr><th>รวม</th><th></th><th class="num">${s.score} / 100</th></tr></table>`;
}

// แถบรูปเลื่อนแนวนอน กดรูป = ดูใหญ่, ปุ่มมุมรูป = ถ่ายใหม่
export function renderStrip(el, shots, { onOpen, onRetake }) {
  el.innerHTML = '';
  POSES.forEach((p, i) => {
    const s = shots[i];
    const card = document.createElement('div');
    card.className = 'shot' + (s ? '' : ' empty');
    card.innerHTML = s
      ? `<button class="shot-img" aria-label="ดูรูป ${p.th} ใหญ่"><img src="${s.image}" alt="${p.th}"></button>
         <div class="shot-foot"><span>${p.th}</span><span class="chip ${s.score >= QUALITY_CONFIG.warnAverage ? 'ok' : 'warn'}"><b>${s.score}</b></span></div>`
      : `<div class="shot-img missing">ยังไม่มีรูป</div><div class="shot-foot"><span>${p.th}</span></div>`;
    const re = document.createElement('button');
    re.className = 'retake'; re.title = 'ถ่ายรูปนี้ใหม่'; re.setAttribute('aria-label', 'ถ่ายท่า ' + p.th + ' ใหม่');
    re.textContent = '↻';
    re.onclick = (e) => { e.stopPropagation(); onRetake(i); };
    card.appendChild(re);
    card.querySelector('.shot-img').onclick = () => s && onOpen(i);
    el.appendChild(card);
  });
}

// modal ดูรูปใหญ่พร้อมคะแนนย่อย คืน 'retake' ถ้าผู้ใช้กดถ่ายใหม่
export function openShotModal(s, poseTh) {
  return modal(`<h2>${esc(poseTh)} — คะแนน <span class="num">${s.score}</span></h2>
    <div class="big-shot"><img src="${s.image}" alt="${esc(poseTh)}"></div>${breakdownHTML(s)}
    ${s.embedding ? '' : '<p class="alert warn">รูปนี้ไม่มีข้อมูลจุดใบหน้า 478 จุด จึงใช้ล็อกอินไม่ได้</p>'}`,
  [{ label: '↻ ถ่ายรูปนี้ใหม่', value: 'retake', cls: 'ghost' }, { label: 'ปิด', value: null }]);
}

// modal เมื่อปัญหาเดิมค้างนานเกินกำหนด พร้อมภาพตัวอย่างท่าที่ถูก
export function showPersistModal(msg) {
  return modal(`<h2>${msg.icon} ลองแบบนี้ดูนะ</h2>
    <p><b>${esc(msg.text)}</b></p>${exampleSVG()}<p>${esc(longTip(msg.code))}</p>`,
  [{ label: 'เข้าใจแล้ว ลองใหม่', value: true }]);
}

// ข้อความเหตุผลที่ไม่รับภาพ
export function rejectReasons(q, extra = []) {
  const r = q.problems.map((p) => MESSAGES[p]?.text).filter(Boolean);
  const low = q.score < QUALITY_CONFIG.minScore ? [`คะแนน ${q.score} ต่ำกว่าเกณฑ์ ${QUALITY_CONFIG.minScore}`] : [];
  return [...low, ...r, ...extra];
}
