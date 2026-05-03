import os, re
directory = r'd:\MediaHive App\src'
pattern = re.compile(r'([\w\.\?]+)\s*===\s*\'team\'')

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith(('.ts', '.tsx')):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if "=== 'team'" in content:
                new_content = pattern.sub(r'(\1 === \'manager\' || \1 === \'member\')', content)
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print('Patched', filepath)
