<#
  DeepDistrict - update on Windows in one go (keeps the real data exactly as it is)

  Put these in the same folder (normally Downloads) and double-click DeepDistrict-Update.bat:
    deepdistrict-web-v*.zip          the newest release
    deepdistrict-add-*.json          (optional) records to ADD, prepared for you
    DeepDistrict-Update.bat / .ps1   this tool

  What it does:
    1. Finds the newest zip (and records file) next to this script.
    2. Stops if DeepDistrict is still running (close its window first).
    3. Backs up server\data to  <folder>\deepdistrict-data-backup-<time>  (a copy - nothing is moved or deleted).
    4. Extracts the zip and copies the program files into  <folder>\deepdistrict-web
       - server\data is never touched (and the release zip never contains it).
    5. Checks the database file is byte-for-byte the same as before.
    6. Adds the records file with tools\add_records.py (backup, add only, check, asks you first).
    7. Offers to move older release zips to the Recycle Bin (DeepDistrict-Cleanup.ps1; never folders or data).
    8. Offers to start DeepDistrict.
#>
param(
  [string]$Target = "",
  [string]$Zip = "",
  [string]$Records = ""
)
$ErrorActionPreference = "Stop"
$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $Target) { $Target = Join-Path $Here "deepdistrict-web" }
$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"

function Say($t, $c = "Gray") { Write-Host $t -ForegroundColor $c }
function Stop-With($t) { Say ""; Say "STOPPED: $t" Red; Say "Nothing was changed." Yellow; Read-Host "Press Enter to close"; exit 1 }

Say "DeepDistrict update" Cyan
Say "Folder: $Target"

# 1) files
if (-not $Zip) { $z = Get-ChildItem -Path $Here -Filter "deepdistrict-web-v*.zip" -File | Sort-Object LastWriteTime -Descending | Select-Object -First 1; if ($z) { $Zip = $z.FullName } }
if (-not $Zip -or -not (Test-Path $Zip)) { Stop-With "No deepdistrict-web-v*.zip next to this script ($Here)." }
if (-not $Records) { $r = Get-ChildItem -Path $Here -Filter "deepdistrict-add-*.json" -File | Sort-Object LastWriteTime -Descending | Select-Object -First 1; if ($r) { $Records = $r.FullName } }
Say "Release: $(Split-Path -Leaf $Zip)"
if ($Records) { Say "Records to add: $(Split-Path -Leaf $Records)" } else { Say "No records file to add (that is fine)." }

# Python
$Py = $null
foreach ($c in @("python", "py")) { if (Get-Command $c -ErrorAction SilentlyContinue) { $Py = $c; break } }
if (-not $Py) { Stop-With "Python 3 is not installed. Install it from https://www.python.org/downloads/ (tick 'Add Python to PATH')." }

# 2) not while the server runs
$running = Get-CimInstance Win32_Process -Filter "Name='python.exe' OR Name='pythonw.exe' OR Name='py.exe'" -ErrorAction SilentlyContinue |
  Where-Object { $_.CommandLine -and $_.CommandLine -like "*server*app.py*" }
if ($running) { Stop-With "DeepDistrict is still running. Close its black window (or press Ctrl+C in it), then run this again." }

# 3) backup of the data (copy only)
$Data = Join-Path $Target "server\data"
$Db = Join-Path $Data "deepdistrict.db"
$hashBefore = $null
if (Test-Path $Data) {
  $Backup = Join-Path $Here "deepdistrict-data-backup-$Stamp"
  Copy-Item -Path $Data -Destination $Backup -Recurse
  Say "Data backed up to: $Backup" Green
  if (Test-Path $Db) { $hashBefore = (Get-FileHash $Db -Algorithm SHA256).Hash }
} else {
  Say "No server\data yet (first install) - nothing to back up."
}

# 4) extract and copy program files - never server\data
$Tmp = Join-Path $env:TEMP "dd-update-$Stamp"
Expand-Archive -Path $Zip -DestinationPath $Tmp -Force
$Src = Join-Path $Tmp "deepdistrict-web"
if (-not (Test-Path (Join-Path $Src "server\app.py"))) { Stop-With "The zip does not look like a DeepDistrict release." }
if (Test-Path (Join-Path $Src "server\data")) { Stop-With "The zip contains server\data - refusing to use it so your data stays safe." }
New-Item -ItemType Directory -Force -Path $Target | Out-Null
robocopy $Src $Target /E /XD (Join-Path $Src "server\data") $Data /NFL /NDL /NJH /NJS /NP | Out-Null
if ($LASTEXITCODE -ge 8) { Stop-With "Copying the program files failed (robocopy code $LASTEXITCODE)." }
if ($Tmp.StartsWith($env:TEMP) -and (Split-Path -Leaf $Tmp).StartsWith("dd-update-")) { Remove-Item -Recurse -Force $Tmp }
$ver = (Get-Content (Join-Path $Target "VERSION") -ErrorAction SilentlyContinue | Select-Object -First 1)
Say "Program files updated to version $ver" Green

# 5) the database must be exactly the same
if ($hashBefore) {
  $hashAfter = (Get-FileHash $Db -Algorithm SHA256).Hash
  if ($hashAfter -ne $hashBefore) { Stop-With "The database changed during the update - restore it from $Backup." }
  Say "Checked: your data is exactly as before." Green
}

# 6) add the prepared records (add only - asks first)
if ($Records) {
  if (-not (Test-Path $Db)) {
    Say "To add the records, start DeepDistrict once (start.bat), close it, then run this again." Yellow
  } else {
    $env:PYTHONIOENCODING = "utf-8"
    Push-Location $Target
    & $Py "tools\add_records.py" $Records
    Pop-Location
  }
}

# 7) optional: move older release zips to the Recycle Bin (never folders or data)
$Clean = Join-Path $Here "DeepDistrict-Cleanup.ps1"
if (Test-Path $Clean) {
  Say ""
  $c = Read-Host "Move older deepdistrict-web-v*.zip files to the Recycle Bin? The newest is kept; data is never touched. (y/N)"
  if ($c -match "^[Yy]") { & $Clean -Folder $Here -Yes }
}

# 8) start
Say ""
$ans = Read-Host "Start DeepDistrict now? (Y/n)"
if ($ans -eq "" -or $ans -match "^[Yy]") { Start-Process -FilePath (Join-Path $Target "start.bat") -WorkingDirectory $Target }
Say "Done." Cyan
