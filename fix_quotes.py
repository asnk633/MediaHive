import os

directory = r'd:\MediaHive App\src'

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith(('.ts', '.tsx')):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if r"\'manager\'" in content or r"\'member\'" in content:
                new_content = content.replace(r"\'manager\'", "'manager'").replace(r"\'member\'", "'member'")
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print('Fixed', filepath)
