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

def bangkok_night():
    """Bangkok at night: temple prangs by the river, towers, and an SI network in the sky."""
    rng = random.Random(2567)
    horizon = 830

    def prang(cx, base, scale):
        # stepped terraces, then the rounded "corncob" spire of a Khmer-style prang
        tiers = [(118, 0), (118, 22), (100, 22), (100, 44), (86, 44), (86, 64), (72, 64), (72, 84), (60, 84)]
        for i in range(1, 15):
            t = i / 14
            tiers.append((60 * (1 - t) ** 0.62 * (1 + 0.18 * math.sin(t * math.pi)), 84 + t * 330))
        tiers += [(4, 414), (2, 470)]
        left = [(cx - w * scale, base - h * scale) for w, h in tiers]
        right = [(cx + w * scale, base - h * scale) for w, h in reversed(tiers)]
        return "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in left + right) + " Z"

    temples = [(380, 1.0), (220, 0.48), (540, 0.48), (130, 0.3), (630, 0.3)]
    temple_paths = "".join(f'<path d="{prang(x, horizon, sc)}" fill="url(#templeFill)"/>' for x, sc in temples)
    temple_lights = []
    for x, sc in temples:
        for k in range(int(26 * sc) + 6):
            hgt = rng.uniform(10, 380) * sc
            w = max(4, 60 * (1 - min(hgt / sc / 414, 1)) ** 0.62) * sc if hgt / sc > 84 else 100 * sc
            temple_lights.append(f'<circle cx="{x + rng.choice([-1, 1]) * w * rng.uniform(.6, 1):.1f}" cy="{horizon - hgt:.1f}" r="{rng.uniform(.8, 1.8):.1f}" fill="#ffcf7a" opacity="{rng.uniform(.5, 1):.2f}"/>')

    towers, wins = [], []
    x = 760
    while x < W:
        bw = rng.randint(46, 120)
        bh = rng.randint(160, 430)
        top = horizon - bh
        towers.append(f'<rect x="{x}" y="{top}" width="{bw}" height="{bh}" fill="#0a0d26"/>')
        for wy in range(top + 10, horizon - 6, 14):
            for wx in range(x + 6, x + bw - 6, 11):
                if rng.random() < 0.2:
                    c = rng.choice(["#ffd27a", "#ffe9c4", "#8dbdff", "#a9b8ff"])
                    wins.append(f'<rect x="{wx}" y="{wy}" width="4" height="6" fill="{c}" opacity="{rng.uniform(.35, .95):.2f}"/>')
        x += bw + rng.randint(4, 30)
    # signature pixelated tower
    tx, tw, th = 1240, 92, 640
    towers.append(f'<rect x="{tx}" y="{horizon - th}" width="{tw}" height="{th}" fill="#0b0f2c"/>')
    for k in range(40):
        yy = horizon - th + 20 + k * 15
        side = math.sin(k / 3.2)
        nx = tx + (tw - 26 if side > 0 else 0)
        towers.append(f'<rect x="{nx}" y="{yy}" width="26" height="15" fill="#151a45"/>')
    towers.append(f'<rect x="{tx + tw / 2 - 1}" y="{horizon - th - 60}" width="2" height="60" fill="#0b0f2c"/>')
    towers.append(f'<circle cx="{tx + tw / 2}" cy="{horizon - th - 62}" r="3" fill="#ffa23a" filter="url(#glow)"/>')

    refl = []
    for _ in range(170):
        rx = rng.uniform(0, W)
        ry = rng.uniform(horizon + 6, H)
        c = "#ffcf7a" if rx < 700 else rng.choice(["#8dbdff", "#a9b8ff", "#ffd27a", "#ffc24b"])
        refl.append(f'<rect x="{rx:.0f}" y="{ry:.0f}" width="{rng.uniform(14, 90):.0f}" height="2" fill="{c}" opacity="{rng.uniform(.1, .5):.2f}"/>')

    nodes = [(rng.gauss(1100, 420), rng.gauss(250, 110)) for _ in range(52)]
    nodes = [(x, y) for x, y in nodes if 40 < y < 520 and 0 < x < W]
    body = f"""<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#030918"/><stop offset=".45" stop-color="#0c1446"/><stop offset=".72" stop-color="#16216a"/><stop offset=".9" stop-color="#22307a"/><stop offset="1" stop-color="#c27c0e"/>
</linearGradient>
<linearGradient id="river" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#1a1650"/><stop offset="1" stop-color="#03061a"/>
</linearGradient>
<linearGradient id="templeFill" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#2a1f4f"/><stop offset=".6" stop-color="#120f33"/><stop offset="1" stop-color="#0a0a24"/>
</linearGradient>
{GLOW}
</defs>
<rect width="{W}" height="{H}" fill="url(#sky)"/>
<g>{stars(rng, 650, 640)}</g>
<ellipse cx="1100" cy="780" rx="900" ry="200" fill="#ffb347" opacity=".22" filter="url(#blur40)"/>
<ellipse cx="380" cy="700" rx="320" ry="220" fill="#ffb347" opacity=".18" filter="url(#blur40)"/>
<g>{network(rng, nodes, 220, "#8fd8ff", 0.9, 2.3, 0.55)}</g>
<g>{''.join(towers)}</g>
<g>{''.join(wins)}</g>
<g>{temple_paths}</g>
<g filter="url(#glow)">{''.join(temple_lights)}</g>
<rect y="{horizon}" width="{W}" height="{H - horizon}" fill="url(#river)"/>
<g>{''.join(refl)}</g>
<rect y="{horizon}" width="{W}" height="2" fill="#ffd27a" opacity=".35"/>
{GRAIN}"""
    write("hero/bangkok-night.svg", body)


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


