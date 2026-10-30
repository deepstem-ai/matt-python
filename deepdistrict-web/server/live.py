"""Live class: the teacher and the learners work on the same question set at the same time.

Two modes (chosen when the class starts):
  * paced — the teacher leads one question at a time:
        lobby → open (learners answer) → locked → reveal (answer + explanation) → next … → ended
  * self  — learners work through the whole set at their own pace while the teacher watches a live
        grid (learner × question, right/wrong); the teacher closes answers and reveals the key for
        everyone, then can step through the questions to explain them.
Three views, each from its own endpoint:
  * teacher panel  (live/host)   answer key, every learner's answers, per-question statistics
  * share screen   (live/share)  for Zoom / the projector: questions and the join code only — no key
                                 (until reveal) and no learner names. The key is never sent to it early.
  * learner screen (live/state)  the learner's own answers; the key only after reveal
Everything is polled (every 1–2 s), so it runs on any WSGI host. Every answer is kept and feeds the
item statistics (calibrate.py).
"""

import json
import random
import secrets
from datetime import datetime, timezone

import exams
import qsets

MODES = ("paced", "self")
CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"   # no 0/O, 1/I
GRACE = 3


def init(con):
    con.executescript("""
    CREATE TABLE IF NOT EXISTS live_sessions (id TEXT PRIMARY KEY, code TEXT NOT NULL, owner TEXT NOT NULL, status TEXT NOT NULL,
                                              created_at TEXT NOT NULL, data TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS live_code ON live_sessions (code, status);
    """)


def now():
    return datetime.now(timezone.utc)


def put(con, s, control=False):
    s["version"] = int(s.get("version") or 0) + 1
    if control:
        s["pv"] = int(s.get("pv") or 0) + 1          # changes only when the teacher acts (or the timer ends)
    con.execute("INSERT INTO live_sessions (id, code, owner, status, created_at, data) VALUES (?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET "
                "status=excluded.status, data=excluded.data", (s["id"], s["code"], s["owner"], "ended" if s["phase"] == "ended" else "active", s["createdAt"], json.dumps(s, ensure_ascii=False)))


def get(con, sid):
    r = con.execute("SELECT data FROM live_sessions WHERE id=?", (str(sid)[:40],)).fetchone()
    return json.loads(r["data"]) if r else None


def by_code(con, code):
    r = con.execute("SELECT data FROM live_sessions WHERE code=? AND status='active' ORDER BY created_at DESC LIMIT 1", (str(code or "").strip().upper()[:8],)).fetchone()
    return json.loads(r["data"]) if r else None


def all_sessions(con, owner=None, limit=100):
    q, a = "SELECT data FROM live_sessions", []
    if owner:
        q += " WHERE owner=?"; a.append(owner)
    return [json.loads(r["data"]) for r in con.execute(q + " ORDER BY created_at DESC LIMIT ?", a + [limit])]


def _questions(items):
    snap, qs = {}, []
    for it in items:
        snap[it["id"]] = it
        if it["kind"] == "sat":
            qs.append({"key": it["id"], "itemId": it["id"]})
        else:
            for gi, g in enumerate(it["groups"]):
                for qi in range(len(g["questions"])):
                    qs.append({"key": f"{it['id']}:{gi}:{qi}", "itemId": it["id"], "gi": gi, "qi": qi})
    return snap, qs


def create(con, me, body):
    mode = body.get("mode") if body.get("mode") in MODES else "paced"
    qset = qsets.get(con, body.get("setId")) if body.get("setId") else None
    if body.get("setId") and (not qset or (qset["owner"] != me["id"] and me["role"] != "admin")):
        raise ValueError("question set not found")
    if qset:
        kind, items = qset["kind"], qsets.items_of(con, qset)
        title = str(body.get("title") or "").strip()[:120] or qset["title"]
    else:                                             # quick class without a saved set
        kind = body.get("kind") if body.get("kind") in ("sat", "ielts-r") else "sat"
        if kind == "sat":
            doms = [d for d in (body.get("domains") or exams.SAT_ORDER) if d in exams.SAT_DOMAINS] or exams.SAT_ORDER
            want = body.get("difficulty") if body.get("difficulty") in exams.DIFF else None
            cand = [i for i in exams.items(con, "sat", "approved") if i["domain"] in doms and (not want or i["difficulty"] == want)]
            n = max(1, min(40, int(body.get("count") or 10)))
            if len(cand) < n:
                raise ValueError(f"only {len(cand)} approved SAT questions match")
            items = exams._sat_order(random.Random(secrets.randbits(32)).sample(cand, n))
        else:
            sets = exams.items(con, "ielts-r", "approved")
            items = [s for s in sets if s["id"] == body.get("setId2")][:1] or sets[:1]
        title = str(body.get("title") or "").strip()[:120] or ("SAT Reading and Writing" if kind == "sat" else "IELTS Reading")
    if not items:
        raise ValueError("no approved questions for this class")
    # answer options in a fresh order for this class (a saved set keeps its own order, so it matches its PDFs)
    seed = qset.get("seed", qset["id"]) if qset else secrets.randbits(48)
    snap, qs = _questions(exams.arrange(items, seed, exams.settings(con)["shuffle"]))
    code = None
    for _ in range(50):
        c = "".join(secrets.choice(CODE_CHARS) for _ in range(6))
        if not by_code(con, c):
            code = c
            break
    s = {"id": "l" + secrets.token_hex(6), "code": code, "owner": me["id"], "ownerName": me.get("name", ""), "title": title, "kind": kind, "mode": mode,
         "setId": qset["id"] if qset else None, "questions": qs, "snap": snap, "index": 0, "phase": "lobby",
         "seconds": max(0, min(600, int(body.get("seconds") or 0))) if mode == "paced" else 0,
         "minutes": max(0, min(240, int(body.get("minutes") or 0))) if mode == "self" else 0,
         "openedAt": None, "participants": {}, "answers": {}, "createdAt": exams.iso(), "version": 0, "pv": 0}
    put(con, s, control=True)
    return s


