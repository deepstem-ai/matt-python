# =====================================================================
# Developer : Matthew C.
# File      : Lab_T6.py
# Lesson    : T6 - Traversal in Tuple
# ---------------------------------------------------------------------
# Question (TH):
#   กำหนด heart = (72, 75, 80, 78, 90, 95, 88) (อัตราการเต้นหัวใจรายนาที)
#   จงใช้ zip(t, t[1:]) หาว่ามีกี่ครั้งที่ค่าเพิ่มขึ้นจากนาทีก่อนหน้า
#   และสร้าง tuple ของผลต่าง
# Question (EN):
#   Given heart = (72, 75, 80, 78, 90, 95, 88) (heart rate per minute), use
#   zip(t, t[1:]) to count how many times the value increased from the
#   previous minute, and build a tuple of the differences.
# =====================================================================

heart = (72, 75, 80, 78, 90, 95, 88)  # heart-rate readings, one per minute

pairs = tuple(zip(heart, heart[1:]))  # pair each minute with the next one: (72,75), (75,80), ...
increases = sum(1 for prev, curr in pairs if curr > prev)  # count the pairs where the value went up
diffs = tuple(curr - prev for prev, curr in pairs)  # build a tuple of (next - previous) differences

print("Pairs     :", pairs)  # show the consecutive pairs
print("Increases :", increases)  # show how many times the rate increased
print("Diffs     :", diffs)  # show the tuple of differences
