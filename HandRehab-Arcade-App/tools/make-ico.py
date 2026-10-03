# ============================================================
# make-ico.py — รวมไฟล์ PNG หลายขนาดเป็นไอคอน Windows (icons/app.ico) ไม่ต้องติดตั้งอะไรเพิ่ม (ใช้แค่ Python)
# Windows Vista ขึ้นไปอ่านไอคอนแบบ "PNG อยู่ใน ICO" ได้ทุกขนาด
# วิธีใช้:  python tools/make-ico.py icons/app.ico icons/icon-512.png [ไฟล์ PNG ขนาดอื่น ...]
#   ถ้ามี PIL (Pillow) จะย่อภาพเป็น 16/24/32/48/64/128/256 ให้เอง · ถ้าไม่มี จะใช้ PNG ตามที่ให้มา (ขนาดใหญ่กว่า 256 ถูกบันทึกเป็น "256")
# ============================================================
import io, struct, sys

def png_size(data):
    # ความกว้าง/สูงอยู่ในส่วน IHDR (ไบต์ 16-24) ของไฟล์ PNG
    if data[:8] != b'\x89PNG\r\n\x1a\n':
        raise ValueError('ไม่ใช่ไฟล์ PNG')
    return struct.unpack('>II', data[16:24])

def resized_with_pil(path):
    try:
        from PIL import Image
    except ImportError:
        return None
    img = Image.open(path).convert('RGBA')
    out = []
    for n in (16, 24, 32, 48, 64, 128, 256):
        buf = io.BytesIO(); img.resize((n, n), Image.LANCZOS).save(buf, 'PNG'); out.append(buf.getvalue())
    return out

def build_ico(pngs):
    pngs = sorted(pngs, key=lambda d: png_size(d)[0])
    head = struct.pack('<HHH', 0, 1, len(pngs))          # reserved, type 1 = icon, จำนวนภาพ
    offset = 6 + 16 * len(pngs)
    entries, body = b'', b''
    for d in pngs:
        w, h = png_size(d)
        bw, bh = (0 if w >= 256 else w), (0 if h >= 256 else h)   # 0 = 256 พิกเซล
        entries += struct.pack('<BBBBHHII', bw, bh, 0, 0, 1, 32, len(d), offset + len(body))
        body += d
    return head + entries + body

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print('usage: python tools/make-ico.py out.ico in1.png [in2.png ...]'); sys.exit(1)
    out, ins = sys.argv[1], sys.argv[2:]
    pngs = resized_with_pil(ins[0]) if len(ins) == 1 else None
    if pngs is None:
        pngs = [open(p, 'rb').read() for p in ins]
    with open(out, 'wb') as f:
        f.write(build_ico(pngs))
    print('saved', out, 'with', len(pngs), 'sizes')
