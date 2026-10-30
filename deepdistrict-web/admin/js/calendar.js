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
  function teacherOf(s) { var e = s.enrolmentId && A.byId("enrolments", s.enrolmentId); return s.teacherId || (e && e.teacherId) || ""; }
  function clashIds(list) {
    var bad = {};
    var live = list.filter(function (s) { return s.status === "scheduled" || s.status === "done"; });
    live.forEach(function (a, i) { live.slice(i + 1).forEach(function (b) {
      if (a.date !== b.date || !teacherOf(a) || teacherOf(a) !== teacherOf(b)) return;
      var a1 = A.toMin(a.start), b1 = A.toMin(b.start);
      if (a1 < b1 + b.hours * 60 && b1 < a1 + a.hours * 60) { bad[a.id] = bad[b.id] = 1; }
    }); });
    return bad;
  }
  function chip(s, bad) {
    var e = A.byId("enrolments", s.enrolmentId), u = A.byId("users", e.studentId) || {};
    return '<button type="button" class="ev ev--' + s.status + (bad && bad[s.id] ? " is-clash" : "") + (s.example ? " is-example" : "") + '" style="--tc:' + A.teacherColor(teacherOf(s)) + '" data-session="' + s.id + '" title="' + esc(A.describe(s) + " · " + A.statusName(s.status)) + '">' +
      (bad && bad[s.id] ? "⚠ " : "") + "<b>" + esc(A.span(s)) + "</b> " + esc(u.nick || (u.name || "").split(" ")[0]) + ' <span>' + esc(e.courseCode) + "</span></button>";
  }

  A.pages.calendar = function (q) {
    var view = q.get("view") || (window.innerWidth < 760 ? "list" : "month");
    var cur = q.get("d") ? A.parse(q.get("d")) : new Date();
    var all = visibleSessions(q), byDate = {};
    var busy = A.isStaff() && !q.get("student") ? (A.db.busy || []).filter(function (b) { return !q.get("teacher") || b.teacherId === q.get("teacher"); }) : [];
    var bad = clashIds(all.concat(busy));
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
          list.slice(0, 4).map(function (x) { return chip(x, bad); }).join("") + (list.length > 4 ? '<a class="cal__more" href="#/calendar?view=list&d=' + ds + '">+' + (list.length - 4) + "</a>" : "") + "</div>";
        if (i === 34 && new Date(start.getTime() + 35 * 864e5).getMonth() !== cur.getMonth()) break;
      }
      html += "</div></div>";
    } else if (view === "week") {
      var ws = new Date(cur); ws.setDate(cur.getDate() - ((cur.getDay() + 6) % 7));
      var we = new Date(ws); we.setDate(ws.getDate() + 6);
      label = ws.toLocaleDateString(loc, { day: "numeric", month: "short" }) + " – " + we.toLocaleDateString(loc, { day: "numeric", month: "short", year: "numeric" });
      prev = A.addDays(A.iso(ws), -7); next = A.addDays(A.iso(ws), 7);
      var days = [], lo = 8 * 60, hi = 20 * 60;
      for (var j = 0; j < 7; j++) { var dd = new Date(ws); dd.setDate(ws.getDate() + j); days.push(A.iso(dd)); }
      var weekItems = all.concat(busy.map(function (x) { return Object.assign({ busy: true }, x); })).filter(function (x) { return days.indexOf(x.date) !== -1 && x.status !== "rescheduled"; });
      weekItems.forEach(function (x) { lo = Math.min(lo, Math.floor(A.toMin(x.start) / 60) * 60); hi = Math.max(hi, Math.ceil((A.toMin(x.start) + x.hours * 60) / 60) * 60); });
      var PX = 0.9; // pixels per minute
      html += '<div class="tgrid" data-lo="' + lo + '" data-px="' + PX + '" style="--h:' + Math.round((hi - lo) * PX) + 'px"><div class="tgrid__hours">';
      for (var m = lo; m < hi; m += 60) html += '<span style="top:' + Math.round((m - lo) * PX) + 'px">' + A.fromMin(m) + "</span>";
      html += "</div>";
      days.forEach(function (dk) {
        var items = weekItems.filter(function (x) { return x.date === dk; }).sort(function (a, b) { return A.toMin(a.start) - A.toMin(b.start); });
        // side-by-side lanes, only within each group of lessons that actually overlap
        var cluster = [], clusterEnd = -1;
        function flush() {
          var lanes = [];
          cluster.forEach(function (x) {
            var st = A.toMin(x.start), placed = false;
            for (var li = 0; li < lanes.length && !placed; li++) { if (lanes[li] <= st) { x._lane = li; lanes[li] = st + x.hours * 60; placed = true; } }
            if (!placed) { x._lane = lanes.length; lanes.push(st + x.hours * 60); }
          });
          cluster.forEach(function (x) { x._n = Math.max(1, lanes.length); });
          cluster = []; clusterEnd = -1;
        }
        items.forEach(function (x) {
          var st = A.toMin(x.start);
          if (cluster.length && st >= clusterEnd) flush();
          cluster.push(x); clusterEnd = Math.max(clusterEnd, st + x.hours * 60);
        });
        flush();
        html += '<div class="tgrid__col' + (dk === today ? " is-today" : "") + '" data-day="' + dk + '"><h3>' + esc(A.parse(dk).toLocaleDateString(loc, { weekday: "short", day: "numeric" })) + '</h3><div class="tgrid__body">';
        items.forEach(function (x) {
          var top = Math.round((A.toMin(x.start) - lo) * PX), h = Math.max(22, Math.round(x.hours * 60 * PX) - 2);
          var style = "top:" + top + "px;height:" + h + "px;left:calc(" + (x._lane * 100 / x._n) + "% + 2px);width:calc(" + (100 / x._n) + "% - 4px);--tc:" + A.teacherColor(teacherOf(x));
          var e = x.enrolmentId && A.byId("enrolments", x.enrolmentId), stu = e && A.byId("users", e.studentId);
          var where = A.modeName(x.mode) + (x.location ? " · " + x.location : "");
          html += (x.busy ? '<div class="tev tev--busy' : '<button type="button" class="tev tev--' + x.status) + (bad[x.id] ? " is-clash" : "") + '" style="' + style + '"' + (x.busy ? "" : ' data-session="' + x.id + '"') + ' title="' + esc(A.describe(x)) + '">' +
            "<b>" + (bad[x.id] ? "⚠ " : "") + esc(A.span(x)) + "</b><span>" + esc((x.courseCode || (e && e.courseCode) || "") + (stu ? " · " + (stu.nick || stu.name) : "")) + "</span><span>" + esc(A.userName(teacherOf(x))) + "</span><small>" + esc(where) + "</small>" + (x.busy ? "</div>" : "</button>");
        });
        html += "</div></div>";
      });
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
      '<div class="legend">' + A.people("staff").filter(function (t) { return all.concat(busy).some(function (x) { return teacherOf(x) === t.id; }); }).map(function (t) { return '<span class="lg-t" style="--tc:' + A.teacherColor(t.id) + '"><i></i>' + esc(t.nick || t.name) + "</span>"; }).join("") +
      '<span class="lg-s">✓ ' + A.statusName("done") + '</span><span class="lg-s"><s>' + A.statusName("cancelled") + '</s></span><span class="lg-s is-clash-lg">⚠ ' + L("same teacher, same time", "ครูคนเดียวกันเวลาชน") + "</span>" (A.db.sessions.some(function (x) { return x.example; }) ? '<span class="lg-s"><span class="tag-ex">' + L("Example", "ตัวอย่าง") + "</span> " + L("example data", "ข้อมูลตัวอย่าง") + "</span>" : "") + (A.isAdmin() ? '<span class="lg-pay"><i></i>' + L("Payment received", "รับชำระเงิน") + "</span>" : "") + '<span class="muted">' + (A.isStaff() ? L("Click a day to add a lesson, or a lesson to update or move it.", "คลิกวันที่เพื่อเพิ่มคาบ หรือคลิกคาบเพื่ออัปเดตหรือเลื่อน") : L("Click a lesson for details or to request a change.", "คลิกคาบเพื่อดูรายละเอียดหรือขอเปลี่ยนแปลง")) + "</span></div>";
    A._calSessions = all;
    return {
      title: L("Calendar", "ปฏิทิน"),
      actions: '<button class="btn" data-act="ics">' + L("Export .ics", "ส่งออก .ics") + "</button>" + (A.isStaff() ? '<button class="btn btn--primary" data-act="new-session">+ ' + L("Add lesson", "เพิ่มคาบเรียน") + "</button>" : '<button class="btn btn--primary" data-act="req-new">' + L("Request a change", "ขอเปลี่ยนแปลง") + "</button>"),
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
    if (!day || !A.isStaff() || ev.target.closest("[data-session], a, button")) return;
    var pre = { date: day.getAttribute("data-day") }, body = ev.target.closest(".tgrid__body"), grid = ev.target.closest(".tgrid");
    if (body && grid) {
      var y = ev.clientY - body.getBoundingClientRect().top, mins = +grid.getAttribute("data-lo") + y / +grid.getAttribute("data-px");
      pre.start = A.fromMin(Math.floor(mins / 30) * 30);
    }
    A.editSession(null, pre);
  });

  function icsEsc(s) { return String(s || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n"); }
  function stamp(date, time, addH) {
    var p = date.split("-"), t = (time || "09:00").split(":");
    var d = new Date(+p[0], +p[1] - 1, +p[2], +t[0], +t[1]);
    if (addH) d = new Date(d.getTime() + addH * 3600000);
    return d.getFullYear() + A.pad(d.getMonth() + 1) + A.pad(d.getDate()) + "T" + A.pad(d.getHours()) + A.pad(d.getMinutes()) + "00";
  }
  function exportICS() {
    var list = (A._calSessions || []).filter(function (s) { return s.status !== "cancelled" && s.status !== "rescheduled"; });
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

})();
