# =====================================================================
# Developer : Matthew C.
# File      : Exercise_E8.py
# Exercise  : E8 - Classify Base Sequences and Find a Personal Motif
#             (Bioinformatics) Set: validation / subset / frozenset (Intermediate)
# ---------------------------------------------------------------------
# Question (TH):
#   DNA ใช้เบส A T G C ส่วน RNA ใช้เบส A U G C
#   โมทีฟประจำตัว (motif) สร้างจาก 3 หลักสุดท้ายของ SID แปลงแต่ละหลัก d เป็น 'ATGC'[d % 4]
#   เช่น SID 1234 -> หลัก 2,3,4 -> 'G','C','A' -> motif = 'GCA'
#   ข้อมูลเข้า: บรรทัด 1 : SID / บรรทัด 2 : n / n บรรทัด : ลำดับเบส 1 ลำดับ (ให้แปลงเป็นตัวพิมพ์ใหญ่ก่อน)
#   ผลลัพธ์:
#     บรรทัดแรก : motif
#     n บรรทัดถัดไป ตามลำดับข้อมูลเข้า : 'DNA' หรือ 'RNA' หรือ 'INVALID:'
#       ตามด้วยอักขระที่ผิดเรียงกันติดกัน เช่น INVALID:NX
#       (ลำดับที่มีแค่ A G C ให้จัดเป็น DNA)
#     บรรทัดสุดท้าย : จำนวนลำดับ DNA ที่มี motif อยู่ภายใน
#   เงื่อนไขบังคับ: กำหนดชุดเบสเป็น frozenset และตรวจด้วย subset (<=) เท่านั้น
# Question (EN):
#   DNA uses A T G C, RNA uses A U G C. The motif is built from the last 3
#   digits of the SID, each digit d mapped to 'ATGC'[d % 4].
#   Output: the motif; then for each sequence 'DNA', 'RNA' or
#   'INVALID:<bad chars sorted>' (A/G/C only counts as DNA); finally the
#   number of DNA sequences that contain the motif.
#   Rules : base sets are frozensets and are checked only with subset (<=).
# Example:
#   input : 1234 / 3 / atgcagca / AUGGCU / ATGNXA
#   output: GCA / DNA / RNA / INVALID:NX / 1
# =====================================================================

DNA_BASES = frozenset('ATGC')  # immutable set of DNA bases
RNA_BASES = frozenset('AUGC')  # immutable set of RNA bases

sid = int(input())  # line 1: student ID
n = int(input())  # line 2: number of sequences

motif = ''.join('ATGC'[int(d) % 4] for d in f"{sid:04d}"[-3:])  # map the last 3 SID digits to bases
print(motif)  # output the motif first

dna_with_motif = 0  # counter of DNA sequences containing the motif
for _ in range(n):  # handle each sequence in input order
    seq = input().strip().upper()  # read the sequence and convert it to uppercase
    letters = set(seq)  # the distinct characters used in the sequence
    if letters <= DNA_BASES:  # every character is a DNA base (A/G/C only also lands here)
        print('DNA')  # classify as DNA
        if motif in seq:  # does the DNA sequence contain the motif?
            dna_with_motif += 1  # count it
    elif letters <= RNA_BASES:  # every character is an RNA base
        print('RNA')  # classify as RNA
    else:  # some characters are not allowed
        bad = letters - (DNA_BASES | RNA_BASES)  # characters that are neither DNA nor RNA bases
        if not bad:  # only valid letters but T and U are mixed together
            bad = letters & {'T', 'U'}  # report the conflicting T/U letters
        print('INVALID:' + ''.join(sorted(bad)))  # print the bad characters sorted and joined

print(dna_with_motif)  # last line: number of DNA sequences containing the motif
