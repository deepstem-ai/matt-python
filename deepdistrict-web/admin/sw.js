/* DeepDistrict back office — service worker.
   Makes the back office installable and lets it open without a connection.
   The app files are fetched fresh when online (network first) and come from the cache when offline.
   Nothing under /api/ is ever cached: personal data always comes from the server. */
var CACHE = "dd-admin-v18";
var SHELL = [
  "./", "./index.html", "./manifest.webmanifest", "./css/admin.css",
  "./js/core.js", "./js/boot.js", "./js/schedule.js", "./js/app.js", "./js/calendar.js", "./js/reports.js", "./js/portal.js", "./js/docs.js", "./js/search.js", "./js/notify.js", "./js/popups.js", "./js/content.js", "./js/blog.js", "./js/exams.js", "./exam.html", "./js/exam-player.js", "./css/exam.css", "./live.html", "./js/live.js", "./js/protect.js", "./js/classroom.js", "./js/audit-pdf.js", "./vendor/qrcode.js",
  "./vendor/html2canvas.min.js", "./vendor/jspdf.umd.min.js",
  "../assets/css/fonts.css", "../assets/css/tokens.css",
  "../assets/data/content.js", "../assets/data/courses-details.js", "../assets/data/courses-more.js", "../assets/data/admissions.js", "../assets/data/catalogue.js", "../assets/data/pathways.js", "../assets/data/prep.js",
  "../assets/images/brand/logo-mark.png", "../assets/images/brand/favicon-32.png", "../assets/images/brand/favicon-192.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin || url.pathname.indexOf("/api/") !== -1) return;
  e.respondWith(fetch(e.request).then(function (r) {
    if (r.ok) { var copy = r.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, copy); }); }
    return r;
  }).catch(function () {
    return caches.match(e.request, { ignoreSearch: true }).then(function (m) { return m || (e.request.mode === "navigate" ? caches.match("./index.html") : Response.error()); });
  }));
});
