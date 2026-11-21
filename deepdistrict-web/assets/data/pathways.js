/* ==========================================================================
   DeepDistrict.si — university pathways and core academics
   (loads after catalogue.js)
   --------------------------------------------------------------------------
   • Core academics group: intensive Mathematics, Physics and English from
     lower secondary (M.1) up — the base for STEM & AI and for every test.
   • Thai entrance-exam courses (TGAT/TPAT3, A-Level, TPAT1) and UCAT,
     TMUA/ESAT for medicine and UK applications.
   • D.pathways: which tests each popular programme uses (Thai track,
     international track, abroad). Researched October 2026 from
     university announcements and Thai admissions news; anything not
     confirmed is written as "check with us". Requirements change every year.
   ========================================================================== */
(function () {
  var D = window.DD_CONTENT;
  function L(en, th) { return { en: en, th: th }; }
  function m(list) { return list.map(function (x) { return L(x[0], x[1]); }); }
  var ALL = ["online", "onsite", "hybrid"];

  /* ------------------------------------------------------------ group + track: core academics */
  D.tracks.push({
    id: "acad", icon: "book", name: L("Maths, Physics & English", "คณิตศาสตร์ ฟิสิกส์ และภาษาอังกฤษ"),
    text: L("Intensive core subjects from M.1 to M.6 — the base for STEM, AI and every entrance test.", "วิชาแกนแบบเข้มข้นตั้งแต่ ม.1 ถึง ม.6 ฐานของ STEM, AI และการสอบเข้าทุกสนาม"),
    tech: ["Mathematics", "Physics", "English", "M.1–M.6"]
  });
  D.groups.unshift({
    id: "core", icon: "book", tracks: ["acad"],
    name: L("Core Academics: Maths · Physics · English", "วิชาแกน: คณิต · ฟิสิกส์ · อังกฤษ"),
    text: L("Intensive, level-by-level teaching from lower secondary up, so STEM projects and entrance tests both come easily.", "สอนเข้มข้นทีละระดับตั้งแต่ ม.ต้น เพื่อให้ทั้งโครงงาน STEM และการสอบเข้าเป็นเรื่องง่าย")
  });

  var add = [
    { code: "MTH130", track: "acad", level: 1, hours: 48,
      title: L("Intensive Mathematics · M.1–M.3", "คณิตศาสตร์เข้มข้น ม.1–ม.3"),
      text: L("Number sense, algebra, geometry and data taught for understanding, with problem solving one step beyond school — ready for M.4 science-maths classes and olympiad camps.", "จำนวน พีชคณิต เรขาคณิต และสถิติ เรียนให้เข้าใจจริง พร้อมโจทย์ที่ก้าวเกินบทเรียนในโรงเรียนหนึ่งขั้น พร้อมสำหรับห้องวิทย์-คณิต ม.4 และค่ายโอลิมปิก"),
      tools: ["Problem sets", "Visual maths", "Monthly check-ups"] },
    { code: "PHY130", track: "acad", level: 1, hours: 36,
      title: L("Physics Foundations · M.2–M.3", "ฟิสิกส์พื้นฐาน ม.2–ม.3"),
      text: L("Motion, forces, energy, electricity and waves through experiments, graphs and simple algebra — physics that makes sense before M.4.", "การเคลื่อนที่ แรง พลังงาน ไฟฟ้า และคลื่น ผ่านการทดลอง กราฟ และพีชคณิตเบื้องต้น ให้ฟิสิกส์เข้าใจได้ก่อนขึ้น ม.4"),
      tools: ["Lab kits", "Sensors", "Graphing"] },
    { code: "ENG130", track: "acad", level: 1, hours: 48,
      title: L("English Foundations · M.1–M.3", "ภาษาอังกฤษพื้นฐาน ม.1–ม.3"),
      text: L("Grammar that sticks, reading longer texts, clear paragraphs and confident speaking — the base for IELTS, SAT and TGAT later.", "ไวยากรณ์ที่ใช้ได้จริง การอ่านบทความยาวขึ้น การเขียนย่อหน้าที่ชัดเจน และการพูดอย่างมั่นใจ ฐานของ IELTS, SAT และ TGAT ในอนาคต"),
      tools: ["Graded readers", "Writing feedback", "Speaking club"] },
    { code: "MTH230", track: "acad", level: 2, hours: 60,
      title: L("Intensive Mathematics · M.4–M.6 (A-Level Maths 1 · SAT · CU-AAT)", "คณิตศาสตร์เข้มข้น ม.4–ม.6 (A-Level คณิต 1 · SAT · CU-AAT)"),
      text: L("Functions, trigonometry, sequences, vectors, matrices, calculus, probability and statistics — one programme that serves A-Level Maths 1, SAT/CU-AAT Math, TPAT3 and later TMUA.", "ฟังก์ชัน ตรีโกณมิติ ลำดับ เวกเตอร์ เมทริกซ์ แคลคูลัส ความน่าจะเป็น และสถิติ หลักสูตรเดียวที่ใช้ได้ทั้ง A-Level คณิต 1, SAT/CU-AAT Math, TPAT3 และต่อยอดสู่ TMUA"),
      tools: ["Past-style papers", "Error log", "Desmos"] },
    { code: "PHY230", track: "acad", level: 2, hours: 60,
      title: L("Intensive Physics · M.4–M.6 (A-Level Physics · TPAT3 · TBAT)", "ฟิสิกส์เข้มข้น ม.4–ม.6 (A-Level ฟิสิกส์ · TPAT3 · TBAT)"),
      text: L("Mechanics, waves, electricity and magnetism, thermal and modern physics with real problem-solving method — in Thai and English for A-Level, TPAT3, TBAT and ESAT.", "กลศาสตร์ คลื่น ไฟฟ้าและแม่เหล็ก ความร้อน และฟิสิกส์ยุคใหม่ พร้อมวิธีแก้โจทย์อย่างเป็นระบบ ทั้งภาษาไทยและอังกฤษ สำหรับ A-Level, TPAT3, TBAT และ ESAT"),
      tools: ["Problem method", "Lab data", "Bilingual notes"] },
    { code: "ENG230", track: "acad", level: 2, hours: 60,
      title: L("Academic English · M.4–M.6 (TGAT1 · A-Level · IELTS/SAT bridge)", "ภาษาอังกฤษเชิงวิชาการ ม.4–ม.6 (TGAT1 · A-Level · ปูทาง IELTS/SAT)"),
      text: L("Academic vocabulary, fast accurate reading, grammar for tests, essay writing and presentation — for TGAT1 and A-Level English, and the bridge into IELTS and SAT.", "คำศัพท์เชิงวิชาการ การอ่านเร็วและแม่น ไวยากรณ์สำหรับข้อสอบ การเขียนเรียงความ และการนำเสนอ สำหรับ TGAT1 และ A-Level ภาษาอังกฤษ และปูทางสู่ IELTS และ SAT"),
      tools: ["Reading sprints", "Essay feedback", "Mock tests"] },
    // Thai entrance exams
    { code: "TGT220", track: "admit", level: 2, hours: 36,
      title: L("TGAT & TPAT3 (Science, Technology & Engineering)", "TGAT และ TPAT3 (วิทยาศาสตร์ เทคโนโลยี วิศวกรรมศาสตร์)"),
      text: L("The general aptitude test every Thai applicant takes, plus TPAT3 for engineering, science and technology programmes in TCAS.", "ข้อสอบความถนัดทั่วไปที่ผู้สมัครทุกคนต้องสอบ และ TPAT3 สำหรับวิศวกรรม วิทยาศาสตร์ และเทคโนโลยีในระบบ TCAS"),
      tools: ["Timed mocks", "Spatial practice", "Mechanics reasoning"] },
    { code: "ALV240", track: "admit", level: 2, hours: 72,
      title: L("A-Level Intensive: Maths 1, Physics, Chemistry, Biology, English", "A-Level เข้มข้น: คณิต 1 ฟิสิกส์ เคมี ชีววิทยา อังกฤษ"),
      text: L("Exam-focused revision of the A-Level subjects used by TCAS Round 3 — including the seven subjects of the medical (กสพท) route — with full mock papers.", "ทบทวนแบบเน้นข้อสอบในวิชา A-Level ที่ใช้ใน TCAS รอบ 3 รวมทั้ง 7 วิชาของเส้นทางแพทย์ (กสพท) พร้อมข้อสอบจำลองเต็มฉบับ"),
      tools: ["Full mock papers", "Topic drills", "Score tracking"] },
    { code: "TPT310", track: "admit", level: 3, hours: 30,
      title: L("Thai Medical Route: TPAT1 (กสพท) & MMI Interview", "เส้นทางแพทย์ไทย: TPAT1 (กสพท) และการสัมภาษณ์ MMI"),
      text: L("Reasoning, medical ethics and connections — the three parts of TPAT1 — plus multiple-mini-interview practice for medicine, dentistry, pharmacy and veterinary routes.", "เชาวน์ปัญญา จริยธรรมทางการแพทย์ และความคิดเชื่อมโยง ซึ่งเป็นสามส่วนของ TPAT1 พร้อมฝึกสัมภาษณ์แบบ MMI สำหรับแพทย์ ทันตะ เภสัช และสัตวแพทย์"),
      tools: ["Ethics cases", "Reasoning sets", "Mock MMI"] },
    { code: "UCT300", track: "admit", level: 3, hours: 30,
      title: L("UCAT: Medicine in Thailand and the UK", "UCAT: แพทย์ในไทยและสหราชอาณาจักร"),
      text: L("Verbal reasoning, decision making, quantitative reasoning and situational judgement at real speed — used by Ramathibodi and Thammasat's CICM as well as UK medical schools.", "Verbal Reasoning, Decision Making, Quantitative Reasoning และ Situational Judgement ด้วยความเร็วตามจริง ใช้ทั้งที่แพทย์รามาฯ และ CICM ธรรมศาสตร์ รวมถึงโรงเรียนแพทย์ในสหราชอาณาจักร"),
      tools: ["Timed question banks", "SJ frameworks", "Full mocks"] },
    { code: "UKT320", track: "admit", level: 3, hours: 30,
      title: L("UK Admissions Tests: TMUA & ESAT", "ข้อสอบเข้ามหาวิทยาลัยสหราชอาณาจักร: TMUA และ ESAT"),
      text: L("The maths and science tests now used by Cambridge, Imperial, Oxford and others for engineering, sciences, mathematics, computer science and economics.", "ข้อสอบคณิตศาสตร์และวิทยาศาสตร์ที่ Cambridge, Imperial, Oxford และอีกหลายแห่งใช้กับวิศวกรรม วิทยาศาสตร์ คณิตศาสตร์ วิทยาการคอมพิวเตอร์ และเศรษฐศาสตร์"),
      tools: ["Timed papers", "Non-calculator maths", "Proof & logic"] }
  ];
  add.forEach(function (c) { D.courses.push(c); });

  var det = {
    MTH130: { modes: ALL, modules: m([["Numbers, fractions, ratio & percentage — fast and exact", "จำนวน เศษส่วน อัตราส่วน และร้อยละ อย่างรวดเร็วและแม่นยำ"], ["Algebra: expressions, equations, inequalities", "พีชคณิต: นิพจน์ สมการ และอสมการ"], ["Geometry: angles, triangles, Pythagoras, area & volume", "เรขาคณิต: มุม สามเหลี่ยม พีทาโกรัส พื้นที่ และปริมาตร"], ["Graphs, linear functions & data", "กราฟ ฟังก์ชันเชิงเส้น และข้อมูล"], ["Word problems & proof thinking", "โจทย์ปัญหาและการคิดเชิงพิสูจน์"], ["Challenge sets towards POSN & science-maths classes", "โจทย์ท้าทายสู่ สอวน. และห้องวิทย์-คณิต"]]),
      outcomes: m([["Strong, fast basics with no gaps", "พื้นฐานแน่นและเร็ว ไม่มีช่องโหว่"], ["Explain why, not just how", "อธิบายได้ว่าทำไม ไม่ใช่แค่ทำอย่างไร"], ["Ready for M.4 enrichment classes", "พร้อมสำหรับห้องเรียนพิเศษ ม.4"]]),
      prereq: L("Ages 12–15 (M.1–M.3); a placement test first", "อายุ 12–15 ปี (ม.1–ม.3) มีแบบทดสอบวัดระดับก่อนเรียน"), project: L("A personal maths portfolio and monthly progress reports to parents", "พอร์ตคณิตศาสตร์ส่วนตัว และรายงานความก้าวหน้ารายเดือนถึงผู้ปกครอง") },
    PHY130: { modes: ALL, modules: m([["Measurement, units & graphs", "การวัด หน่วย และกราฟ"], ["Motion & forces", "การเคลื่อนที่และแรง"], ["Work, energy & power", "งาน พลังงาน และกำลัง"], ["Electricity & circuits", "ไฟฟ้าและวงจร"], ["Waves, light & sound", "คลื่น แสง และเสียง"], ["Hands-on experiments with sensors", "การทดลองจริงด้วยเซนเซอร์"]]),
      outcomes: m([["Understand physics instead of memorising", "เข้าใจฟิสิกส์แทนการท่องจำ"], ["Read and draw graphs from data", "อ่านและสร้างกราฟจากข้อมูล"], ["Start M.4 physics with confidence", "เริ่มเรียนฟิสิกส์ ม.4 อย่างมั่นใจ"]]),
      prereq: L("M.2–M.3; basic algebra", "ม.2–ม.3 และพีชคณิตเบื้องต้น"), project: L("A small experiment report with measured data", "รายงานการทดลองขนาดเล็กพร้อมข้อมูลที่วัดจริง") },
    ENG130: { modes: ALL, modules: m([["Core grammar & sentence building", "ไวยากรณ์หลักและการสร้างประโยค"], ["Vocabulary that grows every week", "คำศัพท์ที่เพิ่มขึ้นทุกสัปดาห์"], ["Reading longer texts", "การอ่านบทความที่ยาวขึ้น"], ["Writing clear paragraphs", "การเขียนย่อหน้าที่ชัดเจน"], ["Listening & speaking with confidence", "การฟังและการพูดอย่างมั่นใจ"], ["Mini presentations", "การนำเสนอสั้น ๆ"]]),
      outcomes: m([["Use grammar correctly in your own writing", "ใช้ไวยากรณ์ได้ถูกต้องในงานเขียนของตนเอง"], ["Read and write at the next level", "อ่านและเขียนได้ในระดับที่สูงขึ้น"], ["Speak up in class and in interviews", "กล้าพูดในห้องเรียนและการสัมภาษณ์"]]),
      prereq: L("M.1–M.3; level test first", "ม.1–ม.3 มีแบบทดสอบวัดระดับก่อนเรียน"), project: L("A short talk and a portfolio of corrected writing", "การพูดนำเสนอสั้น ๆ และแฟ้มงานเขียนที่ผ่านการแก้ไข") },
    MTH230: { modes: ALL, modules: m([["Functions, exponentials & logarithms", "ฟังก์ชัน เอกซ์โพเนนเชียล และลอการิทึม"], ["Trigonometry, sequences & series", "ตรีโกณมิติ ลำดับ และอนุกรม"], ["Vectors, matrices & complex numbers", "เวกเตอร์ เมทริกซ์ และจำนวนเชิงซ้อน"], ["Calculus: limits, derivatives, integrals", "แคลคูลัส: ลิมิต อนุพันธ์ และปริพันธ์"], ["Probability & statistics", "ความน่าจะเป็นและสถิติ"], ["Exam technique for A-Level Maths 1, SAT and CU-AAT", "เทคนิคข้อสอบ A-Level คณิต 1, SAT และ CU-AAT"]]),
      outcomes: m([["Cover the whole upper-secondary syllabus deeply", "ครอบคลุมหลักสูตร ม.ปลาย อย่างลึกซึ้ง"], ["Score high in A-Level Maths 1 and SAT/CU-AAT Math", "ทำคะแนนสูงใน A-Level คณิต 1 และ SAT/CU-AAT Math"], ["Be ready for engineering, medicine and data science", "พร้อมสำหรับวิศวกรรม แพทย์ และวิทยาการข้อมูล"]]),
      prereq: L("M.4–M.6 (or MTH130)", "ม.4–ม.6 (หรือผ่าน MTH130)"), project: L("Full mock papers with a personal error log", "ข้อสอบจำลองเต็มฉบับพร้อมบันทึกจุดพลาดส่วนตัว") },
    PHY230: { modes: ALL, modules: m([["Mechanics: kinematics, dynamics, momentum, rotation", "กลศาสตร์: จลนศาสตร์ พลศาสตร์ โมเมนตัม การหมุน"], ["Oscillations & waves", "การสั่นและคลื่น"], ["Electricity, magnetism & induction", "ไฟฟ้า แม่เหล็ก และการเหนี่ยวนำ"], ["Thermal physics & fluids", "ฟิสิกส์ความร้อนและของไหล"], ["Modern physics: atoms, nuclei, quanta", "ฟิสิกส์ยุคใหม่: อะตอม นิวเคลียส และควอนตัม"], ["Exam technique: A-Level, TPAT3, TBAT and ESAT", "เทคนิคข้อสอบ A-Level, TPAT3, TBAT และ ESAT"]]),
      outcomes: m([["Solve multi-step physics problems reliably", "แก้โจทย์ฟิสิกส์หลายขั้นตอนได้อย่างมั่นใจ"], ["Answer in Thai or English", "ทำข้อสอบได้ทั้งภาษาไทยและอังกฤษ"], ["Strong scores for engineering and medicine routes", "คะแนนแข็งแรงสำหรับสายวิศวกรรมและแพทย์"]]),
      prereq: L("M.4–M.6 (or PHY130); MTH230 alongside", "ม.4–ม.6 (หรือผ่าน PHY130) เรียนควบคู่ MTH230"), project: L("Topic tests and full mocks with a gap report", "ทดสอบรายบทและข้อสอบจำลองเต็มฉบับพร้อมรายงานจุดอ่อน") },
    ENG230: { modes: ALL, modules: m([["Academic vocabulary & collocations", "คำศัพท์และวลีเชิงวิชาการ"], ["Reading for main idea, inference & detail at speed", "อ่านจับใจความ อนุมาน และรายละเอียดอย่างรวดเร็ว"], ["Grammar & error recognition for tests", "ไวยากรณ์และการหาจุดผิดสำหรับข้อสอบ"], ["Essay & report writing", "การเขียนเรียงความและรายงาน"], ["Speaking: discussion & presentation", "การพูด: อภิปรายและนำเสนอ"], ["TGAT1 & A-Level English practice", "ฝึกข้อสอบ TGAT1 และ A-Level ภาษาอังกฤษ"]]),
      outcomes: m([["High TGAT1 and A-Level English scores", "คะแนน TGAT1 และ A-Level ภาษาอังกฤษสูง"], ["Ready to start IELTS or SAT preparation", "พร้อมเริ่มเตรียม IELTS หรือ SAT"], ["Write and speak like a university student", "เขียนและพูดได้แบบนักศึกษามหาวิทยาลัย"]]),
      prereq: L("M.4–M.6 (or ENG130)", "ม.4–ม.6 (หรือผ่าน ENG130)"), project: L("A researched essay and a recorded presentation", "เรียงความที่ค้นคว้าข้อมูล และการนำเสนอที่บันทึกไว้") },
    TGT220: { modes: ALL, modules: m([["How TCAS uses TGAT and TPAT", "TCAS ใช้ TGAT และ TPAT อย่างไร"], ["TGAT1 English communication", "TGAT1 การสื่อสารภาษาอังกฤษ"], ["TGAT2 critical & logical thinking", "TGAT2 การคิดอย่างมีเหตุผล"], ["TGAT3 future workforce competencies", "TGAT3 สมรรถนะการทำงาน"], ["TPAT3 numerical, spatial & mechanical aptitude", "TPAT3 ความถนัดด้านตัวเลข มิติสัมพันธ์ และเชิงกล"], ["Timed mocks", "ข้อสอบจำลองจับเวลา"]]),
      outcomes: m([["Know every question type before exam day", "รู้จักข้อสอบทุกรูปแบบก่อนวันสอบ"], ["Manage time across long papers", "บริหารเวลาในข้อสอบยาวได้"], ["Strong TGAT/TPAT3 for engineering and science", "คะแนน TGAT/TPAT3 แข็งแรงสำหรับวิศวกรรมและวิทยาศาสตร์"]]),
      prereq: L("M.5–M.6; MTH230 and PHY230 help", "ม.5–ม.6 ควรเรียนควบคู่ MTH230 และ PHY230"), project: L("Full timed mocks of TGAT and TPAT3", "ข้อสอบจำลองเต็มรูปแบบของ TGAT และ TPAT3") },
    ALV240: { modes: ALL, modules: m([["A-Level structure & scoring", "โครงสร้างและการให้คะแนนของ A-Level"], ["Maths 1 intensive", "คณิต 1 แบบเข้มข้น"], ["Physics & Chemistry intensive", "ฟิสิกส์และเคมีแบบเข้มข้น"], ["Biology for health routes", "ชีววิทยาสำหรับสายสุขภาพ"], ["English for A-Level", "ภาษาอังกฤษสำหรับ A-Level"], ["Full mock week", "สัปดาห์ข้อสอบจำลองเต็มฉบับ"]]),
      outcomes: m([["Know your score per subject before the real exam", "รู้คะแนนรายวิชาก่อนสอบจริง"], ["Close the biggest gaps first", "ปิดช่องโหว่ใหญ่ที่สุดก่อน"], ["Meet the minimums of your chosen programmes", "ผ่านเกณฑ์ขั้นต่ำของหลักสูตรที่เลือก"]]),
      prereq: L("M.6 (or late M.5)", "ม.6 (หรือปลาย ม.5)"), project: L("Mock A-Level papers with a subject-by-subject plan", "ข้อสอบ A-Level จำลองพร้อมแผนรายวิชา") },
    TPT310: { modes: ALL, modules: m([["The กสพท route and score weighting", "เส้นทาง กสพท และสัดส่วนคะแนน"], ["TPAT1 part 1: reasoning", "TPAT1 ส่วนที่ 1: เชาวน์ปัญญา"], ["TPAT1 part 2: medical ethics", "TPAT1 ส่วนที่ 2: จริยธรรมทางการแพทย์"], ["TPAT1 part 3: connections", "TPAT1 ส่วนที่ 3: ความคิดเชื่อมโยง"], ["MMI stations & communication", "สถานี MMI และการสื่อสาร"], ["Mock TPAT1 and mock MMI", "TPAT1 จำลองและ MMI จำลอง"]]),
      outcomes: m([["Approach ethics questions with a clear framework", "ตอบคำถามจริยธรรมด้วยกรอบคิดที่ชัดเจน"], ["Answer interview stations calmly", "ตอบสถานีสัมภาษณ์อย่างมีสติ"], ["A complete medical-route plan with A-Level", "แผนเส้นทางแพทย์ที่ครบพร้อม A-Level"]]),
      prereq: L("M.5–M.6 aiming at medicine, dentistry, pharmacy or veterinary science", "ม.5–ม.6 ที่มุ่งแพทย์ ทันตแพทย์ เภสัช หรือสัตวแพทย์"), project: L("Two full TPAT1 mocks and a recorded mock MMI", "TPAT1 จำลองเต็มฉบับ 2 ชุด และ MMI จำลองที่บันทึกไว้") },
    UCT300: { modes: ALL, modules: m([["UCAT format, timing & scoring", "รูปแบบ เวลา และการให้คะแนน UCAT"], ["Verbal Reasoning at speed", "Verbal Reasoning อย่างรวดเร็ว"], ["Decision Making: logic, Venn, probability", "Decision Making: ตรรกะ แผนภาพเวนน์ ความน่าจะเป็น"], ["Quantitative Reasoning with the on-screen calculator", "Quantitative Reasoning ด้วยเครื่องคิดเลขบนจอ"], ["Situational Judgement: professional values", "Situational Judgement: คุณค่าทางวิชาชีพ"], ["Full timed mocks", "ข้อสอบจำลองเต็มรูปแบบจับเวลา"]]),
      outcomes: m([["Work at UCAT speed without panic", "ทำข้อสอบได้ทันความเร็ว UCAT โดยไม่ตื่นตระหนก"], ["A strong SJ band", "ได้ SJ Band ที่ดี"], ["A score that keeps Thai and UK options open", "คะแนนที่เปิดทางทั้งในไทยและสหราชอาณาจักร"]]),
      prereq: L("M.5–M.6; good English (ENG230 or IEL200)", "ม.5–ม.6 และภาษาอังกฤษดี (ENG230 หรือ IEL200)"), project: L("Full UCAT mocks with a section-by-section plan", "UCAT จำลองเต็มรูปแบบพร้อมแผนรายพาร์ต") },
    UKT320: { modes: ALL, modules: m([["Which UK courses use TMUA or ESAT", "สาขาใดในสหราชอาณาจักรใช้ TMUA หรือ ESAT"], ["TMUA paper 1: applications of maths", "TMUA ฉบับที่ 1: การประยุกต์คณิตศาสตร์"], ["TMUA paper 2: mathematical reasoning & proof", "TMUA ฉบับที่ 2: การให้เหตุผลและการพิสูจน์"], ["ESAT maths modules", "ESAT ส่วนคณิตศาสตร์"], ["ESAT physics, chemistry or biology modules", "ESAT ส่วนฟิสิกส์ เคมี หรือชีววิทยา"], ["Timed papers without a calculator", "ข้อสอบจับเวลาโดยไม่ใช้เครื่องคิดเลข"]]),
      outcomes: m([["Fast, accurate maths without a calculator", "คำนวณเร็วและแม่นโดยไม่ใช้เครื่องคิดเลข"], ["Spot the trick in reasoning questions", "มองเห็นกับดักในโจทย์การให้เหตุผล"], ["A competitive score for Oxbridge and Imperial", "คะแนนที่แข่งขันได้สำหรับ Oxbridge และ Imperial"]]),
      prereq: L("Strong M.5–M.6 maths (MTH230) and physics (PHY230)", "คณิต ม.5–ม.6 (MTH230) และฟิสิกส์ (PHY230) ที่แข็งแรง"), project: L("Timed full papers with worked solutions", "ข้อสอบเต็มฉบับจับเวลาพร้อมเฉลยละเอียด") }
  };
  Object.keys(det).forEach(function (k) { D.details[k] = det[k]; });

  /* ------------------------------------------------------------ test facts for the new test courses */
  function where(rows) { return rows.map(function (r) { return r.map(function (c) { return L(c[0], c[1]); }); }); }
  D.testInfo.TGT220 = { name: "TGAT · TPAT3", url: "https://www.mytcas.com",
    where: where([[["All Thai universities in TCAS", "ทุกมหาวิทยาลัยในระบบ TCAS"], ["TGAT: most programmes; TPAT3: engineering, science and technology", "TGAT: เกือบทุกหลักสูตร · TPAT3: วิศวกรรม วิทยาศาสตร์ และเทคโนโลยี"], ["Round 3 (Admission), some Round 2", "รอบ 3 (Admission) และบางโครงการรอบ 2"]]]),
    measures: L("TGAT1 English communication, TGAT2 critical and logical thinking, TGAT3 future workforce competencies; TPAT3 numerical, spatial and mechanical/physics aptitude plus interest in science and engineering.", "TGAT1 การสื่อสารภาษาอังกฤษ TGAT2 การคิดอย่างมีเหตุผล TGAT3 สมรรถนะการทำงาน และ TPAT3 ความถนัดด้านตัวเลข มิติสัมพันธ์ และเชิงกล/ฟิสิกส์ รวมถึงความสนใจด้านวิทยาศาสตร์และวิศวกรรม"),
    format: L("TCAS70: register 4–10 Nov 2026, exams 30 Jan–1 Feb 2027 on paper. TPAT3: 70 questions, 180 minutes.", "TCAS70: สมัคร 4–10 พ.ย. 2569 สอบ 30 ม.ค.–1 ก.พ. 2570 ด้วยกระดาษ TPAT3: 70 ข้อ 180 นาที"),
    validity: L("Used for that year's TCAS.", "ใช้ในระบบ TCAS ของปีที่สอบ"),
    targets: [[L("Engineering (e.g. Chula, KMITL, KMUTT, CMU)", "วิศวกรรมศาสตร์ (เช่น จุฬาฯ สจล. มจธ. มช.)"), L("TGAT + TPAT3 + A-Level Maths 1, Physics, Chemistry — weights differ by faculty", "TGAT + TPAT3 + A-Level คณิต 1 ฟิสิกส์ เคมี สัดส่วนต่างกันตามคณะ")]] };
  D.testInfo.ALV240 = { name: "A-Level", url: "https://www.mytcas.com",
    where: where([[["All Thai universities in TCAS", "ทุกมหาวิทยาลัยในระบบ TCAS"], ["Almost every faculty, incl. the medical (กสพท) route", "เกือบทุกคณะ รวมเส้นทางแพทย์ (กสพท)"], ["Round 3 (Admission), some Round 2", "รอบ 3 (Admission) และบางโครงการรอบ 2"]]]),
    measures: L("Subject knowledge at upper-secondary level: Maths 1 and 2, Science, Physics, Chemistry, Biology, Social Studies, Thai, English and other languages.", "ความรู้รายวิชาระดับ ม.ปลาย: คณิต 1 และ 2 วิทยาศาสตร์ประยุกต์ ฟิสิกส์ เคมี ชีววิทยา สังคม ไทย อังกฤษ และภาษาต่างประเทศอื่น"),
    format: L("TCAS70: register 14–20 Jan 2027, exams 13–15 Mar 2027.", "TCAS70: สมัคร 14–20 ม.ค. 2570 สอบ 13–15 มี.ค. 2570"),
    validity: L("Used for that year's TCAS.", "ใช้ในระบบ TCAS ของปีที่สอบ"),
    targets: [[L("Medicine, dentistry, pharmacy, vet (กสพท)", "แพทย์ ทันตะ เภสัช สัตวแพทย์ (กสพท)"), L("7 subjects = 70%: Maths 1, Physics, Chemistry, Biology, English, Thai, Social (minimum 30 each, as reported) + TPAT1 30%", "7 วิชา = 70%: คณิต 1 ฟิสิกส์ เคมี ชีวะ อังกฤษ ไทย สังคม (รายงานว่าขั้นต่ำวิชาละ 30) + TPAT1 30%")], [L("Engineering", "วิศวกรรมศาสตร์"), L("Maths 1, Physics, Chemistry with TGAT/TPAT3", "คณิต 1 ฟิสิกส์ เคมี ร่วมกับ TGAT/TPAT3")]] };
  D.testInfo.TPT310 = { name: "TPAT1 (กสพท)", url: "https://www.mytcas.com",
    where: where([[["Medical schools in the กสพท consortium (e.g. Chula, Siriraj, Ramathibodi, CMU, Phramongkutklao)", "คณะแพทย์ในกลุ่ม กสพท (เช่น จุฬาฯ ศิริราช รามาฯ มช. วพม.)"], ["Medicine, dentistry, pharmacy, veterinary science", "แพทย์ ทันตแพทย์ เภสัช สัตวแพทย์"], ["TCAS Round 3 (Admission) via กสพท", "TCAS รอบ 3 (Admission) ผ่าน กสพท"]], [["Phramongkutklao College of Medicine (วพม.)", "วิทยาลัยแพทยศาสตร์พระมงกุฎเกล้า (วพม.)"], ["Medicine — 110 places (TCAS70), military-medicine conditions apply", "แพทยศาสตร์ — 110 ที่นั่ง (TCAS70) มีเงื่อนไขแพทย์ทหาร"], ["Round 3 via กสพท", "รอบ 3 ผ่าน กสพท"]]]),
    measures: L("Three parts: reasoning, medical ethics and connections.", "สามส่วน: เชาวน์ปัญญา จริยธรรมทางการแพทย์ และความคิดเชื่อมโยง"),
    format: L("TCAS70: register with กสพท 1–20 Sep 2026; exam 13 Feb 2027. Interviews (often MMI) follow.", "TCAS70: สมัครผ่าน กสพท 1–20 ก.ย. 2569 สอบ 13 ก.พ. 2570 แล้วจึงสัมภาษณ์ (มักเป็น MMI)"),
    validity: L("Used for that year's กสพท admission.", "ใช้ในการคัดเลือก กสพท ของปีที่สอบ"),
    targets: [[L("กสพท medicine", "แพทย์ กสพท"), L("TPAT1 30% + 7 A-Level subjects 70% — places are very competitive", "TPAT1 30% + A-Level 7 วิชา 70% การแข่งขันสูงมาก")]] };
  D.testInfo.UCT300 = { name: "UCAT", url: "https://www.ucat.ac.uk",
    where: where([[["Mahidol — Ramathibodi", "มหิดล — รามาธิบดี"], ["Medicine (Portfolio, 70 places in 3 programmes)", "แพทยศาสตร์ (Portfolio 70 ที่นั่ง 3 โครงการ)"], ["TCAS70 Round 1 (Portfolio)", "TCAS70 รอบ 1 (Portfolio)"]], [["Thammasat — CICM", "ธรรมศาสตร์ — CICM"], ["MD International Program", "แพทยศาสตร์ หลักสูตรนานาชาติ"], ["International admission", "รอบรับสมัครนานาชาติ"]], [["UK medical & dental schools", "โรงเรียนแพทย์และทันตแพทย์ในสหราชอาณาจักร"], ["Medicine, dentistry", "แพทย์ ทันตแพทย์"], ["UCAS (October deadline)", "UCAS (ปิดรับเดือนตุลาคม)"]], [["Australia & New Zealand (UCAT ANZ)", "ออสเตรเลียและนิวซีแลนด์ (UCAT ANZ)"], ["Many undergraduate medicine programmes", "หลักสูตรแพทย์ระดับปริญญาตรีหลายแห่ง"], ["University applications", "การสมัครของแต่ละมหาวิทยาลัย"]]]),
    measures: L("Verbal Reasoning, Decision Making, Quantitative Reasoning (each 300–900) and Situational Judgement (Band 1–4); Abstract Reasoning was removed from 2025.", "Verbal Reasoning, Decision Making, Quantitative Reasoning (ส่วนละ 300–900) และ Situational Judgement (Band 1–4) ส่วน Abstract Reasoning ยกเลิกตั้งแต่ปี 2025"),
    format: L("Computer test, about 2 hours, taken in the summer before applying.", "สอบด้วยคอมพิวเตอร์ ประมาณ 2 ชั่วโมง สอบช่วงกลางปีก่อนยื่นสมัคร"),
    validity: L("Valid for one admission cycle only (e.g. CICM accepted only the 2025 UCAT for 2026 entry).", "ใช้ได้เพียงหนึ่งรอบการรับสมัคร (เช่น CICM รับเฉพาะ UCAT ปี 2025 สำหรับเข้าเรียนปี 2026)"),
    targets: [[L("Ramathibodi Portfolio (TCAS70)", "พอร์ตรามาฯ (TCAS70)"), L("UCAT required from everyone, no minimum score, SJ Band 1–3", "ทุกคนต้องมีคะแนน UCAT ไม่กำหนดขั้นต่ำ แต่ SJ ต้องได้ Band 1–3")], [L("CICM (2026 guideline)", "CICM (ประกาศปี 2569)"), L("UCAT + IELTS 6.5 (no one-skill retake) or TOEFL iBT 79 or TU-GET; English MMI", "UCAT + IELTS 6.5 (ไม่รับ One Skill Retake) หรือ TOEFL iBT 79 หรือ TU-GET และ MMI ภาษาอังกฤษ")]] };
  D.testInfo.UKT320 = { name: "TMUA · ESAT", url: "https://esat-tmua.ac.uk",
    where: where([[["University of Cambridge", "University of Cambridge"], ["ESAT: engineering, natural sciences and others; TMUA: economics, computer science and others", "ESAT: วิศวกรรม วิทยาศาสตร์ธรรมชาติ ฯลฯ · TMUA: เศรษฐศาสตร์ วิทยาการคอมพิวเตอร์ ฯลฯ"], ["UCAS (October deadline)", "UCAS (ปิดรับเดือนตุลาคม)"]], [["Imperial College London", "Imperial College London"], ["ESAT: engineering and physics", "ESAT: วิศวกรรมและฟิสิกส์"], ["UCAS", "UCAS"]], [["University of Oxford", "University of Oxford"], ["Physics, engineering, materials (ESAT replacing PAT); maths-based courses (TMUA)", "ฟิสิกส์ วิศวกรรม วัสดุศาสตร์ (ESAT แทน PAT) และสาขาที่ใช้คณิต (TMUA)"], ["UCAS — check which entry year applies", "UCAS — ตรวจสอบปีที่เริ่มใช้"]]]),
    measures: L("TMUA: mathematical thinking in two papers. ESAT: modules in Maths 1, Maths 2, Physics, Chemistry and Biology; you take the modules your course asks for. ESAT replaced NSAA, ENGAA and PAT.", "TMUA: การคิดเชิงคณิตศาสตร์สองฉบับ ESAT: ชุดวิชาคณิต 1 คณิต 2 ฟิสิกส์ เคมี และชีววิทยา โดยสอบเฉพาะชุดที่สาขากำหนด ESAT มาแทน NSAA, ENGAA และ PAT"),
    format: L("Computer tests at test centres, windows in October and January (Oxbridge applicants: October).", "สอบด้วยคอมพิวเตอร์ที่ศูนย์สอบ มีรอบเดือนตุลาคมและมกราคม (ผู้สมัคร Oxbridge ใช้รอบตุลาคม)"),
    validity: L("For that year's application cycle.", "ใช้ในรอบการสมัครของปีนั้น"),
    targets: [[L("Oxbridge & Imperial", "Oxbridge และ Imperial"), L("No fixed pass mark; competitive applicants score well above average", "ไม่มีเกณฑ์ผ่านตายตัว ผู้สมัครที่แข่งขันได้มักได้คะแนนสูงกว่าค่าเฉลี่ยมาก")]] };

  /* ------------------------------------------------------------ the Thai admission system, in short */
  D.tcasSystem = {
    rounds: [
      { n: "1", name: L("Portfolio", "Portfolio"), text: L("Portfolio plus programme tests (e.g. TBAT, CU-AAT, UCAT, SAT, IELTS, COMPAS, POSN camps). Opens Sep–Dec of M.6.", "แฟ้มสะสมผลงานร่วมกับคะแนนที่หลักสูตรกำหนด (เช่น TBAT, CU-AAT, UCAT, SAT, IELTS, COMPAS, ค่าย สอวน.) เปิดรับช่วง ก.ย.–ธ.ค. ของ ม.6") },
      { n: "2", name: L("Quota", "Quota"), text: L("Regional, school or special quotas, often with TGAT/TPAT/A-Level or olympiad camps.", "โควตาภูมิภาค โรงเรียน หรือโครงการพิเศษ มักใช้ TGAT/TPAT/A-Level หรือค่ายโอลิมปิก") },
      { n: "3", name: L("Admission", "Admission"), text: L("The big national round: TGAT, TPAT and A-Level scores; medicine through กสพท (TPAT1 + A-Level).", "รอบใหญ่ระดับประเทศ ใช้คะแนน TGAT, TPAT และ A-Level ส่วนแพทย์ผ่าน กสพท (TPAT1 + A-Level)") },
      { n: "4", name: L("Direct Admission", "Direct Admission"), text: L("Remaining places, each university's own criteria.", "ที่นั่งที่เหลือ ตามเกณฑ์ของแต่ละมหาวิทยาลัย") }
    ],
    tests: [
      { name: "TGAT", text: L("General aptitude: English, critical thinking, future workforce competencies.", "ความถนัดทั่วไป: ภาษาอังกฤษ การคิดอย่างมีเหตุผล สมรรถนะการทำงาน"), when: L("Exam 30 Jan–1 Feb 2027", "สอบ 30 ม.ค.–1 ก.พ. 2570"), code: "TGT220" },
      { name: "TPAT1–5", text: L("Professional aptitude: TPAT1 medicine (กสพท), TPAT2 arts, TPAT3 science & engineering, TPAT4 architecture, TPAT5 education.", "ความถนัดวิชาชีพ: TPAT1 แพทย์ (กสพท) TPAT2 ศิลปกรรม TPAT3 วิทยาศาสตร์และวิศวกรรม TPAT4 สถาปัตยกรรม TPAT5 ครุศาสตร์"), when: L("TPAT1: 13 Feb 2027 · TPAT2–5: 30 Jan–1 Feb 2027", "TPAT1: 13 ก.พ. 2570 · TPAT2–5: 30 ม.ค.–1 ก.พ. 2570"), code: "TPT310" },
      { name: "A-Level", text: L("Subject tests: Maths 1 & 2, Physics, Chemistry, Biology, English, Thai, Social Studies and more.", "ข้อสอบรายวิชา: คณิต 1 และ 2 ฟิสิกส์ เคมี ชีววิทยา อังกฤษ ไทย สังคม และอื่น ๆ"), when: L("Exam 13–15 Mar 2027", "สอบ 13–15 มี.ค. 2570"), code: "ALV240" }
    ]
  };

  /* ------------------------------------------------------------ pathways: which tests for which programme
     type: "thai" (Thai-language track via TCAS), "intl" (international programme in Thailand), "abroad" */
  function P(field, type, uni, prog, route, tests, req, courses, url) { return { field: field, type: type, uni: uni, prog: prog, route: route, tests: tests, req: req, courses: courses, url: url }; }
  D.pathFields = [
    { id: "med", icon: "health", name: L("Medicine", "แพทยศาสตร์") },
    { id: "health", icon: "dna", name: L("Dentistry & pharmacy", "ทันตแพทย์และเภสัช") },
    { id: "bme", icon: "chip", name: L("Biomedical engineering & science", "วิศวกรรมชีวการแพทย์และวิทยาศาสตร์") },
    { id: "comp", icon: "code", name: L("Computer engineering & ISE", "วิศวกรรมคอมพิวเตอร์และ ISE") },
    { id: "biz", icon: "chart", name: L("BBA & economics", "BBA และเศรษฐศาสตร์") },
    { id: "inno", icon: "spark", name: L("Integrated innovation", "นวัตกรรมบูรณาการ") },
    { id: "abroad", icon: "globe", name: L("Universities abroad", "มหาวิทยาลัยต่างประเทศ") }
  ];
  D.pathways = [
    // ---------- medicine
    P("med", "thai", L("กสพท consortium: Chula, Mahidol (Siriraj, Ramathibodi), CMU and others", "กลุ่ม กสพท: จุฬาฯ มหิดล (ศิริราช รามาฯ) มช. และอื่น ๆ"), L("Doctor of Medicine (Thai track)", "แพทยศาสตรบัณฑิต (ภาคไทย)"), L("TCAS Round 3 via กสพท", "TCAS รอบ 3 ผ่าน กสพท"),
      ["TPAT1", "A-Level ×7"], L("TPAT1 30% + A-Level 70% (Maths 1, Physics, Chemistry, Biology, English, Thai, Social). TCAS70: TPAT1 on 13 Feb 2027, A-Level 13–15 Mar 2027.", "TPAT1 30% + A-Level 70% (คณิต 1 ฟิสิกส์ เคมี ชีวะ อังกฤษ ไทย สังคม) TCAS70: TPAT1 วันที่ 13 ก.พ. 2570 และ A-Level 13–15 มี.ค. 2570"), ["TPT310", "ALV240", "MTH230", "PHY230"], "https://www.mytcas.com"),
    P("med", "thai", L("Phramongkutklao College of Medicine (วพม.)", "วิทยาลัยแพทยศาสตร์พระมงกุฎเกล้า (วพม.)"), L("Doctor of Medicine — military medicine", "แพทยศาสตรบัณฑิต — แพทย์ทหาร"), L("TCAS Round 3 via กสพท", "TCAS รอบ 3 ผ่าน กสพท"),
      ["TPAT1", "A-Level ×7"], L("110 places in TCAS70. Register for TPAT1 with กสพท by 20 Sep 2026 and sit all 7 A-Level subjects; extra military-college conditions and scholarship types.", "รับ 110 คนใน TCAS70 ต้องสมัคร TPAT1 กับ กสพท ภายใน 20 ก.ย. 2569 และสอบ A-Level ครบ 7 วิชา มีเงื่อนไขเพิ่มเติมของวิทยาลัยแพทย์ทหารและประเภททุน"), ["TPT310", "ALV240"], "https://pcm.ac.th/"),
    P("med", "thai", L("Chulalongkorn University", "จุฬาลงกรณ์มหาวิทยาลัย"), L("Medicine — Portfolio", "แพทยศาสตร์ — Portfolio"), L("TCAS70 Round 1", "TCAS70 รอบ 1"),
      ["TBAT", "CU-AAT", "English"], L("24 places. TBAT and CU-AAT (October 2026 session) with a high English score; no GPAX minimum.", "24 ที่นั่ง ใช้ TBAT และ CU-AAT (รอบสอบ ต.ค. 2569) ร่วมกับคะแนนภาษาอังกฤษระดับสูง ไม่กำหนด GPAX"), ["TBT300", "AAT210", "AAT220", "IEL200"], "https://www.md.chula.ac.th/"),
    P("med", "thai", L("Mahidol — Ramathibodi", "มหิดล — รามาธิบดี"), L("Medicine — Portfolio (3 programmes)", "แพทยศาสตร์ — Portfolio (3 โครงการ)"), L("TCAS70 Round 1", "TCAS70 รอบ 1"),
      ["UCAT"], L("70 places. Everyone submits UCAT; no minimum score but Situational Judgement Band 1–3.", "70 ที่นั่ง ทุกคนต้องยื่น UCAT ไม่กำหนดคะแนนขั้นต่ำ แต่ Situational Judgement ต้องได้ Band 1–3"), ["UCT300", "ENG230"], "https://www.rama.mahidol.ac.th/"),
    P("med", "thai", L("Chiang Mai University", "มหาวิทยาลัยเชียงใหม่"), L("Medicine — Portfolio (4 projects)", "แพทยศาสตร์ — Portfolio (4 โครงการ)"), L("TCAS70 Round 1", "TCAS70 รอบ 1"),
      ["Portfolio", "Olympiad"], L("75 places across 4 projects; olympiad participation or national selection in the last 3 years scores portfolio points. Check each project's criteria.", "75 ที่นั่งใน 4 โครงการ การเข้าร่วมโอลิมปิกวิชาการหรือการคัดเลือกผู้แทนประเทศภายใน 3 ปีได้คะแนนพอร์ต ต้องตรวจเกณฑ์ของแต่ละโครงการ"), ["PFL200", "EXM230"], "https://www.mytcas.com"),
    P("med", "intl", L("Thammasat — Chulabhorn International College of Medicine (CICM)", "ธรรมศาสตร์ — วิทยาลัยแพทยศาสตร์นานาชาติจุฬาภรณ์ (CICM)"), L("MD International Program (6 years)", "แพทยศาสตร์ หลักสูตรนานาชาติ (6 ปี)"), L("International admission", "รอบรับสมัครนานาชาติ"),
      ["UCAT", "IELTS 6.5"], L("2026 guideline: 32 places; UCAT (that cycle only), IELTS 6.5 with no one-skill retake / TOEFL iBT 79 / TU-GET; biology, chemistry and maths or physics in school; English MMI.", "ประกาศปี 2569: 32 ที่นั่ง ใช้ UCAT (เฉพาะรอบปีนั้น) IELTS 6.5 ไม่รับ One Skill Retake หรือ TOEFL iBT 79 หรือ TU-GET ต้องเรียนชีวะ เคมี และคณิตหรือฟิสิกส์ และสัมภาษณ์ MMI ภาษาอังกฤษ"), ["UCT300", "IEL200", "PHY230"], "https://www.cicm.tu.ac.th/"),
    P("med", "intl", L("Chulabhorn Royal Academy — Princess Srisavangavadhana College of Medicine", "ราชวิทยาลัยจุฬาภรณ์ — วิทยาลัยแพทยศาสตร์ศรีสวางควัฒน"), L("Doctor of Medicine with UCL (iBSc in London)", "แพทยศาสตรบัณฑิต ร่วมกับ UCL (iBSc ที่ลอนดอน)"), L("Own announcement each year", "ประกาศของวิทยาลัยแต่ละปี"),
      ["Ask us"], L("Six years in Thailand plus one year at University College London for an iBSc. We did not find the 2027 criteria yet — ask us and we will check the current announcement.", "เรียนในไทย 6 ปีและที่ University College London 1 ปีเพื่อรับ iBSc ยังไม่พบเกณฑ์ปี 2570 สอบถามเราเพื่อให้ช่วยตรวจประกาศล่าสุด"), ["ENG230", "MTH230", "PHY230"], "https://pscm.cra.ac.th/"),
    P("med", "intl", L("Chulalongkorn — CU-MEDi", "จุฬาฯ — CU-MEDi"), L("4-year international MD after a bachelor's degree", "แพทยศาสตร์นานาชาติ 4 ปี สำหรับผู้จบปริญญาตรีแล้ว"), L("Graduate entry", "รับผู้จบปริญญาตรี"),
      ["MCAT", "IELTS 7.0"], L("Not a school-leaver route: a bachelor's degree, MCAT and IELTS 7.0 or TOEFL iBT 85 (2025 requirements). A path after science or engineering degrees.", "ไม่ใช่เส้นทางสำหรับนักเรียน ม.6 ต้องมีปริญญาตรี MCAT และ IELTS 7.0 หรือ TOEFL iBT 85 (เกณฑ์ปี 2568) เป็นทางเลือกหลังจบวิทยาศาสตร์หรือวิศวกรรม"), ["IEL200"], "https://cu-medi.md.chula.ac.th/"),
    // ---------- dentistry & pharmacy
    P("health", "thai", L("Chulalongkorn University", "จุฬาลงกรณ์มหาวิทยาลัย"), L("Dentistry — Portfolio", "ทันตแพทยศาสตร์ — Portfolio"), L("TCAS70 Round 1", "TCAS70 รอบ 1"),
      ["TBAT", "CU-AAT"], L("TBAT total ≥ 1,500 (Biology ≥ 500, Chemistry ≥ 400) and CU-AAT ≥ 1,000; scores up to 2 years old.", "TBAT รวม ≥ 1,500 (ชีววิทยา ≥ 500 เคมี ≥ 400) และ CU-AAT ≥ 1,000 ใช้คะแนนย้อนหลังได้ไม่เกิน 2 ปี"), ["TBT300", "AAT210", "AAT220"], "https://www.dent.chula.ac.th/"),
    P("health", "thai", L("Mahidol University", "มหาวิทยาลัยมหิดล"), L("Pharmacy — Portfolio", "เภสัชศาสตร์ — Portfolio"), L("TCAS70 Round 1", "TCAS70 รอบ 1"),
      ["GPAX", "English"], L("20 places through TCASFolio only, with GPAX and English-score criteria (reported GPAX 3.50).", "20 ที่นั่ง ยื่นผ่าน TCASFolio เท่านั้น มีเกณฑ์ GPAX และคะแนนภาษาอังกฤษ (รายงานว่า GPAX 3.50)"), ["ENG230", "IEL200", "PFL200"], "https://www.mytcas.com"),
    P("health", "thai", L("Chiang Mai University", "มหาวิทยาลัยเชียงใหม่"), L("Pharmacy — Portfolio (4 projects)", "เภสัชศาสตร์ — Portfolio (4 โครงการ)"), L("TCAS70 Round 1", "TCAS70 รอบ 1"),
      ["Portfolio"], L("55 places across 4 projects; criteria differ per project.", "55 ที่นั่งใน 4 โครงการ เกณฑ์ต่างกันตามโครงการ"), ["PFL200", "ALV240"], "https://www.mytcas.com"),
    P("health", "thai", L("Pharmacy faculties in กสพท", "คณะเภสัชศาสตร์ในกลุ่ม กสพท"), L("Pharmacy (Thai track)", "เภสัชศาสตร์ (ภาคไทย)"), L("TCAS Round 3 via กสพท", "TCAS รอบ 3 ผ่าน กสพท"),
      ["TPAT1", "A-Level ×7"], L("Same route as medicine: TPAT1 + 7 A-Level subjects.", "เส้นทางเดียวกับแพทย์: TPAT1 + A-Level 7 วิชา"), ["TPT310", "ALV240"], "https://www.mytcas.com"),
    // ---------- BME & science
    P("bme", "thai", L("Mahidol, Chula, CMU, KMITL and others", "มหิดล จุฬาฯ มช. สจล. และอื่น ๆ"), L("Biomedical engineering (Thai track)", "วิศวกรรมชีวการแพทย์ (ภาคไทย)"), L("TCAS Round 3 (and Round 1 Portfolio)", "TCAS รอบ 3 (และรอบ 1 Portfolio)"),
      ["TGAT", "TPAT3", "A-Level"], L("Round 3 usually TGAT + TPAT3 + A-Level Maths 1, Physics, Chemistry. Portfolio examples ask GPAX and science/maths grades around 3.25 and IELTS about 5.5 — check each faculty.", "รอบ 3 มักใช้ TGAT + TPAT3 + A-Level คณิต 1 ฟิสิกส์ เคมี ส่วนรอบ Portfolio มีตัวอย่างกำหนด GPAX และเกรดวิทย์-คณิตประมาณ 3.25 และ IELTS ประมาณ 5.5 ต้องตรวจแต่ละคณะ"), ["TGT220", "MTH230", "PHY230", "ALV240"], "https://www.mytcas.com"),
    P("bme", "intl", L("Chulalongkorn — Faculty of Science", "จุฬาฯ — คณะวิทยาศาสตร์"), L("BBTECH / BISTECH (biotechnology, international)", "BBTECH / BISTECH (เทคโนโลยีชีวภาพ หลักสูตรนานาชาติ)"), L("International admission (2027)", "รอบรับสมัครนานาชาติ (2570)"),
      ["CU-AAT/SAT Math", "TBAT", "English"], L("Maths: CU-AAT Math ≥ 450 or SAT Math ≥ 550 or ACT Math ≥ 25; science: e.g. TBAT ≥ 1,000; weighting English 20%, Maths 20%, Science 20%, interview 40%.", "คณิต: CU-AAT Math ≥ 450 หรือ SAT Math ≥ 550 หรือ ACT Math ≥ 25 วิทยาศาสตร์: เช่น TBAT ≥ 1,000 สัดส่วน อังกฤษ 20% คณิต 20% วิทย์ 20% สัมภาษณ์ 40%"), ["AAT210", "SAT210", "TBT300", "IEL200"], "https://www.bbtech.sc.chula.ac.th/"),
    // ---------- computer engineering & ISE
    P("comp", "thai", L("Chulalongkorn — Computer Engineering", "จุฬาฯ — วิศวกรรมคอมพิวเตอร์"), L("CP and CEDT", "CP และ CEDT"), L("Round 1 Portfolio (e.g. COMPAS) · Round 3", "รอบ 1 Portfolio (เช่น COMPAS) · รอบ 3"),
      ["COMPAS", "TGAT", "TPAT3", "A-Level"], L("Portfolio: the top COMPAS scorer of a round may apply; Round 3 uses TGAT, TPAT3 and A-Level.", "Portfolio: ผู้ได้คะแนน COMPAS สูงสุดของรอบยื่นได้ รอบ 3 ใช้ TGAT, TPAT3 และ A-Level"), ["EXM210", "EXM220", "TGT220", "MTH230"], "https://compas.cp.eng.chula.ac.th/"),
    P("comp", "intl", L("Chulalongkorn — ISE", "จุฬาฯ — ISE"), L("International School of Engineering", "วิศวกรรมศาสตร์ หลักสูตรนานาชาติ (ISE)"), L("International admission", "รอบรับสมัครนานาชาติ"),
      ["SAT/CU-AAT Math", "IELTS"], L("SAT Math ≥ 620 or CU-AAT Math ≥ 480 (recent cycles) plus an English test (IELTS around 6.0+).", "SAT Math ≥ 620 หรือ CU-AAT Math ≥ 480 (รอบล่าสุด) ร่วมกับผลสอบภาษาอังกฤษ (IELTS ประมาณ 6.0 ขึ้นไป)"), ["SAT210", "AAT210", "IEL200", "MTH230"], "https://www.chula.ac.th/en/academics/admissions/undergraduate-admissions/"),
    P("comp", "intl", L("KMITL — International programmes", "สจล. — หลักสูตรนานาชาติ"), L("Software engineering, computer engineering and other engineering", "วิศวกรรมซอฟต์แวร์ วิศวกรรมคอมพิวเตอร์ และวิศวกรรมอื่น"), L("TCAS Round 1–2 international rounds", "TCAS รอบ 1–2 สำหรับหลักสูตรนานาชาติ"),
      ["IELTS 6.0", "SAT/A-Level Math"], L("2026 rounds: IELTS 6.0 minimum English; maths from A-Level Maths 1, SAT Math or ACT Math; SAT/GSAT 1020 listed as an optional academic record.", "รอบปี 2569: ภาษาอังกฤษขั้นต่ำ IELTS 6.0 คณิตใช้ A-Level คณิต 1, SAT Math หรือ ACT Math และ SAT/GSAT 1020 เป็นผลการเรียนเสริม (ไม่บังคับ)"), ["IEL200", "SAT210", "MTH230", "CP230"], "https://www.reg.kmitl.ac.th/"),
    P("comp", "intl", L("KMUTT — International programmes", "มจธ. — หลักสูตรนานาชาติ"), L("Computer science & engineering", "วิทยาการคอมพิวเตอร์และวิศวกรรม"), L("International admission", "รอบรับสมัครนานาชาติ"),
      ["IELTS", "SAT"], L("Per-programme score table (e.g. Computer Science lists IELTS ≥ 5.0); English can be waived for native speakers.", "มีตารางคะแนนรายหลักสูตร (เช่น Computer Science กำหนด IELTS ≥ 5.0) และยกเว้นภาษาอังกฤษได้สำหรับเจ้าของภาษา"), ["IEL200", "SAT210", "PY101"], "https://iadmission.kmutt.ac.th/"),
    P("comp", "intl", L("Thammasat — SIIT", "ธรรมศาสตร์ — SIIT"), L("Engineering & technology (international)", "วิศวกรรมและเทคโนโลยี (นานาชาติ)"), L("International admission", "รอบรับสมัครนานาชาติ"),
      ["SAT", "IELTS 6.0"], L("SAT (or SIIT's own exam) plus English such as IELTS 6.0, TOEFL 61 or TU-GET 500 (secondary sources — we confirm the current figures).", "SAT (หรือข้อสอบของ SIIT) ร่วมกับภาษาอังกฤษ เช่น IELTS 6.0, TOEFL 61 หรือ TU-GET 500 (ข้อมูลจากแหล่งรอง เราช่วยยืนยันเกณฑ์ปัจจุบัน)"), ["SAT210", "IEL200", "MTH230"], "https://www.mytcas.com"),
    P("comp", "thai", L("Mahidol — ICT; Thammasat — Science & Technology", "มหิดล — ICT · ธรรมศาสตร์ — วิทยาศาสตร์และเทคโนโลยี"), L("Computing quotas for POSN campers", "โควตาสายคอมพิวเตอร์สำหรับผู้ผ่านค่าย สอวน."), L("Round 2 (Mahidol ICT) · Round 1 (Thammasat)", "รอบ 2 (ICT มหิดล) · รอบ 1 (ธรรมศาสตร์)"),
      ["POSN"], L("Passing POSN camps opens dedicated quota and portfolio places.", "การผ่านค่าย สอวน. เปิดโควตาและที่นั่งพอร์ตเฉพาะ"), ["EXM230", "CP230"], "https://www.posn.or.th/"),
    // ---------- business & economics
    P("biz", "intl", L("Chulalongkorn — BBA", "จุฬาฯ — BBA"), L("Bachelor of Business Administration (international)", "บริหารธุรกิจ หลักสูตรนานาชาติ"), L("International admission (Early / Round 1–2)", "รอบรับสมัครนานาชาติ (Early / รอบ 1–2)"),
      ["SAT/CU-AAT", "IELTS 6.5"], L("IELTS 6.5 minimum (7.5+ is competitive); SAT total ≥ 1,270–1,300 (Math and EBRW from one sitting) or CU-AAT ≥ 1,200.", "IELTS ขั้นต่ำ 6.5 (ถ้าจะแข่งขันได้ควร 7.5+) SAT รวม ≥ 1,270–1,300 (Math และ EBRW จากรอบเดียวกัน) หรือ CU-AAT ≥ 1,200"), ["SAT210", "SAT220", "AAT210", "AAT220", "IEL200"], "https://www.chula.ac.th/en/academics/admissions/undergraduate-admissions/"),
    P("biz", "intl", L("Thammasat — BBA (TBS)", "ธรรมศาสตร์ — BBA (TBS)"), L("Bachelor of Business Administration (international)", "บริหารธุรกิจ หลักสูตรนานาชาติ"), L("International admission", "รอบรับสมัครนานาชาติ"),
      ["SAT", "IELTS 6.0"], L("IELTS 6.0 with no band below 5.5; SAT total about 1,280 (2026 cycle).", "IELTS 6.0 และไม่มีทักษะใดต่ำกว่า 5.5 SAT รวมประมาณ 1,280 (รอบปี 2569)"), ["SAT210", "SAT220", "IEL200"], "https://www.mytcas.com"),
    P("biz", "intl", L("Mahidol — MUIC", "มหิดล — MUIC"), L("Business & other majors (international college)", "บริหารธุรกิจและสาขาอื่น (วิทยาลัยนานาชาติ)"), L("Fast track / regular rounds", "รอบ Fast track / รอบปกติ"),
      ["IELTS 6.0", "SAT/ACT Math"], L("Fast track skips MUIC's English exam with IELTS 6.0 (Writing 6.0), TOEFL iBT 69 (Writing 22) or PTE 50; scores within 2 years. SAT or ACT Math accepted for maths.", "Fast track ยกเว้นสอบภาษาอังกฤษของ MUIC เมื่อมี IELTS 6.0 (Writing 6.0), TOEFL iBT 69 (Writing 22) หรือ PTE 50 ภายใน 2 ปี และรับ SAT หรือ ACT Math เป็นคะแนนคณิต"), ["IEL200", "SAT210"], "https://muic.mahidol.ac.th/"),
    P("biz", "intl", L("Chulalongkorn — EBA", "จุฬาฯ — EBA"), L("Economics (international)", "เศรษฐศาสตร์ หลักสูตรนานาชาติ"), L("International admission", "รอบรับสมัครนานาชาติ"),
      ["SAT", "CU-AAT", "English"], L("Strong maths required; past cycles listed SAT Math around 650 and Reading & Writing around 450 — we confirm the 2027 figures.", "ต้องการคณิตศาสตร์ที่แข็งแรง รอบก่อน ๆ กำหนด SAT Math ประมาณ 650 และ Reading & Writing ประมาณ 450 เราช่วยยืนยันเกณฑ์ปี 2570"), ["SAT210", "SAT220", "AAT210", "IEL200"], "https://www.chula.ac.th/en/academics/admissions/undergraduate-admissions/"),
    // ---------- integrated innovation
    P("inno", "intl", L("Chulalongkorn — School of Integrated Innovation (BAScii)", "จุฬาฯ — สถาบันนวัตกรรมบูรณาการ (BAScii)"), L("Integrated innovation (international)", "นวัตกรรมบูรณาการ (นานาชาติ)"), L("International admission", "รอบรับสมัครนานาชาติ"),
      ["English", "Maths test", "Portfolio"], L("Both an English test (e.g. IELTS ≥ 6.5) and a maths test are required (2026 announcement), with portfolio and interview. A strong innovation project helps most.", "ต้องมีทั้งผลสอบภาษาอังกฤษ (เช่น IELTS ≥ 6.5) และผลสอบคณิตศาสตร์ (ประกาศปี 2569) พร้อมพอร์ตและสัมภาษณ์ โครงงานนวัตกรรมที่แข็งแรงช่วยได้มากที่สุด"), ["IEL200", "SAT210", "INN120", "INNO", "PFL200"], "https://csii.chula.ac.th/"),
    // ---------- abroad
    P("abroad", "abroad", L("United States", "สหรัฐอเมริกา"), L("All majors", "ทุกสาขา"), L("Common App / university applications", "Common App / ใบสมัครของมหาวิทยาลัย"),
      ["SAT/ACT", "TOEFL/IELTS/DET"], L("Many selective universities require the SAT or ACT again (e.g. Harvard, Yale, Dartmouth, Brown, Cornell, Penn, MIT); international students also need an English test; essays and activities weigh heavily.", "มหาวิทยาลัยชั้นนำหลายแห่งกลับมากำหนด SAT หรือ ACT (เช่น Harvard, Yale, Dartmouth, Brown, Cornell, Penn, MIT) นักเรียนต่างชาติต้องมีผลสอบภาษาอังกฤษ และเรียงความกับกิจกรรมมีน้ำหนักมาก"), ["SAT210", "SAT220", "IEL200", "PFL200"], "https://satsuite.collegeboard.org/sat"),
    P("abroad", "abroad", L("United Kingdom", "สหราชอาณาจักร"), L("Medicine, engineering, sciences, maths, economics", "แพทย์ วิศวกรรม วิทยาศาสตร์ คณิตศาสตร์ เศรษฐศาสตร์"), L("UCAS", "UCAS"),
      ["A-levels/IB", "IELTS", "UCAT", "TMUA", "ESAT"], L("A-levels, IB or a foundation year; IELTS about 6.5–7.5; UCAT for medicine; TMUA and ESAT for maths, economics, computer science, engineering and sciences at Cambridge, Imperial and Oxford.", "A-levels, IB หรือ Foundation Year · IELTS ประมาณ 6.5–7.5 · UCAT สำหรับแพทย์ · TMUA และ ESAT สำหรับคณิต เศรษฐศาสตร์ คอมพิวเตอร์ วิศวกรรม และวิทยาศาสตร์ที่ Cambridge, Imperial และ Oxford"), ["IEL200", "UCT300", "UKT320", "PFL200"], "https://www.ucas.com"),
    P("abroad", "abroad", L("Australia", "ออสเตรเลีย"), L("All majors; medicine", "ทุกสาขา และแพทย์"), L("Direct university applications", "สมัครตรงกับมหาวิทยาลัย"),
      ["IELTS 6.5", "UCAT ANZ"], L("Melbourne and Sydney undergraduate: IELTS 6.5 with no band below 6.0; school results (e.g. IB, A-levels) or a foundation year; UCAT ANZ for many undergraduate medicine programmes.", "Melbourne และ Sydney ระดับปริญญาตรี: IELTS 6.5 และไม่มีทักษะใดต่ำกว่า 6.0 ใช้ผลการเรียน (เช่น IB, A-levels) หรือ Foundation Year และ UCAT ANZ สำหรับแพทย์ระดับปริญญาตรีหลายแห่ง"), ["IEL200", "UCT300"], "https://ielts.org"),
    P("abroad", "abroad", L("Singapore", "สิงคโปร์"), L("NUS, NTU, SMU", "NUS, NTU, SMU"), L("Direct university applications", "สมัครตรงกับมหาวิทยาลัย"),
      ["SAT/ACT", "A-levels/IB"], L("With an international or US-style diploma, SAT/ACT is expected (NTU lists SAT 1250 / ACT 30 minimums; admitted NUS students usually score far higher). A-level or IB holders generally do not need the SAT.", "ผู้ใช้วุฒินานาชาติหรือแบบอเมริกันต้องมี SAT/ACT (NTU ระบุขั้นต่ำ SAT 1250 / ACT 30 ส่วนผู้ที่ได้รับคัดเลือกเข้า NUS มักได้สูงกว่านี้มาก) ผู้ใช้ A-levels หรือ IB โดยทั่วไปไม่ต้องใช้ SAT"), ["SAT210", "SAT220", "MTH230"], "https://www.ntu.edu.sg/admissions")
  ];

  /* ------------------------------------------------------------ one path: how STEM & AI and test prep fit together */
  D.journey = [
    { icon: "book", name: L("Core academics", "วิชาแกน"), text: L("Intensive Maths, Physics and English from M.1 — the base for everything else.", "คณิต ฟิสิกส์ และอังกฤษแบบเข้มข้นตั้งแต่ ม.1 ฐานของทุกอย่าง"), href: "pages/programs.html?group=core#catalog", cta: L("Core courses", "คอร์สวิชาแกน") },
    { icon: "spark", name: L("STEM & AI", "STEM และ AI"), text: L("Coding, AI, electronics and real projects that show what you can build.", "เขียนโปรแกรม AI อิเล็กทรอนิกส์ และโครงงานจริงที่แสดงว่าคุณสร้างอะไรได้"), href: "pages/programs.html#catalog", cta: L("STEM & AI courses", "คอร์ส STEM และ AI") },
    { icon: "trophy", name: L("Tests & competitions", "การสอบและการแข่งขัน"), text: L("The right tests for your target: TCAS, international programmes or abroad.", "ข้อสอบที่ตรงกับเป้าหมาย ทั้ง TCAS หลักสูตรนานาชาติ หรือต่างประเทศ"), href: "pages/admissions.html#tests", cta: L("Test prep", "เตรียมสอบ") },
    { icon: "school", name: L("University", "มหาวิทยาลัย"), text: L("Portfolio, interview and a clear plan for the programmes you choose.", "พอร์ตโฟลิโอ การสัมภาษณ์ และแผนที่ชัดเจนสำหรับหลักสูตรที่เลือก"), href: "pages/admissions.html#finder", cta: L("Find your programme", "ค้นหาหลักสูตรของคุณ") }
  ];

  // give the new courses their group (catalogue.js ran before this file)
  D.courses.forEach(function (c) { var g = D.groupOf(c.track); c.group = g ? g.id : c.group; });
})();
