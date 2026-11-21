#!/usr/bin/env python3
"""Add records from a prepared DeepDistrict file to THIS computer's database — add only, with a backup first.

    python3 tools/add_records.py path/to/records.json          # shows what will be added, asks to confirm
    python3 tools/add_records.py path/to/records.json --yes    # no question (for automation)

Safety (the centre's real data is frozen — see CLAUDE.md):
  1. A copy of the database is saved first: server/data/backups/before-add-<time>.db
  2. Only records whose id is not in the database yet are added; existing records (even archived) are never
     updated, archived or removed. The same file twice adds nothing.
  3. After adding, every record that was there before is compared byte for byte; if anything differs the whole
     change is rolled back and nothing is saved.
Set DD_DATA_DIR to use another data folder (the same setting the server uses). Refresh the back office afterwards.
"""
import json
import os
import sqlite3
import sys
import time
from pathlib import Path

os.environ.setdefault("DD_NO_IMPORT", "1")          # never run the start-up import from this tool
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "server"))
import app  # noqa: E402  (opens the same database the server uses)


def snapshot(con):
    return {(r["col"], r["id"]): (r["data"], r["archived"]) for r in con.execute("SELECT col, id, data, archived FROM records")}


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if len(args) != 1:
        sys.exit(__doc__)
    data = json.loads(Path(args[0]).read_text(encoding="utf-8"))
    if not app.DB_PATH.exists():
        sys.exit(f"No database at {app.DB_PATH} — start the server once first, or set DD_DATA_DIR.")

    # 1) backup
    backups = app.DATA_DIR / "backups"
    backups.mkdir(parents=True, exist_ok=True)
    stamp, n = time.strftime('%Y%m%d-%H%M%S'), 1
    dest = backups / f"before-add-{stamp}.db"
    while dest.exists():                                  # never overwrite an earlier backup
        n += 1
        dest = backups / f"before-add-{stamp}-{n}.db"
    src = sqlite3.connect(app.DB_PATH)
    with sqlite3.connect(dest) as out:
        src.backup(out)
    src.close()
    print(f"Backup saved: {dest}")

    con = app.db()
    try:
        before = snapshot(con)
        summary = app.add_records(con, data, None, preview=True)
        if not summary["added"] and not summary["courses"]:
            print("Everything in this file is already here — nothing to add. Nothing changed.")
            return
        print("Will add:", ", ".join(f"{v} {k}" for k, v in summary["added"].items()),
              ("· courses " + ", ".join(summary["courses"])) if summary["courses"] else "")
        print("For:", " · ".join(summary["students"]))
        if summary["skipped"]:
            print(f"{summary['skipped']} record(s) are already here and stay as they are.")
        if "--yes" not in sys.argv and input("Add these records? [y/N] ").strip().lower() not in ("y", "yes"):
            print("Cancelled — nothing changed.")
            return
        app.add_records(con, data, None)
        after = snapshot(con)
        changed = [k for k, v in before.items() if after.get(k) != v]
        if changed:
            con.rollback()
            sys.exit(f"STOPPED: {len(changed)} existing record(s) would have changed — rolled back, nothing saved. {changed[:3]}")
        con.commit()
        print(f"Done. Added {sum(summary['added'].values())} record(s); all {len(before)} existing records are unchanged.")
        print("Refresh the back office to see them.")
    except ValueError as e:
        con.rollback()
        sys.exit(f"Not added: {e}")
    finally:
        con.close()


if __name__ == "__main__":
    main()
