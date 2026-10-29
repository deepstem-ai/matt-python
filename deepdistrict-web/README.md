# DeepDistrict.si

Bilingual (Thai / English) website for **DeepDistrict**, a **Super Intelligence (SI)**
learning and research lab in **Bangkok, Thailand**. Contact: **info@deepdistrict.si**.

DeepDistrict teaches programming and AI from foundation to advanced, mentors research
from topic to publication, runs youth STEM programmes and works with schools and
industry. Every course is **personalised** and offered **live on Zoom, onsite or hybrid**.

Plain HTML, CSS and JavaScript. No build step and no dependencies. Works from disk.

**Version 4.6 r1** (see `VERSION` and `CHANGELOG.md`).

## Run it on your computer

**Website only:** double-click `index.html`.

**Website + back office / learner portal (sign-in):** requires Python 3, nothing else.

```bash
./start.sh            # macOS / Linux  → http://localhost:8000  and  /admin/
```

```bat
start.bat             :: Windows
```

See `admin/README.md` (features) and `server/DEPLOY.md` (LAN use and free hosting later).

## Pages

| Page | File | Highlights |
|---|---|---|
| Home | `index.html` | Neural-network hero, what SI is (animated SI orb, Bostrom definition), interactive AI↔SI comparison, "Isn't today's AI enough?", personalisation flow, study modes, learning path, Innovation Lab, tracks, audiences |
| What is SI? | `pages/si.html` | Definition, SI in plain words, "Isn't today's AI enough?", why start now, AI vs SI toggle, ladder from narrow AI to SI, building blocks mapped to courses, our stance, myth/fact flip cards, FAQ |
| Admissions (branch) | `pages/admissions.html` | IELTS, SAT Math, SAT Reading & Writing (EBRW), TBAT (replaces BMAT), CU-AAT Math & Verbal and portfolio prep: goal chooser, test explorer with official links and a "checked on" date, portfolio, method, M.4–M.6 timeline, FAQ, "ask us for the latest update" notice. Data: `assets/data/admissions.js` |
| Programs | `pages/programs.html` | How personalisation works, Zoom/onsite/hybrid, **plan builder**, learning path, **catalogue of 68 courses in 6 groups and 10 tracks, with 12 new-era picks and a details dialog for each**, **COMPAS / HKICO exam prep with TCAS70 info**, the **Plan · Edge · Trace · Test** exam method, "ask about an unlisted course", domain paths, FAQ |
| Innovation Lab | `pages/innovation.html` | Fully personalised course: from finding a topic to publication or competition |
| Research | `pages/research.html` | Why STEM + SI research matters, projects by field (publish · present · compete), research pathway, mentoring model, lab research areas, venues, integrity |
| Youth STEM | `pages/stem.html` | Six future skills, ages 8–18, student journey, information for parents |
| Partners | `pages/partners.html` | Partner types, engagement models, example projects |
| About | `pages/about.html` | Mission, vision, values, SI teaser, principles, learning-to-working path, logo meaning |
| Contact | `pages/contact.html` | Form with required PDPA consent on every submission; prefilled from course and plan links |
| Back office & portal | `admin/index.html` (via `start.sh`) | Sign-in for admins, teachers, students and parents; hours total/learned/remaining/booked/to schedule; move lessons with make-ups; change requests; payments; calendar (.ics); reports as PDF / PNG / TXT / CSV; notifications in the app, by email and LINE; installable on phones — see `admin/README.md` |
| Legal | `pages/legal.html` | PDPA privacy notice, cookie and storage table, terms, accessibility, copyright |

## Key features

- **Thai / English switch:** every text is written in both languages.
- **Light / dark theme:** the header button switches light ↔ dark (animated circular reveal); the
  footer has *System · Light · Dark*. With no saved choice the site follows the operating system.
- **Self-hosted fonts:** Inter, Sora, Michroma, IBM Plex Sans Thai and Anuphan (all SIL OFL) in
  `assets/fonts/` — no Google Fonts requests.
- **Contact form:** opens the visitor's email app by default; set an endpoint in
  `assets/js/config.js` (e.g. Web3Forms, Formspree or your own server) to send directly, with an
  automatic email-app fallback.
- **PDPA consent:** a small, friendly card (*OK, remember* / *No thanks* / *Details*). The settings
  dialog lists only what is actually used (essential + remembered settings); analytics or marketing
  switches appear automatically once such scripts are added. Each choice is recorded with an ID,
  date and policy version. Visitors are asked again when the policy version changes or after
  12 months, and can reopen the settings from **Cookie settings** in the footer. Language and
  theme are remembered across visits only with *preferences* consent. The contact form asks
  for consent every time it is sent.
