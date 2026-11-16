#!/usr/bin/env bash
# ============================================================
# make-usb-package.sh — สร้างโฟลเดอร์สำหรับคัดลอกลง USB แล้วเปิดได้ทุกเครื่องโดยไม่ต้องใช้อินเทอร์เน็ต (Lab 35)
# วิธีใช้: bash tools/download-assets.sh   (ครั้งแรก ให้ได้ไฟล์ครบ 12/12)
#          bash tools/make-usb-package.sh
# ผลลัพธ์: dist/HandRehab-USB/  → คัดลอกทั้งโฟลเดอร์ลง USB (ทำ 2 อัน เผื่ออันหนึ่งเสีย)
# ============================================================
set -u
cd "$(dirname "$0")/.." || exit 1
OUT="dist/HandRehab-USB"

# ---------- 1) ตรวจว่าไฟล์ออฟไลน์ครบก่อน ----------
REQ=(models/hand_landmarker.task models/face_landmarker.task models/blaze_face_short_range.tflite
  vendor/tasks-vision/vision_bundle.mjs vendor/tasks-vision/wasm/vision_wasm_internal.js vendor/tasks-vision/wasm/vision_wasm_internal.wasm
  vendor/tasks-vision/wasm/vision_wasm_nosimd_internal.js vendor/tasks-vision/wasm/vision_wasm_nosimd_internal.wasm
  fonts/noto-sans-thai-thai.woff2 fonts/noto-sans-thai-latin.woff2 fonts/orbitron-latin.woff2 fonts/fonts.css)
MISSING=0
for f in "${REQ[@]}"; do [ -s "$f" ] || { echo "  ✖ ขาด $f"; MISSING=$((MISSING + 1)); }; done
if [ $MISSING -gt 0 ]; then
  echo "✖ ไฟล์ออฟไลน์ยังไม่ครบ ($MISSING ไฟล์) — รัน bash tools/download-assets.sh ก่อน (ต้องต่ออินเทอร์เน็ต)"; exit 1
fi
echo "✔ ไฟล์ออฟไลน์ครบ ${#REQ[@]} ไฟล์"

# ---------- 2) คัดลอกแอป (ไม่เอา dist/ และ .git) ----------
rm -rf "$OUT"; mkdir -p "$OUT/python"
for item in *; do
  case "$item" in dist|node_modules) continue ;; esac
  cp -R "$item" "$OUT/"
done
[ -f .gitignore ] && cp .gitignore "$OUT/"
echo "✔ คัดลอกแอปแล้ว"

# ---------- 3) start.bat ของ USB: ใช้ Python พกพาในโฟลเดอร์ python\ ก่อน ถ้าไม่มีใช้ของเครื่อง ----------
cat > "$OUT/start.bat" <<'BAT'
@echo off
REM ============================================================
REM start.bat (USB) - ดับเบิลคลิกเพื่อเปิด HandRehab Arcade จาก USB ไม่ต้องใช้อินเทอร์เน็ต
REM ใช้ Python พกพาในโฟลเดอร์ python\ ก่อน (ดู README-USB.txt) ถ้าไม่มีจะใช้ Python ของเครื่อง
REM ============================================================
chcp 65001 >nul
cd /d "%~dp0"
title HandRehab Arcade (USB)
set PY=
if exist "%~dp0python\python.exe" set PY="%~dp0python\python.exe"
if not defined PY where python >nul 2>nul && set PY=python
if not defined PY where py >nul 2>nul && set PY=py
if not defined PY goto nopython
set PORT=8000
netstat -ano | findstr /r /c:":8000 .*LISTENING" >nul && set PORT=8010
echo  กำลังเปิดเซิร์ฟเวอร์ที่ http://localhost:%PORT% ...
start "HandRehab Server" /min %PY% tools\serve.py %PORT%
timeout /t 2 /nobreak >nul
set URL=http://localhost:%PORT%/index.html
set BROWSER=
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set BROWSER="%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set BROWSER="%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set BROWSER="%LocalAppData%\Google\Chrome\Application\chrome.exe"
if not defined BROWSER if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" set BROWSER="%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if defined BROWSER (start "" %BROWSER% --app=%URL%) else (start "" %URL%)
echo  เปิดแอปแล้ว: %URL%
echo  ใช้งานเสร็จ ปิดหน้าต่าง "HandRehab Server" ที่ย่ออยู่บนแถบงาน
pause
exit /b 0
:nopython
echo  [!] ไม่พบ Python — อ่าน README-USB.txt หัวข้อ "Python พกพา" (แตกไฟล์ลงโฟลเดอร์ python\ บน USB)
pause
exit /b 1
BAT
# ปรับบรรทัดเป็นแบบ Windows (CRLF) ให้ cmd อ่านถูก
sed -i.bak 's/$/\r/' "$OUT/start.bat" && rm -f "$OUT/start.bat.bak"

