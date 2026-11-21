@echo off
REM DeepDistrict: move old release zips (deepdistrict-web-v*.zip) to the Recycle Bin, keep the newest.
REM Never touches folders or data. Keep this file and DeepDistrict-Cleanup.ps1 next to the zips (e.g. Downloads).
chcp 65001 >nul
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0DeepDistrict-Cleanup.ps1" %*
