/* ==========================================================================
   DeepDistrict — Learning schedule report (ใบรายงานวันเวลาเรียน)
   A colourful one-page report for learners and parents: registration details,
   progress (learned / left), a timeline of every lesson and the full lesson
   list, framed by a double border, with the DeepDistrict logo, copyright and
   a disclaimer. Exports: PDF, image (PNG), print, email and plain text.
   ========================================================================== */
(function () {
  "use strict";
  var A = window.DDA, L = A.L, esc = A.esc;
  var LOGO_W = "../assets/images/brand/logo-horizontal-white.png", MARK = "../assets/images/brand/logo-mark.png";
  var ST = { done: ["#16a34a", "#dcfce7"], scheduled: ["#2563eb", "#dbeafe"], noshow: ["#d97706", "#fef3c7"], cancelled: ["#64748b", "#e2e8f0"],
             overdue: ["#dc2626", "#fee2e2"], rescheduled: ["#7c3aed", "#ede9fe"] };

  function d(iso, o) { return A.fmtDate(iso, o || { weekday: "short", day: "numeric", month: "short", year: "numeric" }); }
  function stu(e) { return A.byId("users", e.studentId) || {}; }
  function par(e) { var s = stu(e); return s.guardianId ? A.byId("users", s.guardianId) : null; }
  function rows(e, from) {
    var today = A.today(), n = 0, cum = 0;
    return A.stats(e).sessions.map(function (s) {
      var counts = s.status !== "cancelled" && s.status !== "rescheduled";
      if (counts) { n++; cum += +s.hours || 0; }
      var st = s.status === "scheduled" && s.date < today ? "overdue" : s.status;
      return { s: s, no: counts ? n : 0, cum: cum, st: st, show: !from || s.date >= from };
    });
  }

  /* ver: "full" (every lesson listed) or "summary" (one page: progress, timeline, key dates, lessons per month) */
  A.scheduleReportHTML = function (e, from, asOf, ver) {
    asOf = asOf || A.today(); ver = ver === "summary" ? "summary" : "full";
    var o = A.db.org, s = stu(e), p = par(e), x = A.asOfStats(e, asOf), all = rows(e, ""), list = from ? all.filter(function (r) { return r.s.date >= from; }) : all;
    var st = A.stats(e), pct = Math.round(x.pct), no = "SC-" + e.id.replace(/[^a-z0-9]/gi, "").slice(-6).toUpperCase();
    var info = function (k, v) { return v ? '<div class="sr-i"><span>' + esc(k) + "</span><b>" + v + "</b></div>" : ""; };
    var tile = function (cls, k, v, sub) { return '<div class="sr-t sr-t--' + cls + '"><span>' + esc(k) + "</span><b>" + v + "</b>" + (sub ? "<small>" + esc(sub) + "</small>" : "") + "</div>"; };
    var pts = all.filter(function (r) { return r.s.status !== "rescheduled"; }).map(function (r) { return { date: r.s.date, start: r.s.start, hours: r.s.hours, status: r.st }; });
    var mode = (A.MODES().filter(function (m) { return m[0] === e.mode; })[0] || [])[1] || "";
    return '<article class="report sr" id="report"><div class="sr__frame"><div class="sr__in">' +
      '<header class="sr-head"><img src="' + LOGO_W + '" alt="DeepDistrict" class="sr-logo"><div class="sr-head__t"><h1>' + L("Learning Schedule Report", "ใบรายงานวันเวลาเรียน") + "</h1><p>" +
        '<span class="sr-ver">' + (ver === "summary" ? L("Summary", "ฉบับสรุป") : L("Full version", "ฉบับเต็ม")) + "</span> " +
        (from ? L("Remaining lessons from ", "คาบเรียนที่เหลือ ตั้งแต่ ") + esc(d(from)) : L("Full schedule · from the first lesson to the last", "ตารางเรียนทั้งหมด ตั้งแต่คาบแรกถึงคาบสุดท้าย")) + "</p></div>" +
        '<dl class="sr-no"><dt>' + L("No.", "เลขที่") + "</dt><dd>" + esc(no) + "</dd><dt>" + L("As of", "ณ วันที่") + "</dt><dd>" + esc(d(asOf, { day: "numeric", month: "short", year: "numeric" })) + "</dd></dl></header>" +

      '<section class="sr-reg"><h2><span class="sr-ico">👤</span>' + L("Registration", "ข้อมูลการลงทะเบียน") + '</h2><div class="sr-grid">' +
        info(L("Student", "นักเรียน"), esc(s.name || "–") + (s.nick ? " (" + esc(s.nick) + ")" : "")) +
        info(L("School · grade", "โรงเรียน · ชั้น"), esc([s.school, s.grade].filter(Boolean).join(" · "))) +
        info(L("Parent / guardian", "ผู้ปกครอง"), p ? esc(p.name) + (p.phone ? " · " + esc(p.phone) : "") : "") +
        info(L("Course", "หลักสูตร"), esc(A.courseName(e.courseCode))) +
        info(L("Teacher", "ครูผู้สอน"), e.teacherId ? esc(A.userName(e.teacherId)) : "") +
        info(L("Class days & time", "วันและเวลาเรียน"), esc(A.patternText(e.pattern || []))) +
        info(L("How · where", "รูปแบบ · สถานที่"), esc([mode, e.location].filter(Boolean).join(" · "))) +
        info(L("Enrolled on", "วันที่ลงทะเบียน"), esc(d(e.start, { day: "numeric", month: "long", year: "numeric" }))) +
        info(L("First – last lesson", "คาบแรก – คาบสุดท้าย"), x.first ? esc(d(x.first, { day: "numeric", month: "short", year: "numeric" })) + " → " + esc(d(x.last, { day: "numeric", month: "short", year: "numeric" })) : "") +
        info(L("Course fee", "ค่าเรียน"), A.money(st.fee) + (st.paid ? " · " + L("paid ", "ชำระแล้ว ") + A.money(st.paid) : "") + (st.balance > 0.009 ? " · " + L("due ", "ค้าง ") + A.money(st.balance) : "")) +
      "</div></section>" +

      '<section class="sr-prog"><h2><span class="sr-ico">📈</span>' + L("Progress", "ความคืบหน้า") + "</h2>" +
        '<div class="sr-tiles">' +
        tile("done", x.projected ? L("Learned (incl. booked)", "เรียนแล้ว (รวมที่นัด)") : L("Learned", "เรียนแล้ว"), A.num(x.learned) + " " + L("h", "ชม."), x.learnedN + " " + L("lessons", "ครั้ง")) +
        tile("left", L("Left", "คงเหลือ"), A.num(x.left) + " " + L("h", "ชม."), x.leftN + " " + L("lessons booked", "ครั้งที่นัดไว้")) +
        tile("total", L("Total", "ทั้งหมด"), A.num(x.total) + " " + L("h", "ชม."), pct + "%") +
        tile("gap", L("Not booked yet", "ยังไม่ได้นัด"), A.num(x.unbooked) + " " + L("h", "ชม."), "") + "</div>" +
        '<div class="sr-bar"><i style="width:' + pct + '%"></i></div><p class="sr-pct">' + L("Course progress: ", "ความคืบหน้าของหลักสูตร: ") + "<b>" + pct + "%</b></p></section>" +

      (pts.length ? '<section class="sr-tl"><h2><span class="sr-ico">🗓️</span>' + L("Timeline", "ไทม์ไลน์") + "</h2>" + A.timelineStrip(pts, { from: x.first, to: x.last, asOf: asOf, big: true, fill: asOf }) +
        '<p class="sr-leg">' + [["done", L("learned", "เรียนแล้ว")], ["scheduled", L("booked", "นัดแล้ว")], ["noshow", L("no-show", "ขาดเรียน")], ["cancelled", L("cancelled", "ยกเลิก")], ["overdue", L("past, not updated", "ผ่านแล้วยังไม่อัปเดต")]]
          .map(function (k) { return '<span><i style="background:' + ST[k[0]][0] + '"></i>' + esc(k[1]) + "</span>"; }).join("") + "</p></section>" : "") +

      (ver === "summary" ? keyDates(e, all, asOf) :
      '<section class="sr-list"><h2><span class="sr-ico">📋</span>' + L("Lessons", "รายการคาบเรียน") + " (" + list.length + ")</h2>" +
        (list.length ? '<table class="sr-tbl"><thead><tr><th>#</th><th>' + L("Date", "วันที่") + "</th><th>" + L("Time", "เวลา") + "</th><th>" + L("Hours", "ชม.") + "</th><th>" + L("Status", "สถานะ") + "</th><th>" + L("Total", "สะสม") + "</th></tr></thead><tbody>" +
          list.map(function (r) {
            var c = ST[r.st] || ST.scheduled, label = r.st === "overdue" ? L("Past, not updated", "ผ่านแล้ว ยังไม่อัปเดต") : A.statusName(r.st);
            return "<tr" + (r.no ? "" : ' class="is-off"') + "><td>" + (r.no || "–") + "</td><td>" + esc(d(r.s.date)) + "</td><td>" + esc(A.span(r.s)) + "</td><td>" + A.num(r.s.hours) + "</td>" +
              '<td><span class="sr-pill" style="color:' + c[0] + '"><i style="background:' + c[0] + '"></i>' + esc(label) + (r.s.autoDone ? " · " + L("regular", "ปกติ") : "") + "</span></td><td>" + (r.no ? A.num(r.cum) : "") + "</td></tr>";
          }).join("") + "</tbody></table>" : '<p class="sr-empty">' + L("No lessons yet.", "ยังไม่มีคาบเรียน") + "</p>") + "</section>") +

      '<footer class="sr-foot"><img src="' + MARK + '" alt="" class="sr-mark"><div><b>© ' + new Date().getFullYear() + " " + esc(o.name || "DeepDistrict.si") + " · " + L("All rights reserved", "สงวนลิขสิทธิ์") + "</b><br>" +
        esc([o.address, o.email, o.phone].filter(Boolean).join(" · ")) + "<br><small>" +
        L("Disclaimer: this report is produced from DeepDistrict's records as of the date shown. Dates and times can change by agreement; the latest confirmed schedule is always in the DeepDistrict portal. It is not a receipt, tax invoice or certificate of completion.",
          "ข้อจำกัดความรับผิดชอบ: รายงานนี้จัดทำจากข้อมูลในระบบของ DeepDistrict ณ วันที่ระบุ วันและเวลาเรียนอาจเปลี่ยนแปลงได้ตามที่ตกลงกัน ตารางล่าสุดที่ยืนยันแล้วดูได้ในระบบ DeepDistrict เสมอ เอกสารนี้ไม่ใช่ใบเสร็จรับเงิน ใบกำกับภาษี หรือใบรับรองการจบหลักสูตร") +
        "</small></div></footer></div></div></article>";
  };

  /* summary: the dates that matter and how the lessons spread over the months */
  function keyDates(e, all, asOf) {
    var live = all.filter(function (r) { return r.no; }), done = live.filter(function (r) { return r.s.date <= asOf && A.counts(r.s); });
    var next = live.filter(function (r) { return r.s.date > asOf && r.s.status === "scheduled"; });
    var k = function (label, r, cls) { return '<div class="sr-k sr-k--' + cls + '"><span>' + esc(label) + "</span><b>" + (r ? esc(d(r.s.date)) : "–") + "</b>" + (r ? "<small>" + esc(A.span(r.s)) + " · " + L("lesson ", "ครั้งที่ ") + r.no + "</small>" : "") + "</div>"; };
    var months = {};
    live.forEach(function (r) { var m = r.s.date.slice(0, 7); months[m] = months[m] || { n: 0, h: 0, done: 0 }; months[m].n++; months[m].h += +r.s.hours || 0; if (A.counts(r.s) && r.s.date <= asOf) months[m].done++; });
    return '<section class="sr-key"><h2><span class="sr-ico">📌</span>' + L("Key dates", "วันสำคัญ") + '</h2><div class="sr-keys">' +
      k(L("First lesson", "คาบแรก"), live[0], "first") + k(L("Latest lesson learned", "คาบล่าสุดที่เรียนแล้ว"), done[done.length - 1], "done") +
      k(L("Next lesson", "คาบถัดไป"), next[0], "next") + k(L("Last lesson", "คาบสุดท้าย"), live[live.length - 1], "last") + "</div>" +
      '<h3 class="sr-sub">' + L("Lessons per month", "จำนวนคาบในแต่ละเดือน") + '</h3><div class="sr-months">' + Object.keys(months).sort().map(function (m) {
        var x = months[m];
        return '<div class="sr-m"><b>' + esc(A.parse(m + "-01").toLocaleDateString(A.lang === "th" ? "th-TH" : "en-GB", { month: "short", year: "2-digit" })) + "</b><span>" + x.n + L(" lessons", " ครั้ง") + " · " + A.num(x.h) + L(" h", " ชม.") + "</span>" +
          '<i><em style="width:' + Math.round(x.done / x.n * 100) + '%"></em></i></div>';
      }).join("") + "</div>" +
      '<p class="sr-note">' + L("The full version lists every lesson with its date, time and status.", "ฉบับเต็มแสดงทุกคาบเรียนพร้อมวัน เวลา และสถานะ") + "</p></section>";
  }

  /* a timeline in text: ▰ learned, ▱ to come */
  A.textTimeline = function (x, width) {
    width = width || 20;
    var f = Math.round((x.pct || 0) / 100 * width);
    return (x.first ? d(x.first, { day: "numeric", month: "short" }) + " " : "") + new Array(f + 1).join("▰") + new Array(width - f + 1).join("▱") + (x.last ? " " + d(x.last, { day: "numeric", month: "short" }) : "") + "  " + Math.round(x.pct || 0) + "%";
  };

  /* the same report as plain text (for LINE, notes or email) */
  A.scheduleReportText = function (e, from, asOf, ver) {
    asOf = asOf || A.today();
    var s = stu(e), p = par(e), x = A.asOfStats(e, asOf), st = A.stats(e), lines = [];
    var rule = "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━";
    lines.push(rule, L("DEEPDISTRICT · LEARNING SCHEDULE REPORT", "DEEPDISTRICT · ใบรายงานวันเวลาเรียน") + (ver === "summary" ? L(" (summary)", " (ฉบับสรุป)") : L(" (full)", " (ฉบับเต็ม)")), L("As of ", "ณ วันที่ ") + d(asOf, { day: "numeric", month: "long", year: "numeric" }), rule);
    lines.push(L("Student: ", "นักเรียน: ") + (s.name || "–") + (s.nick ? " (" + s.nick + ")" : "") + ([s.school, s.grade].filter(Boolean).length ? " · " + [s.school, s.grade].filter(Boolean).join(" · ") : ""));
    if (p) lines.push(L("Parent: ", "ผู้ปกครอง: ") + p.name + (p.phone ? " · " + p.phone : ""));
    lines.push(L("Course: ", "หลักสูตร: ") + A.courseName(e.courseCode));
    if (e.teacherId) lines.push(L("Teacher: ", "ครูผู้สอน: ") + A.userName(e.teacherId));
    if (e.pattern && e.pattern.length) lines.push(L("Class days: ", "วันเวลาเรียน: ") + A.patternText(e.pattern));
    if (x.first) lines.push(L("First – last lesson: ", "คาบแรก – คาบสุดท้าย: ") + d(x.first) + " → " + d(x.last));
    lines.push(L("Fee: ", "ค่าเรียน: ") + A.money(st.fee) + (st.balance > 0.009 ? " · " + L("due ", "ค้าง ") + A.money(st.balance) : " · " + L("paid in full", "ชำระครบ")), "");
    lines.push(L("Learned: ", "เรียนแล้ว: ") + A.num(x.learned) + L(" h (", " ชม. (") + x.learnedN + L(" lessons)", " ครั้ง)") + " · " + L("Left: ", "คงเหลือ: ") + A.num(x.left) + L(" h · Total: ", " ชม. · ทั้งหมด: ") + A.num(x.total) + L(" h", " ชม."), "");
    lines.push(L("Timeline: ", "ไทม์ไลน์: ") + A.textTimeline(x), "");
    if (ver === "summary") {
      var live = rows(e, "").filter(function (r) { return r.no; }), nx = live.filter(function (r) { return r.s.date > asOf && r.s.status === "scheduled"; })[0];
      if (nx) lines.push(L("Next lesson: ", "คาบถัดไป: ") + d(nx.s.date) + " " + A.span(nx.s) + L(" (lesson ", " (ครั้งที่ ") + nx.no + ")");
      lines.push(L("(Full version: every lesson listed.)", "(ฉบับเต็มแสดงทุกคาบเรียน)"));
    }
    rows(e, from).filter(function (r) { return r.show && ver !== "summary"; }).forEach(function (r) {
      var mark = { done: "✅", scheduled: "🗓️", noshow: "⚠️", cancelled: "✖️", overdue: "❗", rescheduled: "↪️" }[r.st] || "•";
      lines.push((r.no ? (r.no < 10 ? " " : "") + r.no + "." : "  –") + " " + d(r.s.date) + " " + A.span(r.s) + " · " + A.num(r.s.hours) + L(" h ", " ชม. ") + mark + " " + (r.st === "overdue" ? L("past, not updated", "ผ่านแล้วยังไม่อัปเดต") : A.statusName(r.st)));
    });
    lines.push(rule, "© " + new Date().getFullYear() + " " + (A.db.org.name || "DeepDistrict.si") + " · " + L("All rights reserved", "สงวนลิขสิทธิ์"),
      L("Dates and times can change by agreement; the latest schedule is in the DeepDistrict portal.", "วันเวลาเรียนอาจเปลี่ยนแปลงได้ตามที่ตกลงกัน ตารางล่าสุดดูได้ในระบบ DeepDistrict"));
    return lines.join("\n");
  };
})();
