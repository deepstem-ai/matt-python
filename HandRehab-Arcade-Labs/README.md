# HandRehab Arcade — 40 Labs, complete code

This folder has ready-to-run code for all 40 labs of **"HandRehab Arcade — A 40-Lab Practical Course"**. The course builds an AI-powered web app for hand and finger rehabilitation.

Each `lab-NN-*` folder is **self-contained**. It holds a copy of every file that lab needs, so you can open any lab by itself without opening the earlier ones first.

แต่ละโฟลเดอร์ `lab-NN-*` ทำงานได้ด้วยตัวเอง มีไฟล์ที่ต้องใช้ครบในโฟลเดอร์ ไม่ต้องพึ่งแลปอื่น

## How to run a lab

| Lab | How to open |
|-----|-------------|
| Lab 01 | Double-click `lab-01-camera-single-file/index.html` and open it with Chrome |
| Lab 02–40 | Open the lab folder. On Windows, double-click `start.bat`. On Mac or Linux, run `bash start.sh`. You can also run `python tools/serve.py 8000` in the folder (Lab 02: `python -m http.server 8000`) and open http://localhost:8000 |

- From Lab 02 on, open the app **through `http://localhost`**, not by double-clicking the file. Browsers refuse to load ES modules and AI models from `file://`.
- You need Chrome or Edge, a webcam, and Python 3 for the local server. From Lab 03 on, the launchers use `tools/serve.py` instead of plain `http.server`. It forces the correct file types, because on some Windows machines `.js` files are served as `text/plain`, which gives a blank app.
- The AI models (MediaPipe Tasks Vision 0.10.14, pinned) download from the internet the first time. Lab 35 shows how to run fully offline.
- Every lab has a `README.md`. It lists the goal, the files, the **blanks we filled in** (every `___` in that lab's prompt and the value chosen), and how to check the lab's PASS criteria.
- Pages that need a hand also offer a **demo mode** that uses the mouse, keyboard or a synthetic hand, so you can try them without a camera.

## Map

| Mission | Labs |
|---|---|
| 1 · Foundations | 01 camera in one file · 02 tiny server · 03 CLAUDE.md rulebook · 04 project structure + git |
| 2 · Look & feel | 05 colours & type · 06 glowing parts · 07 router · 08 splash · 09 senior mode & accessibility |
| 3 · People & faces | 10 camera module · 11 face detection · 12 registration · 13 storage & user management · 14 face capture · 15 face login |
| 4 · The hand | 16 21 points · 17 drawing styles · 18 hand maths · 19 pinch · 20 five gestures · 21 rep counter |
| 5 · Games | 22 game engine · 23 Star Portal · 24 Rhythm Tap · 25 Spread Wall |
| 6 · Personalise & measure | 26 score/combo/achievements · 27 One Euro filter + calibration · 28 session history · 29 progress charts |
| 7 · Research-grade AI & deployment | 30 datasets · 31 teach the AI (kNN) · 32 accuracy & lighting · 33 benchmark · 34 installable PWA · 35 fully offline |
| 8 · People, evidence, report | 36 user testing · 37 evidence · 38 Chapter 1 · 39 Chapters 3–5 · 40 presentation & plan B |

## Tech rules used in every lab (from the course's CLAUDE.md)

- Plain HTML, CSS and JavaScript (ES modules). No npm, no build step, no frameworks.
- The only external library is MediaPipe Tasks Vision, loaded from a CDN. Charts, kNN, filters and the game engine are hand-written.
- Code comments are in Thai for beginners, and the UI is in Thai.
- All colours come from `css/tokens.css`. Every button is at least 56 px tall.
- All data stays in the browser's IndexedDB (`handrehab-arcade`). No image or health data leaves the computer.

> The team name "ทีม NeonHands" and school "โรงเรียนของเรา" are placeholders. Change them to your own.

## Maths model (MITIJ article)

The labs use the same equation numbers as the team's article (MITIJ, "HandRehab Arcade"). Code comments say `สมการ (n)`.

| Eq. | Formula | Where in the labs | Source |
|---|---|---|---|
| (1) | s = ‖p0 − p9‖ (palm size, 3-D, every frame) | `js/geometry.js` `palmScale` — Lab 18 (`docs/math.md`), every copy | Zarrat Ehsan et al. 2026 (idea) |
| (2) | d̂ij = ‖pi − pj‖ / s | `js/geometry.js` `normDist` — Lab 18, every copy | Zarrat Ehsan et al. 2026 (idea) |
| (3) | π = clip((d_open − d̂48)/(d_open − d_close), 0, 1); defaults 0.80 / 0.25 | `js/gestures.js` `detectPinch`; Lab 19 sliders d_open / d_close; Lab 27 `scoreFromMeasure` (d_open = r, d_close = b) | team design |
| (4)–(6) | α = 1/(1 + 1/(2π f_c T_e)); x̂t = α xt + (1 − α) x̂t−1; f_c = f_c,min + β\|ẋ̂t\| | Lab 27 `js/smoothing.js` (`smoothingAlpha`, `OneEuroFilter`), `filters.html` | Casiez et al. 2012 |
| (7) | held ⇔ π ≥ θ_on, release ⇔ π ≤ θ_off; 5 states; cooldown 400 ms | `js/rep-counter.js` (Labs 21, 23, 26–28, 33–35); Star Portal PINCH_ON 0.7 / PINCH_OFF 0.3 | Schmitt 1938 |
| (8) | T = r − k(r − b), k_on 0.7, k_off 0.3 → θ_on 0.7, θ_off 0.3 for everyone; freeze thresholds (ตรึงเกณฑ์) for measurement | Lab 27 `js/calibration.js`, `calibrate.html` lock switch, session `details.thresholds` snapshot (Labs 27, 28) | team design |
| (9) | cos θ = A·B / (‖A‖‖B‖), clamped to 0..1 | `js/face-embed.js` `cosineSimilarity` (Labs 14, 15, 34, 35), Lab 15 `docs/cosine-similarity.md` | standard |
| (10) | EAR = (‖p2 − p6‖ + ‖p3 − p5‖)/(2‖p1 − p4‖) | `js/face-login.js` `eyeAspectRatio` (Labs 15, 34, 35) | Soukupová & Čech 2016 |

Evaluation plan (article §6.2) → tools:

- **FPS ≥ 25** on each platform → Lab 33 benchmark PASS/FAIL per scenario and overall (`js/fps-target.js`, also in Labs 34–35).
- **Counting accuracy** (system vs observer count from video, 3 light levels) → Lab 32 `counting.html` (accuracy %, MAE, chart, CSV).
- **Test–retest ICC ≥ 0.75** (Koo & Li 2016), first session excluded (Kim 2025) → Lab 32 `reliability.html` (ICC(2,1), ICC(3,1); verified on the Shrout & Fleiss 1979 table: 0.29 / 0.71).
- **SUS vs 68** → Lab 36 `survey.html?mode=sus` + `results.html` (SUS = 2.5 × [Σ(odd − 1) + Σ(5 − even)]).
- Reaction-time resolution ≈ 1000 / FPS (≈ 33 ms at 30 fps) → Rhythm Tap summary (Labs 24, 26, 28, 34, 35).
- Chapter 3 template with equations (1)–(10) and the evaluation plan → Lab 39.
