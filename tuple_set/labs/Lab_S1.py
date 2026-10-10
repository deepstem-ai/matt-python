# =====================================================================
# Developer : Matthew C.
# File      : Lab_S1.py
# Lesson    : S1 - Introduction to Set and Creating a Set (Create)
# ---------------------------------------------------------------------
# Question (TH):
#   กำหนด dna = 'ATGCGATACGCTTGA' จงหาชุดเบสที่ไม่ซ้ำ ตรวจว่ามีครบ 4 เบส
#   (A, T, G, C) หรือไม่ และหาจำนวนคู่เบสติดกัน (dinucleotide) ที่ไม่ซ้ำ
# Question (EN):
#   Given dna = 'ATGCGATACGCTTGA', find the set of unique bases, check whether
#   all 4 bases (A, T, G, C) are present, and count the unique adjacent base
#   pairs (dinucleotides).
# =====================================================================

dna = 'ATGCGATACGCTTGA'  # the DNA sequence as a string

bases = set(dna)  # set() splits the string into characters and removes duplicates
print("Unique bases:", sorted(bases))  # print the unique bases in alphabetical order

has_all = {'A', 'T', 'G', 'C'} <= bases  # subset test: are all 4 bases contained in bases?
print("Has all 4 bases:", has_all)  # print True / False

dinucleotides = {dna[i:i + 2] for i in range(len(dna) - 1)}  # set comprehension of every 2-letter window
print("Unique dinucleotides:", sorted(dinucleotides))  # show them sorted
print("Count:", len(dinucleotides))  # print how many unique dinucleotides there are
