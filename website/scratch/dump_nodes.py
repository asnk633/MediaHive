import struct
import json
import os

glb_path = 'public/models/macbook_pro_14_inch_M5.glb'
if not os.path.exists(glb_path):
    print("File not found")
    exit(1)

with open(glb_path, 'rb') as f:
    f.read(12)
    chunk_length = struct.unpack('<I', f.read(4))[0]
    chunk_type = f.read(4)
    if chunk_type == b'JSON':
        json_data = f.read(chunk_length)
        gltf = json.loads(json_data.decode('utf-8'))
        
        nodes = gltf.get('nodes', [])
        meshes = gltf.get('meshes', [])
        materials = gltf.get('materials', [])
        
        print("=== NODE HIERARCHY ===")
        for i, node in enumerate(nodes):
            name = node.get('name', 'unnamed')
            mesh_idx = node.get('mesh')
            children = node.get('children', [])
            mesh_info = ""
            if mesh_idx is not None and mesh_idx < len(meshes):
                mesh = meshes[mesh_idx]
                mesh_info = f", Mesh {mesh_idx} ({mesh.get('name')})"
            print(f"Node {i}: {name}{mesh_info}, Children={children}")
            
        print("\n=== MESH DETAILS ===")
        for i, mesh in enumerate(meshes):
            print(f"Mesh {i} ({mesh.get('name')}):")
            for p_idx, prim in enumerate(mesh.get('primitives', [])):
                mat_idx = prim.get('material')
                mat_name = materials[mat_idx].get('name') if mat_idx is not None and mat_idx < len(materials) else 'None'
                print(f"  Primitive {p_idx} uses Material {mat_idx} ({mat_name})")
