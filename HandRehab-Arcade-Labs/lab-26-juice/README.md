# Lab 26 — Add the Fun: Score, Combo and Achievements · ความสนุก: คะแนน คอมโบ และความสำเร็จ

**Goal:** make all three games fun enough that people come back tomorrow. Rehabilitation lasts months, and nobody keeps doing something they do not enjoy.
เป้าหมาย: ทำให้ทั้ง 3 เกมสนุกจนอยากกลับมาเล่นทุกวัน (เหตุผลนี้ควรเขียนลงบทที่ 1)

## How to run · วิธีเปิด
`start.bat` (Windows) · `bash start.sh` (Mac/Linux) · or `python -m http.server 8000` and open http://localhost:8000.
`index.html` is the **menu**: the three games, the 🔥 streak and your achievements. Every game keeps its **demo mode** (mouse / keys 1-5 / mouse wheel), so you can test without a camera.

## What was added · สิ่งที่เพิ่ม
| Part | How it works |
|---|---|
| **Combo** | Consecutive correct actions: **3 → ×2, 6 → ×3, 10 → ×5**. One miss resets to ×1. When you reach a new tier, a big number bounces in the middle of the screen, with particles and `Sound.combo()`. The header chip shows `คอมโบ n ×m`. |
| **Score counter** | `ScoreTween` climbs towards the true score a little every frame (it never jumps). The score pulses while it climbs. |
| **Achievements** | 10 designed achievements (below). They are stored in the `achievements` store as `{ id: userId+':'+key, userId, key, earnedAt, game }`. A pop-up card appears when you earn one, and `achievements.html` shows the ones you have not earned as black **silhouettes**. |
| **Streak** | Counts consecutive days with **≥ 5 minutes** of training (the session durations added up per day). It shows as 🔥 + number in every game and on the menu. A missed day resets the count, but the best streak is kept (`settings › streak:<userId>`). Today not being finished yet does **not** break the streak. |
| **Calm theme** | The 🌙 button is the master switch. Calm mode means no bouncing number, no particles, no sounds, and the score shows its real value at once. Achievement cards still appear, but plain and still. |
| **Low FPS** | When the engine runs below 30 FPS for 3 s, juice switches to *low*: a quarter of the particles and a still (non-bouncing) combo number. It returns to full after 5 s above 45 FPS. The engine also halves its particle limit on its own. |
| **Sound** | Only the Web Audio API (`game-engine.js › Sound`). There are no audio files. |

### The 10 achievements · ความสำเร็จ 10 อย่าง (tied to rehab goals)
| Icon | Name (TH) | Condition | Level |
|---|---|---|---|
| ⭐ | ดาวดวงแรก | first star delivered into the portal | easy |
| 🎮 | ครบสามด่าน | played all 3 games | easy |
| 🌿 | พักเป็นก็เก่ง | pressed pause/rest at least once during a round | easy |
| 💯 | ร้อยครั้งไม่ท้อ | 100 reps in total across all games | medium |
| ⏱️ | สิบนาทีสุขภาพดี | 10 minutes of training in one day | medium |
| 🖐️ | กางได้กว้างกว่าเดิม | beat your own max spread-angle record (Spread Wall) | medium |
| 🔥 | มือไฟลุก | 10 correct in a row (combo ×5) | hard |
| 🎼 | จังหวะเป๊ะ | a Rhythm Tap round with ≥ 10 notes and zero wrong or missed taps | hard |
| ⚡ | นิ้วสายฟ้า | reach level 5 in Rhythm Tap | hard |
| 📅 | ครบสัปดาห์ไม่ขาด | 7-day streak (≥ 5 min each day) | hard |

> The MUST says to design the achievements yourselves. Treat this list as a starting point. Rename them and change the conditions to your team's style in `js/achievements.js`.

