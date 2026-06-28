"""
create_brand_folders.py
Creates public/brand/ (web) and mediahive_mobile/assets/brand/ (mobile)
as the single source of truth for all logo and wordmark assets.
"""

from PIL import Image
import os, shutil

BASE = "D:/MediaHive App"
SRC_ICON = os.path.join(BASE, "public/Media App new logo 3D.png")

src_icon = Image.open(SRC_ICON)
print(f"Source icon: {src_icon.size} {src_icon.mode} ({os.path.getsize(SRC_ICON):,}b)\n")

# ============================================================
# 1. CREATE public/brand/ folder (Web)
# ============================================================
web_brand = os.path.join(BASE, "public/brand")
os.makedirs(web_brand, exist_ok=True)
print("=== WEB: Creating public/brand/ ===")

# icon.png - 400x400
r = src_icon.resize((400, 400), Image.LANCZOS)
p = os.path.join(web_brand, "icon.png")
r.save(p, "PNG", optimize=True)
print(f"[OK] brand/icon.png ({os.path.getsize(p):,}b)")

# icon-sm.png - 200x200
r = src_icon.resize((200, 200), Image.LANCZOS)
p = os.path.join(web_brand, "icon-sm.png")
r.save(p, "PNG", optimize=True)
print(f"[OK] brand/icon-sm.png ({os.path.getsize(p):,}b)")

# wordmark-dark.png and wordmark-light.png (restored originals)
src_dark = os.path.join(BASE, "public/brand-name-dark.png")
src_light = os.path.join(BASE, "public/brand-name-light.png")
shutil.copy2(src_dark, os.path.join(web_brand, "wordmark-dark.png"))
shutil.copy2(src_light, os.path.join(web_brand, "wordmark-light.png"))
print(f"[OK] brand/wordmark-dark.png ({os.path.getsize(os.path.join(web_brand, 'wordmark-dark.png')):,}b)")
print(f"[OK] brand/wordmark-light.png ({os.path.getsize(os.path.join(web_brand, 'wordmark-light.png')):,}b)")

# ============================================================
# 2. Sync public/ aliases from brand/ (backward compat)
# ============================================================
print("\n=== WEB: Syncing public/ aliases from brand/ ===")
icon_src = os.path.join(web_brand, "icon.png")
icon_sm_src = os.path.join(web_brand, "icon-sm.png")
wm_dark = os.path.join(web_brand, "wordmark-dark.png")
wm_light = os.path.join(web_brand, "wordmark-light.png")

icon_aliases = [
    "logo-app.png",
    "media-app-logo-luminous.png",
    "media-app-logo-midnight.png",
    "media-app-logo-golden.png",
    "mediahive-honey-logo.png",
    "mediahive-midnight-logo.png",
    "mediahive-icon.png",
]
for alias in icon_aliases:
    dest = os.path.join(BASE, "public", alias)
    shutil.copy2(icon_src, dest)
    print(f"  [OK] {alias}")

shutil.copy2(icon_sm_src, os.path.join(BASE, "public/logo-small.png"))
print("  [OK] logo-small.png")

# Restore wordmark aliases (brand-name files)
shutil.copy2(wm_dark, os.path.join(BASE, "public/brand-name-dark.png"))
shutil.copy2(wm_light, os.path.join(BASE, "public/brand-name-light.png"))
print("  [OK] brand-name-dark.png")
print("  [OK] brand-name-light.png")

# Static assets/images copies
shutil.copy2(icon_src, os.path.join(BASE, "public/assets/images/logo.png"))
shutil.copy2(icon_src, os.path.join(BASE, "public/assets/images/logo_luminous.png"))
shutil.copy2(icon_src, os.path.join(BASE, "public/assets/images/logo_midnight.png"))
print("  [OK] public/assets/images/logo*.png")

# ============================================================
# 3. CREATE mediahive_mobile/assets/brand/ folder (Mobile)
# ============================================================
mob_brand = os.path.join(BASE, "mediahive_mobile/assets/brand")
os.makedirs(mob_brand, exist_ok=True)
print("\n=== MOBILE: Creating mediahive_mobile/assets/brand/ ===")

# icon.png - 1024x1024 (Flutter scales down as needed)
r = src_icon.resize((1024, 1024), Image.LANCZOS)
p = os.path.join(mob_brand, "icon.png")
r.save(p, "PNG", optimize=True)
print(f"[OK] assets/brand/icon.png ({os.path.getsize(p):,}b)")

# icon-padded.png - with 20% padding for adaptive icon
pad_size = 1024
pad = int(pad_size * 0.2)
canvas = Image.new("RGBA", (pad_size, pad_size), (0, 0, 0, 0))
inner = src_icon.resize((pad_size - pad * 2, pad_size - pad * 2), Image.LANCZOS)
canvas.paste(inner, (pad, pad), inner)
p = os.path.join(mob_brand, "icon-padded.png")
canvas.save(p, "PNG", optimize=True)
print(f"[OK] assets/brand/icon-padded.png ({os.path.getsize(p):,}b)")

# wordmark files (same originals as web)
shutil.copy2(wm_dark, os.path.join(mob_brand, "wordmark-dark.png"))
shutil.copy2(wm_light, os.path.join(mob_brand, "wordmark-light.png"))
print(f"[OK] assets/brand/wordmark-dark.png ({os.path.getsize(os.path.join(mob_brand, 'wordmark-dark.png')):,}b)")
print(f"[OK] assets/brand/wordmark-light.png ({os.path.getsize(os.path.join(mob_brand, 'wordmark-light.png')):,}b)")

# ============================================================
# 4. Sync mobile assets/images/ from brand/ (backward compat)
# ============================================================
print("\n=== MOBILE: Syncing assets/images/ from brand/ ===")
mob_icon = os.path.join(mob_brand, "icon.png")
mob_icon_padded = os.path.join(mob_brand, "icon-padded.png")
mob_wm_dark = os.path.join(mob_brand, "wordmark-dark.png")
mob_wm_light = os.path.join(mob_brand, "wordmark-light.png")

mob_images = os.path.join(BASE, "mediahive_mobile/assets/images")
shutil.copy2(mob_wm_dark, os.path.join(mob_images, "app_name_dark.png"))
shutil.copy2(mob_wm_light, os.path.join(mob_images, "app_name_light.png"))
shutil.copy2(mob_wm_light, os.path.join(mob_images, "app_name.png"))
print("  [OK] app_name_dark.png / app_name_light.png / app_name.png")

print("\nAll done!")
print(f"\nWeb brand folder:    {web_brand}")
print(f"Mobile brand folder: {mob_brand}")
