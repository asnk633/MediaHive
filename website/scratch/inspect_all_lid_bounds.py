import struct
import json
import os

glb_path = 'public/models/macbook_pro_14_inch_M5.glb'
with open(glb_path, 'rb') as f:
    f.read(12)
    chunk_length = struct.unpack('<I', f.read(4))[0]
    f.read(4)
    json_data = f.read(chunk_length)
    gltf = json.loads(json_data.decode('utf-8'))

accessors = gltf.get('accessors', [])
meshes = gltf.get('meshes', [])

lid_meshes = [30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43]
for m_idx in lid_meshes:
    mesh = meshes[m_idx]
    print(f"Mesh {m_idx} ({mesh.get('name')}):")
    for p_idx, prim in enumerate(mesh.get('primitives', [])):
        pos_idx = prim['attributes']['POSITION']
        accessor = accessors[pos_idx]
        print(f"  Primitive {p_idx} POSITION bounds: min={accessor.get('min')}, max={accessor.get('max')}")
