# Architecture

## Principles

1. **Runs from disk.** No build step, no `fetch()`, no modules, so `file://` works.
   That is why content is a `.js` file that sets `window.DD_CONTENT` rather than JSON.
2. **One source per concern.** Navigation is in `partials.js`, data in `content.js`,
   and design tokens in `base.css`.
3. **Progressive enhancement.** Pages are readable HTML. JS adds the header, the data
   blocks and the motion. `<html class="no-js">` keeps reveal-animated content visible
   if JS fails.
4. **Accessible by default.** Skip link, landmarks, `aria-current`, keyboard-closable
   menu (Esc), visible focus, `prefers-reduced-motion` support and labelled form fields.

## Page anatomy

Every page follows the same skeleton:

```html
<body class="page-NAME" data-base="../" data-page="NAME">
  <main id="main"> …sections… </main>
  <script src="../assets/data/content.js"></script>
  <script src="../assets/js/partials.js"></script>   <!-- injects header + footer -->
  <script src="../assets/js/main.js"></script>
</body>
```

`data-base` is the relative path to the site root (`""` for `index.html`, `"../"` for
`pages/*`). `data-page` marks the active nav link.

## Bilingual content

Text appears twice: `<span lang="en">` and `<span lang="th">` (or `<p lang="…">`).
`base.css` hides the language that does not match `<html lang>`. `lang-init.js`
sets the language before paint; `main.js` (`setLang`) handles the TH | EN switch,
the document title (`data-title-en` / `data-title-th` on `<body>`), text-only
elements such as `<option data-en data-th>`, and attributes listed in
`data-i18n-attrs` (for example `data-en-placeholder` / `data-th-placeholder`).
Data objects use `{ en, th }`, and the `t()` helper in `main.js` renders both.

## Themes

Sections opt into a colour theme with `theme-light` or `theme-dark`. Both set the same
CSS variables (`--bg`, `--text`, `--text-dim`, `--line`, `--surface`, `--accent`), and
components only read those variables, so any component works on either background.
Image panels (`.panel`) are always dark. The header switches from the white logo to
the full-colour logo when the page scrolls (`.is-solid`).

## Building blocks

| Block | Markup | Notes |
|---|---|---|
| Full-screen panel | `section.panel > .panel__bg > img` + `.panel__content` | Copy bottom-left; `.panel--center` centres it; parallax via JS |
| Plain section | `section.section.theme-light` (`--tint`, `--tight`) | With `.section-head` for title + intro |
| Button | `a.btn` (`--primary`, `--light`, `--sm`) | Pill shape; primary uses the brand gradient |
| Card grid | `.grid.grid--3 > article.card` | Icons from `assets/images/icons/` |
| Data blocks | `[data-render="levels|tracks|courses|domains|research-steps|research-areas|venues|stem-bands|partner-models|audiences|spectrum|stats|marquee"]` | Filled by `main.js` from `content.js` |
| Course catalogue | `[data-course-filters]`, `[data-course-count]`, `[data-render="courses"]` | Filters sync to `?track=&level=&q=` |
| Animations | `canvas[data-neural]`, `[data-typewriter]`, `[data-terminal]`, `.path`, `.spectrum` | Paused off-screen; respect reduced motion |
| Trust pillar | `.pillar` | Icon + title + text |
| Badge | `span.badge` | Small rounded label (footer commitments, hero) |
| Reveal | `.reveal` (`.reveal-delay-1..3`) | Fades in on scroll |
| Contact form | `form[data-mailto-form]` | Validates, then opens the visitor's email app addressed to info@deepdistrict.si |

## Adding a page

1. Generate the shell: `{ tools/page_head.sh "../" NAME "EN title" "TH title" "Description"; cat body.html; tools/page_foot.sh "../"; } > pages/NAME.html`
   (or copy an existing page).
2. Write every text in both languages.
3. Add it to `NAV` in `assets/js/partials.js`.
