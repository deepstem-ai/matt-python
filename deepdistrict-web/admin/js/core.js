/* ==========================================================================
   DeepDistrict back office — core: i18n, helpers, server data store,
   calculations, sign-in. Data lives on the DeepDistrict server
   (server/app.py, SQLite); each person only receives what their role allows.
   ========================================================================== */
(function () {
  "use strict";

  var A = window.DDA = {};
  var LANG_KEY = "dd-admin-lang", THEME_KEY = "dd-admin-theme";

  /* ------------------------------------------------------------ i18n */
  A.lang = (function () { try { return localStorage.getItem(LANG_KEY) || ((navigator.language || "").indexOf("th") === 0 ? "th" : "en"); } catch (e) { return "en"; } })();
  A.L = function (en, th) { return A.lang === "th" ? th : en; };
  A.setLang = function (l) { A.lang = l; try { localStorage.setItem(LANG_KEY, l); } catch (e) {} document.documentElement.lang = l; };
  A.tx = function (v) { return v && typeof v === "object" ? (v[A.lang] || v.en) : (v == null ? "" : String(v)); };

  /* ------------------------------------------------------------ theme */
  A.theme = (function () { try { return localStorage.getItem(THEME_KEY) || ""; } catch (e) { return ""; } })();
  A.applyTheme = function (t) {
    if (t !== undefined) { A.theme = t; try { localStorage.setItem(THEME_KEY, t); } catch (e) {} }
    var dark = A.theme === "dark" || (!A.theme && window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  };

  /* ------------------------------------------------------------ helpers */
  A.$ = function (s, c) { return (c || document).querySelector(s); };
  A.$$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  A.esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  A.uid = function (p) { return (p || "") + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); };
  A.pad = function (n) { return (n < 10 ? "0" : "") + n; };
  A.today = function () { var d = new Date(); return d.getFullYear() + "-" + A.pad(d.getMonth() + 1) + "-" + A.pad(d.getDate()); };
  A.iso = function (d) { return d.getFullYear() + "-" + A.pad(d.getMonth() + 1) + "-" + A.pad(d.getDate()); };
  A.parse = function (s) { var p = String(s).split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); };
  A.addDays = function (s, n) { var d = A.parse(s); d.setDate(d.getDate() + n); return A.iso(d); };
  A.fmtDate = function (s, opts) {
    if (!s) return "–";
    return A.parse(s).toLocaleDateString(A.lang === "th" ? "th-TH" : "en-GB", opts || { day: "numeric", month: "short", year: "numeric" });
  };
  A.num = function (n, d) { return (Math.round((+n || 0) * 100) / 100).toLocaleString(A.lang === "th" ? "th-TH" : "en-GB", { maximumFractionDigits: d == null ? 2 : d }); };
  A.money = function (n) { return A.num(n, 2) + " " + (A.db && A.db.org.currency || "THB"); };
  A.hrs = function (n) { return A.num(n, 2) + " " + A.L("h", "ชม."); };

  /* ------------------------------------------------------------ server API */
  A.api = function (method, path, body) {
    return fetch("../api/" + path, {
      method: method, credentials: "same-origin",
      headers: method === "POST" ? { "Content-Type": "application/json", "X-DD": "1" } : {},
      body: method === "POST" ? JSON.stringify(body || {}) : undefined
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) { var e = new Error(j.error || ("HTTP " + r.status)); e.status = r.status; throw e; }
        return j;
      });
    });
  };

  /* ------------------------------------------------------------ data store
     A.db holds what the server sent for this person. Pages change A.db and call
     A.save(); save() sends only what changed since the last sync.            */
  var COLS = ["users", "enrolments", "sessions", "payments", "requests"], KVS = ["org", "courseOverrides", "customCourses"];
  var snap = {}, pendingLog = [], syncing = null, again = false;
  function blank() {
    return { v: 1, org: { name: "DeepDistrict.si", address: "", email: "", phone: "", taxId: "", currency: "THB", rate: 800, lowHours: 2, noShowCounts: true },
      users: [], courseOverrides: {}, customCourses: [], enrolments: [], sessions: [], payments: [], requests: [], log: [] };
  }
  A.db = blank();
  function snapshot() {
    snap = {};
    COLS.forEach(function (c) { snap[c] = {}; A.db[c].forEach(function (r) { snap[c][r.id] = JSON.stringify(r); }); });
    KVS.forEach(function (k) { snap[k] = JSON.stringify(A.db[k]); });
  }
  A.load = function () {
    return A.api("GET", "bootstrap").then(function (d) {
      var b = blank();
      Object.keys(b).forEach(function (k) { if (d[k] == null) d[k] = b[k]; });
      Object.keys(b.org).forEach(function (k) { if (d.org[k] == null) d.org[k] = b.org[k]; });
      A.db = d; A.me = A.byId("users", d.me.id) || d.me;
      snapshot();
      return A.db;
    });
  };
  function diff() {
    var body = { upserts: {}, deletes: {} }, n = 0;
    COLS.forEach(function (c) {
      var seen = {};
      A.db[c].forEach(function (r) {
        seen[r.id] = 1;
        var j = JSON.stringify(r);
        if (snap[c][r.id] !== j || r.password) { (body.upserts[c] = body.upserts[c] || []).push(r); n++; }
      });
      Object.keys(snap[c]).forEach(function (id) { if (!seen[id]) { (body.deletes[c] = body.deletes[c] || []).push(id); n++; } });
    });
    KVS.forEach(function (k) { if (JSON.stringify(A.db[k]) !== snap[k]) { body[k] = A.db[k]; n++; } });
    if (pendingLog.length) { body.log = pendingLog.splice(0); n++; }
    return n ? body : null;
  }
  A.save = function () {
    if (syncing) { again = true; return syncing; }
    var body = diff();
    if (!body) return Promise.resolve(true);
    A.setSync("saving");
    syncing = A.api("POST", "sync", body).then(function () {
      COLS.forEach(function (c) { A.db[c].forEach(function (r) { if (r.password) delete r.password; }); });
      snapshot(); A.setSync("saved"); return true;
    }).catch(function (e) {
      A.setSync("error");
      if (e.status === 401) { A.toast(A.L("Your session ended — please sign in again.", "หมดเวลาการเข้าระบบ กรุณาเข้าสู่ระบบอีกครั้ง"), "err"); A.me = null; A.boot(); return false; }
      A.toast(A.L("Not saved: ", "บันทึกไม่สำเร็จ: ") + e.message, "err");
      return A.load().then(function () { A.route(); return false; });
    }).then(function (ok) { syncing = null; if (again) { again = false; return A.save(); } return ok; });
    return syncing;
  };
  A.setSync = function (state) { var el = document.getElementById("sync"); if (el) { el.setAttribute("data-state", state); el.textContent = { saving: A.L("Saving…", "กำลังบันทึก…"), saved: A.L("Saved", "บันทึกแล้ว"), error: A.L("Not saved", "ยังไม่บันทึก") }[state] || ""; } };
  A.logAct = function (text) {
    pendingLog.push(text);
    A.db.log.unshift({ at: new Date().toISOString(), by: A.me ? A.me.name : "system", text: text });
  };
  A.dirty = function () { return !!syncing || !!diff_peek(); };
  function diff_peek() { var keep = pendingLog.slice(); var d = diff(); pendingLog = keep; return d; }

  /* collections */
  A.byId = function (col, id) { return A.db[col].filter(function (x) { return x.id === id; })[0]; };
  A.upsert = function (col, obj) {
    var i = A.db[col].findIndex(function (x) { return x.id === obj.id; });
    if (i === -1) { obj.id = obj.id || A.uid(col[0]); obj.createdAt = new Date().toISOString(); A.db[col].push(obj); }
    else A.db[col][i] = Object.assign(A.db[col][i], obj);
    A.save();
    return obj;
  };
  A.remove = function (col, id) { A.db[col] = A.db[col].filter(function (x) { return x.id !== id; }); A.save(); };

  /* ------------------------------------------------------------ courses (public catalogue + overrides + custom) */
  A.courses = function () {
    var pub = ((window.DD_CONTENT || {}).courses || []).map(function (c) {
      var o = A.db.courseOverrides[c.code] || {};
      return { code: c.code, title: c.title, track: c.track, level: c.level, source: "site",
               hours: o.hours != null ? o.hours : (typeof c.hours === "number" ? c.hours : 20),
               rate: o.rate != null ? o.rate : A.db.org.rate, active: o.active !== false };
    });
    return pub.concat(A.db.customCourses.map(function (c) { return Object.assign({ source: "custom", rate: A.db.org.rate, active: true }, c); }));
  };
  A.course = function (code) { return A.courses().filter(function (c) { return c.code === code; })[0]; };
  A.courseName = function (code) { var c = A.course(code); return c ? code + " · " + A.tx(c.title) : code || "–"; };

  /* ------------------------------------------------------------ people */
  A.ROLES = { admin: ["Admin", "ผู้ดูแลระบบ"], teacher: ["Teacher", "ครูผู้สอน"], student: ["Student", "นักเรียน"], parent: ["Parent / guardian", "ผู้ปกครอง"] };
  A.roleName = function (r) { var x = A.ROLES[r]; return x ? A.L(x[0], x[1]) : r; };
  A.people = function (role) { return A.db.users.filter(function (u) { return !role || u.role === role || (role === "staff" && (u.role === "admin" || u.role === "teacher")); }); };
  A.userName = function (id) { var u = A.byId("users", id); return u ? u.name + (u.nick ? " (" + u.nick + ")" : "") : "–"; };

  /* ------------------------------------------------------------ calculations */
  A.STATUS = {
    scheduled: ["Scheduled", "นัดเรียน"], done: ["Completed", "เรียนแล้ว"], rescheduled: ["Moved", "เลื่อนแล้ว"], cancelled: ["Cancelled", "ยกเลิก"], noshow: ["No-show", "ขาดเรียน"]
  };
  A.statusName = function (s) { var x = A.STATUS[s]; return x ? A.L(x[0], x[1]) : s; };
  A.ENR_STATUS = { active: ["Active", "กำลังเรียน"], paused: ["Paused", "พักการเรียน"], completed: ["Completed", "จบแล้ว"], cancelled: ["Cancelled", "ยกเลิก"] };
  A.enrStatusName = function (s) { var x = A.ENR_STATUS[s]; return x ? A.L(x[0], x[1]) : s; };
  A.counts = function (s) { return s.status === "done" || (s.status === "noshow" && A.db.org.noShowCounts); };
  A.sessionsOf = function (enrId) { return A.db.sessions.filter(function (s) { return s.enrolmentId === enrId; }).sort(function (a, b) { return (a.date + (a.start || "")).localeCompare(b.date + (b.start || "")); }); };
  A.paymentsOf = function (enrId) { return A.db.payments.filter(function (p) { return p.enrolmentId === enrId; }).sort(function (a, b) { return a.date.localeCompare(b.date); }); };
  A.stats = function (enr) {
    var ss = A.sessionsOf(enr.id), used = 0, planned = 0;
    ss.forEach(function (s) { if (A.counts(s)) used += +s.hours || 0; else if (s.status === "scheduled") planned += +s.hours || 0; });
    var paid = A.paymentsOf(enr.id).reduce(function (t, p) { return t + (+p.amount || 0); }, 0);
    var total = +enr.hours || 0, fee = +enr.fee || 0;
    return { used: used, planned: planned, remaining: Math.max(0, total - used), over: Math.max(0, used - total), total: total,
             pct: total ? Math.min(100, Math.round(used / total * 100)) : 0, fee: fee, paid: paid, balance: fee - paid,
             unscheduled: Math.max(0, total - used - planned), sessions: ss };
  };
  A.METHODS = { transfer: ["Bank transfer", "โอนเงิน"], promptpay: ["PromptPay QR", "พร้อมเพย์ QR"], card: ["Card", "บัตร"], cash: ["Cash", "เงินสด"], other: ["Other", "อื่น ๆ"] };
  A.methodName = function (m) { var x = A.METHODS[m]; return x ? A.L(x[0], x[1]) : m || "–"; };
  A.enrolmentLabel = function (e) { return A.userName(e.studentId) + " — " + A.courseName(e.courseCode); };

  /* ------------------------------------------------------------ sign-in (server sessions, HttpOnly cookie) */
  A.login = function (email, password) {
    return A.api("POST", "login", { email: email, password: password }).then(function () { return A.load(); }).then(function () { A.touch(); return A.me; });
  };
  A.logout = function () { A.me = null; A.db = blank(); snapshot(); return A.api("POST", "logout").catch(function () {}); };
  A.isAdmin = function () { return A.me && A.me.role === "admin"; };
  A.isStaff = function () { return A.me && (A.me.role === "admin" || A.me.role === "teacher"); };
  A.touch = function () { A.lastActive = Date.now(); };
  A.IDLE_MS = 30 * 60 * 1000;

  /* ------------------------------------------------------------ UI primitives */
  A.toast = function (msg, kind) {
    var t = document.createElement("div");
    t.className = "toast" + (kind ? " toast--" + kind : "");
    t.setAttribute("role", "status");
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add("is-out"); setTimeout(function () { t.remove(); }, 400); }, 2600);
  };
  A.download = function (name, content, type) {
    var blob = content instanceof Blob ? content : new Blob([content], { type: type || "text/plain;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  };
  A.csv = function (rows) {
    return "﻿" + rows.map(function (r) { return r.map(function (v) { v = v == null ? "" : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(","); }).join("\r\n");
  };
  A.slug = function (s) { return String(s).toLowerCase().replace(/[^a-z0-9ก-๙]+/gi, "-").replace(/^-|-$/g, "").slice(0, 40) || "file"; };

  /* Modal form. fields: [{name, label, type, options:[[value,label]], required, value, hint, step, min, full}] */
  A.form = function (opts) {
    var dlg = document.createElement("dialog");
    dlg.className = "modal";
    function field(f) {
      var v = f.value == null ? "" : f.value, id = "f-" + f.name, req = f.required ? " required" : "";
      var input;
      if (f.type === "select") input = '<select id="' + id + '" name="' + f.name + '"' + req + ">" + f.options.map(function (o) { return '<option value="' + A.esc(o[0]) + '"' + (String(o[0]) === String(v) ? " selected" : "") + ">" + A.esc(o[1]) + "</option>"; }).join("") + "</select>";
      else if (f.type === "textarea") input = '<textarea id="' + id + '" name="' + f.name + '" rows="3"' + req + ">" + A.esc(v) + "</textarea>";
      else if (f.type === "checkbox") return '<label class="mf-check' + (f.full ? " mf-full" : "") + '"><input type="checkbox" name="' + f.name + '"' + (v ? " checked" : "") + "> <span>" + A.esc(f.label) + "</span></label>";
      else if (f.type === "days") return '<fieldset class="mf-days mf-full"><legend>' + A.esc(f.label) + "</legend>" + [1, 2, 3, 4, 5, 6, 0].map(function (d) { return '<label><input type="checkbox" name="' + f.name + '" value="' + d + '"' + ((v || []).indexOf(d) !== -1 ? " checked" : "") + "><span>" + A.dayName(d) + "</span></label>"; }).join("") + "</fieldset>";
      else input = '<input id="' + id + '" name="' + f.name + '" type="' + (f.type || "text") + '" value="' + A.esc(v) + '"' + req + (f.step ? ' step="' + f.step + '"' : "") + (f.min != null ? ' min="' + f.min + '"' : "") + (f.autocomplete ? ' autocomplete="' + f.autocomplete + '"' : "") + ">";
      return '<div class="mf' + (f.full ? " mf-full" : "") + '"><label for="' + id + '">' + A.esc(f.label) + (f.required ? " *" : "") + "</label>" + input + (f.hint ? '<small>' + A.esc(f.hint) + "</small>" : "") + "</div>";
    }
    dlg.innerHTML = '<form method="dialog" class="modal__box"><header><h2>' + A.esc(opts.title) + '</h2><button type="button" class="ibtn" data-x aria-label="Close">✕</button></header>' +
      (opts.intro ? '<p class="modal__intro">' + opts.intro + "</p>" : "") +
      '<div class="mf-grid">' + opts.fields.map(field).join("") + "</div>" +
      '<p class="mf-error" role="alert"></p>' +
      "<footer>" + (opts.onDelete ? '<button type="button" class="btn btn--danger" data-del>' + A.L("Delete", "ลบ") + "</button>" : "") +
      (opts.extra || "") + '<span class="spacer"></span><button type="button" class="btn" data-x>' + A.L("Cancel", "ยกเลิก") + '</button><button type="submit" class="btn btn--primary">' + A.esc(opts.submit || A.L("Save", "บันทึก")) + "</button></footer></form>";
    document.body.appendChild(dlg);
    var form = dlg.querySelector("form");
    function close() { dlg.close(); dlg.remove(); }
    A.$$("[data-x]", dlg).forEach(function (b) { b.addEventListener("click", close); });
    dlg.addEventListener("cancel", function (e) { e.preventDefault(); close(); });
    if (opts.onDelete) dlg.querySelector("[data-del]").addEventListener("click", function () {
      if (confirm(A.L("Delete this record? This cannot be undone.", "ลบรายการนี้ใช่ไหม? ไม่สามารถย้อนกลับได้"))) { opts.onDelete(); close(); }
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var out = {};
      opts.fields.forEach(function (f) {
        if (f.type === "checkbox") out[f.name] = form.elements[f.name].checked;
        else if (f.type === "days") out[f.name] = A.$$('input[name="' + f.name + '"]:checked', form).map(function (i) { return +i.value; });
        else if (f.type === "number") out[f.name] = form.elements[f.name].value === "" ? "" : +form.elements[f.name].value;
        else out[f.name] = form.elements[f.name].value.trim();
      });
      var err = opts.validate && opts.validate(out);
      if (!err) A.$$("[required]", form).some(function (i) { if (!String(i.value).trim()) { err = A.L("Please fill in all required fields.", "กรุณากรอกข้อมูลที่จำเป็นให้ครบ"); i.focus(); return true; } });
      if (err) { form.querySelector(".mf-error").textContent = err; return; }
      Promise.resolve(opts.onSave(out)).then(function (keep) { if (keep !== false) close(); });
    });
    if (opts.onReady) opts.onReady(form, dlg);
    dlg.showModal();
    var first = form.querySelector("input:not([type=hidden]), select, textarea");
    if (first) first.focus();
    return dlg;
  };
  A.dayName = function (d, long) {
    var base = new Date(2024, 0, 7 + d); // 7 Jan 2024 is a Sunday
    return base.toLocaleDateString(A.lang === "th" ? "th-TH" : "en-GB", { weekday: long ? "long" : "short" });
  };

  snapshot();
  A.applyTheme();
  document.documentElement.lang = A.lang;
})();
