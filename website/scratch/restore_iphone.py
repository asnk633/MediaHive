import shutil
import os

original = "public/models/iphone_16_pro_max.glb"
backup = "public/models/iphone_16_pro_max_original.glb"

if os.path.exists(backup):
    print(f"Restoring {backup} to {original}...")
    shutil.copy2(backup, original)
    print("Restore completed successfully.")
else:
    print(f"Backup not found: {backup}")
