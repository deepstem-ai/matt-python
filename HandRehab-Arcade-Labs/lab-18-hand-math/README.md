# Lab 18 · The Mathematics of the Hand
*คณิตศาสตร์ของมือ — ระยะที่ไม่ขึ้นกับระยะกล้อง*

**Goal:** measure finger distances so the value stays the same whether the hand is near or far, and whoever's hand it is. This is **feature engineering**. If the numbers you feed an AI still depend on camera distance, the AI learns the wrong thing.

## How to run / วิธีเปิด

- **Windows:** double-click `start.bat`
- **Mac / Linux:** `bash start.sh`
- **Any OS:** `python -m http.server 8000` in this folder, then open http://localhost:8000

Use Chrome or Edge and allow the camera. The hand model (~7.5 MB) downloads from Google the first time.
**No camera?** Press **🖱️ โหมดสาธิต** (or open `index.html?demo=1`). A synthetic hand appears, and you control it with the mouse, keyboard and sliders:
move = move the hand · hold mouse button or Space = pinch · hold 1–5 = curl thumb→little · F = fist · O = spread · W/S = flex/extend wrist · mouse wheel = nearer/farther.
To see the "model failed to download" screen, open `index.html?fail=1`.

> Placeholders to change / สิ่งที่ทีมต้องแก้เป็นของตัวเอง: app name "HandRehab Arcade", team "ทีม NeonHands", school "โรงเรียนของเรา" (bottom-right badge in each HTML page).

## What you see on `index.html` (the same page as `math-test.html`)

- **Two live columns side by side:**
  - **Left, raw pixel distance** `d(Pi,Pj)` for 4–8, 8–12, 4–20, 0–12 and 8–20, plus the palm size 0–9.
  - **Right, palm-normalised** `d(Pi,Pj) / d(P0,P9)`.
  - Each row shows *now / running min / running max / max÷min*, coloured green if ≤ 1.05 (≤ 5 %).
- A **column range ratio** (the mean of max÷min) under each column, with a verdict "✅ เปลี่ยนไม่เกิน 5%".
- A history chart of the last 10 s for pair 4–8. Both lines are divided by their first value, so raw swings while normalised stays at 1.0 between the ±5 % lines.
- Finger curl bars (0–1) for all five fingers, spreads for neighbouring fingers and index–little (degrees), and palm facing (ratio + "หันเข้ากล้อง/หันข้าง").
- ↺ resets min/max. In **demo mode**, "เคลื่อนเข้า-ออกเอง" is switched on automatically. The synthetic hand zooms 0.15↔0.45, the left column varies about 2.8×, and the right column stays at 1.000×.
- Points are converted to real pixels first (x·W, y·H, z·W), so both columns use the same units, and horizontal distances are not squashed by the 16:9 image.

## Files

| File | Purpose |
|---|---|
| `index.html`, `math-test.html` | the two-column test page (identical copies) |
| `js/geometry.js` | **core, pure maths**: `dist`, `palmScale` (P0–P9), `normDist`, `angle`, `fingerCurl`, `spread`, `handFacingCamera`, `squarePoints`, `scoreLow/High`. Thai errors for < 21 points and zero palm. Equations are in Thai comments. |
| `docs/math.md` | every equation with an explanation, ready for Chapter 3 |
| `tests/geometry.test.mjs` | `node tests/geometry.test.mjs`: synthetic hands at scales 0.10–0.50 prove invariance (12 tests) |
| `js/math-test.js` | this page's logic |
| `js/charts.js` | hand-written line chart (history) |
| shared | `hand.js`, `hand-app.js`, `demo-hand.js`, `synth-hand.js`, `camera.js`, `vision.js`, `ui.js`, `css/*` |

## Blanks we filled in

| Blank | Value | Why |
|---|---|---|
| Palm size from point ___ to point ___ | **0 (wrist) and 9 (middle-finger knuckle)** | The metacarpal bone does not bend, so the length stays the same whether you open or close your hand. **Not 0–12:** the middle fingertip moves toward the wrist when you make a fist (the test shows 0–12 changing by more than 1.5×). A ruler that stretches cannot measure anything. |

## How to verify (MUST / PASS)

- [ ] **Pure maths:** `node tests/geometry.test.mjs` → 12/12 pass without a camera. Example result: raw distance varies 5× across scales, normalised varies < 0.0001 %.
- [ ] **≤ 5 % in the right column:** keep one pose, press ↺, and move your hand toward and away from the camera 3 times. The right-column ratio should stay ≤ 1.05×, while the left column changes a lot. Screen-record it (SHOULD).
- [ ] **`docs/math.md` exists** and matches the comments in `js/geometry.js`.
- [ ] Error cases: `palmScale([])` throws "ต้องมีจุดมือครบ 21 จุด…". All points identical throws "ขนาดฝ่ามือเป็นศูนย์…". Nothing returns a silent NaN.
- [ ] SHOULD: classmates with bigger and smaller hands get close values in the right column.
