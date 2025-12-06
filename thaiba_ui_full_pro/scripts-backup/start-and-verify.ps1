# scripts/start-and-verify.ps1
# 1. Kill old node
taskkill /F /IM node.exe /T 2>$null | Out-Null
Start-Sleep -Seconds 1

# 2. Start Server
Write-Host "Starting Server on Port 3001..."
Start-Process -NoNewWindow -FilePath "cmd.exe" -ArgumentList "/c npm run dev" -WorkingDirectory (Get-Location)

# 3. Wait for Health
$url = "http://127.0.0.1:3001"
$up = $false
for ($i = 0; $i -lt 30; $i++) {
    try {
        $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 1
        if ($r.StatusCode -eq 200) { $up = $true; break }
    }
    catch {}
    Start-Sleep -Seconds 2
    Write-Host -NoNewline "."
}

if (-not $up) {
    Write-Host "`nServer failed to start on 3001."
    exit 1
}

Write-Host "`nServer is UP at $url"

# 4. Check Auth
Write-Host "Checking if user exists (auth:gen)..."
$env:BASE_URL = $url
$env:E2E_TEST_EMAIL = "smoke@test.local"
$env:E2E_TEST_PW = "Pass123"

# Run auth generation in-process
try {
    node scripts/generateStorageState.js
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Auth Successful! User exists."
        Write-Host "Running Tests..."
        npx playwright test --project=chromium --width=1 --workers=1
    }
    else {
        throw "Auth failed"
    }
}
catch {
    Write-Host "Auth Failed (User not found or credentials wrong)."
    Write-Host "ACTION REQUIRED: Go to $url and Register 'smoke@test.local' / 'Pass123' manually."
    Write-Host "The server is running. Do it now."
}
