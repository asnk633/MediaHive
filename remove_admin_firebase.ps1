$files = Get-ChildItem -Path "d:\MediaHive App\src" -Recurse -File -Include "*.ts", "*.tsx", "*.js"
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    if ($content -match '(?i)firebase') {
        # General string replacement for firebase imports + variables
        $content = $content -replace '(?mi)^.*import.*(?i)firebase.*$?
', ''
        $content = $content -replace '(?mi)^.*require.*(?i)firebase.*$?
', ''
        
        # Replace variable usages that might break
        $content = $content -replace 'getFirebaseAdminDb\(\)', '({} as any)'
        $content = $content -replace 'adminDb', '({} as any)'
        $content = $content -replace 'adminAuth', '({} as any)'
        $content = $content -replace 'FIREBASE', 'MOCK_KEY'
        $content = $content -replace '(?i)firebase\s*?=\s*?', 'mock = '
        
        # Stub out test env setting if present
        $content = $content -replace 'process\.env\.MOCK_KEY', 'process.env.MOCK'
        
        [IO.File]::WriteAllText($file.FullName, $content)
        Write-Host "Replaced in $($file.FullName)"
    }
}
