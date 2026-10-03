// ============================================================
// home-page.js — หน้าหลักอย่างง่ายหลังเข้าสู่ระบบ (Lab 15)
// แสดงชื่อผู้ใช้ + ตารางบันทึกการเข้าสู่ระบบ (เวลาที่ใช้ วิธีที่ใช้ คะแนนความเหมือน)
// ============================================================
import { applyPrefs, downloadCSV, esc } from './ui.js';
import { openDB, getCurrentUser, listUsers, setCurrentUser } from './db.js';
import { getLog } from './login-log.js';

applyPrefs();
const $ = (id) => document.getElementById(id);
const nameOf = (u) => [u?.firstName, u?.lastName].filter(Boolean).join(' ') || '—';
const METHOD = { face: '🙂 ใบหน้า', pin: '🔢 PIN', 'face-timeout': '⌛ ใบหน้า (ไม่พบใน 10 วิ)' };
let rows = [];

try {
  await openDB();
  const u = await getCurrentUser();
  if (!u) {
    $('hello').textContent = 'ยังไม่ได้เข้าสู่ระบบ';
    $('meta').innerHTML = '<a class="btn-glow" href="index.html">🔐 ไปหน้าเข้าสู่ระบบ</a>';
    $('logout').classList.add('hidden');
  } else {
    $('hello').textContent = `สวัสดี คุณ${nameOf(u)} 👋`;
    const x = u.extra || {};
    $('meta').textContent = `ใบหน้าที่เก็บไว้: ${x.faceCount || 0} รูป${x.faceQualityAvg ? ` (คุณภาพเฉลี่ย ${x.faceQualityAvg})` : ''} · PIN: ${u.pinHash ? 'ตั้งแล้ว' : 'ยังไม่ตั้ง'}`;
    $('enrol').href = 'enrol.html?user=' + encodeURIComponent(u.id);
  }
  const names = new Map((await listUsers()).map((x) => [x.id, nameOf(x)]));
  rows = (await getLog()).slice().reverse().map((r) => ({
    time: new Date(r.at).toLocaleString('th-TH'), method: r.method, user: names.get(r.userId) || '—',
    seconds: r.ms != null ? (r.ms / 1000).toFixed(1) : '', score: r.score != null ? r.score.toFixed(3) : '', threshold: r.threshold ?? '', blinks: r.blinks ?? '',
  }));
  const face = rows.filter((r) => r.method === 'face'), fails = rows.filter((r) => r.method === 'face-timeout');
  const avg = face.length ? (face.reduce((a, r) => a + +r.seconds, 0) / face.length).toFixed(1) : '—';
  $('sum').textContent = `ใบหน้าสำเร็จ ${face.length} ครั้ง (เฉลี่ย ${avg} วินาที) · ไม่พบภายใน 10 วินาที ${fails.length} ครั้ง · PIN ${rows.length - face.length - fails.length} ครั้ง`;
  $('log').innerHTML = '<tr><th>เวลา</th><th>วิธี</th><th>ผู้ใช้</th><th>ใช้เวลา (วิ)</th><th>ความเหมือน</th><th>เกณฑ์</th><th>กระพริบ</th></tr>' +
    (rows.slice(0, 30).map((r) => `<tr><td>${esc(r.time)}</td><td>${METHOD[r.method] || esc(r.method)}</td><td>${esc(r.user)}</td><td class="num">${r.seconds}</td><td class="num">${r.score}</td><td class="num">${r.threshold}</td><td class="num">${r.blinks}</td></tr>`).join('') || '<tr><td colspan="7" class="muted">ยังไม่มีบันทึก</td></tr>');
} catch (e) {
  $('hello').textContent = 'เปิดฐานข้อมูลไม่ได้';
  $('meta').innerHTML = `${esc(e.message)} <button class="btn-glow small" onclick="location.reload()">↻ ลองใหม่</button>`;
}
$('logout').onclick = () => { setCurrentUser(null); location.href = 'index.html'; };
$('csv').onclick = () => downloadCSV('login-log.csv', rows, ['time', 'method', 'user', 'seconds', 'score', 'threshold', 'blinks']);
