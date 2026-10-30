"""Check practice-set files in server/exam_sets/*.json against the exam bank's format rules.

    python3 tools/check_sets.py                 # every file
    python3 tools/check_sets.py server/exam_sets/sat-1.json

Each file: {"exam": "sat"|"ielts"|"gate"|"ep", "set": 1, "title": {"en","th"}, "minutes": 32, "items": [...]}.
Prints every problem; exit code 1 if any.
"""
import glob
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "server"))
import exams  # noqa: E402

EXPECT = {"sat": {"sat": 54}, "gate": {"m1": 120}, "ep": {"m1": 130}, "satit": {"m1": 185}, "ielts": {"ielts-r": 3, "ielts-w": 2}}
# full-length practice formats (see server/exam_sets/README.md)
M1_MIX = {"gate": {"math": 40, "sci": 40, "eng": 20, "thai": 20},
          "ep": {"eng": 50, "math": 40, "sci": 40},
          "satit": {"math": 25, "sci": 50, "thai": 60, "eng": 50}}
M1_FILL = {"gate": {"math": 10, "sci": 5}, "ep": {"math": 10, "sci": 5}, "satit": {}}
M1_EN = {"satit": {"math": 5, "sci": 10}}


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
            if r.get("lang") == "en" and d["exam"] == "satit":
                en[k] = en.get(k, 0) + 1
        if subj != M1_MIX[d["exam"]]:
            bad.append(f"{path}: subject mix must be {M1_MIX[d['exam']]} (now {subj})")
        if fill != M1_FILL[d["exam"]]:
            bad.append(f"{path}: written-answer (fill) questions must be {M1_FILL[d['exam']]} (now {fill})")
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
