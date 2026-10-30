"""API routes for the AI news blog and the SAT / IELTS exam module (wired into app.api()).

Kept apart from app.py so that file stays about accounts, lessons and payments. Everything here
uses the same database connection, lock, sign-in and audit log as the rest of the server.
AI work runs in a background thread: the request returns at once and the page polls for the result.
"""

import json
import os
import threading
import traceback
import sys
from datetime import datetime, timedelta, timezone
from urllib.parse import parse_qs

import ai
import blog
import blog_seed
import calibrate
import exams
import exam_samples
import access
import exports
import images
import live
import qsets
import ready_sets

STALE = timedelta(minutes=15)
H = {}          # filled by app.py: db, lock, audit, load_col, get_rec, now_iso


def setup(**helpers):
    H.update(helpers)


def init(con):
    ai.init(con)
    blog.init(con)
    exams.init(con)
    live.init(con)
    qsets.init(con)
    exports.init(con)
    import history
    history.init(con)                                # keep-forever triggers before anything is replaced
    if os.environ.get("DD_SEED", "1") != "0":       # DD_SEED=0: start empty (no ready-made sets or starter news)
        autoload_sets(con)
        blog_seed.seed(con)
        start_photo_thread()


def start_photo_thread():
    """Swap the drawn covers of the starter news for free-licence photos (Openverse: CC0, public domain,
    CC BY / BY-SA with the credit shown under the picture). Runs in the background on the computer that
    hosts the site; when there is no internet the drawn covers simply stay."""
    if os.environ.get("DD_SEED_PHOTOS", "1") == "0" or not H.get("db"):
        return

    def work():
        import time
        time.sleep(3)
        try:
            with H["lock"], H["db"]() as c:
                jobs = blog_seed.photo_jobs(c)
        except Exception:  # noqa: BLE001
            return
        for pid, query in jobs:
            got = None
            try:
                for item in images.search_photos(query, n=10)[:6]:
                    if item.get("license") in ("CC0", "PDM") or item.get("creator"):
                        try:
                            got = (images.fetch_photo(item), images.credit(item)); break
                        except images.ImageError:
                            continue
            except images.ImageError:
                pass
            with H["lock"], H["db"]() as c:
                p = blog.get(c, pid)
                if not p or p.get("coverKind") not in ("drawing", ""):
                    continue
                p["photoTried"] = blog_seed.datetime_today()
                if got:
                    p["cover"], p["coverCredit"], p["coverKind"] = got[0], got[1], "photo"
                    p["seedHash"] = blog_seed._hash(p)
                blog.put(c, p)
    threading.Thread(target=work, daemon=True).start()


def autoload_sets(con):
    """Ready-made practice sets (server/exam_sets): each file is added once per version. A file that changed
    replaces its previous version; a file that was removed is taken out of use; a set deleted by staff stays
    deleted until its file changes."""
    r = con.execute("SELECT value FROM kv WHERE key='readySets'").fetchone()
    done = json.loads(r["value"]) if r else {}
    if isinstance(done, list):                       # v5.7 kept only file names
        done = {f: None for f in done}
    cat = {f["file"]: f["rev"] for f in ready_sets.catalogue()}
    new = {f for f, rev in cat.items() if done.get(f) != rev}
    gone = [f for f in done if f not in cat]
    for f in gone:
        ready_sets.retire(con, f)
    if new:
        ready_sets.load(con, {"id": "system", "name": "DeepDistrict"}, only=new)
    if new or gone:
        con.execute("INSERT INTO kv (key, value) VALUES ('readySets', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", (json.dumps(cat),))


# ---------------------------------------------------------------- background AI jobs
def run_ai(con, kind, ref, uid, note, call, done):
    """Open an AI job (checks limits; raises ai.AIError), run call(cfg) in a thread without the lock,
    then done(con, result, error) under the lock. Returns the job id."""
    jid, cfg = ai.start_job(con, kind, ref, uid, note)

    def work():
        res, err = None, None
        try:
            res = call(cfg)
        except Exception as e:  # noqa: BLE001 — every failure is recorded on the job
            err = e
            if not isinstance(e, (ai.AIError, images.ImageError, ValueError)):
                traceback.print_exc(file=sys.stderr)
        with H["lock"], H["db"]() as c2:
            try:
                done(c2, res, err)
            except Exception as e2:  # noqa: BLE001
                traceback.print_exc(file=sys.stderr)
                err = err or e2
            ai.finish_job(c2, jid, cfg, (res or {}).get("usage") if isinstance(res, dict) else None, err)
    t = threading.Thread(target=work, daemon=True)
    t.start()
    return jid


def _add(u, v):
    for k in ("input_tokens", "output_tokens", "searches"):
        u[k] = u.get(k, 0) + (v or {}).get(k, 0)
    return u


def cleanup_stale(con):
    cut = (datetime.now(timezone.utc) - STALE).isoformat(timespec="seconds")
    con.execute("UPDATE ai_jobs SET status='failed', error='interrupted (server restarted?)' WHERE status='running' AND at < ?", (cut,))
    for p in blog.all_posts(con):
        if p["status"] == "drafting" and (p.get("updatedAt") or "") < cut:
            p["status"] = "idea"; p["ai"]["error"] = "the AI job was interrupted — try again"
            blog.put(con, p)


