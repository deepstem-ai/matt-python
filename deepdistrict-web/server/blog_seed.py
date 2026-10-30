"""Starter news posts so the home-page news slider and the blog are not empty on a new install.

Written by the DeepDistrict team (not AI), published once on first start (kv "blogSeed"); staff can edit,
archive or delete them like any other post, and deleted posts do not come back. Facts were checked on
2026-10-30 against the sources listed in each post; dates and rules change, so each post tells readers to
check the official site.
"""

import json

import images

V = 1        # bump to add newly written starter posts (existing ones are never touched again)


def _cover(c1, c2, label, glyph):
    """A simple branded drawing (gradient, shapes and a short label), cleaned like any AI drawing."""
    from xml.sax.saxutils import escape
    label, glyph = escape(label), escape(glyph)
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">'
           f'<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{c1}"/><stop offset="1" stop-color="{c2}"/></linearGradient></defs>'
           f'<rect width="1200" height="630" fill="url(#g)"/>'
           f'<circle cx="1010" cy="120" r="220" fill="#ffffff" fill-opacity="0.08"/><circle cx="160" cy="560" r="260" fill="#ffffff" fill-opacity="0.06"/>'
           f'<path d="M0 470 C 300 390 520 560 820 470 S 1200 420 1200 420 L1200 630 L0 630 Z" fill="#ffffff" fill-opacity="0.07"/>'
           f'<text x="90" y="300" font-family="Arial, Helvetica, sans-serif" font-size="150" font-weight="700" fill="#ffffff" fill-opacity="0.95">{glyph}</text>'
           f'<text x="92" y="400" font-family="Arial, Helvetica, sans-serif" font-size="54" font-weight="700" fill="#ffffff">{label}</text>'
           f'<text x="92" y="560" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="#ffffff" fill-opacity="0.8">DeepDistrict.si</text></svg>')
    return images.svg_data_url(images.clean_svg(svg))


