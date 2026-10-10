# =====================================================================
# Developer : Matthew C.
# File      : Lab_T7.py
# Lesson    : T7 - Nested Tuple (Tuple inside Tuple)
# ---------------------------------------------------------------------
# Question (TH):
#   กำหนด scores = (('A', 78, 85), ('B', 92, 88), ('C', 65, 70))
#   (ชื่อ, คะแนนฟิสิกส์, คะแนนเคมี) จงพิมพ์ชื่อและคะแนนรวมของแต่ละคน
#   และหาชื่อคนที่ได้คะแนนเคมีสูงสุด
# Question (EN):
#   Given scores = (('A', 78, 85), ('B', 92, 88), ('C', 65, 70))
#   (name, physics score, chemistry score), print each name with the total
#   score, and find the name of the person with the highest chemistry score.
# =====================================================================

scores = (('A', 78, 85), ('B', 92, 88), ('C', 65, 70))  # nested tuple: (name, physics, chemistry)

for name, physics, chemistry in scores:  # unpack each inner tuple into 3 variables
    print(name, physics + chemistry)  # print the name and the total of both scores

best = max(scores, key=lambda s: s[2])  # pick the inner tuple with the largest chemistry score (index 2)
print("Highest chemistry:", best[0])  # print the name (index 0) of that student
