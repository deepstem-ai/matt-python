@echo off
REM start-kiosk.bat - เปิดแอปเต็มจอแบบคีออสก์ สำหรับสาธิตหน้าชั้น (ออกด้วย Alt+F4)
call "%~dp0start.bat" kiosk
REM เรียก start.bat ตัวหลัก แล้วส่งคำว่า kiosk ไปด้วย
