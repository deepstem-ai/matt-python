# Website roadmap

## Phase 1: local prototype (current)

- [x] Static multi-page site that works from disk
- [x] Design system (tokens, components) and original artwork
- [x] Content separated into `assets/data/content.js`
- [ ] Review all concept content (programs, dates, numbers, emails) with the team
- [ ] Replace generated artwork with real photography where available
- [ ] Self-host fonts (`assets/fonts/README.md`)

## Phase 2: go online

- [ ] Register and point **deepdistrict.si** DNS to a static host
      (GitHub Pages, Netlify, Cloudflare Pages or a Slovenian host). The current folder can be deployed as-is.
- [ ] HTTPS, `robots.txt`, `sitemap.xml`, a raster Open Graph image (1200×630 PNG)
- [ ] Privacy-friendly analytics and a cookie notice if required (GDPR)
- [ ] Connect the Join form to a backend (form service, serverless function or CRM)
      and remove the `localStorage` fallback in `main.js`
- [ ] Privacy policy and imprint pages

## Phase 3: proper build setup

Move to a static-site generator such as **Astro** or **Eleventy**, using the reserved `src/` folder:

```
src/
├── components/   Header, Footer, Panel, Card, Manifest, Timeline, FormField
├── layouts/      Base page layout (head, header, footer)
├── content/      Markdown/JSON: programs, missions, news, people, pages
└── pages/        index, research, academy, innovation, mission, join, news/[slug]
public/           assets (images, fonts, favicon)
```

Benefits: header and footer rendered at build time (no JS needed), per-page SEO,
image optimisation (AVIF/WebP) and a news/publications section from Markdown.

- [ ] Bilingual site: Slovenian (`/sl/`) as primary, English (`/en/`)
- [ ] News & publications, people directory, events calendar
- [ ] Headless CMS so non-developers can edit content
- [ ] Automated checks in CI: HTML validation, link checker, Lighthouse, accessibility (axe)

## Phase 4: platform

- [ ] Academy application portal with accounts and review workflow
- [ ] Program results pages and open-data catalogue
- [ ] Live dashboards (for example the Alpine Climate Twin)
