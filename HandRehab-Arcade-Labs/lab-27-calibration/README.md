# Lab 27 — Adapt the Difficulty to Each Person's Hand · ปรับความยากให้เข้ากับมือแต่ละคน

**Goal:** make the game playable for someone with a **tremor**. When the hand shakes, the pointer stays steady (One Euro filter) and the grab radius widens automatically (per-person calibration).
เป้าหมาย: คนมือสั่นก็เล่นได้ ตัวชี้นิ่งขึ้น รัศมีการจับกว้างขึ้นอัตโนมัติ

## How to run · วิธีเปิด
`start.bat` · `bash start.sh` · or `python -m http.server 8000` and open http://localhost:8000.
- `index.html` is the **Star Portal game**. The header links to 🎯 `calibrate.html` and 📈 `filters.html`, and the settings bar has the player picker.
- **Shake test (demo mode):** choose 🖱 โหมดสาธิต, then **ทดสอบมือสั่น = มาก**. Synthetic tremor (6 Hz, ±28 px) is added to the mouse pointer. Turn the **One Euro** switch off and on to feel the difference. The faint dot is the raw position and the solid dot is the filtered one. `index.html?shake=3` starts with the shake on.

## Part 1 — Filters · ตัวกรองสัญญาณ (`js/smoothing.js`)
- `OneEuroFilter({ freq, minCutoff, beta, dCutoff })` with `.filter(value, tSeconds)`, following **Casiez, Roussel & Vogel (2012), "1€ Filter", CHI '12, pp. 2527–2530**, gery.casiez.net/1euro.
  α = 1 / (1 + τ/dt), τ = 1/(2π·fc), and fc = minCutoff + beta·|filtered speed|. A slow hand gets strong filtering, a fast hand gets light filtering.
- `MovingAverage(N = 5)` and `MedianFilter(N = 5)` are there for comparison. **Every filter takes time as a parameter** and never reads the clock.
- Metrics: **jitter reduction %** = 1 − SD(first difference of filtered) / SD(first difference of raw). **Lag (ms)** comes from the cross-correlation peak and from the step response (time to reach 90%).
- `filters.html` draws raw, One Euro, moving-average (and median) lines for the last 6 s. The source is either a **synthetic shaky signal** (default) or your **real index fingertip** (camera). The page has live numbers, a reproducible comparison table (fixed seed, 20 s at 30 fps), CSV export (samples and table), and PNG export.

### Comparison table · ตารางเปรียบเทียบ (default settings: minCutoff 1.0 Hz, beta 0.5, N 5, tremor 0.02 @ 6 Hz)
| Filter | Jitter removed | Lag (xcorr) | Step delay to 90% |
|---|---|---|---|
| One Euro | 61.5 % | 100 ms | 133 ms |
| Moving average (N=5) | 56.6 % | 67 ms | 133 ms |
| Median (N=5) | 16.3 % | 67 ms | 67 ms |

Regenerate it with `node tests/smoothing.test.mjs`, or with ▶ on `filters.html`. With minCutoff 0.3 Hz (the severe-tremor setting), One Euro removes 65 % but adds about 200 ms. That is the trade-off the calibration makes per person. For your report, add a row measured with a real shaking hand (📷 mode).

## Part 2 — Calibration wizard · วิซาร์ดปรับเทียบ 4 ขั้น (`calibrate.html`, `js/calibration.js`)
1. **Explain:** what will happen and how long (~1 min). Choose the gesture (🤏 pinch or 🖐️ spread), then camera or 🖐 demo (a synthetic hand with a selectable tremor level; hold the button or Space to do the gesture).
2. **Hold still for 5 s:** tremor = SD of the **index fingertip position ÷ palm size**, after removing any slow linear drift. It is classified into 4 levels:

   | Level | SD (× palm) | Grab radius | One Euro minCutoff / beta |
   |---|---|---|---|
   | 0 ไม่มีอาการสั่น | < 0.02 | **60 px** (standard) | 1.5 / 0.8 |
   | 1 สั่นเล็กน้อย | < 0.04 | 70 px | 1.0 / 0.5 |
   | 2 สั่นปานกลาง | < 0.07 | 85 px | 0.6 / 0.4 |
   | 3 สั่นมาก | ≥ 0.07 | **100 px** | **0.3** / 0.3 (stronger filtering) |

   The median of the gesture's raw measure during the hold is **rest**.
3. **Animated demo** of the gesture, then **5 repetitions at full effort**. Each repetition's extreme value is recorded (a "✔ นับครั้งนี้" button counts a repetition by hand for people who cannot reach the detector). **best** = the mean of the best 3 of the 5.
4. **Results:** a tremor badge, a rest/best/entry/exit table, sliders to adjust the grab radius and pointer steadiness by hand, a live **"try it now"** meter with the entry/exit marks and a repetition counter, and **▶ ลองเล่นจับดาวเลย**.

### Threshold formula · สูตรเกณฑ์ (applied to the gesture's *raw* measure)
```
entry = rest − 0.7 × (rest − best)     (start of the gesture: 70 % of your own range)
exit  = rest − 0.3 × (rest − best)     (release: back past 30 %)
```
- Pinch uses `normDist(sq, 4, 8)` (smaller is better). Example: rest 0.80, best 0.10 → entry 0.31, exit 0.59.
- Spread uses `spread(sq, 'index', 'little')` in degrees (larger is better). Example: rest 15°, best 50° → entry 39.5°, exit 25.5°.
- The game keeps its two-gate counter (θ_on 0.7 / θ_off **0.3**). `scoreFromMeasure()` is article eq. (3) with d_open = rest, d_close = best: π = clip((rest − m)/(rest − best)), so **entry → 0.7** and **exit → 0.3** exactly (eq. 8: π(T) = k).

