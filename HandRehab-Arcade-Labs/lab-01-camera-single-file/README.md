# Lab 01 — Open the Camera with a Single File
### เปิดกล้องด้วยไฟล์เดียว

**Goal:** prove you can build a working camera app with no installation and no library.
เป้าหมาย: พิสูจน์ว่าเราทำแอปกล้องได้โดยไม่ต้องติดตั้งอะไรเลย

## How to run / วิธีเปิด
1. Double-click `index.html` and open it with **Google Chrome** (or Edge).
   ดับเบิลคลิก `index.html` แล้วเปิดด้วย Chrome
2. Press the big button **▶ เปิดกล้อง** and choose **Allow / อนุญาต**.
3. Wave at yourself and write down the FPS number in the top-right corner.
   (Serving through `python -m http.server 8000` → http://localhost:8000 also works.)

## Files
| File | What it is |
|---|---|
| `index.html` | the whole app: inline CSS + JS, Thai comments, no libraries |
| `README.md` | this file |

## How getUserMedia works (the "explain first" part of the prompt)
`navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } })` asks the browser for a camera stream.
The first time, Chrome shows an "Allow camera?" bubble. It returns a **Promise**:
- **resolved** → a `MediaStream`; we put it into `<video>.srcObject` and call `play()`.
- **rejected** → an error whose `name` tells us why:
  `NotAllowedError` (user/OS denied), `NotFoundError` (no camera), `NotReadableError` / `AbortError` (camera busy in Zoom/LINE/another tab).
The width/height are *ideal* values — the camera gives the closest size it supports (the badge shows the real size).
Calling `track.stop()` on every track releases the camera (the camera light turns off).

## Features
- Dark game look `#0B1020` / `#F8FAFC`, gradient title, 80 px start button (≥ 56 px rule).
- Video fills the area with `object-fit: contain` (never distorted), mirrored with `transform: scaleX(-1)`.
- FPS badge top-right, refreshed once per second, green ≥ 24 / yellow 15–23 / red < 15, with the real resolution.
- Error card for **denied / no camera / busy** (+ camera unplugged mid-way, unsupported browser, unknown) — Thai title, reason, numbered fix steps, **retry button** (focused automatically) and the technical error code in small print. Never a blank screen.
- SHOULD/COULD: resolution selector (640×480 / 1280×720 / 1920×1080) with an average-FPS log per resolution, team + school badge bottom-left, mirror toggle, pulsing glow border (disabled when the OS asks for reduced motion).
- Camera is released on `pagehide`. Test hook: `window.lab01.showError({name:'NotAllowedError'})` in the Console.

## Blanks we filled in
| Blank in the prompt | Value we chose |
|---|---|
| Background colour | `#0B1020` |
| Text colour | `#F8FAFC` |
| App title | "HandRehab Arcade" ⚠️ *team: change to your own name* |
| Button label | "▶ เปิดกล้อง" |
| getUserMedia width × height | 1280 × 720 (selector also offers 640×480 and 1920×1080) |
| Team / school (bottom corner) | "ทีม NeonHands · โรงเรียนของเรา" ⚠️ *team: change* |

## How to verify (MUST / PASS checklist)
- [ ] Press the button → you see yourself mirrored, not stretched. FPS badge appears top-right and changes every second.
- [ ] **FPS > 20.** Write the number down: ______ FPS (1280×720). *(SHOULD: also record 640×480 = ____ and 1920×1080 = ____ — the log under the video averages them for you.)*
- [ ] **Denied:** click the camera icon in the address bar → Block → reload → press the button → Thai message "ยังไม่ได้อนุญาตให้ใช้กล้อง" + retry button.
- [ ] **No camera:** unplug the USB camera (or disable it in Device Manager) → "ไม่พบกล้องในเครื่องนี้" + retry.
- [ ] **In use:** open the camera in Zoom/LINE/Windows Camera first → "กล้องกำลังถูกโปรแกรมอื่นใช้อยู่" + retry. *(On Mac/Linux, several apps may share a camera, so this case may not appear — use the Console test hook instead.)*
- [ ] Untick "ภาพกระจก" → image flips back; ask a classmate which feels more natural.
- Pitfall: blank screen? Press **F12 → Console** and read the first red line.
