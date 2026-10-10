# =====================================================================
# Developer : Matthew C.
# File      : Lab_S7.py
# Lesson    : S7 - Nested Set: frozenset, set of tuple and dict of set
# ---------------------------------------------------------------------
# Question (TH):
#   กำหนดคู่นักเรียนที่จับคู่ทำแล็บ pairs =
#   [('A','B'),('B','A'),('C','D'),('A','C'),('D','C')] จงนับคู่ที่ไม่ซ้ำ
#   (ไม่สนลำดับ) และสร้าง dict ว่าแต่ละคนเคยจับคู่กับใครบ้าง
# Question (EN):
#   Given lab partner pairs
#   [('A','B'),('B','A'),('C','D'),('A','C'),('D','C')], count the unique
#   pairs (order does not matter) and build a dict showing who each person
#   has partnered with.
# =====================================================================

pairs = [('A', 'B'), ('B', 'A'), ('C', 'D'), ('A', 'C'), ('D', 'C')]  # recorded pairs (may repeat in any order)

unique_pairs = {frozenset(p) for p in pairs}  # frozenset ignores order, so A-B and B-A become the same item
print("Unique pairs:", len(unique_pairs))  # print how many different pairs there are

partners = {}  # dict: person -> set of partners
for a, b in pairs:  # unpack each pair
    partners.setdefault(a, set()).add(b)  # record b as a partner of a
    partners.setdefault(b, set()).add(a)  # record a as a partner of b (the relation goes both ways)

for person in sorted(partners):  # print people in alphabetical order
    print(person, sorted(partners[person]))  # print each person's partners sorted
