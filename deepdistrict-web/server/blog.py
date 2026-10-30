"""DeepDistrict news blog — written with AI, checked by people.

Two branches, each with its own categories and trusted sources:
  * stem   — STEM, AI & SI technologies (AI, coding & apps, STEM & innovation, research & competitions)
  * tests  — Standard tests & higher education (TCAS, SAT, IELTS & English, medicine, study abroad, scholarships)

A post moves through: idea → drafting (AI at work) → review → scheduled / published → archived
(or rejected). Admins either give a topic and scope ("write about …") or switch on the automatic
schedule, where the AI picks a recent topic itself. A post can be published only when it passes
the checks in problems(): both languages, a body, at least one verified source for AI posts, no
banned phrase, and a credit line for photos. Categories marked "auto-publish" may skip the review
queue in automatic mode — but only if the checks pass.
"""

import json
import re
import secrets
from datetime import datetime, timedelta, timezone
from urllib.parse import urlparse

TZ = timezone(timedelta(hours=7))  # Bangkok
STATUSES = ("idea", "drafting", "review", "scheduled", "published", "archived", "rejected")
BRANCHES = {
    "stem": {"en": "STEM, AI & SI technologies", "th": "STEM · AI · เทคโนโลยี SI"},
    "tests": {"en": "Standard tests & higher education", "th": "สอบมาตรฐานและการศึกษาต่อ"},
}
IMAGE_MODES = ("photo-then-draw", "draw", "photo", "none")

DEFAULT_SETTINGS = {
    "enabled": True,
    "categories": [
        {"id": "ai", "branch": "stem", "name": {"en": "AI & SI technologies", "th": "AI และเทคโนโลยี SI"}},
        {"id": "coding", "branch": "stem", "name": {"en": "Coding, apps & Apple tech", "th": "โค้ดดิ้ง แอป และเทคโนโลยี Apple"}},
        {"id": "stem", "branch": "stem", "name": {"en": "STEM & innovation", "th": "STEM และนวัตกรรม"}},
        {"id": "research", "branch": "stem", "name": {"en": "Research & competitions", "th": "งานวิจัยและการแข่งขัน"}},
        {"id": "tcas", "branch": "tests", "name": {"en": "TCAS & Thai admissions", "th": "TCAS และการสอบเข้าในไทย"}},
        {"id": "sat", "branch": "tests", "name": {"en": "SAT", "th": "SAT"}},
        {"id": "ielts", "branch": "tests", "name": {"en": "IELTS & English tests", "th": "IELTS และการสอบภาษาอังกฤษ"}},
        {"id": "med", "branch": "tests", "name": {"en": "Medicine & health sciences", "th": "แพทย์และวิทยาศาสตร์สุขภาพ"}},
        {"id": "abroad", "branch": "tests", "name": {"en": "Higher education & study abroad", "th": "การศึกษาต่อและเรียนต่อต่างประเทศ"}},
        {"id": "scholar", "branch": "tests", "name": {"en": "Scholarships", "th": "ทุนการศึกษา"}},
    ],
    "allow": {
        "stem": ["nature.com", "science.org", "sciencedaily.com", "mit.edu", "stanford.edu", "nasa.gov", "esa.int", "ieee.org", "acm.org",
                 "arxiv.org", "developer.apple.com", "apple.com", "blog.google", "deepmind.google", "anthropic.com", "microsoft.com",
                 "unesco.org", "oecd.org", "nstda.or.th", "depa.or.th", "nia.or.th", "mhesi.go.th", "ipst.ac.th"],
        "tests": ["mytcas.com", "niets.or.th", "mhesi.go.th", "collegeboard.org", "ielts.org", "britishcouncil.org", "idp.com",
                  "cambridgeenglish.org", "ets.org", "ucat.ac.uk", "uat-uk.ac.uk", "ucas.com", "chula.ac.th", "mahidol.ac.th", "tu.ac.th",
                  "kmitl.ac.th", "kmutt.ac.th", "kmutnb.ac.th", "cmu.ac.th", "cra.ac.th", "pcm.ac.th", "ku.ac.th", "kku.ac.th", "psu.ac.th",
                  "studyinthailand.org", "ocsc.go.th", "fulbright.or.th", "chevening.org", "mext.go.jp", "studyinjapan.go.jp"],
    },
    "banned": ["ข้อสอบรั่ว", "leaked exam", "guaranteed score", "การันตีคะแนน", "รับประกันติด"],
    "tone": "Friendly, clear and accurate; written for Thai secondary students (M.1–M.6) and their parents. Explain terms simply. No hype.",
    "words": 600,
    "image": "photo-then-draw",
    "label": {"en": "Written with AI · checked by the DeepDistrict team", "th": "เรียบเรียงด้วย AI · ตรวจทานโดยทีม DeepDistrict"},
    "auto": {"enabled": False, "days": [1, 4], "hour": 9, "perRun": 1, "categories": [], "publish": []},
}


