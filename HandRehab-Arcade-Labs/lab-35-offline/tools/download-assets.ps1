# ============================================================
# download-assets.ps1 — ดาวน์โหลดทุกไฟล์ที่แอปต้องใช้ มาเก็บในเครื่อง (Lab 35) สำหรับ Windows
# วิธีใช้ (ต้องต่ออินเทอร์เน็ต ทำครั้งเดียว):
#   ดับเบิลคลิก tools\download-assets.bat
#   หรือเปิด PowerShell ในโฟลเดอร์แอปแล้วพิมพ์:
#   powershell -ExecutionPolicy Bypass -File tools\download-assets.ps1
#
#   1) โมเดล AI 3 ไฟล์                  -> models\
#   2) MediaPipe tasks-vision 0.10.14 ครบชุด (vision_bundle.mjs + wasm\*) -> vendor\tasks-vision\
#   3) ฟอนต์ Noto Sans Thai + Orbitron (woff2) + fonts.css -> fonts\
# ทุกไฟล์ตรวจขนาด ถ้าเล็กผิดปกติ (เช่น ได้หน้าเว็บบล็อกของโรงเรียนมาแทน) จะลองลิงก์สำรองให้เอง
# จบแล้วสรุปว่าสำเร็จกี่ไฟล์ (ต้องได้ 12/12)
# หมายเหตุ: ไฟล์นี้บันทึกแบบ UTF-8 มี BOM เพื่อให้ Windows PowerShell 5.1 อ่านภาษาไทยได้ ห้ามบันทึกทับเป็น ANSI
# ============================================================
$ErrorActionPreference = 'Stop'
try { [Console]::OutputEncoding = [Text.Encoding]::UTF8 } catch { }
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12   # เว็บสมัยใหม่ต้องใช้ TLS 1.2

$AppDir = Split-Path -Parent $PSScriptRoot          # โฟลเดอร์แอป (แม่ของ tools)
Set-Location $AppDir
[Environment]::CurrentDirectory = $AppDir          # ให้คำสั่ง .NET ใช้โฟลเดอร์เดียวกัน

$MP     = '0.10.14'
$JSD    = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@$MP"
$UNPKG  = "https://unpkg.com/@mediapipe/tasks-vision@$MP"
$NPM_MP = "https://registry.npmjs.org/@mediapipe/tasks-vision/-/tasks-vision-$MP.tgz"
$G      = 'https://storage.googleapis.com/mediapipe-models'
$UA     = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'
$FONTS_CSS = 'https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@100..900&family=Orbitron:wght@400..900&display=swap'
$NPM_NOTO  = 'https://registry.npmjs.org/@fontsource-variable/noto-sans-thai/-/noto-sans-thai-5.3.0.tgz'
$NPM_ORB   = 'https://registry.npmjs.org/@fontsource-variable/orbitron/-/orbitron-5.3.0.tgz'

$Tmp = Join-Path ([IO.Path]::GetTempPath()) ('handrehab-' + [Guid]::NewGuid().ToString('N').Substring(0, 8))
New-Item -ItemType Directory -Force -Path $Tmp, 'models', 'vendor\tasks-vision\wasm', 'fonts' | Out-Null
$script:Ok = 0; $script:Fail = 0; $script:Failed = @()

# ---------- ดาวน์โหลดหนึ่งลิงก์ พร้อมแถบความคืบหน้า (Write-Progress) ----------
function Save-Url([string]$Url, [string]$Out) {
  $req = [Net.HttpWebRequest]::Create($Url)
  $req.UserAgent = $UA; $req.Timeout = 30000; $req.ReadWriteTimeout = 60000; $req.AllowAutoRedirect = $true
  $res = $req.GetResponse()
  try {
    $total = $res.ContentLength; $in = $res.GetResponseStream()
    $fs = [IO.File]::Create($Out)
    try {
      $buf = New-Object byte[] 262144; $got = 0; $tick = 0
      while (($n = $in.Read($buf, 0, $buf.Length)) -gt 0) {
        $fs.Write($buf, 0, $n); $got += $n; $tick++
        if ($total -gt 0 -and ($tick % 8 -eq 0)) {
          Write-Progress -Activity "กำลังดาวน์โหลด $(Split-Path -Leaf $Out)" -Status ("{0:N1} / {1:N1} MB" -f ($got / 1MB), ($total / 1MB)) -PercentComplete ([int](100 * $got / $total))
        }
      }
    } finally { $fs.Close(); $in.Close() }
  } finally { $res.Close(); Write-Progress -Activity 'ดาวน์โหลด' -Completed }
}

