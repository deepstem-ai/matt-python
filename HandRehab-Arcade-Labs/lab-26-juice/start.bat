@echo off
REM ============================================================
REM start.bat - ดับเบิลคลิกไฟล์นี้เพื่อเปิดแอป (Lab 02)
REM เปิดแบบเต็มจอ (โหมดคีออสก์) ให้ใช้ start-kiosk.bat แทน
REM ============================================================
chcp 65001 >nul
REM ตั้งให้หน้าต่างแสดงภาษาไทยได้ (UTF-8)
setlocal enabledelayedexpansion
REM เปิดให้ใช้ตัวแปรแบบ !ชื่อ! ในลูปได้
cd /d "%~dp0"
REM ย้ายไปอยู่โฟลเดอร์เดียวกับไฟล์นี้ เพื่อให้เว็บเซิร์ฟเวอร์เห็นไฟล์ของแอป
title HandRehab Arcade
REM ตั้งชื่อหน้าต่าง
set MODE=
REM โหมดปกติ: ว่างไว้ = หน้าต่างแอปธรรมดา
if /i "%~1"=="kiosk" set MODE=--kiosk
REM ถ้าสั่ง start.bat kiosk จะเปิดเต็มจอแบบคีออสก์ (ปิดด้วย Alt+F4)

REM ---------- โลโก้ทีม (ASCII art) ----------
color 0B
REM ตัวอักษรสีฟ้าบนพื้นดำ
echo.
echo    ##   ##   ###   ##  ## ####    ####  ##### ##  ##   ###   ####
echo    ##   ##  ## ##  ### ## ## ##   ## ## ##    ##  ##  ## ##  ## ##
echo    #######  #####  ## ### ##  ##  ####  ####  ######  #####  ####
echo    ##   ##  ## ##  ##  ## ## ##   ## ## ##    ##  ##  ## ##  ## ##
echo    ##   ##  ## ##  ##  ## ####    ## ## ##### ##  ##  ## ##  ####
echo.
echo                 * A R C A D E *   ทีม NeonHands
echo.
REM พิมพ์โลโก้ให้หน้าต่างดูเป็นของทีมเรา

REM ---------- 1) ตรวจว่ามี Python ไหม ----------
set PY=
REM ล้างค่าเดิมก่อน
where python >nul 2>nul && set PY=python
REM ถ้ามีคำสั่ง python ให้ใช้ตัวนี้
if "%PY%"=="" where py >nul 2>nul && set PY=py
REM ถ้าไม่มี ลองคำสั่ง py (ตัวเปิด Python ของ Windows)
if "%PY%"=="" goto nopython
REM ไม่พบ Python เลย กระโดดไปส่วนแจ้งวิธีติดตั้ง

REM ---------- 2) หาพอร์ตว่าง ลองสูงสุด 5 ครั้ง (8000-8004) ----------
set PORT=8000
REM พอร์ตเริ่มต้น
set /a TRIES=0
REM ตัวนับจำนวนครั้งที่ลอง
:findport
netstat -ano | findstr /r /c:":%PORT% .*LISTENING" >nul
REM ตรวจว่ามีโปรแกรมอื่นใช้พอร์ตนี้อยู่หรือเปล่า
if errorlevel 1 goto portok
REM ไม่เจอใครใช้ (errorlevel 1) = พอร์ตว่าง ไปต่อได้
echo  พอร์ต %PORT% ไม่ว่าง กำลังลองพอร์ตถัดไป...
REM แจ้งผู้ใช้ว่ากำลังขยับพอร์ต
set /a PORT+=1
REM ขยับไปพอร์ตถัดไป
set /a TRIES+=1
REM นับว่าลองไปแล้วกี่ครั้ง
if !TRIES! GEQ 5 goto noport
REM ลองครบ 5 ครั้งแล้วยังไม่ว่าง ไปส่วนแจ้งปัญหา
goto findport
REM วนกลับไปตรวจพอร์ตใหม่

