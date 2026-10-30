"""Audited PDF documents: test papers (with an optional teacher answer key) and score reports.

The server decides what goes into the document and records it before the browser draws the PDF:
  * a verification code (e.g. DD-7K3M-9QPA) printed on every page and as a QR code
  * who generated it, their role, and when (Bangkok time) — in the database and on the PDF
  * exactly which item versions it contains (a re-download rebuilds the same paper)
  * every download / print, in doc_export_log
Anyone can check a printed copy at pages/verify.html: it confirms the code is genuine and shows the
title, date and issuer — never the questions, and only a masked learner name for score reports.
"""

import json
import secrets
from datetime import datetime, timedelta, timezone

import exams

TZ = timezone(timedelta(hours=7))
CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def init(con):
    con.executescript("""
    CREATE TABLE IF NOT EXISTS doc_exports (code TEXT PRIMARY KEY, kind TEXT NOT NULL, title TEXT, created_at TEXT NOT NULL, created_by TEXT,
                                            created_by_name TEXT, role TEXT, revoked INTEGER DEFAULT 0, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS doc_export_log (code TEXT NOT NULL, at TEXT NOT NULL, user_id TEXT, user_name TEXT, action TEXT NOT NULL);
    """)


def new_code(con):
    while True:
        c = "DD-" + "".join(secrets.choice(CHARS) for _ in range(4)) + "-" + "".join(secrets.choice(CHARS) for _ in range(4))
        if not con.execute("SELECT 1 FROM doc_exports WHERE code=?", (c,)).fetchone():
            return c


def bkk(iso):
    return datetime.fromisoformat(iso).astimezone(TZ).strftime("%Y-%m-%d %H:%M")


def log(con, code, me, action):
    con.execute("INSERT INTO doc_export_log (code, at, user_id, user_name, action) VALUES (?,?,?,?,?)",
                (code, exams.iso(), me and me["id"], me and me.get("name"), action[:30]))


def _strip(it, key):
    """Item content for the paper; keys/explanations only in the teacher copy."""
    if it["kind"] == "sat":
        out = {k: it.get(k) for k in ("id", "kind", "version", "passage", "table", "image", "stem", "choices", "domain", "skill", "difficulty")}
        if key:
            out.update({"answer": it["answer"], "explanation": it.get("explanation")})
        return out
    if it["kind"] == "ielts-r":
        groups = [{"type": g["type"], "instructions": g["instructions"], "options": g["options"], "wordLimit": g.get("wordLimit"), "image": g.get("image", ""),
                   "context": g.get("context", ""),
                   "questions": [{"text": q["text"], "options": q.get("options"), "marks": exams.marks(g, q), **({"answer": q["answer"]} if key else {})} for q in g["questions"]]}
                  for g in it["groups"]]
        return {"id": it["id"], "kind": it["kind"], "version": it["version"], "title": it["title"], "paragraphs": it["paragraphs"], "labelled": it.get("labelled", True), "groups": groups}
    return {k: it.get(k) for k in ("id", "kind", "version", "task", "prompt", "image", "table", "minWords")}


def _version(con, iid, ver):
    r = con.execute("SELECT data FROM exam_item_versions WHERE id=? AND version=?", (iid, ver)).fetchone()
    return json.loads(r["data"]) if r else exams.get_item(con, iid)


def create_paper(con, me, body):
    qset = None
    if body.get("setId"):
        import qsets
        qset = qsets.get(con, body["setId"])
        if not qset or (qset["owner"] != me["id"] and me["role"] != "admin"):
            raise ValueError("question set not found")
        body = dict(body, kind=qset["kind"])
    kind = body.get("kind")
    if kind not in exams.KINDS:
        raise ValueError("choose SAT, IELTS Reading or IELTS Writing")
    approved = exams.items(con, kind, "approved")
    ids = [i for i in (body.get("itemIds") or []) if isinstance(i, str)]
    if qset:
        chosen = qsets.items_of(con, qset)
    elif ids:
        chosen = [i for i in approved if i["id"] in ids]
        chosen.sort(key=lambda i: ids.index(i["id"]))
    elif kind == "sat":
        import random
        doms = [d for d in (body.get("domains") or exams.SAT_ORDER) if d in exams.SAT_DOMAINS] or exams.SAT_ORDER
        cand = [i for i in approved if i["domain"] in doms and not i.get("pretest")]
        n = max(1, min(54, int(body.get("count") or 10)))
        if len(cand) < n:
            raise ValueError(f"only {len(cand)} approved SAT questions match")
        chosen = exams._sat_order(random.Random(secrets.randbits(32)).sample(cand, n))
    else:
        chosen = []
    if not chosen:
        raise ValueError("choose at least one approved item")
    if len(chosen) > 60:
        raise ValueError("at most 60 items in one paper")
    code = new_code(con)
    title = str(body.get("title") or "").strip()[:120] or (qset and qset["title"]) or {"sat": "SAT Reading and Writing practice", "ielts-r": "IELTS Academic Reading practice", "ielts-w": "IELTS Academic Writing practice"}[kind]
    data = {"kind": "paper", "exam": kind, "title": title, "note": str(body.get("note") or (qset or {}).get("note") or "").strip()[:200], "withKey": bool(body.get("withKey")),
            "notes": bool(body.get("notes")) and not body.get("withKey"), "setId": qset and qset["id"],
            "seed": qset.get("seed", qset["id"]) if qset else secrets.randbits(48), "shuffle": exams.settings(con)["shuffle"],
            "variant": qset.get("variant", 1) if qset else None,
            "minutes": int(body.get("minutes") or 0) or None, "items": [[i["id"], i["version"]] for i in chosen]}
    now = exams.iso()
    con.execute("INSERT INTO doc_exports (code, kind, title, created_at, created_by, created_by_name, role, data) VALUES (?,?,?,?,?,?,?,?)",
                (code, "paper", title, now, me["id"], me.get("name"), me["role"], json.dumps(data, ensure_ascii=False)))
    log(con, code, me, "created")
    return payload(con, code, me)


