// ============================================================
// dataset-loader.js — ระบบดาวน์โหลดชุดข้อมูลที่ "ไม่มีวันทำให้แอปพัง" (Lab 30)
//   fetchWithFallback(links, { timeoutMs, expect, minBytes, magic, onProgress })
//   readLocalFile(file, { expect, minBytes, magic })
//   formatBytes(n)
// หลักการ: ลองลิงก์ทีละตัว → รอไม่เกิน 15 วินาทีต่อลิงก์ → ตรวจว่าเป็นข้อมูลจริง
//          ถ้าพังทุกลิงก์ ให้ throw error ที่มีข้อความไทย + ลิงก์ดาวน์โหลดเอง + ที่วางไฟล์
// ห้ามแตะ: กล้อง, โมเดล AI, ฐานข้อมูล
// ============================================================

// ขนาดไฟล์อ่านง่าย เช่น 1.2 MB
export function formatBytes(n) {
  if (!Number.isFinite(n)) return '-';
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / 1024 / 1024).toFixed(2) + ' MB';
}

// ---------- ตรวจว่า "ของที่ได้มา" เป็นข้อมูลจริง ไม่ใช่หน้าเว็บบล็อกของโรงเรียน ----------
// ตรวจ 2 ชั้น: (1) ชนิดไฟล์ (content-type / magic bytes / ไม่ใช่ HTML)  (2) ขนาดขั้นต่ำ + แปลงข้อมูลได้จริง
const looksLikeHTML = (text) => /^\s*(<!doctype|<html|<head|<body)/i.test(text.slice(0, 512));

export function verifyData(bytes, { expect = 'json', minBytes = 1, magic = null, contentType = '' } = {}) {
  const ct = (contentType || '').toLowerCase();
  // ชั้นที่ 1: ชนิดไฟล์
  if (ct.includes('text/html')) throw new Error('ได้หน้าเว็บ (text/html) มาแทนไฟล์ข้อมูล — มักเป็นหน้าบล็อกของระบบกรองเว็บโรงเรียน');
  const head = new TextDecoder().decode(bytes.slice(0, 512));
  if (looksLikeHTML(head)) throw new Error('ไฟล์ที่ได้ขึ้นต้นด้วย <html> — ไม่ใช่ข้อมูลจริง');
  if (magic) {
    // ค้นหารหัสประจำชนิดไฟล์ในช่วง 64 ไบต์แรก (บางไฟล์ เช่น .task ของ MediaPipe มีไบต์ว่างนำหน้า 2 ตัว)
    const sig = [...magic].map((ch) => ch.charCodeAt(0));
    let found = false;
    for (let off = 0; off <= Math.min(64, bytes.length - sig.length) && !found; off++) found = sig.every((b, i) => bytes[off + i] === b);
    if (!found) throw new Error(`ไม่พบรหัสประจำชนิดไฟล์ (magic bytes) "${magic.replace(/[^\x20-\x7e]/g, '·')}" ช่วงต้นไฟล์ — ไม่ใช่ไฟล์ที่คาดไว้`);
  }
  // ชั้นที่ 2: ขนาด
  if (bytes.byteLength < minBytes) throw new Error(`ไฟล์เล็กผิดปกติ (${formatBytes(bytes.byteLength)}) ต้องมีอย่างน้อย ${formatBytes(minBytes)}`);
  // ชั้นที่ 2 (ต่อ): ต้องแปลงเป็นข้อมูลได้จริง
  if (expect === 'json') {
    const text = new TextDecoder().decode(bytes);
    try { return { kind: 'json', data: JSON.parse(text), text }; }
    catch { throw new Error('ไฟล์ไม่ใช่ JSON ที่ถูกต้อง (แปลงข้อมูลไม่ได้)'); }
  }
  if (expect === 'csv') {
    const text = new TextDecoder().decode(bytes).replace(/^﻿/, '');
    const rows = parseCSV(text);
    if (rows.length < 2 || rows[0].length < 2) throw new Error('ไฟล์ CSV ต้องมีหัวตารางและข้อมูลอย่างน้อย 1 แถว');
    return { kind: 'csv', data: rows, text };
  }
  return { kind: 'binary', data: bytes };
}

// แปลง CSV แบบง่าย (รองรับเครื่องหมาย " ครอบค่า)
export function parseCSV(text) {
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some((v) => v !== '')) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell); if (row.some((v) => v !== '')) rows.push(row);
  return rows;
}

