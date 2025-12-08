$ErrorActionPreference = "Continue"
$log = "native-rebuild.log"

function Log-Output {
    param([string]$Message)
    $Message | Out-File -FilePath $log -Append -Encoding utf8
    Write-Host $Message
}

"=== CI native repair run: $(Get-Date -Format o) ===" | Out-File -FilePath $log -Encoding utf8
Log-Output "node: $(node -v)"
Log-Output "process.modules: $(node -p 'process.versions.modules')"
Log-Output ""

Log-Output "Listing .node binaries..."
Get-ChildItem -Path .\node_modules -Recurse -Filter *.node -ErrorAction SilentlyContinue |
ForEach-Object { $_.FullName } | Out-File -FilePath $log -Append

Log-Output ""
Log-Output "Running npm rebuild (global)..."
npm rebuild 2>&1 | Out-File -FilePath $log -Append

$pkgs = @("better-sqlite3", "sqlite3", "sharp", "node-sass")
foreach ($p in $pkgs) {
    if (Test-Path "node_modules\$p") {
        Log-Output "Rebuilding $p (build-from-source)..."
        # Invoke directly, capture stderr
        # We use cmd /c to ensure arguments are passed simply if PS gets confused
        cmd /c "npm rebuild $p --build-from-source" 2>&1 | Out-File -FilePath $log -Append
        if ($LASTEXITCODE -ne 0) {
            Log-Output "rebuild $p failed with exit code $LASTEXITCODE"
        }
    }
    else {
        Log-Output "$p not present; skipping"
    }
}

# detect ABI-like messages in log
$logText = Get-Content -Raw -ErrorAction SilentlyContinue $log
if ($logText -match "ERR_DLOPEN_FAILED" -or $logText -match "compiled against a different Node.js version" -or $logText -match "Module did not self-register") {
    Log-Output "Detected ABI issues — performing clean reinstall..."
    if (Test-Path node_modules) { Remove-Item -Recurse -Force node_modules }
    npm ci 2>&1 | Out-File -FilePath $log -Append
}
else {
    Log-Output "No ABI errors detected; skipping full reinstall."
}

Log-Output "Quick require check for better-sqlite3 and sharp"
node -e "try{require('better-sqlite3'); console.log('better-sqlite3 OK')}catch(e){console.error('better-sqlite3 FAIL: '+e.message)}" 2>&1 | Out-File -FilePath $log -Append
node -e "try{require('sharp'); console.log('sharp OK')}catch(e){console.error('sharp FAIL: '+e.message)}" 2>&1 | Out-File -FilePath $log -Append

Log-Output "CI native repair finished."
