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
import re
import mimetypes
import webbrowser
import os
import secrets
import base64
import shutil
import smtplib
import ssl
from email.message import EmailMessage
import sqlite3
import sys
import threading
import time
from datetime import datetime, timedelta, timezone
from http.cookies import SimpleCookie
from pathlib import Path
from socketserver import ThreadingMixIn
from urllib.parse import parse_qs
from wsgiref.simple_server import WSGIRequestHandler, WSGIServer, make_server

sys.path.insert(0, str(Path(__file__).resolve().parent))
import notify  # noqa: E402
import popups  # noqa: E402
import learning  # noqa: E402  (AI news blog + SAT / IELTS exams)
import access  # noqa: E402  (menu & permissions by role)
import history  # noqa: E402  (every version and every removed row is kept)
import example_data  # noqa: E402  (5 example learners, tagged)

VERSION = (Path(__file__).resolve().parent.parent / "VERSION").read_text(encoding="utf-8").strip() if (Path(__file__).resolve().parent.parent / "VERSION").exists() else "dev"

ROOT = Path(__file__).resolve().parent.parent          # deepdistrict-web/
DATA_DIR = Path(os.environ.get("DD_DATA_DIR", Path(__file__).resolve().parent / "data"))
DB_PATH = Path(os.environ.get("DD_DB", DATA_DIR / "deepdistrict.db"))
BACKUP_DIR = DATA_DIR / "backups"
# a second copy outside the website folder, so replacing the folder with a new version can never lose data
SAFE_DIR = Path(os.environ.get("DD_SAFE_DIR", Path.home() / "deepdistrict-safe-copies"))
SESSION_HOURS = 12
PBKDF2_ROUNDS = 600_000          # OWASP 2023 level for PBKDF2-HMAC-SHA256; older hashes are upgraded at sign-in
COLLECTIONS = ("users", "enrolments", "sessions", "payments", "requests")
KV_KEYS = ("org", "courseOverrides", "customCourses", "prepCatalog", "pathways")   # prepCatalog/pathways: None = website defaults
STATIC_DIRS = ("assets", "pages", "admin")
STAFF = ("admin", "teacher")
MAX_BODY = 15 * 1024 * 1024

DEFAULT_ORG = {"name": "DeepDistrict.si", "address": "Bangkok, Thailand", "email": "info@deepdistrict.si", "phone": "",
               "taxId": "", "currency": "THB", "rate": 800, "lowHours": 2, "noShowCounts": True, "teachersApprove": False}

_lock = threading.Lock()
_login_fail = {}   # key -> [count, first_ts]


# ---------------------------------------------------------------- database
def db():
    con = sqlite3.connect(DB_PATH, timeout=10)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA journal_mode=WAL")
    con.execute("PRAGMA foreign_keys=ON")
    return con


def recover_if_missing():
    """A new install of the code with no database yet: bring back the newest safe copy, if there is one."""
    if DB_PATH.exists() or os.environ.get("DD_NO_RECOVER") == "1":
        return
    copies = sorted(SAFE_DIR.glob("deepdistrict-*.db")) if SAFE_DIR.is_dir() and "DD_DATA_DIR" not in os.environ else []
    if copies:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        shutil.copy2(copies[-1], DB_PATH)
        print(f"No database in {DATA_DIR} — restored the newest safe copy {copies[-1]}")


def init_db():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    recover_if_missing()
    with db() as con:
        con.executescript("""
        CREATE TABLE IF NOT EXISTS records (col TEXT NOT NULL, id TEXT NOT NULL, data TEXT NOT NULL,
                                            updated_at TEXT NOT NULL, updated_by TEXT, PRIMARY KEY (col, id));
        CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS credentials (user_id TEXT PRIMARY KEY, salt TEXT NOT NULL, hash TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS auth_sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires REAL NOT NULL);
        CREATE TABLE IF NOT EXISTS audit (at TEXT NOT NULL, user_id TEXT, user_name TEXT, text TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS consent_log (ref TEXT NOT NULL, at TEXT NOT NULL, received TEXT NOT NULL, version INTEGER, choices TEXT NOT NULL, page TEXT);
        """)
        history.prepare(con)
        if "rounds" not in [c[1] for c in con.execute("PRAGMA table_info(credentials)")]:
            con.execute("ALTER TABLE credentials ADD COLUMN rounds INTEGER")     # NULL = the old 200,000
        notify.init(con)
        learning.init(con)
        history.init(con)          # last, so every table gets its keep-forever triggers
        if os.environ.get("DD_SEED", "1") != "0":
            example_data.seed(con, put_rec, get_kv, set_kv, now_iso)


def now_iso():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def load_col(con, col):
    return [json.loads(r["data"]) for r in con.execute("SELECT data FROM records WHERE col=? AND archived=0", (col,))]


def get_rec(con, col, rid):
    r = con.execute("SELECT data FROM records WHERE col=? AND id=? AND archived=0", (col, rid)).fetchone()
    return json.loads(r["data"]) if r else None


