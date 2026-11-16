@echo off
REM ============================================================
REM install.bat - double-click after extracting the ZIP
REM ดับเบิลคลิกหลังแตกไฟล์ ZIP: ติดตั้งแอปลง C:\Downloads\FingerRehab + สร้างทางลัดบนเดสก์ท็อป
REM Copies the app to C:\Downloads\FingerRehab, creates the desktop shortcut, offers to launch.
REM ============================================================
chcp 65001 >nul
cd /d "%~dp0"
title FingerRehab - Install
if not exist "tools\install.ps1" goto missing
powershell -NoProfile -ExecutionPolicy Bypass -File "tools\install.ps1"
echo.
pause
exit /b 0
:missing
color 0C
echo.
echo  [!] ไม่พบ tools\install.ps1 - อาจเปิดจากในไฟล์ ZIP โดยตรง
echo      แตกไฟล์ ZIP ก่อน (คลิกขวา - Extract All) แล้วดับเบิลคลิก install.bat ในโฟลเดอร์ที่แตกออกมา
echo  [!] tools\install.ps1 not found - extract the ZIP first (right-click - Extract All),
echo      then double-click install.bat inside the extracted folder.
echo.
pause
exit /b 1
