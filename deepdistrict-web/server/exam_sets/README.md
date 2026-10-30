# Ready-made practice sets

Each `*.json` file here is one complete, original DeepDistrict practice set. The back office
(**Item bank → Load ready-made sets**) adds the items to the bank as *approved* and creates a
**question set** for each file, so it can be started as a timed test, run as a live class or
printed as an audited PDF. Loading twice does not create duplicates.

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
{"exam": "sat" | "ielts" | "gate" | "ep", "set": 1,
 "title": {"en": "…", "th": "…"}, "minutes": 32,
 "note": {"en": "…", "th": "…"},
 "items": [ … ]}
```

| exam  | items | time | mix |
|-------|-------|------|-----|
| sat   | 27 × `sat` (one Reading and Writing module) | 32 min | cs 7 · ii 7 · sec 7 · eoi 6 |
| ielts | 3 × `ielts-r` (40 marks, 2,150–2,750 words) + `ielts-w` Task 1 and Task 2 | 60 + 60 min | — |
| gate  | 40 × `m1` with `"program": "gate"` | 90 min | math 15 · sci 15 · eng 5 · thai 5 |
| ep    | 40 × `m1` with `"program": "ep"` | 90 min | eng 20 · math 10 · sci 10 |

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
{"kind": "m1", "program": "gate", "subject": "math", "difficulty": "m",
 "passage": "", "table": null,
 "stem": "…", "choices": ["…", "…", "…", "…"], "answer": 2,
 "explanation": {"en": "…", "th": "…"}}
```

`passage` is optional (a reading text or a situation shared by the question). GATE questions are in
Thai except the English part; EP questions are in English. Explanations name the right answer by
its content, never by a letter or position (ก ข ค ง / A B C D), because answer order is shuffled.