def put_rec(con, col, rec, by):
    con.execute("INSERT INTO records (col, id, data, updated_at, updated_by, archived) VALUES (?,?,?,?,?,0) "
                "ON CONFLICT(col, id) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at, updated_by=excluded.updated_by, archived=0",
                (col, rec["id"], json.dumps(rec, ensure_ascii=False), now_iso(), by))


def del_rec(con, col, rid, by=None):
    """Never removes anything: the record is archived (hidden) and can be restored by an admin."""
    con.execute("UPDATE records SET archived=1, updated_at=?, updated_by=? WHERE col=? AND id=?", (now_iso(), by, col, rid))


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
    """Copy the database once per day, in server/data/backups and in a safe folder outside the website
    folder (DD_SAFE_DIR, default ~/deepdistrict-safe-copies). Keep the last 30 days and the 1st of every month."""
    if not DB_PATH.exists():
        return
    folders = [BACKUP_DIR] + ([SAFE_DIR] if "DD_DATA_DIR" not in os.environ or "DD_SAFE_DIR" in os.environ else [])
    for folder in folders:
        try:
            folder.mkdir(parents=True, exist_ok=True)
            target = folder / f"deepdistrict-{datetime.now():%Y-%m-%d}.db"
            if target.exists():
                continue
            src = sqlite3.connect(DB_PATH)
            dst = sqlite3.connect(target)
            with dst:
                src.backup(dst)
            src.close(); dst.close()
            for old in sorted(folder.glob("deepdistrict-*.db"))[:-30]:
                if not old.stem.endswith("-01"):      # the copy from the 1st of each month is kept for good
                    old.unlink()
        except OSError as e:                          # a read-only home folder must not stop the site
            print("backup copy skipped:", folder, e, file=sys.stderr)


# ---------------------------------------------------------------- passwords & sessions
# Passwords of every role (admin, teacher, student, parent) are never stored: only a salted
# PBKDF2-HMAC-SHA256 hash (random 128-bit salt per password). Nobody, not even an admin, can read them back.
def hash_pw(password, salt=None, rounds=PBKDF2_ROUNDS):
    salt = salt or secrets.token_hex(16)
    h = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), rounds).hex()
    return salt, h


def set_password(con, uid, password, sign_out=True):
    salt, h = hash_pw(password)
    con.execute("INSERT INTO credentials (user_id, salt, hash, rounds) VALUES (?,?,?,?) "
                "ON CONFLICT(user_id) DO UPDATE SET salt=excluded.salt, hash=excluded.hash, rounds=excluded.rounds", (uid, salt, h, PBKDF2_ROUNDS))
    if sign_out:
        con.execute("DELETE FROM auth_sessions WHERE user_id=?", (uid,))   # sign out everywhere


def check_password(con, uid, password):
    r = con.execute("SELECT salt, hash, rounds FROM credentials WHERE user_id=?", (uid,)).fetchone()
    if not r or not hmac.compare_digest(hash_pw(password, r["salt"], r["rounds"] or 200_000)[1], r["hash"]):
        return False
    if (r["rounds"] or 0) < PBKDF2_ROUNDS:                 # stored with fewer rounds: upgrade silently
        set_password(con, uid, password, sign_out=False)
    return True


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
    if role == "teacher":
        # other teachers' timetable without learner details, to spot clashes
        own = {s["id"] for s in out["sessions"]}
        by_enr = {e["id"]: e for e in enrs}
        out["busy"] = [{"id": s["id"], "date": s.get("date"), "start": s.get("start"), "hours": s.get("hours"), "status": s.get("status"),
                        "teacherId": s.get("teacherId") or by_enr.get(s.get("enrolmentId"), {}).get("teacherId"),
                        "courseCode": by_enr.get(s.get("enrolmentId"), {}).get("courseCode"), "mode": s.get("mode"), "location": s.get("location")}
                       for s in load_col(con, "sessions") if s["id"] not in own and s.get("status") == "scheduled"]
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
            org = get_kv(con, "org", DEFAULT_ORG)
            if old and new and old.get("status") != new.get("status") and not org.get("teachersApprove"):
                raise Denied("requests are approved by the admin")
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
    changes = []
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
            if col == "sessions" and old and old.get("autoDone") and rec.get("status") != "done":
                rec["autoOff"], rec["autoDone"] = True, False
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
            changes.append((col, old, rec))
            changed += 1
        for rid in (body.get("deletes", {}).get(col) or []):
            old = get_rec(con, col, rid)
            if not old:
                continue
            can_write(con, me, col, None, old)
            del_rec(con, col, rid, me["id"])                   # archived, never removed
            if col == "users":
                con.execute("DELETE FROM auth_sessions WHERE user_id=?", (rid,))   # signed out; the account is kept
            changed += 1
    for key in KV_KEYS:
        if key in body:
            if me["role"] != "admin":
                raise Denied("settings are admin only")
            set_kv(con, key, body[key])
            changed += 1
    for text in (body.get("log") or [])[:50]:
        audit(con, me, text)
    notify.on_changes(con, changes, bool(get_kv(con, "smtp", {}).get("host")))
    return changed


