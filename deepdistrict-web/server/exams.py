"""DeepDistrict exam module — SAT Reading & Writing, IELTS Academic Reading and IELTS Academic Writing.

Item bank (exam_items, with every saved version in exam_item_versions):
  * sat      one short passage (25–150 words; cross-text up to 300) + one 4-option question, a content
             domain / skill / difficulty, an explanation, and an optional "pretest" (unscored) flag
  * ielts-r  one reading passage (paragraphs) with 1–4 question groups of the official task types
  * ielts-w  one Writing task (Task 1 visual: image or data table; Task 2 essay prompt)
  Status: draft → review → approved → retired. Only approved items reach students, and approving
  needs the "original content, not copied from official tests" confirmation.

Attempts (exam_attempts) are built and marked on the server; answer keys never reach the browser
before the attempt is finished. Each attempt keeps a snapshot of the items it used.

Rules followed (checked against College Board and IELTS published formats, 2026):
  * SAT R&W mock: 2 modules × 27 questions × 32 minutes. Module 1 is a broad mix; module 2 is harder
    or easier depending on module 1 (multistage adaptive). Inside a module questions run in domain order
    (Craft & Structure → Information & Ideas → Standard English Conventions → Expression of Ideas) and
    from easier to harder within each skill group. Answers can be changed only inside the current module;
    time is kept by the server; no penalty for wrong answers. Up to 2 pretest items per module are unscored.
  * IELTS Academic Reading mock: 3 passages, 40 questions, 60 minutes, no extra transfer time,
    passages totalling about 2,150–2,750 words. Spelling counts; answers over the word limit are wrong.
  * IELTS Academic Writing mock: Task 1 (≥150 words) + Task 2 (≥250 words) in 60 minutes; four criteria
    (Task Achievement/Response, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy);
    Task 2 counts twice as much as Task 1. AI may suggest bands; a teacher confirms them.
All scores are DeepDistrict practice estimates, not official scores.
"""

import json
import math
import random
import re
import secrets
from datetime import datetime, timezone

KINDS = ("sat", "ielts-r", "ielts-w")
STATUSES = ("draft", "review", "approved", "retired")
GRACE = 20                      # seconds of network grace after a section's time is up

SAT_DOMAINS = {
    "cs": {"en": "Craft and Structure", "th": "การใช้ภาษาและโครงสร้าง", "skills": ["words-in-context", "text-structure", "cross-text"], "per": 7},
    "ii": {"en": "Information and Ideas", "th": "ข้อมูลและความคิด", "skills": ["central-ideas", "evidence-textual", "evidence-quantitative", "inferences"], "per": 7},
    "sec": {"en": "Standard English Conventions", "th": "หลักไวยากรณ์มาตรฐาน", "skills": ["boundaries", "form-structure-sense"], "per": 7},
    "eoi": {"en": "Expression of Ideas", "th": "การสื่อความคิด", "skills": ["transitions", "rhetorical-synthesis"], "per": 6},
}
SAT_ORDER = ["cs", "ii", "sec", "eoi"]
SAT_SKILL_GROUP = {"boundaries": "sec", "form-structure-sense": "sec"}   # mixed together in the real test
SAT_MODULE_Q, SAT_MODULE_S = 27, 32 * 60
DIFF = ("e", "m", "h")
WEIGHT = {"e": 1.0, "m": 1.5, "h": 2.0}

IELTS_TYPES = {
    "tfng": "True / False / Not Given", "ynng": "Yes / No / Not Given", "mcq": "Multiple choice",
    "headings": "Matching headings", "matching-info": "Matching information (which paragraph)",
    "matching-features": "Matching features", "sentence-endings": "Matching sentence endings",
    "sentence-completion": "Sentence completion", "summary-completion": "Summary / note / table / flow-chart completion",
    "diagram-label": "Diagram label completion", "short-answer": "Short-answer questions",
}
CHOICE_TYPES = {"tfng", "ynng", "mcq", "headings", "matching-info", "matching-features", "sentence-endings"}
TEXT_TYPES = {"sentence-completion", "summary-completion", "diagram-label", "short-answer"}
FIXED = {"tfng": ["TRUE", "FALSE", "NOT GIVEN"], "ynng": ["YES", "NO", "NOT GIVEN"]}
IELTS_R_SECONDS, IELTS_W_SECONDS = 60 * 60, 60 * 60
CRITERIA = {"ta": "Task Achievement / Response", "cc": "Coherence and Cohesion", "lr": "Lexical Resource", "gra": "Grammatical Range and Accuracy"}
READING_BANDS = [(39, 9), (37, 8.5), (35, 8), (33, 7.5), (30, 7), (27, 6.5), (23, 6), (19, 5.5), (15, 5), (13, 4.5), (10, 4), (8, 3.5), (6, 3), (4, 2.5), (2, 2), (1, 1)]

DEFAULT_SETTINGS = {"routeAt": 0.6, "easyCap": 640, "practiceReview": True, "mockReview": True, "writingAiInstant": True, "studentsCanStart": True}


def init(con):
    con.executescript("""
    CREATE TABLE IF NOT EXISTS exam_items (id TEXT PRIMARY KEY, kind TEXT NOT NULL, status TEXT NOT NULL, updated_at TEXT NOT NULL, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS exam_item_versions (id TEXT NOT NULL, version INTEGER NOT NULL, at TEXT NOT NULL, by TEXT, data TEXT NOT NULL, PRIMARY KEY (id, version));
    CREATE TABLE IF NOT EXISTS exam_attempts (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, kind TEXT NOT NULL, mode TEXT NOT NULL, status TEXT NOT NULL,
                                              started_at TEXT NOT NULL, finished_at TEXT, data TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS exam_att_user ON exam_attempts (user_id, started_at);
    """)


def now():
    return datetime.now(timezone.utc)


def iso(t=None):
    return (t or now()).isoformat(timespec="seconds")


