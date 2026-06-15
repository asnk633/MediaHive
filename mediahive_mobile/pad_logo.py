from PIL import Image
import os

img = Image.open('assets/images/logo.png').convert("RGBA")
w, h = img.size

# Target: the logo should take up about 60% of the new canvas
new_w = int(w / 0.6)
new_h = int(h / 0.6)
new_size = max(new_w, new_h)

# Create a new image with transparent background
padded = Image.new('RGBA', (new_size, new_size), (0, 0, 0, 0))

# Paste the original logo in the center
offset = ((new_size - w) // 2, (new_size - h) // 2)
padded.paste(img, offset, img)

padded.save('assets/images/logo_honey_safe.png')
print("Successfully created padded logo!")
