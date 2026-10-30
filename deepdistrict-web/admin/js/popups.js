/* ==========================================================================
   DeepDistrict back office — pop-up promotions for the public website
   Create / edit / duplicate / delete, switch each one (and the whole feature)
   on or off, and schedule by date range, weekdays and daily hours.
   ========================================================================== */
(function () {
  "use strict";
  var A = window.DDA, L = A.L, esc = A.esc, $ = A.$, $$ = A.$$;

  var PAGE_NAMES = {
    all: ["All pages (not the privacy page)", "ทุกหน้า (ยกเว้นหน้านโยบายความเป็นส่วนตัว)"], home: ["Home", "หน้าแรก"], programs: ["Programs", "หลักสูตร"],
    admissions: ["Admissions", "สอบเข้ามหาลัย"], si: ["What is SI?", "SI คืออะไร"], innovation: ["Innovation Lab", "แล็บนวัตกรรม"], research: ["Research", "วิจัย"],
    stem: ["Youth STEM", "STEM เยาวชน"], partners: ["Partners", "พันธมิตร"], about: ["About", "เกี่ยวกับเรา"], contact: ["Contact", "ติดต่อ"], blog: ["News", "ข่าวสาร"]
  };
  var FREQ = { visit: ["Every visit", "ทุกครั้งที่เข้าเว็บ"], day: ["Once a day", "วันละครั้ง"], once: ["Only once", "ครั้งเดียว"] };
  var STATUS = {
    live: ["Showing now", "กำลังแสดง", "done"], scheduled: ["Scheduled", "ตั้งเวลาไว้", "scheduled"], waiting: ["Outside its days / hours", "อยู่นอกวัน / ช่วงเวลา", "paused"],
    ended: ["Ended", "สิ้นสุดแล้ว", "completed"], off: ["Off", "ปิดอยู่", "cancelled"]
  };
  var state = null;

  function load() { return A.api("GET", "popups-admin").then(function (d) { state = d; return d; }); }
  function save(body) {
    return A.api("POST", "popups-admin", body).then(function (r) { return load().then(function () { draw(); return r; }); })
      .catch(function (e) { A.toast(e.message, "err"); throw e; });
  }
  function fmt(dt) { return dt ? new Date(dt + ":00+07:00").toLocaleString(A.lang === "th" ? "th-TH" : "en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok" }) : ""; }
  function when(p) {
    var range = p.start && p.end ? fmt(p.start) + " – " + fmt(p.end) : p.start ? L("From ", "ตั้งแต่ ") + fmt(p.start) : p.end ? L("Until ", "จนถึง ") + fmt(p.end) : L("No end date", "ไม่กำหนดวันสิ้นสุด");
    var days = p.days && p.days.length && p.days.length < 7 ? p.days.map(function (d) { return A.dayName(d, true); }).join(" ") : L("every day", "ทุกวัน");
    var hours = p.dailyFrom ? p.dailyFrom + "–" + p.dailyTo : L("all day", "ทั้งวัน");
    return esc(range) + '<br><small class="muted">' + esc(days) + " · " + esc(hours) + "</small>";
  }
  function pagesText(p) { return (p.pages || ["all"]).map(function (k) { var n = PAGE_NAMES[k]; return n ? L(n[0], n[1]) : k; }).join(", "); }
  function title(p) { return (A.lang === "th" ? p.title.th || p.title.en : p.title.en || p.title.th) || p.name; }

  /* ------------------------------------------------------------ page */
  A.pages.popups = function () {
    if (!A.isAdmin()) return A.pages.dashboard(new URLSearchParams());
    return {
      title: L("Pop-up promotions", "ป๊อปอัปโปรโมชัน"),
      actions: '<button class="btn btn--primary" data-act="popup-new">+ ' + L("New pop-up", "สร้างป๊อปอัป") + "</button>",
      html: '<div data-popups><p class="muted">' + L("Loading…", "กำลังโหลด…") + "</p></div>",
      after: function () { load().then(draw).catch(function (e) { A.toast(e.message, "err"); }); }
    };
  };

  function draw() {
    var el = $("[data-popups]"); if (!el || !state) return;
    var on = state.enabled, live = state.items.filter(function (p) { return p.status === "live"; });
    el.innerHTML =
      '<section class="box popups-switch' + (on ? " is-on" : "") + '"><div><h2>' + L("Pop-ups on the website", "ป๊อปอัปบนเว็บไซต์") + " · " + (on ? '<span class="ok">' + L("ON", "เปิด") + "</span>" : '<span class="off">' + L("OFF", "ปิด") + "</span>") + "</h2>" +
      '<p class="muted">' + (on ? (live.length ? L("Visitors now see: ", "ผู้เข้าชมจะเห็นตอนนี้: ") + esc(title(live[0])) + (live.length > 1 ? L(" (and " + (live.length - 1) + " more by priority)", " (และอีก " + (live.length - 1) + " รายการตามลำดับความสำคัญ)") : "") : L("No pop-up is live at this moment.", "ขณะนี้ไม่มีป๊อปอัปที่กำลังแสดง"))
        : L("Switched off: no pop-up is shown, whatever the schedules say.", "ปิดอยู่: จะไม่มีป๊อปอัปแสดง ไม่ว่าตั้งเวลาไว้อย่างไร")) +
      "<br>" + L("Bangkok time now: ", "เวลาปัจจุบัน (กรุงเทพฯ): ") + esc(fmt(state.now)) + ". " + L("One pop-up per visit at most, after the cookie choice; never on the privacy page.", "แสดงไม่เกินหนึ่งป๊อปอัปต่อการเข้าชม หลังผู้ชมตอบเรื่องคุกกี้แล้ว และไม่แสดงในหน้านโยบายความเป็นส่วนตัว") + "</p></div>" +
      '<button class="btn ' + (on ? "btn--danger" : "btn--primary") + '" data-act="popups-global">' + (on ? L("Turn off", "ปิดฟีเจอร์") : L("Turn on", "เปิดฟีเจอร์")) + "</button></section>" +
      (state.items.length ? '<div class="tbl-wrap"><table class="tbl popups-tbl"><thead><tr><th></th><th>' + L("Pop-up", "ป๊อปอัป") + "</th><th>" + L("When", "ช่วงเวลา") + "</th><th>" + L("Pages · frequency", "หน้า · ความถี่") + "</th><th>" + L("Status", "สถานะ") + "</th><th>" + L("On", "เปิด") + "</th><th></th></tr></thead><tbody>" +
        state.items.slice().sort(function (a, b) { return (b.priority || 0) - (a.priority || 0); }).map(function (p) {
          var st = !on && p.status === "live" ? ["Ready (feature is off)", "พร้อม (ฟีเจอร์ปิดอยู่)", "paused"] : STATUS[p.status] || STATUS.off;
          return "<tr><td>" + (p.image ? '<img class="popups-thumb" src="' + esc(p.image) + '" alt="">' : '<span class="popups-thumb popups-thumb--none">—</span>') + "</td>" +
            "<td><b>" + esc(title(p)) + "</b>" + (p.name ? '<br><small class="muted">' + esc(p.name) + "</small>" : "") + (p.priority ? '<br><small class="muted">' + L("Priority ", "ลำดับความสำคัญ ") + p.priority + "</small>" : "") + "</td>" +
            "<td>" + when(p) + "</td><td>" + esc(pagesText(p)) + '<br><small class="muted">' + esc(L(FREQ[p.frequency][0], FREQ[p.frequency][1])) + "</small></td>" +
            "<td>" + A.badge(st[2], L(st[0], st[1])) + "</td>" +
            '<td><label class="switch-sm"><input type="checkbox" data-popup-toggle="' + esc(p.id) + '"' + (p.enabled ? " checked" : "") + ' aria-label="' + esc(L("Switch on/off", "เปิด/ปิด")) + '"><span></span></label></td>' +
            '<td class="popups-act"><button class="btn btn--sm" data-act="popup-edit" data-id="' + esc(p.id) + '">' + L("Edit", "แก้ไข") + '</button><button class="btn btn--sm" data-act="popup-preview" data-id="' + esc(p.id) + '">' + L("Preview", "ดูตัวอย่าง") + '</button><button class="btn btn--sm" data-act="popup-copy" data-id="' + esc(p.id) + '">' + L("Duplicate", "คัดลอก") + "</button></td></tr>";
        }).join("") + "</tbody></table></div>"
        : A.empty("No pop-ups yet. Create one for an open house, a new course or a holiday schedule.", "ยังไม่มีป๊อปอัป สร้างสำหรับวันเปิดบ้าน คอร์สใหม่ หรือประกาศวันหยุดได้", '<button class="btn btn--primary" data-act="popup-new">+ ' + L("New pop-up", "สร้างป๊อปอัป") + "</button>"));
    $$("[data-popup-toggle]", el).forEach(function (cb) {
      cb.addEventListener("change", function () { save({ toggle: { id: cb.getAttribute("data-popup-toggle"), enabled: cb.checked } }).then(function () { A.toast(cb.checked ? L("Switched on", "เปิดแล้ว") : L("Switched off", "ปิดแล้ว")); }); });
    });
  }

  /* ------------------------------------------------------------ editor */
  function edit(p, copy) {
    var isNew = !p || copy;
    p = p ? JSON.parse(JSON.stringify(p)) : { enabled: true, title: {}, text: {}, button: {}, pages: ["all"], frequency: "visit", days: [], delay: 1, priority: 0 };
    if (copy) { delete p.id; p.name = (p.name || title(p)) + L(" (copy)", " (สำเนา)"); p.enabled = false; }
    A.form({
      title: isNew ? L("New pop-up", "สร้างป๊อปอัป") : L("Edit pop-up", "แก้ไขป๊อปอัป"),
      intro: esc(L("Times are Bangkok time. Leave start/end empty for no limit; leave weekdays unticked and hours empty for every day, all day.", "เวลาเป็นเวลากรุงเทพฯ เว้นวันเริ่ม/สิ้นสุดว่างไว้หากไม่จำกัด ไม่ติ๊กวันและเว้นช่วงเวลาว่างไว้ หากต้องการแสดงทุกวันตลอดวัน")),
      fields: [
        { name: "enabled", label: L("Switched on", "เปิดใช้งาน"), type: "checkbox", value: p.enabled !== false, full: true },
        { name: "name", label: L("Internal name (only staff see it)", "ชื่อเรียกภายใน (เห็นเฉพาะเจ้าหน้าที่)"), value: p.name, full: true },
        { name: "titleEn", label: L("Title (English)", "หัวข้อ (อังกฤษ)"), value: p.title.en },
        { name: "titleTh", label: L("Title (Thai)", "หัวข้อ (ไทย)"), value: p.title.th },
        { name: "textEn", label: L("Message (English)", "ข้อความ (อังกฤษ)"), type: "textarea", value: p.text.en },
        { name: "textTh", label: L("Message (Thai)", "ข้อความ (ไทย)"), type: "textarea", value: p.text.th },
        { name: "image", label: L("Image (optional)", "รูปภาพ (ไม่บังคับ)"), type: "image", value: p.image, hint: L("PNG, JPEG or WebP; it is resized to at most 1200 px. A wide image (e.g. 1200×630) looks best.", "PNG, JPEG หรือ WebP ระบบย่อให้ไม่เกิน 1200 px รูปแนวนอน (เช่น 1200×630) จะสวยที่สุด") },
        { name: "btnEn", label: L("Button text (English)", "ข้อความปุ่ม (อังกฤษ)"), value: p.button.en },
        { name: "btnTh", label: L("Button text (Thai)", "ข้อความปุ่ม (ไทย)"), value: p.button.th },
        { name: "link", label: L("Button link", "ลิงก์ของปุ่ม"), value: p.link, full: true, hint: L("e.g. pages/contact.html?topic=courses#form, pages/admissions.html or https://…", "เช่น pages/contact.html?topic=courses#form, pages/admissions.html หรือ https://…") },
        { name: "start", label: L("Start (date & time)", "เริ่ม (วันและเวลา)"), type: "datetime-local", value: p.start },
        { name: "end", label: L("End (date & time)", "สิ้นสุด (วันและเวลา)"), type: "datetime-local", value: p.end },
        { name: "dailyFrom", label: L("Each day from", "แต่ละวันตั้งแต่เวลา"), type: "time", value: p.dailyFrom },
        { name: "dailyTo", label: L("Each day until", "แต่ละวันถึงเวลา"), type: "time", value: p.dailyTo },
        { name: "days", label: L("Only on these weekdays (none ticked = every day)", "เฉพาะวันเหล่านี้ (ไม่ติ๊ก = ทุกวัน)"), type: "days", value: p.days },
        { name: "pages", label: L("Show on", "แสดงในหน้า"), type: "checks", value: p.pages, options: Object.keys(PAGE_NAMES).map(function (k) { return [k, L(PAGE_NAMES[k][0], PAGE_NAMES[k][1])]; }), hint: L("\"All pages\" wins if ticked.", "ถ้าติ๊ก \"ทุกหน้า\" จะใช้ทุกหน้า") },
        { name: "frequency", label: L("How often a visitor sees it", "ผู้ชมเห็นบ่อยแค่ไหน"), type: "select", value: p.frequency, options: Object.keys(FREQ).map(function (k) { return [k, L(FREQ[k][0], FREQ[k][1])]; }) },
        { name: "delay", label: L("Delay after the page opens (seconds)", "หน่วงเวลาหลังเปิดหน้า (วินาที)"), type: "number", min: 0, step: "1", value: p.delay },
        { name: "priority", label: L("Priority (higher shows first)", "ลำดับความสำคัญ (มากกว่าแสดงก่อน)"), type: "number", step: "1", value: p.priority }
      ],
      onDelete: isNew ? null : function () { save({ delete: p.id }).then(function () { A.toast(L("Deleted", "ลบแล้ว")); }); },
      validate: function (v) {
        if (!v.titleEn && !v.titleTh) return L("Give a title in English or Thai.", "กรุณาใส่หัวข้อภาษาอังกฤษหรือไทย");
        if (v.start && v.end && v.end <= v.start) return L("The end must be after the start.", "เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่ม");
        if (!!v.dailyFrom !== !!v.dailyTo) return L("Give both daily times, or neither.", "กรุณาใส่เวลาเริ่มและสิ้นสุดของแต่ละวันให้ครบ หรือเว้นว่างทั้งคู่");
        if ((v.btnEn || v.btnTh) && !v.link) return L("A button needs a link.", "ปุ่มต้องมีลิงก์");
      },
      onSave: function (v) {
        var item = { id: copy ? undefined : p.id, enabled: v.enabled, name: v.name, title: { en: v.titleEn, th: v.titleTh }, text: { en: v.textEn, th: v.textTh }, image: v.image,
          button: { en: v.btnEn, th: v.btnTh }, link: v.link, start: v.start, end: v.end, dailyFrom: v.dailyFrom, dailyTo: v.dailyTo, days: v.days,
          pages: v.pages.length ? v.pages : ["all"], frequency: v.frequency, delay: v.delay || 0, priority: v.priority || 0 };
        return save({ save: item }).then(function () { A.toast(L("Saved", "บันทึกแล้ว")); }).catch(function () { return false; });
      }
    });
  }

  /* ------------------------------------------------------------ preview (as visitors will see it) */
  function preview(p) {
    var dlg = document.createElement("dialog");
    dlg.className = "modal promo-prev";
    var t = A.lang === "th" ? "th" : "en", o = t === "th" ? "en" : "th";
    function pick(v) { return (v && (v[t] || v[o])) || ""; }
    dlg.innerHTML = '<div class="promo-prev__box">' + (p.image ? '<img src="' + esc(p.image) + '" alt="">' : "") +
      '<div class="promo-prev__body"><span class="promo-prev__tag">' + L("Promotion", "โปรโมชัน") + "</span><h2>" + esc(pick(p.title)) + "</h2>" + (pick(p.text) ? "<p>" + esc(pick(p.text)) + "</p>" : "") +
      '<div class="btnrow">' + (pick(p.button) ? '<span class="btn btn--primary">' + esc(pick(p.button)) + "</span>" : "") + '<button type="button" class="btn" data-x>' + L("Close preview", "ปิดตัวอย่าง") + "</button></div>" +
      '<p class="muted promo-prev__note">' + L("Preview in the current back-office language. Visitors see their own language.", "ตัวอย่างในภาษาที่เลือกในระบบหลังบ้าน ผู้ชมจะเห็นตามภาษาที่ตนเลือก") + "</p></div></div>";
    document.body.appendChild(dlg);
    function close() { dlg.close(); dlg.remove(); }
    dlg.addEventListener("click", function (e) { if (e.target === dlg || e.target.closest("[data-x]")) close(); });
    dlg.addEventListener("cancel", function (e) { e.preventDefault(); close(); });
    dlg.showModal();
  }

  function byId(id) { return state && state.items.filter(function (p) { return p.id === id; })[0]; }
  var prev = A.onAct;
  A.onAct = function (act, b, ev) {
    if (act === "popup-new") edit(null);
    else if (act === "popup-edit") edit(byId(b.getAttribute("data-id")));
    else if (act === "popup-copy") edit(byId(b.getAttribute("data-id")), true);
    else if (act === "popup-preview") preview(byId(b.getAttribute("data-id")));
    else if (act === "popups-global") {
      var on = !state.enabled;
      if (!on && !confirm(L("Turn off all pop-ups on the website?", "ปิดป๊อปอัปทั้งหมดบนเว็บไซต์?"))) return;
      save({ enabled: on }).then(function () { A.toast(on ? L("Pop-ups switched on", "เปิดป๊อปอัปแล้ว") : L("Pop-ups switched off", "ปิดป๊อปอัปแล้ว")); });
    }
    else if (prev) prev(act, b, ev);
  };
})();
