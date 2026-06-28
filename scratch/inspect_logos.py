from PIL import Image
import os

files_to_inspect = {
    # New logos in root
    "Root: Media App logo 1024.png": "Media App logo 1024.png",
    "Root: Media App logo honey 1024.png": "Media App logo honey 1024.png",
    "Root: Media App logo for Luminous.png": "Media App logo for Luminous.png",
    "Root: Media App logo for Midnight.png": "Media App logo for Midnight.png",
    "Root: new_logo_dark.png": "new_logo_dark.png",
    "Root: new_logo_light.png": "new_logo_light.png",
    
    # Web logos in public/
    "Web: logo-app.png": "public/logo-app.png",
    "Web: media-app-logo-golden.png": "public/media-app-logo-golden.png",
    "Web: media-app-logo-luminous.png": "public/media-app-logo-luminous.png",
    "Web: media-app-logo-midnight.png": "public/media-app-logo-midnight.png",
    "Web: brand-name-dark.png": "public/brand-name-dark.png",
    "Web: brand-name-light.png": "public/brand-name-light.png",
    "Web: Media App new logo 3D.png": "public/Media App new logo 3D.png",
    
    # Mobile logos in mediahive_mobile/assets/images/
    "Mobile: logo.png": "mediahive_mobile/assets/images/logo.png",
    "Mobile: logo_honey.png": "mediahive_mobile/assets/images/logo_honey.png",
    "Mobile: logo_honey_safe.png": "mediahive_mobile/assets/images/logo_honey_safe.png",
    "Mobile: app_name_dark.png": "mediahive_mobile/assets/images/app_name_dark.png",
    "Mobile: app_name_light.png": "mediahive_mobile/assets/images/app_name_light.png"
}

print(f"{'Label':<40} | {'File Name':<35} | {'Dimensions':<15} | {'Format':<8} | {'Bytes':<10}")
print("-" * 115)

for label, rel_path in files_to_inspect.items():
    if not os.path.exists(rel_path):
        print(f"{label:<40} | {rel_path:<35} | {'MISSING':<15} | {'N/A':<8} | {'N/A':<10}")
        continue
    try:
        with Image.open(rel_path) as img:
            size_str = f"{img.width}x{img.height}"
            byte_size = os.path.getsize(rel_path)
            print(f"{label:<40} | {os.path.basename(rel_path):<35} | {size_str:<15} | {img.format:<8} | {byte_size:<10}")
    except Exception as e:
        print(f"{label:<40} | {os.path.basename(rel_path):<35} | {'ERROR':<15} | {'N/A':<8} | {str(e):<10}")
