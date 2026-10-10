# =====================================================================
# Developer : Matthew C.
# File      : Exercise_E4.py
# Exercise  : E4 - Hotspots on a Solar Panel (Engineering)
#             Tuple: nested tuple / 2-D traversal (Intermediate)
# ---------------------------------------------------------------------
# Question (TH):
#   กล้องความร้อนวัดอุณหภูมิของแผงเป็นตาราง r แถว
#   จุดร้อน คือช่องที่มีอุณหภูมิ > ค่าเฉลี่ยทั้งแผง + d โดย d = SID % 4 + 2
#   ข้อมูลเข้า: บรรทัด 1 : SID / บรรทัด 2 : r (จำนวนแถว)
#     r บรรทัดถัดไป : อุณหภูมิแต่ละช่อง คั่นด้วยช่องว่าง (ทุกแถวยาวเท่ากัน)
#   ผลลัพธ์ 3 บรรทัด:
#     บรรทัด 1 : ค่าเฉลี่ยทั้งแผง ทศนิยม 2 ตำแหน่ง
#     บรรทัด 2 : tuple ของพิกัด (แถว, คอลัมน์) ของจุดร้อน เรียงจากซ้ายไปขวา บนลงล่าง
#     บรรทัด 3 : tuple ค่าเฉลี่ยของแต่ละคอลัมน์ ปัด 1 ตำแหน่ง
#   เงื่อนไขบังคับ: เก็บตารางเป็น tuple ซ้อน tuple และหาค่าเฉลี่ยคอลัมน์ด้วย zip(*grid)
# Question (EN):
#   A thermal camera measures the panel as a grid of r rows. A hotspot is a
#   cell hotter than (panel average + d), d = SID % 4 + 2.
#   Output: line 1 = panel average (2 decimals), line 2 = tuple of hotspot
#   (row, col) in reading order, line 3 = tuple of column averages (1 decimal).
#   Rules : the grid is a nested tuple; column averages use zip(*grid).
# Example:
#   input : 1234 / 2 / 40 42 51 / 41 39 47
#   output: 43.33
#           ((0, 2),)
#           (40.5, 40.5, 49.0)
# =====================================================================

sid = int(input())  # line 1: student ID
r = int(input())  # line 2: number of rows

grid = tuple(tuple(float(x) for x in input().split()) for _ in range(r))  # read r rows into a tuple of tuples

d = sid % 4 + 2  # personal threshold margin
cells = sum(len(row) for row in grid)  # total number of cells in the panel
average = sum(sum(row) for row in grid) / cells  # panel average temperature

hotspots = tuple((i, j)  # build a tuple of coordinates ...
                 for i, row in enumerate(grid)  # ... walking rows top to bottom
                 for j, temp in enumerate(row)  # ... and columns left to right
                 if temp > average + d)  # ... keeping only cells hotter than average + d

col_avg = tuple(round(sum(col) / len(col), 1) for col in zip(*grid))  # zip(*grid) turns rows into columns

print(f"{average:.2f}")  # output line 1: panel average
print(hotspots)  # output line 2: hotspot coordinates
print(col_avg)  # output line 3: column averages
