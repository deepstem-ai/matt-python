"""DeepDistrict AI helper — the one place that talks to Claude.

Used by the blog (news drafts, cover drawings) and the exam module (item drafts, IELTS Writing
feedback). AI only ever *drafts*: a person approves before anything is published or counted.

Set-up (see server/DEPLOY.md):
  * pip install anthropic          (the official Anthropic SDK)
  * ANTHROPIC_API_KEY=<your key>   (environment variable / secret — never stored in the database)
  * Back office → Settings → AI: choose the model and the monthly limits

Every call is logged in ai_jobs (who, what, tokens, web searches, estimated cost, error) and the
monthly job/budget limits are checked before a call is made.
"""

import json
import os
import re
import secrets
from datetime import datetime, timezone

DEFAULTS = {
    "enabled": False,
    "model": "",            # a current Claude model id, e.g. from the Anthropic models page
    "effort": "medium",     # low | medium | high
    "monthlyJobs": 120,     # hard limit on AI calls per calendar month
    "monthlyUSD": 30.0,     # hard limit on the estimated spend per month (0 = no limit)
    "priceIn": 0.0,         # USD per million input tokens (from the Anthropic pricing page)
    "priceOut": 0.0,        # USD per million output tokens
    "priceSearch": 10.0,    # USD per 1,000 web searches
}
EFFORTS = ("low", "medium", "high")


class AIError(Exception):
    pass


def init(con):
    con.executescript("""
    CREATE TABLE IF NOT EXISTS ai_jobs (id TEXT PRIMARY KEY, at TEXT NOT NULL, kind TEXT NOT NULL, ref TEXT, user_id TEXT,
                                        status TEXT NOT NULL, input_tokens INTEGER DEFAULT 0, output_tokens INTEGER DEFAULT 0,
                                        searches INTEGER DEFAULT 0, cost REAL DEFAULT 0, error TEXT, note TEXT, finished_at TEXT);
    """)


def now_iso():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def settings(con):
    r = con.execute("SELECT value FROM kv WHERE key='ai'").fetchone()
    cfg = dict(DEFAULTS)
    if r:
        cfg.update({k: v for k, v in json.loads(r["value"]).items() if k in DEFAULTS})
    if os.environ.get("DD_AI_MODEL") and not cfg["model"]:
        cfg["model"] = os.environ["DD_AI_MODEL"]
    return cfg


def save_settings(con, body):
    cfg = settings(con)
    if "enabled" in body:
        cfg["enabled"] = bool(body["enabled"])
    if "model" in body:
        m = str(body["model"] or "").strip()
        if m and not re.fullmatch(r"[a-z0-9][a-z0-9.\-]{2,60}", m):
            raise ValueError("model id looks wrong (letters, digits, dots and dashes only)")
        cfg["model"] = m
    if body.get("effort") in EFFORTS:
        cfg["effort"] = body["effort"]
    for k in ("monthlyJobs",):
        if k in body:
            cfg[k] = max(0, min(10000, int(body[k] or 0)))
    for k in ("monthlyUSD", "priceIn", "priceOut", "priceSearch"):
        if k in body:
            cfg[k] = max(0.0, min(100000.0, float(body[k] or 0)))
    con.execute("INSERT INTO kv (key, value) VALUES ('ai', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", (json.dumps(cfg),))
    return cfg


def has_key():
    return bool(os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("ANTHROPIC_AUTH_TOKEN"))


def has_sdk():
    try:
        import anthropic  # noqa: F401
        return True
    except ImportError:
        return False


def month_usage(con):
    start = datetime.now(timezone.utc).strftime("%Y-%m-01")
    r = con.execute("SELECT COUNT(*) n, COALESCE(SUM(cost),0) c, COALESCE(SUM(input_tokens),0) i, COALESCE(SUM(output_tokens),0) o, COALESCE(SUM(searches),0) s "
                    "FROM ai_jobs WHERE at >= ? AND status != 'refused'", (start,)).fetchone()
    return {"jobs": r["n"], "cost": round(r["c"], 4), "inputTokens": r["i"], "outputTokens": r["o"], "searches": r["s"]}


def status(con):
    cfg, use = settings(con), month_usage(con)
    problems = []
    if not cfg["enabled"]:
        problems.append("off")
    if not has_sdk():
        problems.append("sdk")
    if not has_key():
        problems.append("key")
    if not cfg["model"]:
        problems.append("model")
    if cfg["monthlyJobs"] and use["jobs"] >= cfg["monthlyJobs"]:
        problems.append("jobs-limit")
    if cfg["monthlyUSD"] and use["cost"] >= cfg["monthlyUSD"]:
        problems.append("budget-limit")
    return {"ready": not problems, "problems": problems, "settings": cfg, "month": use, "hasKey": has_key(), "hasSdk": has_sdk()}


def start_job(con, kind, ref, user_id, note=""):
    """Check the limits and open a job row. Raises AIError when AI may not run now."""
    st = status(con)
    if not st["ready"]:
        raise AIError("AI is not ready: " + ", ".join(st["problems"]))
    jid = "j" + secrets.token_hex(6)
    con.execute("INSERT INTO ai_jobs (id, at, kind, ref, user_id, status, note) VALUES (?,?,?,?,?,?,?)",
                (jid, now_iso(), kind, ref, user_id, "running", str(note)[:300]))
    return jid, st["settings"]


