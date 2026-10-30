# Changelog

## 6.0 r1 — October 2026
- **Every school and test has its own English paper — never combined.** 3 original papers each, every
  question labelled with what it measures and its topic, difficulty rising from paper 1 to 3:
  | Paper | Questions · time | Parts | Level |
  |---|---|---|---|
  | Suankularb M.1 (GATE / EPLUS+ — EPLUS+ needs the higher score) | 40 · 50 min | conversation 8 · vocabulary 8 · grammar 8 · cloze 6 · reading 10 | A2+ → B1+ |
  | Satit Prasarnmit M.1 (reading and reasoning) | 50 · 60 min | conversation 6 · vocabulary 8 · grammar 8 · reading 28 | B1 → B2 |
  | Suankularb M.4 (GATE / EPLUS+) | 50 · 60 min | conversation 6 · vocabulary 8 · grammar 10 · error 6 · cloze 8 · reading 12 | B1+ → B2 |
  | Satit Prasarnmit M.4 (standardised-test style) | 50 · 60 min | vocabulary 10 · grammar 12 · error 8 · academic reading 20 | B2 → C1 |
  | Triam Udom Suksa M.4 (cloze + reading core) | 50 · 60 min | conversation 5 · error 10 · cloze 15 · reading 20 | B2 → C1 |
  | A-Level English (TCAS, official blueprint) | 80 · 90 min | short conv. 12 · long conv. 8 · ads 6 · review 6 · news 8 · visuals 8 · articles 12 · text completion 15 · paragraph organisation 5 | B1+ → C1 |
  Practice targets: Suankularb GATE 70 % / EPLUS+ 85 %, Satit 75 %, Triam Udom 80 %, A-Level 70 %. The
  earlier combined papers are replaced automatically on start (past results kept).
- **Nothing is ever deleted.** Database triggers copy every earlier version and every removed row into
  a permanent archive (the archive itself refuses changes). "Delete" in the back office now **archives**
  a person, enrolment, lesson, payment or request; **Settings → Archive & history** lists and restores
  them, and the **History** button on a record shows its earlier versions. "Erase all data" is gone,
  restoring a backup archives instead of removing, the consent log is kept, and the database copy from
  the 1st of each month is kept for good.
- **5 example learners** (with parents, 2 example teachers, enrolments, payments, a pending request and
  lessons placed from their weekly days and times) are added once on start, tagged with an amber
  **Example** label in lists, the enrolment page and the calendar.
- **Schedule PDF: full or remaining.** Each enrolment (back office and the parent / learner portal) prints
  the full schedule from the first lesson or only the remaining lessons from today, at any time.
- Home page shows all 8 free full tests; test pages, menus and reports use the new papers.

## 5.9 r1 — October 2026
- **M.1 and M.4 entrance papers are now English only** — 60 four-choice questions in six parts, 3 papers each:
  | Paper | A conv. | B vocab. | C grammar | D error | E cloze | F reading | Time |
  |---|---|---|---|---|---|---|---|
  | M.1 Suankularb (GATE + EP on one paper) | 8 | 10 | 12 | 6 | 8 | 16 | 60 min |
  | M.1 Satit Prasarnmit | 10 | 10 | 12 | 6 | 7 | 15 | 60 min |
  | M.4 Suankularb (GATE + EP on one paper) | 6 | 10 | 12 | 8 | 8 | 16 | 75 min |
  | M.4 Triam Udom Suksa (cloze, reading, error weighted) | 4 | 8 | 10 | 10 | 12 | 16 | 75 min |
  | M.4 top schools (general) | 8 | 10 | 12 | 8 | 8 | 14 | 75 min |
  Part mixes follow tutor summaries (schools do not publish papers). Difficulty rises from set 1 to set 3;
  answer positions are balanced; every question has what it measures and its topic.
- **Error identification:** four underlined parts in the sentence (`[[text]]`), choices kept in sentence order.
- **Results by part (A–F)** on screen, in score reports and PDFs; practice targets GATE 65 % / EP 80 %
  (Suankularb M.1 and M.4), Satit 70 %, Triam Udom 75 %, top schools 70 %.
- Test screens show part headings and part tabs; the public tests page, menus and home cards list the
  M.1 / M.4 English papers. The earlier multi-subject M.1 papers are replaced automatically on start
  (past results kept).

## 5.8 r1 — October 2026
- **All test sets rewritten — harder, longer, in each test's real style and full length.** Every set
  was checked by `tools/check_sets.py`; every maths and science answer was verified by script.
  - **SAT Reading and Writing:** 3 full tests of 54 questions (Module 1 + the harder Module 2,
    32 minutes each, cs 7 · ii 7 · sec 7 · eoi 6 per module), College Board style, real-test vocabulary,
    support/weaken, data-table and punctuation items.
  - **IELTS Academic:** 3 full tests — Reading 3 passages (~2,700 words, exactly 40 questions, 10–11
    question types per test) + Writing Task 1 and Task 2.
  - **Suankularb M.1 — GATE and English Program on one paper** (as the school does: EP applicants need a
    higher English score): 3 papers × 120 questions in 3 hours — Maths 40 (10 written answers), Science
    40 (5 written answers), English 20 (B1–B2, cloze, long reading), Thai 20.
  - **New: Satit Prasarnmit M.1 (Trilingual Plus+):** 3 papers × 185 questions — Maths 25 (5 in English),
    Science 50 (10 in English), Thai 60, English 50. Format from public tutor summaries.
  - **Every question says what it measures and what it is about** (`skill` and `topic`); results group
    by subject, topic and skill.
  - **Written answers (อัตนัย)** for M.1 papers: typed numbers/words, accepted in equivalent forms
    (13/28 = 26/56, "35 %" = 35).
  - Updated sets **replace their previous version automatically** on the next start (old items retired,
    past results kept); the removed EP-only sets are taken down.
