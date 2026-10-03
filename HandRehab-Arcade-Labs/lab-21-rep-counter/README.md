# Lab 21 · Count Repetitions Accurately with the Two-Gate Trick
*นับครั้งแม่นด้วย "ประตูสองบาน" (hysteresis / Schmitt trigger)*

**Goal:** stop the wild double counting that happens when a score flickers around one threshold. Ten gestures count as exactly ten, not thirty-seven.

**Engineering name (for Chapter 2):** *hysteresis*. The circuit built on it is the **Schmitt trigger**. It uses two thresholds, and the band between them is a dead zone where nothing changes. Save the chart with both threshold lines as the figure for your report.

## How to run / วิธีเปิด

- **Windows:** double-click `start.bat`
- **Mac / Linux:** `bash start.sh`
- **Any OS:** `python -m http.server 8000` in this folder, then open http://localhost:8000

Use Chrome or Edge and allow the camera. The hand model (~7.5 MB) downloads from Google the first time.
**No camera?** Press **🖱️ โหมดสาธิต** (or open `index.html?demo=1`). A synthetic hand appears, and you control it with the mouse, keyboard and sliders:
move = move the hand · hold mouse button or Space = pinch · hold 1–5 = curl thumb→little · F = fist · O = spread · W/S = flex/extend wrist · mouse wheel = nearer/farther.
To see the "model failed to download" screen, open `index.html?fail=1`.

> Placeholders to change / สิ่งที่ทีมต้องแก้เป็นของตัวเอง: app name "HandRehab Arcade", team "ทีม NeonHands", school "โรงเรียนของเรา" (bottom-right badge in each HTML page).

## What you see on `index.html` (the same page as `counter-test.html`)

**🧪 Simulated signal mode** (the default, no camera needed). Everything runs on *simulated time* with a fixed random seed, so the results are repeatable.

| Button | Signal | Must count | Two-gate | Single threshold 0.5 |
|---|---|---|---|---|
| 1) คลื่นสะอาด | 10 cycles, 2 s each, 60 Hz | 10 | **10 PASS** | 10 |
| 2) คลื่น + noise | same + uniform noise ±0.15 | 10 | **10 PASS** | **39** |
| 3) แกว่ง 0.45–0.55 | fast oscillation for 20 s | 0 | **0 PASS** | **112** |

- A naive single-threshold counter runs alongside for comparison.
- The live chart shows the signal, the **enter** and **exit** lines, the grey anti-flicker zone and the naive threshold. Green dots mark two-gate counts and red ticks mark naive counts. **🖼️ Save as PNG** saves it.
- Sliders for enter, exit, minHold, cooldown and the naive threshold re-run the current signal instantly. If you set exit ≥ enter, exit is pushed back below enter.
- A table for each repetition: #, time, peak, hold ms, quality (0–100 = peak × whether it was held long enough).
- **🔬 ทดลองแคบช่องประตู** (SHOULD experiment): for gaps 0–0.4 over 20 random seeds, it shows the mean error with "gates only" versus "all rules" (hold + cooldown). It prints `console.table`. Gates only goes from 11.25 → 7.5 → 3.5 → 1.3 → 0.2 → 0 as the gap widens.

**📷 Live camera mode:** choose the gesture (pinch, fist, open, finger tap, wrist). The chart scrolls the last 10 s, and the two-gate and naive counters run side by side. Demo mode works here too: hold the mouse or Space to pinch, or hold F for a fist. The camera turns off when you switch back to simulation.

## Files

| File | Purpose |
|---|---|
| `index.html`, `counter-test.html` | the test page |
| `js/rep-counter.js` | **core** `RepCounter({enter, exit, minHoldMs, cooldownMs, onRep})`. `update(score, tMs)` returns the rep or null. States: idle → engaging → held → releasing → cooldown. The time is **always passed in**. |
| `js/counter-sim.js` | pure: the 3 signals (seeded), `NaiveCounter`, `runSim`, `gapExperiment` |
| `js/signal-chart.js` | custom canvas chart with threshold lines and count markers (solid background, so the PNG is readable) |
| `js/counter-test.js` | page logic |
| `tests/rep-counter.test.mjs` | `node tests/rep-counter.test.mjs` (14 tests: the 3 signals, 100 noise seeds, hold, cooldown, the 5 states, determinism, release at exactly θ_off, default cooldown 400 ms) |
| shared | `gestures.js`, `geometry.js`, `hand.js`, `hand-app.js`, `demo-hand.js`, `synth-hand.js`, `camera.js`, `vision.js`, `ui.js`, `css/*` |

## Blanks we filled in

| Blank | Value | Why |
|---|---|---|
| Rise above ___ to start | **0.7** | hint |
| Fall below ___ to release | **0.3** (release when score **≤ θ_off**) | Article eq. (7)/(8): θ_off = k_off = 0.3. (Earlier version used the hint 0.4; the noisy test still gives 10/10 with 0.3.) |
| Hold at least ___ ms | **200 ms** | rejects a quick brush-past |
| No new count within ___ ms | **400 ms** (also the default `cooldownMs` in `rep-counter.js`, was 300) | Article eq. (7): cooldown ≈ 400 ms. Nobody performs the gesture faster than this. |

## Article alignment (MITIJ article, eq. 7)

- `rep-counter.js` follows equation (7) of the team's article: **held ⇔ π ≥ θ_on, release ⇔ π ≤ θ_off** (θ_on > θ_off), five states idle / engaging / held / releasing / cooldown, one count per full cycle, then **≈ 400 ms cooldown**. The release test is now `score <= exit` (was `<`), and the default `cooldownMs` is 400 (was 300). Sliders now start at θ_on 0.7 / θ_off 0.3.
- Citation for the two-threshold trigger: Schmitt (1938).

## How to verify (MUST / PASS)

- [ ] **All three simulated tests pass:** press ▶️ รันทั้ง 3 แบบ. All three cards show PASS ✅ (10 / 10 / 0). `node tests/rep-counter.test.mjs` → 14/14.
- [ ] **Time is passed in, never read inside:** `rep-counter.js` has no `performance.now()` or `Date.now()` (`grep -n "now()" js/rep-counter.js` finds nothing).
- [ ] **Ten real repetitions = 10:** switch to 📷, choose จีบนิ้ว, and pinch 10 times. The two-gate counter reads 10. The naive one usually reads more.
- [ ] Save the chart PNG with both threshold lines for your report (SHOULD). Run 🔬 and copy the table into your experiment chapter.
