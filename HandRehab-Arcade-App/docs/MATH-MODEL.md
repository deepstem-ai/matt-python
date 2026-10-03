# แบบจำลองคณิตศาสตร์ · Math model — HandRehab Arcade (FingerRehab)

เอกสารนี้จับคู่ **สมการ (1)–(10) ในบทความ** กับ **ไฟล์/ฟังก์ชันในโค้ด** และ **การทดสอบ** ที่ยืนยันว่าโค้ดคำนวณตรงกับสูตร
This document maps every equation (1)–(10) of the article to the code that implements it and the test that verifies it.

ตรวจทั้งหมดในคำสั่งเดียว · Verify everything: `node tests/math-model.test.mjs` (และ `node tests/calibration.test.mjs`, `node tests/smoothing.test.mjs`, `node js/research/tests/rep-counter.test.mjs`).
ในโค้ด ทุกสมการมีคอมเมนต์ `สมการ (n)` กำกับ — ค้นหาได้ด้วย `grep -rn "สมการ (" js/`

| # | สมการ · Equation | ไฟล์ : ฟังก์ชัน · Code | บทความ · Section | ที่มา · Source | การทดสอบ · Test |
|---|---|---|---|---|---|
| (1) | `s = ‖p0 − p9‖` palm size (3-D, per frame) | `js/geometry.js : palmScale` (`dist`) | §4.4 | authors, after Zarrat Ehsan et al. (2026) | math-model: "(1) s = ‖p0 − p9‖" |
| (2) | `d̂_ij = ‖p_i − p_j‖ / s` palm-normalised distance | `js/geometry.js : normDist` | §4.4 | authors, after Zarrat Ehsan et al. (2026) | math-model: "(2) …", scale invariance ×3 |
| (3) | `π = clip((d_open − d̂48)/(d_open − d_close), 0, 1)` pinch score | uncalibrated: `js/gestures.js : detectPinch` (`GESTURE_CONFIG.pinch` zero = d_open 0.80, full = d_close 0.25; `geometry.js : scoreLow`) · calibrated: `js/calibration.js : scoreFromMeasure` (d_open = rest r, d_close = best b) · used by `js/games/star-portal.js : readInput`, `js/calibrate-page.js : step4` | §4.4 | authors | math-model: "(3) …" (6 uncalibrated + 5 calibrated values) |
| (4) | `α = 1 / (1 + 1/(2π f_c T_e))` | `js/smoothing.js : smoothingAlpha` | §4.4 | Casiez, Roussel & Vogel (2012) | math-model: "(4) …"; smoothing.test |
| (5) | `x̂_t = α x_t + (1 − α) x̂_(t−1)` | `js/smoothing.js : LowPass.filter`, `OneEuroFilter.filter` | §4.4 | Casiez et al. (2012) | math-model: "(5)(6) … ทุกเฟรม" (90 frames vs direct formula) |
| (6) | `f_c = f_c,min + β |ẋ̂_t|` (ẋ̂ filtered with d_cutoff) | `js/smoothing.js : OneEuroFilter.filter` | §4.4 | Casiez et al. (2012) | same as (5) |
| (7) | `held ⇔ π_t ≥ θ_on ; release ⇔ π_t ≤ θ_off ; θ_on > θ_off` + 5 states, cooldown ≈ 400 ms | `js/rep-counter.js : RepCounter.update` (default enter 0.7, exit 0.3, cooldownMs 400) · game edge test `js/games/star-portal.js : update` (`PINCH_ON = THETA_ON`, `PINCH_OFF = THETA_OFF`, `<=`) | §4.4 | after Schmitt (1938) | math-model: "held ⇔ π ≥ θ_on", "release ⇔ π ≤ θ_off", "ภายใน 400 ms …", "พ้น cooldown …"; rep-counter.test |
| (8) | `T = r − k (r − b)`, k_on = 0.7 (entry), k_off = 0.3 (exit) → `π(T) = k`, so θ_on = 0.7, θ_off = 0.3 for everyone | `js/calibration.js : thresholds`, `buildRecord`, `ENTRY_K/EXIT_K`, `THETA_ON/THETA_OFF`; tremor → `classifyTremor`, `TREMOR_LEVELS` (lower f_c,min + larger grab radius) | §4.4 | authors | math-model: "(8) T = r − k(r − b)", "π(T_on) = 0.7, π(T_off) = 0.3"; calibration.test |
| (9) | `cos θ = (A·B)/(‖A‖‖B‖)` face similarity | `js/face-embed.js : cosineSimilarity` (re-exported by `js/face-login.js`) — negative values clipped to 0 for display/threshold only | §4.5 | standard formula | math-model: "(9) …" |
| (10) | `EAR = (‖p2 − p6‖ + ‖p3 − p5‖)/(2‖p1 − p4‖)`, p1..p6 = 33,160,158,133,153,144 (right) / 362,385,387,263,373,380 (left) | `js/face-login.js : eyeAspectRatio`, `bothEyesEAR`, `EYE_RIGHT`, `EYE_LEFT`, `BlinkDetector` | §4.5 | Soukupová & Čech (2016) | math-model: "(10) …", landmark indices |

