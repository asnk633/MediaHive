from PIL import Image
img = Image.open('public/logo-sequence/comp/main_00102.png').convert('RGBA')
alpha = img.split()[3]
extrema = alpha.getextrema()
print(f"Alpha channel min/max: {extrema}")
