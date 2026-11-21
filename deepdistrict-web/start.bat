@echo off
REM Start DeepDistrict: website + back office (with sign-in) at http://localhost:8000
REM   start.bat         this computer only
REM   start.bat --lan   also reachable from phones/computers on the same Wi-Fi
cd /d "%~dp0"
where python >nul 2>nul || (echo Python 3 is required: https://www.python.org/downloads/ & pause & exit /b 1)
REM the server opens the browser itself once it is listening (and picks a free port if 8000 is busy)
python server\app.py --open %*
pause
