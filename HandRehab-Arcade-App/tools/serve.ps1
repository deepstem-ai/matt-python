# ============================================================
# serve.ps1 - web server สำรองสำหรับเครื่องที่ "ไม่มี Python" (HandRehab Arcade v2)
# Fallback static web server for Windows PCs without Python. Uses only Windows PowerShell 5.1 + .NET HttpListener.
#
# - ฟังเฉพาะ http://localhost:PORT/ (เครื่องอื่นในเครือข่ายเปิดไม่ได้ / loopback only, no admin rights needed)
# - ชนิดไฟล์ถูกต้อง: .js .mjs .wasm .task .tflite .json .webmanifest .woff2 .svg ...
# - รองรับ GET และ HEAD (ไม่รองรับ Range: ส่งทั้งไฟล์เสมอ / range-less GET, always 200 full file)
# - รับคำขอวนไปเรื่อย ๆ จนกว่าจะกด Ctrl+C หรือปิดหน้าต่าง / loops until Ctrl+C or window closed
# - โฟลเดอร์แอป = โฟลเดอร์แม่ของ tools (ไม่ใช้ที่อยู่ตายตัว รองรับชื่อโฟลเดอร์ที่มีช่องว่าง)
#
# วิธีใช้ / Usage (start.bat เรียกให้เอง):
#   powershell -NoProfile -ExecutionPolicy Bypass -File tools\serve.ps1 -Port 8000
# ============================================================
param([int]$Port = 8000)

$ErrorActionPreference = 'Stop'
try { [Console]::OutputEncoding = [Text.Encoding]::UTF8 } catch { }
$Host.UI.RawUI.WindowTitle = "HandRehab Server $Port"

