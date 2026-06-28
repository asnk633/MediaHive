import struct
import json
import os

glb_path = 'public/models/iphone_16_pro_max.glb'
if not os.path.exists(glb_path):
    print("File not found")
    exit(1)

with open(glb_path, 'rb') as f:
    f.read(12) # Header
    chunk_length = struct.unpack('<I', f.read(4))[0]
    chunk_type = f.read(4)
    if chunk_type == b'JSON':
        json_data = f.read(chunk_length)
        gltf = json.loads(json_data.decode('utf-8'))
        
        materials = gltf.get('materials', [])
        print("=== MATERIALS ===")
        for i, mat in enumerate(materials):
            print(f"Material {i}: {mat.get('name')}")
            
        meshes = gltf.get('meshes', [])
        print("\n=== MESHES ===")
        for i, mesh in enumerate(meshes):
            print(f"Mesh {i}: {mesh.get('name')}")
            for p_idx, prim in enumerate(mesh.get('primitives', [])):
                print(f"  Primitive {p_idx} uses Material {prim.get('material')}")
