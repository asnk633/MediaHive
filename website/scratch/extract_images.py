import struct
import json
import os

glb_path = r'public/models/macbook_pro_14_inch_M5.glb'
out_dir = r'scratch'
os.makedirs(out_dir, exist_ok=True)

with open(glb_path, 'rb') as f:
    magic = f.read(4)
    version = struct.unpack('<I', f.read(4))[0]
    length = struct.unpack('<I', f.read(4))[0]
    
    # Read JSON chunk
    chunk_length = struct.unpack('<I', f.read(4))[0]
    chunk_type = f.read(4)
    
    if chunk_type != b'JSON':
        print("First chunk is not JSON")
        exit(1)
        
    json_data = f.read(chunk_length)
    gltf = json.loads(json_data.decode('utf-8'))
    
    # Read Binary chunk
    bin_chunk_length = struct.unpack('<I', f.read(4))[0]
    bin_chunk_type = f.read(4)
    
    if bin_chunk_type != b'BIN\x00':
        print(f"Second chunk is not BIN: {bin_chunk_type}")
        exit(1)
        
    bin_data = f.read(bin_chunk_length)
    
    buffer_views = gltf.get('bufferViews', [])
    images = gltf.get('images', [])
    
    for idx, img in enumerate(images):
        name = img.get('name', f'image_{idx}')
        mime = img.get('mimeType', 'image/png')
        ext = 'png' if 'png' in mime else 'jpg'
        
        bv_idx = img.get('bufferView')
        if bv_idx is not None and bv_idx < len(buffer_views):
            bv = buffer_views[bv_idx]
            offset = bv.get('byteOffset', 0)
            length = bv.get('byteLength', 0)
            
            img_data = bin_data[offset:offset+length]
            out_path = os.path.join(out_dir, f"{idx}_{name}.{ext}")
            with open(out_path, 'wb') as out_f:
                out_f.write(img_data)
            print(f"Saved {out_path} ({len(img_data)} bytes)")