- **Free tests page:** set 1 of every exam is free **in full**, with a large on-screen timer (SAT as two
  timed modules, IELTS Reading then Writing); sets 2–3 have samples. Larger, easier-to-read type and
  subject colours.
- **Results summary on screen** (public page and student portal): score, GATE/EP and Satit practice
  targets, by subject, by topic (weakest first), SAT by skill, IELTS by question type, and a table of every
  question — what it measures, its topic, your answer and the key — then explanations.
- **PDFs:** question paper, paper with answer key and results summary on the public page; in the portal
  every set has a "⬇ PDF" button for learners (student copy with notes column) and the score-report PDF
  now lists topics, targets and every question.
- **Student portal test screen:** larger type and choices, colourful header, big timer (h:mm:ss, red in
  the last minute), subject tabs and grouped question map for M.1 papers, full SAT sets run as two timed
  modules.
- **Menus grouped:** public top menu has dropdowns (Courses · Tests & admissions · About) with short
  descriptions; the back office has a "Tests & classes" group with all test pages together.
- Starter news updated for the new sets.

## 5.7 r2 — October 2026
- **Free practice tests on the public website — no sign-in** (`pages/tests.html`, menu "Free tests",
  and a new "Try SAT, IELTS and Suankularb M.1 questions now" section on the home page). Each of the 12
  ready-made sets has free sample questions: SAT 6, GATE/EP 10, IELTS a full Reading passage with every
  question type plus both Writing tasks. Answers are checked in the browser with explanations; the full
  timed sets stay in the student portal ("Sign in & take the full test").
- **News and tests now show even without the server** (opening `index.html` directly or plain static
  hosting): `assets/data/news.js` and `assets/data/tests.js`, built by `tools/build_public_data.py`.
- **Real photos on the news.** On the computer that runs the server, starter posts swap their drawn
  cover for a free-licence photo from Openverse (CC0, public domain, or CC BY / BY-SA with the credit on
  the card and under the article). Without internet the drawn covers stay.
- **Longer starter articles** (about 700–1,000 words in each language) and three new ones. Starter
  posts that staff have not edited are upgraded automatically; edited or deleted ones are left alone.
- Top menu: "Partners" moved to the menu drawer and footer to make room for "Free tests".

## 5.7 r1 — October 2026
- **Every page is in the menu; rights follow the user level.**
  - The back-office menu is grouped (Learning · Teaching · Administration · General). Pages a person
    cannot open show a lock; clicking one explains which level is needed. Typing the address also lands
    on that page.
  - **Settings → Menu & permissions** (admins): untick a box to take a page away from teachers,
    students or parents, and choose whether locked pages are shown at all. Rights can only be
    limited — a level never gets more than it was built for, and admins always keep every page.
  - The server enforces it for the online-test, item-bank, marking, question-set, live-class, PDF,
    blog and AI routes (`server/access.py`); core records keep their own server rules.
- **News slider on the home page**, right below the hero: the latest 8 posts as cards with cover
  pictures that move on every 5.5 seconds. Each card opens its article on the blog page; "All news" goes
  to the blog. It stops while the pointer or keyboard focus is on it, has previous / next / dots /
  pause, swipes on phones, and does not move by itself for people who ask for reduced motion.
- **Seven starter news posts** (both branches, Thai and English, with drawn covers): Suankularb M.1
  GATE/EP practice sets, the Digital SAT RW format, IELTS Reading question types, TCAS70 Round 1,
  Swift Student Challenge, using AI for homework, and live classes. Published once on first start;
  staff can edit, archive or delete them.
- **12 ready-made admission and practice test sets (3 per exam), all original:**
  - **SAT Reading and Writing** — 3 × one full 27-question module (cs 7 · ii 7 · sec 7 · eoi 6), 32 min,
    easier → harder from set 1 to set 3.
  - **IELTS Academic** — 3 × full Reading (3 passages, exactly 40 marks, 15 question types across the
    sets) + Writing Task 1 and Task 2; two sets each (Reading 60 min, Writing 60 min).
  - **Suankularb M.1 GATE Program** — 3 × 40 questions (Maths 15, Science 15, English 5, Thai 5), 90 min.
  - **Suankularb M.1 English Program (EPLUS+)** — 3 × 40 questions in English (English 20, Maths 10,
    Science 10), 90 min.
  - Loaded automatically on first start as approved bank items + published question sets, and shown
    to learners under **Online tests → Admission & practice test sets**. Each set can also run as a
    live class or print as student / teacher PDFs. **Item bank → Load ready-made sets** adds anything
    missing without overwriting edits. Every maths answer was checked by a script; `tools/check_sets.py`
    checks the format rules.
- **New exam type "M.1 entrance" (`m1`)**: four-choice questions with programme (GATE / EP) and
  subject, optional reading text / table / picture, explanations in Thai and English. Works in the bank
  editor, practice by subject, timed sets, the live class, PDFs, score reports and calibration.
