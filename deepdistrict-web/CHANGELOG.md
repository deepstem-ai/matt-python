# Changelog

## 4.8 r1 — October 2026
- **Short course summary on click:**
  - Each summary has the course in one line, a few key facts and a short list of what you
    will learn.
  - Key facts: **approximate length as a range** (hours and weeks; it depends on level and
    pace), level and starting point, and how you can study.
  - Then what you'll be able to do and the final project.
  - A **"Want the details? Contact our staff."** box links to the contact form and email,
    plus phone and LINE once they are set in `assets/js/config.js` → `contact`.
- **Standard-test courses** also show "About the test", checked October 2026:
  - what the test measures and its format
  - a table of **where you can use it** (university · faculty/programme · admission round),
    e.g. TBAT → Chula Medicine and Dentistry and Khon Kaen Medicine, TCAS70 Round 1 Portfolio
  - **how long the result lasts**
  - **which score for which target**, e.g. IELTS 6.0–7.5 for TU/Chula BBA, Melbourne and the
    UK; SAT/CU-AAT minimums for Chula ISE, BBA and BBTECH; TBAT/CU-AAT for Chula Dentistry;
    COMPAS pass and AWARD rules; POSN camps and quotas
  - each with a note to ask our staff for the current announcement, and the official site
- **Essential foundations** (PY101, AI100, MTH110, DSA210, WEB101, SQL120, GIT110, SCR090) are
  shown right after the new-era picks.
- **Programs page simplified** from 11 sections to 6:
  - hero → catalogue → how we teach → study modes → plan builder → FAQ
  - the catalogue overview is now a compact directory of all courses by group, not 18 big
    cards; the format filter is removed
  - COMPAS/HKICO exams and the exam method moved to the Admissions page; domain paths moved
    to the Research page
- Fix: switching theme during a page change no longer throws an unhandled error.
- `tools/check_catalogue.js` also checks that every test-prep course has complete test
  information.

## 4.7 r1 — October 2026
- **Cookie consent bar (PDPA):**
  - A full-width bar at the bottom of the screen with a clear explanation, a link to the
    cookie policy, and **Cookie Settings · Reject All · Accept All**. Reject All and Accept All
    look identical, so refusing is as easy as agreeing.
  - Nothing is pre-selected, and the site stays usable behind the bar (no cookie wall).
  - Shown at the **start of every visit, on whichever page the visitor lands**, with the
    current choice. It is not asked again on later pages of the same visit.
  - The settings dialog also has Reject All / Accept All / Save my choices. Withdrawal is
    always available from "Cookies" in the footer.
- **Proof of consent:**
  - Every choice is logged on the server (`POST /api/consent`, table `consent_log`): a random
    reference, the time, the policy version and the choices. No name, email or IP address.
  - Records are deleted after 3 years.
  - Admins can download the log as CSV in Settings → Cookie consent records. "Erase all
    data" clears it.
- Consent policy version is now 5, so everyone is asked again. The privacy page and cookie
  table are updated.

## 4.6 r2 — October 2026
- **Always the current version in the browser.**
  - Every stylesheet and script link carries `?v=<version>`, so browsers cannot keep showing an
    older release from cache.
  - `tools/set_version.py "x.y rN"` updates VERSION, the footer and all links in one step.
- **Start-up fixes.**
  - `start.sh` / `start.bat` used to open the browser before the server started. If an older
    DeepDistrict was still running on port 8000, the browser showed that old site.
  - Now the server opens the browser itself, once it is listening.
  - If 8000 is busy, it says so and uses the next free port (8001, …).
  - On Windows a second server can no longer share the same port.
  - The start-up message and `/api/status` show the version.

## 4.6 r1 — October 2026
- **Course groups** above tracks, used in the catalogue, the home page and the back office:
  - Foundation Programming
  - Software & App Development
  - AI & Data Science
  - Hardware, Robotics & Edge AI
  - Research & Innovation
  - Standard Tests & Admissions
