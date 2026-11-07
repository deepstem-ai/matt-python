"""News from around the web: technology, AI, SI and STEM headlines from trusted publishers' RSS / Atom feeds.

Only the headline, a short plain-text excerpt (at most 300 characters), the date, the publisher's own
picture link and a link back to the original article are shown — every item names its source and opens
the publisher's page, so the credit and the traffic go to them. Nothing is copied in full.

Feeds are fetched in the background every few hours (never while the database is locked). Items are only
ever added (kept for good, like everything else). The admin chooses the sources in News blog → Sources.
A host that blocks outgoing connections (e.g. a free hosting plan) simply shows the error per source.
"""

import hashlib
import html
import json
import re
import threading
import time
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime

CATS = ("ai", "si", "stem", "coding", "research", "space")
DEFAULT_SOURCES = [
    # name, feed URL, category, language
    ("MIT Technology Review", "https://www.technologyreview.com/feed/", "ai", "en"),
    ("MIT News — Artificial intelligence", "https://news.mit.edu/rss/topic/artificial-intelligence2", "ai", "en"),
    ("Google DeepMind", "https://deepmind.google/blog/rss.xml", "ai", "en"),
    ("Google Research", "https://research.google/blog/rss/", "ai", "en"),
    ("OpenAI News", "https://openai.com/news/rss.xml", "ai", "en"),
    ("IEEE Spectrum — AI", "https://spectrum.ieee.org/feeds/topic/artificial-intelligence.rss", "ai", "en"),
    ("ScienceDaily — Artificial intelligence", "https://www.sciencedaily.com/rss/computers_math/artificial_intelligence.xml", "ai", "en"),
    ("ScienceDaily — Top technology", "https://www.sciencedaily.com/rss/top/technology.xml", "stem", "en"),
    ("NASA", "https://www.nasa.gov/feed/", "space", "en"),
    ("BBC News — Science", "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml", "stem", "en"),
    ("Nature", "https://www.nature.com/nature.rss", "research", "en"),
    ("Ars Technica — Science", "https://feeds.arstechnica.com/arstechnica/science", "research", "en"),
    ("The Verge — AI", "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml", "ai", "en"),
    ("Blognone", "https://www.blognone.com/atom.xml", "coding", "th"),
    ("Techsauce", "https://techsauce.co/feed", "coding", "th"),
]
DEFAULT = {"enabled": True, "everyHours": 3, "perSource": 12,
           "sources": [{"id": hashlib.sha1(u.encode()).hexdigest()[:10], "name": n, "url": u, "category": c, "lang": l, "on": True}
                       for n, u, c, l in DEFAULT_SOURCES]}
MAX_BYTES = 3 * 1024 * 1024
UA = "DeepDistrictNewsReader/1.0 (+https://deepdistrict.si; headlines with links back to the publisher)"
_running = threading.Lock()


def init(con):
    con.executescript("""
    CREATE TABLE IF NOT EXISTS feed_items (link TEXT PRIMARY KEY, source_id TEXT NOT NULL, category TEXT, published TEXT,
                                           fetched_at TEXT NOT NULL, data TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS feed_items_pub ON feed_items (published);
    """)


def _kv(con, key, default):
    r = con.execute("SELECT value FROM kv WHERE key=?", (key,)).fetchone()
    return json.loads(r["value"]) if r else default


def _set(con, key, value):
    con.execute("INSERT INTO kv (key, value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", (key, json.dumps(value, ensure_ascii=False)))


def settings(con):
    cfg = json.loads(json.dumps(DEFAULT))
    cfg.update({k: v for k, v in _kv(con, "feeds", {}).items() if k in cfg})
    return cfg


def _url_ok(u):
    return bool(re.match(r"^https?://[^\s\"'<>]+$", str(u or ""))) and len(u) <= 400


def save_settings(con, body):
    cfg = settings(con)
    if "enabled" in body:
        cfg["enabled"] = bool(body["enabled"])
    if "everyHours" in body:
        cfg["everyHours"] = max(1, min(24, int(body["everyHours"] or 3)))
    if isinstance(body.get("sources"), list):
        out, seen = [], set()
        for s in body["sources"][:60]:
            if not isinstance(s, dict) or not _url_ok(s.get("url")) or s["url"] in seen:
                continue
            seen.add(s["url"])
            out.append({"id": hashlib.sha1(s["url"].encode()).hexdigest()[:10], "name": str(s.get("name") or s["url"])[:80], "url": s["url"],
                        "category": s.get("category") if s.get("category") in CATS else "stem", "lang": "th" if s.get("lang") == "th" else "en",
                        "on": s.get("on", True) is not False})
        cfg["sources"] = out
    _set(con, "feeds", cfg)
    return cfg


def status(con):
    return _kv(con, "feedStatus", {})


# ---------------------------------------------------------------- parsing
def _text(s, n=None):
    s = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", str(s or ""), flags=re.S | re.I)
    s = html.unescape(re.sub(r"<[^>]+>", " ", s))
    s = re.sub(r"\s+", " ", s).strip()
    if n and len(s) > n:
        s = s[:n - 1].rsplit(" ", 1)[0] + "…"
    return s


def _date(s):
    s = (s or "").strip()
    if not s:
        return None
    try:
        d = parsedate_to_datetime(s)
    except (TypeError, ValueError):
        try:
            d = datetime.fromisoformat(s.replace("Z", "+00:00"))
        except ValueError:
            return None
    if d.tzinfo is None:
        d = d.replace(tzinfo=timezone.utc)
    return d.astimezone(timezone.utc).isoformat(timespec="seconds")


