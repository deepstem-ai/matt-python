# Lab 33 — Run Smoothly on Every Machine
### ทำให้ลื่นทุกเครื่อง: ทดสอบความลื่นอัตโนมัติ + ระบบแนะนำการตั้งค่า

**Goal:** the app should play well on a powerful computer and on a classroom machine alike.
**เป้าหมาย:** หน้าทดสอบที่วัดความลื่นเอง แนะนำค่าที่เหมาะกับเครื่องนั้น และมีปุ่มกดใช้ค่าทันที

## How to run / วิธีเปิด
- Windows: `start.bat` · Mac/Linux: `bash start.sh` · or `python -m http.server 8000` → http://localhost:8000
- `index.html` **is the benchmark page** (the prompt's `benchmark.html`; Lab 34/35 ship it as `benchmark.html`).
- Type a machine name → **▶ เริ่มทดสอบอัตโนมัติ**. Sit in front of the camera and raise a hand during the hand tests.
- Quick mode for checking the code: `index.html?quick=1` (2 s per scenario) or `?sec=5`.
- See the first-launch warning again: `index.html?firstrun=1&tier=low` (`tier=` forces low/medium/high).

## What it does
1. **`js/device-info.js` → `detectDevice()`** reads CPU cores (`navigator.hardwareConcurrency`), memory (`navigator.deviceMemory`, Chrome/Edge only, capped at 8 GB) and the GPU name (`WEBGL_debug_renderer_info`), then classifies the machine. The rules are documented in the file:

   | Item | 2 points | 1 point | 0 points |
   |---|---|---|---|
   | CPU cores | ≥ 8 | 4–7 (or unknown) | 1–3 |
   | Memory | ≥ 8 GB | 4–7 GB (or unknown) | < 4 GB |
   | GPU | discrete (NVIDIA / Radeon RX / Apple M) | integrated (Intel / Vega / mobile) or unknown | software (SwiftShader / llvmpipe / Basic Render) |

   **low** = software GPU, or ≤ 2 cores, or total ≤ 2 · **high** = total ≥ 5 · otherwise **medium**. This is only a guess from the specification. The measured test always counts for more.
2. **Automatic test of 6 scenarios** (`js/bench-runner.js`), each **10 s** with a progress bar: camera only · face detection · hand simple · hand neon · hand trail · **full game** (the real Star Portal game from Lab 23, fed by real hand detection). Each scenario reports **average FPS**, **minimum FPS** (the worst 0.5 s window) and **processing ms per frame**. The first 10 % of each run (max 1 s) is a warm-up and is not counted. If the camera sees no hand, a **sample hand** is drawn so the drawing cost of each style is still measured. The card shows "เห็นมือจริง x %".
3. **Result cards** are coloured by FPS: ≥ 30 green, 20–29 yellow, < 20 red. Results are **saved to the `benchmarks` store** with the machine name, the full device spec, the settings and the recommendation.
4. **Recommendation** (`js/recommend.js`, pure and node-tested) in plain Thai: *"เครื่องนี้ควรใช้สไตล์ __ ที่ความละเอียด __ พร้อม __"*, with **what will be lost** listed. **✔ ใช้ค่าแนะนำทันที** asks for confirmation (never silently), then writes `prefs.handStyle`, `prefs.resolution` and `prefs.effects`. The Lab 34 app reads these in its games (camera size, hand style, particles).
5. **Comparison across machines:** a bar chart (choose the scenario and the metric), a table, **⬇ CSV** (one row per machine, with spec and every metric), **🖼 PNG**, and **📤 export / 📥 import** of result files. Each machine has its own browser database, so classmates export their result and you import it here.
6. **First-launch warning** (`js/first-run.js`, a modal on the first visit): if the machine looks **low**, it explains why, offers **🔧 ปรับให้อัตโนมัติ** (simple style, 480×360, particles off), lists exactly what will be lost, and also offers "test first" or "keep settings". It asks only once (`localStorage hr-first-run`).

## Files
| File | Role |
|---|---|
| `index.html`, `css/bench.css`, `js/bench-page.js` | the benchmark page |
| `js/device-info.js` | `detectDevice()`, `classify()`, `gpuClass()` |
| `js/bench-runner.js` | the 6 scenarios + the measuring loop + sample hand |
| `js/fps-target.js`, `tests/fps-target.test.mjs` | FPS ≥ 25 target (article §6.2): `fpsPass`, `fpsVerdict` + node test |
| `js/recommend.js` | recommendation rules, Thai text, losses, `toPrefs()`, `parseResolution()` |
| `js/bench-compare.js` | chart / table / CSV / PNG / export / import |
| `js/first-run.js` | the first-launch warning |
| `js/games/star-portal*.js` | the Lab 23 game used by the "full game" scenario (copied unchanged) |
| `js/*.js`, `css/*` | shared core (camera, vision, hand, db, ui, charts, game-engine…) |

## Blanks we filled in
| Blank | Our value | Why |
|---|---|---|
| ___ seconds per scenario | **10 s** (≈ 1¼ min in total), `?quick=1` = 2 s | The lead asked for 10 s. The hint says 15 s is more trustworthy: use `?sec=15` for the final five-machine data |
| style ___ | from the measured **full-game FPS**: ≥ 45 → **trail** (if trail ≥ 45) or **neon** · 30–44 → **neon** · 20–29 → neon if neon ≥ 25, else **simple** · < 20 → **simple** | Hint: below 20 fps, use the simple style and disable particles |
| resolution ___ | ≥ 45 → **1280×720** · 20–44 → **640×480** · < 20 → **480×360** | MediaPipe shrinks the image itself, so a smaller camera image mostly saves decoding and drawing |
| with ___ | ≥ 30 → **full effects** · 20–29 → **half the particles** · < 20 → **particles off** | Particles are the most expensive drawing in the games |
| Performance target | **FPS ≥ 25** per scenario and overall (article §6.2) |

Team placeholders to change: "HandRehab Arcade", "ทีม NeonHands", "โรงเรียนของเรา".

## Article alignment (MITIJ article)

- Each result card shows **PASS/FAIL against FPS ≥ 25** (article §6.2), and a banner gives the **overall** verdict (PASS only if every tested scenario averages ≥ 25 FPS). Saved records include `fpsTarget` / `fpsVerdict`; the comparison table and CSV gain PASS/FAIL columns. Pure logic in `js/fps-target.js`, test `node tests/fps-target.test.mjs`.
- Star Portal (`js/games/star-portal.js`): PINCH_OFF **0.3** (was 0.35) = θ_off = k_off of eqs. (7)/(8); the game’s own release test is now `pinchScore <= PINCH_OFF`; its RepCounter uses cooldown **400 ms** (was 150).
- `js/rep-counter.js` follows **eq. (7)**: release when score **≤ θ_off** (was `<`), default `cooldownMs` **400 ms** (was 300).
- `js/geometry.js` comments now cite the article equation numbers: **eq. (1)** palm size s = ‖p0 − p9‖ (`palmScale`) and **eq. (2)** d̂ij = ‖pi − pj‖ / s (`normDist`). Comments only — no behaviour change.
- `js/gestures.js` pinch comment cites **eq. (3)** π = clip((d_open − d̂48)/(d_open − d_close)), with d_open = `pinch.zero` = 0.80 and d_close = `pinch.full` = 0.25 (comments only).
- `js/charts.js` `barChart` accepts optional reference lines `opts.lines = [{ value, color, label }]` (used for the SUS 68 line in Lab 36). Existing charts are unchanged.

## How to verify (MUST / SHOULD / PASS)
1. Open the page. The device card shows the tier with its reasons and the GPU name. On a weak machine (or `?firstrun=1&tier=low`) the warning modal appears and explains what would be lost.
2. Enter a machine name, then press start. The six bars fill one after another, and six cards appear with average FPS, minimum FPS and ms/frame.
3. The recommendation sentence appears with its "what you lose" list. Press **ใช้ค่าแนะนำทันที** → confirm → the "ค่าที่ใช้อยู่ตอนนี้" line changes (F12 → Application → Local Storage → `hr-prefs`).
4. **MUST:** collect results from **at least 5 different machines** (export on each machine and import here). The info line counts them. Test the **slowest machine in the classroom**.
5. The comparison chart shows every machine. **CSV** opens in Excel with Thai text intact, and the **PNG** is ready for Chapter 1's hardware scope section.
6. Leaving the page turns the camera light off.

Tested here (headless Chromium, software GPU, `?quick=1`): classified **low** (4 cores, 8 GB, SwiftShader). Camera 39 fps, face 17 fps, hands ≈ 3 fps, full game ≈ 4 fps → recommendation "simple · 480×360 · particles off". There were zero page errors. The node test covers `classify`, `gpuClass`, `recommend` and `keyFps`.
