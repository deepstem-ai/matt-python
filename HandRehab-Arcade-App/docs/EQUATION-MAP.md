# เลขสมการในโค้ด ตรงกับบทความ JCSSE 2027

ปรับเมื่อ 10 พ.ย. 2569

ร่างเก่าของบทความมี 10 สมการ ฉบับที่จะส่งมี 6 สมการ คอมเมนต์ในโค้ดเคยอ้างเลขของร่างเก่า
ตอนนี้ไล่แก้ให้ตรงกับฉบับส่งแล้วทุกไฟล์ ตารางนี้คือสิ่งที่เปลี่ยน

| เลขเดิมในโค้ด | ของบทความฉบับส่ง | สมการ | อยู่ในไฟล์ |
|---|---|---|---|
| ไม่เคยมีเลข | **(1)** | แก้สัดส่วนภาพ x′ = x·(W/H) | `js/geometry.js` → `squarePoints` |
| ไม่เคยมีเลข | **(2)** | ระยะ 3 มิติ | `js/geometry.js` → `dist` |
| (1) | **(3)** | s = d(p0, p9) | `js/geometry.js` → `palmScale` |
| (2) | **(3)** | m = d(p4, p8) / s | `js/geometry.js` → `normDist` |
| (3) | **(4)** | π = clip((r − m)/(r − b), 0, 1) | `js/calibration.js` → `scoreFromMeasure` |
| (8) | **(5)** | T = r − k(r − b) | `js/calibration.js` → `thresholds` |
| (7) | **(6)** | เข้าเมื่อ π ≥ θ_on ออกเมื่อ π ≤ θ_off | `js/rep-counter.js` → `RepCounter.update` |
| (4) | ไม่มีเลข อยู่ในหัวข้อ III.F | α = 1/(1 + τ/dt) | `js/smoothing.js` → `smoothingAlpha` |
| (5) | ไม่มีเลข อยู่ในหัวข้อ III.F | ตัวกรองความถี่ต่ำพื้นฐาน | `js/smoothing.js` → `LowPass` |
| (6) | ไม่มีเลข อยู่ในหัวข้อ III.F | f_c = f_c,min + β|v| | `js/smoothing.js` → `OneEuroFilter` |

สมการสามตัวสุดท้ายไม่มีเลขกำกับ เพราะบทความเขียนรวมไว้ในเนื้อความของหัวข้อ III.F
เพื่อประหยัดเนื้อที่ ถ้าวันหน้าขยายเป็นบทความวารสารที่ยาวกว่านี้ ค่อยใส่เลขให้

## การอ้างหัวข้อ

ร่างเก่าอ้างเป็น §4.4 และ §6.2 ซึ่งไม่มีในฉบับส่งแล้ว เปลี่ยนเป็น

- §4.4 → หัวข้อ III.D การปรับเทียบรายบุคคล และ III.E การนับครั้ง
- §6.2 → หัวข้อ V.B ความเร็วเฟรม

## ถ้าแก้บทความแล้วเลขสมการขยับ

ต้องกลับมาแก้ที่นี่ด้วย ไฟล์ที่มีเลขสมการอยู่ในคอมเมนต์หรือบนหน้าจอ

```
js/geometry.js  js/calibration.js  js/rep-counter.js  js/smoothing.js
js/gestures.js  js/games/star-portal.js  js/calibrate-page.js
counter-lab.html  calibrate.html  research.html
js/i18n-dict-app.js   (คำแปลอังกฤษของข้อความบนหน้าจอ)
tests/calibration.test.mjs  tests/math-model.test.mjs
docs/MATH-MODEL.md
```

ตรวจว่าไม่มีเลขเก่าหลงเหลือด้วยคำสั่ง

```
grep -rn "สมการ (7)\|สมการ (8)\|(1)–(10)" --include=*.js --include=*.html --include=*.md .
```

ต้องไม่คืนอะไรออกมาเลย
