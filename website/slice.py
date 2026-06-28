import os
from PIL import Image

image_path = 'public/images/grid.png'
out_dir = 'public/images/frames'

if not os.path.exists(out_dir):
    os.makedirs(out_dir)

img = Image.open(image_path)
width, height = img.size
cell_width = width // 5
cell_height = height // 5

frame_num = 1
for row in range(5):
    for col in range(5):
        left = col * cell_width
        top = row * cell_height
        right = left + cell_width
        bottom = top + cell_height
        
        cropped = img.crop((left, top, right, bottom))
        
        # Convert to RGB to save as JPG
        if cropped.mode == 'RGBA':
            cropped = cropped.convert('RGB')
            
        out_path = os.path.join(out_dir, f'desk-frame-{frame_num:02d}.jpg')
        cropped.save(out_path, 'JPEG', quality=90)
        print(f"Saved {out_path}")
        frame_num += 1

print("Done slicing 25 frames.")