## ตรึงเกณฑ์ · Frozen thresholds (measurement rule, §4.4)

- ระเบียนปรับเทียบ (`store calibration`, id = `userId:gesture`) มีฟิลด์ `locked` (+ `lockedAt`) — ตั้งได้ที่ `calibrate.html` (สวิตช์ "ตรึงเกณฑ์" ต่อท่า หรือปุ่ม "🔒 ตรึงเกณฑ์นี้" หลังปรับเทียบ) · `js/calibration.js : setCalibrationLock, listCalibrations`
- ปรับเทียบใหม่ในท่าที่ถูกล็อก ต้องกดยืนยัน "ปลดล็อกและปรับเทียบใหม่" ก่อน (`calibrate-page.js : confirmUnlock`, `spread-wall-page.js : calibrate`)
- ทุกเซสชันเก็บภาพถ่ายเกณฑ์ที่ใช้จริง `session.calib = { gesture, rest, best, entry, exit, thetaOn, thetaOff, locked, calibratedAt, source }` (`calibration.js : calibSnapshot`, `recorder.js : SessionRecorder.start`) · ไม่ปรับเทียบ = `source: 'default'` (d_open 0.80 / d_close 0.25)
- หน้าประวัติแสดงป้าย 🔒 และกรองได้ · หน้ากราฟ, ICC, ความถูกต้องการนับ มีสวิตช์ "เฉพาะเซสชันเกณฑ์ตรึง"

## แผนการประเมิน · Evaluation plan (§6.2) — `js/research/stats.js`

| ด้าน | สูตร / เกณฑ์ | โค้ด | หน้า | การทดสอบ |
|---|---|---|---|---|
| ประสิทธิภาพ | FPS ≥ 25 ทุกแพลตฟอร์ม | `stats.js : fpsPass`, `recommend.js : TARGET_FPS, recommend` | `benchmark.html` (PASS/FAIL ต่อสถานการณ์ + ภาพรวม) | math-model |
| ความละเอียดเวลา | `1000 / fps` ms (30 fps ≈ 33 ms, §4.3) | `stats.js : timingResolutionMs`, `rhythm-tap-page.js : finish` | สรุปผล Rhythm Tap | math-model |
| ความถูกต้องการนับ | `accuracy = 1 − |sys − obs| / obs`, MAE, แสง 3 ระดับ | `stats.js : countAccuracy, countSummary, lightFromBrightness` | `count-accuracy.html` (settings key `count-accuracy`) | math-model |
| ความเที่ยงวัดซ้ำ | ICC(2,1) = (MSR − MSE)/(MSR + (k−1)MSE + k(MSC − MSE)/n) · ICC(3,1) = (MSR − MSE)/(MSR + (k−1)MSE) · ตัดเซสชันแรก · < 0.5 ต่ำ, 0.5–0.75 ปานกลาง, 0.75–0.9 ดี, > 0.9 ดีเยี่ยม | `stats.js : icc, iccBand, buildIccMatrix` | `reliability.html` | Shrout & Fleiss (1979) table: ICC(2,1) = 0.29, ICC(3,1) = 0.71 |
| ความสามารถในการใช้งาน | SUS = 2.5 × [Σ(ข้อคี่ − 1) + Σ(5 − ข้อคู่)] เทียบ 68 | `stats.js : susScore, susInterpret`, `js/research/sus-data.js : SUS_ITEMS` | `survey.html?mode=sus` → `survey-results.html` | all 3s = 50, ideal = 100 |

