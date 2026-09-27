# PROJECT-MAP.md — แผนที่โปรเจกต์ HandRehab Arcade

> เปิดไฟล์นี้ **ก่อนเริ่มทุกแลป** จะได้รู้ว่ากำลังสร้างชิ้นไหนของภาพใหญ่
> ✅ = เขียนจริงแล้ว · ⬜ = ยังเป็นไฟล์ว่าง (มีแค่หัวคอมเมนต์ 3 บรรทัด)

## 1) โครงสร้างโฟลเดอร์
```
handrehab-arcade/
├── index.html            ✅ Lab 01 (แยก CSS/JS ออกใน Lab 04)
├── start.bat / start.sh  ✅ Lab 02   start-kiosk.bat ✅ Lab 02
├── CLAUDE.md             ✅ Lab 03   (สมุดกฎของ AI)
├── .gitignore            ✅ Lab 04
├── css/   style ✅04 · tokens ⬜05 · themes ⬜05/09 · parts ⬜06 · pages ⬜07
├── js/    main ✅04 · ไฟล์ว่าง 21 ไฟล์ (ตารางด้านล่าง)
│   └── games/  star-portal ⬜23 · rhythm-tap ⬜24 · spread-wall ⬜25
├── models/    โมเดล AI สำหรับออฟไลน์ (Lab 35, ไม่ commit)
├── vendor/    MediaPipe ในเครื่อง (Lab 35)
├── fonts/     ฟอนต์ในเครื่อง (Lab 05/35)
├── datasets/  ชุดข้อมูล (Lab 30-32)
├── docs/      เอกสาร (ไฟล์นี้อยู่ที่นี่)
├── evidence/  หลักฐานสำหรับรายงาน (ทุกแลป, รวบรวม Lab 37)
├── prompts/   คำสั่ง AI ที่ได้ผลดี (Lab 03)
└── tools/     สคริปต์ช่วยงาน (git-practice)
```

## 2) แลปไหนสร้างไฟล์ไหน
| Lab | ไฟล์ที่เขียนจริง | หน้าที่ / ส่วนควบคุมบนจอที่ต้องมี |
|---|---|---|
| 01 | `index.html` | ปุ่มเปิดกล้องใหญ่, ป้าย FPS, กล่อง error + ปุ่มลองใหม่ |
| 02 | `start.bat`, `start.sh`, `docs/HOW-TO-RUN.md` | ข้อความในหน้าต่างดำ มีสี มีคำแนะนำ |
| 03 | `CLAUDE.md`, `docs/HOW-TO-ASK-AI.md`, `prompts/` | — |
| 04 | `css/style.css`, `js/main.js`, ทุกโฟลเดอร์, ไฟล์ว่าง, `.gitignore`, docs 3 ไฟล์ | — |
| 05 | `css/tokens.css`, `css/themes.css` (+ `style.html`) | ตัวอย่างสีทุกสี, ปุ่มสลับธีม 3 แบบ |
| 06 | `css/parts.css` (+ `parts.html`) | ปุ่มเรืองแสง, การ์ด, ป้าย, วงแหวน, toast |
| 07 | `js/router.js`, `css/pages.css` | เมนู 7 หน้า, Escape = ย้อนกลับ |
| 08 | หน้าเปิดแอป (splash) | แถบโหลดตามงานจริง, ปุ่มไปต่อเมื่อออฟไลน์ |
| 09 | `css/themes.css` (โปรไฟล์) | สวิตช์ ปกติ / ผู้สูงอายุ / คีออสก์ |
| 10 | `js/camera.js` | ดรอปดาวน์เลือกกล้อง, ปุ่มหยุดกล้อง |
| 11 | `js/vision.js` | กรอบใบหน้า, ป้าย GPU/CPU |
| 12 | `js/validators.js`, `js/register.js` | **ช่องกรอกข้อความ, ดรอปดาวน์, สไลเดอร์**, ปุ่มถัดไป/ย้อนกลับ |
| 13 | `js/db.js` (+ `users.html`) | ตารางผู้ใช้, ค้นหา, แก้ไข, ลบ |
| 14 | `js/face-capture.js` | กรอบนำทาง, คำเตือน มืด/ไกล/เบลอ/เอียง |
| 15 | `js/face-login.js` | ปุ่มล็อกอินด้วยหน้า, ทางสำรอง PIN |
| 16–17 | `js/hand.js` | โครงมือ 21 จุด, สวิตช์สไตล์ 3 แบบ |
| 18 | `js/geometry.js` (+ `docs/math.md`) | ตารางตัวเลขมุม/ระยะ |
| 19–20 | `js/gestures.js` | แถบคะแนนต่อท่า |
| 21 | `js/rep-counter.js` | ตัวนับครั้งตัวใหญ่ |
| 22 | `js/game-engine.js` | **แคนวาสวาดภาพ, แถบเวลา**, FPS |
| 23 | `js/games/star-portal.js` | คะแนน, แถบเวลา, ปุ่มหยุด |
| 24 | `js/games/rhythm-tap.js` | กราฟเวลาตอบสนองรายนิ้ว |
| 25 | `js/games/spread-wall.js` | ค่ากางนิ้วสูงสุด เทียบรอบก่อน |
| 26 | `js/juice.js` | คอมโบ, ความสำเร็จ |
| 27 | `js/calibration.js`, `js/smoothing.js` | ขั้นตอนวัดมือ, ตารางเทียบตัวกรอง |
| 28 | บันทึกรอบฝึก (ใช้ `db.js`) | ปุ่มส่งออก CSV |
| 29 | `js/charts.js` | กราฟ, ปุ่มบันทึกภาพ |
| 30 | `js/dataset-loader.js`, `datasets/SOURCES.md` | — |
| 31 | `js/ml.js` | ปุ่มสอนท่า, ปุ่มทาย |
| 32 | `js/evaluate.js` | ตารางความสับสน |
| 33 | `js/device-info.js` | การ์ดสเปกเครื่อง + คำแนะนำ |
| 34–35 | manifest, service worker, `models/`, `vendor/`, `fonts/` | ปุ่มติดตั้งแอป |
| 36–40 | `evidence/`, `docs/` รายงาน | — |