def ts(s):
    return datetime.fromisoformat(s).timestamp() if s else 0


def settings(con):
    r = con.execute("SELECT value FROM kv WHERE key='exams'").fetchone()
    cfg = dict(DEFAULT_SETTINGS)
    if r:
        cfg.update({k: v for k, v in json.loads(r["value"]).items() if k in DEFAULT_SETTINGS})
    return cfg


def save_settings(con, body):
    cfg = settings(con)
    if "routeAt" in body:
        cfg["routeAt"] = max(0.3, min(0.9, float(body["routeAt"])))
    if "easyCap" in body:
        cfg["easyCap"] = max(400, min(800, int(round(float(body["easyCap"]) / 10) * 10)))
    for k in ("practiceReview", "mockReview", "writingAiInstant", "studentsCanStart"):
        if k in body:
            cfg[k] = bool(body[k])
    con.execute("INSERT INTO kv (key, value) VALUES ('exams', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", (json.dumps(cfg),))
    return cfg


# ---------------------------------------------------------------- helpers
def words(text):
    return len(re.findall(r"[A-Za-z0-9]+(?:['’\-][A-Za-z0-9]+)*", text or ""))


def norm(s):
    s = str(s or "").replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"')
    s = re.sub(r"\s+", " ", s.strip().lower())
    return s.strip(" .,;:!?")


def _s(v, n):
    return str(v or "").strip()[:n]


def _bi(v, n):
    if isinstance(v, str):
        v = {"en": v}
    v = v if isinstance(v, dict) else {}
    return {"en": _s(v.get("en"), n), "th": _s(v.get("th"), n)}


def _opts(v, n=12):
    out = []
    for i, o in enumerate(v if isinstance(v, list) else []):
        if isinstance(o, str):
            o = {"key": "", "text": o}
        key = _s(o.get("key"), 6) or chr(65 + i)
        text = _s(o.get("text"), 300)
        if text:
            out.append({"key": key, "text": text})
    return out[:n]


