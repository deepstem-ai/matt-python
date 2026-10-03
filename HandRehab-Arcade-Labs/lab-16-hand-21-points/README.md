# Lab 16 · See the Hand as 21 Points
*เห็นมือเป็น 21 จุด — Mission 4 (the hand)*

**Goal:** make the computer see your fingers. Raise your hand, and 21 points with their connecting lines follow every movement. The page also records the frame rate and the AI time per frame as your reference numbers.

**How the AI works (for Chapter 2):** MediaPipe Hand Landmarker works in two stages. (1) A small **palm detector** finds the palm in the whole image. (2) A **landmark model** looks only inside that box and places 21 points. Once a hand is being tracked, the next frames reuse the previous box and skip stage 1. This is why it is fast.

## How to run / วิธีเปิด

- **Windows:** double-click `start.bat`
- **Mac / Linux:** `bash start.sh`
- **Any OS:** `python -m http.server 8000` in this folder, then open http://localhost:8000

Use Chrome or Edge and allow the camera. The hand model (~7.5 MB) downloads from Google the first time.
**No camera?** Press **🖱️ โหมดสาธิต** (or open `index.html?demo=1`). A synthetic hand appears, and you control it with the mouse, keyboard and sliders:
move = move the hand · hold mouse button or Space = pinch · hold 1–5 = curl thumb→little · F = fist · O = spread · W/S = flex/extend wrist · mouse wheel = nearer/farther.
To see the "model failed to download" screen, open `index.html?fail=1`.

> Placeholders to change / สิ่งที่ทีมต้องแก้เป็นของตัวเอง: app name "HandRehab Arcade", team "ทีม NeonHands", school "โรงเรียนของเรา" (bottom-right badge in each HTML page).

## What you see on `index.html` (the same page as `hand-test.html`)

- Live mirrored video with the skeleton. Each finger has its own theme colour (`--f-thumb … --f-little` in `css/tokens.css`), and fingertips are drawn bigger with a glow. A switch shows or hides the skeleton.
- Stats: **FPS**, **AI ms per frame**, **% of frames with a hand**, **GPU/CPU**, and **which hand** with its confidence. MediaPipe assumes a mirrored image, so the page swaps Left/Right to report the real hand.
- A collapsible table of all 21 points (x, y, z) with **Thai landmark names**, updated every frame. Fingertip rows are highlighted.
- Hover over a point on the video to see its name (a COULD-DO item).
- **⏱️ บันทึกค่าอ้างอิง 10 วินาที** measures average FPS, AI ms and % found for 10 s. It prints `console.table`, checks FPS > 15, and offers a CSV.
- If the model fails on both links, a Thai message appears with a **manual download link**, a retry button and a demo-mode button. The screen is never blank. You can test this with `?fail=1`.
- The camera is released on `pagehide` (the camera light goes off when you leave).
- `?hands=2` detects two hands. The second hand is drawn in one colour, so you can compare the FPS.

## Files

| File | Purpose |
|---|---|
| `index.html`, `hand-test.html` | the test page (identical copies) |
| `js/hand.js` | **core**: `initHand`, `detectHand`, `drawHand`, `getStats`, `LANDMARK_TH`, `fitCanvas` |
| `js/vision.js` | MediaPipe loader, model download with backup link and size check, GPU→CPU fallback |
| `js/camera.js` | open and close the camera, with Thai error messages |
| `js/geometry.js` | pure maths (used by `hand.js` for `squarePoints`) |
| `js/hand-app.js` | page skeleton shared by Labs 16–21: camera → model → loop, Thai errors, demo mode, `?fail=1` |
| `js/demo-hand.js`, `js/synth-hand.js` | demo mode: synthetic 21-point hand |
| `js/hand-test.js` | this page's logic |
| `js/ui.js`, `css/*` | shared UI helpers, tokens, themes, parts, lab layout |

## Blanks we filled in

| Blank in the prompt | Value | Why |
|---|---|---|
| Number of hands | **1** | Exercises use one hand at a time, and 1 hand runs almost twice as fast as 2. Try `?hands=2` to compare the FPS. |
| Minimum detection confidence | **0.5** | The hint's starting value. Lower values give more false hands, higher values miss hands in dim light. |
| Minimum tracking confidence | **0.5** | The hint's starting value. If the hand keeps getting lost, lower it to 0.3–0.4 (in `hand-test.js`). |
| (also set) min hand presence | 0.5 | the default in `hand.js` |
| Model size check | ≥ 5 MB (real file ≈ 7.5 MB) | A much smaller file is a school web-filter block page, not the model. |

Model links: primary `…/hand_landmarker/float16/1/hand_landmarker.task`, backup `…/float16/latest/…` (`vision.js → modelUrls`).

## Article alignment (MITIJ article)

- `js/geometry.js` comments now cite the article equation numbers: **eq. (1)** palm size s = ‖p0 − p9‖ (`palmScale`) and **eq. (2)** d̂ij = ‖pi − pj‖ / s (`normDist`). Comments only — no behaviour change.

## How to verify (MUST / PASS)

- [ ] **Backup link and size check:** open `index.html?fail=1`. The console shows both links tried, and the Thai error box shows a manual download link and retry buttons.
- [ ] **21 points follow your hand:** raise your hand about 50 cm from the camera. All 21 rows of the table update.
- [ ] **FPS > 15, and the reference numbers are recorded:** press ⏱️ with your hand in view. Copy avg FPS, AI ms, % found and GPU/CPU into your report (or use the CSV).
- [ ] SHOULD: turn your hand side-on and watch points vanish or jump (for Chapter 5). Repeat ⏱️ under 3 lighting conditions and record the % of frames with a hand.
- [ ] Camera released: close the tab or navigate away. The camera light goes off.
