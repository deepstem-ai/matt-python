# ============================================================
# serve.py — เว็บเซิร์ฟเวอร์เล็ก ๆ ในเครื่อง (ใช้แทน python -m http.server) · HandRehab Arcade v2
# ทำไมต้องมี: Windows บางเครื่องตั้งชนิดไฟล์ .js เป็น text/plain ในรีจิสทรี และ Python รุ่นเก่าไม่รู้จัก .mjs
#   เบราว์เซอร์จะไม่ยอมรันโค้ด → แอปจอว่าง ไฟล์นี้บังคับชนิดไฟล์ให้ถูกต้องทุกเครื่อง
# ฟังเฉพาะ 127.0.0.1 (เครื่องอื่นในเครือข่ายเปิดไม่ได้) · โฟลเดอร์แอป = โฟลเดอร์แม่ของ tools (ไม่ใช้ที่อยู่ตายตัว)
# วิธีใช้: python tools/serve.py 8000   (start.bat / start.sh เรียกให้เอง) · ปิดหน้าต่าง หรือ Ctrl+C = ปิดเซิร์ฟเวอร์
# ============================================================
import http.server, os, socketserver, sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # โฟลเดอร์แอป (แม่ของ tools)

class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
        '.wasm': 'application/wasm', '.task': 'application/octet-stream', '.tflite': 'application/octet-stream',
        '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
        '.md': 'text/plain; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.csv': 'text/csv; charset=utf-8',
    }
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)
    def end_headers(self):
        # no-cache = เบราว์เซอร์ถามเซิร์ฟเวอร์ทุกครั้ง (ไฟล์ที่แก้ใหม่มีผลทันที; การใช้ออฟไลน์เป็นหน้าที่ของ sw.js)
        self.send_header('Cache-Control', 'no-cache')
        self.send_header('X-Content-Type-Options', 'nosniff')
        super().end_headers()
    def log_message(self, fmt, *args):  # ไม่พิมพ์ทุกคำขอให้รก หน้าต่างจะได้อ่านง่าย
        pass

class Server(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = False   # Windows: True จะยอมให้สองโปรแกรมใช้พอร์ตเดียวกัน → สับสน

if __name__ == '__main__':
    if os.name == 'nt':
        os.system(f'title HandRehab Server {PORT}')   # ชื่อหน้าต่าง (start.bat ใช้ปิดเซิร์ฟเวอร์ตอนจบ)
    try:
        with Server(('127.0.0.1', PORT), Handler) as s:
            print(f'HandRehab Arcade: http://localhost:{PORT}/index.html')
            print(f'โฟลเดอร์แอป / App folder: {ROOT}')
            print('ปิดหน้าต่างนี้ หรือกด Ctrl+C = ปิดเซิร์ฟเวอร์ / Close this window or press Ctrl+C to stop')
            s.serve_forever()
    except KeyboardInterrupt:
        print('ปิดเซิร์ฟเวอร์แล้ว / Server stopped')
    except OSError as e:
        print(f'[!] เปิดเซิร์ฟเวอร์ที่พอร์ต {PORT} ไม่ได้ / Cannot start server on port {PORT}: {e}')
        print('    พอร์ตอาจถูกโปรแกรมอื่นใช้อยู่ ปิดหน้าต่าง HandRehab Server อื่น ๆ แล้วลองใหม่')
        print('    The port may be in use. Close other "HandRehab Server" windows and try again.')
        try: input('กด Enter เพื่อปิด / Press Enter to close...')
        except EOFError: pass
        sys.exit(1)
