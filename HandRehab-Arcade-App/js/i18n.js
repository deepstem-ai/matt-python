// ============================================================
// i18n.js — สลับภาษาไทย/อังกฤษทั้งหน้า โดยไม่ต้องแก้ HTML ของแต่ละหน้า
//
// วิธีทำงาน
//   เดินดูข้อความทุกจุดในหน้า แล้วเทียบกับพจนานุกรมด้านล่าง
//   ข้อความไหนมีคำแปลก็สลับให้ ข้อความไหนยังไม่มีคำแปลก็คงภาษาไทยไว้ตามเดิม
//   จำภาษาที่เลือกไว้ใน localStorage ครั้งหน้าเปิดมาได้ภาษาเดิม
//   เฝ้าดูหน้าด้วย MutationObserver ข้อความที่เพิ่มมาทีหลังก็แปลให้ด้วย
//
// เพิ่มคำแปลใหม่   ใส่คู่ 'ข้อความไทย': 'English text' ลงใน DICT ได้เลย
// ห้ามแก้ข้อความไทยฝั่งซ้ายถ้าไม่ได้แก้ในหน้า HTML ด้วย ไม่งั้นจะจับคู่ไม่เจอ
// ============================================================

import { APP_DICT } from './i18n-dict-app.js';

const KEY = 'hr-lang';
const PREFS = 'hr-prefs';

// อ่าน/เขียนภาษาผ่านชุดตั้งค่าเดียวกับที่หน้าตั้งค่าของแอปใช้
// จะได้ไม่เป็นคนละค่ากันระหว่างปุ่มลัดกับหน้าตั้งค่า
function readLang() {
  try {
    const p = JSON.parse(localStorage.getItem(PREFS) || '{}');
    if (p && (p.lang === 'en' || p.lang === 'th')) return p.lang;
  } catch (e) { /* ไม่เป็นไร */ }
  try { return localStorage.getItem(KEY) || 'th'; } catch (e) { return 'th'; }
}

function writeLang(lang) {
  try {
    const p = JSON.parse(localStorage.getItem(PREFS) || '{}');
    p.lang = lang;
    localStorage.setItem(PREFS, JSON.stringify(p));
  } catch (e) { /* ไม่เป็นไร */ }
  try { localStorage.setItem(KEY, lang); } catch (e) { /* ไม่เป็นไร */ }
}