- **Question sets** can now be opened to learners (timed, with their own minutes), hold up to three
  IELTS passages, hold IELTS Writing tasks, and hold M.1 questions.
- `DD_SEED=0` starts a server without the ready-made sets and starter news (used by the tests).

## 5.6 r1 — October 2026
- **IELTS Academic Reading now covers the real range of question types**, not only "one of four".
  - **Choice from a fixed set:** True/False/Not Given and Yes/No/Not Given.
  - **Multiple choice, one answer:** 3–5 options (A–C … A–E).
  - **Multiple choice, choose TWO or THREE letters:** from a longer list (A–E / A–G), worth one mark
    per correct letter. Choosing more letters than asked scores 0. Numbered as a range, e.g. 13–14.
  - **Lists longer than the questions:** matching headings (i, ii…), matching information (paragraph
    letters, added automatically), matching features and sentence endings.
  - **Summary completion from a box of words:** lettered list with at least 2 extra words.
  - **Completion with words from the passage:** sentence, summary, note, table and flow-chart
    completion, diagram labels and short answers. Word limits are checked, and the notes / table /
    flow-chart / summary text is shown with numbered gaps.
  - **Totals:** passage and test totals count marks; a full test is exactly 40 marks.
  - **Format checks:**
    - the official instruction wording ("Choose TWO letters", "NO MORE THAN TWO WORDS…") must match the settings
    - a word box needs extra words
    - note/table/flow-chart tasks need their text
  - **Supported everywhere:** the test player, the live class (both modes), the PDFs, the answer
    shuffle and the AI drafting instructions.
  - **Sample passage:** now includes a "Choose TWO letters" question.
- **Checked against the IELTS Academic summary (Oct 2026, `docs/IELTS-ACADEMIC-2026-TH.md`).**
  - **Reading band table:** 32–34 correct = 7.5 (was 33).
  - **Answer checking:**
    - numbers count whether written as figures or words
    - capitals don't matter
    - spelling and singular/plural must match
    - a hyphenated word counts as one word
  - **Matching rules:**
    - a heading or sentence ending can't be used twice
    - a paragraph or feature letter can be reused only when the instructions say "NB You may use any letter more than once"
    - there must be more endings than sentence beginnings
  - **Writing feedback follows the official guidance.** A short answer may not show enough for a high
    band, but there is no fixed deduction. Off-topic writing, notes or bullet points, copied text and
    memorised scripts are penalised. Task 1 needs an overview and no opinion.
  - **IELTS course info:** computer-delivered only from mid-2026 (some centres offer Writing on paper);
    results in about 3–5 days.
- **Checked against the Digital SAT Reading and Writing summary (Oct 2026, `docs/SAT-RW-2026.md`).**
  - **Already matched:**
    - 2 × 27 questions (25 scored + 2 unscored pretest), 32 minutes each
    - 4 choices, passages of 25–150 words
    - the domain blueprint (14/14/14/12 per test, inside the official ranges)
    - fixed domain order, easy → hard
    - answers locked once a module is submitted; no wrong-answer penalty
  - **Added Bluebook-style tools:** Highlights & Notes, Line Reader and Zoom, alongside Mark for Review,
    Option Eliminator, the question menu and the hideable timer. The same tools work in IELTS Reading.
  - **Graphs:** quantitative-evidence questions may use a bar or line graph image as well as a table.
  - **Results:**
    - the estimated RW score shows College Board's published percentile among SAT takers
      (600 → 72nd, 700 → 92nd, 800 → 99th)
    - the easier-module ceiling and the routing threshold are labelled as our unofficial estimates
      (College Board publishes neither) and can be adjusted in settings
  - **Error log:** after a test, learners tag each missed question (vocabulary gap, reasoning gap, grammar
    rule, misread, time, trap answer). A table by domain × cause shows what to drill first.
  - **AI drafting** builds wrong answers in the official distractor patterns (contradicts, unsupported,
    half of a two-part claim, wrong connector, real but wrong word sense) and follows the Standard English
    Conventions difficulty ladder.
  - **SAT course info:** Bluebook, 25 + 2 questions per module, 10-point steps; RW 700 ≈ 92nd percentile.
- **IELTS Writing:** tasks must carry the official instructions.
  - **Task 1:** "Summarise the information by selecting and reporting the main features…".
  - **Task 2:** "Give reasons for your answer and include any relevant examples…".
  - **Both:** "Write at least 150/250 words".
- **PDFs: clear disclaimer and legal rights.**
  - **Page 1:** a highlighted "Disclaimer & rights" box (practice material, not an official test;
    no affiliation; scores are estimates; © all rights reserved; traceable copy).
  - **Last page:** a full bilingual "Legal notice, licence and disclaimer", covering:
    - copyright and ownership (Thai Copyright Act B.E. 2537)
    - the licence granted
    - what is not allowed (including uploading to AI tools)
    - trademarks and independence
    - disclaimer of results and accuracy
    - tracking and verification
    - PDPA for score reports
    - permissions, contact and governing law
  - **Every page:** the footer states the rights and the verify link.
  - **Teacher copies:** marked confidential.
  - Have the wording reviewed by a Thai lawyer before relying on it.

## 5.5 r1 — October 2026
- **Question sets** (back office → Question sets; `server/qsets.py`).
  - **What a set is:** a named list of approved questions that records each question's version.
    Later edits in the bank do not change it.
  - **One set, three uses:**
    - **Student PDF:** a NOTES column beside every question, to hand out before class.
    - **Teacher PDF:** the answer key.
    - **Live class.**
    All three have the same questions in the same order with the same answer order.
