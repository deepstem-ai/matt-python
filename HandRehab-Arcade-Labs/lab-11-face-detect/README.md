# Lab 11 — Teach the App to See a Face
สอนแอปให้มองเห็นใบหน้า ด้วย MediaPipe Face Detector (BlazeFace) ที่ทำงานในเครื่องนี้ทั้งหมด

## Goal
Load the project's first AI model and find faces in every camera frame. Draw a glowing corner-bracket box with a confidence percentage over each face.

> **Privacy (write this into Chapters 2 and 5 of the report):** BlazeFace runs entirely on this computer. No image is ever sent over the internet.

## How to run
- Windows: double-click `start.bat`
- Mac / Linux: `bash start.sh`
- Or run `python -m http.server 8000` in this folder, then open http://localhost:8000
- Failure test: open `http://localhost:8000/?fail=1`. This uses broken model links on purpose, so you can see the Thai error box and its retry button.

The first run downloads the library (about 10 MB wasm) and the model (about 230 KB) from the internet.

## Files
| File | What it does |
|---|---|
| `index.html` | Face page: video + mirrored overlay canvas, control panel, experiment log |
| `js/vision.js` | Core AI module: loads `@mediapipe/tasks-vision@0.10.14` as an ES module, model primary link `/1/` then backup `/latest/`, **size check** (< 100 KB is rejected as a filter page), GPU then CPU fallback, `initVision`, `detectFaces`, `drawFaces`, `setFaceConfidence`, `getVisionInfo` |
| `js/face-page.js` | Camera → AI loading with progress bar → per-frame loop. Handles the confidence slider, face-count badge, confidence bar, box toggle, AI ms, GPU/CPU display, `?fail=1`, and the CSV experiment log |
| `js/face-fun.js` | Optional 👑 crown / 🕶️ sunglasses overlay (uses the eye keypoints) to check box accuracy |
| `js/camera.js`, `js/camera-errors.js` | Camera module and 4-case Thai camera errors (from Lab 10) |
| `js/ui.js`, `css/*` | Shared core |

Coordinates: face boxes and keypoints are **0–1 normalised**. The overlay canvas is set to the video's pixel size and mirrored with CSS (`class="mirror"`). Text labels (the % tags) are DOM elements whose `left` is mirrored in JS, so the text never appears back-to-front.

## Blanks we filled in
| Blank | Our value | Why |
|---|---|---|
| Minimum confidence threshold ___ | **0.5** (slider 0.3–0.9, takes effect instantly) | Hint default. Raise to 0.7 for false faces, lower to 0.3 if faces are missed |
| drawFaces draws a ___ style box | **Corner brackets** (viewfinder style), with plain rectangle as an option | The hint says it looks more professional |

Team placeholders to change: "HandRehab Arcade", "ทีม NeonHands", "โรงเรียนของเรา".

## How to verify (MUST / SHOULD / PASS)
1. **The box tracks your face** smoothly with a % tag. The badge shows the face count and the bar shows the best confidence.
2. **Turn away:** the box disappears, the badge shows 0, and the "ยังไม่พบใบหน้า" hint appears.
3. **GPU or CPU:** read it in the panel (หน่วยประมวลผล) together with **AI ms per frame**. Record both for Chapter 4.
4. **Backup link + size check (MUST):** in F12 → Network, the model file should be about 230 KB. Open `?fail=1`: both links fail, and a Thai error with 🔄 ลองใหม่ appears instead of a blank screen. A file under 100 KB is refused with "ไฟล์เล็กผิดปกติ".
5. **Three confidence values (SHOULD):** set 0.3, 0.5 and 0.7, press "＋ บันทึกผลตอนนี้" each time, then "⬇ ดาวน์โหลด CSV". Do the same in a bright room and a dark room (brightness is logged too).
6. **Crown / sunglasses (COULD):** choose one from "ของเล่นทดสอบตำแหน่ง" and check it sits on the head and eyes.
7. **Several classmates (COULD):** the badge counts every face.

## Notes / fixes to the shared core
- `camera.js` FPS-loop fix and track cleanup on failed start (same as Lab 10).
- `?fail=1` works by overwriting `MODELS.face_detector.url` before `initVision()`. `vision.js` itself is unchanged.
