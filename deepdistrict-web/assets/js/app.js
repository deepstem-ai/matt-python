/* ==========================================================================
   DeepDistrict.si — application: preferences, rendering, catalogue,
   course dialog, plan builder, SI explainer widgets and forms.
   Loads after the data files, partials.js and consent.js.
   ========================================================================== */
(function () {
  "use strict";

  var doc = document.documentElement;
  var DATA = window.DD_CONTENT || {};
  var base = document.body.getAttribute("data-base") || "";
  var page = document.body.getAttribute("data-page") || "";
  var EMAIL = "info@deepdistrict.si";
  var DD = window.DD = window.DD || {};
  var store = DD.store || { get: function () { return null; }, set: function () {} };
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  doc.classList.remove("no-js");
  // read before the catalogue rewrites the URL
  var initialCourse = location.hash.indexOf("#course-") === 0 ? decodeURIComponent(location.hash.slice(8)) : null;

  /* ------------------------------------------------------------ Helpers */
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function lang() { return doc.lang === "th" ? "th" : "en"; }
  function t(v) { if (v == null) return ""; if (typeof v !== "object") return esc(v); return '<span lang="en">' + esc(v.en) + '</span><span lang="th">' + esc(v.th) + "</span>"; }
  function tx(v) { return v && typeof v === "object" ? v[lang()] : String(v == null ? "" : v); }
  function plain(v) { return v && typeof v === "object" ? v.en + " " + v.th : String(v || ""); }
  function icon(n) { return '<img src="' + base + "assets/images/icons/" + n + '.svg" alt="">'; }
  function L(en, th) { return { en: en, th: th }; }
  var ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>';
  var CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  DD.t = t; DD.esc = esc; DD.lang = lang;

  var courses = DATA.courses || [];
  var details = DATA.details || {};
  var byCode = {};
  courses.forEach(function (c) { byCode[c.code] = c; });
  function level(id) { return (DATA.levels || [])[id - 1]; }
  function track(id) { return (DATA.tracks || []).filter(function (x) { return x.id === id; })[0]; }
  function hours(c) { return typeof c.hours === "number" ? t(L(c.hours + " h", c.hours + " ชม.")) : t(c.hours); }
  function lvlChip(c) {
    return c.anyLevel ? '<span class="lvl lvl--any">' + t(L("All levels · custom", "ทุกระดับ · ออกแบบเฉพาะ")) + "</span>"
      : '<span class="lvl lv-' + c.level + '">' + t(level(c.level).short) + "</span>";
  }
  function modesIcons(code) {
    var m = (details[code] && details[code].modes) || ["online", "onsite", "hybrid"];
    return '<span class="modes">' + m.map(function (k) {
      var md = DATA.modes[k];
      return '<span class="mode-ico" title="' + esc(md.name.en + " / " + md.name.th) + '">' + icon(md.icon) + "</span>";
    }).join("") + "</span>";
  }
  function codeChip(code) {
    var c = byCode[code];
    if (!c) return "";
    return '<a class="code-chip lv-' + c.level + '" data-course="' + code + '" href="' + base + "pages/programs.html#course-" + code + '" title="' + esc(c.title.en) + '">' + code + "</a>";
  }
  function contactUrl(params) {
    var q = Object.keys(params).map(function (k) { return k + "=" + encodeURIComponent(params[k]); }).join("&");
    return base + "pages/contact.html?" + q + "#form";
  }

  /* ------------------------------------------------------------ Language */
  function setLang(l, save) {
    doc.lang = l;
    if (save) store.set("dd-lang", l);
    $$("[data-set-lang]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-set-lang") === l)); });
    var title = document.body.getAttribute("data-title-" + l);
    if (title) document.title = title;
    $$("[data-en][data-th]").forEach(function (el) { el.textContent = el.getAttribute("data-" + l); });
    $$("[data-i18n-attrs]").forEach(function (el) {
      el.getAttribute("data-i18n-attrs").split(",").forEach(function (a) {
        var v = el.getAttribute("data-" + l + "-" + a);
        if (v != null) el.setAttribute(a, v);
      });
    });
    document.dispatchEvent(new CustomEvent("dd:lang", { detail: l }));
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-set-lang]");
    if (b) setLang(b.getAttribute("data-set-lang"), true);
  });

  /* ------------------------------------------------------------ Theme
     Header button flips light <-> dark. The footer offers System / Light / Dark.
     With no saved choice the site follows the operating system.            */
  var mq = window.matchMedia("(prefers-color-scheme: dark)");
  function applyTheme(pref) {
    doc.setAttribute("data-theme-pref", pref);
    var dark = pref === "dark" || (pref === "auto" && mq.matches);
    doc.setAttribute("data-theme", dark ? "dark" : "light");
    var meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", dark ? "#070b14" : "#f7f8fb");
    $$("[data-theme-set]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-theme-set") === pref)); });
    $$("[data-theme-toggle]").forEach(function (b) {
      var label = dark ? L("Switch to light mode", "เปลี่ยนเป็นโหมดสว่าง") : L("Switch to dark mode", "เปลี่ยนเป็นโหมดมืด");
      b.setAttribute("aria-label", tx(label)); b.title = tx(label);
    });
  }
  function setTheme(pref, origin) {
    store.set("dd-theme", pref);
    if (origin) {
      var r = origin.getBoundingClientRect();
      doc.style.setProperty("--tx", (r.left + r.width / 2) + "px");
      doc.style.setProperty("--ty", (r.top + r.height / 2) + "px");
    }
    if (document.startViewTransition && !reduceMotion) {
      doc.classList.add("theme-anim");
      var vt = document.startViewTransition(function () { applyTheme(pref); });
      var clear = function () { doc.classList.remove("theme-anim"); };
      vt.ready.catch(clear);
      vt.finished.then(clear, clear);
    } else applyTheme(pref);
  }
  DD.setTheme = setTheme;
  mq.addEventListener && mq.addEventListener("change", function () { if (doc.getAttribute("data-theme-pref") === "auto") applyTheme("auto"); });
  document.addEventListener("dd:lang", function () { applyTheme(doc.getAttribute("data-theme-pref") || "auto"); });
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-theme-toggle]");
    if (b) return setTheme(doc.getAttribute("data-theme") === "dark" ? "light" : "dark", b);
    var s = e.target.closest("[data-theme-set]");
    if (s) setTheme(s.getAttribute("data-theme-set"), s);
  });

  /* ------------------------------------------------------------ Header, menu, back to top */
  var header = $("#site-header");
  function onScroll() { if (header) header.classList.toggle("is-solid", window.scrollY > 30); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var toggle = $(".menu-toggle"), drawer = $("#nav-drawer");
  function setMenu(open) {
    doc.classList.toggle("menu-open", open);
    document.body.classList.toggle("menu-open", open);
    if (toggle) toggle.setAttribute("aria-expanded", String(open));
    if (drawer) { drawer.setAttribute("aria-hidden", String(!open)); if (open) { var a = $("a", drawer); if (a) a.focus(); } }
  }
  if (toggle) toggle.addEventListener("click", function () { setMenu(!doc.classList.contains("menu-open")); });
  $$("[data-close-menu]").forEach(function (el) { el.addEventListener("click", function () { setMenu(false); }); });
  if (drawer) $$("a", drawer).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && doc.classList.contains("menu-open")) { setMenu(false); if (toggle) toggle.focus(); } });
  document.addEventListener("click", function (e) { if (e.target.closest("[data-to-top]")) window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }); });

  /* ------------------------------------------------------------ Renderers */
  var R = {};

  R.stats = function (el) {
    var items = [
      { n: courses.length, label: L("Courses, each customisable", "รายวิชา ปรับให้เหมาะกับแต่ละคนได้") },
      { n: 3, label: L("Ways to learn: Zoom, onsite, hybrid", "รูปแบบการเรียน: Zoom ที่แล็บ ไฮบริด") },
      { n: (DATA.domains || []).length, label: L("Domain learning paths", "เส้นทางเฉพาะสาขา") },
      { n: (DATA.researchSteps || []).length, label: L("Steps from topic to publication", "ขั้นตอน จากหัวข้อสู่การตีพิมพ์") }
    ];
    el.innerHTML = items.map(function (s, i) {
      return '<div class="stat reveal reveal-delay-' + i + '"><span class="stat__num" data-count="' + s.n + '">0</span><span class="stat__label">' + t(s.label) + "</span></div>";
    }).join("");
  };

  R.marquee = function (el) {
    var items = (DATA.tech || []).map(function (x) { return "<span>" + esc(x) + "</span>"; });
    items.splice(6, 0, '<span class="si">SI · Super Intelligence</span>');
    items.push('<span class="si">AI → SI</span>');
    el.innerHTML = '<div class="marquee__track">' + items.join("") + items.join("") + "</div>";
  };

  R.levels = function (el) {
    var compact = el.hasAttribute("data-compact");
    el.innerHTML = (DATA.levels || []).map(function (l) {
      var list = courses.filter(function (c) { return c.level === l.id && !c.anyLevel; });
      var chips = (compact ? list.slice(0, 4) : list).map(function (c) { return codeChip(c.code); }).join("");
      return '<li class="path__step lv-' + l.id + ' reveal"><span class="path__node" aria-hidden="true">' + l.id + "</span>" +
        '<div class="path__body"><span class="path__tag">' + t(l.tag) + "</span><h3>" + t(l.short) + "</h3><p>" + t(l.text) + "</p>" +
        (compact ? "" : '<p class="path__outcome">' + CHECK + t(l.outcome) + "</p>") +
        '<div class="chips">' + chips + (compact && list.length > 4 ? '<a class="code-chip code-chip--more" href="' + base + "pages/programs.html?level=" + l.id + '#catalog">+' + (list.length - 4) + "</a>" : "") + "</div></div></li>";
    }).join("");
  };

  R.tracks = function (el) {
    el.innerHTML = (DATA.tracks || []).map(function (tr, i) {
      var n = courses.filter(function (c) { return c.track === tr.id; }).length;
      return '<a class="card card--link reveal reveal-delay-' + (i % 3) + '" data-tilt href="' + base + "pages/programs.html?track=" + tr.id + '#catalog">' +
        '<div class="card__icon">' + icon(tr.icon) + "</div><h3>" + t(tr.name) + "</h3><p>" + t(tr.text) + "</p>" +
        '<div class="chips chips--tech">' + tr.tech.map(function (x) { return "<span>" + esc(x) + "</span>"; }).join("") + "</div>" +
        '<span class="card__meta card__meta--row">' + t(L(n + " courses", n + " รายวิชา")) + ARROW + "</span></a>";
    }).join("");
  };

  R.domains = function (el) {
    el.innerHTML = (DATA.domains || []).map(function (d, i) {
      return '<article class="card reveal reveal-delay-' + (i % 4) + '"><div class="card__icon">' + icon(d.icon) + "</div><h3>" + t(d.name) + "</h3><p>" + t(d.text) + "</p>" +
        '<div class="chips" style="padding:12px;border-radius:12px;background:var(--surface-2)">' + d.path.map(codeChip).join('<span aria-hidden="true" style="color:var(--text-faint)">→</span>') + "</div>" +
        '<p class="card__meta" style="border:0;padding-top:4px"><strong style="display:block;font-size:var(--fs-xs)">' + t(L("Example projects", "ตัวอย่างโปรเจกต์")) + "</strong>" + t(d.projects) + "</p></article>";
    }).join("");
  };

  function stepsHtml(list, opts) {
    return list.map(function (s, i) {
      return '<li class="step reveal reveal-delay-' + (i % 4) + '">' + (s.icon ? '<img class="step__icon" src="' + base + "assets/images/icons/" + s.icon + '.svg" alt="">' : "") +
        "<h3>" + t(s.name) + "</h3><p>" + t(s.text) + "</p>" + (s.output ? '<span class="step__out">' + CHECK + t(s.output) + "</span>" : "") + "</li>";
    }).join("");
  }
  R["research-steps"] = function (el) { el.innerHTML = stepsHtml(DATA.researchSteps || []); };

  R.flow = function (el) {
    var list = DATA[el.getAttribute("data-source")] || [];
    el.style.setProperty("--cols", list.length);
    el.innerHTML = list.map(function (s) {
      return '<li><span class="flow__dot">' + icon(s.icon || "spark") + "</span><h3>" + t(s.name) + "</h3><p>" + t(s.text) + "</p></li>";
    }).join("");
  };

  R["custom-options"] = function (el) {
    el.innerHTML = (DATA.customOptions || []).map(function (o, i) {
      return '<article class="card reveal reveal-delay-' + (i % 3) + '"><span class="card__index">0' + (i + 1) + "</span><h3>" + t(o.name) + "</h3><p>" + t(o.text) + "</p></article>";
    }).join("");
  };

  R.modes = function (el) {
    el.innerHTML = ["online", "onsite", "hybrid"].map(function (k, i) {
      var m = DATA.modes[k];
      return '<article class="card mode-card reveal reveal-delay-' + i + '" data-tilt><div class="card__icon">' + icon(m.icon) + "</div><h3>" + t(m.name) + "</h3><p>" + t(m.text) + "</p></article>";
    }).join("");
  };

  R["research-areas"] = function (el) {
    el.innerHTML = (DATA.researchAreas || []).map(function (a, i) {
      return '<article class="card reveal reveal-delay-' + (i % 3) + '"><div class="card__icon">' + icon(a.icon) + "</div><h3>" + t(a.name) + "</h3><p>" + t(a.text) + "</p></article>";
    }).join("");
  };

  R.venues = function (el) {
    el.innerHTML = (DATA.venues || []).map(function (v, i) {
      return '<article class="venue reveal reveal-delay-' + (i % 4) + '"><span class="venue__scope">' + t(v.scope) + "</span><h3>" + t(v.name) + "</h3><p>" + t(v.text) + "</p></article>";
    }).join("");
  };

  R["stem-bands"] = function (el) {
    el.innerHTML = (DATA.stemBands || []).map(function (b, i) {
      return '<article class="card band ' + b.color + ' reveal reveal-delay-' + i + '"><span class="band__age">' + t(b.age) + "</span><h3>" + t(b.name) + "</h3><p>" + t(b.text) + "</p>" +
        '<div class="chips chips--tech">' + b.focus.map(function (x) { return "<span>" + esc(x) + "</span>"; }).join("") + "</div>" +
        '<div class="card__meta"><span class="band__label">' + t(L("Suggested courses", "รายวิชาที่แนะนำ")) + '</span><div class="chips">' + b.courses.map(codeChip).join("") + "</div></div></article>";
    }).join("");
  };

  R["partner-models"] = function (el) {
    el.innerHTML = (DATA.partnerModels || []).map(function (m, i) {
      return '<article class="card reveal reveal-delay-' + (i % 4) + '"><div class="card__icon">' + icon(m.icon) + '</div><span class="card__tag">' + t(m.duration) + "</span><h3>" + t(m.name) + "</h3><p>" + t(m.text) + "</p></article>";
    }).join("");
  };

  R.audiences = function (el) {
    var list = DATA.audiences || [];
    el.innerHTML = '<div class="aud-tabs" role="tablist" aria-label="Audience">' + list.map(function (a, i) {
      return '<button class="aud-tab" role="tab" type="button" id="aud-tab-' + a.id + '" aria-controls="aud-' + a.id + '" aria-selected="' + (i === 0) + '" tabindex="' + (i === 0 ? 0 : -1) + '">' + icon(a.icon) + t(a.label) + "</button>";
    }).join("") + "</div>" + list.map(function (a, i) {
      return '<div class="aud-panel" role="tabpanel" id="aud-' + a.id + '" aria-labelledby="aud-tab-' + a.id + '"' + (i ? " hidden" : "") + '><div><h3>' + t(a.title) + "</h3><p>" + t(a.text) + "</p>" +
        '<a class="btn btn--primary" href="' + base + a.cta.href + '">' + t(a.cta.label) + ARROW + '</a></div><ul class="aud-points" role="list">' +
        a.points.map(function (p) { return "<li>" + CHECK + t(p) + "</li>"; }).join("") + "</ul></div>";
    }).join("");
    var tabs = $$(".aud-tab", el);
    function select(tab) { tabs.forEach(function (x) { var on = x === tab; x.setAttribute("aria-selected", String(on)); x.tabIndex = on ? 0 : -1; $("#" + x.getAttribute("aria-controls")).hidden = !on; }); }
    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { select(tab); });
      tab.addEventListener("keydown", function (e) {
        var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (d) { var n = tabs[(i + d + tabs.length) % tabs.length]; n.focus(); select(n); }
      });
    });
  };

  /* ---------- SI explainer widgets ---------- */
  R["si-ladder"] = function (el) {
    var list = DATA.siLadder || [];
    el.innerHTML = list.map(function (s, i) {
      return '<li class="' + (i === list.length - 1 ? "is-si" : "") + '" style="--i:' + i + '"><span class="when">' + t(s.when) + "</span><h3>" + t(s.name) + "</h3><p>" + t(s.text) + "</p></li>";
    }).join("");
  };

  R["si-compare"] = function (el) {
    el.innerHTML =
      '<div class="vs-toggle" role="group" aria-label="AI or SI"><button type="button" data-vs="ai" aria-pressed="true">AI ' + t(L("today", "วันนี้")) + '</button><button type="button" data-vs="si" aria-pressed="false">SI ' + t(L("goal", "เป้าหมาย")) + "</button></div>" +
      '<div class="vs-grid">' + (DATA.siCompare || []).map(function (c, i) {
        return '<article class="vs-card reveal reveal-delay-' + (i % 4) + '"><span class="vs-tag" aria-hidden="true"></span><h3>' + icon(c.icon) + t(c.name) + '</h3><div class="vs-text"><p class="vs-ai">' + t(c.ai) + '</p><p class="vs-si">' + t(c.si) + "</p></div></article>";
      }).join("") + "</div>";
    var grid = $(".vs-grid", el), btns = $$("[data-vs]", el), touched = false;
    function set(mode) {
      grid.classList.toggle("is-si", mode === "si");
      btns.forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-vs") === mode)); });
      $$(".vs-tag", el).forEach(function (s) { s.textContent = mode === "si" ? "SI" : "AI"; });
    }
    btns.forEach(function (b) { b.addEventListener("click", function () { touched = true; set(b.getAttribute("data-vs")); }); });
    set("ai");
    // play the AI -> SI change once when the visitor first sees it
    if ("IntersectionObserver" in window && !reduceMotion) {
      var io = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { io.disconnect(); setTimeout(function () { if (!touched) set("si"); }, 1600); }
      }, { threshold: 0.4 });
      io.observe(grid);
    }
  };

  R["si-blocks"] = function (el) {
    el.innerHTML = (DATA.siBlocks || []).map(function (b, i) {
      return '<article class="card reveal reveal-delay-' + (i % 3) + '" data-tilt><div class="card__icon">' + icon(b.icon) + "</div><h3>" + t(b.name) + "</h3><p>" + t(b.text) + "</p>" +
        '<div class="card__meta"><span style="display:block;margin-bottom:8px">' + t(L("Learn it in", "เรียนได้ใน")) + '</span><div class="chips">' + b.courses.map(codeChip).join("") + "</div></div></article>";
    }).join("");
  };

  R["si-myths"] = function (el) {
    el.innerHTML = (DATA.siMyths || []).map(function (m, i) {
      return '<div class="flip reveal reveal-delay-' + (i % 4) + '" role="button" tabindex="0" aria-pressed="false"><div class="flip__inner">' +
        '<div class="flip__face"><span class="flip__label">' + t(L("Myth", "ความเชื่อ")) + "</span><h3>" + t(m.myth) + '</h3><span class="flip__hint">' + t(L("Tap to see the fact →", "แตะเพื่อดูข้อเท็จจริง →")) + "</span></div>" +
        '<div class="flip__face flip__face--back"><span class="flip__label">' + t(L("Fact", "ข้อเท็จจริง")) + "</span><p>" + t(m.fact) + "</p></div></div></div>";
    }).join("");
    $$(".flip", el).forEach(function (f) {
      function flip() { var on = f.classList.toggle("is-flipped"); f.setAttribute("aria-pressed", String(on)); }
      f.addEventListener("click", flip);
      f.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); } });
    });
  };

  R.faq = function (el) {
    el.innerHTML = (DATA[el.getAttribute("data-source")] || []).map(function (f) {
      return "<details><summary>" + t(f.q) + "</summary><p>" + t(f.a) + "</p></details>";
    }).join("");
  };

  /* ---------- v4 explainers ---------- */
  R.notice = function (el) {
    var v = DATA[el.getAttribute("data-source") || "courseNotice"];
    if (!v) return;
    el.innerHTML = el.classList.contains("punchline") ? "<p>" + t(v) + "</p>" : '<img src="' + base + 'assets/images/icons/review.svg" alt=""><p>' + t(v) + "</p>";
  };

  // generic icon cards: data-source = whyStart | researchWhy | siSimple
  R["icon-cards"] = function (el) {
    el.innerHTML = (DATA[el.getAttribute("data-source")] || []).map(function (c, i) {
      return '<article class="card reveal reveal-delay-' + (i % 4) + '"><div class="card__icon">' + icon(c.icon) + "</div>" +
        (c.tag ? '<span class="card__tag">' + t(c.tag) + "</span>" : "") + "<h3>" + t(c.title) + "</h3><p>" + t(c.text) + "</p></article>";
    }).join("");
  };

  R["si-enough"] = function (el) {
    var d = DATA.siEnough;
    if (!d) return;
    el.innerHTML = '<p class="enough__yes">' + CHECK + t(d.yes) + "</p><p><strong>" + t(d.but) + '</strong></p><ul class="enough__gaps" role="list">' +
      d.gaps.map(function (g, i) { return '<li class="reveal reveal-delay-' + (i % 4) + '">' + t(g) + "</li>"; }).join("") + '</ul><p class="enough__so">' + t(d.so) + "</p>";
  };

  R["research-fields"] = function (el) {
    el.innerHTML = (DATA.researchFields || []).map(function (f, i) {
      return '<article class="card field-card reveal reveal-delay-' + (i % 4) + '"><div class="card__icon">' + icon(f.icon) + "</div><h3>" + t(f.field) + "</h3><p>" + t(f.project) + "</p>" +
        '<div class="field-out">' + f.outputs.map(function (o) { return "<span>" + t(o) + "</span>"; }).join("") + "</div>" +
        '<div class="card__meta"><div class="chips">' + f.codes.map(codeChip).join("") + "</div></div></article>";
    }).join("");
  };

  R["future-skills"] = function (el) {
    el.innerHTML = (DATA.futureSkills || []).map(function (s, i) {
      return '<article class="skill reveal reveal-delay-' + (i % 3) + '"><span class="skill__num">0' + (i + 1) + '</span><div class="card__icon">' + icon(s.icon) + "</div><h3>" + t(s.name) + "</h3><p>" + t(s.text) + '</p><p class="skill__how">' + t(s.how) + "</p></article>";
    }).join("");
  };

  R["exam-tips"] = function (el) {
    el.innerHTML = (DATA.examTips || []).map(function (s, i) {
      return '<li class="tip reveal reveal-delay-' + i + '"><span class="tip__key">' + esc(s.key) + "</span><h3>" + t(s.title) + "</h3><p>" + t(s.text) + "</p></li>";
    }).join("");
  };

  R.exams = function (el) {
    var tc = DATA.tcas;
    el.innerHTML = '<div class="exam-cards">' + (DATA.exams || []).map(function (x, i) {
      return '<article class="card exam-card reveal reveal-delay-' + i + '"><span class="card__tag">' + esc(x.lang) + "</span><h3>" + esc(x.name) + '</h3><p>' + t(x.by) + "</p>" +
        '<p class="exam-award">' + icon("trophy") + t(x.award) + "</p>" +
        '<div class="card__meta"><span>' + t(L("Prep course", "หลักสูตรเตรียมสอบ")) + "</span> " + codeChip(x.code) + "</div></article>";
    }).join("") + "</div>" +
      (tc ? '<div class="tcas reveal"><h3>' + t(tc.title) + "</h3><p>" + t(tc.lead) + '</p><ol class="tcas__list" role="list">' +
        tc.items.map(function (it, i) { return '<li><span class="tcas__n">' + (i + 1) + "</span><div><strong>" + t(it.prog) + "</strong><span>" + t(it.ref) + "</span></div></li>"; }).join("") +
        '</ol><p class="note">' + t(tc.note) + "</p></div>" : "");
  };

  /* ---------- Course catalogue ---------- */
  R.courses = function (el) {
    var params = new URLSearchParams(location.search);
    var state = { track: params.get("track") || "all", level: params.get("level") || "all", mode: params.get("mode") || "all", q: params.get("q") || "" };
    var filters = $("[data-course-filters]"), countEl = $("[data-course-count]");
    function seg(name, label, items) {
      return '<div class="filter-row"><span class="filter-label">' + t(label) + '</span><div class="seg" role="group">' +
        '<button type="button" data-f-' + name + '="all">' + t(L("All", "ทั้งหมด")) + "</button>" + items + "</div></div>";
    }
    if (filters) {
      filters.innerHTML =
        seg("track", L("Track", "สาย"), (DATA.tracks || []).map(function (tr) { return '<button type="button" data-f-track="' + tr.id + '">' + t(tr.name) + "</button>"; }).join("")) +
        seg("level", L("Level", "ระดับ"), (DATA.levels || []).map(function (l) { return '<button type="button" class="lv-' + l.id + '" data-f-level="' + l.id + '">' + t(l.short) + "</button>"; }).join("")) +
        seg("mode", L("Mode", "รูปแบบ"), ["online", "onsite", "hybrid"].map(function (k) { return '<button type="button" data-f-mode="' + k + '">' + t(DATA.modes[k].name) + "</button>"; }).join("")) +
        '<label class="search"><img src="' + base + 'assets/images/icons/search.svg" alt=""><span class="visually-hidden">Search</span>' +
        '<input type="search" data-f-q data-i18n-attrs="placeholder" data-en-placeholder="Search courses, e.g. Python, Jetson, SwiftUI, medical" data-th-placeholder="ค้นหารายวิชา เช่น Python, Jetson, SwiftUI, การแพทย์" value="' + esc(state.q) + '"></label>';
    }
    function sync() {
      ["track", "level", "mode"].forEach(function (k) { $$("[data-f-" + k + "]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-f-" + k) === String(state[k]))); }); });
      var q = state.q.trim().toLowerCase();
      var list = courses.filter(function (c) {
        if (state.track !== "all" && c.track !== state.track) return false;
        if (state.level !== "all" && !c.anyLevel && String(c.level) !== String(state.level)) return false;
        if (state.mode !== "all" && ((details[c.code] && details[c.code].modes) || []).indexOf(state.mode) === -1) return false;
        if (q) {
          var d = details[c.code] || {};
          var hay = (c.code + " " + plain(c.title) + " " + plain(c.text) + " " + c.tools.join(" ") + " " + (d.modules || []).map(plain).join(" ")).toLowerCase();
          return hay.indexOf(q) !== -1;
        }
        return true;
      });
      el.innerHTML = list.length ? list.map(function (c) {
        var tr = track(c.track);
        return '<article role="button" tabindex="0" class="course lv-' + c.level + (c.featured ? " course--featured glow-border" : "") + '" data-course="' + c.code + '" id="course-' + c.code + '" aria-haspopup="dialog">' +
          '<span class="course__top"><span class="course__code">' + c.code + "</span>" + lvlChip(c) + "</span>" +
          "<h3>" + t(c.title) + "</h3><p>" + t(c.text) + "</p>" +
          '<span class="course__meta"><span>' + hours(c) + " · " + t(tr.name) + "</span>" + modesIcons(c.code) + "</span>" +
          '<span class="course__more">' + t(L("Full details & ask", "ดูรายละเอียดและสอบถาม")) + ARROW + "</span></article>";
      }).join("") : '<p class="empty">' + t(L("No course matches yet, but we can design one for you. Ask us below.", "ยังไม่พบรายวิชาที่ตรงกัน แต่เราออกแบบให้คุณได้ สอบถามได้ด้านล่าง")) + "</p>";
      if (countEl) countEl.innerHTML = t(L("Showing " + list.length + " of " + courses.length + " courses", "แสดง " + list.length + " จาก " + courses.length + " รายวิชา"));
      var p = new URLSearchParams();
      ["track", "level", "mode"].forEach(function (k) { if (state[k] !== "all") p.set(k, state[k]); });
      if (state.q) p.set("q", state.q);
      try { history.replaceState(null, "", location.pathname + (p.toString() ? "?" + p : "") + (location.hash.indexOf("#course-") === 0 ? "#catalog" : location.hash)); } catch (e) { /* file:// may refuse */ }
    }
    ["track", "level", "mode"].forEach(function (k) {
      $$("[data-f-" + k + "]").forEach(function (b) { b.addEventListener("click", function () { state[k] = b.getAttribute("data-f-" + k); sync(); }); });
    });
    var qi = $("[data-f-q]");
    if (qi) qi.addEventListener("input", function () { state.q = qi.value; sync(); });
    sync();
  };

  /* ---------- Plan builder ---------- */
  R.planner = function (el) {
    var P = DATA.planner;
    var groups = [
      ["who", L("I am…", "ฉันคือ…")], ["interest", L("I'm interested in…", "ฉันสนใจ…")], ["level", L("My level", "ระดับของฉัน")],
      ["goal", L("My goal", "เป้าหมายของฉัน")], ["mode", L("I'd like to learn", "ฉันอยากเรียนแบบ")], ["format", L("Group size", "ขนาดกลุ่ม")]
    ];
    var defaults = { who: "teen", interest: "si", level: "new", goal: "skills", mode: "hybrid", format: "small" };
    el.innerHTML = '<form class="planner__form" data-plan-form>' + groups.map(function (g) {
      return "<fieldset><legend>" + t(g[1]) + '</legend><div class="opts">' + P[g[0]].map(function (o) {
        return '<label class="opt"><input type="radio" name="' + g[0] + '" value="' + o.id + '"' + (defaults[g[0]] === o.id ? " checked" : "") + "><span>" + t(o.label) + "</span></label>";
      }).join("") + "</div></fieldset>";
    }).join("") + '</form><aside class="planner__result" aria-live="polite" data-plan-result></aside>';
    var form = $("[data-plan-form]", el), out = $("[data-plan-result]", el);
    function val(n) { var i = form.querySelector('input[name="' + n + '"]:checked'); return i ? i.value : defaults[n]; }
    function label(group, id) { return P[group].filter(function (o) { return o.id === id; })[0].label; }
    function build() {
      var v = { who: val("who"), interest: val("interest"), level: val("level"), goal: val("goal"), mode: val("mode"), format: val("format") };
      var path = P.paths[v.interest];
      var seq = [];
      if (v.level === "new") seq = path.new.concat(path.some.slice(0, 1));
      else if (v.level === "some") seq = path.some.concat(path.adv.slice(0, 1));
      else seq = path.adv.slice();
      if (v.who === "child") seq = ["CT100"].concat(seq.filter(function (c) { return byCode[c] && byCode[c].level <= 2; })).slice(0, 3);
      seq = seq.concat(P.goalAdds[v.goal] || []);
      var seen = {};
      seq = seq.filter(function (c) { if (seen[c] || !byCode[c]) return false; seen[c] = 1; return true; }).slice(0, 6);
      if (v.mode === "online") seq = seq.filter(function (c) { return ((details[c] && details[c].modes) || ["online"]).indexOf("online") !== -1 || c === "INNO"; });
      var summary = [label("who", v.who), label("interest", v.interest), label("level", v.level), label("goal", v.goal), label("mode", v.mode), label("format", v.format)];
      out.innerHTML = '<span class="eyebrow" style="background:rgba(255,255,255,.08);color:#dfe4ff;border-color:rgba(255,255,255,.15)">' + t(L("Your personal plan", "แผนการเรียนของคุณ")) + "</span>" +
        "<h3>" + t(L("A suggested path, made for you", "เส้นทางที่แนะนำ ออกแบบมาเพื่อคุณ")) + "</h3>" +
        '<div class="plan-meta">' + summary.slice(4).map(function (s) { return "<span>" + t(s) + "</span>"; }).join("") + "<span>" + t(L("Thai / English", "ไทย / อังกฤษ")) + "</span></div>" +
        '<ol class="plan-seq" role="list">' + seq.map(function (c, i) {
          var co = byCode[c];
          return '<li class="lv-' + co.level + '" style="animation-delay:' + i * 70 + 'ms"><span><strong>' + t(co.title) + "</strong><small>" + c + " · " + hours(co) + "</small></span></li>";
        }).join("") + "</ol>" +
        "<p>" + t(L("This is a starting point. In a free consultation we adjust modules, pace and your project topic.", "นี่คือจุดเริ่มต้น ในการปรึกษาฟรี เราจะปรับบทเรียน ความเร็ว และหัวข้อโปรเจกต์ให้เหมาะกับคุณ")) + "</p>" +
        '<a class="btn btn--light" data-magnetic href="' + contactUrl({ topic: "plan", plan: summary.map(function (s) { return s.en; }).join(" · ") + " | " + seq.join(" → ") }) + '">' + t(L("Request this plan", "ขอรับแผนนี้")) + ARROW + "</a>";
    }
    form.addEventListener("change", build);
    build();
  };

  $$("[data-render]").forEach(function (el) { var fn = R[el.getAttribute("data-render")]; if (fn) fn(el); });

  /* ------------------------------------------------------------ Course dialog */
  var dlg = null;
  function courseDialog(code) {
    var c = byCode[code];
    if (!c) return;
    var d = details[code] || {};
    var tr = track(c.track);
    if (!dlg) {
      dlg = document.createElement("dialog");
      dlg.className = "dialog";
      dlg.setAttribute("aria-labelledby", "course-dlg-title");
      document.body.appendChild(dlg);
      dlg.addEventListener("click", function (e) { if (e.target === dlg || e.target.closest("[data-dlg-close]")) dlg.close(); });
    }
    dlg.className = "dialog lv-" + c.level;
    dlg.innerHTML =
      '<div class="dialog__head"><span class="course__top" style="justify-content:flex-start;gap:10px"><span class="course__code">' + c.code + "</span>" + lvlChip(c) + "</span>" +
      '<h2 id="course-dlg-title">' + t(c.title) + "</h2><p>" + t(c.text) + "</p>" +
      '<button type="button" class="icon-btn dialog__close" data-dlg-close aria-label="Close">' + CLOSE + "</button></div>" +
      '<div class="dialog__body">' +
      '<dl class="facts"><div class="fact"><dt>' + t(L("Duration", "ระยะเวลา")) + "</dt><dd>" + hours(c) + '</dd></div><div class="fact"><dt>' + t(L("Track", "สาย")) + "</dt><dd>" + t(tr.name) + '</dd></div><div class="fact"><dt>' + t(L("Prerequisite", "พื้นฐานที่ควรมี")) + "</dt><dd>" + t(d.prereq || L("Ask us", "สอบถามเรา")) + "</dd></div></dl>" +
      '<div class="dlist">' +
      "<h3>" + t(L("Study modes", "รูปแบบการเรียน")) + '</h3><div class="chips">' + (d.modes || []).map(function (m) { return '<span class="badge">' + icon(DATA.modes[m].icon) + t(DATA.modes[m].name) + "</span>"; }).join("") + "</div>" +
      "<h3>" + t(L("What you will learn", "สิ่งที่จะได้เรียน")) + '</h3><ol class="modules" role="list">' + (d.modules || []).map(function (m) { return "<li>" + t(m) + "</li>"; }).join("") + "</ol>" +
      "<h3>" + t(L("Outcomes", "ผลลัพธ์ที่ได้")) + '</h3><ul class="ticks">' + (d.outcomes || []).map(function (o) { return "<li>" + t(o) + "</li>"; }).join("") + "</ul>" +
      "<h3>" + t(L("Final project", "โปรเจกต์ปลายภาค")) + "</h3><p>" + t(d.project) + "</p>" +
      "<h3>" + t(L("Tools", "เครื่องมือ")) + '</h3><div class="chips chips--tech">' + c.tools.map(function (x) { return "<span>" + esc(x) + "</span>"; }).join("") + "</div>" +
      "<h3>" + t(L("Shaped around you", "ปรับให้เหมาะกับคุณ")) + '</h3><p class="note">' + t(DATA.courseNotice) + "</p>" +
      (c.track === "aieng" ? '<p class="note">' + t(DATA.aiToolsNotice) + "</p>" : "") +
      (c.track === "exam" && DATA.tcas ? '<p class="note">' + t(DATA.tcas.note) + "</p>" : "") +
      "</div></div>" +
      '<div class="dialog__foot"><a class="btn btn--sm" href="' + contactUrl({ topic: "custom", course: c.code }) + '">' + t(L("Customise this course", "ขอปรับหลักสูตรนี้")) + "</a>" +
      '<a class="btn btn--sm btn--primary" href="' + contactUrl({ topic: "courses", course: c.code }) + '">' + t(L("Ask about this course", "สอบถามหลักสูตรนี้")) + ARROW + "</a></div>";
    if (dlg.showModal) { if (!dlg.open) dlg.showModal(); } else dlg.setAttribute("open", "");
  }
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-course]");
    if (!el) return;
    e.preventDefault();
    courseDialog(el.getAttribute("data-course"));
  });
  document.addEventListener("keydown", function (e) {
    var el = e.target.closest && e.target.closest('[data-course][role="button"]');
    if (el && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); courseDialog(el.getAttribute("data-course")); }
  });
  if (initialCourse) setTimeout(function () { courseDialog(initialCourse); }, 300);

  /* ------------------------------------------------------------ Forms (consent required on every submission) */
  var params = new URLSearchParams(location.search);
  var cform = $("form[data-mailto-form]");
  if (cform) {
    var topic = params.get("topic"), course = params.get("course"), plan = params.get("plan");
    if (topic && cform.elements.topic) {
      var map = { plan: "plan", custom: "custom", courses: "courses" };
      cform.elements.topic.value = map[topic] || topic;
    }
    if (course && byCode[course]) {
      var ci = cform.elements.course; if (ci) ci.value = course + " – " + byCode[course].title.en;
    }
    if ((course || plan) && cform.elements.message && !cform.elements.message.value) {
      cform.elements.message.value = plan
        ? (lang() === "th" ? "ฉันสนใจแผนการเรียนนี้: " : "I am interested in this learning plan: ") + plan + "\n\n"
        : (lang() === "th" ? "ฉันสนใจหลักสูตร " : "I am interested in the course ") + course + (topic === "custom" ? (lang() === "th" ? " และอยากให้ปรับให้เหมาะกับฉัน: " : " and would like it customised: ") : ". ") + "\n\n";
    }
  }

  $$("form[data-mailto-form]").forEach(function (form) {
    form.setAttribute("novalidate", "");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      $$(".field", form).forEach(function (f) {
        var input = $("input, select, textarea", f), err = $(".field__error", f);
        if (!input) return;
        var msg = null;
        if (input.required && !input.value.trim()) msg = L("This field is required.", "กรุณากรอกข้อมูลช่องนี้");
        else if (input.type === "email" && input.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) msg = L("Please enter a valid email address.", "กรุณากรอกอีเมลให้ถูกต้อง");
        f.classList.toggle("has-error", !!msg);
        if (err) err.innerHTML = msg ? t(msg) : "";
        if (msg && ok) { input.focus(); ok = false; }
      });
      $$(".check input[required]", form).forEach(function (c) {
        var box = c.closest(".check");
        box.classList.toggle("has-error", !c.checked);
        if (!c.checked && ok) { c.focus(); ok = false; }
      });
      if (!ok) return;
      var g = function (n) { var x = form.elements[n]; return x ? String(x.value).trim() : ""; };
      var tEl = form.elements.topic;
      var topicTxt = tEl ? tEl.options[tEl.selectedIndex].text : "";
      var now = new Date();
      var consentLine = "PDPA consent: given on " + now.toISOString() + " (privacy policy v" + ((window.DD_PREFS || {}).CONSENT_VERSION || 1) + ")" +
        (form.elements.marketing && form.elements.marketing.checked ? " · news & updates: yes" : " · news & updates: no");
      var bodyText = "Name / ชื่อ: " + g("name") + "\nEmail / อีเมล: " + g("email") + "\nOrganisation / หน่วยงาน: " + (g("org") || "-") +
        "\nTopic / เรื่อง: " + topicTxt + (g("course") ? "\nCourse / หลักสูตร: " + g("course") : "") +
        "\nPreferred mode / รูปแบบที่สนใจ: " + (g("mode") || "-") + "\n\n" + g("message") + "\n\n---\n" + consentLine;
      var subject = "[DeepDistrict] " + topicTxt + " – " + g("name");
      var cfg = (window.DD_CONFIG && window.DD_CONFIG.form) || {};
      var btn = $("button[type=submit]", form);
      function done(sent) {
        var s = $(".form-success", form);
        if (s) {
          s.innerHTML = sent
            ? t(L("Thank you — your message has been sent. We usually reply within two working days.", "ขอบคุณ ข้อความของคุณถูกส่งแล้ว โดยปกติเราจะตอบกลับภายใน 2 วันทำการ"))
            : t(L("Your email app should now open with the message ready to send. If it did not, email us at " + EMAIL + ".", "แอปอีเมลของคุณควรเปิดขึ้นพร้อมข้อความที่พร้อมส่ง หากไม่เปิด กรุณาส่งอีเมลถึง " + EMAIL));
          s.classList.add("is-visible"); s.focus();
        }
        if (sent) form.reset();
        // consent must be given again for every new submission
        $$(".check input", form).forEach(function (c) { c.checked = false; });
        if (btn) btn.disabled = false;
      }
      function viaMail() {
        window.location.href = "mailto:" + EMAIL + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(bodyText);
        done(false);
      }
      if (!cfg.endpoint || !window.fetch) return viaMail();
      if (btn) btn.disabled = true;
      var payload = { subject: subject, name: g("name"), email: g("email"), organisation: g("org"), topic: topicTxt, course: g("course"), mode: g("mode"), message: g("message"), consent: consentLine, from_name: "DeepDistrict.si website" };
      if (cfg.accessKey) payload.access_key = cfg.accessKey;
      var ctrl = window.AbortController ? new AbortController() : null;
      var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, cfg.timeoutMs || 12000);
      fetch(cfg.endpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload), signal: ctrl ? ctrl.signal : undefined })
        .then(function (r) { clearTimeout(timer); if (!r.ok) throw new Error("HTTP " + r.status); done(true); })
        .catch(function () { clearTimeout(timer); viaMail(); });
    });
  });

  setLang(lang(), false);
  applyTheme(doc.getAttribute("data-theme-pref") || "auto");
})();
