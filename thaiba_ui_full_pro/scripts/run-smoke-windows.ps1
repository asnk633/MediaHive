# Save as scripts/run-smoke-windows.ps1 and run in project root (or paste lines)

# 1) kill previous node processes (force)
Write-Host "Killing existing node.exe processes (if any)..."
tasklist /FI "IMAGENAME eq node.exe" 2>$null | Select-String node.exe > $null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Found node.exe — killing..."
    taskkill /F /IM node.exe /T 2>$null | Out-Null
    Start-Sleep -Seconds 1
}
else {
    Write-Host "No node.exe found running."
}

# 2) ensure dev server port free (optional)
$port = 3001
Write-Host "Checking if port $port is free..."
# (netstat output shown, doesn't stop anything)
netstat -ano | findstr ":$port"

# 3) ensure storage state exists — copy existing auth-storage.json -> e2e/storageState.json
$src = "e2e/auth-storage.json"
$dst = "e2e/storageState.json"
if (Test-Path $src) {
    Copy-Item -Force -Path $src -Destination $dst
    Write-Host "Copied $src -> $dst"
}
else {
    Write-Host "Warning: $src not found. If you don't have a saved auth state, tests will attempt to run unauthenticated."
}

# 4) start dev server in background (uses npm run dev). Adjust if you use different start command.
Write-Host "Starting dev server (npm run dev) in background..."
Start-Process -NoNewWindow -FilePath "cmd.exe" -ArgumentList "/c npm run dev" -WorkingDirectory (Get-Location)

# 5) wait for server health (retry loop)
$health = $false
for ($i = 0; $i -lt 30; $i++) {
    try {
        $resp = Invoke-WebRequest -Uri "http://127.0.0.1:$port/" -UseBasicParsing -TimeoutSec 2
        if ($resp.StatusCode -ge 200) { $health = $true; break }
    }
    catch {}
    Start-Sleep -Seconds 1
    Write-Host -NoNewline "."
}
if (-not $health) {
    Write-Host "`nServer did not come up at 127.0.0.1:$port within 30s. Check dev server logs (npm run dev). Aborting tests."
    exit 2
}
Write-Host "`nServer is up."

# 6) run single smoke test with trace + video + screenshot on failure
$base = "http://127.0.0.1:$port"
Write-Host "Running Playwright smoke test (single file) with tracing..."
# Use cross-env shim if available; on PowerShell use env var direct
$env:BASE_URL = $base
# Path to the smoke file (adjust if different)
$testfile = "e2e\playwright\ui\smoke.single.spec.ts"
# Run playwright and save artifacts into e2e-artifacts
npx playwright test $testfile --project=chromium --retries=2 --workers=1 --timeout=300000 --trace on --output=e2e-artifacts

# 7) print artifact locations
Write-Host "Playwright run finished. Artifacts (traces, screenshots, videos) -> e2e-artifacts/"
Get-ChildItem -Path e2e-artifacts -Recurse -Force -ErrorAction SilentlyContinue | Select-Object -First 20