STATUSES = ("open", "closed", "cancelled")


def _bi(v, n=600):
    v = v if isinstance(v, dict) else {}
    return {"en": str(v.get("en") or "")[:n], "th": str(v.get("th") or "")[:n]}


def _url(v):
    v = str(v or "")
    return v[:300] if re.match(r"^https?://[^\s\"'<>]+$", v) else ""


def public_catalog(con):
    """Only the fields the website displays; hidden courses, categories, items and pathways are left out."""
    courses = {}
    for code, o in (get_kv(con, "courseOverrides", {}) or {}).items():
        st = o.get("status") if o.get("status") in STATUSES else ("open" if o.get("active", True) else "closed")
        vis = o.get("visible", True) is not False
        if st != "open" or not vis:
            courses[str(code)[:12]] = {"status": st, "visible": vis}
    out = {"courses": courses, "prepCatalog": None, "pathways": None}
    pc = get_kv(con, "prepCatalog", None)
    if isinstance(pc, list):
        out["prepCatalog"] = [{"id": str(c.get("id"))[:24], "icon": str(c.get("icon") or "spark")[:20], "name": _bi(c.get("name"), 120), "text": _bi(c.get("text"), 300),
                               "items": [{"id": str(i.get("id"))[:24], "name": str(i.get("name") or "")[:80], "course": str(i.get("course") or "")[:12], "note": _bi(i.get("note")),
                                          "status": i.get("status") if i.get("status") in STATUSES else "open"}
                                         for i in (c.get("items") or []) if isinstance(i, dict) and i.get("visible", True) is not False]}
                              for c in pc[:20] if isinstance(c, dict) and c.get("visible", True) is not False]
    pw = get_kv(con, "pathways", None)
    if isinstance(pw, list):
        out["pathways"] = [{"id": str(p.get("id"))[:24], "field": str(p.get("field") or "")[:20], "type": p.get("type") if p.get("type") in ("thai", "intl", "abroad") else "thai",
                            "uni": _bi(p.get("uni"), 160), "prog": _bi(p.get("prog"), 200), "route": _bi(p.get("route"), 160), "req": _bi(p.get("req"), 700),
                            "tests": [str(x)[:30] for x in (p.get("tests") or [])][:10], "courses": [str(x)[:12] for x in (p.get("courses") or [])][:10], "url": _url(p.get("url"))}
                           for p in pw[:300] if isinstance(p, dict) and p.get("visible", True) is not False]
    return out


BKK = timezone(timedelta(hours=7))
AUTO_TOPIC = "เรียนตามปกติ (บันทึกอัตโนมัติ) · Regular lesson (recorded automatically)"


def auto_complete(con):
    """A scheduled lesson whose time has passed and that nobody updated is recorded as a regular lesson
    (done), so hours, reports and the parents' schedule are always up to date. Teachers can still change it
    (e.g. to no-show) afterwards. Skipped for paused / finished enrolments and dates with a time-off request."""
    org = get_kv(con, "org", DEFAULT_ORG)
    if org.get("autoComplete", True) is False:
        return 0
    now = datetime.now(BKK)
    enrs = {e["id"]: e for e in load_col(con, "enrolments")}
    off = [r for r in load_col(con, "requests") if r.get("type") == "pause" and r.get("status") in ("pending", "approved")]
    changes = []
    for s in load_col(con, "sessions"):
        if s.get("status") != "scheduled" or not s.get("date") or s.get("autoOff"):   # autoOff: staff said it did not happen
            continue
        e = enrs.get(s.get("enrolmentId"))
        if not e or e.get("status", "active") != "active":
            continue
        try:
            end = datetime.fromisoformat(f"{s['date']}T{s.get('start') or '00:00'}").replace(tzinfo=BKK) + timedelta(hours=float(s.get("hours") or 0))
        except (ValueError, TypeError):
            continue
        if end > now or any(r.get("enrolmentId") == s["enrolmentId"] and (r.get("from") or "") <= s["date"] <= (r.get("to") or r.get("from") or "") for r in off):
            continue
        new = dict(s, status="done", autoDone=True, autoDoneAt=now_iso())
        if not new.get("topic"):
            new["topic"] = AUTO_TOPIC
        put_rec(con, "sessions", new, "auto")
        changes.append(("sessions", s, new))
    if changes:      # no message is sent to parents for these; the portal, hours and schedule PDF simply stay up to date
        audit(con, None, f"{len(changes)} past lesson(s) recorded as regular lessons automatically")
    return len(changes)


