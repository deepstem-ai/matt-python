# =====================================================================
# Developer : Matthew C.
# File      : Exercise_E6.py
# Exercise  : E6 - Changes in Reef Fish Species (Ecology)
#             Set: union / intersection / difference / Jaccard (Basic)
# ---------------------------------------------------------------------
# Question (TH):
#   นับเฉพาะชื่อสปีชีส์ที่มีความยาวชื่อ >= L ตัวอักษร โดย L = SID % 3 + 3
#   (ชื่ออาจซ้ำในบรรทัดเดียวกัน และอาจมีตัวพิมพ์ใหญ่-เล็กปนกัน ให้ถือเป็นตัวพิมพ์เล็กทั้งหมด)
#   ข้อมูลเข้า: บรรทัด 1 : SID / บรรทัด 2 : ชื่อสปีชีส์ที่พบในปีแรก
#     บรรทัด 3 : ชื่อสปีชีส์ที่พบในปีที่สอง (คั่นด้วยช่องว่าง)
#   ผลลัพธ์ 4 บรรทัด:
#     บรรทัด 1 : รายชื่อที่พบใหม่ในปีที่สอง (list ที่เรียงแล้ว)
#     บรรทัด 2 : รายชื่อที่หายไป (list ที่เรียงแล้ว)
#     บรรทัด 3 : จำนวนสปีชีส์ที่พบทั้งสองปี
#     บรรทัด 4 : ดัชนี Jaccard ทศนิยม 3 ตำแหน่ง (ถ้า union ว่างให้แสดง 0.000)
#   เงื่อนไขบังคับ: ต้องใช้ set comprehension และตัวดำเนินการ - & | เท่านั้น ห้ามใช้ลูปซ้อน
# Question (EN):
#   Count only species names with length >= L, L = SID % 3 + 3 (treat names
#   as lowercase; duplicates may appear).
#   Output: new species in year 2 (sorted list), species that disappeared
#   (sorted list), number of species in both years, Jaccard index (3 dp,
#   0.000 if the union is empty).
#   Rules : use set comprehension and only the - & | operators; no nested loops.
# Example:
#   input : 1234 / Clown tang Goby clown wrasse / clown goby grouper ray
#   output: ['grouper']
#           ['tang', 'wrasse']
#           2
#           0.400
# =====================================================================

sid = int(input())  # line 1: student ID
L = sid % 3 + 3  # minimum name length computed from the SID

year1 = {name.lower() for name in input().split() if len(name) >= L}  # set comprehension for year 1 (lowercase, long enough)
year2 = {name.lower() for name in input().split() if len(name) >= L}  # set comprehension for year 2

new_species = year2 - year1  # found in year 2 but not in year 1
gone_species = year1 - year2  # found in year 1 but not in year 2
both = year1 & year2  # found in both years
union = year1 | year2  # found in at least one year

jaccard = len(both) / len(union) if union else 0.0  # Jaccard index, guarding against an empty union

print(sorted(new_species))  # output line 1: new species
print(sorted(gone_species))  # output line 2: disappeared species
print(len(both))  # output line 3: number of species in both years
print(f"{jaccard:.3f}")  # output line 4: Jaccard index with 3 decimals
