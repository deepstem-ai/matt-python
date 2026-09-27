# Lab 07 — Page Switching That Feels Like a Real App
### สลับหน้าให้ลื่นเหมือนแอปจริง

**Goal:** hold many pages in one HTML file and move between them as smoothly as a mobile app.
**เป้าหมาย:** เก็บหลายหน้าไว้ในไฟล์เดียว แล้วสลับไปมาได้ลื่นเหมือนแอปมือถือ

## How to run
`start.bat` (Windows) · `bash start.sh` (Mac / Linux) · or `python -m http.server 8000` → http://localhost:8000

## Why hide and show pages instead of rebuilding them? (asked by the prompt)
1. **Speed.** Switching only toggles a class. Nothing is re-created or reloaded, and the AI models stay loaded.
2. **No memory leaks.** No new elements or event listeners pile up with every switch.
3. **Forms keep their values.** Half-typed input is still there when you come back.
4. **Smooth transitions.** The destination page already exists, so it can fade in immediately.

## What you see
- Seven pages: `splash → login → register → home → game → progress → settings`. Each has a heading and a "next" button.
- **Top bar:** a location indicator (📍 คุณอยู่ที่: …), a breadcrumb of the last pages, the login status, a Back button (Esc) and a Help button (F1).
- **Bottom navigation bar** with four large buttons (icon and text), for users who find precise clicking hard.
- **requiresAuth:** home, game and progress need a login. Press "ลองเข้าหน้าหลักโดยไม่ล็อกอิน" and you land on login with a Thai explanation. The fake login then takes you on to the page you wanted. That page name travels in `goTo` data, not in a global.
- **Game page:** opens the camera (core `camera.js`) in `onEnter` and **stops it in `onLeave`**. A status line shows 🔴 when the camera is on and ⚫ when it is off. A token guards the case where you leave before the camera finishes opening. Camera errors show a Thai message and a retry button.
- **Register page:** type something, then press Back or Esc. A **confirm-leave modal** asks first (the `canLeave()` hook).
- **Progress page:** a small tab strip for sub-views.
- **Settings page:** choose the transition (fade / slide / zoom), the duration and calm mode. **🔁 ทดสอบสลับหน้า 50 ครั้ง** runs 50 switches and reports the total, average and max time, the first 10 against the last 10, the JS heap before and after (`performance.memory`, Chrome only), the DOM element count before and after, and whether the camera is off at the end.

## Router API (`js/router.js`)
```js
definePage('game', { requiresAuth: true, onEnter(data) {}, onLeave() {}, canLeave() { return true } });
initRouter({ start: 'splash', transition: 'fade', duration: 250, isLoggedIn, loginPage: 'login', onChange });
goTo('home', { welcomeName: 'ยายสมใจ' });   // data goes to onEnter(data), never through globals
goBack();                                  // also bound to Escape (ignored while a modal is open)
setTransition('slide', 300); resetHistory(); currentPage(); history();
```
Pages are `<section class="page" id="page-NAME">`. Pages without hooks are skipped. History is capped at 50 entries so memory cannot grow without limit.

## Files
| File | Purpose |
|---|---|
| `index.html` | The seven pages, top bar and bottom nav |
| `js/router.js` | The router |
| `js/pages.js` | Per-page hooks (login, register confirm, home, game camera, progress tabs) |
| `js/app.js` | Wiring, location and breadcrumb, F1 help, transition settings, 50-switch self-test |
| `js/camera.js` | Core camera module (`startCamera` / `stopCamera` / `cameraErrorMessage`) |
| `js/db.js` | Core; only `setCurrentUser` / `getCurrentUserId` (sessionStorage) are used here |
| `js/ui.js` | `modal`, `toast`, prefs |
| `css/app.css` | Page show/hide, fade / slide / zoom keyframes, top bar, bottom nav |
| `css/tokens.css`, `themes.css`, `parts.css` | From Labs 05–06 |

## Blanks we filled in
| Blank | Value |
|---|---|
| transition style | **fade**, which is gentler for older users (slide and zoom can be chosen in Settings) |
| duration | **250 ms** |
| key that goes back | **Escape** |

Team placeholders: "ทีม NeonHands", "โรงเรียนของเรา".

## How to verify (MUST / PASS)
1. Click through all seven pages with the "next" buttons. Escape goes back each time.
2. Open **game**. The camera light turns on. Press Esc or a bottom-nav button, and **the light must go out** (the status shows ⚫ ปิด).
3. Log out, then press the bottom-nav "เกม". You are redirected to login with an explanation.
4. Settings → **ทดสอบสลับหน้า 50 ครั้ง**. Headless result: 50 switches in about 810 ms (about 16 ms each, which is one frame), no slow-down, heap 9.5 → 9.5 MB, camera off at the end. On a real PC, also watch Task Manager while you run it a few times.
5. Press F1 for help. Press Tab to move through the controls: the focus ring is visible.