- **Live class, two modes.**
  - **Teacher-led:** one question at a time.
  - **Self-paced:** learners work through the whole set on their own device, with an optional
    time limit. The teacher watches a live grid (learner × question, right/wrong, % correct per
    question; tap a column to see that question) and reveals all the answers at the end, then
    steps through them.
- **Separate share screen.** "Open the share screen" opens a window for Zoom or the projector.
  - **Share screen:** questions, join code and progress only. No learner names, and the key is
    never sent to it before reveal.
  - **Teacher panel:** keeps the key, every learner's answers and the grid.
- **Shuffled answer order, same questions.**
  - **What is shuffled:** SAT choices, IELTS multiple-choice options and the lists for matching
    headings, features and sentence endings (relabelled i, ii… / A, B…).
  - **What stays fixed:** True/False/Not Given, paragraph letters and completion answers, because
    their order is part of the task.
  - **When the order changes:**
    - every online test gets its own order
    - every quick live class gets its own order
    - a question set keeps one order for its PDFs and live class; "New answer order" makes a new
      version, and the PDF shows which version it is
  - Can be switched off in the item bank's settings.
- **Stricter format checks.**
  - **SAT:** explanations must not refer to letters (answers are shuffled); questions must end with "?".
  - **IELTS Reading:** completion and short-answer instructions must state the word limit, and it
    must match the set limit.
  - **IELTS Writing:** tasks must say "Write at least 150/250 words".
- **Scheduled item drafting** (Exam item bank → Settings & schedule).
  - **Schedule:** chosen days and hour.
  - **Amounts each time:** SAT questions per domain, IELTS passages and Writing tasks.
  - **Status:** everything arrives as a draft for a teacher to check and approve. Runs from the
    same timer URL as the blog.

## 5.4 r1 — October 2026
- **Live class** (back office → Live class; `admin/live.html`, `server/live.py`).
  - **Teacher screen:** for the projector. Shows a 6-letter join code, the same question on
    every screen, live answer bars, the roster of who has answered, and the controls
    Open / Close / Show answer / Next / End.
  - **Teacher options:** an optional timer per question, and "hide key" for the projector.
  - **Learners:** join from Online tests → "Join a live class". They see whether they were right,
    and the explanation, after the reveal; at the end they see their score.
  - **Content:** SAT questions or the questions of an IELTS Reading passage.
  - **How it runs:** screens poll every 1.5 s, which works on any WSGI host.
  - **Answer key:** sent only to the teacher until the reveal.
- **Audited PDFs** (back office → PDF documents; `server/exports.py`, `admin/js/audit-pdf.js`).
  - **Two kinds:** test papers made from approved items, with an optional teacher copy that has
    the answer key; and learner score reports, available from the results page.
  - **What every PDF carries:**
    - the logo
    - who created it and when, and who generated this copy and when (Bangkok time)
    - a verification code and QR code
    - usage instructions
    - the legal, copyright and trademark notice (plus a PDPA note on reports)
  - **On every page:** a footer with the code, date and page number, and a faint watermark of the code.
  - **What the server records:** the exact item versions used (so a re-download is identical) and
    every download. Admins can revoke a document.
  - **Public verify page** (`pages/verify.html`): shows whether a printed copy is genuine, with
    names partly masked and no questions.
- **Difficulty from real results** (Exam item bank → "Results & difficulty"; `server/calibrate.py`).
  - **Data used:** finished tests and live classes; staff previews are not counted.
  - **Per question:** p (share correct) and r (discrimination).
  - **Suggestions:** easy, medium or hard (SAT) and level 1–3 (IELTS passages), shown once
    there are enough answers (default 20).
  - **Flags:** very hard (check the key), too easy, weak discrimination.
  - **Applying:** apply one or all suggestions; each change becomes a new item version with the
    evidence in its note. Pretest items with enough data can be switched to scored.
- **Other:** backup, restore and erase include live classes, documents and their logs.
  Added `docs/LOCAL-TEST-TH.md`, a Thai checklist for testing everything on your own computer
  first. QR codes use qrcode-generator (MIT) in `admin/vendor`.

## 5.3 r1 — October 2026
- **News blog written with AI, checked by people** (`server/blog.py`, `pages/blog.html`, back office → News blog).
  - Two branches: **STEM, AI & SI technologies** (AI & SI, coding & Apple tech, STEM & innovation,
    research & competitions) and **Standard tests & higher education** (TCAS, SAT, IELTS & English,
    medicine, study abroad, scholarships). Categories are editable.
  - **Write with AI:** give a topic and scope. Or leave the topic empty and the AI picks a recent one.
    - Claude searches only the trusted sites of that branch and writes Thai + English versions in our tone.
    - Only sources the search really returned are kept.
    - The draft waits in "review".
  - **Automatic writer:** chosen days and hour, 1–3 posts each time, taking turns between categories.
    "Auto-publish" can be allowed per category, and only when every check passes.
  - **Cover images:**
    - a free-licence photo from Openverse (CC0, public domain, CC BY, CC BY-SA), with the credit shown under it
    - or an AI drawing (SVG, rebuilt from a safe allow-list)
    - or an upload
  - **Checks before publishing:**
    - both languages and a full text
    - at least one source for AI posts
    - no banned phrase
    - photo credit present
  - **Status flow:** idea → drafting → review → scheduled/published → archived/rejected, with history and audit.
  - **Public pages:** a "News" link in the menu, the blog page with branch tabs and category chips,
    an article page (sources, AI label, "check the official site" note), and latest-news cards on the
    home and admissions pages.
