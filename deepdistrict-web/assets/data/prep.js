/* ==========================================================================
   DeepDistrict.si — test-prep catalogue by category (default content)
   (loads after pathways.js)
   --------------------------------------------------------------------------
   Six categories, as offered by the Admissions branch. This file is only the
   starting content: admins edit categories and items in the back office
   (Website content → Test-prep catalogue). The website then reads the live
   version from the server, including each item's status:
     status  "open" (taking students) · "closed" (not taking students now) ·
             "cancelled" (no longer offered)
     visible true / false (shown on the website or not)
   An item may link to a course code; without one, it links to the contact form.
   ========================================================================== */
(function () {
  var D = window.DD_CONTENT;
  function L(en, th) { return { en: en, th: th }; }
  function it(id, name, course, en, th) { return { id: id, name: name, course: course || "", note: L(en, th), status: "open", visible: true }; }

  D.prepCatalog = [
    { id: "hs", icon: "school", visible: true, name: L("International High School Equivalency", "วุฒิมัธยมปลายนานาชาติ"),
      text: L("Qualifications that replace or sit beside a Thai M.6 certificate.", "วุฒิที่ใช้แทนหรือใช้คู่กับวุฒิ ม.6 ของไทย"),
      items: [
        it("ged", "GED", "", "US high-school equivalency in four subjects. Some programmes do not accept GED (e.g. Thammasat CICM medicine) — check first.", "วุฒิเทียบเท่ามัธยมปลายของสหรัฐฯ 4 วิชา บางหลักสูตรไม่รับ GED (เช่น แพทย์ CICM ธรรมศาสตร์) ควรตรวจก่อน"),
        it("igcse", "IGCSE", "MTH130", "Cambridge or Pearson Edexcel qualifications around age 14–16 (Year 10–11).", "วุฒิของ Cambridge หรือ Pearson Edexcel ช่วงอายุประมาณ 14–16 ปี (Year 10–11)"),
        it("alevel-uk", "A-Level (Cambridge / Edexcel)", "MTH230", "UK-style A-Levels (age 16–18) — not the Thai TCAS A-Level. Accepted widely in the UK, Singapore and Thai international programmes.", "A-Level แบบสหราชอาณาจักร (อายุ 16–18 ปี) ไม่ใช่ A-Level ของ TCAS ไทย ใช้ได้กว้างทั้งสหราชอาณาจักร สิงคโปร์ และหลักสูตรนานาชาติในไทย"),
        it("ib", "IB Diploma", "PHY230", "International Baccalaureate Diploma: six subjects plus Theory of Knowledge, Extended Essay and CAS.", "International Baccalaureate Diploma: 6 วิชา พร้อม Theory of Knowledge, Extended Essay และ CAS")
      ] },
    { id: "uni", icon: "building", visible: true, name: L("University Admission Requirements", "เกณฑ์ยื่นเข้ามหาวิทยาลัย"),
      text: L("Aptitude and English tests used by international programmes in Thailand and abroad.", "ข้อสอบความถนัดและภาษาอังกฤษที่หลักสูตรนานาชาติในไทยและต่างประเทศใช้"),
      items: [
        it("sat", "SAT", "SAT210", "Digital SAT: Math and Reading & Writing, 400–1600.", "Digital SAT: Math และ Reading & Writing คะแนน 400–1600"),
        it("act", "ACT", "", "US test: English, Maths and Reading (Science optional since 2025), composite 1–36.", "ข้อสอบของสหรัฐฯ: English, Math และ Reading (Science เป็นตัวเลือกตั้งแต่ปี 2025) คะแนนรวม 1–36"),
        it("cuats", "CU-ATS", "PHY230", "Chula's science test (Physics + Chemistry, up to 1,600); e.g. Chula ISE asks at least 800 in total.", "ข้อสอบวิทยาศาสตร์ของจุฬาฯ (ฟิสิกส์ + เคมี เต็ม 1,600) เช่น ISE จุฬาฯ กำหนดรวมไม่น้อยกว่า 800"),
        it("cuaat", "CU-AAT", "AAT210", "Chula's aptitude test: Math + Verbal, up to 1,600; valid 2 years.", "ข้อสอบความถนัดของจุฬาฯ: Math + Verbal เต็ม 1,600 ใช้ได้ 2 ปี"),
        it("muic", "MUIC entrance", "", "Mahidol International College's own entrance test, or fast track with IELTS 6.0 / TOEFL iBT 69 and SAT/ACT Math.", "ข้อสอบเข้าของวิทยาลัยนานาชาติ มหิดล หรือรอบ Fast track ด้วย IELTS 6.0 / TOEFL iBT 69 และ SAT/ACT Math"),
        it("ielts", "IELTS", "IEL200", "Academic English, Band 0–9; usually valid 2 years.", "ภาษาอังกฤษเชิงวิชาการ Band 0–9 โดยทั่วไปใช้ได้ 2 ปี"),
        it("toefl", "TOEFL iBT", "ENG230", "English test accepted by most universities; e.g. CICM asks 79, CU-MEDi 85.", "ข้อสอบภาษาอังกฤษที่มหาวิทยาลัยส่วนใหญ่รับ เช่น CICM ต้องการ 79 และ CU-MEDi ต้องการ 85"),
        it("duolingo", "Duolingo English Test", "ENG230", "Online English test; accepted by many programmes (e.g. Chula BALAC asks 120).", "ข้อสอบภาษาอังกฤษออนไลน์ หลายหลักสูตรรับ (เช่น BALAC จุฬาฯ ต้องการ 120)"),
        it("cutep", "CU-TEP", "ENG230", "Chula's English test (listening, reading, writing), accepted by Chula programmes.", "ข้อสอบภาษาอังกฤษของจุฬาฯ (ฟัง อ่าน เขียน) ใช้ยื่นหลักสูตรของจุฬาฯ"),
        it("tuget", "TU-GET", "ENG230", "Thammasat's English test, accepted by Thammasat programmes (e.g. SIIT, CICM).", "ข้อสอบภาษาอังกฤษของธรรมศาสตร์ ใช้ยื่นหลักสูตรของธรรมศาสตร์ (เช่น SIIT, CICM)")
      ] },
    { id: "demo", icon: "school", visible: true, name: L("International Demonstration Schools", "สอบเข้าโรงเรียนสาธิตนานาชาติ"),
      text: L("Entrance preparation for university-run international schools.", "เตรียมสอบเข้าโรงเรียนนานาชาติในสังกัดมหาวิทยาลัย"),
      items: [
        it("muids", "MUIDS", "MTH130", "Mahidol University International Demonstration School: maths and English tests — we confirm the current format each round.", "โรงเรียนสาธิตนานาชาติ มหาวิทยาลัยมหิดล: สอบคณิตศาสตร์และภาษาอังกฤษ เราตรวจรูปแบบล่าสุดให้ทุกรอบ"),
        it("spip", "SPIP", "ENG130", "Satit Prasarnmit International Programme: pre-test and admission test in maths, English and science.", "สาธิตประสานมิตร หลักสูตรนานาชาติ: Pre-test และสอบคัดเลือกวิชาคณิตศาสตร์ ภาษาอังกฤษ และวิทยาศาสตร์"),
        it("kmids", "KMIDS", "MTH130", "King Mongkut's International Demonstration School: MAP Math, MAP Reading, an essay and an interview; strong interest in maths, science and technology.", "โรงเรียนสาธิตนานาชาติพระจอมเกล้า: MAP Math, MAP Reading การเขียนเรียงความ และสัมภาษณ์ เน้นความสนใจด้านคณิต วิทย์ และเทคโนโลยี")
      ] },
    { id: "med", icon: "health", visible: true, name: L("Medical Prep", "เตรียมสอบแพทย์"),
      text: L("Medicine, dentistry, pharmacy and health sciences — Thai track and international.", "แพทย์ ทันตแพทย์ เภสัช และวิทยาศาสตร์สุขภาพ ทั้งภาคไทยและนานาชาติ"),
      items: [
        it("tbat", "TBAT", "TBT300", "Physics, Chemistry, Biology in English — Chula Medicine & Dentistry, Khon Kaen Medicine (Portfolio).", "ฟิสิกส์ เคมี ชีววิทยาภาษาอังกฤษ ใช้ยื่นแพทย์และทันตแพทย์จุฬาฯ และแพทย์ มข. (Portfolio)"),
        it("ucat", "UCAT", "UCT300", "Ramathibodi Portfolio (SJ Band 1–3), Thammasat CICM, UK and Australian medicine.", "พอร์ตรามาฯ (SJ Band 1–3) CICM ธรรมศาสตร์ และแพทย์ในสหราชอาณาจักรและออสเตรเลีย"),
        it("akat", "AKAT", "", "Srinakharinwirot's own test for its international medicine and dentistry programmes — ask us for the current format.", "ข้อสอบของ มศว สำหรับหลักสูตรนานาชาติแพทย์และทันตแพทย์ สอบถามรูปแบบล่าสุดจากเรา"),
        it("tpat1", "TPAT1 (กสพท)", "TPT310", "Thai-track medicine: TPAT1 30% + 7 A-Level subjects 70%.", "แพทย์ภาคไทย: TPAT1 30% + A-Level 7 วิชา 70%"),
        it("ielts-med", "IELTS", "IEL200", "English for international medicine (e.g. CICM 6.5, CU-MEDi 7.0).", "ภาษาอังกฤษสำหรับแพทย์นานาชาติ (เช่น CICM 6.5 และ CU-MEDi 7.0)"),
        it("cuaat-med", "CU-AAT", "AAT210", "Used with TBAT by Chula Medicine and Dentistry.", "ใช้ร่วมกับ TBAT ในแพทย์และทันตแพทย์จุฬาฯ"),
        it("portfolio-med", "Portfolio & MMI", "PFL200", "Health-related experience, statement and multiple-mini-interview practice.", "ประสบการณ์ด้านสุขภาพ เรียงความ และฝึกสัมภาษณ์แบบ MMI")
      ] },
    { id: "eng", icon: "chip", visible: true, name: L("Engineering / Science", "วิศวกรรม / วิทยาศาสตร์"),
      text: L("Thai-track and international engineering, computing and science.", "วิศวกรรม คอมพิวเตอร์ และวิทยาศาสตร์ ทั้งภาคไทยและนานาชาติ"),
      items: [
        it("sat-eng", "SAT", "SAT210", "SAT Math for ISE (≥ 620), BBTECH/BISTECH (≥ 550), KMITL and SIIT.", "SAT Math สำหรับ ISE (≥ 620) BBTECH/BISTECH (≥ 550) สจล. และ SIIT"),
        it("act-eng", "ACT", "", "ACT Math is accepted as an alternative by several programmes (e.g. KMITL, Chula BBTECH ≥ 25).", "หลายหลักสูตรรับ ACT Math แทน (เช่น สจล. และ BBTECH จุฬาฯ ≥ 25)"),
        it("cuats-eng", "CU-ATS", "PHY230", "Physics + Chemistry for Chula ISE, ChPE and BSAC.", "ฟิสิกส์ + เคมี สำหรับ ISE, ChPE และ BSAC จุฬาฯ"),
        it("ielts-eng", "IELTS", "IEL200", "English for international engineering (typically 6.0+).", "ภาษาอังกฤษสำหรับวิศวกรรมนานาชาติ (โดยทั่วไป 6.0 ขึ้นไป)"),
        it("tpat3", "TGAT · TPAT3", "TGT220", "Thai-track engineering and science (TCAS Round 3).", "วิศวกรรมและวิทยาศาสตร์ภาคไทย (TCAS รอบ 3)"),
        it("alevel-th", "A-Level (TCAS)", "ALV240", "Maths 1, Physics, Chemistry for Thai-track engineering.", "คณิต 1 ฟิสิกส์ เคมี สำหรับวิศวกรรมภาคไทย"),
        it("tmua", "TMUA · ESAT", "UKT320", "Cambridge, Imperial and Oxford engineering, sciences and maths.", "วิศวกรรม วิทยาศาสตร์ และคณิตศาสตร์ที่ Cambridge, Imperial และ Oxford"),
        it("compas", "COMPAS · POSN", "EXM210", "Computing exams and olympiad camps for computer engineering portfolios.", "สอบและค่ายโอลิมปิกคอมพิวเตอร์สำหรับพอร์ตวิศวกรรมคอมพิวเตอร์")
      ] },
    { id: "others", icon: "spark", visible: true, name: L("Others", "อื่น ๆ"),
      text: L("Scholarships, design portfolios, everyday English and maths, and interviews.", "ทุนการศึกษา พอร์ตงานออกแบบ ภาษาอังกฤษและคณิตศาสตร์ทั่วไป และการสัมภาษณ์"),
      items: [
        it("art", "Art & Design", "", "Drawing and design portfolios for art, design and architecture (incl. TPAT2 / TPAT4 for the Thai track).", "พอร์ตวาดเส้นและงานออกแบบสำหรับศิลปะ การออกแบบ และสถาปัตยกรรม (รวม TPAT2 / TPAT4 ภาคไทย)"),
        it("asean", "ASEAN Scholarship (Singapore MOE)", "MTH130", "For Thai students entering Secondary 3 or Pre-University 1 in Singapore: selection tests (reported: English, Maths, general ability) and an interview.", "สำหรับนักเรียนไทยที่จะเข้าเรียน Secondary 3 หรือ Pre-University 1 ในสิงคโปร์ มีการสอบคัดเลือก (รายงานว่ามีอังกฤษ คณิต และความถนัดทั่วไป) และสัมภาษณ์"),
        it("afs", "AFS Scholarship", "ENG130", "Intercultural exchange scholarship — written selection and interviews; ask us for this year's process.", "ทุนแลกเปลี่ยนวัฒนธรรม มีการคัดเลือกข้อเขียนและสัมภาษณ์ สอบถามขั้นตอนของปีนี้จากเรา"),
        it("general", "General English / Maths", "ENG130", "School support and catch-up for any level, from M.1.", "เสริมการเรียนในโรงเรียนและปูพื้นทุกระดับ ตั้งแต่ ม.1"),
        it("toeic", "TOEIC", "ENG230", "Workplace English, often asked for internships and graduation.", "ภาษาอังกฤษเพื่อการทำงาน มักใช้สำหรับฝึกงานและการจบการศึกษา"),
        it("interview", "Interview", "PFL200", "Panel, online and MMI practice in Thai and English.", "ฝึกสัมภาษณ์แบบกรรมการ ออนไลน์ และ MMI ทั้งภาษาไทยและอังกฤษ")
      ] }
  ];

  // give every pathway a stable id and visibility, so the back office can edit it
  (D.pathways || []).forEach(function (p, i) {
    if (!p.id) p.id = "pw" + String(i + 1).padStart(3, "0");
    if (p.visible == null) p.visible = true;
  });
})();
