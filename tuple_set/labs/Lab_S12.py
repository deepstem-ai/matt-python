# =====================================================================
# Developer : Matthew C.
# File      : Lab_S12.py
# Lesson    : S12 - Real-world Use Cases and Patterns of Set
# ---------------------------------------------------------------------
# Question (TH):
#   รายชื่อนักเรียนที่ส่งงานสัปดาห์ที่ 1 และ 2: w1 = {'S1','S2','S3','S5'},
#   w2 = {'S2','S3','S4','S6'} จงหาคนที่ส่งครั้งแรกในสัปดาห์ 2 คนที่หยุดส่ง
#   และ Jaccard ของสองสัปดาห์ (ทศนิยม 2 ตำแหน่ง)
# Question (EN):
#   Students who submitted work in week 1 and week 2:
#   w1 = {'S1','S2','S3','S5'}, w2 = {'S2','S3','S4','S6'}. Find who
#   submitted for the first time in week 2, who stopped submitting, and the
#   Jaccard similarity of the two weeks (2 decimal places).
# =====================================================================

w1 = {'S1', 'S2', 'S3', 'S5'}  # students who submitted in week 1
w2 = {'S2', 'S3', 'S4', 'S6'}  # students who submitted in week 2

new_in_week2 = w2 - w1  # in week 2 but not week 1 -> first-time submitters
stopped = w1 - w2  # in week 1 but not week 2 -> stopped submitting
jaccard = len(w1 & w2) / len(w1 | w2)  # Jaccard = |intersection| / |union|

print("New in week 2 :", sorted(new_in_week2))  # print first-time submitters
print("Stopped       :", sorted(stopped))  # print students who stopped
print(f"Jaccard       : {jaccard:.2f}")  # print the similarity with 2 decimal places