# ---------------------------------------------------------------- blog: AI writer
def generate(con, uid, cat, topic="", scope="", auto=False, pid=None):
    bcfg = blog.settings(con)
    p = blog.get(con, pid) if pid else None
    if p and p["status"] == "drafting":
        raise ValueError("the AI is already writing this post")
    p = p or blog.new_post(con, bcfg, cat, uid, topic, scope)
    if pid and (topic or scope):
        p["ai"].update({"topic": str(topic)[:300], "scope": str(scope)[:1000]})
    topic, scope = p["ai"].get("topic", ""), p["ai"].get("scope", "")
    branch, cat = p["branch"], p["category"]
    recent = [x["title"]["en"] or x["title"]["th"] for x in blog.all_posts(con) if x["category"] == cat and x["title"]["en"]][:15]
    system, prompt = blog.write_system(bcfg, branch), blog.write_prompt(bcfg, cat, topic, scope, recent)
    domains, mode = bcfg["allow"].get(branch) or [], bcfg["image"]
    p["status"] = "drafting"; p["ai"].pop("error", None)
    blog.log(p, uid or "auto", "AI writing started" + (" (automatic)" if auto else ""))
    blog.put(con, p)

    def call(cfg):
        r = ai.ask(cfg, system, prompt, web_domains=domains, max_searches=6)
        if not isinstance(r.get("data"), dict):
            raise ai.AIError("the AI answer had no article data")
        usage, data, cover, notes = dict(r["usage"]), r["data"], None, []
        title = (data.get("title") or {}).get("en") or (data.get("title") or {}).get("th") or topic
        summary = (data.get("summary") or {}).get("en") or ""
        if mode in ("photo-then-draw", "photo"):
            try:
                for item in images.search_photos(data.get("imageQuery") or title, 8)[:4]:
                    try:
                        cover = {"src": images.fetch_photo(item), "kind": "photo", "credit": images.credit(item)}
                        break
                    except images.ImageError:
                        continue
            except images.ImageError as e:
                notes.append(str(e))
        if not cover and mode in ("photo-then-draw", "draw"):
            try:
                d = ai.ask(cfg, images.DRAW_SYSTEM, images.draw_prompt(title, summary, branch), schema=images.DRAW_SCHEMA)
                _add(usage, d["usage"])
                cover = {"src": images.svg_data_url(images.clean_svg(d["data"].get("svg"))), "kind": "drawing", "credit": None}
            except (ai.AIError, images.ImageError) as e:
                notes.append("drawing: " + str(e))
        return {"usage": usage, "data": data, "sources": r["sources"], "cover": cover, "notes": notes}

    def done(c2, res, err):
        q = blog.get(c2, p["id"])
        if not q:
            return
        if err or not res:
            q["status"] = "idea"; q["ai"]["error"] = str(err or "no answer")[:300]
            blog.log(q, "system", "AI writing failed: " + q["ai"]["error"]); blog.put(c2, q)
            return
        try:
            blog.apply_ai(q, res["data"], res["sources"], bcfg)
        except ValueError as e:
            q["status"] = "idea"; q["ai"]["error"] = str(e); blog.put(c2, q)
            return
        q["slug"] = blog.unique_slug(c2, q.pop("_wantSlug", "") or q["title"]["en"] or q["slug"], q["id"])
        if res.get("cover"):
            q["cover"], q["coverKind"], q["coverCredit"] = res["cover"]["src"], res["cover"]["kind"], res["cover"]["credit"]
        q["ai"]["notes"] = res.get("notes") or []
        q["status"] = "review"
        blog.log(q, "system", f"AI draft ready ({len(q['sources'])} verified sources)")
        if auto and cat in (bcfg["auto"].get("publish") or []) and not blog.problems(q, bcfg):
            blog.set_status(q, "published", bcfg, "auto")
        blog.put(c2, q)
        H["audit"](c2, None, f"Blog: AI draft '{q['title']['en'] or q['title']['th']}' → {q['status']}")

    run_ai(con, "blog", p["id"], uid, topic or ("auto: " + cat), call, done)
    return p


def draw_cover(con, uid, pid):
    p = blog.get(con, pid)
    if not p:
        raise ValueError("post not found")
    title, summary, branch = p["title"]["en"] or p["title"]["th"], p["summary"]["en"] or p["summary"]["th"], p["branch"]

    def call(cfg):
        d = ai.ask(cfg, images.DRAW_SYSTEM, images.draw_prompt(title, summary, branch), schema=images.DRAW_SCHEMA)
        return {"usage": d["usage"], "src": images.svg_data_url(images.clean_svg(d["data"].get("svg")))}

    def done(c2, res, err):
        q = blog.get(c2, pid)
        if q and res and not err:
            q["cover"], q["coverKind"], q["coverCredit"] = res["src"], "drawing", None
            blog.log(q, "system", "AI drew a new cover"); blog.put(c2, q)
        elif q:
            q["ai"]["error"] = "drawing failed: " + str(err)[:200]; blog.put(c2, q)

    return run_ai(con, "blog-draw", pid, uid, "cover drawing", call, done)


def _due(con, sched, kv_key):
    """True once per scheduled day, from the scheduled hour (Bangkok time)."""
    if not sched.get("enabled"):
        return False
    now = datetime.now(blog.TZ)
    if sched.get("days") and (now.weekday() + 1) % 7 not in sched["days"]:
        return False
    if now.hour < int(sched.get("hour") or 0):
        return False
    r = con.execute("SELECT value FROM kv WHERE key=?", (kv_key,)).fetchone()
    if r and json.loads(r["value"]) == now.strftime("%Y-%m-%d"):
        return False
    con.execute("INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", (kv_key, json.dumps(now.strftime("%Y-%m-%d"))))
    return True


