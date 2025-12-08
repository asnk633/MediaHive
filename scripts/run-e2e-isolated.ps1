# scripts/run-e2e-isolated.ps1
# Script to run E2E tests with isolated test data

Write-Host "Starting isolated E2E test run..."

# Generate a unique test run ID
$TestRunId = "test-run-$(Get-Date -UFormat '%s')-$PID"
Write-Host "Test run ID: $TestRunId"

# Start the development server in the background
Write-Host "Starting development server..."
Start-Process -FilePath "npm" -ArgumentList "run", "dev" -RedirectStandardOutput "dev-server.log" -RedirectStandardError "dev-server-error.log" -PassThru
$ServerProcess = Get-Process -Name "node" | Where-Object { $_.CommandLine -like "*next*" }

# Wait for the server to be ready
Write-Host "Waiting for server to be ready..."
$Timeout = 60
$StartTime = Get-Date
do {
    Start-Sleep -Seconds 1
    try {
        $Response = Invoke-WebRequest -Uri "http://localhost:3000" -Method Head -UseBasicParsing
        if ($Response.StatusCode -eq 200) {
            Write-Host "Server is ready!"
            break
        }
    } catch {
        # Server not ready yet
    }
    
    $ElapsedTime = (Get-Date) - $StartTime
    if ($ElapsedTime.TotalSeconds -gt $Timeout) {
        Write-Error "Server failed to start within $Timeout seconds"
        exit 1
    }
} while ($true)

# Run Playwright tests with the test run ID
Write-Host "Running Playwright tests..."
$env:TEST_RUN_ID = $TestRunId
npx playwright test

# Capture the exit code
$ExitCode = $LASTEXITCODE

# Stop the development server
Write-Host "Stopping development server..."
Stop-Process -Id $ServerProcess.Id -Force

# Cleanup test data
Write-Host "Cleaning up test data..."
# In a real implementation, you would call the cleanup endpoint here
# Invoke-WebRequest -Uri "http://localhost:3000/api/test-utils/cleanup?runId=$TestRunId" -Method Delete

# Exit with the same code as the tests
exit $ExitCode