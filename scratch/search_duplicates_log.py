log_path = r"C:\Users\Shukoor Rahman\.gemini\antigravity\brain\83a118dd-2550-4948-abaa-bdc410def224\.system_generated\tasks\task-90.log"

import os
if os.path.exists(log_path):
    with open(log_path, "r") as fh:
        lines = fh.readlines()
        
    current_hash = ""
    group_lines = []
    
    for line in lines:
        if line.startswith("Hash:"):
            current_hash = line.strip()
            group_lines = []
        elif line.strip() == "":
            if any("mediahive_mobile" in l for l in group_lines):
                print(current_hash)
                for l in group_lines:
                    print(l.strip())
                print()
            group_lines = []
        else:
            group_lines.append(line)
else:
    print("Log not found")
