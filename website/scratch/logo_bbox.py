from PIL import Image

img = Image.open('public/logo-sequence/comp/main_00102.png')
alpha = img.split()[3]
width, height = img.size

bbox = alpha.getbbox()
print(f"Overall bounding box of non-transparent pixels: {bbox}")

# Let's find the bounding box of pixels with alpha >= 240 (the solid parts of the logo)
pixels = alpha.load()
min_x, min_y = width, height
max_x, max_y = 0, 0
for y in range(height):
    for x in range(width):
        if pixels[x, y] >= 240:
            if x < min_x: min_x = x
            if x > max_x: max_x = x
            if y < min_y: min_y = y
            if y > max_y: max_y = y

print(f"Bounding box of solid logo pixels (alpha >= 240):")
print(f"X: {min_x} to {max_x} (width: {max_x - min_x}, center offset: {max_x/2 + min_x/2 - width/2:.1f})")
print(f"Y: {min_y} to {max_y} (height: {max_y - min_y}, center offset: {max_y/2 + min_y/2 - height/2:.1f})")
