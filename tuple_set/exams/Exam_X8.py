# =====================================================================
# Developer : Matthew C.
# File      : Exam_X8.py
# Exam      : X8 - Unique Chemical Reactions (Chemistry)
#             Set: frozenset / canonical form / set of tuple (Intermediate)
# ---------------------------------------------------------------------
# Question (TH):
#   บันทึกปฏิกิริยาในรูป สารตั้งต้น+สารตั้งต้น>ผลิตภัณฑ์ เช่น H2+O2>H2O
#   ปฏิกิริยาจะซ้ำกันถ้าชุดสารตั้งต้นเหมือนกัน (ไม่สนลำดับ) และผลิตภัณฑ์เหมือนกัน
#   สารเป้าหมาย T = รายชื่อสารตั้งต้นทั้งหมดที่ไม่ซ้ำ เรียงตามตัวอักษร ณ ตำแหน่ง SID % จำนวนสารตั้งต้น
#   ข้อมูลเข้า: บรรทัด 1 : SID / บรรทัด 2 : n
#     n บรรทัด : บันทึกปฏิกิริยา (สารตั้งต้น 1 ตัวขึ้นไป คั่นด้วย + ผลิตภัณฑ์ 1 ตัว)
#   ผลลัพธ์ 3 บรรทัด:
#     บรรทัด 1 : จำนวนปฏิกิริยาที่ไม่ซ้ำ
#     บรรทัด 2 : T
#     บรรทัด 3 : ผลิตภัณฑ์ทั้งหมดของปฏิกิริยาที่มี T เป็นสารตั้งต้น (list เรียงแล้ว ไม่ซ้ำ)
#   เงื่อนไขบังคับ: แทนปฏิกิริยาด้วย tuple (frozenset ของสารตั้งต้น, ผลิตภัณฑ์) และเก็บใน set
# Question (EN):
#   Reactions look like A+B>P. Two reactions are the same if their reactant
#   sets match (any order) and the product matches. T = sorted unique
#   reactants at index SID % number of reactants.
#   Output: number of unique reactions; T; sorted unique products of the
#   reactions that use T as a reactant.
#   Rules : a reaction is a tuple (frozenset of reactants, product) stored in a set.
# Example:
#   input : 1234 / 4 / H2+O2>H2O / O2+H2>H2O / Na+Cl2>NaCl / C+O2>CO2
#   output: 3
#           O2
#           ['CO2', 'H2O']
# =====================================================================

sid = int(input())  # line 1: student ID
n = int(input())  # line 2: number of reaction records

reactions = set()  # set of (frozenset(reactants), product) tuples
for _ in range(n):  # read each record
    left, product = input().strip().split('>')  # split into the reactant side and the product
    reactants = frozenset(r.strip() for r in left.split('+'))  # canonical, order-free reactant set
    reactions.add((reactants, product.strip()))  # duplicates collapse because the tuple is hashable

all_reactants = sorted(set().union(*(r for r, p in reactions)))  # every unique reactant, alphabetical
T = all_reactants[sid % len(all_reactants)]  # target substance chosen by the SID

products = sorted({p for r, p in reactions if T in r})  # products of reactions that use T

print(len(reactions))  # output line 1: number of unique reactions
print(T)  # output line 2: target substance
print(products)  # output line 3: products made from T
