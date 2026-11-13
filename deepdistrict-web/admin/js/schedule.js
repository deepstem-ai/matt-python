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
  A.endOf = function (s) { return s.start ? A.fromMin(A.toMin(s.start) + (+s.hours || 0) * 60) : ""; };
  // a lesson can be on the timetable before its time is known: it shows "time to be confirmed"
  A.span = function (s) { return s.start ? s.start + "–" + A.endOf(s) : A.L("time TBC", "รอระบุเวลา"); };
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
  // opts.endBy: "hours" (default — fill opts.hours), "count" (opts.count lessons) or "date" (every slot up to opts.to)
  A.generateLessons = function (enr, opts) {
    var pattern = (opts.pattern || []).filter(function (sl) { return A.slotHours(sl) > 0; });
    var by = opts.endBy || "hours", need = by === "hours" ? Math.round((+opts.hours || 0) * 100) / 100 : 1e9, out = [];
    var maxN = by === "count" ? Math.floor(+opts.count || 0) : 1e9;
    if (!pattern.length || need <= 0 || maxN <= 0 || (by === "date" && (!opts.to || opts.to < opts.from))) return out;
    var d = A.parse(opts.from), guard = 0;
    while (need > 0.001 && out.length < maxN && guard++ < 800 && !(by === "date" && A.iso(d) > opts.to)) {
      var today = pattern.filter(function (sl) { return +sl.day === d.getDay(); }).sort(function (a, b) { return A.toMin(a.start) - A.toMin(b.start); });
      for (var i = 0; i < today.length && need > 0.001 && out.length < maxN; i++) {
        var h = Math.min(A.slotHours(today[i]), need);
        out.push({ id: A.uid("s"), enrolmentId: enr.id, date: A.iso(d), start: today[i].start, hours: Math.round(h * 100) / 100, status: "scheduled",
          mode: today[i].mode || enr.mode, location: today[i].location || enr.location || "", teacherId: enr.teacherId, createdAt: new Date().toISOString() });
        need = Math.round((need - h) * 100) / 100;
      }
      d.setDate(d.getDate() + 1);
    }
    return out;
  };


  /* ------------------------------------------------------------ change marks
     Every moved, cancelled, changed or replacement lesson carries a symbol and a line that says what it replaces
     and why — the same everywhere (calendar, tables, reports, text, the calendar feed). */
  function whenOf(x) { return x ? A.fmtDate(x.date, { weekday: "short", day: "numeric", month: "short", year: "2-digit" }) + (x.start ? " " + x.start : "") : "–"; }
  A.lessonMarks = function (s) {
    var out = [], L = A.L, byId = function (id) { return id && A.byId("sessions", id); };
    var why = function (x) { return x && x.reason ? " · " + L("reason: ", "เหตุผล: ") + x.reason : ""; };
    if (s.status === "cancelled") { var rb = byId(s.replacedBy); out.push({ k: "cancelled", icon: "✕", label: L("Cancelled", "ยกเลิก"), text: (s.reason ? L("Reason: ", "เหตุผล: ") + s.reason : L("No reason given", "ไม่ระบุเหตุผล")) + (rb ? " · " + L("new lesson ", "คาบใหม่ ") + whenOf(rb) : " · " + L("hours to schedule", "ชั่วโมงรอนัดใหม่")) }); }
    if (s.status === "rescheduled") { var to = byId(s.movedTo); out.push({ k: "moved", icon: "↪", label: L("Moved", "ย้ายแล้ว"), text: L("moved to ", "ย้ายไป ") + whenOf(to) + why(s) }); }
    if (s.movedFrom) { var fr = byId(s.movedFrom); out.push({ k: "replace", icon: "↩", label: L("Moved lesson", "คาบที่ย้ายมา"), text: L("replaces ", "แทนคาบ ") + whenOf(fr) + why(fr) }); }
    if (s.makeUpFor) { var mk = byId(s.makeUpFor); out.push({ k: "makeup", icon: "↺", label: L("Make-up", "คาบชดเชย"), text: L("replaces ", "แทนคาบ ") + whenOf(mk) + why(mk) }); }
    if (s.changedFrom) out.push({ k: "changed", icon: "✎", label: L("Time changed", "เปลี่ยนเวลา"), text: L("was ", "เดิม ") + whenOf(s.changedFrom) + (s.changedFrom.hours != null && +s.changedFrom.hours !== +s.hours ? " · " + A.num(s.changedFrom.hours) + L(" h", " ชม.") : "") + (s.changeReason ? " · " + L("reason: ", "เหตุผล: ") + s.changeReason : "") });
    if (s.extraHours) out.push({ k: "extra", icon: "+", label: L("Extra hours", "ชั่วโมงชดเชย"), text: "+" + A.num(s.extraHours) + L(" h added (make-up)", " ชม. (ชดเชย)") });
    if (s.afterPause) out.push({ k: "pause", icon: "↻", label: L("Rebooked", "นัดใหม่"), text: L("rebooked after time off", "นัดใหม่หลังหยุดเรียน") });
    return out;
  };
  /* compact: symbol + label (title = the full line); full: symbol + label + the line */
  A.markHtml = function (s, full) {
    return A.lessonMarks(s).map(function (m) {
      return '<span class="lm lm--' + m.k + '" title="' + A.esc(m.label + " — " + m.text) + '"><i>' + A.esc(m.icon) + "</i>" + A.esc(m.label) + (full ? '<em>' + A.esc(m.text) + "</em>" : "") + "</span>";
    }).join(full ? "" : " ");
  };
  A.markText = function (s) { return A.lessonMarks(s).map(function (m) { return m.icon + " " + m.label + ": " + m.text; }).join(" | "); };

  /* ready-made reasons: tap one to fill the box (and still edit it), or type your own */
  A.REASONS = function () {
    var L = A.L;
    return [["sick", "🤒", L("Learner is sick", "ผู้เรียนไม่สบาย")], ["family", "👨‍👩‍👧", L("Family matter", "ติดธุระครอบครัว")],
      ["school", "🏫", L("School exam or activity", "ติดสอบ / กิจกรรมโรงเรียน")], ["travel", "✈️", L("Travelling / out of town", "เดินทาง / ไปต่างจังหวัด")],
      ["holiday", "🎌", L("Public holiday", "วันหยุดนักขัตฤกษ์")], ["teacher", "🧑‍🏫", L("Teacher unavailable", "ครูติดภารกิจ / ไม่สบาย")],
      ["online", "📶", L("Internet / Zoom problem", "อินเทอร์เน็ต / Zoom มีปัญหา")], ["weather", "🌧️", L("Heavy rain / traffic", "ฝนตกหนัก / รถติด")],
      ["parent", "🙋", L("Parent asked to change the time", "ผู้ปกครองขอเปลี่ยนเวลา")], ["plan", "🗓️", L("Timetable adjustment", "ปรับตารางเรียนให้เหมาะสม")]];
  };
  A.reasonKey = function (text) { var r = A.REASONS().filter(function (x) { return x[2] === String(text || "").trim(); })[0]; return r ? r[0] : "other"; };
  A.reasonChips = function (form, name) {
    var inp = form.elements[name]; if (!inp) return;
    inp.setAttribute("placeholder", A.L("Pick a reason below, or type your own", "เลือกเหตุผลด้านล่าง หรือพิมพ์เอง"));
    var row = document.createElement("div"); row.className = "rs-chips";
    row.innerHTML = A.REASONS().map(function (r) { return '<button type="button" data-rs="' + A.esc(r[2]) + '">' + r[1] + " " + A.esc(r[2]) + "</button>"; }).join("") +
      '<button type="button" data-rs="" class="rs-own">✏️ ' + A.esc(A.L("Other — type it", "อื่น ๆ — พิมพ์เอง")) + "</button>";
    inp.parentNode.appendChild(row);
    function mark() { A.$$("[data-rs]", row).forEach(function (b) { b.setAttribute("aria-pressed", String(!!b.getAttribute("data-rs") && b.getAttribute("data-rs") === inp.value.trim())); }); }
    row.addEventListener("click", function (e) {
      var b = e.target.closest("[data-rs]"); if (!b) return;
      inp.value = b.getAttribute("data-rs"); inp.dispatchEvent(new Event("input", { bubbles: true })); inp.focus(); mark();
    });
    inp.addEventListener("input", mark); mark();
  };
  /* colour class for a lesson with a change (calendar, tables) */
  A.markClass = function (s) { var m = A.lessonMarks(s)[0]; return m ? " mk mk--" + m.k : ""; };
  A.markIcons = function (s) { return A.lessonMarks(s).map(function (m) { return m.icon; }).join(""); };

  /* ------------------------------------------------------------ clashes */
  function overlaps(a, b) {
    if (!a.start || !b.start) return false;          // no time yet: cannot clash
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
