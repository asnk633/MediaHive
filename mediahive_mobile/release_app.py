import os
import re
import json
import shutil
import subprocess
import urllib.request
import urllib.error

# ─── CONFIGURATION ────────────────────────────────────────────────────────────
REPO = "asnk633/MediaHive"

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PUBSPEC_PATH = os.path.join(BASE_DIR, "pubspec.yaml")
ENV_PATH = os.path.join(BASE_DIR, ".env")
PARENT_ENV_PATH = os.path.join(os.path.dirname(BASE_DIR), ".env.local")

# Load environment variables
def load_env(path):
    env = {}
    if os.path.exists(path):
        with open(path, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    env[k.strip()] = v.strip().strip('"').strip("'")
    return env

local_env = load_env(ENV_PATH)
parent_env = load_env(PARENT_ENV_PATH)

GITHUB_TOKEN = local_env.get("GITHUB_TOKEN") or parent_env.get("GITHUB_TOKEN") or os.environ.get("GITHUB_TOKEN")
SUPABASE_SERVICE_KEY = parent_env.get("SUPABASE_SERVICE_ROLE_KEY")

if not GITHUB_TOKEN:
    print("[ERROR] GITHUB_TOKEN not found in .env, ../.env.local or environment!")
    print("Please add GITHUB_TOKEN=<your_github_token> to your .env file to enable release publishing.")
    exit(1)

if not SUPABASE_SERVICE_KEY:
    print("[WARNING] SUPABASE_SERVICE_ROLE_KEY not found in ../.env.local. Supabase sync will be skipped.")

# ─── 1. PARSE VERSION ─────────────────────────────────────────────────────────
if not os.path.exists(PUBSPEC_PATH):
    print(f"[ERROR] pubspec.yaml not found at {PUBSPEC_PATH}!")
    exit(1)

with open(PUBSPEC_PATH, "r") as f:
    pubspec_content = f.read()

version_match = re.search(r"^version:\s*([^\s]+)", pubspec_content, re.MULTILINE)
if not version_match:
    print("[ERROR] Could not parse version from pubspec.yaml!")
    exit(1)

raw_version = version_match.group(1)
clean_version = raw_version.replace("+", "_")
tag_name = f"v{raw_version.replace('+', '-')}"

print(f"[MediaHive] Target Release: {tag_name}")
print(f"[MediaHive] Target APK Name: MediaHive_V{clean_version}.apk")

# ─── 2. BUILD OPTIMIZED SPLIT APK ─────────────────────────────────────────────
print("\n[MediaHive] Compiling optimized split APKs via Flutter...")
try:
    # Run the compile process
    subprocess.run(["D:\\flutter\\bin\\flutter.bat", "build", "apk", "--release", "--split-per-abi"], check=True)
except Exception as e:
    print("[ERROR] Flutter compilation failed:", e)
    exit(1)

source_apk = os.path.join(BASE_DIR, "build", "app", "outputs", "flutter-apk", "app-arm64-v8a-release.apk")
target_apk_name = f"MediaHive_V{clean_version}.apk"
target_apk_path = os.path.join(os.path.dirname(BASE_DIR), target_apk_name)

if not os.path.exists(source_apk):
    print(f"[ERROR] Optimized arm64 APK not found at {source_apk}!")
    exit(1)

# Copy to root directory
shutil.copyfile(source_apk, target_apk_path)

# Copy to public directory for Vercel hosting
public_dir = os.path.join(os.path.dirname(BASE_DIR), "public")
public_apk_path = os.path.join(public_dir, target_apk_name)
if os.path.exists(public_dir):
    shutil.copyfile(source_apk, public_apk_path)
    print(f"[SUCCESS] Copied APK to public folder: {public_apk_path}")
else:
    print(f"[WARNING] Public directory not found at {public_dir}, skipped copying to public.")

print(f"[SUCCESS] Compiled optimized APK: {target_apk_path} ({os.path.getsize(target_apk_path) / 1024 / 1024:.2f} MB)")

# ─── 3. PUBLISH TO GITHUB RELEASES (WITH ROBUST FALLBACK) ──────────────────────
asset_download_url = f"https://thaiba-garden-media-manager.vercel.app/{target_apk_name}"
github_success = False

try:
    github_headers = {
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28"
    }

    # Create Release
    print(f"\n[GitHub] Creating release {tag_name}...")
    release_payload = {
        "tag_name": tag_name,
        "target_commitish": "main",
        "name": f"MediaHive Release {tag_name}",
        "body": f"• Operational Flow optimization\n• Auto-generated split-architecture release build.\n• Contains performance improvements and bug fixes.",
        "draft": False,
        "prerelease": "beta" in tag_name.lower()
    }

    req_data = json.dumps(release_payload).encode('utf-8')
    req = urllib.request.Request(
        f"https://api.github.com/repos/{REPO}/releases",
        data=req_data,
        headers={"Content-Type": "application/json", **github_headers},
        method="POST"
    )

    release_id = None
    try:
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read().decode())
            release_id = res["id"]
            html_url = res["html_url"]
            print(f"[SUCCESS] Created GitHub Release: {html_url}")
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        if e.code == 422 and "already_exists" in error_body:
            print("[GitHub] Release already exists. Fetching existing release...")
            req = urllib.request.Request(
                f"https://api.github.com/repos/{REPO}/releases/tags/{tag_name}",
                headers=github_headers
            )
            try:
                with urllib.request.urlopen(req) as response:
                    res = json.loads(response.read().decode())
                    release_id = res["id"]
            except Exception as ex:
                print("[ERROR] Failed to fetch existing release:", ex)
        else:
            print("[ERROR] Failed to create release:", e.code, error_body)

    if release_id:
        # Upload APK asset
        print(f"[GitHub] Uploading {target_apk_name} as release asset...")
        with open(target_apk_path, "rb") as f:
            apk_bytes = f.read()

        upload_headers = {
            **github_headers,
            "Content-Type": "application/vnd.android.package-archive",
            "Content-Length": str(len(apk_bytes))
        }

        # Construct upload URL
        upload_url = f"https://uploads.github.com/repos/{REPO}/releases/{release_id}/assets?name={target_apk_name}"
        req = urllib.request.Request(upload_url, data=apk_bytes, headers=upload_headers, method="POST")

        try:
            with urllib.request.urlopen(req) as response:
                res = json.loads(response.read().decode())
                asset_download_url = res["browser_download_url"]
                github_success = True
                print(f"[SUCCESS] Uploaded asset to GitHub: {asset_download_url}")
        except urllib.error.HTTPError as e:
            error_body = e.read().decode()
            if e.code == 422 and "already_exists" in error_body:
                print("[GitHub] Asset already exists. Fetching asset URL...")
                # Get assets list and find matching asset
                req = urllib.request.Request(f"https://api.github.com/repos/{REPO}/releases/{release_id}/assets", headers=github_headers)
                with urllib.request.urlopen(req) as response:
                    assets = json.loads(response.read().decode())
                    for asset in assets:
                        if asset["name"] == target_apk_name:
                            asset_download_url = asset["browser_download_url"]
                            github_success = True
                            print(f"[SUCCESS] Re-used existing asset URL: {asset_download_url}")
                            break
            else:
                print("[ERROR] Failed to upload asset:", e.code, error_body)

        if github_success:
            # ─── 4. AUTOMATED OLD RELEASES CLEANUP (KEEP ONLY LATEST 2) ───────────────
            print("\n[GitHub] Cleaning up old releases (Keeping only the latest 2 versions)...")
            req = urllib.request.Request(f"https://api.github.com/repos/{REPO}/releases", headers=github_headers)
            try:
                with urllib.request.urlopen(req) as response:
                    releases = json.loads(response.read().decode())
                    releases.sort(key=lambda r: r["created_at"], reverse=True)
                    
                    print(f"Current total releases on GitHub: {len(releases)}")
                    if len(releases) > 2:
                        to_delete = releases[2:]
                        print(f"Releases to delete: {[r['tag_name'] for r in to_delete]}")
                        
                        for rel in to_delete:
                            del_id = rel["id"]
                            del_tag = rel["tag_name"]
                            
                            # Delete Release
                            print(f"[GitHub] Deleting old release {del_tag}...")
                            del_req = urllib.request.Request(
                                f"https://api.github.com/repos/{REPO}/releases/{del_id}",
                                headers=github_headers,
                                method="DELETE"
                            )
                            with urllib.request.urlopen(del_req) as _:
                                print(f"[SUCCESS] Deleted release {del_tag}")
                            
                            # Delete Git Tag
                            print(f"[GitHub] Deleting remote git tag {del_tag}...")
                            tag_req = urllib.request.Request(
                                f"https://api.github.com/repos/{REPO}/git/refs/tags/{del_tag}",
                                headers=github_headers,
                                method="DELETE"
                            )
                            try:
                                with urllib.request.urlopen(tag_req) as _:
                                    print(f"[SUCCESS] Deleted remote tag {del_tag}")
                            except Exception as ex:
                                print(f"[WARNING] Failed to delete remote tag {del_tag}: {ex}")
                    else:
                        print("No old releases to delete. Keeping all current releases.")
            except Exception as e:
                print("[WARNING] Failed during releases cleanup:", e)

except Exception as global_gh_err:
    print(f"\n[WARNING] GitHub release publication failed: {global_gh_err}")
    print(f"Falling back to Vercel hosted direct URL: {asset_download_url}")

# ─── 5. UPDATE SUPABASE SYSTEM_CONFIG ─────────────────────────────────────────
if SUPABASE_SERVICE_KEY and asset_download_url:
    print("\n[Supabase] Syncing new release configurations...")
    supabase_headers = {
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "apikey": SUPABASE_SERVICE_KEY,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
    }
    
    payload = [
        {"key": "app_latest_version", "value": raw_version},
        {"key": "app_download_url", "value": asset_download_url}
    ]
    
    req_data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        "https://fcctcorycpvebupluzpe.supabase.co/rest/v1/system_config",
        data=req_data,
        headers=supabase_headers,
        method="POST"
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            print("[SUCCESS] Successfully updated system_config table in Supabase!")
            print(f"Latest Version: {raw_version}")
            print(f"Download Link: {asset_download_url}")
    except Exception as e:
        print("[ERROR] Failed to update Supabase system_config:", e)
else:
    print("\n[Supabase] Skipping sync due to missing configuration keys.")
