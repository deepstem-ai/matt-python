@echo off
REM ============================================================
REM start.bat - double-click to open HandRehab Arcade (FingerRehab)
REM ดับเบิลคลิกไฟล์นี้เพื่อเปิดแอป
REM  1) find Python (python / py) - if none, use the PowerShell server tools\serve.ps1
REM  2) find a free port 8000-8004 (8000 preferred: browser data is tied to the port)
REM  3) open Chrome or Edge as an app window: --app=http://localhost:PORT/index.html
REM Everything is relative to this folder (paths with spaces OK). "start.bat kiosk" = full screen.
REM ============================================================
chcp 65001 >nul
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"
title FingerRehab - HandRehab Arcade
set "MODE="
if /i "%~1"=="kiosk" set "MODE=--kiosk"

color 0B
echo.
echo    ##   ##   ###   ##  ## ####    ####  ##### ##  ##   ###   ####
echo    ##   ##  ## ##  ### ## ## ##   ## ## ##    ##  ##  ## ##  ## ##
echo    #######  #####  ## ### ##  ##  ####  ####  ######  #####  ####
echo    ##   ##  ## ##  ##  ## ## ##   ## ## ##    ##  ##  ## ##  ## ##
echo    ##   ##  ## ##  ##  ## ####    ## ## ##### ##  ##  ## ##  ####
echo.
echo           * A R C A D E *   FingerRehab  -  ทีม NeonHands
echo.

if not exist "index.html" goto nofiles
if not exist "tools\serve.ps1" goto nofiles

REM ---------- 1) Python? (ตรวจว่ารันได้จริง ไม่ใช่ตัวหลอกของ Microsoft Store) ----------
set "PY="
py -3 -c "import sys" >nul 2>nul
if not errorlevel 1 set "PY=py -3"
if defined PY goto havepy
python -c "import sys" >nul 2>nul
if not errorlevel 1 set "PY=python"
if defined PY goto havepy
python3 -c "import sys" >nul 2>nul
if not errorlevel 1 set "PY=python3"
:havepy
if defined PY (
  echo  [OK] พบ Python / Python found: !PY!
) else (
  echo  [i] ไม่พบ Python - ใช้เซิร์ฟเวอร์ PowerShell แทน
  echo      Python not found - using the built-in PowerShell server instead.
)

REM ---------- 2) หาพอร์ต 8000-8004 ----------
REM a LISTENING socket has foreign address 0.0.0.0:0 or [::]:0 (works on any Windows language)
set PORT=8000
set /a TRIES=0
:findport
netstat -an | findstr /r /c:":%PORT%  *[^ ]*:0 " >nul
if errorlevel 1 goto portfree
REM port in use - is it our app already running? then just open the browser
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $r = Invoke-WebRequest -UseBasicParsing -TimeoutSec 3 -Uri 'http://localhost:%PORT%/manifest.json'; if ($r.Content -match 'HandRehab') { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>nul
if not errorlevel 1 (
  echo  [OK] แอปเปิดอยู่แล้วที่พอร์ต %PORT% / App already running on port %PORT%
  set "STARTED="
  goto openapp
)
echo  พอร์ต %PORT% ไม่ว่าง ลองพอร์ตถัดไป... / Port %PORT% busy, trying next...
set /a PORT+=1
set /a TRIES+=1
if !TRIES! GEQ 5 goto noport
goto findport

:portfree
echo  กำลังเปิดเซิร์ฟเวอร์ / Starting server: http://localhost:%PORT% ...
set "STARTED=1"
if defined PY goto startpy
start "HandRehab Server %PORT%" /min powershell -NoProfile -ExecutionPolicy Bypass -File "tools\serve.ps1" -Port %PORT%
goto waitserver
:startpy
start "HandRehab Server %PORT%" /min %PY% "tools\serve.py" %PORT%

REM ---------- รอให้เซิร์ฟเวอร์พร้อม (สูงสุด 20 วินาที) ----------
:waitserver
set /a WAITED=0
:waitloop
timeout /t 1 /nobreak >nul
netstat -an | findstr /r /c:":%PORT%  *[^ ]*:0 " >nul
if not errorlevel 1 goto openapp
set /a WAITED+=1
if !WAITED! GEQ 20 goto noserver
goto waitloop

REM ---------- 3) เปิด Chrome หรือ Edge แบบหน้าต่างแอป ----------
:openapp
set "URL=http://localhost:%PORT%/index.html"
set "BROWSER="
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "BROWSER=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not defined BROWSER if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "BROWSER=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not defined BROWSER if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set "BROWSER=%LocalAppData%\Google\Chrome\Application\chrome.exe"
if not defined BROWSER if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" set "BROWSER=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not defined BROWSER if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" set "BROWSER=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if defined BROWSER goto launch
echo  [i] ไม่พบ Chrome / Edge - เปิดด้วยเบราว์เซอร์หลักของเครื่อง / Opening default browser
start "" "%URL%"
goto opened
:launch
start "" "%BROWSER%" %MODE% --app=%URL%
:opened

color 0A
echo.
echo  [OK] เปิดแอปแล้ว / App opened: %URL%
echo  ถ้าหน้าต่างแอปไม่ขึ้นใน 10 วินาที ให้เปิด Chrome หรือ Edge แล้วพิมพ์ที่อยู่ด้านบนเอง
echo  If no window appears in 10 seconds, open Chrome or Edge and type the address above.
echo.
echo  เมื่อใช้งานเสร็จ / When you are done:
echo    1. ปิดหน้าต่างแอป / Close the app window (X or Alt+F4)
echo    2. กดปุ่มใดก็ได้ในหน้าต่างนี้ = ปิดเซิร์ฟเวอร์ / Press any key here to stop the server
echo.
pause
if defined STARTED taskkill /FI "WINDOWTITLE eq HandRehab Server %PORT%*" /T /F >nul 2>nul
exit /b 0

:nofiles
color 0C
echo.
echo  [!] ไม่พบไฟล์ของแอปในโฟลเดอร์นี้ / App files not found next to start.bat
echo      อาจเปิดจากในไฟล์ ZIP โดยตรง ให้แตกไฟล์ ZIP ก่อน (คลิกขวา - Extract All)
echo      You may be running it from inside the ZIP. Extract the ZIP first (right-click - Extract All).
echo.
pause
exit /b 1

:noport
color 0C
echo.
echo  [!] พอร์ต 8000-8004 ถูกใช้หมด / Ports 8000-8004 are all in use
echo      ปิดหน้าต่าง "HandRehab Server" ที่ค้างอยู่ทั้งหมด หรือรีสตาร์ตเครื่อง แล้วลองใหม่
echo      Close all "HandRehab Server" windows (or restart the PC) and try again.
echo.
pause
exit /b 1

:noserver
color 0C
echo.
echo  [!] เซิร์ฟเวอร์ไม่เริ่มทำงานภายใน 20 วินาที / The server did not start within 20 seconds
echo      ดูข้อความในหน้าต่าง "HandRehab Server" ที่ย่ออยู่ในแถบงาน
echo      Look at the minimized "HandRehab Server" window in the taskbar for the error.
echo      ถ้าไม่มี Python: ติดตั้ง Python 3 จาก Microsoft Store แล้วลองใหม่
echo      Tip: install Python 3 from the Microsoft Store and run start.bat again.
echo.
pause
exit /b 1
