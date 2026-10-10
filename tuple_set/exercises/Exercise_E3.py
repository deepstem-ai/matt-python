# =====================================================================
# Developer : Matthew C.
# File      : Exercise_E3.py
# Exercise  : E3 - Edit the Experiment Steps without Converting to a List
#             (Chemistry) Tuple: CRUD with slicing (Basic)
# ---------------------------------------------------------------------
# Question (TH):
#   ขั้นตอนการทดลองเก็บเป็น tuple ของรหัสขั้นตอน เช่น ('WEIGH','DISSOLVE','HEAT','FILTER')
#   ให้นักเรียนทำ CRUD ตามลำดับต่อไปนี้ โดยใช้ slicing และการต่อ tuple เท่านั้น
#     1) Delete : ลบขั้นตอนที่ตำแหน่ง k = SID % (จำนวนขั้นตอน)
#     2) Create : แทรก 'SAFETY' ไว้หน้าสุด
#     3) Update : เปลี่ยนขั้นตอนสุดท้ายให้เป็น ชื่อเดิม + '_' + str(SID % 100)
#     4) Create : เพิ่ม 'CLEAN' ต่อท้าย
#   ข้อมูลเข้า: บรรทัด 1 : SID / บรรทัด 2 : รหัสขั้นตอน คั่นด้วยช่องว่าง (อย่างน้อย 2 ขั้นตอน)
#   ผลลัพธ์ 2 บรรทัด: บรรทัด 1 : ขั้นตอนที่ถูกลบ / บรรทัด 2 : tuple สุดท้ายหลังทำครบ 4 ข้อ
#   เงื่อนไขบังคับ: ห้ามใช้ list() ห้ามใช้เมธอดของ list ใด ๆ
# Question (EN):
#   Experiment steps are a tuple of step codes. Using only slicing and tuple
#   concatenation: 1) delete the step at k = SID % (number of steps);
#   2) insert 'SAFETY' at the front; 3) change the last step to
#   old name + '_' + str(SID % 100); 4) append 'CLEAN'.
#   Output: line 1 = the deleted step, line 2 = the final tuple.
#   Rules : no list() and no list methods.
# Example:
#   input : 1234 / WEIGH DISSOLVE HEAT FILTER
#   output: HEAT
#           ('SAFETY', 'WEIGH', 'DISSOLVE', 'FILTER_34', 'CLEAN')
# =====================================================================

sid = int(input())  # line 1: student ID
steps = tuple(input().split())  # line 2: step codes stored as a tuple

k = sid % len(steps)  # position to delete, computed from the SID
removed = steps[k]  # remember the step that will be deleted

steps = steps[:k] + steps[k + 1:]  # 1) Delete: join the part before k with the part after k
steps = ('SAFETY',) + steps  # 2) Create: put 'SAFETY' in front
steps = steps[:-1] + (steps[-1] + '_' + str(sid % 100),)  # 3) Update: rebuild the last step with the suffix
steps = steps + ('CLEAN',)  # 4) Create: add 'CLEAN' to the end

print(removed)  # output line 1: the deleted step
print(steps)  # output line 2: the final tuple
