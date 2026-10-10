# =====================================================================
# Developer : Matthew C.
# File      : Exercise_E1.py
# Exercise  : E1 - Period of a Simple Pendulum (Physics)
#             Tuple: create / generator / index (Basic)
# ---------------------------------------------------------------------
# Question (TH):
#   นักเรียนวัดความยาวเชือกลูกตุ้มหลายค่า ต้องการคำนวณคาบ T = 2*pi*sqrt(L/g)
#   ค่า g ของแต่ละคนไม่เท่ากัน: g = 9.78 + (SID % 5) / 100
#   (SID = เลขประจำตัวนักเรียน 4 หลักสุดท้ายของตนเอง)
#   ข้อมูลเข้า (input) 2 บรรทัด:
#     บรรทัด 1 : SID
#     บรรทัด 2 : ความยาวเชือก (เมตร) คั่นด้วยช่องว่าง
#   ผลลัพธ์ (output) 3 บรรทัด:
#     บรรทัด 1 : ค่า g ที่ใช้ (ทศนิยม 2 ตำแหน่ง)
#     บรรทัด 2 : tuple ของคาบแต่ละค่า ปัดทศนิยม 3 ตำแหน่ง
#     บรรทัด 3 : ตำแหน่ง (index) ของความยาวที่ให้คาบใกล้ 1.000 วินาทีมากที่สุด
#   เงื่อนไขบังคับ:
#     - เก็บความยาวและคาบเป็น tuple เท่านั้น ห้ามสร้าง list
#     - ใช้ generator expression สร้าง tuple ของคาบ
# Question (EN):
#   Compute the period T = 2*pi*sqrt(L/g) for several string lengths, where
#   g = 9.78 + (SID % 5) / 100.
#   Input : line 1 = SID, line 2 = lengths in metres separated by spaces.
#   Output: line 1 = g (2 decimals), line 2 = tuple of periods (3 decimals),
#           line 3 = index of the length whose period is closest to 1.000 s.
#   Rules : store lengths and periods as tuples only (no list); build the
#           periods tuple with a generator expression.
# Example:
#   input : 1234            output: 9.82
#           0.25 0.5 1.0            (1.003, 1.418, 2.005)
#                                   0
# =====================================================================

import math  # math module gives pi and sqrt

sid = int(input())  # line 1: read the student ID and convert it to an integer
lengths = tuple(float(x) for x in input().split())  # line 2: read lengths and store them as a tuple of floats

g = 9.78 + (sid % 5) / 100  # personal gravity value computed from the SID

periods = tuple(round(2 * math.pi * math.sqrt(L / g), 3) for L in lengths)  # generator expression -> tuple of periods

closest = min(range(len(periods)), key=lambda i: abs(periods[i] - 1.0))  # index whose period is nearest 1.000 s

print(f"{g:.2f}")  # output line 1: g with 2 decimal places
print(periods)  # output line 2: the tuple of periods
print(closest)  # output line 3: the index closest to 1 second
