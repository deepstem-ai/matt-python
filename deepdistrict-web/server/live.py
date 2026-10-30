"""Live class: the teacher's screen and the students' screens show the same question at the same time.

A teacher builds a session from approved bank items (SAT questions, or the questions of one IELTS
Reading passage), shows a join code, and steps through the questions:
    lobby → open (students answer) → locked → reveal (answer + explanation) → next … → ended
Students join with the code and poll the state every 1–2 seconds (no WebSockets needed, so it runs
on any WSGI host). The answer key is sent only by the teacher endpoint, and to students only after
"reveal". Every answer is stored and later feeds the difficulty statistics.
"""

import json
import random
import secrets
from datetime import datetime, timezone

import exams

PHASES = ("lobby", "open", "locked", "reveal", "ended")
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


def put(con, s):
    s["version"] = int(s.get("version") or 0) + 1
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


def create(con, me, body):
    kind = body.get("kind") if body.get("kind") in ("sat", "ielts-r") else "sat"
    snap, qs = {}, []
    if kind == "sat":
        pool = [i for i in exams.items(con, "sat", "approved")]
        ids = [i for i in (body.get("itemIds") or []) if isinstance(i, str)]
        if ids:
            chosen = [i for i in pool if i["id"] in ids]
            chosen.sort(key=lambda i: ids.index(i["id"]))
        else:
            doms = [d for d in (body.get("domains") or exams.SAT_ORDER) if d in exams.SAT_DOMAINS] or exams.SAT_ORDER
            want = body.get("difficulty") if body.get("difficulty") in exams.DIFF else None
            cand = [i for i in pool if i["domain"] in doms and (not want or i["difficulty"] == want)]
            n = max(1, min(40, int(body.get("count") or 10)))
            if len(cand) < n:
                raise ValueError(f"only {len(cand)} approved SAT questions match")
            chosen = exams._sat_order(random.Random(secrets.randbits(32)).sample(cand, n))
        if not chosen:
            raise ValueError("choose at least one approved question")
        for it in chosen:
            snap[it["id"]] = it
            qs.append({"key": it["id"], "itemId": it["id"]})
    else:
        sets = exams.items(con, "ielts-r", "approved")
        it = next((s for s in sets if s["id"] == body.get("setId")), None) or (sets[0] if sets else None)
        if not it:
            raise ValueError("no approved IELTS Reading passage yet")
        snap[it["id"]] = it
        for gi, g in enumerate(it["groups"]):
            for qi in range(len(g["questions"])):
                qs.append({"key": f"{it['id']}:{gi}:{qi}", "itemId": it["id"], "gi": gi, "qi": qi})
    code = None
    for _ in range(50):
        c = "".join(secrets.choice(CODE_CHARS) for _ in range(6))
        if not by_code(con, c):
            code = c
            break
    s = {"id": "l" + secrets.token_hex(6), "code": code, "owner": me["id"], "ownerName": me.get("name", ""), "title": str(body.get("title") or "").strip()[:120] or
         ("SAT Reading and Writing" if kind == "sat" else "IELTS Reading"), "kind": kind, "questions": qs, "snap": snap, "index": 0, "phase": "lobby",
         "seconds": max(0, min(600, int(body.get("seconds") or 0))), "openedAt": None, "participants": {}, "answers": {}, "createdAt": exams.iso(), "version": 0}
    put(con, s)
    return s


def _expire(s):
    if s["phase"] == "open" and s.get("seconds") and s.get("openedAt"):
        if now().timestamp() > datetime.fromisoformat(s["openedAt"]).timestamp() + s["seconds"] + GRACE:
            s["phase"] = "locked"
            return True
    return False


def touch(con, s):
    if _expire(s):
        put(con, s)


def control(con, s, action, index=None):
    n = len(s["questions"])
    if s["phase"] == "ended" and action != "reopen":
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
        s["index"], s["phase"], s["openedAt"] = i, "lobby", None
    elif action == "end":
        s["phase"], s["endedAt"] = "ended", exams.iso()
    else:
        raise ValueError("unknown action")
    put(con, s)


