import os
import shutil

# Define mappings of source files to destination paths
mappings = {
    # 1. Honey/Golden 1024x1024 Theme Logos
    "Media App logo honey 1024.png": [
        "public/logo-app.png",
        "public/logo-small.png",
        "public/media-app-logo-golden.png",
        "public/mediahive-honey-logo.png",
        "public/mediahive-icon.png",
        "public/apple-touch-icon.png",
        "mediahive_mobile/public/assets/images/logo.png",
        "MediaHive Windows app/public/logo-small.png",
        "MediaHive Windows app/public/logo.png",
        "MediaHive Windows app/public/media-app-logo-golden.png",
        "MediaHive Windows app/public/mediahive-honey-logo.png",
        "website/public/assets/images/logo.png"
    ],
    
    # 2. Luminous Theme Logos (4167x4167)
    "Media App logo for Luminous.png": [
        "public/media-app-logo-luminous.png",
        "public/assets/images/logo_luminous.png",
        "mediahive_mobile/public/assets/images/logo_luminous.png",
        "MediaHive Windows app/out/media-app-logo-luminous.png",
        "MediaHive Windows app/public/media-app-logo-luminous.png",
        "website/dist/assets/images/logo_luminous.png",
        "website/public/assets/images/logo_luminous.png"
    ],
    
    # 3. Midnight Theme Logos (4167x4167)
    "Media App logo for Midnight.png": [
        "public/media-app-logo-midnight.png",
        "public/mediahive-midnight-logo.png",
        "public/assets/images/logo_midnight.png",
        "mediahive_mobile/public/assets/images/logo_midnight.png",
        "MediaHive Windows app/out/media-app-logo-midnight.png",
        "MediaHive Windows app/out/mediahive-midnight-logo.png",
        "MediaHive Windows app/public/media-app-logo-midnight.png",
        "MediaHive Windows app/public/mediahive-midnight-logo.png",
        "website/dist/assets/images/logo_midnight.png",
        "website/public/assets/images/logo_midnight.png"
    ],
    
    # 4. Brand Name Text Logo - Dark (4167x4167)
    "new_logo_dark.png": [
        "public/brand-name-dark.png",
        "MediaHive Windows app/out/brand-name-dark.png",
        "MediaHive Windows app/public/brand-name-dark.png",
        "mediahive_mobile/assets/images/app_name_dark.png"
    ],
    
    # 5. Brand Name Text Logo - Light (4167x4167)
    "new_logo_light.png": [
        "public/brand-name-light.png",
        "MediaHive Windows app/out/brand-name-light.png",
        "MediaHive Windows app/public/brand-name-light.png",
        "mediahive_mobile/assets/images/app_name.png",
        "mediahive_mobile/assets/images/app_name_light.png"
    ],
    
    # 6. Main 3D Mobile Logos (from the recently updated public file)
    "public/Media App new logo 3D.png": [
        "mediahive_mobile/assets/images/logo.png",
        "mediahive_mobile/assets/images/logo_honey.png",
        "mediahive_mobile/assets/images/app_icon.png"
    ]
}

print("=== STARTING LOGO FILES REPLACEMENT ===")
copied_count = 0
skipped_count = 0

for source, destinations in mappings.items():
    if not os.path.exists(source):
        print(f"ERROR: Source file '{source}' does not exist!")
        continue
        
    print(f"\nProcessing source: {source}")
    for dest in destinations:
        dest_dir = os.path.dirname(dest)
        # Create directories if they do not exist
        if dest_dir and not os.path.exists(dest_dir):
            try:
                os.makedirs(dest_dir, exist_ok=True)
                print(f"  Created directory: {dest_dir}")
            except Exception as e:
                print(f"  Failed to create directory {dest_dir}: {e}")
                skipped_count += 1
                continue
                
        try:
            shutil.copy2(source, dest)
            print(f"  SUCCESS: Copied to '{dest}'")
            copied_count += 1
        except Exception as e:
            print(f"  ERROR: Failed to copy to '{dest}': {e}")
            skipped_count += 1

print("\n=== LOGO REPLACEMENT COMPLETE ===")
print(f"Total files copied: {copied_count}")
print(f"Total copies skipped/failed: {skipped_count}")