const DICT = {
  // ---------- หน้าบทความวิจัย ----------
  'บทความวิจัยของโครงงาน': 'The project\u2019s research paper',
  'บทความวิจัยของโครงงาน · HandRehab Arcade': 'The project\u2019s research paper · HandRehab Arcade',
  'HandRehab Arcade · หน้านี้บอกว่าบทความไปถึงไหน ขาดอะไร และเลขแต่ละตัวมาจากหน้าไหนในแอป':
    'HandRehab Arcade · where the paper stands, what is missing, and which page in the app produces each number',
  'จะส่งที่ไหน': 'Where it will be submitted',
  'เวทีหลัก': 'Main venue',
  'เวทีสำรอง': 'Fallback venue',
  'ส่งที่เดียวเท่านั้น': 'Submit to one venue only',
  'ทั้งสองเวทีห้ามส่งงานที่กำลังพิจารณาอยู่ที่อื่น การส่งทั้งสองที่พร้อมกันเป็นการประพฤติมิชอบทางวิชาการ และอาจถูกถอนบทความทั้งสองที่':
    'Both venues forbid submitting work that is under review elsewhere. Submitting to both at once is academic misconduct and can get the paper withdrawn from both.',
  'บทความไปถึงไหนแล้ว': 'How far the paper has got',
  'เขียนเสร็จแล้วทั้งฉบับ เหลือช่องว่าง 11 จุด · ตรวจนับเมื่อ 10 พ.ย. 2569':
    'Fully written, 11 gaps remain · counted on 10 November 2026',
  'สี': 'Colour',
  'เหลือ': 'Left',
  'ติดอะไร': 'Blocked on',
  'ส้ม': 'Orange',
  'แดง': 'Red',
  'น้ำเงิน': 'Blue',
  'เลขในบทความมาจากหน้าไหน': 'Which page produces each number',
  'ตารางที่ 3 · อัตราเฟรม': 'Table III · frame rate',
  'ตารางที่ 4 · เปรียบเทียบตัวกรอง': 'Table IV · filter comparison',
  'เพิ่มคุณภาพ · Lab 32': 'Raises quality · Lab 32',
  'เพิ่มคุณภาพ · Lab 21': 'Raises quality · Lab 21',
  'ยังไม่อยู่ในบทความฉบับนี้ ถ้ารันแล้วจะเพิ่มหัวข้อให้ได้ ใช้เวลาราว 1 ชั่วโมง':
    'Not in this version of the paper yet. Run it and a section can be added. About one hour.',
  'สมการที่บทความรายงาน': 'The equations the paper reports',
  'สมการ': 'Equation',
  'ทำอะไร': 'What it does',
  'อยู่ในโค้ดไฟล์ไหน': 'Which code file',
  'สิ่งที่บทความนี้อ้างไม่ได้': 'What this paper may not claim',
  'ห้ามอ้างสามข้อนี้ ไม่ว่าตัวเลขจะออกมาสวยแค่ไหน': 'Never claim these three, however good the numbers look',
  'ลำดับถัดไป': 'What comes next',
  'งานวิจัย': 'Research',
  'เอกสาร': 'Document',
  'บทความไปถึงไหน ขาดอะไร และเลขแต่ละตัวมาจากหน้าไหน':
    'Where the paper stands, what is missing, and which page produces each number',
  'เวทีที่จะส่ง · ช่องว่างที่เหลือ · สมการทั้งเจ็ด · สิ่งที่อ้างไม่ได้':
    'Target venue · remaining gaps · all seven equations · what may not be claimed',

  // ---------- ชื่อหน้าและหัวข้อหลัก ----------
  'เลือกสิ่งที่จะเปิด': 'Choose what to open',
  'เลือกสิ่งที่จะเปิด — HandRehab Arcade': 'Choose what to open — HandRehab Arcade',
  'HandRehab Arcade · หน้านี้คือจุดเริ่ม ไม่ต้องจำชื่อไฟล์': 'HandRehab Arcade · start here, no need to remember file names',
  'HandRehab Arcade — เกมบริหารมือ': 'HandRehab Arcade — hand exercise games',
  'เกมบริหารมือและนิ้ว ด้วย AI มองเห็นมือ 21 จุด': 'Hand and finger exercise games, with AI that sees 21 hand points',
  'ทดสอบความลื่นของเครื่อง': 'Frame-rate benchmark',
  'ทดสอบความลื่นของเครื่อง · HandRehab Arcade': 'Frame-rate benchmark · HandRehab Arcade',
  'เปรียบเทียบตัวกรองสัญญาณ · HandRehab Arcade': 'Signal filter comparison · HandRehab Arcade',
  'วัดความแม่นยำ': 'Accuracy measurement',
  'วัดความแม่นยำ · HandRehab Arcade': 'Accuracy measurement · HandRehab Arcade',
  'ความถูกต้องการนับ · HandRehab Arcade': 'Counting accuracy · HandRehab Arcade',
  'ปรับเทียบมือของฉัน': 'Calibrate my hand',
  'ปรับเทียบมือของฉัน · HandRehab Arcade': 'Calibrate my hand · HandRehab Arcade',
  'ล้างแคช — HandRehab Arcade': 'Clear cache — HandRehab Arcade',
  'ล้างแคชของหน้านี้': 'Clear this site’s cache',

  // ---------- เมนู ----------
  'เล่นเกม': 'Play',
  'เปิดแอปตามปกติ': 'Open the app as usual',
  'เปิดแอปหลัก': 'Open the main app',
  'หน้าแรก เลือกเกม ดูความก้าวหน้า ตั้งค่า': 'Home: pick a game, see progress, settings',
  'สี่หน้าที่ต้องรันเพื่อส่งบทความ': 'Four pages you must run for the paper',
  'รันแล้วกดปุ่มส่งออก CSV แล้วเอาไฟล์ไปวางที่โฟลเดอร์': 'Run it, export the CSV, then put the file in the folder',
  'ต้องรัน · Lab 21': 'Required · Lab 21',
  'ต้องรัน · Lab 27': 'Required · Lab 27',
  'ต้องรัน · Lab 32': 'Required · Lab 32',
  'ต้องรัน · Lab 33': 'Required · Lab 33',
  'วัดความเร็วเครื่อง': 'Measure this computer’s speed',
  'ตั้งชื่อเครื่อง กดวัด รอครบ 6 ฉาก · เปิดกล้องไว้เฉย ๆ ไม่ต้องทำท่า':
    'Name the machine, press start, wait for all 6 scenarios · leave the camera on, no gestures needed',
  'เปรียบเทียบตัวกรอง': 'Compare the filters',
  'ก่อน อย่ากดปลายนิ้วจริง · ไม่ต้องใช้กล้องเลย': 'first, do not press real fingertip · no camera needed at all',
  'ความแม่นยำตามระดับแสง': 'Accuracy by light level',
  'ท่าจีบนิ้ว 10 ครั้ง ในแสง 3 ระดับ · คนเดิมทั้งสามระดับ ห้ามสลับคน':
    'Pinch 10 times at each of 3 light levels · the same person at all three, never swap people',
  'ความแม่นยำการนับครั้ง': 'Repetition counting accuracy',
  'ทำจำนวนครั้งที่รู้ล่วงหน้า 5 ชุด · จดด้วยว่าชุดไหนนับเกิน ชุดไหนนับขาด':
    'Do a known number of repetitions, 5 sets · note which set over-counted and which under-counted',
  'หน้าอื่นที่ใช้บ่อย': 'Other pages you may want',
  'ไม่ต้องรันเพื่อส่งบทความ แต่เปิดดูได้': 'Not required for the paper, but you can open them',
  'ไม่บังคับ': 'Optional',
  'วัดจุดพักและจุดจีบสุดของแต่ละคน ใช้เวลาราว 1 นาที':
    'Measures each person’s resting and fully-pinched anchors, about one minute',
  'ห้องวิจัยและการสอบ': 'Research room and assessment',
  'รวมหน้าแลปทั้งหมดและเกณฑ์การวัดผล': 'All lab pages and the measurement criteria',
  'คณิตศาสตร์ของฉัน': 'My mathematics',
  'ดูค่าที่ระบบคำนวณสดทีละเฟรม ใช้ตรวจว่าสมการทำงานจริง':
    'Watch the values the system computes live, frame by frame, to check the equations really work',
  'ความก้าวหน้า': 'Progress',
  'ประวัติการฝึกและสถิติรายวัน': 'Training history and daily statistics',
  'เครื่องมือช่วย': 'Helper tools',
  'แก้ปัญหา': 'Troubleshooting',
  'เปิดแล้วเจอเป็นแอปอื่น': 'Opened and got a different app',
  'กดปุ่มเดียว ล้างของที่ค้างแล้วพากลับมาเอง · ไม่กระทบเว็บอื่นในเครื่อง':
    'One button clears what is stuck and brings you back · other sites on this computer are untouched',
  'ลำดับที่แนะนำสำหรับวันนี้': 'Suggested order for today',
  'เลือกสัญญาณจำลอง แล้วส่งออก CSV': 'choose the synthetic signal, then export the CSV',
  'ทำ 30 ครั้ง แล้วส่งออก CSV': 'do 30 trials, then export the CSV',
  'ทำ 5 ชุด แล้วส่งออก CSV': 'do 5 sets, then export the CSV',
  'แล้วส่งออก CSV': 'then export the CSV',
  'เอาไฟล์ทั้งสี่ไปวางที่': 'Put all four files in',
  'แล้วบอกครูนุ่มว่ารันครบแล้ว': 'then tell the teacher that all runs are done',
  'ห้ามใช้ไฟล์ในโฟลเดอร์ demo-samples': 'Never use the files in the demo-samples folder',
  'ไฟล์ชุดนั้นขึ้นต้นด้วย DEMO เป็นข้อมูลตัวอย่างไว้ดูรูปแบบไฟล์เท่านั้น ไม่ใช่ผลการวัดจริง ถ้าเอาตัวเลขจากไฟล์ชุดนั้นไปใส่บทความ จะกลายเป็นการรายงานข้อมูลที่ไม่ได้เก็บจริง':
    'Those files start with DEMO. They exist only to show the file format and are not real measurements. Putting their numbers in the paper would mean reporting data that was never collected.',
  'ปิดโปรแกรม กด Ctrl + C ในหน้าต่างสีดำ': 'To stop the program, press Ctrl + C in the black window',

  // ---------- หน้าล้างแคช ----------
  'ใช้หน้านี้เมื่อเปิดแอปแล้ว': 'Use this page when you open the app and',
  'เจอเป็นแอปอื่น': 'get a different app',
  'หรือเจอหน้าเก่าที่แก้ไปแล้วแต่ไม่เปลี่ยน': 'or see an old page that does not change after you edit it',
  'สาเหตุคือเว็บแอปตัวอื่นที่เคยเปิดที่': 'The cause is another web app previously opened at',
  'พอร์ตเดียวกัน ฝังตัวช่วยจำที่เรียกว่า service worker ไว้ มันเลยดักแล้วส่งของเก่าให้แทน':
    'on the same port. It left behind a helper called a service worker, which intercepts and serves the old files instead.',
  'ล้างทุกอย่างของหน้านี้': 'Clear everything for this site',
  'ล้างแล้วจะไม่กระทบเว็บอื่นในเครื่อง': 'Clearing does not affect other sites on this computer',
  'ล้างเฉพาะที่อยู่นี้เท่านั้น': 'Only this address is cleared',
  'ล้างเสร็จจะพากลับไปหน้าแอปให้เอง': 'When done it takes you back to the app automatically',

  // ---------- ปุ่มและแถบบนสุด ----------
  'หน้าหลัก': 'Home',
  'เมนูหลัก': 'Main menu',
  'ย้อนกลับ': 'Back',
  'เต็มจอ': 'Full screen',
  'เต็มจอ (สำหรับสาธิต)': 'Full screen (for demos)',
  'ตั้งค่า': 'Settings',
  '⚙ ตั้งค่า': '⚙ Settings',
  '⚙ ตั้งค่า / ปรับเทียบ': '⚙ Settings / calibration',
  'ยังไม่เข้าสู่ระบบ': 'Not signed in',
  'เข้าสู่ระบบ': 'Sign in',
  'ออกจากระบบ': 'Sign out',
  'ลงทะเบียน': 'Register',
  'ผู้ใช้': 'User',
  '🔐 ไปหน้าเข้าสู่ระบบ': '🔐 Go to sign-in',
  '🔐 กำลังไปหน้าเข้าสู่ระบบ…': '🔐 Going to sign-in…',

  // ---------- เกม ----------
  'เกม': 'Games',
  '🎮 เลือกเกม': '🎮 Choose a game',
  '🎮 เล่นเกม': '🎮 Play',
  'ทุกเกม': 'All games',
  'จับดาวใส่ประตูมิติ': 'Catch the star, drop it in the portal',
  '⭐ จับดาว': '⭐ Catch the star',
  '⭐ ไปเล่นจับดาว': '⭐ Go play Catch the star',
  'ฝึกจีบนิ้ว (โป้ง + ชี้) · หยิบของชิ้นเล็ก': 'Trains pinching (thumb + index) · picking up small objects',
  'ฝึกจีบนิ้ว (โป้ง + ชี้) · หยิบของชิ้นเล็ก · เมาส์ได้': 'Trains pinching (thumb + index) · picking up small objects · mouse works too',
  'เคาะจังหวะทีละนิ้ว': 'Tap the rhythm, one finger at a time',
  '🎵 เคาะจังหวะ': '🎵 Rhythm tap',
  'ฝึกแตะนิ้วทีละนิ้ว · ความคล่องของนิ้ว': 'Trains tapping each finger separately · finger agility',
  'ฝึกแตะนิ้วทีละนิ้ว · ความคล่องของนิ้ว · ปุ่ม 1-5 ได้': 'Trains tapping each finger separately · finger agility · keys 1-5 work too',
  'กางนิ้วผ่านกำแพง': 'Spread your fingers through the wall',
  '🐠 กางนิ้ว': '🐠 Spread',
  'ฝึกกางนิ้ว · ยืดกล้ามเนื้อมือ': 'Trains finger spreading · stretches the hand muscles',
  'ฝึกกางนิ้ว · ยืดกล้ามเนื้อมือ · ล้อเมาส์ได้': 'Trains finger spreading · stretches the hand muscles · mouse wheel works too',
  'ทุกเกมเล่นด้วยมือหน้ากล้อง หรือใช้เมาส์/คีย์บอร์ดในโหมดสาธิตก็ได้':
    'Every game is played with your hand in front of the camera, or with mouse and keyboard in demo mode',
  'วันนี้พร้อมบริหารมือหรือยัง? เลือกเมนูด้านล่างได้เลย': 'Ready to exercise your hands today? Pick from the menu below',
  '🏠 สวัสดี': '🏠 Hello',
  'วันนี้ฝึกแล้ว': 'Practised today',
  'วันติดต่อกัน': 'day streak',
  'วันติดต่อกัน ดูความก้าวหน้า': 'day streak · see progress',
  '📈 ความก้าวหน้า': '📈 Progress',
  'ประวัติการฝึก': 'Training history',
  'กราฟพัฒนาการ': 'Progress chart',

  // ---------- ปรับเทียบ ----------
  '🎯 ปรับเทียบ': '🎯 Calibrate',
  '🎯 ปรับเทียบมือของฉัน': '🎯 Calibrate my hand',
  '🎯 ปรับเทียบมือก่อนเล่น (แนะนำ)': '🎯 Calibrate before playing (recommended)',
  '1 · อธิบาย': '1 · Explain',
  '2 · ถือนิ่ง': '2 · Hold still',
  '3 · ทำท่า 5 ครั้ง': '3 · Do it 5 times',
  '4 · ผลลัพธ์': '4 · Result',
  'ขั้นตอน': 'Step',
  'เกณฑ์จีบรายคน · รัศมีจับ · อาการสั่น': 'Per-person pinch threshold · grab radius · tremor',
  'เริ่มรอบนี้ด้วยกล้อง': 'Start this round with the camera',
  '🖐 โหมดสาธิต (มือจำลอง)': '🖐 Demo mode (synthetic hand)',
  'มือจำลอง': 'Synthetic hand',

  // ---------- วัดความเร็วเครื่อง ----------
  '⚡ ทดสอบความลื่นของเครื่อง': '⚡ Frame-rate benchmark',
  '💻 เครื่องนี้': '💻 This machine',
  'ชื่อเครื่อง (เช่น "ห้องคอม 2 เครื่อง 15")': 'Machine name (e.g. "Computer room 2, machine 15")',
  'ตั้งชื่อให้จำได้ว่าเป็นเครื่องไหน': 'Give it a name you will recognise later',
  '🧪 ทดสอบอัตโนมัติ 6 สถานการณ์': '🧪 Automatic test, 6 scenarios',
  'เริ่มทดสอบอัตโนมัติ': 'Start the automatic test',
  'สถานการณ์': 'Scenario',
  'สถานการณ์ละ': 'each scenario',
  'วินาที (รวมประมาณ': 'seconds (about',
  'นาที) · ภาพกล้อง 640×480 · อย่าสลับไปหน้าต่างอื่นระหว่างทดสอบ':
    'minutes in total) · camera 640×480 · do not switch to another window during the test',
  'กด "เริ่มทดสอบ" แล้วนั่งหน้ากล้อง ยกมือให้กล้องเห็นระหว่างทดสอบมือ (ถ้าไม่เห็นมือ ระบบจะวาดมือตัวอย่างแทน)':
    'Press Start, sit in front of the camera and hold your hand up during the hand scenarios (if no hand is seen, a sample hand is drawn instead)',
  'FPS เฉลี่ย': 'Mean FPS',
  'FPS ต่ำสุด': 'Minimum FPS',
  'ms ต่อเฟรม': 'ms per frame',
  'FPS · แนะนำความละเอียด/เอฟเฟกต์': 'FPS · recommends resolution and effects',
  '💡 คำแนะนำสำหรับเครื่องนี้': '💡 Recommendation for this machine',
  'ทดสอบให้เสร็จก่อน แล้วคำแนะนำจะมาอยู่ตรงนี้': 'Finish the test and the recommendation will appear here',
  'ใช้ค่าแนะนำทันที': 'Use the recommended settings now',
  'แล้วกด "ใช้ค่าแนะนำ"': 'then press Use the recommended settings',
  'สิ่งที่จะเสียไปถ้าใช้ค่านี้:': 'What you give up with these settings:',
  'ไม่แน่ใจว่าเครื่องนี้ไหวแค่ไหน?': 'Not sure how much this machine can handle?',
  '🖥 เปรียบเทียบหลายเครื่อง': '🖥 Compare several machines',
  '📤 ส่งออกไฟล์ผล (ให้เครื่องอื่น)': '📤 Export results (for another machine)',
  '📥 นำเข้าผลจากเครื่องอื่น': '📥 Import results from another machine',
  'เก็บผลจากเพื่อนอย่างน้อย 5 เครื่อง: ให้เพื่อนเปิดหน้านี้ ทดสอบ กด "ส่งออกไฟล์ผล" แล้วนำไฟล์มากด "นำเข้า" ที่เครื่องนี้':
    'Collect results from at least 5 machines: have a friend open this page, run the test, press Export, then import that file here',
  'เป้าหมาย (บทความ หัวข้อ V.B): อัตราเฟรม ≥ 25 FPS · ตัดสินภาพรวมจาก "เกมเต็ม" (หรือสถานการณ์หลักที่ช้าที่สุดถ้าไม่มี)':
    'Target (paper หัวข้อ V.B): frame rate ≥ 25 FPS · judged on the full game scenario, or the slowest main scenario if that is missing',
  'ความละเอียดกล้อง': 'Camera resolution',
  '480×360 (เครื่องเบา)': '480×360 (light machines)',
  'กล้องที่ใช้': 'Camera in use',
  'กล้องเริ่มต้น': 'Default camera',
  '🔄 หากล้องใหม่': '🔄 Find cameras again',

  // ---------- ตัวกรองสัญญาณ ----------
  '📈 เปรียบเทียบตัวกรองสัญญาณ': '📈 Signal filter comparison',
  'ตัวกรองสัญญาณ': 'Signal filters',
  'เปรียบเทียบ One Euro / ค่าเฉลี่ย': 'Compare One Euro / moving average',
  '〰 สัญญาณจำลอง': '〰 Synthetic signal',
  'สัญญาณจำลอง': 'Synthetic signal',
  '📷 ปลายนิ้วจริง': '📷 Real fingertip',
  'ความแรงอาการสั่น': 'Tremor amplitude',
  'ความถี่อาการสั่น': 'Tremor frequency',
  'อาการสั่นจำลอง': 'Simulated tremor',
  'ตั้งค่าตัวกรอง': 'Filter settings',
  'ค่าเฉลี่ยเคลื่อนที่': 'Moving average',
  'มัธยฐาน': 'Median',
  'ดิบ': 'Raw',
  'ค่าเฉลี่ย / มัธยฐาน · N': 'Mean / median · N',
  'ตารางเปรียบเทียบ 3 ตัวกรอง': 'Comparison of the three filters',
  'ตัวเลขสด (10 วินาทีล่าสุด)': 'Live numbers (last 10 seconds)',
  '⏸ หยุดกราฟ': '⏸ Pause the chart',
  '▶ คำนวณใหม่ด้วยค่าปัจจุบัน': '▶ Recompute with the current settings',
  'กราฟเปรียบเทียบสัญญาณดิบกับสัญญาณที่กรองแล้ว': 'Chart comparing the raw signal with the filtered signal',
  'เส้นดิบ = ตำแหน่งปลายนิ้วชี้แนวนอน (0-1 ของความกว้างภาพ) · One Euro ปรับความแรงการกรองตามความเร็ว: ขยับช้า = กรองแรง นิ่ง, ขยับเร็ว = กรองเบา ตามทัน (Casiez et al., CHI 2012)':
    'The raw line is the horizontal position of the index fingertip (0–1 of the image width). One Euro adapts its strength to speed: slow movement is filtered hard and looks steady, fast movement is filtered lightly and keeps up (Casiez et al., CHI 2012)',
  'ภาพที่ 1 ตำแหน่งปลายนิ้วชี้ก่อนและหลังกรอง 6 วินาทีล่าสุด (แกนตั้ง: ตำแหน่งแนวนอน 0-1 · แกนนอน: เวลา วินาที)':
    'Figure 1. Index fingertip position before and after filtering, last 6 seconds (vertical: horizontal position 0–1 · horizontal: time in seconds)',
  'สัญญาณจำลองแบบเดิมทุกครั้ง (seed คงที่) 20 วินาที 30 fps · ลดสั่น % = 1 − SD(ผลต่างเฟรม กรองแล้ว) / SD(ผลต่างเฟรม ดิบ) · หน่วง = cross-correlation · ขั้นบันได = เวลาที่ใช้ไปถึง 90% ของการกระโดด':
    'The same synthetic signal every time (fixed seed), 20 seconds at 30 fps · jitter reduction % = 1 − SD(frame differences, filtered) / SD(frame differences, raw) · lag = cross-correlation · step = time to reach 90% of a jump',
  '🖼 บันทึกกราฟ PNG': '🖼 Save the chart as PNG',
  '🖼️ PNG กราฟ': '🖼️ Chart PNG',
  'ลดลงครึ่งหนึ่ง': 'halved',
  'HandRehab Arcade · ทีม NeonHands · โรงเรียนของเรา · อ้างอิง: Casiez, G., Roussel, N., &amp; Vogel, D. (2012). 1€ Filter. CHI \'12, 2527–2530.':
    'HandRehab Arcade · team NeonHands · our school · Reference: Casiez, G., Roussel, N., & Vogel, D. (2012). 1€ Filter. CHI ’12, 2527–2530.',

  // ---------- วัดความแม่นยำ ----------
  '📊 วัดความแม่นยำแบบนักวิจัย': '📊 Accuracy measurement, research style',
  '📊 ผลการทดสอบ': '📊 Test results',
  '1) ตั้งค่าการทดลอง': '1) Set up the experiment',
  '2) การทดลองเรื่องแสง': '2) The lighting experiment',
  '3) ผลลัพธ์': '3) Results',
  'ตัวชี้วัด (Metrics)': 'Metrics',
  'ความหมายของตัวชี้วัด (คัดลอกไปใส่รายงานได้)': 'What each metric means (you can copy this into the report)',
  'ตารางความสับสน (Confusion matrix) — กดที่ช่องเพื่อดูตัวอย่าง': 'Confusion matrix — click a cell to see examples',
  '🖼️ PNG ตารางความสับสน': '🖼️ Confusion matrix PNG',
  'ความแม่นยำตามสภาพแสง': 'Accuracy by lighting condition',
  'ทุกสภาพแสง': 'All lighting conditions',
  'ระดับแสง': 'Light level',
  'สว่าง': 'Bright',
  'ปกติ': 'Normal',
  'มืด': 'Dim',
  'ความสว่างที่วัดได้': 'Measured brightness',
  'ความสว่างที่วัดได้ (0–255)': 'Measured brightness (0–255)',
  'ความสว่างเฉลี่ย': 'Mean brightness',
  'จำนวนครั้งต่อท่า ต่อสภาพแสง': 'Trials per gesture, per lighting condition',
  'เลือกสภาพแสง ปรับไฟในห้องให้ตรง แล้วกดเริ่ม · ทำครบ 3 รอบ (สว่าง / ปกติ / มืด)':
    'Choose the lighting, set the room lights to match, then press start · complete all 3 rounds (bright / normal / dim)',
  'โหมดจำลอง (ครบ 3 แสง ไม่ต้องใช้กล้อง)': 'Simulation mode (all 3 light levels, no camera needed)',
  'เกมที่ใช้ทดสอบ': 'Game used for the test',
  'ตัวตรวจแบบกฎ 5 ท่า (js/gestures.js · Lab 19-20)': 'Rule-based detector, 5 gestures (js/gestures.js · Lab 19–20)',
  'โมเดล kNN จากหน้าสอน AI (Lab 31)': 'kNN model from the Train AI page (Lab 31)',
  '⚠️ ข้อมูลทดสอบต้องแยกจากข้อมูลฝึกเสมอ': '⚠️ Test data must always be kept separate from training data',
  '— ทำท่าใหม่ทุกครั้ง อย่าใช้ตัวอย่างเดิมที่ใช้สอน AI (โหมด kNN: ข้อมูลที่เก็บในหน้านี้':
    '— perform the gestures fresh every time, never reuse the samples used to train the AI (kNN mode: data collected on this page',
  'ไม่ถูกเพิ่มเข้าโมเดลเด็ดขาด': 'is never added to the model',
  'หน้านี้เรียกแค่ predict) · ถ้าได้เกิน 99% ให้สงสัยก่อนว่าทดสอบกับข้อมูลชุดเดียวกับที่ฝึกหรือเปล่า':
    'this page only calls predict) · if you get over 99%, first suspect that you tested on the same data you trained on',
  'Evaluate — ตารางความสับสน · precision / recall / F1 · การทดลองเรื่องแสง 3 ระดับ · ใช้จุดที่แก้สัดส่วนภาพแล้ว (hand.sq) ทั้งกล้องจริงและโหมดจำลอง':
    'Evaluate — confusion matrix · precision / recall / F1 · the 3-level lighting experiment · uses aspect-corrected points (hand.sq) for both the real camera and simulation mode',
  'ตอบสมมติฐานข้อที่': 'Answers hypothesis number',
  'อภิปรายผล (สร้างจากตัวเลขจริง)': 'Discussion (generated from the real numbers)',
  '📋 คัดลอกย่อหน้า': '📋 Copy the paragraph',
  '📂 นำเข้าโมเดล JSON': '📂 Import a JSON model',
  '🧠 สอน AI': '🧠 Train AI',

  // ---------- ความถูกต้องการนับ ----------
  '🎯 ความถูกต้องของการนับ (ระบบ vs ผู้สังเกต)': '🎯 Counting accuracy (system vs human observer)',
  'ความถูกต้องการนับ': 'Counting accuracy',
  'ความถูกต้องเฉลี่ย %': 'Mean accuracy %',
  'ความแม่นยำรวม': 'Overall accuracy',
  'ถูกต้อง %': 'Correct %',
  'MAE (ครั้ง)': 'MAE (repetitions)',
  'ระบบนับ': 'System count',
  'ผู้สังเกตนับ': 'Observer count',
  'เซสชัน (กรอกจำนวนที่ผู้สังเกตนับ แล้วระบบบันทึกทันที)': 'Sessions (type the observer’s count and it is saved immediately)',
  'กรอกจำนวนที่ผู้สังเกตนับจากวิดีโอของแต่ละเซสชัน · accuracy = 1 − |ระบบ − ผู้สังเกต| / ผู้สังเกต · MAE · แยกตามระดับแสง 3 ระดับ':
    'Enter the count the observer made from the video of each session · accuracy = 1 − |system − observer| / observer · MAE · split by the 3 light levels',
  'ระดับแสงเริ่มต้นแนะนำจากความสว่างที่วัดได้ (≥ 140 สว่าง · 80–139 ปกติ · &lt; 80 มืด) เปลี่ยนเองได้ตามสภาพจริงตอนถ่ายวิดีโอ · บันทึกใน settings key "count-accuracy"':
    'The suggested light level comes from the measured brightness (≥ 140 bright · 80–139 normal · < 80 dim). Change it to match the real conditions when the video was taken · stored under the settings key "count-accuracy"',
  'กราฟแท่งความถูกต้องการนับแยกตามระดับแสง': 'Bar chart of counting accuracy by light level',
  'แสดงเฉพาะที่กรอกแล้ว': 'Show only completed rows',
  'แสดงตาราง': 'Show the table',
  'รวมข้อมูลจำลอง': 'Include simulated data',
  '🧪 ใส่ตัวอย่าง 12 เซสชัน': '🧪 Insert 12 sample sessions',
  '🧹 ลบตัวอย่างของหน้านี้': '🧹 Delete this page’s samples',
  '🤖 ข้อมูลจำลอง — ห้ามใช้ในรายงาน': '🤖 Simulated data — never use in the report',
  '💾 บันทึกผลลงฐานข้อมูล': '💾 Save results to the database',
  'ผลที่บันทึกไว้': 'Saved results',
  'ยังไม่มีผล': 'No results yet',
  'วันเวลา': 'Date and time',
  'ครั้ง': 'reps',
  'ค่า': 'Value',
  'ค่าที่ดู': 'Value shown',
  'เกณฑ์': 'Criterion',
  'ป้ายกำกับ': 'Label',
  'ความสำเร็จ': 'Success',
  'ทดสอบ': 'Test',

  // ---------- ตั้งค่า ----------
  'ขนาด ธีม โหมดสงบ กล้อง สไตล์มือ ติดตั้งแอป': 'Size, theme, calm mode, camera, hand style, install the app',
  '🔠 ขนาดหน้าจอ (โปรไฟล์)': '🔠 Display size (profile)',
  '🙂 มาตรฐาน': '🙂 Standard',
  '👵 ผู้สูงอายุ (ใหญ่ขึ้น)': '👵 Older adults (larger)',
  '🖥 จอใหญ่ติดผนัง': '🖥 Large wall display',
  '🎨 ธีมสี': '🎨 Colour theme',
  'โหมดสว่าง': 'Light mode',
  'โหมดสงบ (หยุดการเคลื่อนไหว ปิดเสียงและพลุ)': 'Calm mode (stops motion, turns off sound and fireworks)',
  'ปิดอนุภาค': 'Turn off particles',
  'เอฟเฟกต์ในเกม': 'In-game effects',
  '✋ เรียบง่าย': '✋ Simple',
  '✨ นีออน': '✨ Neon',
  '☄ หางแสง': '☄ Light trail',
  '📷 กล้องและการแสดงมือ': '📷 Camera and hand display',
  'เลือกแล้วเห็นผลทันที ค่าที่เลือกจะถูกจำไว้ครั้งหน้า': 'Changes apply immediately and are remembered next time',
  '📲 ติดตั้งเป็นแอป': '📲 Install as an app',
  'ติดตั้งแอปลงเครื่อง': 'Install the app on this computer',
  'วิธีติดตั้งทีละขั้น': 'Step-by-step installation',
  '📦 ใช้งานแบบไม่มีอินเทอร์เน็ต': '📦 Use without internet',
  'คู่มือเตรียมเครื่องออฟไลน์': 'Offline setup guide',
  'ตรวจไฟล์ออฟไลน์ทั้งหมด': 'Check all offline files',
  'แอปหาไฟล์ AI / ฟอนต์ ในโฟลเดอร์ของแอปก่อน (vendor/ models/ fonts/) ถ้าไม่มีจึงโหลดจากอินเทอร์เน็ต เตรียมไฟล์ด้วย tools/download-assets':
    'The app looks for the AI and font files inside its own folders first (vendor/ models/ fonts/) and only then downloads them. Prepare the files with tools/download-assets',
  'ตั้ง / เปลี่ยน PIN': 'Set / change PIN',
  'ทางเลือกแทนใบหน้า': 'Alternative to face sign-in',
  'ใช้เข้าสู่ระบบด้วยหน้า': 'Used for face sign-in',
  'เก็บใบหน้า': 'Capture face',
  '4 ขั้นตอน + เก็บใบหน้า': '4 steps + face capture',
  '📝 ลงทะเบียนเพื่อเก็บประวัติของตัวเอง': '📝 Register to keep your own history',
  '🎮 กำลังเล่นแบบไม่ลงทะเบียน — ผลการเล่นเก็บไว้ในเครื่องนี้ใต้ชื่อ “guest” (ใช้ร่วมกันทุกคนที่เลือกแบบนี้)':
    '🎮 Playing without registering — results are stored on this computer under "guest", shared by everyone who plays this way',

  // ---------- เครื่องมือวิจัย ----------
  '🔬 ห้องวิจัย': '🔬 Research room',
  '🔬 สำหรับครูและนักวิจัย': '🔬 For teachers and researchers',
  'เครื่องมือวิจัย': 'Research tools',
  'ชุดข้อมูล · สอน AI · ประเมินผล · แบบสอบถาม · รายงาน': 'Datasets · train AI · evaluate · survey · report',
  'ทุกรอบ ทุกท่า · ตัวกรอง · CSV': 'Every round, every gesture · filters · CSV',
  'ตัวเลขสรุป · กราฟ 3 เส้น · ปฏิทิน · บันทึก PNG': 'Summary numbers · 3-line chart · calendar · save as PNG',
  'ค้นหา แก้ไข ลบ ส่งออก': 'Search, edit, delete, export',
  '🔒 ตรึงเกณฑ์สำหรับการวัดผล': '🔒 Freeze the thresholds for measurement',
  'เปิดสวิตช์ = ล็อกเกณฑ์ของท่านั้นไว้ (ปรับเทียบใหม่ต้องยืนยันปลดล็อกก่อน) · เซสชันที่เล่นหลังล็อกจะมีป้าย 🔒 ในหน้าประวัติ และกรองได้ในเครื่องมือวิจัย':
    'Switching this on locks that gesture’s threshold (recalibrating asks you to unlock first) · sessions played after locking are marked 🔒 in the history and can be filtered in the research tools',
  '🔒 เฉพาะเซสชันเกณฑ์ตรึง': '🔒 Frozen-threshold sessions only',
  '⬇ CSV ตาราง': '⬇ Table CSV',
  '⬇️ CSV ทุกครั้งทดสอบ': '⬇️ CSV of every trial',
  '🖼 บันทึก PNG': '🖼 Save as PNG',

  // ---------- สถานะและคำทั่วไป ----------
  'กำลังโหลด…': 'Loading…',
  'กำลังตรวจ…': 'Checking…',
  'กำลังเริ่ม...': 'Starting…',
  'ความคืบหน้าการโหลด': 'Loading progress',
  'เปิด': 'Open',
  'หยุด': 'Stop',
  '⏹ หยุด': '⏹ Stop',
  'เต็ม': 'Full',
  'กดปุ่ม': 'Press the button',
  'กดค้าง = ทำท่า (หรือกด Space ค้าง)': 'Hold = perform the gesture (or hold Space)',
  '✊ กดค้าง = ทำท่า': '✊ Hold = perform the gesture',
  '/ 5 นาที': '/ 5 minutes',
  '0 · ไม่สั่น': '0 · no tremor',
  '1 · เล็กน้อย': '1 · slight',
  '2 · ปานกลาง': '2 · moderate',
  '3 · มาก': '3 · severe',
  'ไอคอน 16px': '16px icon',
  'ไอคอน 32px': '32px icon',
  'ไอคอน 64px': '64px icon',
  'ไอคอน 128px': '128px icon',
  'ไอคอนแอปหลายขนาด': 'App icons in several sizes',
  'ทีม NeonHands · โรงเรียนของเรา': 'Team NeonHands · our school',
  'HandRehab Arcade · ทีม NeonHands · โรงเรียนของเรา': 'HandRehab Arcade · team NeonHands · our school',
  'HandRehab Arcade · ทีม NeonHands · โรงเรียนของเรา · ถ้าย้ายกล้องหรือเปลี่ยนเครื่อง ให้ปรับเทียบใหม่':
    'HandRehab Arcade · team NeonHands · our school · recalibrate if you move the camera or change machine',
  '→ ไฟล์ที่มีคอลัมน์ lighting, requested, detected': '→ a file with the columns lighting, requested, detected',
  '→ ไฟล์ที่มีคอลัมน์ test, actual, counted': '→ a file with the columns test, actual, counted',
};

