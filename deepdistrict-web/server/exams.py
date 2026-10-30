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

KINDS = ("sat", "ielts-r", "ielts-w", "m1")
CHOICE_KINDS = ("sat", "m1")      # one passage/stem + four answer choices

# Thai M.1 (Grade 7) entrance practice — Suankularb Wittayalai special programmes. The schools publish the
# subjects, not the papers: GATE Program tests Mathematics, Science, English and Thai (Maths and Science carry
# most of the weight); English Program (EPLUS+) tests Mathematics, Science and English in English, plus an
# interview that is not part of this bank. Items here are DeepDistrict originals in a 4-choice format.
M1_PROGRAMS = {
    # School entrance papers. Since v5.9 the ready-made ones are English papers (M.1 and M.4): 60 questions
    # in six parts. Kind "m1" = a school-entrance item (four choices or a written answer).
    "gate": {"en": "Suankularb M.1 English (GATE and English Program)", "th": "ภาษาอังกฤษ สอบเข้า ม.1 สวนกุหลาบ (GATE และ EP)", "subjects": ["eng", "math", "sci", "thai"], "grade": 1},
    "satit": {"en": "Satit Prasarnmit M.1 English", "th": "ภาษาอังกฤษ สอบเข้า ม.1 สาธิตประสานมิตร", "subjects": ["eng", "math", "sci", "thai"], "grade": 1},
    "sk4": {"en": "Suankularb M.4 English (GATE and English Program)", "th": "ภาษาอังกฤษ สอบเข้า ม.4 สวนกุหลาบ (GATE และ EP)", "subjects": ["eng"], "grade": 4},
    "tu4": {"en": "Triam Udom Suksa M.4 English", "th": "ภาษาอังกฤษ สอบเข้า ม.4 เตรียมอุดมศึกษา", "subjects": ["eng"], "grade": 4},
    "top4": {"en": "Top schools M.4 English (general)", "th": "ภาษาอังกฤษ สอบเข้า ม.4 โรงเรียนดัง (ทั่วไป)", "subjects": ["eng"], "grade": 4},
    "ep": {"en": "Suankularb M.1 English Program (older items)", "th": "สวนกุหลาบ ม.1 English Program (ข้อเดิม)", "subjects": ["math", "sci", "eng"], "legacy": True, "grade": 1},
}
# The six parts of an English entrance paper (tutor summaries: conversation, vocabulary, grammar,
# error identification, cloze and reading); each school weights them differently.
M1_PARTS = {"conversation": {"en": "Conversation", "th": "บทสนทนา"}, "vocabulary": {"en": "Vocabulary", "th": "คำศัพท์"},
            "grammar": {"en": "Grammar and structure", "th": "ไวยากรณ์และโครงสร้าง"}, "error": {"en": "Error identification", "th": "หาจุดผิด"},
            "cloze": {"en": "Cloze test", "th": "เติมคำในบทความ (Cloze)"}, "reading": {"en": "Reading comprehension", "th": "การอ่านจับใจความ"}}
PART_ORDER = list(M1_PARTS)
# Practice targets shown with results (DeepDistrict guidance, not school cut-offs). GATE and EP applicants
# take the same paper; EP applicants need a higher score.
M1_TARGETS = {"gate": [{"key": "gate", "en": "GATE Program", "th": "GATE Program", "overall": 65, "subjects": {}},
                       {"key": "ep", "en": "English Program (EPLUS+)", "th": "English Program (EPLUS+)", "overall": 80, "subjects": {}}],
              "sk4": [{"key": "gate", "en": "GATE / regular", "th": "GATE / ห้องทั่วไป", "overall": 65, "subjects": {}},
                      {"key": "ep", "en": "English Program", "th": "English Program", "overall": 80, "subjects": {}}],
              "satit": [{"key": "satit", "en": "Satit Prasarnmit", "th": "สาธิตประสานมิตร", "overall": 70, "subjects": {}}],
              "tu4": [{"key": "tu4", "en": "Triam Udom Suksa", "th": "เตรียมอุดมศึกษา", "overall": 75, "subjects": {}}],
              "top4": [{"key": "top4", "en": "Top schools", "th": "โรงเรียนดัง", "overall": 70, "subjects": {}}]}
M1_FORMATS = ("mcq", "fill")       # four choices, or a short written answer (number / word) — อัตนัยแบบเติมคำตอบ
M1_SUBJECTS = {"math": {"en": "Mathematics", "th": "คณิตศาสตร์"}, "sci": {"en": "Science", "th": "วิทยาศาสตร์"},
               "eng": {"en": "English", "th": "ภาษาอังกฤษ"}, "thai": {"en": "Thai", "th": "ภาษาไทย"}}
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

# IELTS Academic Reading task types (as published by IELTS). Answers are not always "one of four":
#   choice from a fixed set (T/F/NG, Y/N/NG), one letter from 3–5 options (mcq), TWO or THREE letters
#   from a longer list (mcq-multi, one mark per correct letter), letters/numerals from a list that is
#   longer than the questions (headings, features, sentence endings, summary with a box of words),
#   paragraph letters (matching-info), or words copied from the passage within a word limit
#   (sentence / summary / note / table / flow-chart / diagram completion, short answers).
IELTS_TYPES = {
    "tfng": "True / False / Not Given", "ynng": "Yes / No / Not Given",
    "mcq": "Multiple choice — one answer (A–C/D/E)", "mcq-multi": "Multiple choice — choose TWO or THREE letters",
    "headings": "Matching headings", "matching-info": "Matching information (which paragraph)",
    "matching-features": "Matching features", "sentence-endings": "Matching sentence endings",
    "summary-box": "Summary completion — choose from a box of words",
    "sentence-completion": "Sentence completion", "summary-completion": "Summary completion — words from the passage",
    "note-completion": "Note completion", "table-completion": "Table completion", "flowchart-completion": "Flow-chart completion",
    "diagram-label": "Diagram label completion", "short-answer": "Short-answer questions",
}
CHOICE_TYPES = {"tfng", "ynng", "mcq", "mcq-multi", "headings", "matching-info", "matching-features", "sentence-endings", "summary-box"}
TEXT_TYPES = {"sentence-completion", "summary-completion", "note-completion", "table-completion", "flowchart-completion", "diagram-label", "short-answer"}
PER_QUESTION_OPTIONS = {"mcq", "mcq-multi"}
CONTEXT_TYPES = {"summary-box", "summary-completion", "note-completion", "table-completion", "flowchart-completion"}   # show the text with numbered gaps


