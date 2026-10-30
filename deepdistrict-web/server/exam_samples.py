"""Sample items for a new exam bank — all written by DeepDistrict (original, not taken from any official
or published test). They let staff try every screen before the real bank is built. They are tagged
"sample" and can be retired at any time. A full SAT mock needs at least 54 approved questions and an
IELTS Reading mock needs 3 passages that add up to 40 questions; these samples are only a start.
"""

SAT = [
    {"domain": "cs", "skill": "words-in-context", "difficulty": "e",
     "passage": "In the shallow lagoons along the Andaman coast, seagrass grows so densely that it ______ the movement of water. "
                "As currents slow down, fine sand and mud settle to the bottom, and the water above the meadows becomes noticeably clearer.",
     "stem": "Which choice completes the text with the most logical and precise word or phrase?",
     "choices": ["hastens", "impedes", "reveals", "imitates"], "answer": 1,
     "explanation": {"en": "The text says the currents 'slow down' because of the seagrass, so the grass impedes (hinders) the water's movement. 'Hastens' is the opposite; 'reveals' and 'imitates' do not describe an effect on movement.",
                     "th": "ข้อความบอกว่ากระแสน้ำ 'ช้าลง' เพราะหญ้าทะเล จึงต้องเป็น impedes (ขัดขวาง) ส่วน hastens มีความหมายตรงข้าม และ reveals/imitates ไม่ได้บอกผลต่อการไหลของน้ำ"}},
    {"domain": "cs", "skill": "text-structure", "difficulty": "m",
     "passage": "For many years, historians assumed that potters in the river village of Na Rai simply copied the painted designs of their neighbours. "
                "A closer study of the red swirls on Na Rai jars, however, found patterns that appear nowhere else in the region before the village's own pottery. "
                "Researchers now argue that the designs were a local invention that later spread outward along river trade routes.",
     "stem": "Which choice best describes the overall structure of the text?",
     "choices": ["It presents an earlier view, offers evidence that challenges it, and states a revised conclusion.",
                 "It describes a research method and then explains why the method is unreliable.",
                 "It compares two villages and argues that one produced better pottery.",
                 "It traces a trade route and predicts how it will change in the future."], "answer": 0,
     "explanation": {"en": "The text opens with what historians 'assumed', gives new evidence ('however… found patterns…'), and ends with what researchers 'now argue' — an old view, a challenge, a new conclusion.",
                     "th": "ข้อความเริ่มด้วยความเชื่อเดิม ตามด้วยหลักฐานใหม่ที่ขัดแย้ง (however…) และจบด้วยข้อสรุปใหม่ (now argue)"}},
    {"domain": "ii", "skill": "central-ideas", "difficulty": "e",
     "passage": "Students at a Chiang Mai secondary school noticed that the school's lunch area produced a large amount of food waste. "
                "Instead of simply throwing it away, they built a small composting system behind the science building. Within a semester, "
                "the compost was feeding the school's vegetable garden, and the vegetables were being served back in the lunch area.",
     "stem": "Which choice best states the main idea of the text?",
     "choices": ["Students turned a waste problem into a resource that benefited their school.",
                 "The science building at the school was too small for a garden.",
                 "Composting takes longer than one semester to produce results.",
                 "The lunch area served only vegetables grown at the school."], "answer": 0,
     "explanation": {"en": "The text follows food waste becoming compost, then vegetables served at lunch: a problem turned into a benefit. The other choices add details the text does not state or contradict it.",
                     "th": "ใจความหลักคือ นักเรียนเปลี่ยนขยะอาหารให้เป็นปุ๋ยและผักกลับมาใช้ในโรงเรียน ตัวเลือกอื่นเพิ่มข้อมูลที่ไม่มีในข้อความหรือขัดกับข้อความ"}},
    {"domain": "ii", "skill": "inferences", "difficulty": "h",
     "passage": "Engineers testing a new bicycle helmet recorded how much force reached a dummy's head during falls. Helmets with a thin inner layer "
                "that can slide slightly against the outer shell reduced the twisting force on the head by about a third compared with ordinary helmets. "
                "Straight-on impacts, however, were absorbed equally well by both designs. This suggests that the main advantage of the sliding layer ______",
     "stem": "Which choice most logically completes the text?",
     "choices": ["appears in falls where the head is twisted rather than hit straight on.",
                 "is that it makes helmets lighter and cheaper to produce.",
                 "is greatest in straight-on impacts at high speed.",
                 "cannot be measured with a test dummy."], "answer": 0,
     "explanation": {"en": "The sliding layer helped only with twisting force; straight-on impacts were the same for both. So its advantage shows up in twisting falls. Weight, cost and measurement limits are not discussed.",
                     "th": "ชั้นที่เลื่อนได้ช่วยลดแรงบิดเท่านั้น ส่วนแรงกระแทกตรง ๆ ได้ผลเท่ากัน จึงสรุปได้ว่าข้อดีจะเห็นในการล้มที่ศีรษะถูกบิด"}},
    {"domain": "sec", "skill": "boundaries", "difficulty": "m",
     "passage": "The robotics club spent three months designing and building its desert rover ______ before the national competition, the team tested it on sand, gravel, and steep wooden ramps.",
     "stem": "Which choice completes the text so that it conforms to the conventions of Standard English?",
     "choices": ["rover,", "rover;", "rover", "rover, and,"], "answer": 1,
     "explanation": {"en": "Two independent clauses ('The robotics club spent…' and 'the team tested it…') must be joined correctly. A semicolon does this. A comma alone makes a comma splice; no punctuation makes a run-on; 'and,' adds a wrong comma.",
                     "th": "มีอนุประโยคอิสระสองประโยค ต้องเชื่อมด้วยเครื่องหมาย ; การใช้ , อย่างเดียวผิด (comma splice) และการไม่ใส่อะไรเลยเป็นประโยคต่อกันผิดหลัก"}},
    {"domain": "sec", "skill": "form-structure-sense", "difficulty": "e",
     "passage": "The collection of insect specimens donated by the school's former science teachers ______ now on display in the library, where visitors can examine each specimen with a magnifying glass.",
     "stem": "Which choice completes the text so that it conforms to the conventions of Standard English?",
     "choices": ["are", "were", "is", "have been"], "answer": 2,
     "explanation": {"en": "The subject is 'collection' (singular), not 'specimens' or 'teachers', and the sentence is in the present ('now'). So the verb is 'is'.",
                     "th": "ประธานคือ collection (เอกพจน์) และเป็นปัจจุบัน (now) จึงใช้ is"}},
    {"domain": "eoi", "skill": "transitions", "difficulty": "m",
     "passage": "Solar panels convert sunlight into electricity less efficiently when they become very hot. ______ installers in Thailand often mount panels with a gap underneath so that moving air can carry heat away from them.",
     "stem": "Which choice completes the text with the most logical transition?",
     "choices": ["Nevertheless,", "For this reason,", "Similarly,", "In contrast,"], "answer": 1,
     "explanation": {"en": "The second sentence is a result of the first: heat lowers efficiency, so installers cool the panels. 'For this reason' shows cause and effect.",
                     "th": "ประโยคที่สองเป็นผลของประโยคแรก (ความร้อนทำให้ประสิทธิภาพลด จึงติดตั้งให้มีช่องระบายอากาศ) ต้องใช้ For this reason"}},
    {"domain": "eoi", "skill": "rhetorical-synthesis", "difficulty": "h",
     "passage": "While researching a topic, a student has taken the following notes:\n"
                "- Kites were used in parts of Asia more than 2,000 years ago.\n"
                "- Some early kites were made of silk and bamboo.\n"
                "- Later, kites made of paper became popular because paper was cheaper.\n"
                "- Modern sport kites are often made of nylon and carbon fibre.\n"
                "- Nylon and carbon fibre are light and very strong.",
     "stem": "The student wants to emphasize a difference between early kites and modern sport kites. Which choice most effectively uses relevant information from the notes to accomplish this goal?",
     "choices": ["Whereas some early kites were made of silk and bamboo, modern sport kites are often made of light, strong nylon and carbon fibre.",
                 "Kites have been used in parts of Asia for more than 2,000 years.",
                 "Paper kites became popular because paper was cheaper than silk.",
                 "Nylon and carbon fibre are light and very strong materials."], "answer": 0,
     "explanation": {"en": "Only the first choice contrasts early kites with modern sport kites ('Whereas…'). The others give one fact without a comparison.",
                     "th": "มีเพียงตัวเลือกแรกที่เปรียบเทียบว่าวสมัยก่อนกับว่าวกีฬาสมัยใหม่ (Whereas…) ตัวเลือกอื่นให้ข้อมูลด้านเดียว"}},
]

