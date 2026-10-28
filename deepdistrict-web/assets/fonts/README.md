# Fonts

The site loads **Barlow** and **Barlow Condensed** from Google Fonts when online and
falls back to system fonts offline (Helvetica / Arial).

To work fully offline with the brand fonts, download the `.woff2` files
(OFL licence) into this folder and add `@font-face` rules at the top of
`assets/css/base.css`, then remove the Google Fonts `<link>` tags from the pages.
