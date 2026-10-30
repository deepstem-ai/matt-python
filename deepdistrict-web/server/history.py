"""Nothing is ever lost: every earlier version and every removed row is kept in the `archive` table.

Database triggers copy the old row into `archive` before it is changed or removed, for every table
except short-lived sign-in tokens. The archive itself cannot be changed or emptied (its own triggers
refuse). People, enrolments, lessons, payments and requests are never removed from `records` either:
"delete" in the back office only marks them archived, and an admin can restore them.
"""

import json

SKIP = {"archive", "auth_sessions", "line_codes", "sqlite_sequence"}    # sign-in tokens are not data
UPDATES = {"records": "OLD.data IS NOT NEW.data OR OLD.archived IS NOT NEW.archived",
           "kv": "OLD.value IS NOT NEW.value AND OLD.key NOT IN ('line_usage')",
           "exam_items": "OLD.data IS NOT NEW.data", "question_sets": "OLD.data IS NOT NEW.data",
           "blog_posts": "OLD.data IS NOT NEW.data", "credentials": "OLD.hash IS NOT NEW.hash"}
NOW = "strftime('%Y-%m-%dT%H:%M:%SZ','now')"


def init(con):
    con.executescript("""
    CREATE TABLE IF NOT EXISTS archive (seq INTEGER PRIMARY KEY AUTOINCREMENT, tbl TEXT NOT NULL, action TEXT NOT NULL,
                                        at TEXT NOT NULL, rkey TEXT, row TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS archive_key ON archive (tbl, rkey);
    CREATE TRIGGER IF NOT EXISTS archive_no_delete BEFORE DELETE ON archive BEGIN SELECT RAISE(ABORT, 'the archive is permanent'); END;
    CREATE TRIGGER IF NOT EXISTS archive_no_update BEFORE UPDATE ON archive BEGIN SELECT RAISE(ABORT, 'the archive is permanent'); END;
    """)
    prepare(con)
    tables = [r[0] for r in con.execute("SELECT name FROM sqlite_master WHERE type='table'") if r[0] not in SKIP]
    for t in tables:
        cols = [c[1] for c in con.execute(f"PRAGMA table_info({t})")]
        row = "json_object(" + ", ".join(f"'{c}', OLD.\"{c}\"" for c in cols) + ")"
        key = "OLD.col || ':' || OLD.id" if t == "records" else ("OLD.\"" + cols[0] + "\"")
        # recreated on every start so a column added later is kept too
        for action in ("delete", "update"):
            con.execute(f"DROP TRIGGER IF EXISTS keep_{action}_{t}")
        con.execute(f"CREATE TRIGGER keep_delete_{t} BEFORE DELETE ON {t} BEGIN "
                    f"INSERT INTO archive (tbl, action, at, rkey, row) VALUES ('{t}', 'delete', {NOW}, {key}, {row}); END")
        if t in UPDATES:
            con.execute(f"CREATE TRIGGER keep_update_{t} BEFORE UPDATE ON {t} WHEN {UPDATES[t]} BEGIN "
                        f"INSERT INTO archive (tbl, action, at, rkey, row) VALUES ('{t}', 'update', {NOW}, {key}, {row}); END")


def prepare(con):
    """Run right after the records table exists (older databases have no `archived` column yet)."""
    cols = [c[1] for c in con.execute("PRAGMA table_info(records)")]
    if "archived" not in cols:
        con.execute("ALTER TABLE records ADD COLUMN archived INTEGER NOT NULL DEFAULT 0")


def versions(con, col, rid, limit=200):
    """Earlier versions of one back-office record, newest first."""
    out = []
    for r in con.execute("SELECT seq, action, at, row FROM archive WHERE tbl='records' AND rkey=? ORDER BY seq DESC LIMIT ?", (f"{col}:{rid}", limit)):
        row = json.loads(r["row"])
        try:
            data = json.loads(row.get("data") or "{}")
        except ValueError:
            data = {}
        out.append({"seq": r["seq"], "action": r["action"], "at": r["at"], "savedAt": row.get("updated_at"), "by": row.get("updated_by"),
                    "archived": bool(row.get("archived")), "data": data})
    return out


def archived(con, cols):
    return [dict(json.loads(r["data"]), _col=r["col"], _archivedAt=r["updated_at"], _archivedBy=r["updated_by"])
            for r in con.execute("SELECT col, data, updated_at, updated_by FROM records WHERE archived=1 ORDER BY updated_at DESC LIMIT 2000")
            if r["col"] in cols]


def stats(con):
    n = con.execute("SELECT COUNT(*) FROM archive").fetchone()[0]
    first = con.execute("SELECT MIN(at) FROM archive").fetchone()[0]
    return {"versions": n, "since": first, "archivedRecords": con.execute("SELECT COUNT(*) FROM records WHERE archived=1").fetchone()[0]}
