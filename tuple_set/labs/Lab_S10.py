# =====================================================================
# Developer : Matthew C.
# File      : Lab_S10.py
# Lesson    : S10 - Set for Graph and Grid Search (Visited Set)
# ---------------------------------------------------------------------
# Question (TH):
#   จากแผนที่ forest ในตัวอย่าง ถ้าไฟเริ่มที่ (0,3) จะไหม้ต้นไม้กี่ต้น
#   (ให้นำโค้ด BFS มาปรับเป็นฟังก์ชัน burn(start))
# Question (EN):
#   Using the forest map from the example, if the fire starts at (0,3), how
#   many trees will burn? (Turn the BFS code into a function burn(start).)
# =====================================================================

forest = ["#..##",  # map: '#' = tree, '.' = empty ground
          "###.#",
          ".#..#",
          ".####",
          "....."]

ROWS, COLS = len(forest), len(forest[0])  # grid height and width
DIRECTIONS = ((-1, 0), (1, 0), (0, -1), (0, 1))  # the 4 neighbour moves: up, down, left, right


def burn(start):  # return the set of tree cells burned when fire starts at start=(row, col)
    r0, c0 = start  # unpack the starting coordinate
    if forest[r0][c0] != "#":  # fire cannot start on empty ground
        return set()  # nothing burns
    visited = {start}  # cells already on fire (also prevents visiting twice)
    queue = [start]  # BFS queue of cells whose neighbours we still need to check
    while queue:  # keep going while there are cells to process
        r, c = queue.pop(0)  # take the oldest cell from the front of the queue
        for dr, dc in DIRECTIONS:  # look at the 4 neighbours
            nr, nc = r + dr, c + dc  # neighbour coordinate
            if (0 <= nr < ROWS and 0 <= nc < COLS  # neighbour is inside the map
                    and forest[nr][nc] == "#"  # neighbour is a tree
                    and (nr, nc) not in visited):  # and has not burned yet
                visited.add((nr, nc))  # mark it as burned when it is queued
                queue.append((nr, nc))  # schedule it so its neighbours are checked later
    return visited  # the set of all burned cells


burned = burn((0, 3))  # run the fire simulation from (0, 3)
trees = {(r, c) for r in range(ROWS) for c in range(COLS) if forest[r][c] == "#"}  # every tree cell
print("Trees in total :", len(trees))  # print total number of trees
print("Burned from (0,3):", len(burned))  # print how many trees burned
print("Survived       :", sorted(trees - burned))  # set difference gives trees that did not burn

for r in range(ROWS):  # draw the map row by row
    print("".join("X" if (r, c) in burned else forest[r][c] for c in range(COLS)))  # 'X' marks a burned tree