**Storage:** the `calibration` store, `id = userId + ':' + gesture`, holding `{ rest, best, peaks, entry, exit, locked, lockedAt, tremorSd, tremorLevel, grabRadius, filter, source, at }`. The user record's `tremor` field is updated too. It is **loaded automatically** when the page opens, when the player changes, and before every round.

## Files · ไฟล์
| File | Role |
|---|---|
| `index.html`, `js/star-portal-page.js`, `js/games/star-portal*.js` | Star Portal + calibration + One Euro pointer + shake test |
| `calibrate.html`, `js/calibrate-page.js`, `js/calib-input.js` | 4-step wizard; camera or synthetic-hand input |
| `js/calibration.js` | Tremor levels, formula, repetition peak tracker, save/load |
| `filters.html`, `js/filters-page.js`, `js/signal.js` | Filter comparison page, synthetic shaky signal, benchmark |
| `js/smoothing.js` | OneEuroFilter, MovingAverage, MedianFilter, PointFilter + metrics |
| `js/synth-hand.js` | 21-point synthetic hand for the demo and the tests |
| `js/user-picker.js` | Player picker ("login" for this lab) |
| `tests/smoothing.test.mjs`, `tests/calibration.test.mjs` | `node tests/…`: 15 + 13 checks |
| `css/calib.css`, `css/page.css`, other `js/*`, `css/*` | Styles and shared core |

## Blanks we filled in · ค่าที่เติม
| Blank | Value |
|---|---|
| MovingAverage averages the last ___ values | **5** (MedianFilter also 5) |
| Hold still for ___ seconds | **5 s** (the course brief; the doc hint says 10 s, so change `STILL_SEC`) |
| Perform the gesture ___ times | **5** |
| entry = rest − ___ × (rest − best) | **0.7** |
| exit = rest − ___ × (rest − best) | **0.3** |
| Severe tremor: grab radius ___ px | **100 px** + minCutoff 0.3 Hz (stronger filtering); no tremor → standard **60 px** |
| Score mapping | **eq. (3)** π = clip((r − m)/(r − b)) → entry = 0.7, exit = **0.3** (was 0.35) |
| Freeze thresholds (ตรึงเกณฑ์) | **off** by default; turn on for research measurement |
| RepCounter cooldown | **400 ms** (was 150) |

## Article alignment (MITIJ article)

- `scoreFromMeasure()` is now **eq. (3)** with d_open = rest r and d_close = best b: **π = clip((r − m)/(r − b), 0, 1)**. Because π(T) = k for T = r − k(r − b) (**eq. 8**), entry maps to **θ_on = 0.7** and exit to **θ_off = 0.3** for every user (was a linear map onto 0.7 / 0.35). The game and the wizard counter now use 0.7 / **0.3** and cooldown **400 ms**.
- **ตรึงเกณฑ์ (freeze thresholds):** a switch on `calibrate.html` (step 1 and the result step) sets `locked: true` + `lockedAt` in the calibration record. Re-calibrating a locked record first asks for an unlock confirmation. While locked, the grab-radius / filter sliders are disabled. Every Star Portal session saves a snapshot `details.thresholds` = {thetaOn, thetaOff, dOpen, dClose, entry, exit, locked, calibratedAt, source}.
- `js/smoothing.js` comments and `filters.html` show the One Euro **eqs. (4)–(6)**: α = 1/(1 + 1/(2π f_c T_e)), x̂_t = α x_t + (1 − α) x̂_(t−1), f_c = f_c,min + β|ẋ̂_t| (Casiez 2012).
- Tests: `calibration.test.mjs` now expects exit → **0.3** (was 0.35, changed because the article defines θ_off = k_off = 0.3) and adds π(T) = k, open-hand direction and snapshot checks; `smoothing.test.mjs` adds the eq. (4) α check.
- Star Portal (`js/games/star-portal.js`): PINCH_OFF **0.3** (was 0.35) = θ_off = k_off of eqs. (7)/(8); the game’s own release test is now `pinchScore <= PINCH_OFF`; its RepCounter uses cooldown **400 ms** (was 150).
- `js/rep-counter.js` follows **eq. (7)**: release when score **≤ θ_off** (was `<`), default `cooldownMs` **400 ms** (was 300).

## MUST / PASS checklist · วิธีตรวจ
- [ ] Test with a real tremor, or **simulate one**: `index.html` → demo → ทดสอบมือสั่น = มาก. With One Euro on, the pointer barely moves (the test measured 20.8 px SD raw → 1.2 px filtered).
- [ ] Run the wizard with demo tremor = 3 → "สั่นมาก", radius 100. With tremor = 0 → "ไม่มีอาการสั่น", radius 60.
- [ ] Open `index.html`: the header chip shows your calibration, and the radius slider is set automatically.
- [ ] **Comparison table:** `filters.html` (or `node tests/smoothing.test.mjs`) → export CSV and PNG for the report.
- [ ] **PASS:** after calibrating, the game feels comfortable, and you have the 3-filter comparison table.
- Recalibrate whenever the machine or the camera position changes.

> Placeholders to change: "HandRehab Arcade", "ทีม NeonHands", "โรงเรียนของเรา". Cite Casiez et al. (2012) in your bibliography.
