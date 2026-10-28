/* ==========================================================================
   DeepDistrict.si — interactions, bilingual rendering and animations
   No dependencies; works from file:// and any static host.
   ========================================================================== */

(function () {
  "use strict";

  var doc = document.documentElement;
  var DATA = window.DD_CONTENT || {};
  var base = document.body.getAttribute("data-base") || "";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var EMAIL = "info@deepdistrict.si";

  doc.classList.remove("no-js");

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function lang() { return doc.lang === "th" ? "th" : "en"; }
  /* Bilingual text -> both spans (CSS shows the active language). Strings pass through. */
  function t(v) {
    if (v == null) return "";
    if (typeof v !== "object") return esc(v);
    return '<span lang="en">' + esc(v.en) + '</span><span lang="th">' + esc(v.th) + "</span>";
  }
  function plain(v) { return v && typeof v === "object" ? v.en + " " + v.th : String(v || ""); }
  function icon(name) { return '<img src="' + base + "assets/images/icons/" + name + '.svg" alt="">'; }
  var ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>';

  var courses = DATA.courses || [];
  var byCode = {};
  courses.forEach(function (c) { byCode[c.code] = c; });
  function level(id) { return (DATA.levels || [])[id - 1]; }
  function track(id) { return (DATA.tracks || []).filter(function (x) { return x.id === id; })[0]; }
  function hours(c) {
    return typeof c.hours === "number" ? t({ en: c.hours + " h", th: c.hours + " ชม." }) : t(c.hours);
  }
  function codeChip(code) {
    var c = byCode[code];
    if (!c) return "";
    return '<a class="code-chip lv-' + c.level + '" href="' + base + "pages/programs.html?q=" + code + '#catalog" title="' + esc(c.title.en) + '">' + code + "</a>";
  }

  /* ------------------------------------------------------------ Language switch */
  function setLang(l) {
    doc.lang = l;
    try { localStorage.setItem("dd-lang", l); } catch (e) { /* storage blocked */ }
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
  $$("[data-set-lang]").forEach(function (b) {
    b.addEventListener("click", function () { setLang(b.getAttribute("data-set-lang")); });
  });

  /* ------------------------------------------------------------ Header & menu */
  var header = $("#site-header");
  function onScroll() { if (header) header.classList.toggle("is-solid", window.scrollY > 40); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var toggle = $(".menu-toggle");
  var drawer = $("#nav-drawer");
  function setMenu(open) {
    doc.classList.toggle("menu-open", open);
    document.body.classList.toggle("menu-open", open);
    if (toggle) toggle.setAttribute("aria-expanded", String(open));
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

  /* ------------------------------------------------------------ Renderers */
  var R = {};

  R.stats = function (el) {
    var items = [
      { n: courses.length, label: { en: "Courses from foundation to research", th: "รายวิชา ตั้งแต่พื้นฐานถึงงานวิจัย" } },
      { n: (DATA.tracks || []).length, label: { en: "Learning tracks", th: "สายการเรียนรู้" } },
      { n: (DATA.domains || []).length, label: { en: "Domain learning paths", th: "เส้นทางเฉพาะสาขา" } },
      { n: (DATA.researchSteps || []).length, label: { en: "Steps from question to publication", th: "ขั้นตอน จากคำถามสู่การตีพิมพ์" } }
    ];
    el.innerHTML = items.map(function (s) {
      return '<div class="stat reveal"><span class="stat__num" data-count="' + s.n + '">0</span><span class="stat__label">' + t(s.label) + "</span></div>";
    }).join("");
  };

  R.marquee = function (el) {
    var items = (DATA.tech || []).map(function (x) { return "<span>" + esc(x) + "</span>"; }).join("");
    el.innerHTML = '<div class="marquee__track">' + items + items + "</div>";
  };

  R.levels = function (el) {
    var compact = el.hasAttribute("data-compact");
    el.innerHTML = (DATA.levels || []).map(function (l) {
      var list = courses.filter(function (c) { return c.level === l.id; });
      var chips = (compact ? list.slice(0, 4) : list).map(function (c) { return codeChip(c.code); }).join("");
      return '<li class="path__step lv-' + l.id + ' reveal">' +
        '<span class="path__node" aria-hidden="true">' + l.id + "</span>" +
        '<div class="path__body">' +
        '<span class="path__tag">' + t(l.tag) + "</span>" +
        "<h3>" + t(l.short) + "</h3>" +
        "<p>" + t(l.text) + "</p>" +
        (compact ? "" : '<p class="path__outcome">' + CHECK + t(l.outcome) + "</p>") +
        '<div class="chips">' + chips +
        (compact && list.length > 4 ? '<a class="code-chip code-chip--more" href="' + base + "pages/programs.html?level=" + l.id + '#catalog">+' + (list.length - 4) + "</a>" : "") +
        "</div></div></li>";
    }).join("");
  };

  R.tracks = function (el) {
    el.innerHTML = (DATA.tracks || []).map(function (tr, i) {
      var n = courses.filter(function (c) { return c.track === tr.id; }).length;
      return '<a class="card card--link track reveal reveal-delay-' + (i % 3) + '" href="' + base + "pages/programs.html?track=" + tr.id + '#catalog">' +
        '<div class="card__icon">' + icon(tr.icon) + "</div>" +
        "<h3>" + t(tr.name) + "</h3><p>" + t(tr.text) + "</p>" +
        '<div class="chips chips--tech">' + tr.tech.map(function (x) { return "<span>" + esc(x) + "</span>"; }).join("") + "</div>" +
        '<span class="card__meta card__meta--row">' + t({ en: n + " courses", th: n + " รายวิชา" }) + ARROW + "</span></a>";
    }).join("");
  };

  R.domains = function (el) {
    el.innerHTML = (DATA.domains || []).map(function (d, i) {
      return '<article class="card domain reveal reveal-delay-' + (i % 4) + '">' +
        '<div class="card__icon">' + icon(d.icon) + "</div>" +
        "<h3>" + t(d.name) + "</h3><p>" + t(d.text) + "</p>" +
        '<div class="domain__path" aria-label="Recommended course sequence">' + d.path.map(codeChip).join('<span class="domain__arrow" aria-hidden="true">→</span>') + "</div>" +
        '<p class="domain__projects"><strong>' + t({ en: "Example projects", th: "ตัวอย่างโปรเจกต์" }) + "</strong>" + t(d.projects) + "</p></article>";
    }).join("");
  };

  R["research-steps"] = function (el) {
    el.innerHTML = (DATA.researchSteps || []).map(function (s, i) {
      return '<li class="rstep reveal reveal-delay-' + (i % 4) + '">' +
        '<span class="rstep__num">' + String(i + 1).padStart(2, "0") + "</span>" +
        "<h3>" + t(s.name) + "</h3><p>" + t(s.text) + "</p>" +
        '<span class="rstep__out">' + CHECK + t(s.output) + "</span></li>";
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
      return '<article class="card band ' + b.color + ' reveal reveal-delay-' + i + '">' +
        '<span class="band__age">' + t(b.age) + "</span>" +
        "<h3>" + t(b.name) + "</h3><p>" + t(b.text) + "</p>" +
        '<div class="chips chips--tech">' + b.focus.map(function (x) { return "<span>" + esc(x) + "</span>"; }).join("") + "</div>" +
        '<div class="card__meta"><span class="band__label">' + t({ en: "Suggested courses", th: "รายวิชาที่แนะนำ" }) + '</span><div class="chips">' + b.courses.map(codeChip).join("") + "</div></div></article>";
    }).join("");
  };

  R["partner-models"] = function (el) {
    el.innerHTML = (DATA.partnerModels || []).map(function (m, i) {
      return '<article class="card reveal reveal-delay-' + (i % 4) + '"><div class="card__icon">' + icon(m.icon) + '</div><span class="card__tag">' + t(m.duration) + "</span><h3>" + t(m.name) + "</h3><p>" + t(m.text) + "</p></article>";
    }).join("");
  };

  R.spectrum = function (el) {
    el.innerHTML = '<div class="spectrum__bar" aria-hidden="true"><span></span></div><ol class="spectrum__stages" role="list">' +
      (DATA.spectrum || []).map(function (s, i) {
        return '<li class="spectrum__stage' + (i === 3 ? " is-si" : "") + '" style="--i:' + i + '"><span class="spectrum__dot" aria-hidden="true"></span>' +
          '<span class="spectrum__when">' + t(s.when) + "</span><h3>" + t(s.name) + "</h3><p>" + t(s.text) + "</p></li>";
      }).join("") + "</ol>";
    el.classList.add("reveal");
  };

  R.audiences = function (el) {
    var list = DATA.audiences || [];
    el.innerHTML =
      '<div class="aud-tabs" role="tablist" aria-label="Audience">' +
      list.map(function (a, i) {
        return '<button class="aud-tab" role="tab" type="button" id="aud-tab-' + a.id + '" aria-controls="aud-' + a.id + '" aria-selected="' + (i === 0) + '" tabindex="' + (i === 0 ? 0 : -1) + '">' + icon(a.icon) + t(a.label) + "</button>";
      }).join("") + "</div>" +
      list.map(function (a, i) {
        return '<div class="aud-panel" role="tabpanel" id="aud-' + a.id + '" aria-labelledby="aud-tab-' + a.id + '"' + (i === 0 ? "" : " hidden") + ">" +
          '<div class="aud-panel__text"><h3>' + t(a.title) + "</h3><p>" + t(a.text) + "</p>" +
          '<a class="btn btn--primary" href="' + base + a.cta.href + '">' + t(a.cta.label) + ARROW + "</a></div>" +
          '<ul class="aud-points" role="list">' + a.points.map(function (p) { return "<li>" + CHECK + t(p) + "</li>"; }).join("") + "</ul></div>";
      }).join("");
    var tabs = $$(".aud-tab", el);
    function select(tab) {
      tabs.forEach(function (x) {
        var on = x === tab;
        x.setAttribute("aria-selected", String(on));
        x.tabIndex = on ? 0 : -1;
        $("#" + x.getAttribute("aria-controls")).hidden = !on;
      });
    }
    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { select(tab); });
      tab.addEventListener("keydown", function (e) {
        var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (!d) return;
        var next = tabs[(i + d + tabs.length) % tabs.length];
        next.focus(); select(next);
      });
    });
  };

  /* Course catalogue with filters (track, level, search) synced to the URL */
  R.courses = function (el) {
    var params = new URLSearchParams(location.search);
    var state = { track: params.get("track") || "all", level: params.get("level") || "all", q: params.get("q") || "" };
    var filters = $("[data-course-filters]");
    var countEl = $("[data-course-count]");

    if (filters) {
      filters.innerHTML =
        '<div class="filter-row"><span class="filter-label">' + t({ en: "Track", th: "สาย" }) + '</span><div class="tabs" role="group" aria-label="Track">' +
        '<button class="tab" type="button" data-f-track="all">' + t({ en: "All", th: "ทั้งหมด" }) + "</button>" +
        (DATA.tracks || []).map(function (tr) { return '<button class="tab" type="button" data-f-track="' + tr.id + '">' + t(tr.name) + "</button>"; }).join("") +
        "</div></div>" +
        '<div class="filter-row"><span class="filter-label">' + t({ en: "Level", th: "ระดับ" }) + '</span><div class="tabs" role="group" aria-label="Level">' +
        '<button class="tab" type="button" data-f-level="all">' + t({ en: "All", th: "ทั้งหมด" }) + "</button>" +
        (DATA.levels || []).map(function (l) { return '<button class="tab tab--lv lv-' + l.id + '" type="button" data-f-level="' + l.id + '">' + t(l.short) + "</button>"; }).join("") +
        "</div></div>" +
        '<label class="search"><img src="' + base + 'assets/images/icons/search.svg" alt=""><span class="visually-hidden">Search</span>' +
        '<input type="search" data-f-q data-i18n-attrs="placeholder" data-en-placeholder="Search courses, e.g. Python, Jetson, SwiftUI" data-th-placeholder="ค้นหารายวิชา เช่น Python, Jetson, SwiftUI" value="' + esc(state.q) + '"></label>';
      setLang(lang()); // apply placeholder language
    }

    function sync() {
      $$("[data-f-track]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-f-track") === state.track)); });
      $$("[data-f-level]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-f-level") === String(state.level))); });
      var q = state.q.trim().toLowerCase();
      var list = courses.filter(function (c) {
        if (state.track !== "all" && c.track !== state.track) return false;
        if (state.level !== "all" && String(c.level) !== String(state.level)) return false;
        if (q) {
          var hay = (c.code + " " + plain(c.title) + " " + plain(c.text) + " " + c.tools.join(" ")).toLowerCase();
          return hay.indexOf(q) !== -1;
        }
        return true;
      });
      el.innerHTML = list.length ? list.map(function (c) {
        var tr = track(c.track), lv = level(c.level);
        return '<article class="course lv-' + c.level + '" id="course-' + c.code + '">' +
          '<div class="course__top"><span class="course__code">' + c.code + '</span><span class="lvl lv-' + c.level + '">' + t(lv.short) + "</span></div>" +
          "<h3>" + t(c.title) + "</h3><p>" + t(c.text) + "</p>" +
          '<div class="chips chips--tech">' + c.tools.map(function (x) { return "<span>" + esc(x) + "</span>"; }).join("") + "</div>" +
          '<div class="course__meta"><span>' + icon(tr.icon) + t(tr.name) + "</span><span>" + hours(c) + "</span></div></article>";
      }).join("") : '<p class="empty">' + t({ en: "No courses match. Try another filter or search term.", th: "ไม่พบรายวิชาที่ตรงกัน ลองเปลี่ยนตัวกรองหรือคำค้นหา" }) + "</p>";
      if (countEl) countEl.innerHTML = t({ en: "Showing " + list.length + " of " + courses.length + " courses", th: "แสดง " + list.length + " จาก " + courses.length + " รายวิชา" });
      var p = new URLSearchParams();
      if (state.track !== "all") p.set("track", state.track);
      if (state.level !== "all") p.set("level", state.level);
      if (state.q) p.set("q", state.q);
      try { history.replaceState(null, "", location.pathname + (p.toString() ? "?" + p : "") + location.hash); } catch (e) { /* file:// may refuse */ }
    }

    $$("[data-f-track]").forEach(function (b) { b.addEventListener("click", function () { state.track = b.getAttribute("data-f-track"); sync(); }); });
    $$("[data-f-level]").forEach(function (b) { b.addEventListener("click", function () { state.level = b.getAttribute("data-f-level"); sync(); }); });
    var qInput = $("[data-f-q]");
    if (qInput) qInput.addEventListener("input", function () { state.q = qInput.value; sync(); });
    sync();
  };

  $$("[data-render]").forEach(function (el) {
    var fn = R[el.getAttribute("data-render")];
    if (fn) fn(el);
  });
  setLang(lang());

  /* ------------------------------------------------------------ Typewriter */
  $$("[data-typewriter]").forEach(function (el) {
    var words = DATA.typewriter || [];
    if (!words.length) return;
    if (reduceMotion) { el.textContent = words[words.length - 1]; return; }
    var w = 0, i = 0, deleting = false;
    (function tick() {
      var word = words[w];
      i += deleting ? -1 : 1;
      el.textContent = word.slice(0, i);
      var delay = deleting ? 45 : 90;
      if (!deleting && i === word.length) { deleting = true; delay = w === words.length - 1 ? 2600 : 1300; }
      else if (deleting && i === 0) { deleting = false; w = (w + 1) % words.length; delay = 280; }
      setTimeout(tick, delay);
    })();
  });

  /* ------------------------------------------------------------ Terminal (types when visible) */
  $$("[data-terminal]").forEach(function (el) {
    var lines = DATA.terminal || [];
    function lineHtml(l) {
      return '<div class="term__line term__line--' + l.t + '">' + (l.t === "cmd" ? '<span class="term__prompt">learner@jetson:~$</span> ' : "") + esc(l.s) + "</div>";
    }
    if (reduceMotion) { el.innerHTML = lines.map(lineHtml).join(""); return; }
    var started = false;
    function run() {
      el.innerHTML = "";
      var li = 0;
      (function nextLine() {
        if (li >= lines.length) { setTimeout(run, 4200); return; }
        var l = lines[li++];
        var div = document.createElement("div");
        div.className = "term__line term__line--" + l.t;
        el.appendChild(div);
        if (l.t === "cmd") {
          div.innerHTML = '<span class="term__prompt">learner@jetson:~$</span> <span class="term__typed"></span><span class="term__cursor"></span>';
          var typed = $(".term__typed", div), k = 0;
          (function typeChar() {
            typed.textContent = l.s.slice(0, ++k);
            if (k < l.s.length) setTimeout(typeChar, 28);
            else { $(".term__cursor", div).remove(); setTimeout(nextLine, 450); }
          })();
        } else {
          div.textContent = l.s;
          setTimeout(nextLine, l.t === "data" ? 520 : 380);
        }
      })();
    }
    var io = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting && !started) { started = true; run(); io.disconnect(); }
    }, { threshold: 0.3 });
    io.observe(el);
  });

  /* ------------------------------------------------------------ Neural-network hero canvas */
  $$("canvas[data-neural]").forEach(function (canvas) {
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var nodes = [], pulses = [], W = 0, H = 0, running = false, raf = 0;
    var mouse = { x: -9999, y: -9999 };
    var COLORS = ["#3fd0ff", "#8b5cf6", "#ec4899", "#8dbdff"];

    function resize() {
      var r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.min(110, Math.round(W * H / 15000));
      nodes = [];
      for (var i = 0; i < n; i++) {
        nodes.push({ x: Math.random() * W, y: Math.random() * H * 0.85, vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25, r: 1 + Math.random() * 1.8, c: COLORS[i % COLORS.length] });
      }
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      var max = 150, i, j, a, b, dx, dy, d;
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        if (!reduceMotion) {
          a.x += a.vx; a.y += a.vy;
          if (a.x < 0 || a.x > W) a.vx *= -1;
          if (a.y < 0 || a.y > H) a.vy *= -1;
        }
        for (j = i + 1; j < nodes.length; j++) {
          b = nodes[j]; dx = a.x - b.x; dy = a.y - b.y; d = Math.sqrt(dx * dx + dy * dy);
          if (d < max) {
            ctx.strokeStyle = "rgba(141,189,255," + (0.22 * (1 - d / max)).toFixed(3) + ")";
            ctx.lineWidth = 0.8;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            if (!reduceMotion && Math.random() < 0.0009 && pulses.length < 40) pulses.push({ a: a, b: b, p: 0, c: a.c });
          }
        }
      }
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        dx = a.x - mouse.x; dy = a.y - mouse.y; d = Math.sqrt(dx * dx + dy * dy);
        var glow = d < 160 ? 1 - d / 160 : 0;
        ctx.fillStyle = a.c;
        ctx.globalAlpha = 0.55 + glow * 0.45;
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r + glow * 2.5, 0, Math.PI * 2); ctx.fill();
        if (glow > 0) {
          ctx.strokeStyle = "rgba(63,208,255," + (glow * 0.5).toFixed(3) + ")";
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      pulses = pulses.filter(function (p) {
        p.p += 0.012;
        var x = p.a.x + (p.b.x - p.a.x) * p.p, y = p.a.y + (p.b.y - p.a.y) * p.p;
        ctx.fillStyle = p.c;
        ctx.shadowColor = p.c; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(x, y, 2.2, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        return p.p < 1;
      });
      if (running) raf = requestAnimationFrame(draw);
    }
    function start() { if (!running && !reduceMotion) { running = true; raf = requestAnimationFrame(draw); } }
    function stop() { running = false; cancelAnimationFrame(raf); }
    resize(); draw();
    window.addEventListener("resize", function () { resize(); if (!running) draw(); });
    canvas.parentElement.addEventListener("pointermove", function (e) {
      var r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    canvas.parentElement.addEventListener("pointerleave", function () { mouse.x = mouse.y = -9999; });
    new IntersectionObserver(function (es) { es[0].isIntersecting ? start() : stop(); }).observe(canvas);
    document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
  });

  /* ------------------------------------------------------------ Reveal on scroll + counters */
  function countUp(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    if (reduceMotion) { el.textContent = target; return; }
    var start = null, dur = 1400;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        $$("[data-count]", e.target).concat(e.target.hasAttribute("data-count") ? [e.target] : []).forEach(countUp);
        io.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    $$(".reveal").forEach(function (el) { io.observe(el); });
    var pathIo = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-drawn"); pathIo.unobserve(e.target); } });
    }, { threshold: 0.25 });
    $$(".path").forEach(function (el) { pathIo.observe(el); });
  } else {
    $$(".path").forEach(function (el) { el.classList.add("is-drawn"); });
    $$(".reveal").forEach(function (el) { el.classList.add("is-in"); });
    $$("[data-count]").forEach(countUp);
  }

  /* ------------------------------------------------------------ Parallax on panel backgrounds */
  var bgs = $$(".panel__bg");
  if (bgs.length && !reduceMotion) {
    var ticking = false;
    var update = function () {
      var vh = window.innerHeight;
      bgs.forEach(function (bg) {
        var r = bg.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        bg.style.transform = "translate3d(0," + (((r.top + r.height / 2 - vh / 2) / vh) * -40).toFixed(1) + "px,0)";
      });
      ticking = false;
    };
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  /* ------------------------------------------------------------ Contact form -> opens the visitor's email app */
  $$("form[data-mailto-form]").forEach(function (form) {
    form.setAttribute("novalidate", "");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      $$(".field", form).forEach(function (f) {
        var input = $("input, select, textarea", f);
        var err = $(".field__error", f);
        if (!input) return;
        var msg = null;
        if (input.required && !input.value.trim()) msg = { en: "This field is required.", th: "กรุณากรอกข้อมูลช่องนี้" };
        else if (input.type === "email" && input.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) msg = { en: "Please enter a valid email address.", th: "กรุณากรอกอีเมลให้ถูกต้อง" };
        f.classList.toggle("has-error", !!msg);
        if (err) err.innerHTML = msg ? t(msg) : "";
        if (msg && ok) { input.focus(); ok = false; }
      });
      if (!ok) return;
      var get = function (n) { var x = form.elements[n]; return x ? x.value.trim() : ""; };
      var topicEl = form.elements.topic;
      var topic = topicEl ? topicEl.options[topicEl.selectedIndex].text : "";
      var subject = "[DeepDistrict] " + topic + " – " + get("name");
      var bodyText =
        "Name / ชื่อ: " + get("name") + "\n" +
        "Email / อีเมล: " + get("email") + "\n" +
        "Organisation / หน่วยงาน: " + (get("org") || "-") + "\n" +
        "Topic / เรื่อง: " + topic + "\n\n" + get("message");
      window.location.href = "mailto:" + EMAIL + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(bodyText);
      var success = $(".form-success", form);
      if (success) { success.classList.add("is-visible"); success.focus(); }
    });
  });
})();
