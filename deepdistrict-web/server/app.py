#!/usr/bin/env python3
"""DeepDistrict back-office server.

One small WSGI application, Python standard library only:
  * serves the public website and the back office (static files)
  * JSON API under /api/ with sign-in for admins, teachers, students and parents
  * stores data in SQLite (server/data/deepdistrict.db) and keeps daily backups

Run locally:   python3 server/app.py            -> http://localhost:8000
On your LAN:   python3 server/app.py --lan      -> other devices use http://<this-pc-ip>:8000
Hosting:       any WSGI host (e.g. PythonAnywhere) -> see server/wsgi.py and server/DEPLOY.md
"""

import hashlib
import hmac
import json
import mimetypes
import os
import secrets
import shutil
import sqlite3
import sys
import threading
import time
from datetime import datetime, timezone
from http.cookies import SimpleCookie
from pathlib import Path
from socketserver import ThreadingMixIn
from wsgiref.simple_server import WSGIRequestHandler, WSGIServer, make_server

ROOT = Path(__file__).resolve().parent.parent          # deepdistrict-web/
DATA_DIR = Path(os.environ.get("DD_DATA_DIR", Path(__file__).resolve().parent / "data"))
DB_PATH = Path(os.environ.get("DD_DB", DATA_DIR / "deepdistrict.db"))
BACKUP_DIR = DATA_DIR / "backups"
SESSION_HOURS = 12
PBKDF2_ROUNDS = 200_000
COLLECTIONS = ("users", "enrolments", "sessions", "payments", "requests")
KV_KEYS = ("org", "courseOverrides", "customCourses")
STATIC_DIRS = ("assets", "pages", "admin")
STAFF = ("admin", "teacher")
MAX_BODY = 5 * 1024 * 1024

DEFAULT_ORG = {"name": "DeepDistrict.si", "address": "Bangkok, Thailand", "email": "info@deepdistrict.si", "phone": "",
               "taxId": "", "currency": "THB", "rate": 800, "lowHours": 2, "noShowCounts": True}

_lock = threading.Lock()
_login_fail = {}   # key -> [count, first_ts]


# ---------------------------------------------------------------- database
def db():
    con = sqlite3.connect(DB_PATH, timeout=10)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA journal_mode=WAL")
    con.execute("PRAGMA foreign_keys=ON")
    return con


def init_db():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with db() as con:
        con.executescript("""
        CREATE TABLE IF NOT EXISTS records (col TEXT NOT NULL, id TEXT NOT NULL, data TEXT NOT NULL,
                                            updated_at TEXT NOT NULL, updated_by TEXT, PRIMARY KEY (col, id));
        CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS credentials (user_id TEXT PRIMARY KEY, salt TEXT NOT NULL, hash TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS auth_sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires REAL NOT NULL);
        CREATE TABLE IF NOT EXISTS audit (at TEXT NOT NULL, user_id TEXT, user_name TEXT, text TEXT NOT NULL);
        """)


def now_iso():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def load_col(con, col):
    return [json.loads(r["data"]) for r in con.execute("SELECT data FROM records WHERE col=?", (col,))]


def get_rec(con, col, rid):
    r = con.execute("SELECT data FROM records WHERE col=? AND id=?", (col, rid)).fetchone()
    return json.loads(r["data"]) if r else None


def put_rec(con, col, rec, by):
    con.execute("INSERT INTO records (col, id, data, updated_at, updated_by) VALUES (?,?,?,?,?) "
                "ON CONFLICT(col, id) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at, updated_by=excluded.updated_by",
                (col, rec["id"], json.dumps(rec, ensure_ascii=False), now_iso(), by))


def del_rec(con, col, rid):
    con.execute("DELETE FROM records WHERE col=? AND id=?", (col, rid))


def get_kv(con, key, default):
    r = con.execute("SELECT value FROM kv WHERE key=?", (key,)).fetchone()
    return json.loads(r["value"]) if r else default


def set_kv(con, key, value):
    con.execute("INSERT INTO kv (key, value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
                (key, json.dumps(value, ensure_ascii=False)))


