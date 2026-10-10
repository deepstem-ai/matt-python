# =====================================================================
# Developer : Matthew C.
# File      : Lab_S3.py
# Lesson    : S3 - Mathematical Set Operations
# ---------------------------------------------------------------------
# Question (TH):
#   นักเรียนที่เลือกชุมนุม robot = {'A','B','C','D'} และ science =
#   {'C','D','E','F'} และ math = {'A','D','F','G'} จงหา: คนที่อยู่ทั้ง 3 ชุมนุม,
#   คนที่อยู่ robot อย่างเดียว, คนที่อยู่อย่างน้อย 2 ชุมนุม
# Question (EN):
#   Club members: robot = {'A','B','C','D'}, science = {'C','D','E','F'},
#   math = {'A','D','F','G'}. Find: members in all 3 clubs, members only in
#   robot, and members in at least 2 clubs.
# =====================================================================

robot = {'A', 'B', 'C', 'D'}  # members of the robot club
science = {'C', 'D', 'E', 'F'}  # members of the science club
math = {'A', 'D', 'F', 'G'}  # members of the math club

all_three = robot & science & math  # intersection: in every club
robot_only = robot - science - math  # difference: in robot but not in the other two
at_least_two = (robot & science) | (robot & math) | (science & math)  # union of every pairwise intersection

print("All 3 clubs   :", sorted(all_three))  # print members in all clubs
print("Robot only    :", sorted(robot_only))  # print members only in robot
print("At least 2    :", sorted(at_least_two))  # print members in 2 or more clubs
