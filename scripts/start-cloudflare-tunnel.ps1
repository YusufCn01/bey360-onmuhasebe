$cloudflaredPath = "C:\Users\RAFIK\AppData\Local\Microsoft\WinGet\Packages\Cloudflare.cloudflared_Microsoft.Winget.Source_8wekyb3d8bbwe\cloudflared.exe"

if (!(Test-Path $cloudflaredPath)) {
  Write-Error "cloudflared bulunamadi. Once 'winget install --id Cloudflare.cloudflared -e' calistirin."
  exit 1
}

$projectRoot = Split-Path -Parent $PSScriptRoot
$logPath = Join-Path $projectRoot "cloudflared.log"
$errPath = Join-Path $projectRoot "cloudflared.err.log"

Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force
Remove-Item $logPath, $errPath -ErrorAction SilentlyContinue

Start-Process `
  -FilePath $cloudflaredPath `
  -ArgumentList "tunnel", "--url", "http://127.0.0.1:3000", "--no-autoupdate" `
  -RedirectStandardOutput $logPath `
  -RedirectStandardError $errPath `
  -WindowStyle Hidden

Start-Sleep -Seconds 8

if (!(Test-Path $errPath)) {
  Write-Error "Tunnel logu olusmadi."
  exit 1
}

$url = Get-Content $errPath | Select-String -Pattern "https://.*trycloudflare.com" | Select-Object -First 1

if ($url) {
  $match = [regex]::Match($url.Line, "https://[a-z0-9-]+\.trycloudflare\.com")
  if ($match.Success) {
    Write-Output $match.Value
    exit 0
  }
}

Write-Error "Tunnel URL bulunamadi. cloudflared.err.log dosyasini kontrol edin."
exit 1
