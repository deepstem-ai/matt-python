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
| **Admin** | everything | everything, incl. **approving requests**, passwords, fees, receipts, settings, email, backups |
| **Teacher** | own students' enrolments, lessons, requests and parents; other teachers' time slots | lessons of own students (log, move, make-ups), email documents, add students/parents; approve requests only if the admin allows it; **no fees** |
| **Parent** | own children's courses, lessons, hours, fees, schedule, reports | request a move / cancel / time off; change own password |
| **Student** | own courses, lessons, hours, fees, schedule, reports | request a move / cancel / time off; change own password |

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

## Enrolling: lessons, receipt and schedule in one step

New enrolment → choose learner, course, teacher, hours and **regular days & times**. Each day can
have its own time and room, e.g. *Mon 09:00–10:30 (Room A), Tue 14:00–15:00, Wed 19:00–20:30*.
With "Create the lessons in the calendar now" ticked, the system books every lesson from the
chosen first date until the purchased hours are used up (the last lesson is shortened if needed).

Example: enrolled Wed 4 Nov, 12 h, Tue + Wed 18:00–19:00 → 12 lessons, Tue 10 Nov … Wed 16 Dec.
If a payment was received it gets the next receipt number (`RC2026-0001`, …). The **enrolment
confirmation** (schedule + fees + receipts) opens straight away to download, print or email.

## Time clashes

Every time a lesson is created, moved, generated or approved, the system checks for the same
**teacher**, the same **learner** or the same **room** at an overlapping time. If it finds one, a
pop-up lists both lessons — *Go back and change* or *Confirm anyway*.

The **week view** is a time grid: each teacher has a colour; lessons at the same time sit side
by side showing *start–end · course · learner · teacher · online/onsite/hybrid · room*. Lessons
of the same teacher that overlap get a red outline. Teachers also see other teachers' lessons
(hatched, without learner details) so they can avoid clashes.

## Change requests and time off — DeepDistrict decides

Students and parents can ask to **move a lesson, cancel a lesson, take time off (e.g. two weeks)
or something else**. Only admins approve by default (Settings → *Teachers may also approve*).

- *Move* → the move form opens with the requested date/time; hours are balanced as above.
- *Time off* → shows the lessons in that period; **postpone** cancels them and books the same
  hours again after the last lesson using the regular times (editable), or **cancel only**.
- Every decision stores a result ("4 lessons cancelled; 4 booked 22 Dec – 30 Dec") that the
  parent sees; the requests page is a report you can export (PDF, PNG, CSV, email).

## Documents (all with logo and official stamp)

| Document | Where |
| --- | --- |
| Enrolment confirmation (schedule + fees + receipts) | after enrolling; enrolment page |
| Receipt with amount in Thai and English words | after recording a payment; payments lists |
| Learning schedule | enrolment page; parent's "My learning" |
| Progress report | Reports |
| Search results, requests summary, learners summary | Search, Change requests, Reports |

Each can be saved as **PDF or PNG**, printed, or **emailed** (with the PDF/PNG attached). Set up
email once in **Settings → Email** (e.g. Gmail / Google Workspace with an app password). Without
it, "Email" downloads the file and opens your mail app, or uses the phone's share sheet.

## Notifications: in the app, email and LINE

The **bell** (and *Notifications* in the menu) shows what happened, e.g. a new enrolment and its
schedule, a payment receipt, a new change request (for admins), a decision on a request, a moved
or cancelled lesson, a completed lesson with the hours left, a reminder the day before a
lesson, or hours running low.

- **My settings & LINE**: each person chooses the topics, the channels (email, LINE) and the
  language (Thai/English) of their messages; **Connect LINE** gives a 6-digit code to send to the
  DeepDistrict LINE Official Account (one minute, no app to install).
- **Admin: notifications & LINE**: switch topics on/off for everyone, the reminder time, the
  monthly LINE limit (free plan ≈ 300 pushes), LINE account setup, a test message, and a sent
  log (✓ sent, ✗ failed, ⛔ monthly limit). When the LINE limit is reached, email and the
  in-app inbox still work.
- In the LINE chat, people can type **"ตาราง / schedule"** or **"ชั่วโมง / hours"** for their next
  lessons and hours left; these replies are free.

Setup steps are in `server/DEPLOY.md` → *LINE notifications*.

## Install it as an app on phones (no app store)

The back office is an installable web app (PWA). **Android / Chrome / Edge**: *Install the app*
button (Settings or the menu), or the browser menu → *Install app*. **iPhone / iPad**: open it in
Safari → Share → *Add to Home Screen*. It then opens full-screen with its own icon, has a bottom
tab bar on phones, and still opens without a connection (data needs the connection; nothing
personal is stored offline).

## Courses and groups

Courses come from the public catalogue and are shown in six groups (Foundation Programming,
Software & App Development, AI & Data Science, Hardware/Robotics/Edge AI, Research &
Innovation, Standard Tests & Admissions). **Courses** lists one table per group; set your own
default hours, price per hour and open/closed there. A **custom course** asks for its group;
older custom courses without one appear under "Other / custom". After editing the catalogue
files, run `node tools/check_catalogue.js`.

## Cookie consent records (PDPA)

The public website asks about cookies at the start of every visit (Cookie Settings · Reject
All · Accept All). Each choice is stored on the server as proof of consent, with no personal
data: a random reference, the time, the policy version and the choices. Records are kept for
3 years. **Settings → Cookie consent records → Download CSV**.

## Pop-up promotions (admins)

**Pop-ups** in the menu.

- **Turn on** switches the feature on for the whole website. Each pop-up also has its own
  switch.
- **New pop-up** asks for:
  - a title and message in Thai and English
  - an optional picture (resized automatically)
  - a button and link
- **When it shows:**
  - start and end (date and time, Bangkok)
  - only on some weekdays
  - only between two times each day; the window may cross midnight, e.g. 20:00–02:00
- **Where and how often:**
  - on which pages
  - how often a visitor sees it: every visit, once a day or only once
  - the delay after the page opens
  - the priority; if several are live, the highest one is shown
- The list shows each pop-up's status:
  - Showing now
  - Scheduled
  - Outside its days / hours
  - Ended
  - Off
- **Preview** shows it as visitors will see it.
- Visitors see a pop-up only after answering the cookie bar, at most one per visit, never on
  the privacy page. Pop-ups need the DeepDistrict server, so they don't show when the site is
  opened as plain files.

## Search

**Search** finds lessons (topics, notes, rooms), enrolments, people, payments (receipt numbers)
and requests, filtered by date range, teacher, learner and status. Results export as CSV/Excel,
PDF, PNG, print or email.

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
News to email / LINE / Facebook / TikTok from the portal: see `docs/NEWS-POSTING-PLAN.md`.

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
admin/js/notify.js   notifications inbox, my settings, Connect LINE, admin LINE settings, install app
admin/sw.js          offline app shell (never caches /api/)
server/notify.py     notification events, email/LINE sending, LINE webhook, reminders
admin/vendor/        html2canvas 1.4.1, jsPDF 4.2.1 (MIT)
```
