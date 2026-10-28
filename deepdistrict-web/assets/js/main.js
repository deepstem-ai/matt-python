/* ==========================================================================
   DeepDistrict.si — interactions
   No dependencies; works from file:// and any static host.
   ========================================================================== */

(function () {
  "use strict";

  var doc = document.documentElement;
  var DATA = window.DD_CONTENT || {};
  var base = document.body.getAttribute("data-base") || "";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  doc.classList.remove("no-js");

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ------------------------------------------------------------ Header: frosted white once scrolled */
  var header = $("#site-header");
  function onScroll() {
    if (header) header.classList.toggle("is-solid", window.scrollY > 40);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ------------------------------------------------------------ Menu drawer */
  var toggle = $(".menu-toggle");
  var drawer = $("#nav-drawer");
  function setMenu(open) {
    doc.classList.toggle("menu-open", open);
    document.body.classList.toggle("menu-open", open);
    if (toggle) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }
    if (drawer) {
      drawer.setAttribute("aria-hidden", String(!open));
      if (open) { var first = $("a", drawer); if (first) first.focus(); }
    }
  }
  if (toggle) toggle.addEventListener("click", function () { setMenu(!doc.classList.contains("menu-open")); });
  $$("[data-close-menu]").forEach(function (el) { el.addEventListener("click", function () { setMenu(false); }); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && doc.classList.contains("menu-open")) { setMenu(false); if (toggle) toggle.focus(); }
  });
  if (drawer) $$("a", drawer).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });

  /* ------------------------------------------------------------ Render data-driven blocks */
  function statusLabel(s) { return { live: "In progress", next: "Up next", planned: "Planned" }[s] || s; }

  var statsEl = $("[data-render='stats']");
  if (statsEl && DATA.stats) {
    statsEl.innerHTML = DATA.stats.map(function (s) {
      return '<div class="stat reveal"><span class="stat__num" data-count="' + s.value + '">0' +
        (s.suffix ? "<sup>" + esc(s.suffix) + "</sup>" : "") + '</span><span class="stat__label">' + esc(s.label) + "</span></div>";
    }).join("");
  }

  var milestonesEl = $("[data-render='milestones']");
  if (milestonesEl && DATA.milestones) {
    milestonesEl.innerHTML = DATA.milestones.map(function (m) {
      return "<tr><td>" + esc(m.date) + "</td><td><strong>" + esc(m.name) + "</strong></td><td>" + esc(m.text) +
        '</td><td><span class="status status--' + esc(m.status) + '">' + statusLabel(m.status) + "</span></td></tr>";
    }).join("");
  }

  var nodesEl = $("[data-render='nodes']");
  if (nodesEl && DATA.nodes) {
    nodesEl.innerHTML = DATA.nodes.map(function (n, i) {
      return '<div class="node reveal reveal-delay-' + (i % 3) + '"><h3>' + esc(n.city) + "</h3><p>" + esc(n.role) +
        '</p><span class="status status--' + esc(n.status) + '">' + statusLabel(n.status) + "</span></div>";
    }).join("");
  }

  var programsEl = $("[data-render='programs']");
  function renderPrograms(filter) {
    if (!programsEl || !DATA.programs) return;
    var limit = parseInt(programsEl.getAttribute("data-limit") || "0", 10);
    var list = DATA.programs.filter(function (p) { return !filter || filter === "all" || p.category === filter; });
    if (limit) list = list.slice(0, limit);
    programsEl.innerHTML = list.map(function (p) {
      return '<article class="card"><span class="card__index">' + esc(p.id) + '</span>' +
        '<div class="card__icon"><img src="' + base + "assets/images/icons/" + esc(p.icon) + '.svg" alt=""></div>' +
        "<h3>" + esc(p.title) + "</h3><p>" + esc(p.text) + '</p><span class="card__meta">' + esc(p.meta) + "</span></article>";
    }).join("");
  }
  renderPrograms("all");
  $$(".tab[data-filter]").forEach(function (tab, _, all) {
    tab.addEventListener("click", function () {
      all.forEach(function (t) { t.setAttribute("aria-pressed", String(t === tab)); });
      renderPrograms(tab.getAttribute("data-filter"));
    });
  });

  var roadmapEl = $("[data-render='roadmap']");
  if (roadmapEl && DATA.roadmap) {
    roadmapEl.innerHTML = DATA.roadmap.map(function (r) {
      return '<div class="tl-item reveal' + (r.done ? " is-done" : "") + '"><div class="tl-year">' + esc(r.year) +
        "</div><div><h3>" + esc(r.title) + "</h3><p>" + esc(r.text) + "</p></div></div>";
    }).join("");
  }

  var tickerEl = $("[data-render='ticker']");
  if (tickerEl && DATA.ticker) {
    var items = DATA.ticker.map(function (t) { return "<span>" + t + "</span>"; }).join("");
    tickerEl.innerHTML = items + items; // duplicated for seamless loop
  }

  /* ------------------------------------------------------------ Reveal on scroll + counters */
  function countUp(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    var sup = el.querySelector("sup");
    var supHtml = sup ? sup.outerHTML : "";
    if (reduceMotion) { el.innerHTML = target.toLocaleString("en") + supHtml; return; }
    var start = null, dur = 1600;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.innerHTML = Math.round(target * eased).toLocaleString("en") + supHtml;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        var c = e.target.querySelector("[data-count]");
        if (c) countUp(c);
        io.unobserve(e.target);
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    $$(".reveal").forEach(function (el) { io.observe(el); });
  } else {
    $$(".reveal").forEach(function (el) { el.classList.add("is-in"); });
    $$("[data-count]").forEach(countUp);
  }

  /* ------------------------------------------------------------ Subtle parallax on panel backgrounds */
  var bgs = $$(".panel__bg");
  if (bgs.length && !reduceMotion) {
    var ticking = false;
    var update = function () {
      var vh = window.innerHeight;
      bgs.forEach(function (bg) {
        var r = bg.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        var progress = (r.top + r.height / 2 - vh / 2) / vh; // -1..1 around center
        bg.style.transform = "translate3d(0," + (progress * -40).toFixed(1) + "px,0)";
      });
      ticking = false;
    };
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  /* ------------------------------------------------------------ Forms (local only: validate + confirm) */
  $$("form[data-local-form]").forEach(function (form) {
    form.setAttribute("novalidate", "");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      $$(".field", form).forEach(function (f) {
        var input = $("input, select, textarea", f);
        var err = $(".field__error", f);
        if (!input) return;
        var msg = "";
        if (input.required && !input.value.trim()) msg = "This field is required.";
        else if (input.type === "email" && input.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) msg = "Enter a valid email address.";
        f.classList.toggle("has-error", !!msg);
        if (err) err.textContent = msg;
        if (msg && ok) { input.focus(); ok = false; }
      });
      var consent = $("input[name='consent']", form);
      if (ok && consent && !consent.checked) { consent.focus(); ok = false; }
      if (!ok) return;

      // No backend yet: keep a local copy so nothing typed is lost.
      try {
        var key = "dd-submissions";
        var saved = JSON.parse(localStorage.getItem(key) || "[]");
        var entry = { form: form.getAttribute("data-local-form"), at: new Date().toISOString() };
        new FormData(form).forEach(function (v, k) { entry[k] = v; });
        saved.push(entry);
        localStorage.setItem(key, JSON.stringify(saved));
      } catch (err) { /* storage unavailable: confirmation still shows */ }

      var success = $(".form-success", form);
      if (success) { success.classList.add("is-visible"); success.focus(); }
      form.reset();
    });
  });

  /* ------------------------------------------------------------ Footer newsletter (local only) */
  $$("form[data-newsletter]").forEach(function (form) {
    form.setAttribute("novalidate", "");
    var note = form.parentElement.querySelector(".newsletter-note");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = $("input[type='email']", form);
      var ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
      if (note) {
        note.style.color = ok ? "" : "var(--err)";
        note.textContent = ok ? "Thank you. You're on the list for DeepDistrict updates." : "Please enter a valid email address.";
      }
      if (!ok) { input.focus(); return; }
      try {
        var list = JSON.parse(localStorage.getItem("dd-newsletter") || "[]");
        list.push({ email: input.value.trim(), at: new Date().toISOString() });
        localStorage.setItem("dd-newsletter", JSON.stringify(list));
      } catch (err) { /* storage unavailable */ }
      form.reset();
    });
  });
})();