def audit(con, user, text):
    con.execute("INSERT INTO audit (at, user_id, user_name, text) VALUES (?,?,?,?)",
                (now_iso(), user and user["id"], user and user.get("name"), str(text)[:500]))


def daily_backup():
    """Copy the database once per day; keep the last 30 copies."""
    if not DB_PATH.exists():
        return
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    target = BACKUP_DIR / f"deepdistrict-{datetime.now():%Y-%m-%d}.db"
    if target.exists():
        return
    src = sqlite3.connect(DB_PATH)
    dst = sqlite3.connect(target)
    with dst:
        src.backup(dst)
    src.close(); dst.close()
    for old in sorted(BACKUP_DIR.glob("deepdistrict-*.db"))[:-30]:
        old.unlink()


# ---------------------------------------------------------------- passwords & sessions
def hash_pw(password, salt=None):
    salt = salt or secrets.token_hex(16)
    h = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), PBKDF2_ROUNDS).hex()
    return salt, h


def set_password(con, uid, password):
    salt, h = hash_pw(password)
    con.execute("INSERT INTO credentials (user_id, salt, hash) VALUES (?,?,?) "
                "ON CONFLICT(user_id) DO UPDATE SET salt=excluded.salt, hash=excluded.hash", (uid, salt, h))
    con.execute("DELETE FROM auth_sessions WHERE user_id=?", (uid,))   # sign out everywhere


def check_password(con, uid, password):
    r = con.execute("SELECT salt, hash FROM credentials WHERE user_id=?", (uid,)).fetchone()
    return bool(r) and hmac.compare_digest(hash_pw(password, r["salt"])[1], r["hash"])


def token_hash(t):
    return hashlib.sha256(t.encode()).hexdigest()


def new_session(con, uid):
    t = secrets.token_urlsafe(32)
    con.execute("DELETE FROM auth_sessions WHERE expires < ?", (time.time(),))
    con.execute("INSERT INTO auth_sessions (token_hash, user_id, expires) VALUES (?,?,?)",
                (token_hash(t), uid, time.time() + SESSION_HOURS * 3600))
    return t


def session_user(con, environ):
    c = SimpleCookie(environ.get("HTTP_COOKIE", ""))
    if "dd_session" not in c:
        return None
    r = con.execute("SELECT user_id, expires FROM auth_sessions WHERE token_hash=?", (token_hash(c["dd_session"].value),)).fetchone()
    if not r or r["expires"] < time.time():
        return None
    u = get_rec(con, "users", r["user_id"])
    return u if u and u.get("active", True) is not False else None


def too_many_attempts(key):
    n, first = _login_fail.get(key, (0, time.time()))
    if time.time() - first > 900:
        _login_fail.pop(key, None)
        return False
    return n >= 8


def note_failure(key):
    n, first = _login_fail.get(key, (0, time.time()))
    _login_fail[key] = (n + 1, first)


# ---------------------------------------------------------------- what each person may see
def public_user(u, full=True):
    if full:
        return dict(u)
    return {k: u.get(k) for k in ("id", "name", "nick", "role")}


