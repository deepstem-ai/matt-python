#!/usr/bin/env python3
"""Build every logo variant the website needs from the master logo file.

Source:  assets/images/brand/source/logo-original.webp  (stacked logo on white)
Output:  assets/images/brand/*.png  (transparent backgrounds)

    logo-stacked.png          full logo, original colours   (light backgrounds)
    logo-stacked-white.png    full logo, white wordmark     (dark backgrounds)
    logo-horizontal.png       mark + wordmark in one row    (light backgrounds)
    logo-horizontal-white.png same, for dark backgrounds
    logo-mark.png             symbol only, original colours
    logo-mark-light.png       symbol only, brightened for dark backgrounds
    favicon-32.png, favicon-192.png, apple-touch-icon.png, og-image.png

Requires Pillow:  pip install pillow
Usage:            python3 tools/build_logo.py
"""

import colorsys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
BRAND = ROOT / "assets" / "images" / "brand"
SOURCE = BRAND / "source" / "logo-original.webp"

# Content bands inside the source image, measured from the artwork.
MARK_BOX = (520, 190, 1340, 570)   # the "D" symbol with its orbit swoosh
WORD_BOX = (280, 605, 1495, 690)   # the "DEEP DISTRICT" wordmark
NAVY = (7, 26, 77)


def white_to_alpha(img):
    """Turn the white background into transparency, keeping anti-aliased edges clean."""
    img = img.convert("RGBA")
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, _ = px[x, y]
            a = max(255 - r, 255 - g, 255 - b) / 255
            if a < 0.03:
                px[x, y] = (0, 0, 0, 0)
                continue
            un = lambda c: max(0, min(255, round(255 - (255 - c) / a)))
            px[x, y] = (un(r), un(g), un(b), round(a * 255))
    return img


def trim(img, pad=0):
    box = img.getbbox()
    img = img.crop(box)
    if pad:
        out = Image.new("RGBA", (img.width + 2 * pad, img.height + 2 * pad), (0, 0, 0, 0))
        out.paste(img, (pad, pad))
        img = out
    return img


def recolor(img, rgb):
    """Same shape and alpha, single flat colour."""
    out = img.copy()
    px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            a = px[x, y][3]
            if a:
                px[x, y] = (*rgb, a)
    return out


def brighten(img, v_floor=0.62):
    """Lift dark navy tones so the symbol stays visible on dark backgrounds."""
    out = img.copy()
    px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = px[x, y]
            if not a:
                continue
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            v = v_floor + (1 - v_floor) * v
            s = min(1.0, s * 0.92)
            r2, g2, b2 = colorsys.hsv_to_rgb(h, s, v)
            px[x, y] = (round(r2 * 255), round(g2 * 255), round(b2 * 255), a)
    return out


def stack(mark, word, gap):
    w = max(mark.width, word.width)
    out = Image.new("RGBA", (w, mark.height + gap + word.height), (0, 0, 0, 0))
    out.paste(mark, ((w - mark.width) // 2, 0), mark)
    out.paste(word, ((w - word.width) // 2, mark.height + gap), word)
    return out


def row(mark, word, height=160, gap_ratio=0.10):
    m = mark.resize((round(mark.width * height / mark.height), height), Image.LANCZOS)
    wh = round(height * 0.34)
    wd = word.resize((round(word.width * wh / word.height), wh), Image.LANCZOS)
    gap = round(height * gap_ratio)
    out = Image.new("RGBA", (m.width + gap + wd.width, height), (0, 0, 0, 0))
    out.paste(m, (0, 0), m)
    out.paste(wd, (m.width + gap, (height - wh) // 2 + round(height * 0.04)), wd)
    return out


def icon(mark, size, bg=None, pad_ratio=0.12):
    canvas = Image.new("RGBA", (size, size), bg or (0, 0, 0, 0))
    inner = round(size * (1 - 2 * pad_ratio))
    scale = inner / max(mark.width, mark.height)
    m = mark.resize((round(mark.width * scale), round(mark.height * scale)), Image.LANCZOS)
    canvas.paste(m, ((size - m.width) // 2, (size - m.height) // 2), m)
    return canvas


def save(img, name, max_w=None):
    if max_w and img.width > max_w:
        img = img.resize((max_w, round(img.height * max_w / img.width)), Image.LANCZOS)
    img.save(BRAND / name, optimize=True)
    print(f"  {name:28s} {img.width}x{img.height}")


def main():
    print(f"Building logo variants from {SOURCE.relative_to(ROOT)}")
    src = Image.open(SOURCE).convert("RGB")
    mark = trim(white_to_alpha(src.crop(MARK_BOX)))
    word = trim(white_to_alpha(src.crop(WORD_BOX)))
    word_white = recolor(word, (255, 255, 255))
    mark_light = brighten(mark)
    gap = round(mark.height * 0.18)

    save(trim(stack(mark, word, gap), 24), "logo-stacked.png", 1200)
    save(trim(stack(mark_light, word_white, gap), 24), "logo-stacked-white.png", 1200)
    save(row(mark, word), "logo-horizontal.png")
    save(row(mark_light, word_white), "logo-horizontal-white.png")
    save(mark, "logo-mark.png", 600)
    save(mark_light, "logo-mark-light.png", 600)

    white_tile = (255, 255, 255, 255)
    save(icon(mark, 32, white_tile, 0.02), "favicon-32.png")
    save(icon(mark, 192, white_tile, 0.06), "favicon-192.png")
    save(icon(mark, 180, white_tile, 0.06), "apple-touch-icon.png")

    og = Image.new("RGBA", (1200, 630), (*NAVY, 255))
    full = stack(mark_light, word_white, gap)
    s = 640 / full.width
    full = full.resize((640, round(full.height * s)), Image.LANCZOS)
    og.paste(full, ((1200 - full.width) // 2, (630 - full.height) // 2), full)
    save(og.convert("RGB"), "og-image.png")
    print("Done.")


if __name__ == "__main__":
    main()