def bootstrap(con, me):
    auto_complete(con)
    data = scope(con, me)
    data["org"] = get_kv(con, "org", DEFAULT_ORG)
    data["courseOverrides"] = get_kv(con, "courseOverrides", {})
    data["customCourses"] = get_kv(con, "customCourses", [])
    data["prepCatalog"] = get_kv(con, "prepCatalog", None)
    data["pathways"] = get_kv(con, "pathways", None)
    data["log"] = [dict(r) for r in con.execute("SELECT at, user_name AS by, text FROM audit ORDER BY rowid DESC LIMIT 200")] if me["role"] == "admin" else []
    data["me"] = dict(public_user(me), hasLogin=True, prefs=notify.prefs(con, me["id"]), lineLinked=bool(notify.line_user(con, me["id"])))
    lc, ns = notify.line_config(con), notify.settings(con)
    data["notify"] = {"events": ns["events"], "line": {"configured": bool(lc.get("token")), "basicId": lc.get("basicId", ""), "liffId": lc.get("liffId", "")},
                      "smtp": bool(get_kv(con, "smtp", {}).get("host"))}
    data["access"] = access.matrix(access.settings(con))
    data["inboxUnread"] = con.execute("SELECT COUNT(*) FROM notifications WHERE user_id=? AND read=0", (me["id"],)).fetchone()[0]
    data["v"] = 1
    data["serverTime"] = now_iso()
    return data


# ---------------------------------------------------------------- email (SMTP configured by the admin)
class MailError(Exception):
    pass


def send_mail(con, me, body):
    cfg = get_kv(con, "smtp", {})
    if not cfg.get("host"):
        raise MailError("email is not set up — Settings → Email")
    to = [t.strip() for t in (body.get("to") or []) if isinstance(t, str) and "@" in t][:10]
    if not to:
        raise MailError("no valid recipient")
    msg = EmailMessage()
    msg["From"] = cfg.get("sender") or cfg.get("user")
    msg["To"] = ", ".join(to)
    msg["Subject"] = (body.get("subject") or "DeepDistrict")[:200]
    org = get_kv(con, "org", DEFAULT_ORG)
    if org.get("email"):
        msg["Reply-To"] = org["email"]
    msg.set_content((body.get("text") or "")[:20000])
    for a in (body.get("attachments") or [])[:5]:
        data = base64.b64decode(a.get("data") or "")
        maintype, _, subtype = (a.get("mime") or "application/octet-stream").partition("/")
        msg.add_attachment(data, maintype=maintype, subtype=subtype or "octet-stream", filename=(a.get("filename") or "document")[:120])
    smtp_send(cfg, msg)
    audit(con, me, "Emailed '" + msg["Subject"] + "' to " + ", ".join(to))


def smtp_send(cfg, msg):
    port, sec = int(cfg.get("port") or 587), cfg.get("security") or "starttls"
    try:
        if sec == "ssl":
            server = smtplib.SMTP_SSL(cfg["host"], port, timeout=20, context=ssl.create_default_context())
        else:
            server = smtplib.SMTP(cfg["host"], port, timeout=20)
            if sec == "starttls":
                server.starttls(context=ssl.create_default_context())
        if cfg.get("user") and cfg.get("password"):
            server.login(cfg["user"], cfg["password"])
        server.send_message(msg)
        server.quit()
    except (OSError, smtplib.SMTPException) as e:
        raise MailError("could not send: " + str(e)[:200])


def text_mail(cfg, to, subject, text):
    """Plain notification email; returns an error string or None."""
    if not cfg.get("host") or not to:
        return "email not set up"
    msg = EmailMessage()
    msg["From"], msg["To"], msg["Subject"] = cfg.get("sender") or cfg.get("user"), to, subject[:200]
    msg.set_content(text + "\n\n— DeepDistrict")
    try:
        smtp_send(cfg, msg)
    except MailError as e:
        return str(e)
    return None


# ---------------------------------------------------------------- notification worker
_work_lock = threading.Lock()


def run_notifications(with_reminders=False, force=False):
    """Send queued notifications: collect under the DB lock, send without it, then record results."""
    if not _work_lock.acquire(blocking=False):
        return
    try:
        with _lock, db() as con:
            smtp = get_kv(con, "smtp", {})
            if with_reminders:
                notify.reminders(con, bool(smtp.get("host")), force)
            jobs, cfg, st, used = notify.collect(con)
        if not jobs:
            return
        updates, pushes = notify.deliver(jobs, cfg, st, used, lambda to, subj, text: text_mail(smtp, to, subj, text))
        with _lock, db() as con:
            notify.apply_updates(con, updates, pushes)
    except Exception as e:  # keep the server alive whatever happens
        print("notify error", repr(e), file=sys.stderr)
    finally:
        _work_lock.release()


def kick():
    threading.Thread(target=run_notifications, daemon=True).start()


# ---------------------------------------------------------------- HTTP
SECURITY_HEADERS = [
    ("X-Content-Type-Options", "nosniff"),
    ("Referrer-Policy", "strict-origin-when-cross-origin"),
    ("X-Frame-Options", "SAMEORIGIN"),
    # only our own scripts run (no inline or third-party scripts), the site cannot be framed by others,
    # and plugins are off; photos may come from free-licence libraries over https
    ("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; "
                                "font-src 'self' data:; connect-src 'self' https:; frame-src 'self' blob:; worker-src 'self' blob:; object-src 'none'; "
                                "base-uri 'self'; form-action 'self'; frame-ancestors 'self'"),
    ("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=(), display-capture=()"),
    ("Cross-Origin-Opener-Policy", "same-origin"),
]


