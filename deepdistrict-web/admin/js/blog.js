/* ==========================================================================
   DeepDistrict back office — News blog (AI writer + editor) and AI settings
   * #/blog          posts by status; "Write with AI" (topic + scope) and the automatic schedule
   * #/blog/<id>     editor: both languages, sources, cover (AI drawing / free photo / upload)
   * #/ai            Claude connection, model, monthly limits, usage log
   ========================================================================== */
(function () {
  "use strict";
  var A = window.DDA, L = A.L, esc = A.esc, $ = A.$, $$ = A.$$;
  var state = null, aiState = null, poll = null;

  var ST = {
    idea: ["Idea / failed", "ไอเดีย / ไม่สำเร็จ", "paused"], drafting: ["AI is writing…", "AI กำลังเขียน…", "scheduled"], review: ["Waiting for review", "รอตรวจ", "scheduled"],
    scheduled: ["Scheduled", "ตั้งเวลาเผยแพร่", "scheduled"], published: ["Published", "เผยแพร่แล้ว", "done"], archived: ["Archived", "เก็บถาวร", "completed"], rejected: ["Rejected", "ไม่ใช้", "cancelled"]
  };
  var IMG = { "photo-then-draw": ["Free photo, or an AI drawing if none fits", "ภาพฟรีลิขสิทธิ์ ถ้าไม่มีให้ AI วาด"], draw: ["AI drawing", "AI วาดภาพประกอบ"], photo: ["Free-licence photo only", "ภาพฟรีลิขสิทธิ์เท่านั้น"], none: ["No cover image", "ไม่ใส่ภาพปก"] };
  var AIP = { off: ["AI is switched off", "ปิด AI อยู่"], sdk: ["the anthropic package is not installed on the server", "เซิร์ฟเวอร์ยังไม่ได้ติดตั้งแพ็กเกจ anthropic"],
    key: ["no API key on the server (ANTHROPIC_API_KEY)", "เซิร์ฟเวอร์ยังไม่มีคีย์ API (ANTHROPIC_API_KEY)"], model: ["no model chosen", "ยังไม่ได้เลือกโมเดล"],
    "jobs-limit": ["this month's job limit is reached", "ครบจำนวนงาน AI ของเดือนนี้แล้ว"], "budget-limit": ["this month's budget is reached", "ใช้งบ AI ของเดือนนี้ครบแล้ว"] };

  function tx(v) { return v ? (A.lang === "th" ? v.th || v.en : v.en || v.th) || "" : ""; }
  function load() { return A.api("GET", "blog-admin").then(function (d) { state = d; return d; }); }
  function act(body) { return A.api("POST", "blog-admin", body).catch(function (e) { A.toast(e.message, "err"); throw e; }); }
  function catName(id) { var c = state && state.settings.categories.filter(function (x) { return x.id === id; })[0]; return c ? tx(c.name) : id; }
  function aiProblems(st) { return (st.problems || []).map(function (p) { var x = AIP[p]; return x ? L(x[0], x[1]) : p; }).join(" · "); }
  function stopPoll() { if (poll) { clearInterval(poll); poll = null; } }
  window.addEventListener("hashchange", stopPoll);
  function watch(draw) {   // refresh while the AI is working
    stopPoll();
    if (!state || !state.posts.some(function (p) { return p.status === "drafting"; })) return;
    poll = setInterval(function () {
      if (!/^#\/blog/.test(location.hash)) return stopPoll();
      load().then(draw).then(function () { if (!state.posts.some(function (p) { return p.status === "drafting"; })) { stopPoll(); A.toast(L("AI draft ready", "AI เขียนร่างเสร็จแล้ว")); } });
    }, 4000);
  }

  /* ------------------------------------------------------------ list */
  A.pages.blog = function (q, id) {
    if (!A.isAdmin()) return A.pages.dashboard(new URLSearchParams());
    if (id) return editor(id);
    var filter = q.get("s") || "";
    return {
      title: L("News blog", "บล็อกข่าวสาร"),
      actions: '<button class="btn" data-act="blog-new">+ ' + L("Write myself", "เขียนเอง") + '</button><button class="btn btn--primary" data-act="blog-ai">✦ ' + L("Write with AI", "ให้ AI เขียน") + "</button>",
      html: '<div data-blog-list data-filter="' + esc(filter) + '"><p class="muted">' + L("Loading…", "กำลังโหลด…") + "</p></div>",
      after: function () { load().then(drawList).then(function () { watch(drawList); }).catch(function (e) { A.toast(e.message, "err"); }); }
    };
  };

  function drawList() {
    var el = $("[data-blog-list]"); if (!el || !state) return;
    var f = el.getAttribute("data-filter"), s = state.settings, ai = state.ai, counts = {};
    state.posts.forEach(function (p) { counts[p.status] = (counts[p.status] || 0) + 1; });
    var rows = state.posts.filter(function (p) { return !f || p.status === f || (f === "review" && p.status === "drafting"); });
    var auto = s.auto || {};
    el.innerHTML =
      '<section class="box blog-top"><div><h2>' + L("Status", "สถานะ") + "</h2><p>" +
      (ai.ready ? '<span class="ok">● ' + L("AI ready", "AI พร้อมใช้งาน") + "</span> · " + L("this month: ", "เดือนนี้: ") + ai.month.jobs + "/" + (ai.settings.monthlyJobs || "∞") + L(" jobs", " งาน") + " · $" + A.num(ai.month.cost, 2) + (ai.settings.monthlyUSD ? " / $" + ai.settings.monthlyUSD : "")
        : '<span class="off">● ' + L("AI not ready: ", "AI ยังไม่พร้อม: ") + esc(aiProblems(ai)) + '</span> <a href="#/ai">' + L("AI settings →", "ตั้งค่า AI →") + "</a>") + "<br>" +
      L("Automatic writer: ", "เขียนอัตโนมัติ: ") + (auto.enabled ? '<span class="ok">' + L("ON", "เปิด") + "</span> · " + (auto.days.length ? auto.days.map(function (d) { return A.dayName(d); }).join(" ") : L("every day", "ทุกวัน")) + " " + L("from ", "ตั้งแต่ ") + A.pad(auto.hour) + ":00 · " + auto.perRun + L(" post(s) each time", " บทความต่อครั้ง") : '<span class="off">' + L("OFF", "ปิด") + "</span>") +
      " · " + L("Public news page: ", "หน้าข่าวสาธารณะ: ") + (s.enabled ? '<span class="ok">' + L("ON", "เปิด") + "</span>" : '<span class="off">' + L("OFF", "ปิด") + "</span>") +
      '</p></div><div class="btnrow"><button class="btn" data-act="blog-settings">' + L("Blog settings", "ตั้งค่าบล็อก") + '</button><a class="btn" href="../pages/blog.html" target="_blank" rel="noopener">' + L("Open news page ↗", "เปิดหน้าข่าว ↗") + "</a></div></section>" +
      '<div class="tabs">' + [["", L("All", "ทั้งหมด"), state.posts.length]].concat(["review", "scheduled", "published", "idea", "archived", "rejected"].map(function (k) { return [k, L(ST[k][0], ST[k][1]), (counts[k] || 0) + (k === "review" ? counts.drafting || 0 : 0)]; }))
        .map(function (t) { return '<a class="tab' + (t[0] === f ? " is-on" : "") + '" href="#/blog' + (t[0] ? "?s=" + t[0] : "") + '">' + esc(t[1]) + " <span>" + t[2] + "</span></a>"; }).join("") + "</div>" +
      (rows.length ? '<div class="tbl-wrap"><table class="tbl tbl--click blog-tbl"><thead><tr><th></th><th>' + L("Article", "บทความ") + "</th><th>" + L("Branch · category", "หมวด") + "</th><th>" + L("Status", "สถานะ") + "</th><th>" + L("Updated", "แก้ไขล่าสุด") + "</th></tr></thead><tbody>" +
        rows.map(function (p) {
          var st = ST[p.status] || ST.idea, t = tx(p.title) || (p.ai && p.ai.topic) || L("(untitled)", "(ยังไม่มีชื่อ)");
          return '<tr data-post="' + esc(p.id) + '"><td>' + (p.cover ? '<img class="popups-thumb" src="' + esc(p.cover) + '" alt="">' : '<span class="popups-thumb popups-thumb--none">—</span>') + "</td>" +
            "<td><b>" + esc(t) + "</b>" + (p.ai && p.ai.used ? ' <span class="badge badge--scheduled">AI</span>' : "") +
            (p.ai && p.ai.error ? '<br><small class="err-text">' + esc(p.ai.error) + "</small>" : p.problems && p.problems.length && p.status === "review" ? '<br><small class="muted">' + esc(p.problems.join(" · ")) + "</small>" : "") + "</td>" +
            "<td>" + esc(tx(state.branches[p.branch])) + '<br><small class="muted">' + esc(catName(p.category)) + "</small></td>" +
            "<td>" + A.badge(st[2], L(st[0], st[1])) + (p.status === "scheduled" && p.publishAt ? '<br><small class="muted">' + esc(p.publishAt.replace("T", " ")) + "</small>" : "") + "</td>" +
            '<td class="nowrap">' + esc(new Date(p.updatedAt).toLocaleString(A.lang === "th" ? "th-TH" : "en-GB", { dateStyle: "medium", timeStyle: "short" })) + "</td></tr>";
        }).join("") + "</tbody></table></div>"
        : A.empty("No articles here yet. Give the AI a topic, or switch on the automatic writer.", "ยังไม่มีบทความ ลองให้ AI เขียนจากหัวข้อ หรือเปิดการเขียนอัตโนมัติ", '<button class="btn btn--primary" data-act="blog-ai">✦ ' + L("Write with AI", "ให้ AI เขียน") + "</button>"));
    $$("[data-post]", el).forEach(function (tr) { tr.addEventListener("click", function () { location.hash = "#/blog/" + tr.getAttribute("data-post"); }); });
  }

  function catOptions(sel) {
    return state.settings.categories.map(function (c) { return [c.id, tx(c.name), tx(state.branches[c.branch])]; }).sort(function (a, b) { return a[2] === b[2] ? 0 : a[2] < b[2] ? -1 : 1; });
  }
  function writeWithAI(post) {
    if (!state) return load().then(function () { writeWithAI(post); });
    if (!state.ai.ready) return A.toast(L("AI is not ready: ", "AI ยังไม่พร้อม: ") + aiProblems(state.ai), "err");
    A.form({
      title: post ? L("Rewrite with AI", "ให้ AI เขียนใหม่") : L("Write a news article with AI", "ให้ AI เขียนบทความข่าว"),
      intro: esc(L("The AI searches only the trusted sites of the branch, writes Thai and English versions in our tone, lists its sources and finds a free-licence photo (or draws a cover). The draft waits for your review — nothing is published automatically from here.",
        "AI จะค้นข้อมูลเฉพาะเว็บไซต์ที่เชื่อถือได้ของหมวดนั้น เขียนทั้งภาษาไทยและอังกฤษตามสำนวนของเรา ระบุแหล่งอ้างอิง และหาภาพฟรีลิขสิทธิ์ (หรือวาดภาพปก) ร่างจะรอให้คุณตรวจก่อน จากหน้านี้จะไม่มีการเผยแพร่อัตโนมัติ")),
      fields: [
        { name: "category", label: L("Category (branch)", "หมวด (สาขา)"), type: "select", options: catOptions(), value: post ? post.category : "tcas", full: true },
        { name: "topic", label: L("Topic (leave empty to let the AI choose a recent topic)", "หัวข้อ (เว้นว่างเพื่อให้ AI เลือกข่าวล่าสุดเอง)"), value: post ? post.ai.topic : "", full: true },
        { name: "scope", label: L("Scope — what to cover, who it is for, what to avoid", "ขอบเขต — ประเด็นที่ต้องการ กลุ่มผู้อ่าน สิ่งที่ไม่ต้องการ"), type: "textarea", value: post ? post.ai.scope : "", full: true,
          hint: L("e.g. \"TCAS70 round 1 portfolio dates for medicine; for M.5–M.6 and parents; no rumours\"", "เช่น \"วันยื่นพอร์ต TCAS70 รอบ 1 สายแพทย์ สำหรับ ม.5–ม.6 และผู้ปกครอง ไม่เอาข่าวลือ\"") }
      ],
      submit: L("Start writing", "เริ่มเขียน"),
      onSave: function (v) {
        return act({ generate: { id: post && post.id, category: v.category, topic: v.topic, scope: v.scope } }).then(function (r) {
          A.toast(L("The AI is writing — this takes about a minute.", "AI กำลังเขียน ใช้เวลาประมาณ 1 นาที"));
          return load().then(function () { if (location.hash === "#/blog/" + r.id) A.route(); else location.hash = "#/blog/" + r.id; });
        }).catch(function () { return false; });
      }
    });
  }

  /* ------------------------------------------------------------ editor */
  function editor(id) {
    return {
      title: L("Edit article", "แก้ไขบทความ"),
      actions: '<a class="btn" href="#/blog">← ' + L("All articles", "บทความทั้งหมด") + "</a>",
      html: '<div data-blog-edit="' + esc(id) + '"><p class="muted">' + L("Loading…", "กำลังโหลด…") + "</p></div>",
      after: function () { load().then(drawEditor).then(function () { watch(drawEditor); }).catch(function (e) { A.toast(e.message, "err"); }); }
    };
  }
  function srcText(list) { return (list || []).map(function (s) { return (s.title ? s.title + " | " : "") + s.url; }).join("\n"); }
  function parseSrc(t) { return t.split(/\n/).map(function (l) { l = l.trim(); if (!l) return null; var i = l.lastIndexOf("|"); return i === -1 ? { title: "", url: l } : { title: l.slice(0, i).trim(), url: l.slice(i + 1).trim() }; }).filter(Boolean); }

  function drawEditor() {
    var el = $("[data-blog-edit]"); if (!el || !state) return;
    var p = state.posts.filter(function (x) { return x.id === el.getAttribute("data-blog-edit"); })[0];
    if (!p) { el.innerHTML = A.empty("Article not found.", "ไม่พบบทความ"); return; }
    if (el.contains(document.activeElement) && p.status !== "drafting") return;   // don't wipe what someone is typing
    var st = ST[p.status] || ST.idea, busy = p.status === "drafting", cr = p.coverCredit || {};
    var steps = [];
    if (p.status === "review" || p.status === "idea" || p.status === "rejected" || p.status === "archived") steps.push(["published", L("Publish now", "เผยแพร่ทันที"), "btn--primary"], ["scheduled", L("Schedule…", "ตั้งเวลา…"), ""]);
    if (p.status === "scheduled") steps.push(["published", L("Publish now", "เผยแพร่ทันที"), "btn--primary"], ["review", L("Cancel schedule", "ยกเลิกการตั้งเวลา"), ""]);
    if (p.status === "published") steps.push(["archived", L("Unpublish (archive)", "เลิกเผยแพร่ (เก็บถาวร)"), ""]);
    if (p.status === "review" || p.status === "idea") steps.push(["rejected", L("Reject", "ไม่ใช้บทความนี้"), ""]);
    el.innerHTML =
      '<section class="box blog-ed-head"><div><h2>' + esc(tx(p.title) || p.ai.topic || L("(untitled)", "(ยังไม่มีชื่อ)")) + "</h2><p>" + A.badge(st[2], L(st[0], st[1])) + " · " + esc(tx(state.branches[p.branch])) + " · " + esc(catName(p.category)) +
      (p.status === "published" ? ' · <a href="../pages/blog.html?p=' + encodeURIComponent(p.slug) + '" target="_blank" rel="noopener">' + L("View on website ↗", "ดูบนเว็บไซต์ ↗") + "</a>" : "") + "</p>" +
      (busy ? '<p class="muted">⏳ ' + L("The AI is researching and writing. This page refreshes by itself.", "AI กำลังค้นข้อมูลและเขียน หน้านี้จะอัปเดตเอง") + "</p>" : "") +
      (p.ai.error ? '<p class="err-text">' + esc(p.ai.error) + "</p>" : "") +
      (p.problems.length && !busy ? '<p class="warn-text">' + L("Before publishing: ", "ก่อนเผยแพร่: ") + esc(p.problems.join(" · ")) + "</p>" : "") +
      (p.ai.notes && p.ai.notes.length ? '<p class="muted">' + esc(p.ai.notes.join(" · ")) + "</p>" : "") +
      '</div><div class="btnrow">' + (busy ? "" : steps.map(function (s) { return '<button class="btn ' + s[2] + '" data-blog-status="' + s[0] + '">' + esc(s[1]) + "</button>"; }).join("") +
        '<button class="btn" data-act="blog-rewrite">✦ ' + L("Rewrite with AI", "ให้ AI เขียนใหม่") + "</button>") + "</div></section>" +
      (busy ? "" :
      '<form class="box blog-form" data-blog-form><div class="mf-grid">' +
      '<div class="mf"><label>' + L("Category", "หมวด") + '</label><select name="category">' + catOptions().map(function (o) { return '<option value="' + esc(o[0]) + '"' + (o[0] === p.category ? " selected" : "") + ">" + esc(o[2] + " › " + o[1]) + "</option>"; }).join("") + "</select></div>" +
      '<div class="mf"><label>' + L("Web address (slug)", "ที่อยู่หน้า (slug)") + '</label><input name="slug" value="' + esc(p.slug) + '"></div>' +
      field("titleTh", L("Title (Thai)", "หัวข้อ (ไทย)"), p.title.th) + field("titleEn", L("Title (English)", "หัวข้อ (อังกฤษ)"), p.title.en) +
      area("summaryTh", L("Summary (Thai)", "สรุปสั้น (ไทย)"), p.summary.th, 2) + area("summaryEn", L("Summary (English)", "สรุปสั้น (อังกฤษ)"), p.summary.en, 2) +
      area("bodyTh", L("Article (Thai)", "เนื้อหา (ไทย)"), p.body.th, 16) + area("bodyEn", L("Article (English)", "เนื้อหา (อังกฤษ)"), p.body.en, 16) +
      '<div class="mf mf-full"><small>' + L("Formatting: \"## \" heading · \"- \" bullet · **bold** · [link text](https://…)", "รูปแบบ: \"## \" หัวข้อย่อย · \"- \" รายการ · **ตัวหนา** · [ข้อความลิงก์](https://…)") + "</small></div>" +
      area("sources", L("Sources — one per line: Title | https://…", "แหล่งอ้างอิง — บรรทัดละหนึ่งแหล่ง: ชื่อ | https://…"), srcText(p.sources), 4, true) +
      field("tags", L("Tags (comma separated)", "แท็ก (คั่นด้วยจุลภาค)"), (p.tags || []).join(", "), true) +
      '<div class="mf mf-full blog-cover"><label>' + L("Cover image", "ภาพปก") + "</label>" +
      (p.cover ? '<img src="' + esc(p.cover) + '" alt="">' : '<p class="muted">' + L("No cover yet.", "ยังไม่มีภาพปก") + "</p>") +
      (p.coverKind === "photo" ? '<small>' + L("Photo: ", "ภาพ: ") + esc(cr.title || "") + (cr.creator ? " · " + esc(cr.creator) : "") + " · " + esc(cr.license || "") + (cr.source ? ' · <a href="' + esc(cr.source) + '" target="_blank" rel="noopener">' + L("source", "ที่มา") + "</a>" : "") + "</small>" : p.coverKind === "drawing" ? "<small>" + L("AI drawing (made for us)", "ภาพวาดโดย AI (สร้างให้เราโดยเฉพาะ)") + "</small>" : "") +
      '<div class="btnrow"><button type="button" class="btn btn--sm" data-act="blog-photo">' + L("Find a free photo", "ค้นหาภาพฟรีลิขสิทธิ์") + '</button><button type="button" class="btn btn--sm" data-act="blog-draw">✦ ' + L("AI drawing", "ให้ AI วาด") + '</button>' +
      '<label class="btn btn--sm">' + L("Upload…", "อัปโหลด…") + '<input type="file" accept="image/png,image/jpeg,image/webp" data-cover-file hidden></label>' + (p.cover ? '<button type="button" class="btn btn--sm" data-act="blog-nocover">' + L("Remove", "ลบ") + "</button>" : "") + "</div></div>" +
      '</div><footer class="btnrow"><button type="button" class="btn btn--danger" data-act="blog-delete">' + L("Delete", "ลบ") + '</button><span class="spacer"></span><button class="btn btn--primary" type="submit">' + L("Save changes", "บันทึก") + "</button></footer></form>") +
      '<details class="box"><summary>' + L("History", "ประวัติ") + "</summary><ul class=\"blog-hist\">" + (p.history || []).map(function (h) { return "<li>" + esc(new Date(h.at).toLocaleString()) + " — " + esc(h.text) + "</li>"; }).join("") + "</ul></details>";
    var form = $("[data-blog-form]", el);
    if (form) {
      form.addEventListener("submit", function (e) { e.preventDefault(); save(p, form); });
      $("[data-cover-file]", form).addEventListener("change", function (e) { upload(p, e.target.files[0]); });
    }
    $$("[data-blog-status]", el).forEach(function (b) { b.addEventListener("click", function () { setStatus(p, b.getAttribute("data-blog-status")); }); });
  }
  function field(n, label, v, full) { return '<div class="mf' + (full ? " mf-full" : "") + '"><label>' + esc(label) + '</label><input name="' + n + '" value="' + esc(v || "") + '"></div>'; }
  function area(n, label, v, rows, full) { return '<div class="mf' + (full || rows > 4 ? " mf-full" : "") + '"><label>' + esc(label) + '</label><textarea name="' + n + '" rows="' + rows + '">' + esc(v || "") + "</textarea></div>"; }
  function values(form) {
    var g = function (n) { return form.elements[n].value.trim(); };
    return { category: g("category"), slug: g("slug"), title: { th: g("titleTh"), en: g("titleEn") }, summary: { th: g("summaryTh"), en: g("summaryEn") },
      body: { th: form.elements.bodyTh.value, en: form.elements.bodyEn.value }, sources: parseSrc(form.elements.sources.value), tags: g("tags").split(",").map(function (t) { return t.trim(); }).filter(Boolean) };
  }
  function save(p, form, quiet) {
    var v = values(form); v.id = p.id;
    return act({ save: v }).then(function (r) { if (!quiet) A.toast(L("Saved", "บันทึกแล้ว")); document.activeElement && document.activeElement.blur(); return load().then(drawEditor).then(function () { return r; }); });
  }
  function setStatus(p, to) {
    var form = $("[data-blog-form]");
    var go = function (publishAt) {
      return (form ? save(p, form, true) : Promise.resolve()).then(function () { return act({ status: { id: p.id, to: to, publishAt: publishAt } }); })
        .then(function () { A.toast(L("Done", "เรียบร้อย")); return load().then(drawEditor); });
    };
    if (to !== "scheduled") return go();
    A.form({ title: L("Schedule publishing", "ตั้งเวลาเผยแพร่"), fields: [{ name: "at", label: L("Publish on (Bangkok time)", "เผยแพร่เมื่อ (เวลากรุงเทพฯ)"), type: "datetime-local", required: true }],
      onSave: function (v) { return go(v.at).catch(function () { return false; }); } });
  }
  function upload(p, file) {
    if (!file) return;
    var img = new Image(), url = URL.createObjectURL(file);
    img.onload = function () {
      var sc = Math.min(1, 1200 / Math.max(img.width, img.height)), c = document.createElement("canvas");
      c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      var data = c.toDataURL("image/webp", 0.85); if (data.indexOf("data:image/webp") !== 0) data = c.toDataURL("image/jpeg", 0.85);
      URL.revokeObjectURL(url);
      act({ save: { id: p.id, cover: data, coverKind: "upload", coverCredit: null } }).then(function () { return load().then(drawEditor); });
    };
    img.src = url;
  }
  function photoPicker(p) {
    var dlg = document.createElement("dialog"); dlg.className = "modal";
    var q0 = (p.ai && p.ai.imageQuery) || p.title.en || "";
    dlg.innerHTML = '<div class="modal__box blog-photos"><header><h2>' + L("Free-licence photos", "ภาพฟรีลิขสิทธิ์") + '</h2><button type="button" class="ibtn" data-x>✕</button></header>' +
      '<p class="modal__intro">' + esc(L("From Openverse (Wikimedia Commons, Flickr CC and more). Only licences that allow use on our site (CC0, public domain, CC BY, CC BY-SA); the credit is shown under the photo automatically.",
        "จาก Openverse (Wikimedia Commons, Flickr CC และอื่น ๆ) เฉพาะสัญญาอนุญาตที่ใช้บนเว็บของเราได้ (CC0, สาธารณสมบัติ, CC BY, CC BY-SA) ระบบจะแสดงเครดิตใต้ภาพให้อัตโนมัติ")) + "</p>" +
      '<form class="btnrow" data-q><input name="q" value="' + esc(q0) + '" placeholder="' + esc(L("Search in English, e.g. students exam", "ค้นเป็นภาษาอังกฤษ เช่น students exam")) + '"><button class="btn btn--primary">' + L("Search", "ค้นหา") + '</button></form><div class="blog-photo-grid" data-res></div></div>';
    document.body.appendChild(dlg);
    function close() { dlg.close(); dlg.remove(); }
    dlg.addEventListener("click", function (e) { if (e.target === dlg || e.target.closest("[data-x]")) close(); });
    var items = [];
    function search(q) {
      $("[data-res]", dlg).innerHTML = '<p class="muted">' + L("Searching…", "กำลังค้นหา…") + "</p>";
      A.api("GET", "blog/photos?q=" + encodeURIComponent(q)).then(function (d) {
        items = d.items;
        $("[data-res]", dlg).innerHTML = items.length ? items.map(function (it, i) {
          return '<button type="button" data-pick="' + i + '"><img src="' + esc(it.thumb) + '" alt="" loading="lazy" referrerpolicy="no-referrer"><small>' + esc(it.license) + (it.creator ? " · " + esc(it.creator) : "") + "</small></button>";
        }).join("") : '<p class="muted">' + L("Nothing found — try other words.", "ไม่พบภาพ ลองคำอื่น") + "</p>";
      }).catch(function (e) { $("[data-res]", dlg).innerHTML = '<p class="err-text">' + esc(e.message) + "</p>"; });
    }
    $("[data-q]", dlg).addEventListener("submit", function (e) { e.preventDefault(); search(this.elements.q.value); });
    $("[data-res]", dlg).addEventListener("click", function (e) {
      var b = e.target.closest("[data-pick]"); if (!b) return;
      b.disabled = true;
      act({ photo: { id: p.id, item: items[+b.getAttribute("data-pick")] } }).then(function () { close(); A.toast(L("Cover photo set", "ตั้งภาพปกแล้ว")); return load().then(drawEditor); }).catch(function () { b.disabled = false; });
    });
    dlg.showModal();
    if (q0) search(q0);
  }

  /* ------------------------------------------------------------ settings */
  function settingsForm() {
    var s = state.settings, a = s.auto || {};
    var cats = s.categories.map(function (c) { return [c.id, tx(c.name) + " (" + tx(state.branches[c.branch]) + ")"]; });
    A.form({
      title: L("Blog settings", "ตั้งค่าบล็อก"),
      fields: [
        { name: "enabled", label: L("Show the news page on the website", "แสดงหน้าข่าวบนเว็บไซต์"), type: "checkbox", value: s.enabled, full: true },
        { name: "tone", label: L("Tone & audience (given to the AI)", "สำนวนและกลุ่มผู้อ่าน (ส่งให้ AI)"), type: "textarea", value: s.tone, full: true },
        { name: "words", label: L("Length per language (words)", "ความยาวต่อภาษา (คำ)"), type: "number", min: 250, value: s.words },
        { name: "image", label: L("Cover images", "ภาพปก"), type: "select", value: s.image, options: Object.keys(IMG).map(function (k) { return [k, L(IMG[k][0], IMG[k][1])]; }) },
        { name: "allowStem", label: L("Trusted sites — STEM, AI & SI (one per line)", "เว็บไซต์ที่เชื่อถือได้ — STEM · AI · SI (บรรทัดละหนึ่ง)"), type: "textarea", value: (s.allow.stem || []).join("\n"), full: true },
        { name: "allowTests", label: L("Trusted sites — tests & higher education", "เว็บไซต์ที่เชื่อถือได้ — สอบและการศึกษาต่อ"), type: "textarea", value: (s.allow.tests || []).join("\n"), full: true },
        { name: "banned", label: L("Banned words / topics (one per line) — posts containing them cannot be published", "คำ/หัวข้อต้องห้าม (บรรทัดละหนึ่ง) — บทความที่มีคำเหล่านี้จะเผยแพร่ไม่ได้"), type: "textarea", value: (s.banned || []).join("\n"), full: true },
        { name: "labelEn", label: L("AI label (English)", "ป้าย AI (อังกฤษ)"), value: s.label.en }, { name: "labelTh", label: L("AI label (Thai)", "ป้าย AI (ไทย)"), value: s.label.th },
        { name: "autoOn", label: L("Automatic writer: the AI picks a recent topic and writes on a schedule", "เขียนอัตโนมัติ: AI เลือกหัวข้อล่าสุดและเขียนตามตารางเวลา"), type: "checkbox", value: a.enabled, full: true },
        { name: "days", label: L("On these days (none = every day)", "ในวันเหล่านี้ (ไม่เลือก = ทุกวัน)"), type: "days", value: a.days },
        { name: "hour", label: L("From this hour (Bangkok)", "ตั้งแต่เวลา (กรุงเทพฯ)"), type: "number", min: 0, value: a.hour },
        { name: "perRun", label: L("Articles each time (1–3)", "จำนวนบทความต่อครั้ง (1–3)"), type: "number", min: 1, value: a.perRun },
        { name: "autoCats", label: L("Take turns between these categories (none = all)", "สลับหมวดเหล่านี้ (ไม่เลือก = ทุกหมวด)"), type: "checks", options: cats, value: a.categories },
        { name: "autoPublish", label: L("Publish without review in these categories (only if every check passes) — leave empty to review everything", "เผยแพร่ทันทีโดยไม่ต้องตรวจในหมวดเหล่านี้ (เมื่อผ่านทุกเงื่อนไข) — เว้นว่างเพื่อตรวจทุกบทความ"), type: "checks", options: cats, value: a.publish }
      ],
      onSave: function (v) {
        var lines = function (t) { return t.split(/\n/).map(function (x) { return x.trim(); }).filter(Boolean); };
        return act({ settings: { enabled: v.enabled, tone: v.tone, words: v.words, image: v.image, allow: { stem: lines(v.allowStem), tests: lines(v.allowTests) }, banned: lines(v.banned),
          label: { en: v.labelEn, th: v.labelTh }, auto: { enabled: v.autoOn, days: v.days, hour: v.hour, perRun: v.perRun, categories: v.autoCats, publish: v.autoPublish } } })
          .then(function () { A.toast(L("Saved", "บันทึกแล้ว")); return load().then(drawList); }).catch(function () { return false; });
      }
    });
  }

  /* ------------------------------------------------------------ AI settings page */
  A.pages.ai = function () {
    if (!A.isAdmin()) return A.pages.dashboard(new URLSearchParams());
    return { title: L("AI settings", "ตั้งค่า AI"), html: '<div data-ai><p class="muted">' + L("Loading…", "กำลังโหลด…") + "</p></div>",
      after: function () { A.api("GET", "ai-admin").then(function (d) { aiState = d; drawAI(); }).catch(function (e) { A.toast(e.message, "err"); }); } };
  };
  function drawAI() {
    var el = $("[data-ai]"); if (!el || !aiState) return;
    var s = aiState.settings, m = aiState.month;
    var KIND = { blog: L("Blog article", "บทความ"), "blog-draw": L("Cover drawing", "วาดภาพปก"), items: L("Exam items", "ข้อสอบ"), "writing-feedback": L("Writing feedback", "ตรวจ Writing") };
    el.innerHTML =
      '<section class="box"><h2>' + L("Connection", "การเชื่อมต่อ") + "</h2><ul class=\"checklist\">" +
      "<li>" + (aiState.hasSdk ? "✅ " : "❌ ") + L("Anthropic SDK on the server", "ติดตั้ง Anthropic SDK บนเซิร์ฟเวอร์") + (aiState.hasSdk ? "" : " — <code>pip install anthropic</code>") + "</li>" +
      "<li>" + (aiState.hasKey ? "✅ " : "❌ ") + L("API key in the server environment (ANTHROPIC_API_KEY) — never typed here", "คีย์ API อยู่ใน environment ของเซิร์ฟเวอร์ (ANTHROPIC_API_KEY) — ไม่ต้องพิมพ์ในหน้านี้") + "</li>" +
      "<li>" + (s.model ? "✅ " : "❌ ") + L("Model", "โมเดล") + ": " + esc(s.model || "–") + "</li>" +
      "<li>" + (s.enabled ? "✅ " : "⏸ ") + (s.enabled ? L("Switched on", "เปิดใช้งาน") : L("Switched off", "ปิดอยู่")) + "</li></ul>" +
      '<p class="muted">' + L("See server/DEPLOY.md → \"AI (Claude)\" for the set-up steps.", "ดูขั้นตอนใน server/DEPLOY.md → \"AI (Claude)\"") + '</p><button class="btn btn--primary" data-act="ai-edit">' + L("Change settings", "แก้ไขการตั้งค่า") + "</button></section>" +
      '<section class="box"><h2>' + L("This month", "เดือนนี้") + "</h2><p>" + m.jobs + " / " + (s.monthlyJobs || "∞") + L(" jobs", " งาน") + " · " + A.num(m.inputTokens, 0) + L(" input tokens · ", " โทเค็นขาเข้า · ") + A.num(m.outputTokens, 0) + L(" output tokens · ", " โทเค็นขาออก · ") + m.searches + L(" web searches", " ครั้งที่ค้นเว็บ") +
      " · <b>≈ $" + A.num(m.cost, 2) + "</b>" + (s.monthlyUSD ? " / $" + s.monthlyUSD : "") + "</p>" +
      (s.priceIn || s.priceOut ? "" : '<p class="warn-text">' + L("Enter the token prices from the Anthropic pricing page so the cost estimate and the budget limit work.", "ใส่ราคาต่อโทเค็นจากหน้าราคาของ Anthropic เพื่อให้การประมาณค่าใช้จ่ายและเพดานงบทำงาน") + "</p>") + "</section>" +
      '<section class="box"><h2>' + L("Recent AI jobs", "งาน AI ล่าสุด") + "</h2>" + (aiState.jobs.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>' + L("When", "เมื่อ") + "</th><th>" + L("Job", "งาน") + "</th><th>" + L("Result", "ผล") + "</th><th>" + L("Tokens in/out", "โทเค็น เข้า/ออก") + "</th><th>$</th></tr></thead><tbody>" +
        aiState.jobs.map(function (j) { return '<tr><td class="nowrap">' + esc(new Date(j.at).toLocaleString()) + "</td><td>" + esc(KIND[j.kind] || j.kind) + '<br><small class="muted">' + esc(j.note || "") + "</small></td><td>" + (j.status === "done" ? A.badge("done", L("Done", "สำเร็จ")) : j.status === "running" ? A.badge("scheduled", L("Running", "กำลังทำ")) : A.badge("cancelled", L("Failed", "ไม่สำเร็จ")) + '<br><small class="err-text">' + esc(j.error || "") + "</small>") + "</td><td>" + j.input_tokens + " / " + j.output_tokens + (j.searches ? " · 🔎" + j.searches : "") + "</td><td>" + A.num(j.cost, 3) + "</td></tr>"; }).join("") + "</tbody></table></div>"
        : A.empty("No AI jobs yet.", "ยังไม่มีงาน AI")) + "</section>";
  }
  function aiForm() {
    var s = aiState.settings;
    A.form({
      title: L("AI settings", "ตั้งค่า AI"),
      intro: esc(L("The API key is NOT entered here: put it in the server environment as ANTHROPIC_API_KEY (PythonAnywhere: Web tab → environment / WSGI file, see DEPLOY.md). Prices are in US dollars, from the Anthropic pricing page.",
        "ไม่ต้องใส่คีย์ API ที่นี่ ให้ตั้งเป็น ANTHROPIC_API_KEY ใน environment ของเซิร์ฟเวอร์ (PythonAnywhere: แท็บ Web → ไฟล์ WSGI ดู DEPLOY.md) ราคาเป็นดอลลาร์สหรัฐ จากหน้าราคาของ Anthropic")),
      fields: [
        { name: "enabled", label: L("Use AI", "ใช้งาน AI"), type: "checkbox", value: s.enabled, full: true },
        { name: "model", label: L("Model id (from the Anthropic models page)", "รหัสโมเดล (จากหน้า models ของ Anthropic)"), value: s.model, full: true },
        { name: "effort", label: L("Effort (quality vs. cost)", "ระดับความละเอียด (คุณภาพ/ค่าใช้จ่าย)"), type: "select", value: s.effort, options: [["low", L("Low — cheapest", "ต่ำ — ประหยัดสุด")], ["medium", L("Medium — recommended", "กลาง — แนะนำ")], ["high", L("High — best quality", "สูง — คุณภาพสูงสุด")]] },
        { name: "monthlyJobs", label: L("Max AI jobs per month", "จำนวนงาน AI สูงสุดต่อเดือน"), type: "number", min: 0, value: s.monthlyJobs },
        { name: "monthlyUSD", label: L("Max spend per month (USD, 0 = no limit)", "งบสูงสุดต่อเดือน (USD, 0 = ไม่จำกัด)"), type: "number", step: "0.01", min: 0, value: s.monthlyUSD },
        { name: "priceIn", label: L("Price per 1M input tokens (USD)", "ราคา/1 ล้านโทเค็นขาเข้า (USD)"), type: "number", step: "0.01", min: 0, value: s.priceIn },
        { name: "priceOut", label: L("Price per 1M output tokens (USD)", "ราคา/1 ล้านโทเค็นขาออก (USD)"), type: "number", step: "0.01", min: 0, value: s.priceOut },
        { name: "priceSearch", label: L("Price per 1,000 web searches (USD)", "ราคา/1,000 ครั้งที่ค้นเว็บ (USD)"), type: "number", step: "0.01", min: 0, value: s.priceSearch }
      ],
      onSave: function (v) {
        return A.api("POST", "ai-admin", v).then(function () { A.toast(L("Saved", "บันทึกแล้ว")); return A.api("GET", "ai-admin").then(function (d) { aiState = d; drawAI(); }); })
          .catch(function (e) { A.toast(e.message, "err"); return false; });
      }
    });
  }

  function current() { var m = /#\/blog\/([^?]+)/.exec(location.hash); return m && state && state.posts.filter(function (p) { return p.id === m[1]; })[0]; }
  var prev = A.onAct;
  A.onAct = function (a, b, ev) {
    if (a === "blog-ai") writeWithAI();
    else if (a === "blog-rewrite") writeWithAI(current());
    else if (a === "blog-new") {
      load().then(function () {
        A.form({ title: L("New article", "บทความใหม่"), fields: [{ name: "category", label: L("Category", "หมวด"), type: "select", options: catOptions(), full: true },
          { name: "titleTh", label: L("Title (Thai)", "หัวข้อ (ไทย)") }, { name: "titleEn", label: L("Title (English)", "หัวข้อ (อังกฤษ)") }],
          validate: function (v) { if (!v.titleTh && !v.titleEn) return L("Give a title.", "กรุณาใส่หัวข้อ"); },
          onSave: function (v) { return act({ save: { category: v.category, title: { th: v.titleTh, en: v.titleEn } } }).then(function (r) { location.hash = "#/blog/" + r.id; }).catch(function () { return false; }); } });
      });
    }
    else if (a === "blog-settings") settingsForm();
    else if (a === "blog-photo") { var p = current(); if (p) photoPicker(p); }
    else if (a === "blog-draw") { var q = current(); if (q) act({ draw: q.id }).then(function () { A.toast(L("The AI is drawing a cover — about 30 seconds.", "AI กำลังวาดภาพปก ประมาณ 30 วินาที")); setTimeout(function () { load().then(drawEditor); }, 8000); setTimeout(function () { load().then(drawEditor); }, 25000); }); }
    else if (a === "blog-nocover") { var r = current(); if (r) act({ save: { id: r.id, cover: "" } }).then(function () { return load().then(drawEditor); }); }
    else if (a === "blog-delete") { var d = current(); if (d && confirm(L("Delete this article for good?", "ลบบทความนี้ถาวรใช่ไหม?"))) act({ delete: d.id }).then(function () { location.hash = "#/blog"; }); }
    else if (a === "ai-edit") aiForm();
    else if (prev) prev(a, b, ev);
  };
})();
