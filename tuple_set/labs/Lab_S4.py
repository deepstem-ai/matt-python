# =====================================================================
# Developer : Matthew C.
# File      : Lab_S4.py
# Lesson    : S4 - In-place Updates (|=, &=, -=, ^=)
# ---------------------------------------------------------------------
# Question (TH):
#   ข้อมูลสัปดาห์ละชุดของเซนเซอร์ที่ 'ส่งค่าผิดพลาด'
#   w = [{'S1','S4'},{'S4','S7'},{'S4','S1','S9'}] จงใช้ |= และ &=
#   หาเซนเซอร์ที่เคยผิดพลาด และที่ผิดพลาดทุกสัปดาห์
# Question (EN):
#   Weekly sets of sensors that sent faulty values:
#   w = [{'S1','S4'},{'S4','S7'},{'S4','S1','S9'}]. Use |= and &= to find
#   sensors that have ever failed and sensors that failed every week.
# =====================================================================

w = [{'S1', 'S4'}, {'S4', 'S7'}, {'S4', 'S1', 'S9'}]  # one set of faulty sensors per week

ever_failed = set()  # start empty; we will grow it with |=
every_week = set(w[0])  # start with a copy of week 1; we will shrink it with &=

for week in w:  # go through each week's set
    ever_failed |= week  # in-place union: add every sensor seen this week
    every_week &= week  # in-place intersection: keep only sensors also faulty this week

print("Ever failed :", sorted(ever_failed))  # sensors that failed at least once
print("Every week  :", sorted(every_week))  # sensors that failed in all weeks
