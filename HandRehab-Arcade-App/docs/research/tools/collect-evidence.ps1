# ============================================================
# collect-evidence.ps1 — รวบรวมหลักฐานทั้งหมดเข้าโฟลเดอร์ evidence/ (Lab 37)
# วิธีใช้ (Windows): คลิกขวาไฟล์นี้ > Run with PowerShell
#   หรือเปิด PowerShell แล้วพิมพ์:
#   powershell -ExecutionPolicy Bypass -File tools\collect-evidence.ps1
#   ตัวเลือก: -ProjectRoot C:\handrehab-arcade  -Downloads D:\Downloads  -Force (เขียนทับด้วยไฟล์ใหม่กว่า)
# ทำอะไร: ค้นไฟล์ PNG/CSV/วิดีโอ/เอกสาร ในโปรเจกต์และโฟลเดอร์ Downloads ตามรูปแบบชื่อใน
#         evidence/checklist.json แล้วคัดลอกไปไว้ในโครงสร้าง 5 กลุ่ม จากนั้นรายงานว่ายังขาดอะไร
# ไม่ลบ ไม่ย้ายไฟล์ต้นฉบับ (คัดลอกเท่านั้น) และไม่ส่งอะไรขึ้นอินเทอร์เน็ต
# แอปรวม: สคริปต์นี้อยู่ที่ docs/research/tools/ → ค่าเริ่มต้นของรากโปรเจกต์ = docs/research
#   จึงเก็บหลักฐานไว้ที่ docs/research/evidence/ และค้นไฟล์ใน docs/research + โฟลเดอร์ Downloads (ไฟล์ CSV/PNG ที่ export จากแอปจะอยู่ที่ Downloads)
# ============================================================
param(
  [string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot),   # ค่าเริ่มต้น = โฟลเดอร์แม่ของ tools
  [string]$Downloads = (Join-Path $HOME 'Downloads'),          # โฟลเดอร์ดาวน์โหลดของเครื่องนี้
  [switch]$Force                                               # เขียนทับไฟล์เดิมถ้าเจอไฟล์ใหม่กว่า
)
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8       # ให้หน้าต่างแสดงภาษาไทยได้
$ErrorActionPreference = 'Continue'

$Evidence = Join-Path $ProjectRoot 'evidence'
$ListFile = Join-Path $Evidence 'checklist.json'
if (-not (Test-Path $ListFile)) {
  Write-Host "[!] ไม่พบ $ListFile — วางโฟลเดอร์ evidence ไว้ที่รากโปรเจกต์ก่อน" -ForegroundColor Red
  exit 1
}
$List = Get-Content $ListFile -Raw -Encoding UTF8 | ConvertFrom-Json   # อ่านรายการหลักฐาน

# 1) สร้างโฟลเดอร์ 5 กลุ่ม (ถ้ายังไม่มี)
foreach ($g in $List.groups) { New-Item -ItemType Directory -Force -Path (Join-Path $Evidence $g.dir) | Out-Null }

# 2) รวบรายชื่อไฟล์ทั้งหมดจากแหล่งที่ค้น (ข้าม evidence เอง, .git, node_modules)
$sources = @($ProjectRoot, $Downloads) | Where-Object { $_ -and (Test-Path $_) } | Select-Object -Unique
Write-Host "กำลังค้นใน: $($sources -join ' , ')" -ForegroundColor Cyan
$files = Get-ChildItem -Path $sources -Recurse -File -ErrorAction SilentlyContinue |
  Where-Object { -not $_.FullName.StartsWith($Evidence, [StringComparison]::OrdinalIgnoreCase) -and $_.FullName -notmatch '[\\/](\.git|node_modules)[\\/]' -and -not $_.Name.ToUpper().StartsWith('DEMO-') }  # ไฟล์ตัวอย่าง DEMO- ห้ามนับเป็นหลักฐาน

# ตัวช่วย: ไฟล์ไหนชื่อตรงกับรูปแบบ (-like ไม่สนตัวพิมพ์เล็ก/ใหญ่)
function Find-Matches($patterns, $pool) {
  $pool | Where-Object { $n = $_.Name; @($patterns | Where-Object { $n -like $_ }).Count -gt 0 } | Sort-Object LastWriteTime -Descending
}

