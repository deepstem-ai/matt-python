#!/usr/bin/env python3
"""Generate the original SVG artwork used by the DeepDistrict.si website.

All scenes are procedural (seeded), so running this again reproduces the
same files. Replace any output with real photography later by keeping the
same file name in assets/images/.

Usage:
    python3 tools/generate_images.py
"""

import math
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
IMG = ROOT / "assets" / "images"
W, H = 1920, 1080


def write(rel, body, w=W, h=H):
    path = IMG / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" '
        f'width="{w}" height="{h}" preserveAspectRatio="xMidYMid slice">\n{body}\n</svg>\n'
    )
    path.write_text(svg, encoding="utf-8")
    print(f"  wrote {path.relative_to(ROOT)} ({len(svg) // 1024} KB)")


# ---------------------------------------------------------------- helpers

def stars(rng, n, y_max=H, r_max=1.6, w=W):
    out = []
    for _ in range(n):
        x, y = rng.uniform(0, w), rng.uniform(0, y_max) ** 1.0
        r = rng.uniform(0.3, r_max) * (rng.random() ** 2.2) + 0.25
        o = rng.uniform(0.25, 1.0)
        out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.2f}" fill="#fff" opacity="{o:.2f}"/>')
    return "\n".join(out)


def ridge(rng, base, rough, amp, peaks=(), step=8, w=W):
    """Midpoint-displacement ridge line, returns list of (x, y)."""
    n = 257
    ys = [0.0] * n
    ys[0], ys[-1] = rng.uniform(-amp, amp), rng.uniform(-amp, amp)
    size, scale = n - 1, amp
    while size > 1:
        half = size // 2
        for i in range(half, n - 1, size):
            ys[i] = (ys[i - half] + ys[i + half]) / 2 + rng.uniform(-scale, scale)
        size, scale = half, scale * rough
    pts = []
    for i, dy in enumerate(ys):
        x = i / (n - 1) * w
        y = base + dy
        for px, ph, pw in peaks:  # add named peaks as gaussian bumps
            y -= ph * max(0.0, 1 - abs(x - px) / pw) ** 1.6
        pts.append((x, y))
    return pts


def ridge_path(pts, bottom=H, w=W):
    d = f"M0,{bottom} " + " ".join(f"L{x:.1f},{y:.1f}" for x, y in pts) + f" L{w},{bottom} Z"
    return d


