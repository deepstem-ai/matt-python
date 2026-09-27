# SOURCES.md — ตารางที่มาของข้อมูล (Data provenance) · Lab 30

> กรอกทุกช่องให้ครบ 6 คอลัมน์ ก่อนใช้ข้อมูลชุดใดก็ตาม · ช่องที่เขียนว่า **verify** = ทีมต้องเปิดเว็บต้นทางตรวจข้อความสัญญาอนุญาตฉบับเต็มอีกครั้งแล้วแก้ให้ตรง
> วันที่ดาวน์โหลด: ใส่วันที่ทีมดาวน์โหลดจริง (รูปแบบ ปปปป-ดด-วว ค.ศ.) — ค่าในตารางด้านล่างเป็นวันที่สร้างตัวอย่าง

| ชื่อชุดข้อมูล (dataset name) | ลิงก์หลัก (primary link) | ลิงก์สำรอง (backup link) | เงื่อนไขสัญญาอนุญาต (licence terms) | วันที่ดาวน์โหลด (download date) | ใช้ทำอะไรในโครงงานนี้ (used for) |
|---|---|---|---|---|---|
| **HaGRID** — HAnd Gesture Recognition Image Dataset (Kapitanov et al.) | https://github.com/hukenovs/hagrid | บทความ arXiv:2206.08219 https://arxiv.org/abs/2206.08219 (verify) · สำเนาในเครื่อง `datasets/hagrid-annotations.json` | **CC BY-SA 4.0** — ใช้ได้ทั้งศึกษา/เชิงพาณิชย์ ต้องอ้างอิงผู้สร้าง และงานดัดแปลงที่เผยแพร่ต้องใช้สัญญาเดียวกัน | 2026-09-27 | เทียบชื่อท่ามือมาตรฐาน (palm, fist, ok, peace…) กับท่าของเรา · อ้างอิงในบทที่ 2-3 · ดูตัวอย่าง annotation ใน dataset viewer |
| **FreiHAND** — 3D hand pose & shape (Zimmermann et al., ICCV 2019) | https://lmb.informatik.uni-freiburg.de/projects/freihand/ | https://github.com/lmb-freiburg/freihand (โค้ดและลิงก์ดาวน์โหลด — verify) | **ใช้เพื่อการวิจัยเท่านั้น ห้ามเชิงพาณิชย์** (research-only — verify ข้อความเต็มบนเว็บไซต์) · ต้องอ้างอิงบทความ | 2026-09-27 | อ้างอิงว่าจุดข้อต่อมือ 21 จุดมีชุดข้อมูลมาตรฐาน 3 มิติ · ใช้ `training_xyz.json` บางส่วนเปิดดูใน viewer (ดาวน์โหลดเองที่บ้าน ไฟล์ใหญ่) |
| **MediaPipe Hand Landmarker** model (`hand_landmarker.task`, float16 v1) + model card | https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task | …/float16/latest/hand_landmarker.task · เอกสาร https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker · สำเนา `datasets/hand_landmarker.task` | **Apache License 2.0** (ตามการ์ดโมเดล — verify) · ต้องอ่าน model card เรื่องความเป็นธรรมและข้อจำกัด | 2026-09-27 | โมเดล AI ที่แอปใช้หาจุดมือ 21 จุด (Lab 16) · บทที่ 3 อธิบายที่มาของโมเดล |
| sample-hagrid-annotations.json (**synthetic** — ทีมสร้างเอง) | `datasets/sample-hagrid-annotations.json` (มากับแอป) | สร้างใหม่ได้จากสคริปต์มือจำลอง | ของทีม NeonHands · ข้อมูลจำลอง ไม่ใช่ข้อมูลจริงจาก HaGRID ห้ามรายงานเป็นผลการทดลอง | 2026-09-27 | ให้ viewer ทำงานได้แม้ไม่มีอินเทอร์เน็ต (42 ระเบียน, ~47 KB) |
| sample-landmarks.csv (**synthetic** — ทีมสร้างเอง) | `datasets/sample-landmarks.csv` (มากับแอป) | ส่งออกใหม่จาก Lab 19 / Lab 28 | ของทีม NeonHands · ถ้าแทนด้วยข้อมูลคนจริง ต้องมีใบยินยอม | 2026-09-27 | ตัวอย่างจุดมือ 21 จุด × 5 ท่า (60 แถว, ~23 KB) สำหรับทดลองก่อนเก็บข้อมูลจริง |

## ขนาดและจำนวนระเบียน (สำหรับบทที่ 3)
| ชุดข้อมูล | ขนาดไฟล์ที่ใช้ | จำนวนระเบียน | หมายเหตุ |
|---|---|---|---|
| sample-hagrid-annotations.json | 46,974 ไบต์ | 42 | synthetic |
| sample-landmarks.csv | 23,573 ไบต์ | 60 | synthetic |
| hand_landmarker.task | 7,819,105 ไบต์ | 2 ไฟล์ในซิป (hand_detector.tflite, hand_landmarks_detector.tflite) | ตรวจด้วย magic bytes `PK\x03\x04` |
| HaGRID / FreiHAND จริง | (กรอกหลังดาวน์โหลด) | (กรอกจาก viewer) | |

## ถ้าดาวน์โหลดที่โรงเรียนไม่ได้
ดาวน์โหลดที่บ้าน → ใส่แฟลชไดรฟ์ → วางไฟล์ในโฟลเดอร์ `datasets/` ตามชื่อที่หน้า viewer บอก → **ยังต้องบันทึกที่มาในตารางนี้ตามเดิม**
