import subprocess

def check_stash(stash_id):
    try:
        result = subprocess.run(
            ['git', 'stash', 'show', '--name-only', stash_id],
            capture_output=True,
            text=True,
            check=True
        )
        if 'logo-sequence' in result.stdout:
            print(f"Match found in {stash_id}:")
            print(result.stdout)
            return True
    except Exception as e:
        print(f"Error checking {stash_id}: {e}")
    return False

print("Searching stashes...")
matched = False
for i in range(10):
    stash_id = f"stash@{{{i}}}"
    if check_stash(stash_id):
        matched = True

if not matched:
    print("No stashes contain logo-sequence files.")