- **Personalised courses:** a five-step process, a list of what can be customised, an
  interactive plan builder, and "Customise this course" / "Ask about this course" buttons on
  every course.
- **Modern animation:** a live neural network that follows the pointer, word-by-word headline
  reveals, an orbiting SI orb, an AI→SI morph, ladder and path drawing, a self-typing Jetson
  terminal, cursor spotlight and 3D tilt on cards, magnetic buttons, a scroll-progress bar, an
  animated gradient footer and page transitions. Animations pause off-screen and respect
  "reduce motion".

## Folder structure

```
deepdistrict-web/
├── index.html
├── pages/                     si, programs, innovation, research, stem, partners, about, contact, legal
├── admin/                     Back office & learner portal (see admin/README.md)
├── server/                    Python server: API, sign-in, SQLite data (see server/DEPLOY.md)
├── assets/
│   ├── css/
│   │   ├── main.css           Imports the files below in order
│   │   ├── fonts.css          Self-hosted @font-face rules
│   │   ├── tokens.css         Colours, light/dark theme tokens, level colours, fonts, spacing
│   │   ├── base.css           Reset, typography, Thai/English rules, accessibility
│   │   ├── layout.css         Header, toggles, drawer, panels, sections, footer
│   │   ├── components.css     Cards, catalogue, dialog, planner, SI widgets, forms, consent UI…
│   │   └── effects.css        Reveals, word animation, aurora, transitions
│   ├── js/
│   │   ├── prefs.js           (in <head>) language + theme before paint, consent-aware, site version
│   │   ├── config.js          Contact-form endpoint (empty = email app)
│   │   ├── partials.js        Shared header and footer
│   │   ├── consent.js         PDPA consent banner/settings, consent-aware storage, script gating
│   │   ├── app.js             Language/theme switching, renderers, catalogue, course dialog, planner, forms
│   │   └── effects.js         Neural canvas, typewriter, terminal, reveals, spotlight, tilt, progress
│   ├── data/
│   │   ├── content.js         Levels, tracks, course catalogue, domains, research, partners, audiences
│   │   ├── courses-details.js Modules, outcomes, prerequisites, projects and modes for every course
│   │   ├── courses-more.js    v4 tracks/courses (AI Co-Engineering, exams, NVIDIA, Jetson, Pi 5, UNO Q…) + notices
│   │   ├── admissions.js      Admissions branch: IELTS, SAT, TBAT, CU-AAT, portfolio (tests, chooser, FAQ)
│   │   ├── catalogue.js       course groups, new-era picks, v4.6 courses (check with tools/check_catalogue.js)
│   │   ├── insights.js        SI in plain words, why start, research by field, future skills, exam method, COMPAS/TCAS
│   │   └── si.js              SI explainer data, personalisation steps, plan-builder rules
│   ├── fonts/                 woff2 files + licences (OFL)
│   └── images/                hero/, sections/, brand/ (logo variants; source/ = master), icons/, photos/ (drop-in guide)
├── tools/
│   ├── build_logo.py          Logo variants from the master logo (needs Pillow)
│   ├── generate_images.py     All artwork and icons (procedural SVG)
│   ├── build_curriculum_doc.py  docs/CURRICULUM.md from the data (needs Node.js)
│   └── page_head.sh / page_foot.sh   Shared page shell for new pages
├── docs/                      ARCHITECTURE.md, CURRICULUM.md, ROADMAP.md
└── start.sh / start.bat
```

## Common edits

- **Courses:** edit `assets/data/content.js` (catalogue) and `assets/data/courses-details.js`
  (details), then run `python3 tools/build_curriculum_doc.py`.
- **SI explainer, personalisation, plan builder:** `assets/data/si.js`.
- **Navigation, footer, email:** `assets/js/partials.js`.
- **Colours, light/dark themes:** `assets/css/tokens.css`.
- **Cookie policy change:** update `pages/legal.html`, then increase `CONSENT_VERSION` in
  `assets/js/prefs.js` so that every visitor is asked again.
- **Adding analytics later:** add it as
  `<script type="text/plain" data-consent="analytics" data-src="…"></script>`. It runs only after consent.

Always update **both languages** when you change text.

## Before publishing

- Review course hours, fees and schedules (they are indicative), and have the Thai copy proofread.
- Have a Thai legal adviser review `pages/legal.html`.
- Decide how the contact form sends (`assets/js/config.js`) and name the provider in the privacy notice.
- Confirm COMPAS / TCAS70 criteria against the official Chulalongkorn announcement each year.
- Replace illustrations with licensed or own photos if wanted (see `assets/images/photos/README.md`).
- Competitions are listed as events learners are *prepared for*; DeepDistrict is not their organiser.
