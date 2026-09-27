# Lab 20 · Detect All Five Exercise Gestures
*ท่าบริหารมือ 5 ท่า พร้อมคำอธิบายกายภาพบำบัด*

**Goal:** offer a range of gestures to train, the way a real physiotherapy programme does. When you perform one gesture, its own bar fills and the others stay below 30 %.

## How to run / วิธีเปิด

- **Windows:** double-click `start.bat`
- **Mac / Linux:** `bash start.sh`
- **Any OS:** `python -m http.server 8000` in this folder, then open http://localhost:8000

Use Chrome or Edge and allow the camera. The hand model (~7.5 MB) downloads from Google the first time.
**No camera?** Press **🖱️ โหมดสาธิต** (or open `index.html?demo=1`). A synthetic hand appears, and you control it with the mouse, keyboard and sliders:
move = move the hand · hold mouse button or Space = pinch · hold 1–5 = curl thumb→little · F = fist · O = spread · W/S = flex/extend wrist · mouse wheel = nearer/farther.
To see the "model failed to download" screen, open `index.html?fail=1`.

> Placeholders to change / สิ่งที่ทีมต้องแก้เป็นของตัวเอง: app name "HandRehab Arcade", team "ทีม NeonHands", school "โรงเรียนของเรา" (bottom-right badge in each HTML page).

## What you see on `index.html` (the same page as `gesture-test.html`)

- **Five live cards in a row**, one per gesture: icon, Thai name, score, bar, and a line on what it trains. The card glows when that gesture is active.
  - 🤏 จีบนิ้ว (pinch): the normalised distance
  - ✊ กำมือ (fist): the average curl
  - 🖐️ แบมือกางนิ้ว (open): the index–little spread in degrees
  - ☝️ แตะนิ้วทีละนิ้ว (finger tap): **which finger** (e.g. "นิ้วกลาง")
  - 🙌 งอ-เหยียดข้อมือ (wrist flex): **the angle and direction** (งอเข้า / เหยียดออก)
- A collapsible physiotherapy explanation on each card: the physio name, the muscles trained, and daily activities.
- A badge shows the gesture currently active. The chip **ท่าอื่นสูงสุด** shows the highest *other* score with ✅ if it is below 30 %.
- **Threshold sliders for each gesture** (the `on` threshold plus the main equation parameter). They go through `setGestureConfig`.
- **⏺️ record → CSV** with every frame: `timestamp, t_ms, pinch, fist, open, fingerTap, tapFinger, wristFlex, wristDeg, wristDir, active`. Use it for the confusion table.
- **Demo mode without a camera** (`js/synth-hand.js`, ported from the course test helper, with a continuous pinch and wrist rotation added). Sliders set curl for each finger, spread, size, wrist angle and pinch. Keyboard: Space = pinch, F = fist, O = open, 1–5 = tap thumb→little, W/S = wrist flex/extend.

## The five gestures (from the comments in `js/gestures.js` and `GESTURE_INFO`)

| Gesture | Physio name | Trains | Daily activity |
|---|---|---|---|
| Pinch | tip-to-tip pinch / pincer grasp | opponens pollicis, 1st dorsal interosseous, FDP | picking up coins or pills, buttons, holding a pen |
| Fist | composite flexion / power grip | FDS & FDP, lumbricals | holding a glass, a stair rail, a bag |
| Open | finger extension & abduction | extensor digitorum, dorsal interossei, abductor digiti minimi | gripping a door knob, picking up large objects, catching a ball |
| Finger tap | finger individuation | the flexor of each finger + motor control | typing, phone buttons, piano, counting money |
| Wrist flex | wrist flexion–extension ROM | FCR/FCU (flex), ECR/ECU (extend) | pouring from a bottle, using a spoon, combing hair |

MUST: confirm these with a health or PE teacher, or a source, and cite them in your report.

## Blanks we filled in

| Blank | Value | Why |
|---|---|---|
| Fist: average curl across ___ fingers | **4 (index, middle, ring, little)** | The thumb curls along a different axis. |
| Open: spread between finger ___ and ___ | **index and little** | the two fingers furthest apart |
| Daily activity example | pinching picks up coins and fastens buttons, a fist holds a glass, spreading grips a door handle | hint. The full list is in the table above. |
| Wrist flex axis | palm axis P0→P9 vs forearm axis (vertical, elbow resting on the table) | from the prompt |

## Separation rules we added (so one gesture does not drag another up)

- **Pinch** × gate on index curl (`indexCurlMax` 0.65): a fist is not a pinch.
- **Open** requires all fingers straight (`curlMax` 0.25) and the thumb away from the index tip (`thumbAway` 0.6). Its range is now `zero` 20° → `full` 50°.
- **Finger tap (thumb)** × gate on the thumb–index distance (`thumbAway` 0.7): a pinch is not a thumb tap.
- All gestures read `hand.sq`, which is the landmarks corrected for the 16:9 image. Otherwise sideways angles look 44 % smaller. For this reason `wristFlex.aspect` is set to 1.

## How to verify (MUST / PASS)

- [ ] `node tests/gestures.test.mjs` → 15/15. Every synthetic pose at 3 sizes fills its own bar while the others stay < 0.30. Each gesture has physio, muscles and daily text.
- [ ] With your real hand, perform each gesture. Its card glows, and **ท่าอื่นสูงสุด** shows < 30 % ✅.
- [ ] Record about 10 s of each gesture to CSV, and tabulate which gestures get confused with which (SHOULD). Test your left hand too.
- [ ] Every gesture shows its physiotherapy explanation (open the card details).
