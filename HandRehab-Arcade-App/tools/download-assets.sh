#!/usr/bin/env bash
# ============================================================
# download-assets.sh — ดาวน์โหลดทุกไฟล์ที่แอปต้องใช้ มาเก็บในเครื่อง (Lab 35) สำหรับ Mac / Linux
# วิธีใช้ (ต้องต่ออินเทอร์เน็ต ทำครั้งเดียว):   bash tools/download-assets.sh
#   1) โมเดล AI 3 ไฟล์                  → models/
#   2) MediaPipe tasks-vision 0.10.14 ครบชุด (vision_bundle.mjs + wasm/*) → vendor/tasks-vision/
#   3) ฟอนต์ Noto Sans Thai + Orbitron (woff2) + fonts.css → fonts/
# ทุกไฟล์ตรวจขนาด ถ้าเล็กผิดปกติ (เช่น ได้หน้าเว็บบล็อกของโรงเรียนมาแทน) จะลองลิงก์สำรองให้เอง
# จบแล้วสรุปว่าสำเร็จกี่ไฟล์ (ต้องได้ 12/12)
# ============================================================
set -u
cd "$(dirname "$0")/.." || exit 1          # ไปที่โฟลเดอร์แอป

MP=0.10.14
JSD="https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@$MP"
UNPKG="https://unpkg.com/@mediapipe/tasks-vision@$MP"
NPM_MP="https://registry.npmjs.org/@mediapipe/tasks-vision/-/tasks-vision-$MP.tgz"
G="https://storage.googleapis.com/mediapipe-models"
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
FONTS_CSS="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@100..900&family=Orbitron:wght@400..900&display=swap"
NPM_NOTO="https://registry.npmjs.org/@fontsource-variable/noto-sans-thai/-/noto-sans-thai-5.3.0.tgz"
NPM_ORB="https://registry.npmjs.org/@fontsource-variable/orbitron/-/orbitron-5.3.0.tgz"

TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
OK=0; FAIL=0; FAILED=()
mkdir -p models vendor/tasks-vision/wasm fonts

command -v curl >/dev/null || { echo "✖ ไม่พบคำสั่ง curl — ติดตั้งก่อน (Mac มีมาให้แล้ว, Ubuntu: sudo apt install curl)"; exit 1; }

size_of() { wc -c < "$1" 2>/dev/null | tr -d ' '; }

# fetch <ไฟล์ปลายทาง> <ขนาดต่ำสุด (ไบต์)> <ลิงก์หลัก> [ลิงก์สำรอง...]
# ลองทีละลิงก์ แสดงแถบความคืบหน้า ตรวจขนาด ถ้าผ่านย้ายเข้าที่
fetch() {
  local dest="$1" min="$2"; shift 2
  local n=0
  if [ -f "$dest" ] && [ "$(size_of "$dest")" -ge "$min" ]; then
    echo "  ✔ มีอยู่แล้ว  $dest ($(size_of "$dest") ไบต์)"; return 0
  fi
  for url in "$@"; do
    n=$((n + 1))
    [ $n -gt 1 ] && echo "    ↪ ลองลิงก์สำรอง #$n"
    echo "  ⬇ $dest  ← $url"
    if curl -fL --retry 2 --connect-timeout 20 -A "$UA" -# -o "$TMP/dl" "$url"; then
      local s; s=$(size_of "$TMP/dl")
      if [ "$s" -ge "$min" ]; then mv "$TMP/dl" "$dest"; echo "  ✔ สำเร็จ ($s ไบต์)"; return 0; fi
      echo "  ⚠ ไฟล์เล็กผิดปกติ ($s ไบต์ < $min) — อาจโดนระบบกรองเว็บบล็อก"
    else
      echo "  ⚠ ดาวน์โหลดไม่สำเร็จ"
    fi
  done
  return 1
}

# จดผลของแต่ละไฟล์
mark() { if [ "$1" -eq 0 ]; then OK=$((OK + 1)); else FAIL=$((FAIL + 1)); FAILED+=("$2"); fi; }

