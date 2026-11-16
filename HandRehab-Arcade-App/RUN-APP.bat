@echo off
chcp 65001 >nul
title HandRehab Arcade
cd /d "%~dp0"

echo.
echo   กำลังเปิด HandRehab Arcade ...
echo.

rem หา Python ให้เจอ  ลองทีละตัวตามลำดับที่เจอบ่อยที่สุดบน Windows
where py >nul 2>nul
if %errorlevel%==0 (
  py -3 "tools\run.py"
  goto done
)

where python >nul 2>nul
if %errorlevel%==0 (
  python "tools\run.py"
  goto done
)

where python3 >nul 2>nul
if %errorlevel%==0 (
  python3 "tools\run.py"
  goto done
)

rem ไม่มี Python  ลอง Node แทน
where node >nul 2>nul
if %errorlevel%==0 (
  node "tools\run.js"
  goto done
)

echo.
echo   [!] เครื่องนี้ยังไม่มีทั้ง Python และ Node.js
echo.
echo       วิธีแก้  ลง Python จาก  https://www.python.org/downloads/
echo       ห้ามลงจาก Microsoft Store
echo       ตอนติดตั้ง ต้องติ๊กช่อง  Add python.exe to PATH  ที่หน้าแรก
echo       ลงเสร็จ ปิดหน้าต่างนี้แล้วดับเบิลคลิก RUN-APP.bat ใหม่
echo.
pause
exit /b 1

:done
echo.
pause
