@echo off
REM ============================================================
REM start.bat - ดับเบิลคลิกไฟล์นี้เพื่อเปิดแอป (Lab 02)
REM ============================================================
chcp 65001 >nul
REM ตั้งให้หน้าต่างแสดงภาษาไทยได้ (UTF-8)
setlocal enabledelayedexpansion
REM ย้ายไปอยู่โฟลเดอร์เดียวกับไฟล์นี้ เพื่อให้เว็บเซิร์ฟเวอร์เห็นไฟล์ของแอป
cd /d "%~dp0"
title HandRehab Arcade
REM ตั้งชื่อหน้าต่าง

REM ---------- 1) ตรวจว่ามี Python ไหม ----------
set PY=
where python >nul 2>nul && set PY=python
REM ถ้ามีคำสั่ง python ให้ใช้ตัวนี้
if "%PY%"=="" where py >nul 2>nul && set PY=py
REM ถ้าไม่มี ลองคำสั่ง py (ตัวเปิด Python ของ Windows)
if "%PY%"=="" (
  REM ไม่พบ Python เลย แจ้งวิธีติดตั้งแล้วหยุด (ไม่ปิดหน้าต่างทิ้ง)
  color 0C
  echo.
  echo  [!] ยังไม่ได้ติดตั้งโปรแกรม Python ในเครื่องนี้ แอปจึงเปิดไม่ได้
  echo.
  echo  วิธีแก้: 1. เปิดโปรแกรม Microsoft Store
  echo          2. พิมพ์ค้นหาคำว่า python
  echo          3. กดปุ่ม "รับ" หรือ "Get" รอจนติดตั้งเสร็จ
  echo          4. ดับเบิลคลิกไฟล์ start.bat นี้อีกครั้ง
  echo.
  pause
  exit /b 1
)

REM ---------- 2) หาพอร์ตว่าง ลองสูงสุด 5 ครั้ง (8000-8004) ----------
set PORT=8000
REM พอร์ตเริ่มต้น
set /a TRIES=0
:findport
netstat -ano | findstr /r /c:":%PORT% .*LISTENING" >nul
REM ตรวจว่ามีโปรแกรมอื่นใช้พอร์ตนี้อยู่หรือเปล่า
if not errorlevel 1 (
  set /a PORT+=1
  set /a TRIES+=1
  REM พอร์ตไม่ว่าง ขยับไปพอร์ตถัดไป
  if !TRIES! GEQ 5 (
    color 0C
    echo  [!] พอร์ต 8000-8004 ถูกใช้หมด กรุณาปิดหน้าต่างดำอื่น ๆ ของแอปนี้ แล้วลองใหม่
    pause
    exit /b 1
  )
  goto findport
)

REM ---------- เปิดเว็บเซิร์ฟเวอร์เบื้องหลัง ----------
echo  กำลังเปิดเซิร์ฟเวอร์ที่ http://localhost:%PORT% ...
start "HandRehab Server" /min %PY% -m http.server %PORT% --bind 127.0.0.1
REM เปิดเซิร์ฟเวอร์ในหน้าต่างย่อ (ปิดหน้าต่างนั้น = ปิดเซิร์ฟเวอร์)

REM ---------- 3) รอ 2 วินาที แล้วเปิด Chrome แบบแอป ----------
timeout /t 2 /nobreak >nul
REM รอให้เซิร์ฟเวอร์พร้อม
set URL=http://localhost:%PORT%/index.html
set CHROME=
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set CHROME="%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set CHROME="%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set CHROME="%LocalAppData%\Google\Chrome\Application\chrome.exe"
REM หาตำแหน่ง Chrome ที่พบบ่อย
if defined CHROME (
  start "" %CHROME% --app=%URL%
  REM --app= ทำให้ไม่มีแถบที่อยู่และแท็บ เหมือนแอปจริง
) else (
  start "" msedge --app=%URL%
  REM ไม่มี Chrome ก็ใช้ Edge แทน (มีในทุกเครื่อง Windows)
)

REM ---------- 4) บอกวิธีปิด ----------
color 0A
echo.
echo  เปิดแอปแล้ว: %URL%
echo  เมื่อใช้งานเสร็จ: ปิดหน้าต่างแอป แล้วปิดหน้าต่าง "HandRehab Server" ที่ย่อไว้
echo.
pause
