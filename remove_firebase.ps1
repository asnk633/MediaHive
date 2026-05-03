$files = Get-ChildItem -Path "d:\MediaHive App\src" -Recurse -File -Include "*.ts", "*.tsx", "*.js"
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    if ($content -match 'firebase') {
        # Remove imports
        $content = $content -replace '(?m)^import.*firebase.*?
', ''
        
        # Replace usages with mocks to keep TS happy temporarily
        $content = $content -replace 'getFirebaseAuth\(\)', '{ currentUser: { uid: "mock", getIdToken: async () => "mock", email: "mock" } }'
        $content = $content -replace 'getFirebaseDb\(\)', '{}'
        $content = $content -replace 'getFirebaseStorage\(\)', '{}'
        $content = $content -replace '(?s)const \{ app \}.*?initFirebase\(\);', ''
        $content = $content -replace 'initFirebase\(\)', '{}'
        
        # Special case for variable named 'auth' if it was imported
        $content = $content -replace '(?<!\.)\bauth\.currentUser', '{ uid: "mock" }.currentUser'
        
        # Special cases for db
        $content = $content -replace '(?<!\.)\bdb(?![\w])', '({} as any)'
        
        [IO.File]::WriteAllText($file.FullName, $content)
        Write-Host "Replaced in $($file.FullName)"
    }
}
