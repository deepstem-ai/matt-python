# =====================================================================
# Developer : Matthew C.
# File      : Exam_X1.py
# Exam      : X1 - Moving Average of a CO2 Sensor (Environmental Science)
#             Tuple: slicing / generator / traversal (Basic)
# ---------------------------------------------------------------------
# Question (TH):
#   ขนาดหน้าต่าง w = SID % 3 + 2
#   ค่าเฉลี่ยเคลื่อนที่ช่วงที่ i = ค่าเฉลี่ยของ data[i : i+w] สำหรับ i = 0 ถึง len(data)-w
#   ข้อมูลเข้า: บรรทัด 1 : SID / บรรทัด 2 : ค่า CO2 (ppm) จำนวนเต็ม คั่นด้วยช่องว่าง (มีอย่างน้อย w ค่า)
#   ผลลัพธ์ 3 บรรทัด:
#     บรรทัด 1 : w
#     บรรทัด 2 : tuple ค่าเฉลี่ยเคลื่อนที่ ปัดทศนิยม 1 ตำแหน่ง
#     บรรทัด 3 : index เริ่มต้นของช่วงที่ค่าเฉลี่ยสูงที่สุด (ถ้าเท่ากันเลือก index น้อยสุด)
#                และจำนวนช่วงที่ค่าเฉลี่ย > 1000 ppm คั่นด้วยช่องว่าง
#   เงื่อนไขบังคับ: ใช้ slicing ของ tuple ในการตัดช่วง ห้ามใช้ list
# Question (EN):
#   Window size w = SID % 3 + 2. Moving average i = mean of data[i:i+w] for
#   i = 0 .. len(data)-w.
#   Output: w; tuple of moving averages (1 dp); start index of the highest
#   window (smallest index on ties) and the number of windows > 1000 ppm.
#   Rules : cut windows with tuple slicing; no list.
# Example:
#   input : 1234 / 800 950 1100 1200 900
#   output: 3
#           (950.0, 1083.3, 1066.7)
#           1 2
# =====================================================================

sid = int(input())  # line 1: student ID
data = tuple(int(x) for x in input().split())  # line 2: CO2 values stored as a tuple of ints

w = sid % 3 + 2  # window size computed from the SID

raw = tuple(sum(data[i:i + w]) / w for i in range(len(data) - w + 1))  # exact average of each tuple slice
moving = tuple(round(avg, 1) for avg in raw)  # rounded averages for display

best_index = 0  # index of the highest window found so far
for i in range(1, len(raw)):  # compare every other window
    if raw[i] > raw[best_index]:  # strictly greater keeps the smallest index on ties
        best_index = i  # remember the new best window
over_1000 = sum(1 for avg in raw if avg > 1000)  # count windows above 1000 ppm

print(w)  # output line 1: window size
print(moving)  # output line 2: tuple of moving averages
print(best_index, over_1000)  # output line 3: best index and number of windows > 1000
