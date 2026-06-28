from PIL import Image
import os

# Base directory for mobile assets
mobile_dir = "mediahive_mobile"
assets_dir = os.path.join(mobile_dir, "assets", "images")

# Source files
src_app_icon = os.path.join(assets_dir, "app_icon.png")
src_app_icon_padded = os.path.join(assets_dir, "app_icon_padded.png")
src_splash_logo = os.path.join(assets_dir, "logo_honey_safe.png")

print("=== REGENERATING MOBILE PLATFORM ASSETS ===")

# Check sources
for s in [src_app_icon, src_app_icon_padded, src_splash_logo]:
    if not os.path.exists(s):
        print(f"ERROR: Source file '{s}' not found!")
        exit(1)

# 1. Android Launcher Icons Configuration
android_res_dir = os.path.join(mobile_dir, "android", "app", "src", "main", "res")
launcher_configs = [
    # (density, base_size, foreground_size)
    ("mdpi", 48, 108),
    ("hdpi", 72, 162),
    ("xhdpi", 96, 216),
    ("xxhdpi", 144, 324),
    ("xxxhdpi", 192, 432)
]

for density, base_sz, fore_sz in launcher_configs:
    mipmap_dir = os.path.join(android_res_dir, f"mipmap-{density}")
    os.makedirs(mipmap_dir, exist_ok=True)
    
    # Base Launcher & Launcher Round
    with Image.open(src_app_icon) as img:
        img_resized = img.resize((base_sz, base_sz), Image.Resampling.LANCZOS)
        
        dest_launcher = os.path.join(mipmap_dir, "ic_launcher.png")
        img_resized.save(dest_launcher)
        print(f"  SUCCESS: Generated {dest_launcher} ({base_sz}x{base_sz})")
        
        dest_launcher_round = os.path.join(mipmap_dir, "ic_launcher_round.png")
        img_resized.save(dest_launcher_round)
        print(f"  SUCCESS: Generated {dest_launcher_round} ({base_sz}x{base_sz})")
        
    # Foreground Launcher (Adaptive)
    with Image.open(src_app_icon_padded) as img:
        img_resized = img.resize((fore_sz, fore_sz), Image.Resampling.LANCZOS)
        
        dest_fore = os.path.join(mipmap_dir, "ic_launcher_foreground.png")
        img_resized.save(dest_fore)
        print(f"  SUCCESS: Generated {dest_fore} ({fore_sz}x{fore_sz})")

# 2. iOS Launcher Icons (Dynamic Replacement)
ios_appicon_dir = os.path.join(mobile_dir, "ios", "Runner", "Assets.xcassets", "AppIcon.appiconset")
if os.path.exists(ios_appicon_dir):
    print("\nProcessing iOS App Icons...")
    with Image.open(src_app_icon) as img_source:
        for f in os.listdir(ios_appicon_dir):
            if f.lower().endswith('.png') and f.startswith('Icon-App'):
                dest_path = os.path.join(ios_appicon_dir, f)
                try:
                    # Get original size of the icon to overwrite it with the same dimensions
                    with Image.open(dest_path) as orig_img:
                        w, h = orig_img.size
                    
                    resized = img_source.resize((w, h), Image.Resampling.LANCZOS)
                    resized.save(dest_path)
                    print(f"  SUCCESS: Overwrote iOS icon {f} with size {w}x{h}")
                except Exception as e:
                    print(f"  ERROR: Failed to overwrite iOS icon {f}: {e}")
else:
    print(f"\nWARNING: iOS AppIcon directory '{ios_appicon_dir}' not found.")

# 3. Android and iOS Splash Screens
print("\nProcessing Splash Screens...")

splash_configs = [
    # (density, size)
    ("mdpi", 1736),
    ("hdpi", 2604),
    ("xhdpi", 3472),
    ("xxhdpi", 5208),
    ("xxxhdpi", 6945)
]

for density, sz in splash_configs:
    # Generate Android Splash
    drawable_dir = os.path.join(android_res_dir, f"drawable-{density}")
    drawable_night_dir = os.path.join(android_res_dir, f"drawable-night-{density}")
    os.makedirs(drawable_dir, exist_ok=True)
    os.makedirs(drawable_night_dir, exist_ok=True)
    
    # Create black background canvas
    splash_canvas = Image.new("RGBA", (sz, sz), (0, 0, 0, 255))
    
    # Resize and overlay splash logo
    with Image.open(src_splash_logo) as img_logo:
        logo_resized = img_logo.resize((sz, sz), Image.Resampling.LANCZOS)
        # Paste logo onto black canvas (using resized logo as mask for transparency)
        splash_canvas.paste(logo_resized, (0, 0), logo_resized)
        
    # Save splash screens
    for d in [drawable_dir, drawable_night_dir]:
        dest_splash = os.path.join(d, "splash.png")
        dest_a12_splash = os.path.join(d, "android12splash.png")
        splash_canvas.save(dest_splash)
        splash_canvas.save(dest_a12_splash)
        print(f"  SUCCESS: Generated splash & android12splash in {os.path.basename(d)} ({sz}x{sz})")

# Generate iOS Launch Images
ios_launch_dir = os.path.join(mobile_dir, "ios", "Runner", "Assets.xcassets", "LaunchImage.imageset")
if os.path.exists(ios_launch_dir):
    print("\nProcessing iOS Launch Images...")
    launch_images = [
        ("LaunchImage.png", 1736),
        ("LaunchImage@2x.png", 3472),
        ("LaunchImage@3x.png", 5208)
    ]
    for filename, sz in launch_images:
        dest_path = os.path.join(ios_launch_dir, filename)
        # Create black background canvas
        splash_canvas = Image.new("RGBA", (sz, sz), (0, 0, 0, 255))
        with Image.open(src_splash_logo) as img_logo:
            logo_resized = img_logo.resize((sz, sz), Image.Resampling.LANCZOS)
            splash_canvas.paste(logo_resized, (0, 0), logo_resized)
            
        try:
            splash_canvas.save(dest_path)
            print(f"  SUCCESS: Generated iOS Launch Image {filename} ({sz}x{sz})")
        except Exception as e:
            print(f"  ERROR: Failed to save iOS Launch Image {filename}: {e}")
else:
    print(f"\nWARNING: iOS LaunchImage directory '{ios_launch_dir}' not found.")

print("\n=== MOBILE PLATFORM ASSETS REGENERATION COMPLETE ===")
