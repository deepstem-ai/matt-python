#!/usr/bin/env bash
# ตัวเปิดแอปสำหรับ Mac และ Linux
cd "$(dirname "$0")" || exit 1

for c in python3 python py; do
  if command -v "$c" >/dev/null 2>&1; then
    exec "$c" tools/run.py
  fi
done

if command -v node >/dev/null 2>&1; then
  exec node tools/run.js
fi

echo
echo "  [!] เครื่องนี้ยังไม่มีทั้ง Python และ Node.js"
echo "      Mac  : ลงจาก https://www.python.org/downloads/"
echo "      Linux: sudo apt install python3"
echo
read -r -p "  กด Enter เพื่อปิด "
exit 1