_https = threading.local()      # per request: was it served over https?


def respond(start, status, body=b"", ctype="application/json; charset=utf-8", extra=None):
    if isinstance(body, (dict, list)):
        body = json.dumps(body, ensure_ascii=False).encode()
    elif isinstance(body, str):
        body = body.encode()
    headers = [("Content-Type", ctype), ("Content-Length", str(len(body)))] + SECURITY_HEADERS + (extra or [])
    if getattr(_https, "on", False):
        headers.append(("Strict-Transport-Security", "max-age=31536000"))     # browsers keep using https
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


def line_webhook(environ, start):
    try:
        n = min(int(environ.get("CONTENT_LENGTH") or 0), MAX_BODY)
    except ValueError:
        n = 0
    raw = environ["wsgi.input"].read(n) if n else b""
    with _lock, db() as con:
        cfg = notify.line_config(con)
        if not cfg.get("secret") or not notify.verify_signature(cfg["secret"], raw, environ.get("HTTP_X_LINE_SIGNATURE")):
            return respond(start, "401 Unauthorized", {"error": "bad signature"})
        try:
            events = json.loads(raw or b"{}").get("events", [])
        except json.JSONDecodeError:
            return respond(start, "400 Bad Request", {"error": "bad json"})
        replies = notify.webhook(con, events, cfg)
    for token, text in replies:   # reply messages are free on LINE OA
        notify.line_request(cfg["token"], "/v2/bot/message/reply", {"replyToken": token, "messages": [{"type": "text", "text": text[:4900]}]})
    return respond(start, "200 OK", {"ok": True})


def cron(environ, start):
    q = parse_qs(environ.get("QUERY_STRING", ""))
    with _lock, db() as con:
        key = get_kv(con, "cron_key", None)
    if not key or not hmac.compare_digest((q.get("key") or [""])[0], key):
        return respond(start, "403 Forbidden", {"error": "bad key"})
    with _lock, db() as con:
        auto_complete(con)
    run_notifications(with_reminders=True)
    learning.tick()
    return respond(start, "200 OK", {"ok": True})


