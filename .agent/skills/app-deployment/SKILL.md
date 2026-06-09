---
name: app-deployment
description: Publishes and deploys a new version of the mobile app (APK), increments the version, and updates Supabase config.
---

# Mobile App Deployment & Release Skill

This skill details how to compile, publish, and trigger in-app updates for the MediaHive Mobile application.

## When to use this skill
Use this skill when requested to:
- Publish new changes to the mobile app.
- Update the mobile APK to a new version.
- Ensure the in-app update badge triggers and downloads correctly on user devices.

## Step-by-Step Release Workflow

### 1. Increment Version
Open [pubspec.yaml](file:///d:/MediaHive%20App/mediahive_mobile/pubspec.yaml) and locate the `version:` line:
```yaml
version: 1.1.4-beta+10047
```
Increment either the build number (after the `+`) or the minor version.

### 2. Run the Release Orchestrator
Execute the Layer 3 release python script:
```powershell
python "d:\MediaHive App\mediahive_mobile\release_app.py"
```
This script compiles the production APK, pushes it to GitHub Releases, and registers the download URL in the Supabase database.

### 3. Verify Supabase Config Sync
Verify that the `system_config` table contains the new version number to ensure the in-app update triggers:
```sql
select * from system_config where key in ('app_latest_version', 'app_download_url');
```

---

## Critical Safeguards & Common Gotchas

### 1. Production Flavor Definition
Ensure the Flutter release build is compiled with the `--dart-define=FLAVOR=production` flag in `release_app.py`:
```powershell
flutter build apk --release --split-per-abi --dart-define=FLAVOR=production
```
Without this definition, the app defaults to the `development` environment configuration, making all API calls try to connect to `localhost:3000` (which fails on real devices).

### 2. GitHub Release Cleanup Safeguard
The release script cleans up old releases and keeps only the latest. To prevent the newly created release from being accidentally deleted (leading to 404 download errors):
- Always filter out the current release by `tag_name` from the `releases` list fetched from the GitHub API *before* running any sort or slice/delete logic.

### 3. Allowed MIME Types (Log Sharing)
The Next.js proxy upload router `/api/chat/upload` validates file uploads against a whitelist. 
- Ensure telemetry text/log files (`.txt`, `.log`) are mapped to `text/plain` (instead of the generic `application/octet-stream`) in `chat_providers.dart` so they pass backend validation.
- PDFs must map to `application/pdf` and CSVs to `text/csv`.
