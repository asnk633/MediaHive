# Requires: node (v20), git, npx, jscodeshift
$ErrorActionPreference = 'Continue'

$report = "fix-report.txt"
"React-19 fix run started at: $(Get-Date)" | Out-File $report

# 1) Ensure clean install
Write-Host "Cleaning node_modules and reinstalling..."
if (Test-Path "node_modules") { Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue }
if (Test-Path "package-lock.json") { Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue }
npm install
"npm install completed at: $(Get-Date)" | Out-File -Append $report

# 2) Quoder static scan (if installed)
if (Get-Command quoder -ErrorAction SilentlyContinue) {
    Write-Host "Running Quoder scan..."
    quoder scan --format json > quoder-scan.json
    "Quoder scan saved to quoder-scan.json" | Out-File -Append $report
}
else {
    "Quoder not found in PATH" | Out-File -Append $report
}

# 3) Antigravity diagnostics (if available)
if (Get-Command antigravity -ErrorAction SilentlyContinue) {
    Write-Host "Running Antigravity diagnostics..."
    antigravity diagnose --output antigravity-diagnose.txt
    "Antigravity diagnose saved to antigravity-diagnose.txt" | Out-File -Append $report
}
else {
    "Antigravity not found in PATH" | Out-File -Append $report
}

# 4) Run tests before changes
Write-Host "Running unit tests (baseline)..."
# Use cmd /c to ensure output redirection works if needed, or just run directly
npm run test:unit -- --silent
if ($LASTEXITCODE -ne 0) {
    Write-Host "Unit tests exited non-zero (recording in report)"
}
"Pre-change test exit code: $LASTEXITCODE" | Out-File -Append $report

# 5) Run react codemod: ReactDOM.render -> createRoot
Write-Host "Running createRoot codemod..."
# We use call operator & to run npx
& npx jscodeshift -t https://raw.githubusercontent.com/reactjs/react-codemod/master/transforms/class.js src
# Run the specific transform for root rendering:
& npx jscodeshift -t https://raw.githubusercontent.com/reactjs/react-codemod/master/transforms/replace-render-with-create-root.js src
"Ran createRoot codemod at: $(Get-Date)" | Out-File -Append $report

# 6) Run custom find for ReactDOM.render occurrences
Write-Host "Searching for ReactDOM.render..."
$grep = git grep -n "ReactDOM.render"
if ($grep) { $grep | Out-File -Append $report } else { "none" | Out-File -Append $report }

# 7) Update vulnerable/outdated deps (dry-run)
Write-Host "Checking outdated packages..."
npm outdated --long > npm-outdated.txt
"npm outdated saved to npm-outdated.txt" | Out-File -Append $report

# 8) Run tests again
Write-Host "Running unit tests (post-codemod)..."
npm run test:unit -- --silent
if ($LASTEXITCODE -ne 0) {
    Write-Host "Unit tests exited non-zero (post-codemod)"
}
"Post-change test exit code: $LASTEXITCODE" | Out-File -Append $report

# 9) Run Playwright (if configured)
if (Test-Path "./node_modules/.bin/playwright.cmd") {
    Write-Host "Running Playwright tests..."
    & npx playwright test --reporter=list
    if ($LASTEXITCODE -ne 0) { Write-Host "Playwright failed (see output)" }
    "Playwright executed at: $(Get-Date)" | Out-File -Append $report
}
else {
    "Playwright not installed locally" | Out-File -Append $report
}

Write-Host "React-19 fix script finished. See $report"
