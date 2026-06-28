import os
import math
from PIL import Image, ImageChops

def create_feather_mask(width, height, r_inner=0.75, r_outer=0.95):
    cx, cy = width / 2, height / 2
    mask = Image.new('L', (width, height), 255)
    pixels = mask.load()
    
    for y in range(height):
        dy = (y - cy) / cy
        for x in range(width):
            dx = (x - cx) / cx
            r = math.sqrt(dx*dx + dy*dy)
            
            if r < r_inner:
                factor = 1.0
            elif r > r_outer:
                factor = 0.0
            else:
                factor = (r_outer - r) / (r_outer - r_inner)
                factor = factor * factor * (3 - 2 * factor)
                
            pixels[x, y] = int(255 * factor)
            
    return mask

# Load frame
img = Image.open('public/logo-sequence/comp/main_00102.png').convert('RGBA')
width, height = img.size

# Create mask
mask = create_feather_mask(width, height)

# Multiply alpha channel
r_ch, g_ch, b_ch, a_ch = img.split()
new_a_ch = ImageChops.multiply(a_ch, mask)

# Compare values at center column
cx = width // 2
for y in [0, 10, 50, 100, 200, height // 2]:
    print(f"y={y:4d} | Chops Alpha: {new_a_ch.getpixel((cx, y)):3d}")