def finish_job(con, jid, cfg, usage=None, error=None):
    usage = usage or {}
    cost = (usage.get("input_tokens", 0) * cfg.get("priceIn", 0) + usage.get("output_tokens", 0) * cfg.get("priceOut", 0)) / 1e6 \
        + usage.get("searches", 0) * cfg.get("priceSearch", 0) / 1000
    con.execute("UPDATE ai_jobs SET status=?, input_tokens=?, output_tokens=?, searches=?, cost=?, error=?, finished_at=? WHERE id=?",
                ("failed" if error else "done", usage.get("input_tokens", 0), usage.get("output_tokens", 0), usage.get("searches", 0),
                 round(cost, 5), (str(error)[:500] if error else None), now_iso(), jid))


def jobs(con, limit=200):
    return [dict(r) for r in con.execute("SELECT * FROM ai_jobs ORDER BY at DESC LIMIT ?", (limit,))]


# ---------------------------------------------------------------- the call itself (no database here)
def _client():
    try:
        import anthropic
    except ImportError:
        raise AIError("the anthropic package is not installed (pip install anthropic)")
    return anthropic, anthropic.Anthropic(max_retries=2, timeout=600)


def ask(cfg, system, content, schema=None, web_domains=None, max_searches=6, max_tokens=16000):
    """One request to Claude.

    content      a string, or a list of content blocks (text / image)
    schema       JSON schema → the answer is guaranteed JSON (structured outputs); returns the parsed object
    web_domains  list of domains → Claude may search the web, but only these sites
    Returns {"data" | "text", "sources": [{title,url}], "usage": {...}}.
    """
    anthropic, client = _client()
    out_cfg = {"effort": cfg.get("effort") or "medium"}
    if schema:
        out_cfg["format"] = {"type": "json_schema", "schema": schema}
    kw = {"model": cfg["model"], "max_tokens": max_tokens, "system": system, "output_config": out_cfg,
          # on a policy decline the API retries on Anthropic's recommended fallback model instead of failing
          "betas": ["server-side-fallback-2026-07-01"], "fallbacks": "default"}
    if web_domains is not None:
        tool = {"type": "web_search_20260209", "name": "web_search", "max_uses": max_searches}
        if web_domains:
            tool["allowed_domains"] = list(web_domains)[:64]
        kw["tools"] = [tool]
    messages = [{"role": "user", "content": content}]
    usage = {"input_tokens": 0, "output_tokens": 0, "searches": 0}
    sources, texts = [], []
    try:
        for _ in range(5):                              # resume server-side tool loops ("pause_turn")
            r = client.beta.messages.create(messages=messages, **kw)
            u = r.usage
            usage["input_tokens"] += getattr(u, "input_tokens", 0) or 0
            usage["output_tokens"] += getattr(u, "output_tokens", 0) or 0
            stu = getattr(u, "server_tool_use", None)
            usage["searches"] += (getattr(stu, "web_search_requests", 0) or 0) if stu else 0
            if r.stop_reason == "refusal":
                raise AIError("the AI declined this request")
            for b in r.content:
                if b.type == "text":
                    texts.append(b.text)
                    for c in getattr(b, "citations", None) or []:
                        if getattr(c, "url", None):
                            sources.append({"title": getattr(c, "title", "") or "", "url": c.url})
                elif b.type == "web_search_tool_result" and isinstance(b.content, list):
                    for res in b.content:
                        if getattr(res, "url", None):
                            sources.append({"title": getattr(res, "title", "") or "", "url": res.url, "seen": True})
            if r.stop_reason != "pause_turn":
                break
            messages = [messages[0], {"role": "assistant", "content": r.content}]
        if r.stop_reason == "max_tokens":
            raise AIError("the answer was cut off (too long)")
    except anthropic.APIStatusError as e:
        raise AIError(f"AI service error {e.status_code}: {getattr(e, 'message', '')[:200]}")
    except anthropic.APIConnectionError:
        raise AIError("could not reach the AI service (network)")
    text = "".join(texts) if schema else "\n".join(texts)
    out = {"sources": _dedupe(sources), "usage": usage}
    if schema:
        try:
            out["data"] = json.loads(text)
        except json.JSONDecodeError:
            raise AIError("the AI answer was not valid JSON")
    else:
        out["text"] = text
        out["data"] = extract_json(text)
    return out


def extract_json(text):
    """The last JSON object in a free-text answer (```json fenced or bare), or None."""
    blocks = re.findall(r"```(?:json)?\s*(\{.*?\})\s*```", text or "", re.S)
    cands = blocks[::-1] or ([text[text.find("{"): text.rfind("}") + 1]] if "{" in (text or "") else [])
    for c in cands:
        try:
            return json.loads(c)
        except json.JSONDecodeError:
            continue
    return None


def _dedupe(items):
    seen, out = set(), []
    for s in items:
        u = s["url"].split("#")[0]
        if u not in seen:
            seen.add(u)
            out.append(dict(s, url=u))
    return out