- **Online tests: SAT Reading & Writing, IELTS Academic Reading and Writing** (`server/exams.py`,
  back office → Online tests / Exam item bank / Writing marking, full-screen `admin/exam.html`).
  - **SAT R&W full test:** 2 adaptive modules × 27 questions × 32 minutes.
    - Domain order and easy→hard inside each skill group.
    - Up to 2 unscored pretest items per module.
    - Module 2 is harder or easier depending on module 1.
    - Answers can change only inside the current module.
    - Mark for review, answer eliminator, question navigator, "check your work".
    - Score estimate 200–800, with the easier-route ceiling.
  - **IELTS Reading full test:** 3 passages, exactly 40 questions, 2,150–2,750 words, 60 minutes.
    - All official question types.
    - Spelling and word limits are checked.
    - Band estimate from the 40 answers.
  - **IELTS Writing full test:** Task 1 (150+) and Task 2 (250+) in 60 minutes.
    - Live word count, no spell-check.
    - AI suggests a band per criterion; a teacher confirms it.
    - Task 2 counts twice as much as Task 1.
  - **Practice modes:** SAT by topic, one reading passage, one writing task.
  - **Timing and data:** time is kept by the server and answers save automatically. Answer keys
    reach the browser only after the end. Every attempt keeps a snapshot of its items.
  - **Item bank:**
    - statuses draft → review → approved → retired, every version kept
    - checks follow the real format
    - an "original content" confirmation is needed to approve
    - AI drafts items, teachers approve
    - readiness meter
    - 11 original sample items
  - **Results:** parents see their children's results; teachers see their students'.
- **AI settings** (back office): model, effort, monthly job and dollar limits, prices, and a log of
  every call with tokens, searches and cost.
  - The API key stays in the server environment (`ANTHROPIC_API_KEY`).
  - Refused requests fall back to Anthropic's recommended model.
- Backups and restore include blog posts, exam items, attempts and their settings.
  "Erase all" clears them too. Pop-ups can also target the News page.
- `docs/PLAN-AI-BLOG-SAT-IELTS.md` and `server/DEPLOY.md` (AI set-up) updated.

## 5.2 r1 — October 2026
- **"Minimum score or winning score?"** (Admissions page), in our own words:
  - the three ways scores are used: entry ticket, ranking score, whole-person review
  - how to read an admission announcement
  - how each system uses scores: Thai international programmes, TCAS Round 3, UK, US,
    Singapore
  - a table of published minimums vs. our target scores, and our rule of thumb
- Every test-prep course summary now says that a minimum lets you apply but does not
  guarantee a place. New FAQ on "IELTS 6.5 — does everyone with 6.5 get in?".
- `server/DEPLOY.md`: PythonAnywhere 2026 plans:
  - the Developer plan is about $10
  - new free accounts have no scheduled tasks or MySQL
  - this app is a WSGI app, so it does not depend on the ASGI beta
- `docs/TECH-REVIEW-2026-10.md`: review of the React/Next.js/Vercel vs. Django/PythonAnywhere advice.

## 5.1 r1 — October 2026
- **Test prep by category** (Admissions page, `assets/data/prep.js`), six categories as briefed:
  - **International High School Equivalency:** GED, IGCSE, A-Level (Cambridge/Edexcel), IB
  - **University Admission Requirements:** SAT, ACT, CU-ATS, CU-AAT, MUIC entrance, IELTS,
    TOEFL, Duolingo, CU-TEP, TU-GET
  - **International Demonstration Schools:** MUIDS, SPIP, KMIDS
  - **Medical Prep:** TBAT, UCAT, AKAT, TPAT1, IELTS, CU-AAT, Portfolio & MMI
  - **Engineering / Science:** SAT, ACT, CU-ATS, IELTS, TGAT·TPAT3, A-Level (TCAS),
    TMUA·ESAT, COMPAS·POSN
  - **Others:** Art & Design, ASEAN Scholarship, AFS, General English/Maths, TOEIC, Interview
  - Each item opens its course summary, or the contact form when there is no fixed course.
- **Everything is stored in the database with a status.**
  - **Courses:**
    - status Open / Closed for now / Cancelled
    - Shown or Hidden on the website
    - only open courses can take new enrolments
    - the website shows badges, a waiting-list note in the summary, and hides hidden courses
  - **Test-prep catalogue** (back office → Website content): categories and items with
    status and shown/hidden; add, edit, reorder, delete; reset to the built-in content.
  - **University finder** (back office → Website content → University finder): add any
    university or programme, edit, hide or delete. The website states that the list is a
    sample of popular programmes, not the full list.
  - Public `GET /api/catalog` sends only what is shown. Hidden entries never leave the
    server, and links are checked. Writes are admin only, and everything is included in
    backup and restore.
- `config.js` `live` switch for hosting without the server; the checker loads `prep.js`.

## 5.0 r1 — October 2026
- **One path, two strengths.** STEM & AI and test prep are shown as one plan:
  core academics → STEM & AI → tests & competitions → university. This appears on the home
  page and the Admissions page (`D.journey`).