def edge_board():
    """An edge-AI developer board: glowing AI module, GPIO header and live data traces."""
    rng = random.Random(4090)
    bx, by, bw, bh = 520, 230, 880, 600
    chip = (960, 520)
    traces, pulses = [], []
    for k in range(26):
        ang = k / 26 * math.tau
        ex = chip[0] + math.cos(ang) * rng.uniform(300, 420)
        ey = chip[1] + math.sin(ang) * rng.uniform(200, 270)
        ex = min(max(ex, bx + 30), bx + bw - 30)
        ey = min(max(ey, by + 30), by + bh - 30)
        mx = chip[0] + (ex - chip[0]) * 0.55
        d = f"M{chip[0]:.0f},{chip[1]:.0f} L{mx:.0f},{chip[1] + (ey - chip[1]) * 0.15:.0f} L{mx:.0f},{ey:.0f} L{ex:.0f},{ey:.0f}"
        col = rng.choice(["#3fd0ff", "#6d6dff", "#22d3a6"])
        traces.append(f'<path d="{d}" fill="none" stroke="{col}" stroke-width="2" opacity=".55"/>')
        traces.append(f'<circle cx="{ex:.0f}" cy="{ey:.0f}" r="5" fill="none" stroke="{col}" stroke-width="2" opacity=".8"/>')
        pulses.append(f'<circle cx="{mx:.0f}" cy="{ey:.0f}" r="3.5" fill="#fff" filter="url(#glow)" opacity=".9"/>')
    pins = "".join(
        f'<rect x="{bx + 120 + i * 22}" y="{by + 26 + j * 22}" width="12" height="12" rx="2" fill="#c8a24a"/>'
        for i in range(20) for j in range(2))
    body = f"""<defs>
<radialGradient id="bg" cx=".5" cy=".5" r=".75">
  <stop offset="0" stop-color="#1a1660"/><stop offset=".6" stop-color="#070d2c"/><stop offset="1" stop-color="#030713"/>
</radialGradient>
<linearGradient id="pcb" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#0d2a5a"/><stop offset="1" stop-color="#081736"/>
</linearGradient>
<linearGradient id="chipG" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#3fd0ff"/><stop offset=".5" stop-color="#1f6fff"/><stop offset="1" stop-color="#6d6dff"/>
</linearGradient>
<pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#8dbdff" stroke-opacity=".07"/></pattern>
{GLOW}
</defs>
<rect width="{W}" height="{H}" fill="url(#bg)"/>
<rect width="{W}" height="{H}" fill="url(#grid)"/>
<g transform="rotate(-6 960 530)">
  <rect x="{bx + 14}" y="{by + 22}" width="{bw}" height="{bh}" rx="28" fill="#000" opacity=".45" filter="url(#blur12)"/>
  <rect x="{bx}" y="{by}" width="{bw}" height="{bh}" rx="28" fill="url(#pcb)" stroke="#3fd0ff" stroke-opacity=".35" stroke-width="2"/>
  <g>{''.join(traces)}</g>
  <g>{pins}</g>
  <rect x="{bx + bw - 22}" y="{by + 120}" width="60" height="70" rx="6" fill="#9aa7bd"/>
  <rect x="{bx + bw - 22}" y="{by + 220}" width="60" height="70" rx="6" fill="#9aa7bd"/>
  <rect x="{bx + bw - 14}" y="{by + 330}" width="44" height="34" rx="4" fill="#59647a"/>
  <rect x="{bx - 30}" y="{by + 420}" width="56" height="44" rx="6" fill="#9aa7bd"/>
  <circle cx="{chip[0]}" cy="{chip[1]}" r="210" fill="#3fd0ff" opacity=".18" filter="url(#blur40)"/>
  <rect x="{chip[0] - 130}" y="{chip[1] - 110}" width="260" height="220" rx="18" fill="#0a1022" stroke="url(#chipG)" stroke-width="4"/>
  <rect x="{chip[0] - 95}" y="{chip[1] - 78}" width="190" height="156" rx="12" fill="url(#chipG)" opacity=".92"/>
  <g stroke="#ffffff" stroke-opacity=".35" stroke-width="2">{''.join(f'<line x1="{chip[0] - 80}" y1="{chip[1] - 60 + i * 15}" x2="{chip[0] + 80}" y2="{chip[1] - 60 + i * 15}"/>' for i in range(9))}</g>
  <text x="{chip[0]}" y="{chip[1] + 12}" text-anchor="middle" font-family="Arial, sans-serif" font-size="40" font-weight="700" fill="#fff" letter-spacing="4">AI</text>
  <g>{''.join(pulses)}</g>
</g>
{GRAIN}"""
    write("sections/edge-board.svg", body)


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


