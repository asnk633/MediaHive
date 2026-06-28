---
name: verify-completion
description: "Use on every user request to list tasks, track sub-tasks, and verify all tasks are fully implemented and tested before declaring completion."
category: meta
risk: safe
source: local
date_added: "2026-06-09"
metadata:
  triggers:
    - multiple tasks
    - complete task
    - did you check
    - verify all tasks
    - missing task
---

# Verify Completion

Ensure that when a user asks for multiple changes or tasks, all tasks are listed, tracked, and verified before declaring completion.

## When to Use
- At the start of every user turn, especially when the user request contains multiple requirements, follow-ups, or sub-tasks.
- Before concluding a turn to verify that no requirements were skipped or missed.

## Detailed Instructions

### 1. The Intake Phase (Breakdown)
When receiving any message from the user:
1. Parse the request and extract all explicit and implicit requirements.
2. List them out as a numbered list of sub-tasks in your thought process.
3. If the request is complex, share this checklist with the user at the start of your response to confirm alignment.

### 2. The Execution Phase (Tracking)
1. Address each sub-task systematically.
2. Do not skip or omit any task in favor of another.
3. If a task cannot be completed due to constraints, explicitly explain why and propose an alternative rather than ignoring it.

### 3. The Verification Phase (Validation)
Before formulating your final response:
1. Re-read the user's original message.
2. Compare the user's requirements against your changes.
3. Verify each requirement:
   - Run tests, check syntax, or review the file edits to ensure the change actually works.
   - For UI changes, verify using specific CSS rules (like checking Tailwind scales, margins, widths, or borders).
4. Do not say "all done", "completed", or "solved" until every item on the checklist is fully verified.

### 4. The Output Phase (Checklist)
In your final response to the user, include a "Task Completion Checklist" showing the status of each requirement:
- `[x] Task 1: [Description] - Verified by [Verification Method]`
- `[x] Task 2: [Description] - Verified by [Verification Method]`

## Anti-Rationalization Rules
- **Do not assume**: Do not assume that a task is done just because a tool returned success. Double-check the file contents or run validation/linting commands.
- **Do not skip**: Never skip a secondary request (like "also fix the logo size") when focusing on a primary request (like "fix the margin"). All tasks are high priority.
- **Tailwind check**: Always check that any Tailwind class names used exist in standard scales, or use arbitrary values `-[value]` to avoid silent rendering failures.