def exam_auto(con):
    """Scheduled item drafting: AI writes new items in the official formats; they wait as drafts for a teacher."""
    a = exams.settings(con)["autoDraft"]
    if not _due(con, a, "exam_auto_last"):
        return 0
    jobs = []
    if a.get("sat"):
        jobs += [{"kind": "sat", "domain": d, "count": a["sat"], "topic": a.get("topics", "")} for d in exams.SAT_ORDER]
    r = con.execute("SELECT value FROM kv WHERE key='exam_auto_turn'").fetchone()
    turn = json.loads(r["value"]) if r else 0
    jobs += [{"kind": "ielts-r", "difficulty": (turn + i) % 3 + 1, "topic": a.get("topics", "")} for i in range(a.get("reading") or 0)]
    jobs += [{"kind": "ielts-w", "task": (turn + i) % 2 + 1, "topic": a.get("topics", "")} for i in range(a.get("writing") or 0)]
    con.execute("INSERT INTO kv (key, value) VALUES ('exam_auto_turn', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", (json.dumps(turn + 1),))
    n = 0
    for j in jobs:
        try:
            draft_items(con, None, j); n += 1
        except (ai.AIError, ValueError) as e:
            H["audit"](con, None, f"Exam bank: scheduled drafting stopped: {e}")
            break
    return n


def tick():
    """Publish scheduled posts, run the automatic blog writer and the scheduled item drafting when due
    (called every 20 s locally and by /api/cron)."""
    try:
        with H["lock"], H["db"]() as con:
            cleanup_stale(con)
            bcfg = blog.settings(con)
            blog.publish_due(con, bcfg)
            exam_auto(con)
            if blog.auto_due(con, bcfg):
                blog.mark_auto_ran(con)
                for cat in blog.next_auto_categories(con, bcfg):
                    try:
                        generate(con, None, cat, auto=True)
                    except (ai.AIError, ValueError) as e:
                        H["audit"](con, None, f"Blog automatic writer skipped ({cat}): {e}")
                        break
    except Exception as e:  # noqa: BLE001 — never stop the server loop
        print("blog tick error", repr(e), file=sys.stderr)


# ---------------------------------------------------------------- exams: helpers
def students_of(con, me):
    if me["role"] == "admin":
        return None                                   # everyone
    users = H["load_col"](con, "users")
    if me["role"] == "teacher":
        ids = {e.get("studentId") for e in H["load_col"](con, "enrolments") if e.get("teacherId") == me["id"]}
        ids |= {u["id"] for u in users if u.get("createdBy") == me["id"] and u.get("role") == "student"}
        return ids
    if me["role"] == "parent":
        return {u["id"] for u in users if u.get("guardianId") == me["id"]}
    return set()


def can_see(con, me, att):
    if att["userId"] == me["id"]:
        return True
    s = students_of(con, me)
    return s is None or att["userId"] in s


def summary(a, names):
    r = a.get("result") or {}
    out = {k: a.get(k) for k in ("id", "kind", "mode", "status", "createdAt", "finishedAt", "preview")}
    out["userId"], out["userName"] = a["userId"], names.get(a["userId"], "")
    out["setTitle"] = a.get("setTitle")
    if a["kind"] == "m1":
        out.update({"correct": r.get("correct"), "total": r.get("total"), "percent": r.get("percent"), "program": next(iter(a["snap"].values()), {}).get("program")})
    elif a["kind"] == "sat":
        out.update({"correct": r.get("correct"), "total": r.get("total"), "estimate": r.get("estimate")})
    elif a["kind"] == "ielts-r":
        out.update({"correct": r.get("correct"), "total": r.get("total"), "band": r.get("band")})
    else:
        t = r.get("teacher") or {}
        out.update({"band": t.get("band"), "aiBand": (r.get("ai") or {}).get("band"), "marked": a["status"] == "marked"})
    return out


def attempts_for(con, me, limit=300):
    names = {u["id"]: u.get("name", "") for u in H["load_col"](con, "users")}
    s = students_of(con, me)
    rows = con.execute("SELECT data FROM exam_attempts ORDER BY started_at DESC LIMIT 2000").fetchall()
    out = []
    for r in rows:
        a = json.loads(r["data"])
        if a["userId"] == me["id"] or s is None or a["userId"] in s:
            out.append(summary(a, names))
        if len(out) >= limit:
            break
    return out


def writing_feedback(con, att, uid):
    """Ask the AI for band suggestions on each Writing task (if AI is ready)."""
    sec = att["sections"][0]
    tasks = [(iid, att["snap"][iid], sec["answers"].get(iid, "")) for iid in sec["items"]]
    att["result"]["aiPending"] = True; att["result"].pop("aiError", None)
    exams.put_attempt(con, att)

    def call(cfg):
        usage, out = {}, {}
        for iid, task, essay in tasks:
            if exams.words(essay) < 20:
                out[iid] = {"skipped": "too short to assess"}
                continue
            r = ai.ask(cfg, exams.FEEDBACK_SYSTEM, exams.feedback_content(task, essay), schema=exams.FEEDBACK_SCHEMA, max_tokens=8000)
            _add(usage, r["usage"])
            fb = r["data"]
            cr = {k: max(0, min(9, int(fb["criteria"][k]["band"]))) for k in exams.CRITERIA}
            out[iid] = {"criteria": {k: {"band": cr[k], "comment": str(fb["criteria"][k]["comment"])[:1200]} for k in exams.CRITERIA},
                        "band": exams.task_band(cr), "strengths": [str(x)[:300] for x in fb.get("strengths", [])][:6],
                        "improvements": [str(x)[:300] for x in fb.get("improvements", [])][:6],
                        "corrections": [{"original": str(c.get("original"))[:300], "better": str(c.get("better"))[:300]} for c in fb.get("corrections", [])][:6],
                        "summaryTh": str(fb.get("summary_th") or "")[:1200]}
        return {"usage": usage, "ai": out}

    def done(c2, res, err):
        a = exams.get_attempt(c2, att["id"])
        if not a:
            return
        a["result"]["aiPending"] = False
        if err or not res:
            a["result"]["aiError"] = str(err or "no answer")[:300]
        else:
            fb = res["ai"]
            bands = {k: v.get("band") for k, v in fb.items() if v.get("band") is not None}
            fb["band"] = exams.writing_band(a, bands)
            a["result"]["ai"] = fb
        exams.put_attempt(c2, a)

    try:
        return run_ai(con, "writing-feedback", att["id"], uid, "IELTS Writing feedback", call, done)
    except ai.AIError as e:
        att["result"]["aiPending"] = False; att["result"]["aiError"] = str(e)
        exams.put_attempt(con, att)
        return None


