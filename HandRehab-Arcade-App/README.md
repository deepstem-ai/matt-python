# FingerRehab — HandRehab Arcade (v2.0.0)
### เกมบริหารมือและนิ้วด้วย AI มองเห็นมือ 21 จุด · ทำงานในเครื่องทั้งหมด ไม่ส่งข้อมูลออกนอกเครื่อง

One complete HTML5 app that combines all 40 HandRehab Arcade labs: splash, face login + PIN, 4-step registration,
face enrolment, 3 rehab games (combo, achievements, streak, per-rep recording, calibration, One Euro filter),
history, progress charts, achievements, calibration, settings, benchmark, offline mode, installable PWA, and
research/teaching tools. Plain HTML/CSS/JS, no build step, no install of Node or npm.

แอปเดียวที่รวมทุกอย่างจาก 40 แลป: หน้าเปิดแอป · เข้าสู่ระบบด้วยใบหน้า/PIN · ลงทะเบียน 4 ขั้น · เก็บใบหน้า ·
3 เกม (คอมโบ ความสำเร็จ ไฟ streak บันทึกทุกท่า ปรับเทียบรายคน) · ประวัติ · กราฟพัฒนาการ · ตั้งค่า · ทดสอบเครื่อง ·
ใช้ออฟไลน์ได้ · ติดตั้งเป็นแอปได้ · เครื่องมือวิจัย

---

## Windows quick start · เริ่มใช้บน Windows

1. **Download the ZIP** of this folder. · ดาวน์โหลดไฟล์ ZIP
2. **Extract it** (right-click → *Extract All…*). Do not run anything from inside the ZIP. · แตกไฟล์ ZIP ก่อน (คลิกขวา → *แยกไฟล์ทั้งหมด*) ห้ามเปิดจากในไฟล์ ZIP
3. **Double-click `install.bat`.** It installs the app to **`C:\Downloads\FingerRehab`** (asks before overwriting an old copy),
   creates the desktop shortcut **"FingerRehab — HandRehab Arcade"** (also in the Start menu), and offers to launch it.
   · ดับเบิลคลิก `install.bat` → ติดตั้งลง `C:\Downloads\FingerRehab` + สร้างทางลัดบนเดสก์ท็อป + ถามว่าจะเปิดเลยไหม
4. **From now on use the desktop shortcut** (or double-click `C:\Downloads\FingerRehab\start.bat`).
   A black window opens the app in a Chrome/Edge app window. **Allow the camera** when the browser asks.
   · ครั้งต่อไปเปิดจากทางลัดบนเดสก์ท็อป (หรือดับเบิลคลิก `C:\Downloads\FingerRehab\start.bat`) แล้วกด **อนุญาต** กล้อง
5. When finished: close the app window, then press any key in the black window (this stops the local server).
   · ใช้เสร็จ: ปิดหน้าต่างแอป แล้วกดปุ่มใดก็ได้ในหน้าต่างดำ

**Optional · เพิ่มเติม**
- **Offline use (no internet at all):** while online, double-click `tools\download-assets.bat` once in
  `C:\Downloads\FingerRehab` (≈31 MB: AI models, MediaPipe library, Thai fonts). The corner badge then shows
  "✔ ไฟล์ในเครื่องครบ 12/12". · ใช้แบบไม่มีเน็ต: รัน `tools\download-assets.bat` หนึ่งครั้งตอนมีเน็ต
- **Install as an app:** in the app go to **ตั้งค่า → 📲 ติดตั้งเป็นแอป** (Chrome/Edge). The local server must still be running
  (start it with the shortcut first). · ติดตั้งเป็นแอปจากหน้าตั้งค่า
- **Shortcut only:** `tools\make-desktop-shortcut.bat` re-creates the shortcut for whatever folder the app is in.
- **Kiosk / full screen:** `start.bat kiosk` (close with Alt+F4).
- **USB stick for presentation day:** `tools\make-usb-package.ps1` (see `docs/OFFLINE.md`).

