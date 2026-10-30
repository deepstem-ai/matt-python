/* ==========================================================================
   DeepDistrict.si — News & insights (blog) on the public website
   Reads published posts from the DeepDistrict server (GET /api/blog, /api/blog/post).
   * pages/blog.html            list, with the two branches and their categories
   * pages/blog.html?p=<slug>   one article
   * [data-blog-latest]         "latest news" cards on any page (e.g. the home page)
   Text from the server is always escaped; the article body uses a tiny, safe
   Markdown subset (## headings, - lists, **bold**, [links](https://…)).
   ========================================================================== */
(function () {
  "use strict";
  var base = document.body.getAttribute("data-base") || "";
  var API = base + "api/";
  var online = /^https?:$/.test(location.protocol) && window.fetch && !(window.DD_CONFIG && window.DD_CONFIG.live === false);

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function bi(en, th) { return '<span lang="en">' + en + '</span><span lang="th">' + th + "</span>"; }
  function both(v, n) { v = v || {}; var en = v.en || v.th || "", th = v.th || v.en || ""; if (n) { en = cut(en, n); th = cut(th, n); } return bi(esc(en), esc(th)); }
  function cut(s, n) { return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : s; }
  function date(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    return bi(esc(d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })), esc(d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })));
  }
  function safeUrl(u) { u = String(u || ""); return /^https:\/\//i.test(u) ? u : ""; }
  function img(src) { src = String(src || ""); return /^(data:image\/(png|jpeg|webp|svg\+xml);base64,|https:\/\/)/.test(src) ? src : ""; }

  function inline(s) {
    s = esc(s);
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    return s.replace(/\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g, function (m, t, u) { return '<a href="' + u + '" target="_blank" rel="noopener nofollow">' + t + "</a>"; });
  }
  function md(text) {
    var out = [], list = null;
    String(text || "").split(/\n/).forEach(function (line) {
      var l = line.trim();
      if (/^[-*] /.test(l)) { if (!list) { list = []; } list.push("<li>" + inline(l.slice(2)) + "</li>"); return; }
      if (list) { out.push("<ul>" + list.join("") + "</ul>"); list = null; }
      if (!l) return;
      var h = /^(#{2,3}) (.+)$/.exec(l);
      if (h) out.push("<h" + (h[1].length + 1) + ">" + inline(h[2]) + "</h" + (h[1].length + 1) + ">");
      else out.push("<p>" + inline(l) + "</p>");
    });
    if (list) out.push("<ul>" + list.join("") + "</ul>");
    return out.join("");
  }
  function get(path) {
    return fetch(API + path, { credentials: "same-origin" }).then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || r.status); return j; }); });
  }
  function postUrl(p) { return base + "pages/blog.html?p=" + encodeURIComponent(p.slug); }
  function card(p) {
    var c = img(p.cover);
    return '<a class="card card--link news-card" href="' + postUrl(p) + '">' +
      (c ? '<div class="news-card__img"><img src="' + c + '" alt="" loading="lazy"></div>' : '<div class="news-card__img news-card__img--none" aria-hidden="true"></div>') +
      '<div class="news-card__body"><span class="news-card__cat">' + both(p.categoryName) + "</span>" +
      "<h3>" + both(p.title) + "</h3><p>" + both(p.summary, 180) + '</p><span class="news-card__date">' + date(p.publishedAt) + "</span></div></a>";
  }
  function offline(el) {
    el.innerHTML = '<p class="news-empty">' + bi("News appears here when the website runs on the DeepDistrict server.", "ข่าวสารจะแสดงที่นี่เมื่อเปิดเว็บไซต์ผ่านเซิร์ฟเวอร์ DeepDistrict") + "</p>";
  }

  /* ---------------------------------------------------------------- latest cards (home page etc.) */
  document.querySelectorAll("[data-blog-latest]").forEach(function (el) {
    var n = +el.getAttribute("data-blog-latest") || 3, branch = el.getAttribute("data-branch") || "";
    var sec = el.closest("section");
    if (!online) { if (sec) sec.hidden = true; return; }
    get("blog?limit=" + n + (branch ? "&branch=" + branch : "")).then(function (d) {
      if (!d.items.length) { if (sec) sec.hidden = true; return; }
      el.innerHTML = d.items.map(card).join("");
    }).catch(function () { if (sec) sec.hidden = true; });
  });

  /* ---------------------------------------------------------------- the blog page */
  var root = document.querySelector("[data-blog]");
  if (!root) return;
  if (!online) return offline(root);
  var q = new URLSearchParams(location.search), slug = q.get("p");
  slug ? article(slug) : list(q.get("branch") || "", q.get("cat") || "", 0);

  function list(branch, cat, offset) {
    root.innerHTML = '<p class="news-empty">' + bi("Loading…", "กำลังโหลด…") + "</p>";
    get("blog?limit=12&offset=" + offset + (branch ? "&branch=" + encodeURIComponent(branch) : "") + (cat ? "&cat=" + encodeURIComponent(cat) : "")).then(function (d) {
      var tabs = [["", bi("All news", "ข่าวทั้งหมด")]].concat(Object.keys(d.branches).map(function (b) { return [b, both(d.branches[b])]; }));
      var cats = d.categories.filter(function (c) { return !branch || c.branch === branch; });
      root.innerHTML =
        '<div class="news-tabs" role="tablist">' + tabs.map(function (t) {
          return '<a role="tab" aria-selected="' + (t[0] === branch && !cat ? "true" : "false") + '" href="?branch=' + t[0] + '" data-branch-tab="' + t[0] + '" class="news-tab news-tab--' + (t[0] || "all") + '">' + t[1] + "</a>";
        }).join("") + "</div>" +
        '<div class="news-cats">' + cats.map(function (c) {
          return '<a href="?branch=' + c.branch + "&cat=" + c.id + '" class="news-chip' + (c.id === cat ? " is-on" : "") + '">' + both(c.name) + "</a>";
        }).join("") + "</div>" +
        (d.items.length ? '<div class="grid grid--3 news-grid">' + d.items.map(card).join("") + "</div>"
          : '<p class="news-empty">' + (d.off ? bi("The news section is being prepared.", "หน้าข่าวสารกำลังเตรียมเนื้อหา") : bi("No articles here yet — check back soon.", "ยังไม่มีบทความในหมวดนี้ แวะกลับมาเร็ว ๆ นี้")) + "</p>") +
        (d.total > offset + 12 ? '<div class="btn-row news-more"><button class="btn" type="button" data-more>' + bi("Older articles", "บทความก่อนหน้า") + "</button></div>" : "");
      var more = root.querySelector("[data-more]");
      if (more) more.addEventListener("click", function () { list(branch, cat, offset + 12); window.scrollTo({ top: root.offsetTop - 80 }); });
    }).catch(function () { root.innerHTML = '<p class="news-empty">' + bi("News could not be loaded. Please try again later.", "โหลดข่าวไม่สำเร็จ กรุณาลองใหม่ภายหลัง") + "</p>"; });
  }

  function article(slug) {
    root.innerHTML = '<p class="news-empty">' + bi("Loading…", "กำลังโหลด…") + "</p>";
    get("blog/post?slug=" + encodeURIComponent(slug)).then(function (d) {
      var p = d.post, c = img(p.cover), cr = p.coverCredit, br = d.branches[p.branch] || {};
      document.title = (document.documentElement.lang === "th" ? p.title.th || p.title.en : p.title.en || p.title.th) + " | DeepDistrict.si";
      document.body.setAttribute("data-title-en", (p.title.en || p.title.th) + " | DeepDistrict.si");
      document.body.setAttribute("data-title-th", (p.title.th || p.title.en) + " | DeepDistrict.si");
      var credit = "";
      if (cr && p.coverKind === "photo") {
        var by = cr.creator ? (safeUrl(cr.creatorUrl) ? '<a href="' + esc(cr.creatorUrl) + '" target="_blank" rel="noopener nofollow">' + esc(cr.creator) + "</a>" : esc(cr.creator)) : "";
        credit = '<figcaption>' + bi("Photo", "ภาพ") + ": " + (safeUrl(cr.source) ? '<a href="' + esc(cr.source) + '" target="_blank" rel="noopener nofollow">' + esc(cr.title || "source") + "</a>" : esc(cr.title)) +
          (by ? " · " + by : "") + " · " + (safeUrl(cr.licenseUrl) ? '<a href="' + esc(cr.licenseUrl) + '" target="_blank" rel="noopener nofollow">' + esc(cr.license) + "</a>" : esc(cr.license)) + "</figcaption>";
      } else if (p.coverKind === "drawing") {
        credit = "<figcaption>" + bi("Illustration created with AI for DeepDistrict", "ภาพประกอบสร้างด้วย AI สำหรับ DeepDistrict") + "</figcaption>";
      }
      root.innerHTML =
        '<article class="news-article">' +
        '<p class="news-back"><a href="blog.html">← ' + bi("All news", "ข่าวทั้งหมด") + '</a> · <a href="blog.html?branch=' + esc(p.branch) + '">' + both(br) + "</a></p>" +
        '<span class="news-card__cat">' + both(p.categoryName) + "</span>" +
        "<h1>" + both(p.title) + "</h1>" +
        '<p class="news-meta">' + date(p.publishedAt) + (p.aiLabel ? ' · <span class="news-ai">' + both(p.aiLabel) + "</span>" : "") + "</p>" +
        (c ? '<figure class="news-cover"><img src="' + c + '" alt="">' + credit + "</figure>" : "") +
        '<p class="news-lead">' + both(p.summary) + "</p>" +
        '<div class="news-body"><div lang="en">' + md(p.body.en || p.body.th) + '</div><div lang="th">' + md(p.body.th || p.body.en) + "</div></div>" +
        (p.sources && p.sources.length ? '<aside class="news-sources"><h2>' + bi("Sources", "แหล่งอ้างอิง") + "</h2><ul>" + p.sources.map(function (s) {
          var u = safeUrl(s.url); return "<li>" + (u ? '<a href="' + esc(u) + '" target="_blank" rel="noopener nofollow">' + esc(s.title || u) + "</a>" : esc(s.title)) + "</li>";
        }).join("") + "</ul></aside>" : "") +
        '<aside class="news-note">' + bi("Details such as dates, scores and rules change often — always check the official website, or ask our staff for the latest.",
          "รายละเอียด เช่น วันที่ คะแนน และเงื่อนไข เปลี่ยนแปลงบ่อย ควรตรวจสอบกับเว็บไซต์ทางการทุกครั้ง หรือสอบถามเจ้าหน้าที่ของเรา") +
        ' <a class="btn btn--sm btn--primary" href="contact.html">' + bi("Ask our staff", "สอบถามเจ้าหน้าที่") + "</a></aside>" +
        (p.tags && p.tags.length ? '<p class="chips chips--tech">' + p.tags.map(function (t) { return "<span>#" + esc(t) + "</span>"; }).join("") + "</p>" : "") +
        "</article>";
    }).catch(function () {
      root.innerHTML = '<p class="news-empty">' + bi("This article is not available.", "ไม่พบบทความนี้") + ' <a href="blog.html">' + bi("See all news", "ดูข่าวทั้งหมด") + "</a></p>";
    });
  }
})();
