# Technology review — October 2026

This is a review of an outside recommendation (React / Next.js / Vercel vs. Django / PythonAnywhere) for the
DeepDistrict Examination & Learning Platform, checked against what is actually in this repository and
against current provider documentation.

## What is correct in the recommendation

- **React, Next.js, Vercel and PythonAnywhere do different jobs.** React is UI only; Next.js is a
  full-stack framework (Route Handlers, Server Actions); Vercel is a serverless platform; PythonAnywhere
  hosts long-running Python web apps. "Vercel is frontend-only" is wrong.
- **Vercel WebSockets:** generally available since 20 Oct 2026, with Fluid compute. Connections still end
  when the function reaches its maximum duration (300 s on Hobby; 800 s on Pro, 1,800 s extended in beta),
  so clients need reconnect logic and shared state must live outside the function (e.g. Redis).
- **PythonAnywhere ASGI** (FastAPI and other async apps) is still documented as **beta / experimental**.
  WSGI apps (Django, Flask — and this project) are the mainstream path.
- **PythonAnywhere plans (2026):** the paid tiers were merged into one **Developer** plan of about
  $10/month. PostgreSQL is available on paid accounts.
- **Polling before WebSockets** is the right first step for small live classes. The back office already
  refreshes every 30 seconds.
- **Quality comes from design, security and tests**, not from the host.

## What needs correcting for *this* project

1. **The current code is not FastAPI.** DeepDistrict runs on a Python standard-library **WSGI** server
   (`server/app.py`) with SQLite (WAL), and has no framework. It already deploys to PythonAnywhere as a
   normal WSGI app (`server/wsgi.py`) without changes. The "FastAPI + SQLite MVP needs restructuring" point
   refers to a different code base.
2. **A lot is already built and tested:**
   - accounts and roles
   - enrolments, scheduling and clashes
   - receipts and documents
   - notifications (email/LINE)
   - PDPA consent log, pop-ups
   - the course catalogue and its database-backed statuses

   The automated suites run about 350 checks, plus a 144-combination page-layout matrix. Moving everything to Django now would be a rewrite, not a
   tidy-up.
3. **PDFs:** documents are rendered in the browser (jsPDF + html2canvas), so they cost the server nothing
   and need no system libraries. A Django design would add server-side PDF (e.g. ReportLab); that is
   useful for batch reports, not required.
4. **Free-plan changes that matter:**
   - **No scheduled tasks or MySQL:** free PythonAnywhere accounts created from mid-January 2026 have
     neither, and outbound internet is allowlist-only.
   - **What still works on the free plan:** this app runs there because it uses SQLite and an external
     cron URL.
   - **What needs the paid plan:** LINE messages and reliable email in production need the Developer plan.
5. **One web app per Developer account:** the Developer plan includes one web app. Running a separate
   Django exam app alongside the current one would need a second account or a bigger plan. Otherwise the
   exam module should live inside the same app.

## Recommendation

| Phase | What | How |
| --- | --- | --- |
| 1 — now | Public site, back office, learner/parent portal | Keep the current WSGI app; deploy to PythonAnywhere **Developer** (about $10/month) with HTTPS, daily backups and the external cron URL. |
| 2 — exam platform MVP | Question bank, timed tests, auto-grading, score reports | Decide by size: a modest bank and a few teachers → extend the current app (new tables, same login). A large multi-teacher product → start a **Django + PostgreSQL** project and import users and enrolments from the JSON backup. |
| 3 — live classes at scale | Many simultaneous rooms, real-time sync | Polling first. Then Django Channels + Redis + workers on a container/VPS host (or Vercel WebSockets with external state if the front end moves to Next.js). |

Either way, design the data so it can move: keep IDs stable, store files outside the database, and keep
the JSON backup/restore working.