// รวมคำแปลของข้อความที่ JavaScript สร้างสดเข้ามาด้วย
// ถ้าคีย์ซ้ำกัน ให้ของเดิมใน DICT ชนะ เพราะเขียนเจาะจงบริบทของหน้า HTML ไว้แล้ว
for (const [k, v] of Object.entries(APP_DICT)) if (!(k in DICT)) DICT[k] = v;

// ข้อความที่มีตัวเลขแปรผัน จับคู่ด้วยพจนานุกรมตรง ๆ ไม่ได้ จึงใช้กฎแบบแพตเทิร์น
// ใส่กฎใหม่ได้ แต่ต้องเจาะจงพอ ไม่งั้นจะไปแปลข้อความอื่นโดยไม่ตั้งใจ
const PATTERNS = [
  [/^\/\s*(\d+)\s*เซสชัน$/u,                 (m) => `/ ${m[1]} sessions`],
  [/^(\d+)\s*วัน$/u,                          (m) => `${m[1]} days`],
  [/^(\d*)\s*วัน\s*·\s*ดีที่สุด\s*(\d+)\s*วัน$/u, (m) => `${m[1] || 0} days \u00b7 best ${m[2]} days`],
  [/^(\d+)\s*ครั้ง$/u,                        (m) => `${m[1]} reps`],
  [/^(\d+)\s*เครื่อง$/u,                      (m) => `${m[1]} machines`],
  [/^การ์ดจอ:\s*(.+)$/u,                      (m) => `Graphics: ${m[1]}`],
  [/^\/\s*(\d+)\s*·\s*จอ\s*(.+)$/u,           (m) => `/ ${m[1]} · screen ${m[2]}`],
  [/^⚠\s*ขาด\s*(\d+)\s*ไฟล์:\s*(.+)$/u,      (m) => `⚠ ${m[1]} files missing: ${m[2]}`],
  [/^✔\s*ไฟล์ในเครื่องครบ\s*(\d+)\/(\d+)$/u,  (m) => `✔ all ${m[1]}/${m[2]} local files present`],
  [/^โมเดลมือพร้อม\s*\((.+)\)$/u,             (m) => `Hand model ready (${m[1]})`],
  [/^ยังไม่มีไฟล์ออฟไลน์\s*(\d+)\s*ไฟล์.*$/u,
    (m) => `${m[1]} offline files are still missing, so the internet is needed for now (click the badge at the bottom left to see which)`],
  [/^⚠\s*ขาด\s*(\d+)\s*ไฟล์$/u,           (m) => `\u26a0 ${m[1]} files missing`],
  [/^รายละเอียด:\s*โหลดไลบรารี AI ไม่สำเร็จ[^(]*(\(.*)?$/u,
    (m) => `Details: the AI library failed to load. Check your internet, or prepare the offline files as in Lab 35. ${m[1] || ''}`.trim()],
  [/^รายละเอียด:\s*(.+)$/u,                  (m) => `Details: ${m[1]}`],
  // เพิ่มสำหรับสี่หน้าที่ใช้ถ่ายภาพลงบทความ
  [/^(\d+(?:\.\d+)?)\s*วิ$/u,                  (m) => `${m[1]} s`],
  [/^(\d+(?:\.\d+)?)\s*วินาที$/u,              (m) => `${m[1]} s`],
  [/^ต้องนับได้\s*(\d+)\s*(?:ครั้ง|reps)$/u,     (m) => `Should count ${m[1]} reps`],
  [/^(.+):\s*สองประตู\s*(\d+)\s*(?:ครั้ง|reps)\s*·\s*เกณฑ์เดียว\s*(\d+)\s*(?:ครั้ง|reps)$/u,
    (m) => `${m[1]}: two gates ${m[2]} reps \u00b7 single threshold ${m[3]} reps`],
  [/^ประตูเข้า\s*enter\s*([\d.]+)$/u,           (m) => `enter gate ${m[1]}`],
  [/^ประตูออก\s*exit\s*([\d.]+)$/u,             (m) => `exit gate ${m[1]}`],
  [/^เกณฑ์เดียว\s*([\d.]+)$/u,                   (m) => `single threshold ${m[1]}`],
  [/^(\d+)\s*vs\s*เกณฑ์เดียว\s*(\d+)$/u,        (m) => `${m[1]} vs ${m[2]} with a single threshold`],
  [/^ยังไม่ปรับเทียบ\s*\(ใช้ค่ามาตรฐาน\s*d_open\s*([\d.]+)\s*\/\s*d_close\s*([\d.]+)\)$/u,
    (m) => `Not calibrated yet, using the defaults d_open ${m[1]} / d_close ${m[2]}`],
  [/^สองประตู\s*(\d+)\s*ครั้ง\s*·\s*เกณฑ์เดียว\s*(\d+)\s*ครั้ง$/u,
    (m) => `two gates ${m[1]} reps \u00b7 single threshold ${m[2]} reps`],
  [/^คลื่นสะอาด\s*(\d+)\s*รอบ$/u,               (m) => `Clean wave, ${m[1]} cycles`],
  [/^คลื่นเดิม \+ สัญญาณรบกวน$/u,                 () => 'Same wave with noise added'],
  [/^แกว่ง\s*([\d.–-]+)\s*ตลอด$/u,              (m) => `Oscillating between ${m[1]} throughout`],
  [/^(.+):\s*two gates\s*(\d+)\s*reps\s*·\s*single threshold\s*(\d+)\s*reps$/u,
    (m) => `${m[1]}: two gates ${m[2]} reps \u00b7 single threshold ${m[3]} reps`],
];

function byPattern(str) {
  for (const [re, fn] of PATTERNS) {
    const m = str.match(re);
    if (m) return fn(m);
  }
  return null;
}

// ------------------------------------------------------------
const ATTRS = ['placeholder', 'title', 'aria-label', 'alt', 'value'];
const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'TEXTAREA']);

