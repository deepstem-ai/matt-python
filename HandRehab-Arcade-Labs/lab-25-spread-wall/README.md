# Lab 25 — Game Three: Spread Your Fingers to Pass the Wall · กางนิ้วผ่านกำแพง

**Goal:** train **finger extension and abduction** (spreading), and record the **maximum spread angle of every session**. That number is the key rehabilitation evidence Lab 29 charts. The theme is **underwater**: light rays, bubbles, seaweed and coral walls.
เป้าหมาย: ฝึกการกางนิ้ว และเก็บมุมกางสูงสุดทุกครั้งเป็นหลักฐานพัฒนาการ

## How to run · วิธีเปิด
`start.bat` · `bash start.sh` · or `python -m http.server 8000` and open http://localhost:8000. `index.html` **is the game**.

## How to play · วิธีเล่น
1. **Quick calibration, 2 steps**, the first time and whenever you want (🎯):
   (1) relax with your fingers together for 2 s, which gives **min** (the median);
   (2) spread as wide as you can for 3 s, which gives **max** (the 90th percentile, so one noisy frame cannot set it).
   The values are saved in the `calibration` store, `id = userId + ':spread'`. If min and max differ by less than 8°, the game asks you to calibrate again.
2. The angle comes from `geometry.spread(points, 'index', 'little')`, smoothed a little. It becomes the openness **u = (deg − min) / ((max − min) / sensitivity)**, clamped to 0…1. **No fixed numbers.** The hand's width on screen follows u.
3. Walls slide in from the right. Each gap has a **green band**, and your fingertips must be inside it. Too narrow or too wide is a collision: energy −25, a red flash and a sound. Passing gives +10 × level.
4. **Difficulty ramps** every 5 walls passed: **wall speed rises** (160 → 360 px/s) and the **gap tolerance shrinks** (±0.22 → ±0.08 of *your own* range). Gaps never ask for more than your calibrated maximum.
5. When the energy bar is empty the game is over, or press 🏁 จบเกม. ⏸ pause works at any time, and a rest reminder appears every 5 min.
6. **Practice mode** (collisions cost no energy) and a **sensitivity** slider.
7. **Demo mode 🖱:** the mouse wheel over the game, or the "มุมกาง" slider, sets the spread angle. Calibration works the same way in demo mode: slider low, then high. Demo calibration is stored separately from camera calibration.

## The most valuable part · ส่วนที่สำคัญที่สุด
- The badge shows the **current angle**, **today's max**, and the **previous best**. A floating toast appears when you break your record.
- At the end: **"วันนี้คุณกางนิ้วได้มากกว่าครั้งก่อน X องศา"** (compared with the best of all previous sessions). If you did not beat it, you see a gentle message instead.
- The session record stores **`maxSpreadDeg`**. The daily maximum is also kept in `settings` key `spread-daily:<userId>` as `{ 'YYYY-MM-DD': deg }`, ready for Lab 29.

## Data saved · ข้อมูลที่บันทึก
- `sessions`: `{ game:'spread-wall', userId, startTime, endTime, reps (walls), accuracy (passed/walls), score, maxSpreadDeg, avgFps, delegate, machine, details:{ calibration, sensitivity, practice, passed, hits, levelReached, prevBestDeg, demo } }`
- `reps`: one per wall `{ gesture:'spread', n, t, result:'pass'|'hit', targetU, handU, tol, spreadDeg, level }`
- `calibration`: `{ id:'<userId>:spread', userId, gesture:'spread', min, max, at, source:'hand'|'demo' }`

## Files · ไฟล์
| File | Role |
|---|---|
| `index.html`, `js/spread-wall-page.js` | Page, calibration flow, record comparison, saving |
| `js/games/spread-wall.js` | Rules: angle → width, walls, collisions, difficulty, max angle |
| `js/games/spread-calibrate.js` | 2-step calibration + load/save |
| `js/games/spread-wall-draw.js` | Underwater scene, walls, hand character |
| `js/games/game-shell.js` | Shared game helpers |
| other `js/*`, `css/*` | Shared core + `world-sea` colours |

## Blanks we filled in · ค่าที่เติม
| Blank | Value |
|---|---|
| "today you spread ___ degrees further" | computed: this session's max − the previous best |
| Difficulty rises by increasing ___ | **wall speed** |
| …and reducing ___ | **gap tolerance** (the width of the green band) |
| Rest reminder every | **5 minutes** |
| Game theme | **Underwater / coral reef** |

## Article alignment (MITIJ article)

- `js/geometry.js` comments now cite the article equation numbers: **eq. (1)** palm size s = ‖p0 − p9‖ (`palmScale`) and **eq. (2)** d̂ij = ‖pi − pj‖ / s (`normDist`). Comments only — no behaviour change.
- `js/gestures.js` pinch comment cites **eq. (3)** π = clip((d_open − d̂48)/(d_open − d_close)), with d_open = `pinch.zero` = 0.80 and d_close = `pinch.full` = 0.25 (comments only).

## MUST / PASS checklist · วิธีตรวจ
- [ ] **Per-person calibration:** two people calibrate. Both can reach the widest gaps, because width is relative to each person's own min/max.
- [ ] **Max angle saved:** after a game, `sessions` has `maxSpreadDeg`, and `settings › spread-daily:<user>` has today's value.
- [ ] **Compared with before:** the second game shows "มากกว่าครั้งก่อน X องศา" when you beat the record.
- [ ] **PASS:** the game plays, remembers the maximum spread, and compares it against the previous attempt.

If the character flickers, Lab 27 replaces the simple smoothing with a One Euro filter.

> Placeholders to change: "HandRehab Arcade", "ทีม NeonHands", "โรงเรียนของเรา".
