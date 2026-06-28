import os

slices_dir = 'scratch/slices'
files = os.listdir(slices_dir)
files = [f for f in files if f.endswith('.png')]

# Sort by size to see the most complex slices
slices_with_sizes = []
for f in files:
    path = os.path.join(slices_dir, f)
    size = os.path.getsize(path)
    slices_with_sizes.append((f, size))
    
slices_with_sizes.sort(key=lambda x: x[1], reverse=True)
print("=== SLICES BY FILE SIZE ===")
for f, size in slices_with_sizes:
    print(f"{f}: {size} bytes")
