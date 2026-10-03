# Lab 15 — Log In with Your Face
### เข้าสู่ระบบด้วยใบหน้า

**Goal:** stand in front of the camera and have the app recognise you (unknown faces are sent to registration), with a 6-digit PIN as an equal alternative.
เป้าหมาย: ยืนหน้ากล้องแล้วแอปจำได้ว่าเป็นใคร คนที่ไม่รู้จักถูกพาไปลงทะเบียน และมี PIN เป็นทางเลือกที่เท่าเทียม

## How to run / วิธีเปิด
- Windows: `start.bat` · Mac/Linux: `bash start.sh` · or `python -m http.server 8000` → http://localhost:8000
- First time: **register.html** (name + PIN) → **enrol.html** (the Lab 14 face capture, 5 poses) → **index.html** (login).

## Pages
| Page | What it shows |
|---|---|
| `index.html` | **login**: camera opens automatically (released on leave), rotating scan ring, confidence bar with the real similarity and a threshold marker, vote progress (x/10 of 15 frames), blink indicator, threshold slider for calibration. After **10 s** without a match → modal with **try again / use PIN / register**. Success → "สวัสดี คุณ…" + confetti → `home.html` |
| `enrol.html` | face enrolment from Lab 14 (after saving → button to the login page) |
| `register.html` | minimal registration: name + consent + PIN (entered twice) → choose "capture face now" or "PIN only" |
| `pin.html` | set / change PIN (old PIN required if one exists), big PIN pad |
| `home.html` | simple home: greeting, change PIN, re-capture face, log out, **login log table + CSV** (method, seconds, similarity, threshold, blinks) for Chapter 4 |

## Files
| File | What it is |
|---|---|
| `js/face-login.js` | **the lab's main module** (pure, node-testable): model URL + backup, `makeEmbedding`/`cosineSimilarity` (re-exported), `matchGallery`, `frameVote`, `VoteBuffer`, `eyeAspectRatio`/`bothEyesEAR`, `BlinkDetector`, `loginDecision`, `LOGIN_CONFIG` |
| `js/face-embed.js` | embedding maths (shared with Lab 14) |
| `js/landmarker.js` | Face Landmarker loader (primary `/1/`, backup `/latest/`, GPU→CPU) |
| `js/login-page.js` | login page controller + PIN dialog |
| `js/pin.js` | SHA-256 PIN hash (`crypto.subtle`, salted with user id), PIN rules, `PinPad` keypad, 5-wrong-tries → 30 s lock |
| `js/confetti.js`, `js/login-log.js` | celebration effect; login log in the `settings` store (key `login-log`) |
| `js/register-page.js`, `js/pin-page.js`, `js/home-page.js` | the other pages |
| `js/face-capture.js quality.js guide.js warnings.js capture-ui.js capture-page.js` | Lab 14 enrolment (see Lab 14 README) |
| `docs/cosine-similarity.md` | cosine similarity explained with everyday comparisons (Thai) — the "explain before coding" part |

## Blanks we filled in / ค่าที่เติมในช่องว่าง
| Blank | Value | Why |
|---|---|---|
| Divisor for distance invariance | distance between the **outer eye corners (33 ↔ 263)** | bone, does not move when smiling/speaking, longest stable baseline → least relative noise (inner corners 133/362 also work but the span is shorter) |
| Embedding | **50 3-D distances** between 27 stable points (eye corners, brows, nose bridge/tip/wings, cheeks, jaw, chin, forehead — no lips or eyelids) ÷ 33↔263 distance, as `log(ratio / canonical-face ratio)`, minus its mean | 3-D distances ignore head rotation; subtracting MediaPipe's canonical face removes what all faces share (otherwise everyone scores ≈ 0.99); subtracting the mean cancels a mis-measured divisor |
| Same-person threshold | **0.92** (cosine clamped to 0..1) + must beat the 2nd person by **0.03** | hint default — **must be calibrated with real people**: can't get in → lower by 0.02; a classmate gets in → raise. Slider on the login page saves it |
| Vote buffer | last **15** frames, accept when the same person wins **≥ 10** | never decide from one frame (never set below 5) |
| Blinks | **≥ 1** | stops a printed photo |
| Blink detector | EAR = (‖p2−p6‖+‖p3−p5‖)/(2‖p1−p4‖), points 33,160,158,133,153,144 / 362,385,387,263,373,380; closed < 0.65 × learned open baseline, open again > 0.85 × baseline (**hysteresis**), closure 40–600 ms, **250 ms refractory** | noise between the two lines can't double-count; long closures (looking down) don't count |
| No match timeout | **10 s** | then 3 buttons |
| PIN | 6 digits, not all the same, not a straight run; stored only as `SHA-256("handrehab-arcade:" + userId + ":" + pin)` in `user.pinHash` | one-way; same PIN for two users gives different hashes |

Synthetic check (node, fake faces built from MediaPipe's canonical mesh with random per-person shape + landmark noise + random pose): same person median 0.96 (5th pct 0.90), different people median 0.00, max 0.67 → at 0.92 about 91 % single-frame accept, 0 % false accept; with 5 gallery images and voting the owner is accepted after 10 frames and a stranger never. **Real faces will differ — measure them.**

Honest limitations (Chapter 5): geometry only, weaker than a dedicated face-recognition model; MediaPipe's z estimate is noisy; the SHA-256 of a 6-digit PIN can be brute-forced by someone who copies the database (the 30 s lock only slows the on-screen keypad) — acceptable for a local school prototype, use PBKDF2/Argon2 in a real product.

## Article alignment (MITIJ article)

- `js/face-embed.js` / `js/face-login.js` comments cite **eq. (9)** cos θ = A·B/(‖A‖‖B‖) — the app **clamps cos to 0..1** for display and threshold — and **eq. (10)** EAR (Soukupová & Čech 2016, landmarks 33,160,158,133,153,144 / 362,385,387,263,373,380). Comments only.
- `docs/cosine-similarity.md` now shows eq. (9) with its number, explains the 0..1 clamp, and adds eq. (10) EAR.

## How to verify (MUST / PASS)
- [ ] Register → enrol 5 poses → login: you get in **within 5 s** (check the "ใช้เวลา" column on the home page).
- [ ] Only after a **blink**: stay still with eyes open → status says "จำได้แล้ว! กระพริบตา…" and does not log in.
- [ ] **Photo test:** hold a printed/phone photo of yourself → no blink → never logs in; after 10 s the 3 buttons appear. Record the result.
- [ ] **Classmate test:** a classmate tries to log in as you → must fail. Record it; raise the threshold if they get in.
- [ ] PIN works from the "ใช้ PIN" button; wrong PIN shakes; 5 wrong → 30 s lock; `pinHash` in DevTools → IndexedDB shows 64 hex chars, never the digits.
- [ ] Leaving the page turns the camera light off.
- [ ] SHOULD: 10 attempts × 3 lighting conditions; download the CSV from the home page for Chapter 4.

## Team placeholders to change / สิ่งที่ทีมต้องแก้
App name **HandRehab Arcade**, team **ทีม NeonHands**, school **โรงเรียนของเรา** (badge at the bottom of every page).

## Note for developers
Never give an HTML element `id="dbg"`: MediaPipe's wasm calls a global `dbg()` and the browser exposes element ids as globals, which makes model creation fail with "dbg is not a function".
