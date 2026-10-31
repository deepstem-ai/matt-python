/* DeepDistrict.si — check that a printed test paper or score report is genuine (pages/verify.html?c=CODE).
   Shows only the document's title, date, issuer and status — never questions or full names. */
(function () {
  "use strict";
  var root = document.querySelector("[data-verify]");
  if (!root) return;
  var base = document.body.getAttribute("data-base") || "";
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function bi(en, th) { return '<span lang="en">' + en + '</span><span lang="th">' + th + "</span>"; }
  var form = root.querySelector("form"), out = root.querySelector("[data-result]");
  function check(code) {
    code = String(code || "").trim().toUpperCase();
    if (!code) return;
    if (!/^https?:$/.test(location.protocol)) { out.innerHTML = '<p class="vf vf--bad">' + bi("Verification works when the website runs on the DeepDistrict server.", "การตรวจสอบใช้ได้เมื่อเปิดเว็บไซต์ผ่านเซิร์ฟเวอร์ DeepDistrict") + "</p>"; return; }
    out.innerHTML = "<p>…</p>";
    fetch(base + "api/verify?c=" + encodeURIComponent(code)).then(function (r) { return r.json(); }).then(function (d) {
      if (!d.code) { out.innerHTML = '<div class="vf vf--bad"><b>✗ ' + bi("Not found", "ไม่พบเอกสาร") + "</b><p>" + bi("No DeepDistrict document has this code. Check the code, or treat the copy as not genuine.", "ไม่มีเอกสารของ DeepDistrict ที่ใช้รหัสนี้ ตรวจสอบรหัสอีกครั้ง หรือถือว่าเอกสารนี้ไม่ใช่ของจริง") + "</p></div>"; return; }
      var rows = [[bi("Code", "รหัส"), esc(d.code)], [bi("Document", "เอกสาร"), esc(d.title) + " · " + (d.kind === "paper" ? bi("test paper", "ชุดข้อสอบ") + (d.teacherCopy ? " (" + bi("teacher copy", "ฉบับครู") + ")" : "") : bi("score report", "รายงานผลสอบ"))],
        [bi("Issued", "ออกเมื่อ"), esc(d.issuedAt) + " · " + esc(d.issuer) + " · " + esc(d.issuedBy) + " (" + esc(d.issuedByRole) + ")"]];
      if (d.kind === "paper") rows.push([bi("Questions", "จำนวนข้อ"), esc(d.items)]);
      else { rows.push([bi("Learner", "ผู้สอบ"), esc(d.learner)]); if (d.score != null) rows.push([bi("Result", "ผลสอบ"), esc(d.score) + (d.testDate ? " · " + esc(d.testDate) : "")]); }
      rows.push([bi("Downloads / prints logged", "จำนวนครั้งที่ดาวน์โหลด/พิมพ์"), esc(d.downloads)]);
      out.innerHTML = '<div class="vf ' + (d.valid ? "vf--ok" : "vf--bad") + '"><b>' + (d.valid ? "✓ " + bi("Genuine DeepDistrict document", "เอกสารของ DeepDistrict ที่ถูกต้อง") : "✗ " + bi("This document has been revoked", "เอกสารนี้ถูกยกเลิกแล้ว")) + "</b>" +
        '<table class="vf-tbl">' + rows.map(function (r) { return "<tr><th>" + r[0] + "</th><td>" + r[1] + "</td></tr>"; }).join("") + "</table>" +
        "<p>" + bi("Compare these details with the printed copy. Names are partly hidden to protect personal data.", "เปรียบเทียบรายละเอียดกับเอกสารที่พิมพ์ ชื่อถูกปิดบางส่วนเพื่อคุ้มครองข้อมูลส่วนบุคคล") + "</p></div>";
    }).catch(function () { out.innerHTML = '<p class="vf vf--bad">' + bi("Could not check right now. Please try again.", "ตรวจสอบไม่ได้ในขณะนี้ กรุณาลองใหม่") + "</p>"; });
  }
  form.addEventListener("submit", function (e) { e.preventDefault(); check(form.elements.c.value); history.replaceState(null, "", "?c=" + encodeURIComponent(form.elements.c.value.trim().toUpperCase())); });
  var c = new URLSearchParams(location.search).get("c");
  if (c) { form.elements.c.value = c; check(c); }
})();
