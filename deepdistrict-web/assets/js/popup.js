/* ==========================================================================
   DeepDistrict.si — pop-up promotions (managed in the back office: Pop-ups)
   --------------------------------------------------------------------------
   • Asks the server which pop-ups are live for this page right now
     (the server applies the on/off switch, date range, weekdays and hours).
   • Shows at most one, after the cookie choice is made — never on top of it.
   • Frequency: every visit · once a day · only once. "Once a day / only once"
     are remembered on this device only if the visitor allowed preferences;
     otherwise until the tab closes (consent.js decides via DD.store).
   • Nothing is shown when the site is opened as a file or without the server.
   ========================================================================== */
(function () {
  "use strict";
  if (!/^https?:$/.test(location.protocol) || !window.fetch || (window.DD_CONFIG && window.DD_CONFIG.popups === false)) return;
  var body = document.body, base = body.getAttribute("data-base") || "", page = body.getAttribute("data-page") || "home";
  if (page === "legal") return;
  var DD = window.DD || {};

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function bi(v) { v = v || {}; var en = v.en || v.th || "", th = v.th || v.en || ""; return '<span lang="en">' + esc(en) + '</span><span lang="th">' + esc(th) + "</span>"; }
  function ss(op, k, v) { try { return op === "get" ? sessionStorage.getItem(k) : sessionStorage.setItem(k, v); } catch (e) { return null; } }
  function store() { return DD.store || { get: function (k) { return ss("get", k); }, set: function (k, v) { ss("set", k, v); } }; }
  function today() { var d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }

  // a changed pop-up (new updatedAt) counts as a new one
  function key(p) { return "dd-promo-" + p.id + "-" + String(p.updatedAt || "").replace(/\D/g, "").slice(0, 12); }
  function seen(p) {
    if (ss("get", key(p))) return true;                               // already shown on this visit
    var v = store().get(key(p));
    return p.frequency === "once" ? !!v : p.frequency === "day" ? v === today() : false;
  }
  function remember(p) {
    ss("set", key(p), "1");
    if (p.frequency === "once") store().set(key(p), "1");
    else if (p.frequency === "day") store().set(key(p), today());
  }

  function show(p) {
    var dlg = document.createElement("dialog");
    dlg.className = "promo";
    dlg.setAttribute("aria-labelledby", "promo-title");
    var hasBtn = p.link && ((p.button || {}).en || (p.button || {}).th);
    dlg.innerHTML =
      '<div class="promo__box">' +
      (p.image ? '<img class="promo__img" src="' + esc(p.image) + '" alt="">' : "") +
      '<button type="button" class="promo__x" data-promo-close aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
      '<div class="promo__body"><span class="promo__tag">' + bi({ en: "Promotion", th: "โปรโมชัน" }) + "</span>" +
      '<h2 id="promo-title">' + bi(p.title) + "</h2>" +
      ((p.text || {}).en || (p.text || {}).th ? "<p>" + bi(p.text) + "</p>" : "") +
      '<div class="promo__actions">' + (hasBtn ? '<a class="btn btn--primary" href="' + esc(/^(https?:|mailto:|tel:|#|\/)/i.test(p.link) ? p.link : base + p.link) + '"' + (/^https?:/i.test(p.link) ? ' target="_blank" rel="noopener"' : "") + ' data-promo-go>' + bi(p.button) + "</a>" : "") +
      '<button type="button" class="btn" data-promo-close>' + bi({ en: "Close", th: "ปิด" }) + "</button></div></div></div>";
    document.body.appendChild(dlg);
    function close() { if (dlg.open) dlg.close(); dlg.remove(); }
    dlg.addEventListener("click", function (e) { if (e.target === dlg || e.target.closest("[data-promo-close]")) close(); else if (e.target.closest("[data-promo-go]")) setTimeout(close, 0); });
    dlg.addEventListener("cancel", function (e) { e.preventDefault(); close(); });
    remember(p);
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
  }

  // wait until the cookie bar is answered, then the pop-up's own delay
  function whenConsentDone(fn) {
    var bar = document.querySelector(".consent-banner");
    if (!bar || bar.hidden) return fn();
    var done = false;
    function go() { if (!done && bar.hidden) { done = true; obs.disconnect(); fn(); } }
    var obs = new MutationObserver(go);
    obs.observe(bar, { attributes: true, attributeFilter: ["hidden"] });
  }

  fetch(base + "api/popups?page=" + encodeURIComponent(page), { credentials: "omit", cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : { items: [] }; })
    .then(function (d) {
      var p = (d.items || []).filter(function (x) { return !seen(x); })[0];
      if (!p) return;
      whenConsentDone(function () { setTimeout(function () { if (!document.querySelector("dialog[open]")) show(p); }, Math.max(600, (p.delay || 0) * 1000)); });
    })
    .catch(function () { /* no server (static hosting / offline): no pop-up */ });
})();
