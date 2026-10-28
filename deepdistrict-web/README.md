# DeepDistrict.si

Bilingual (Thai / English) website for **DeepDistrict**, a STEM, AI and SI
(Super Intelligence) learning and research lab in **Bangkok, Thailand**.

DeepDistrict does four kinds of work: **teaching** (programming and AI from
foundation to advanced), **teaching research** (from first question to
publication and competition), **research and innovation** (lab research and R&D
with partners) and **youth STEM**. It serves learners, parents, schools and
commercial or industrial partners.

Contact: **info@deepdistrict.si**

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

Then open <http://localhost:8000>. This needs Python 3.

## Pages

| Page | File | Content |
|---|---|---|
| Home | `index.html` | Animated neural-network hero, four kinds of work, AI→SI spectrum, learning path, tracks, Edge AI lab (live terminal), Apple platforms, research pathway, audience tabs, mission |
| Programs | `pages/programs.html` | 4 levels, teaching approach, 6 tracks, **searchable catalogue of 33 courses**, 8 domain paths, formats |
| Research | `pages/research.html` | 8-step research pathway, mentoring model, lab research areas, competitions & publication, integrity |
| Youth STEM | `pages/stem.html` | Age bands 8–18, student journey, information and FAQ for parents |
| Partners | `pages/partners.html` | Partner types, engagement models, example projects, process and trust |
| About SI | `pages/about.html` | Mission/vision/values, what SI is, AI vs SI, principles, learning-to-working path, logo meaning |
| Contact | `pages/contact.html` | info@deepdistrict.si and a form that opens the visitor's email app |
| Legal | `pages/legal.html` | Privacy (PDPA), terms, cookies, accessibility, copyright (draft templates) |

## Thai / English

Every piece of text exists in both languages, side by side:

```html
<h2><span lang="en">Learning path</span><span lang="th">เส้นทางการเรียนรู้</span></h2>
<p lang="en">English paragraph…</p>
<p lang="th">ย่อหน้าภาษาไทย…</p>
```

The **TH | EN** switch in the header sets `<html lang>`, and CSS shows only the
matching language. The choice is remembered. On a first visit, Thai browsers
get Thai and everyone else gets English (`assets/js/lang-init.js`). Data in
`assets/data/content.js` uses `{ en: "...", th: "..." }` objects.

When you edit text, **always update both languages**.

## Folder structure

```
deepdistrict-web/
├── index.html                 Home page
├── pages/                     programs, research, stem, partners, about, contact, legal
├── assets/
│   ├── css/
│   │   ├── main.css           Entry point (imports the files below in order)
│   │   ├── base.css           Brand tokens, level colours, themes, Thai typography, language rules
│   │   ├── layout.css         Header, language switch, drawer, panels, sections, footer
│   │   ├── components.css     Cards, path, course catalogue, spectrum, terminal, tabs, forms…
│   │   └── pages.css          Small page-specific tweaks
│   ├── js/
│   │   ├── lang-init.js       Picks the language before the page paints
│   │   ├── partials.js        Shared header, menu and footer (navigation, copyright)
│   │   └── main.js            Language switch, renderers, filters, animations, contact form
│   ├── data/
│   │   └── content.js         Courses, levels, tracks, domain paths, research steps, partners…
│   ├── images/
│   │   ├── hero/              Bangkok night skyline
│   │   ├── sections/          Edge board, STEM lab, research core, globe, orbit, beam
│   │   ├── brand/             Logo variants, favicons, share image (source/ = master logo)
│   │   └── icons/             Line icons
│   └── fonts/                 Optional self-hosted fonts
├── tools/
│   ├── build_logo.py          Builds all logo variants from the master logo
│   ├── generate_images.py     Regenerates all artwork (procedural SVG)
│   └── page_head.sh / page_foot.sh   Shared page header/footer snippets for new pages
├── src/                       Reserved for the build-step phase (see docs/ROADMAP.md)
├── docs/                      ARCHITECTURE.md, CURRICULUM.md, ROADMAP.md
└── start.sh / start.bat       Local server launchers
```

## Common edits

- **Courses, levels, tracks, domain paths, research steps, partner models:**
  `assets/data/content.js`. Pages, filters and counters update automatically.
- **Navigation, footer, email, copyright:** `assets/js/partials.js`.
- **Colours** (brand and the four level colours): top of `assets/css/base.css`.
- **Logo:** replace `assets/images/brand/source/logo-original.webp`, then run
  `python3 tools/build_logo.py` (requires Pillow).
- **Artwork:** `python3 tools/generate_images.py`, or replace a file with a real
  photo of the same name.

## Animations

A live neural-network canvas in the hero reacts to the pointer, alongside a
typewriter, a learning path that draws itself, an AI→SI spectrum that fills on
scroll, a self-typing Jetson terminal, a technology marquee, counters and
scroll reveals. All animations pause off-screen and respect the visitor's
"reduce motion" setting.

## Notes

- Course hours, schedules and plans are **indicative concept content**: review
  them before publishing. The legal page is a draft for review by a Thai legal adviser.
- Competitions such as the Swift Student Challenge, NSC, YSC, ISEF and WRO are
  listed as events DeepDistrict *prepares learners for*; it is not their organiser.
- Third-party trademarks are acknowledged in the footer; no affiliation is implied.
