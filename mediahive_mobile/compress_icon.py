from PIL import Image
import os

def compress_icon(path):
    img = Image.open(path)
    # Check current size
    print(f"Original size: {os.path.getsize(path)} bytes")
    
    # Icons should be 1024x1024 max for source
    if img.width > 1024 or img.height > 1024:
        img.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
        
    # Save as compressed PNG (level 9)
    img.save(path, "PNG", optimize=True)
    print(f"Compressed size: {os.path.getsize(path)} bytes")

if __name__ == "__main__":
    compress_icon(r"d:\MediaHive App\mediahive_mobile\assets\images\app_icon.png")
