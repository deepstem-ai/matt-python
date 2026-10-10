# =====================================================================
# Developer : Matthew C.
# File      : Lab_T10.py
# Lesson    : T10 - namedtuple: records with named fields
# ---------------------------------------------------------------------
# Question (TH):
#   สร้าง namedtuple ชื่อ Reading มีฟิลด์ sensor, value, unit สร้าง 3 ระเบียน
#   จากนั้นพิมพ์เฉพาะระเบียนที่ value > 50 และแก้หน่วยของระเบียนแรกเป็น 'kPa'
#   ด้วย _replace
# Question (EN):
#   Create a namedtuple called Reading with fields sensor, value, unit and
#   create 3 records. Then print only the records whose value > 50, and change
#   the unit of the first record to 'kPa' using _replace.
# =====================================================================

from collections import namedtuple  # import the namedtuple factory function

Reading = namedtuple('Reading', ['sensor', 'value', 'unit'])  # define a record type with 3 named fields

readings = (  # store the 3 records together in a tuple
    Reading('P1', 101.3, 'Pa'),  # record 1: pressure sensor
    Reading('T1', 25.4, 'C'),  # record 2: temperature sensor
    Reading('H1', 68.0, '%'),  # record 3: humidity sensor
)  # end of the tuple of records

for r in readings:  # loop over every record
    if r.value > 50:  # access the field by name instead of by index
        print(r)  # print records with value greater than 50

first = readings[0]._replace(unit='kPa')  # _replace returns a NEW record with unit changed (original is immutable)
readings = (first,) + readings[1:]  # rebuild the tuple with the updated first record
print("Updated first record:", readings[0])  # show the changed record