def draft_items(con, uid, body):
    kind = body.get("kind")
    topic = str(body.get("topic") or "")[:300]
    if kind == "sat":
        dom = body.get("domain") if body.get("domain") in exams.SAT_DOMAINS else "cs"
        skill = body.get("skill") if body.get("skill") in exams.SAT_DOMAINS[dom]["skills"] else ""
        n = max(1, min(10, int(body.get("count") or 5)))
        content, schema, conv = exams.sat_prompt(dom, skill, body.get("difficulty"), n, topic), exams.SAT_SCHEMA, lambda d: exams.from_ai_sat(d, dom)
    elif kind == "ielts-r":
        diff = max(1, min(3, int(body.get("difficulty") or 2)))
        content, schema, conv = exams.reading_prompt(topic, diff), exams.READ_SCHEMA, lambda d: [exams.from_ai_reading(d, diff)]
    elif kind == "ielts-w":
        task = 1 if int(body.get("task") or 2) == 1 else 2
        content, schema, conv = exams.wtask_prompt(task, topic), exams.WTASK_SCHEMA, lambda d: [exams.from_ai_wtask(d, task)]
    else:
        raise ValueError("unknown item type")

    def call(cfg):
        r = ai.ask(cfg, exams.ITEM_SYSTEM, content, schema=schema)
        return {"usage": r["usage"], "items": conv(r["data"])}

    def done(c2, res, err):
        if err or not res:
            H["audit"](c2, None, f"Exam bank: AI draft failed ({kind}): {str(err)[:200]}")
            return
        n = 0
        for raw in res["items"]:
            try:
                it, _ = exams.clean_item(dict(raw, rightsOk=False))
            except (ValueError, TypeError):
                continue
            it["status"] = "draft"; it["origin"] = "ai"
            exams.save_item(c2, it, uid); n += 1
        H["audit"](c2, None, f"Exam bank: AI drafted {n} {kind} item(s) — waiting for review")

    return run_ai(con, "items", kind, uid, f"{kind} {topic}", call, done)


# ---------------------------------------------------------------- routes
def public_routes(con, path, method, environ):
    """Routes that need no sign-in. Returns (status, body, cache) or None."""
    if method != "GET":
        return None
    q = parse_qs(environ.get("QUERY_STRING", ""))
    one = lambda k, d="": (q.get(k) or [d])[0]  # noqa: E731
    if path == "blog":
        bcfg = blog.settings(con)
        if not bcfg["enabled"]:
            return "200 OK", {"items": [], "total": 0, "off": True, "branches": blog.BRANCHES, "categories": bcfg["categories"]}
        try:
            limit, offset = max(1, min(30, int(one("limit", "12")))), max(0, int(one("offset", "0")))
        except ValueError:
            limit, offset = 12, 0
        return "200 OK", blog.public_list(con, bcfg, one("branch")[:10] or None, one("cat")[:20] or None, limit, offset)
    if path == "verify":
        return "200 OK", exports.verify(con, one("c"))
    if path == "blog/post":
        bcfg = blog.settings(con)
        p = blog.public_get(con, bcfg, one("slug")) if bcfg["enabled"] else None
        return ("200 OK", {"post": p, "branches": blog.BRANCHES}) if p else ("404 Not Found", {"error": "post not found"})
    return None


