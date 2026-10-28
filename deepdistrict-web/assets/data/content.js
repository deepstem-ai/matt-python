/* ==========================================================================
   DeepDistrict.si — bilingual site content (English / Thai)
   --------------------------------------------------------------------------
   Every text is an object { en: "...", th: "..." }. Pages render both and the
   language switch shows one. Plain JS (not JSON) so the site works from disk.
   Course hours and plans are indicative and can be adjusted per cohort.
   ========================================================================== */

window.DD_CONTENT = {

  /* ------------------------------------------------------------ Learning levels */
  levels: [
    {
      id: 1, short: { en: "Foundation", th: "พื้นฐาน" },
      tag: { en: "Age 10+ · no experience needed", th: "อายุ 10 ปีขึ้นไป · ไม่ต้องมีพื้นฐาน" },
      text: {
        en: "Computational thinking, first programs in Python, electronics with Arduino, and the maths and ethics every AI learner needs.",
        th: "ฝึกการคิดเชิงคำนวณ เขียนโปรแกรมแรกด้วย Python เรียนรู้อิเล็กทรอนิกส์กับ Arduino พร้อมคณิตศาสตร์และจริยธรรมที่ผู้เรียน AI ทุกคนต้องมี"
      },
      outcome: { en: "You can write programs, build circuits and explain how AI works.", th: "เขียนโปรแกรม สร้างวงจร และอธิบายได้ว่า AI ทำงานอย่างไร" }
    },
    {
      id: 2, short: { en: "Intermediate", th: "ระดับกลาง" },
      tag: { en: "After Foundation or equivalent", th: "ต่อจากระดับพื้นฐานหรือเทียบเท่า" },
      text: {
        en: "Data structures and algorithms, object-oriented programming in Java and C++, web development, data science, machine learning and native apps with Swift.",
        th: "โครงสร้างข้อมูลและอัลกอริทึม การเขียนโปรแกรมเชิงวัตถุด้วย Java และ C++ การพัฒนาเว็บ วิทยาการข้อมูล Machine Learning และแอปเนทีฟด้วย Swift"
      },
      outcome: { en: "You can build complete apps and train your first ML models.", th: "สร้างแอปที่ใช้งานได้ครบถ้วน และฝึกโมเดล Machine Learning ของตัวเองได้" }
    },
    {
      id: 3, short: { en: "Advanced", th: "ระดับสูง" },
      tag: { en: "Solid programming and maths", th: "มีทักษะโปรแกรมและคณิตศาสตร์ที่มั่นคง" },
      text: {
        en: "Deep learning, computer vision, large language models, GPU computing with CUDA, and deploying AI at the edge on NVIDIA Jetson.",
        th: "Deep Learning, Computer Vision, โมเดลภาษาขนาดใหญ่ (LLM), การประมวลผล GPU ด้วย CUDA และการนำ AI ไปใช้งานจริงบนอุปกรณ์ Edge อย่าง NVIDIA Jetson"
      },
      outcome: { en: "You can design, optimise and deploy real AI systems.", th: "ออกแบบ ปรับแต่ง และนำระบบ AI ไปใช้งานจริงได้" }
    },
    {
      id: 4, short: { en: "Research & SI", th: "วิจัยและ SI" },
      tag: { en: "By application · with a mentor", th: "คัดเลือกโดยการสมัคร · มีอาจารย์ที่ปรึกษา" },
      text: {
        en: "Original research with a mentor: AI agents and reasoning, safety and evaluation, and domain projects that end in a paper, a competition entry or a product.",
        th: "ทำวิจัยต้นฉบับร่วมกับอาจารย์ที่ปรึกษา ทั้ง AI Agent และการให้เหตุผล ความปลอดภัยและการประเมินโมเดล ตลอดจนโครงงานเฉพาะสาขา ที่จบด้วยบทความวิจัย ผลงานแข่งขัน หรือผลิตภัณฑ์จริง"
      },
      outcome: { en: "You contribute new knowledge and present it to the world.", th: "สร้างองค์ความรู้ใหม่ และนำเสนอผลงานสู่เวทีโลก" }
    }
  ],

  /* ------------------------------------------------------------ Tracks */
  tracks: [
    { id: "code", icon: "code", name: { en: "Programming Core", th: "การเขียนโปรแกรมแกนหลัก" },
      text: { en: "Python, C/C++, Java and algorithms: the problem-solving skills every other track builds on.", th: "Python, C/C++, Java และอัลกอริทึม ทักษะการแก้ปัญหาที่เป็นรากฐานของทุกเส้นทาง" },
      tech: ["Python", "C/C++", "Java", "Algorithms"] },
    { id: "web", icon: "web", name: { en: "Web & Cloud Apps", th: "เว็บและแอปบนคลาวด์" },
      text: { en: "From HTML, CSS and JavaScript to full-stack web apps with AI features, deployed to the cloud.", th: "ตั้งแต่ HTML, CSS และ JavaScript ไปจนถึงเว็บแอป Full-Stack ที่มีฟีเจอร์ AI และนำขึ้นคลาวด์ได้จริง" },
      tech: ["HTML/CSS", "JavaScript", "React", "Node.js"] },
    { id: "apple", icon: "device", name: { en: "Apple Platforms", th: "แพลตฟอร์ม Apple" },
      text: { en: "Swift, SwiftUI and Core ML for native iPhone and iPad apps, and preparation for the Swift Student Challenge.", th: "Swift, SwiftUI และ Core ML สำหรับแอปเนทีฟบน iPhone และ iPad พร้อมเตรียมความพร้อมสู่ Swift Student Challenge" },
      tech: ["Swift", "SwiftUI", "Xcode", "Core ML"] },
    { id: "ai", icon: "spark", name: { en: "AI, Data & SI", th: "AI ข้อมูล และ SI" },
      text: { en: "Data science, machine learning, deep learning, LLMs and agents: the full road from AI towards SI.", th: "วิทยาการข้อมูล Machine Learning, Deep Learning, LLM และ AI Agent เส้นทางครบวงจรจาก AI สู่ SI" },
      tech: ["PyTorch", "scikit-learn", "LLMs", "Agents"] },
    { id: "edge", icon: "chip", name: { en: "Edge AI & Hardware", th: "Edge AI และฮาร์ดแวร์" },
      text: { en: "Arduino, Raspberry Pi and NVIDIA Jetson: put intelligence into real devices, robots and sensors.", th: "Arduino, Raspberry Pi และ NVIDIA Jetson นำความฉลาดไปไว้ในอุปกรณ์ หุ่นยนต์ และเซนเซอร์จริง" },
      tech: ["Arduino", "Raspberry Pi", "Jetson", "CUDA"] },
    { id: "research", icon: "microscope", name: { en: "Research Skills", th: "ทักษะการวิจัย" },
      text: { en: "Scientific method, literature review, writing, presentation, publication and competitions.", th: "กระบวนการทางวิทยาศาสตร์ การทบทวนวรรณกรรม การเขียน การนำเสนอ การตีพิมพ์ และการแข่งขัน" },
      tech: ["Methodology", "LaTeX", "Posters", "Peer review"] }
  ],

  /* ------------------------------------------------------------ Course catalogue
     level: 1 Foundation · 2 Intermediate · 3 Advanced · 4 Research & SI
     hours: number of contact hours (indicative), or a text duration         */
  courses: [
    // Foundation
    { code: "CT100", track: "code", level: 1, hours: 18,
      title: { en: "Computational Thinking & Problem Solving", th: "การคิดเชิงคำนวณและการแก้ปัญหา" },
      text: { en: "Decomposition, patterns, abstraction and algorithms, from unplugged activities to block coding.", th: "การแยกย่อยปัญหา การหารูปแบบ การคิดเชิงนามธรรม และการออกแบบอัลกอริทึม ตั้งแต่กิจกรรมไม่ใช้คอมพิวเตอร์จนถึงการเขียนโค้ดแบบบล็อก" },
      tools: ["Scratch", "Flowcharts"] },
    { code: "PY101", track: "code", level: 1, hours: 30,
      title: { en: "Python Programming Fundamentals", th: "พื้นฐานการเขียนโปรแกรม Python" },
      text: { en: "Variables, conditions, loops, functions, lists and files, learned through games and small data projects.", th: "ตัวแปร เงื่อนไข ลูป ฟังก์ชัน ลิสต์ และไฟล์ เรียนผ่านเกมและโปรเจกต์ข้อมูลขนาดเล็ก" },
      tools: ["Python 3", "Jupyter", "VS Code"] },
    { code: "WEB101", track: "web", level: 1, hours: 30,
      title: { en: "Web Foundations: HTML, CSS & JavaScript", th: "พื้นฐานเว็บ: HTML, CSS และ JavaScript" },
      text: { en: "Build and publish responsive, accessible web pages, and add interactivity with JavaScript.", th: "สร้างและเผยแพร่เว็บเพจที่แสดงผลได้ทุกหน้าจอและทุกคนเข้าถึงได้ พร้อมเพิ่มการโต้ตอบด้วย JavaScript" },
      tools: ["HTML5", "CSS3", "JavaScript", "Git"] },
    { code: "SWF110", track: "apple", level: 1, hours: 24,
      title: { en: "Swift & App Playgrounds", th: "Swift และ App Playgrounds" },
      text: { en: "Learn Swift through interactive app playgrounds on iPad or Mac: the first step towards the Swift Student Challenge.", th: "เรียนภาษา Swift ผ่าน App Playground แบบโต้ตอบบน iPad หรือ Mac ก้าวแรกสู่ Swift Student Challenge" },
      tools: ["Swift", "Swift Playgrounds"] },
    { code: "AI100", track: "ai", level: 1, hours: 12,
      title: { en: "AI Literacy & Ethics", th: "ความรู้เท่าทัน AI และจริยธรรม" },
      text: { en: "How AI works, what it can and cannot do, and how to use AI tools responsibly: bias, privacy and academic integrity.", th: "AI ทำงานอย่างไร ทำอะไรได้และไม่ได้ และการใช้เครื่องมือ AI อย่างรับผิดชอบ ทั้งเรื่องอคติ ความเป็นส่วนตัว และความซื่อสัตย์ทางวิชาการ" },
      tools: ["Teachable Machine", "Case studies"] },
    { code: "MTH110", track: "ai", level: 1, hours: 24,
      title: { en: "Maths for AI: The Foundations", th: "คณิตศาสตร์พื้นฐานสำหรับ AI" },
      text: { en: "Functions, vectors, probability and statistics, explained visually and coded in Python.", th: "ฟังก์ชัน เวกเตอร์ ความน่าจะเป็น และสถิติ อธิบายด้วยภาพและลงมือเขียนโค้ดด้วย Python" },
      tools: ["Python", "NumPy", "Desmos"] },
    { code: "ARD101", track: "edge", level: 1, hours: 24,
      title: { en: "Electronics & Arduino", th: "อิเล็กทรอนิกส์และ Arduino" },
      text: { en: "Circuits, sensors and actuators: read the physical world and control it with code.", th: "วงจร เซนเซอร์ และตัวขับเคลื่อน อ่านค่าจากโลกจริงและควบคุมด้วยโค้ด" },
      tools: ["Arduino UNO R4", "C++", "Sensors"] },
    { code: "RES101", track: "research", level: 1, hours: 16,
      title: { en: "Young Researcher: The Scientific Method", th: "นักวิจัยรุ่นเยาว์: กระบวนการทางวิทยาศาสตร์" },
      text: { en: "Ask testable questions, design fair experiments, record data and present findings as a science project.", th: "ตั้งคำถามที่ทดสอบได้ ออกแบบการทดลองที่ควบคุมตัวแปรอย่างถูกต้อง บันทึกข้อมูล และนำเสนอผลเป็นโครงงานวิทยาศาสตร์" },
      tools: ["Lab notebook", "Spreadsheets"] },

    // Intermediate
    { code: "DSA210", track: "code", level: 2, hours: 36,
      title: { en: "Data Structures & Algorithms", th: "โครงสร้างข้อมูลและอัลกอริทึม" },
      text: { en: "Arrays, linked lists, trees, graphs, sorting, searching and complexity analysis, in Python and C++.", th: "อาร์เรย์ ลิงก์ลิสต์ ทรี กราฟ การเรียงลำดับ การค้นหา และการวิเคราะห์ความซับซ้อน ด้วย Python และ C++" },
      tools: ["Python", "C++", "Big-O"] },
    { code: "CPP220", track: "code", level: 2, hours: 36,
      title: { en: "C/C++ Programming", th: "การเขียนโปรแกรม C/C++" },
      text: { en: "Memory, pointers, object-oriented programming and the STL: fast, reliable code for systems, embedded devices and AI runtimes.", th: "หน่วยความจำ พอยน์เตอร์ การเขียนโปรแกรมเชิงวัตถุ และ STL เขียนโค้ดที่เร็วและเสถียรสำหรับระบบ อุปกรณ์ฝังตัว และรันไทม์ของ AI" },
      tools: ["C17", "C++20", "CMake", "GDB"] },
    { code: "JAV220", track: "code", level: 2, hours: 36,
      title: { en: "Java & Object-Oriented Design", th: "Java และการออกแบบเชิงวัตถุ" },
      text: { en: "Classes, interfaces, design patterns and unit testing, then building REST services with Spring Boot.", th: "คลาส อินเทอร์เฟซ Design Pattern และการทดสอบหน่วย ต่อยอดสู่การสร้าง REST Service ด้วย Spring Boot" },
      tools: ["Java 21", "JUnit", "Spring Boot"] },
    { code: "WEB220", track: "web", level: 2, hours: 36,
      title: { en: "Modern Web Applications", th: "เว็บแอปพลิเคชันสมัยใหม่" },
      text: { en: "TypeScript, React, Node.js, REST APIs, authentication and databases: build and deploy a complete web app.", th: "TypeScript, React, Node.js, REST API ระบบยืนยันตัวตน และฐานข้อมูล สร้างและนำเว็บแอปที่สมบูรณ์ขึ้นใช้งานจริง" },
      tools: ["TypeScript", "React", "Node.js", "PostgreSQL"] },
    { code: "IOS220", track: "apple", level: 2, hours: 36,
      title: { en: "iOS & iPadOS Apps with SwiftUI", th: "พัฒนาแอป iOS และ iPadOS ด้วย SwiftUI" },
      text: { en: "Design and build native apps with SwiftUI, data persistence and networking, then test with real users via TestFlight.", th: "ออกแบบและพัฒนาแอปเนทีฟด้วย SwiftUI การจัดเก็บข้อมูล และการเชื่อมต่อเครือข่าย แล้วทดสอบกับผู้ใช้จริงผ่าน TestFlight" },
      tools: ["SwiftUI", "Xcode", "SwiftData", "TestFlight"] },
    { code: "SSC250", track: "apple", level: 2, hours: 20,
      title: { en: "Swift Student Challenge Studio", th: "สตูดิโอเตรียมแข่ง Swift Student Challenge" },
      text: { en: "From idea to a polished app playground: concept, accessibility, storytelling and Apple's current submission requirements.", th: "จากไอเดียสู่ App Playground ที่สมบูรณ์ ทั้งแนวคิด การเข้าถึงได้ของทุกคน การเล่าเรื่อง และข้อกำหนดการส่งผลงานล่าสุดของ Apple" },
      tools: ["Swift Playgrounds", "Xcode", "SwiftUI"] },
    { code: "DS210", track: "ai", level: 2, hours: 30,
      title: { en: "Data Science with Python", th: "วิทยาการข้อมูลด้วย Python" },
      text: { en: "Collect, clean, analyse and visualise real data sets, and tell clear stories with data.", th: "เก็บ ทำความสะอาด วิเคราะห์ และแสดงผลข้อมูลจริง พร้อมเล่าเรื่องราวจากข้อมูลได้อย่างชัดเจน" },
      tools: ["pandas", "NumPy", "Matplotlib", "SQL"] },
    { code: "ML220", track: "ai", level: 2, hours: 36,
      title: { en: "Machine Learning Fundamentals", th: "พื้นฐาน Machine Learning" },
      text: { en: "Regression, classification, clustering, model evaluation and how to avoid overfitting, with real projects.", th: "Regression, Classification, Clustering การประเมินโมเดล และการป้องกัน Overfitting ผ่านโปรเจกต์จริง" },
      tools: ["scikit-learn", "pandas", "Jupyter"] },
    { code: "RPI210", track: "edge", level: 2, hours: 30,
      title: { en: "Raspberry Pi, IoT & Linux", th: "Raspberry Pi, IoT และ Linux" },
      text: { en: "Linux, Python on hardware, cameras and sensors, networking and live dashboards for connected devices.", th: "Linux การเขียน Python บนฮาร์ดแวร์ กล้องและเซนเซอร์ เครือข่าย และแดชบอร์ดแบบเรียลไทม์สำหรับอุปกรณ์ IoT" },
      tools: ["Raspberry Pi 5", "Linux", "MQTT", "Python"] },
    { code: "RES210", track: "research", level: 2, hours: 24,
      title: { en: "Research Methodology & Literature Review", th: "ระเบียบวิธีวิจัยและการทบทวนวรรณกรรม" },
      text: { en: "Find a research gap, review literature systematically, form hypotheses and design studies, including research ethics.", th: "ค้นหาช่องว่างงานวิจัย ทบทวนวรรณกรรมอย่างเป็นระบบ ตั้งสมมติฐาน และออกแบบการศึกษา รวมถึงจริยธรรมการวิจัย" },
      tools: ["Google Scholar", "Zotero"] },

    // Advanced
    { code: "DL310", track: "ai", level: 3, hours: 42,
      title: { en: "Deep Learning with PyTorch", th: "Deep Learning ด้วย PyTorch" },
      text: { en: "Neural networks, CNNs and transformers, training on GPUs, experiment tracking and reproducible results.", th: "โครงข่ายประสาทเทียม CNN และ Transformer การเทรนบน GPU การติดตามการทดลอง และผลลัพธ์ที่ทำซ้ำได้" },
      tools: ["PyTorch", "CUDA", "TensorBoard"] },
    { code: "CV320", track: "ai", level: 3, hours: 36,
      title: { en: "Computer Vision", th: "คอมพิวเตอร์วิทัศน์ (Computer Vision)" },
      text: { en: "Image classification, object detection and segmentation for real-world and medical images.", th: "การจำแนกภาพ การตรวจจับวัตถุ และการแบ่งส่วนภาพ สำหรับภาพในโลกจริงและภาพทางการแพทย์" },
      tools: ["PyTorch", "OpenCV", "torchvision"] },
    { code: "NLP330", track: "ai", level: 3, hours: 42,
      title: { en: "NLP & Large Language Models", th: "NLP และโมเดลภาษาขนาดใหญ่" },
      text: { en: "Tokenisation, transformers, fine-tuning, retrieval-augmented generation (RAG) and evaluation, including Thai-language models.", th: "Tokenization, Transformer, Fine-tuning, RAG (Retrieval-Augmented Generation) และการประเมินผล รวมถึงโมเดลภาษาไทย" },
      tools: ["Hugging Face", "PyTorch", "Vector DB"] },
    { code: "EDG310", track: "edge", level: 3, hours: 40,
      title: { en: "Edge AI with NVIDIA Jetson", th: "Edge AI ด้วย NVIDIA Jetson" },
      text: { en: "Deploy vision and language models on Jetson Orin devices, optimise them with TensorRT and build video analytics with DeepStream.", th: "นำโมเดลด้านภาพและภาษาไปทำงานบน Jetson Orin เพิ่มความเร็วด้วย TensorRT และสร้างระบบวิเคราะห์วิดีโอด้วย DeepStream" },
      tools: ["JetPack", "TensorRT", "DeepStream", "ONNX"] },
    { code: "GPU320", track: "edge", level: 3, hours: 36,
      title: { en: "GPU Computing with CUDA", th: "การประมวลผลแบบขนานบน GPU ด้วย CUDA" },
      text: { en: "Parallel thinking, CUDA C++ kernels, the memory hierarchy and profiling, to make AI and science code fast.", th: "การคิดแบบขนาน การเขียน CUDA C++ Kernel ลำดับชั้นหน่วยความจำ และการวัดประสิทธิภาพ เพื่อเร่งความเร็วโค้ด AI และงานวิทยาศาสตร์" },
      tools: ["CUDA C++", "Nsight", "cuDNN"] },
    { code: "ROB330", track: "edge", level: 3, hours: 36,
      title: { en: "Robotics & ROS 2", th: "หุ่นยนต์และ ROS 2" },
      text: { en: "Sensors, motion, navigation and perception for robots, connected to edge AI.", th: "เซนเซอร์ การเคลื่อนที่ การนำทาง และการรับรู้ของหุ่นยนต์ เชื่อมต่อกับ Edge AI" },
      tools: ["ROS 2", "Gazebo", "Jetson"] },
    { code: "WEB340", track: "web", level: 3, hours: 36,
      title: { en: "Full-Stack AI Applications", th: "แอปพลิเคชัน AI แบบ Full-Stack" },
      text: { en: "Ship AI-powered web products: model APIs, streaming interfaces, vector search, testing and cloud deployment.", th: "สร้างผลิตภัณฑ์เว็บที่ขับเคลื่อนด้วย AI ทั้ง Model API อินเทอร์เฟซแบบสตรีมมิง Vector Search การทดสอบ และการนำขึ้นคลาวด์" },
      tools: ["Next.js", "FastAPI", "Docker"] },
    { code: "IOS340", track: "apple", level: 3, hours: 30,
      title: { en: "On-Device AI with Core ML", th: "AI บนอุปกรณ์ด้วย Core ML" },
      text: { en: "Train with Create ML or convert PyTorch models, then run vision and language features privately on iPhone and iPad.", th: "เทรนโมเดลด้วย Create ML หรือแปลงโมเดลจาก PyTorch แล้วรันฟีเจอร์ด้านภาพและภาษาบน iPhone และ iPad โดยข้อมูลไม่ต้องออกจากเครื่อง" },
      tools: ["Core ML", "Create ML", "Vision", "coremltools"] },
    { code: "MLO350", track: "ai", level: 3, hours: 30,
      title: { en: "MLOps & Responsible Deployment", th: "MLOps และการนำโมเดลไปใช้อย่างรับผิดชอบ" },
      text: { en: "Versioning, pipelines, monitoring, model cards and data privacy for AI in production.", th: "การจัดการเวอร์ชัน Pipeline การติดตามผล Model Card และความเป็นส่วนตัวของข้อมูล สำหรับ AI ที่ใช้งานจริง" },
      tools: ["Git", "Docker", "MLflow"] },
    { code: "RES320", track: "research", level: 3, hours: 24,
      title: { en: "Academic Writing & Publication", th: "การเขียนบทความวิชาการและการตีพิมพ์" },
      text: { en: "IMRaD structure, figures, citations, LaTeX, choosing journals and conferences, and responding to peer review.", th: "โครงสร้าง IMRaD แผนภาพ การอ้างอิง LaTeX การเลือกวารสารและงานประชุมวิชาการ และการตอบข้อเสนอแนะจากผู้ทรงคุณวุฒิ" },
      tools: ["LaTeX", "Overleaf", "Zotero"] },
    { code: "RES330", track: "research", level: 3, hours: 20,
      title: { en: "Presentation & Competition Lab", th: "การนำเสนอและเตรียมความพร้อมสู่การแข่งขัน" },
      text: { en: "Research posters, oral talks, pitch decks and demo videos, rehearsed against real judging rubrics.", th: "โปสเตอร์วิจัย การบรรยาย Pitch Deck และวิดีโอสาธิต พร้อมซ้อมกับเกณฑ์การตัดสินจริง" },
      tools: ["Keynote", "Figma", "Video"] },

    // Research & SI
    { code: "SI410", track: "ai", level: 4, hours: 40,
      title: { en: "AI Agents, Reasoning & Planning", th: "AI Agent การให้เหตุผล และการวางแผน" },
      text: { en: "Tool use, multi-step reasoning, planning and memory: the building blocks on the road from AI to SI.", th: "การใช้เครื่องมือ การให้เหตุผลหลายขั้นตอน การวางแผน และหน่วยความจำ องค์ประกอบสำคัญบนเส้นทางจาก AI สู่ SI" },
      tools: ["Python", "LLM APIs", "PyTorch"] },
    { code: "SI420", track: "ai", level: 4, hours: 30,
      title: { en: "AI Safety, Alignment & Evaluation", th: "ความปลอดภัย การกำกับ และการประเมิน AI" },
      text: { en: "Benchmarks, red-teaming, interpretability and governance, so that more capable systems remain trustworthy.", th: "Benchmark, Red-teaming, Interpretability และธรรมาภิบาล เพื่อให้ระบบที่เก่งขึ้นยังคงไว้วางใจได้" },
      tools: ["Python", "Eval harnesses"] },
    { code: "SI430", track: "ai", level: 4, hours: 36,
      title: { en: "Multimodal & Scientific AI", th: "AI หลายรูปแบบและ AI เพื่อวิทยาศาสตร์" },
      text: { en: "Models that combine text, images, signals and code to accelerate discovery in science and medicine.", th: "โมเดลที่ผสานข้อความ ภาพ สัญญาณ และโค้ด เพื่อเร่งการค้นพบทางวิทยาศาสตร์และการแพทย์" },
      tools: ["PyTorch", "MONAI", "Hugging Face"] },
    { code: "RES450", track: "research", level: 4, hours: { en: "3–6 months", th: "3–6 เดือน" },
      title: { en: "Research Mentorship Project", th: "โครงการวิจัยภายใต้การดูแลของอาจารย์ที่ปรึกษา" },
      text: { en: "An original project with a mentor, ending in a paper, a competition entry, a thesis or a product prototype.", th: "โครงการวิจัยต้นฉบับร่วมกับอาจารย์ที่ปรึกษา จบด้วยบทความวิจัย ผลงานแข่งขัน วิทยานิพนธ์ หรือต้นแบบผลิตภัณฑ์" },
      tools: ["Your research stack"] }
  ],

  /* ------------------------------------------------------------ Domain learning paths */
  domains: [
    { id: "medical", icon: "health", name: { en: "Medical & Health AI", th: "AI การแพทย์และสุขภาพ" },
      text: { en: "Medical imaging, clinical data and health signals, with patient privacy and research ethics built in.", th: "ภาพทางการแพทย์ ข้อมูลทางคลินิก และสัญญาณชีพ โดยคำนึงถึงความเป็นส่วนตัวของผู้ป่วยและจริยธรรมการวิจัยตั้งแต่ต้น" },
      path: ["PY101", "DS210", "ML220", "DL310", "CV320", "SI430", "RES450"],
      projects: { en: "X-ray classification · skin-lesion screening · ECG arrhythmia detection", th: "จำแนกภาพเอกซเรย์ · คัดกรองรอยโรคผิวหนัง · ตรวจจับภาวะหัวใจเต้นผิดจังหวะจาก ECG" } },
    { id: "bioeng", icon: "dna", name: { en: "Biomedical Engineering", th: "วิศวกรรมชีวการแพทย์" },
      text: { en: "Biosensors, wearables and assistive devices, from signal acquisition to embedded AI.", th: "ไบโอเซนเซอร์ อุปกรณ์สวมใส่ และอุปกรณ์ช่วยเหลือผู้ป่วย ตั้งแต่การวัดสัญญาณจนถึง AI บนอุปกรณ์ฝังตัว" },
      path: ["ARD101", "CPP220", "RPI210", "DS210", "EDG310", "RES450"],
      projects: { en: "EMG-controlled prosthetic hand · fall-detection wearable · low-cost pulse oximeter", th: "มือเทียมควบคุมด้วยสัญญาณ EMG · อุปกรณ์สวมใส่ตรวจจับการหกล้ม · เครื่องวัดออกซิเจนในเลือดราคาประหยัด" } },
    { id: "business", icon: "briefcase", name: { en: "Business & Entrepreneurship", th: "ธุรกิจและการเป็นผู้ประกอบการ" },
      text: { en: "Data-driven decisions, AI strategy and building products that customers actually want.", th: "การตัดสินใจด้วยข้อมูล กลยุทธ์ AI และการสร้างผลิตภัณฑ์ที่ตอบโจทย์ลูกค้าจริง" },
      path: ["PY101", "DS210", "ML220", "WEB220", "WEB340", "RES330"],
      projects: { en: "Sales forecasting · AI customer-service assistant · startup pitch with a working prototype", th: "พยากรณ์ยอดขาย · ผู้ช่วยบริการลูกค้าด้วย AI · นำเสนอสตาร์ทอัปพร้อมต้นแบบที่ใช้งานได้จริง" } },
    { id: "computer", icon: "server", name: { en: "Computer Science & IT", th: "วิทยาการคอมพิวเตอร์และไอที" },
      text: { en: "Software engineering, systems, cloud and performance: the professional path for builders.", th: "วิศวกรรมซอฟต์แวร์ ระบบ คลาวด์ และประสิทธิภาพ เส้นทางมืออาชีพสำหรับนักพัฒนา" },
      path: ["PY101", "DSA210", "CPP220", "JAV220", "WEB220", "MLO350", "GPU320"],
      projects: { en: "Open-source contribution · scalable web service · GPU-accelerated application", th: "ร่วมพัฒนาโอเพนซอร์ส · เว็บเซอร์วิสที่รองรับผู้ใช้จำนวนมาก · แอปพลิเคชันที่เร่งความเร็วด้วย GPU" } },
    { id: "engineering", icon: "robot", name: { en: "Engineering & Robotics", th: "วิศวกรรมและหุ่นยนต์" },
      text: { en: "Intelligent machines that sense, decide and act in the real world.", th: "เครื่องจักรอัจฉริยะที่รับรู้ ตัดสินใจ และลงมือทำในโลกจริง" },
      path: ["ARD101", "CPP220", "RPI210", "CV320", "ROB330", "EDG310"],
      projects: { en: "Autonomous mobile robot · smart-factory quality inspection · drone perception", th: "หุ่นยนต์เคลื่อนที่อัตโนมัติ · ระบบตรวจสอบคุณภาพในโรงงานอัจฉริยะ · ระบบรับรู้ภาพสำหรับโดรน" } },
    { id: "environment", icon: "leaf", name: { en: "Agriculture, Environment & Smart City", th: "เกษตร สิ่งแวดล้อม และเมืองอัจฉริยะ" },
      text: { en: "Edge AI and IoT for food, water, air quality and cities: problems that matter to Thailand.", th: "Edge AI และ IoT เพื่ออาหาร น้ำ คุณภาพอากาศ และเมือง โจทย์สำคัญของประเทศไทย" },
      path: ["ARD101", "RPI210", "DS210", "ML220", "EDG310", "RES450"],
      projects: { en: "PM2.5 sensor network · plant-disease detection · flood early warning", th: "เครือข่ายเซนเซอร์ PM2.5 · ตรวจจับโรคพืชจากภาพ · ระบบเตือนภัยน้ำท่วมล่วงหน้า" } },
    { id: "education", icon: "book", name: { en: "Education & Thai Language AI", th: "การศึกษาและ AI ภาษาไทย" },
      text: { en: "AI tutors, learning analytics and models that truly understand Thai.", th: "ผู้ช่วยสอน AI การวิเคราะห์การเรียนรู้ และโมเดลที่เข้าใจภาษาไทยอย่างแท้จริง" },
      path: ["PY101", "DS210", "ML220", "NLP330", "SI410", "RES450"],
      projects: { en: "Thai reading assistant · automatic question generation · classroom speech-to-text", th: "ผู้ช่วยการอ่านภาษาไทย · ระบบสร้างข้อสอบอัตโนมัติ · แปลงเสียงพูดเป็นข้อความในห้องเรียน" } },
    { id: "apps", icon: "device", name: { en: "Mobile Product & Design", th: "ผลิตภัณฑ์และการออกแบบแอปมือถือ" },
      text: { en: "Native apps people love: design, accessibility and on-device intelligence.", th: "แอปเนทีฟที่ผู้ใช้หลงรัก ทั้งการออกแบบ การเข้าถึงได้ของทุกคน และความฉลาดบนอุปกรณ์" },
      path: ["SWF110", "SSC250", "IOS220", "IOS340", "WEB340"],
      projects: { en: "Swift Student Challenge app playground · accessibility app · App Store release", th: "App Playground สำหรับ Swift Student Challenge · แอปเพื่อการเข้าถึง · เผยแพร่แอปบน App Store" } }
  ],

  /* ------------------------------------------------------------ Research pathway (teaching research) */
  researchSteps: [
    { name: { en: "Ask", th: "ตั้งคำถาม" },
      text: { en: "Turn curiosity into a clear, testable research question.", th: "เปลี่ยนความอยากรู้ให้เป็นคำถามวิจัยที่ชัดเจนและทดสอบได้" },
      output: { en: "Research question", th: "คำถามวิจัย" } },
    { name: { en: "Review", th: "ทบทวนวรรณกรรม" },
      text: { en: "Learn what is already known, find the gap and cite sources properly.", th: "ศึกษาสิ่งที่มีผู้ค้นพบแล้ว หาช่องว่างงานวิจัย และอ้างอิงแหล่งที่มาอย่างถูกต้อง" },
      output: { en: "Annotated bibliography", th: "บรรณานุกรมพร้อมบทสรุป" } },
    { name: { en: "Design", th: "ออกแบบและจริยธรรม" },
      text: { en: "Choose methods, data and evaluation; get ethics approval when people or patient data are involved.", th: "เลือกวิธีการ ข้อมูล และการประเมินผล พร้อมขอรับรองจริยธรรมเมื่อเกี่ยวข้องกับมนุษย์หรือข้อมูลผู้ป่วย" },
      output: { en: "Research proposal", th: "โครงร่างการวิจัย" } },
    { name: { en: "Build", th: "สร้างและทดลอง" },
      text: { en: "Write code, build prototypes and run experiments that others can reproduce.", th: "เขียนโค้ด สร้างต้นแบบ และทดลองอย่างเป็นระบบให้ผู้อื่นทำซ้ำได้" },
      output: { en: "Code & prototype", th: "โค้ดและต้นแบบ" } },
    { name: { en: "Analyse", th: "วิเคราะห์ผล" },
      text: { en: "Use statistics and visualisation to see what the results really say.", th: "ใช้สถิติและการแสดงผลข้อมูล เพื่อเข้าใจว่าผลลัพธ์บอกอะไรจริง ๆ" },
      output: { en: "Results & figures", th: "ผลลัพธ์และแผนภาพ" } },
    { name: { en: "Write", th: "เขียนรายงาน" },
      text: { en: "Write in IMRaD structure with clear figures, honest limitations and correct references.", th: "เขียนตามโครงสร้าง IMRaD พร้อมแผนภาพที่ชัดเจน ระบุข้อจำกัดอย่างตรงไปตรงมา และอ้างอิงอย่างถูกต้อง" },
      output: { en: "Manuscript", th: "ต้นฉบับบทความ" } },
    { name: { en: "Present", th: "นำเสนอ" },
      text: { en: "Design a poster, give a talk and answer questions from judges and reviewers with confidence.", th: "ออกแบบโปสเตอร์ บรรยาย และตอบคำถามกรรมการหรือผู้ทรงคุณวุฒิอย่างมั่นใจ" },
      output: { en: "Poster & talk", th: "โปสเตอร์และการบรรยาย" } },
    { name: { en: "Publish & compete", th: "ตีพิมพ์และแข่งขัน" },
      text: { en: "Submit to journals, conferences and competitions, and learn from every round of feedback.", th: "ส่งผลงานสู่วารสาร งานประชุมวิชาการ และเวทีแข่งขัน และเรียนรู้จากทุกคำติชม" },
      output: { en: "Paper · award · product", th: "บทความ · รางวัล · ผลิตภัณฑ์" } }
  ],

  /* ------------------------------------------------------------ Lab research areas */
  researchAreas: [
    { icon: "spark", name: { en: "SI Reasoning & AI Agents", th: "การให้เหตุผลของ SI และ AI Agent" },
      text: { en: "Multi-step reasoning, planning, tool use and verification: how AI systems can think more reliably.", th: "การให้เหตุผลหลายขั้นตอน การวางแผน การใช้เครื่องมือ และการตรวจสอบความถูกต้อง เพื่อให้ AI คิดได้อย่างน่าเชื่อถือยิ่งขึ้น" } },
    { icon: "health", name: { en: "AI for Health & Bioengineering", th: "AI เพื่อสุขภาพและวิศวกรรมชีวการแพทย์" },
      text: { en: "Medical imaging, bio-signals and low-cost devices that widen access to care.", th: "ภาพทางการแพทย์ สัญญาณชีวภาพ และอุปกรณ์ราคาประหยัด ที่ช่วยให้คนเข้าถึงการรักษาได้มากขึ้น" } },
    { icon: "chip", name: { en: "Edge AI for Cities & Agriculture", th: "Edge AI เพื่อเมืองและการเกษตร" },
      text: { en: "Efficient models on Jetson, Raspberry Pi and microcontrollers for air quality, traffic, farms and factories.", th: "โมเดลประสิทธิภาพสูงบน Jetson, Raspberry Pi และไมโครคอนโทรลเลอร์ สำหรับคุณภาพอากาศ การจราจร ฟาร์ม และโรงงาน" } },
    { icon: "book", name: { en: "Thai Language & Education AI", th: "AI ภาษาไทยและการศึกษา" },
      text: { en: "Language models, speech and tutoring systems that serve Thai learners well.", th: "โมเดลภาษา เสียงพูด และระบบผู้ช่วยสอนที่ตอบโจทย์ผู้เรียนชาวไทย" } },
    { icon: "shield", name: { en: "Safe & Responsible AI", th: "AI ที่ปลอดภัยและรับผิดชอบ" },
      text: { en: "Evaluation, robustness, fairness and interpretability: the foundations for trustworthy SI.", th: "การประเมิน ความทนทาน ความเป็นธรรม และความสามารถในการอธิบาย รากฐานของ SI ที่ไว้วางใจได้" } },
    { icon: "school", name: { en: "STEM Education Research", th: "งานวิจัยด้านการศึกษา STEM" },
      text: { en: "How young people learn programming, AI and science best, and how to measure real progress.", th: "ศึกษาว่าเยาวชนเรียนรู้การเขียนโปรแกรม AI และวิทยาศาสตร์ได้ดีที่สุดอย่างไร และวัดความก้าวหน้าได้อย่างแท้จริง" } }
  ],

  /* ------------------------------------------------------------ Competitions & venues we prepare learners for */
  venues: [
    { name: "Swift Student Challenge", scope: { en: "Apple · global", th: "Apple · ระดับโลก" },
      text: { en: "Apple's annual challenge for student developers, entered with an original app playground.", th: "เวทีประจำปีของ Apple สำหรับนักพัฒนาที่เป็นนักเรียนนักศึกษา ส่งผลงานเป็น App Playground ที่สร้างสรรค์เอง" } },
    { name: "NSC · National Software Contest", scope: { en: "Software · Thailand", th: "ซอฟต์แวร์ · ประเทศไทย" },
      text: { en: "Thailand's national software development contest for students.", th: "การแข่งขันพัฒนาโปรแกรมคอมพิวเตอร์แห่งประเทศไทย สำหรับนักเรียนนักศึกษา" } },
    { name: "YSC · Young Scientist Competition", scope: { en: "Science projects · Thailand", th: "โครงงานวิทยาศาสตร์ · ประเทศไทย" },
      text: { en: "Science and technology project competition for secondary-school students.", th: "การประกวดโครงงานวิทยาศาสตร์และเทคโนโลยีสำหรับนักเรียนมัธยมศึกษา" } },
    { name: "COMPAS-PY1 · COMPAS-CPP1", scope: { en: "Programming exams · Chulalongkorn Univ.", th: "สอบวัดทักษะโปรแกรม · จุฬาฯ" },
      text: { en: "Python and C++ exams by Chula's Computer Engineering department. The AWARD of EXCELLENCE counts towards some TCAS70 portfolio admissions.", th: "การสอบ Python และ C++ โดยภาควิชาวิศวกรรมคอมพิวเตอร์ จุฬาฯ รางวัล AWARD of EXCELLENCE ใช้ประกอบการสมัคร TCAS70 รอบ Portfolio บางโครงการ" } },
    { name: "HKICO", scope: { en: "Computational olympiad · international", th: "โอลิมปิกการคำนวณ · นานาชาติ" },
      text: { en: "Hong Kong International Computational Olympiad, with Python and other language categories.", th: "Hong Kong International Computational Olympiad มีประเภท Python และภาษาอื่น ๆ" } },
    { name: "World Robot Olympiad", scope: { en: "Robotics · international", th: "หุ่นยนต์ · นานาชาติ" },
      text: { en: "International robotics competition with challenges for every age group.", th: "การแข่งขันหุ่นยนต์ระดับนานาชาติที่มีโจทย์สำหรับทุกช่วงวัย" } },
    { name: { en: "Hackathons & innovation challenges", th: "แฮกกาธอนและเวทีนวัตกรรม" }, scope: { en: "Prototypes · Thailand & global", th: "ต้นแบบ · ไทยและนานาชาติ" },
      text: { en: "Fast-paced events where teams turn ideas into working prototypes.", th: "เวทีที่ทีมเปลี่ยนไอเดียเป็นต้นแบบที่ใช้งานได้จริงในเวลาจำกัด" } },
    { name: { en: "Academic conferences", th: "งานประชุมวิชาการ" }, scope: { en: "Papers · international", th: "บทความ · นานาชาติ" },
      text: { en: "Student tracks and workshops at IEEE, ACM and domain conferences.", th: "เวทีนักศึกษาและเวิร์กช็อปในงานประชุมวิชาการของ IEEE, ACM และสาขาเฉพาะ" } },
    { name: { en: "Peer-reviewed journals", th: "วารสารวิชาการที่มีผู้ทรงคุณวุฒิประเมิน" }, scope: { en: "Publication", th: "การตีพิมพ์" },
      text: { en: "Guidance on choosing reputable journals and avoiding predatory publishers.", th: "แนะนำการเลือกวารสารที่น่าเชื่อถือ และหลีกเลี่ยงวารสารล่าเหยื่อ (Predatory Journal)" } }
  ],

  /* ------------------------------------------------------------ Youth STEM age bands */
  stemBands: [
    { age: { en: "Ages 8–11", th: "อายุ 8–11 ปี" }, name: { en: "Junior Explorers", th: "นักสำรวจรุ่นเยาว์" }, color: "lv-1",
      text: { en: "Curiosity first: block coding, simple circuits, science experiments and stories about how technology works.", th: "เริ่มจากความอยากรู้: เขียนโค้ดแบบบล็อก วงจรง่าย ๆ การทดลองวิทยาศาสตร์ และเรื่องราวว่าเทคโนโลยีทำงานอย่างไร" },
      courses: ["CT100", "RES101"], focus: ["Scratch", "Circuits", "Science"] },
    { age: { en: "Ages 12–14", th: "อายุ 12–14 ปี" }, name: { en: "Young Makers", th: "นักสร้างสรรค์รุ่นใหม่" }, color: "lv-2",
      text: { en: "Real code and real hardware: Python, Arduino, app playgrounds and a first science project.", th: "โค้ดจริงและฮาร์ดแวร์จริง: Python, Arduino, App Playground และโครงงานวิทยาศาสตร์ชิ้นแรก" },
      courses: ["PY101", "ARD101", "SWF110", "AI100"], focus: ["Python", "Arduino", "Swift"] },
    { age: { en: "Ages 15–18", th: "อายุ 15–18 ปี" }, name: { en: "Future Innovators", th: "นักนวัตกรแห่งอนาคต" }, color: "lv-3",
      text: { en: "Advanced projects, AI and research with a mentor, competitions, and a portfolio for university admission, including TCAS.", th: "โครงงานขั้นสูง AI และงานวิจัยกับอาจารย์ที่ปรึกษา การแข่งขัน และพอร์ตโฟลิโอเพื่อศึกษาต่อมหาวิทยาลัย รวมถึงรอบ TCAS" },
      courses: ["ML220", "RPI210", "SSC250", "RES210"], focus: ["AI/ML", "Raspberry Pi", "Research"] }
  ],

  /* ------------------------------------------------------------ Partner engagement models */
  partnerModels: [
    { icon: "present", name: { en: "Workshops & bootcamps", th: "เวิร์กช็อปและบูตแคมป์" }, duration: { en: "1–5 days", th: "1–5 วัน" },
      text: { en: "Hands-on introductions to AI, edge AI, app development or research skills for teams and classes.", th: "เรียนรู้ลงมือทำด้าน AI, Edge AI การพัฒนาแอป หรือทักษะการวิจัย สำหรับทีมงานและชั้นเรียน" } },
    { icon: "users", name: { en: "Training programmes", th: "หลักสูตรอบรมองค์กร" }, duration: { en: "4–12 weeks", th: "4–12 สัปดาห์" },
      text: { en: "Upskill engineers, analysts and teachers with a curriculum tailored to your goals, ending in real projects.", th: "ยกระดับทักษะวิศวกร นักวิเคราะห์ และครู ด้วยหลักสูตรที่ออกแบบตามเป้าหมายขององค์กร และจบด้วยโปรเจกต์จริง" } },
    { icon: "microscope", name: { en: "Research & proof of concept", th: "วิจัยร่วมและพัฒนาต้นแบบ" }, duration: { en: "3–12 months", th: "3–12 เดือน" },
      text: { en: "Joint research or a proof of concept on your problem: computer vision, LLMs, edge AI or IoT.", th: "วิจัยร่วมหรือพัฒนาต้นแบบเพื่อแก้โจทย์ของคุณ ทั้ง Computer Vision, LLM, Edge AI หรือ IoT" } },
    { icon: "building", name: { en: "Lab & talent partnership", th: "พันธมิตรห้องแล็บและบุคลากร" }, duration: { en: "Annual", th: "รายปี" },
      text: { en: "Co-branded labs, sponsored projects, internships and a pipeline of well-trained graduates.", th: "ห้องแล็บร่วมแบรนด์ โครงการที่ได้รับการสนับสนุน การฝึกงาน และบุคลากรที่ผ่านการฝึกฝนอย่างดี" } }
  ],

  /* ------------------------------------------------------------ Audience tabs (home) */
  audiences: [
    { id: "students", icon: "academy", label: { en: "Students", th: "นักเรียนนักศึกษา" },
      title: { en: "Learn to build, then learn to discover", th: "เรียนเพื่อสร้าง แล้วต่อยอดสู่การค้นพบ" },
      text: { en: "Start at the right level, build a portfolio of real projects and, when you are ready, do research that is presented to the world.", th: "เริ่มในระดับที่เหมาะกับคุณ สร้างพอร์ตโฟลิโอจากโปรเจกต์จริง และเมื่อพร้อม ก็ทำงานวิจัยเพื่อนำเสนอสู่เวทีโลก" },
      points: [
        { en: "Placement chat to find your starting level", th: "พูดคุยประเมินระดับเพื่อหาจุดเริ่มต้นที่เหมาะสม" },
        { en: "Project-based courses from Python to Edge AI", th: "หลักสูตรแบบลงมือทำ ตั้งแต่ Python ถึง Edge AI" },
        { en: "Research mentoring through to publication and competitions", th: "ดูแลงานวิจัยจนถึงการตีพิมพ์และการแข่งขัน" },
        { en: "Certificate of completion for every course", th: "ประกาศนียบัตรเมื่อเรียนจบทุกหลักสูตร" }
      ],
      cta: { href: "pages/programs.html", label: { en: "Explore programs", th: "ดูหลักสูตร" } } },
    { id: "parents", icon: "users", label: { en: "Parents", th: "ผู้ปกครอง" },
      title: { en: "A strong STEM foundation for life", th: "รากฐาน STEM ที่แข็งแรงเพื่ออนาคต" },
      text: { en: "We grow curiosity into real skills with age-appropriate, hands-on learning, and show you the progress along the way.", th: "เราเปลี่ยนความอยากรู้ให้เป็นทักษะจริง ด้วยการเรียนรู้แบบลงมือทำที่เหมาะกับวัย และแสดงความก้าวหน้าให้คุณเห็นตลอดเส้นทาง" },
      points: [
        { en: "Learning paths for ages 8 to 18", th: "เส้นทางการเรียนรู้สำหรับอายุ 8 ถึง 18 ปี" },
        { en: "Progress reports and project showcase days", th: "รายงานความก้าวหน้าและวันแสดงผลงาน" },
        { en: "Small groups in safe, supervised labs", th: "กลุ่มเรียนขนาดเล็กในห้องแล็บที่ปลอดภัยและมีผู้ดูแล" },
        { en: "Portfolio support for TCAS and international admission", th: "ช่วยเตรียมพอร์ตโฟลิโอสำหรับ TCAS และการศึกษาต่อต่างประเทศ" }
      ],
      cta: { href: "pages/stem.html", label: { en: "Youth STEM programmes", th: "ดูโปรแกรม STEM เยาวชน" } } },
    { id: "schools", icon: "school", label: { en: "Schools & universities", th: "โรงเรียนและมหาวิทยาลัย" },
      title: { en: "Bring AI and research into every classroom", th: "นำ AI และการวิจัยเข้าสู่ทุกห้องเรียน" },
      text: { en: "Modules, teacher training and research co-supervision that fit your curriculum and your students.", th: "ชุดการเรียนรู้ การอบรมครู และการร่วมดูแลงานวิจัย ที่เข้ากับหลักสูตรและผู้เรียนของสถาบัน" },
      points: [
        { en: "Ready-to-teach modules aligned to your curriculum", th: "ชุดการเรียนรู้พร้อมสอนที่สอดคล้องกับหลักสูตรของสถาบัน" },
        { en: "Teacher training and co-teaching", th: "อบรมครูและสอนร่วมกัน" },
        { en: "Co-supervision of student research projects", th: "ร่วมเป็นที่ปรึกษาโครงงานวิจัยของนักเรียนนักศึกษา" },
        { en: "Shared access to edge-AI hardware", th: "ใช้ฮาร์ดแวร์ Edge AI ร่วมกัน" }
      ],
      cta: { href: "pages/partners.html", label: { en: "Partner with us", th: "ร่วมเป็นพันธมิตร" } } },
    { id: "industry", icon: "building", label: { en: "Industry", th: "ภาคธุรกิจและอุตสาหกรรม" },
      title: { en: "Turn AI into measurable results", th: "เปลี่ยน AI ให้เป็นผลลัพธ์ที่วัดได้" },
      text: { en: "Upskill your people, prototype on your data and build a talent pipeline, with clear agreements and outcomes.", th: "ยกระดับทักษะบุคลากร พัฒนาต้นแบบบนข้อมูลของคุณ และสร้างบุคลากรรุ่นใหม่ ด้วยข้อตกลงและผลลัพธ์ที่ชัดเจน" },
      points: [
        { en: "Corporate upskilling from foundation to advanced", th: "อบรมพนักงานตั้งแต่ระดับพื้นฐานถึงระดับสูง" },
        { en: "Proof-of-concept projects on NVIDIA Jetson and the cloud", th: "พัฒนาต้นแบบบน NVIDIA Jetson และคลาวด์" },
        { en: "Sponsored research and joint publications", th: "สนับสนุนงานวิจัยและตีพิมพ์ผลงานร่วมกัน" },
        { en: "NDA, IP and PDPA-compliant data handling", th: "มีข้อตกลงรักษาความลับ ทรัพย์สินทางปัญญา และจัดการข้อมูลตาม PDPA" }
      ],
      cta: { href: "pages/partners.html", label: { en: "Work with us", th: "ร่วมงานกับเรา" } } }
  ],

  /* ------------------------------------------------------------ AI -> SI spectrum */
  spectrum: [
    { name: { en: "Narrow AI", th: "AI เฉพาะทาง" }, when: { en: "Today", th: "ปัจจุบัน" },
      text: { en: "Excellent at one task, such as recognising images or recommending products.", th: "เก่งงานเดียว เช่น จดจำภาพ หรือแนะนำสินค้า" } },
    { name: { en: "Generative AI", th: "Generative AI" }, when: { en: "Today", th: "ปัจจุบัน" },
      text: { en: "Creates text, images and code from patterns learned in data.", th: "สร้างข้อความ ภาพ และโค้ด จากรูปแบบที่เรียนรู้จากข้อมูล" } },
    { name: { en: "Agentic AI", th: "Agentic AI" }, when: { en: "Emerging", th: "กำลังเกิดขึ้น" },
      text: { en: "Plans, uses tools and completes multi-step tasks together with people.", th: "วางแผน ใช้เครื่องมือ และทำงานหลายขั้นตอนร่วมกับมนุษย์" } },
    { name: { en: "SI · Super Intelligence", th: "SI · Super Intelligence" }, when: { en: "Research horizon", th: "เป้าหมายงานวิจัย" },
      text: { en: "Systems that reason, discover and create across every domain, aligned with human values and under human oversight.", th: "ระบบที่ให้เหตุผล ค้นพบ และสร้างสรรค์ได้ในทุกสาขา สอดคล้องกับคุณค่าของมนุษย์ และอยู่ภายใต้การกำกับดูแลของมนุษย์" } }
  ],

  /* ------------------------------------------------------------ Misc */
  tech: ["Python", "C/C++", "Java", "HTML · CSS · JavaScript", "TypeScript", "React", "Swift", "SwiftUI", "Core ML", "Next.js", "Git", "Jetson Orin Nano", "Arduino UNO Q", "Claude Code", "Codex", "Cursor",
         "PyTorch", "Hugging Face", "LLMs & RAG", "NVIDIA Jetson", "CUDA", "TensorRT", "Raspberry Pi", "Arduino", "ROS 2", "LaTeX"],

  typewriter: ["Python", "C/C++", "Java", "Web Apps", "Swift & iOS", "Edge AI", "NVIDIA Jetson", "Research", "Super Intelligence"],

  terminal: [
    { t: "cmd", s: "python3 detect.py --source camera0 --engine model_fp16.trt" },
    { t: "out", s: "[ok] TensorRT engine loaded · FP16" },
    { t: "out", s: "[ok] camera0 · 1280×720 @ 30 fps" },
    { t: "data", s: "frame 0412  person 0.94  bicycle 0.88  21 ms" },
    { t: "data", s: "frame 0413  person 0.95  bicycle 0.87  20 ms" },
    { t: "data", s: "frame 0414  person 0.95  dog 0.81      21 ms" },
    { t: "ok", s: "✔ real-time AI on the edge, no cloud needed" }
  ]
};
