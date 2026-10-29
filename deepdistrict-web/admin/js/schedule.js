/* ==========================================================================
   DeepDistrict back office — timetables
   • weekly patterns with a different time on each day (e.g. Mon 09:00–10:30,
     Tue 14:00–15:00, Wed 19:00–20:30)
   • automatic lesson generation until the purchased hours are filled
   • clash detection (same teacher, same learner, same room) with a
     confirm-or-go-back pop-up
   • one colour per teacher
   ========================================================================== */
(function () {
  "use strict";
  var A = window.DDA, L = A.L, esc = A.esc;

  /* ------------------------------------------------------------ time helpers */
  A.toMin = function (t) { var p = String(t || "00:00").split(":"); return (+p[0] || 0) * 60 + (+p[1] || 0); };
  A.fromMin = function (m) { m = Math.max(0, Math.round(m)); return A.pad(Math.floor(m / 60) % 24) + ":" + A.pad(m % 60); };
  A.endOf = function (s) { return A.fromMin(A.toMin(s.start) + (+s.hours || 0) * 60); };
  A.span = function (s) { return (s.start || "") + "–" + A.endOf(s); };
  A.slotHours = function (sl) { return Math.max(0, (A.toMin(sl.end) - A.toMin(sl.start)) / 60); };
  A.patternText = function (pattern) {
    return (pattern || []).slice().sort(function (a, b) { return ((a.day + 6) % 7) - ((b.day + 6) % 7) || A.toMin(a.start) - A.toMin(b.start); })
      .map(function (sl) { return A.dayName(sl.day) + " " + sl.start + "–" + sl.end; }).join(", ");
  };

  /* ------------------------------------------------------------ teacher colours */
  var PALETTE = ["#2457e6", "#0e9f6e", "#d97706", "#9333ea", "#db2777", "#0891b2", "#65a30d", "#dc2626", "#4f46e5", "#a16207"];
  A.teacherColor = function (id) {
    if (!id) return "#64748b";
    var staff = A.people("staff").map(function (u) { return u.id; }).sort();
    var i = staff.indexOf(id);
    if (i === -1) { i = 0; for (var k = 0; k < id.length; k++) i = (i * 31 + id.charCodeAt(k)) % 997; }
    return PALETTE[i % PALETTE.length];
  };

  /* ------------------------------------------------------------ generate lessons from a weekly pattern */
  A.generateLessons = function (enr, opts) {
    var pattern = (opts.pattern || []).filter(function (sl) { return A.slotHours(sl) > 0; });
    var need = Math.round((+opts.hours || 0) * 100) / 100, out = [];
    if (!pattern.length || need <= 0) return out;
    var d = A.parse(opts.from), guard = 0;
    while (need > 0.001 && guard++ < 800) {
      var today = pattern.filter(function (sl) { return +sl.day === d.getDay(); }).sort(function (a, b) { return A.toMin(a.start) - A.toMin(b.start); });
      for (var i = 0; i < today.length && need > 0.001; i++) {
        var h = Math.min(A.slotHours(today[i]), need);
        out.push({ id: A.uid("s"), enrolmentId: enr.id, date: A.iso(d), start: today[i].start, hours: Math.round(h * 100) / 100, status: "scheduled",
          mode: today[i].mode || enr.mode, location: today[i].location || enr.location || "", teacherId: enr.teacherId, createdAt: new Date().toISOString() });
        need = Math.round((need - h) * 100) / 100;
      }
      d.setDate(d.getDate() + 1);
    }
    return out;
  };

  /* ------------------------------------------------------------ clashes */
  function overlaps(a, b) {
    if (a.date !== b.date) return false;
    var a1 = A.toMin(a.start), a2 = a1 + (+a.hours || 0) * 60, b1 = A.toMin(b.start), b2 = b1 + (+b.hours || 0) * 60;
    return a1 < b2 && b1 < a2;
  }
  function info(s) {
    var e = s.enrolmentId && A.byId("enrolments", s.enrolmentId);
    return { teacherId: s.teacherId || (e && e.teacherId), studentId: (e && e.studentId) || s._stu, course: s.courseCode || (e && e.courseCode) };
  }
  A.findConflicts = function (cands, ignoreIds) {
    var ignore = {}; (ignoreIds || []).forEach(function (id) { ignore[id] = 1; });
    cands.forEach(function (c) { if (c.id) ignore[c.id] = 1; });
    var others = A.db.sessions.concat(A.db.busy || []).filter(function (s) { return !ignore[s.id] && (s.status === "scheduled" || s.status === "done"); });
    var found = [];
    cands.forEach(function (c, ci) {
      var ic = info(c);
      others.concat(cands.slice(ci + 1)).forEach(function (o) {
        if (!overlaps(c, o)) return;
        var io = info(o), why = [];
        if (ic.teacherId && ic.teacherId === io.teacherId) why.push("teacher");
        if (ic.studentId && ic.studentId === io.studentId) why.push("student");
        if (c.location && o.location && c.mode !== "online" && o.mode !== "online" && c.location.trim().toLowerCase() === o.location.trim().toLowerCase()) why.push("room");
        if (why.length) found.push({ cand: c, other: o, why: why });
      });
    });
    return found;
  };
  A.describe = function (s) {
    var i = info(s);
    return A.fmtDate(s.date, { weekday: "short", day: "numeric", month: "short" }) + " " + A.span(s) + " · " + (i.course || "") + " · " + A.userName(i.teacherId) +
      (i.studentId && A.byId("users", i.studentId) ? " · " + A.userName(i.studentId) : "") + " · " + A.modeName(s.mode) + (s.location ? " (" + s.location + ")" : "");
  };
  A.modeName = function (m) { return { online: L("Online (Zoom)", "ออนไลน์ (Zoom)"), onsite: L("Onsite", "ที่แล็บ"), hybrid: L("Hybrid", "ไฮบริด") }[m] || m || ""; };

  /* Pop-up: show clashes and let the person confirm or go back. */
  A.confirmConflicts = function (cands, proceed, ignoreIds, onBack) {
    var list = A.findConflicts(cands, ignoreIds);
    if (!list.length) return proceed();
    var WHY = { teacher: L("same teacher", "ครูคนเดียวกัน"), student: L("same learner", "ผู้เรียนคนเดียวกัน"), room: L("same room", "ห้องเดียวกัน") };
    var dlg = document.createElement("dialog"); dlg.className = "modal modal--warn";
    dlg.innerHTML = '<div class="modal__box"><header><h2>⚠ ' + L("Time clash — please check", "เวลาชนกัน — กรุณาตรวจสอบ") + '</h2></header><div class="clash-list">' +
      '<p>' + L(list.length + " clash(es) found. Check before you confirm:", "พบเวลาชนกัน " + list.length + " รายการ กรุณาตรวจสอบก่อนยืนยัน:") + "</p><ul>" +
      list.slice(0, 12).map(function (c) {
        return "<li><b>" + esc(c.why.map(function (w) { return WHY[w]; }).join(" · ")) + '</b><span class="clash-new">' + L("New: ", "ใหม่: ") + esc(A.describe(c.cand)) + '</span><span class="clash-old">' + L("Already booked: ", "มีอยู่แล้ว: ") + esc(A.describe(c.other)) + "</span></li>";
      }).join("") + (list.length > 12 ? "<li>… +" + (list.length - 12) + "</li>" : "") + "</ul></div>" +
      '<footer><span class="spacer"></span><button type="button" class="btn" data-back>' + L("Go back and change", "กลับไปแก้ไข") + '</button><button type="button" class="btn btn--danger" data-ok>' + L("Confirm anyway", "ยืนยันตามนี้") + "</button></footer></div>";
    document.body.appendChild(dlg);
    function close() { dlg.close(); dlg.remove(); }
    function back() { close(); if (onBack) onBack(); }
    dlg.querySelector("[data-back]").addEventListener("click", back);
    dlg.querySelector("[data-ok]").addEventListener("click", function () { close(); proceed(); });
    dlg.addEventListener("cancel", function (e) { e.preventDefault(); back(); });
    dlg.showModal();
    dlg.querySelector("[data-back]").focus();
  };
  /* Promise form for use inside A.form onSave: true = go ahead, false = keep the form open */
  A.clashOK = function (cands, ignoreIds) {
    return new Promise(function (res) { A.confirmConflicts(cands, function () { res(true); }, ignoreIds, function () { res(false); }); });
  };
})();
