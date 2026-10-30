/* ==========================================================================
   DeepDistrict.si — Free practice tests (public page, no sign-in)
   Data: assets/data/tests.js (window.DD_TESTS, built by tools/build_public_data.py from
   server/exam_sets). Shows a few sample questions of each ready-made set and marks them in the
   browser; the full timed sets are taken in the student portal.
   pages/tests.html?exam=gate&set=2 opens one set directly.
   ========================================================================== */
(function () {
  "use strict";
  var root = document.querySelector("[data-tests]");
  var T = window.DD_TESTS;
  if (!root || !T) return;
  var base = document.body.getAttribute("data-base") || "";

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function bi(en, th) { return '<span lang="en">' + en + '</span><span lang="th">' + th + "</span>"; }
  function both(v) { v = v || {}; return bi(esc(v.en || v.th || ""), esc(v.th || v.en || "")); }
  function norm(s) { return String(s || "").toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, " ").trim(); }
  var LET = ["A", "B", "C", "D"];
  var EXAMS = {
    sat: { name: bi("SAT Reading &amp; Writing", "SAT Reading &amp; Writing"), cls: "sat", desc: bi("Digital SAT format · one module of 27 questions in 32 minutes · four content domains.", "รูปแบบ Digital SAT · 1 โมดูล 27 ข้อ 32 นาที · ครบ 4 หมวดเนื้อหา"), glyph: "SAT" },
    ielts: { name: bi("IELTS Academic", "IELTS Academic"), cls: "ielts", desc: bi("Reading: 3 passages, 40 questions, 60 minutes · Writing: Task 1 + Task 2, 60 minutes.", "Reading 3 บทความ 40 ข้อ 60 นาที · Writing Task 1 + Task 2 60 นาที"), glyph: "IELTS" },
    gate: { name: bi("Suankularb M.1 · GATE Program", "สวนกุหลาบ ม.1 · GATE Program"), cls: "gate", desc: bi("40 questions in 90 minutes: Maths 15, Science 15, English 5, Thai 5.", "40 ข้อ 90 นาที: คณิต 15 วิทย์ 15 อังกฤษ 5 ไทย 5"), glyph: "ม.1" },
    ep: { name: bi("Suankularb M.1 · English Program (EPLUS+)", "สวนกุหลาบ ม.1 · English Program (EPLUS+)"), cls: "ep", desc: bi("40 questions in English, 90 minutes: English 20, Maths 10, Science 10.", "40 ข้อเป็นภาษาอังกฤษ 90 นาที: อังกฤษ 20 คณิต 10 วิทย์ 10"), glyph: "EP" }
  };
  var SUBJ = { math: bi("Mathematics", "คณิตศาสตร์"), sci: bi("Science", "วิทยาศาสตร์"), eng: bi("English", "ภาษาอังกฤษ"), thai: bi("Thai", "ภาษาไทย") };
  var DOM = { cs: "Craft and Structure", ii: "Information and Ideas", sec: "Standard English Conventions", eoi: "Expression of Ideas" };

  var q = new URLSearchParams(location.search), cur = null;

  function overview() {
    var by = {};
    T.forEach(function (s) { (by[s.exam] = by[s.exam] || []).push(s); });
    root.innerHTML = '<div class="pt-grid">' + Object.keys(EXAMS).filter(function (k) { return by[k]; }).map(function (k) {
      var e = EXAMS[k];
      return '<section class="card pt-card pt-card--' + e.cls + '"><div class="pt-card__head"><span class="pt-glyph">' + esc(e.glyph) + "</span><h2>" + e.name + "</h2></div><p>" + e.desc + "</p>" +
        '<div class="pt-sets">' + by[k].map(function (s) {
          return '<a class="btn pt-set" href="?exam=' + k + "&set=" + s.set + '" data-open="' + k + ":" + s.set + '">' + bi("Set " + s.set, "ชุดที่ " + s.set) + " · " + bi("try free", "ลองฟรี") + "</a>";
        }).join("") + "</div></section>";
    }).join("") + "</div>" + cta() + disclaimer();
  }

  function cta() {
    return '<aside class="pt-cta card"><div><h2>' + bi("Want the full timed test?", "อยากทำชุดเต็มแบบจับเวลา?") + "</h2><p>" +
      bi("DeepDistrict students take every set in full in the student portal — timed by our server, with answers shuffled each time, explanations, a score report PDF and live classes with a teacher.",
        "นักเรียน DeepDistrict ทำชุดเต็มทุกชุดได้ในระบบนักเรียน จับเวลาโดยเซิร์ฟเวอร์ สลับตัวเลือกทุกครั้ง มีคำอธิบาย รายงานผลสอบ PDF และห้องเรียนสดกับครู") + '</p></div><div class="pt-cta__btns">' +
      '<a class="btn btn--primary" href="' + base + 'admin/index.html#/tests">' + bi("Sign in &amp; take the full test", "เข้าสู่ระบบเพื่อทำชุดเต็ม") + "</a>" +
      '<a class="btn" href="' + base + 'pages/contact.html">' + bi("Ask about a free level check", "สอบถามการวัดระดับฟรี") + "</a></div></aside>";
  }
  function disclaimer() {
    return '<p class="pt-note">' + bi("All questions are written by DeepDistrict — not official, past or leaked papers. SAT is a trademark of the College Board; IELTS belongs to the British Council, IDP and Cambridge University Press &amp; Assessment. Suankularb Wittayalai does not publish its papers; the GATE and EP sets follow the subjects the school announces. We are not affiliated with these organisations.",
      "ข้อสอบทั้งหมดเขียนโดย DeepDistrict ไม่ใช่ข้อสอบจริงหรือข้อสอบเก่า SAT เป็นเครื่องหมายการค้าของ College Board ส่วน IELTS เป็นของ British Council, IDP และ Cambridge University Press &amp; Assessment โรงเรียนสวนกุหลาบวิทยาลัยไม่เผยแพร่ข้อสอบ ชุด GATE และ EP จัดตามวิชาที่โรงเรียนประกาศ เราไม่มีส่วนเกี่ยวข้องกับองค์กรเหล่านี้") + "</p>";
  }

  function passage(t) {
    return esc(t || "").split(/\n/).map(function (l) { return /^- /.test(l) ? "<li>" + l.slice(2) + "</li>" : l ? "<p>" + l + "</p>" : ""; }).join("").replace(/(<li>.*?<\/li>)+/g, function (m) { return "<ul>" + m + "</ul>"; });
  }
  function table(t) {
    return t && t.rows && t.rows.length ? '<div class="pt-table">' + (t.title ? "<b>" + esc(t.title) + "</b>" : "") + "<table>" + t.rows.map(function (r, i) { return "<tr>" + r.map(function (c) { return i ? "<td>" + esc(c) + "</td>" : "<th>" + esc(c) + "</th>"; }).join("") + "</tr>"; }).join("") + "</table></div>" : "";
  }
  function expl(e) { e = e || {}; return '<div class="pt-exp" hidden>' + bi(esc(e.en || e.th || ""), esc(e.th || e.en || "")) + "</div>"; }

  function openSet(exam, n) {
    var s = T.filter(function (x) { return x.exam === exam && String(x.set) === String(n); })[0];
    if (!s) return overview();
    cur = s;
    var e = EXAMS[exam], body = "";
    if (s.sample.questions) {
      body = s.sample.questions.map(function (it, i) {
        var tag = it.subject ? SUBJ[it.subject] : esc(DOM[it.domain] || "");
        return '<article class="pt-q card" data-q="' + i + '" data-answer="' + it.answer + '"><div class="pt-q__head"><span class="pt-num">' + (i + 1) + '</span><span class="pt-tag">' + tag + "</span></div>" +
          (it.passage ? '<div class="pt-passage">' + passage(it.passage) + "</div>" : "") + table(it.table) + '<p class="pt-stem">' + esc(it.stem) + "</p>" +
          '<div class="pt-choices">' + it.choices.map(function (c, k) {
            return '<label class="pt-choice"><input type="radio" name="q' + i + '" value="' + k + '"><b>' + LET[k] + "</b><span>" + esc(c) + "</span></label>";
          }).join("") + "</div>" + expl(it.explanation) + "</article>";
      }).join("");
    } else {
      body = ielts(s.sample);
    }
    root.innerHTML = '<nav class="pt-back"><a href="?" data-home>← ' + bi("All practice tests", "ข้อสอบทั้งหมด") + "</a></nav>" +
      '<header class="pt-head pt-head--' + e.cls + '"><span class="pt-glyph">' + esc(e.glyph) + "</span><div><h2>" + both(s.title) + "</h2><p>" + both(s.note) + "</p><p><b>" +
      bi("Free sample: " + count(s) + " questions from this set. The full set has " + full(s) + ".", "ตัวอย่างฟรี " + count(s) + " ข้อจากชุดนี้ ชุดเต็มมี " + fullTh(s)) + "</b></p></div></header>" +
      '<form class="pt-form" data-form>' + body + '<div class="pt-actions"><button class="btn btn--primary" type="submit">' + bi("Check my answers", "ตรวจคำตอบ") + '</button><button class="btn" type="button" data-reset>' + bi("Try again", "ทำใหม่") + '</button><p class="pt-score" data-score aria-live="polite"></p></div></form>' + cta() + disclaimer();
    window.scrollTo({ top: root.getBoundingClientRect().top + window.scrollY - 90 });
  }
  function count(s) { return s.sample.questions ? s.sample.questions.length : ieltsCount(s.sample.reading); }
  function full(s) { return s.exam === "ielts" ? "3 reading passages (40 questions) and 2 writing tasks" : (s.kinds.sat || s.kinds.m1) + " questions in " + s.minutes + " minutes"; }
  function fullTh(s) { return s.exam === "ielts" ? "Reading 3 บทความ (40 ข้อ) และ Writing 2 งาน" : (s.kinds.sat || s.kinds.m1) + " ข้อ เวลา " + s.minutes + " นาที"; }
  function ieltsCount(r) { var n = 0; r.groups.forEach(function (g) { g.questions.forEach(function (x) { n += g.type === "mcq-multi" ? x.answer.length : 1; }); }); return n; }

  var FIXED = { tfng: ["TRUE", "FALSE", "NOT GIVEN"], ynng: ["YES", "NO", "NOT GIVEN"] };
  var TEXT = { "sentence-completion": 1, "summary-completion": 1, "note-completion": 1, "table-completion": 1, "flowchart-completion": 1, "diagram-label": 1, "short-answer": 1 };
  function ielts(sm) {
    var r = sm.reading, n = 0;
    var paras = '<div class="pt-reading"><h3>' + esc(r.title) + "</h3>" + r.paragraphs.map(function (p, i) { return "<p><b>" + String.fromCharCode(65 + i) + "</b> " + esc(p) + "</p>"; }).join("") + "</div>";
    var groups = r.groups.map(function (g, gi) {
      var opts = FIXED[g.type] ? FIXED[g.type].map(function (k) { return { key: k, text: k }; }) : (g.type === "matching-info" && !(g.options || []).length ? r.paragraphs.map(function (_, i) { return { key: String.fromCharCode(65 + i), text: String.fromCharCode(65 + i) }; }) : g.options || []);
      var list = opts.length && !FIXED[g.type] && g.type !== "mcq" && g.type !== "mcq-multi" && g.type !== "matching-info" ? '<ul class="pt-opts">' + opts.map(function (o) { return "<li><b>" + esc(o.key) + "</b> " + esc(o.text) + "</li>"; }).join("") + "</ul>" : "";
      var qs = g.questions.map(function (x, qi) {
        var id = "g" + gi + "q" + qi, first = n + 1, input;
        n += g.type === "mcq-multi" ? x.answer.length : 1;
        if (g.type === "mcq" || g.type === "mcq-multi") {
          input = (x.options || []).map(function (o) { return '<label class="pt-choice pt-choice--sm"><input type="' + (g.type === "mcq" ? "radio" : "checkbox") + '" name="' + id + '" value="' + esc(o.key) + '"><b>' + esc(o.key) + "</b><span>" + esc(o.text) + "</span></label>"; }).join("");
        } else if (TEXT[g.type]) {
          input = '<input class="pt-text" name="' + id + '" autocomplete="off" spellcheck="false">';
        } else {
          input = '<select name="' + id + '"><option value="">—</option>' + opts.map(function (o) { return '<option value="' + esc(o.key) + '">' + esc(o.key) + "</option>"; }).join("") + "</select>";
        }
        return '<div class="pt-iq" data-iq="' + id + '" data-type="' + g.type + '" data-ans="' + esc(JSON.stringify(x.answer)) + '" data-limit="' + (g.wordLimit ? g.wordLimit.words : "") + '"><span class="pt-num">' + first + (n > first ? "–" + n : "") + "</span><div><p>" + esc(x.text) + "</p>" + input + '<p class="pt-key" hidden></p></div></div>';
      }).join("");
      return '<div class="pt-group"><p class="pt-instr">' + esc(g.instructions) + "</p>" + (g.context ? '<div class="pt-context">' + passage(g.context) + "</div>" : "") + list + qs + "</div>";
    }).join("");
    var w = (sm.writing || []).map(function (t) {
      return '<article class="pt-q card"><div class="pt-q__head"><span class="pt-tag">Writing Task ' + t.task + "</span></div>" + passage(t.prompt) + table(t.table) +
        '<textarea class="pt-essay" rows="6" data-min="' + (t.task === 1 ? 150 : 250) + '" placeholder="' + (t.task === 1 ? "150+" : "250+") + ' words"></textarea><p class="pt-wc" data-wc></p></article>';
    }).join("");
    return '<div class="pt-ielts"><section class="pt-pane card">' + paras + '</section><section class="pt-pane card"><h3>' + bi("Questions 1–" + n, "คำถามข้อ 1–" + n) + "</h3>" + groups + "</section></div>" +
      (w ? "<h3 class=\"pt-sub\">" + bi("Writing tasks from this test (marked by a teacher in the portal)", "งานเขียนจากชุดนี้ (ครูตรวจให้ในระบบนักเรียน)") + "</h3>" + w : "");
  }

  function words(s) { return (String(s || "").match(/\S+/g) || []).length; }
  function check(form) {
    var got = 0, total = 0;
    form.querySelectorAll("[data-q]").forEach(function (el) {
      var ans = el.getAttribute("data-answer"), pick = el.querySelector("input:checked");
      total++;
      var ok = pick && pick.value === ans;
      if (ok) got++;
      el.classList.toggle("is-right", !!ok); el.classList.toggle("is-wrong", !ok);
      el.querySelectorAll(".pt-choice").forEach(function (c) { var v = c.querySelector("input").value; c.classList.toggle("is-key", v === ans); c.classList.toggle("is-bad", !!pick && v === pick.value && v !== ans); });
      var x = el.querySelector(".pt-exp"); if (x) x.hidden = false;
    });
    form.querySelectorAll("[data-iq]").forEach(function (el) {
      var type = el.getAttribute("data-type"), ans = JSON.parse(el.getAttribute("data-ans")), limit = +el.getAttribute("data-limit") || 0, pts = 0, max = 1;
      if (type === "mcq-multi") {
        var picked = Array.prototype.map.call(el.querySelectorAll("input:checked"), function (i) { return norm(i.value); });
        max = ans.length;
        pts = picked.length > ans.length ? 0 : picked.filter(function (p) { return ans.map(norm).indexOf(p) !== -1; }).length;
      } else {
        var inp = el.querySelector("input:checked, input.pt-text, select"), v = inp ? inp.value : "";
        pts = (!limit || words(v) <= limit) && ans.map(norm).indexOf(norm(v)) !== -1 ? 1 : 0;
      }
      got += pts; total += max;
      el.classList.toggle("is-right", pts === max); el.classList.toggle("is-wrong", pts < max);
      var k = el.querySelector(".pt-key"); k.hidden = false; k.innerHTML = bi("Answer: ", "เฉลย: ") + "<b>" + esc(ans.join(type === "mcq-multi" ? ", " : " / ")) + "</b>";
    });
    form.querySelector("[data-score]").innerHTML = bi("You scored ", "คุณได้ ") + "<b>" + got + " / " + total + "</b>" + bi(" — explanations are shown under each question.", " — ดูคำอธิบายใต้แต่ละข้อ");
  }

  root.addEventListener("click", function (e) {
    var a = e.target.closest("[data-open]");
    if (a) { e.preventDefault(); var p = a.getAttribute("data-open").split(":"); history.pushState(null, "", "?exam=" + p[0] + "&set=" + p[1]); openSet(p[0], p[1]); return; }
    if (e.target.closest("[data-home]")) { e.preventDefault(); history.pushState(null, "", location.pathname); overview(); return; }
    if (e.target.closest("[data-reset]")) { var f = root.querySelector("[data-form]"); openSet(cur.exam, cur.set); return f; }
  });
  root.addEventListener("submit", function (e) { if (e.target.matches("[data-form]")) { e.preventDefault(); check(e.target); var s = root.querySelector("[data-score]"); s.scrollIntoView({ block: "center", behavior: "smooth" }); } });
  root.addEventListener("input", function (e) {
    if (e.target.matches(".pt-essay")) { var n = words(e.target.value), min = +e.target.getAttribute("data-min"); e.target.nextElementSibling.innerHTML = bi("Words: ", "จำนวนคำ: ") + n + " / " + min + "+"; }
  });
  window.addEventListener("popstate", function () { var p = new URLSearchParams(location.search); p.get("exam") ? openSet(p.get("exam"), p.get("set") || 1) : overview(); });

  q.get("exam") ? openSet(q.get("exam"), q.get("set") || 1) : overview();
})();