def init(con):
    con.executescript("""
    CREATE TABLE IF NOT EXISTS blog_posts (id TEXT PRIMARY KEY, slug TEXT UNIQUE NOT NULL, status TEXT NOT NULL, branch TEXT, category TEXT,
                                           published_at TEXT, updated_at TEXT NOT NULL, data TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS blog_pub ON blog_posts (status, published_at);
    """)


def now_iso():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


# ---------------------------------------------------------------- settings
def _bi(v, n):
    v = v if isinstance(v, dict) else {}
    return {"en": str(v.get("en") or "").strip()[:n], "th": str(v.get("th") or "").strip()[:n]}


def _domain(d):
    d = str(d or "").strip().lower()
    d = re.sub(r"^https?://", "", d).split("/")[0]
    d = d[4:] if d.startswith("www.") else d
    return d if re.fullmatch(r"[a-z0-9\-]+(\.[a-z0-9\-]+)+", d) else ""


def settings(con):
    r = con.execute("SELECT value FROM kv WHERE key='blog'").fetchone()
    cfg = json.loads(json.dumps(DEFAULT_SETTINGS))
    if r:
        saved = json.loads(r["value"])
        for k in DEFAULT_SETTINGS:
            if k in saved:
                cfg[k] = saved[k]
    return cfg


def save_settings(con, body):
    cfg = settings(con)
    if "enabled" in body:
        cfg["enabled"] = bool(body["enabled"])
    if isinstance(body.get("categories"), list):
        cats, seen = [], set()
        for c in body["categories"][:30]:
            cid = re.sub(r"[^a-z0-9\-]", "", str(c.get("id") or "").lower())[:20]
            if not cid or cid in seen or c.get("branch") not in BRANCHES:
                continue
            seen.add(cid)
            name = _bi(c.get("name"), 60)
            if not (name["en"] or name["th"]):
                raise ValueError("every category needs a name")
            cats.append({"id": cid, "branch": c["branch"], "name": name})
        for b in BRANCHES:
            if not any(c["branch"] == b for c in cats):
                raise ValueError("each branch needs at least one category")
        cfg["categories"] = cats
    if isinstance(body.get("allow"), dict):
        cfg["allow"] = {b: sorted({d for d in map(_domain, body["allow"].get(b) or []) if d})[:64] for b in BRANCHES}
    if isinstance(body.get("banned"), list):
        cfg["banned"] = [str(x).strip()[:80] for x in body["banned"] if str(x).strip()][:100]
    if "tone" in body:
        cfg["tone"] = str(body["tone"] or "").strip()[:800]
    if "words" in body:
        cfg["words"] = max(250, min(1500, int(body["words"] or 600)))
    if body.get("image") in IMAGE_MODES:
        cfg["image"] = body["image"]
    if isinstance(body.get("label"), dict):
        cfg["label"] = _bi(body["label"], 120)
    if isinstance(body.get("auto"), dict):
        a, ids = body["auto"], {c["id"] for c in cfg["categories"]}
        cfg["auto"] = {"enabled": bool(a.get("enabled")),
                       "days": sorted({int(d) for d in a.get("days") or [] if str(d).isdigit() and 0 <= int(d) <= 6}),
                       "hour": max(0, min(23, int(a.get("hour") or 0))),
                       "perRun": max(1, min(3, int(a.get("perRun") or 1))),
                       "categories": [c for c in a.get("categories") or [] if c in ids],
                       "publish": [c for c in a.get("publish") or [] if c in ids]}
    con.execute("INSERT INTO kv (key, value) VALUES ('blog', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", (json.dumps(cfg, ensure_ascii=False),))
    return cfg


def category(cfg, cid):
    return next((c for c in cfg["categories"] if c["id"] == cid), None)


# ---------------------------------------------------------------- posts
def _slugify(s):
    s = re.sub(r"[^a-z0-9]+", "-", str(s or "").lower()).strip("-")[:70].strip("-")
    return s


def unique_slug(con, want, pid):
    base = _slugify(want) or "post-" + pid[1:7]
    slug, n = base, 2
    while con.execute("SELECT 1 FROM blog_posts WHERE slug=? AND id!=?", (slug, pid)).fetchone():
        slug, n = f"{base}-{n}", n + 1
    return slug


