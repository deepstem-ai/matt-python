# =====================================================================
# Developer : Matthew C.
# File      : Lab_S6.py
# Lesson    : S6 - Traversal in Set
# ---------------------------------------------------------------------
# Question (TH):
#   กำหนด readings = {12.5, 18.2, 25.0, 31.7, 9.9, 22.4} (อุณหภูมิ °C ไม่ซ้ำ)
#   จงพิมพ์ทุกค่าเรียงจากน้อยไปมากพร้อมแปลงเป็น °F
#   และสร้าง set ของค่าที่อยู่ระหว่าง 15-30 °C
# Question (EN):
#   Given readings = {12.5, 18.2, 25.0, 31.7, 9.9, 22.4} (unique °C values),
#   print every value from smallest to largest along with its °F conversion,
#   and build a set of the values between 15 and 30 °C.
# =====================================================================

readings = {12.5, 18.2, 25.0, 31.7, 9.9, 22.4}  # set of temperatures in Celsius

for c in sorted(readings):  # sorted() returns a list in ascending order so the loop is predictable
    f = c * 9 / 5 + 32  # convert Celsius to Fahrenheit
    print(f"{c:5.1f} C = {f:5.1f} F")  # print both values with 1 decimal place

comfortable = {c for c in readings if 15 <= c <= 30}  # set comprehension keeping values in 15-30 C
print("Between 15-30 C:", sorted(comfortable))  # print the filtered set in order