def create_report(con, me, att, names):
    code = new_code(con)
    title = {"sat": "SAT Reading and Writing", "ielts-r": "IELTS Academic Reading", "ielts-w": "IELTS Academic Writing"}[att["kind"]] + " — score report"
    data = {"kind": "report", "attemptId": att["id"], "learner": names.get(att["userId"], ""), "learnerId": att["userId"]}
    con.execute("INSERT INTO doc_exports (code, kind, title, created_at, created_by, created_by_name, role, data) VALUES (?,?,?,?,?,?,?,?)",
                (code, "report", title, exams.iso(), me["id"], me.get("name"), me["role"], json.dumps(data, ensure_ascii=False)))
    log(con, code, me, "created")
    return payload(con, code, me)


def get(con, code):
    r = con.execute("SELECT * FROM doc_exports WHERE code=?", (str(code or "").strip().upper()[:16],)).fetchone()
    return dict(r) if r else None


def payload(con, code, me):
    """Everything the browser needs to draw the PDF (items rebuilt from the recorded versions)."""
    d = get(con, code)
    data = json.loads(d["data"])
    out = {"code": d["code"], "kind": d["kind"], "title": d["title"], "createdAt": d["created_at"], "createdAtLocal": bkk(d["created_at"]) + " (UTC+7)",
           "createdBy": d["created_by_name"], "role": d["role"], "generatedBy": me.get("name"), "generatedAt": bkk(exams.iso()) + " (UTC+7)",
           "downloads": con.execute("SELECT COUNT(*) FROM doc_export_log WHERE code=? AND action IN ('download','print')", (code,)).fetchone()[0]}
    if d["kind"] == "paper":
        key = data["withKey"] and me["role"] in ("admin", "teacher")
        out.update({"exam": data["exam"], "note": data["note"], "withKey": key, "minutes": data.get("minutes"), "notes": bool(data.get("notes")),
                    "variant": data.get("variant"),
                    "items": [_strip(i, key) for i in exams.arrange([_version(con, iid, ver) for iid, ver in data["items"]], data.get("seed"), data.get("shuffle", False) and data.get("seed") is not None)]})
    else:
        a = exams.get_attempt(con, data["attemptId"])
        out.update({"exam": a["kind"] if a else "", "learner": data["learner"], "attempt": report_view(a) if a else None})
    return out


def report_view(a):
    r = a.get("result") or {}
    out = {"id": a["id"], "kind": a["kind"], "mode": a["mode"], "status": a["status"], "startedAt": bkk(a["createdAt"]),
           "finishedAt": bkk(a["finishedAt"]) if a.get("finishedAt") else None}
    if a["kind"] == "sat":
        out.update({k: r.get(k) for k in ("estimate", "ceiling", "correct", "total", "route", "modules", "byDomain")})
    elif a["kind"] == "ielts-r":
        out.update({k: r.get(k) for k in ("band", "correct", "total", "scaled", "passages")})
    else:
        t = r.get("teacher") or {}
        out.update({"words": r.get("words"), "band": t.get("band"), "tasks": t.get("tasks"), "criteria": t.get("criteria"), "comment": t.get("comment"),
                    "markedBy": t.get("byName"), "tasksInfo": {iid: a["snap"][iid]["task"] for iid in a["sections"][0]["items"]}})
    return out


def mask(name):
    parts = [p for p in str(name or "").split() if p]
    return " ".join(p[0] + "•" * min(4, max(1, len(p) - 1)) for p in parts[:2]) or "—"


def verify(con, code):
    d = get(con, code)
    if not d:
        return {"valid": False}
    data = json.loads(d["data"])
    out = {"valid": not d["revoked"], "revoked": bool(d["revoked"]), "code": d["code"], "kind": d["kind"], "title": d["title"],
           "issuedAt": bkk(d["created_at"]) + " (UTC+7)", "issuer": "DeepDistrict.si", "issuedByRole": d["role"],
           "issuedBy": mask(d["created_by_name"]), "downloads": con.execute("SELECT COUNT(*) FROM doc_export_log WHERE code=? AND action IN ('download','print')", (d["code"],)).fetchone()[0]}
    if d["kind"] == "paper":
        out["items"] = len(data["items"])
        out["teacherCopy"] = bool(data.get("withKey"))
    else:
        out["learner"] = mask(data.get("learner"))
        a = exams.get_attempt(con, data["attemptId"])
        if a:
            rv = report_view(a)
            out["score"] = rv.get("estimate") or rv.get("band") or (f"{rv.get('correct')}/{rv.get('total')}" if rv.get("total") else None)
            out["testDate"] = rv.get("finishedAt")
    return out


def listing(con, me, limit=300):
    q, a = "SELECT code, kind, title, created_at, created_by, created_by_name, role, revoked FROM doc_exports", []
    if me["role"] != "admin":
        q += " WHERE created_by=?"; a.append(me["id"])
    rows = [dict(r) for r in con.execute(q + " ORDER BY created_at DESC LIMIT ?", a + [limit])]
    for r in rows:
        r["log"] = [dict(x) for x in con.execute("SELECT at, user_name, action FROM doc_export_log WHERE code=? ORDER BY at DESC LIMIT 50", (r["code"],))]
    return rows
