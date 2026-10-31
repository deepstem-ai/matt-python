/* ==========================================================================
   DeepDistrict.si — consent management (Thailand PDPA)
   --------------------------------------------------------------------------
   • Shows a consent banner until the visitor chooses, and again when the
     policy version changes or the choice is older than 12 months.
   • Asked at the start of EVERY visit (first page of each browser session,
     whichever page it is), showing the current choice to keep or change.
   • Full-width bar: Cookie Settings · Reject All · Accept All. Reject and
     Accept are equally prominent; nothing is pre-selected; no cookie wall.
   • Each choice is also logged on the server without personal data
     (random reference, time, policy version, choices) as proof of consent.
   • Categories: necessary (always on), preferences, analytics, marketing.
   • Records the choice with a timestamp, policy version and random ID.
   • DD.store saves preferences to localStorage only with consent;
     otherwise to sessionStorage (cleared when the tab closes).
   • Optional scripts must be written as
       <script type="text/plain" data-consent="analytics" data-src="…"></script>
     and are only activated after the visitor allows that category.
   ========================================================================== */
(function () {
  "use strict";

  var P = window.DD_PREFS || { CONSENT_KEY: "dd-consent", CONSENT_VERSION: 5 };
  var ASKED_KEY = "dd-consent-asked";   // sessionStorage: already answered on this visit
  var YEAR = 365 * 24 * 60 * 60 * 1000;
  var CATS = ["necessary", "preferences", "analytics", "marketing"];
  var PREF_KEYS = ["dd-lang", "dd-theme"];
  var base = document.body.getAttribute("data-base") || "";
  var listeners = [];

  function bi(en, th) { return '<span lang="en">' + en + '</span><span lang="th">' + th + "</span>"; }
  function ls(op, k, v) { try { return op === "get" ? localStorage.getItem(k) : op === "set" ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch (e) { return null; } }
  function ss(op, k, v) { try { return op === "get" ? sessionStorage.getItem(k) : op === "set" ? sessionStorage.setItem(k, v) : sessionStorage.removeItem(k); } catch (e) { return null; } }

  function read() {
    var c = null;
    try { c = JSON.parse(ls("get", P.CONSENT_KEY) || "null"); } catch (e) { c = null; }
    if (!c || c.v !== P.CONSENT_VERSION || !(c.expires > Date.now())) return null;
    return c;
  }
  var record = read();

  function has(cat) { return cat === "necessary" || !!(record && record.choices && record.choices[cat]); }

  function save(choices) {
    choices.necessary = true;
    var now = Date.now();
    record = {
      v: P.CONSENT_VERSION,
      id: (record && record.id) || Math.random().toString(36).slice(2, 10) + now.toString(36),
      at: new Date(now).toISOString(),
      expires: now + YEAR,
      choices: choices
    };
    ls("set", P.CONSENT_KEY, JSON.stringify(record));
    // move preferences to the store the visitor allowed
    PREF_KEYS.forEach(function (k) {
      var v = ls("get", k) || ss("get", k);
      if (choices.preferences) { if (v != null) ls("set", k, v); ss("remove", k); }
      else { if (v != null) ss("set", k, v); ls("remove", k); }
    });
    ss("set", ASKED_KEY, "1");
    logChoice(record);
    activateScripts();
    hideBanner();
    listeners.forEach(function (fn) { fn(record); });
    renderMeta();
  }

  // proof of consent (PDPA s.19): anonymous record on our server; ignored when offline / opened as a file
  function logChoice(r) {
    if (!/^https?:$/.test(location.protocol) || !window.fetch) return;
    try {
      fetch(base + "api/consent", { method: "POST", keepalive: true, credentials: "omit",
        headers: { "Content-Type": "application/json", "X-DD": "1" },
        body: JSON.stringify({ id: r.id, at: r.at, v: r.v, choices: r.choices, page: location.pathname.slice(-60) }) }).catch(function () {});
    } catch (e) { /* never block the visitor */ }
  }

  /* Storage that respects consent */
  var store = {
    get: function (k) { return has("preferences") ? ls("get", k) : ss("get", k); },
    set: function (k, v) { if (has("preferences")) ls("set", k, v); else ss("set", k, v); }
  };

  function activateScripts() {
    Array.prototype.forEach.call(document.querySelectorAll('script[type="text/plain"][data-consent]'), function (s) {
      if (!has(s.getAttribute("data-consent")) || s.hasAttribute("data-activated")) return;
      var n = document.createElement("script");
      if (s.getAttribute("data-src")) n.src = s.getAttribute("data-src"); else n.textContent = s.textContent;
      s.setAttribute("data-activated", "");
      s.parentNode.insertBefore(n, s.nextSibling);
    });
  }

  /* ------------------------------------------------------------ Banner: one friendly sentence, two equal buttons */
  var banner = document.createElement("section");
  banner.className = "consent-banner";
  banner.setAttribute("role", "region");
  banner.setAttribute("aria-label", "Privacy");
  banner.hidden = true;
  function renderBanner() {
    var remembered = record && record.choices && record.choices.preferences;
    var policy = '<a class="consent-link" href="' + base + 'pages/legal.html#cookies">' + bi("Cookie policy", "นโยบายคุกกี้") + "</a>";
    var text = bi(
      "We use cookies and similar storage on this website to keep it working and, if you allow it, to remember your language and theme. We do not use advertising or tracking cookies. Click \u201cAccept All\u201d to allow all, \u201cReject All\u201d to use only the essential ones, or \u201cCookie Settings\u201d to choose. You can change your choice at any time from \u201cCookies\u201d at the bottom of every page.",
      "เว็บไซต์นี้ใช้คุกกี้และการจัดเก็บข้อมูลลักษณะเดียวกัน เพื่อให้เว็บไซต์ทำงานได้ และหากคุณอนุญาต จะจดจำภาษาและธีมที่คุณเลือก เราไม่ใช้คุกกี้เพื่อการโฆษณาหรือการติดตาม กด \u201cยอมรับทั้งหมด\u201d เพื่ออนุญาตทั้งหมด \u201cปฏิเสธทั้งหมด\u201d เพื่อใช้เฉพาะคุกกี้ที่จำเป็น หรือ \u201cตั้งค่าคุกกี้\u201d เพื่อเลือกเอง คุณเปลี่ยนตัวเลือกได้ทุกเมื่อจากลิงก์ \u201cคุกกี้\u201d ด้านล่างของทุกหน้า") + " " + policy +
      (record ? '<span class="consent-current">' + bi("Your current choice: " + (remembered ? "all accepted" : "essential only") + ".", "ตัวเลือกปัจจุบันของคุณ: " + (remembered ? "ยอมรับทั้งหมด" : "เฉพาะที่จำเป็น")) + "</span>" : "");
    function btn(act, en, th, cls) { return '<button type="button" class="btn btn--sm ' + cls + '" data-consent-act="' + act + '">' + bi(en, th) + "</button>"; }
    banner.innerHTML = '<p class="consent-text">' + text + "</p>" +
      '<div class="consent-actions">' +
      btn("settings", "Cookie Settings", "ตั้งค่าคุกกี้", "consent-settings") +
      btn("reject", "Reject All", "ปฏิเสธทั้งหมด", "consent-choice") +
      btn("accept", "Accept All", "ยอมรับทั้งหมด", "consent-choice") +
      "</div>";
  }
  renderBanner();

  /* ------------------------------------------------------------ Settings dialog: only what is actually used */
  var dlg = document.createElement("dialog");
  dlg.className = "dialog dialog--consent";
  dlg.setAttribute("aria-labelledby", "consent-title");
  function cat(id, en, th, den, dth, locked) {
    return '<div class="consent-cat"><div><h3>' + bi(en, th) + "</h3><p>" + bi(den, dth) + "</p></div>" +
      '<label class="switch"><input type="checkbox" data-cat="' + id + '"' + (locked ? " checked disabled" : "") + ' aria-label="' + en + '"><span></span></label></div>';
  }
  // analytics / marketing switches appear only once such scripts exist on the page
  var gated = {};
  Array.prototype.forEach.call(document.querySelectorAll('script[type="text/plain"][data-consent]'), function (s) { gated[s.getAttribute("data-consent")] = true; });
  dlg.innerHTML =
    '<div class="dialog__head"><h2 id="consent-title">' + bi("Privacy settings", "ตั้งค่าความเป็นส่วนตัว") + "</h2>" +
    "<p>" + bi("We keep this simple: nothing is shared with advertisers, and you can change your mind any time from the footer.", "เราทำให้เรียบง่าย: ไม่มีการส่งข้อมูลให้ผู้โฆษณา และเปลี่ยนใจได้ทุกเมื่อจากส่วนท้ายของเว็บไซต์") + "</p>" +
    '<button type="button" class="icon-btn dialog__close" data-consent-act="close" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>' +
    '<div class="dialog__body">' +
    cat("necessary", "Essential", "จำเป็น", "Keeps the website working and remembers this choice (and that you answered on this visit). Always on.", "ให้เว็บไซต์ทำงานได้ และจดจำตัวเลือกนี้ (รวมถึงว่าคุณตอบแล้วในการเข้าชมครั้งนี้) เปิดเสมอ", true) +
    cat("preferences", "Remember my settings", "จดจำการตั้งค่าของฉัน", "Language and light/dark theme. If off, they reset when you close the tab.", "ภาษาและธีมสว่าง/มืด หากปิดไว้ จะรีเซ็ตเมื่อปิดแท็บ") +
    (gated.analytics ? cat("analytics", "Anonymous statistics", "สถิติแบบไม่ระบุตัวตน", "Helps us improve the site.", "ช่วยให้เราปรับปรุงเว็บไซต์") : "") +
    (gated.marketing ? cat("marketing", "Marketing", "การตลาด", "Personalised content.", "เนื้อหาเฉพาะบุคคล") : "") +
    '<p class="consent-meta"><a href="' + base + 'pages/legal.html#cookies">' + bi("Full cookie & privacy policy", "นโยบายคุกกี้และความเป็นส่วนตัวฉบับเต็ม") + '</a><br><span data-consent-meta></span></p></div>' +
    '<div class="dialog__foot">' +
    '<button type="button" class="btn btn--sm" data-consent-act="save">' + bi("Save my choices", "บันทึกตัวเลือก") + "</button>" +
    '<button type="button" class="btn btn--sm consent-choice" data-consent-act="reject">' + bi("Reject All", "ปฏิเสธทั้งหมด") + "</button>" +
    '<button type="button" class="btn btn--sm consent-choice" data-consent-act="accept">' + bi("Accept All", "ยอมรับทั้งหมด") + "</button>" +
    "</div>";

  function renderMeta() {
    var m = dlg.querySelector("[data-consent-meta]");
    if (!m) return;
    if (!record) { m.innerHTML = ""; return; }
    var d = new Date(record.at);
    var ds = d.toLocaleDateString("en-GB") + " " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    m.innerHTML = bi("Your choice was saved on " + ds + " (ref. " + record.id + ")", "บันทึกตัวเลือกเมื่อ " + ds + " (อ้างอิง " + record.id + ")");
  }
  function syncSwitches() {
    Array.prototype.forEach.call(dlg.querySelectorAll("[data-cat]"), function (i) {
      var c = i.getAttribute("data-cat");
      if (c !== "necessary") i.checked = has(c);
    });
    renderMeta();
  }
  function all(v) { var o = {}; CATS.forEach(function (c) { o[c] = v; }); return o; }
  function open() { syncSwitches(); if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", ""); }
  function close() { if (dlg.close) dlg.close(); else dlg.removeAttribute("open"); }
  function showBanner() { renderBanner(); banner.hidden = false; }
  function hideBanner() { banner.hidden = true; }

  function onAct(e) {
    var b = e.target.closest("[data-consent-act]");
    if (!b) return;
    var act = b.getAttribute("data-consent-act");
    if (act === "accept") { save(all(true)); close(); }
    else if (act === "reject") { save(all(false)); close(); }
    else if (act === "settings") open();
    else if (act === "close") close();
    else if (act === "save") {
      var ch = { necessary: true };
      Array.prototype.forEach.call(dlg.querySelectorAll("[data-cat]"), function (i) { ch[i.getAttribute("data-cat")] = i.checked; });
      save(ch); close();
    }
  }
  banner.addEventListener("click", onAct);
  dlg.addEventListener("click", function (e) { if (e.target === dlg) close(); else onAct(e); });
  document.addEventListener("click", function (e) { if (e.target.closest("[data-open-consent]")) { e.preventDefault(); open(); } });

  document.body.appendChild(banner);
  document.body.appendChild(dlg);
  if (record) activateScripts();
  // ask until a choice is made, and again at the start of every visit (any page)
  if (!record || !ss("get", ASKED_KEY)) showBanner();

  window.DD = window.DD || {};
  window.DD.consent = { has: has, get: function () { return record; }, open: open, onChange: function (fn) { listeners.push(fn); } };
  window.DD.store = store;
})();
