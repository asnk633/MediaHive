from PIL import Image
import os

img_path = 'scratch/iphone/0_image_0.png'
if not os.path.exists(img_path):
    print("File not found")
    exit(1)

img = Image.open(img_path)
print(f"Dimensions: {img.size}")
print(f"Format: {img.format}")
print(f"Mode: {img.mode}")