## 3) ไฟล์ไหนเรียกไฟล์ไหน (ลูกศร = "เรียกใช้")
```
                               index.html
                                   │
                              js/router.js ─────────────── css/pages.css
               ┌──────────────┬────┴─────────┬──────────────────┬─────────────┐
               ▼              ▼              ▼                  ▼             ▼
         register.js    face-login.js   games/*.js          charts.js     device-info.js
               │         face-capture.js  │ star-portal         ▲
               ▼              │           │ rhythm-tap          │
         validators.js        │           │ spread-wall         │
                              ▼           ▼                     │
                          vision.js   game-engine.js ◄── juice.js
                              │           │
                              │           ▼
                              │       rep-counter.js ◄── gestures.js ◄── geometry.js
                              │                              ▲               ▲
                              │                              │          smoothing.js
                              ▼                              │               ▲
                          camera.js ◄──────────────────── hand.js ──────────┘
                                                             ▲
                                                      calibration.js

   ml.js ◄── dataset-loader.js         evaluate.js ──► ml.js
   ทุกไฟล์ที่ต้องเก็บข้อมูล (register, face-*, games, calibration, ml, charts) ──► db.js
   ทุกไฟล์ CSS ──► tokens.css (สีมาจากที่เดียว) ;  themes.css เปลี่ยนค่าตัวแปรใน tokens.css
```
**กฎของแผนที่:** ไฟล์ "ล่าง" (geometry, smoothing, validators, rep-counter) เป็น **ฟังก์ชันล้วน** ห้ามเรียกไฟล์ "บน" และห้ามแตะกล้อง/หน้าจอ — จึงทดสอบแยกได้ง่าย

## 4) หน้าจอในอนาคตต้องมีส่วนควบคุมอะไร (วางแผนไว้ก่อน)
- **หน้าลงทะเบียน:** ช่องกรอกข้อความ, ดรอปดาวน์ (เพศ มือข้างถนัด), สไลเดอร์ (ระดับมือสั่น 0-3), ปุ่มถัดไป/ย้อนกลับ สูง ≥ 56px
- **หน้าเกม:** แคนวาสวาดภาพเต็มจอ, แถบเวลา, คะแนน, ปุ่มหยุดชั่วคราวใหญ่, โหมดเดโมด้วยเมาส์
- **หน้าผลลัพธ์:** กราฟ, ปุ่มบันทึก CSV/PNG
