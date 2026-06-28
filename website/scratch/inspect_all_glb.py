import struct
import json
import os

models = [
    'public/models/macbook_pro_14_inch_M5.glb',
    'public/models/ipad_pro_13_silver_m4.glb',
    'public/models/iphone_16_pro_max.glb'
]

for glb_path in models:
    if not os.path.exists(glb_path):
        print(f"File not found: {glb_path}\n")
        continue
        
    print(f"=== ANALYZING {glb_path} ===")
    with open(glb_path, 'rb') as f:
        magic = f.read(4)
        version = struct.unpack('<I', f.read(4))[0]
        length = struct.unpack('<I', f.read(4))[0]
        
        chunk_length = struct.unpack('<I', f.read(4))[0]
        chunk_type = f.read(4)
        
        if chunk_type == b'JSON':
            json_data = f.read(chunk_length)
            gltf = json.loads(json_data.decode('utf-8'))
            
            images = gltf.get('images', [])
            textures = gltf.get('textures', [])
            materials = gltf.get('materials', [])
            meshes = gltf.get('meshes', [])
            
            # Helper to find textures recursively in JSON
            def find_textures(d, path=""):
                refs = []
                if isinstance(d, dict):
                    if 'index' in d and ('texture' in path.lower() or path.endswith('Texture')):
                        refs.append((path, d['index']))
                    for k, v in d.items():
                        new_path = f"{path}.{k}" if path else k
                        refs.extend(find_textures(v, new_path))
                elif isinstance(d, list):
                    for idx, item in enumerate(d):
                        refs.extend(find_textures(item, f"{path}[{idx}]"))
                return refs
            
            # Print all materials with texture info
            mat_textures = {}
            for i, mat in enumerate(materials):
                name = mat.get('name', '')
                refs = find_textures(mat)
                if refs:
                    mat_textures[i] = []
                    for path, tex_idx in refs:
                        if tex_idx < len(textures):
                            tex = textures[tex_idx]
                            src_idx = tex.get('source')
                            if src_idx is not None and src_idx < len(images):
                                img = images[src_idx]
                                mat_textures[i].append((path, tex_idx, src_idx, img.get('name', '')))
            
            # For each mesh primitive, print if it uses a material with textures
            for i, mesh in enumerate(meshes):
                mesh_name = mesh.get('name', '')
                primitives = mesh.get('primitives', [])
                for p_idx, prim in enumerate(primitives):
                    mat_idx = prim.get('material')
                    if mat_idx is not None and mat_idx in mat_textures:
                        mat_name = materials[mat_idx].get('name', '')
                        print(f"Mesh {i} ({mesh_name}) references Material {mat_idx} ({mat_name}) which has textures:")
                        for path, tex_idx, src_idx, img_name in mat_textures[mat_idx]:
                            print(f"  - {path}: Tex={tex_idx}, Img={src_idx} (Name={img_name})")
        else:
            print("Not JSON chunk")
    print()
