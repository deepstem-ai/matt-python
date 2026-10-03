# Lab 09 — Senior Mode and Accessibility
### โหมดผู้สูงอายุและการเข้าถึง

**Goal:** make the app genuinely usable by an older adult. One switch makes everything grow instantly, with no restart.
**เป้าหมาย:** กดสวิตช์เดียว ทุกอย่างในแอปใหญ่ขึ้นทันทีโดยไม่ต้องเปิดใหม่ และมีบันทึกการทดสอบกับผู้ใหญ่จริง 1 คน

This lab is the Lab 07/08 app (router, splash and seven pages) plus the accessibility system.

## How to run
`start.bat` · `bash start.sh` · or `python -m http.server 8000` → http://localhost:8000
Log in with the test button, then open **ตั้งค่า** (Settings) from the bottom bar.

## What you get
- **3 display profiles** (radio buttons) switch instantly by changing a class on `<body>`. `themes.css` swaps every size variable:
  | Profile | Base text | Min button height | Spacing |
  |---|---|---|---|
  | standard | 16 px | 56 px | × 1 |
  | elder | 16 × **1.35** = 21.6 px | **72 px** | × 1.5 |
  | kiosk | 28 px (largest) | 72 px | × 1.75 |
  A **fine text-size slider** (90–130 %) sits on top of the profile.
- **Calm mode** switch: every animation, transition, glow and blur stops, and everything still works.
- **Theme** radios (neon / calm / large) and a **light mode** switch.
- **Language** dropdown TH / EN for the main labels (nav, headings, settings, top bar), in `js/i18n.js`.
- **Hand-sensitivity slider**, saved as `prefs.sensitivity` (0.2–0.9) for the gesture labs.
- **Speech:** the "🔊 ฟังคำแนะนำ" button in the top bar reads the page heading and its `[data-say]` instructions with `speechSynthesis` (th-TH, rate 0.9). A switch makes it read automatically on every page change.
- **Keyboard:** Tab reaches every control in page order. The focus ring is **3 px in the theme's primary colour** (`--focus`). Escape goes back, F1 opens help, **Alt+A** runs the audit.
- **Every button has an icon and a text label.** The audit enforces this.
- Every choice is saved via `savePrefs()` (localStorage `hr-prefs`) and **restored on the next launch** by `applyAllPrefs()`.
- **Audit** (`js/a11y-audit.js`, the button "🔍 ตรวจการเข้าถึง"): walks every visible button and reports
  - buttons shorter than 56 px,
  - buttons that are icon-only or text-only,
  - text/background pairs with contrast **below 4.5**. The real background is found by walking up the parents and blending translucent layers; for gradients the worst stop is used.

  The results go to the console with `console.table`, appear on screen in the settings page, and every offender gets a red dashed outline.
- `docs/elder-test-record.md`: a template for testing with one real adult (tasks, time per step, where they got stuck, ratings, fixes).

## Files
| File | Purpose |
|---|---|
| `index.html` | App (Lab 08) with i18n labels, `data-say` instructions and the new Settings page |
| `js/settings.js` | Settings controls → `savePrefs` → `applyAllPrefs` (profile, text scale, theme, calm, light, language, sensitivity, transition); `runAudit()` |
| `js/a11y-audit.js` | `auditA11y({minHeight, minContrast})`, `markProblems()`, `textContrast()` |
| `js/contrast.js` | WCAG `contrastRatio` and colour parsing/blending (from Lab 05) |
| `js/i18n.js` | TH / EN labels |
| `js/speech.js` | `speak()`, `pageInstructions()` |
| `css/a11y.css` | Focus ring, settings layout, larger switches and radios in elder/kiosk, `.a11y-flag` |
| `docs/elder-test-record.md` | Test record template |
| other `js/` and `css/` | From Labs 05–08 |

## Blanks we filled in
| Blank | Value |
|---|---|
| standard: base text ___ px | **16 px** |
| standard: min button ___ px | **56 px**. The hint says 48, and 44–48 px is the international minimum, but this project requires ≥ 56 px because users' hands may shake. Cite this in the report. |
| elder: text scaled by ___ | **1.35** |
| elder: min button ___ px | **72 px** |
| focus ring colour ___ | **`--primary` via `--focus`**, 3 px |

Team placeholders: "ทีม NeonHands", "โรงเรียนของเรา".

## Article alignment (MITIJ article)

- `js/geometry.js` comments now cite the article equation numbers: **eq. (1)** palm size s = ‖p0 − p9‖ (`palmScale`) and **eq. (2)** d̂ij = ‖pi − pj‖ / s (`normDist`). Comments only — no behaviour change.

## How to verify (MUST / PASS)
1. Settings → pick **ผู้สูงอายุ**. The headings grow from 35 to 48 px and the buttons from 56 to 72 px, instantly. Pick **จอใหญ่ติดผนัง**: 62 px headings.
2. Reload the page (F5). Your profile, theme, calm, light and language choices come back.
3. Turn on calm mode and move between pages. Nothing animates, and everything still works.
4. Press **🔍 ตรวจการเข้าถึง** (or Alt+A) on each page and in each profile/theme. Headless result: 0 small buttons, 0 icon/text problems, 0 low-contrast pairs in standard, elder, kiosk, calm and light. When a 30 px icon-only button and a faint paragraph are injected, all three are reported.
5. Press Tab from the top. Every button shows the 3 px ring, in a sensible order.
6. Shrink the window to phone width. The top bar wraps and nothing is cut off.
7. **MUST:** test with one real adult using `docs/elder-test-record.md`. Do not help them. Time each step. Commit the filled-in record.

## Changes compared with the shared core
- `ui.js` prefs gain `textScale`, `sensitivity`, `speech`, `transition` and `transitionMs`. `savePrefs` already merges any keys.
- Light `--primary` was darkened to #0C6A84, because the audit found primary text on `--input` chips at 4.35:1.
