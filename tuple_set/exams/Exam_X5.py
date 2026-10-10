# =====================================================================
# Developer : Matthew C.
# File      : Exam_X5.py
# Exam      : X5 - Bean Plant Growth Statistics (Biology)
#             Tuple: *args / multiple return values / namedtuple (Intermediate)
# ---------------------------------------------------------------------
# Question (TH):
#   เขียนฟังก์ชัน summary(*heights) คืนค่า tuple 4 ค่า: (ค่าเฉลี่ย, มัธยฐาน, พิสัย, จำนวน)
#   มัธยฐาน: ถ้าจำนวนคี่ใช้ค่ากลาง ถ้าคู่ใช้ค่าเฉลี่ยของ 2 ค่ากลาง
#   ทศนิยมของผลลัพธ์ใช้ d = SID % 3 + 1 ตำแหน่ง (ใช้ round)
#   ข้อมูลเข้า: บรรทัด 1 : SID / บรรทัด 2 : g (จำนวนกลุ่มแสง)
#     g บรรทัด : สีแสง ตามด้วยความสูง (cm) หลายค่า เช่น red 12.1 13.4 11.8
#   ผลลัพธ์:
#     g บรรทัดเรียงตามค่าเฉลี่ยมากไปน้อย รูปแบบ: สี (ค่าเฉลี่ย, มัธยฐาน, พิสัย, จำนวน)
#     บรรทัดสุดท้าย: สีที่มีพิสัยน้อยที่สุด (ผลการทดลองสม่ำเสมอที่สุด) ถ้าเสมอเลือกสีที่มาก่อนตามตัวอักษร
#   เงื่อนไขบังคับ: ต้องเรียก summary(*values) โดยกระจาย list/tuple ด้วย *
# Question (EN):
#   Write summary(*heights) returning (mean, median, range, count), rounded to
#   d = SID % 3 + 1 decimals. For each light colour print
#   "colour (mean, median, range, count)" sorted by mean descending, then the
#   colour with the smallest range (alphabetical on ties).
#   Rules : call summary(*values), spreading the values with *.
# Example (SID 1234 -> d = 2):
#   input : 1234 / 2 / red 12.1 13.4 11.8 / blue 14.0 15.2
#   output: blue (14.6, 14.6, 1.2, 2)
#           red (12.43, 12.1, 1.6, 3)
#           blue
# =====================================================================

sid = int(input())  # line 1: student ID
g = int(input())  # line 2: number of light groups
d = sid % 3 + 1  # number of decimal places computed from the SID


def summary(*heights):  # *heights packs every height passed in into a tuple
    n = len(heights)  # how many plants
    ordered = sorted(heights)  # sort the heights to find the median
    mean = sum(heights) / n  # arithmetic mean
    if n % 2 == 1:  # odd number of values
        median = ordered[n // 2]  # the middle value
    else:  # even number of values
        median = (ordered[n // 2 - 1] + ordered[n // 2]) / 2  # mean of the two middle values
    spread = ordered[-1] - ordered[0]  # range = max - min
    return round(mean, d), round(median, d), round(spread, d), n  # return 4 values as one tuple


results = ()  # tuple of (colour, stats) pairs
for _ in range(g):  # read each light group
    colour, *values = input().split()  # star unpacking: first word is the colour, the rest are heights
    values = tuple(float(v) for v in values)  # convert the heights to floats
    results += ((colour, summary(*values)),)  # spread the tuple into summary() with *

for colour, stats in sorted(results, key=lambda r: (-r[1][0], r[0])):  # mean descending, colour name on ties
    print(colour, stats)  # print "colour (mean, median, range, count)"

steadiest = min(results, key=lambda r: (r[1][2], r[0]))  # smallest range first, then alphabetical colour
print(steadiest[0])  # last line: colour with the smallest range