# แตกไฟล์ออกจาก .tgz ของ npm (ลิงก์สำรองชั้นสุดท้าย) <tgz url> <ชื่อในแพ็กเกจ> <ปลายทาง> <ขนาดต่ำสุด>
from_tgz() {
  local url="$1" inner="$2" dest="$3" min="$4" key; key=$(basename "$url" .tgz)
  [ -f "$TMP/$key.tgz" ] || { echo "    ↪ ลองลิงก์สำรองจาก npm: $url"; curl -fL --retry 2 -# -o "$TMP/$key.tgz" "$url" || return 1; }
  mkdir -p "$TMP/$key" && tar -xzf "$TMP/$key.tgz" -C "$TMP/$key" "package/$inner" 2>/dev/null || return 1
  [ "$(size_of "$TMP/$key/package/$inner")" -ge "$min" ] || return 1
  cp "$TMP/$key/package/$inner" "$dest" && echo "  ✔ สำเร็จจาก npm ($(size_of "$dest") ไบต์)"
}

echo "=============================================="
echo " HandRehab Arcade — ดาวน์โหลดไฟล์สำหรับใช้งานออฟไลน์"
echo "=============================================="

echo; echo "[1/3] โมเดล AI → models/"
fetch models/hand_landmarker.task 5000000 "$G/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task" "$G/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task"; mark $? models/hand_landmarker.task
fetch models/face_landmarker.task 1000000 "$G/face_landmarker/face_landmarker/float16/1/face_landmarker.task" "$G/face_landmarker/face_landmarker/float16/latest/face_landmarker.task"; mark $? models/face_landmarker.task
fetch models/blaze_face_short_range.tflite 100000 "$G/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite" "$G/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite"; mark $? models/blaze_face_short_range.tflite

echo; echo "[2/3] ไลบรารี MediaPipe tasks-vision $MP → vendor/tasks-vision/"
for f in vision_bundle.mjs:100000 wasm/vision_wasm_internal.js:100000 wasm/vision_wasm_internal.wasm:5000000 wasm/vision_wasm_nosimd_internal.js:100000 wasm/vision_wasm_nosimd_internal.wasm:5000000; do
  name="${f%%:*}"; min="${f##*:}"; dest="vendor/tasks-vision/$name"
  fetch "$dest" "$min" "$JSD/$name" "$UNPKG/$name" || from_tgz "$NPM_MP" "$name" "$dest" "$min"
  mark $? "$dest"
done

echo; echo "[3/3] ฟอนต์ → fonts/"
# ขอ CSS จาก Google Fonts (ต้องบอกว่าเป็น Chrome จึงได้ไฟล์ woff2) แล้วดึงลิงก์ของแต่ละชุดตัวอักษร
curl -fsL -A "$UA" "$FONTS_CSS" -o "$TMP/fonts.css" 2>/dev/null || : > "$TMP/fonts.css"
# ผลลัพธ์แต่ละบรรทัด: ชื่อฟอนต์|ชุดตัวอักษร|ลิงก์
awk '/^\/\* /{sub(/^\/\* /,""); sub(/ \*\/$/,""); subset=$0}
     /font-family/{f=$0; sub(/.*font-family: *\x27/,"",f); sub(/\x27.*/,"",f); fam=f}
     /src: *url\(/{u=$0; sub(/.*url\(/,"",u); sub(/\).*/,"",u); print fam "|" subset "|" u}' "$TMP/fonts.css" > "$TMP/fontlist"
gurl() { grep "^$1|$2|" "$TMP/fontlist" | head -1 | cut -d'|' -f3; }
font() { # <ปลายทาง> <ชื่อฟอนต์> <ชุดตัวอักษร> <npm tgz> <ไฟล์ใน npm>
  local u; u=$(gurl "$2" "$3")
  if [ -n "$u" ]; then fetch "$1" 5000 "$u" && return 0; else echo "  ⚠ อ่านรายชื่อฟอนต์จาก Google Fonts ไม่ได้"; fi
  from_tgz "$4" "files/$5" "$1" 5000
}
font fonts/noto-sans-thai-thai.woff2 "Noto Sans Thai" thai "$NPM_NOTO" noto-sans-thai-thai-wght-normal.woff2; mark $? fonts/noto-sans-thai-thai.woff2
font fonts/noto-sans-thai-latin.woff2 "Noto Sans Thai" latin "$NPM_NOTO" noto-sans-thai-latin-wght-normal.woff2; mark $? fonts/noto-sans-thai-latin.woff2
font fonts/orbitron-latin.woff2 "Orbitron" latin "$NPM_ORB" orbitron-latin-wght-normal.woff2; mark $? fonts/orbitron-latin.woff2
if [ -s fonts/fonts.css ] && grep -q "noto-sans-thai-thai.woff2" fonts/fonts.css; then echo "  ✔ มีอยู่แล้ว  fonts/fonts.css"; mark 0 fonts/fonts.css
else
  cat > fonts/fonts.css <<'CSS'
/* fonts.css — ฟอนต์ในเครื่อง (สร้างโดย tools/download-assets.sh) */
@font-face { font-family: 'Noto Sans Thai'; font-style: normal; font-weight: 100 900; font-display: swap; src: url(noto-sans-thai-thai.woff2) format('woff2'); unicode-range: U+02D7, U+0303, U+0331, U+0E01-0E5B, U+200C-200D, U+25CC; }
@font-face { font-family: 'Noto Sans Thai'; font-style: normal; font-weight: 100 900; font-display: swap; src: url(noto-sans-thai-latin.woff2) format('woff2'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD; }
@font-face { font-family: 'Orbitron'; font-style: normal; font-weight: 400 900; font-display: swap; src: url(orbitron-latin.woff2) format('woff2'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD; }
CSS
  echo "  ✔ สร้าง fonts/fonts.css"; mark 0 fonts/fonts.css
fi

TOTAL=$((OK + FAIL))
echo; echo "=============================================="
echo " สรุป: สำเร็จ $OK / $TOTAL ไฟล์"
if [ "$FAIL" -gt 0 ]; then
  echo " ✖ ไม่สำเร็จ $FAIL ไฟล์:"; for f in "${FAILED[@]}"; do echo "    - $f"; done
  echo " ลองใหม่อีกครั้ง หรือใช้เน็ตมือถือ (Hotspot) เพราะเครือข่ายโรงเรียนอาจบล็อกบางเว็บ"
  exit 1
fi
echo " ✔ ครบทุกไฟล์ — เปิดแอปแล้วดูป้ายมุมซ้ายล่าง ต้องขึ้นว่า \"ไฟล์ในเครื่องครบ\""
echo "=============================================="
