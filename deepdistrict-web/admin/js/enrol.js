/* ==========================================================================
   DeepDistrict back office — enrol a student on one page  (#/enrol)
   1 Student (existing or new, with parent)  2 Course & teacher
   3 Timetable: which days, the start time on each day, hours per lesson,
     the first day, and when it ends (a date, a number of hours or of lessons)
     — with a live preview of every lesson date and any clash
   4 Fee & payment (admins)        Summary on the side, one Save button.
   Admins and teachers can enrol (a teacher enrols their own students).
   ========================================================================== */
(function () {
  "use strict";
  var A = window.DDA, L = A.L, esc = A.esc, $ = A.$, $$ = A.$$;
  var WEEK = [1, 2, 3, 4, 5, 6, 0];                    // Monday first
  var S = null;                                         // the form state

  /* ------------------------------------------------------------ lesson dates from a plan
     plan: { days: {1: "17:00", 3: "17:00"}, per: 1.5, from: "2026-11-09",
             endBy: "date" | "hours" | "count", to, hours, count }            */
  A.planLessons = function (plan) {
    var days = plan.days || {}, per = +plan.per || 0, out = [];
    if (!Object.keys(days).length || per <= 0 || !plan.from) return out;
    var d = A.parse(plan.from), used = 0, guard = 0;
    var needH = Math.round((+plan.hours || 0) * 100) / 100, needN = Math.floor(+plan.count || 0);
    if (plan.endBy === "date" && (!plan.to || plan.to < plan.from)) return out;
    if (plan.endBy === "hours" && needH <= 0) return out;
    if (plan.endBy === "count" && needN <= 0) return out;
    while (guard++ < 800) {
      var iso = A.iso(d);
      if (plan.endBy === "date" && iso > plan.to) break;
      var t = days[d.getDay()];
      if (t) {
        var h = per;
        if (plan.endBy === "hours") h = Math.min(per, Math.round((needH - used) * 100) / 100);
        if (h > 0.001) { out.push({ date: iso, start: t, hours: h }); used = Math.round((used + h) * 100) / 100; }
        if (plan.endBy === "hours" && used >= needH - 0.001) break;
        if (plan.endBy === "count" && out.length >= needN) break;
      }
      d.setDate(d.getDate() + 1);
    }
    return out;
  };
  A.planPattern = function (plan) {                   // the same plan as weekly slots (kept on the enrolment)
    return WEEK.filter(function (k) { return plan.days[k]; }).map(function (k) {
      return { day: k, start: plan.days[k], end: A.fromMin(A.toMin(plan.days[k]) + (+plan.per || 0) * 60) };
    });
  };

  function fresh(q) {
    var c0 = A.courses().filter(function (c) { return c.active; })[0] || A.courses()[0] || { code: "", hours: 10, rate: A.db.org.rate };
    var pre = q.get("student") && A.byId("users", q.get("student"));
    return {
      student: { mode: pre ? "existing" : (A.people("student").length ? "existing" : "new"), id: pre ? pre.id : "", name: "", nick: "", grade: "", school: "",
                 parentMode: "none", parentId: "", parentName: "", parentPhone: "" },
      course: c0.code, teacherId: A.me.role === "teacher" ? A.me.id : "", mode: "hybrid", location: "",
      plan: { days: {}, per: 1.5, from: A.addDays(A.today(), 1), endBy: "hours", to: A.addDays(A.today(), 60), hours: c0.hours || 10, count: 8 },
      rate: c0.rate != null ? c0.rate : A.db.org.rate, discount: 0, fee: null, payNow: "", payMethod: "transfer", goal: "", start: A.today()
    };
  }
  /* "Renew" — the next round of an enrolment: same student, course, teacher, days, times, lesson length,
     number of lessons and price; it starts after the last lesson of the current round. Everything can still
     be changed before saving, and the earlier round is not touched. */
  function renewal(e) {
    var S0 = fresh(new URLSearchParams()), ls = A.sessionsOf(e.id).filter(function (s) { return s.status !== "cancelled" && s.status !== "rescheduled"; });
    var last = ls.length ? ls[ls.length - 1].date : "", days = {}, per = 0;
    (e.pattern || []).forEach(function (p) { if (p.start && !days[p.day]) { days[p.day] = p.start; if (!per) per = A.slotHours(p); } });
    if (!Object.keys(days).length) ls.forEach(function (s) { var k = A.parse(s.date).getDay(); if (s.start && !days[k]) days[k] = s.start; });   // no saved pattern: use the lessons
    per = per || +e.perLesson || (ls[0] && +ls[0].hours) || 1;
    var from = last && last >= A.today() ? A.addDays(last, 1) : A.addDays(A.today(), 1);
    var n = ls.length || Math.max(1, Math.round((+e.hours || 0) / per));
    S0.student = Object.assign(S0.student, { mode: "existing", id: e.studentId });
    Object.assign(S0, { course: e.courseCode, teacherId: A.me.role === "teacher" ? A.me.id : (e.teacherId || ""), mode: e.mode || "hybrid", location: e.location || "",
      rate: +e.rate || 0, discount: +e.discount || 0, fee: e.feeTBD ? null : +e.fee || 0, goal: e.goal || "", renewOf: e.id });
    S0.plan = { days: days, per: per, from: from, endBy: "count", count: n, hours: +e.hours || n * per, to: A.addDays(from, 60) };
    return S0;
  }
  A.renewEnrolment = function (id) { location.hash = "#/enrol?renew=" + encodeURIComponent(id); };

  /* ------------------------------------------------------------ page */
  A.pages.enrol = function (q) {
    if (!A.isStaff()) return A.pages.home ? A.pages.home(q) : { title: "", html: "" };
    var prev = q.get("renew") && A.byId("enrolments", q.get("renew"));
    S = prev ? renewal(prev) : fresh(q);
    return {
      title: prev ? L("Renew — next round", "ต่อคอร์ส — รอบใหม่") : L("Enrol a student", "ลงทะเบียนเรียน"),
      actions: '<a class="btn" href="#/enrolments">' + L("Cancel", "ยกเลิก") + "</a>",
      html: (prev ? '<p class="note">↻ ' + esc(L("Next round of ", "ต่อคอร์สจากรอบเดิม: ") + A.enrolmentLabel(prev)) + " — " + esc(L("same days, times and price; check the start date and save.", "วันเวลาและราคาเดิม ตรวจสอบวันเริ่มแล้วกดบันทึก")) + "</p>" : "") +
        '<div class="enrol" data-enrol>' + '<div class="enrol__main">' + (prev ? '<section class="box enrol__quick" data-quick></section>' : "") +
        step(1, L("Student", "นักเรียน"), '<div data-sec="student"></div>') +
        step(2, L("Course & teacher", "หลักสูตรและครู"), '<div data-sec="course"></div>') +
        step(3, L("Timetable", "ตารางเรียน"), '<div data-sec="plan"></div>') +
        step(4, A.isAdmin() ? L("Fee & payment", "ค่าเรียนและการชำระเงิน") : L("Fee", "ค่าเรียน"), '<div data-sec="fee"></div>') +
        "</div>" + '<aside class="enrol__side"><div class="enrol__sum" data-sum></div></aside></div>',
      after: function () { drawAll(); }
    };
  };
  function step(n, title, body) { return '<section class="box enrol__step"><header><h2><span class="enrol__n">' + n + "</span>" + esc(title) + "</h2></header>" + body + "</section>"; }

  function drawAll() { drawQuick(); drawStudent(); drawCourse(); drawPlan(); drawFee(); drawSummary(); }
  /* Renewal: the two things that usually change — the course (same one, or the next course) and the new start date */
  function drawQuick() {
    var el = $("[data-quick]"); if (!el) return;
    var courses = A.coursesByGroup(A.courses().filter(function (c) { return c.active || c.code === S.course; })).map(function (c) { return [c.code, c.code + " · " + A.tx(c.title)]; });
    el.innerHTML = '<h2 class="enrol__qh">↻ ' + esc(L("Next round — same learner, teacher, days, times and price", "รอบใหม่ — ใช้ข้อมูลเดิม: นักเรียน ครู วันเวลา และราคา")) + "</h2>" +
      '<div class="ef-grid">' + field(L("Course (same, or the next course)", "หลักสูตร (คอร์สเดิม หรือคอร์สถัดไป)"), '<select data-q="course">' + courses.map(function (c) { return '<option value="' + esc(c[0]) + '"' + (c[0] === S.course ? " selected" : "") + ">" + esc(c[1]) + "</option>"; }).join("") + "</select>", "ef--wide") +
      field(L("New round starts on", "เริ่มรอบใหม่วันที่"), '<input type="date" data-q="from" value="' + esc(S.plan.from) + '">') + "</div>" +
      '<p class="ef-hint">' + esc(L("Everything else below is filled in from the previous round and can still be changed.", "ข้อมูลด้านล่างกรอกจากรอบเดิมให้แล้ว แก้ไขได้ทุกช่อง")) + "</p>";
  }
  function field(label, input, cls) { return '<label class="ef' + (cls ? " " + cls : "") + '"><span>' + esc(label) + "</span>" + input + "</label>"; }
  function inp(k, v, attrs) { return '<input data-k="' + k + '" value="' + esc(v == null ? "" : v) + '"' + (attrs || "") + ">"; }
  function sel(k, options, v) { return '<select data-k="' + k + '">' + A.opts(options, v) + "</select>"; }
  function seg(k, options, v) {
    return '<div class="seg2" role="radiogroup">' + options.map(function (o) { return '<button type="button" role="radio" data-seg="' + k + '" data-v="' + esc(o[0]) + '" aria-checked="' + (String(o[0]) === String(v)) + '">' + esc(o[1]) + "</button>"; }).join("") + "</div>";
  }

  /* 1 student */
  function drawStudent() {
    var el = $('[data-sec="student"]'), st = S.student, has = A.people("student").length;
    el.innerHTML = (has ? seg("student.mode", [["existing", L("Existing student", "นักเรียนที่มีในระบบ")], ["new", L("New student", "นักเรียนใหม่")]], st.mode) : "") +
      (st.mode === "existing" && has
        ? '<div class="ef-grid">' + field(L("Student", "นักเรียน"), sel("student.id", [["", L("— choose —", "— เลือก —")]].concat(A.peopleOpts("student")), st.id), "ef--wide") + "</div>"
        : '<p class="muted">' + esc(L("Students do not sign up themselves — type the name here. Only the name is needed.", "นักเรียนไม่ต้องสมัครเอง พิมพ์ชื่อที่นี่ได้เลย บังคับแค่ชื่อ")) + "</p>" +
          '<div class="ef-grid">' + field(L("Full name *", "ชื่อ-นามสกุล *"), inp("student.name", st.name, ' autocomplete="off"'), "ef--wide") +
          field(L("Nickname", "ชื่อเล่น"), inp("student.nick", st.nick)) + field(L("Grade", "ชั้น"), inp("student.grade", st.grade, ' placeholder="ม.3"')) +
          field(L("School", "โรงเรียน"), inp("student.school", st.school), "ef--wide") + "</div>" +
          '<div class="ef-sub"><b>' + esc(L("Parent / guardian", "ผู้ปกครอง")) + "</b>" +
          seg("student.parentMode", [["none", L("Later", "ใส่ภายหลัง")], ["existing", L("Existing", "มีในระบบ")], ["new", L("New", "ใหม่")]], st.parentMode) +
          (st.parentMode === "existing" ? '<div class="ef-grid">' + field(L("Parent", "ผู้ปกครอง"), sel("student.parentId", [["", "—"]].concat(A.peopleOpts("parent")), st.parentId), "ef--wide") + "</div>" : "") +
          (st.parentMode === "new" ? '<div class="ef-grid">' + field(L("Parent's name", "ชื่อผู้ปกครอง"), inp("student.parentName", st.parentName)) + field(L("Phone / LINE", "โทรศัพท์ / LINE"), inp("student.parentPhone", st.parentPhone)) + "</div>" : "") + "</div>");
  }

  /* 2 course & teacher */
  function drawCourse() {
    var el = $('[data-sec="course"]');
    var courses = A.coursesByGroup(A.courses().filter(function (c) { return c.active || c.code === S.course; })).map(function (c) { return [c.code, c.code + " · " + A.tx(c.title), A.groupName(c.group)]; });
    var teachers = A.isAdmin() ? [["", L("— later —", "— ภายหลัง —")]].concat(A.peopleOpts("staff")) : [[A.me.id, A.me.name]];
    el.innerHTML = '<div class="ef-grid">' + field(L("Course", "หลักสูตร"), sel("course", courses, S.course), "ef--wide") +
      field(L("Teacher", "ครูผู้สอน"), sel("teacherId", teachers, S.teacherId)) + field(L("How", "รูปแบบ"), sel("mode", A.MODES(), S.mode)) +
      field(L("Room / place / Zoom link", "ห้อง / สถานที่ / ลิงก์ Zoom"), inp("location", S.location), "ef--wide") + "</div>";
  }

  /* 3 timetable */
  var PER = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4];
  function drawPlan() {
    var el = $('[data-sec="plan"]'), p = S.plan;
    el.innerHTML =
      '<p class="ef-label">' + esc(L("Days and start time (each day can have its own time)", "วันที่เรียนและเวลาเริ่ม (แต่ละวันตั้งเวลาต่างกันได้)")) + "</p>" +
      '<div class="days">' + WEEK.map(function (k) {
        var on = !!p.days[k];
        return '<div class="day' + (on ? " is-on" : "") + '"><button type="button" data-day="' + k + '" aria-pressed="' + on + '">' + esc(A.dayName(k)) + "</button>" +
          (on ? '<input type="time" data-time="' + k + '" value="' + esc(p.days[k]) + '" aria-label="' + esc(A.dayName(k, true)) + '">' : "") + "</div>";
      }).join("") + "</div>" +
      '<div class="ef-grid">' +
      field(L("Hours per lesson", "ชั่วโมงต่อครั้ง"), '<select data-k="plan.per">' + PER.map(function (h) { return '<option value="' + h + '"' + (+p.per === h ? " selected" : "") + ">" + A.num(h) + " " + L("h", "ชม.") + "</option>"; }).join("") +
        (PER.indexOf(+p.per) === -1 ? '<option value="' + p.per + '" selected>' + A.num(p.per) + "</option>" : "") + "</select>") +
      field(L("First lesson on or after", "เริ่มเรียนตั้งแต่วันที่"), '<input type="date" data-k="plan.from" value="' + esc(p.from) + '">') + "</div>" +
      '<p class="ef-label">' + esc(L("Ends", "สิ้นสุดเมื่อ")) + "</p>" +
      seg("plan.endBy", [["hours", L("Hours are used up", "ครบจำนวนชั่วโมง")], ["count", L("Number of lessons", "ครบจำนวนครั้ง")], ["date", L("On a date", "ถึงวันที่กำหนด")]], p.endBy) +
      '<div class="ef-grid">' +
      (p.endBy === "hours" ? field(L("Total hours", "ชั่วโมงทั้งหมด"), '<input type="number" min="0.5" step="0.5" data-k="plan.hours" value="' + esc(p.hours) + '">') : "") +
      (p.endBy === "count" ? field(L("Number of lessons", "จำนวนครั้ง"), '<input type="number" min="1" step="1" data-k="plan.count" value="' + esc(p.count) + '">') : "") +
      (p.endBy === "date" ? field(L("Last day", "วันสุดท้าย"), '<input type="date" data-k="plan.to" value="' + esc(p.to) + '">') : "") + "</div>" +
      '<div data-preview></div>';
    drawPreview();
  }
  function lessons() { return A.planLessons(S.plan); }
  function drawPreview() {
    var el = $("[data-preview]"); if (!el) return;
    var ls = lessons();
    if (!Object.keys(S.plan.days).length) { el.innerHTML = '<p class="ef-hint">' + esc(L("Tap the days of the week the student comes.", "แตะเลือกวันในสัปดาห์ที่นักเรียนมาเรียน")) + "</p>"; return; }
    if (!ls.length) { el.innerHTML = '<p class="alert">' + esc(L("No lesson fits these settings — check the dates.", "ไม่มีคาบที่ตรงกับเงื่อนไขนี้ — ตรวจสอบวันที่")) + "</p>"; return; }
    var cands = ls.map(function (x, i) { return { id: "new" + i, date: x.date, start: x.start, hours: x.hours, status: "scheduled", mode: S.mode, location: S.location, teacherId: S.teacherId, _stu: S.student.mode === "existing" ? S.student.id : "" }; });
    var clash = {}; A.findConflicts(cands).forEach(function (c) { clash[c.cand.id] = c.why; });
    var months = {};
    cands.forEach(function (c) { var m = c.date.slice(0, 7); (months[m] = months[m] || []).push(c); });
    var total = ls.reduce(function (t, x) { return t + x.hours; }, 0), nClash = Object.keys(clash).length;
    el.innerHTML = '<div class="plan-sum"><b>' + ls.length + "</b> " + esc(L("lessons", "ครั้ง")) + " · <b>" + A.num(total) + "</b> " + esc(L("hours", "ชั่วโมง")) +
      " · " + esc(A.fmtDate(ls[0].date)) + " → " + esc(A.fmtDate(ls[ls.length - 1].date)) +
      (nClash ? ' · <span class="neg">⚠ ' + nClash + " " + esc(L("clash(es)", "ช่วงเวลาชน")) + "</span>" : ' · <span class="pos">✓ ' + esc(L("no clashes", "ไม่มีเวลาชน")) + "</span>") + "</div>" +
      A.timelineStrip(cands.map(function (c) { return { date: c.date, status: clash[c.id] ? "clash" : "scheduled", hours: c.hours, start: c.start }; }), { from: ls[0].date, to: ls[ls.length - 1].date }) +
      '<div class="plan-months">' + Object.keys(months).map(function (m) {
        return '<div class="plan-month"><b>' + esc(A.parse(m + "-01").toLocaleDateString(A.lang === "th" ? "th-TH" : "en-GB", { month: "long", year: "numeric" })) + "</b><div>" +
          months[m].map(function (c) { return '<span class="pchip' + (clash[c.id] ? " is-clash" : "") + '" title="' + esc(c.start + " · " + A.num(c.hours) + " h" + (clash[c.id] ? " · " + clash[c.id].join(", ") : "")) + '">' + esc(A.fmtDate(c.date, { weekday: "short", day: "numeric" })) + " " + esc(c.start) + "</span>"; }).join("") +
          "</div></div>";
      }).join("") + "</div>";
  }

  /* 4 fee */
  function hoursTotal() { return Math.round(lessons().reduce(function (t, x) { return t + x.hours; }, 0) * 100) / 100; }
  function feeAuto() { return Math.max(0, hoursTotal() * (+S.rate || 0) - (+S.discount || 0)); }
  function drawFee() {
    var el = $('[data-sec="fee"]'), cur = A.db.org.currency;
    el.innerHTML = '<div class="ef-grid">' +
      field(L("Rate per hour", "ราคาต่อชั่วโมง") + " (" + cur + ")", '<input type="number" min="0" step="1" data-k="rate" value="' + esc(S.rate) + '"' + (A.isAdmin() ? "" : " disabled") + ">") +
      field(L("Discount", "ส่วนลด") + " (" + cur + ")", '<input type="number" min="0" step="1" data-k="discount" value="' + esc(S.discount) + '"' + (A.isAdmin() ? "" : " disabled") + ">") +
      field(L("Total fee", "ค่าเรียนรวม") + " (" + cur + ")", '<input type="number" min="0" step="1" data-k="fee" value="' + esc(S.fee != null ? S.fee : feeAuto()) + '"' + (A.isAdmin() ? "" : " disabled") + ">") +
      (A.isAdmin() ? field(L("Paid now", "รับชำระตอนนี้") + " (" + cur + ")", '<input type="number" min="0" step="0.01" data-k="payNow" value="' + esc(S.payNow) + '" placeholder="0">') +
        field(L("Paid by", "ช่องทาง"), sel("payMethod", Object.keys(A.METHODS).map(function (k) { return [k, A.methodName(k)]; }), S.payMethod)) : "") +
      field(L("Goal / notes", "เป้าหมาย / หมายเหตุ"), '<textarea data-k="goal" rows="2">' + esc(S.goal) + "</textarea>", "ef--wide") + "</div>" +
      (A.isAdmin() ? "" : '<p class="ef-hint">' + esc(L("The fee follows the course price; an admin records payments.", "ค่าเรียนตามราคาหลักสูตร ผู้ดูแลระบบเป็นผู้บันทึกการชำระเงิน")) + "</p>");
  }

  /* summary */
  function studentLabel() {
    var st = S.student;
    if (st.mode === "existing") { var u = A.byId("users", st.id); return u ? A.userName(u.id) : ""; }
    return st.name.trim() + (st.nick.trim() ? " (" + st.nick.trim() + ")" : "");
  }
  function problems() {
    var out = [];
    if (!studentLabel()) out.push(L("Choose or type the student", "เลือกหรือพิมพ์ชื่อนักเรียน"));
    if (!S.course) out.push(L("Choose a course", "เลือกหลักสูตร"));
    if (!Object.keys(S.plan.days).length) out.push(L("Choose the days", "เลือกวันเรียน"));
    else if (!lessons().length) out.push(L("Check the timetable dates", "ตรวจสอบวันที่ในตารางเรียน"));
    return out;
  }
  function drawSummary() {
    var el = $("[data-sum]"); if (!el) return;
    [["course", S.course], ["from", S.plan.from]].forEach(function (x) { var f = $('[data-q="' + x[0] + '"]'); if (f && f !== document.activeElement && f.value !== x[1]) f.value = x[1]; });   // keep the renewal card in step
    var ls = lessons(), h = hoursTotal(), fee = S.fee != null ? +S.fee : feeAuto(), paid = +S.payNow || 0, probs = problems();
    var row = function (k, v) { return "<div><dt>" + esc(k) + "</dt><dd>" + v + "</dd></div>"; };
    // the Save button stays the same element: re-drawing it while it is being clicked (a field losing focus
    // fires "change" first) would swallow the click
    if (!el.querySelector("[data-sum-body]")) el.innerHTML = '<div data-sum-body></div><button type="button" class="btn btn--primary btn--block" data-save></button>';
    var btn = el.querySelector("[data-save]");
    btn.disabled = !!probs.length;
    btn.textContent = L("Save — create " + ls.length + " lessons", "บันทึก — สร้าง " + ls.length + " คาบในปฏิทิน");
    el.querySelector("[data-sum-body]").innerHTML = "<h3>" + esc(L("Summary", "สรุป")) + "</h3><dl>" +
      row(L("Student", "นักเรียน"), esc(studentLabel() || "—")) +
      row(L("Course", "หลักสูตร"), esc(S.course ? A.courseName(S.course) : "—")) +
      row(L("Teacher", "ครู"), esc(S.teacherId ? A.userName(S.teacherId) : "—")) +
      row(L("Days", "วันเรียน"), esc(A.planPattern(S.plan).map(function (x) { return A.dayName(x.day) + " " + x.start + "–" + x.end; }).join(", ") || "—")) +
      row(L("Lessons", "จำนวนครั้ง"), ls.length ? ls.length + " × " + A.num(S.plan.per) + " " + L("h", "ชม.") : "—") +
      row(L("Total hours", "ชั่วโมงรวม"), "<b>" + A.num(h) + "</b>") +
      row(L("First – last lesson", "คาบแรก – คาบสุดท้าย"), ls.length ? esc(A.fmtDate(ls[0].date)) + " – " + esc(A.fmtDate(ls[ls.length - 1].date)) : "—") +
      row(L("Fee", "ค่าเรียน"), "<b>" + A.money(fee) + "</b>") +
      (A.isAdmin() ? row(L("Paid now", "ชำระแล้ว"), A.money(paid)) + row(L("Balance", "คงค้าง"), '<b class="' + (fee - paid > 0.009 ? "neg" : "pos") + '">' + A.money(Math.max(0, fee - paid)) + "</b>") : "") +
      "</dl>" +
      (probs.length ? '<ul class="enrol__todo">' + probs.map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("") + "</ul>" : "");
  }

  /* ------------------------------------------------------------ events */
  function set(path, v) { var p = path.split("."), o = S; while (p.length > 1) o = o[p.shift()]; o[p[0]] = v; }
  document.addEventListener("input", function (e) {
    var t = e.target; if (!S || !t.closest || !t.closest("[data-enrol]")) return;
    var k = t.getAttribute("data-k"), tm = t.getAttribute("data-time");
    if (tm) { S.plan.days[tm] = t.value || "17:00"; drawPreview(); drawSummary(); return; }
    if (!k) return;
    set(k, t.type === "number" ? (t.value === "" ? "" : +t.value) : t.value);
    if (k === "fee") { S.fee = t.value === "" ? null : +t.value; }
    if (k === "course" && e.type === "input") return;
    if (/^plan\./.test(k)) { drawPreview(); var f = $('[data-k="fee"]'); if (f && S.fee == null) f.value = feeAuto(); }
    if (k === "rate" || k === "discount") { S.fee = null; var g = $('[data-k="fee"]'); if (g) g.value = feeAuto(); }
    drawSummary();
  });
  document.addEventListener("change", function (e) {
    var t = e.target; if (!S || !t.closest || !t.closest("[data-enrol]")) return;
    var k = t.getAttribute("data-k"), q = t.getAttribute("data-q");
    if (q === "from" && t.value) { S.plan.from = t.value; if (S.plan.endBy === "date" && S.plan.to < t.value) S.plan.to = A.addDays(t.value, 60); drawPlan(); drawSummary(); return; }
    if (q === "course") {   // the next course keeps the days and times; its price comes from the course
      var cq = A.course(t.value) || {};
      if (t.value !== S.course) { S.course = t.value; S.rate = cq.rate != null ? cq.rate : S.rate; S.fee = null; }
      drawCourse(); drawPlan(); drawFee(); drawSummary(); return;
    }
    if (k === "course") {
      var c = A.course(t.value) || {};
      S.course = t.value; S.rate = c.rate != null ? c.rate : S.rate; S.fee = null;
      if (S.plan.endBy === "hours" && c.hours) S.plan.hours = c.hours;
      drawPlan(); drawFee();
    }
    if (k === "teacherId" || k === "mode" || k === "student.id") { set(k, t.value); drawPreview(); }
    drawSummary();
  });
  document.addEventListener("click", function (e) {
    var t = e.target; if (!S || !t.closest || !t.closest("[data-enrol]")) return;
    var b = t.closest("[data-seg]"), d = t.closest("[data-day]");
    if (b) {
      set(b.getAttribute("data-seg"), b.getAttribute("data-v"));
      if (/^student/.test(b.getAttribute("data-seg"))) drawStudent(); else drawPlan();
      if (b.getAttribute("data-seg") === "plan.endBy") drawFee();
      drawSummary(); return;
    }
    if (d) {
      var k = d.getAttribute("data-day");
      if (S.plan.days[k]) delete S.plan.days[k];
      else S.plan.days[k] = (WEEK.map(function (x) { return S.plan.days[x]; }).filter(Boolean)[0]) || "17:00";
      S.fee = null; drawPlan(); drawFee(); drawSummary(); return;
    }
    if (t.closest("[data-save]")) save();
  });

  /* ------------------------------------------------------------ save */
  function save() {
    if (problems().length) return;
    var ls = lessons(), st = S.student, eid = A.uid("e");
    var cands = ls.map(function (x) {
      return { id: A.uid("s"), enrolmentId: eid, date: x.date, start: x.start, hours: x.hours, status: "scheduled", mode: S.mode, location: S.location, teacherId: S.teacherId, createdAt: new Date().toISOString(),
               _stu: st.mode === "existing" ? st.id : "" };
    });
    return A.clashOK(cands).then(function (ok) {
      if (!ok) return;
      cands.forEach(function (x) { delete x._stu; });
      var sid = st.id;
      if (st.mode !== "existing" || !A.people("student").length) {
        var pid = st.parentMode === "existing" ? st.parentId : "";
        if (st.parentMode === "new" && st.parentName.trim()) pid = A.upsert("users", { role: "parent", name: st.parentName.trim(), phone: st.parentPhone.trim(), active: true }).id;
        sid = A.upsert("users", { role: "student", name: st.name.trim(), nick: st.nick.trim(), grade: st.grade.trim(), school: st.school.trim(), guardianId: pid, active: true }).id;
        A.logAct("Added student " + st.name.trim());
      }
      var h = hoursTotal(), fee = S.fee != null ? +S.fee : feeAuto();
      var rec = { id: eid, studentId: sid, courseCode: S.course, teacherId: S.teacherId, mode: S.mode, location: S.location, hours: h, rate: +S.rate || 0, discount: +S.discount || 0,
                  fee: fee, start: S.start, status: "active", goal: S.goal, pattern: A.planPattern(S.plan), perLesson: +S.plan.per,
                  planEnd: { by: S.plan.endBy, to: S.plan.endBy === "date" ? S.plan.to : ls[ls.length - 1].date }, createdAt: new Date().toISOString() };
      if (S.renewOf) rec.renewOf = S.renewOf;                 // the next round of an earlier enrolment
      A.db.enrolments.push(rec);
      Array.prototype.push.apply(A.db.sessions, cands);
      var paid = +S.payNow || 0;
      if (paid > 0 && A.isAdmin()) A.db.payments.push({ id: A.uid("p"), enrolmentId: eid, date: A.today(), amount: paid, method: S.payMethod, ref: A.nextReceiptNo(), createdAt: new Date().toISOString() });
      A.logAct("Enrolled " + A.enrolmentLabel(rec) + " · " + cands.length + " lessons " + ls[0].date + " → " + ls[ls.length - 1].date);
      return A.save().then(function (okSave) {
        if (!okSave) return;
        A.toast(L(cands.length + " lessons added to the calendar", "เพิ่ม " + cands.length + " คาบในปฏิทินแล้ว"));
        S = null;
        location.hash = "#/enrolment/" + eid;
        var renewed = !!rec.renewOf;   // a renewal opens the courteous payment notice (bank transfer details)
        if (A.isAdmin()) setTimeout(function () { var e = A.byId("enrolments", eid); if (e) (renewed ? A.openPaymentNotice : A.openPack)(e); }, 400);
      });
    }).catch(function (err) { A.toast(L("Not saved: ", "บันทึกไม่สำเร็จ: ") + err.message, "err"); if (window.console) console.error(err); });
  }
})();