- **New group: Core Academics — Maths · Physics · English** (intensive, level by level):
  - MTH130, PHY130, ENG130 for M.1–M.3
  - MTH230, PHY230, ENG230 for M.4–M.6, aimed at A-Level Maths 1 and Physics, SAT/CU-AAT,
    TPAT3, TBAT, TGAT1 and the IELTS/SAT bridge
- **New test courses**, each with test facts (where it is used, round, validity, scores):
  - TGT220 TGAT & TPAT3
  - ALV240 A-Level intensive
  - TPT310 TPAT1 (กสพท) & MMI
  - UCT300 UCAT, for Ramathibodi Portfolio, CICM and UK/ANZ medicine
  - UKT320 TMUA & ESAT for Cambridge, Imperial and Oxford
- **University & test finder** on the Admissions page:
  - 7 fields × Thai track / international programmes / abroad
  - Thai programmes: Chula, Mahidol (Ramathibodi, MUIC, pharmacy), Thammasat (CICM, BBA,
    SIIT), KMITL, KMUTT, Chiang Mai, Chulabhorn Royal Academy (PSCM), Phramongkutklao, the
    กสพท route, CU-MEDi (graduate entry)
  - Abroad: the USA, UK, Australia and Singapore
  - Each card shows the tests, key requirements, the courses that prepare for them, and a
    source link
- **TCAS in brief:** the 4 rounds and TGAT, TPAT1–5 and A-Level, with the TCAS70 dates.
- The Admissions page is reorganised: path → finder → TCAS → test details → TBAT → all branch
  courses grouped by goal → computing exams → portfolio → method → timeline → FAQ. The old goal
  chooser is replaced by the finder, and two FAQs are added.
- `tools/check_catalogue.js` also loads `pathways.js`: 79 courses, 11 tracks, 7 groups and
  298 course references are checked.

## 4.9 r1 — October 2026
- **Pop-up promotions on the public website** (`assets/js/popup.js`):
  - Shows image, title, text and a button in Thai/English.
  - Appears only after the visitor has answered the cookie bar, so the two never stack.
  - At most one per visit; never on the privacy page.
  - Esc, ✕ or a click outside closes it. Respects reduced motion and works on phones.
- **Back office → Pop-ups** (`admin/js/popups.js`, admin only):
  - Create, edit, duplicate, preview and delete pop-ups, with a picture upload that is resized
    in the browser.
  - A **global on/off switch** plus a switch per pop-up.
  - **Scheduling:**
    - start and end date/time (Bangkok)
    - weekdays
    - a daily time window, which may cross midnight
  - Settings per pop-up:
    - pages: all, or chosen pages
    - frequency: every visit / once a day / only once
    - delay
    - priority
  - Each pop-up shows its live status: showing now · scheduled · outside its days/hours ·
    ended · off.
- **Server** (`server/popups.py`):
  - Validates every pop-up: links (no `javascript:`), images (PNG/JPEG/WebP or https),
    times, at most 50 pop-ups.
  - Decides what is live. `GET /api/popups?page=` is public and returns only display fields.
  - `GET/POST /api/popups-admin` is for admins.
  - Pop-ups are included in backup and restore, and re-checked on restore.
- Form fields for the whole back office: image upload and multi-choice checkboxes.
- Cookie policy table lists `dd-promo-…`. Without preference consent it lasts only until the
  tab closes.

## 4.8 r1 — October 2026
- **Short course summary on click:**
  - Each summary has the course in one line, a few key facts and a short list of what you
    will learn.
  - Key facts: **approximate length as a range** (hours and weeks; it depends on level and
    pace), level and starting point, and how you can study.
  - Then what you'll be able to do and the final project.
  - A **"Want the details? Contact our staff."** box links to the contact form and email,
    plus phone and LINE once they are set in `assets/js/config.js` → `contact`.
- **Standard-test courses** also show "About the test", checked October 2026:
  - what the test measures and its format
  - a table of **where you can use it** (university · faculty/programme · admission round),
    e.g. TBAT → Chula Medicine and Dentistry and Khon Kaen Medicine, TCAS70 Round 1 Portfolio
  - **how long the result lasts**
  - **which score for which target**, e.g. IELTS 6.0–7.5 for TU/Chula BBA, Melbourne and the
    UK; SAT/CU-AAT minimums for Chula ISE, BBA and BBTECH; TBAT/CU-AAT for Chula Dentistry;
    COMPAS pass and AWARD rules; POSN camps and quotas
  - each with a note to ask our staff for the current announcement, and the official site
- **Essential foundations** (PY101, AI100, MTH110, DSA210, WEB101, SQL120, GIT110, SCR090) are
  shown right after the new-era picks.
- **Programs page simplified** from 11 sections to 6:
  - hero → catalogue → how we teach → study modes → plan builder → FAQ
  - the catalogue overview is now a compact directory of all courses by group, not 18 big
    cards; the format filter is removed
  - COMPAS/HKICO exams and the exam method moved to the Admissions page; domain paths moved
    to the Research page
- Fix: switching theme during a page change no longer throws an unhandled error.
- `tools/check_catalogue.js` also checks that every test-prep course has complete test
  information.

## 4.7 r1 — October 2026
- **Cookie consent bar (PDPA):**
  - A full-width bar at the bottom of the screen with a clear explanation, a link to the
    cookie policy, and **Cookie Settings · Reject All · Accept All**. Reject All and Accept All
    look identical, so refusing is as easy as agreeing.
  - Nothing is pre-selected, and the site stays usable behind the bar (no cookie wall).
  - Shown at the **start of every visit, on whichever page the visitor lands**, with the
    current choice. It is not asked again on later pages of the same visit.
  - The settings dialog also has Reject All / Accept All / Save my choices. Withdrawal is
    always available from "Cookies" in the footer.
