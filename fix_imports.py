import os
import re

api_dir = r"src\app\api"
added = 0

for root, dirs, files in os.walk(api_dir):
    for fname in files:
        if fname == "route.ts":
            fpath = os.path.join(root, fname)
            try:
                with open(fpath, encoding="utf-8", errors="replace") as f:
                    content = f.read()
            except Exception as e:
                print(f"Skip {fpath}: {e}")
                continue

            uses_next = "NextRequest" in content or "NextResponse" in content
            has_import = bool(re.search(r"import\s*\{[^}]*Next(?:Request|Response)[^}]*\}\s*from\s*['\"]next/server['\"]", content))

            if uses_next and not has_import:
                new_content = "import { NextRequest, NextResponse } from 'next/server';\n" + content
                with open(fpath, "w", encoding="utf-8") as f:
                    f.write(new_content)
                print(f"Fixed: {fpath}")
                added += 1

print(f"\nTotal files fixed: {added}")
