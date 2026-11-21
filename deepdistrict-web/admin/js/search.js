/* ==========================================================================
   DeepDistrict back office — search everything, then export the results
   (CSV, PDF, PNG, print or email) as a branded, stamped document.
   ========================================================================== */
(function () {
  "use strict";
  var A = window.DDA, L = A.L, esc = A.esc;

  function has(hay, q) { return !q || String(hay).toLowerCase().indexOf(q) !== -1; }
  function inRange(d, from, to) { return (!from || d >= from) && (!to || d <= to); }

  A.pages.search = function (q) {
    var text = (q.get("q") || "").trim().toLowerCase(), type = q.get("type") || "all", from = q.get("from") || "", to = q.get("to") || "";
    var teacher = q.get("teacher") || "", student = q.get("student") || "", status = q.get("status") || "";
    var enrIds = A.visibleEnrolments().filter(function (e) { return (!teacher || e.teacherId === teacher) && (!student || e.studentId === student); }).map(function (e) { return e.id; });
    var groups = [];

    if (type === "all" || type === "lessons") {
      var lessons = A.db.sessions.filter(function (s) {
        var e = A.byId("enrolments", s.enrolmentId);
        return enrIds.indexOf(s.enrolmentId) !== -1 && inRange(s.date, from, to) && (!status || s.status === status) &&
          has([s.topic, s.notes, s.location, s.reason, e.courseCode, A.userName(e.studentId), A.userName(s.teacherId || e.teacherId)].join(" "), text);
      }).sort(function (a, b) { return (a.date + a.start).localeCompare(b.date + b.start); });
      var hrs = lessons.reduce(function (t, s) { return t + (A.counts(s) ? +s.hours || 0 : 0); }, 0);
      groups.push({ key: "lessons", title: L("Lessons", "คาบเรียน") + " (" + lessons.length + " · " + L("hours learned ", "ชั่วโมงที่เรียน ") + A.num(hrs) + ")",
        head: [L("Date", "วันที่"), L("Time", "เวลา"), L("Learner · course", "ผู้เรียน · หลักสูตร"), L("Teacher", "ครู"), L("Where", "สถานที่"), L("Status", "สถานะ"), L("What was learned", "สิ่งที่เรียน")],
        rows: lessons.map(function (s) { var e = A.byId("enrolments", s.enrolmentId); return { id: s.id, attr: "data-session", cells: [A.fmtDate(s.date), A.span(s), A.userName(e.studentId) + " · " + e.courseCode, A.userName(s.teacherId || e.teacherId), A.modeName(s.mode) + (s.location ? " · " + s.location : ""), A.statusName(s.status), [s.topic, s.notes].filter(Boolean).join(" — ")] }; }) });
    }
    if (type === "all" || type === "enrolments") {
      var enrs = A.visibleEnrolments().filter(function (e) {
        return enrIds.indexOf(e.id) !== -1 && (!status || e.status === status) && inRange(e.start, from, to) && has([e.courseCode, A.courseName(e.courseCode), A.userName(e.studentId), A.userName(e.teacherId), e.goal].join(" "), text);
      });
      groups.push({ key: "enrolments", title: L("Enrolments", "การลงทะเบียน") + " (" + enrs.length + ")",
        head: [L("Learner", "ผู้เรียน"), L("Course", "หลักสูตร"), L("Teacher", "ครู"), L("Regular time", "เวลาเรียนปกติ"), L("Total", "ทั้งหมด"), L("Learned", "เรียนแล้ว"), L("Remaining", "คงเหลือ"), L("To schedule", "ยังต้องนัด")].concat(A.isAdmin() ? [L("Balance", "คงค้าง")] : []),
        rows: enrs.map(function (e) { var st = A.stats(e); return { id: e.id, attr: "data-enrolment", cells: [A.userName(e.studentId), e.courseCode, A.userName(e.teacherId), A.patternText(e.pattern), A.num(st.total), A.num(st.used), A.num(st.remaining), A.num(st.unscheduled)].concat(A.isAdmin() ? [A.money(st.balance)] : []) }; }) });
    }
    if ((type === "all" || type === "people") && !teacher && !student) {
      var people = A.db.users.filter(function (u) { return u.id !== A.me.id && has([u.name, u.nick, u.email, u.phone, u.school, u.grade, u.notes].join(" "), text) && (!from && !to || inRange((u.createdAt || "").slice(0, 10), from, to)); });
      groups.push({ key: "people", title: L("People", "บุคคล") + " (" + people.length + ")", head: [L("Name", "ชื่อ"), L("Role", "บทบาท"), L("Email", "อีเมล"), L("Phone", "โทรศัพท์"), L("School", "โรงเรียน")],
        rows: people.map(function (u) { return { id: u.id, attr: "data-person", cells: [u.name + (u.nick ? " (" + u.nick + ")" : ""), A.roleName(u.role), u.email || "", u.phone || "", [u.school, u.grade].filter(Boolean).join(" · ")] }; }) });
    }
    if ((type === "all" || type === "payments") && A.isAdmin()) {
      var pays = A.db.payments.filter(function (p) { var e = A.byId("enrolments", p.enrolmentId) || {}; return enrIds.indexOf(p.enrolmentId) !== -1 && inRange(p.date, from, to) && has([p.ref, p.note, p.method, A.userName(e.studentId), e.courseCode].join(" "), text); });
      var sum = pays.reduce(function (t, p) { return t + (+p.amount || 0); }, 0);
      groups.push({ key: "payments", title: L("Payments", "การชำระเงิน") + " (" + pays.length + " · " + A.money(sum) + ")", head: [L("Date", "วันที่"), L("Receipt no.", "เลขที่ใบเสร็จ"), L("Learner · course", "ผู้เรียน · หลักสูตร"), L("Method", "ช่องทาง"), L("Amount", "จำนวนเงิน")],
        rows: pays.map(function (p) { var e = A.byId("enrolments", p.enrolmentId) || {}; return { id: p.id, attr: "data-payment", cells: [A.fmtDate(p.date), p.ref || "", A.userName(e.studentId) + " · " + (e.courseCode || ""), A.methodName(p.method), A.money(p.amount)] }; }) });
    }
    if (type === "all" || type === "requests") {
      var reqs = (A.db.requests || []).filter(function (r) { return enrIds.indexOf(r.enrolmentId) !== -1 && inRange((r.createdAt || "").slice(0, 10), from, to) && (!status || r.status === status) && has([r.note, r.reply, r.resultText, r.type, A.userName(r.createdBy)].join(" "), text); });
      groups.push({ key: "requests", title: L("Change requests", "คำขอเปลี่ยนแปลง") + " (" + reqs.length + ")", head: [L("Sent", "วันที่ส่ง"), L("Learner", "ผู้เรียน"), L("Request", "คำขอ"), L("Status", "สถานะ"), L("Result", "ผล")],
        rows: reqs.map(function (r) { var e = A.byId("enrolments", r.enrolmentId) || {}; return { id: r.id, cells: [(r.createdAt || "").slice(0, 10), A.userName(e.studentId), A.reqTypeName(r.type) + (r.note ? " — " + r.note : ""), r.status, r.resultText || r.reply || ""] }; }) });
    }
    A._search = groups; A._report = null; A._docBase = "search-" + A.today();

    var STATUS_OPTS = Object.keys(A.STATUS).map(function (k) { return [k, A.statusName(k)]; }).concat(Object.keys(A.ENR_STATUS).filter(function (k) { return !A.STATUS[k]; }).map(function (k) { return [k, A.enrStatusName(k)]; })).concat([["pending", L("Waiting", "รอพิจารณา")], ["approved", L("Approved", "อนุมัติแล้ว")], ["declined", L("Declined", "ไม่อนุมัติ")]]);
    var html = '<form class="filters filters--search" data-filters>' +
      '<label class="grow">' + L("Search", "ค้นหา") + '<input type="search" name="q" value="' + esc(q.get("q") || "") + '" placeholder="' + esc(L("name, course, topic, receipt no., room…", "ชื่อ หลักสูตร หัวข้อ เลขที่ใบเสร็จ ห้อง…")) + '"></label>' +
      "<label>" + L("In", "ค้นใน") + '<select name="type">' + A.opts([["all", L("Everything", "ทั้งหมด")], ["lessons", L("Lessons", "คาบเรียน")], ["enrolments", L("Enrolments", "การลงทะเบียน")], ["people", L("People", "บุคคล")]].concat(A.isAdmin() ? [["payments", L("Payments", "การชำระเงิน")]] : []).concat([["requests", L("Requests", "คำขอ")]]), type) + "</select></label>" +
      "<label>" + L("From", "ตั้งแต่") + '<input type="date" name="from" value="' + esc(from) + '"></label><label>' + L("To", "ถึง") + '<input type="date" name="to" value="' + esc(to) + '"></label>' +
      (A.isAdmin() ? "<label>" + L("Teacher", "ครู") + '<select name="teacher">' + A.opts(A.peopleOpts("staff"), teacher, L("All", "ทั้งหมด")) + "</select></label>" : "") +
      "<label>" + L("Learner", "ผู้เรียน") + '<select name="student">' + A.opts(A.peopleOpts("student"), student, L("All", "ทั้งหมด")) + "</select></label>" +
      "<label>" + L("Status", "สถานะ") + '<select name="status">' + A.opts(STATUS_OPTS, status, L("Any", "ทุกสถานะ")) + "</select></label></form>" +
      A.exportBar('<button class="btn" data-act="search-csv">CSV / Excel</button>') +
      '<div class="report report--wide report--inline" id="report">' + A.docHead(L("Search results", "ผลการค้นหา"), esc([q.get("q") ? "“" + q.get("q") + "”" : "", from || to ? (from || "…") + " – " + (to || "…") : "", teacher ? A.userName(teacher) : "", student ? A.userName(student) : ""].filter(Boolean).join(" · ")), "", "") +
      groups.map(function (g) {
        return '<h2 class="rp-h2">' + esc(g.title) + "</h2>" + (g.rows.length ? '<table class="rp-tbl"><thead><tr>' + g.head.map(function (h) { return "<th>" + esc(h) + "</th>"; }).join("") + "</tr></thead><tbody>" +
          g.rows.slice(0, 500).map(function (r) { return "<tr" + (r.attr ? " " + r.attr + '="' + r.id + '" class="rp-click"' : "") + ">" + r.cells.map(function (c) { return "<td>" + esc(c) + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table>" : '<p class="rp-small">' + L("Nothing found.", "ไม่พบข้อมูล") + "</p>");
      }).join("") + A.docFoot(A.today()) + "</div>";
    return { title: L("Search", "ค้นหา"), html: html };
  };

  var prev = A.onAct;
  A.onAct = function (act, b, ev) {
    if (act === "search-csv") {
      var rows = [];
      (A._search || []).forEach(function (g) { rows.push([g.title]); rows.push(g.head); g.rows.forEach(function (r) { rows.push(r.cells); }); rows.push([]); });
      return A.download("search-" + A.today() + ".csv", A.csv(rows), "text/csv;charset=utf-8");
    }
    if (prev) prev(act, b, ev);
  };
})();
