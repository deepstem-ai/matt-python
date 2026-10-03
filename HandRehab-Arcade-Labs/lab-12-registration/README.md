# Lab 12 — A Registration Form That Cannot Be Filled In Wrong
ฟอร์มลงทะเบียน 4 ขั้นที่กรอกผิดไม่ได้ คำนวณอายุอัตโนมัติ และบันทึกร่างให้เอง

## Goal
Collect complete, correct user information in 4 steps. The age is calculated the moment a birth date is chosen. The user cannot move on while a step is incomplete, and consent must be given before anything is saved.

## How to run
- Windows: double-click `start.bat`
- Mac / Linux: `bash start.sh`
- Or run `python -m http.server 8000` in this folder, then open http://localhost:8000
- Unit tests without a browser: `node tests/validators.test.mjs` (49 cases)
- The same tests in a browser: http://localhost:8000/tests.html

## Files
| File | What it does |
|---|---|
| `index.html` | The 4-step form, breadcrumb, consent modal, success screen |
| `js/validators.js` | **Pure** functions with no DOM: `validateName`, `toChristianYear`, `calcAge`, `validateBirthDate`, `validatePhone`, `daysInMonth`, `formatPhone`, `THAI_MONTHS` |
| `js/register.js` | Step logic, live validation (green/red borders), blocked Next, draft autosave/resume, save through `db.createUser` (or `updateUser` with `?edit=<id>`) |
| `js/register-form.js` | Reads and writes the form. Converts between the form and the user record |
| `js/register-data.js` | The 8 conditions, 4 tremor levels, pain text, goals, surgery options |
| `js/consent.js` | Consent modal. You must scroll to the bottom before the box can be ticked, and tick it before Accept works |
| `js/db.js` | IndexedDB core (Lab 13). Saves with the shared user field names |
| `tests/validator-cases.js` | The test cases, shared by node and the browser. Put your team's real birth dates in `TEAM` |
| `tests/validators.test.mjs`, `tests.html` | Node runner / browser runner that shows pass or fail |
| `docs/extra-fields-proposal.md` | Team decision record: the 3 chosen fields with reasons, 5 more proposed fields, sensitivity warnings |
| `css/register.css` | Form-only styles (colours only through `var()`) |

Saved record uses the project's field names: `firstName, lastName, birthDate ('YYYY-MM-DD' CE), sex, hand, conditions[], conditionOther, tremor (0-3), medication, carer, phone (digits only), consentAt (ms)` plus `extra { painScore, goal, goalOther, handSurgery, handSurgeryDetail, noConditions, filledBy, filledByName }`. `createUser` adds `id`, `createdAt` and `active`.

## Blanks we filled in
| Blank | Our value | Why |
|---|---|---|
| Form divided into ___ steps | **4** | Hint: one page is too much for older users |
| ___ common conditions | **8**: diabetes, hypertension, high cholesterol, osteoarthritis/arthritis, stroke, Parkinson's, trigger finger, carpal tunnel. Also "other" and "no conditions" | Common in older Thai adults, plus the hand-related ones |
| Collect ___ because ___ (1) | **Pain level 0–10** because games reduce difficulty when pain is high and warn if pain rises after training | |
| Collect ___ because ___ (2) | **Personal rehab goal** because the app picks games that train the movement behind the goal and uses it in encouragement messages | |
| Collect ___ because ___ (3) | **Previous hand/wrist surgery or injury (which side)** because an operated hand starts lighter and is calibrated separately | |
| Borders turn ___ when valid / ___ when invalid | **green `--success`** / **red `--error`** | Theme tokens, as the hint says |
| Five more proposed fields | Vision, hearing, device familiarity, convenient times, clinical grip baseline, each with sensitivity warnings | See `docs/extra-fields-proposal.md` |

Extras (COULD): quick "age ≈ 50/60/70/80" year buttons, and a "carer filled it in" mode that records who filled in the form.
Team placeholders to change: "HandRehab Arcade", "ทีม NeonHands", "โรงเรียนของเรา", plus the contact line in the consent text.

## How to verify (MUST / SHOULD / PASS)
1. `node tests/validators.test.mjs` prints **ผ่าน 49/49**. This includes a birthday later this year, a birthday tomorrow, 29 Feb (28 Feb → not yet, 1 Mar → yes), the future, age 1 and 120, 31 April, and Thai mobile numbers with dashes or spaces. Put your team's real birth dates in `tests/validator-cases.js` → `TEAM`.
2. Step 1: type a digit in a name and the border turns red with a Thai message. Choose day/month/year and "อายุ __ ปี" appears instantly. The พ.ศ./ค.ศ. switch relabels the years and keeps the chosen year. February shows 28 or 29 days depending on the year.
3. **Next** stays disabled and the text "ยังขาด: …" lists what is missing, on every step.
4. Step 2: the tremor slider description changes at each of the 4 levels. The phone number must be a 10-digit 06/08/09 number.
5. Step 3: each of the 3 fields shows a 💡 "เพราะ" reason.
6. Step 4: the consent checkbox stays **disabled until you scroll to the bottom**, and Accept stays disabled until you tick it. The accept time is shown and saved as `consentAt`. Save is impossible without it.
7. Close the tab halfway and reopen it. A "พบข้อมูลที่กรอกค้างไว้" dialog offers to resume. A "💾 บันทึกร่างแล้ว" toast appears while typing.
8. Finish: a success screen appears. F12 → Application → IndexedDB → `handrehab-arcade` → `users` holds the record, and the draft is cleared.
9. Time an adult filling it in. Over 5 minutes means the form is too long.
