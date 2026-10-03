# Lab 05 — Your Team's Colours and Type
### สีและตัวอักษรของทีม

**Goal:** define every colour, spacing step, corner radius and font size in one place (`css/tokens.css`), so changing the whole app later means editing a single file.
**เป้าหมาย:** เก็บสี ระยะห่าง ความมน และขนาดตัวอักษรไว้ที่เดียว แก้ไฟล์เดียวเปลี่ยนทั้งแอป

## How to run
- Windows: double-click `start.bat`
- Mac / Linux: `bash start.sh`
- Or run `python -m http.server 8000` in this folder, then open http://localhost:8000
- `style.html` (the name used in the course prompt) redirects to `index.html`. Both show the same page.
- Unit test for `contrastRatio` (Node 22 or newer): `node js/contrast.test.mjs`. You can also press **"รันการทดสอบ contrastRatio"** on the page.

## What the page shows
- Every colour as a card. Each card shows the variable name, the hex code, and the WCAG contrast ratio. Text colours are measured against `--bg`, and surface colours are measured with `--text` on top of them. A ratio **below 4.5 shows a red ✖**.
- A colour picker on each card. It edits the CSS variable live, and every ratio is recalculated.
- The table **"คู่สีที่ใช้จริงในแอป"** lists the 18 colour pairs the app actually uses, with a pass/fail summary at the top.
- Two lines of Thai sample text at each of the 7 font sizes, with the real pixel size.
- Theme buttons and a dropdown (neon / calm / large), a light/dark button and switch, and a base-font slider (12–32 px) with a live preview.
- The **"ดาวน์โหลดสีชุดนี้"** button saves `tokens-custom.css` with the colours currently on screen. This is the small theme editor from COULD DO.

## Files
| File | Purpose |
|---|---|
| `index.html` / `style.html` | The style page (style.html redirects) |
| `css/tokens.css` | **The only place colours are written**: 9 named colours plus extras, 6 spacing steps, 3 radii, 7 font sizes, fonts |
| `css/themes.css` | Themes `theme-neon`, `theme-calm`, `theme-large`, plus `light`, profiles and `calm` |
| `css/parts.css` | Shared components (buttons, cards, chips…) used by the page |
| `css/style-page.css` | Layout of this page only (variables only) |
| `js/contrast.js` | `contrastRatio(c1, c2)` (WCAG 2.x formula), `parseColor`, `luminance`, `blend`, `toHex` — pure functions |
| `js/contrast-tests.js` | 14 test cases with known answers (e.g. black/white = 21, #767676 on white = 4.54) |
| `js/contrast.test.mjs` | Node runner for the tests |
| `js/style-page.js` | Builds the cards, pair table and type scale, and wires up the controls |
| `js/ui.js` | Shared helpers (`savePrefs`, `cssVar`, `toast`, `downloadText`) |
| `start.bat`, `start.sh` | Start the local server |

## Blanks we filled in
| Blank in the prompt | Value |
|---|---|
| main background | `--bg: #0B1020` |
| card background | `--card: #151B33` |
| brand primary | `--primary: #22D3EE` (cyber cyan) |
| brand secondary | `--secondary: #A78BFA` (soft violet) |
| success | `--success: #A3E635` |
| warning | `--warning: #FBBF24` |
| error | `--error: #F87171` |
| primary text | `--text: #F8FAFC` |
| secondary text | `--text-2: #94A3B8` |
| six spacing steps | 4, 8, 12, 16, 24, 40 px (`--sp-1`…`--sp-6`) |
| three corner radii | 8, 16, 24 px (`--r-sm`, `--r-md`, `--r-lg`) |
| seven font sizes | `--fs-xs`…`--fs-3xl` = base × 0.75, 0.875, 1, 1.25, 1.6, 2.2, 3.2 |
| Thai typeface | **Noto Sans Thai** (Google Fonts, falls back to Leelawadee UI / Tahoma when offline) |
| game numerals typeface | **Orbitron** |

Extra tokens: `--input`, `--pink`, `--sky`, `--line` (dividers only), `--on-bright` (text on bright buttons), finger colours `--f-*`, and `--shadow` / `--scrim` / `--stage-bg` (so that no other file needs a raw colour).

**Team placeholders to change:** app name "HandRehab Arcade", team "ทีม NeonHands", school "โรงเรียนของเรา". Swap in your own palette from coolors.co. The page tells you at once if a pair drops below 4.5.

## How to verify (MUST / PASS)
1. Open the page. The green banner must read **"ผ่านเกณฑ์ครบ 18/18 คู่"**. Do the same check in all three themes and in light mode (every combination passes). The only red card is `--line`, which is marked "เส้นแบ่งเท่านั้น ไม่นับเป็นคู่ตัวอักษร" and is never used for text.
2. Press Neon / Calm / Large. The colours change, and Large makes all 7 sizes bigger. Toggle light/dark.
3. Move the font slider. All 7 sample sizes change together.
4. Pick a dark grey for `--text` in dark mode. The banner turns red and names the failing pairs. Press "คืนค่าสีเดิม".
5. `node js/contrast.test.mjs` prints **รวม 14 ข้อ ผ่าน 14 ข้อ**.
6. Search the project: no raw colour codes outside `tokens.css` / `themes.css`. The only exceptions are the test data in `contrast-tests.js` and the white fallback in `ui.js`.
7. SHOULD: screenshot this page for the report appendix, and show it to someone outside the team.

## Note: bug fixed from the shared core
- In the original `tokens.css`, derived sizes like `--fs-lg: calc(var(--fs-base) * 1.25)` were declared only on `:root`. CSS resolves `var()` where the property is declared, so changing `--fs-base` on `<body>` (themes and profiles) **did not resize any text**. The derived tokens (`--fs-*`, `--focus`, `--glow`) are now declared on `:root, body`.
- `theme-large` was overridden by `profile-standard`, which came later in the file. It now wins when the profile is standard.
- The light theme gained darker `--pink` and `--sky`, and a darker `--primary` (#0C6A84) so chips on `--input` pass 4.5.
