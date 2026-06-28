import os
import re

def main():
    lib_path = r"D:\MediaHive App\mediahive_mobile\lib"
    print_pattern = re.compile(r'(?<!debug)print\(')
    import_pattern = re.compile(r"import\s+['\"]package:flutter/foundation.dart['\"]")
    
    modified_files = 0
    total_replacements = 0
    
    for root, dirs, files in os.walk(lib_path):
        for file in files:
            if not file.endswith('.dart'):
                continue
            
            file_path = os.path.join(root, file)
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
            except Exception as e:
                # Handle potential encoding issues
                try:
                    with open(file_path, 'r', encoding='latin-1') as f:
                        content = f.read()
                except Exception as e2:
                    print(f"Skipping {file_path} due to read error: {e2}")
                    continue
            
            if print_pattern.search(content):
                # We need to replace print( with debugPrint(
                new_content = print_pattern.sub('debugPrint(', content)
                replacements = len(print_pattern.findall(content))
                
                # Check if import 'package:flutter/foundation.dart'; is already present
                if not import_pattern.search(new_content):
                    # Find a good place to insert the import
                    # Usually after the first import, or at the top of the file
                    first_import_idx = new_content.find("import ")
                    if first_import_idx != -1:
                        new_content = (
                            new_content[:first_import_idx]
                            + "import 'package:flutter/foundation.dart';\n"
                            + new_content[first_import_idx:]
                        )
                    else:
                        new_content = "import 'package:flutter/foundation.dart';\n" + new_content
                
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                
                print(f"Modified: {file_path} ({replacements} replacements)")
                modified_files += 1
                total_replacements += replacements
                
    print(f"\nDone! Modified {modified_files} files, with {total_replacements} print statements replaced.")

if __name__ == '__main__':
    main()
