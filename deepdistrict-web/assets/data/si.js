/* ==========================================================================
   DeepDistrict.si — SI explainer, personalisation and plan builder data
   (loads after content.js and courses-details.js)
   ========================================================================== */

(function () {
  var D = window.DD_CONTENT;
  function L(en, th) { return { en: en, th: th }; }

  /* ------------------------------------------------------------ AI vs SI, capability by capability */
  D.siCompare = [
    { icon: "book", name: L("Learning", "การเรียนรู้"),
      ai: L("Learns from a fixed dataset, then mostly stops learning.", "เรียนรู้จากชุดข้อมูลที่กำหนด แล้วส่วนใหญ่หยุดเรียนรู้"),
      si: L("Keeps learning from experience and transfers knowledge across fields.", "เรียนรู้จากประสบการณ์อย่างต่อเนื่อง และถ่ายทอดความรู้ข้ามสาขาได้") },
    { icon: "spark", name: L("Reasoning", "การให้เหตุผล"),
      ai: L("Can reason, but still makes confident mistakes.", "ให้เหตุผลได้ แต่ยังผิดพลาดอย่างมั่นใจ"),
      si: L("Long, reliable reasoning that checks its own work.", "ให้เหตุผลยาวหลายขั้น เชื่อถือได้ และตรวจสอบงานของตนเอง") },
    { icon: "microscope", name: L("Discovery", "การค้นพบ"),
      ai: L("Recombines existing knowledge.", "ผสมผสานความรู้ที่มีอยู่แล้ว"),
      si: L("Proposes and tests genuinely new ideas with scientists.", "เสนอและทดสอบแนวคิดใหม่อย่างแท้จริงร่วมกับนักวิทยาศาสตร์") },
    { icon: "globe", name: L("Generality", "ความรอบด้าน"),
      ai: L("Strong in specific tasks, weak outside them.", "เก่งในงานเฉพาะ แต่อ่อนนอกขอบเขตนั้น"),
      si: L("Excels across virtually every domain.", "โดดเด่นในแทบทุกสาขา") },
    { icon: "robot", name: L("Agency", "การลงมือทำ"),
      ai: L("Follows instructions one step at a time.", "ทำตามคำสั่งทีละขั้น"),
      si: L("Pursues long-term goals set by people, under human oversight.", "ทำงานตามเป้าหมายระยะยาวที่มนุษย์กำหนด ภายใต้การกำกับดูแลของมนุษย์") },
    { icon: "network", name: L("Understanding the world", "ความเข้าใจโลก"),
      ai: L("Patterns in text, images and numbers.", "รูปแบบในข้อความ ภาพ และตัวเลข"),
      si: L("Rich models of how the world actually works.", "แบบจำลองเชิงลึกว่าโลกทำงานอย่างไรจริง ๆ") },
    { icon: "shield", name: L("Trust", "ความไว้วางใจ"),
      ai: L("Often a black box that is hard to explain.", "มักเป็นกล่องดำที่อธิบายได้ยาก"),
      si: L("Transparent, verifiable and aligned with human values.", "โปร่งใส ตรวจสอบได้ และสอดคล้องกับคุณค่าของมนุษย์") }
  ];

  /* ------------------------------------------------------------ The ladder from AI to SI */
  D.siLadder = [
    { name: L("Narrow AI", "AI เฉพาะทาง"), when: L("Today", "ปัจจุบัน"),
      text: L("Excellent at one task, such as recognising faces or recommending products.", "เก่งงานเดียว เช่น จดจำใบหน้าหรือแนะนำสินค้า") },
    { name: L("Generative AI", "Generative AI"), when: L("Today", "ปัจจุบัน"),
      text: L("Writes, draws and codes from patterns learned in huge datasets.", "เขียน วาด และเขียนโค้ด จากรูปแบบที่เรียนรู้จากข้อมูลมหาศาล") },
    { name: L("Agentic AI", "Agentic AI"), when: L("Emerging", "กำลังเกิดขึ้น"),
      text: L("Plans, uses tools and completes multi-step tasks with people.", "วางแผน ใช้เครื่องมือ และทำงานหลายขั้นตอนร่วมกับมนุษย์") },
    { name: L("General AI (AGI)", "AI ทั่วไป (AGI)"), when: L("Research goal", "เป้าหมายงานวิจัย"),
      text: L("Human-level ability across most kinds of thinking work.", "ความสามารถระดับมนุษย์ในงานที่ใช้ความคิดเกือบทุกประเภท") },
    { name: L("SI · Super Intelligence", "SI · Super Intelligence"), when: L("Long-term horizon", "เป้าหมายระยะยาว"),
      text: L("Beyond the best human minds in virtually every domain, built safely and for people.", "เหนือกว่าความสามารถของมนุษย์ที่เก่งที่สุดในแทบทุกด้าน โดยพัฒนาอย่างปลอดภัยและเพื่อมนุษย์") }
  ];

  /* ------------------------------------------------------------ Building blocks of SI, mapped to courses */
  D.siBlocks = [
    { icon: "spark", name: L("Reasoning & planning", "การให้เหตุผลและการวางแผน"),
      text: L("Thinking in many reliable steps, searching options and checking answers.", "คิดหลายขั้นอย่างน่าเชื่อถือ ค้นหาทางเลือก และตรวจสอบคำตอบ"), courses: ["SI410", "DSA210"] },
    { icon: "network", name: L("World models & multimodality", "แบบจำลองโลกและข้อมูลหลายรูปแบบ"),
      text: L("Combining text, images, sound and sensor data into one understanding.", "รวมข้อความ ภาพ เสียง และข้อมูลเซนเซอร์ให้เป็นความเข้าใจเดียว"), courses: ["SI430", "CV320"] },
    { icon: "book", name: L("Continual & efficient learning", "การเรียนรู้ต่อเนื่องและมีประสิทธิภาพ"),
      text: L("Learning more from less data and energy, even on small devices.", "เรียนรู้ได้มากขึ้นจากข้อมูลและพลังงานที่น้อยลง แม้บนอุปกรณ์ขนาดเล็ก"), courses: ["DL310", "EDG310"] },
    { icon: "robot", name: L("Tools & agents", "เครื่องมือและ Agent"),
      text: L("Using software, data and the physical world to get real work done.", "ใช้ซอฟต์แวร์ ข้อมูล และโลกกายภาพ เพื่อทำงานให้สำเร็จจริง"), courses: ["SI410", "ROB330"] },
    { icon: "microscope", name: L("Scientific discovery", "การค้นพบทางวิทยาศาสตร์"),
      text: L("Forming hypotheses, designing experiments and learning from results.", "ตั้งสมมติฐาน ออกแบบการทดลอง และเรียนรู้จากผลลัพธ์"), courses: ["SI430", "RES450"] },
    { icon: "shield", name: L("Alignment & safety", "Alignment และความปลอดภัย"),
      text: L("Making sure more capable systems stay honest, safe and under human control.", "ทำให้ระบบที่เก่งขึ้นยังคงซื่อตรง ปลอดภัย และอยู่ภายใต้การควบคุมของมนุษย์"), courses: ["SI420", "MLO350"] }
  ];

  D.siMyths = [
    { myth: L("“SI already exists.”", "“SI มีอยู่แล้วในปัจจุบัน”"),
      fact: L("No system today meets the definition. Current AI is impressive, but it still has important limits. SI is a research horizon, not a product anyone can sell you.", "ยังไม่มีระบบใดในปัจจุบันที่เป็น SI ตามนิยาม AI วันนี้น่าทึ่ง แต่ยังมีข้อจำกัดสำคัญ SI จึงเป็นเป้าหมายงานวิจัย ไม่ใช่สินค้าที่ใครจะขายให้คุณได้") },
    { myth: L("“SI means machines replacing people.”", "“SI คือเครื่องจักรที่จะมาแทนที่มนุษย์”"),
      fact: L("Our aim is SI that amplifies people: it works under human oversight, for public benefit.", "เป้าหมายของเราคือ SI ที่ช่วยเสริมศักยภาพมนุษย์ ทำงานภายใต้การกำกับดูแลของมนุษย์ และเพื่อประโยชน์ส่วนรวม") },
    { myth: L("“Only big tech companies can work on SI.”", "“มีแต่บริษัทเทคโนโลยียักษ์ใหญ่ที่ทำงานด้าน SI ได้”"),
      fact: L("Evaluation, safety, applications, education and AI for smaller languages like Thai all need many contributors, including students.", "การประเมิน ความปลอดภัย การประยุกต์ใช้ การศึกษา และ AI สำหรับภาษาที่มีผู้ใช้น้อยกว่าอย่างภาษาไทย ล้วนต้องการผู้มีส่วนร่วมจำนวนมาก รวมถึงนักเรียนนักศึกษา") },
    { myth: L("“You need a PhD to start.”", "“ต้องจบปริญญาเอกก่อนจึงจะเริ่มได้”"),
      fact: L("Every SI researcher started with a first program and a first experiment. Our path starts at age 10.", "นักวิจัย SI ทุกคนเริ่มจากโปรแกรมแรกและการทดลองแรก เส้นทางของเราเริ่มได้ตั้งแต่อายุ 10 ปี") }
  ];

  D.siFaq = [
    { q: L("Is SI the same as AGI?", "SI เหมือนกับ AGI หรือไม่?"),
      a: L("Not quite. AGI usually means AI with roughly human-level ability across many kinds of tasks. SI, or superintelligence, goes further: beyond the best humans in virtually every domain. We treat both as long-term research goals.", "ไม่เหมือนกันเสียทีเดียว AGI มักหมายถึง AI ที่มีความสามารถใกล้เคียงมนุษย์ในงานหลากหลายประเภท ส่วน SI หรือ Superintelligence ไปไกลกว่านั้น คือเหนือกว่ามนุษย์ที่เก่งที่สุดในแทบทุกด้าน เรามองทั้งสองอย่างเป็นเป้าหมายงานวิจัยระยะยาว") },
    { q: L("When will SI arrive?", "SI จะเกิดขึ้นเมื่อไร?"),
      a: L("Nobody knows, and expert estimates vary widely. We focus on the knowledge, skills and safety practices people will need, whenever it comes.", "ไม่มีใครรู้ และการคาดการณ์ของผู้เชี่ยวชาญแตกต่างกันมาก เราจึงมุ่งสร้างความรู้ ทักษะ และแนวปฏิบัติด้านความปลอดภัยที่ผู้คนจะต้องใช้ ไม่ว่า SI จะมาถึงเมื่อใด") },
    { q: L("Why does DeepDistrict focus on SI?", "ทำไม DeepDistrict จึงมุ่งเน้น SI?"),
      a: L("Because the people who will shape SI need strong foundations, research skills and ethics today. We want our learners, and Thailand, to help create this future, not only consume it.", "เพราะผู้ที่จะกำหนดทิศทางของ SI ต้องมีรากฐานที่แข็งแรง ทักษะการวิจัย และจริยธรรมตั้งแต่วันนี้ เราต้องการให้ผู้เรียนของเราและประเทศไทยร่วมสร้างอนาคตนี้ ไม่ใช่เป็นเพียงผู้ใช้") },
    { q: L("Is SI dangerous?", "SI อันตรายหรือไม่?"),
      a: L("Powerful technology has to be made safe on purpose. Safety, alignment, privacy and human oversight are part of every advanced course and every research project we run.", "เทคโนโลยีที่ทรงพลังต้องได้รับการออกแบบให้ปลอดภัยอย่างตั้งใจ ความปลอดภัย Alignment ความเป็นส่วนตัว และการกำกับดูแลโดยมนุษย์ เป็นส่วนหนึ่งของทุกหลักสูตรขั้นสูงและทุกโครงการวิจัยของเรา") },
    { q: L("How can my child or I start learning about SI?", "บุตรหลานหรือตัวฉันจะเริ่มเรียนรู้เรื่อง SI ได้อย่างไร?"),
      a: L("Start with AI100 (AI literacy) and PY101 (Python). Then follow the path through machine learning and deep learning to the SI courses, with a personal plan built around your goals.", "เริ่มจาก AI100 (ความรู้เท่าทัน AI) และ PY101 (Python) แล้วเดินตามเส้นทางผ่าน Machine Learning และ Deep Learning ไปสู่รายวิชาด้าน SI ด้วยแผนการเรียนเฉพาะบุคคลที่ออกแบบตามเป้าหมายของคุณ") }
  ];

  /* ------------------------------------------------------------ Personalisation */
  D.personalSteps = [
    { icon: "users", name: L("Free consultation", "ปรึกษาฟรี"),
      text: L("We talk about your goals, interests, schedule and preferred way to learn.", "พูดคุยเรื่องเป้าหมาย ความสนใจ ตารางเวลา และรูปแบบการเรียนที่คุณชอบ") },
    { icon: "review", name: L("Skill check", "ประเมินพื้นฐาน"),
      text: L("A short, friendly placement shows where to start. No exam stress.", "ประเมินระดับสั้น ๆ แบบเป็นกันเอง เพื่อหาจุดเริ่มต้นที่เหมาะสม ไม่ต้องกังวลเรื่องสอบ") },
    { icon: "pen", name: L("Your personal plan", "แผนการเรียนของคุณ"),
      text: L("We select modules, pace, mode and a project in your area of interest.", "เราคัดเลือกบทเรียน กำหนดความเร็ว รูปแบบการเรียน และโปรเจกต์ในเรื่องที่คุณสนใจ") },
    { icon: "rocket", name: L("Learn & build", "เรียนและลงมือสร้าง"),
      text: L("One-to-one or small group, live on Zoom, onsite in Bangkok or hybrid.", "แบบตัวต่อตัวหรือกลุ่มเล็ก เรียนสดผ่าน Zoom ที่แล็บในกรุงเทพฯ หรือแบบไฮบริด") },
    { icon: "chart", name: L("Review & adapt", "ทบทวนและปรับแผน"),
      text: L("Regular progress reviews. Your plan grows as you grow.", "ทบทวนความก้าวหน้าสม่ำเสมอ และปรับแผนให้เติบโตไปพร้อมกับคุณ") }
  ];

  D.customOptions = [
    { name: L("Pace & schedule", "ความเร็วและตารางเรียน"), text: L("Weekdays, evenings, weekends or intensive", "วันธรรมดา ช่วงเย็น วันหยุด หรือแบบเข้มข้น") },
    { name: L("Study mode", "รูปแบบการเรียน"), text: L("Live on Zoom, onsite or hybrid", "สดผ่าน Zoom ที่แล็บ หรือไฮบริด") },
    { name: L("Group size", "ขนาดกลุ่ม"), text: L("One-to-one, small group or class", "ตัวต่อตัว กลุ่มเล็ก หรือชั้นเรียน") },
    { name: L("Language", "ภาษา"), text: L("Thai, English or both", "ไทย อังกฤษ หรือทั้งสองภาษา") },
    { name: L("Project topic", "หัวข้อโปรเจกต์"), text: L("Medicine, business, games, environment… you choose", "การแพทย์ ธุรกิจ เกม สิ่งแวดล้อม… คุณเลือกเอง") },
    { name: L("Goal", "เป้าหมาย"), text: L("Skills, school project, competition, paper, portfolio, career", "ทักษะ โครงงาน การแข่งขัน บทความ พอร์ตโฟลิโอ หรืออาชีพ") }
  ];

  /* ------------------------------------------------------------ Plan builder */
  D.planner = {
    who: [
      { id: "child", label: L("Child (8–12)", "เด็ก (8–12 ปี)") },
      { id: "teen", label: L("Teen (13–18)", "วัยรุ่น (13–18 ปี)") },
      { id: "uni", label: L("University student", "นักศึกษามหาวิทยาลัย") },
      { id: "pro", label: L("Professional", "คนทำงาน") },
      { id: "org", label: L("Organisation / team", "องค์กร / ทีมงาน") }
    ],
    interest: [
      { id: "si", label: L("AI & SI", "AI และ SI") },
      { id: "code", label: L("Programming", "การเขียนโปรแกรม") },
      { id: "web", label: L("Web & apps", "เว็บและแอป") },
      { id: "apple", label: L("iPhone & iPad apps", "แอป iPhone และ iPad") },
      { id: "edge", label: L("Robots & edge AI", "หุ่นยนต์และ Edge AI") },
      { id: "medical", label: L("Medical & bio", "การแพทย์และชีวการแพทย์") },
      { id: "business", label: L("Business & data", "ธุรกิจและข้อมูล") },
      { id: "innovation", label: L("Research & innovation", "วิจัยและนวัตกรรม") },
      { id: "aieng", label: L("Coding with AI agents", "เขียนโค้ดร่วมกับ AI Agent") },
      { id: "exam", label: L("COMPAS / HKICO exams", "สอบ COMPAS / HKICO") }
    ],
    level: [
      { id: "new", label: L("New to it", "เพิ่งเริ่มต้น") },
      { id: "some", label: L("Some experience", "มีพื้นฐานบ้าง") },
      { id: "adv", label: L("Advanced", "ขั้นสูง") }
    ],
    goal: [
      { id: "skills", label: L("Build skills", "สร้างทักษะ") },
      { id: "compete", label: L("Project / competition", "โครงงาน / การแข่งขัน") },
      { id: "publish", label: L("Publish research", "ตีพิมพ์งานวิจัย") },
      { id: "portfolio", label: L("Portfolio / university", "พอร์ตโฟลิโอ / ศึกษาต่อ") },
      { id: "career", label: L("Career / upskilling", "อาชีพ / ยกระดับทักษะ") }
    ],
    mode: [
      { id: "online", label: L("Live on Zoom", "สดผ่าน Zoom") },
      { id: "onsite", label: L("Onsite, Bangkok", "ที่แล็บ กรุงเทพฯ") },
      { id: "hybrid", label: L("Hybrid", "ไฮบริด") }
    ],
    format: [
      { id: "1to1", label: L("One-to-one", "ตัวต่อตัว") },
      { id: "small", label: L("Small group", "กลุ่มเล็ก") },
      { id: "class", label: L("Class / team", "ชั้นเรียน / ทีม") }
    ],
    /* course sequences by interest and starting level */
    paths: {
      si:         { new: ["AI100", "PY101", "MTH110"], some: ["ML220", "NV210", "DL310", "NLP330"], adv: ["SI410", "SI420", "SI430", "NV330"] },
      code:       { new: ["CT100", "PY101", "GIT110"], some: ["DSA210", "CPP220", "JAV220"], adv: ["GPU320", "MLO350"] },
      web:        { new: ["WEB101", "GIT110"], some: ["WEB230", "WEB220"], adv: ["WEB340", "ACE220"] },
      apple:      { new: ["SWP100", "SWF110"], some: ["SSC250", "IOS220"], adv: ["APP330", "IOS340"] },
      edge:       { new: ["ARD101", "PY101"], some: ["RPI210", "EDG220", "ARQ230"], adv: ["EDG310", "EDG320", "NV340"] },
      medical:    { new: ["PY101", "AI100"], some: ["DS210", "ML220"], adv: ["DL310", "CV320", "SI430"] },
      business:   { new: ["PY101", "AI100"], some: ["DS210", "ML220", "WEB220"], adv: ["WEB340", "MLO350"] },
      innovation: { new: ["RES101", "INNO"], some: ["RES210", "INNO"], adv: ["RES320", "RES330", "INNO"] },
      aieng:      { new: ["PY101", "GIT110", "ACE110"], some: ["ACE220", "WEB230"], adv: ["ACE330"] },
      exam:       { new: ["PY101", "EXM110"], some: ["EXM210", "EXM220"], adv: ["DSA210", "EXM210", "EXM220"] }
    },
    goalAdds: { skills: [], compete: ["RES330"], publish: ["RES320", "RES450"], portfolio: ["INNO"], career: ["MLO350"] }
  };
})();
