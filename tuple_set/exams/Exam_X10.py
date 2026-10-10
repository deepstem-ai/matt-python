# =====================================================================
# Developer : Matthew C.
# File      : Exam_X10.py
# Exam      : X10 - Energy Flow in a Food Web (Ecology)
#             Tuple + Set: graph / dict of set / visited / all techniques
#             (Intermediate - Challenging)
# ---------------------------------------------------------------------
# Question (TH):
#   แต่ละบันทึก เหยื่อ>ผู้ล่า หมายถึงพลังงานไหลจากเหยื่อไปผู้ล่า (บันทึกซ้ำได้)
#   ผู้ผลิต = สิ่งมีชีวิตที่ไม่เป็นผู้ล่าของใครเลย
#   ผู้ล่าสูงสุด = สิ่งมีชีวิตที่ไม่ถูกใครล่าเลย
#   ผู้ผลิตเป้าหมาย P = รายชื่อผู้ผลิตเรียงตามตัวอักษร ณ ตำแหน่ง SID % จำนวนผู้ผลิต
#   ข้อมูลเข้า: บรรทัด 1 : SID / บรรทัด 2 : n / n บรรทัด : เหยื่อ>ผู้ล่า
#   ผลลัพธ์ 4 บรรทัด:
#     บรรทัด 1 : จำนวนความสัมพันธ์ที่ไม่ซ้ำ
#     บรรทัด 2 : tuple ผู้ผลิต (เรียงแล้ว)
#     บรรทัด 3 : tuple ผู้ล่าสูงสุด (เรียงแล้ว)
#     บรรทัด 4 : P ตามด้วย list (เรียงแล้ว) ของสิ่งมีชีวิตทั้งหมดที่พลังงานจาก P ไหลไปถึงได้ (ไม่รวม P)
#   เงื่อนไขบังคับ: เก็บความสัมพันธ์เป็น set ของ tuple, สร้าง dict ของ set (เหยื่อ -> ผู้ล่า)
#   และใช้ visited set ในการค้นหา
# Question (EN):
#   Each record prey>predator means energy flows from prey to predator
#   (records may repeat). Producers are never predators; top predators are
#   never prey. P = sorted producers at index SID % number of producers.
#   Output: number of unique relations; tuple of producers; tuple of top
#   predators; P followed by the sorted list of organisms reachable from P.
#   Rules : relations as a set of tuples; dict of sets (prey -> predators);
#           a visited set for the search.
# Example:
#   input : 1234 / 6 / grass>rabbit / rabbit>fox / grass>insect / insect>bird / algae>fish / rabbit>fox
#   output: 5
#           ('algae', 'grass')
#           ('bird', 'fish', 'fox')
#           algae ['fish']
# =====================================================================

sid = int(input())  # line 1: student ID
n = int(input())  # line 2: number of records

relations = set()  # set of (prey, predator) tuples; repeats collapse automatically
for _ in range(n):  # read each record
    prey, predator = (x.strip() for x in input().split('>'))  # split "prey>predator"
    relations.add((prey, predator))  # store the relation as a tuple

eats = {}  # dict of sets: prey -> set of predators (energy flow direction)
for prey, predator in relations:  # go through the unique relations
    eats.setdefault(prey, set()).add(predator)  # energy flows from prey to predator

preys = {prey for prey, _ in relations}  # every organism that is eaten
predators = {pred for _, pred in relations}  # every organism that eats
organisms = preys | predators  # every organism in the food web

producers = tuple(sorted(organisms - predators))  # never a predator -> producer
top_predators = tuple(sorted(organisms - preys))  # never eaten -> top predator

print(len(relations))  # output line 1: number of unique relations
print(producers)  # output line 2: producers
print(top_predators)  # output line 3: top predators

if producers:  # a food web with a cycle might have no producers at all
    P = producers[sid % len(producers)]  # target producer chosen by the SID
    visited = {P}  # organisms already reached
    stack = [P]  # depth-first search stack
    while stack:  # explore until nothing is left
        current = stack.pop()  # take an organism to expand
        for nxt in eats.get(current, set()):  # every predator that receives energy from it
            if nxt not in visited:  # not reached yet
                visited.add(nxt)  # mark it as reached
                stack.append(nxt)  # explore its predators later
    print(P, sorted(visited - {P}))  # output line 4: P and everything energy reaches (excluding P)
