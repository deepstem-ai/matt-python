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

EXPECT = {"sat": {"sat": 27}, "gate": {"m1": 40}, "ep": {"m1": 40}, "ielts": {"ielts-r": 3, "ielts-w": 2}}


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
        if d["exam"] in ("gate", "ep") and it["kind"] == "m1" and it["program"] != d["exam"]:
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
        doms = {}
        for r in d["items"]:
            doms[r.get("domain")] = doms.get(r.get("domain"), 0) + 1
        if doms != {"cs": 7, "ii": 7, "sec": 7, "eoi": 6}:
            bad.append(f"{path}: SAT module mix must be cs 7, ii 7, sec 7, eoi 6 (now {doms})")
    if d["exam"] in ("gate", "ep"):
        subj = {}
        for r in d["items"]:
            subj[r.get("subject")] = subj.get(r.get("subject"), 0) + 1
        want = {"gate": {"math": 15, "sci": 15, "eng": 5, "thai": 5}, "ep": {"eng": 20, "math": 10, "sci": 10}}[d["exam"]]
        if subj != want:
            bad.append(f"{path}: subject mix must be {want} (now {subj})")
        ans = [r.get("answer") for r in d["items"]]
        if any(ans.count(k) > 16 for k in range(4)):
            bad.append(f"{path}: spread the correct answers across all four positions")
    return bad


if __name__ == "__main__":
    files = sys.argv[1:] or sorted(glob.glob(os.path.join(os.path.dirname(__file__), "..", "server", "exam_sets", "*.json")))
    allbad = [b for f in files for b in check(f)]
    print("\n".join(allbad) or f"OK — {len(files)} file(s)")
    sys.exit(1 if allbad else 0)
