# Lab 06 — Glowing Buttons and Cards
### ปุ่มเรืองแสงและการ์ด

**Goal:** build the reusable interface pieces (`css/parts.css`) that the rest of the app is assembled from, and show all of them on one page.
**เป้าหมาย:** สร้างชิ้นส่วนหน้าจอที่ใช้ซ้ำได้ทั้งแอป แล้วรวมโชว์ในหน้าเดียว

## How to run
- Windows: `start.bat` · Mac / Linux: `bash start.sh` · or `python -m http.server 8000` → http://localhost:8000
- `parts.html` (the name used in the prompt) redirects to `index.html`.

## What the page shows
1. **`.btn-glow`**: primary (gradient from `--primary` to `--secondary` with a glow), success, danger, ghost, small, and disabled. Hovering scales the button to 1.05 and brightens it over 0.2 s. Every button is at least 56 px tall, including `.small`.
2. **`.card-neon`**: corner radius `--r-lg` (24 px), a thin glowing border, and a frosted `backdrop-filter: blur()` background. It has slots for an icon (`.card-icon`), a heading (`.card-title`) and body content.
3. **`.chip`**: small number badges, e.g. 🔥 streak **7 วัน**, 🎯 accuracy **94%**, reps, warnings.
4. **`.ring`**: an SVG progress ring, set 0–100 from JS with `setRing(el, v)`. It animates smoothly (0.6 s). You can drive it with the slider, the ±10 buttons or the random button.
5. **`.toast`**: rises from the bottom and disappears after **3 s**, in success, warning and error variants.
- **Tooltips** (`data-tip="…"`) appear on hover or keyboard focus.
- **Extra team components:** a streak flame that grows with each day, an energy bar with a travelling shine, and twinkling stars.
- **Theme bar:** Neon / Calm / Large, light mode, and an optional **click sound** (Web Audio, off by default and silent in calm). A live **effect status line** reads the real computed CSS and shows that glow, transitions, blur, ring shadow and animation are all **off** under Calm.
- **🚀 Stress test:** adds 100 cards. Each card holds a ring, a chip and a button, and the rings keep moving. The page measures the average and minimum FPS over 4 s. The FPS counter stays visible in the top-right corner.
- **⌨ Tab check:** counts the Tab-reachable elements, and lists buttons shorter than 56 px or without a text label.

## Files
| File | Purpose |
|---|---|
| `index.html` / `parts.html` | Showcase page |
| `css/tokens.css`, `css/themes.css` | Colours and sizes (from Lab 05) |
| `css/parts.css` | The five components, plus tooltip, form controls, switch, modal, bar, alert |
| `css/extras.css` | Streak flame, energy bar, twinkling stars |
| `css/showcase.css` | Layout of this page |
| `js/ui.js` | `toast()`, `makeRing()` / `setRing()`, `FpsMeter`, prefs |
| `js/click-sound.js` | 60 ms click tone with the Web Audio API |
| `js/parts-page.js` | Page logic: themes, ring, toasts, stress test, Tab audit, effect status |

## Blanks we filled in
| Blank | Value |
|---|---|
| gradient from ___ to ___ | `--primary` → `--secondary` (follows the theme automatically) |
| on hover, scale to ___ | **1.05**, eased over 0.2 s (`--speed`) |
| minimum height ___ px | **56 px** (`--btn-h`; 72 px in the large theme) |
| card corner radius ___ px | **24 px** (`--r-lg`) |
| chip showing e.g. ___ or ___ | **streak days (🔥 7 วัน)** or **accuracy % (🎯 94%)** |
| toast disappears after ___ s | **3 seconds** |

Team placeholders: "ทีม NeonHands", "โรงเรียนของเรา".

## How to verify (MUST / PASS)
1. Hover over every button, card and chip. Each one responds (scale or brighter glow or border).
2. Press **Calm**. The status line must show **○ ปิด** for all five effects. Hovering no longer scales anything and the flame stops.
3. Press **ตรวจ Tab และขนาดปุ่ม**. The result must be "ปุ่มที่เตี้ยกว่า 56px: 0". Then press Tab repeatedly: every button, card and chip gets a 3 px focus ring.
4. Press **สร้างชิ้นส่วน 100 ชิ้น** and read the FPS report (in the headless test: 438 pieces, 60 FPS average, 58 minimum). If a classroom PC stutters, lower `--blur` in `tokens.css` first.
5. Press each toast button. The toast rises and disappears after 3 s.
6. Every colour comes from `tokens.css`. `parts.css` has no raw colours.

## Changes compared with the shared core
- `.btn-glow.small` was 0.8 × 56 = 44.8 px tall. It is now `max(56px, …)`, following the ≥ 56 px rule.
- Calm now also removes hover scale, the ring's `drop-shadow`, and the card blur. These were not covered by the `box-shadow`, `animation` and `transition` rules.
- The raw `#000` and `rgb(0 0 0 / …)` in `parts.css` were replaced by the tokens `--stage-bg`, `--shadow` and `--scrim`.