# ---------------------------------------------------------------- item validation
def clean_item(raw, old=None):
    """Validate an item from the back office. Returns (item, problems) — problems block approval only."""
    if not isinstance(raw, dict) or raw.get("kind") not in KINDS:
        raise ValueError("unknown item type")
    kind = raw["kind"]
    iid = old["id"] if old else (raw.get("id") if re.fullmatch(r"x[a-z0-9]{8,20}", str(raw.get("id") or "")) else "x" + secrets.token_hex(6))
    it = {"id": iid, "kind": kind, "status": raw.get("status") if raw.get("status") in STATUSES else "draft",
          "origin": raw.get("origin") if raw.get("origin") in ("original", "ai", "public-domain") else "original",
          "rightsOk": bool(raw.get("rightsOk")), "tags": [_s(t, 30) for t in (raw.get("tags") or []) if _s(t, 30)][:8],
          "note": _s(raw.get("note"), 500), "version": (old or {}).get("version", 0)}
    probs = []
    if kind == "sat":
        dom = raw.get("domain") if raw.get("domain") in SAT_DOMAINS else "cs"
        skill = raw.get("skill") if raw.get("skill") in SAT_DOMAINS[dom]["skills"] else SAT_DOMAINS[dom]["skills"][0]
        choices = [_s(c, 400) for c in (raw.get("choices") or [])][:4]
        table = raw.get("table") if isinstance(raw.get("table"), dict) else None
        if table:
            rows = [[_s(c, 60) for c in r][:8] for r in (table.get("rows") or []) if isinstance(r, list)][:12]
            table = {"title": _s(table.get("title"), 160), "rows": rows} if rows else None
        it.update({"domain": dom, "skill": skill, "difficulty": raw.get("difficulty") if raw.get("difficulty") in DIFF else "m",
                   "passage": _s(raw.get("passage"), 3000), "table": table, "stem": _s(raw.get("stem"), 600), "choices": choices,
                   "answer": int(raw.get("answer")) if str(raw.get("answer", "")).lstrip("-").isdigit() else -1,
                   "explanation": _bi(raw.get("explanation"), 1500), "pretest": bool(raw.get("pretest"))})
        w, limit = words(it["passage"]), (300 if skill == "cross-text" else 150)
        if not (25 <= w <= limit):
            probs.append(f"passage must be 25–{limit} words (now {w})")
        if skill == "evidence-quantitative" and not table:
            probs.append("quantitative evidence questions need a data table")
        if not it["stem"]:
            probs.append("question missing")
        if len(choices) != 4 or any(not c for c in choices) or len({c.strip() for c in choices}) != 4:
            probs.append("exactly 4 different answer choices are needed")
        if not 0 <= it["answer"] <= 3:
            probs.append("mark the correct choice")
        if not (it["explanation"]["en"] or it["explanation"]["th"]):
            probs.append("explanation missing")
    elif kind == "ielts-r":
        paras = [_s(p, 4000) for p in (raw.get("paragraphs") or []) if _s(p, 4000)][:12]
        groups, total_q = [], 0
        for g in (raw.get("groups") or [])[:4]:
            t = g.get("type") if g.get("type") in IELTS_TYPES else None
            if not t:
                probs.append("unknown question type"); continue
            wl = g.get("wordLimit") if isinstance(g.get("wordLimit"), dict) else {}
            grp = {"type": t, "instructions": _s(g.get("instructions"), 600),
                   "options": [{"key": k, "text": k} for k in FIXED[t]] if t in FIXED else _opts(g.get("options"), 16),
                   "wordLimit": {"words": max(1, min(5, int(wl.get("words") or 2))), "number": bool(wl.get("number"))} if t in TEXT_TYPES else None,
                   "image": _s(g.get("image"), 1_600_000) if t == "diagram-label" else "", "questions": []}
            for q in (g.get("questions") or [])[:20]:
                ans = q.get("answer")
                ans = [_s(a, 80) for a in (ans if isinstance(ans, list) else [ans]) if _s(a, 80)][:6]
                qq = {"text": _s(q.get("text"), 600), "answer": ans}
                if t == "mcq":
                    qq["options"] = _opts(q.get("options"), 6)
                grp["questions"].append(qq)
            total_q += len(grp["questions"])
            groups.append(grp)
        it.update({"title": _s(raw.get("title"), 160), "paragraphs": paras, "labelled": bool(raw.get("labelled", True)),
                   "difficulty": max(1, min(3, int(raw.get("difficulty") or 2))), "groups": groups})
        w = sum(words(p) for p in paras)
        it["words"] = w
        if not it["title"]:
            probs.append("passage title missing")
        if not (550 <= w <= 1150):
            probs.append(f"an IELTS passage is usually 700–1,000 words (now {w}; allowed 550–1,150)")
        if not (8 <= total_q <= 16):
            probs.append(f"a passage carries about 13 questions (now {total_q}; allowed 8–16)")
        for g in groups:
            keys = {norm(o["key"]) for o in g["options"]}
            for i, q in enumerate(g["questions"], 1):
                if not q["answer"]:
                    probs.append(f"{g['type']} question {i}: answer missing")
                if g["type"] in CHOICE_TYPES and g["type"] != "mcq" and not g["options"]:
                    probs.append(f"{g['type']}: options missing")
                if g["type"] == "mcq":
                    k2 = {norm(o["key"]) for o in q.get("options", [])}
                    if len(q.get("options", [])) < 3 or any(norm(a) not in k2 for a in q["answer"]):
                        probs.append(f"multiple choice question {i}: needs 3+ options and a valid answer letter")
                elif g["type"] in CHOICE_TYPES and any(norm(a) not in keys for a in q["answer"]):
                    probs.append(f"{g['type']} question {i}: the answer must be one of the options")
                if g["type"] in TEXT_TYPES:
                    for a in q["answer"]:
                        if not within_limit(a, g["wordLimit"]):
                            probs.append(f"{g['type']} question {i}: answer '{a}' is over the word limit")
                if not q["text"] and g["type"] not in ("diagram-label",):
                    probs.append(f"{g['type']} question {i}: text missing")
            if g["type"] == "headings" and len(g["options"]) <= len(g["questions"]):
                probs.append("matching headings needs more headings than paragraphs to match")
            if g["type"] == "diagram-label" and not g["image"]:
                probs.append("diagram labelling needs a diagram image")
    else:
        task = 1 if int(raw.get("task") or 2) == 1 else 2
        table = raw.get("table") if isinstance(raw.get("table"), dict) else None
        if table:
            rows = [[_s(c, 60) for c in r][:8] for r in (table.get("rows") or []) if isinstance(r, list)][:14]
            table = {"title": _s(table.get("title"), 200), "rows": rows} if rows else None
        it.update({"task": task, "prompt": _s(raw.get("prompt"), 2000), "image": _s(raw.get("image"), 1_600_000) if task == 1 else "",
                   "table": table if task == 1 else None, "visual": _s(raw.get("visual"), 30), "essayType": _s(raw.get("essayType"), 40),
                   "minWords": 150 if task == 1 else 250})
        if not it["prompt"]:
            probs.append("task prompt missing")
        if task == 1 and not (it["image"] or it["table"]):
            probs.append("Task 1 needs a chart image or a data table")
        if it["image"] and not re.match(r"^(data:image/(png|jpeg|webp);base64,|https://)", it["image"]):
            raise ValueError("image must be a PNG/JPEG/WebP upload or https:// address")
    if kind == "ielts-r":
        for g in it["groups"]:
            if g.get("image") and not re.match(r"^(data:image/(png|jpeg|webp);base64,|https://)", g["image"]):
                raise ValueError("diagram must be a PNG/JPEG/WebP upload or https:// address")
    if not it["rightsOk"]:
        probs.append("confirm the content is original (not copied from official or published tests)")
    if it["status"] == "approved" and probs:
        it["status"] = "review"
    return it, probs


def within_limit(ans, wl):
    if not wl:
        return True
    toks = str(ans or "").split()
    nums = [t for t in toks if re.fullmatch(r"[\d.,:/%\-]+", t)]
    other = len(toks) - len(nums)
    if wl.get("number"):
        return other <= wl["words"] and len(nums) <= 1
    return len(toks) <= wl["words"]


def save_item(con, it, by):
    it["version"] = int(it.get("version") or 0) + 1
    it["updatedAt"], it["updatedBy"] = iso(), by
    data = json.dumps(it, ensure_ascii=False)
    con.execute("INSERT INTO exam_items (id, kind, status, updated_at, data) VALUES (?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET "
                "kind=excluded.kind, status=excluded.status, updated_at=excluded.updated_at, data=excluded.data", (it["id"], it["kind"], it["status"], it["updatedAt"], data))
    con.execute("INSERT OR REPLACE INTO exam_item_versions (id, version, at, by, data) VALUES (?,?,?,?,?)", (it["id"], it["version"], it["updatedAt"], by, data))
    return it


def get_item(con, iid):
    r = con.execute("SELECT data FROM exam_items WHERE id=?", (iid,)).fetchone()
    return json.loads(r["data"]) if r else None


def items(con, kind=None, status=None):
    q, a = "SELECT data FROM exam_items WHERE 1=1", []
    if kind:
        q += " AND kind=?"; a.append(kind)
    if status:
        q += " AND status=?"; a.append(status)
    return [json.loads(r["data"]) for r in con.execute(q + " ORDER BY updated_at DESC", a)]


