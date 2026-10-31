/* ==========================================================================
   DeepDistrict.si — News & insights (blog) on the public website
   Reads published posts from the DeepDistrict server (GET /api/blog, /api/blog/post).
   * pages/blog.html            list, with the two branches and their categories
   * pages/blog.html?p=<slug>   one article
   * [data-blog-latest]         "latest news" cards on any page (e.g. admissions)
   * [data-blog-slider]         sliding latest-news cards (home page)
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
    if (!online) return local(path);
    return fetch(API + path, { credentials: "same-origin" }).then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || r.status); return j; }); })
      .then(function (j) { return path.indexOf("blog?") === 0 && !j.total && !j.off && window.DD_NEWS ? local(path) : j; })
      .catch(function (e) { if (window.DD_NEWS && !/not found/.test(e.message)) return local(path); throw e; });
  }
  // Without the DeepDistrict server (file:// or plain static hosting) the starter news in
  // assets/data/news.js is shown instead, so the page is never empty.
  function local(path) {
    var D = window.DD_NEWS;
    if (!D) return Promise.reject(new Error("offline"));
    var q = new URLSearchParams(path.split("?")[1] || "");
    if (path.indexOf("blog/post") === 0) {
      var p = D.items.filter(function (x) { return x.slug === q.get("slug"); })[0];
      return p ? Promise.resolve({ post: p, branches: D.branches }) : Promise.reject(new Error("post not found"));
    }
    var list = D.items.filter(function (x) { return (!q.get("branch") || x.branch === q.get("branch")) && (!q.get("cat") || x.category === q.get("cat")); });
    var off = +q.get("offset") || 0, lim = +q.get("limit") || 12;
    return Promise.resolve({ items: list.slice(off, off + lim), total: list.length, branches: D.branches, categories: D.categories });
  }
  /* ---------------------------------------------------------------- real photos
     A post without its own photo gets a free-licence photograph from Wikimedia Commons, looked up by the
     visitor's browser with the post's photo words (public domain, CC0, CC BY or CC BY-SA only), shown
     with the photographer and licence. Results are remembered for a week; the drawn cover stays if
     there is no internet or nothing suitable is found. */
  var PHOTO_OK = /^(cc0( 1\.0)?|public domain|pdm?|cc by(-sa)? [0-9.]+( [a-z]+)?)$/i;   // never NC (non-commercial) or ND
  function strip(h) { var d = document.createElement("div"); d.innerHTML = String(h || ""); return (d.textContent || "").replace(/\s+/g, " ").trim().slice(0, 80); }
  function commons(q) {
    var key = "dd-photo:" + q;
    try { var c = JSON.parse(localStorage.getItem(key) || "null"); if (c && Date.now() - c.at < 7 * 864e5) return Promise.resolve(c.photo); } catch (e) {}
    var url = "https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrnamespace=6&gsrlimit=20" +
      "&gsrsearch=" + encodeURIComponent(q + " filetype:bitmap") + "&prop=imageinfo&iiprop=url|extmetadata|mime|size&iiurlwidth=1200";
    return fetch(url, { credentials: "omit" }).then(function (r) { return r.json(); }).then(function (d) {
      var pages = d.query && d.query.pages ? Object.keys(d.query.pages).map(function (k) { return d.query.pages[k]; }) : [];
      pages.sort(function (a, b) { return (a.index || 0) - (b.index || 0); });
      var best = null;
      pages.some(function (pg) {
        var ii = (pg.imageinfo || [])[0], m = ii && ii.extmetadata || {};
        var lic = strip((m.LicenseShortName || {}).value);
        if (!ii || ii.mime !== "image/jpeg" || ii.width < 1000 || ii.width < ii.height * 1.2 || !PHOTO_OK.test(lic)) return false;
        best = { src: ii.thumburl || ii.url, creator: strip((m.Artist || {}).value) || "Wikimedia Commons", license: lic, page: ii.descriptionurl };
        return true;
      });
      try { localStorage.setItem(key, JSON.stringify({ at: Date.now(), photo: best })); } catch (e) {}
      return best;
    });
  }
  function photos(root) {
    if (!window.fetch || !/^https?:$|^file:$/.test(location.protocol)) return;
    root.querySelectorAll("[data-photo-q]").forEach(function (box) {
      var q = box.getAttribute("data-photo-q"); box.removeAttribute("data-photo-q");
      commons(q).then(function (ph) {
        if (!ph || !/^https:\/\/upload\.wikimedia\.org\//.test(ph.src)) return;
        var im = new Image(); im.alt = "";
        im.onload = function () {
          var old = box.querySelector("img"); if (old) old.replaceWith(im); else box.prepend(im);
          box.classList.add("is-photo");
          var cr = box.querySelector(".news-card__credit") || document.createElement("small");
          cr.className = "news-card__credit"; cr.textContent = "Photo: " + ph.creator + " · " + ph.license + " · Wikimedia Commons";
          cr.title = ph.page || ""; box.appendChild(cr);
        };
        im.src = ph.src;
      }).catch(function () {});
    });
  }
  window.DDNewsPhotos = photos;

  function postUrl(p) { return base + "pages/blog.html?p=" + encodeURIComponent(p.slug); }
  function card(p) {
    var c = img(p.cover);
    return '<a class="card card--link news-card" href="' + postUrl(p) + '">' +
      (c ? '<div class="news-card__img"' + (p.coverKind !== "photo" && p.photoQuery ? ' data-photo-q="' + esc(p.photoQuery) + '"' : "") + '><img src="' + c + '" alt="" loading="lazy">' + (p.coverKind === "photo" && p.coverCredit && p.coverCredit.license ? '<small class="news-card__credit">' + esc(["Photo", p.coverCredit.creator, p.coverCredit.license].filter(Boolean).join(" · ")) + "</small>" : "") + "</div>" : '<div class="news-card__img news-card__img--none" aria-hidden="true"></div>') +
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
    if (!online && !window.DD_NEWS) { if (sec) sec.hidden = true; return; }
    get("blog?limit=" + n + (branch ? "&branch=" + branch : "")).then(function (d) {
      if (!d.items.length) { if (sec) sec.hidden = true; return; }
      el.innerHTML = d.items.map(card).join(""); photos(el);
    }).catch(function () { if (sec) sec.hidden = true; });
  });

  /* ---------------------------------------------------------------- news from other publishers (RSS)
     [data-feeds="9"] shows headlines the DeepDistrict server collects from trusted publishers: title, a short
     excerpt, the publisher's name and a link to read the full story on their site (credit + traffic go to
     them). data-feeds-filters adds category chips. Hidden when there is no server or nothing collected. */
  var FCATS = [["", "All", "ทั้งหมด"], ["ai", "AI", "AI"], ["si", "SI", "SI"], ["stem", "STEM", "STEM"], ["research", "Science & research", "วิทยาศาสตร์และงานวิจัย"], ["space", "Space", "อวกาศ"], ["coding", "Tech & coding", "เทคโนโลยีและโค้ดดิ้ง"]];
  function fcat(k) { var c = FCATS.filter(function (x) { return x[0] === k; })[0]; return c ? bi(c[1], c[2]) : esc(k); }
  function feedCard(it) {
    var u = safeUrl(it.link) || (/^http:\/\//.test(it.link) ? it.link : "");
    var im = img(it.image);
    return '<article class="card feed-card">' + (im ? '<div class="feed-card__img"><img src="' + esc(im) + '" alt="" loading="lazy" referrerpolicy="no-referrer"></div>' : "") +
      '<div class="feed-card__body"><p class="feed-card__src"><span class="feed-card__pub">' + esc(it.source) + '</span><span class="feed-card__cat">' + fcat(it.category) + "</span></p>" +
      '<h3><a href="' + esc(u) + '" target="_blank" rel="noopener nofollow">' + esc(it.title) + "</a></h3>" +
      (it.summary ? "<p>" + esc(it.summary) + "</p>" : "") +
      '<p class="feed-card__foot"><span>' + date(it.published) + '</span><a href="' + esc(u) + '" target="_blank" rel="noopener nofollow">' + bi("Read at ", "อ่านต่อที่ ") + esc(it.source) + " ↗</a></p></div></article>";
  }
  function getFeeds(q) {
    if (!online) return Promise.reject(new Error("offline"));
    return fetch(API + "feeds?" + q, { credentials: "omit" }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
  }
  document.querySelectorAll("[data-feeds]").forEach(function (el) {
    var n = +el.getAttribute("data-feeds") || 9, sec = el.closest("section"), filters = el.hasAttribute("data-feeds-filters");
    if (!online) { if (sec) sec.hidden = true; return; }
    function draw(cat, offset) {
      getFeeds("limit=" + n + "&offset=" + (offset || 0) + (cat ? "&cat=" + cat : "")).then(function (d) {
        if (!d.items.length && !cat && !offset) { if (sec) sec.hidden = true; return; }
        if (sec) sec.hidden = false;
        el.innerHTML = (filters ? '<div class="news-cats feed-cats">' + FCATS.map(function (c) { return '<button type="button" class="news-chip' + (c[0] === (cat || "") ? " is-on" : "") + '" data-fcat="' + c[0] + '">' + bi(c[1], c[2]) + "</button>"; }).join("") + "</div>" : "") +
          (d.items.length ? '<div class="grid grid--3 feed-grid">' + d.items.map(feedCard).join("") + "</div>" : '<p class="news-empty">' + bi("Nothing in this category yet.", "ยังไม่มีข่าวในหมวดนี้") + "</p>") +
          (filters && d.total > (offset || 0) + n ? '<div class="btn-row news-more"><button class="btn" type="button" data-fmore>' + bi("More headlines", "ข่าวเพิ่มเติม") + "</button></div>" : "") +
          '<p class="feed-note">' + bi("Headlines and short excerpts from each publisher's public news feed — every story belongs to its publisher; tap to read it on their website.",
            "หัวข่าวและบทคัดย่อสั้น ๆ จากช่องทางข่าวสาธารณะ (RSS) ของแต่ละสำนักข่าว ลิขสิทธิ์เป็นของผู้เผยแพร่ กดเพื่ออ่านฉบับเต็มบนเว็บไซต์ต้นทาง") +
          (d.sources && d.sources.length ? " " + bi("Sources: ", "แหล่งข่าว: ") + d.sources.map(function (x) { return esc(x.name); }).join(" · ") : "") + "</p>";
        el.querySelectorAll("[data-fcat]").forEach(function (b) { b.addEventListener("click", function () { draw(b.getAttribute("data-fcat"), 0); }); });
        var more = el.querySelector("[data-fmore]"); if (more) more.addEventListener("click", function () { draw(cat, (offset || 0) + n); });
      }).catch(function () { if (sec && !offset) sec.hidden = true; });
    }
    draw("", 0);
  });

  /* ---------------------------------------------------------------- headline ticker (home hero) */
  // [data-blog-ticker="10"]: the newest headlines run along the bottom of the hero; hover or focus stops
  // it, the pause button stops it for good, and with "reduce motion" the headlines change one at a time.
  document.querySelectorAll("[data-blog-ticker]").forEach(function (el) {
    var n = +el.getAttribute("data-blog-ticker") || 10;
    if (!online && !window.DD_NEWS) return;
    var withFeeds = online ? getFeeds("limit=6").then(function (f) { window.__ddFeedTicker = f.items || []; }).catch(function () {}) : Promise.resolve();
    withFeeds.then(function () { return get("blog?limit=" + n); }).then(function (d) {
      if (!d.items.length) return;
      var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      var own = d.items.map(function (p) { return '<a href="' + postUrl(p) + '"><b>' + both(p.categoryName) + "</b> " + both(p.title, 110) + "</a>"; });
      var others = (window.__ddFeedTicker || []).map(function (it) { return '<a href="' + esc(safeUrl(it.link) || it.link) + '" target="_blank" rel="noopener nofollow"><b>' + esc(it.source) + "</b> " + esc(cut(it.title, 110)) + " ↗</a>"; });
      var mixed = []; for (var k = 0; k < Math.max(own.length, others.length); k++) { if (own[k]) mixed.push(own[k]); if (others[k]) mixed.push(others[k]); }
      var line = mixed.join('<span class="news-ticker__dot" aria-hidden="true">•</span>');
      el.innerHTML = '<span class="news-ticker__label">' + bi("Latest news", "ข่าวล่าสุด") + '</span><div class="news-ticker__win"><div class="news-ticker__run' + (calm ? " is-calm" : "") + '">' +
        line + '<span class="news-ticker__dot" aria-hidden="true">•</span><span aria-hidden="true">' + line.replace(/<a /g, '<a tabindex="-1" ') + "</span></div></div>" +
        '<button type="button" class="news-ticker__pause" aria-label="Pause">❚❚</button>';
      el.hidden = false;
      var run = el.querySelector(".news-ticker__run");
      run.style.setProperty("--dur", Math.max(40, d.items.length * 9) + "s");
      el.querySelector(".news-ticker__pause").addEventListener("click", function () {
        var off = el.classList.toggle("is-paused"); this.textContent = off ? "▶" : "❚❚"; this.setAttribute("aria-label", off ? "Play" : "Pause");
      });
      if (calm) {                                          // one headline at a time, no sliding
        var links = run.querySelectorAll(":scope > a"), i = 0;
        var show = function () { links.forEach(function (a, k) { a.hidden = k !== i; }); };
        show(); setInterval(function () { if (!el.classList.contains("is-paused") && !el.matches(":hover")) { i = (i + 1) % links.length; show(); } }, 4500);
      }
    }).catch(function () {});
  });

  /* ---------------------------------------------------------------- sliding news (home page) */
  // [data-blog-slider="8"]: the latest posts as cards that move on by themselves every few seconds.
  // Stops while the pointer or keyboard focus is on it, when the tab is hidden, and never moves on its
  // own for people who ask for reduced motion. Every card opens its article on the blog page.
  document.querySelectorAll("[data-blog-slider]").forEach(function (el) {
    var n = +el.getAttribute("data-blog-slider") || 8, sec = el.closest("section");
    if (!online && !window.DD_NEWS) { if (sec) sec.hidden = true; return; }
    get("blog?limit=" + n).then(function (d) {
      if (!d.items.length) { if (sec) sec.hidden = true; return; }
      slider(el, d.items);
    }).catch(function () { if (sec) sec.hidden = true; });
  });
  function slider(el, items) {
    var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.innerHTML = '<div class="news-slider__track" tabindex="0" aria-live="off">' + items.map(function (p, i) {
      return '<div class="news-slide" role="group" aria-roledescription="slide" aria-label="' + (i + 1) + " / " + items.length + '">' + card(p).replace('class="card card--link news-card"', 'class="card card--link news-card news-card--slide"') + "</div>";
    }).join("") + "</div>" +
      (items.length > 1 ? '<div class="news-slider__ctl"><button type="button" class="news-slider__btn" data-dir="-1" aria-label="Previous">‹</button><div class="news-slider__dots">' +
        items.map(function (_, i) { return '<button type="button" data-dot="' + i + '" aria-label="' + (i + 1) + '"></button>'; }).join("") +
        '</div><button type="button" class="news-slider__btn" data-dir="1" aria-label="Next">›</button>' +
        '<button type="button" class="news-slider__btn news-slider__pause" data-pause aria-label="Pause">❚❚</button></div>' : "");
    var track = el.querySelector(".news-slider__track"), slides = el.querySelectorAll(".news-slide"), dots = el.querySelectorAll("[data-dot]");
    var cur = 0, hold = false, stopped = false, timer = null;
    function perView() { var w = slides[0].getBoundingClientRect().width || 1; return Math.max(1, Math.round(track.clientWidth / w)); }
    function go(i, smooth) {
      var last = Math.max(0, slides.length - perView());
      cur = i > last ? 0 : i < 0 ? last : i;
      track.scrollTo({ left: slides[cur].offsetLeft - track.offsetLeft, behavior: smooth === false || calm ? "auto" : "smooth" });
      mark();
    }
    function mark() { dots.forEach(function (d, k) { d.setAttribute("aria-current", k === cur ? "true" : "false"); }); }
    function tick() { if (!hold && !stopped && !document.hidden) go(cur + 1); }
    // moves on for everyone (a pause button is always there); with "reduce motion" it jumps instead of gliding
    function run() { clearInterval(timer); if (slides.length > 1) timer = setInterval(tick, 4500); }
    el.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.hasAttribute("data-dir")) go(cur + (+b.getAttribute("data-dir")));
      else if (b.hasAttribute("data-dot")) go(+b.getAttribute("data-dot"));
      else if (b.hasAttribute("data-pause")) { stopped = !stopped; b.textContent = stopped ? "▶" : "❚❚"; b.setAttribute("aria-label", stopped ? "Play" : "Pause"); }
      run();
    });
    el.addEventListener("mouseenter", function () { hold = true; });
    el.addEventListener("mouseleave", function () { hold = false; });
    el.addEventListener("focusin", function () { hold = true; });
    el.addEventListener("focusout", function () { hold = false; });
    track.addEventListener("keydown", function (e) { if (e.key === "ArrowRight") { go(cur + 1); e.preventDefault(); } if (e.key === "ArrowLeft") { go(cur - 1); e.preventDefault(); } });
    var t = null;
    track.addEventListener("scroll", function () {     // swiping by hand updates the dots
      clearTimeout(t);
      t = setTimeout(function () {
        var x = track.scrollLeft, best = 0;
        slides.forEach(function (s, k) { if (Math.abs(s.offsetLeft - track.offsetLeft - x) < Math.abs(slides[best].offsetLeft - track.offsetLeft - x)) best = k; });
        cur = best; mark();
      }, 120);
    }, { passive: true });
    mark(); run(); photos(el);
  }

  /* ---------------------------------------------------------------- the blog page */
  var root = document.querySelector("[data-blog]");
  if (!root) return;
  if (!online && !window.DD_NEWS) return offline(root);
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
      photos(root);
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
        (c ? '<figure class="news-cover"' + (p.coverKind !== "photo" && p.photoQuery ? ' data-photo-q="' + esc(p.photoQuery) + '"' : "") + '><img src="' + c + '" alt="">' + (p.coverKind === "photo" ? credit : "") + "</figure>" : "") +
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
      photos(root);
    }).catch(function () {
      root.innerHTML = '<p class="news-empty">' + bi("This article is not available.", "ไม่พบบทความนี้") + ' <a href="blog.html">' + bi("See all news", "ดูข่าวทั้งหมด") + "</a></p>";
    });
  }
})();
