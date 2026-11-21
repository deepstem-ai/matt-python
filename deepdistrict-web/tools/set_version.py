#!/usr/bin/env python3
"""Set the release version everywhere and stamp it on every local CSS/JS link.

    python3 tools/set_version.py "4.6 r2"

Writes VERSION, the footer version (assets/js/prefs.js) and adds ?v=<version> to the
stylesheets and scripts in every HTML page and in main.css, so browsers always load the
files of the current release instead of an older cached copy.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def main():
    if len(sys.argv) != 2 or not re.fullmatch(r"\d+\.\d+ r\d+", sys.argv[1]):
        sys.exit('usage: python3 tools/set_version.py "4.6 r2"')
    version = sys.argv[1]
    tag = version.replace(" ", "")                      # "4.6r2"
    (ROOT / "VERSION").write_text(version + "\n", encoding="utf-8")

    prefs = ROOT / "assets/js/prefs.js"
    prefs.write_text(re.sub(r'SITE_VERSION: "[^"]*"', f'SITE_VERSION: "{version}"', prefs.read_text(encoding="utf-8")), encoding="utf-8")

    link = re.compile(r'((?:src|href)=")((?:\.\./)?(?:assets|css|js|vendor)/[^"?#]+\.(?:js|css))(?:\?v=[^"]*)?(")')
    pages = [ROOT / "index.html", ROOT / "admin/index.html", ROOT / "admin/exam.html", ROOT / "admin/live.html", *sorted((ROOT / "pages").glob("*.html"))]
    for p in pages:
        text = p.read_text(encoding="utf-8")
        new = link.sub(lambda m: f"{m.group(1)}{m.group(2)}?v={tag}{m.group(3)}", text)
        if new != text:
            p.write_text(new, encoding="utf-8")

    css = ROOT / "assets/css/main.css"
    css.write_text(re.sub(r'@import url\("([^"?]+\.css)(?:\?v=[^"]*)?"\)', lambda m: f'@import url("{m.group(1)}?v={tag}")', css.read_text(encoding="utf-8")), encoding="utf-8")
    print(f"Version {version}: VERSION, footer and {len(pages)} pages stamped with ?v={tag}")


if __name__ == "__main__":
    main()
