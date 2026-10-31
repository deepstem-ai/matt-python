/* ==========================================================================
   DeepDistrict.si — v4 course additions (loads after courses-details.js)
   --------------------------------------------------------------------------
   New tracks: AI Co-Engineering and Exam & Olympiad prep.
   New courses: Git, React/Next.js, Swift Playgrounds, Apple app shipping,
   Raspberry Pi 5 AI, Arduino UNO Q / VENTUNO Q, Jetson Orin Nano generative
   AI, NVIDIA GPU data science, NIM/NeMo, Isaac, COMPAS and HKICO prep.
   Product names are trademarks of their owners (see the footer notice).
   ========================================================================== */
(function () {
  var D = window.DD_CONTENT;
  function L(en, th) { return { en: en, th: th }; }
  var ALL = ["online", "onsite", "hybrid"];
  var LAB = ["onsite", "hybrid"];

  /* ------------------------------------------------------------ Shown on every course listing and dialog */
  D.courseNotice = L(
    "Outlines are a starting guide. There are no fixed hours: content, pace and length are tailored to each learner's level and potential.",
    "รายละเอียดเป็นแนวทางเริ่มต้น ไม่มีจำนวนชั่วโมงตายตัว เนื้อหา ความเร็ว และระยะเวลาเรียนปรับตามระดับและศักยภาพของผู้เรียนแต่ละคน"
  );
  D.aiToolsNotice = L(
    "Claude Code (Anthropic), Codex (OpenAI), Cursor (Anysphere) and GitHub Copilot (GitHub) are named only to describe what we teach. We are not affiliated with these companies. Learners use their own accounts under each provider's terms, including age limits; under-18s join with a guardian's consent. Tools change quickly, so we teach methods that outlast any one product.",
    "Claude Code (Anthropic), Codex (OpenAI), Cursor (Anysphere) และ GitHub Copilot (GitHub) ถูกกล่าวถึงเพื่ออธิบายเนื้อหาที่สอนเท่านั้น เราไม่มีส่วนเกี่ยวข้องกับบริษัทเหล่านี้ ผู้เรียนใช้บัญชีของตนเองตามเงื่อนไขของผู้ให้บริการแต่ละราย รวมถึงข้อกำหนดเรื่องอายุ ผู้เรียนอายุต่ำกว่า 18 ปีต้องได้รับความยินยอมจากผู้ปกครอง เครื่องมือเปลี่ยนเร็ว เราจึงสอนวิธีคิดที่ใช้ได้ยาวนานกว่าผลิตภัณฑ์ใดผลิตภัณฑ์หนึ่ง"
  );

  /* ------------------------------------------------------------ New tracks */
  D.tracks.push(
    { id: "aieng", icon: "core", name: L("Vibe Coding & AI Co-Engineering", "Vibe Coding และวิศวกรรมซอฟต์แวร์ร่วมกับ AI"),
      text: L("Build real software with AI coding agents — and stay the engineer in charge: specify, verify, test and ship.",
              "สร้างซอฟต์แวร์จริงร่วมกับ AI Coding Agent โดยที่คุณยังเป็นวิศวกรผู้ควบคุม ตั้งแต่กำหนดสเปก ตรวจสอบ ทดสอบ จนส่งมอบ"),
      tech: ["Claude Code", "Codex", "Cursor", "Copilot"] },
    { id: "exam", icon: "trophy", name: L("Exams & Olympiads", "สอบมาตรฐานและโอลิมปิก"),
      text: L("Focused preparation for COMPAS-PY1, COMPAS-CPP1, HKICO and the POSN computer olympiad, with timed mocks and a clear exam method.",
              "เตรียมสอบ COMPAS-PY1, COMPAS-CPP1, HKICO และโอลิมปิกคอมพิวเตอร์ สอวน. แบบเจาะจง พร้อมข้อสอบจำลองจับเวลาและวิธีทำข้อสอบที่เป็นระบบ"),
      tech: ["Python", "C++", "POSN", "Mock exams"] }
  );

  /* ------------------------------------------------------------ New courses */
  var add = [
    // Foundation
    { code: "GIT110", track: "code", level: 1, hours: 12,
      title: L("Git & GitHub for Everyone", "Git และ GitHub สำหรับทุกคน"),
      text: L("Track every change, undo mistakes, branch, merge and collaborate the way real software teams do.", "บันทึกทุกการเปลี่ยนแปลง ย้อนกลับเมื่อพลาด แตกแขนง รวมงาน และทำงานร่วมกันแบบทีมซอฟต์แวร์จริง"),
      tools: ["Git", "GitHub", "VS Code"] },
    { code: "SWP100", track: "apple", level: 1, hours: 16,
      title: L("Swift Playgrounds for Young Coders", "Swift Playgrounds สำหรับนักโค้ดรุ่นเยาว์"),
      text: L("Learn to code with puzzles and characters on iPad or Mac, then build a first tiny app.", "เรียนเขียนโค้ดผ่านปริศนาและตัวละครบน iPad หรือ Mac แล้วสร้างแอปเล็ก ๆ แอปแรก"),
      tools: ["Swift Playgrounds", "iPad", "Mac"] },
    { code: "ACE110", track: "aieng", level: 1, hours: 18,
      title: L("Vibe Coding: Build Real Apps with AI", "Vibe Coding: สร้างแอปจริงด้วย AI"),
      text: L("Describe it, build it, ship it: turn an idea into a working app with AI assistants — and learn to read, question and fix what the AI writes.", "อธิบาย สร้าง และใช้งานจริง เปลี่ยนไอเดียเป็นแอปที่ใช้งานได้ด้วยผู้ช่วย AI พร้อมฝึกอ่าน ตั้งคำถาม และแก้โค้ดที่ AI เขียน"),
      tools: ["Claude", "ChatGPT", "GitHub Copilot", "Git"] },
    { code: "EXM110", track: "exam", level: 1, hours: 20,
      title: L("HKICO Python Preparation", "เตรียมสอบ HKICO (Python)"),
      text: L("Python fundamentals, logic puzzles and timed practice for the Hong Kong International Computational Olympiad.", "พื้นฐาน Python โจทย์ตรรกะ และฝึกทำข้อสอบจับเวลา สำหรับ Hong Kong International Computational Olympiad"),
      tools: ["Python", "Mock papers"] },
    // Intermediate
    { code: "WEB230", track: "web", level: 2, hours: 36,
      title: L("React & Next.js: Modern Web Frameworks", "React และ Next.js: เฟรมเวิร์กเว็บสมัยใหม่"),
      text: L("Components, state, routing and server rendering with React, Next.js and TypeScript, styled with Tailwind CSS.", "Component, State, Routing และ Server Rendering ด้วย React, Next.js และ TypeScript ตกแต่งด้วย Tailwind CSS"),
      tools: ["React", "Next.js", "TypeScript", "Tailwind CSS"] },
    { code: "EDG220", track: "edge", level: 2, hours: 30,
      title: L("Raspberry Pi 5 Vision AI", "Vision AI บน Raspberry Pi 5"),
      text: L("Real-time object detection on Raspberry Pi 5 with the AI HAT+ accelerator and camera modules.", "ตรวจจับวัตถุแบบเรียลไทม์บน Raspberry Pi 5 ด้วยตัวเร่ง AI HAT+ และโมดูลกล้อง"),
      tools: ["Raspberry Pi 5", "AI HAT+", "Picamera2", "YOLO"] },
    { code: "ARQ230", track: "edge", level: 2, hours: 30,
      title: L("Arduino UNO Q & VENTUNO Q: Real-Time Meets AI", "Arduino UNO Q และ VENTUNO Q: ควบคุมแบบเรียลไทม์ผสาน AI"),
      text: L("Dual-brain boards: Linux and Python for AI on one side, a real-time microcontroller for motors and sensors on the other.", "บอร์ดสองสมอง ฝั่งหนึ่งรัน Linux และ Python สำหรับ AI อีกฝั่งเป็นไมโครคอนโทรลเลอร์เรียลไทม์ควบคุมมอเตอร์และเซนเซอร์"),
      tools: ["Arduino UNO Q", "VENTUNO Q", "App Lab", "Zephyr"] },
    { code: "NV210", track: "ai", level: 2, hours: 24,
      title: L("GPU-Accelerated Data Science with NVIDIA", "วิทยาการข้อมูลแบบเร่งด้วย GPU ของ NVIDIA"),
      text: L("Make pandas and scikit-learn style work run many times faster on GPUs with RAPIDS and PyTorch.", "ทำให้งานสไตล์ pandas และ scikit-learn เร็วขึ้นหลายเท่าบน GPU ด้วย RAPIDS และ PyTorch"),
      tools: ["RAPIDS cuDF", "cuML", "PyTorch", "CUDA"] },
    { code: "ACE220", track: "aieng", level: 2, hours: 24,
      title: L("AI Co-Engineering II: Agentic Coding Workflows", "AI Co-Engineering 2: เวิร์กโฟลว์ AI Coding Agent"),
      text: L("Work with coding agents such as Claude Code, Codex and Cursor: write specs, test first, review diffs and keep control of the codebase.", "ทำงานกับ Coding Agent เช่น Claude Code, Codex และ Cursor เขียนสเปก ทดสอบก่อน ตรวจ Diff และควบคุมโค้ดเบสได้เสมอ"),
      tools: ["Claude Code", "Codex", "Cursor", "GitHub"] },
    { code: "EXM210", track: "exam", level: 2, hours: 30,
      title: L("COMPAS-PY1 Preparation (Python)", "เตรียมสอบ COMPAS-PY1 (Python)"),
      text: L("Python problem solving for the COMPAS-PY1 exam, aiming for the AWARD of EXCELLENCE.", "ฝึกแก้โจทย์ Python สำหรับการสอบ COMPAS-PY1 โดยมุ่งสู่รางวัล AWARD of EXCELLENCE"),
      tools: ["Python", "Timed mocks", "Plan·Edge·Trace·Test"] },
    { code: "EXM220", track: "exam", level: 2, hours: 30,
      title: L("COMPAS-CPP1 Preparation (C++)", "เตรียมสอบ COMPAS-CPP1 (C++)"),
      text: L("C++ problem solving for the COMPAS-CPP1 exam, aiming for the AWARD of EXCELLENCE.", "ฝึกแก้โจทย์ C++ สำหรับการสอบ COMPAS-CPP1 โดยมุ่งสู่รางวัล AWARD of EXCELLENCE"),
      tools: ["C++", "Timed mocks", "Plan·Edge·Trace·Test"] },
    // Advanced
    { code: "APP330", track: "apple", level: 3, hours: 36,
      title: L("Ship Apps for iPhone, iPad & Mac", "สร้างและเผยแพร่แอปบน iPhone, iPad และ Mac"),
      text: L("One SwiftUI codebase across Apple devices, then TestFlight, App Store review, privacy details and launch.", "โค้ด SwiftUI ชุดเดียวใช้ได้ทุกอุปกรณ์ Apple ต่อด้วย TestFlight การรีวิวของ App Store ข้อมูลความเป็นส่วนตัว และการเปิดตัว"),
      tools: ["SwiftUI", "Xcode", "TestFlight", "App Store Connect"] },
    { code: "EDG320", track: "edge", level: 3, hours: 36,
      title: L("Generative AI at the Edge: Jetson Orin Nano", "Generative AI บนอุปกรณ์ปลายทาง: Jetson Orin Nano"),
      text: L("Run small language and vision-language models locally on the Jetson Orin Nano Developer Kit for private, offline assistants and robots.", "รันโมเดลภาษาและโมเดลภาพ-ภาษาขนาดเล็กบน Jetson Orin Nano Developer Kit สำหรับผู้ช่วยและหุ่นยนต์ที่ทำงานออฟไลน์และเป็นส่วนตัว"),
      tools: ["Jetson Orin Nano", "JetPack", "TensorRT", "llama.cpp"] },
    { code: "NV330", track: "ai", level: 3, hours: 30,
      title: L("Enterprise GenAI with NVIDIA NIM & NeMo", "Generative AI ระดับองค์กรด้วย NVIDIA NIM และ NeMo"),
      text: L("Deploy models as NIM microservices, build retrieval-augmented assistants and add guardrails with NeMo.", "นำโมเดลขึ้นใช้งานเป็น NIM Microservice สร้างผู้ช่วยแบบ RAG และเพิ่มการควบคุมความปลอดภัยด้วย NeMo Guardrails"),
      tools: ["NIM", "NeMo", "TensorRT-LLM", "RAG"] },
    { code: "NV340", track: "edge", level: 3, hours: 30,
      title: L("Robot Simulation with NVIDIA Isaac", "จำลองหุ่นยนต์ด้วย NVIDIA Isaac"),
      text: L("Train and test robots in Isaac Sim, generate synthetic data, then move to real hardware with Isaac ROS.", "ฝึกและทดสอบหุ่นยนต์ใน Isaac Sim สร้างข้อมูลสังเคราะห์ แล้วย้ายสู่ฮาร์ดแวร์จริงด้วย Isaac ROS"),
      tools: ["Isaac Sim", "Isaac ROS", "Omniverse", "ROS 2"] },
    { code: "ACE330", track: "aieng", level: 3, hours: 30,
      title: L("AI Co-Engineering III: Production Software with AI Agents", "AI Co-Engineering 3: ซอฟต์แวร์ระดับใช้งานจริงด้วย AI Agent"),
      text: L("Lead multi-agent development: architecture, MCP tool integration, security, licensing, evaluation and cost control.", "นำทีมพัฒนาด้วย AI หลาย Agent ทั้งสถาปัตยกรรม การเชื่อมเครื่องมือผ่าน MCP ความปลอดภัย ลิขสิทธิ์ การประเมินผล และการคุมต้นทุน"),
      tools: ["Claude Code", "Codex", "MCP", "CI/CD"] }
  ];
  Array.prototype.push.apply(D.courses, add);
  // keep the catalogue ordered by level, then track order
  var order = D.tracks.map(function (t) { return t.id; });
  D.courses.sort(function (a, b) { return (a.anyLevel ? 0 : a.level) - (b.anyLevel ? 0 : b.level) || order.indexOf(a.track) - order.indexOf(b.track); });

  /* WEB220 now focuses on the back end; React moved to WEB230 */
  D.courses.forEach(function (c) {
    if (c.code === "WEB220") {
      c.title = L("Full-Stack Web: APIs, Auth & Databases", "เว็บ Full-Stack: API ระบบยืนยันตัวตน และฐานข้อมูล");
      c.text = L("Node.js, REST APIs, authentication and PostgreSQL behind a modern front end, deployed to the cloud.", "Node.js, REST API ระบบยืนยันตัวตน และ PostgreSQL เบื้องหลังหน้าเว็บสมัยใหม่ พร้อมนำขึ้นคลาวด์");
      c.tools = ["Node.js", "TypeScript", "PostgreSQL", "Docker"];
    }
    if (c.code === "EDG310") c.title = L("Edge AI with NVIDIA Jetson Orin", "Edge AI ด้วย NVIDIA Jetson Orin");
  });

  function m(list) { return list.map(function (x) { return L(x[0], x[1]); }); }
  var EXAM_METHOD = ["The Plan · Edge · Trace · Test method", "วิธี Plan · Edge · Trace · Test"];

  var det = {
    GIT110: { modes: ALL,
      modules: m([["Why version control", "ทำไมต้องควบคุมเวอร์ชัน"], ["Commits, history & undo", "Commit ประวัติ และการย้อนกลับ"], ["Branches & merging", "Branch และการรวมงาน"], ["GitHub, pull requests & reviews", "GitHub, Pull Request และการรีวิว"], ["Fixing merge conflicts", "แก้ Merge Conflict"], ["Publishing a project", "เผยแพร่โปรเจกต์"]]),
      outcomes: m([["Never lose work again", "ไม่ทำงานหายอีกต่อไป"], ["Collaborate in a team repository", "ทำงานร่วมกันใน Repository ของทีม"], ["Show your work on GitHub", "แสดงผลงานบน GitHub"]]),
      prereq: L("Basic computer skills", "ใช้คอมพิวเตอร์ขั้นพื้นฐานได้"),
      project: L("A team project with branches and reviewed pull requests", "โปรเจกต์ทีมที่มี Branch และ Pull Request ที่ผ่านการรีวิว") },
    SWP100: { modes: ALL,
      modules: m([["Commands & sequences", "คำสั่งและลำดับขั้น"], ["Loops & functions", "การวนซ้ำและฟังก์ชัน"], ["Conditions & variables", "เงื่อนไขและตัวแปร"], ["Debugging puzzles", "แก้ปริศนาบั๊ก"], ["My first app screen", "หน้าจอแอปแรกของฉัน"], ["Show & tell", "นำเสนอผลงาน"]]),
      outcomes: m([["Think in steps and patterns", "คิดเป็นขั้นตอนและรูปแบบ"], ["Read and write simple Swift", "อ่านและเขียน Swift อย่างง่าย"], ["Build confidence to continue to SWF110", "มั่นใจพอจะเรียนต่อ SWF110"]]),
      prereq: L("None, ages 8+, iPad or Mac", "ไม่ต้องมีพื้นฐาน อายุ 8 ปีขึ้นไป ใช้ iPad หรือ Mac"),
      project: L("A tiny interactive app", "แอปโต้ตอบขนาดเล็ก") },
    ACE110: { modes: ALL,
      modules: m([["How AI coding assistants work — and fail", "ผู้ช่วยเขียนโค้ด AI ทำงานและผิดพลาดอย่างไร"], ["Describing what you want clearly", "อธิบายสิ่งที่ต้องการให้ชัดเจน"], ["Reading and checking generated code", "อ่านและตรวจโค้ดที่ AI สร้าง"], ["Git as your safety net", "ใช้ Git เป็นตาข่ายนิรภัย"], ["Small tests, small steps", "ทดสอบทีละน้อย ก้าวทีละขั้น"], ["Honesty, privacy & licences", "ความซื่อตรง ความเป็นส่วนตัว และลิขสิทธิ์"]]),
      outcomes: m([["Build a working app with AI help", "สร้างแอปที่ใช้งานได้ด้วยความช่วยเหลือของ AI"], ["Explain every line you ship", "อธิบายได้ทุกบรรทัดที่ส่งมอบ"], ["Spot wrong or unsafe AI output", "จับผิดผลลัพธ์ AI ที่ผิดหรือไม่ปลอดภัย"]]),
      prereq: L("PY101 or WEB101 recommended", "แนะนำให้ผ่าน PY101 หรือ WEB101"),
      project: L("A small web or Python app, with a short report on what the AI got wrong", "เว็บหรือแอป Python ขนาดเล็ก พร้อมรายงานสั้น ๆ ว่า AI ผิดพลาดตรงไหน") },
    EXM110: { modes: ALL,
      modules: m([["Exam format & categories", "รูปแบบข้อสอบและประเภทการแข่งขัน"], ["Python data types & operators", "ชนิดข้อมูลและตัวดำเนินการ Python"], ["Functions & built-ins", "ฟังก์ชันและฟังก์ชันในตัว"], ["Reading code: predict the output", "อ่านโค้ดแล้วทายผลลัพธ์"], EXAM_METHOD, ["Timed mock papers & review", "ข้อสอบจำลองจับเวลาและทบทวน"]]),
      outcomes: m([["Read Python quickly and accurately", "อ่าน Python ได้เร็วและแม่นยำ"], ["Manage time under exam pressure", "บริหารเวลาภายใต้ความกดดัน"], ["Avoid the classic traps", "หลีกเลี่ยงกับดักที่พบบ่อย"]]),
      prereq: L("PY101 or equivalent", "PY101 หรือเทียบเท่า"),
      project: L("Three full timed mocks with feedback", "ข้อสอบจำลองเต็มรูปแบบ 3 ชุด พร้อมคำแนะนำ") },
    WEB230: { modes: ALL,
      modules: m([["Modern JavaScript & TypeScript", "JavaScript สมัยใหม่และ TypeScript"], ["React components & state", "Component และ State ของ React"], ["Hooks & data fetching", "Hooks และการดึงข้อมูล"], ["Next.js routing & server rendering", "Routing และ Server Rendering ของ Next.js"], ["Tailwind CSS & accessible UI", "Tailwind CSS และ UI ที่ทุกคนเข้าถึงได้"], ["Testing & deployment", "การทดสอบและการนำขึ้นใช้งาน"]]),
      outcomes: m([["Build a production-style React app", "สร้างแอป React แบบใช้งานจริง"], ["Choose between client and server rendering", "เลือกใช้ Client หรือ Server Rendering ได้เหมาะสม"], ["Deploy and monitor a site", "นำเว็บขึ้นใช้งานและติดตามผล"]]),
      prereq: L("WEB101", "WEB101"),
      project: L("A deployed Next.js app with real users", "แอป Next.js ที่ใช้งานจริงและมีผู้ใช้จริง") },
    EDG220: { modes: LAB,
      modules: m([["Raspberry Pi 5 & OS setup", "ติดตั้ง Raspberry Pi 5 และระบบปฏิบัติการ"], ["Cameras with Picamera2", "กล้องด้วย Picamera2"], ["AI HAT+ accelerator", "ตัวเร่ง AI HAT+"], ["Detection & pose models", "โมเดลตรวจจับวัตถุและท่าทาง"], ["Collecting your own dataset", "เก็บชุดข้อมูลของตัวเอง"], ["A smart-camera mini project", "มินิโปรเจกต์กล้องอัจฉริยะ"]]),
      outcomes: m([["Run vision AI in real time on a Pi", "รัน Vision AI แบบเรียลไทม์บน Pi"], ["Train and deploy a custom detector", "เทรนและติดตั้งตัวตรวจจับของตัวเอง"], ["Measure speed and accuracy", "วัดความเร็วและความแม่นยำ"]]),
      prereq: L("PY101; RPI210 helpful", "PY101 และควรผ่าน RPI210"),
      project: L("A smart camera that solves a real problem", "กล้องอัจฉริยะที่แก้ปัญหาจริง") },
    ARQ230: { modes: LAB,
      modules: m([["Two brains: MPU + MCU", "สองสมอง: MPU และ MCU"], ["Arduino App Lab & Linux side", "Arduino App Lab และฝั่ง Linux"], ["Real-time control with Zephyr", "ควบคุมแบบเรียลไทม์ด้วย Zephyr"], ["Bridging Python and sketches", "เชื่อม Python กับ Sketch"], ["On-board AI for vision and audio", "AI บนบอร์ดสำหรับภาพและเสียง"], ["Motors & robotics with VENTUNO Q", "มอเตอร์และหุ่นยนต์ด้วย VENTUNO Q"]]),
      outcomes: m([["Split work between AI and real-time control", "แบ่งงานระหว่าง AI กับการควบคุมเรียลไทม์"], ["Build an AI-driven device", "สร้างอุปกรณ์ที่ขับเคลื่อนด้วย AI"], ["Pick the right board for a project", "เลือกบอร์ดให้เหมาะกับโปรเจกต์"]]),
      prereq: L("ARD101 and PY101", "ARD101 และ PY101"),
      project: L("An AI device or small robot", "อุปกรณ์ AI หรือหุ่นยนต์ขนาดเล็ก") },
    NV210: { modes: ALL,
      modules: m([["Why GPUs are fast", "ทำไม GPU จึงเร็ว"], ["cuDF: dataframes on the GPU", "cuDF: DataFrame บน GPU"], ["cuML: machine learning on the GPU", "cuML: Machine Learning บน GPU"], ["PyTorch on CUDA & mixed precision", "PyTorch บน CUDA และ Mixed Precision"], ["Profiling & cost", "วัดประสิทธิภาพและต้นทุน"], ["A speed-up case study", "กรณีศึกษาการเร่งความเร็ว"]]),
      outcomes: m([["Accelerate a real data pipeline", "เร่งความเร็ว Data Pipeline จริง"], ["Know when a GPU helps — and when not", "รู้ว่าเมื่อไหร่ GPU ช่วยได้และเมื่อไหร่ไม่ช่วย"], ["Report speed-ups honestly", "รายงานผลการเร่งความเร็วอย่างตรงไปตรงมา"]]),
      prereq: L("DS210 or ML220", "DS210 หรือ ML220"),
      project: L("A GPU-accelerated analysis with before/after benchmarks", "งานวิเคราะห์ที่เร่งด้วย GPU พร้อมผลเปรียบเทียบก่อนและหลัง") },
    ACE220: { modes: ALL,
      modules: m([["Agents vs. autocomplete", "Agent ต่างจาก Autocomplete อย่างไร"], ["Writing specs and task briefs", "เขียนสเปกและคำสั่งงาน"], ["Tests first, then generate", "เขียนเทสต์ก่อน แล้วค่อยให้ AI สร้าง"], ["Reviewing diffs like a senior engineer", "ตรวจ Diff แบบวิศวกรอาวุโส"], ["Project rules & context files", "กฎของโปรเจกต์และไฟล์บริบท"], ["Debugging with an agent", "แก้บั๊กร่วมกับ Agent"]]),
      outcomes: m([["Deliver features faster without losing quality", "ส่งมอบฟีเจอร์ได้เร็วขึ้นโดยไม่เสียคุณภาพ"], ["Keep a clean, tested codebase", "รักษาโค้ดเบสให้สะอาดและผ่านการทดสอบ"], ["Compare tools on real tasks", "เปรียบเทียบเครื่องมือจากงานจริง"]]),
      prereq: L("ACE110 and GIT110", "ACE110 และ GIT110"),
      project: L("A multi-feature app built with an agent, fully tested", "แอปหลายฟีเจอร์ที่สร้างร่วมกับ Agent และผ่านการทดสอบครบ") },
    EXM210: { modes: ALL,
      modules: m([["Exam format, scoring & timing", "รูปแบบข้อสอบ การให้คะแนน และเวลา"], ["Core Python: strings, lists, dicts", "Python แกนหลัก: String, List, Dict"], ["Loops, functions & recursion", "การวนซ้ำ ฟังก์ชัน และ Recursion"], ["Common problem patterns", "รูปแบบโจทย์ที่พบบ่อย"], EXAM_METHOD, ["Timed mocks & error review", "ข้อสอบจำลองจับเวลาและวิเคราะห์จุดพลาด"]]),
      outcomes: m([["Solve exam problems accurately on time", "แก้โจทย์ได้แม่นยำทันเวลา"], ["Catch edge cases before the grader does", "เจอ Edge Case ก่อนระบบตรวจ"], ["Aim for the AWARD of EXCELLENCE", "มุ่งสู่รางวัล AWARD of EXCELLENCE"]]),
      prereq: L("PY101 or equivalent", "PY101 หรือเทียบเท่า"),
      project: L("Full timed mocks with a personal error log", "ข้อสอบจำลองเต็มรูปแบบพร้อมบันทึกจุดพลาดส่วนตัว") },
    EXM220: { modes: ALL,
      modules: m([["Exam format, scoring & timing", "รูปแบบข้อสอบ การให้คะแนน และเวลา"], ["C++ I/O, types & control flow", "Input/Output ชนิดข้อมูล และโครงสร้างควบคุมของ C++"], ["Arrays, strings & functions", "Array, String และฟังก์ชัน"], ["STL essentials", "STL ที่จำเป็น"], EXAM_METHOD, ["Timed mocks & error review", "ข้อสอบจำลองจับเวลาและวิเคราะห์จุดพลาด"]]),
      outcomes: m([["Write correct C++ under time pressure", "เขียน C++ ให้ถูกต้องภายใต้เวลาจำกัด"], ["Avoid overflow and off-by-one errors", "หลีกเลี่ยง Overflow และ Off-by-one"], ["Aim for the AWARD of EXCELLENCE", "มุ่งสู่รางวัล AWARD of EXCELLENCE"]]),
      prereq: L("CPP220 or equivalent", "CPP220 หรือเทียบเท่า"),
      project: L("Full timed mocks with a personal error log", "ข้อสอบจำลองเต็มรูปแบบพร้อมบันทึกจุดพลาดส่วนตัว") },
    APP330: { modes: ALL,
      modules: m([["Multiplatform SwiftUI", "SwiftUI ข้ามแพลตฟอร์ม"], ["Data, sync & offline", "ข้อมูล การซิงก์ และการทำงานออฟไลน์"], ["Design, accessibility & localisation (TH/EN)", "การออกแบบ การเข้าถึง และการรองรับภาษาไทย/อังกฤษ"], ["TestFlight & user feedback", "TestFlight และความคิดเห็นผู้ใช้"], ["App Store review, privacy & pricing", "การรีวิวของ App Store ความเป็นส่วนตัว และการตั้งราคา"], ["Launch & analytics", "การเปิดตัวและการวัดผล"]]),
      outcomes: m([["Publish an app on the App Store", "เผยแพร่แอปบน App Store"], ["Support iPhone, iPad and Mac from one codebase", "รองรับ iPhone, iPad และ Mac จากโค้ดชุดเดียว"], ["Handle review and privacy requirements", "ผ่านข้อกำหนดการรีวิวและความเป็นส่วนตัว"]]),
      prereq: L("IOS220", "IOS220"),
      project: L("An app submitted to the App Store", "แอปที่ส่งขึ้น App Store") },
    EDG320: { modes: LAB,
      modules: m([["Jetson Orin Nano & JetPack setup", "ติดตั้ง Jetson Orin Nano และ JetPack"], ["Small LLMs on the edge", "LLM ขนาดเล็กบนอุปกรณ์ปลายทาง"], ["Vision-language models", "Vision-Language Model"], ["Speech in, speech out", "รับเสียงและตอบด้วยเสียง"], ["Optimising with TensorRT & quantisation", "เร่งความเร็วด้วย TensorRT และ Quantization"], ["Power, heat & reliability", "พลังงาน ความร้อน และความเสถียร"]]),
      outcomes: m([["Run generative AI fully offline", "รัน Generative AI แบบออฟไลน์ทั้งหมด"], ["Balance speed, memory and accuracy", "สมดุลความเร็ว หน่วยความจำ และความแม่นยำ"], ["Build a private on-device assistant", "สร้างผู้ช่วยบนอุปกรณ์ที่เป็นส่วนตัว"]]),
      prereq: L("EDG310 or DL310", "EDG310 หรือ DL310"),
      project: L("An offline voice or vision assistant on Jetson", "ผู้ช่วยด้วยเสียงหรือภาพแบบออฟไลน์บน Jetson") },
    NV330: { modes: ALL,
      modules: m([["GenAI architecture for organisations", "สถาปัตยกรรม GenAI สำหรับองค์กร"], ["Serving models with NIM", "ให้บริการโมเดลด้วย NIM"], ["Retrieval-augmented generation", "Retrieval-Augmented Generation"], ["Customising with NeMo", "ปรับแต่งโมเดลด้วย NeMo"], ["Guardrails & evaluation", "Guardrails และการประเมินผล"], ["Cost, latency & privacy", "ต้นทุน ความหน่วง และความเป็นส่วนตัว"]]),
      outcomes: m([["Deploy a secure GenAI service", "นำบริการ GenAI ที่ปลอดภัยขึ้นใช้งาน"], ["Ground answers in your own documents", "ให้คำตอบอ้างอิงเอกสารของคุณเอง"], ["Measure quality before launch", "วัดคุณภาพก่อนเปิดใช้งาน"]]),
      prereq: L("NLP330 or MLO350", "NLP330 หรือ MLO350"),
      project: L("A guarded RAG assistant for a real organisation", "ผู้ช่วย RAG ที่มี Guardrails สำหรับองค์กรจริง") },
    NV340: { modes: LAB,
      modules: m([["Robots in simulation", "หุ่นยนต์ในโลกจำลอง"], ["Isaac Sim scenes & sensors", "ฉากและเซนเซอร์ใน Isaac Sim"], ["Synthetic data generation", "การสร้างข้อมูลสังเคราะห์"], ["Learning-based control", "การควบคุมด้วยการเรียนรู้"], ["Isaac ROS on Jetson", "Isaac ROS บน Jetson"], ["Sim-to-real transfer", "ย้ายจากโลกจำลองสู่โลกจริง"]]),
      outcomes: m([["Test robots safely before building", "ทดสอบหุ่นยนต์อย่างปลอดภัยก่อนสร้างจริง"], ["Create training data at scale", "สร้างข้อมูลฝึกได้จำนวนมาก"], ["Deploy perception to real robots", "นำระบบรับรู้ไปใช้กับหุ่นยนต์จริง"]]),
      prereq: L("ROB330", "ROB330"),
      project: L("A simulated-then-real robot task", "งานหุ่นยนต์ที่ทดสอบในโลกจำลองแล้วทำจริง") },
    ACE330: { modes: ALL,
      modules: m([["Architecture before prompts", "ออกแบบสถาปัตยกรรมก่อนเขียนพรอมต์"], ["Multi-agent workflows", "เวิร์กโฟลว์หลาย Agent"], ["Connecting tools with MCP", "เชื่อมเครื่องมือด้วย MCP"], ["Security, secrets & supply chain", "ความปลอดภัย ข้อมูลลับ และห่วงโซ่ซอฟต์แวร์"], ["Licences & intellectual property", "สัญญาอนุญาตและทรัพย์สินทางปัญญา"], ["Evaluating agents & controlling cost", "ประเมิน Agent และควบคุมต้นทุน"]]),
      outcomes: m([["Lead an AI-assisted engineering team", "นำทีมวิศวกรรมที่ทำงานร่วมกับ AI"], ["Ship secure, maintainable software", "ส่งมอบซอฟต์แวร์ที่ปลอดภัยและดูแลง่าย"], ["Set team rules for responsible AI use", "วางกฎทีมเพื่อการใช้ AI อย่างรับผิดชอบ"]]),
      prereq: L("ACE220 and a back-end course", "ACE220 และหลักสูตรด้าน Back-end"),
      project: L("A production-ready product with an engineering report", "ผลิตภัณฑ์พร้อมใช้งานจริงและรายงานทางวิศวกรรม") }
  };
  Object.keys(det).forEach(function (k) { D.details[k] = det[k]; });
})();
