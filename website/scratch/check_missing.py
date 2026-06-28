import os

dist_dir = 'dist/logo-sequence/comp'
public_dir = 'public/logo-sequence/comp'

for name, directory in [('Dist', dist_dir), ('Public', public_dir)]:
    if os.path.exists(directory):
        files = os.listdir(directory)
        print(f"\nChecking {name} directory '{directory}':")
        print(f"Total files: {len(files)}")
        
        missing = []
        for i in range(2, 201):
            filename = f"main_{i:05d}.png"
            if filename not in files:
                missing.append(filename)
                
        print(f"Missing frames ({len(missing)}): {missing[:15]}")
        if len(missing) > 15:
            print("...")
    else:
        print(f"'{directory}' does not exist.")
