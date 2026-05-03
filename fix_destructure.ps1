$files = Get-ChildItem -Path "d:\MediaHive App\src" -Recurse -File -Include "*.ts", "*.tsx", "*.js"
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    if ($content -match 'const\s*\{\s*\}\s*=') {
        $content = $content -replace 'const\s*\{\s*\}\s*=', 'const mockDbIgnore ='
        [IO.File]::WriteAllText($file.FullName, $content)
        Write-Host "Fixed empty destructuring in $($file.FullName)"
    }
}
