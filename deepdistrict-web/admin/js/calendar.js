/* ==========================================================================
   DeepDistrict back office — calendar (month / week / list) and .ics export,
   plus demo data for trying the system.
   ========================================================================== */
(function () {
  "use strict";
  var A = window.DDA, L = A.L, esc = A.esc;

  function visibleSessions(q) {
    var ids = A.visibleEnrolments().map(function (e) { return e.id; });
    var teacher = q.get("teacher") || "", student = q.get("student") || "";
    return A.db.sessions.filter(function (s) {
      if (ids.indexOf(s.enrolmentId) === -1) return false;
      var e = A.byId("enrolments", s.enrolmentId);
      if (teacher && (s.teacherId || e.teacherId) !== teacher) return false;
      if (student && e.studentId !== student) return false;
      return true;
    });
  }
  function chip(s) {
    var e = A.byId("enrolments", s.enrolmentId), u = A.byId("users", e.studentId) || {};
    return '<button type="button" class="ev ev--' + s.status + '" data-session="' + s.id + '" title="' + esc(A.enrolmentLabel(e) + " · " + A.statusName(s.status) + (s.topic ? " · " + s.topic : "")) + '">' +
      "<b>" + esc(s.start || "") + "</b> " + esc(u.nick || (u.name || "").split(" ")[0]) + ' <span>' + esc(e.courseCode) + "</span></button>";
  }

  A.pages.calendar = function (q) {
    var view = q.get("view") || (window.innerWidth < 760 ? "list" : "month");
    var cur = q.get("d") ? A.parse(q.get("d")) : new Date();
    var all = visibleSessions(q), byDate = {};
    all.forEach(function (s) { (byDate[s.date] = byDate[s.date] || []).push(s); });
    Object.keys(byDate).forEach(function (k) { byDate[k].sort(function (a, b) { return (a.start || "").localeCompare(b.start || ""); }); });
    var payDates = {};
    if (A.isAdmin()) A.db.payments.forEach(function (p) { payDates[p.date] = (payDates[p.date] || 0) + (+p.amount || 0); });
    var today = A.today(), html = "", label = "", prev, next;
    var loc = A.lang === "th" ? "th-TH" : "en-GB";

    if (view === "month") {
      var first = new Date(cur.getFullYear(), cur.getMonth(), 1);
      var start = new Date(first); start.setDate(1 - ((first.getDay() + 6) % 7)); // weeks start Monday
      label = first.toLocaleDateString(loc, { month: "long", year: "numeric" });
      prev = A.iso(new Date(cur.getFullYear(), cur.getMonth() - 1, 1)); next = A.iso(new Date(cur.getFullYear(), cur.getMonth() + 1, 1));
      html += '<div class="cal"><div class="cal__head">' + [1, 2, 3, 4, 5, 6, 0].map(function (d) { return "<span>" + esc(A.dayName(d)) + "</span>"; }).join("") + "</div><div class=\"cal__grid\">";
      for (var i = 0; i < 42; i++) {
        var d = new Date(start); d.setDate(start.getDate() + i);
        var ds = A.iso(d), list = byDate[ds] || [], out = d.getMonth() !== cur.getMonth();
        html += '<div class="cal__day' + (out ? " is-out" : "") + (ds === today ? " is-today" : "") + '" data-day="' + ds + '"><span class="cal__n">' + d.getDate() + "</span>" +
          (payDates[ds] ? '<span class="cal__pay" title="' + esc(L("Payments", "การชำระเงิน")) + '">฿ ' + A.num(payDates[ds], 0) + "</span>" : "") +
          list.slice(0, 4).map(chip).join("") + (list.length > 4 ? '<a class="cal__more" href="#/calendar?view=list&d=' + ds + '">+' + (list.length - 4) + "</a>" : "") + "</div>";
        if (i === 34 && new Date(start.getTime() + 35 * 864e5).getMonth() !== cur.getMonth()) break;
      }
      html += "</div></div>";
    } else if (view === "week") {
      var ws = new Date(cur); ws.setDate(cur.getDate() - ((cur.getDay() + 6) % 7));
      var we = new Date(ws); we.setDate(ws.getDate() + 6);
      label = ws.toLocaleDateString(loc, { day: "numeric", month: "short" }) + " – " + we.toLocaleDateString(loc, { day: "numeric", month: "short", year: "numeric" });
      prev = A.addDays(A.iso(ws), -7); next = A.addDays(A.iso(ws), 7);
      html += '<div class="week">';
      for (var j = 0; j < 7; j++) {
        var dd = new Date(ws); dd.setDate(ws.getDate() + j);
        var dk = A.iso(dd), ls = byDate[dk] || [];
        html += '<div class="week__col' + (dk === today ? " is-today" : "") + '" data-day="' + dk + '"><h3>' + esc(dd.toLocaleDateString(loc, { weekday: "short", day: "numeric" })) + "</h3>" +
          ls.map(function (s) {
            var e = A.byId("enrolments", s.enrolmentId);
            return '<button type="button" class="wev ev--' + s.status + '" data-session="' + s.id + '"><b>' + esc(s.start || "") + " · " + A.num(s.hours) + L("h", "ชม.") + "</b><span>" + esc(A.userName(e.studentId)) + "</span><small>" + esc(e.courseCode) + (s.topic ? " · " + esc(s.topic) : "") + "</small></button>";
          }).join("") + "</div>";
      }
      html += "</div>";
    } else {
      var from = q.get("d") || today, to = A.addDays(from, 30);
      label = A.fmtDate(from) + " – " + A.fmtDate(to);
      prev = A.addDays(from, -30); next = A.addDays(from, 30);
      var days = Object.keys(byDate).filter(function (k) { return k >= from && k <= to; }).sort();
      html += days.length ? '<div class="agenda">' + days.map(function (k) {
        return '<section><h3' + (k === today ? ' class="is-today"' : "") + ">" + esc(A.fmtDate(k, { weekday: "long", day: "numeric", month: "long" })) + "</h3>" + byDate[k].map(function (s) {
          var e = A.byId("enrolments", s.enrolmentId);
          return '<button type="button" class="aev" data-session="' + s.id + '"><span class="aev__t">' + esc(s.start || "") + "<small>" + A.hrs(s.hours) + "</small></span><span><b>" + esc(A.userName(e.studentId)) + "</b> · " + esc(A.courseName(e.courseCode)) + (s.topic ? "<br><span class=muted>" + esc(s.topic) + "</span>" : "") + "</span>" + A.badge(s.status) + "</button>";
        }).join("") + "</section>";
      }).join("") + "</div>" : A.empty("No lessons in this period.", "ไม่มีคาบเรียนในช่วงนี้");
    }

    function link(params) {
      var p = new URLSearchParams(q.toString());
      Object.keys(params).forEach(function (k) { if (params[k] == null) p.delete(k); else p.set(k, params[k]); });
      return "#/calendar?" + p.toString();
    }
    var bar = '<div class="calbar"><div class="btnrow"><a class="btn btn--sm" href="' + link({ d: prev }) + '" aria-label="Previous">‹</a><a class="btn btn--sm" href="' + link({ d: null }) + '">' + L("Today", "วันนี้") + '</a><a class="btn btn--sm" href="' + link({ d: next }) + '" aria-label="Next">›</a><strong class="calbar__label">' + esc(label) + "</strong></div>" +
      '<div class="seg">' + [["month", L("Month", "เดือน")], ["week", L("Week", "สัปดาห์")], ["list", L("List", "รายการ")]].map(function (v) { return '<a href="' + link({ view: v[0] }) + '"' + (v[0] === view ? ' aria-pressed="true"' : "") + ">" + v[1] + "</a>"; }).join("") + "</div>" +
      '<form class="filters" data-filters><input type="hidden" name="view" value="' + view + '">' + (q.get("d") ? '<input type="hidden" name="d" value="' + esc(q.get("d")) + '">' : "") +
      (A.isAdmin() ? '<select name="teacher" aria-label="Teacher">' + A.opts(A.peopleOpts("staff"), q.get("teacher"), L("All teachers", "ครูทุกคน")) + "</select>" : "") +
      '<select name="student" aria-label="Student">' + A.opts(A.peopleOpts("student"), q.get("student"), L("All students", "นักเรียนทุกคน")) + "</select></form></div>" +
      '<div class="legend">' + Object.keys(A.STATUS).map(function (k) { return '<span class="ev--' + k + '"><i></i>' + A.statusName(k) + "</span>"; }).join("") + (A.isAdmin() ? '<span class="lg-pay"><i></i>' + L("Payment received", "รับชำระเงิน") + "</span>" : "") + '<span class="muted">' + L("Click a day to add a lesson.", "คลิกวันที่เพื่อเพิ่มคาบเรียน") + "</span></div>";
    A._calSessions = all;
    return {
      title: L("Calendar", "ปฏิทิน"),
      actions: '<button class="btn" data-act="ics">' + L("Export .ics", "ส่งออก .ics") + '</button><button class="btn btn--primary" data-act="new-session">+ ' + L("Add lesson", "เพิ่มคาบเรียน") + "</button>",
      html: bar + html
    };
  };

  /* day click -> new lesson on that date; .ics export */
  var prevAct = A.onAct;
  A.onAct = function (act, b, ev) {
    if (act === "ics") return exportICS();
    if (prevAct) prevAct(act, b, ev);
  };
  document.addEventListener("click", function (ev) {
    if (!A.me) return;
    var day = ev.target.closest("[data-day]");
    if (!day || ev.target.closest("[data-session], a, button")) return;
    A.editSession(null, { date: day.getAttribute("data-day") });
  });

  function icsEsc(s) { return String(s || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n"); }
  function stamp(date, time, addH) {
    var p = date.split("-"), t = (time || "09:00").split(":");
    var d = new Date(+p[0], +p[1] - 1, +p[2], +t[0], +t[1]);
    if (addH) d = new Date(d.getTime() + addH * 3600000);
    return d.getFullYear() + A.pad(d.getMonth() + 1) + A.pad(d.getDate()) + "T" + A.pad(d.getHours()) + A.pad(d.getMinutes()) + "00";
  }
  function exportICS() {
    var list = (A._calSessions || []).filter(function (s) { return s.status !== "cancelled"; });
    var lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//DeepDistrict.si//Back office//EN", "CALSCALE:GREGORIAN", "X-WR-CALNAME:DeepDistrict lessons", "X-WR-TIMEZONE:Asia/Bangkok"];
    list.forEach(function (s) {
      var e = A.byId("enrolments", s.enrolmentId);
      lines.push("BEGIN:VEVENT", "UID:" + s.id + "@deepdistrict.si", "DTSTAMP:" + stamp(A.today(), "00:00"),
        "DTSTART;TZID=Asia/Bangkok:" + stamp(s.date, s.start), "DTEND;TZID=Asia/Bangkok:" + stamp(s.date, s.start, +s.hours || 1),
        "SUMMARY:" + icsEsc(e.courseCode + " · " + A.userName(e.studentId)),
        "DESCRIPTION:" + icsEsc(A.statusName(s.status) + (s.topic ? "\n" + s.topic : "")),
        "LOCATION:" + icsEsc(s.mode === "online" ? "Zoom" : A.db.org.name), "END:VEVENT");
    });
    lines.push("END:VCALENDAR");
    A.download("deepdistrict-lessons.ics", lines.join("\r\n"), "text/calendar;charset=utf-8");
    A.toast(L(list.length + " lessons exported — open the file to add them to Google, Apple or Outlook Calendar.", "ส่งออก " + list.length + " คาบแล้ว เปิดไฟล์เพื่อเพิ่มลง Google, Apple หรือ Outlook Calendar"));
  }

  /* ------------------------------------------------------------ demo data */
  A.demo = function () {
    var D = A.db, now = A.today();
    function person(role, name, nick, extra) { var u = Object.assign({ id: A.uid("u"), role: role, name: name, nick: nick, active: true, createdAt: new Date().toISOString() }, extra || {}); D.users.push(u); return u; }
    var t1 = person("teacher", "Dr. Narin Suksawat", "Ajarn Narin", { email: "narin@example.com" });
    var t2 = person("teacher", "Ploy Chaiyaporn", "Kru Ploy", { email: "ploy@example.com" });
    var p1 = person("parent", "Wanida Rattanakul", "Mae Wan", { phone: "08x-xxx-1234", email: "wanida@example.com" });
    var s1 = person("student", "Pim Rattanakul", "Pim", { grade: "M.4", school: "Bangkok Demo School", guardianId: p1.id, consentDate: A.addDays(now, -40) });
    var s2 = person("student", "Thanakorn Srisuk", "Ton", { grade: "M.6", school: "Demo Wittaya", consentDate: A.addDays(now, -30) });
    var s3 = person("student", "Alex Chen", "Alex", { grade: "University Y2", email: "alex@example.com", consentDate: A.addDays(now, -20) });
    function enrol(stu, code, teacher, hours, rate, start, mode, goal) {
      var e = { id: A.uid("e"), studentId: stu.id, courseCode: code, teacherId: teacher.id, hours: hours, rate: rate, discount: 0, fee: hours * rate, start: start, mode: mode, status: "active", goal: goal, createdAt: new Date().toISOString() };
      D.enrolments.push(e); return e;
    }
    var e1 = enrol(s1, "PY101", t2, 20, 800, A.addDays(now, -35), "hybrid", "Build a quiz game for a school project");
    var e2 = enrol(s2, "EXM210", t1, 24, 900, A.addDays(now, -28), "online", "COMPAS-PY1 AWARD of EXCELLENCE for TCAS70 portfolio");
    var e3 = enrol(s3, "EDG320", t1, 30, 1200, A.addDays(now, -14), "onsite", "Offline voice assistant on Jetson for a hackathon");
    var topics = {
      PY101: ["Setup & first program", "Variables & input", "if / elif / else", "for and while loops", "Functions", "Lists & dictionaries", "Files & mini project", "Quiz game polish"],
      EXM210: ["Exam format & timing", "Strings drill", "Lists & dict patterns", "Plan · Edge practice", "Recursion basics", "Timed mock #1 review", "Edge-case hunting", "Timed mock #2 review"],
      EDG320: ["JetPack setup", "Running a small LLM", "Quantisation & speed", "Speech to text", "Wake word & TTS", "Integration test"]
    };
    function series(e, startOffset, every, count, hours, start) {
      for (var i = 0; i < count; i++) {
        var date = A.addDays(now, startOffset + i * every), past = date < now;
        var topic = (topics[e.courseCode] || [])[i] || "";
        D.sessions.push({ id: A.uid("s"), enrolmentId: e.id, date: date, start: start, hours: hours, status: past ? (i === 2 && e === e1 ? "noshow" : "done") : "scheduled", mode: e.mode, teacherId: e.teacherId,
          topic: past ? topic : "", notes: past && i % 2 ? "Good progress; homework set." : "", createdAt: new Date().toISOString() });
      }
    }
    series(e1, -33, 7, 8, 2, "16:30");
    series(e2, -27, 4, 10, 2, "18:00");
    series(e3, -12, 3, 8, 3, "13:00");
    D.payments.push({ id: A.uid("p"), enrolmentId: e1.id, date: A.addDays(now, -35), amount: 16000, method: "transfer", ref: "RC-DEMO-001", createdAt: new Date().toISOString() });
    D.payments.push({ id: A.uid("p"), enrolmentId: e2.id, date: A.addDays(now, -28), amount: 10800, method: "promptpay", ref: "RC-DEMO-002", note: "Deposit 50%", createdAt: new Date().toISOString() });
    D.payments.push({ id: A.uid("p"), enrolmentId: e3.id, date: A.addDays(now, -14), amount: 18000, method: "card", ref: "RC-DEMO-003", note: "Deposit 50%", createdAt: new Date().toISOString() });
    A.logAct("Loaded demo data"); A.save();
  };
})();
