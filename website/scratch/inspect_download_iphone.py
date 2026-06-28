import urllib.request
import struct
import json
import os

url = "https://raw.githubusercontent.com/pizza3/asset/master/iphone.glb"
local_path = "scratch/pizza_iphone.glb"

print(f"Downloading {url} to {local_path}...")
try:
    urllib.request.urlretrieve(url, local_path)
    print("Download completed successfully.")
except Exception as e:
    print(f"Failed to download: {e}")
    exit(1)

if os.path.exists(local_path):
    with open(local_path, 'rb') as f:
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
        else:
            print("First chunk is not JSON")
