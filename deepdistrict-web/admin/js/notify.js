/* ==========================================================================
   DeepDistrict back office — notifications (inbox, my settings, LINE),
   admin notification & LINE settings, and the installable app (PWA)
   ========================================================================== */
(function () {
  "use strict";
  var A = window.DDA, L = A.L, esc = A.esc, $ = A.$, $$ = A.$$;

  var EVENTS = {
    enrolment: ["New enrolment & schedule", "ลงทะเบียนเรียนและตารางเรียน", "learner"],
    receipt: ["Payment received (receipt)", "ได้รับชำระเงิน (ใบเสร็จ)", "learner"],
    request_new: ["New change request", "มีคำขอเปลี่ยนแปลงใหม่", "staff"],
    request_decided: ["Request approved / declined", "ผลการพิจารณาคำขอ", "learner"],
    lesson_changed: ["Lesson moved / cancelled", "เลื่อน / ยกเลิกคาบเรียน", "learner"],
    lesson_done: ["Lesson completed + hours left", "เรียนแล้ว + ชั่วโมงคงเหลือ", "learner"],
    reminder: ["Reminder the day before a lesson", "เตือนล่วงหน้า 1 วันก่อนเรียน", "learner"],
    low_hours: ["Hours running low", "ชั่วโมงใกล้หมด", "all"]
  };
  var EV_ICON = { enrolment: "📘", receipt: "🧾", request_new: "📨", request_decided: "✅", lesson_changed: "🔁", lesson_done: "🎓", reminder: "⏰", low_hours: "⏳", test: "🔔" };
  function evName(k) { var e = EVENTS[k]; return e ? L(e[0], e[1]) : k; }
  function forMe(k) { var w = EVENTS[k][2]; return w === "all" || (w === "staff") === A.isStaff() || A.isAdmin(); }
  function when(iso) { return new Date(iso).toLocaleString(A.lang === "th" ? "th-TH" : "en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); }
  function addFriendUrl(id) { return "https://line.me/R/ti/p/" + encodeURIComponent(id); }

  /* ------------------------------------------------------------ unread badge (bell + menu) */
  A.updateBell = function () {
    var n = A.db.inboxUnread || 0;
    $$("[data-bell]").forEach(function (b) { b.textContent = n > 99 ? "99+" : n || ""; b.hidden = !n; });
    $$('[data-nav="inbox"]').forEach(function (a) {
      var b = a.querySelector(".nav-badge");
      if (!n) { if (b) b.remove(); return; }
      if (!b && a.closest(".side")) { b = document.createElement("b"); b.className = "nav-badge"; a.appendChild(b); }
      if (b) b.textContent = n;
    });
    if (navigator.setAppBadge) { try { n ? navigator.setAppBadge(n) : navigator.clearAppBadge(); } catch (e) {} }
  };
  // my own notification settings and LINE link come in A.db.me (A.me is my users record, which is synced)
  var load = A.load;
  A.load = function () {
    return load.apply(A, arguments).then(function (d) {
      setTimeout(A.updateBell, 0); return d;
    });
  };

  /* ------------------------------------------------------------ inbox page */
  A.pages.inbox = function (q) {
    var tab = q.get("tab") === "prefs" ? "prefs" : "list";
    var tabs = '<nav class="tabs">' + [["list", L("Inbox", "กล่องแจ้งเตือน")], ["prefs", L("My settings & LINE", "ตั้งค่าของฉันและ LINE")]].map(function (t) {
      return '<a class="tab' + (t[0] === tab ? " is-on" : "") + '" href="#/inbox' + (t[0] === "list" ? "" : "?tab=" + t[0]) + '">' + t[1] + "</a>";
    }).join("") + (A.isAdmin() ? '<a class="tab" href="#/notify">' + L("Admin: notifications & LINE", "ผู้ดูแล: การแจ้งเตือนและ LINE") + "</a>" : "") + "</nav>";
    if (tab === "prefs") return { title: L("Notifications", "การแจ้งเตือน"), html: tabs + prefsHtml(), after: prefsAfter };
    return {
      title: L("Notifications", "การแจ้งเตือน"),
      actions: '<button class="btn" data-act="inbox-read">' + L("Mark all as read", "อ่านทั้งหมดแล้ว") + "</button>",
      html: tabs + '<section class="box"><ul class="list inbox" data-inbox><li class="muted">' + L("Loading…", "กำลังโหลด…") + "</li></ul></section>",
      after: function () {
        A.api("GET", "inbox").then(function (d) {
          var el = $("[data-inbox]"); if (!el) return;
          el.innerHTML = d.items.length ? d.items.map(function (n) {
            return '<li class="inbox__item' + (n.read ? "" : " is-new") + '"><span class="inbox__ico" aria-hidden="true">' + (EV_ICON[n.event] || "🔔") + "</span><div><p>" + esc(A.lang === "en" ? n.text_en : n.text_th) +
              '</p><small class="muted">' + esc(when(n.at)) + " · " + esc(evName(n.event)) + "</small></div></li>";
          }).join("") : "<li>" + A.empty("No notifications yet.", "ยังไม่มีการแจ้งเตือน") + "</li>";
          // opening the inbox marks everything as read (the list keeps the "new" highlight until next visit)
          if (A.db.inboxUnread) { A.api("POST", "inbox/read").then(function () { A.db.inboxUnread = 0; A.updateBell(); }).catch(function () {}); }
        }).catch(function (e) { A.toast(e.message, "err"); });
      }
    };
  };

  function prefsHtml() {
    var p = A.db.me.prefs || { lang: "th", channels: { email: true, line: true }, events: {} }, N = A.db.notify || { events: {}, line: {} };
    var line = N.line || {};
    var lineBox = !line.configured
      ? '<p class="muted">' + L("LINE notifications are not switched on by DeepDistrict yet.", "DeepDistrict ยังไม่ได้เปิดการแจ้งเตือนทาง LINE") + "</p>"
      : A.db.me.lineLinked
        ? '<p>✅ ' + L("Your LINE is connected. Messages come from the DeepDistrict LINE Official Account. In the chat you can also type \"schedule\" or \"hours\".", "เชื่อมต่อ LINE แล้ว ข้อความจะมาจาก LINE Official Account ของ DeepDistrict และพิมพ์ \"ตาราง\" หรือ \"ชั่วโมง\" ในแชทเพื่อดูข้อมูลได้") +
          '</p><div class="btnrow"><button class="btn btn--danger" type="button" data-act="line-unlink">' + L("Disconnect LINE", "ยกเลิกการเชื่อม LINE") + "</button></div>"
        : '<p class="muted">' + L("Get messages about lessons, requests and receipts in LINE. It takes one minute: add DeepDistrict as a friend and send a 6-digit code.", "รับข้อความเรื่องคาบเรียน คำขอ และใบเสร็จทาง LINE ใช้เวลาเพียง 1 นาที: เพิ่มเพื่อน DeepDistrict แล้วส่งรหัส 6 หลัก") +
          '</p><div class="btnrow"><button class="btn btn--primary" type="button" data-act="line-link">' + L("Connect LINE", "เชื่อมต่อ LINE") + "</button>" +
          (line.basicId ? '<a class="btn" href="' + addFriendUrl(line.basicId) + '" target="_blank" rel="noopener">' + L("Add friend ", "เพิ่มเพื่อน ") + esc(line.basicId) + "</a>" : "") + "</div>";
    var evs = Object.keys(EVENTS).filter(forMe).filter(function (k) { return N.events[k] !== false; });
    return '<section class="box"><header><h2>LINE</h2></header>' + lineBox + "</section>" +
      '<form class="box" data-prefs><header><h2>' + L("What and how", "เรื่องที่รับแจ้งและช่องทาง") + "</h2></header>" +
      '<p class="muted">' + L("Everything always appears in the Notifications inbox here. Also send me:", "ทุกเรื่องจะแสดงในกล่องแจ้งเตือนของระบบเสมอ และส่งให้ฉันทาง:") + "</p>" +
      '<div class="checks"><label><input type="checkbox" name="ch-email"' + (p.channels.email ? " checked" : "") + "> " + L("Email", "อีเมล") + " <small class=\"muted\">" + esc(A.me.email || "") + (N.smtp ? "" : " · " + L("email is not set up by DeepDistrict yet", "DeepDistrict ยังไม่ได้ตั้งค่าอีเมล")) + "</small></label>" +
      '<label><input type="checkbox" name="ch-line"' + (p.channels.line ? " checked" : "") + (A.db.me.lineLinked ? "" : " disabled") + "> LINE" + (A.db.me.lineLinked ? "" : ' <small class="muted">' + L("connect LINE first", "เชื่อมต่อ LINE ก่อน") + "</small>") + "</label></div>" +
      "<h3>" + L("About", "เรื่อง") + '</h3><div class="checks">' + evs.map(function (k) {
        return '<label><input type="checkbox" name="ev-' + k + '"' + (p.events[k] !== false ? " checked" : "") + "> " + (EV_ICON[k] || "") + " " + esc(evName(k)) + "</label>";
      }).join("") + "</div>" +
      "<h3>" + L("Language of email and LINE messages", "ภาษาของอีเมลและข้อความ LINE") + '</h3><div class="checks"><label><input type="radio" name="lang" value="th"' + (p.lang !== "en" ? " checked" : "") + "> ไทย</label><label><input type=\"radio\" name=\"lang\" value=\"en\"" + (p.lang === "en" ? " checked" : "") + "> English</label></div>" +
      '<div class="btnrow"><button class="btn btn--primary" type="submit">' + L("Save", "บันทึก") + "</button></div></form>";
  }
  function prefsAfter() {
    var f = $("[data-prefs]"); if (!f) return;
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var p = { lang: f.elements.lang.value, channels: { email: f.elements["ch-email"].checked, line: f.elements["ch-line"].checked }, events: {} };
      Object.keys(EVENTS).forEach(function (k) { var i = f.elements["ev-" + k]; p.events[k] = i ? i.checked : (A.db.me.prefs.events[k] !== false); });
      A.api("POST", "prefs", p).then(function (r) { A.db.me.prefs = r.prefs; A.toast(L("Saved", "บันทึกแล้ว")); }).catch(function (x) { A.toast(x.message, "err"); });
    });
  }

  /* LINE linking: the person gets a 6-digit code and sends it to the OA (free reply links the accounts) */
  function linkLine() {
    A.api("POST", "line/code").then(function (r) {
      var id = r.basicId, msg = id ? "https://line.me/R/oaMessage/" + encodeURIComponent(id) + "/?" + encodeURIComponent(r.code) : "";
      var dlg = document.createElement("dialog");
      dlg.className = "modal";
      dlg.innerHTML = '<div class="modal__box"><header><h2>' + L("Connect LINE", "เชื่อมต่อ LINE") + '</h2><button type="button" class="ibtn" data-x aria-label="Close">✕</button></header>' +
        '<ol class="steps"><li>' + L("Add DeepDistrict as a friend in LINE", "เพิ่มเพื่อน DeepDistrict ใน LINE") + (id ? ': <a href="' + addFriendUrl(id) + '" target="_blank" rel="noopener"><b>' + esc(id) + "</b></a>" : "") + "</li>" +
        "<li>" + L("Send this code in the chat (valid 30 minutes):", "ส่งรหัสนี้ในแชท (ใช้ได้ 30 นาที):") + '<p class="code-big" data-code>' + esc(r.code) + "</p>" +
        (msg ? '<a class="btn btn--primary" href="' + msg + '" target="_blank" rel="noopener">' + L("Open LINE and send the code", "เปิด LINE และส่งรหัส") + "</a>" : "") + "</li>" +
        "<li>" + L("DeepDistrict replies \"Linked\". Then press Done.", "DeepDistrict จะตอบว่า \"เชื่อมต่อแล้ว\" แล้วกด เสร็จสิ้น") + "</li></ol>" +
        '<footer><span class="spacer"></span><button type="button" class="btn btn--primary" data-done-link>' + L("Done", "เสร็จสิ้น") + "</button></footer></div>";
      document.body.appendChild(dlg);
      function close() { dlg.close(); dlg.remove(); }
      $$("[data-x]", dlg).forEach(function (b) { b.addEventListener("click", close); });
      dlg.addEventListener("cancel", function (e) { e.preventDefault(); close(); });
      $("[data-done-link]", dlg).addEventListener("click", function () {
        A.load().then(function () {
          close(); A.route();
          A.toast(A.db.me.lineLinked ? L("LINE connected", "เชื่อมต่อ LINE แล้ว") : L("Not connected yet — send the code in LINE first.", "ยังไม่เชื่อมต่อ — กรุณาส่งรหัสใน LINE ก่อน"), A.db.me.lineLinked ? "" : "err");
        });
      });
      dlg.showModal();
    }).catch(function (e) { A.toast(e.message, "err"); });
  }

  /* ------------------------------------------------------------ admin: notifications & LINE */
  var CH = { off: "–", queued: "…", sent: "✓", failed: "✗", quota: "⛔" };
  A.pages.notify = function () {
    if (!A.isAdmin()) return A.pages.inbox(new URLSearchParams());
    return {
      title: L("Notifications & LINE", "การแจ้งเตือนและ LINE"),
      actions: '<button class="btn" data-act="notify-run">' + L("Send now", "ส่งตอนนี้") + "</button>",
      html: '<nav class="tabs"><a class="tab" href="#/inbox">' + L("Inbox", "กล่องแจ้งเตือน") + '</a><a class="tab" href="#/inbox?tab=prefs">' + L("My settings & LINE", "ตั้งค่าของฉันและ LINE") + '</a><a class="tab is-on" href="#/notify">' + L("Admin: notifications & LINE", "ผู้ดูแล: การแจ้งเตือนและ LINE") + "</a></nav>" +
        '<div data-nadmin><p class="muted">' + L("Loading…", "กำลังโหลด…") + "</p></div>",
      after: function () { A.api("GET", "notify").then(renderAdmin).catch(function (e) { A.toast(e.message, "err"); }); }
    };
  };
  var last;
  function renderAdmin(d) {
    last = d;
    var el = $("[data-nadmin]"); if (!el) return;
    var st = d.settings, ln = d.line, pct = Math.min(100, Math.round(100 * d.used / Math.max(1, st.quota)));
    var name = function (id) { var u = A.byId("users", id); return u ? u.name : id; };
    el.innerHTML =
      '<div class="grid2"><section class="box"><header><h2>LINE Official Account</h2><button class="btn" data-act="line-config">' + L("Set up", "ตั้งค่า") + "</button></header>" +
      (ln.configured
        ? '<dl class="dl"><dt>' + L("Status", "สถานะ") + "</dt><dd>✅ " + L("Connected", "เชื่อมต่อแล้ว") + (ln.hasSecret ? "" : " · ⚠ " + L("channel secret missing (needed for linking)", "ยังไม่ได้ใส่ channel secret (จำเป็นสำหรับการเชื่อมบัญชี)")) + "</dd>" +
          "<dt>LINE ID</dt><dd>" + (ln.basicId ? '<a href="' + addFriendUrl(ln.basicId) + '" target="_blank" rel="noopener">' + esc(ln.basicId) + "</a>" : "–") + "</dd>" +
          "<dt>" + L("Pushes this month", "ข้อความ push เดือนนี้") + "</dt><dd>" + d.used + " / " + st.quota + ' <span class="meter"><i style="width:' + pct + '%"></i></span></dd>' +
          "<dt>" + L("People linked", "ผู้ที่เชื่อม LINE แล้ว") + "</dt><dd>" + (d.linked.length ? d.linked.map(function (id) { return esc(name(id)); }).join(", ") : "–") + "</dd>" +
          "<dt>Webhook URL</dt><dd><code>" + esc(d.webhook) + "</code></dd></dl>" +
          '<div class="btnrow"><button class="btn" data-act="line-test">' + L("Send me a test message", "ส่งข้อความทดสอบถึงฉัน") + "</button></div>"
        : '<p class="muted">' + L("Not set up. Free plan: about 300 push messages a month; replies in the chat are free. Steps: create a LINE Official Account → enable Messaging API → copy the Channel access token and Channel secret here → paste the webhook URL below into LINE Developers and turn on \"Use webhook\".", "ยังไม่ได้ตั้งค่า แพ็กเกจฟรีส่ง push ได้ประมาณ 300 ข้อความ/เดือน การตอบกลับในแชทไม่นับ ขั้นตอน: สร้าง LINE Official Account → เปิด Messaging API → คัดลอก Channel access token และ Channel secret มาใส่ที่นี่ → นำ Webhook URL ด้านล่างไปใส่ใน LINE Developers และเปิด \"Use webhook\"") +
          "</p><p>Webhook URL: <code>" + esc(d.webhook) + "</code></p>") +
      "</section>" +
      '<section class="box"><header><h2>' + L("Rules", "กติกา") + '</h2><button class="btn" data-act="notify-settings">' + L("Edit", "แก้ไข") + "</button></header>" +
      '<dl class="dl"><dt>' + L("Events switched on", "เรื่องที่เปิดแจ้ง") + "</dt><dd>" + Object.keys(EVENTS).filter(function (k) { return st.events[k] !== false; }).map(evName).map(esc).join(" · ") + "</dd>" +
      "<dt>" + L("Reminders sent from", "ส่งเตือนล่วงหน้าตั้งแต่") + "</dt><dd>" + st.reminderHour + ":00 " + L("the day before", "ของวันก่อนเรียน") + "</dd>" +
      "<dt>" + L("LINE monthly limit", "จำกัด LINE ต่อเดือน") + "</dt><dd>" + st.quota + " " + L("pushes (then email / inbox only)", "ข้อความ (เกินแล้วส่งอีเมล / ในระบบเท่านั้น)") + "</dd>" +
      "<dt>" + L("Email", "อีเมล") + "</dt><dd>" + (A.db.notify && A.db.notify.smtp ? "✅" : L("not set up (Settings → Email)", "ยังไม่ได้ตั้งค่า (ตั้งค่า → อีเมล)")) + "</dd>" +
      "<dt>" + L("Online hosting timer", "ตัวตั้งเวลาเมื่อขึ้นโฮสต์") + "</dt><dd><code>" + esc(d.cron) + "</code><br><small class=\"muted\">" + L("Only needed if the host stops background work (e.g. PythonAnywhere free): call this address every 10–15 minutes from a free cron service.", "ใช้เฉพาะเมื่อโฮสต์ไม่รันงานเบื้องหลัง (เช่น PythonAnywhere ฟรี): ให้บริการ cron ฟรีเรียกลิงก์นี้ทุก 10–15 นาที") + "</small></dd></dl></section></div>" +
      '<section class="box"><header><h2>' + L("Sent log", "ประวัติการส่ง") + '</h2></header><p class="muted">' + L("✓ sent · ✗ failed · ⛔ monthly LINE limit · … waiting · – not sent on this channel", "✓ ส่งแล้ว · ✗ ไม่สำเร็จ · ⛔ เกินโควตา LINE · … รอส่ง · – ไม่ได้ส่งทางนี้") + "</p>" +
      (d.log.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>' + L("When", "เวลา") + "</th><th>" + L("To", "ถึง") + "</th><th>" + L("Message", "ข้อความ") + "</th><th>" + L("Email", "อีเมล") + "</th><th>LINE</th></tr></thead><tbody>" +
        d.log.map(function (n) {
          return "<tr><td>" + esc(when(n.at)) + "</td><td>" + esc(name(n.user_id)) + "</td><td>" + (EV_ICON[n.event] || "") + " " + esc(A.lang === "en" ? n.text_en : n.text_th) + (n.error ? '<br><small class="txt-err">' + esc(n.error) + "</small>" : "") +
            '</td><td class="ctr" title="' + esc(n.email) + '">' + CH[n.email] + '</td><td class="ctr" title="' + esc(n.line) + '">' + CH[n.line] + "</td></tr>";
        }).join("") + "</tbody></table></div>" : A.empty("Nothing sent yet.", "ยังไม่มีการส่ง")) + "</section>";
  }
  function editSettings() {
    var st = last.settings;
    A.form({
      title: L("Notification rules", "กติกาการแจ้งเตือน"),
      fields: Object.keys(EVENTS).map(function (k) { return { name: "ev_" + k, label: (EV_ICON[k] || "") + " " + evName(k), type: "checkbox", value: st.events[k] !== false, full: true }; }).concat([
        { name: "reminderHour", label: L("Send day-before reminders from (hour, Bangkok time)", "ส่งเตือนล่วงหน้าตั้งแต่ (ชั่วโมง เวลาไทย)"), type: "number", min: 0, step: "1", value: st.reminderHour, required: true },
        { name: "quota", label: L("LINE pushes per month (free plan ≈ 300)", "จำนวน push ทาง LINE ต่อเดือน (ฟรี ≈ 300)"), type: "number", min: 0, step: "1", value: st.quota, required: true }
      ]),
      validate: function (v) { if (v.reminderHour > 23) return L("Hour must be 0–23.", "ชั่วโมงต้องอยู่ระหว่าง 0–23"); },
      onSave: function (v) {
        var body = { events: {}, reminderHour: v.reminderHour, quota: v.quota };
        Object.keys(EVENTS).forEach(function (k) { body.events[k] = v["ev_" + k]; });
        return A.api("POST", "notify", body).then(function () { A.toast(L("Saved", "บันทึกแล้ว")); A.load().then(function () { A.route(); }); }).catch(function (e) { A.toast(e.message, "err"); return false; });
      }
    });
  }
  function editLine() {
    var ln = last.line;
    A.form({
      title: "LINE Official Account",
      intro: esc(L("From LINE Developers → your Messaging API channel. The token and secret are kept on the server and never shown again; leave them empty to keep the saved ones.", "จาก LINE Developers → ช่อง Messaging API ของคุณ ระบบเก็บ token และ secret ไว้บนเซิร์ฟเวอร์และจะไม่แสดงอีก เว้นว่างไว้หากต้องการใช้ค่าเดิม")),
      fields: [
        { name: "token", label: "Channel access token (long-lived)", type: "password", autocomplete: "off", required: !ln.configured },
        { name: "secret", label: "Channel secret", type: "password", autocomplete: "off", required: !ln.hasSecret },
        { name: "basicId", label: L("LINE ID of the account (e.g. @123abcde)", "LINE ID ของบัญชี (เช่น @123abcde)"), value: ln.basicId },
        { name: "liffId", label: L("LIFF ID (optional, for opening the portal inside LINE)", "LIFF ID (ไม่บังคับ สำหรับเปิดระบบใน LINE)"), value: ln.liffId }
      ],
      extra: ln.configured ? '<button type="button" class="btn btn--danger" data-line-clear>' + L("Remove LINE", "ลบการตั้งค่า LINE") + "</button>" : "",
      onSave: function (v) {
        return A.api("POST", "line/config", v).then(function () { A.toast(L("Saved", "บันทึกแล้ว")); A.load().then(function () { A.route(); }); }).catch(function (e) { A.toast(e.message, "err"); return false; });
      }
    });
    var c = $("[data-line-clear]");
    if (c) c.addEventListener("click", function () {
      if (!confirm(L("Remove the LINE settings? Linked people stay linked if you add the same account again.", "ลบการตั้งค่า LINE? ผู้ที่เชื่อมไว้จะยังเชื่อมอยู่หากใส่บัญชีเดิมอีกครั้ง"))) return;
      A.api("POST", "line/config", { clear: true }).then(function () { $("dialog.modal").remove(); A.load().then(function () { A.route(); }); });
    });
  }

  /* ------------------------------------------------------------ installable app (PWA) */
  var installEvt = null;
  window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); installEvt = e; showInstall(); });
  window.addEventListener("appinstalled", function () { installEvt = null; showInstall(); });
  function standalone() { return (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true; }
  function showInstall() {
    $$('[data-act="install"]').forEach(function (b) { b.hidden = !installEvt; });
    var tip = $("[data-ios-tip]"), ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (tip) {
      tip.hidden = standalone() || !(ios || !installEvt);
      tip.textContent = standalone() ? "" : ios
        ? L("iPhone / iPad: open this page in Safari, tap Share ⬆ then \"Add to Home Screen\". DeepDistrict then opens like an app.", "iPhone / iPad: เปิดหน้านี้ใน Safari กดปุ่มแชร์ ⬆ แล้วเลือก \"เพิ่มไปยังหน้าจอโฮม\" DeepDistrict จะเปิดได้เหมือนแอป")
        : L("To install: open the browser menu (⋮) and choose \"Install app\" or \"Add to Home screen\".", "วิธีติดตั้ง: เปิดเมนูของเบราว์เซอร์ (⋮) แล้วเลือก \"ติดตั้งแอป\" หรือ \"เพิ่มลงในหน้าจอหลัก\"");
    }
  }
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); });
  }
  if (standalone()) document.documentElement.classList.add("is-app");

  /* ------------------------------------------------------------ actions */
  var prev = A.onAct;
  A.onAct = function (act, b, ev) {
    if (act === "inbox-read") A.api("POST", "inbox/read").then(function () { A.db.inboxUnread = 0; A.updateBell(); $$(".inbox__item.is-new").forEach(function (li) { li.classList.remove("is-new"); }); });
    else if (act === "line-link") linkLine();
    else if (act === "line-unlink") { if (confirm(L("Stop LINE messages and disconnect?", "หยุดรับข้อความทาง LINE และยกเลิกการเชื่อม?"))) A.api("POST", "line/unlink").then(A.load).then(function () { A.route(); }); }
    else if (act === "line-config") editLine();
    else if (act === "notify-settings") editSettings();
    else if (act === "line-test") A.api("POST", "line/test").then(function () { A.toast(L("Test message queued — check your LINE.", "ส่งข้อความทดสอบแล้ว — ตรวจสอบใน LINE")); setTimeout(A.route, 2500); }).catch(function (e) { A.toast(e.message, "err"); });
    else if (act === "notify-run") A.api("POST", "notify/run").then(function () { A.toast(L("Sending…", "กำลังส่ง…")); setTimeout(A.route, 2500); }).catch(function (e) { A.toast(e.message, "err"); });
    else if (act === "install" && installEvt) { installEvt.prompt(); installEvt.userChoice.then(function () { installEvt = null; showInstall(); }); }
    else if (prev) prev(act, b, ev);
  };
  // the route renders fresh HTML each time: re-apply the install button state and the badge
  var route = A.route;
  A.route = function (to) { var r = route.apply(A, arguments); if (!to) { showInstall(); A.updateBell(); } return r; };
})();