def get(con, pid):
    r = con.execute("SELECT data FROM blog_posts WHERE id=?", (pid,)).fetchone()
    return json.loads(r["data"]) if r else None


def put(con, p):
    p["updatedAt"] = now_iso()
    con.execute("INSERT INTO blog_posts (id, slug, status, branch, category, published_at, updated_at, data) VALUES (?,?,?,?,?,?,?,?) "
                "ON CONFLICT(id) DO UPDATE SET slug=excluded.slug, status=excluded.status, branch=excluded.branch, category=excluded.category, "
                "published_at=excluded.published_at, updated_at=excluded.updated_at, data=excluded.data",
                (p["id"], p["slug"], p["status"], p.get("branch"), p.get("category"), p.get("publishedAt"), p["updatedAt"], json.dumps(p, ensure_ascii=False)))


def delete(con, pid):
    con.execute("DELETE FROM blog_posts WHERE id=?", (pid,))


def all_posts(con):
    return [json.loads(r["data"]) for r in con.execute("SELECT data FROM blog_posts ORDER BY updated_at DESC")]


def new_post(con, cfg, cat, by, topic="", scope=""):
    c = category(cfg, cat) or cfg["categories"][0]
    pid = "b" + secrets.token_hex(6)
    p = {"id": pid, "slug": "post-" + pid[1:], "status": "idea", "branch": c["branch"], "category": c["id"],
         "title": {"en": "", "th": ""}, "summary": {"en": "", "th": ""}, "body": {"en": "", "th": ""}, "tags": [], "sources": [],
         "cover": "", "coverKind": "", "coverCredit": None, "ai": {"used": False, "topic": str(topic)[:300], "scope": str(scope)[:1000]},
         "createdAt": now_iso(), "createdBy": by, "history": []}
    p["slug"] = unique_slug(con, p["slug"], pid)
    return p


def log(p, who, text):
    p.setdefault("history", []).insert(0, {"at": now_iso(), "by": who, "text": str(text)[:200]})
    del p["history"][40:]


def _sources(v):
    out = []
    for s in v if isinstance(v, list) else []:
        url = str((s or {}).get("url") or "").strip()[:500]
        if not url:
            continue
        out.append({"title": str(s.get("title") or "").strip()[:200], "url": url})
    return out[:20]


def clean_edit(p, body, cfg, check_cover):
    """Apply an editor's changes to post p (raises ValueError)."""
    if p["status"] == "drafting":
        raise ValueError("the AI is still writing this post — wait a moment")
    if body.get("category"):
        c = category(cfg, body["category"])
        if not c:
            raise ValueError("unknown category")
        p["category"], p["branch"] = c["id"], c["branch"]
    for k, n in (("title", 160), ("summary", 400), ("body", 20000)):
        if k in body:
            p[k] = _bi(body[k], n)
    if "tags" in body:
        p["tags"] = [str(t).strip()[:30] for t in (body["tags"] or []) if str(t).strip()][:10]
    if "sources" in body:
        p["sources"] = _sources(body["sources"])
    if "cover" in body:
        try:
            p["cover"] = check_cover(body["cover"])
        except Exception as e:
            raise ValueError(str(e))
        if not p["cover"]:
            p["coverKind"], p["coverCredit"] = "", None
        elif "coverKind" not in body and p.get("coverKind") not in ("photo", "drawing"):
            p["coverKind"] = "upload"
    if body.get("coverKind") in ("photo", "drawing", "upload", ""):
        p["coverKind"] = body["coverKind"]
    if "coverCredit" in body:
        cc = body["coverCredit"] if isinstance(body["coverCredit"], dict) else None
        p["coverCredit"] = {k: str(cc.get(k) or "")[:300] for k in ("title", "creator", "creatorUrl", "license", "licenseUrl", "source", "provider")} if cc else None
    if body.get("slug"):
        p["slug"] = body["slug"]
    return p


def words(text):
    return len(re.findall(r"\S+", text or ""))


def allowed(cfg, branch, url):
    try:
        host = urlparse(url).hostname or ""
    except ValueError:
        return False
    host = host[4:] if host.startswith("www.") else host
    doms = set(cfg["allow"].get("stem", [])) | set(cfg["allow"].get("tests", []))
    return any(host == d or host.endswith("." + d) for d in (cfg["allow"].get(branch) or doms))


