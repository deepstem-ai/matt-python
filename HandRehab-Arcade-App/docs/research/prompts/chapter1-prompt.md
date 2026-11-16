# Lab 38 prompt — filled in (paste into Claude Code)

> วิธีใช้: เปิด `evidence/SUMMARY.md` (Lab 37) คัดลอกตัวเลขจริงมาวางในช่อง `<<< ... >>>` ด้านล่าง
> หรือใช้หน้า `index.html` ของแลปนี้ ซึ่งสร้างร่างให้โดยไม่ต้องใช้ AI เลย แล้วค่อยใช้ prompt นี้ช่วยเกลาภาษา
> ห้ามวางตัวเลขตัวอย่าง (DEMO) ลงไป

---

Help me draft Chapter 1 of my research report from the real data I collected.

DATA I AM ATTACHING
<<< paste the user testing results from Lab 36:
    - evidence/02-charts-tables/lab36-survey-summary.csv (mean and SD per question)
    - evidence/04-documents/lab36-task-results.csv summary (tasks done alone / with help / failed, time per task)
    - number of participants, their age range, and the 5+ issues found and fixed (lab36-issues.csv) >>>
<<< paste the accuracy figures and lighting results from Lab 32:
    - overall accuracy, precision / recall / F1 per gesture
    - accuracy + measured mean image brightness for bright / normal / dim
    - trials per gesture, and the brightness value we used to call a room "dim" >>>
<<< paste the machine comparison table from Lab 33:
    - machine name, CPU, RAM, GPU, browser version, average FPS, minimum FPS, AI ms per frame >>>
<<< paste the list of gestures the system supports from Lab 20:
    pinch (จีบนิ้ว), fist (กำมือ), open/spread (แบมือกางนิ้ว), finger tap (แตะนิ้วทีละนิ้ว), wrist flex (งอ-เหยียดข้อมือ)
    + the gestures our team invented and taught in Lab 31, with the kNN result out of 10 >>>
<<< paste the calibrated values from Lab 27 (pinch entry / exit threshold of a real participant, k values) and the rep-counter settings from Lab 21 (enter, exit, minHoldMs, cooldownMs) >>>

WRITE SEVEN SECTIONS IN FORMAL THAI

1) BACKGROUND AND SIGNIFICANCE
   Structure it as an inverted triangle: the broad problem (Thailand's ageing society and loss of hand function
   after stroke, arthritis and Parkinson's), then the patient's problem (home exercise is repetitive, boring,
   gives no feedback, and travel to hospital is hard), then the weakness of existing approaches (sensor gloves
   and robots are expensive and hard to wear; phone apps only measure taps, not real hand movement),
   closing with the solution we propose (a browser game using a normal webcam + MediaPipe 21-point hand tracking,
   on-device processing, face login, per-person calibration).
   For national statistics, leave a marker [[ใส่สถิติจากแหล่งอ้างอิงจริง: ...]] — do not write any statistic yourself.

2) RESEARCH OBJECTIVES
   Every objective must be measurable. Never use a bare phrase such as to study.
   Every objective must have somewhere it is answered in Chapter 4:
   4.1 gesture accuracy (P/R/F1) · 4.2 three lighting conditions · 4.3 machine performance ·
   4.4 face login accuracy and time · 4.5 older-adult usability and satisfaction.

3) HYPOTHESES — at least three that I already have real data to answer
   H1 accuracy in dim light is lower than in normal light (Lab 32)
   H2 average FPS ≥ 15 on a mid-range machine (Lab 16 pass criterion, data from Lab 33)
   H3 mean satisfaction ≥ 3.51 on the 5-point scale (criterion chosen by our team, data from Lab 36)
   H4 One Euro reduces jitter more than moving average with less delay (Lab 27)
   H5 face login completes within 5 seconds (Lab 15 pass criterion)

4) SCOPE OF THE RESEARCH — divided into population and sample, supported gestures,
   hardware, software (HTML/CSS/JS, MediaPipe Tasks Vision 0.10.14, IndexedDB), and duration

5) VARIABLES — separating independent (lighting, gesture, machine, filter type),
   dependent (accuracy, precision, recall, F1, FPS, AI ms, login time, task success, satisfaction)
   and controlled variables (camera distance, resolution, trials per gesture, same camera/browser/library version)

6) OPERATIONAL DEFINITIONS — at least eight terms, each defined so it can be measured, for example
   a pinch means the distance between the thumb tip and the index fingertip divided by the palm size
   falling below <<< the entry threshold from Lab 27 calibration, e.g. the value saved for participant P01 >>>,
   a value obtained through per-person calibration (T = rest − k × (rest − best)).
   Also define: palm scale d(P0,P9), normalised distance, finger curl, fist, open/spread angle,
   one repetition (hysteresis enter/exit + min hold + cooldown), accuracy, precision/recall/F1,
   dim light (mean image brightness below the value we measured), FPS, face-login time, older adult (≥ 60), satisfaction.

7) EXPECTED BENEFITS — divided into benefits for patients, for medical staff,
   and for the field of computer science

IRON RULE: every number must come from the data I supplied. Never invent a number.
Where I have no data, leave a blank and tell me which lab I must return to and measure,
written as [[missing: กลับไป Lab NN — what to measure]].
