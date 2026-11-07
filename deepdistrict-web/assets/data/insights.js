/* ==========================================================================
   DeepDistrict.si — explainer content (loads after content.js)
   SI in plain words, research by field, future skills, exam method and
   exam/olympiad information. All wording is our own.
   ========================================================================== */
(function () {
  var D = window.DD_CONTENT;
  function L(en, th) { return { en: en, th: th }; }

  /* ------------------------------------------------------------ SI in three sentences */
  D.siSimple = [
    { icon: "spark", tag: L("AI today", "AI วันนี้"),
      title: L("A brilliant specialist", "ผู้เชี่ยวชาญที่เก่งเฉพาะทาง"),
      text: L("Writes, translates and recognises images well — but only within what it was trained for, and it still needs people to check it.",
              "เขียน แปล และจดจำภาพได้ดี แต่เก่งเฉพาะสิ่งที่ถูกฝึกมา และยังต้องมีคนคอยตรวจสอบ") },
    { icon: "network", tag: L("The next step", "ขั้นต่อไป"),
      title: L("A capable all-rounder", "ผู้รอบรู้ที่ทำได้หลายด้าน"),
      text: L("Plans, reasons and learns new tasks across many fields, close to a skilled person. Researchers call this AGI.",
              "วางแผน ใช้เหตุผล และเรียนรู้งานใหม่ได้หลากหลายสาขา ใกล้เคียงคนที่มีทักษะสูง นักวิจัยเรียกว่า AGI") },
    { icon: "core", tag: L("Super Intelligence", "Super Intelligence"),
      title: L("Beyond the best human minds", "เหนือกว่าสมองที่เก่งที่สุดของมนุษย์"),
      text: L("Would out-think the world's best experts in science, engineering and strategy — and help us solve problems no one has cracked.",
              "จะคิดได้เหนือกว่าผู้เชี่ยวชาญที่เก่งที่สุดในด้านวิทยาศาสตร์ วิศวกรรม และกลยุทธ์ และช่วยแก้ปัญหาที่ยังไม่มีใครแก้ได้") }
  ];

  /* ------------------------------------------------------------ "Isn't today's AI enough?" */
  D.siEnough = {
    yes: L("For many everyday tasks, yes. Today's AI already saves time in writing, coding and search — and we teach it.",
           "สำหรับงานทั่วไปหลายอย่าง ใช่ AI วันนี้ช่วยประหยัดเวลาในการเขียน เขียนโค้ด และค้นหาข้อมูลได้แล้ว และเราก็สอนเรื่องนี้"),
    but: L("But it still falls short where it matters most:", "แต่ยังไปไม่ถึงในเรื่องที่สำคัญที่สุด:"),
    gaps: [
      L("It can be confidently wrong.", "ตอบผิดได้อย่างมั่นใจ"),
      L("It struggles with long, multi-step work.", "ยังทำงานยาวหลายขั้นตอนได้ไม่ดี"),
      L("It cannot run real experiments or truly verify itself.", "ยังทดลองจริงหรือตรวจสอบตัวเองได้ไม่เต็มที่"),
      L("It rarely discovers something genuinely new.", "ยังค้นพบสิ่งใหม่จริง ๆ ได้น้อย")
    ],
    so: L("New medicines, clean energy, climate, education for everyone — these need systems that reason, check and discover. That road leads to SI, and the people who understand it will steer it.",
          "ยารักษาโรคใหม่ พลังงานสะอาด ภูมิอากาศ การศึกษาที่ทั่วถึง ต้องการระบบที่ใช้เหตุผล ตรวจสอบ และค้นพบได้ เส้นทางนี้นำไปสู่ SI และผู้ที่เข้าใจมันจะเป็นผู้กำหนดทิศทาง")
  };

  /* ------------------------------------------------------------ Why start now */
  D.whyStart = [
    { icon: "book", title: L("Foundations take time", "รากฐานต้องใช้เวลา"),
      text: L("Maths, code and the scientific method take years. Starting early is the real advantage.", "คณิตศาสตร์ การเขียนโค้ด และกระบวนการทางวิทยาศาสตร์ต้องใช้เวลาหลายปี การเริ่มเร็วคือความได้เปรียบที่แท้จริง") },
    { icon: "shield", title: L("Builders shape the rules", "ผู้สร้างคือผู้กำหนดกติกา"),
      text: L("People who understand AI deeply can make it safe, fair and useful — not just use it.", "ผู้ที่เข้าใจ AI อย่างลึกซึ้งจะทำให้มันปลอดภัย เป็นธรรม และมีประโยชน์ ไม่ใช่แค่เป็นผู้ใช้") },
    { icon: "pin", title: L("Thailand needs creators", "ประเทศไทยต้องการผู้สร้าง"),
      text: L("Thai language, health, farming and cities need local builders, not only imported tools.", "ภาษาไทย สุขภาพ การเกษตร และเมือง ต้องการผู้สร้างในประเทศ ไม่ใช่แค่เครื่องมือนำเข้า") },
    { icon: "rocket", title: L("It pays off either way", "คุ้มค่าไม่ว่าทางใด"),
      text: L("Problem solving, research and engineering skills are valuable whenever SI arrives.", "ทักษะการแก้ปัญหา การวิจัย และวิศวกรรม มีคุณค่าเสมอ ไม่ว่า SI จะมาถึงเมื่อไร") }
  ];

  /* ------------------------------------------------------------ Why STEM + SI research & innovation matters */
  D.researchWhy = [
    { icon: "spark", title: L("From user to creator", "จากผู้ใช้สู่ผู้สร้าง"),
      text: L("Research turns curiosity into something new that others can use and build on.", "งานวิจัยเปลี่ยนความอยากรู้ให้เป็นสิ่งใหม่ที่ผู้อื่นใช้และต่อยอดได้") },
    { icon: "leaf", title: L("Real problems, real impact", "ปัญหาจริง ผลกระทบจริง"),
      text: L("PM2.5, floods, crop disease, healthcare access and Thai-language AI are waiting for answers.", "PM2.5 น้ำท่วม โรคพืช การเข้าถึงการรักษา และ AI ภาษาไทย ยังรอคำตอบอยู่") },
    { icon: "trophy", title: L("Evidence that opens doors", "หลักฐานที่เปิดประตู"),
      text: L("A paper, award or prototype speaks louder than grades in TCAS portfolios, scholarships and jobs.", "บทความ รางวัล หรือต้นแบบ มีน้ำหนักมากกว่าเกรดในพอร์ตโฟลิโอ TCAS ทุนการศึกษา และการสมัครงาน") },
    { icon: "core", title: L("SI itself is a research problem", "SI คือโจทย์วิจัย"),
      text: L("Reasoning, safety and discovery will be solved by researchers — some of them could be our learners.", "การใช้เหตุผล ความปลอดภัย และการค้นพบ จะถูกแก้โดยนักวิจัย และบางคนอาจเป็นผู้เรียนของเรา") }
  ];

  /* ------------------------------------------------------------ STEM + SI research projects by field */
  var P = L("Publish", "ตีพิมพ์"), PR = L("Present", "นำเสนอ"), C = L("Compete", "แข่งขัน");
  D.researchFields = [
    { icon: "health", field: L("Medicine & health", "การแพทย์และสุขภาพ"),
      project: L("Explainable AI that screens eye or skin images for early warning signs", "AI ที่อธิบายได้ สำหรับคัดกรองภาพดวงตาหรือผิวหนังเพื่อหาสัญญาณเตือนตั้งแต่ระยะแรก"),
      outputs: [P, PR, C], codes: ["CV320", "SI430"] },
    { icon: "dna", field: L("Bioengineering", "วิศวกรรมชีวการแพทย์"),
      project: L("A low-cost wearable that tracks heart signals with on-device machine learning", "อุปกรณ์สวมใส่ราคาประหยัดที่ติดตามสัญญาณหัวใจด้วย Machine Learning บนอุปกรณ์"),
      outputs: [P, C], codes: ["ARQ230", "ML220"] },
    { icon: "leaf", field: L("Agriculture & environment", "เกษตรและสิ่งแวดล้อม"),
      project: L("Edge-AI cameras that spot crop disease, or models that forecast PM2.5 in Bangkok", "กล้อง Edge AI ตรวจโรคพืช หรือโมเดลพยากรณ์ PM2.5 ในกรุงเทพฯ"),
      outputs: [PR, C], codes: ["EDG220", "DS210"] },
    { icon: "robot", field: L("Engineering & robotics", "วิศวกรรมและหุ่นยนต์"),
      project: L("An assistive robot arm with vision, trained in simulation, running on Jetson Orin Nano", "แขนกลช่วยเหลือที่มองเห็นได้ ฝึกในโลกจำลอง และทำงานบน Jetson Orin Nano"),
      outputs: [PR, C], codes: ["NV340", "EDG320"] },
    { icon: "server", field: L("Computer science & AI", "วิทยาการคอมพิวเตอร์และ AI"),
      project: L("A benchmark that tests how well AI models reason in Thai", "ชุดทดสอบที่วัดว่าโมเดล AI ใช้เหตุผลในภาษาไทยได้ดีแค่ไหน"),
      outputs: [P, PR], codes: ["NLP330", "SI420"] },
    { icon: "briefcase", field: L("Business & society", "ธุรกิจและสังคม"),
      project: L("Demand forecasting for Thai small businesses, tested with real shop data", "การพยากรณ์ความต้องการสินค้าสำหรับธุรกิจขนาดเล็กไทย ทดสอบกับข้อมูลร้านค้าจริง"),
      outputs: [P, C], codes: ["DS210", "NV210"] },
    { icon: "book", field: L("Education", "การศึกษา"),
      project: L("An AI tutor that adapts to each student, measured in a classroom study", "ติวเตอร์ AI ที่ปรับตามผู้เรียนแต่ละคน วัดผลด้วยการศึกษาในห้องเรียน"),
      outputs: [P, PR], codes: ["WEB340", "RES210"] },
    { icon: "device", field: L("Apps & accessibility", "แอปและการเข้าถึง"),
      project: L("An iPad app that helps people with low vision read signs, built for the Swift Student Challenge", "แอป iPad ช่วยผู้มีสายตาเลือนรางอ่านป้าย สร้างเพื่อส่ง Swift Student Challenge"),
      outputs: [PR, C], codes: ["SSC250", "IOS340"] }
  ];

  /* ------------------------------------------------------------ Six future skills (our own framing) */
  D.futureSkills = [
    { icon: "search", name: L("Problem solving", "การแก้ปัญหา"),
      text: L("Break a messy situation into pieces you can actually solve.", "แยกสถานการณ์ที่ยุ่งเหยิงออกเป็นส่วนย่อยที่แก้ได้จริง"),
      how: L("Every lesson starts from a real problem, not a recipe.", "ทุกบทเรียนเริ่มจากโจทย์จริง ไม่ใช่สูตรสำเร็จ") },
    { icon: "network", name: L("Logical thinking", "การคิดเชิงตรรกะ"),
      text: L("Link cause and effect, and check that every step holds.", "เชื่อมเหตุและผล และตรวจว่าทุกขั้นตอนสมเหตุสมผล"),
      how: L("We trace code line by line and justify each decision.", "เราไล่โค้ดทีละบรรทัดและให้เหตุผลทุกการตัดสินใจ") },
    { icon: "monitor", name: L("Digital & AI literacy", "ความรู้เท่าทันดิจิทัลและ AI"),
      text: L("Use technology well — and know when to question it.", "ใช้เทคโนโลยีได้ดี และรู้ว่าเมื่อไหร่ควรตั้งคำถาม"),
      how: L("Learners check AI output instead of copying it.", "ผู้เรียนตรวจผลลัพธ์จาก AI แทนการคัดลอก") },
    { icon: "present", name: L("Communication", "การสื่อสาร"),
      text: L("Explain ideas so people from any background understand.", "อธิบายความคิดให้คนทุกพื้นฐานเข้าใจ"),
      how: L("Every project ends with a demo, poster or talk.", "ทุกโปรเจกต์จบด้วยการสาธิต โปสเตอร์ หรือการบรรยาย") },
    { icon: "academy", name: L("Lifelong learning", "การเรียนรู้ตลอดชีวิต"),
      text: L("Teach yourself new things as tools keep changing.", "สอนตัวเองเรื่องใหม่ได้ แม้เครื่องมือจะเปลี่ยนตลอดเวลา"),
      how: L("We coach how to learn, not only what to learn.", "เราฝึกวิธีเรียนรู้ ไม่ใช่แค่เนื้อหาที่ต้องเรียน") },
    { icon: "hybrid", name: L("Adaptability", "การปรับตัว"),
      text: L("Change the plan calmly when the situation shifts.", "ปรับแผนได้อย่างใจเย็นเมื่อสถานการณ์เปลี่ยน"),
      how: L("Research projects rarely go to plan — that is the lesson.", "งานวิจัยแทบไม่เคยเป็นไปตามแผน และนั่นคือบทเรียน") }
  ];
  D.futureSkillsNote = L("Code is the training ground. The real result is a mind that thinks clearly, learns fast and adapts.",
                         "การเขียนโค้ดคือสนามฝึก ผลลัพธ์ที่แท้จริงคือความคิดที่ชัดเจน เรียนรู้เร็ว และปรับตัวได้");

  /* ------------------------------------------------------------ Exam method: Plan · Edge · Trace · Test */
  D.examTips = [
    { key: "Plan", title: L("Plan before you type", "วางแผนก่อนพิมพ์"),
      text: L("Sketch input → steps → output as a quick outline or pseudocode. Two minutes of planning saves twenty of rewriting.",
              "ร่าง Input → ขั้นตอน → Output เป็นโครงสั้น ๆ หรือรหัสเทียม วางแผนสองนาที ประหยัดเวลาแก้ได้ยี่สิบนาที") },
    { key: "Edge", title: L("Hunt the edge cases", "ล่า Edge Case"),
      text: L("Ask “what input would break this?” Try zero, negatives, empty input, huge values and repeats.",
              "ถามตัวเองว่า “ข้อมูลแบบไหนจะทำให้พัง” ลองศูนย์ ค่าติดลบ ข้อมูลว่าง ค่าใหญ่มาก และค่าซ้ำ") },
    { key: "Trace", title: L("Trace, don't trust", "ไล่โค้ด อย่าเพิ่งเชื่อ"),
      text: L("A right idea can still be coded wrong. Walk through conditions, statement order, loop limits and variable updates — reading, computing, deciding and printing one at a time.",
              "ความคิดถูกแต่โค้ดอาจผิด ไล่เงื่อนไข ลำดับคำสั่ง ขอบเขตลูป และการอัปเดตตัวแปร แยกตรวจทีละส่วน ทั้งการรับข้อมูล การคำนวณ การตัดสินใจ และการแสดงผล") },
    { key: "Test", title: L("Test like the grader", "ทดสอบแบบผู้ตรวจ"),
      text: L("Before submitting, run 3–5 cases of your own: a typical one, the smallest, the largest and one odd case.",
              "ก่อนส่ง ลองรันกรณีทดสอบของตัวเอง 3–5 แบบ ได้แก่ กรณีทั่วไป ค่าน้อยสุด ค่ามากสุด และกรณีแปลก ๆ หนึ่งแบบ") }
  ];
  D.examTipsNote = L("Top scorers aren't the fastest typists — they are the most methodical.",
                     "คนที่ได้คะแนนสูงไม่ใช่คนที่พิมพ์เร็วที่สุด แต่คือคนที่ทำงานเป็นระบบที่สุด");

  /* ------------------------------------------------------------ Exams & olympiads */
  D.exams = [
    { name: "COMPAS-PY1", lang: "Python", code: "EXM210",
      by: L("Dept. of Computer Engineering, Faculty of Engineering, Chulalongkorn University", "ภาควิชาวิศวกรรมคอมพิวเตอร์ คณะวิศวกรรมศาสตร์ จุฬาลงกรณ์มหาวิทยาลัย"),
      award: "AWARD of EXCELLENCE" },
    { name: "COMPAS-CPP1", lang: "C++", code: "EXM220",
      by: L("Dept. of Computer Engineering, Faculty of Engineering, Chulalongkorn University", "ภาควิชาวิศวกรรมคอมพิวเตอร์ คณะวิศวกรรมศาสตร์ จุฬาลงกรณ์มหาวิทยาลัย"),
      award: "AWARD of EXCELLENCE" },
    { name: "HKICO · Python", lang: "Python", code: "EXM110",
      by: L("Hong Kong International Computational Olympiad", "Hong Kong International Computational Olympiad"),
      award: L("Heat & final rounds", "รอบคัดเลือกและรอบชิงชนะเลิศ") }
  ];
  D.tcas = {
    title: L("TCAS70 Round 1 (Portfolio), academic year 2570", "TCAS70 รอบที่ 1 (Portfolio) ปีการศึกษา 2570"),
    lead: L("A COMPAS AWARD of EXCELLENCE is listed as a qualification in two Chulalongkorn Engineering programmes:",
            "รางวัล AWARD of EXCELLENCE จากการสอบ COMPAS ระบุเป็นคุณสมบัติในสองโครงการของคณะวิศวกรรมศาสตร์ จุฬาฯ:"),
    items: [
      { prog: L("Computer Engineering and Digital Technology (CEDT, Sandbox)", "วิศวกรรมคอมพิวเตอร์และเทคโนโลยีดิจิทัล (CEDT, Sandbox)"),
        ref: L("Announcement item 1.4.4.16 — AWARD of EXCELLENCE from the COMPAS exam", "ประกาศข้อ 1.4.4.16 — รางวัล AWARD of EXCELLENCE จากการสอบ COMPAS") },
      { prog: L("Computer Engineering — Academic Olympiad project", "วิศวกรรมคอมพิวเตอร์ — โครงการโอลิมปิกวิชาการ"),
        ref: L("Announcement item 1.4.3 — awards from specialised tests run by the Department of Computer Engineering", "ประกาศข้อ 1.4.3 — ผู้ได้รับรางวัลจากการทดสอบเฉพาะด้านที่ดำเนินการโดยภาควิชาวิศวกรรมคอมพิวเตอร์") }
    ],
    note: L("Always confirm the criteria in the official Chulalongkorn University announcement before applying. DeepDistrict prepares learners independently, is not affiliated with Chulalongkorn University or HKICO, and cannot guarantee awards or admission.",
            "โปรดตรวจสอบเกณฑ์จากประกาศอย่างเป็นทางการของจุฬาลงกรณ์มหาวิทยาลัยก่อนสมัครทุกครั้ง DeepDistrict เตรียมความพร้อมอย่างอิสระ ไม่มีส่วนเกี่ยวข้องกับจุฬาลงกรณ์มหาวิทยาลัยหรือ HKICO และไม่สามารถรับประกันรางวัลหรือการรับเข้าศึกษาได้")
  };
})();