def problems(p, cfg):
    """What stops this post from being published (empty list = OK)."""
    out = []
    for lang, name in (("th", "Thai"), ("en", "English")):
        if not p["title"].get(lang):
            out.append(f"{name} title missing")
        if words(p["body"].get(lang)) < 60 and len(p["body"].get(lang) or "") < 300:
            out.append(f"{name} text is too short")
    if p.get("ai", {}).get("used") and not p["sources"]:
        out.append("AI-written posts need at least one source")
    for s in p["sources"]:
        if not s["url"].startswith("https://"):
            out.append("sources must be https:// links")
            break
    text = " ".join([p["title"]["en"], p["title"]["th"], p["summary"]["en"], p["summary"]["th"], p["body"]["en"], p["body"]["th"]]).lower()
    for b in cfg.get("banned") or []:
        if b and b.lower() in text:
            out.append("contains a banned phrase: " + b)
    if p.get("coverKind") == "photo" and not (p.get("coverCredit") or {}).get("license"):
        out.append("photo cover needs its licence credit")
    return out


def set_status(p, to, cfg, who, publish_at=None):
    """Move a post to another status (raises ValueError)."""
    if to not in STATUSES or to in ("drafting", "idea"):
        raise ValueError("bad status")
    if p["status"] == "drafting":
        raise ValueError("the AI is still writing this post")
    if to in ("published", "scheduled"):
        bad = problems(p, cfg)
        if bad:
            raise ValueError("not ready to publish: " + "; ".join(bad))
    if to == "scheduled":
        try:
            when = datetime.strptime(str(publish_at or "")[:16], "%Y-%m-%dT%H:%M").replace(tzinfo=TZ)
        except ValueError:
            raise ValueError("give the publish date and time")
        if when <= datetime.now(TZ):
            raise ValueError("the publish time must be in the future")
        p["publishAt"] = when.strftime("%Y-%m-%dT%H:%M")
    if to == "published":
        p["publishedAt"] = p.get("publishedAt") or now_iso()
        p["reviewedBy"], p["reviewedAt"] = who, now_iso()
        p.pop("publishAt", None)
    if to == "scheduled":
        p["reviewedBy"], p["reviewedAt"] = who, now_iso()
    p["status"] = to
    log(p, who, "status → " + to + (" " + p["publishAt"] if to == "scheduled" else ""))
    return p


def publish_due(con, cfg):
    """Publish scheduled posts whose time has come. Returns how many."""
    stamp, n = datetime.now(TZ).strftime("%Y-%m-%dT%H:%M"), 0
    for r in con.execute("SELECT data FROM blog_posts WHERE status='scheduled'").fetchall():
        p = json.loads(r["data"])
        if p.get("publishAt") and p["publishAt"] <= stamp:
            if problems(p, cfg):
                p["status"] = "review"
                log(p, "system", "scheduled publish stopped: " + "; ".join(problems(p, cfg)))
            else:
                p["status"], p["publishedAt"] = "published", now_iso()
                log(p, "system", "published on schedule")
                n += 1
            put(con, p)
    return n


def auto_due(con, cfg):
    """True when the automatic writer should run now (once per scheduled day, from the set hour)."""
    a = cfg.get("auto") or {}
    if not a.get("enabled"):
        return False
    now = datetime.now(TZ)
    js_day = (now.weekday() + 1) % 7
    if a.get("days") and js_day not in a["days"]:
        return False
    if now.hour < int(a.get("hour") or 0):
        return False
    r = con.execute("SELECT value FROM kv WHERE key='blog_auto_last'").fetchone()
    return not r or json.loads(r["value"]) != now.strftime("%Y-%m-%d")


def mark_auto_ran(con):
    con.execute("INSERT INTO kv (key, value) VALUES ('blog_auto_last', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
                (json.dumps(datetime.now(TZ).strftime("%Y-%m-%d")),))


def next_auto_categories(con, cfg):
    a = cfg["auto"]
    pool = a.get("categories") or [c["id"] for c in cfg["categories"]]
    r = con.execute("SELECT value FROM kv WHERE key='blog_auto_turn'").fetchone()
    turn = json.loads(r["value"]) if r else 0
    picks = [pool[(turn + i) % len(pool)] for i in range(min(a.get("perRun", 1), len(pool)))]
    con.execute("INSERT INTO kv (key, value) VALUES ('blog_auto_turn', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", (json.dumps(turn + len(picks)),))
    return picks


