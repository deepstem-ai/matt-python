# =====================================================================
# Developer : Matthew C.
# File      : Exam_X6.py
# Exam      : X6 - Attending Multiple STEM Camps (Data Management)
#             Set: multi-set operations / set.union(*) / set.intersection(*) (Basic)
# ---------------------------------------------------------------------
# Question (TH):
#   มีค่าย k ค่าย แต่ละค่ายมีรายชื่อรหัสนักเรียน (อาจซ้ำในค่ายเดียวกัน) m = SID % 2 + 2
#   ข้อมูลเข้า: บรรทัด 1 : SID / บรรทัด 2 : k / k บรรทัด : ชื่อค่าย: รหัส รหัส ... เช่น Robot: S1 S2 S3
#   ผลลัพธ์ 4 บรรทัด:
#     บรรทัด 1 : จำนวนนักเรียนทั้งหมด (ไม่ซ้ำ)
#     บรรทัด 2 : รหัสที่เข้าทุกค่าย (list เรียงแล้ว)
#     บรรทัด 3 : รหัสที่เข้าอย่างน้อย m ค่าย (list เรียงแล้ว)
#     บรรทัด 4 : ชื่อค่ายที่มีนักเรียน 'เฉพาะค่ายนั้น' (ไม่เข้าค่ายอื่นเลย) มากที่สุด และจำนวน
#                (เสมอให้เลือกค่ายที่ปรากฏก่อนในข้อมูลเข้า)
#   เงื่อนไขบังคับ: ห้ามใช้ dict นับจำนวน ต้องใช้การดำเนินการเซตเท่านั้น
# Question (EN):
#   k camps, each with student IDs (may repeat). m = SID % 2 + 2.
#   Output: total unique students; IDs in every camp (sorted list); IDs in at
#   least m camps (sorted list); the camp with the most exclusive students
#   and that count (first camp wins ties).
#   Rules : no dict for counting; set operations only.
# Example (SID 1234 -> m = 2):
#   input : 1234 / 3 / Robot: S1 S2 S3 S1 / Bio: S2 S4 / Space: S2 S3 S5 S6
#   output: 6
#           ['S2']
#           ['S2', 'S3']
#           Space 2
# =====================================================================

sid = int(input())  # line 1: student ID
k = int(input())  # line 2: number of camps
m = sid % 2 + 2  # "at least m camps" threshold

names = []  # camp names in input order
camps = []  # one set of student IDs per camp (same order as names)
for _ in range(k):  # read each camp line
    name, _, ids = input().partition(':')  # split "Name: S1 S2" at the colon
    names.append(name.strip())  # store the camp name
    camps.append(set(ids.split()))  # store the IDs as a set (duplicates removed)

everyone = set().union(*camps)  # union of all camps
in_all = set.intersection(*camps)  # intersection of all camps

at_least = [set() for _ in range(m + 1)]  # at_least[c] = students seen in at least c camps so far
for camp in camps:  # add camps one at a time
    for c in range(m, 1, -1):  # update higher levels first so this camp is not counted twice
        at_least[c] |= at_least[c - 1] & camp  # already in c-1 camps and also in this one -> at least c camps
    at_least[1] |= camp  # everybody in this camp is in at least 1 camp

best_name, best_count = None, -1  # camp with the most exclusive students so far
for i, camp in enumerate(camps):  # check every camp in input order
    others = set().union(*(camps[:i] + camps[i + 1:]))  # union of all the other camps
    exclusive = camp - others  # students only in this camp
    if len(exclusive) > best_count:  # strictly greater keeps the earlier camp on ties
        best_name, best_count = names[i], len(exclusive)  # remember the new leader

print(len(everyone))  # output line 1: total unique students
print(sorted(in_all))  # output line 2: students in every camp
print(sorted(at_least[m]))  # output line 3: students in at least m camps
print(best_name, best_count)  # output line 4: camp with most exclusive students and the count
