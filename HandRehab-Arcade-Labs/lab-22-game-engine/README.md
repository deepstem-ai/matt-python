# Lab 22 — Build the Game Engine on a Canvas · สร้างเอนจินเกมบน canvas

**Goal:** a shared 2D engine that all three games (Labs 23–25) run on, plus a test page that proves it works.
เป้าหมาย: เอนจินกลางที่เกมทั้ง 3 เกมใช้ร่วมกัน พร้อมหน้าทดสอบ

## How to run · วิธีเปิด
- Windows: double-click `start.bat`
- Mac / Linux: `bash start.sh`
- Or: `python -m http.server 8000` in this folder, then open http://localhost:8000

`index.html` forwards to `engine-test.html` (the page name used in the lab prompt).

## What you see · สิ่งที่เห็นบนจอ
- Stars drifting across a space background (90 star objects created once, then reused through `addEntity`).
- **💥 ระเบิดดาว** button, or a click anywhere on the canvas, makes a star explosion. Use the slider to set how many particles each explosion makes.
- Badges: **FPS**, **live objects** (entities + live particles), **particle ceiling** (drops by half automatically on a slow machine), and **JS memory** with its min–max range (Chrome only). The memory badge is how you run the 5-minute test.
- **🔥 ทดสอบหนัก**: explodes every frame for 5 seconds, so you can watch FPS and the object count under load.
- **☄ เพิ่มดาวหาง**: adds an entity that removes itself (`removeEntity`) when it leaves the screen.
- Sound buttons: grab, score, miss, combo, level-up and the 5 pentatonic notes. All sounds are generated in code; there are no audio files.
- **🌙 สงบ**: calm mode turns off all particles and sound.
- **⏸ หยุดพัก** (or key P, or switching tabs) stops game time and opens a modal.
- **Frame-rate-independence proof** (bottom lanes): the grey dot is where an object moving at 120 px/s *should* be according to the real clock. The green dot moves with `speed × dt`. The red dot moves a fixed 2 px per frame. Drag **จำลองเครื่องช้า** (busy-waits 0–80 ms every frame). FPS falls, the green dot stays on the grey dot, and the red dot falls far behind. After about 3 seconds below 30 FPS, a toast says the particle ceiling was halved.

## Files · ไฟล์
| File | What it does |
|---|---|
| `js/game-engine.js` | `GameEngine` (rAF loop, `update(dt)` / `draw(ctx)` kept separate, start/stop/pause/resume, addEntity/removeEntity, fit), `ParticlePool` (400 objects created up front and recycled), `Sound` (Web Audio: tone, sweep, grab, score, miss, combo, levelUp, note(i), unlock, autoUnlock), `toScreen()` |
| `engine-test.html`, `js/engine-test.js` | Test page |
| `index.html` | Forwards to engine-test.html |
| `js/ui.js` | Prefs, calm mode, cssVar, toast, modal |
| `css/tokens.css`, `css/themes.css`, `css/parts.css`, `css/game.css` | Colours and parts. `themes.css` adds `--world-*` scene colours (world-space / world-stage / world-sea) |
| `start.bat`, `start.sh` | Start the local server |

## Blanks we filled in · ค่าที่เติมในช่องว่าง
| Blank in the prompt | Value | Why |
|---|---|---|
| Max particles at once | **400** (pre-allocated pool) | The pool is created once, so a high ceiling costs nothing until it is used. Auto-halving (400→200→100…) protects slow machines. The doc's hint suggests 150; change `maxParticles` if you prefer that. |
| Four sounds | **grab, score (correct release), miss, combo** + levelUp + note(i) | The four the games need, plus two extras |
| FPS threshold | **below 30** | Reacts before the game visibly stutters. The hint suggests 20; change `lowFps`. |
| For how many seconds | **3 seconds** | As in the hint |

## MUST / PASS checklist · วิธีตรวจ
- [ ] **dt every frame:** move the slow-machine slider to 40–80 ms. The green dot still matches the grey dot (the difference stays within a few px). The red dot (no dt) falls behind.
- [ ] **Recycling:** press stress. The live-object count never goes above 400 + entities, and the particle array is never re-created (`__engine.particles.items.length` stays 400).
- [ ] **Sound only after first interaction:** no sound plays until you click. `sound.autoUnlock()` unlocks audio on the first pointer or key press.
- [ ] **Auto adapt:** with the slider at about 45 ms (under 30 FPS), a toast appears after 3 s and "อนุภาคสูงสุด" halves.
- [ ] **Calm mode:** turn on 🌙. Explosions and sounds stop.
- [ ] **PASS:** stars move smoothly, FPS is over 45 on your machine, and the memory badge's max stays flat after 5 minutes.

## Changes to the shared core (for later labs)
- `game-engine.js`: default particle colours now come from tokens (`--primary/--secondary/--pink`) instead of hex codes. `setCalm(true)` also clears live particles. Added `Sound.autoUnlock()`.

> Placeholders to change: app name "HandRehab Arcade", team "ทีม NeonHands", school "โรงเรียนของเรา".
