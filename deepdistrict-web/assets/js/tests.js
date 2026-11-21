/* ==========================================================================
   DeepDistrict.si — Free practice tests (public page, no sign-in)
   Data: assets/data/tests.js (window.DD_TESTS: every ready-made set with sample questions) and
   assets/data/tests/<exam>-1.js (set 1 of each exam in full, loaded on demand). Built by
   tools/build_public_data.py from server/exam_sets.

   * Set 1 of every exam: the FULL test, timed on screen (SAT = 2 modules × 32 min, IELTS = Reading
     60 min + Writing 60 min, M.1 papers with their real number of questions).
   * Sets 2–3: a timed sample; the full sets are in the student portal.
   * Results summary on screen: score, targets, by subject / skill / topic, and every question with
     what it measures and what it is about; "PDF" of the question paper and of the results summary.
   pages/tests.html?exam=gate&set=1 opens one set directly.
   ========================================================================== */
(function () {
  "use strict";
  function uline(h) { return String(h).replace(/\[\[([^\]]+)\]\]/g, "<u class=\"ul-part\">$1</u>"); }   // [[text]] = underlined part (error identification)
  var root = document.querySelector("[data-tests]");
  var T = window.DD_TESTS;
  if (!root || !T) return;
  var base = document.body.getAttribute("data-base") || "";

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function bi(en, th) { return '<span lang="en">' + en + '</span><span lang="th">' + th + "</span>"; }
  function both(v) { v = v || {}; return bi(esc(v.en || v.th || ""), esc(v.th || v.en || "")); }
  function th() { return document.documentElement.getAttribute("lang") === "th" || document.documentElement.classList.contains("lang-th") || /th/.test(document.documentElement.getAttribute("data-lang") || ""); }
  function one(v) { v = v || {}; return th() ? v.th || v.en || "" : v.en || v.th || ""; }
  function norm(s) { return String(s || "").toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, " ").trim(); }
  function words(s) { return (String(s || "").match(/\S+/g) || []).length; }
  var LET = ["A", "B", "C", "D"];

  var EXAMS = {
    sat: { name: bi("SAT Reading &amp; Writing", "SAT Reading &amp; Writing"), cls: "sat", glyph: "SAT",
      desc: bi("Digital SAT format · full test 54 questions: Module 1 and the harder Module 2, 32 minutes each.", "รูปแบบ Digital SAT · ข้อสอบเต็ม 54 ข้อ: โมดูล 1 และโมดูล 2 (ยากขึ้น) โมดูลละ 32 นาที") },
    ielts: { name: bi("IELTS Academic", "IELTS Academic"), cls: "ielts", glyph: "IELTS",
      desc: bi("Reading: 3 passages, 40 questions, 60 minutes · Writing: Task 1 + Task 2, 60 minutes.", "Reading 3 บทความ 40 ข้อ 60 นาที · Writing Task 1 + Task 2 60 นาที") },
    sk1: { name: bi("M.1 · Suankularb (GATE / EPLUS+)", "ม.1 · สวนกุหลาบ (GATE / EPLUS+)"), cls: "gate", glyph: "ม.1",
      desc: bi("English, 40 questions in 50 minutes, Suankularb pre-test style. GATE and EPLUS+ take the same paper; EPLUS+ needs a higher score.", "ภาษาอังกฤษ 40 ข้อ 50 นาที แนวข้อสอบสวนกุหลาบ GATE และ EPLUS+ ใช้ชุดเดียวกัน EPLUS+ ต้องได้คะแนนสูงกว่า") },
    sp1: { name: bi("M.1 · Satit Prasarnmit", "ม.1 · สาธิตประสานมิตร"), cls: "satit", glyph: "ม.1",
      desc: bi("English, 50 questions in 60 minutes, reading-centred with reasoning.", "ภาษาอังกฤษ 50 ข้อ 60 นาที เน้นการอ่านและการคิดวิเคราะห์") },
    sk4: { name: bi("M.4 · Suankularb (GATE / EPLUS+)", "ม.4 · สวนกุหลาบ (GATE / EPLUS+)"), cls: "sk4", glyph: "ม.4",
      desc: bi("English, 50 questions in 60 minutes. GATE and EPLUS+ take the same paper; EPLUS+ needs a higher score.", "ภาษาอังกฤษ 50 ข้อ 60 นาที GATE และ EPLUS+ ใช้ชุดเดียวกัน EPLUS+ ต้องได้คะแนนสูงกว่า") },
    sp4: { name: bi("M.4 · Satit Prasarnmit", "ม.4 · สาธิตประสานมิตร"), cls: "satit", glyph: "ม.4",
      desc: bi("English, 50 questions in 60 minutes, standardized-test style (academic vocabulary, structure, academic reading).", "ภาษาอังกฤษ 50 ข้อ 60 นาที แนวข้อสอบมาตรฐาน (คำศัพท์วิชาการ โครงสร้าง บทความวิชาการ)") },
    tu4: { name: bi("M.4 · Triam Udom Suksa", "ม.4 · เตรียมอุดมศึกษา"), cls: "tu4", glyph: "ม.4",
      desc: bi("English, 50 questions in 60 minutes: cloze and reading at the core, error identification (collocations), conversation.", "ภาษาอังกฤษ 50 ข้อ 60 นาที: เติมคำในบทความและการอ่านเป็นหลัก หาจุดผิด (collocation) บทสนทนา") },
    alevel: { name: bi("A-Level English (TCAS)", "A-Level ภาษาอังกฤษ (TCAS)"), cls: "alevel", glyph: "A-L",
      desc: bi("80 questions in 90 minutes, official blueprint: Listening & Speaking 20, Reading 40, Writing 20.", "80 ข้อ 90 นาที ตามโครงสร้างจริง: Listening & Speaking 20 Reading 40 Writing 20") }
  };
  var SUBJ = { math: ["Mathematics", "คณิตศาสตร์"], sci: ["Science", "วิทยาศาสตร์"], eng: ["English", "ภาษาอังกฤษ"], thai: ["Thai", "ภาษาไทย"], RW: ["Reading and Writing", "Reading and Writing"], read: ["Reading", "Reading"] };
  function subj(k) { var x = SUBJ[k] || [k, k]; return bi(x[0], x[1]); }
  function subjTxt(k) { var x = SUBJ[k] || [k, k]; return th() ? x[1] : x[0]; }
  var DOM = { cs: "Craft and Structure", ii: "Information and Ideas", sec: "Standard English Conventions", eoi: "Expression of Ideas" };
  var TARGETS = { sk1: [{ en: "GATE Program", th: "GATE Program", overall: 70, subjects: {} }, { en: "EPLUS+ (English Program)", th: "EPLUS+ (English Program)", overall: 85, subjects: {} }],
    sk4: [{ en: "GATE Program", th: "GATE Program", overall: 70, subjects: {} }, { en: "EPLUS+ (English Program)", th: "EPLUS+ (English Program)", overall: 85, subjects: {} }],
    sp1: [{ en: "Satit Prasarnmit", th: "สาธิตประสานมิตร", overall: 75, subjects: {} }], sp4: [{ en: "Satit Prasarnmit", th: "สาธิตประสานมิตร", overall: 75, subjects: {} }],
    tu4: [{ en: "Triam Udom Suksa", th: "เตรียมอุดมศึกษา", overall: 80, subjects: {} }],
    alevel: [{ en: "Competitive faculties (≈70+)", th: "คณะแข่งขันสูง (≈70 ขึ้นไป)", overall: 70, subjects: {} }] };
  var PARTS = { conversation: ["Conversation", "บทสนทนา"], "conversation-short": ["Short conversations", "บทสนทนาสั้น"], "conversation-long": ["Long conversation", "บทสนทนายาว"],
    vocabulary: ["Vocabulary in context", "คำศัพท์ในบริบท"], grammar: ["Grammar and structure", "ไวยากรณ์และโครงสร้าง"], error: ["Error identification", "หาจุดผิด"],
    cloze: ["Cloze test", "เติมคำในบทความ"], reading: ["Reading comprehension", "การอ่านจับใจความ"], "reading-academic": ["Academic reading", "การอ่านบทความวิชาการ"],
    "reading-ads": ["Reading: advertisements", "การอ่าน: โฆษณา"], "reading-review": ["Reading: product / service review", "การอ่าน: บทวิจารณ์สินค้าและบริการ"],
    "reading-news": ["Reading: news", "การอ่าน: ข่าว"], "reading-visual": ["Reading: graphs and tables", "การอ่าน: กราฟและตาราง"], "reading-article": ["Reading: articles", "การอ่าน: บทความ"],
    "text-completion": ["Writing: text completion", "การเขียน: เติมข้อความ"], paragraph: ["Writing: paragraph organization", "การเขียน: เรียงประโยคเป็นย่อหน้า"] };
  function partName(k) { var x = PARTS[k]; return x ? bi(x[0], x[1]) : esc(k || ""); }
  var FIXED = { tfng: ["TRUE", "FALSE", "NOT GIVEN"], ynng: ["YES", "NO", "NOT GIVEN"] };
  var TEXT = { "sentence-completion": 1, "summary-completion": 1, "note-completion": 1, "table-completion": 1, "flowchart-completion": 1, "diagram-label": 1, "short-answer": 1 };
  var TYPES = { tfng: "True / False / Not Given", ynng: "Yes / No / Not Given", mcq: "Multiple choice", "mcq-multi": "Multiple choice (choose 2–3)", headings: "Matching headings", "matching-info": "Matching information", "matching-features": "Matching features", "sentence-endings": "Sentence endings", "summary-box": "Summary (word box)", "sentence-completion": "Sentence completion", "summary-completion": "Summary completion", "note-completion": "Note completion", "table-completion": "Table completion", "flowchart-completion": "Flow-chart completion", "diagram-label": "Diagram labels", "short-answer": "Short answers" };

  var S = null, timer = null;   // the running test

  /* ------------------------------------------------------------ overview */
  function overview() {
    stop(); S = null;
    var by = {};
    T.forEach(function (s) { (by[s.exam] = by[s.exam] || []).push(s); });
    root.innerHTML = '<div class="pt-grid">' + Object.keys(EXAMS).filter(function (k) { return by[k]; }).map(function (k) {
      var e = EXAMS[k];
      return '<section class="card pt-card pt-card--' + e.cls + '"><div class="pt-card__head"><span class="pt-glyph">' + esc(e.glyph) + "</span><h2>" + e.name + "</h2></div><p>" + e.desc + "</p>" +
        '<div class="pt-sets">' + by[k].map(function (s) {
          var n = count(s, true);
          return s.free
            ? '<a class="btn btn--primary pt-set" href="?exam=' + k + "&set=" + s.set + '&full=1" data-open="' + k + ":" + s.set + ':full">⏱ ' + bi("Set " + s.set + " · full test free (" + n + " questions, " + s.minutes + " min)", "ชุดที่ " + s.set + " · ทำฟรีเต็มชุด (" + n + " ข้อ " + s.minutes + " นาที)") + "</a>"
            : '<a class="btn pt-set" href="?exam=' + k + "&set=" + s.set + '" data-open="' + k + ":" + s.set + ':sample">' + bi("Set " + s.set + " · sample " + count(s, false) + " questions", "ชุดที่ " + s.set + " · ตัวอย่าง " + count(s, false) + " ข้อ") + "</a>";
        }).join("") + "</div></section>";
    }).join("") + "</div>" + cta() + disclaimer();
  }
  function count(s, full) {
    if (!full) return s.sample.questions ? s.sample.questions.length : 13;
    return s.exam === "ielts" ? 40 : (s.kinds.sat || s.kinds.m1 || 0);
  }
  function cta() {
    return '<aside class="pt-cta card"><div><h2>' + bi("All sets in full, with a teacher", "ทำครบทุกชุดพร้อมครูดูแล") + "</h2><p>" +
      bi("DeepDistrict students take every set in full in the student portal — timed by our server, answers shuffled each time, Writing marked by a teacher, score report PDFs and live classes.",
        "นักเรียน DeepDistrict ทำได้ครบทุกชุดในระบบนักเรียน จับเวลาโดยเซิร์ฟเวอร์ สลับตัวเลือกทุกครั้ง ครูตรวจ Writing มีรายงานผล PDF และห้องเรียนสด") + '</p></div><div class="pt-cta__btns">' +
      '<a class="btn btn--primary" href="' + base + 'admin/index.html#/tests">' + bi("Sign in to the student portal", "เข้าสู่ระบบนักเรียน") + "</a>" +
      '<a class="btn" href="' + base + 'pages/contact.html">' + bi("Ask about a free level check", "สอบถามการวัดระดับฟรี") + "</a></div></aside>";
  }
  function disclaimer() {
    return '<p class="pt-note">' + bi("All questions are written by DeepDistrict — not official, past or leaked papers. Formats of the M.1 papers follow public descriptions (schools do not publish their papers); check each school's announcement every year. SAT is a trademark of the College Board; IELTS belongs to the British Council, IDP and Cambridge University Press &amp; Assessment. We are not affiliated with these organisations or schools.",
      "ข้อสอบทั้งหมดเขียนโดย DeepDistrict ไม่ใช่ข้อสอบจริงหรือข้อสอบเก่า รูปแบบข้อสอบ ม.1 อ้างอิงข้อมูลที่เผยแพร่ทั่วไป (โรงเรียนไม่เผยแพร่ข้อสอบ) โปรดตรวจประกาศของโรงเรียนทุกปี SAT เป็นเครื่องหมายการค้าของ College Board ส่วน IELTS เป็นของ British Council, IDP และ Cambridge University Press &amp; Assessment เราไม่มีส่วนเกี่ยวข้องกับองค์กรและโรงเรียนเหล่านี้") + "</p>";
  }

  /* ------------------------------------------------------------ building a test */
  function load(meta, full) {
    if (!full) return Promise.resolve(meta.sample);
    var key = meta.file;
    if (window.DD_FULL && window.DD_FULL[key]) return Promise.resolve(window.DD_FULL[key]);
    return new Promise(function (ok, bad) {
      var sc = document.createElement("script");
      sc.src = base + "assets/data/tests/" + key + ".js?v=" + ((window.DD_PREFS && window.DD_PREFS.SITE_VERSION) || "").replace(/\s/g, "");
      sc.onload = function () { window.DD_FULL && window.DD_FULL[key] ? ok(window.DD_FULL[key]) : bad(new Error("missing")); };
      sc.onerror = function () { bad(new Error("could not load the test")); };
      document.head.appendChild(sc);
    });
  }
  function start(exam, n, full) {
    var meta = T.filter(function (x) { return x.exam === exam && String(x.set) === String(n); })[0];
    if (!meta) return overview();
    full = !!(full && meta.free);
    root.innerHTML = '<p class="pt-loading">' + bi("Loading the test…", "กำลังโหลดข้อสอบ…") + "</p>";
    load(meta, full).then(function (data) {
      S = { meta: meta, full: full, data: data, answers: {}, cur: 0, sections: sections(meta, data, full), started: Date.now() };
      intro();
    }).catch(function () { root.innerHTML = '<p class="pt-loading">' + bi("Sorry — the test could not be loaded.", "ขออภัย โหลดข้อสอบไม่ได้") + "</p>"; });
  }
  function sections(meta, d, full) {
    var per = meta.minutes * 60 / Math.max(1, count(meta, true));
    if (meta.exam === "ielts") {
      var rd = d.reading || [], out = [];
      out.push({ title: "IELTS Academic Reading", seconds: full ? 3600 : 1200, reading: rd });
      if ((d.writing || []).length) out.push({ title: "IELTS Academic Writing", seconds: full ? 3600 : 2400, writing: d.writing });
      return out;
    }
    var qs = d.questions || [];
    if (meta.exam === "sat" && full && qs.length >= 54) {
      return [{ title: "Module 1", seconds: 32 * 60, qs: qs.slice(0, 27) }, { title: "Module 2", seconds: 32 * 60, qs: qs.slice(27) }];
    }
    return [{ title: full ? "" : "Sample", seconds: full ? meta.minutes * 60 : Math.max(300, Math.round(qs.length * per)), qs: qs }];
  }
  function intro() {
    var m = S.meta, e = EXAMS[m.exam], secs = S.sections;
    root.innerHTML = '<nav class="pt-back"><a href="?" data-home>← ' + bi("All practice tests", "ข้อสอบทั้งหมด") + "</a></nav>" +
      '<section class="card pt-intro pt-head--' + e.cls + '"><span class="pt-glyph">' + esc(e.glyph) + "</span><div><h2>" + both(m.title) + "</h2><p>" + both(m.note) + "</p>" +
      '<ul class="pt-facts">' + secs.map(function (s, i) { return "<li><b>" + (s.title ? esc(s.title) : bi("Paper", "ข้อสอบ")) + "</b> · " + Math.round(s.seconds / 60) + bi(" minutes", " นาที") + " · " + secCount(s) + bi(" questions", " ข้อ") + "</li>"; }).join("") + "</ul>" +
      (S.full ? "" : "<p><b>" + bi("This is a sample of the set. The full set is in the student portal.", "นี่คือตัวอย่างจากชุดนี้ ชุดเต็มอยู่ในระบบนักเรียน") + "</b></p>") +
      "<p>" + bi("The timer starts when you press Start and is shown at the top of the screen. When time is up your answers are submitted automatically. You can download the question paper as a PDF before you start.",
        "เวลาเริ่มนับเมื่อกดเริ่มทำ และแสดงอยู่ด้านบนของจอ เมื่อหมดเวลาระบบจะส่งคำตอบให้อัตโนมัติ ดาวน์โหลดข้อสอบเป็น PDF ก่อนเริ่มทำได้") + '</p><div class="pt-actions pt-actions--static"><button class="btn btn--primary btn--lg" data-begin>⏱ ' + bi("Start the test", "เริ่มทำข้อสอบ") + '</button><button class="btn" data-pdf="paper">⬇ ' + bi("PDF question paper", "PDF ข้อสอบ") + "</button></div></div></section>";
  }
  function secCount(s) {
    if (s.qs) return s.qs.length;
    if (s.reading) { var n = 0; s.reading.forEach(function (r) { r.groups.forEach(function (g) { g.questions.forEach(function (q) { n += g.type === "mcq-multi" ? q.answer.length : 1; }); }); }); return n; }
    return (s.writing || []).length;
  }

  /* ------------------------------------------------------------ taking the test */
  function runSection() {
    var s = S.sections[S.cur];
    s.deadline = Date.now() + s.seconds * 1000;
    var body;
    if (s.qs) body = choiceList(s.qs, S.cur);
    else if (s.reading) body = s.reading.map(passageBlock).join("");
    else body = s.writing.map(function (t, i) {
      return '<article class="pt-q card"><div class="pt-q__head"><span class="pt-tag">Writing Task ' + t.task + "</span></div>" + passage(t.prompt) + table(t.table) +
        '<textarea class="pt-essay" rows="12" data-essay="' + i + '" placeholder="' + (t.task === 1 ? "150+" : "250+") + ' words"></textarea><p class="pt-wc" data-wc>0 / ' + (t.task === 1 ? 150 : 250) + "+</p></article>";
    }).join("");
    var tabs = s.qs ? subjectTabs(s.qs) : "";
    root.innerHTML = '<div class="pt-bar"><div class="pt-bar__title"><b>' + both(S.meta.title) + "</b>" + (s.title ? "<small>" + esc(s.title) + "</small>" : "") + '</div><div class="pt-timer" data-timer>--:--</div>' +
      '<div class="pt-bar__right"><span data-progress></span><button class="btn btn--primary" data-submit>' + (S.cur < S.sections.length - 1 ? bi("Submit this part →", "ส่งส่วนนี้ →") : bi("Submit &amp; see results", "ส่งคำตอบและดูผล")) + "</button></div></div>" + tabs +
      '<form class="pt-form" data-form>' + body + "</form>";
    progress(); tick();
    stop(); timer = setInterval(tick, 1000);
    window.scrollTo({ top: root.getBoundingClientRect().top + window.scrollY - 80 });
  }
  function subjectTabs(qs) {
    var first = {}, order = [];
    qs.forEach(function (q, i) { var k = q.part || q.subject || (q.domain ? "RW" : ""); if (k && first[k] == null) { first[k] = i; order.push(k); } });
    if (order.length < 2) return "";
    return '<nav class="pt-tabs">' + order.map(function (k) { return '<a href="#pt-q-' + S.cur + "-" + first[k] + '" class="pt-tab pt-tab--' + (PARTS[k] ? "part" : k) + '">' + (PARTS[k] ? partName(k) : subj(k)) + "</a>"; }).join("") + "</nav>";
  }
  function choiceList(qs, si) {
    var last = null, lastPassage = null, n0 = S.sections.slice(0, si).reduce(function (t, s) { return t + (s.qs ? s.qs.length : 0); }, 0);
    return qs.map(function (it, i) {
      var k = it.part || it.subject || "RW", head = "";
      if (k !== last && (it.part || it.subject)) head = '<h2 class="pt-subhead pt-subhead--' + (it.part ? "part" : k) + '">' + (it.part ? partName(it.part) : subj(k)) + "</h2>";
      last = k;
      var showPassage = it.passage && it.passage !== lastPassage;
      lastPassage = it.passage || null;
      var id = qid(si, i), input;
      if (it.format === "fill") input = '<div class="pt-fill"><input name="' + id + '" data-q="' + id + '" autocomplete="off" aria-label="Answer">' + (it.unit ? "<span>" + esc(it.unit) + "</span>" : "") + "</div>";
      else input = '<div class="pt-choices">' + it.choices.map(function (c, j) { return '<label class="pt-choice"><input type="radio" name="' + id + '" value="' + j + '" data-q="' + id + '"><b>' + LET[j] + "</b><span>" + esc(c) + "</span></label>"; }).join("") + "</div>";
      return head + '<article class="pt-q card" id="pt-q-' + si + "-" + i + '"><div class="pt-q__head"><span class="pt-num">' + (n0 + i + 1) + '</span><span class="pt-tag">' + (it.part ? partName(it.part) : it.subject ? subj(it.subject) : esc(DOM[it.domain] || "")) + (it.format === "fill" ? " · " + bi("written answer", "อัตนัย เติมคำตอบ") : "") + "</span></div>" +
        (showPassage ? '<div class="pt-passage">' + passage(it.passage) + "</div>" : it.passage ? '<p class="pt-same">' + bi("(Use the same text as the question above.)", "(ใช้บทอ่านเดียวกับข้อก่อนหน้า)") + "</p>" : "") +
        table(it.table) + '<p class="pt-stem">' + uline(esc(it.stem)) + "</p>" + input + "</article>";
    }).join("");
  }
  function qid(si, i) { return "s" + si + "q" + i; }
  function passageBlock(r, pi) {
    var n = 0;
    S.sections[S.cur].reading.slice(0, pi).forEach(function (x) { x.groups.forEach(function (g) { g.questions.forEach(function (q) { n += g.type === "mcq-multi" ? q.answer.length : 1; }); }); });
    var paras = '<div class="pt-reading"><h3>' + bi("Reading Passage " + (pi + 1), "บทอ่านที่ " + (pi + 1)) + ": " + esc(r.title) + "</h3>" + r.paragraphs.map(function (p, i) { return "<p><b>" + String.fromCharCode(65 + i) + "</b> " + esc(p) + "</p>"; }).join("") + "</div>";
    var groups = r.groups.map(function (g, gi) {
      var opts = FIXED[g.type] ? FIXED[g.type].map(function (k) { return { key: k, text: k }; }) : (g.type === "matching-info" && !(g.options || []).length ? r.paragraphs.map(function (_, i) { return { key: String.fromCharCode(65 + i), text: String.fromCharCode(65 + i) }; }) : g.options || []);
      var list = opts.length && !FIXED[g.type] && g.type !== "mcq" && g.type !== "mcq-multi" && g.type !== "matching-info" ? '<ul class="pt-opts">' + opts.map(function (o) { return "<li><b>" + esc(o.key) + "</b> " + esc(o.text) + "</li>"; }).join("") + "</ul>" : "";
      var qs = g.questions.map(function (x, qi) {
        var id = "p" + pi + "g" + gi + "q" + qi, first = n + 1, input;
        n += g.type === "mcq-multi" ? x.answer.length : 1;
        if (g.type === "mcq" || g.type === "mcq-multi") input = (x.options || []).map(function (o) { return '<label class="pt-choice pt-choice--sm"><input type="' + (g.type === "mcq" ? "radio" : "checkbox") + '" name="' + id + '" value="' + esc(o.key) + '" data-q="' + id + '"><b>' + esc(o.key) + "</b><span>" + esc(o.text) + "</span></label>"; }).join("");
        else if (TEXT[g.type]) input = '<input class="pt-text" name="' + id + '" data-q="' + id + '" autocomplete="off" spellcheck="false">';
        else input = '<select name="' + id + '" data-q="' + id + '"><option value="">—</option>' + opts.map(function (o) { return '<option value="' + esc(o.key) + '">' + esc(o.key) + "</option>"; }).join("") + "</select>";
        return '<div class="pt-iq"><span class="pt-num">' + first + (n > first ? "–" + n : "") + "</span><div><p>" + esc(x.text) + "</p>" + input + "</div></div>";
      }).join("");
      return '<div class="pt-group"><p class="pt-instr">' + esc(g.instructions) + "</p>" + (g.context ? '<div class="pt-context">' + passage(g.context) + "</div>" : "") + list + qs + "</div>";
    }).join("");
    return '<div class="pt-ielts"><section class="pt-pane card">' + paras + '</section><section class="pt-pane card">' + groups + "</section></div>";
  }
  function collect() {
    var f = root.querySelector("[data-form]"); if (!f) return;
    f.addEventListener("submit", function (e) { e.preventDefault(); });
    f.querySelectorAll("[data-q]").forEach(function (el) {
      var k = el.getAttribute("data-q");
      if (el.type === "radio") { if (el.checked) S.answers[k] = el.value; }
      else if (el.type === "checkbox") { var v = (S.answers[k + "#multi"] = S.answers[k + "#multi"] || {}); v[el.value] = el.checked; }
      else S.answers[k] = el.value;
    });
    f.querySelectorAll("[data-essay]").forEach(function (el) { S.answers["essay" + el.getAttribute("data-essay")] = el.value; });
  }
  function progress() {
    var f = root.querySelector("[data-form]"), el = root.querySelector("[data-progress]"); if (!f || !el) return;
    var names = {}, done = {};
    f.querySelectorAll("[data-q]").forEach(function (x) { names[x.name] = 1; if ((x.type === "radio" || x.type === "checkbox") ? x.checked : x.value.trim()) done[x.name] = 1; });
    el.innerHTML = bi("Answered ", "ตอบแล้ว ") + "<b>" + Object.keys(done).length + " / " + Object.keys(names).length + "</b>";
  }
  function tick() {
    var s = S && S.sections[S.cur], el = root.querySelector("[data-timer]");
    if (!s || !el) return stop();
    var left = Math.max(0, Math.round((s.deadline - Date.now()) / 1000)), h = Math.floor(left / 3600), m = Math.floor(left % 3600 / 60);
    el.textContent = (h ? h + ":" + ("0" + m).slice(-2) : m) + ":" + ("0" + left % 60).slice(-2);
    el.classList.toggle("is-low", left <= 300); el.classList.toggle("is-urgent", left <= 60);
    if (left <= 0) { stop(); submitSection(true); }
  }
  function stop() { clearInterval(timer); timer = null; }
  function submitSection(auto) {
    if (!auto && !confirm(th() ? "ส่งคำตอบส่วนนี้ใช่ไหม? ส่งแล้วจะกลับมาแก้ไม่ได้" : "Submit this part? You cannot change these answers afterwards.")) return;
    collect(); stop();
    S.sections[S.cur].used = Math.round((S.sections[S.cur].seconds * 1000 - Math.max(0, S.sections[S.cur].deadline - Date.now())) / 1000);
    if (S.cur < S.sections.length - 1) { S.cur++; runSection(); return; }
    results();
  }

  /* ------------------------------------------------------------ marking */
  function fillOk(v, acc) {
    function num(x) { x = norm(x).replace(/,/g, "").replace(/\s/g, ""); var m = /^(-?\d+(?:\.\d+)?)(?:\/(\d+(?:\.\d+)?))?\D*$/.exec(x); return m ? +m[1] / (m[2] ? +m[2] : 1) : null; }
    if (!String(v || "").trim()) return false;
    var nv = num(v);
    return (acc || []).some(function (a) { var na = num(a); return (nv != null && na != null && Math.abs(nv - na) < 1e-6) || norm(v) === norm(a); });
  }
  function mark() {
    var rows = [], n = 0;
    S.sections.forEach(function (s, si) {
      if (s.qs) s.qs.forEach(function (it, i) {
        n++;
        var v = S.answers[qid(si, i)], ok = it.format === "fill" ? fillOk(v, it.accept) : String(v) === String(it.answer);
        rows.push({ n: n, part: it.part, subject: it.subject || "RW", skill: it.skill || (it.domain ? { en: DOM[it.domain] + " · " + String(it.skill || "").replace(/-/g, " ") } : {}), skillKey: it.domain ? it.domain + "|" + it.skill : null,
          domain: it.domain, rawSkill: it.domain ? it.skill : null, topic: it.topic || {}, mine: it.format === "fill" ? (v || "–") : v != null && v !== "" ? LET[+v] : "–",
          key: it.format === "fill" ? (it.accept || []).join(" / ") : LET[it.answer], ok: ok, it: it, diff: it.difficulty });
      });
      if (s.reading) s.reading.forEach(function (r, pi) {
        r.groups.forEach(function (g, gi) {
          g.questions.forEach(function (x, qi) {
            var id = "p" + pi + "g" + gi + "q" + qi, pts, max = 1, mine;
            if (g.type === "mcq-multi") {
              var m = S.answers[id + "#multi"] || {}, picked = Object.keys(m).filter(function (k) { return m[k]; });
              max = x.answer.length; pts = picked.length > max ? 0 : picked.filter(function (p) { return x.answer.map(norm).indexOf(norm(p)) !== -1; }).length; mine = picked.join(", ") || "–";
            } else {
              var v = S.answers[id] || "", lim = g.wordLimit ? g.wordLimit.words : 0;
              pts = (!lim || words(v) <= lim + (g.wordLimit && g.wordLimit.number ? 1 : 0)) && x.answer.map(norm).indexOf(norm(v)) !== -1 ? 1 : 0; mine = v || "–";
            }
            for (var k = 0; k < max; k++) {
              n++;
              rows.push({ n: n, subject: "read", skill: { en: TYPES[g.type] || g.type }, skillKey: g.type, topic: r.topic || { en: r.title }, mine: mine, key: x.answer.join(max > 1 ? ", " : " / "), ok: k < pts, text: x.text, type: g.type });
            }
          });
        });
      });
    });
    return rows;
  }
  function group(rows, key, label) {
    var m = {}, order = [];
    rows.forEach(function (r) { var k = key(r); if (!k) return; if (!m[k]) { m[k] = { label: label(r), subject: r.subject, c: 0, t: 0 }; order.push(k); } m[k].t++; if (r.ok) m[k].c++; });
    return order.map(function (k) { return m[k]; });
  }
  var BANDS = [[39, 9], [37, 8.5], [35, 8], [32, 7.5], [30, 7], [27, 6.5], [23, 6], [19, 5.5], [15, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5], [2, 2], [1, 1]];

  /* ------------------------------------------------------------ results */
  function results() {
    var rows = mark(), c = rows.filter(function (r) { return r.ok; }).length, t = rows.length, pct = t ? Math.round(c / t * 100) : 0, m = S.meta;
    var bySub = group(rows, function (r) { return r.subject; }, function (r) { return subj(r.subject); });
    var byPart = group(rows, function (r) { return r.part; }, function (r) { return partName(r.part); });
    var byTopic = group(rows, function (r) { return r.subject + "|" + (r.skillKey && m.exam === "sat" ? r.skillKey : one(r.topic)); }, function (r) { return m.exam === "sat" ? esc(DOM[r.domain] + " · " + String(r.rawSkill || "").replace(/-/g, " ")) : both(r.topic); })
      .sort(function (a, b) { return a.c / a.t - b.c / b.t; });
    var byType = m.exam === "ielts" ? group(rows, function (r) { return r.skillKey; }, function (r) { return esc(r.skill.en); }) : [];
    var big = pct + "%", sub = c + " / " + t + bi(" correct", " ข้อที่ถูก");
    if (m.exam === "sat" && S.full) { var w = { e: 1, m: 1.5, h: 2 }, got = 0, mx = 0; rows.forEach(function (r) { mx += w[r.diff] || 1.5; if (r.ok) got += w[r.diff] || 1.5; }); big = Math.round((200 + 600 * got / mx) / 10) * 10; sub = c + " / " + t + bi(" correct · rough Reading and Writing estimate (200–800)", " ข้อ · คะแนน RW โดยประมาณ (200–800)"); }
    if (m.exam === "ielts") { var raw = Math.round(c * 40 / Math.max(1, t)); var band = 0; for (var i = 0; i < BANDS.length; i++) if (raw >= BANDS[i][0]) { band = BANDS[i][1]; break; } big = "Band " + band; sub = c + " / " + t + bi(" Reading" + (t === 40 ? "" : " (scaled from a sample)"), " ข้อ Reading" + (t === 40 ? "" : " (ปรับจากตัวอย่าง)")); }
    var tg = (S.full ? TARGETS[m.exam] || [] : []).map(function (g) {
      var met = pct >= g.overall && Object.keys(g.subjects).every(function (k) { var x = bySub.filter(function (s) { return s.subject === k; })[0]; return x && x.c / x.t * 100 >= g.subjects[k]; });
      return '<div class="pt-kpi pt-target ' + (met ? "met" : "notmet") + '"><b>' + (met ? "✓" : "…") + "</b><span>" + bi(esc(g.en), esc(g.th)) + " — " + (met ? bi("on target", "ถึงเป้าหมาย") : bi("not yet", "ยังไม่ถึง")) + "<br><small>" + bi("Target: overall ", "เป้าหมาย: รวม ") + g.overall + "%" + Object.keys(g.subjects).map(function (k) { return " · " + subj(k) + " " + g.subjects[k] + "%"; }).join("") + "</small></span></div>";
    }).join("");
    var used = S.sections.reduce(function (a, s) { return a + (s.used || 0); }, 0);
    var html = '<nav class="pt-back"><a href="?" data-home>← ' + bi("All practice tests", "ข้อสอบทั้งหมด") + "</a></nav>" +
      '<section class="pt-results" data-results><h1 class="pt-results__title">' + bi("Results summary", "สรุปผลการสอบ") + "</h1><p class=\"pt-muted\">" + both(m.title) + " · " + new Date().toLocaleString(th() ? "th-TH" : "en-GB") + " · " + bi("time used ", "ใช้เวลา ") + Math.round(used / 60) + bi(" min", " นาที") + "</p>" +
      '<div class="pt-actions pt-actions--static"><button class="btn btn--primary" data-pdf="results">⬇ ' + bi("PDF results summary", "PDF สรุปผล") + '</button><button class="btn" data-pdf="key">⬇ ' + bi("PDF paper with answer key", "PDF ข้อสอบพร้อมเฉลย") + '</button><button class="btn" data-again>' + bi("Try again", "ทำใหม่") + "</button></div>" +
      '<div class="pt-kpis"><div class="pt-kpi pt-kpi--main"><b>' + big + "</b><span>" + sub + "</span></div>" + tg + "</div>" +
      (tg ? '<p class="pt-note">' + bi("Targets are DeepDistrict practice guidance, not school cut-offs. GATE and English Program applicants take the same Suankularb paper; EP applicants need a higher English score.", "เป้าหมายเป็นแนวทางฝึกของ DeepDistrict ไม่ใช่เกณฑ์ของโรงเรียน ผู้สมัคร GATE และ EP สวนกุหลาบใช้ข้อสอบชุดเดียวกัน ผู้สมัคร EP ต้องได้คะแนนอังกฤษสูงกว่า") + "</p>" : "") +
      (byPart.length ? "<h2>" + bi("By part", "แยกตามตอน") + "</h2>" + barTable(byPart) : "<h2>" + bi("By subject", "แยกตามวิชา") + "</h2>" + barTable(bySub)) +
      (byType.length ? "<h2>" + bi("By question type", "แยกตามประเภทคำถาม") + "</h2>" + barTable(byType) : "") +
      "<h2>" + (m.exam === "sat" ? bi("By skill — weakest first", "แยกตามทักษะ — เรียงจากที่ควรฝึกเพิ่ม") : bi("By topic — weakest first", "แยกตามเรื่อง — เรียงจากที่ควรฝึกเพิ่ม")) + "</h2>" + barTable(byTopic, true) +
      "<h2>" + bi("Every question: what it measures and what it is about", "สรุปรายข้อ: แต่ละข้อวัดอะไร เรื่องอะไร") + "</h2>" + rowTable(rows) +
      (S.sections.some(function (s) { return s.writing; }) ? writingNote() : "") +
      "<h2>" + bi("Answers and explanations", "เฉลยและคำอธิบาย") + "</h2>" + explanations(rows) + "</section>" + cta() + disclaimer();
    root.innerHTML = html;
    S.rows = rows; S.done = true;
    window.scrollTo({ top: root.getBoundingClientRect().top + window.scrollY - 80 });
  }
  function barTable(list, withSub) {
    return '<div class="pt-tblwrap"><table class="pt-rtbl"><tr>' + (withSub ? "<th>" + bi("Subject", "วิชา") + "</th>" : "") + "<th>" + bi("Area", "หัวข้อ") + "</th><th>" + bi("Correct", "ถูก") + "</th><th></th></tr>" + list.map(function (x) {
      var pc = Math.round(x.c / x.t * 100);
      return "<tr>" + (withSub ? "<td>" + subj(x.subject) + "</td>" : "") + "<td>" + x.label + "</td><td><b>" + x.c + "/" + x.t + "</b> (" + pc + '%)</td><td class="pt-barcell"><div class="pt-bar2"><i class="' + (pc >= 70 ? "hi" : pc >= 50 ? "mid" : "lo") + '" style="width:' + pc + '%"></i></div></td></tr>';
    }).join("") + "</table></div>";
  }
  function rowTable(rows) {
    return '<div class="pt-tblwrap"><table class="pt-rtbl pt-rtbl--rows"><tr><th>' + bi("No.", "ข้อ") + "</th><th>" + bi("Subject", "วิชา") + "</th><th>" + bi("Measures", "วัดอะไร") + "</th><th>" + bi("Topic", "เรื่อง") + "</th><th>" + bi("You", "ตอบ") + "</th><th>" + bi("Key", "เฉลย") + "</th><th></th></tr>" +
      rows.map(function (r) { return '<tr class="' + (r.ok ? "ok" : "bad") + '"><td><b>' + r.n + "</b></td><td>" + subj(r.subject) + "</td><td>" + both(r.skill) + "</td><td>" + both(r.topic) + "</td><td>" + esc(r.mine) + "</td><td><b>" + esc(r.key) + "</b></td><td>" + (r.ok ? "✓" : "✗") + "</td></tr>"; }).join("") + "</table></div>";
  }
  function explanations(rows) {
    return rows.filter(function (r) { return r.it; }).map(function (r) {
      var it = r.it;
      return '<details class="pt-exp2 ' + (r.ok ? "ok" : "bad") + '"' + (r.ok ? "" : " open") + "><summary><b>" + r.n + "</b> " + (r.ok ? "✓" : "✗") + " " + uline(esc(it.stem)).slice(0, 160) + "</summary>" +
        (it.format === "fill" ? "<p>" + bi("Your answer: ", "คำตอบของคุณ: ") + "<b>" + esc(r.mine) + "</b> · " + bi("Accepted: ", "คำตอบที่ถูก: ") + "<b>" + esc(r.key) + "</b> " + esc(it.unit || "") + "</p>"
          : "<ol type=A>" + it.choices.map(function (c, k) { return '<li class="' + (k === it.answer ? "right" : LET[k] === r.mine ? "wrong" : "") + '">' + esc(c) + "</li>"; }).join("") + "</ol>") +
        '<p class="pt-muted">' + bi("Measures: ", "วัด: ") + both(r.skill) + " · " + bi("Topic: ", "เรื่อง: ") + both(r.topic) + "</p><p>" + both(it.explanation) + "</p></details>";
    }).join("") || '<p class="pt-muted">' + bi("The answer for each question is in the table above.", "ดูเฉลยแต่ละข้อได้ในตารางด้านบน") + "</p>";
  }
  function writingNote() {
    return "<h2>" + bi("Writing", "Writing") + "</h2>" + S.sections.filter(function (s) { return s.writing; })[0].writing.map(function (t, i) {
      var e = S.answers["essay" + i] || "", n = words(e), min = t.task === 1 ? 150 : 250;
      return '<div class="pt-kpi"><b>Task ' + t.task + "</b><span>" + n + " / " + min + "+ " + bi("words", "คำ") + (n < min ? " — " + bi("under the minimum", "ยังไม่ถึงขั้นต่ำ") : " ✓") + "<br><small>" + bi("Writing is marked by a teacher in the student portal (with AI feedback).", "ครูตรวจ Writing ให้ในระบบนักเรียน (พร้อมคำแนะนำจาก AI)") + "</small></span></div>";
    }).join("");
  }

  /* ------------------------------------------------------------ PDF (made in the browser) */
  function loadScript(src) { return new Promise(function (ok, bad) { var s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = function () { bad(new Error("could not load " + src)); }; document.head.appendChild(s); }); }
  function libs() {
    var p = [];
    if (!window.html2canvas) p.push(loadScript(base + "admin/vendor/html2canvas.min.js"));
    if (!(window.jspdf && window.jspdf.jsPDF)) p.push(loadScript(base + "admin/vendor/jspdf.umd.min.js"));
    return Promise.all(p);
  }
  function pdf(kind, btn) {
    var label = btn.innerHTML; btn.disabled = true; btn.textContent = th() ? "กำลังสร้าง PDF…" : "Creating PDF…";
    var blocks = kind === "results" ? resultBlocks() : paperBlocks(kind === "key");
    libs().then(function () { return render(blocks, kind, function (i, n) { btn.textContent = (th() ? "กำลังสร้าง PDF… " : "Creating PDF… ") + Math.round(i / n * 100) + "%"; }); })
      .then(function () { btn.disabled = false; btn.innerHTML = label; })
      .catch(function (e) { alert(e.message); btn.disabled = false; btn.innerHTML = label; });
  }
  var PDFCSS = "font-family:'Sarabun','Noto Sans Thai','Leelawadee UI',Tahoma,Arial,sans-serif;font-size:15px;line-height:1.6;color:#111;";
  function paperBlocks(withKey) {
    var m = S.meta, out = [], n = 0;
    out.push('<div style="border-bottom:3px solid #1d3fb8;padding-bottom:8px"><div style="font-size:12px;color:#1d3fb8;font-weight:700">DeepDistrict.si · ' + esc(withKey ? "Paper with answer key · ข้อสอบพร้อมเฉลย" : "Question paper · ข้อสอบ") + '</div><div style="font-size:22px;font-weight:700">' + esc(m.title.en) + '</div><div style="font-size:18px">' + esc(m.title.th) + "</div><p>" + esc(m.note.en) + "<br>" + esc(m.note.th) + '</p><p>Name · ชื่อ ____________________________ &nbsp; Date · วันที่ ____________ &nbsp; Time · เวลา ' + m.minutes + " min</p></div>");
    S.sections.forEach(function (s, si) {
      if (s.title) out.push('<div style="font-size:18px;font-weight:700;margin-top:6px">' + esc(s.title) + " · " + Math.round(s.seconds / 60) + " min</div>");
      if (s.qs) { var lastP = null, lastS = null; s.qs.forEach(function (it) {
        n++;
        var h = "";
        var sk = it.part || it.subject;
        if (sk && sk !== lastS) h += '<div style="font-size:17px;font-weight:700;color:#1d3fb8;margin:6px 0">' + (it.part && PARTS[it.part] ? esc(PARTS[it.part][0] + " · " + PARTS[it.part][1]) : esc(SUBJ[it.subject][0] + " · " + SUBJ[it.subject][1])) + "</div>";
        lastS = sk;
        if (it.passage && it.passage !== lastP) h += '<div style="background:#f3f5fb;border-left:3px solid #94a3b8;padding:6px 10px;margin:4px 0">' + passage(it.passage) + "</div>";
        lastP = it.passage || null;
        h += table(it.table) + "<div><b>" + n + ".</b> " + uline(esc(it.stem)) + "</div>" + (it.format === "fill" ? "<div style='margin:6px 0 0 18px'>Answer · คำตอบ: ______________________ " + esc(it.unit || "") + "</div>"
          : it.choices.map(function (c, j) { return "<div style='margin-left:18px'>" + LET[j] + ") " + esc(c) + "</div>"; }).join(""));
        if (withKey) h += '<div style="margin:4px 0 0 18px;color:#166534"><b>Key · เฉลย: ' + esc(it.format === "fill" ? (it.accept || []).join(" / ") : LET[it.answer]) + "</b> — " + esc(one(it.explanation)) + "</div>";
        out.push(h);
      }); }
      if (s.reading) s.reading.forEach(function (r, pi) {
        out.push('<div style="font-size:17px;font-weight:700">Reading Passage ' + (pi + 1) + ": " + esc(r.title) + "</div>");
        r.paragraphs.forEach(function (p, i) { out.push("<p><b>" + String.fromCharCode(65 + i) + "</b> " + esc(p) + "</p>"); });
        r.groups.forEach(function (g) {
          var h = "<p><i>" + esc(g.instructions) + "</i></p>" + (g.context ? "<div style='background:#f3f5fb;padding:6px 10px'>" + passage(g.context) + "</div>" : "") +
            ((g.options || []).length && !FIXED[g.type] && g.type !== "mcq" && g.type !== "mcq-multi" ? "<ul>" + g.options.map(function (o) { return "<li><b>" + esc(o.key) + "</b> " + esc(o.text) + "</li>"; }).join("") + "</ul>" : "");
          g.questions.forEach(function (q) { n++; h += "<div><b>" + n + ".</b> " + esc(q.text) + ((q.options || []).length ? (q.options.map(function (o) { return "<div style='margin-left:18px'>" + esc(o.key) + ") " + esc(o.text) + "</div>"; }).join("")) : " ____________") + (withKey ? " <b style='color:#166534'>[" + esc(q.answer.join(" / ")) + "]</b>" : "") + "</div>"; if (g.type === "mcq-multi") n += q.answer.length - 1; });
          out.push(h);
        });
      });
      if (s.writing) s.writing.forEach(function (t) { out.push('<div style="font-size:17px;font-weight:700">Writing Task ' + t.task + "</div>" + passage(t.prompt) + table(t.table)); });
    });
    return out;
  }
  function resultBlocks() {
    var el = root.querySelector("[data-results]"), out = [];
    var m = S.meta, rows = S.rows || [];
    var head = '<div style="border-bottom:3px solid #1d3fb8;padding-bottom:8px"><div style="font-size:12px;color:#1d3fb8;font-weight:700">DeepDistrict.si · Results summary · สรุปผลการสอบ</div><div style="font-size:22px;font-weight:700">' + esc(m.title.en) + '</div><div style="font-size:17px">' + esc(m.title.th) + "</div><div>" + esc(new Date().toLocaleString("th-TH")) + "</div></div>";
    out.push(head);
    var k = el.querySelector(".pt-kpis"); if (k) out.push(strip(k.outerHTML));
    el.querySelectorAll(".pt-tblwrap").forEach(function (w, i) {
      var h2 = w.previousElementSibling && w.previousElementSibling.tagName === "H2" ? "<div style='font-size:17px;font-weight:700;margin:6px 0'>" + strip(w.previousElementSibling.innerHTML) + "</div>" : "";
      var trs = w.querySelectorAll("tr"), hdr = trs[0].outerHTML;
      for (var j = 1; j < trs.length; j += 24) {
        var part = Array.prototype.slice.call(trs, j, j + 24).map(function (tr) { return tr.outerHTML; }).join("");
        out.push((j === 1 ? h2 : "") + strip('<table style="width:100%;border-collapse:collapse;font-size:13px" class="pdf-t">' + hdr + part + "</table>"));
      }
      return i;
    });
    out.push("<p style='font-size:12px;color:#555'>DeepDistrict practice estimate — not an official score. Questions are DeepDistrict originals. · คะแนนประมาณการเพื่อการฝึก ไม่ใช่คะแนนทางการ</p>");
    return out;
  }
  function strip(html) {   // keep only the current language spans for the PDF
    var d = document.createElement("div"); d.innerHTML = html;
    d.querySelectorAll('[lang="' + (th() ? "en" : "th") + '"]').forEach(function (x) { if (x.parentNode && x.parentNode.querySelector('[lang="' + (th() ? "th" : "en") + '"]')) x.remove(); });
    return d.innerHTML;
  }
  function render(blocks, kind, onProgress) {
    var J = window.jspdf.jsPDF, doc = new J({ unit: "mm", format: "a4" }), W = 210, H = 297, M = 12, foot = 10, y = M, page = 1;
    var box = document.createElement("div");
    box.style.cssText = "position:fixed;left:-10000px;top:0;width:760px;background:#fff;padding:0;" + PDFCSS;
    box.innerHTML = '<style>.pdf-t th,.pdf-t td{border:1px solid #cbd5e1;padding:4px 6px;text-align:left;vertical-align:top}.pdf-t th{background:#eef2ff}.pt-kpis{display:flex;gap:10px;flex-wrap:wrap}.pt-kpi{border:1px solid #cbd5e1;border-radius:10px;padding:8px 12px}.pt-kpi b{font-size:24px;display:block}.pt-bar2{height:8px;background:#e5e7eb;border-radius:9px;width:120px}.pt-bar2 i{display:block;height:8px;border-radius:9px;background:#2563eb}tr.bad td:first-child{color:#b91c1c}tr.ok td:first-child{color:#166534}table{border-collapse:collapse}td,th{padding:3px 6px;border:1px solid #e5e7eb}</style>';
    document.body.appendChild(box);
    var title = (S.meta.title.en || "").replace(/[^\x20-\x7e]/g, "");
    function footer() { doc.setFontSize(8); doc.setTextColor(110); doc.text("DeepDistrict.si  |  " + title + "  |  " + (kind === "results" ? "Results summary" : kind === "key" ? "Paper with key" : "Question paper") + "  |  page " + page, M, H - 5); }
    var i = 0;
    function next() {
      if (i >= blocks.length) { footer(); document.body.removeChild(box); doc.save("deepdistrict-" + S.meta.file + "-" + kind + ".pdf"); return Promise.resolve(); }
      var el = document.createElement("div"); el.style.cssText = "padding:6px 4px"; el.innerHTML = blocks[i]; box.appendChild(el);
      return window.html2canvas(el, { scale: 2, backgroundColor: "#ffffff", logging: false }).then(function (cv) {
        box.removeChild(el);
        var w = W - 2 * M, h = cv.height * w / cv.width, img = cv.toDataURL("image/jpeg", 0.88);
        if (y + h > H - M - foot && y > M) { footer(); doc.addPage(); page++; y = M; }
        if (h > H - 2 * M - foot) {                        // a very long block: slice it across pages
          var sliceH = Math.floor((H - 2 * M - foot) * cv.width / w), off = 0;
          while (off < cv.height) {
            var c2 = document.createElement("canvas"); c2.width = cv.width; c2.height = Math.min(sliceH, cv.height - off);
            c2.getContext("2d").drawImage(cv, 0, -off);
            var hh = c2.height * w / cv.width;
            if (y + hh > H - M - foot && y > M) { footer(); doc.addPage(); page++; y = M; }
            doc.addImage(c2.toDataURL("image/jpeg", 0.88), "JPEG", M, y, w, hh); y += hh + 2; off += sliceH;
          }
        } else { doc.addImage(img, "JPEG", M, y, w, h); y += h + 2; }
        i++; onProgress(i, blocks.length);
        return next();
      });
    }
    return next();
  }

  /* ------------------------------------------------------------ helpers & events */
  function passage(t) { return esc(t || "").split(/\n/).map(function (l) { return /^- /.test(l) ? "<li>" + l.slice(2) + "</li>" : l ? "<p>" + l + "</p>" : ""; }).join("").replace(/(<li>.*?<\/li>)+/g, function (m) { return "<ul>" + m + "</ul>"; }); }
  function table(t) { return t && t.rows && t.rows.length ? '<div class="pt-table">' + (t.title ? "<b>" + esc(t.title) + "</b>" : "") + "<table>" + t.rows.map(function (r, i) { return "<tr>" + r.map(function (c) { return i ? "<td>" + esc(c) + "</td>" : "<th>" + esc(c) + "</th>"; }).join("") + "</tr>"; }).join("") + "</table></div>" : ""; }

  root.addEventListener("click", function (e) {
    var a = e.target.closest("[data-open]");
    if (a) { e.preventDefault(); var p = a.getAttribute("data-open").split(":"); history.pushState(null, "", "?exam=" + p[0] + "&set=" + p[1] + (p[2] === "full" ? "&full=1" : "")); start(p[0], p[1], p[2] === "full"); return; }
    if (e.target.closest("[data-home]")) { e.preventDefault(); if (S && !S.done && S.sections[S.cur].deadline && !confirm(th() ? "ออกจากข้อสอบ? คำตอบจะหายไป" : "Leave the test? Your answers will be lost.")) return; history.pushState(null, "", location.pathname); overview(); return; }
    if (e.target.closest("[data-begin]")) { runSection(); return; }
    if (e.target.closest("[data-submit]")) { submitSection(false); return; }
    if (e.target.closest("[data-again]")) { start(S.meta.exam, S.meta.set, S.full); return; }
    var b = e.target.closest("[data-pdf]"); if (b) pdf(b.getAttribute("data-pdf"), b);
  });
  root.addEventListener("change", function () { if (S && !S.done) progress(); });
  root.addEventListener("input", function (e) {
    if (e.target.matches(".pt-essay")) { var n = words(e.target.value); e.target.nextElementSibling.textContent = n + " / " + (e.target.getAttribute("placeholder") || ""); }
    if (S && !S.done) progress();
    if (e.target.matches("[data-q]") && e.target.type === "checkbox") {
      var box = e.target.closest(".pt-iq"), max = 3; if (box) { var on = box.querySelectorAll("input:checked"); if (on.length > max) e.target.checked = false; }
    }
  });
  window.addEventListener("beforeunload", function (e) { if (S && !S.done && timer) { e.preventDefault(); e.returnValue = ""; } });
  window.addEventListener("popstate", function () { var p = new URLSearchParams(location.search); p.get("exam") ? start(p.get("exam"), p.get("set") || 1, p.get("full") === "1") : overview(); });

  var q = new URLSearchParams(location.search);
  q.get("exam") ? start(q.get("exam"), q.get("set") || 1, q.get("full") === "1") : overview();
})();