- **Proof of consent:**
  - Every choice is logged on the server (`POST /api/consent`, table `consent_log`): a random
    reference, the time, the policy version and the choices. No name, email or IP address.
  - Records are deleted after 3 years.
  - Admins can download the log as CSV in Settings → Cookie consent records. "Erase all
    data" clears it.
- Consent policy version is now 5, so everyone is asked again. The privacy page and cookie
  table are updated.

## 4.6 r2 — October 2026
- **Always the current version in the browser.**
  - Every stylesheet and script link carries `?v=<version>`, so browsers cannot keep showing an
    older release from cache.
  - `tools/set_version.py "x.y rN"` updates VERSION, the footer and all links in one step.
- **Start-up fixes.**
  - `start.sh` / `start.bat` used to open the browser before the server started. If an older
    DeepDistrict was still running on port 8000, the browser showed that old site.
  - Now the server opens the browser itself, once it is listening.
  - If 8000 is busy, it says so and uses the next free port (8001, …).
  - On Windows a second server can no longer share the same port.
  - The start-up message and `/api/status` show the version.

## 4.6 r1 — October 2026
- **Course groups** above tracks, used in the catalogue, the home page and the back office:
  - Foundation Programming
  - Software & App Development
  - AI & Data Science
  - Hardware, Robotics & Edge AI
  - Research & Innovation
  - Standard Tests & Admissions
- **12 new-era picks**, shown first on the home page and in the catalogue (★ filter):
  - Vibe Coding (ACE110), AI agents for code (ACE220)
  - STEM AI on Raspberry Pi 5 (EDG220), frontier AI agents (SI410)
  - Swift & SwiftUI Playgrounds (SWF110), Swift Student Challenge (SSC250)
  - Apple Intelligence & on-device AI (IOS340), Apple Vision Pro & visionOS (VOS350)
  - Innovation Lab (INNO), competitions (RES330)
  - POSN computer olympiad (EXM230), COMPAS-PY1 (EXM210)
- **11 new courses** and a new track, "Cloud, Security & DevOps":
  - SCR090 Scratch & creative coding, CP230 competitive programming
  - SQL120 databases & SQL, GEN120 generative AI for students, RL340 reinforcement learning
  - SEC220 cybersecurity & CTF, CLD230 cloud/Linux/DevOps
  - INN120 design thinking, ENT230 tech entrepreneurship
  - EXM230 POSN (สอวน.) prep, VOS350 Apple Vision Pro & visionOS
- **Updated courses**:
  - ACE110 is now "Vibe Coding: Build Real Apps with AI"
  - SWF110 is now "Swift & SwiftUI Playgrounds"
  - IOS340 now covers Apple's Foundation Models framework, the Vision framework and Core ML
  - the Apple track covers Apple Intelligence and visionOS
  - the plan builder suggests the new courses
- **Catalogue**:
  - The overview groups the courses: the picks first, then each group.
  - Group chips lead to that group's track chips.
  - Links such as `?group=` and `?track=` select the right group.
- **Back office**:
  - The Courses page shows one table per group.
  - Course drop-downs are grouped.
  - Custom courses have a "Group" field, saved in the database (records without one show
    under "Other / custom").
- `tools/check_catalogue.js` checks every course, track, group and course-code reference.

## 4.5 r1 — October 2026
- New branch **DeepDistrict Admissions** (`pages/admissions.html`): preparation for IELTS
  Academic, Digital SAT Math, Digital SAT Reading & Writing (EBRW), **TBAT**, CU-AAT Math and
  CU-AAT Verbal, plus an admissions portfolio, personal statement and interview course.
  - Test explorer: format, timing, scoring, key facts, official links, and the date the facts
    were checked.
  - "Where are you applying?" chooser: Thai international programmes, Thai international
    medicine & health, UK/Europe/Australia, US.
  - A note that the BMAT was discontinued and replaced by the TBAT, the portfolio building
    blocks, a 6-step method, an M.4–M.6 timeline and an FAQ.
  - A prominent **"rules change fast, ask us for the latest update"** notice, also shown in
    every course dialog in this branch.
  - New track and 7 courses (IEL200, SAT210, SAT220, TBT300, AAT210, AAT220, PFL200), also
    available for enrolments in the back office.
  - New contact topic "Admissions & test prep"; the request is pre-filled with the chosen goal
    and courses.
- **Cookie consent (PDPA)**:
  - The home page asks on every visit (once per browser session) and shows the current choice.
  - "No thanks" and "OK" now look the same; nothing is pre-selected.
  - Policy version raised to 4, so everyone is asked again.
  - Cookie policy updated: the session flag, free choice, withdrawal, and children under 10.
- Header: the menu collapses below 1300 px and the header button shows from 1640 px, so the
  navigation never overflows.

## 4.4 r1 — October 2026
- **Notifications** in the app (bell + inbox), by **email** and by **LINE Official Account**
  (free plan): enrolment & schedule, receipt, new request (admins), request decided, lesson
  moved/cancelled, lesson completed with hours left, reminder the day before, hours running low.
- Personal settings: topics, channels, Thai/English. **Connect LINE** with a 6-digit code; the
  LINE chat answers "schedule" and "hours" for free.