def stem_lab():
    """STEM collage: DNA helix, atom, gears and molecules in a vivid gradient."""
    rng = random.Random(808)
    helix = []
    for i in range(46):
        y = 120 + i * 19
        a = i * 0.42
        x1, x2 = 360 + math.sin(a) * 120, 360 - math.sin(a) * 120
        depth = (math.cos(a) + 1) / 2
        helix.append(f'<line x1="{x1:.1f}" y1="{y}" x2="{x2:.1f}" y2="{y}" stroke="#ffffff" stroke-opacity="{.12 + .25 * depth:.2f}" stroke-width="3"/>')
        helix.append(f'<circle cx="{x1:.1f}" cy="{y}" r="{5 + 4 * depth:.1f}" fill="#3fd0ff" opacity="{.5 + .5 * depth:.2f}"/>')
        helix.append(f'<circle cx="{x2:.1f}" cy="{y}" r="{5 + 4 * (1 - depth):.1f}" fill="#ffb347" opacity="{.5 + .5 * (1 - depth):.2f}"/>')
    ax, ay = 1180, 470
    orbits = "".join(
        f'<ellipse cx="{ax}" cy="{ay}" rx="260" ry="92" fill="none" stroke="#b8c6ff" stroke-width="3" opacity=".75" transform="rotate({r} {ax} {ay})"/>'
        f'<circle cx="{ax + 260 * math.cos(math.radians(e)) * math.cos(math.radians(r)) - 92 * math.sin(math.radians(e)) * math.sin(math.radians(r)):.1f}" '
        f'cy="{ay + 260 * math.cos(math.radians(e)) * math.sin(math.radians(r)) + 92 * math.sin(math.radians(e)) * math.cos(math.radians(r)):.1f}" r="11" fill="#fff" filter="url(#glow)"/>'
        for r, e in [(0, 30), (60, 200), (120, 300)])

    def gear(cx, cy, r, teeth, col):
        pts = []
        for i in range(teeth * 2):
            ang = i / (teeth * 2) * math.tau
            rr = r if i % 2 == 0 else r * 0.82
            pts.append((cx + rr * math.cos(ang), cy + rr * math.sin(ang)))
        d = "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in pts) + " Z"
        return f'<path d="{d}" fill="none" stroke="{col}" stroke-width="5" stroke-linejoin="round"/><circle cx="{cx}" cy="{cy}" r="{r * .3:.0f}" fill="none" stroke="{col}" stroke-width="5"/>'

    hexes = []
    for q in range(5):
        for r_ in range(3):
            hx, hy = 1460 + q * 70 + (r_ % 2) * 35, 150 + r_ * 60
            if rng.random() < .75:
                pts = [(hx + 34 * math.cos(math.radians(60 * k + 30)), hy + 34 * math.sin(math.radians(60 * k + 30))) for k in range(6)]
                hexes.append('<path d="M' + " L".join(f"{x:.0f},{y:.0f}" for x, y in pts) + 'Z" fill="none" stroke="#7ef0d0" stroke-width="2.5" opacity=".7"/>')
    dots = "".join(f'<circle cx="{rng.uniform(0, W):.0f}" cy="{rng.uniform(0, H):.0f}" r="{rng.uniform(1, 3.5):.1f}" fill="#fff" opacity="{rng.uniform(.15, .6):.2f}"/>' for _ in range(160))
    body = f"""<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#0a1450"/><stop offset=".5" stop-color="#3b1a7a"/><stop offset="1" stop-color="#0b5a7a"/>
</linearGradient>
{GLOW}
</defs>
<rect width="{W}" height="{H}" fill="url(#bg)"/>
<circle cx="1180" cy="470" r="380" fill="#6d6dff" opacity=".35" filter="url(#blur40)"/>
<circle cx="360" cy="560" r="300" fill="#3fd0ff" opacity=".22" filter="url(#blur40)"/>
<g>{dots}</g>
<g>{''.join(helix)}</g>
{orbits}
<circle cx="{ax}" cy="{ay}" r="38" fill="#ffd27a" filter="url(#glow)"/>
<g opacity=".85">{gear(1560, 820, 120, 12, "#3fd0ff")}{gear(1730, 700, 80, 9, "#ffd27a")}</g>
<g>{''.join(hexes)}</g>
<g font-family="Georgia, serif" font-style="italic" fill="#ffffff" opacity=".55" font-size="42">
  <text x="700" y="200">E = mc²</text><text x="760" y="930">∇·E = ρ/ε₀</text><text x="1500" y="560">f(x) = σ(Wx + b)</text>
</g>
{GRAIN}"""
    write("sections/stem-lab.svg", body)


