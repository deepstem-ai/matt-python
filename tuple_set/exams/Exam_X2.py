# =====================================================================
# Developer : Matthew C.
# File      : Exam_X2.py
# Exam      : X2 - Solar Car Race Ranking (Engineering)
#             Tuple: multi-key sorting / unpacking (Basic)
# ---------------------------------------------------------------------
# Question (TH):
#   เวลารวม = เวลาวิ่ง (วินาที) + จำนวนครั้งที่ทำผิดกติกา * p โดย p = SID % 4 + 2
#   อันดับ: เวลารวมน้อยไปมาก ถ้าเท่ากัน ทีมที่ผิดกติกาน้อยกว่าชนะ ถ้ายังเท่ากันเรียงตามชื่อทีม
#   ข้อมูลเข้า: บรรทัด 1 : SID / บรรทัด 2 : n / n บรรทัด : ชื่อทีม,เวลาวิ่ง,จำนวนครั้งที่ผิด เช่น Sun,61.5,2
#   ผลลัพธ์: n บรรทัดตามอันดับ รูปแบบ อันดับ.ชื่อทีม เวลารวม(ทศนิยม 1 ตำแหน่ง) เช่น 1.Sun 71.5
#   เงื่อนไขบังคับ:
#     - เก็บแต่ละทีมเป็น tuple (เวลารวม, จำนวนครั้งที่ผิด, ชื่อทีม)
#     - เรียงด้วย sorted() โดยไม่ใช้ key (อาศัยการเปรียบเทียบ tuple เอง)
# Question (EN):
#   Total time = run time + fouls * p, p = SID % 4 + 2. Rank by total time
#   ascending, then fewer fouls, then team name.
#   Output: n lines "rank.team total" (total with 1 dp).
#   Rules : each team is a tuple (total, fouls, name); sort with sorted()
#           and NO key, relying on tuple comparison.
# Example:
#   input : 1234 / 3 / Sun,61.5,2 / Ray,65.0,0 / Volt,59.0,3
#   output: 1.Ray 65.0
#           2.Sun 69.5
#           3.Volt 71.0
# =====================================================================

sid = int(input())  # line 1: student ID
n = int(input())  # line 2: number of teams
p = sid % 4 + 2  # penalty seconds per foul

teams = ()  # tuple of (total, fouls, name) records
for _ in range(n):  # read every team line
    name, run_time, fouls = input().split(',')  # unpack "name,time,fouls"
    fouls = int(fouls)  # convert the foul count to an int
    total = round(float(run_time) + fouls * p, 6)  # total time; round(…, 6) removes floating-point noise for fair ties
    teams += ((total, fouls, name.strip()),)  # add the record in the order required for tuple comparison

for rank, (total, fouls, name) in enumerate(sorted(teams), start=1):  # sorted() compares tuples element by element
    print(f"{rank}.{name} {total:.1f}")  # print "rank.team total"
