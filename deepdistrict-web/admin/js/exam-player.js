/* ==========================================================================
   DeepDistrict — full-screen test player (exam.html?a=<attempt id>)
   SAT R&W: one question at a time, passage left / question right, answer
   eliminator, mark for review, question navigator, "check your work" page,
   module 2 starts straight after module 1.
   IELTS Reading: passage left / questions right, parts 1–3, numbers 1–40.
   IELTS Writing: Task 1 / Task 2 tabs, live word count, no spell-check.
   Time is kept by the server; answers save automatically. Keys and
   explanations arrive only after the end.
   ========================================================================== */
(function () {
  "use strict";
  function uline(h) { return String(h).replace(/\[\[([^\]]+)\]\]/g, "<u class=\"ul-part\">$1</u>"); }   // [[text]] = underlined part (error identification)
  var lang = (function () { try { return localStorage.getItem("dd-admin-lang") || "th"; } catch (e) { return "th"; } })();
  var L = function (en, th) { return lang === "th" ? th : en; };
  try { var th = localStorage.getItem("dd-admin-theme"); document.documentElement.setAttribute("data-theme", th === "dark" || (!th && matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light"); } catch (e) {}
  document.documentElement.lang = lang;
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var $ = function (s, c) { return (c || document).querySelector(s); }, $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var root = $("#exam"), q = new URLSearchParams(location.search), id = q.get("a"), markMode = q.get("mark") === "1";
  var A = null, offset = 0, idx = 0, part = 0, task = 0, timer = null, dirty = {}, saveT = null, hideTime = false, submitting = false, view = "q";
  var LET = ["A", "B", "C", "D"];

  function api(method, path, body) {
    return fetch("../api/" + path, { method: method, credentials: "same-origin", headers: method === "POST" ? { "Content-Type": "application/json", "X-DD": "1" } : {}, body: method === "POST" ? JSON.stringify(body) : undefined })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var e = new Error(j.error || r.status); e.status = r.status; throw e; } return j; }); });
  }
  function load() {
    return api("GET", "exam/attempt?id=" + encodeURIComponent(id)).then(function (d) {
      A = d; offset = new Date(d.serverNow).getTime() - Date.now();
      draw();
    }).catch(function (e) {
      root.innerHTML = '<div class="ex-msg"><h1>' + (e.status === 401 ? L("Please sign in first", "กรุณาเข้าสู่ระบบก่อน") : L("Test not found", "ไม่พบข้อสอบ")) + '</h1><p><a class="btn" href="index.html#/tests">' + L("Back to Tests", "กลับไปหน้าข้อสอบ") + "</a></p></div>";
    });
  }
  function sec() { return A.sections[A.current]; }
  function answers() { return sec().answers; }

  /* ---------------------------------------------------------------- saving */
  function queue(k, v, kind) {
    dirty[kind || "answers"] = dirty[kind || "answers"] || {};
    dirty[kind || "answers"][k] = v;
    clearTimeout(saveT); saveT = setTimeout(flush, 700);
    status(L("Saving…", "กำลังบันทึก…"));
  }
  function flush() {
    if (!Object.keys(dirty).length) return Promise.resolve();
    var body = { id: id, section: A.current, answers: dirty.answers || {}, marked: dirty.marked || {}, struck: dirty.struck || {} };
    dirty = {};
    return api("POST", "exam/answer", body).then(function () { status(L("Saved", "บันทึกแล้ว")); })
      .catch(function (e) { status(L("Not saved: ", "ยังไม่บันทึก: ") + e.message, true); if (/time is up|closed|finished/.test(e.message)) load(); });
  }
  function status(t, err) { var s = $("[data-save]"); if (s) { s.textContent = t; s.classList.toggle("err", !!err); } }
  window.addEventListener("beforeunload", function (e) { if (A && A.status === "active") { flush(); e.preventDefault(); e.returnValue = ""; } });

  /* ---------------------------------------------------------------- timer */
  function tick() {
    if (!A || A.status !== "active") return;
    var left = Math.max(0, Math.round((new Date(sec().deadline).getTime() - (Date.now() + offset)) / 1000));
    var t = $("[data-time]");
    if (t) {
      var h = Math.floor(left / 3600), m = Math.floor(left % 3600 / 60), sx = ("0" + left % 60).slice(-2);
      t.textContent = hideTime ? "" : (h ? h + ":" + ("0" + m).slice(-2) : m) + ":" + sx;
      t.classList.toggle("low", left <= 300);
      var box = t.closest(".ex-timer"); if (box) box.classList.toggle("is-urgent", left <= 60 && !hideTime);
    }
    if (left === 300 && !tick.warned) { tick.warned = true; alert(L("5 minutes left in this part.", "เหลือเวลา 5 นาทีในส่วนนี้")); }
    if (left <= 0 && !submitting) submit(true);
  }

  function submit(auto) {
    if (submitting) return;
    if (!auto && !confirm(A.kind === "sat" && A.current === 0 && A.sections.length + (A.mode === "mock" ? 1 : 0) > 1 ? L("Submit module 1? You cannot come back to it. Module 2 starts straight away.", "ส่งโมดูล 1 ใช่ไหม? จะกลับมาแก้ไม่ได้ และโมดูล 2 จะเริ่มทันที")
      : L("Submit your answers? You cannot change them afterwards.", "ส่งคำตอบใช่ไหม? หลังส่งจะแก้ไขไม่ได้"))) return;
    submitting = true;
    var body = { id: id, answers: Object.assign({}, dirty.answers || {}) }; dirty = {};
    api("POST", "exam/submit", body).then(function (d) {
      A = d; offset = new Date(d.serverNow).getTime() - Date.now(); idx = 0; part = 0; view = "q"; tick.warned = false; submitting = false;
      if (A.status === "active") alert(L("Module 2 begins now.", "เริ่มโมดูล 2"));
      draw();
    }).catch(function (e) { submitting = false; alert(e.message); load(); });
  }

  /* ---------------------------------------------------------------- tools (like Bluebook / computer IELTS):
     Zoom, Line Reader, Highlights & Notes. Kept in this browser only (they are the learner's own marks). */
  var zoom = 1, lineOn = false, notesOpen = false;
  function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem("dd-ex-" + id + "-" + k) || "null"); localStorage.setItem("dd-ex-" + id + "-" + k, JSON.stringify(v)); } catch (e) { return null; } }
  function curKey() { if (!A || A.status !== "active") return null; var it = sec().items; return choiceKind() ? (it[idx] || {}).id : A.kind === "ielts-r" ? (it[part] || {}).id : null; }
  function toolbar() {
    if (A.kind === "ielts-w") return "";
    return '<div class="ex-tools"><button type="button" class="ex-link" data-tool="hl" title="' + esc(L("Select text in the passage, then press Highlight", "เลือกข้อความในบทอ่าน แล้วกด ไฮไลต์")) + '">🖍 ' + L("Highlight", "ไฮไลต์") + '</button>' +
      '<button type="button" class="ex-link" data-tool="note">📝 ' + L("Notes", "โน้ต") + '</button><button type="button" class="ex-link' + (lineOn ? " on" : "") + '" data-tool="line">☰ ' + L("Line reader", "แถบอ่านบรรทัด") + "</button>" +
      '<button type="button" class="ex-link" data-tool="zoom-">A−</button><button type="button" class="ex-link" data-tool="zoom+">A+</button></div>';
  }
  function applyTools() {
    document.documentElement.style.setProperty("--ex-zoom", zoom);
    var k = curKey(), pane = $(".ex-passage");
    if (k && pane) {
      (store("hl-" + k) || []).forEach(function (phrase) { markText(pane, phrase); });
      $$("mark.ex-hl", pane).forEach(function (m) { m.title = L("Click to remove", "คลิกเพื่อลบ"); m.addEventListener("click", function () { var list = (store("hl-" + k) || []).filter(function (x) { return x !== m.textContent; }); store("hl-" + k, list); draw(); }); });
    }
    var np = $("[data-notes]");
    if (np) { np.hidden = !notesOpen || !k; if (k) { var ta = $("textarea", np); ta.value = store("note-" + k) || ""; ta.oninput = function () { store("note-" + k, ta.value); }; } }
    var lr = $("[data-linereader]"); if (lr) lr.hidden = !lineOn;
    $$("[data-tool]").forEach(function (b) {
      b.onclick = function () {
        var t = b.getAttribute("data-tool");
        if (t === "zoom+") zoom = Math.min(1.5, zoom + 0.15); else if (t === "zoom-") zoom = Math.max(0.85, zoom - 0.15);
        else if (t === "line") lineOn = !lineOn; else if (t === "note") notesOpen = !notesOpen;
        else if (t === "hl") {
          var sel = window.getSelection(), txt = sel ? String(sel).trim() : "";
          if (!txt || !k || !pane || !pane.contains(sel.anchorNode)) return alert(L("Select some words in the passage first.", "เลือกคำในบทอ่านก่อน"));
          var list = store("hl-" + k) || []; if (list.indexOf(txt) === -1 && txt.length <= 300) list.push(txt); store("hl-" + k, list); sel.removeAllRanges();
        }
        draw();
      };
    });
  }
  function markText(root, phrase) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), node;
    while ((node = walker.nextNode())) {
      var i = node.nodeValue.indexOf(phrase);
      if (i !== -1 && !(node.parentNode && node.parentNode.classList && node.parentNode.classList.contains("ex-hl"))) {
        var r = document.createRange(); r.setStart(node, i); r.setEnd(node, i + phrase.length);
        var m = document.createElement("mark"); m.className = "ex-hl"; r.surroundContents(m); return;
      }
    }
  }
  document.addEventListener("mousemove", function (e) { var lr = $("[data-linereader]"); if (lr && !lr.hidden) lr.style.top = (e.clientY - 22) + "px"; });

  /* ---------------------------------------------------------------- shell */
  var KN = { sat: "SAT Reading and Writing", "ielts-r": "IELTS Academic Reading", "ielts-w": "IELTS Academic Writing", m1: "Entrance test practice" };
  var SUBJ = { math: ["Mathematics", "คณิตศาสตร์"], sci: ["Science", "วิทยาศาสตร์"], eng: ["English", "ภาษาอังกฤษ"], thai: ["Thai", "ภาษาไทย"] };
  var PARTS = { conversation: ["Conversation", "บทสนทนา"], "conversation-short": ["Short conversations", "บทสนทนาสั้น"], "conversation-long": ["Long conversation", "บทสนทนายาว"],
    vocabulary: ["Vocabulary in context", "คำศัพท์ในบริบท"], grammar: ["Grammar and structure", "ไวยากรณ์และโครงสร้าง"], error: ["Error identification", "หาจุดผิด"],
    cloze: ["Cloze test", "เติมคำในบทความ"], reading: ["Reading comprehension", "การอ่านจับใจความ"], "reading-academic": ["Academic reading", "การอ่านบทความวิชาการ"],
    "reading-ads": ["Reading: advertisements", "การอ่าน: โฆษณา"], "reading-review": ["Reading: product / service review", "การอ่าน: บทวิจารณ์สินค้าและบริการ"],
    "reading-news": ["Reading: news", "การอ่าน: ข่าว"], "reading-visual": ["Reading: graphs and tables", "การอ่าน: กราฟและตาราง"], "reading-article": ["Reading: articles", "การอ่าน: บทความ"],
    "text-completion": ["Writing: text completion", "การเขียน: เติมข้อความ"], paragraph: ["Writing: paragraph organization", "การเขียน: เรียงประโยคเป็นย่อหน้า"] };
  function partLabel(k) { var x = PARTS[k]; return x ? L(x[0], x[1]) : k || ""; }
  function choiceKind() { return A.kind === "sat" || A.kind === "m1"; }
  var PROG = { sk1: ["Suankularb M.1 English · GATE / EPLUS+", "อังกฤษ ม.1 สวนกุหลาบ · GATE / EPLUS+"], sp1: ["Satit Prasarnmit M.1 English", "อังกฤษ ม.1 สาธิตประสานมิตร"],
    sk4: ["Suankularb M.4 English · GATE / EPLUS+", "อังกฤษ ม.4 สวนกุหลาบ · GATE / EPLUS+"], sp4: ["Satit Prasarnmit M.4 English", "อังกฤษ ม.4 สาธิตประสานมิตร"],
    tu4: ["Triam Udom Suksa M.4 English", "อังกฤษ ม.4 เตรียมอุดมศึกษา"], alevel: ["A-Level English (TCAS)", "A-Level ภาษาอังกฤษ (TCAS)"],
    gate: ["Suankularb M.1 · GATE Program", "สวนกุหลาบ ม.1 · GATE Program"], ep: ["Suankularb M.1 · English Program", "สวนกุหลาบ ม.1 · English Program"] };
  function m1Name() { var it = ((A.sections[0] || {}).items || [])[0] || {}, x = PROG[it.program]; return x ? L(x[0], x[1]) : L("Entrance test practice", "ข้อสอบฝึกสอบเข้า"); }
  function shell(main, foot) {
    var active = A.status === "active";
    root.innerHTML = '<header class="ex-top"><div><b>' + esc(A.kind === "m1" ? m1Name() : KN[A.kind]) + "</b>" + (A.preview ? ' <span class="ex-tag">' + L("staff preview", "ทดลองโดยเจ้าหน้าที่") + "</span>" : "") +
      "<br><small>" + esc(active ? sec().title : (A.mode === "set" ? (A.sections[0] || {}).title : A.mode === "mock" ? L("Full test", "ข้อสอบเต็ม") : L("Practice", "ฝึกทำ")) + " · " + L("results", "ผลสอบ")) + "</small></div>" +
      (active ? '<div class="ex-timer"><span data-time></span><button type="button" class="ex-link" data-hide>' + (hideTime ? L("Show time", "แสดงเวลา") : L("Hide", "ซ่อน")) + "</button></div>" : "") +
      '<div class="ex-right">' + (active ? '<span class="ex-save" data-save></span>' : "") + '<a class="ex-link" href="index.html#/tests" data-leave>' + (active ? L("Leave (time keeps running)", "ออก (เวลายังเดินต่อ)") : L("Back to Tests", "กลับไปหน้าข้อสอบ")) + "</a></div></header>" +
      (active ? toolbar() : "") + '<main class="ex-main ex-main--' + A.kind + '">' + main + "</main>" + (foot ? '<footer class="ex-foot">' + foot + "</footer>" : "") +
      (active && A.kind !== "ielts-w" ? '<aside class="ex-notes" data-notes hidden><b>' + L("Notes for this question", "โน้ตของข้อนี้") + '</b><textarea rows="6"></textarea><small>' + L("Only you can see these notes; they are not marked.", "โน้ตนี้เห็นเฉพาะคุณ และไม่นำมาคิดคะแนน") + '</small></aside><div class="ex-linereader" data-linereader hidden></div>' : "");
    var h = $("[data-hide]"); if (h) h.addEventListener("click", function () { hideTime = !hideTime; h.textContent = hideTime ? L("Show time", "แสดงเวลา") : L("Hide", "ซ่อน"); tick(); });
    var lv = $("[data-leave]"); if (lv) lv.addEventListener("click", function () { flush(); });
    if (active) applyTools();
    tick();
  }
  function draw() {
    clearInterval(timer);
    if (window.DDProtect) {
      if (A.status === "active" && A.viewer) window.DDProtect.start({ name: A.viewer.name, email: A.viewer.email, leaves: A.leftScreen, onLeave: function (n) {
        api("POST", "exam/answer", { id: id, section: A.current, answers: {}, marked: {}, struck: {}, leftScreen: n }).catch(function () {});
      } });
      else window.DDProtect.stop();
    }
    if (A.status === "active") { timer = setInterval(tick, 1000); choiceKind() ? drawSat() : A.kind === "ielts-r" ? drawReading() : drawWriting(); }
    else drawResult();
  }
  function table(t) { return t && t.rows && t.rows.length ? '<div class="ex-table">' + (t.title ? "<b>" + esc(t.title) + "</b>" : "") + "<table>" + t.rows.map(function (r, i) { return "<tr>" + r.map(function (c) { return i ? "<td>" + esc(c) + "</td>" : "<th>" + esc(c) + "</th>"; }).join("") + "</tr>"; }).join("") + "</table></div>" : ""; }
  function passageText(s) { return esc(s).split(/\n/).map(function (l) { return /^- /.test(l) ? "<li>" + l.slice(2) + "</li>" : "<p>" + l + "</p>"; }).join("").replace(/(<li>.*?<\/li>)+/g, function (m) { return "<ul>" + m + "</ul>"; }); }

  /* ---------------------------------------------------------------- SAT */
  function drawSat() {
    var items = sec().items, n = items.length;
    if (view === "check") {
      shell('<div class="ex-check"><h2>' + L("Check your work", "ตรวจทานคำตอบ") + "</h2><p>" + L("Unanswered and marked questions are highlighted. Click a number to go back to it.", "ข้อที่ยังไม่ตอบและข้อที่ทำเครื่องหมายไว้จะเน้นสี คลิกหมายเลขเพื่อกลับไปแก้") + "</p>" + navGrid() + "</div>",
        '<button class="btn" data-back>' + L("Back", "ย้อนกลับ") + '</button><span class="spacer"></span><button class="btn btn--primary" data-submit>' + (A.kind === "sat" && A.current === 0 && (A.mode === "mock" || A.sections.length > 1) ? L("Submit module 1", "ส่งโมดูล 1") : L("Submit", "ส่งคำตอบ")) + "</button>");
      $("[data-back]").addEventListener("click", function () { view = "q"; idx = n - 1; drawSat(); });
      $("[data-submit]").addEventListener("click", function () { submit(false); });
      bindNav(); return;
    }
    var it = items[idx], ans = answers()[it.id], marked = !!sec().marked[it.id], struck = sec().struck[it.id] || [];
    var hasPassage = !!(it.passage || (it.table && it.table.rows) || it.image);
    shell((hasPassage ? '<section class="ex-pane ex-passage">' + passageText(it.passage || "") + table(it.table) + (it.image ? '<img class="ex-diagram" src="' + esc(it.image) + '" alt="">' : "") + "</section>" : "") +
      '<section class="ex-pane ex-q' + (hasPassage ? "" : " ex-q--solo") + '">' + subTabs(items, it) + '<div class="ex-qhead"><span class="ex-num">' + (idx + 1) + '</span>' + (it.part && PARTS[it.part] ? '<span class="ex-subj ex-subj--eng">' + partLabel(it.part) + "</span>" : it.subject && SUBJ[it.subject] ? '<span class="ex-subj ex-subj--' + it.subject + '">' + L(SUBJ[it.subject][0], SUBJ[it.subject][1]) + (it.format === "fill" ? " · " + L("written answer", "อัตนัย") : "") + "</span>" : "") + '<button type="button" class="ex-mark' + (marked ? " on" : "") + '" data-flag>⚑ ' + L("Mark for review", "ทำเครื่องหมายทบทวน") + "</button>" +
      '<button type="button" class="ex-link" data-elim title="' + esc(L("Cross out choices you think are wrong", "ขีดฆ่าตัวเลือกที่คิดว่าผิด")) + '">A̶B̶C̶</button></div><p class="ex-stem">' + uline(esc(it.stem)) + "</p>" +
      (it.format === "fill" ? '<div class="ex-fill"><input data-fill inputmode="text" autocomplete="off" aria-label="' + esc(L("Your answer", "คำตอบ")) + '" value="' + esc(ans || "") + '">' + (it.unit ? "<span>" + esc(it.unit) + "</span>" : "") + "</div>" : "") +
      '<div class="ex-choices">' + it.choices.map(function (c, i) {
        return '<div class="ex-choice' + (String(i) === ans ? " sel" : "") + (struck.indexOf(String(i)) !== -1 ? " struck" : "") + '"><button type="button" data-choice="' + i + '"><b>' + LET[i] + "</b><span>" + esc(c) + "</span></button>" +
          (window.__elim ? '<button type="button" class="ex-x" data-strike="' + i + '" aria-label="' + esc(L("Cross out ", "ขีดฆ่า ") + LET[i]) + '">' + (struck.indexOf(String(i)) !== -1 ? "↺" : "✕") + "</button>" : "") + "</div>";
      }).join("") + "</div></section>",
      '<button class="btn" data-nav-open>' + L("Question ", "ข้อ ") + (idx + 1) + L(" of ", " จาก ") + n + ' ▾</button><div class="ex-navpop" hidden>' + navGrid() + '</div><span class="spacer"></span>' +
      (idx > 0 ? '<button class="btn" data-prev>' + L("Back", "ย้อนกลับ") + "</button>" : "") + '<button class="btn btn--primary" data-next>' + L("Next", "ถัดไป") + "</button>");
    $$("[data-subtab]").forEach(function (b) { b.addEventListener("click", function () { idx = +b.getAttribute("data-subtab"); drawSat(); }); });
    $$("[data-choice]").forEach(function (b) { b.addEventListener("click", function () { var v = b.getAttribute("data-choice"); answers()[it.id] = v; queue(it.id, v); drawSat(); }); });
    var fi = $("[data-fill]"); if (fi) { fi.addEventListener("input", function () { answers()[it.id] = fi.value; queue(it.id, fi.value); }); fi.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); $("[data-next]").click(); } }); }
    $$("[data-strike]").forEach(function (b) { b.addEventListener("click", function () { var v = b.getAttribute("data-strike"), s = (sec().struck[it.id] || []).slice(), k = s.indexOf(v); if (k === -1) s.push(v); else s.splice(k, 1); sec().struck[it.id] = s; queue(it.id, s, "struck"); drawSat(); }); });
    $("[data-flag]").addEventListener("click", function () { var on = !sec().marked[it.id]; if (on) sec().marked[it.id] = true; else delete sec().marked[it.id]; queue(it.id, on, "marked"); drawSat(); });
    $("[data-elim]").addEventListener("click", function () { window.__elim = !window.__elim; drawSat(); });
    var p = $("[data-prev]"); if (p) p.addEventListener("click", function () { idx--; drawSat(); });
    $("[data-next]").addEventListener("click", function () { if (idx < n - 1) idx++; else view = "check"; drawSat(); });
    $("[data-nav-open]").addEventListener("click", function () { var pop = $(".ex-navpop"); pop.hidden = !pop.hidden; });
    bindNav();
  }
  function subTabs(items, it) {           // school papers: jump straight to a part (English papers) or a subject
    var key = function (x) { return x.part || x.subject; };
    if (!key(it)) return "";
    var first = {};
    items.forEach(function (x, i) { var k = key(x); if (k && first[k] == null) first[k] = i; });
    var keys = Object.keys(first);
    if (keys.length < 2) return "";
    return '<div class="ex-subtabs">' + keys.map(function (k) {
      var n = items.filter(function (x) { return key(x) === k; }), done = n.filter(function (x) { var v = answers()[x.id]; return v != null && v !== ""; }).length;
      return '<button type="button" data-subtab="' + first[k] + '" class="' + (k === key(it) ? "on" : "") + '">' + (PARTS[k] ? partLabel(k) : L(SUBJ[k][0], SUBJ[k][1])) + " " + done + "/" + n.length + "</button>";
    }).join("") + "</div>";
  }
  function navGrid() {
    var last = null;
    return '<div class="ex-grid">' + sec().items.map(function (it, i) {
      var a = answers()[it.id] != null && answers()[it.id] !== "", m = sec().marked[it.id];
      var gk = it.part || it.subject;
      var head = gk && gk !== last && (PARTS[gk] || SUBJ[gk]) ? "<h4>" + (PARTS[gk] ? partLabel(gk) : L(SUBJ[gk][0], SUBJ[gk][1])) + "</h4>" : "";
      last = gk;
      return head + '<button type="button" data-go="' + i + '" class="' + (a ? "ans" : "unans") + (m ? " flag" : "") + (i === idx && view === "q" ? " cur" : "") + '">' + (m ? "⚑" : "") + (i + 1) + "</button>";
    }).join("") + '</div><p class="ex-legend"><span class="ans"></span>' + L("answered", "ตอบแล้ว") + ' <span class="unans"></span>' + L("unanswered", "ยังไม่ตอบ") + " ⚑ " + L("for review", "ทบทวน") + "</p>";
  }
  function bindNav() { $$("[data-go]").forEach(function (b) { b.addEventListener("click", function () { idx = +b.getAttribute("data-go"); view = "q"; drawSat(); }); }); }

  /* ---------------------------------------------------------------- IELTS Reading */
  function rkey(s, gi, qi) { return s.id + ":" + gi + ":" + qi; }
  function drawReading() {
    var sets = sec().items, s = sets[part];
    var qs = s.groups.map(function (g, gi) {
      var head = "<h3>" + L("Questions ", "คำถามข้อ ") + g.from + (g.to > g.from ? "–" + g.to : "") + '</h3><p class="ex-instr">' + esc(g.instructions) + "</p>";
      var box = g.options && g.options.length && !/^(tfng|ynng|matching-info|mcq|mcq-multi)$/.test(g.type) ? '<ul class="ex-opts">' + g.options.map(function (o) { return "<li><b>" + esc(o.key) + "</b> " + esc(o.text) + "</li>"; }).join("") + "</ul>" : "";
      if (g.context) box = '<div class="ex-context">' + passageText(g.context) + "</div>" + box;
      var img = g.image ? '<img class="ex-diagram" src="' + esc(g.image) + '" alt="">' : "";
      return '<div class="ex-group">' + head + box + img + g.questions.map(function (qq, qi) {
        var k = rkey(s, gi, qi), v = answers()[k] || "", n = qq.n || g.from + qi, input, label = n + (qq.marks > 1 ? "–" + (n + qq.marks - 1) : "");
        if (g.type === "mcq-multi") {
          var picked = v ? v.split(",") : [];
          input = '<p class="ex-instr">' + L("Choose " + qq.pick + " letters.", "เลือก " + qq.pick + " ตัวอักษร") + "</p>" + (qq.options || []).map(function (o) { return '<label class="ex-radio"><input type="checkbox" data-multi="' + esc(k) + '" data-max="' + qq.pick + '" value="' + esc(o.key) + '"' + (picked.indexOf(o.key) !== -1 ? " checked" : "") + '> <b>' + esc(o.key) + "</b> " + esc(o.text) + "</label>"; }).join("");
        }
        else if (g.type === "mcq") input = (qq.options || []).map(function (o) { return '<label class="ex-radio"><input type="radio" name="' + esc(k) + '" value="' + esc(o.key) + '"' + (v === o.key ? " checked" : "") + " data-k=\"" + esc(k) + '"> <b>' + esc(o.key) + "</b> " + esc(o.text) + "</label>"; }).join("");
        else if (g.wordLimit) input = '<input class="ex-text" data-k="' + esc(k) + '" value="' + esc(v) + '" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="' + n + '">';
        else input = '<select data-k="' + esc(k) + '" aria-label="' + n + '"><option value=""></option>' + g.options.map(function (o) { return '<option value="' + esc(o.key) + '"' + (v === o.key ? " selected" : "") + ">" + esc(o.key) + "</option>"; }).join("") + "</select>";
        return '<div class="ex-rq' + (v ? " done" : "") + '" id="q' + n + '"><span class="ex-num">' + label + "</span><div><p>" + esc(qq.text) + "</p>" + input + "</div></div>";
      }).join("") + "</div>";
    }).join("");
    var nums = [];
    sets.forEach(function (st, si) { st.groups.forEach(function (g, gi) { g.questions.forEach(function (x, qi) { var n0 = x.n || g.from + qi; for (var m = 0; m < (x.marks || 1); m++) nums.push('<button type="button" data-jump="' + si + ":" + n0 + '" data-key="' + esc(rkey(st, gi, qi)) + '" class="' + (answers()[rkey(st, gi, qi)] ? "ans" : "unans") + (si === part ? " cur" : "") + '">' + (n0 + m) + "</button>"); }); }); });
    shell('<section class="ex-pane ex-passage ex-reading"><h2>' + L("Part ", "ส่วนที่ ") + (part + 1) + ": " + esc(s.title) + "</h2>" + s.paragraphs.map(function (p, i) { return "<p>" + (s.labelled ? '<b class="ex-para">' + String.fromCharCode(65 + i) + "</b> " : "") + esc(p) + "</p>"; }).join("") + "</section>" +
      '<section class="ex-pane ex-q ex-rqs">' + qs + "</section>",
      '<div class="ex-parts">' + sets.map(function (x, i) { return '<button type="button" class="btn btn--sm' + (i === part ? " btn--primary" : "") + '" data-part="' + i + '">' + L("Part ", "ส่วนที่ ") + (i + 1) + "</button>"; }).join("") + '</div><div class="ex-grid ex-grid--inline">' + nums.join("") + '</div><span class="spacer"></span><button class="btn btn--primary" data-submit>' + L("Submit", "ส่งคำตอบ") + "</button>");
    $$("[data-k]").forEach(function (el) {
      var ev = el.tagName === "INPUT" && el.type !== "radio" ? "input" : "change";
      el.addEventListener(ev, function () { var k = el.getAttribute("data-k"); answers()[k] = el.value; queue(k, el.value); var row = el.closest(".ex-rq"); if (row) row.classList.toggle("done", !!el.value);
        $$("[data-key]").forEach(function (b) { if (b.getAttribute("data-key") === k) { b.classList.toggle("ans", !!el.value); b.classList.toggle("unans", !el.value); } }); });
    });
    $$("[data-multi]").forEach(function (cb) {
      cb.addEventListener("change", function () {
        var k = cb.getAttribute("data-multi"), all = $$('[data-multi="' + k + '"]'), on = all.filter(function (x) { return x.checked; });
        if (on.length > +cb.getAttribute("data-max")) { cb.checked = false; return alert(L("Choose only " + cb.getAttribute("data-max") + " letters.", "เลือกได้ " + cb.getAttribute("data-max") + " ตัวอักษรเท่านั้น")); }
        var v = all.filter(function (x) { return x.checked; }).map(function (x) { return x.value; }).join(",");
        answers()[k] = v; queue(k, v); var row = cb.closest(".ex-rq"); if (row) row.classList.toggle("done", !!v);
        $$("[data-key]").forEach(function (b) { if (b.getAttribute("data-key") === k) { b.classList.toggle("ans", !!v); b.classList.toggle("unans", !v); } });
      });
    });
    $$("[data-part]").forEach(function (b) { b.addEventListener("click", function () { part = +b.getAttribute("data-part"); drawReading(); }); });
    $$("[data-jump]").forEach(function (b) { b.addEventListener("click", function () { var x = b.getAttribute("data-jump").split(":"); if (+x[0] !== part) { part = +x[0]; drawReading(); } var t = document.getElementById("q" + x[1]); if (t) { t.scrollIntoView({ block: "center" }); var f = t.querySelector("input,select"); if (f) f.focus(); } }); });
    $("[data-submit]").addEventListener("click", function () { submit(false); });
  }

  /* ---------------------------------------------------------------- IELTS Writing */
  function words(t) { var m = String(t || "").match(/[A-Za-z0-9]+(?:['’\-][A-Za-z0-9]+)*/g); return m ? m.length : 0; }
  function drawWriting() {
    var tasks = sec().items, t = tasks[task], v = answers()[t.id] || "";
    shell('<section class="ex-pane ex-passage"><h2>' + L("Writing Task ", "Writing Task ") + t.task + "</h2><p class=\"ex-instr\">" + L("You should spend about " + (t.task === 1 ? 20 : 40) + " minutes on this task.", "ควรใช้เวลาประมาณ " + (t.task === 1 ? 20 : 40) + " นาทีกับ Task นี้") + "</p>" +
      passageText(t.prompt) + (t.image ? '<img class="ex-diagram" src="' + esc(t.image) + '" alt="">' : "") + table(t.table) + "</section>" +
      '<section class="ex-pane ex-q ex-write"><textarea data-essay spellcheck="false" autocorrect="off" autocapitalize="off" autocomplete="off" aria-label="' + esc(L("Your answer", "คำตอบของคุณ")) + '">' + esc(v) + '</textarea><p class="ex-wc" data-wc></p></section>',
      tasks.map(function (x, i) { return '<button type="button" class="btn' + (i === task ? " btn--primary" : "") + '" data-task="' + i + '">Task ' + x.task + " · " + words(answers()[x.id]) + L(" words", " คำ") + "</button>"; }).join("") +
      '<span class="spacer"></span><button class="btn btn--primary" data-submit>' + L("Submit", "ส่งคำตอบ") + "</button>");
    var ta = $("[data-essay]");
    function wc() { var n = words(ta.value); $("[data-wc]").innerHTML = L("Words: ", "จำนวนคำ: ") + "<b>" + n + "</b> / " + t.minWords + "+" + (n < t.minWords ? ' <span class="ex-under">' + L("under the minimum", "ยังไม่ถึงขั้นต่ำ") + "</span>" : " ✓"); }
    ta.addEventListener("input", function () { answers()[t.id] = ta.value; queue(t.id, ta.value); wc(); });
    wc();
    $$("[data-task]").forEach(function (b) { b.addEventListener("click", function () { flush(); task = +b.getAttribute("data-task"); drawWriting(); }); });
    $("[data-submit]").addEventListener("click", function () {
      var short = tasks.filter(function (x) { return words(answers()[x.id]) < x.minWords; });
      if (short.length && !confirm(L("Some answers are under the minimum word count, so they may not show enough for a higher band. Submit anyway?", "บางคำตอบยังไม่ถึงจำนวนคำขั้นต่ำ อาจมีหลักฐานทางภาษาไม่พอสำหรับคะแนนสูง ส่งเลยไหม?"))) return;
      submitting = false; submit(true);
    });
  }

  /* ---------------------------------------------------------------- results & review */
  // Every question in one table: what it measures, its topic, your answer, the key.
  function rowTable() {
    var n = 0, LETS = ["A", "B", "C", "D"];
    var rows = A.sections.map(function (s) {
      return (s.items || []).map(function (it) {
        n++;
        var a = s.answers[it.id], ok = (s.correct || {})[it.id];
        var mine = it.format === "fill" ? (a || "–") : (a !== undefined && a !== "" ? LETS[+a] : "–"), key = it.format === "fill" ? (it.accept || []).join(" / ") : LETS[it.answer];
        var what = A.kind === "sat" ? (DOMN[it.domain] || "") + " · " + String(it.skill || "").replace(/-/g, " ") : L((it.skill || {}).en || "", (it.skill || {}).th || "");
        var subj = A.kind === "sat" ? "RW" : (SUBJ[it.subject] ? L(SUBJ[it.subject][0], SUBJ[it.subject][1]) : it.subject);
        return '<tr class="' + (ok ? "ok" : "bad") + '"><td><b>' + n + "</b></td><td>" + esc(subj) + "</td><td>" + esc(what) + "</td><td>" + esc(L((it.topic || {}).en || "", (it.topic || {}).th || "")) + "</td><td>" + esc(mine) + "</td><td><b>" + esc(key) + "</b></td><td>" + (ok ? "✓" : "✗") + "</td></tr>";
      }).join("");
    }).join("");
    return "<h2>" + L("Every question: what it measures", "สรุปรายข้อ: แต่ละข้อวัดอะไร เรื่องอะไร") + '</h2><div class="tbl-wrap"><table class="ex-rowtbl"><tr><th>' + L("No.", "ข้อ") + "</th><th>" + L("Subject", "วิชา") + "</th><th>" + L("Measures", "วัดอะไร") + "</th><th>" + L("Topic", "เรื่อง") + "</th><th>" + L("You", "ตอบ") + "</th><th>" + L("Key", "เฉลย") + "</th><th></th></tr>" + rows + "</table></div>";
  }
  function drawResult() {
    var r = A.result || {}, html = "";
    if (A.kind === "m1") {
      var tg = (r.targets || []).map(function (g) {
        return '<div class="ex-kpi ex-target ' + (g.met ? "met" : "notmet") + '"><b>' + (g.met ? "✓" : "…") + '</b><span>' + esc(L(g.en, g.th)) + " — " + (g.met ? L("on target", "ถึงเป้าหมาย") : L("not yet", "ยังไม่ถึง")) + "<br><small>" +
          L("Target: overall ", "เป้าหมาย: รวม ") + g.overall + "%" + Object.keys(g.subjects).map(function (k) { return " · " + L(SUBJ[k][0], SUBJ[k][1]) + " " + g.subjects[k] + "%"; }).join("") + "</small></span></div>";
      }).join("");
      html = '<div class="ex-summary"><div class="ex-kpi"><b>' + r.percent + "%</b><span>" + r.correct + " / " + r.total + " " + L("correct", "ข้อที่ถูก") + "</span></div>" + tg + "</div>" +
        (tg ? '<p class="ex-note">' + L("Targets are DeepDistrict practice guidance, not school cut-offs. GATE and English Program applicants take the same Suankularb paper; EP applicants need a higher English score.", "เป้าหมายเป็นแนวทางฝึกของ DeepDistrict ไม่ใช่เกณฑ์ของโรงเรียน ผู้สมัคร GATE และ English Program ใช้ข้อสอบชุดเดียวกัน ผู้สมัคร EP ต้องได้คะแนนภาษาอังกฤษสูงกว่า") + "</p>" : "") +
        ((r.byPart || []).length ? "<h2>" + L("By part", "แยกตามตอน") + '</h2><div class="ex-doms">' + r.byPart.map(function (x) { return "<div><span>" + esc(partLabel(x.part)) + "</span><b>" + x.c + "/" + x.t + " (" + Math.round(x.c / x.t * 100) + '%)</b><i style="width:' + Math.round(x.c / x.t * 100) + '%"></i></div>'; }).join("") + "</div>" : "") +
        ((r.byPart || []).length ? "" : "<h2>" + L("By subject", "แยกตามวิชา") + '</h2><div class="ex-doms">' + Object.keys(r.bySubject || {}).map(function (k) { var x = r.bySubject[k]; return "<div><span>" + esc(SUBJ[k] ? L(SUBJ[k][0], SUBJ[k][1]) : k) + "</span><b>" + x.c + "/" + x.t + " (" + Math.round(x.c / x.t * 100) + '%)</b><i style="width:' + Math.round(x.c / x.t * 100) + '%"></i></div>'; }).join("") + "</div>") +
        ((r.byTopic || []).length ? "<h2>" + L("By topic — weakest first", "แยกตามเรื่อง — เรียงจากเรื่องที่ควรฝึกเพิ่ม") + '</h2><div class="tbl-wrap"><table class="ex-rowtbl"><tr><th>' + L("Subject", "วิชา") + "</th><th>" + L("Topic", "เรื่อง") + "</th><th>" + L("Correct", "ถูก") + "</th><th></th></tr>" +
          r.byTopic.slice().sort(function (a, b) { return a.c / a.t - b.c / b.t; }).map(function (x) { var pc = Math.round(x.c / x.t * 100); return "<tr><td>" + esc(SUBJ[x.subject] ? L(SUBJ[x.subject][0], SUBJ[x.subject][1]) : x.subject) + "</td><td>" + esc(L(x.topic.en, x.topic.th)) + "</td><td>" + x.c + "/" + x.t + '</td><td><div class="ex-bar"><i style="width:' + pc + '%"></i></div></td></tr>'; }).join("") + "</table></div>" : "");
      if (A.review) html += rowTable() + "<h2>" + L("Answers and explanations", "เฉลยและคำอธิบาย") + "</h2>" + A.sections.map(function (s) {
        return (s.items || []).map(function (it, i) {
          var a = s.answers[it.id], ok = (s.correct || {})[it.id];
          return '<details class="ex-rev ' + (ok ? "ok" : "bad") + '"><summary><b>' + (i + 1) + "</b> " + (ok ? "✓" : "✗") + " " + uline(esc(it.stem)) + "</summary>" + (it.passage ? passageText(it.passage) : "") + table(it.table) + (it.image ? '<img class="ex-diagram" src="' + esc(it.image) + '" alt="">' : "") +
            (it.format === "fill" ? "<p>" + L("Your answer: ", "คำตอบของคุณ: ") + "<b>" + esc(a || "–") + "</b> · " + L("Accepted: ", "คำตอบที่ถูก: ") + "<b>" + esc((it.accept || []).join(" / ")) + "</b> " + esc(it.unit || "") + "</p>"
              : "<ol type=A>" + it.choices.map(function (c, k) { return '<li class="' + (k === it.answer ? "right" : String(k) === a ? "wrong" : "") + '">' + esc(c) + "</li>"; }).join("") + "</ol>") +
            '<p class="ex-note">' + L("Measures: ", "วัด: ") + esc(L((it.skill || {}).en || "", (it.skill || {}).th || "")) + " · " + L("Topic: ", "เรื่อง: ") + esc(L((it.topic || {}).en || "", (it.topic || {}).th || "")) + "</p>" +
            "<p>" + esc(lang === "th" ? it.explanation.th || it.explanation.en : it.explanation.en || it.explanation.th) + "</p></details>";
        }).join("");
      }).join("");
    } else if (A.kind === "sat") {
      html = '<div class="ex-score">' + (r.estimate ? "<b>" + r.estimate + "</b><span>" + L("estimated Reading and Writing score (200–800)", "คะแนน Reading and Writing โดยประมาณ (200–800)") + "</span>" : "<b>" + r.correct + "/" + r.total + "</b><span>" + L("correct", "ข้อที่ถูก") + "</span>") + "</div>" +
        (r.modules ? '<p class="ex-sub">' + r.modules.map(function (m) { return (m.key === "m1" ? L("Module 1", "โมดูล 1") : m.key === "m2" ? L("Module 2", "โมดูล 2") : L("Practice", "ฝึกทำ")) + ": " + m.correct + "/" + m.total; }).join(" · ") +
          (r.route ? " · " + L("module 2 was the ", "โมดูล 2 เป็นชุด") + (r.route === "hard" ? L("harder set", "ยาก") : L("easier set (our unofficial estimate of the ceiling: about " + r.ceiling + ")", "ง่าย (เพดานคะแนนประมาณ " + r.ceiling + " เป็นค่าประมาณของเรา ไม่ใช่ตัวเลขทางการ)")) : "") + "</p>" : "") +
        (r.percentile ? '<p class="ex-sub">' + L("About the " + r.percentile + "th percentile among SAT takers (College Board's published RW percentiles).", "ประมาณเปอร์เซ็นไทล์ที่ " + r.percentile + " ของผู้สอบ SAT (อ้างอิงตารางเปอร์เซ็นไทล์ RW ของ College Board)") + "</p>" : "") +
        '<div class="ex-doms">' + Object.keys(r.byDomain || {}).filter(function (d) { return r.byDomain[d].t; }).map(function (d) { var x = r.byDomain[d]; return '<div><span>' + esc({ cs: "Craft and Structure", ii: "Information and Ideas", sec: "Standard English Conventions", eoi: "Expression of Ideas" }[d]) + "</span><b>" + x.c + "/" + x.t + '</b><i style="width:' + Math.round(x.c / x.t * 100) + '%"></i></div>'; }).join("") + "</div>";
      if ((r.bySkill || []).length) html += "<h2>" + L("By skill", "แยกตามทักษะ") + '</h2><div class="tbl-wrap"><table class="ex-rowtbl"><tr><th>' + L("Domain", "หมวด") + "</th><th>" + L("Skill", "ทักษะ") + "</th><th>" + L("Correct", "ถูก") + "</th><th></th></tr>" +
        r.bySkill.map(function (x) { var pc = Math.round(x.c / x.t * 100); return "<tr><td>" + esc(DOMN[x.domain]) + "</td><td>" + esc(x.skill.replace(/-/g, " ")) + "</td><td>" + x.c + "/" + x.t + '</td><td><div class="ex-bar"><i style="width:' + pc + '%"></i></div></td></tr>'; }).join("") + "</table></div>";
      if (A.review) html += errorLog() + rowTable() + A.sections.map(function (s, si) {
        return "<h2>" + esc(s.title) + "</h2>" + (s.items || []).map(function (it, i) {
          var a = s.answers[it.id], ok = a === String(it.answer);
          return '<details class="ex-rev ' + (ok ? "ok" : "bad") + '"><summary><b>' + (i + 1) + "</b> " + (ok ? "✓" : "✗") + " " + uline(esc(it.stem)) + (it.pretest ? ' <small>(pretest)</small>' : "") + "</summary>" + passageText(it.passage) + table(it.table) + (it.image ? '<img class="ex-diagram" src="' + esc(it.image) + '" alt="">' : "") +
            (!ok && !A.staff ? '<p class="ex-tag-row">' + L("Why did I miss it? ", "พลาดเพราะอะไร? ") + '<select data-tag="' + esc(it.id) + '">' + '<option value="">–</option>' + CAUSES.map(function (c) { return '<option value="' + c[0] + '"' + ((A.tags || {})[it.id] === c[0] ? " selected" : "") + ">" + L(c[1], c[2]) + "</option>"; }).join("") + "</select></p>" : "") +
            "<ol type=A>" + it.choices.map(function (c, k) { return '<li class="' + (k === it.answer ? "right" : String(k) === a ? "wrong" : "") + '">' + esc(c) + "</li>"; }).join("") + "</ol><p>" + esc(lang === "th" ? it.explanation.th || it.explanation.en : it.explanation.en || it.explanation.th) + "</p></details>";
        }).join("");
      }).join("");
    } else if (A.kind === "ielts-r") {
      html = '<div class="ex-score"><b>' + r.band + "</b><span>" + L("estimated Reading band", "Reading band โดยประมาณ") + " · " + r.correct + "/" + r.total + (r.scaled ? L(" (scaled from a short practice)", " (ปรับจากแบบฝึกสั้น)") : "") + "</span></div>";
      if (A.review) A.sections[0].items.forEach(function (s) {
        html += "<h2>" + esc(s.title) + "</h2>";
        s.groups.forEach(function (g, gi) { g.questions.forEach(function (x, qi) {
          var a = A.sections[0].answers[rkey(s, gi, qi)] || "", norm = function (t) { return String(t).toLowerCase().trim(); };
          var ok = g.type === "mcq-multi" ? a.split(",").map(norm).sort().join(",") === x.answer.map(norm).sort().join(",") : x.answer.some(function (y) { return norm(y) === norm(a); });
          html += '<div class="ex-rev-line ' + (ok ? "ok" : "bad") + '"><b>' + (x.n || g.from + qi) + (x.marks > 1 ? "–" + (x.n + x.marks - 1) : "") + "</b> " + esc(x.text) + " — " + L("you: ", "คุณ: ") + "<i>" + esc(a || "–") + "</i> · " + L("answer: ", "เฉลย: ") + "<b>" + esc(x.answer.join(" / ")) + "</b></div>";
        }); });
      });
    } else html = writingResult(r);
    if (A.leftScreen) html += '<p class="ex-note ex-note--warn">' + L("Left the test screen " + A.leftScreen + " time(s) during the test.", "ออกจากหน้าข้อสอบระหว่างสอบ " + A.leftScreen + " ครั้ง") + "</p>";
    html += '<p class="ex-note">' + L("DeepDistrict practice estimate — not an official score.", "คะแนนประมาณการเพื่อการฝึกของ DeepDistrict ไม่ใช่คะแนนทางการ") + "</p>";
    var acts = '<h1 class="ex-result__title">' + L("Results summary", "สรุปผลการสอบ") + '</h1><div class="ex-actions"><button class="btn btn--primary" data-report>' + L("Download results summary (PDF)", "ดาวน์โหลดสรุปผล (PDF)") + "</button>" +
      '<button class="btn" type="button" data-print>' + L("Print this page", "พิมพ์หน้านี้") + '</button><a class="btn" href="index.html#/tests">' + L("Back to tests", "กลับหน้าข้อสอบ") + "</a></div>";
    shell('<div class="ex-result">' + acts + html + "</div>");
    bindMarking();
    $$("[data-tag]").forEach(function (sel) {
      sel.addEventListener("change", function () { api("POST", "exam/tag", { id: id, item: sel.getAttribute("data-tag"), cause: sel.value }).then(function (r) { A.tags = r.tags; var det = $$("details[open]").map(function (d) { return $$("details").indexOf(d); }); drawResult(); det.forEach(function (i) { var d = $$("details")[i]; if (d) d.open = true; }); }); });
    });
    $("[data-print]").addEventListener("click", function () { window.print(); });
    $("[data-report]").addEventListener("click", function () {
      var b = this; b.disabled = true; b.textContent = L("Creating…", "กำลังสร้าง…");
      api("POST", "doc/report", { attemptId: id }).then(function (p) { return window.DDPDF.save(p, api); })
        .then(function () { b.disabled = false; b.textContent = L("Download results summary (PDF)", "ดาวน์โหลดสรุปผล (PDF)"); })
        .catch(function (e) { alert(e.message); b.disabled = false; });
    });
    if (A.kind === "ielts-w" && r.aiPending) setTimeout(load, 5000);
  }
  var CAUSES = [["vocabulary", "Vocabulary gap", "ไม่รู้คำศัพท์"], ["reasoning", "Reasoning gap", "ตีความ/เหตุผลผิด"], ["rule", "Grammar rule", "ไม่รู้กฎไวยากรณ์"], ["misread", "Misread the question", "อ่านโจทย์พลาด"], ["time", "Ran out of time", "เวลาไม่พอ"], ["trap", "Fell for a trap answer", "ติดกับดักตัวเลือก"]];
  var DOMN = { cs: "Craft and Structure", ii: "Information and Ideas", sec: "Standard English Conventions", eoi: "Expression of Ideas" };
  function errorLog() {
    if (A.kind !== "sat") return "";
    var rows = {}, tags = A.tags || {}, any = false;
    A.sections.forEach(function (s) { (s.items || []).forEach(function (it) { if (s.answers[it.id] !== String(it.answer) && !it.pretest) { var c = tags[it.id] || "untagged"; rows[it.domain] = rows[it.domain] || {}; rows[it.domain][c] = (rows[it.domain][c] || 0) + 1; any = true; } }); });
    if (!any) return "";
    var cols = CAUSES.map(function (c) { return c[0]; }).concat(["untagged"]);
    return '<h2>' + L("My error log", "บันทึกข้อผิดพลาดของฉัน") + '</h2><p class="ex-note">' + L("Tag each missed question below. Drill the domain and cause with the most misses first.", "ระบุสาเหตุของแต่ละข้อที่ผิดด้านล่าง แล้วฝึกหมวดและสาเหตุที่ผิดบ่อยที่สุดก่อน") + '</p><table class="ex-crit"><tr><th></th>' +
      cols.map(function (c) { var x = CAUSES.filter(function (y) { return y[0] === c; })[0]; return "<th>" + (x ? L(x[1], x[2]) : L("Not tagged", "ยังไม่ระบุ")) + "</th>"; }).join("") + "</tr>" +
      Object.keys(rows).map(function (d) { return "<tr><th>" + esc(DOMN[d] || d) + "</th>" + cols.map(function (c) { return "<td>" + (rows[d][c] || "") + "</td>"; }).join("") + "</tr>"; }).join("") + "</table>";
  }
  var CRIT = { ta: ["Task Achievement / Response", "การตอบโจทย์"], cc: ["Coherence & Cohesion", "การเชื่อมโยงและลำดับความคิด"], lr: ["Lexical Resource", "คำศัพท์"], gra: ["Grammatical Range & Accuracy", "ไวยากรณ์"] };
  function writingResult(r) {
    var s = A.sections[0], t = r.teacher, ai = r.ai || {}, html = "";
    html += t ? '<div class="ex-score"><b>' + t.band + "</b><span>" + L("Writing band confirmed by ", "คะแนน Writing ยืนยันโดย ") + esc(t.byName || L("your teacher", "ครู")) + "</span></div>" + (t.comment ? '<p class="ex-comment">' + esc(t.comment) + "</p>" : "")
      : '<div class="ex-score ex-score--wait"><b>⏳</b><span>' + L("Submitted — your teacher will confirm the band.", "ส่งแล้ว — รอครูยืนยันคะแนน") + "</span></div>";
    if (r.aiPending) html += '<p class="ex-note">' + L("AI feedback is being prepared…", "AI กำลังเตรียมคำแนะนำ…") + "</p>";
    if (r.aiError) html += '<p class="ex-note err">AI: ' + esc(r.aiError) + "</p>";
    if (ai.band != null && !t) html += '<p class="ex-ai">' + L("AI estimate (not yet checked by a teacher): ", "ค่าประมาณจาก AI (ครูยังไม่ได้ตรวจ): ") + "<b>" + ai.band + "</b></p>";
    (s.items || []).forEach(function (it) {
      var essay = s.answers[it.id] || "", f = ai[it.id], tc = t && t.criteria[it.id];
      html += '<section class="ex-wtask"><h2>Task ' + it.task + " · " + words(essay) + L(" words", " คำ") + (words(essay) < it.minWords ? ' <span class="ex-under">' + L("under ", "ต่ำกว่า ") + it.minWords + "</span>" : "") + "</h2>" +
        '<details><summary>' + L("Task", "โจทย์") + "</summary>" + passageText(it.prompt) + table(it.table) + (it.image ? '<img class="ex-diagram" src="' + esc(it.image) + '" alt="">' : "") + "</details>" +
        '<div class="ex-essay">' + esc(essay).replace(/\n/g, "<br>") + "</div>";
      if (tc) html += '<table class="ex-crit"><tr>' + Object.keys(CRIT).map(function (k) { return "<th>" + L(CRIT[k][0], CRIT[k][1]) + "</th>"; }).join("") + "</tr><tr>" + Object.keys(CRIT).map(function (k) { return "<td>" + tc[k] + "</td>"; }).join("") + "</tr></table>";
      if (f && f.criteria) html += '<div class="ex-fb"><h3>' + L("AI feedback", "คำแนะนำจาก AI") + (f.band != null ? " · ≈ " + f.band : "") + "</h3>" +
        Object.keys(CRIT).map(function (k) { return "<p><b>" + L(CRIT[k][0], CRIT[k][1]) + ": " + f.criteria[k].band + "</b> — " + esc(f.criteria[k].comment) + "</p>"; }).join("") +
        (f.strengths.length ? "<h4>" + L("Strengths", "จุดเด่น") + "</h4><ul>" + f.strengths.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" : "") +
        (f.improvements.length ? "<h4>" + L("To improve", "สิ่งที่ควรพัฒนา") + "</h4><ul>" + f.improvements.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" : "") +
        (f.corrections.length ? "<h4>" + L("Corrections", "ตัวอย่างการแก้") + "</h4><ul>" + f.corrections.map(function (c) { return "<li><s>" + esc(c.original) + "</s> → " + esc(c.better) + "</li>"; }).join("") + "</ul>" : "") +
        (f.summaryTh ? '<p lang="th">' + esc(f.summaryTh) + "</p>" : "") + "</div>";
      else if (f && f.skipped) html += '<p class="ex-note">' + esc(f.skipped) + "</p>";
      html += "</section>";
    });
    if (A.staff) html += markForm(s, t, ai);
    return html;
  }
  function markForm(s, t, ai) {
    return '<form class="ex-markform" data-markform><h2>' + L("Teacher marking", "ครูให้คะแนน") + "</h2><p>" + L("Give each criterion a band (0–9). The task band is their average rounded down to a half band; the Writing band weighs Task 2 twice as much as Task 1.", "ให้คะแนนแต่ละเกณฑ์ 0–9 คะแนนของแต่ละ Task คือค่าเฉลี่ยปัดลงเป็นครึ่ง band และ Task 2 มีน้ำหนักเป็นสองเท่าของ Task 1") + "</p>" +
      s.items.map(function (it) {
        var pre = (t && t.criteria[it.id]) || ((ai[it.id] || {}).criteria ? Object.keys(CRIT).reduce(function (o, k) { o[k] = ai[it.id].criteria[k].band; return o; }, {}) : {});
        return "<fieldset><legend>Task " + it.task + "</legend>" + Object.keys(CRIT).map(function (k) {
          return "<label>" + L(CRIT[k][0], CRIT[k][1]) + '<select name="' + it.id + ":" + k + '">' + [9, 8.5, 8, 7.5, 7, 6.5, 6, 5.5, 5, 4.5, 4, 3.5, 3, 2.5, 2, 1, 0].map(function (b) { return '<option value="' + b + '"' + (+pre[k] === b ? " selected" : "") + ">" + b + "</option>"; }).join("") + "</select></label>";
        }).join("") + "</fieldset>";
      }).join("") + '<label class="ex-cmt">' + L("Comment for the student", "ความเห็นถึงนักเรียน") + '<textarea name="comment" rows="4">' + esc(t && t.comment || "") + "</textarea></label>" +
      '<div class="btnrow"><button class="btn btn--primary">' + (t ? L("Update marks", "แก้ไขคะแนน") : L("Confirm marks", "ยืนยันคะแนน")) + '</button><button type="button" class="btn" data-reai>' + L("Ask AI again", "ให้ AI ตรวจอีกครั้ง") + "</button></div></form>";
  }
  function bindMarking() {
    var f = $("[data-markform]"); if (!f) return;
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var crit = {};
      A.sections[0].items.forEach(function (it) { crit[it.id] = {}; Object.keys(CRIT).forEach(function (k) { crit[it.id][k] = +f.elements[it.id + ":" + k].value; }); });
      api("POST", "exam/mark", { id: id, criteria: crit, comment: f.elements.comment.value }).then(function (r) { alert(L("Saved. Writing band: ", "บันทึกแล้ว Writing band: ") + r.band); load(); }).catch(function (er) { alert(er.message); });
    });
    $("[data-reai]", f).addEventListener("click", function () { api("POST", "exam/feedback", { id: id }).then(function () { load(); }).catch(function (er) { alert(er.message); }); });
  }

  if (!id) { root.innerHTML = '<div class="ex-msg"><p><a class="btn" href="index.html#/tests">' + L("Back to Tests", "กลับไปหน้าข้อสอบ") + "</a></p></div>"; return; }
  load().then(function () { var f = markMode && $("[data-markform]"); if (f) f.scrollIntoView(); });
  document.addEventListener("keydown", function (e) {
    if (!A || A.status !== "active" || !choiceKind() || view !== "q" || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    if (e.key === "ArrowRight") { var n = $("[data-next]"); if (n) n.click(); }
    if (e.key === "ArrowLeft") { var p = $("[data-prev]"); if (p) p.click(); }
    var k = "abcd".indexOf(e.key.toLowerCase()); if (k !== -1) { var c = $('[data-choice="' + k + '"]'); if (c) c.click(); }
  });
})();
