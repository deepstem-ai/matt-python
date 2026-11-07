"""Five example learners (with parents, two example teachers, enrolments, payments and a timetable).

Added once, on the first start of a new or upgraded server, so the whole flow can be seen right away:
enrol → pay → regular days & times → lessons placed in the calendar → schedule PDF. Every record carries
`"example": true` and shows an amber "Example data" tag. Like all data it is never deleted — it can be
archived from the back office like any other record.
"""

from datetime import date, datetime, timedelta, timezone

MARK = {"example": True}
TEACHERS = [
    ("tex1", "Alisa Example (ครูอลิสา)", "Kru Alisa", "English · IELTS · A-Level"),
    ("tex2", "Pakin Example (อ.ภาคิน)", "Ajarn Pakin", "SAT · Academic English"),
]
# id, name, nick, grade, school, parent (id, name, nick, phone), course, hours, rate, discount, teacher,
# start (days from today), mode, location, weekly pattern [(js weekday 0=Sun, start, end)], payments [(days, amount, method, note)], goal
LEARNERS = [
    ("sex1", "Pimchanok Jaidee (ตัวอย่าง)", "Pim", "M.6", "Example Wittaya School",
     ("pex1", "Wanida Jaidee (ตัวอย่าง)", "Mae Wan", "08x-xxx-0001"),
     "IEL200", 40, 900, 2000, "tex1", -21, "hybrid", "Room A", [(2, "17:00", "19:00"), (4, "17:00", "19:00")],
     [(-21, 34000, "transfer", "Paid in full")], "IELTS Academic band 7.0 for an international programme (TCAS round 1)"),
    ("sex2", "Thanakorn Thodlong (ตัวอย่าง)", "Ton", "P.6", "Example Primary School",
     ("pex2", "Somchai Thodlong (ตัวอย่าง)", "Khun Somchai", "08x-xxx-0002"),
     "ENG130", 24, 800, 0, "tex1", -14, "onsite", "Room B", [(6, "09:00", "12:00")],
     [(-14, 9600, "promptpay", "Deposit 50%")], "Suankularb M.1 GATE / EPLUS+ English entrance test"),
    ("sex3", "Nicha Samutsakhon (ตัวอย่าง)", "Nicha", "M.5", "Example International School",
     ("pex3", "Prapa Samutsakhon (ตัวอย่าง)", "Khun Prapa", "08x-xxx-0003"),
     "SAT220", 36, 1000, 0, "tex2", 3, "online", "Zoom", [(1, "18:00", "19:30"), (3, "18:00", "19:30"), (6, "13:00", "16:00")],
     [], "Digital SAT Reading & Writing 700+"),
    ("sex4", "Phum Rakrian (ตัวอย่าง)", "Phum", "M.3", "Example Secondary School",
     ("pex4", "Kannika Rakrian (ตัวอย่าง)", "Mae Kan", "08x-xxx-0004"),
     "ENG130", 30, 800, 0, "tex1", -42, "hybrid", "Room A", [(0, "13:00", "16:00")],
     [(-42, 24000, "promptpay", "Paid in full")], "Triam Udom Suksa M.4 English entrance test"),
    ("sex5", "Baitoey Kengmak (ตัวอย่าง)", "Toey", "M.6", "Example Wittaya School",
     ("pex5", "Anan Kengmak (ตัวอย่าง)", "Khun Anan", "08x-xxx-0005"),
     "ENG230", 40, 850, 1000, "tex2", -10, "online", "Zoom", [(5, "17:00", "19:00"), (6, "14:00", "16:00")],
     [(-10, 16500, "transfer", "1st instalment"), (20, 16500, "transfer", "2nd instalment")], "A-Level English 80+ for medicine / engineering"),
]
TOPICS = ["Diagnostic test & study plan", "Reading: skimming and scanning", "Vocabulary in context", "Grammar: tenses review",
          "Error identification practice", "Cloze passages", "Conversation & functions", "Timed mock test + review",
          "Academic reading: inference", "Writing: paragraph organisation", "Text completion drill", "Full mock test review"]


def _uid(prefix, n):
    return f"{prefix}ex{n:04d}"


