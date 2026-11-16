#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
assets.py — ตรวจและเติมไฟล์ภายนอกที่แอปต้องใช้ ให้ครบทั้ง 12 ไฟล์

รายการไฟล์ที่นี่ต้องตรงกับ js/assets.js ของแอปเสมอ
ถ้าแก้ที่โน่น ต้องมาแก้ที่นี่ด้วย ไม่งั้นตัวเปิดจะบอกว่าครบทั้งที่แอปบอกว่าขาด

ใช้จาก run.py   from assets import check_all, fix_missing
"""
import io
import os
import tarfile
import urllib.request

MP = "0.10.14"
JSD = f"https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@{MP}"
UNPKG = f"https://unpkg.com/@mediapipe/tasks-vision@{MP}"
G = "https://storage.googleapis.com/mediapipe-models"
NPM_MP = f"https://registry.npmjs.org/@mediapipe/tasks-vision/-/tasks-vision-{MP}.tgz"
NPM_NOTO = "https://registry.npmjs.org/@fontsource-variable/noto-sans-thai/-/noto-sans-thai-5.3.0.tgz"
NPM_ORB = "https://registry.npmjs.org/@fontsource-variable/orbitron/-/orbitron-5.3.0.tgz"

UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120 Safari/537.36"}

# (ชื่อที่แอปเรียก, ที่เก็บในเครื่อง, ขนาดอย่างน้อย, กลุ่ม, วิธีหา)
#   วิธีหา  ("url", ลิงก์...)            = โหลดตรง
#           ("tgz", ลิงก์, ชื่อในแพ็ก)   = โหลดแพ็ก npm แล้วแตกไฟล์เดียว
#           ("make",)                     = สร้างเองในเครื่อง
ASSETS = [
    ("vision_bundle.mjs", "vendor/tasks-vision/vision_bundle.mjs", 100_000, "lib",
     ("url", f"{JSD}/vision_bundle.mjs", f"{UNPKG}/vision_bundle.mjs")),
    ("vision_wasm_internal.js", "vendor/tasks-vision/wasm/vision_wasm_internal.js", 100_000, "lib",
     ("url", f"{JSD}/wasm/vision_wasm_internal.js", f"{UNPKG}/wasm/vision_wasm_internal.js")),
    ("vision_wasm_internal.wasm", "vendor/tasks-vision/wasm/vision_wasm_internal.wasm", 5_000_000, "lib",
     ("url", f"{JSD}/wasm/vision_wasm_internal.wasm", f"{UNPKG}/wasm/vision_wasm_internal.wasm")),
    ("vision_wasm_nosimd_internal.js", "vendor/tasks-vision/wasm/vision_wasm_nosimd_internal.js", 100_000, "lib",
     ("url", f"{JSD}/wasm/vision_wasm_nosimd_internal.js", f"{UNPKG}/wasm/vision_wasm_nosimd_internal.js")),
    ("vision_wasm_nosimd_internal.wasm", "vendor/tasks-vision/wasm/vision_wasm_nosimd_internal.wasm", 5_000_000, "lib",
     ("url", f"{JSD}/wasm/vision_wasm_nosimd_internal.wasm", f"{UNPKG}/wasm/vision_wasm_nosimd_internal.wasm")),

    ("hand_landmarker.task", "models/hand_landmarker.task", 5_000_000, "model",
     ("url", f"{G}/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
      f"{G}/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task")),
    ("face_landmarker.task", "models/face_landmarker.task", 1_000_000, "model",
     ("url", f"{G}/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
      f"{G}/face_landmarker/face_landmarker/float16/latest/face_landmarker.task")),
    ("blaze_face_short_range.tflite", "models/blaze_face_short_range.tflite", 100_000, "model",
     ("url", f"{G}/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
      f"{G}/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite")),

    ("noto-sans-thai-thai.woff2", "fonts/noto-sans-thai-thai.woff2", 10_000, "font",
     ("tgz", NPM_NOTO, "noto-sans-thai-thai-wght-normal.woff2")),
    ("noto-sans-thai-latin.woff2", "fonts/noto-sans-thai-latin.woff2", 5_000, "font",
     ("tgz", NPM_NOTO, "noto-sans-thai-latin-wght-normal.woff2")),
    ("orbitron-latin.woff2", "fonts/orbitron-latin.woff2", 5_000, "font",
     ("tgz", NPM_ORB, "orbitron-latin-wght-normal.woff2")),
    ("fonts.css", "fonts/fonts.css", 100, "font", ("make",)),
]

FONTS_CSS = """/* fonts.css — ฟอนต์ในเครื่อง (สร้างโดยตัวเปิดแอป) */
@font-face { font-family: 'Noto Sans Thai'; font-style: normal; font-weight: 100 900; font-display: swap;
  src: url(noto-sans-thai-thai.woff2) format('woff2');
  unicode-range: U+02D7, U+0303, U+0331, U+0E01-0E5B, U+200C-200D, U+25CC; }
