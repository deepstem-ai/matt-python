# =====================================================================
# Developer : Matthew C.
# File      : Exam_X7.py
# Exam      : X7 - Microbes Found Continuously in a Fermentation Tank
#             (Biotechnology) Set: in-place operations (|=, &=, -=) (Intermediate)
# ---------------------------------------------------------------------
# Question (TH):
#   แต่ละวันตรวจพบจุลินทรีย์ชุดหนึ่ง d = SID % 3 + 2 (ถ้า d มากกว่าจำนวนวัน ให้ใช้ d = จำนวนวัน)
#   ข้อมูลเข้า: บรรทัด 1 : SID / บรรทัด 2 : n (จำนวนวัน)
#     n บรรทัด : ชื่อจุลินทรีย์ที่พบในวันนั้น คั่นด้วยช่องว่าง (บรรทัดว่างได้ = ไม่พบเลย)
#   ผลลัพธ์ 4 บรรทัด (ทุกบรรทัดเป็น list ที่เรียงแล้ว):
#     บรรทัด 1 : ที่เคยพบอย่างน้อย 1 วัน
#     บรรทัด 2 : ที่พบทุกวัน
#     บรรทัด 3 : ที่พบติดต่อกันใน d วันสุดท้าย
#     บรรทัด 4 : ที่พบเฉพาะในวันแรก แต่ไม่พบอีกเลยในวันอื่น
#   เงื่อนไขบังคับ: ต้องใช้ตัวดำเนินการ |= &= -= อย่างน้อยอย่างละ 1 ครั้ง
# Question (EN):
#   Each day a set of microbes is detected. d = SID % 3 + 2 (capped at the
#   number of days). Output 4 sorted lists: ever found; found every day;
#   found in each of the last d days; found only on day 1 and never again.
#   Rules : use |=, &= and -= at least once each.
# Example (SID 1234 -> d = 3):
#   input : 1234 / 4 / Lacto Bacil Yeast / Lacto Yeast Asper / Lacto Yeast / Lacto Yeast Bacil
#   output: ['Asper', 'Bacil', 'Lacto', 'Yeast']
#           ['Lacto', 'Yeast']
#           ['Lacto', 'Yeast']
#           []
# =====================================================================

sid = int(input())  # line 1: student ID
n = int(input())  # line 2: number of days
days = [set(input().split()) for _ in range(n)]  # one set per day (a blank line becomes an empty set)

d = min(sid % 3 + 2, n)  # window of last days, capped at the number of days

ever = set()  # microbes found on at least one day
for day in days:  # go through every day
    ever |= day  # in-place union

every_day = set(days[0])  # start from a copy of day 1
for day in days[1:]:  # every following day
    every_day &= day  # in-place intersection keeps only microbes found again

last_d = set(days[n - d])  # start from the first day of the last-d window
for day in days[n - d + 1:]:  # the remaining days in the window
    last_d &= day  # keep microbes present on every one of those days

first_only = set(days[0])  # start from day 1
for day in days[1:]:  # every other day
    first_only -= day  # in-place difference removes anything seen again

print(sorted(ever))  # output line 1
print(sorted(every_day))  # output line 2
print(sorted(last_d))  # output line 3
print(sorted(first_only))  # output line 4
