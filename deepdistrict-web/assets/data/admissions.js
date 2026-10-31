/* ==========================================================================
   DeepDistrict.si — Admissions & Test Prep branch ("DeepDistrict Admissions")
   (loads after courses-more.js)
   --------------------------------------------------------------------------
   IELTS Academic, Digital SAT Math, Digital SAT Reading & Writing (EBRW),
   TBAT, CU-AAT Math, CU-AAT Verbal and the admissions portfolio.
   Test facts were checked in October 2026 against the test owners' and
   universities' published information. Admission rules change every year:
   the page tells visitors to ask us for the current requirements.
   Test names are trademarks of their owners; we are not affiliated with them.
   ========================================================================== */
(function () {
  var D = window.DD_CONTENT;
  function L(en, th) { return { en: en, th: th }; }
  function m(list) { return list.map(function (x) { return L(x[0], x[1]); }); }
  var ALL = ["online", "onsite", "hybrid"];

  D.admChecked = L("October 2026", "ตุลาคม 2569");

  /* ------------------------------------------------------------ "things change fast" notice (shown on the page and in course dialogs) */
  D.admNotice = L(
    "Tests, formats, minimum scores and admission rounds change quickly, sometimes within the same year. The information here was checked in October 2026. Always ask us for the latest update before you register or apply: we check each university's current announcement for you, free of charge.",
    "ข้อสอบ รูปแบบ คะแนนขั้นต่ำ และรอบการรับสมัคร เปลี่ยนแปลงเร็วมาก บางครั้งเปลี่ยนภายในปีเดียวกัน ข้อมูลในหน้านี้ตรวจสอบล่าสุดเมื่อตุลาคม 2569 ก่อนสมัครสอบหรือยื่นสมัครเรียน สอบถามข้อมูลล่าสุดจากเราได้ทุกเมื่อ เราช่วยตรวจประกาศปัจจุบันของแต่ละมหาวิทยาลัยให้ฟรี"
  );

  /* ------------------------------------------------------------ track */
  D.tracks.push({
    id: "admit", icon: "school", href: "pages/admissions.html", name: L("Admissions & Test Prep", "เตรียมสอบและยื่นเข้ามหาวิทยาลัย"),
    text: L("IELTS, SAT, TBAT and CU-AAT preparation plus a portfolio that stands out, for Thai international programmes and universities abroad.",
            "เตรียมสอบ IELTS, SAT, TBAT และ CU-AAT พร้อมสร้างพอร์ตโฟลิโอที่โดดเด่น สำหรับหลักสูตรนานาชาติในไทยและมหาวิทยาลัยต่างประเทศ"),
    tech: ["IELTS", "SAT", "TBAT", "CU-AAT", "Portfolio"]
  });

  /* ------------------------------------------------------------ courses */
  var add = [
    { code: "IEL200", track: "admit", level: 2, hours: 40,
      title: L("IELTS Academic: Band 6.5 → 7.5+", "IELTS Academic: จาก Band 6.5 สู่ 7.5+"),
      text: L("All four skills for university entry: listening and reading strategies, Task 1 and Task 2 writing with examiner-style feedback, and speaking practice.",
              "ครบทั้งสี่ทักษะเพื่อยื่นเข้ามหาวิทยาลัย กลยุทธ์ Listening และ Reading การเขียน Task 1 และ Task 2 พร้อมคำแนะนำตามเกณฑ์ผู้ตรวจ และฝึกพูดเสมือนสอบจริง"),
      tools: ["Band descriptors", "Timed mocks", "Writing feedback"] },
    { code: "SAT210", track: "admit", level: 2, hours: 36,
      title: L("Digital SAT Math", "Digital SAT Math"),
      text: L("Algebra, Advanced Math, Problem-Solving & Data Analysis, and Geometry & Trigonometry, with the built-in Desmos calculator and adaptive-module strategy.",
              "Algebra, Advanced Math, Problem-Solving & Data Analysis และ Geometry & Trigonometry พร้อมใช้เครื่องคิดเลข Desmos ในข้อสอบ และกลยุทธ์ข้อสอบแบบปรับระดับ (Adaptive)"),
      tools: ["Bluebook", "Desmos", "Adaptive mocks"] },
    { code: "SAT220", track: "admit", level: 2, hours: 36,
      title: L("Digital SAT Reading & Writing (EBRW)", "Digital SAT Reading & Writing (EBRW)"),
      text: L("Short-passage reading, vocabulary in context, rhetoric and grammar: the four Reading and Writing domains, trained for speed and accuracy.",
              "การอ่านบทความสั้น คำศัพท์ในบริบท วาทศิลป์ และไวยากรณ์ ครบสี่หมวดของ Reading and Writing ฝึกให้ทั้งเร็วและแม่นยำ"),
      tools: ["Bluebook", "Grammar rules", "Adaptive mocks"] },
    { code: "AAT210", track: "admit", level: 2, hours: 30,
      title: L("CU-AAT Math", "CU-AAT Math"),
      text: L("Arithmetic, algebra, geometry and problem solving for Chulalongkorn's aptitude test, with a smart guessing strategy for its wrong-answer penalty.",
              "เลขคณิต พีชคณิต เรขาคณิต และการแก้โจทย์ปัญหา สำหรับข้อสอบ CU-AAT ของจุฬาฯ พร้อมกลยุทธ์การเดาอย่างมีหลักการ เพราะตอบผิดถูกหักคะแนน"),
      tools: ["Paper mocks", "Error log"] },
    { code: "AAT220", track: "admit", level: 2, hours: 30,
      title: L("CU-AAT Verbal", "CU-AAT Verbal"),
      text: L("Sentence completion, critical reading, error identification and sentence and paragraph improvement, plus the academic vocabulary the test expects.",
              "เติมประโยค การอ่านเชิงวิเคราะห์ การหาจุดผิด และการปรับปรุงประโยคและย่อหน้า พร้อมคำศัพท์เชิงวิชาการที่ข้อสอบต้องการ"),
      tools: ["Paper mocks", "Vocabulary sets"] },
    { code: "TBT300", track: "admit", level: 3, hours: 48,
      title: L("TBAT: Physics, Chemistry & Biology in English", "TBAT: ฟิสิกส์ เคมี และชีววิทยา ภาคภาษาอังกฤษ"),
      text: L("Preparation for the Thai Biomedical Admissions Test, which replaced the BMAT for Thai international medicine, dentistry and health-science programmes.",
              "เตรียมสอบ TBAT (Thai Biomedical Admissions Test) ที่ใช้แทน BMAT สำหรับหลักสูตรนานาชาติด้านแพทย์ ทันตแพทย์ และวิทยาศาสตร์สุขภาพในไทย"),
      tools: ["Science in English", "Timed mocks", "Error log"] },
    { code: "PFL200", track: "admit", level: 2, hours: L("Flexible · 1–6 months", "ยืดหยุ่น · 1–6 เดือน"),
      title: L("Admissions Portfolio, Personal Statement & Interview", "พอร์ตโฟลิโอ เรียงความแนะนำตัว และการสัมภาษณ์"),
      text: L("Turn scores, projects and activities into one convincing story: TCAS Round 1 portfolio, UCAS and Common App writing, and interview practice including MMI.",
              "เปลี่ยนคะแนนสอบ ผลงาน และกิจกรรม ให้เป็นเรื่องราวเดียวที่น่าเชื่อถือ ทั้งพอร์ต TCAS รอบ 1 การเขียน UCAS และ Common App และฝึกสัมภาษณ์รวมถึง MMI"),
      tools: ["Portfolio design", "Essay coaching", "Mock interviews"] }
  ];
  add.forEach(function (c) { D.courses.push(c); });

  var det = {
    IEL200: { modes: ALL,
      modules: m([["Test format, band descriptors & your diagnostic", "รูปแบบข้อสอบ เกณฑ์ Band และการวัดระดับเริ่มต้น"], ["Listening: four parts, one hearing", "Listening: สี่พาร์ต ฟังได้ครั้งเดียว"],
        ["Reading: skimming, scanning, True/False/Not Given", "Reading: Skimming, Scanning และ True/False/Not Given"], ["Writing Task 1: graphs, tables, processes, maps", "Writing Task 1: กราฟ ตาราง กระบวนการ และแผนที่"],
        ["Writing Task 2: argument, structure, coherence", "Writing Task 2: การให้เหตุผล โครงสร้าง และความเชื่อมโยง"], ["Speaking: fluency, vocabulary, pronunciation", "Speaking: ความคล่อง คำศัพท์ และการออกเสียง"],
        ["Full mocks, computer or paper", "ข้อสอบจำลองเต็มรูปแบบ แบบคอมพิวเตอร์หรือกระดาษ"]]),
      outcomes: m([["Know exactly what each band needs", "รู้ชัดว่าแต่ละ Band ต้องทำอะไร"], ["Write essays examiners reward, without memorised templates", "เขียนเรียงความที่ผู้ตรวจให้คะแนน โดยไม่พึ่งเทมเพลตท่องจำ"], ["Reach your target band on the first or second attempt", "ได้ Band เป้าหมายในการสอบครั้งแรกหรือครั้งที่สอง"]]),
      prereq: L("Upper-intermediate English (about B1–B2); we test you first", "ภาษาอังกฤษระดับกลางค่อนสูง (ประมาณ B1–B2) มีแบบทดสอบวัดระดับก่อนเรียน"),
      project: L("Three full mocks with band scores and written feedback", "ข้อสอบจำลองเต็มรูปแบบ 3 ชุด พร้อมคะแนน Band และคำแนะนำเป็นลายลักษณ์อักษร") },
    SAT210: { modes: ALL,
      modules: m([["Digital SAT, Bluebook & adaptive modules", "Digital SAT, Bluebook และโมดูลแบบปรับระดับ"], ["Algebra: linear equations, systems, inequalities", "Algebra: สมการเชิงเส้น ระบบสมการ และอสมการ"],
        ["Advanced Math: quadratics, exponentials, functions", "Advanced Math: กำลังสอง เอกซ์โพเนนเชียล และฟังก์ชัน"], ["Problem-Solving & Data Analysis: ratios, percentages, statistics, probability", "Problem-Solving & Data Analysis: อัตราส่วน ร้อยละ สถิติ และความน่าจะเป็น"],
        ["Geometry & Trigonometry: area, volume, circles, right triangles", "Geometry & Trigonometry: พื้นที่ ปริมาตร วงกลม และสามเหลี่ยมมุมฉาก"], ["Desmos as a weapon, not a crutch", "ใช้ Desmos ให้เป็นอาวุธ ไม่ใช่ไม้ค้ำ"],
        ["Student-produced responses & time management", "ข้อเติมคำตอบเอง และการบริหารเวลา"]]),
      outcomes: m([["Get to the harder second module", "ทำได้ดีพอจะได้โมดูลที่สองระดับยาก"], ["Solve each question type with a reliable method", "แก้โจทย์แต่ละประเภทด้วยวิธีที่เชื่อถือได้"], ["Aim for 700–800 in Math", "มุ่งสู่คะแนน Math 700–800"]]),
      prereq: L("Lower-secondary maths (M.3) and reading English word problems", "คณิตศาสตร์ ม.ต้น และอ่านโจทย์ภาษาอังกฤษได้"),
      project: L("Full adaptive practice tests in Bluebook with an error log", "ข้อสอบเสมือนจริงแบบ Adaptive ใน Bluebook พร้อมบันทึกจุดพลาด") },
    SAT220: { modes: ALL,
      modules: m([["How Reading and Writing is scored and adapted", "การให้คะแนนและการปรับระดับของ Reading and Writing"], ["Information & Ideas: evidence, inference, data in texts", "Information & Ideas: หลักฐาน การอนุมาน และข้อมูลในบทความ"],
        ["Craft & Structure: words in context, purpose, cross-text", "Craft & Structure: คำในบริบท จุดประสงค์ และการเปรียบเทียบสองบทความ"], ["Expression of Ideas: transitions, rhetorical synthesis", "Expression of Ideas: คำเชื่อม และการสังเคราะห์เชิงวาทศิลป์"],
        ["Standard English Conventions: punctuation, agreement, tense", "Standard English Conventions: เครื่องหมายวรรคตอน ความสอดคล้อง และกาล"], ["Vocabulary that actually appears", "คำศัพท์ที่ออกสอบจริง"],
        ["Pacing: about 70 seconds a question", "การคุมเวลา: ประมาณ 70 วินาทีต่อข้อ"]]),
      outcomes: m([["Never lose points on grammar rules", "ไม่เสียคะแนนจากกฎไวยากรณ์อีก"], ["Read short academic passages fast and precisely", "อ่านบทความวิชาการสั้นได้เร็วและแม่นยำ"], ["Aim for 700+ in Reading and Writing", "มุ่งสู่คะแนน Reading and Writing 700+"]]),
      prereq: L("Intermediate English; IEL200 can run alongside", "ภาษาอังกฤษระดับกลาง เรียนควบคู่ IEL200 ได้"),
      project: L("Full adaptive practice tests with a personal rule book", "ข้อสอบเสมือนจริงแบบ Adaptive พร้อมสมุดกฎส่วนตัว") },
    AAT210: { modes: ALL,
      modules: m([["CU-AAT format, scoring & the guessing penalty", "รูปแบบ CU-AAT การให้คะแนน และการหักคะแนนเมื่อตอบผิด"], ["Number properties, fractions, percentages", "สมบัติของจำนวน เศษส่วน และร้อยละ"],
        ["Algebra & functions", "พีชคณิตและฟังก์ชัน"], ["Geometry: angles, triangles, circles, coordinate geometry", "เรขาคณิต: มุม สามเหลี่ยม วงกลม และเรขาคณิตวิเคราะห์"],
        ["Word problems, data & probability", "โจทย์ปัญหา ข้อมูล และความน่าจะเป็น"], ["Paper-test speed: estimation and elimination", "ความเร็วในข้อสอบกระดาษ: การประมาณและการตัดตัวเลือก"]]),
      outcomes: m([["Decide when to answer and when to skip", "ตัดสินใจได้ว่าข้อไหนควรตอบ ข้อไหนควรข้าม"], ["Fast, accurate paper-based maths", "คำนวณบนกระดาษได้เร็วและแม่นยำ"], ["Meet or beat your programme's Math minimum", "ได้คะแนนถึงหรือเกินเกณฑ์ Math ของหลักสูตรที่ต้องการ"]]),
      prereq: L("Lower-secondary maths (M.3)", "คณิตศาสตร์ ม.ต้น"),
      project: L("Timed paper mocks marked with the penalty rule", "ข้อสอบจำลองแบบกระดาษจับเวลา ตรวจด้วยกฎหักคะแนนจริง") },
    AAT220: { modes: ALL,
      modules: m([["CU-AAT Verbal format & scoring", "รูปแบบและการให้คะแนน CU-AAT Verbal"], ["Sentence completion & academic vocabulary", "การเติมประโยคและคำศัพท์เชิงวิชาการ"],
        ["Critical reading: main idea, inference, tone", "การอ่านเชิงวิเคราะห์: ใจความสำคัญ การอนุมาน และน้ำเสียง"], ["Identifying sentence errors", "การหาจุดผิดในประโยค"],
        ["Improving sentences & paragraphs", "การปรับปรุงประโยคและย่อหน้า"], ["Guessing strategy & pacing", "กลยุทธ์การเดาและการคุมเวลา"]]),
      outcomes: m([["Spot grammar errors instantly", "เห็นจุดผิดไวยากรณ์ได้ทันที"], ["Read long passages with confidence", "อ่านบทความยาวได้อย่างมั่นใจ"], ["Meet or beat your programme's Verbal minimum", "ได้คะแนนถึงหรือเกินเกณฑ์ Verbal ของหลักสูตรที่ต้องการ"]]),
      prereq: L("Intermediate English", "ภาษาอังกฤษระดับกลาง"),
      project: L("Timed paper mocks with a vocabulary and error log", "ข้อสอบจำลองแบบกระดาษจับเวลา พร้อมบันทึกคำศัพท์และจุดพลาด") },
    TBT300: { modes: ALL,
      modules: m([["TBAT format, scoring & how it replaced the BMAT", "รูปแบบ TBAT การให้คะแนน และเหตุที่ใช้แทน BMAT"], ["Physics: mechanics, waves, electricity, modern physics", "ฟิสิกส์: กลศาสตร์ คลื่น ไฟฟ้า และฟิสิกส์ยุคใหม่"],
        ["Chemistry: stoichiometry, bonding, equilibrium, organic", "เคมี: ปริมาณสัมพันธ์ พันธะเคมี สมดุล และเคมีอินทรีย์"], ["Biology: cells, genetics, human physiology, ecology", "ชีววิทยา: เซลล์ พันธุศาสตร์ สรีรวิทยามนุษย์ และนิเวศวิทยา"],
        ["Scientific English: reading questions fast", "ภาษาอังกฤษเชิงวิทยาศาสตร์: อ่านโจทย์ให้เร็ว"], ["Data, graphs & calculation without a calculator", "ข้อมูล กราฟ และการคำนวณโดยไม่ใช้เครื่องคิดเลข"],
        ["Timed part-by-part mocks", "ข้อสอบจำลองจับเวลาแยกรายวิชา"]]),
      outcomes: m([["Answer science questions in English at exam speed", "ตอบโจทย์วิทยาศาสตร์ภาษาอังกฤษได้ทันเวลาสอบ"], ["Close the gaps between the Thai curriculum and the TBAT", "ปิดช่องว่างระหว่างหลักสูตรไทยกับข้อสอบ TBAT"], ["Build a medicine-ready score alongside CU-AAT or SAT and IELTS", "สร้างคะแนนพร้อมยื่นแพทย์ ควบคู่ CU-AAT หรือ SAT และ IELTS"]]),
      prereq: L("Upper-secondary science in progress (M.4–M.6) and intermediate English", "กำลังเรียนวิทยาศาสตร์ ม.ปลาย (ม.4–ม.6) และภาษาอังกฤษระดับกลาง"),
      project: L("Full TBAT-style mocks with a subject-by-subject gap report", "ข้อสอบจำลองแนว TBAT เต็มรูปแบบ พร้อมรายงานจุดอ่อนรายวิชา") },
    PFL200: { modes: ALL,
      modules: m([["Your target list & what each programme scores", "รายชื่อหลักสูตรเป้าหมาย และเกณฑ์ที่แต่ละหลักสูตรใช้"], ["Finding your story: interests, evidence, direction", "ค้นหาเรื่องราวของคุณ: ความสนใจ หลักฐาน และทิศทาง"],
        ["Evidence that counts: research, projects, competitions, service", "หลักฐานที่มีน้ำหนัก: งานวิจัย โครงงาน การแข่งขัน และจิตอาสา"], ["TCAS Round 1 portfolio design (TCAS format)", "ออกแบบพอร์ต TCAS รอบ 1 ตามรูปแบบที่กำหนด"],
        ["Personal statement & essays: UCAS, Common App, SOP", "เรียงความ: UCAS, Common App และ SOP"], ["Recommendation letters: whom to ask and how", "จดหมายแนะนำ: ขอใครและขออย่างไร"],
        ["Interviews: panel, online and MMI practice", "การสัมภาษณ์: แบบกรรมการ ออนไลน์ และฝึก MMI"]]),
      outcomes: m([["A portfolio and essays that sound like you", "พอร์ตและเรียงความที่เป็นตัวคุณจริง"], ["Every claim backed by evidence", "ทุกข้อความมีหลักฐานรองรับ"], ["Calm, structured answers in interviews", "ตอบคำถามสัมภาษณ์อย่างมีโครงสร้างและมั่นใจ"]]),
      prereq: L("Any level; best started in M.4–M.5", "ทุกระดับ ควรเริ่มตั้งแต่ ม.4–ม.5"),
      project: L("A finished portfolio, essays and two mock interviews", "พอร์ตฉบับสมบูรณ์ เรียงความ และสัมภาษณ์จำลอง 2 ครั้ง") }
  };
  Object.keys(det).forEach(function (k) { D.details[k] = det[k]; });

  /* ------------------------------------------------------------ test explorer */
  D.admTests = [
    { id: "ielts", code: "IEL200", name: "IELTS Academic", icon: "globe",
      by: L("British Council · IDP · Cambridge University Press & Assessment", "British Council · IDP · Cambridge University Press & Assessment"),
      what: L("English for university study. Accepted by universities in the UK, Australia, Europe and Asia, and by Thai international programmes.",
              "วัดภาษาอังกฤษเพื่อการเรียนในมหาวิทยาลัย ใช้ยื่นมหาวิทยาลัยในสหราชอาณาจักร ออสเตรเลีย ยุโรป เอเชีย และหลักสูตรนานาชาติในไทย"),
      parts: [
        [L("Listening", "Listening"), L("about 30 min · 4 parts · 40 questions · heard once", "ประมาณ 30 นาที · 4 พาร์ต · 40 ข้อ · ฟังครั้งเดียว")],
        [L("Reading", "Reading"), L("60 min · 3 academic passages · 40 questions", "60 นาที · บทความวิชาการ 3 เรื่อง · 40 ข้อ")],
        [L("Writing", "Writing"), L("60 min · Task 1 describe a visual (150+ words) · Task 2 essay (250+ words)", "60 นาที · Task 1 บรรยายแผนภาพ (150 คำขึ้นไป) · Task 2 เรียงความ (250 คำขึ้นไป)")],
        [L("Speaking", "Speaking"), L("11–14 min · face-to-face with an examiner · 3 parts", "11–14 นาที · สัมภาษณ์ต่อหน้าผู้ตรวจ · 3 พาร์ต")]
      ],
      score: L("Band 0–9 in half bands, for each skill and overall", "Band 0–9 ทีละครึ่ง Band ทั้งรายทักษะและภาพรวม"),
      facts: m([["On computer or paper. Results are usually accepted for 2 years.", "สอบได้ทั้งคอมพิวเตอร์และกระดาษ ผลสอบมักใช้ได้ 2 ปี"],
        ["One Skill Retake: at some computer test centres you can retake one skill within 60 days.", "One Skill Retake: บางศูนย์สอบคอมพิวเตอร์ให้สอบใหม่เฉพาะหนึ่งทักษะภายใน 60 วัน"],
        ["Typical minimums: 6.0–6.5 for Thai international programmes, 6.5–7.5 for leading UK and Australian universities.", "เกณฑ์ที่พบบ่อย: 6.0–6.5 สำหรับหลักสูตรนานาชาติในไทย และ 6.5–7.5 สำหรับมหาวิทยาลัยชั้นนำในสหราชอาณาจักรและออสเตรเลีย"]]),
      url: "https://ielts.org" },
    { id: "satm", code: "SAT210", name: "SAT Math", icon: "chart",
      by: L("College Board · Digital SAT (Bluebook app)", "College Board · Digital SAT (แอป Bluebook)"),
      what: L("Maths reasoning for US universities and many Thai international programmes, which accept SAT Math as their maths score.",
              "การให้เหตุผลทางคณิตศาสตร์ ใช้ยื่นมหาวิทยาลัยในสหรัฐอเมริกา และหลักสูตรนานาชาติในไทยหลายแห่งที่ใช้คะแนน SAT Math"),
      parts: [
        [L("Module 1", "โมดูล 1"), L("35 min · 22 questions", "35 นาที · 22 ข้อ")],
        [L("Module 2", "โมดูล 2"), L("35 min · 22 questions · easier or harder depending on Module 1", "35 นาที · 22 ข้อ · ง่ายขึ้นหรือยากขึ้นตามผลโมดูล 1")],
        [L("Content", "เนื้อหา"), L("Algebra · Advanced Math · Problem-Solving & Data Analysis · Geometry & Trigonometry", "Algebra · Advanced Math · Problem-Solving & Data Analysis · Geometry & Trigonometry")],
        [L("Tools", "เครื่องมือ"), L("Calculator allowed throughout (Desmos built in) · about a quarter of answers are typed in", "ใช้เครื่องคิดเลขได้ตลอด (มี Desmos ในข้อสอบ) · ประมาณหนึ่งในสี่เป็นข้อเติมคำตอบเอง")]
      ],
      score: L("200–800 (SAT total 400–1600) · no penalty for wrong answers", "200–800 (SAT รวม 400–1600) · ตอบผิดไม่หักคะแนน"),
      facts: m([["Digital and adaptive: doing well in Module 1 unlocks the harder Module 2 and the highest scores.", "เป็นข้อสอบดิจิทัลแบบปรับระดับ ทำโมดูล 1 ได้ดีจึงได้โมดูล 2 ระดับยากและคะแนนสูงสุด"],
        ["Example 2027 minimum: SAT Math 550 for some Chulalongkorn science programmes. Competitive applicants score much higher.", "ตัวอย่างเกณฑ์ปี 2570: SAT Math 550 สำหรับบางหลักสูตรวิทยาศาสตร์ของจุฬาฯ ผู้สมัครที่แข่งขันได้มักได้สูงกว่านี้มาก"],
        ["Several selective US universities require the SAT or ACT again.", "มหาวิทยาลัยชั้นนำในสหรัฐอเมริกาหลายแห่งกลับมากำหนดให้ใช้ SAT หรือ ACT อีกครั้ง"]]),
      url: "https://satsuite.collegeboard.org/sat" },
    { id: "satr", code: "SAT220", name: "SAT Reading & Writing (EBRW)", icon: "book",
      by: L("College Board · Digital SAT (Bluebook app)", "College Board · Digital SAT (แอป Bluebook)"),
      what: L("Reading and writing in English. Many Thai programmes still call it \"EBRW\" (Evidence-Based Reading and Writing), its name before the digital SAT.",
              "การอ่านและการเขียนภาษาอังกฤษ หลายหลักสูตรในไทยยังเรียกว่า \"EBRW\" (Evidence-Based Reading and Writing) ซึ่งเป็นชื่อก่อนเปลี่ยนเป็น Digital SAT"),
      parts: [
        [L("Module 1", "โมดูล 1"), L("32 min · 27 questions", "32 นาที · 27 ข้อ")],
        [L("Module 2", "โมดูล 2"), L("32 min · 27 questions · adapts to Module 1", "32 นาที · 27 ข้อ · ปรับระดับตามโมดูล 1")],
        [L("Content", "เนื้อหา"), L("Information & Ideas · Craft & Structure · Expression of Ideas · Standard English Conventions", "Information & Ideas · Craft & Structure · Expression of Ideas · Standard English Conventions")],
        [L("Format", "รูปแบบ"), L("One short passage (or a pair) and one question each", "บทความสั้นหนึ่งเรื่อง (หรือหนึ่งคู่) ต่อหนึ่งคำถาม")]
      ],
      score: L("200–800 (SAT total 400–1600) · no penalty for wrong answers", "200–800 (SAT รวม 400–1600) · ตอบผิดไม่หักคะแนน"),
      facts: m([["The whole SAT takes about 2 hours 14 minutes, plus a break.", "SAT ทั้งฉบับใช้เวลาประมาณ 2 ชั่วโมง 14 นาที ไม่รวมเวลาพัก"],
        ["Some programmes ask for a total (e.g. 1,200+) or a minimum in each section. Check both.", "บางหลักสูตรกำหนดคะแนนรวม (เช่น 1,200 ขึ้นไป) หรือขั้นต่ำรายส่วน ต้องตรวจทั้งสองแบบ"],
        ["Strong IELTS reading skills transfer: IEL200 and SAT220 work well together.", "ทักษะการอ่าน IELTS ช่วยได้มาก เรียน IEL200 ควบคู่ SAT220 ได้ผลดี"]]),
      url: "https://satsuite.collegeboard.org/sat" },
    { id: "tbat", code: "TBT300", name: "TBAT", icon: "dna", flag: L("Replaces BMAT", "ใช้แทน BMAT"),
      by: L("Chulalongkorn University Academic Testing Center (CU-ATC)", "ศูนย์ทดสอบทางวิชาการแห่งจุฬาลงกรณ์มหาวิทยาลัย (CU-ATC)"),
      what: L("Thai Biomedical Admissions Test: science in English for international medicine, dentistry, pharmacy, veterinary and health-science programmes. The BMAT was discontinued by Cambridge, and Chula's medical faculty stopped using it from TCAS68.",
              "Thai Biomedical Admissions Test วัดความรู้วิทยาศาสตร์เป็นภาษาอังกฤษ สำหรับหลักสูตรนานาชาติแพทย์ ทันตแพทย์ เภสัช สัตวแพทย์ และวิทยาศาสตร์สุขภาพ Cambridge ยกเลิกการสอบ BMAT แล้ว และคณะแพทยศาสตร์ จุฬาฯ เลิกใช้ BMAT ตั้งแต่ TCAS68"),
      parts: [
        [L("Physics", "ฟิสิกส์"), L("multiple choice · about 60 min", "ปรนัย · ประมาณ 60 นาที")],
        [L("Chemistry", "เคมี"), L("multiple choice · about 60 min", "ปรนัย · ประมาณ 60 นาที")],
        [L("Biology", "ชีววิทยา"), L("multiple choice · about 60 min", "ปรนัย · ประมาณ 60 นาที")],
        [L("In total", "รวม"), L("about 140 four-option questions · about 3 hours · in English", "ประมาณ 140 ข้อ 4 ตัวเลือก · ประมาณ 3 ชั่วโมง · ภาษาอังกฤษ")]
      ],
      score: L("Scored per subject and as a total; programmes set their own minimums (e.g. 1,000 in total for some Chula science programmes in 2027)", "คิดคะแนนรายวิชาและคะแนนรวม แต่ละหลักสูตรกำหนดเกณฑ์เอง (เช่น รวม 1,000 สำหรับบางหลักสูตรวิทยาศาสตร์ของจุฬาฯ ปี 2570)"),
      facts: m([["Usually used together with CU-AAT or SAT, an English test, a portfolio and an interview.", "มักใช้ร่วมกับ CU-AAT หรือ SAT ผลสอบภาษาอังกฤษ พอร์ตโฟลิโอ และการสัมภาษณ์"],
        ["Some programmes accept other tests instead, such as UCAT, or their own test (e.g. AKAT at Srinakharinwirot). We help you choose.", "บางหลักสูตรรับข้อสอบอื่นแทน เช่น UCAT หรือข้อสอบของตนเอง (เช่น AKAT ของ มศว) เราช่วยเลือกให้"],
        ["Sessions are only a few times a year: plan backwards from the application round.", "เปิดสอบเพียงไม่กี่ครั้งต่อปี ควรวางแผนย้อนจากรอบรับสมัคร"]]),
      url: "https://www.atc.chula.ac.th" },
    { id: "aatm", code: "AAT210", name: "CU-AAT Math", icon: "chart",
      by: L("Chulalongkorn University Academic Testing Center (CU-ATC)", "ศูนย์ทดสอบทางวิชาการแห่งจุฬาลงกรณ์มหาวิทยาลัย (CU-ATC)"),
      what: L("Chulalongkorn Academic Aptitude Test, Math part: a paper-based alternative to SAT Math, accepted by many Thai international programmes.",
              "Chulalongkorn University Academic Aptitude Test ส่วนคณิตศาสตร์ ข้อสอบกระดาษที่ใช้แทน SAT Math ได้ในหลักสูตรนานาชาติหลายแห่งในไทย"),
      parts: [
        [L("Questions", "ข้อสอบ"), L("multiple choice · about 70 min (check the current CU-ATC outline)", "ปรนัย · ประมาณ 70 นาที (ตรวจโครงสร้างล่าสุดของ CU-ATC)")],
        [L("Content", "เนื้อหา"), L("Arithmetic · Algebra · Geometry · Data & problem solving (similar to the pre-2016 SAT)", "เลขคณิต · พีชคณิต · เรขาคณิต · ข้อมูลและโจทย์ปัญหา (คล้าย SAT รุ่นก่อนปี 2016)")],
        [L("Format", "รูปแบบ"), L("Paper-based at test centres in Thailand", "สอบด้วยกระดาษที่ศูนย์สอบในประเทศไทย")]
      ],
      score: L("200–800 for Math (Math + Verbal = up to 1,600) · wrong answers lose ¼ point", "200–800 สำหรับ Math (Math + Verbal รวมสูงสุด 1,600) · ตอบผิดหัก ¼ คะแนน"),
      facts: m([["Unlike the SAT, guessing costs points: we teach when to skip.", "ต่างจาก SAT ตรงที่การเดาผิดเสียคะแนน เราสอนว่าเมื่อไหร่ควรข้าม"],
        ["Example 2027 minimum: CU-AAT Math 450 for some Chula science programmes; some programmes ask for a combined score (e.g. 1,200).", "ตัวอย่างเกณฑ์ปี 2570: CU-AAT Math 450 สำหรับบางหลักสูตรวิทยาศาสตร์ของจุฬาฯ บางหลักสูตรกำหนดคะแนนรวม (เช่น 1,200)"],
        ["Cheaper and nearer than the SAT for students in Thailand, but accepted mainly by Thai universities.", "ค่าสมัครถูกกว่าและสอบใกล้บ้านกว่า SAT แต่ใช้ได้กับมหาวิทยาลัยในไทยเป็นหลัก"]]),
      url: "https://www.atc.chula.ac.th" },
    { id: "aatv", code: "AAT220", name: "CU-AAT Verbal", icon: "pen",
      by: L("Chulalongkorn University Academic Testing Center (CU-ATC)", "ศูนย์ทดสอบทางวิชาการแห่งจุฬาลงกรณ์มหาวิทยาลัย (CU-ATC)"),
      what: L("CU-AAT Verbal part: English reading and writing skills, the paper-based counterpart of SAT Reading and Writing.",
              "CU-AAT ส่วน Verbal วัดทักษะการอ่านและการเขียนภาษาอังกฤษ เทียบได้กับ SAT Reading and Writing แบบกระดาษ"),
      parts: [
        [L("Questions", "ข้อสอบ"), L("multiple choice · about 70 min (check the current CU-ATC outline)", "ปรนัย · ประมาณ 70 นาที (ตรวจโครงสร้างล่าสุดของ CU-ATC)")],
        [L("Critical reading", "การอ่านเชิงวิเคราะห์"), L("Sentence completion · Passage-based reading", "การเติมประโยค · การอ่านบทความ")],
        [L("Writing", "การเขียน"), L("Identifying sentence errors · Improving sentences · Improving paragraphs", "การหาจุดผิดในประโยค · การปรับปรุงประโยค · การปรับปรุงย่อหน้า")]
      ],
      score: L("200–800 for Verbal · wrong answers lose ¼ point", "200–800 สำหรับ Verbal · ตอบผิดหัก ¼ คะแนน"),
      facts: m([["Vocabulary matters more than on the digital SAT: we build it systematically.", "คำศัพท์มีผลมากกว่า Digital SAT เราสร้างคลังคำศัพท์อย่างเป็นระบบ"],
        ["Some programmes set a Verbal minimum (e.g. 400–480 in recent Chula announcements).", "บางหลักสูตรกำหนดเกณฑ์ Verbal ขั้นต่ำ (เช่น 400–480 ในประกาศล่าสุดของจุฬาฯ)"],
        ["Take Math and Verbal in the same session to report one combined score.", "สอบ Math และ Verbal ในรอบเดียวกันเพื่อใช้คะแนนรวม"]]),
      url: "https://www.atc.chula.ac.th" }
  ];

  /* ------------------------------------------------------------ "where are you applying?" chooser */
  D.admTargets = [
    { id: "thint", icon: "school", name: L("Thai international programme", "หลักสูตรนานาชาติในไทย"),
      sub: L("Engineering, science, business, communication, liberal arts…", "วิศวะ วิทยาศาสตร์ บริหารธุรกิจ นิเทศ ศิลปศาสตร์ ฯลฯ"),
      tests: ["ielts", "satm", "satr", "aatm", "aatv"], courses: ["IEL200", "SAT210", "AAT210", "PFL200"],
      need: m([["English: IELTS (or TOEFL, CU-TEP, Duolingo, depending on the programme)", "ภาษาอังกฤษ: IELTS (หรือ TOEFL, CU-TEP, Duolingo แล้วแต่หลักสูตร)"],
        ["Maths/aptitude: SAT or CU-AAT; some programmes need both Math and Verbal/EBRW", "คณิตศาสตร์หรือความถนัด: SAT หรือ CU-AAT บางหลักสูตรต้องใช้ทั้ง Math และ Verbal/EBRW"],
        ["TCAS Round 1 portfolio, then an interview", "พอร์ต TCAS รอบ 1 และการสัมภาษณ์"]]) },
    { id: "thmed", icon: "health", name: L("Thai international medicine & health", "แพทย์และสุขภาพ หลักสูตรนานาชาติในไทย"),
      sub: L("Medicine, dentistry, pharmacy, veterinary, nursing, biomedical", "แพทย์ ทันตแพทย์ เภสัช สัตวแพทย์ พยาบาล ชีวการแพทย์"),
      tests: ["tbat", "aatm", "aatv", "satm", "ielts"], courses: ["TBT300", "AAT210", "AAT220", "IEL200", "PFL200"],
      need: m([["Science: TBAT (replaces BMAT); some programmes accept UCAT or their own test", "วิทยาศาสตร์: TBAT (ใช้แทน BMAT) บางหลักสูตรรับ UCAT หรือข้อสอบของตนเอง"],
        ["Aptitude: CU-AAT or SAT", "ความถนัด: CU-AAT หรือ SAT"],
        ["English: IELTS or equivalent", "ภาษาอังกฤษ: IELTS หรือเทียบเท่า"],
        ["Portfolio with health-related experience, then interviews (often MMI)", "พอร์ตที่มีประสบการณ์ด้านสุขภาพ และการสัมภาษณ์ (มักเป็น MMI)"]]) },
    { id: "uk", icon: "globe", name: L("UK, Europe & Australia", "สหราชอาณาจักร ยุโรป และออสเตรเลีย"),
      sub: L("UCAS and direct applications", "สมัครผ่าน UCAS และสมัครตรง"),
      tests: ["ielts"], courses: ["IEL200", "PFL200"],
      need: m([["English: IELTS Academic (often 6.5–7.5)", "ภาษาอังกฤษ: IELTS Academic (มักต้องการ 6.5–7.5)"],
        ["Grades: A-levels, IB or a foundation year", "ผลการเรียน: A-level, IB หรือ Foundation Year"],
        ["UCAS personal statement; UCAT for UK medicine", "Personal Statement ของ UCAS และ UCAT สำหรับแพทย์ในสหราชอาณาจักร"]]) },
    { id: "us", icon: "building", name: L("United States", "สหรัฐอเมริกา"),
      sub: L("Common App and university applications", "Common App และการสมัครของแต่ละมหาวิทยาลัย"),
      tests: ["satm", "satr", "ielts"], courses: ["SAT210", "SAT220", "IEL200", "PFL200"],
      need: m([["SAT (required again by several selective universities; optional at others)", "SAT (มหาวิทยาลัยชั้นนำหลายแห่งกลับมากำหนดให้ใช้ บางแห่งยังไม่บังคับ)"],
        ["English: TOEFL, IELTS or Duolingo for international students", "ภาษาอังกฤษ: TOEFL, IELTS หรือ Duolingo สำหรับนักเรียนต่างชาติ"],
        ["Common App essay, activities list and recommendations", "เรียงความ Common App รายการกิจกรรม และจดหมายแนะนำ"]]) }
  ];

  /* ------------------------------------------------------------ portfolio building blocks */
  D.admPortfolio = [
    { icon: "trophy", title: L("Scores that open the door", "คะแนนที่เปิดประตู"),
      text: L("IELTS, SAT or CU-AAT, and TBAT for medicine: meet the minimum first, then raise it to be competitive.", "IELTS, SAT หรือ CU-AAT และ TBAT สำหรับสายแพทย์ ผ่านเกณฑ์ขั้นต่ำก่อน แล้วยกระดับให้แข่งขันได้") },
    { icon: "microscope", title: L("A real project or research", "โครงงานหรืองานวิจัยจริง"),
      text: L("One deep project beats ten certificates. Our Innovation Lab and research courses help you build and publish it.", "โครงงานลึกหนึ่งชิ้นมีค่ามากกว่าเกียรติบัตรสิบใบ แล็บนวัตกรรมและหลักสูตรวิจัยของเราช่วยสร้างและเผยแพร่ผลงาน") },
    { icon: "code", title: L("Competitions & certificates", "การแข่งขันและใบรับรอง"),
      text: L("COMPAS, HKICO, olympiads, hackathons and the Swift Student Challenge show skill under pressure.", "COMPAS, HKICO โอลิมปิก แฮกกาธอน และ Swift Student Challenge แสดงความสามารถภายใต้ความกดดัน") },
    { icon: "users", title: L("Leadership & service", "ภาวะผู้นำและจิตอาสา"),
      text: L("Activities that show initiative and care, especially for medicine: volunteering, teaching, health outreach.", "กิจกรรมที่แสดงความริเริ่มและความใส่ใจ โดยเฉพาะสายแพทย์ เช่น จิตอาสา การสอน และกิจกรรมด้านสุขภาพ") },
    { icon: "pen", title: L("Your story in writing", "เรื่องราวของคุณในงานเขียน"),
      text: L("Statement of purpose, UCAS statement or Common App essay: honest, specific and in your own voice.", "SOP, Personal Statement ของ UCAS หรือเรียงความ Common App ที่จริงใจ เฉพาะเจาะจง และเป็นเสียงของคุณเอง") },
    { icon: "present", title: L("Interview ready", "พร้อมสัมภาษณ์"),
      text: L("Panel, online and MMI practice with feedback, so you can explain your choices calmly.", "ฝึกสัมภาษณ์แบบกรรมการ ออนไลน์ และ MMI พร้อมคำแนะนำ เพื่ออธิบายทางเลือกของคุณได้อย่างมั่นใจ") }
  ];

  /* ------------------------------------------------------------ how we prepare you */
  D.admSteps = [
    { icon: "search", name: L("Diagnose", "วัดระดับ"), text: L("A free diagnostic test and a talk about your goals.", "ทดสอบวัดระดับฟรีและพูดคุยเรื่องเป้าหมาย"), output: L("Your starting scores", "คะแนนเริ่มต้นของคุณ") },
    { icon: "pin", name: L("Target", "ตั้งเป้า"), text: L("We map your programmes' current requirements and deadlines.", "เราสรุปเกณฑ์และกำหนดการปัจจุบันของหลักสูตรที่คุณเลือก"), output: L("A dated test plan", "แผนสอบพร้อมวันที่") },
    { icon: "book", name: L("Teach", "สอน"), text: L("One-to-one or small groups, at your pace, online or onsite.", "เรียนตัวต่อตัวหรือกลุ่มเล็ก ตามจังหวะของคุณ ออนไลน์หรือที่แล็บ"), output: L("Skills, not tricks", "ทักษะจริง ไม่ใช่แค่เทคนิค") },
    { icon: "chart", name: L("Train", "ฝึก"), text: L("Timed mocks in the real format and a personal error log.", "ข้อสอบจำลองจับเวลาตามรูปแบบจริง และบันทึกจุดพลาดส่วนตัว"), output: L("Score reports in the portal", "รายงานคะแนนในระบบ") },
    { icon: "review", name: L("Portfolio", "พอร์ต"), text: L("Projects, essays and evidence shaped into one story.", "รวมผลงาน เรียงความ และหลักฐานให้เป็นเรื่องราวเดียว"), output: L("A finished portfolio", "พอร์ตฉบับสมบูรณ์") },
    { icon: "rocket", name: L("Apply", "ยื่นสมัคร"), text: L("Final checks against the latest announcements, then interview practice.", "ตรวจเกณฑ์กับประกาศล่าสุดอีกครั้ง แล้วฝึกสัมภาษณ์"), output: L("Ready on time", "พร้อมทันกำหนด") }
  ];

  /* ------------------------------------------------------------ timeline (Thai school years) */
  D.admTimeline = [
    { when: L("M.4 · Grade 10", "ม.4"), name: L("Explore & build", "สำรวจและสร้างพื้นฐาน"),
      text: L("Diagnostic tests, English foundations, start one real project or research topic, join a competition.", "ทดสอบวัดระดับ ปูพื้นภาษาอังกฤษ เริ่มโครงงานหรืองานวิจัยจริงหนึ่งเรื่อง และลงแข่งขันหนึ่งรายการ") },
    { when: L("M.5 · Grade 11", "ม.5"), name: L("First scores", "สอบได้คะแนนแรก"),
      text: L("First IELTS and SAT or CU-AAT attempts, finish the project, collect evidence for the portfolio.", "สอบ IELTS และ SAT หรือ CU-AAT ครั้งแรก ทำโครงงานให้เสร็จ และเก็บหลักฐานสำหรับพอร์ต") },
    { when: L("M.5 → M.6", "ม.5 → ม.6"), name: L("Raise & specialise", "ยกระดับและเจาะจง"),
      text: L("Retake to reach target scores; TBAT for medicine and health; draft the personal statement.", "สอบซ้ำให้ถึงคะแนนเป้าหมาย สอบ TBAT สำหรับสายแพทย์และสุขภาพ และร่างเรียงความแนะนำตัว") },
    { when: L("M.6 · Grade 12", "ม.6"), name: L("Apply", "ยื่นสมัคร"),
      text: L("TCAS Round 1 portfolio, UCAS and Common App deadlines, interviews and MMI.", "ยื่นพอร์ต TCAS รอบ 1 กำหนดส่ง UCAS และ Common App การสัมภาษณ์และ MMI") }
  ];

  /* ------------------------------------------------------------ minimum score vs. the score that gets you in */
  D.scoreGuide = {
    kinds: [
      { icon: "shield", name: L("The entry ticket", "บัตรผ่านเข้าสนาม"), tag: L("Minimum / qualification", "คะแนนขั้นต่ำ / คุณสมบัติ"),
        text: L("Reach it and your application is read. Everyone above the line is simply \u201cin the race\u201d — it does not rank you.", "ถึงเกณฑ์แล้วใบสมัครของคุณจะถูกพิจารณา ทุกคนที่ผ่านเส้นนี้แค่ \u201cได้ลงสนาม\u201d ยังไม่ได้ถูกจัดอันดับ") },
      { icon: "chart", name: L("The ranking score", "คะแนนที่ใช้จัดอันดับ"), tag: L("Weighting % / composite", "สัดส่วน % / คะแนนรวม"),
        text: L("Scores are turned into points by weight and applicants are ranked until the seats are full — here every extra point counts.", "คะแนนถูกแปลงเป็นแต้มตามสัดส่วน แล้วเรียงลำดับจนเต็มจำนวนที่นั่ง ตรงนี้ทุกแต้มที่เพิ่มมีผลจริง") },
      { icon: "users", name: L("The whole person", "มองทั้งตัวตน"), tag: L("Holistic review", "พิจารณาแบบองค์รวม"),
        text: L("Scores are one part next to grades, essays, activities and interviews. A published range describes past admits; it is not a cut-off.", "คะแนนเป็นเพียงส่วนหนึ่ง ควบคู่กับผลการเรียน เรียงความ กิจกรรม และการสัมภาษณ์ ช่วงคะแนนที่ประกาศคือภาพของผู้ที่เคยได้รับเลือก ไม่ใช่เส้นตัด") }
    ],
    read: [
      [L("“Qualifications”, “eligibility”, “minimum score”", "“คุณสมบัติผู้สมัคร” “คะแนนขั้นต่ำ”"), L("Pass or fail. 6.5 and 8.5 both pass — the higher score adds nothing at this step.", "ผ่านหรือไม่ผ่าน ได้ 6.5 หรือ 8.5 ก็ผ่านเท่ากัน คะแนนที่สูงกว่าไม่ได้เพิ่มอะไรในขั้นนี้")],
      [L("“Selection criteria”, a table of weights (%)", "“เกณฑ์การพิจารณา” ตารางสัดส่วน (%)"), L("Ranked. A higher score earns more points and moves you up.", "จัดอันดับ คะแนนสูงกว่าได้แต้มมากกว่าและขยับอันดับขึ้น")],
      [L("Both appear for the same test", "ข้อสอบเดียวกันอยู่ทั้งสองส่วน"), L("Reach the minimum first, then compete on the same score.", "ต้องถึงขั้นต่ำก่อน แล้วจึงแข่งกันด้วยคะแนนเดียวกันนั้น")]
    ],
    systems: [
      { name: L("International programmes in Thailand", "หลักสูตรนานาชาติในไทย"), how: L("Minimum first, then ranking (often with an interview).", "ผ่านขั้นต่ำก่อน แล้วจัดอันดับ (มักมีสัมภาษณ์ร่วม)"),
        text: L("Example: Chula BBTECH/BISTECH 2027 counts English 20%, Maths 20%, Science 20% and the interview 40% after the minimums are met. Chula BBA's SAT minimum is 1,270, yet the lowest admitted scores reported for recent years were far higher (about 1,340 in 2018 rising to about 1,430 in 2025).", "ตัวอย่าง: BBTECH/BISTECH จุฬาฯ ปี 2570 เมื่อผ่านขั้นต่ำแล้ว คิดคะแนนอังกฤษ 20% คณิต 20% วิทย์ 20% และสัมภาษณ์ 40% ส่วน BBA จุฬาฯ กำหนด SAT ขั้นต่ำ 1,270 แต่มีรายงานว่าคะแนนต่ำสุดของผู้ที่ได้รับเลือกในช่วงหลังสูงกว่านั้นมาก (ประมาณ 1,340 ในปี 2018 และเพิ่มเป็นประมาณ 1,430 ในปี 2025)") },
      { name: L("TCAS Round 3 (Thai track, incl. กสพท)", "TCAS รอบ 3 (ภาคไทย รวม กสพท)"), how: L("Pure ranking by weighted composite.", "จัดอันดับด้วยคะแนนรวมถ่วงน้ำหนักล้วน"),
        text: L("Each subject is scaled and multiplied by the faculty's weights; applicants are ranked until seats are filled. Subject minimums only let you enter. Last year's lowest score is history, not a promise — it moves with the paper and the competition.", "แต่ละวิชาถูกปรับเป็นสัดส่วนแล้วคูณค่าน้ำหนักของคณะ จากนั้นเรียงลำดับจนเต็มที่นั่ง คะแนนขั้นต่ำรายวิชาแค่ให้มีสิทธิ์ลงสนาม คะแนนต่ำสุดของปีก่อนเป็นสถิติ ไม่ใช่คำสัญญา และเปลี่ยนไปตามความยากของข้อสอบและคู่แข่ง") },
      { name: L("United Kingdom", "สหราชอาณาจักร"), how: L("English is a threshold; subject tests compete.", "ภาษาอังกฤษเป็นเกณฑ์ผ่าน ข้อสอบวิชาคือการแข่งขัน"),
        text: L("Meeting the IELTS requirement (often including a minimum in every skill) is what matters; going far above it rarely adds weight, but it opens universities with higher requirements. Grades, UCAT, TMUA or ESAT are where you compete.", "สิ่งสำคัญคือผ่านเกณฑ์ IELTS (มักรวมขั้นต่ำรายทักษะด้วย) การได้สูงกว่าเกณฑ์มากมักไม่เพิ่มน้ำหนัก แต่เปิดทางสู่มหาวิทยาลัยที่ตั้งเกณฑ์สูงกว่า ส่วนที่ต้องแข่งขันคือผลการเรียน UCAT, TMUA หรือ ESAT") },
      { name: L("United States", "สหรัฐอเมริกา"), how: L("Holistic review.", "พิจารณาแบบองค์รวม"),
        text: L("Most universities publish no cut-off. The \u201cmiddle 50%\u201d is the range of the middle half of admitted students — scoring inside it is normal, not a guarantee. English tests are usually minimums.", "มหาวิทยาลัยส่วนใหญ่ไม่มีเส้นตัด ช่วง \u201cmiddle 50%\u201d คือช่วงคะแนนของครึ่งกลางของผู้ที่ได้รับเลือก การอยู่ในช่วงนี้เป็นเรื่องปกติ ไม่ใช่การรับประกัน ส่วนข้อสอบภาษาอังกฤษมักเป็นเกณฑ์ขั้นต่ำ") },
      { name: L("Singapore", "สิงคโปร์"), how: L("Minimum to apply; competitive above it.", "ขั้นต่ำเพื่อยื่น แข่งขันที่คะแนนสูงกว่า"),
        text: L("A figure such as NTU's SAT 1250 lets you apply; students admitted to the most selective courses usually score well above it.", "ตัวเลขอย่าง SAT 1250 ของ NTU ทำให้ยื่นสมัครได้ ส่วนผู้ที่ได้รับเลือกในสาขาที่แข่งขันสูงมักได้คะแนนสูงกว่านั้นมาก") }
    ],
    targets: [
      [L("Chula BBA", "BBA จุฬาฯ"), L("IELTS 6.5 · SAT 1,270", "IELTS 6.5 · SAT 1,270"), L("IELTS 7.5+ · SAT around 1,430 or higher", "IELTS 7.5 ขึ้นไป · SAT ประมาณ 1,430 หรือสูงกว่า")],
      [L("Chula ISE", "ISE จุฬาฯ"), L("SAT Math 620 (or CU-AAT Math 480)", "SAT Math 620 (หรือ CU-AAT Math 480)"), L("SAT Math in the high 700s", "SAT Math ช่วงปลาย 700")],
      [L("Chula Dentistry (Portfolio)", "ทันตแพทย์ จุฬาฯ (Portfolio)"), L("TBAT 1,500 · CU-AAT 1,000", "TBAT 1,500 · CU-AAT 1,000"), L("Clearly above both, with strong Biology and Chemistry", "สูงกว่าเกณฑ์ทั้งสองอย่างชัดเจน โดยเฉพาะชีววิทยาและเคมี")],
      [L("TCAS Round 3 programmes", "หลักสูตรรอบ 3 TCAS"), L("Subject minimums (e.g. 30 per subject for กสพท)", "ขั้นต่ำรายวิชา (เช่น วิชาละ 30 สำหรับ กสพท)"), L("Above last year's lowest admitted score, with a buffer", "สูงกว่าคะแนนต่ำสุดของผู้ที่ได้รับเลือกปีก่อน โดยเผื่อระยะไว้")],
      [L("UK universities", "มหาวิทยาลัยในสหราชอาณาจักร"), L("IELTS 6.5–7.5, often with a band minimum", "IELTS 6.5–7.5 มักมีขั้นต่ำรายทักษะ"), L("Meet every band on the first try; put the extra effort into UCAT / TMUA / ESAT and grades", "ผ่านทุกทักษะตั้งแต่ครั้งแรก แล้วทุ่มเวลาที่เหลือให้ UCAT / TMUA / ESAT และผลการเรียน")]
    ],
    advice: L("Our rule of thumb: treat the minimum as the start line. We plan towards the score that wins seats, keep a buffer for a harder paper, and remember that interviews and portfolios often carry real weight too.", "หลักของเรา: มองคะแนนขั้นต่ำเป็นเส้นออกตัว เราวางแผนไปที่คะแนนที่ชนะที่นั่ง เผื่อระยะไว้สำหรับข้อสอบที่ยากขึ้น และอย่าลืมว่าการสัมภาษณ์และพอร์ตโฟลิโอมักมีน้ำหนักจริงด้วย")
  };
  D.testScoreNote = L("A minimum score lets you apply; it is not a promise of a place. Where a programme ranks by weighted scores, every point above the minimum helps — so we aim for the competitive score, not the minimum.", "คะแนนขั้นต่ำทำให้คุณยื่นสมัครได้ แต่ไม่ได้รับประกันที่นั่ง หากหลักสูตรจัดอันดับด้วยคะแนนถ่วงน้ำหนัก ทุกแต้มที่เกินขั้นต่ำมีผล เราจึงตั้งเป้าที่คะแนนที่แข่งขันได้ ไม่ใช่แค่ขั้นต่ำ");

  /* ------------------------------------------------------------ FAQ */
  D.admFaq = [
    { q: L("If the requirement is IELTS 6.5, does everyone with 6.5 get in?", "ถ้าเกณฑ์คือ IELTS 6.5 ทุกคนที่ได้ 6.5 จะได้เข้าไหม?"),
      a: L("No. A minimum only lets you apply. If English is part of the programme's weighting, 8.0 earns more points than 6.5; if it is only a qualification (as in most UK offers), 6.5 and 8.0 pass the same way — and the competition happens on grades, other tests, the portfolio and the interview. See \u201cMinimum score or winning score?\u201d above.", "ไม่ คะแนนขั้นต่ำแค่ทำให้ยื่นสมัครได้ ถ้าภาษาอังกฤษอยู่ในสัดส่วนคะแนนของหลักสูตร ได้ 8.0 จะได้แต้มมากกว่า 6.5 แต่ถ้าเป็นแค่คุณสมบัติ (เช่นการรับเข้าในสหราชอาณาจักรส่วนใหญ่) 6.5 กับ 8.0 ผ่านเหมือนกัน และการแข่งขันอยู่ที่ผลการเรียน ข้อสอบอื่น พอร์ตโฟลิโอ และการสัมภาษณ์ ดูหัวข้อ \u201cคะแนนขั้นต่ำหรือคะแนนที่ชนะ?\u201d ด้านบน") },
    { q: L("Thai track or international programme — which should we aim for?", "ภาคไทยหรือหลักสูตรนานาชาติ ควรเลือกแบบไหน?"),
      a: L("They use different tests: the Thai track goes through TCAS with TGAT, TPAT and A-Level (and กสพท for medicine), while international programmes use SAT or CU-AAT, IELTS/TOEFL and subject tests such as TBAT or UCAT. Many students keep both doors open: the same strong Maths, Physics and English serve both. Use the finder above, then ask us for a plan.",
           "ใช้ข้อสอบต่างกัน ภาคไทยผ่าน TCAS ด้วย TGAT, TPAT และ A-Level (และ กสพท สำหรับแพทย์) ส่วนหลักสูตรนานาชาติใช้ SAT หรือ CU-AAT, IELTS/TOEFL และข้อสอบเฉพาะ เช่น TBAT หรือ UCAT นักเรียนจำนวนมากเปิดทางไว้ทั้งสองทาง เพราะคณิต ฟิสิกส์ และอังกฤษที่แข็งแรงชุดเดียวใช้ได้กับทั้งสองแบบ ลองใช้ตัวค้นหาด้านบน แล้วขอแผนจากเรา") },
    { q: L("When should we start?", "ควรเริ่มเมื่อไร?"),
      a: L("Core Maths, Physics and English from M.1–M.3 make everything later easier. Test-specific preparation usually starts in M.4–M.5, and Portfolio-round tests (TBAT, CU-AAT, UCAT, SAT, IELTS) are mostly taken before or early in M.6.", "คณิต ฟิสิกส์ และอังกฤษช่วง ม.1–ม.3 ทำให้ทุกอย่างหลังจากนั้นง่ายขึ้น การเตรียมสอบเฉพาะทางมักเริ่ม ม.4–ม.5 และข้อสอบสำหรับรอบ Portfolio (TBAT, CU-AAT, UCAT, SAT, IELTS) ส่วนใหญ่สอบก่อนหรือช่วงต้น ม.6") },
    { q: L("Is the BMAT still available?", "ยังสอบ BMAT ได้อยู่หรือไม่?"),
      a: L("No. Cambridge discontinued the BMAT. UK medical schools moved to the UCAT, and Thai international medicine programmes now use the TBAT (with CU-AAT or SAT) or, at some universities, the UCAT or their own test such as AKAT. Our TBT300 course prepares you for the TBAT.",
           "ไม่ได้แล้ว Cambridge ยกเลิกการสอบ BMAT โรงเรียนแพทย์ในสหราชอาณาจักรเปลี่ยนไปใช้ UCAT ส่วนหลักสูตรนานาชาติแพทย์ในไทยใช้ TBAT (ร่วมกับ CU-AAT หรือ SAT) และบางมหาวิทยาลัยใช้ UCAT หรือข้อสอบของตนเอง เช่น AKAT หลักสูตร TBT300 ของเราเตรียมสอบ TBAT โดยตรง") },
    { q: L("SAT or CU-AAT: which one should I take?", "ควรสอบ SAT หรือ CU-AAT?"),
      a: L("If you only apply to Thai programmes that accept both, the CU-AAT is cheaper and closer to home, but it penalises wrong answers. If you may apply abroad, take the SAT. We check which tests your exact programmes accept.",
           "ถ้ายื่นเฉพาะหลักสูตรในไทยที่รับทั้งสองแบบ CU-AAT ค่าสอบถูกกว่าและสอบใกล้บ้าน แต่ตอบผิดถูกหักคะแนน ถ้ามีโอกาสยื่นต่างประเทศ ควรสอบ SAT เราช่วยตรวจว่าหลักสูตรของคุณรับข้อสอบใดบ้าง") },
    { q: L("What does \"EBRW\" mean?", "\"EBRW\" คืออะไร?"),
      a: L("Evidence-Based Reading and Writing: the old name of the SAT's Reading and Writing section. Programmes that ask for an EBRW score mean today's SAT Reading and Writing score (200–800).",
           "Evidence-Based Reading and Writing เป็นชื่อเดิมของส่วน Reading and Writing ใน SAT หลักสูตรที่ขอคะแนน EBRW หมายถึงคะแนน SAT Reading and Writing ปัจจุบัน (200–800)") },
    { q: L("How long does preparation take?", "ต้องเตรียมตัวนานเท่าไร?"),
      a: L("It depends on your starting point and target, so there are no fixed hours. Many students need 2–4 months per test; earlier is calmer. After the diagnostic we give you an honest plan.",
           "ขึ้นอยู่กับระดับเริ่มต้นและเป้าหมาย จึงไม่มีจำนวนชั่วโมงตายตัว นักเรียนส่วนใหญ่ใช้ 2–4 เดือนต่อหนึ่งข้อสอบ ยิ่งเริ่มเร็วยิ่งไม่เร่ง หลังวัดระดับเราจะให้แผนที่ตรงไปตรงมา") },
    { q: L("Do you guarantee a score or a place?", "รับประกันคะแนนหรือที่เรียนไหม?"),
      a: L("No one honestly can. We guarantee a clear plan, real practice in the real format, regular score reports to you and your parents, and up-to-date requirements.",
           "ไม่มีใครรับประกันได้อย่างซื่อตรง สิ่งที่เรารับประกันคือแผนที่ชัดเจน การฝึกตามรูปแบบจริง รายงานคะแนนสม่ำเสมอถึงผู้เรียนและผู้ปกครอง และข้อมูลเกณฑ์ที่เป็นปัจจุบัน") },
    { q: L("How do I get the latest requirements?", "จะรู้เกณฑ์ล่าสุดได้อย่างไร?"),
      a: L("Ask us anytime by LINE, email or the contact form. Requirements change every year and sometimes mid-year; we check the official announcements of the programmes you choose and reply with the current rules and dates.",
           "สอบถามเราได้ทุกเมื่อทาง LINE อีเมล หรือแบบฟอร์มติดต่อ เกณฑ์เปลี่ยนทุกปีและบางครั้งเปลี่ยนกลางปี เราตรวจประกาศทางการของหลักสูตรที่คุณเลือก แล้วแจ้งเกณฑ์และกำหนดการปัจจุบันให้") }
  ];

  /* ------------------------------------------------------------ official sources (shown under the explorer) */
  D.admSources = [
    { name: "IELTS", url: "https://ielts.org" },
    { name: "College Board · SAT", url: "https://satsuite.collegeboard.org/sat" },
    { name: "CU-ATC · CU-AAT, TBAT", url: "https://www.atc.chula.ac.th" },
    { name: "UCAT", url: "https://www.ucat.ac.uk" },
    { name: "TCAS (mytcas)", url: "https://www.mytcas.com" }
  ];
})();