def scope(con, me):
    """Return the data this person is allowed to see."""
    users = {u["id"]: u for u in load_col(con, "users")}
    enrs = load_col(con, "enrolments")
    has_login = {r["user_id"] for r in con.execute("SELECT user_id FROM credentials")}
    role = me["role"]
    if role == "admin":
        my_enrs = enrs
    elif role == "teacher":
        my_enrs = [e for e in enrs if e.get("teacherId") == me["id"]]
    elif role == "parent":
        kids = {u["id"] for u in users.values() if u.get("guardianId") == me["id"]}
        my_enrs = [e for e in enrs if e.get("studentId") in kids]
    else:
        my_enrs = [e for e in enrs if e.get("studentId") == me["id"]]
    eids = {e["id"] for e in my_enrs}
    out = {
        "enrolments": my_enrs,
        "sessions": [s for s in load_col(con, "sessions") if s.get("enrolmentId") in eids],
        "payments": [p for p in load_col(con, "payments") if p.get("enrolmentId") in eids] if role != "teacher" else [],
        "requests": [r for r in load_col(con, "requests") if r.get("enrolmentId") in eids],
    }
    if role == "admin":
        visible = list(users.values())
        full_ids = set(users)
    else:
        full_ids = {me["id"]} | {e.get("studentId") for e in my_enrs}
        if role == "parent":
            full_ids |= {u["id"] for u in users.values() if u.get("guardianId") == me["id"]}
        if role == "teacher":
            full_ids |= {users[s].get("guardianId") for s in list(full_ids) if s in users and users[s].get("guardianId")}
            full_ids |= {u["id"] for u in users.values() if u.get("role") in ("student", "parent") and u.get("createdBy") == me["id"]}
        name_ids = {e.get("teacherId") for e in my_enrs} | {users[s].get("guardianId") for s in full_ids if s in users}
        if role == "teacher":
            name_ids |= {u["id"] for u in users.values() if u.get("role") in STAFF}
        visible = [u for uid, u in users.items() if uid in full_ids or uid in name_ids]
    out["users"] = [dict(public_user(u, u["id"] in full_ids), hasLogin=u["id"] in has_login) for u in visible]
    return out


# ---------------------------------------------------------------- write permissions
class Denied(Exception):
    pass


def can_write(con, me, col, new, old):
    role = me["role"]
    if role == "admin":
        if col == "users" and old and old["id"] == me["id"] and new and new.get("role") != "admin":
            admins = [u for u in load_col(con, "users") if u.get("role") == "admin" and u.get("active", True)]
            if len(admins) < 2:
                raise Denied("keep at least one admin")
        return True
    rec = new or old
    if col == "users":
        if role != "teacher":
            raise Denied("read only")
        if old and old.get("role") in STAFF or new and new.get("role") in STAFF:
            raise Denied("staff accounts are managed by an admin")
        if new is None:
            raise Denied("only admins delete people")
        return True
    if col == "sessions":
        if role != "teacher":
            raise Denied("read only")
        for s in (old, new):
            if s:
                e = get_rec(con, "enrolments", s.get("enrolmentId"))
                if not e or e.get("teacherId") != me["id"]:
                    raise Denied("not your student")
        return True
    if col == "requests":
        e = get_rec(con, "enrolments", rec.get("enrolmentId"))
        if not e:
            raise Denied("unknown enrolment")
        if role == "teacher":
            if e.get("teacherId") != me["id"]:
                raise Denied("not your student")
            return True
        mine = e.get("studentId") == me["id"] or (role == "parent" and (get_rec(con, "users", e.get("studentId")) or {}).get("guardianId") == me["id"])
        if not mine:
            raise Denied("not your enrolment")
        if old and old.get("createdBy") != me["id"]:
            raise Denied("not your request")
        if new and (new.get("status", "pending") not in ("pending", "withdrawn") or (old and old.get("status") != "pending")):
            raise Denied("only staff decide requests")
        if new is None:
            raise Denied("withdraw instead of deleting")
        return True
    raise Denied("read only")