# ---------- ดาวน์โหลดพร้อมตรวจขนาด ลองลิงก์สำรองทีละลิงก์ ----------
function Get-Asset([string]$Dest, [long]$MinBytes, [string[]]$Urls) {
  if ((Test-Path $Dest) -and ((Get-Item $Dest).Length -ge $MinBytes)) {
    Write-Host "  ✔ มีอยู่แล้ว  $Dest ($((Get-Item $Dest).Length) ไบต์)" -ForegroundColor Green; return $true
  }
  $i = 0
  foreach ($u in $Urls) {
    $i++
    if ($i -gt 1) { Write-Host "    ↪ ลองลิงก์สำรอง #$i" -ForegroundColor Yellow }
    Write-Host "  ⬇ $Dest  <- $u"
    $tmpFile = Join-Path $Tmp 'dl.bin'
    try {
      Save-Url $u $tmpFile
      $size = (Get-Item $tmpFile).Length
      if ($size -ge $MinBytes) { Move-Item -Force $tmpFile $Dest; Write-Host "  ✔ สำเร็จ ($size ไบต์)" -ForegroundColor Green; return $true }
      Write-Host "  ⚠ ไฟล์เล็กผิดปกติ ($size ไบต์ < $MinBytes) — อาจโดนระบบกรองเว็บบล็อก" -ForegroundColor Yellow
    } catch { Write-Host "  ⚠ ดาวน์โหลดไม่สำเร็จ: $($_.Exception.Message)" -ForegroundColor Yellow }
  }
  return $false
}

# ---------- ลิงก์สำรองชั้นสุดท้าย: แตกไฟล์จากแพ็กเกจ .tgz ของ npm (ใช้ tar.exe ที่มีใน Windows 10 ขึ้นไป) ----------
function Get-FromTgz([string]$TgzUrl, [string]$Inner, [string]$Dest, [long]$MinBytes) {
  $key = [IO.Path]::GetFileNameWithoutExtension($TgzUrl)
  $tgz = Join-Path $Tmp "$key.tgz"; $dir = Join-Path $Tmp $key
  try {
    if (-not (Test-Path $tgz)) { Write-Host "    ↪ ลองลิงก์สำรองจาก npm: $TgzUrl" -ForegroundColor Yellow; Save-Url $TgzUrl $tgz }
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null; & tar.exe -xzf $tgz -C $dir; if ($LASTEXITCODE -ne 0) { throw 'แตกไฟล์ .tgz ไม่ได้ (ต้องมี tar.exe — Windows 10 รุ่น 1803 ขึ้นไป)' } }
    $src = Join-Path $dir ("package\" + ($Inner -replace '/', '\'))
    if ((Test-Path $src) -and ((Get-Item $src).Length -ge $MinBytes)) { Copy-Item -Force $src $Dest; Write-Host "  ✔ สำเร็จจาก npm ($((Get-Item $Dest).Length) ไบต์)" -ForegroundColor Green; return $true }
  } catch { Write-Host "  ⚠ $($_.Exception.Message)" -ForegroundColor Yellow }
  return $false
}

function Add-Result([bool]$Ok, [string]$Name) {
  if ($Ok) { $script:Ok++ } else { $script:Fail++; $script:Failed += $Name }
}

Write-Host '=============================================='
Write-Host ' HandRehab Arcade — ดาวน์โหลดไฟล์สำหรับใช้งานออฟไลน์' -ForegroundColor Cyan
Write-Host '=============================================='

Write-Host "`n[1/3] โมเดล AI -> models\" -ForegroundColor Cyan
$models = @(
  @('models\hand_landmarker.task', 5000000, 'hand_landmarker/hand_landmarker'),
  @('models\face_landmarker.task', 1000000, 'face_landmarker/face_landmarker'),
  @('models\blaze_face_short_range.tflite', 100000, 'face_detector/blaze_face_short_range')
)
foreach ($m in $models) {
  $file = Split-Path -Leaf $m[0]
  $ok = Get-Asset $m[0] $m[1] @("$G/$($m[2])/float16/1/$file", "$G/$($m[2])/float16/latest/$file")
  Add-Result $ok $m[0]
}

Write-Host "`n[2/3] ไลบรารี MediaPipe tasks-vision $MP -> vendor\tasks-vision\" -ForegroundColor Cyan
$libs = @(
  @('vision_bundle.mjs', 100000), @('wasm/vision_wasm_internal.js', 100000), @('wasm/vision_wasm_internal.wasm', 5000000),
  @('wasm/vision_wasm_nosimd_internal.js', 100000), @('wasm/vision_wasm_nosimd_internal.wasm', 5000000)
)
foreach ($l in $libs) {
  $dest = 'vendor\tasks-vision\' + ($l[0] -replace '/', '\')
  $ok = Get-Asset $dest $l[1] @("$JSD/$($l[0])", "$UNPKG/$($l[0])")
  if (-not $ok) { $ok = Get-FromTgz $NPM_MP $l[0] $dest $l[1] }
  Add-Result $ok $dest
}

