import os
import math
import time
from PIL import Image

def unfeather_frame(file_path, r_inner=0.4, r_outer=0.9):
    img = Image.open(file_path).convert('RGBA')
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
                orig_alpha = min(255, int(feathered_alpha / factor))
            else:
                # Extrapolate outer edges
                if r <= 1.0:
                    extrapolated = 100 - (100 - 79) * ((r - 0.9) / 0.1)
                    orig_alpha = max(0, min(255, int(extrapolated)))
                else:
                    orig_alpha = 79
                    
            new_a_pixels[x, y] = orig_alpha
            
    restored_img = Image.merge('RGBA', (r_ch, g_ch, b_ch, new_a))
    restored_img.save(file_path, 'PNG')

def main():
    comp_dir = 'public/logo-sequence/comp'
    files = sorted([f for f in os.listdir(comp_dir) if f.startswith('main_') and f.endswith('.png')])
    
    print(f"Restoring {len(files)} files to original unfeathered state...")
    
    start_time = time.time()
    processed_count = 0
    for file_name in files:
        file_path = os.path.join(comp_dir, file_name)
        unfeather_frame(file_path)
        processed_count += 1
        if processed_count % 20 == 0 or processed_count == len(files):
            print(f"  Restored {processed_count}/{len(files)} frames...")
            
    duration = time.time() - start_time
    print(f"Success: Restored all {processed_count} frames in {duration:.2f} seconds!")

if __name__ == '__main__':
    main()
