/* ==========================================================================
   DeepDistrict — content protection on test and live-class screens
   A web page cannot stop every screenshot or a phone camera, so this makes copying hard and leaks
   traceable:
   • a faint watermark with the learner's name, email and the time across the whole screen
   • no copy / cut / right-click / drag on questions (selecting still works for the highlighter tool)
   • Ctrl/⌘ + C, P, S, U and Print Screen are blocked; Print Screen also clears the clipboard
   • printing shows a notice instead of the questions
   • the questions are hidden while the window is in the background (screen-snipping tools take
     focus), and each time is counted and reported to the teacher
   ========================================================================== */
(function () {
  "use strict";
  var on = false, mark = null, cover = null, leaves = 0, cb = null, clockT = null, who = "";
  var lang = (function () { try { return localStorage.getItem("dd-admin-lang") || "th"; } catch (e) { return "th"; } })();
  var L = function (en, th) { return lang === "th" ? th : en; };
  function editable(t) { return t && (t.closest("input, textarea, select, [contenteditable=true]")); }
  function stop(e) { if (!on || editable(e.target)) return; e.preventDefault(); }
  function keys(e) {
    if (!on) return;
    var k = (e.key || "").toLowerCase(), mod = e.ctrlKey || e.metaKey;
    if (k === "printscreen") { e.preventDefault(); wipe(); hide(true); setTimeout(function () { hide(false); }, 1200); return; }
    if (mod && (k === "p" || k === "s" || k === "u")) { e.preventDefault(); return; }
    if (mod && (k === "c" || k === "x") && !editable(e.target)) e.preventDefault();
    if (mod && e.shiftKey && (k === "i" || k === "j" || k === "c")) e.preventDefault();   // developer tools
  }
  function wipe() { try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(""); } catch (e) {} }
  function hide(yes) { if (cover) cover.hidden = !yes; document.body.classList.toggle("is-shielded", !!yes); }
  var dialog = false;
  ["alert", "confirm", "prompt"].forEach(function (f) {          // the test's own pop-ups are not "leaving"
    var orig = window[f];
    window[f] = function (m, d) { dialog = true; try { return orig.call(window, m, d); } finally { setTimeout(function () { dialog = false; }, 300); } };
  });
  function away(e) {
    if (!on) return;
    if (e && e.type === "blur") { setTimeout(function () { if (!dialog && !document.hasFocus()) away(); }, 350); return; }
    if (document.hidden || !document.hasFocus()) {
      if (!document.body.classList.contains("is-shielded")) { leaves++; if (cb) cb(leaves); }
      hide(true);
    }
  }
  function back() { if (on && !document.hidden) hide(false); }
  function drawMark() {
    var t = who + " · " + new Date().toLocaleString(lang === "th" ? "th-TH" : "en-GB", { dateStyle: "medium", timeStyle: "short" });
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="460" height="230"><text x="20" y="130" transform="rotate(-24 230 115)" font-family="Arial, sans-serif" font-size="15" fill="#64748b" fill-opacity="0.16">' +
      t.replace(/[&<>"']/g, " ") + "</text></svg>";
    mark.style.backgroundImage = 'url("data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg) + '")';
  }
  window.DDProtect = {
    /* opts: {name, email, onLeave(count)} */
    start: function (opts) {
      opts = opts || {}; cb = opts.onLeave || null; who = [opts.name, opts.email].filter(Boolean).join(" · ") || "DeepDistrict";
      if (opts.leaves) leaves = +opts.leaves || 0;
      if (on) { drawMark(); return; }
      on = true;
      document.body.classList.add("is-protected");
      mark = document.createElement("div"); mark.className = "dd-watermark"; mark.setAttribute("aria-hidden", "true"); document.body.appendChild(mark);
      cover = document.createElement("div"); cover.className = "dd-shield"; cover.hidden = true;
      cover.innerHTML = "<div><b>" + L("Test content is hidden", "ซ่อนเนื้อหาข้อสอบชั่วคราว") + "</b><span>" + L("Come back to this window to continue. Leaving the test screen is recorded for your teacher.", "กลับมาที่หน้าต่างนี้เพื่อทำต่อ การออกจากหน้าข้อสอบจะถูกบันทึกให้ครูทราบ") + "</span></div>";
      document.body.appendChild(cover);
      drawMark(); clockT = setInterval(drawMark, 60000);
      ["copy", "cut", "contextmenu", "dragstart"].forEach(function (ev) { document.addEventListener(ev, stop, true); });
      document.addEventListener("keydown", keys, true);
      document.addEventListener("keyup", function (e) { if (on && (e.key || "").toLowerCase() === "printscreen") wipe(); }, true);
      document.addEventListener("visibilitychange", function () { document.hidden ? away() : back(); });
      window.addEventListener("blur", away); window.addEventListener("focus", back);
      window.addEventListener("beforeprint", function () { if (on) hide(true); });
      window.addEventListener("afterprint", function () { if (on) hide(false); });
    },
    stop: function () {
      on = false; clearInterval(clockT);
      document.body.classList.remove("is-protected", "is-shielded");
      if (mark) mark.remove(); if (cover) cover.remove(); mark = cover = null;
    },
    leaves: function () { return leaves; }
  };
})();
