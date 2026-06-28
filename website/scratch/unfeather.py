import os
import math
from PIL import Image

def unfeather_frame(img_path, out_path, r_inner=0.4, r_outer=0.9):
    img = Image.open(img_path).convert('RGBA')
    width, height = img.size
    cx, cy = width / 2, height / 2
    
    r_ch, g_ch, b_ch, a_ch = img.split()
    a_pixels = a_ch.load()
    
    new_a = Image.new('L', (width, height))
    new_a_pixels = new_a.load()
    
    for y in range(height):
        dy = (y - cy) / cy
        for x in range(width):
            dx = (x - cx) / cx
            r = math.sqrt(dx*dx + dy*dy)
            
            # Reconstruct factor
            if r < r_inner:
                factor = 1.0
            elif r > r_outer:
                factor = 0.0
            else:
                t = (r_outer - r) / (r_outer - r_inner)
                factor = t * t * (3 - 2 * t)
                
            feathered_alpha = a_pixels[x, y]
            
            if factor > 0.05:
                # Divide by factor to restore original alpha
                orig_alpha = min(255, int(feathered_alpha / factor))
            else:
                # For the outer edges where factor is near 0,
                # we extrapolate: since alpha at r=0.9 is around 100,
                # and at r=1.0 is around 79, we can linearly interpolate
                # between 100 (at r=0.9) and 79 (at r=1.0)
                if r <= 1.0:
                    extrapolated = 100 - (100 - 79) * ((r - 0.9) / 0.1)
                    orig_alpha = max(0, min(255, int(extrapolated)))
                else:
                    orig_alpha = 79 # fallback for corners
                    
            new_a_pixels[x, y] = orig_alpha
            
    restored_img = Image.merge('RGBA', (r_ch, g_ch, b_ch, new_a))
    restored_img.save(out_path, 'PNG')
    print(f"Restored original alpha to {out_path}")

unfeather_frame('public/logo-sequence/comp/main_00102.png', 'public/logo-sequence/comp/main_00102_unfeathered.png')