/* ==========================================================================
   Learning timeline: every lesson from the first to the last day, and what was
   learned / what is left as of any date (today by default).
   ========================================================================== */
(function () {
  "use strict";
  var A = window.DDA, L = A.L, esc = A.esc, $ = A.$;
  var DAY = 864e5;
  function t(iso) { return A.parse(iso).getTime(); }

  /* points: [{date, status, hours, start}]; opts: {from, to, asOf} */
  A.timelineStrip = function (points, opts) {
    opts = opts || {};
    if (!points.length) return "";
    var from = opts.from || points[0].date, to = opts.to || points[points.length - 1].date;
    if (to <= from) to = A.addDays(from, 1);
    var t0 = t(from), span = t(to) - t0;
    var pos = function (iso) { return Math.max(0, Math.min(100, (t(iso) - t0) / span * 100)); };
    var ticks = [], d = A.parse(from); d.setDate(1); d.setMonth(d.getMonth() + 1);
    while (A.iso(d) <= to && ticks.length < 24) { ticks.push(A.iso(d)); d.setMonth(d.getMonth() + 1); }
    var today = A.today(), mark = function (iso, cls, label) { return iso >= from && iso <= to ? '<i class="tl__mark ' + cls + '" style="left:' + pos(iso) + '%"><b>' + esc(label) + "</b></i>" : ""; };
    // bold variant for documents: thick track, filled up to the as-of date, every lesson numbered, start/end flags
    var big = !!opts.big, fillTo = opts.fill || "", n = 0;
    var numbered = big && points.length <= 48;
    return '<div class="tl' + (big ? " tl--big" : "") + '" role="img" aria-label="' + esc(L("Timeline from ", "ไทม์ไลน์ตั้งแต่ ") + A.fmtDate(from) + " – " + A.fmtDate(to)) + '"><div class="tl__track">' +
      (big ? '<i class="tl__line"></i>' + (fillTo && fillTo >= from ? '<i class="tl__fill" style="width:' + pos(fillTo > to ? to : fillTo) + '%"></i>' : "") +
        '<span class="tl__flag tl__flag--start"><b>' + esc(L("Start", "เริ่ม")) + "</b> " + esc(A.fmtDate(from, { day: "numeric", month: "short" })) + "</span>" +
        '<span class="tl__flag tl__flag--end"><b>' + esc(L("Finish", "จบ")) + "</b> " + esc(A.fmtDate(to, { day: "numeric", month: "short" })) + "</span>" : "") +
      ticks.map(function (k) { return '<span class="tl__tick" style="left:' + pos(k) + '%">' + esc(A.parse(k).toLocaleDateString(A.lang === "th" ? "th-TH" : "en-GB", { month: "short" })) + "</span>"; }).join("") +
      points.map(function (p) { var num = numbered && p.status !== "cancelled" ? ++n : 0; return '<span class="tl__dot tl__dot--' + esc(p.status) + '" style="left:' + pos(p.date) + '%"' + (num ? ' data-n="' + num + '"' : "") + ' title="' + esc(A.fmtDate(p.date, { weekday: "short", day: "numeric", month: "short" }) + (p.start ? " " + p.start : "") + " · " + A.num(p.hours) + " h · " + (A.STATUS[p.status] ? A.statusName(p.status) : p.status)) + '"></span>'; }).join("") +
      mark(today, "tl__mark--today", L("today", "วันนี้")) + (opts.asOf && opts.asOf !== today ? mark(opts.asOf, "tl__mark--asof", A.fmtDate(opts.asOf, { day: "numeric", month: "short" })) : "") +
      '</div><div class="tl__ends"><span>' + esc(A.fmtDate(from)) + "</span><span>" + esc(A.fmtDate(to)) + "</span></div></div>";
  };

  /* learned / left as of a date; after today the booked lessons up to that date are counted as "will be learned" */
  A.asOfStats = function (e, asOf) {
    var st = A.stats(e), today = A.today(), live = st.sessions.filter(function (s) { return s.status !== "rescheduled" && s.status !== "cancelled"; });
    var done = live.filter(function (s) { return A.counts(s) && s.date <= asOf; });
    var will = asOf > today ? live.filter(function (s) { return s.status === "scheduled" && s.date <= asOf; }) : [];
    var after = live.filter(function (s) { return s.date > asOf && (s.status === "scheduled" || A.counts(s)); });
    var sum = function (l) { return l.reduce(function (x, s) { return x + (+s.hours || 0); }, 0); };
    var learned = sum(done) + sum(will);
    return { total: st.total, learned: learned, learnedN: done.length + will.length, projected: will.length > 0, left: Math.max(0, st.total - learned), leftN: after.length,
             unbooked: st.unscheduled, first: live.length ? live[0].date : "", last: live.length ? live[live.length - 1].date : "", pct: st.total ? Math.min(100, learned / st.total * 100) : 0, sessions: st.sessions };
  };

  A.timelineCard = function (e, asOf) {
    asOf = asOf || A.today();
    var x = A.asOfStats(e, asOf);
    var pts = x.sessions.filter(function (s) { return s.status !== "rescheduled"; }).map(function (s) {
      return { date: s.date, start: s.start, hours: s.hours, status: s.status === "scheduled" && s.date < A.today() ? "overdue" : s.status };
    });
    var stat = function (label, big, small, cls) { return '<div class="tlc__stat' + (cls ? " " + cls : "") + '"><span>' + esc(label) + "</span><b>" + big + "</b>" + (small ? "<small>" + small + "</small>" : "") + "</div>"; };
    return '<section class="box tlc" data-tlc="' + esc(e.id) + '"><header><h2>' + L("Learning timeline", "ไทม์ไลน์การเรียน") + "</h2>" +
      '<label class="tlc__asof">' + L("As of", "ณ วันที่") + ' <input type="date" data-asof value="' + esc(asOf) + '"></label></header>' +
      '<div class="tlc__stats">' +
      stat(x.projected ? L("Learned by then (incl. booked)", "จะเรียนแล้วถึงวันนั้น (รวมที่นัดไว้)") : L("Learned", "เรียนแล้ว"), A.num(x.learned) + " " + L("h", "ชม."), x.learnedN + " " + L("lessons", "ครั้ง"), "is-done") +
      stat(L("Left", "คงเหลือ"), A.num(x.left) + " " + L("h", "ชม."), x.leftN + " " + L("lessons booked after", "ครั้งที่นัดไว้หลังจากนั้น"), "is-left") +
      stat(L("Total", "ทั้งหมด"), A.num(x.total) + " " + L("h", "ชม."), Math.round(x.pct) + "%") +
      stat(L("First – last lesson", "คาบแรก – คาบสุดท้าย"), x.first ? esc(A.fmtDate(x.first, { day: "numeric", month: "short" })) + " – " + esc(A.fmtDate(x.last, { day: "numeric", month: "short", year: "numeric" })) : "—",
        x.unbooked > 0.001 ? L(A.num(x.unbooked) + " h not booked yet", "ยังไม่ได้นัด " + A.num(x.unbooked) + " ชม.") : L("all hours booked", "นัดครบทุกชั่วโมงแล้ว")) +
      "</div>" +
      '<div class="hbar"><i class="hbar__done" style="width:' + x.pct + '%"></i></div>' +
      (pts.length ? A.timelineStrip(pts, { from: x.first, to: x.last, asOf: asOf }) : '<p class="muted">' + L("No lessons yet.", "ยังไม่มีคาบเรียน") + "</p>") +
      '<p class="tl__legend"><span class="tl__dot tl__dot--done"></span>' + L("learned", "เรียนแล้ว") + ' <span class="tl__dot tl__dot--scheduled"></span>' + L("booked", "นัดแล้ว") +
      ' <span class="tl__dot tl__dot--noshow"></span>' + L("no-show", "ขาดเรียน") + ' <span class="tl__dot tl__dot--cancelled"></span>' + L("cancelled", "ยกเลิก") +
      ' <span class="tl__dot tl__dot--overdue"></span>' + L("past, not updated", "ผ่านแล้วยังไม่อัปเดต") + "</p>" +
      '<div class="btnrow"><button class="btn btn--sm" data-act="doc-schedule" data-enr="' + esc(e.id) + '" data-asof="' + esc(asOf) + '">' + L("Schedule PDF as of this date", "PDF ตารางเรียน ณ วันที่นี้") + "</button></div></section>";
  };
  document.addEventListener("change", function (ev) {
    var i = ev.target; if (!i.matches || !i.matches("[data-asof]")) return;
    var box = i.closest("[data-tlc]"), e = box && A.byId("enrolments", box.getAttribute("data-tlc"));
    if (e && i.value) { var tmp = document.createElement("div"); tmp.innerHTML = A.timelineCard(e, i.value); box.replaceWith(tmp.firstChild); }
  });
})();
