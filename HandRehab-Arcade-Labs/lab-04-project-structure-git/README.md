# Lab 04 — Build the Entire Project Structure, and Save Your Work with Git
### สร้างโครงโปรเจกต์ทั้งหมดในรอบเดียว + ย้อนเวลาได้ด้วย Git

**Goal:** every folder and placeholder file for all 40 labs exists now, the camera app is split into HTML/CSS/JS with identical behaviour, and the team can rewind with git.

## How to run / วิธีเปิด
- App: `start.bat` (Windows) · `bash start.sh` (Mac/Linux) · or `python -m http.server 8000` → http://localhost:8000
- Git practice: `tools/git-practice.bat` (double-click) or `bash tools/git-practice.sh`
  → init → first commit → deletes `js/geometry.js` → restores it with `git checkout -- js/geometry.js` → `git tag lab-04`.
  If the folder is already inside another git repository (like this course repo), the script practises on a **copy in your temp folder** so the outer repo is never touched. In a fresh team folder it works on the real project.

## Files
```
index.html                 camera app, now links css/style.css + js/main.js
css/style.css              the CSS moved out of index.html
css/tokens|parts|themes|pages.css   placeholders (Lab 05/06/05+09/07)
js/main.js                 the JavaScript moved out of index.html (classic script, same behaviour)
js/*.js (21 placeholders)  router camera vision hand geometry gestures rep-counter db charts ml game-engine
                           juice calibration smoothing evaluate device-info validators register
                           face-capture face-login dataset-loader
js/games/*.js              star-portal rhythm-tap spread-wall (placeholders, Lab 23/24/25)
models/ vendor/ fonts/ datasets/ docs/ evidence/ tools/ css/ js/ js/games/  — each has README.md
.gitignore                 user data + face folders, *.task/*.tflite models, big datasets, OS temp files
docs/PROJECT-MAP.md        which lab writes which file, ASCII "who calls whom" diagram, future on-screen controls
docs/GIT-CHEATSHEET.md     the 8 commands, one sentence each + commit vs tag = game save vs named save slot
docs/WORKFLOW.md           per-lab ritual: start / mid-lab breaking / finish
tools/git-practice.bat|sh  guided delete-and-restore exercise
CLAUDE.md, prompts/, docs/HOW-TO-*.md, start*.bat, start.sh — carried over (CLAUDE.md gains rules 3.8–3.9, 4.8)
```
Every placeholder has exactly three Thai comment lines — responsibility / which lab writes it / what it must never touch — and no code, e.g.:
```js
// geometry.js — หน้าที่: คณิตศาสตร์ของมือ: ระยะ มุม การงอนิ้ว การกางนิ้ว (ฟังก์ชันล้วน)
// ไฟล์นี้จะเขียนจริงใน Lab 18
// ข้อห้าม: ห้ามแตะกล้อง ห้ามแตะหน้าจอ ห้ามแตะฐานข้อมูล — รับตัวเลขเข้า ส่งตัวเลขออกเท่านั้น
```

## Blanks we filled in
| Blank | Value |
|---|---|
| Model files larger than ___ MB | **5 MB** — git cannot ignore by size, so `.gitignore` blocks the model extensions `*.task *.tflite *.onnx *.bin` and everything in `models/` except its README |
| Ritual — starting a lab | `git status` clean → read PROJECT-MAP → read placeholder headers → fill blanks as a team → check app still runs → five-line prompt → plan → `GO` |
| Ritual — code starts breaking | stop after 2 failed fix requests → F12 first red line → `git diff` → strong bug prompt → `git checkout -- file` → `git checkout lab-XX` if needed; small commits whenever something works |
| Ritual — finishing a lab | PASS checks → evidence/lab-XX → `git add .` + commit "what now works" → `git tag lab-XX` → tick PROJECT-MAP → daily log |

## How to verify (MUST / PASS checklist)
- [ ] Open the app via `start.bat`: camera, FPS, mirror toggle, resolution selector and the three Thai error cards behave exactly as in Lab 01–03.
- [ ] Folders and files match the tree in `docs/PROJECT-MAP.md`; open a few placeholders — each says which lab fills it.
- [ ] Run `tools/git-practice` — you see `D js/geometry.js` after deleting and the file back after `git checkout -- js/geometry.js`. Screenshot it into `evidence/lab-04/`.
- [ ] `git tag` lists `lab-04`. From now on: commit + tag at the end of **every** lab.
- [ ] COULD: keep a daily progress log; draw the structure diagram for Chapter 3 (start from PROJECT-MAP section 3).
