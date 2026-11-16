# ============================================================
# make-desktop-shortcut.ps1 - สร้างทางลัด "FingerRehab — HandRehab Arcade" บนเดสก์ท็อป (และในเมนู Start)
# Creates a desktop (and Start menu) shortcut that runs start.bat of THIS app folder, with icons\app.ico.
# ไม่ใช้ที่อยู่ตายตัว: โฟลเดอร์แอป = โฟลเดอร์แม่ของ tools (หรือส่ง -AppDir เอง) รองรับชื่อที่มีช่องว่าง
# วิธีใช้ / Usage: ดับเบิลคลิก tools\make-desktop-shortcut.bat
#   หรือ powershell -NoProfile -ExecutionPolicy Bypass -File tools\make-desktop-shortcut.ps1 [-AppDir "C:\Downloads\FingerRehab"] [-NoStartMenu]
# ============================================================
param([string]$AppDir = '', [switch]$NoStartMenu)

$ErrorActionPreference = 'Stop'
try { [Console]::OutputEncoding = [Text.Encoding]::UTF8 } catch { }
if (-not $AppDir) { $AppDir = Join-Path $PSScriptRoot '..' }
$AppDir = [IO.Path]::GetFullPath($AppDir).TrimEnd('\')

$Name = 'FingerRehab — HandRehab Arcade'
$Target = Join-Path $AppDir 'start.bat'
$Icon = Join-Path $AppDir 'icons\app.ico'
if (-not (Test-Path -LiteralPath $Target)) { throw "ไม่พบ / Not found: $Target" }

function New-AppShortcut([string]$folder) {
  if (-not (Test-Path -LiteralPath $folder)) { New-Item -ItemType Directory -Path $folder -Force | Out-Null }
  $lnk = Join-Path $folder ($Name + '.lnk')
  $shell = New-Object -ComObject WScript.Shell
  $s = $shell.CreateShortcut($lnk)
  $s.TargetPath = $Target
  $s.WorkingDirectory = $AppDir                 # เริ่มในโฟลเดอร์แอป (start.bat ก็ cd เองอยู่แล้ว)
  if (Test-Path -LiteralPath $Icon) { $s.IconLocation = "$Icon,0" }
  $s.Description = 'FingerRehab — HandRehab Arcade: เกมบริหารมือ / hand rehabilitation games'
  $s.WindowStyle = 1
  $s.Save()
  return $lnk
}

try {
  # Desktop จริงของผู้ใช้ (รองรับกรณีย้ายไป OneDrive)
  $desk = [Environment]::GetFolderPath('Desktop')
  $made = New-AppShortcut $desk
  Write-Host "[OK] สร้างทางลัดบนเดสก์ท็อปแล้ว / Desktop shortcut created:" -ForegroundColor Green
  Write-Host "     $made"
  if (-not $NoStartMenu) {
    $menu = New-AppShortcut ([Environment]::GetFolderPath('Programs'))
    Write-Host "[OK] เพิ่มในเมนู Start แล้ว / Added to Start menu: $menu" -ForegroundColor Green
  }
  Write-Host "     ชี้ไปที่ / points to: $Target"
  exit 0
} catch {
  Write-Host "[!] สร้างทางลัดไม่สำเร็จ / Could not create the shortcut: $($_.Exception.Message)" -ForegroundColor Red
  Write-Host "    ใช้วิธีนี้แทน: คลิกขวา start.bat > Send to > Desktop (create shortcut)"
  Write-Host "    Instead: right-click start.bat > Send to > Desktop (create shortcut)"
  exit 1
}
