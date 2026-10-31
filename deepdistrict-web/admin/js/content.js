/* ==========================================================================
   DeepDistrict back office — website content kept in the database
   • Test-prep catalogue: categories and their items (status open / closed /
     cancelled, shown / hidden), each item optionally linked to a course.
   • University finder: programmes and the tests they need (shown / hidden).
   Until an admin saves, the website uses the built-in defaults; the first
   save copies them into the database, and from then on the database wins.
   ========================================================================== */
(function () {
  "use strict";
  var A = window.DDA, L = A.L, esc = A.esc, $ = A.$;
  var C = window.DD_CONTENT || {};
  var STATUS = [["open", ["Open", "เปิด"]], ["closed", ["Closed for now", "ปิดรับชั่วคราว"]], ["cancelled", ["Cancelled", "ยกเลิก"]]];
  var ICONS = ["school", "building", "health", "chip", "spark", "globe", "book", "code", "chart", "trophy", "dna", "pen"];
  var TYPES = [["thai", ["Thai track (TCAS)", "ภาคไทย (TCAS)"]], ["intl", ["International programme in Thailand", "หลักสูตรนานาชาติในไทย"]], ["abroad", ["Abroad", "ต่างประเทศ"]]];

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function tx(v) { return A.tx(v || { en: "", th: "" }); }
  function prep() { if (!Array.isArray(A.db.prepCatalog)) A.db.prepCatalog = clone(C.prepCatalog || []); return A.db.prepCatalog; }
  function paths() { if (!Array.isArray(A.db.pathways)) A.db.pathways = clone(C.pathways || []); return A.db.pathways; }
  function usingDefaults(key) { return !Array.isArray(A.db[key]); }
  function uid(p) { return p + Math.random().toString(36).slice(2, 8); }
  function stLabel(k) { var s = STATUS.filter(function (x) { return x[0] === k; })[0] || STATUS[0]; return L(s[1][0], s[1][1]); }
  function stBadge(k) { return A.badge(k === "open" ? "done" : k === "closed" ? "paused" : "cancelled", stLabel(k)); }
  function visBadge(v) { return v === false ? A.badge("paused", L("Hidden", "ไม่แสดง")) : A.badge("done", L("Shown", "แสดง")); }
  function courseOpts() { return [["", L("— none: links to the contact form —", "— ไม่ผูกคอร์ส: ลิงก์ไปแบบฟอร์มติดต่อ —")]].concat(A.coursesByGroup(A.courses().filter(function (c) { return c.source === "site"; })).map(function (c) { return [c.code, c.code + " · " + A.tx(c.title), A.groupName(c.group)]; })); }
  function commit(msg) { A.logAct(msg); return A.save().then(function (ok) { if (ok !== false) A.toast(L("Saved — the website shows it now", "บันทึกแล้ว เว็บไซต์แสดงผลทันที")); A.route(); }); }
  function move(list, i, d) { var j = i + d; if (j < 0 || j >= list.length) return; var x = list[i]; list[i] = list[j]; list[j] = x; }
  function splitList(v) { return String(v || "").split(",").map(function (x) { return x.trim(); }).filter(Boolean); }

  /* ------------------------------------------------------------ page */
  A.pages.content = function (q) {
    if (!A.isAdmin()) return A.pages.dashboard(q);
    var tab = q.get("tab") === "finder" ? "finder" : "prep";
    var tabs = '<nav class="tabs"><a class="tab' + (tab === "prep" ? " is-on" : "") + '" href="#/content">' + L("Test-prep catalogue", "หมวดคอร์สเตรียมสอบ") + '</a><a class="tab' + (tab === "finder" ? " is-on" : "") + '" href="#/content?tab=finder">' + L("University finder", "ตัวค้นหามหาวิทยาลัย") + "</a></nav>";
    return tab === "finder" ? finderPage(tabs, q) : prepPage(tabs);
  };

  function defaultsNote(key) {
    return usingDefaults(key) ? '<p class="note">' + L("The website currently shows the built-in content. Your first change copies it into the database; after that, everything here is live.", "ขณะนี้เว็บไซต์แสดงเนื้อหาตั้งต้น การแก้ไขครั้งแรกจะคัดลอกเนื้อหาลงฐานข้อมูล หลังจากนั้นทุกอย่างในหน้านี้จะแสดงบนเว็บทันที") + "</p>"
      : '<p class="muted">' + L("Live from the database.", "แสดงผลจากฐานข้อมูล") + ' <button class="linkish" data-act="content-reset" data-key="' + key + '">' + L("Reset to the built-in content", "คืนค่าเนื้อหาตั้งต้น") + "</button></p>";
  }

  function prepPage(tabs) {
    var cats = Array.isArray(A.db.prepCatalog) ? A.db.prepCatalog : (C.prepCatalog || []);
    var html = tabs + defaultsNote("prepCatalog") + cats.map(function (c, ci) {
      return '<section class="box content-cat"><header><h2>' + esc(tx(c.name)) + " " + visBadge(c.visible) + '</h2><div class="btnrow">' +
        '<button class="btn btn--sm" data-act="cat-up" data-i="' + ci + '" aria-label="Up">↑</button><button class="btn btn--sm" data-act="cat-down" data-i="' + ci + '" aria-label="Down">↓</button>' +
        '<button class="btn btn--sm" data-act="cat-edit" data-i="' + ci + '">' + L("Edit", "แก้ไข") + '</button><button class="btn btn--sm btn--primary" data-act="item-new" data-i="' + ci + '">+ ' + L("Item", "รายการ") + "</button></div></header>" +
        (c.text ? '<p class="muted">' + esc(tx(c.text)) + "</p>" : "") +
        A.table([L("Item", "รายการ"), L("Linked course", "คอร์สที่ผูกไว้"), L("Status", "สถานะ"), L("Website", "บนเว็บไซต์"), ""], (c.items || []).map(function (it, ii) {
          return { cells: ["<b>" + esc(it.name) + '</b><br><small class="muted">' + esc(tx(it.note)) + "</small>", it.course ? '<span class="mono">' + esc(it.course) + "</span>" : '<span class="muted">' + L("contact form", "แบบฟอร์มติดต่อ") + "</span>", stBadge(it.status), visBadge(it.visible),
            '<span class="nowrap"><button class="btn btn--sm" data-act="item-up" data-i="' + ci + '" data-j="' + ii + '" aria-label="Up">↑</button><button class="btn btn--sm" data-act="item-down" data-i="' + ci + '" data-j="' + ii + '" aria-label="Down">↓</button><button class="btn btn--sm" data-act="item-edit" data-i="' + ci + '" data-j="' + ii + '">' + L("Edit", "แก้ไข") + "</button></span>"] };
        })) + "</section>";
    }).join("") + '<div class="btnrow"><button class="btn btn--primary" data-act="cat-new">+ ' + L("Category", "หมวดหมู่") + "</button></div>";
    return { title: L("Website content", "เนื้อหาเว็บไซต์"), html: html };
  }

  function finderPage(tabs, q) {
    var list = Array.isArray(A.db.pathways) ? A.db.pathways : (C.pathways || []);
    var fields = C.pathFields || [], f = q.get("field") || "";
    var shown = list.map(function (p, i) { return { p: p, i: i }; }).filter(function (x) { return !f || x.p.field === f; });
    var html = tabs + defaultsNote("pathways") +
      '<p class="muted">' + L("These cards appear in “Which tests does your programme need?” on the Admissions page. Add any university or programme; hide one instead of deleting it if it may come back.", "การ์ดเหล่านี้แสดงในส่วน “หลักสูตรของคุณใช้ข้อสอบอะไร?” ของหน้า Admissions เพิ่มมหาวิทยาลัยหรือหลักสูตรใดก็ได้ หากอาจกลับมาใช้อีก ให้ซ่อนแทนการลบ") + "</p>" +
      '<div class="filters" data-filters><label>' + L("Field", "สาขา") + ' <select name="field"><option value="">' + L("All fields", "ทุกสาขา") + "</option>" + fields.map(function (x) { return '<option value="' + x.id + '"' + (x.id === f ? " selected" : "") + ">" + esc(tx(x.name)) + "</option>"; }).join("") + "</select></label><input type=\"hidden\" name=\"tab\" value=\"finder\"></div>" +
      A.table([L("University", "มหาวิทยาลัย"), L("Programme · route", "หลักสูตร · รอบ"), L("Tests", "ข้อสอบ"), L("Track", "ประเภท"), L("Website", "บนเว็บไซต์"), ""], shown.map(function (x) {
        var p = x.p, t = TYPES.filter(function (k) { return k[0] === p.type; })[0];
        return { cells: ["<b>" + esc(tx(p.uni)) + "</b>", esc(tx(p.prog)) + '<br><small class="muted">' + esc(tx(p.route)) + "</small>", esc((p.tests || []).join(" · ")), t ? esc(L(t[1][0], t[1][1])) : "", visBadge(p.visible),
          '<button class="btn btn--sm" data-act="path-edit" data-i="' + x.i + '">' + L("Edit", "แก้ไข") + "</button>"] };
      })) + '<div class="btnrow"><button class="btn btn--primary" data-act="path-new">+ ' + L("University / programme", "มหาวิทยาลัย / หลักสูตร") + "</button></div>";
    return { title: L("Website content", "เนื้อหาเว็บไซต์"), html: html };
  }

  /* ------------------------------------------------------------ editors */
  function editCat(ci) {
    var cats = prep(), isNew = ci == null, c = isNew ? { id: uid("c"), icon: "spark", visible: true, name: {}, text: {}, items: [] } : cats[ci];
    A.form({
      title: isNew ? L("New category", "หมวดหมู่ใหม่") : L("Edit category", "แก้ไขหมวดหมู่"),
      fields: [
        { name: "nameEn", label: L("Name (English)", "ชื่อ (อังกฤษ)"), value: c.name.en },
        { name: "nameTh", label: L("Name (Thai)", "ชื่อ (ไทย)"), value: c.name.th },
        { name: "textEn", label: L("Short description (English)", "คำอธิบายสั้น (อังกฤษ)"), type: "textarea", value: (c.text || {}).en },
        { name: "textTh", label: L("Short description (Thai)", "คำอธิบายสั้น (ไทย)"), type: "textarea", value: (c.text || {}).th },
        { name: "icon", label: L("Icon", "ไอคอน"), type: "select", value: c.icon, options: ICONS.map(function (k) { return [k, k]; }) },
        { name: "visible", label: L("Show on the website", "แสดงบนเว็บไซต์"), type: "checkbox", value: c.visible !== false, full: true }
      ],
      validate: function (v) { if (!v.nameEn && !v.nameTh) return L("Give a name.", "กรุณาใส่ชื่อ"); },
      onDelete: isNew ? null : function () { if ((c.items || []).length && !confirm(L("Delete the category and its " + c.items.length + " items?", "ลบหมวดหมู่และรายการทั้ง " + c.items.length + " รายการ?"))) return; cats.splice(ci, 1); commit("Deleted test-prep category"); },
      onSave: function (v) {
        c.name = { en: v.nameEn, th: v.nameTh || v.nameEn }; c.text = { en: v.textEn, th: v.textTh || v.textEn }; c.icon = v.icon; c.visible = v.visible;
        if (isNew) cats.push(c);
        return commit("Saved test-prep category " + c.name.en);
      }
    });
  }
  function editItem(ci, ii) {
    var cat = prep()[ci], isNew = ii == null, it = isNew ? { id: uid("i"), name: "", course: "", note: {}, status: "open", visible: true } : cat.items[ii];
    A.form({
      title: (isNew ? L("New item in ", "รายการใหม่ใน ") : L("Edit item in ", "แก้ไขรายการใน ")) + tx(cat.name),
      fields: [
        { name: "name", label: L("Name (as shown, e.g. SAT, TBAT, IELTS)", "ชื่อที่แสดง (เช่น SAT, TBAT, IELTS)"), value: it.name, required: true },
        { name: "course", label: L("Linked course", "คอร์สที่ผูกไว้"), type: "select", value: it.course, options: courseOpts(), full: true },
        { name: "noteEn", label: L("Short note (English)", "คำอธิบายสั้น (อังกฤษ)"), type: "textarea", value: (it.note || {}).en },
        { name: "noteTh", label: L("Short note (Thai)", "คำอธิบายสั้น (ไทย)"), type: "textarea", value: (it.note || {}).th },
        { name: "status", label: L("Status", "สถานะ"), type: "select", value: it.status || "open", options: STATUS.map(function (s) { return [s[0], L(s[1][0], s[1][1])]; }) },
        { name: "visible", label: L("Show on the website", "แสดงบนเว็บไซต์"), type: "checkbox", value: it.visible !== false }
      ],
      onDelete: isNew ? null : function () { cat.items.splice(ii, 1); commit("Deleted test-prep item " + it.name); },
      onSave: function (v) {
        it.name = v.name; it.course = v.course; it.note = { en: v.noteEn, th: v.noteTh || v.noteEn }; it.status = v.status; it.visible = v.visible;
        if (isNew) (cat.items = cat.items || []).push(it);
        return commit("Saved test-prep item " + it.name);
      }
    });
  }
  function editPath(i) {
    var list = paths(), isNew = i == null, p = isNew ? { id: uid("pw"), field: (C.pathFields || [{}])[0].id, type: "thai", uni: {}, prog: {}, route: {}, req: {}, tests: [], courses: [], url: "", visible: true } : list[i];
    A.form({
      title: isNew ? L("New university / programme", "มหาวิทยาลัย / หลักสูตรใหม่") : L("Edit university / programme", "แก้ไขมหาวิทยาลัย / หลักสูตร"),
      fields: [
        { name: "field", label: L("Field", "สาขา"), type: "select", value: p.field, options: (C.pathFields || []).map(function (f) { return [f.id, tx(f.name)]; }) },
        { name: "type", label: L("Track", "ประเภท"), type: "select", value: p.type, options: TYPES.map(function (k) { return [k[0], L(k[1][0], k[1][1])]; }) },
        { name: "uniEn", label: L("University (English)", "มหาวิทยาลัย (อังกฤษ)"), value: p.uni.en, required: true },
        { name: "uniTh", label: L("University (Thai)", "มหาวิทยาลัย (ไทย)"), value: p.uni.th },
        { name: "progEn", label: L("Programme (English)", "หลักสูตร (อังกฤษ)"), value: p.prog.en },
        { name: "progTh", label: L("Programme (Thai)", "หลักสูตร (ไทย)"), value: p.prog.th },
        { name: "routeEn", label: L("Admission round (English)", "รอบรับสมัคร (อังกฤษ)"), value: p.route.en },
        { name: "routeTh", label: L("Admission round (Thai)", "รอบรับสมัคร (ไทย)"), value: p.route.th },
        { name: "tests", label: L("Tests (comma-separated, e.g. TBAT, CU-AAT, IELTS 6.5)", "ข้อสอบ (คั่นด้วยจุลภาค เช่น TBAT, CU-AAT, IELTS 6.5)"), value: (p.tests || []).join(", "), full: true },
        { name: "reqEn", label: L("Requirements (English)", "เกณฑ์ (อังกฤษ)"), type: "textarea", value: p.req.en },
        { name: "reqTh", label: L("Requirements (Thai)", "เกณฑ์ (ไทย)"), type: "textarea", value: p.req.th },
        { name: "courses", label: L("Our courses (codes, comma-separated)", "คอร์สของเรา (รหัส คั่นด้วยจุลภาค)"), value: (p.courses || []).join(", "), full: true, hint: L("e.g. TBT300, AAT210, IEL200", "เช่น TBT300, AAT210, IEL200") },
        { name: "url", label: L("Official link (https://…)", "ลิงก์ทางการ (https://…)"), value: p.url, full: true },
        { name: "visible", label: L("Show on the website", "แสดงบนเว็บไซต์"), type: "checkbox", value: p.visible !== false, full: true }
      ],
      validate: function (v) {
        if (v.url && !/^https?:\/\/\S+$/.test(v.url)) return L("The link must start with https://", "ลิงก์ต้องขึ้นต้นด้วย https://");
        var bad = splitList(v.courses).filter(function (c) { return !A.course(c.toUpperCase()); });
        if (bad.length) return L("Unknown course codes: ", "ไม่พบรหัสคอร์ส: ") + bad.join(", ");
      },
      onDelete: isNew ? null : function () { list.splice(i, 1); commit("Deleted finder entry"); },
      onSave: function (v) {
        p.field = v.field; p.type = v.type; p.uni = { en: v.uniEn, th: v.uniTh || v.uniEn }; p.prog = { en: v.progEn, th: v.progTh || v.progEn }; p.route = { en: v.routeEn, th: v.routeTh || v.routeEn };
        p.tests = splitList(v.tests); p.req = { en: v.reqEn, th: v.reqTh || v.reqEn }; p.courses = splitList(v.courses).map(function (c) { return c.toUpperCase(); }); p.url = v.url; p.visible = v.visible;
        if (isNew) list.push(p);
        return commit("Saved finder entry " + p.uni.en);
      }
    });
  }

  var prev = A.onAct;
  A.onAct = function (act, b, ev) {
    var i = b.hasAttribute("data-i") ? +b.getAttribute("data-i") : null, j = b.hasAttribute("data-j") ? +b.getAttribute("data-j") : null;
    if (act === "cat-new") editCat(null);
    else if (act === "cat-edit") { prep(); editCat(i); }
    else if (act === "cat-up" || act === "cat-down") { move(prep(), i, act === "cat-up" ? -1 : 1); commit("Reordered test-prep categories"); }
    else if (act === "item-new") { prep(); editItem(i, null); }
    else if (act === "item-edit") { prep(); editItem(i, j); }
    else if (act === "item-up" || act === "item-down") { move(prep()[i].items, j, act === "item-up" ? -1 : 1); commit("Reordered test-prep items"); }
    else if (act === "path-new") editPath(null);
    else if (act === "path-edit") { paths(); editPath(i); }
    else if (act === "content-reset") {
      if (!confirm(L("Replace your edits with the built-in content?", "แทนที่การแก้ไขทั้งหมดด้วยเนื้อหาตั้งต้น?"))) return;
      A.db[b.getAttribute("data-key")] = null; commit("Reset website content to defaults");
    }
    else if (prev) prev(act, b, ev);
  };
})();