:portok
REM ---------- เปิดเว็บเซิร์ฟเวอร์เบื้องหลัง ----------
echo  กำลังเปิดเซิร์ฟเวอร์ที่ http://localhost:%PORT% ...
REM บอกผู้ใช้ว่ากำลังทำอะไร
start "HandRehab Server" /min %PY% -m http.server %PORT% --bind 127.0.0.1
REM เปิดเซิร์ฟเวอร์ในหน้าต่างย่อ (ปิดหน้าต่างนั้น = ปิดเซิร์ฟเวอร์)

REM ---------- 3) รอ 2 วินาที แล้วเปิด Chrome แบบแอป ----------
timeout /t 2 /nobreak >nul
REM รอให้เซิร์ฟเวอร์พร้อม
set URL=http://localhost:%PORT%/index.html
REM ที่อยู่ของหน้าแอป
set CHROME=
REM ล้างค่าเดิมก่อนหา Chrome
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set CHROME="%ProgramFiles%\Google\Chrome\Application\chrome.exe"
REM ที่ติดตั้ง Chrome แบบ 64 บิต
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set CHROME="%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
REM ที่ติดตั้ง Chrome แบบ 32 บิต
if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set CHROME="%LocalAppData%\Google\Chrome\Application\chrome.exe"
REM ที่ติดตั้ง Chrome เฉพาะผู้ใช้คนนี้
if defined CHROME (start "" %CHROME% %MODE% --app=%URL%) else (start "" msedge %MODE% --app=%URL%)
REM --app= ทำให้ไม่มีแถบที่อยู่และแท็บ เหมือนแอปจริง / มี Chrome ใช้ Chrome ไม่มีก็ใช้ Edge แทน

REM ---------- 4) บอกวิธีปิด ----------
color 0A
REM เปลี่ยนเป็นตัวอักษรสีเขียว = สำเร็จ
echo.
echo  [OK] เปิดแอปแล้ว: %URL%
echo  ถ้าหน้าต่างแอปไม่ขึ้นใน 5 วินาที ให้เปิด Chrome แล้วพิมพ์ที่อยู่ด้านบนเอง
echo.
echo  เมื่อใช้งานเสร็จ:
echo    1. ปิดหน้าต่างแอป (กดกากบาท X หรือ Alt+F4)
echo    2. ปิดหน้าต่าง "HandRehab Server" ที่ย่ออยู่ในแถบงานด้านล่าง
echo    3. กดปุ่มใดก็ได้เพื่อปิดหน้าต่างนี้
echo.
pause
REM รอผู้ใช้กดปุ่ม หน้าต่างจะไม่หายไปเอง
exit /b 0

:nopython
REM ---------- ส่วนแจ้งเมื่อไม่มี Python ----------
color 0C
REM ตัวอักษรสีแดง = มีปัญหา
echo.
echo  [!] เครื่องนี้ยังไม่มีโปรแกรม Python ที่แอปต้องใช้ แอปจึงยังเปิดไม่ได้
echo      ไม่ต้องกังวล ติดตั้งครั้งเดียวก็ใช้ได้ตลอด
echo.
echo  วิธีติดตั้ง:
echo    1. กดปุ่ม Windows แล้วพิมพ์ Microsoft Store กด Enter
echo    2. ช่องค้นหาด้านบน พิมพ์คำว่า python
echo    3. เลือก Python 3 (ตัวเลขมากที่สุด) แล้วกดปุ่ม "รับ" หรือ "Get"
echo    4. รอจนติดตั้งเสร็จ แล้วดับเบิลคลิกไฟล์ start.bat นี้อีกครั้ง
echo.
pause
REM รอให้ผู้ใช้อ่านจบก่อน หน้าต่างจะไม่หายไปเอง
exit /b 1

:noport
REM ---------- ส่วนแจ้งเมื่อพอร์ตเต็มทั้ง 5 ช่อง ----------
color 0C
echo.
echo  [!] พอร์ต 8000-8004 ถูกใช้หมดทั้ง 5 ช่อง
echo      อาจเพราะเปิด start.bat ค้างไว้หลายรอบ ให้ปิดหน้าต่างดำ "HandRehab Server" ทั้งหมด
echo      หรือรีสตาร์ตเครื่อง แล้วลองใหม่
echo.
pause
REM รอผู้ใช้อ่าน
exit /b 1
