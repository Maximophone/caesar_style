import os
from PIL import Image

def get_corner_color(filepath):
    try:
        img = Image.open(filepath)
        img = img.convert('RGB')
        # Get top-left pixel
        color = img.getpixel((0, 0))
        return color
    except Exception as e:
        return str(e)

assets_dir = 'assets'
files = [f for f in os.listdir(assets_dir) if f.endswith('.png')]

print(f"{'File':<30} | {'R, G, B':<15}")
print("-" * 50)

for f in files:
    path = os.path.join(assets_dir, f)
    color = get_corner_color(path)
    print(f"{f:<30} | {str(color):<15}")