def marks(g, q):
    """Marks (and question numbers) a question uses: TWO/THREE-letter questions count one per letter."""
    return max(1, len(q.get("answer") or [])) if g["type"] == "mcq-multi" else 1


def numbering(item):
    """{(group, question): (first number, marks)} inside one passage, starting at 1."""
    out, n = {}, 1
    for gi, g in enumerate(item["groups"]):
        for qi, q in enumerate(g["questions"]):
            m = marks(g, q)
            out[(gi, qi)] = (n, m)
            n += m
    return out


def total_marks(item):
    return sum(marks(g, q) for g in item["groups"] for q in g["questions"])
FIXED = {"tfng": ["TRUE", "FALSE", "NOT GIVEN"], "ynng": ["YES", "NO", "NOT GIVEN"]}
IELTS_R_SECONDS, IELTS_W_SECONDS = 60 * 60, 60 * 60
CRITERIA = {"ta": "Task Achievement / Response", "cc": "Coherence and Cohesion", "lr": "Lexical Resource", "gra": "Grammatical Range and Accuracy"}
READING_BANDS = [(39, 9), (37, 8.5), (35, 8), (32, 7.5), (30, 7), (27, 6.5), (23, 6), (19, 5.5), (15, 5), (13, 4.5), (10, 4), (8, 3.5), (6, 3), (4, 2.5), (2, 2), (1, 1)]

DEFAULT_SETTINGS = {"routeAt": 0.6, "easyCap": 640, "practiceReview": True, "mockReview": True, "writingAiInstant": True, "studentsCanStart": True,
                    "shuffle": True,
                    # AI drafts new items on a schedule (they arrive as drafts for teachers to check)
                    "autoDraft": {"enabled": False, "days": [1], "hour": 7, "sat": 3, "reading": 0, "writing": 0, "topics": ""}}
LETTERS = [chr(65 + i) for i in range(26)]
ROMAN = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x", "xi", "xii", "xiii", "xiv", "xv", "xvi"]
SHUFFLE_GROUPS = {"headings": ROMAN, "matching-features": LETTERS, "sentence-endings": LETTERS, "summary-box": LETTERS}   # lists whose order carries no meaning


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
    cfg["autoDraft"] = dict(DEFAULT_SETTINGS["autoDraft"], **(cfg.get("autoDraft") or {}))
    return cfg


def shuffle_item(it, rng):
    """A copy of the item with its answer options in a new order (same question, same correct answer).
    SAT: the four choices. IELTS Reading: multiple-choice options and the lists for matching headings,
    features and sentence endings (relabelled i, ii… / A, B…). True/False/Not Given, paragraph letters
    and completion answers keep their fixed order because their order is part of the task."""
    it = json.loads(json.dumps(it))
    if it["kind"] in CHOICE_KINDS and len(it.get("choices") or []) == 4 and it.get("part") != "error":   # error-identification choices follow the sentence
        perm = list(range(4))
        rng.shuffle(perm)
        it["choices"] = [it["choices"][p] for p in perm]
        if 0 <= int(it.get("answer", -1)) <= 3:
            it["answer"] = perm.index(int(it["answer"]))
    elif it["kind"] == "ielts-r":
        for g in it["groups"]:
            if g["type"] in PER_QUESTION_OPTIONS:
                for q in g["questions"]:
                    opts = list(q.get("options") or [])
                    rng.shuffle(opts)
                    m = {norm(o["key"]): LETTERS[i] for i, o in enumerate(opts)}
                    q["options"] = [{"key": LETTERS[i], "text": o["text"]} for i, o in enumerate(opts)]
                    q["answer"] = [m.get(norm(a), a) for a in q["answer"]]
            elif g["type"] in SHUFFLE_GROUPS and g.get("options"):
                labels = SHUFFLE_GROUPS[g["type"]]
                opts = list(g["options"])
                rng.shuffle(opts)
                m = {norm(o["key"]): labels[i] for i, o in enumerate(opts)}
                g["options"] = [{"key": labels[i], "text": o["text"]} for i, o in enumerate(opts)]
                for q in g["questions"]:
                    q["answer"] = [m.get(norm(a), a) for a in q["answer"]]
    return it


def arrange(items, seed, on=True):
    """Shuffle the answer options of a list of items reproducibly (same seed → same order)."""
    if not on:
        return [json.loads(json.dumps(i)) for i in items]
    rng = random.Random(seed)
    return [shuffle_item(i, rng) for i in items]


