# =====================================================================
# Developer : Matthew C.
# File      : Lab_T1.py
# Lesson    : T1 - Introduction to Tuple and Creating a Tuple (Create)
# ---------------------------------------------------------------------
# Question (TH):
#   สร้าง tuple ชื่อ constants เก็บค่า (ความเร่งโน้มถ่วง 9.81, ความเร็วแสง 3e8,
#   ค่าคงที่แก๊ส 8.314) แล้วสร้าง tuple ชื่อ unit ที่มีสมาชิกเดียวคือ 'SI'
#   พิมพ์ทั้งสองตัวพร้อม type และ len
# Question (EN):
#   Create a tuple named constants holding (gravity 9.81, speed of light 3e8,
#   gas constant 8.314), then create a one-element tuple named unit that holds
#   'SI'. Print both together with their type and len.
# =====================================================================

constants = (9.81, 3e8, 8.314)  # create a tuple of 3 physical constants: g, c, R
unit = ('SI',)  # create a single-element tuple (the trailing comma makes it a tuple)

print(constants, type(constants), len(constants))  # print the constants tuple, its type and its length (3)
print(unit, type(unit), len(unit))  # print the unit tuple, its type and its length (1)
