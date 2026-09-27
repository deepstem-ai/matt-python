#!/usr/bin/env bash
# ============================================================
# start.sh — เปิดแอปบน Mac / Linux (Lab 02)
# วิธีใช้: bash start.sh        (หน้าต่างแอปธรรมดา)
#         bash start.sh kiosk  (เต็มจอสำหรับสาธิต ออกด้วย Alt+F4 / Cmd+Q)
# ============================================================
cd "$(dirname "$0")"                          # ย้ายไปโฟลเดอร์ของแอป
MODE=""                                       # โหมดปกติ
[ "$1" = "kiosk" ] && MODE="--kiosk"          # ถ้าพิมพ์ kiosk ต่อท้าย จะเปิดเต็มจอ
echo -e "\033[36m"                            # เปลี่ยนตัวอักษรเป็นสีฟ้า
cat <<'LOGO'
   ##   ##   ###   ##  ## ####    ####  ##### ##  ##   ###   ####
   ##   ##  ## ##  ### ## ## ##   ## ## ##    ##  ##  ## ##  ## ##
   #######  #####  ## ### ##  ##  ####  ####  ######  #####  ####
   ##   ##  ## ##  ##  ## ## ##   ## ## ##    ##  ##  ## ##  ## ##
   ##   ##  ## ##  ##  ## ####    ## ## ##### ##  ##  ## ##  ####
                * A R C A D E *   ทีม NeonHands
LOGO
echo -e "\033[0m"                             # กลับเป็นสีปกติ
PY=$(command -v python3 || command -v python) # 1) หา Python
if [ -z "$PY" ]; then                         # ไม่พบ Python → แจ้งวิธีติดตั้งแล้วหยุด
  echo -e "\033[31m[!] เครื่องนี้ยังไม่มีโปรแกรม Python ที่แอปต้องใช้ แอปจึงยังเปิดไม่ได้\033[0m"
  echo "Mac: ดาวน์โหลดจาก https://www.python.org/downloads/ แล้วติดตั้งตามขั้นตอน"
  echo "Linux: เปิด Terminal แล้วพิมพ์ sudo apt install python3"
  read -r -p "กด Enter เพื่อปิด..." ; exit 1   # รอให้อ่านจบ หน้าต่างไม่หายเอง
fi
PORT=8000                                     # 2) พอร์ตเริ่มต้น
for i in 1 2 3 4 5; do                        # ลองหาพอร์ตว่างสูงสุด 5 ครั้ง
  if ! (echo >/dev/tcp/127.0.0.1/$PORT) 2>/dev/null; then break; fi   # ต่อไม่ติด = ว่าง
  echo "พอร์ต $PORT ไม่ว่าง กำลังลองพอร์ตถัดไป..."
  PORT=$((PORT+1))                            # ขยับไปพอร์ตถัดไป
  if [ $i -eq 5 ]; then                       # ครบ 5 ครั้งแล้ว
    echo -e "\033[31m[!] พอร์ต 8000-8004 ถูกใช้หมด ปิดหน้าต่างเซิร์ฟเวอร์เก่าแล้วลองใหม่\033[0m"
    read -r -p "กด Enter เพื่อปิด..." ; exit 1
  fi
done
"$PY" -m http.server $PORT --bind 127.0.0.1 >/dev/null 2>&1 &   # เปิดเซิร์ฟเวอร์เบื้องหลัง
SERVER=$!                                     # จำหมายเลขโปรเซสไว้ปิดทีหลัง
trap 'kill $SERVER 2>/dev/null' EXIT          # ปิดหน้าต่างนี้เมื่อไร เซิร์ฟเวอร์ก็ปิดตาม
sleep 2                                       # 3) รอเซิร์ฟเวอร์พร้อม 2 วินาที
URL="http://localhost:$PORT/index.html"       # ที่อยู่ของหน้าแอป
if [ "$(uname)" = "Darwin" ]; then            # Mac: เปิด Chrome แบบแอป ไม่มีแถบที่อยู่
  open -na "Google Chrome" --args $MODE --app="$URL" 2>/dev/null || open "$URL"
else                                          # Linux: ลอง chrome / chromium ตามลำดับ
  (google-chrome $MODE --app="$URL" || chromium $MODE --app="$URL" || chromium-browser $MODE --app="$URL" || xdg-open "$URL") >/dev/null 2>&1 &
fi
echo -e "\033[32m[OK] เปิดแอปแล้ว: $URL\033[0m"  # 4) บอกวิธีปิด
echo "ถ้าหน้าต่างแอปไม่ขึ้นใน 5 วินาที ให้เปิด Chrome แล้วพิมพ์ที่อยู่ด้านบนเอง"
echo "เมื่อใช้งานเสร็จ: ปิดหน้าต่างแอป แล้วกด Enter ในหน้าต่างนี้เพื่อปิดเซิร์ฟเวอร์"
read -r                                       # รอผู้ใช้กด Enter
