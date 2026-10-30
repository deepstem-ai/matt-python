/* ==========================================================================
   DeepDistrict — live class (live.html)
   Teacher (host):  live.html?id=<session>  — projector-friendly question, join
                    code, live answer bars, roster, Open / Lock / Show answer /
                    Next / End. "Hide key" keeps the answer off the projector.
   Learner:         live.html (or ?code=ABC123) — join with the code, then the
                    same question appears on the learner's screen, answers are
                    sent while the teacher keeps answering open, and the answer
                    with its explanation appears when the teacher reveals it.
   Both poll the server every 1.5 s; the key reaches learners only after reveal.
   ========================================================================== */
(function () {
  "use strict";
  var lang = (function () { try { return localStorage.getItem("dd-admin-lang") || "th"; } catch (e) { return "th"; } })();
  var L = function (en, th) { return lang === "th" ? th : en; };
  try { var th = localStorage.getItem("dd-admin-theme"); document.documentElement.setAttribute("data-theme", th === "dark" || (!th && matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light"); } catch (e) {}
  document.documentElement.lang = lang;
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var $ = function (s, c) { return (c || document).querySelector(s); }, $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var root = $("#live"), q = new URLSearchParams(location.search), id = q.get("id"), S = null, host = false, timer = null, offset = 0, hideKey = false, typing = "";
  var LET = ["A", "B", "C", "D"];

  function api(method, path, body) {
    return fetch("../api/" + path, { method: method, credentials: "same-origin", headers: method === "POST" ? { "Content-Type": "application/json", "X-DD": "1" } : {}, body: method === "POST" ? JSON.stringify(body) : undefined })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var e = new Error(j.error || r.status); e.status = r.status; throw e; } return j; }); });
  }
  function joinUrl() { var p = location.pathname; return location.origin + p.replace(/live\.html.*$/, "live.html"); }
  function passage(text) { return esc(text).split(/\n/).map(function (l) { return "<p>" + l + "</p>"; }).join(""); }
  function table(t) { return t && t.rows && t.rows.length ? '<div class="ex-table"><table>' + t.rows.map(function (r, i) { return "<tr>" + r.map(function (c) { return i ? "<td>" + esc(c) + "</td>" : "<th>" + esc(c) + "</th>"; }).join("") + "</tr>"; }).join("") + "</table></div>" : ""; }
  var PH = { lobby: ["Waiting for the teacher", "รอครูเปิดคำถาม"], open: ["Answer now", "ตอบได้เลย"], locked: ["Answers closed", "ปิดรับคำตอบแล้ว"], reveal: ["Answer shown", "เฉลยแล้ว"], ended: ["Finished", "จบแล้ว"] };

  /* ---------------------------------------------------------------- start */
  function start() {
    if (!id) return joinForm(q.get("code") || "");
    api("GET", "live/host?id=" + encodeURIComponent(id)).then(function (d) { host = true; S = d; loop(); })
      .catch(function (e) {
        if (e.status === 401) return signIn();
        api("GET", "live/state?id=" + encodeURIComponent(id)).then(function (d) { host = false; S = d; loop(); })
          .catch(function (e2) { if (e2.status === 401) return signIn(); joinForm(""); });
      });
  }
  function signIn() { root.innerHTML = '<div class="ex-msg"><h1>' + L("Please sign in first", "กรุณาเข้าสู่ระบบก่อน") + '</h1><p><a class="btn btn--primary" href="index.html">' + L("Sign in", "เข้าสู่ระบบ") + "</a></p></div>"; }
  function joinForm(code, err) {
    root.innerHTML = '<form class="lv-join" data-join><h1>' + L("Join a live class", "เข้าห้องเรียนสด") + "</h1><p>" + L("Type the code on your teacher's screen.", "พิมพ์รหัสที่แสดงบนจอของครู") + "</p>" +
      '<input name="code" maxlength="6" autocomplete="off" autocapitalize="characters" spellcheck="false" value="' + esc(code) + '" aria-label="Code" placeholder="ABC123">' +
      (err ? '<p class="ex-under">' + esc(err) + "</p>" : "") + '<button class="btn btn--primary">' + L("Join", "เข้าร่วม") + '</button><p><a class="ex-link" href="index.html#/tests">' + L("Back", "ย้อนกลับ") + "</a></p></form>";
    $("[data-join]").addEventListener("submit", function (e) {
      e.preventDefault();
      api("POST", "live/join", { code: this.elements.code.value }).then(function (r) { history.replaceState(null, "", "live.html?id=" + r.id); id = r.id; start(); })
        .catch(function (er) { if (er.status === 401) return signIn(); joinForm(this && this.elements ? this.elements.code.value : code, er.message); });
    });
    if (code && q.get("code")) $("[data-join] button").click();
  }
  function loop() {
    offset = new Date(S.serverNow).getTime() - Date.now();
    draw();
    clearInterval(timer);
    timer = setInterval(function () {
      if (S && S.phase === "ended" && !host) return;
      (host ? api("GET", "live/host?id=" + id) : api("GET", "live/state?id=" + id + "&v=" + S.version)).then(function (d) {
        if (d.same) return tick();
        // learners redraw only when their own view changes (not on every classmate's answer)
        var changed = !S || d.phase !== S.phase || d.index !== S.index || (host ? d.version !== S.version : d.mine !== S.mine || !!d.result !== !!S.result);
        S = d; offset = new Date(S.serverNow).getTime() - Date.now();
        if (changed) draw(); else tick();
      }).catch(function () {});
    }, 1500);
  }
  function left() {
    if (!S.seconds || S.phase !== "open" || !S.openedAt) return null;
    return Math.max(0, Math.round((new Date(S.openedAt).getTime() + S.seconds * 1000 - (Date.now() + offset)) / 1000));
  }
  function tick() { var t = $("[data-left]"), l = left(); if (t) t.textContent = l == null ? "" : l + "s"; }

  /* ---------------------------------------------------------------- question block */
  function qhtml(Q, opts) {
    opts = opts || {};
    var showKey = opts.key, mine = opts.mine, counts = opts.counts || {}, total = opts.answered || 0;
    if (Q.type === "sat") {
      return '<section class="ex-pane ex-passage">' + passage(Q.passage) + table(Q.table) + "</section><section class=\"ex-pane ex-q\"><p class=\"ex-stem\">" + esc(Q.stem) + '</p><div class="ex-choices">' +
        Q.choices.map(function (c, i) {
          var n = counts[String(i)] || 0, pct = total ? Math.round(n / total * 100) : 0, right = showKey && Q.answer === i;
          return '<div class="ex-choice' + (String(i) === mine ? " sel" : "") + (right ? " lv-right" : "") + '"><button type="button" data-pick="' + i + '"' + (opts.canAnswer ? "" : " disabled") + "><b>" + LET[i] + "</b><span>" + esc(c) + "</span>" +
            (opts.bars ? '<i class="lv-bar" style="width:' + pct + '%"></i><em class="lv-n">' + n + "</em>" : "") + "</button></div>";
        }).join("") + "</div>" + (opts.after || "") + "</section>";
    }
    var input = "";
    if (Q.wordLimit) input = '<input class="ex-text lv-text" data-text value="' + esc(mine || typing) + '"' + (opts.canAnswer ? "" : " disabled") + ' autocomplete="off" spellcheck="false"><button class="btn btn--primary" data-send' + (opts.canAnswer ? "" : " disabled") + ">" + L("Send", "ส่ง") + "</button>" + (mine ? '<p class="ex-wc">' + L("Sent: ", "ส่งแล้ว: ") + "<b>" + esc(mine) + "</b></p>" : "");
    else input = '<div class="ex-choices">' + (Q.options || []).map(function (o) {
      var n = counts[o.key.toLowerCase()] || counts[o.key] || 0, pct = total ? Math.round(n / total * 100) : 0, right = showKey && (Q.answer || []).some(function (a) { return a.toLowerCase() === o.key.toLowerCase(); });
      return '<div class="ex-choice' + (o.key === mine ? " sel" : "") + (right ? " lv-right" : "") + '"><button type="button" data-pick="' + esc(o.key) + '"' + (opts.canAnswer ? "" : " disabled") + "><b>" + esc(o.key) + "</b><span>" + esc(o.text === o.key ? "" : o.text) + "</span>" +
        (opts.bars ? '<i class="lv-bar" style="width:' + pct + '%"></i><em class="lv-n">' + n + "</em>" : "") + "</button></div>";
    }).join("") + "</div>";
    var textCounts = opts.bars && Q.wordLimit ? '<ul class="lv-texts">' + Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; }).slice(0, 8).map(function (k) { return "<li>" + esc(k) + " <b>×" + counts[k] + "</b></li>"; }).join("") + "</ul>" : "";
    return '<section class="ex-pane ex-passage ex-reading"><h2>' + esc(Q.title) + "</h2>" + Q.paragraphs.map(function (p, i) { return "<p>" + (Q.labelled ? '<b class="ex-para">' + String.fromCharCode(65 + i) + "</b> " : "") + esc(p) + "</p>"; }).join("") + "</section>" +
      '<section class="ex-pane ex-q"><p class="ex-instr">' + esc(Q.instructions) + "</p>" + (Q.image ? '<img class="ex-diagram" src="' + esc(Q.image) + '" alt="">' : "") +
      '<div class="ex-rq"><span class="ex-num">' + Q.number + "</span><div><p>" + esc(Q.text) + "</p>" + input + "</div></div>" + textCounts +
      (showKey ? '<p class="lv-key">' + L("Answer: ", "เฉลย: ") + "<b>" + esc((Q.answer || []).join(" / ")) + "</b></p>" : "") + (opts.after || "") + "</section>";
  }
  function bind(Q) {
    $$("[data-pick]").forEach(function (b) { b.addEventListener("click", function () { send(b.getAttribute("data-pick")); }); });
    var t = $("[data-text]"), s = $("[data-send]");
    if (t) t.addEventListener("input", function () { typing = t.value; });
    if (s) s.addEventListener("click", function () { if (t.value.trim()) send(t.value.trim()); });
  }
  function send(v) {
    api("POST", "live/answer", { id: id, value: v }).then(function () { S.mine = v; typing = ""; draw(); }).catch(function (e) { alert(e.message); });
  }

  /* ---------------------------------------------------------------- screens */
  function draw() {
    if (host) return drawHost();
    var top = '<header class="ex-top"><div><b>' + esc(S.title) + "</b><br><small>" + L("Live class", "ห้องเรียนสด") + (S.teacher ? " · " + esc(S.teacher) : "") + '</small></div><div class="ex-timer"><span data-left></span></div><div class="ex-right"><span class="lv-phase lv-phase--' + S.phase + '">' + L(PH[S.phase][0], PH[S.phase][1]) + "</span>" +
      (S.phase !== "ended" ? " · " + L("Question ", "ข้อ ") + (S.index + 1) + "/" + S.total : "") + "</div></header>";
    if (S.phase === "ended") {
      root.innerHTML = top + '<main class="ex-main"><div class="ex-result"><div class="ex-score"><b>' + (S.score ? S.score.correct + "/" + S.total : "–") + "</b><span>" + L("correct in this live class", "ข้อที่ตอบถูกในห้องเรียนสดนี้") + '</span></div><p><a class="btn" href="index.html#/tests">' + L("Back to Tests", "กลับไปหน้าข้อสอบ") + "</a></p></div></main>";
      return;
    }
    if (!S.question) { root.innerHTML = top + '<main class="ex-main"><div class="ex-msg"><h1>⏳</h1><p>' + L("You're in! The next question appears here when the teacher opens it.", "เข้าห้องแล้ว คำถามถัดไปจะแสดงที่นี่เมื่อครูเปิด") + "</p></div></main>"; return; }
    var res = S.result ? '<div class="lv-res ' + (S.result.correct ? "ok" : "bad") + '"><b>' + (S.result.correct ? L("Correct! ✓", "ถูกต้อง ✓") : S.mine == null ? L("No answer", "ไม่ได้ตอบ") : L("Not this time ✗", "ยังไม่ถูก ✗")) + "</b> · " +
      L(S.result.classCorrect + " of " + S.result.answered + " got it right", "ตอบถูก " + S.result.classCorrect + " จาก " + S.result.answered + " คน") + "</div>" +
      (S.question.explanation ? '<p class="lv-exp">' + esc(lang === "th" ? S.question.explanation.th || S.question.explanation.en : S.question.explanation.en || S.question.explanation.th) + "</p>" : "") : "";
    var note = S.phase === "open" ? (S.mine != null ? '<p class="lv-note">✓ ' + L("Answer sent — you can change it until the teacher closes answers.", "ส่งคำตอบแล้ว — แก้ได้จนกว่าครูจะปิดรับคำตอบ") + "</p>" : "") : S.phase === "locked" ? '<p class="lv-note">' + L("Answers are closed. Wait for the answer…", "ปิดรับคำตอบแล้ว รอเฉลย…") + "</p>" : "";
    root.innerHTML = top + '<main class="ex-main ex-main--' + S.kind + '">' + qhtml(S.question, { key: S.phase === "reveal", mine: S.mine, canAnswer: S.phase === "open", after: note + res }) + "</main>";
    bind(S.question); tick();
  }
  function drawHost() {
    var Q = S.question, t = S.tally || { counts: {}, answered: 0, correct: 0 }, people = S.roster.length, showKey = !hideKey || S.phase === "reveal";
    var ctrl = [];
    if (S.phase === "lobby") ctrl.push(["open", L("Open answers", "เปิดรับคำตอบ"), "btn--primary"]);
    if (S.phase === "open") ctrl.push(["lock", L("Close answers", "ปิดรับคำตอบ"), "btn--primary"]);
    if (S.phase === "open" || S.phase === "locked") ctrl.push(["reveal", L("Show answer", "เฉลย"), S.phase === "locked" ? "btn--primary" : ""]);
    if (S.phase === "reveal" && S.index < S.total - 1) ctrl.push(["next", L("Next question →", "ข้อถัดไป →"), "btn--primary"]);
    if (S.phase === "reveal" && S.index === S.total - 1) ctrl.push(["end", L("Finish the class", "จบห้องเรียน"), "btn--primary"]);
    if (S.index > 0 && S.phase !== "ended") ctrl.push(["prev", L("← Previous", "← ข้อก่อนหน้า"), ""]);
    if (S.phase !== "ended" && !(S.phase === "reveal" && S.index === S.total - 1)) ctrl.push(["end", L("End", "จบ"), "btn--danger"]);
    var top = '<header class="ex-top lv-hosttop"><div><b>' + esc(S.title) + "</b><br><small>" + L("Live class · teacher screen", "ห้องเรียนสด · จอครู") + "</small></div>" +
      '<div class="lv-code">' + L("Join at", "เข้าที่") + " <span>" + esc(joinUrl()) + "</span> · " + L("code", "รหัส") + " <b>" + esc(S.code) + "</b></div>" +
      '<div class="ex-right"><span class="ex-timer"><span data-left></span></span><span class="lv-phase lv-phase--' + S.phase + '">' + L(PH[S.phase][0], PH[S.phase][1]) + "</span>" +
      '<label class="lv-hide"><input type="checkbox" data-hidekey' + (hideKey ? " checked" : "") + "> " + L("Hide key (projector)", "ซ่อนเฉลย (ขึ้นจอ)") + '</label><a class="ex-link" href="index.html#/live">' + L("Exit", "ออก") + "</a></div></header>";
    if (S.phase === "ended") {
      var sc = S.scores || {}, rows = Object.keys(sc).map(function (u) { return sc[u]; }).sort(function (a, b) { return b.correct - a.correct; });
      root.innerHTML = top + '<main class="ex-main"><div class="ex-result"><h2>' + L("Results", "ผลคะแนน") + "</h2>" + (rows.length ? '<table class="ex-crit">' + "<tr><th>" + L("Learner", "นักเรียน") + "</th><th>" + L("Correct", "ถูก") + "</th><th>" + L("Answered", "ตอบ") + "</th></tr>" +
        rows.map(function (r) { return "<tr><td>" + esc(r.name) + "</td><td>" + r.correct + " / " + S.total + "</td><td>" + r.answered + "</td></tr>"; }).join("") + "</table>" : "<p>" + L("Nobody joined.", "ไม่มีผู้เข้าร่วม") + "</p>") +
        '<p class="ex-note">' + L("These answers now count in the item statistics (Exam item bank).", "คำตอบเหล่านี้ถูกนำไปคำนวณสถิติข้อสอบแล้ว (คลังข้อสอบ)") + '</p><p><a class="btn" href="index.html#/live">' + L("Back", "กลับ") + "</a></p></div></main>";
      bindHost(); return;
    }
    var after = '<p class="lv-stat">' + L("Answered", "ตอบแล้ว") + " <b>" + t.answered + "</b> / " + people + (showKey ? " · " + L("correct", "ถูก") + " <b>" + t.correct + "</b>" : "") + "</p>" +
      (showKey && Q && Q.explanation ? '<p class="lv-exp">' + esc(lang === "th" ? Q.explanation.th || Q.explanation.en : Q.explanation.en || Q.explanation.th) + "</p>" : "");
    root.innerHTML = top + '<main class="ex-main ex-main--' + S.kind + ' lv-host">' + (Q ? qhtml(Q, { key: showKey, counts: t.counts, answered: t.answered, bars: S.phase !== "lobby", after: after }) : "") + "</main>" +
      '<footer class="ex-foot"><span class="btn lv-qn">' + L("Question ", "ข้อ ") + (S.index + 1) + " / " + S.total + '</span><div class="lv-roster">' + S.roster.map(function (r) { return '<span class="' + (r.answered ? "on" : "") + '">' + esc(r.name) + "</span>"; }).join("") +
      (people ? "" : '<span class="muted">' + L("Waiting for learners to join…", "รอนักเรียนเข้าห้อง…") + "</span>") + '</div><span class="spacer"></span>' +
      ctrl.map(function (c) { return '<button class="btn ' + c[2] + '" data-ctrl="' + c[0] + '">' + esc(c[1]) + "</button>"; }).join("") + "</footer>";
    bindHost(); tick();
  }
  function bindHost() {
    $$("[data-ctrl]").forEach(function (b) {
      b.addEventListener("click", function () {
        var a = b.getAttribute("data-ctrl");
        if (a === "end" && !confirm(L("End this live class for everyone?", "จบห้องเรียนสดสำหรับทุกคนใช่ไหม?"))) return;
        api("POST", "live/control", { id: id, action: a }).then(function (d) { S = d; draw(); }).catch(function (e) { alert(e.message); });
      });
    });
    var h = $("[data-hidekey]"); if (h) h.addEventListener("change", function () { hideKey = h.checked; draw(); });
  }
  start();
})();
