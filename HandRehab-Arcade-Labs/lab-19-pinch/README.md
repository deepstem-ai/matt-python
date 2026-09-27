# Lab 19 · Detect the Pinch Gesture
*ตรวจท่าจีบนิ้ว — ท่าบำบัดท่าแรก*

**Goal:** the first real therapy gesture, bringing the thumb tip to the index tip. When you pinch, a bar fills and you hear a sound. When you release, the bar falls back.

**Why pinch matters (for the report):** the tip-to-tip or pincer grasp underlies fine motor skill. After a stroke, arthritis or a hand injury it is often lost first and recovers last. Daily activities that depend on it include picking up coins or pills, buttoning, zips, holding a pen or spoon, opening small bottle caps and tying shoelaces. The Thai version of this explanation is in the comments of `js/pinch-test.js` and `js/gestures.js`.

## How to run / วิธีเปิด

- **Windows:** double-click `start.bat`
- **Mac / Linux:** `bash start.sh`
- **Any OS:** `python -m http.server 8000` in this folder, then open http://localhost:8000

Use Chrome or Edge and allow the camera. The hand model (~7.5 MB) downloads from Google the first time.
**No camera?** Press **🖱️ โหมดสาธิต** (or open `index.html?demo=1`). A synthetic hand appears, and you control it with the mouse, keyboard and sliders:
move = move the hand · hold mouse button or Space = pinch · hold 1–5 = curl thumb→little · F = fist · O = spread · W/S = flex/extend wrist · mouse wheel = nearer/farther.
To see the "model failed to download" screen, open `index.html?fail=1`.

> Placeholders to change / สิ่งที่ทีมต้องแก้เป็นของตัวเอง: app name "HandRehab Arcade", team "ทีม NeonHands", school "โรงเรียนของเรา" (bottom-right badge in each HTML page).

## What you see on `index.html` (the same page as `pinch-test.html`)

- Video with the skeleton. A **large score bar** (0.00–1.00) changes colour with the value: sky blue when low, amber in the middle, lime when active. A white marker shows the `on` threshold.
- **Raw pixel distance 4–8** and **normDist(4,8)** side by side.
- A large **pinch counter**. It uses a simple rising edge (counts when `active` goes false→true). Lab 21 fixes double counting properly.
- **Sliders for `full`, `zero` and `on`.** They write into `GESTURE_CONFIG.pinch` with `setGestureConfig`, so no number is baked into the function. Buttons switch to the hint values (0.15 / 0.60) or back to the code defaults.
- **⏺️ record → ⬇️ CSV**: one row per frame with `timestamp, t_ms, raw_px, norm, score, active`. The file has a UTF-8 BOM so Excel opens it correctly.
- **Sound:** press 🔇 once. Browsers only allow sound after a click. After that a Web Audio beep plays each time `active` flips false→true.
- Demo mode: hold the mouse button or Space to pinch. The thumb eases in, so the score rises smoothly.

## Files

| File | Purpose |
|---|---|
| `index.html`, `pinch-test.html` | the test page |
| `js/gestures.js` | **core** `detectPinch(pts, over)` → `{score, active, distance, details}`, `GESTURE_CONFIG`, `setGestureConfig` (plus the other 4 gestures for Lab 20) |
| `js/beep.js` | tiny Web Audio beep (no sound files) |
| `js/pinch-test.js` | page logic + rehab comments |
| `tests/gestures.test.mjs` | `node tests/gestures.test.mjs` (15 tests incl. "values adjustable from outside") |
| shared | `geometry.js`, `hand.js`, `hand-app.js`, `demo-hand.js`, `synth-hand.js`, `camera.js`, `vision.js`, `ui.js`, `css/*` |

## Blanks we filled in

| Blank | Value | Why |
|---|---|---|
| normDist between point ___ and ___ | **4 (thumb tip) and 8 (index tip)** | hint |
| Score = 1 at or below ___ | **0.25** (code default; hint 0.15 available as a button) | MediaPipe places fingertip points inside the finger pads, so touching tips often still measure about 0.15–0.25 palm units. With 0.15 a full score may be unreachable for some hands. Measure your own hand and adjust. |
| Score = 0 at or above ___ | **0.80** (hint 0.60 available) | a relaxed open hand measures about 1.0–1.2, so 0.8 gives a smooth ramp |
| active when score > ___ | **0.7** | hint. Lower values let the gesture trigger without real exercise. |
| (extra) `indexCurlMax` | 0.65 | If the index finger is curled more than this, it is a fist and not a pinch. This keeps the pinch bar down during a fist (Lab 20 rule: others < 30 %). |

## How to verify (MUST / PASS)

- [ ] **Values adjustable from outside:** move the sliders and watch the bar respond instantly. `node tests/gestures.test.mjs` includes a test that passes `over` and uses `setGestureConfig`.
- [ ] **Twenty pinches register:** press ⏺️, pinch 20 times, and press ⏹️. The counter reads 20 (if it double-counts, see Lab 21).
- [ ] **A real CSV:** press ⬇️ CSV and open it in Excel or Sheets. Plot `score` over `t_ms` to study the rise and fall (SHOULD).
- [ ] Beep: after 🔇→🔊, each new pinch beeps once.
- [ ] Write down the `full`/`zero` that suit your own hand, and compare with classmates (SHOULD).
