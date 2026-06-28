import os
import math
import time
import argparse
from PIL import Image, ImageChops

def create_feather_mask(width, height, r_inner, r_outer):
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
                factor = factor * factor * (3 - 2 * factor) # smoothstep
                
            pixels[x, y] = int(255 * factor)
            
    return mask

def main():
    parser = argparse.ArgumentParser(description="Feather the edges of the logo sequence PNG frames.")
    parser.add_argument("--inner", type=float, default=0.75, help="Normalized inner radius (0.0 to 1.0) where feathering begins. Solid logo is within 0.72.")
    parser.add_argument("--outer", type=float, default=0.95, help="Normalized outer radius (0.0 to 1.0) where image becomes fully transparent.")
    parser.add_argument("--dir", type=str, default="public/logo-sequence/comp", help="Directory containing the PNG frames.")
    parser.add_argument("--dry-run", action="store_true", help="Print expected boundary alpha values without saving any files.")
    
    args = parser.parse_args()
    
    comp_dir = args.dir
    files = sorted([f for f in os.listdir(comp_dir) if f.startswith('main_') and f.endswith('.png')])
    
    if not files:
        print(f"Error: No logo sequence frames found in '{comp_dir}'.")
        return
        
    print(f"Found {len(files)} frames in '{comp_dir}'.")
    
    # Load first image to get dimensions
    first_img_path = os.path.join(comp_dir, files[0])
    first_img = Image.open(first_img_path)
    width, height = first_img.size
    print(f"Dimensions: {width}x{height}")
    print(f"Feathering parameters: inner={args.inner}, outer={args.outer}")
    
    # Generate mask
    mask = create_feather_mask(width, height, args.inner, args.outer)
    
    # Print sample alpha values at center column
    print("\nSample alpha values at center column (x=960) before/after processing:")
    cx = width // 2
    test_img = Image.open(os.path.join(comp_dir, files[len(files)//2])).convert('RGBA')
    orig_a = test_img.split()[3]
    new_a = ImageChops.multiply(orig_a, mask)
    for y in [0, 10, 50, 100, 200, height // 2]:
        print(f"  y={y:4d} | Before: {orig_a.getpixel((cx, y)):3d} | After: {new_a.getpixel((cx, y)):3d}")
        
    if args.dry_run:
        print("\n[Dry-run] No changes saved.")
        return
        
    # Process all frames
    print("\nProcessing frames...")
    start_time = time.time()
    processed_count = 0
    for file_name in files:
        file_path = os.path.join(comp_dir, file_name)
        img = Image.open(file_path).convert('RGBA')
        
        r_ch, g_ch, b_ch, a_ch = img.split()
        new_a_ch = ImageChops.multiply(a_ch, mask)
        
        feathered_img = Image.merge('RGBA', (r_ch, g_ch, b_ch, new_a_ch))
        feathered_img.save(file_path, 'PNG')
        
        processed_count += 1
        if processed_count % 20 == 0 or processed_count == len(files):
            print(f"  Processed {processed_count}/{len(files)} frames...")
            
    duration = time.time() - start_time
    print(f"\nSuccess: Processed {processed_count} frames in {duration:.2f} seconds!")

if __name__ == '__main__':
    main()
