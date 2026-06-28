import os
import math
from PIL import Image

def apply_elliptical_feather(image_path, out_path, r_inner=0.4, r_outer=0.9):
    img = Image.open(image_path)
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
        
    width, height = img.size
    cx, cy = width / 2, height / 2
    
    # Create the alpha mask as a grayscale image (mode L)
    mask = Image.new('L', (width, height), 255)
    pixels = mask.load()
    
    # We want to multiply the existing alpha channel with our new feather mask
    orig_alpha = img.split()[3]
    orig_pixels = orig_alpha.load()
    
    for y in range(height):
        dy = (y - cy) / cy  # normalize vertical distance to [-1, 1]
        for x in range(width):
            dx = (x - cx) / cx  # normalize horizontal distance to [-1, 1]
            
            # Calculate elliptical radius
            r = math.sqrt(dx*dx + dy*dy)
            
            if r < r_inner:
                factor = 1.0
            elif r > r_outer:
                factor = 0.0
            else:
                # Linear interpolation between inner and outer radius
                factor = (r_outer - r) / (r_outer - r_inner)
                # Smoothstep interpolation for smoother transitions
                factor = factor * factor * (3 - 2 * factor)
                
            # New alpha is original alpha * factor
            current_alpha = orig_pixels[x, y]
            new_alpha = int(current_alpha * factor)
            pixels[x, y] = new_alpha
            
    # Reassemble the image with the new alpha channel
    r_ch, g_ch, b_ch, _ = img.split()
    feathered_img = Image.merge('RGBA', (r_ch, g_ch, b_ch, mask))
    feathered_img.save(out_path, 'PNG')
    print(f"Saved test feathered image to {out_path}")

comp_dir = 'public/logo-sequence/comp'
files = sorted([f for f in os.listdir(comp_dir) if f.endswith('.png')])
if files:
    test_file = os.path.join(comp_dir, files[100]) # use a middle frame where logo is fully visible
    apply_elliptical_feather(test_file, 'public/logo-sequence/comp/test_feathered_frame.png', r_inner=0.75, r_outer=0.95)
else:
    print("No PNG files found.")
