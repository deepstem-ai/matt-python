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
      h += '<p class="note">' + L(A.hrs(gap) + " still to be booked — your teacher will arrange it.", "ยังมี " + A.hrs(gap) + " ที่รอนัดเพิ่ม ครูจะนัดให้") + "</p>";
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
        var diff = Math.round(((+s.hours || 0) - (+v.hours || 0)) * 100) / 100;
        var ns = { id: A.uid("s"), enrolmentId: s.enrolmentId, date: v.date, start: v.start, hours: +v.hours, status: "scheduled", mode: s.mode, teacherId: s.teacherId, movedFrom: s.id, createdAt: new Date().toISOString() };
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
          if (r) Object.assign(r, { status: "approved", decidedBy: A.me.id, decidedAt: new Date().toISOString(), result: ns.id });
        }
        A.logAct("Moved lesson " + s.date + " → " + v.date + " (" + v.hours + " h) · " + A.enrolmentLabel(enr) + note.replace(/<[^>]+>/g, ""));
        return A.save().then(function (ok) { if (ok) { A.toast(L("Lesson moved", "ย้ายคาบแล้ว") + note); A.route(); } });
      }
    });
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

  A.requestChange = function (s) {
    var upcoming = [];
    A.visibleEnrolments().forEach(function (e) { A.sessionsOf(e.id).forEach(function (x) { if (x.status === "scheduled" && x.date >= A.today()) upcoming.push(x); }); });
    if (!upcoming.length) return A.toast(L("There are no upcoming lessons to change.", "ไม่มีคาบเรียนที่จะถึงให้เปลี่ยนแปลง"), "warn");
    s = s || upcoming[0];
    A.form({
      title: L("Request a change", "ขอเปลี่ยนแปลงคาบเรียน"),
      intro: L("Your teacher will confirm. Nothing changes until it is approved.", "ครูจะยืนยันให้ คาบเรียนจะยังไม่เปลี่ยนจนกว่าจะได้รับการอนุมัติ"),
      submit: L("Send request", "ส่งคำขอ"),
      fields: [
        { name: "sessionId", label: L("Lesson", "คาบเรียน"), type: "select", full: true, value: s.id, required: true, options: upcoming.map(function (x) { var e = A.byId("enrolments", x.enrolmentId); return [x.id, when(x) + " · " + e.courseCode + " · " + A.hrs(x.hours) + (A.me.role === "parent" ? " · " + A.userName(e.studentId) : "")]; }) },
        { name: "type", label: L("I would like to", "ต้องการ"), type: "select", value: "reschedule", options: [["reschedule", L("Move it to another day/time", "ย้ายไปวัน/เวลาอื่น")], ["cancel", L("Cancel it", "ยกเลิกคาบนี้")]] },
        { name: "date", label: L("Preferred new date", "วันที่ที่สะดวก"), type: "date", value: "" },
        { name: "start", label: L("Preferred time", "เวลาที่สะดวก"), type: "time", value: s.start },
        { name: "hours", label: L("Hours", "จำนวนชั่วโมง"), type: "number", step: "0.25", min: 0.25, value: s.hours },
        { name: "note", label: L("Message to the teacher", "ข้อความถึงครู"), type: "textarea", full: true, value: "" }
      ],
      validate: function (v) { if (v.type === "reschedule" && !v.date) return L("Choose the new date you would like.", "กรุณาเลือกวันที่ที่สะดวก"); },
      onSave: function (v) {
        var x = A.byId("sessions", v.sessionId);
        A.db.requests.push({ id: A.uid("r"), enrolmentId: x.enrolmentId, sessionId: x.id, type: v.type, date: v.date, start: v.start, hours: +v.hours, note: v.note, status: "pending", createdBy: A.me.id, createdAt: new Date().toISOString() });
        A.logAct("Requested " + v.type + " of lesson " + x.date);
        return A.save().then(function (ok) { if (ok) { A.toast(L("Request sent", "ส่งคำขอแล้ว")); location.hash = "#/requests"; A.route(); } });
      }
    });
  };

  A.pages.requests = function (q) {
    var show = q.get("show") || "pending";
    var list = (A.db.requests || []).filter(function (r) { return show === "all" || r.status === "pending"; }).sort(function (a, b) { return (b.createdAt || "").localeCompare(a.createdAt || ""); });
    var REQ = { pending: L("Waiting", "รอพิจารณา"), approved: L("Approved", "อนุมัติแล้ว"), declined: L("Declined", "ไม่อนุมัติ"), withdrawn: L("Withdrawn", "ถอนคำขอ") };
    var rows = list.map(function (r) {
      var s = A.byId("sessions", r.sessionId), e = A.byId("enrolments", r.enrolmentId) || {};
      var asked = r.type === "cancel" ? L("Cancel", "ยกเลิก") : (r.date ? A.fmtDate(r.date, { weekday: "short", day: "numeric", month: "short" }) + " " + (r.start || "") + " · " + A.hrs(r.hours) : "–");
      var act = "";
      if (r.status === "pending" && A.isStaff() && A.canEditEnrolment(e)) act = '<button class="btn btn--xs btn--primary" data-act="req-approve" data-id="' + r.id + '">' + L("Approve…", "อนุมัติ…") + '</button> <button class="btn btn--xs" data-act="req-decline" data-id="' + r.id + '">' + L("Decline", "ไม่อนุมัติ") + "</button>";
      if (r.status === "pending" && r.createdBy === A.me.id && !A.isStaff()) act = '<button class="btn btn--xs" data-act="req-withdraw" data-id="' + r.id + '">' + L("Withdraw", "ถอนคำขอ") + "</button>";
      return { cells: [esc(A.userName(e.studentId)) + "<br><span class=muted>" + esc(e.courseCode || "") + " · " + L("by ", "โดย ") + esc(A.userName(r.createdBy)) + "</span>",
        s ? esc(when(s)) + " · " + A.hrs(s.hours) : "–", "<b>" + esc(asked) + "</b>" + (r.note ? "<br><span class=muted>" + esc(r.note) + "</span>" : "") + (r.reply ? '<br><span class="moved">' + esc(r.reply) + "</span>" : ""),
        '<span class="badge badge--' + (r.status === "approved" ? "done" : r.status === "pending" ? "scheduled" : "cancelled") + '">' + esc(REQ[r.status] || r.status) + "</span>", act] };
    });
    var html = '<div class="tabs"><a class="tab' + (show === "pending" ? " is-on" : "") + '" href="#/requests">' + L("Waiting", "รอพิจารณา") + " <span>" + A.pendingRequests().length + '</span></a><a class="tab' + (show === "all" ? " is-on" : "") + '" href="#/requests?show=all">' + L("All", "ทั้งหมด") + "</a></div>" +
      (rows.length ? A.table([L("Learner", "ผู้เรียน"), L("Lesson", "คาบเรียน"), L("Asked for", "ขอเปลี่ยนเป็น"), L("Status", "สถานะ"), ""], rows) : A.empty("No requests here.", "ไม่มีคำขอในหมวดนี้"));
    return { title: L("Change requests", "คำขอเปลี่ยนแปลง"), actions: A.isStaff() ? "" : '<button class="btn btn--primary" data-act="req-new">+ ' + L("Request a change", "ขอเปลี่ยนแปลงคาบเรียน") + "</button>", html: html };
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
          '<div class="btnrow"><a class="btn btn--sm" href="#/reports?student=' + u.id + "&enrolment=" + e.id + '">' + L("Report · PDF / image", "รายงาน · PDF / รูปภาพ") + "</a>" + (next.length ? '<button class="btn btn--sm" data-act="req-new">' + L("Request a change", "ขอเปลี่ยนแปลง") + "</button>" : "") + "</div></header>" +
          A.hoursPanel(e, st) +
          (reqs.length ? '<p class="note">' + L(reqs.length + " change request(s) waiting for the teacher.", "มีคำขอเปลี่ยนแปลง " + reqs.length + " รายการ รอครูยืนยัน") + ' <a href="#/requests">' + L("View", "ดู") + "</a></p>" : "") +
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
      var r = A.byId("requests", id), s = r && A.byId("sessions", r.sessionId);
      if (!s) return A.toast(L("The lesson no longer exists.", "ไม่พบคาบเรียนนี้แล้ว"), "err");
      if (r.type === "cancel") {
        if (!confirm(L("Cancel the lesson on " + when(s) + "? Its hours go back to 'to schedule'.", "ยกเลิกคาบวันที่ " + when(s) + "? ชั่วโมงจะกลับไปเป็น 'ยังต้องนัด'"))) return;
        s.status = "cancelled"; s.reason = r.note || "";
        Object.assign(r, { status: "approved", decidedBy: A.me.id, decidedAt: new Date().toISOString() });
        A.logAct("Approved cancellation of lesson " + s.date);
        return A.save().then(function () { A.route(); });
      }
      return A.reschedule(s, { date: r.date, start: r.start, hours: r.hours, reason: r.note, requestId: r.id });
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