ข้อมูลจำลอง (ประวัติ 30 วัน, ผู้ใช้ตัวอย่าง, โหมดสาธิตเมาส์) ถูกตัดออกจากการคำนวณทุกหน้า เว้นแต่เปิด "รวมข้อมูลจำลอง" และทุกหน้าเครื่องมือวิจัยแสดงป้าย **"ลบข้อมูลจำลองก่อนเก็บข้อมูลวิจัย"** เมื่อพบข้อมูลจำลอง (`js/research/research-data.js : demoBanner`).

## English summary

Distances are divided by the palm size of the same frame (1)–(2), so they do not depend on the distance to the camera. The thumb–index distance becomes a pinch score with the user's own open/pinch distances (3); without calibration d_open = 0.80 and d_close = 0.25. The pointer is smoothed with the One Euro filter (4)–(6). Reps are counted with two thresholds and a five-state machine with a 400 ms cooldown (7). Calibration measures the rest value r and the best value b and sets T = r − k(r − b) (8); because the score is built with d_open = r and d_close = b, π(T) = k, so the score thresholds are 0.7 / 0.3 for every user. Thresholds must be frozen when the system is used for measurement. Face login uses cosine similarity (9) and a blink check with the eye aspect ratio (10).

## References · เอกสารอ้างอิง

- Brooke, J. (1996). SUS: A "quick and dirty" usability scale. In *Usability Evaluation in Industry* (pp. 189–194). Taylor & Francis.
- Casiez, G., Roussel, N. and Vogel, D. (2012). 1€ filter: A simple speed-based low-pass filter for noisy input in interactive systems. *CHI '12*, 2527–2530. https://doi.org/10.1145/2207676.2208639
- Kim, J.S., Kim, H.J., Kim, M. and Kim, S.H. (2025). Hand motion control ability between young and older adults: Comparative study. *JMIR Formative Research* 9: e65224. https://doi.org/10.2196/65224
- Koo, T.K. and Li, M.Y. (2016). A guideline of selecting and reporting intraclass correlation coefficients for reliability research. *J. Chiropractic Medicine* 15(2): 155–163. https://doi.org/10.1016/j.jcm.2016.02.012
- Acharya, V. et al. (2025). Beyond the joystick: Deep learning games for hand movement recovery. *Frontiers in Rehabilitation Sciences* 6: 1653302. https://doi.org/10.3389/fresc.2025.1653302
- Schmitt, O.H. (1938). A thermionic trigger. *J. Scientific Instruments* 15(1): 24–26. https://doi.org/10.1088/0950-7671/15/1/305
- Shrout, P.E. and Fleiss, J.L. (1979). Intraclass correlations: Uses in assessing rater reliability. *Psychological Bulletin* 86(2): 420–428. https://doi.org/10.1037/0033-2909.86.2.420
- Soukupová, T. and Čech, J. (2016). Real-time eye blink detection using facial landmarks. *21st Computer Vision Winter Workshop*. https://vision.fe.uni-lj.si/cvww2016/proceedings/papers/05.pdf
- Zarrat Ehsan, T. et al. (2026). Interpretable and granular video-based quantification of motor characteristics from the finger-tapping test in Parkinson's disease. *npj Parkinson's Disease* 12: 101. https://doi.org/10.1038/s41531-026-01307-w