const norm = (s) => s.replace(/\s+/g, ' ').trim();

// เก็บของเดิมไว้ที่ตัว text node เอง ไม่ใช่ที่ element แม่
// เพราะ element เดียวอาจมีข้อความหลายชิ้น ถ้าเก็บที่แม่จะทับกันและข้อความจะซ้ำ
const TEXT_TH = new WeakMap();
const TEXT_EN = new WeakMap();

function translateNode(root, toEn) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      if (!n.nodeValue || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      if (n.parentElement && SKIP.has(n.parentElement.tagName)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const nodes = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n);

  for (const n of nodes) {
    if (!TEXT_TH.has(n)) {
      const key = norm(n.nodeValue);
      const en = DICT[key] || byPattern(key);
      if (!en) continue;
      // คงช่องว่างหัวท้ายของเดิมไว้ ไม่งั้นคำจะติดกัน
      const lead = n.nodeValue.match(/^\s*/)[0];
      const tail = n.nodeValue.match(/\s*$/)[0];
      TEXT_TH.set(n, n.nodeValue);
      TEXT_EN.set(n, lead + en + tail);
    }
    const want = toEn ? TEXT_EN.get(n) : TEXT_TH.get(n);
    if (want != null && n.nodeValue !== want) n.nodeValue = want;
  }

  const els = root.querySelectorAll ? root.querySelectorAll('*') : [];
  for (const el of els) {
    for (const a of ATTRS) {
      const cur = el.getAttribute && el.getAttribute(a);
      if (!cur) continue;
      const slot = 'i18n' + a.replace(/-/g, '');
      if (!el.dataset[slot]) {
        const en = DICT[norm(cur)];
        if (!en) continue;
        el.dataset[slot] = cur;
        el.dataset[slot + 'En'] = en;
      }
      const want = toEn ? el.dataset[slot + 'En'] : el.dataset[slot];
      if (want != null && cur !== want) el.setAttribute(a, want);
    }
  }

  if (root === document.body && DICT[norm(document.title)]) {
    if (!document.documentElement.dataset.i18nTitleTh) {
      document.documentElement.dataset.i18nTitleTh = document.title;
      document.documentElement.dataset.i18nTitleEn = DICT[norm(document.title)];
    }
  }
}

