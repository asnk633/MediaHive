from PIL import Image

orig = Image.open('public/logo-sequence/comp/main_00102.png')
feat = Image.open('public/logo-sequence/comp/test_feathered_frame.png')

orig_alpha = orig.split()[3]
feat_alpha = feat.split()[3]

width, height = orig.size
cx = width // 2

print("Comparing alpha values at center column (x=960) near top/bottom edges:")
for y in [0, 10, 50, 100, 200, height // 2]:
    print(f"y={y:4d} | Original Alpha: {orig_alpha.getpixel((cx, y)):3d} | Feathered Alpha: {feat_alpha.getpixel((cx, y)):3d}")
