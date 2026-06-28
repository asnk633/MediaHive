import os
from PIL import Image

def reconstruct_alpha(img_path, out_path):
    img = Image.open(img_path).convert('RGB')
    width, height = img.size
    
    # Create new RGBA image
    new_img = Image.new('RGBA', (width, height))
    pixels = img.load()
    new_pixels = new_img.load()
    
    for y in range(height):
        for x in range(width):
            r, g, b = pixels[x, y]
            
            # Use max of R, G, B as alpha
            alpha = max(r, g, b)
            
            if alpha > 0:
                # Reconstruct original color: color / (alpha/255)
                # to prevent darkening of semi-transparent pixels
                factor = alpha / 255.0
                new_r = min(255, int(r / factor))
                new_g = min(255, int(g / factor))
                new_b = min(255, int(b / factor))
                new_pixels[x, y] = (new_r, new_g, new_b, alpha)
            else:
                new_pixels[x, y] = (0, 0, 0, 0)
                
    new_img.save(out_path, 'PNG')
    print(f"Reconstructed transparent frame saved to {out_path}")

reconstruct_alpha('public/logo-sequence/restore_test/main_00102.png', 'public/logo-sequence/restore_test/main_00102_reconstructed.png')
