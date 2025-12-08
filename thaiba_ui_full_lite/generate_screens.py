from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

out = Path("assets/screenshots")
out.mkdir(parents=True, exist_ok=True)

try:
    font = ImageFont.truetype("arial.ttf", 20)
except Exception:
    from PIL import ImageFont
    font = ImageFont.load_default()

for i, color in enumerate([(18,24,40), (28,36,56), (38,46,72)], start=1):
    img = Image.new("RGB", (480, 800), color)
    d = ImageDraw.Draw(img)
    d.text((24, 24), f"Screen {i}", font=font, fill=(230,238,248))
    d.rounded_rectangle([24, 80, 440, 200], radius=8, outline=(200,210,220), width=2)
    d.text((36, 92), f"Card 1 on Screen {i}", font=font, fill=(200,210,220))
    img.save(out / f"screen{i}.png", optimize=True)
print("3 screens generated to assets/screenshots/")