READING = [{
    "title": "Listening to the city",
    "difficulty": 1,
    "paragraphs": [
        "For most of human history, the loudest sounds people heard came from nature: thunder, waterfalls, the calls of animals. The rapid growth of cities "
        "in the twentieth century changed this. Road traffic, construction and air-conditioning units created a constant background of noise that, for many "
        "city dwellers, never fully disappears, even at night. Scientists who study sound in urban areas now argue that this background deserves the same "
        "attention as air or water quality, because its effects on health and learning are larger than many people assume. Unlike smoke or dirty water, "
        "however, noise leaves no visible trace, and this may be one reason why it has received less attention from governments and the public.",
        "Measuring city noise is more complicated than it first appears. A single reading from a sound meter shows how loud a place is at one moment, but noise "
        "changes from minute to minute and from street to street. Researchers therefore place networks of small, low-cost sensors on lamp posts and rooftops, "
        "which record sound levels continuously for weeks. In one recent project in a large Southeast Asian city, a team installed more than two hundred sensors "
        "and found that two streets only a few hundred metres apart could differ in average night-time noise by as much as fifteen decibels. Because the decibel scale is logarithmic, a difference of this size "
        "means that one street is several times louder than the other, a fact that would have been invisible in a single afternoon survey. The data also "
        "showed clear weekly rhythms, with the quietest hours falling early on Sunday mornings.",
        "Such differences matter because the human body reacts to noise even when the mind has stopped noticing it. Studies of sleep in laboratories show that "
        "sudden sounds, such as a motorbike accelerating, can raise the heart rate of a sleeping person without waking them. Over months and years, repeated "
        "disturbances of this kind are linked with tiredness, stress and higher blood pressure. Children appear to be especially sensitive: schools located beside "
        "busy roads tend to report lower reading scores, although researchers are careful to point out that other factors, such as family income, may also play a part. Teachers in such schools report that they must pause or repeat instructions when heavy vehicles "
        "pass, and that pupils find it harder to concentrate on long reading tasks.",
        "Not all city sound is harmful, however. Researchers distinguish between noise, which people experience as unwanted, and the wider 'soundscape' of a place, "
        "which includes pleasant sounds such as birdsong, running water and distant voices. In surveys, residents often describe a busy market as lively rather than "
        "noisy, even when sound meters show that it is as loud as a main road. What seems to matter is whether a sound is expected, whether it carries useful "
        "information and whether people feel they have some control over it. A neighbour's music, for example, is usually judged more annoying than a waterfall of the same "
        "loudness, partly because the listener cannot switch it off and partly because it competes for attention.",
        "This insight has encouraged a new approach to urban planning. Instead of trying only to reduce loudness, some planners now design spaces that offer "
        "'acoustic refuges': quiet courtyards, parks screened by trees, and walkways where the sound of traffic is masked by fountains. In one district, replacing "
        "a concrete wall with a planted earth bank lowered traffic noise only slightly, yet residents reported that the area felt far calmer, apparently because "
        "the vegetation hid the road from view and attracted birds. Planners have concluded that what people see can change how they "
        "judge what they hear, so the visual design of a street is part of its sound design.",
        "Technology may also help. Electric buses and motorbikes are much quieter at low speeds than vehicles with petrol engines, and several cities have begun "
        "to replace their fleets. Yet experts warn that quieter vehicles do not solve the problem on their own: at higher speeds, most of the noise from any vehicle "
        "comes from its tyres touching the road. For this reason, the most effective strategies combine cleaner vehicles with lower speed limits, quieter road "
        "surfaces and careful decisions about where homes and schools are built.",
    ],
    "groups": [
        {"type": "headings", "instructions": "Reading Passage 1 has six paragraphs, A–F. Choose the correct heading for paragraphs B–F from the list of headings below.",
         "options": [{"key": "i", "text": "Why loudness alone does not explain how people feel about sound"},
                     {"key": "ii", "text": "The difficulty of building affordable sensors"},
                     {"key": "iii", "text": "Collecting reliable information about noise"},
                     {"key": "iv", "text": "Hidden effects on the body and on learning"},
                     {"key": "v", "text": "Designing places where people can escape noise"},
                     {"key": "vi", "text": "A complete solution from electric vehicles"},
                     {"key": "vii", "text": "Why new vehicles are only part of the answer"},
                     {"key": "viii", "text": "The history of complaints about city noise"}],
         "questions": [{"text": "Paragraph B", "answer": ["iii"]}, {"text": "Paragraph C", "answer": ["iv"]}, {"text": "Paragraph D", "answer": ["i"]},
                       {"text": "Paragraph E", "answer": ["v"]}, {"text": "Paragraph F", "answer": ["vii"]}]},
        {"type": "tfng", "instructions": "Do the following statements agree with the information given in Reading Passage 1? Write TRUE if the statement agrees with the information, FALSE if the statement contradicts the information, NOT GIVEN if there is no information on this.",
         "questions": [{"text": "A single sound-meter reading gives a complete picture of the noise in a place.", "answer": ["FALSE"]},
                       {"text": "Noise in nearby streets can differ greatly at night.", "answer": ["TRUE"]},
                       {"text": "Researchers are certain that road noise is the only cause of lower reading scores.", "answer": ["FALSE"]},
                       {"text": "Most residents in the surveys preferred markets to parks.", "answer": ["NOT GIVEN"]}]},
        {"type": "sentence-completion", "instructions": "Complete the sentences below. Choose NO MORE THAN TWO WORDS from the passage for each answer.",
         "wordLimit": {"words": 2, "number": False},
         "questions": [{"text": "Sensors that record sound for weeks are fixed to rooftops and ______.", "answer": ["lamp posts"]},
                       {"text": "Some planners create quiet spaces that are described as ______.", "answer": ["acoustic refuges"]},
                       {"text": "At higher speeds, most vehicle noise is produced by the ______.", "answer": ["tyres", "tires"]}]},
        {"type": "mcq-multi", "instructions": "Choose TWO letters, A–E.",
         "questions": [{"text": "Which TWO ways of making city sound less harmful are described in the passage?",
                        "options": [{"key": "A", "text": "using plants and earth to hide a road from view"},
                                    {"key": "B", "text": "replacing petrol vehicles with quieter electric ones"},
                                    {"key": "C", "text": "giving residents noise-cancelling headphones"},
                                    {"key": "D", "text": "banning all traffic at night"},
                                    {"key": "E", "text": "building taller concrete walls beside roads"}],
                        "answer": ["A", "B"]}]},
    ],
}]

