@echo off
REM Serve DeepDistrict.si locally at http://localhost:8000
cd /d "%~dp0"
echo DeepDistrict.si running at http://localhost:8000  (Ctrl+C to stop)
start "" http://localhost:8000
python -m http.server 8000
