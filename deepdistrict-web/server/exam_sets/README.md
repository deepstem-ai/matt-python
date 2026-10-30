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
{"exam": "sat" | "ielts" | "gate" | "satit", "set": 1,
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
| gate  | 120 × `m1` `"program": "gate"` — one Suankularb paper for GATE **and** English Program applicants (EP needs a higher English score) | 180 min | math 40 (10 written) · sci 40 (5 written) · eng 20 · thai 20 |
| satit | 185 × `m1` `"program": "satit"` | 240 min | math 25 (20 Thai + 5 English) · sci 50 (40 Thai + 10 English) · thai 60 · eng 50 |

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
{"kind": "m1", "program": "gate", "subject": "math", "format": "mcq", "difficulty": "h",
 "skill": {"en": "Multi-step problem solving with ratios", "th": "การแก้โจทย์ปัญหาอัตราส่วนหลายขั้นตอน"},
 "topic": {"en": "Ratio and proportion", "th": "อัตราส่วนและสัดส่วน"},
 "passage": "", "table": null, "lang": "th",
 "stem": "…", "choices": ["…", "…", "…", "…"], "answer": 2,
 "explanation": {"en": "…", "th": "…"}}

{"kind": "m1", "program": "gate", "subject": "math", "format": "fill", "accept": ["84"], "unit": "ตร.ซม.", …}
```

`passage` is optional (a reading text or a situation shared by the question). Suankularb and Satit questions are in
Thai except the English part and the English-language maths/science items (`"lang": "en"`). Explanations name the right answer by
its content, never by a letter or position (ก ข ค ง / A B C D), because answer order is shuffled.
