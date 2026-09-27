# ============================================================
# serve.py — เว็บเซิร์ฟเวอร์เล็ก ๆ ในเครื่อง (Lab 35) ใช้แทน python -m http.server
# ทำไมต้องมี: Windows บางเครื่องตั้งชนิดไฟล์ .js เป็น text/plain ในรีจิสทรี และ Python รุ่นเก่าไม่รู้จัก .mjs
#   เบราว์เซอร์จะไม่ยอมรันโค้ด → แอปจอว่าง ไฟล์นี้บังคับชนิดไฟล์ให้ถูกต้องทุกเครื่อง
# วิธีใช้: python tools/serve.py 8000   (start.bat / start.sh เรียกให้เอง)
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
        '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.md': 'text/plain; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
    }
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)
    def log_message(self, fmt, *args):  # ไม่พิมพ์ทุกคำขอให้รก หน้าต่างจะได้อ่านง่าย
        pass

class Server(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True

if __name__ == '__main__':
    with Server(('127.0.0.1', PORT), Handler) as s:
        print(f'HandRehab Arcade: http://localhost:{PORT}/index.html  (ปิดหน้าต่างนี้ = ปิดเซิร์ฟเวอร์)')
        s.serve_forever()