def deadline(s):
    if s["phase"] != "open" or not s.get("openedAt"):
        return None
    span = s["seconds"] if s["mode"] == "paced" else s.get("minutes", 0) * 60
    return datetime.fromisoformat(s["openedAt"]).timestamp() + span if span else None


def _expire(s):
    d = deadline(s)
    if d and now().timestamp() > d + GRACE:
        s["phase"] = "locked"
        return True
    return False


def touch(con, s):
    if _expire(s):
        put(con, s, control=True)


def control(con, s, action, index=None):
    n = len(s["questions"])
    if s["phase"] == "ended":
        raise ValueError("this live class has ended")
    if action == "open":
        s["phase"], s["openedAt"] = "open", exams.iso()
    elif action == "lock":
        s["phase"] = "locked"
    elif action == "reveal":
        s["phase"] = "reveal"
    elif action in ("next", "prev", "goto"):
        i = s["index"] + (1 if action == "next" else -1) if action != "goto" else int(index or 0)
        if not 0 <= i < n:
            raise ValueError("no more questions")
        s["index"] = i
        if s["mode"] == "paced":                      # a new question starts closed
            s["phase"], s["openedAt"] = "lobby", None
    elif action == "end":
        s["phase"], s["endedAt"] = "ended", exams.iso()
    else:
        raise ValueError("unknown action")
    put(con, s, control=True)


def join(con, s, me):
    if me["id"] not in s["participants"]:
        s["participants"][me["id"]] = {"name": me.get("nick") or me.get("name", ""), "joinedAt": exams.iso()}
        put(con, s)


def answer(con, s, me, value, key=None):
    if me["id"] not in s["participants"]:
        raise ValueError("join first")
    if _expire(s):
        put(con, s, control=True)
    if s["phase"] != "open":
        raise ValueError("answers are closed")
    if s["mode"] == "self":
        q = next((x for x in s["questions"] if x["key"] == key), None)
        if not q:
            raise ValueError("unknown question")
    else:
        q = s["questions"][s["index"]]
    v = str(value or "").strip()[:80]
    if v:
        s["answers"].setdefault(q["key"], {})[me["id"]] = v
    else:
        s["answers"].get(q["key"], {}).pop(me["id"], None)
    put(con, s)


# ---------------------------------------------------------------- building views
def _number(s, q):
    return s["questions"].index(q) + 1


def _question(s, q, key=False, passage=True):
    it = s["snap"][q["itemId"]]
    if s["kind"] == "sat":
        out = {"key": q["key"], "number": _number(s, q), "type": "sat", "passage": it["passage"], "table": it.get("table"), "stem": it["stem"], "choices": it["choices"]}
        if key:
            out.update({"answer": it["answer"], "explanation": it.get("explanation")})
        return out
    g = it["groups"][q["gi"]]
    qq = g["questions"][q["qi"]]
    out = {"key": q["key"], "number": _number(s, q), "type": "ielts-r", "itemId": it["id"], "group": g["type"], "gi": q["gi"],
           "instructions": g["instructions"], "options": (qq.get("options") if g["type"] == "mcq" else g["options"]), "wordLimit": g.get("wordLimit"),
           "text": qq["text"], "image": g.get("image") or ""}
    if passage:
        out.update({"title": it["title"], "paragraphs": it["paragraphs"], "labelled": it.get("labelled", True)})
    if key:
        out["answer"] = qq["answer"]
    return out


def _passages(s):
    return {iid: {"title": it["title"], "paragraphs": it["paragraphs"], "labelled": it.get("labelled", True)} for iid, it in s["snap"].items() if it["kind"] == "ielts-r"}


def correct(s, q, value):
    return exams.is_correct(s["snap"][q["itemId"]], value, q.get("gi"), q.get("qi"))


def tally(s, q):
    ans = s["answers"].get(q["key"], {})
    counts = {}
    for v in ans.values():
        k = exams.norm(v) if s["kind"] == "ielts-r" else v
        counts[k] = counts.get(k, 0) + 1
    return {"answered": len(ans), "counts": counts, "correct": sum(1 for v in ans.values() if correct(s, q, v))}


