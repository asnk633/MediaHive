from PIL import Image
import math
import os

def turn_outer_gold_to_transparent(image_path, output_path):
    img = Image.open(image_path).convert("RGBA")
    width, height = img.size
    pixels = img.load()
    
    center_x, center_y = width // 2, height // 2
    max_radius = min(center_x, center_y)
    
    # Target the outer hexagon frame
    threshold_radius = max_radius * 0.85 
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            
            if a < 10:
                continue
                
            is_gold = r > 180 and g > 140 and b < 120
            
            if is_gold:
                dist = math.sqrt((x - center_x)**2 + (y - center_y)**2)
                if dist > threshold_radius:
                    # Make it transparent!
                    pixels[x, y] = (0, 0, 0, 0)
                    
    img.save(output_path)
    print(f"Successfully processed icon (transparent border) and saved to {output_path}")

if __name__ == "__main__":
    # Restore original first (or just process the current one if it was white)
    # Actually, I'll just re-process the app_icon.png
    target_path = r"d:\MediaHive App\mediahive_mobile\assets\images\app_icon.png"
    turn_outer_gold_to_transparent(target_path, target_path)
