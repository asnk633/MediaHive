import os
import time

now = time.time()
one_day = 24 * 3600
five_days = 5 * 24 * 3600

print("Files modified in the last 5 days:")
for root, dirs, files in os.walk('.'):
    # Skip build, node_modules, .git, .next
    if any(p in root for p in ['build', 'node_modules', '.git', '.next']):
        continue
    for f in files:
        if f.lower().endswith(('.png', '.jpg', '.jpeg', '.ico', '.svg', '.glb')):
            path = os.path.join(root, f)
            try:
                mtime = os.path.getmtime(path)
                if now - mtime < five_days:
                    age_hours = (now - mtime) / 3600
                    print(f"{path} - Modified {age_hours:.1f} hours ago ({os.path.getsize(path)} bytes)")
            except Exception as e:
                pass
