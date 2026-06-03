"""
One-shot script: uploads the latest APK to Supabase Storage (public bucket 'releases')
and updates system_config.app_download_url to the Supabase Storage URL.
"""

import os
import sys
import json
import urllib.request
import urllib.error

# ── Config ────────────────────────────────────────────────────────────────────
SUPABASE_URL   = "https://fcctcorycpvebupluzpe.supabase.co"
BUCKET         = "releases"

BASE_DIR       = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR     = os.path.dirname(BASE_DIR)
PARENT_ENV     = os.path.join(PARENT_DIR, ".env.local")

def load_env(path):
    env = {}
    if os.path.exists(path):
        with open(path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    env[k.strip()] = v.strip().strip('"').strip("'")
    return env

env = load_env(PARENT_ENV)
SERVICE_KEY = env.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SERVICE_KEY:
    print("[ERROR] SUPABASE_SERVICE_ROLE_KEY not found in ../.env.local")
    sys.exit(1)

HEADERS = {
    "Authorization": f"Bearer {SERVICE_KEY}",
    "apikey": SERVICE_KEY,
}

# ── Find latest APK ───────────────────────────────────────────────────────────
APK_NAME = sys.argv[1] if len(sys.argv) > 1 else None
if not APK_NAME:
    # Auto-detect: largest build-number APK in public/
    public_dir = os.path.join(PARENT_DIR, "public")
    apks = sorted(
        [f for f in os.listdir(public_dir) if f.endswith(".apk")],
        reverse=True
    )
    if not apks:
        print("[ERROR] No APKs found in public/")
        sys.exit(1)
    APK_NAME = apks[0]
    APK_PATH = os.path.join(public_dir, APK_NAME)
else:
    APK_PATH = os.path.join(PARENT_DIR, "public", APK_NAME)

if not os.path.exists(APK_PATH):
    print(f"[ERROR] APK not found: {APK_PATH}")
    sys.exit(1)

print(f"[INFO] APK to upload: {APK_NAME} ({os.path.getsize(APK_PATH)/1024/1024:.1f} MB)")

# ── Ensure bucket exists (create if missing) ──────────────────────────────────
def ensure_bucket():
    # Check existing
    req = urllib.request.Request(
        f"{SUPABASE_URL}/storage/v1/bucket",
        headers=HEADERS
    )
    with urllib.request.urlopen(req) as r:
        buckets = json.loads(r.read())
    if any(b["id"] == BUCKET for b in buckets):
        print(f"[INFO] Bucket '{BUCKET}' already exists.")
        return
    # Create
    body = json.dumps({"id": BUCKET, "name": BUCKET, "public": True}).encode()
    req = urllib.request.Request(
        f"{SUPABASE_URL}/storage/v1/bucket",
        data=body,
        headers={**HEADERS, "Content-Type": "application/json"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req) as r:
            print(f"[SUCCESS] Created bucket '{BUCKET}'.")
    except urllib.error.HTTPError as e:
        print(f"[WARNING] Bucket creation returned {e.code}: {e.read().decode()}")

ensure_bucket()

# ── Upload APK ────────────────────────────────────────────────────────────────
print(f"[INFO] Uploading to Supabase Storage bucket '{BUCKET}'...")

with open(APK_PATH, "rb") as f:
    apk_bytes = f.read()

upload_url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{APK_NAME}"

# Try PUT first (upsert), fall back to POST
for method in ["PUT", "POST"]:
    req = urllib.request.Request(
        upload_url,
        data=apk_bytes,
        headers={
            **HEADERS,
            "Content-Type": "application/vnd.android.package-archive",
            "x-upsert": "true",
        },
        method=method
    )
    try:
        with urllib.request.urlopen(req) as r:
            res = json.loads(r.read())
            print(f"[SUCCESS] Uploaded via {method}: {res}")
            break
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"[INFO] {method} returned {e.code}: {body}")
        if method == "POST":
            print("[ERROR] Upload failed.")
            sys.exit(1)

# ── Build public URL ──────────────────────────────────────────────────────────
public_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{APK_NAME}"
print(f"[INFO] Public URL: {public_url}")

# ── Update system_config ──────────────────────────────────────────────────────
print("[INFO] Updating system_config.app_download_url...")

payload = json.dumps([
    {"key": "app_download_url", "value": public_url}
]).encode()

req = urllib.request.Request(
    f"{SUPABASE_URL}/rest/v1/system_config",
    data=payload,
    headers={
        **HEADERS,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
    },
    method="POST"
)
try:
    with urllib.request.urlopen(req) as r:
        print("[SUCCESS] system_config updated!")
        print(f"          app_download_url = {public_url}")
except urllib.error.HTTPError as e:
    print(f"[ERROR] Failed to update system_config: {e.code} {e.read().decode()}")
    sys.exit(1)
