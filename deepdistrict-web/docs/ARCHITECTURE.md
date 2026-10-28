# Architecture

## Principles

1. **Runs from disk.** No build step and no `fetch()`. Data files are `.js` files that extend `window.DD_CONTENT`.
2. **Bilingual everywhere.** Every text exists as `lang="en"` and `lang="th"`, and CSS shows the active one.
3. **Themeable.** All colours come from tokens in `tokens.css`. Light is the default, and
   `[data-theme="dark"]` switches. `.tone-deep`, `.panel` and `.has-bg` are dark in both themes.
4. **Privacy by design.** Nothing optional is stored or loaded without PDPA consent (`consent.js`).
5. **Accessible motion.** Animations are progressive, pause off-screen and respect `prefers-reduced-motion`.

## Script order

```html
<head>  <script src="assets/js/prefs.js"></script>   <!-- lang + theme before paint -->
…
<script src="assets/data/content.js"></script>
<script src="assets/data/courses-details.js"></script>
<script src="assets/data/si.js"></script>
<script src="assets/js/partials.js"></script>    <!-- header + footer -->
<script src="assets/js/consent.js"></script>     <!-- banner, settings, DD.store, DD.consent -->
<script src="assets/js/app.js"></script>         <!-- renderers, catalogue, dialog, planner, forms -->
<script src="assets/js/effects.js"></script>     <!-- animations; runs last so it sees rendered content -->
```

`tools/page_head.sh` and `tools/page_foot.sh` print this shell for new pages.

## Consent (PDPA)

- Record in `localStorage["dd-consent"]`: `{ v, id, at, expires, choices: { necessary, preferences, analytics, marketing } }`.
- It is invalid when `v !== CONSENT_VERSION` (in `prefs.js`) or after `expires` (12 months), and then the banner shows again.
- `DD.store.get/set` writes to `localStorage` only with *preferences* consent; otherwise to `sessionStorage`.
- `DD.consent.has(cat)`, `DD.consent.open()` and `DD.consent.onChange(fn)`; `[data-open-consent]` opens the settings.
- Gated scripts: `<script type="text/plain" data-consent="analytics" data-src="…">` are activated after consent.
- Forms: `form[data-mailto-form]` requires every `.check input[required]` on each submission, adds a
  consent line (timestamp, policy version) to the email, and unticks the boxes afterwards.

## Rendering

`app.js` fills `[data-render="…"]` elements from the data:

| data-render | Source |
|---|---|
| `levels` (`data-compact`), `tracks`, `courses`, `domains` | `levels`, `tracks`, `courses`, `domains` |
| `planner` | `planner` (`si.js`) |
| `flow` (`data-source="personalSteps"`), `custom-options`, `modes` | `si.js`, `courses-details.js` |
| `si-compare`, `si-ladder`, `si-blocks`, `si-myths`, `faq` (`data-source="siFaq"`) | `si.js` |
| `research-steps`, `research-areas`, `venues`, `stem-bands`, `partner-models`, `audiences`, `stats`, `marquee` | `content.js` |

Any element with `data-course="CODE"` opens that course's details dialog, and
`programs.html#course-CODE` opens it on load. Contact links pass `?topic=&course=&plan=`,
which prefill the contact form.

## Effects (`effects.js` / `effects.css`)

`[data-split]` gives a word-by-word heading reveal, and `.reveal` fades in on scroll.
`.path`, `.flow` and `.ladder` draw themselves, and `[data-count]` animates counters.
`canvas[data-neural]` is the neural network, with `[data-typewriter]` and `[data-terminal]`
alongside. Pointer effects: `.card` spotlight, `[data-tilt]` 3D tilt, `[data-magnetic]`
buttons and the `[data-glow]` footer CTA. Also included: the scroll-progress bar,
`@view-transition` page transitions and the circular theme reveal (`html.theme-anim`).

## Adding a page

```bash
{ tools/page_head.sh "../" NAME "EN title" "TH title" "Description"; cat body.html; tools/page_foot.sh "../"; } > pages/NAME.html
```

Write every text in both languages, then add the page to `NAV` in `assets/js/partials.js`.
