import shutil
import os

original = "public/models/iphone_16_pro_max.glb"
backup = "public/models/iphone_16_pro_max_original.glb"
new_model = "scratch/pizza_iphone.glb"

if os.path.exists(original) and not os.path.exists(backup):
    print(f"Backing up {original} to {backup}...")
    shutil.copy2(original, backup)
else:
    print(f"Backup already exists or original not found.")

if os.path.exists(new_model):
    print(f"Replacing {original} with {new_model}...")
    shutil.copy2(new_model, original)
    print("Done.")
else:
    print(f"New model not found: {new_model}")
