# =====================================================================
# Developer : Matthew C.
# File      : Exercise_E2.py
# Exercise  : E2 - Density and Floating (Physical Science)
#             Tuple: unpacking in for / nested tuple (Basic)
# ---------------------------------------------------------------------
# Question (TH):
#   ของเหลวที่แต่ละคนใช้มีความหนาแน่น rho = 1 + (SID % 3) / 10 (g/cm^3)
#   วัตถุที่มีความหนาแน่นน้อยกว่า rho จะลอย
#   ข้อมูลเข้า:
#     บรรทัด 1 : SID
#     บรรทัด 2 : n (จำนวนวัตถุ)
#     n บรรทัดถัดไป : ชื่อ,มวล(g),ปริมาตร(cm^3) เช่น cork,12,50
#   ผลลัพธ์ 2 บรรทัด:
#     บรรทัด 1 : tuple ชื่อวัตถุที่ลอย เรียงตามตัวอักษร
#     บรรทัด 2 : ชื่อวัตถุที่มีความหนาแน่นมากที่สุด และค่าความหนาแน่น
#                (ทศนิยม 2 ตำแหน่ง) คั่นด้วยช่องว่าง
#   เงื่อนไขบังคับ:
#     - เก็บวัตถุแต่ละชิ้นเป็น tuple (ชื่อ, มวล, ปริมาตร) และเก็บทั้งหมดเป็น tuple ซ้อน tuple
#     - ต้องใช้ tuple unpacking ใน for loop อย่างน้อย 1 ครั้ง (ห้ามใช้ item[0], item[1] ...)
# Question (EN):
#   The liquid density is rho = 1 + (SID % 3) / 10 g/cm^3. Objects with a
#   density lower than rho float.
#   Input : SID, n, then n lines "name,mass,volume".
#   Output: line 1 = tuple of floating object names (alphabetical),
#           line 2 = name of the densest object and its density (2 decimals).
#   Rules : each object is a tuple (name, mass, volume), all objects are a
#           nested tuple; use tuple unpacking in a for loop (no item[0]...).
# Example:
#   input : 1234 / 3 / cork,12,50 / iron,157,20 / oak,30,40
#   output: ('cork', 'oak')
#           iron 7.85
# =====================================================================

sid = int(input())  # line 1: student ID
n = int(input())  # line 2: number of objects

rho = 1 + (sid % 3) / 10  # personal liquid density computed from the SID

objects = ()  # empty tuple that will hold every object record
for _ in range(n):  # read n object lines
    name, mass, volume = input().split(',')  # split "name,mass,volume" and unpack into 3 variables
    objects += ((name.strip(), float(mass), float(volume)),)  # append one record by concatenating a 1-item tuple

floating = tuple(sorted(name for name, mass, volume in objects if mass / volume < rho))  # names whose density < rho, sorted

densest_name, densest_value = '', -1.0  # placeholders for the densest object found so far
for name, mass, volume in objects:  # tuple unpacking in the for loop (required by the rules)
    density = mass / volume  # density = mass / volume
    if density > densest_value:  # found a denser object?
        densest_name, densest_value = name, density  # remember its name and density

print(floating)  # output line 1: tuple of floating objects
print(densest_name, f"{densest_value:.2f}")  # output line 2: densest object and its density