# 3) ไฟล์ที่สร้างเองได้: ลิงก์ repository และแผนผังไฟล์
function New-Generated($target) {
  $dest = Join-Path $Evidence $target
  if ((Test-Path $dest) -and -not $Force) { return }
  if ($target -like '*repo-link.txt') {
    $url = ''; $commit = ''
    if (Get-Command git -ErrorAction SilentlyContinue) {
      $url = (git -C $ProjectRoot remote get-url origin 2>$null)
      $commit = (git -C $ProjectRoot log -1 --format='%h %ad %s' --date=short 2>$null)
    }
    if (-not $url) { $url = 'ใส่ลิงก์ GitHub ของทีมที่นี่ (ยังไม่พบ git remote)' }
    "repository: $url`r`nlast commit: $commit`r`ncollected: $(Get-Date -Format 'yyyy-MM-dd HH:mm')" | Set-Content -Encoding UTF8 $dest
  } elseif ($target -like '*file-structure.txt') {
    # แผนผังไฟล์ลึก 3 ชั้น (ไม่รวม evidence และ .git)
    $lines = Get-ChildItem -Path $ProjectRoot -Recurse -Depth 2 -ErrorAction SilentlyContinue |
      Where-Object { $_.FullName -notmatch '[\\/](\.git|node_modules|evidence)([\\/]|$)' } |
      ForEach-Object { $rel = $_.FullName.Substring($ProjectRoot.Length).TrimStart('\', '/'); $depth = ($rel -split '[\\/]').Count - 1; ('   ' * $depth) + $_.Name + $(if ($_.PSIsContainer) { '/' } else { '' }) }
    @("$(Split-Path -Leaf $ProjectRoot)/") + $lines | Set-Content -Encoding UTF8 $dest
  }
}

# 4) ไล่ทีละรายการ: มีแล้ว / คัดลอกมาใหม่ / ยังขาด
$report = @()
foreach ($it in $List.items) {
  $g = $List.groups | Where-Object { $_.id -eq $it.group }
  if ($it.generated) { New-Generated $it.target }
  $found = @(Find-Matches $it.patterns $files)
  $status = 'missing'; $detail = ''
  if ($it.multi) {
    # หลายไฟล์ (เช่น หนังสือยินยอม 5 ใบ) คัดลอกทุกไฟล์ที่ตรงรูปแบบ
    $dir = Join-Path $Evidence $g.dir
    foreach ($f in $found) { $d = Join-Path $dir $f.Name; if (-not (Test-Path $d) -or $Force) { Copy-Item $f.FullName $d -Force } }
    $have = @(Get-ChildItem $dir -File | Where-Object { $n = $_.Name; @($it.patterns | Where-Object { $n -like $_ }).Count -gt 0 }).Count
    $min = [int]$it.min
    $detail = "$have/$min ไฟล์"
    if ($have -ge $min) { $status = 'ok' }
  } else {
    $dest = Join-Path $Evidence $it.target
    $dir = Split-Path -Parent $dest
    $base = [IO.Path]::GetFileNameWithoutExtension($dest)
    if ($it.keepExt) { $existing = @(Get-ChildItem $dir -File -Filter "$base.*" -ErrorAction SilentlyContinue) } else { $existing = @(Get-Item $dest -ErrorAction SilentlyContinue) }
    if ($existing.Count -gt 0 -and -not ($Force -and $found.Count -gt 0 -and $found[0].LastWriteTime -gt $existing[0].LastWriteTime)) {
      $status = 'ok'; $detail = 'มีอยู่แล้ว'
    } elseif ($found.Count -gt 0) {
      if ($it.keepExt) { $dest = Join-Path $dir ($base + $found[0].Extension) }
      Copy-Item $found[0].FullName $dest -Force
      $status = 'copied'; $detail = "คัดลอกจาก $($found[0].FullName)"
    }
  }
  $report += [pscustomobject]@{ Group = $it.group; Target = $it.target; Lab = $it.lab; Th = $it.th; Status = $status; Detail = $detail }
}

# 5) รายงานผล
Write-Host ''
foreach ($g in $List.groups) {
  $rows = $report | Where-Object { $_.Group -eq $g.id }
  $ok = @($rows | Where-Object { $_.Status -ne 'missing' }).Count
  $color = if ($ok -eq $rows.Count) { 'Green' } else { 'Yellow' }
  Write-Host ("กลุ่ม {0} {1}: {2}/{3}" -f $g.id, $g.th, $ok, $rows.Count) -ForegroundColor $color
  foreach ($r in $rows | Where-Object { $_.Status -eq 'copied' }) { Write-Host "   + $($r.Target)  ($($r.Detail))" -ForegroundColor Cyan }
}
$missing = @($report | Where-Object { $_.Status -eq 'missing' })
$total = $report.Count
Write-Host ''
Write-Host ("รวม: มีแล้ว {0}/{1} รายการ" -f ($total - $missing.Count), $total) -ForegroundColor Green
if ($missing.Count -gt 0) {
  Write-Host "ยังขาด $($missing.Count) รายการ:" -ForegroundColor Red
  $out = @("รายการหลักฐานที่ยังขาด ($(Get-Date -Format 'yyyy-MM-dd HH:mm'))", '')
  foreach ($m in $missing) {
    $line = "  - evidence/$($m.Target)  ← $($m.Th) (กลับไปทำ Lab $('{0:D2}' -f [int]$m.Lab)) $($m.Detail)"
    Write-Host $line -ForegroundColor Red
    $out += $line
  }
  $out | Set-Content -Encoding UTF8 (Join-Path $Evidence 'MISSING.txt')
  Write-Host "บันทึกรายการที่ขาดไว้ที่ evidence\MISSING.txt แล้ว" -ForegroundColor Yellow
} else {
  Remove-Item (Join-Path $Evidence 'MISSING.txt') -ErrorAction SilentlyContinue
  Write-Host 'ครบทุกรายการแล้ว เยี่ยมมาก!' -ForegroundColor Green
}
