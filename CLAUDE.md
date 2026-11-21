# Working rules for this repository

## Real data is frozen — never change it (owner's instruction, 13 Nov 2026)

DeepDistrict now runs on **real learners' records** that staff keep up to date in the back office.
From now on:

- **Never change, edit, re-import, archive or delete the centre's data** in any release:
  learners, parents, enrolments, lessons, payments, requests, settings.
  Data changes happen only through the back office, by people.
- **Do not ship `server/real_data/` in release zips any more.** The one-time import is done and marked final;
  the server also refuses to import anything by itself once data is frozen (`kv dataFrozen`).
- **Never add code that rewrites existing records on start-up or during an update** (migrations that touch
  records, re-seeding, "fixes" to stored lessons). New features must work with the records as they are; new
  fields are optional and read with defaults.
- **Never commit `server/data/` or `server/real_data/`** (personal data, PDPA). Never put real names in committed files.
- Updating a server = extract the new zip over the folder and Reload. The zip never contains `server/data/`.
- If a request seems to need a data change, explain what the staff should do in the back office instead,
  or ask the owner first.

## Adding records the owner asks for (the only allowed data change)

When the owner asks to add learners / lessons and this session runs on the computer that holds the data
(`deepdistrict-web/server/data/deepdistrict.db`):

1. Put the records in a DeepDistrict records file (.json — same shape as an export: `users`, `enrolments`,
   `sessions`, `payments`, `customCourses`; NEW ids only). Never include a record that already exists.
2. Run `python3 deepdistrict-web/tools/add_records.py <file.json>` (shows the summary, asks; `--yes` to skip).
   It backs the database up first (`server/data/backups/before-add-*.db`), adds only new ids, verifies every
   existing record is byte-for-byte unchanged (or rolls back), and adding the same file twice adds nothing.
3. Tell the owner to refresh the back office. Staff can do the same from More menus → Data → Add records from a file.

Never edit, move, cancel or delete existing records this way — those changes are made by staff in the back office
(they need a reason and are marked on the lesson).

## Releases

- Build the zip with `git archive` from the repository root (`deepdistrict-web/` prefix); bump the version with
  `python3 deepdistrict-web/tools/set_version.py "X.Y rN"` and the `admin/sw.js` cache name; update
  `CHANGELOG.md` and `docs/LOCAL-TEST-TH.md`.
- Site is bilingual (English default, Thai); all wording is DeepDistrict's own.
