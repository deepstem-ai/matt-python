"""DeepDistrict pop-up promotions shown on the public website.

Stored in kv "popups" as {"enabled": bool, "items": [popup, ...]}. Admins create, edit,
switch on/off and schedule them in the back office; the website asks GET /api/popups?page=…
and gets at most the pop-ups that are live right now (Bangkok time) for that page.

A pop-up is live when: the feature is on, the pop-up is on, now is inside its start–end
range (either may be empty), today is one of its weekdays (empty = every day) and now is
inside its daily time window (empty = all day; a window may cross midnight, e.g. 20:00–02:00).
"""

import re
import secrets
from datetime import datetime, timedelta, timezone

TZ = timezone(timedelta(hours=7))  # Bangkok
PAGES = ["home", "programs", "admissions", "si", "innovation", "research", "stem", "partners", "about", "contact"]
NEVER = {"legal"}                    # never cover the privacy / legal page
FREQUENCIES = ("visit", "day", "once")
MAX_IMAGE = 1_500_000                # characters of a data URL (~1.1 MB)


def default():
    return {"enabled": False, "items": []}


def _text(v, n):
    v = v if isinstance(v, dict) else {}
    return {"en": str(v.get("en") or "").strip()[:n], "th": str(v.get("th") or "").strip()[:n]}


def _dt(v):
    v = str(v or "").strip()
    if not v:
        return ""
    try:
        return datetime.strptime(v[:16], "%Y-%m-%dT%H:%M").strftime("%Y-%m-%dT%H:%M")
    except ValueError:
        raise ValueError("bad date/time: " + v)


def _hm(v):
    v = str(v or "").strip()
    if not v:
        return ""
    if not re.fullmatch(r"([01]\d|2[0-3]):[0-5]\d", v):
        raise ValueError("bad time: " + v)
    return v


def _link(v):
    v = str(v or "").strip()[:300]
    if not v:
        return ""
    if re.match(r"^(https?://|/|#|pages/|mailto:|tel:)", v, re.I) and not re.match(r"^\s*javascript:", v, re.I):
        return v
    raise ValueError("link must start with https://, /, pages/, #, mailto: or tel:")


def _image(v):
    v = str(v or "").strip()
    if not v:
        return ""
    if len(v) > MAX_IMAGE:
        raise ValueError("image too large")
    if re.match(r"^data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$", v) or re.match(r"^https://[^\s\"'<>]+$", v):
        return v
    raise ValueError("image must be a PNG/JPEG/WebP upload or an https:// address")


def _pages(v):
    v = v if isinstance(v, list) else []
    chosen = [x for x in v if x in PAGES]
    return ["all"] if "all" in v or not chosen else chosen


def clean(p, now_iso):
    """Validate and normalise one pop-up from the back office (raises ValueError)."""
    if not isinstance(p, dict):
        raise ValueError("bad pop-up")
    pid = str(p.get("id") or "")
    if not re.fullmatch(r"p[a-z0-9]{6,24}", pid):
        pid = "p" + secrets.token_hex(6)
    out = {
        "id": pid,
        "enabled": bool(p.get("enabled")),
        "name": str(p.get("name") or "").strip()[:80],
        "title": _text(p.get("title"), 120),
        "text": _text(p.get("text"), 600),
        "button": _text(p.get("button"), 40),
        "link": _link(p.get("link")),
        "image": _image(p.get("image")),
        "start": _dt(p.get("start")),
        "end": _dt(p.get("end")),
        "dailyFrom": _hm(p.get("dailyFrom")),
        "dailyTo": _hm(p.get("dailyTo")),
        "days": sorted({int(d) for d in (p.get("days") or []) if str(d).isdigit() and 0 <= int(d) <= 6}),  # 0 = Sunday … 6 = Saturday
        "pages": _pages(p.get("pages")),
        "frequency": p.get("frequency") if p.get("frequency") in FREQUENCIES else "visit",
        "delay": max(0, min(30, int(p.get("delay") or 0))),
        "priority": max(-100, min(100, int(p.get("priority") or 0))),
        "updatedAt": now_iso,
    }
    if not (out["title"]["en"] or out["title"]["th"]):
        raise ValueError("a title is needed (English or Thai)")
    if out["start"] and out["end"] and out["end"] <= out["start"]:
        raise ValueError("the end must be after the start")
    if bool(out["dailyFrom"]) != bool(out["dailyTo"]):
        raise ValueError("give both daily times, or neither")
    if out["dailyFrom"] and out["dailyFrom"] == out["dailyTo"]:
        raise ValueError("the daily times must differ")
    if (out["button"]["en"] or out["button"]["th"]) and not out["link"]:
        raise ValueError("a button needs a link")
    return out


def status(p, now=None):
    """'off' | 'scheduled' | 'ended' | 'waiting' (outside its days/hours) | 'live'."""
    now = now or datetime.now(TZ)
    stamp = now.strftime("%Y-%m-%dT%H:%M")
    if not p.get("enabled"):
        return "off"
    if p.get("end") and stamp >= p["end"]:
        return "ended"
    if p.get("start") and stamp < p["start"]:
        return "scheduled"
    js_day = (now.weekday() + 1) % 7          # Python Monday=0 → JavaScript Sunday=0
    if p.get("days") and js_day not in p["days"]:
        return "waiting"
    a, b, hm = p.get("dailyFrom"), p.get("dailyTo"), now.strftime("%H:%M")
    if a and b and not ((a <= hm < b) if a < b else (hm >= a or hm < b)):
        return "waiting"
    return "live"


def public(p):
    return {k: p[k] for k in ("id", "title", "text", "button", "link", "image", "frequency", "delay", "updatedAt")}


def active(store, page, now=None):
    """Pop-ups to offer on this page right now, best first (the website shows only the first it may)."""
    if not store.get("enabled") or page in NEVER:
        return []
    items = [p for p in store.get("items", []) if status(p, now) == "live" and ("all" in p.get("pages", ["all"]) or page in p.get("pages", []))]
    items.sort(key=lambda p: p.get("updatedAt") or "", reverse=True)        # newest first …
    items.sort(key=lambda p: int(p.get("priority") or 0), reverse=True)     # … then highest priority (stable)
    return [public(p) for p in items[:5]]