# ---------------------------------------------------------------- readiness of the bank
def readiness(con):
    sat = items(con, "sat", "approved")
    op = [i for i in sat if not i.get("pretest")]
    by = {d: {x: 0 for x in DIFF} for d in SAT_DOMAINS}
    for i in op:
        by[i["domain"]][i["difficulty"]] += 1
    need = {d: SAT_DOMAINS[d]["per"] * 2 for d in SAT_DOMAINS}
    sat_ok = all(sum(by[d].values()) >= need[d] for d in SAT_DOMAINS)
    sets = items(con, "ielts-r", "approved")
    tasks = items(con, "ielts-w", "approved")
    return {"sat": {"approved": len(op), "pretest": len(sat) - len(op), "byDomain": by, "need": need, "minimum": sum(need.values()),
                    "recommended": 81 * 3, "mock": sat_ok},
            "ielts-r": {"sets": len(sets), "questions": sum(sum(len(g["questions"]) for g in s["groups"]) for s in sets), "mock": bool(_pick_reading(sets, random.Random(1)))},
            "ielts-w": {"task1": sum(1 for t in tasks if t["task"] == 1), "task2": sum(1 for t in tasks if t["task"] == 2),
                        "mock": any(t["task"] == 1 for t in tasks) and any(t["task"] == 2 for t in tasks)}}


# ---------------------------------------------------------------- building tests
def _sat_order(lst):
    def key(i):
        grp = SAT_SKILL_GROUP.get(i["skill"], i["skill"])
        skills = [SAT_SKILL_GROUP.get(s, s) for s in SAT_DOMAINS[i["domain"]]["skills"]]
        return (SAT_ORDER.index(i["domain"]), skills.index(grp), DIFF.index(i["difficulty"]))
    return sorted(lst, key=key)


def _draw_sat(pool, rng, plan, used, seen, pretest_pool=None):
    """plan: {domain: [difficulty, …]} → list of items. Prefers items this student has not seen."""
    out = []
    for d in SAT_ORDER:
        avail = [i for i in pool if i["domain"] == d and i["id"] not in used]
        for want in plan.get(d, []):
            order = {"e": "emh", "m": "meh", "h": "hme"}[want]
            pick = None
            for diff in order:
                cand = [i for i in avail if i["difficulty"] == diff]
                fresh = [i for i in cand if i["id"] not in seen]
                if fresh or cand:
                    pick = rng.choice(fresh or cand)
                    break
            if not pick:
                raise ValueError(f"not enough approved SAT items in {SAT_DOMAINS[d]['en']}")
            used.add(pick["id"]); avail.remove(pick); out.append(pick)
    if pretest_pool:                                   # up to 2 unscored items replace operational slots of the same domain
        for p in rng.sample(pretest_pool, min(2, len(pretest_pool))):
            same = [i for i in out if i["domain"] == p["domain"] and not i.get("pretest")]
            if same and p["id"] not in used:
                victim = rng.choice(same)
                out[out.index(victim)] = p; used.discard(victim["id"]); used.add(p["id"])
    return _sat_order(out)


def _plan(mix):
    plan = {}
    for d in SAT_ORDER:
        n = SAT_DOMAINS[d]["per"]
        k = [mix[0] * n, mix[1] * n, mix[2] * n]
        base = [int(x) for x in k]
        while sum(base) < n:                           # largest remainder
            i = max(range(3), key=lambda j: k[j] - base[j]); base[i] += 1; k[i] = base[i]
        plan[d] = ["e"] * base[0] + ["m"] * base[1] + ["h"] * base[2]
    return plan


MIX = {"m1": (0.34, 0.33, 0.33), "hard": (0.1, 0.4, 0.5), "easy": (0.5, 0.4, 0.1)}


def _pick_reading(sets, rng, tries=3000):
    if len(sets) < 3:
        return None
    for _ in range(tries):
        trio = rng.sample(sets, 3)
        q = sum(sum(len(g["questions"]) for g in s["groups"]) for s in trio)
        w = sum(s.get("words") or 0 for s in trio)
        if q == 40 and 2150 <= w <= 2750:
            return sorted(trio, key=lambda s: s.get("difficulty", 2))
    return None


def seen_items(con, uid):
    out = set()
    for r in con.execute("SELECT data FROM exam_attempts WHERE user_id=?", (uid,)):
        out |= set(json.loads(r["data"]).get("snap", {}).keys())
    return out


