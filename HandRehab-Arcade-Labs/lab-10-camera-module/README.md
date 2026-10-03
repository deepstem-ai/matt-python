# Lab 10 — Full-Screen Camera Inside the Real App
กล้องเต็มจอในแอปจริง: เลือกกล้องได้ จำกล้องที่เลือก และปิดกล้องทุกครั้งที่ออกจากหน้า

## Goal
Move all camera code into one module (`js/camera.js`). Let the user pick a camera and remember the choice. Handle all four failure cases in Thai, each with a button that fixes it. Always release the camera when the user leaves the page.

## How to run
- Windows: double-click `start.bat`
- Mac / Linux: `bash start.sh`
- Or run `python -m http.server 8000` in this folder, then open http://localhost:8000

`index.html` is a small app with a tiny hash router. It has three pages: **หน้าแรก** (home), **📷 กล้อง** (`#/camera`) and **🩺 ทดสอบกล้อง** (`#/test`).

## Files
| File | What it does |
|---|---|
| `index.html` | The app shell: nav bar, camera page, camera-test page |
| `js/camera.js` | Core camera module: `startCamera`, `stopCamera`, `listCameras`, `getStats`, `captureStill`, `measureBrightness`, `cameraErrorMessage`, remembered `deviceId` with silent fallback, `camera-lost` event |
| `js/camera-errors.js` | The 4-case Thai error box with a fix button. Also the `?sim=` error simulator |
| `js/camera-page.js` | Camera page: dropdown, 🔄 refresh, mirror switch, resolution slider, oval/rectangle guide, FPS top-right, brightness meter with too-dark warning, USB-unplug warning |
| `js/camera-test.js` | "Camera test" button that runs 6 automatic checks and confirms every track has ended |
| `js/router.js` | Minimal router (`addRoute`, `startRouter`). Calls `onLeave` on route change **and on `pagehide`** |
| `js/ui.js`, `css/*` | Shared core (toast, prefs, tokens, parts) |
| `start.bat`, `start.sh` | Local server launchers |

## Blanks we filled in
| Blank in the prompt | Our value | Why |
|---|---|---|
| Draw a ___ guide outline over the video | **Both**: an **oval** (face) and a **rectangle** (hand), switchable, plus "none" | The hint says to support both so Lab 16 can reuse it. The choice is remembered in localStorage |
| Show FPS in the ___ corner | **Top-right** | Conventional. It sits inside the video's HUD, so it stays with the video |

Team placeholders to change: app name "HandRehab Arcade", team "ทีม NeonHands", school "โรงเรียนของเรา".

## How to verify (MUST / SHOULD / PASS)
1. **Choose a camera.** Open 📷 กล้อง and pick a camera from the dropdown. Reload the page (or restart the app): the same camera opens automatically. The id is saved in localStorage key `hr-camera-id`.
2. **Remembered camera missing.** Unplug the remembered USB camera and reload. The app silently uses the first camera and logs `[camera] กล้องที่จำไว้หายไป…` in the console. It does not crash.
3. **Stop really stops.** Press **■ ปิดกล้อง**: the camera light goes out. The test page also checks this (`track.readyState === 'ended'` for every track).
4. **Leaving the page releases the camera.** While the camera is on, click หน้าแรก or ทดสอบกล้อง, or close the tab. The light goes out (router `onLeave`, plus `pagehide`).
5. **The 4 failure cases.** Open these links from the home page:
   `?sim=denied#/camera` shows padlock steps and a Retry button · `?sim=nocamera#/camera` shows a "search again" button · `?sim=busy#/camera` names Zoom/Teams/LINE/Discord/OBS/another tab and shows Retry · `?sim=unsupported#/camera` shows "copy link to Chrome".
   With a real camera, block permission through the padlock, or open Zoom first, to see the real messages.
6. **Unplug a USB camera mid-session (SHOULD).** An orange "🔌 กล้องหลุดการเชื่อมต่อ" box appears with a reconnect button. The camera list refreshes by itself on `devicechange`.
7. **Camera test (SHOULD).** Open 🩺 ทดสอบกล้อง and press ▶. It checks that the camera opens, FPS ≥ 20, resolution, brightness, a still capture, and that the camera closes.
8. **Too dark (COULD).** Cover the lens: the brightness bar drops and a 🌙 "ห้องมืดเกินไป" warning appears when brightness is below 60/255.

## Notes / fixes to the shared core
- `camera.js`: the FPS counter loop used to switch to `requestAnimationFrame` after `stopCamera()` and keep running forever, and a restart stacked a second loop. It now uses a generation counter so old loops stop.
- `camera.js`: if `video.play()` fails after `getUserMedia` succeeded, the opened tracks are now stopped, so the light does not stay on.
- `parts.css`: added `a.btn-glow { text-decoration: none; }` for links styled as buttons.
