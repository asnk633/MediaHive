"""
analyze_domain_conflicts.py
Find the most critical case-variant conflicts: domain enum values
(priorities, statuses, conditions) that need fixing.
"""
import json
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).resolve().parent.parent

report = json.loads((ROOT / ".tmp/case_duplicates_report.json").read_text(encoding="utf-8"))

DOMAIN_WORDS = {
    "urgent", "high", "medium", "low", "critical",
    "todo", "pending", "done", "review", "overdue", "cancelled",
    "damaged", "good", "fair", "poor",
    "connected", "disconnected", "connecting",
    "approved", "rejected", "returned", "issued",
    "sick", "annual", "unpaid", "casual",
    "sign",
}

print("=== DOMAIN ENUM CASE CONFLICTS ===\n")
found = []
for entry in report["duplicates"]:
    norm = entry["normalized"]
    if norm not in DOMAIN_WORDS:
        continue
    variants = entry["variants"]
    found.append(entry)
    print(f"[{norm}] — {entry['variant_count']} variants:")
    for v, files in variants.items():
        print(f'  "{v}" in:')
        for f in files[:4]:
            print(f"    - {f}")
        if len(files) > 4:
            print(f"    ... +{len(files)-4} more")
    print()

print(f"Total domain conflicts: {len(found)}")

# Write focused report
(ROOT / ".tmp" / "domain_conflicts.json").write_text(
    json.dumps({"conflicts": found}, indent=2, ensure_ascii=False), encoding="utf-8"
)
print("Written: .tmp/domain_conflicts.json")
