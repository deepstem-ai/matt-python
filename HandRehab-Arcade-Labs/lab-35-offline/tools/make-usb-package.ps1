# ============================================================
# make-usb-package.ps1 — สร้างโฟลเดอร์สำหรับคัดลอกลง USB แล้วเปิดได้ทุกเครื่องโดยไม่ต้องใช้อินเทอร์เน็ต (Lab 35)
# วิธีใช้ (ในโฟลเดอร์แอป):
#   powershell -ExecutionPolicy Bypass -File tools\download-assets.ps1     (ครั้งแรก ให้ได้ไฟล์ครบ 12/12)
#   powershell -ExecutionPolicy Bypass -File tools\make-usb-package.ps1
# ผลลัพธ์: dist\HandRehab-USB\  → คัดลอกทั้งโฟลเดอร์ลง USB (ทำ 2 อัน เผื่ออันหนึ่งเสีย)
# หมายเหตุ: ไฟล์นี้บันทึกแบบ UTF-8 มี BOM เพื่อให้ Windows PowerShell 5.1 อ่านภาษาไทยได้
# ============================================================
$ErrorActionPreference = 'Stop'
try { [Console]::OutputEncoding = [Text.Encoding]::UTF8 } catch { }
$AppDir = Split-Path -Parent $PSScriptRoot
Set-Location $AppDir
$Out = Join-Path $AppDir 'dist\HandRehab-USB'
$Utf8Bom = New-Object Text.UTF8Encoding $true

# ---------- 1) ตรวจว่าไฟล์ออฟไลน์ครบก่อน ----------
$req = @('models\hand_landmarker.task', 'models\face_landmarker.task', 'models\blaze_face_short_range.tflite',
  'vendor\tasks-vision\vision_bundle.mjs', 'vendor\tasks-vision\wasm\vision_wasm_internal.js', 'vendor\tasks-vision\wasm\vision_wasm_internal.wasm',
  'vendor\tasks-vision\wasm\vision_wasm_nosimd_internal.js', 'vendor\tasks-vision\wasm\vision_wasm_nosimd_internal.wasm',
  'fonts\noto-sans-thai-thai.woff2', 'fonts\noto-sans-thai-latin.woff2', 'fonts\orbitron-latin.woff2', 'fonts\fonts.css')
$missing = @($req | Where-Object { -not (Test-Path $_) -or (Get-Item $_).Length -eq 0 })
if ($missing.Count -gt 0) {
  $missing | ForEach-Object { Write-Host "  ✖ ขาด $_" -ForegroundColor Red }
  Write-Host "✖ ไฟล์ออฟไลน์ยังไม่ครบ ($($missing.Count) ไฟล์) — รัน tools\download-assets.bat ก่อน (ต้องต่ออินเทอร์เน็ต)" -ForegroundColor Red
  exit 1
}
Write-Host "✔ ไฟล์ออฟไลน์ครบ $($req.Count) ไฟล์" -ForegroundColor Green

# ---------- 2) คัดลอกแอป (ไม่เอา dist\ และ .git) ----------
if (Test-Path $Out) { Remove-Item -Recurse -Force $Out }
New-Item -ItemType Directory -Force -Path (Join-Path $Out 'python') | Out-Null
Get-ChildItem -Force $AppDir | Where-Object { $_.Name -notin @('dist', '.git', 'node_modules') } | ForEach-Object {
  Copy-Item -Recurse -Force $_.FullName $Out
}
Write-Host '✔ คัดลอกแอปแล้ว' -ForegroundColor Green

# ---------- 3) start.bat ของ USB: ใช้ Python พกพาในโฟลเดอร์ python\ ก่อน ----------
$bat = @'
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
'@
# cmd.exe อ่าน UTF-8 แบบไม่มี BOM ได้ดีที่สุด (หลัง chcp 65001)
[IO.File]::WriteAllText((Join-Path $Out 'start.bat'), ($bat -replace "`r?`n", "`r`n"), (New-Object Text.UTF8Encoding $false))

# ---------- 4) คำแนะนำ Python พกพา + README-USB.txt ----------
$pyNote = @'
วางไฟล์ Python แบบพกพา (Windows embeddable package) ไว้ในโฟลเดอร์นี้
1) บนเครื่องที่มีอินเทอร์เน็ต เปิด https://www.python.org/downloads/windows/
2) เลือก Python 3.11 หรือใหม่กว่า → "Windows embeddable package (64-bit)" (ไฟล์ .zip ประมาณ 10 MB)
3) แตกไฟล์ zip ทั้งหมดลงในโฟลเดอร์นี้ ให้มี python\python.exe
start.bat จะใช้ Python ตัวนี้ก่อน เครื่องที่ไม่ได้ติดตั้ง Python ก็เปิดแอปได้
'@
[IO.File]::WriteAllText((Join-Path $Out 'python\README.txt'), ($pyNote -replace "`r?`n", "`r`n"), $Utf8Bom)

$when = Get-Date -Format 'yyyy-MM-dd HH:mm'
$readme = @"
HandRehab Arcade — ชุดพกพาบน USB (ใช้งานได้โดยไม่ต้องมีอินเทอร์เน็ต)
สร้างเมื่อ: $when  ·  ทีม NeonHands · โรงเรียนของเรา

วิธีเปิด
  Windows : ดับเบิลคลิก start.bat
  Mac     : เปิด Terminal แล้วพิมพ์  bash start.sh
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
"@
[IO.File]::WriteAllText((Join-Path $Out 'README-USB.txt'), ($readme -replace "`r?`n", "`r`n"), $Utf8Bom)

$files = Get-ChildItem -Recurse -File $Out
$mb = [math]::Round(($files | Measure-Object -Property Length -Sum).Sum / 1MB, 1)
Write-Host '=============================================='
Write-Host " ✔ สร้างชุด USB แล้ว: $Out ($($files.Count) ไฟล์, $mb MB)" -ForegroundColor Green
Write-Host '   คัดลอกทั้งโฟลเดอร์ HandRehab-USB ลง USB แล้วทดสอบบนเครื่องอื่นโดยปิดเน็ต'
Write-Host '=============================================='
