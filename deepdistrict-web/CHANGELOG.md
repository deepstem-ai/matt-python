# Changelog

## 4.3 r1 — October 2026
- Enrolment form with **regular days & times per day** (different time/room each day) that
  creates all lessons automatically until the hours are used, records a payment, and opens an
  **enrolment confirmation** (schedule + fees + receipts).
- **Clash detection** (same teacher, learner or room) with a confirm-or-go-back pop-up on every
  create / edit / move / generate / approve.
- Calendar **week time-grid**: colour per teacher, overlapping lessons side by side with
  start–end, course, learner, teacher, mode and room; red outline for same-teacher overlaps;
  teachers see other teachers' slots without learner details.
- **Requests approved by DeepDistrict** (admins; optional for teachers); new **time off**
  request with postpone/cancel; stored result shown to parents; requests report.
- **Documents with logo + official stamp**: receipt (Thai/English amount in words, numbered),
  learning schedule, enrolment confirmation, reports, search results.
- **Email** documents as PDF/PNG via SMTP (Settings → Email), with share/mail-app fallback.
- **Search** across lessons, enrolments, people, payments and requests with export.
- Fix: changes made while a previous save was still running could be skipped; screens now also
  refresh when moving between pages.

## 4.2 r1 — October 2026
- **Server** (`server/app.py`, Python standard library + SQLite): sign-in for admins, teachers,
  students and parents; role-based data access enforced on the server; HttpOnly session cookie,
  PBKDF2 passwords, login throttling, CSRF header; daily database backups; backup/restore API;
  WSGI entry point for free hosting (PythonAnywhere). `start.sh` / `start.bat` now start it.
- **Hours** shown everywhere as Total · Learned · Remaining · Booked · To schedule, with a
  two-part progress bar and a "hours without a lesson" alert.
- **Move / reschedule lessons**: original kept as "Moved", new lesson linked; a shorter lesson's
  missing hours can go to the next regular lesson, a make-up lesson, or stay "to schedule".
- **Change requests** from students and parents; teachers/admins approve (move form pre-filled)
  or decline with a reply.
- **Learner / parent portal** ("My learning"): hours, next lessons, recently learned, fees,
  reports as PDF/PNG, requests, calendar.
- Reports include "Still to book" and "Schedule changes".
- Demo data reproduces the Monday→Tuesday (1 h) case.

## 4.1 r2 — October 2026
- No fixed course hours on the public site: cards show the track, the course overview says
  "Length: tailored to you", the plan builder shows levels, the fees FAQ and the curriculum
  document no longer list hours. Default hours stay in the back office for building packages.

## 4.1 r1 — October 2026
- **Back office** (`admin/`): staff sign-in with roles (admin, teacher), people, enrolments with
  hours purchased / used / left / booked, lessons log with what was learned, weekly scheduling,
  payments and balances, course prices and availability, dashboard alerts, month/week/list
  calendar with `.ics` export, learner reports exported as PDF, PNG, TXT, CSV or print, backup
  export/import, Thai/English, light/dark.
- Course catalogue simplified: one row of track chips, one filter line (search + level + format),
  cleaner cards, first 12 courses with "Show all", and a one-screen course overview.
- Consent made friendly: a small card with one sentence and two buttons; settings list only what
  is used. Contact form needs a single consent tick.
- Privacy notice: learner records section. Footer: Staff link.

## 4.0 r1 — October 2026
- New palette "Sapphire & Saffron" (sapphire/indigo, aqua, saffron-gold accent) for both themes.
- Light/dark fixed: header button flips light ↔ dark; footer offers System / Light / Dark; former
  always-dark sections now follow the theme.
- Fonts self-hosted (Inter, Sora, Michroma, IBM Plex Sans Thai, Anuphan — SIL OFL); Google Fonts removed.
- Footer redesigned: one CTA strip, brand + three link columns, single bottom bar with version,
  collapsible trademark notice.
- SI explained simply: plain-words steps, "Isn't today's AI enough?", why start now.
- 16 new courses (50 total) and 2 new tracks: Git, React & Next.js, Swift Playgrounds, shipping
  apps for iPhone/iPad/Mac, Raspberry Pi 5 AI HAT+, Arduino UNO Q & VENTUNO Q, Jetson Orin Nano
  generative AI, NVIDIA RAPIDS / NIM & NeMo / Isaac, AI Co-Engineering I–III, COMPAS-PY1,
  COMPAS-CPP1 and HKICO prep.
- Exam & olympiad section with TCAS70 portfolio information and the Plan · Edge · Trace · Test method.
- Six future skills (STEM page); STEM + SI research projects by field (Research and Innovation pages).
- Course outlines marked as indicative and adapted per learner.
- Regeneron ISEF removed from venues; COMPAS and HKICO added.
- Contact form can send to a configured endpoint with email-app fallback; privacy notice v3.
- Neural animation on every page hero; new original exam illustration.

## 3.x — earlier
- SI-first rewrite, personalised courses, PDPA consent, Thai/English, light/dark.
