# Lab 38 — Write Chapter 1 from What You Actually Built (เขียนบทที่ 1 จากของจริง)

**Goal:** a Chapter 1 draft in formal Thai with all 7 sections, where every number traces back to an evidence file — and where data is missing, a visible marker tells you which lab to go back to.
เป้าหมาย: บทที่ 1 ครบ 7 หัวข้อ ทุกตัวเลขมีไฟล์ที่มา ไม่มีข้อมูล = เว้นว่างและบอกแลปที่ต้องกลับไปวัด

## How to run / วิธีเปิด
- Windows: double-click `start.bat` (opens `index.html` in app mode)
- Mac / Linux: `bash start.sh`
- Or: `python -m http.server 8000` in this folder, then open http://localhost:8000
- Must be opened through a server (not by double-clicking the .html) because pages load modules / JSON / templates.

## What you get
| File | What it is |
|---|---|
| `index.html` + `js/chapter1.js` | "Chapter 1 builder": form grouped by source lab (Lab 36 user test, Lab 32 accuracy + lighting, Lab 33 machine table, Lab 20/31 gesture list, Lab 27/21/18 calibration values …), drop CSV files to auto-fill, live Thai draft, count + list of `[[missing: กลับไป Lab NN — …]]`, list of paragraphs the team must write/cite, hypothesis-readiness list, copy + download .md. Form is remembered in this browser (localStorage) |
| `templates/chapter1-template.md` | Formal Thai template: 1.1 background (inverted triangle) · 1.2 five measurable objectives each mapped to a Chapter 4 section · 1.3 five hypotheses answerable with real data · 1.4 scope (population/sample, gestures, hardware, software, duration) · 1.5 variables table (independent/dependent/controlled) · 1.6 **14 operational definitions with formulas** (palm scale, normDist, pinch with calibrated threshold T = r − k(r − b), curl, fist, spread, repetition hysteresis, accuracy, P/R/F1, dim light, FPS, login time, older adult, satisfaction) · 1.7 benefits (patients / medical staff / computer science). Every number is a marker `[[ใส่ค่าจาก Lab NN: … #key]]` |
| `prompts/chapter1-prompt.md` | The Lab 38 prompt with every blank filled (paste-in slots for your real data) |
| `js/draft-engine.js` | Template filler (shared with Lab 39): value → inserted, no value → `[[missing: …]]` |
| `js/csv-kit.js`, `samples/DEMO-*.csv` | CSV recogniser from Lab 37 + demo files (DEMO numbers must never go into the report) |

## Blanks we filled in
| Blank | Value | Why |
|---|---|---|
| paste user testing results (Lab 36) | form fields + drop `lab36-survey-responses.csv` / `lab36-task-results.csv` | Auto-computed n, success %, mean ± SD |
| paste accuracy + lighting (Lab 32) | form fields + drop `lab32-evaluation.csv` | Overall + bright/normal/dim |
| paste machine comparison (Lab 33) | textarea "name \| CPU/RAM \| FPS \| AI ms" + drop `lab33-benchmark.csv` | Builds the machine table |
| paste gesture list (Lab 20) | 5 checkboxes (pinch, fist, open, finger tap, wrist flex) + invented gestures (Lab 31) | Builds the gesture table |
| pinch threshold "falling below ___" | **the participant's calibrated entry threshold from Lab 27** (field `pinch_enter`) — left as a missing marker until you type the real value | Hint: use the real calibrated value, not an invented one |
| hypothesis criteria | FPS ≥ 15 (Lab 16 pass), login ≤ 5 s (Lab 15 pass), satisfaction ≥ 3.51 (team choice, editable) | Taken from pass conditions, as the pitfall suggests |

Code-configuration values (rep counter enter 0.7 / exit 0.3 / hold 200 ms / cooldown 300 ms, fist 0.7, open 45°) are pre-filled from the shared js files because they are settings, not measurements — change them if your team tuned them.

## How to verify (MUST / PASS)
- [ ] Drop all your real CSVs from `evidence/`; the chip "ยังขาดข้อมูล" should head towards 0. Each remaining marker names the lab to redo.
- [ ] Never type a number you cannot point to in `evidence/SUMMARY.md`.
- [ ] Download the .md, then **rewrite the prose in your own voice**; read it aloud.
- [ ] Replace every `[[ใส่สถิติจากแหล่งอ้างอิงจริง: …]]` with a real cited statistic.
- PASS: Chapter 1 covers all seven sections and every number traces back to an evidence file.

## Things your team should change / สิ่งที่ทีมต้องเปลี่ยน
- App name "HandRehab Arcade", team "ทีม NeonHands", school "โรงเรียนของเรา" are placeholders (form fields / badge).
