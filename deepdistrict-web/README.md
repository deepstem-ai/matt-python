# DeepDistrict.si

Website for **DeepDistrict.si**, a research, innovation and academic hub for
**SI (Super Intelligence)**, built in Slovenia and open to the world.

The design follows the DeepDistrict logo: deep navy, electric blue and a cyan
"orbit" highlight. Immersive full-screen imagery alternates with clean light
sections, using rounded components and modern type (Sora, Inter, and Michroma
to echo the wordmark).

Plain HTML, CSS and JavaScript. No build step and no dependencies.

## Run it on your computer

**Option 1: open the file.** Double-click `index.html`. Everything works from disk.

**Option 2: local server** (closer to real hosting):

```bash
./start.sh            # macOS / Linux
```

```bat
start.bat             :: Windows
```

Then open <http://localhost:8000>. This requires Python 3 to be installed.

## Pages

| Page | File | Content |
|---|---|---|
| Home | `index.html` | Hero, SI statement, pillars, research, stats, Academy, global reach, innovation, milestones, trust, regional nodes, CTA |
| Research | `pages/research.html` | 9 programs with filter tabs, method, facilities |
| Academy | `pages/academy.html` | 4 fellowship tracks, fellow journey, FAQ |
| Innovation | `pages/innovation.html` | Idea-to-impact process (4 stages), partner types, pitch CTA |
| Mission | `pages/mission.html` | SI definition, AI vs SI, logo meaning, 6 principles, roadmap to 2035 |
| Join | `pages/join.html` | Application form (saved locally for now), contacts |
| Legal | `pages/legal.html` | Privacy, terms, cookies, accessibility, copyright (draft templates) |

## Folder structure

```
deepdistrict-web/
├── index.html                 Home page
├── pages/                     Sub-pages (research, academy, innovation, mission, join, legal)
├── assets/
│   ├── css/
│   │   ├── main.css           Entry point (imports the files below in order)
│   │   ├── base.css           Design tokens (colours, type, spacing), reset
│   │   ├── layout.css         Header, menu drawer, full-screen panels, footer
│   │   ├── components.css     Buttons, cards, stats, milestones, timeline, forms…
│   │   └── pages.css          Small page-specific tweaks
│   ├── js/
│   │   ├── partials.js        Shared header / menu / footer (navigation lives here)
│   │   └── main.js            Interactions: menu, scroll effects, counters, filters, forms
│   ├── data/
│   │   └── content.js         Programs, milestones, nodes, roadmap, stats, ticker
│   ├── images/
│   │   ├── hero/              Full-screen hero artwork
│   │   ├── sections/          Section backgrounds
│   │   ├── brand/             Logo variants (PNG), favicons, share image, swoosh
│   │   │   └── source/        Master logo file — edit this, then run tools/build_logo.py
│   │   └── icons/             Line icons for cards
│   └── fonts/                 Optional self-hosted fonts (see README inside)
├── tools/
│   ├── build_logo.py          Builds all logo variants from the master logo
│   └── generate_images.py     Regenerates all artwork (procedural SVG)
├── src/                       Reserved for the build-step phase (see docs/ROADMAP.md)
├── docs/
│   ├── ARCHITECTURE.md        How the site is built and how to edit it
│   └── ROADMAP.md             Plan for taking the site online
├── start.sh / start.bat       Local server launchers
└── README.md
```

## Brand & logo

The master logo is `assets/images/brand/source/logo-original.webp`. Run

```bash
python3 tools/build_logo.py
```

to rebuild every variant (requires Pillow: `pip install pillow`):

| File | Use |
|---|---|
| `logo-horizontal-white.png` | Header over dark imagery |
| `logo-horizontal.png` | Header once scrolled (white bar) |
| `logo-stacked.png` / `logo-stacked-white.png` | Light / dark backgrounds (footer, brand section) |
| `logo-mark.png` / `logo-mark-light.png` | Symbol only |
| `favicon-32.png`, `favicon-192.png`, `apple-touch-icon.png` | Browser and phone icons |
| `og-image.png` | Link preview when the site is shared |

Brand colours are defined at the top of `assets/css/base.css`
(`--navy-800` #071a4d, `--blue-500` #1f6fff, `--cyan-400` #3fd0ff).

## Common edits

- **Text and milestones:** edit `assets/data/content.js` for programs, milestones,
  regional nodes, roadmap, stats and ticker. Other copy is in the HTML pages.
- **Navigation, footer links and copyright:** edit `assets/js/partials.js`
  (`NAV`, `FOOTER_COLS`, `TRUST`, `ORG`, `FOUNDED`). It applies to every page.
- **Colours and fonts:** edit the variables at the top of `assets/css/base.css`.
- **Images:** replace any file in `assets/images/` and keep the same name, for
  example a real photo saved as `hero/alps-night.jpg` (then update the `src`).
  To regenerate the built-in artwork, run `python3 tools/generate_images.py`.

## Notes

- The application form validates input and saves submissions to the browser's
  `localStorage` only. Nothing is sent anywhere until a backend is connected
  (see `docs/ROADMAP.md`).
- The newsletter sign-up in the footer is also stored locally only.
- Programs, dates, numbers, email addresses and the legal page are **concept
  content and templates**. Review them (the legal texts with a qualified adviser)
  before publishing.
