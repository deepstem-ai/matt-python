// ============================================================
// i18n-dict-app.js — คำแปลของข้อความที่ JavaScript สร้างขึ้นสด
//
// ชุดนี้คือเส้นทางที่ผู้ใช้เจอจริง  กล้อง ปรับเทียบ เกม ตั้งค่า วัดความเร็ว ตัวกรอง
// i18n.js จะรวมพจนานุกรมนี้เข้ากับของตัวเองตอนเริ่มทำงาน
//
// เพิ่มคำแปลใหม่  ใส่คู่ 'ข้อความไทย': 'English' ได้เลย
// ห้ามแก้ข้อความไทยฝั่งซ้ายถ้าไม่ได้แก้ในโค้ดด้วย ไม่งั้นจับคู่ไม่เจอ
// ============================================================
export const APP_DICT = {
  // ---------- ปุ่มและคำสั้น ----------
  'ยกเลิก': 'Cancel',
  'ตกลง': 'OK',
  'ข้าม': 'Skip',
  'ข้ามไปก่อน': 'Skip for now',
  'รอ': 'Wait',
  'มี': 'Yes',
  'ไม่มี': 'None',
  'ขาด': 'Missing',
  'แนะนำ': 'Recommended',
  'ระดับ': 'Tier',
  'เครื่อง': 'Machine',
  'นิ้ว': 'Finger',
  'มือ': 'Hand',
  'ใบหน้า': 'Face',
  'องศา': 'degrees',
  'ง่าย': 'Easy',
  'กลาง': 'Medium',
  'ยาก': 'Hard',
  'ปกติ': 'Normal',
  'ตัวกรอง': 'Filter',
  'การ์ดจอ': 'Graphics',
  'การ์ดจอ:': 'Graphics:',
  '🗑 ลบ': '🗑 Delete',
  '✔ ใช้เลย': '✔ Use it',
  '✔ พร้อมแล้ว': '✔ Ready',
  '✔ พร้อมแล้ว!': '✔ Ready!',
  '✖ ไม่มีในเครื่อง': '✖ Not on this computer',
  '= เท่าเดิม': '= unchanged',
  'ใช้ค่าเดิม': 'Keep the current setting',
  'กลับที่เดิม': 'Back to where it was',
  'เปลี่ยนกลับได้ทุกเมื่อ': 'You can change it back at any time',
  'ไม่ทราบสาเหตุ': 'Cause unknown',
  '— ครั้งแรก': '— first time',
  '— ตรวจอินเทอร์เน็ตแล้วลองใหม่': '— check your internet and try again',
  '↻ ลองอีกครั้ง': '↻ Try again',
  '↻ วัดใหม่': '↻ Measure again',
  '↻ ลองเปิดกล้องอีกครั้ง': '↻ Try the camera again',

  // ---------- บัญชีผู้ใช้ ----------
  'ยังไม่เข้าสู่ระบบ': 'Not signed in',
  'เข้าสู่ระบบ': 'Sign in',
  'ออกจากระบบ': 'Sign out',
  'ออกจากระบบแล้ว': 'Signed out',
  'หน้าหลัก': 'Home',
  'หน้าเปิดแอป': 'App start page',
  'เลือกเกม': 'Choose a game',
  'ตั้งค่า': 'Settings',
  '🎮 ผู้เล่นรับเชิญ (guest)': '🎮 Guest player',
  '🏠 สวัสดี ผู้เล่นรับเชิญ 👋': '🏠 Hello, guest player 👋',
  'เลิกเล่น / เข้าสู่ระบบ': 'Stop as guest / sign in',
  'เลิกเล่นแบบไม่ลงทะเบียนแล้ว': 'No longer playing as a guest',
  'เริ่มนับวันนี้เลย! ฝึกวันละ 5 นาที': 'Start your streak today. Five minutes a day.',

  // ---------- กล้อง ----------
  'กล้องเริ่มต้น': 'Default camera',
  'กล้องอย่างเดียว': 'Camera only',
  'ตรวจหากล้อง': 'Look for cameras',
  'กล้องยังไม่พร้อม': 'The camera is not ready',
  'เปิดกล้องไม่สำเร็จ': 'Could not open the camera',
  'ไม่พบกล้องเลย': 'No camera found',
  'ไม่พบกล้องในเครื่องนี้': 'No camera on this computer',
  'ไม่พบกล้องในเครื่องนี้ ตรวจว่าเสียบกล้อง USB แล้ว หรือกดข้ามเพื่อใช้โหมดสาธิตด้วยเมาส์':
    'No camera on this computer. Check that the USB camera is plugged in, or press Skip to use demo mode with the mouse.',
  'ยังไม่ได้รับอนุญาตให้ใช้กล้อง': 'Camera permission has not been granted',
  'กล้องถูกโปรแกรมอื่นใช้อยู่': 'Another program is using the camera',
  'เบราว์เซอร์นี้ใช้กล้องไม่ได้': 'This browser cannot use the camera',
  'เบราว์เซอร์นี้ไม่รองรับกล้อง': 'This browser does not support cameras',
  'อ่านรายชื่อกล้องไม่ได้:': 'Could not read the camera list:',
  'จำกล้องที่เลือกแล้ว ใช้ตั้งแต่เกมถัดไป': 'Camera saved, it will be used from the next game onwards',
  'ตรวจว่าเสียบกล้อง USB แน่นแล้ว หรือเครื่องมีกล้องในตัว จากนั้นกดลองใหม่':
    'Check that the USB camera is firmly plugged in, or that the computer has a built-in camera, then press Try again.',
  'กดรูปแม่กุญแจ 🔒 ข้างช่องที่อยู่เว็บ → เลือก "กล้อง" → เปลี่ยนเป็น "อนุญาต" แล้วกดปุ่มลองใหม่':
    'Click the padlock 🔒 next to the address bar → choose Camera → set it to Allow, then press Try again.',
  'ปิดโปรแกรมที่อาจใช้กล้อง เช่น Zoom, Teams, LINE, Discord, โปรแกรมอัดหน้าจอ หรือแท็บอื่นที่เปิดแอปนี้ค้างไว้ แล้วกดลองใหม่':
    'Close anything that might be using the camera — Zoom, Teams, LINE, Discord, a screen recorder, or another tab with this app open — then press Try again.',
  'กรุณาเปิดด้วย Google Chrome หรือ Microsoft Edge รุ่นใหม่ และเปิดผ่าน http://localhost เท่านั้น':
    'Please use a recent Google Chrome or Microsoft Edge, and open the app through http://localhost only.',
  'ลองกดปุ่มลองใหม่ ถ้ายังไม่ได้ให้รีสตาร์ตเบราว์เซอร์ (': 'Press Try again. If it still fails, restart the browser (',
  'ทดสอบต่อโดยไม่มีกล้อง': 'Continue the test without a camera',
  '📷 กำลังเปิดกล้อง…': '📷 Opening the camera…',
  '📷 ปลายนิ้วจริง': '📷 Real fingertip',
  '⏳ กำลังเปิดกล้องและโหลดโมเดล…': '⏳ Opening the camera and loading the model…',
  'กำลังเปิดกล้องและโหลดโมเดลมือ…': 'Opening the camera and loading the hand model…',
  '🖱 ใช้โหมดเมาส์แทน': '🖱 Use mouse mode instead',
  'เลื่อนเมาส์เข้ามาในจอ': 'Move the mouse onto the screen',

  // ---------- โมเดลและไฟล์ ----------
  'โหลดโมเดล AI จับมือ 21 จุด': 'Loading the 21-point hand model',
  'โหลดโมเดลมือไม่สำเร็จ': 'Could not load the hand model',
  'โมเดลมือพร้อม (': 'Hand model ready (',
  'โมเดลใบหน้าพร้อม': 'Face model ready',
  'เตรียมโมเดล AI ใบหน้า (เข้าสู่ระบบ)': 'Preparing the face model (for sign-in)',
  'โหลดโมเดลใบหน้าไม่สำเร็จ ข้ามได้ — ยังเข้าสู่ระบบด้วยรหัส PIN แทนการสแกนหน้าได้':
    'Could not load the face model. You can skip it and sign in with a PIN instead of a face scan.',
  'ดาวน์โหลดโมเดล AI มือไม่สำเร็จ ตรวจการเชื่อมต่ออินเทอร์เน็ต (ครั้งแรกต้องใช้เน็ต ประมาณ 8 MB) แล้วกดลองใหม่ หรือเล่นด้วยเมาส์ไปก่อน':
    'Could not download the hand model. Check your internet (the first run needs about 8 MB), then press Try again, or play with the mouse for now.',
  '📚 ไลบรารี AI': '📚 AI library',
  '🧠 โมเดล': '🧠 Model',
  '🔤 ฟอนต์': '🔤 Fonts',
  'กำลังตรวจไฟล์…': 'Checking files…',
  'กำลังตรวจ…': 'Checking…',
  'กดเพื่อดูว่าขาดไฟล์อะไร และวิธีเตรียม': 'Click to see which files are missing and how to get them',
  'ระบบเก็บไฟล์ออฟไลน์:': 'Offline file storage:',
  '✔ ครบทุกไฟล์ ขนาดถูกต้อง พร้อมใช้งานแบบไม่มีอินเทอร์เน็ต':
    '✔ All files present and the right size. Ready to work without internet.',
  'ทำงานได้โดยไม่ต้องใช้อินเทอร์เน็ต': 'Works without internet',
  'เบราว์เซอร์นี้ไม่รองรับการทำงานออฟไลน์': 'This browser does not support offline use',
  '🌐 ออนไลน์': '🌐 Online',
  '📴 ออฟไลน์': '📴 Offline',
  '📴 ออฟไลน์ · ใช้ไฟล์ในเครื่อง': '📴 Offline · using local files',

  // ---------- ฐานข้อมูลและการบันทึก ----------
  'เตรียมฐานข้อมูลในเครื่อง': 'Preparing the local database',
  'ฐานข้อมูลพร้อม': 'Database ready',
  'เตรียมหน้าจอและธีม': 'Preparing the screen and theme',
  'หน้าจอพร้อม': 'Screen ready',
  'เตรียมหน้าจอไม่สำเร็จ กดลองใหม่ ถ้ายังไม่ได้ให้รีเฟรชหน้า (F5)':
    'Could not prepare the screen. Press Try again, and if that fails refresh the page (F5).',
  'เปิดที่เก็บข้อมูลของเบราว์เซอร์ไม่ได้ ปิดแท็บอื่นของแอปนี้ และอย่าใช้โหมดไม่ระบุตัวตน แล้วกดลองใหม่':
    'Could not open the browser’s storage. Close other tabs with this app, avoid private browsing, then press Try again.',
  'บันทึกผลทดสอบแล้ว': 'Test results saved',
  'บันทึกไม่สำเร็จ ใช้ค่านี้ชั่วคราวได้': 'Could not save. You can use this value for now.',
  'บันทึกไม่สำเร็จ:': 'Could not save:',
  '⚠️ บันทึกไม่สำเร็จ:': '⚠️ Could not save:',
  'อ่านประวัติจากฐานข้อมูลไม่ได้:': 'Could not read the history from the database:',
  'ยังไม่มีข้อมูล': 'No data yet',
  'ยังไม่มีผล': 'No results yet',

  // ---------- ปรับเทียบ ----------
  'จีบนิ้ว': 'Pinch',
  'กางนิ้ว': 'Spread',
  'ผู้เล่นนี้ยังไม่เคยปรับเทียบ': 'This player has never calibrated',
  'ยังไม่มีค่าปรับเทียบของท่านี้': 'No calibration for this gesture yet',
  'ยังไม่มีค่าปรับเทียบ — ปรับเทียบด้านบนก่อน แล้วจึงตรึงเกณฑ์':
    'No calibration yet — calibrate above first, then freeze the threshold',
  'กำลังเก็บข้อมูล…': 'Collecting data…',
  'ดีมาก! นิ่งไว้ กำลังนับถอยหลัง…': 'Good. Hold still, counting down…',
  'ค้างไว้ 2 วินาที': 'Hold for 2 seconds',
  'ค้างไว้ 3 วินาที': 'Hold for 3 seconds',
  'วางมือหันฝ่ามือเข้ากล้อง นิ้วเหยียดตรง': 'Hold your hand with the palm towards the camera, fingers straight',
  'แตะปลายนิ้วโป้งกับปลายนิ้วชี้ให้ชิดที่สุด แล้วแยกออก':
    'Touch the tip of your thumb to the tip of your index finger as closely as you can, then separate them',
  'กางนิ้วทุกนิ้วให้กว้างที่สุดเท่าที่ทำได้โดยไม่เจ็บ': 'Spread all your fingers as wide as you can without pain',
  'กางนิ้วทุกนิ้วให้กว้างที่สุดโดยไม่เจ็บ แล้วหุบกลับ': 'Spread your fingers as wide as is comfortable, then close them again',
  'หุบนิ้วชิดกันแบบสบาย ๆ': 'Bring your fingers together, comfortably',
  '🧘 ขั้นที่ 1/2 · ผ่อนคลาย หุบนิ้ว': '🧘 Step 1 of 2 · relax, fingers together',
  '🖐 ขั้นที่ 2/2 · กางนิ้วให้กว้างที่สุด': '🖐 Step 2 of 2 · spread as wide as you can',
  '✋ ยกมือให้กล้องเห็น': '✋ Hold your hand up so the camera can see it',
  '✋ ยกมือให้กล้องเห็น (หันฝ่ามือเข้ากล้อง)': '✋ Hold your hand up to the camera, palm towards it',
  '✋ ยังไม่เห็นมือ — ยกมือให้อยู่กลางภาพ': '✋ No hand yet — hold your hand in the middle of the picture',
  'กล้องมองไม่เห็นมือระหว่างวัด ลองให้มืออยู่กลางภาพและมีแสงพอ':
    'The camera lost your hand during the measurement. Keep your hand in the middle of the picture with enough light.',
  'กล้องมองไม่เห็นมือระหว่างวัด ให้มืออยู่กลางภาพและมีแสงพอ แล้วลองใหม่':
    'The camera lost your hand during the measurement. Keep it in the middle with enough light, then try again.',
  'วางข้อศอกบนโต๊ะ นิ่งไว้ 3 วินาที และเช็ดเลนส์กล้องด้วยผ้านุ่ม':
    'Rest your elbow on the table, hold still for 3 seconds, and wipe the camera lens with a soft cloth',
  '× ขนาดฝ่ามือ': '× palm size',
  'ไม่มีอาการสั่น': 'No tremor',
  'สั่นเล็กน้อย': 'Slight tremor',
  'สั่นปานกลาง': 'Moderate tremor',
  'สั่นมาก': 'Severe tremor',
  '🔒 ตรึงเกณฑ์แล้ว': '🔒 Threshold frozen',
  '🔓 ปลดล็อก': '🔓 Unlock',
  '🔓 ปลดล็อกแล้ว': '🔓 Unlocked',
  '🔓 ปลดล็อกเกณฑ์?': '🔓 Unlock the threshold?',
  '🔓 ปลดล็อกและปรับเทียบใหม่': '🔓 Unlock and recalibrate',
  'ยกเลิก (คงเกณฑ์เดิม)': 'Cancel (keep the current threshold)',
  'ผลการวัดหลังปลดล็อกอาจเทียบกับผลก่อนหน้าไม่ได้':
    'Measurements taken after unlocking may not be comparable with earlier ones',
  '[calibration] อ่านรายการไม่ได้': '[calibration] could not read the list',
  '[calibration] โหลดไม่ได้': '[calibration] could not load',
  '[camera] กล้องที่จำไว้หายไป ใช้กล้องแรกแทน': '[camera] the saved camera is gone, using the first one instead',

  // ---------- ชื่อจุดสังเกตบนมือ ----------
  'ข้อมือ': 'Wrist',
  'โป้ง': 'Thumb',
  'ชี้': 'Index',
  'นาง': 'Ring',
  'ก้อย': 'Little',
  'ฐานนิ้วโป้ง (CMC)': 'Thumb base (CMC)',
  'ข้อโคนนิ้วโป้ง (MCP)': 'Thumb knuckle (MCP)',
  'ข้อนิ้วโป้ง (IP)': 'Thumb joint (IP)',
  'ปลายนิ้วโป้ง': 'Thumb tip',
  'ข้อโคนนิ้วชี้ (MCP)': 'Index knuckle (MCP)',
  'ข้อกลางนิ้วชี้ (PIP)': 'Index middle joint (PIP)',
  'ข้อปลายนิ้วชี้ (DIP)': 'Index end joint (DIP)',
  'ปลายนิ้วชี้': 'Index tip',
  'ข้อโคนนิ้วกลาง (MCP)': 'Middle knuckle (MCP)',
  'ข้อกลางนิ้วกลาง (PIP)': 'Middle middle joint (PIP)',
  'ข้อปลายนิ้วกลาง (DIP)': 'Middle end joint (DIP)',
  'ปลายนิ้วกลาง': 'Middle tip',
  'ข้อโคนนิ้วนาง (MCP)': 'Ring knuckle (MCP)',
  'ข้อกลางนิ้วนาง (PIP)': 'Ring middle joint (PIP)',
  'ข้อปลายนิ้วนาง (DIP)': 'Ring end joint (DIP)',
  'ปลายนิ้วนาง': 'Ring tip',
  'ข้อโคนนิ้วก้อย (MCP)': 'Little knuckle (MCP)',
  'ข้อกลางนิ้วก้อย (PIP)': 'Little middle joint (PIP)',
  'ข้อปลายนิ้วก้อย (DIP)': 'Little end joint (DIP)',
  'ปลายนิ้วก้อย': 'Little tip',

  // ---------- เกม ----------
  '⭐ จับดาวใส่ประตูมิติ': '⭐ Catch the star, drop it in the portal',
  '🎵 เคาะจังหวะทีละนิ้ว': '🎵 Tap the rhythm, one finger at a time',
  '🖐 กางนิ้วผ่านกำแพง': '🖐 Spread your fingers through the wall',
  '🐠 กางนิ้ว (เกมกำแพง)': '🐠 Spread (the wall game)',
  '▶ เล่นต่อ': '▶ Continue',
  '▶ เล่นอีกครั้ง': '▶ Play again',
  '▶ เล่นอีกรอบ': '▶ Another round',
  '⏸ หยุดพัก': '⏸ Take a break',
  'พักมือได้ตามสบาย กดปุ่มเมื่อพร้อมเล่นต่อ': 'Rest your hand as long as you like. Press the button when you are ready.',
  'โหมดสาธิต: เพิ่มแถบ "มุมกาง" หรือหมุนล้อเมาส์ขึ้นให้ค่ามาก แล้วกดพร้อม':
    'Demo mode: raise the spread slider, or scroll the mouse wheel up, then press Ready',
  'โหมดสาธิต: ลดแถบ "มุมกาง" หรือหมุนล้อเมาส์ลงให้ค่าน้อย แล้วกดพร้อม':
    'Demo mode: lower the spread slider, or scroll the mouse wheel down, then press Ready',

  // ---------- ตั้งค่าและเอฟเฟกต์ ----------
  '🌙 สงบ: เปิด': '🌙 Calm: on',
  '🌙 สงบ: ปิด': '🌙 Calm: off',
  'เอฟเฟกต์เต็ม (พลุ + เสียง)': 'Full effects (fireworks + sound)',
  'เอฟเฟกต์ลดลงครึ่งหนึ่ง': 'Effects at half',
  'ปิดเอฟเฟกต์อนุภาค': 'Particle effects off',
  'ประกายและพลุตอนได้คะแนนน้อยลงครึ่งหนึ่ง': 'Half as many sparkles and fireworks when you score',
  'ไม่มีพลุ/ประกายตอนได้คะแนน (ยังมีเสียงและตัวเลขคะแนนตามปกติ)':
    'No fireworks or sparkles when you score (sound and the score itself stay as normal)',
  'มือแบบเรียบง่าย (simple)': 'Simple hand',
  'มือแบบนีออนเรืองแสง (neon)': 'Glowing neon hand',
  'มือแบบมีหางแสง (trail)': 'Hand with a light trail',
  'มือ สไตล์ simple': 'Hand, simple style',
  'มือ สไตล์ neon': 'Hand, neon style',
  'มือ สไตล์ trail': 'Hand, trail style',
  'เส้นมือบนจอจะไม่มีแสงเรืองและหางแสง (AI ยังจับมือแม่นเท่าเดิม)':
    'The hand outline loses its glow and trail. The AI tracks your hand exactly as accurately as before.',
  'ไม่มีหางแสงตามปลายนิ้ว': 'No light trail behind the fingertips',
  'ภาพกล้องบนจอคมน้อยลง (โมเดล AI ย่อภาพเองอยู่แล้ว ความแม่นยำแทบไม่เปลี่ยน)':
    'The camera picture looks a little softer. The AI model downscales the image anyway, so accuracy barely changes.',
  'ภาพกล้องบนจอหยาบลงชัดเจน และถ้ายืนไกลกล้องเกิน 1.5 เมตร อาจจับมือได้ยากขึ้น':
    'The camera picture is noticeably coarser, and beyond about 1.5 metres the hand may be harder to track.',
  'การจับมือของ AI และการนับคะแนนยังทำงานเหมือนเดิม เปลี่ยนกลับได้ทุกเมื่อในหน้าตั้งค่า':
    'Hand tracking and scoring work exactly as before. You can change this back at any time in Settings.',
  'ปรับค่าสำหรับเครื่องเบาแล้ว (เปลี่ยนกลับได้ในหน้าตั้งค่า)':
    'Settings adjusted for a lighter machine. You can change them back in Settings.',
  'ไม่เสียอะไร ใช้ค่าสูงสุดได้เลย': 'Nothing is given up — you can use the highest settings',
  'เครื่องนี้ติดตั้งแอปได้ กดปุ่มสีเขียวด้านล่าง': 'This computer can install the app. Press the green button below.',
  'ยกเลิกการติดตั้ง กดใหม่ได้ทุกเมื่อ': 'Installation cancelled. You can press it again any time.',
  'กำลังติดตั้ง…': 'Installing…',
  '✔ ติดตั้งแล้ว — กำลังเปิดจากไอคอนแอป (ไม่มีแถบเบราว์เซอร์)':
    '✔ Installed — now opening from the app icon, with no browser bar',
  'ปุ่มติดตั้งจะขึ้นเมื่อเบราว์เซอร์พร้อม (Chrome / Edge) — ถ้าเคยติดตั้งแล้ว ให้เปิดจากไอคอนบนเดสก์ท็อป · iPad: ปุ่มแชร์ → "เพิ่มไปยังหน้าจอโฮม"':
    'The install button appears when the browser is ready (Chrome or Edge). If you have installed it already, open it from the desktop icon. On iPad: Share → Add to Home Screen.',
  '⚠ ต้องเปิดผ่าน http://localhost (ดับเบิลคลิก start.bat) จึงจะติดตั้งได้ เปิดไฟล์ตรง ๆ ไม่ได้':
    '⚠ Installing requires opening through http://localhost (double-click START.bat). Opening the file directly will not work.',

  // ---------- วัดความเร็วเครื่อง ----------
  'FPS เฉลี่ย': 'Mean FPS',
  'FPS ต่ำสุด': 'Minimum FPS',
  'ms ต่อเฟรม': 'ms per frame',
  'กำลังวัด': 'Measuring',
  'ตรวจจับใบหน้า': 'Face detection',
  'เกมเต็ม (จับดาว + มือจริง)': 'Full game (catch the star, real hand)',
  'ตั้งชื่อเครื่องก่อน เพื่อใช้เปรียบเทียบภายหลัง': 'Name the machine first, so you can compare later',
  'ยังไม่มีผลทดสอบ': 'No test results yet',
  'ยังไม่มีผล กดเริ่มทดสอบด้านบน แล้วผลจะมาแสดงที่นี่':
    'No results yet. Press Start above and they will appear here.',
  '✔ ทดสอบครบแล้ว ดูคำแนะนำด้านบน': '✔ All tests done. See the recommendation above.',
  'ยังไม่มีผลทดสอบที่ใช้ได้ จึงแนะนำค่าปลอดภัยไว้ก่อน':
    'No usable test results yet, so safe settings are suggested for now',
  'จะหยุดหลังจบสถานการณ์ที่กำลังทดสอบ': 'It will stop after the current scenario finishes',
  '⏹ หยุดแล้ว ผลที่ได้ยังไม่ครบ จึงไม่บันทึก': '⏹ Stopped. The results are incomplete, so nothing was saved.',
  'สลับหน้าต่างระหว่างทดสอบ ผลอาจต่ำกว่าจริง ควรทดสอบใหม่':
    'You switched windows during the test, so the result may be lower than the truth. Run it again.',
  'ไม่รู้จักสถานการณ์': 'Unknown scenario',
  'ไม่ใช่ไฟล์ผลทดสอบของแอปนี้': 'This is not a results file from this app',
  '⚡ ทดสอบจริงก่อน (ประมาณ 1 นาที)': '⚡ Run the real test first (about one minute)',
  '🔧 ปรับให้อัตโนมัติ': '🔧 Adjust automatically',
  '[bench] โหลดโมเดลไม่ได้': '[bench] could not load the model',

  // ---------- ตัวกรองสัญญาณ ----------
  'ลดความสั่น (%)': 'Jitter reduction (%)',
  'ความหน่วง (ms)': 'Lag (ms)',
  'หน่วง cross-correlation (ms)': 'Lag by cross-correlation (ms)',
  'หน่วงขั้นบันได 90% (ms)': 'Step lag to 90% (ms)',
  'ตำแหน่ง x (0-1)': 'Position x (0–1)',
  'เวลา (วินาที ก่อนตอนนี้)': 'Time (seconds ago)',
  'ตำแหน่งปลายนิ้วชี้ (แนวนอน) ก่อน/หลังกรอง': 'Index fingertip position (horizontal), before and after filtering',
  '〰 สัญญาณจำลอง': '〰 Synthetic signal',
  '〰 ใช้สัญญาณจำลอง': '〰 Use the synthetic signal',
  '⏸ หยุดกราฟ': '⏸ Pause the chart',
  '▶ เดินกราฟต่อ': '▶ Resume the chart',

  // ---------- คำแนะนำเรื่องแสงและท่าทาง ----------
  'หน้าตรง': 'Face forward',
  'หน้าตรง · กลางกรอบ · ตาระดับเดียวกัน': 'Face forward · centred · eyes level',
  'แสงด้านหน้า': 'Light from the front',
  'ขึ้นด้านบน': 'Upwards',
  'ลงด้านล่าง': 'Downwards',
  'ไปทางซ้าย': 'To the left',
  'ไปทางขวา': 'To the right',
  'ก้มหน้าเล็กน้อย': 'Tilt your head down slightly',
  'เงยหน้าเล็กน้อย': 'Tilt your head up slightly',
  'หันซ้ายเล็กน้อย': 'Turn slightly left',
  'หันขวาเล็กน้อย': 'Turn slightly right',
  'ท่านี้ต้องก้มหน้า — ก้มหน้าลงเล็กน้อย': 'This pose needs your head down — tilt it down a little',
  'ท่านี้ต้องเงยหน้า — เงยหน้าขึ้นเล็กน้อย': 'This pose needs your head up — tilt it up a little',
  'ท่านี้ต้องหันซ้าย — หันหน้าไปทางซ้ายของคุณอีกนิด': 'This pose needs a left turn — turn a little more to your left',
  'ท่านี้ต้องหันขวา — หันหน้าไปทางขวาของคุณอีกนิด': 'This pose needs a right turn — turn a little more to your right',
  'หันมากเกินไป — หันกลับมาทางกล้องครึ่งหนึ่ง': 'Turned too far — come back halfway towards the camera',
  'ศีรษะเอียง — ตั้งศีรษะให้ตรง ตาสองข้างอยู่ระดับเดียวกัน': 'Head tilted — straighten up so both eyes are level',
  'ใกล้เกินไป — ถอยห่างจากกล้องเล็กน้อย': 'Too close — move back from the camera a little',
  'อยู่ไกลเกินไป — ขยับเข้ามาใกล้กล้องอีกนิด': 'Too far — move a little closer to the camera',
  'ยังไม่พบใบหน้า — ขยับหน้าเข้ามาในกรอบวงรี': 'No face yet — move your face into the oval',
  'ยังไม่ตรงท่า — หันหน้าตรงมองกล้อง': 'Not the right pose yet — face the camera straight on',
  'ห้องมืดเกินไป — เปิดไฟเพิ่ม หรือหันหน้าเข้าหาหน้าต่าง': 'The room is too dark — add light, or face a window',
  'แสงแรงเกินไป — ขยับออกจากแสงที่ส่องเข้ากล้องหรือส่องหน้าตรง ๆ':
    'The light is too strong — move out of light shining into the lens or straight at your face',
  'ภาพซีด/ย้อนแสง — อย่าให้หน้าต่างอยู่ข้างหลัง ให้แสงส่องมาจากด้านหน้า':
    'Washed out or backlit — do not sit with a window behind you, let the light come from in front',
  'ภาพเบลอ — นิ่งไว้สักครู่ และเช็ดเลนส์กล้อง': 'Blurry — hold still for a moment and wipe the lens',
  'ถ้ามีหน้าต่างอยู่ข้างหลัง ให้หมุนเก้าอี้หันหน้าเข้าหาหน้าต่างแทน':
    'If there is a window behind you, turn your chair to face the window instead',
  'อย่าให้แสงแดดหรือโคมไฟส่องเข้าเลนส์ ใช้แสงนุ่ม ๆ จากด้านหน้า':
    'Keep sunlight and lamps out of the lens. Use soft light from the front.',
  'เปิดไฟเพดาน หรือหันหน้าเข้าหาหน้าต่าง ถ่ายในที่มืดจะทำให้ล็อกอินยากในภายหลัง':
    'Turn on the ceiling light or face a window. Capturing in the dark makes signing in harder later.',
  'นั่งตรงหน้ากล้อง ห่างประมาณหนึ่งช่วงแขน ให้ใบหน้าทั้งหมดอยู่ในวงรี':
    'Sit in front of the camera, about an arm’s length away, with your whole face inside the oval',
  'นั่งหลังตรง มองตรงไปที่กล้อง ตาสองข้างอยู่ระดับเดียวกับเส้นแนวนอนในภาพ':
    'Sit up straight, look directly at the camera, with both eyes level with the horizontal line',
  'ขยับตัวจนจุดกึ่งกลางใบหน้า (ปลายจมูก) อยู่ตรงกลางวงรี':
    'Move until the centre of your face, the tip of your nose, is in the middle of the oval',
  'ขยับเก้าอี้เข้าใกล้จอ จนใบหน้าเกือบเต็มวงรี (ประมาณครึ่งแขน ถึงหนึ่งช่วงแขน)':
    'Move your chair closer until your face nearly fills the oval, about half to one arm’s length',
  'ถอยหลังจนเห็นคางและหน้าผากอยู่ในวงรีครบ': 'Move back until both your chin and forehead fit inside the oval',
  'ทำตามภาพตัวอย่าง: หน้าตรง อยู่กลางวงรี แสงสว่างจากด้านหน้า':
    'Follow the example: face forward, centred in the oval, lit from the front',

  // ---------- ชุดที่สอง  หน้าความก้าวหน้า ห้องวิจัย และข้อความที่เหลือบนหน้าจอ ----------
  'ไทย': 'Thai',
  'วัน': 'days',
  'เซสชัน': 'sessions',
  'ลองใหม่': 'Try again',
  'กรอกแล้ว': 'filled in',
  'ตอนนี้มี': 'Right now there are',
  'ท่าย่อย': 'Sub-gesture',
  'รอบการฝึก': 'Training rounds',
  'คะแนนรวม': 'Total score',
  'เครื่องเบา': 'Light machine',
  'ห้องวิจัย': 'Research room',
  'แบบสอบถาม': 'Questionnaire',
  'หนังสือยินยอม': 'Consent form',
  'หนังสือยินยอม (พิมพ์ได้)': 'Consent form (printable)',
  'บันทึกการทดสอบ': 'Test log',
  'บันทึกเข้าสู่ระบบ': 'Sign-in log',
  'สรุปผลการทดสอบ': 'Test summary',
  'ผลวัดความลื่น': 'Frame-rate results',
  'ผลวัดความแม่นยำ': 'Accuracy results',
  'ชุดข้อมูลและที่มา': 'Datasets and provenance',
  'แดชบอร์ดหลักฐาน': 'Evidence dashboard',
  'แบบจำลองคณิตศาสตร์': 'Mathematical model',
  'คณิตศาสตร์ของมือ': 'The mathematics of the hand',
  'ห้องทดลองท่ามือ': 'Gesture lab',
  'ตัวบันทึกการทดสอบ': 'Test recorder',
  'ตัวสร้างร่างรายงาน': 'Report draft builder',
  'สอน AI ท่ามือใหม่': 'Teach the AI a new gesture',
  'สอนท่าในหน้าสอน AI': 'Teach the gesture on the Train AI page',
  'เลือกท่าที่จะปรับเทียบ': 'Choose the gesture to calibrate',
  'ปรับเทียบ + ตรึงเกณฑ์': 'Calibrate and freeze the threshold',
  'ซ้อมนำเสนอ 5 นาที': 'Rehearse the 5-minute talk',
  'ซ้อมตอบคำถามกรรมการ': 'Rehearse the judges’ questions',
  'รายการของที่ต้องนำไปวันแข่ง': 'What to bring on competition day',
  'แผนสำรอง 9 สถานการณ์': 'Plan B for nine situations',
  'แม่แบบบทที่ 1': 'Chapter 1 template',
  'พรอมต์บทที่ 1': 'Chapter 1 prompt',
  'พรอมต์บทที่ 3–5': 'Chapters 3–5 prompt',
  'บทพูด 5 นาที (pitch.md)': 'The 5-minute script (pitch.md)',
  'ไฟล์ไหนใช้บทไหน': 'Which file belongs to which chapter',
  'สมการ (5) ของบทความ': 'Equation (5) of the paper',
  'สมการ (1) ถึง (6)': 'Equations (1) to (6)',
  'สมการทั้งหมดของมือ (math.md)': 'All the hand equations (math.md)',
  'รายการหลักฐาน (CHECKLIST.md)': 'Evidence checklist (CHECKLIST.md)',
  'ตารางที่มาของข้อมูล (SOURCES.md)': 'Data provenance table (SOURCES.md)',
  'สคริปต์รวบรวมหลักฐาน:': 'Evidence collection script:',
  'สคริปต์ทดสอบกับผู้ใช้ 8 งาน': 'User test script, eight tasks',
  'ทำไมต้องบันทึกที่มาของข้อมูล': 'Why provenance has to be recorded',
  'ตัวนับ "ประตูสองบาน"': 'The two-gate counter',
  'สี ตัวอักษร และชิ้นส่วน': 'Colours, type and components',
  'มือ 21 จุด + สไตล์การวาด': '21-point hand and drawing styles',
  'ความถูกต้องเฉลี่ย': 'Mean accuracy',
  'ความแม่นยำรวม (Accuracy)': 'Overall accuracy',
  'ความแม่นยำเมื่อตอบว่าใช่ (Precision)': 'Precision',
  'ความครบถ้วน (Recall)': 'Recall',
  'เฉลี่ยแบบ macro': 'Macro average',
  'ความเที่ยงการวัดซ้ำ (ICC)': 'Test–retest reliability (ICC)',
  'มุมกางนิ้วดีที่สุด': 'Best finger spread angle',
  'จำนวนครั้งที่ฝึกทั้งหมด': 'Total repetitions practised',
  'ท่าที่ทำใน 7 วันนี้': 'Gestures done in the last 7 days',
  'เทียบ 7 วันล่าสุดกับ 7 วันก่อนหน้า': 'Last 7 days compared with the 7 before',
  'ฝึกติดต่อกัน (≥ 5 นาที/วัน)': 'Consecutive days practised (≥ 5 minutes a day)',
  'กราฟจะอ่านรู้เรื่องเมื่อมีการฝึกอย่างน้อย': 'The chart becomes readable once you have practised at least',
  'ยังไม่มีผลที่บันทึก': 'No saved results yet',
  'ยังไม่มีเซสชัน — เล่นเกมก่อน หรือกด "ใส่ตัวอย่าง"': 'No sessions yet — play a game first, or press Insert samples',
  'ยังไม่ได้เล่นเกมกางนิ้ว': 'The spread game has not been played yet',
  'ยังไม่มีการฝึกใน 2 สัปดาห์นี้ มาเริ่มกันวันละ 5 นาทีนะ 🌱':
    'No practice in the last two weeks. Let us start again, five minutes a day 🌱',
  '🌱 มาเริ่มฝึกกันเถอะ!': '🌱 Let us get started!',
  'เริ่มจากเกมที่ชอบที่สุดสักรอบเดียวก็พอ ทุกครั้งที่ฝึกคือก้าวหนึ่งของการฟื้นฟู':
    'One round of your favourite game is enough to begin. Every session is a step in recovery.',
  'เล่นเกมวันละ 5 นาที แล้วกลับมาดูเส้นกราฟที่ค่อย ๆ สูงขึ้นของคุณเอง · หรือกด "🧪 สร้างประวัติจำลอง" เพื่อดูตัวอย่าง':
    'Play five minutes a day, then come back and watch your own line rise · or press Generate sample history to see an example',
  'ระบบจะเรียนรู้ "มือของคุณ" เพื่อให้เกมพอดีกับคุณ ไม่ยากหรือง่ายเกินไป':
    'The system learns your hand so the game fits you, neither too hard nor too easy',
  'ขั้นที่ 1 · เตรียมตัว (ใช้เวลาประมาณ 1 นาที)': 'Step 1 · get ready (about one minute)',
  'ถือมือนิ่ง ๆ 5 วินาที เพื่อวัดอาการสั่น': 'Hold your hand still for 5 seconds to measure tremor',
  'ดูท่าตัวอย่าง แล้วทำท่าเต็มแรง 5 ครั้ง': 'Watch the example, then do the gesture fully, five times',
  'ดูผลและลองเล่นทันที': 'See the result and try it straight away',
  'นั่งห่างกล้องประมาณ 50 ซม. แสงสว่างพอ หันฝ่ามือเข้ากล้อง':
    'Sit about 50 cm from the camera, with enough light, palm facing the camera',
  'วัดผลต้องตรึงเกณฑ์ไว้ ผลแต่ละวันจึงเทียบกันได้':
    'For measurement the threshold must stay frozen, so results from different days can be compared',
  'สิ่งที่จะเสียไปถ้าปรับ:': 'What you give up by changing this:',
  'เราแนะนำให้ปรับเป็น:': 'We suggest changing to:',
  'จากสเปกที่เบราว์เซอร์บอก เครื่องนี้อยู่ในกลุ่ม': 'From what the browser reports, this machine is in the group',
  '⚠️ เครื่องนี้อาจเล่นได้ไม่ลื่น': '⚠️ This machine may not run smoothly',
  'CPU 2 แกน (0 คะแนน)': 'CPU with 2 cores (0 points)',
  'หน่วยความจำประมาณ 8 GB (2 คะแนน)': 'About 8 GB of memory (2 points)',
  'ไม่มีการ์ดจอช่วย (วาดด้วย CPU) (0 คะแนน)': 'No graphics acceleration, drawing on the CPU (0 points)',
  '⚠️ ยังไม่พบโมเดลในเครื่องนี้ —': '⚠️ No model found on this computer yet —',
  '✖ โหลดโมเดล AI จับมือ 21 จุด ไม่สำเร็จ': '✖ Could not load the 21-point hand model',
  'รายละเอียด: ดาวน์โหลดโมเดลไม่สำเร็จทุกลิงก์:': 'Details: the model failed to download from every link:',
  'ยังไม่มีไฟล์ออฟไลน์ 3 ไฟล์ ตอนนี้ต้องใช้อินเทอร์เน็ต (กดป้ายมุมซ้ายล่างเพื่อดู)':
    'Three offline files are missing, so the internet is needed for now. Click the badge at the bottom left to see which.',
  'ก่อน หรือนำเข้าไฟล์ JSON (โหมดจำลองจะใช้โมเดลสาธิตแทน)':
    'first, or import a JSON file. Simulation mode uses a demo model instead.',
  '(รวมข้อมูลตัวอย่าง/จำลอง ซึ่งจะแยกเป็น DEMO- เวลาอ่าน)':
    '(includes sample and simulated data, which is separated out as DEMO- when read)',
  '🗄️ ข้อมูลในเครื่องนี้ (อ่านได้จากแดชบอร์ดหลักฐานและตัวสร้างรายงานโดยตรง)':
    '🗄️ Data on this computer, readable directly from the evidence dashboard and the report builder',
  // ปุ่มและป้ายสั้น
  '↻ นับใหม่': '↻ Count again',
  '☀️ สว่าง': '☀️ Light',
  '🌙 มืด': '🌙 Dark',
  '💡 ปกติ': '💡 Normal',
  'Aa มาตรฐาน': 'Aa Standard',
  'Aa ผู้สูงอายุ': 'Aa Larger',
  '✋ มือ สไตล์ simple': '✋ Simple hand',
  '✨ มือ สไตล์ neon': '✨ Neon hand',
  '☄ มือ สไตล์ trail': '☄ Trail hand',
  '🏠 กลับเมนูหลัก': '🏠 Back to the main menu',
  '👤 ผู้เล่นรับเชิญ (guest)': '👤 Guest player',
  '🔐 เข้าสู่ระบบ': '🔐 Sign in',
  '📷 กล้องอย่างเดียว': '📷 Camera only',
  '📷 เริ่มด้วยกล้อง': '📷 Start with the camera',
  '🙂 ตรวจจับใบหน้า': '🙂 Face detection',
  '⭐ เกมเต็ม (จับดาว + มือจริง)': '⭐ Full game (catch the star, real hand)',
  '🤏 จีบนิ้ว': '🤏 Pinch',
  '🖐️ กางนิ้ว': '🖐️ Spread',
  '🖐️ ห้องทดลองมือ': '🖐️ Hand lab',
  '🧓 ทดสอบกับผู้ใช้': '🧓 User testing',
  '🧠 สอน AI & วัดผล': '🧠 Train the AI and evaluate',
  '🎨 ระบบออกแบบ': '🎨 Design system',
  '📄 เอกสารประกอบ': '📄 Documentation',
  '📑 รายงาน & นำเสนอ': '📑 Report and presentation',
  '📈 พัฒนาการของฉัน': '📈 My progress',
  '📍 กราฟพัฒนาการ': '📍 Progress chart',
  '📍 ความถูกต้องการนับ': '📍 Counting accuracy',
  '📍 ทดสอบความลื่นของเครื่อง': '📍 Frame-rate benchmark',
  '📍 ปรับเทียบมือของฉัน': '📍 Calibrate my hand',
  '📍 วัดความแม่นยำ': '📍 Accuracy measurement',
  '📍 ห้องวิจัยและการสอน': '📍 Research and teaching room',
  '🔬 ห้องวิจัยและการสอน': '🔬 Research and teaching room',
  '📍 เปรียบเทียบตัวกรองสัญญาณ': '📍 Signal filter comparison',
  '📏 แผนการประเมิน (บทความ หัวข้อ V.B)': '📏 Evaluation plan (paper หัวข้อ V.B)',
  '🖼 บันทึกทุกกราฟเป็น PNG': '🖼 Save every chart as PNG',
  '🧪 สร้างประวัติจำลอง 30 วัน': '🧪 Generate 30 days of sample history',
  '🧹 ลบข้อมูลจำลอง': '🧹 Delete the simulated data',
  'หัวข้อ V.B ประสิทธิภาพ': 'หัวข้อ V.B Performance',
  'หัวข้อ V.B ความถูกต้อง': 'หัวข้อ V.B Accuracy',
  'หัวข้อ V.B ความเที่ยง': 'หัวข้อ V.B Reliability',
  'หัวข้อ V.B การใช้งาน': 'หัวข้อ V.B Usability',
  'SUS (มาตรฐาน)': 'SUS (standard)',
  'ค่าเฉลี่ยเคลื่อนที่ (N=5)': 'Moving average (N = 5)',
  'มัธยฐาน (N=5)': 'Median (N = 5)',
  'ทดสอบความลื่น (FPS ≥ 25)': 'Frame-rate test (FPS ≥ 25)',
  // คำอธิบายยาวของตัวชี้วัด
  'สัดส่วนครั้งที่ระบบตรวจได้ตรงกับท่าที่ขอ จากการทดสอบทั้งหมด = ผลรวมแนวทแยง ÷ ทั้งหมด บอกภาพรวม แต่ไม่บอกว่าผิดเป็นท่าอะไร':
    'The share of trials where the system reported the gesture that was asked for, out of all trials: the diagonal sum divided by the total. It gives the overall picture but not which gesture the errors went to.',
  'เมื่อระบบ "บอกว่า" เป็นท่านี้ ถูกจริงกี่เปอร์เซ็นต์ = TP ÷ ผลรวมคอลัมน์ ถ้าต่ำแปลว่าระบบชอบทักผิดว่าเป็นท่านี้ (เกมจะนับคะแนนให้ทั้งที่ยังไม่ได้ทำ)':
    'When the system says it is this gesture, how often it is right: TP divided by the column total. A low value means the system keeps claiming this gesture wrongly, so the game scores points that were never earned.',
  'ในครั้งที่ผู้ใช้ "ทำท่านี้จริง" ระบบจับได้กี่เปอร์เซ็นต์ = TP ÷ ผลรวมแถว ถ้าต่ำแปลว่าผู้ป่วยทำท่าแล้วระบบไม่นับ ทำให้หมดกำลังใจ':
    'When the user really does this gesture, how often the system catches it: TP divided by the row total. A low value means the patient does the gesture and it is not counted, which is discouraging.',
  'ค่าเฉลี่ยแบบฮาร์มอนิกของ precision และ recall = 2PR ÷ (P + R) จะสูงได้ก็ต่อเมื่อทั้งสองค่าสูงพร้อมกัน ใช้เปรียบเทียบระบบด้วยตัวเลขเดียว':
    'The harmonic mean of precision and recall, 2PR / (P + R). It is only high when both are high, which makes it a single number for comparing systems.',
  'เฉลี่ยค่าของทุกท่าโดยให้น้ำหนักเท่ากัน ท่าที่ทำได้แย่จึงไม่ถูกท่าที่ทำได้ดีกลบ':
    'Averages every gesture with equal weight, so a badly performing gesture is not hidden by a well performing one.',
  'ICC(2,1) / ICC(3,1) ตัดเซสชันแรก เกณฑ์ Koo & Li ≥ 0.75 · กรองเฉพาะเกณฑ์ตรึง':
    'ICC(2,1) / ICC(3,1), excluding the first session, against the Koo and Li threshold of 0.75 · frozen-threshold sessions only',
  'System Usability Scale 10 ข้อ ภาษาไทย ตอบ 1–5 · ผลเทียบค่า 68 ในหน้าสรุปผล':
    'The 10-item System Usability Scale in Thai, answered 1–5 · compared against 68 on the summary page',
  '10 ข้อ ทีละข้อ ปุ่มหน้ายิ้มใหญ่ ให้ผู้เข้าร่วมกดเอง':
    'Ten items, one at a time, with large smiley buttons the participant presses themselves',
  'ผู้สังเกตจับเวลางาน 8 ข้อ กดผล ทำได้เอง / ต้องช่วย / ทำไม่ได้':
    'The observer times eight tasks and records: unaided, needed help, or could not do it',
  '6 สถานการณ์ พร้อมป้าย PASS/FAIL เทียบเป้าหมาย 25 ภาพ/วินาที':
    'Six scenarios with PASS/FAIL against the target of 25 frames per second',
  'ตารางความสับสน precision / recall / F1 และการทดลองแสง 3 ระดับ':
    'Confusion matrix, precision, recall, F1, and the three-level lighting experiment',
  'ระบบนับ vs ผู้สังเกตนับจากวิดีโอ แสง 3 ระดับ · accuracy % · MAE · CSV':
    'System count versus an observer counting from video, at three light levels · accuracy % · MAE · CSV',
  'สัญญาณจำลอง 3 แบบ หรือกล้องจริง เทียบตัวนับเกณฑ์เดียว':
    'Three synthetic signals, or the real camera, compared against a single-threshold counter',
  'ระยะดิบเทียบระยะหารขนาดฝ่ามือ ความงอนิ้ว มุมกางนิ้ว':
    'Raw distance versus palm-normalised distance, finger curl, and spread angle',
  'ท่าจีบ + ท่าบริหาร 5 ท่า ปรับค่าเกณฑ์ด้วยสไลเดอร์ บันทึก CSV ทุกเฟรม':
    'Pinch plus five exercise gestures, thresholds adjustable by slider, every frame logged to CSV',
  'เก็บตัวอย่าง 30 ครั้งต่อท่า แล้วให้ kNN ทาย พร้อมดูเพื่อนบ้านใกล้สุด 5 ตัว':
    'Collect 30 samples per gesture, let kNN predict, and inspect the five nearest neighbours',
  'โครงมือ ตาราง 21 จุด สไตล์ simple/neon/trail และวัด FPS ทุกสไตล์':
    'Hand skeleton, the 21-point table, the simple, neon and trail styles, and the frame rate of each',
  'ค่าเฉลี่ย ± SD รายข้อ กราฟแท่ง CSV / PNG และผลงาน 8 ข้อ':
    'Mean ± SD per item, bar chart, CSV and PNG, and the results of the eight tasks',
  'อ่านสัญญาอนุญาต ดาวน์โหลดพร้อมลิงก์สำรอง ดู 20 ระเบียนแรกเป็นภาพมือ':
    'Read the licence, download with a fallback link, and preview the first 20 records as hand images',
  'ติ๊ก CHECKLIST จากไฟล์ และสร้างตาราง SUMMARY จาก CSV หรือฐานข้อมูลแอป':
    'Tick the checklist from the files and build the summary table from CSV or the app database',
  'บทที่ 1 · 3 · 4 · 5 จากตัวเลขที่วัดจริง ช่องที่ขาดบอกว่าต้องกลับไปแลปไหน':
    'Chapters 1, 3, 4 and 5 from the measured numbers, with each gap naming the lab you need to go back to',
  'ทุกสมการในบทความ ↔ ไฟล์/ฟังก์ชันในโค้ด ↔ การทดสอบ':
    'Every equation in the paper, mapped to the file and function in the code, and to its test',
  'แบบจำลองคณิตศาสตร์ สมการ (1) ถึง (6) ตามบทความ (MATH-MODEL.md)':
    'The mathematical model, equations (1) to (6) as in the paper (MATH-MODEL.md)',
  'นาฬิกาซ้อมทีละส่วน บทพูด การ์ดแผนสำรอง และบันทึกเวลาซ้อม':
    'A per-section rehearsal timer, the script, fallback cards, and a log of rehearsal times',
  'คอนทราสต์ทุกคู่สี ≥ 4.5 ขนาดตัวอักษร 7 ขั้น ปุ่ม การ์ด วงแหวน แจ้งเตือน':
    'Every colour pair at contrast ≥ 4.5, seven type sizes, buttons, cards, rings and alerts',
  'พิมพ์ตัวใหญ่ ต้องเซ็นก่อนเริ่มทดสอบทุกครั้ง':
    'Printed large, and signed before every test session',
  '🤏 จีบนิ้ว · ✊ กำมือ · 🖐️ แบมือกางนิ้ว · ☝️ แตะนิ้วทีละนิ้ว · 🙌 งอ-เหยียดข้อมือ + ∅ ไม่พบ':
    '🤏 pinch · ✊ fist · 🖐️ open and spread · ☝️ finger tap · 🙌 wrist flex and extend · ∅ none',

  // ---------- ชุดที่สาม  ข้อความคงที่ที่เหลือบนหน้าจอ ----------
  'HandRehab Arcade · ทีม NeonHands · โรงเรียนของเรา · กราฟวาดบน canvas เอง ไม่ใช้ไลบรารี':
    'HandRehab Arcade · team NeonHands · our school · charts drawn on canvas directly, with no library',
  'ค่าที่ใช้อยู่ตอนนี้: สไตล์ neon · ความละเอียด 640x480 (ค่าเริ่มต้น) · เอฟเฟกต์ full (ค่าเริ่มต้น)':
    'Current settings: neon style · resolution 640×480 (default) · full effects (default)',
  'ค่าที่ใช้: minCutoff 1 Hz · beta 0.5 · N 5 · สั่น 0.02 @ 6 Hz':
    'Settings in use: minCutoff 1 Hz · beta 0.5 · N 5 · tremor 0.02 at 6 Hz',
  'ภาพที่ 1 จำนวนท่าที่ทำได้ต่อวัน (ครั้ง) · วันที่ไม่ได้ฝึกเป็น 0 · แตะจุดเพื่อดูค่า':
    'Figure 1. Repetitions completed per day · days without practice count as 0 · tap a point for the value',
  'ภาพที่ 2 ความแม่นยำเฉลี่ยต่อวัน (%) เฉพาะวันที่ฝึก · เส้นประ = เป้าหมาย 80%':
    'Figure 2. Mean accuracy per day (%), practice days only · the dashed line is the 80% target',
  'ภาพที่ 3 มุมกางนิ้วสูงสุดต่อวัน (องศา ระหว่างนิ้วชี้กับนิ้วก้อย) — ตัวชี้วัดการฟื้นฟูที่สำคัญที่สุด':
    'Figure 3. Maximum finger spread per day, in degrees between the index and little fingers — the single most important recovery measure',
  'ภาพที่ 4 ปฏิทินความสม่ำเสมอ 12 สัปดาห์ (ช่อง = 1 วัน · ยิ่งเข้ม ยิ่งฝึกหลายครั้ง)':
    'Figure 4. Twelve-week consistency calendar: each square is one day, and darker means more repetitions',
  'ภาพที่ 5 จำนวนท่าแยกตามเกมในช่วงที่เลือก (ครั้ง)':
    'Figure 5. Repetitions by game over the selected period',
  'ระดับแสงเริ่มต้นแนะนำจากความสว่างที่วัดได้ (≥ 140 สว่าง · 80–139 ปกติ · < 80 มืด) เปลี่ยนเองได้ตามสภาพจริงตอนถ่ายวิดีโอ · บันทึกใน settings key "count-accuracy"':
    'The suggested light level comes from the measured brightness (≥ 140 bright · 80–139 normal · < 80 dim). Change it to match the real conditions when the video was taken · stored under the settings key "count-accuracy"',
  'HandRehab Arcade · ทีม NeonHands · โรงเรียนของเรา · อ้างอิง: Casiez, G., Roussel, N., & Vogel, D. (2012). 1\u20ac Filter. CHI \'12, 2527\u20132530.':
    'HandRehab Arcade \u00b7 team NeonHands \u00b7 our school \u00b7 Reference: Casiez, G., Roussel, N., & Vogel, D. (2012). 1\u20ac Filter. CHI \u201912, 2527\u20132530.',

  // ---------- ชุดที่สี่  สี่หน้าที่ใช้ถ่ายภาพลงบทความ JCSSE 2027 ----------
  '📍 จับดาวใส่ประตูมิติ':
    'Catch the star, drop it in the portal',
  'ฝึก':
    'Trains',
  'การจีบนิ้ว':
    'the pinch',
  '(นิ้วโป้งแตะนิ้วชี้) ช่วยการหยิบของชิ้นเล็ก กลัดกระดุม หยิบยาเม็ด':
    '(thumb to index finger), which helps with picking up small objects, fastening buttons and handling tablets',
  'ชี้ปลายนิ้วไปที่ดาว':
    'Point your fingertip at the star',
  'จีบนิ้วค้างไว้เพื่อจับ':
    'Hold the pinch to grab it',
  'ลากไปที่ประตูมิติแล้วปล่อย':
    'Drag it to the portal and release',
  '🖱 โหมดสาธิต (เมาส์)':
    'Demo mode (mouse)',
  '🖱 โหมดสาธิต':
    'Demo mode',
  '🖱️ โหมดสาธิต':
    'Demo mode',
  'โหมดสาธิต — กดเมาส์ค้าง = จีบ, F = กำมือ':
    'Demo mode — hold the mouse button to pinch, F to make a fist',
  'เมาส์ = ปลายนิ้วชี้ · กดปุ่มเมาส์ค้าง = จีบนิ้ว':
    'The mouse is the index fingertip · hold the mouse button to pinch',
  'คะแนน':
    'Score',
  'เวลา':
    'Time',
  'เวลาที่เหลือ':
    'Time left',
  'คอมโบ':
    'Combo',
  'คุณภาพ':
    'Quality',
  'ค้าง ms':
    'Hold ms',
  'ท่าที่นับ':
    'Counted gesture',
  'สถานะ':
    'State',
  'สนามเกม':
    'Play area',
  'ตั้งค่าเกม':
    'Game settings',
  'ความยาก':
    'Difficulty',
  'ง่าย (ประตูใหญ่)':
    'Easy (large portal)',
  'ปานกลาง':
    'Normal',
  'ยาก (ประตูเล็ก เคลื่อนที่)':
    'Hard (small, moving portal)',
  'ทดสอบมือสั่น':
    'Tremor test',
  '〰 ทดสอบมือสั่น':
    'Tremor test',
  'เพิ่มอาการสั่นจำลองให้ตัวชี้เมาส์ (โหมดสาธิต) เพื่อทดสอบว่าตัวกรองช่วยได้แค่ไหน':
    'Adds simulated tremor to the mouse pointer in demo mode, to show how much the filter helps',
  'ตัวกรอง One Euro':
    'One Euro filter',
  'กรองตำแหน่งตัวชี้ด้วย One Euro Filter':
    'Smooths the pointer position with the One Euro filter',
  'รัศมีการจับ':
    'Catch radius',
  'ยังไม่ปรับเทียบ (ใช้ค่ามาตรฐาน d_open 0.80 / d_close 0.25)':
    'Not calibrated yet, using the defaults d_open 0.80 / d_close 0.25',
  'ค่าปรับเทียบรายคน (Lab 27)':
    'Per-user calibration (Lab 27)',
  'ผู้เล่น:':
    'Player:',
  'guest (ยังไม่ล็อกอิน)':
    'guest (not signed in)',
  'เริ่มนับวันนี้เลย! · สถิติดีที่สุด 0 วัน':
    'Start your streak today · best streak 0 days',
  'ถูกติดกัน 3 = ×2 · 6 = ×3 · 10 = ×5 · พลาด = ×1':
    'Three in a row ×2 · six ×3 · ten ×5 · a miss resets to ×1',
  'สวิตช์หลัก: ปิดเอฟเฟกต์ เสียง อนุภาค และตัวเลขเด้งทั้งหมด':
    'Master switch: turns off effects, sound, particles and popping numbers',
  'ปุ่มลัด P':
    'Shortcut P',
  '· เตือนพักทุก':
    '· break reminder every',
  'นาที':
    'min',
  'โหมด':
    'Mode',
  'กล้อง':
    'Camera',
  '📷 กล้องจริง':
    'Real camera',
  '🧪 สัญญาณจำลอง':
    'Synthetic signal',
  '📈 ตัวกรอง':
    'Filters',
  'ปิด':
    'Off',
  'เล็กน้อย':
    'Slight',
  'มาก':
    'Marked',
  '✊ กำมือ':
    'Fist',
  '🖐️ แบมือกางนิ้ว':
    'Open and spread',
  '☝️ แตะนิ้วทีละนิ้ว':
    'Finger tap',
  '🙌 งอ-เหยียดข้อมือ':
    'Wrist flex and extend',
  '✋ ยังไม่เห็นมือ — ทำท่าให้ครบ 10 ครั้ง':
    'No hand yet — perform the gesture ten times',
  '📍 ห้องทดลองตัวนับครั้ง':
    'Repetition counter lab',
  '🔁 นับครั้งแม่นด้วย "ประตูสองบาน"':
    'Accurate counting with two gates',
  '1) คลื่นสะอาด 10 รอบ':
    '1) Clean wave, 10 cycles',
  '2) คลื่นเดิม + สัญญาณรบกวน':
    '2) Same wave with noise added',
  '3) แกว่ง 0.45–0.55 ตลอด':
    '3) Oscillating between 0.45 and 0.55 throughout',
  'ต้องนับได้':
    'Should count',
  'สองประตู':
    'Two gates',
  'เกณฑ์เดียว':
    'Single threshold',
  'เกณฑ์เดียว (ตัวเปรียบเทียบ)':
    'Single threshold (comparison)',
  '10 vs เกณฑ์เดียว 39':
    '10 vs 39 with a single threshold',
  '▶️ รันทั้ง 3 แบบ':
    'Run all three',
  '🔬 ทดลองแคบช่องประตู':
    'Try a narrower gate',
  '🎚️ ค่าเกณฑ์':
    'Thresholds',
  'enter — ต้องขึ้นเกินจึงเริ่ม':
    'enter — the score must rise above this to engage',
  'exit — ต้องลงถึง (≤) จึงปล่อย · สมการ (6) ของบทความ':
    'exit — the score must fall to this or below to release · Equation (6) of the paper',
  'minHold — ค้างอย่างน้อย (ms)':
    'minHold — minimum hold (ms)',
  'cooldown — ห้ามนับซ้ำภายใน (ms)':
    'cooldown — no further count within (ms)',
  '📋 รายการแต่ละครั้ง':
    'Every repetition',
  '↺ เริ่มนับใหม่':
    'Reset the count',
  'กราฟสัญญาณคะแนนพร้อมเส้นเกณฑ์':
    'The score signal with the threshold lines',
  '● เขียวด้านบน = สองประตูนับ · ขีดแดงด้านล่าง = เกณฑ์เดียวนับ · แถบเทา = เขตกันสั่น':
    'Green dots above: counted by the two gates · red marks below: counted by a single threshold · grey band: the hysteresis zone',
  '🖼️ บันทึกกราฟเป็น PNG':
    'Save the chart as PNG',
  'Switch language / สลับภาษา':
    'Switch language',
  'สลับเป็นภาษาไทย':
    'Switch to Thai',

  // ---------- ชุดที่ห้า  ที่เหลือจากสี่หน้าถ่ายภาพ ----------
  'ค่าเฉลี่ยเคลื่อนที่': 'Moving average',
  'มัธยฐาน': 'Median',
  'ดิบ (ไม่กรอง)': 'Unfiltered',
  'ผ่านครบทั้ง 3 แบบ ✅ พร้อมทดสอบกับมือจริง': 'All three cases pass — ready to test with a real hand',
  'วิ': 's',
  '🔒 ตรึงเกณฑ์': '🔒 Thresholds locked',
  'รัศมี': 'radius',
  'จีบ ≤': 'pinch ≤',
  'ปล่อย ≥': 'release ≥',
  'HandRehab Arcade · ถ้าย้ายกล้องหรือเปลี่ยนเครื่อง ให้ปรับเทียบใหม่':
    'HandRehab Arcade \u00b7 recalibrate after moving the camera or changing computer',
  'HandRehab Arcade · อ้างอิง: Casiez, G., Roussel, N., & Vogel, D. (2012). 1€ Filter. CHI \'12, 2527–2530.':
    'HandRehab Arcade \u00b7 after Casiez, G., Roussel, N., & Vogel, D. (2012). 1\u20ac Filter. CHI \'12, 2527\u20132530.',
  'พร้อมแล้ว!': 'Ready!',
  'เลื่อนเมาส์ = ปลายนิ้วชี้ · กดปุ่มเมาส์ค้าง = จีบนิ้ว':
    'Move the mouse to move the index fingertip \u00b7 hold the mouse button to pinch',
  'จีบดาว ⭐ ลากไปปล่อยในประตูมิติ 🌀 ภายใน 60 วินาที':
    'Pinch a star \u2b50, drag it into the portal \ud83c\udf00, within 60 seconds',
  '▶ เริ่มรอบ 60 วินาที': '\u25b6 Start a 60 second round',
  '📷 ใช้กล้อง': '\ud83d\udcf7 Use the camera',
  '📷 กลับไปใช้กล้อง': '\ud83d\udcf7 Back to the camera',
};