def start(con, me, body, cfg):
    kind, mode = body.get("kind"), body.get("mode") if body.get("mode") in ("mock", "practice") else "practice"
    if kind not in KINDS:
        raise ValueError("choose SAT, IELTS Reading or IELTS Writing")
    rng = random.Random(secrets.randbits(64))
    seen = seen_items(con, me["id"])
    snap, sections = {}, []
    t0 = now()
    if kind == "sat":
        pool = items(con, "sat", "approved")
        op, pre = [i for i in pool if not i.get("pretest")], [i for i in pool if i.get("pretest")]
        if mode == "mock":
            m1 = _draw_sat(op, rng, _plan(MIX["m1"]), set(), seen, pre)
            sections.append(_section("m1", "Reading and Writing · Module 1", SAT_MODULE_S, [i["id"] for i in m1], t0))
            snap.update({i["id"]: i for i in m1})
        else:
            doms = [d for d in (body.get("domains") or SAT_ORDER) if d in SAT_DOMAINS] or SAT_ORDER
            n = max(5, min(27, int(body.get("count") or 10)))
            want = body.get("difficulty") if body.get("difficulty") in DIFF else None
            cand = [i for i in op if i["domain"] in doms and (not want or i["difficulty"] == want)]
            if len(cand) < n:
                raise ValueError(f"only {len(cand)} approved questions match — choose fewer or more topics")
            fresh = [i for i in cand if i["id"] not in seen]
            chosen = rng.sample(fresh, n) if len(fresh) >= n else fresh + rng.sample([i for i in cand if i["id"] in seen], n - len(fresh))
            chosen = _sat_order(chosen)
            sections.append(_section("p", "SAT Reading and Writing · Practice", round(n * SAT_MODULE_S / SAT_MODULE_Q), [i["id"] for i in chosen], t0))
            snap.update({i["id"]: i for i in chosen})
    elif kind == "ielts-r":
        sets = items(con, "ielts-r", "approved")
        if mode == "mock":
            trio = _pick_reading(sets, rng)
            if not trio:
                raise ValueError("the bank needs approved passages that make exactly 40 questions and 2,150–2,750 words in total")
            sections.append(_section("r", "IELTS Academic Reading", IELTS_R_SECONDS, [s["id"] for s in trio], t0))
            snap.update({s["id"]: s for s in trio})
        else:
            pick = next((s for s in sets if s["id"] == body.get("item")), None) or (rng.choice([s for s in sets if s["id"] not in seen] or sets) if sets else None)
            if not pick:
                raise ValueError("no approved reading passages yet")
            sections.append(_section("r", "IELTS Academic Reading · Practice passage", 20 * 60, [pick["id"]], t0))
            snap[pick["id"]] = pick
    else:
        tasks = items(con, "ielts-w", "approved")
        t1, t2 = [t for t in tasks if t["task"] == 1], [t for t in tasks if t["task"] == 2]
        if mode == "mock":
            if not t1 or not t2:
                raise ValueError("the bank needs at least one approved Task 1 and one Task 2")
            a = rng.choice([t for t in t1 if t["id"] not in seen] or t1); b = rng.choice([t for t in t2 if t["id"] not in seen] or t2)
            sections.append(_section("w", "IELTS Academic Writing", IELTS_W_SECONDS, [a["id"], b["id"]], t0))
            snap.update({a["id"]: a, b["id"]: b})
        else:
            task = 1 if int(body.get("task") or 2) == 1 else 2
            pool = t1 if task == 1 else t2
            pick = next((t for t in pool if t["id"] == body.get("item")), None) or (rng.choice([t for t in pool if t["id"] not in seen] or pool) if pool else None)
            if not pick:
                raise ValueError(f"no approved Writing Task {task} yet")
            sections.append(_section("w", f"IELTS Academic Writing · Task {task} practice", (20 if task == 1 else 40) * 60, [pick["id"]], t0))
            snap[pick["id"]] = pick
    att = {"id": "t" + secrets.token_hex(8), "userId": me["id"], "kind": kind, "mode": mode, "status": "active", "preview": me["role"] in ("admin", "teacher"),
           "sections": sections, "current": 0, "route": None, "snap": snap, "createdAt": iso(t0)}
    put_attempt(con, att)
    return att


def _section(key, title, seconds, ids, t0):
    return {"key": key, "title": title, "seconds": int(seconds), "items": ids, "startedAt": iso(t0),
            "deadline": iso(datetime.fromtimestamp(t0.timestamp() + seconds, timezone.utc)), "answers": {}, "marked": {}, "struck": {}, "submittedAt": None}


def put_attempt(con, a):
    con.execute("INSERT INTO exam_attempts (id, user_id, kind, mode, status, started_at, finished_at, data) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET "
                "status=excluded.status, finished_at=excluded.finished_at, data=excluded.data",
                (a["id"], a["userId"], a["kind"], a["mode"], a["status"], a["createdAt"], a.get("finishedAt"), json.dumps(a, ensure_ascii=False)))


def get_attempt(con, aid):
    r = con.execute("SELECT data FROM exam_attempts WHERE id=?", (str(aid)[:40],)).fetchone()
    return json.loads(r["data"]) if r else None


# ---------------------------------------------------------------- taking a test
def tick(con, a, cfg):
    """Close the current section if its time is up (server clock). Returns True if something changed."""
    if a["status"] != "active":
        return False
    sec = a["sections"][a["current"]]
    if now().timestamp() > ts(sec["deadline"]) + GRACE:
        submit_section(con, a, cfg, timed_out=True)
        return True
    return False


def save_answers(con, a, body, cfg):
    if a["status"] != "active":
        raise ValueError("this test is finished")
    if tick(con, a, cfg):
        raise ValueError("time is up for this part")
    sec = a["sections"][a["current"]]
    if body.get("section") is not None and body.get("section") != a["current"]:
        raise ValueError("that part is closed — answers can only change in the current part")
    keys = set(question_keys(a, sec))
    for k, v in (body.get("answers") or {}).items():
        if k in keys:
            sec["answers"][k] = str(v)[:6000] if a["kind"] == "ielts-w" else str(v)[:120]
    for name in ("marked", "struck"):
        for k, v in (body.get(name) or {}).items():
            if k in keys:
                if name == "struck":
                    sec[name][k] = [str(x)[:4] for x in (v or [])][:6]
                elif v:
                    sec[name][k] = True
                else:
                    sec[name].pop(k, None)
    put_attempt(con, a)


def question_keys(a, sec):
    if a["kind"] == "ielts-r":
        out = []
        for sid in sec["items"]:
            s = a["snap"][sid]
            for gi, g in enumerate(s["groups"]):
                out += [f"{sid}:{gi}:{qi}" for qi in range(len(g["questions"]))]
        return out
    return list(sec["items"])


def submit_section(con, a, cfg, timed_out=False):
    sec = a["sections"][a["current"]]
    sec["submittedAt"], sec["timedOut"] = iso(), bool(timed_out)
    if a["kind"] == "sat" and a["mode"] == "mock" and sec["key"] == "m1":
        sc = [i for i in sec["items"] if not a["snap"][i].get("pretest")]
        right = sum(1 for i in sc if sec["answers"].get(i) == str(a["snap"][i]["answer"]))
        a["route"] = "hard" if sc and right / len(sc) >= cfg["routeAt"] else "easy"
        pool = [i for i in items(con, "sat", "approved") if i["id"] not in a["snap"]]
        op, pre = [i for i in pool if not i.get("pretest")], [i for i in pool if i.get("pretest")]
        rng = random.Random(secrets.randbits(64))
        try:
            m2 = _draw_sat(op, rng, _plan(MIX[a["route"]]), set(a["snap"]), seen_items(con, a["userId"]), pre)
        except ValueError:
            m2 = None
        if m2:
            t0 = now()
            a["sections"].append(_section("m2", "Reading and Writing · Module 2", SAT_MODULE_S, [i["id"] for i in m2], t0))
            a["snap"].update({i["id"]: i for i in m2})
            a["current"] = 1
            put_attempt(con, a)
            return a
    finish(con, a, cfg)
    return a


