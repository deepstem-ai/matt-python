"""DeepDistrict notifications: in-app inbox, email and LINE Official Account.

* Events are created from changes saved through /api/sync (enrolment, receipt, change requests,
  moved/cancelled/learned lessons, low hours) and by the reminder job (lesson tomorrow).
* Each person chooses events and channels; the admin switches events on/off globally.
* LINE: pushes are grouped per person (one message per run) and counted against a monthly
  quota (LINE OA free plan) — when the quota is used up, LINE is skipped (email still goes).
  Replies to messages the person sends (link code, "schedule", "hours") are free.
"""

import base64
import hashlib
import hmac
import json
import os
import secrets
import time
import urllib.error
import urllib.request
from datetime import date, datetime, timedelta, timezone

LINE_API = os.environ.get("DD_LINE_API", "https://api.line.me")
TZ = timezone(timedelta(hours=7))  # Bangkok
EVENTS = ["enrolment", "receipt", "request_new", "request_decided", "lesson_changed", "lesson_done", "reminder", "low_hours"]
DEFAULT_SETTINGS = {"events": {e: True for e in EVENTS}, "quota": 300, "reminderHour": 17}
STAFF = ("admin", "teacher")


# ---------------------------------------------------------------- storage
def init(con):
    con.executescript("""
    CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY, key TEXT UNIQUE, at TEXT NOT NULL, user_id TEXT NOT NULL,
        event TEXT NOT NULL, text_th TEXT NOT NULL, text_en TEXT NOT NULL, read INTEGER DEFAULT 0,
        email TEXT DEFAULT 'off', line TEXT DEFAULT 'off', error TEXT);
    CREATE INDEX IF NOT EXISTS notif_user ON notifications(user_id, at);
    CREATE TABLE IF NOT EXISTS user_prefs (user_id TEXT PRIMARY KEY, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS line_users (user_id TEXT PRIMARY KEY, line_user_id TEXT NOT NULL, linked_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS line_codes (code TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires REAL NOT NULL);
    """)


def _kv(con, key, default):
    r = con.execute("SELECT value FROM kv WHERE key=?", (key,)).fetchone()
    return json.loads(r["value"]) if r else default


def _set_kv(con, key, value):
    con.execute("INSERT INTO kv (key, value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", (key, json.dumps(value, ensure_ascii=False)))


def _rec(con, col, rid):
    r = con.execute("SELECT data FROM records WHERE col=? AND id=? AND archived=0", (col, rid)).fetchone() if rid else None
    return json.loads(r["data"]) if r else None


def _col(con, col):
    return [json.loads(r["data"]) for r in con.execute("SELECT data FROM records WHERE col=? AND archived=0", (col,))]


def settings(con):
    s = _kv(con, "notify", {})
    out = json.loads(json.dumps(DEFAULT_SETTINGS))
    out.update({k: v for k, v in s.items() if k != "events"})
    out["events"].update(s.get("events", {}))
    return out


def line_config(con):
    return _kv(con, "line", {})


def prefs(con, uid):
    r = con.execute("SELECT data FROM user_prefs WHERE user_id=?", (uid,)).fetchone()
    p = json.loads(r["data"]) if r else {}
    p.setdefault("lang", "th")
    p.setdefault("channels", {"email": True, "line": True})
    p.setdefault("events", {})
    for e in EVENTS:
        p["events"].setdefault(e, True)
    return p


def set_prefs(con, uid, p):
    clean = {"lang": "en" if p.get("lang") == "en" else "th",
             "channels": {k: bool((p.get("channels") or {}).get(k, True)) for k in ("email", "line")},
             "events": {e: bool((p.get("events") or {}).get(e, True)) for e in EVENTS}}
    con.execute("INSERT INTO user_prefs (user_id, data) VALUES (?,?) ON CONFLICT(user_id) DO UPDATE SET data=excluded.data", (uid, json.dumps(clean)))
    return clean


def line_user(con, uid):
    r = con.execute("SELECT line_user_id FROM line_users WHERE user_id=?", (uid,)).fetchone()
    return r["line_user_id"] if r else None


def month_key():
    return datetime.now(TZ).strftime("%Y-%m")


def line_used(con):
    return _kv(con, "line_usage", {}).get(month_key(), 0)


