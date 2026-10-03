#!/usr/bin/env bash
# ============================================================
# collect-evidence.sh — รวบรวมหลักฐานเข้าโฟลเดอร์ evidence/ (Lab 37) สำหรับ Mac / Linux
# วิธีใช้:  bash tools/collect-evidence.sh [รากโปรเจกต์] [โฟลเดอร์ดาวน์โหลด] [--force]
# ทำงานเหมือน collect-evidence.ps1 ทุกอย่าง: ค้นตามรูปแบบชื่อใน evidence/checklist.json
# คัดลอก (ไม่ย้าย ไม่ลบ) เข้าโครงสร้าง 5 กลุ่ม แล้วรายงานสิ่งที่ยังขาดลง evidence/MISSING.txt
# ใช้ Python 3 (มีอยู่แล้วเพราะ start.sh ต้องใช้) เพื่ออ่านไฟล์ JSON
# ============================================================
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="${1:-$(dirname "$HERE")}"                 # ค่าเริ่มต้น = โฟลเดอร์แม่ของ tools
DL="${2:-$HOME/Downloads}"                      # โฟลเดอร์ดาวน์โหลด
FORCE="no"; for a in "$@"; do [ "$a" = "--force" ] && FORCE="yes"; done
[ "$1" = "--force" ] && ROOT="$(dirname "$HERE")"
[ "$2" = "--force" ] && DL="$HOME/Downloads"
PY=$(command -v python3 || command -v python)
if [ -z "$PY" ]; then echo "[!] ต้องติดตั้ง Python 3 ก่อน"; exit 1; fi

"$PY" - "$ROOT" "$DL" "$FORCE" <<'PYCODE'
import json, os, sys, shutil, fnmatch, subprocess, datetime
root, dl, force = os.path.abspath(sys.argv[1]), sys.argv[2], sys.argv[3] == 'yes'
ev = os.path.join(root, 'evidence')
lst = os.path.join(ev, 'checklist.json')
if not os.path.exists(lst):
    print(f"\033[31m[!] ไม่พบ {lst} — วางโฟลเดอร์ evidence ไว้ที่รากโปรเจกต์ก่อน\033[0m"); sys.exit(1)
data = json.load(open(lst, encoding='utf-8'))
groups = {g['id']: g for g in data['groups']}
for g in data['groups']: os.makedirs(os.path.join(ev, g['dir']), exist_ok=True)   # 1) สร้าง 5 โฟลเดอร์

# 2) รวบรายชื่อไฟล์จากโปรเจกต์ + Downloads (ข้าม evidence, .git, node_modules)
files = []
for src in dict.fromkeys([root, dl]):
    if not os.path.isdir(src): continue
    print(f"\033[36mกำลังค้นใน: {src}\033[0m")
    for d, dirs, fs in os.walk(src):
        dirs[:] = [x for x in dirs if x not in ('.git', 'node_modules') and os.path.abspath(os.path.join(d, x)) != ev]
        files += [os.path.join(d, f) for f in fs if not f.upper().startswith('DEMO-')]  # ไฟล์ตัวอย่างห้ามนับเป็นหลักฐาน
match = lambda name, pats: any(fnmatch.fnmatch(name.lower(), p.lower()) for p in pats)
def find(pats):  # ใหม่สุดก่อน
    return sorted([f for f in files if match(os.path.basename(f), pats)], key=os.path.getmtime, reverse=True)

