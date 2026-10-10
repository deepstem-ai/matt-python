# =====================================================================
# Developer : Matthew C.
# File      : Lab_S2.py
# Lesson    : S2 - CRUD with Set (add, read, remove, update)
# ---------------------------------------------------------------------
# Question (TH):
#   ระบบลงทะเบียนเข้าแล็บ: เริ่มจาก checked_in = {'S01','S05'} จงเพิ่ม 'S07',
#   เพิ่ม ['S02','S05','S09'], ลบ 'S01' (ออกจากแล็บ), ลบ 'S99' แบบไม่ error
#   แล้วพิมพ์รายชื่อเรียงและจำนวนคน
# Question (EN):
#   Lab check-in system: start with checked_in = {'S01','S05'}. Add 'S07',
#   add ['S02','S05','S09'], remove 'S01' (left the lab), remove 'S99'
#   without raising an error, then print the sorted list and head count.
# =====================================================================

checked_in = {'S01', 'S05'}  # starting set of students in the lab

checked_in.add('S07')  # Create: add one student
checked_in.update(['S02', 'S05', 'S09'])  # Create: add many at once ('S05' already exists so it is ignored)
checked_in.remove('S01')  # Delete: remove a student who is in the set (would raise KeyError if missing)
checked_in.discard('S99')  # Delete safely: discard() does nothing if the item is not present

print("In lab:", sorted(checked_in))  # Read: print the students sorted
print("Count:", len(checked_in))  # print how many students are in the lab
