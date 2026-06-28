import struct
import json
import os
import numpy as np

glb_path = 'public/models/iphone_16_pro_max.glb'
if not os.path.exists(glb_path):
    print("File not found")
    exit(1)

def parse_gltf_accessor(gltf, bin_data, accessor_idx):
    accessor = gltf['accessors'][accessor_idx]
    bv_idx = accessor['bufferView']
    bv = gltf['bufferViews'][bv_idx]
    
    offset = bv.get('byteOffset', 0) + accessor.get('byteOffset', 0)
    count = accessor['count']
    comp_type = accessor['componentType']
    type_str = accessor['type']
    
    # component type mapping
    # 5120: BYTE, 5121: UNSIGNED_BYTE, 5122: SHORT, 5123: UNSIGNED_SHORT, 5125: UNSIGNED_INT, 5126: FLOAT
    comp_sizes = {5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4}
    comp_formats = {5120: 'b', 5121: 'B', 5122: 'h', 5123: 'H', 5125: 'I', 5126: 'f'}
    
    num_comps = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT2': 4, 'MAT3': 9, 'MAT4': 16}[type_str]
    
    stride = bv.get('byteStride', comp_sizes[comp_type] * num_comps)
    
    data = []
    fmt = comp_formats[comp_type] * num_comps
    for i in range(count):
        start = offset + i * stride
        val = struct.unpack_from('<' + fmt, bin_data, start)
        data.append(val)
        
    return np.array(data)

with open(glb_path, 'rb') as f:
    f.read(12)
    chunk_length = struct.unpack('<I', f.read(4))[0]
    chunk_type = f.read(4)
    json_data = f.read(chunk_length)
    gltf = json.loads(json_data.decode('utf-8'))
    
    bin_chunk_length = struct.unpack('<I', f.read(4))[0]
    f.read(4) # type
    bin_data = f.read(bin_chunk_length)

mesh = gltf['meshes'][0]
prim = mesh['primitives'][0]

pos_idx = prim['attributes']['POSITION']
norm_idx = prim['attributes']['NORMAL']
uv_idx = prim['attributes']['TEXCOORD_0']

positions = parse_gltf_accessor(gltf, bin_data, pos_idx)
normals = parse_gltf_accessor(gltf, bin_data, norm_idx)
uvs = parse_gltf_accessor(gltf, bin_data, uv_idx)

print(f"Loaded {len(positions)} vertices.")

# Let's find vertices where normal points in the screen forward direction.
# For a phone lying on the Z-up or Y-up plane, the screen is usually facing +Z or +Y.
# Let's inspect the bounding box of positions to see the orientation.
min_pos = positions.min(axis=0)
max_pos = positions.max(axis=0)
print(f"Position bounds: Min={min_pos}, Max={max_pos}")

# Let's look at the average normals to see where they point.
# Typically, the screen is flat and has normal close to [0, 0, 1] (or [0, 1, 0])
# Let's group vertices by their normals and find the screen face.
# Screen normal is likely flat, let's filter for normals where normal_z > 0.9 (or normal_y > 0.9)
# Let's try z first.
screen_indices = np.where(normals[:, 2] > 0.95)[0]
if len(screen_indices) == 0:
    screen_indices = np.where(normals[:, 1] > 0.95)[0]

if len(screen_indices) > 0:
    screen_uvs = uvs[screen_indices]
    min_uv = screen_uvs.min(axis=0)
    max_uv = screen_uvs.max(axis=0)
    print(f"Screen UV bounds: Min={min_uv}, Max={max_uv}")
else:
    print("Could not find screen vertices based on normal.")
