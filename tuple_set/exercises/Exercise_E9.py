# =====================================================================
# Developer : Matthew C.
# File      : Exercise_E9.py
# Exercise  : E9 - Lab Partner Network (Data Science)
#             Set: nested (frozenset, dict of set) (Intermediate)
# ---------------------------------------------------------------------
# Question (TH):
#   บันทึกการจับคู่อาจซ้ำ และ A-B กับ B-A ถือเป็นคู่เดียวกัน คู่ที่เป็นคนเดียวกัน (A-A) ให้ตัดทิ้ง
#   ข้อมูลเข้า: บรรทัด 1 : SID / บรรทัด 2 : m (จำนวนบันทึก) / m บรรทัด : ชื่อ1-ชื่อ2 เช่น Ann-Bo
#   ผลลัพธ์ 3 บรรทัด:
#     บรรทัด 1 : จำนวนคู่ที่ไม่ซ้ำ
#     บรรทัด 2 : ชื่อคนที่มีเพื่อนคู่ทำแล็บ (ไม่ซ้ำ) มากที่สุด
#                ถ้าเสมอให้เลือกชื่อที่มาก่อนตามตัวอักษร ตามด้วยจำนวน
#     บรรทัด 3 : ให้ p = รายชื่อทุกคนเรียงตามตัวอักษร ณ ตำแหน่ง SID % จำนวนคน
#                แสดง p ตามด้วยรายชื่อคนที่ 'ยังไม่เคย' จับคู่กับ p (list เรียงแล้ว ไม่รวม p เอง)
#   เงื่อนไขบังคับ: ใช้ set ของ frozenset นับคู่ และใช้ dict ของ set เก็บคู่ของแต่ละคน
# Question (EN):
#   Pair records may repeat; A-B equals B-A; self pairs (A-A) are dropped.
#   Output: number of unique pairs; the person with the most unique partners
#   (alphabetical tie-break) and the count; p = everyone sorted at index
#   SID % number of people, then the sorted list of people p has never
#   partnered with (excluding p).
#   Rules : count pairs with a set of frozensets; store partners in a dict of sets.
# Example:
#   input : 1234 / 5 / Ann-Bo / Bo-Ann / Cy-Di / Ann-Cy / Di-Di
#   output: 3
#           Ann 2
#           Cy ['Bo']
# =====================================================================

sid = int(input())  # line 1: student ID
m = int(input())  # line 2: number of records

pairs = set()  # set of frozensets, one per unique pair
partners = {}  # dict: person -> set of partners

for _ in range(m):  # read every record
    a, b = (name.strip() for name in input().split('-'))  # split "Name1-Name2" into two names
    partners.setdefault(a, set())  # make sure a is registered as a person
    partners.setdefault(b, set())  # make sure b is registered as a person
    if a == b:  # a self pair such as Di-Di
        continue  # drop it as the question says
    pairs.add(frozenset((a, b)))  # frozenset ignores order, so A-B and B-A collapse together
    partners[a].add(b)  # b is a partner of a
    partners[b].add(a)  # a is a partner of b

people = sorted(partners)  # everyone in alphabetical order

best = min(people, key=lambda p: (-len(partners[p]), p))  # most partners first, alphabetical on ties

p = people[sid % len(people)]  # the person picked by the SID
never = sorted(set(people) - partners[p] - {p})  # everyone minus p's partners minus p

print(len(pairs))  # output line 1: number of unique pairs
print(best, len(partners[best]))  # output line 2: best-connected person and count
print(p, never)  # output line 3: p and the people p has never partnered with
