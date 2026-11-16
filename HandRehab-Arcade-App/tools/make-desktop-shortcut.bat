@echo off
REM ============================================================
REM make-desktop-shortcut.bat - double-click: desktop shortcut "FingerRehab — HandRehab Arcade" -> start.bat
REM ดับเบิลคลิกเพื่อสร้างทางลัดบนเดสก์ท็อป (ชี้ไปที่ start.bat ของโฟลเดอร์นี้ พร้อมไอคอนแอป)
REM ============================================================
chcp 65001 >nul
cd /d "%~dp0"
if not exist "make-desktop-shortcut.ps1" goto missing
powershell -NoProfile -ExecutionPolicy Bypass -File "make-desktop-shortcut.ps1"
echo.
pause
exit /b 0
:missing
echo  [!] ไม่พบ make-desktop-shortcut.ps1 - แตกไฟล์ ZIP ให้ครบก่อน / Extract the whole ZIP first.
pause
exit /b 1
