from PIL import Image

try:
    img = Image.open('dist/logo-sequence/comp/main_00102.png')
    alpha = img.split()[3]
    cx = img.width // 2
    val = alpha.getpixel((cx, 0))
    print(f"Alpha at (960, 0) in dist image: {val}")
except Exception as e:
    print(f"Error: {e}")
