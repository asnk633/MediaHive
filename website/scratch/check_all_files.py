import os

for root, dirs, files in os.walk("."):
    if "node_modules" in dirs:
        dirs.remove("node_modules")
    for file in files:
        path = os.path.join(root, file)
        if not (path.endswith(".html") or path.endswith(".css") or path.endswith(".js")):
            continue
        for encoding in ["utf-8", "utf-16", "utf-16-le", "utf-16-be", "latin-1"]:
            try:
                with open(path, "r", encoding=encoding) as f:
                    content = f.read()
                    if "470px" in content or "860px" in content:
                        lines = content.splitlines()
                        for i, line in enumerate(lines, 1):
                            if "470px" in line or "860px" in line:
                                print(f"{path} ({encoding}):{i}: {line.strip()}")
                        break
            except Exception as e:
                pass
