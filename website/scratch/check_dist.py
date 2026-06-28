import os

dist_dir = 'dist/logo-sequence/comp'
public_dir = 'public/logo-sequence/comp'

if os.path.exists(dist_dir):
    dist_files = sorted([f for f in os.listdir(dist_dir) if f.startswith('main_') and f.endswith('.png')])
    public_files = sorted([f for f in os.listdir(public_dir) if f.startswith('main_') and f.endswith('.png')])
    
    print(f"Dist files: {len(dist_files)}")
    print(f"Public files: {len(public_files)}")
    
    if dist_files and public_files:
        dist_size = os.path.getsize(os.path.join(dist_dir, dist_files[0]))
        public_size = os.path.getsize(os.path.join(public_dir, public_files[0]))
        print(f"First frame ({dist_files[0]}):")
        print(f"  Dist Size: {dist_size} bytes")
        print(f"  Public Size: {public_size} bytes")
else:
    print("Dist directory does not exist or has no logo-sequence folder.")