def finish(con, a, cfg):
    a["status"] = "submitted" if a["kind"] == "ielts-w" else "finished"
    a["finishedAt"] = iso()
    a["result"] = score(a, cfg)
    put_attempt(con, a)


def check_text(ans, accepted, wl):
    if not within_limit(ans, wl):
        return False
    return norm(ans) in {norm(x) for x in accepted}


def score(a, cfg):
    if a["kind"] == "sat":
        dom = {d: {"c": 0, "t": 0} for d in SAT_DOMAINS}
        mods, got, maxw = [], 0.0, 0.0
        for sec in a["sections"]:
            c = t = 0
            for iid in sec["items"]:
                it = a["snap"][iid]
                if it.get("pretest"):
                    continue
                ok = sec["answers"].get(iid) == str(it["answer"])
                c += ok; t += 1
                dom[it["domain"]]["c"] += ok; dom[it["domain"]]["t"] += 1
                maxw += WEIGHT[it["difficulty"]]; got += WEIGHT[it["difficulty"]] * ok
            mods.append({"key": sec["key"], "correct": c, "total": t})
        res = {"modules": mods, "byDomain": dom, "correct": sum(m["correct"] for m in mods), "total": sum(m["total"] for m in mods), "route": a.get("route")}
        if a["mode"] == "mock" and maxw:
            frac = got / maxw
            if a.get("route") == "hard":
                est = 300 + 500 * frac
            else:
                est = 200 + (cfg["easyCap"] - 200) * frac
            res["estimate"] = int(max(200, min(800, round(est / 10) * 10)))
            res["ceiling"] = cfg["easyCap"] if a.get("route") == "easy" else 800
        return res
    if a["kind"] == "ielts-r":
        sec, c, t, per = a["sections"][0], 0, 0, []
        for sid in sec["items"]:
            s, sc = a["snap"][sid], 0
            for gi, g in enumerate(s["groups"]):
                for qi, q in enumerate(g["questions"]):
                    ans = sec["answers"].get(f"{sid}:{gi}:{qi}", "")
                    ok = check_text(ans, q["answer"], g["wordLimit"]) if g["type"] in TEXT_TYPES else norm(ans) in {norm(x) for x in q["answer"]}
                    c += ok; t += 1; sc += ok
            per.append({"id": sid, "title": s["title"], "correct": sc})
        res = {"correct": c, "total": t, "passages": per}
        raw = c if t == 40 else round(c * 40 / t) if t else 0
        res["band"] = next((b for lim, b in READING_BANDS if raw >= lim), 0)
        res["scaled"] = t != 40
        return res
    sec = a["sections"][0]
    return {"words": {iid: words(sec["answers"].get(iid, "")) for iid in sec["items"]}, "ai": {}, "teacher": None}


def task_band(cr):
    vals = [float(cr[k]) for k in CRITERIA if cr.get(k) is not None]
    if len(vals) != 4:
        return None
    return math.floor(sum(vals) / 4 * 2) / 2            # rounded down to the nearest half band


def round_band(x):
    whole = math.floor(x)
    f = x - whole
    return whole + (0 if f < 0.25 else 0.5 if f < 0.75 else 1)


def writing_band(a, bands):
    """bands: {itemId: task band}. Task 2 counts twice as much as Task 1."""
    total = weight = 0
    for iid in a["sections"][0]["items"]:
        b = bands.get(iid)
        if b is None:
            return None
        w = 2 if a["snap"][iid]["task"] == 2 else 1
        total += b * w; weight += w
    return round_band(total / weight) if weight else None


# ---------------------------------------------------------------- what the student sees
def view(a, cfg, staff=False):
    """The attempt as the browser may see it. Keys/explanations only after the end (if allowed)."""
    done = a["status"] != "active"
    review = done and (staff or (cfg["practiceReview"] if a["mode"] == "practice" else cfg["mockReview"]))
    secs = []
    for idx, sec in enumerate(a["sections"]):
        open_ = idx == a["current"] and not done
        s = {k: sec[k] for k in ("key", "title", "seconds", "startedAt", "deadline", "submittedAt")}
        if open_ or review:
            s["answers"], s["marked"], s["struck"] = sec["answers"], sec["marked"], sec["struck"]
            s["items"] = [_public_item(a["snap"][i], review) for i in sec["items"]]
            if a["kind"] == "ielts-r":
                n = 1
                for it in s["items"]:
                    for g in it["groups"]:
                        g["from"] = n; n += len(g["questions"]); g["to"] = n - 1
        else:
            s["count"] = len(sec["items"])
        secs.append(s)
    out = {k: a.get(k) for k in ("id", "kind", "mode", "status", "current", "createdAt", "finishedAt", "preview")}
    out["sections"], out["serverNow"], out["review"] = secs, iso(), review
    out["staff"] = bool(staff)
    if done:
        out["result"] = dict(a.get("result") or {})
        if a["kind"] == "ielts-w":
            out["result"] = writing_view(a, cfg, staff)
    return out


def writing_view(a, cfg, staff):
    res = a.get("result") or {}
    teacher = res.get("teacher")
    show_ai = staff or (a["mode"] == "practice" and cfg["writingAiInstant"])
    return {"words": res.get("words", {}), "ai": res.get("ai", {}) if show_ai else {}, "aiPending": res.get("aiPending", False),
            "aiError": res.get("aiError") if staff else None, "teacher": teacher, "status": a["status"]}