POSTS = [
    {"slug": "suankularb-m1-gate-ep-practice-sets", "category": "tcas", "days": 0, "cover": ("#1d3fb8", "#c27c0e", "Suankularb M.1 · GATE · EP", "ม.1"),
     "title": {"en": "Suankularb M.1 GATE and English Program: new timed practice sets",
               "th": "เตรียมสอบเข้า ม.1 สวนกุหลาบ GATE และ English Program: ชุดฝึกจับเวลาชุดใหม่"},
     "summary": {"en": "Three full practice sets for each programme are now in the Online tests page — 40 questions, 90 minutes, answers explained in Thai and English.",
                 "th": "ชุดฝึกครบชุดโครงการละ 3 ชุด เปิดให้ทำแล้วในหน้าข้อสอบออนไลน์ ชุดละ 40 ข้อ 90 นาที พร้อมเฉลยอธิบายภาษาไทยและอังกฤษ"},
     "body": {"en": "Many families are preparing for the Suankularb Wittayalai M.1 special programmes. The school publishes the subjects, not the papers, so we wrote our own practice sets in a four-choice format.\n\n"
                    "## What is inside\n- **GATE Program:** Mathematics 15, Science 15, English 5 and Thai 5 questions. Maths and Science carry most of the weight, so they get most of the questions.\n"
                    "- **English Program (EPLUS+):** English 20, Mathematics 10 and Science 10 questions, all in English. The real admission also has an English interview, which we practise in class.\n"
                    "- Every set is timed (90 minutes), the answer order changes each time, and every answer has a worked explanation.\n\n"
                    "## How to use them\nSign in, open **Online tests** and choose a set under *Admission & practice test sets*. Teachers can also run the same set as a live class or print it as a PDF with a notes column.\n\n"
                    "These are DeepDistrict practice sets, not official or past papers. Subjects, dates and rules can change every year — always check the school's own announcement before you apply.",
              "th": "หลายครอบครัวกำลังเตรียมลูกสอบเข้าห้องเรียนพิเศษ ม.1 โรงเรียนสวนกุหลาบวิทยาลัย โรงเรียนประกาศวิชาที่สอบแต่ไม่เผยแพร่ข้อสอบ เราจึงเขียนชุดฝึกขึ้นเองในรูปแบบ 4 ตัวเลือก\n\n"
                    "## ในชุดฝึกมีอะไรบ้าง\n- **GATE Program:** คณิตศาสตร์ 15 ข้อ วิทยาศาสตร์ 15 ข้อ ภาษาอังกฤษ 5 ข้อ และภาษาไทย 5 ข้อ คณิตและวิทย์มีน้ำหนักมากที่สุดจึงมีจำนวนข้อมากที่สุด\n"
                    "- **English Program (EPLUS+):** ภาษาอังกฤษ 20 ข้อ คณิตศาสตร์ 10 ข้อ และวิทยาศาสตร์ 10 ข้อ เป็นภาษาอังกฤษทั้งหมด การสอบจริงมีสัมภาษณ์ภาษาอังกฤษด้วย ซึ่งเราฝึกในชั้นเรียน\n"
                    "- ทุกชุดจับเวลา 90 นาที ลำดับตัวเลือกสลับทุกครั้ง และทุกข้อมีคำอธิบายวิธีคิด\n\n"
                    "## วิธีใช้\nเข้าสู่ระบบ เปิดหน้า **ข้อสอบออนไลน์** แล้วเลือกชุดในหัวข้อ *ชุดข้อสอบเตรียมสอบเข้าและชุดฝึก* ครูสามารถใช้ชุดเดียวกันเปิดห้องเรียนสด หรือพิมพ์เป็น PDF ที่มีช่องจดโน้ตได้\n\n"
                    "ชุดฝึกนี้เป็นของ DeepDistrict ไม่ใช่ข้อสอบจริงหรือข้อสอบเก่า วิชา วันสอบ และกติกาอาจเปลี่ยนทุกปี โปรดตรวจสอบประกาศของโรงเรียนก่อนสมัครทุกครั้ง"},
     "tags": ["M.1", "Suankularb", "GATE", "EP"], "sources": []},
    {"slug": "digital-sat-reading-writing-format-practice-modules", "category": "sat", "days": 2, "cover": ("#0e1f6b", "#2563eb", "Digital SAT · Reading and Writing", "SAT"),
     "title": {"en": "Digital SAT Reading and Writing: how the two modules work (and three new practice modules)",
               "th": "Digital SAT Reading and Writing: 2 โมดูลทำงานอย่างไร (พร้อมชุดฝึกใหม่ 3 โมดูล)"},
     "summary": {"en": "54 questions in two adaptive modules of 32 minutes. We added three full 27-question practice modules with explanations.",
                 "th": "54 ข้อ แบ่งเป็น 2 โมดูลแบบปรับระดับ โมดูลละ 32 นาที เราเพิ่มชุดฝึกเต็มโมดูล 27 ข้อ 3 ชุด พร้อมคำอธิบาย"},
     "body": {"en": "The Reading and Writing section of the digital SAT has 54 questions in two modules of 27 questions, with 32 minutes for each module. Every question has its own short passage. "
                    "The test is multistage adaptive: how you do in module 1 decides whether module 2 is harder or easier.\n\n"
                    "## The four content domains\n- **Craft and Structure** — words in context, text structure and purpose, cross-text connections\n- **Information and Ideas** — central ideas, evidence (including tables and graphs), inferences\n"
                    "- **Standard English Conventions** — sentence boundaries, form, structure and sense\n- **Expression of Ideas** — transitions and rhetorical synthesis\n\n"
                    "Inside a module the questions follow this domain order, and within each skill they go from easier to harder.\n\n"
                    "## Practise in the same format\nOur three new practice modules each have 27 questions in the real domain mix (7 · 7 · 7 · 6) and 32 minutes. Each one ends with explanations and an error log so you can see whether you missed a question because of vocabulary, reasoning, a grammar rule or time.\n\n"
                    "Scores in our system are practice estimates, not official College Board scores. Check test dates and rules on the College Board website.",
              "th": "พาร์ต Reading and Writing ของ Digital SAT มี 54 ข้อ แบ่งเป็น 2 โมดูล โมดูลละ 27 ข้อ ใช้เวลาโมดูลละ 32 นาที แต่ละข้อมีบทอ่านสั้นของตัวเอง "
                    "ข้อสอบเป็นแบบปรับระดับหลายขั้น ผลของโมดูล 1 จะกำหนดว่าโมดูล 2 จะยากขึ้นหรือง่ายลง\n\n"
                    "## 4 หมวดเนื้อหา\n- **Craft and Structure** — ความหมายของคำในบริบท โครงสร้างและจุดประสงค์ของข้อความ การเชื่อมโยงระหว่างสองข้อความ\n- **Information and Ideas** — ใจความสำคัญ หลักฐาน (รวมถึงตารางและกราฟ) การอนุมาน\n"
                    "- **Standard English Conventions** — ขอบเขตประโยค รูปคำ และโครงสร้าง\n- **Expression of Ideas** — คำเชื่อมและการสังเคราะห์ข้อมูล\n\n"
                    "ในแต่ละโมดูล ข้อสอบเรียงตามหมวดนี้ และในแต่ละทักษะเรียงจากง่ายไปยาก\n\n"
                    "## ฝึกในรูปแบบเดียวกัน\nชุดฝึกใหม่ 3 ชุดของเรามีชุดละ 27 ข้อ สัดส่วนหมวดตามข้อสอบจริง (7 · 7 · 7 · 6) และเวลา 32 นาที เมื่อทำเสร็จจะมีคำอธิบายและบันทึกข้อผิดพลาด เพื่อดูว่าพลาดเพราะคำศัพท์ การให้เหตุผล กฎไวยากรณ์ หรือเวลา\n\n"
                    "คะแนนในระบบของเราเป็นค่าประมาณเพื่อการฝึก ไม่ใช่คะแนนทางการของ College Board โปรดตรวจสอบวันสอบและกติกาที่เว็บไซต์ College Board"},
     "tags": ["SAT", "Digital SAT", "Reading and Writing"],
     "sources": [{"title": "College Board — What's on the SAT: Reading and Writing", "url": "https://satsuite.collegeboard.org/sat/whats-on-the-test/reading-writing"}]},
    {"slug": "ielts-academic-reading-question-types", "category": "ielts", "days": 4, "cover": ("#7c1d6f", "#e0457b", "IELTS Academic · Reading and Writing", "IELTS"),
     "title": {"en": "IELTS Academic Reading is not just multiple choice: the question types to know",
               "th": "IELTS Academic Reading ไม่ได้มีแค่ตัวเลือก: รู้จักรูปแบบคำถามที่ต้องเจอ"},
     "summary": {"en": "3 passages, 40 questions, 60 minutes — and around a dozen task types, from True/False/Not Given to completing notes with words from the text.",
                 "th": "3 บทอ่าน 40 ข้อ 60 นาที และรูปแบบคำถามราว 10 กว่าแบบ ตั้งแต่ True/False/Not Given ไปจนถึงเติมโน้ตด้วยคำจากบทอ่าน"},
     "body": {"en": "IELTS Academic Reading has three long passages, 40 questions and 60 minutes, with no extra time to transfer answers. The questions come in many forms:\n\n"
                    "- **True / False / Not Given** and **Yes / No / Not Given**\n- **Multiple choice** with one answer, or *choose TWO / THREE letters*\n- **Matching** headings, information, features and sentence endings\n"
                    "- **Completion**: sentences, summaries, notes, tables, flow-charts and diagram labels, using words from the passage\n- **Short-answer questions**\n\n"
                    "## Two rules that cost marks\n- Keep to the word limit. If the instructions say *NO MORE THAN TWO WORDS*, a three-word answer is wrong even if the meaning is right.\n- Spelling counts.\n\n"
                    "## New practice tests\nWe added three complete IELTS Academic practice tests. Each has a full Reading test (three passages, exactly 40 questions) and a Writing test with Task 1 and Task 2. Reading is marked straight away; for Writing, AI can suggest band scores and a teacher confirms them.\n\n"
                    "Our scores are practice estimates, not official IELTS results.",
              "th": "IELTS Academic Reading มีบทอ่านยาว 3 บท 40 ข้อ เวลา 60 นาที และไม่มีเวลาเพิ่มสำหรับย้ายคำตอบ คำถามมีหลายรูปแบบ:\n\n"
                    "- **True / False / Not Given** และ **Yes / No / Not Given**\n- **ปรนัย** คำตอบเดียว หรือ *เลือก 2 / 3 ตัวอักษร*\n- **จับคู่** หัวข้อย่อหน้า ข้อมูล ลักษณะ และตอนจบของประโยค\n"
                    "- **เติมคำ** ในประโยค สรุปความ โน้ต ตาราง แผนผังลำดับขั้น และป้ายกำกับแผนภาพ โดยใช้คำจากบทอ่าน\n- **คำถามตอบสั้น**\n\n"
                    "## กฎ 2 ข้อที่ทำให้เสียคะแนนบ่อย\n- เขียนไม่เกินจำนวนคำที่กำหนด ถ้าโจทย์บอก *NO MORE THAN TWO WORDS* แล้วตอบ 3 คำ ถือว่าผิดแม้ความหมายถูก\n- การสะกดคำมีผลต่อคะแนน\n\n"
                    "## ชุดฝึกใหม่\nเราเพิ่มชุดฝึก IELTS Academic ครบชุด 3 ชุด แต่ละชุดมี Reading เต็มรูปแบบ (3 บทอ่าน 40 ข้อพอดี) และ Writing ทั้ง Task 1 และ Task 2 พาร์ต Reading ตรวจทันที ส่วน Writing มี AI ช่วยเสนอคะแนนและครูเป็นผู้ยืนยัน\n\n"
                    "คะแนนของเราเป็นค่าประมาณเพื่อการฝึก ไม่ใช่ผลสอบ IELTS ทางการ"},
     "tags": ["IELTS", "Academic Reading"],
     "sources": [{"title": "IELTS — official website (test format)", "url": "https://ielts.org/"}]},
    {"slug": "tcas70-round-1-portfolio-check-dates", "category": "tcas", "days": 6, "cover": ("#0f5132", "#16a34a", "TCAS70 · Round 1 Portfolio", "TCAS"),
     "title": {"en": "TCAS70 Round 1 (Portfolio): each university sets its own dates",
               "th": "TCAS70 รอบ 1 Portfolio: แต่ละมหาวิทยาลัยกำหนดวันรับสมัครเอง"},
     "summary": {"en": "Round 1 is already open at many universities, but there is no single deadline. Check each faculty's announcement and confirm your place on myTCAS.",
                 "th": "หลายมหาวิทยาลัยเปิดรับรอบ 1 แล้ว แต่ไม่มีวันปิดรับร่วมกัน ต้องตรวจประกาศของแต่ละคณะ และยืนยันสิทธิ์ผ่าน myTCAS"},
     "body": {"en": "For students applying in academic year 2570 (TCAS70), Round 1 — Portfolio — is run by each university. Universities could open from mid-August 2026, and their windows are different: some have already closed, and others run into early 2027.\n\n"
                    "## What to do now\n- Make a list of the programmes you want and find **each faculty's own announcement** (dates, required scores, portfolio pages).\n"
                    "- Prepare a short, focused portfolio: a few strong projects with evidence, not every certificate you have.\n- Check whether the programme asks for test scores such as TGAT/TPAT, SAT, IELTS or TOEFL, and when you need them.\n"
                    "- After you pass, you still have to **confirm your place on mytcas.com** within the confirmation window.\n\n"
                    "Dates in news articles and social media are sometimes wrong. Always trust the university's announcement and myTCAS first. Our counsellors can help you plan your portfolio and test dates.",
              "th": "สำหรับนักเรียนที่จะสมัครปีการศึกษา 2570 (TCAS70) รอบ 1 Portfolio เป็นรอบที่แต่ละมหาวิทยาลัยจัดเอง เปิดรับได้ตั้งแต่กลางเดือนสิงหาคม 2569 และแต่ละแห่งมีช่วงเวลาไม่เท่ากัน บางแห่งปิดรับแล้ว บางแห่งเปิดถึงต้นปี 2570\n\n"
                    "## สิ่งที่ควรทำตอนนี้\n- จดรายชื่อหลักสูตรที่ต้องการ และหา **ประกาศของแต่ละคณะ** (วันรับสมัคร คะแนนที่ใช้ จำนวนหน้าพอร์ต)\n"
                    "- ทำพอร์ตให้กระชับและตรงประเด็น เลือกผลงานเด่นไม่กี่ชิ้นพร้อมหลักฐาน ไม่จำเป็นต้องใส่เกียรติบัตรทุกใบ\n- ตรวจว่าหลักสูตรใช้คะแนนสอบ เช่น TGAT/TPAT, SAT, IELTS หรือ TOEFL หรือไม่ และต้องใช้เมื่อไร\n"
                    "- เมื่อผ่านการคัดเลือกแล้ว ต้อง **ยืนยันสิทธิ์ที่ mytcas.com** ภายในช่วงเวลาที่กำหนด\n\n"
                    "วันที่ในข่าวหรือโซเชียลมีเดียบางครั้งคลาดเคลื่อน ให้ยึดประกาศของมหาวิทยาลัยและ myTCAS เป็นหลักเสมอ ทีมแนะแนวของเราช่วยวางแผนพอร์ตและวันสอบได้"},
     "tags": ["TCAS70", "Portfolio", "myTCAS"],
     "sources": [{"title": "myTCAS — official TCAS website", "url": "https://www.mytcas.com/"}]},
    {"slug": "swift-student-challenge-2027-get-ready", "category": "coding", "days": 8, "cover": ("#111827", "#f97316", "Swift Student Challenge", "Swift"),
     "title": {"en": "Swift Student Challenge: what we know about the next round, and how to get ready",
               "th": "Swift Student Challenge: รอบถัดไปมีอะไรบ้าง และเตรียมตัวอย่างไร"},
     "summary": {"en": "In 2026 submissions ran from 6 to 28 February. Apple has not yet announced the 2027 dates — the best time to start your app playground is now.",
                 "th": "ปี 2026 เปิดรับผลงานวันที่ 6–28 กุมภาพันธ์ Apple ยังไม่ประกาศวันของปี 2027 ช่วงนี้จึงเหมาะที่จะเริ่มทำ app playground"},
     "body": {"en": "The Swift Student Challenge is Apple's yearly coding challenge for students. In the 2026 round, submissions were open from 6 to 28 February 2026, and winners were announced in late March, before WWDC.\n\n"
                    "As of 30 October 2026, Apple has not announced the dates for 2027. In recent years the announcement came in October or November, with submissions in February.\n\n"
                    "## Get ready now\n- Pick one idea that solves a real problem for people you know — at school, at home or in your community.\n- Build it as an **app playground** in Swift Playgrounds or Xcode, and keep the experience short and clear.\n"
                    "- Write down *why* you built it: the written answers matter as much as the code.\n- Test it with real users and improve it before the window opens.\n\n"
                    "Check the official page for eligibility and rules when the next round is announced. Our coding and Apple-tech classes run project clinics for Swift Student Challenge entries.",
              "th": "Swift Student Challenge คือการแข่งขันเขียนโค้ดประจำปีของ Apple สำหรับนักเรียนนักศึกษา รอบปี 2026 เปิดรับผลงานวันที่ 6–28 กุมภาพันธ์ 2026 และประกาศผู้ชนะช่วงปลายเดือนมีนาคม ก่อนงาน WWDC\n\n"
                    "ณ วันที่ 30 ตุลาคม 2026 Apple ยังไม่ประกาศวันของปี 2027 ในช่วงหลายปีที่ผ่านมามักประกาศในเดือนตุลาคมหรือพฤศจิกายน และเปิดรับผลงานในเดือนกุมภาพันธ์\n\n"
                    "## เตรียมตัวตั้งแต่ตอนนี้\n- เลือกไอเดียเดียวที่แก้ปัญหาจริงของคนรอบตัว ที่โรงเรียน ที่บ้าน หรือในชุมชน\n- สร้างเป็น **app playground** ด้วย Swift Playgrounds หรือ Xcode ให้ใช้งานสั้นและเข้าใจง่าย\n"
                    "- เขียนอธิบายว่า *ทำไม* ถึงสร้างผลงานนี้ คำตอบที่เขียนสำคัญไม่แพ้โค้ด\n- ให้ผู้ใช้จริงทดลองและปรับปรุงก่อนเปิดรับสมัคร\n\n"
                    "เมื่อประกาศรอบใหม่ โปรดตรวจคุณสมบัติและกติกาจากหน้าทางการ คลาสโค้ดดิ้งและเทคโนโลยี Apple ของเรามีคลินิกโปรเจกต์สำหรับผู้ที่จะส่งผลงาน"},
     "tags": ["Swift", "Apple", "Coding"],
     "sources": [{"title": "Apple Developer — Swift Student Challenge", "url": "https://developer.apple.com/swift-student-challenge/"}]},
    {"slug": "using-ai-for-homework-the-right-way", "category": "ai", "days": 10, "cover": ("#4f46e5", "#0e8fa8", "AI for learning — the right way", "AI"),
     "title": {"en": "Using AI for homework the right way: a tutor, not a ghost-writer",
               "th": "ใช้ AI ทำการบ้านอย่างถูกวิธี: ให้เป็นติวเตอร์ ไม่ใช่คนเขียนแทน"},
     "summary": {"en": "AI can explain, quiz you and check your reasoning. Copying its answers skips the learning — and schools can tell. Five habits that help.",
                 "th": "AI ช่วยอธิบาย ตั้งคำถาม และตรวจวิธีคิดได้ แต่การลอกคำตอบทำให้ข้ามการเรียนรู้ และครูดูออก นี่คือ 5 นิสัยที่ช่วยได้จริง"},
     "body": {"en": "AI chat tools are now part of student life. Used well, they make you learn faster; used badly, they hide the gaps you need to fix before an exam.\n\n"
                    "## Five good habits\n- **Try first, then ask.** Write your own attempt, then ask the AI to find the mistake — not to give the answer.\n"
                    "- **Ask for hints in steps.** \"Give me only the first step\" keeps the thinking yours.\n- **Make it quiz you.** Ask for five questions on today's topic and answer them without notes.\n"
                    "- **Check facts.** AI can be confidently wrong, especially about dates, numbers and rules. Confirm with your textbook or an official site.\n"
                    "- **Follow your school's rules** and say when you used AI.\n\n"
                    "In exams such as the SAT, IELTS or school entrance tests there is no AI — so the goal is always that *you* can do it alone. Our teachers show students how to use AI as a study partner in class.",
              "th": "เครื่องมือแชต AI กลายเป็นส่วนหนึ่งของชีวิตนักเรียนแล้ว ถ้าใช้เป็นจะเรียนได้เร็วขึ้น แต่ถ้าใช้ผิดจะซ่อนจุดอ่อนที่ต้องแก้ก่อนสอบ\n\n"
                    "## 5 นิสัยที่ดี\n- **ลองทำเองก่อน แล้วค่อยถาม** เขียนวิธีของตัวเองก่อน แล้วให้ AI ช่วยหาจุดผิด ไม่ใช่ให้เฉลย\n"
                    "- **ขอคำใบ้ทีละขั้น** เช่น \"บอกแค่ขั้นแรก\" เพื่อให้เรายังเป็นคนคิดเอง\n- **ให้ AI ตั้งคำถามทดสอบ** ขอ 5 ข้อจากเรื่องที่เรียนวันนี้ แล้วตอบโดยไม่เปิดโน้ต\n"
                    "- **ตรวจข้อเท็จจริง** AI อาจตอบผิดอย่างมั่นใจ โดยเฉพาะวันที่ ตัวเลข และกติกา ควรตรวจกับหนังสือเรียนหรือเว็บไซต์ทางการ\n"
                    "- **ทำตามกฎของโรงเรียน** และบอกครูเมื่อใช้ AI\n\n"
                    "ในห้องสอบอย่าง SAT, IELTS หรือสอบเข้าโรงเรียนไม่มี AI ให้ใช้ เป้าหมายจึงต้องเป็น *เราทำเองได้* เสมอ ครูของเราสอนวิธีใช้ AI เป็นเพื่อนคู่เรียนในชั้นเรียน"},
     "tags": ["AI", "Study skills"], "sources": []},
    {"slug": "live-class-same-screen-teacher-and-students", "category": "stem", "days": 12, "cover": ("#0e8fa8", "#4f46e5", "Live class · one set, two screens", "LIVE"),
     "title": {"en": "Live class: teacher and students on the same question set",
               "th": "ห้องเรียนสด: ครูและนักเรียนทำชุดข้อสอบเดียวกันพร้อมกัน"},
     "summary": {"en": "Teachers share a screen without the key, students answer on their own devices, and the class sees the results together — paced or self-paced.",
                 "th": "ครูแชร์จอที่ไม่มีเฉลย นักเรียนตอบจากเครื่องตัวเอง แล้วดูผลพร้อมกันทั้งห้อง ทั้งแบบครูพาทำและแบบทำเองทั้งชุด"},
     "body": {"en": "Our classrooms now run **live classes** on the same question sets used for online tests and printed papers.\n\n"
                    "- **Teacher-paced:** the teacher opens one question at a time, locks it, then reveals the answer and the class results.\n"
                    "- **Self-paced:** students work through the whole set; the teacher watches progress live.\n"
                    "- The teacher's own screen shows the key and a results grid; the **shared screen** on the projector never shows the key before the reveal, or any student names.\n"
                    "- Students can bring the **student PDF** of the same set with a notes column beside each question.\n\n"
                    "Results from real classes also help us calibrate how hard each question really is, so practice tests stay close to the real exam.",
              "th": "ชั้นเรียนของเราใช้ **ห้องเรียนสด** กับชุดข้อสอบเดียวกับที่ใช้สอบออนไลน์และพิมพ์เป็นเอกสาร\n\n"
                    "- **ครูพาทำทีละข้อ:** ครูเปิดทีละข้อ ปิดรับคำตอบ แล้วเฉลยพร้อมผลของทั้งห้อง\n"
                    "- **นักเรียนทำเองทั้งชุด:** นักเรียนทำครบทั้งชุด ครูดูความคืบหน้าได้ทันที\n"
                    "- จอของครูมีเฉลยและตารางผล ส่วน **จอที่แชร์** ขึ้นโปรเจกเตอร์จะไม่แสดงเฉลยก่อนเวลาและไม่แสดงชื่อนักเรียน\n"
                    "- นักเรียนพิมพ์ **PDF ฉบับนักเรียน** ของชุดเดียวกันที่มีช่องจดโน้ตข้างแต่ละข้อมาใช้ได้\n\n"
                    "ผลจากชั้นเรียนจริงยังช่วยให้เราปรับระดับความยากของแต่ละข้อ เพื่อให้ข้อสอบฝึกใกล้เคียงข้อสอบจริงมากที่สุด"},
     "tags": ["Live class", "EdTech"], "sources": []},
]


