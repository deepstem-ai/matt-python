# Lab 36 — Test with Real Older Adults (ทดสอบกับผู้สูงอายุจริง)

**Goal:** find out whether the app truly works by watching 5 real people use it alone, then fix what they could not do.
เป้าหมาย: ให้ผู้ใช้จริง 5 คนลองใช้เองโดยไม่ช่วย จดสิ่งที่ทำไม่ได้ แล้วแก้อย่างน้อย 3 ข้อ

## How to run / วิธีเปิด
- Windows: double-click `start.bat` (opens `index.html` in app mode)
- Mac / Linux: `bash start.sh`
- Or: `python -m http.server 8000` in this folder, then open http://localhost:8000
- Must be opened through a server (not by double-clicking the .html) because pages load modules / JSON / templates.

## What you get / มีอะไรบ้าง
| File | What it is |
|---|---|
| `index.html` | Menu: consent → test recorder → survey → results, plus "load demo responses" (5 fake DEMO-P0x participants) |
| `docs/consent-form.md` | Thai consent form (what happens, duration, data collected, where stored, who sees it, stop any time, how to request deletion, optional audio/video/face) |
| `docs/consent-form.html` | Printable version: 20pt+ type, A4 print CSS, tick boxes and signature lines (participant, witness, student) |
| `docs/test-script.md` | Facilitator script: opening words, observer rules, 8 tasks with success criteria and max time, per-participant table (ทำได้เอง / ต้องช่วย / ทำไม่ได้ / เวลาที่ใช้ / quotes), 5-person summary, issue list |
| `tools/test-recorder.html` + `js/test-recorder.js` | Digital recorder: consent check, one task per screen, timer, 3 big outcome buttons, exact-quote note, auto-save to IndexedDB, summary table, CSV export, issue list (≥5 found / ≥3 fixed tracker) |
| `survey.html` | 10 questions, one per screen, 😄🙂😐🙁😞 very large buttons (elder profile), optional comment, saved to db store `surveys`, CSV export |
| `results.html` | Mean ± SD per question (bar chart with SD error bars), per-dimension table, task outcome table, quotes, save PNG, 3 CSV exports, DEMO toggle |
| `js/usertest-data.js` | Single source for tasks, faces, questions, demo generator |
| `js/usertest-store.js`, `js/usertest-csv.js` | DB access (surveys store; task records + issues in `settings` as `usertest-*` keys — db.js schema unchanged) and CSV/statistics |
| `css/`, `js/ui.js`, `js/db.js`, `js/charts.js` | Shared core (themes.css gained a `body.paper` + `@media print` token block for printing) |

CSV files (fixed column names, read by Labs 37–39): `lab36-survey-responses.csv` (participant, date, q1..q10, mean, comment, demo), `lab36-survey-summary.csv`, `lab36-task-results.csv` (participant, date, task, task_th, outcome, seconds, note, demo), `lab36-issues.csv`.

## Blanks we filled in / ช่องว่างที่เติมแล้ว
| Blank in the prompt | Value we chose | Why |
|---|---|---|
| testing script with ___ tasks | **8 tasks** (register alone, face capture, face login, senior mode, calibration, one full round of a game, view progress chart, log out) | Brief asked for 8; hint says 6 ≈ 20 min, so 8 ≈ 25–30 min — consent form says 20–30 min |
| play the ___ game | **Star Portal (จับดาวใส่ประตูมิติ)** | Easiest game, uses the pinch gesture |
| questionnaire of ___ questions | **10** | Hint: more than 10 and older adults answer carelessly |
| results chart | mean ± SD bar chart, saved as PNG | Prompt item 4 |
| Usability scale | **SUS, 10 standard items, 1–5**, compared with **68** |

Questions cover: ease (q1–q3), enjoyment (q4–q5), tiredness (q6–q7), confidence to keep using (q8–q9), privacy (q10). All are written positively so 😄 = 5 = best.

## Article alignment (MITIJ article)

- **SUS mode** (article §6.2): `survey.html?mode=sus` (or the choice on the start page) asks the 10 standard System Usability Scale items (Brooke 1996) in faithful Thai, on a 1–5 agreement scale (1 = ไม่เห็นด้วยอย่างยิ่ง … 5 = เห็นด้วยอย่างยิ่ง). Records are saved with `instrument: "sus"` and `sus` score.
- `results.html` shows each participant’s **SUS = 2.5 × [Σ(odd − 1) + Σ(5 − even)]**, the **mean ± SD**, and a bar chart with the **68** benchmark line (Acharya et al. 2025); CSV `lab36-sus-responses.csv`. The team questionnaire statistics ignore SUS records.
- Pure logic in `js/sus.js`; test `node tests/sus.test.mjs` (all 3s → 50, ideal → 100, worst → 0, mixed example 77.5).
- `js/charts.js` `barChart` accepts optional reference lines `opts.lines = [{ value, color, label }]` (used for the SUS 68 line in Lab 36). Existing charts are unchanged.

## How to verify (MUST / PASS) / วิธีตรวจ
- [ ] Print `docs/consent-form.html` (Ctrl+P → A4) — every participant signs **before** starting (the recorder refuses to start without the consent tick).
- [ ] Run the 8 tasks with `tools/test-recorder.html`; never help — record ทำได้เอง / ต้องช่วย / ทำไม่ได้ + time + exact words.
- [ ] Each participant completes `survey.html` alone.
- [ ] SUS: run `survey.html?mode=sus`; `node tests/sus.test.mjs` passes (all 3s → 50, ideal → 100). `results.html` SUS section shows each participant’s score, mean ± SD and the 68 line.
- [ ] `results.html` shows n = 5, mean ± SD per question; save the PNG and the CSVs into `evidence/` (Lab 37).
- [ ] The issue list shows **≥ 5 issues found and ≥ 3 fixed** (chip turns green).
- [ ] Before using numbers in the report: switch off "รวมข้อมูลตัวอย่าง (DEMO)" or press "ลบข้อมูลตัวอย่าง" on the menu.
- PASS: five people tested, all consent forms signed, five issues identified, at least three fixed.

## Things your team should change / สิ่งที่ทีมต้องเปลี่ยน
- App name "HandRehab Arcade", team "ทีม NeonHands", school "โรงเรียนของเรา" are placeholders (team badge, documents).
- Consent form: advisor name and phone number.