def _public_item(it, review):
    if it["kind"] == "sat":
        out = {k: it.get(k) for k in ("id", "passage", "table", "stem", "choices")}
        if review:
            out.update({"answer": it["answer"], "explanation": it["explanation"], "domain": it["domain"], "skill": it["skill"], "difficulty": it["difficulty"], "pretest": it.get("pretest", False)})
        return out
    if it["kind"] == "ielts-r":
        groups = []
        for g in it["groups"]:
            gg = {k: g.get(k) for k in ("type", "instructions", "options", "wordLimit", "image")}
            gg["questions"] = [{"text": q["text"], "options": q.get("options"), **({"answer": q["answer"]} if review else {})} for q in g["questions"]]
            groups.append(gg)
        return {"id": it["id"], "title": it["title"], "paragraphs": it["paragraphs"], "labelled": it.get("labelled", True), "groups": groups}
    return {k: it.get(k) for k in ("id", "task", "prompt", "image", "table", "minWords")}


# ---------------------------------------------------------------- AI prompts & schemas
SAT_SCHEMA = {"type": "object", "properties": {"items": {"type": "array", "items": {"type": "object", "properties": {
    "skill": {"type": "string"}, "difficulty": {"type": "string", "enum": ["e", "m", "h"]}, "passage": {"type": "string"},
    "table_title": {"type": "string"}, "table_rows": {"type": "array", "items": {"type": "array", "items": {"type": "string"}}},
    "stem": {"type": "string"}, "choices": {"type": "array", "items": {"type": "string"}}, "answer": {"type": "integer"},
    "explanation_en": {"type": "string"}, "explanation_th": {"type": "string"}},
    "required": ["skill", "difficulty", "passage", "table_title", "table_rows", "stem", "choices", "answer", "explanation_en", "explanation_th"], "additionalProperties": False}}},
    "required": ["items"], "additionalProperties": False}

READ_SCHEMA = {"type": "object", "properties": {
    "title": {"type": "string"}, "paragraphs": {"type": "array", "items": {"type": "string"}},
    "groups": {"type": "array", "items": {"type": "object", "properties": {
        "type": {"type": "string", "enum": sorted(IELTS_TYPES)}, "instructions": {"type": "string"},
        "options": {"type": "array", "items": {"type": "object", "properties": {"key": {"type": "string"}, "text": {"type": "string"}}, "required": ["key", "text"], "additionalProperties": False}},
        "max_words": {"type": "integer"}, "allow_number": {"type": "boolean"},
        "questions": {"type": "array", "items": {"type": "object", "properties": {
            "text": {"type": "string"}, "answers": {"type": "array", "items": {"type": "string"}},
            "options": {"type": "array", "items": {"type": "object", "properties": {"key": {"type": "string"}, "text": {"type": "string"}}, "required": ["key", "text"], "additionalProperties": False}}},
            "required": ["text", "answers", "options"], "additionalProperties": False}}},
        "required": ["type", "instructions", "options", "max_words", "allow_number", "questions"], "additionalProperties": False}}},
    "required": ["title", "paragraphs", "groups"], "additionalProperties": False}

WTASK_SCHEMA = {"type": "object", "properties": {
    "prompt": {"type": "string"}, "essay_type": {"type": "string"}, "visual": {"type": "string"},
    "table_title": {"type": "string"}, "table_rows": {"type": "array", "items": {"type": "array", "items": {"type": "string"}}}},
    "required": ["prompt", "essay_type", "visual", "table_title", "table_rows"], "additionalProperties": False}

FEEDBACK_SCHEMA = {"type": "object", "properties": {
    "criteria": {"type": "object", "properties": {k: {"type": "object", "properties": {"band": {"type": "integer"}, "comment": {"type": "string"}},
                                                      "required": ["band", "comment"], "additionalProperties": False} for k in CRITERIA},
                 "required": list(CRITERIA), "additionalProperties": False},
    "strengths": {"type": "array", "items": {"type": "string"}}, "improvements": {"type": "array", "items": {"type": "string"}},
    "corrections": {"type": "array", "items": {"type": "object", "properties": {"original": {"type": "string"}, "better": {"type": "string"}}, "required": ["original", "better"], "additionalProperties": False}},
    "summary_th": {"type": "string"}},
    "required": ["criteria", "strengths", "improvements", "corrections", "summary_th"], "additionalProperties": False}

ITEM_SYSTEM = ("You write ORIGINAL practice test material for DeepDistrict, a Bangkok tutoring centre. Never copy or closely paraphrase "
               "questions or passages from College Board, Bluebook, Khan Academy, Cambridge, British Council, IDP or any published book; invent "
               "your own texts and facts (keep facts plausible and non-controversial; no real living people). Follow the real test format exactly. "
               "Each wrong option must be clearly wrong for a stated reason; exactly one answer is correct.")


def sat_prompt(domain, skill, difficulty, count, topic):
    d = SAT_DOMAINS[domain]
    diff = {"e": "easy", "m": "medium", "h": "hard"}.get(difficulty, "a mix of easy, medium and hard")
    return (f"Write {count} digital SAT Reading and Writing questions.\nContent domain: {d['en']}. Skill: {skill or 'any skill of this domain: ' + ', '.join(d['skills'])}. "
            f"Difficulty: {diff}.\n" + (f"Passage topics around: {topic}.\n" if topic else "Vary topics: science, history, social science, literature, the arts.\n") +
            "Format rules: each question has ONE short passage of 25–150 words (cross-text: 'Text 1' and 'Text 2', up to 300 words in total), "
            "one question stem in the official SAT style, and exactly 4 answer choices; answer is the 0-based index of the correct choice. "
            "Standard English Conventions items mark the blank as ______ and choices are the ways to fill it. Rhetorical synthesis gives bulleted "
            "notes ('While researching a topic, a student has taken the following notes:'). Quantitative evidence questions include a small data table "
            "(table_title and table_rows, first row = headers); otherwise leave table_title empty and table_rows empty. "
            "skill must be one of: " + ", ".join(d["skills"]) + ". Explanations: why the answer is right and each other choice is wrong; "
            "explanation_en in English, explanation_th in Thai.")