def join(con, s, me):
    p = s["participants"].get(me["id"])
    if not p:
        s["participants"][me["id"]] = {"name": me.get("nick") or me.get("name", ""), "joinedAt": exams.iso()}
        put(con, s)


def answer(con, s, me, value):
    if me["id"] not in s["participants"]:
        raise ValueError("join first")
    _expire(s)
    if s["phase"] != "open":
        raise ValueError("answers are closed for this question")
    q = s["questions"][s["index"]]
    s["answers"].setdefault(q["key"], {})[me["id"]] = str(value)[:80]
    put(con, s)


def _question(s, q, key=False):
    it = s["snap"][q["itemId"]]
    if s["kind"] == "sat":
        out = {"type": "sat", "passage": it["passage"], "table": it.get("table"), "stem": it["stem"], "choices": it["choices"]}
        if key:
            out.update({"answer": it["answer"], "explanation": it.get("explanation")})
        return out
    g = it["groups"][q["gi"]]
    qq = g["questions"][q["qi"]]
    num = sum(len(x["questions"]) for x in it["groups"][:q["gi"]]) + q["qi"] + 1
    out = {"type": "ielts-r", "title": it["title"], "paragraphs": it["paragraphs"], "labelled": it.get("labelled", True), "group": g["type"],
           "instructions": g["instructions"], "options": (qq.get("options") if g["type"] == "mcq" else g["options"]), "wordLimit": g.get("wordLimit"),
           "text": qq["text"], "number": num, "image": g.get("image") or ""}
    if key:
        out["answer"] = qq["answer"]
    return out


def correct(s, q, value):
    it = s["snap"][q["itemId"]]
    return exams.is_correct(it, value, q.get("gi"), q.get("qi"))


def tally(s, q):
    ans = s["answers"].get(q["key"], {})
    counts = {}
    for v in ans.values():
        k = exams.norm(v) if s["kind"] == "ielts-r" else v
        counts[k] = counts.get(k, 0) + 1
    right = sum(1 for v in ans.values() if correct(s, q, v))
    return {"answered": len(ans), "counts": counts, "correct": right}


def scores(s):
    out = {}
    for uid, p in s["participants"].items():
        c = sum(1 for q in s["questions"] if uid in s["answers"].get(q["key"], {}) and correct(s, q, s["answers"][q["key"]][uid]))
        out[uid] = {"name": p["name"], "correct": c, "answered": sum(1 for q in s["questions"] if uid in s["answers"].get(q["key"], {}))}
    return out


def host_view(s):
    q = s["questions"][s["index"]] if s["questions"] else None
    return {"id": s["id"], "code": s["code"], "title": s["title"], "kind": s["kind"], "phase": s["phase"], "index": s["index"], "total": len(s["questions"]),
            "seconds": s["seconds"], "openedAt": s.get("openedAt"), "version": s["version"], "serverNow": exams.iso(),
            "question": _question(s, q, key=True) if q else None, "tally": tally(s, q) if q else None,
            "roster": [{"id": uid, "name": p["name"], "answered": bool(q and uid in s["answers"].get(q["key"], {}))} for uid, p in s["participants"].items()],
            "scores": scores(s) if s["phase"] == "ended" else None}


def student_view(s, uid):
    q = s["questions"][s["index"]] if s["questions"] else None
    reveal = s["phase"] in ("reveal",)
    out = {"id": s["id"], "title": s["title"], "kind": s["kind"], "phase": s["phase"], "index": s["index"], "total": len(s["questions"]),
           "seconds": s["seconds"], "openedAt": s.get("openedAt"), "version": s["version"], "serverNow": exams.iso(), "teacher": s.get("ownerName", "")}
    if q and s["phase"] != "lobby" and s["phase"] != "ended":
        out["question"] = _question(s, q, key=reveal)
        mine = s["answers"].get(q["key"], {}).get(uid)
        out["mine"] = mine
        if reveal:
            t = tally(s, q)
            out["result"] = {"correct": mine is not None and correct(s, q, mine), "classCorrect": t["correct"], "answered": t["answered"]}
    if s["phase"] == "ended":
        out["score"] = scores(s).get(uid)
    return out


def responses(con):
    """(item key, user id, correct, session score fraction) for every answer in every live class."""
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
