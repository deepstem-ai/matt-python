#!/usr/bin/env bash
# ============================================================
# start.sh — เปิดแอปบน Mac / Linux (Lab 02)  วิธีใช้: bash start.sh
# ============================================================
cd "$(dirname "$0")"                          # ย้ายไปโฟลเดอร์ของแอป
PY=$(command -v python3 || command -v python) # หา Python
if [ -z "$PY" ]; then                         # ไม่พบ Python → แจ้งวิธีติดตั้งแล้วหยุด
  echo -e "\033[31m[!] ยังไม่ได้ติดตั้ง Python แอปจึงเปิดไม่ได้\033[0m"
  echo "Mac: ติดตั้งจาก https://www.python.org/downloads/  | Linux: sudo apt install python3"
  read -p "กด Enter เพื่อปิด..." ; exit 1
fi
PORT=8000                                     # พอร์ตเริ่มต้น
for i in 1 2 3 4 5; do                        # ลองหาพอร์ตว่างสูงสุด 5 ครั้ง
  if ! (echo >/dev/tcp/127.0.0.1/$PORT) 2>/dev/null; then break; fi
  PORT=$((PORT+1))
  if [ $i -eq 5 ]; then echo "[!] พอร์ต 8000-8004 ถูกใช้หมด"; exit 1; fi
done
"$PY" -m http.server $PORT --bind 127.0.0.1 >/dev/null 2>&1 &   # เปิดเซิร์ฟเวอร์เบื้องหลัง
SERVER=$!                                     # จำหมายเลขโปรเซสไว้ปิดทีหลัง
sleep 2                                       # รอเซิร์ฟเวอร์พร้อม
URL="http://localhost:$PORT/index.html"
if [ "$(uname)" = "Darwin" ]; then            # Mac: เปิด Chrome แบบแอป ไม่มีแถบที่อยู่
  open -na "Google Chrome" --args --app="$URL" 2>/dev/null || open "$URL"
else                                          # Linux: ลอง chrome / chromium ตามลำดับ
  (google-chrome --app="$URL" || chromium --app="$URL" || chromium-browser --app="$URL" || xdg-open "$URL") >/dev/null 2>&1 &
fi
echo -e "\033[32mเปิดแอปแล้ว: $URL\033[0m"
echo "เมื่อใช้งานเสร็จ ให้กด Enter ในหน้าต่างนี้เพื่อปิดเซิร์ฟเวอร์"
read -r
kill $SERVER                                  # ปิดเซิร์ฟเวอร์
