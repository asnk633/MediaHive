import os
from PIL import Image

restore_file = 'public/logo-sequence/restore_test/main_00102.png'

if os.path.exists(restore_file):
    img = Image.open(restore_file).convert('RGBA')
    print(f"Restore File Size: {os.path.getsize(restore_file)} bytes")
    print(f"Dimensions: {img.width}x{img.height}")
    
    alpha = img.split()[3]
    cx = img.width // 2
    cy = img.height // 2
    
    print("Alpha values of extracted WebM frame:")
    for y in [0, 10, 50, 100, 200, cy]:
        print(f"y={y:4d} | Alpha: {alpha.getpixel((cx, y)):3d}")
else:
    print("Restore file does not exist.")