def apply_sync(con, me, body):
    """Apply a batch of changes from the browser after checking every one of them."""
    changed = 0
    for col in COLLECTIONS:
        for rec in (body.get("upserts", {}).get(col) or []):
            if not isinstance(rec, dict) or not rec.get("id"):
                raise Denied("bad record")
            rec = dict(rec)
            pw = rec.pop("password", None)
            for k in ("pass", "hasLogin"):
                rec.pop(k, None)
            old = get_rec(con, col, rec["id"])
            if col == "requests" and not old:
                rec["createdBy"] = me["id"]
            if col == "users" and not old and me["role"] == "teacher":
                rec["createdBy"] = me["id"]
            can_write(con, me, col, rec, old)
            if col == "users" and pw:
                if me["role"] != "admin":
                    raise Denied("only admins set passwords")
                if len(pw) < 8:
                    raise Denied("password too short")
                if not rec.get("email"):
                    raise Denied("an email is needed to sign in")
                set_password(con, rec["id"], pw)
            if col == "users" and rec.get("email"):
                dup = [u for u in load_col(con, "users") if u["id"] != rec["id"] and (u.get("email") or "").lower() == rec["email"].lower()]
                if dup:
                    raise Denied("email already used")
            if col == "users" and rec.get("active") is False:
                con.execute("DELETE FROM auth_sessions WHERE user_id=?", (rec["id"],))
            put_rec(con, col, rec, me["id"])
            changed += 1
        for rid in (body.get("deletes", {}).get(col) or []):
            old = get_rec(con, col, rid)
            if not old:
                continue
            can_write(con, me, col, None, old)
            del_rec(con, col, rid)
            if col == "users":
                con.execute("DELETE FROM credentials WHERE user_id=?", (rid,))
                con.execute("DELETE FROM auth_sessions WHERE user_id=?", (rid,))
            changed += 1
    for key in KV_KEYS:
        if key in body:
            if me["role"] != "admin":
                raise Denied("settings are admin only")
            set_kv(con, key, body[key])
            changed += 1
    for text in (body.get("log") or [])[:50]:
        audit(con, me, text)
    return changed


def bootstrap(con, me):
    data = scope(con, me)
    data["org"] = get_kv(con, "org", DEFAULT_ORG)
    data["courseOverrides"] = get_kv(con, "courseOverrides", {})
    data["customCourses"] = get_kv(con, "customCourses", [])
    data["log"] = [dict(r) for r in con.execute("SELECT at, user_name AS by, text FROM audit ORDER BY rowid DESC LIMIT 200")] if me["role"] == "admin" else []
    data["me"] = dict(public_user(me), hasLogin=True)
    data["v"] = 1
    data["serverTime"] = now_iso()
    return data


# ---------------------------------------------------------------- HTTP
SECURITY_HEADERS = [
    ("X-Content-Type-Options", "nosniff"),
    ("Referrer-Policy", "strict-origin-when-cross-origin"),
    ("X-Frame-Options", "SAMEORIGIN"),
]


def respond(start, status, body=b"", ctype="application/json; charset=utf-8", extra=None):
    if isinstance(body, (dict, list)):
        body = json.dumps(body, ensure_ascii=False).encode()
    elif isinstance(body, str):
        body = body.encode()
    headers = [("Content-Type", ctype), ("Content-Length", str(len(body)))] + SECURITY_HEADERS + (extra or [])
    start(status, headers)
    return [body]


def cookie(environ, token, clear=False):
    secure = environ.get("wsgi.url_scheme") == "https" or environ.get("HTTP_X_FORWARDED_PROTO") == "https"
    v = f"dd_session={'' if clear else token}; Path=/; HttpOnly; SameSite=Strict" + ("; Secure" if secure else "")
    v += "; Max-Age=0" if clear else f"; Max-Age={SESSION_HOURS * 3600}"
    return ("Set-Cookie", v)


def read_json(environ):
    try:
        n = int(environ.get("CONTENT_LENGTH") or 0)
    except ValueError:
        n = 0
    if n > MAX_BODY:
        raise ValueError("too large")
    raw = environ["wsgi.input"].read(n) if n else b"{}"
    return json.loads(raw or b"{}")


