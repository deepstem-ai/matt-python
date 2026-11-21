"""Cover images for blog posts: AI drawings (SVG, cleaned here) and free-licence photos (Openverse).

* draw  — Claude draws a flat vector illustration; the SVG is parsed and rebuilt from an allow-list
          (no scripts, links, external files or event handlers) and stored as a data URL.
* photo — search Openverse (openverse.org, the WordPress/Creative Commons open media index, which
          includes Wikimedia Commons and Flickr CC) for images whose licence allows commercial use,
          download one (≤ 1.5 MB) and keep its credit line: title, creator, licence and source link.
"""

import base64
import json
import os
import re
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

MAX_SVG = 80_000
MAX_PHOTO = 1_400_000
OPENVERSE = os.environ.get("DD_OPENVERSE", "https://api.openverse.org/v1/images/")
HTTP_OK = os.environ.get("DD_IMG_HTTP") == "1"      # tests only: allow plain http image hosts
LICENSES = ("cc0", "pdm", "by", "by-sa")          # allow commercial use; we always show the credit
UA = "DeepDistrictBlog/1.0 (+https://deepdistrict.si)"

SVG_NS = "http://www.w3.org/2000/svg"
TAGS = {"svg", "g", "path", "rect", "circle", "ellipse", "line", "polyline", "polygon", "text", "tspan", "defs",
        "lineargradient", "radialgradient", "stop", "title", "desc", "clippath"}
ATTRS = {"viewbox", "width", "height", "x", "y", "x1", "y1", "x2", "y2", "cx", "cy", "r", "rx", "ry", "d", "points",
         "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "stroke-dasharray", "opacity", "fill-opacity",
         "stroke-opacity", "transform", "id", "offset", "stop-color", "stop-opacity", "gradientunits", "gradienttransform",
         "fx", "fy", "font-family", "font-size", "font-weight", "text-anchor", "dominant-baseline", "letter-spacing",
         "clip-path", "fill-rule", "clip-rule", "preserveaspectratio", "role", "aria-label", "xmlns"}
SAFE_URL = re.compile(r"^url\(#[A-Za-z][\w\-]*\)$")


class ImageError(Exception):
    pass


# ---------------------------------------------------------------- SVG drawings
def clean_svg(src):
    """Return a safe SVG string rebuilt from the allow-list, or raise ImageError."""
    src = str(src or "").strip()
    m = re.search(r"<svg\b.*</svg>", src, re.S | re.I)
    if not m:
        raise ImageError("no <svg> drawing found")
    src = m.group(0)
    if len(src) > MAX_SVG:
        raise ImageError("drawing too large")
    if re.search(r"<!(DOCTYPE|ENTITY)", src, re.I):           # parser hazards; everything else is rebuilt from the allow-list
        raise ImageError("drawing contains forbidden content")
    try:
        root = ET.fromstring(src)
    except ET.ParseError as e:
        raise ImageError("drawing is not valid SVG: " + str(e)[:80])

    def local(tag):
        return tag.split("}")[-1].lower()

    def build(el):
        tag = local(el.tag)
        if tag not in TAGS:
            return None
        attrs = {}
        for k, v in el.attrib.items():
            k = local(k)
            if k not in ATTRS or k.startswith("on"):
                continue
            v = str(v)
            if "url(" in v and not SAFE_URL.match(v.strip()):
                continue
            if len(v) > 20000:
                continue
            attrs[k] = v
        tag_out = {"lineargradient": "linearGradient", "radialgradient": "radialGradient", "clippath": "clipPath"}.get(tag, tag)
        fix = {"viewbox": "viewBox", "gradientunits": "gradientUnits", "gradienttransform": "gradientTransform", "preserveaspectratio": "preserveAspectRatio"}
        node = ET.Element(tag_out, {fix.get(k, k): v for k, v in attrs.items() if k != "xmlns"})
        node.text = (el.text or "")[:300] if tag in ("text", "tspan", "title", "desc") else None
        for ch in el:
            c = build(ch)
            if c is not None:
                c.tail = None
                node.append(c)
        return node

    out = build(root)
    if out is None or out.tag != "svg":
        raise ImageError("the drawing must start with <svg>")
    out.set("xmlns", SVG_NS)
    if "viewBox" not in out.attrib:
        out.set("viewBox", "0 0 1200 630")
    return ET.tostring(out, encoding="unicode")


def svg_data_url(svg):
    return "data:image/svg+xml;base64," + base64.b64encode(svg.encode()).decode()