WRITING = [
    {"task": 1, "visual": "table",
     "prompt": "The table below shows the average number of hours per day that students in four age groups in one city spent on screens outside school in 2016 and 2024.\n\n"
               "Summarise the information by selecting and reporting the main features, and make comparisons where relevant.\n\nWrite at least 150 words.",
     "table": {"title": "Average daily screen time outside school (hours)",
               "rows": [["Age group", "2016", "2024"], ["10–12", "1.8", "3.1"], ["13–15", "2.6", "4.2"], ["16–18", "3.4", "4.9"], ["19–21", "3.9", "4.6"]]}},
    {"task": 2, "essayType": "opinion",
     "prompt": "Some people believe that students should be allowed to use artificial intelligence tools for their homework, while others think this "
               "prevents them from learning important skills.\n\nTo what extent do you agree or disagree that AI tools should be allowed for homework?\n\n"
               "Give reasons for your answer and include any relevant examples from your own knowledge or experience.\n\nWrite at least 250 words."},
]


def all_items():
    out = []
    for x in SAT:
        out.append(dict(x, kind="sat"))
    for x in READING:
        out.append(dict(x, kind="ielts-r", labelled=True))
    for x in WRITING:
        out.append(dict(x, kind="ielts-w"))
    for x in out:
        x.update({"status": "approved", "origin": "original", "rightsOk": True, "tags": ["sample"]})
    return out
