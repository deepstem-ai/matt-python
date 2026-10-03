# Lab 28 — Record Every Training Session · บันทึกทุกการฝึกอย่างละเอียด

**Goal:** collect the real data that becomes **Chapter 4** of your report. That means every repetition, the environment (FPS, light, machine) and how the player felt.
เป้าหมาย: เก็บข้อมูลจริงละเอียดพอสำหรับบทที่ 4

## How to run · วิธีเปิด
`start.bat` · `bash start.sh` · or `python -m http.server 8000` and open http://localhost:8000.
- `index.html` is the **history page** (`history.html` redirects to it). Its top menu links to the three games and to `menu.html` (Lab 26 menu, streak, achievements).
- No data yet? Press **🧪 สร้างประวัติจำลอง 30 วัน**. It creates about 60 sessions and 1,200 repetitions for the current player, all tagged "จำลอง" (synthetic). They are for demos only. **🧹** deletes only the synthetic rows.
- All three games still have their demo modes and the Lab 26 combo/achievement system.

## What is recorded · ข้อมูลที่บันทึก (`js/recorder.js`)
1. **Every repetition, the moment it happens** (store `reps`):
   `{ sessionId, userId, game, timestamp, gesture, peak, holdMs, success, angle, … }`
   - Star Portal: `gesture:'pinch'`, peak and hold from the rep counter, and angle = the **narrowest thumb–index angle** during the pinch.
   - Rhythm Tap: `gesture:'fingerTap'`, every correct, wrong or missed tap (success = correct), plus `finger`, `reactionMs`, and angle = the **bend of the tapped finger** (180° − angle at the middle joint).
   - Spread Wall: `gesture:'spread'`, every wall (success = passed), and angle = the **index–little spread** in degrees.
   In demo modes (mouse or keys) the angle is `null`, because there is no hand.
2. **The session** is created when the round starts (`status:'in-progress'`, so live reps always have an owner) and completed at the end:
   `{ userId, game, startTime, endTime, reps, accuracy, score, avgFps, avgBrightness, machine, delegate, maxSpreadDeg?, feeling?, details }`
   - **avgFps**: the engine FPS, sampled every second (pauses are skipped).
   - **avgBrightness**: `camera.measureBrightness(video)` (0–255), sampled every second from the real video. It is `null` in demo mode.
   - **machine**: the name you type on the history page (`settings › machine`), e.g. "โน้ตบุ๊กห้องคอม 3". **delegate**: `GPU` / `CPU` from the hand model (or `demo`).
3. **Post-session feeling** (`js/feeling.js`): 5 emoji faces (😫 เหนื่อยมาก … 😄 สบายมาก), **pain 0–10** (a warning appears at ≥ 7), and a free note. It is saved to `session.feeling = { mood, pain, note, at }`.

## History page · หน้าประวัติ
- Session **cards, newest first**, with game, date, duration, reps, accuracy, score, max spread, FPS, light, GPU/CPU + machine, and the feeling face.
- **Tap a card** to see every repetition (time, gesture, peak, hold, ✓/✗, angle, finger / result / ms). The card also has a **🗑 delete** button with a confirmation dialog.
- **Filters:** date range, game, **feeling** (good 4–5 / not good 1–2 / pain ≥ 4 / not recorded), and **accuracy below 60 % or 80 %** (what a physiotherapist looks for).
- **CSV export with BOM** (Thai text is intact in Excel): `sessions-*.csv` and `reps-*.csv` (the reps of the filtered sessions). **ส่งออกแบบไม่ระบุตัวตน** replaces the user with `P01` and removes the free-text notes (PDPA-friendly).
- Player picker (per-user history), and a machine-name field.

