from PIL import Image
import os

splash_paths = [
    "mediahive_mobile/android/app/src/main/res/drawable-mdpi/splash.png",
    "mediahive_mobile/android/app/src/main/res/drawable-hdpi/splash.png",
    "mediahive_mobile/android/app/src/main/res/drawable-xhdpi/splash.png",
    "mediahive_mobile/android/app/src/main/res/drawable-xxhdpi/splash.png",
    "mediahive_mobile/android/app/src/main/res/drawable-xxxhdpi/splash.png"
]

for path in splash_paths:
    if os.path.exists(path):
        with Image.open(path) as img:
            print(f"{path}: {img.width}x{img.height}")
    else:
        print(f"{path} not found")
