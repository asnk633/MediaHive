import os
from PIL import Image

comp_dir = 'public/logo-sequence/comp'
files = sorted([f for f in os.listdir(comp_dir) if f.endswith('.png')])

if files:
    first_file = os.path.join(comp_dir, files[0])
    img = Image.open(first_file)
    print(f"Total files: {len(files)}")
    print(f"First file: {files[0]}")
    print(f"Format: {img.format}")
    print(f"Size: {img.size}")
    print(f"Mode: {img.mode}")
else:
    print("No PNG files found in the directory.")
