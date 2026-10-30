/* ==========================================================================
   DeepDistrict back office — online tests (SAT Reading & Writing, IELTS Academic
   Reading and Writing): the learner's Tests page, the item bank and Writing marking.
   The test itself runs full-screen in exam.html (js/exam-player.js).
   ========================================================================== */
(function () {
  "use strict";
  var A = window.DDA, L = A.L, esc = A.esc, $ = A.$, $$ = A.$$;
  var home = null, bank = null;

  var KIND = { sat: ["SAT Reading & Writing", "SAT Reading & Writing"], "ielts-r": ["IELTS Academic Reading", "IELTS Academic Reading"], "ielts-w": ["IELTS Academic Writing", "IELTS Academic Writing"], m1: ["M.1 entrance (Suankularb GATE / EP)", "สอบเข้า ม.1 (สวนกุหลาบ GATE / EP)"] };
  var EXAM = { sat: ["SAT Reading & Writing", "SAT Reading & Writing"], ielts: ["IELTS Academic", "IELTS Academic"], gate: ["Suankularb M.1 · GATE Program", "สวนกุหลาบ ม.1 · GATE Program"], ep: ["Suankularb M.1 · English Program (EPLUS+)", "สวนกุหลาบ ม.1 · English Program (EPLUS+)"], other: ["Teacher sets", "ชุดข้อสอบจากครู"] };
  var SUBJ = { math: ["Mathematics", "คณิตศาสตร์"], sci: ["Science", "วิทยาศาสตร์"], eng: ["English", "ภาษาอังกฤษ"], thai: ["Thai", "ภาษาไทย"] };
  function setTitle(x) { return A.lang === "th" && x.titleTh ? x.titleTh : x.title; }
  function modeName(a) { return a.mode === "set" ? (a.setTitle || L("Test set", "ชุดข้อสอบ")) : a.mode === "mock" ? L("Full test", "ข้อสอบเต็ม") : L("Practice", "ฝึกทำ"); }
  var STAT = { draft: ["Draft", "ฉบับร่าง", "paused"], review: ["To review", "รอตรวจ", "scheduled"], approved: ["Approved", "อนุมัติแล้ว", "done"], retired: ["Retired", "เลิกใช้", "cancelled"] };
  var DIFF = { e: ["Easy", "ง่าย"], m: ["Medium", "กลาง"], h: ["Hard", "ยาก"] };
  function kname(k) { var x = KIND[k]; return x ? L(x[0], x[1]) : k; }
  function when(iso) { return iso ? new Date(iso).toLocaleString(A.lang === "th" ? "th-TH" : "en-GB", { dateStyle: "medium", timeStyle: "short" }) : "–"; }
  function open(id, extra) { location.href = "exam.html?a=" + encodeURIComponent(id) + (extra || ""); }

  /* ================================================================ Tests (everyone) */
  A.pages.tests = function () {
    return { title: L("Online tests", "ข้อสอบออนไลน์"), html: '<div data-tests><p class="muted">' + L("Loading…", "กำลังโหลด…") + "</p></div>",
      after: function () { A.api("GET", "exam/home").then(function (d) { home = d; drawTests(); }).catch(function (e) { A.toast(e.message, "err"); }); } };
  };

  function score(a) {
    if (a.status === "active") return '<span class="muted">' + L("in progress", "กำลังทำ") + "</span>";
    if (a.kind === "m1") return "<b>" + a.percent + "%</b> <small class=muted>(" + a.correct + "/" + a.total + ")</small>";
    if (a.kind === "sat") return a.estimate ? "<b>" + a.estimate + "</b> <small class=muted>(" + a.correct + "/" + a.total + ")</small>" : a.correct + "/" + a.total;
    if (a.kind === "ielts-r") return "Band <b>" + a.band + "</b> <small class=muted>(" + a.correct + "/" + a.total + ")</small>";
    return a.marked ? "Band <b>" + a.band + "</b>" : (a.aiBand != null ? "AI ≈ " + a.aiBand + " · " : "") + '<span class="muted">' + L("waiting for teacher", "รอครูตรวจ") + "</span>";
  }
  function drawTests() {
    var el = $("[data-tests]"); if (!el || !home) return;
    var r = home.ready, learner = A.me.role === "student", staff = A.isStaff(), parent = A.me.role === "parent";
    function btn(kind, mode, label, ok, extra) {
      return '<button class="btn ' + (mode === "mock" ? "btn--primary" : "") + '" data-start="' + kind + '" data-mode="' + mode + '"' + (extra || "") + (ok ? "" : " disabled") + ">" + esc(label) + "</button>";
    }
    function m1n(p) { var x = (r.m1 || {})[p] || {}; return Object.keys(x).reduce(function (t, k) { return t + x[k]; }, 0); }
    var groups = {};
    (home.sets || []).forEach(function (x) { var g = EXAM[x.exam] ? x.exam : "other"; (groups[g] = groups[g] || []).push(x); });
    var sets = parent || !(home.sets || []).length ? "" : '<section class="box"><h2>' + L("Admission & practice test sets", "ชุดข้อสอบเตรียมสอบเข้าและชุดฝึก") + '</h2><p class="muted">' + L("Complete, timed sets — the same questions for everyone, with the answer order shuffled each time. Answers and explanations are shown at the end.", "ชุดข้อสอบครบชุดพร้อมจับเวลา ทุกคนได้ข้อเดียวกันแต่สลับลำดับตัวเลือกทุกครั้ง แสดงเฉลยและคำอธิบายเมื่อทำเสร็จ") + "</p>" +
      Object.keys(EXAM).filter(function (g) { return groups[g]; }).map(function (g) {
        return '<h3 class="set-group">' + L(EXAM[g][0], EXAM[g][1]) + '</h3><div class="set-grid">' + groups[g].map(function (x) {
          return '<div class="set-card"><b>' + esc(setTitle(x)) + '</b><small class="muted">' + x.questions + " " + (x.kind === "ielts-w" ? L("tasks", "งาน") : L("questions", "ข้อ")) + (x.minutes ? " · " + x.minutes + " " + L("min", "นาที") : "") + "</small>" +
            '<button class="btn btn--sm btn--primary" data-startset="' + esc(x.id) + '"' + (learner && !home.settings.studentsCanStart ? " disabled" : "") + ">" + L("Start", "เริ่มทำ") + "</button></div>";
        }).join("") + "</div>";
      }).join("") + "</section>";
    var cards = parent ? "" : sets +
      '<div class="test-grid">' +
      '<section class="box test-card"><h2>SAT Reading &amp; Writing</h2><p>' + L("2 adaptive modules · 27 questions · 32 minutes each. Module 2 gets harder or easier depending on module 1.", "2 โมดูลแบบปรับระดับ · โมดูลละ 27 ข้อ 32 นาที โมดูล 2 ยากหรือง่ายขึ้นตามผลโมดูล 1") + "</p>" +
      '<div class="btnrow">' + btn("sat", "mock", L("Full test (64 min)", "ข้อสอบเต็ม (64 นาที)"), r.sat.mock) + btn("sat", "practice", L("Practice by topic", "ฝึกตามหัวข้อ"), r.sat.approved >= 5) + "</div>" +
      (r.sat.mock ? "" : '<small class="muted">' + L("Full test opens when the bank has enough questions.", "ข้อสอบเต็มจะเปิดเมื่อคลังข้อสอบมีจำนวนพอ") + "</small>") + "</section>" +
      '<section class="box test-card"><h2>IELTS Academic Reading</h2><p>' + L("3 passages · 40 questions · 60 minutes. Spelling counts; keep to the word limit.", "3 บทอ่าน · 40 ข้อ · 60 นาที สะกดให้ถูกและเขียนไม่เกินจำนวนคำที่กำหนด") + "</p>" +
      '<div class="btnrow">' + btn("ielts-r", "mock", L("Full test (60 min)", "ข้อสอบเต็ม (60 นาที)"), r["ielts-r"].mock) + btn("ielts-r", "practice", L("One passage (20 min)", "1 บทอ่าน (20 นาที)"), r["ielts-r"].sets > 0) + "</div></section>" +
      '<section class="box test-card"><h2>IELTS Academic Writing</h2><p>' + L("Task 1 (150+ words) and Task 2 (250+ words) in 60 minutes. Your teacher confirms the band.", "Task 1 (150 คำขึ้นไป) และ Task 2 (250 คำขึ้นไป) ใน 60 นาที ครูเป็นผู้ยืนยันคะแนน") + "</p>" +
      '<div class="btnrow">' + btn("ielts-w", "mock", L("Full test (60 min)", "ข้อสอบเต็ม (60 นาที)"), r["ielts-w"].mock) + btn("ielts-w", "practice", L("Task 1 (20 min)", "Task 1 (20 นาที)"), r["ielts-w"].task1 > 0, ' data-task="1"') +
      btn("ielts-w", "practice", L("Task 2 (40 min)", "Task 2 (40 นาที)"), r["ielts-w"].task2 > 0, ' data-task="2"') + "</div></section>" +
      '<section class="box test-card"><h2>' + L("Suankularb M.1 entrance", "สอบเข้า ม.1 สวนกุหลาบ") + "</h2><p>" + L("GATE Program: Maths, Science, English, Thai. English Program (EPLUS+): English, Maths, Science in English. Practise any mix of subjects.", "GATE Program: คณิต วิทย์ อังกฤษ ไทย · English Program (EPLUS+): อังกฤษ คณิต วิทย์ (เป็นภาษาอังกฤษ) เลือกฝึกวิชาที่ต้องการได้") + "</p>" +
      '<div class="btnrow">' + btn("m1", "practice", "GATE · " + L("practice", "ฝึกทำ"), m1n("gate") >= 5, ' data-program="gate"') + btn("m1", "practice", "EP · " + L("practice", "ฝึกทำ"), m1n("ep") >= 5, ' data-program="ep"') + "</div></section></div>" +
      '<p class="muted small">' + L("Questions are written by DeepDistrict and scores are practice estimates, not official scores. SAT is a trademark of the College Board; IELTS belongs to the British Council, IDP and Cambridge. We are not affiliated with them.",
        "ข้อสอบเขียนโดย DeepDistrict และคะแนนเป็นค่าประมาณเพื่อการฝึก ไม่ใช่คะแนนทางการ SAT เป็นเครื่องหมายการค้าของ College Board ส่วน IELTS เป็นของ British Council, IDP และ Cambridge เราไม่มีส่วนเกี่ยวข้องกับองค์กรเหล่านี้") + "</p>";
    var list = home.attempts;
    var join = learner ? '<section class="box test-join"><h2>' + L("Join a live class", "เข้าห้องเรียนสด") + '</h2><form data-joinlive class="btnrow"><input name="code" maxlength="6" placeholder="ABC123" autocomplete="off" autocapitalize="characters" aria-label="Code"><button class="btn btn--primary">' + L("Join", "เข้าร่วม") + "</button></form></section>" : "";
    el.innerHTML = join + (staff ? '<p class="note">' + L("Staff: tests you start here are previews and are marked as such. Students' results appear below.", "เจ้าหน้าที่: ข้อสอบที่เริ่มจากหน้านี้เป็นการทดลอง (preview) ผลของนักเรียนแสดงด้านล่าง") + "</p>" : "") +
      (learner && !home.settings.studentsCanStart ? '<p class="note">' + L("Online tests are closed at the moment — ask your teacher.", "ขณะนี้ปิดการทำข้อสอบออนไลน์ — สอบถามครูผู้สอน") + "</p>" : cards) +
      '<section class="box"><h2>' + (parent ? L("My children's results", "ผลสอบของบุตรหลาน") : staff ? L("Results", "ผลสอบ") : L("My results", "ผลสอบของฉัน")) + "</h2>" +
      (list.length ? '<div class="tbl-wrap"><table class="tbl tbl--click"><thead><tr><th>' + L("Date", "วันที่") + "</th>" + (learner ? "" : "<th>" + L("Learner", "ผู้สอบ") + "</th>") + "<th>" + L("Test", "ข้อสอบ") + "</th><th>" + L("Score", "คะแนน") + "</th></tr></thead><tbody>" +
        list.map(function (a) {
          return '<tr data-attempt="' + esc(a.id) + '"><td class="nowrap">' + esc(when(a.createdAt)) + "</td>" + (learner ? "" : "<td>" + esc(a.userName) + (a.preview ? ' <small class="muted">(' + L("preview", "ทดลอง") + ")</small>" : "") + "</td>") +
            "<td>" + esc(kname(a.kind)) + '<br><small class="muted">' + esc(modeName(a)) + "</small></td><td>" + score(a) + "</td></tr>";
        }).join("") + "</tbody></table></div>" : A.empty("No tests yet.", "ยังไม่มีผลสอบ")) + "</section>";
    var jf = $("[data-joinlive]", el);
    if (jf) jf.addEventListener("submit", function (e) { e.preventDefault(); location.href = "live.html?code=" + encodeURIComponent(jf.elements.code.value.trim()); });
    $$("[data-attempt]", el).forEach(function (tr) { tr.addEventListener("click", function () { open(tr.getAttribute("data-attempt")); }); });
    $$("[data-start]", el).forEach(function (b) { b.addEventListener("click", function () { start(b.getAttribute("data-start"), b.getAttribute("data-mode"), b.getAttribute("data-task"), b.getAttribute("data-program")); }); });
    $$("[data-startset]", el).forEach(function (b) { b.addEventListener("click", function () { startSet(b.getAttribute("data-startset")); }); });
  }
  function startSet(id) {
    var x = (home.sets || []).filter(function (s) { return s.id === id; })[0]; if (!x) return;
    var rule = RULES[x.kind] || RULES.m1;
    A.form({ title: setTitle(x), intro: (x.note ? esc(x.note) + "<br><br>" : "") + "<b>" + (x.minutes || "") + (x.minutes ? " " + L("minutes", "นาที") + " · " : "") + x.questions + " " + (x.kind === "ielts-w" ? L("tasks", "งาน") : L("questions", "ข้อ")) + "</b><br><br>" +
      esc(x.kind === "sat" ? L("One module: move back and forth and change answers until you submit. No penalty for wrong answers.", "1 โมดูล ย้อนกลับและแก้คำตอบได้จนกว่าจะส่ง ตอบผิดไม่หักคะแนน") : L(rule[0], rule[1])) + "<br><br>" +
      esc(L("The timer runs on our server and keeps going if you close the page.", "ระบบจับเวลาบนเซิร์ฟเวอร์ และเวลายังเดินต่อแม้ปิดหน้า")), fields: [], submit: L("Start now", "เริ่มทำข้อสอบ"),
      onSave: function () { return A.api("POST", "exam/start", { setId: id }).then(function (r) { open(r.id); }).catch(function (e) { A.toast(e.message, "err"); return false; }); } });
  }

  var RULES = {
    sat: ["Two modules of 27 questions, 32 minutes each. You can move back and forth and change answers inside a module, but not after it is submitted. Module 2 starts straight away. There is no penalty for wrong answers — answer every question.",
      "2 โมดูล โมดูลละ 27 ข้อ 32 นาที ย้อนกลับและแก้คำตอบได้ภายในโมดูลเดียวกันเท่านั้น เมื่อส่งแล้วแก้ไม่ได้ โมดูล 2 เริ่มทันที ตอบผิดไม่หักคะแนน ควรตอบทุกข้อ"],
    "ielts-r": ["60 minutes for 3 passages and 40 questions. There is no extra time to transfer answers. Spelling must be correct and answers must keep to the word limit.",
      "60 นาที 3 บทอ่าน 40 ข้อ ไม่มีเวลาเพิ่มสำหรับย้ายคำตอบ ต้องสะกดถูกและไม่เกินจำนวนคำที่กำหนด"],
    m1: ["Four-choice questions. You can move back and forth and change answers until you submit. Each question has one best answer; there is no penalty for a wrong answer in this practice.",
      "ข้อสอบแบบ 4 ตัวเลือก ย้อนกลับและแก้คำตอบได้จนกว่าจะส่ง แต่ละข้อมีคำตอบที่ถูกที่สุดเพียงข้อเดียว แบบฝึกนี้ตอบผิดไม่หักคะแนน"],
    "ielts-w": ["Write at least 150 words for Task 1 and 250 words for Task 2. Spend about 20 minutes on Task 1 and 40 minutes on Task 2 — Task 2 counts twice as much. There is no spell-checker.",
      "Task 1 อย่างน้อย 150 คำ Task 2 อย่างน้อย 250 คำ ควรใช้เวลา Task 1 ประมาณ 20 นาที และ Task 2 ประมาณ 40 นาที (Task 2 มีน้ำหนักเป็นสองเท่า) ไม่มีตัวตรวจคำสะกด"]
  };
  function start(kind, mode, task, program) {
    var fields = [], intro = esc(L(RULES[kind][0], RULES[kind][1])) + "<br><br>" + esc(L("The timer runs on our server and keeps going if you close the page. Use a computer or tablet with a stable connection.", "ระบบจับเวลาบนเซิร์ฟเวอร์ และเวลายังเดินต่อแม้ปิดหน้า ควรใช้คอมพิวเตอร์หรือแท็บเล็ตที่อินเทอร์เน็ตเสถียร"));
    if (kind === "sat" && mode === "practice") {
      fields = [{ name: "domains", label: L("Topics", "หัวข้อ"), type: "checks", value: Object.keys(home.domains), options: Object.keys(home.domains).map(function (d) { return [d, A.tx(home.domains[d])]; }) },
        { name: "count", label: L("Number of questions (5–27)", "จำนวนข้อ (5–27)"), type: "number", min: 5, value: 10 },
        { name: "difficulty", label: L("Difficulty", "ระดับความยาก"), type: "select", value: "", options: [["", L("Mixed", "คละ")], ["e", L("Easy", "ง่าย")], ["m", L("Medium", "กลาง")], ["h", L("Hard", "ยาก")]] }];
      intro = esc(L("About 71 seconds per question, like the real test. Answers and explanations are shown at the end.", "ประมาณ 71 วินาทีต่อข้อเหมือนข้อสอบจริง เฉลยและคำอธิบายแสดงตอนจบ"));
    }
    if (kind === "m1") {
      var subs = home.m1.programs[program].subjects;
      fields = [{ name: "subjects", label: L("Subjects", "วิชา"), type: "checks", value: subs, options: subs.map(function (k) { return [k, L(SUBJ[k][0], SUBJ[k][1])]; }) },
        { name: "count", label: L("Number of questions (5–40)", "จำนวนข้อ (5–40)"), type: "number", min: 5, value: 10 }];
    }
    A.form({ title: (kind === "m1" ? A.tx(home.m1.programs[program]) : kname(kind)) + " · " + (mode === "mock" ? L("Full test", "ข้อสอบเต็ม") : L("Practice", "ฝึกทำ")), intro: intro, fields: fields, submit: L("Start now", "เริ่มทำข้อสอบ"),
      onSave: function (v) {
        var body = { kind: kind, mode: mode, task: task };
        if (v.domains) { body.domains = v.domains; body.count = v.count; body.difficulty = v.difficulty; }
        if (v.subjects) { body.program = program; body.subjects = v.subjects; body.count = v.count; }
        return A.api("POST", "exam/start", body).then(function (r) { open(r.id); }).catch(function (e) { A.toast(e.message, "err"); return false; });
      } });
  }

  /* ================================================================ Item bank (staff) */
  A.pages.bank = function (q) {
    if (!A.isStaff()) return A.pages.home(q);
    return { title: L("Exam item bank", "คลังข้อสอบ"),
      actions: (A.isAdmin() ? '<button class="btn" data-act="bank-settings">' + L("Settings & schedule", "ตั้งค่าและตารางสร้างข้อสอบ") + "</button>" : "") + '<button class="btn" data-act="pdf-paper">' + L("PDF paper", "ชุดข้อสอบ PDF") + '</button><button class="btn" data-act="bank-new">+ ' + L("New item", "เพิ่มข้อสอบ") + '</button><button class="btn btn--primary" data-act="bank-ai">✦ ' + L("Draft with AI", "ให้ AI ร่าง") + "</button>",
      html: '<div data-bank data-kind="' + esc(q.get("kind") || "") + '" data-status="' + esc(q.get("status") || "") + '"><p class="muted">' + L("Loading…", "กำลังโหลด…") + "</p></div>",
      after: function () { loadBank().then(drawBank).catch(function (e) { A.toast(e.message, "err"); }); } };
  };
  function loadBank() { return A.api("GET", "exam/bank").then(function (d) { bank = d; return d; }); }
  function bankAct(body) { return A.api("POST", "exam/bank", body).catch(function (e) { A.toast(e.message, "err"); throw e; }); }

  function summary(it) {
    if (it.kind === "sat") return esc((bank.domains[it.domain] || {}).en || it.domain) + " · " + esc(it.skill) + " · " + L(DIFF[it.difficulty][0], DIFF[it.difficulty][1]) + (it.pretest ? " · <i>pretest</i>" : "") + '<br><small class="muted">' + esc((it.stem || "").slice(0, 110)) + "</small>";
    if (it.kind === "m1") return esc(it.program.toUpperCase()) + " · " + L(SUBJ[it.subject][0], SUBJ[it.subject][1]) + " · " + L(DIFF[it.difficulty][0], DIFF[it.difficulty][1]) + '<br><small class="muted">' + esc((it.stem || "").slice(0, 110)) + "</small>";
    if (it.kind === "ielts-r") return "<b>" + esc(it.title) + "</b> · " + it.words + L(" words", " คำ") + '<br><small class="muted">' + it.groups.map(function (g) { return esc(g.type) + " ×" + g.n; }).join(" · ") + "</small>";
    return "Task " + it.task + (it.essayType ? " · " + esc(it.essayType) : "") + '<br><small class="muted">' + esc((it.prompt || "").slice(0, 110)) + "</small>";
  }
  function drawBank() {
    var el = $("[data-bank]"); if (!el || !bank) return;
    var kind = el.getAttribute("data-kind"), status = el.getAttribute("data-status"), r = bank.ready;
    var list = bank.items.filter(function (i) { return (!kind || i.kind === kind) && (!status || i.status === status); });
    var dom = Object.keys(r.sat.byDomain).map(function (d) { var x = r.sat.byDomain[d], n = x.e + x.m + x.h; return '<span class="' + (n >= r.sat.need[d] ? "ok" : "off") + '">' + esc(bank.domains[d].en) + ": " + n + "/" + r.sat.need[d] + " <small>(" + x.e + "/" + x.m + "/" + x.h + ")</small></span>"; }).join(" · ");
    el.innerHTML =
      '<section class="box"><h2>' + L("Ready for full tests?", "พร้อมสำหรับข้อสอบเต็มหรือยัง?") + "</h2>" +
      "<p><b>SAT</b> " + (r.sat.mock ? "✅" : "⏳") + " " + L("approved questions per domain (easy/medium/hard), minimum for one adaptive test: ", "ข้อที่อนุมัติแล้วต่อหมวด (ง่าย/กลาง/ยาก) ขั้นต่ำสำหรับข้อสอบปรับระดับ 1 ชุด: ") + dom +
      '<br><small class="muted">' + L("Aim for about 250+ so students rarely see the same question twice. Pretest (unscored) items: ", "ควรมี 250 ข้อขึ้นไปเพื่อไม่ให้นักเรียนเจอข้อซ้ำบ่อย ข้อ pretest (ไม่นับคะแนน): ") + r.sat.pretest + "</small></p>" +
      "<p><b>IELTS Reading</b> " + (r["ielts-r"].mock ? "✅" : "⏳") + " " + r["ielts-r"].sets + L(" approved passages · a full test needs 3 that add up to exactly 40 questions and 2,150–2,750 words", " บทอ่านที่อนุมัติ · ข้อสอบเต็มต้องมี 3 บทที่รวมกันได้ 40 ข้อพอดี และ 2,150–2,750 คำ") + "</p>" +
      "<p><b>IELTS Writing</b> " + (r["ielts-w"].mock ? "✅" : "⏳") + " Task 1: " + r["ielts-w"].task1 + " · Task 2: " + r["ielts-w"].task2 + "</p>" +
      ["gate", "ep"].map(function (p) { var x = (r.m1 || {})[p] || {}; return "<p><b>M.1 " + p.toUpperCase() + "</b> " + Object.keys(x).map(function (k) { return L(SUBJ[k][0], SUBJ[k][1]) + ": " + x[k]; }).join(" · ") + "</p>"; }).join("") +
      '<p><button class="btn" data-act="bank-ready">' + L("Load ready-made sets (SAT, IELTS, GATE, EP)", "โหลดชุดข้อสอบสำเร็จรูป (SAT, IELTS, GATE, EP)") + '</button> <small class="muted">' + L("Adds anything missing; never overwrites your edits.", "เพิ่มเฉพาะที่ยังไม่มี ไม่เขียนทับที่แก้ไขไว้") + "</small></p>" +
      (bank.items.length ? "" : '<button class="btn" data-act="bank-samples">' + L("Load sample items to try the system", "โหลดข้อสอบตัวอย่างเพื่อทดลองระบบ") + "</button>") + "</section>" +
      '<div class="filters" data-filters><select name="kind"><option value="">' + L("All types", "ทุกประเภท") + "</option>" + Object.keys(KIND).map(function (k) { return '<option value="' + k + '"' + (k === kind ? " selected" : "") + ">" + kname(k) + "</option>"; }).join("") + "</select>" +
      '<select name="status"><option value="">' + L("All statuses", "ทุกสถานะ") + "</option>" + Object.keys(STAT).map(function (k) { return '<option value="' + k + '"' + (k === status ? " selected" : "") + ">" + L(STAT[k][0], STAT[k][1]) + "</option>"; }).join("") + "</select></div>" +
      (list.length ? '<div class="tbl-wrap"><table class="tbl tbl--click"><thead><tr><th>' + L("Type", "ประเภท") + "</th><th>" + L("Item", "ข้อสอบ") + "</th><th>" + L("Status", "สถานะ") + "</th><th>" + L("Source", "ที่มา") + "</th><th></th></tr></thead><tbody>" +
        list.map(function (it) {
          var st = STAT[it.status];
          return '<tr data-item="' + esc(it.id) + '"><td>' + esc(kname(it.kind)) + "</td><td>" + summary(it) + (it.problems.length ? '<br><small class="warn-text">' + esc(it.problems.join(" · ")) + "</small>" : "") + "</td><td>" + A.badge(st[2], L(st[0], st[1])) + "</td>" +
            "<td>" + (it.origin === "ai" ? "AI" : L("Staff", "ครู")) + (it.tags && it.tags.length ? '<br><small class="muted">' + esc(it.tags.join(", ")) + "</small>" : "") + '<br><small class="muted">v' + it.version + "</small></td>" +
            '<td class="nowrap">' + (it.status !== "approved" && !it.problems.length ? '<button class="btn btn--sm btn--primary" data-approve="' + esc(it.id) + '">' + L("Approve", "อนุมัติ") + "</button>" : "") +
            (it.status === "approved" ? '<button class="btn btn--sm" data-retire="' + esc(it.id) + '">' + L("Retire", "เลิกใช้") + "</button>" : "") + "</td></tr>";
        }).join("") + "</tbody></table></div>" : A.empty("No items match.", "ไม่มีข้อสอบตามเงื่อนไข"));
    $$("[data-item]", el).forEach(function (tr) { tr.addEventListener("click", function (e) { if (e.target.closest("button")) return; editItem(tr.getAttribute("data-item")); }); });
    if (A.bankStats) A.bankStats($("section.box", el), function () { loadBank().then(drawBank); });
    $$("[data-approve]", el).forEach(function (b) { b.addEventListener("click", function () { bankAct({ status: { id: b.getAttribute("data-approve"), to: "approved" } }).then(function () { A.toast(L("Approved", "อนุมัติแล้ว")); return loadBank().then(drawBank); }); }); });
    $$("[data-retire]", el).forEach(function (b) { b.addEventListener("click", function () { bankAct({ status: { id: b.getAttribute("data-retire"), to: "retired" } }).then(function () { return loadBank().then(drawBank); }); }); });
  }

  /* --- IELTS question groups as editable text ---------------------------------
     ### tfng
     > instructions
     * i: heading text              (options, for matching types)
     - question text => answer / alternative
       A: option                    (multiple choice options, under the question)
     ### sentence-completion | max=2 | number                                    */
  function groupsToText(groups) {
    return (groups || []).map(function (g) {
      var head = "### " + g.type + (g.wordLimit ? " | max=" + g.wordLimit.words + (g.wordLimit.number ? " | number" : "") : "");
      var opts = g.type === "tfng" || g.type === "ynng" ? [] : (g.options || []).map(function (o) { return "* " + o.key + ": " + o.text; });
      var ctx = (g.context || "").split(/\n/).filter(function (l) { return l.trim(); }).map(function (l) { return "~ " + l; });
      return [head, "> " + (g.instructions || "")].concat(ctx, opts, g.questions.map(function (q) {
        return "- " + q.text + " => " + (q.answer || []).join(" / ") + (q.options || []).map(function (o) { return "\n  " + o.key + ": " + o.text; }).join("");
      })).join("\n");
    }).join("\n\n");
  }
  function textToGroups(t) {
    var groups = [], g = null, q = null;
    t.split(/\n/).forEach(function (line) {
      var m;
      if ((m = /^###\s*([a-z\-]+)(.*)$/.exec(line.trim()))) {
        var mx = /max=(\d)/.exec(m[2]);
        g = { type: m[1], instructions: "", options: [], wordLimit: { words: mx ? +mx[1] : 2, number: /number/.test(m[2]) }, questions: [] }; groups.push(g); q = null; return;
      }
      if (!g) return;
      if ((m = /^>\s?(.*)$/.exec(line.trim()))) { g.instructions += (g.instructions ? " " : "") + m[1]; return; }
      if ((m = /^~\s?(.*)$/.exec(line.trim()))) { g.context = (g.context ? g.context + "\n" : "") + m[1]; return; }
      if ((m = /^\*\s*([^:]+):\s*(.+)$/.exec(line.trim()))) { g.options.push({ key: m[1].trim(), text: m[2].trim() }); return; }
      if ((m = /^-\s*(.*?)\s*=>\s*(.*)$/.exec(line.trim()))) { q = { text: m[1], answer: m[2].split("/").map(function (s) { return s.trim(); }).filter(Boolean), options: [] }; g.questions.push(q); return; }
      if (q && (m = /^\s+([A-Z]):\s*(.+)$/.exec(line))) q.options.push({ key: m[1], text: m[2].trim() });
    });
    return groups;
  }
  function tableToText(t) { return t && t.rows ? t.rows.map(function (r) { return r.join(" | "); }).join("\n") : ""; }
  function textToTable(s, title) { var rows = s.split(/\n/).map(function (l) { return l.trim(); }).filter(Boolean).map(function (l) { return l.split("|").map(function (c) { return c.trim(); }); }); return rows.length ? { title: title || "", rows: rows } : null; }

  function editItem(id, kind) {
    (id ? A.api("GET", "exam/item?id=" + encodeURIComponent(id)) : Promise.resolve({ item: { kind: kind, status: "draft", origin: "original" }, problems: [] })).then(function (d) {
      var it = d.item, f = [], skills = [];
      Object.keys(bank.domains).forEach(function (dm) { bank.domains[dm].skills.forEach(function (s) { skills.push([s, s, bank.domains[dm].en]); }); });
      var statusOpts = Object.keys(STAT).map(function (k) { return [k, L(STAT[k][0], STAT[k][1])]; });
      if (it.kind === "sat") {
        f = [{ name: "domain", label: L("Content domain", "หมวดเนื้อหา"), type: "select", value: it.domain || "cs", options: Object.keys(bank.domains).map(function (k) { return [k, bank.domains[k].en]; }) },
          { name: "skill", label: L("Skill", "ทักษะ"), type: "select", value: it.skill, options: skills },
          { name: "difficulty", label: L("Difficulty", "ความยาก"), type: "select", value: it.difficulty || "m", options: [["e", L("Easy", "ง่าย")], ["m", L("Medium", "กลาง")], ["h", L("Hard", "ยาก")]] },
          { name: "pretest", label: L("Pretest (unscored, to try out a new question)", "Pretest (ไม่นับคะแนน ใช้ทดลองข้อใหม่)"), type: "checkbox", value: it.pretest },
          { name: "passage", label: L("Passage (25–150 words; cross-text up to 300; blanks as ______)", "บทอ่าน (25–150 คำ; cross-text ไม่เกิน 300; ช่องว่างใช้ ______)"), type: "textarea", value: it.passage, full: true },
          { name: "table", label: L("Data table (optional; one row per line, cells separated by |, first row = headers)", "ตารางข้อมูล (ถ้ามี; บรรทัดละแถว คั่นช่องด้วย | แถวแรกเป็นหัวตาราง)"), type: "textarea", value: tableToText(it.table), full: true },
          { name: "image", label: L("…or a bar / line graph image (quantitative evidence)", "…หรือรูปกราฟแท่ง/กราฟเส้น (สำหรับข้อ quantitative evidence)"), type: "image", value: it.image },
          { name: "stem", label: L("Question", "คำถาม"), value: it.stem, full: true },
          { name: "c0", label: "A", value: (it.choices || [])[0] }, { name: "c1", label: "B", value: (it.choices || [])[1] }, { name: "c2", label: "C", value: (it.choices || [])[2] }, { name: "c3", label: "D", value: (it.choices || [])[3] },
          { name: "answer", label: L("Correct answer", "คำตอบที่ถูก"), type: "select", value: it.answer, options: [[0, "A"], [1, "B"], [2, "C"], [3, "D"]] },
          { name: "expEn", label: L("Explanation (English)", "คำอธิบาย (อังกฤษ)"), type: "textarea", value: (it.explanation || {}).en, full: true },
          { name: "expTh", label: L("Explanation (Thai)", "คำอธิบาย (ไทย)"), type: "textarea", value: (it.explanation || {}).th, full: true }];
      } else if (it.kind === "m1") {
        var prog = it.program || "gate";
        f = [{ name: "program", label: L("Programme", "โครงการ"), type: "select", value: prog, options: [["gate", "GATE Program"], ["ep", "English Program (EPLUS+)"]] },
          { name: "subject", label: L("Subject", "วิชา"), type: "select", value: it.subject || "math", options: Object.keys(SUBJ).map(function (k) { return [k, L(SUBJ[k][0], SUBJ[k][1])]; }), hint: L("EP has no Thai paper.", "EP ไม่มีวิชาภาษาไทย") },
          { name: "difficulty", label: L("Difficulty", "ความยาก"), type: "select", value: it.difficulty || "m", options: [["e", L("Easy", "ง่าย")], ["m", L("Medium", "กลาง")], ["h", L("Hard", "ยาก")]] },
          { name: "passage", label: L("Reading text / situation (optional, shared by the question)", "บทอ่าน / สถานการณ์ (ถ้ามี)"), type: "textarea", value: it.passage, full: true },
          { name: "table", label: L("Data table (optional; one row per line, cells separated by |)", "ตารางข้อมูล (ถ้ามี; บรรทัดละแถว คั่นช่องด้วย |)"), type: "textarea", value: tableToText(it.table), full: true },
          { name: "image", label: L("Picture (optional)", "รูปภาพ (ถ้ามี)"), type: "image", value: it.image },
          { name: "stem", label: L("Question", "คำถาม"), type: "textarea", value: it.stem, full: true },
          { name: "c0", label: "A", value: (it.choices || [])[0] }, { name: "c1", label: "B", value: (it.choices || [])[1] }, { name: "c2", label: "C", value: (it.choices || [])[2] }, { name: "c3", label: "D", value: (it.choices || [])[3] },
          { name: "answer", label: L("Correct answer", "คำตอบที่ถูก"), type: "select", value: it.answer, options: [[0, "A"], [1, "B"], [2, "C"], [3, "D"]] },
          { name: "expEn", label: L("Explanation (English)", "คำอธิบาย (อังกฤษ)"), type: "textarea", value: (it.explanation || {}).en, full: true },
          { name: "expTh", label: L("Explanation (Thai)", "คำอธิบาย (ไทย)"), type: "textarea", value: (it.explanation || {}).th, full: true }];
      } else if (it.kind === "ielts-r") {
        f = [{ name: "title", label: L("Passage title", "ชื่อบทอ่าน"), value: it.title, full: true },
          { name: "difficulty", label: L("Level (order in a full test)", "ระดับ (ลำดับในข้อสอบเต็ม)"), type: "select", value: it.difficulty || 2, options: [[1, L("1 — easier", "1 — ง่ายกว่า")], [2, L("2 — medium", "2 — กลาง")], [3, L("3 — harder", "3 — ยากกว่า")]] },
          { name: "paragraphs", label: L("Passage — one paragraph per block, separated by an empty line (shown as A, B, C…)", "บทอ่าน — ย่อหน้าละช่วง คั่นด้วยบรรทัดว่าง (แสดงเป็น A, B, C…)"), type: "textarea", value: (it.paragraphs || []).join("\n\n"), full: true },
          { name: "groups", label: L("Questions (see the format below)", "คำถาม (ดูรูปแบบด้านล่าง)"), type: "textarea", value: groupsToText(it.groups) || "### tfng\n> Do the following statements agree with the information given in the passage?\n- statement => TRUE", full: true,
            hint: "### type | max=2 | number   ·   > instructions   ·   ~ summary / notes / table / flow-chart text with gaps, e.g. ~ caused by (9) ______   ·   * key: option (lists, word box)   ·   - question => answer / alternative   ·   mcq & mcq-multi: options under the question as  A: option ; mcq-multi answer:  B / D  (TWO letters) or  A / C / F  (THREE). " + L("Types: ", "ประเภท: ") + Object.keys(bank.types).map(function (k) { return k + " (" + bank.types[k] + ")"; }).join(", ") }];
      } else {
        f = [{ name: "task", label: "Task", type: "select", value: it.task || 2, options: [[1, "Task 1 (150+)"], [2, "Task 2 (250+)"]] },
          { name: "prompt", label: L("Task wording", "โจทย์"), type: "textarea", value: it.prompt, full: true },
          { name: "image", label: L("Task 1 chart / diagram image", "รูปกราฟ/แผนภาพของ Task 1"), type: "image", value: it.image },
          { name: "table", label: L("…or a data table (one row per line, cells separated by |)", "…หรือ ตารางข้อมูล (บรรทัดละแถว คั่นช่องด้วย |)"), type: "textarea", value: tableToText(it.table), full: true },
          { name: "tableTitle", label: L("Table title", "ชื่อตาราง"), value: it.table && it.table.title, full: true }];
      }
      f.push({ name: "rightsOk", label: L("I confirm this item is original — not copied or closely adapted from official or published tests (required to approve)", "ยืนยันว่าข้อสอบนี้เป็นงานต้นฉบับ ไม่ได้คัดลอกหรือดัดแปลงจากข้อสอบทางการหรือที่ตีพิมพ์ (ต้องยืนยันก่อนอนุมัติ)"), type: "checkbox", value: it.rightsOk, full: true },
        { name: "status", label: L("Status", "สถานะ"), type: "select", value: it.status, options: statusOpts }, { name: "tags", label: L("Tags", "แท็ก"), value: (it.tags || []).join(", ") });
      A.form({
        title: (id ? L("Edit", "แก้ไข") : L("New", "เพิ่ม")) + " · " + kname(it.kind),
        intro: d.problems.length ? '<span class="warn-text">' + esc(d.problems.join(" · ")) + "</span>" : (d.versions ? esc(L("Version ", "เวอร์ชัน ") + it.version + " · " + L("every save keeps the previous version", "ทุกครั้งที่บันทึกจะเก็บเวอร์ชันก่อนหน้าไว้")) : ""),
        fields: f,
        onDelete: id && A.isAdmin() ? function () { bankAct({ delete: id }).then(function () { return loadBank().then(drawBank); }); } : null,
        onSave: function (v) {
          var out = { id: it.id, kind: it.kind, status: v.status, rightsOk: v.rightsOk, origin: it.origin, tags: v.tags.split(",").map(function (s) { return s.trim(); }).filter(Boolean), note: it.note };
          if (it.kind === "sat") Object.assign(out, { domain: v.domain, skill: v.skill, difficulty: v.difficulty, pretest: v.pretest, passage: v.passage, table: textToTable(v.table), image: v.image, stem: v.stem,
            choices: [v.c0, v.c1, v.c2, v.c3], answer: +v.answer, explanation: { en: v.expEn, th: v.expTh } });
          else if (it.kind === "m1") Object.assign(out, { program: v.program, subject: v.subject, difficulty: v.difficulty, passage: v.passage, table: textToTable(v.table), image: v.image, stem: v.stem,
            choices: [v.c0, v.c1, v.c2, v.c3], answer: +v.answer, explanation: { en: v.expEn, th: v.expTh } });
          else if (it.kind === "ielts-r") Object.assign(out, { title: v.title, difficulty: +v.difficulty, labelled: true, paragraphs: v.paragraphs.split(/\n\s*\n/).map(function (p) { return p.replace(/\s*\n\s*/g, " ").trim(); }).filter(Boolean),
            groups: textToGroups(v.groups).map(function (g, i) { var old = (it.groups || [])[i]; if (old && old.image && old.type === g.type) g.image = old.image; return g; }) });
          else Object.assign(out, { task: +v.task, prompt: v.prompt, image: v.image, table: textToTable(v.table, v.tableTitle), visual: it.visual, essayType: it.essayType });
          return bankAct({ save: out }).then(function (r) {
            A.toast(r.problems.length ? L("Saved — still to fix: ", "บันทึกแล้ว — ยังต้องแก้: ") + r.problems.join(" · ") : L("Saved", "บันทึกแล้ว"), r.problems.length ? "err" : "");
            return loadBank().then(drawBank);
          }).catch(function () { return false; });
        }
      });
      // keep the skill list in line with the chosen domain
      var form = $("dialog.modal form");
      if (form && form.elements.domain) {
        var sync = function () { var dm = form.elements.domain.value; $$("option", form.elements.skill).forEach(function (o) { o.hidden = bank.domains[dm].skills.indexOf(o.value) === -1; }); if (form.elements.skill.selectedOptions[0].hidden) form.elements.skill.value = bank.domains[dm].skills[0]; };
        form.elements.domain.addEventListener("change", sync); sync();
      }
    }).catch(function (e) { A.toast(e.message, "err"); });
  }

  function aiDraft() {
    if (!bank.ai) return A.toast(L("AI is not ready — ask the admin to check AI settings.", "AI ยังไม่พร้อม — ให้ผู้ดูแลตรวจการตั้งค่า AI"), "err");
    A.form({
      title: L("Draft items with AI", "ให้ AI ร่างข้อสอบ"),
      intro: esc(L("The AI writes ORIGINAL items in the official format. They arrive as drafts: a teacher checks every answer, confirms originality and approves before students see them.", "AI จะเขียนข้อสอบใหม่ตามรูปแบบทางการ ข้อสอบจะอยู่ในสถานะฉบับร่าง ครูต้องตรวจคำตอบทุกข้อ ยืนยันความเป็นต้นฉบับ และอนุมัติก่อนนักเรียนจะเห็น")),
      fields: [{ name: "kind", label: L("Type", "ประเภท"), type: "select", options: Object.keys(KIND).filter(function (k) { return k !== "m1"; }).map(function (k) { return [k, kname(k)]; }), value: "sat" },
        { name: "domain", label: "SAT · " + L("domain", "หมวด"), type: "select", options: Object.keys(bank.domains).map(function (k) { return [k, bank.domains[k].en]; }) },
        { name: "difficulty", label: L("SAT difficulty / IELTS passage level", "ความยาก SAT / ระดับบทอ่าน IELTS"), type: "select", options: [["", L("Mixed", "คละ")], ["e", L("Easy / level 1", "ง่าย / ระดับ 1")], ["m", L("Medium / level 2", "กลาง / ระดับ 2")], ["h", L("Hard / level 3", "ยาก / ระดับ 3")]] },
        { name: "count", label: L("SAT: how many (1–10)", "SAT: จำนวนข้อ (1–10)"), type: "number", min: 1, value: 5 },
        { name: "task", label: L("Writing: which task", "Writing: Task ไหน"), type: "select", options: [[2, "Task 2"], [1, "Task 1 (table)"]] },
        { name: "topic", label: L("Topic ideas (optional)", "แนวหัวข้อ (ไม่บังคับ)"), full: true }],
      submit: L("Start drafting", "เริ่มร่าง"),
      onSave: function (v) {
        var lvl = { e: 1, m: 2, h: 3 }[v.difficulty] || 2;
        return bankAct({ draft: { kind: v.kind, domain: v.domain, difficulty: v.kind === "ielts-r" ? lvl : v.difficulty, count: v.count, task: v.task, topic: v.topic } }).then(function () {
          A.toast(L("The AI is drafting — refresh this page in about a minute.", "AI กำลังร่าง — รีเฟรชหน้านี้ในอีกประมาณ 1 นาที"));
          setTimeout(function () { if (location.hash.indexOf("#/bank") === 0) loadBank().then(drawBank); }, 45000);
        }).catch(function () { return false; });
      }
    });
  }

  /* ================================================================ Writing marking (staff) */
  A.pages.marking = function (q) {
    if (!A.isStaff()) return A.pages.home(q);
    return { title: L("IELTS Writing marking", "ตรวจข้อสอบ IELTS Writing"), html: '<div data-marking><p class="muted">' + L("Loading…", "กำลังโหลด…") + "</p></div>",
      after: function () {
        A.api("GET", "exam/marking").then(function (d) {
          var el = $("[data-marking]"); if (!el) return;
          var todo = d.items.filter(function (a) { return !a.marked; }), done = d.items.filter(function (a) { return a.marked; });
          function table(list) {
            return '<div class="tbl-wrap"><table class="tbl tbl--click"><thead><tr><th>' + L("Submitted", "ส่งเมื่อ") + "</th><th>" + L("Learner", "ผู้สอบ") + "</th><th>" + L("Test", "ข้อสอบ") + "</th><th>" + L("Band", "คะแนน") + "</th></tr></thead><tbody>" +
              list.map(function (a) { return '<tr data-mark="' + esc(a.id) + '"><td class="nowrap">' + esc(when(a.finishedAt)) + "</td><td>" + esc(a.userName) + "</td><td>" + (a.mode === "mock" ? L("Full test", "ข้อสอบเต็ม") : L("Practice", "ฝึกทำ")) + "</td><td>" + (a.marked ? "<b>" + a.band + "</b>" : (a.aiBand != null ? "AI ≈ " + a.aiBand : "–")) + "</td></tr>"; }).join("") + "</tbody></table></div>";
          }
          el.innerHTML = '<section class="box"><h2>' + L("Waiting for marking", "รอตรวจ") + " (" + todo.length + ")</h2>" + (todo.length ? table(todo) : A.empty("Nothing to mark.", "ไม่มีงานรอตรวจ")) + "</section>" +
            '<section class="box"><h2>' + L("Marked", "ตรวจแล้ว") + "</h2>" + (done.length ? table(done) : A.empty("None yet.", "ยังไม่มี")) + "</section>";
          $$("[data-mark]", el).forEach(function (tr) { tr.addEventListener("click", function () { open(tr.getAttribute("data-mark"), "&mark=1"); }); });
        }).catch(function (e) { A.toast(e.message, "err"); });
      } };
  };

  function bankSettings() {
    var s = bank.settings, a = s.autoDraft || {};
    A.form({
      title: L("Online test settings & item schedule", "ตั้งค่าข้อสอบออนไลน์และตารางสร้างข้อสอบ"),
      intro: esc(L("Scheduled drafting: on the chosen days the AI writes new items in each test's official format. They arrive as drafts — a teacher checks every answer and approves them before learners see them.",
        "ตั้งเวลาสร้างข้อสอบ: ในวันที่เลือก AI จะเขียนข้อสอบใหม่ตามรูปแบบทางการของแต่ละประเภท ข้อสอบจะอยู่ในสถานะฉบับร่าง ครูต้องตรวจคำตอบและอนุมัติก่อนนักเรียนจะเห็น")),
      fields: [
        { name: "shuffle", label: L("Shuffle answer options (same questions, new A/B/C/D order for each test, class and printed set)", "สลับลำดับตัวเลือก (ข้อเดิม แต่ลำดับ A/B/C/D ใหม่ทุกรอบสอบ ทุกห้องเรียน และทุกชุดที่พิมพ์)"), type: "checkbox", value: s.shuffle !== false, full: true },
        { name: "studentsCanStart", label: L("Learners may start online tests", "นักเรียนเริ่มทำข้อสอบออนไลน์ได้"), type: "checkbox", value: s.studentsCanStart, full: true },
        { name: "practiceReview", label: L("Show answers after practice tests", "แสดงเฉลยหลังทำแบบฝึก"), type: "checkbox", value: s.practiceReview },
        { name: "mockReview", label: L("Show answers after full tests", "แสดงเฉลยหลังข้อสอบเต็ม"), type: "checkbox", value: s.mockReview },
        { name: "routeAt", label: L("SAT routing: share of module 1 correct for the harder module 2 (0.3–0.9) — our estimate; College Board does not publish it", "SAT: สัดส่วนข้อถูกในโมดูล 1 ที่จะได้โมดูล 2 ชุดยาก (0.3–0.9) — ค่าประมาณของเรา College Board ไม่ได้เผยแพร่"), type: "number", step: "0.05", min: 0.3, value: s.routeAt, full: true },
        { name: "easyCap", label: L("SAT: estimated top score after the easier module 2 — unofficial", "SAT: คะแนนสูงสุดโดยประมาณเมื่อได้โมดูล 2 ชุดง่าย — ไม่ใช่ตัวเลขทางการ"), type: "number", step: "10", min: 400, value: s.easyCap },
        { name: "writingAiInstant", label: L("Practice Writing: show AI feedback at once (labelled as an estimate)", "Writing แบบฝึก: แสดงคำแนะนำจาก AI ทันที (ระบุว่าเป็นค่าประมาณ)"), type: "checkbox", value: s.writingAiInstant, full: true },
        { name: "autoOn", label: L("Scheduled drafting with AI", "ตั้งเวลาให้ AI สร้างข้อสอบ"), type: "checkbox", value: a.enabled, full: true },
        { name: "days", label: L("On these days (none = every day)", "ในวันเหล่านี้ (ไม่เลือก = ทุกวัน)"), type: "days", value: a.days },
        { name: "hour", label: L("From this hour (Bangkok)", "ตั้งแต่เวลา (กรุงเทพฯ)"), type: "number", min: 0, value: a.hour },
        { name: "sat", label: L("SAT questions per domain each time (0–10; 4 domains)", "ข้อ SAT ต่อหมวดต่อครั้ง (0–10; มี 4 หมวด)"), type: "number", min: 0, value: a.sat },
        { name: "reading", label: L("IELTS Reading passages each time (0–2)", "บทอ่าน IELTS ต่อครั้ง (0–2)"), type: "number", min: 0, value: a.reading },
        { name: "writing", label: L("IELTS Writing tasks each time (0–2)", "โจทย์ IELTS Writing ต่อครั้ง (0–2)"), type: "number", min: 0, value: a.writing },
        { name: "topics", label: L("Topic ideas (optional)", "แนวหัวข้อ (ไม่บังคับ)"), value: a.topics, full: true }
      ],
      onSave: function (v) {
        return A.api("POST", "exam/settings", { routeAt: v.routeAt, easyCap: v.easyCap, shuffle: v.shuffle, studentsCanStart: v.studentsCanStart, practiceReview: v.practiceReview, mockReview: v.mockReview, writingAiInstant: v.writingAiInstant,
          autoDraft: { enabled: v.autoOn, days: v.days, hour: v.hour, sat: v.sat, reading: v.reading, writing: v.writing, topics: v.topics } })
          .then(function () { A.toast(L("Saved", "บันทึกแล้ว")); return loadBank().then(drawBank); }).catch(function (e) { A.toast(e.message, "err"); return false; });
      }
    });
  }
  var prev = A.onAct;
  A.onAct = function (a, b, ev) {
    if (a === "bank-settings") bankSettings();
    else if (a === "bank-ai") aiDraft();
    else if (a === "bank-ready") A.api("POST", "exam/sets-load", {}).then(function (r) { A.toast(L(r.items + " items and " + r.sets + " sets added", "เพิ่มข้อสอบ " + r.items + " ข้อ และ " + r.sets + " ชุด")); return loadBank().then(drawBank); }).catch(function (e) { A.toast(e.message, "err"); });
    else if (a === "bank-samples") bankAct({ samples: true }).then(function (r) { A.toast(L(r.added + " sample items added", "เพิ่มข้อสอบตัวอย่าง " + r.added + " ข้อ")); return loadBank().then(drawBank); });
    else if (a === "bank-new") A.form({ title: L("New item", "เพิ่มข้อสอบ"), fields: [{ name: "kind", label: L("Type", "ประเภท"), type: "select", options: Object.keys(KIND).map(function (k) { return [k, kname(k)]; }) }],
      submit: L("Next", "ถัดไป"), onSave: function (v) { setTimeout(function () { editItem(null, v.kind); }, 0); } });
    else if (prev) prev(a, b, ev);
  };
})();
