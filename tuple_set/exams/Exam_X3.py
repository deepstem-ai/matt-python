# =====================================================================
# Developer : Matthew C.
# File      : Exam_X3.py
# Exam      : X3 - Trimmed Mean of Titration (Chemistry)
#             Tuple: star unpacking / function returning a tuple (Intermediate)
# ---------------------------------------------------------------------
# Question (TH):
#   แต่ละบรรทัดคือผลการไทเทรต 1 ชุด: รหัสชุด ตามด้วยปริมาตร (mL) หลายค่า
#   และปิดท้ายด้วยสถานะ OK หรือ BAD ใช้เฉพาะชุดที่สถานะ OK
#   ถ้าชุดนั้นมีจำนวนค่า >= t (t = SID % 3 + 3) ให้ตัดค่าน้อยสุด 1 ค่าและมากสุด 1 ค่าออกก่อนหาค่าเฉลี่ย
#   มิฉะนั้นใช้ค่าเฉลี่ยของทุกค่า
#   ข้อมูลเข้า: บรรทัด 1 : SID / บรรทัด 2 : n / n บรรทัด : รหัส v1 v2 ... สถานะ เช่น T1 24.1 24.3 24.2 25.9 OK
#   ผลลัพธ์:
#     สำหรับชุด OK แต่ละชุดตามลำดับข้อมูลเข้า : รหัส ค่าเฉลี่ย(ทศนิยม 2 ตำแหน่ง) จำนวนค่าที่ใช้คำนวณ
#     บรรทัดสุดท้าย : tuple ของรหัสชุดที่ถูกตัดทิ้งเพราะ BAD
#   เงื่อนไขบังคับ:
#     - ใช้ star unpacking (code, *vals, status = ...)
#     - เขียนฟังก์ชัน trimmed(vals, t) ที่คืนค่าเป็น tuple (ค่าเฉลี่ย, จำนวนค่าที่ใช้)
# Question (EN):
#   Each line: code, several volumes (mL), status OK/BAD. Use only OK runs.
#   If a run has >= t values (t = SID % 3 + 3) drop one min and one max
#   before averaging; otherwise average all values.
#   Output: for each OK run "code mean(2 dp) count"; last line the tuple of
#   BAD run codes.
#   Rules : star unpacking (code, *vals, status = ...); function
#           trimmed(vals, t) returning (mean, count).
# Example:
#   input : 1234 / 3 / T1 24.1 24.3 24.2 25.9 OK / T2 23.0 30.0 BAD / T3 24.0 24.4 OK
#   output: T1 24.25 2
#           T3 24.20 2
#           ('T2',)
# =====================================================================


def trimmed(vals, t):  # return (mean, number of values used)
    vals = tuple(sorted(vals))  # sort the values so min is first and max is last
    if len(vals) >= t:  # enough values to trim?
        vals = vals[1:-1]  # drop the smallest and the largest value
    return sum(vals) / len(vals), len(vals)  # a tuple (mean, count)


sid = int(input())  # line 1: student ID
n = int(input())  # line 2: number of titration runs
t = sid % 3 + 3  # trimming threshold computed from the SID

bad_runs = ()  # tuple of codes of BAD runs
for _ in range(n):  # read each run
    code, *vals, status = input().split()  # star unpacking: first = code, last = status, middle = volumes
    if status == 'BAD':  # this run must be discarded
        bad_runs += (code,)  # remember its code
        continue  # skip to the next run
    mean, count = trimmed(tuple(float(v) for v in vals), t)  # call the function and unpack its returned tuple
    print(code, f"{mean:.2f}", count)  # print "code mean count"

print(bad_runs)  # last line: tuple of BAD run codes
