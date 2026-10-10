# =====================================================================
# Developer : Matthew C.
# File      : Exam_X4.py
# Exam      : X4 - PM2.5 Dust Map by Coordinates (Atmospheric Science)
#             Tuple as dict key / nested unpacking (Intermediate)
# ---------------------------------------------------------------------
# Question (TH):
#   สถานีวัดแต่ละจุดอยู่ที่พิกัดจำนวนเต็ม (x, y) และอาจส่งค่าหลายครั้ง
#   ข้อมูลเข้า: บรรทัด 1 : SID / บรรทัด 2 : n / n บรรทัด : x y ค่า เช่น 2 3 41
#   ผลลัพธ์ 3 บรรทัด:
#     บรรทัด 1 : พิกัดที่มีค่าเฉลี่ยสูงสุด และค่าเฉลี่ย (ทศนิยม 1 ตำแหน่ง) เช่น (2, 3) 45.5
#                (ถ้าเสมอให้เลือกพิกัดที่น้อยกว่าตามการเปรียบเทียบ tuple)
#     บรรทัด 2 : จำนวนสถานี (พิกัดไม่ซ้ำ) ที่ค่าเฉลี่ย > 37.5
#     บรรทัด 3 : ให้จุดศูนย์กลาง (cx, cy) = (SID % 5, SID // 10 % 5)
#                แสดงผลรวมของค่าเฉลี่ยจากสถานีที่ห่างจากศูนย์กลางแบบ Manhattan
#                (|x-cx|+|y-cy|) <= 2 ทศนิยม 1 ตำแหน่ง
#   เงื่อนไขบังคับ: ใช้ dict ที่ key เป็น tuple (x, y) และค่าเป็น tuple (ผลรวม, จำนวนครั้ง)
# Question (EN):
#   Stations sit at integer (x, y) and may report several times.
#   Output: coordinate with the highest average and the average (1 dp,
#   smaller tuple wins ties); number of stations with average > 37.5; sum of
#   averages of stations within Manhattan distance <= 2 of
#   (SID % 5, SID // 10 % 5) (1 dp).
#   Rules : dict with (x, y) tuple keys and (sum, count) tuple values.
# Example:
#   input : 1234 / 4 / 2 3 41 / 2 3 50 / 0 0 30 / 4 3 20
#   output: (2, 3) 45.5
#           1
#           65.5
# =====================================================================

sid = int(input())  # line 1: student ID
n = int(input())  # line 2: number of readings

stations = {}  # dict: (x, y) -> (sum, count)
for _ in range(n):  # read every reading
    x, y, value = input().split()  # unpack "x y value"
    key = (int(x), int(y))  # coordinate tuple used as the dict key
    total, count = stations.get(key, (0.0, 0))  # current (sum, count), or (0, 0) for a new station
    stations[key] = (total + float(value), count + 1)  # store a new tuple because tuples are immutable

averages = {key: total / count for key, (total, count) in stations.items()}  # nested unpacking of key and (sum, count)

best = min(averages, key=lambda k: (-averages[k], k))  # highest average first; on ties the smaller coordinate tuple
print(best, f"{averages[best]:.1f}")  # output line 1: best coordinate and its average

print(sum(1 for avg in averages.values() if avg > 37.5))  # output line 2: number of stations with average > 37.5

cx, cy = sid % 5, sid // 10 % 5  # centre point computed from the SID
near_sum = sum(avg for (x, y), avg in averages.items() if abs(x - cx) + abs(y - cy) <= 2)  # Manhattan distance filter
print(f"{near_sum:.1f}")  # output line 3: sum of nearby averages