- Admin: topics on/off, reminder time, monthly LINE limit with usage meter (several messages to
  one person are grouped into one push), LINE setup, test message, sent log, a timer link for
  hosts without background jobs.
- **Installable app (PWA)** for Android and iPhone: manifest, app icons, offline app shell,
  bottom tab bar on phones. No app store needed.
- New transparent **horizon logo** (`logo-horizon*.png`) for dark and light backgrounds.
- Plan for posting news from the portal: `docs/NEWS-POSTING-PLAN.md`.

## 4.3 r1 — October 2026
- Enrolment form with **regular days & times per day** (different time/room each day) that
  creates all lessons automatically until the hours are used, records a payment, and opens an
  **enrolment confirmation** (schedule + fees + receipts).
- **Clash detection** (same teacher, learner or room) with a confirm-or-go-back pop-up on every
  create / edit / move / generate / approve.
- Calendar **week time-grid**: colour per teacher, overlapping lessons side by side with
  start–end, course, learner, teacher, mode and room; red outline for same-teacher overlaps;
  teachers see other teachers' slots without learner details.
- **Requests approved by DeepDistrict** (admins; optional for teachers); new **time off**
  request with postpone/cancel; stored result shown to parents; requests report.
- **Documents with logo + official stamp**: receipt (Thai/English amount in words, numbered),
  learning schedule, enrolment confirmation, reports, search results.
- **Email** documents as PDF/PNG via SMTP (Settings → Email), with share/mail-app fallback.
- **Search** across lessons, enrolments, people, payments and requests with export.
- Fix: changes made while a previous save was still running could be skipped; screens now also
  refresh when moving between pages.

## 4.2 r1 — October 2026
- **Server** (`server/app.py`, Python standard library + SQLite): sign-in for admins, teachers,
  students and parents; role-based data access enforced on the server; HttpOnly session cookie,
  PBKDF2 passwords, login throttling, CSRF header; daily database backups; backup/restore API;
  WSGI entry point for free hosting (PythonAnywhere). `start.sh` / `start.bat` now start it.
- **Hours** shown everywhere as Total · Learned · Remaining · Booked · To schedule, with a
  two-part progress bar and a "hours without a lesson" alert.
- **Move / reschedule lessons**: original kept as "Moved", new lesson linked; a shorter lesson's
  missing hours can go to the next regular lesson, a make-up lesson, or stay "to schedule".
- **Change requests** from students and parents; teachers/admins approve (move form pre-filled)
  or decline with a reply.
- **Learner / parent portal** ("My learning"): hours, next lessons, recently learned, fees,
  reports as PDF/PNG, requests, calendar.
- Reports include "Still to book" and "Schedule changes".
- Demo data reproduces the Monday→Tuesday (1 h) case.

## 4.1 r2 — October 2026
- No fixed course hours on the public site: cards show the track, the course overview says
  "Length: tailored to you", the plan builder shows levels, the fees FAQ and the curriculum
  document no longer list hours. Default hours stay in the back office for building packages.

## 4.1 r1 — October 2026
- **Back office** (`admin/`): staff sign-in with roles (admin, teacher), people, enrolments with
  hours purchased / used / left / booked, lessons log with what was learned, weekly scheduling,
  payments and balances, course prices and availability, dashboard alerts, month/week/list
  calendar with `.ics` export, learner reports exported as PDF, PNG, TXT, CSV or print, backup
  export/import, Thai/English, light/dark.
- Course catalogue simplified: one row of track chips, one filter line (search + level + format),
  cleaner cards, first 12 courses with "Show all", and a one-screen course overview.
- Consent made friendly: a small card with one sentence and two buttons; settings list only what
  is used. Contact form needs a single consent tick.
- Privacy notice: learner records section. Footer: Staff link.

## 4.0 r1 — October 2026
- New palette "Sapphire & Saffron" (sapphire/indigo, aqua, saffron-gold accent) for both themes.
- Light/dark fixed: header button flips light ↔ dark; footer offers System / Light / Dark; former
  always-dark sections now follow the theme.
- Fonts self-hosted (Inter, Sora, Michroma, IBM Plex Sans Thai, Anuphan — SIL OFL); Google Fonts removed.
- Footer redesigned: one CTA strip, brand + three link columns, single bottom bar with version,
  collapsible trademark notice.
- SI explained simply: plain-words steps, "Isn't today's AI enough?", why start now.
- 16 new courses (50 total) and 2 new tracks: Git, React & Next.js, Swift Playgrounds, shipping
  apps for iPhone/iPad/Mac, Raspberry Pi 5 AI HAT+, Arduino UNO Q & VENTUNO Q, Jetson Orin Nano
  generative AI, NVIDIA RAPIDS / NIM & NeMo / Isaac, AI Co-Engineering I–III, COMPAS-PY1,
  COMPAS-CPP1 and HKICO prep.
- Exam & olympiad section with TCAS70 portfolio information and the Plan · Edge · Trace · Test method.
- Six future skills (STEM page); STEM + SI research projects by field (Research and Innovation pages).
- Course outlines marked as indicative and adapted per learner.
- Regeneron ISEF removed from venues; COMPAS and HKICO added.
- Contact form can send to a configured endpoint with email-app fallback; privacy notice v3.
- Neural animation on every page hero; new original exam illustration.

## 3.x — earlier
- SI-first rewrite, personalised courses, PDPA consent, Thai/English, light/dark.
