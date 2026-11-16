# แบบจำลองคณิตศาสตร์ · Math model — HandRehab Arcade

เอกสารนี้จับคู่ **สมการในบทความ JCSSE 2027** กับ **ไฟล์และฟังก์ชันในโค้ด** และ **การทดสอบ** ที่ยืนยันว่าโค้ดคำนวณตรงกับสูตร
This document maps each equation in the JCSSE 2027 paper to the code that implements it and the test that verifies it.

**ปรับเลขสมการใหม่เมื่อ 10 พ.ย. 2569** ร่างเก่ามี 10 สมการ ฉบับที่จะส่งมี 6 สมการ ตารางแปลงเลขอยู่ที่ `docs/EQUATION-MAP.md`

ตรวจทั้งหมดในคำสั่งเดียว · Verify everything: `node --test tests/*.mjs` (110 ข้อ) และ `python3 will_kit/scripts/test_pipeline.py` (41 ข้อ)
ในโค้ด ทุกสมการมีคอมเมนต์ `สมการ (n) ของบทความ` กำกับ ค้นหาได้ด้วย `grep -rn "สมการ (" js/`

## สมการที่อยู่ในบทความ

| บทความ | สมการ · Equation | ไฟล์ : ฟังก์ชัน · Code | หัวข้อ | ที่มา · Source | การทดสอบ · Test |
|---|---|---|---|---|---|
| **(1)** | `x′ = x·(W/H)`, `y′ = y`, `z′ = z·(W/H)` แก้สัดส่วนภาพ | `js/geometry.js : squarePoints` · เรียกจาก `js/hand.js` ด้วย `aspect = videoWidth/videoHeight` | III.B | authors | math-model: aspect correction |
| **(2)** | `d(p_a,p_b) = √(Δx² + Δy² + Δz²)` ระยะ 3 มิติ | `js/geometry.js : dist` | III.C | standard formula | math-model |
| **(3)** | `s = d(p0,p9)` · `m = d(p4,p8)/s` ระยะหารขนาดฝ่ามือ | `js/geometry.js : palmScale, normDist` | III.C | authors, after Zarrat Ehsan et al. (2026) | math-model: scale invariance ×3 |
| **(4)** | `π = clip((r − m)/(r − b), 0, 1)` คะแนนของท่า | ปรับเทียบแล้ว `js/calibration.js : scoreFromMeasure` · ยังไม่ปรับเทียบ `js/gestures.js : detectPinch` กับ `geometry.js : scoreLow` (r = d_open 0.80, b = d_close 0.25) | III.D | authors | math-model: 6 ค่าก่อนปรับเทียบ + 5 ค่าหลังปรับเทียบ |
| **(5)** | `T = r − k(r − b)`, k_on = 0.7, k_off = 0.3 → `π(T) = k` | `js/calibration.js : thresholds, buildRecord, ENTRY_K, EXIT_K, THETA_ON, THETA_OFF` | III.D | authors | calibration.test: `π(T_on) = 0.7`, `π(T_off) = 0.3` |
| **(6)** | `เข้า ⇔ π ≥ θ_on` · `ออก ⇔ π ≤ θ_off` + ห้าสถานะ + minHold 200 ms + cooldown 400 ms | `js/rep-counter.js : RepCounter.update` · ขอบของเกม `js/games/star-portal.js : update` | III.E | after Schmitt (1938) | rep-counter.test: ทุกสถานะ, cooldown, ค้างไม่ครบเวลา |

## สมการที่บทความเขียนไว้ในเนื้อความ ไม่มีเลขกำกับ

บทความรวมสามตัวนี้ไว้ในย่อหน้าของหัวข้อ III.F เพื่อประหยัดเนื้อที่ ถ้าวันหน้าขยายเป็นบทความวารสาร ค่อยใส่เลขให้

| สมการ | ไฟล์ : ฟังก์ชัน | หัวข้อ | ที่มา | การทดสอบ |
|---|---|---|---|---|
| `α = 1/(1 + τ/dt)`, `τ = 1/(2π f_c)` | `js/smoothing.js : smoothingAlpha` | III.F | Casiez, Roussel & Vogel (2012) | smoothing.test |
| `x̂_t = α x_t + (1 − α) x̂_(t−1)` | `js/smoothing.js : LowPass.filter` | III.F | Casiez et al. (2012) | math-model: 90 เฟรมเทียบสูตรตรง |
| `f_c = f_c,min + β·|ẋ̂_t|` (ẋ̂ กรองด้วย dCutoff = 1 Hz) | `js/smoothing.js : OneEuroFilter.filter` | III.F | Casiez et al. (2012) | smoothing.test |

