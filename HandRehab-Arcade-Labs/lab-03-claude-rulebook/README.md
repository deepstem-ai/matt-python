# Lab 03 — Learn to Talk to Claude Code
### สอน AI ด้วยสมุดกฎ CLAUDE.md

**Goal:** a `CLAUDE.md` rulebook the AI follows every time, plus a team guide on writing strong instructions.

## How to run / วิธีเปิด
The app is unchanged from Lab 02: `start.bat` (Windows) · `bash start.sh` (Mac/Linux) · or `python -m http.server 8000` → http://localhost:8000.
For the lab itself: open a terminal in this folder → `claude` → `/init` → check `CLAUDE.md` → give the test task in `prompts/03-rules-check.md`.

## Files
| File | What it is |
|---|---|
| `CLAUDE.md` | **the rulebook** — Thai, numbered, 4 parts from the prompt + part 5 (controls each future page needs) |
| `docs/HOW-TO-ASK-AI.md` | five-line formula (PART 5 of the course), 3 weak/strong pairs from this project (+ a bonus library pair), checklist, "let the AI write the prompt" template |
| `prompts/` | saved good prompts: `01-camera-single-file.md`, `02-fix-bug-template.md`, `03-rules-check.md` (the rule-obedience test) |
| `index.html`, `start*.bat`, `start.sh`, `docs/HOW-TO-RUN.md` | carried over from Lab 02 |

## Blanks we filled in
| Blank | Value |
|---|---|
| Project name | HandRehab Arcade ⚠️ *team: change* |
| Built for | older adults and people rehabilitating hand function (stroke, stiff fingers, tremor) + therapists/carers |
| Built by a student team from | "ทีม NeonHands จากโรงเรียนของเรา" ⚠️ *team: change* |
| Max lines per file | 200 |
| Plan first when a task touches more than | 2 files |
| Approval word | `GO` |
| Team-specific rule (COULD) | no vague variable names such as `data`, `temp` |

## How to verify (MUST / PASS checklist)
- [ ] `CLAUDE.md` exists and contains the rule **"never delete or overwrite working code without asking"** (Part 4 item 3).
- [ ] Paste `prompts/03-rules-check.md` into Claude Code. The task touches 3 files → the AI must **propose a plan and stop until you type `GO`**. Tick the checklist in that file.
- [ ] If it did not obey, sharpen the wording in `CLAUDE.md` and try again.
- [ ] SHOULD: write your next request with the five-line formula; read every line the AI writes and ask one follow-up question.
- [ ] COULD: save each prompt that worked into `prompts/`.