# ---------------------------------------------------------------- creating notifications
def queue(con, uid, event, th, en, key=None, smtp_ready=False):
    """Store one notification for a person and decide which channels will carry it."""
    user = _rec(con, "users", uid)
    if not user or user.get("active") is False:
        return
    st, pr = settings(con), prefs(con, uid)
    if not st["events"].get(event, True):
        return
    key = key and f"{key}@{uid}"                     # one per event *and* person (student and parent both get it)
    if key and con.execute("SELECT 1 FROM notifications WHERE key=?", (key,)).fetchone():
        return
    wants = pr["events"].get(event, True)
    email = "queued" if wants and pr["channels"]["email"] and user.get("email") and smtp_ready else "off"
    line = "queued" if wants and pr["channels"]["line"] and line_user(con, uid) and line_config(con).get("token") else "off"
    con.execute("INSERT INTO notifications (id, key, at, user_id, event, text_th, text_en, email, line) VALUES (?,?,?,?,?,?,?,?,?)",
                ("n" + secrets.token_hex(8), key, datetime.now(timezone.utc).isoformat(timespec="seconds"), uid, event, th, en, email, line))


def _learners(con, enr):
    stu = _rec(con, "users", enr.get("studentId")) or {}
    return [x for x in (stu.get("id"), stu.get("guardianId")) if x]


def _name(con, uid):
    u = _rec(con, "users", uid) or {}
    return u.get("nick") or u.get("name") or ""


def _when(s):
    try:
        d = date.fromisoformat(s["date"])
        th_days = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์", "อาทิตย์"]
        th_m = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."]
        end = _end(s)
        return (f"{th_days[d.weekday()]} {d.day} {th_m[d.month - 1]} {s.get('start', '')}–{end}",
                f"{d.strftime('%a %d %b')} {s.get('start', '')}–{end}")
    except (KeyError, ValueError):
        return (s.get("date", ""), s.get("date", ""))


def _end(s):
    h, m = (int(x) for x in (s.get("start") or "0:0").split(":"))
    t = h * 60 + m + round(float(s.get("hours") or 0) * 60)
    return f"{t // 60 % 24:02d}:{t % 60:02d}"


def _hours(x):
    x = round(float(x or 0), 2)
    return str(int(x)) if x == int(x) else str(x)


def stats(con, enr):
    org = _kv(con, "org", {})
    used = planned = 0.0
    for s in _col(con, "sessions"):
        if s.get("enrolmentId") != enr["id"]:
            continue
        if s.get("status") == "done" or (s.get("status") == "noshow" and org.get("noShowCounts", True)):
            used += float(s.get("hours") or 0)
        elif s.get("status") == "scheduled":
            planned += float(s.get("hours") or 0)
    total = float(enr.get("hours") or 0)
    return {"total": total, "used": used, "remaining": max(0.0, total - used), "planned": planned}


