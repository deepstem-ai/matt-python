# Lab 40 — Rehearse the Presentation and Prepare the Backup Plan (ซ้อมนำเสนอและแผนสำรอง)

**Goal:** a 5-minute pitch that lands on time, 15 prepared answers, and a rehearsed fallback for everything that can fail.

## How to run / วิธีเปิด
- Windows: double-click `start.bat` (opens `index.html` in app mode)
- Mac / Linux: `bash start.sh`
- Or: `python -m http.server 8000` in this folder, then open http://localhost:8000
- Must be opened through a server (not by double-clicking the .html) because pages load modules / JSON / templates.

## What you get
| File | What it is |
|---|---|
| `index.html` + `js/rehearsal.js` | Rehearsal timer: huge 5:00 countdown (red when over), 5 section bar, current section's speaker + the actual words + actions, "ahead / behind plan" indicator, **Space** start/pause, **N / →** next section (records split), half-time mode (2:30). Every run's per-section splits saved (localStorage) and compared with plan in the "ผลซ้อม" tab with a 5-run progress bar + CSV. "การ์ดแผนสำรอง" tab: 9 big cards (keys 1–9) opening a full-screen card with "do now" steps in huge type + prep list + "rehearsed" tick (≥ 3 needed) |
| `js/pitch-data.js` | Script sections + Plan-B data used by the page (same content as the docs) |
| `docs/pitch.md` | Minute-by-minute script (problem, solution, live demo, results, limitations/future) with the actual Thai words, actions, speaker split, 10-second fallback rule, half-time version, rehearsal log |
| `docs/qa-prep.md` | 15 likely questions with answers, incl. all the hard ones (sensor glove, poor lighting, face-data security, what we vs. the AI wrote, injury responsibility, difference from existing apps) + 3 spare |
| `docs/plan-b.md` | 9 situations — network, camera, computer crash, display, dim room, noise, time halved, model won't load, **face login fails on stage** — each with prepare-in-advance / do-on-the-day + how to rehearse 3 of them |
| `docs/packing-list.md` | Essentials vs backups vs morning-of checks; commonly forgotten items starred (HDMI/USB-C adapter, extension cord, mouse, spare webcam, desk lamp, USB drive with offline package, signed consent forms, backup demo video) |

## Blanks we filled in
| Blank | Value | Why |
|---|---|---|
| a presentation script lasting ___ minutes | **5** | Hint: standard for most competitions |
| ___ questions a panel is likely to ask | **15** (+3 spare) | Hint |
| fallback plans for ___ situations | **9** | 8 listed + one of ours |
| … and ___ (extra situation) | **face login fails on stage** (→ backup PIN) | Our demo starts with face login; lighting on stage differs |
| things people usually forget, such as ___ | display adapters, power strip, spare USB drive, original signed consent forms, mouse, spare webcam, desk lamp, backup demo video | Hint + brief |

Numbers in the script/answers are written as [ … ] placeholders: fill them only from `evidence/SUMMARY.md`.

## How to verify (MUST / PASS)
- [ ] Rehearse the full pitch 5 times with the timer; the "ผลซ้อม" tab shows 5 runs and the last runs are within ±10 s of 5:00.
- [ ] Rehearse at least 3 Plan-B situations for real and tick them on the cards (chip turns green 3/3).
- [ ] Every member can answer question 4 (what we wrote vs. what the AI helped with).
- [ ] Demo video ready in a second tab; app open before stepping up; diagnostic panels hidden.
- PASS: rehearsed five times, timing lands exactly, backup plan rehearsed for at least three situations.

## Things your team should change / สิ่งที่ทีมต้องเปลี่ยน
- App name "HandRehab Arcade", team "ทีม NeonHands", school "โรงเรียนของเรา" are placeholders (form fields / badge).
- Speaker names (คนที่ 1/2/3) in `js/pitch-data.js` and `docs/pitch.md`.
