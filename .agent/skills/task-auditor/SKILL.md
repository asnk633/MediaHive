---
name: task-auditor
description: Automates task verification and checklist auditing across any Antigravity conversation and workspace.
---

# Antigravity Task Auditor & Validator

This skill provides a unified mechanism to audit work checklists, verify that checklist items marked completed (`- [x]`) are actually implemented in code, and scoring task completion.

## When to use this skill
- Before ending a turn or finishing a ticket, to double-check that no requirements were missed.
- To audit the current workspace against `task.md` or `implementation_plan.md` tasks.

## How it works
Run the automated auditor script:
```bash
python "d:\MediaHive App\.agent\skills\task-auditor\task_auditor.py"
```

The tool will:
1. Auto-discover the active conversation's app data directory (containing the active `task.md` or `implementation_plan.md`).
2. Read the checklist items.
3. Scan the workspace files or git index to cross-reference code changes and verify task execution.
4. Output a verified score and point out any discrepancies.