# ---------------------------------------------------------------- AI writing
def write_system(cfg, branch):
    b = BRANCHES[branch]["en"]
    return (
        "You write news articles for the DeepDistrict.si blog, an education centre in Bangkok that teaches STEM, AI, coding, "
        "Maths, Physics and English, and prepares students for SAT, IELTS, TCAS and university admissions. "
        f"This article belongs to the branch '{b}'.\n"
        f"Tone: {cfg.get('tone')}\n"
        "Rules:\n"
        "1. Research with the web search tool first. Use only recent, reliable information you actually found; never invent "
        "dates, scores, deadlines, numbers, names or quotes. If something is not confirmed, say so and tell readers to check the official site.\n"
        "2. Write in your own words. Do not copy sentences from sources; short quotes only, with credit. Do not reproduce test questions.\n"
        "3. Write the article in Thai AND English (two separate versions with the same facts, each natural in its language).\n"
        f"4. About {cfg.get('words', 600)} words per language. Use short paragraphs, '## ' sub-headings, '- ' bullet lists and **bold** sparingly. "
        "No HTML. Links as [text](https://…).\n"
        "5. End each version with a short 'What this means for students' section and a line inviting readers to ask DeepDistrict staff.\n"
        "6. No guarantees of scores or admission; no exam leaks or rumours; nothing about politics or religion.\n"
        "Finish your reply with ONE ```json block and nothing after it:\n"
        '{"title":{"th":"","en":""},"summary":{"th":"","en":""},"body":{"th":"","en":""},"tags":["…"],'
        '"sources":[{"title":"","url":"https://…"}],"imageQuery":"2-5 English words for a free stock photo","slug":"short-english-slug"}\n'
        "List in sources only pages you actually opened in your searches."
    )


def write_prompt(cfg, cat, topic, scope, recent):
    c = category(cfg, cat)
    name = c["name"]["en"] if c else cat
    today = datetime.now(TZ).strftime("%d %B %Y")
    head = f"Today is {today} (Bangkok). Category: {name}.\n"
    if topic:
        return head + f"Topic: {topic}\n" + (f"Scope and points to cover: {scope}\n" if scope else "") + "Write the article."
    lst = "\n".join("- " + t for t in recent[:15]) or "- (none yet)"
    return (head + "Choose ONE newsworthy topic from the last 30 days in this category that matters to Thai secondary "
            "students or their parents, and that has not been covered in these recent posts:\n" + lst + "\nThen write the article.")


def apply_ai(p, data, found, cfg):
    """Fill post p from the AI answer. Keeps only sources the search really returned (or allowed sites)."""
    if not isinstance(data, dict):
        raise ValueError("the AI did not return the article in the expected format")
    for k, n in (("title", 160), ("summary", 400), ("body", 20000)):
        p[k] = _bi(data.get(k), n)
    p["tags"] = [str(t).strip()[:30] for t in (data.get("tags") or []) if str(t).strip()][:8]
    seen = {s["url"].rstrip("/") for s in found}
    keep = []
    for s in _sources(data.get("sources")) + [s for s in found if not s.get("seen")]:
        u = s["url"].split("#")[0]
        if u.startswith("https://") and (u.rstrip("/") in seen) and allowed(cfg, p["branch"], u) and u not in [k["url"] for k in keep]:
            keep.append({"title": s["title"] or u, "url": u})
    p["sources"] = keep[:12]
    p["ai"]["imageQuery"] = str(data.get("imageQuery") or "")[:80]
    p["ai"]["used"] = True
    if data.get("slug"):
        p["_wantSlug"] = str(data["slug"])[:70]
    return p


# ---------------------------------------------------------------- public view
def public(p, cfg, full=True):
    c = category(cfg, p.get("category"))
    out = {k: p.get(k) for k in ("id", "slug", "branch", "category", "title", "summary", "tags", "cover", "coverKind", "coverCredit", "publishedAt", "updatedAt")}
    out["categoryName"] = c["name"] if c else {"en": p.get("category"), "th": p.get("category")}
    out["aiLabel"] = cfg["label"] if p.get("ai", {}).get("used") else None
    out["reviewedAt"] = p.get("reviewedAt")
    if full:
        out["body"], out["sources"] = p["body"], p["sources"]
    return out


def public_list(con, cfg, branch=None, cat=None, limit=12, offset=0):
    q, args = "SELECT data FROM blog_posts WHERE status='published'", []
    if branch in BRANCHES:
        q += " AND branch=?"; args.append(branch)
    if cat:
        q += " AND category=?"; args.append(cat)
    total = con.execute(q.replace("SELECT data", "SELECT COUNT(*)"), args).fetchone()[0]
    rows = con.execute(q + " ORDER BY published_at DESC LIMIT ? OFFSET ?", args + [limit, offset]).fetchall()
    return {"items": [public(json.loads(r["data"]), cfg, full=False) for r in rows], "total": total,
            "branches": BRANCHES, "categories": cfg["categories"]}


def public_get(con, cfg, slug):
    r = con.execute("SELECT data FROM blog_posts WHERE slug=? AND status='published'", (str(slug)[:80],)).fetchone()
    return public(json.loads(r["data"]), cfg) if r else None
