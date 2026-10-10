# =====================================================================
# Developer : Matthew C.
# File      : Lab_T12.py
# Lesson    : T12 - Real-world Use Cases and Patterns of Tuple
# ---------------------------------------------------------------------
# Question (TH):
#   จากข้อมูล quakes ในตัวอย่าง จงหาภูมิภาคที่มีขนาดเฉลี่ยสูงที่สุด
#   และสร้าง tuple ของวันที่ที่ความลึกน้อยกว่า 20 km
# Question (EN):
#   Using the quakes data from the example, find the region with the highest
#   average magnitude, and build a tuple of the dates whose depth is less
#   than 20 km.
# =====================================================================

quakes = (("2026-01-03", "North", 4.2, 10),  # earthquake records: (date, region, magnitude, depth km)
          ("2026-01-09", "West", 5.6, 35),
          ("2026-02-14", "North", 3.1, 8),
          ("2026-02-20", "South", 6.0, 50),
          ("2026-03-02", "West", 4.8, 22))

groups = {}  # empty dict that will map region -> list of magnitudes
for date, region, mag, depth in quakes:  # unpack each record into 4 variables
    groups.setdefault(region, []).append(mag)  # create the list on first sight, then add the magnitude

averages = {region: round(sum(m) / len(m), 2) for region, m in groups.items()}  # average magnitude for each region (2 decimals)
print("Average magnitude per region:", averages)  # show all regional averages

top_region = max(averages, key=averages.get)  # region whose average magnitude is the largest
print("Highest average region:", top_region, averages[top_region])  # print that region and its average

shallow = tuple(date for date, region, mag, depth in quakes if depth < 20)  # dates of quakes shallower than 20 km
print("Depth < 20 km dates:", shallow)  # print the tuple of dates