def api(environ, start, path):
    method = environ["REQUEST_METHOD"]
    if path == "line/webhook" and method == "POST":
        return line_webhook(environ, start)
    if path == "cron":
        return cron(environ, start)
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
            return respond(start, "200 OK", {"ok": True, "setup": not has_admin, "signedIn": bool(me), "version": VERSION})

        if path == "popups" and method == "GET":
            # public: the pop-up promotions live right now for this page (no personal data involved)
            page = (parse_qs(environ.get("QUERY_STRING", "")).get("page") or ["home"])[0][:20]
            return respond(start, "200 OK", {"items": popups.active(get_kv(con, "popups", popups.default()), page)}, extra=[("Cache-Control", "no-store")])

        if path == "catalog" and method == "GET":
            # public: what the website should show — course status/visibility and the edited
            # test-prep catalogue and university finder (hidden entries are never sent)
            return respond(start, "200 OK", public_catalog(con), extra=[("Cache-Control", "no-store")])

        pub = learning.public_routes(con, path, method, environ)
        if pub:
            return respond(start, pub[0], pub[1], extra=[("Cache-Control", "no-store")])

        if path == "consent" and method == "POST":
            # proof of cookie consent (PDPA): random reference, time, policy version and choices only —
            # no name, email, IP address or other personal data. Kept permanently.
            ref = str(body.get("id") or "")
            choices = body.get("choices") if isinstance(body.get("choices"), dict) else None
            if not re.fullmatch(r"[a-z0-9]{6,32}", ref) or choices is None:
                return respond(start, "400 Bad Request", {"error": "bad consent record"})
            clean = {k: bool(choices.get(k)) for k in ("necessary", "preferences", "analytics", "marketing")}
            if con.execute("SELECT COUNT(*) FROM consent_log").fetchone()[0] >= 500000:   # simple flood guard
                return respond(start, "200 OK", {"ok": True})
            con.execute("INSERT INTO consent_log (ref, at, received, version, choices, page) VALUES (?,?,?,?,?,?)",
                        (ref, str(body.get("at") or "")[:30], now_iso(), int(body.get("v") or 0), json.dumps(clean), str(body.get("page") or "")[:60]))
            return respond(start, "200 OK", {"ok": True})

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

        out = learning.routes(con, me, path, method, body, environ)
        if out:
            if out[0] != "200 OK":
                con.rollback()
            return respond(start, out[0], out[1], extra=[("Cache-Control", "no-store")])

        if path == "bootstrap" and method == "GET":
            return respond(start, "200 OK", bootstrap(con, me))

        if path == "sync" and method == "POST":
            try:
                n = apply_sync(con, me, body)
            except Denied as e:
                con.rollback()
                return respond(start, "403 Forbidden", {"error": str(e)})
            kick()
            return respond(start, "200 OK", {"ok": True, "changed": n})

        if path == "password" and method == "POST":
            if not check_password(con, me["id"], body.get("old") or ""):
                return respond(start, "400 Bad Request", {"error": "current password is wrong"})
            if len(body.get("new") or "") < 8:
                return respond(start, "400 Bad Request", {"error": "password too short"})
            set_password(con, me["id"], body["new"]); audit(con, me, "Changed own password")
            return respond(start, "200 OK", {"ok": True}, extra=[cookie(environ, new_session(con, me["id"]))])

        if path == "inbox" and method == "GET":
            rows = con.execute("SELECT id, at, event, text_th, text_en, read FROM notifications WHERE user_id=? ORDER BY at DESC LIMIT 60", (me["id"],)).fetchall()
            return respond(start, "200 OK", {"items": [dict(r) for r in rows]})
        if path == "inbox/read" and method == "POST":
            con.execute("UPDATE notifications SET read=1 WHERE user_id=?", (me["id"],))
            return respond(start, "200 OK", {"ok": True})
        if path == "prefs" and method == "POST":
            return respond(start, "200 OK", {"prefs": notify.set_prefs(con, me["id"], body)})
        if path == "line/code" and method == "POST":
            if not notify.line_config(con).get("token"):
                return respond(start, "400 Bad Request", {"error": "LINE is not set up yet"})
            return respond(start, "200 OK", {"code": notify.new_code(con, me["id"]), "basicId": notify.line_config(con).get("basicId", "")})
        if path == "line/unlink" and method == "POST":
            con.execute("DELETE FROM line_users WHERE user_id=?", (me["id"],))
            return respond(start, "200 OK", {"ok": True})

        if path == "email" and method == "POST":
            if me["role"] not in STAFF:
                return respond(start, "403 Forbidden", {"error": "staff only"})
            try:
                send_mail(con, me, body)
            except MailError as e:
                return respond(start, "400 Bad Request", {"error": str(e)})
            return respond(start, "200 OK", {"ok": True})

        if path == "smtp" and method == "GET":
            cfg = get_kv(con, "smtp", {})
            return respond(start, "200 OK", {"configured": bool(cfg.get("host")), **{k: cfg.get(k) for k in ("host", "port", "user", "sender", "security")}})

        if me["role"] != "admin":
            return respond(start, "403 Forbidden", {"error": "admin only"})

        if path == "popups-admin" and method == "GET":
            store = get_kv(con, "popups", popups.default())
            items = [dict(p, status=popups.status(p)) for p in store.get("items", [])]
            return respond(start, "200 OK", {"enabled": bool(store.get("enabled")), "items": items, "pages": popups.PAGES,
                                             "now": datetime.now(popups.TZ).strftime("%Y-%m-%dT%H:%M")})
        if path == "popups-admin" and method == "POST":
            store = get_kv(con, "popups", popups.default())
            items = store.get("items", [])
            try:
                if "enabled" in body:
                    store["enabled"] = bool(body["enabled"]); audit(con, me, "Pop-ups " + ("switched on" if store["enabled"] else "switched off"))
                if isinstance(body.get("save"), dict):
                    p = popups.clean(body["save"], now_iso())
                    i = next((k for k, x in enumerate(items) if x["id"] == p["id"]), None)
                    if i is None:
                        items.append(p)
                    else:
                        items[i] = p
                    audit(con, me, f"Saved pop-up '{p['name'] or p['title']['en'] or p['title']['th']}'")
                if body.get("delete"):
                    items = [x for x in items if x["id"] != body["delete"]]; audit(con, me, "Deleted a pop-up")
                if isinstance(body.get("toggle"), dict):
                    for x in items:
                        if x["id"] == body["toggle"].get("id"):
                            x["enabled"] = bool(body["toggle"].get("enabled")); x["updatedAt"] = now_iso()
            except ValueError as e:
                return respond(start, "400 Bad Request", {"error": str(e)})
            if len(items) > 50:
                return respond(start, "400 Bad Request", {"error": "at most 50 pop-ups"})
            store["items"] = items
            set_kv(con, "popups", store)
            return respond(start, "200 OK", {"ok": True, "id": (body.get("save") and p["id"]) or None})
        if path == "consent-log" and method == "GET":
            rows = [dict(r) for r in con.execute("SELECT ref, at, received, version, choices, page FROM consent_log ORDER BY received DESC LIMIT 20000")]
            return respond(start, "200 OK", {"items": rows, "count": con.execute("SELECT COUNT(*) FROM consent_log").fetchone()[0]})
        if path == "notify" and method == "GET":
            key = get_kv(con, "cron_key", None)
            if not key:
                key = secrets.token_urlsafe(18); set_kv(con, "cron_key", key)
            host = (environ.get("HTTP_X_FORWARDED_PROTO") or environ.get("wsgi.url_scheme", "http")) + "://" + environ.get("HTTP_HOST", "localhost")
            lc = notify.line_config(con)
            log = [dict(r) for r in con.execute("SELECT n.id, n.at, n.user_id, n.event, n.text_th, n.text_en, n.email, n.line, n.error FROM notifications n ORDER BY at DESC LIMIT 300")]
            linked = [r["user_id"] for r in con.execute("SELECT user_id FROM line_users")]
            return respond(start, "200 OK", {"settings": notify.settings(con), "line": {"configured": bool(lc.get("token")), "hasSecret": bool(lc.get("secret")), "basicId": lc.get("basicId", ""), "liffId": lc.get("liffId", "")},
                                             "used": notify.line_used(con), "month": notify.month_key(), "webhook": host + "/api/line/webhook", "cron": host + "/api/cron?key=" + key, "log": log, "linked": linked})
        if path == "notify" and method == "POST":
            st = notify.settings(con)
            st["events"].update({k: bool(v) for k, v in (body.get("events") or {}).items() if k in notify.EVENTS})
            for k in ("quota", "reminderHour"):
                if k in body:
                    st[k] = max(0, int(body[k]))
            set_kv(con, "notify", st); audit(con, me, "Updated notification settings")
            return respond(start, "200 OK", {"ok": True})
        if path == "line/config" and method == "POST":
            lc = notify.line_config(con)
            for k in ("token", "secret"):
                if body.get(k):
                    lc[k] = body[k].strip()
            for k in ("basicId", "liffId"):
                if k in body:
                    lc[k] = (body[k] or "").strip()
            if body.get("clear"):
                lc = {}
            set_kv(con, "line", lc); audit(con, me, "Updated LINE settings")
            return respond(start, "200 OK", {"ok": True})
        if path == "line/test" and method == "POST":
            if not notify.line_user(con, me["id"]):
                return respond(start, "400 Bad Request", {"error": "link your own LINE first (Settings → Connect LINE)"})
            notify.queue(con, me["id"], "test", "ทดสอบการแจ้งเตือนจาก DeepDistrict ✅", "DeepDistrict test notification ✅", None, False)
            con.commit(); kick()
            return respond(start, "200 OK", {"ok": True})
        if path == "notify/run" and method == "POST":
            con.commit()
            threading.Thread(target=run_notifications, kwargs={"with_reminders": True, "force": bool(body.get("force"))}, daemon=True).start()
            return respond(start, "200 OK", {"ok": True})

        if path == "smtp" and method == "POST":
            cfg = get_kv(con, "smtp", {})
            for k in ("host", "port", "user", "sender", "security"):
                if k in body:
                    cfg[k] = body[k]
            if body.get("password"):
                cfg["password"] = body["password"]
            if body.get("clear"):
                cfg = {}
            set_kv(con, "smtp", cfg); audit(con, me, "Updated email settings")
            return respond(start, "200 OK", {"ok": True})

        if path == "backup" and method == "GET":
            data = {"v": 1, "exportedAt": now_iso(), "org": get_kv(con, "org", DEFAULT_ORG),  # email password is not exported
                    "courseOverrides": get_kv(con, "courseOverrides", {}), "customCourses": get_kv(con, "customCourses", []),
                    "popups": get_kv(con, "popups", popups.default()),
                    "prepCatalog": get_kv(con, "prepCatalog", None), "pathways": get_kv(con, "pathways", None)}
            for col in COLLECTIONS:
                data[col] = load_col(con, col)
            data.update(learning.backup(con))
            data["credentials"] = [dict(r) for r in con.execute("SELECT user_id, salt, hash, rounds FROM credentials")]
            audit(con, me, "Exported backup")
            return respond(start, "200 OK", data, extra=[("Content-Disposition", f'attachment; filename="deepdistrict-backup-{datetime.now():%Y-%m-%d}.json"')])

        if path == "restore" and method == "POST":
            if body.get("v") != 1 or not isinstance(body.get("users"), list):
                return respond(start, "400 Bad Request", {"error": "not a backup file"})
            if not any(u.get("role") == "admin" for u in body["users"]):
                return respond(start, "400 Bad Request", {"error": "backup has no admin"})
            daily_backup()
            con.execute("UPDATE records SET archived=1 WHERE archived=0")   # kept; records in the file come back live
            con.execute("DELETE FROM credentials")                            # (earlier copies stay in the archive)
            for col in COLLECTIONS:
                for rec in body.get(col) or []:
                    rec.pop("pass", None); rec.pop("hasLogin", None)
                    put_rec(con, col, rec, me["id"])
            for c in body.get("credentials") or []:
                con.execute("INSERT INTO credentials (user_id, salt, hash, rounds) VALUES (?,?,?,?)", (c["user_id"], c["salt"], c["hash"], c.get("rounds")))
            for key in KV_KEYS:
                if key in body:
                    set_kv(con, key, body[key])
            if isinstance(body.get("popups"), dict):   # re-check every pop-up from the file
                kept = []
                for item in body["popups"].get("items") or []:
                    try:
                        kept.append(popups.clean(item, now_iso()))
                    except (ValueError, TypeError):
                        pass
                set_kv(con, "popups", {"enabled": bool(body["popups"].get("enabled")), "items": kept[:50]})
            learning.restore(con, body)
            con.execute("DELETE FROM auth_sessions WHERE user_id != ?", (me["id"],))
            audit(con, me, "Restored backup")
            return respond(start, "200 OK", {"ok": True})

        if path == "erase" and method == "POST":
            return respond(start, "410 Gone", {"error": "nothing is ever deleted — records can only be archived"})

        if path == "example/seed" and method == "POST":
            n = example_data.seed(con, put_rec, get_kv, set_kv, now_iso, force=True)
            audit(con, me, f"Added example data ({n} records)")
            return respond(start, "200 OK", {"ok": True, "added": n})
        if path == "archive" and method == "GET":
            return respond(start, "200 OK", {"items": history.archived(con, COLLECTIONS), "stats": history.stats(con)})
        if path == "archive/restore" and method == "POST":
            col, rid = body.get("col"), str(body.get("id") or "")
            r = con.execute("SELECT data FROM records WHERE col=? AND id=? AND archived=1", (col, rid)).fetchone() if col in COLLECTIONS else None
            if not r:
                return respond(start, "404 Not Found", {"error": "not in the archive"})
            put_rec(con, col, json.loads(r["data"]), me["id"])
            audit(con, me, f"Restored {col} {rid} from the archive")
            return respond(start, "200 OK", {"ok": True})
        if path == "history" and method == "GET":
            q = parse_qs(environ.get("QUERY_STRING", ""))
            col, rid = (q.get("col") or [""])[0], (q.get("id") or [""])[0]
            if col not in COLLECTIONS:
                return respond(start, "400 Bad Request", {"error": "unknown collection"})
            return respond(start, "200 OK", {"versions": history.versions(con, col, rid)})

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
    if ctype.startswith("text/") or ctype in ("application/javascript", "image/svg+xml", "application/json", "application/manifest+json"):
        ctype += "; charset=utf-8"
    cache = [("Cache-Control", "no-cache")] if target.suffix in (".html", ".js", ".css", ".webmanifest") else [("Cache-Control", "public, max-age=86400")]
    return respond(start, "200 OK", target.read_bytes(), ctype, cache)


