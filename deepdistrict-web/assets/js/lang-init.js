/* DeepDistrict.si — pick the language before the page paints (no flash).
   Order: saved choice -> browser language (Thai -> th) -> English. */
(function () {
  var lang;
  try { lang = localStorage.getItem("dd-lang"); } catch (e) { /* storage blocked */ }
  if (lang !== "th" && lang !== "en") {
    lang = (navigator.language || "").toLowerCase().indexOf("th") === 0 ? "th" : "en";
  }
  document.documentElement.lang = lang;
})();
