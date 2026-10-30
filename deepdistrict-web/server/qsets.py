"""Question sets: a named, saved list of approved items that a teacher reuses everywhere.

One set → the student PDF (with a notes column), the teacher PDF (answer key), the live class
(teacher-paced or self-paced) — always the same questions in the same order, because the set
records each item's version. Editing an item in the bank later does not change a saved set.
"""

import json
import random
import secrets

import exams

KINDS = ("sat", "ielts-r", "ielts-w", "m1")


def init(con):
    con.execute("CREATE TABLE IF NOT EXISTS question_sets (id TEXT PRIMARY KEY, owner TEXT NOT NULL, updated_at TEXT NOT NULL, data TEXT NOT NULL)")


def get(con, sid):
    r = con.execute("SELECT data FROM question_sets WHERE id=?", (str(sid or "")[:40],)).fetchone()
    return json.loads(r["data"]) if r else None


def put(con, s):
    s["updatedAt"] = exams.iso()
    con.execute("INSERT INTO question_sets (id, owner, updated_at, data) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET updated_at=excluded.updated_at, data=excluded.data",
                (s["id"], s["owner"], s["updatedAt"], json.dumps(s, ensure_ascii=False)))


def published(con):
    """Sets learners may start themselves (Online tests → Admission & practice sets)."""
    out = [json.loads(r["data"]) for r in con.execute("SELECT data FROM question_sets ORDER BY updated_at DESC")]
    return [x for x in out if x.get("published")]


def listing(con, me):
    q, a = "SELECT data FROM question_sets", []
    if me["role"] != "admin":
        q += " WHERE owner=? OR data LIKE '%\"source\": \"ready-made\"%'"; a.append(me["id"])
    return [json.loads(r["data"]) for r in con.execute(q + " ORDER BY updated_at DESC", a)]


def version(con, iid, ver):
    r = con.execute("SELECT data FROM exam_item_versions WHERE id=? AND version=?", (iid, ver)).fetchone()
    return json.loads(r["data"]) if r else exams.get_item(con, iid)


def items_of(con, s):
    """The set's items exactly as recorded (item id + version)."""
    return [x for x in (version(con, iid, ver) for iid, ver in s["items"]) if x]


def create(con, me, body, old=None):
    kind = body.get("kind") if body.get("kind") in KINDS else (old or {}).get("kind", "sat")
    title = str(body.get("title") or "").strip()[:120]
    if not title:
        raise ValueError("give the set a name")
    approved = exams.items(con, kind, "approved")
    ids = [i for i in (body.get("itemIds") or []) if isinstance(i, str)]
    if kind == "ielts-r" and not ids and body.get("setId"):
        ids = [body["setId"]]
    if kind == "ielts-r" and ids:
        by = {i["id"]: i for i in approved}
        chosen = [by[i] for i in ids if i in by][:3]                # 1 passage (practice) … 3 passages (full Reading test)
    elif kind == "ielts-w" and ids:
        by = {i["id"]: i for i in approved}
        chosen = sorted([by[i] for i in ids if i in by][:2], key=lambda t: t["task"])
    elif ids:
        by = {i["id"]: i for i in approved}
        chosen = [by[i] for i in ids if i in by]
    elif old and not body.get("reshuffle"):
        chosen = None
    elif kind in ("ielts-r", "ielts-w"):
        raise ValueError("choose the passages / tasks for this set")
    elif kind == "m1":
        prog = body.get("program") if body.get("program") in exams.M1_PROGRAMS else "gate"
        subs = [x for x in (body.get("subjects") or exams.M1_PROGRAMS[prog]["subjects"]) if x in exams.M1_PROGRAMS[prog]["subjects"]] or exams.M1_PROGRAMS[prog]["subjects"]
        cand = [i for i in approved if i["program"] == prog and i["subject"] in subs]
        n = max(1, min(60, int(body.get("count") or 20)))
        if len(cand) < n:
            raise ValueError(f"only {len(cand)} approved M.1 questions match")
        chosen = sorted(random.Random(secrets.randbits(32)).sample(cand, n), key=lambda i: (exams.M1_PROGRAMS[prog]["subjects"].index(i["subject"]), exams.DIFF.index(i["difficulty"])))
    else:
        doms = [d for d in (body.get("domains") or exams.SAT_ORDER) if d in exams.SAT_DOMAINS] or exams.SAT_ORDER
        want = body.get("difficulty") if body.get("difficulty") in exams.DIFF else None
        cand = [i for i in approved if i["domain"] in doms and not i.get("pretest") and (not want or i["difficulty"] == want)]
        n = max(1, min(54, int(body.get("count") or 10)))
        if len(cand) < n:
            raise ValueError(f"only {len(cand)} approved SAT questions match")
        chosen = exams._sat_order(random.Random(secrets.randbits(32)).sample(cand, n))
    s = old or {"id": "q" + secrets.token_hex(6), "owner": me["id"], "ownerName": me.get("name", ""), "createdAt": exams.iso(),
                "seed": secrets.randbits(48), "variant": 1}
    if old and body.get("newOrder"):                  # same questions, answer options in a new order
        s["seed"], s["variant"] = secrets.randbits(48), int(s.get("variant") or 1) + 1
    s.update({"title": title, "kind": kind})
    if "published" in body or not old:
        s["published"] = bool(body.get("published"))          # learners can start it themselves from Online tests
    if "minutes" in body or not old:
        s["minutes"] = max(0, min(240, int(body.get("minutes") or 0))) or None
    for k in ("exam", "source", "titleTh"):
        if k in body:
            s[k] = str(body.get(k) or "")[:120]
    if "note" in body or not old:
        s["note"] = str(body.get("note") or "").strip()[:200]
    if chosen is not None:
        if not chosen:
            raise ValueError("choose at least one approved item")
        s["items"] = [[i["id"], i["version"]] for i in chosen]
    put(con, s)
    return s


def summary(con, s):
    its = items_of(con, s)
    n = sum(exams.total_marks(it) for it in its) if s["kind"] == "ielts-r" else len(its)
    out = {k: s.get(k) for k in ("id", "title", "titleTh", "kind", "note", "ownerName", "createdAt", "updatedAt", "variant", "published", "minutes", "exam", "source")}
    out.update({"questions": n, "items": [{"id": i["id"], "version": i["version"], "label": (i.get("stem") or i.get("title") or i.get("prompt") or "")[:90],
                                          "domain": i.get("domain") or i.get("subject"), "difficulty": i.get("difficulty")} for i in its]})
    return out