def on_changes(con, changes, smtp_ready):
    """changes: list of (collection, old, new) saved in one sync."""
    decided_enrs = {n.get("enrolmentId") for c, o, n in changes if c == "requests" and o and n and o.get("status") != n.get("status")}
    org = _kv(con, "org", {})
    q = lambda uid, ev, th, en, key=None: queue(con, uid, ev, th, en, key, smtp_ready)
    for col, old, new in changes:
        if new is None:
            continue
        if col == "enrolments" and not old:
            sess = sorted((s for s in _col(con, "sessions") if s.get("enrolmentId") == new["id"] and s.get("status") == "scheduled"), key=lambda s: s["date"] + s.get("start", ""))
            first = _when(sess[0]) if sess else ("–", "–")
            for uid in _learners(con, new):
                q(uid, "enrolment", f"ลงทะเบียนเรียน {new.get('courseCode')} เรียบร้อยแล้ว ทั้งหมด {_hours(new.get('hours'))} ชม. คาบแรก {first[0]} ดูตารางเรียนได้ในระบบ DeepDistrict",
                  f"Enrolled in {new.get('courseCode')}: {_hours(new.get('hours'))} h. First lesson {first[1]}. See the schedule in DeepDistrict.", "enr:" + new["id"])
        elif col == "payments" and not old:
            enr = _rec(con, "enrolments", new.get("enrolmentId")) or {}
            amt = f"{float(new.get('amount') or 0):,.2f}"
            for uid in _learners(con, enr):
                q(uid, "receipt", f"ได้รับชำระเงิน {amt} บาท ({enr.get('courseCode', '')}) ใบเสร็จเลขที่ {new.get('ref', '')} ขอบคุณค่ะ",
                  f"Payment received: {amt} THB ({enr.get('courseCode', '')}), receipt {new.get('ref', '')}. Thank you.", "pay:" + new["id"])
        elif col == "requests" and not old:
            enr = _rec(con, "enrolments", new.get("enrolmentId")) or {}
            kind = {"reschedule": ("ขอย้ายคาบ", "move a lesson"), "cancel": ("ขอยกเลิกคาบ", "cancel a lesson"), "pause": ("ขอหยุดเรียน", "time off")}.get(new.get("type"), ("คำขอ", "request"))
            who = _name(con, enr.get("studentId"))
            approvers = [u["id"] for u in _col(con, "users") if u.get("role") == "admin" and u.get("active", True)]
            if org.get("teachersApprove") and enr.get("teacherId"):
                approvers.append(enr["teacherId"])
            for uid in set(approvers):
                q(uid, "request_new", f"คำขอใหม่: {kind[0]} — {who} ({enr.get('courseCode', '')}) {new.get('note') or ''}".strip(),
                  f"New request: {kind[1]} — {who} ({enr.get('courseCode', '')}) {new.get('note') or ''}".strip(), "req:" + new["id"])
        elif col == "requests" and old and old.get("status") == "pending" and new.get("status") in ("approved", "declined"):
            enr = _rec(con, "enrolments", new.get("enrolmentId")) or {}
            ok = new.get("status") == "approved"
            res = new.get("resultText") or new.get("reply") or ""
            for uid in set(_learners(con, enr) + [new.get("createdBy")]):
                if uid:
                    q(uid, "request_decided", ("✅ คำขอได้รับการอนุมัติ" if ok else "คำขอไม่ได้รับการอนุมัติ") + f" ({enr.get('courseCode', '')}) {res}".rstrip(),
                      ("✅ Request approved" if ok else "Request declined") + f" ({enr.get('courseCode', '')}) {res}".rstrip(), f"dec:{new['id']}:{new['status']}")
        elif col == "sessions" and old:
            enr = _rec(con, "enrolments", new.get("enrolmentId")) or {}
            if old.get("status") == "scheduled" and new.get("status") in ("rescheduled", "cancelled") and new.get("enrolmentId") not in decided_enrs:
                if new.get("status") == "rescheduled":
                    to = _rec(con, "sessions", new.get("movedTo")) or {}
                    a, b = _when(old), _when(to) if to else ("–", "–")
                    th, en = f"เลื่อนคาบ {enr.get('courseCode', '')}: {a[0]} → {b[0]}", f"Lesson moved ({enr.get('courseCode', '')}): {a[1]} → {b[1]}"
                else:
                    a = _when(old)
                    th, en = f"ยกเลิกคาบ {enr.get('courseCode', '')} {a[0]} {new.get('reason') or ''}".rstrip(), f"Lesson cancelled ({enr.get('courseCode', '')}) {a[1]} {new.get('reason') or ''}".rstrip()
                for uid in _learners(con, enr):
                    q(uid, "lesson_changed", th, en, f"chg:{new['id']}:{new['status']}")
            if old.get("status") != "done" and new.get("status") == "done":
                st = stats(con, enr)
                topic = new.get("topic") or ""
                for uid in _learners(con, enr):
                    q(uid, "lesson_done", f"เรียนแล้ว {enr.get('courseCode', '')} {_when(new)[0]}" + (f": {topic}" if topic else "") + f" — คงเหลือ {_hours(st['remaining'])} จาก {_hours(st['total'])} ชม.",
                      f"Lesson done ({enr.get('courseCode', '')}) {_when(new)[1]}" + (f": {topic}" if topic else "") + f" — {_hours(st['remaining'])} of {_hours(st['total'])} h left.", f"done:{new['id']}")
                if 0 < st["remaining"] <= float(org.get("lowHours", 2)):
                    for uid in _learners(con, enr) + [u["id"] for u in _col(con, "users") if u.get("role") == "admin"]:
                        q(uid, "low_hours", f"⏳ {_name(con, enr.get('studentId'))} ({enr.get('courseCode', '')}) เหลือ {_hours(st['remaining'])} ชม.",
                          f"⏳ {_name(con, enr.get('studentId'))} ({enr.get('courseCode', '')}) has {_hours(st['remaining'])} h left.", f"low:{enr['id']}")


