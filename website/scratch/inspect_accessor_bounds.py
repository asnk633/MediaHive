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
nodes = gltf.get('nodes', [])

def print_mesh_bounds(mesh_idx, mesh_name):
    mesh = meshes[mesh_idx]
    print(f"Mesh {mesh_idx} ({mesh_name}):")
    for p_idx, prim in enumerate(mesh.get('primitives', [])):
        pos_idx = prim['attributes']['POSITION']
        accessor = accessors[pos_idx]
        print(f"  Primitive {p_idx} POSITION bounds: min={accessor.get('min')}, max={accessor.get('max')}")

print("=== BASE MESH BOUNDS ===")
# Node 43 (EhCmdLAMoLoXcIA) has children [6, 22, 31, 41, 42]
# Let's print bounds for some meshes in the base
base_meshes = [0, 1, 2, 3, 4, 5, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 29]
for m_idx in base_meshes[:5]:
    print_mesh_bounds(m_idx, meshes[m_idx].get('name'))

print("\n=== LID/SCREEN MESH BOUNDS ===")
# Node 61 (RcexTyyhpuJYATQ) has children [49, 54, 59, 60]
# 49 has meshes 30, 31, 32, 33, 34
# 54 has meshes 35, 36, 37, 38
# 59 has meshes 39, 40, 41, 42
# 60 has mesh 43
lid_meshes = [30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43]
for m_idx in lid_meshes[:5]:
    print_mesh_bounds(m_idx, meshes[m_idx].get('name'))
