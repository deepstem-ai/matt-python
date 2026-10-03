// ============================================================
// datasets-config.js — รายการชุดข้อมูล + ลิงก์หลัก/สำรอง + เงื่อนไขสัญญาอนุญาต (Lab 30)
// ต้องตรงกับตารางใน datasets/SOURCES.md เสมอ (แก้ที่หนึ่ง ต้องแก้อีกที่หนึ่ง)
// ลิงก์เรียงตามลำดับที่จะลอง: ตัวแรกพังก็ไปตัวถัดไปอัตโนมัติ ตัวท้ายสุดคือไฟล์ในโฟลเดอร์ datasets/ ของเราเอง
// ============================================================
const MP = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16';

export const DATASETS = {
  hagrid: {
    name: 'HaGRID — ป้าย annotation ท่ามือ (JSON)',
    expect: 'json', minBytes: 200,
    links: [
      { url: 'datasets/hagrid-annotations.json', label: 'ไฟล์ HaGRID จริงที่ทีมวางไว้ใน datasets/' },
      { url: 'datasets/sample-hagrid-annotations.json', label: 'ตัวอย่างจำลองที่มากับแอป (synthetic)' },
    ],
    manualUrl: 'https://github.com/hukenovs/hagrid',
    fileName: 'hagrid-annotations.json',
    howTo: 'ดาวน์โหลดไฟล์ annotations จากหน้า GitHub ของ HaGRID แตก zip แล้วเลือกไฟล์ท่าเดียว (เช่น like.json) เปลี่ยนชื่อเป็น hagrid-annotations.json วางในโฟลเดอร์ datasets/',
    licence: {
      title: 'CC BY-SA 4.0 (Creative Commons Attribution-ShareAlike 4.0)',
      can: ['ใช้เพื่อการศึกษา วิจัย และเชิงพาณิชย์ได้', 'ดัดแปลง/ตัดบางส่วนมาใช้ได้'],
      must: ['ต้องอ้างอิงผู้สร้าง (Kapitanov et al., HaGRID) และลิงก์ที่มา', 'ถ้าเผยแพร่ข้อมูลที่ดัดแปลง ต้องใช้สัญญาอนุญาตแบบเดียวกัน (ShareAlike)'],
      cannot: ['ห้ามอ้างว่าเป็นข้อมูลของเราเอง', 'ห้ามพยายามระบุตัวบุคคลในภาพ'],
      note: 'ไฟล์ sample-hagrid-annotations.json เป็นข้อมูลจำลองที่ทีมสร้างเอง ใช้รูปแบบเดียวกับ HaGRID เพื่อให้ทำงานออฟไลน์ได้ — ห้ามนำไปรายงานว่าเป็นผลจาก HaGRID จริง',
    },
  },
  landmarks: {
    name: 'จุดมือ 21 จุดต่อท่า (CSV) — ข้อมูลของทีม',
    expect: 'csv', minBytes: 200,
    links: [
      { url: 'datasets/landmarks.csv', label: 'ไฟล์ที่ทีมบันทึกเอง (Lab 19/28) วางไว้ใน datasets/' },
      { url: 'datasets/sample-landmarks.csv', label: 'ตัวอย่างจำลองที่มากับแอป (synthetic)' },
    ],
    manualUrl: 'datasets/sample-landmarks.csv',
    fileName: 'landmarks.csv',
    howTo: 'ส่งออก CSV จาก Lab 19 หรือ Lab 28 แล้วเปลี่ยนชื่อเป็น landmarks.csv วางในโฟลเดอร์ datasets/',
    licence: {
      title: 'ข้อมูลของทีม NeonHands — ใช้ภายในโครงงานเท่านั้น',
      can: ['ใช้ฝึกและทดสอบ AI ในโครงงานนี้'],
      must: ['ต้องมีใบยินยอมจากเจ้าของมือทุกคน', 'ต้องลบข้อมูลเมื่อเจ้าของขอ'],
      cannot: ['ห้ามเผยแพร่ข้อมูลที่ระบุตัวบุคคลได้ต่อสาธารณะ'],
      note: 'ไฟล์ sample-landmarks.csv สร้างจากมือจำลอง (คอลัมน์ source = synthetic) ไม่ใช่มือคนจริง',
    },
  },
  mediapipe: {
    name: 'โมเดล MediaPipe Hand Landmarker (.task, ไฟล์ไบนารี)',
    expect: 'binary', minBytes: 5_000_000, magic: 'PK\x03\x04', // ไฟล์ .task คือไฟล์ zip จึงมีรหัส "PK\x03\x04" อยู่ต้นไฟล์
    links: [
      { url: `${MP}/1/hand_landmarker.task`, label: 'Google Cloud Storage (ลิงก์หลัก /1/)' },
      { url: `${MP}/latest/hand_landmarker.task`, label: 'Google Cloud Storage (ลิงก์สำรอง /latest/)' },
      { url: 'datasets/hand_landmarker.task', label: 'สำเนาในโฟลเดอร์ datasets/' },
    ],
    manualUrl: `${MP}/1/hand_landmarker.task`,
    fileName: 'hand_landmarker.task',
    howTo: 'เปิดลิงก์ด้านล่างด้วยเบราว์เซอร์ที่บ้าน ไฟล์จะดาวน์โหลดเอง (ประมาณ 7.5 MB) แล้ววางไว้ที่ datasets/hand_landmarker.task',
    licence: {
      title: 'Apache License 2.0 (ตามการ์ดโมเดลของ MediaPipe — verify)',
      can: ['ใช้ ดัดแปลง แจกจ่าย รวมถึงเชิงพาณิชย์'],
      must: ['คงประกาศลิขสิทธิ์และสำเนาสัญญาอนุญาตไว้เมื่อแจกจ่ายต่อ', 'อ่านการ์ดโมเดล (model card) เรื่องความเป็นธรรมและข้อจำกัด'],
      cannot: ['ห้ามใช้ชื่อ/เครื่องหมายการค้าของ Google เพื่อรับรองผลงานเรา'],
      note: 'สิ่งนี้คือโมเดลที่ฝึกมาแล้ว ไม่ใช่ชุดข้อมูลดิบ — ใส่ไว้เพื่อฝึกดาวน์โหลดไฟล์ใหญ่พร้อมตรวจ magic bytes และเพื่อบันทึกที่มาของโมเดลที่แอปใช้',
    },
  },
  freihand: {
    name: 'FreiHAND — จุดข้อต่อมือ 3 มิติ (ไฟล์ใหญ่ ดาวน์โหลดเอง)',
    expect: 'json', minBytes: 1000, tooBig: true,
    links: [],
    manualUrl: 'https://lmb.informatik.uni-freiburg.de/projects/freihand/',
    fileName: 'training_xyz.json',
    howTo: 'ไฟล์ทั้งชุดใหญ่หลาย GB เบราว์เซอร์โหลดทั้งหมดไม่ไหว ให้ดาวน์โหลดที่บ้าน แตก zip แล้วเลือกเฉพาะ training_xyz.json มาเปิดด้วยปุ่ม "📂 โหลดจากเครื่อง"',
    licence: {
      title: 'ใช้เพื่อการวิจัยเท่านั้น ห้ามเชิงพาณิชย์ (research-only — verify ข้อความเต็มบนเว็บไซต์)',
      can: ['ใช้เพื่อการศึกษาและวิจัยที่ไม่แสวงหากำไร'],
      must: ['อ้างอิงบทความ Zimmermann et al., ICCV 2019'],
      cannot: ['ห้ามใช้เชิงพาณิชย์', 'ห้ามแจกจ่ายไฟล์ต่อเอง ให้ชี้ไปที่เว็บไซต์ต้นทาง'],
      note: 'ตรวจเงื่อนไขล่าสุดบนเว็บไซต์ของมหาวิทยาลัยไฟรบวร์กก่อนใช้ทุกครั้ง',
    },
  },
};