def seed(con):
    """Publish the starter posts once. Returns how many were added."""
    import blog
    r = con.execute("SELECT value FROM kv WHERE key='blogSeed'").fetchone()
    done = json.loads(r["value"]) if r else {"v": 0, "slugs": []}
    if done.get("v", 0) >= V:
        return 0
    cfg = blog.settings(con)
    from datetime import datetime, timedelta, timezone
    now = datetime.now(timezone.utc).replace(microsecond=0)
    n = 0
    for x in POSTS:
        if x["slug"] in done["slugs"] or con.execute("SELECT 1 FROM blog_posts WHERE slug=?", (x["slug"],)).fetchone():
            done["slugs"].append(x["slug"]); continue
        p = blog.new_post(con, cfg, x["category"], "DeepDistrict")
        blog.clean_edit(p, {k: x[k] for k in ("title", "summary", "body", "tags", "sources")}, cfg, images.check_cover)
        try:
            p["cover"], p["coverKind"] = _cover(*x["cover"]), "drawing"
        except Exception:  # noqa: BLE001 — a missing cover never blocks the post
            p["cover"], p["coverKind"] = "", ""
        p["slug"] = blog.unique_slug(con, x["slug"], p["id"])
        p["publishedAt"] = (now - timedelta(days=x["days"], hours=2)).isoformat()
        blog.set_status(p, "published", cfg, "DeepDistrict")
        p["seed"] = True
        blog.put(con, p)
        done["slugs"].append(x["slug"]); n += 1
    done["v"] = V
    con.execute("INSERT INTO kv (key, value) VALUES ('blogSeed', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", (json.dumps(done),))
    return n