**หน่วยของ β** ขึ้นกับหน่วยของสัญญาณที่กรอง ในเกมกรองตำแหน่งตัวชี้เป็นพิกเซลของ canvas ในการเปรียบเทียบตัวกรองกรองค่าที่หารขนาดฝ่ามือแล้ว **ตัวเลขในตารางที่ 2 ของบทความใช้กับอย่างหลัง**

## ค่าคงที่ของท่าอื่น อยู่ในหัวข้อ III.C และ III.D ของบทความ

| ค่า | ความหมาย | ไฟล์ : ฟังก์ชัน |
|---|---|---|
| 0.5, 2.5, 110°, 70° | ความงอของนิ้ว ถ่วงน้ำหนักข้อโคนครึ่งเดียว หาร 2.5 แล้วแมป 180° ลงมาในช่วง 110° สำหรับนิ้ว และ 70° สำหรับนิ้วโป้ง | `js/geometry.js : fingerCurl` |
| 0.6 | เกณฑ์สัดส่วนเวกเตอร์ตั้งฉากฝ่ามือ ต้องหันเข้ากล้องอย่างน้อยเท่านี้จึงอ่านท่า | `js/geometry.js : handFacingCamera` |
| 0.35, 0.15 | ตัวจับครั้งระหว่างปรับเทียบ หลวมกว่า θ_on/θ_off เพราะยังไม่รู้ช่วงจริงของผู้ใช้ | `js/calibration.js : PeakTracker` |
| 5 วินาที, 5 ครั้ง | ถือมือนิ่งวัดอาการสั่น และทำท่าซ้ำเพื่อหาค่าที่ดีที่สุด | `js/calibration.js : STILL_SEC, REPS_NEEDED` |

## สมการที่ไม่ได้อยู่ในบทความ JCSSE 2027

สองตัวนี้เป็นของระบบเข้าสู่ระบบด้วยใบหน้า ซึ่งบทความไม่ได้กล่าวถึงเลย เก็บไว้ที่นี่เพื่อให้เอกสารครบ **ห้ามอ้างเป็นสมการของบทความ**

| สมการ | ไฟล์ : ฟังก์ชัน | ที่มา |
|---|---|---|
| `cos θ = (A·B)/(‖A‖‖B‖)` ความคล้ายของใบหน้า | `js/face-embed.js : cosineSimilarity` | standard formula |
| `EAR = (‖p2−p6‖ + ‖p3−p5‖)/(2‖p1−p4‖)` ตรวจการกะพริบตา | `js/face-login.js : eyeAspectRatio, bothEyesEAR, BlinkDetector` | Soukupová & Čech (2016) |

## ตรึงเกณฑ์ · Frozen thresholds (กฎการวัดผล · หัวข้อ III.D)

- ระเบียนปรับเทียบ (`store calibration`, id = `userId:gesture`) มีฟิลด์ `locked` และ `lockedAt` ตั้งได้ที่ `calibrate.html` · `js/calibration.js : setCalibrationLock, listCalibrations`
- ปรับเทียบใหม่ในท่าที่ถูกล็อก ต้องกดยืนยันปลดล็อกก่อน (`calibrate-page.js : confirmUnlock`, `spread-wall-page.js : calibrate`)
- ทุกเซสชันเก็บภาพถ่ายเกณฑ์ที่ใช้จริง `session.calib` (`calibration.js : calibSnapshot`, `recorder.js : SessionRecorder.start`) ถ้าไม่ปรับเทียบจะเป็น `source: 'default'` (r = 0.80, b = 0.25)

## แผนการประเมิน · Evaluation plan — `js/research/stats.js`

**เตือน** ตารางนี้คือสิ่งที่แอปทำได้ **ไม่ใช่สิ่งที่บทความ JCSSE 2027 รายงาน** บทความฉบับนั้นรายงานเฉพาะความถูกต้องของสูตร ความเร็วเฟรม และการเปรียบเทียบตัวกรอง **ไม่มีตัวเลขความแม่น ความเที่ยง หรือ SUS อยู่ในบทความเลย** เพราะยังไม่ได้ทดลองกับคน

