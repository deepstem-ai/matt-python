# =====================================================================
# Developer : Matthew C.
# File      : Exam_X9.py
# Exam      : X9 - Pairing Weights to Calibrate a Scale (Metrology)
#             Set: two-sum / seen set / set of tuple (Intermediate)
# ---------------------------------------------------------------------
# Question (TH):
#   ต้องการหาคู่ตุ้มน้ำหนัก 2 ชิ้น (คนละชิ้นกัน) ที่มวลรวมเท่ากับเป้าหมายพอดี
#   เป้าหมาย M = 100 + SID % 50 (กรัม)
#   ข้อมูลเข้า: บรรทัด 1 : SID
#     บรรทัด 2 : มวลตุ้มน้ำหนัก (กรัม จำนวนเต็ม) คั่นด้วยช่องว่าง (มวลซ้ำได้ = มีหลายชิ้น)
#   ผลลัพธ์ 3 บรรทัด:
#     บรรทัด 1 : M
#     บรรทัด 2 : list ของคู่ (มวลน้อย, มวลมาก) ที่ไม่ซ้ำ เรียงจากน้อยไปมาก (ถ้าไม่มีให้แสดง [])
#     บรรทัด 3 : มวลที่ 'ไม่สามารถ' จับคู่กับชิ้นใดได้เลย (list เรียงแล้ว ไม่ซ้ำ)
#   เงื่อนไขบังคับ:
#     - ใช้ set ชื่อ seen ตรวจคู่ในการวนรอบเดียว (ห้ามใช้ลูปซ้อน)
#     - เก็บคู่เป็น tuple ใน set
# Question (EN):
#   Find pairs of two different weights whose total equals M = 100 + SID % 50.
#   Output: M; sorted list of unique (small, large) pairs ([] if none);
#   sorted unique masses that cannot pair with any other piece.
#   Rules : a set named seen in a single pass (no nested loops); pairs are
#           tuples stored in a set.
# Example (SID 1234 -> M = 134):
#   input : 1234 / 67 67 34 100 50 84 10
#   output: 134
#           [(34, 100), (50, 84), (67, 67)]
#           [10]
# =====================================================================

sid = int(input())  # line 1: student ID
weights = tuple(int(x) for x in input().split())  # line 2: masses of the weights

M = 100 + sid % 50  # target mass computed from the SID

seen = set()  # masses of the pieces already looked at
pairs = set()  # set of (small, large) tuples
for w in weights:  # single pass over the weights
    need = M - w  # the partner mass that would complete the target
    if need in seen:  # an earlier, different piece has that mass
        pairs.add((min(w, need), max(w, need)))  # store the pair in canonical (small, large) order
    seen.add(w)  # remember this piece for later ones

paired = {mass for pair in pairs for mass in pair}  # every mass that appears in some pair
unpaired = set(weights) - paired  # masses that never found a partner

print(M)  # output line 1: target mass
print(sorted(pairs))  # output line 2: sorted list of pairs
print(sorted(unpaired))  # output line 3: masses that cannot be paired
