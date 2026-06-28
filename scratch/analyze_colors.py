from PIL import Image
import numpy as np

def analyze_image(path):
    img = Image.open(path).convert("RGBA")
    data = np.array(img)
    alpha = data[:, :, 3]
    visible_pixels = data[alpha > 0]
    if len(visible_pixels) == 0:
        return "Transparent"
    avg_rgb = visible_pixels[:, :3].mean(axis=0)
    brightness = 0.299 * avg_rgb[0] + 0.587 * avg_rgb[1] + 0.114 * avg_rgb[2]
    return f"Avg RGB: {avg_rgb.round(1)}, Brightness: {brightness:.1f}"

print("Media App logo 1024.png:", analyze_image("Media App logo 1024.png"))
print("Media App logo honey 1024.png:", analyze_image("Media App logo honey 1024.png"))
print("Media App logo for Luminous.png:", analyze_image("Media App logo for Luminous.png"))
print("Media App logo for Midnight.png:", analyze_image("Media App logo for Midnight.png"))
