# =====================================================================
# Developer : Matthew C.
# File      : Lab_T8.py
# Lesson    : T8 - Tuple as Dictionary Key and Set Member (Hashable)
# ---------------------------------------------------------------------
# Question (TH):
#   สร้าง dict board เก็บตำแหน่งชิ้นส่วนวงจร {(0,0):'R', (0,1):'C', (1,1):'L'}
#   จงเพิ่ม (2,0):'D' เปลี่ยน (0,1) เป็น 'C2' แล้วพิมพ์เฉพาะชิ้นส่วนที่อยู่แถว 0
# Question (EN):
#   Create a dict board storing circuit-part positions
#   {(0,0):'R', (0,1):'C', (1,1):'L'}. Add (2,0):'D', change (0,1) to 'C2',
#   then print only the parts located in row 0.
# =====================================================================

board = {(0, 0): 'R', (0, 1): 'C', (1, 1): 'L'}  # dict whose keys are (row, col) tuples

board[(2, 0)] = 'D'  # add a new part 'D' at row 2, column 0
board[(0, 1)] = 'C2'  # update the part at (0, 1) from 'C' to 'C2'
print("Board:", board)  # show the whole board after the changes

for (row, col), part in sorted(board.items()):  # loop over (key, value) pairs, unpacking the key tuple
    if row == 0:  # keep only parts that sit in row 0
        print((row, col), part)  # print the position and the part name
