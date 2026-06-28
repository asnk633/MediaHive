from PIL import Image
import os

img_path = 'scratch/iphone/0_image_0.png'
out_dir = 'scratch/slices'
os.makedirs(out_dir, exist_ok=True)

img = Image.open(img_path)
width, height = img.size

grid_size = 4
cell_w = width // grid_size
cell_h = height // grid_size

for r in range(grid_size):
    for c in range(grid_size):
        left = c * cell_w
        top = r * cell_h
        right = left + cell_w
        bottom = top + cell_h
        
        cropped = img.crop((left, top, right, bottom))
        out_path = os.path.join(out_dir, f"slice_r{r}_c{c}.png")
        cropped.save(out_path)
        print(f"Saved {out_path}")
