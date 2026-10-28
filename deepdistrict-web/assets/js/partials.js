/* ==========================================================================
   DeepDistrict.si — shared header, menu drawer and footer (bilingual)
   Each page sets <body data-base="">  (root) or  <body data-base="../">.
   ========================================================================== */
(function () {
  "use strict";

  var ORG = "DeepDistrict.si";
  var EMAIL = "info@deepdistrict.si";
  var FOUNDED = 2026;

  var NAV = [
    { href: "pages/si.html", en: "What is SI?", th: "SI คืออะไร", cls: "nav-si" },
    { href: "pages/programs.html", en: "Programs", th: "หลักสูตร" },
    { href: "pages/innovation.html", en: "Innovation Lab", th: "แล็บนวัตกรรม" },
    { href: "pages/research.html", en: "Research", th: "วิจัย" },
    { href: "pages/stem.html", en: "Youth STEM", th: "STEM เยาวชน" },
    { href: "pages/partners.html", en: "Partners", th: "พันธมิตร" },
    { href: "pages/about.html", en: "About", th: "เกี่ยวกับเรา" }
  ];

  var COLS = [
    { en: "Learn", th: "เรียนรู้", links: [
      { href: "pages/programs.html#planner", en: "Plan my path", th: "ออกแบบเส้นทางเรียน" },
      { href: "pages/programs.html#catalog", en: "All courses", th: "รายวิชาทั้งหมด" },
      { href: "pages/programs.html#exams", en: "COMPAS & HKICO prep", th: "เตรียมสอบ COMPAS · HKICO" },
      { href: "pages/stem.html", en: "Youth STEM", th: "STEM เยาวชน" }
    ] },
    { en: "SI & research", th: "SI และวิจัย", links: [
      { href: "pages/si.html", en: "What is SI?", th: "SI คืออะไร" },
      { href: "pages/innovation.html", en: "Innovation Lab", th: "แล็บนวัตกรรม" },
      { href: "pages/research.html#pathway", en: "Research pathway", th: "เส้นทางวิจัย" },
      { href: "pages/research.html#venues", en: "Publish & compete", th: "ตีพิมพ์และแข่งขัน" }
    ] },
    { en: "Organisation", th: "องค์กร", links: [
      { href: "pages/about.html", en: "About us", th: "เกี่ยวกับเรา" },
      { href: "pages/partners.html", en: "Partners", th: "พันธมิตร" },
      { href: "pages/contact.html", en: "Contact", th: "ติดต่อเรา" },
      { href: "pages/legal.html#privacy", en: "Privacy (PDPA)", th: "ความเป็นส่วนตัว (PDPA)" }
    ] }
  ];

  var body = document.body;
  var base = body.getAttribute("data-base") || "";
  var current = body.getAttribute("data-page") || "";

  function bi(en, th) { return '<span lang="en">' + en + '</span><span lang="th">' + th + "</span>"; }
  function link(item, cls) {
    var name = item.href.replace("pages/", "").replace(/\.html.*$/, "");
    var aria = name === current && item.href.indexOf("#") === -1 ? ' aria-current="page"' : "";
    var c = [cls, item.cls].filter(Boolean).join(" ");
    return '<a href="' + base + item.href + '"' + aria + (c ? ' class="' + c + '"' : "") + ">" + bi(item.en, item.th) + "</a>";
  }
  function ico(name) { return '<img src="' + base + "assets/images/icons/" + name + '.svg" alt="">'; }
  var ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  var SUN = '<svg class="i-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  var MOON = '<svg class="i-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>';
  var AUTO = '<svg class="i-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/></svg>';

  var header =
    '<a class="skip-link" href="#main">' + bi("Skip to content", "ข้ามไปยังเนื้อหา") + "</a>" +
    '<div class="scroll-progress" aria-hidden="true"></div>' +
    '<header class="site-header" id="site-header">' +
    '  <div class="container">' +
    '    <a class="brand" href="' + base + 'index.html" aria-label="' + ORG + '">' +
    '      <img class="brand__on-dark" src="' + base + 'assets/images/brand/logo-horizontal-white.png" alt="DeepDistrict" width="295" height="36">' +
    '      <img class="brand__on-light" src="' + base + 'assets/images/brand/logo-horizontal.png" alt="" width="295" height="36">' +
    "    </a>" +
    '    <nav class="nav-primary" aria-label="Primary">' + NAV.map(function (n) { return link(n); }).join("") + "</nav>" +
    '    <div class="header-actions">' +
    '      <button class="icon-btn theme-toggle" type="button" data-theme-toggle aria-label="Light / dark" title="Light / dark">' + SUN + MOON + "</button>" +
    '      <div class="lang-switch" role="group" aria-label="Language / ภาษา">' +
    '        <button type="button" data-set-lang="th" aria-pressed="false" title="ภาษาไทย">TH</button>' +
    '        <button type="button" data-set-lang="en" aria-pressed="false" title="English">EN</button>' +
    "      </div>" +
    '      <a class="btn btn--primary btn--sm header-cta" data-magnetic href="' + base + 'pages/contact.html">' + bi("Ask about a course", "สอบถามหลักสูตร") + "</a>" +
    '      <button class="icon-btn menu-toggle" type="button" aria-controls="nav-drawer" aria-expanded="false" aria-label="Menu"><span></span></button>' +
    "    </div>" +
    "  </div>" +
    "</header>" +
    '<div class="scrim" data-close-menu></div>' +
    '<nav class="nav-drawer" id="nav-drawer" aria-label="Menu" aria-hidden="true">' +
    '  <ul role="list"><li>' + link({ href: "index.html", en: "Home", th: "หน้าแรก" }) + "</li>" +
    NAV.map(function (n) { return "<li>" + link(n) + "</li>"; }).join("") +
    "<li>" + link({ href: "pages/contact.html", en: "Contact", th: "ติดต่อเรา" }) + "</li></ul>" +
    '  <div class="drawer-foot"><a class="btn btn--primary" href="mailto:' + EMAIL + '">' + EMAIL + " " + ARROW + "</a>" +
    bi("Super Intelligence learning & research lab<br>Bangkok, Thailand", "ห้องปฏิบัติการเรียนรู้และวิจัย Super Intelligence<br>กรุงเทพมหานคร ประเทศไทย") + "</div>" +
    "</nav>";

  var year = new Date().getFullYear();
  var years = year > FOUNDED ? FOUNDED + "–" + year : String(FOUNDED);

  var VERSION = (window.DD_PREFS && window.DD_PREFS.SITE_VERSION) || "";
  function row(icon, html) { return '<li>' + ico(icon) + "<span>" + html + "</span></li>"; }
  function themeBtn(v, svg, en, th) { return '<button type="button" data-theme-set="' + v + '" aria-pressed="false" title="' + en + " / " + th + '">' + svg + '<span class="visually-hidden">' + bi(en, th) + "</span></button>"; }

  var footer =
    '<footer class="site-footer">' +
    '  <div class="container">' +
    '    <div class="footer-cta">' +
    "      <div><h2>" + bi("Start with a free 30-minute consultation", "เริ่มจากปรึกษาฟรี 30 นาที") + "</h2>" +
    "      <p>" + bi("Tell us your goal. We shape the course around you — Zoom, onsite or hybrid.", "บอกเป้าหมายของคุณ แล้วเราออกแบบหลักสูตรให้ เรียนผ่าน Zoom ที่แล็บ หรือไฮบริด") + "</p></div>" +
    '      <a class="btn btn--primary" data-magnetic href="' + base + 'pages/contact.html">' + bi("Ask about a course", "สอบถามหลักสูตร") + ARROW + "</a>" +
    "    </div>" +
    '    <div class="footer-main">' +
    '      <div class="footer-brand">' +
    '        <img class="on-light" src="' + base + 'assets/images/brand/logo-horizontal.png" alt="DeepDistrict" width="295" height="36">' +
    '        <img class="on-dark" src="' + base + 'assets/images/brand/logo-horizontal-white.png" alt="DeepDistrict" width="295" height="36">' +
    "        <p>" + bi("Learning & research lab for STEM, AI and Super Intelligence. Bangkok, Thailand.", "แล็บการเรียนรู้และวิจัยด้าน STEM, AI และ Super Intelligence กรุงเทพฯ") + "</p>" +
    '        <ul class="footer-contact" role="list">' +
    row("mail", '<a href="mailto:' + EMAIL + '">' + EMAIL + "</a>") +
    row("pin", bi("Bangkok, Thailand", "กรุงเทพมหานคร ประเทศไทย")) +
    row("video", bi("Zoom · Onsite · Hybrid", "Zoom · ที่แล็บ · ไฮบริด")) +
    "        </ul>" +
    "      </div>" +
    '      <nav class="footer-cols" aria-label="Footer">' +
    COLS.map(function (col) {
      return '<div class="footer-col"><h3>' + bi(col.en, col.th) + '</h3><ul role="list">' +
        col.links.map(function (l) { return "<li>" + link(l) + "</li>"; }).join("") + "</ul></div>";
    }).join("") +
    "      </nav>" +
    "    </div>" +
    '    <div class="footer-bottom">' +
    '      <p class="footer-copy">&copy; ' + years + " " + ORG + (VERSION ? ' <span class="footer-ver">v' + VERSION + "</span>" : "") + "</p>" +
    '      <div class="footer-legal">' +
    '        <a href="' + base + 'pages/legal.html#privacy">' + bi("Privacy", "ความเป็นส่วนตัว") + "</a>" +
    '        <button type="button" data-open-consent>' + bi("Cookies", "คุกกี้") + "</button>" +
    '        <a href="' + base + 'pages/legal.html#terms">' + bi("Terms", "ข้อกำหนด") + "</a>" +
    "      </div>" +
    '      <div class="footer-tools">' +
    '        <div class="theme-seg" role="group" aria-label="Theme / ธีม">' +
    themeBtn("auto", AUTO, "System", "ตามระบบ") + themeBtn("light", SUN, "Light", "สว่าง") + themeBtn("dark", MOON, "Dark", "มืด") +
    "        </div>" +
    '        <button type="button" class="icon-btn to-top" data-to-top aria-label="Back to top"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg></button>' +
    "      </div>" +
    "    </div>" +
    '    <details class="footer-tm"><summary>' + bi("Trademarks & independence notice", "เครื่องหมายการค้าและความเป็นอิสระ") + "</summary><p>" + bi(
      "DeepDistrict and its logo are trademarks of DeepDistrict.si. Product and organisation names on this site — including Apple, Swift, Swift Playgrounds, Xcode, iPhone, iPad, Mac; NVIDIA, Jetson, CUDA, TensorRT, DeepStream, Isaac, NIM, NeMo; Raspberry Pi; Arduino; Claude and Claude Code (Anthropic); Codex and ChatGPT (OpenAI); Cursor (Anysphere); GitHub and GitHub Copilot (GitHub/Microsoft); Git; React (Meta); Next.js (Vercel); Zoom; COMPAS (Chulalongkorn University); HKICO — belong to their owners and are used only to describe course content. DeepDistrict is independent and is not affiliated with, sponsored or endorsed by any of them.",
      "DeepDistrict และโลโก้เป็นเครื่องหมายการค้าของ DeepDistrict.si ชื่อผลิตภัณฑ์และองค์กรบนเว็บไซต์นี้ เช่น Apple, Swift, Swift Playgrounds, Xcode, iPhone, iPad, Mac; NVIDIA, Jetson, CUDA, TensorRT, DeepStream, Isaac, NIM, NeMo; Raspberry Pi; Arduino; Claude และ Claude Code (Anthropic); Codex และ ChatGPT (OpenAI); Cursor (Anysphere); GitHub และ GitHub Copilot (GitHub/Microsoft); Git; React (Meta); Next.js (Vercel); Zoom; COMPAS (จุฬาลงกรณ์มหาวิทยาลัย); HKICO เป็นของเจ้าของแต่ละราย ใช้เพื่ออธิบายเนื้อหาหลักสูตรเท่านั้น DeepDistrict เป็นองค์กรอิสระ ไม่มีส่วนเกี่ยวข้อง ไม่ได้รับการสนับสนุนหรือรับรองจากองค์กรเหล่านี้"
    ) + "</p></details>" +
    "  </div>" +
    "</footer>";

  body.insertAdjacentHTML("afterbegin", header);
  body.insertAdjacentHTML("beforeend", footer);
})();
