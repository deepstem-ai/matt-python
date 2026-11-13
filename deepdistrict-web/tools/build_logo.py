#!/usr/bin/env python3
"""Build every logo variant the website needs from the master logo file.

Source:  assets/images/brand/source/logo-original.webp  (stacked logo on white)
Output:  assets/images/brand/*.png  (transparent backgrounds)

    logo-stacked.png          full logo, original colours   (light backgrounds)
    logo-stacked-white.png    full logo, white wordmark     (dark backgrounds)
    logo-horizontal.png       mark + wordmark in one row    (light backgrounds)
    logo-horizontal-white.png same, for dark backgrounds
    logo-horizon-white.png    "DEEP [D]ISTRICT" with the glowing horizon (dark backgrounds)
    logo-horizon.png          same, navy wordmark                        (light backgrounds)
    logo-mark.png             symbol only, original colours
    logo-mark-light.png       symbol only, brightened for dark backgrounds
    favicon-32.png, favicon-192.png, apple-touch-icon.png, og-image.png

Requires Pillow:  pip install pillow
Usage:            python3 tools/build_logo.py
"""

import colorsys
import math
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter

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


def letters(word):
    """Column ranges of the glyphs in the wordmark."""
    a = word.getchannel("A")
    cols = [a.crop((x, 0, x + 1, word.height)).getbbox() is not None for x in range(word.width)]
    segs, start = [], None
    for x, v in enumerate(cols + [0]):
        if v and start is None:
            start = x
        elif not v and start is not None:
            segs.append((start, x)); start = None
    return segs


def horizon(mark, word, glow_rgb=(90, 170, 255), core_rgb=(225, 240, 255), height=440):
    """"DEEP [D-mark]ISTRICT" under a glowing horizon arc, on a transparent background."""
    segs = letters(word)
    d2 = segs[4]                                     # the D of DISTRICT
    left, right = word.crop((0, 0, segs[3][1], word.height)), word.crop((segs[5][0], 0, word.width, word.height))
    th = 70                                          # letter height in the output
    sc = th / word.height
    left = left.resize((round(left.width * sc), th), Image.LANCZOS)
    right = right.resize((round(right.width * sc), th), Image.LANCZOS)
    mh = round(th * 2.05)
    m = mark.resize((round(mark.width * mh / mark.height), mh), Image.LANCZOS)
    gap = round(th * 0.32)
    tuck = -round(th * 0.62)                         # the D glyph sits left inside the mark's box
    text_w = left.width + gap + m.width + tuck + right.width
    W = text_w + 2 * round(th * 1.4)
    H = height
    out = Image.new("RGBA", (W, H), (0, 0, 0, 0))

    # --- horizon: a very wide ellipse whose top edge crosses the image; glow brightest near the mark
    base_y = round(H * 0.62)                         # letters' bottom line
    mark_top = base_y - mh + round(th * 0.12)
    apex_y = mark_top - 10                           # the horizon just clears the top of the D
    rx, ry = W * 1.5, W * 0.5
    cx = W / 2
    peak_x = (W - text_w) / 2 + left.width + gap + m.width * 0.62

    def arc_layer(width, blur, alpha):
        lay = Image.new("L", (W, H), 0)
        ImageDraw.Draw(lay).ellipse((cx - rx, apex_y, cx + rx, apex_y + 2 * ry), outline=255, width=width)
        return lay.filter(ImageFilter.GaussianBlur(blur)).point(lambda v: round(v * alpha))

    # fade the arc out towards both ends, strongest around the mark
    fade = Image.new("L", (W, 1))
    for x in range(W):
        d = (x - peak_x) / (W * 0.48)
        fade.putpixel((x, 0), round(255 * math.exp(-d * d * 1.7)))
    fade = fade.resize((W, H))
    glow = ImageChops.add(arc_layer(26, 22, 0.55), arc_layer(8, 6, 0.9))
    core = arc_layer(3, 0.6, 1.0)
    # bright flare where the light "rises"
    flare = Image.new("L", (W, H), 0)
    fy = apex_y + ry - math.sqrt(max(0.0, ry * ry * (1 - ((peak_x - cx) / rx) ** 2)))
    ImageDraw.Draw(flare).ellipse((peak_x - 70, fy - 9, peak_x + 70, fy + 9), fill=255)
    flare = flare.filter(ImageFilter.GaussianBlur(16))
    glow = ImageChops.multiply(ImageChops.add(glow, flare), fade)
    core = ImageChops.multiply(core, fade)
    for rgb, a in ((glow_rgb, glow), (core_rgb, core)):   # alpha-composite (paste would darken the edges)
        lay = Image.new("RGBA", (W, H), (*rgb, 0))
        lay.putalpha(a)
        out.alpha_composite(lay)

    # --- wordmark with the symbol as the D
    x = (W - text_w) // 2
    out.alpha_composite(left, (x, base_y - th))
    x += left.width + gap
    out.alpha_composite(m, (x, mark_top))
    x += m.width + tuck
    out.alpha_composite(right, (x, base_y - th))
    return trim(out, 8)


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
    save(horizon(mark_light, word_white), "logo-horizon-white.png", 1400)
    save(horizon(mark, word, glow_rgb=(40, 110, 240), core_rgb=(30, 90, 230)), "logo-horizon.png", 1400)
    save(mark, "logo-mark.png", 600)
    save(mark_light, "logo-mark-light.png", 600)

    white_tile = (255, 255, 255, 255)
    save(icon(mark, 32, white_tile, 0.02), "favicon-32.png")
    save(icon(mark, 192, white_tile, 0.06), "favicon-192.png")
    save(icon(mark, 180, white_tile, 0.06), "apple-touch-icon.png")
    save(icon(mark, 512, white_tile, 0.1), "app-icon-512.png")                       # installed back-office app (PWA)
    save(icon(mark_light, 512, (*NAVY, 255), 0.22), "app-icon-maskable-512.png")    # Android adaptive icon: keep inside the safe circle

    og = Image.new("RGBA", (1200, 630), (*NAVY, 255))
    full = stack(mark_light, word_white, gap)
    s = 640 / full.width
    full = full.resize((640, round(full.height * s)), Image.LANCZOS)
    og.paste(full, ((1200 - full.width) // 2, (630 - full.height) // 2), full)
    save(og.convert("RGB"), "og-image.png")
    print("Done.")


if __name__ == "__main__":
    main()