def check_cover(v):
    """Validate a cover value from the back office: PNG/JPEG/WebP upload, https URL or a cleaned SVG drawing."""
    v = str(v or "").strip()
    if not v:
        return ""
    if len(v) > 1_600_000:
        raise ImageError("image too large")
    if re.match(r"^data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$", v) or re.match(r"^https://[^\s\"'<>]+$", v):
        return v
    if v.startswith("data:image/svg+xml;base64,"):
        try:
            svg = base64.b64decode(v.split(",", 1)[1]).decode()
        except Exception:
            raise ImageError("bad drawing")
        return svg_data_url(clean_svg(svg))
    raise ImageError("cover must be a PNG/JPEG/WebP image, an https:// address or a drawing")


DRAW_SYSTEM = ("You are an illustrator for an education website. You draw clean, modern, flat vector cover "
               "illustrations as a single SVG. Rules: viewBox=\"0 0 1200 630\"; only basic shapes, paths, "
               "groups and linear/radial gradients; no text, letters, logos, brand marks, real people's faces, "
               "flags or copyrighted characters; no external images, links, scripts or CSS; a calm palette of "
               "deep navy, teal, warm orange and off-white; abstract and symbolic, suitable for teenagers and parents; "
               "under 40 KB.")


def draw_prompt(title, summary, branch):
    mood = "science, technology, AI and innovation" if branch == "stem" else "exams, study, universities and future paths"
    return (f"Draw a cover illustration for this article.\nTitle: {title}\nSummary: {summary}\nTheme: {mood}.\n"
            "Return JSON with one field \"svg\" containing the complete SVG markup.")


DRAW_SCHEMA = {"type": "object", "properties": {"svg": {"type": "string"}}, "required": ["svg"], "additionalProperties": False}


# ---------------------------------------------------------------- free-licence photos
def _get(url, limit, accept="application/json"):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": accept})
    with urllib.request.urlopen(req, timeout=20) as r:
        ctype = r.headers.get("Content-Type", "")
        data = r.read(limit + 1)
    if len(data) > limit:
        raise ImageError("file too large")
    return ctype, data


def search_photos(query, n=12, base=None):
    """Free-licence images for a query: [{id, title, thumb, url, creator, creatorUrl, license, licenseUrl, source}]."""
    q = urllib.parse.urlencode({"q": str(query)[:120], "license": ",".join(LICENSES), "page_size": max(1, min(20, n)), "mature": "false"})
    try:
        _, data = _get((base or OPENVERSE) + "?" + q, 2_000_000)
        res = json.loads(data).get("results", [])
    except (OSError, ValueError) as e:
        raise ImageError("photo search failed: " + str(e)[:100])
    out = []
    for r in res:
        lic = (r.get("license") or "").lower()
        if lic not in LICENSES or not r.get("url"):
            continue
        out.append({"id": r.get("id"), "title": (r.get("title") or "")[:200], "thumb": r.get("thumbnail") or r.get("url"), "url": r.get("url"),
                    "creator": (r.get("creator") or "")[:120], "creatorUrl": r.get("creator_url") or "",
                    "license": lic.upper() if lic in ("cc0", "pdm") else "CC " + lic.upper() + (" " + r["license_version"] if r.get("license_version") else ""),
                    "licenseUrl": r.get("license_url") or "", "source": r.get("foreign_landing_url") or r.get("url"),
                    "provider": r.get("source") or r.get("provider") or ""})
    return out


def fetch_photo(item):
    """Download a chosen photo (falls back to its thumbnail when the original is too big) → data URL."""
    for url in (item.get("url"), item.get("thumb")):
        if not url or not (str(url).startswith("https://") or (HTTP_OK and str(url).startswith("http://"))):
            continue
        try:
            ctype, data = _get(url, MAX_PHOTO, "image/*")
        except (OSError, ImageError):
            continue
        kind = (ctype.split(";")[0].strip().lower() or "")
        if kind not in ("image/png", "image/jpeg", "image/webp"):
            if data[:3] == b"\xff\xd8\xff":
                kind = "image/jpeg"
            elif data[:8] == b"\x89PNG\r\n\x1a\n":
                kind = "image/png"
            elif data[:4] == b"RIFF" and data[8:12] == b"WEBP":
                kind = "image/webp"
            else:
                continue
        return "data:" + kind + ";base64," + base64.b64encode(data).decode()
    raise ImageError("could not download that photo")


def credit(item):
    keys = ("title", "creator", "creatorUrl", "license", "licenseUrl", "source", "provider")
    c = {k: str(item.get(k) or "")[:300] for k in keys}
    for k in ("creatorUrl", "licenseUrl", "source"):
        if c[k] and not c[k].startswith(("https://", "http://")):
            c[k] = ""
    return c
