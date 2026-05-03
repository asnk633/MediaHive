import os
import re

tables = ['tasks', 'events', 'campaigns', 'inventory', 'institutions', 'departments', 'comments', 'users', 'audit_logs', 'attachments']
# Search for .from('table') or .from("table")
pattern = re.compile(r'\.from\([\'\"](' + '|'.join(tables) + r')[\'\"]\)')

results = []

for root, dirs, files in os.walk('d:\\MediaHive App\\src'):
    if 'node_modules' in dirs: dirs.remove('node_modules')
    if '.next' in dirs: dirs.remove('.next')
    for file in files:
        if file.endswith(('.ts', '.tsx')):
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    matches = pattern.finditer(content)
                    for match in matches:
                        start = match.start()
                        # Look at context (approx 300 chars after)
                        context = content[start:start+400]
                        
                        # Check for withTenant or .eq('tenant_id' or 'tenantId'
                        safe = 'withTenant' in context or "'tenant_id'" in context or '"tenant_id"' in context or "'tenantId'" in context or '"tenantId"' in context
                        
                        # Special case for insert/update objects or where objects
                        if '.insert(' in context or '.update(' in context:
                            if 'tenant_id' in context or 'tenantId' in context:
                                safe = True
                        
                        # Check for verifyUser in the file
                        has_verify = 'verifyUser' in content
                        
                        if not safe:
                            line_no = content.count('\n', 0, start) + 1
                            results.append(f"{path}:{line_no} - {match.group(0)}\nContext: {context.replace('\n', ' ')[:200]}...\nVerifyUser in file: {has_verify}\n\n")
            except Exception as e:
                print(f"Error reading {path}: {e}")

with open('unsafe_queries.txt', 'w', encoding='utf-8') as f:
    f.writelines(results)
    if not results:
        f.write("No unsafe queries found with initial scan pattern.")
