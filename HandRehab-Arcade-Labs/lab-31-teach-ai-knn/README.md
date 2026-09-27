# Lab 31 — Teach the AI to Recognise Gestures You Invented
### สอน AI ให้รู้จักท่ามือที่เราคิดเอง (k-Nearest Neighbours)

**Goal:** build the team's own AI, trained only on examples you produce yourselves — no AI library.
เป้าหมาย: สร้าง AI ของทีมเอง จากตัวอย่างที่เก็บเอง ไม่ใช้ไลบรารี AI ภายนอก

## How to run / วิธีเปิด
- Windows: double-click `start.bat` · Mac/Linux: `bash start.sh`
- Or `python -m http.server 8000` in this folder → http://localhost:8000
- No camera? Press **🤖 โหมดสาธิต (มือจำลอง)** — synthetic hands (6 preset poses, randomly varied size/position/rotation/noise every 120 ms) so you can train and test without a camera.
- Node test: `node tests/knn.test.mjs` (Node 18+)

## How to use
1. **📷 เปิดกล้อง** (or demo mode) → type a gesture name → **hold** the green button (mouse, touch, or Space/Enter) while slowly turning your hand → 30 examples collected (one every 0.1 s) with a progress bar.
2. Repeat for at least 2 gestures. The list shows the count per gesture; under 20 examples is marked ⚠️. 🗑️ deletes one gesture.
3. Switch on **โหมดทดสอบ** → the big guess, a confidence bar (votes ÷ k) and the **5 nearest neighbours** with their distances (those that voted are marked) — so you can see *why* the AI decided.
4. The model is saved automatically to IndexedDB (`handrehab-arcade` → store `ml`, id `knn-model`) — Lab 32 reads it from there. **⬇️ ส่งออกโมเดล JSON / 📂 นำเข้าโมเดล** move it to another machine.

## Files
| File | What it is |
|---|---|
| `index.html` | = **train.html**: camera + skeleton, name field, press-and-hold collect, gesture list, test mode, export/import |
| `js/ml.js` | `extractFeatures(pts)` → 25 palm-normalised numbers, `KNNClassifier` (`addExample`, `predict(features, k=5)` → `{label, confidence, neighbours:[{label,distance}], votes}`, `counts`, `clear(label)`, `save/load` via db `ml`, `exportJSON/importJSON`), Thai kNN explanation (the "ask your 5 nearest neighbours which football team they support" analogy) |
| `js/train.js` | page logic |
| `js/hand-source.js` | camera + MediaPipe hand **or** synthetic demo hand, one `frame()` call per animation frame |
| `js/synth-hand.js` | port of the test synthetic hand + `PRESETS`, `variedHand`, `rotateHand`, seeded `makeRng` |
| `js/camera.js hand.js vision.js geometry.js db.js ui.js`, `css/*` | shared core (copied) |
| `tests/knn.test.mjs` | 12 node tests: 25 features, scale invariance, Thai error, train/test on different seeds (≥ 80 %), neighbours sorted, k = 3/5/7, export/import round trip, bad import, clear(label); prints a k-comparison |

### The 25 features (all divided by palm size P0→P9 or otherwise unit-free)
10 fingertip-pair distances · 5 finger curls (0–1) · 4 adjacent-finger spreads (degrees ÷ 90) · 5 fingertip-to-wrist distances · 1 palm-facing ratio.
No raw x/y pixel values are used — the AI keeps working when the person moves closer/further or someone else uses it.

## Blanks we filled in
| Blank in the prompt | Value we chose |
|---|---|
| Roughly ___ numbers | **25** |
| …the distance between every pair of fingertips, the curl of every finger, and ___ | **adjacent-finger spread angles (÷ 90), fingertip-to-wrist distances, palm-facing ratio** |
| Recommended k | **5** (selector also offers 1/3/7/9 for the SHOULD comparison) |
| Press-and-hold collects ___ examples | **30** (warning below **20**) |
| Team placeholders | "HandRehab Arcade", "ทีม NeonHands", "โรงเรียนของเรา" ⚠️ *team: change* |

## How to verify (MUST / PASS checklist)
- [ ] `node tests/knn.test.mjs` → "ผ่าน 12 ข้อ".
- [ ] Only palm-normalised values: read `extractFeatures` in `js/ml.js` — no `.x`/`.y` is pushed directly (test "ไม่ขึ้นกับขนาดมือ" proves scale/position invariance).
- [ ] Test mode lists the 5 nearest neighbours and their distances.
- [ ] **PASS:** teach two gestures your team invented (30 examples each, several angles), then perform each 10 times → at least 8/10 correct.
- [ ] SHOULD: collect from 2–3 people, then test on someone new; try k = 3, 5, 7 and write down the accuracy of each.
- [ ] Refresh the page → the gestures are still there (IndexedDB). Export → Import on another machine works.
- Pitfall: wrong guesses → look at the closest neighbour; two gestures whose examples are too similar need more distinct poses.
- Privacy: examples are movement data of real people — tell volunteers what it's for and delete their gesture (🗑️) when asked.
