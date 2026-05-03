$lines = Get-Content compile_errors3.txt -Encoding Unicode | Select-String "error TS"
foreach ($line in $lines) {
    if ($line -match '^([\w\-\.\/]+)\((\d+),(\d+)\): error (TS\d+): (.*)') {
        $file = $matches[1]
        $lineNum = [int]$matches[2]
        if (Test-Path $file) {
            $content = Get-Content $file
            Write-Host "FILE: $file LINE: $lineNum"
            Write-Host $content[$lineNum - 1]
            Write-Host "---"
        }
    }
}
