import os

lib_dir = r"D:\MediaHive App\mediahive_mobile\lib"
target = "_buildCustomInput"

found = []
for root, dirs, files in os.walk(lib_dir):
    for file in files:
        if file.endswith(".dart"):
            filepath = os.path.join(root, file)
            with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
                if target in content:
                    found.append(os.path.relpath(filepath, lib_dir))

print(f"Occurrences found in: {found}")