def api(environ, start, path):
    method = environ["REQUEST_METHOD"]
    if method == "POST" and environ.get("HTTP_X_DD") != "1":       # blocks cross-site form posts (CSRF)
        return respond(start, "403 Forbidden", {"error": "missing header"})
    try:
        body = read_json(environ) if method == "POST" else {}
    except (ValueError, json.JSONDecodeError):
        return respond(start, "400 Bad Request", {"error": "bad json"})
    with _lock, db() as con:
        me = session_user(con, environ)
        has_admin = any(u.get("role") == "admin" for u in load_col(con, "users"))

        if path == "status":
            return respond(start, "200 OK", {"ok": True, "setup": not has_admin, "signedIn": bool(me)})

        if path == "setup" and method == "POST":
            if has_admin:
                return respond(start, "409 Conflict", {"error": "already set up"})
            name, email, pw = (body.get("name") or "").strip(), (body.get("email") or "").strip(), body.get("password") or ""
            if not name or "@" not in email or len(pw) < 8:
                return respond(start, "400 Bad Request", {"error": "name, email and an 8+ character password are required"})
            u = {"id": "u" + secrets.token_hex(6), "role": "admin", "name": name, "email": email, "active": True, "createdAt": now_iso()}
            put_rec(con, "users", u, u["id"]); set_password(con, u["id"], pw)
            set_kv(con, "org", DEFAULT_ORG)
            audit(con, u, "Back office set up")
            return respond(start, "200 OK", {"ok": True}, extra=[cookie(environ, new_session(con, u["id"]))])

        if path == "login" and method == "POST":
            email = (body.get("email") or "").strip().lower()
            key = (environ.get("REMOTE_ADDR", ""), email)
            if too_many_attempts(key):
                return respond(start, "429 Too Many Requests", {"error": "too many attempts, try again in 15 minutes"})
            u = next((x for x in load_col(con, "users") if (x.get("email") or "").lower() == email and x.get("active", True) is not False), None)
            if not u or not check_password(con, u["id"], body.get("password") or ""):
                note_failure(key)
                return respond(start, "401 Unauthorized", {"error": "wrong email or password"})
            _login_fail.pop(key, None)
            audit(con, u, "Signed in")
            return respond(start, "200 OK", {"ok": True}, extra=[cookie(environ, new_session(con, u["id"]))])

        if path == "logout" and method == "POST":
            c = SimpleCookie(environ.get("HTTP_COOKIE", ""))
            if "dd_session" in c:
                con.execute("DELETE FROM auth_sessions WHERE token_hash=?", (token_hash(c["dd_session"].value),))
            return respond(start, "200 OK", {"ok": True}, extra=[cookie(environ, "", clear=True)])

        if not me:
            return respond(start, "401 Unauthorized", {"error": "sign in required"})

        if path == "bootstrap" and method == "GET":
            return respond(start, "200 OK", bootstrap(con, me))

        if path == "sync" and method == "POST":
            try:
                n = apply_sync(con, me, body)
            except Denied as e:
                con.rollback()
                return respond(start, "403 Forbidden", {"error": str(e)})
            return respond(start, "200 OK", {"ok": True, "changed": n})

        if path == "password" and method == "POST":
            if not check_password(con, me["id"], body.get("old") or ""):
                return respond(start, "400 Bad Request", {"error": "current password is wrong"})
            if len(body.get("new") or "") < 8:
                return respond(start, "400 Bad Request", {"error": "password too short"})
            set_password(con, me["id"], body["new"]); audit(con, me, "Changed own password")
            return respond(start, "200 OK", {"ok": True}, extra=[cookie(environ, new_session(con, me["id"]))])

        if me["role"] != "admin":
            return respond(start, "403 Forbidden", {"error": "admin only"})

        if path == "backup" and method == "GET":
            data = {"v": 1, "exportedAt": now_iso(), "org": get_kv(con, "org", DEFAULT_ORG),
                    "courseOverrides": get_kv(con, "courseOverrides", {}), "customCourses": get_kv(con, "customCourses", [])}
            for col in COLLECTIONS:
                data[col] = load_col(con, col)
            data["credentials"] = [dict(r) for r in con.execute("SELECT user_id, salt, hash FROM credentials")]
            audit(con, me, "Exported backup")
            return respond(start, "200 OK", data, extra=[("Content-Disposition", f'attachment; filename="deepdistrict-backup-{datetime.now():%Y-%m-%d}.json"')])

        if path == "restore" and method == "POST":
            if body.get("v") != 1 or not isinstance(body.get("users"), list):
                return respond(start, "400 Bad Request", {"error": "not a backup file"})
            if not any(u.get("role") == "admin" for u in body["users"]):
                return respond(start, "400 Bad Request", {"error": "backup has no admin"})
            daily_backup()
            con.execute("DELETE FROM records"); con.execute("DELETE FROM credentials")
            for col in COLLECTIONS:
                for rec in body.get(col) or []:
                    rec.pop("pass", None); rec.pop("hasLogin", None)
                    put_rec(con, col, rec, me["id"])
            for c in body.get("credentials") or []:
                con.execute("INSERT INTO credentials (user_id, salt, hash) VALUES (?,?,?)", (c["user_id"], c["salt"], c["hash"]))
            for key in KV_KEYS:
                if key in body:
                    set_kv(con, key, body[key])
            con.execute("DELETE FROM auth_sessions WHERE user_id != ?", (me["id"],))
            audit(con, me, "Restored backup")
            return respond(start, "200 OK", {"ok": True})

        if path == "erase" and method == "POST":
            if body.get("confirm") != "ERASE":
                return respond(start, "400 Bad Request", {"error": "confirmation missing"})
            daily_backup()
            for t in ("records", "kv", "credentials", "auth_sessions", "audit"):
                con.execute(f"DELETE FROM {t}")
            return respond(start, "200 OK", {"ok": True}, extra=[cookie(environ, "", clear=True)])

    return respond(start, "404 Not Found", {"error": "unknown endpoint"})


