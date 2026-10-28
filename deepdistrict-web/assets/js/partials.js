/* ==========================================================================
   DeepDistrict.si — shared header, menu drawer and footer
   --------------------------------------------------------------------------
   Injected into every page so navigation is defined once. Each page sets
   <body data-base="">  (root) or  <body data-base="../">  (pages/).
   Later, a static-site generator can render these at build time instead.
   ========================================================================== */

(function () {
  "use strict";

  var NAV = [
    { href: "pages/research.html", label: "Research" },
    { href: "pages/academy.html", label: "Academy" },
    { href: "pages/innovation.html", label: "Innovation" },
    { href: "pages/mission.html", label: "Mission" },
    { href: "pages/join.html", label: "Join" }
  ];

  var body = document.body;
  var base = body.getAttribute("data-base") || "";
  var current = body.getAttribute("data-page") || "";

  function link(item, cls) {
    var name = item.href.replace("pages/", "").replace(".html", "");
    var aria = name === current ? ' aria-current="page"' : "";
    return '<a href="' + base + item.href + '"' + aria + (cls ? ' class="' + cls + '"' : "") + ">" + item.label + "</a>";
  }

  var header =
    '<a class="skip-link" href="#main">Skip to content</a>' +
    '<header class="site-header" id="site-header">' +
    '  <div class="container">' +
    '    <a class="brand" href="' + base + 'index.html" aria-label="DeepDistrict.si home">' +
    '      <img src="' + base + 'assets/images/brand/logo-mark.svg" alt="" width="34" height="32">' +
    "      <span class=\"brand__name\">DEEPDISTRICT<b>.SI</b></span>" +
    "    </a>" +
    '    <nav class="nav-primary" aria-label="Primary">' + NAV.map(function (n) { return link(n); }).join("") + "</nav>" +
    '    <div class="header-actions">' +
    '      <a class="btn btn--sm btn--accent header-apply" href="' + base + 'pages/join.html#apply">Apply</a>' +
    '      <button class="menu-toggle" type="button" aria-controls="nav-drawer" aria-expanded="false" aria-label="Open menu"><span></span></button>' +
    "    </div>" +
    "  </div>" +
    "</header>" +
    '<div class="scrim" data-close-menu></div>' +
    '<nav class="nav-drawer" id="nav-drawer" aria-label="Menu" aria-hidden="true">' +
    '  <ul role="list">' +
    "    <li>" + link({ href: "index.html", label: "Home" }) + "</li>" +
    NAV.map(function (n) { return "<li>" + link(n) + "</li>"; }).join("") +
    "    <li>" + link({ href: "pages/research.html#programs", label: "Programs" }) + "</li>" +
    "    <li>" + link({ href: "pages/mission.html#roadmap", label: "Roadmap" }) + "</li>" +
    "  </ul>" +
    '  <p class="drawer-note">Research · Innovation · Academy<br>Slovenia, EU</p>' +
    "</nav>";

  var year = new Date().getFullYear();
  var footer =
    '<footer class="site-footer">' +
    '  <div class="container">' +
    "    <span>DeepDistrict.si &copy; " + year + "</span>" +
    '    <nav aria-label="Footer">' +
    NAV.map(function (n) { return link(n); }).join("") +
    '      <a href="' + base + 'pages/join.html#contact">Contact</a>' +
    '      <a href="' + base + 'pages/mission.html#principles">Principles</a>' +
    "    </nav>" +
    "  </div>" +
    "</footer>";

  body.insertAdjacentHTML("afterbegin", header);
  body.insertAdjacentHTML("beforeend", footer);
})();