- **12 new-era picks**, shown first on the home page and in the catalogue (★ filter):
  - Vibe Coding (ACE110), AI agents for code (ACE220)
  - STEM AI on Raspberry Pi 5 (EDG220), frontier AI agents (SI410)
  - Swift & SwiftUI Playgrounds (SWF110), Swift Student Challenge (SSC250)
  - Apple Intelligence & on-device AI (IOS340), Apple Vision Pro & visionOS (VOS350)
  - Innovation Lab (INNO), competitions (RES330)
  - POSN computer olympiad (EXM230), COMPAS-PY1 (EXM210)
- **11 new courses** and a new track, "Cloud, Security & DevOps":
  - SCR090 Scratch & creative coding, CP230 competitive programming
  - SQL120 databases & SQL, GEN120 generative AI for students, RL340 reinforcement learning
  - SEC220 cybersecurity & CTF, CLD230 cloud/Linux/DevOps
  - INN120 design thinking, ENT230 tech entrepreneurship
  - EXM230 POSN (สอวน.) prep, VOS350 Apple Vision Pro & visionOS
- **Updated courses**:
  - ACE110 is now "Vibe Coding: Build Real Apps with AI"
  - SWF110 is now "Swift & SwiftUI Playgrounds"
  - IOS340 now covers Apple's Foundation Models framework, the Vision framework and Core ML
  - the Apple track covers Apple Intelligence and visionOS
  - the plan builder suggests the new courses
- **Catalogue**:
  - The overview groups the courses: the picks first, then each group.
  - Group chips lead to that group's track chips.
  - Links such as `?group=` and `?track=` select the right group.
- **Back office**:
  - The Courses page shows one table per group.
  - Course drop-downs are grouped.
  - Custom courses have a "Group" field, saved in the database (records without one show
    under "Other / custom").
- `tools/check_catalogue.js` checks every course, track, group and course-code reference.

## 4.5 r1 — October 2026
- New branch **DeepDistrict Admissions** (`pages/admissions.html`): preparation for IELTS
  Academic, Digital SAT Math, Digital SAT Reading & Writing (EBRW), **TBAT**, CU-AAT Math and
  CU-AAT Verbal, plus an admissions portfolio, personal statement and interview course.
  - Test explorer: format, timing, scoring, key facts, official links, and the date the facts
    were checked.
  - "Where are you applying?" chooser: Thai international programmes, Thai international
    medicine & health, UK/Europe/Australia, US.
  - A note that the BMAT was discontinued and replaced by the TBAT, the portfolio building
    blocks, a 6-step method, an M.4–M.6 timeline and an FAQ.
  - A prominent **"rules change fast, ask us for the latest update"** notice, also shown in
    every course dialog in this branch.
  - New track and 7 courses (IEL200, SAT210, SAT220, TBT300, AAT210, AAT220, PFL200), also
    available for enrolments in the back office.
  - New contact topic "Admissions & test prep"; the request is pre-filled with the chosen goal
    and courses.
- **Cookie consent (PDPA)**:
  - The home page asks on every visit (once per browser session) and shows the current choice.
  - "No thanks" and "OK" now look the same; nothing is pre-selected.
  - Policy version raised to 4, so everyone is asked again.
  - Cookie policy updated: the session flag, free choice, withdrawal, and children under 10.
- Header: the menu collapses below 1300 px and the header button shows from 1640 px, so the
  navigation never overflows.

## 4.4 r1 — October 2026
- **Notifications** in the app (bell + inbox), by **email** and by **LINE Official Account**
  (free plan): enrolment & schedule, receipt, new request (admins), request decided, lesson
  moved/cancelled, lesson completed with hours left, reminder the day before, hours running low.
- Personal settings: topics, channels, Thai/English. **Connect LINE** with a 6-digit code; the
  LINE chat answers "schedule" and "hours" for free.
- Admin: topics on/off, reminder time, monthly LINE limit with usage meter (several messages to
  one person are grouped into one push), LINE setup, test message, sent log, a timer link for
  hosts without background jobs.
- **Installable app (PWA)** for Android and iPhone: manifest, app icons, offline app shell,
  bottom tab bar on phones. No app store needed.
- New transparent **horizon logo** (`logo-horizon*.png`) for dark and light backgrounds.
- Plan for posting news from the portal: `docs/NEWS-POSTING-PLAN.md`.

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