def reminders(con, smtp_ready, force=False):
    """Lesson-tomorrow reminders; run from the worker or /api/cron (idempotent)."""
    now = datetime.now(TZ)
    if not force and now.hour < int(settings(con).get("reminderHour", 17)):
        return 0
    tomorrow = (now.date() + timedelta(days=1)).isoformat()
    n = 0
    for s in _col(con, "sessions"):
        if s.get("date") != tomorrow or s.get("status") != "scheduled":
            continue
        enr = _rec(con, "enrolments", s.get("enrolmentId")) or {}
        w = _when(s)
        place = s.get("location") or {"online": "Zoom"}.get(s.get("mode"), "")
        for uid in _learners(con, enr):
            queue(con, uid, "reminder", f"⏰ พรุ่งนี้มีเรียน {enr.get('courseCode', '')} {w[0]}" + (f" ที่ {place}" if place else ""),
                  f"⏰ Tomorrow: {enr.get('courseCode', '')} {w[1]}" + (f" at {place}" if place else ""), f"rem:{s['id']}:{tomorrow}", smtp_ready)
            n += 1
    return n


# ---------------------------------------------------------------- sending
def line_request(token, path, payload):
    req = urllib.request.Request(LINE_API + path, data=json.dumps(payload).encode(), method="POST",
                                 headers={"Content-Type": "application/json", "Authorization": "Bearer " + token})
    try:
        with urllib.request.urlopen(req, timeout=12) as r:
            return r.status, r.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:300]
    except (urllib.error.URLError, OSError) as e:
        return 0, str(e)[:300]


def collect(con):
    """Pick queued work (inside the DB lock)."""
    rows = [dict(r) for r in con.execute("SELECT * FROM notifications WHERE email='queued' OR line='queued' ORDER BY at")]
    jobs = {}
    for r in rows:
        j = jobs.setdefault(r["user_id"], {"user": _rec(con, "users", r["user_id"]) or {}, "prefs": prefs(con, r["user_id"]),
                                           "line_id": line_user(con, r["user_id"]), "email": [], "line": []})
        if r["email"] == "queued":
            j["email"].append(r)
        if r["line"] == "queued":
            j["line"].append(r)
    return jobs, line_config(con), settings(con), line_used(con)


def deliver(jobs, cfg, st, used, send_email):
    """Send outside the lock. Returns status updates and how many LINE pushes were used."""
    updates, pushes = [], 0
    for uid, j in jobs.items():
        lang = j["prefs"]["lang"]
        txt = lambda r: r["text_en"] if lang == "en" else r["text_th"]
        if j["email"]:
            body = "\n\n".join("• " + txt(r) for r in j["email"])
            subj = ("DeepDistrict: " + txt(j["email"][0])[:80]) if len(j["email"]) == 1 else ("DeepDistrict: %d updates" % len(j["email"]) if lang == "en" else "DeepDistrict: แจ้งเตือน %d รายการ" % len(j["email"]))
            err = send_email(j["user"].get("email"), subj, body)
            updates += [(r["id"], "email", "failed" if err else "sent", err) for r in j["email"]]
        if j["line"]:
            if not cfg.get("token") or not j["line_id"]:
                updates += [(r["id"], "line", "failed", "LINE not linked") for r in j["line"]]
            elif used + pushes >= int(st.get("quota") or 300):
                updates += [(r["id"], "line", "quota", "monthly LINE quota used up") for r in j["line"]]
            else:
                text = "\n\n".join(txt(r) for r in j["line"])[:4900]   # one push per person per run saves quota
                code, resp = line_request(cfg["token"], "/v2/bot/message/push", {"to": j["line_id"], "messages": [{"type": "text", "text": text}]})
                ok = code == 200
                pushes += 1 if ok else 0
                updates += [(r["id"], "line", "sent" if ok else "failed", None if ok else f"{code} {resp}") for r in j["line"]]
    return updates, pushes


def apply_updates(con, updates, pushes):
    for nid, ch, status, err in updates:
        con.execute(f"UPDATE notifications SET {ch}=?, error=COALESCE(?, error) WHERE id=?", (status, err, nid))
    if pushes:
        usage = _kv(con, "line_usage", {})
        usage[month_key()] = usage.get(month_key(), 0) + pushes
        _set_kv(con, "line_usage", usage)


# ---------------------------------------------------------------- LINE webhook (replies are free)
def verify_signature(secret, body, signature):
    mac = hmac.new(secret.encode(), body, hashlib.sha256).digest()
    return hmac.compare_digest(base64.b64encode(mac).decode(), signature or "")