@font-face { font-family: 'Noto Sans Thai'; font-style: normal; font-weight: 100 900; font-display: swap;
  src: url(noto-sans-thai-latin.woff2) format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308,
    U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD; }
@font-face { font-family: 'Orbitron'; font-style: normal; font-weight: 400 900; font-display: swap;
  src: url(orbitron-latin.woff2) format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308,
    U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD; }
"""

_tgz_cache = {}


def size_of(path):
    try:
        return os.path.getsize(path)
    except OSError:
        return 0


def check_all(app):
    """คืน (ครบ, ขาด) เป็นรายการ (ชื่อ, ที่เก็บ, ขนาดที่ต้องการ, กลุ่ม, วิธีหา)"""
    ok, bad = [], []
    for a in ASSETS:
        (ok if size_of(os.path.join(app, a[1])) >= a[2] else bad).append(a)
    return ok, bad


def _get(url, timeout=180):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def _from_tgz(url, member_name):
    """โหลดแพ็ก npm ครั้งเดียวแล้วจำไว้ ใช้ได้หลายไฟล์จากแพ็กเดียวกัน"""
    if url not in _tgz_cache:
        _tgz_cache[url] = _get(url)
    with tarfile.open(fileobj=io.BytesIO(_tgz_cache[url]), mode="r:gz") as tf:
        for m in tf.getmembers():
            if m.isfile() and os.path.basename(m.name) == member_name:
                with tf.extractfile(m) as f:
                    return f.read()
    raise FileNotFoundError(member_name)


def fix_missing(app, missing, log=print):
    """พยายามเติมไฟล์ที่ขาด คืนรายการที่ยังเติมไม่ได้"""
    still = []
    for name, rel, minb, group, how in missing:
        dest = os.path.join(app, rel)
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        log(f"    {name} ... ", end="", flush=True)

        if how[0] == "make":
            # สร้างเองได้ แต่จะมีประโยชน์ก็ต่อเมื่อไฟล์ฟอนต์ครบแล้ว
            try:
                with open(dest, "w", encoding="utf-8") as f:
                    f.write(FONTS_CSS)
                log("สร้างแล้ว")
                continue
            except OSError as e:
                log("สร้างไม่ได้ (" + type(e).__name__ + ")")
                still.append((name, rel, minb, group, how))
                continue

        data, err = None, ""
        if how[0] == "url":
            for u in how[1:]:
                try:
                    d = _get(u)
                    if len(d) >= minb:
                        data = d
                        break
                    err = "ไฟล์เล็กผิดปกติ"
                except Exception as e:
                    err = type(e).__name__
        elif how[0] == "tgz":
            try:
                d = _from_tgz(how[1], how[2])
                if len(d) >= minb:
                    data = d
                else:
                    err = "ไฟล์เล็กผิดปกติ"
            except Exception as e:
                err = type(e).__name__

        if data is None:
            log("ไม่สำเร็จ (" + err + ")")
            still.append((name, rel, minb, group, how))
            continue

        tmp = dest + ".part"
        with open(tmp, "wb") as f:
            f.write(data)
        os.replace(tmp, dest)
        log("สำเร็จ  " + f"{len(data)/1_000_000:.1f} MB" if len(data) > 900_000
            else "สำเร็จ  " + f"{len(data)//1000} KB")
    return still
