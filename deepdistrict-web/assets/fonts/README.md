# Fonts (self-hosted)

All typefaces are served from this folder — the site makes **no requests to Google Fonts**
or any other third party, which keeps visitor IP addresses private (PDPA) and lets the
site work fully offline.

| Family | Use | Weights | Licence |
| --- | --- | --- | --- |
| Inter | English body text | 400, 500, 600, 700 | SIL OFL 1.1 |
| Sora | English headings | 500, 600, 700 | SIL OFL 1.1 |
| Michroma | Brand accents | 400 | SIL OFL 1.1 |
| IBM Plex Sans Thai | Thai body text | 400, 500, 600 | SIL OFL 1.1 |
| Anuphan (Cadson Demak) | Thai headings | 500, 600, 700 | SIL OFL 1.1 |

The `@font-face` rules live in `assets/css/fonts.css`. Licence texts are in `licenses/`.
The OFL allows free commercial use, embedding and self-hosting; the fonts may not be
sold on their own.

Files come from the `@fontsource/*` npm packages (v5.3.0), Latin and Thai subsets only.