def network(rng, nodes, max_d, color, width=0.8, node_r=2.2, op=0.5):
    out = []
    for i, (x1, y1) in enumerate(nodes):
        for x2, y2 in nodes[i + 1:]:
            d = math.hypot(x2 - x1, y2 - y1)
            if d < max_d:
                a = op * (1 - d / max_d)
                out.append(
                    f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" '
                    f'stroke="{color}" stroke-width="{width}" opacity="{a:.2f}"/>'
                )
    for x, y in nodes:
        out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{node_r}" fill="{color}" filter="url(#glow)"/>')
    return "\n".join(out)


GLOW = """<filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
  <feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter>
<filter id="blur40" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="40"/></filter>
<filter id="blur12" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="12"/></filter>
<filter id="grain" x="0" y="0" width="100%" height="100%">
  <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>
  <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.05 0"/>
</filter>"""

GRAIN = f'<rect width="{W}" height="{H}" filter="url(#grain)"/>'


# ---------------------------------------------------------------- scenes

def hero_alps():
    """Julian Alps at night with an SI constellation over a three-peaked summit."""
    rng = random.Random(1991)
    far = ridge(rng, 720, 0.62, 90, peaks=[(300, 120, 260), (1600, 160, 300)])
    mid = ridge(rng, 830, 0.62, 70, peaks=[(1380, 210, 330), (420, 150, 280)])
    # three-headed summit, front range
    front = ridge(rng, 960, 0.66, 55, peaks=[(960, 440, 380), (790, 150, 120), (1150, 170, 130)])
    near = ridge(rng, 1030, 0.6, 22)
    nodes = [(rng.gauss(960, 360), rng.gauss(300, 120)) for _ in range(46)]
    nodes = [(x, y) for x, y in nodes if 80 < y < 560]
    body = f"""<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#02040a"/><stop offset=".55" stop-color="#0a1426"/><stop offset="1" stop-color="#1a2d4a"/>
</linearGradient>
<radialGradient id="aur" cx=".5" cy=".55" r=".6">
  <stop offset="0" stop-color="#2f7bff" stop-opacity=".35"/><stop offset="1" stop-color="#2f7bff" stop-opacity="0"/>
</radialGradient>
<linearGradient id="up" x1="0" y1="1" x2="0" y2="0">
  <stop offset="0" stop-color="#79b8ff" stop-opacity=".7"/><stop offset="1" stop-color="#79b8ff" stop-opacity="0"/>
</linearGradient>
<linearGradient id="snow" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#9fb4cc"/><stop offset=".25" stop-color="#2b3c55"/><stop offset="1" stop-color="#0b111c"/>
</linearGradient>
{GLOW}
</defs>
<rect width="{W}" height="{H}" fill="url(#sky)"/>
<g>{stars(rng, 900, 760)}</g>
<ellipse cx="960" cy="640" rx="900" ry="260" fill="url(#aur)" filter="url(#blur40)"/>
<g>{network(rng, nodes, 230, "#79b8ff", 0.9, 2.4, 0.55)}</g>
<path d="{ridge_path(far)}" fill="#13213a" opacity=".9"/>
<path d="{ridge_path(mid)}" fill="#0f1a2e"/>
<path d="{ridge_path(front)}" fill="url(#snow)"/>
<path d="{ridge_path(near)}" fill="#05080e"/>
<g fill="#ffd27a" filter="url(#glow)">
  <rect x="1440" y="1000" width="60" height="5" rx="2"/><rect x="1456" y="991" width="28" height="5" rx="2"/>
  <circle cx="1470" cy="976" r="2.5"/>
</g>
<rect x="1469" y="380" width="2" height="596" fill="url(#up)"/>
{GRAIN}"""
    write("hero/alps-night.svg", body)


def research_core():
    """A glowing reasoning core: projected sphere of nodes + orbit rings."""
    rng = random.Random(7)
    cx, cy, R = 1240, 540, 330
    pts = []
    golden = math.pi * (3 - math.sqrt(5))
    n = 220
    for i in range(n):
        y = 1 - 2 * (i + 0.5) / n
        r = math.sqrt(1 - y * y)
        t = golden * i
        x, z = math.cos(t) * r, math.sin(t) * r
        # tilt
        a = 0.45
        y2, z2 = y * math.cos(a) - z * math.sin(a), y * math.sin(a) + z * math.cos(a)
        pts.append((cx + x * R, cy + y2 * R, z2))
    links, dots = [], []
    for i, (x1, y1, z1) in enumerate(pts):
        for x2, y2, z2 in pts[i + 1:]:
            d = math.hypot(x2 - x1, y2 - y1)
            if d < 62 and (z1 + z2) > -0.6:
                o = 0.12 + 0.35 * ((z1 + z2) / 2 + 1) / 2
                links.append(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="#8dbdff" stroke-width=".7" opacity="{o:.2f}"/>')
        rr = 1.2 + 2.2 * (z1 + 1) / 2
        dots.append(f'<circle cx="{x1:.1f}" cy="{y1:.1f}" r="{rr:.2f}" fill="#e1ecff" opacity="{0.3 + 0.7 * (z1 + 1) / 2:.2f}"/>')
    rings = "\n".join(
        f'<ellipse cx="{cx}" cy="{cy}" rx="{R + 80 + k * 70}" ry="{(R + 80 + k * 70) * 0.28:.0f}" '
        f'fill="none" stroke="#4f8fff" stroke-width="{1.4 - k * 0.3:.1f}" opacity="{0.5 - k * 0.12:.2f}" '
        f'transform="rotate({-18 + k * 9} {cx} {cy})"/>'
        for k in range(4)
    )
    body = f"""<defs>
<radialGradient id="bg" cx=".65" cy=".5" r=".75">
  <stop offset="0" stop-color="#0d2236"/><stop offset=".6" stop-color="#050a12"/><stop offset="1" stop-color="#000"/>
</radialGradient>
<radialGradient id="core" cx=".5" cy=".5" r=".5">
  <stop offset="0" stop-color="#ffffff" stop-opacity=".95"/><stop offset=".2" stop-color="#79b8ff" stop-opacity=".6"/><stop offset="1" stop-color="#0a3d5c" stop-opacity="0"/>
</radialGradient>
{GLOW}
</defs>
<rect width="{W}" height="{H}" fill="url(#bg)"/>
<g>{stars(rng, 350)}</g>
<circle cx="{cx}" cy="{cy}" r="{R * 1.25}" fill="url(#core)" opacity=".55" filter="url(#blur40)"/>
<circle cx="{cx}" cy="{cy}" r="90" fill="url(#core)"/>
{rings}
<g>{''.join(links)}</g>
<g>{''.join(dots)}</g>
{GRAIN}"""
    write("sections/research-core.svg", body)


def academy_orbit():
    """Planet horizon at dawn with orbiting knowledge satellites."""
    rng = random.Random(42)
    sats = []
    for k, (rx, ry, rot) in enumerate([(900, 430, -6), (1120, 540, 4), (1380, 640, -2)]):
        sats.append(
            f'<ellipse cx="960" cy="1180" rx="{rx}" ry="{ry}" fill="none" stroke="#9cc4ff" '
            f'stroke-width="1" stroke-dasharray="2 10" opacity=".45" transform="rotate({rot} 960 1180)"/>'
        )
        t = rng.uniform(math.pi * 1.25, math.pi * 1.75)
        x, y = 960 + rx * math.cos(t), 1180 + ry * math.sin(t)
        sats.append(f'<g transform="translate({x:.0f} {y:.0f}) rotate({rng.uniform(-30, 30):.0f})" filter="url(#glow)">'
                    f'<rect x="-14" y="-3" width="10" height="6" fill="#4f8fff"/><rect x="4" y="-3" width="10" height="6" fill="#4f8fff"/>'
                    f'<rect x="-4" y="-5" width="8" height="10" rx="1" fill="#e8f6ff"/></g>')
    body = f"""<defs>
<linearGradient id="space" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#000"/><stop offset=".7" stop-color="#05101f"/><stop offset="1" stop-color="#0b2140"/>
</linearGradient>
<radialGradient id="planet" cx=".5" cy="0" r="1">
  <stop offset="0" stop-color="#1e5f9e"/><stop offset=".08" stop-color="#0f3561"/><stop offset=".3" stop-color="#061629"/><stop offset="1" stop-color="#01050b"/>
</radialGradient>
<linearGradient id="dawn" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stop-color="#ff9a4a" stop-opacity="0"/><stop offset=".72" stop-color="#ffb46b" stop-opacity=".9"/><stop offset=".8" stop-color="#fff2d6"/><stop offset=".9" stop-color="#7fd1ff" stop-opacity=".7"/><stop offset="1" stop-color="#7fd1ff" stop-opacity="0"/>
</linearGradient>
{GLOW}
</defs>
<rect width="{W}" height="{H}" fill="url(#space)"/>
<g>{stars(rng, 600, 760)}</g>
{''.join(sats)}
<ellipse cx="960" cy="2350" rx="2100" ry="1560" fill="url(#planet)"/>
<ellipse cx="960" cy="2350" rx="2100" ry="1560" fill="none" stroke="url(#dawn)" stroke-width="10" filter="url(#blur12)"/>
<ellipse cx="960" cy="2350" rx="2100" ry="1560" fill="none" stroke="url(#dawn)" stroke-width="2.5"/>
<circle cx="1515" cy="808" r="90" fill="#fff2d6" opacity=".35" filter="url(#blur40)"/>
{GRAIN}"""
    write("sections/academy-orbit.svg", body)


def innovation_city():
    """Dusk skyline with a castle hill and rising data streams."""
    rng = random.Random(1144)
    blds, wins = [], []
    x = 0
    while x < W:
        bw = rng.randint(40, 120)
        bh = rng.randint(80, 260)
        if 700 < x < 1150:
            bh = rng.randint(40, 110)  # keep the hill visible
        top = 1080 - bh
        blds.append(f'<rect x="{x}" y="{top}" width="{bw}" height="{bh}" fill="#070b14"/>')
        for wy in range(top + 12, 1070, 18):
            for wx in range(x + 8, x + bw - 8, 14):
                if rng.random() < 0.18:
                    c = rng.choice(["#ffd27a", "#ffe9b8", "#8dbdff"])
                    wins.append(f'<rect x="{wx}" y="{wy}" width="5" height="7" fill="{c}" opacity="{rng.uniform(.4, .95):.2f}"/>')
        x += bw + rng.randint(0, 6)
    streams = []
    for _ in range(38):
        sx = rng.uniform(80, 1840)
        top = rng.uniform(80, 600)
        streams.append(f'<rect x="{sx:.0f}" y="{top:.0f}" width="{rng.uniform(.8, 2.4):.1f}" height="{1080 - top:.0f}" fill="url(#beam)" opacity="{rng.uniform(.25, .8):.2f}"/>')
    body = f"""<defs>
<linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#03050c"/><stop offset=".55" stop-color="#1b1838"/><stop offset=".8" stop-color="#5a2d4f"/><stop offset="1" stop-color="#d9784a"/>
</linearGradient>
<linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#79b8ff" stop-opacity="0"/><stop offset=".5" stop-color="#79b8ff" stop-opacity=".8"/><stop offset="1" stop-color="#79b8ff" stop-opacity="0"/>
</linearGradient>
{GLOW}
</defs>
<rect width="{W}" height="{H}" fill="url(#dusk)"/>
<g>{stars(rng, 260, 500)}</g>
<g>{''.join(streams)}</g>
<path d="M560,1080 C700,900 820,840 930,830 C1040,820 1150,880 1340,1080 Z" fill="#0a0e1a"/>
<g fill="#0a0e1a">
  <rect x="880" y="760" width="110" height="72"/><rect x="900" y="720" width="22" height="40"/><rect x="955" y="700" width="26" height="60"/>
  <path d="M950,700 L968,676 L986,700 Z"/>
</g>
<g fill="#ffd27a" filter="url(#glow)"><rect x="902" y="790" width="5" height="8"/><rect x="930" y="790" width="5" height="8"/><rect x="963" y="730" width="5" height="8"/></g>
<g>{''.join(blds)}</g>
<g>{''.join(wins)}</g>
{GRAIN}"""
    write("sections/innovation-city.svg", body)


def launch_beam():
    """A launch tower sending a column of light into the sky (the SI mission)."""
    rng = random.Random(2030)
    ground = ridge(rng, 960, 0.5, 14)
    sparks = "\n".join(
        f'<circle cx="{960 + rng.gauss(0, 30 + (900 - y) * 0.08):.0f}" cy="{y:.0f}" r="{rng.uniform(.6, 2.2):.1f}" fill="#fff" opacity="{rng.uniform(.2, .9):.2f}"/>'
        for y in (rng.uniform(40, 900) for _ in range(260))
    )
    lattice = "".join(
        f'<line x1="1012" y1="{y}" x2="1060" y2="{y + 24}" stroke="#141a26" stroke-width="3"/>'
        f'<line x1="1060" y1="{y}" x2="1012" y2="{y + 24}" stroke="#141a26" stroke-width="3"/>'
        for y in range(620, 940, 24)
    )
    body = f"""<defs>
<linearGradient id="night" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#000"/><stop offset=".7" stop-color="#07101f"/><stop offset="1" stop-color="#13243d"/>
</linearGradient>
<linearGradient id="col" x1="0" y1="1" x2="0" y2="0">
  <stop offset="0" stop-color="#fff"/><stop offset=".15" stop-color="#cfe2ff"/><stop offset=".6" stop-color="#3a8bff" stop-opacity=".5"/><stop offset="1" stop-color="#3a8bff" stop-opacity="0"/>
</linearGradient>
<radialGradient id="base" cx=".5" cy=".5" r=".5">
  <stop offset="0" stop-color="#fff6e0"/><stop offset=".3" stop-color="#ffb35c" stop-opacity=".8"/><stop offset="1" stop-color="#ff6a2a" stop-opacity="0"/>
</radialGradient>
{GLOW}
</defs>
<rect width="{W}" height="{H}" fill="url(#night)"/>
<g>{stars(rng, 700, 900)}</g>
<rect x="900" y="0" width="120" height="960" fill="url(#col)" filter="url(#blur40)" opacity=".8"/>
<rect x="948" y="0" width="24" height="960" fill="url(#col)" filter="url(#blur12)"/>
<rect x="957" y="0" width="6" height="960" fill="url(#col)"/>
<g>{sparks}</g>
<ellipse cx="960" cy="950" rx="420" ry="120" fill="url(#base)" filter="url(#blur40)"/>
<rect x="1008" y="600" width="56" height="360" fill="none" stroke="#141a26" stroke-width="6"/>
{lattice}
<path d="{ridge_path(ground)}" fill="#03060b"/>
{GRAIN}"""
    write("sections/launch-beam.svg", body)


def adriatic_coast():
    """Moonlit sea with a coastal town peninsula — regional node on the coast."""
    rng = random.Random(1300)
    refl = "\n".join(
        f'<rect x="{1380 + rng.gauss(0, 30 + (y - 760) * 0.5):.0f}" y="{y:.0f}" width="{rng.uniform(20, 120):.0f}" height="2" fill="#ffeac2" opacity="{rng.uniform(.15, .7):.2f}"/>'
        for y in range(770, 1080, 7)
    )
    houses = []
    x = 380
    while x < 1020:
        w = rng.randint(22, 46)
        h = rng.randint(30, 80)
        houses.append(f'<rect x="{x}" y="{760 - h}" width="{w}" height="{h}" fill="#0a0f19"/>')
        if rng.random() < 0.6:
            houses.append(f'<rect x="{x + w // 3}" y="{760 - h + 12}" width="5" height="7" fill="#ffd27a" opacity=".85"/>')
        x += w + 2
    body = f"""<defs>
<linearGradient id="sky2" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#02050c"/><stop offset="1" stop-color="#16294a"/>
</linearGradient>
<linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#0f2140"/><stop offset="1" stop-color="#02060d"/>
</linearGradient>
{GLOW}
</defs>
<rect width="{W}" height="{H}" fill="url(#sky2)"/>
<g>{stars(rng, 500, 740)}</g>
<circle cx="1420" cy="300" r="140" fill="#fff2d6" opacity=".25" filter="url(#blur40)"/>
<circle cx="1420" cy="300" r="56" fill="#fff6e6"/>
<rect y="760" width="{W}" height="320" fill="url(#sea)"/>
<g>{refl}</g>
<path d="M300,762 L360,720 L1040,720 L1100,762 Z" fill="#0a0f19"/>
<g>{''.join(houses)}</g>
<rect x="700" y="560" width="26" height="160" fill="#0a0f19"/><path d="M696,560 L713,520 L730,560 Z" fill="#0a0f19"/>
<circle cx="713" cy="580" r="3" fill="#ffd27a" filter="url(#glow)"/>
{GRAIN}"""
    write("sections/adriatic-coast.svg", body)


def globe_network():
    """Dotted globe with links from Slovenia to partner regions worldwide."""
    rng = random.Random(386)
    cx, cy, R = 1300, 560, 420
    tilt = math.radians(24)

    def project(lat, lon, rot=-25):
        la, lo = math.radians(lat), math.radians(lon + rot)
        x, y, z = math.cos(la) * math.sin(lo), math.sin(la), math.cos(la) * math.cos(lo)
        y, z = y * math.cos(tilt) - z * math.sin(tilt), y * math.sin(tilt) + z * math.cos(tilt)
        return cx + x * R, cy - y * R, z

    dots = []
    for lat in range(-80, 81, 6):
        step = max(4, int(6 / max(math.cos(math.radians(lat)), 0.15)))
        for lon in range(-180, 180, step):
            x, y, z = project(lat, lon)
            if z > 0:
                dots.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{1.1 + 1.3 * z:.2f}" fill="#8dbdff" opacity="{0.12 + 0.5 * z:.2f}"/>')
    hub = (46.1, 14.5)  # Slovenia
    targets = [(51.5, -0.1), (40.7, -74.0), (1.35, 103.8), (35.7, 139.7), (-33.9, 151.2), (37.8, -122.4),
               (52.5, 13.4), (48.9, 2.35), (59.3, 18.1), (-23.5, -46.6), (19.1, 72.9), (25.2, 55.3), (13.75, 100.5)]
    hx, hy, _ = project(*hub)
    arcs, pins = [], []
    for lat, lon in targets:
        x, y, z = project(lat, lon)
        if z <= 0.05:
            continue
        mx, my = (hx + x) / 2, (hy + y) / 2
        d = math.hypot(x - hx, y - hy)
        nx, ny = (mx - cx), (my - cy)
        n = math.hypot(nx, ny) or 1
        lift = 0.35 * d
        qx, qy = mx + nx / n * lift, my + ny / n * lift
        arcs.append(f'<path d="M{hx:.1f},{hy:.1f} Q{qx:.1f},{qy:.1f} {x:.1f},{y:.1f}" fill="none" stroke="url(#arc)" stroke-width="1.6" opacity=".9"/>')
        pins.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="4" fill="#cfe2ff" filter="url(#glow)"/>')
    body = f"""<defs>
<radialGradient id="bg" cx=".68" cy=".5" r=".8">
  <stop offset="0" stop-color="#0b2a6e"/><stop offset=".55" stop-color="#061433"/><stop offset="1" stop-color="#030918"/>
</radialGradient>
<radialGradient id="sphere" cx=".4" cy=".35" r=".75">
  <stop offset="0" stop-color="#1b4fd0" stop-opacity=".45"/><stop offset="1" stop-color="#061433" stop-opacity="0"/>
</radialGradient>
<linearGradient id="arc" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stop-color="#3fd0ff"/><stop offset="1" stop-color="#4f8fff" stop-opacity=".5"/>
</linearGradient>
{GLOW}
</defs>
<rect width="{W}" height="{H}" fill="url(#bg)"/>
<g>{stars(rng, 260)}</g>
<circle cx="{cx}" cy="{cy}" r="{R}" fill="url(#sphere)"/>
<circle cx="{cx}" cy="{cy}" r="{R}" fill="none" stroke="#4f8fff" stroke-opacity=".35"/>
<circle cx="{cx}" cy="{cy}" r="{R + 30}" fill="none" stroke="#4f8fff" stroke-opacity=".12"/>
<g>{''.join(dots)}</g>
<g>{''.join(arcs)}</g>
<g>{''.join(pins)}</g>
<circle cx="{hx:.1f}" cy="{hy:.1f}" r="22" fill="#3fd0ff" opacity=".25" filter="url(#blur12)"/>
<circle cx="{hx:.1f}" cy="{hy:.1f}" r="7" fill="#fff" filter="url(#glow)"/>
{GRAIN}"""
    write("sections/globe-network.svg", body)


def swoosh():
    """The orbit swoosh from the logo, as a reusable decorative stroke."""
    body = """<defs>
<linearGradient id="sw" x1="0" y1="1" x2="1" y2="0">
  <stop offset="0" stop-color="#1b4fd0" stop-opacity="0"/><stop offset=".35" stop-color="#1f6fff" stop-opacity=".7"/>
  <stop offset=".8" stop-color="#3fd0ff"/><stop offset="1" stop-color="#ffffff"/>
</linearGradient>
</defs>
<path d="M0,300 C260,150 620,40 1000,0 C660,58 330,170 30,312 Z" fill="url(#sw)"/>"""
    write("brand/swoosh.svg", body, 1000, 320)


def icons():
    """Line icons used in cards (24x24 viewBox, stroke = currentColor)."""
    base = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">{}</svg>\n'
    shapes = {
        "core": '<circle cx="12" cy="12" r="3"/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-60 12 12)"/>',
        "academy": '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/><path d="M22 9v6"/>',
        "lab": '<path d="M9 3h6"/><path d="M10 3v6L4 19a1.5 1.5 0 0 0 1.3 2h13.4A1.5 1.5 0 0 0 20 19l-6-10V3"/><path d="M7 15h10"/>',
        "rocket": '<path d="M12 2c3 2 5 6 5 10l-2 4H9l-2-4c0-4 2-8 5-10z"/><circle cx="12" cy="9" r="1.6"/><path d="M9 16l-2 4 3-1M15 16l2 4-3-1"/>',
        "network": '<circle cx="5" cy="6" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><circle cx="12" cy="10" r="2"/><path d="M7 6h10M6 8l5 1M18 8l-5 1M12 12v4"/>',
        "shield": '<path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z"/><path d="M9 12l2 2 4-4"/>',
        "leaf": '<path d="M4 20c0-9 6-15 16-16-1 10-7 16-16 16z"/><path d="M4 20l8-8"/>',
        "health": '<path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-3 4.5 4.5 0 0 1 8 3c0 6-8 11-8 11z"/><path d="M7 12h3l1-2 2 4 1-2h3"/>',
        "arrow": '<path d="M5 12h14M13 6l6 6-6 6"/>',
        "lock": '<rect x="4" y="10" width="16" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.5" r="1.4"/>',
        "review": '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/><path d="M8.5 11l1.8 1.8 3.4-3.6"/>',
        "globe": '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.6 2.6 3.8 5.6 3.8 9s-1.2 6.4-3.8 9c-2.6-2.6-3.8-5.6-3.8-9S9.4 5.6 12 3z"/>',
    }
    for name, s in shapes.items():
        (IMG / "icons" / f"{name}.svg").write_text(base.format(s))
    print(f"  wrote {len(shapes)} icons to assets/images/icons/")


if __name__ == "__main__":
    print("Generating DeepDistrict.si artwork...")
    (IMG / "icons").mkdir(parents=True, exist_ok=True)
    hero_alps()
    research_core()
    academy_orbit()
    innovation_city()
    launch_beam()
    adriatic_coast()
    globe_network()
    swoosh()
    icons()
    print("Done.")
