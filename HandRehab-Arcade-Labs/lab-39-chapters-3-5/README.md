# Lab 39 — Write Chapters 3, 4 and 5 from the Numbers You Measured (เขียนบทที่ 3–5 จากตัวเลขจริง)

**Goal:** Chapter 3 (method: architecture, missions, equations, tools, procedure, criteria), Chapter 4 (real tables with mean ± SD and "ที่มา: ไฟล์ …" under every table) and Chapter 5 (conclusion, discussion scaffold, limitations, recommendations).

## How to run / วิธีเปิด
- Windows: double-click `start.bat` (opens `index.html` in app mode)
- Mac / Linux: `bash start.sh`
- Or: `python -m http.server 8000` in this folder, then open http://localhost:8000
- Must be opened through a server (not by double-clicking the .html) because pages load modules / JSON / templates.

## What you get
| File | What it is |
|---|---|
| `index.html` + `js/chapters.js` | Generator: drop CSVs (survey, user tasks, evaluation, benchmark, sessions, filters, face login, rep test) → computes accuracy, P/R/F1, confusion matrix, per-lighting accuracy + brightness, per-machine FPS mean ± SD / min / AI ms, per-scenario FPS, task outcomes, survey mean ± SD + Thai interpretation level, filter table, per-game table, spread improvement, and a hypothesis-result table → fills 3 chapter templates. Tabs per chapter with missing-count chips, copy / download each / download all. Values not in CSVs are entered in a collapsible form |
| `templates/chapter3-template.md` | ASCII system architecture diagram, development process by the 8 missions (table with evidence files), **16 numbered equations** (palmScale, normDist, angle, curl, spread, scoreLow/High + 4 gesture scores, calibration threshold, tremor SD, hysteresis rep counter, One Euro filter, cosine similarity, EAR blink, kNN distance + vote, accuracy/P/R/F1, mean/SD, FPS + luma brightness), tools & versions (MediaPipe Tasks Vision 0.10.14, models, IndexedDB, Python, browser, Claude Code, Git, camera), 5 experimental procedures, inclusion / exclusion / withdrawal criteria, analysis + interpretation scale |
| `templates/chapter4-template.md` | 4.1–4.5 one subsection per Chapter 1 objective + 4.6 extra results + 4.7 hypothesis summary; 11 table/figure captions each followed by "ที่มา: ไฟล์ …" |
| `templates/chapter5-template.md` | Summary per objective; discussion scaffolds for dim light (two-stage palm detector + landmark CNN, sensor gain/noise, motion blur, confidence thresholds, out-of-distribution) and harder gestures (occlusion, single-camera depth, small curl change), marked `[[ทีมเขียนเอง: …]]`; **7 limitations**; **9 recommendations** incl. Jetson Orin Nano edge kiosk deployment |
| `prompts/chapters3-5-prompt.md` | The Lab 39 prompt with every blank filled |
| `js/report-tables.js` | CSV analyses → Markdown tables and values |
| `js/csv-kit.js`, `js/draft-engine.js`, `samples/DEMO-*.csv` | Shared with Labs 37/38 |

## Blanks we filled in
| Blank | Value |
|---|---|
| paste evidence/SUMMARY.md | Drop the same CSVs the summary was built from (the generator recomputes; every table names its file) |
| paste every CSV | Recognised automatically by column names (see csv-kit.js `detectKind`) |
| list the charts that already exist | Figure captions point at the exact Lab 37 file names (`lab32-lighting-accuracy.png`, `lab33-machine-compare.png`, `lab36-survey-chart.png` …) |

## How to verify (MUST / PASS)
- [ ] Drop every real CSV from `evidence/` — Chapter 4's missing chip should reach 0 (or name exactly which lab to redo).
- [ ] Every table in Chapter 4 has a "ที่มา: ไฟล์ …" line naming a real file in `evidence/`.
- [ ] Write the `[[ทีมเขียนเอง: …]]` discussion paragraphs yourselves (the bullets are talking points, not text to copy).
- [ ] Have your supervising teacher review it.
- PASS: Chapters 3, 4 and 5 are complete and every table traces back to a real file.

## Things your team should change / สิ่งที่ทีมต้องเปลี่ยน
- App name "HandRehab Arcade", team "ทีม NeonHands", school "โรงเรียนของเรา" are placeholders (form fields / badge).
