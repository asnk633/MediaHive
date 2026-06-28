import os

for root, dirs, files in os.walk("."):
    if "node_modules" in dirs:
        dirs.remove("node_modules")
    for file in files:
        path = os.path.join(root, file)
        try:
            with open(path, "r", encoding="utf-8") as f:
                for i, line in enumerate(f, 1):
                    if "470" in line:
                        print(f"FOUND in {path}:{i}: {line.strip()}")
        except Exception as e:
            try:
                with open(path, "r", encoding="latin-1") as f:
                    for i, line in enumerate(f, 1):
                        if "470" in line:
                            print(f"FOUND in {path}:{i}: {line.strip()}")
            except Exception as e2:
                pass
