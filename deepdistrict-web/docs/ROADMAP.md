# Website roadmap

## Phase 1: local prototype (current)

- [x] Static multi-page site that works from disk
- [x] Design system (tokens, light/dark themes, components) and original artwork
- [x] Official logo integrated, with variants, favicons and share image
- [x] Footer with copyright, trademark notice and legal page (draft)
- [x] Relocated to Bangkok; Thai/English bilingual site with a language switch
- [x] Full curriculum (4 levels, 6 tracks, 33 courses, 8 domain paths) and research pathway
- [x] Content separated into `assets/data/content.js`
- [ ] Review all concept content (course hours, schedules, plans) with the team
- [ ] Have a native Thai editor proofread the Thai copy
- [ ] Replace generated artwork with real photography where available
- [ ] Self-host fonts (`assets/fonts/README.md`)

## Phase 2: go online

- [ ] Register and point **deepdistrict.si** DNS to a static host
      (GitHub Pages, Netlify, Cloudflare Pages or a Thai host). The current folder can be deployed as-is.
- [ ] HTTPS, `robots.txt`, `sitemap.xml`, absolute URLs for the Open Graph image
- [ ] Privacy-friendly analytics, with consent where the PDPA requires it
- [ ] Optionally connect the contact form to a backend or CRM (it currently opens
      the visitor's email app)
- [ ] Legal review of `pages/legal.html`, plus an imprint (company details)

## Phase 3: proper build setup

Move to a static-site generator such as **Astro** or **Eleventy**, using the reserved `src/` folder:

```
src/
├── components/   Header, Footer, Panel, Card, Milestones, Timeline, FormField
├── layouts/      Base page layout (head, header, footer)
├── content/      Markdown/JSON: programs, missions, news, people, pages
└── pages/        index, programs, research, stem, partners, about, contact, news/[slug]
public/           assets (images, fonts, favicon)
```

Benefits: header and footer rendered at build time (no JS needed), per-page SEO,
image optimisation (AVIF/WebP) and a news/publications section from Markdown.

- [ ] Separate URLs per language (`/th/`, `/en/`) with `hreflang` for search engines
- [ ] News & publications, people directory, events calendar
- [ ] Headless CMS so non-developers can edit content
- [ ] Automated checks in CI: HTML validation, link checker, Lighthouse, accessibility (axe)

## Phase 4: platform

- [ ] Enrolment portal with accounts, schedules, payments and progress reports for parents
- [ ] Program results pages and open-data catalogue
- [ ] Learner portfolio pages and a public showcase of research projects
