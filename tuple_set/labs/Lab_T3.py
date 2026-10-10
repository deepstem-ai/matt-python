# =====================================================================
# Developer : Matthew C.
# File      : Lab_T3.py
# Lesson    : T3 - CRUD with Tuple (Update / Delete by building a new tuple)
# ---------------------------------------------------------------------
# Question (TH):
#   กำหนด orbit = ('Mercury', 'Venus', 'Mars', 'Jupiter') จงแทรก 'Earth'
#   ระหว่าง Venus กับ Mars, แทน 'Jupiter' ด้วย 'Jupiter*' และลบ 'Mercury'
#   โดยใช้ slicing เท่านั้น
# Question (EN):
#   Given orbit = ('Mercury', 'Venus', 'Mars', 'Jupiter'), insert 'Earth'
#   between Venus and Mars, replace 'Jupiter' with 'Jupiter*' and delete
#   'Mercury' using slicing only.
# =====================================================================

orbit = ('Mercury', 'Venus', 'Mars', 'Jupiter')  # original tuple of planets
print("Original :", orbit)  # show the starting tuple

orbit = orbit[:2] + ('Earth',) + orbit[2:]  # Create: join the part before Mars + ('Earth',) + the rest
print("Insert   :", orbit)  # show the tuple after inserting Earth

orbit = orbit[:-1] + ('Jupiter*',)  # Update: keep everything except the last item, then add 'Jupiter*'
print("Update   :", orbit)  # show the tuple after replacing Jupiter

orbit = orbit[1:]  # Delete: slice from index 1 to drop 'Mercury' (index 0)
print("Delete   :", orbit)  # show the final tuple
