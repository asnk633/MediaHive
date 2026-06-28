import os
import re
import glob

def find_active_brain_dir():
    # Base folder for Antigravity conversation data
    base_dir = r"C:\Users\Shukoor Rahman\.gemini\antigravity\brain"
    if not os.path.exists(base_dir):
        return None
        
    # Get all subfolders (each folder is a conversation ID)
    folders = [os.path.join(base_dir, d) for d in os.listdir(base_dir) if os.path.isdir(os.path.join(base_dir, d))]
    if not folders:
        return None
        
    # Sort folders by last modified time to get the active one
    folders.sort(key=lambda x: os.path.getmtime(x), reverse=True)
    return folders[0]

def parse_markdown_tasks(file_path):
    if not os.path.exists(file_path):
        return []
        
    tasks = []
    with open(file_path, "r", encoding="utf-8") as f:
        for line in f:
            match = re.match(r"^\s*-\s*\[([ xX/])\]\s*(.*)$", line)
            if match:
                status_char = match.group(1).lower()
                status = "completed" if status_char == "x" else ("in_progress" if status_char == "/" else "pending")
                text = match.group(2).strip()
                tasks.append({"status": status, "text": text})
    return tasks

def scan_workspace_for_terms(terms):
    # Scan the workspace directory for files matching terms
    found_matches = {}
    extensions = ("*.dart", "*.py", "*.js", "*.ts", "*.json", "*.html", "*.css")
    
    # We will search the active subdirectories recursively
    search_dirs = [".", "./mediahive_mobile"]
    
    for term in terms:
        found_matches[term] = []
        clean_term = re.sub(r"[^\w\s_]", "", term).strip()
        if not clean_term or len(clean_term) < 3:
            continue
            
        # Search files
        words = clean_term.split()
        keyword = words[0] if words else ""
        if not keyword or len(keyword) < 3:
            continue
            
        for s_dir in search_dirs:
            if not os.path.exists(s_dir):
                continue
            for ext in extensions:
                for filepath in glob.glob(os.path.join(s_dir, "**", ext), recursive=True):
                    # Avoid node_modules, build, etc.
                    if any(x in filepath for x in ["node_modules", "build", ".dart_tool", "android", "ios", "gradle"]):
                        continue
                    try:
                        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                            for i, line in enumerate(f, 1):
                                if keyword.lower() in line.lower():
                                    found_matches[term].append(f"{os.path.basename(filepath)}:{i}")
                                    if len(found_matches[term]) >= 3: # Cap at 3 references
                                        break
                    except Exception:
                        pass
                    if len(found_matches[term]) >= 3:
                        break
                if len(found_matches[term]) >= 3:
                    break
    return found_matches

def run_audit():
    brain_dir = find_active_brain_dir()
    if not brain_dir:
        print("[-] Active conversation folder not found in Antigravity app data.")
        return
        
    print("==================================================")
    print("      ANTIGRAVITY TASK VERIFICATION & AUDIT      ")
    print(f"Active Conversation: {os.path.basename(brain_dir)}")
    print("==================================================")
    
    # Search for task files in both conversation brain and project workspace root
    task_files = ["task.md", "implementation_plan.md", "todo.md", "TODO.md", "tasks.md"]
    tasks = []
    source_file = None
    
    # Try active conversation directory first
    if brain_dir:
        for tf in task_files:
            path = os.path.join(brain_dir, tf)
            if os.path.exists(path):
                tasks = parse_markdown_tasks(path)
                source_file = f"brain/{tf}"
                break
                
    # Fallback to current workspace directories
    if not tasks:
        search_dirs = [".", "./mediahive_mobile"]
        for s_dir in search_dirs:
            if not os.path.exists(s_dir):
                continue
            for tf in task_files:
                path = os.path.join(s_dir, tf)
                if os.path.exists(path):
                    tasks = parse_markdown_tasks(path)
                    source_file = f"{s_dir}/{tf}"
                    break
            if tasks:
                break
            
    if not tasks:
        print("[-] No tasks found. Please create a task.md, todo.md, or implementation_plan.md in the active workspace or planning mode.")
        return
        
    print(f"Found {len(tasks)} tasks in {source_file}.\n")
    
    completed_tasks = [t for t in tasks if t["status"] == "completed"]
    pending_tasks = [t for t in tasks if t["status"] == "pending"]
    in_progress_tasks = [t for t in tasks if t["status"] == "in_progress"]
    
    print(f"Summary: {len(completed_tasks)} Completed | {len(in_progress_tasks)} In Progress | {len(pending_tasks)} Pending")
    print("--------------------------------------------------")
    
    # We will search the codebase for references to the completed tasks
    terms_to_search = [t["text"] for t in completed_tasks]
    matches = scan_workspace_for_terms(terms_to_search)
    
    verified_count = 0
    print("\nAuditing Completed Tasks:")
    for task in completed_tasks:
        text = task["text"]
        matched_locations = matches.get(text, [])
        if matched_locations:
            print(f"  [VERIFIED] {text}")
            print(f"    Code references: {', '.join(matched_locations)}")
            verified_count += 1
        else:
            # Let's check if there is an exact filename referenced in the text that exists
            file_match = re.search(r"[`']?([\w\-]+\.\w+)[`']?", text)
            if file_match:
                filename = file_match.group(1)
                # Check if file exists anywhere in workspace
                found_files = []
                for root, dirs, files in os.walk("."):
                    if any(x in root for x in ["node_modules", "build", ".dart_tool", "android", "ios", "gradle"]):
                        continue
                    if filename in files:
                        found_files.append(os.path.join(root, filename))
                if found_files:
                    print(f"  [VERIFIED] {text}")
                    print(f"    File exists: {found_files[0]}")
                    verified_count += 1
                    continue
            
            print(f"  [UNVERIFIED] {text} (No specific code keywords or files found in workspace)")
            
    if pending_tasks:
        print("\nPending Tasks Checklist:")
        for task in pending_tasks:
            print(f"  [ ] {task['text']}")
            
    # Calculate score
    total_completed = len(completed_tasks)
    score = (verified_count / total_completed * 100) if total_completed > 0 else 0.0
    print("\n==================================================")
    print(f"AUDIT SCORE: {score:.1f}% Verification rate ({verified_count}/{total_completed} verified)")
    print("==================================================")

if __name__ == "__main__":
    run_audit()
