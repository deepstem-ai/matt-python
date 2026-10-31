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
  var COLS = ["users", "enrolments", "sessions", "payments", "requests"], KVS = ["org", "courseOverrides", "customCourses", "prepCatalog", "pathways"];
  var snap = {}, pendingLog = [], syncing = null, again = false;
  function blank() {
    return { v: 1, org: { name: "DeepDistrict.si", address: "", email: "", phone: "", taxId: "", currency: "THB", rate: 800, lowHours: 2, noShowCounts: true },
      users: [], courseOverrides: {}, customCourses: [], prepCatalog: null, pathways: null, enrolments: [], sessions: [], payments: [], requests: [], busy: [], log: [] };
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
  // Returns the changes since the last successful sync, plus how to update the
  // snapshot once *exactly these* changes are confirmed (later edits stay pending).
  function diff() {
    var body = { upserts: {}, deletes: {} }, n = 0, after = [];
    COLS.forEach(function (c) {
      var seen = {};
      A.db[c].forEach(function (r) {
        seen[r.id] = 1;
        var j = JSON.stringify(r);
        if (snap[c][r.id] !== j || r.password) {
          var copy = JSON.parse(j);
          (body.upserts[c] = body.upserts[c] || []).push(copy); n++;
          after.push(function () { var x = JSON.parse(j); delete x.password; snap[c][r.id] = JSON.stringify(x); });
        }
      });
      Object.keys(snap[c]).forEach(function (id) { if (!seen[id]) { (body.deletes[c] = body.deletes[c] || []).push(id); n++; after.push(function () { delete snap[c][id]; }); } });
    });
    KVS.forEach(function (k) { var j = JSON.stringify(A.db[k]); if (j !== snap[k]) { body[k] = JSON.parse(j); n++; after.push(function () { snap[k] = j; }); } });
    if (pendingLog.length) { body.log = pendingLog.splice(0); n++; }
    return n ? { body: body, after: after } : null;
  }
  A.save = function () {
    if (syncing) { again = true; return syncing; }
    var d = diff();
    if (!d) return Promise.resolve(true);
    A.setSync("saving");
    syncing = A.api("POST", "sync", d.body).then(function () {
      (d.body.upserts.users || []).forEach(function (u) { if (u.password) { var live = A.byId("users", u.id); if (live) delete live.password; } });
      d.after.forEach(function (f) { f(); });
      A.setSync("saved"); return true;
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
  /* Earlier versions of a record (kept for good in the database archive) */
  A.showHistory = function (col, id) {
    A.api("GET", "history?col=" + encodeURIComponent(col) + "&id=" + encodeURIComponent(id)).then(function (d) {
      var cur = A.byId(col, id), list = d.versions || [];
      function diffText(a, b) {
        var keys = {}; Object.keys(a || {}).concat(Object.keys(b || {})).forEach(function (k) { keys[k] = 1; });
        return Object.keys(keys).filter(function (k) { return k !== "createdAt" && JSON.stringify((a || {})[k]) !== JSON.stringify((b || {})[k]); })
          .map(function (k) { var v = (a || {})[k]; return "<li><b>" + A.esc(k) + ":</b> " + A.esc(v == null ? "–" : typeof v === "object" ? JSON.stringify(v) : String(v)).slice(0, 300) + "</li>"; }).join("");
      }
      var html = list.length ? list.map(function (v, i) {
        var newer = i === 0 ? cur : list[i - 1].data;
        return '<li class="hist__item"><div class="hist__when">' + A.esc(new Date(v.savedAt || v.at).toLocaleString(A.lang === "th" ? "th-TH" : "en-GB")) +
          (v.archived ? ' <span class="badge">' + A.L("archived", "เก็บถาวร") + "</span>" : "") + "</div><ul>" + (diffText(v.data, newer) || "<li>" + A.L("(no field changes)", "(ไม่มีการเปลี่ยนแปลงข้อมูล)") + "</li>") + "</ul></li>";
      }).join("") : "<li>" + A.L("No earlier versions yet — this is the first version.", "ยังไม่มีเวอร์ชันก่อนหน้า — นี่คือเวอร์ชันแรก") + "</li>";
      var dlg = document.createElement("dialog"); dlg.className = "modal";
      dlg.innerHTML = '<div class="modal__box"><header><h2>' + A.L("History — earlier versions", "ประวัติ — เวอร์ชันก่อนหน้า") + '</h2><button type="button" class="ibtn" data-x aria-label="Close">✕</button></header>' +
        '<p class="modal__intro">' + A.L("Every earlier version is kept in the database for good. Each entry shows the values before the next change.", "ทุกเวอร์ชันก่อนหน้าถูกเก็บไว้ในฐานข้อมูลถาวร แต่ละรายการแสดงค่าก่อนการแก้ไขครั้งถัดไป") + '</p><ul class="hist">' + html + "</ul></div>";
      document.body.appendChild(dlg); dlg.showModal();
      dlg.querySelector("[data-x]").addEventListener("click", function () { dlg.close(); dlg.remove(); });
    }).catch(function (e) { A.toast(e.message, "err"); });
  };
  /* Example data (5 example learners) carries an amber tag everywhere */
  A.exTag = function (rec) { return rec && rec.example ? ' <span class="tag-ex" title="' + A.L("Example data", "ข้อมูลตัวอย่าง") + '">' + A.L("Example", "ตัวอย่าง") + "</span>" : ""; };
  A.remove = function (col, id) { A.db[col] = A.db[col].filter(function (x) { return x.id !== id; }); A.save(); };

  /* ------------------------------------------------------------ courses (public catalogue + overrides + custom) */
  A.courses = function () {
    var pub = ((window.DD_CONTENT || {}).courses || []).map(function (c) {
      var o = A.db.courseOverrides[c.code] || {};
      return { code: c.code, title: c.title, track: c.track, level: c.level, group: c.group || "programming", source: "site",
               hours: o.hours != null ? o.hours : (typeof c.hours === "number" ? c.hours : 20),
               rate: o.rate != null ? o.rate : A.db.org.rate,
               status: ["open", "closed", "cancelled"].indexOf(o.status) !== -1 ? o.status : (o.active === false ? "closed" : "open"),
               visible: o.visible !== false };
    });
    return pub.concat(A.db.customCourses.map(function (c) { return Object.assign({ source: "custom", rate: A.db.org.rate, status: c.active === false ? "closed" : "open", visible: true, group: "custom" }, c); }))
      .map(function (c) { c.active = c.status === "open"; return c; });   // only open courses take new enrolments
  };
  // course groups from the public catalogue, plus "custom" for courses added here without a group
  A.groups = function () {
    return ((window.DD_CONTENT || {}).groups || []).map(function (g) { return { id: g.id, name: g.name }; })
      .concat([{ id: "custom", name: { en: "Other / custom", th: "อื่น ๆ / เพิ่มเอง" } }]);
  };
  A.groupName = function (id) { var g = A.groups().filter(function (x) { return x.id === id; })[0]; return g ? A.tx(g.name) : id; };
  // courses ordered by group (catalogue order inside each group)
  A.coursesByGroup = function (list) {
    var order = A.groups().map(function (g) { return g.id; });
    return (list || A.courses()).map(function (c, i) { return { c: c, i: i }; })
      .sort(function (a, b) { return (order.indexOf(a.c.group) - order.indexOf(b.c.group)) || (a.i - b.i); }).map(function (x) { return x.c; });
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
      if (f.type === "select") {
        // options: [value, label] or [value, label, group label] → consecutive groups become <optgroup>
        var html = "", open = null;
        f.options.forEach(function (o) {
          if (o[2] !== open) { if (open) html += "</optgroup>"; open = o[2] || null; if (open) html += '<optgroup label="' + A.esc(open) + '">'; }
          html += '<option value="' + A.esc(o[0]) + '"' + (String(o[0]) === String(v) ? " selected" : "") + ">" + A.esc(o[1]) + "</option>";
        });
        input = '<select id="' + id + '" name="' + f.name + '"' + req + ">" + html + (open ? "</optgroup>" : "") + "</select>";
      }
      else if (f.type === "textarea") input = '<textarea id="' + id + '" name="' + f.name + '" rows="3"' + req + ">" + A.esc(v) + "</textarea>";
      else if (f.type === "checkbox") return '<label class="mf-check' + (f.full ? " mf-full" : "") + '"><input type="checkbox" name="' + f.name + '"' + (v ? " checked" : "") + "> <span>" + A.esc(f.label) + "</span></label>";
      else if (f.type === "slots") return '<fieldset class="mf-slots mf-full" data-slots="' + f.name + '"><legend>' + A.esc(f.label) + "</legend>" + (f.hint ? "<small>" + A.esc(f.hint) + "</small>" : "") + '<div class="slots"></div><button type="button" class="btn btn--sm" data-add-slot>+ ' + A.L("Add a day/time", "เพิ่มวัน/เวลา") + "</button></fieldset>";
      else if (f.type === "days") return '<fieldset class="mf-days mf-full"><legend>' + A.esc(f.label) + "</legend>" + [1, 2, 3, 4, 5, 6, 0].map(function (d) { return '<label><input type="checkbox" name="' + f.name + '" value="' + d + '"' + ((v || []).indexOf(d) !== -1 ? " checked" : "") + "><span>" + A.dayName(d) + "</span></label>"; }).join("") + "</fieldset>";
      else if (f.type === "checks") return '<fieldset class="mf-days mf-checks mf-full" data-checks="' + f.name + '"><legend>' + A.esc(f.label) + "</legend>" + (f.hint ? "<small>" + A.esc(f.hint) + "</small>" : "") + f.options.map(function (o) { return '<label><input type="checkbox" name="' + f.name + '" value="' + A.esc(o[0]) + '"' + ((v || []).indexOf(o[0]) !== -1 ? " checked" : "") + "><span>" + A.esc(o[1]) + "</span></label>"; }).join("") + "</fieldset>";
      else if (f.type === "image") return '<div class="mf mf-full mf-image" data-image="' + f.name + '"><label>' + A.esc(f.label) + "</label>" +
        '<div class="mf-image__row"><img alt="" data-image-preview' + (v ? ' src="' + A.esc(v) + '"' : " hidden") + '><div><input type="file" accept="image/png,image/jpeg,image/webp" data-image-file aria-label="' + A.esc(f.label) + '">' +
        '<button type="button" class="btn btn--sm" data-image-clear' + (v ? "" : " hidden") + ">" + A.L("Remove image", "ลบรูป") + "</button>" + (f.hint ? "<small>" + A.esc(f.hint) + "</small>" : "") + "</div></div>" +
        '<input type="hidden" name="' + f.name + '" value="' + A.esc(v) + '"></div>';
      else input = '<input id="' + id + '" name="' + f.name + '" type="' + (f.type || "text") + '" value="' + A.esc(v) + '"' + req + (f.step ? ' step="' + f.step + '"' : "") + (f.min != null ? ' min="' + f.min + '"' : "") + (f.autocomplete ? ' autocomplete="' + f.autocomplete + '"' : "") + ">";
      return '<div class="mf' + (f.full ? " mf-full" : "") + '"><label for="' + id + '">' + A.esc(f.label) + (f.required ? " *" : "") + "</label>" + input + (f.hint ? '<small>' + A.esc(f.hint) + "</small>" : "") + "</div>";
    }
    dlg.innerHTML = '<form method="dialog" class="modal__box"><header><h2>' + A.esc(opts.title) + '</h2><button type="button" class="ibtn" data-x aria-label="Close">✕</button></header>' +
      (opts.intro ? '<p class="modal__intro">' + opts.intro + "</p>" : "") +
      '<div class="mf-grid">' + opts.fields.filter(function (f) { return !f.more; }).map(field).join("") +
      (opts.fields.some(function (f) { return f.more; }) ? '<details class="mf-more"><summary>' + A.L("More details (optional)", "รายละเอียดเพิ่มเติม (ไม่บังคับ)") + '</summary><div class="mf-grid">' +
        opts.fields.filter(function (f) { return f.more; }).map(field).join("") + "</div></details>" : "") + "</div>" +
      '<p class="mf-error" role="alert"></p>' +
      "<footer>" + (opts.onDelete ? '<button type="button" class="btn btn--danger" data-del>' + A.L("Archive", "ย้ายไปที่เก็บถาวร") + "</button>" : "") +
      (opts.history && A.isAdmin() ? '<button type="button" class="btn" data-hist>' + A.L("History", "ประวัติการแก้ไข") + "</button>" : "") +
      (opts.extra || "") + '<span class="spacer"></span><button type="button" class="btn" data-x>' + A.L("Cancel", "ยกเลิก") + '</button><button type="submit" class="btn btn--primary">' + A.esc(opts.submit || A.L("Save", "บันทึก")) + "</button></footer></form>";
    document.body.appendChild(dlg);
    var form = dlg.querySelector("form");
    function close() { dlg.close(); dlg.remove(); }
    A.$$("[data-x]", dlg).forEach(function (b) { b.addEventListener("click", close); });
    dlg.addEventListener("cancel", function (e) { e.preventDefault(); close(); });
    if (opts.onDelete) dlg.querySelector("[data-del]").addEventListener("click", function () {
      if (confirm(A.L("Move this record to the archive? Nothing is ever deleted — it stays in the database and an admin can restore it (Settings → Archive & history).",
        "ย้ายรายการนี้ไปที่เก็บถาวรใช่ไหม? ระบบไม่ลบข้อมูลใด ๆ — ข้อมูลยังอยู่ในฐานข้อมูล และผู้ดูแลระบบกู้คืนได้ (ตั้งค่า → ที่เก็บถาวรและประวัติ)"))) { opts.onDelete(); close(); }
    });
    if (opts.history && A.isAdmin()) dlg.querySelector("[data-hist]").addEventListener("click", function () { A.showHistory(opts.history.col, opts.history.id); });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var out = {};
      opts.fields.forEach(function (f) {
        if (f.type === "checkbox") out[f.name] = form.elements[f.name].checked;
        else if (f.type === "slots") out[f.name] = A.$$('[data-slots="' + f.name + '"] .slot', form).map(function (r) { return { day: +r.querySelector("[data-k=day]").value, start: r.querySelector("[data-k=start]").value, end: r.querySelector("[data-k=end]").value, location: r.querySelector("[data-k=location]").value.trim() }; }).filter(function (x) { return x.start && x.end; });
        else if (f.type === "days") out[f.name] = A.$$('input[name="' + f.name + '"]:checked', form).map(function (i) { return +i.value; });
        else if (f.type === "checks") out[f.name] = A.$$('input[name="' + f.name + '"]:checked', form).map(function (i) { return i.value; });
        else if (f.type === "image") out[f.name] = form.elements[f.name].value;
        else if (f.type === "number") out[f.name] = form.elements[f.name].value === "" ? "" : +form.elements[f.name].value;
        else out[f.name] = form.elements[f.name].value.trim();
      });
      var err = opts.validate && opts.validate(out);
      if (!err) A.$$("[required]", form).some(function (i) { if (!String(i.value).trim()) { err = A.L("Please fill in all required fields.", "กรุณากรอกข้อมูลที่จำเป็นให้ครบ"); i.focus(); return true; } });
      if (err) { form.querySelector(".mf-error").textContent = err; return; }
      Promise.resolve(opts.onSave(out)).then(function (keep) { if (keep !== false) close(); });
    });
    // image fields: shrink the picked file in the browser (max 1200 px, WebP/JPEG) and keep it as a data URL
    opts.fields.filter(function (f) { return f.type === "image"; }).forEach(function (f) {
      var box = form.querySelector('[data-image="' + f.name + '"]'), prev = box.querySelector("[data-image-preview]"), hidden = form.elements[f.name], clr = box.querySelector("[data-image-clear]");
      box.querySelector("[data-image-file]").addEventListener("change", function (e) {
        var file = e.target.files[0]; if (!file) return;
        var img = new Image(), url = URL.createObjectURL(file);
        img.onload = function () {
          var sc = Math.min(1, 1200 / Math.max(img.width, img.height)), c = document.createElement("canvas");
          c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          var data = c.toDataURL("image/webp", 0.85);
          if (data.indexOf("data:image/webp") !== 0) data = c.toDataURL("image/jpeg", 0.85);
          URL.revokeObjectURL(url);
          hidden.value = data; prev.src = data; prev.hidden = false; clr.hidden = false;
        };
        img.onerror = function () { URL.revokeObjectURL(url); A.toast(A.L("This file is not an image.", "ไฟล์นี้ไม่ใช่รูปภาพ"), "err"); };
        img.src = url;
      });
      clr.addEventListener("click", function () { hidden.value = ""; prev.removeAttribute("src"); prev.hidden = true; clr.hidden = true; });
    });
    opts.fields.filter(function (f) { return f.type === "slots"; }).forEach(function (f) {
      var box = form.querySelector('[data-slots="' + f.name + '"] .slots');
      function row(sl) {
        var d = document.createElement("div"); d.className = "slot";
        d.innerHTML = '<select data-k="day" aria-label="Day">' + [1, 2, 3, 4, 5, 6, 0].map(function (n) { return '<option value="' + n + '"' + (+sl.day === n ? " selected" : "") + ">" + A.dayName(n, true) + "</option>"; }).join("") + "</select>" +
          '<input type="time" data-k="start" aria-label="Start" value="' + A.esc(sl.start || "18:00") + '"><span>–</span><input type="time" data-k="end" aria-label="End" value="' + A.esc(sl.end || "19:00") + '">' +
          '<input data-k="location" placeholder="' + A.esc(A.L("Room / place (optional)", "ห้อง / สถานที่ (ไม่บังคับ)")) + '" value="' + A.esc(sl.location || "") + '">' +
          '<button type="button" class="ibtn" data-del-slot aria-label="Remove">✕</button>';
        d.querySelector("[data-del-slot]").addEventListener("click", function () { d.remove(); form.dispatchEvent(new Event("input")); });
        box.appendChild(d);
      }
      (f.value && f.value.length ? f.value : [{ day: 2, start: "18:00", end: "19:00" }]).forEach(row);
      form.querySelector('[data-slots="' + f.name + '"] [data-add-slot]').addEventListener("click", function () {
        var last = A.$$(".slot", box).pop();
        row(last ? { day: (+last.querySelector("[data-k=day]").value + 1) % 7, start: last.querySelector("[data-k=start]").value, end: last.querySelector("[data-k=end]").value } : {});
        form.dispatchEvent(new Event("input"));
      });
    });
    if (opts.onReady) opts.onReady(form, dlg);
    dlg.showModal();
    var first = form.querySelector("input:not([type=hidden]), select, textarea");
    if (first) first.focus();
    return dlg;
  };
  /* Amount in words: Thai (บาทถ้วน) and English */
  A.bahtText = function (n) {
    var D = ["", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"], P = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน"];
    function chunk(x) {
      var s = String(x), out = "";
      for (var i = 0; i < s.length; i++) {
        var d = +s[i], pos = s.length - i - 1;
        if (!d) continue;
        if (pos === 1 && d === 1) out += "สิบ";
        else if (pos === 1 && d === 2) out += "ยี่สิบ";
        else if (pos === 0 && d === 1 && s.length > 1) out += "เอ็ด";
        else out += D[d] + P[pos];
      }
      return out;
    }
    function words(x) { if (x >= 1e6) return words(Math.floor(x / 1e6)) + "ล้าน" + chunk(x % 1e6); return chunk(x); }
    n = Math.round((+n || 0) * 100);
    var baht = Math.floor(n / 100), satang = n % 100;
    if (!baht && !satang) return "ศูนย์บาทถ้วน";
    return (baht ? words(baht) + "บาท" : "") + (satang ? words(satang) + "สตางค์" : "ถ้วน");
  };
  A.moneyWords = function (n) {
    var ones = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
    var tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
    function w(x) {
      if (x < 20) return ones[x];
      if (x < 100) return tens[Math.floor(x / 10)] + (x % 10 ? "-" + ones[x % 10] : "");
      if (x < 1000) return ones[Math.floor(x / 100)] + " hundred" + (x % 100 ? " " + w(x % 100) : "");
      if (x < 1e6) return w(Math.floor(x / 1000)) + " thousand" + (x % 1000 ? " " + w(x % 1000) : "");
      return w(Math.floor(x / 1e6)) + " million" + (x % 1e6 ? " " + w(x % 1e6) : "");
    }
    n = Math.round((+n || 0) * 100);
    var b = Math.floor(n / 100), s = n % 100, cur = A.db.org.currency || "THB";
    var t = (b ? w(b) : "zero") + " " + (cur === "THB" ? "baht" : cur) + (s ? " and " + w(s) + " satang" : " only");
    return t.charAt(0).toUpperCase() + t.slice(1);
  };
  A.nextReceiptNo = function () {
    var y = new Date().getFullYear(), pre = "RC" + y + "-", max = 0;
    A.db.payments.forEach(function (p) { if ((p.ref || "").indexOf(pre) === 0) max = Math.max(max, +(p.ref.slice(pre.length)) || 0); });
    return pre + ("000" + (max + 1)).slice(-4);
  };

  A.dayName = function (d, long) {
    var base = new Date(2024, 0, 7 + d); // 7 Jan 2024 is a Sunday
    return base.toLocaleDateString(A.lang === "th" ? "th-TH" : "en-GB", { weekday: long ? "long" : "short" });
  };

  snapshot();
  A.applyTheme();
  document.documentElement.lang = A.lang;
})();
