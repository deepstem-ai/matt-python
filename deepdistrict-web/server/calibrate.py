"""Item statistics from real results, and difficulty suggestions for the item bank.

Responses come from finished tests (staff previews excluded) and from live classes. For every
question we compute:
  n   how many learners answered it
  p   proportion correct (the classical "difficulty index": high p = easy)
  r   discrimination — correlation between getting this question right and the learner's score on
      the rest of the test (point-biserial). Good questions have r ≥ 0.2; r < 0.1 means strong and
      weak learners do about equally well, which often signals an unclear question or a wrong key.
Suggestions appear once n ≥ the minimum (default 20):
  SAT:            p ≥ 0.75 → easy · 0.45–0.75 → medium · < 0.45 → hard
  IELTS passage:  mean p ≥ 0.70 → level 1 · 0.45–0.70 → level 2 · < 0.45 → level 3
Flags: p < 0.15 ("check the answer key"), p > 0.95 ("too easy to tell learners apart"),
r < 0.1 ("weak discrimination"). Nothing changes until a teacher clicks Apply; each change is saved
as a new item version with the evidence in its note.
"""

import json
import math

import exams
import live

DEFAULT_MIN = 20


def settings(con):
    r = con.execute("SELECT value FROM kv WHERE key='calibration'").fetchone()
    return {"minN": DEFAULT_MIN, **(json.loads(r["value"]) if r else {})}


def save_settings(con, body):
    cfg = settings(con)
    if "minN" in body:
        cfg["minN"] = max(3, min(1000, int(body["minN"])))
    con.execute("INSERT INTO kv (key, value) VALUES ('calibration', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", (json.dumps(cfg),))
    return cfg


def responses(con):
    """[(item key, user, correct, rest-of-test fraction, source)] from tests and live classes."""
    out = []
    for r in con.execute("SELECT data FROM exam_attempts WHERE kind IN ('sat','ielts-r','m1') AND status='finished'"):
        a = json.loads(r["data"])
        if a.get("preview"):
            continue
        rows = []
        for sec in a["sections"]:
            for iid in sec["items"]:
                it = a["snap"][iid]
                if it["kind"] in exams.CHOICE_KINDS:
                    rows.append((iid, exams.is_correct(it, sec["answers"].get(iid, ""))))
                else:
                    for gi, g in enumerate(it["groups"]):
                        for qi in range(len(g["questions"])):
                            k = f"{iid}:{gi}:{qi}"
                            rows.append((k, exams.is_correct(it, sec["answers"].get(k, ""), gi, qi)))
        total, n = sum(ok for _, ok in rows), len(rows)
        for k, ok in rows:
            out.append((k, a["userId"], bool(ok), (total - ok) / max(1, n - 1), "test:" + a["id"]))
    return out + live.responses(con)


def _stats(rows):
    n = len(rows)
    if not n:
        return {"n": 0}
    xs = [1.0 if ok else 0.0 for ok, _ in rows]
    ys = [rest for _, rest in rows]
    p = sum(xs) / n
    r = None
    if n >= 3:
        mx, my = p, sum(ys) / n
        sxy = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
        sx = math.sqrt(sum((x - mx) ** 2 for x in xs))
        sy = math.sqrt(sum((y - my) ** 2 for y in ys))
        r = round(sxy / (sx * sy), 2) if sx > 0 and sy > 0 else None
    return {"n": n, "p": round(p, 3), "r": r}


def flags(st, min_n):
    if st.get("n", 0) < min_n:
        return []
    f = []
    if st["p"] < 0.15:
        f.append("very-hard")
    if st["p"] > 0.95:
        f.append("very-easy")
    if st.get("r") is not None and st["r"] < 0.1:
        f.append("weak-discrimination")
    return f


def sat_level(p):
    return "e" if p >= 0.75 else "m" if p >= 0.45 else "h"


def reading_level(p):
    return 1 if p >= 0.70 else 2 if p >= 0.45 else 3


def compute(con):
    cfg = settings(con)
    min_n = cfg["minN"]
    by = {}
    for key, _uid, ok, rest, _src in responses(con):
        by.setdefault(key, []).append((ok, rest))
    questions = {k: dict(_stats(v), flags=flags(_stats(v), min_n)) for k, v in by.items()}
    items = {}
    for it in exams.items(con):
        if it["kind"] in exams.CHOICE_KINDS:
            st = questions.get(it["id"], {"n": 0, "flags": []})
            sug = sat_level(st["p"]) if st.get("n", 0) >= min_n else None
            items[it["id"]] = dict(st, current=it["difficulty"], suggest=sug, change=bool(sug and sug != it["difficulty"]),
                                   promote=bool(it.get("pretest") and st.get("n", 0) >= min_n and not st["flags"]))
        elif it["kind"] == "ielts-r":
            qs = [questions.get(f"{it['id']}:{gi}:{qi}", {"n": 0}) for gi, g in enumerate(it["groups"]) for qi in range(len(g["questions"]))]
            enough = [q for q in qs if q.get("n", 0) >= min_n]
            p = round(sum(q["p"] for q in enough) / len(enough), 3) if enough and len(enough) == len(qs) else None
            sug = reading_level(p) if p is not None else None
            items[it["id"]] = {"n": min((q.get("n", 0) for q in qs), default=0), "p": p, "current": it.get("difficulty", 2), "suggest": sug,
                               "change": bool(sug and sug != it.get("difficulty", 2)), "questions": qs,
                               "flags": sorted({f for q in qs for f in q.get("flags", [])})}
    return {"minN": min_n, "items": items, "responses": sum(len(v) for v in by.values())}


def apply(con, ids, by, promote=False):
    """Apply the suggested difficulty (and, if asked, score former pretest items). Returns how many changed."""
    st = compute(con)
    changed = 0
    for iid in ids:
        it = exams.get_item(con, iid)
        s = st["items"].get(iid)
        if not it or not s:
            continue
        note = []
        if s.get("change"):
            if it["kind"] in exams.CHOICE_KINDS:
                note.append(f"difficulty {it['difficulty']}→{s['suggest']}")
                it["difficulty"] = s["suggest"]
            else:
                note.append(f"level {it.get('difficulty')}→{s['suggest']}")
                it["difficulty"] = s["suggest"]
        if promote and s.get("promote"):
            it["pretest"] = False
            note.append("pretest → scored")
        if note:
            it["note"] = (f"Calibrated from {s['n']} results (p={s['p']}): " + ", ".join(note))[:500]
            exams.save_item(con, it, by)
            changed += 1
    return changed
