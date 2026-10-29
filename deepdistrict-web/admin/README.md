# DeepDistrict back office & learner portal (`admin/`)

Sign-in system for **admins, teachers, students and parents**: people, enrolments, lesson log,
hours (total / learned / remaining / booked / to schedule), rescheduling and make-up lessons,
change requests, payments, a calendar, and progress reports as PDF or image. Thai / English,
light / dark, works on phones.

## Start it

```bash
./start.sh            # Windows: start.bat      → http://localhost:8000/admin/
./start.sh --lan      # let phones/computers on the same Wi-Fi use it
```

The server (`server/app.py`) uses only Python 3 — nothing to install. Data is kept in
`server/data/deepdistrict.db` with a daily copy in `server/data/backups/`. Hosting it online
for free later (PythonAnywhere) is described in `server/DEPLOY.md`.

First visit: create the admin. Tick *Add demo data* to try it — the demo includes a 12-hour
course on Mondays and Wednesdays where one Monday lesson was moved to Tuesday for 1 hour.
Demo sign-ins: `parent@demo.test` / `demo-parent-1`, `student@demo.test` / `demo-student-1`,
`ploy@example.com` / `demo-teacher-1` (teacher). Remove them before real use.

## Who sees what (enforced by the server)

| Role | Sees | Can change |
| --- | --- | --- |
| **Admin** | everything | everything, incl. passwords, fees, settings, backups |
| **Teacher** | own students' enrolments, lessons, requests and parents | lessons of own students (log, move, make-ups), approve/decline their requests, add students/parents; **no fees** |
| **Parent** | own children's courses, lessons, hours, fees, reports | send change requests; change own password |
| **Student** | own courses, lessons, hours, fees, reports | send change requests; change own password |

Students and parents get a login only when an admin sets an email + password on them.

## Hours — how they are counted

| Number | Meaning |
| --- | --- |
| **Total** | hours purchased in the enrolment (e.g. 12) |
| **Learned** | completed lessons (+ no-shows if "no-show uses hours" is on) |
| **Remaining** | total − learned |
| **Booked** | upcoming lessons on the calendar |
| **To schedule** | total − learned − booked → hours that still need a lesson |

## Moving a lesson (example: 12 h, Mon + Wed × 1.5 h)

Pim's Monday lesson moves to **Tuesday for 1 h**. Open the lesson → **Move / reschedule…**:

1. The Monday lesson is kept as **Moved** (never counted) and linked to the new Tuesday lesson.
2. Tuesday is booked for 1 h. The form shows "Shorter by 0.5 h" and asks what to do:
   - **add to the next lesson** → Wednesday becomes 2 h, or
   - **book a make-up lesson** on a date you choose (0.5 h), or
   - **keep "to schedule"** for now — the enrolment shows "0.5 h has no lesson yet" with
     one-click buttons *Add 0.5 h to the next lesson* / *Book a make-up lesson*.
3. Totals stay correct: Total 12 · Booked 11.5 + To schedule 0.5 (or 12 + 0 after fixing).
4. Lesson lists, the calendar (faded "moved" lesson), the parent's view and the report all show
   "moved from / moved to / make-up for".

Students and parents can also **request** a change (new day/time/hours or cancel). The teacher
or admin sees it on the dashboard and under **Change requests**; *Approve…* opens the move form
already filled in, *Decline* sends a short reply.

## Reports for parents

Reports → choose the learner (and course/period): what was learned, hours total / learned /
remaining / booked / still to book, schedule changes, next lessons and fees. Export as **PDF,
PNG image, TXT, CSV** or print. Parents and students can open the same report themselves after
signing in.

## Other features

Dashboard alerts (low hours, past lessons not updated, unpaid fees, waiting requests) ·
weekly lesson series · month/week/list calendar with `.ics` export · payments & balances ·
course prices/availability · activity log · backup export/restore · auto sign-out after 30
minutes idle · screens refresh every 30 s so everyone sees updates.

## Security notes

Passwords are salted PBKDF2-SHA256 on the server and never sent back to the browser; sessions
use an HttpOnly, SameSite cookie; every change is checked against the person's role on the
server; repeated wrong passwords are blocked for 15 minutes; the database folder is never
served. Use HTTPS when it is on the internet (PythonAnywhere provides it).

## Files

```
server/app.py        API + static files + SQLite (Python standard library)
server/wsgi.py       entry point for WSGI hosting
server/DEPLOY.md     local, LAN and free-hosting guide
admin/index.html     the app shell
admin/js/core.js     API client, data sync, calculations, i18n, forms
admin/js/app.js      layout, router, dashboard, people, enrolments, lessons, payments, courses, settings
admin/js/calendar.js calendar views, .ics export, demo data
admin/js/portal.js   moving lessons, make-ups, change requests, learner/parent home
admin/js/reports.js  reports and exports (PDF / PNG / TXT / CSV / print)
admin/vendor/        html2canvas 1.4.1, jsPDF 4.2.1 (MIT)
```