def lessons(enr, pattern, first, hours):
    """Same rule as the back office (A.generateLessons): fill the purchased hours with the weekly slots."""
    out, need, d, guard = [], round(hours, 2), first, 0
    while need > 0.001 and guard < 800:
        guard += 1
        js_day = (d.weekday() + 1) % 7
        for day, start, end in sorted((p for p in pattern if p[0] == js_day), key=lambda p: p[1]):
            if need <= 0.001:
                break
            sh, sm = map(int, start.split(":")); eh, em = map(int, end.split(":"))
            h = min(((eh * 60 + em) - (sh * 60 + sm)) / 60, need)
            out.append({"date": d.isoformat(), "start": start, "hours": round(h, 2)})
            need = round(need - h, 2)
        d += timedelta(days=1)
    return out


def build(today=None):
    today = today or date.today()
    stamp = datetime.now(timezone.utc).isoformat(timespec="seconds")
    users, enrs, sess, pays = [], [], [], []
    for tid, name, nick, subj in TEACHERS:
        users.append(dict(MARK, id=tid, role="teacher", name=name, nick=nick, active=True, notes="Example teacher · " + subj, createdAt=stamp))
    n_s = n_p = 0
    for i, (sid, name, nick, grade, school, parent, code, hours, rate, disc, tid, start, mode, loc, pattern, payments, goal) in enumerate(LEARNERS):
        pid, pname, pnick, phone = parent
        users.append(dict(MARK, id=pid, role="parent", name=pname, nick=pnick, phone=phone, active=True, createdAt=stamp))
        users.append(dict(MARK, id=sid, role="student", name=name, nick=nick, grade=grade, school=school, guardianId=pid, active=True,
                          consentDate=(today + timedelta(days=start - 2)).isoformat(), createdAt=stamp))
        start_day = today + timedelta(days=start)
        eid = "eex" + str(i + 1)
        enrs.append(dict(MARK, id=eid, studentId=sid, courseCode=code, teacherId=tid, mode=mode, location=loc, hours=hours, rate=rate, discount=disc,
                         fee=hours * rate - disc, start=start_day.isoformat(), status="active", goal=goal, createdAt=stamp,
                         pattern=[{"day": d, "start": a, "end": b, "location": loc} for d, a, b in pattern]))
        for k, x in enumerate(lessons(enrs[-1], pattern, start_day + timedelta(days=1), hours)):
            n_s += 1
            past = x["date"] < today.isoformat()
            s = dict(MARK, id=_uid("s", n_s), enrolmentId=eid, date=x["date"], start=x["start"], hours=x["hours"], mode=mode, location=loc, teacherId=tid,
                     status="done" if past else "scheduled", createdAt=stamp)
            if past:
                s["topic"] = TOPICS[k % len(TOPICS)]
                s["notes"] = "Good progress; homework set." if k % 2 else "Reviewed last week's homework."
            sess.append(s)
        for days, amount, method, note in payments:
            if days > 0:
                continue                                    # a later instalment is still due (shown as balance)
            n_p += 1
            pays.append(dict(MARK, id=_uid("p", n_p), enrolmentId=eid, date=(today + timedelta(days=days)).isoformat(), amount=amount, method=method,
                             ref=f"RC-EX-{n_p:03d}", note=note, createdAt=stamp))
    # one learner missed a lesson, one past lesson was moved
    done4 = [s for s in sess if s["enrolmentId"] == "eex4" and s["status"] == "done"]
    if len(done4) > 2:
        done4[2].update(status="noshow", topic="", notes="Absent — no notice")
    nxt = today + timedelta(days=(7 - today.weekday()) % 7 or 7)            # next Monday
    req = dict(MARK, id="rex1", enrolmentId="eex1", type="pause", status="pending", createdAt=stamp, note="School trip / ทัศนศึกษากับโรงเรียน")
    req.update({"from": nxt.isoformat(), "to": (nxt + timedelta(days=6)).isoformat()})
    return {"users": users, "enrolments": enrs, "sessions": sess, "payments": pays, "requests": [req]}


def seed(con, put_rec, get_kv, set_kv, now_iso, force=False):
    """Add the example data once. Records that already exist (even edited or archived ones) are left alone."""
    if get_kv(con, "exampleSeed", None) and not force:
        return 0
    have = {(r["col"], r["id"]) for r in con.execute("SELECT col, id FROM records")}
    n = 0
    for col, recs in build().items():
        for rec in recs:
            if (col, rec["id"]) not in have:
                put_rec(con, col, rec, "example-data")
                n += 1
    set_kv(con, "exampleSeed", {"at": now_iso(), "records": n})
    return n
