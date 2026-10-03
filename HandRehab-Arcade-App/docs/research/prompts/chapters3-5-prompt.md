# Lab 39 prompt — filled in (paste into Claude Code)

> ก่อนใช้: Lab 37 ต้องเสร็จแล้ว (evidence/SUMMARY.md มีตัวเลขจริงพร้อมไฟล์ที่มา)
> ทางลัด: เปิด `index.html` ของแลปนี้ ลาก CSV ทั้งหมดใส่ จะได้ร่างบทที่ 3–5 ที่มีตารางจริงทันที แล้วค่อยใช้ prompt นี้ช่วยเกลาภาษา
> ห้ามวางไฟล์ตัวอย่าง DEMO-*.csv ลงไป

---

Help me draft Chapters 3, 4 and 5 of my research report from real data.

DATA I AM ATTACHING
<<< paste evidence/SUMMARY.md >>>
<<< paste every CSV of experimental results:
    evidence/02-charts-tables/lab32-evaluation.csv   (requested, detected, lighting, brightness)
    evidence/02-charts-tables/lab33-benchmark.csv    (machine, scenario, avgFps, minFps, aiMs)
    evidence/02-charts-tables/lab15-face-login.csv   (trial, correct, ms)
    evidence/02-charts-tables/lab27-filters.csv      (filter, jitter, reduction %, delay ms)
    evidence/02-charts-tables/lab21-rep-test.csv     (actual, counted)
    evidence/02-charts-tables/lab28-sessions.csv     (game, reps, accuracy, maxSpreadDeg ...)
    evidence/02-charts-tables/lab36-survey-responses.csv and lab36-survey-summary.csv
    evidence/04-documents/lab36-task-results.csv and lab36-issues.csv >>>
<<< list the charts that already exist:
    lab32-confusion-matrix.png, lab32-lighting-accuracy.png, lab33-machine-compare.png,
    lab27-filter-compare.png, lab29-progress-chart.png, lab29-calendar.png, lab24-reaction-time.png,
    lab36-survey-chart.png (check evidence/CHECKLIST.md for which ones we really have) >>>

CHAPTER 3 — RESEARCH METHODOLOGY
- A system architecture diagram, written so I can redraw it (ASCII boxes: webcam → MediaPipe Hand/Face
  → geometry → One Euro → gestures + kNN → rep counter ← calibration → 3 games → IndexedDB → CSV/PNG)
- The development process, organised by the eight missions
- Every equation used, written so someone else could reproduce the work:
  palmScale, normDist, joint angle, finger curl, spread angle, scoreLow/scoreHigh, calibration threshold
  T = r − k(r − b), tremor SD, hysteresis rep counter, One Euro filter, cosine similarity, EAR blink,
  kNN distance + vote, accuracy/precision/recall/F1, mean and sample SD, FPS, image brightness (luma)
- Tools and equipment, stating real versions and models (MediaPipe Tasks Vision 0.10.14, the browser
  version, Python version, camera model, every test computer's CPU/RAM/GPU)
- The experimental procedure and how data was collected (5 experiments: Lab 32, 33, 15, 27, 36)
- Participant selection criteria, both inclusion and exclusion (+ withdrawal criteria)

CHAPTER 4 — RESULTS
- Organised into subsections matching each objective from Chapter 1 (4.1 gestures, 4.2 lighting,
  4.3 machines, 4.4 face login, 4.5 older adults, 4.6 extra results, 4.7 hypothesis summary)
- Every subsection must carry a table or a chart with a caption beneath it and a line "ที่มา: ไฟล์ ..."
- Report means and standard deviations in full
- Compare results across the different computers tested

CHAPTER 5 — CONCLUSION, DISCUSSION AND RECOMMENDATIONS
- Explain why accuracy fell in dim light, connected back to how the model works in Chapter 2
  (two-stage palm detector + landmark CNN, sensor noise, motion blur, confidence thresholds, training distribution)
- Explain why some gestures were harder to detect than others (occlusion, single-camera depth, small curl change)
- At least five limitations of the work, admitted honestly
- At least five recommendations and directions for future work, including edge deployment on a
  Jetson Orin Nano kiosk in a nurse's room or seniors' centre

IRON RULE: never invent a number. Where data is missing, tell me where I must go back and measure,
written as [[missing: กลับไป Lab NN — what to measure]].
Every table must state which file it came from.
For the discussion paragraphs, give me bullet-point talking points only — our team writes the prose.