> ⚠ **Your data lives in the browser, tied to the address `http://localhost:PORT`.** Users, faces, sessions and settings are
> stored in the browser's IndexedDB for that exact origin. `start.bat` always tries **port 8000 first** — keep using the same
> shortcut/launcher and the same browser so your data is there. If port 8000 was busy and the app opened on 8001, the
> history looks empty (it is still safe on 8000). Re-installing or moving the folder does **not** delete data.
> · ข้อมูลทั้งหมดอยู่ในเบราว์เซอร์ ผูกกับที่อยู่ `http://localhost:พอร์ต` start.bat ใช้พอร์ต 8000 ก่อนเสมอ
> ให้เปิดจากทางลัดเดิมและเบราว์เซอร์เดิม ถ้าวันไหนได้พอร์ต 8001 ประวัติจะดูเหมือนหาย (จริง ๆ ยังอยู่ที่ 8000)

### How `start.bat` works · ทำงานอย่างไร
- Finds a **working** Python (`py -3`, `python`, `python3`; the Microsoft Store placeholder is ignored) and runs `tools\serve.py`.
- **No Python? No problem:** it falls back to `tools\serve.ps1`, a small PowerShell (built into Windows) web server
  (`powershell -NoProfile -ExecutionPolicy Bypass -File tools\serve.ps1`). Both serve correct MIME types and listen on this PC only.
- Picks the first free port of 8000–8004; if the app is already running on a port it simply reopens the window.
- Opens Chrome (or Edge, or the default browser) with `--app=http://localhost:PORT/index.html`.
- Everything is relative to the folder `start.bat` is in, so any folder (also with spaces) works. The window never closes by itself;
  every problem shows a Thai + English message.

## Requirements · สิ่งที่ต้องมี
- Windows 10/11 (also Mac/Linux with `bash start.sh` + Python 3).
- **Chrome or Edge** (recent). Firefox works for most pages but is not tested for the AI parts.
- A webcam (built-in is fine). Without a camera every game has a **demo mode** (mouse / keyboard / mouse wheel).
- Python 3 is *optional* on Windows (PowerShell fallback).
- Internet on first run only (AI models from Google/jsDelivr) — or run `download-assets` once for fully offline use.
- Any PC from ~2015 works; run **⚡ ทดสอบความลื่นของเครื่อง** (benchmark) and press "ใช้ค่าแนะนำ" on slow machines.

