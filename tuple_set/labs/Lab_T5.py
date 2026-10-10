# =====================================================================
# Developer : Matthew C.
# File      : Lab_T5.py
# Lesson    : T5 - Methods and Functions used with Tuple
# ---------------------------------------------------------------------
# Question (TH):
#   กำหนด codons = ('AUG','GCU','UAA','GCU','AUG','UGA','GCU')
#   จงพิมพ์จำนวน 'GCU' ตำแหน่งของ stop codon ตัวแรก (UAA, UAG, UGA)
#   และตรวจว่ามี 'UAG' หรือไม่
# Question (EN):
#   Given codons = ('AUG','GCU','UAA','GCU','AUG','UGA','GCU'), print how many
#   'GCU' there are, the index of the first stop codon (UAA, UAG, UGA) and
#   check whether 'UAG' is present.
# =====================================================================

codons = ('AUG', 'GCU', 'UAA', 'GCU', 'AUG', 'UGA', 'GCU')  # tuple of RNA codons
STOPS = ('UAA', 'UAG', 'UGA')  # tuple of the three stop codons

print("GCU count:", codons.count('GCU'))  # tuple.count() returns how many times 'GCU' appears

first_stop = -1  # default index -1 means "no stop codon found"
for i, codon in enumerate(codons):  # walk through the tuple with both index and value
    if codon in STOPS:  # check whether this codon is a stop codon
        first_stop = i  # remember its index
        break  # stop looping because we only need the first one
print("First stop codon index:", first_stop)  # print the index of the first stop codon

print("Has UAG:", 'UAG' in codons)  # membership test with "in" returns True / False