def static(environ, start, path):
    rel = path.lstrip("/") or "index.html"
    if rel.endswith("/"):
        rel += "index.html"
    parts = Path(rel).parts
    allowed = (len(parts) == 1 and rel.endswith(".html")) or (parts and parts[0] in STATIC_DIRS)
    target = (ROOT / rel).resolve()
    if not allowed or ROOT not in target.parents or any(p.startswith(".") for p in parts):
        return respond(start, "404 Not Found", "Not found", "text/plain; charset=utf-8")
    if target.is_dir():
        target = target / "index.html"
    if not target.is_file():
        return respond(start, "404 Not Found", "Not found", "text/plain; charset=utf-8")
    ctype = mimetypes.guess_type(target.name)[0] or "application/octet-stream"
    if ctype.startswith("text/") or ctype in ("application/javascript", "image/svg+xml", "application/json"):
        ctype += "; charset=utf-8"
    cache = [("Cache-Control", "no-cache")] if target.suffix in (".html", ".js", ".css") else [("Cache-Control", "public, max-age=86400")]
    return respond(start, "200 OK", target.read_bytes(), ctype, cache)


def application(environ, start):
    path = environ.get("PATH_INFO", "/")
    try:
        if path.startswith("/api/"):
            return api(environ, start, path[5:].strip("/"))
        if environ["REQUEST_METHOD"] not in ("GET", "HEAD"):
            return respond(start, "405 Method Not Allowed", "", "text/plain")
        return static(environ, start, path)
    except Exception as e:  # never leak a stack trace to the browser
        print("ERROR", path, repr(e), file=sys.stderr)
        return respond(start, "500 Internal Server Error", {"error": "server error"})


mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("font/woff2", ".woff2")
init_db()


class ThreadingServer(ThreadingMixIn, WSGIServer):
    daemon_threads = True


class QuietHandler(WSGIRequestHandler):
    def log_request(self, code="-", size="-"):
        if str(code)[0] in "45" and "/api/" in self.path:
            super().log_request(code, size)


def main():
    lan = "--lan" in sys.argv
    port = int(next((a for a in sys.argv[1:] if a.isdigit()), os.environ.get("PORT", 8000)))
    host = "0.0.0.0" if lan else "127.0.0.1"
    daily_backup()
    httpd = make_server(host, port, application, server_class=ThreadingServer, handler_class=QuietHandler)
    print(f"DeepDistrict running:  website  http://localhost:{port}/   back office  http://localhost:{port}/admin/")
    print(f"Data: {DB_PATH}")
    if lan:
        print("LAN mode: other devices on this network can open http://<this computer's IP>:%d/ — traffic is not encrypted." % port)
    print("Press Ctrl+C to stop.")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
