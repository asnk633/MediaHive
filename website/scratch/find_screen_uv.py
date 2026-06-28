import struct
import json
import os
import numpy as np

glb_path = 'public/models/iphone_16_pro_max.glb'

def parse_gltf_accessor(gltf, bin_data, accessor_idx):
    accessor = gltf['accessors'][accessor_idx]
    bv_idx = accessor['bufferView']
    bv = gltf['bufferViews'][bv_idx]
    
    offset = bv.get('byteOffset', 0) + accessor.get('byteOffset', 0)
    count = accessor['count']
    comp_type = accessor['componentType']
    type_str = accessor['type']
    
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
    f.read(4)
    json_data = f.read(chunk_length)
    gltf = json.loads(json_data.decode('utf-8'))
    
    bin_chunk_length = struct.unpack('<I', f.read(4))[0]
    f.read(4)
    bin_data = f.read(bin_chunk_length)

mesh = gltf['meshes'][0]
prim = mesh['primitives'][0]

pos_idx = prim['attributes']['POSITION']
norm_idx = prim['attributes']['NORMAL']
uv_idx = prim['attributes']['TEXCOORD_0']

positions = parse_gltf_accessor(gltf, bin_data, pos_idx)
normals = parse_gltf_accessor(gltf, bin_data, norm_idx)
uvs = parse_gltf_accessor(gltf, bin_data, uv_idx)

# The phone screen is at the front face. 
# Let's check vertices where y is near the maximum positive value (since y-range is -0.82 to 0.31).
# Max y is 0.313. Let's look for vertices with y > 0.30 and normal pointing up in Y direction (normals[:, 1] > 0.9)
screen_indices = np.where((positions[:, 1] > 0.30) & (normals[:, 1] > 0.95))[0]

print(f"Found {len(screen_indices)} screen candidate vertices.")
if len(screen_indices) > 0:
    screen_uvs = uvs[screen_indices]
    min_uv = screen_uvs.min(axis=0)
    max_uv = screen_uvs.max(axis=0)
    print(f"Screen UV bounds: Min={min_uv}, Max={max_uv}")
    
    # Print a few samples
    print("Sample UVs:")
    for idx in screen_indices[:10]:
        print(f"Pos={positions[idx]}, Normal={normals[idx]}, UV={uvs[idx]}")
else:
    # Let's search by position x, z ranges and high Y to see what the UVs look like
    # Let's find vertices where x is inside [-3.3, 3.3] and z is inside [-7.2, 7.2] and y > 0.3
    screen_indices2 = np.where((positions[:, 1] > 0.30) & (np.abs(positions[:, 0]) < 3.3) & (np.abs(positions[:, 2]) < 7.2))[0]
    print(f"Found {len(screen_indices2)} screen vertices by position bounding box.")
    if len(screen_indices2) > 0:
        screen_uvs2 = uvs[screen_indices2]
        print(f"UV bounds: Min={screen_uvs2.min(axis=0)}, Max={screen_uvs2.max(axis=0)}")
