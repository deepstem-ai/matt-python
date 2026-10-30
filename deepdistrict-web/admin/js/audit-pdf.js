/* ==========================================================================
   DeepDistrict — audited PDF builder (test papers and score reports)
   DDPDF.build(payload) → Promise<Blob>. The payload comes from the server
   (/api/doc/paper, /api/doc/report, /api/doc/get) and is already recorded there.
   Every PDF carries: logo, title, who created it and when, who generated this
   copy and when, a verification code + QR code, usage instructions, the legal /
   copyright notice, and on every page a footer with the code, date and page
   number plus a light watermark of the code.
   Needs vendor/html2canvas.min.js, vendor/jspdf.umd.min.js and vendor/qrcode.js.
   ========================================================================== */
(function () {
  "use strict";
  function uline(h) { return String(h).replace(/\[\[([^\]]+)\]\]/g, "<u class=\"ul-part\">$1</u>"); }   // [[text]] = underlined part (error identification)
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var LET = ["A", "B", "C", "D"];
  var NAME = { sat: "SAT Reading and Writing", "ielts-r": "IELTS Academic Reading", "ielts-w": "IELTS Academic Writing" };
  var DOM = { cs: "Craft and Structure", ii: "Information and Ideas", sec: "Standard English Conventions", eoi: "Expression of Ideas" };
  var CRIT = { ta: "Task Achievement / Response", cc: "Coherence & Cohesion", lr: "Lexical Resource", gra: "Grammatical Range & Accuracy" };

  function base() { var p = location.pathname, i = p.indexOf("/admin/"); return location.origin + (i === -1 ? "/" : p.slice(0, i + 1)); }
  function verifyUrl(code) { return base() + "pages/verify.html?c=" + encodeURIComponent(code); }
  function qr(text) {
    if (!window.qrcode) return "";
    var q = window.qrcode(0, "M"); q.addData(text); q.make();
    return q.createDataURL(4, 8);
  }
  function css() {
    if (document.getElementById("ap-style")) return;
    var st = document.createElement("style"); st.id = "ap-style";
    st.textContent =
      ".ap-doc{position:fixed;left:-10000px;top:0;width:794px;background:#fff;color:#111827;font:13px/1.55 'Inter','IBM Plex Sans Thai','Segoe UI',Arial,sans-serif;padding:0}" +
      ".ap-doc *{box-sizing:border-box}.ap-block{padding:0 48px}.ap-gap{height:14px}" +
      ".ap-head{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;padding-top:36px;border-bottom:3px solid #2457e6;padding-bottom:14px}" +
      ".ap-head img.logo{height:30px}.ap-head .org{font-size:11px;color:#46506a;text-align:right}" +
      ".ap-title{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;padding-top:16px}.ap-title h1{font-size:22px;margin:0 0 4px}.ap-title p{margin:0;color:#46506a}" +
      ".ap-qr{text-align:center;font-size:10px;color:#46506a;min-width:120px}.ap-qr img{width:104px;height:104px;display:block;margin:0 auto 4px}.ap-qr b{font:700 12px/1.2 ui-monospace,Menlo,Consolas,monospace;color:#111827;letter-spacing:.04em}" +
      ".ap-meta{width:100%;border-collapse:collapse;margin-top:10px;font-size:11.5px}.ap-meta td{border:1px solid #d6dbe6;padding:5px 8px}.ap-meta td:first-child{width:28%;background:#f3f6fb;font-weight:600}" +
      ".ap-banner{margin-top:10px;padding:8px 12px;border:2px solid #b91c1c;color:#b91c1c;font-weight:700;text-align:center;border-radius:6px}" +
      ".ap-box{margin-top:12px;padding:10px 14px;border:1px solid #d6dbe6;border-radius:8px;background:#f8fafc;font-size:11.5px}.ap-box h2{font-size:13px;margin:0 0 4px}.ap-box p{margin:2px 0}.ap-box ul{margin:2px 0;padding-left:18px}" +
      ".ap-h2{font-size:16px;margin:18px 0 6px;padding-bottom:4px;border-bottom:1px solid #d6dbe6}" +
      ".ap-q{display:grid;grid-template-columns:30px 1fr;gap:8px;padding:10px 0;border-bottom:1px dashed #d6dbe6}.ap-q .n{font-weight:700;background:#111827;color:#fff;border-radius:4px;text-align:center;height:22px;line-height:22px;font-size:12px}" +
      ".ap-q p{margin:0 0 6px}.ap-stem{font-weight:600}.ap-ch{margin:2px 0}.ap-ch b{display:inline-block;width:22px}" +
      ".ap-tbl{border-collapse:collapse;margin:6px 0;font-size:11.5px}.ap-tbl td,.ap-tbl th{border:1px solid #c7cede;padding:4px 7px}.ap-tbl th{background:#f3f6fb}" +
      ".ap-para{margin:0 0 9px;text-align:justify}.ap-para b{color:#2457e6;margin-right:6px}.ap-instr{font-style:italic;color:#46506a;margin:8px 0 4px}" +
      ".ap-opts{margin:4px 0 6px;padding:6px 10px;border:1px solid #d6dbe6;border-radius:6px;font-size:12px}.ap-opts div b{display:inline-block;min-width:34px}" +
      ".ap-line{border-bottom:1px solid #9aa3b5;height:26px}.ap-blank{display:inline-block;min-width:150px;border-bottom:1px solid #111827}" +
      ".ap-key td{vertical-align:top}.ap-legal{font-size:10.5px;color:#46506a}.ap-legal p{margin:3px 0}" +
      ".ap-score{display:flex;gap:18px;align-items:center;margin:14px 0;padding:14px 18px;border:1px solid #d6dbe6;border-radius:10px}.ap-score b{font-size:40px;color:#2457e6;line-height:1}" +
      ".ap-wn{display:grid;grid-template-columns:1fr 230px;gap:14px;align-items:stretch}.ap-wn .ap-q{border-bottom:0}" +
      ".ap-notes{border:1px solid #c7cede;border-radius:6px;padding:4px 8px 6px;margin:8px 0;background:#fcfdff}.ap-notes b{font-size:9.5px;color:#6b7489;letter-spacing:.04em}" +
      ".ap-notes div{border-bottom:1px solid #dfe4ee;height:22px}.ap-sep{border-bottom:1px dashed #d6dbe6}" +
      ".ap-disc{border:2px solid #b45309;background:#fffbeb}.ap-disc h2{color:#92400e}.ap-disc p{margin:3px 0}" +
      ".ap-legalbox{border:2px solid #111827;border-radius:8px;padding:14px 18px;font-size:10.5px;line-height:1.5}.ap-legalbox h2{font-size:14px;margin:0 0 8px}" +
      ".ap-lsec{margin:0 0 8px}.ap-lsec h3{font-size:11.5px;margin:0 0 2px}.ap-lsec p{margin:0 0 2px}.ap-lsec .th{color:#46506a}.ap-conf{margin:8px 0 0;font-weight:700;color:#b91c1c}" +
      ".ap-end{height:30px}";
    document.head.appendChild(st);
  }
  function tbl(t) { return t && t.rows && t.rows.length ? (t.title ? "<p><b>" + esc(t.title) + "</b></p>" : "") + '<table class="ap-tbl">' + t.rows.map(function (r, i) { return "<tr>" + r.map(function (c) { return i ? "<td>" + esc(c) + "</td>" : "<th>" + esc(c) + "</th>"; }).join("") + "</tr>"; }).join("") + "</table>" : ""; }
  function lines(t) { return esc(t).split(/\n/).map(function (l) { return "<p>" + (l || "&nbsp;") + "</p>"; }).join(""); }
  function noted(p, qhtml, words) {
    if (!p.notes) return qhtml;
    var n = Math.max(4, Math.min(14, Math.ceil((words || 40) / 16)));
    return '<div class="ap-wn">' + qhtml + '<div class="ap-notes"><b>NOTES · จดโน้ต</b>' + new Array(n + 1).join("<div></div>") + "</div></div><div class=\"ap-sep\"></div>";
  }
  function wc(t) { return String(t || "").split(/\s+/).length; }
  function block(html, cls) { return '<div class="ap-block ' + (cls || "") + '">' + html + "</div>"; }

  function header(p) {
    var exam = NAME[p.exam] || "";
    var rows = [["Document / เอกสาร", p.kind === "paper" ? (p.withKey ? "Test paper — TEACHER COPY with answer key / ข้อสอบ ฉบับครู (มีเฉลย)" : p.notes ? "Test paper (student copy with notes column) / ข้อสอบ ฉบับนักเรียน มีช่องจดโน้ต" : "Test paper (student copy) / ข้อสอบ ฉบับนักเรียน") : "Score report / รายงานผลสอบ"],
      ["Verification code / รหัสตรวจสอบ", p.code], ["Created / สร้างเมื่อ", p.createdAtLocal + " · " + (p.createdBy || "—") + " (" + p.role + ")"],
      ["This copy / ฉบับนี้พิมพ์เมื่อ", p.generatedAt + " · " + (p.generatedBy || "—")]];
    if (p.note) rows.push(["Class / note · ห้อง/หมายเหตุ", p.note]);
    if (p.kind === "report") rows.splice(1, 0, ["Learner / ผู้สอบ", p.learner || "—"]);
    if (p.minutes) rows.push(["Time allowed / เวลา", p.minutes + " minutes / นาที"]);
    if (p.variant) rows.push(["Answer order / ลำดับตัวเลือก", "Version " + p.variant + " — same as the live class of this set · ตรงกับห้องเรียนสดของชุดนี้"]);
    return block('<div class="ap-head"><img class="logo" src="' + base() + 'assets/images/brand/logo-horizontal.png" alt="DeepDistrict"><div class="org"><b>DeepDistrict.si</b><br>Learning & research lab · Bangkok, Thailand<br>info@deepdistrict.si</div></div>' +
      '<div class="ap-title"><div><h1>' + esc(p.title) + "</h1><p>" + esc(exam) + "</p></div>" +
      '<div class="ap-qr"><img src="' + qr(verifyUrl(p.code)) + '" alt=""><b>' + esc(p.code) + "</b><br>Scan to verify · สแกนเพื่อตรวจสอบ</div></div>" +
      '<table class="ap-meta">' + rows.map(function (r) { return "<tr><td>" + esc(r[0]) + "</td><td>" + esc(r[1]) + "</td></tr>"; }).join("") + "</table>" +
      (p.withKey ? '<div class="ap-banner">TEACHER COPY — CONTAINS ANSWERS · ฉบับครู มีเฉลย ห้ามแจกนักเรียน</div>' : ""));
  }
  var HOW = {
    sat: ["Each question has one short passage and four choices. Choose the one best answer. There is no penalty for wrong answers.", "แต่ละข้อมีบทอ่านสั้นและ 4 ตัวเลือก เลือกคำตอบที่ดีที่สุดเพียงข้อเดียว ตอบผิดไม่หักคะแนน", "Real test: 2 modules × 27 questions, 32 minutes each (≈71 seconds per question)."],
    "ielts-r": ["Read the passage and answer the questions. Follow each instruction: write NO MORE THAN the number of words allowed; spelling must be correct.", "อ่านบทความแล้วตอบคำถาม ทำตามคำสั่งแต่ละชุด เขียนไม่เกินจำนวนคำที่กำหนด และต้องสะกดให้ถูกต้อง", "Real test: 3 passages, 40 questions, 60 minutes, no extra transfer time."],
    "ielts-w": ["Write your answers in English. Task 1: at least 150 words (about 20 minutes). Task 2: at least 250 words (about 40 minutes). Task 2 counts twice as much.", "เขียนเป็นภาษาอังกฤษ Task 1 อย่างน้อย 150 คำ (ประมาณ 20 นาที) Task 2 อย่างน้อย 250 คำ (ประมาณ 40 นาที) Task 2 มีน้ำหนักเป็นสองเท่า", "Real test: 60 minutes for both tasks."]
  };
  function instructions(p) {
    if (p.kind === "report") return block('<div class="ap-box"><h2>About this report · เกี่ยวกับรายงานนี้</h2><ul><li>Results of a DeepDistrict online practice test, marked by our server (Writing bands are confirmed by a teacher). Scores are practice estimates, not official results.</li>' +
      "<li>ผลการสอบฝึกออนไลน์ของ DeepDistrict ตรวจโดยระบบ (คะแนน Writing ยืนยันโดยครู) คะแนนเป็นค่าประมาณเพื่อการฝึก ไม่ใช่ผลสอบทางการ</li></ul></div>");
    var h = HOW[p.exam] || ["", "", ""];
    return block('<div class="ap-box"><h2>How to use this paper · วิธีใช้</h2><ul><li>' + esc(h[0]) + "</li><li>" + esc(h[1]) + "</li><li>" + esc(h[2]) +
      "</li>" + (p.notes ? "<li>Use the NOTES column to write key words, reasons and your teacher's explanations during the live class. · ใช้ช่อง NOTES จดคำสำคัญ เหตุผล และคำอธิบายของครูระหว่างเรียน</li>" : "") + "<li>For classroom practice at DeepDistrict. Scores are practice estimates, not official results. · ใช้ฝึกในชั้นเรียน DeepDistrict คะแนนเป็นค่าประมาณ ไม่ใช่ผลสอบทางการ</li></ul></div>");
  }
  /* short notice on page 1 (right under the header) */
  function disclaimer(p) {
    return block('<div class="ap-box ap-disc"><h2>Disclaimer & rights · ข้อจำกัดความรับผิดชอบและสิทธิ์</h2>' +
      "<p><b>Practice material — not an official test.</b> Not produced, endorsed or approved by the College Board (SAT®) or the IELTS partners (British Council, IDP: IELTS Australia, Cambridge University Press & Assessment). Scores are estimates and do not predict or guarantee official results or admission.</p>" +
      "<p><b>เอกสารฝึกสอบ ไม่ใช่ข้อสอบทางการ</b> ไม่ได้จัดทำ รับรอง หรืออนุมัติโดย College Board (SAT®) หรือเจ้าของ IELTS คะแนนเป็นค่าประมาณ ไม่ใช่การรับประกันผลสอบจริงหรือการได้รับเข้าศึกษา</p>" +
      "<p><b>© " + new Date().getFullYear() + " DeepDistrict.si — all rights reserved · สงวนลิขสิทธิ์</b>. Licensed for use in DeepDistrict classes only. Copy " + esc(p.code) + " is traceable to its creator. Full terms on the last page. · ใช้ได้เฉพาะในชั้นเรียนของ DeepDistrict ฉบับนี้ติดตามได้ว่าใครสร้าง ดูเงื่อนไขฉบับเต็มที่หน้าสุดท้าย</p></div>");
  }
  /* full legal notice (last page) */
  function legal(p) {
    var y = new Date().getFullYear();
    var sec = function (n, en, th) { return '<div class="ap-lsec"><h3>' + n + "</h3><p>" + en + "</p><p class=\"th\">" + th + "</p></div>"; };
    return block('<div class="ap-legalbox"><h2>Legal notice, licence and disclaimer · ประกาศทางกฎหมาย สัญญาอนุญาต และข้อจำกัดความรับผิดชอบ</h2>' +
      sec("1. Copyright & ownership · ลิขสิทธิ์และความเป็นเจ้าของ",
        "© " + y + " DeepDistrict.si. All rights reserved. The questions, passages, explanations, layout and score reports are original works of DeepDistrict.si (written by our team or drafted with AI and checked by our teachers) and are protected by the Copyright Act B.E. 2537 (1994) of Thailand and international copyright law. They are not copied from any official or published test.",
        "© " + y + " DeepDistrict.si สงวนลิขสิทธิ์ ข้อสอบ บทอ่าน คำอธิบาย รูปแบบเอกสาร และรายงานผล เป็นงานต้นฉบับของ DeepDistrict.si (เขียนโดยทีมงาน หรือร่างด้วย AI และตรวจโดยครู) ได้รับความคุ้มครองตามพระราชบัญญัติลิขสิทธิ์ พ.ศ. 2537 และกฎหมายลิขสิทธิ์ระหว่างประเทศ และไม่ได้คัดลอกจากข้อสอบทางการหรือหนังสือที่ตีพิมพ์") +
      sec("2. Licence · สิทธิ์ในการใช้งาน",
        "DeepDistrict grants a limited, non-exclusive, non-transferable licence to the creator named on this document and to learners enrolled in their DeepDistrict class, to view, print and write on this copy for that class and for personal revision.",
        "DeepDistrict อนุญาตแบบจำกัด ไม่ผูกขาด และโอนไม่ได้ ให้ผู้สร้างที่ระบุในเอกสาร และผู้เรียนที่ลงทะเบียนในชั้นเรียนของ DeepDistrict ใช้ดู พิมพ์ และเขียนลงในฉบับนี้ เพื่อการเรียนในชั้นเรียนนั้นและการทบทวนส่วนตัวเท่านั้น") +
      sec("3. Not allowed · สิ่งที่ห้ามทำ",
        "Copying or scanning for others; sharing, posting or uploading (including chat groups, social media, file-sharing and AI tools or datasets); selling or using in other tutoring; adapting or translating; removing or hiding this notice, the code or the watermark — unless DeepDistrict has agreed in writing.",
        "ห้ามทำสำเนาหรือสแกนให้ผู้อื่น ห้ามแชร์ โพสต์ หรืออัปโหลด (รวมถึงกลุ่มแชต โซเชียลมีเดีย เว็บฝากไฟล์ และเครื่องมือหรือชุดข้อมูล AI) ห้ามขายหรือนำไปใช้สอนที่อื่น ห้ามดัดแปลงหรือแปล และห้ามลบหรือปิดบังประกาศนี้ รหัส หรือลายน้ำ เว้นแต่ได้รับอนุญาตเป็นลายลักษณ์อักษรจาก DeepDistrict") +
      sec("4. Trademarks & independence · เครื่องหมายการค้าและความเป็นอิสระ",
        "SAT® is a registered trademark of the College Board. IELTS™ is jointly owned by the British Council, IDP: IELTS Australia and Cambridge University Press & Assessment. These names are used only to describe the test a learner prepares for. DeepDistrict is independent and is not affiliated with, sponsored or endorsed by them.",
        "SAT® เป็นเครื่องหมายการค้าจดทะเบียนของ College Board ส่วน IELTS™ เป็นของ British Council, IDP: IELTS Australia และ Cambridge University Press & Assessment ร่วมกัน ชื่อเหล่านี้ใช้เพื่ออธิบายการสอบที่ผู้เรียนเตรียมตัวเท่านั้น DeepDistrict เป็นองค์กรอิสระ ไม่มีความเกี่ยวข้อง ไม่ได้รับการสนับสนุนหรือรับรองจากองค์กรเหล่านี้") +
      sec("5. Disclaimer · ข้อจำกัดความรับผิดชอบ",
        "This is practice material. It follows the published formats as closely as we can, but it is not an official test and may differ from the real one. Scores and bands are DeepDistrict estimates for learning; they are not official scores and do not predict or guarantee any test result, admission or scholarship. Test rules, dates and university requirements change: always check the official websites. The material is provided \"as is\"; to the extent permitted by law DeepDistrict is not liable for decisions made on the basis of these estimates.",
        "เอกสารนี้เป็นแบบฝึก จัดทำตามรูปแบบที่เผยแพร่ให้ใกล้เคียงที่สุด แต่ไม่ใช่ข้อสอบทางการและอาจแตกต่างจากข้อสอบจริง คะแนนและ band เป็นค่าประมาณเพื่อการเรียนรู้ ไม่ใช่คะแนนทางการ และไม่ใช่การรับประกันผลสอบ การได้รับเข้าศึกษา หรือทุนการศึกษา กฎเกณฑ์ วันสอบ และเกณฑ์ของมหาวิทยาลัยเปลี่ยนแปลงได้ โปรดตรวจสอบกับเว็บไซต์ทางการเสมอ DeepDistrict ไม่รับผิดชอบต่อการตัดสินใจที่อาศัยค่าประมาณเหล่านี้ ภายในขอบเขตที่กฎหมายอนุญาต") +
      sec("6. Tracking & verification · การติดตามและตรวจสอบ",
        "Each copy has a unique code (" + esc(p.code) + "). DeepDistrict records who created it, when, which question versions it contains and every download or print. Anyone can check that a printed copy is genuine at " + esc(verifyUrl(p.code)) + ". Copies found outside DeepDistrict classes can be traced to their source.",
        "ทุกฉบับมีรหัสเฉพาะ (" + esc(p.code) + ") DeepDistrict บันทึกว่าใครสร้าง เมื่อไร ใช้ข้อสอบเวอร์ชันใด และทุกครั้งที่ดาวน์โหลดหรือพิมพ์ ตรวจสอบความถูกต้องของฉบับพิมพ์ได้ที่ลิงก์ด้านบน ฉบับที่พบนอกชั้นเรียนของ DeepDistrict สามารถติดตามถึงต้นทางได้") +
      (p.kind === "report" ? sec("7. Personal data (PDPA) · ข้อมูลส่วนบุคคล",
        "This report contains a learner's personal data, processed under the Personal Data Protection Act B.E. 2562 (2019) and DeepDistrict's privacy notice. Keep it private and share it only with the learner, their parents or guardians and DeepDistrict staff.",
        "รายงานนี้มีข้อมูลส่วนบุคคลของผู้เรียน ประมวลผลตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 และประกาศความเป็นส่วนตัวของ DeepDistrict โปรดเก็บรักษาและเปิดเผยเฉพาะผู้เรียน ผู้ปกครอง และเจ้าหน้าที่ DeepDistrict") : "") +
      sec((p.kind === "report" ? "8" : "7") + ". Permissions & contact · ขออนุญาตและติดต่อ",
        "For any other use, or to report misuse, contact info@deepdistrict.si. These terms are governed by the laws of Thailand.",
        "หากต้องการใช้งานนอกเหนือจากนี้ หรือแจ้งการใช้งานที่ไม่ถูกต้อง ติดต่อ info@deepdistrict.si เงื่อนไขนี้อยู่ภายใต้กฎหมายไทย") +
      (p.withKey ? '<p class="ap-conf">TEACHER COPY — CONFIDENTIAL. Do not give to learners or leave in classrooms. · ฉบับครู — เอกสารลับ ห้ามให้นักเรียนหรือวางทิ้งไว้ในห้องเรียน</p>' : "") + "</div>", "ap-break");
  }
  function paperBody(p) {
    var out = [], n = 0;
    p.items.forEach(function (it) {
      if (it.kind === "sat" || it.kind === "m1") {
        n++;
        out.push(block(noted(p, '<div class="ap-q"><div class="n">' + n + "</div><div>" + lines(it.passage) + tbl(it.table) + (it.image ? '<img src="' + esc(it.image) + '" style="max-width:100%;margin:6px 0" alt="">' : "") + '<p class="ap-stem">' + uline(esc(it.stem)) + "</p>" +
          (it.format === "fill" ? '<div class="ap-ch">Answer · คำตอบ: ______________________ ' + esc(it.unit || "") + "</div>" : "") +
          (it.choices || []).map(function (c, i) { return '<div class="ap-ch"><b>' + LET[i] + ")</b>" + esc(c) + "</div>"; }).join("") + "</div></div>", wc(it.passage) + 30)));
      } else if (it.kind === "ielts-r") {
        out.push(block('<h2 class="ap-h2">' + esc(it.title) + "</h2>"));
        it.paragraphs.forEach(function (para, i) { out.push(block('<p class="ap-para">' + (it.labelled ? "<b>" + String.fromCharCode(65 + i) + "</b>" : "") + esc(para) + "</p>")); });
        it.groups.forEach(function (g) {
          var from = n + 1;
          var gm = g.questions.reduce(function (t, q) { return t + (q.marks || 1); }, 0);
          out.push(block('<p class="ap-instr"><b>Questions ' + from + (gm > 1 ? "–" + (n + gm) : "") + "</b> · " + esc(g.instructions) + "</p>" +
            (g.context ? '<div class="ap-box" style="margin-top:4px">' + lines(g.context) + "</div>" : "") +
            (g.options && g.options.length && !/^(tfng|ynng|matching-info|mcq|mcq-multi)$/.test(g.type) ? '<div class="ap-opts">' + g.options.map(function (o) { return "<div><b>" + esc(o.key) + "</b>" + esc(o.text) + "</div>"; }).join("") + "</div>" : "") +
            (g.image ? '<img src="' + esc(g.image) + '" style="max-width:100%" alt="">' : "")));
          g.questions.forEach(function (q) {
            n++;
            var label = n + ((q.marks || 1) > 1 ? "–" + (n + q.marks - 1) : "");
            var ans = g.type === "tfng" ? "TRUE / FALSE / NOT GIVEN" : g.type === "ynng" ? "YES / NO / NOT GIVEN" : "";
            n += (q.marks || 1) - 1;
            out.push(block(noted(p, '<div class="ap-q"><div class="n" style="' + (label.length > 3 ? "font-size:9px" : "") + '">' + label + "</div><div><p>" + esc(q.text) + "</p>" +
              (q.options ? q.options.map(function (o) { return '<div class="ap-ch"><b>' + esc(o.key) + ")</b>" + esc(o.text) + "</div>"; }).join("") : "") +
              (ans ? '<p style="color:#46506a;font-size:11px">' + ans + "</p>" : "") + ((q.marks || 1) > 1 ? "<p>Answers / คำตอบ (" + q.marks + " letters): " + new Array(q.marks + 1).join('<span class="ap-blank" style="min-width:60px">&nbsp;</span> ') + "</p>" : '<p>Answer / คำตอบ: <span class="ap-blank">&nbsp;</span></p>') + "</div></div>", 30)));
          });
        });
      } else {
        out.push(block('<h2 class="ap-h2">Writing Task ' + it.task + "</h2>" + lines(it.prompt) + tbl(it.table) + (it.image ? '<img src="' + esc(it.image) + '" style="max-width:100%" alt="">' : "")));
        var rows = it.task === 1 ? 18 : 26;
        for (var i = 0; i < rows; i += 6) out.push(block(new Array(Math.min(6, rows - i) + 1).join('<div class="ap-line"></div>')));
      }
    });
    return out;
  }
  function answerKey(p) {
    var out = [block('<h2 class="ap-h2">Answer key · เฉลย (teacher copy)</h2>', "ap-break")], n = 0, rows = [];
    p.items.forEach(function (it) {
      if (it.kind === "m1") { n++; rows.push("<tr><td><b>" + n + "</b></td><td><b>" + (it.format === "fill" ? esc((it.accept || []).join(" / ") + " " + (it.unit || "")) : LET[it.answer]) + "</b></td><td>" + esc({ math: "Mathematics", sci: "Science", eng: "English", thai: "Thai" }[it.subject] || "") + " · " + esc({ e: "easy", m: "medium", h: "hard" }[it.difficulty] || "") + (it.skill ? " · " + esc((it.skill.th || it.skill.en) + " / " + ((it.topic || {}).th || "")) : "") + "<br>" + esc((it.explanation || {}).en || "") + (it.explanation && it.explanation.th ? "<br>" + esc(it.explanation.th) : "") + "</td></tr>"); }
      else if (it.kind === "sat") { n++; rows.push("<tr><td><b>" + n + "</b></td><td><b>" + LET[it.answer] + "</b></td><td>" + esc(DOM[it.domain] || "") + " · " + esc(it.skill) + " · " + esc({ e: "easy", m: "medium", h: "hard" }[it.difficulty] || "") + "<br>" + esc((it.explanation || {}).en || "") + (it.explanation && it.explanation.th ? "<br>" + esc(it.explanation.th) : "") + "</td></tr>"); }
      else if (it.kind === "ielts-r") it.groups.forEach(function (g) { g.questions.forEach(function (q) { n++; var m = q.marks || 1; rows.push("<tr><td><b>" + n + (m > 1 ? "–" + (n + m - 1) : "") + "</b></td><td><b>" + esc((q.answer || []).join(m > 1 ? ", " : " / ")) + "</b>" + (m > 1 ? "<br><small>any order; one mark per letter</small>" : "") + "</td><td>" + esc(g.type) + "</td></tr>"); n += m - 1; }); });
    });
    for (var i = 0; i < rows.length; i += 6) out.push(block('<table class="ap-tbl ap-key" style="width:100%">' + rows.slice(i, i + 6).join("") + "</table>"));
    return rows.length ? out : [];
  }
  function reportBody(p) {
    var a = p.attempt || {}, out = [];
    var big = a.kind === "m1" ? a.percent + "%" : a.kind === "sat" ? (a.estimate ? a.estimate : a.correct + "/" + a.total) : a.kind === "ielts-r" ? a.band : (a.band != null ? a.band : "—");
    var label = a.kind === "m1" ? "Correct answers (" + a.correct + "/" + a.total + ")" : a.kind === "sat" ? (a.estimate ? "Estimated Reading and Writing score (200–800)" : "Correct answers") : a.kind === "ielts-r" ? "Estimated Reading band (" + a.correct + "/" + a.total + ")" : (a.band != null ? "Writing band confirmed by " + (a.markedBy || "teacher") : "Waiting for the teacher's marks");
    out.push(block('<div class="ap-score"><b>' + esc(big) + "</b><div>" + esc(label) + "<br><small>" + esc(a.mode === "mock" ? "Full test" : a.mode === "set" ? "Full practice set" : "Practice") + " · " + esc(a.startedAt || "") + (a.finishedAt ? " → " + esc(a.finishedAt) : "") + " (UTC+7)</small></div></div>"));
    if (a.kind === "sat" && a.byDomain) out.push(block('<table class="ap-tbl" style="width:100%"><tr><th>Domain</th><th>Correct</th></tr>' + Object.keys(a.byDomain).filter(function (d) { return a.byDomain[d].t; }).map(function (d) { return "<tr><td>" + esc(DOM[d]) + "</td><td>" + a.byDomain[d].c + " / " + a.byDomain[d].t + "</td></tr>"; }).join("") + "</table>" +
      (a.modules ? "<p>" + a.modules.map(function (m) { return esc(m.key === "m1" ? "Module 1" : m.key === "m2" ? "Module 2" : "Practice") + ": " + m.correct + "/" + m.total; }).join(" · ") + (a.route ? " · module 2: " + (a.route === "hard" ? "harder set" : "easier set (ceiling ≈ " + a.ceiling + ")") : "") + "</p>" : "")));
    if (a.kind === "m1" && a.bySubject) out.push(block('<table class="ap-tbl" style="width:100%"><tr><th>Subject</th><th>Correct</th></tr>' + Object.keys(a.bySubject).map(function (k) { return "<tr><td>" + esc({ math: "Mathematics", sci: "Science", eng: "English", thai: "Thai" }[k] || k) + "</td><td>" + a.bySubject[k].c + " / " + a.bySubject[k].t + "</td></tr>"; }).join("") + "</table>"));
    var SUB = { math: "Mathematics · คณิตศาสตร์", sci: "Science · วิทยาศาสตร์", eng: "English · ภาษาอังกฤษ", thai: "Thai · ภาษาไทย", RW: "Reading & Writing", Reading: "Reading" };
    function bi(x) { x = x || {}; return esc(x.th && x.en && x.th !== x.en ? x.en + " · " + x.th : x.en || x.th || ""); }
    if ((a.targets || []).length) out.push(block('<table class="ap-tbl" style="width:100%"><tr><th>Target · เป้าหมาย</th><th>Result · ผล</th></tr>' + a.targets.map(function (g) {
      return "<tr><td>" + esc(g.en) + " — overall ≥ " + g.overall + "%" + Object.keys(g.subjects).map(function (k) { return ", " + esc(k) + " ≥ " + g.subjects[k] + "%"; }).join("") + "</td><td><b>" + (g.met ? "On target · ถึงเป้าหมาย" : "Not yet · ยังไม่ถึง") + "</b></td></tr>";
    }).join("") + '</table><p><small>Practice guidance, not school cut-offs. GATE and English Program applicants take the same Suankularb paper; EP applicants need a higher English score. · เป็นแนวทางฝึก ไม่ใช่เกณฑ์ของโรงเรียน</small></p>'));
    var PRT = { conversation: "A · Conversation · บทสนทนา", vocabulary: "B · Vocabulary · คำศัพท์", grammar: "C · Grammar · ไวยากรณ์", error: "D · Error identification · หาจุดผิด", cloze: "E · Cloze · เติมคำในบทความ", reading: "F · Reading · การอ่าน" };
    if ((a.byPart || []).length) out.push(block('<h2 class="ap-h2">By part · แยกตามตอน</h2><table class="ap-tbl" style="width:100%"><tr><th>Part · ตอน</th><th>Correct</th></tr>' + a.byPart.map(function (x) { return "<tr><td>" + esc(PRT[x.part] || x.part) + "</td><td>" + x.c + " / " + x.t + " (" + Math.round(x.c / x.t * 100) + "%)</td></tr>"; }).join("") + "</table>"));
    if ((a.byTopic || []).length) {
      var tops = a.byTopic.slice().sort(function (x, y) { return x.c / x.t - y.c / y.t; });
      for (var i = 0; i < tops.length; i += 18) out.push(block((i ? "" : '<h2 class="ap-h2">By topic (weakest first) · แยกตามเรื่อง</h2>') + '<table class="ap-tbl" style="width:100%"><tr><th>Subject</th><th>Topic · เรื่อง</th><th>Correct</th></tr>' +
        tops.slice(i, i + 18).map(function (x) { return "<tr><td>" + esc(SUB[x.subject] || x.subject) + "</td><td>" + bi(x.topic) + "</td><td>" + x.c + " / " + x.t + " (" + Math.round(x.c / x.t * 100) + "%)</td></tr>"; }).join("") + "</table>"));
    }
    if ((a.bySkill || []).length) out.push(block('<h2 class="ap-h2">By skill · แยกตามทักษะ</h2><table class="ap-tbl" style="width:100%"><tr><th>Domain</th><th>Skill</th><th>Correct</th></tr>' + a.bySkill.map(function (x) { return "<tr><td>" + esc(DOM[x.domain] || x.domain) + "</td><td>" + esc(x.skill.replace(/-/g, " ")) + "</td><td>" + x.c + " / " + x.t + "</td></tr>"; }).join("") + "</table>"));
    if ((a.rows || []).length) {
      for (var j = 0; j < a.rows.length; j += 22) out.push(block((j ? "" : '<h2 class="ap-h2">Every question · สรุปรายข้อ (what it measures · วัดอะไร เรื่องอะไร)</h2>') + '<table class="ap-tbl" style="width:100%;font-size:11px"><tr><th>No.</th><th>Subject</th><th>Measures · วัด</th><th>Topic · เรื่อง</th><th>Answer</th><th>Key</th><th></th></tr>' +
        a.rows.slice(j, j + 22).map(function (r) { return "<tr><td>" + esc(r.n) + "</td><td>" + esc(SUB[r.subject] || r.subject) + "</td><td>" + bi(r.skill) + "</td><td>" + bi(r.topic) + "</td><td>" + esc(r.answer) + "</td><td><b>" + esc(r.key) + "</b></td><td>" + (r.ok ? "✓" : "✗") + "</td></tr>"; }).join("") + "</table>"));
    }
    if (a.kind === "ielts-r" && a.passages) out.push(block('<table class="ap-tbl" style="width:100%"><tr><th>Passage</th><th>Correct</th></tr>' + a.passages.map(function (x) { return "<tr><td>" + esc(x.title) + "</td><td>" + x.correct + "</td></tr>"; }).join("") + "</table>"));
    if (a.kind === "ielts-w") {
      Object.keys(a.tasksInfo || {}).forEach(function (iid) {
        var c = (a.criteria || {})[iid];
        out.push(block("<h2 class=\"ap-h2\">Task " + a.tasksInfo[iid] + " · " + ((a.words || {})[iid] || 0) + " words</h2>" + (c ? '<table class="ap-tbl" style="width:100%"><tr>' + Object.keys(CRIT).map(function (k) { return "<th>" + CRIT[k] + "</th>"; }).join("") + "</tr><tr>" + Object.keys(CRIT).map(function (k) { return "<td>" + c[k] + "</td>"; }).join("") + "</tr></table><p>Task band: " + ((a.tasks || {})[iid]) + "</p>" : "<p>Not marked yet.</p>")));
      });
      if (a.comment) out.push(block('<div class="ap-box"><h2>Teacher comment · ความเห็นครู</h2>' + lines(a.comment) + "</div>"));
    }
    return out;
  }

  function build(p) {
    css();
    var doc = document.createElement("div"); doc.className = "ap-doc";
    var blocks = [header(p), disclaimer(p), instructions(p)].concat(p.kind === "paper" ? paperBody(p) : reportBody(p)).concat(p.kind === "paper" && p.withKey ? answerKey(p) : []).concat([legal(p), '<div class="ap-end"></div>']);
    doc.innerHTML = blocks.join('<div class="ap-gap"></div>');
    document.body.appendChild(doc);
    var imgs = Array.prototype.slice.call(doc.querySelectorAll("img"));
    return Promise.all(imgs.map(function (im) { return im.complete ? 0 : new Promise(function (r) { im.onload = im.onerror = r; }); })).then(function () { return document.fonts ? document.fonts.ready : 0; }).then(function () {
      var top0 = doc.getBoundingClientRect().top, W = doc.offsetWidth;
      var cuts = Array.prototype.slice.call(doc.querySelectorAll(".ap-block")).map(function (b) { var r = b.getBoundingClientRect(); return { top: r.top - top0, bottom: r.bottom - top0, brk: b.classList.contains("ap-break") }; });
      return window.html2canvas(doc, { scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false }).then(function (c) {
        document.body.removeChild(doc);
        var pdf = new window.jspdf.jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        var pw = pdf.internal.pageSize.getWidth(), ph = pdf.internal.pageSize.getHeight(), foot = 15;
        var k = c.width / W, mmPerPx = pw / c.width, pageH = Math.floor((ph - foot - 6) / mmPerPx);
        // choose page cuts at block edges (never through a question); forced break before the answer key
        var pages = [], y = 0;
        while (y < c.height - 2) {
          var limit = y + pageH, cut = limit;
          var fits = cuts.filter(function (b) { return b.bottom * k <= limit && b.bottom * k > y; });
          var brk = cuts.filter(function (b) { return b.brk && b.top * k > y + 10 && b.top * k < limit; })[0];
          if (brk) cut = Math.floor(brk.top * k) - 4;
          else if (fits.length && limit < c.height) cut = Math.ceil(fits[fits.length - 1].bottom * k) + 6;
          cut = Math.min(cut, c.height);
          if (cut <= y + 20) cut = Math.min(limit, c.height);
          pages.push([y, cut]); y = cut;
        }
        pages.forEach(function (pg, i) {
          var h = pg[1] - pg[0], part = document.createElement("canvas");
          part.width = c.width; part.height = h;
          var g = part.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, part.width, h); g.drawImage(c, 0, pg[0], c.width, h, 0, 0, c.width, h);
          if (i) pdf.addPage();
          pdf.addImage(part.toDataURL("image/jpeg", 0.9), "JPEG", 0, 4, pw, h * mmPerPx);
          // watermark + footer (ASCII only: the built-in PDF font has no Thai)
          if (pdf.GState) pdf.setGState(new pdf.GState({ opacity: 0.07 }));
          pdf.setTextColor(36, 87, 230); pdf.setFontSize(44);
          pdf.text("DeepDistrict  " + p.code, pw / 2, ph * 0.62, { angle: 30, align: "center" });
          if (pdf.GState) pdf.setGState(new pdf.GState({ opacity: 1 }));
          pdf.setDrawColor(200, 206, 220); pdf.line(10, ph - foot, pw - 10, ph - foot);
          pdf.setTextColor(90, 99, 120); pdf.setFontSize(7);
          pdf.text("DeepDistrict.si  |  " + (p.kind === "paper" ? (p.withKey ? "TEACHER COPY" : "Student copy") : "Score report") + "  |  Code " + p.code + "  |  Generated " + String(p.generatedAt).replace(/[^\x20-\x7e]/g, "") + "  |  Page " + (i + 1) + " of " + pages.length, 10, ph - foot + 4.5);
          pdf.text("(c) " + new Date().getFullYear() + " DeepDistrict.si - all rights reserved. Practice material, not an official SAT/IELTS test. Licensed for DeepDistrict classes only.", 10, ph - foot + 8);
          pdf.text("Verify this copy: " + verifyUrl(p.code), 10, ph - foot + 11.5);
        });
        pdf.setProperties({ title: p.title + " (" + p.code + ")", subject: p.kind === "paper" ? "DeepDistrict test paper" : "DeepDistrict score report", author: "DeepDistrict.si", creator: "DeepDistrict back office", keywords: p.code });
        return pdf.output("blob");
      });
    }).catch(function (e) { if (doc.parentNode) doc.parentNode.removeChild(doc); throw e; });
  }

  function save(p, api) {
    return build(p).then(function (blob) {
      var a = document.createElement("a"); a.href = URL.createObjectURL(blob);
      a.download = (p.kind === "paper" ? "paper" : "report") + "-" + p.code + ".pdf";
      document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
      if (api) api("POST", "doc/log", { code: p.code, action: "download" }).catch(function () {});
      return blob;
    });
  }
  window.DDPDF = { build: build, save: save, verifyUrl: verifyUrl };
})();
