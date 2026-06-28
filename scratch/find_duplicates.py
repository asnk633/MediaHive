import os
import hashlib

# Walk through the directories and find all PNG files
all_pngs = []
for root, dirs, files in os.walk('.'):
    # Skip build, node_modules, .git, .next
    if any(p in root for p in ['build', 'node_modules', '.git', '.next']):
        continue
    for f in files:
        if f.lower().endswith('.png'):
            all_pngs.append(os.path.join(root, f))

# Compute hash for each PNG
hash_to_paths = {}
for path in all_pngs:
    try:
        with open(path, "rb") as fh:
            h = hashlib.sha256(fh.read()).hexdigest()
            hash_to_paths.setdefault(h, []).append(path)
    except Exception as e:
        pass

# Group and print duplicates
print("=== DUPLICATE LOGO ASSETS IN PROJECT ===")
for h, paths in hash_to_paths.items():
    if len(paths) > 1 or any("logo" in p.lower() or "brand" in p.lower() or "icon" in p.lower() for p in paths):
        print(f"Hash: {h[:10]}... ({os.path.getsize(paths[0])} bytes)")
        for p in paths:
            print(f"  - {p}")
        print()
