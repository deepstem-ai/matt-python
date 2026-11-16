#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
run.py — ตัวเปิดแอป HandRehab Arcade

ทำให้ทุกครั้งที่เปิด
  1. ตรวจไฟล์ภายนอกครบทั้ง 12 ไฟล์ตามที่ js/assets.js กำหนด
     ขาดอันไหนโหลดให้เลย ไม่ต้องไปรันสคริปต์แยก
  2. หาพอร์ตว่างเอง เริ่มที่ 8731 ซึ่งแทบไม่มีใครใช้
     จึงไม่ชนกับแอปอื่น และไม่เจอ service worker ของโปรเจกต์อื่นที่ค้างอยู่
  3. สั่งเบราว์เซอร์ไม่ให้เก็บแคช กดรีเฟรชแล้วได้ของใหม่เสมอ
  4. เปิดหน้าเมนูให้เลือกว่าจะทำอะไร

ไม่ต้องสั่งไฟล์นี้ตรง ๆ ให้ดับเบิลคลิก START.bat (Windows) หรือ START.command (Mac)
"""
import http.server
import os
import socket
import socketserver
import sys
import threading
import webbrowser

# คอนโซลวินโดวส์บางเครื่องแสดงภาษาไทยไม่ได้ ถ้าพิมพ์ไม่ออกให้แทนด้วยเครื่องหมายคำถาม
# จะได้ไม่ล้มทั้งโปรแกรมเพราะเรื่องตัวอักษร
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

_print = print


def print(*a, **kw):  # noqa: A001
    try:
        _print(*a, **kw)
    except UnicodeEncodeError:
        _print(*[str(x).encode("ascii", "replace").decode("ascii") for x in a], **kw)


HERE = os.path.dirname(os.path.abspath(__file__))
APP = os.path.dirname(HERE) if os.path.basename(HERE) == "tools" else HERE
sys.path.insert(0, HERE)

try:
    from assets import ASSETS, check_all, fix_missing, size_of
except ImportError:
    print("\n  [!] หาไฟล์ tools/assets.py ไม่เจอ ซึ่งต้องอยู่คู่กับไฟล์นี้\n")
    sys.exit(1)

START_PORT = 8731
TRIES = 20

GROUP_TH = {"lib": "ไลบรารี", "model": "โมเดล AI", "font": "ฟอนต์"}


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=APP, **kw)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, *a):
        pass


def free_port():
    for p in range(START_PORT, START_PORT + TRIES):
        with socket.socket() as s:
            try:
                s.bind(("127.0.0.1", p))
                return p
            except OSError:
                continue
    return None


def report(ok, bad):
    """ตารางสรุปสถานะไฟล์ แสดงทุกครั้งที่เปิด"""
    total = len(ASSETS)
    print(f"  ตรวจไฟล์ที่แอปต้องใช้  {len(ok)} / {total}")
    print()
    for g in ("lib", "model", "font"):
        o = [a for a in ok if a[3] == g]
        b = [a for a in bad if a[3] == g]
        mark = "ครบ" if not b else f"ขาด {len(b)}"
        print(f"    {GROUP_TH[g]:<12} {len(o)}/{len(o) + len(b)}   {mark}")
    print()


def main():
    if not os.path.exists(os.path.join(APP, "index.html")):
        print("\n  [!] หา index.html ไม่เจอ")
        print(f"      ตอนนี้กำลังมองที่: {APP}\n")
        try:
            input("  กด Enter เพื่อปิด ")
        except EOFError:
            pass
        return 1

    print()
    print("  " + "=" * 58)
    print("   HandRehab Arcade")
    print("  " + "=" * 58)
    print()

    ok, bad = check_all(APP)
    report(ok, bad)

    if bad:
        print("  กำลังโหลดไฟล์ที่ขาด " + str(len(bad)) + " ไฟล์")
        print("  ครั้งแรกใช้เน็ตประมาณ 20 MB  ครั้งต่อไปไม่ต้องโหลดอีก")
        print()
        bad = fix_missing(APP, bad, log=print)
        print()
        ok, bad = check_all(APP)
        report(ok, bad)

    port = free_port()
    if port is None:
        print(f"  [!] พอร์ต {START_PORT} ถึง {START_PORT + TRIES - 1} ไม่ว่างสักพอร์ต")
        print("      ปิดโปรแกรมอื่นที่เปิดเซิร์ฟเวอร์อยู่ แล้วลองใหม่\n")
        try:
            input("  กด Enter เพื่อปิด ")
        except EOFError:
            pass
        return 1

    url = f"http://localhost:{port}/menu.html"

    if bad:
        print("  [!] ยังขาด " + str(len(bad)) + " ไฟล์ และโหลดอัตโนมัติไม่สำเร็จ")
        for a in bad:
            print("      - " + a[0] + "   (" + GROUP_TH.get(a[3], a[3]) + ")")
        print()
        groups = {a[3] for a in bad}
        if groups <= {"font"}:
            print("      ขาดแค่ฟอนต์ ใช้งานได้ตามปกติทุกอย่าง")
            print("      แค่ตัวหนังสืออาจหน้าตาไม่เหมือนที่ออกแบบไว้")
        else:
            print("      หน้าที่ต้องจับมือจะยังทำงานไม่ได้")
            print("      ให้ต่อเน็ตมือถือแล้วปิดเปิดโปรแกรมนี้ใหม่")
            print("      ถ้าเน็ตโรงเรียนบล็อก มักจะบล็อกที่ storage.googleapis.com")
        print()
    else:
        print("  ไฟล์ครบทุกไฟล์ ใช้งานออฟไลน์ได้เต็มรูปแบบ")
        print()

    print("  " + "-" * 58)
    print(f"   เปิดที่   {url}")
    print("  " + "-" * 58)
    print()
    print("   ถ้าเบราว์เซอร์ไม่เด้งขึ้นมาเอง ให้คัดลอกที่อยู่ข้างบนไปวางเอง")
    print("   จะเจอหน้าเมนู เลือกได้เลยว่าจะเปิดอะไร")
    print()
    print("   ปิดโปรแกรม  กด Ctrl + C ในหน้าต่างนี้")
    print()

    socketserver.TCPServer.allow_reuse_address = True
    try:
        srv = socketserver.ThreadingTCPServer(("127.0.0.1", port), Handler)
    except OSError as e:
        print(f"  [!] เปิดเซิร์ฟเวอร์ไม่ได้: {e}\n")
        return 1

    threading.Timer(1.0, lambda: webbrowser.open(url)).start()
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\n  ปิดเซิร์ฟเวอร์แล้ว\n")
        srv.shutdown()
    return 0


if __name__ == "__main__":
    sys.exit(main())