// ---------- ดาวน์โหลดลิงก์เดียว มีเวลาจำกัด + รายงาน % ----------
async function fetchOne(url, timeoutMs, onProgress) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs); // เกินเวลา → ยกเลิก แล้วไปลิงก์ถัดไป
  try {
    const res = await fetch(url, { signal: ctrl.signal, cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const total = Number(res.headers.get('content-length')) || 0;
    const contentType = res.headers.get('content-type') || '';
    if (!res.body?.getReader) { // เบราว์เซอร์เก่า: อ่านทีเดียว
      const buf = new Uint8Array(await res.arrayBuffer());
      onProgress?.(1, buf.byteLength, total);
      return { bytes: buf, contentType };
    }
    const reader = res.body.getReader();
    const parts = []; let got = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      parts.push(value); got += value.byteLength;
      onProgress?.(total ? Math.min(1, got / total) : null, got, total);
    }
    const bytes = new Uint8Array(got); let off = 0;
    for (const p of parts) { bytes.set(p, off); off += p.byteLength; }
    onProgress?.(1, got, total);
    return { bytes, contentType };
  } catch (e) {
    if (e.name === 'AbortError') throw new Error(`รอเกิน ${Math.round(timeoutMs / 1000)} วินาที`);
    throw e;
  } finally { clearTimeout(timer); }
}

// ---------- ฟังก์ชันหลัก: ลองทีละลิงก์จนกว่าจะได้ข้อมูลจริง ----------
// links: [{ url, label }] หรือ ['url', ...]
// คืน { url, label, bytes, size, kind, data, text, attempts }
// ถ้าพังทุกลิงก์: throw Error ที่มี .attempts (เหตุผลของแต่ละลิงก์) และ .thai (ข้อความแนะนำ)
export async function fetchWithFallback(links, { timeoutMs = 15000, expect = 'json', minBytes = 1, magic = null, onProgress, onAttempt, manualUrl, fileName } = {}) {
  const list = links.map((l) => (typeof l === 'string' ? { url: l, label: l } : l));
  const attempts = [];
  for (let i = 0; i < list.length; i++) {
    const { url, label } = list[i];
    onAttempt?.(i, list.length, label || url);
    try {
      const { bytes, contentType } = await fetchOne(url, timeoutMs, (p, got, total) => onProgress?.({ index: i, url, pct: p === null ? null : Math.round(p * 100), got, total }));
      const parsed = verifyData(bytes, { expect, minBytes, magic, contentType });
      attempts.push({ url, ok: true });
      return { url, label, bytes, size: bytes.byteLength, ...parsed, attempts };
    } catch (e) {
      console.warn('[dataset] ลิงก์ใช้ไม่ได้', url, e.message);
      attempts.push({ url, ok: false, reason: e.message });
    }
  }
  const err = new Error('ดาวน์โหลดไม่สำเร็จจากทุกลิงก์');
  err.attempts = attempts;
  err.thai = `ดาวน์โหลดไม่ได้ทั้ง ${list.length} ลิงก์ อาจเป็นเพราะไม่มีอินเทอร์เน็ต หรือระบบกรองเว็บของโรงเรียนบล็อกไว้\n` +
    `วิธีแก้: 1) เปิดลิงก์ดาวน์โหลดเองที่บ้าน: ${manualUrl || list[0]?.url}\n` +
    `2) คัดลอกไฟล์ใส่แฟลชไดรฟ์ แล้ววางไว้ในโฟลเดอร์ datasets/ ของแอป${fileName ? ` ตั้งชื่อว่า ${fileName}` : ''}\n` +
    `3) กดปุ่มดาวน์โหลดอีกครั้ง หรือกด "📂 โหลดจากเครื่อง" เพื่อเลือกไฟล์เอง`;
  err.manualUrl = manualUrl || list[0]?.url;
  throw err;
}

// ---------- โหลดจากไฟล์ในเครื่อง (ปุ่มเลือกไฟล์) ผ่านการตรวจแบบเดียวกัน ----------
export async function readLocalFile(file, opts = {}) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const parsed = verifyData(bytes, { ...opts, contentType: file.type });
  return { url: 'file://' + file.name, label: 'ไฟล์ในเครื่อง: ' + file.name, bytes, size: bytes.byteLength, ...parsed, attempts: [{ url: file.name, ok: true }] };
}