def new_code(con, uid):
    con.execute("DELETE FROM line_codes WHERE expires < ? OR user_id = ?", (time.time(), uid))
    code = "%06d" % secrets.randbelow(1000000)
    con.execute("INSERT INTO line_codes (code, user_id, expires) VALUES (?,?,?)", (code, uid, time.time() + 1800))
    return code


def _summary(con, uid, what):
    u = _rec(con, "users", uid) or {}
    kids = [x["id"] for x in _col(con, "users") if x.get("guardianId") == uid] if u.get("role") == "parent" else [uid]
    enrs = [e for e in _col(con, "enrolments") if e.get("studentId") in kids and e.get("status") in ("active", "paused")]
    if not enrs:
        return "ยังไม่มีหลักสูตรที่กำลังเรียน / No active course."
    lines = []
    today = datetime.now(TZ).date().isoformat()
    for e in enrs:
        st = stats(con, e)
        head = f"{_name(con, e.get('studentId'))} · {e.get('courseCode')}"
        if what == "hours":
            lines.append(f"{head}\nทั้งหมด {_hours(st['total'])} · เรียนแล้ว {_hours(st['used'])} · คงเหลือ {_hours(st['remaining'])} ชม.")
        else:
            nxt = sorted((s for s in _col(con, "sessions") if s.get("enrolmentId") == e["id"] and s.get("status") == "scheduled" and s.get("date", "") >= today), key=lambda s: s["date"] + s.get("start", ""))[:3]
            lines.append(head + "\n" + ("\n".join("• " + _when(s)[0] for s in nxt) if nxt else "• ยังไม่มีการนัด"))
    return "\n\n".join(lines)


def webhook(con, events, cfg):
    """Handle LINE events; returns reply payloads to send (token, text)."""
    replies = []
    help_text = ("พิมพ์ \"ตาราง\" ดูคาบเรียนถัดไป หรือ \"ชั่วโมง\" ดูชั่วโมงคงเหลือ\n"
                 "ยังไม่เชื่อมบัญชี? เข้าระบบ DeepDistrict → ตั้งค่า → เชื่อม LINE แล้วพิมพ์รหัส 6 หลักที่นี่\n\n"
                 "Type \"schedule\" or \"hours\". To link: DeepDistrict → Settings → Connect LINE, then send the 6-digit code here.")
    for ev in events:
        token, src = ev.get("replyToken"), (ev.get("source") or {}).get("userId")
        if ev.get("type") == "follow" and token:
            replies.append((token, "ยินดีต้อนรับสู่ DeepDistrict 👋\n" + help_text))
        if ev.get("type") != "message" or (ev.get("message") or {}).get("type") != "text" or not token:
            continue
        text = (ev["message"].get("text") or "").strip()
        linked = con.execute("SELECT user_id FROM line_users WHERE line_user_id=?", (src,)).fetchone()
        if text.isdigit() and len(text) == 6:
            r = con.execute("SELECT user_id FROM line_codes WHERE code=? AND expires > ?", (text, time.time())).fetchone()
            if r and src:
                con.execute("INSERT INTO line_users (user_id, line_user_id, linked_at) VALUES (?,?,?) ON CONFLICT(user_id) DO UPDATE SET line_user_id=excluded.line_user_id, linked_at=excluded.linked_at",
                            (r["user_id"], src, datetime.now(timezone.utc).isoformat(timespec="seconds")))
                con.execute("DELETE FROM line_codes WHERE code=?", (text,))
                replies.append((token, f"✅ เชื่อมต่อกับบัญชี {_name(con, r['user_id'])} แล้ว จะได้รับการแจ้งเตือนจาก DeepDistrict ทาง LINE\n✅ Linked. You will receive DeepDistrict notifications here."))
            else:
                replies.append((token, "รหัสไม่ถูกต้องหรือหมดอายุ กรุณาขอรหัสใหม่ในระบบ\nCode invalid or expired — please get a new one."))
        elif linked and any(k in text.lower() for k in ("ตาราง", "schedule", "คาบ")):
            replies.append((token, _summary(con, linked["user_id"], "schedule")))
        elif linked and any(k in text.lower() for k in ("ชั่วโมง", "hours", "hour")):
            replies.append((token, _summary(con, linked["user_id"], "hours")))
        else:
            replies.append((token, help_text))
    return replies
