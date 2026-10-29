/* ==========================================================================
   DeepDistrict back office — core: i18n, helpers, data store, calculations,
   authentication. Data lives only in this browser (localStorage) and can be
   exported / imported as a JSON backup from Settings.
   ========================================================================== */
(function () {
  "use strict";

  var A = window.DDA = {};
  var KEY = "dd-admin-v1", LANG_KEY = "dd-admin-lang", THEME_KEY = "dd-admin-theme", SESSION_KEY = "dd-admin-session";

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

  /* ------------------------------------------------------------ data store */
  function blank() {
    return {
      v: 1,
      org: { name: "DeepDistrict.si", address: "Bangkok, Thailand", email: "info@deepdistrict.si", phone: "", taxId: "",
             currency: "THB", rate: 800, lowHours: 2, noShowCounts: true },
      users: [], courseOverrides: {}, customCourses: [], enrolments: [], sessions: [], payments: [], log: []
    };
  }
  A.load = function () {
    var d = null;
    try { d = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { d = null; }
    A.db = d && d.v === 1 ? d : blank();
    var b = blank();
    Object.keys(b).forEach(function (k) { if (A.db[k] == null) A.db[k] = b[k]; });
    Object.keys(b.org).forEach(function (k) { if (A.db.org[k] == null) A.db.org[k] = b.org[k]; });
    return A.db;
  };
  A.save = function () {
    try { localStorage.setItem(KEY, JSON.stringify(A.db)); return true; }
    catch (e) { A.toast(A.L("Could not save — browser storage is full or blocked. Export a backup now.", "บันทึกไม่ได้ — พื้นที่เก็บข้อมูลของเบราว์เซอร์เต็มหรือถูกปิดกั้น กรุณาส่งออกไฟล์สำรองทันที"), "err"); return false; }
  };
  A.logAct = function (text) {
    A.db.log.unshift({ at: new Date().toISOString(), by: A.me ? A.me.name : "system", text: text });
    if (A.db.log.length > 300) A.db.log.length = 300;
  };
  A.reset = function () { A.db = blank(); A.save(); };
  A.exportJSON = function () { return JSON.stringify(A.db, null, 2); };
  A.importJSON = function (text) {
    var d = JSON.parse(text);
    if (!d || d.v !== 1 || !Array.isArray(d.users)) throw new Error("bad file");
    A.db = d;
    if (!A.save()) throw new Error("save failed");
    A.load(); // normalise missing fields
    A.save();
  };

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
    scheduled: ["Scheduled", "นัดเรียน"], done: ["Completed", "เรียนแล้ว"], cancelled: ["Cancelled", "ยกเลิก"], noshow: ["No-show", "ขาดเรียน"]
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

  /* ------------------------------------------------------------ authentication (local) */
  function hex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ("0" + b.toString(16)).slice(-2); }).join(""); }
  A.hashPassword = function (password, salt) {
    salt = salt || hex(crypto.getRandomValues(new Uint8Array(16)));
    if (!window.crypto || !crypto.subtle) return Promise.reject(new Error("WebCrypto unavailable"));
    var enc = new TextEncoder();
    return crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]).then(function (key) {
      return crypto.subtle.deriveBits({ name: "PBKDF2", salt: enc.encode(salt), iterations: 150000, hash: "SHA-256" }, key, 256);
    }).then(function (bits) { return { salt: salt, hash: hex(bits) }; });
  };
  A.login = function (email, password) {
    var u = A.db.users.filter(function (x) { return x.pass && x.active !== false && (x.email || "").toLowerCase() === String(email).trim().toLowerCase(); })[0];
    if (!u) return Promise.resolve(null);
    return A.hashPassword(password, u.pass.salt).then(function (r) {
      if (r.hash !== u.pass.hash) return null;
      A.me = u; try { sessionStorage.setItem(SESSION_KEY, u.id); } catch (e) {}
      A.touch(); return u;
    });
  };
  A.restore = function () {
    var id = null; try { id = sessionStorage.getItem(SESSION_KEY); } catch (e) {}
    var u = id && A.byId("users", id);
    A.me = u && u.pass && u.active !== false ? u : null;
    return A.me;
  };
  A.logout = function () { A.me = null; try { sessionStorage.removeItem(SESSION_KEY); } catch (e) {} };
  A.isAdmin = function () { return A.me && A.me.role === "admin"; };
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

  A.load();
  A.applyTheme();
  document.documentElement.lang = A.lang;
})();
