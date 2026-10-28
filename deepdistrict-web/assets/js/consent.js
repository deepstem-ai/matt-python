/* ==========================================================================
   DeepDistrict.si — consent management (Thailand PDPA)
   --------------------------------------------------------------------------
   • Shows a consent banner until the visitor chooses, and again when the
     policy version changes or the choice is older than 12 months.
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

  var P = window.DD_PREFS || { CONSENT_KEY: "dd-consent", CONSENT_VERSION: 2 };
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
    activateScripts();
    hideBanner();
    listeners.forEach(function (fn) { fn(record); });
    renderMeta();
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

  /* ------------------------------------------------------------ Banner */
  var banner = document.createElement("section");
  banner.className = "consent-banner";
  banner.setAttribute("role", "region");
  banner.setAttribute("aria-label", "Cookie consent");
  banner.hidden = true;
  banner.innerHTML =
    '<div class="consent-banner__icon"><img src="' + base + 'assets/images/icons/cookie.svg" alt=""></div>' +
    "<div><h2>" + bi("Your privacy, your choice", "ความเป็นส่วนตัวของคุณ คุณเป็นผู้เลือก") + "</h2>" +
    "<p>" + bi(
      'We use only what is necessary to run this site. With your consent we also remember your language and theme. We do not use advertising or tracking cookies. <a href="' + base + 'pages/legal.html#cookies">Cookie policy</a>',
      'เราใช้เฉพาะสิ่งที่จำเป็นต่อการทำงานของเว็บไซต์ และหากคุณยินยอม เราจะจดจำภาษาและธีมที่คุณเลือก เราไม่ใช้คุกกี้เพื่อการโฆษณาหรือติดตาม <a href="' + base + 'pages/legal.html#cookies">นโยบายคุกกี้</a>'
    ) + "</p></div>" +
    '<div class="consent-actions">' +
    '<button type="button" class="btn btn--sm" data-consent-act="settings">' + bi("Settings", "ตั้งค่า") + "</button>" +
    '<button type="button" class="btn btn--sm" data-consent-act="reject">' + bi("Necessary only", "เฉพาะที่จำเป็น") + "</button>" +
    '<button type="button" class="btn btn--sm btn--primary" data-consent-act="accept">' + bi("Accept all", "ยอมรับทั้งหมด") + "</button>" +
    "</div>";

  /* ------------------------------------------------------------ Settings dialog */
  var dlg = document.createElement("dialog");
  dlg.className = "dialog";
  dlg.setAttribute("aria-labelledby", "consent-title");
  function cat(id, en, th, den, dth, locked) {
    return '<div class="consent-cat"><h3>' + bi(en, th) + "</h3>" +
      '<label class="switch"><input type="checkbox" data-cat="' + id + '"' + (locked ? " checked disabled" : "") + ' aria-label="' + en + '"><span></span></label>' +
      "<p>" + bi(den, dth) + "</p></div>";
  }
  dlg.innerHTML =
    '<div class="dialog__head"><span class="eyebrow">PDPA</span><h2 id="consent-title">' + bi("Privacy & cookie settings", "ตั้งค่าความเป็นส่วนตัวและคุกกี้") + "</h2>" +
    "<p>" + bi("Choose what this website may store on your device. You can change this at any time from the footer.", "เลือกสิ่งที่เว็บไซต์นี้จัดเก็บบนอุปกรณ์ของคุณได้ และเปลี่ยนการตั้งค่าได้ทุกเมื่อจากส่วนท้ายของเว็บไซต์") + "</p>" +
    '<button type="button" class="icon-btn dialog__close" data-consent-act="close" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>' +
    '<div class="dialog__body">' +
    cat("necessary", "Strictly necessary", "จำเป็นอย่างยิ่ง", "Needed for the site to work, including remembering this consent choice. Always on.", "จำเป็นต่อการทำงานของเว็บไซต์ รวมถึงการจดจำตัวเลือกความยินยอมนี้ เปิดใช้งานเสมอ", true) +
    cat("preferences", "Preferences", "การตั้งค่าส่วนบุคคล", "Remember your language (TH/EN) and light/dark theme on future visits. If off, they are kept only until you close this tab.", "จดจำภาษา (ไทย/อังกฤษ) และธีมสว่าง/มืดสำหรับการเข้าชมครั้งถัดไป หากปิดไว้ ระบบจะจำไว้เฉพาะจนกว่าคุณจะปิดแท็บนี้") +
    cat("analytics", "Analytics", "การวิเคราะห์การใช้งาน", "Anonymous statistics to improve the site. We do not use any analytics today; if we add them, they will run only with your consent.", "สถิติแบบไม่ระบุตัวตนเพื่อปรับปรุงเว็บไซต์ ปัจจุบันเราไม่ได้ใช้ระบบวิเคราะห์ใด ๆ หากเพิ่มในอนาคต จะทำงานเฉพาะเมื่อคุณยินยอมเท่านั้น") +
    cat("marketing", "Marketing", "การตลาด", "Personalised content or advertising. Not used today, and never without your consent.", "เนื้อหาหรือโฆษณาเฉพาะบุคคล ปัจจุบันไม่ได้ใช้ และจะไม่ใช้โดยไม่ได้รับความยินยอมจากคุณ") +
    '<p class="consent-meta" data-consent-meta></p></div>' +
    '<div class="dialog__foot">' +
    '<button type="button" class="btn btn--sm" data-consent-act="reject">' + bi("Necessary only", "เฉพาะที่จำเป็น") + "</button>" +
    '<button type="button" class="btn btn--sm" data-consent-act="save">' + bi("Save my choices", "บันทึกตัวเลือก") + "</button>" +
    '<button type="button" class="btn btn--sm btn--primary" data-consent-act="accept">' + bi("Accept all", "ยอมรับทั้งหมด") + "</button>" +
    "</div>";

  function renderMeta() {
    var m = dlg.querySelector("[data-consent-meta]");
    if (!m) return;
    if (!record) { m.innerHTML = bi("No choice recorded yet.", "ยังไม่มีการบันทึกตัวเลือก"); return; }
    var d = new Date(record.at);
    var ds = d.toLocaleDateString("en-GB") + " " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    m.innerHTML = bi("Consent ID " + record.id + " · recorded " + ds + " · policy v" + record.v,
                     "รหัสความยินยอม " + record.id + " · บันทึกเมื่อ " + ds + " · นโยบายฉบับที่ " + record.v);
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
  function showBanner() { banner.hidden = false; }
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
  if (!record) showBanner(); else activateScripts();

  window.DD = window.DD || {};
  window.DD.consent = { has: has, get: function () { return record; }, open: open, onChange: function (fn) { listeners.push(fn); } };
  window.DD.store = store;
})();
