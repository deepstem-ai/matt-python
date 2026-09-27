# Lab 34 — Make It Installable as a Real App
### ติดตั้งเป็นแอปจริง: แอปรวมทุกส่วน + ไอคอนบนเดสก์ท็อป + ทำงานออฟไลน์

**Goal:** turn the website into an app with a desktop icon that opens with no browser bar.
**เป้าหมาย:** กดติดตั้งแล้วมีไอคอนบนเดสก์ท็อป เปิดแล้วไม่มีแถบเบราว์เซอร์ และได้เวอร์ชันใหม่เมื่ออัปเดต

This folder is **the integrated full app, the final product so far**. It brings together splash, face login with a PIN fallback, the 4-step registration, face enrolment, home, 3 games, progress, user management, settings and the benchmark.

## How to run / วิธีเปิด
- Windows: `start.bat` · Mac/Linux: `bash start.sh` · or `python -m http.server 8000` → http://localhost:8000
- **Must be opened via `http://localhost`.** Opening `file:///` cannot install and gets no service worker.
- Installing, step by step in Thai for Chrome and Edge on Windows/Mac and for iPad Safari: **`docs/INSTALL.md`**

## App map
| Page | What it is | From |
|---|---|---|
| `index.html#splash` | real loading (camera, DB, hand model, face models, fonts) and the first-launch weak-machine check, then → home (if logged in) or `login.html` | Lab 08 + 33 |
| `login.html` | face login (vote + blink) with **🔢 PIN** as an equal alternative; `?next=` returns to the requested page | Lab 15 |
| `register.html` | full 4-step registration + consent. On success you are logged in, with buttons **📸 enrol face / 🔢 set PIN / 🏠 home**. `?from=users` / `?edit=` = admin mode (back to the users list, no login) | Lab 12/13 |
| `enrol.html`, `pin.html` | 5-pose face enrolment, set/change PIN | Lab 14/15 |
| `index.html#home` | greeting, today/total stats, big **menu cards** | new |
| `index.html#games` | 3 game cards → `star-portal.html`, `rhythm-tap.html`, `spread-wall.html` | Lab 23–25 |
| `index.html#progress` | chips per game, **line chart of max finger-spread °** (charts.js), table of every session, CSV + PNG | new |
| `users.html` | search / view / edit / delete / export / import users | Lab 13 |
| `index.html#settings` | **install button**, **full-screen**, icon preview cards (128/64/32/16 px), service-worker version, profile (standard/elder/kiosk), theme, calm, light, **camera choice**, **hand style**, camera resolution, effects, link to the benchmark | new |
| `benchmark.html` | performance test + recommendation | Lab 33 |

Every separate page gets the **same top bar** from `js/appbar.js`: brand · 📍 page name · user · ⛶ full screen · ↩ back · 🏠 home. It also registers the service worker there. The games now honour `prefs.resolution`, `prefs.handStyle` and `prefs.effects` (small, commented edits in `js/games/game-shell.js`).

## PWA pieces
| File | What it does |
|---|---|
| `manifest.json` | name **"HandRehab Arcade — เกมบริหารมือ"**, short_name **"HandRehab"** (9 chars), background **#0B1020**, theme **#151B33**, `display: standalone`, `start_url ./index.html`, icons 192 / 512 (+ maskable, + SVG), shortcuts to Games / Progress |
| `icons/icon.svg` | our own icon: a 21-point hand in the finger colours with **glowing fingertips** and a neon ring on the theme's navy. It is full-bleed, so it also works as maskable, and the strokes are thick so it stays readable at 16 px |
| `icons/icon-192.png`, `icon-512.png` | exported from the SVG with headless Chromium (Playwright screenshot) |
| `sw.js` | **cache-first** for every app-shell file (all 80+ are listed, and the cache is versioned `hr-shell-v1.0.0`); **network-first** for user-data/API-style requests (`/api/`, `/data/`, `*.json` except the manifest, `?fresh`); **runtime cache-first** for MediaPipe (jsDelivr/unpkg), the models (storage.googleapis) and Google Fonts after their first load; **deletes old `hr-*` caches on activate**; waits for the user before switching versions |
| `js/pwa.js` | registers `sw.js`; the **update bar** "🆕 มีแอปเวอร์ชันใหม่แล้ว — ↻ โหลดเวอร์ชันใหม่" (SKIP_WAITING → reload); install button via **`beforeinstallprompt`**, **hidden when installed** (`display-mode: standalone` / `appinstalled`); full-screen toggle for any `[data-fullscreen]` button; `whenControlled()` |

**Offline after one online run:** the splash waits for the service worker to take control *before* downloading the models. The library, wasm and all 3 models then go through `sw.js` and are cached on the very first visit.

## Blanks we filled in
| Blank | Our value |
|---|---|
| Full app name | **HandRehab Arcade — เกมบริหารมือ** |
| Short name | **HandRehab** (under 12 characters) |
| Background colour on launch | **#0B1020** (`--bg`) |
| Header bar colour | **#151B33** (`--card`) |
| Icon concept | **a hand with 21 glowing points** (fingertips glow in the 5 finger colours) inside a neon ring, using the Neon theme colours |

Colours in `manifest.json`, `<meta name="theme-color">` and `icon.svg` are the only literal hex values outside `tokens.css`. They have to be literal there, and they match the tokens.

## How to update (MUST: the old-cache clearing system)
1. Change any file → **bump `VERSION` in `sw.js`** (for example `v1.0.0` → `v1.0.1`). Add any new file to `SHELL_FILES`.
2. Installed copies see "🆕 มีแอปเวอร์ชันใหม่แล้ว". Pressing **↻ โหลดเวอร์ชันใหม่** activates the new worker, deletes the old `hr-shell-*` cache and reloads. The model cache `hr-runtime-v1` is kept, so the 12 MB of models are not downloaded again.

## Files
`index.html` + `js/app.js` (router start, hash pages), `js/pages.js` (login redirect, home, games, progress), `js/settings.js`, `js/splash.js` (Lab 08, modified), `js/router.js` (Lab 07), `js/pwa.js`, `js/appbar.js`, `css/shell.css`, `sw.js`, `manifest.json`, `icons/*`, `docs/INSTALL.md`. Every other file is copied from Labs 12–15, 23–25 and 33 and from the shared core. Edits are marked "Lab 34" in the comments.

## How to verify (MUST / PASS)
1. `start.bat` → the splash reaches 100% → login. F12 → **Application → Manifest** shows no errors (checked here with CDP: 0 manifest errors, 0 installability errors). **Service workers** shows *activated*. **Cache storage** has `hr-shell-v1.0.0` (all files) and `hr-runtime-v1` (bundle, wasm, 3 models, fonts).
2. Settings → **⬇ ติดตั้งแอปลงเครื่อง** (or the install icon in the address bar) → an icon appears on the desktop. Opening it shows **no browser bar**, and Settings then says "✔ ติดตั้งแล้ว" with the button hidden.
3. **⛶ เต็มจอ** in the top bar toggles full screen.
4. **Update test (MUST):** bump `VERSION`, reopen the installed app → the update bar appears → reload → Cache storage now holds only the new shell cache. This was tested here: `hr-shell-v1.0.0` → `hr-shell-v1.0.1` + `hr-runtime-v1`.
5. Offline test: after one online run, turn off Wi-Fi (the local server keeps running). The app, login, models and games still load. This was tested here with the browser set offline: the splash, the face model and the hand model in a game all load from the cache.
6. SHOULD: install on a second computer.

Team placeholders to change: "HandRehab Arcade", "ทีม NeonHands", "โรงเรียนของเรา".
