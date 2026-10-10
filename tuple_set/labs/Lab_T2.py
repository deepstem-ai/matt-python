# =====================================================================
# Developer : Matthew C.
# File      : Lab_T2.py
# Lesson    : T2 - Reading Data (Read) with Index and Slicing
# ---------------------------------------------------------------------
# Question (TH):
#   กำหนด ph = (6.8, 7.0, 7.2, 7.5, 7.9, 8.1, 8.4, 8.0) จงพิมพ์ ค่าแรก
#   ค่าสุดท้าย ครึ่งแรกของข้อมูล (ใช้ len // 2) และค่าที่ตำแหน่งคี่ทั้งหมด
# Question (EN):
#   Given ph = (6.8, 7.0, 7.2, 7.5, 7.9, 8.1, 8.4, 8.0), print the first value,
#   the last value, the first half of the data (use len // 2) and all values
#   at odd index positions.
# =====================================================================

ph = (6.8, 7.0, 7.2, 7.5, 7.9, 8.1, 8.4, 8.0)  # tuple of pH readings

print("First value:", ph[0])  # index 0 reads the first element
print("Last value:", ph[-1])  # negative index -1 reads the last element
half = len(ph) // 2  # compute the half-length of the tuple with integer division
print("First half:", ph[:half])  # slice from the start up to (not including) index half
print("Odd positions:", ph[1::2])  # slice starting at index 1, stepping by 2 -> indexes 1, 3, 5, 7
