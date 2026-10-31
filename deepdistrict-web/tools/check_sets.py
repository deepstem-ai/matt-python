"""Check practice-set files in server/exam_sets/*.json against the exam bank's format rules.

    python3 tools/check_sets.py                 # every file
    python3 tools/check_sets.py server/exam_sets/sat-1.json

Each file: {"exam": "sat"|"ielts"|"gate"|"ep", "set": 1, "title": {"en","th"}, "minutes": 32, "items": [...]}.
Prints every problem; exit code 1 if any.
"""
import glob
import re
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "server"))
import exams  # noqa: E402

# Every school / test has its own English paper (never combined): own parts, length, depth and CEFR level.
PART_MIX = {
    "sk1": {"conversation": 8, "vocabulary": 8, "grammar": 8, "cloze": 6, "reading": 10},                       # Suankularb M.1 GATE / EPLUS+
    "sp1": {"conversation": 6, "vocabulary": 8, "grammar": 8, "reading": 28},                                    # Satit Prasarnmit M.1
    "sk4": {"conversation": 6, "vocabulary": 8, "grammar": 10, "error": 6, "cloze": 8, "reading": 12},           # Suankularb M.4 GATE / EPLUS+
    "sp4": {"vocabulary": 10, "grammar": 12, "error": 8, "reading-academic": 20},                                # Satit Prasarnmit M.4
    "tu4": {"conversation": 5, "error": 10, "cloze": 15, "reading": 20},                                         # Triam Udom Suksa M.4
    "alevel": {"conversation-short": 12, "conversation-long": 8, "reading-ads": 6, "reading-review": 6, "reading-news": 8,
               "reading-visual": 8, "reading-article": 12, "text-completion": 15, "paragraph": 5},             # A-Level English (TCAS)
}
EXPECT = {"sat": {"sat": 54}, "ielts": {"ielts-r": 3, "ielts-w": 2}}
EXPECT.update({k: {"m1": sum(v.values())} for k, v in PART_MIX.items()})
M1_MIX = {k: {"eng": sum(v.values())} for k, v in PART_MIX.items()}
M1_FILL = {k: {} for k in PART_MIX}
M1_EN = {}


def check(path):
    bad = []
    d = json.load(open(path, encoding="utf-8"))
    if d.get("exam") not in EXPECT:
        return [f"{path}: exam must be one of {list(EXPECT)}"]
    count = {}
    for n, raw in enumerate(d.get("items") or [], 1):
        raw = dict(raw, rightsOk=True, status="approved")
        try:
            it, probs = exams.clean_item(raw)
        except Exception as e:  # noqa: BLE001
            bad.append(f"{path} item {n}: {e}"); continue
        count[it["kind"]] = count.get(it["kind"], 0) + 1
        for p in probs:
            bad.append(f"{path} item {n} ({(raw.get('stem') or raw.get('title') or raw.get('prompt') or '')[:50]!r}): {p}")
        if it["kind"] in ("sat", "ielts-r") and not (it.get("topic") or {}).get("en"):
            bad.append(f"{path} item {n}: add \"topic\" {{en, th}} (what the passage is about)")
        if d["exam"] in M1_MIX and it["kind"] == "m1" and it["program"] != d["exam"]:
            bad.append(f"{path} item {n}: program must be {d['exam']}")
    if count != EXPECT[d["exam"]]:
        bad.append(f"{path}: expected {EXPECT[d['exam']]}, found {count}")
    if d["exam"] == "ielts":
        rs = [exams.clean_item(dict(r, rightsOk=True))[0] for r in d["items"] if r.get("kind") == "ielts-r"]
        marks = sum(exams.total_marks(r) for r in rs)
        words = sum(r["words"] for r in rs)
        if marks != 40:
            bad.append(f"{path}: the three passages must carry exactly 40 marks (now {marks})")
        if not 2150 <= words <= 2750:
            bad.append(f"{path}: the three passages must total 2,150–2,750 words (now {words})")
        tasks = sorted(r.get("task") for r in d["items"] if r.get("kind") == "ielts-w")
        if tasks != [1, 2]:
            bad.append(f"{path}: needs one Writing Task 1 and one Task 2")
    if d["exam"] == "sat":
        for m, part in ((1, d["items"][:27]), (2, d["items"][27:])):
            doms = {}
            for r in part:
                doms[r.get("domain")] = doms.get(r.get("domain"), 0) + 1
            if doms != {"cs": 7, "ii": 7, "sec": 7, "eoi": 6}:
                bad.append(f"{path}: SAT module {m} mix must be cs 7, ii 7, sec 7, eoi 6 (now {doms})")
    if d["exam"] in M1_MIX:
        subj, fill, en = {}, {}, {}
        for r in d["items"]:
            k = r.get("subject")
            subj[k] = subj.get(k, 0) + 1
            if r.get("format") == "fill":
                fill[k] = fill.get(k, 0) + 1
            if r.get("lang") == "en" and d["exam"] == "satit" and k in ("math", "sci"):     # maths/science asked in English
                en[k] = en.get(k, 0) + 1
        if subj != M1_MIX[d["exam"]]:
            bad.append(f"{path}: subject mix must be {M1_MIX[d['exam']]} (now {subj})")
        if fill != M1_FILL[d["exam"]]:
            bad.append(f"{path}: written-answer (fill) questions must be {M1_FILL[d['exam']]} (now {fill})")
        parts = {}
        for r in d["items"]:
            parts[r.get("part")] = parts.get(r.get("part"), 0) + 1
        if d["exam"] in PART_MIX and parts != PART_MIX[d["exam"]]:
            bad.append(f"{path}: parts must be {PART_MIX[d['exam']]} (now {parts})")
        order = [r.get("part") for r in d["items"]]
        if d["exam"] in PART_MIX and order != sorted(order, key=lambda k: list(PART_MIX[d["exam"]]).index(k) if k in PART_MIX[d["exam"]] else 99):
            bad.append(f"{path}: keep the parts in this order: {' · '.join(PART_MIX[d['exam']])}")
        for n, r in enumerate(d["items"], 1):
            if r.get("part") == "error" and len(re.findall(r"\[\[[^\]]+\]\]", r.get("stem", ""))) != 4:
                bad.append(f"{path} item {n}: error identification needs exactly four [[underlined]] parts in the stem")
            if r.get("part") == "error" and [x for x in re.findall(r"\[\[([^\]]+)\]\]", r.get("stem", ""))] != list(r.get("choices") or []):
                bad.append(f"{path} item {n}: error identification choices must be the four [[underlined]] parts, in order")
        if d["exam"] in M1_EN and en != M1_EN[d["exam"]]:
            bad.append(f"{path}: English-language questions must be {M1_EN[d['exam']]} (now {en})")
        ans = [r.get("answer") for r in d["items"] if r.get("format") != "fill"]
        if ans and max(ans.count(k) for k in range(4)) > len(ans) * 0.32:
            bad.append(f"{path}: spread the correct answers across all four positions")
    return bad


if __name__ == "__main__":
    files = sys.argv[1:] or sorted(glob.glob(os.path.join(os.path.dirname(__file__), "..", "server", "exam_sets", "*.json")))
    allbad = [b for f in files for b in check(f)]
    print("\n".join(allbad) or f"OK — {len(files)} file(s)")
    sys.exit(1 if allbad else 0)
