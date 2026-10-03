# Lab 29 — Progress Charts · กราฟพัฒนาการ

**Goal:** let players **see themselves improving**, which is the strongest motivation in rehabilitation. The page has a rising line, a consistency calendar, and encouragement in plain language.
เป้าหมาย: ให้ผู้ใช้เห็นว่าตัวเองดีขึ้น กราฟขึ้น ปฏิทินความสม่ำเสมอ และคำชมภาษาคน

## How to run · วิธีเปิด
`start.bat` · `bash start.sh` · or `python -m http.server 8000` and open http://localhost:8000.
`index.html` is the **progress page** (`progress.html` redirects to it). It reads the same database as Labs 23-28 (`handrehab-arcade`). If you open it from the same address and port as Lab 28, the sessions you played there appear here.
No data? Press **🧪 สร้างประวัติจำลอง 30 วัน** (the same generator as Lab 28; its rows are tagged synthetic, and 🧹 removes them).

## What the page shows · สิ่งที่แสดง
1. **4 stat cards:** total sessions · reps in the last 7 days · **best spread angle** (with its date) · 🔥 current streak (≥ 5 min/day) + best streak.
2. **Plain-language summary**, computed from real data (`js/progress-data.js › weeklySummary`). It compares the last 7 days with the 7 days before, e.g. *"สัปดาห์นี้คุณฝึกมากกว่าสัปดาห์ก่อน 6% (73 นาที เทียบกับ 68 นาที) เก่งมาก!"*, and adds lines about reps, accuracy, spread angle and streak. It **always stays encouraging**. If the numbers fall, it says, for example, *"ไม่เป็นไรเลย ลองตั้งเป้าเล็ก ๆ วันละ 5 นาที…"* or *"ร่างกายมีวันดีวันเหนื่อยเป็นเรื่องปกติ สถิติดีของคุณ (41°) ยังอยู่…"*.
3. **Three line charts** (7 / 30 / 90-day switch):
   ภาพที่ 1 reps per day (training-free days = 0) ·
   ภาพที่ 2 accuracy per day (%, dashed 80 % goal) ·
   ภาพที่ 3 **maximum finger spread per day** (degrees, index–little). This is the most important rehab measure.
   **Tap any point** to see its value.
4. ภาพที่ 4 **consistency calendar**, 12 weeks (darker = more sessions that day) · ภาพที่ 5 a bar chart of reps by game.
5. **🖼 บันทึกทุกกราฟเป็น PNG** saves 5 PNGs (`progress-1-reps-per-day.png` …) with solid backgrounds, ready for the report.
6. **Empty state:** with fewer than **3 training days** the charts are hidden and an invitation to start training is shown instead.
7. **Senior mode:** the **Aa ผู้สูงอายุ** switch in the header sets `profile-elder` (base font 21.6 px). Chart text scales with `--fs-base`, and chart heights are in `rem`, so they grow too. Every chart has axis labels with units and a Thai caption.

## `js/charts.js` check · ตรวจไลบรารีกราฟ
`lineChart` (axes, gridlines, labels, reference lines, multi-series legend, and `hitTest(x,y)` for tapping), `barChart` (value labels, optional SD whiskers) and `heatmapCalendar` (12 weeks, darker = more) were all verified on this page.
Two core bugs were fixed here: (1) in `barChart`, the SD whisker's `lineTo` sat inside a `//` comment, so the vertical whisker line was never drawn; (2) in `lineChart`, the multi-series legend overlapped the title. The legend now has its own row.

## Files · ไฟล์
| File | Role |
|---|---|
| `index.html` (+ `progress.html` redirect), `js/progress-page.js`, `css/progress.css` | The page |
| `js/progress-data.js` | Pure data: daily stats, stat cards, weekly summary text |
| `js/charts.js` | Hand-written canvas charts (no libraries) |
| `js/demo-history.js` | 30-day synthetic history generator (from Lab 28) |
| `js/streak.js`, `js/user-picker.js` | Streak logic, player picker |
| `tests/progress.test.mjs` | `node tests/progress.test.mjs`: 12 checks (summary stays encouraging, cards, generator trends) |
| other `js/*`, `css/*`, `start.*` | Shared core |

## Blanks we filled in · ค่าที่เติม
| Blank | Value |
|---|---|
| heatmapCalendar covering the last ___ weeks | **12 weeks** |
| Four stat cards, for example ___ ___ ___ ___ | **total sessions · reps this week · best spread angle · current streak** |
| "this week you trained ___ percent more than last week" | computed: (minutes this week − minutes last week) / minutes last week |

## Article alignment (MITIJ article)

- `js/charts.js` `barChart` accepts optional reference lines `opts.lines = [{ value, color, label }]` (used for the SUS 68 line in Lab 36). Existing charts are unchanged.

## MUST / PASS checklist · วิธีตรวจ
- [ ] At least 5 days of data exist (real play from Lab 28, or 🧪 demo). The charts render, and tapping a point shows its value.
- [ ] Change the numbers (delete some recent sessions in Lab 28). The summary text changes and stays encouraging. It is never hard-coded.
- [ ] **🖼 Save as PNG:** 5 image files download.
- [ ] Switch to **Aa ผู้สูงอายุ**: the chart text and heights get bigger and are still readable.
- [ ] Brand-new player (➕ ผู้ใช้ทดลอง): the invitation appears instead of empty charts.
- [ ] Show the page to an adult. If they don't understand a chart, simplify it.
- [ ] **PASS:** ≥ 5 days of data, the charts render correctly, and they save as images.

> Placeholders to change: "HandRehab Arcade", "ทีม NeonHands", "โรงเรียนของเรา". Synthetic demo data must not be reported as results.
