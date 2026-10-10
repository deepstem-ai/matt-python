# =====================================================================
# Developer : Matthew C.
# File      : Lab_S9.py
# Lesson    : S9 - Set for Data Validation
# ---------------------------------------------------------------------
# Question (TH):
#   รหัสสถานีวัดอากาศที่ถูกต้องคือ VALID = {'BKK01','CNX02','HKT03','KKC04'}
#   ข้อมูลที่ส่งมา sent = ['BKK01','XXX99','HKT03','BKK01','ABC00']
#   จงหาว่ารหัสไหนไม่ถูกต้อง และสถานีไหนยังไม่ส่งข้อมูล
# Question (EN):
#   Valid weather-station codes: VALID = {'BKK01','CNX02','HKT03','KKC04'}.
#   Data received: sent = ['BKK01','XXX99','HKT03','BKK01','ABC00'].
#   Find which codes are invalid and which stations have not sent data yet.
# =====================================================================

VALID = {'BKK01', 'CNX02', 'HKT03', 'KKC04'}  # the allowed station codes
sent = ['BKK01', 'XXX99', 'HKT03', 'BKK01', 'ABC00']  # codes that were received (may repeat)

sent_set = set(sent)  # remove duplicates from the received codes

invalid = sent_set - VALID  # received codes that are not in the valid list
missing = VALID - sent_set  # valid stations that did not send anything

print("Invalid codes      :", sorted(invalid))  # print invalid codes sorted
print("Stations not sent  :", sorted(missing))  # print stations that are missing