# ---------- 4) คำแนะนำ Python พกพา + README-USB.txt ----------
cat > "$OUT/python/README.txt" <<'TXT'
วางไฟล์ Python แบบพกพา (Windows embeddable package) ไว้ในโฟลเดอร์นี้
1) บนเครื่องที่มีอินเทอร์เน็ต เปิด https://www.python.org/downloads/windows/
2) เลือก Python 3.11 หรือใหม่กว่า → "Windows embeddable package (64-bit)" (ไฟล์ .zip ประมาณ 10 MB)
3) แตกไฟล์ zip ทั้งหมดลงในโฟลเดอร์นี้ ให้มี python\python.exe
start.bat จะใช้ Python ตัวนี้ก่อน เครื่องที่ไม่ได้ติดตั้ง Python ก็เปิดแอปได้
TXT
cat > "$OUT/README-USB.txt" <<TXT
HandRehab Arcade — ชุดพกพาบน USB (ใช้งานได้โดยไม่ต้องมีอินเทอร์เน็ต)
สร้างเมื่อ: $(date '+%Y-%m-%d %H:%M')  ·  ทีม NeonHands · โรงเรียนของเรา

วิธีเปิด
  Windows : ดับเบิลคลิก start.bat
  Mac     : เปิด Terminal แล้วพิมพ์  bash start.sh   (ลากไฟล์ start.sh ใส่หน้าต่าง Terminal ก็ได้)
  แอปจะเปิดใน Chrome/Edge แบบหน้าต่างแอป ที่ http://localhost:8000

ต้องมีอะไรในเครื่องปลายทาง
  - Google Chrome หรือ Microsoft Edge รุ่นใหม่
  - Python 3 (ถ้าเครื่องไม่มี ให้ใส่ Python พกพาในโฟลเดอร์ python\ ตาม python\README.txt ก่อนวันงาน)
  - กล้องเว็บแคม (ไม่มีก็เล่นโหมดสาธิตด้วยเมาส์ได้)

ในโฟลเดอร์นี้มีครบแล้ว
  models\   โมเดล AI มือ ใบหน้า (3 ไฟล์)
  vendor\   ไลบรารี MediaPipe 0.10.14 ครบชุด
  fonts\    ฟอนต์ไทย Noto Sans Thai + Orbitron
  docs\OFFLINE.md  รายการตรวจสอบก่อนวันนำเสนอ

ตรวจว่าออฟไลน์ได้จริง
  1) ปิด Wi-Fi / ถอดสาย LAN
  2) ดับเบิลคลิก start.bat
  3) ป้ายมุมซ้ายล่างต้องขึ้น "ออฟไลน์ · ใช้ไฟล์ในเครื่อง" และ "ไฟล์ในเครื่องครบ 12/12"
  4) ลองเข้าสู่ระบบด้วยใบหน้า และเล่นเกมด้วยมือ 1 รอบ

ข้อควรรู้
  - ข้อมูลผู้ใช้เก็บในเบราว์เซอร์ของแต่ละเครื่อง (ไม่ได้อยู่บน USB)
    ย้ายเครื่อง: หน้า "ผู้ใช้" → ส่งออก (JSON) แล้วนำเข้าที่เครื่องใหม่ (ห้ามเผยแพร่ไฟล์นี้ มีข้อมูลสุขภาพ)
  - เตรียม USB 2 อัน เผื่ออันหนึ่งเสีย และทดสอบบนเครื่องที่จะใช้จริงล่วงหน้า
TXT
sed -i.bak 's/$/\r/' "$OUT/README-USB.txt" "$OUT/python/README.txt" && rm -f "$OUT"/*.bak "$OUT"/python/*.bak

COUNT=$(find "$OUT" -type f | wc -l | tr -d ' ')
SIZE=$(du -sh "$OUT" | cut -f1)
echo "=============================================="
echo " ✔ สร้างชุด USB แล้ว: $OUT  ($COUNT ไฟล์, $SIZE)"
echo "   คัดลอกทั้งโฟลเดอร์ HandRehab-USB ลง USB แล้วทดสอบบนเครื่องอื่นโดยปิดเน็ต"
echo "=============================================="