def reading_prompt(topic, difficulty):
    return ("Write one ORIGINAL IELTS Academic Reading passage with its questions.\n"
            f"Topic: {topic or 'an academic topic of general interest (science, history, environment, technology or society)'}. "
            f"Level: {['', 'easier (like passage 1)', 'medium (like passage 2)', 'harder (like passage 3)'][max(1, min(3, int(difficulty or 2)))]}.\n"
            "Passage: 750–950 words, 6–8 paragraphs (they are labelled A, B, C… on screen), formal academic style.\n"
            "Questions: exactly 13 or 14 in total, in 2–3 groups of different official types. For tfng/ynng leave options empty and answer with "
            "TRUE/FALSE/NOT GIVEN (or YES/NO/NOT GIVEN). For headings, give options with roman numeral keys (i, ii, …) — more headings than paragraphs — "
            "and each question text names a paragraph ('Paragraph B'); the answer is the heading key. matching-info answers are paragraph letters. "
            "matching-features and sentence-endings give options with letter keys and answers as letters. mcq: each question has 4 options A–D. "
            "Completion and short-answer types: set max_words (1–3) and allow_number, write the instruction in the official style "
            "(e.g. 'Choose NO MORE THAN TWO WORDS from the passage for each answer.'), mark the gap in the question text as ______ and give every "
            "acceptable answer copied exactly from the passage. Questions in each group follow the order of the passage where the official test does.")


def wtask_prompt(task, topic):
    if task == 1:
        return ("Write one ORIGINAL IELTS Academic Writing Task 1 based on a data TABLE (we display the table). "
                f"Topic: {topic or 'any everyday or academic statistics'}. Use invented but realistic numbers; 4–7 rows, 3–5 columns, first row = headers. "
                "The prompt follows the official wording: 'The table below shows … Summarise the information by selecting and reporting the main features, "
                "and make comparisons where relevant. Write at least 150 words.' visual = 'table'.")
    return ("Write one ORIGINAL IELTS Academic Writing Task 2 essay question. "
            f"Topic: {topic or 'education, technology, environment, health, work or society'}. Use the official layout: a statement or two views, then the task "
            "(e.g. 'To what extent do you agree or disagree?' / 'Discuss both these views and give your own opinion.'), then 'Give reasons for your answer "
            "and include any relevant examples from your own knowledge or experience. Write at least 250 words.' essay_type is one of opinion, discussion, "
            "problem-solution, advantages-disadvantages, two-part. Leave table_title and table_rows empty.")


FEEDBACK_SYSTEM = ("You are an experienced IELTS Writing examiner trainer. Rate the response against the public IELTS Writing band descriptors "
                   "(Task 1 uses Task Achievement, Task 2 uses Task Response; plus Coherence and Cohesion, Lexical Resource, Grammatical Range and "
                   "Accuracy). Give each criterion a whole band 0–9. Be strict and realistic, as a trained examiner would be; responses under the "
                   "minimum word count lose marks in Task Achievement/Response; memorised or off-topic text scores low. Comments in clear, simple English "
                   "for a Thai teenager; summary_th is a short summary in Thai. At most 6 corrections, quoting the student's words exactly.")


def feedback_content(task, essay):
    text = (f"IELTS Academic Writing Task {task['task']}. Minimum {task['minWords']} words.\nTask:\n{task['prompt']}\n")
    if task.get("table"):
        text += "Data table:\n" + "\n".join(" | ".join(r) for r in task["table"]["rows"]) + "\n"
    text += f"\nCandidate response ({words(essay)} words):\n<<<\n{essay}\n>>>"
    blocks = []
    img = task.get("image") or ""
    m = re.match(r"^data:(image/(?:png|jpeg|webp));base64,(.+)$", img)
    if m:
        blocks.append({"type": "image", "source": {"type": "base64", "media_type": m.group(1), "data": m.group(2)}})
    blocks.append({"type": "text", "text": text})
    return blocks


def from_ai_sat(data, domain):
    out = []
    for x in (data or {}).get("items", [])[:10]:
        rows = x.get("table_rows") or []
        out.append({"kind": "sat", "domain": domain, "skill": x.get("skill"), "difficulty": x.get("difficulty"), "passage": x.get("passage"),
                    "table": {"title": x.get("table_title", ""), "rows": rows} if rows else None, "stem": x.get("stem"), "choices": x.get("choices"),
                    "answer": x.get("answer"), "explanation": {"en": x.get("explanation_en", ""), "th": x.get("explanation_th", "")}, "origin": "ai", "status": "draft"})
    return out


def from_ai_reading(data, difficulty):
    groups = []
    for g in (data or {}).get("groups", []):
        groups.append({"type": g.get("type"), "instructions": g.get("instructions"), "options": g.get("options"),
                       "wordLimit": {"words": g.get("max_words") or 2, "number": bool(g.get("allow_number"))},
                       "questions": [{"text": q.get("text"), "answer": q.get("answers"), "options": q.get("options")} for q in g.get("questions", [])]})
    return {"kind": "ielts-r", "title": data.get("title"), "paragraphs": data.get("paragraphs"), "difficulty": difficulty, "groups": groups, "origin": "ai", "status": "draft"}


def from_ai_wtask(data, task):
    rows = data.get("table_rows") or []
    return {"kind": "ielts-w", "task": task, "prompt": data.get("prompt"), "essayType": data.get("essay_type"), "visual": data.get("visual"),
            "table": {"title": data.get("table_title", ""), "rows": rows} if rows else None, "origin": "ai", "status": "draft"}
