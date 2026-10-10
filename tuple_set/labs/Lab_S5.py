# =====================================================================
# Developer : Matthew C.
# File      : Lab_S5.py
# Lesson    : S5 - Set Relationships (Subset, Superset, Disjoint)
# ---------------------------------------------------------------------
# Question (TH):
#   วิชาบังคับ core = {'MATH101','PHY101','CHEM101'} นักเรียนผ่าน passed =
#   {'MATH101','CHEM101','BIO101'} จงตรวจว่าผ่านวิชาบังคับครบหรือไม่
#   แสดงวิชาที่ยังขาด และตรวจว่าวิชาเลือก {'ART1','BIO101'}
#   ซ้ำกับที่ผ่านแล้วหรือไม่
# Question (EN):
#   Core courses core = {'MATH101','PHY101','CHEM101'}; the student passed
#   passed = {'MATH101','CHEM101','BIO101'}. Check whether all core courses
#   are passed, show the missing ones, and check whether the electives
#   {'ART1','BIO101'} overlap with the passed courses.
# =====================================================================

core = {'MATH101', 'PHY101', 'CHEM101'}  # required courses
passed = {'MATH101', 'CHEM101', 'BIO101'}  # courses the student has passed
electives = {'ART1', 'BIO101'}  # elective courses being considered

print("All core passed:", core <= passed)  # subset test: is every core course in passed?
print("Same check with issuperset:", passed.issuperset(core))  # the same idea written as a superset test
print("Missing core   :", sorted(core - passed))  # difference: core courses not yet passed

no_overlap = electives.isdisjoint(passed)  # True if the two sets share nothing
print("Electives overlap passed:", not no_overlap)  # print whether there is an overlap
print("Overlapping courses     :", sorted(electives & passed))  # show which courses overlap
