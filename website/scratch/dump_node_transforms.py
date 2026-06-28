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

nodes = gltf.get('nodes', [])

def dump_node(node_idx, indent=""):
    node = nodes[node_idx]
    name = node.get('name', f"node_{node_idx}")
    t = node.get('translation', [0, 0, 0])
    r = node.get('rotation', [0, 0, 0, 1])
    s = node.get('scale', [1, 1, 1])
    mesh = node.get('mesh')
    mesh_str = f" (Mesh {mesh})" if mesh is not None else ""
    print(f"{indent}- Node {node_idx}: {name}{mesh_str} T={t} R={r} S={s}")
    for child_idx in node.get('children', []):
        dump_node(child_idx, indent + "  ")

# Let's start from Node 70 (Macbook Pro 14-inch with M5 chip)
dump_node(70)
