@echo off
REM ============================================================
REM download-assets.bat - ดับเบิลคลิกเพื่อดาวน์โหลดไฟล์ออฟไลน์ทั้งหมด (Lab 35)
REM เรียก download-assets.ps1 โดยข้ามนโยบายห้ามรันสคริปต์ของ Windows เฉพาะครั้งนี้
REM ============================================================
chcp 65001 >nul
cd /d "%~dp0.."
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0download-assets.ps1"
echo.
pause
