@echo off
REM DeepDistrict: update in one double-click. Keep this file, DeepDistrict-Update.ps1, the release zip
REM (and an optional deepdistrict-add-*.json) in the same folder, e.g. Downloads.
chcp 65001 >nul
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0DeepDistrict-Update.ps1" %*
pause
