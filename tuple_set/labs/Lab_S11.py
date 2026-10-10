# =====================================================================
# Developer : Matthew C.
# File      : Lab_S11.py
# Lesson    : S11 - Tuple + Set Working Together
# ---------------------------------------------------------------------
# Question (TH):
#   กำหนด volts = (1.5, 3.0, 4.5, 6.0, 7.5, 1.5) จงหาคู่ถ่านไฟฉาย
#   (ต่างตำแหน่งกัน) ที่ต่ออนุกรมแล้วได้ 9.0 V พอดี
#   เก็บเป็น set ของ tuple ที่เรียงแล้ว
# Question (EN):
#   Given volts = (1.5, 3.0, 4.5, 6.0, 7.5, 1.5), find pairs of batteries
#   (at different positions) that give exactly 9.0 V in series. Store them
#   as a set of sorted tuples.
# =====================================================================

volts = (1.5, 3.0, 4.5, 6.0, 7.5, 1.5)  # battery voltages (the tuple keeps their positions)
TARGET = 9.0  # required total voltage

pairs = set()  # set of (smaller, larger) tuples, so duplicates disappear automatically
for i in range(len(volts)):  # first battery position
    for j in range(i + 1, len(volts)):  # second battery position, always after i (different batteries)
        if volts[i] + volts[j] == TARGET:  # series voltage equals the target?
            pairs.add(tuple(sorted((volts[i], volts[j]))))  # store as a sorted tuple, e.g. (1.5, 7.5)

print("Pairs giving 9.0 V:", sorted(pairs))  # print the unique pairs in order
print("Number of pairs   :", len(pairs))  # print how many unique pairs there are
