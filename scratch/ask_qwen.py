import urllib.request
import json
import sys

prompt = """
We are building a mobile-first field work and task tracking app (MediaHive) with offline capabilities.
We currently have a 'Sync Conflict Detected' global banner on the dashboard. When an offline sync conflict happens (e.g. user modifies a task offline, and it was also modified on the server during that time), the sync halts, the task enters a 'conflict' state, and the user must tap the dashboard banner to open a sheet. In this sheet, they see a side-by-side diff (Local vs. Server) and must manually select 'Keep Server' or 'Keep Local'.

The user has proposed:
"Do we really need the 'Conflict Detected banner'? Let the task sync to the latest change when the app gets online. Just give a banner inside the task page saying, 'x task got updated when you were offline'. How about this? This offline banner thing looks no good to me."

What is your professional design and architectural opinion on this?
Compare:
1. The current developer-oriented "Git-style" explicit conflict resolution UI (blocking banner + manual sheet).
2. The user's proposed approach: silent auto-resolution (e.g., field-level last-write-wins or server-wins) combined with an inline notification/alert banner inside the Task Details page when a change was updated/overwritten.

Provide a clear, structured recommendation.
"""

url = "http://localhost:11434/api/generate"
data = {
    "model": "qwen2.5-coder:latest",
    "prompt": prompt,
    "stream": False
}

req = urllib.request.Request(
    url, 
    data=json.dumps(data).encode("utf-8"), 
    headers={"Content-Type": "application/json"}
)

print("Sending request to Ollama (model: qwen2.5-coder:latest)...")
try:
    with urllib.request.urlopen(req, timeout=180) as response:
        res = json.loads(response.read().decode("utf-8"))
        print("\n=== QWEN RESPONSE ===")
        print(res.get("response", ""))
except Exception as e:
    print(f"Error calling Ollama: {e}", file=sys.stderr)