## Troubleshooting · แก้ปัญหา
| Problem · อาการ | Fix · วิธีแก้ |
|---|---|
| **Blank / white screen** · จอว่าง | Do not open `index.html` by double-click (file://). Always use `start.bat`/the shortcut. Press **Ctrl+Shift+R** to reload. Still blank: F12 → Console, take a screenshot for the team. |
| **Camera busy / "กล้องถูกใช้อยู่"** | Close Zoom/Teams/LINE/Camera app and other browser tabs using the camera, then press "ลองอีกครั้ง". Choose another camera in **ตั้งค่า → กล้อง**. If permission was denied: click the 🔒/camera icon in the address bar → Allow, reload. Games still work in demo mode. |
| **SmartScreen: "Windows protected your PC"** | Files from the internet are marked. Click **More info → Run anyway** (once). `install.bat` removes the mark from the installed copy. Or right-click the ZIP → Properties → **Unblock** before extracting. |
| **Port in use** · พอร์ตไม่ว่าง | `start.bat` tries 8000–8004 automatically. "พอร์ต 8000-8004 ถูกใช้หมด": close all "HandRehab Server" windows (taskbar) or restart the PC. Remember data is per port (see the warning above). |
| **School network blocks the AI models** · เน็ตโรงเรียนบล็อก | The splash stops at "โหลดโมเดล AI" or the badge shows missing files. Run `tools\download-assets.bat` once on a home/phone hotspot connection; afterwards no internet is needed. Or use "🖱 ใช้โหมดเมาส์แทน". |
| "Python not found" | Fine — the PowerShell server is used. If the PowerShell server is blocked by IT policy, install Python 3 from the Microsoft Store. |
| Server did not start in 20 s | Open the minimized "HandRehab Server" window to read the error. |
| Thai text shows boxes in the black window | Only the console font; the app itself is fine. |
| The app looks old after an update | A bar "มีเวอร์ชันใหม่" appears — press it. Or Ctrl+Shift+R. |

## Page map · แผนที่หน้า
| Page | What it is |
|---|---|
| `index.html` | splash (loads camera, DB, hand model, face model) → home: big card menu in 4 groups — **เล่นเกม** (3 games), **ความก้าวหน้า** (progress, history, achievements, 🔥 streak flame), **ตั้งค่า/ปรับเทียบ** (calibrate, settings, benchmark, users, filters, face, PIN), **🔬 เครื่องมือวิจัย** (`research.html`). Logged-in name + logout. `#games`, `#settings` also open directly |
| `login.html` | face login (blink check, 15-frame vote) · PIN · **🎮 เล่นแบบไม่ลงทะเบียน** (guest mode, data saved as user `guest` on this PC) |
| `register.html` → `enrol.html` / `pin.html` | 4-step registration with consent, then face enrolment or PIN |
| `users.html` | search, edit, delete (complete), export users |
| `star-portal.html` | ⭐ pinch game — combo ×2/×3/×5, achievements, streak, per-rep recording, **per-user calibration** (pinch thresholds, grab radius, tremor level → filter strength), **One Euro filter** on the pointer, tremor test. Demo: mouse (hold button = pinch) |
| `rhythm-tap.html` | 🎵 finger-tap rhythm game. Demo: keys 1–5 |
| `spread-wall.html` | 🖐 finger-spread wall game (own spread calibration). Demo: mouse wheel / slider |
| `history.html` | every session (newest first), tap for every rep, filters, anonymous CSV export, delete, 🧪 30-day demo history |
| `progress.html` | 4 stat cards, encouraging weekly summary, 3 line charts, 12-week calendar, per-game bars, save PNG, 🧪 demo history |
| `achievements.html` | 10 achievements (locked ones as silhouettes with the condition) |
| `calibrate.html` · `filters.html` | 4-step hand calibration (real hand or simulated hand) · raw vs One Euro vs moving-average filter comparison |
| `benchmark.html` | FPS benchmark + recommended resolution/effects (also offered on first run) |
| `research.html` + research pages | datasets, teach-AI (kNN), evaluation, hand/gesture/counter/math labs, survey, evidence, report builder, rehearsal (built separately) |

Files: `css/` (tokens + themes = all colours), `js/` (ES modules, Thai comments), `js/games/`, `icons/` (`app.ico` for the shortcut),
`sw.js` (offline cache, version **v2.0.0**), `manifest.json`, `tools/` (servers, installer, shortcut, downloads, USB package, `make-ico.py`),
`docs/` (`INSTALL.md`, `OFFLINE.md`), `tests/` (node unit tests: `node tests/juice.test.mjs` etc.).

## For the team · สำหรับทีม
- Placeholders to change: app name "HandRehab Arcade", team "ทีม NeonHands", school "โรงเรียนของเรา".
- After changing any file: bump `VERSION` in `sw.js`, and add new files to `SHELL_FILES`.
  Pages not in the list still work offline after their first visit (runtime cache for same-origin `.html/.js/.css`).
- Regenerate the icon: `python tools/make-ico.py icons/app.ico icons/icon-512.png` (uses Pillow if installed, otherwise embeds the PNGs given).
- Install somewhere else: `powershell -ExecutionPolicy Bypass -File tools\install.ps1 -Dest "D:\My Apps\FingerRehab"`.
- Health data: sessions are linked to people. Use "ส่งออกแบบไม่ระบุตัวตน" for reports; demo data is tagged `synthetic` — never use it as results.
