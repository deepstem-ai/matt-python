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

## Building blocks

| Block | Markup | Notes |
|---|---|---|
| Full-screen panel | `section.panel > .panel__bg > img` + `.panel__content` | Copy bottom-left; `.panel--center` centres it; parallax via JS |
| Plain section | `section.section` (`--alt`, `--line`) | With `.section-head` for title + intro |
| Button | `a.btn` (`--accent`, `--solid`, `--sm`) | Fills from the bottom on hover |
| Card grid | `.grid.grid--3 > article.card` | Icons from `assets/images/icons/` |
| Data blocks | `[data-render="stats|missions|nodes|programs|roadmap|ticker"]` | Filled by `main.js` from `content.js` |
| Reveal | `.reveal` (`.reveal-delay-1..3`) | Fades in on scroll |
| Local form | `form[data-local-form="name"]` | Validates and saves to `localStorage` |

## Adding a page

1. Copy `pages/academy.html` and rename it.
2. Change `<title>`, the meta description, `class="page-…"` and `data-page`.
3. Add it to `NAV` in `assets/js/partials.js`.
