from PIL import Image
img = Image.open('public/logo-sequence/comp/main_00102.png').convert('RGBA')
alpha = img.split()[3]
pixels = list(alpha.getdata())
non_zero = sum(1 for p in pixels if p > 0)
total = len(pixels)
print(f"Total pixels: {total}")
print(f"Non-zero alpha pixels: {non_zero} ({non_zero/total*100:.2f}%)")
