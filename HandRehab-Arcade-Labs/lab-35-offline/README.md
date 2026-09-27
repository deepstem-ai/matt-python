# Lab 35 — Work Perfectly with No Internet at All
### ทำงานได้สมบูรณ์โดยไม่มีอินเทอร์เน็ต

**Goal:** guard against the biggest risk on presentation day, which is the network failing or the venue blocking access.
**เป้าหมาย:** ปิด Wi-Fi ถอดสาย LAN แล้วทุกฟีเจอร์ยังทำงาน รวมถึงการจับมือและใบหน้า

This folder is the **Lab 34 integrated app** plus local files for every external asset. See Lab 34's README for the app map and the PWA parts.

## ⚠ First: download the assets (not in git)
The models, the MediaPipe library and the font files (~31 MB) are **excluded by `.gitignore`**. Each machine must run the script **once while online**:
- **Windows:** double-click `tools\download-assets.bat` (or `powershell -ExecutionPolicy Bypass -File tools\download-assets.ps1`)
- **Mac/Linux:** `bash tools/download-assets.sh`

It must end with **"สรุป: สำเร็จ 12 / 12 ไฟล์"**. Full guide and checklist: **`docs/OFFLINE.md`** (Thai).

## How to run
`start.bat` / `bash start.sh`. These now run **`tools/serve.py`** instead of `python -m http.server`, which forces correct MIME types (`.js`/`.mjs` → `text/javascript`, `.wasm` → `application/wasm`). On some Windows machines the registry maps `.js` to `text/plain`, and module scripts then refuse to run.

## What changed from Lab 34
| File | Change |
|---|---|
| `js/assets.js` (new) | **one central `assetUrl(name)` / `assetUrls(name)`**. The lookup order is **local file first** (`vendor/`, `models/`, `fonts/`), checked **once per file with a HEAD request** (and a size check: a file that is too small counts as missing), **then the CDN**, then the backup CDN. `ASSETS` lists all 12 required files. `checkAll()` drives the status badge, and `loadFonts()` injects `fonts/fonts.css` (local) or Google Fonts |
| `js/vision.js` | no URLs left. `libUrls()` → `assetUrls('vision_bundle.mjs')` / `assetUrls('wasm')`, and `modelUrls(key)` → `assetUrls(file)`. `fetchModel` awaits the URL list, so `hand.js`, `landmarker.js` and `splash.js` are unchanged. `libSource()` reports where the library came from |
| `js/face-login.js` | its `MODEL_URL` constants now come from `assets.js` |
| `css/tokens.css` | the Google Fonts `@import` is removed, and fonts come through `assetUrl('fonts.css')` |
| `fonts/fonts.css` (new, committed) | `@font-face` for the local variable woff2 files (Noto Sans Thai thai + latin subsets, Orbitron latin) |
| `js/offline-status.js` + `css/offline.css` (new) | **corner badge**: 🌐 online / 📴 offline · using local files, with ✔ local files complete 12/12 or ⚠ missing N files, naming them. Clicking it opens **a list of every required file** with its status and **progress bar**, plus **🔍 ตรวจทุกไฟล์ (โหลดจริง)**, which really downloads each file and checks its size. A **self-check on launch** warns once if anything is missing |
| `index.html` Settings | "📦 ใช้งานแบบไม่มีอินเทอร์เน็ต" section → the same panel + a link to OFFLINE.md |
| `sw.js` | `VERSION v1.1.0`, new files listed, `unpkg.com` added to the runtime hosts. Local vendor/model/font files are cache-first once loaded |
| `tools/serve.py`, `start.bat`, `start.sh` | MIME-safe local server |

## Tools
| Script | What it does |
|---|---|
| `tools/download-assets.ps1` (+ `.bat` launcher) / `tools/download-assets.sh` | downloads **models → `models/`** (primary `/1/`, backup `/latest/`), the **complete `@mediapipe/tasks-vision@0.10.14`** (`vision_bundle.mjs` + `wasm/` 4 files) **→ `vendor/tasks-vision/`** (jsDelivr → unpkg → the npm registry `.tgz`, extracted), and **fonts → `fonts/`** (Google Fonts CSS parsed for the woff2 links → npm `@fontsource-variable` `.tgz` as backup), writing `fonts.css`. **Every file is size-checked** (too small = a school web-filter page → the next link is tried). Progress bars (curl `-#` / `Write-Progress`), files already present are skipped, and it ends with a **"สำเร็จ X / 12"** summary and a non-zero exit if anything failed. The `.ps1` is saved as UTF-8 with BOM so Windows PowerShell 5.1 reads the Thai text |
| `tools/make-usb-package.ps1` / `.sh` | checks that the 12 files are present, copies the app + assets into **`dist/HandRehab-USB/`**, and writes a USB **`start.bat`** (uses `python\python.exe` first if present, then the system Python; opens Chrome/Edge in `--app` mode), **`README-USB.txt`** and `python\README.txt` (how to drop in the **portable Python** Windows embeddable package) |

## Blanks we filled in
| Blank | Our value |
|---|---|
| Lookup order: ___ first, then ___ | **local folder (`vendor/`, `models/`, `fonts/`) first, then the internet (CDN)** |
| Checklist ___ days before the presentation | **3 days** (the checklist in `docs/OFFLINE.md`). MUST: finish this lab **≥ 7 days** before, and test again on the morning itself |

## How to verify (MUST / PASS)
1. Run `download-assets` → 12/12. Start the app → the badge says **✔ ไฟล์ในเครื่องครบ 12/12**. Click it → **ตรวจทุกไฟล์** → every row ✔.
2. **Genuinely switch the network off** (Wi-Fi off, cable out) and restart the app. The badge says **📴 ออฟไลน์ · ใช้ไฟล์ในเครื่อง**. The splash reaches 100%, face login works, all 3 games work with a real hand, Thai fonts look right.
3. F12 Console shows `[vision] ไลบรารีจาก http://localhost…/vendor/…` and `โหลดโมเดลสำเร็จ http://localhost…/models/…`.
4. Without the local files, the app still works online (it falls back to the CDN) and the badge names the missing files.
5. `make-usb-package` → copy `dist/HandRehab-USB` to 2 USB drives → test on another machine with the network off.

**Tested here:** `bash tools/download-assets.sh` ran for real. jsDelivr and unpkg are blocked in this sandbox (403), so the script fell back to the npm tarball, and all 12/12 files came out byte-identical to the reference copies. The app ran in headless Chromium with **every CDN host aborted**: 0 CDN requests, and the library, wasm, 3 models and fonts all loaded from `localhost` on the splash, login (face model), enrol, games and benchmark. There were zero page errors. With the local files removed, it fell back to the CDN and the badge showed "ขาด 12 ไฟล์". `make-usb-package.sh` produced 108 files (31 MB). The `.ps1` scripts could not be executed here because there is no PowerShell; they mirror the tested `.sh` logic.

Team placeholders to change: "HandRehab Arcade", "ทีม NeonHands", "โรงเรียนของเรา".