## Files · ไฟล์
| File | Role |
|---|---|
| `index.html` (+ `history.html` redirect), `js/history-page.js`, `css/history.css` | History page |
| `js/recorder.js` | `SessionRecorder` (live reps, FPS/brightness sampling, finish), `saveFeeling`, machine name |
| `js/feeling.js` | Emoji + pain + note form |
| `js/demo-history.js` | 30-day synthetic generator (one transaction) + cleaner. Also used by Lab 29 |
| `star-portal.html`, `rhythm-tap.html`, `spread-wall.html`, `js/*-page.js`, `js/games/*` | Games with the `onRep` hook → recorder, and the feeling form after the summary |
| `menu.html`, `achievements.html`, `js/juice*.js`, `js/achievements.js`, `js/streak.js` | Lab 26 fun layer (carried over) |
| other `js/*`, `css/*`, `start.*`, `tests/juice.test.mjs` | Shared core |

## Blanks we filled in · ค่าที่เติม
| Blank | Value |
|---|---|
| Filters by date range, by game, and by ___ | **feeling** (mood / pain), plus **accuracy below a threshold** and the player picker |
| Post-session field, for example ___ | **emoji mood scale (5 faces) + pain 0–10 + free note** ("เมื่อคืนนอนน้อย", "ข้อนิ้วตึง") |
| Star Portal release threshold (θ_off) | **0.3** (was 0.35) — article eq. (7)/(8): k_off = 0.3; release when score ≤ 0.3 |
| RepCounter cooldown | **400 ms** (was 150 in the games, 300 default) — article eq. (7) |

## Article alignment (MITIJ article)

- Every session now stores `details.thresholds` (θ_on 0.7, θ_off 0.3, cooldown 400 ms, d_open 0.80, d_close 0.25, locked false, source "default") so later analysis knows which thresholds were used.
- Rhythm Tap summary shows the **timing resolution ≈ 1000 / avgFps ms** next to the mean reaction time (≈ 33 ms at 30 fps, article §4) and saves it as `details.timingResolutionMs`.
- Star Portal (`js/games/star-portal.js`): PINCH_OFF **0.3** (was 0.35) = θ_off = k_off of eqs. (7)/(8); the game’s own release test is now `pinchScore <= PINCH_OFF`; its RepCounter uses cooldown **400 ms** (was 150).
- `js/rep-counter.js` follows **eq. (7)**: release when score **≤ θ_off** (was `<`), default `cooldownMs` **400 ms** (was 300).
- `js/geometry.js` comments now cite the article equation numbers: **eq. (1)** palm size s = ‖p0 − p9‖ (`palmScale`) and **eq. (2)** d̂ij = ‖pi − pj‖ / s (`normDist`). Comments only — no behaviour change.
- `js/gestures.js` pinch comment cites **eq. (3)** π = clip((d_open − d̂48)/(d_open − d_close)), with d_open = `pinch.zero` = 0.80 and d_close = `pinch.full` = 0.25 (comments only).
- `js/charts.js` `barChart` accepts optional reference lines `opts.lines = [{ value, color, label }]` (used for the SUS 68 line in Lab 36). Existing charts are unchanged.

## MUST / PASS checklist · วิธีตรวจ
- [ ] Type a machine name, then play **5 sessions** (demo or camera). Each one appears as a card. A camera session shows **แสง xx/255** and **GPU/CPU**, and every session shows **FPS**.
- [ ] Tap a card: every repetition is listed with peak, hold, success and angle.
- [ ] Filter by game, date and feeling. Delete one session (confirm it).
- [ ] **⬇ CSV เซสชัน / ⬇ CSV ทุกท่า** → open in Excel/Sheets: the Thai text is correct (the file starts with the UTF-8 BOM `EF BB BF`, which was checked in testing).
- [ ] **PASS:** five sessions play, the CSV exports, and it opens in a spreadsheet with complete data and correct Thai text.
- Record in detail starting now. There will be no time to collect it again when you write Chapter 4.

> Placeholders to change: "HandRehab Arcade", "ทีม NeonHands", "โรงเรียนของเรา". Training data tied to a person is health data, so use the anonymised export for reports.
