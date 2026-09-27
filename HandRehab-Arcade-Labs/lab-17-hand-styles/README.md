# Lab 17 · Draw the Hand Well Enough to Show Off
*วาดมือ 3 สไตล์ + ลดเอฟเฟกต์อัตโนมัติเมื่อเครื่องช้า*

**Goal:** turn plain lines into an effect people react to, and step the effect down automatically when the machine cannot keep up. The page always tells the user when it does this.

## How to run / วิธีเปิด

- **Windows:** double-click `start.bat`
- **Mac / Linux:** `bash start.sh`
- **Any OS:** `python -m http.server 8000` in this folder, then open http://localhost:8000

Use Chrome or Edge and allow the camera. The hand model (~7.5 MB) downloads from Google the first time.
**No camera?** Press **🖱️ โหมดสาธิต** (or open `index.html?demo=1`). A synthetic hand appears, and you control it with the mouse, keyboard and sliders:
move = move the hand · hold mouse button or Space = pinch · hold 1–5 = curl thumb→little · F = fist · O = spread · W/S = flex/extend wrist · mouse wheel = nearer/farther.
To see the "model failed to download" screen, open `index.html?fail=1`.

> Placeholders to change / สิ่งที่ทีมต้องแก้เป็นของตัวเอง: app name "HandRehab Arcade", team "ทีม NeonHands", school "โรงเรียนของเรา" (bottom-right badge in each HTML page).

## What you see on `index.html` (the same page as `styles-test.html`)

- A segmented control with all three styles visible: **เรียบง่าย (simple)** · **นีออน (neon)** · **หางแสง (trail)**. The choice is remembered in prefs (`hr-prefs.handStyle`).
- Sliders: line thickness (5 px), fingertip glow layers (2), glow blur (12), trail length (12 frames). Colour pickers for each finger change the CSS variables `--f-*`, so no colour is written in code. ↺ resets them to the theme colours.
- Stats: FPS, draw ms per frame, AI ms, current style vs chosen style, GPU/CPU.
- **Automatic adaptation** (switch, on by default):
  - FPS **< 24 for 3 s** → steps down one style, with a polite Thai toast explaining why (e.g. "ขออนุญาตลดเอฟเฟกต์จาก "หางแสง" เป็น "นีออน" … 17 FPS …").
  - FPS **> 45 for more than 10 s** after a step-down → a **modal asks** whether to step back up. If you say no, it will not ask again for 1 minute.
  - **🐢 จำลองเครื่องช้า** adds an artificial delay that grows with the style. Use it to demo the downgrade and the "step back up?" question on a fast PC.
- **📊 วัด FPS ทั้ง 3 สไตล์** measures each style for 5 s. It prints `console.table` and shows a table (avg FPS, min FPS, draw ms) with a CSV button for your report. If no real hand is visible, it uses a moving synthetic hand and says so.

## Files

| File | Purpose |
|---|---|
| `index.html`, `styles-test.html` | the test page (identical copies) |
| `js/hand.js` | **core** `drawHand(canvas, hand, {style, lineWidth, glowLayers, glowBlur, trailLength})`, `fingerColors()` from tokens |
| `js/style-adapt.js` | pure `StyleAdapter` (time passed in): decides "down" or "up" |
| `js/styles-test.js` | this page's logic (toast, modal, benchmark) |
| `tests/style-adapt.test.mjs` | `node tests/style-adapt.test.mjs` with simulated time (6 tests) |
| `js/hand-app.js`, `js/demo-hand.js`, `js/synth-hand.js`, `js/camera.js`, `js/vision.js`, `js/geometry.js`, `js/ui.js`, `css/*` | shared (see Lab 16) |

## Blanks we filled in

| Blank | Value | Why |
|---|---|---|
| Neon line thickness | **5 px** | between the hint's 4 (normal screen) and 6 (projector). Use the slider for 6 when projecting. |
| Glow layers around fingertips | **2** | visible glow at a low cost |
| Finger colours | thumb **pink `--f-thumb`** · index **cyan `--f-index`** · middle **lime `--f-middle`** · ring **amber `--f-ring`** · little **violet `--f-little`** | five clearly different theme colours. This makes debugging Lab 20 easier. |
| Trail length | **12 frames** | about 0.2 s at 60 FPS. The trail is visible without smearing. |
| Step down below FPS … for … s | **24 FPS for 3 s** | The team spec uses 24 (the hint suggests 20). 3 s avoids annoying flip-flopping. |
| Step back up | **> 45 FPS for > 10 s, ask first** | given in the prompt |

## How to verify (MUST / PASS)

- [ ] **All three styles switch:** click each style. Reload the page and the choice is remembered.
- [ ] **Automatic downgrade with a message:** tick 🐢, choose หางแสง, and wait about 3 s. A toast explains the step-down to นีออน, then to เรียบง่าย. Untick 🐢 and wait more than 10 s. A modal asks before stepping back up. The page never changes the style silently.
- [ ] **Comparison table:** press 📊 and copy the console table or CSV. Repeat on a second computer (SHOULD).
- [ ] `node tests/style-adapt.test.mjs` → 6/6 pass.
- Tip from the lab: switch back to **simple** before measuring accuracy in later labs.