_backup_day = [""]


def backup_once_a_day():
    """Hosted under WSGI there is no main loop, so the first request of each day makes the safety copies."""
    day = datetime.now().strftime("%Y-%m-%d")
    if _backup_day[0] != day:
        _backup_day[0] = day
        threading.Thread(target=lambda: _locked(daily_backup), daemon=True).start()


def _locked(fn):
    try:
        with _lock:
            fn()
    except Exception as e:  # noqa: BLE001
        print("backup error", repr(e), file=sys.stderr)


def application(environ, start):
    path = environ.get("PATH_INFO", "/")
    _https.on = environ.get("wsgi.url_scheme") == "https" or environ.get("HTTP_X_FORWARDED_PROTO") == "https"
    backup_once_a_day()
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
mimetypes.add_type("application/manifest+json", ".webmanifest")
learning.setup(db=db, lock=_lock, audit=audit, load_col=load_col, get_rec=get_rec, now_iso=now_iso)
init_db()


class ThreadingServer(ThreadingMixIn, WSGIServer):
    daemon_threads = True
    # Never share a port with another server. (On Windows "reuse address" lets two servers
    # bind the same port, so an old DeepDistrict could keep answering the browser.)
    allow_reuse_address = os.name != "nt"


class QuietHandler(WSGIRequestHandler):
    def log_request(self, code="-", size="-"):
        if str(code)[0] in "45" and "/api/" in self.path:
            super().log_request(code, size)