def scores(s):
    out = {}
    for uid, p in s["participants"].items():
        mine = [(q, s["answers"].get(q["key"], {}).get(uid)) for q in s["questions"]]
        out[uid] = {"name": p["name"], "correct": sum(1 for q, v in mine if v is not None and correct(s, q, v)), "answered": sum(1 for _, v in mine if v is not None)}
    return out


def grid(s):
    """Teacher grid: every learner × every question (value, right/wrong) and per-question totals."""
    people = scores(s)
    cols = []
    for q in s["questions"]:
        t = tally(s, q)
        cols.append({"key": q["key"], "number": _number(s, q), "answered": t["answered"], "correct": t["correct"],
                     "pct": round(t["correct"] / t["answered"] * 100) if t["answered"] else None})
    rows = []
    for uid, p in s["participants"].items():
        cells = {}
        for q in s["questions"]:
            v = s["answers"].get(q["key"], {}).get(uid)
            if v is not None:
                cells[q["key"]] = [v, bool(correct(s, q, v))]
        rows.append({"id": uid, "name": p["name"], "cells": cells, **{k: people[uid][k] for k in ("correct", "answered")}})
    rows.sort(key=lambda r: r["name"].lower())
    return {"columns": cols, "rows": rows}


def _base(s):
    d = deadline(s)
    return {"id": s["id"], "title": s["title"], "kind": s["kind"], "mode": s["mode"], "phase": s["phase"], "index": s["index"], "total": len(s["questions"]),
            "seconds": s["seconds"], "minutes": s.get("minutes", 0), "openedAt": s.get("openedAt"), "deadline": datetime.fromtimestamp(d, timezone.utc).isoformat(timespec="seconds") if d else None,
            "version": s["version"], "pv": s.get("pv", 0), "serverNow": exams.iso()}


def host_view(s):
    q = s["questions"][s["index"]] if s["questions"] else None
    out = _base(s)
    out.update({"code": s["code"], "setId": s.get("setId"), "question": _question(s, q, key=True) if q else None, "tally": tally(s, q) if q else None,
                "roster": [{"id": uid, "name": p["name"], "answered": bool(q and uid in s["answers"].get(q["key"], {}))} for uid, p in s["participants"].items()],
                "grid": grid(s), "scores": scores(s) if s["phase"] == "ended" else None})
    if s["mode"] == "self":
        out["questions"] = [_question(s, x, key=True, passage=False) for x in s["questions"]]
        out["passages"] = _passages(s)
    return out


def share_view(s):
    """For screen sharing: no learner names, and the key only once the teacher has revealed it."""
    q = s["questions"][s["index"]] if s["questions"] else None
    reveal = s["phase"] in ("reveal", "ended")
    out = _base(s)
    out["code"] = s["code"]
    out["people"] = len(s["participants"])
    if q and (s["mode"] == "self" or s["phase"] != "lobby" or reveal):
        out["question"] = _question(s, q, key=reveal)
        t = tally(s, q)
        out["answered"] = t["answered"]
        if reveal:
            out["tally"] = t
    if s["mode"] == "self":
        g = grid(s)
        total = len(s["questions"]) * max(1, len(s["participants"]))
        out["progress"] = {"answers": sum(c["answered"] for c in g["columns"]), "possible": total,
                           "finished": sum(1 for r in g["rows"] if r["answered"] == len(s["questions"]))}
    return out


def student_view(s, uid):
    reveal = s["phase"] in ("reveal",)
    out = _base(s)
    out["teacher"] = s.get("ownerName", "")
    if s["phase"] == "ended":
        out["score"] = scores(s).get(uid)
        return out
    if s["mode"] == "self":
        if s["phase"] != "lobby":
            out["questions"] = [_question(s, q, key=reveal, passage=False) for q in s["questions"]]
            out["passages"] = _passages(s)
            out["mine"] = {q["key"]: s["answers"][q["key"]][uid] for q in s["questions"] if uid in s["answers"].get(q["key"], {})}
            if reveal:
                out["results"] = {q["key"]: bool(q["key"] in out["mine"] and correct(s, q, out["mine"][q["key"]])) for q in s["questions"]}
                out["score"] = scores(s).get(uid)
        return out
    q = s["questions"][s["index"]] if s["questions"] else None
    if q and s["phase"] != "lobby":
        out["question"] = _question(s, q, key=reveal)
        mine = s["answers"].get(q["key"], {}).get(uid)
        out["mine"] = mine
        if reveal:
            t = tally(s, q)
            out["result"] = {"correct": mine is not None and correct(s, q, mine), "classCorrect": t["correct"], "answered": t["answered"]}
    return out


def responses(con):
    """(item key, user id, correct, rest-of-class-score fraction, source) for every live answer."""
    out = []
    for r in con.execute("SELECT data FROM live_sessions"):
        s = json.loads(r["data"])
        sc = scores(s)
        n = len(s["questions"]) or 1
        for q in s["questions"]:
            for uid, v in s["answers"].get(q["key"], {}).items():
                ok = correct(s, q, v)
                out.append((q["key"], uid, bool(ok), (sc.get(uid, {}).get("correct", 0) - ok) / max(1, n - 1), "live:" + s["id"]))
    return out
