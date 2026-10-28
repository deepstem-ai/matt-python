/* ==========================================================================
   DeepDistrict.si — shared header, menu drawer and footer (bilingual)
   --------------------------------------------------------------------------
   Injected into every page so navigation and legal text are defined once.
   Each page sets <body data-base="">  (root) or  <body data-base="../">  (pages/).
   ========================================================================== */

(function () {
  "use strict";

  var ORG = "DeepDistrict.si";
  var EMAIL = "info@deepdistrict.si";
  var FOUNDED = 2026;

  var NAV = [
    { href: "pages/programs.html", en: "Programs", th: "หลักสูตร" },
    { href: "pages/research.html", en: "Research", th: "วิจัย" },
    { href: "pages/stem.html", en: "Youth STEM", th: "STEM เยาวชน" },
    { href: "pages/partners.html", en: "Partners", th: "พันธมิตร" },
    { href: "pages/about.html", en: "About SI", th: "เกี่ยวกับเรา" }
  ];

  var FOOTER_COLS = [
    { en: "Learn", th: "เรียนรู้", links: [
      { href: "pages/programs.html#path", en: "Learning path", th: "เส้นทางการเรียนรู้" },
      { href: "pages/programs.html#catalog", en: "Course catalogue", th: "รายวิชาทั้งหมด" },
      { href: "pages/programs.html#domains", en: "Domain paths", th: "เส้นทางเฉพาะสาขา" },
      { href: "pages/stem.html", en: "Youth STEM", th: "STEM เยาวชน" }
    ] },
    { en: "Research", th: "วิจัย", links: [
      { href: "pages/research.html#pathway", en: "Research pathway", th: "เส้นทางการทำวิจัย" },
      { href: "pages/research.html#areas", en: "Lab research areas", th: "หัวข้อวิจัยของแล็บ" },
      { href: "pages/research.html#venues", en: "Competitions & publication", th: "การแข่งขันและการตีพิมพ์" },
      { href: "pages/about.html#si", en: "What is SI?", th: "SI คืออะไร" }
    ] },
    { en: "Work with us", th: "ร่วมงานกับเรา", links: [
      { href: "pages/partners.html", en: "Partners", th: "พันธมิตร" },
      { href: "pages/partners.html#models", en: "Engagement models", th: "รูปแบบความร่วมมือ" },
      { href: "pages/about.html#principles", en: "Our principles", th: "หลักการของเรา" },
      { href: "pages/contact.html", en: "Contact", th: "ติดต่อเรา" }
    ] }
  ];

  var TRUST = [
    { en: "Child-safe learning", th: "การเรียนรู้ที่ปลอดภัยสำหรับเด็ก" },
    { en: "Privacy-first (PDPA)", th: "คุ้มครองข้อมูลส่วนบุคคล (PDPA)" },
    { en: "Research ethics", th: "จริยธรรมการวิจัย" },
    { en: "Open science", th: "วิทยาศาสตร์แบบเปิด" },
    { en: "Responsible AI", th: "AI อย่างรับผิดชอบ" }
  ];

  var body = document.body;
  var base = body.getAttribute("data-base") || "";
  var current = body.getAttribute("data-page") || "";

  function bi(item) { return '<span lang="en">' + item.en + '</span><span lang="th">' + item.th + "</span>"; }
  function link(item, cls) {
    var name = item.href.replace("pages/", "").replace(/\.html.*$/, "");
    var aria = name === current && item.href.indexOf("#") === -1 ? ' aria-current="page"' : "";
    return '<a href="' + base + item.href + '"' + aria + (cls ? ' class="' + cls + '"' : "") + ">" + bi(item) + "</a>";
  }
  var arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  var check = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>';
  var langSwitch =
    '<div class="lang-switch" role="group" aria-label="Language / ภาษา">' +
    '<button type="button" data-set-lang="th" aria-pressed="false" lang="th-TH" title="ภาษาไทย">TH</button>' +
    '<button type="button" data-set-lang="en" aria-pressed="false" title="English">EN</button>' +
    "</div>";

  var header =
    '<a class="skip-link" href="#main">' + bi({ en: "Skip to content", th: "ข้ามไปยังเนื้อหา" }) + "</a>" +
    '<header class="site-header" id="site-header">' +
    '  <div class="container">' +
    '    <a class="brand" href="' + base + 'index.html" aria-label="' + ORG + '">' +
    '      <img class="brand__on-dark" src="' + base + 'assets/images/brand/logo-horizontal-white.png" alt="DeepDistrict" width="295" height="36">' +
    '      <img class="brand__on-light" src="' + base + 'assets/images/brand/logo-horizontal.png" alt="" width="295" height="36">' +
    "    </a>" +
    '    <nav class="nav-primary" aria-label="Primary">' + NAV.map(function (n) { return link(n); }).join("") + "</nav>" +
    '    <div class="header-actions">' + langSwitch +
    '      <a class="btn btn--primary btn--sm header-apply" href="' + base + 'pages/contact.html">' + bi({ en: "Contact us", th: "ติดต่อเรา" }) + "</a>" +
    '      <button class="menu-toggle" type="button" aria-controls="nav-drawer" aria-expanded="false" aria-label="Menu"><span></span></button>' +
    "    </div>" +
    "  </div>" +
    "</header>" +
    '<div class="scrim" data-close-menu></div>' +
    '<nav class="nav-drawer" id="nav-drawer" aria-label="Menu" aria-hidden="true">' +
    '  <ul role="list">' +
    "    <li>" + link({ href: "index.html", en: "Home", th: "หน้าแรก" }) + "</li>" +
    NAV.map(function (n) { return "<li>" + link(n) + "</li>"; }).join("") +
    "    <li>" + link({ href: "pages/contact.html", en: "Contact", th: "ติดต่อเรา" }) + "</li>" +
    "  </ul>" +
    '  <div class="drawer-foot">' +
    '    <a class="btn btn--primary" href="mailto:' + EMAIL + '">' + EMAIL + " " + arrow + "</a>" +
    "    " + bi({ en: "STEM · AI · SI learning and research lab<br>Bangkok, Thailand", th: "ห้องปฏิบัติการเรียนรู้และวิจัย STEM · AI · SI<br>กรุงเทพมหานคร ประเทศไทย" }) +
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
    "        <p>" + bi({
      en: "A STEM, AI and SI learning and research lab in Bangkok, Thailand. A small dot on the world, helping people learn, research and build what comes next.",
      th: "ห้องปฏิบัติการด้านการเรียนรู้และการวิจัย STEM, AI และ SI ในกรุงเทพฯ ประเทศไทย จุดเล็ก ๆ บนโลกที่ช่วยให้ผู้คนได้เรียนรู้ วิจัย และสร้างสรรค์อนาคต"
    }) + "</p>" +
    '        <ul class="footer-contact" role="list">' +
    '          <li><img src="' + base + 'assets/images/icons/mail.svg" alt=""><a href="mailto:' + EMAIL + '">' + EMAIL + "</a></li>" +
    '          <li><img src="' + base + 'assets/images/icons/pin.svg" alt="">' + bi({ en: "Bangkok, Thailand", th: "กรุงเทพมหานคร ประเทศไทย" }) + "</li>" +
    "        </ul>" +
    "      </div>" +
    FOOTER_COLS.map(function (col) {
      return '<div class="footer-col"><h3>' + bi(col) + '</h3><ul role="list">' +
        col.links.map(function (l) { return "<li>" + link(l) + "</li>"; }).join("") + "</ul></div>";
    }).join("") +
    "    </div>" +
    '    <div class="trust-strip" aria-label="Commitments">' +
    TRUST.map(function (t) { return '<span class="badge">' + check + bi(t) + "</span>"; }).join("") +
    "    </div>" +
    '    <div class="footer-bottom">' +
    '      <p class="copyright">&copy; ' + years + " " + ORG + ". " + bi({ en: "All rights reserved.", th: "สงวนลิขสิทธิ์" }) + "</p>" +
    '      <nav class="footer-legal" aria-label="Legal">' +
    '        <a href="' + base + 'pages/legal.html#privacy">' + bi({ en: "Privacy", th: "นโยบายความเป็นส่วนตัว" }) + "</a>" +
    '        <a href="' + base + 'pages/legal.html#terms">' + bi({ en: "Terms of use", th: "ข้อกำหนดการใช้งาน" }) + "</a>" +
    '        <a href="' + base + 'pages/legal.html#cookies">' + bi({ en: "Cookies", th: "คุกกี้" }) + "</a>" +
    '        <a href="' + base + 'pages/legal.html#accessibility">' + bi({ en: "Accessibility", th: "การเข้าถึง" }) + "</a>" +
    "      </nav>" +
    '      <p class="footer-trademark">' + bi({
      en: "The DeepDistrict name and logo are trademarks of DeepDistrict.si. Apple, Swift, Xcode, iPad and iPadOS are trademarks of Apple Inc. NVIDIA, Jetson, CUDA and TensorRT are trademarks of NVIDIA Corporation. Raspberry Pi is a trademark of Raspberry Pi Ltd. Arduino is a trademark of Arduino SA. All other trademarks belong to their owners. DeepDistrict is independent and not affiliated with or endorsed by these companies unless stated.",
      th: "ชื่อและโลโก้ DeepDistrict เป็นเครื่องหมายการค้าของ DeepDistrict.si ส่วน Apple, Swift, Xcode, iPad และ iPadOS เป็นเครื่องหมายการค้าของ Apple Inc. NVIDIA, Jetson, CUDA และ TensorRT เป็นเครื่องหมายการค้าของ NVIDIA Corporation, Raspberry Pi เป็นเครื่องหมายการค้าของ Raspberry Pi Ltd. และ Arduino เป็นเครื่องหมายการค้าของ Arduino SA เครื่องหมายการค้าอื่นเป็นของเจ้าของแต่ละราย DeepDistrict เป็นองค์กรอิสระ ไม่ได้มีส่วนเกี่ยวข้องหรือได้รับการรับรองจากบริษัทเหล่านี้ เว้นแต่จะระบุไว้"
    }) + "</p>" +
    "    </div>" +
    "  </div>" +
    "</footer>";

  body.insertAdjacentHTML("afterbegin", header);
  body.insertAdjacentHTML("beforeend", footer);
})();
