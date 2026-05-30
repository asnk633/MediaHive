from PIL import Image

def create_splash_icon(input_path, output_path):
    # Load honey logo
    img = Image.open(input_path).convert("RGBA")
    
    # Auto-crop to content
    bbox = img.getbbox()
    if bbox:
        logo = img.crop(bbox)
        
        # Target canvas size
        canvas_size = 1024
        final = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
        
        # Android 12 Splash Screen crops to a circle. 
        # To avoid cropping the hexagon, we must stay within the inner 60% of the canvas.
        target_dim = int(canvas_size * 0.60)
        
        scale = target_dim / max(logo.width, logo.height)
        new_w, new_h = int(logo.width * scale), int(logo.height * scale)
        logo_resized = logo.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        # Center precisely
        final.paste(logo_resized, ((canvas_size - new_w) // 2, (canvas_size - new_h) // 2), mask=logo_resized)
        final.save(output_path)
        print(f"Splash-safe icon saved to {output_path}")
    else:
        print("Error: Empty image.")

if __name__ == "__main__":
    create_splash_icon("assets/images/logo_honey.png", "assets/images/logo_honey_safe.png")
