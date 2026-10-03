# Lab 23 — Game One: Catch the Star, Drop It in the Portal · จับดาวใส่ประตูมิติ

**Goal:** the first playable game. It trains the **pinch** (thumb tip to index tip), the grip used to pick up coins, fasten buttons and hold pills. The theme is **space**: a gradient nebula drawn on the canvas in token colours.
เป้าหมาย: เกมแรกที่เล่นได้จริง ฝึกการจีบนิ้ว

## How to run · วิธีเปิด
`start.bat` (Windows) · `bash start.sh` (Mac/Linux) · or `python -m http.server 8000` and open http://localhost:8000
`index.html` **is the game**.

## How to play · วิธีเล่น
1. Press **📷 เริ่มด้วยกล้อง**. The camera opens and the hand model loads, with a Thai progress message. If anything fails, you get a Thai message with **ลองอีกครั้ง** and **เล่นโหมดสาธิต** buttons.
2. Your **index fingertip** (point 8), mirrored with `toScreen()`, is the round pointer. The dashed circle shows the grab radius.
3. Pinch while the pointer is over the ⭐ to grab it. Drag it into the 🌀 portal and release to score +1, with an effect and a sound. Releasing anywhere else sends the star back to its place.
4. A round lasts **60 s**, and the bar at the top drains. **⏸ หยุดพัก** (or P / Esc) works at any time. A **rest reminder** pauses the game every 5 minutes of play.
5. **Demo mode 🖱** works without a camera: the mouse is the fingertip, and holding the mouse button is a pinch. The page falls back to it when the camera fails, and you can also switch with the button.

At the end of each round, a summary shows: score, **reps** (pinches counted by a `RepCounter` on the pinch score, enter 0.7 / exit 0.3 — release when ≤ 0.3, cooldown 400 ms, article eq. 7), **accuracy** (stars scored ÷ releases), **average time per star**, best combo, and a **comparison with the previous attempt**. Every play is saved.

## Data saved · ข้อมูลที่บันทึก (IndexedDB `handrehab-arcade`)
- `sessions`: `{ id, userId (getCurrentUserId() or 'guest'), game:'star-portal', startTime, endTime, reps, accuracy, score, avgFps, delegate, machine, details:{ level, grabRadius, attempts, successes, bestCombo, avgStarMs, starTimes[], demo } }`
- `reps`: one per counted pinch `{ sessionId, userId, game, gesture:'pinch', n, t, peak, holdMs, quality, scored }`
If saving fails, the summary says so and offers **ลองบันทึกอีกครั้ง**.

## Files · ไฟล์
| File | Role |
|---|---|
| `index.html`, `js/star-portal-page.js` | Page: camera/demo, HUD, settings, saving, summary |
| `js/games/star-portal.js` | Game rules (grab/release, scoring, timer, pinch counter) |
| `js/games/star-portal-draw.js` | Space background (cached), star, portal |
| `js/games/game-shell.js` | Shared by the 3 games: HandInput, overlay, pause modal, RestReminder, CountUp, compare-with-previous |
| `js/game-engine.js` | Engine from Lab 22 |
| `js/camera.js`, `vision.js`, `hand.js`, `geometry.js`, `gestures.js`, `rep-counter.js`, `db.js`, `ui.js` | Shared core |
| `css/*` | Tokens, themes (+ `world-space`), parts, game layout |

## Blanks we filled in · ค่าที่เติม
| Blank | Value |
|---|---|
| Grab radius default | **60 px** (slider 30–150) |
| Seconds per round | **60 s** (`?round=10` in the URL for quick tests) |
| Rest reminder every | **5 minutes** of play (`?rest=0.1` for quick tests) |
| Game theme | **Space: stars, a nebula and a portal** |
| (COULD) difficulty | easy / normal / hard: portal size, star size, and the portal moves on hard |
| Star Portal release threshold (θ_off) | **0.3** (was 0.35) — article eq. (7)/(8): k_off = 0.3; release when score ≤ 0.3 |
| RepCounter cooldown | **400 ms** (was 150 in the games, 300 default) — article eq. (7) |

## Article alignment (MITIJ article)

- Star Portal (`js/games/star-portal.js`): PINCH_OFF **0.3** (was 0.35) = θ_off = k_off of eqs. (7)/(8); the game’s own release test is now `pinchScore <= PINCH_OFF`; its RepCounter uses cooldown **400 ms** (was 150).
- `js/rep-counter.js` follows **eq. (7)**: release when score **≤ θ_off** (was `<`), default `cooldownMs` **400 ms** (was 300).
- `js/geometry.js` comments now cite the article equation numbers: **eq. (1)** palm size s = ‖p0 − p9‖ (`palmScale`) and **eq. (2)** d̂ij = ‖pi − pj‖ / s (`normDist`). Comments only — no behaviour change.
- `js/gestures.js` pinch comment cites **eq. (3)** π = clip((d_open − d̂48)/(d_open − d_close)), with d_open = `pinch.zero` = 0.80 and d_close = `pinch.full` = 0.25 (comments only).

## MUST / PASS checklist · วิธีตรวจ
- [ ] **Mirror:** move your hand to your right. The pointer also moves right, like a mirror.
- [ ] **Saved every round:** finish a round, then open DevTools › Application › IndexedDB › handrehab-arcade › sessions. A new `star-portal` record is there, with its pinches in `reps`.
- [ ] **Pause + rest:** ⏸ works at any time. Open `index.html?rest=0.1` and a rest modal appears after 6 s of play.
- [ ] **PASS:** a full round plays through, you score points, and the result appears in the database. The second round shows ▲/▼ against the first.

Pointer jitter is expected here. Lab 27 adds the One Euro filter.

> Placeholders to change: "HandRehab Arcade", "ทีม NeonHands", "โรงเรียนของเรา".