def routes(con, me, path, method, body, environ):
    """Signed-in routes. Returns (status, body) or None when the path is not ours."""
    q = parse_qs(environ.get("QUERY_STRING", ""))
    one = lambda k, d="": (q.get(k) or [d])[0]  # noqa: E731
    role, staff, admin = me["role"], me["role"] in ("admin", "teacher"), me["role"] == "admin"
    ecfg = exams.settings(con)
    acfg = access.settings(con)
    pg = access.page_of(path)
    if pg and not access.allowed(acfg, role, pg):
        return "403 Forbidden", {"error": "your account level does not have access to this page — ask an admin", "page": pg}
    if path == "access" and method == "POST":
        if not admin:
            return "403 Forbidden", {"error": "admins only"}
        out = access.save(con, body)
        H["audit"](con, me, "Updated menu & permissions")
        return "200 OK", access.matrix(out)
    try:
        # ---------- exams: everyone signed in
        if path == "exam/home" and method == "GET":
            rd = exams.readiness(con)
            pub = [qsets.summary(con, x) for x in qsets.published(con)]
            for x in pub:
                x.pop("items", None)
            return "200 OK", {"settings": ecfg, "ready": rd, "attempts": attempts_for(con, me), "role": role, "sets": pub,
                              "m1": {"programs": exams.M1_PROGRAMS, "subjects": exams.M1_SUBJECTS},
                              "domains": {k: {"en": v["en"], "th": v["th"]} for k, v in exams.SAT_DOMAINS.items()},
                              "aiReady": ai.status(con)["ready"]}
        if path == "exam/start" and method == "POST":
            if role == "parent":
                return "403 Forbidden", {"error": "tests are taken from the student's own account"}
            if role == "student" and not ecfg["studentsCanStart"]:
                return "403 Forbidden", {"error": "online tests are closed at the moment — ask your teacher"}
            a = exams.start(con, me, body, ecfg)
            H["audit"](con, me, f"Started {a['kind']} {a['mode']} test {a['id']}")
            return "200 OK", {"id": a["id"]}
        if path == "exam/tag" and method == "POST":
            a = exams.get_attempt(con, body.get("id"))
            if not a or a["userId"] != me["id"]:
                return "404 Not Found", {"error": "test not found"}
            exams.tag_error(a, str(body.get("item") or ""), body.get("cause"))
            exams.put_attempt(con, a)
            return "200 OK", {"ok": True, "tags": a["tags"]}
        if path.startswith("exam/") and path in ("exam/attempt", "exam/answer", "exam/submit"):
            aid = one("id") if method == "GET" else body.get("id")
            a = exams.get_attempt(con, aid)
            if not a or not can_see(con, me, a):
                return "404 Not Found", {"error": "test not found"}
            own = a["userId"] == me["id"]
            if path == "exam/attempt":
                if exams.tick(con, a, ecfg) and a["kind"] == "ielts-w" and a["status"] == "submitted":
                    writing_feedback(con, a, me["id"])
                return "200 OK", exams.view(a, ecfg, staff=staff and not own)
            if not own:
                return "403 Forbidden", {"error": "only the person taking the test can answer"}
            if path == "exam/answer":
                exams.save_answers(con, a, body, ecfg)
                return "200 OK", {"ok": True, "serverNow": exams.iso(), "deadline": a["sections"][a["current"]]["deadline"]}
            if a["status"] != "active":
                return "400 Bad Request", {"error": "this test is already finished"}
            if body.get("answers"):
                exams.save_answers(con, a, body, ecfg)
            exams.submit_section(con, a, ecfg)
            if a["status"] != "active":
                H["audit"](con, me, f"Finished {a['kind']} {a['mode']} test {a['id']}")
                if a["kind"] == "ielts-w":
                    writing_feedback(con, a, me["id"])
            return "200 OK", exams.view(a, ecfg)

        # ---------- live class: students join and answer; staff host
        if path == "live/join" and method == "POST":
            if role == "parent":
                return "403 Forbidden", {"error": "learners join from their own account"}
            s = live.by_code(con, body.get("code"))
            if not s:
                return "404 Not Found", {"error": "no live class with this code is running"}
            live.join(con, s, me)
            return "200 OK", {"id": s["id"]}
        if path in ("live/state", "live/answer"):
            s = live.get(con, one("id") if method == "GET" else body.get("id"))
            if not s or (me["id"] not in s["participants"] and not staff):
                return "404 Not Found", {"error": "live class not found"}
            if path == "live/state":
                live.touch(con, s)
                if one("pv") and str(s.get("pv", 0)) == one("pv"):     # nothing the learner needs has changed
                    return "200 OK", {"same": True, "serverNow": exams.iso()}
                return "200 OK", live.student_view(s, me["id"])
            live.answer(con, s, me, body.get("value"), body.get("key"))
            return "200 OK", {"ok": True}
        # ---------- documents: score reports for learners, parents and staff
        if path == "doc/report" and method == "POST":
            a = exams.get_attempt(con, body.get("attemptId"))
            if not a or not can_see(con, me, a) or a["status"] == "active":
                return "404 Not Found", {"error": "finished test not found"}
            names = {u["id"]: u.get("name", "") for u in H["load_col"](con, "users")}
            p = exports.create_report(con, me, a, names)
            H["audit"](con, me, f"Created score report {p['code']} for test {a['id']}")
            return "200 OK", p
        if path == "doc/set-paper" and method == "POST":
            if role == "parent":
                return "403 Forbidden", {"error": "papers are downloaded from the student's own account"}
            p = exports.create_paper(con, me, {"setId": body.get("setId")}, learner=not staff)
            H["audit"](con, me, f"Created paper {p['code']} from set {body.get('setId')}")
            return "200 OK", p
        if path == "doc/get" and method == "GET":
            d = exports.get(con, one("code"))
            if not d or not (staff or d["created_by"] == me["id"]):
                return "404 Not Found", {"error": "document not found"}
            if d["revoked"]:
                return "410 Gone", {"error": "this document was revoked"}
            return "200 OK", exports.payload(con, d["code"], me)
        if path == "doc/log" and method == "POST":
            d = exports.get(con, body.get("code"))
            if not d or not (staff or d["created_by"] == me["id"]):
                return "404 Not Found", {"error": "document not found"}
            exports.log(con, d["code"], me, "print" if body.get("action") == "print" else "download")
            return "200 OK", {"ok": True}

        # ---------- exams: staff
        if path.startswith(("exam/", "live/", "doc/", "qset/")) and not staff:
            return "403 Forbidden", {"error": "staff only"}
        if path == "exam/bank" and method == "GET":
            kind = one("kind")
            lst = exams.items(con, kind if kind in exams.KINDS else None)
            out = []
            for it in lst:
                _, probs = exams.clean_item(it, it)
                lite = {k: v for k, v in it.items() if k not in ("paragraphs", "image")}
                if it["kind"] == "ielts-r":
                    lite["groups"] = [{"type": g["type"], "n": len(g["questions"])} for g in it["groups"]]
                lite["problems"] = probs
                out.append(lite)
            return "200 OK", {"items": out, "ready": exams.readiness(con), "domains": exams.SAT_DOMAINS, "types": exams.IELTS_TYPES, "settings": ecfg,
                              "criteria": exams.CRITERIA, "ai": ai.status(con)["ready"]}
        if path == "exam/item" and method == "GET":
            it = exams.get_item(con, one("id"))
            if not it:
                return "404 Not Found", {"error": "not found"}
            vers = [dict(r) for r in con.execute("SELECT version, at, by FROM exam_item_versions WHERE id=? ORDER BY version DESC", (it["id"],))]
            return "200 OK", {"item": it, "problems": exams.clean_item(it, it)[1], "versions": vers}
        if path == "exam/bank" and method == "POST":
            if isinstance(body.get("save"), dict):
                old = exams.get_item(con, body["save"].get("id")) if body["save"].get("id") else None
                it, probs = exams.clean_item(body["save"], old)
                if body["save"].get("status") == "approved" and probs:
                    return "400 Bad Request", {"error": "cannot approve yet: " + "; ".join(probs), "problems": probs}
                exams.save_item(con, it, me["id"])
                H["audit"](con, me, f"Exam bank: saved {it['kind']} item {it['id']} v{it['version']} ({it['status']})")
                return "200 OK", {"ok": True, "id": it["id"], "problems": probs, "status": it["status"]}
            if isinstance(body.get("status"), dict):
                it = exams.get_item(con, body["status"].get("id"))
                to = body["status"].get("to")
                if not it or to not in exams.STATUSES:
                    return "400 Bad Request", {"error": "bad request"}
                if to == "approved":
                    probs = exams.clean_item(it, it)[1]
                    if probs:
                        return "400 Bad Request", {"error": "cannot approve yet: " + "; ".join(probs), "problems": probs}
                it["status"] = to
                exams.save_item(con, it, me["id"])
                H["audit"](con, me, f"Exam bank: {it['id']} → {to}")
                return "200 OK", {"ok": True}
            if body.get("delete"):
                if not admin:
                    return "403 Forbidden", {"error": "only admins delete items (teachers can retire them)"}
                used = con.execute("SELECT COUNT(*) FROM exam_attempts WHERE data LIKE ?", ('%"' + str(body["delete"])[:30] + '"%',)).fetchone()[0]
                if used:
                    return "400 Bad Request", {"error": "this item was used in tests — retire it instead"}
                con.execute("DELETE FROM exam_items WHERE id=?", (body["delete"],))
                H["audit"](con, me, f"Exam bank: deleted {body['delete']}")
                return "200 OK", {"ok": True}
            if body.get("samples"):
                have = {json.dumps(i.get("tags")) + (i.get("stem") or i.get("title") or i.get("prompt") or "") for i in exams.items(con)}
                n = 0
                for raw in exam_samples.all_items():
                    k = json.dumps(raw["tags"]) + (raw.get("stem") or raw.get("title") or raw.get("prompt") or "")
                    if k in have:
                        continue
                    it, _ = exams.clean_item(raw)
                    exams.save_item(con, it, me["id"]); n += 1
                H["audit"](con, me, f"Exam bank: loaded {n} sample items")
                return "200 OK", {"ok": True, "added": n}
            if isinstance(body.get("draft"), dict):
                jid = draft_items(con, me["id"], body["draft"])
                return "200 OK", {"ok": True, "job": jid}
            return "400 Bad Request", {"error": "unknown action"}
        if path == "exam/marking" and method == "GET":
            names = {u["id"]: u.get("name", "") for u in H["load_col"](con, "users")}
            s = students_of(con, me)
            out = []
            for r in con.execute("SELECT data FROM exam_attempts WHERE kind='ielts-w' AND status IN ('submitted','marked') ORDER BY finished_at DESC LIMIT 300"):
                a = json.loads(r["data"])
                if s is None or a["userId"] in s or a["userId"] == me["id"]:
                    out.append(summary(a, names))
            return "200 OK", {"items": out, "criteria": exams.CRITERIA}
        if path == "exam/mark" and method == "POST":
            a = exams.get_attempt(con, body.get("id"))
            if not a or a["kind"] != "ielts-w" or not can_see(con, me, a) or a["status"] not in ("submitted", "marked"):
                return "404 Not Found", {"error": "not found"}
            bands, crit = {}, {}
            for iid in a["sections"][0]["items"]:
                c = (body.get("criteria") or {}).get(iid) or {}
                try:
                    cr = {k: max(0.0, min(9.0, float(c[k]))) for k in exams.CRITERIA}
                except (KeyError, TypeError, ValueError):
                    return "400 Bad Request", {"error": "give all four criteria for every task (0–9)"}
                crit[iid], bands[iid] = cr, exams.task_band(cr)
            a["result"]["teacher"] = {"criteria": crit, "tasks": bands, "band": exams.writing_band(a, bands),
                                      "comment": str(body.get("comment") or "")[:3000], "by": me["id"], "byName": me.get("name"), "at": exams.iso()}
            a["status"] = "marked"
            exams.put_attempt(con, a)
            H["audit"](con, me, f"Marked IELTS Writing test {a['id']} — band {a['result']['teacher']['band']}")
            return "200 OK", {"ok": True, "band": a["result"]["teacher"]["band"]}
        if path == "exam/feedback" and method == "POST":
            a = exams.get_attempt(con, body.get("id"))
            if not a or a["kind"] != "ielts-w" or not can_see(con, me, a) or a["status"] == "active":
                return "404 Not Found", {"error": "not found"}
            jid = writing_feedback(con, a, me["id"])
            return ("200 OK", {"ok": True, "job": jid}) if jid else ("400 Bad Request", {"error": a["result"].get("aiError") or "AI is not ready"})
        if path == "exam/stats" and method == "GET":
            return "200 OK", calibrate.compute(con)
        if path == "exam/calibrate" and method == "POST":
            if "minN" in body:
                if not admin:
                    return "403 Forbidden", {"error": "admin only"}
                calibrate.save_settings(con, body)
            ids = body.get("ids") or []
            if body.get("all"):
                ids = [k for k, v in calibrate.compute(con)["items"].items() if v.get("change") or (body.get("promote") and v.get("promote"))]
            n = calibrate.apply(con, [str(i) for i in ids][:2000], me["id"], promote=bool(body.get("promote"))) if ids else 0
            if n:
                H["audit"](con, me, f"Exam bank: applied difficulty from results to {n} item(s)")
            return "200 OK", {"ok": True, "changed": n}
        if path == "live/create" and method == "POST":
            s = live.create(con, me, body)
            H["audit"](con, me, f"Started live class {s['code']} ({len(s['questions'])} questions)")
            return "200 OK", {"id": s["id"], "code": s["code"]}
        if path == "live/list" and method == "GET":
            out = [{k: x.get(k) for k in ("id", "code", "title", "kind", "phase", "createdAt", "endedAt", "ownerName")} | {"questions": len(x["questions"]), "people": len(x["participants"])}
                   for x in live.all_sessions(con, None if admin else me["id"])]
            return "200 OK", {"items": out}
        if path == "exam/sets-load":
            if method == "GET":
                return "200 OK", {"files": ready_sets.catalogue()}
            res = ready_sets.load(con, me)
            H["audit"](con, me, f"Exam bank: loaded ready-made sets ({res['items']} items, {res['sets']} sets)")
            return "200 OK", dict(res, ok=True)
        if path == "qset/list" and method == "GET":
            return "200 OK", {"items": [qsets.summary(con, x) for x in qsets.listing(con, me)]}
        if path == "qset/save" and method == "POST":
            old = qsets.get(con, body.get("id")) if body.get("id") else None
            if body.get("id") and (not old or (old["owner"] != me["id"] and not admin)):
                return "404 Not Found", {"error": "question set not found"}
            x = qsets.create(con, me, body, old)
            H["audit"](con, me, f"Saved question set '{x['title']}' ({len(x['items'])} items)")
            return "200 OK", {"ok": True, "set": qsets.summary(con, x)}
        if path == "qset/delete" and method == "POST":
            old = qsets.get(con, body.get("id"))
            if not old or (old["owner"] != me["id"] and not admin):
                return "404 Not Found", {"error": "question set not found"}
            con.execute("DELETE FROM question_sets WHERE id=?", (old["id"],))
            H["audit"](con, me, f"Deleted question set '{old['title']}'")
            return "200 OK", {"ok": True}
        if path in ("live/host", "live/control", "live/share"):
            s = live.get(con, one("id") if method == "GET" else body.get("id"))
            if not s or (s["owner"] != me["id"] and not admin):
                return "404 Not Found", {"error": "live class not found"}
            if path in ("live/host", "live/share"):
                live.touch(con, s)
                return "200 OK", live.host_view(s) if path == "live/host" else live.share_view(s)
            live.control(con, s, body.get("action"), body.get("index"))
            if s["phase"] == "ended":
                H["audit"](con, me, f"Ended live class {s['code']}")
            return "200 OK", live.host_view(s)
        if path == "doc/paper" and method == "POST":
            p = exports.create_paper(con, me, body)
            H["audit"](con, me, f"Created PDF paper {p['code']} ({len(p['items'])} items{', with answer key' if p['withKey'] else ''})")
            return "200 OK", p
        if path == "doc/list" and method == "GET":
            return "200 OK", {"items": exports.listing(con, me)}
        if path == "doc/revoke" and method == "POST":
            if not admin:
                return "403 Forbidden", {"error": "admin only"}
            con.execute("UPDATE doc_exports SET revoked=? WHERE code=?", (1 if body.get("revoke", True) else 0, str(body.get("code") or "")))
            H["audit"](con, me, f"{'Revoked' if body.get('revoke', True) else 'Restored'} document {body.get('code')}")
            return "200 OK", {"ok": True}
        if path == "exam/settings" and method == "POST":
            if not admin:
                return "403 Forbidden", {"error": "admin only"}
            return "200 OK", {"settings": exams.save_settings(con, body)}

        # ---------- blog & AI: admins
        if path.startswith(("blog-admin", "blog/photos", "ai-admin")) and not admin:
            return "403 Forbidden", {"error": "admin only"}
        if path == "ai-admin" and method == "GET":
            return "200 OK", {**ai.status(con), "jobs": ai.jobs(con, 100)}
        if path == "ai-admin" and method == "POST":
            cfg = ai.save_settings(con, body)
            H["audit"](con, me, "Updated AI settings")
            return "200 OK", {"settings": cfg}
        if path == "blog-admin" and method == "GET":
            cleanup_stale(con)
            posts = blog.all_posts(con)
            bcfg = blog.settings(con)
            for p in posts:
                p["problems"] = blog.problems(p, bcfg)
            return "200 OK", {"posts": posts, "settings": bcfg, "branches": blog.BRANCHES, "ai": ai.status(con),
                              "statuses": blog.STATUSES, "imageModes": blog.IMAGE_MODES}
        if path == "blog/photos" and method == "GET":
            return "200 OK", {"items": images.search_photos(one("q"), 16)}
        if path == "blog-admin" and method == "POST":
            bcfg = blog.settings(con)
            if isinstance(body.get("settings"), dict):
                bcfg = blog.save_settings(con, body["settings"])
                H["audit"](con, me, "Updated blog settings")
                return "200 OK", {"ok": True, "settings": bcfg}
            if isinstance(body.get("generate"), dict):
                g = body["generate"]
                p = generate(con, me["id"], g.get("category"), str(g.get("topic") or "").strip(), str(g.get("scope") or "").strip(), pid=g.get("id"))
                return "200 OK", {"ok": True, "id": p["id"]}
            if body.get("draw"):
                draw_cover(con, me["id"], body["draw"])
                return "200 OK", {"ok": True}
            if isinstance(body.get("photo"), dict):
                p = blog.get(con, body["photo"].get("id"))
                item = body["photo"].get("item") or {}
                if not p:
                    return "404 Not Found", {"error": "post not found"}
                p["cover"], p["coverKind"], p["coverCredit"] = images.fetch_photo(item), "photo", images.credit(item)
                blog.log(p, me["id"], "cover photo chosen"); blog.put(con, p)
                return "200 OK", {"ok": True}
            if isinstance(body.get("save"), dict):
                s = body["save"]
                p = blog.get(con, s.get("id")) if s.get("id") else blog.new_post(con, bcfg, s.get("category"), me["id"])
                if not p:
                    return "404 Not Found", {"error": "post not found"}
                if p["status"] == "idea" and not s.get("id"):
                    p["status"] = "review"
                blog.clean_edit(p, s, bcfg, images.check_cover)
                if s.get("slug"):
                    p["slug"] = blog.unique_slug(con, s["slug"], p["id"])
                elif p["slug"].startswith("post-") and p["title"]["en"]:
                    p["slug"] = blog.unique_slug(con, p["title"]["en"], p["id"])
                if p["status"] == "idea" and (p["title"]["en"] or p["title"]["th"]):
                    p["status"] = "review"
                if p["status"] in ("published", "scheduled") and blog.problems(p, bcfg):
                    return "400 Bad Request", {"error": "a published post must stay complete: " + "; ".join(blog.problems(p, bcfg))}
                blog.log(p, me["id"], "edited"); blog.put(con, p)
                H["audit"](con, me, f"Blog: saved '{p['title']['en'] or p['title']['th']}'")
                return "200 OK", {"ok": True, "id": p["id"], "slug": p["slug"], "problems": blog.problems(p, bcfg)}
            if isinstance(body.get("status"), dict):
                p = blog.get(con, body["status"].get("id"))
                if not p:
                    return "404 Not Found", {"error": "post not found"}
                blog.set_status(p, body["status"].get("to"), bcfg, me["id"], body["status"].get("publishAt"))
                blog.put(con, p)
                H["audit"](con, me, f"Blog: '{p['title']['en'] or p['title']['th']}' → {p['status']}")
                return "200 OK", {"ok": True}
            if body.get("delete"):
                blog.delete(con, body["delete"])
                H["audit"](con, me, "Blog: deleted a post")
                return "200 OK", {"ok": True}
            return "400 Bad Request", {"error": "unknown action"}
    except (ValueError, TypeError, images.ImageError) as e:
        return "400 Bad Request", {"error": str(e)}
    except ai.AIError as e:
        return "409 Conflict", {"error": str(e)}
    return None