## Files · ไฟล์
| File | Role |
|---|---|
| `index.html`, `js/menu-page.js` | Menu: games, streak flame + today's minutes, achievement row, calm switch, player picker |
| `achievements.html`, `js/achievements-page.js` | Collection page (silhouettes for the ones not earned) + reset for testing |
| `js/juice.js` | Combo, multipliers, ScoreTween, tier-up effect, achievement pop-ups, FPS-based quality |
| `js/achievements.js` | The 10 definitions, pure `evaluate()`, `AchievementBook` (database) |
| `js/streak.js` | Pure streak logic: `minutesByDay`, `computeStreak` |
| `js/juice-page.js` | Connects juice to a game page (header chips, live checks, end-of-session checks) |
| `js/user-picker.js` | Choose the player (sets the current user like the login page does) |
| `star-portal.html`, `rhythm-tap.html`, `spread-wall.html` + `js/*-page.js`, `js/games/*` | The three games from Labs 23-25, now scoring through `game.juice.hit()` / `.miss()` |
| `css/juice.css`, `css/page.css` | Styles (colours only from tokens) |
| `tests/juice.test.mjs` | `node tests/juice.test.mjs`: combo tiers, streak rules, achievement conditions (19 checks) |
| other `js/*`, `css/*`, `start.*` | Shared core (updated copies) |

## Blanks we filled in · ค่าที่เติม
| Blank | Value |
|---|---|
| Multipliers | **×2 at 3, ×3 at 6, ×5 at 10** consecutive correct (the course brief; the doc hint suggested ×2 at 5 / ×3 at 10, so change `COMBO_TIERS` if you prefer it) |
| Achievement examples | ⭐ **ดาวดวงแรก** when the first star enters the portal · 🔥 **มือไฟลุก** when you get 10 correct in a row (all 10 are above) |
| Streak: minimum minutes per day | **5 minutes** |
| Star Portal release threshold (θ_off) | **0.3** (was 0.35) — article eq. (7)/(8): k_off = 0.3; release when score ≤ 0.3 |
| RepCounter cooldown | **400 ms** (was 150 in the games, 300 default) — article eq. (7) |

## Article alignment (MITIJ article)

- Star Portal (`js/games/star-portal.js`): PINCH_OFF **0.3** (was 0.35) = θ_off = k_off of eqs. (7)/(8); the game’s own release test is now `pinchScore <= PINCH_OFF`; its RepCounter uses cooldown **400 ms** (was 150).
- `js/rep-counter.js` follows **eq. (7)**: release when score **≤ θ_off** (was `<`), default `cooldownMs` **400 ms** (was 300).
- Rhythm Tap summary shows the **timing resolution ≈ 1000 / avgFps ms** next to the mean reaction time (≈ 33 ms at 30 fps, article §4) and saves it as `details.timingResolutionMs`.
- `js/geometry.js` comments now cite the article equation numbers: **eq. (1)** palm size s = ‖p0 − p9‖ (`palmScale`) and **eq. (2)** d̂ij = ‖pi − pj‖ / s (`normDist`). Comments only — no behaviour change.
- `js/gestures.js` pinch comment cites **eq. (3)** π = clip((d_open − d̂48)/(d_open − d_close)), with d_open = `pinch.zero` = 0.80 and d_close = `pinch.full` = 0.25 (comments only).
- `js/charts.js` `barChart` accepts optional reference lines `opts.lines = [{ value, color, label }]` (used for the SUS 68 line in Lab 36). Existing charts are unchanged.

## MUST / PASS checklist · วิธีตรวจ
- [ ] Play Star Portal in demo mode and score 3, 6 and 10 in a row. The big ×2 / ×3 / ×5 bounces, with sound, and the score climbs smoothly.
- [ ] Miss once (release the star outside the portal). The combo chip goes back to 0 ×1.
- [ ] Press 🌙 (calm) and play again. There is **no** bouncing number, no particles and no sound, and the score jumps straight to its value.
- [ ] Your first star → the "ดาวดวงแรก" card pops up. Open `achievements.html`: it is in colour, and the others are silhouettes.
- [ ] Play ≥ 5 minutes today. The menu flame shows 1 day, and today's bar is full.
- [ ] `node tests/juice.test.mjs` → 19/19 pass.
- [ ] **PASS:** it feels fun, 3 classmates want to play again (ask why not if they don't), and every effect disappears in calm mode.

> Placeholders to change: "HandRehab Arcade", "ทีม NeonHands", "โรงเรียนของเรา".
