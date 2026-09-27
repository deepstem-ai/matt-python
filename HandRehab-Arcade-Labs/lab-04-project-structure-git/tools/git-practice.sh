#!/usr/bin/env bash
# ============================================================
# git-practice.sh — ฝึก git ทีละขั้น (Lab 04)  วิธีใช้: bash tools/git-practice.sh
# init → commit → ลบไฟล์ → กู้คืนด้วย git checkout -- ไฟล์ → tag lab-04
# ============================================================
step() { echo; echo -e "\033[36m== $1 ==\033[0m"; }        # พิมพ์หัวข้อขั้นตอนเป็นสีฟ้า
run()  { echo -e "\033[33m\$ $*\033[0m"; "$@"; }             # โชว์คำสั่ง (สีเหลือง) แล้วรันจริง
pause(){ read -r -p "กด Enter เพื่อไปขั้นต่อไป..." _; }      # รอให้นักเรียนอ่านก่อน
PROJECT="$(cd "$(dirname "$0")/.." && pwd)"                  # โฟลเดอร์โปรเจกต์ (แม่ของ tools/)
cd "$PROJECT" || exit 1
if ! command -v git >/dev/null; then                         # ยังไม่ได้ติดตั้ง git
  echo -e "\033[31m[!] ยังไม่มีโปรแกรม git — ดาวน์โหลดที่ https://git-scm.com แล้วรันไฟล์นี้ใหม่\033[0m"
  read -r -p "กด Enter เพื่อปิด..." _; exit 1
fi
PREFIX=$(git rev-parse --show-prefix 2>/dev/null); INREPO=$?  # อยู่ใน git อยู่แล้วหรือยัง
if [ $INREPO -eq 0 ] && [ -n "$PREFIX" ]; then               # อยู่ "ข้างใน" git ของโปรเจกต์อื่น
  PRACTICE="${TMPDIR:-/tmp}/handrehab-git-practice"          # → ฝึกในสำเนา จะได้ไม่ไปยุ่ง git ตัวนอก
  echo "โฟลเดอร์นี้อยู่ใน git ของโปรเจกต์อื่นแล้ว จะฝึกในสำเนาที่ $PRACTICE แทน (ของจริงไม่ถูกแตะ)"
  rm -rf "$PRACTICE"; mkdir -p "$PRACTICE"; cp -R "$PROJECT"/. "$PRACTICE"/; rm -rf "$PRACTICE/.git"
  cd "$PRACTICE" || exit 1; INREPO=1
fi

step "ขั้นที่ 1: git init — ให้โฟลเดอร์เริ่มจำประวัติ"
if [ $INREPO -eq 0 ]; then echo "มี git อยู่แล้ว ข้ามขั้นนี้"; else run git init; fi
git config user.name >/dev/null || git config user.name "ทีม NeonHands"          # ตั้งชื่อผู้บันทึก (เฉพาะโปรเจกต์นี้)
git config user.email >/dev/null || git config user.email "team@example.com"    # ตั้งอีเมลสมมติ (ทีมเปลี่ยนเองได้)
pause

step "ขั้นที่ 2: git add + git commit — กดเซฟเกมครั้งแรก"
run git add .
run git commit -m "Lab 04: โครงสร้างโปรเจกต์ครบ กล้องยังทำงานเหมือนเดิม" || echo "(ไม่มีอะไรใหม่ให้บันทึก ไม่เป็นไร)"
run git log --oneline -3
pause

step "ขั้นที่ 3: ลบไฟล์จริง ๆ (js/geometry.js)"
run rm js/geometry.js
run git status --short                                       # จะเห็นตัว D = ถูกลบ
echo "ไฟล์หายไปแล้ว! ลองเปิดโฟลเดอร์ js/ ดูได้"
pause

step "ขั้นที่ 4: git checkout -- ไฟล์ — ย้อนเวลากู้คืน"
run git checkout -- js/geometry.js
run head -3 js/geometry.js                                   # ไฟล์กลับมาพร้อมหัวคอมเมนต์เดิม
run git status --short
pause

step "ขั้นที่ 5: git tag lab-04 — ตั้งชื่อจุดเซฟสำคัญ"
git rev-parse -q --verify refs/tags/lab-04 >/dev/null && echo "มีป้าย lab-04 แล้ว" || run git tag lab-04
run git tag
echo; echo -e "\033[32m[OK] ฝึกครบแล้ว! จดลง evidence/: ลบ js/geometry.js แล้วกู้คืนด้วย git checkout สำเร็จ\033[0m"
echo "อยู่ที่: $(pwd)"
