/* ==========================================================================
   DeepDistrict.si — motion & effects
   Neural-network hero, typewriter, terminal, word reveals, scroll reveals,
   counters, cursor spotlight, 3D tilt, magnetic buttons, scroll progress,
   parallax. Everything respects prefers-reduced-motion and pauses off-screen.
   ========================================================================== */
(function () {
  "use strict";

  var DATA = window.DD_CONTENT || {};
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  /* ------------------------------------------------------------ Word-by-word reveal for [data-split] headings */
  function splitNode(node, counter) {
    Array.prototype.slice.call(node.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        var parts = n.textContent.split(/(\s+)/);
        var frag = document.createDocumentFragment();
        parts.forEach(function (p) {
          if (!p) return;
          if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
          var w = document.createElement("span"); w.className = "w";
          var i = document.createElement("i"); i.textContent = p; i.style.setProperty("--wi", counter.n++);
          w.appendChild(i); frag.appendChild(w);
        });
        n.parentNode.replaceChild(frag, n);
      } else if (n.nodeType === 1) {
        if (n.hasAttribute("lang")) { var c2 = { n: 0 }; splitNode(n, c2); return; } // each language counts from 0
        if (n.tagName === "BR") return;
        var w = document.createElement("span"); w.className = "w";
        var i = document.createElement("i"); i.style.setProperty("--wi", counter.n++);
        n.parentNode.replaceChild(w, n); i.appendChild(n); w.appendChild(i);
      }
    });
  }
  if (!reduce) $$("[data-split]").forEach(function (el) { splitNode(el, { n: 0 }); el.classList.add("is-split", "reveal"); });

  /* ------------------------------------------------------------ Reveal, counters, drawn lines */
  function countUp(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    if (reduce) { el.textContent = target; return; }
    var start = null;
    (function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / 1400, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    })(performance.now());
  }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        $$("[data-count]", e.target).forEach(countUp);
        if (e.target.hasAttribute("data-count")) countUp(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    $$(".reveal").forEach(function (el) { io.observe(el); });
    var drawIo = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-drawn", "is-in"); drawIo.unobserve(e.target); } });
    }, { threshold: 0.25 });
    $$(".path, .flow, .ladder").forEach(function (el) { drawIo.observe(el); });
  } else {
    $$(".reveal, .path, .flow, .ladder").forEach(function (el) { el.classList.add("is-in", "is-drawn"); });
    $$("[data-count]").forEach(countUp);
  }

  /* ------------------------------------------------------------ Typewriter */
  $$("[data-typewriter]").forEach(function (el) {
    var words = DATA.typewriter || [];
    if (!words.length) return;
    if (reduce) { el.textContent = words[words.length - 1]; return; }
    var w = 0, i = 0, del = false;
    (function tick() {
      var word = words[w];
      i += del ? -1 : 1;
      el.textContent = word.slice(0, i);
      var d = del ? 40 : 85;
      if (!del && i === word.length) { del = true; d = w === words.length - 1 ? 2600 : 1200; }
      else if (del && i === 0) { del = false; w = (w + 1) % words.length; d = 260; }
      setTimeout(tick, d);
    })();
  });

  /* ------------------------------------------------------------ Terminal */
  $$("[data-terminal]").forEach(function (el) {
    var lines = DATA.terminal || [];
    function html(l) { return '<div class="term__line term__line--' + l.t + '">' + (l.t === "cmd" ? '<span class="term__prompt">learner@jetson:~$</span> ' : "") + esc(l.s) + "</div>"; }
    if (reduce) { el.innerHTML = lines.map(html).join(""); return; }
    function run() {
      el.innerHTML = "";
      var li = 0;
      (function next() {
        if (li >= lines.length) { setTimeout(run, 4200); return; }
        var l = lines[li++], div = document.createElement("div");
        div.className = "term__line term__line--" + l.t;
        el.appendChild(div);
        if (l.t === "cmd") {
          div.innerHTML = '<span class="term__prompt">learner@jetson:~$</span> <span class="tt"></span><span class="term__cursor"></span>';
          var tt = $(".tt", div), k = 0;
          (function ch() { tt.textContent = l.s.slice(0, ++k); if (k < l.s.length) setTimeout(ch, 26); else { $(".term__cursor", div).remove(); setTimeout(next, 420); } })();
        } else { div.textContent = l.s; setTimeout(next, l.t === "data" ? 500 : 360); }
      })();
    }
    var tio = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { tio.disconnect(); run(); } }, { threshold: 0.3 });
    tio.observe(el);
  });

  /* ------------------------------------------------------------ Neural-network canvas (hero) */
  $$("canvas[data-neural]").forEach(function (canvas) {
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2), nodes = [], pulses = [], W = 0, H = 0, running = false, raf = 0;
    var mouse = { x: -9999, y: -9999 };
    var COLORS = ["#3ddbd9", "#4f9dff", "#7b7bff", "#ffc24b"];
    function resize() {
      var r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.min(110, Math.round(W * H / 15000));
      nodes = [];
      for (var i = 0; i < n; i++) nodes.push({ x: Math.random() * W, y: Math.random() * H * 0.85, vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25, r: 1 + Math.random() * 1.8, c: COLORS[i % 4] });
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      var max = 150, i, j, a, b, dx, dy, d;
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        if (!reduce) { a.x += a.vx; a.y += a.vy; if (a.x < 0 || a.x > W) a.vx *= -1; if (a.y < 0 || a.y > H) a.vy *= -1; }
        for (j = i + 1; j < nodes.length; j++) {
          b = nodes[j]; dx = a.x - b.x; dy = a.y - b.y; d = Math.sqrt(dx * dx + dy * dy);
          if (d < max) {
            ctx.strokeStyle = "rgba(140,178,255," + (0.22 * (1 - d / max)).toFixed(3) + ")";
            ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            if (!reduce && Math.random() < 0.0009 && pulses.length < 40) pulses.push({ a: a, b: b, p: 0, c: a.c });
          }
        }
      }
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i]; dx = a.x - mouse.x; dy = a.y - mouse.y; d = Math.sqrt(dx * dx + dy * dy);
        var g = d < 170 ? 1 - d / 170 : 0;
        ctx.fillStyle = a.c; ctx.globalAlpha = 0.55 + g * 0.45;
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r + g * 2.6, 0, Math.PI * 2); ctx.fill();
        if (g > 0) { ctx.strokeStyle = "rgba(61,219,217," + (g * 0.5).toFixed(3) + ")"; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke(); }
      }
      ctx.globalAlpha = 1;
      pulses = pulses.filter(function (p) {
        p.p += 0.012;
        var x = p.a.x + (p.b.x - p.a.x) * p.p, y = p.a.y + (p.b.y - p.a.y) * p.p;
        ctx.fillStyle = p.c; ctx.shadowColor = p.c; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(x, y, 2.2, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
        return p.p < 1;
      });
      if (running) raf = requestAnimationFrame(draw);
    }
    function start() { if (!running && !reduce) { running = true; raf = requestAnimationFrame(draw); } }
    function stop() { running = false; cancelAnimationFrame(raf); }
    resize(); draw();
    window.addEventListener("resize", function () { resize(); if (!running) draw(); });
    canvas.parentElement.addEventListener("pointermove", function (e) { var r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
    canvas.parentElement.addEventListener("pointerleave", function () { mouse.x = mouse.y = -9999; });
    new IntersectionObserver(function (es) { es[0].isIntersecting ? start() : stop(); }).observe(canvas);
    document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
  });

  /* ------------------------------------------------------------ Pointer effects (desktop only) */
  if (finePointer && !reduce) {
    // cursor spotlight on cards and the footer CTA
    document.addEventListener("pointermove", function (e) {
      var el = e.target.closest && e.target.closest(".card, [data-glow]");
      if (!el) return;
      var r = el.getBoundingClientRect();
      el.style.setProperty("--mx", (e.clientX - r.left) + "px");
      el.style.setProperty("--my", (e.clientY - r.top) + "px");
    }, { passive: true });

    // gentle 3D tilt
    $$("[data-tilt]").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = "perspective(900px) rotateX(" + (-y * 6).toFixed(2) + "deg) rotateY(" + (x * 6).toFixed(2) + "deg) translateY(-4px)";
      });
      el.addEventListener("pointerleave", function () { el.style.transform = ""; });
    });

    // magnetic buttons
    document.addEventListener("pointermove", function (e) {
      var el = e.target.closest && e.target.closest("[data-magnetic]");
      $$("[data-magnetic].is-mag").forEach(function (m) { if (m !== el) { m.style.transform = ""; m.classList.remove("is-mag"); } });
      if (!el) return;
      var r = el.getBoundingClientRect();
      el.classList.add("is-mag");
      el.style.transform = "translate(" + ((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1) + "px," + ((e.clientY - r.top - r.height / 2) * 0.28).toFixed(1) + "px)";
    }, { passive: true });
  }

  /* ------------------------------------------------------------ Scroll progress + parallax */
  var bar = $(".scroll-progress"), bgs = $$(".panel__bg"), ticking = false;
  function onScroll() {
    var h = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.setProperty("--progress", h > 0 ? (scrollY / h).toFixed(4) : 0);
    if (!reduce) bgs.forEach(function (bg) {
      var r = bg.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      bg.style.transform = "translate3d(0," + (((r.top + r.height / 2 - innerHeight / 2) / innerHeight) * -40).toFixed(1) + "px,0)";
    });
    ticking = false;
  }
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();
})();
