// ============================================================
// records.js — แปลงไฟล์ที่ดาวน์โหลดมา (JSON / CSV / zip) เป็น "แถวข้อมูล" สำหรับตาราง (Lab 30)
// ฟังก์ชันบริสุทธิ์ ไม่แตะหน้าจอ → ทดสอบใน node ได้
// คืน { columns: [...], rows: [{...}], total, points: [ [ [x,y], ...21 ] | null ] }
// ============================================================

// ตัวเลขทศนิยมยาว ๆ ให้สั้นลงเพื่อแสดงผล
const short = (v) => (typeof v === 'number' ? +v.toFixed(4) : v);

export function toRecords(result) {
  if (result.kind === 'csv') return fromCSV(result.data);
  if (result.kind === 'json') return fromJSON(result.data);
  return fromZip(result.bytes);
}

// CSV: แถวแรกคือหัวตาราง ถ้ามีคอลัมน์ x0,y0 ... x20,y20 จะดึงจุดมือออกมาวาดได้
function fromCSV(rows) {
  const [head, ...body] = rows;
  const hasPts = head.includes('x0') && head.includes('y20');
  const out = body.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])));
  const points = hasPts ? out.map((o) => Array.from({ length: 21 }, (_, i) => [+o['x' + i], +o['y' + i]])) : [];
  // ตารางกว้างเกินไปถ้าแสดงครบ 67 คอลัมน์ → แสดงคอลัมน์แรก ๆ แล้วตามด้วย "…"
  const columns = head.length > 10 ? [...head.slice(0, 7), '…'] : head;
  out.forEach((o) => { if (head.length > 10) o['…'] = `+${head.length - 7} คอลัมน์`; });
  return { columns, rows: out, total: out.length, points };
}

// JSON: รองรับ 3 แบบ — อาร์เรย์, อ็อบเจกต์แบบ HaGRID (คีย์ = รหัสรูป), อาร์เรย์ของจุด (FreiHAND xyz)
function fromJSON(data) {
  if (Array.isArray(data)) {
    // FreiHAND training_xyz.json = [[ [x,y,z] ×21 ], ...]
    if (Array.isArray(data[0]) && Array.isArray(data[0][0])) {
      const rows = data.map((pts, i) => ({ index: i, points: pts.length, wrist_xyz: pts[0].map(short).join(', '), index_tip_xyz: (pts[8] || []).map(short).join(', ') }));
      return { columns: ['index', 'points', 'wrist_xyz', 'index_tip_xyz'], rows, total: rows.length, points: data.map((p) => p.map((q) => [q[0], q[1]])) };
    }
    const cols = [...new Set(data.slice(0, 50).flatMap((o) => Object.keys(o || {})))];
    return { columns: cols, rows: data.map((o) => flat(o, cols)), total: data.length, points: [] };
  }
  // HaGRID: { "<image id>": { bboxes, labels, landmarks, leading_hand, leading_conf, user_id } }
  const entries = Object.entries(data).filter(([k]) => !k.startsWith('_')); // ข้ามคีย์หมายเหตุ เช่น _README
  const rows = entries.map(([id, r]) => ({
    image_id: id.slice(0, 8) + '…',
    labels: (r.labels || []).join(' + '),
    hands: (r.bboxes || []).length,
    leading_hand: r.leading_hand ?? '',
    leading_conf: r.leading_conf ?? '',
    landmarks: (r.landmarks?.[0] || []).length + ' จุด',
    user_id: String(r.user_id ?? '').slice(0, 8) + '…',
  }));
  const points = entries.map(([, r]) => (r.landmarks?.[0]?.length === 21 ? r.landmarks[0] : null));
  return { columns: ['image_id', 'labels', 'hands', 'leading_hand', 'leading_conf', 'landmarks', 'user_id'], rows, total: rows.length, points };
}
function flat(o, cols) {
  return Object.fromEntries(cols.map((c) => [c, typeof o?.[c] === 'object' ? JSON.stringify(o[c]).slice(0, 60) : short(o?.[c])]));
}

// ไฟล์ zip (.task ของ MediaPipe เป็น zip): อ่าน "สารบัญ" ท้ายไฟล์ แสดงเป็นรายการไฟล์ข้างใน
// โครงสร้าง zip: End of Central Directory (รหัส 0x06054b50) บอกตำแหน่งสารบัญ แต่ละรายการขึ้นต้น 0x02014b50
function fromZip(bytes) {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) return { columns: ['info'], rows: [{ info: 'ไฟล์ไบนารี (อ่านสารบัญ zip ไม่ได้)' }], total: 1, points: [] };
  const count = dv.getUint16(eocd + 10, true);
  // บางไฟล์มีไบต์นำหน้า ทำให้ตำแหน่งที่บันทึกไว้เลื่อนไป → ชดเชยด้วย delta
  const cdSize = dv.getUint32(eocd + 12, true), cdOff = dv.getUint32(eocd + 16, true);
  let p = cdOff + (eocd - (cdOff + cdSize));
  const rows = [];
  for (let n = 0; n < count && p + 46 <= bytes.length && dv.getUint32(p, true) === 0x02014b50; n++) {
    const size = dv.getUint32(p + 24, true), nameLen = dv.getUint16(p + 28, true), extra = dv.getUint16(p + 30, true), comment = dv.getUint16(p + 32, true);
    const name = new TextDecoder().decode(bytes.slice(p + 46, p + 46 + nameLen));
    rows.push({ file_in_zip: name, size_bytes: size });
    p += 46 + nameLen + extra + comment;
  }
  return { columns: ['file_in_zip', 'size_bytes'], rows, total: rows.length, points: [] };
}
