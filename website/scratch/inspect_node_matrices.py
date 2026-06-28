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
for i, node in enumerate(nodes):
    name = node.get('name', '')
    if name in ['RcexTyyhpuJYATQ', 'EhCmdLAMoLoXcIA', 'nIhhmAXgzOpXafM', 'RLwgnNOowTrdeJe', 'mwiGwYKZgWcRLpA', 'aGSRqpYfPawohwC', 'waMYZXDBsTMmEKJ', 'Macbook Pro 14-inch with M5 chip']:
        print(f"Node {i} ({name}):")
        if 'matrix' in node:
            print(f"  matrix: {node['matrix']}")
        else:
            print(f"  translation: {node.get('translation')}")
            print(f"  rotation: {node.get('rotation')}")
            print(f"  scale: {node.get('scale')}")
