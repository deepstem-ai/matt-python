# Lab 13 — Permanent Storage and a Full User Management Screen
ที่เก็บข้อมูลถาวร (IndexedDB) และหน้าจัดการผู้ใช้ครบ: ค้นหา ดู แก้ไข ลบ ส่งออก นำเข้า

## Goal
Save data permanently on this machine and manage users completely (create, read, update, delete). Deleting a user must leave **nothing** behind.

## How to run
- Windows: double-click `start.bat`
- Mac / Linux: `bash start.sh`
- Or run `python -m http.server 8000` in this folder, then open http://localhost:8000
- Press **🧪 สร้างผู้ใช้ตัวอย่าง 5 คน** to fill the page with demo data at once: 5 fictional users with 21 sessions, reps, settings, and 2 cartoon "face photos".

## Files
| File | What it does |
|---|---|
| `index.html` | **users.html**: the user management screen (it is `index.html` so `start.bat` opens it) |
| `js/db.js` | IndexedDB core `handrehab-arcade` v1 (schema unchanged): CRUD, `searchUsers`, `saveFace/listFacesByUser`, `saveSession/listSessionsByUser`, `deleteUserCompletely` → report, `exportAll/importAll`. Thai comments explain IndexedDB vs localStorage |
| `js/users.js` | Card list, live search, filters, pagination, export/import, overview chips |
| `js/users-dialogs.js` | Details modal, two-step delete (checkbox + type the exact name), delete report, import preview |
| `js/users-demo.js` | Demo data generator |
| `register.html` + `js/register*.js`, `js/validators.js`, `js/consent.js`, `css/register.css` | Lab 12 form reused. **Add** = `register.html`, **Edit** = `register.html?edit=<id>`, which keeps the original consent time and extra fields |
| `js/ui.js`, `css/*` | Shared core |

## Blanks we filled in
| Blank | Our value | Why |
|---|---|---|
| Database named ___ | **`handrehab-arcade`** | The project name, so it never collides with other apps |
| Filters by ___ and by ___ | **sex** and **tremor level**, plus condition, age band (<60, 60–69, 70–79, 80+) and "not trained for over 7 days" | What a physiotherapist asks for (hint) |
| Stores | users, faces, sessions, settings (plus reps, achievements, calibration… used by later labs) | Shared schema for all labs |

Team placeholders to change: "HandRehab Arcade", "ทีม NeonHands", "โรงเรียนของเรา".

## How to verify (MUST / SHOULD / PASS)
1. **Create:** press ＋ เพิ่มผู้ใช้ใหม่, fill in the 4 steps and save, then go back. A new card appears showing initials (no photo), age, sex, conditions, session count and last session date.
2. **Read / search:** type in the search box and the list filters on every keystroke (name, surname, condition, carer, phone). Try the sex, tremor, condition and age filters and "ไม่ได้ฝึกเกิน 7 วัน". Press 👁 ดู for full details and the last 5 sessions.
3. **Update:** press ✏️ แก้ไข to open the same form filled in. Change something and save. The card updates and `updatedAt` is set.
4. **Delete (MUST):** press 🗑 ลบ. The button stays disabled until ① the box is ticked **and** ② the full name is typed exactly. A report then lists how many users, faces, sessions, reps, settings, achievements, calibration and surveys records were removed. Check F12 → IndexedDB: nothing with that `userId` is left.
5. **Closing the browser loses nothing (MUST):** close Chrome completely, reopen it, and every user is still there.
6. **Export / import:** ⬇ ส่งออก downloads `handrehab-backup-YYYY-MM-DD.json`. Delete a user, then ⬆ นำเข้า that file: a preview appears, and the user comes back.
7. **Backup reminder (SHOULD, simple version):** an orange bar reminds you to export if you have not for over 7 days.
8. **Speed (SHOULD):** press the demo button 4 times (20 users). Search stays instant, and the list pages at 9 cards.

⚠️ Never commit exported JSON, face images or real health data to git.

## Notes / fixes to the shared core
- `db.js deleteUserCompletely`: it used to delete reps only by `userId`. Reps saved with just a `sessionId` stayed behind as orphans. It now also deletes reps belonging to each of the user's sessions. The demo data includes such reps to prove this: the report shows reps = 6, and 0 orphans are left.
- `db.js`: every exported function now has `try/catch` that logs a Thai message. `searchUsers` also searches `conditionOther`. `importAll` ignores non-array stores. The schema is unchanged.
- `register.js` (edit mode): keeps existing `extra` keys that the form does not know about, so data from other labs is not lost.
- `parts.css`: `a.btn-glow { text-decoration: none; }`.
- Not done: a fully automatic backup file on every app start. Browsers cannot write files without a click, so this lab shows the 7-day reminder instead.