# โฟลเดอร์แอป (แม่ของ tools) แบบเต็ม ลงท้ายด้วย \ เพื่อใช้ตรวจว่าไฟล์ที่ขออยู่ในโฟลเดอร์นี้จริง
$Root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
if (-not $Root.EndsWith('\')) { $Root += '\' }

# ชนิดไฟล์ (MIME) - Windows บางเครื่องตั้ง .js ผิดในรีจิสทรี จึงกำหนดเองทั้งหมด ไม่อ่านจากรีจิสทรี
$Mime = @{
  '.html' = 'text/html; charset=utf-8'; '.htm' = 'text/html; charset=utf-8'
  '.js' = 'text/javascript; charset=utf-8'; '.mjs' = 'text/javascript; charset=utf-8'
  '.css' = 'text/css; charset=utf-8'; '.json' = 'application/json; charset=utf-8'
  '.webmanifest' = 'application/manifest+json'; '.wasm' = 'application/wasm'
  '.task' = 'application/octet-stream'; '.tflite' = 'application/octet-stream'; '.bin' = 'application/octet-stream'
  '.woff2' = 'font/woff2'; '.woff' = 'font/woff'; '.ttf' = 'font/ttf'
  '.svg' = 'image/svg+xml'; '.png' = 'image/png'; '.jpg' = 'image/jpeg'; '.jpeg' = 'image/jpeg'
  '.gif' = 'image/gif'; '.webp' = 'image/webp'; '.ico' = 'image/x-icon'
  '.md' = 'text/plain; charset=utf-8'; '.txt' = 'text/plain; charset=utf-8'; '.csv' = 'text/csv; charset=utf-8'
  '.mp3' = 'audio/mpeg'; '.wav' = 'audio/wav'; '.mp4' = 'video/mp4'; '.webm' = 'video/webm'; '.pdf' = 'application/pdf'
}

$script:IsHead = $false
function Send-Text($resp, [int]$code, [string]$text) {
  $bytes = [Text.Encoding]::UTF8.GetBytes($text)
  $resp.StatusCode = $code
  $resp.ContentType = 'text/plain; charset=utf-8'
  $resp.ContentLength64 = $bytes.Length
  if ($script:IsHead) { return }   # HEAD = ส่งแค่หัว ไม่ส่งเนื้อหา
  $resp.OutputStream.Write($bytes, 0, $bytes.Length)
}

function Handle-Request($ctx) {
  $req = $ctx.Request; $resp = $ctx.Response
  try {
    # รับเฉพาะเครื่องตัวเอง (กันไว้อีกชั้น) / loopback clients only
    if (-not $req.IsLocal) { Send-Text $resp 403 'Forbidden'; return }
    $method = $req.HttpMethod
    $script:IsHead = ($method -eq 'HEAD')
    if ($method -ne 'GET' -and $method -ne 'HEAD') { $resp.AddHeader('Allow', 'GET, HEAD'); Send-Text $resp 405 'Method Not Allowed'; return }

    # แปลงที่อยู่เป็นไฟล์: ตัด ?query ออก ถอดรหัส %20 ฯลฯ แล้วกันการแอบออกนอกโฟลเดอร์แอป (..)
    $rel = [Uri]::UnescapeDataString($req.Url.AbsolutePath).TrimStart('/').Replace('/', '\')
    if ($rel -eq '' -or $rel.EndsWith('\')) { $rel += 'index.html' }
    $full = [IO.Path]::GetFullPath($Root + $rel)   # ต่อสตริงตรง ๆ (Join-Path ของ PowerShell ตีความ : และ [ ] เอง)
    if (-not $full.StartsWith($Root, [StringComparison]::OrdinalIgnoreCase)) { Send-Text $resp 403 'Forbidden'; return }
    if ([IO.Directory]::Exists($full)) { $full = Join-Path $full 'index.html' }
    if (-not [IO.File]::Exists($full)) { Send-Text $resp 404 ('Not found: /' + $rel.Replace('\', '/')); return }

    $ext = [IO.Path]::GetExtension($full).ToLowerInvariant()
    $type = $Mime[$ext]; if (-not $type) { $type = 'application/octet-stream' }
    $fs = [IO.File]::Open($full, [IO.FileMode]::Open, [IO.FileAccess]::Read, [IO.FileShare]::ReadWrite)
    try {
      $resp.StatusCode = 200
      $resp.ContentType = $type
      $resp.ContentLength64 = $fs.Length
      $resp.AddHeader('Cache-Control', 'no-cache')
      $resp.AddHeader('X-Content-Type-Options', 'nosniff')
      if ($method -eq 'GET') { $fs.CopyTo($resp.OutputStream) }   # HEAD = ส่งแค่หัว (ขนาด + ชนิด) ไม่ส่งเนื้อไฟล์
    } finally { $fs.Dispose() }
  } catch {
    # เบราว์เซอร์ยกเลิกคำขอกลางทาง (เช่น เปลี่ยนหน้า) เป็นเรื่องปกติ ไม่ต้องตกใจ
    try { if ($resp.OutputStream.CanWrite -and $resp.StatusCode -eq 200 -and $resp.ContentLength64 -eq 0) { Send-Text $resp 500 'Server error' } } catch { }
  } finally {
    try { $resp.Close() } catch { }
  }
}

$listener = New-Object System.Net.HttpListener
# "localhost" ใช้ได้โดยไม่ต้องเป็นผู้ดูแลระบบ (http://127.0.0.1:PORT/ หรือ http://+:PORT/ ต้องใช้สิทธิ์ admin)
$listener.Prefixes.Add("http://localhost:$Port/")
try {
  $listener.Start()
} catch {
  Write-Host ''
  Write-Host "[!] เปิดเซิร์ฟเวอร์ที่พอร์ต $Port ไม่ได้ / Cannot start server on port $Port" -ForegroundColor Red
  Write-Host "    $($_.Exception.Message)"
  Write-Host '    พอร์ตอาจถูกใช้อยู่ ปิดหน้าต่าง HandRehab Server อื่น ๆ แล้วลองใหม่ / The port may be in use.'
  Write-Host ''
  Read-Host 'กด Enter เพื่อปิด / Press Enter to close'
  exit 1
}

Write-Host "HandRehab Arcade (PowerShell server): http://localhost:$Port/index.html" -ForegroundColor Green
Write-Host "โฟลเดอร์แอป / App folder: $Root"
Write-Host 'ปิดหน้าต่างนี้ หรือกด Ctrl+C = ปิดเซิร์ฟเวอร์ / Close this window or press Ctrl+C to stop'

try {
  while ($listener.IsListening) {
    # รอคำขอแบบมีจังหวะ (ทีละครึ่งวินาที) เพื่อให้ Ctrl+C ทำงานได้ทันที
    # (GetContext() แบบรอเฉย ๆ จะกด Ctrl+C ไม่ได้จนกว่าจะมีคำขอเข้ามา)
    $task = $listener.GetContextAsync()
    while (-not $task.AsyncWaitHandle.WaitOne(500)) { }
    $ctx = $null
    try { $ctx = $task.GetAwaiter().GetResult() } catch { continue }
    Handle-Request $ctx
  }
} finally {
  # Ctrl+C / ปิดหน้าต่าง → ปิดพอร์ตให้เรียบร้อย
  try { $listener.Stop(); $listener.Close() } catch { }
  Write-Host 'ปิดเซิร์ฟเวอร์แล้ว / Server stopped'
}
