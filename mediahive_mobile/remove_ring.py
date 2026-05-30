from PIL import Image, ImageDraw
import math

def remove_outer_gold_ring(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size
    cx, cy = width // 2, height // 2
    
    # Let's find the "gold" pixels and remove the outermost ones.
    # Gold is roughly (229, 147, 18) -> #E59312
    # We'll remove everything that is too far from the center.
    
    # We'll use a mask that only keeps the very center (20% of the image)
    # to see if THAT removes the ring.
    mask = Image.new('L', (width, height), 0)
    draw = ImageDraw.Draw(mask)
    
    # Extremely aggressive crop to isolate the core woven part
    r = min(width, height) * 0.22 
    
    # Draw a circle mask
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=255)
    
    result = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    result.paste(img, (0, 0), mask=mask)
    
    # Crop to content
    bbox = result.getbbox()
    if bbox:
        inner = result.crop(bbox)
        # Pad heavily to make the bee look small and centered like Google icons
        canvas_size = 1024
        final = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
        # Size the inner logo to be 60% of the canvas
        target_size = int(canvas_size * 0.6)
        scale = target_size / max(inner.width, inner.height)
        new_w, new_h = int(inner.width * scale), int(inner.height * scale)
        inner_resized = inner.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        final.paste(inner_resized, ((canvas_size - new_w) // 2, (canvas_size - new_h) // 2))
        final.save(output_path)
    else:
        result.save(output_path)
        
    print(f"Processed icon saved to {output_path}")

if __name__ == "__main__":
    remove_outer_gold_ring("assets/images/app_icon.png", "assets/images/app_icon_no_ring.png")