Write-Host "`n[3/3] ฟอนต์ -> fonts\" -ForegroundColor Cyan
# ขอ CSS จาก Google Fonts (ต้องบอกว่าเป็น Chrome จึงได้ไฟล์ woff2) แล้วดึงลิงก์ของแต่ละชุดตัวอักษร
$css = ''
try { $cssFile = Join-Path $Tmp 'fonts.css'; Save-Url $FONTS_CSS $cssFile; $css = Get-Content -Raw -Encoding UTF8 $cssFile } catch { Write-Host '  ⚠ อ่านรายชื่อฟอนต์จาก Google Fonts ไม่ได้ จะใช้ลิงก์สำรองจาก npm' -ForegroundColor Yellow }
$found = @{}
foreach ($mt in [regex]::Matches($css, "/\*\s*([\w-]+)\s*\*/\s*@font-face\s*\{[^}]*?font-family:\s*'([^']+)'[^}]*?src:\s*url\(([^)]+)\)")) {
  $found["$($mt.Groups[2].Value)|$($mt.Groups[1].Value)"] = $mt.Groups[3].Value
}
$fonts = @(
  @('fonts\noto-sans-thai-thai.woff2', 'Noto Sans Thai|thai', $NPM_NOTO, 'files/noto-sans-thai-thai-wght-normal.woff2'),
  @('fonts\noto-sans-thai-latin.woff2', 'Noto Sans Thai|latin', $NPM_NOTO, 'files/noto-sans-thai-latin-wght-normal.woff2'),
  @('fonts\orbitron-latin.woff2', 'Orbitron|latin', $NPM_ORB, 'files/orbitron-latin-wght-normal.woff2')
)
foreach ($f in $fonts) {
  $ok = $false
  if ($found.ContainsKey($f[1])) { $ok = Get-Asset $f[0] 5000 @($found[$f[1]]) }
  if (-not $ok) { $ok = Get-FromTgz $f[2] $f[3] $f[0] 5000 }
  Add-Result $ok $f[0]
}
if ((Test-Path 'fonts\fonts.css') -and (Select-String -Quiet -Path 'fonts\fonts.css' -Pattern 'noto-sans-thai-thai.woff2')) {
  Write-Host '  ✔ มีอยู่แล้ว  fonts\fonts.css' -ForegroundColor Green; Add-Result $true 'fonts\fonts.css'
} else {
  $latin = 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD'
  $txt = @"
/* fonts.css — ฟอนต์ในเครื่อง (สร้างโดย tools/download-assets.ps1) */
@font-face { font-family: 'Noto Sans Thai'; font-style: normal; font-weight: 100 900; font-display: swap; src: url(noto-sans-thai-thai.woff2) format('woff2'); unicode-range: U+02D7, U+0303, U+0331, U+0E01-0E5B, U+200C-200D, U+25CC; }
@font-face { font-family: 'Noto Sans Thai'; font-style: normal; font-weight: 100 900; font-display: swap; src: url(noto-sans-thai-latin.woff2) format('woff2'); unicode-range: $latin; }
@font-face { font-family: 'Orbitron'; font-style: normal; font-weight: 400 900; font-display: swap; src: url(orbitron-latin.woff2) format('woff2'); unicode-range: $latin; }
"@
  [IO.File]::WriteAllText((Join-Path $AppDir 'fonts\fonts.css'), $txt, (New-Object Text.UTF8Encoding $false))
  Write-Host '  ✔ สร้าง fonts\fonts.css' -ForegroundColor Green; Add-Result $true 'fonts\fonts.css'
}

Remove-Item -Recurse -Force $Tmp -ErrorAction SilentlyContinue
$total = $script:Ok + $script:Fail
Write-Host "`n=============================================="
Write-Host " สรุป: สำเร็จ $($script:Ok) / $total ไฟล์" -ForegroundColor Cyan
if ($script:Fail -gt 0) {
  Write-Host " ✖ ไม่สำเร็จ $($script:Fail) ไฟล์:" -ForegroundColor Red
  $script:Failed | ForEach-Object { Write-Host "    - $_" -ForegroundColor Red }
  Write-Host ' ลองใหม่อีกครั้ง หรือใช้เน็ตมือถือ (Hotspot) เพราะเครือข่ายโรงเรียนอาจบล็อกบางเว็บ'
  exit 1
}
Write-Host ' ✔ ครบทุกไฟล์ — เปิดแอปแล้วดูป้ายมุมซ้ายล่าง ต้องขึ้นว่า "ไฟล์ในเครื่องครบ"' -ForegroundColor Green
Write-Host '=============================================='
exit 0
