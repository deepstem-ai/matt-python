/* ==========================================================================
   DeepDistrict — audited PDF builder (test papers and score reports)
   DDPDF.build(payload) → Promise<Blob>. The payload comes from the server
   (/api/doc/paper, /api/doc/report, /api/doc/get) and is already recorded there.
   Every PDF carries: logo, title, who created it and when, who generated this
   copy and when, a verification code + QR code, usage instructions, the legal /
   copyright notice, and on every page a footer with the code, date and page
   number plus a light watermark of the code.
   Needs vendor/html2canvas.min.js, vendor/jspdf.umd.min.js and vendor/qrcode.js.
   ========================================================================== */
(function () {
  "use strict";
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var LET = ["A", "B", "C", "D"];
  var NAME = { sat: "SAT Reading and Writing", "ielts-r": "IELTS Academic Reading", "ielts-w": "IELTS Academic Writing" };
  var DOM = { cs: "Craft and Structure", ii: "Information and Ideas", sec: "Standard English Conventions", eoi: "Expression of Ideas" };
  var CRIT = { ta: "Task Achievement / Response", cc: "Coherence & Cohesion", lr: "Lexical Resource", gra: "Grammatical Range & Accuracy" };

  function base() { var p = location.pathname, i = p.indexOf("/admin/"); return location.origin + (i === -1 ? "/" : p.slice(0, i + 1)); }
  function verifyUrl(code) { return base() + "pages/verify.html?c=" + encodeURIComponent(code); }
  function qr(text) {
    if (!window.qrcode) return "";
    var q = window.qrcode(0, "M"); q.addData(text); q.make();
    return q.createDataURL(4, 8);
  }
  function css() {
    if (document.getElementById("ap-style")) return;
    var st = document.createElement("style"); st.id = "ap-style";
    st.textContent =
      ".ap-doc{position:fixed;left:-10000px;top:0;width:794px;background:#fff;color:#111827;font:13px/1.55 'Inter','IBM Plex Sans Thai','Segoe UI',Arial,sans-serif;padding:0}" +
      ".ap-doc *{box-sizing:border-box}.ap-block{padding:0 48px}.ap-gap{height:14px}" +
      ".ap-head{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;padding-top:36px;border-bottom:3px solid #2457e6;padding-bottom:14px}" +
      ".ap-head img.logo{height:30px}.ap-head .org{font-size:11px;color:#46506a;text-align:right}" +
      ".ap-title{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;padding-top:16px}.ap-title h1{font-size:22px;margin:0 0 4px}.ap-title p{margin:0;color:#46506a}" +
      ".ap-qr{text-align:center;font-size:10px;color:#46506a;min-width:120px}.ap-qr img{width:104px;height:104px;display:block;margin:0 auto 4px}.ap-qr b{font:700 12px/1.2 ui-monospace,Menlo,Consolas,monospace;color:#111827;letter-spacing:.04em}" +
      ".ap-meta{width:100%;border-collapse:collapse;margin-top:10px;font-size:11.5px}.ap-meta td{border:1px solid #d6dbe6;padding:5px 8px}.ap-meta td:first-child{width:28%;background:#f3f6fb;font-weight:600}" +
      ".ap-banner{margin-top:10px;padding:8px 12px;border:2px solid #b91c1c;color:#b91c1c;font-weight:700;text-align:center;border-radius:6px}" +
      ".ap-box{margin-top:12px;padding:10px 14px;border:1px solid #d6dbe6;border-radius:8px;background:#f8fafc;font-size:11.5px}.ap-box h2{font-size:13px;margin:0 0 4px}.ap-box p{margin:2px 0}.ap-box ul{margin:2px 0;padding-left:18px}" +
      ".ap-h2{font-size:16px;margin:18px 0 6px;padding-bottom:4px;border-bottom:1px solid #d6dbe6}" +
      ".ap-q{display:grid;grid-template-columns:30px 1fr;gap:8px;padding:10px 0;border-bottom:1px dashed #d6dbe6}.ap-q .n{font-weight:700;background:#111827;color:#fff;border-radius:4px;text-align:center;height:22px;line-height:22px;font-size:12px}" +
      ".ap-q p{margin:0 0 6px}.ap-stem{font-weight:600}.ap-ch{margin:2px 0}.ap-ch b{display:inline-block;width:22px}" +
      ".ap-tbl{border-collapse:collapse;margin:6px 0;font-size:11.5px}.ap-tbl td,.ap-tbl th{border:1px solid #c7cede;padding:4px 7px}.ap-tbl th{background:#f3f6fb}" +
      ".ap-para{margin:0 0 9px;text-align:justify}.ap-para b{color:#2457e6;margin-right:6px}.ap-instr{font-style:italic;color:#46506a;margin:8px 0 4px}" +
      ".ap-opts{margin:4px 0 6px;padding:6px 10px;border:1px solid #d6dbe6;border-radius:6px;font-size:12px}.ap-opts div b{display:inline-block;min-width:34px}" +
      ".ap-line{border-bottom:1px solid #9aa3b5;height:26px}.ap-blank{display:inline-block;min-width:150px;border-bottom:1px solid #111827}" +
      ".ap-key td{vertical-align:top}.ap-legal{font-size:10.5px;color:#46506a}.ap-legal p{margin:3px 0}" +
      ".ap-score{display:flex;gap:18px;align-items:center;margin:14px 0;padding:14px 18px;border:1px solid #d6dbe6;border-radius:10px}.ap-score b{font-size:40px;color:#2457e6;line-height:1}" +
      ".ap-end{height:30px}";
    document.head.appendChild(st);
  }
  function tbl(t) { return t && t.rows && t.rows.length ? (t.title ? "<p><b>" + esc(t.title) + "</b></p>" : "") + '<table class="ap-tbl">' + t.rows.map(function (r, i) { return "<tr>" + r.map(function (c) { return i ? "<td>" + esc(c) + "</td>" : "<th>" + esc(c) + "</th>"; }).join("") + "</tr>"; }).join("") + "</table>" : ""; }
  function lines(t) { return esc(t).split(/\n/).map(function (l) { return "<p>" + (l || "&nbsp;") + "</p>"; }).join(""); }
  function block(html, cls) { return '<div class="ap-block ' + (cls || "") + '">' + html + "</div>"; }

  function header(p) {
    var exam = NAME[p.exam] || "";
    var rows = [["Document / เอกสาร", p.kind === "paper" ? (p.withKey ? "Test paper — TEACHER COPY with answer key / ข้อสอบ ฉบับครู (มีเฉลย)" : "Test paper (student copy) / ข้อสอบ ฉบับนักเรียน") : "Score report / รายงานผลสอบ"],
      ["Verification code / รหัสตรวจสอบ", p.code], ["Created / สร้างเมื่อ", p.createdAtLocal + " · " + (p.createdBy || "—") + " (" + p.role + ")"],
      ["This copy / ฉบับนี้พิมพ์เมื่อ", p.generatedAt + " · " + (p.generatedBy || "—")]];
    if (p.note) rows.push(["Class / note · ห้อง/หมายเหตุ", p.note]);
    if (p.kind === "report") rows.splice(1, 0, ["Learner / ผู้สอบ", p.learner || "—"]);
    if (p.minutes) rows.push(["Time allowed / เวลา", p.minutes + " minutes / นาที"]);
    return block('<div class="ap-head"><img class="logo" src="' + base() + 'assets/images/brand/logo-horizontal.png" alt="DeepDistrict"><div class="org"><b>DeepDistrict.si</b><br>Learning & research lab · Bangkok, Thailand<br>info@deepdistrict.si</div></div>' +
      '<div class="ap-title"><div><h1>' + esc(p.title) + "</h1><p>" + esc(exam) + "</p></div>" +
      '<div class="ap-qr"><img src="' + qr(verifyUrl(p.code)) + '" alt=""><b>' + esc(p.code) + "</b><br>Scan to verify · สแกนเพื่อตรวจสอบ</div></div>" +
      '<table class="ap-meta">' + rows.map(function (r) { return "<tr><td>" + esc(r[0]) + "</td><td>" + esc(r[1]) + "</td></tr>"; }).join("") + "</table>" +
      (p.withKey ? '<div class="ap-banner">TEACHER COPY — CONTAINS ANSWERS · ฉบับครู มีเฉลย ห้ามแจกนักเรียน</div>' : ""));
  }
  var HOW = {
    sat: ["Each question has one short passage and four choices. Choose the one best answer. There is no penalty for wrong answers.", "แต่ละข้อมีบทอ่านสั้นและ 4 ตัวเลือก เลือกคำตอบที่ดีที่สุดเพียงข้อเดียว ตอบผิดไม่หักคะแนน", "Real test: 2 modules × 27 questions, 32 minutes each (≈71 seconds per question)."],
    "ielts-r": ["Read the passage and answer the questions. Follow each instruction: write NO MORE THAN the number of words allowed; spelling must be correct.", "อ่านบทความแล้วตอบคำถาม ทำตามคำสั่งแต่ละชุด เขียนไม่เกินจำนวนคำที่กำหนด และต้องสะกดให้ถูกต้อง", "Real test: 3 passages, 40 questions, 60 minutes, no extra transfer time."],
    "ielts-w": ["Write your answers in English. Task 1: at least 150 words (about 20 minutes). Task 2: at least 250 words (about 40 minutes). Task 2 counts twice as much.", "เขียนเป็นภาษาอังกฤษ Task 1 อย่างน้อย 150 คำ (ประมาณ 20 นาที) Task 2 อย่างน้อย 250 คำ (ประมาณ 40 นาที) Task 2 มีน้ำหนักเป็นสองเท่า", "Real test: 60 minutes for both tasks."]
  };
  function instructions(p) {
    if (p.kind === "report") return block('<div class="ap-box"><h2>About this report · เกี่ยวกับรายงานนี้</h2><ul><li>Results of a DeepDistrict online practice test, marked by our server (Writing bands are confirmed by a teacher). Scores are practice estimates, not official results.</li>' +
      "<li>ผลการสอบฝึกออนไลน์ของ DeepDistrict ตรวจโดยระบบ (คะแนน Writing ยืนยันโดยครู) คะแนนเป็นค่าประมาณเพื่อการฝึก ไม่ใช่ผลสอบทางการ</li></ul></div>");
    var h = HOW[p.exam] || ["", "", ""];
    return block('<div class="ap-box"><h2>How to use this paper · วิธีใช้</h2><ul><li>' + esc(h[0]) + "</li><li>" + esc(h[1]) + "</li><li>" + esc(h[2]) +
      "</li><li>For classroom practice at DeepDistrict. Scores are practice estimates, not official results. · ใช้ฝึกในชั้นเรียน DeepDistrict คะแนนเป็นค่าประมาณ ไม่ใช่ผลสอบทางการ</li></ul></div>");
  }
  function legal(p) {
    return block('<div class="ap-box ap-legal"><h2>Legal notice · ขอบเขตทางกฎหมาย</h2>' +
      "<p>© " + new Date().getFullYear() + " DeepDistrict.si. All questions and passages are original material written by DeepDistrict and are not taken from any official or published test. This copy is licensed only to the school/teacher named above and their enrolled learners for classroom use. Copying, reselling, sharing online, uploading to other services or using it to train AI systems is not allowed without written permission.</p>" +
      "<p>© DeepDistrict.si ข้อสอบและบทอ่านทั้งหมดเป็นงานต้นฉบับของ DeepDistrict ไม่ได้นำมาจากข้อสอบทางการหรือหนังสือที่ตีพิมพ์ เอกสารนี้อนุญาตให้ใช้เฉพาะผู้สร้างตามที่ระบุและนักเรียนที่ลงทะเบียน เพื่อการเรียนในชั้นเรียนเท่านั้น ห้ามทำซ้ำ จำหน่าย เผยแพร่ออนไลน์ อัปโหลด หรือนำไปฝึก AI โดยไม่ได้รับอนุญาตเป็นลายลักษณ์อักษร</p>" +
      "<p>SAT® is a registered trademark of the College Board. IELTS is jointly owned by the British Council, IDP: IELTS Australia and Cambridge University Press & Assessment. DeepDistrict is not affiliated with or endorsed by them.</p>" +
      (p.kind === "report" ? "<p>This report contains personal data (PDPA). Keep it private; share it only with the learner, their parents/guardians and DeepDistrict staff. · เอกสารนี้มีข้อมูลส่วนบุคคล (PDPA) โปรดเก็บรักษาและเปิดเผยเฉพาะผู้เรียน ผู้ปกครอง และเจ้าหน้าที่ DeepDistrict</p>" : "") +
      "<p>Every copy is logged (who generated it and when). Check that a printed copy is genuine at " + esc(verifyUrl(p.code)) + " · ทุกฉบับถูกบันทึกว่าใครสร้างและเมื่อไร ตรวจสอบความถูกต้องได้ที่ลิงก์ด้านบน</p></div>");
  }

  function paperBody(p) {
    var out = [], n = 0;
    p.items.forEach(function (it) {
      if (it.kind === "sat") {
        n++;
        out.push(block('<div class="ap-q"><div class="n">' + n + "</div><div>" + lines(it.passage) + tbl(it.table) + '<p class="ap-stem">' + esc(it.stem) + "</p>" +
          it.choices.map(function (c, i) { return '<div class="ap-ch"><b>' + LET[i] + ")</b>" + esc(c) + "</div>"; }).join("") + "</div></div>"));
      } else if (it.kind === "ielts-r") {
        out.push(block('<h2 class="ap-h2">' + esc(it.title) + "</h2>"));
        it.paragraphs.forEach(function (para, i) { out.push(block('<p class="ap-para">' + (it.labelled ? "<b>" + String.fromCharCode(65 + i) + "</b>" : "") + esc(para) + "</p>")); });
        it.groups.forEach(function (g) {
          var from = n + 1;
          out.push(block('<p class="ap-instr"><b>Questions ' + from + (g.questions.length > 1 ? "–" + (n + g.questions.length) : "") + "</b> · " + esc(g.instructions) + "</p>" +
            (g.options && g.options.length && g.type !== "tfng" && g.type !== "ynng" ? '<div class="ap-opts">' + g.options.map(function (o) { return "<div><b>" + esc(o.key) + "</b>" + esc(o.text) + "</div>"; }).join("") + "</div>" : "") +
            (g.image ? '<img src="' + esc(g.image) + '" style="max-width:100%" alt="">' : "")));
          g.questions.forEach(function (q) {
            n++;
            var ans = g.type === "tfng" ? "TRUE / FALSE / NOT GIVEN" : g.type === "ynng" ? "YES / NO / NOT GIVEN" : "";
            out.push(block('<div class="ap-q"><div class="n">' + n + "</div><div><p>" + esc(q.text) + "</p>" +
              (q.options ? q.options.map(function (o) { return '<div class="ap-ch"><b>' + esc(o.key) + ")</b>" + esc(o.text) + "</div>"; }).join("") : "") +
              (ans ? '<p style="color:#46506a;font-size:11px">' + ans + "</p>" : "") + '<p>Answer / คำตอบ: <span class="ap-blank">&nbsp;</span></p></div></div>'));
          });
        });
      } else {
        out.push(block('<h2 class="ap-h2">Writing Task ' + it.task + "</h2>" + lines(it.prompt) + tbl(it.table) + (it.image ? '<img src="' + esc(it.image) + '" style="max-width:100%" alt="">' : "")));
        var rows = it.task === 1 ? 18 : 26;
        for (var i = 0; i < rows; i += 6) out.push(block(new Array(Math.min(6, rows - i) + 1).join('<div class="ap-line"></div>')));
      }
    });
    return out;
  }
  function answerKey(p) {
    var out = [block('<h2 class="ap-h2">Answer key · เฉลย (teacher copy)</h2>', "ap-break")], n = 0, rows = [];
    p.items.forEach(function (it) {
      if (it.kind === "sat") { n++; rows.push("<tr><td><b>" + n + "</b></td><td><b>" + LET[it.answer] + "</b></td><td>" + esc(DOM[it.domain] || "") + " · " + esc(it.skill) + " · " + esc({ e: "easy", m: "medium", h: "hard" }[it.difficulty] || "") + "<br>" + esc((it.explanation || {}).en || "") + (it.explanation && it.explanation.th ? "<br>" + esc(it.explanation.th) : "") + "</td></tr>"); }
      else if (it.kind === "ielts-r") it.groups.forEach(function (g) { g.questions.forEach(function (q) { n++; rows.push("<tr><td><b>" + n + "</b></td><td><b>" + esc((q.answer || []).join(" / ")) + "</b></td><td>" + esc(g.type) + "</td></tr>"); }); });
    });
    for (var i = 0; i < rows.length; i += 6) out.push(block('<table class="ap-tbl ap-key" style="width:100%">' + rows.slice(i, i + 6).join("") + "</table>"));
    return rows.length ? out : [];
  }
  function reportBody(p) {
    var a = p.attempt || {}, out = [];
    var big = a.kind === "sat" ? (a.estimate ? a.estimate : a.correct + "/" + a.total) : a.kind === "ielts-r" ? a.band : (a.band != null ? a.band : "—");
    var label = a.kind === "sat" ? (a.estimate ? "Estimated Reading and Writing score (200–800)" : "Correct answers") : a.kind === "ielts-r" ? "Estimated Reading band (" + a.correct + "/" + a.total + ")" : (a.band != null ? "Writing band confirmed by " + (a.markedBy || "teacher") : "Waiting for the teacher's marks");
    out.push(block('<div class="ap-score"><b>' + esc(big) + "</b><div>" + esc(label) + "<br><small>" + esc(a.mode === "mock" ? "Full test" : "Practice") + " · " + esc(a.startedAt || "") + (a.finishedAt ? " → " + esc(a.finishedAt) : "") + " (UTC+7)</small></div></div>"));
    if (a.kind === "sat" && a.byDomain) out.push(block('<table class="ap-tbl" style="width:100%"><tr><th>Domain</th><th>Correct</th></tr>' + Object.keys(a.byDomain).filter(function (d) { return a.byDomain[d].t; }).map(function (d) { return "<tr><td>" + esc(DOM[d]) + "</td><td>" + a.byDomain[d].c + " / " + a.byDomain[d].t + "</td></tr>"; }).join("") + "</table>" +
      (a.modules ? "<p>" + a.modules.map(function (m) { return esc(m.key === "m1" ? "Module 1" : m.key === "m2" ? "Module 2" : "Practice") + ": " + m.correct + "/" + m.total; }).join(" · ") + (a.route ? " · module 2: " + (a.route === "hard" ? "harder set" : "easier set (ceiling ≈ " + a.ceiling + ")") : "") + "</p>" : "")));
    if (a.kind === "ielts-r" && a.passages) out.push(block('<table class="ap-tbl" style="width:100%"><tr><th>Passage</th><th>Correct</th></tr>' + a.passages.map(function (x) { return "<tr><td>" + esc(x.title) + "</td><td>" + x.correct + "</td></tr>"; }).join("") + "</table>"));
    if (a.kind === "ielts-w") {
      Object.keys(a.tasksInfo || {}).forEach(function (iid) {
        var c = (a.criteria || {})[iid];
        out.push(block("<h2 class=\"ap-h2\">Task " + a.tasksInfo[iid] + " · " + ((a.words || {})[iid] || 0) + " words</h2>" + (c ? '<table class="ap-tbl" style="width:100%"><tr>' + Object.keys(CRIT).map(function (k) { return "<th>" + CRIT[k] + "</th>"; }).join("") + "</tr><tr>" + Object.keys(CRIT).map(function (k) { return "<td>" + c[k] + "</td>"; }).join("") + "</tr></table><p>Task band: " + ((a.tasks || {})[iid]) + "</p>" : "<p>Not marked yet.</p>")));
      });
      if (a.comment) out.push(block('<div class="ap-box"><h2>Teacher comment · ความเห็นครู</h2>' + lines(a.comment) + "</div>"));
    }
    return out;
  }

  function build(p) {
    css();
    var doc = document.createElement("div"); doc.className = "ap-doc";
    var blocks = [header(p), instructions(p)].concat(p.kind === "paper" ? paperBody(p) : reportBody(p)).concat(p.kind === "paper" && p.withKey ? answerKey(p) : []).concat([legal(p), '<div class="ap-end"></div>']);
    doc.innerHTML = blocks.join('<div class="ap-gap"></div>');
    document.body.appendChild(doc);
    var imgs = Array.prototype.slice.call(doc.querySelectorAll("img"));
    return Promise.all(imgs.map(function (im) { return im.complete ? 0 : new Promise(function (r) { im.onload = im.onerror = r; }); })).then(function () { return document.fonts ? document.fonts.ready : 0; }).then(function () {
      var top0 = doc.getBoundingClientRect().top, W = doc.offsetWidth;
      var cuts = Array.prototype.slice.call(doc.querySelectorAll(".ap-block")).map(function (b) { var r = b.getBoundingClientRect(); return { top: r.top - top0, bottom: r.bottom - top0, brk: b.classList.contains("ap-break") }; });
      return window.html2canvas(doc, { scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false }).then(function (c) {
        document.body.removeChild(doc);
        var pdf = new window.jspdf.jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        var pw = pdf.internal.pageSize.getWidth(), ph = pdf.internal.pageSize.getHeight(), foot = 12;
        var k = c.width / W, mmPerPx = pw / c.width, pageH = Math.floor((ph - foot - 6) / mmPerPx);
        // choose page cuts at block edges (never through a question); forced break before the answer key
        var pages = [], y = 0;
        while (y < c.height - 2) {
          var limit = y + pageH, cut = limit;
          var fits = cuts.filter(function (b) { return b.bottom * k <= limit && b.bottom * k > y; });
          var brk = cuts.filter(function (b) { return b.brk && b.top * k > y + 10 && b.top * k < limit; })[0];
          if (brk) cut = Math.floor(brk.top * k) - 4;
          else if (fits.length && limit < c.height) cut = Math.ceil(fits[fits.length - 1].bottom * k) + 6;
          cut = Math.min(cut, c.height);
          if (cut <= y + 20) cut = Math.min(limit, c.height);
          pages.push([y, cut]); y = cut;
        }
        pages.forEach(function (pg, i) {
          var h = pg[1] - pg[0], part = document.createElement("canvas");
          part.width = c.width; part.height = h;
          var g = part.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, part.width, h); g.drawImage(c, 0, pg[0], c.width, h, 0, 0, c.width, h);
          if (i) pdf.addPage();
          pdf.addImage(part.toDataURL("image/jpeg", 0.9), "JPEG", 0, 4, pw, h * mmPerPx);
          // watermark + footer (ASCII only: the built-in PDF font has no Thai)
          if (pdf.GState) pdf.setGState(new pdf.GState({ opacity: 0.07 }));
          pdf.setTextColor(36, 87, 230); pdf.setFontSize(44);
          pdf.text("DeepDistrict  " + p.code, pw / 2, ph * 0.62, { angle: 30, align: "center" });
          if (pdf.GState) pdf.setGState(new pdf.GState({ opacity: 1 }));
          pdf.setDrawColor(200, 206, 220); pdf.line(10, ph - foot, pw - 10, ph - foot);
          pdf.setTextColor(90, 99, 120); pdf.setFontSize(7.5);
          pdf.text("DeepDistrict.si  |  " + (p.kind === "paper" ? (p.withKey ? "TEACHER COPY" : "Student copy") : "Score report") + "  |  Code " + p.code + "  |  Generated " + String(p.generatedAt).replace(/[^\x20-\x7e]/g, "") + "  |  Page " + (i + 1) + " of " + pages.length, 10, ph - foot + 4.5);
          pdf.text("Verify at " + verifyUrl(p.code) + "  -  copying or sharing outside DeepDistrict classes is not allowed.", 10, ph - foot + 8.5);
        });
        pdf.setProperties({ title: p.title + " (" + p.code + ")", subject: p.kind === "paper" ? "DeepDistrict test paper" : "DeepDistrict score report", author: "DeepDistrict.si", creator: "DeepDistrict back office", keywords: p.code });
        return pdf.output("blob");
      });
    }).catch(function (e) { if (doc.parentNode) doc.parentNode.removeChild(doc); throw e; });
  }

  function save(p, api) {
    return build(p).then(function (blob) {
      var a = document.createElement("a"); a.href = URL.createObjectURL(blob);
      a.download = (p.kind === "paper" ? "paper" : "report") + "-" + p.code + ".pdf";
      document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
      if (api) api("POST", "doc/log", { code: p.code, action: "download" }).catch(function () {});
      return blob;
    });
  }
  window.DDPDF = { build: build, save: save, verifyUrl: verifyUrl };
})();
