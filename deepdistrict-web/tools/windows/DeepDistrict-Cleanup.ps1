<#
  DeepDistrict - remove old release zips (keeps the newest one)

  Put next to the release zips (normally Downloads) and double-click DeepDistrict-Cleanup.bat.

  Safety:
    - Only FILES named exactly  deepdistrict-web-v<major>.<minor>r<n>.zip  in this folder are considered.
    - The newest version (by version number) is always kept.
    - Folders are never touched: not deepdistrict-web, not server\data, not any backup folder.
    - Files go to the Recycle Bin (you can restore them), and you see the list and confirm first.
#>
param([string]$Folder = "", [switch]$Yes)
$ErrorActionPreference = "Stop"
if (-not $Folder) { $Folder = Split-Path -Parent $MyInvocation.MyCommand.Path }
function Say($t, $c = "Gray") { Write-Host $t -ForegroundColor $c }

Say "DeepDistrict - clean up old release zips" Cyan
Say "Folder: $Folder"

$rx = '^deepdistrict-web-v(\d+)\.(\d+)r(\d+)\.zip$'
$zips = @(Get-ChildItem -Path $Folder -File | Where-Object { $_.Name -match $rx } | ForEach-Object {
  $m = [regex]::Match($_.Name, $rx)
  [pscustomobject]@{ File = $_; Key = ([int]$m.Groups[1].Value * 1000000) + ([int]$m.Groups[2].Value * 1000) + [int]$m.Groups[3].Value }
} | Sort-Object Key -Descending)

if ($zips.Count -le 1) { Say "Nothing to clean: $($zips.Count) release zip found." Green; if (-not $Yes) { Read-Host "Press Enter to close" }; exit 0 }

$keep = $zips[0].File
$old = @($zips | Select-Object -Skip 1 | ForEach-Object { $_.File })
Say ""
Say "Keep (newest): $($keep.Name)" Green
Say "Move to the Recycle Bin ($($old.Count)):" Yellow
$old | ForEach-Object { Say ("  - {0}  ({1:N1} MB)" -f $_.Name, ($_.Length / 1MB)) }
Say ""
Say "Your data is not touched: deepdistrict-web\server\data and every backup folder stay as they are." Green

if (-not $Yes) {
  $ans = Read-Host "Move these old zips to the Recycle Bin? (y/N)"
  if ($ans -notmatch '^[Yy]') { Say "Cancelled - nothing changed."; Read-Host "Press Enter to close"; exit 0 }
}

Add-Type -AssemblyName Microsoft.VisualBasic
$n = 0
foreach ($f in $old) {
  # last check on every file: right name, a file (not a folder), in this folder, and not the newest
  if ($f.Name -notmatch $rx -or $f.PSIsContainer -or $f.DirectoryName.TrimEnd('\') -ne (Get-Item $Folder).FullName.TrimEnd('\') -or $f.FullName -eq $keep.FullName) { continue }
  [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile($f.FullName, 'OnlyErrorDialogs', 'SendToRecycleBin')
  $n++
}
Say "Done: $n old zip(s) moved to the Recycle Bin. Kept $($keep.Name)." Cyan
if (-not $Yes) { Read-Host "Press Enter to close" }
