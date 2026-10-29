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

  // every course knows its group (used by the catalogue and the back office)
  D.courses.forEach(function (c) { var g = D.groupOf(c.track); c.group = g ? g.id : "programming"; });
})();
