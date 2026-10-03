# Lab 02 — Start a Tiny Server
### เปิดเซิร์ฟเวอร์เล็ก — ประตูสู่ของดี

**Goal:** open the app through `http://localhost` with one double-click, in a window with no address bar — the path later labs need to load AI models (which `file://` can never do).

## How to run / วิธีเปิด
- **Windows:** double-click `start.bat` (full-screen demo: `start-kiosk.bat`, exit with Alt+F4)
- **Mac / Linux:** `bash start.sh` (full-screen: `bash start.sh kiosk`)
- **Manual:** `python -m http.server 8000` in this folder, then open http://localhost:8000
- Beginner guide in Thai: [`docs/HOW-TO-RUN.md`](docs/HOW-TO-RUN.md)

## Files
| File | What it is |
|---|---|
| `index.html` | the Lab 01 camera app (+ a yellow warning bar if opened via `file://`) |
| `start.bat` | Windows launcher, every line commented in Thai (CRLF line endings) |
| `start-kiosk.bat` | calls `start.bat kiosk` → Chrome `--kiosk --app=` full screen |
| `start.sh` | same for Mac/Linux; closes the server when you press Enter or close the terminal |
| `docs/HOW-TO-RUN.md` | Thai how-to for someone who has never used a computer |

## What start.bat does, in order
0. Prints an ASCII-art team logo (COULD).
1. Checks for `python`, then `py`. Missing → red Thai message with Microsoft Store steps, `pause`, stop. The window never just vanishes.
2. Finds a free port starting at **8000**, tries the next one automatically, **up to 5 ports (8000–8004)**; all busy → Thai message + `pause`. Starts `python -m http.server` minimised in the background (bound to 127.0.0.1).
3. Waits **2 s**, opens Chrome (or Edge if Chrome is missing) with **`--app=`** → no address bar, no tabs.
4. Prints how to close the app and the server, then waits for a key.

## Blanks we filled in
| Blank | Value |
|---|---|
| Thai "python missing" message | "เครื่องนี้ยังไม่มีโปรแกรม Python ที่แอปต้องใช้ แอปจึงยังเปิดไม่ได้ — ไม่ต้องกังวล ติดตั้งครั้งเดียวก็ใช้ได้ตลอด" + 4 install steps |
| Port | 8000 (auto-retry 8001–8004) |
| Wait seconds | 2 (change `timeout /t 2` to 4 on a slow machine) |
| Team name in logo | "ทีม NeonHands" ⚠️ *team: change in start.bat, start.sh and index.html* |

## How to verify (MUST / PASS checklist)
- [ ] Double-click `start.bat` **three times** (close the app between tries): the app opens **within 5 seconds, no address bar**.
- [ ] Leave one server running and start again → the console says port 8000 is busy and uses 8001.
- [ ] Rename Python temporarily (or test on a machine without it) → red Thai message, window stays open.
- [ ] Double-click `index.html` directly → yellow bar tells you to use `start.bat` instead.
- [ ] SHOULD: right-click `start.bat` → *Send to → Desktop (create shortcut)*, then shortcut *Properties → Change Icon* to give it an icon.
- [ ] SHOULD: turn Wi-Fi off and open the app — the camera page still works fully offline (it uses no internet).
