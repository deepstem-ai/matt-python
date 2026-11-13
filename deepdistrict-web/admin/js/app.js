/* ==========================================================================
   DeepDistrict back office — shell, sign-in, router and main pages
   ========================================================================== */
(function () {
  "use strict";
  var A = window.DDA, L = A.L, esc = A.esc, $ = A.$, $$ = A.$$;
  var root = document.getElementById("app");

  var ICON = {
    dashboard: '<path d="M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 3v6h8V3z"/>',
    calendar: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    people: '<circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-6 7-6s7 2 7 6M17 11a3 3 0 1 0 0-6M22 21c0-3-2-5-5-5.5"/>',
    enrol: '<path d="M4 4h16v16H4z"/><path d="M8 9h8M8 13h8M8 17h5"/>',
    sessions: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
    payments: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>',
    courses: '<path d="M4 19.5V5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2zM20 19v3H6"/>',
    reports: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8M8 9h2"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    bell: '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/>',
    more: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    tests: '<path d="M9 3h6l1 3H8z"/><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M8 11l2 2 4-4M8 17h8"/>',
    bank: '<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
    marking: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    live: '<rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/><circle cx="12" cy="10.5" r="2.5"/>',
    pdf: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><rect x="8" y="12" width="5" height="5"/><path d="M15 13h1M15 16h1"/>',
    news: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h6M7 16h10M15 12h2"/>',
    ai: '<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
    promo: '<path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1zM15 9a3 3 0 0 1 0 6M18 6a7 7 0 0 1 0 12"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'
  };
  A.ico = ico;
  function ico(n) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[n] + "</svg>"; }

  var NAV = [
    ["home", "My learning", "การเรียนของฉัน", "learner", "dashboard"],
    ["dashboard", "Dashboard", "ภาพรวม", "staff"],
    ["calendar", "Calendar", "ปฏิทิน", "all"],
    ["requests", "Change requests", "คำขอเปลี่ยนแปลง", "all", "sessions"],
    ["inbox", "Notifications", "การแจ้งเตือน", "all", "bell"],
    ["tests", "Online tests", "ข้อสอบออนไลน์", "all", "tests"],
    ["bank", "Exam item bank", "คลังข้อสอบ", "staff", "bank"],
    ["sets", "Question sets", "ชุดข้อสอบ", "staff", "tests"],
    ["live", "Live class", "ห้องเรียนสด", "staff", "live"],
    ["marking", "Writing marking", "ตรวจ Writing", "staff", "marking"],
    ["docs", "PDF documents", "เอกสาร PDF", "staff", "pdf"],
    ["enrolments", "Enrolments", "การลงทะเบียน", "staff", "enrol"],
    ["sessions", "Lessons log", "บันทึกการสอน", "staff"],
    ["people", "Students & parents", "นักเรียนและผู้ปกครอง", "staff"],
    ["payments", "Payments", "การชำระเงิน", "admin"],
    ["courses", "Courses", "หลักสูตร", "admin"],
    ["content", "Website content", "เนื้อหาเว็บไซต์", "admin", "reports"],
    ["popups", "Pop-ups", "ป๊อปอัป", "admin", "promo"],
    ["blog", "News blog", "บล็อกข่าวสาร", "admin", "news"],
    ["ai", "AI settings", "ตั้งค่า AI", "admin", "ai"],
    ["search", "Search", "ค้นหา", "staff"],
    ["reports", "Reports & export", "รายงานและส่งออก", "all"],
    ["data", "Data: remove & restore", "จัดการข้อมูล (ลบ / กู้คืน)", "admin", "settings"],
    ["settings", "Settings", "ตั้งค่า", "all"]
  ];

  /* ------------------------------------------------------------ menu & permissions by role (server: access.py) */
  var NAV_GROUPS = [["learn", "Learning", "การเรียน"], ["tests", "Tests & classes", "ข้อสอบและห้องเรียน"], ["teach", "Teaching", "งานสอน"], ["admin", "Administration", "ผู้ดูแลระบบ"], ["general", "General", "ทั่วไป"]];
  var CEIL = { all: ["admin", "teacher", "student", "parent"], staff: ["admin", "teacher"], admin: ["admin"], learner: ["student", "parent"] };
  function accessPage(p) {
    var m = A.db && A.db.access && A.db.access.pages && A.db.access.pages[p];
    if (m) return m;
    var n = NAV.filter(function (x) { return x[0] === p; })[0];
    return n ? { group: "general", ceiling: CEIL[n[3]], roles: CEIL[n[3]] } : null;
  }
  A.navGroup = function (p) { var m = accessPage(p); return m ? m.group : "general"; };
  A.canOpen = function (p) {
    if (p === "enrolment") p = "enrolments";
    var m = accessPage(p);
    return !m || A.me.role === "admin" || m.roles.indexOf(A.me.role) !== -1;
  };
  A.showLocked = function () { return !A.db.access || A.db.access.showLocked !== false; };
  A.needs = function (p) { var m = accessPage(p); return m ? m.roles.map(A.roleName).join(", ") : ""; };
  A.navLabel = function (p) { var n = NAV.filter(function (x) { return x[0] === p; })[0]; return n ? L(n[1], n[2]) : p; };
  A.NAV = NAV;

  A._lockedPage = function (q) {
    var p = q.get("p") || "", m = accessPage(p);
    var ceilingOk = m && m.ceiling.indexOf(A.me.role) !== -1;
    return { title: A.navLabel(p) + " 🔒", html: '<section class="box locked"><div class="locked__ico">' + ico("lock") + "</div><h2>" + L("This page needs a different account level", "หน้านี้ต้องใช้สิทธิ์ระดับอื่น") + "</h2>" +
      '<p>' + L("Who can open it: ", "ผู้ที่เปิดได้: ") + "<b>" + esc(A.needs(p)) + "</b>. " + L("You are signed in as ", "คุณเข้าสู่ระบบในฐานะ ") + "<b>" + esc(A.roleName(A.me.role)) + "</b>.</p>" +
      '<p class="muted">' + (ceilingOk ? L("An admin has turned this page off for your level. Ask an admin if you need it.", "ผู้ดูแลระบบปิดหน้านี้สำหรับระดับของคุณ หากต้องการใช้ โปรดติดต่อผู้ดูแลระบบ")
        : L("Ask the centre if you need access — for example, teachers get a teacher account.", "หากต้องการใช้งาน โปรดติดต่อศูนย์ เช่น ครูจะได้รับบัญชีระดับครู")) + "</p>" +
      '<a class="btn btn--primary" href="#/' + (A.isStaff() ? "dashboard" : "home") + '">' + L("Back to my start page", "กลับหน้าหลักของฉัน") + "</a></section>" };
  };

  A._accessPage = function () {
    var acc = A.db.access || { pages: {} }, roles = ["teacher", "student", "parent"];
    var rows = NAV_GROUPS.map(function (g) {
      var list = NAV.filter(function (n) { return A.navGroup(n[0]) === g[0]; });
      return '<tr class="acc-group"><th colspan="5">' + L(g[1], g[2]) + "</th></tr>" + list.map(function (n) {
        var m = accessPage(n[0]);
        return "<tr><td>" + ico(n[4] || n[0]) + " " + L(n[1], n[2]) + '</td><td class="acc-c">✓</td>' + roles.map(function (r) {
          if (m.ceiling.indexOf(r) === -1) return '<td class="acc-c muted" title="' + esc(L("Not available for this level", "ระดับนี้ใช้ไม่ได้")) + '">—</td>';
          return '<td class="acc-c"><input type="checkbox" data-acc="' + n[0] + '" data-role="' + r + '"' + (m.roles.indexOf(r) !== -1 ? " checked" : "") + (m.fixed ? " disabled" : "") + ' aria-label="' + esc(L(n[1], n[2]) + " · " + A.roleName(r)) + '"></td>';
        }).join("") + "</tr>";
      }).join("");
    }).join("");
    return { title: L("Menu & permissions", "เมนูและสิทธิ์การใช้งาน"), html:
      '<section class="box"><p class="muted">' + L("Everyone sees the full menu. Pages a person cannot open show a lock and the level they need. Untick a box to take a page away from a level. You can only limit rights — a level never gets more than it is built for (—), and admins always keep every page.",
        "ทุกคนเห็นเมนูทั้งหมด หน้าที่เปิดไม่ได้จะแสดงรูปกุญแจและระดับที่ต้องใช้ เอาเครื่องหมายออกเพื่อปิดหน้านั้นสำหรับระดับนั้น ระบบให้จำกัดสิทธิ์ได้เท่านั้น จะเพิ่มสิทธิ์เกินกว่าที่ระดับนั้นออกแบบไว้ (—) ไม่ได้ และผู้ดูแลระบบเปิดได้ทุกหน้าเสมอ") + "</p>" +
      '<label class="check"><input type="checkbox" data-acc-locked' + (A.showLocked() ? " checked" : "") + "> " + L("Show locked pages in the menu (with a lock)", "แสดงหน้าที่ล็อกไว้ในเมนู (พร้อมรูปกุญแจ)") + "</label>" +
      '<div class="tbl-wrap"><table class="tbl acc"><thead><tr><th>' + L("Page", "หน้า") + "</th><th>" + A.roleName("admin") + "</th>" + roles.map(function (r) { return "<th>" + A.roleName(r) + "</th>"; }).join("") + "</tr></thead><tbody>" + rows + "</tbody></table></div>" +
      '<div class="btnrow"><button class="btn btn--primary" data-act="acc-save">' + L("Save permissions", "บันทึกสิทธิ์") + "</button></div></section>" };
  };
  A.saveAccess = function () {
    var remove = {};
    $$("[data-acc]").forEach(function (c) { if (!c.checked && !c.disabled) (remove[c.getAttribute("data-acc")] = remove[c.getAttribute("data-acc")] || []).push(c.getAttribute("data-role")); });
    var lockedEl = $("[data-acc-locked]");
    return A.api("POST", "access", { remove: remove, showLocked: lockedEl ? lockedEl.checked : true }).then(function (r) {
      A.db.access = r; A.toast(L("Saved", "บันทึกแล้ว")); root.innerHTML = ""; A.route();
    }).catch(function (e) { A.toast(e.message, "err"); });
  };

  /* ------------------------------------------------------------ scoping for teachers */
  A.visibleEnrolments = function () {
    return A.db.enrolments.filter(function (e) { return A.me.role !== "teacher" || e.teacherId === A.me.id; });
  };
  A.canEditEnrolment = function (e) { return A.isAdmin() || (A.me.role === "teacher" && e && e.teacherId === A.me.id); };

  /* ------------------------------------------------------------ small widgets */
  A.courseStatusBadge = function (st) {
    return st === "cancelled" ? A.badge("cancelled", L("Cancelled", "ยกเลิก")) : st === "closed" ? A.badge("paused", L("Closed for now", "ปิดรับชั่วคราว")) : A.badge("done", L("Open", "เปิด"));
  };
  A.badge = function (status, label) { return '<span class="badge badge--' + esc(status) + '">' + esc(label || A.statusName(status)) + "</span>"; };
  A.bar = function (st) {
    var cls = st.remaining <= A.db.org.lowHours && st.total ? " bar--low" : "";
    return '<div class="bar' + cls + '" title="' + A.num(st.used) + " / " + A.num(st.total) + '"><i style="width:' + st.pct + '%"></i></div>';
  };
  A.empty = function (en, th, action) { return '<div class="empty"><p>' + esc(L(en, th)) + "</p>" + (action || "") + "</div>"; };
  function kpi(label, value, sub, tone) { return '<div class="kpi' + (tone ? " kpi--" + tone : "") + '"><span>' + esc(label) + "</span><strong>" + value + "</strong>" + (sub ? "<small>" + sub + "</small>" : "") + "</div>"; }
  A.kpi = kpi;
  function table(head, rows, cls) {
    return '<div class="tbl-wrap"><table class="tbl ' + (cls || "") + '"><thead><tr>' + head.map(function (h) { return "<th>" + h + "</th>"; }).join("") + "</tr></thead><tbody>" +
      rows.map(function (r) { return "<tr" + (r.attrs || "") + ">" + r.cells.map(function (c) { return "<td>" + c + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table></div>";
  }
  A.table = table;
  function opts(list, val, blank) { return (blank ? '<option value="">' + esc(blank) + "</option>" : "") + list.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(val) ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join(""); }
  A.opts = opts;
  function peopleOpts(role) { return A.people(role).filter(function (u) { return u.active !== false; }).map(function (u) { return [u.id, u.name + (u.nick ? " (" + u.nick + ")" : "")]; }); }
  A.peopleOpts = peopleOpts;
  function courseOpts() { return A.coursesByGroup(A.courses().filter(function (c) { return c.active; })).map(function (c) { return [c.code, c.code + " · " + A.tx(c.title), A.groupName(c.group)]; }); }
  function enrolmentOpts() { return A.visibleEnrolments().filter(function (e) { return e.status !== "cancelled"; }).map(function (e) { return [e.id, A.enrolmentLabel(e)]; }); }
  A.enrolmentOpts = enrolmentOpts;
  var MODES = function () { return [["online", "Zoom"], ["onsite", L("Onsite", "ที่แล็บ")], ["hybrid", L("Hybrid", "ไฮบริด")]]; };
  A.MODES = MODES;

  /* ------------------------------------------------------------ forms used across pages */
  A.editPerson = function (u, role) {
    u = u || { role: role || "student", active: true };
    var isNew = !u.id, staff = function (r) { return r === "admin" || r === "teacher"; };
    if (!A.isAdmin() && (staff(u.role) || isNew && staff(role))) return A.toast(L("Only admins can manage staff accounts.", "เฉพาะผู้ดูแลระบบเท่านั้นที่จัดการบัญชีเจ้าหน้าที่ได้"), "err");
    var roles = Object.keys(A.ROLES).filter(function (r) { return A.isAdmin() || !staff(r); }).map(function (r) { return [r, A.roleName(r)]; });
    A.form({
      title: isNew ? (u.role === "student" ? L("Add a student", "เพิ่มนักเรียน") : u.role === "parent" ? L("Add a parent", "เพิ่มผู้ปกครอง") : L("Add person", "เพิ่มบุคคล")) : L("Edit", "แก้ไข") + " · " + u.name,
      intro: isNew && u.role === "student" ? esc(L("Only the name is needed. Students do not sign up themselves — you add them here. Everything else can be filled in later.", "ใส่แค่ชื่อก็พอ นักเรียนไม่ต้องสมัครเอง ผู้ดูแลเพิ่มชื่อได้ที่นี่ ข้อมูลอื่นเพิ่มภายหลังได้")) : "",
      fields: [
        { name: "role", label: L("Role", "บทบาท"), type: "select", options: roles, value: u.role, required: true, more: isNew && !!role },
        { name: "name", label: L("Full name", "ชื่อ-นามสกุล"), value: u.name, required: true },
        { name: "nick", label: L("Nickname", "ชื่อเล่น"), value: u.nick },
        { name: "email", label: L("Email", "อีเมล"), type: "email", value: u.email, more: u.role === "student" },
        { name: "phone", label: L("Phone / LINE", "โทรศัพท์ / LINE"), value: u.phone },
        { name: "school", label: L("School / organisation", "โรงเรียน / หน่วยงาน"), value: u.school },
        { name: "grade", label: L("Grade or age", "ชั้นเรียนหรืออายุ"), value: u.grade },
        { name: "guardianId", label: L("Parent / guardian (students)", "ผู้ปกครอง (สำหรับนักเรียน)"), type: "select", options: [["", "–"], ["__new", L("+ New parent (type below)", "+ ผู้ปกครองใหม่ (พิมพ์ด้านล่าง)")]].concat(peopleOpts("parent")), value: u.guardianId },
        { name: "parentName", label: L("New parent's name", "ชื่อผู้ปกครองใหม่"), value: "" },
        { name: "parentPhone", label: L("New parent's phone / LINE", "โทรศัพท์ / LINE ผู้ปกครอง"), value: "" },
        { name: "consentDate", label: L("PDPA consent received on", "วันที่ได้รับความยินยอม PDPA"), type: "date", value: u.consentDate, more: true, hint: L("Record when the learner (or guardian for under-20s) agreed to data use.", "บันทึกวันที่ผู้เรียน (หรือผู้ปกครองกรณีอายุต่ำกว่า 20 ปี) ให้ความยินยอม") },
      ].concat(A.isAdmin() ? [
        { name: "password", label: L("Sign-in password", "รหัสผ่านเข้าระบบ"), type: "password", autocomplete: "new-password", more: !staff(u.role), hint: u.hasLogin ? L("This person can sign in. Leave empty to keep the password.", "บุคคลนี้เข้าระบบได้แล้ว เว้นว่างเพื่อใช้รหัสผ่านเดิม") : L("Optional for students and parents: set one (8+ characters, needs an email) so they can sign in and follow progress.", "ไม่บังคับสำหรับนักเรียนและผู้ปกครอง: ตั้งรหัสผ่าน (8 ตัวขึ้นไป และต้องมีอีเมล) เพื่อให้เข้ามาดูความก้าวหน้าได้") }
      ] : []).concat([
        { name: "active", label: L("Active", "ใช้งานอยู่"), type: "checkbox", value: u.active !== false, more: true },
        { name: "notes", label: L("Notes", "บันทึก"), type: "textarea", value: u.notes, full: true, more: true }
      ]),
      history: isNew ? null : { col: "users", id: u.id },
      validate: function (v) {
        if (v.role === "student" && v.guardianId === "__new" && !(v.parentName || "").trim()) return L("Type the new parent's name, or choose –.", "กรุณาพิมพ์ชื่อผู้ปกครองใหม่ หรือเลือก –");
        if (v.email && A.db.users.some(function (x) { return x.id !== u.id && (x.email || "").toLowerCase() === v.email.toLowerCase(); })) return L("This email is already used.", "อีเมลนี้มีผู้ใช้แล้ว");
        if (staff(v.role) && !v.email) return L("Staff need an email to sign in.", "เจ้าหน้าที่ต้องมีอีเมลเพื่อเข้าระบบ");
        if (staff(v.role) && !u.hasLogin && !v.password) return L("Set a password for this staff account.", "กรุณาตั้งรหัสผ่านสำหรับบัญชีเจ้าหน้าที่");
        if (v.password && !v.email) return L("An email is needed to sign in.", "ต้องมีอีเมลเพื่อใช้เข้าระบบ");
        if (v.password && v.password.length < 8) return L("Password must be at least 8 characters.", "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
        if (u.id === A.me.id && v.role !== "admin" && A.me.role === "admin" && A.people("admin").length < 2) return L("Keep at least one admin.", "ต้องมีผู้ดูแลระบบอย่างน้อย 1 คน");
      },
      onReady: function (form) {
        function upd() {
          var stu = form.elements.role.value === "student", nw = form.elements.guardianId.value === "__new";
          form.elements.guardianId.closest(".mf").hidden = !stu;
          ["parentName", "parentPhone"].forEach(function (k) { form.elements[k].closest(".mf").hidden = !(stu && nw); });
        }
        form.elements.role.addEventListener("change", upd); form.elements.guardianId.addEventListener("change", upd); upd();
      },
      onSave: function (v) {
        var pw = v.password; delete v.password;
        var pName = (v.parentName || "").trim(), pPhone = (v.parentPhone || "").trim(); delete v.parentName; delete v.parentPhone;
        if (v.guardianId === "__new") {
          v.guardianId = "";
          if (v.role === "student" && pName) { var par = A.upsert("users", { role: "parent", name: pName, phone: pPhone, active: true }); v.guardianId = par.id; A.logAct("Added parent " + pName); }
        }
        var rec = Object.assign(u, v);
        if (pw) rec.password = pw;   // sent once over the API, hashed on the server, never stored in the browser
        A.upsert("users", rec); A.logAct((isNew ? "Added " : "Updated ") + A.roleName(rec.role) + " " + rec.name);
        return A.save().then(function (ok) {
          if (!ok) return;
          A.toast(L("Saved", "บันทึกแล้ว"));
          return A.load().then(function () {
            A.route();
            if (isNew && rec.role === "student" && A.isStaff() && confirm(L("Student added. Enrol " + rec.name + " in a course now?", "เพิ่มนักเรียนแล้ว ต้องการลงทะเบียนเรียนให้ " + rec.name + " ต่อเลยไหม?"))) location.hash = "#/enrol?student=" + rec.id;
          });
        });
      }
    });
  };

  var arcView = { type: "", shown: 30 };
  A.loadArchive = function (keep) {
    var box = A.$("[data-archive]"); if (!box) return;
    if (!keep) arcView = { type: "", shown: 30 };
    box.innerHTML = '<p class="muted">' + L("Loading…", "กำลังโหลด…") + "</p>";
    var COL = { users: L("People", "บุคคล"), enrolments: L("Enrolments", "การลงทะเบียน"), sessions: L("Lessons", "คาบเรียน"), payments: L("Payments", "การชำระเงิน"), requests: L("Requests", "คำขอ") };
    A.api("GET", "archive").then(function (d) {
      var st = d.stats || {}, all = d.items, count = {}, nEx = all.filter(function (r) { return r.example; }).length;
      all.forEach(function (r) { count[r._col] = (count[r._col] || 0) + 1; });
      var list = all.filter(function (r) { return !arcView.type || r._col === arcView.type; });
      var what = function (r) {
        if (r._col === "enrolments") return (A.userName(r.studentId) !== "–" ? A.userName(r.studentId) : r.studentId) + " · " + r.courseCode;
        if (r._col === "sessions") { var e = A.byId("enrolments", r.enrolmentId); return A.fmtDate(r.date, { weekday: "short", day: "numeric", month: "short", year: "numeric" }) + " " + (r.start || "") + (e ? " · " + A.userName(e.studentId) : ""); }
        if (r._col === "payments") return (r.ref || "") + " · " + A.money(r.amount) + " · " + A.fmtDate(r.date);
        return r.name || r.type || r.id;
      };
      box.innerHTML = '<p class="muted">' + L(st.versions + " earlier versions kept · " + all.length + " archived records", "เก็บเวอร์ชันก่อนหน้า " + st.versions + " รายการ · รายการที่เก็บถาวร " + all.length + " รายการ") + "</p>" +
        (nEx ? '<p><button class="btn btn--danger btn--sm" data-act="archive-purge-examples">' + L("Remove all archived example data for good (" + nEx + ")", "ลบข้อมูลตัวอย่างที่เก็บถาวรทั้งหมดออกถาวร (" + nEx + " รายการ)") + "</button></p>" : "") +
        (all.length ? '<div class="tabs">' + [["", L("All", "ทั้งหมด"), all.length]].concat(Object.keys(COL).filter(function (k) { return count[k]; }).map(function (k) { return [k, COL[k], count[k]]; }))
          .map(function (t) { return '<button type="button" class="tab' + (t[0] === arcView.type ? " is-on" : "") + '" data-arc-type="' + t[0] + '">' + esc(t[1]) + " <span>" + t[2] + "</span></button>"; }).join("") + "</div>" +
          '<table class="tbl"><thead><tr><th>' + L("Type", "ประเภท") + "</th><th>" + L("Record", "รายการ") + "</th><th>" + L("Archived on", "เก็บถาวรเมื่อ") + "</th><th></th></tr></thead><tbody>" +
          list.slice(0, arcView.shown).map(function (r) {
            return "<tr><td>" + esc(COL[r._col] || r._col) + "</td><td>" + esc(what(r)) + A.exTag(r) + "</td><td>" + esc(new Date(r._archivedAt).toLocaleString(A.lang === "th" ? "th-TH" : "en-GB", { dateStyle: "medium", timeStyle: "short" })) +
              '</td><td class="nowrap"><button class="btn btn--xs" data-act="archive-restore" data-col="' + esc(r._col) + '" data-id="' + esc(r.id) + '">' + L("Restore", "กู้คืน") + '</button> <button class="btn btn--xs btn--danger" data-act="archive-purge" data-col="' + esc(r._col) + '" data-id="' + esc(r.id) + '">' + L("Remove for good", "ลบถาวร") + "</button></td></tr>";
          }).join("") + "</tbody></table>" +
          (list.length > arcView.shown ? '<p><button type="button" class="btn btn--sm" data-arc-more>' + L("Show " + Math.min(30, list.length - arcView.shown) + " more", "แสดงเพิ่มอีก " + Math.min(30, list.length - arcView.shown) + " รายการ") + "</button></p>" : "")
          : '<p class="muted">' + L("Nothing archived.", "ยังไม่มีรายการที่เก็บถาวร") + "</p>");
      box.querySelectorAll("[data-arc-type]").forEach(function (b) { b.addEventListener("click", function () { arcView = { type: b.getAttribute("data-arc-type"), shown: 30 }; A.loadArchive(true); }); });
      var more = box.querySelector("[data-arc-more]"); if (more) more.addEventListener("click", function () { arcView.shown += 30; A.loadArchive(true); });
    }).catch(function (e) { box.innerHTML = '<p class="alert">' + esc(e.message) + "</p>"; });
  };

  /* ------------------------------------------------------------ system menu: the only place where data is removed (admins) */
  A.loadImports = function () {
    var box = A.$("[data-imports]"); if (!box) return;
    A.api("GET", "import/batches").then(function (d) {
      box.innerHTML = d.items.length ? d.items.map(function (b) {
        return '<div class="imp"><div><b>' + esc(A.tx(b.title || { en: b.id, th: b.id })) + "</b><br><small class=\"muted\">" +
          esc(L(b.counts.users + " students · " + b.counts.enrolments + " enrolments · " + b.counts.sessions + " lessons · " + b.counts.customCourses + " courses",
                "นักเรียน " + b.counts.users + " คน · การลงทะเบียน " + b.counts.enrolments + " รายการ · คาบเรียน " + b.counts.sessions + " คาบ · หลักสูตร " + b.counts.customCourses + " หลักสูตร")) +
          "<br>" + esc(b.students.join(" · ")) + "</small></div>" +
          (b.done ? '<span class="badge badge--done">' + L("Imported ", "นำเข้าแล้ว ") + esc(new Date(b.done).toLocaleDateString(A.lang === "th" ? "th-TH" : "en-GB")) + "</span>"
            : '<button class="btn btn--primary" data-act="import-batch" data-id="' + esc(b.id) + '">' + L("Import", "นำเข้า") + "</button>") + "</div>";
      }).join("") : '<p class="muted">' + L("Nothing prepared to import.", "ไม่มีข้อมูลที่เตรียมไว้ให้นำเข้า") + "</p>";
    }).catch(function (e) { box.innerHTML = '<p class="alert">' + esc(e.message) + "</p>"; });
  };
  A.removePerson = function (u) {
    var linked = A.db.enrolments.filter(function (e) { return e.studentId === u.id; });
    A.db.enrolments.forEach(function (e) { if (e.teacherId === u.id) e.teacherId = ""; });
    linked.forEach(function (e) { A.deleteEnrolment(e.id, true); });
    A.remove("users", u.id); A.logAct("Removed (archived) " + A.roleName(u.role) + " " + u.name + (linked.length ? " with " + linked.length + " enrolment(s)" : ""));
  };
  A._dataPage = function (q) {
    if (!A.isAdmin()) return A._lockedPage(new URLSearchParams("p=data"));
    var term = (q.get("q") || "").toLowerCase(), ex = function (c) { return A.db[c].filter(function (r) { return r.example; }).length; };
    var nEx = ex("users") + ex("enrolments") + ex("sessions") + ex("payments") + ex("requests");
    var hits = [];
    if (term.length >= 2) {
      A.db.users.forEach(function (u) { if ((u.name + " " + (u.nick || "") + " " + (u.email || "") + " " + (u.phone || "")).toLowerCase().indexOf(term) !== -1 && u.id !== A.me.id) hits.push(["users", u.id, A.roleName(u.role), A.userName(u.id), u]); });
      A.db.enrolments.forEach(function (e) { if (A.enrolmentLabel(e).toLowerCase().indexOf(term) !== -1) hits.push(["enrolments", e.id, L("Enrolment", "การลงทะเบียน"), A.enrolmentLabel(e), e]); });
      A.db.payments.forEach(function (p) { var e = A.byId("enrolments", p.enrolmentId); if (((p.ref || "") + " " + (e ? A.enrolmentLabel(e) : "")).toLowerCase().indexOf(term) !== -1) hits.push(["payments", p.id, L("Payment", "การชำระเงิน"), (p.ref || "") + " · " + A.money(p.amount) + " · " + A.fmtDate(p.date), p]); });
    }
    var html =
      '<p class="note">' + L("Real data stays: the everyday screens have no delete buttons. Here an admin can take a record out of use (it is archived and can be restored), and remove an archived record for good. A sealed copy is always kept in the database's permanent archive for audit.",
        "ข้อมูลจริงจะคงอยู่: หน้าจอทั่วไปไม่มีปุ่มลบ ที่หน้านี้ผู้ดูแลระบบนำรายการออกได้ (ย้ายไปเก็บถาวรและกู้คืนได้) และลบรายการที่เก็บถาวรแล้วออกถาวรได้ ระบบยังเก็บสำเนาที่แก้ไขไม่ได้ไว้ในที่เก็บถาวรของฐานข้อมูลเพื่อการตรวจสอบเสมอ") + "</p>" +
      '<section class="box"><header><h2>' + L("Example data", "ข้อมูลตัวอย่าง") + "</h2></header>" +
      (nEx ? "<p>" + L(nEx + " example records (tagged Example) are in the system. Remove them before you start with real data.", "มีข้อมูลตัวอย่าง " + nEx + " รายการ (ป้าย ตัวอย่าง) ควรลบออกก่อนเริ่มใช้ข้อมูลจริง") + '</p><button class="btn btn--danger" data-act="example-remove">' + L("Remove all example data", "ลบข้อมูลตัวอย่างทั้งหมด") + "</button>"
        : '<p class="muted">' + L("No example data. ", "ไม่มีข้อมูลตัวอย่าง ") + '</p><button class="btn btn--sm" data-act="demo">' + L("Add the 5 example learners (for training)", "เพิ่มนักเรียนตัวอย่าง 5 คน (สำหรับฝึกใช้งาน)") + "</button>") + "</section>" +
      '<section class="box"><header><h2>' + L("Import prepared records", "นำเข้าข้อมูลที่เตรียมไว้") + '</h2></header><div data-imports><p class="muted">' + L("Loading…", "กำลังโหลด…") + "</p></div></section>" +
      '<section class="box"><header><h2>' + L("Take a record out of use", "นำรายการออกจากระบบ") + '</h2></header><form class="filters" data-filters><label>' + L("Find a person, enrolment or payment", "ค้นหาบุคคล การลงทะเบียน หรือการชำระเงิน") +
      '<input type="search" name="q" value="' + esc(q.get("q") || "") + '" placeholder="' + esc(L("name, course, receipt no.…", "ชื่อ หลักสูตร เลขที่ใบเสร็จ…")) + '"></label><button class="btn">' + L("Search", "ค้นหา") + "</button></form>" +
      (term.length >= 2 ? (hits.length ? table([L("Type", "ประเภท"), L("Record", "รายการ"), ""], hits.slice(0, 60).map(function (h) {
        return { cells: [esc(h[2]), esc(h[3]) + A.exTag(h[4]), '<button class="btn btn--xs btn--danger" data-act="remove-rec" data-col="' + h[0] + '" data-id="' + esc(h[1]) + '">' + L("Remove (archive)", "นำออก (เก็บถาวร)") + "</button>"] };
      })) : A.empty("Nothing found.", "ไม่พบรายการ")) : '<p class="muted">' + L("Type at least 2 letters.", "พิมพ์อย่างน้อย 2 ตัวอักษร") + "</p>") + "</section>" +
      '<section class="box"><header><h2>' + L("Archived records", "รายการที่เก็บถาวร") + "</h2></header>" +
      '<p class="muted">' + L("Restore puts a record back exactly as it was. Open any record and press History to see its earlier versions.", "กดกู้คืนเพื่อนำกลับมาเหมือนเดิม เปิดรายการใดก็ได้แล้วกด ประวัติการแก้ไข เพื่อดูเวอร์ชันก่อนหน้า") + '</p><div data-archive></div></section>';
    return { title: L("Data: remove & restore", "จัดการข้อมูล (ลบ / กู้คืน)"), html: html, after: function () { A.loadArchive(); A.loadImports(); } };
  };

  A.editEnrolment = function (e, preset) {
    e = e || Object.assign({ status: "active", start: A.today(), mode: "hybrid", discount: 0 }, preset || {});
    var isNew = !e.id;
    if (!A.isAdmin()) return A.toast(L("Only admins can create or change enrolments.", "เฉพาะผู้ดูแลระบบเท่านั้นที่สร้างหรือแก้ไขการลงทะเบียนได้"), "err");
    var c0 = A.course(e.courseCode) || A.courses()[0];
    A.form({
      title: isNew ? L("New enrolment", "ลงทะเบียนใหม่") : L("Edit enrolment", "แก้ไขการลงทะเบียน"),
      fields: [
        { name: "studentId", label: L("Student", "นักเรียน"), type: "select", options: (isNew ? [["__new", L("+ New student (type the name below)", "+ นักเรียนใหม่ (พิมพ์ชื่อด้านล่าง)")]] : []).concat(peopleOpts("student")), value: e.studentId || (isNew ? "__new" : ""), required: true },
        { name: "newName", label: L("New student's full name", "ชื่อ-นามสกุลนักเรียนใหม่"), value: "" },
        { name: "newNick", label: L("Nickname", "ชื่อเล่น"), value: "" },
        { name: "newGrade", label: L("Grade / school", "ชั้น / โรงเรียน"), value: "" },
        { name: "parentName", label: L("Parent's name", "ชื่อผู้ปกครอง"), value: "" },
        { name: "parentPhone", label: L("Parent's phone / LINE", "โทรศัพท์ / LINE ผู้ปกครอง"), value: "" },
        { name: "courseCode", label: L("Course", "หลักสูตร"), type: "select", options: courseOpts(), value: e.courseCode || c0.code, required: true },
        { name: "teacherId", label: L("Teacher", "ครูผู้สอน"), type: "select", options: [["", "–"]].concat(peopleOpts("staff")), value: e.teacherId },
        { name: "mode", label: L("Mode", "รูปแบบ"), type: "select", options: MODES(), value: e.mode },
        { name: "hours", label: L("Hours purchased", "จำนวนชั่วโมงที่ซื้อ"), type: "number", step: "0.5", min: 0, value: e.hours != null ? e.hours : c0.hours, required: true },
        { name: "rate", label: L("Rate per hour", "ราคาต่อชั่วโมง") + " (" + A.db.org.currency + ")", type: "number", step: "1", min: 0, value: e.rate != null ? e.rate : c0.rate, more: true },
        { name: "discount", label: L("Discount", "ส่วนลด") + " (" + A.db.org.currency + ")", type: "number", step: "1", min: 0, value: e.discount || 0, more: true },
        { name: "fee", label: L("Total fee", "ค่าเรียนรวม") + " (" + A.db.org.currency + ")", type: "number", step: "1", min: 0, value: e.fee, hint: L("Calculated from hours × rate − discount; you can override it.", "คำนวณจาก ชั่วโมง × ราคา − ส่วนลด และแก้ไขเองได้") },
        { name: "start", label: L("Enrolment date", "วันที่ลงทะเบียน"), type: "date", value: e.start, required: true },
        { name: "status", label: L("Status", "สถานะ"), type: "select", options: Object.keys(A.ENR_STATUS).map(function (k) { return [k, A.enrStatusName(k)]; }), value: e.status, more: isNew },
        { name: "pattern", label: L("Regular days & times (each day can differ)", "วันและเวลาเรียนปกติ (แต่ละวันต่างกันได้)"), type: "slots", value: e.pattern, hint: L("e.g. Mon 09:00–10:30, Tue 14:00–15:00, Wed 19:00–20:30", "เช่น จันทร์ 09:00–10:30, อังคาร 14:00–15:00, พุธ 19:00–20:30") }
      ].concat(isNew ? [
        { name: "auto", label: L("Create the lessons in the calendar now", "สร้างคาบเรียนในปฏิทินทันที"), type: "checkbox", value: true },
        { name: "firstFrom", label: L("First lesson on or after", "เริ่มคาบแรกตั้งแต่วันที่"), type: "date", value: A.addDays(e.start || A.today(), 1), more: true },
        { name: "payNow", label: L("Payment received now", "รับชำระเงินแล้วตอนนี้") + " (" + A.db.org.currency + ")", type: "number", step: "0.01", min: 0, value: "" },
        { name: "payMethod", label: L("Payment method", "ช่องทางชำระเงิน"), type: "select", value: "transfer", options: Object.keys(A.METHODS).map(function (k) { return [k, A.methodName(k)]; }) }
      ] : []).concat([
        { name: "goal", label: L("Learner goal / customisation", "เป้าหมายและการปรับหลักสูตร"), type: "textarea", value: e.goal, full: true, more: true }
      ]),
      onReady: function (form) {
        if (form.elements.newName) {
          var nf = ["newName", "newNick", "newGrade", "parentName", "parentPhone"];
          var togNew = function () { var on = form.elements.studentId.value === "__new"; nf.forEach(function (k) { form.elements[k].closest(".mf").hidden = !on; }); };
          form.elements.studentId.addEventListener("change", togNew); togNew();
        }
        var touched = e.fee != null && e.fee !== "";
        function calc() { if (!touched) form.elements.fee.value = Math.max(0, (+form.elements.hours.value || 0) * (+form.elements.rate.value || 0) - (+form.elements.discount.value || 0)); }
        form.elements.courseCode.addEventListener("change", function () { var c = A.course(form.elements.courseCode.value); if (c) { form.elements.hours.value = c.hours; form.elements.rate.value = c.rate; calc(); } });
        ["hours", "rate", "discount"].forEach(function (n) { form.elements[n].addEventListener("input", calc); });
        form.elements.fee.addEventListener("input", function () { touched = true; });
        calc();
        if (isNew) {
          var info = document.createElement("p"); info.className = "mf-diff mf-full"; form.querySelector(".mf-grid").appendChild(info);
          var upd = function () {
            var slots = A.$$(".slot", form).map(function (r) { return { day: +r.querySelector("[data-k=day]").value, start: r.querySelector("[data-k=start]").value, end: r.querySelector("[data-k=end]").value }; });
            var tmp = A.generateLessons({ id: "x", mode: form.elements.mode.value }, { pattern: slots, from: form.elements.firstFrom.value, hours: +form.elements.hours.value });
            info.textContent = form.elements.auto.checked && tmp.length ? L(tmp.length + " lessons from " + A.fmtDate(tmp[0].date) + " to " + A.fmtDate(tmp[tmp.length - 1].date), "จะสร้าง " + tmp.length + " คาบ ตั้งแต่ " + A.fmtDate(tmp[0].date) + " ถึง " + A.fmtDate(tmp[tmp.length - 1].date)) : L("No lessons will be created now.", "ยังไม่สร้างคาบเรียน");
          };
          form.addEventListener("input", upd); form.addEventListener("change", upd); upd();
        }
      },
      history: isNew ? null : { col: "enrolments", id: e.id },
      validate: function (v) { if (v.studentId === "__new" && !(v.newName || "").trim()) return L("Type the new student's name.", "กรุณาพิมพ์ชื่อนักเรียนใหม่"); if (v.auto && !v.pattern.length) return L("Add at least one day and time, or untick 'Create the lessons'.", "กรุณาเพิ่มวันและเวลาอย่างน้อย 1 รายการ หรือเอาเครื่องหมายถูก 'สร้างคาบเรียน' ออก"); },
      onSave: function (v) {
        var auto = v.auto, payNow = +v.payNow || 0, method = v.payMethod, from = v.firstFrom;
        if (+v.fee > 0 && e.feeTBD) delete e.feeTBD;           // a fee was entered: no longer "fee not set"
        var nw = { name: (v.newName || "").trim(), nick: (v.newNick || "").trim(), grade: (v.newGrade || "").trim(), pName: (v.parentName || "").trim(), pPhone: (v.parentPhone || "").trim() };
        ["auto", "payNow", "payMethod", "firstFrom", "newName", "newNick", "newGrade", "parentName", "parentPhone"].forEach(function (k) { delete v[k]; });

        var draft = Object.assign({}, e, v);
        draft.id = draft.id || A.uid("e");
        var lessons = isNew && auto ? A.generateLessons(draft, { pattern: v.pattern, from: from, hours: v.hours }) : [];
        lessons.forEach(function (x) { x._stu = draft.studentId; });
        return A.clashOK(lessons).then(function (ok) {
          if (!ok) return false;
          lessons.forEach(function (x) { delete x._stu; });
          if (draft.studentId === "__new") {              // students do not sign up themselves: the admin adds them here
            var par = nw.pName ? A.upsert("users", { role: "parent", name: nw.pName, phone: nw.pPhone, active: true }) : null;
            var stu = A.upsert("users", { role: "student", name: nw.name, nick: nw.nick, grade: nw.grade, guardianId: par ? par.id : "", active: true });
            draft.studentId = stu.id;
            A.logAct("Added student " + nw.name + (par ? " (parent " + nw.pName + ")" : ""));
          }
          var rec = A.upsert("enrolments", Object.assign(e, draft));
          Array.prototype.push.apply(A.db.sessions, lessons);
          if (payNow > 0) A.db.payments.push({ id: A.uid("p"), enrolmentId: rec.id, date: A.today(), amount: payNow, method: method, ref: A.nextReceiptNo(), createdAt: new Date().toISOString() });
          A.logAct((isNew ? "Enrolled " : "Updated enrolment ") + A.enrolmentLabel(rec) + (lessons.length ? " · " + lessons.length + " lessons created" : ""));
          return A.save().then(function (saved) {
            if (!saved) return;
            A.toast(L("Saved", "บันทึกแล้ว") + (lessons.length ? L(" · " + lessons.length + " lessons added to the calendar", " · เพิ่ม " + lessons.length + " คาบในปฏิทินแล้ว") : ""));
            if (isNew) { location.hash = "#/enrolment/" + rec.id; setTimeout(function () { A.openPack(rec); }, 300); } else A.route();
          });
        });
      }
    });
  };
  A.deleteEnrolment = function (id, silent) {
    var e = A.byId("enrolments", id);
    A.db.sessions = A.db.sessions.filter(function (s) { return s.enrolmentId !== id; });
    A.db.payments = A.db.payments.filter(function (p) { return p.enrolmentId !== id; });
    A.remove("enrolments", id);
    if (e && !silent) A.logAct("Archived enrolment " + A.enrolmentLabel(e) + " (with its lessons and payments)");
    A.save();
  };

  A.editSession = function (s, preset) {
    s = s || Object.assign({ status: "scheduled", date: A.today(), start: "16:00", hours: 1.5 }, preset || {});
    var isNew = !s.id;
    var eopts = enrolmentOpts();
    if (!eopts.length) return A.toast(L("Create an enrolment first.", "กรุณาสร้างการลงทะเบียนก่อน"), "err");
    var enr = A.byId("enrolments", s.enrolmentId);
    if (!A.isStaff()) return A.viewLesson(s);
    if (enr && !A.canEditEnrolment(enr)) return A.toast(L("You can only edit your own students' lessons. Ask an admin to set you as the teacher on this enrolment.", "แก้ไขได้เฉพาะคาบของนักเรียนที่คุณสอน กรุณาให้แอดมินกำหนดคุณเป็นครูในการลงทะเบียนนี้"), "err");
    A.form({
      title: isNew ? L("Add lesson", "เพิ่มคาบเรียน") : L("Lesson", "คาบเรียน") + " · " + A.fmtDate(s.date),
      fields: [
        { name: "enrolmentId", label: L("Enrolment", "การลงทะเบียน"), type: "select", options: eopts, value: s.enrolmentId, required: true, full: true },
        { name: "date", label: L("Date", "วันที่"), type: "date", value: s.date, required: true },
        { name: "start", label: L("Start time", "เวลาเริ่ม"), type: "time", value: s.start },
        { name: "hours", label: L("Hours", "จำนวนชั่วโมง"), type: "number", step: "0.25", min: 0.25, value: s.hours, required: true },
        { name: "status", label: L("Status", "สถานะ"), type: "select", options: Object.keys(A.STATUS).filter(function (k) { return (k !== "rescheduled" && (k !== "cancelled" || isNew)) || s.status === k; }).map(function (k) { return [k, A.statusName(k)]; }), value: s.status },
        { name: "mode", label: L("Mode", "รูปแบบ"), type: "select", options: MODES(), value: s.mode || (enr && enr.mode) || "online" },
        { name: "teacherId", label: L("Teacher", "ครูผู้สอน"), type: "select", options: [["", "–"]].concat(peopleOpts("staff")), value: s.teacherId || (enr && enr.teacherId) || (A.me.role === "teacher" ? A.me.id : "") },
        { name: "location", label: L("Room / place / Zoom link", "ห้อง / สถานที่ / ลิงก์ Zoom"), value: s.location || (enr && enr.location) || "" },
        { name: "topic", label: L("What was learned (topics)", "สิ่งที่เรียน (หัวข้อ)"), type: "textarea", value: s.topic, full: true },
        { name: "notes", label: L("Progress notes & homework", "บันทึกความก้าวหน้าและการบ้าน"), type: "textarea", value: s.notes, full: true }
      ].concat(isNew ? [] : [{ name: "changeReason", label: L("Why are the date / time / hours changing?", "เหตุผลที่เปลี่ยนวัน / เวลา / ชั่วโมง"), value: "", full: true }]),
      history: isNew ? null : { col: "sessions", id: s.id },
      extra: !isNew && A.canMoveLesson(s) ? '<button type="button" class="btn" data-move>' + L("Move / reschedule…", "เลื่อน / ย้ายคาบ…") + "</button>" +
        '<button type="button" class="btn btn--danger" data-cancel-lesson>' + L("Cancel this lesson…", "ยกเลิกคาบนี้…") + "</button>" : "",
      onReady: function (form, dlg) {
        var m = form.querySelector("[data-move]"); if (m) m.addEventListener("click", function () { dlg.close(); dlg.remove(); A.reschedule(s); });
        var cx = form.querySelector("[data-cancel-lesson]"); if (cx) cx.addEventListener("click", function () { dlg.close(); dlg.remove(); A.cancelLesson(s); });
        var hint = document.createElement("small"); form.elements.hours.parentNode.appendChild(hint);
        function upd() { hint.textContent = L("ends ", "เลิก ") + A.endOf({ start: form.elements.start.value, hours: +form.elements.hours.value }); }
        form.elements.start.addEventListener("input", upd); form.elements.hours.addEventListener("input", upd); upd();
        // a change of date / time / hours is marked on the lesson and needs a reason
        if (form.elements.changeReason) {
          A.reasonChips(form, "changeReason");
          var cr = form.elements.changeReason.closest(".mf");
          var tog = function () { cr.hidden = !(form.elements.date.value !== s.date || form.elements.start.value !== (s.start || "") || +form.elements.hours.value !== +s.hours); };
          ["date", "start", "hours"].forEach(function (n) { form.elements[n].addEventListener("input", tog); form.elements[n].addEventListener("change", tog); });
          tog();
        }
      },
      validate: function (v) {
        if (!isNew && (v.date !== s.date || (v.start || "") !== (s.start || "") || +v.hours !== +s.hours) && !String(v.changeReason || "").trim())
          return L("Please give the reason for changing the date / time.", "กรุณาระบุเหตุผลที่เปลี่ยนวัน / เวลา");
      },
      onSave: function (v) {
        var cand = Object.assign({}, s, v, { id: s.id || "new" });
        var check = v.status === "scheduled" || v.status === "done" ? A.clashOK([cand], s.id ? [s.id] : []) : Promise.resolve(true);
        return check.then(function (ok) { if (!ok) return false; return commitLesson(v); });
      }
    });
    function commitLesson(v) {
      {
        var why = v.changeReason; delete v.changeReason;
        if (!isNew && (v.date !== s.date || (v.start || "") !== (s.start || "") || +v.hours !== +s.hours)) {
          if (!s.changedFrom) s.changedFrom = { date: s.date, start: s.start || "", hours: +s.hours };   // keep the original time
          s.changeReason = why;
        }
        var rec = A.upsert("sessions", Object.assign(s, v));
        var e2 = A.byId("enrolments", rec.enrolmentId), st = A.stats(e2);
        A.logAct((isNew ? "Added lesson " : "Updated lesson ") + rec.date + " · " + A.enrolmentLabel(e2) + " · " + A.statusName(rec.status)); A.save();
        A.toast(st.over ? L("Saved — note: hours used exceed the package by " + A.num(st.over), "บันทึกแล้ว — ชั่วโมงที่ใช้เกินแพ็กเกจ " + A.num(st.over) + " ชม.") : L("Saved", "บันทึกแล้ว"), st.over ? "warn" : "");
        A.route();
      }
    }
  };

  A.scheduleSeries = function (enr) {
    var st = A.stats(enr);
    var last = st.sessions.filter(function (s) { return s.status !== "cancelled" && s.status !== "rescheduled"; }).map(function (s) { return s.date; }).sort().pop();
    var from0 = last && last >= A.today() ? A.addDays(last, 1) : (A.today() > enr.start ? A.addDays(A.today(), 1) : enr.start);
    A.form({
      title: L("Book more lessons", "จัดตารางเรียนเพิ่ม"),
      intro: esc(A.enrolmentLabel(enr)) + " · " + L("hours not booked yet: ", "ชั่วโมงที่ยังไม่ได้นัด: ") + "<strong>" + A.num(st.unscheduled) + "</strong>",
      fields: [
        { name: "pattern", label: L("Days & times (each day can differ)", "วันและเวลา (แต่ละวันต่างกันได้)"), type: "slots", value: enr.pattern },
        { name: "from", label: L("First lesson on or after", "เริ่มคาบแรกตั้งแต่วันที่"), type: "date", value: from0, required: true },
        { name: "endBy", label: L("Ends", "สิ้นสุดเมื่อ"), type: "select", value: "hours", options: [["hours", L("Hours are booked", "ครบจำนวนชั่วโมง")], ["count", L("Number of lessons", "ครบจำนวนครั้ง")], ["date", L("On a date", "ถึงวันที่กำหนด")]] },
        { name: "hours", label: L("Hours to book", "จำนวนชั่วโมงที่จะนัด"), type: "number", step: "0.25", min: 0.25, value: st.unscheduled || 1 },
        { name: "count", label: L("Number of lessons", "จำนวนครั้ง"), type: "number", step: "1", min: 1, value: 4 },
        { name: "to", label: L("Last day", "วันสุดท้าย"), type: "date", value: A.addDays(from0, 30) },
        { name: "keep", label: L("Save as this learner's regular times", "บันทึกเป็นเวลาเรียนปกติของผู้เรียนนี้"), type: "checkbox", value: true },
        { name: "grow", label: L("If more hours are booked than are left, add them to the course (and the fee)", "ถ้านัดเกินชั่วโมงที่เหลือ ให้เพิ่มชั่วโมง (และค่าเรียน) ในการลงทะเบียน"), type: "checkbox", value: true, full: true }
      ],
      onReady: function (form) {
        var info = document.createElement("p"); info.className = "mf-diff mf-full"; form.querySelector(".mf-grid").appendChild(info);
        function upd() {
          var by = form.elements.endBy.value;
          form.elements.hours.closest(".mf").hidden = by !== "hours"; form.elements.count.closest(".mf").hidden = by !== "count"; form.elements.to.closest(".mf").hidden = by !== "date";
          form.elements.grow.closest(".mf-check").hidden = !A.isAdmin();
          var slots = A.$$(".slot", form).map(function (r) { return { day: +r.querySelector("[data-k=day]").value, start: r.querySelector("[data-k=start]").value, end: r.querySelector("[data-k=end]").value }; });
          var ls = A.generateLessons(enr, { pattern: slots, from: form.elements.from.value, endBy: by, hours: +form.elements.hours.value, count: +form.elements.count.value, to: form.elements.to.value });
          var h = ls.reduce(function (t, x) { return t + x.hours; }, 0);
          info.textContent = ls.length ? L(ls.length + " lessons · " + A.num(h) + " h · " + A.fmtDate(ls[0].date) + " → " + A.fmtDate(ls[ls.length - 1].date), "จะนัด " + ls.length + " ครั้ง · " + A.num(h) + " ชม. · " + A.fmtDate(ls[0].date) + " → " + A.fmtDate(ls[ls.length - 1].date)) +
            (h > st.unscheduled + 0.001 ? L(" — " + A.num(h - st.unscheduled) + " h more than not yet booked", " — มากกว่าชั่วโมงที่ยังไม่ได้นัด " + A.num(h - st.unscheduled) + " ชม.") : "") : L("No lesson fits — check the days and dates.", "ไม่มีคาบที่ตรงเงื่อนไข — ตรวจสอบวันและวันที่");
        }
        form.addEventListener("input", upd); form.addEventListener("change", upd); upd();
      },
      validate: function (v) { if (!v.pattern.length) return L("Add at least one day and time.", "กรุณาเพิ่มวันและเวลาอย่างน้อย 1 รายการ"); },
      onSave: function (v) {
        var lessons = A.generateLessons(enr, { pattern: v.pattern, from: v.from, endBy: v.endBy, hours: v.hours, count: v.count, to: v.to });
        if (!lessons.length) { A.toast(L("No lesson fits — check the days and dates.", "ไม่มีคาบที่ตรงเงื่อนไข"), "err"); return false; }
        return A.clashOK(lessons).then(function (ok) {
          if (!ok) return false;
          var h = lessons.reduce(function (t, x) { return t + x.hours; }, 0), extra = Math.round((h - st.unscheduled) * 100) / 100;
          Array.prototype.push.apply(A.db.sessions, lessons);
          if (v.keep) enr.pattern = v.pattern;
          if (extra > 0.001 && v.grow && A.isAdmin()) {
            enr.hours = Math.round(((+enr.hours || 0) + extra) * 100) / 100;
            enr.fee = Math.max(0, (+enr.fee || 0) + extra * (+enr.rate || 0));
          }
          A.logAct("Scheduled " + lessons.length + " lessons for " + A.enrolmentLabel(enr) + (extra > 0.001 && v.grow && A.isAdmin() ? " (+" + extra + " h added to the course)" : ""));
          return A.save().then(function () { A.toast(L(lessons.length + " lessons added to the calendar", "เพิ่ม " + lessons.length + " คาบในปฏิทินแล้ว")); A.route(); });
        });
      }
    });
  };

  A.editPayment = function (p, preset) {
    if (!A.isAdmin()) return;
    p = p || Object.assign({ date: A.today(), method: "transfer" }, preset || {});
    var isNew = !p.id, eopts = enrolmentOpts();
    if (!eopts.length) return A.toast(L("Create an enrolment first.", "กรุณาสร้างการลงทะเบียนก่อน"), "err");
    var enr = A.byId("enrolments", p.enrolmentId);
    A.form({
      title: isNew ? L("Record payment", "บันทึกการชำระเงิน") : L("Edit payment", "แก้ไขการชำระเงิน"),
      fields: [
        { name: "enrolmentId", label: L("Enrolment", "การลงทะเบียน"), type: "select", options: eopts, value: p.enrolmentId, required: true, full: true },
        { name: "date", label: L("Date", "วันที่"), type: "date", value: p.date, required: true },
        { name: "amount", label: L("Amount", "จำนวนเงิน") + " (" + A.db.org.currency + ")", type: "number", step: "0.01", min: 0, value: p.amount != null ? p.amount : (enr ? Math.max(0, A.stats(enr).balance) : ""), required: true },
        { name: "method", label: L("Method", "ช่องทาง"), type: "select", options: Object.keys(A.METHODS).map(function (k) { return [k, A.methodName(k)]; }), value: p.method },
        { name: "ref", label: L("Receipt no.", "เลขที่ใบเสร็จ"), value: p.ref || A.nextReceiptNo() },
        { name: "note", label: L("Note", "หมายเหตุ"), type: "textarea", value: p.note, full: true }
      ],
      history: isNew ? null : { col: "payments", id: p.id },
      onSave: function (v) {
        var rec = A.upsert("payments", Object.assign(p, v));
        A.logAct((isNew ? "Payment " : "Updated payment ") + A.money(rec.amount) + " · " + A.enrolmentLabel(A.byId("enrolments", rec.enrolmentId)));
        return A.save().then(function () { A.toast(L("Payment saved", "บันทึกการชำระเงินแล้ว")); A.route(); if (isNew) A.openReceipt(rec); });
      }
    });
  };

  /* ------------------------------------------------------------ pages */
  var P = A.pages = {};
  P.locked = A._lockedPage; P.access = A._accessPage; P.data = A._dataPage;
  P.student = function (q, id) {
    var u = A.byId("users", id);
    if (!u || !A.isStaff()) return { title: L("Not found", "ไม่พบข้อมูล"), html: A.empty("This learner is not in your list.", "ไม่พบผู้เรียนนี้ในรายการของคุณ") };
    var g = u.guardianId && A.byId("users", u.guardianId);
    var enrs = A.visibleEnrolments().filter(function (e) { return e.studentId === id; }).sort(function (a, b) { return (a.start || "").localeCompare(b.start || ""); });
    var all = [];
    enrs.forEach(function (e) { A.sessionsOf(e.id).forEach(function (s) { if (s.status !== "rescheduled") all.push(s); }); });
    all.sort(function (a, b) { return (a.date + (a.start || "")).localeCompare(b.date + (b.start || "")); });
    var html = '<p class="crumbs"><a href="#/people?role=student">← ' + L("Students & parents", "นักเรียนและผู้ปกครอง") + "</a></p>" +
      '<section class="box enr-card"><div class="enr-card__who"><h2>' + esc(A.userName(u.id)) + A.exTag(u) + "</h2>" +
      '<p class="muted">' + esc([u.grade, u.school].filter(Boolean).join(" · ") || "–") + "</p>" +
      (g ? "<p>" + L("Parent: ", "ผู้ปกครอง: ") + esc(g.name) + (g.phone ? " · " + esc(g.phone) : "") + "</p>" : "") +
      (u.phone || u.email ? '<p class="muted">' + esc([u.phone, u.email].filter(Boolean).join(" · ")) + "</p>" : "") +
      (all.length ? "<p><b>" + L("All lessons: ", "คาบเรียนทั้งหมด: ") + "</b>" + all.length + L(" · first ", " · คาบแรก ") + esc(A.fmtDate(all[0].date)) + L(" · last ", " · คาบสุดท้าย ") + esc(A.fmtDate(all[all.length - 1].date)) + "</p>" : "") +
      '</div><div class="enr-card__act">' + (A.isStaff() ? '<button class="btn btn--primary" data-act="new-enrolment" data-student="' + u.id + '">+ ' + L("Enrol in a course", "ลงทะเบียนเรียนเพิ่ม") + "</button>" : "") +
      (A.isAdmin() && !u.example ? '<button class="btn" data-act="cal-links" data-scope="student:' + u.id + '">🔗 ' + L("Calendar link for parents", "ลิงก์ปฏิทินให้ผู้ปกครอง") + "</button>" : "") +
      '<button class="btn" data-act="edit-person" data-id="' + u.id + '">' + L("Edit details", "แก้ไขข้อมูล") + "</button></div></section>" +
      (enrs.length ? enrs.map(function (e) {
        var st = A.stats(e), ls = st.sessions, n = 0, cum = 0;
        return '<section class="box stu-course"><header><h2><a href="#/enrolment/' + e.id + '">' + esc(A.courseName(e.courseCode)) + "</a> " + A.badge(e.status, A.enrStatusName(e.status)) + "</h2>" +
          '<div class="btnrow">' + (A.canEditEnrolment(e) ? '<button class="btn btn--sm btn--primary" data-act="renew" data-enr="' + e.id + '">↻ ' + L("Renew", "ต่อคอร์ส") + "</button>" : "") +
          (A.isAdmin() && e.renewOf ? '<button class="btn btn--sm" data-act="doc-paynotice" data-enr="' + e.id + '">💳 ' + L("Payment notice", "แจ้งชำระค่าเรียน") + "</button>" : "") +
          '<button class="btn btn--sm" data-act="doc-schedule" data-enr="' + e.id + '">' + L("Schedule report · PDF / image / text", "ใบรายงานวันเวลาเรียน · PDF / รูปภาพ / ข้อความ") + "</button></div></header>" +
          '<p class="muted">' + esc(L("Teacher: ", "ครู: ") + A.userName(e.teacherId)) + (e.pattern && e.pattern.length ? " · " + esc(A.patternText(e.pattern)) : "") + (e.goal ? " · " + esc(e.goal) : "") + "</p>" +
          A.timelineCard(e).replace('<section class="box tlc"', '<section class="tlc tlc--inner"') +
          (ls.length ? table(["#", L("Date", "วันที่"), L("Time", "เวลา"), L("Hours", "ชม."), L("Status", "สถานะ"), L("Total", "สะสม")], ls.map(function (s) {
            var counts = s.status !== "cancelled" && s.status !== "rescheduled"; if (counts) { n++; cum += +s.hours || 0; }
            var st2 = s.status === "scheduled" && s.date < A.today() ? L("past, not updated", "ผ่านแล้วยังไม่อัปเดต") : A.statusName(s.status);
            return { attrs: ' data-session="' + s.id + '"', cells: [counts ? n : "–", esc(A.fmtDate(s.date, { weekday: "short", day: "numeric", month: "short", year: "numeric" })), esc(A.span(s)),
              s.timeTBC && !+s.hours ? "–" : A.num(s.hours), A.badge(s.status === "scheduled" && s.date < A.today() ? "noshow" : s.status, st2) + (s.autoDone ? ' <span class="muted">' + L("regular", "ปกติ") + "</span>" : "") + (A.markHtml(s) ? '<span class="lm-list">' + A.markHtml(s, true) + "</span>" : ""), counts ? A.num(cum) : ""] };
          }), "tbl--click") : A.empty("No lessons booked yet.", "ยังไม่มีคาบเรียน")) + "</section>";
      }).join("") : A.empty("Not enrolled in a course yet.", "ยังไม่ได้ลงทะเบียนเรียน", '<button class="btn btn--primary" data-act="new-enrolment" data-student="' + u.id + '">+ ' + L("Enrol in a course", "ลงทะเบียนเรียน") + "</button>"));
    return { title: L("Learner timetable", "ตารางเรียนรายคน"), html: html };
  };

  P.dashboard = function () {
    var today = A.today(), in7 = A.addDays(today, 7), month = today.slice(0, 7);
    var enrs = A.visibleEnrolments(), ids = enrs.map(function (e) { return e.id; });
    var sess = A.db.sessions.filter(function (s) { return ids.indexOf(s.enrolmentId) !== -1; });
    var active = enrs.filter(function (e) { return e.status === "active"; });
    var students = {}; active.forEach(function (e) { students[e.studentId] = 1; });
    var hoursMonth = sess.filter(function (s) { return A.counts(s) && s.date.slice(0, 7) === month; }).reduce(function (t, s) { return t + (+s.hours || 0); }, 0);
    var upcoming = sess.filter(function (s) { return s.status === "scheduled" && s.date >= today && s.date <= in7; }).sort(function (a, b) { return (a.date + a.start).localeCompare(b.date + b.start); });
    var overdue = sess.filter(function (s) { return s.status === "scheduled" && s.date < today; });
    var low = active.map(function (e) { return { e: e, st: A.stats(e) }; }).filter(function (x) { return x.st.total && x.st.remaining <= A.db.org.lowHours; });
    var owing = enrs.map(function (e) { return { e: e, st: A.stats(e) }; }).filter(function (x) { return x.st.balance > 0.009 && x.e.status !== "cancelled"; });
    var owed = owing.reduce(function (t, x) { return t + x.st.balance; }, 0);
    var quick = A.isAdmin() ? '<div class="quick">' +
      '<button class="quick__btn quick__btn--main" data-act="new-person" data-role="student">' + ico("people") + "<span><b>" + L("Add a student", "เพิ่มนักเรียน") + "</b><small>" + L("name, school, parent", "ชื่อ โรงเรียน ผู้ปกครอง") + "</small></span></button>" +
      '<button class="quick__btn" data-act="new-enrolment">' + ico("enrol") + "<span><b>" + L("Enrol in a course", "ลงทะเบียนเรียน") + "</b><small>" + L("course, fee, days & times", "หลักสูตร ค่าเรียน วันเวลาเรียน") + "</small></span></button>" +
      '<button class="quick__btn" data-act="new-payment">' + ico("payments") + "<span><b>" + L("Record a payment", "รับชำระเงิน") + "</b><small>" + L("receipt is made for you", "ออกใบเสร็จให้อัตโนมัติ") + "</small></span></button>" +
      '<a class="quick__btn" href="#/calendar">' + ico("calendar") + "<span><b>" + L("Calendar", "ปฏิทิน") + "</b><small>" + L("all lessons", "คาบเรียนทั้งหมด") + "</small></span></a></div>" : "";
    var html = quick + '<div class="kpis">' +
      kpi(L("Active students", "นักเรียนที่กำลังเรียน"), Object.keys(students).length) +
      kpi(L("Active enrolments", "การลงทะเบียนที่ใช้งาน"), active.length) +
      kpi(L("Hours taught this month", "ชั่วโมงที่สอนเดือนนี้"), A.num(hoursMonth)) +
      kpi(L("Lessons in next 7 days", "คาบเรียนใน 7 วันข้างหน้า"), upcoming.length) +
      (A.isAdmin() ? kpi(L("Outstanding fees", "ค่าเรียนค้างชำระ"), A.money(owed), owing.length + " " + L("enrolments", "รายการ"), owed > 0 ? "warn" : "") : "") +
      kpi(L("Low on hours", "ชั่วโมงใกล้หมด"), low.length, L("≤ " + A.db.org.lowHours + " h left", "เหลือ ≤ " + A.db.org.lowHours + " ชม."), low.length ? "warn" : "") +
      "</div>";
    var reqs = A.pendingRequests();
    if (reqs.length) html += '<div class="alert alert--info">' + esc(L(reqs.length + " change request(s) from learners or parents are waiting.", "มีคำขอเปลี่ยนแปลงจากผู้เรียนหรือผู้ปกครอง " + reqs.length + " รายการรอพิจารณา")) + ' <a href="#/requests">' + L("Review", "พิจารณา") + "</a></div>";
    if (overdue.length) html += '<div class="alert">' + esc(L(overdue.length + " past lesson(s) are still marked as scheduled. Update them so hours stay correct.", "มี " + overdue.length + " คาบที่ผ่านไปแล้วแต่ยังเป็นสถานะนัดเรียน กรุณาอัปเดตเพื่อให้ชั่วโมงถูกต้อง")) + ' <a href="#/sessions?status=overdue">' + L("Review", "ตรวจสอบ") + "</a></div>";
    html += '<div class="grid2">' +
      '<section class="box"><header><h2>' + L("Upcoming lessons", "คาบเรียนที่จะถึง") + '</h2><a href="#/calendar">' + L("Calendar", "ปฏิทิน") + " →</a></header>" +
      (upcoming.length ? '<ul class="list">' + upcoming.slice(0, 8).map(function (s) {
        var e = A.byId("enrolments", s.enrolmentId);
        return '<li><button type="button" class="linkish" data-session="' + s.id + '"><b>' + esc(A.fmtDate(s.date, { weekday: "short", day: "numeric", month: "short" })) + " · " + esc(s.start || "") + "</b> " + esc(A.userName(e.studentId)) + ' <span class="muted">' + esc(e.courseCode) + " · " + A.hrs(s.hours) + "</span>" + (A.markHtml(s) ? '<span class="lm-list">' + A.markHtml(s, true) + "</span>" : "") + "</button>" +
          '<button type="button" class="btn btn--xs" data-done="' + s.id + '">' + L("Mark done", "เรียนแล้ว") + "</button></li>";
      }).join("") + "</ul>" : A.empty("No lessons in the next 7 days.", "ไม่มีคาบเรียนใน 7 วันข้างหน้า")) + "</section>" +
      '<section class="box"><header><h2>' + L("Needs attention", "ต้องติดตาม") + "</h2></header>" +
      (low.length || owing.length ? '<ul class="list">' +
        low.map(function (x) { return '<li><a href="#/enrolment/' + x.e.id + '">' + esc(A.enrolmentLabel(x.e)) + '</a><span class="badge badge--noshow">' + L("left ", "เหลือ ") + A.hrs(x.st.remaining) + "</span></li>"; }).join("") +
        (A.isAdmin() ? owing.slice(0, 6).map(function (x) { return '<li><a href="#/enrolment/' + x.e.id + '">' + esc(A.enrolmentLabel(x.e)) + '</a><span class="badge badge--scheduled">' + L("owes ", "ค้าง ") + A.money(x.st.balance) + "</span></li>"; }).join("") : "") +
        "</ul>" : A.empty("All good — nothing to follow up.", "เรียบร้อยดี ไม่มีเรื่องต้องติดตาม")) + "</section>" +
      "</div>" +
      '<section class="box"><header><h2>' + L("Recent activity", "ความเคลื่อนไหวล่าสุด") + "</h2></header>" +
      (A.db.log.length ? '<ul class="list list--log">' + A.db.log.slice(0, 8).map(function (l) { return "<li><span>" + esc(l.text) + '</span><span class="muted">' + esc(l.by) + " · " + esc(new Date(l.at).toLocaleString(A.lang === "th" ? "th-TH" : "en-GB", { dateStyle: "medium", timeStyle: "short" })) + "</span></li>"; }).join("") + "</ul>" : A.empty("No activity yet.", "ยังไม่มีความเคลื่อนไหว")) + "</section>";
    return { title: L("Dashboard", "ภาพรวม"), actions: A.isAdmin() ? "" : '<button class="btn btn--primary" data-act="new-session">+ ' + L("Log a lesson", "บันทึกคาบเรียน") + "</button>", html: html };
  };

  P.people = function (q) {
    var role = q.get("role") || "student", term = (q.get("q") || "").toLowerCase();
    var list = A.people(role === "all" ? "" : role).filter(function (u) { return !term || (u.name + " " + (u.nick || "") + " " + (u.email || "") + " " + (u.phone || "") + " " + (u.school || "")).toLowerCase().indexOf(term) !== -1; })
      .sort(function (a, b) { return a.name.localeCompare(b.name); });
    var tabs = ["student", "parent", "teacher", "admin", "all"].map(function (r) {
      var n = r === "all" ? A.db.users.length : A.people(r).length;
      return '<a class="tab' + (r === role ? " is-on" : "") + '" href="#/people?role=' + r + '">' + (r === "all" ? L("All", "ทั้งหมด") : A.roleName(r)) + " <span>" + n + "</span></a>";
    }).join("");
    var rows = list.map(function (u) {
      var enrs = A.db.enrolments.filter(function (e) { return e.studentId === u.id || e.teacherId === u.id; });
      var rem = 0; enrs.forEach(function (e) { if (e.studentId === u.id && e.status === "active") rem += A.stats(e).remaining; });
      return { attrs: ' data-person="' + u.id + '"', cells: [
        "<b>" + esc(u.name) + "</b>" + (u.nick ? ' <span class="muted">(' + esc(u.nick) + ")</span>" : "") + A.exTag(u) + (u.active === false ? ' <span class="badge">' + L("inactive", "ปิดใช้งาน") + "</span>" : ""),
        esc(A.roleName(u.role)), esc(u.email || "–") + (u.phone ? "<br><span class=muted>" + esc(u.phone) + "</span>" : ""),
        u.role === "student" ? enrs.length + " · " + L("left ", "เหลือ ") + A.hrs(rem) : u.role === "teacher" || u.role === "admin" ? enrs.length + " " + L("enrolments", "รายการ") : esc(A.people("student").filter(function (s) { return s.guardianId === u.id; }).map(function (s) { return s.nick || s.name; }).join(", ") || "–"),
        u.consentDate ? "✓ " + esc(A.fmtDate(u.consentDate)) : '<span class="muted">–</span>',
        u.role === "student" ? '<a class="btn btn--xs" href="#/reports?student=' + u.id + '">' + L("Report", "รายงาน") + "</a>" : ""
      ] };
    });
    var html = '<div class="toolbar"><div class="tabs">' + tabs + '</div><input type="search" class="search" data-search placeholder="' + esc(L("Search name, email, phone…", "ค้นหาชื่อ อีเมล โทรศัพท์…")) + '" value="' + esc(q.get("q") || "") + '"></div>' +
      (rows.length ? table([L("Name", "ชื่อ"), L("Role", "บทบาท"), L("Contact", "ติดต่อ"), L("Learning", "การเรียน"), "PDPA", ""], rows, "tbl--click") : A.empty("No one here yet.", "ยังไม่มีข้อมูล", '<button class="btn btn--primary" data-act="new-person" data-role="' + (role === "all" ? "student" : role) + '">+ ' + L("Add", "เพิ่ม") + "</button>"));
    var addLabel = { student: L("Add a student", "เพิ่มนักเรียน"), parent: L("Add a parent", "เพิ่มผู้ปกครอง"), teacher: L("Add a teacher", "เพิ่มครู"), admin: L("Add an admin", "เพิ่มผู้ดูแลระบบ") }[role] || L("Add a student", "เพิ่มนักเรียน");
    return { title: L("Students & parents", "นักเรียนและผู้ปกครอง"), actions: '<button class="btn btn--primary" data-act="new-person" data-role="' + (role === "all" ? "student" : role) + '">+ ' + addLabel + "</button>", html: html };
  };

  P.enrolments = function (q) {
    var status = q.get("status") || "active", term = (q.get("q") || "").toLowerCase();
    var list = A.visibleEnrolments().filter(function (e) { return (status === "all" || e.status === status) && (!term || A.enrolmentLabel(e).toLowerCase().indexOf(term) !== -1); })
      .sort(function (a, b) { return (b.start || "").localeCompare(a.start || ""); });
    var tabs = ["active", "paused", "completed", "cancelled", "all"].map(function (s) {
      return '<a class="tab' + (s === status ? " is-on" : "") + '" href="#/enrolments?status=' + s + '">' + (s === "all" ? L("All", "ทั้งหมด") : A.enrStatusName(s)) + " <span>" + A.visibleEnrolments().filter(function (e) { return s === "all" || e.status === s; }).length + "</span></a>";
    }).join("");
    var rows = list.map(function (e) {
      var st = A.stats(e);
      return { attrs: ' data-enrolment="' + e.id + '"', cells: [
        "<b>" + esc(A.userName(e.studentId)) + "</b>" + A.exTag(e) + "<br><span class=muted>" + esc(A.courseName(e.courseCode)) + "</span>",
        esc(A.userName(e.teacherId)),
        A.bar(st) + '<span class="muted">' + A.num(st.used) + " / " + A.num(st.total) + " " + L("h used", "ชม. ที่ใช้") + "</span>",
        "<b>" + A.hrs(st.remaining) + "</b>" + (st.planned ? "<br><span class=muted>" + A.num(st.planned) + " " + L("h booked", "ชม. ที่นัดแล้ว") + "</span>" : ""),
        A.isAdmin() ? (e.feeTBD ? '<span class="badge badge--scheduled">' + L("Fee not set", "ยังไม่ระบุค่าเรียน") + "</span>" : st.balance > 0.009 ? '<span class="neg">' + A.money(st.balance) + "</span>" : '<span class="pos">' + L("Paid", "ชำระครบ") + "</span>") : "",
        A.badge(e.status, A.enrStatusName(e.status))
      ] };
    });
    var html = '<div class="toolbar"><div class="tabs">' + tabs + '</div><input type="search" class="search" data-search placeholder="' + esc(L("Search student or course…", "ค้นหานักเรียนหรือหลักสูตร…")) + '" value="' + esc(q.get("q") || "") + '"></div>' +
      (rows.length ? table([L("Student · course", "นักเรียน · หลักสูตร"), L("Teacher", "ครู"), L("Progress", "ความคืบหน้า"), L("Hours left", "ชั่วโมงคงเหลือ"), A.isAdmin() ? L("Balance", "ยอดค้าง") : "", L("Status", "สถานะ")], rows, "tbl--click") : A.empty("No enrolments here.", "ไม่มีการลงทะเบียนในหมวดนี้"));
    return { title: L("Enrolments", "การลงทะเบียน"), actions: A.isStaff() ? '<button class="btn btn--primary" data-act="new-enrolment">+ ' + L("Enrol a student", "ลงทะเบียนนักเรียน") + "</button>" : "", html: html };
  };

  P.enrolment = function (q, id) {
    var e = A.byId("enrolments", id);
    if (!e || !A.canEditEnrolment(e) && !A.isAdmin()) return { title: L("Not found", "ไม่พบข้อมูล"), html: A.empty("This enrolment does not exist or is not yours.", "ไม่พบการลงทะเบียนนี้ หรือคุณไม่มีสิทธิ์เข้าถึง") };
    var st = A.stats(e), c = A.course(e.courseCode), stu = A.byId("users", e.studentId);
    var html = '<p class="crumbs"><a href="#/enrolments">← ' + L("Enrolments", "การลงทะเบียน") + "</a></p>" +
      '<section class="box enr-card"><div class="enr-card__who"><h2>' + esc(A.userName(e.studentId)) + A.exTag(e) + " " + A.badge(e.status, A.enrStatusName(e.status)) + "</h2>" +
      "<p><b>" + esc(A.courseName(e.courseCode)) + "</b></p><p class=\"muted\">" + esc(L("Teacher: ", "ครู: ") + A.userName(e.teacherId)) + " · " +
      esc(A.MODES().filter(function (m) { return m[0] === e.mode; }).map(function (m) { return m[1]; })[0] || "") + (e.location ? " · " + esc(e.location) : "") +
      (e.pattern && e.pattern.length ? " · " + esc(A.patternText(e.pattern)) : "") + "</p>" +
      (stu && (stu.phone || stu.email) ? '<p class="muted">' + L("Contact: ", "ติดต่อ: ") + esc([stu.phone, stu.email].filter(Boolean).join(" · ")) + "</p>" : "") +
      (e.goal ? '<p class="note">🎯 ' + esc(e.goal) + "</p>" : "") + "</div>" +
      '<div class="enr-card__act">' +
      (A.canEditEnrolment(e) ? '<button class="btn btn--primary" data-act="renew" data-enr="' + e.id + '">↻ ' + L("Renew — next round", "ต่อคอร์ส (รอบใหม่)") + "</button>" +
        '<button class="btn" data-act="new-session" data-enr="' + e.id + '">+ ' + L("Add a lesson", "เพิ่มคาบเรียน") + "</button>" +
        '<button class="btn" data-act="series" data-enr="' + e.id + '">' + L("Book more lessons", "จัดตารางเพิ่ม") + "</button>" : "") +
      (A.isAdmin() ? '<button class="btn" data-act="new-payment" data-enr="' + e.id + '">' + L("Record payment", "รับชำระเงิน") + "</button>" : "") +
      '<details class="menu-dd"><summary class="btn">' + L("Documents ▾", "เอกสาร ▾") + "</summary><div>" +
        '<button data-act="doc-schedule" data-ver="summary" data-enr="' + e.id + '">' + L("Learning summary (1 page)", "ใบสรุปการเรียน (แบบสรุป)") + "</button>" +
        '<button data-act="doc-schedule" data-ver="full" data-enr="' + e.id + '">' + L("Learning summary — full", "ใบสรุปการเรียน (แบบเต็ม)") + "</button>" +
        '<button data-act="doc-schedule" data-from="today" data-enr="' + e.id + '">' + L("Remaining lessons · PDF", "ตารางเรียนที่เหลือ · PDF") + "</button>" +
        '<a href="#/reports?student=' + e.studentId + "&enrolment=" + e.id + '">' + L("Progress report", "รายงานความก้าวหน้า") + "</a>" +
        (A.isAdmin() ? '<button data-act="doc-pack" data-enr="' + e.id + '">' + L("Enrolment pack for parents", "เอกสารยืนยันการลงทะเบียน") + "</button>" +
          '<button data-act="doc-paynotice" data-enr="' + e.id + '">' + L("Payment notice (bank transfer)", "แจ้งชำระค่าเรียน (โอนผ่านธนาคาร)") + "</button>" : "") + "</div></details>" +
      (A.isAdmin() ? '<button class="btn" data-act="edit-enrolment" data-enr="' + e.id + '">' + L("Edit", "แก้ไข") + "</button>" : "") + "</div></section>" +
      A.timelineCard(e, q.get("asof") || A.today()) +
      (st.unscheduled > 0.001 && e.status === "active" || st.used + st.planned > st.total + 0.001 ? A.hoursPanel(e, st) : "") +   // only when hours need booking or are over-booked
      (A.isAdmin() && e.feeTBD ? '<p class="alert">' + L("The fee for this enrolment has not been set yet — press Edit to add it.", "ยังไม่ได้ระบุค่าเรียนของการลงทะเบียนนี้ — กด แก้ไข เพื่อใส่ค่าเรียน") + "</p>" : "") +
      (A.isAdmin() && !e.feeTBD ? '<div class="kpis kpis--money">' + kpi(L("Fee", "ค่าเรียน"), A.money(st.fee)) + kpi(L("Paid", "ชำระแล้ว"), A.money(st.paid)) + kpi(L("Balance", "ยอดค้าง"), A.money(st.balance), "", st.balance > 0.009 ? "warn" : "good") + "</div>" : "") +
      '<section class="box"><header><h2>' + L("Lessons", "คาบเรียน") + " (" + st.sessions.length + ")</h2></header>" +
      (st.sessions.length ? table([L("Date", "วันที่"), L("Hours", "ชม."), L("Status", "สถานะ"), L("What was learned", "สิ่งที่เรียน"), ""], st.sessions.map(function (s) {
        return { attrs: ' data-session="' + s.id + '"', cells: [esc(A.fmtDate(s.date, { weekday: "short", day: "numeric", month: "short", year: "2-digit" })) + "<br><span class=muted>" + esc(s.start || "") + "</span>", A.num(s.hours), A.badge(s.status), A.lessonNote(s),
          s.status === "scheduled" ? '<button type="button" class="btn btn--xs" data-done="' + s.id + '">' + L("Mark done", "เรียนแล้ว") + "</button>"
            : s.autoDone && s.status === "done" && A.isStaff() ? '<span class="badge">' + L("auto", "อัตโนมัติ") + '</span> <button type="button" class="btn btn--xs" data-undo="' + s.id + '">' + L("Not learned", "ยังไม่ได้เรียน") + "</button>" : ""] };
      }), "tbl--click") : A.empty("No lessons yet. Add one or schedule weekly lessons.", "ยังไม่มีคาบเรียน เพิ่มคาบเรียนหรือนัดรายสัปดาห์ได้เลย")) + "</section>" +
      (A.isAdmin() ? '<section class="box"><header><h2>' + L("Payments", "การชำระเงิน") + "</h2></header>" +
        (A.paymentsOf(e.id).length ? table([L("Date", "วันที่"), L("Amount", "จำนวนเงิน"), L("Method", "ช่องทาง"), L("Receipt no.", "เลขที่ใบเสร็จ"), ""], A.paymentsOf(e.id).map(function (p) {
          return { attrs: ' data-payment="' + p.id + '"', cells: [esc(A.fmtDate(p.date)), A.money(p.amount), esc(A.methodName(p.method)), esc(p.ref || ""), '<button class="btn btn--xs" data-act="doc-receipt" data-id="' + p.id + '">' + L("Receipt", "ใบเสร็จ") + "</button>"] };
        }), "tbl--click") : A.empty("No payments recorded.", "ยังไม่มีการชำระเงิน")) + "</section>" : "") +
      (c ? "" : '<p class="alert">' + L("This course is no longer in the catalogue.", "หลักสูตรนี้ไม่อยู่ในรายการแล้ว") + "</p>");
    return { title: L("Enrolment", "การลงทะเบียน"), html: html };
  };

  P.sessions = function (q) {
    var status = q.get("status") || "all", from = q.get("from") || "", to = q.get("to") || "", teacher = q.get("teacher") || "";
    var today = A.today();
    var ids = A.visibleEnrolments().map(function (e) { return e.id; });
    var list = A.db.sessions.filter(function (s) {
      if (ids.indexOf(s.enrolmentId) === -1) return false;
      if (status === "overdue") { if (!(s.status === "scheduled" && s.date < today)) return false; }
      else if (status !== "all" && s.status !== status) return false;
      if (from && s.date < from) return false;
      if (to && s.date > to) return false;
      if (teacher && s.teacherId !== teacher) return false;
      return true;
    }).sort(function (a, b) { return (b.date + (b.start || "")).localeCompare(a.date + (a.start || "")); });
    var total = list.reduce(function (t, s) { return t + (A.counts(s) ? +s.hours || 0 : 0); }, 0);
    var html = '<form class="filters" data-filters>' +
      '<label>' + L("Status", "สถานะ") + '<select name="status">' + opts([["all", L("All", "ทั้งหมด")], ["overdue", L("Past, not updated", "ผ่านแล้วแต่ยังไม่อัปเดต")]].concat(Object.keys(A.STATUS).map(function (k) { return [k, A.statusName(k)]; })), status) + "</select></label>" +
      "<label>" + L("From", "ตั้งแต่") + '<input type="date" name="from" value="' + esc(from) + '"></label>' +
      "<label>" + L("To", "ถึง") + '<input type="date" name="to" value="' + esc(to) + '"></label>' +
      (A.isAdmin() ? "<label>" + L("Teacher", "ครู") + '<select name="teacher">' + opts(peopleOpts("staff"), teacher, L("All", "ทั้งหมด")) + "</select></label>" : "") +
      '<button type="button" class="btn" data-act="export-sessions">CSV</button></form>' +
      '<p class="muted">' + list.length + " " + L("lessons", "คาบ") + " · " + L("hours counted: ", "ชั่วโมงที่นับ: ") + A.num(total) + "</p>" +
      (list.length ? table([L("Date", "วันที่"), L("Student · course", "นักเรียน · หลักสูตร"), L("Hours", "ชม."), L("Status", "สถานะ"), L("What was learned", "สิ่งที่เรียน"), ""], list.slice(0, 400).map(function (s) {
        var e = A.byId("enrolments", s.enrolmentId);
        return { attrs: ' data-session="' + s.id + '"', cells: [esc(A.fmtDate(s.date)) + "<br><span class=muted>" + esc(s.start || "") + "</span>", esc(A.userName(e.studentId)) + A.exTag(s) + "<br><span class=muted>" + esc(e.courseCode) + "</span>", A.num(s.hours), A.badge(s.status), esc(s.topic || ""),
          s.status === "scheduled" ? '<button type="button" class="btn btn--xs" data-done="' + s.id + '">' + L("Mark done", "เรียนแล้ว") + "</button>"
            : s.autoDone && s.status === "done" && A.isStaff() ? '<span class="badge">' + L("auto", "อัตโนมัติ") + '</span> <button type="button" class="btn btn--xs" data-undo="' + s.id + '">' + L("Not learned", "ยังไม่ได้เรียน") + "</button>" : ""] };
      }), "tbl--click") : A.empty("No lessons match.", "ไม่พบคาบเรียนที่ตรงเงื่อนไข"));
    A._sessionsList = list;
    return { title: L("Lessons log", "บันทึกการสอน"), actions: '<button class="btn btn--primary" data-act="new-session">+ ' + L("Add lesson", "เพิ่มคาบเรียน") + "</button>", html: html };
  };

  P.payments = function (q) {
    if (!A.isAdmin()) return P.dashboard(q);
    var from = q.get("from") || "", to = q.get("to") || "";
    var list = A.db.payments.filter(function (p) { return (!from || p.date >= from) && (!to || p.date <= to); }).sort(function (a, b) { return b.date.localeCompare(a.date); });
    var sum = list.reduce(function (t, p) { return t + (+p.amount || 0); }, 0);
    var owing = A.db.enrolments.filter(function (e) { return e.status !== "cancelled"; }).map(function (e) { return { e: e, st: A.stats(e) }; }).filter(function (x) { return x.st.balance > 0.009; });
    var html = '<div class="kpis">' + kpi(L("Received (filtered)", "รับแล้ว (ตามตัวกรอง)"), A.money(sum), list.length + " " + L("payments", "รายการ"), "good") +
      kpi(L("Outstanding", "ค้างชำระ"), A.money(owing.reduce(function (t, x) { return t + x.st.balance; }, 0)), owing.length + " " + L("enrolments", "รายการ"), owing.length ? "warn" : "") + "</div>" +
      '<form class="filters" data-filters><label>' + L("From", "ตั้งแต่") + '<input type="date" name="from" value="' + esc(from) + '"></label><label>' + L("To", "ถึง") + '<input type="date" name="to" value="' + esc(to) + '"></label><button type="button" class="btn" data-act="export-payments">CSV</button></form>' +
      (owing.length ? '<section class="box"><header><h2>' + L("Outstanding balances", "ยอดค้างชำระ") + "</h2></header>" + table([L("Enrolment", "การลงทะเบียน"), L("Fee", "ค่าเรียน"), L("Paid", "ชำระแล้ว"), L("Balance", "คงค้าง"), ""], owing.map(function (x) {
        return { cells: ['<a href="#/enrolment/' + x.e.id + '">' + esc(A.enrolmentLabel(x.e)) + "</a>", A.money(x.st.fee), A.money(x.st.paid), '<b class="neg">' + A.money(x.st.balance) + "</b>", '<button class="btn btn--xs" data-act="new-payment" data-enr="' + x.e.id + '">' + L("Record", "บันทึก") + "</button>"] };
      })) + "</section>" : "") +
      '<section class="box"><header><h2>' + L("Payments received", "รายการรับชำระ") + "</h2></header>" +
      (list.length ? table([L("Date", "วันที่"), L("Enrolment", "การลงทะเบียน"), L("Amount", "จำนวนเงิน"), L("Method", "ช่องทาง"), L("Receipt no.", "เลขที่ใบเสร็จ"), ""], list.map(function (p) {
        var e = A.byId("enrolments", p.enrolmentId);
        return { attrs: ' data-payment="' + p.id + '"', cells: [esc(A.fmtDate(p.date)), esc(e ? A.enrolmentLabel(e) : "–"), "<b>" + A.money(p.amount) + "</b>", esc(A.methodName(p.method)), esc(p.ref || ""), '<button class="btn btn--xs" data-act="doc-receipt" data-id="' + p.id + '">' + L("Receipt", "ใบเสร็จ") + "</button>"] };
      }), "tbl--click") : A.empty("No payments yet.", "ยังไม่มีการชำระเงิน")) + "</section>";
    A._paymentsList = list;
    return { title: L("Payments", "การชำระเงิน"), actions: '<button class="btn btn--primary" data-act="new-payment">+ ' + L("Record payment", "บันทึกการชำระเงิน") + "</button>", html: html };
  };

  P.courses = function (q) {
    if (!A.isAdmin()) return P.dashboard(q);
    var term = (q.get("q") || "").toLowerCase();
    var list = A.courses().filter(function (c) { return !term || (c.code + " " + A.tx(c.title) + " " + A.groupName(c.group)).toLowerCase().indexOf(term) !== -1; });
    var head = [L("Code", "รหัส"), L("Course", "หลักสูตร"), L("Default hours", "ชั่วโมงมาตรฐาน"), L("Rate / h", "ราคา/ชม."), L("Enrolled", "ผู้ลงทะเบียน"), L("Status", "สถานะ"), L("Website", "บนเว็บไซต์")];
    function row(c) {
      var n = A.db.enrolments.filter(function (e) { return e.courseCode === c.code && e.status === "active"; }).length;
      return { attrs: ' data-course-code="' + esc(c.code) + '"', cells: ['<b class="mono">' + esc(c.code) + "</b>", esc(A.tx(c.title)) + (c.source === "custom" ? ' <span class="badge">' + L("custom", "เพิ่มเอง") + "</span>" : ""), A.num(c.hours), A.money(c.rate), n || "–", A.courseStatusBadge(c.status), c.source === "custom" ? '<span class="muted">' + L("Back office only", "เฉพาะหลังบ้าน") + "</span>" : c.visible ? A.badge("done", L("Shown", "แสดง")) : A.badge("paused", L("Hidden", "ไม่แสดง"))] };
    }
    // one table per course group, in catalogue order
    var sections = A.groups().map(function (g) {
      var gl = list.filter(function (c) { return c.group === g.id; });
      return gl.length ? '<section class="box course-group-box"><header><h2>' + esc(A.tx(g.name)) + ' <span class="muted">· ' + gl.length + "</span></h2></header>" + table(head, gl.map(row), "tbl--click") + "</section>" : "";
    }).join("");
    var html = '<div class="toolbar"><p class="muted">' + L("Courses come from the public website. Set your own hours, price and availability here — the website text does not change.", "รายวิชามาจากเว็บไซต์ กำหนดจำนวนชั่วโมง ราคา และการเปิดสอนได้ที่นี่ โดยข้อความบนเว็บไซต์ไม่เปลี่ยน") + '</p><input type="search" class="search" data-search placeholder="' + esc(L("Search courses…", "ค้นหาหลักสูตร…")) + '" value="' + esc(q.get("q") || "") + '"></div>' +
      (sections || A.empty("No course matches.", "ไม่พบหลักสูตรที่ตรงกัน"));
    return { title: L("Courses", "หลักสูตร"), actions: '<button class="btn btn--primary" data-act="new-course">+ ' + L("Custom course", "เพิ่มหลักสูตรเอง") + "</button>", html: html };
  };
  function editCourse(code) {
    var c = code ? A.course(code) : { code: "", title: { en: "", th: "" }, hours: 20, rate: A.db.org.rate, active: true, source: "custom" };
    var custom = c.source === "custom";
    A.form({
      title: code ? code + " · " + A.tx(c.title) : L("Custom course", "เพิ่มหลักสูตรเอง"),
      fields: (custom ? [
        { name: "code", label: L("Code", "รหัส"), value: c.code, required: true },
        { name: "en", label: L("Title (English)", "ชื่อ (อังกฤษ)"), value: c.title.en, required: true },
        { name: "th", label: L("Title (Thai)", "ชื่อ (ไทย)"), value: c.title.th },
        { name: "group", label: L("Group", "กลุ่มหลักสูตร"), type: "select", options: A.groups().map(function (g) { return [g.id, A.tx(g.name)]; }), value: c.group || "custom" }
      ] : []).concat([
        { name: "hours", label: L("Default hours", "ชั่วโมงมาตรฐาน"), type: "number", step: "0.5", min: 0, value: c.hours, required: true },
        { name: "rate", label: L("Rate per hour", "ราคาต่อชั่วโมง") + " (" + A.db.org.currency + ")", type: "number", step: "1", min: 0, value: c.rate, required: true },
        { name: "status", label: L("Status", "สถานะ"), type: "select", value: c.status || "open", options: [["open", L("Open — taking students", "เปิด — รับผู้เรียน")], ["closed", L("Closed for now (full / paused)", "ปิดรับชั่วคราว (เต็ม / พัก)")], ["cancelled", L("Cancelled — no longer offered", "ยกเลิก — ไม่เปิดสอนแล้ว")]], hint: L("Only open courses can take new enrolments. The website shows a badge for closed or cancelled courses.", "รับลงทะเบียนใหม่ได้เฉพาะคอร์สที่เปิด เว็บไซต์จะแสดงป้ายสำหรับคอร์สที่ปิดหรือยกเลิก") }
      ]).concat(custom ? [] : [{ name: "visible", label: L("Show on the website", "แสดงบนเว็บไซต์"), type: "checkbox", value: c.visible !== false, full: true }]),
      onDelete: custom && code ? function () { A.db.customCourses = A.db.customCourses.filter(function (x) { return x.code !== code; }); A.save(); A.route(); } : null,
      validate: function (v) { if (custom && v.code !== code && A.course(v.code)) return L("This code already exists.", "รหัสนี้มีอยู่แล้ว"); },
      onSave: function (v) {
        if (custom) {
          var rec = { code: v.code.toUpperCase(), title: { en: v.en, th: v.th || v.en }, group: v.group || "custom", hours: v.hours, rate: v.rate, status: v.status, active: v.status === "open", track: "custom", level: 0 };
          var i = A.db.customCourses.findIndex(function (x) { return x.code === code; });
          if (i === -1) A.db.customCourses.push(rec); else A.db.customCourses[i] = rec;
        } else A.db.courseOverrides[code] = { hours: v.hours, rate: v.rate, status: v.status, active: v.status === "open", visible: v.visible };
        A.logAct("Updated course " + (v.code || code)); A.save(); A.toast(L("Saved", "บันทึกแล้ว")); A.route();
      }
    });
  }

  P.settings = function () {
    var o = A.db.org, used = 0;
    used = JSON.stringify(A.db).length;
    var html =
      '<section class="box"><header><h2>' + L("My account", "บัญชีของฉัน") + "</h2></header><p>" + esc(A.me.name) + " · " + esc(A.me.email) + " · " + esc(A.roleName(A.me.role)) + '</p><button class="btn" data-act="my-password">' + L("Change my password", "เปลี่ยนรหัสผ่าน") + "</button></section>" +
      '<section class="box"><header><h2>' + L("Notifications & app", "การแจ้งเตือนและแอป") + '</h2></header><p class="muted">' + L("Choose what you are told about and how (in the app, email, LINE).", "เลือกเรื่องที่ต้องการรับแจ้งและช่องทาง (ในระบบ อีเมล LINE)") +
        (A.db.me && A.db.me.lineLinked ? " · LINE ✓" : "") + '</p><div class="btnrow"><a class="btn" href="#/inbox?tab=prefs">' + L("My notifications", "การแจ้งเตือนของฉัน") + "</a>" +
        (A.isAdmin() ? '<a class="btn" href="#/notify">' + L("Notifications & LINE (admin)", "ตั้งค่าแจ้งเตือนและ LINE (ผู้ดูแล)") + "</a>" : "") +
        (A.isAdmin() ? '<a class="btn" href="#/access">' + ico("lock") + " " + L("Menu & permissions", "เมนูและสิทธิ์การใช้งาน") + "</a>" : "") +
        '<button class="btn" type="button" data-act="install" hidden>' + L("Install the app", "ติดตั้งแอป") + "</button></div><p class=\"note\" data-ios-tip hidden></p></section>" +
      (A.isAdmin() ? '<section class="box"><header><h2>' + L("Organisation & rules", "ข้อมูลองค์กรและกติกา") + '</h2><button class="btn" data-act="org">' + L("Edit", "แก้ไข") + "</button></header>" +
        '<dl class="dl"><dt>' + L("Name", "ชื่อ") + "</dt><dd>" + esc(o.name) + "</dd><dt>" + L("Address", "ที่อยู่") + "</dt><dd>" + esc(o.address) + "</dd><dt>" + L("Email / phone", "อีเมล / โทร") + "</dt><dd>" + esc([o.email, o.phone].filter(Boolean).join(" · ")) + "</dd><dt>" + L("Tax ID", "เลขประจำตัวผู้เสียภาษี") + "</dt><dd>" + esc(o.taxId || "–") + "</dd>" +
        "<dt>" + L("Default rate", "ราคามาตรฐาน") + "</dt><dd>" + A.money(o.rate) + " / " + L("h", "ชม.") + "</dd><dt>" + L("Low-hours alert", "แจ้งเตือนชั่วโมงใกล้หมด") + "</dt><dd>≤ " + A.hrs(o.lowHours) + "</dd><dt>" + L("No-show uses hours", "ขาดเรียนนับชั่วโมง") + "</dt><dd>" + (o.noShowCounts ? L("Yes", "ใช่") : L("No", "ไม่")) + "</dd><dt>" + L("Who approves requests", "ผู้อนุมัติคำขอ") + "</dt><dd>" + (o.teachersApprove ? L("Admins and teachers", "ผู้ดูแลระบบและครู") : L("Admins only", "เฉพาะผู้ดูแลระบบ")) + "</dd><dt>" + L("How to pay", "ช่องทางชำระเงิน") + "</dt><dd>" + esc(o.paymentInfo || "–") + "</dd></dl></section>" +
        '<section class="box"><header><h2>' + L("Email", "อีเมล") + '</h2><button class="btn" data-act="smtp">' + L("Set up", "ตั้งค่า") + '</button></header><p class="muted" data-smtp-status>' + L("Checking…", "กำลังตรวจสอบ…") + "</p></section>" +
        '<section class="box"><header><h2>' + L("Cookie consent records (PDPA)", "บันทึกความยินยอมคุกกี้ (PDPA)") + '</h2><button class="btn" data-act="consent-log">' + L("Download CSV", "ดาวน์โหลด CSV") + "</button></header>" +
        '<p class="muted" data-consent-count>' + L("Every Accept / Reject / Save on the public website is recorded here as proof of consent: a random reference, the time, the policy version and the choices. No names, emails or IP addresses. Kept permanently.", "ทุกครั้งที่ผู้เข้าชมกดยอมรับ ปฏิเสธ หรือบันทึกตัวเลือกบนเว็บไซต์ จะถูกบันทึกไว้ที่นี่เป็นหลักฐานความยินยอม ได้แก่ รหัสอ้างอิงแบบสุ่ม เวลา ฉบับนโยบาย และตัวเลือก โดยไม่มีชื่อ อีเมล หรือ IP เก็บไว้ถาวร") + "</p></section>" +
        '<section class="box"><header><h2>' + L("Backup & data", "สำรองและจัดการข้อมูล") + "</h2></header>" +
        '<p class="note">' + L("Data is stored on the DeepDistrict server in one database file (server/data/deepdistrict.db). Nothing is ever deleted: archiving hides a record but keeps it, and every earlier version of every record is kept in the database archive for good. The server also copies the database every day to server/data/backups (the last 30 days plus the 1st of every month). Export a backup file regularly as well and keep it somewhere safe.", "ข้อมูลเก็บบนเซิร์ฟเวอร์ DeepDistrict ในไฟล์ฐานข้อมูลเดียว (server/data/deepdistrict.db) ระบบไม่ลบข้อมูลใด ๆ การย้ายไปที่เก็บถาวรเพียงซ่อนรายการแต่ยังเก็บไว้ และทุกเวอร์ชันก่อนหน้าของทุกรายการถูกเก็บในฐานข้อมูลถาวร เซิร์ฟเวอร์ยังคัดลอกฐานข้อมูลทุกวันไว้ที่ server/data/backups (30 วันล่าสุด และสำเนาวันที่ 1 ของทุกเดือน) ควรส่งออกไฟล์สำรองเป็นประจำและเก็บไว้ในที่ปลอดภัยด้วย") + "</p>" +
        '<div class="btnrow"><button class="btn btn--primary" data-act="backup">' + L("Export backup (.json)", "ส่งออกไฟล์สำรอง (.json)") + '</button><label class="btn">' + L("Import backup…", "นำเข้าไฟล์สำรอง…") + '<input type="file" accept=".json,application/json" data-import hidden></label>' +
        "</div></section>" +
        '<section class="box"><header><h2>' + L("Removing data", "การลบข้อมูล") + '</h2><a class="btn btn--primary" href="#/data">' + L("Open Data: remove & restore", "เปิด จัดการข้อมูล (ลบ / กู้คืน)") + "</a></header>" +
        '<p class="muted">' + L("Real data is never removed from the everyday screens. Only an admin can remove a record, here in the system menu — and it can be restored.", "ข้อมูลจริงลบจากหน้าจอทั่วไปไม่ได้ เฉพาะผู้ดูแลระบบเท่านั้นที่ลบได้ ผ่านเมนูระบบนี้ และกู้คืนได้") + "</p></section>" +
        '<section class="box"><header><h2>' + L("Activity log", "บันทึกการใช้งาน") + "</h2></header>" + (A.db.log.length ? '<ul class="list list--log">' + A.db.log.slice(0, 60).map(function (l) { return "<li><span>" + esc(l.text) + '</span><span class="muted">' + esc(l.by) + " · " + esc(new Date(l.at).toLocaleString(A.lang === "th" ? "th-TH" : "en-GB")) + "</span></li>"; }).join("") + "</ul>" : A.empty("No activity yet.", "ยังไม่มีความเคลื่อนไหว")) + "</section>"
      : '<p class="muted">' + L("Organisation settings and backups are managed by an admin.", "การตั้งค่าองค์กรและการสำรองข้อมูลจัดการโดยผู้ดูแลระบบ") + "</p>");
    return { title: L("Settings", "ตั้งค่า"), html: html, after: function () {
      var el = $("[data-smtp-status]"); if (!el) return;
      A.api("GET", "smtp").then(function (c) {
        el.textContent = c.configured ? L("Documents are sent from ", "ส่งเอกสารจาก ") + (c.sender || c.user) + " (" + c.host + ")" : L("Not set up: emailing a document downloads it and opens your mail app instead.", "ยังไม่ได้ตั้งค่า: เมื่อกดส่งอีเมล ระบบจะดาวน์โหลดไฟล์และเปิดแอปอีเมลแทน");
      }).catch(function () {});
    } };
  };
  function editOrg() {
    var o = A.db.org;
    A.form({
      title: L("Organisation & rules", "ข้อมูลองค์กรและกติกา"),
      fields: [
        { name: "name", label: L("Name", "ชื่อ"), value: o.name, required: true },
        { name: "email", label: L("Email", "อีเมล"), value: o.email },
        { name: "phone", label: L("Phone", "โทรศัพท์"), value: o.phone },
        { name: "taxId", label: L("Tax ID", "เลขประจำตัวผู้เสียภาษี"), value: o.taxId },
        { name: "address", label: L("Address", "ที่อยู่"), type: "textarea", value: o.address, full: true },
        { name: "currency", label: L("Currency", "สกุลเงิน"), value: o.currency, required: true },
        { name: "rate", label: L("Default rate per hour", "ราคามาตรฐานต่อชั่วโมง"), type: "number", step: "1", min: 0, value: o.rate, required: true },
        { name: "lowHours", label: L("Alert when hours left ≤", "แจ้งเตือนเมื่อชั่วโมงคงเหลือ ≤"), type: "number", step: "0.5", min: 0, value: o.lowHours, required: true },
        { name: "noShowCounts", label: L("A no-show uses the lesson's hours", "ขาดเรียนโดยไม่แจ้ง ให้นับชั่วโมง"), type: "checkbox", value: o.noShowCounts, full: true },
        { name: "autoComplete", label: L("When a scheduled lesson has ended and nobody updated it, record it as a regular lesson (done) automatically", "คาบที่ถึงเวลาแล้วแต่ครูไม่ได้บันทึก ให้ระบบบันทึกว่า เรียนแล้ว (เรียนตามปกติ) โดยอัตโนมัติ"), type: "checkbox", value: o.autoComplete !== false, full: true },
        { name: "teachersApprove", label: L("Teachers may also approve change requests (otherwise admins only)", "ให้ครูอนุมัติคำขอเปลี่ยนแปลงได้ด้วย (ปกติเฉพาะผู้ดูแลระบบ)"), type: "checkbox", value: o.teachersApprove, full: true },
        { name: "bankName", label: L("Bank (payment notices)", "ธนาคาร (ใบแจ้งชำระ)"), value: o.bankName || A.BANK.bank },
        { name: "bankAccName", label: L("Account name", "ชื่อบัญชี"), value: o.bankAccName || A.BANK.name },
        { name: "bankNo", label: L("Account no.", "เลขที่บัญชี"), value: o.bankNo || A.BANK.no },
        { name: "paymentInfo", label: L("How to pay (shown on fee notices)", "ช่องทางชำระเงิน (แสดงในใบแจ้งค่าเรียน)"), type: "textarea", value: o.paymentInfo, full: true, hint: L("e.g. bank, account name and number, PromptPay ID", "เช่น ธนาคาร ชื่อบัญชี เลขที่บัญชี พร้อมเพย์") }
      ],
      onSave: function (v) { Object.assign(A.db.org, v); A.logAct("Updated organisation settings"); A.save(); A.toast(L("Saved", "บันทึกแล้ว")); A.route(); }
    });
  }
  function changePassword() {
    A.form({
      title: L("Change my password", "เปลี่ยนรหัสผ่าน"),
      fields: [
        { name: "old", label: L("Current password", "รหัสผ่านปัจจุบัน"), type: "password", required: true, autocomplete: "current-password" },
        { name: "pw", label: L("New password", "รหัสผ่านใหม่"), type: "password", required: true, autocomplete: "new-password" },
        { name: "pw2", label: L("Repeat new password", "ยืนยันรหัสผ่านใหม่"), type: "password", required: true, autocomplete: "new-password" }
      ],
      validate: function (v) { if (v.pw.length < 8) return L("At least 8 characters.", "อย่างน้อย 8 ตัวอักษร"); if (v.pw !== v.pw2) return L("Passwords do not match.", "รหัสผ่านไม่ตรงกัน"); },
      onSave: function (v) {
        return A.api("POST", "password", { old: v.old, new: v.pw }).then(function () { A.toast(L("Password changed", "เปลี่ยนรหัสผ่านแล้ว")); })
          .catch(function (e) { A.toast(e.message, "err"); return false; });
      }
    });
  }

  // everyday pages shown first for each role; everything else sits under "More menus"
  var MAIN = { admin: ["dashboard", "people", "enrolments", "calendar", "payments", "requests", "tests", "blog", "settings"],
    teacher: ["dashboard", "calendar", "people", "sessions", "requests", "tests", "live", "marking", "settings"],
    student: ["home", "calendar", "tests", "requests", "inbox", "reports", "settings"], parent: ["home", "calendar", "requests", "inbox", "reports", "settings"] };
  function navLink(n) {
          if (!A.canOpen(n[0])) {
            if (!A.showLocked()) return "";
            return '<a href="#/locked?p=' + n[0] + '" data-nav="locked-' + n[0] + '" class="is-locked" title="' + esc(L("Needs: ", "ต้องเป็น: ") + A.needs(n[0])) + '">' + ico(n[4] || n[0]) + "<span>" + L(n[1], n[2]) + "</span>" + '<i class="nav-lock">' + ico("lock") + "</i></a>";
          }
          var badge = n[0] === "requests" ? A.pendingRequests().length : n[0] === "inbox" ? A.db.inboxUnread || 0 : 0;
          return '<a href="#/' + n[0] + '" data-nav="' + n[0] + '">' + ico(n[4] || n[0]) + "<span>" + L(n[1], n[2]) + "</span>" + (badge ? '<b class="nav-badge"' + (n[0] === "inbox" ? " data-unread" : "") + ">" + badge + "</b>" : "") + "</a>";
  }

  function navLinks(ids) { return ids.map(function (id) { return NAV.filter(function (n) { return n[0] === id; })[0]; }).filter(Boolean).map(navLink).join(""); }
  function navGroupHtml(g, skip) {
    var links = NAV.filter(function (n) { return A.navGroup(n[0]) === g[0] && skip.indexOf(n[0]) === -1 && !(n[0] === "home" && A.isStaff()); }).map(navLink).join("");
    return links ? '<p class="nav-group">' + L(g[1], g[2]) + "</p>" + links : "";
  }

  /* ------------------------------------------------------------ shell & router */
  document.addEventListener("toggle", function (e) { if (e.target.classList && e.target.classList.contains("nav-more")) { try { localStorage.setItem("dd-nav-more", e.target.open ? "1" : "0"); } catch (x) {} } }, true);
  function shell() {
    root.innerHTML =
      '<aside class="side" id="side"><a class="side__brand" href="#/dashboard"><img src="../assets/images/brand/logo-mark.png" alt=""><span>DeepDistrict<small>' + L("Back office", "ระบบหลังบ้าน") + "</small></span></a><nav>" +
      navLinks(MAIN[A.me.role] || [], true) +
      (function () {
        var rest = NAV_GROUPS.map(function (g) { return navGroupHtml(g, (MAIN[A.me.role] || [])); }).join("");
        if (!rest) return "";
        var open = (function () { try { return localStorage.getItem("dd-nav-more") === "1"; } catch (e) { return false; } })();
        return '<details class="nav-more"' + (open ? " open" : "") + '><summary>' + L("More menus", "เมนูเพิ่มเติม") + "</summary>" + rest + "</details>";
      })() +
      '</nav><div class="side__foot"><button class="btn btn--sm" type="button" data-act="install" hidden>' + L("Install the app", "ติดตั้งแอป") + '</button><a href="../index.html">← ' + L("Public website", "เว็บไซต์หลัก") + "</a></div></aside>" +
      '<div class="main"><header class="top"><button class="ibtn menu" type="button" data-act="menu" aria-label="Menu">☰</button><h1 id="page-title"></h1><div class="top__act" id="page-actions"></div>' +
      '<div class="top__tools"><div class="seg"><button type="button" data-lang="th"' + (A.lang === "th" ? ' aria-pressed="true"' : "") + '>TH</button><button type="button" data-lang="en"' + (A.lang === "en" ? ' aria-pressed="true"' : "") + ">EN</button></div>" +
      '<button class="ibtn" type="button" data-act="theme" aria-label="Light / dark" title="Light / dark"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/></svg></button>' +
      '<a class="ibtn bell" href="#/inbox" aria-label="' + L("Notifications", "การแจ้งเตือน") + '">' + ico("bell") + '<b data-bell' + (A.db.inboxUnread ? "" : " hidden") + ">" + (A.db.inboxUnread || "") + "</b></a>" +
      '<span class="sync" id="sync" aria-live="polite"></span><span class="me" title="' + esc(A.me.email) + '">' + esc(A.me.nick || A.me.name.split(" ")[0]) + " · " + esc(A.roleName(A.me.role)) + "</span>" +
      '<button class="btn btn--sm" type="button" data-act="logout">' + L("Sign out", "ออกจากระบบ") + "</button></div></header>" +
      '<main id="view" tabindex="-1"></main></div>' +
      // phones: the most used pages as a bottom tab bar, the rest stay in the ☰ menu
      '<nav class="tabbar" aria-label="' + L("Main", "เมนูหลัก") + '">' + [[A.isStaff() ? "dashboard" : "home", "Home", "หน้าหลัก", "dashboard"], ["calendar", "Calendar", "ปฏิทิน", "calendar"], ["requests", "Requests", "คำขอ", "sessions"], ["inbox", "Alerts", "แจ้งเตือน", "bell"]].map(function (n) {
        return '<a href="#/' + n[0] + '" data-nav="' + n[0] + '">' + ico(n[3]) + "<span>" + L(n[1], n[2]) + "</span></a>";
      }).join("") + '<button type="button" data-act="menu">' + ico("more") + "<span>" + L("More", "เพิ่มเติม") + "</span></button></nav>";
  }

  A.route = function (to) {
    if (to) { location.hash = "#/" + to; return; }
    if (!A.me) return;
    if (!$("#view") || !A._navRole || A._navRole !== A.me.role) { root.innerHTML = ""; A._navRole = A.me.role; }
    if (!$("#view")) shell();
    var h = location.hash.replace(/^#\/?/, "") || (A.isStaff() ? "dashboard" : "home");
    var parts = h.split("?"), path = parts[0].split("/"), q = new URLSearchParams(parts[1] || "");
    var staffOnly = ["dashboard", "enrolments", "enrolment", "sessions", "people", "payments", "courses", "search", "popups", "content", "bank", "marking", "blog", "ai", "docs", "sets", "live"];
    var name = path[0];
    if (A.isStaff() && name === "home") name = "dashboard";
    if (name === "access" && !A.isAdmin()) name = A.isStaff() ? "dashboard" : "home";
    if (name !== "locked" && P[name] && !A.canOpen(name)) { q = new URLSearchParams("p=" + name); name = "locked"; }
    if (!A.isStaff() && staffOnly.indexOf(name) !== -1) name = "home";    // safety net: learners never get staff pages
    var page = P[name] || (A.isStaff() ? P.dashboard : P.home);
    var out = page(q, path[1]);
    $("#page-title").textContent = out.title;
    $("#page-actions").innerHTML = out.actions || "";
    $("#view").innerHTML = out.html;
    document.title = out.title + " · DeepDistrict " + L("Back office", "ระบบหลังบ้าน");
    $$("[data-nav]").forEach(function (a) { a.classList.toggle("is-on", a.getAttribute("data-nav") === name || (name === "enrolment" && a.getAttribute("data-nav") === "enrolments")); });
    var onMore = $(".nav-more a.is-on"); if (onMore) onMore.closest("details").open = true;   // the page you are on is never hidden
    document.body.classList.remove("nav-open");
    if (out.after) out.after();
  };

  /* ------------------------------------------------------------ global events */
  document.addEventListener("click", function (ev) {
    if (!A.me) return;
    A.touch();
    var t = ev.target, b;
    if ((b = t.closest("[data-lang]"))) { A.setLang(b.getAttribute("data-lang")); root.innerHTML = ""; A.route(); return; }
    if ((b = t.closest("[data-undo]"))) {               // an automatically recorded lesson did not really happen
      ev.stopPropagation();
      var u = A.byId("sessions", b.getAttribute("data-undo"));
      if (u && confirm(L("Mark this lesson as NOT learned? It goes back to scheduled (you can then move it, cancel it or mark a no-show) and the system will not record it automatically again.",
        "เปลี่ยนคาบนี้เป็น ยังไม่ได้เรียน ใช่ไหม? คาบจะกลับเป็นสถานะนัดเรียน (จากนั้นเลื่อน ยกเลิก หรือบันทึกขาดเรียนได้) และระบบจะไม่บันทึกคาบนี้อัตโนมัติอีก"))) {
        if (u.topic === "เรียนตามปกติ (บันทึกอัตโนมัติ) · Regular lesson (recorded automatically)") u.topic = "";
        Object.assign(u, { status: "scheduled", autoDone: false, autoOff: true });
        A.logAct("Lesson " + u.date + " marked as not learned (was recorded automatically)");
        A.save().then(function () { A.toast(L("Updated", "อัปเดตแล้ว")); A.route(); });
      }
      return;
    }
    if ((b = t.closest("[data-done]"))) {
      ev.stopPropagation();
      var s = A.byId("sessions", b.getAttribute("data-done"));
      return A.editSession(s, null), setTimeout(function () { var f = $("dialog.modal form"); if (f) f.elements.status.value = "done"; }, 0);
    }
    if ((b = t.closest("[data-act]"))) {
      var act = b.getAttribute("data-act"), enrId = b.getAttribute("data-enr");
      if (act === "menu") document.body.classList.toggle("nav-open");
      else if (act === "theme") A.applyTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
      else if (act === "logout") { A.logout().then(A.boot); }
      else if (act === "new-person") A.editPerson(null, b.getAttribute("data-role"));
      else if (act === "edit-person") A.editPerson(A.byId("users", b.getAttribute("data-id")));
      else if (act === "renew") A.renewEnrolment(enrId);
      else if (act === "new-enrolment") location.hash = "#/enrol" + (b.getAttribute("data-student") ? "?student=" + b.getAttribute("data-student") : "");
      else if (act === "edit-enrolment") A.editEnrolment(A.byId("enrolments", enrId));
      else if (act === "new-session") A.editSession(null, enrId ? { enrolmentId: enrId } : null);
      else if (act === "series") A.scheduleSeries(A.byId("enrolments", enrId));
      else if (act === "new-payment") A.editPayment(null, enrId ? { enrolmentId: enrId } : null);
      else if (act === "new-course") editCourse(null);
      else if (act === "org") editOrg();
      else if (act === "my-password") changePassword();
      else if (act === "backup") { A.api("GET", "backup").then(function (d) { A.download("deepdistrict-backup-" + A.today() + ".json", JSON.stringify(d, null, 2), "application/json"); }).catch(function (e) { A.toast(e.message, "err"); }); }
      else if (act === "acc-save") A.saveAccess();
      else if (act === "demo") { if (confirm(L("Add the 5 example learners (with parents, enrolments, payments and lessons, tagged 'Example')? Existing data is kept.", "เพิ่มข้อมูลตัวอย่างนักเรียน 5 คน (พร้อมผู้ปกครอง การลงทะเบียน การชำระเงิน และคาบเรียน มีป้าย 'ตัวอย่าง')? ข้อมูลเดิมยังอยู่ครบ"))) A.api("POST", "example/seed", {}).then(function (d) { A.toast(d.added ? L(d.added + " example records added", "เพิ่มข้อมูลตัวอย่าง " + d.added + " รายการ") : L("The example data is already there (archived records can be restored below).", "มีข้อมูลตัวอย่างอยู่แล้ว (รายการที่เก็บถาวรกู้คืนได้ด้านล่าง)")); return A.load().then(function () { A.route("dashboard"); }); }).catch(function (e) { A.toast(e.message, "err"); }); }
      else if (act === "archive-load") A.loadArchive();
      else if (act === "remove-rec") {
        var rc = b.getAttribute("data-col"), rid = b.getAttribute("data-id"), rr = A.byId(rc, rid);
        var cascade = rc === "users" ? A.db.enrolments.filter(function (x) { return x.studentId === rid; }).length : rc === "enrolments" ? A.sessionsOf(rid).length : 0;
        if (rr && confirm(L("Take this record out of use? It is archived (with " + cascade + " linked item(s)) and can be restored from this page.", "นำรายการนี้ออกจากระบบใช่ไหม? รายการจะถูกเก็บถาวร (รวมรายการที่เกี่ยวข้อง " + cascade + " รายการ) และกู้คืนได้จากหน้านี้"))) {
          if (rc === "users") A.removePerson(rr); else if (rc === "enrolments") A.deleteEnrolment(rid); else { A.remove(rc, rid); A.logAct("Removed (archived) " + rc + " " + rid); }
          A.save().then(function () { A.toast(L("Archived", "เก็บถาวรแล้ว")); A.route(); });
        }
      }
      else if (act === "archive-purge") {
        if (prompt(L("Remove this archived record for good? Type DELETE to confirm.", "ลบรายการนี้ออกถาวรใช่ไหม? พิมพ์คำว่า ลบ เพื่อยืนยัน")) === L("DELETE", "ลบ"))
          A.api("POST", "archive/purge", { col: b.getAttribute("data-col"), id: b.getAttribute("data-id") }).then(function () { A.toast(L("Removed for good", "ลบถาวรแล้ว")); A.loadArchive(); }).catch(function (e) { A.toast(e.message, "err"); });
      }
      else if (act === "import-batch") {
        if (confirm(L("Import these records? Records that already exist are left as they are.", "นำเข้ารายการเหล่านี้ใช่ไหม? รายการที่มีอยู่แล้วจะไม่ถูกแก้ไข")))
          A.api("POST", "import/batch", { id: b.getAttribute("data-id") }).then(function (d) {
            var a = d.added || {};
            A.toast(L("Imported: ", "นำเข้าแล้ว: ") + Object.keys(a).map(function (k) { return a[k] + " " + k; }).join(", "));
            return A.load().then(function () { A.route(); });
          }).catch(function (e) { A.toast(e.message, "err"); });
      }
      else if (act === "archive-purge-examples") {
        if (prompt(L("Remove every archived example record for good? Type DELETE to confirm.", "ลบข้อมูลตัวอย่างที่เก็บถาวรทั้งหมดออกถาวรใช่ไหม? พิมพ์คำว่า ลบ เพื่อยืนยัน")) === L("DELETE", "ลบ"))
          A.api("POST", "archive/purge", { examples: true }).then(function (d) { A.toast(L(d.removed + " removed for good", "ลบถาวรแล้ว " + d.removed + " รายการ")); A.loadArchive(); }).catch(function (e) { A.toast(e.message, "err"); });
      }
      else if (act === "example-remove") {
        if (confirm(L("Remove all example data (people, enrolments, lessons, payments and requests tagged Example)? Your real data is not touched.", "ลบข้อมูลตัวอย่างทั้งหมด (บุคคล การลงทะเบียน คาบเรียน การชำระเงิน และคำขอที่มีป้าย ตัวอย่าง) ใช่ไหม? ข้อมูลจริงจะไม่ถูกแตะต้อง")))
          A.api("POST", "example/remove", {}).then(function (d) { A.toast(L(d.removed + " example records removed", "ลบข้อมูลตัวอย่าง " + d.removed + " รายการแล้ว")); return A.load().then(function () { A.route(); }); }).catch(function (e) { A.toast(e.message, "err"); });
      }
      else if (act === "archive-restore") A.api("POST", "archive/restore", { col: b.getAttribute("data-col"), id: b.getAttribute("data-id") }).then(function () { A.toast(L("Restored", "กู้คืนแล้ว")); return A.load().then(function () { A.route(); setTimeout(A.loadArchive, 50); }); }).catch(function (e) { A.toast(e.message, "err"); });
      else if (act === "consent-log") {
        A.api("GET", "consent-log").then(function (d) {
          var rows = [["reference", "chosen_at", "received_at", "policy_version", "preferences", "analytics", "marketing", "page"]].concat(d.items.map(function (r) {
            var c = JSON.parse(r.choices || "{}"); return [r.ref, r.at, r.received, r.version, c.preferences ? "yes" : "no", c.analytics ? "yes" : "no", c.marketing ? "yes" : "no", r.page || ""];
          }));
          A.download("cookie-consent-log-" + A.today() + ".csv", "\ufeff" + rows.map(function (r) { return r.map(function (x) { return '"' + String(x).replace(/"/g, '""') + '"'; }).join(","); }).join("\r\n"), "text/csv");
          A.toast(L(d.count + " consent records", "บันทึกความยินยอม " + d.count + " รายการ"));
        }).catch(function (e) { A.toast(e.message, "err"); });
      }
      else if (act === "export-sessions") exportSessions();
      else if (act === "export-payments") exportPayments();
      else if (A.onAct) A.onAct(act, b, ev);
      return;
    }
    if ((b = t.closest("[data-person]"))) {
      var pu = A.byId("users", b.getAttribute("data-person"));
      if (pu && pu.role === "student" && A.isStaff()) { location.hash = "#/student/" + pu.id; return; }   // a learner opens their full timetable
      return A.editPerson(pu);
    }
    if ((b = t.closest("[data-enrolment]"))) { location.hash = "#/enrolment/" + b.getAttribute("data-enrolment"); return; }
    if ((b = t.closest("[data-session]"))) return A.editSession(A.byId("sessions", b.getAttribute("data-session")));
    if ((b = t.closest("[data-payment]"))) return A.editPayment(A.byId("payments", b.getAttribute("data-payment")));
    if ((b = t.closest("[data-course-code]"))) return editCourse(b.getAttribute("data-course-code"));
  });
  document.addEventListener("change", function (ev) {
    var f = ev.target.closest("[data-filters]");
    if (f) {
      var name = (location.hash.replace(/^#\/?/, "").split("?")[0]) || "dashboard", q = new URLSearchParams();
      $$("select, input", f).forEach(function (i) { if (i.value) q.set(i.name, i.value); });
      location.hash = "#/" + name + (q.toString() ? "?" + q : "");
    }
    if (ev.target.matches("[data-import]")) {
      var file = ev.target.files[0]; if (!file) return;
      if (!confirm(L("Replace ALL current data with this backup?", "แทนที่ข้อมูลปัจจุบันทั้งหมดด้วยไฟล์สำรองนี้?"))) return;
      file.text().then(function (txt) { return A.api("POST", "restore", JSON.parse(txt)); })
        .then(function () { A.toast(L("Backup restored", "กู้คืนข้อมูลแล้ว")); return A.load(); }).then(function () { root.innerHTML = ""; A.route(); })
        .catch(function (e) { A.toast(L("Could not restore: ", "กู้คืนไม่สำเร็จ: ") + e.message, "err"); });
    }
  });
  var searchTimer;
  document.addEventListener("input", function (ev) {
    if (!ev.target.matches("[data-search]")) return;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(function () {
      var parts = location.hash.replace(/^#\/?/, "").split("?"), q = new URLSearchParams(parts[1] || "");
      if (ev.target.value) q.set("q", ev.target.value); else q.delete("q");
      history.replaceState(null, "", "#/" + parts[0] + (q.toString() ? "?" + q : ""));
      A.route();
      var s = $("[data-search]"); if (s) { s.focus(); s.setSelectionRange(s.value.length, s.value.length); }
    }, 250);
  });
  window.addEventListener("hashchange", function () { A.route(); refresh(); });   // also fetch fresh data when moving between pages
  ["keydown", "pointerdown"].forEach(function (e) { document.addEventListener(e, A.touch, { passive: true }); });
  setInterval(function () { if (A.me && Date.now() - (A.lastActive || 0) > A.IDLE_MS) { A.logout().then(A.boot); A.toast(L("Signed out after 30 minutes of inactivity.", "ออกจากระบบอัตโนมัติหลังไม่มีการใช้งาน 30 นาที")); } }, 60000);

  function exportSessions() {
    var rows = [["date", "start", "hours", "status", "student", "course", "teacher", "mode", "topic", "notes"]];
    (A._sessionsList || []).forEach(function (s) { var e = A.byId("enrolments", s.enrolmentId); rows.push([s.date, s.start, s.hours, s.status, A.userName(e.studentId), e.courseCode, A.userName(s.teacherId), s.mode, s.topic, s.notes]); });
    A.download("lessons-" + A.today() + ".csv", A.csv(rows), "text/csv;charset=utf-8");
  }
  function exportPayments() {
    var rows = [["date", "amount", "currency", "method", "reference", "student", "course", "note"]];
    (A._paymentsList || []).forEach(function (p) { var e = A.byId("enrolments", p.enrolmentId) || {}; rows.push([p.date, p.amount, A.db.org.currency, p.method, p.ref, A.userName(e.studentId), e.courseCode, p.note]); });
    A.download("payments-" + A.today() + ".csv", A.csv(rows), "text/csv;charset=utf-8");
  }

  /* ------------------------------------------------------------ sign-in / first-run setup */
  function authScreen(mode, msg) {
    var setup = mode === "setup", offline = mode === "offline";
    root.innerHTML = '<div class="auth"><form class="auth__box" data-auth>' +
      '<img src="../assets/images/brand/logo-horizontal.png" class="on-light" alt="DeepDistrict"><img src="../assets/images/brand/logo-horizontal-white.png" class="on-dark" alt="DeepDistrict">' +
      "<h1>" + (offline ? L("Start the DeepDistrict server", "กรุณาเปิดเซิร์ฟเวอร์ DeepDistrict") : setup ? L("Set up the back office", "ตั้งค่าระบบหลังบ้าน") : L("Sign in", "เข้าสู่ระบบ")) + "</h1>" +
      (offline ? '<p class="muted">' + L("The back office needs its server. On this computer run start.sh (Mac/Linux) or start.bat (Windows), then open", "ระบบหลังบ้านต้องใช้เซิร์ฟเวอร์ บนเครื่องนี้ให้รัน start.sh (Mac/Linux) หรือ start.bat (Windows) แล้วเปิด") + ' <a href="http://localhost:8000/admin/">http://localhost:8000/admin/</a></p><pre class="cmd">python3 server/app.py</pre><button class="btn btn--primary" type="button" data-retry>' + L("Try again", "ลองอีกครั้ง") + "</button>" :
      (setup ? '<p class="muted">' + L("Create the first admin account.", "สร้างบัญชีผู้ดูแลระบบคนแรก") + '</p><label>' + L("Full name", "ชื่อ-นามสกุล") + '<input name="name" required autocomplete="name"></label>' :
        '<p class="muted">' + L("For staff, students and parents.", "สำหรับเจ้าหน้าที่ นักเรียน และผู้ปกครอง") + "</p>") +
      "<label>" + L("Email", "อีเมล") + '<input name="email" type="email" required autocomplete="username"></label>' +
      "<label>" + L("Password", "รหัสผ่าน") + '<input name="password" type="password" required minlength="' + (setup ? 8 : 1) + '" autocomplete="' + (setup ? "new-password" : "current-password") + '"></label>' +
      (setup ? '<label class="mf-check"><input type="checkbox" name="demo" checked> <span>' + L("Add demo data so I can try it", "เพิ่มข้อมูลตัวอย่างเพื่อทดลองใช้") + "</span></label>" : "") +
      '<p class="mf-error" role="alert">' + esc(msg || "") + '</p><button class="btn btn--primary" type="submit">' + (setup ? L("Create admin & start", "สร้างผู้ดูแลระบบและเริ่มใช้งาน") : L("Sign in", "เข้าสู่ระบบ")) + "</button>" +
      (setup ? "" : '<p class="muted small">' + L("Forgot your password? Ask the DeepDistrict admin to set a new one.", "ลืมรหัสผ่าน? ติดต่อผู้ดูแลระบบ DeepDistrict เพื่อตั้งรหัสผ่านใหม่") + "</p>")) +
      '<div class="auth__foot"><div class="seg"><button type="button" data-auth-lang="th">TH</button><button type="button" data-auth-lang="en">EN</button></div><a href="../index.html">← ' + L("Public website", "เว็บไซต์หลัก") + "</a></div></form></div>";
    document.title = L("Sign in", "เข้าสู่ระบบ") + " · DeepDistrict";
    var f = $("[data-auth]");
    $$("[data-auth-lang]", f).forEach(function (b) { b.addEventListener("click", function () { A.setLang(b.getAttribute("data-auth-lang")); authScreen(mode); }); });
    if (offline) { $("[data-retry]", f).addEventListener("click", A.boot); return; }
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var err = $(".mf-error", f), email = f.elements.email.value.trim(), pw = f.elements.password.value, btn = $("button[type=submit]", f);
      btn.disabled = true;
      var go = setup
        ? A.api("POST", "setup", { name: f.elements.name.value.trim(), email: email, password: pw }).then(A.load).then(function () {
            if (f.elements.demo.checked) return A.api("POST", "example/seed", {}).then(A.load).catch(function () {});
          })
        : A.login(email, pw);
      go.then(function () { A.touch(); root.innerHTML = ""; location.hash = A.isStaff() ? "#/dashboard" : "#/home"; A.route(); })
        .catch(function (x) {
          btn.disabled = false;
          err.textContent = x.status === 401 ? L("Email or password is incorrect.", "อีเมลหรือรหัสผ่านไม่ถูกต้อง") : x.status === 429 ? L("Too many attempts. Wait 15 minutes and try again.", "ลองหลายครั้งเกินไป กรุณารอ 15 นาทีแล้วลองใหม่") : x.message;
        });
    });
    f.elements[setup ? "name" : "email"].focus();
  }

  A.boot = function () {
    document.body.classList.remove("nav-open");
    if (location.protocol === "file:") return authScreen("offline");
    A.api("GET", "status").then(function (st) {
      if (st.setup) return authScreen("setup");
      if (!st.signedIn) return authScreen("login");
      return A.load().then(function () { A.touch(); root.innerHTML = ""; A.route(); });
    }).catch(function () { authScreen("offline"); });
  };

  /* keep everyone's screen up to date: refresh every 30 s and when the tab regains focus */
  function refresh() {
    if (!A.me || document.hidden || $("dialog[open]")) return;
    var before = JSON.stringify([A.db.users, A.db.enrolments, A.db.sessions, A.db.payments, A.db.requests]);
    (A.dirty() ? A.save() : Promise.resolve(true)).then(function (ok) { return ok === false ? Promise.reject({}) : A.load(); }).then(function () {
      if (JSON.stringify([A.db.users, A.db.enrolments, A.db.sessions, A.db.payments, A.db.requests]) !== before) { root.innerHTML = ""; A.route(); }
    }).catch(function (e) { if (e.status === 401) { A.me = null; A.boot(); } });
  }
  setInterval(refresh, 30000);
  window.addEventListener("focus", refresh);
})();
