/* ==========================================================================
   DeepDistrict back office — learner reports and exports
   (PDF, PNG image, plain text, CSV, print) plus an all-students summary.
   ========================================================================== */
(function () {
  "use strict";
  var A = window.DDA, L = A.L, esc = A.esc, $ = A.$;

  function scope(studentId, enrId) {
    return A.visibleEnrolments().filter(function (e) { return e.studentId === studentId && (!enrId || e.id === enrId); });
  }
  function inRange(d, from, to) { return (!from || d >= from) && (!to || d <= to); }

  /* Build a data model once, then render it as HTML or text. */
  function model(q) {
    var stu = A.byId("users", q.get("student"));
    if (!stu) return null;
    var from = q.get("from") || "", to = q.get("to") || "", fees = (A.isAdmin() || !A.isStaff()) && q.get("fees") !== "0";
    var enrs = scope(stu.id, q.get("enrolment")).map(function (e) {
      var st = A.stats(e);
      var done = st.sessions.filter(function (s) { return A.counts(s) && inRange(s.date, from, to); });
      var upcoming = st.sessions.filter(function (s) { return s.status === "scheduled" && s.date >= A.today(); }).slice(0, 6);
      var pays = A.paymentsOf(e.id).filter(function (p) { return inRange(p.date, from, to); });
      var moved = st.sessions.filter(function (s) { return (s.status === "rescheduled" || s.status === "cancelled" || s.makeUpFor || s.extraHours) && inRange(s.date, from, to); });
      return { e: e, st: st, done: done, upcoming: upcoming, pays: pays, moved: moved, periodHours: done.reduce(function (t, s) { return t + (+s.hours || 0); }, 0) };
    });
    return { stu: stu, guardian: A.byId("users", stu.guardianId), from: from, to: to, fees: fees, enrs: enrs, issued: A.today() };
  }

  function reportHTML(m) {
    var o = A.db.org;
    var period = m.from || m.to ? A.fmtDate(m.from) + " – " + A.fmtDate(m.to || A.today()) : L("All time", "ตั้งแต่เริ่มเรียน");
    var h = '<article class="report" id="report">' +
      '<header class="rp-head"><img src="../assets/images/brand/logo-horizontal.png" alt="DeepDistrict"><div><strong>' + esc(o.name) + "</strong><br>" + esc(o.address) + "<br>" + esc([o.email, o.phone].filter(Boolean).join(" · ")) + "</div></header>" +
      '<h1 class="rp-title">' + L("Learning progress report", "รายงานความก้าวหน้าการเรียน") + "</h1>" +
      '<dl class="rp-meta"><div><dt>' + L("Learner", "ผู้เรียน") + "</dt><dd>" + esc(m.stu.name) + (m.stu.nick ? " (" + esc(m.stu.nick) + ")" : "") + "</dd></div>" +
      (m.stu.school || m.stu.grade ? "<div><dt>" + L("School / grade", "โรงเรียน / ชั้น") + "</dt><dd>" + esc([m.stu.school, m.stu.grade].filter(Boolean).join(" · ")) + "</dd></div>" : "") +
      (m.guardian ? "<div><dt>" + L("Parent / guardian", "ผู้ปกครอง") + "</dt><dd>" + esc(m.guardian.name) + "</dd></div>" : "") +
      "<div><dt>" + L("Period", "ช่วงเวลา") + "</dt><dd>" + esc(period) + "</dd></div><div><dt>" + L("Issued", "วันที่ออกรายงาน") + "</dt><dd>" + esc(A.fmtDate(m.issued)) + "</dd></div></dl>";
    if (!m.enrs.length) h += '<p class="rp-empty">' + L("No enrolments for this learner yet.", "ผู้เรียนยังไม่มีการลงทะเบียน") + "</p>";
    m.enrs.forEach(function (x) {
      var e = x.e, st = x.st;
      h += '<section class="rp-course"><h2>' + esc(A.courseName(e.courseCode)) + "</h2>" +
        '<p class="rp-sub">' + L("Teacher: ", "ครูผู้สอน: ") + esc(A.userName(e.teacherId)) + " · " + L("started ", "เริ่ม ") + esc(A.fmtDate(e.start)) + " · " + esc(A.enrStatusName(e.status)) + "</p>" +
        '<div class="rp-stats"><div><span>' + L("Hours purchased", "ชั่วโมงที่ซื้อ") + "</span><b>" + A.num(st.total) + "</b></div><div><span>" + L("Hours learned", "ชั่วโมงที่เรียนแล้ว") + "</span><b>" + A.num(st.used) + "</b></div>" +
        '<div class="rp-hi"><span>' + L("Hours remaining", "ชั่วโมงคงเหลือ") + "</span><b>" + A.num(st.remaining) + "</b></div><div><span>" + L("Booked ahead", "นัดไว้แล้ว") + "</span><b>" + A.num(st.planned) + "</b></div>" +
        (st.unscheduled > 0.001 && st.used + st.planned > 0 ? '<div class="rp-due"><span>' + L("Still to book", "รอนัดเพิ่ม") + "</span><b>" + A.num(st.unscheduled) + "</b></div>" : "") + "</div>" +
        '<div class="rp-bar"><i style="width:' + st.pct + '%"></i></div><p class="rp-small">' + st.pct + "% " + L("of the package completed", "ของแพ็กเกจเรียนแล้ว") + (st.over ? " · " + L("over by ", "เกิน ") + A.hrs(st.over) : "") + "</p>" +
        (e.goal ? '<p class="rp-goal"><b>' + L("Goal: ", "เป้าหมาย: ") + "</b>" + esc(e.goal) + "</p>" : "") +
        "<h3>" + L("What was learned", "สิ่งที่ได้เรียน") + (m.from || m.to ? " · " + A.hrs(x.periodHours) + " " + L("in this period", "ในช่วงนี้") : "") + "</h3>" +
        (x.done.length ? '<table class="rp-tbl"><thead><tr><th>' + L("Date", "วันที่") + "</th><th>" + L("Hours", "ชม.") + "</th><th>" + L("Topics & notes", "หัวข้อและบันทึก") + "</th></tr></thead><tbody>" +
          x.done.map(function (s) { return "<tr><td>" + esc(A.fmtDate(s.date)) + "</td><td>" + A.num(s.hours) + (s.status === "noshow" ? "*" : "") + "</td><td>" + esc(s.topic || "–") + (s.notes ? '<br><span class="rp-note">' + esc(s.notes) + "</span>" : "") + "</td></tr>"; }).join("") + "</tbody></table>" +
          (x.done.some(function (s) { return s.status === "noshow"; }) ? '<p class="rp-small">* ' + L("Missed without notice; hours counted under the lab's policy.", "ขาดเรียนโดยไม่แจ้ง นับชั่วโมงตามนโยบายของแล็บ") + "</p>" : "")
          : '<p class="rp-small">' + L("No completed lessons in this period.", "ไม่มีคาบที่เรียนแล้วในช่วงนี้") + "</p>") +
        (x.upcoming.length ? "<h3>" + L("Next lessons", "คาบเรียนถัดไป") + '</h3><ul class="rp-next">' + x.upcoming.map(function (s) { return "<li>" + esc(A.fmtDate(s.date, { weekday: "short", day: "numeric", month: "short" })) + " · " + esc(s.start || "") + " · " + A.hrs(s.hours) + "</li>"; }).join("") + "</ul>" : "") +
        (x.moved.length ? "<h3>" + L("Schedule changes", "การเปลี่ยนแปลงตารางเรียน") + '</h3><ul class="rp-next">' + x.moved.map(function (s) { return "<li>" + esc(A.fmtDate(s.date)) + " · " + A.statusName(s.status) + " · " + A.lessonNote(s).replace(/<br>/g, " · ") + "</li>"; }).join("") + "</ul>" : "") +
        (m.fees ? "<h3>" + L("Fees", "ค่าเรียน") + '</h3><div class="rp-stats rp-stats--3"><div><span>' + L("Course fee", "ค่าเรียนทั้งหมด") + "</span><b>" + A.money(st.fee) + "</b></div><div><span>" + L("Paid", "ชำระแล้ว") + "</span><b>" + A.money(st.paid) + '</b></div><div class="' + (st.balance > 0.009 ? "rp-due" : "rp-hi") + '"><span>' + L("Balance due", "ยอดคงค้าง") + "</span><b>" + A.money(Math.max(0, st.balance)) + "</b></div></div>" +
          (x.pays.length ? '<table class="rp-tbl"><thead><tr><th>' + L("Date", "วันที่") + "</th><th>" + L("Reference", "อ้างอิง") + "</th><th>" + L("Amount", "จำนวนเงิน") + "</th></tr></thead><tbody>" + x.pays.map(function (p) { return "<tr><td>" + esc(A.fmtDate(p.date)) + "</td><td>" + esc(p.ref || "") + "</td><td>" + A.money(p.amount) + "</td></tr>"; }).join("") + "</tbody></table>" : "") : "") +
        "</section>";
    });
    h += '<footer class="rp-foot">' + esc(o.name) + " · " + L("This report summarises lessons recorded by the lab. Please contact us if anything looks wrong.", "รายงานนี้สรุปจากบันทึกการสอนของแล็บ หากข้อมูลไม่ถูกต้องกรุณาติดต่อเรา") + "</footer></article>";
    return h;
  }

  function reportText(m) {
    var o = A.db.org, line = "────────────────────────────────────────", t = [];
    t.push(o.name, L("Learning progress report", "รายงานความก้าวหน้าการเรียน"), line);
    t.push(L("Learner: ", "ผู้เรียน: ") + m.stu.name + (m.stu.nick ? " (" + m.stu.nick + ")" : ""));
    if (m.guardian) t.push(L("Parent / guardian: ", "ผู้ปกครอง: ") + m.guardian.name);
    t.push(L("Period: ", "ช่วงเวลา: ") + (m.from || m.to ? (m.from || "…") + " – " + (m.to || A.today()) : L("all time", "ตั้งแต่เริ่มเรียน")), L("Issued: ", "ออกรายงาน: ") + m.issued, "");
    m.enrs.forEach(function (x) {
      var st = x.st;
      t.push(line, A.courseName(x.e.courseCode), L("Teacher: ", "ครู: ") + A.userName(x.e.teacherId), "");
      t.push(L("Hours purchased : ", "ชั่วโมงที่ซื้อ     : ") + A.num(st.total), L("Hours learned   : ", "ชั่วโมงที่เรียนแล้ว : ") + A.num(st.used) + "  (" + st.pct + "%)", L("Hours remaining : ", "ชั่วโมงคงเหลือ    : ") + A.num(st.remaining), L("Booked ahead    : ", "นัดไว้แล้ว       : ") + A.num(st.planned), "");
      t.push(L("What was learned:", "สิ่งที่ได้เรียน:"));
      x.done.forEach(function (s) { t.push("  " + s.date + "  " + A.num(s.hours) + "h  " + (s.status === "noshow" ? "[" + A.statusName("noshow") + "] " : "") + (s.topic || "-") + (s.notes ? "  — " + s.notes : "")); });
      if (!x.done.length) t.push("  –");
      if (st.unscheduled > 0.001 && st.used + st.planned > 0) t.push(L("Still to book    : ", "รอนัดเพิ่ม        : ") + A.num(st.unscheduled));
      if (x.moved.length) { t.push("", L("Schedule changes:", "การเปลี่ยนแปลงตารางเรียน:")); x.moved.forEach(function (s) { t.push("  " + s.date + "  " + A.statusName(s.status) + "  " + A.lessonNote(s).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()); }); }
      if (x.upcoming.length) { t.push("", L("Next lessons:", "คาบเรียนถัดไป:")); x.upcoming.forEach(function (s) { t.push("  " + s.date + " " + (s.start || "") + "  " + A.num(s.hours) + "h"); }); }
      if (m.fees) t.push("", L("Fee: ", "ค่าเรียน: ") + A.money(st.fee) + " · " + L("Paid: ", "ชำระแล้ว: ") + A.money(st.paid) + " · " + L("Balance: ", "คงค้าง: ") + A.money(Math.max(0, st.balance)));
      t.push("");
    });
    t.push(line, o.email || "");
    return t.join("\n");
  }

  function reportCSV(m) {
    var rows = [["student", "course", "date", "start", "hours", "status", "topic", "notes"]];
    m.enrs.forEach(function (x) { x.st.sessions.filter(function (s) { return inRange(s.date, m.from, m.to); }).forEach(function (s) { rows.push([m.stu.name, x.e.courseCode, s.date, s.start, s.hours, s.status, s.topic, s.notes]); }); });
    return A.csv(rows);
  }

  function summaryRows() {
    var rows = [[L("Student", "นักเรียน"), L("Course", "หลักสูตร"), L("Teacher", "ครู"), L("Status", "สถานะ"), L("Purchased h", "ชม. ที่ซื้อ"), L("Used h", "ชม. ที่ใช้"), L("Remaining h", "ชม. คงเหลือ"), L("Booked h", "ชม. ที่นัด")].concat(A.isAdmin() ? [L("Fee", "ค่าเรียน"), L("Paid", "ชำระแล้ว"), L("Balance", "คงค้าง")] : [])];
    A.visibleEnrolments().forEach(function (e) {
      var st = A.stats(e);
      rows.push([A.userName(e.studentId), e.courseCode, A.userName(e.teacherId), A.enrStatusName(e.status), st.total, st.used, st.remaining, st.planned].concat(A.isAdmin() ? [st.fee, st.paid, st.balance] : []));
    });
    return rows;
  }

  A.pages.reports = function (q) {
    var type = q.get("type") || "student", sid = q.get("student") || "";
    var students = A.people("student").filter(function (s) { return A.isAdmin() || A.visibleEnrolments().some(function (e) { return e.studentId === s.id; }); });
    var tabs = '<div class="tabs"><a class="tab' + (type === "student" ? " is-on" : "") + '" href="#/reports?type=student' + (sid ? "&student=" + sid : "") + '">' + L("Learner report", "รายงานรายบุคคล") + '</a><a class="tab' + (type === "summary" ? " is-on" : "") + '" href="#/reports?type=summary">' + L("All learners summary", "สรุปผู้เรียนทั้งหมด") + "</a></div>";
    if (type === "summary") {
      var rows = summaryRows();
      A._summary = rows;
      return { title: L("Reports & export", "รายงานและส่งออก"), html: tabs +
        '<div class="btnrow"><button class="btn btn--primary" data-act="sum-csv">CSV / Excel</button><button class="btn" data-act="sum-txt">TXT</button><button class="btn" data-act="sum-pdf">PDF</button><button class="btn" data-act="sum-png">PNG</button><button class="btn" data-act="print">' + L("Print", "พิมพ์") + "</button></div>" +
        '<div class="report report--wide" id="report"><h1 class="rp-title">' + L("Learners summary", "สรุปผู้เรียนทั้งหมด") + " · " + esc(A.fmtDate(A.today())) + "</h1>" +
        '<table class="rp-tbl"><thead><tr>' + rows[0].map(function (h) { return "<th>" + esc(h) + "</th>"; }).join("") + "</tr></thead><tbody>" +
        rows.slice(1).map(function (r) { return "<tr>" + r.map(function (c, i) { return "<td>" + (i >= 4 && typeof c === "number" ? (i >= 8 ? A.money(c) : A.num(c)) : esc(c)) + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table></div>" };
    }
    var m = sid ? model(q) : null;
    A._report = m;
    var form = '<form class="filters" data-filters><input type="hidden" name="type" value="student">' +
      "<label>" + L("Learner", "ผู้เรียน") + '<select name="student">' + A.opts(students.map(function (s) { return [s.id, s.name + (s.nick ? " (" + s.nick + ")" : "")]; }), sid, L("Choose…", "เลือก…")) + "</select></label>" +
      (sid ? "<label>" + L("Course", "หลักสูตร") + '<select name="enrolment">' + A.opts(scope(sid).map(function (e) { return [e.id, A.courseName(e.courseCode)]; }), q.get("enrolment"), L("All courses", "ทุกหลักสูตร")) + "</select></label>" : "") +
      "<label>" + L("From", "ตั้งแต่") + '<input type="date" name="from" value="' + esc(q.get("from") || "") + '"></label><label>' + L("To", "ถึง") + '<input type="date" name="to" value="' + esc(q.get("to") || "") + '"></label>' +
      (A.isAdmin() || !A.isStaff() ? "<label>" + L("Fees", "ค่าเรียน") + '<select name="fees">' + A.opts([["1", L("Show", "แสดง")], ["0", L("Hide", "ซ่อน")]], q.get("fees") || "1") + "</select></label>" : "") + "</form>";
    var html = tabs + form + (m ? '<div class="btnrow export"><span class="muted">' + L("Export:", "ส่งออก:") + '</span><button class="btn btn--primary" data-act="rp-pdf">PDF</button><button class="btn" data-act="rp-png">' + L("Image (PNG)", "รูปภาพ (PNG)") + '</button><button class="btn" data-act="rp-txt">' + L("Text (TXT)", "ข้อความ (TXT)") + '</button><button class="btn" data-act="rp-csv">CSV</button><button class="btn" data-act="print">' + L("Print", "พิมพ์") + "</button></div>" + reportHTML(m)
      : A.empty("Choose a learner to see their report: lessons learned, hours used and left, upcoming lessons and fees.", "เลือกผู้เรียนเพื่อดูรายงาน: สิ่งที่เรียน ชั่วโมงที่ใช้และคงเหลือ คาบถัดไป และค่าเรียน"));
    return { title: L("Reports & export", "รายงานและส่งออก"), html: html };
  };

  /* ------------------------------------------------------------ exporters */
  function fileBase() { return A._report ? "report-" + A.slug(A._report.stu.nick || A._report.stu.name) + "-" + A.today() : "summary-" + A.today(); }
  function canvasOf(el) {
    if (!window.html2canvas) { A.toast(L("Export library missing (admin/vendor).", "ไม่พบไลบรารีสำหรับส่งออก (admin/vendor)"), "err"); return Promise.reject(); }
    document.body.classList.add("is-exporting");
    return document.fonts.ready.then(function () { return html2canvas(el, { scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false,
      // opened as a file, images would block the export, so leave the logo out
      ignoreElements: function (n) { return location.protocol === "file:" && n.tagName === "IMG"; } }); })
      .finally(function () { document.body.classList.remove("is-exporting"); });
  }
  function toPNG() {
    var el = $("#report"); if (!el) return;
    canvasOf(el).then(function (c) { c.toBlob(function (b) { A.download(fileBase() + ".png", b); }, "image/png"); }).catch(function (e) { if (e) A.toast(L("Export failed. Open the back office through http://localhost (start.sh) rather than as a file, then try again.", "ส่งออกไม่สำเร็จ กรุณาเปิดระบบผ่าน http://localhost (start.sh) แทนการเปิดไฟล์โดยตรง แล้วลองใหม่"), "err"); });
  }
  function toPDF() {
    var el = $("#report"); if (!el) return;
    if (!window.jspdf) return A.toast(L("Export library missing (admin/vendor).", "ไม่พบไลบรารีสำหรับส่งออก (admin/vendor)"), "err");
    canvasOf(el).then(function (c) {
      var wide = el.classList.contains("report--wide");
      var pdf = new window.jspdf.jsPDF({ orientation: wide ? "landscape" : "portrait", unit: "mm", format: "a4" });
      var pw = pdf.internal.pageSize.getWidth(), ph = pdf.internal.pageSize.getHeight(), margin = 10;
      var iw = pw - margin * 2, scale = iw / c.width, pageH = Math.floor((ph - margin * 2) / scale);
      for (var y = 0, page = 0; y < c.height; y += pageH, page++) {
        var h = Math.min(pageH, c.height - y), part = document.createElement("canvas");
        part.width = c.width; part.height = h;
        part.getContext("2d").drawImage(c, 0, y, c.width, h, 0, 0, c.width, h);
        if (page) pdf.addPage();
        pdf.addImage(part.toDataURL("image/jpeg", 0.92), "JPEG", margin, margin, iw, h * scale);
      }
      pdf.save(fileBase() + ".pdf");
      A.logAct("Exported PDF " + fileBase()); A.save();
    }).catch(function (e) { if (e) A.toast(L("Export failed. Open the back office through http://localhost (start.sh) rather than as a file, then try again.", "ส่งออกไม่สำเร็จ กรุณาเปิดระบบผ่าน http://localhost (start.sh) แทนการเปิดไฟล์โดยตรง แล้วลองใหม่"), "err"); });
  }
  var prev = A.onAct;
  A.onAct = function (act, b, ev) {
    if (act === "rp-pdf" || act === "sum-pdf") return toPDF();
    if (act === "rp-png" || act === "sum-png") return toPNG();
    if (act === "rp-txt" && A._report) return A.download(fileBase() + ".txt", reportText(A._report));
    if (act === "rp-csv" && A._report) return A.download(fileBase() + ".csv", reportCSV(A._report), "text/csv;charset=utf-8");
    if (act === "sum-csv") return A.download(fileBase() + ".csv", A.csv(A._summary), "text/csv;charset=utf-8");
    if (act === "sum-txt") return A.download(fileBase() + ".txt", A._summary.map(function (r) { return r.join("\t"); }).join("\n"));
    if (act === "print") return window.print();
    if (prev) prev(act, b, ev);
  };
  A.reportText = reportText; A.reportModel = model;
})();
