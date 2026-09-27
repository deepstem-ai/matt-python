# สรุปตัวเลขสำคัญ (SUMMARY) — HandRehab Arcade

> **กฎเหล็ก:** ทุกตัวเลขต้องบอกว่ามาจากไฟล์ไหน และวัดเมื่อไร — ห้ามใส่ตัวเลขที่ไม่มีไฟล์รองรับ
> ช่องที่ยังว่าง = ยังไม่ได้วัด ให้กลับไปทำแลปที่ระบุในคอลัมน์ "วัดที่" ก่อน
> วิธีเติมอัตโนมัติ: เปิด `index.html` ของ Lab 37 → ลากไฟล์ CSV ทั้งหมดใส่ → กด "คัดลอกตาราง SUMMARY" แล้ววางทับตารางด้านล่าง
> ค่าที่เป็น "ค่าเฉลี่ย" ให้เขียน ค่าเฉลี่ย ± SD และจำนวนตัวอย่าง (n) เสมอ

อัปเดตล่าสุด: ____-__-__ โดย ________

## 1. ประสิทธิภาพของระบบ

| ตัวชี้วัด | ค่า (เฉลี่ย ± SD, n) | ไฟล์ที่มา | วันที่วัด | วัดที่ |
|---|---|---|---|---|
| FPS เฉลี่ย · เครื่องที่ 1 (ชื่อ/สเปก: ________) | | evidence/02-charts-tables/lab33-benchmark.csv | | Lab 33 |
| FPS เฉลี่ย · เครื่องที่ 2 (________) | | evidence/02-charts-tables/lab33-benchmark.csv | | Lab 33 |
| FPS เฉลี่ย · เครื่องที่ 3 (________) | | evidence/02-charts-tables/lab33-benchmark.csv | | Lab 33 |
| FPS เฉลี่ย · เครื่องที่ 4 (________) | | evidence/02-charts-tables/lab33-benchmark.csv | | Lab 33 |
| FPS เฉลี่ย · เครื่องที่ 5 (________) | | evidence/02-charts-tables/lab33-benchmark.csv | | Lab 33 |
| เวลาประมวลผล AI ต่อเฟรม (ms) | | evidence/02-charts-tables/lab33-benchmark.csv | | Lab 16, 33 |

## 2. ความแม่นยำ

| ตัวชี้วัด | ค่า | ไฟล์ที่มา | วันที่วัด | วัดที่ |
|---|---|---|---|---|
| ความถูกต้องการเข้าระบบด้วยใบหน้า (%) | | evidence/02-charts-tables/lab15-face-login.csv | | Lab 15 |
| เวลาเข้าระบบด้วยใบหน้าเฉลี่ย (วินาที) | | evidence/02-charts-tables/lab15-face-login.csv | | Lab 15 |
| ความแม่นยำท่ามือรวม (%) | | evidence/02-charts-tables/lab32-evaluation.csv | | Lab 32 |
| ความแม่นยำท่ามือ · แสงสว่าง (%) + ความสว่างเฉลี่ยของภาพ | | evidence/02-charts-tables/lab32-evaluation.csv | | Lab 32 |
| ความแม่นยำท่ามือ · แสงปกติ (%) + ความสว่างเฉลี่ยของภาพ | | evidence/02-charts-tables/lab32-evaluation.csv | | Lab 32 |
| ความแม่นยำท่ามือ · แสงสลัว (%) + ความสว่างเฉลี่ยของภาพ | | evidence/02-charts-tables/lab32-evaluation.csv | | Lab 32 |
| ความแม่นยำ AI ท่าที่ทีมคิดเอง (kNN) (ถูก/10) | | evidence/02-charts-tables/(ไฟล์จาก Lab 31) | | Lab 31 |
| ความแม่นยำการนับครั้ง (%) (นับจริง 10 ครั้ง ระบบนับได้กี่ครั้ง) | | evidence/02-charts-tables/lab21-rep-test.csv | | Lab 21 |

## 3. ตัวกรองสัญญาณและผลการฝึก

| ตัวชี้วัด | ค่า | ไฟล์ที่มา | วันที่วัด | วัดที่ |
|---|---|---|---|---|
| การลดการสั่น · One Euro (%) / หน่วง (ms) | | evidence/02-charts-tables/lab27-filters.csv | | Lab 27 |
| การลดการสั่น · Moving Average (%) / หน่วง (ms) | | evidence/02-charts-tables/lab27-filters.csv | | Lab 27 |
| การลดการสั่น · Median (%) / หน่วง (ms) | | evidence/02-charts-tables/lab27-filters.csv | | Lab 27 |
| การกางนิ้วสูงสุด ครั้งแรก → ดีที่สุด (องศา) | | evidence/02-charts-tables/lab28-sessions.csv | | Lab 25, 28 |
| จำนวนรอบการฝึกที่บันทึก / จำนวนวัน | | evidence/02-charts-tables/lab28-sessions.csv | | Lab 28, 29 |

## 4. การทดสอบกับผู้ใช้จริง

| ตัวชี้วัด | ค่า | ไฟล์ที่มา | วันที่วัด | วัดที่ |
|---|---|---|---|---|
| จำนวนผู้ทดสอบ (คน) / เซ็นยินยอมครบ | | evidence/04-documents/lab36-task-results.csv | | Lab 36 |
| อัตราทำงานสำเร็จด้วยตนเอง (%) | | evidence/04-documents/lab36-task-results.csv | | Lab 36 |
| ค่าเฉลี่ยความพึงพอใจรวม (1–5) ± SD | | evidence/02-charts-tables/lab36-survey-responses.csv | | Lab 36 |
| ด้านความง่าย / สนุก / เหนื่อย / มั่นใจ / ความเป็นส่วนตัว (เฉลี่ยรายด้าน) | | evidence/02-charts-tables/lab36-survey-summary.csv | | Lab 36 |
| คะแนน SUS (ถ้าใช้แบบ SUS เพิ่ม) | | (ไฟล์ SUS) | | Lab 36 |
| จำนวนปัญหาที่พบ / แก้แล้ว | | evidence/04-documents/lab36-issues.csv | | Lab 36 |

## ตารางที่สร้างอัตโนมัติจากหน้า index.html

(วางผลจากปุ่ม "คัดลอกตาราง SUMMARY" ที่นี่)
