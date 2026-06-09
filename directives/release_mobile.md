# Mobile App Release & Telemetry Lock Directive

Follow these procedures and constraints strictly when releasing new updates for the MediaHive mobile application, or when modifying the backend APIs.

---

## Part 1: Mobile App Release & Push Update Process

To trigger the in-app update banner on real phones and distribute a new APK:

### 1. Version Bump
* Open `mediahive_mobile/pubspec.yaml`.
* Bump the build number (and optionally the version string) in the `version` field (e.g., from `1.1.4-beta+10048` to `1.1.4-beta+12048`). The build number (after the `+`) **MUST** be strictly greater than the previous version.

### 2. Compilation (Production Flavor)
* Compile the application using the production flavor so that the mobile app targets the live production Next.js backend (`https://thaiba-garden-media-manager.vercel.app`) instead of `localhost`.
* The release script does this via:
  ```powershell
  flutter build apk --release --split-per-abi --dart-define=FLAVOR=production
  ```

### 3. Release Publication to GitHub
* Run the release automation script `python release_app.py` in `mediahive_mobile/` directory.
* The script compiles the split APK, copies `app-arm64-v8a-release.apk` to the parent folder and `public/` folder, and creates/publishes a GitHub Release under tag `v<version-string>-<build-number>`.
* **Important**: Ensure `GITHUB_TOKEN` is present in `d:\MediaHive App\.env.local` to authorize release publishing.

### 4. Database Sync
* If the release script is run in an environment lacking the direct `SUPABASE_SERVICE_ROLE_KEY` to update the DB automatically:
  * Extract the **GitHub Release Download URL** of the uploaded APK asset.
  * Manually run the following SQL update query in the Supabase instance to notify live clients:
    ```sql
    update system_config set value = '<new_version_string_with_build>' where key = 'app_latest_version';
    update system_config set value = '<github_release_download_url>' where key = 'app_download_url';
    ```
  * Example:
    ```sql
    update system_config set value = '1.1.4-beta+12048' where key = 'app_latest_version';
    update system_config set value = 'https://github.com/asnk633/MediaHive/releases/download/v1.1.4-beta-12048/MediaHive_V1.1.4-beta_12048.apk' where key = 'app_download_url';
    ```

---

## Part 2: CRITICAL - Log & Telemetry Sharing Feature Lock

> [!IMPORTANT]
> The Log and Telemetry sharing subsystem is **LOCKED**. Never touch, remove, or modify this code during future refactoring, feature developments, or UI polishes.

### 1. Mobile Upload Provider Logic ([chat_providers.dart](file:///d:/MediaHive%20App/mediahive_mobile/lib/features/chat/presentation/providers/chat_providers.dart))
* **MIME Whitelisting**: `.txt` and `.log` extensions **MUST** map to `text/plain` (`MediaType('text', 'plain')`) to bypass API upload constraints.
* **Token Attachment**: The `uploadChatFile` method **MUST** retrieve the current user's session token and pass it inside the `Authorization` header on both the primary local upload request and the live production proxy failover upload request:
  ```dart
  final client = _ref.read(supabaseClientProvider);
  final token = client.auth.currentSession?.accessToken;
  final Map<String, String> headers = {};
  if (token != null) {
    headers['Authorization'] = 'Bearer $token';
  }
  // Passed to Dio options: Options(headers: headers, ...)
  ```

### 2. Backend Route Handling ([route.ts](file:///d:/MediaHive%20App/src/app/api/chat/upload/route.ts))
* **User-Scoped Supabase Client**: The `/api/chat/upload` endpoint **MUST** extract the `Authorization` header bearer token. If a token is provided, it must instantiate a user-scoped Supabase client using that token to execute the upload:
  ```typescript
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
  // If token is present, initialize client using createClient with token in global headers.
  ```
* This handles fallback uploads to Supabase Storage seamlessly without triggering RLS violations when administrative credentials (`GOOGLE_SERVICE_ACCOUNT_EMAIL` or `SUPABASE_SERVICE_ROLE_KEY`) are missing on hosting platforms like Vercel.

---

