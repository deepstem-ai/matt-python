/* ==========================================================================
   DeepDistrict — live class (live.html)
   Teacher panel   live.html?id=<id>          answer key + every learner's answers
   Share screen    live.html?id=<id>&share=1  for Zoom / the projector: questions and the
                                              join code only — no key until reveal, no names
   Learner         live.html  or ?code=ABC123 join, then answer on their own device
   Modes: "paced" (teacher leads question by question) and "self" (learners work through the
   whole set at their own pace; the teacher watches a live grid and reveals the key at the end).
   Polls the server every 1.5 s.
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
  var root = $("#live"), q = new URLSearchParams(location.search), id = q.get("id"), share = q.get("share") === "1";
  var S = null, role = "learner", timer = null, offset = 0, typing = {}, cur = 0, focusCol = null;
  var LET = ["A", "B", "C", "D"];

  function api(method, path, body) {
    return fetch("../api/" + path, { method: method, credentials: "same-origin", headers: method === "POST" ? { "Content-Type": "application/json", "X-DD": "1" } : {}, body: method === "POST" ? JSON.stringify(body) : undefined })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var e = new Error(j.error || r.status); e.status = r.status; throw e; } return j; }); });
  }
  function joinUrl() { return location.origin + location.pathname.replace(/live\.html.*$/, "live.html"); }
  function para(t) { return esc(t).split(/\n/).map(function (l) { return "<p>" + l + "</p>"; }).join(""); }
  function table(t) { return t && t.rows && t.rows.length ? '<div class="ex-table"><table>' + t.rows.map(function (r, i) { return "<tr>" + r.map(function (c) { return i ? "<td>" + esc(c) + "</td>" : "<th>" + esc(c) + "</th>"; }).join("") + "</tr>"; }).join("") + "</table></div>" : ""; }
  function expl(Q) { return Q.explanation ? '<p class="lv-exp">' + esc(lang === "th" ? Q.explanation.th || Q.explanation.en : Q.explanation.en || Q.explanation.th) + "</p>" : ""; }
  function keyText(Q) { return Q.type === "sat" ? LET[Q.answer] : (Q.answer || []).join(" / "); }
  var PH = { lobby: ["Not started", "ยังไม่เริ่ม"], open: ["Answering", "กำลังทำ"], locked: ["Answers closed", "ปิดรับคำตอบแล้ว"], reveal: ["Answers shown", "เฉลยแล้ว"], ended: ["Finished", "จบแล้ว"] };
  function phase() { return '<span class="lv-phase lv-phase--' + S.phase + '">' + L(PH[S.phase][0], PH[S.phase][1]) + "</span>"; }
  function modeName() { return S.mode === "self" ? L("learners work at their own pace", "นักเรียนทำเองทั้งชุด") : L("teacher leads question by question", "ครูพาทำทีละข้อ"); }

  /* ---------------------------------------------------------------- start & polling */
  function start() {
    if (!id) return joinForm(q.get("code") || "");
    var first = share ? api("GET", "live/share?id=" + id).then(function (d) { role = "share"; return d; })
      : api("GET", "live/host?id=" + id).then(function (d) { role = "host"; return d; }).catch(function (e) {
        if (e.status === 401) throw e;
        return api("GET", "live/state?id=" + id).then(function (d) { role = "learner"; return d; });
      });
    first.then(function (d) {
      S = d;
      if (role === "learner" && d.viewer && window.DDProtect) window.DDProtect.start({ name: d.viewer.name, email: d.viewer.email });   // watermark + no copying
      loop();
    }).catch(function (e) { if (e.status === 401) return signIn(); joinForm(""); });
  }
  function signIn() { root.innerHTML = '<div class="ex-msg"><h1>' + L("Please sign in first", "กรุณาเข้าสู่ระบบก่อน") + '</h1><p><a class="btn btn--primary" href="index.html">' + L("Sign in", "เข้าสู่ระบบ") + "</a></p></div>"; }
  function joinForm(code, err) {
    root.innerHTML = '<form class="lv-join" data-join><h1>' + L("Join a live class", "เข้าห้องเรียนสด") + "</h1><p>" + L("Type the code your teacher shows.", "พิมพ์รหัสที่ครูแสดงบนจอ") + "</p>" +
      '<input name="code" maxlength="6" autocomplete="off" autocapitalize="characters" spellcheck="false" value="' + esc(code) + '" aria-label="Code" placeholder="ABC123">' +
      (err ? '<p class="ex-under">' + esc(err) + "</p>" : "") + '<button class="btn btn--primary">' + L("Join", "เข้าร่วม") + '</button><p><a class="ex-link" href="index.html#/tests">' + L("Back", "ย้อนกลับ") + "</a></p></form>";
    var f = $("[data-join]");
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var c = f.elements.code.value;
      api("POST", "live/join", { code: c }).then(function (r) { history.replaceState(null, "", "live.html?id=" + r.id); id = r.id; start(); })
        .catch(function (er) { if (er.status === 401) return signIn(); joinForm(c, er.message); });
    });
    if (code && q.get("code")) f.querySelector("button").click();
  }
  function loop() {
    offset = new Date(S.serverNow).getTime() - Date.now();
    draw();
    clearInterval(timer);
    timer = setInterval(poll, 1500);
    setInterval(tick, 500);
  }
  function poll() {
    if (!S || (S.phase === "ended" && role === "learner")) return;
    var req = role === "host" ? api("GET", "live/host?id=" + id) : role === "share" ? api("GET", "live/share?id=" + id) : api("GET", "live/state?id=" + id + "&pv=" + S.pv);
    req.then(function (d) {
      if (d.serverNow) offset = new Date(d.serverNow).getTime() - Date.now();
      if (d.same) return;
      var changed = d.pv !== S.pv || d.phase !== S.phase || d.index !== S.index;
      var prev = S; S = d;
      if (role === "learner" && !changed) { S.mine = prev.mine; return; }
      if (role === "host" && !changed && S.mode === "self") return refreshGrid();
      draw();
    }).catch(function () {});
  }
  function left() { return S && S.deadline ? Math.max(0, Math.round((new Date(S.deadline).getTime() - (Date.now() + offset)) / 1000)) : null; }
  function tick() { var t = $("[data-left]"), l = left(); if (t) t.textContent = l == null ? "" : (l >= 60 ? Math.floor(l / 60) + ":" + ("0" + l % 60).slice(-2) : l + "s"); }
  function topbar(sub, right) {
    return '<header class="ex-top"><div><b>' + esc(S.title) + "</b><br><small>" + sub + '</small></div><div class="ex-timer"><span data-left></span></div><div class="ex-right">' + right + "</div></header>";
  }

  /* ---------------------------------------------------------------- shared question rendering */
  function passageHtml(P) { return '<h2>' + esc(P.title) + "</h2>" + P.paragraphs.map(function (p, i) { return "<p>" + (P.labelled ? '<b class="ex-para">' + String.fromCharCode(65 + i) + "</b> " : "") + esc(p) + "</p>"; }).join(""); }
  /* one question; o: {key, mine, canAnswer, counts, answered, bars, result} */
  function qBody(Q, o) {
    o = o || {};
    var showKey = o.key && Q.answer != null, counts = o.counts || {}, total = o.answered || 0, html = "";
    if (Q.type === "sat") {
      html = '<p class="ex-stem">' + uline(esc(Q.stem)) + '</p><div class="ex-choices">' + Q.choices.map(function (c, i) {
        var n = counts[String(i)] || 0, pct = total ? Math.round(n / total * 100) : 0;
        return '<div class="ex-choice' + (String(i) === o.mine ? " sel" : "") + (showKey && Q.answer === i ? " lv-right" : "") + '"><button type="button" data-pick="' + i + '" data-q="' + esc(Q.key) + '"' + (o.canAnswer ? "" : " disabled") + "><b>" + LET[i] + "</b><span>" + esc(c) + "</span>" +
          (o.bars ? '<i class="lv-bar" style="width:' + pct + '%"></i><em class="lv-n">' + n + "</em>" : "") + "</button></div>";
      }).join("") + "</div>";
    } else {
      if (Q.group === "mcq-multi") {
        var sel = (o.mine || "").split(",").filter(Boolean);
        html = '<p class="ex-instr">' + L("Choose " + Q.pick + " letters.", "เลือก " + Q.pick + " ตัวอักษร") + '</p><div class="lv-multi">' + (Q.options || []).map(function (op) {
          var n = Object.keys(counts).filter(function (k) { return k.toUpperCase().split(",").indexOf(op.key.toUpperCase()) !== -1; }).reduce(function (t, k) { return t + counts[k]; }, 0), right = showKey && (Q.answer || []).some(function (a) { return a.toUpperCase() === op.key.toUpperCase(); });
          return '<label class="ex-radio' + (right ? " lv-rightl" : "") + '"><input type="checkbox" data-mpick="' + esc(Q.key) + '" value="' + esc(op.key) + '"' + (sel.indexOf(op.key) !== -1 ? " checked" : "") + (o.canAnswer ? "" : " disabled") + "> <b>" + esc(op.key) + "</b> " + esc(op.text) + (o.bars ? ' <em class="lv-n">' + n + "</em>" : "") + "</label>";
        }).join("") + "</div>" + (o.canAnswer ? '<button class="btn btn--sm" data-msend="' + esc(Q.key) + '" data-max="' + Q.pick + '">' + L("Save answer", "บันทึกคำตอบ") + "</button>" : "");
      } else if (Q.wordLimit) {
        var v = o.mine != null ? o.mine : (typing[Q.key] || "");
        html = '<div class="lv-tline"><input class="ex-text lv-text" data-text="' + esc(Q.key) + '" value="' + esc(v) + '"' + (o.canAnswer ? "" : " disabled") + ' autocomplete="off" spellcheck="false" aria-label="' + Q.number + '">' +
          (o.canAnswer ? '<button class="btn btn--sm" data-send="' + esc(Q.key) + '">' + L("Save", "บันทึก") + "</button>" : "") + "</div>" +
          (o.bars ? '<ul class="lv-texts">' + Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; }).slice(0, 8).map(function (k) { return "<li>" + esc(k) + " <b>×" + counts[k] + "</b></li>"; }).join("") + "</ul>" : "");
      } else html = '<div class="ex-choices lv-small">' + (Q.options || []).map(function (op) {
        var n = counts[op.key.toLowerCase()] || counts[op.key] || 0, pct = total ? Math.round(n / total * 100) : 0, right = showKey && (Q.answer || []).some(function (a) { return a.toLowerCase() === op.key.toLowerCase(); });
        return '<div class="ex-choice' + (op.key === o.mine ? " sel" : "") + (right ? " lv-right" : "") + '"><button type="button" data-pick="' + esc(op.key) + '" data-q="' + esc(Q.key) + '"' + (o.canAnswer ? "" : " disabled") + "><b>" + esc(op.key) + "</b><span>" + esc(op.text === op.key ? "" : op.text) + "</span>" +
          (o.bars ? '<i class="lv-bar" style="width:' + pct + '%"></i><em class="lv-n">' + n + "</em>" : "") + "</button></div>";
      }).join("") + "</div>";
      html = (Q.context && !o.noHead ? '<div class="ex-context">' + para(Q.context) + "</div>" : "") +
        (!o.noHead && (Q.group === "summary-box" || /matching-features|headings|endings/.test(Q.group)) ? '<ul class="ex-opts">' + (Q.options || []).map(function (op) { return "<li><b>" + esc(op.key) + "</b> " + esc(op.text) + "</li>"; }).join("") + "</ul>" : "") +
        '<div class="ex-rq"><span class="ex-num">' + Q.number + (Q.marks > 1 ? "–" + (Q.number + Q.marks - 1) : "") + "</span><div><p>" + esc(Q.text) + "</p>" + html + "</div></div>";
      if (showKey) html += '<p class="lv-key">' + L("Answer: ", "เฉลย: ") + "<b>" + esc(keyText(Q)) + "</b></p>";
    }
    if (o.result != null) html += '<p class="lv-mark ' + (o.result ? "ok" : "bad") + '">' + (o.result ? "✓ " + L("Correct", "ถูก") : "✗ " + L("Answer: ", "เฉลย: ") + esc(keyText(Q))) + "</p>";
    if (o.key) html += expl(Q);
    return html;
  }
  function passFor(Q) { return Q.type === "sat" ? para(Q.passage) + table(Q.table) + (Q.image ? '<img class="ex-diagram" src="' + esc(Q.image) + '" alt="">' : "") : passageHtml(Q.paragraphs ? Q : S.passages[Q.itemId]); }
  function bindAnswers(after) {
    $$("[data-pick]").forEach(function (b) { b.addEventListener("click", function () { send(b.getAttribute("data-q"), b.getAttribute("data-pick"), after); }); });
    $$("[data-text]").forEach(function (t) { t.addEventListener("input", function () { typing[t.getAttribute("data-text")] = t.value; }); t.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); send(t.getAttribute("data-text"), t.value.trim(), after); } }); });
    $$("[data-msend]").forEach(function (b) {
      b.addEventListener("click", function () {
        var k = b.getAttribute("data-msend"), v = $$('[data-mpick="' + k + '"]').filter(function (x) { return x.checked; }).map(function (x) { return x.value; });
        if (v.length > +b.getAttribute("data-max")) return alert(L("Choose only " + b.getAttribute("data-max") + " letters.", "เลือกได้ " + b.getAttribute("data-max") + " ตัวอักษรเท่านั้น"));
        send(k, v.join(","), after);
      });
    });
    $$("[data-send]").forEach(function (b) { b.addEventListener("click", function () { var k = b.getAttribute("data-send"); send(k, ($('[data-text="' + k + '"]') || {}).value.trim(), after); }); });
  }
  function send(key, value, after) {
    api("POST", "live/answer", { id: id, key: key, value: value }).then(function () {
      if (S.mode === "self") { S.mine = S.mine || {}; if (value) S.mine[key] = value; else delete S.mine[key]; } else S.mine = value;
      delete typing[key]; (after || draw)();
    }).catch(function (e) { alert(e.message); });
  }

  /* ---------------------------------------------------------------- learner */
  function drawLearner() {
    var top = topbar(L("Live class", "ห้องเรียนสด") + (S.teacher ? " · " + esc(S.teacher) : "") + " · " + modeName(), phase() + (S.phase !== "ended" && S.mode === "paced" ? " · " + L("Question ", "ข้อ ") + (S.index + 1) + "/" + S.total : ""));
    if (S.phase === "ended") { root.innerHTML = top + '<main class="ex-main"><div class="ex-result"><div class="ex-score"><b>' + (S.score ? S.score.correct + "/" + S.total : "–") + "</b><span>" + L("correct in this live class", "ข้อที่ตอบถูกในห้องเรียนสดนี้") + '</span></div><p><a class="btn" href="index.html#/tests">' + L("Back to Tests", "กลับไปหน้าข้อสอบ") + "</a></p></div></main>"; return; }
    if (S.mode === "self") return drawLearnerSelf(top);
    if (!S.question) { root.innerHTML = top + '<main class="ex-main"><div class="ex-msg"><h1>⏳</h1><p>' + L("You're in! The question appears here when the teacher opens it.", "เข้าห้องแล้ว คำถามจะแสดงที่นี่เมื่อครูเปิด") + "</p></div></main>"; return; }
    var res = S.result ? '<div class="lv-res ' + (S.result.correct ? "ok" : "bad") + '"><b>' + (S.result.correct ? L("Correct! ✓", "ถูกต้อง ✓") : S.mine == null ? L("No answer", "ไม่ได้ตอบ") : L("Not this time ✗", "ยังไม่ถูก ✗")) + "</b> · " +
      L(S.result.classCorrect + " of " + S.result.answered + " got it right", "ตอบถูก " + S.result.classCorrect + " จาก " + S.result.answered + " คน") + "</div>" : "";
    var note = S.phase === "open" ? (S.mine != null ? '<p class="lv-note">✓ ' + L("Answer saved — you can change it until the teacher closes answers.", "บันทึกคำตอบแล้ว — แก้ได้จนกว่าครูจะปิดรับคำตอบ") + "</p>" : "") : S.phase === "locked" ? '<p class="lv-note">' + L("Answers are closed. Wait for the answer…", "ปิดรับคำตอบแล้ว รอเฉลย…") + "</p>" : "";
    root.innerHTML = top + '<main class="ex-main ex-main--' + S.kind + '"><section class="ex-pane ex-passage">' + passFor(S.question) + '</section><section class="ex-pane ex-q">' +
      (S.question.type === "sat" ? '<div class="ex-qhead"><span class="ex-num">' + S.question.number + "</span></div>" : "") + qBody(S.question, { mine: S.mine, canAnswer: S.phase === "open", key: S.phase === "reveal" }) + note + res + "</section></main>";
    bindAnswers(); tick();
  }
  function drawLearnerSelf(top) {
    if (S.phase === "lobby" || !S.questions) { root.innerHTML = top + '<main class="ex-main"><div class="ex-msg"><h1>⏳</h1><p>' + L("You're in! The questions appear when the teacher starts.", "เข้าห้องแล้ว ข้อสอบจะแสดงเมื่อครูกดเริ่ม") + "</p></div></main>"; return; }
    var Qs = S.questions, mine = S.mine || {}, reveal = S.phase === "reveal", can = S.phase === "open", res = S.results || {};
    var nav = '<div class="ex-grid ex-grid--inline lv-nav">' + Qs.map(function (x, i) {
      var cls = reveal ? (res[x.key] ? "lv-ok" : "lv-bad") : mine[x.key] != null ? "ans" : "unans";
      return '<button type="button" data-go="' + i + '" class="' + cls + (i === cur ? " cur" : "") + '">' + x.number + "</button>";
    }).join("") + "</div>";
    var head = (reveal && S.score ? '<div class="lv-res ok"><b>' + S.score.correct + "/" + S.total + "</b> " + L("correct — tap a number to see each answer.", "ข้อที่ถูก — แตะหมายเลขเพื่อดูเฉลยแต่ละข้อ") + "</div>" : "") +
      (S.phase === "locked" ? '<p class="lv-note">' + L("Answers are closed. Wait for the teacher to show the answers…", "ปิดรับคำตอบแล้ว รอครูเฉลย…") + "</p>" : "");
    var main;
    if ((S.kind === "sat" || S.kind === "m1")) {
      var Q = Qs[Math.min(cur, Qs.length - 1)];
      main = '<section class="ex-pane ex-passage">' + passFor(Q) + '</section><section class="ex-pane ex-q">' + head + '<div class="ex-qhead"><span class="ex-num">' + Q.number + "</span><span class=\"muted\">" + L("of ", "จาก ") + S.total + "</span></div>" +
        qBody(Q, { mine: mine[Q.key], canAnswer: can, key: reveal, result: reveal ? !!res[Q.key] : null }) +
        '<div class="btnrow">' + (cur > 0 ? '<button class="btn" data-step="-1">' + L("Back", "ย้อนกลับ") + "</button>" : "") + (cur < Qs.length - 1 ? '<button class="btn btn--primary" data-step="1">' + L("Next", "ถัดไป") + "</button>" : "") + "</div></section>";
    } else {
      var P = S.passages[Qs[0].itemId];
      main = '<section class="ex-pane ex-passage ex-reading">' + passageHtml(P) + '</section><section class="ex-pane ex-q ex-rqs">' + head +
        Qs.map(function (x, i) { return (i === 0 || x.gi !== Qs[i - 1].gi ? '<p class="ex-instr">' + esc(x.instructions) + "</p>" + (x.context ? '<div class="ex-context">' + para(x.context) + "</div>" : "") + (x.options && x.options.length && !/tfng|ynng|mcq|matching-info/.test(x.group) ? '<ul class="ex-opts">' + x.options.map(function (o) { return "<li><b>" + esc(o.key) + "</b> " + esc(o.text) + "</li>"; }).join("") + "</ul>" : "") : "") +
          '<div id="lq' + i + '">' + qBody(x, { mine: mine[x.key], canAnswer: can, key: reveal, result: reveal ? !!res[x.key] : null, noHead: true }) + "</div>"; }).join("") + "</section>";
    }
    var done = Object.keys(mine).length;
    root.innerHTML = top + '<main class="ex-main ex-main--' + S.kind + '">' + main + '</main><footer class="ex-foot">' + nav + '<span class="spacer"></span><span class="muted">' + L("Answered ", "ตอบแล้ว ") + done + "/" + S.total + "</span></footer>";
    $$("[data-go]").forEach(function (b) { b.addEventListener("click", function () { cur = +b.getAttribute("data-go"); if ((S.kind === "sat" || S.kind === "m1")) drawLearner(); else { var t = $("#lq" + cur); if (t) t.scrollIntoView({ block: "center" }); } }); });
    $$("[data-step]").forEach(function (b) { b.addEventListener("click", function () { cur += +b.getAttribute("data-step"); drawLearner(); }); });
    bindAnswers(function () { var y = ($(".ex-rqs") || {}).scrollTop; drawLearner(); var r = $(".ex-rqs"); if (r && y != null) r.scrollTop = y; });
    tick();
  }

  /* ---------------------------------------------------------------- share screen (Zoom / projector) */
  function drawShare() {
    var code = '<div class="lv-code">' + L("Join at", "เข้าที่") + " <span>" + esc(joinUrl()) + "</span> · " + L("code", "รหัส") + " <b>" + esc(S.code) + "</b></div>";
    var top = '<header class="ex-top lv-hosttop"><div><b>' + esc(S.title) + "</b><br><small>" + modeName() + "</small></div>" + code + '<div class="ex-right"><span class="ex-timer"><span data-left></span></span>' + phase() + "</div></header>";
    var reveal = S.phase === "reveal" || S.phase === "ended";
    if (S.phase === "ended") { root.innerHTML = top + '<main class="ex-main"><div class="ex-msg"><h1>' + L("Thank you!", "ขอบคุณทุกคน!") + "</h1><p>" + L("The live class has finished.", "ห้องเรียนสดจบแล้ว") + "</p></div></main>"; return; }
    if (S.mode === "self" && !reveal) {
      var p = S.progress || { answers: 0, possible: 1, finished: 0 }, pct = Math.round(p.answers / Math.max(1, p.possible) * 100);
      root.innerHTML = top + '<main class="ex-main"><div class="lv-big"><h1>' + (S.phase === "lobby" ? L("Join now", "เข้าห้องได้เลย") : S.phase === "open" ? L("Work through the questions on your device", "ทำข้อสอบบนอุปกรณ์ของตัวเอง") : L("Answers closed", "ปิดรับคำตอบแล้ว")) + "</h1>" +
        '<p class="lv-bigcode">' + esc(S.code) + "</p><p>" + S.people + L(" joined", " คนเข้าห้องแล้ว") + " · " + S.total + L(" questions", " ข้อ") + "</p>" +
        (S.phase !== "lobby" ? '<div class="lv-prog"><i style="width:' + pct + '%"></i></div><p>' + L(pct + "% of all answers in · " + p.finished + " finished", "ตอบแล้ว " + pct + "% · ทำครบ " + p.finished + " คน") + "</p>" : "") + "</div></main>";
      return tick();
    }
    if (!S.question) { root.innerHTML = top + '<main class="ex-main"><div class="lv-big"><h1>' + L("Join now", "เข้าห้องได้เลย") + '</h1><p class="lv-bigcode">' + esc(S.code) + "</p><p>" + S.people + L(" joined", " คนเข้าห้องแล้ว") + "</p></div></main>"; return tick(); }
    var t = S.tally || {};
    root.innerHTML = top + '<main class="ex-main ex-main--' + S.kind + ' lv-host"><section class="ex-pane ex-passage">' + passFor(S.question) + '</section><section class="ex-pane ex-q"><div class="ex-qhead"><span class="ex-num">' + S.question.number + '</span><span class="muted">' + L("of ", "จาก ") + S.total + "</span></div>" +
      qBody(S.question, { key: reveal, counts: t.counts, answered: t.answered, bars: reveal }) + '<p class="lv-stat">' + L("Answered", "ตอบแล้ว") + " <b>" + (S.answered || 0) + "</b> / " + S.people + (reveal && t.answered ? " · " + L("correct", "ถูก") + " <b>" + t.correct + "</b>" : "") + "</p></section></main>";
    tick();
  }

  /* ---------------------------------------------------------------- teacher panel */
  function controls() {
    var c = [], self = S.mode === "self";
    if (S.phase === "lobby") c.push(["open", self ? L("Start — learners can answer", "เริ่ม — ให้นักเรียนทำ") : L("Open answers", "เปิดรับคำตอบ"), "btn--primary"]);
    if (S.phase === "open") c.push(["lock", L("Close answers", "ปิดรับคำตอบ"), "btn--primary"]);
    if (S.phase === "locked") c.push(["open", L("Re-open", "เปิดรับต่อ"), ""]);
    if (S.phase === "open" || S.phase === "locked") c.push(["reveal", L("Show answers", "เฉลย"), S.phase === "locked" ? "btn--primary" : ""]);
    if ((S.phase === "reveal" || self) && S.index > 0 && (S.phase === "reveal" || !self)) c.push(["prev", L("← Previous", "← ข้อก่อนหน้า"), ""]);
    if (S.phase === "reveal" && S.index < S.total - 1) c.push(["next", self ? L("Next question →", "ข้อถัดไป →") : L("Next question →", "ข้อถัดไป →"), self ? "" : "btn--primary"]);
    if (!self && S.phase === "lobby" && S.index > 0) c.push(["prev", L("← Previous", "← ข้อก่อนหน้า"), ""]);
    c.push(["end", L("Finish the class", "จบห้องเรียน"), S.phase === "reveal" && (self || S.index === S.total - 1) ? "btn--primary" : "btn--danger"]);
    return c.map(function (x) { return '<button class="btn ' + x[2] + '" data-ctrl="' + x[0] + '">' + esc(x[1]) + "</button>"; }).join("");
  }
  function gridHtml() {
    var g = S.grid, cols = g.columns;
    if (!g.rows.length) return '<p class="muted">' + L("Waiting for learners to join…", "รอนักเรียนเข้าห้อง…") + "</p>";
    return '<div class="lv-gridwrap"><table class="lv-grid"><thead><tr><th>' + L("Learner", "นักเรียน") + "</th><th>✓</th>" + cols.map(function (c, i) {
      var cls = c.pct == null ? "" : c.pct < 40 ? "low" : c.pct < 70 ? "mid" : "high";
      return '<th class="lv-col ' + cls + (i === S.index ? " cur" : "") + '" data-col="' + i + '" title="' + esc(L("Show question ", "ดูข้อ ") + c.number) + '">' + c.number + "<small>" + (c.pct == null ? "–" : c.pct + "%") + "</small></th>";
    }).join("") + "</tr></thead><tbody>" + g.rows.map(function (r) {
      return "<tr><td>" + esc(r.name) + "</td><td><b>" + r.correct + "</b>/" + cols.length + "</td>" + cols.map(function (c) {
        var v = r.cells[c.key]; return v ? '<td class="' + (v[1] ? "ok" : "bad") + '" title="' + esc(v[0]) + '">' + (v[1] ? "✓" : "✗") + "<small>" + esc(String(v[0]).slice(0, 8)) + "</small></td>" : '<td class="none">·</td>';
      }).join("") + "</tr>";
    }).join("") + "</tbody></table></div>";
  }
  function refreshGrid() { var w = $("[data-grid]"); if (w) { w.innerHTML = gridHtml(); bindGrid(); } var st = $("[data-gstat]"); if (st) st.innerHTML = gridStat(); }
  function gridStat() { var g = S.grid, a = g.columns.reduce(function (t, c) { return t + c.answered; }, 0); return L("Learners ", "นักเรียน ") + "<b>" + g.rows.length + "</b> · " + L("answers ", "คำตอบ ") + "<b>" + a + "</b>/" + (g.rows.length * g.columns.length) + " · " + L("finished ", "ทำครบ ") + "<b>" + g.rows.filter(function (r) { return r.answered === g.columns.length; }).length + "</b>"; }
  function bindGrid() { $$("[data-col]").forEach(function (th) { th.addEventListener("click", function () { focusCol = +th.getAttribute("data-col"); drawHost(); }); }); }
  function drawHost() {
    var self = S.mode === "self";
    var top = '<header class="ex-top lv-hosttop"><div><b>' + esc(S.title) + "</b><br><small>" + L("Teacher panel (do not share this window)", "แผงครู (ห้ามแชร์หน้าต่างนี้)") + " · " + modeName() + "</small></div>" +
      '<div class="lv-code">' + L("code", "รหัส") + " <b>" + esc(S.code) + "</b></div>" +
      '<div class="ex-right"><span class="ex-timer"><span data-left></span></span>' + phase() + '<a class="btn btn--sm btn--primary" target="dd-share" href="live.html?id=' + esc(id) + '&share=1">' + L("Open the share screen ↗", "เปิดจอสำหรับแชร์ ↗") + '</a><a class="ex-link" href="index.html#/live">' + L("Exit", "ออก") + "</a></div></header>";
    if (S.phase === "ended") {
      var sc = S.scores || {}, rows = Object.keys(sc).map(function (u) { return sc[u]; }).sort(function (a, b) { return b.correct - a.correct; });
      root.innerHTML = top + '<main class="ex-main"><div class="ex-result"><h2>' + L("Results", "ผลคะแนน") + "</h2>" + (rows.length ? '<table class="ex-crit"><tr><th>' + L("Learner", "นักเรียน") + "</th><th>" + L("Correct", "ถูก") + "</th><th>" + L("Answered", "ตอบ") + "</th></tr>" +
        rows.map(function (r) { return "<tr><td>" + esc(r.name) + "</td><td>" + r.correct + " / " + S.total + "</td><td>" + r.answered + "</td></tr>"; }).join("") + "</table>" : "<p>" + L("Nobody joined.", "ไม่มีผู้เข้าร่วม") + "</p>") +
        "<h2>" + L("Answer grid", "ตารางคำตอบ") + '</h2><div data-grid>' + gridHtml() + '</div><p class="ex-note">' + L("These answers now count in the item statistics (Exam item bank).", "คำตอบเหล่านี้ถูกนำไปคำนวณสถิติข้อสอบแล้ว (คลังข้อสอบ)") + '</p><p><a class="btn" href="index.html#/live">' + L("Back", "กลับ") + "</a></p></div></main>";
      return;
    }
    var Q = self ? S.questions[focusCol != null ? focusCol : S.index] : S.question;
    var counts = {}, answered = 0, correct = 0;
    if (self && Q) {
      S.grid.rows.forEach(function (r) { var v = r.cells[Q.key]; if (v) { answered++; if (v[1]) correct++; var k = S.kind === "ielts-r" ? String(v[0]).toLowerCase().trim() : v[0]; counts[k] = (counts[k] || 0) + 1; } });
    } else if (S.tally) { counts = S.tally.counts; answered = S.tally.answered; correct = S.tally.correct; }
    var qpane = Q ? '<section class="ex-pane ex-passage">' + passFor(Q) + '</section><section class="ex-pane ex-q"><div class="ex-qhead"><span class="ex-num">' + Q.number + '</span><span class="muted">' + L("of ", "จาก ") + S.total +
      (self && focusCol != null && focusCol !== S.index ? " · " + L("(only on your panel)", "(แสดงเฉพาะแผงครู)") : "") + "</span></div>" +
      qBody(Q, { key: true, counts: counts, answered: answered, bars: true }) + '<p class="lv-stat">' + L("Answered", "ตอบแล้ว") + " <b>" + answered + "</b> / " + S.grid.rows.length + " · " + L("correct", "ถูก") + " <b>" + correct + "</b></p>" +
      '<p class="lv-keybox">' + L("Key: ", "เฉลย: ") + "<b>" + esc(keyText(Q)) + "</b></p></section>" : "";
    root.innerHTML = top + '<main class="ex-main ex-main--' + S.kind + ' lv-host">' + qpane + '</main><section class="lv-panel"><p data-gstat>' + gridStat() + '</p><div data-grid>' + gridHtml() + "</div></section>" +
      '<footer class="ex-foot">' + (self ? "" : '<span class="btn lv-qn">' + L("Question ", "ข้อ ") + (S.index + 1) + " / " + S.total + "</span>") + '<span class="spacer"></span>' + controls() + "</footer>";
    bindGrid();
    $$("[data-ctrl]").forEach(function (b) {
      b.addEventListener("click", function () {
        var a = b.getAttribute("data-ctrl");
        if (a === "end" && !confirm(L("Finish this live class for everyone?", "จบห้องเรียนสดสำหรับทุกคนใช่ไหม?"))) return;
        if (a === "reveal" && S.mode === "self" && !confirm(L("Show the answers to all learners now? Answers will be closed.", "เฉลยให้นักเรียนทุกคนตอนนี้เลยไหม? ระบบจะปิดรับคำตอบ"))) return;
        api("POST", "live/control", { id: id, action: a }).then(function (d) { S = d; focusCol = null; draw(); }).catch(function (e) { alert(e.message); });
      });
    });
    tick();
  }

  function draw() { if (role === "host") drawHost(); else if (role === "share") drawShare(); else drawLearner(); }
  start();
})();