let current = 'th';
let observer = null;

function apply(lang) {
  current = lang;
  const toEn = lang === 'en';
  if (observer) observer.disconnect();
  translateNode(document.body, toEn);
  const t = document.documentElement.dataset;
  if (t.i18nTitleTh) document.title = toEn ? t.i18nTitleEn : t.i18nTitleTh;
  document.documentElement.lang = toEn ? 'en' : 'th';
  writeLang(lang);
  window.dispatchEvent(new CustomEvent('hr-lang-change', { detail: lang }));
  const btn = document.getElementById('i18nToggle');
  if (btn) {
    btn.textContent = toEn ? 'ไทย' : 'EN';
    btn.title = toEn ? 'สลับเป็นภาษาไทย' : 'Switch to English';
  }
  // ต้องเปิดตัวเฝ้าดูกลับทุกครั้ง  ของเดิมปิดแล้วไม่เคยเปิด เนื้อหาที่มาทีหลังจึงไม่ถูกแปล
  if (observer) observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  if (observer) observer.observe(document.body, { childList: true, subtree: true, characterData: true });
}

function addToggle() {
  // hud.js เป็นเจ้าของปุ่มสลับภาษาแล้ว ถ้ามี hud อยู่ก็ไม่ต้องสร้างปุ่มซ้ำ
  if (document.getElementById('hrHud') || document.getElementById('i18nToggle')) return;
  const b = document.createElement('button');
  b.id = 'i18nToggle';
  b.type = 'button';
  b.textContent = 'EN';
  b.setAttribute('aria-label', 'Switch language / สลับภาษา');
  b.style.cssText = [
    'position:fixed', 'right:14px', 'bottom:14px', 'z-index:2147483000',
    'min-width:52px', 'padding:9px 14px', 'border-radius:999px',
    'border:1px solid rgba(255,255,255,.28)', 'background:rgba(16,22,42,.92)',
    'color:#eef2ff', 'font:600 14px/1 system-ui,-apple-system,"Noto Sans Thai",sans-serif',
    'cursor:pointer', 'box-shadow:0 4px 14px rgba(0,0,0,.4)', 'backdrop-filter:blur(6px)',
  ].join(';');
  b.onclick = () => apply(current === 'en' ? 'th' : 'en');
  document.body.appendChild(b);
}