def _local(tag):
    return tag.rsplit("}", 1)[-1].lower()


def _child(el, *names):
    for c in el:
        if _local(c.tag) in names:
            return c
    return None


def _image(el, summary_html):
    for c in el.iter():
        t = _local(c.tag)
        if t in ("content", "thumbnail") and c.get("url") and (c.get("medium") in (None, "image") or t == "thumbnail"):
            return c.get("url")
        if t == "enclosure" and (c.get("type") or "").startswith("image/") and c.get("url"):
            return c.get("url")
    m = re.search(r'<img[^>]+src="(https://[^"]+)"', summary_html or "")
    return m.group(1) if m else ""


def parse(raw):
    """RSS 2.0, RSS 1.0 (RDF) or Atom → list of dicts. Refuses documents that declare entities."""
    if b"<!ENTITY" in raw[:4096].upper() or len(raw) > MAX_BYTES:
        raise ValueError("unsafe or too large feed")
    root = ET.fromstring(raw)
    entries = [e for e in root.iter() if _local(e.tag) in ("item", "entry")]
    out = []
    for e in entries:
        t = _child(e, "title")
        title = _text("".join(t.itertext()) if t is not None else "", 220)
        link = ""
        for c in e:
            if _local(c.tag) == "link":
                href = c.get("href")
                if href and c.get("rel", "alternate") == "alternate":
                    link = href; break
                if not href and (c.text or "").strip():
                    link = c.text.strip(); break
        if not link:
            g = _child(e, "guid", "id")
            link = (g.text or "").strip() if g is not None and (g.text or "").startswith("http") else ""
        summ = _child(e, "description", "summary", "content", "encoded")
        summ_html = "".join(summ.itertext()) if summ is not None else ""
        pub = _child(e, "pubdate", "published", "updated", "date")
        img = _image(e, summ_html)
        if title and _url_ok(link):
            out.append({"title": title, "link": link, "summary": _text(summ_html, 300), "published": _date(pub.text if pub is not None else ""),
                        "image": img if img.startswith("https://") and len(img) < 500 else ""})
    return out


def fetch(url, timeout=15):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.5"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read(MAX_BYTES + 1)


# ---------------------------------------------------------------- background refresh
def due(con, cfg):
    last = _kv(con, "feedLast", 0)
    return cfg["enabled"] and time.time() - float(last or 0) > cfg["everyHours"] * 3600


def refresh(db, lock, force=False, fetcher=fetch):
    """Fetch every source (outside the DB lock), then store new items. Safe to call from any thread."""
    if not _running.acquire(blocking=False):
        return False
    try:
        with lock, db() as con:
            cfg = settings(con)
            if not force and not due(con, cfg):
                return False
            _set(con, "feedLast", time.time())
        results = {}
        for s in cfg["sources"]:
            if not s.get("on"):
                continue
            try:
                items = parse(fetcher(s["url"]))[:cfg["perSource"]]
                results[s["id"]] = (s, items, None)
            except Exception as e:  # noqa: BLE001 — one broken feed never stops the others
                results[s["id"]] = (s, [], str(e)[:160] or e.__class__.__name__)
        now = datetime.now(timezone.utc).isoformat(timespec="seconds")
        with lock, db() as con:
            st = status(con)
            for sid, (s, items, err) in results.items():
                added = 0
                for it in items:
                    it.update(source=s["name"], sourceId=sid, sourceUrl=s["url"], category=s["category"], lang=s["lang"])
                    cur = con.execute("INSERT OR IGNORE INTO feed_items (link, source_id, category, published, fetched_at, data) VALUES (?,?,?,?,?,?)",
                                      (it["link"], sid, s["category"], it["published"] or now, now, json.dumps(it, ensure_ascii=False)))
                    added += cur.rowcount
                st[sid] = {"at": now, "ok": err is None, "error": err, "items": len(items), "added": added}
            _set(con, "feedStatus", st)
        return True
    finally:
        _running.release()


def refresh_in_background(db, lock, force=False):
    threading.Thread(target=refresh, args=(db, lock, force), daemon=True).start()


# ---------------------------------------------------------------- public list
def public_list(con, cat=None, source=None, limit=24, offset=0):
    cfg = settings(con)
    on = {s["id"]: s for s in cfg["sources"] if s.get("on")}
    if not cfg["enabled"] or not on:
        return {"items": [], "total": 0, "sources": [], "off": not cfg["enabled"]}
    q, args = f"FROM feed_items WHERE source_id IN ({','.join('?' * len(on))})", list(on)
    if cat in CATS:
        q += " AND category=?"; args.append(cat)
    if source in on:
        q += " AND source_id=?"; args.append(source)
    total = con.execute("SELECT COUNT(*) " + q, args).fetchone()[0]
    rows = con.execute("SELECT data " + q + " ORDER BY published DESC LIMIT ? OFFSET ?", args + [limit, offset]).fetchall()
    have = {r["source_id"] for r in con.execute("SELECT DISTINCT source_id FROM feed_items")}
    return {"items": [json.loads(r["data"]) for r in rows], "total": total,
            "sources": [{"id": s["id"], "name": s["name"], "category": s["category"]} for s in on.values() if s["id"] in have]}
