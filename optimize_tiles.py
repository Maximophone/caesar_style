from PIL import Image
import os

# Source and target paths
source_path = 'assets/road_tiles.png'
target_path = 'assets/road_tiles_optimized.png'

# Load source image
try:
    img = Image.open(source_path)
    # Ensure RGBA
    img = img.convert('RGBA')
except Exception as e:
    print(f"Error loading image: {e}")
    exit(1)

# Inspect size
width, height = img.size
tile_w = width // 4
tile_h = height // 4
print(f"Source size: {width}x{height}, Tile size: {tile_w}x{tile_h}")

# Target size: 3 cols x 2 rows
target_w = tile_w * 3
target_h = tile_h * 2
new_img = Image.new('RGBA', (target_w, target_h))

# Source Coordinates (col, row) -> (x, y)
# 1. Isolated [0,0] -> Target [0,0]
# 2. End (S)  [0,1] -> Target [1,0]
# 3. Straight (NS) [1,0] -> Target [2,0]
# 4. Corner (NE)   [2,1] -> Target [0,1]
# 5. T-Junc (NWS)  [3,1] -> Target [1,1]
# 6. Cross  [All]  [3,3] -> Target [2,1]

mappings = [
    # (SrcCol, SrcRow) -> (DstCol, DstRow)
    ((0, 0), (0, 0)), # Isolated
    ((0, 1), (1, 0)), # End
    ((1, 0), (2, 0)), # Straight
    ((2, 1), (0, 1)), # Corner
    ((3, 1), (1, 1)), # T-Junc
    ((3, 3), (2, 1))  # Cross
]

for (src_c, src_r), (dst_c, dst_r) in mappings:
    # Crop
    left = src_c * tile_w
    top = src_r * tile_h
    right = left + tile_w
    bottom = top + tile_h
    tile = img.crop((left, top, right, bottom))
    
    # Paste
    target_x = dst_c * tile_w
    target_y = dst_r * tile_h
    new_img.paste(tile, (target_x, target_y))

# Transparency application removed as per user request to keep background color.
# The game will handle transparency at runtime.

# Save
new_img.save(target_path)
print(f"Saved optimized image to {target_path}")
