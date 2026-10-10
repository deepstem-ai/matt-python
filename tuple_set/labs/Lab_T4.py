# =====================================================================
# Developer : Matthew C.
# File      : Lab_T4.py
# Lesson    : T4 - Packing, Unpacking and Star Unpacking
# ---------------------------------------------------------------------
# Question (TH):
#   กำหนด run = ('Lab-07', 3.2, 3.5, 3.1, 3.8, 'OK') จง unpack ให้ได้
#   code, ค่าที่วัดทั้งหมด (values) และ status แล้วหาค่าเฉลี่ยของ values
# Question (EN):
#   Given run = ('Lab-07', 3.2, 3.5, 3.1, 3.8, 'OK'), unpack it into code,
#   all measured values (values) and status, then find the average of values.
# =====================================================================

run = ('Lab-07', 3.2, 3.5, 3.1, 3.8, 'OK')  # packed tuple: code, measurements..., status

code, *values, status = run  # star unpacking: first -> code, last -> status, middle -> values (a list)
values = tuple(values)  # convert the collected middle values into a tuple

average = sum(values) / len(values)  # average = total of the values divided by how many there are

print("code   :", code)  # print the run code
print("values :", values)  # print the measured values
print("status :", status)  # print the status text
print("average:", round(average, 2))  # print the average rounded to 2 decimal places
