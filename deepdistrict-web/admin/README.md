# DeepDistrict back office (`admin/`)

A staff back office for running courses: people, enrolments, lesson logs, hours, payments,
a calendar, and learner reports you can export. Thai / English, light / dark, no build step.

Open **`admin/index.html`** (or the **Staff** link in the website footer). For the best
result run `./start.sh` and open <http://localhost:8000/admin/>.

## First run

1. Create the first **admin** account (name, email, password of at least 8 characters).
2. Optionally tick *Add demo data* to explore with three sample learners, then erase it later
   from **Settings → Erase all data**.

## What it does

| Area | What you can do |
| --- | --- |
| **Dashboard** | Active learners, hours taught this month, lessons in the next 7 days, outstanding fees, learners low on hours, past lessons not yet updated, recent activity |
| **Calendar** | Month / week / list views; filter by teacher or learner; click a day to add a lesson; click a lesson to update it; payments marked on the day; **export `.ics`** for Google, Apple or Outlook Calendar |
| **Enrolments** | Learner + course + teacher + hours purchased + rate/discount → fee (auto-calculated). Each enrolment page shows **hours used, hours left, hours booked, unscheduled hours, fee, paid and balance**, a progress bar, every lesson and every payment |
| **Lessons log** | Date, time, hours, status (scheduled / completed / cancelled / no-show), mode, teacher, **what was learned** and progress notes / homework. "Schedule weekly" creates a series of lessons in one step. Filter and export CSV |
| **People** | Learners, parents/guardians, teachers and admins; contact, school/grade, guardian link, **PDPA consent date**, active/inactive |
| **Payments** (admin) | Record payments (transfer, PromptPay, card, cash), receipt numbers, outstanding balances, CSV export |
| **Courses** (admin) | The public catalogue plus your own courses; set default hours, price per hour and open/closed — the website is not changed |
| **Reports & export** | Learner progress report (what was learned, hours used/left, next lessons, fees) as **PDF, PNG image, TXT, CSV or print**; all-learners summary as CSV, TXT, PDF or PNG |
| **Settings** | Organisation details, default rate, low-hours alert, whether a no-show uses hours, backup export/import, demo data, erase, activity log, change password |

### Roles

- **Admin** — everything.
- **Teacher** — sees and updates only the enrolments assigned to them (lessons, notes,
  calendar, reports); no payments, prices, courses or staff accounts.
- **Student / Parent** — records only (no sign-in). Share their progress by exporting a
  report as PDF or an image and sending it by email or LINE.

### How hours are counted

`hours left = hours purchased − (completed lessons + no-shows, if "no-show uses hours" is on)`.
Scheduled lessons show as *booked*; cancelled lessons never count.

## Where the data lives — please read

- Everything is stored **in this browser on this computer** (`localStorage`). Nothing is sent
  to any server. Clearing browser data deletes it.
- **Export a backup** (Settings → Export backup) regularly and keep it somewhere safe and
  private. Import it on another computer to move the data.
- Passwords are stored as salted PBKDF2-SHA-256 hashes. Sign-in protects the screen from
  casual access, but anyone with access to this computer's browser profile can read the
  data — use a computer account with a password and disk encryption.
- Sessions sign out after 30 minutes without activity.
- Learner records are personal data under the PDPA: collect consent (record the date on the
  person), keep only what you need, and delete people who ask (People → Edit → Delete).

## Moving to a shared online system later

For several staff on different devices, or a parent/student portal with their own sign-in,
the same data model should move to a hosted database with server-side authentication and
row-level permissions (for example Supabase/PostgreSQL). The collections map directly to
tables: `users`, `enrolments`, `sessions`, `payments`, `courseOverrides`, `customCourses`,
`log`. The JSON backup is the migration source.

## Files

```
admin/
├── index.html          Loads the shared course catalogue, the libraries and the app
├── css/admin.css       Uses the website's design tokens (assets/css/tokens.css)
├── js/core.js          Data store, calculations, i18n, sign-in, forms, helpers
├── js/app.js           Layout, router, dashboard, people, enrolments, lessons, payments, courses, settings
├── js/calendar.js      Calendar views, .ics export, demo data
├── js/reports.js       Learner report + summary; PDF / PNG / TXT / CSV / print
└── vendor/             html2canvas 1.4.1 and jsPDF 4.2.1 (MIT)
```
