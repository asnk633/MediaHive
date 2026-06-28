import os
import re

lib_dir = r"D:\MediaHive App\mediahive_mobile\lib"
relative_import_pattern = re.compile(r"^\s*import\s+['\"](\.\.?/.*)['\"];")

relative_imports_found = []

for root, dirs, files in os.walk(lib_dir):
    for file in files:
        if file.endswith(".dart"):
            filepath = os.path.join(root, file)
            with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                for line_idx, line in enumerate(f, 1):
                    match = relative_import_pattern.match(line)
                    if match:
                        import_path = match.group(1)
                        relative_imports_found.append({
                            "file": os.path.relpath(filepath, lib_dir),
                            "line": line_idx,
                            "import": import_path
                        })

print(f"Total relative imports found: {len(relative_imports_found)}")
for item in relative_imports_found:
    print(f"{item['file']}:{item['line']}: {item['import']}")
