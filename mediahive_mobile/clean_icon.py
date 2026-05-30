from PIL import Image
import math

def create_final_safe_icon(input_path, output_path):
    # Load original FULL 3D bee
    img = Image.open(input_path).convert("RGBA")
    
    # Auto-crop to content
    bbox = img.getbbox()
    if bbox:
        logo = img.crop(bbox)
        
        # Target canvas size for high-res icons
        canvas_size = 1024
        final = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
        
        # We'll use 65% of the canvas for the logo. 
        # This is the "Goldilocks" zone: not too big (cropped), not too small.
        # It leaves 17.5% padding on each side, which is perfect for adaptive masks.
        target_dim = int(canvas_size * 0.65)
        
        scale = target_dim / max(logo.width, logo.height)
        new_w, new_h = int(logo.width * scale), int(logo.height * scale)
        logo_resized = logo.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        # Center precisely
        final.paste(logo_resized, ((canvas_size - new_w) // 2, (canvas_size - new_h) // 2), mask=logo_resized)
        final.save(output_path)
        print(f"Final safe-sized icon saved to {output_path}")
    else:
        print("Error: Empty image.")

if __name__ == "__main__":
    create_final_safe_icon("assets/images/app_icon_source.png", "assets/images/app_icon.png")
