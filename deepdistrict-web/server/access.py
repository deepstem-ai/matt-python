"""Who may open which back-office page.

Every page is listed in the menu for everyone (pages a person may not open show a lock and the level
they need). Each page has a ceiling — the highest set of roles the code allows — and the admin can
take roles away from a page in Settings → Menu & permissions, but never add a role above the ceiling.
Admins always keep every page, so nobody can lock the centre out.

The rules are enforced on the server for the online-test, live-class, document, blog and AI routes
(see API below); core records (people, lessons, payments) keep their own server-side role rules.
"""

import json

ROLES = ("admin", "teacher", "student", "parent")
ALL, STAFF, LEARNER, ADMIN = list(ROLES), ["admin", "teacher"], ["student", "parent"], ["admin"]

# page → (group, ceiling)
PAGES = {
    "home": ("learn", LEARNER), "calendar": ("learn", ALL), "requests": ("learn", ALL), "inbox": ("learn", ALL),
    "tests": ("learn", ALL),
    "dashboard": ("teach", STAFF), "enrolments": ("teach", STAFF), "sessions": ("teach", STAFF), "people": ("teach", STAFF),
    "bank": ("teach", STAFF), "sets": ("teach", STAFF), "live": ("teach", STAFF), "marking": ("teach", STAFF),
    "docs": ("teach", STAFF), "search": ("teach", STAFF),
    "payments": ("admin", ADMIN), "courses": ("admin", ADMIN), "content": ("admin", ADMIN), "popups": ("admin", ADMIN),
    "blog": ("admin", ADMIN), "ai": ("admin", ADMIN),
    "reports": ("general", ALL), "settings": ("general", ALL),
}
ALWAYS = {"settings", "home"}          # a person can always reach their own account and start page

# API path → page it belongs to (checked before the route runs)
API = [
    (("exam/start",), "tests"),
    (("exam/bank", "exam/item", "exam/settings", "exam/stats", "exam/calibrate", "exam/sets-load"), "bank"),
    (("exam/marking", "exam/mark", "exam/feedback"), "marking"),
    (("qset/",), "sets"),
    (("live/create", "live/list", "live/host", "live/control", "live/share"), "live"),
    (("doc/paper", "doc/list", "doc/revoke"), "docs"),
    (("blog-admin", "blog/photos"), "blog"),
    (("ai-admin",), "ai"),
]
DEFAULT = {"remove": {}, "showLocked": True}


def settings(con):
    r = con.execute("SELECT value FROM kv WHERE key='access'").fetchone()
    cfg = json.loads(json.dumps(DEFAULT))
    if r:
        v = json.loads(r["value"])
        cfg["showLocked"] = bool(v.get("showLocked", True))
        cfg["remove"] = {p: [x for x in rs if x in PAGES[p][1] and x != "admin"] for p, rs in (v.get("remove") or {}).items() if p in PAGES and p not in ALWAYS}
    return cfg


def save(con, body):
    remove = {}
    for p, rs in (body.get("remove") or {}).items():
        if p in PAGES and p not in ALWAYS and isinstance(rs, list):
            keep = sorted({x for x in rs if x in PAGES[p][1] and x != "admin"})
            if keep:
                remove[p] = keep
    v = {"remove": remove, "showLocked": bool(body.get("showLocked", True))}
    con.execute("INSERT INTO kv (key, value) VALUES ('access', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", (json.dumps(v),))
    return settings(con)


def roles_for(cfg, page):
    if page not in PAGES:
        return list(ROLES)
    return [r for r in PAGES[page][1] if r == "admin" or page in ALWAYS or r not in cfg["remove"].get(page, [])]


def allowed(cfg, role, page):
    return role in roles_for(cfg, page)


def page_of(path):
    for prefixes, page in API:
        if path.startswith(prefixes):
            return page
    return None


def matrix(cfg):
    """What the browser needs to draw the menu and the settings table."""
    return {"pages": {p: {"group": g, "ceiling": c, "roles": roles_for(cfg, p), "fixed": p in ALWAYS} for p, (g, c) in PAGES.items()},
            "showLocked": cfg["showLocked"]}
