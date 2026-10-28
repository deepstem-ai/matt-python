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
      { href: "pages/programs.html#planner", en: "Build your plan", th: "ออกแบบแผนการเรียน" },
      { href: "pages/programs.html#catalog", en: "All courses", th: "รายวิชาทั้งหมด" },
      { href: "pages/programs.html#modes", en: "Zoom · Onsite · Hybrid", th: "Zoom · ที่แล็บ · ไฮบริด" },
      { href: "pages/stem.html", en: "Youth STEM", th: "STEM เยาวชน" }
    ] },
    { en: "SI & research", th: "SI และงานวิจัย", links: [
      { href: "pages/si.html", en: "What is SI?", th: "SI คืออะไร" },
      { href: "pages/innovation.html", en: "Innovation Lab", th: "แล็บนวัตกรรม" },
      { href: "pages/research.html#pathway", en: "Research pathway", th: "เส้นทางการทำวิจัย" },
      { href: "pages/research.html#venues", en: "Publish & compete", th: "ตีพิมพ์และแข่งขัน" }
    ] },
    { en: "Work with us", th: "ร่วมงานกับเรา", links: [
      { href: "pages/partners.html", en: "Partners", th: "พันธมิตร" },
      { href: "pages/about.html", en: "About us", th: "เกี่ยวกับเรา" },
      { href: "pages/about.html#principles", en: "Principles", th: "หลักการ" },
      { href: "pages/contact.html", en: "Contact", th: "ติดต่อเรา" }
    ] },
    { en: "Legal", th: "กฎหมาย", links: [
      { href: "pages/legal.html#privacy", en: "Privacy (PDPA)", th: "ความเป็นส่วนตัว (PDPA)" },
      { href: "pages/legal.html#cookies", en: "Cookie policy", th: "นโยบายคุกกี้" },
      { href: "pages/legal.html#terms", en: "Terms of use", th: "ข้อกำหนดการใช้งาน" },
      { href: "pages/legal.html#accessibility", en: "Accessibility", th: "การเข้าถึง" }
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
    '      <button class="icon-btn theme-toggle" type="button" data-theme-toggle aria-label="Theme: auto / light / dark" title="Theme">' + SUN + MOON + AUTO + "</button>" +
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

  var footer =
    '<footer class="site-footer">' +
    '  <div class="container">' +
    '    <div class="footer-cta" data-glow>' +
    "      <div><h2>" + bi("Ready to go beyond AI?", "พร้อมก้าวไปไกลกว่า AI หรือยัง?") + "</h2>" +
    "      <p>" + bi("Tell us your goals. We will design a course around you, live on Zoom, onsite in Bangkok or hybrid.", "บอกเป้าหมายของคุณ แล้วเราจะออกแบบหลักสูตรให้เหมาะกับคุณ ทั้งเรียนสดผ่าน Zoom ที่แล็บในกรุงเทพฯ หรือแบบไฮบริด") + "</p></div>" +
    '      <div class="btn-row"><a class="btn btn--light" data-magnetic href="' + base + 'pages/contact.html">' + bi("Ask about a course", "สอบถามหลักสูตร") + ARROW + "</a>" +
    '      <a class="btn" style="color:#fff;border-color:rgba(255,255,255,.55);background:rgba(10,12,40,.18)" href="mailto:' + EMAIL + '">' + EMAIL + "</a></div>" +
    "    </div>" +
    '    <div class="footer-main">' +
    '      <div class="footer-brand">' +
    '        <img class="on-light" src="' + base + 'assets/images/brand/logo-stacked.png" alt="DeepDistrict" width="182" height="78">' +
    '        <img class="on-dark" src="' + base + 'assets/images/brand/logo-stacked-white.png" alt="DeepDistrict" width="182" height="78">' +
    "        <p>" + bi("A Super Intelligence learning and research lab in Bangkok. A small dot on the world, helping people learn, research and build what comes after AI.",
                       "ห้องปฏิบัติการเรียนรู้และวิจัย Super Intelligence ในกรุงเทพฯ จุดเล็ก ๆ บนโลกที่ช่วยให้ผู้คนได้เรียนรู้ วิจัย และสร้างสิ่งที่ก้าวไปไกลกว่า AI") + "</p>" +
    '        <div class="footer-chips">' +
    '          <a class="footer-chip" href="mailto:' + EMAIL + '">' + ico("mail") + EMAIL + "</a>" +
    '          <span class="footer-chip">' + ico("pin") + bi("Bangkok, Thailand", "กรุงเทพฯ ประเทศไทย") + "</span>" +
    '          <span class="footer-chip">' + ico("video") + bi("Zoom · Onsite · Hybrid", "Zoom · ที่แล็บ · ไฮบริด") + "</span>" +
    "        </div>" +
    "      </div>" +
    COLS.map(function (col) {
      return '<div class="footer-col"><h3>' + bi(col.en, col.th) + '</h3><ul role="list">' +
        col.links.map(function (l) { return "<li>" + link(l) + "</li>"; }).join("") + "</ul></div>";
    }).join("") +
    "    </div>" +
    '    <p class="footer-wordmark" aria-hidden="true">DEEPDISTRICT.SI</p>' +
    '    <div class="footer-bottom">' +
    "      <p>&copy; " + years + " " + ORG + " · " + bi("All rights reserved.", "สงวนลิขสิทธิ์") + "</p>" +
    '      <div class="footer-legal">' +
    '        <a href="' + base + 'pages/legal.html#privacy">' + bi("Privacy", "ความเป็นส่วนตัว") + "</a>" +
    '        <button type="button" data-open-consent>' + bi("Cookie settings", "ตั้งค่าคุกกี้") + "</button>" +
    '        <a href="' + base + 'pages/legal.html#terms">' + bi("Terms", "ข้อกำหนด") + "</a>" +
    '        <button type="button" class="icon-btn to-top" data-to-top aria-label="Back to top"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg></button>' +
    "      </div>" +
    "    </div>" +
    '    <p class="footer-tm">' + bi(
      "The DeepDistrict name and logo are trademarks of DeepDistrict.si. Apple, Swift, Xcode, iPhone, iPad and iPadOS are trademarks of Apple Inc. NVIDIA, Jetson, CUDA and TensorRT are trademarks of NVIDIA Corporation. Raspberry Pi is a trademark of Raspberry Pi Ltd. Arduino is a trademark of Arduino SA. Zoom is a trademark of Zoom Communications, Inc. Other trademarks belong to their owners. DeepDistrict is independent and not affiliated with or endorsed by these companies unless stated.",
      "ชื่อและโลโก้ DeepDistrict เป็นเครื่องหมายการค้าของ DeepDistrict.si ส่วน Apple, Swift, Xcode, iPhone, iPad และ iPadOS เป็นเครื่องหมายการค้าของ Apple Inc. NVIDIA, Jetson, CUDA และ TensorRT เป็นเครื่องหมายการค้าของ NVIDIA Corporation, Raspberry Pi เป็นเครื่องหมายการค้าของ Raspberry Pi Ltd., Arduino เป็นเครื่องหมายการค้าของ Arduino SA และ Zoom เป็นเครื่องหมายการค้าของ Zoom Communications, Inc. เครื่องหมายการค้าอื่นเป็นของเจ้าของแต่ละราย DeepDistrict เป็นองค์กรอิสระ ไม่ได้มีส่วนเกี่ยวข้องหรือได้รับการรับรองจากบริษัทเหล่านี้ เว้นแต่จะระบุไว้"
    ) + "</p>" +
    "  </div>" +
    "</footer>";

  body.insertAdjacentHTML("afterbegin", header);
  body.insertAdjacentHTML("beforeend", footer);
})();
