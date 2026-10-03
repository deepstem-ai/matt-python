# Lab 08 — A Launch Screen That Looks Expensive
### หน้าเปิดแอปที่ดูแพง และโหลดงานจริง

**Goal:** the first screen loads real work (camera check, database, AI models, theme) and looks exciting while it does. When it finishes, it moves to the login page.
**เป้าหมาย:** หน้าแรกที่โหลดงานจริง แถบความคืบหน้าขยับตามงานจริง แล้วพาไปหน้าเข้าสู่ระบบ

This lab is the Lab 07 app (router and seven pages) with the `splash` page replaced by a real loader.

## How to run
`start.bat` · `bash start.sh` · or `python -m http.server 8000` → http://localhost:8000
Test failures by adding a query flag:
- `index.html?fail=models`: the hand and face model loads fail once, so **Retry** then succeeds
- `index.html?fail=models&failTimes=99`: they keep failing, so use **Skip** (face) or **🖱 Use mouse mode** (hand)
- `?fail=camera`, `?fail=db`, `?fail=face`, `?fail=hand`, `?fail=screen` (comma-separated flags can be combined)
- Real offline test: disconnect the internet and clear the cache (the models come from storage.googleapis.com). The hand segment turns red with the Thai message "ดาวน์โหลดโมเดล AI มือไม่สำเร็จ ตรวจการเชื่อมต่ออินเทอร์เน็ต…" and the buttons Retry and Mouse mode.

## What you see
- An **SVG logo** of a hand with **21 glowing points**. The bones draw in one by one (stroke-dashoffset), then each joint pops in with a glow in the finger colours `--f-*`. In calm mode the finished logo appears at once.
- The app name in a **gradient from `--primary` to `--secondary`**.
- A **progress bar 60 % of the screen wide**, rounded, split into segments sized by task weight, with a **travelling highlight**. The highlight is a transform animation, so it keeps moving even while the model is compiling. There is also a spinner, the total %, and **Thai status text** for the running task.
- Each task's segment fills from **real progress**. The hand model reports downloaded bytes through `initHand({ onProgress })`, which uses `fetchModel` in core `vision.js`.
- **When a task fails:** its segment turns **red**, and a Thai explanation of what happened and what to do appears, with **ลองใหม่** (retry). **ข้ามไปก่อน** (skip) appears only for non-essential tasks (camera; face model, since a PIN can replace it). The hand model is essential, but "🖱 ใช้โหมดเมาส์แทน" still gives a way forward. Skipped segments turn amber.
- After everything finishes: a 0.5 s wait, then `goTo('login', { splash: result }, { replace: true })`. The login page shows what loaded, what was skipped, and whether demo (mouse) mode is on. That information travels in goTo data.
- The team name and school are at the bottom.

## Task weights (real work in `js/splash.js`)
| Task | Weight | Real work | Can skip? |
|---|---|---|---|
| ตรวจหากล้อง (camera check) | 10 % | `enumerateDevices()` → at least one `videoinput` (no permission prompt yet) | yes, mouse demo mode |
| เตรียมฐานข้อมูล (DB) | 10 % | `openDB()` and one real write `saveSettings('splash-check')` | no (retry only) |
| โมเดล AI มือ (hand) | 45 % | `loadVisionLib()` (MediaPipe wasm) → `initHand({onProgress})`, which downloads about 7.5 MB and creates the GPU/CPU task | "mouse mode" way forward |
| โมเดล AI ใบหน้า (face) | 15 % | `initVision({onProgress})` (BlazeFace) | yes, a PIN can replace it |
| หน้าจอ/ธีม (screen) | 20 % | `applyPrefs()`, wait for fonts (at most 3 s) | no |
AI models total = **60 %**.

## Files
| File | Purpose |
|---|---|
| `index.html` | App with the splash page (other pages from Lab 07) |
| `js/splash.js` | Task runner, logo builder, segmented bar, error/retry/skip UI, `?fail=` simulation |
| `css/splash.css` | Logo animation, gradient name, 60 % bar with travelling highlight, spinner |
| `js/router.js`, `js/pages.js`, `js/app.js` | From Lab 07 (app.js imports splash.js; login shows the load summary) |
| `js/vision.js`, `js/hand.js`, `js/geometry.js`, `js/db.js`, `js/camera.js`, `js/ui.js` | Shared core modules |
| `css/*.css` | Tokens, themes, parts, app |

## Blanks we filled in
| Blank | Value |
|---|---|
| SVG logo depicting ___ | **a hand with 21 glowing points** (the MediaPipe landmarks) |
| app name ___ | **HandRehab Arcade** (team placeholder, change it) |
| camera ___ % | **10** |
| database ___ % | **10** |
| AI models ___ % | **60** (hand 45 + face 15) |
| screen and theme ___ % | **20** |

Team placeholders: "HandRehab Arcade", "ทีม NeonHands", "โรงเรียนของเรา".

## Article alignment (MITIJ article)

- `js/geometry.js` comments now cite the article equation numbers: **eq. (1)** palm size s = ‖p0 − p9‖ (`palmScale`) and **eq. (2)** d̂ij = ‖pi − pj‖ / s (`normDist`). Comments only — no behaviour change.

## How to verify (MUST / PASS)
1. Open the app. The logo draws itself and the bar fills segment by segment (the hand segment follows the download). After "✔ พร้อมแล้ว!" and 0.5 s, the login page appears.
2. Open `?fail=models&failTimes=99`. The hand segment turns red and the Thai message appears. Press "ใช้โหมดเมาส์แทน". The face segment then fails too. Press "ข้ามไปก่อน". The login page says both were skipped and that mouse demo mode is on.
3. Open `?fail=db`. Only **ลองใหม่** is offered (the DB is essential). Press it and loading continues.
4. Disconnect the internet (DevTools → Network → Offline, with the cache disabled). You still get a helpful Thai message and a way forward.
5. Headless test results: all tasks succeed in about 1 s. `?fail=models` with skip and mouse mode reaches login. Blocking the model host (real network failure) shows the red segment with the Thai message and no page errors.