# ---------------------------------------------------------------- backup / restore / erase
TABLES = ("blog_posts", "exam_items", "exam_item_versions", "exam_attempts", "ai_jobs", "live_sessions", "doc_exports", "doc_export_log", "question_sets")


def backup(con):
    return {"blog": blog.all_posts(con), "blogSettings": blog.settings(con), "examItems": exams.items(con),
            "examAttempts": [json.loads(r["data"]) for r in con.execute("SELECT data FROM exam_attempts")],
            "examSettings": exams.settings(con), "aiSettings": ai.settings(con), "calibration": calibrate.settings(con),
            "liveSessions": [json.loads(r["data"]) for r in con.execute("SELECT data FROM live_sessions")],
            "questionSets": [json.loads(r["data"]) for r in con.execute("SELECT data FROM question_sets")],
            "docExports": [dict(r) for r in con.execute("SELECT * FROM doc_exports")],
            "docExportLog": [dict(r) for r in con.execute("SELECT * FROM doc_export_log")]}


def restore(con, body):
    for t in ("blog_posts", "exam_items", "exam_attempts", "live_sessions", "doc_exports", "doc_export_log", "question_sets"):
        con.execute(f"DELETE FROM {t}")
    if isinstance(body.get("blogSettings"), dict):
        blog.save_settings(con, body["blogSettings"])
    for p in body.get("blog") or []:
        try:
            p["cover"] = images.check_cover(p.get("cover"))
            if p.get("status") not in blog.STATUSES or p["status"] == "drafting":
                p["status"] = "review"
            p["slug"] = blog.unique_slug(con, p.get("slug") or p.get("id"), p["id"])
            blog.put(con, p)
        except (KeyError, TypeError, images.ImageError):
            continue
    for raw in body.get("examItems") or []:
        try:
            it, _ = exams.clean_item(raw, {"id": raw["id"], "version": max(0, int(raw.get("version") or 1) - 1)})
            exams.save_item(con, it, raw.get("updatedBy"))
        except (KeyError, ValueError, TypeError):
            continue
    for a in body.get("examAttempts") or []:
        if isinstance(a, dict) and a.get("id") and a.get("userId") and a.get("kind") in exams.KINDS:
            exams.put_attempt(con, a)
    if isinstance(body.get("examSettings"), dict):
        exams.save_settings(con, body["examSettings"])
    if isinstance(body.get("aiSettings"), dict):
        ai.save_settings(con, body["aiSettings"])
    if isinstance(body.get("calibration"), dict):
        calibrate.save_settings(con, body["calibration"])
    for s in body.get("liveSessions") or []:
        if isinstance(s, dict) and s.get("id") and s.get("code") and s.get("owner"):
            s["version"] = max(0, int(s.get("version") or 1) - 1)
            live.put(con, s)
    for x in body.get("questionSets") or []:
        if isinstance(x, dict) and x.get("id") and x.get("owner") and isinstance(x.get("items"), list):
            qsets.put(con, x)
    for d in body.get("docExports") or []:
        if isinstance(d, dict) and d.get("code") and d.get("data"):
            con.execute("INSERT OR REPLACE INTO doc_exports (code, kind, title, created_at, created_by, created_by_name, role, revoked, data) VALUES (?,?,?,?,?,?,?,?,?)",
                        tuple(d.get(k) for k in ("code", "kind", "title", "created_at", "created_by", "created_by_name", "role")) + (int(d.get("revoked") or 0), d["data"]))
    for l in body.get("docExportLog") or []:
        if isinstance(l, dict) and l.get("code"):
            con.execute("INSERT INTO doc_export_log (code, at, user_id, user_name, action) VALUES (?,?,?,?,?)", tuple(l.get(k) for k in ("code", "at", "user_id", "user_name", "action")))
