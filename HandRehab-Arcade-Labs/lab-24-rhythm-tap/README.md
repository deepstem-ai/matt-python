# Lab 24 — Game Two: Rhythm Tapping · เคาะจังหวะทีละนิ้ว

**Goal:** train **finger individuation**, moving one finger at a time. The game measures reaction time for **every** tap, finger by finger, so the report can name the slowest finger. The theme is a **neon concert stage** with swinging spotlights.
เป้าหมาย: ฝึกการขยับนิ้วแยกทีละนิ้ว และบอกได้ว่านิ้วไหนช้าที่สุด

## How to run · วิธีเปิด
`start.bat` · `bash start.sh` · or `python -m http.server 8000` and open http://localhost:8000. `index.html` **is the game**.

## How to play · วิธีเล่น
- Five round pads stand for thumb · index · middle · ring · little, coloured with `--f-thumb … --f-little`. One pad lights up at random, with a 3-second countdown ring.
- Tap that finger: bend it down and lift it back, using `detectFingerTap(...).finger`. A tap counts only after all fingers have been straight for 0.1 s, so one bend never counts twice.
  - **Correct:** a ripple, particles, and that finger's own pentatonic note (`Sound.note(i)`, C-D-E-G-A, which sound pleasant together). You get +10 × level.
  - **Wrong finger:** the pad shakes red and you lose 5 points. The mistake is recorded as *target → tapped finger*.
  - **Slower than 3 s:** a miss.
- **5 speed levels**, starting at the slowest (the gap before the next pad is 1.4 → 0.45 s). **5 correct in a row** moves you up a level. **3 misses** (wrong finger or too slow) move you down.
- Round = 60 s, with a ⏸ pause button at all times and a rest reminder every 5 min.
- **Demo mode ⌨:** keys **1–5** (1 = thumb … 5 = little), or click a pad. The game offers it when the camera fails, and the button switches to it any time.

## End-of-round report · รายงานท้ายรอบ
- A `barChart` (core `charts.js`) of the **mean reaction time per finger**, with SD error bars.
- The sentence **"นิ้ว\_\_ของคุณช้าที่สุด ลองฝึกนิ้วนี้เพิ่ม"**, where the blank is the finger with the highest mean RT. The fastest finger is also named.
- A **confusion table** (rows = target, columns = finger actually tapped). The diagonal shows correct counts; red cells are confusions. The most frequent confusion is named.
- Score, correct, wrong / miss, accuracy, highest level, mean RT, and a comparison with the previous attempt.

## Data saved · ข้อมูลที่บันทึก
- `sessions`: `{ game:'rhythm-tap', userId, startTime, endTime, reps (correct taps), accuracy, score, avgFps, delegate, machine, details:{ reactionTimes:{thumb:[ms…],…}, confusion:{target:{tapped:n}}, meanRtByFinger, meanRtMs, slowestFinger, maxLevel, trials, wrong, miss, demo } }`. **Every** reaction time is stored, not only the average.
- `reps`: one per trial `{ sessionId, userId, game, gesture:'fingerTap', n, t, finger (target), tapped, result:'correct'|'wrong'|'miss', reactionMs, level }`

## Files · ไฟล์
| File | Role |
|---|---|
| `index.html`, `js/rhythm-tap-page.js` | Page, report, saving |
| `js/games/rhythm-tap.js` | Rules, levels, recording |
| `js/games/rhythm-tap-draw.js` | Stage, pads, ripples |
| `js/games/game-shell.js` | Shared game helpers (camera input, pause, rest, compare) |
| `js/charts.js` | Bar chart (see the fix below) |
| other `js/*`, `css/*` | Shared core + `world-stage` colours |

## Blanks we filled in · ค่าที่เติม
| Blank | Value |
|---|---|
| Slower than ___ s = miss | **3 s** |
| Levels | **5** (the hint suggests 3; 5 gives a smoother ramp for fast players) |
| Correct in a row to level up | **5** |
| Misses to drop a level | **3** (wrong finger or timeout) |
| "your ___ finger is the slowest" | filled automatically from the data |
| Game theme | **Neon concert stage** |

## MUST / PASS checklist · วิธีตรวจ
- [ ] **Every RT by finger:** after a round, `sessions.details.reactionTimes` has an array of ms values for each finger.
- [ ] **Report names the slowest finger**, with the bar chart and the confusion table.
- [ ] Test tip: if taps are unreliable, check that the other fingers stay straight (`GESTURE_CONFIG.fingerTap.othersMax`).
- [ ] **PASS:** a round ends showing the per-finger chart, and you know which finger is slowest.

## Core fix in this copy
- `charts.js` `barChart`: the SD error bar could be drawn below the 0 axis. It is now clamped at 0.

> Placeholders to change: "HandRehab Arcade", "ทีม NeonHands", "โรงเรียนของเรา".