# 3) ไฟล์ที่สร้างเองได้
def generated(target):
    dest = os.path.join(ev, target)
    if os.path.exists(dest) and not force: return
    if target.endswith('repo-link.txt'):
        run = lambda *a: subprocess.run(['git', '-C', root, *a], capture_output=True, text=True).stdout.strip() if shutil.which('git') else ''
        url = run('remote', 'get-url', 'origin') or 'ใส่ลิงก์ GitHub ของทีมที่นี่ (ยังไม่พบ git remote)'
        commit = run('log', '-1', '--format=%h %ad %s', '--date=short')
        open(dest, 'w', encoding='utf-8').write(f"repository: {url}\nlast commit: {commit}\ncollected: {datetime.datetime.now():%Y-%m-%d %H:%M}\n")
    elif target.endswith('file-structure.txt'):
        lines = [os.path.basename(root) + '/']
        for d, dirs, fs in os.walk(root):
            dirs[:] = sorted(x for x in dirs if x not in ('.git', 'node_modules', 'evidence'))
            depth = os.path.relpath(d, root).count(os.sep) + (0 if d == root else 1)
            if depth > 2: dirs[:] = []; continue
            if d != root: lines.append('   ' * (depth - 1) + os.path.basename(d) + '/')
            lines += ['   ' * depth + f for f in sorted(fs)]
        open(dest, 'w', encoding='utf-8').write('\n'.join(lines) + '\n')

# 4) ไล่ทีละรายการ
report = []
for it in data['items']:
    g = groups[it['group']]
    if it.get('generated'): generated(it['target'])
    found = find(it['patterns']); status, detail = 'missing', ''
    if it.get('multi'):
        d = os.path.join(ev, g['dir'])
        for f in found:
            dst = os.path.join(d, os.path.basename(f))
            if force or not os.path.exists(dst): shutil.copy2(f, dst)
        have = len([x for x in os.listdir(d) if match(x, it['patterns'])])
        detail = f"{have}/{it.get('min', 1)} ไฟล์"
        if have >= it.get('min', 1): status = 'ok'
    else:
        dest = os.path.join(ev, it['target']); d = os.path.dirname(dest)
        base = os.path.splitext(os.path.basename(dest))[0]
        existing = [os.path.join(d, x) for x in os.listdir(d) if os.path.splitext(x)[0] == base] if it.get('keepExt') else ([dest] if os.path.exists(dest) else [])
        newer = force and found and existing and os.path.getmtime(found[0]) > os.path.getmtime(existing[0])
        if existing and not newer: status, detail = 'ok', 'มีอยู่แล้ว'
        elif found:
            if it.get('keepExt'): dest = os.path.join(d, base + os.path.splitext(found[0])[1])
            shutil.copy2(found[0], dest); status, detail = 'copied', f'คัดลอกจาก {found[0]}'
    report.append({**it, 'status': status, 'detail': detail})

# 5) รายงาน
print()
for gid, g in groups.items():
    rows = [r for r in report if r['group'] == gid]
    ok = len([r for r in rows if r['status'] != 'missing'])
    print(f"\033[{'32' if ok == len(rows) else '33'}mกลุ่ม {gid} {g['th']}: {ok}/{len(rows)}\033[0m")
    for r in rows:
        if r['status'] == 'copied': print(f"\033[36m   + {r['target']}  ({r['detail']})\033[0m")
missing = [r for r in report if r['status'] == 'missing']
print(f"\n\033[32mรวม: มีแล้ว {len(report) - len(missing)}/{len(report)} รายการ\033[0m")
mf = os.path.join(ev, 'MISSING.txt')
if missing:
    print(f"\033[31mยังขาด {len(missing)} รายการ:\033[0m")
    out = [f"รายการหลักฐานที่ยังขาด ({datetime.datetime.now():%Y-%m-%d %H:%M})", '']
    for m in missing:
        line = f"  - evidence/{m['target']}  ← {m['th']} (กลับไปทำ Lab {m['lab']:02d}) {m['detail']}"
        print(f"\033[31m{line}\033[0m"); out.append(line)
    open(mf, 'w', encoding='utf-8').write('\n'.join(out) + '\n')
    print("\033[33mบันทึกรายการที่ขาดไว้ที่ evidence/MISSING.txt แล้ว\033[0m")
else:
    if os.path.exists(mf): os.remove(mf)
    print("\033[32mครบทุกรายการแล้ว เยี่ยมมาก!\033[0m")
PYCODE
