# =====================================================================
# Developer : Matthew C.
# File      : Lab_T9.py
# Lesson    : T9 - Comparing and Sorting Tuples
# ---------------------------------------------------------------------
# Question (TH):
#   กำหนด runners = (('Ann', 12.4), ('Bo', 11.9), ('Cy', 12.4), ('Di', 11.5))
#   (ชื่อ, เวลาวิ่ง 100 m) จงเรียงจากเร็วไปช้า ถ้าเวลาเท่ากันเรียงตามชื่อ
#   และพิมพ์อันดับ 1-4
# Question (EN):
#   Given runners = (('Ann', 12.4), ('Bo', 11.9), ('Cy', 12.4), ('Di', 11.5))
#   (name, 100 m time), sort from fastest to slowest; if times are equal,
#   sort by name. Print ranks 1-4.
# =====================================================================

runners = (('Ann', 12.4), ('Bo', 11.9), ('Cy', 12.4), ('Di', 11.5))  # (name, time) records

ranking = sorted(runners, key=lambda r: (r[1], r[0]))  # sort key is a tuple: time first, then name

for rank, (name, time) in enumerate(ranking, start=1):  # number the results from 1 and unpack each record
    print(rank, name, time)  # print rank, runner name and time
