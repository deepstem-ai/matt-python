/* ==========================================================================
   DeepDistrict back office — live class, audited PDF documents and item
   statistics from real results (difficulty calibration).
   * #/live   start a live class (teacher screen opens in live.html) · past classes
   * #/docs   every PDF paper / score report: who made it, when, downloads, re-download, revoke
   * Exam item bank: "PDF paper" and "Results & difficulty" (suggestions to apply)
   ========================================================================== */
(function () {
  "use strict";
  var M1NAME = { sk1: ["Suankularb M.1 · GATE / EPLUS+", "สวนกุหลาบ ม.1 · GATE / EPLUS+"], sp1: ["Satit Prasarnmit M.1", "สาธิตประสานมิตร ม.1"],
    sk4: ["Suankularb M.4 · GATE / EPLUS+", "สวนกุหลาบ ม.4 · GATE / EPLUS+"], sp4: ["Satit Prasarnmit M.4", "สาธิตประสานมิตร ม.4"],
    tu4: ["Triam Udom Suksa M.4", "เตรียมอุดมศึกษา ม.4"], alevel: ["A-Level English (TCAS)", "A-Level ภาษาอังกฤษ (TCAS)"],
    gate: ["Suankularb M.1 · GATE", "สวนกุหลาบ ม.1 · GATE"], ep: ["Suankularb M.1 · EP", "สวนกุหลาบ ม.1 · EP"] };
  var A = window.DDA, L = A.L, esc = A.esc, $ = A.$, $$ = A.$$;
  var PH = { lobby: ["Waiting", "รอเริ่ม"], open: ["Answering", "กำลังตอบ"], locked: ["Closed", "ปิดรับคำตอบ"], reveal: ["Answer shown", "เฉลยแล้ว"], ended: ["Ended", "จบแล้ว"] };
  function when(iso) { return iso ? new Date(iso).toLocaleString(A.lang === "th" ? "th-TH" : "en-GB", { dateStyle: "medium", timeStyle: "short" }) : "–"; }
  function bankData() { return A.api("GET", "exam/bank"); }
  function domOpts(domains) { return Object.keys(domains).map(function (k) { return [k, domains[k].en]; }); }

  /* ================================================================ live class */
  A.pages.live = function (q) {
    if (!A.isStaff()) { location.href = "live.html"; return { title: "", html: "" }; }
    return { title: L("Live class", "ห้องเรียนสด"), actions: '<button class="btn btn--primary" data-act="live-new">+ ' + L("Start a live class", "เริ่มห้องเรียนสด") + "</button>",
      html: '<p class="note">' + L("1) Choose a question set and a mode. 2) In Zoom / on the projector share only the \"share screen\" window — no key, no names. 3) Keep the teacher panel for yourself: key, every learner's answers and a live grid. Learners join from Online tests → \"Join a live class\" with the code.",
        "1) เลือกชุดข้อสอบและรูปแบบ 2) ใน Zoom/โปรเจกเตอร์ ให้แชร์เฉพาะหน้าต่าง \"จอสำหรับแชร์\" (ไม่มีเฉลย ไม่มีชื่อนักเรียน) 3) เปิด \"แผงครู\" ไว้ดูเอง มีเฉลย คำตอบของนักเรียนทุกคน และตารางสด นักเรียนเข้าจาก ข้อสอบออนไลน์ → \"เข้าห้องเรียนสด\" ด้วยรหัส") + '</p><div data-live><p class="muted">' + L("Loading…", "กำลังโหลด…") + "</p></div>",
      after: function () {
        A.api("GET", "live/list").then(function (d) {
          var el = $("[data-live]"); if (!el) return;
          el.innerHTML = d.items.length ? '<div class="tbl-wrap"><table class="tbl tbl--click"><thead><tr><th>' + L("Started", "เริ่มเมื่อ") + "</th><th>" + L("Class", "ห้องเรียน") + "</th><th>" + L("Code", "รหัส") + "</th><th>" + L("Questions · learners", "คำถาม · ผู้เรียน") + "</th><th>" + L("Status", "สถานะ") + "</th></tr></thead><tbody>" +
            d.items.map(function (x) { var ph = PH[x.phase] || PH.ended; return '<tr data-live-open="' + esc(x.id) + '"><td class="nowrap">' + esc(when(x.createdAt)) + "</td><td>" + esc(x.title) + (A.isAdmin() ? '<br><small class="muted">' + esc(x.ownerName) + "</small>" : "") + '</td><td class="mono">' + esc(x.code) + "</td><td>" + x.questions + " · " + x.people + "</td><td>" + A.badge(x.phase === "ended" ? "completed" : "scheduled", L(ph[0], ph[1])) + "</td></tr>"; }).join("") + "</tbody></table></div>"
            : A.empty("No live classes yet.", "ยังไม่มีห้องเรียนสด");
          $$("[data-live-open]", el).forEach(function (tr) { tr.addEventListener("click", function () { location.href = "live.html?id=" + tr.getAttribute("data-live-open"); }); });
        }).catch(function (e) { A.toast(e.message, "err"); });
      } };
  };
  /* start a live class from a saved question set (or a quick random one) */
  A.startLive = function (setId) {
    A.api("GET", "qset/list").then(function (d) {
      if (!d.items.length) { A.toast(L("Create a question set first.", "สร้างชุดข้อสอบก่อน"), "err"); location.hash = "#/sets"; return; }
      A.form({
        title: L("Start a live class", "เริ่มห้องเรียนสด"),
        intro: esc(L("Learners join with a code on their own device. Open the share screen in Zoom / on the projector — it never shows the key before you reveal it. Keep the teacher panel for yourself.",
          "นักเรียนเข้าด้วยรหัสบนอุปกรณ์ของตัวเอง เปิด \"จอสำหรับแชร์\" ใน Zoom/โปรเจกเตอร์ (ไม่แสดงเฉลยก่อนครูกดเฉลย) และเก็บ \"แผงครู\" ไว้ดูเอง")),
        fields: [{ name: "setId", label: L("Question set", "ชุดข้อสอบ"), type: "select", value: setId || d.items[0].id, options: d.items.map(function (x) { return [x.id, x.title + " · " + x.questions + L(" questions", " ข้อ")]; }), full: true },
          { name: "mode", label: L("How the class works", "รูปแบบการเรียน"), type: "select", value: "paced", full: true,
            options: [["paced", L("Teacher leads one question at a time", "ครูพาทำทีละข้อ")], ["self", L("Learners work through the whole set; teacher watches a live grid", "นักเรียนทำเองทั้งชุด ครูดูตารางคำตอบสด")]] },
          { name: "seconds", label: L("Teacher-led: seconds per question (0 = you close answers)", "ครูพาทำ: วินาทีต่อข้อ (0 = ครูปิดเอง)"), type: "number", min: 0, value: 0 },
          { name: "minutes", label: L("Self-paced: time limit in minutes (0 = none)", "ทำเองทั้งชุด: เวลาทั้งหมด (นาที, 0 = ไม่จำกัด)"), type: "number", min: 0, value: 0 }],
        submit: L("Open teacher panel", "เปิดแผงครู"),
        onSave: function (v) {
          return A.api("POST", "live/create", { setId: v.setId, mode: v.mode, seconds: v.seconds, minutes: v.minutes })
            .then(function (r) { location.href = "live.html?id=" + r.id; }).catch(function (e) { A.toast(e.message, "err"); return false; });
        }
      });
    });
  };

  /* ================================================================ question sets */
  A.pages.sets = function () {
    if (!A.isStaff()) return A.pages.home(new URLSearchParams());
    return { title: L("Question sets", "ชุดข้อสอบ"), actions: '<button class="btn btn--primary" data-act="set-new">+ ' + L("New question set", "สร้างชุดข้อสอบ") + "</button>",
      html: '<p class="note">' + L("One set, used everywhere: print the student copy (with a notes column) before class, keep the teacher copy with the key, and run the live class with the very same questions in the same order.",
        "ชุดเดียวใช้ได้ทุกที่: พิมพ์ฉบับนักเรียน (มีช่องจดโน้ต) แจกก่อนเรียน เก็บฉบับครูที่มีเฉลย และเปิดห้องเรียนสดด้วยข้อสอบชุดเดียวกัน ลำดับเดียวกัน") + '</p><div data-sets><p class="muted">' + L("Loading…", "กำลังโหลด…") + "</p></div>",
      after: drawSets };
  };
  var setsCache = [];
  function drawSets() {
    A.api("GET", "qset/list").then(function (d) {
      setsCache = d.items;
      var el = $("[data-sets]"); if (!el) return;
      el.innerHTML = d.items.length ? d.items.map(function (x) {
        return '<section class="box qset"><div class="qset__head"><div><h2>' + esc(x.title) + "</h2><p class=\"muted\">" + ({ sat: "SAT Reading & Writing", "ielts-r": "IELTS Academic Reading", "ielts-w": "IELTS Academic Writing", m1: M1NAME[x.exam] ? L(M1NAME[x.exam][0], M1NAME[x.exam][1]) : L("Entrance practice (English)", "ข้อสอบฝึกสอบเข้า (อังกฤษ)") }[x.kind] || x.kind) + " · " + x.questions + (x.kind === "ielts-w" ? L(" tasks", " งาน") : L(" questions", " ข้อ")) + (x.minutes ? " · " + x.minutes + L(" min", " นาที") : "") +
          (x.source === "ready-made" ? " · " + L("ready-made", "ชุดสำเร็จรูป") : "") + (x.published ? " · ✅ " + L("open to learners", "เปิดให้นักเรียนทำ") : "") + " · " + L("answer order v", "ลำดับตัวเลือก v") + (x.variant || 1) + (x.note ? " · " + esc(x.note) : "") +
          " · " + L("updated ", "แก้ไข ") + esc(when(x.updatedAt)) + (A.isAdmin() && x.ownerName ? " · " + esc(x.ownerName) : "") + "</p></div>" +
          '<div class="btnrow">' + (x.kind === "ielts-w" ? "" : '<button class="btn btn--primary" data-live-set="' + esc(x.id) + '">▶ ' + L("Start live class", "เปิดห้องเรียนสด") + "</button>") + '<button class="btn" data-pdf-set="' + esc(x.id) + '" data-key="0">' + L("Student PDF (notes)", "PDF นักเรียน (ช่องโน้ต)") + '</button>' +
          '<button class="btn" data-pdf-set="' + esc(x.id) + '" data-key="1">' + L("Teacher PDF (key)", "PDF ครู (เฉลย)") + '</button><button class="btn" data-reorder-set="' + esc(x.id) + '" title="' + esc(L("Same questions, answer options in a new order", "ข้อเดิม แต่สลับลำดับตัวเลือกใหม่")) + '">⇄ ' + L("New answer order", "สลับตัวเลือกใหม่") + '</button>' + (x.source === "ready-made" && !A.isAdmin() ? "" : '<button class="btn" data-pub-set="' + esc(x.id) + '" data-pub="' + (x.published ? 0 : 1) + '">' + (x.published ? L("Close to learners", "ปิดไม่ให้นักเรียนทำ") : L("Open to learners", "เปิดให้นักเรียนทำ")) + "</button>") +
          (x.kind === "sat" || x.kind === "ielts-r" ? '<button class="btn" data-edit-set="' + esc(x.id) + '">' + L("Edit", "แก้ไข") + "</button>" : "") + "</div></div>" +
          '<details><summary>' + L("Questions in order", "รายการข้อตามลำดับ") + "</summary><ol class=\"qset__list\">" + x.items.map(function (i) { return "<li>" + esc(i.label) + (i.difficulty ? ' <small class="muted">' + esc(i.domain || "") + " · " + esc(i.difficulty) + "</small>" : "") + "</li>"; }).join("") + "</ol></details></section>";
      }).join("") : A.empty("No question sets yet.", "ยังไม่มีชุดข้อสอบ", '<button class="btn btn--primary" data-act="set-new">+ ' + L("New question set", "สร้างชุดข้อสอบ") + "</button>");
      $$("[data-live-set]", el).forEach(function (b) { b.addEventListener("click", function () { A.startLive(b.getAttribute("data-live-set")); }); });
      $$("[data-pub-set]", el).forEach(function (b) {
        b.addEventListener("click", function () {
          var x = setsCache.filter(function (y) { return y.id === b.getAttribute("data-pub-set"); })[0];
          A.api("POST", "qset/save", { id: x.id, title: x.title, published: b.getAttribute("data-pub") === "1" }).then(function () { drawSets(); }).catch(function (e) { A.toast(e.message, "err"); });
        });
      });
      $$("[data-reorder-set]", el).forEach(function (b) {
        b.addEventListener("click", function () {
          var x = setsCache.filter(function (y) { return y.id === b.getAttribute("data-reorder-set"); })[0];
          if (!confirm(L("Shuffle the answer options of this set? Print new PDFs afterwards — PDFs made before keep the old order.", "สลับลำดับตัวเลือกของชุดนี้ใหม่? ควรพิมพ์ PDF ใหม่หลังจากนี้ — PDF ที่พิมพ์ไปแล้วยังเป็นลำดับเดิม"))) return;
          A.api("POST", "qset/save", { id: x.id, title: x.title, newOrder: true }).then(function () { A.toast(L("New answer order saved", "สลับลำดับตัวเลือกแล้ว")); drawSets(); }).catch(function (e) { A.toast(e.message, "err"); });
        });
      });
      $$("[data-edit-set]", el).forEach(function (b) { b.addEventListener("click", function () { editSet(setsCache.filter(function (x) { return x.id === b.getAttribute("data-edit-set"); })[0]); }); });
      $$("[data-pdf-set]", el).forEach(function (b) {
        b.addEventListener("click", function () {
          var key = b.getAttribute("data-key") === "1"; b.disabled = true;
          A.api("POST", "doc/paper", { setId: b.getAttribute("data-pdf-set"), withKey: key, notes: !key })
            .then(function (p) { A.toast(L("Creating PDF ", "กำลังสร้าง PDF ") + p.code + "…"); return window.DDPDF.save(p, A.api); })
            .then(function () { b.disabled = false; }).catch(function (e) { A.toast(e.message, "err"); b.disabled = false; });
        });
      });
    }).catch(function (e) { A.toast(e.message, "err"); });
  }
  function editSet(x) {
    bankData().then(function (b) {
      var ok = b.items.filter(function (i) { return i.status === "approved"; });
      var sat = ok.filter(function (i) { return i.kind === "sat"; }), sets = ok.filter(function (i) { return i.kind === "ielts-r"; });
      var cur = x ? x.items.map(function (i) { return i.id; }) : [];
      var fields = [{ name: "title", label: L("Name", "ชื่อชุด"), value: x ? x.title : "", required: true, full: true }, { name: "note", label: L("Class / note (printed on PDFs)", "ห้อง / หมายเหตุ (พิมพ์บน PDF)"), value: x ? x.note : "", full: true }];
      if (!x) fields.push({ name: "kind", label: L("Type", "ประเภท"), type: "select", options: [["sat", "SAT Reading & Writing"], ["ielts-r", "IELTS Academic Reading"]] },
        { name: "how", label: L("SAT questions", "ข้อ SAT"), type: "select", options: [["random", L("Random from topics", "สุ่มตามหัวข้อ")], ["pick", L("I choose them (list below)", "เลือกเอง (รายการด้านล่าง)")]] },
        { name: "domains", label: "SAT · " + L("topics", "หัวข้อ"), type: "checks", options: domOpts(b.domains), value: Object.keys(b.domains) },
        { name: "count", label: "SAT · " + L("number of questions", "จำนวนข้อ"), type: "number", min: 1, value: 10 },
        { name: "difficulty", label: "SAT · " + L("difficulty", "ความยาก"), type: "select", options: [["", L("Mixed", "คละ")], ["e", L("Easy", "ง่าย")], ["m", L("Medium", "กลาง")], ["h", L("Hard", "ยาก")]] });
      if (!x || x.kind === "sat") fields.push({ name: "pick", label: L("SAT questions (when choosing yourself; order follows the test's domain order)", "ข้อ SAT (กรณีเลือกเอง เรียงตามลำดับหมวดของข้อสอบจริง)"), type: "checks", value: cur,
        options: sat.map(function (i) { return [i.id, (b.domains[i.domain] || {}).en + " · " + i.difficulty + " · " + (i.stem || "").slice(0, 70)]; }) });
      if (!x || x.kind === "ielts-r") fields.push({ name: "setId", label: "IELTS · " + L("passage", "บทอ่าน"), type: "select", value: cur[0], options: sets.length ? sets.map(function (s) { return [s.id, s.title]; }) : [["", "–"]] });
      A.form({
        title: x ? L("Edit question set", "แก้ไขชุดข้อสอบ") : L("New question set", "สร้างชุดข้อสอบ"),
        intro: esc(L("A set keeps the exact version of each question, so later edits in the bank do not change PDFs or classes made from it.", "ชุดข้อสอบเก็บเวอร์ชันของแต่ละข้อไว้ การแก้ไขในคลังภายหลังจะไม่เปลี่ยน PDF หรือห้องเรียนที่สร้างจากชุดนี้")),
        fields: fields,
        onDelete: x ? function () { A.api("POST", "qset/delete", { id: x.id }).then(drawSets); } : null,
        onSave: function (v) {
          var kind = x ? x.kind : v.kind, body = { id: x && x.id, title: v.title, note: v.note, kind: kind };
          if (kind === "ielts-r") { if (!x || v.setId !== cur[0]) body.setId = v.setId; }
          else if (x) { var same = v.pick.length === cur.length && v.pick.every(function (i) { return cur.indexOf(i) !== -1; }); if (!same) body.itemIds = sat.filter(function (i) { return v.pick.indexOf(i.id) !== -1; }).sort(function (a, c) { return ["cs", "ii", "sec", "eoi"].indexOf(a.domain) - ["cs", "ii", "sec", "eoi"].indexOf(c.domain) || "emh".indexOf(a.difficulty) - "emh".indexOf(c.difficulty); }).map(function (i) { return i.id; }); }
          else if (v.how === "pick") body.itemIds = sat.filter(function (i) { return v.pick.indexOf(i.id) !== -1; }).sort(function (a, c) { return ["cs", "ii", "sec", "eoi"].indexOf(a.domain) - ["cs", "ii", "sec", "eoi"].indexOf(c.domain) || "emh".indexOf(a.difficulty) - "emh".indexOf(c.difficulty); }).map(function (i) { return i.id; });
          else { body.domains = v.domains; body.count = v.count; body.difficulty = v.difficulty; }
          return A.api("POST", "qset/save", body).then(function () { A.toast(L("Saved", "บันทึกแล้ว")); drawSets(); }).catch(function (e) { A.toast(e.message, "err"); return false; });
        }
      });
    });
  }

  /* ================================================================ PDF documents */
  A.pages.docs = function () {
    if (!A.isStaff()) return A.pages.home(new URLSearchParams());
    return { title: L("PDF documents", "เอกสาร PDF"), actions: '<button class="btn btn--primary" data-act="pdf-paper">+ ' + L("New test paper", "สร้างชุดข้อสอบ PDF") + "</button>",
      html: '<p class="note">' + L("Every PDF has a verification code and QR code, the creator's name and the time, the usage instructions and the legal notice. Each download is logged. Anyone can check a printed copy on the website's verify page.",
        "ทุก PDF มีรหัสตรวจสอบและ QR ชื่อผู้สร้างและเวลา คำอธิบายการใช้งาน และข้อความทางกฎหมาย ทุกครั้งที่ดาวน์โหลดจะถูกบันทึก และตรวจสอบฉบับพิมพ์ได้ที่หน้า verify ของเว็บไซต์") + ' <a href="../pages/verify.html" target="_blank" rel="noopener">' + L("Verify page ↗", "หน้าตรวจสอบ ↗") + '</a></p><div data-docs><p class="muted">' + L("Loading…", "กำลังโหลด…") + "</p></div>",
      after: drawDocs };
  };
  function drawDocs() {
    A.api("GET", "doc/list").then(function (d) {
      var el = $("[data-docs]"); if (!el) return;
      el.innerHTML = d.items.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>' + L("Code", "รหัส") + "</th><th>" + L("Document", "เอกสาร") + "</th><th>" + L("Created", "สร้างเมื่อ") + "</th><th>" + L("Log", "บันทึก") + "</th><th></th></tr></thead><tbody>" +
        d.items.map(function (x) {
          var dl = x.log.filter(function (l) { return l.action !== "created"; }).length;
          return '<tr><td class="mono">' + esc(x.code) + (x.revoked ? '<br><span class="badge badge--cancelled">' + L("Revoked", "ยกเลิกแล้ว") + "</span>" : "") + "</td><td>" + esc(x.title) + '<br><small class="muted">' + (x.kind === "paper" ? L("Test paper", "ชุดข้อสอบ") : L("Score report", "รายงานผลสอบ")) + "</small></td>" +
            '<td class="nowrap">' + esc(when(x.created_at)) + '<br><small class="muted">' + esc(x.created_by_name || "") + " (" + esc(x.role || "") + ")</small></td>" +
            '<td><details><summary>' + dl + L(" downloads / prints", " ครั้งที่ดาวน์โหลด/พิมพ์") + "</summary><ul class=\"blog-hist\">" + x.log.map(function (l) { return "<li>" + esc(when(l.at)) + " — " + esc(l.user_name || "") + " · " + esc(l.action) + "</li>"; }).join("") + "</ul></details></td>" +
            '<td class="nowrap">' + (x.revoked ? "" : '<button class="btn btn--sm" data-redl="' + esc(x.code) + '">' + L("Download again", "ดาวน์โหลดอีกครั้ง") + "</button>") + (A.isAdmin() ? '<button class="btn btn--sm" data-revoke="' + esc(x.code) + '" data-on="' + (x.revoked ? 0 : 1) + '">' + (x.revoked ? L("Restore", "คืนสถานะ") : L("Revoke", "ยกเลิก")) + "</button>" : "") + "</td></tr>";
        }).join("") + "</tbody></table></div>" : A.empty("No PDF documents yet.", "ยังไม่มีเอกสาร PDF", '<button class="btn btn--primary" data-act="pdf-paper">+ ' + L("New test paper", "สร้างชุดข้อสอบ PDF") + "</button>");
      $$("[data-redl]", el).forEach(function (b) { b.addEventListener("click", function () { b.disabled = true; A.api("GET", "doc/get?code=" + encodeURIComponent(b.getAttribute("data-redl"))).then(function (p) { return window.DDPDF.save(p, A.api); }).then(drawDocs).catch(function (e) { A.toast(e.message, "err"); b.disabled = false; }); }); });
      $$("[data-revoke]", el).forEach(function (b) { b.addEventListener("click", function () { var on = b.getAttribute("data-on") === "1"; if (on && !confirm(L("Revoke this document? The verify page will show it as not valid.", "ยกเลิกเอกสารนี้? หน้าตรวจสอบจะแสดงว่าไม่ถูกต้อง"))) return; A.api("POST", "doc/revoke", { code: b.getAttribute("data-revoke"), revoke: on }).then(drawDocs); }); });
    }).catch(function (e) { A.toast(e.message, "err"); });
  }
  A.pdfPaper = function (preset) {
    bankData().then(function (b) {
      var ok = b.items.filter(function (i) { return i.status === "approved"; });
      var sets = ok.filter(function (i) { return i.kind === "ielts-r"; }), tasks = ok.filter(function (i) { return i.kind === "ielts-w"; });
      A.form({
        title: L("New test paper (PDF)", "สร้างชุดข้อสอบ PDF"),
        intro: esc(L("Only approved items. The paper is recorded with a verification code before it is drawn, so a later download is identical.", "ใช้เฉพาะข้อที่อนุมัติแล้ว ระบบบันทึกชุดข้อสอบพร้อมรหัสตรวจสอบก่อนสร้าง PDF ดาวน์โหลดภายหลังจะได้ชุดเดิมทุกครั้ง")),
        fields: [{ name: "kind", label: L("Type", "ประเภท"), type: "select", value: (preset && preset.kind) || "sat", options: [["sat", "SAT Reading & Writing"], ["ielts-r", "IELTS Academic Reading"], ["ielts-w", "IELTS Academic Writing"]] },
          { name: "title", label: L("Title", "ชื่อชุดข้อสอบ"), full: true },
          { name: "note", label: L("Class / note (printed)", "ห้อง / หมายเหตุ (พิมพ์บนเอกสาร)") }, { name: "minutes", label: L("Time allowed (minutes, optional)", "เวลาที่ให้ (นาที ไม่บังคับ)"), type: "number", min: 0 },
          { name: "domains", label: "SAT · " + L("topics (random approved questions)", "หัวข้อ (สุ่มจากข้อที่อนุมัติ)"), type: "checks", options: domOpts(b.domains), value: Object.keys(b.domains) },
          { name: "count", label: "SAT · " + L("number of questions", "จำนวนข้อ"), type: "number", min: 1, value: 10 },
          { name: "setId", label: "IELTS Reading · " + L("passage", "บทอ่าน"), type: "select", options: sets.length ? sets.map(function (s) { return [s.id, s.title]; }) : [["", "–"]] },
          { name: "tasks", label: "IELTS Writing · " + L("tasks", "โจทย์"), type: "checks", options: tasks.map(function (t) { return [t.id, "Task " + t.task + " · " + (t.prompt || "").slice(0, 60)]; }), value: tasks.slice(0, 2).map(function (t) { return t.id; }) },
          { name: "withKey", label: L("Teacher copy with answer key and explanations (marked TEACHER COPY on every page)", "ฉบับครู มีเฉลยและคำอธิบาย (ระบุ TEACHER COPY ทุกหน้า)"), type: "checkbox", full: true }],
        submit: L("Create & download PDF", "สร้างและดาวน์โหลด PDF"),
        onSave: function (v) {
          var body = { kind: v.kind, title: v.title, note: v.note, minutes: v.minutes || 0, withKey: v.withKey };
          if (v.kind === "sat") { body.domains = v.domains; body.count = v.count; } else if (v.kind === "ielts-r") body.itemIds = [v.setId]; else body.itemIds = v.tasks;
          return A.api("POST", "doc/paper", body).then(function (p) {
            A.toast(L("Creating PDF ", "กำลังสร้าง PDF ") + p.code + "…");
            return window.DDPDF.save(p, A.api).then(function () { A.toast(L("Downloaded ", "ดาวน์โหลดแล้ว ") + p.code); if (location.hash.indexOf("#/docs") === 0) drawDocs(); });
          }).catch(function (e) { A.toast(e.message, "err"); return false; });
        }
      });
    });
  };

  /* ================================================================ results & difficulty (item bank) */
  var FL = { "very-hard": ["very hard — check the key", "ยากมาก — ตรวจเฉลย"], "very-easy": ["too easy", "ง่ายเกินไป"], "weak-discrimination": ["weak discrimination", "แยกเด็กเก่ง/อ่อนได้ไม่ดี"] };
  var DN = { e: ["Easy", "ง่าย"], m: ["Medium", "กลาง"], h: ["Hard", "ยาก"] };
  function lvl(v) { return typeof v === "number" ? L("level ", "ระดับ ") + v : DN[v] ? L(DN[v][0], DN[v][1]) : v; }
  A.bankStats = function (el, after) {
    A.api("GET", "exam/stats").then(function (st) {
      var withData = Object.keys(st.items).filter(function (k) { return (st.items[k].n || 0) >= st.minN; }).length;
      var changes = Object.keys(st.items).filter(function (k) { return st.items[k].change; });
      var promos = Object.keys(st.items).filter(function (k) { return st.items[k].promote; });
      var box = document.createElement("section"); box.className = "box"; box.setAttribute("data-stats", "");
      box.innerHTML = "<h2>" + L("Results & difficulty", "ผลสอบจริงและระดับความยาก") + "</h2><p>" +
        L(st.responses + " answers from finished tests and live classes (staff previews are not counted). Suggestions appear once a question has at least ", "คำตอบ " + st.responses + " รายการจากการสอบและห้องเรียนสด (ไม่นับการทดลองของเจ้าหน้าที่) ระบบจะเสนอระดับเมื่อแต่ละข้อมีคำตอบอย่างน้อย ") + "<b>" + st.minN + "</b>" + L(" answers.", " คำตอบ") +
        (A.isAdmin() ? ' <button class="btn btn--xs" data-minn>' + L("Change", "เปลี่ยน") + "</button>" : "") + "<br>" +
        L(withData + " items have enough data · ", withData + " ข้อมีข้อมูลพอ · ") + "<b>" + changes.length + "</b>" + L(" difficulty changes suggested", " ข้อที่ควรปรับระดับ") + (promos.length ? " · " + promos.length + L(" pretest items ready to be scored", " ข้อ pretest พร้อมนับคะแนน") : "") + "</p>" +
        '<div class="btnrow">' + (changes.length ? '<button class="btn btn--primary" data-apply-all>' + L("Apply all suggestions", "ปรับตามคำแนะนำทั้งหมด") + "</button>" : "") + (promos.length ? '<button class="btn" data-promote>' + L("Score ready pretest items", "นับคะแนนข้อ pretest ที่พร้อม") + "</button>" : "") + "</div>" +
        '<small class="muted">' + L("p = share of learners who got it right (high = easy). r = discrimination: does the question separate stronger from weaker learners (aim for 0.2 or more)? Nothing changes until you apply it; every change is saved as a new version.", "p = สัดส่วนผู้ตอบถูก (สูง = ง่าย) r = ค่าอำนาจจำแนก ข้อนั้นแยกเด็กเก่งกับเด็กอ่อนได้หรือไม่ (ควร 0.2 ขึ้นไป) ระบบจะไม่เปลี่ยนจนกว่าครูกดยืนยัน และทุกการเปลี่ยนแปลงบันทึกเป็นเวอร์ชันใหม่") + "</small>";
      el.parentNode.insertBefore(box, el.nextSibling);
      // per-row chips
      $$("[data-item]").forEach(function (tr) {
        var s = st.items[tr.getAttribute("data-item")]; if (!s || !s.n) return;
        var td = tr.children[1], chip = document.createElement("div"); chip.className = "stat-chip";
        chip.innerHTML = "n=" + s.n + (s.p != null ? " · p=" + Math.round(s.p * 100) + "%" : "") + (s.r != null ? " · r=" + s.r : "") +
          (s.change ? ' · <b>' + L("suggest ", "แนะนำ ") + esc(lvl(s.suggest)) + '</b> <button class="btn btn--xs" data-apply="' + esc(tr.getAttribute("data-item")) + '">' + L("Apply", "ปรับ") + "</button>" : "") +
          (s.flags && s.flags.length ? ' <span class="warn-text">⚠ ' + s.flags.map(function (f) { return esc(L(FL[f][0], FL[f][1])); }).join(", ") + "</span>" : "");
        td.appendChild(chip);
      });
      function apply(body) { return A.api("POST", "exam/calibrate", body).then(function (r) { A.toast(L(r.changed + " item(s) updated", "ปรับแล้ว " + r.changed + " ข้อ")); after(); }).catch(function (e) { A.toast(e.message, "err"); }); }
      $$("[data-apply]").forEach(function (b) { b.addEventListener("click", function (e) { e.stopPropagation(); apply({ ids: [b.getAttribute("data-apply")] }); }); });
      var all = $("[data-apply-all]", box); if (all) all.addEventListener("click", function () { if (confirm(L("Apply " + changes.length + " suggested difficulty changes?", "ปรับระดับความยาก " + changes.length + " ข้อตามคำแนะนำ?"))) apply({ all: true }); });
      var pr = $("[data-promote]", box); if (pr) pr.addEventListener("click", function () { apply({ ids: promos, promote: true }); });
      var mn = $("[data-minn]", box); if (mn) mn.addEventListener("click", function () {
        A.form({ title: L("Minimum answers per question", "จำนวนคำตอบขั้นต่ำต่อข้อ"), intro: esc(L("20–30 is a sensible minimum for real decisions. Use a small number (e.g. 3) only to try the feature.", "ควรใช้ 20–30 สำหรับการตัดสินใจจริง ตั้งค่าน้อย (เช่น 3) เฉพาะเมื่อต้องการทดลองระบบ")),
          fields: [{ name: "minN", label: L("Minimum", "ขั้นต่ำ"), type: "number", min: 3, value: st.minN }],
          onSave: function (v) { return A.api("POST", "exam/calibrate", { minN: v.minN }).then(after).catch(function (e) { A.toast(e.message, "err"); return false; }); } });
      });
    }).catch(function () {});
  };

  var prev = A.onAct;
  A.onAct = function (a, b, ev) {
    if (a === "live-new") A.startLive();
    else if (a === "set-new") editSet(null);
    else if (a === "pdf-paper") A.pdfPaper();
    else if (prev) prev(a, b, ev);
  };
})();
