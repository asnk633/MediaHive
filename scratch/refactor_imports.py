import os
import re

lib_dir = r"D:\MediaHive App\mediahive_mobile\lib"
# Matches import '...'; or import "..."; preserving the rest of the line
import_pattern = re.compile(r"^(\s*import\s+['\"])(\.\.?/[^'\"]+)(['\"])(.*)$")

def refactor_file(filepath):
    dirpath = os.path.dirname(filepath)
    changed = False
    new_lines = []
    
    with open(filepath, "r", encoding="utf-8") as f:
        lines = f.readlines()
        
    for line_idx, line in enumerate(lines, 1):
        # Remove trailing newline for regex matching, then put it back
        line_stripped = line.rstrip('\r\n')
        match = import_pattern.match(line_stripped)
        if match:
            prefix = match.group(1)
            rel_path = match.group(2)
            suffix = match.group(3)
            trailing = match.group(4)
            
            # Resolve the relative path to an absolute path, then get path relative to lib/
            abs_imported_path = os.path.normpath(os.path.join(dirpath, rel_path))
            
            # Make sure it is inside lib_dir
            if abs_imported_path.startswith(lib_dir):
                # Path relative to lib_dir (using forward slashes)
                rel_to_lib = os.path.relpath(abs_imported_path, lib_dir).replace(os.sep, "/")
                package_import = f"package:mediahive_mobile/{rel_to_lib}"
                new_line = f"{prefix}{package_import}{suffix}{trailing}\n"
                if new_line != line:
                    new_lines.append(new_line)
                    changed = True
                    continue
        new_lines.append(line)
        
    if changed:
        with open(filepath, "w", encoding="utf-8") as f:
            f.writelines(new_lines)
        return True
    return False

refactored_count = 0
for root, dirs, files in os.walk(lib_dir):
    for file in files:
        if file.endswith(".dart"):
            filepath = os.path.join(root, file)
            if refactor_file(filepath):
                refactored_count += 1
                print(f"Refactored: {os.path.relpath(filepath, lib_dir)}")

print(f"Total files refactored: {refactored_count}")
