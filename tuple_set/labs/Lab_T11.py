# =====================================================================
# Developer : Matthew C.
# File      : Lab_T11.py
# Lesson    : T11 - Tuple with Functions (multiple return values and *args)
# ---------------------------------------------------------------------
# Question (TH):
#   เขียนฟังก์ชัน ohm(v, *resistors) คืน (ความต้านทานรวมแบบอนุกรม, กระแส)
#   แล้วเรียกด้วย v = 12 และตัวต้านทาน 100, 220, 330
# Question (EN):
#   Write a function ohm(v, *resistors) that returns
#   (total series resistance, current), then call it with v = 12 and
#   resistors 100, 220, 330.
# =====================================================================


def ohm(v, *resistors):  # v = voltage; *resistors packs any number of resistor values into a tuple
    total = sum(resistors)  # series resistance = sum of all resistors
    current = v / total  # Ohm's law: I = V / R
    return total, current  # returning two values actually returns one tuple (total, current)


r_total, i = ohm(12, 100, 220, 330)  # call the function and unpack the returned tuple
print("Total resistance:", r_total, "ohm")  # print the total series resistance
print("Current:", round(i, 4), "A")  # print the current rounded to 4 decimal places
print("Returned value:", ohm(12, 100, 220, 330))  # show that the raw return value is a tuple
