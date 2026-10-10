# =====================================================================
# Developer : Matthew C.
# File      : Exercise_E5.py
# Exercise  : E5 - Ranking Science Project Scores (STEM)
#             Tuple: namedtuple / multi-key sorting (Intermediate)
# ---------------------------------------------------------------------
# Question (TH):
#   คะแนนโครงงานมี 3 ด้าน: design, data, present
#   คะแนนถ่วงน้ำหนัก = design*w + data*2 + present โดย w = SID % 3 + 1
#   จัดอันดับจากคะแนนถ่วงน้ำหนักมากไปน้อย ถ้าเท่ากันให้รหัสทีม (team)
#   น้อยกว่าขึ้นก่อน (เรียงตามตัวอักษร)
#   ข้อมูลเข้า: บรรทัด 1 : SID / บรรทัด 2 : n / n บรรทัด : team design data present เช่น T01 8 7 9
#   ผลลัพธ์: แสดงทีม 3 อันดับแรก บรรทัดละทีม รูปแบบ อันดับ team คะแนน
#   (ถ้ามีไม่ถึง 3 ทีมให้แสดงเท่าที่มี)
#   เงื่อนไขบังคับ:
#     - ใช้ collections.namedtuple ชื่อ Team ฟิลด์ team, design, data, present
#     - การเรียงต้องใช้ sorted ร่วมกับ key ที่คืนค่าเป็น tuple
# Question (EN):
#   Weighted score = design*w + data*2 + present, w = SID % 3 + 1. Rank from
#   highest to lowest score; ties go to the alphabetically smaller team code.
#   Output the top 3 teams (or fewer) as "rank team score".
#   Rules : namedtuple Team(team, design, data, present); sorted() with a
#           key that returns a tuple.
# Example:
#   input : 1234 / 3 / T01 8 7 9 / T02 9 9 5 / T03 7 8 9
#   output: 1 T02 41
#           2 T01 39
#           3 T03 39
# =====================================================================

from collections import namedtuple  # import namedtuple for named records

Team = namedtuple('Team', ['team', 'design', 'data', 'present'])  # record type required by the rules

sid = int(input())  # line 1: student ID
n = int(input())  # line 2: number of teams
w = sid % 3 + 1  # personal weight for the design score

teams = ()  # tuple that will hold every Team record
for _ in range(n):  # read n team lines
    code, design, data, present = input().split()  # unpack the 4 fields of the line
    teams += (Team(code, int(design), int(data), int(present)),)  # add a Team record to the tuple


def weighted(t):  # compute the weighted score of one Team record
    return t.design * w + t.data * 2 + t.present  # formula given in the question


ranking = sorted(teams, key=lambda t: (-weighted(t), t.team))  # tuple key: higher score first, then team code A-Z

for rank, t in enumerate(ranking[:3], start=1):  # take at most the top 3 and number them from 1
    print(rank, t.team, weighted(t))  # print "rank team score"
