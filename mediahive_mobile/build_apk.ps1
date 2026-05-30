# MediaHive APK Build & Version-Naming Automation Script
# Custom names outputs to: build/app/outputs/flutter-apk/MediaHive_V<version>.apk

Write-Host "[MediaHive] Starting automated APK build process..." -ForegroundColor Cyan

# 1. Parse version from pubspec.yaml
$pubspecPath = Join-Path $PSScriptRoot "pubspec.yaml"
if (-not (Test-Path $pubspecPath)) {
    Write-Host "[ERROR] Could not find pubspec.yaml in the current directory!" -ForegroundColor Red
    exit 1
}

$versionLine = Get-Content $pubspecPath | Select-String -Pattern "^version:\s*([^\s]+)"
if ($versionLine -eq $null) {
    Write-Host "[ERROR] Could not parse version line from pubspec.yaml!" -ForegroundColor Red
    exit 1
}

$rawVersion = $versionLine.Matches.Groups[1].Value
# Sanitize version string for clean safe filenames (replace '+' with '_')
$cleanVersion = $rawVersion -replace '\+', '_'

Write-Host "Detected Version: $rawVersion" -ForegroundColor Yellow
Write-Host "Target Filename: MediaHive_V$cleanVersion.apk" -ForegroundColor Yellow

# 2. Execute Flutter compilation
Write-Host "Compiling release APK via Flutter..." -ForegroundColor Cyan
D:\flutter\bin\flutter.bat build apk --release

# 3. Verify standard build output
$defaultApkPath = Join-Path $PSScriptRoot "build\app\outputs\flutter-apk\app-release.apk"
if (-not (Test-Path $defaultApkPath)) {
    Write-Host "[ERROR] Flutter build did not generate app-release.apk!" -ForegroundColor Red
    exit 1
}

# 4. Copy and custom rename
$targetApkName = "MediaHive_V$cleanVersion.apk"
$targetApkPath = Join-Path $PSScriptRoot "build\app\outputs\flutter-apk\$targetApkName"
$parentDir = Split-Path $PSScriptRoot -Parent
$rootApkPath = Join-Path $parentDir $targetApkName

# Remove existing file if present to overwrite cleanly
if (Test-Path $targetApkPath) {
    Remove-Item $targetApkPath -Force
}
if (Test-Path $rootApkPath) {
    Remove-Item $rootApkPath -Force
}

Copy-Item $defaultApkPath $targetApkPath -Force
Copy-Item $defaultApkPath $rootApkPath -Force

if (Test-Path $rootApkPath) {
    Write-Host "[SUCCESS] APK successfully built, renamed, and copied to root!" -ForegroundColor Green
    Write-Host "Output Path: $rootApkPath" -ForegroundColor Green
    Write-Host "File Size: $([Math]::Round((Get-Item $rootApkPath).Length / 1MB, 2)) MB" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Failed to copy and rename the built APK file!" -ForegroundColor Red
    exit 1
}