def save_settings(con, body):
    cfg = settings(con)
    if "routeAt" in body:
        cfg["routeAt"] = max(0.3, min(0.9, float(body["routeAt"])))
    if "easyCap" in body:
        cfg["easyCap"] = max(400, min(800, int(round(float(body["easyCap"]) / 10) * 10)))
    for k in ("practiceReview", "mockReview", "writingAiInstant", "studentsCanStart", "shuffle"):
        if k in body:
            cfg[k] = bool(body[k])
    if isinstance(body.get("autoDraft"), dict):
        a = body["autoDraft"]
        cfg["autoDraft"] = {"enabled": bool(a.get("enabled")),
                            "days": sorted({int(d) for d in a.get("days") or [] if str(d).isdigit() and 0 <= int(d) <= 6}),
                            "hour": max(0, min(23, int(a.get("hour") or 0))),
                            "sat": max(0, min(10, int(a.get("sat") or 0))), "reading": max(0, min(2, int(a.get("reading") or 0))),
                            "writing": max(0, min(2, int(a.get("writing") or 0))), "topics": str(a.get("topics") or "").strip()[:300]}
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
                   "passage": _s(raw.get("passage"), 3000), "table": table, "image": _s(raw.get("image"), 1_600_000), "stem": _s(raw.get("stem"), 600), "choices": choices,
                   "answer": int(raw.get("answer")) if str(raw.get("answer", "")).lstrip("-").isdigit() else -1,
                   "explanation": _bi(raw.get("explanation"), 1500), "pretest": bool(raw.get("pretest")), "topic": _bi(raw.get("topic"), 160)})
        w, limit = words(it["passage"]), (300 if skill == "cross-text" else 150)
        if not (25 <= w <= limit):
            probs.append(f"passage must be 25–{limit} words (now {w})")
        if skill == "evidence-quantitative" and not (table or it["image"]):
            probs.append("quantitative evidence questions need a data table or a graph image (bar or line graph)")
        if it["image"] and not re.match(r"^(data:image/(png|jpeg|webp);base64,|https://)", it["image"]):
            raise ValueError("graph must be a PNG/JPEG/WebP upload or https:// address")
        if not it["stem"]:
            probs.append("question missing")
        if len(choices) != 4 or any(not c for c in choices) or len({c.strip() for c in choices}) != 4:
            probs.append("exactly 4 different answer choices are needed")
        if not 0 <= it["answer"] <= 3:
            probs.append("mark the correct choice")
        if not (it["explanation"]["en"] or it["explanation"]["th"]):
            probs.append("explanation missing")
        if re.search(r"\b(?i:choice|option|answer)s?\s*\(?[A-D]\)?(?![A-Za-z])|\([A-D]\)|ตัวเลือก\s*[A-D]\b|ข้อ\s*[A-D]\b", it["explanation"]["en"] + " " + it["explanation"]["th"]):
            probs.append("explanations must name choices by their words, not by letter (answer order is shuffled)")
        if it["stem"] and not it["stem"].rstrip().endswith("?"):
            probs.append("the question should be a full SAT-style question ending with \"?\"")
    elif kind == "m1":
        prog = raw.get("program") if raw.get("program") in M1_PROGRAMS else "gate"
        subj = raw.get("subject") if raw.get("subject") in M1_PROGRAMS[prog]["subjects"] else M1_PROGRAMS[prog]["subjects"][0]
        choices = [_s(c, 400) for c in (raw.get("choices") or [])][:4]
        table = raw.get("table") if isinstance(raw.get("table"), dict) else None
        if table:
            rows = [[_s(c, 60) for c in r][:8] for r in (table.get("rows") or []) if isinstance(r, list)][:12]
            table = {"title": _s(table.get("title"), 160), "rows": rows} if rows else None
        fmt = raw.get("format") if raw.get("format") in M1_FORMATS else "mcq"
        it.update({"program": prog, "subject": subj, "format": fmt, "difficulty": raw.get("difficulty") if raw.get("difficulty") in DIFF else "m",
                   "passage": _s(raw.get("passage"), 4000), "table": table, "image": _s(raw.get("image"), 1_600_000), "stem": _s(raw.get("stem"), 1500),
                   "choices": choices if fmt == "mcq" else [], "answer": int(raw.get("answer")) if fmt == "mcq" and str(raw.get("answer", "")).lstrip("-").isdigit() else -1,
                   "accept": [_s(a, 60) for a in (raw.get("accept") or []) if _s(a, 60)][:8] if fmt == "fill" else [],
                   "unit": _s(raw.get("unit"), 30) if fmt == "fill" else "",
                   "skill": _bi(raw.get("skill"), 160), "topic": _bi(raw.get("topic"), 160), "part": raw.get("part") if raw.get("part") in M1_PARTS else "", "lang": "en" if raw.get("lang") == "en" else "th" if raw.get("lang") == "th" else "",
                   "explanation": _bi(raw.get("explanation"), 2000)})
        if it["image"] and not re.match(r"^(data:image/(png|jpeg|webp);base64,|https://)", it["image"]):
            raise ValueError("picture must be a PNG/JPEG/WebP upload or https:// address")
        if not it["stem"]:
            probs.append("question missing")
        if fmt == "mcq":
            if len(choices) != 4 or any(not c for c in choices) or len({c.strip() for c in choices}) != 4:
                probs.append("exactly 4 different answer choices are needed")
            if not 0 <= it["answer"] <= 3:
                probs.append("mark the correct choice")
        elif not it["accept"]:
            probs.append("written-answer question: give the accepted answer(s)")
        if not (it["explanation"]["en"] or it["explanation"]["th"]):
            probs.append("explanation missing")
        if not (it["skill"]["en"] or it["skill"]["th"]) or not (it["topic"]["en"] or it["topic"]["th"]):
            probs.append("say what the question measures (skill) and its topic")
        if re.search(r"\b(?i:choice|option|answer)s?\s*\(?[A-D]\)?(?![A-Za-z])|\([A-D]\)|ตัวเลือก\s*[A-Dก-ง]\b|ข้อ\s*[A-Dกขคง](?![ก-๛])", it["explanation"]["en"] + " " + it["explanation"]["th"]):
            probs.append("explanations must name choices by their content, not by letter (answer order is shuffled)")
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
                   "image": _s(g.get("image"), 1_600_000) if t == "diagram-label" else "", "context": _s(g.get("context"), 3000) if t in CONTEXT_TYPES else "", "questions": []}
            if t == "matching-info" and not grp["options"]:      # the options are the passage's paragraph letters
                grp["options"] = [{"key": LETTERS[i], "text": LETTERS[i]} for i in range(len([p for p in (raw.get("paragraphs") or []) if str(p).strip()][:12]))]
            for q in (g.get("questions") or [])[:20]:
                ans = q.get("answer")
                ans = [_s(a, 80) for a in (ans if isinstance(ans, list) else [ans]) if _s(a, 80)][:6]
                qq = {"text": _s(q.get("text"), 600), "answer": ans}
                if t in PER_QUESTION_OPTIONS:
                    qq["options"] = _opts(q.get("options"), 9)
                grp["questions"].append(qq)
            total_q += sum(marks(grp, q) for q in grp["questions"])
            groups.append(grp)
        it.update({"title": _s(raw.get("title"), 160), "topic": _bi(raw.get("topic"), 160), "paragraphs": paras, "labelled": bool(raw.get("labelled", True)),
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
                if g["type"] in CHOICE_TYPES and g["type"] not in PER_QUESTION_OPTIONS and not g["options"]:
                    probs.append(f"{g['type']}: options missing")
                if g["type"] == "mcq":
                    k2 = {norm(o["key"]) for o in q.get("options", [])}
                    if not 3 <= len(q.get("options", [])) <= 5 or len(q["answer"]) != 1 or any(norm(a) not in k2 for a in q["answer"]):
                        probs.append(f"multiple choice question {i}: needs 3–5 options (A–C … A–E) and exactly one answer letter")
                if g["type"] == "mcq-multi":
                    k2 = {norm(o["key"]) for o in q.get("options", [])}
                    need = len(q["answer"])
                    if need not in (2, 3) or len({norm(a) for a in q["answer"]}) != need or any(norm(a) not in k2 for a in q["answer"]):
                        probs.append(f"choose-{need} question {i}: give TWO or THREE different answer letters from its options")
                    if len(q.get("options", [])) < need + 2:
                        probs.append(f"choose-{need} question {i}: needs at least {need + 2} options (e.g. A–E for TWO, A–G for THREE)")
                    word = {2: "TWO", 3: "THREE"}.get(need, "")
                    if word and word not in (g.get("instructions") or "").upper():
                        probs.append(f"choose-{need} question {i}: the instructions must say \"Choose {word} letters\"")
                if g["type"] in CHOICE_TYPES and g["type"] not in PER_QUESTION_OPTIONS and any(norm(a) not in keys for a in q["answer"]):
                    probs.append(f"{g['type']} question {i}: the answer must be one of the options")
                if g["type"] in TEXT_TYPES:
                    for a in q["answer"]:
                        if not within_limit(a, g["wordLimit"]):
                            probs.append(f"{g['type']} question {i}: answer '{a}' is over the word limit")
                if not q["text"] and g["type"] not in ("diagram-label",):
                    probs.append(f"{g['type']} question {i}: text missing")
            m = re.search(r"NO MORE THAN (ONE|TWO|THREE|FOUR|FIVE) WORDS?", (g.get("instructions") or "").upper())
            if g["type"] in TEXT_TYPES and m and g["wordLimit"] and ["ONE", "TWO", "THREE", "FOUR", "FIVE"].index(m.group(1)) + 1 != g["wordLimit"]["words"]:
                probs.append(f"{g['type']}: the instructions say {m.group(0)} but the word limit is {g['wordLimit']['words']}")
            if g["type"] in TEXT_TYPES and not m and "ONE WORD" not in (g.get("instructions") or "").upper():
                probs.append(f"{g['type']}: instructions must state the word limit (e.g. \"Choose NO MORE THAN TWO WORDS from the passage\")")
            if g["type"] in ("tfng", "ynng") and not g.get("instructions"):
                probs.append(f"{g['type']}: instructions missing")
            if g["type"] == "summary-box" and len(g["options"]) < len(g["questions"]) + 2:
                probs.append("summary with a box of words: the box needs more words than gaps (at least 2 extra)")
            if g["type"] in CONTEXT_TYPES and g["type"] != "summary-completion" and not g.get("context"):
                probs.append(f"{g['type']}: add the summary / notes / table / flow-chart text with numbered gaps")
            reuse = "MORE THAN ONCE" in (g.get("instructions") or "").upper()
            used = [norm(a) for q in g["questions"] for a in q["answer"][:1]]
            if g["type"] in ("headings", "sentence-endings", "summary-box") and len(used) != len(set(used)):
                probs.append(f"{g['type']}: each option may be used only once")
            if g["type"] in ("matching-info", "matching-features") and len(used) != len(set(used)) and not reuse:
                probs.append(f"{g['type']}: a letter is used twice — add \"NB You may use any letter more than once.\" to the instructions, or change the answers")
            if g["type"] == "sentence-endings" and len(g["options"]) <= len(g["questions"]):
                probs.append("sentence endings: there must be more endings than sentence beginnings")
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
        if it["prompt"] and str(it["minWords"]) not in it["prompt"]:
            probs.append(f"the task must say \"Write at least {it['minWords']} words.\" as in the real test")
        if task == 1 and it["prompt"] and "summarise the information" not in it["prompt"].lower():
            probs.append("Task 1 must use the official instruction: \"Summarise the information by selecting and reporting the main features, and make comparisons where relevant.\"")
        if task == 2 and it["prompt"] and "give reasons for your answer" not in it["prompt"].lower():
            probs.append("Task 2 must end with: \"Give reasons for your answer and include any relevant examples from your own knowledge or experience.\"")
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
    m1 = items(con, "m1", "approved")
    return {"sat": {"approved": len(op), "pretest": len(sat) - len(op), "byDomain": by, "need": need, "minimum": sum(need.values()),
                    "recommended": 81 * 3, "mock": sat_ok},
            "ielts-r": {"sets": len(sets), "questions": sum(total_marks(s) for s in sets), "mock": bool(_pick_reading(sets, random.Random(1)))},
            "ielts-w": {"task1": sum(1 for t in tasks if t["task"] == 1), "task2": sum(1 for t in tasks if t["task"] == 2),
                        "mock": any(t["task"] == 1 for t in tasks) and any(t["task"] == 2 for t in tasks)},
            "m1": {p: {sub: sum(1 for i in m1 if i["program"] == p and i["subject"] == sub) for sub in M1_PROGRAMS[p]["subjects"]} for p in M1_PROGRAMS}}


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
        q = sum(total_marks(s) for s in trio)
        w = sum(s.get("words") or 0 for s in trio)
        if q == 40 and 2150 <= w <= 2750:
            return sorted(trio, key=lambda s: s.get("difficulty", 2))
    return None


def seen_items(con, uid):
    out = set()
    for r in con.execute("SELECT data FROM exam_attempts WHERE user_id=?", (uid,)):
        out |= set(json.loads(r["data"]).get("snap", {}).keys())
    return out


SET_SECONDS = {"sat": SAT_MODULE_S, "ielts-r": IELTS_R_SECONDS, "ielts-w": IELTS_W_SECONDS, "m1": 90 * 60}
SET_TITLES = {"sat": "SAT Reading and Writing", "ielts-r": "IELTS Academic Reading", "ielts-w": "IELTS Academic Writing", "m1": "M.1 entrance"}


def start_set(con, me, qs, cfg):
    """A timed test built from a saved question set: the same questions for everyone, answers shuffled per attempt."""
    import qsets
    its = [i for i in qsets.items_of(con, qs) if i.get("status") != "retired" or me["role"] in ("admin", "teacher")]
    if not its:
        raise ValueError("this set has no items")
    rng = random.Random(secrets.randbits(64))
    t0 = now()
    secs = int(qs.get("minutes") or 0) * 60 or SET_SECONDS[qs["kind"]]
    if qs["kind"] == "sat" and len(its) != 2 * SAT_MODULE_Q:
        its = _sat_order(its)
    if qs["kind"] == "sat" and len(its) == 2 * SAT_MODULE_Q:        # a full SAT: two timed modules, as in Bluebook
        secs_list = [_section("s1", qs["title"] + " · Module 1", SAT_MODULE_S, [i["id"] for i in _sat_order(its[:SAT_MODULE_Q])], t0),
                     {"key": "s2", "title": qs["title"] + " · Module 2", "seconds": SAT_MODULE_S, "items": [i["id"] for i in _sat_order(its[SAT_MODULE_Q:])],
                      "answers": {}, "marked": {}, "struck": {}, "submittedAt": None, "pending": True}]
    else:
        secs_list = [_section("s", qs["title"], secs, [i["id"] for i in its], t0)]
    snap = {i["id"]: i for i in (its if qs["kind"] == "ielts-w" else arrange(its, rng.random(), cfg["shuffle"]))}
    att = {"id": "t" + secrets.token_hex(8), "userId": me["id"], "kind": qs["kind"], "mode": "set", "setId": qs["id"], "setTitle": qs["title"],
           "status": "active", "preview": me["role"] in ("admin", "teacher"), "sections": secs_list, "current": 0, "route": None, "snap": snap, "createdAt": iso(t0)}
    put_attempt(con, att)
    return att


def start(con, me, body, cfg):
    kind, mode = body.get("kind"), body.get("mode") if body.get("mode") in ("mock", "practice") else "practice"
    if body.get("setId"):
        import qsets
        qs = qsets.get(con, body["setId"])
        staff = me["role"] in ("admin", "teacher")
        if not qs or not (qs.get("published") or (staff and (qs["owner"] == me["id"] or me["role"] == "admin"))):
            raise ValueError("this test set is not available")
        return start_set(con, me, qs, cfg)
    if kind not in KINDS:
        raise ValueError("choose SAT, IELTS Reading, IELTS Writing or M.1 entrance")
    rng = random.Random(secrets.randbits(64))
    seen = seen_items(con, me["id"])
    snap, sections = {}, []
    t0 = now()
    if kind == "m1":
        prog = body.get("program") if body.get("program") in M1_PROGRAMS else "gate"
        subs = [x for x in (body.get("subjects") or M1_PROGRAMS[prog]["subjects"]) if x in M1_PROGRAMS[prog]["subjects"]] or M1_PROGRAMS[prog]["subjects"]
        n = max(5, min(40, int(body.get("count") or 10)))
        cand = [i for i in items(con, "m1", "approved") if i["program"] == prog and i["subject"] in subs]
        if len(cand) < n:
            raise ValueError(f"only {len(cand)} approved questions match — choose fewer or more subjects")
        fresh = [i for i in cand if i["id"] not in seen]
        chosen = rng.sample(fresh, n) if len(fresh) >= n else fresh + rng.sample([i for i in cand if i["id"] in seen], n - len(fresh))
        chosen.sort(key=lambda i: (M1_PROGRAMS[prog]["subjects"].index(i["subject"]), PART_ORDER.index(i["part"]) if i.get("part") in PART_ORDER else 9, DIFF.index(i["difficulty"])))
        sections.append(_section("p", M1_PROGRAMS[prog]["en"] + " · Practice", n * 135, [i["id"] for i in chosen], t0))
        snap.update({i["id"]: i for i in arrange(chosen, rng.random(), cfg["shuffle"])})
    elif kind == "sat":
        pool = items(con, "sat", "approved")
        op, pre = [i for i in pool if not i.get("pretest")], [i for i in pool if i.get("pretest")]
        if mode == "mock":
            m1 = _draw_sat(op, rng, _plan(MIX["m1"]), set(), seen, pre)
            sections.append(_section("m1", "Reading and Writing · Module 1", SAT_MODULE_S, [i["id"] for i in m1], t0))
            snap.update({i["id"]: i for i in arrange(m1, rng.random(), cfg["shuffle"])})
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
            snap.update({i["id"]: i for i in arrange(chosen, rng.random(), cfg["shuffle"])})
    elif kind == "ielts-r":
        sets = items(con, "ielts-r", "approved")
        if mode == "mock":
            trio = _pick_reading(sets, rng)
            if not trio:
                raise ValueError("the bank needs approved passages that make exactly 40 questions and 2,150–2,750 words in total")
            sections.append(_section("r", "IELTS Academic Reading", IELTS_R_SECONDS, [s["id"] for s in trio], t0))
            snap.update({s["id"]: s for s in arrange(trio, rng.random(), cfg["shuffle"])})
        else:
            pick = next((s for s in sets if s["id"] == body.get("item")), None) or (rng.choice([s for s in sets if s["id"] not in seen] or sets) if sets else None)
            if not pick:
                raise ValueError("no approved reading passages yet")
            sections.append(_section("r", "IELTS Academic Reading · Practice passage", 20 * 60, [pick["id"]], t0))
            snap[pick["id"]] = arrange([pick], rng.random(), cfg["shuffle"])[0]
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
    nxt = a["current"] + 1
    if nxt < len(a["sections"]) and a["sections"][nxt].get("pending"):   # next timed part of a saved set (e.g. SAT Module 2)
        t0 = now()
        n = a["sections"][nxt]
        n.pop("pending", None)
        n.update({"startedAt": iso(t0), "deadline": iso(datetime.fromtimestamp(t0.timestamp() + n["seconds"], timezone.utc))})
        a["current"] = nxt
        put_attempt(con, a)
        return a
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
            a["snap"].update({i["id"]: i for i in arrange(m2, rng.random(), cfg["shuffle"])})
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


def is_correct(item, value, gi=None, qi=None):
    """Is this answer right? SAT: value is the choice index; IELTS Reading: group gi, question qi."""
    if item["kind"] == "m1" and item.get("format") == "fill":
        return fill_ok(value, item.get("accept") or [])
    if item["kind"] in CHOICE_KINDS:
        return str(value) == str(item["answer"])
    g = item["groups"][gi]
    q = g["questions"][qi]
    return points(g, q, value) == marks(g, q)


def points(g, q, value):
    """Marks earned. TWO/THREE-letter questions: one mark per correct letter; more letters than asked scores 0."""
    if g["type"] == "mcq-multi":
        picked = {norm(x) for x in str(value or "").split(",") if norm(x)}
        right = {norm(x) for x in q["answer"]}
        return 0 if len(picked) > len(right) else len(picked & right)
    if g["type"] in TEXT_TYPES:
        return int(check_text(value, q["answer"], g["wordLimit"]))
    return int(norm(value) in {norm(x) for x in q["answer"]})


def fill_ok(value, accept):
    """Written answers: same words or the same number (spaces, commas, a trailing unit and 3/4 vs 0.75 allowed)."""
    def nums(v):
        v = norm(v).replace(",", "").replace(" ", "")
        m = re.fullmatch(r"(-?\d+(?:\.\d+)?)(?:/(\d+(?:\.\d+)?))?[^\d]*", v)
        if not m:
            return None
        try:
            return float(m.group(1)) / (float(m.group(2)) if m.group(2) else 1)
        except ZeroDivisionError:
            return None
    v = str(value or "").strip()
    if not v:
        return False
    nv = nums(v)
    for a in accept:
        na = nums(a)
        if (nv is not None and na is not None and abs(nv - na) < 1e-6) or norm(v) == norm(a):
            return True
    return False


NUMBER_WORDS = {w: str(i) for i, w in enumerate("zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty".split())}
NUMBER_WORDS.update({"thirty": "30", "forty": "40", "fifty": "50", "sixty": "60", "seventy": "70", "eighty": "80", "ninety": "90", "hundred": "100"})


def _numform(s):
    """IELTS accepts a number written as figures or as a word: '3' = 'three'."""
    return " ".join(NUMBER_WORDS.get(t, t) for t in norm(s).split())


def check_text(ans, accepted, wl):
    """Exact words (any capitalisation); spelling and singular/plural must match; numbers as figures or words."""
    if not within_limit(ans, wl):
        return False
    return _numform(ans) in {_numform(x) for x in accepted}


def score(a, cfg):
    if a["kind"] == "m1":
        by, topics, parts, c, t, prog = {}, {}, {}, 0, 0, None
        for sec in a["sections"]:
            for iid in sec["items"]:
                it = a["snap"][iid]
                prog = prog or it.get("program")
                ok = is_correct(it, sec["answers"].get(iid, ""))
                b = by.setdefault(it["subject"], {"c": 0, "t": 0})
                b["c"] += ok; b["t"] += 1; c += ok; t += 1
                if it.get("part"):
                    bp = parts.setdefault(it["part"], {"part": it["part"], "name": M1_PARTS[it["part"]], "c": 0, "t": 0})
                    bp["c"] += ok; bp["t"] += 1
                tp = (it.get("topic") or {}).get("en") or ""
                if tp:
                    x = topics.setdefault(it["subject"] + "|" + tp, {"subject": it["subject"], "topic": it.get("topic"), "c": 0, "t": 0})
                    x["c"] += ok; x["t"] += 1
        pct = round(100 * c / t) if t else 0
        res = {"correct": c, "total": t, "percent": pct, "bySubject": by, "byTopic": sorted(topics.values(), key=lambda x: (x["subject"], x["c"] / x["t"])), "program": prog,
               "byPart": [parts[k] for k in PART_ORDER if k in parts]}
        if a.get("mode") == "set" or t >= 30:
            res["targets"] = [dict(g, met=pct >= g["overall"] and all(by.get(k) and 100 * by[k]["c"] / by[k]["t"] >= v for k, v in g["subjects"].items()))
                              for g in M1_TARGETS.get(prog, [])]
        return res
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
            res["ceiling"] = cfg["easyCap"] if a.get("route") == "easy" else 800     # unofficial: College Board publishes no ceiling
            res["percentile"] = rw_percentile(res["estimate"])
        elif a["mode"] == "set" and res["total"] >= 2 * SAT_MODULE_Q - 4 and maxw:   # full-length practice set (not adaptive)
            res["estimate"] = int(max(200, min(800, round((200 + 600 * got / maxw) / 10) * 10)))
            res["percentile"] = rw_percentile(res["estimate"])
        topics = {}
        for sec in a["sections"]:
            for iid in sec["items"]:
                it = a["snap"][iid]
                k = it["domain"] + "|" + it["skill"]
                x = topics.setdefault(k, {"domain": it["domain"], "skill": it["skill"], "c": 0, "t": 0})
                x["c"] += sec["answers"].get(iid) == str(it["answer"]); x["t"] += 1
        res["bySkill"] = sorted(topics.values(), key=lambda x: (SAT_ORDER.index(x["domain"]), x["skill"]))
        return res
    if a["kind"] == "ielts-r":
        sec, c, t, per = a["sections"][0], 0, 0, []
        for sid in sec["items"]:
            s, sc = a["snap"][sid], 0
            for gi, g in enumerate(s["groups"]):
                for qi, q in enumerate(g["questions"]):
                    ok = points(g, q, sec["answers"].get(f"{sid}:{gi}:{qi}", ""))
                    c += ok; t += marks(g, q); sc += ok
            per.append({"id": sid, "title": s["title"], "correct": sc})
        res = {"correct": c, "total": t, "passages": per}
        raw = c if t == 40 else round(c * 40 / t) if t else 0
        res["band"] = next((b for lim, b in READING_BANDS if raw >= lim), 0)
        res["scaled"] = t != 40
        return res
    sec = a["sections"][0]
    return {"words": {iid: words(sec["answers"].get(iid, "")) for iid in sec["items"]}, "ai": {}, "teacher": None}


# Official College Board percentiles for the RW section score (SAT user group), 2026 research page.
RW_PERCENTILES = [(800, 99), (750, 98), (700, 92), (650, 84), (600, 72)]
ERROR_CAUSES = ("vocabulary", "reasoning", "misread", "time", "trap", "rule")


def rw_percentile(score):
    """Approximate percentile among SAT takers (interpolated between the official anchors; None below 600)."""
    if score is None or score < 600:
        return None
    pts = sorted(RW_PERCENTILES)
    for (s1, p1), (s2, p2) in zip(pts, pts[1:]):
        if s1 <= score <= s2:
            return round(p1 + (p2 - p1) * (score - s1) / (s2 - s1))
    return 99


def tag_error(a, iid, cause):
    """Learner's own error log on a finished SAT test: why was this question missed?"""
    if a["kind"] not in CHOICE_KINDS or a["status"] == "active":
        raise ValueError("tag mistakes after the test")
    if iid not in a["snap"]:
        raise ValueError("unknown question")
    tags = a.setdefault("tags", {})
    if cause in ERROR_CAUSES:
        tags[iid] = cause
    else:
        tags.pop(iid, None)


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
        s = {k: sec.get(k) for k in ("key", "title", "seconds", "startedAt", "deadline", "submittedAt")}
        if open_ or review:
            s["answers"], s["marked"], s["struck"] = sec["answers"], sec["marked"], sec["struck"]
            s["items"] = [_public_item(a["snap"][i], review) for i in sec["items"]]
            if review and a["kind"] in CHOICE_KINDS:
                s["correct"] = {i: is_correct(a["snap"][i], sec["answers"].get(i, "")) for i in sec["items"]}
            if a["kind"] == "ielts-r":
                n = 1
                for it in s["items"]:
                    full = a["snap"][it["id"]]               # marks come from the full item (the public copy has no answers)
                    for gi, g in enumerate(it["groups"]):
                        g["from"] = n
                        for qi, q in enumerate(g["questions"]):
                            q["n"], q["marks"] = n, marks(full["groups"][gi], full["groups"][gi]["questions"][qi])
                            n += q["marks"]
                        g["to"] = n - 1
        else:
            s["count"] = len(sec["items"])
        secs.append(s)
    out = {k: a.get(k) for k in ("id", "kind", "mode", "status", "current", "createdAt", "finishedAt", "preview")}
    out["sections"], out["serverNow"], out["review"] = secs, iso(), review
    out["staff"] = bool(staff)
    if done:
        out["result"] = dict(a.get("result") or {})
        out["tags"] = a.get("tags", {})
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
    if it["kind"] == "m1":
        out = {k: it.get(k) for k in ("id", "passage", "table", "image", "stem", "choices", "subject", "program", "format", "unit", "lang", "part")}
        if review:
            out.update({"answer": it["answer"], "accept": it.get("accept"), "explanation": it["explanation"], "difficulty": it["difficulty"], "skill": it.get("skill"), "topic": it.get("topic")})
        return out
    if it["kind"] == "sat":
        out = {k: it.get(k) for k in ("id", "passage", "table", "image", "stem", "choices")}
        if review:
            out.update({"answer": it["answer"], "explanation": it["explanation"], "domain": it["domain"], "skill": it["skill"], "difficulty": it["difficulty"], "pretest": it.get("pretest", False), "topic": it.get("topic")})
        return out
    if it["kind"] == "ielts-r":
        groups = []
        for g in it["groups"]:
            gg = {k: g.get(k) for k in ("type", "instructions", "options", "wordLimit", "image", "context")}
            gg["questions"] = [{"text": q["text"], "options": q.get("options"), "pick": len(q["answer"]) if g["type"] == "mcq-multi" else None,
                                **({"answer": q["answer"]} if review else {})} for q in g["questions"]]
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
        "max_words": {"type": "integer"}, "allow_number": {"type": "boolean"}, "context": {"type": "string"},
        "questions": {"type": "array", "items": {"type": "object", "properties": {
            "text": {"type": "string"}, "answers": {"type": "array", "items": {"type": "string"}},
            "options": {"type": "array", "items": {"type": "object", "properties": {"key": {"type": "string"}, "text": {"type": "string"}}, "required": ["key", "text"], "additionalProperties": False}}},
            "required": ["text", "answers", "options"], "additionalProperties": False}}},
        "required": ["type", "instructions", "options", "max_words", "allow_number", "context", "questions"], "additionalProperties": False}}},
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
            "Passages come from literature, history/social studies, the humanities or science. "
            "Each question has ONE defensible answer; the right answer does exactly the job the stem asks. Build the wrong choices the way official "
            "items do: one contradicts the text or claim, one adds something the text never says, one satisfies only half of a two-part claim, and "
            "(where relevant) one uses the wrong logical connector or a real but wrong sense of a word. Do not rely on 'too extreme' wording alone. "
            + ("Standard English Conventions difficulty ladder (easy → hard): end punctuation and verb forms; subject–verb agreement across "
               "intervening nouns; no punctuation between a subject and its verb; commas around nonessential elements; semicolons with conjunctive "
               "adverbs; restrictive vs nonrestrictive appositives; colons introducing independent clauses; dangling modifiers. Boundaries items: "
               "options differ only in punctuation; Form, Structure, and Sense items: options differ in words or structure. " if domain == "sec" else "") +
            "skill must be one of: " + ", ".join(d["skills"]) + ". Explanations: why the answer is right and each other choice is wrong; "
            "explanation_en in English, explanation_th in Thai. In explanations refer to choices by their words, never by letter (A–D), because the order of choices is shuffled for every student.")


