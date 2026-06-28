import struct
import json
import numpy as np

glb_path = 'public/models/macbook_pro_14_inch_M5.glb'
with open(glb_path, 'rb') as f:
    f.read(12)
    chunk_length = struct.unpack('<I', f.read(4))[0]
    f.read(4)
    json_data = f.read(chunk_length)
    gltf = json.loads(json_data.decode('utf-8'))

# We want to read the buffer views for POSITION attribute of the lid meshes.
# Let's write a simple parser to extract position coordinates.
buffers = gltf.get('buffers', [])
buffer_views = gltf.get('bufferViews', [])
accessors = gltf.get('accessors', [])

# Load bin buffer
bin_path = glb_path
with open(bin_path, 'rb') as f:
    f.read(12) # header
    f.read(4) # chunk length
    f.read(4) # chunk type
    f.read(chunk_length) # JSON chunk
    f.read(4) # BIN chunk length
    f.read(4) # BIN chunk type
    bin_data = f.read()

def get_accessor_data(accessor_idx):
    accessor = accessors[accessor_idx]
    bv_idx = accessor['bufferView']
    bv = buffer_views[bv_idx]
    
    offset = bv.get('byteOffset', 0) + accessor.get('byteOffset', 0)
    length = accessor['count']
    
    # Position is typically FLOAT (5126) and vec3 (type "VEC3")
    # 3 floats = 12 bytes per element
    stride = bv.get('byteStride', 12)
    
    data = []
    for i in range(length):
        start = offset + i * stride
        val = struct.unpack('<fff', bin_data[start:start+12])
        data.append(val)
    return np.array(data)

# Let's inspect mesh 35 and 36 (part of the screen lid)
meshes = gltf.get('meshes', [])
lid_mesh_indices = [35, 36]
for m_idx in lid_mesh_indices:
    mesh = meshes[m_idx]
    print(f"Mesh {m_idx} ({mesh['name']}):")
    for prim in mesh['primitives']:
        pos_idx = prim['attributes']['POSITION']
        pts = get_accessor_data(pos_idx)
        print(f"  Total points: {len(pts)}")
        # Hinge should be at the minimum Y (or maximum/minimum Z depending on orientation)
        # Let's check min and max of each axis
        min_vals = pts.min(axis=0)
        max_vals = pts.max(axis=0)
        print(f"  Bounds: min={min_vals}, max={max_vals}")
        
        # In raw glTF:
        # Y is up, X is width, Z is depth.
        # The hinge in raw glTF should be at the bottom of the screen.
        # Let's find points with Y close to the bottom of the screen (min_vals[1] or max_vals[1]?)
        # Let's see: the screen height goes from Y = -18.99 to -10.49 (Mesh 36).
        # So the bottom of the screen (hinge) is at Y = -10.49.
        # Let's find the average Z of points near Y = -10.49
        hinge_pts = pts[pts[:, 1] > -11.0]
        if len(hinge_pts) > 0:
            print(f"  Hinge region points near Y=-10.5: count={len(hinge_pts)}")
            print(f"  Hinge region Y bounds: [{hinge_pts[:, 1].min()}, {hinge_pts[:, 1].max()}]")
            print(f"  Hinge region Z bounds: [{hinge_pts[:, 2].min()}, {hinge_pts[:, 2].max()}]")
            print(f"  Hinge region Z mean: {hinge_pts[:, 2].mean()}")
            print(f"  Hinge region Y mean: {hinge_pts[:, 1].mean()}")
