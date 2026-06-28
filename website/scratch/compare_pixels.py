import os
from PIL import Image

dist_file = 'dist/logo-sequence/comp/main_00102.png'
public_file = 'public/logo-sequence/comp/main_00102.png'

if os.path.exists(dist_file) and os.path.exists(public_file):
    d_img = Image.open(dist_file).convert('RGBA')
    p_img = Image.open(public_file).convert('RGBA')
    
    print(f"Dist size: {os.path.getsize(dist_file)} bytes")
    print(f"Public size: {os.path.getsize(public_file)} bytes")
    
    # Check if they have the same pixel data
    d_pixels = list(d_img.getdata())
    p_pixels = list(p_img.getdata())
    
    identical = d_pixels == p_pixels
    print(f"Pixel-by-pixel identical: {identical}")
    
    # Check a few coordinates
    cx = d_img.width // 2
    cy = d_img.height // 2
    
    # Print alphas at Y=0, Y=10, Y=50
    for y in [0, 10, 50, 100, 200, cy]:
        d_a = d_img.split()[3].getpixel((cx, y))
        p_a = p_img.split()[3].getpixel((cx, y))
        print(f"y={y:4d} | Dist Alpha: {d_a:3d} | Public Alpha: {p_a:3d}")
else:
    print("Files do not exist.")
