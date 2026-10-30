/* ==========================================================================
   DeepDistrict back office — rescheduling, make-up hours, change requests
   and the learner / parent portal ("My learning").

   Rescheduling rule: the original lesson is kept as "Moved" (it never counts),
   a new lesson is created, and if the new lesson is shorter the difference is
   either left "to schedule", added to the next lesson, or booked as a make-up.
   ========================================================================== */
(function () {
  "use strict";
  var A = window.DDA, L = A.L, esc = A.esc, $ = A.$;

  A.pendingRequests = function () { return (A.db.requests || []).filter(function (r) { return r.status === "pending"; }); };
  function when(s) { return A.fmtDate(s.date, { weekday: "short", day: "numeric", month: "short" }) + (s.start ? " " + s.start : ""); }
  // the next regular lesson: skips lessons that were themselves moved or are make-ups,
  // because their length was agreed separately (e.g. "only 1 h on Tuesday")
  function nextScheduled(enrId, after, exceptId) {
    return A.sessionsOf(enrId).filter(function (x) { return x.status === "scheduled" && x.id !== exceptId && !x.movedFrom && !x.makeUpFor && (x.date + (x.start || "")) > after; })[0];
  }

  /* ------------------------------------------------------------ hours at a glance */
  A.hoursPanel = function (e, st) {
    st = st || A.stats(e);
    var pctUsed = st.total ? Math.min(100, st.used / st.total * 100) : 0;
    var pctBooked = st.total ? Math.min(100 - pctUsed, st.planned / st.total * 100) : 0;
    var overBooked = st.used + st.planned - st.total;
    var gap = st.unscheduled, active = e.status === "active";
    var h = '<div class="hours">' +
      '<div class="hours__grid">' +
      '<div><span>' + L("Total hours", "ชั่วโมงทั้งหมด") + "</span><b>" + A.num(st.total) + "</b></div>" +
      '<div class="is-done"><span>' + L("Learned", "เรียนแล้ว") + "</span><b>" + A.num(st.used) + "</b></div>" +
      '<div class="is-left"><span>' + L("Remaining", "คงเหลือ") + "</span><b>" + A.num(st.remaining) + "</b></div>" +
      '<div class="is-booked"><span>' + L("Booked", "นัดแล้ว") + "</span><b>" + A.num(st.planned) + "</b></div>" +
      '<div class="' + (gap > 0.001 && active ? "is-gap" : "") + '"><span>' + L("To schedule", "ยังต้องนัด") + "</span><b>" + A.num(gap) + "</b></div>" +
      "</div>" +
      '<div class="hbar" role="img" aria-label="' + esc(L("Learned " + A.num(st.used) + " of " + A.num(st.total) + " hours; booked " + A.num(st.planned), "เรียนแล้ว " + A.num(st.used) + " จาก " + A.num(st.total) + " ชม. นัดแล้ว " + A.num(st.planned))) + '"><i class="hbar__done" style="width:' + pctUsed + '%"></i><i class="hbar__booked" style="width:' + pctBooked + '%"></i></div>' +
      '<p class="hours__legend"><span class="lg-done"></span>' + L("learned", "เรียนแล้ว") + ' <span class="lg-booked"></span>' + L("booked", "นัดแล้ว") + ' <span class="lg-gap"></span>' + L("not yet booked", "ยังไม่ได้นัด") + "</p>";
    if (active && gap > 0.001 && A.canEditEnrolment(e)) {
      var none = st.used + st.planned < 0.001;
      h += '<div class="gap-alert"><p>' + (none
        ? L("No lessons booked yet.", "ยังไม่มีการนัดคาบเรียน")
        : L(A.hrs(gap) + " of this course has no lesson yet — for example after a shorter rescheduled lesson.", "ยังมี " + A.hrs(gap) + " ที่ยังไม่มีคาบรองรับ เช่น หลังจากเลื่อนคาบแล้วเรียนสั้นลง")) + "</p>" +
        (none ? '<button class="btn btn--primary btn--sm" data-act="series" data-enr="' + e.id + '">' + L("Schedule weekly", "นัดรายสัปดาห์") + "</button>"
          : '<button class="btn btn--primary btn--sm" data-act="gap-next" data-enr="' + e.id + '">' + L("Add " + A.num(gap) + " h to the next lesson", "เพิ่ม " + A.num(gap) + " ชม. ในคาบถัดไป") + "</button>" +
            '<button class="btn btn--sm" data-act="gap-makeup" data-enr="' + e.id + '">' + L("Book a make-up lesson", "นัดคาบชดเชย") + "</button>") + "</div>";
    } else if (!A.isStaff() && gap > 0.001 && active && st.used + st.planned > 0) {
      h += '<p class="note">' + L(A.hrs(gap) + " still to be booked — DeepDistrict will arrange it.", "ยังมี " + A.hrs(gap) + " ที่รอนัดเพิ่ม DeepDistrict จะนัดให้") + "</p>";
    }
    if (overBooked > 0.001 && A.isStaff()) h += '<p class="alert">' + L("Booked " + A.hrs(overBooked) + " more than the package. Remove a lesson or add hours to the enrolment.", "นัดเกินแพ็กเกจ " + A.hrs(overBooked) + " กรุณาลบคาบหรือเพิ่มชั่วโมงในการลงทะเบียน") + "</p>";
    return h + "</div>";
  };

  A.lessonNote = function (s) {
    var parts = [];
    if (s.topic) parts.push(esc(s.topic));
    if (s.notes) parts.push('<span class="muted">' + esc(s.notes) + "</span>");
    var to = s.movedTo && A.byId("sessions", s.movedTo), from = s.movedFrom && A.byId("sessions", s.movedFrom), mk = s.makeUpFor && A.byId("sessions", s.makeUpFor);
    if (s.status === "rescheduled") parts.push('<span class="moved">→ ' + L("moved to ", "ย้ายไป ") + (to ? esc(when(to)) + " · " + A.hrs(to.hours) : "–") + (s.reason ? " · " + esc(s.reason) : "") + "</span>");
    if (from) parts.push('<span class="moved">← ' + L("moved from ", "ย้ายมาจาก ") + esc(when(from)) + " (" + A.hrs(from.hours) + ")</span>");
    if (mk) parts.push('<span class="moved">↺ ' + L("make-up for ", "ชดเชยคาบ ") + esc(when(mk)) + "</span>");
    if (s.afterPause) parts.push('<span class="moved">↻ ' + L("rebooked after time off", "นัดใหม่หลังหยุดเรียน") + "</span>");
    if (s.status === "cancelled" && s.reason) parts.push('<span class="moved">' + esc(s.reason) + "</span>");
    if (s.extraHours) parts.push('<span class="moved">+' + A.hrs(s.extraHours) + " " + L("added (make-up)", "เพิ่ม (ชดเชย)") + "</span>");
    return parts.join("<br>");
  };

  /* ------------------------------------------------------------ move / reschedule a lesson */
  A.reschedule = function (s, preset) {
    var enr = A.byId("enrolments", s.enrolmentId);
    if (!A.canEditEnrolment(enr)) return;
    preset = preset || {};
    var dlg = A.form({
      title: L("Move lesson", "เลื่อน / ย้ายคาบเรียน") + " · " + when(s),
      intro: esc(A.enrolmentLabel(enr)) + " · " + L("currently ", "เดิม ") + "<b>" + A.hrs(s.hours) + "</b>",
      submit: L("Move lesson", "ยืนยันการย้ายคาบ"),
      fields: [
        { name: "date", label: L("New date", "วันที่ใหม่"), type: "date", value: preset.date || s.date, required: true },
        { name: "start", label: L("New start time", "เวลาเริ่มใหม่"), type: "time", value: preset.start || s.start, required: true },
        { name: "hours", label: L("Hours on the new date", "จำนวนชั่วโมงในวันใหม่"), type: "number", step: "0.25", min: 0.25, value: preset.hours || s.hours, required: true },
        { name: "reason", label: L("Reason", "เหตุผล"), value: preset.reason || "" },
        { name: "gap", label: L("If the new lesson is shorter, the missing hours…", "ถ้าคาบใหม่สั้นกว่าเดิม ชั่วโมงที่ขาด…"), type: "select", full: true, value: "next", options: [
          ["next", L("…are added to the next lesson", "…เพิ่มในคาบถัดไป")],
          ["makeup", L("…are booked as a make-up lesson (date below)", "…นัดเป็นคาบชดเชย (ระบุวันด้านล่าง)")],
          ["later", L("…stay 'to schedule' for now", "…เก็บไว้เป็น 'ยังต้องนัด' ก่อน")]] },
        { name: "mdate", label: L("Make-up date", "วันที่เรียนชดเชย"), type: "date", value: "" },
        { name: "mstart", label: L("Make-up start time", "เวลาเริ่มคาบชดเชย"), type: "time", value: s.start }
      ],
      onReady: function (form) {
        var info = document.createElement("p"); info.className = "mf-diff mf-full"; form.querySelector(".mf-grid").appendChild(info);
        function upd() {
          var d = Math.round(((+s.hours || 0) - (+form.elements.hours.value || 0)) * 100) / 100;
          var gapRow = form.elements.gap.closest(".mf"), mk = form.elements.gap.value === "makeup";
          gapRow.hidden = !(d > 0);
          form.elements.mdate.closest(".mf").hidden = form.elements.mstart.closest(".mf").hidden = !(d > 0 && mk);
          info.textContent = d > 0 ? L("Shorter by " + A.num(d) + " h.", "สั้นลง " + A.num(d) + " ชม.") : d < 0 ? L("Longer by " + A.num(-d) + " h — this uses more of the package.", "ยาวขึ้น " + A.num(-d) + " ชม. จะใช้ชั่วโมงในแพ็กเกจมากขึ้น") : L("Same length.", "จำนวนชั่วโมงเท่าเดิม");
        }
        ["hours", "gap"].forEach(function (n) { form.elements[n].addEventListener("input", upd); form.elements[n].addEventListener("change", upd); });
        upd();
      },
      validate: function (v) {
        if (v.date === s.date && v.start === s.start && +v.hours === +s.hours) return L("Nothing changed.", "ยังไม่มีการเปลี่ยนแปลง");
        if (+v.hours < +s.hours && v.gap === "makeup" && !v.mdate) return L("Choose a date for the make-up lesson.", "กรุณาเลือกวันเรียนชดเชย");
      },
      onSave: function (v) {
        var probe = Object.assign({}, s, { id: "probe", date: v.date, start: v.start, hours: +v.hours, status: "scheduled" });
        return A.clashOK([probe], [s.id]).then(function (ok) { if (!ok) return false; return doMove(v); });
      }
    });
    function doMove(v) {
      {
        var diff = Math.round(((+s.hours || 0) - (+v.hours || 0)) * 100) / 100;
        var ns = { id: A.uid("s"), enrolmentId: s.enrolmentId, date: v.date, start: v.start, hours: +v.hours, status: "scheduled", mode: s.mode, location: s.location, teacherId: s.teacherId, movedFrom: s.id, createdAt: new Date().toISOString() };
        A.db.sessions.push(ns);
        Object.assign(s, { status: "rescheduled", movedTo: ns.id, reason: v.reason });
        var note = "";
        if (diff > 0.001 && v.gap === "next") {
          var nx = nextScheduled(s.enrolmentId, ns.date + ns.start, ns.id);
          if (nx) { nx.hours = Math.round(((+nx.hours || 0) + diff) * 100) / 100; nx.extraHours = Math.round(((+nx.extraHours || 0) + diff) * 100) / 100; note = L(" · +" + A.num(diff) + " h added to " + when(nx), " · เพิ่ม " + A.num(diff) + " ชม. ในคาบ " + when(nx)); }
          else note = L(" · no later lesson yet, " + A.num(diff) + " h left to schedule", " · ยังไม่มีคาบถัดไป เหลือ " + A.num(diff) + " ชม. รอนัด");
        } else if (diff > 0.001 && v.gap === "makeup") {
          A.db.sessions.push({ id: A.uid("s"), enrolmentId: s.enrolmentId, date: v.mdate, start: v.mstart || s.start, hours: diff, status: "scheduled", mode: s.mode, teacherId: s.teacherId, makeUpFor: s.id, createdAt: new Date().toISOString() });
          note = L(" · make-up " + A.num(diff) + " h on " + A.fmtDate(v.mdate), " · ชดเชย " + A.num(diff) + " ชม. วันที่ " + A.fmtDate(v.mdate));
        } else if (diff > 0.001) note = L(" · " + A.num(diff) + " h left to schedule", " · เหลือ " + A.num(diff) + " ชม. รอนัด");
        if (preset.requestId) {
          var r = A.byId("requests", preset.requestId);
          if (r) Object.assign(r, { status: "approved", decidedBy: A.me.id, decidedAt: new Date().toISOString(), result: ns.id, resultText: L("Moved to ", "ย้ายไป ") + A.fmtDate(ns.date) + " " + A.span(ns) + note.replace(/^ · /, " · ") });
        }
        A.logAct("Moved lesson " + s.date + " → " + v.date + " (" + v.hours + " h) · " + A.enrolmentLabel(enr) + note.replace(/<[^>]+>/g, ""));
        return A.save().then(function (ok) { if (ok) { A.toast(L("Lesson moved", "ย้ายคาบแล้ว") + note); A.route(); } });
      }
    }
    return dlg;
  };

  /* fill a gap from the hours panel */
  function gapNext(enr) {
    var st = A.stats(enr), nx = nextScheduled(enr.id, A.today() + "00:00");
    if (!nx) return A.toast(L("There is no upcoming lesson. Book a make-up lesson instead.", "ยังไม่มีคาบถัดไป กรุณานัดคาบชดเชยแทน"), "warn");
    if (!confirm(L("Add " + A.num(st.unscheduled) + " h to the lesson on " + when(nx) + "? It becomes " + A.num(+nx.hours + st.unscheduled) + " h.", "เพิ่ม " + A.num(st.unscheduled) + " ชม. ในคาบวันที่ " + when(nx) + "? คาบนี้จะเป็น " + A.num(+nx.hours + st.unscheduled) + " ชม."))) return;
    nx.hours = Math.round((+nx.hours + st.unscheduled) * 100) / 100;
    nx.extraHours = Math.round(((+nx.extraHours || 0) + st.unscheduled) * 100) / 100;
    A.logAct("Added " + st.unscheduled + " h to lesson " + nx.date + " · " + A.enrolmentLabel(enr));
    A.save().then(function () { A.toast(L("Added to the next lesson", "เพิ่มในคาบถัดไปแล้ว")); A.route(); });
  }

  /* ------------------------------------------------------------ learners: read-only lesson + change requests */
  A.viewLesson = function (s) {
    if (!s || !s.id) return;
    var e = A.byId("enrolments", s.enrolmentId), future = s.status === "scheduled" && s.date >= A.today();
    var dlg = document.createElement("dialog"); dlg.className = "modal";
    dlg.innerHTML = '<div class="modal__box"><header><h2>' + esc(when(s)) + '</h2><button type="button" class="ibtn" data-x aria-label="Close">✕</button></header><div class="mf-grid">' +
      '<dl class="dl mf-full"><dt>' + L("Course", "หลักสูตร") + "</dt><dd>" + esc(A.courseName(e.courseCode)) + "</dd><dt>" + L("Learner", "ผู้เรียน") + "</dt><dd>" + esc(A.userName(e.studentId)) + "</dd><dt>" + L("Teacher", "ครู") + "</dt><dd>" + esc(A.userName(s.teacherId || e.teacherId)) + "</dd>" +
      "<dt>" + L("Hours", "ชั่วโมง") + "</dt><dd>" + A.hrs(s.hours) + "</dd><dt>" + L("Status", "สถานะ") + "</dt><dd>" + A.badge(s.status) + "</dd>" +
      (A.lessonNote(s) ? "<dt>" + L("Notes", "บันทึก") + "</dt><dd>" + A.lessonNote(s) + "</dd>" : "") + "</dl></div>" +
      "<footer><span class=\"spacer\"></span>" + (future ? '<button type="button" class="btn btn--primary" data-req>' + L("Request a change", "ขอเปลี่ยนแปลง") + "</button>" : "") + '<button type="button" class="btn" data-x>' + L("Close", "ปิด") + "</button></footer></div>";
    document.body.appendChild(dlg);
    function close() { dlg.close(); dlg.remove(); }
    A.$$("[data-x]", dlg).forEach(function (b) { b.addEventListener("click", close); });
    var rq = $("[data-req]", dlg); if (rq) rq.addEventListener("click", function () { close(); A.requestChange(s); });
    dlg.showModal();
  };

  A.canApprove = function (e) { return A.isAdmin() || (A.me.role === "teacher" && A.db.org.teachersApprove && e && e.teacherId === A.me.id); };
  var REQ_TYPES = function () { return { reschedule: L("Move a lesson", "ย้ายคาบเรียน"), cancel: L("Cancel a lesson", "ยกเลิกคาบเรียน"), pause: L("Pause (time off)", "ขอหยุดเรียนช่วงหนึ่ง"), other: L("Other", "อื่น ๆ") }; };
  A.reqTypeName = function (t) { return REQ_TYPES()[t] || t; };

  A.requestChange = function (s) {
    var enrs = A.visibleEnrolments().filter(function (e) { return e.status === "active" || e.status === "paused"; });
    if (!enrs.length) return A.toast(L("There is no active course.", "ยังไม่มีหลักสูตรที่กำลังเรียน"), "warn");
    var upcoming = [];
    enrs.forEach(function (e) { A.sessionsOf(e.id).forEach(function (x) { if (x.status === "scheduled" && x.date >= A.today()) upcoming.push(x); }); });
    s = s || upcoming[0] || {};
    function enrLabel(e) { return A.courseName(e.courseCode) + (A.me.role !== "student" ? " · " + A.userName(e.studentId) : ""); }
    A.form({
      title: L("Request a change", "ขอเปลี่ยนแปลง"),
      intro: L("DeepDistrict will review and confirm. Nothing changes until it is approved.", "DeepDistrict จะพิจารณาและยืนยันให้ ตารางจะยังไม่เปลี่ยนจนกว่าจะได้รับการอนุมัติ"),
      submit: L("Send request", "ส่งคำขอ"),
      fields: [
        { name: "type", label: L("I would like to", "ต้องการ"), type: "select", full: true, value: upcoming.length ? "reschedule" : "pause", options: Object.keys(REQ_TYPES()).map(function (k) { return [k, A.reqTypeName(k)]; }) },
        { name: "sessionId", label: L("Lesson", "คาบเรียน"), type: "select", full: true, value: s.id, options: upcoming.map(function (x) { var e = A.byId("enrolments", x.enrolmentId); return [x.id, when(x) + "–" + A.endOf(x) + " · " + e.courseCode + " · " + A.hrs(x.hours) + (A.me.role !== "student" ? " · " + A.userName(e.studentId) : "")]; }) },
        { name: "enrolmentId", label: L("Course", "หลักสูตร"), type: "select", full: true, value: s.enrolmentId || enrs[0].id, options: enrs.map(function (e) { return [e.id, enrLabel(e)]; }) },
        { name: "date", label: L("Preferred new date", "วันที่ที่สะดวก"), type: "date", value: "" },
        { name: "start", label: L("Preferred time", "เวลาที่สะดวก"), type: "time", value: s.start || "" },
        { name: "hours", label: L("Hours", "จำนวนชั่วโมง"), type: "number", step: "0.25", min: 0.25, value: s.hours || 1 },
        { name: "from", label: L("Time off from", "หยุดตั้งแต่วันที่"), type: "date", value: "" },
        { name: "to", label: L("until (inclusive)", "ถึงวันที่ (รวมวันนี้)"), type: "date", value: "" },
        { name: "note", label: L("Message", "ข้อความ"), type: "textarea", full: true, value: "" }
      ],
      onReady: function (form) {
        function vis() {
          var t = form.elements.type.value;
          var show = { sessionId: t === "reschedule" || t === "cancel", enrolmentId: t === "pause" || t === "other", date: t === "reschedule", start: t === "reschedule", hours: t === "reschedule", from: t === "pause", to: t === "pause" };
          Object.keys(show).forEach(function (k) { form.elements[k].closest(".mf").hidden = !show[k]; });
        }
        form.elements.type.addEventListener("change", vis); vis();
      },
      validate: function (v) {
        if ((v.type === "reschedule" || v.type === "cancel") && !v.sessionId) return L("There is no upcoming lesson to change.", "ไม่มีคาบเรียนที่จะถึงให้เปลี่ยนแปลง");
        if (v.type === "reschedule" && !v.date) return L("Choose the new date you would like.", "กรุณาเลือกวันที่ที่สะดวก");
        if (v.type === "pause" && (!v.from || !v.to || v.to < v.from)) return L("Choose the first and last day of the time off.", "กรุณาเลือกวันแรกและวันสุดท้ายที่ต้องการหยุด");
        if (v.type === "other" && !v.note) return L("Please write what you need.", "กรุณาระบุสิ่งที่ต้องการ");
      },
      onSave: function (v) {
        var x = v.sessionId && A.byId("sessions", v.sessionId);
        var r = { id: A.uid("r"), type: v.type, note: v.note, status: "pending", createdBy: A.me.id, createdAt: new Date().toISOString() };
        if (v.type === "reschedule" || v.type === "cancel") Object.assign(r, { enrolmentId: x.enrolmentId, sessionId: x.id });
        else r.enrolmentId = v.enrolmentId;
        if (v.type === "reschedule") Object.assign(r, { date: v.date, start: v.start, hours: +v.hours });
        if (v.type === "pause") Object.assign(r, { from: v.from, to: v.to });
        A.db.requests.push(r);
        A.logAct("Request: " + v.type + (x ? " lesson " + x.date : v.from ? " " + v.from + "–" + v.to : ""));
        return A.save().then(function (ok) { if (ok) { A.toast(L("Request sent — DeepDistrict will confirm.", "ส่งคำขอแล้ว — DeepDistrict จะยืนยันให้")); location.hash = "#/requests"; A.route(); } });
      }
    });
  };

  /* Approving a pause: lessons inside the period are cancelled and, by default, the same
     number of hours is booked again after the last lesson using the learner's regular times. */
  A.approvePause = function (r) {
    var e = A.byId("enrolments", r.enrolmentId);
    var inside = A.sessionsOf(e.id).filter(function (x) { return x.status === "scheduled" && x.date >= r.from && x.date <= r.to; });
    var hrs = inside.reduce(function (t, x) { return t + (+x.hours || 0); }, 0);
    var pattern = e.pattern && e.pattern.length ? e.pattern : inside.map(function (x) { return { day: A.parse(x.date).getDay(), start: x.start, end: A.endOf(x), location: x.location }; })
      .filter(function (p, i, arr) { return arr.findIndex(function (q) { return q.day === p.day && q.start === p.start; }) === i; });
    var last = A.sessionsOf(e.id).filter(function (x) { return x.status === "scheduled"; }).map(function (x) { return x.date; }).sort().pop() || r.to;
    A.form({
      title: L("Approve time off", "อนุมัติการหยุดเรียน") + " · " + A.fmtDate(r.from) + " – " + A.fmtDate(r.to),
      intro: esc(A.enrolmentLabel(e)) + "<br>" + L(inside.length + " lesson(s), " + A.num(hrs) + " h fall in this period.", "มี " + inside.length + " คาบ รวม " + A.num(hrs) + " ชม. อยู่ในช่วงนี้"),
      submit: L("Approve", "อนุมัติ"),
      fields: [
        { name: "how", label: L("What happens to those lessons", "คาบเรียนในช่วงนี้"), type: "select", full: true, value: "postpone", options: [["postpone", L("Postpone: add the same hours after the last lesson", "เลื่อนไปต่อท้าย: เพิ่มชั่วโมงเท่าเดิมหลังคาบสุดท้าย")], ["cancel", L("Cancel only (hours go back to 'to schedule')", "ยกเลิกอย่างเดียว (ชั่วโมงกลับไปเป็น 'ยังต้องนัด')")]] },
        { name: "from", label: L("Book again from", "นัดใหม่ตั้งแต่วันที่"), type: "date", value: A.addDays(last > r.to ? last : r.to, 1) },
        { name: "pattern", label: L("Days & times for the new lessons", "วันและเวลาของคาบใหม่"), type: "slots", value: pattern },
        { name: "reply", label: L("Reply to the learner / parent", "ข้อความตอบกลับผู้เรียน / ผู้ปกครอง"), type: "textarea", full: true, value: "" }
      ],
      onReady: function (form) { function vis() { var p = form.elements.how.value === "postpone"; form.elements.from.closest(".mf").hidden = !p; form.querySelector("[data-slots]").hidden = !p; } form.elements.how.addEventListener("change", vis); vis(); },
      onSave: function (v) {
        var made = v.how === "postpone" && hrs > 0 ? A.generateLessons(e, { pattern: v.pattern, from: v.from, hours: hrs }) : [];
        return A.clashOK(made, inside.map(function (x) { return x.id; })).then(function (ok) {
          if (!ok) return false;
          inside.forEach(function (x) { x.status = "cancelled"; x.reason = L("Time off ", "หยุดเรียน ") + r.from + "–" + r.to; x.pauseOf = r.id; });
          made.forEach(function (x) { x.afterPause = r.id; });
          Array.prototype.push.apply(A.db.sessions, made);
          var result = L(inside.length + " lesson(s) (" + A.num(hrs) + " h) cancelled", "ยกเลิก " + inside.length + " คาบ (" + A.num(hrs) + " ชม.)") +
            (made.length ? L("; " + made.length + " lesson(s) booked " + A.fmtDate(made[0].date) + " – " + A.fmtDate(made[made.length - 1].date), "; นัดใหม่ " + made.length + " คาบ " + A.fmtDate(made[0].date) + " – " + A.fmtDate(made[made.length - 1].date)) : "");
          Object.assign(r, { status: "approved", decidedBy: A.me.id, decidedAt: new Date().toISOString(), reply: v.reply, resultText: result });
          A.logAct("Approved time off " + r.from + "–" + r.to + " · " + A.enrolmentLabel(e) + " · " + result);
          return A.save().then(function () { A.toast(L("Approved: ", "อนุมัติแล้ว: ") + result); A.route(); });
        });
      }
    });
  };

  A.pages.requests = function (q) {
    var show = q.get("show") || (A.isStaff() ? "pending" : "all"), type = q.get("type") || "", from = q.get("from") || "", to = q.get("to") || "";
    var list = (A.db.requests || []).filter(function (r) {
      var d = (r.createdAt || "").slice(0, 10);
      return (show === "all" || r.status === show) && (!type || r.type === type) && (!from || d >= from) && (!to || d <= to);
    }).sort(function (a, b) { return (b.createdAt || "").localeCompare(a.createdAt || ""); });
    var REQ = { pending: L("Waiting", "รอพิจารณา"), approved: L("Approved", "อนุมัติแล้ว"), declined: L("Declined", "ไม่อนุมัติ"), withdrawn: L("Withdrawn", "ถอนคำขอ") };
    function asked(r) {
      if (r.type === "reschedule") return r.date ? A.fmtDate(r.date, { weekday: "short", day: "numeric", month: "short" }) + " " + (r.start || "") + " · " + A.hrs(r.hours) : "–";
      if (r.type === "pause") return A.fmtDate(r.from) + " – " + A.fmtDate(r.to);
      return "";
    }
    var rows = list.map(function (r) {
      var s = A.byId("sessions", r.sessionId), e = A.byId("enrolments", r.enrolmentId) || {};
      var act = "";
      if (r.status === "pending" && A.canApprove(e)) act = '<button class="btn btn--xs btn--primary" data-act="req-approve" data-id="' + r.id + '">' + L("Approve…", "อนุมัติ…") + '</button> <button class="btn btn--xs" data-act="req-decline" data-id="' + r.id + '">' + L("Decline", "ไม่อนุมัติ") + "</button>";
      else if (r.status === "pending" && A.isStaff()) act = '<span class="muted">' + L("Admin approves", "รอผู้ดูแลระบบอนุมัติ") + "</span>";
      if (r.status === "pending" && r.createdBy === A.me.id && !A.isStaff()) act = '<button class="btn btn--xs" data-act="req-withdraw" data-id="' + r.id + '">' + L("Withdraw", "ถอนคำขอ") + "</button>";
      return { cells: [esc(A.fmtDate((r.createdAt || "").slice(0, 10))), esc(A.userName(e.studentId)) + "<br><span class=muted>" + esc(e.courseCode || "") + " · " + L("by ", "โดย ") + esc(A.userName(r.createdBy)) + "</span>",
        "<b>" + esc(A.reqTypeName(r.type)) + "</b>" + (s ? "<br><span class=muted>" + esc(when(s)) + " · " + A.hrs(s.hours) + "</span>" : ""),
        esc(asked(r)) + (r.note ? "<br><span class=muted>" + esc(r.note) + "</span>" : ""),
        '<span class="badge badge--' + (r.status === "approved" ? "done" : r.status === "pending" ? "scheduled" : "cancelled") + '">' + esc(REQ[r.status] || r.status) + "</span>" +
          (r.resultText ? '<br><span class="moved">' + esc(r.resultText) + "</span>" : "") + (r.reply ? '<br><span class="muted">“' + esc(r.reply) + "”</span>" : "") + (r.decidedBy ? '<br><span class="muted">' + esc(A.userName(r.decidedBy)) + "</span>" : ""),
        act ? '<span class="no-export">' + act + "</span>" : ""] };
    });
    var counts = {}; list.forEach(function (r) { counts[r.status] = (counts[r.status] || 0) + 1; });
    A._docBase = "requests-" + A.today(); A._report = null;
    var html = '<form class="filters" data-filters><label>' + L("Status", "สถานะ") + '<select name="show">' + A.opts([["pending", REQ.pending], ["approved", REQ.approved], ["declined", REQ.declined], ["withdrawn", REQ.withdrawn], ["all", L("All", "ทั้งหมด")]], show) + "</select></label>" +
      "<label>" + L("Type", "ประเภท") + '<select name="type">' + A.opts(Object.keys(REQ_TYPES()).map(function (k) { return [k, A.reqTypeName(k)]; }), type, L("All", "ทั้งหมด")) + "</select></label>" +
      "<label>" + L("From", "ตั้งแต่") + '<input type="date" name="from" value="' + esc(from) + '"></label><label>' + L("To", "ถึง") + '<input type="date" name="to" value="' + esc(to) + '"></label></form>' +
      (A.isStaff() ? A.exportBar('<button class="btn" data-act="req-csv">CSV</button>') : "") +
      '<div class="report report--wide report--inline" id="report">' + A.docHead(L("Change requests", "สรุปคำขอเปลี่ยนแปลง"), L(list.length + " request(s)", "ทั้งหมด " + list.length + " รายการ") + " · " + Object.keys(counts).map(function (k) { return (REQ[k] || k) + " " + counts[k]; }).join(" · "), "", "") +
      (rows.length ? A.table([L("Sent", "วันที่ส่ง"), L("Learner", "ผู้เรียน"), L("Request", "คำขอ"), L("Details", "รายละเอียด"), L("Result", "ผลการพิจารณา"), ""], rows) : A.empty("No requests here.", "ไม่มีคำขอในหมวดนี้")) +
      A.docFoot(A.today()) + "</div>";
    A._reqRows = list;
    return { title: L("Change requests", "คำขอเปลี่ยนแปลง"), actions: A.isStaff() ? "" : '<button class="btn btn--primary" data-act="req-new">+ ' + L("Request a change", "ขอเปลี่ยนแปลง") + "</button>", html: html };
  };

  /* ------------------------------------------------------------ learner / parent home */
  A.pages.home = function () {
    var learners = A.me.role === "parent" ? A.db.users.filter(function (u) { return u.guardianId === A.me.id; }) : [A.me];
    var html = '<p class="lead">' + esc(L("Hello " + (A.me.nick || A.me.name) + " 👋", "สวัสดี " + (A.me.nick || A.me.name) + " 👋")) + "</p>";
    if (!learners.length) html += A.empty("No learners are linked to your account yet. Please contact DeepDistrict.", "ยังไม่มีผู้เรียนที่ผูกกับบัญชีของคุณ กรุณาติดต่อ DeepDistrict");
    learners.forEach(function (u) {
      var enrs = A.db.enrolments.filter(function (e) { return e.studentId === u.id; });
      html += '<section class="learner"><h2>' + esc(u.name) + (u.nick ? ' <span class="muted">(' + esc(u.nick) + ")</span>" : "") + "</h2>";
      if (!enrs.length) html += A.empty("No courses yet.", "ยังไม่มีหลักสูตร");
      enrs.forEach(function (e) {
        var st = A.stats(e), today = A.today();
        var next = st.sessions.filter(function (s) { return s.status === "scheduled" && s.date >= today; }).slice(0, 3);
        var learned = st.sessions.filter(function (s) { return s.status === "done"; }).slice(-3).reverse();
        var reqs = (A.db.requests || []).filter(function (r) { return r.enrolmentId === e.id && r.status === "pending"; });
        html += '<article class="box course-card"><header><div><h3>' + esc(A.courseName(e.courseCode)) + '</h3><p class="muted">' + L("Teacher: ", "ครู: ") + esc(A.userName(e.teacherId)) + " · " + esc(A.enrStatusName(e.status)) + "</p></div>" +
          '<div class="btnrow"><a class="btn btn--sm" href="#/reports?student=' + u.id + "&enrolment=" + e.id + '">' + L("Report · PDF / image", "รายงาน · PDF / รูปภาพ") + "</a>" + '<button class="btn btn--sm" data-act="req-new">' + L("Request a change / time off", "ขอเปลี่ยนแปลง / ขอหยุดเรียน") + "</button>" + '<button class="btn btn--sm" data-act="doc-schedule" data-enr="' + e.id + '">' + L("Full schedule · PDF", "ตารางเรียนทั้งหมด · PDF") + "</button>" + '<button class="btn btn--sm" data-act="doc-schedule" data-from="today" data-enr="' + e.id + '">' + L("Remaining lessons · PDF", "ตารางที่เหลือ · PDF") + "</button>" + "</div></header>" +
          A.hoursPanel(e, st) +
          (reqs.length ? '<p class="note">' + L(reqs.length + " request(s) waiting for DeepDistrict to confirm.", "มีคำขอ " + reqs.length + " รายการ รอ DeepDistrict ยืนยัน") + ' <a href="#/requests">' + L("View", "ดู") + "</a></p>" : "") +
          '<div class="grid2"><div><h4>' + L("Next lessons", "คาบเรียนถัดไป") + "</h4>" + (next.length ? '<ul class="list">' + next.map(function (s) { return '<li><button type="button" class="linkish" data-session="' + s.id + '"><b>' + esc(when(s)) + "</b> · " + A.hrs(s.hours) + "</button>" + (s.movedFrom || s.makeUpFor ? '<span class="moved">' + (s.makeUpFor ? L("make-up", "ชดเชย") : L("moved", "เลื่อนมา")) + "</span>" : "") + "</li>"; }).join("") + "</ul>" : '<p class="muted">' + L("None booked yet.", "ยังไม่มีการนัด") + "</p>") + "</div>" +
          "<div><h4>" + L("Recently learned", "เรียนล่าสุด") + "</h4>" + (learned.length ? '<ul class="list">' + learned.map(function (s) { return "<li><span><b>" + esc(A.fmtDate(s.date, { day: "numeric", month: "short" })) + "</b> · " + esc(s.topic || "–") + "</span></li>"; }).join("") + "</ul>" : '<p class="muted">' + L("Nothing yet.", "ยังไม่มี") + "</p>") + "</div></div>" +
          (st.fee ? '<p class="fees">' + L("Fees: ", "ค่าเรียน: ") + A.money(st.fee) + " · " + L("paid ", "ชำระแล้ว ") + A.money(st.paid) + (st.balance > 0.009 ? ' · <b class="neg">' + L("due ", "คงค้าง ") + A.money(st.balance) + "</b>" : ' · <span class="pos">' + L("fully paid", "ชำระครบ") + "</span>") + "</p>" : "") +
          "</article>";
      });
      html += "</section>";
    });
    return { title: L("My learning", "การเรียนของฉัน"), actions: '<a class="btn" href="#/calendar">' + L("Calendar", "ปฏิทิน") + "</a>", html: html };
  };

  /* ------------------------------------------------------------ actions */
  var prev = A.onAct;
  A.onAct = function (act, b, ev) {
    var id = b.getAttribute("data-id"), enr = A.byId("enrolments", b.getAttribute("data-enr"));
    if (act === "gap-next" && enr) return gapNext(enr);
    if (act === "gap-makeup" && enr) return A.editSession(null, { enrolmentId: enr.id, hours: A.stats(enr).unscheduled, date: A.addDays(A.today(), 1), start: "16:00" });
    if (act === "req-new") return A.requestChange();
    if (act === "req-approve") {
      var r = A.byId("requests", id), s = r && r.sessionId && A.byId("sessions", r.sessionId);
      if (!r) return;
      if (r.type === "pause") return A.approvePause(r);
      if (r.type === "other") {
        var rep = prompt(L("Reply (what was agreed):", "ข้อความตอบกลับ (สิ่งที่ตกลงกัน):"), "");
        if (rep === null) return;
        Object.assign(r, { status: "approved", reply: rep, decidedBy: A.me.id, decidedAt: new Date().toISOString(), resultText: rep });
        return A.save().then(function () { A.route(); });
      }
      if (!s || s.status !== "scheduled") return A.toast(L("The lesson is no longer scheduled.", "คาบเรียนนี้ไม่ได้อยู่ในสถานะนัดเรียนแล้ว"), "err");
      if (r.type === "cancel") {
        if (!confirm(L("Cancel the lesson on " + when(s) + "? Its hours go back to 'to schedule'.", "ยกเลิกคาบวันที่ " + when(s) + "? ชั่วโมงจะกลับไปเป็น 'ยังต้องนัด'"))) return;
        s.status = "cancelled"; s.reason = r.note || "";
        Object.assign(r, { status: "approved", decidedBy: A.me.id, decidedAt: new Date().toISOString(), resultText: L("Lesson cancelled; " + A.num(s.hours) + " h to schedule", "ยกเลิกคาบแล้ว; " + A.num(s.hours) + " ชม. รอนัดใหม่") });
        A.logAct("Approved cancellation of lesson " + s.date);
        return A.save().then(function () { A.route(); });
      }
      return A.reschedule(s, { date: r.date, start: r.start, hours: r.hours, reason: r.note, requestId: r.id });
    }
    if (act === "req-csv") {
      var rows = [["sent", "learner", "course", "type", "lesson", "requested", "from", "to", "note", "status", "result", "reply", "decided by"]];
      (A._reqRows || []).forEach(function (r) { var e = A.byId("enrolments", r.enrolmentId) || {}, s2 = A.byId("sessions", r.sessionId); rows.push([(r.createdAt || "").slice(0, 10), A.userName(e.studentId), e.courseCode, r.type, s2 ? s2.date + " " + s2.start : "", r.date ? r.date + " " + (r.start || "") + " " + (r.hours || "") + "h" : "", r.from, r.to, r.note, r.status, r.resultText, r.reply, A.userName(r.decidedBy)]); });
      return A.download("requests-" + A.today() + ".csv", A.csv(rows), "text/csv;charset=utf-8");
    }
    if (act === "req-decline") {
      var rd = A.byId("requests", id), why = prompt(L("Reply to the learner (optional):", "ข้อความตอบกลับ (ไม่บังคับ):"), "");
      if (why === null) return;
      Object.assign(rd, { status: "declined", reply: why, decidedBy: A.me.id, decidedAt: new Date().toISOString() });
      A.logAct("Declined a change request");
      return A.save().then(function () { A.route(); });
    }
    if (act === "req-withdraw") {
      Object.assign(A.byId("requests", id), { status: "withdrawn" });
      return A.save().then(function () { A.route(); });
    }
    if (prev) prev(act, b, ev);
  };
})();
