# =====================================================================
# Developer : Matthew C.
# File      : Exercise_E10.py
# Exercise  : E10 - Oil Spill Area (Environmental Science)
#             Set: visited set / BFS on grid / set of tuple (Intermediate)
# ---------------------------------------------------------------------
# Question (TH):
#   ภาพถ่ายดาวเทียมแปลงเป็นกริด '#' = มีคราบน้ำมัน '.' = น้ำทะเล
#   คราบน้ำมันที่ติดกัน 4 ทิศ (บน ล่าง ซ้าย ขวา) ถือเป็นกลุ่มเดียวกัน
#   จุดเริ่ม: นับช่องตามลำดับการอ่าน (ซ้ายไปขวา บนลงล่าง) เริ่ม 0 ให้ k = SID % (จำนวนช่องทั้งหมด)
#   ถ้าช่องที่ k เป็น '.' ให้เลื่อนไปช่องถัดไปจนเจอ '#' (ถ้าถึงช่องสุดท้ายให้วนกลับไปช่อง 0)
#   ข้อมูลเข้า: บรรทัด 1 : SID / บรรทัด 2 : r / r บรรทัด : แถวของกริด (รับประกันว่ามี '#' อย่างน้อย 1 ช่อง)
#   ผลลัพธ์ 3 บรรทัด:
#     บรรทัด 1 : พิกัดจุดเริ่ม (แถว, คอลัมน์)
#     บรรทัด 2 : จำนวนช่องในกลุ่มคราบน้ำมันของจุดเริ่ม
#     บรรทัด 3 : จำนวนกลุ่มคราบน้ำมันทั้งหมดในภาพ
#   เงื่อนไขบังคับ: ใช้ set ของ tuple ชื่อ visited และใช้ tuple ของทิศทาง 4 ทิศ
# Question (EN):
#   Grid: '#' = oil, '.' = sea. Oil cells touching in 4 directions form one
#   slick. Start at cell k = SID % total cells (reading order); if it is '.'
#   move forward (wrapping to 0) until a '#' is found.
#   Output: start (row, col); size of the slick containing the start; total
#   number of slicks.
#   Rules : a set of tuples named visited and a tuple of the 4 directions.
# Example:
#   input : 1234 / 3 / ##.. / .#.# / ...#
#   output: (2, 3)
#           2
#           2
# =====================================================================

DIRECTIONS = ((-1, 0), (1, 0), (0, -1), (0, 1))  # tuple of the 4 moves: up, down, left, right

sid = int(input())  # line 1: student ID
r = int(input())  # line 2: number of rows
grid = tuple(input().strip() for _ in range(r))  # read the rows into a tuple of strings
cols = len(grid[0])  # number of columns
total = r * cols  # total number of cells

k = sid % total  # starting cell number in reading order
while grid[k // cols][k % cols] != '#':  # keep moving while the cell is sea
    k = (k + 1) % total  # go to the next cell, wrapping back to 0 after the last one
start = (k // cols, k % cols)  # convert the cell number into (row, col)


def flood(origin, visited):  # BFS from origin; marks cells in visited and returns the slick size
    visited.add(origin)  # mark the origin as visited
    queue = [origin]  # BFS queue
    size = 0  # number of cells in this slick
    while queue:  # process until the queue is empty
        row, col = queue.pop(0)  # take the next cell
        size += 1  # count it
        for dr, dc in DIRECTIONS:  # check the 4 neighbours
            nr, nc = row + dr, col + dc  # neighbour coordinate
            if 0 <= nr < r and 0 <= nc < cols and grid[nr][nc] == '#' and (nr, nc) not in visited:  # inside, oil, unvisited
                visited.add((nr, nc))  # mark it when it is queued
                queue.append((nr, nc))  # explore it later
    return size  # size of the connected slick


start_size = flood(start, set())  # size of the slick that contains the start cell

visited = set()  # set of (row, col) tuples already assigned to a slick
slicks = 0  # number of slicks found
for i in range(r):  # scan every row
    for j in range(cols):  # scan every column
        if grid[i][j] == '#' and (i, j) not in visited:  # an oil cell not yet part of a known slick
            flood((i, j), visited)  # mark the whole slick as visited
            slicks += 1  # count a new slick

print(start)  # output line 1: start coordinate
print(start_size)  # output line 2: size of the starting slick
print(slicks)  # output line 3: number of slicks
