# Lab 14 — Face Capture with a Guide Frame and Quality Warnings
### เก็บภาพใบหน้าพร้อมกรอบนำทางและคำเตือนคุณภาพ

**Goal:** collect face images good enough to log in with later; the app warns immediately (and says *how to fix it*) when an image is not usable.
เป้าหมาย: เก็บภาพใบหน้าที่ดีพอสำหรับเข้าสู่ระบบ ภาพที่ใช้ไม่ได้ต้องถูกเตือนทันทีพร้อมวิธีแก้

## How to run / วิธีเปิด
- Windows: double-click `start.bat`
- Mac / Linux: `bash start.sh`
- or `python -m http.server 8000` in this folder, then open http://localhost:8000
Needs internet the first time (MediaPipe library + two models from Google). ต้องใช้ Chrome/Edge

## What you see / หน้าจอ
1. **Choose a user** from the database (Lab 13 store). If there is none, type a name to quick-create one — full registration lives in **Lab 12**.
2. **Privacy notice** (biometric data stays in this browser only, delete button always available) → start.
3. **Capture**: mirrored camera, dimmed outside an **oval guide** (60 % of image height) whose colour follows the state, a status strip with the real problem + fix, a live quality bar, a pose list, and a 3-2-1 **circular countdown** that cancels itself (with the reason) if quality drops.
4. **Summary**: horizontal strip of the 5 images with scores, tap = large modal with the quality breakdown, ↻ corner button retakes one image, "retake all", warning if the average < 70, **Save** → `saveFace({userId, embedding, quality, image, pose})`.

## Files
| File | What it is |
|---|---|
| `index.html` | the page (4 sections: pick user → consent → capture → summary) |
| `js/face-capture.js` | **the lab's main module**: `FaceCapture` engine (per-frame loop, guide check, quality, persistent-problem modal, countdown, capture), `measureFace`, `faceThumb` |
| `js/quality.js` | pure maths: grayscale, **variance of the Laplacian**, mean/std, glare, tilt from the two eye keypoints, 0–100 score, `QUALITY_CONFIG` thresholds |
| `js/guide.js` | pure maths: oval guide, inside/direction/too far/too close check (mirror-aware), head pose (yaw/pitch) for the 5 poses |
| `js/warnings.js` | Thai messages that always state the fix, direction words, SVG example of the correct pose |
| `js/capture-ui.js` | user list, pose list, live numbers table, summary strip, modals |
| `js/capture-page.js` | page flow + database save |
| `js/landmarker.js` | Face Landmarker (478 points) loader with backup link |
| `js/face-embed.js` | `makeEmbedding()` + `cosineSimilarity()` — shared with Lab 15 so these images can be used to log in |
| `js/ui.js camera.js vision.js db.js`, `css/*` | shared core (unchanged) + `css/face.css` for this page |

## Blanks we filled in / ค่าที่เติมในช่องว่างของ prompt
| Blank | Value | Why |
|---|---|---|
| Guide shape | **oval** (width = 0.75 × height) | head shape |
| Guide size | **60 %** of image height | hint 60–70 % |
| Inside the guide | face centre inside the **inner half** of the oval, face width **0.45 – 0.85** of guide width | centre near the edge would leave half the face outside |
| Colours | grey `--text-2` no face · **`--error`** outside · **`--warning`** inside but poor quality · **`--success`** ready | same meaning everywhere in the app |
| Sharpness | variance of Laplacian **> 60** on a **160 px-wide** grayscale face crop | (hint said 100 on a full image; the small crop gives smaller numbers — tune with the live numbers panel) |
| Brightness | mean **70 – 190** | hint 70–210, we cut harsh light earlier |
| Contrast | std-dev **> 30**; > 8 % pixels above 245 = harsh light | washed-out / back-lit |
| Face ratio | face width / image width **> 0.12** | |
| Tilt | **> 12°** from the two eye keypoints of the face detector | hint 15° |
| Score | each check → 0 (bad), 0.6 (at threshold), 1 (good); weights sharp 30, bright 20, contrast 15, size 15, tilt 20 | all checks exactly at the threshold = 60 = reject line |
| Persistent problem | **5 s** → modal with SVG example of the correct pose (once per problem per 30 s) | |
| Images / poses | **5**: straight, slightly left, slightly right, slightly up, slightly down | fewer than the 10 hint — less tiring for older users |
| Reject below | **60** (never accepted, reason shown, same pose retaken) | |
| Average warning | **< 70** | login becomes hard |

Other choices: countdown 3 s with 0.3 s grace against flicker; pose checks use nose-vs-eyes yaw/pitch and **relax after 8 s** if the user cannot turn their neck; at capture the Face Landmarker runs on the same frame and `makeEmbedding()` (Lab 15) is stored — an image without landmarks is rejected. Average quality + number of rejected images are stored in `user.extra` (Chapter 4 data).

**Direction words & the mirror:** the screen is mirrored, so if the face appears right of the guide the user must move to *their* left — `checkGuide()` handles this (tested both ways).

## Article alignment (MITIJ article)

- `js/face-embed.js` comment cites **eq. (9)** cos θ = A·B/(‖A‖‖B‖); the app clamps cos to 0..1 for display and threshold. Comments only.

## How to verify (MUST / PASS)
- [ ] Face outside the oval → red frame + "หน้าอยู่นอกกรอบ — ขยับไปทาง…" with the **real** direction (move left/right/up/down and check).
- [ ] Sit far away → "อยู่ไกลเกินไป — ขยับเข้ามาใกล้" ; very close → "ใกล้เกินไป — ถอยห่าง".
- [ ] Turn the light off → "ห้องมืดเกินไป — เปิดไฟเพิ่ม…"; shine a lamp into the lens → "แสงแรงเกินไป…".
- [ ] Move during the countdown → countdown cancelled with the reason; blurred → "ภาพเบลอ — นิ่งไว้".
- [ ] Tilt your head → "ศีรษะเอียง — ตั้งศีรษะให้ตรง" and the dashed eye line turns amber.
- [ ] Keep one problem for 5 s → modal with the example picture.
- [ ] No image under 60 is ever accepted (see "ภาพที่ถูกปฏิเสธ" list). Every saved image ≥ 60; average shown.
- [ ] Save → toast; open Lab 13/15 and the faces are there. "ลบใบหน้าทั้งหมดของฉัน" removes them.
- [ ] SHOULD: capture with and without glasses; write down the average score for Chapter 4.

## Team placeholders to change / สิ่งที่ทีมต้องแก้
App name **HandRehab Arcade**, team **ทีม NeonHands**, school **โรงเรียนของเรา** (bottom-right badge in `index.html`).

## Privacy / ข้อมูลส่วนตัว
Face images are biometric data: stored only in this browser's IndexedDB, never uploaded, never commit exported data to Git.
