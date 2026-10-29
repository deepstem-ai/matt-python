/* ==========================================================================
   DeepDistrict.si — preferences bootstrap (load in <head>, before CSS paints)
   Sets <html lang>, data-theme-pref (auto|light|dark) and data-theme
   (light|dark) so there is no flash of the wrong language or colours.
   Preferences persist across visits only if the visitor consented to
   "preferences" storage; otherwise they last for the current tab session.
   ========================================================================== */
(function () {
  var CONSENT_KEY = "dd-consent";
  var CONSENT_VERSION = 3;           // bump when the cookie policy changes -> visitors are asked again
  var doc = document.documentElement;

  function get(store, k) { try { return window[store].getItem(k); } catch (e) { return null; } }
  var consent = null;
  try { consent = JSON.parse(get("localStorage", CONSENT_KEY) || "null"); } catch (e) { consent = null; }
  var valid = consent && consent.v === CONSENT_VERSION && consent.expires > Date.now();
  var persist = !!(valid && consent.choices && consent.choices.preferences);
  function pref(k) { return persist ? get("localStorage", k) : get("sessionStorage", k); }

  var lang = pref("dd-lang");
  if (lang !== "th" && lang !== "en") lang = (navigator.language || "").toLowerCase().indexOf("th") === 0 ? "th" : "en";
  doc.lang = lang;

  var theme = pref("dd-theme");
  if (theme !== "light" && theme !== "dark") theme = "auto";
  doc.setAttribute("data-theme-pref", theme);
  var dark = theme === "dark" || (theme === "auto" && window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
  doc.setAttribute("data-theme", dark ? "dark" : "light");

  window.DD_PREFS = { CONSENT_KEY: CONSENT_KEY, CONSENT_VERSION: CONSENT_VERSION, SITE_VERSION: "4.2 r1" };
})();
