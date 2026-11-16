# ============================================================
# install.ps1 - ติดตั้ง FingerRehab (HandRehab Arcade) ลง C:\Downloads\FingerRehab
# Installs the app into C:\Downloads\FingerRehab, creates the desktop shortcut, offers to launch.
#  1) คัดลอกทั้งโฟลเดอร์แอป (โฟลเดอร์แม่ของ tools = ที่แตก ZIP ไว้) ไปที่ปลายทาง
#     ถ้าปลายทางมีอยู่แล้ว จะถามก่อนเขียนทับ (ข้อมูลผู้ใช้อยู่ในเบราว์เซอร์ ไม่ได้อยู่ในโฟลเดอร์ จึงไม่หาย)
#  2) สร้างทางลัด "FingerRehab — HandRehab Arcade" บนเดสก์ท็อป -> C:\Downloads\FingerRehab\start.bat
#  3) ถามว่าจะเปิดแอปเลยไหม
# วิธีใช้ / Usage: ดับเบิลคลิก install.bat (หรือ ... -File tools\install.ps1 [-Dest "D:\Other folder"] [-Yes])
# ============================================================
param([string]$Dest = 'C:\Downloads\FingerRehab', [switch]$Yes)

$ErrorActionPreference = 'Stop'
try { [Console]::OutputEncoding = [Text.Encoding]::UTF8 } catch { }
$Host.UI.RawUI.WindowTitle = 'FingerRehab - Install'

function Ask([string]$question) {
  if ($Yes) { return $true }
  $a = Read-Host "$question [Y/N]"
  return ($a -match '^\s*(y|yes|ใช่|ช)\s*$')
}

$Src = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..')).TrimEnd('\')
$Dest = [IO.Path]::GetFullPath($Dest).TrimEnd('\')

Write-Host ''
Write-Host '=== ติดตั้ง FingerRehab — HandRehab Arcade / Install ===' -ForegroundColor Cyan
Write-Host "จาก / From : $Src"
Write-Host "ไปที่ / To : $Dest"
Write-Host ''

try {
  if (-not (Test-Path -LiteralPath (Join-Path $Src 'start.bat')) -or -not (Test-Path -LiteralPath (Join-Path $Src 'index.html'))) {
    throw 'ไม่พบไฟล์ของแอป (start.bat, index.html) ข้าง install.bat - แตกไฟล์ ZIP ให้ครบก่อน / App files not found next to install.bat. Extract the whole ZIP first.'
  }
  # กันพลาด: ปลายทางต้องไม่ใช่รากไดรฟ์ และไม่ใช่โฟลเดอร์ต้นทางหรือโฟลเดอร์ที่อยู่ในต้นทาง
  if ($Dest.Length -le 3) { throw "ปลายทางไม่ถูกต้อง / Invalid destination: $Dest" }
  $same = $Src -ieq $Dest
  if (-not $same -and $Dest.StartsWith($Src + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'ปลายทางอยู่ในโฟลเดอร์ต้นทาง / Destination is inside the source folder.' }

  if ($same) {
    Write-Host '[i] แอปอยู่ที่ปลายทางอยู่แล้ว ไม่ต้องคัดลอก / Already installed here, skipping copy.' -ForegroundColor Yellow
  } else {
    if (Test-Path -LiteralPath $Dest) {
      $hasFiles = @(Get-ChildItem -LiteralPath $Dest -Force -ErrorAction SilentlyContinue).Count -gt 0
      if ($hasFiles) {
        Write-Host "[?] มีโฟลเดอร์ $Dest อยู่แล้ว / The folder already exists." -ForegroundColor Yellow
        Write-Host '    เขียนทับ = ลบไฟล์เดิมในโฟลเดอร์นั้นแล้วใส่ไฟล์ใหม่ (ข้อมูลผู้ใช้/ประวัติการฝึกอยู่ในเบราว์เซอร์ ไม่หาย; ไฟล์ออฟไลน์ใน models/vendor/fonts เก็บไว้)'
        Write-Host '    Overwrite = replace the old files (user data lives in the browser and is kept).'
        Write-Host '    ปิดหน้าต่างแอปและหน้าต่าง "HandRehab Server" ก่อน / Close the app and any "HandRehab Server" window first.'
        if (-not (Ask 'เขียนทับ? / Overwrite?')) { Write-Host 'ยกเลิกแล้ว ไม่มีอะไรถูกเปลี่ยน / Cancelled, nothing changed.'; exit 2 }
        # เก็บโฟลเดอร์ไฟล์ออฟไลน์ที่ดาวน์โหลดไว้แล้ว (models / vendor / fonts) ไม่ต้องโหลดใหม่ / keep downloaded offline assets
        Get-ChildItem -LiteralPath $Dest -Force | Where-Object { @('models','vendor','fonts') -notcontains $_.Name } | Remove-Item -Recurse -Force
      }
    } else {
      New-Item -ItemType Directory -Path $Dest -Force | Out-Null
    }
    Write-Host 'กำลังคัดลอกไฟล์... / Copying files...'
    $skip = @('.git', 'dist')
    Get-ChildItem -LiteralPath $Src -Force | Where-Object { $skip -notcontains $_.Name } |
      ForEach-Object { Copy-Item -LiteralPath $_.FullName -Destination $Dest -Recurse -Force }
    # ไฟล์จาก ZIP ที่ดาวน์โหลดมามีป้าย "มาจากอินเทอร์เน็ต" -> เอาออก Windows จะได้ไม่เตือนทุกครั้ง
    Get-ChildItem -LiteralPath $Dest -Recurse -File -Force | ForEach-Object { try { Unblock-File -LiteralPath $_.FullName } catch { } }
    $n = @(Get-ChildItem -LiteralPath $Dest -Recurse -File -Force).Count
    Write-Host "[OK] คัดลอกแล้ว $n ไฟล์ / Copied $n files." -ForegroundColor Green
  }

  # ทางลัดบนเดสก์ท็อป (ใช้สคริปต์จากโฟลเดอร์ที่ติดตั้งแล้ว ให้ทางลัดชี้ไปที่ปลายทาง)
  & (Join-Path $Dest 'tools\make-desktop-shortcut.ps1') -AppDir $Dest
  Write-Host ''
  Write-Host '[OK] ติดตั้งเสร็จ / Installation complete.' -ForegroundColor Green
  Write-Host '     ครั้งต่อไปเปิดจากทางลัด "FingerRehab — HandRehab Arcade" บนเดสก์ท็อป'
  Write-Host "     Next time use the desktop shortcut, or double-click $Dest\start.bat"
  Write-Host '     (ใช้งานออฟไลน์: รัน tools\download-assets.bat หนึ่งครั้ง / for offline use run tools\download-assets.bat once)'
  Write-Host ''
  if (Ask 'เปิดแอปเลยไหม? / Launch the app now?') {
    Start-Process -FilePath (Join-Path $Dest 'start.bat') -WorkingDirectory $Dest
  }
  exit 0
} catch {
  Write-Host ''
  Write-Host "[!] ติดตั้งไม่สำเร็จ / Installation failed: $($_.Exception.Message)" -ForegroundColor Red
  Write-Host '    ลองปิดหน้าต่างแอป / HandRehab Server แล้วรัน install.bat ใหม่'
  Write-Host '    Close the app and "HandRehab Server" windows, then run install.bat again.'
  Write-Host "    หรือคัดลอกโฟลเดอร์เองไปที่ $Dest / Or copy the folder there by hand."
  exit 1
}