| ด้าน | สูตร / เกณฑ์ | โค้ด | หน้า | อยู่ในบทความไหม |
|---|---|---|---|---|
| ความเร็วเฟรม | เป้าหมาย 25 fps | `stats.js : fpsPass`, `recommend.js : TARGET_FPS` | `benchmark.html` | **อยู่** ตารางที่ 3 |
| เปรียบเทียบตัวกรอง | ลดการสั่น, หน่วง cross-correlation, หน่วงขั้นบันได | `smoothing.js : jitterReduction, lagMs, stepDelayMs` · `signal.js : benchmark` | `filters.html` | **อยู่** ตารางที่ 4 |
| ความละเอียดเวลา | `1000 / fps` ms | `stats.js : timingResolutionMs` | สรุปผล Rhythm Tap | ไม่อยู่ |
| ความถูกต้องการนับ | `accuracy = 1 − |sys − obs| / obs`, MAE, แสง 3 ระดับ | `stats.js : countAccuracy, countSummary, lightFromBrightness` | `count-accuracy.html` | **ไม่อยู่** ยังไม่ได้วัด |
| ความเที่ยงวัดซ้ำ | ICC(2,1) และ ICC(3,1) ตัดเซสชันแรก | `stats.js : icc, iccBand, buildIccMatrix` | `reliability.html` | **ไม่อยู่** ยังไม่ได้วัด |
| ความสามารถในการใช้งาน | SUS = 2.5 × [Σ(ข้อคี่ − 1) + Σ(5 − ข้อคู่)] เทียบ 68 | `stats.js : susScore, susInterpret` | `survey.html?mode=sus` | **ไม่อยู่** ยังไม่ได้วัด |

ข้อมูลจำลองถูกตัดออกจากการคำนวณทุกหน้า เว้นแต่เปิดสวิตช์รวมข้อมูลจำลอง และทุกหน้าเครื่องมือวิจัยแสดงป้าย **ลบข้อมูลจำลองก่อนเก็บข้อมูลวิจัย** เมื่อพบข้อมูลจำลอง (`js/research/research-data.js : demoBanner`)

## English summary

Landmark coordinates are first rescaled so every axis is in units of image height (1). Distances are three-dimensional (2) and are divided by the palm size of the same frame (3), so they do not depend on how far the hand is from the camera. The thumb-to-index measure becomes a score with the user's own resting and best anchors (4); without calibration r = 0.80 and b = 0.25. Entry and exit thresholds come from one expression (5), which makes the thresholds land at exactly 0.7 and 0.3 on the score scale for every user. Repetitions are counted with those two thresholds, a five-state machine, a 200 ms minimum hold and a 400 ms cooldown (6). The pointer is smoothed with the 1€ filter, whose three expressions the paper gives in the text of Section III.F rather than as numbered equations. Thresholds must be frozen when the system is used for measurement.

## References · เอกสารอ้างอิง

ตรวจแล้วทุกรายการเมื่อ 10 พ.ย. 2569

- Brooke, J. (1996). SUS: A "quick and dirty" usability scale. In *Usability Evaluation in Industry* (pp. 189–194). Taylor & Francis.
- Casiez, G., Roussel, N. and Vogel, D. (2012). 1€ filter: A simple speed-based low-pass filter for noisy input in interactive systems. *CHI '12*, 2527–2530. https://doi.org/10.1145/2207676.2208639
- Koo, T.K. and Li, M.Y. (2016). A guideline of selecting and reporting intraclass correlation coefficients for reliability research. *J. Chiropractic Medicine* 15(2): 155–163. https://doi.org/10.1016/j.jcm.2016.02.012
- Schmitt, O.H. (1938). A thermionic trigger. *J. Scientific Instruments* 15(1): 24. https://doi.org/10.1088/0950-7671/15/1/305 — **หน้าเริ่ม 24 เท่านั้น** ยืนยันหน้าสิ้นสุดไม่ได้จากฐานข้อมูลที่เปิดอ่านฟรี
- Shrout, P.E. and Fleiss, J.L. (1979). Intraclass correlations: Uses in assessing rater reliability. *Psychological Bulletin* 86(2): 420–428. https://doi.org/10.1037/0033-2909.86.2.420
- Soukupová, T. and Čech, J. (2016). Real-time eye blink detection using facial landmarks. *21st Computer Vision Winter Workshop*. https://vision.fe.uni-lj.si/cvww2016/proceedings/papers/05.pdf
- Zarrat Ehsan, T., Tangermann, M., Güçlütürk, Y., Shin, S., Ho, K.C., Bloem, B.R. and Evers, L.J.W. (2026). Interpretable and granular video-based quantification of motor characteristics from the finger-tapping test in Parkinson's disease. *npj Parkinson's Disease* 12(1). https://doi.org/10.1038/s41531-026-01307-w — **ตีพิมพ์แล้ว ห้ามอ้าง preprint arXiv:2506.18925 อีก**
