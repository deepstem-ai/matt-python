@echo off
REM ============================================================
REM git-practice.bat - ฝึก git ทีละขั้น (Lab 04) ดับเบิลคลิกได้เลย
REM init - commit - ลบไฟล์ - กู้คืนด้วย git checkout -- ไฟล์ - tag lab-04
REM ============================================================
chcp 65001 >nul
REM ให้หน้าต่างแสดงภาษาไทยได้
cd /d "%~dp0.."
REM ย้ายไปโฟลเดอร์โปรเจกต์ (แม่ของโฟลเดอร์ tools)
where git >nul 2>nul
if errorlevel 1 goto nogit
REM ยังไม่ได้ติดตั้ง git ให้ไปส่วนแจ้งวิธีติดตั้ง

set INREPO=0
REM 0 = ยังไม่มี git, 1 = มี git ของโปรเจกต์นี้แล้ว
set PREFIX=
for /f "delims=" %%p in ('git rev-parse --show-prefix 2^>nul') do set PREFIX=%%p
REM ถ้าอยู่ข้างใน git ของโปรเจกต์อื่น PREFIX จะไม่ว่าง
git rev-parse --is-inside-work-tree >nul 2>nul && set INREPO=1
if "%INREPO%"=="1" if not "%PREFIX%"=="" goto usecopy
goto step1

:usecopy
REM โฟลเดอร์นี้อยู่ใน git ตัวอื่น ให้ฝึกในสำเนาแทน จะได้ไม่ไปยุ่ง git ตัวนอก
set PRACTICE=%TEMP%\handrehab-git-practice
echo โฟลเดอร์นี้อยู่ใน git ของโปรเจกต์อื่นแล้ว จะฝึกในสำเนาที่ %PRACTICE% แทน (ของจริงไม่ถูกแตะ)
if exist "%PRACTICE%" rmdir /s /q "%PRACTICE%"
robocopy "%CD%" "%PRACTICE%" /E /XD .git /NFL /NDL /NJH /NJS >nul
REM คัดลอกทั้งโปรเจกต์ ยกเว้นโฟลเดอร์ .git
cd /d "%PRACTICE%"
set INREPO=0

:step1
echo.
echo == ขั้นที่ 1: git init - ให้โฟลเดอร์เริ่มจำประวัติ ==
if "%INREPO%"=="1" (echo มี git อยู่แล้ว ข้ามขั้นนี้) else (git init)
git config user.name >nul 2>nul || git config user.name "ทีม NeonHands"
REM ตั้งชื่อผู้บันทึก (ถ้ายังไม่เคยตั้ง)
git config user.email >nul 2>nul || git config user.email "team@example.com"
REM ตั้งอีเมลสมมติ ทีมเปลี่ยนเองได้
pause

echo.
echo == ขั้นที่ 2: git add + git commit - กดเซฟเกมครั้งแรก ==
echo $ git add .
git add .
echo $ git commit -m "Lab 04: ..."
git commit -m "Lab 04: โครงสร้างโปรเจกต์ครบ กล้องยังทำงานเหมือนเดิม" || echo (ไม่มีอะไรใหม่ให้บันทึก ไม่เป็นไร)
echo $ git log --oneline
git log --oneline -3
pause

echo.
echo == ขั้นที่ 3: ลบไฟล์จริง ๆ (js\geometry.js) ==
del js\geometry.js
REM ลบไฟล์ทิ้งจริง
echo $ git status --short   (ตัว D = ถูกลบ)
git status --short
echo ไฟล์หายไปแล้ว! ลองเปิดโฟลเดอร์ js ดูได้
pause

echo.
echo == ขั้นที่ 4: git checkout -- ไฟล์ - ย้อนเวลากู้คืน ==
echo $ git checkout -- js/geometry.js
git checkout -- js/geometry.js
REM ดึงไฟล์กลับมาจาก commit ล่าสุด
if exist js\geometry.js (echo [OK] js\geometry.js กลับมาแล้ว!) else (echo [!] กู้คืนไม่สำเร็จ ลองอ่านข้อความด้านบน)
git status --short
pause

echo.
echo == ขั้นที่ 5: git tag lab-04 - ตั้งชื่อจุดเซฟสำคัญ ==
git rev-parse -q --verify refs/tags/lab-04 >nul 2>nul && (echo มีป้าย lab-04 แล้ว) || (git tag lab-04)
git tag
color 0A
echo.
echo [OK] ฝึกครบแล้ว! จดลง evidence: ลบ js\geometry.js แล้วกู้คืนด้วย git checkout สำเร็จ
echo อยู่ที่: %CD%
pause
exit /b 0

:nogit
color 0C
echo.
echo [!] ยังไม่มีโปรแกรม git ในเครื่องนี้
echo     1. เปิด https://git-scm.com แล้วกด Download for Windows
echo     2. ติดตั้งโดยกด Next ไปเรื่อย ๆ
echo     3. ดับเบิลคลิกไฟล์นี้อีกครั้ง
echo.
pause
exit /b 1
