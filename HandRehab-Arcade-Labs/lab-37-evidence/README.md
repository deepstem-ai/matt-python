# Lab 37 — Gather Every Piece of Evidence (รวบรวมหลักฐานทั้งหมด)

**Goal:** one evidence folder with screenshots, charts/tables, video, documents and code — and one summary table where every number names its source file and date.
เป้าหมาย: โฟลเดอร์ evidence ครบ 5 กลุ่ม มีวิดีโอสาธิต และทุกตัวเลขใน SUMMARY ย้อนกลับไปหาไฟล์ได้

## How to run / วิธีเปิด
- Windows: double-click `start.bat` (opens `index.html` in app mode)
- Mac / Linux: `bash start.sh`
- Or: `python -m http.server 8000` in this folder, then open http://localhost:8000
- Must be opened through a server (not by double-clicking the .html) because pages load modules / JSON / templates.

## What you get
| File | What it is |
|---|---|
| `index.html` + `js/dashboard.js` | Evidence dashboard: drop files / pick the whole evidence folder → ticks checklist items whose file names match, per-group cards + overall progress bar, missing list with "go back to Lab NN", reads recognisable CSVs and builds SUMMARY.md rows (copy / download) — all client-side |
| `evidence/checklist.json` | **Single source** of the checklist (57 items, 5 groups, exact target file names + search patterns) used by the page and both scripts |
| `evidence/CHECKLIST.md` | Human-readable checklist, exact file names e.g. `evidence/01-screenshots/lab05-style.png` |
| `evidence/SUMMARY.md` | Table template of key numbers with **source file + measured date** columns (FPS per machine, AI ms, face login accuracy/time, gesture accuracy overall + per lighting, rep-count accuracy, filter jitter reduction, max spread improvement, sessions, participants, task success, survey mean ± SD, SUS). All blank — never invented |
| `evidence/README.md` | Which file goes into which report chapter / presentation part |
| `evidence/01-screenshots … 05-code/` | The 5 group folders |
| `tools/collect-evidence.ps1` | Windows PowerShell: scans the project + Downloads by file-name pattern, copies (never moves) the newest match into the structure, generates `repo-link.txt` and `file-structure.txt`, reports and writes `evidence/MISSING.txt`. Options `-ProjectRoot`, `-Downloads`, `-Force` |
| `tools/collect-evidence.sh` | Same for Mac/Linux (uses Python 3, already needed by start.sh): `bash tools/collect-evidence.sh [projectRoot] [downloads] [--force]` |
| `js/csv-kit.js` | CSV parser + recogniser (survey, user tasks, evaluation, benchmark, sessions, filters, face login, rep test) + SUMMARY rows. Shared with Labs 38/39 |
| `samples/DEMO-*.csv` | Synthetic demo files for the "ลองด้วยไฟล์ตัวอย่าง" button. Files starting `DEMO-` are never counted as evidence by the page or the scripts |

Usage in your real project: copy `evidence/` and `tools/` to the project root, then run the script (Windows: right-click `collect-evidence.ps1` → Run with PowerShell, or `powershell -ExecutionPolicy Bypass -File tools\collect-evidence.ps1`).

## Blanks we filled in
| Blank | Value | Why |
|---|---|---|
| a ___ minute demonstration | **2 minutes** (`03-video/demo-2min.mp4/.webm/.mov`) | Hint: longer and the panel loses interest |
| At minimum it must include ___ ___ ___ ___ ___ | **overall accuracy, average frame rate, average login time, number of test participants, mean satisfaction score** (+ AI ms, per-lighting accuracy, rep-count accuracy, jitter reduction, spread improvement) | Hint list plus the numbers Labs 38–39 need |
| file naming | `labNN-what.ext` inside the group folder | SHOULD: name files systematically |

## How to verify (MUST / PASS)
- [ ] Run the collect script → all 5 groups present; `MISSING.txt` is empty/removed.
- [ ] `03-video/demo-2min.*` exists (a recorded video, not only a live demo).
- [ ] Open `index.html`, pick the evidence folder → progress 100 %, and the SUMMARY table has a file name and a date in every filled row. Paste it into `evidence/SUMMARY.md`.
- [ ] No participant faces or real names in screenshots/videos (blur, or specific permission).
- PASS: evidence covers all five groups, the demo video exists, every number in the summary is traceable.

## Things your team should change / สิ่งที่ทีมต้องเปลี่ยน
- App name "HandRehab Arcade", team "ทีม NeonHands", school "โรงเรียนของเรา" are placeholders (team badge, documents).