def reading_prompt(topic, difficulty):
    return ("Write one ORIGINAL IELTS Academic Reading passage with its questions.\n"
            f"Topic: {topic or 'an academic topic of general interest (science, history, environment, technology or society)'}. "
            f"Level: {['', 'easier (like passage 1)', 'medium (like passage 2)', 'harder (like passage 3)'][max(1, min(3, int(difficulty or 2)))]}.\n"
            "Passage: 750–950 words, 6–8 paragraphs (they are labelled A, B, C… on screen), formal academic style.\n"
            "Questions: 13 or 14 marks in total, in 3 groups of DIFFERENT official types, mixing choice and completion tasks as the real test does. "
            "Use the official instruction wording for each type. Type rules:\n"
            "- tfng / ynng: options empty; answers TRUE/FALSE/NOT GIVEN (or YES/NO/NOT GIVEN); include at least one NOT GIVEN.\n"
            "- mcq: 'Choose the correct letter, A, B, C or D.' Each question has its own 4 options (3–5 allowed) and exactly ONE answer letter.\n"
            "- mcq-multi: 'Choose TWO letters, A–E.' (or THREE letters, A–G). Each question has its own 5–7 options and TWO or THREE answer letters; "
            "each correct letter is worth one mark.\n"
            "- headings: options with roman numerals i, ii, … (more headings than paragraphs); each question text names a paragraph; answer = numeral.\n"
            "- matching-info: 'Which paragraph contains the following information?' options empty (paragraph letters are used); answer = paragraph letter "
            "(add 'NB You may use any letter more than once' when true).\n"
            "- matching-features / sentence-endings: a lettered list longer than the questions; answers are letters.\n"
            "- summary-box: 'Complete the summary using the list of words, A–I, below.' put the summary text with numbered gaps in context "
            "(e.g. '… caused by (9) ______ …'), give the word box as lettered options (at least 2 more than the gaps); answers are letters.\n"
            "- summary-completion / note-completion / table-completion / flowchart-completion / sentence-completion / short-answer: answers are words "
            "copied exactly from the passage; set max_words (1–3) and allow_number to match the instruction "
            "('Choose NO MORE THAN TWO WORDS AND/OR A NUMBER from the passage for each answer.' or 'Choose ONE WORD ONLY from the passage for each answer.'); "
            "for note/table/flow-chart/summary put the whole notes/table/flow-chart/summary text in context with numbered gaps, and make each question's "
            "text the gap line (e.g. '(10) ______'). Give every acceptable form of each answer (both British and American spellings where they differ; numbers may be figures or words).\n"
            "Matching headings: a heading is never used twice. Sentence endings: more endings than beginnings, each used once. "
            "Matching information / features: a letter may be used twice only if the instructions add 'NB You may use any letter more than once.'\n"
            "Leave context empty for other types. Questions follow the order of the passage where the official test does.")


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
                   "Accuracy; the four criteria are equally weighted). Give each criterion a whole band 0–9. Be strict and realistic, as a trained "
                   "examiner would be. A response under the minimum length may not give enough evidence for higher bands (there is no fixed "
                   "deduction; longer is not penalised). Off-topic writing, bullet points or notes, and text copied from the task or another "
                   "source are penalised; a wholly memorised script belongs with responses that do not attempt the task. Task 1: an overview of "
                   "the main trends or differences is essential, key figures should be compared, and no personal opinion is given. Task 2: every "
                   "part of the question must be answered with a clear position throughout. Comments in clear, simple English "
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
                       "wordLimit": {"words": g.get("max_words") or 2, "number": bool(g.get("allow_number"))}, "context": g.get("context") or "",
                       "questions": [{"text": q.get("text"), "answer": q.get("answers"), "options": q.get("options")} for q in g.get("questions", [])]})
    return {"kind": "ielts-r", "title": data.get("title"), "paragraphs": data.get("paragraphs"), "difficulty": difficulty, "groups": groups, "origin": "ai", "status": "draft"}


def from_ai_wtask(data, task):
    rows = data.get("table_rows") or []
    return {"kind": "ielts-w", "task": task, "prompt": data.get("prompt"), "essayType": data.get("essay_type"), "visual": data.get("visual"),
            "table": {"title": data.get("table_title", ""), "rows": rows} if rows else None, "origin": "ai", "status": "draft"}
