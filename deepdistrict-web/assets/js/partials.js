/* ==========================================================================
   DeepDistrict.si — shared header, menu drawer and footer
   --------------------------------------------------------------------------
   Injected into every page so navigation and legal text are defined once.
   Each page sets <body data-base="">  (root) or  <body data-base="../">  (pages/).
   Later, a static-site generator can render these at build time instead.
   ========================================================================== */

(function () {
  "use strict";

  var ORG = "DeepDistrict.si";
  var FOUNDED = 2026;

  var NAV = [
    { href: "pages/research.html", label: "Research" },
    { href: "pages/academy.html", label: "Academy" },
    { href: "pages/innovation.html", label: "Innovation" },
    { href: "pages/mission.html", label: "Mission" },
    { href: "pages/join.html", label: "Join" }
  ];

  var FOOTER_COLS = [
    { title: "Explore", links: [
      { href: "pages/research.html", label: "Research programs" },
      { href: "pages/academy.html", label: "SI Academy" },
      { href: "pages/innovation.html", label: "Innovation District" },
      { href: "pages/mission.html#roadmap", label: "Roadmap" }
    ] },
    { title: "Get involved", links: [
      { href: "pages/join.html#apply", label: "Apply to the Academy" },
      { href: "pages/innovation.html#partners", label: "Partner with us" },
      { href: "pages/research.html#programs", label: "Collaborate on research" },
      { href: "pages/join.html#contact", label: "Contact" }
    ] },
    { title: "Trust", links: [
      { href: "pages/mission.html#principles", label: "Our principles" },
      { href: "pages/mission.html#trust", label: "Responsible SI" },
      { href: "pages/legal.html#privacy", label: "Privacy policy" },
      { href: "pages/legal.html#accessibility", label: "Accessibility" }
    ] }
  ];

  var TRUST = ["Open science", "Privacy-first (GDPR)", "Built for the EU AI Act", "Independent ethics review", "Human oversight"];

  var body = document.body;
  var base = body.getAttribute("data-base") || "";
  var current = body.getAttribute("data-page") || "";

  function link(item, cls) {
    var name = item.href.replace("pages/", "").replace(/\.html.*$/, "");
    var aria = name === current && item.href.indexOf("#") === -1 ? ' aria-current="page"' : "";
    return '<a href="' + base + item.href + '"' + aria + (cls ? ' class="' + cls + '"' : "") + ">" + item.label + "</a>";
  }
  var arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  var check = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>';

  var header =
    '<a class="skip-link" href="#main">Skip to content</a>' +
    '<header class="site-header" id="site-header">' +
    '  <div class="container">' +
    '    <a class="brand" href="' + base + 'index.html" aria-label="' + ORG + ' home">' +
    '      <img class="brand__on-dark" src="' + base + 'assets/images/brand/logo-horizontal-white.png" alt="DeepDistrict" width="295" height="36">' +
    '      <img class="brand__on-light" src="' + base + 'assets/images/brand/logo-horizontal.png" alt="" width="295" height="36">' +
    "    </a>" +
    '    <nav class="nav-primary" aria-label="Primary">' + NAV.map(function (n) { return link(n); }).join("") + "</nav>" +
    '    <div class="header-actions">' +
    '      <a class="btn btn--primary btn--sm header-apply" href="' + base + 'pages/join.html#apply">Apply now</a>' +
    '      <button class="menu-toggle" type="button" aria-controls="nav-drawer" aria-expanded="false" aria-label="Open menu"><span></span></button>' +
    "    </div>" +
    "  </div>" +
    "</header>" +
    '<div class="scrim" data-close-menu></div>' +
    '<nav class="nav-drawer" id="nav-drawer" aria-label="Menu" aria-hidden="true">' +
    '  <ul role="list">' +
    "    <li>" + link({ href: "index.html", label: "Home" }) + "</li>" +
    NAV.map(function (n) { return "<li>" + link(n) + "</li>"; }).join("") +
    "  </ul>" +
    '  <div class="drawer-foot">' +
    '    <a class="btn btn--primary" href="' + base + 'pages/join.html#apply">Apply now ' + arrow + "</a>" +
    "    Research · Innovation · Academy<br>Built in Slovenia, open to the world." +
    "  </div>" +
    "</nav>";

  var year = new Date().getFullYear();
  var years = year > FOUNDED ? FOUNDED + "–" + year : String(FOUNDED);

  var footer =
    '<footer class="site-footer theme-dark">' +
    '  <div class="container">' +
    '    <div class="footer-top">' +
    '      <div class="footer-brand">' +
    '        <img src="' + base + 'assets/images/brand/logo-stacked-white.png" alt="DeepDistrict" width="215" height="92">' +
    "        <p>A research, innovation and academic hub for SI (Super Intelligence). Built in Slovenia, open to the world.</p>" +
    '        <form class="newsletter" data-newsletter aria-label="Newsletter sign-up">' +
    '          <label class="visually-hidden" for="nl-email">Email address</label>' +
    '          <input id="nl-email" type="email" name="email" placeholder="Your email for updates" autocomplete="email" required>' +
    '          <button class="btn btn--primary btn--sm" type="submit">Subscribe</button>' +
    "        </form>" +
    '        <p class="newsletter-note" role="status" aria-live="polite"></p>' +
    "      </div>" +
    FOOTER_COLS.map(function (col) {
      return '<div class="footer-col"><h3>' + col.title + '</h3><ul role="list">' +
        col.links.map(function (l) { return "<li>" + link(l) + "</li>"; }).join("") + "</ul></div>";
    }).join("") +
    "    </div>" +
    '    <div class="trust-strip" aria-label="Our commitments">' +
    TRUST.map(function (t) { return '<span class="badge">' + check + t + "</span>"; }).join("") +
    "    </div>" +
    '    <div class="footer-bottom">' +
    '      <p class="copyright">&copy; ' + years + " " + ORG + ". All rights reserved.</p>" +
    '      <nav class="footer-legal" aria-label="Legal">' +
    '        <a href="' + base + 'pages/legal.html#privacy">Privacy</a>' +
    '        <a href="' + base + 'pages/legal.html#terms">Terms of use</a>' +
    '        <a href="' + base + 'pages/legal.html#cookies">Cookies</a>' +
    '        <a href="' + base + 'pages/legal.html#accessibility">Accessibility</a>' +
    "      </nav>" +
    '      <p class="footer-trademark">The DeepDistrict name and logo are trademarks of ' + ORG + ". Content on this site may not be reproduced without permission, except where an open licence is stated.</p>" +
    "    </div>" +
    "  </div>" +
    "</footer>";

  body.insertAdjacentHTML("afterbegin", header);
  body.insertAdjacentHTML("beforeend", footer);
})();