function start() {
  const saved = readLang();
  addToggle();
  const MAX_WAIT = 400;   // เพดานเวลา กันหน้าที่เปลี่ยน DOM ตลอดเวลา เช่น หน้าเกม
  const flush = () => {
    clearTimeout(observer._t);
    observer._t = null;
    observer._first = 0;
    observer.disconnect();
    translateNode(document.body, current === 'en');
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  };
  observer = new MutationObserver(() => {
    // เนื้อหาที่เพิ่มมาทีหลังก็แปลให้ด้วย ชะลอไว้เล็กน้อยกันทำงานถี่เกิน
    const now = Date.now();
    if (!observer._first) observer._first = now;
    if (now - observer._first >= MAX_WAIT) { flush(); return; }
    clearTimeout(observer._t);
    observer._t = setTimeout(flush, 80);
  });
  apply(saved);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
else start();

export function currentLang() { return current; }

// แปลข้อความเดี่ยว ใช้กับป้ายที่วาดลง canvas ซึ่งตัวจับ DOM เข้าไม่ถึง
// ภาษาไทยอยู่แล้วคืนค่าเดิม  ภาษาอังกฤษลองพจนานุกรมก่อน แล้วค่อยลองรูปแบบ
export function t(str) {
  if (current !== 'en' || typeof str !== 'string' || !str) return str;
  const k = norm(str);
  return DICT[k] || byPattern(k) || str;
}

export { apply, DICT };
