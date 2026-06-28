from PIL import Image

img = Image.open('public/logo-sequence/restore_test/main_00102_reconstructed.png')
alpha = img.split()[3]
cx = img.width // 2
cy = img.height // 2

print("Alpha values of reconstructed frame:")
for y in [0, 10, 50, 100, 200, cy]:
    print(f"y={y:4d} | Alpha: {alpha.getpixel((cx, y)):3d}")
