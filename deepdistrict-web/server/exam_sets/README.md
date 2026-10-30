# Ready-made practice sets

Each `*.json` file here is one complete, original DeepDistrict practice set. The back office
(**Item bank → Load ready-made sets**) adds the items to the bank as *approved* and creates a
**question set** for each file, so it can be started as a timed test, run as a live class or
printed as an audited PDF. Loading twice does not create duplicates; when a file changes, the server replaces its previous version on
the next start (old items are retired, past results keep their copy).

Every item was written for DeepDistrict. Nothing is copied or paraphrased from official papers,
past papers, school pre-tests or commercial books. Format details come from public descriptions
(College Board, IELTS, the school's published subject list and tutor summaries) and are
*practice formats*, not the official tests. Check the school's own announcement each year.

Check files with:

```
python3 tools/check_sets.py
```

## File format

```json
{"exam": "sat" | "ielts" | "sk1" | "sp1" | "sk4" | "sp4" | "tu4" | "alevel", "set": 1,
 "title": {"en": "…", "th": "…"}, "minutes": 32,
 "note": {"en": "…", "th": "…"},
 "items": [ … ]}
```

Every set is **full length** — the real number and kinds of questions of each test, as far as they are
published (M.1 schools do not publish their papers; their formats below follow public tutor summaries and
must be checked against each year's announcement).

| exam  | items | time | mix |
|-------|-------|------|-----|
| sat   | 54 × `sat`: items 1–27 = Module 1, 28–54 = Module 2 (harder) | 2 × 32 min | each module cs 7 · ii 7 · sec 7 · eoi 6 |
| ielts | 3 × `ielts-r` (40 marks, 2,150–2,750 words) + `ielts-w` Task 1 and Task 2 | 60 + 60 min | — |
| sk1    | 40 — Suankularb **M.1** English, GATE and EPLUS+ on one paper (pre-test style) | 50 min | conversation 8 · vocabulary 8 · grammar 8 · cloze 6 · reading 10 |
| sp1    | 50 — Satit Prasarnmit **M.1** English (reading and reasoning) | 60 min | conversation 6 · vocabulary 8 · grammar 8 · reading 28 |
| sk4    | 50 — Suankularb **M.4** English, GATE and EPLUS+ on one paper | 60 min | conversation 6 · vocabulary 8 · grammar 10 · error 6 · cloze 8 · reading 12 |
| sp4    | 50 — Satit Prasarnmit **M.4** English (standardized-test style) | 60 min | vocabulary 10 · grammar 12 · error 8 · academic reading 20 |
| tu4    | 50 — Triam Udom Suksa **M.4** English (cloze + reading core) | 60 min | conversation 5 · error 10 · cloze 15 · reading 20 |
| alevel | 80 — **A-Level English** (TCAS, official blueprint) | 90 min | short conv. 12 · long conv. 8 · ads 6 · review 6 · news 8 · visuals 8 · articles 12 · text completion 15 · paragraph organization 5 |

Every school and test has its **own English paper** — they are never combined: they differ in concept, question
types, depth, skills and CEFR level. Items carry `"part"` (see `server/exams.py` `M1_PARTS`) in the order above.

Every item says **what it measures** and **what it is about** — `skill` and `topic` for M.1 items,
`topic` for SAT items and IELTS passages — so results show strengths and weaknesses by skill and topic.

### `sat` item

Same shape as `server/exam_samples.py` `SAT`: `domain` (cs, ii, sec, eoi), `skill`
(cs: words-in-context, text-structure, cross-text · ii: central-ideas, evidence-textual,
evidence-quantitative, inferences · sec: boundaries, form-structure-sense · eoi: transitions,
rhetorical-synthesis), `difficulty` e/m/h, `passage` 25–150 words (cross-text up to 300; two texts
labelled "Text 1" and "Text 2"), `stem` ending with "?", exactly 4 different `choices`, `answer`
0–3, `explanation` {"en","th"}. Evidence-quantitative needs
`"table": {"title": "…", "rows": [["header", …], [ … ]]}`.

### `ielts-r` item

Same shape as `exam_samples.READING`: `title`, `difficulty` 1–3, `paragraphs` (each paragraph is
A, B, C … in order), `groups` (1–4) of the IELTS task types listed in `server/exams.py`
`IELTS_TYPES`. A passage carries 8–16 marks and 550–1,150 words.

### `ielts-w` item

Same shape as `exam_samples.WRITING`. Task 1 needs a `table`, the official instruction sentence and
"Write at least 150 words."; Task 2 ends with the official "Give reasons…" sentence and
"Write at least 250 words."

### `m1` item

```json
{"kind": "m1", "program": "sk1", "subject": "eng", "part": "grammar", "format": "mcq", "difficulty": "h",
 "skill": {"en": "Inversion after negative adverbials", "th": "การสลับที่หลังคำวิเศษณ์เชิงปฏิเสธ"},
 "topic": {"en": "Inversion", "th": "การสลับที่ประธานกับกริยา"},
 "passage": "", "table": null, "lang": "en",
 "stem": "…", "choices": ["…", "…", "…", "…"], "answer": 2,
 "explanation": {"en": "…", "th": "…"}}

{"kind": "m1", "program": "tu4", "subject": "eng", "part": "error",
 "stem": "Hardly [[had]] we arrived [[when]] it [[starts]] [[to rain]].", "choices": ["had", "when", "starts", "to rain"], "answer": 2, …}
```

`passage` is optional (a reading text shared by several questions is repeated in full on each). Error items mark exactly four
parts with `[[…]]`, and the choices are those parts in sentence order. Explanations (English and Thai) name the right answer by
its content, never by a letter or position (ก ข ค ง / A B C D), because answer order is shuffled.
