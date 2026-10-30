"""Load the ready-made practice sets in server/exam_sets/*.json into the item bank and question sets.

Each file becomes approved bank items (tagged "ready-made") plus one published question set — two for
IELTS (Reading: 3 passages / 60 min, Writing: Task 1 + Task 2 / 60 min). Ids are derived from the file
name and position, so loading again adds only what is missing and never overwrites a teacher's edits.
"""

import glob
import hashlib
import json
import os

import exams
import qsets

DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "exam_sets")
EXAMS = {"sat": "SAT Reading and Writing", "ielts": "IELTS Academic", "gate": "Suankularb M.1 GATE Program", "ep": "Suankularb M.1 English Program (EPLUS+)", "satit": "Satit Prasarnmit M.1 (Trilingual Plus+)"}


def _id(prefix, *parts):
    return prefix + hashlib.sha1("|".join(str(p) for p in parts).encode()).hexdigest()[:14]


def files():
    out = []
    for path in sorted(glob.glob(os.path.join(DIR, "*.json"))):
        try:
            with open(path, encoding="utf-8") as f:
                d = json.load(f)
        except (OSError, ValueError):
            continue
        if d.get("exam") in EXAMS and isinstance(d.get("items"), list):
            d["_file"] = os.path.basename(path)
            out.append(d)
    out.sort(key=lambda d: (list(EXAMS).index(d["exam"]), int(d.get("set") or 0)))
    return out


def catalogue():
    """What is available to load (for the bank page)."""
    return [{"file": d["_file"], "exam": d["exam"], "set": d.get("set"), "title": d.get("title"), "items": len(d["items"])} for d in files()]


def load(con, me, only=None):
    added_items = added_sets = 0
    problems = []
    for d in files():
        if only is not None and d["_file"] not in only:
            continue
        ids = {}
        for n, raw in enumerate(d["items"]):
            iid = _id("x", d["_file"], n)
            ids.setdefault(raw.get("kind"), []).append(iid)
            if exams.get_item(con, iid):
                continue
            tags = ["ready-made", d["exam"], f"set-{d.get('set')}"]
            it, probs = exams.clean_item(dict(raw, id=iid, status="approved", origin="original", rightsOk=True, tags=tags))
            if probs:
                problems.append(f"{d['_file']} #{n + 1}: {'; '.join(probs)}")
            exams.save_item(con, it, me["id"])
            added_items += 1
        title, note = d.get("title") or {}, d.get("note") or {}
        parts = [("ielts-r", " — Reading", " — Reading", 60), ("ielts-w", " — Writing", " — Writing", 60)] if d["exam"] == "ielts" else [(k, "", "", d.get("minutes")) for k in ids]
        for kind, sfx_en, sfx_th, minutes in parts:
            if not ids.get(kind):
                continue
            sid = _id("q", d["_file"], kind)
            if qsets.get(con, sid):
                continue
            body = {"kind": kind, "title": (title.get("en") or d["_file"]) + sfx_en, "titleTh": (title.get("th") or "") + sfx_th,
                    "note": note.get("en", ""), "itemIds": ids[kind], "published": True, "minutes": minutes, "exam": d["exam"], "source": "ready-made"}
            s = {"id": sid, "owner": me["id"], "ownerName": me.get("name", ""), "createdAt": exams.iso(), "seed": int(hashlib.sha1(sid.encode()).hexdigest()[:12], 16), "variant": 1}
            approved = {i["id"]: i for i in exams.items(con, kind, "approved")}
            chosen = [approved[i] for i in ids[kind] if i in approved]
            if not chosen:
                continue
            s.update({k: body[k] for k in ("kind", "title", "titleTh", "note", "published", "minutes", "exam", "source")})
            s["items"] = [[i["id"], i["version"]] for i in (sorted(chosen, key=lambda t: t["task"]) if kind == "ielts-w" else chosen)]
            qsets.put(con, s)
            added_sets += 1
    return {"items": added_items, "sets": added_sets, "problems": problems[:30]}