def main():
    lan = "--lan" in sys.argv
    port = int(next((a for a in sys.argv[1:] if a.isdigit()), os.environ.get("PORT", 8000)))
    host = "0.0.0.0" if lan else "127.0.0.1"
    daily_backup()

    def loop():
        while True:
            time.sleep(20)
            try:
                with _lock, db() as con:
                    auto_complete(con)
            except Exception as e:  # noqa: BLE001
                print("auto-complete error", repr(e), file=sys.stderr)
            run_notifications(with_reminders=True)
            learning.tick()
    threading.Thread(target=loop, daemon=True).start()
    # if the port is taken (often an older DeepDistrict still running), use the next free one
    httpd = None
    for p in range(port, port + 20):
        try:
            httpd = make_server(host, p, application, server_class=ThreadingServer, handler_class=QuietHandler)
            break
        except OSError:
            if p == port:
                print(f"Port {port} is already in use — probably an older DeepDistrict window is still open. Close it to free the port. Using the next free port instead.")
    if not httpd:
        sys.exit(f"No free port between {port} and {port + 19}. Close other DeepDistrict windows and try again.")
    port = httpd.server_port
    print(f"DeepDistrict {VERSION} running:  website  http://localhost:{port}/   back office  http://localhost:{port}/admin/")
    if "--open" in sys.argv:   # open the browser only once this server is really listening
        webbrowser.open(f"http://localhost:{port}/")
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
