# =====================================================================
# Developer : Matthew C.
# File      : Lab_S8.py
# Lesson    : S8 - Dedupe and Distinct Patterns
# ---------------------------------------------------------------------
# Question (TH):
#   กำหนด words = 'the cell is the basic unit of life and the cell
#   divides'.split() จงพิมพ์คำไม่ซ้ำตามลำดับที่พบครั้งแรก
#   และพิมพ์คำที่ปรากฏมากกว่า 1 ครั้ง (เรียงตามตัวอักษร)
# Question (EN):
#   Given words = 'the cell is the basic unit of life and the cell
#   divides'.split(), print the unique words in the order they first appear,
#   and print the words that appear more than once (alphabetically).
# =====================================================================

words = 'the cell is the basic unit of life and the cell divides'.split()  # split the sentence into a list of words

seen = set()  # words already met (fast membership check)
unique_in_order = []  # unique words kept in first-seen order
repeated = set()  # words that appeared again

for word in words:  # go through every word in order
    if word in seen:  # already met this word before?
        repeated.add(word)  # then it is a repeated word
    else:  # first time we meet this word
        seen.add(word)  # remember it
        unique_in_order.append(word)  # keep it in the order of first appearance

print("Unique (first-seen order):", unique_in_order)  # print the de-duplicated words
print("Appear more than once    :", sorted(repeated))  # print repeated words alphabetically
