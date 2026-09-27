# Lab 32 — Measure Accuracy the Way a Researcher Does
### วัดความแม่นยำแบบนักวิจัย

**Goal:** produce Chapter 4 numbers — confusion matrix, precision/recall/F1 — and answer the lighting hypothesis with measured evidence.
เป้าหมาย: ได้ตัวเลขสำหรับบทที่ 4 และตอบสมมติฐานเรื่องแสงด้วยหลักฐานที่วัดได้จริง

## How to run / วิธีเปิด
- Windows: `start.bat` · Mac/Linux: `bash start.sh` · or `python -m http.server 8000` → http://localhost:8000
- Run it on the **same port as Lab 31** (8000) so it sees the same IndexedDB and can read the kNN model; otherwise use **📂 นำเข้าโมเดล JSON** with the file exported from Lab 31.
- No camera? **🤖 โหมดจำลอง** generates all three lighting rounds from synthetic hands with per-condition landmark noise and dropped frames, so every screen can be demoed. Results are tagged "ข้อมูลจำลอง — ห้ามใช้ในรายงาน".
- Node tests: `node tests/evaluate.test.mjs`

## How to use
1. Choose the detector: **rule-based 5 gestures** (pinch, fist, open, finger-tap, wrist-flex; the prediction is the active gesture with the highest score, or `none`) or **the kNN model from Lab 31** (read-only: the page only calls `predict`, nothing collected here is ever added to the model).
2. Pick repetitions (default **10** per gesture per light level) and the hypothesis number.
3. Select **☀️ สว่าง** → **▶️ เริ่มรอบนี้ด้วยกล้อง** → adjust the room light, watch the measured brightness in the dialog, and confirm → gestures are called out at random with a 2 s countdown. Detection is the **majority vote over a 1 s window** (frames with no hand count as `none`). Mean image brightness (`camera.measureBrightness`, 0–255) is recorded for every trial. Repeat for **💡 ปกติ** and **🌙 มืด**.
4. Results: colour-coded confusion grid (5 × 5 + `none` column; green diagonal, red errors, darker = more). Click a cell to list its trials (lighting, brightness, % frames with a hand, votes). Metrics table (per-gesture precision/recall/F1, macro averages, accuracy) with Thai explanations; accuracy-by-light bar chart and table; a Thai discussion paragraph generated from the numbers (📋 copy).
5. Export: **CSV** of every trial (with BOM), **PNG** of the confusion table and of the chart, **💾 save** the run to IndexedDB store `evaluations` (listed at the bottom; "เปิดดู" reloads a saved run).

## Files
| File | What it is |
|---|---|
| `index.html` | = **evaluate.html** |
| `js/evaluate.js` | pure: `confusionMatrix`, `accuracy`, `perClass` (precision/recall/F1, zero-division → 0), `macro`, `summarise`, `byCondition`, `majority`, `makeSchedule`, `topConfusion` |
| `js/discussion.js` | pure: `discussionTH(summary, byCondition, opts)` — Thai paragraph template filled with measured values |
| `js/detectors.js` | `ruleDetect`, `knnDetector`, simulation (`simulateTrials`, `SIM_LIGHT`, `buildDemoModel`) |
| `js/eval-run.js` | camera test runner (countdown, 1 s window, brightness sampling) |
| `js/eval-view.js` | grid, cell detail, metrics table, Thai metric help, confusion-matrix PNG drawing |
| `js/eval-page.js` | page logic, export, save/load runs |
| `js/ml.js`, `js/synth-hand.js`, `js/hand-source.js` | copies from Lab 31 |
| `js/gestures.js geometry.js camera.js hand.js vision.js charts.js db.js ui.js`, `css/*` | shared core (copied) |
| `tests/evaluate.test.mjs` | 17 node tests (hand-computed matrix, metrics, zero-division, majority, schedule, byCondition, simulation shows dim < bright, discussion contains the real numbers) |

## Blanks we filled in
| Blank in the prompt | Value we chose |
|---|---|
| Calls out gestures ___ times per gesture | **10** per light level (selector: 5 / 10 / 20 — the doc's hint suggests 20 for the final run) |
| Answer to hypothesis number ___ | **2** (editable field) ⚠️ *team: use the number of your lighting hypothesis in Chapter 1* |
| Team placeholders | "HandRehab Arcade", "ทีม NeonHands", "โรงเรียนของเรา" ⚠️ *team: change* |

## How to verify (MUST / PASS checklist)
- [ ] `node tests/evaluate.test.mjs` → "ผ่าน 17 ข้อ".
- [ ] Test data ≠ training data: for kNN, collect the model in Lab 31 first, then test with **new** performances here (the page never calls `addExample`/`save` on the model). If accuracy > 99 %, the discussion paragraph warns you.
- [ ] Brightness comes from the camera image, not the radio button — check the "ความสว่างเฉลี่ยที่วัดได้" column differs between rounds.
- [ ] Precision, recall and F1 are reported per gesture, not only accuracy.
- [ ] **PASS:** confusion table + full metrics + results for all three light levels + discussion paragraph (copy it into Chapter 4 and rewrite it in your own words).
- [ ] SHOULD: repeat on another day / with another tester and compare saved runs.
- Pitfall: numbers too good → you probably tested on the training data.
