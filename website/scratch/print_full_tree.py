import struct
import json

glb_path = 'public/models/macbook_pro_14_inch_M5.glb'
with open(glb_path, 'rb') as f:
    f.read(12)
    chunk_length = struct.unpack('<I', f.read(4))[0]
    f.read(4)
    json_data = f.read(chunk_length)
    gltf = json.loads(json_data.decode('utf-8'))

nodes = gltf.get('nodes', [])

def print_tree(node_idx, indent=""):
    node = nodes[node_idx]
    name = node.get('name', 'unnamed')
    translation = node.get('translation', [0, 0, 0])
    rotation = node.get('rotation', [0, 0, 0, 1])
    scale = node.get('scale', [1, 1, 1])
    children = node.get('children', [])
    mesh = node.get('mesh')
    mesh_str = f" [Mesh {mesh}]" if mesh is not None else ""
    print(f"{indent}Node {node_idx}: {name}{mesh_str} T={translation} R={rotation} S={scale}")
    for c in children:
        print_tree(c, indent + "  ")

# Node 70 is the root Macbook Pro node
print_tree(70)
