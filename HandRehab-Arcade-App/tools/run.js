#!/usr/bin/env node
/*
 * run.js — ตัวเปิดแอป HandRehab Arcade สำหรับเครื่องที่มี Node.js แต่ไม่มี Python
 * ทำเหมือน tools/run.py ทุกอย่าง  หาพอร์ตว่างเอง ห้ามแคช เปิดเบราว์เซอร์ให้
 * ไม่ต้องลงไลบรารีอะไรเพิ่ม ใช้ของที่ Node มีมาให้อยู่แล้ว
 */
const http = require("http");
const fs = require("fs");
const path = require("path");
const net = require("net");
const { spawn } = require("child_process");

const START_PORT = 8731, TRIES = 20;
const HERE = __dirname;
const APP = path.basename(HERE) === "tools" ? path.dirname(HERE) : HERE;

const NEED = ["models/hand_landmarker.task",
              "models/face_landmarker.task",
              "models/blaze_face_short_range.tflite"];

const TYPES = {
  ".html":"text/html; charset=utf-8", ".js":"text/javascript; charset=utf-8",
  ".mjs":"text/javascript; charset=utf-8", ".css":"text/css; charset=utf-8",
  ".json":"application/json; charset=utf-8", ".png":"image/png", ".jpg":"image/jpeg",
  ".jpeg":"image/jpeg", ".svg":"image/svg+xml", ".ico":"image/x-icon",
  ".woff2":"font/woff2", ".woff":"font/woff", ".ttf":"font/ttf",
  ".wasm":"application/wasm", ".task":"application/octet-stream",
  ".tflite":"application/octet-stream", ".csv":"text/csv; charset=utf-8",
  ".txt":"text/plain; charset=utf-8", ".md":"text/plain; charset=utf-8",
};

function tryPort(p) {
  return new Promise((res) => {
    const s = net.createServer();
    s.once("error", () => res(false));
    s.once("listening", () => s.close(() => res(true)));
    s.listen(p, "127.0.0.1");
  });
}

async function freePort() {
  for (let p = START_PORT; p < START_PORT + TRIES; p++) {
    if (await tryPort(p)) return p;
  }
  return null;
}

function openBrowser(url) {
  const cmd = process.platform === "win32" ? "cmd"
            : process.platform === "darwin" ? "open" : "xdg-open";
  const args = process.platform === "win32" ? ["/c", "start", "", url] : [url];
  try { spawn(cmd, args, { detached: true, stdio: "ignore" }).unref(); } catch (e) {}
}

(async () => {
  if (!fs.existsSync(path.join(APP, "index.html"))) {
    console.log("\n  [!] หา index.html ไม่เจอ");
    console.log("      ตอนนี้กำลังมองที่: " + APP + "\n");
    process.exit(1);
  }

  const missing = NEED.filter((f) => !fs.existsSync(path.join(APP, f)));
  const port = await freePort();
  if (!port) {
    console.log(`\n  [!] พอร์ต ${START_PORT} ถึง ${START_PORT + TRIES - 1} ไม่ว่างสักพอร์ต\n`);
    process.exit(1);
  }
  const url = `http://localhost:${port}/menu.html`;

  const line = "  " + "=".repeat(56);
  console.log("\n" + line + "\n   HandRehab Arcade\n" + line + "\n");
  if (missing.length) {
    console.log("  [!] ยังขาดไฟล์โมเดล AI " + missing.length + " ไฟล์");
    missing.forEach((m) => console.log("      - " + m));
    console.log("\n      แอปจะเปิดได้ แต่ยังจับมือไม่ได้");
    console.log("      ให้ปิดหน้าต่างนี้แล้วรัน  tools\\download-assets.bat\n");
  } else {
    console.log("  ไฟล์โมเดล AI ครบแล้ว\n");
  }
  console.log(`   เปิดแอปที่   ${url}\n`);
  console.log("   เปิดแล้วต้องเห็น โลโก้มือสีนีออน กับคำว่า HandRehab Arcade");
  console.log(`   ถ้าเห็นเป็นแอปอื่น ให้เปิด   http://localhost:${port}/fix.html\n`);
  console.log("  " + "-".repeat(56));
  console.log("   ปิดแอป  กด Ctrl + C ในหน้าต่างนี้");
  console.log("  " + "-".repeat(56) + "\n");

  http.createServer((req, res) => {
    let rel = decodeURIComponent(req.url.split("?")[0]);
    if (rel === "/" || rel === "") rel = "/index.html";
    // กันการไต่ออกนอกโฟลเดอร์แอป
    const file = path.normalize(path.join(APP, rel));
    if (!file.startsWith(APP)) { res.writeHead(403).end("forbidden"); return; }
    fs.stat(file, (err, st) => {
      if (err || !st.isFile()) { res.writeHead(404).end("not found"); return; }
      res.writeHead(200, {
        "Content-Type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream",
        "Content-Length": st.size,
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "Pragma": "no-cache", "Expires": "0",
      });
      fs.createReadStream(file).pipe(res);
    });
  }).listen(port, "127.0.0.1", () => setTimeout(() => openBrowser(url), 1000));
})();