def globe_network():
    """Dotted globe with links from Bangkok to partner regions worldwide."""
    rng = random.Random(386)
    cx, cy, R = 1300, 560, 420
    tilt = math.radians(24)

    def project(lat, lon, rot=-112):
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
    hub = (13.75, 100.5)  # Bangkok
    targets = [(35.7, 139.7), (37.6, 127.0), (25.0, 121.5), (22.3, 114.2), (1.35, 103.8), (-6.2, 106.8),
               (21.0, 105.8), (12.97, 77.6), (25.2, 55.3), (-33.9, 151.2), (31.2, 121.5), (51.5, -0.1), (46.1, 14.5)]
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


def exam_code():
    """Editor window with the Plan / Edge / Trace / Test checkpoints and an award badge."""
    rng = random.Random(70)
    w, h = 1200, 900
    lines = []
    y = 250
    palette = ["#4f9dff", "#3ddbd9", "#ffc24b", "#a9b8ff", "#7a86a8"]
    for i in range(14):
        x = 150 + (rng.choice([0, 0, 1, 2]) * 34)
        for _ in range(rng.randint(1, 4)):
            bw = rng.randint(40, 170)
            if x + bw > 700:
                break
            lines.append(f'<rect x="{x}" y="{y}" width="{bw}" height="12" rx="6" fill="{rng.choice(palette)}" opacity=".85"/>')
            x += bw + 14
        lines.append(f'<text x="112" y="{y + 11}" font-family="monospace" font-size="13" fill="#4a5578" text-anchor="end">{i + 1}</text>')
        y += 34
    checks = []
    for i, (k, c) in enumerate([("Plan", "#3ddbd9"), ("Edge", "#4f9dff"), ("Trace", "#7b7bff"), ("Test", "#ffc24b")]):
        cy = 250 + i * 104
        checks.append(f"""<g transform="translate(790 {cy})">
  <rect width="300" height="78" rx="20" fill="#121a30" stroke="{c}" stroke-opacity=".55"/>
  <circle cx="40" cy="39" r="20" fill="{c}"/>
  <path d="M31 39l7 7 13-14" fill="none" stroke="#0b1324" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="78" y="48" font-family="monospace" font-size="26" font-weight="700" fill="#e9eef7">{k}</text>
</g>""")
    body = f"""<defs>
<linearGradient id="exg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0e1730"/><stop offset="1" stop-color="#070b14"/></linearGradient>
<radialGradient id="exglow" cx=".8" cy=".15" r=".7"><stop offset="0" stop-color="#4f9dff" stop-opacity=".35"/><stop offset="1" stop-color="#4f9dff" stop-opacity="0"/></radialGradient>
<linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe29a"/><stop offset="1" stop-color="#e09a12"/></linearGradient>
</defs>
<rect width="{w}" height="{h}" rx="48" fill="url(#exg)"/>
<rect width="{w}" height="{h}" rx="48" fill="url(#exglow)"/>
<g transform="translate(60 120)">
  <rect width="680" height="660" rx="26" fill="#0b1222" stroke="#25304d"/>
  <rect width="680" height="56" rx="26" fill="#101a31"/>
  <circle cx="34" cy="28" r="8" fill="#ff5f57"/><circle cx="60" cy="28" r="8" fill="#febc2e"/><circle cx="86" cy="28" r="8" fill="#28c840"/>
  <text x="124" y="35" font-family="monospace" font-size="18" fill="#8d9ac0">solution.py</text>
</g>
<g transform="translate(-60 0)">{''.join(lines)}</g>
{''.join(checks)}
<g transform="translate(940 110)">
  <circle r="58" fill="url(#gold)"/>
  <circle r="44" fill="none" stroke="#fff6e0" stroke-width="3" opacity=".8"/>
  <path d="M-16 -6l10 22 6-10 6 10 10-22" fill="none" stroke="#5a3a00" stroke-width="5" stroke-linejoin="round" opacity=".7"/>
  <path d="M-34 44l-16 52 26-12 16 22 12-52M34 44l16 52-26-12-16 22-12-52" fill="#e09a12" opacity=".9"/>
</g>"""
    write("sections/exam-code.svg", body, w, h)


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
        "code": '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M13.5 4l-3 16"/>',
        "web": '<rect x="2.5" y="4" width="19" height="16" rx="2.5"/><path d="M2.5 9h19M6 6.5h.01M8.5 6.5h.01"/><path d="M9 13l-2 2 2 2M15 13l2 2-2 2"/>',
        "device": '<rect x="3" y="3" width="13" height="18" rx="2.5"/><rect x="14" y="9" width="7" height="12" rx="1.6"/><path d="M8.5 18h2"/>',
        "chip": '<rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
        "robot": '<rect x="4" y="8" width="16" height="11" rx="3"/><path d="M12 4v4M9 13h.01M15 13h.01M9.5 16.5h5"/><circle cx="12" cy="3.5" r="1"/><path d="M2 12v3M22 12v3"/>',
        "book": '<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H20v15H5.5A1.5 1.5 0 0 0 4 19.5z"/><path d="M4 19.5A1.5 1.5 0 0 0 5.5 21H20v-3"/><path d="M8 7h8M8 10.5h6"/>',
        "dna": '<path d="M7 3c0 6 10 6 10 12s-10 6-10 6"/><path d="M17 3c0 6-10 6-10 12"/><path d="M8.5 6h7M8.5 18h7M10 9.5h4M10 14.5h4"/>',
        "briefcase": '<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
        "server": '<rect x="3" y="3.5" width="18" height="7" rx="2"/><rect x="3" y="13.5" width="18" height="7" rx="2"/><path d="M7 7h.01M7 17h.01M11 7h6M11 17h6"/>',
        "users": '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><circle cx="17" cy="9" r="2.6"/><path d="M17 14c2.6 0 4.5 1.8 4.5 4.5"/>',
        "building": '<path d="M4 21V5.5A1.5 1.5 0 0 1 5.5 4h8A1.5 1.5 0 0 1 15 5.5V21M15 10h3.5A1.5 1.5 0 0 1 20 11.5V21M2 21h20"/><path d="M8 8h3M8 12h3M8 16h3"/>',
        "school": '<path d="M3 21h18M5 21V10l7-5 7 5v11"/><path d="M10 21v-5h4v5M12 10.5h.01"/>',
        "microscope": '<path d="M6 21h12M9 17h6M12 17v-3"/><path d="M10 3l4 2-3.5 7-4-2z"/><path d="M14 9a5 5 0 0 1 2 8"/>',
        "trophy": '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 21h7M10 17h4v4h-4z"/>',
        "present": '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M12 16v4M8 21h8M7 12l3-3 2.5 2L17 7"/>',
        "pen": '<path d="M4 20l4-1 11-11-3-3L5 16z"/><path d="M14 6l3 3"/>',
        "chart": '<path d="M3 21h18"/><rect x="5" y="12" width="3" height="6" rx=".8"/><rect x="10.5" y="8" width="3" height="10" rx=".8"/><rect x="16" y="4" width="3" height="14" rx=".8"/>',
        "spark": '<path d="M12 2l2.2 6.3L20.5 10l-6.3 2.2L12 18.5l-2.2-6.3L3.5 10l6.3-1.7z"/><path d="M19 16l.9 2.1L22 19l-2.1.9L19 22l-.9-2.1L16 19l2.1-.9z"/>',
        "mail": '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 6.5L12 13l8.5-6.5"/>',
        "pin": '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
        "search": '<circle cx="11" cy="11" r="7"/><path d="M16.5 16.5L21 21"/>',
        "video": '<rect x="2.5" y="6" width="13" height="12" rx="2.5"/><path d="M15.5 10.5L21 7.5v9l-5.5-3"/>',
        "hybrid": '<rect x="2.5" y="4" width="11" height="8" rx="1.5"/><path d="M6 15h4M8 12v3"/><path d="M14 20h7M17.5 9l3.5 3v8h-7v-8z"/>',
        "sun": '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
        "moon": '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
        "monitor": '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
        "cookie": '<path d="M21 12.5A9 9 0 1 1 11.5 3a3 3 0 0 0 3.5 3.5 3 3 0 0 0 3.5 3.5 3 3 0 0 0 2.5 2.5z"/><path d="M8.5 9.5h.01M15.5 15h.01M10 15.5h.01M12 12h.01"/>',
        "arrow-up": '<path d="M12 19V5M6 11l6-6 6 6"/>',
        "globe": '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.6 2.6 3.8 5.6 3.8 9s-1.2 6.4-3.8 9c-2.6-2.6-3.8-5.6-3.8-9S9.4 5.6 12 3z"/>',
    }
    for name, s in shapes.items():
        (IMG / "icons" / f"{name}.svg").write_text(base.format(s))
    print(f"  wrote {len(shapes)} icons to assets/images/icons/")


if __name__ == "__main__":
    print("Generating DeepDistrict.si artwork...")
    (IMG / "icons").mkdir(parents=True, exist_ok=True)
    bangkok_night()
    research_core()
    academy_orbit()
    edge_board()
    launch_beam()
    stem_lab()
    globe_network()
    swoosh()
    exam_code()
    icons()
    print("Done.")
