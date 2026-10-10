# =====================================================================
# Developer : Matthew C.
# File      : Exercise_E7.py
# Exercise  : E7 - Detecting Duplicate Blood Sample Scans (Biomedical)
#             Set: order-preserving dedupe / find duplicates (Basic)
# ---------------------------------------------------------------------
# Question (TH):
#   เครื่องสแกนบาร์โค้ดอาจอ่านหลอดเดิมซ้ำ ให้ตัดรายการซ้ำโดยคงลำดับที่พบครั้งแรก
#   รหัสตรวจสอบ (check code) = (ผลรวมของตัวเลขทุกหลักในรหัสที่ไม่ซ้ำทั้งหมด + SID) % 97
#   ข้อมูลเข้า: บรรทัด 1 : SID / บรรทัด 2 : รหัสหลอดเลือด คั่นด้วยช่องว่าง เช่น B107 B102 B107
#   ผลลัพธ์ 3 บรรทัด:
#     บรรทัด 1 : รหัสไม่ซ้ำตามลำดับที่พบครั้งแรก คั่นด้วยช่องว่าง
#     บรรทัด 2 : รหัสที่ถูกสแกนซ้ำ (list ที่เรียงแล้ว)
#     บรรทัด 3 : check code
#   เงื่อนไขบังคับ: ใช้ set ชื่อ seen ในการตรวจว่าเคยพบแล้ว ห้ามใช้ dict.fromkeys
#   และห้ามใช้ x in list
# Question (EN):
#   Remove duplicate scans while keeping first-seen order.
#   check code = (sum of every digit in all unique codes + SID) % 97.
#   Output: unique codes in order (space separated), duplicated codes
#   (sorted list), check code.
#   Rules : use a set named seen; no dict.fromkeys and no "x in list".
# Example:
#   input : 1234 / B107 B102 B107 B115 B102
#   output: B107 B102 B115
#           ['B102', 'B107']
#           88
# =====================================================================

sid = int(input())  # line 1: student ID
scans = input().split()  # line 2: scanned codes in scan order

seen = set()  # codes already met (required name)
unique = []  # unique codes in first-seen order
duplicates = set()  # codes that were scanned more than once

for code in scans:  # walk through every scan in order
    if code in seen:  # set membership check (fast, and not "x in list")
        duplicates.add(code)  # this code has been scanned before
    else:  # first time we meet this code
        seen.add(code)  # remember it
        unique.append(code)  # keep it in first-seen order

digit_sum = sum(int(ch) for code in unique for ch in code if ch.isdigit())  # add every digit of every unique code
check_code = (digit_sum + sid) % 97  # apply the check-code formula

print(' '.join(unique))  # output line 1: unique codes separated by spaces
print(sorted(duplicates))  # output line 2: duplicated codes as a sorted list
print(check_code)  # output line 3: the check code
