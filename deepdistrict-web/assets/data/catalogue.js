/* ==========================================================================
   DeepDistrict.si — course groups and v4.6 course additions
   (loads after admissions.js; the last catalogue file)
   --------------------------------------------------------------------------
   Groups sit above tracks:  group → track → course.
   Every track belongs to exactly one group; every course to one track.
   Run `node tools/check_catalogue.js` after editing any catalogue file.
   ========================================================================== */
(function () {
  var D = window.DD_CONTENT;
  function L(en, th) { return { en: en, th: th }; }
  function m(list) { return list.map(function (x) { return L(x[0], x[1]); }); }
  var ALL = ["online", "onsite", "hybrid"];

  /* ------------------------------------------------------------ groups (order = display order) */
  D.groups = [
    { id: "programming", icon: "code", tracks: ["code"],
      name: L("Foundation Programming", "พื้นฐานการเขียนโปรแกรม"),
      text: L("From first blocks and Python to C/C++, Java, algorithms and competitive programming.", "ตั้งแต่บล็อกโค้ดและ Python ไปจนถึง C/C++, Java อัลกอริทึม และการแข่งขันเขียนโปรแกรม") },
    { id: "software", icon: "web", tracks: ["web", "apple", "aieng", "cloud"],
      name: L("Software & App Development", "พัฒนาซอฟต์แวร์และแอปพลิเคชัน"),
      text: L("Web, iPhone and iPad apps, engineering with AI agents, cloud, DevOps and security.", "เว็บ แอป iPhone และ iPad วิศวกรรมซอฟต์แวร์ร่วมกับ AI Agent คลาวด์ DevOps และความปลอดภัยไซเบอร์") },
    { id: "ai", icon: "spark", tracks: ["ai"],
      name: L("AI & Data Science", "AI และวิทยาการข้อมูล"),
      text: L("AI literacy, data, machine and deep learning, LLMs, agents and the road to SI.", "ความรู้เท่าทัน AI ข้อมูล Machine Learning, Deep Learning, LLM, AI Agent และเส้นทางสู่ SI") },
    { id: "hardware", icon: "chip", tracks: ["edge"],
      name: L("Hardware, Robotics & Edge AI", "ฮาร์ดแวร์ หุ่นยนต์ และ Edge AI"),
      text: L("Arduino, Raspberry Pi, NVIDIA Jetson, CUDA and ROS 2: intelligence in real devices.", "Arduino, Raspberry Pi, NVIDIA Jetson, CUDA และ ROS 2 ใส่ความฉลาดลงในอุปกรณ์จริง") },
    { id: "research", icon: "microscope", tracks: ["research"],
      name: L("Research & Innovation", "วิจัยและนวัตกรรม"),
      text: L("Scientific method, design thinking, writing, publishing, competitions and startups.", "กระบวนการทางวิทยาศาสตร์ Design Thinking การเขียน การตีพิมพ์ การแข่งขัน และสตาร์ทอัพ") },
    { id: "tests", icon: "trophy", tracks: ["exam", "admit"], href: "pages/admissions.html",
      name: L("Standard Tests & Admissions", "สอบมาตรฐานและเข้ามหาวิทยาลัย"),
      text: L("COMPAS, HKICO, POSN, IELTS, SAT, TBAT and CU-AAT, plus the portfolio that gets you in.", "COMPAS, HKICO, สอวน., IELTS, SAT, TBAT และ CU-AAT พร้อมพอร์ตโฟลิโอที่พาคุณเข้ามหาวิทยาลัย") }
  ];
  D.groupOf = function (trackId) {
    for (var i = 0; i < D.groups.length; i++) if (D.groups[i].tracks.indexOf(trackId) !== -1) return D.groups[i];
    return null;
  };

  /* ------------------------------------------------------------ new track */
  D.tracks.push({
    id: "cloud", icon: "server", name: L("Cloud, Security & DevOps", "คลาวด์ ความปลอดภัย และ DevOps"),
    text: L("Linux, Docker, CI/CD and cloud deployment, and how to defend real systems.", "Linux, Docker, CI/CD และการนำระบบขึ้นคลาวด์ พร้อมวิธีป้องกันระบบจริง"),
    tech: ["Linux", "Docker", "GitHub Actions", "CTF"]
  });

  /* ------------------------------------------------------------ new courses */
  var add = [
    { code: "SCR090", track: "code", level: 1, hours: 16,
      title: L("Scratch & Creative Coding for Kids", "Scratch และการเขียนโค้ดสร้างสรรค์สำหรับเด็ก"),
      text: L("Games, stories and animations with blocks, then a micro:bit gadget: a playful first step before Python.", "สร้างเกม นิทาน และแอนิเมชันด้วยบล็อกโค้ด แล้วต่อยอดเป็นอุปกรณ์ micro:bit ก้าวแรกที่สนุกก่อนเรียน Python"),
      tools: ["Scratch 3", "micro:bit", "MakeCode"] },
    { code: "CP230", track: "code", level: 2, hours: 36,
      title: L("Competitive Programming & Problem Solving", "การแข่งขันเขียนโปรแกรมและการแก้โจทย์"),
      text: L("Greedy, binary search, dynamic programming and graphs, trained on online judges with weekly contests.", "Greedy, Binary Search, Dynamic Programming และกราฟ ฝึกบนระบบตรวจออนไลน์พร้อมแข่งทุกสัปดาห์"),
      tools: ["C++", "Python", "Online judges"] },
    { code: "SQL120", track: "ai", level: 1, hours: 18,
      title: L("Databases & SQL for Data", "ฐานข้อมูลและ SQL สำหรับงานข้อมูล"),
      text: L("Design tables, query with SQL and answer real questions from data: the skill behind every app and analysis.", "ออกแบบตาราง เขียน SQL และตอบคำถามจริงจากข้อมูล ทักษะเบื้องหลังทุกแอปและทุกงานวิเคราะห์"),
      tools: ["SQLite", "PostgreSQL", "SQL"] },
    { code: "GEN120", track: "ai", level: 1, hours: 12,
      title: L("Generative AI for Students & Creators", "Generative AI สำหรับนักเรียนและนักสร้างสรรค์"),
      text: L("Use chat, image and video AI well: clear prompts, checking facts, citing sources and creating responsibly.", "ใช้ AI ด้านแชท ภาพ และวิดีโอได้อย่างดี เขียนคำสั่งให้ชัด ตรวจสอบข้อเท็จจริง อ้างอิงแหล่งที่มา และสร้างสรรค์อย่างรับผิดชอบ"),
      tools: ["Chat assistants", "Image AI", "Fact-checking"] },
    { code: "RL340", track: "ai", level: 3, hours: 36,
      title: L("Reinforcement Learning", "Reinforcement Learning"),
      text: L("Agents that learn by trial and error: bandits, Q-learning, policy gradients and RL for games and robots.", "Agent ที่เรียนรู้จากการลองผิดลองถูก ทั้ง Bandit, Q-learning, Policy Gradient และ RL สำหรับเกมและหุ่นยนต์"),
      tools: ["Gymnasium", "PyTorch", "Stable-Baselines3"] },
    { code: "SEC220", track: "cloud", level: 2, hours: 30,
      title: L("Cybersecurity Fundamentals & Ethical Hacking", "พื้นฐานความปลอดภัยไซเบอร์และการแฮกอย่างมีจริยธรรม"),
      text: L("How attacks work and how to defend: web security, passwords, networks and capture-the-flag challenges in a legal lab.", "การโจมตีทำงานอย่างไรและป้องกันอย่างไร ทั้งความปลอดภัยเว็บ รหัสผ่าน เครือข่าย และโจทย์ Capture the Flag ในแล็บที่ถูกกฎหมาย"),
      tools: ["Linux", "Wireshark", "OWASP", "CTF"] },
    { code: "CLD230", track: "cloud", level: 2, hours: 30,
      title: L("Cloud, Linux & DevOps", "คลาวด์ Linux และ DevOps"),
      text: L("Ship software like a team: Linux, Docker containers, CI/CD pipelines and deploying to the cloud.", "ส่งมอบซอฟต์แวร์แบบทีมมืออาชีพ ด้วย Linux, Docker Container, CI/CD และการนำระบบขึ้นคลาวด์"),
      tools: ["Linux", "Docker", "GitHub Actions", "Cloud"] },
    { code: "INN120", track: "research", level: 1, hours: 16,
      title: L("Design Thinking & Innovation Sprint", "Design Thinking และ Innovation Sprint"),
      text: L("Find a real problem, interview users, prototype fast and test: the method behind every good innovation project.", "ค้นหาปัญหาจริง สัมภาษณ์ผู้ใช้ สร้างต้นแบบอย่างรวดเร็ว และทดสอบ วิธีคิดเบื้องหลังโครงงานนวัตกรรมที่ดี"),
      tools: ["Interviews", "Prototyping", "Figma"] },
    { code: "ENT230", track: "research", level: 2, hours: 24,
      title: L("Tech Entrepreneurship & Pitching", "การเป็นผู้ประกอบการเทคโนโลยีและการนำเสนอ"),
      text: L("Turn a project into a product: customers, business model, simple finances and a pitch for competitions or investors.", "เปลี่ยนโครงงานเป็นผลิตภัณฑ์ ทั้งลูกค้า โมเดลธุรกิจ การเงินเบื้องต้น และการ Pitch สำหรับการแข่งขันหรือนักลงทุน"),
      tools: ["Lean Canvas", "Pitch deck", "Demo day"] },
    { code: "VOS350", track: "apple", level: 3, hours: 30,
      title: L("Apple Vision Pro & visionOS: Spatial Apps", "Apple Vision Pro และ visionOS: แอปแบบ Spatial"),
      text: L("Build for spatial computing: windows, volumes and immersive spaces with SwiftUI and RealityKit, tested in the visionOS simulator.", "สร้างแอปสำหรับ Spatial Computing ทั้งหน้าต่าง Volume และ Immersive Space ด้วย SwiftUI และ RealityKit ทดสอบด้วย visionOS Simulator"),
      tools: ["visionOS", "SwiftUI", "RealityKit", "Reality Composer Pro"] },
    { code: "EXM230", track: "exam", level: 2, hours: 36,
      title: L("POSN Computer Olympiad Preparation", "เตรียมสอบโอลิมปิกวิชาการคอมพิวเตอร์ (สอวน.)"),
      text: L("Logic, mathematics for computing and C/C++ algorithms for the POSN (สอวน.) computer selection exam and camp, the road to TOI.", "ตรรกะ คณิตศาสตร์สำหรับคอมพิวเตอร์ และอัลกอริทึมด้วย C/C++ สำหรับการสอบคัดเลือกและค่าย สอวน. คอมพิวเตอร์ เส้นทางสู่ TOI"),
      tools: ["C/C++", "Logic puzzles", "Past-style problems"] }
  ];
  add.forEach(function (c) { D.courses.push(c); });

  var det = {
    SCR090: { modes: ALL,
      modules: m([["Sprites, motion & events", "ตัวละคร การเคลื่อนที่ และเหตุการณ์"], ["Loops & conditions in games", "การวนซ้ำและเงื่อนไขในเกม"], ["Variables & scores", "ตัวแปรและคะแนน"], ["Stories & animation", "นิทานและแอนิเมชัน"], ["micro:bit gadgets", "อุปกรณ์ micro:bit"], ["Show & tell", "นำเสนอผลงาน"]]),
      outcomes: m([["Build and share your own game", "สร้างและแบ่งปันเกมของตัวเอง"], ["Think in steps, loops and conditions", "คิดเป็นขั้นตอน การวนซ้ำ และเงื่อนไข"], ["Be ready for PY101 or SWP100", "พร้อมต่อยอดสู่ PY101 หรือ SWP100"]]),
      prereq: L("None, ages 7+", "ไม่ต้องมีพื้นฐาน อายุ 7 ปีขึ้นไป"),
      project: L("A game or interactive story, plus a micro:bit gadget", "เกมหรือนิทานโต้ตอบ พร้อมอุปกรณ์ micro:bit") },
    CP230: { modes: ALL,
      modules: m([["Complexity & fast I/O", "ความซับซ้อนและ I/O ที่รวดเร็ว"], ["Sorting, greedy & binary search", "การเรียง Greedy และ Binary Search"], ["Prefix sums & two pointers", "Prefix Sum และ Two Pointers"], ["Dynamic programming", "Dynamic Programming"], ["Graphs: BFS, DFS, shortest paths", "กราฟ: BFS, DFS และเส้นทางสั้นที่สุด"], ["Contest strategy & debugging", "กลยุทธ์การแข่งขันและการดีบัก"]]),
      outcomes: m([["Solve medium contest problems in time", "แก้โจทย์แข่งขันระดับกลางได้ทันเวลา"], ["Choose the right algorithm quickly", "เลือกอัลกอริทึมที่เหมาะได้รวดเร็ว"], ["Prepare for POSN, TOI and coding interviews", "พร้อมสำหรับ สอวน. TOI และการสัมภาษณ์งานเขียนโปรแกรม"]]),
      prereq: L("DSA210, or CPP220 with strong maths", "DSA210 หรือ CPP220 และพื้นฐานคณิตศาสตร์ดี"),
      project: L("A rated contest record and a personal algorithm notebook", "ผลการแข่งขันที่มีเรตติ้ง และสมุดอัลกอริทึมส่วนตัว") },
    SQL120: { modes: ALL,
      modules: m([["Tables, keys & relationships", "ตาราง คีย์ และความสัมพันธ์"], ["SELECT, WHERE & ORDER BY", "SELECT, WHERE และ ORDER BY"], ["Joins & aggregation", "Join และการสรุปข้อมูล"], ["Designing a database", "การออกแบบฐานข้อมูล"], ["SQL from Python", "ใช้ SQL จาก Python"], ["Privacy & data protection basics", "พื้นฐานความเป็นส่วนตัวและการคุ้มครองข้อมูล"]]),
      outcomes: m([["Answer real questions with SQL", "ตอบคำถามจริงด้วย SQL"], ["Design a clean database", "ออกแบบฐานข้อมูลที่ดี"], ["Be ready for DS210 and WEB220", "พร้อมต่อยอดสู่ DS210 และ WEB220"]]),
      prereq: L("PY101 helpful", "ควรผ่าน PY101"),
      project: L("A database and report built from an open dataset", "ฐานข้อมูลและรายงานจากชุดข้อมูลเปิด") },
    GEN120: { modes: ALL,
      modules: m([["How generative AI works, simply", "Generative AI ทำงานอย่างไร แบบเข้าใจง่าย"], ["Writing clear prompts", "การเขียนคำสั่งให้ชัดเจน"], ["Checking facts & spotting errors", "ตรวจสอบข้อเท็จจริงและจับข้อผิดพลาด"], ["Images, audio & video with AI", "ภาพ เสียง และวิดีโอด้วย AI"], ["Academic integrity & citing AI", "ความซื่อสัตย์ทางวิชาการและการอ้างอิง AI"], ["Privacy, bias & copyright", "ความเป็นส่วนตัว อคติ และลิขสิทธิ์"]]),
      outcomes: m([["Use AI to learn faster, not to skip learning", "ใช้ AI เพื่อเรียนรู้เร็วขึ้น ไม่ใช่เพื่อข้ามการเรียนรู้"], ["Check and cite AI output", "ตรวจสอบและอ้างอิงผลลัพธ์จาก AI ได้"], ["Create responsibly", "สร้างสรรค์อย่างรับผิดชอบ"]]),
      prereq: L("None, ages 12+ (under-18s use AI tools with a guardian's consent)", "ไม่ต้องมีพื้นฐาน อายุ 12 ปีขึ้นไป (อายุต่ำกว่า 18 ปีใช้เครื่องมือ AI โดยได้รับความยินยอมจากผู้ปกครอง)"),
      project: L("A school project made with AI, with a log of what you checked", "โครงงานที่ทำร่วมกับ AI พร้อมบันทึกสิ่งที่ตรวจสอบ") },
    RL340: { modes: ALL,
      modules: m([["Agents, rewards & environments", "Agent รางวัล และสภาพแวดล้อม"], ["Bandits & exploration", "Bandit และการสำรวจ"], ["Dynamic programming & Q-learning", "Dynamic Programming และ Q-learning"], ["Deep Q-networks", "Deep Q-Network"], ["Policy gradients & PPO", "Policy Gradient และ PPO"], ["Safety & reward hacking", "ความปลอดภัยและการโกงรางวัล"]]),
      outcomes: m([["Train agents for games and control", "เทรน Agent สำหรับเกมและการควบคุม"], ["Debug unstable training", "แก้ปัญหาการเทรนที่ไม่เสถียร"], ["Connect RL to robotics and LLM training", "เชื่อม RL กับหุ่นยนต์และการเทรน LLM"]]),
      prereq: L("DL310", "DL310"),
      project: L("An agent that masters a game or robot task", "Agent ที่เชี่ยวชาญเกมหรืองานหุ่นยนต์") },
    SEC220: { modes: ALL,
      modules: m([["Security mindset & the law", "แนวคิดด้านความปลอดภัยและกฎหมาย"], ["Linux & networking basics", "พื้นฐาน Linux และเครือข่าย"], ["Web vulnerabilities (OWASP Top 10)", "ช่องโหว่เว็บ (OWASP Top 10)"], ["Passwords, crypto & authentication", "รหัสผ่าน การเข้ารหัส และการยืนยันตัวตน"], ["Capture-the-flag practice", "ฝึกโจทย์ Capture the Flag"], ["Defending and reporting responsibly", "การป้องกันและรายงานช่องโหว่อย่างรับผิดชอบ"]]),
      outcomes: m([["Find and fix common vulnerabilities", "ค้นหาและแก้ช่องโหว่ที่พบบ่อย"], ["Solve CTF challenges as a team", "แก้โจทย์ CTF เป็นทีม"], ["Hack only where it is legal and agreed", "ทดสอบเฉพาะในที่ที่ถูกกฎหมายและได้รับอนุญาต"]]),
      prereq: L("PY101 or WEB101", "PY101 หรือ WEB101"),
      project: L("A secured web app and a CTF write-up", "เว็บแอปที่ปิดช่องโหว่แล้ว พร้อมรายงานการแก้โจทย์ CTF") },
    CLD230: { modes: ALL,
      modules: m([["Linux command line", "Command Line ของ Linux"], ["Docker & containers", "Docker และ Container"], ["CI/CD with GitHub Actions", "CI/CD ด้วย GitHub Actions"], ["Deploying to the cloud", "การนำระบบขึ้นคลาวด์"], ["Monitoring, logs & backups", "การติดตาม Log และการสำรองข้อมูล"], ["Costs & security in the cloud", "ค่าใช้จ่ายและความปลอดภัยบนคลาวด์"]]),
      outcomes: m([["Containerise and deploy any app", "ทำ Container และนำแอปใดก็ได้ขึ้นระบบ"], ["Automate tests and releases", "ทำการทดสอบและการปล่อยเวอร์ชันแบบอัตโนมัติ"], ["Keep a service running and safe", "ดูแลบริการให้ทำงานและปลอดภัย"]]),
      prereq: L("GIT110 and WEB220 or PY101", "GIT110 และ WEB220 หรือ PY101"),
      project: L("A deployed app with an automated pipeline", "แอปที่ขึ้นระบบจริงพร้อม Pipeline อัตโนมัติ") },
    INN120: { modes: ALL,
      modules: m([["Spotting real problems", "มองหาปัญหาจริง"], ["Interviewing users with empathy", "สัมภาษณ์ผู้ใช้อย่างเข้าใจ"], ["Ideation & choosing an idea", "ระดมความคิดและเลือกไอเดีย"], ["Paper & digital prototypes", "ต้นแบบกระดาษและดิจิทัล"], ["Testing & iterating", "ทดสอบและปรับปรุง"], ["Presenting the story", "นำเสนอเรื่องราว"]]),
      outcomes: m([["Turn a problem into a tested prototype", "เปลี่ยนปัญหาเป็นต้นแบบที่ผ่านการทดสอบ"], ["Work as an innovation team", "ทำงานเป็นทีมนวัตกรรม"], ["Find a strong topic for INNO or a portfolio", "ได้หัวข้อที่ดีสำหรับ INNO หรือพอร์ตโฟลิโอ"]]),
      prereq: L("None, ages 10+", "ไม่ต้องมีพื้นฐาน อายุ 10 ปีขึ้นไป"),
      project: L("A tested prototype and a 3-minute pitch", "ต้นแบบที่ผ่านการทดสอบ และการนำเสนอ 3 นาที") },
    ENT230: { modes: ALL,
      modules: m([["From project to product", "จากโครงงานสู่ผลิตภัณฑ์"], ["Customers & the problem they pay for", "ลูกค้าและปัญหาที่ยอมจ่ายเพื่อแก้"], ["Business model & Lean Canvas", "โมเดลธุรกิจและ Lean Canvas"], ["Simple finances & pricing", "การเงินและการตั้งราคาเบื้องต้น"], ["IP, contracts & PDPA basics", "ทรัพย์สินทางปัญญา สัญญา และ PDPA เบื้องต้น"], ["Pitch deck & demo day", "Pitch Deck และ Demo Day"]]),
      outcomes: m([["Explain who your product is for and why", "อธิบายได้ว่าผลิตภัณฑ์เพื่อใครและเพราะอะไร"], ["Build a credible pitch", "สร้างการนำเสนอที่น่าเชื่อถือ"], ["Enter startup and innovation competitions", "ลงแข่งขันสตาร์ทอัพและนวัตกรรม"]]),
      prereq: L("A project or prototype (INN120 or any build course)", "มีโครงงานหรือต้นแบบ (INN120 หรือหลักสูตรสร้างผลงานใดก็ได้)"),
      project: L("A pitch deck and demo for a real audience", "Pitch Deck และการสาธิตต่อผู้ฟังจริง") },
    VOS350: { modes: ALL,
      modules: m([["Spatial design: comfort, depth & accessibility", "การออกแบบ Spatial: ความสบายตา มิติ และการเข้าถึง"], ["Windows, volumes & immersive spaces", "หน้าต่าง Volume และ Immersive Space"], ["3D content with RealityKit & Reality Composer Pro", "เนื้อหา 3 มิติด้วย RealityKit และ Reality Composer Pro"], ["Gestures, gaze & hand input", "ท่าทาง การมอง และการใช้มือ"], ["Bringing iPhone/iPad apps to visionOS", "นำแอป iPhone/iPad สู่ visionOS"], ["Testing in the simulator & on device", "ทดสอบด้วย Simulator และบนอุปกรณ์"]]),
      outcomes: m([["Design apps that feel natural in space", "ออกแบบแอปที่ใช้งานในพื้นที่ได้อย่างเป็นธรรมชาติ"], ["Combine SwiftUI with 3D content", "ผสาน SwiftUI กับเนื้อหา 3 มิติ"], ["Ship a visionOS prototype", "สร้างต้นแบบแอป visionOS ได้จริง"]]),
      prereq: L("IOS220; a Mac with Xcode (Vision Pro device sessions on request)", "IOS220 และ Mac ที่มี Xcode (ทดลองบน Vision Pro ได้ตามนัด)"),
      project: L("A spatial app prototype for Apple Vision Pro", "ต้นแบบแอป Spatial สำหรับ Apple Vision Pro") },
    EXM230: { modes: ALL,
      modules: m([["How the POSN selection works", "ขั้นตอนการคัดเลือกของ สอวน."], ["Logic & reasoning puzzles", "โจทย์ตรรกะและการให้เหตุผล"], ["Mathematics for computing", "คณิตศาสตร์สำหรับคอมพิวเตอร์"], ["C/C++ fundamentals for olympiad", "พื้นฐาน C/C++ สำหรับโอลิมปิก"], ["Algorithms & tracing code", "อัลกอริทึมและการไล่โค้ด"], ["Timed mock exams", "ข้อสอบจำลองจับเวลา"]]),
      outcomes: m([["Handle logic and tracing questions confidently", "ทำโจทย์ตรรกะและการไล่โค้ดได้อย่างมั่นใจ"], ["Write correct C/C++ under pressure", "เขียน C/C++ ได้ถูกต้องภายใต้ความกดดัน"], ["Be ready for camp and the road to TOI", "พร้อมสำหรับค่ายและเส้นทางสู่ TOI"]]),
      prereq: L("CPP220 or CP230; strong lower-secondary maths", "CPP220 หรือ CP230 และคณิตศาสตร์ ม.ต้น ดี"),
      project: L("Full timed mocks with a personal error log", "ข้อสอบจำลองเต็มรูปแบบพร้อมบันทึกจุดพลาดส่วนตัว") }
  };
  Object.keys(det).forEach(function (k) { D.details[k] = det[k]; });

  /* ------------------------------------------------------------ new-era highlights
     A short list on purpose: the courses that matter most for AI, STEM, research and
     competitions now. Shown first on the home page and in the catalogue.            */
  D.highlights = [
    { code: "ACE110", tag: L("Vibe coding", "Vibe Coding"), why: L("Build real apps by talking to AI — and stay the engineer in charge.", "สร้างแอปจริงด้วยการสั่ง AI โดยที่คุณยังเป็นผู้ควบคุม") },
    { code: "ACE220", tag: L("AI agents for code", "AI Agent เขียนโค้ด"), why: L("How software is built now: specs, tests and coding agents.", "วิธีสร้างซอฟต์แวร์ยุคนี้ ด้วยสเปก การทดสอบ และ Coding Agent") },
    { code: "EDG220", tag: L("STEM AI", "STEM AI"), why: L("Hands-on AI you can hold: a smart camera on Raspberry Pi 5.", "AI ที่จับต้องได้ กล้องอัจฉริยะบน Raspberry Pi 5") },
    { code: "SI410", tag: L("Frontier AI", "AI ล้ำสมัย"), why: L("Agents that reason, plan and use tools: the step towards SI.", "Agent ที่ให้เหตุผล วางแผน และใช้เครื่องมือ ก้าวสู่ SI") },
    { code: "SWF110", tag: L("Swift & SwiftUI", "Swift และ SwiftUI"), why: L("Swift and SwiftUI on iPad or Mac, playground by playground.", "เรียน Swift และ SwiftUI บน iPad หรือ Mac ผ่าน Playground") },
    { code: "SSC250", tag: L("Swift Student Challenge", "Swift Student Challenge"), why: L("Apple's global student competition: from idea to a winning app playground.", "การแข่งขันระดับโลกของ Apple สำหรับนักเรียน จากไอเดียสู่ App Playground ที่ชนะ") },
    { code: "IOS340", tag: L("Apple AI", "AI ของ Apple"), why: L("Apple Intelligence's on-device model, the Vision framework and Core ML in iPhone and iPad apps.", "โมเดลบนอุปกรณ์ของ Apple Intelligence, Vision Framework และ Core ML ในแอป iPhone และ iPad") },
    { code: "VOS350", tag: L("Apple Vision Pro", "Apple Vision Pro"), why: L("Spatial apps for visionOS with SwiftUI and RealityKit.", "แอป Spatial สำหรับ visionOS ด้วย SwiftUI และ RealityKit") },
    { code: "INNO", tag: L("Innovation & research", "นวัตกรรมและวิจัย"), why: L("Your own topic, mentored all the way to publication or a prize.", "หัวข้อของคุณเอง มีพี่เลี้ยงดูแลจนตีพิมพ์หรือได้รางวัล") },
    { code: "RES330", tag: L("Competitions", "การแข่งขัน"), why: L("Posters, demos and pitches that win science and innovation fairs.", "โปสเตอร์ การสาธิต และการนำเสนอที่ชนะเวทีวิทยาศาสตร์และนวัตกรรม") },
    { code: "EXM230", tag: L("Computer olympiad", "โอลิมปิกคอมพิวเตอร์"), why: L("POSN (สอวน.) selection and camp: algorithms in C/C++.", "สอบคัดเลือกและค่าย สอวน. อัลกอริทึมด้วย C/C++") },
    { code: "EXM210", tag: L("Computer standard test", "สอบมาตรฐานคอมพิวเตอร์"), why: L("COMPAS-PY1: a Python certificate that strengthens a TCAS portfolio.", "COMPAS-PY1 ใบรับรอง Python ที่ช่วยเสริมพอร์ต TCAS") }
  ];
  D.highlights.forEach(function (h) { var c = D.courses.filter(function (x) { return x.code === h.code; })[0]; if (c) c.highlight = h.tag; });

  /* ------------------------------------------------------------ essential foundations
     The modern basics every later course builds on. Shown right after the picks. */
  D.essentials = [
    { code: "PY101", why: L("The language of AI, data and automation — the first real programming skill.", "ภาษาของ AI ข้อมูล และระบบอัตโนมัติ ทักษะเขียนโปรแกรมจริงตัวแรก") },
    { code: "AI100", why: L("How AI works, where it fails and how to use it responsibly.", "AI ทำงานอย่างไร ผิดพลาดตรงไหน และใช้อย่างรับผิดชอบ") },
    { code: "MTH110", why: L("Functions, vectors, probability and statistics: the maths behind AI.", "ฟังก์ชัน เวกเตอร์ ความน่าจะเป็น และสถิติ คณิตศาสตร์เบื้องหลัง AI") },
    { code: "DSA210", why: L("Algorithms and data structures: how good programmers think.", "อัลกอริทึมและโครงสร้างข้อมูล วิธีคิดของนักเขียนโปรแกรมที่เก่ง") },
    { code: "WEB101", why: L("HTML, CSS and JavaScript: put your work on the web.", "HTML, CSS และ JavaScript นำผลงานขึ้นเว็บได้จริง") },
    { code: "SQL120", why: L("Databases and SQL: the skill behind every app and analysis.", "ฐานข้อมูลและ SQL ทักษะเบื้องหลังทุกแอปและงานวิเคราะห์") },
    { code: "GIT110", why: L("Version control and teamwork, the way real software is built.", "การควบคุมเวอร์ชันและการทำงานเป็นทีม แบบที่ใช้ในงานซอฟต์แวร์จริง") },
    { code: "SCR090", why: L("For ages 7+: logic and creativity before typing code.", "สำหรับอายุ 7 ปีขึ้นไป ฝึกตรรกะและความคิดสร้างสรรค์ก่อนพิมพ์โค้ด") }
  ];

  /* ------------------------------------------------------------ standard tests: what, where, how long, which score
     Shown in the course summary of each test-prep course. Checked October 2026 from the
     test owners' and universities' announcements (and reputable Thai admissions sites).
     Requirements change every year, so the summary always says to ask our staff. */
  var CHECK = L("Checked October 2026. Rules and minimum scores change every year — ask our staff for the current announcement before you register or apply.",
                "ตรวจสอบเมื่อตุลาคม 2569 เกณฑ์และคะแนนขั้นต่ำเปลี่ยนทุกปี สอบถามเจ้าหน้าที่เพื่อตรวจประกาศล่าสุดก่อนสมัครสอบหรือยื่นสมัคร");
  D.testCheckedNote = CHECK;
  D.testInfo = {
    EXM110: { name: "HKICO", url: "https://www.hongkongico.org/",
      where: [[L("Any university", "ทุกมหาวิทยาลัย"), L("Computing, engineering, science", "สายคอมพิวเตอร์ วิศวกรรม วิทยาศาสตร์"), L("TCAS Round 1 (Portfolio) — as award evidence", "TCAS รอบ 1 (Portfolio) ใช้เป็นหลักฐานรางวัล")]],
      measures: L("Computational thinking and coding logic by age group (Scratch, Blockly or Python, depending on grade), as multiple-choice problems.", "การคิดเชิงคำนวณและตรรกะการเขียนโปรแกรมตามช่วงอายุ (Scratch, Blockly หรือ Python ตามระดับชั้น) ในรูปแบบปรนัย"),
      format: L("Heat round online (about 60 min) → international final (about 90 min); wrong answers can lose marks.", "รอบคัดเลือกออนไลน์ (ประมาณ 60 นาที) → รอบชิงชนะเลิศนานาชาติ (ประมาณ 90 นาที) ตอบผิดอาจถูกหักคะแนน"),
      validity: L("An award does not expire, but programmes usually count awards from upper-secondary years (M.4–M.6).", "รางวัลไม่มีวันหมดอายุ แต่หลักสูตรส่วนใหญ่นับรางวัลช่วง ม.ปลาย (ม.4–ม.6)"),
      targets: [[L("Strong portfolio evidence", "หลักฐานพอร์ตที่มีน้ำหนัก"), L("Gold or Silver in the final", "เหรียญทองหรือเงินในรอบชิงชนะเลิศ")], [L("Good start for younger students", "จุดเริ่มต้นที่ดีสำหรับน้องเล็ก"), L("Bronze / Merit in the heat round", "เหรียญทองแดง / Merit ในรอบคัดเลือก")]] },
    EXM210: { name: "COMPAS-PY1", url: "https://compas.cp.eng.chula.ac.th/",
      where: [[L("Chulalongkorn", "จุฬาลงกรณ์มหาวิทยาลัย"), L("Engineering — Computer Engineering (CP) and CEDT", "วิศวกรรมศาสตร์ — วิศวกรรมคอมพิวเตอร์ (CP) และ CEDT"), L("TCAS Round 1 (Portfolio)", "TCAS รอบ 1 (Portfolio)")], [L("Other universities", "มหาวิทยาลัยอื่น"), L("Computer engineering / computer science", "วิศวกรรมคอมพิวเตอร์ / วิทยาการคอมพิวเตอร์"), L("TCAS Round 1 (Portfolio) — as evidence", "TCAS รอบ 1 (Portfolio) ใช้เป็นหลักฐาน")]],
      measures: L("Programming skill in Python 3: 8 problems — 4 basic and 4 problem-solving — marked by an automatic grader.", "ทักษะการเขียนโปรแกรมด้วย Python 3 ข้อสอบ 8 ข้อ (พื้นฐาน 4 ข้อ และแก้ปัญหา 4 ข้อ) ตรวจด้วยระบบอัตโนมัติ"),
      format: L("Run by Chulalongkorn's Department of Computer Engineering, several rounds a year.", "จัดโดยภาควิชาวิศวกรรมคอมพิวเตอร์ จุฬาฯ เปิดสอบหลายรอบต่อปี"),
      validity: L("The department sets which test rounds count for each admission year — we check this for you.", "ภาควิชากำหนดว่ารอบสอบใดใช้ได้ในแต่ละปีการศึกษา เราช่วยตรวจสอบให้"),
      targets: [[L("Pass", "ผ่าน"), L("Full 300 on the basic part and more than 400 in total", "ได้เต็ม 300 ในส่วนพื้นฐาน และคะแนนรวมมากกว่า 400")], [L("AWARD of EXCELLENCE", "AWARD of EXCELLENCE"), L("Top total score of the round (PY1 and CPP1 separately)", "คะแนนรวมสูงสุดของรอบ (PY1 และ CPP1 แยกกัน)")], [L("Chula CP / CEDT Portfolio", "พอร์ต CP / CEDT จุฬาฯ"), L("The top scorer may apply in TCAS Round 1", "ผู้ได้คะแนนสูงสุดยื่นพอร์ต TCAS รอบ 1 ได้")]] },
    EXM220: { name: "COMPAS-CPP1", url: "https://compas.cp.eng.chula.ac.th/",
      where: [[L("Chulalongkorn", "จุฬาลงกรณ์มหาวิทยาลัย"), L("Engineering — Computer Engineering (CP) and CEDT", "วิศวกรรมศาสตร์ — วิศวกรรมคอมพิวเตอร์ (CP) และ CEDT"), L("TCAS Round 1 (Portfolio)", "TCAS รอบ 1 (Portfolio)")], [L("Other universities", "มหาวิทยาลัยอื่น"), L("Computer engineering / computer science", "วิศวกรรมคอมพิวเตอร์ / วิทยาการคอมพิวเตอร์"), L("TCAS Round 1 (Portfolio) — as evidence", "TCAS รอบ 1 (Portfolio) ใช้เป็นหลักฐาน")]],
      measures: L("The same programming test as COMPAS-PY1, in C++17: 4 basic and 4 problem-solving problems.", "ข้อสอบแบบเดียวกับ COMPAS-PY1 แต่ใช้ภาษา C++17 พื้นฐาน 4 ข้อ และแก้ปัญหา 4 ข้อ"),
      format: L("Run by Chulalongkorn's Department of Computer Engineering, several rounds a year.", "จัดโดยภาควิชาวิศวกรรมคอมพิวเตอร์ จุฬาฯ เปิดสอบหลายรอบต่อปี"),
      validity: L("The department sets which test rounds count for each admission year — we check this for you.", "ภาควิชากำหนดว่ารอบสอบใดใช้ได้ในแต่ละปีการศึกษา เราช่วยตรวจสอบให้"),
      targets: [[L("Pass", "ผ่าน"), L("Full 300 on the basic part and more than 400 in total", "ได้เต็ม 300 ในส่วนพื้นฐาน และคะแนนรวมมากกว่า 400")], [L("AWARD of EXCELLENCE", "AWARD of EXCELLENCE"), L("Top total score of the round", "คะแนนรวมสูงสุดของรอบ")]] },
    EXM230: { name: "POSN (สอวน.) Computer", url: "https://www.posn.or.th/",
      where: [[L("Thammasat", "มหาวิทยาลัยธรรมศาสตร์"), L("Science & Technology (13 programmes)", "วิทยาศาสตร์และเทคโนโลยี (13 สาขา)"), L("TCAS70 Round 1 (Portfolio) — POSN Camp 2 / IPST", "TCAS70 รอบ 1 (Portfolio) — ค่าย 2 สอวน. / สสวท.")], [L("Mahidol", "มหาวิทยาลัยมหิดล"), L("ICT", "ICT (เทคโนโลยีสารสนเทศและการสื่อสาร)"), L("TCAS Round 2 (Quota) — POSN campers", "TCAS รอบ 2 (Quota) — ผู้ผ่านค่าย สอวน.")], [L("Many universities", "หลายมหาวิทยาลัย"), L("Computer engineering / computer science", "วิศวกรรมคอมพิวเตอร์ / วิทยาการคอมพิวเตอร์"), L("TCAS Round 1 (Portfolio) / Round 2 quotas", "TCAS รอบ 1 (Portfolio) / โควตารอบ 2")]],
      measures: L("Logic, mathematics for computing and algorithms; later stages are programming contests in C/C++.", "ตรรกะ คณิตศาสตร์สำหรับคอมพิวเตอร์ และอัลกอริทึม ขั้นต่อไปเป็นการแข่งเขียนโปรแกรมด้วย C/C++"),
      format: L("Selection exam at a POSN centre → Camp 1 → end-of-camp exam → Camp 2 → TOI (Thailand Olympiad in Informatics) → selection for the IOI team.", "สอบคัดเลือกที่ศูนย์ สอวน. → ค่าย 1 → สอบท้ายค่าย → ค่าย 2 → TOI (โอลิมปิกวิชาการคอมพิวเตอร์ระดับประเทศ) → คัดเลือกผู้แทน IOI"),
      validity: L("Certificates are issued per year; each programme states which camp level and years it accepts.", "เกียรติบัตรออกเป็นรายปี แต่ละหลักสูตรกำหนดระดับค่ายและปีที่ยอมรับเอง"),
      targets: [[L("Many quota programmes", "โควตาหลายหลักสูตร"), L("Passed Camp 1 or Camp 2", "ผ่านค่าย 1 หรือค่าย 2")], [L("Top-tier evidence", "หลักฐานระดับสูงสุด"), L("TOI medal", "เหรียญรางวัล TOI")]] },
    IEL200: { name: "IELTS Academic", url: "https://ielts.org",
      where: [[L("Chulalongkorn", "จุฬาลงกรณ์มหาวิทยาลัย"), L("International programmes, e.g. BBA, ISE, EBA, BALAC", "หลักสูตรนานาชาติ เช่น BBA, ISE, EBA, BALAC"), L("International admission (Early / Round 1–2)", "รอบรับสมัครนานาชาติ (Early / รอบ 1–2)")], [L("Chulalongkorn", "จุฬาลงกรณ์มหาวิทยาลัย"), L("Medicine (high English score required)", "แพทยศาสตร์ (ต้องใช้คะแนนภาษาอังกฤษสูง)"), L("TCAS70 Round 1 (Portfolio)", "TCAS70 รอบ 1 (Portfolio)")], [L("Thammasat", "มหาวิทยาลัยธรรมศาสตร์"), L("BBA (Thammasat Business School)", "BBA (คณะพาณิชยศาสตร์และการบัญชี)"), L("International admission (Early / Round 1–2)", "รอบรับสมัครนานาชาติ (Early / รอบ 1–2)")], [L("Khon Kaen", "มหาวิทยาลัยขอนแก่น"), L("Medicine (IELTS or TOEFL)", "แพทยศาสตร์ (IELTS หรือ TOEFL)"), L("TCAS Round 1 (Portfolio)", "TCAS รอบ 1 (Portfolio)")], [L("Universities abroad", "มหาวิทยาลัยต่างประเทศ"), L("UK, Australia, Europe, Asia", "สหราชอาณาจักร ออสเตรเลีย ยุโรป เอเชีย"), L("Direct / UCAS applications", "สมัครตรง / UCAS")]],
      measures: L("English for university study: Listening, Reading, Writing and Speaking, each with a band score.", "ภาษาอังกฤษเพื่อการเรียนในมหาวิทยาลัย ทั้ง Listening, Reading, Writing และ Speaking มีคะแนน Band แต่ละทักษะ"),
      format: L("About 2 h 45 min; on computer or paper; Band 0–9 in half bands.", "ประมาณ 2 ชั่วโมง 45 นาที สอบด้วยคอมพิวเตอร์หรือกระดาษ คะแนน Band 0–9 ทีละครึ่ง"),
      validity: L("Usually accepted for 2 years from the test date.", "โดยทั่วไปใช้ได้ 2 ปีนับจากวันสอบ"),
      targets: [[L("Thammasat BBA (TBS)", "BBA ธรรมศาสตร์ (TBS)"), L("6.0 overall, no band below 5.5", "Overall 6.0 และไม่มีทักษะใดต่ำกว่า 5.5")], [L("Chula BBA", "BBA จุฬาฯ"), L("6.5 minimum; 7.5+ is competitive", "ขั้นต่ำ 6.5 ถ้าจะแข่งขันได้ควร 7.5 ขึ้นไป")], [L("Melbourne / Sydney (undergraduate)", "Melbourne / Sydney (ปริญญาตรี)"), L("6.5, no band below 6.0", "6.5 และไม่มีทักษะใดต่ำกว่า 6.0")], [L("Leading UK universities", "มหาวิทยาลัยชั้นนำในสหราชอาณาจักร"), L("6.5–7.5 depending on university and course", "6.5–7.5 ตามมหาวิทยาลัยและสาขา")]] },
    SAT210: { name: "SAT (Math)", url: "https://satsuite.collegeboard.org/sat",
      where: [[L("Chulalongkorn", "จุฬาลงกรณ์มหาวิทยาลัย"), L("ISE (engineering), BBA, EBA, BBTECH, BISTECH", "ISE (วิศวกรรม), BBA, EBA, BBTECH, BISTECH"), L("International admission (Early / Round 1–2)", "รอบรับสมัครนานาชาติ (Early / รอบ 1–2)")], [L("Thammasat", "มหาวิทยาลัยธรรมศาสตร์"), L("BBA and other international programmes", "BBA และหลักสูตรนานาชาติอื่น"), L("International admission (Early / Round 1–2)", "รอบรับสมัครนานาชาติ (Early / รอบ 1–2)")], [L("US universities", "มหาวิทยาลัยในสหรัฐอเมริกา"), L("All majors", "ทุกสาขา"), L("Common App / university applications", "Common App / ใบสมัครของมหาวิทยาลัย")]],
      measures: L("Algebra, Advanced Math, Problem-Solving & Data Analysis, Geometry & Trigonometry; digital and adaptive, calculator allowed.", "Algebra, Advanced Math, Problem-Solving & Data Analysis, Geometry & Trigonometry สอบแบบดิจิทัลปรับระดับได้ ใช้เครื่องคิดเลขได้"),
      format: L("Math 70 min, 44 questions, 200–800; SAT total 400–1600.", "Math 70 นาที 44 ข้อ คะแนน 200–800 SAT รวม 400–1600"),
      validity: L("No official expiry; US universities usually accept about 5 years, while Thai programmes often ask for recent scores (commonly within 2 years) — check each programme.", "ไม่มีวันหมดอายุอย่างเป็นทางการ มหาวิทยาลัยในสหรัฐฯ มักรับย้อนหลังประมาณ 5 ปี ส่วนหลักสูตรในไทยมักกำหนดให้ใช้ผลสอบล่าสุด (มักไม่เกิน 2 ปี) ต้องตรวจแต่ละหลักสูตร"),
      targets: [[L("Chula BBTECH / BISTECH (2027)", "BBTECH / BISTECH จุฬาฯ (2570)"), L("SAT Math 550+", "SAT Math 550 ขึ้นไป")], [L("Chula ISE (engineering)", "ISE จุฬาฯ (วิศวกรรม)"), L("SAT Math 620+", "SAT Math 620 ขึ้นไป")], [L("Chula BBA", "BBA จุฬาฯ"), L("SAT total 1,270–1,300+", "SAT รวม 1,270–1,300 ขึ้นไป")], [L("Thammasat BBA", "BBA ธรรมศาสตร์"), L("SAT total about 1,280 (AY 2026)", "SAT รวมประมาณ 1,280 (ปีการศึกษา 2569)")]] },
    SAT220: { name: "SAT (Reading & Writing / EBRW)", url: "https://satsuite.collegeboard.org/sat",
      where: [[L("Chulalongkorn", "จุฬาลงกรณ์มหาวิทยาลัย"), L("BBA, EBA and others using an SAT total", "BBA, EBA และหลักสูตรที่ใช้ SAT รวม"), L("International admission (Early / Round 1–2)", "รอบรับสมัครนานาชาติ (Early / รอบ 1–2)")], [L("Thammasat", "มหาวิทยาลัยธรรมศาสตร์"), L("BBA and other international programmes", "BBA และหลักสูตรนานาชาติอื่น"), L("International admission (Early / Round 1–2)", "รอบรับสมัครนานาชาติ (Early / รอบ 1–2)")], [L("US universities", "มหาวิทยาลัยในสหรัฐอเมริกา"), L("All majors", "ทุกสาขา"), L("Common App / university applications", "Common App / ใบสมัครของมหาวิทยาลัย")]],
      measures: L("Short-passage reading, vocabulary in context, rhetoric and English grammar; digital and adaptive.", "การอ่านบทความสั้น คำศัพท์ในบริบท วาทศิลป์ และไวยากรณ์อังกฤษ สอบแบบดิจิทัลปรับระดับได้"),
      format: L("Reading & Writing 64 min, 54 questions, 200–800; no penalty for wrong answers.", "Reading & Writing 64 นาที 54 ข้อ คะแนน 200–800 ตอบผิดไม่หักคะแนน"),
      validity: L("Same as SAT Math: no official expiry; Thai programmes often want recent scores — check each programme.", "เช่นเดียวกับ SAT Math ไม่มีวันหมดอายุอย่างเป็นทางการ แต่หลักสูตรในไทยมักต้องการผลสอบล่าสุด ต้องตรวจแต่ละหลักสูตร"),
      targets: [[L("Chula BBA", "BBA จุฬาฯ"), L("Part of SAT total 1,270–1,300+ (Math and EBRW from the same sitting)", "รวมใน SAT 1,270–1,300 ขึ้นไป (Math และ EBRW ต้องมาจากรอบสอบเดียวกัน)")], [L("Typical EBRW minimums", "EBRW ขั้นต่ำที่พบบ่อย"), L("About 450–500, higher for competitive programmes", "ประมาณ 450–500 หลักสูตรที่แข่งขันสูงต้องการมากกว่านี้")]] },
    AAT210: { name: "CU-AAT (Math)", url: "https://www.atc.chula.ac.th",
      where: [[L("Chulalongkorn", "จุฬาลงกรณ์มหาวิทยาลัย"), L("ISE, BBA, EBA, BBTECH, BISTECH (instead of SAT)", "ISE, BBA, EBA, BBTECH, BISTECH (ใช้แทน SAT)"), L("International admission (Early / Round 1–2)", "รอบรับสมัครนานาชาติ (Early / รอบ 1–2)")], [L("Chulalongkorn", "จุฬาลงกรณ์มหาวิทยาลัย"), L("Medicine and Dentistry (with TBAT)", "แพทยศาสตร์ และทันตแพทยศาสตร์ (ร่วมกับ TBAT)"), L("TCAS70 Round 1 (Portfolio)", "TCAS70 รอบ 1 (Portfolio)")], [L("Khon Kaen", "มหาวิทยาลัยขอนแก่น"), L("Medicine (with TBAT and IELTS/TOEFL)", "แพทยศาสตร์ (ร่วมกับ TBAT และ IELTS/TOEFL)"), L("TCAS Round 1 (Portfolio)", "TCAS รอบ 1 (Portfolio)")]],
      measures: L("Arithmetic, algebra, geometry and problem solving, paper-based; wrong answers lose ¼ point.", "เลขคณิต พีชคณิต เรขาคณิต และการแก้โจทย์ปัญหา สอบด้วยกระดาษ ตอบผิดหัก ¼ คะแนน"),
      format: L("Math part 200–800; CU-AAT total (Math + Verbal) up to 1,600; several rounds a year in Thailand.", "ส่วน Math 200–800 CU-AAT รวม (Math + Verbal) สูงสุด 1,600 เปิดสอบหลายรอบต่อปีในประเทศไทย"),
      validity: L("2 years from the test date.", "2 ปีนับจากวันสอบ"),
      targets: [[L("Chula BBTECH / BISTECH (2027)", "BBTECH / BISTECH จุฬาฯ (2570)"), L("Math 450+", "Math 450 ขึ้นไป")], [L("Chula ISE (engineering)", "ISE จุฬาฯ (วิศวกรรม)"), L("Math 480+", "Math 480 ขึ้นไป")], [L("Chula BBA", "BBA จุฬาฯ"), L("CU-AAT total 1,200+", "CU-AAT รวม 1,200 ขึ้นไป")], [L("Chula Dentistry Portfolio (TCAS70)", "พอร์ตทันตแพทย์ จุฬาฯ (TCAS70)"), L("CU-AAT total 1,000+, with TBAT", "CU-AAT รวม 1,000 ขึ้นไป ร่วมกับ TBAT")]] },
    AAT220: { name: "CU-AAT (Verbal)", url: "https://www.atc.chula.ac.th",
      where: [[L("Chulalongkorn", "จุฬาลงกรณ์มหาวิทยาลัย"), L("BBA, BALAC and others using a CU-AAT total or Verbal minimum", "BBA, BALAC และหลักสูตรที่ใช้ CU-AAT รวมหรือ Verbal ขั้นต่ำ"), L("International admission (Early / Round 1–2)", "รอบรับสมัครนานาชาติ (Early / รอบ 1–2)")], [L("Chulalongkorn", "จุฬาลงกรณ์มหาวิทยาลัย"), L("Medicine and Dentistry (with TBAT)", "แพทยศาสตร์ และทันตแพทยศาสตร์ (ร่วมกับ TBAT)"), L("TCAS70 Round 1 (Portfolio)", "TCAS70 รอบ 1 (Portfolio)")]],
      measures: L("Sentence completion, critical reading, error identification, improving sentences and paragraphs; wrong answers lose ¼ point.", "เติมประโยค การอ่านเชิงวิเคราะห์ หาจุดผิด ปรับปรุงประโยคและย่อหน้า ตอบผิดหัก ¼ คะแนน"),
      format: L("Verbal part 200–800, taken in the same session as Math.", "ส่วน Verbal 200–800 สอบในรอบเดียวกับ Math"),
      validity: L("2 years from the test date.", "2 ปีนับจากวันสอบ"),
      targets: [[L("Chula BALAC", "BALAC จุฬาฯ"), L("Verbal about 400–480 (by round)", "Verbal ประมาณ 400–480 (ตามรอบ)")], [L("Chula BBA", "BBA จุฬาฯ"), L("Part of CU-AAT total 1,200+", "รวมใน CU-AAT 1,200 ขึ้นไป")]] },
    TBT300: { name: "TBAT", url: "https://www.atc.chula.ac.th",
      where: [[L("Chulalongkorn", "จุฬาลงกรณ์มหาวิทยาลัย"), L("Medicine (24 places)", "แพทยศาสตร์ (24 ที่นั่ง)"), L("TCAS70 Round 1 (Portfolio)", "TCAS70 รอบ 1 (Portfolio)")], [L("Chulalongkorn", "จุฬาลงกรณ์มหาวิทยาลัย"), L("Dentistry", "ทันตแพทยศาสตร์"), L("TCAS70 Round 1 (Portfolio)", "TCAS70 รอบ 1 (Portfolio)")], [L("Khon Kaen", "มหาวิทยาลัยขอนแก่น"), L("Medicine", "แพทยศาสตร์"), L("TCAS70 Round 1 (Portfolio)", "TCAS70 รอบ 1 (Portfolio)")], [L("Chulalongkorn", "จุฬาลงกรณ์มหาวิทยาลัย"), L("Science — BBTECH", "วิทยาศาสตร์ — BBTECH"), L("International admission (Early / Round 1–2)", "รอบรับสมัครนานาชาติ (Early / รอบ 1–2)")]],
      measures: L("Physics, Chemistry and Biology in English for medicine and health sciences — it replaced the BMAT in Thailand.", "ฟิสิกส์ เคมี และชีววิทยาเป็นภาษาอังกฤษ สำหรับแพทย์และวิทยาศาสตร์สุขภาพ ใช้แทน BMAT ในประเทศไทย"),
      format: L("About 140 multiple-choice questions, about 3 hours; scored per subject and in total.", "ปรนัยประมาณ 140 ข้อ ประมาณ 3 ชั่วโมง คิดคะแนนรายวิชาและคะแนนรวม"),
      validity: L("Usually up to 2 years back, counted to the last day of applications (as in Chula Dentistry TCAS70).", "โดยทั่วไปใช้ย้อนหลังได้ไม่เกิน 2 ปี นับถึงวันสุดท้ายของการรับสมัคร (ตามประกาศทันตแพทย์ จุฬาฯ TCAS70)"),
      targets: [[L("Chula Dentistry (TCAS70)", "ทันตแพทย์ จุฬาฯ (TCAS70)"), L("TBAT total 1,500+, Biology 500+, Chemistry 400+, CU-AAT 1,000+", "TBAT รวม 1,500 ขึ้นไป ชีววิทยา 500+ เคมี 400+ และ CU-AAT 1,000+")], [L("Chula Medicine (TCAS70)", "แพทย์ จุฬาฯ (TCAS70)"), L("Ranked by weighting: Biology 35%, Chemistry 25%, Physics 15%, CU-AAT Math 15%, Verbal 10%", "จัดอันดับตามสัดส่วน: ชีววิทยา 35% เคมี 25% ฟิสิกส์ 15% CU-AAT Math 15% Verbal 10%")], [L("Chula BBTECH (2027)", "BBTECH จุฬาฯ (2570)"), L("TBAT total 1,000+", "TBAT รวม 1,000 ขึ้นไป")]] }
  };

  // every course knows its group (used by the catalogue and the back office)
  D.courses.forEach(function (c) { var g = D.groupOf(c.track); c.group = g ? g.id : "programming"; });
})();
