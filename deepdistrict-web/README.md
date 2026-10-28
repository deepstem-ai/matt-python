# DeepDistrict.si

Website for **DeepDistrict.si**, a research, innovation and academic hub for
**SI (Super Intelligence)** in Slovenia. The design takes its cues from mission-control
style sites: full-screen imagery, bold condensed type, outlined buttons and a
"mission manifest" of milestones.

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
| Home | `index.html` | Hero, SI concept, research, Academy, stats, innovation, mission manifest, regional nodes, CTA |
| Research | `pages/research.html` | 9 programs with filter tabs, method, facilities |
| Academy | `pages/academy.html` | 4 fellowship tracks, fellow journey, FAQ |
| Innovation | `pages/innovation.html` | Launch sequence (4 stages), partner types, pitch CTA |
| Mission | `pages/mission.html` | SI definition, AI vs SI, 6 principles, roadmap to 2035 |
| Join | `pages/join.html` | Application form (saved locally for now), contacts |

## Folder structure

```
deepdistrict-web/
├── index.html                 Home page
├── pages/                     Sub-pages (research, academy, innovation, mission, join)
├── assets/
│   ├── css/
│   │   ├── main.css           Entry point (imports the files below in order)
│   │   ├── base.css           Design tokens (colours, type, spacing), reset
│   │   ├── layout.css         Header, menu drawer, full-screen panels, footer
│   │   ├── components.css     Buttons, cards, stats, manifest, timeline, forms…
│   │   └── pages.css          Small page-specific tweaks
│   ├── js/
│   │   ├── partials.js        Shared header / menu / footer (navigation lives here)
│   │   └── main.js            Interactions: menu, scroll effects, counters, filters, forms
│   ├── data/
│   │   └── content.js         Programs, missions, nodes, roadmap, stats, ticker
│   ├── images/
│   │   ├── hero/              Full-screen hero artwork
│   │   ├── sections/          Section backgrounds
│   │   ├── brand/             Logo mark, full logo, favicon
│   │   └── icons/             Line icons for cards
│   └── fonts/                 Optional self-hosted fonts (see README inside)
├── tools/
│   └── generate_images.py     Regenerates all artwork (procedural SVG)
├── src/                       Reserved for the build-step phase (see docs/ROADMAP.md)
├── docs/
│   ├── ARCHITECTURE.md        How the site is built and how to edit it
│   └── ROADMAP.md             Plan for taking the site online
├── start.sh / start.bat       Local server launchers
└── README.md
```

## Common edits

- **Text and milestones:** edit `assets/data/content.js` for programs, missions,
  regional nodes, roadmap, stats and ticker. Other copy is in the HTML pages.
- **Navigation:** edit the `NAV` list in `assets/js/partials.js`. It applies to every page.
- **Colours and fonts:** edit the variables at the top of `assets/css/base.css`.
- **Images:** replace any file in `assets/images/` and keep the same name, for
  example a real photo saved as `hero/alps-night.jpg` (then update the `src`).
  To regenerate the built-in artwork, run `python3 tools/generate_images.py`.

## Notes

- The application form validates input and saves submissions to the browser's
  `localStorage` only. Nothing is sent anywhere until a backend is connected
  (see `docs/ROADMAP.md`).
- Programs, dates and numbers are **concept content**. Review and replace them
  before publishing.
